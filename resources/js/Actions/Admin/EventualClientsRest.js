import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import xsrfToken from "../../Utils/xsrfToken";

class EventualClientsRest extends BasicRest {
  path = 'admin/eventual-clients'

  orders = (clientId) => ({
    paginate: async (params) => {
      const res = await fetch(`/api/${this.path}/${clientId}/orders/paginate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Xsrf-Token': xsrfToken()
        },
        body: JSON.stringify(params)
      })

      return await res.json()
    }
  })

  lookupByDocument = async (documentType, documentNumber) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/document/${documentType}/${documentNumber}`)
      if (!status) throw new Error(result?.message || 'No se pudo consultar el documento')
      return result.data
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3500,
        richColors: true,
      });
      return null
    }
  }
}

export default EventualClientsRest
