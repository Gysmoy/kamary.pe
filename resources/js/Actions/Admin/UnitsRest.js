import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isMagistralesPath, isStoragePath } from "../../Utils/permissionScope";

class UnitsRest extends BasicRest {
  path = isMagistralesPath()
    ? 'admin/magistrales/units'
    : (isStoragePath() ? 'admin/storage/units' : 'admin/units')

  importRows = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/import`, {
        method: 'POST',
        body: JSON.stringify(request)
      })

      if (!status) throw new Error(result?.message || 'Error al importar registros')

      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      });

      return result.data
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return null
    }
  }
}

export default UnitsRest
