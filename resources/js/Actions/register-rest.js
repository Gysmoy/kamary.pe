import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import BasicRest from "./BasicRest";

class RegisterRest extends BasicRest {
    send = async (request) => {
        try {
            const { status, result } = await Fetch('/api/register/send', {
                method: 'POST',
                body: JSON.stringify(request)
            })
            if (!status) throw new Error(result?.message || 'Error al iniciar sesion')
            toast.success('Se inicio sesion correctamente')

            return result
        } catch (error) {
            toast.error(error.message)
            return false
        }
    }

    verify = async (request) => {
        try {

            const { status, result } = await Fetch('/api/register/verify', {
                method: 'POST',
                body: JSON.stringify(request)
            })
            if (!status) throw new Error(result?.message || 'Error al iniciar sesion')

            toast.success('Se inicio sesion correctamente')

            return result
        } catch (error) {
            toast.error(error.message)
            return false
        }
    }

    register = (request) => this.simplePost('/api/register', request)
}

export default RegisterRest