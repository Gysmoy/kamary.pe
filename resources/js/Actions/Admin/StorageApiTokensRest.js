import BasicRest from '../BasicRest'
import { Fetch } from 'sode-extend-react'
import { toast } from 'sonner'

class StorageApiTokensRest extends BasicRest {
  path = 'admin/storage/api-tokens'

  reveal = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/reveal`)
      if (!status) throw new Error(result?.message || 'No se pudo visualizar el token')
      return result.data
    } catch (error) {
      toast.error('Error', {
        description: error.message,
        duration: 3500,
        richColors: true,
      })
      return null
    }
  }

  renew = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/renew`, {
        method: 'POST',
        body: JSON.stringify({})
      })
      if (!status) throw new Error(result?.message || 'No se pudo renovar el token')

      toast.success('Correcto', {
        description: result.message,
        duration: 3000,
        richColors: true,
      })

      return result.data
    } catch (error) {
      toast.error('Error', {
        description: error.message,
        duration: 3500,
        richColors: true,
      })
      return null
    }
  }
}

export default StorageApiTokensRest
