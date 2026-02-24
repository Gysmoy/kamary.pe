import { Fetch } from "sode-extend-react"
import { toast } from "sonner"

const Logout = async () => {
  try {
    const { status, result } = await Fetch('/api/logout', { method: 'DELETE' })
    if (!status) throw new Error(result?.message || 'Ocurrio un error al cerrar sesion')
    toast.success('Cierre de sesion exitoso', {
      description: 'Sera enviado a la pantalla de autenticacion',
    })
    location.reload()
  } catch (error) {
    toast.error('Error', {
      description: error.message,
    })
  }
}

export default Logout