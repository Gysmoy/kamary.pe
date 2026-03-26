import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class SuppliersRest extends BasicRest {
  path = 'admin/suppliers'

  lookupRuc = async (ruc) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/ruc/${ruc}`)
      if (!status) throw new Error(result?.message || 'No se pudo consultar el RUC')
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

export default SuppliersRest
