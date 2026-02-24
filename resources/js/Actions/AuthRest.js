import { Fetch } from "sode-extend-react"
import { toast } from "sonner"

class AuthRest {
  static login = async (request) => {
    try {

      const { status, result } = await Fetch('/api/login', {
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

  static signup = async (request) => {
    try {

      const { status, result } = await Fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al registrar el usuario')

      toast.success('Se registro el usuario correctamente')

      return result.data
    } catch (error) {
      toast.error(error.message)
      return null
    }
  }

  static verifyCode = async (request) => {
    try {

      const { status, result } = await Fetch('/api/verify-code', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al registrar el usuario')

      toast.success('Se registro el usuario correctamente')

      return result
    } catch (error) {
      toast.error(error.message)
      return null
    }
  }
}

export default AuthRest