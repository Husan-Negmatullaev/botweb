const tg = window.Telegram.WebApp;

export function useTelegram() {

    const onClose = () => {
        tg.close()
    }

    const onToggleButton = () => {

        if (!tg.MainButton.isVisible) {
            tg.MainButton.show();
        } else {
            tg.MainButton.hide();
        }
    }

    return {
        onToggleButton,
        onClose,
        tg,
        user: tg.initDataUnsafe?.user,
        queryId: tg.initDataUnsafe?.query_id
    }
}
