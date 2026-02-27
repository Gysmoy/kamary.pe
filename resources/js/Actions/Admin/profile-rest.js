import { Fetch } from "sode-extend-react"
import BasicRest from "../BasicRest"
import { toast } from "sonner"

class ProfileRest extends BasicRest {
  path = 'admin/profile'
  save = async (request) => {
    try {
      const { status, result } = await Fetch('/api/admin/profile', {
        method: 'PATCH',
        body: JSON.stringify(request)
      })

      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

      toast.success('Correcto', { description: result.message })
      return true
    } catch (error) {
      toast.error('Error', { description: error.message })
      return false
    }
  }
}

export default ProfileRest