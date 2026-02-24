import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import BasicRest from "./BasicRest";

class AuthRest extends BasicRest {
    logout = async () => {
        try {
            const { status, result } = await Fetch('/api/logout', { method: 'DELETE' })
            if (!status) throw new Error(result?.message || 'Ocurrio un error al cerrar sesion')
            toast.success('Cierre de sesion exitoso', {
                description: 'Sera enviado a la pantalla de autenticacion',
                // // icon: '/images/icon.png',
            })
            location.reload()
        } catch (error) {
            toast.error('Error', {
                description: error.message,
                // // icon: '/images/icon.png',
            })
        }
    }
}

export default AuthRest