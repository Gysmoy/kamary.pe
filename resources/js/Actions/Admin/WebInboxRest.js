import { Fetch } from "sode-extend-react"
import { toast } from "sonner"
import BasicRest from "../BasicRest"

// Rest comun de las bandejas web: paginate (heredado) + actualizacion de estado/notas.
class WebInboxRest extends BasicRest {
  // PATCH /api/{path}/{id}
  update = async (id, body) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      })
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      toast.success('Correcto', { description: 'Se guardaron los cambios', duration: 3000, richColors: true })
      return result.data ?? true
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  // Enlace de descarga del adjunto (requiere sesion y permiso)
  fileUrl = (id) => `/api/${this.path}/${id}/file`
}

export default WebInboxRest
