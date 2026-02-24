import { Fetch, Notify } from "sode-extend-react";
import BasicRest from "../BasicRest";

class WhatsAppRest extends BasicRest {
  path = 'whatsapp'

  verify = async (session) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}${session ? `?session=${session}` : ''}`)
      // if (!status) throw new Error(result?.message ?? 'Ocurrio un error al verificar la sesion')
      return { status: result.status, data: result.data } ?? true
    } catch (error) {
      console.error(error.message)
      return { status: 400, data: null }
    }
  }
}

export default WhatsAppRest