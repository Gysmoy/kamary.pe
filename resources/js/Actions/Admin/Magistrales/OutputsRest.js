import MagistralesStage4Rest from "./Stage4Rest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class OutputsRest extends MagistralesStage4Rest {
  path = 'admin/magistrales/outputs'

  availableStock = async ({ q = '', output_id = '', warehouse_id = '' } = {}) => {
    try {
      const query = new URLSearchParams()
      if (`${q}`.trim()) query.set('q', `${q}`.trim())
      if (`${output_id}`.trim()) query.set('output_id', `${output_id}`.trim())
      if (`${warehouse_id}`.trim()) query.set('warehouse_id', `${warehouse_id}`.trim())

      const { status, result } = await Fetch(`/api/${this.path}/available-stock?${query.toString()}`)
      if (!status) throw new Error(result?.message || 'No se pudo cargar el stock disponible')
      return result.data ?? []
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      })
      return []
    }
  }
}

export default OutputsRest
