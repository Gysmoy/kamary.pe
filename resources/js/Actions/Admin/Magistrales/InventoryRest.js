import MagistralesStage4Rest from "./Stage4Rest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class InventoryRest extends MagistralesStage4Rest {
  path = 'admin/magistrales/inventory'

  getStock = async (payload) => {
    try {
      const { status, result } = await Fetch('/api/admin/magistrales/inventory/stock', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      if (!status) throw new Error(result?.message || 'No se pudo calcular el stock')
      return Number(result.data?.stock ?? 0)
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      })
      return 0
    }
  }
}

export default InventoryRest
