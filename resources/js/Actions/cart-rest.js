import { Cookies, Fetch } from "sode-extend-react";

class CartRest {
    verify = async (items) => {
        try {

            const { status, result } = await Fetch('/api/cart/verify', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
                },
                body: JSON.stringify(items)
            })
            if (!status) throw new Error(result?.message || 'Error al iniciar sesion')
            return result?.data ?? []
        } catch (error) {
            return []
        }
    }
}

export default CartRest