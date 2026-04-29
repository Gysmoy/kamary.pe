import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class PurchaseReceiptsRest extends BasicRest {
  path = 'admin/purchase-receipts'
  hasFiles = true

  getBranchesByBusiness = async (businessId) => {
    if (!businessId) return []
    const result = await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)
    return result ?? []
  }

  getArticleById = async (articleId) => {
    if (!articleId) return null
    try {
      const { status, result } = await Fetch('/api/admin/articles/paginate', {
        method: 'POST',
        body: JSON.stringify({
          take: 1,
          skip: 0,
          filter: ['id', '=', Number(articleId)]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudo obtener el articulo')
      return (result?.data ?? [])[0] ?? null
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return null
    }
  }

  getPurchaseOrderById = async (purchaseOrderId) => {
    if (!purchaseOrderId) return null
    try {
      const { status, result } = await Fetch('/api/admin/purchase-orders/paginate', {
        method: 'POST',
        body: JSON.stringify({
          take: 1,
          skip: 0,
          filter: ['id', '=', Number(purchaseOrderId)]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudo obtener la orden de compra')
      return (result?.data ?? [])[0] ?? null
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

export default PurchaseReceiptsRest
