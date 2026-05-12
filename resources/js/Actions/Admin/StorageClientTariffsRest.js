import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class StorageClientTariffsRest extends BasicRest {
  path = 'admin/storage/client-tariffs'

  getByClient = async (clientId) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/client/${clientId}`)
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return result.data ?? null
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      })
      return null
    }
  }
}

export default StorageClientTariffsRest
