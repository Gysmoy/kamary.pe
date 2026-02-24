import { Fetch } from "sode-extend-react"
import { toast } from "sonner"

class ProfileRest {
  static save = async (request) => {
    try {
      const { status, result } = await Fetch('/api/customer/profile', {
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

export default ProfileRest