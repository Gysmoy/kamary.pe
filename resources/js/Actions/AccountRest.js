import { Fetch } from "sode-extend-react"
import { toast } from "sonner"

class AccountRest {
  static email = async (request) => {
    try {
      const { status, result } = await Fetch('/api/account/email', {
        method: 'PATCH',
        body: JSON.stringify(request)
      })

      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

      toast.success(result.message)
      return true
    } catch (error) {
      toast.error(error.message)
      return false
    }
  }

  static password = async (request) => {
    try {
      const { status, result } = await Fetch('/api/account/password', {
        method: 'PATCH',
        body: JSON.stringify(request)
      })

      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

      toast.success(result.message)
      return true
    } catch (error) {
      toast.error(error.message)
      return false
    }
  }
}

export default AccountRest