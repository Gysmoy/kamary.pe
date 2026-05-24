import { Fetch } from "sode-extend-react";
import xsrfToken from "../Utils/xsrfToken";

class CartRest {
    verify = async (items) => {
        try {

            const { status, result } = await Fetch('/api/cart/verify', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Xsrf-Token': xsrfToken()
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
