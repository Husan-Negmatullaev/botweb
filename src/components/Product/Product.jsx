import React, {useCallback, useEffect, useState} from 'react';
import {useTelegram} from "../../hooks/useTelegram";
import _ from "lodash";
import axios from "axios";
import {Dna} from 'react-loader-spinner';
import parse from "html-react-parser"

const getTotalPrice = (items) => {
    return items.reduce((acc, item) => {
        return acc += item?.price * item?.count
    }, 0)
}

const ProductList = () => {

    const [show, setShow] = useState(true)
    const [isOrder, setIsOrder] = useState(null)

    const [products, setProducts] = useState([])
    const [basket, setBasket] = useState([])
    const {tg, queryId, user} = useTelegram()

    const getProducts = () => {
        axios.get(`${process.env.REACT_APP_API_URL}/products`).then((res) => {
            setProducts(res?.data ?? [])
        })
    }

    const getBasket = () => {

        if(!user?.id) {
            return alert('Как вы сюда попали?')
        }

        axios.post(`${process.env.REACT_APP_API_URL}/basket`, {
            user_id: user?.id// ?? 542918091
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
        }).then((res) => {
            const items = []

            if (products?.length > 0) {
                res?.data?.map((item) => {
                    const product = _.find(products, {id: _.toInteger(item?.product_id)})
                    items.push({
                        product_id: _.toInteger(item?.product_id),
                        count: _.toInteger(item?.count),
                        price: _.toInteger(product?.price),
                        name: product?.name,
                        photo: product?.photo,
                    })
                })

                setBasket(items)
                setIsOrder(items?.length > 0)
                setShow(false)
            }

        })
    }

    const onChange = (e, product, type) => {

        const alreadyAdded = basket.find(item => item.product_id === product?.id)
        let items = [];

        if (alreadyAdded) {

            if (type === 'minus' && alreadyAdded?.count === 1) {
                items = basket.filter(item => item?.product_id !== product?.id)
            } else if (type === 'minus' && alreadyAdded?.count > 0) {

                items = basket.filter(item => {

                    if (item?.product_id === product?.id) {
                        item.count -= 1
                    }

                    return item
                })

            } else if (type === 'plus') {
                items = basket.filter(item => {

                    if (item?.product_id === product?.id) {
                        item.count += 1
                    }

                    return item
                })
            }

        } else {
            items = [...basket, {
                product_id: product?.id,
                count: 1,
                price: product?.price,
                name: product?.name,
                photo: product?.photo,
            }]
        }

        setBasket(items)

        if (items.length === 0) {
            tg.MainButton.hide()
        } else {
            tg.MainButton.show()
        }

    }

    useEffect(() => {
        getProducts()
    }, [])

    useEffect(() => {
        getBasket()
    }, [products])

    useEffect(() => {
        // tg.BackButton.show()

        if (basket.length === 0) {
            tg.MainButton.hide()
        } else {
            tg.MainButton.show()
        }

    }, [basket])

    const onShowBasket = useCallback(() => {
        setIsOrder(true)
    }, [])

    const onSendData = useCallback(() => {

        const data = {
            queryId,
            basket,
            userId: user?.id,
            totalPrice: _.toInteger(getTotalPrice(basket))
        }
        axios.post(process.env.REACT_APP_API_URL + '/web-data', data, {
            headers: {
                'Content-Type': 'application/json'
            },
        }).finally(() => {
            tg.close()
        })

    }, [basket])

    const onEditClick = () => {
        setIsOrder(false)
    }

    useEffect(() => {
        if (isOrder) {

            const price = (getTotalPrice(basket)).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            tg.MainButton.setParams({
                text: `🧾 Оформить заказ ${price} руб`,
            })

            tg.onEvent('mainButtonClicked', onSendData)
            return () => {
                tg.offEvent('mainButtonClicked', onSendData)
            }

        } else {

            tg.MainButton.setParams({
                text: 'Посмотреть заказ',
            })

            tg.onEvent('mainButtonClicked', onShowBasket)

            return () => {
                tg.offEvent('mainButtonClicked', onShowBasket)
            }
        }

    }, [isOrder])

    return (
        <>
            <span style={{ display: 'flex', justifyContent: 'center'}}>
                <Dna
                    visible={show}
                    height="80"
                    width="80"
                    ariaLabel="dna-loading"
                    wrapperClass="dna-wrapper"
                />
            </span>
            {isOrder &&
                <section className="cafe-page cafe-order-overview">
                <div className="cafe-block">
                    <div className="cafe-order-header-wrap">
                        <h2 className="cafe-order-header">Ваш заказ</h2>
                        <span className="cafe-order-edit" onClick={onEditClick}>Изменить</span>
                    </div>
                    <div className="cafe-order-items">
                        {
                            basket?.map((item, key) => {
                                return (
                                    <div className="cafe-order-item" data-item-id={key} key={key}>
                                        <div className="cafe-order-item-photo">
                                            <picture className="cafe-item-lottie js-item-lottie">
                                                <img src={`${process.env.REACT_APP_API_URL}/product-image/` + item?.photo} alt={item?.name}/>
                                            </picture>
                                        </div>
                                        <div className="cafe-order-item-label">
                                            <div className="cafe-order-item-title">
                                                {parse(item?.name)}
                                                <span className="cafe-order-item-counter">
                                                <span className="js-order-item-counter"> {item?.count} </span>x</span>
                                            </div>
                                        </div>
                                        <div className="cafe-order-item-price js-order-item-price">
                                            {item?.price} руб
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </section> ||
                <section className="cafe-page cafe-items">
                { !show > 0 && products?.map(product => {
                    const inBasket = _.find(basket, {product_id: product?.id})
                    return (
                        <div className="cafe-item" data-item-id={product?.id} data-item-price={product?.price} key={product?.id}>
                            { inBasket?.product_id === product?.id &&
                                <div className="cafe-item-counter" style={{animationName: 'badge-show'}}>
                                    {inBasket?.count}
                                </div>
                            }
                            <div className="cafe-item-photo">
                                <picture className="cafe-item-lottie js-item-lottie">
                                    <img src={`${process.env.REACT_APP_API_URL}/product-image/` + product?.photo} alt={product?.name}/>
                                </picture>
                            </div>
                            <div className="cafe-item-label">
                                <span className="cafe-item-title">{parse(product?.name)}</span>
                            </div>
                            <div className="cafe-item-label-price">
                                <span className="cafe-item-price">{product?.price} руб</span>
                            </div>
                            <div className="cafe-item-buttons">
                                {
                                    inBasket?.product_id !== product?.id &&
                                    <button onClick={(e) => onChange(e, product, 'add')} value={inBasket?.count}
                                            className="cafe-item-add-button">
                                        Добавить
                                    </button> || <>
                                        <button onClick={(e) => onChange(e, product, 'minus')} value={inBasket?.count}
                                                className="cafe-item-decr-button">
                                        </button>
                                        <button onClick={(e) => onChange(e, product, 'plus')} value={inBasket?.count}
                                                className='cafe-item-incr-button'>
                                        </button>
                                    </>
                                }
                            </div>
                        </div>
                    )
                }) }
            </section>
            }
        </>
    );
};

export default ProductList;
