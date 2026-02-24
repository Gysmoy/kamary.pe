import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import BasicRest from "./BasicRest";

class LoginRest extends BasicRest {
    login = async (request) => {
        try {

            const { status, result } = await Fetch('/api/login', {
                method: 'POST',
                body: JSON.stringify(request)
            })
            if (!status) throw new Error(result?.message || 'Error al iniciar sesion')

            toast.success('Operación correcta', {
                description: 'Se inicio sesion correctamente'
            })

            return result
        } catch (error) {
            toast.error('Error de autenticación', {
                description: error.message,
                descriptionClassName: 'line-clamp-3'
            })
            return false
        }
    }
}

export default LoginRest