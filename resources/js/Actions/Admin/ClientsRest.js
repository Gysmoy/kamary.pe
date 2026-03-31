import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class ClientsRest extends BasicRest {
  path = 'admin/clients'

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

export default ClientsRest
