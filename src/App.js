import './App.css';
import React, {useEffect} from "react";
import {useTelegram} from "./hooks/useTelegram";
import {Route, Routes} from "react-router-dom";
import Product from "./components/Product/Product";

function App() {
    const {tg} = useTelegram()

    useEffect(() => {
        tg.ready();
    })

    return (
        <div className="App">
            <Routes>
                <Route index element={<Product/>}/>
            </Routes>
        </div>
    );
}

export default App;
