import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class OrdersRest extends BasicRest {
  path = 'admin/orders'

  getBranchesByBusiness = async (businessId) => {
    if (!businessId) return []
    const result = await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)
    return result ?? []
  }

  getCurrentStock = async (articleId, warehouseId) => {
    if (!articleId || !warehouseId) return { qty_in: 0, qty_out: 0, stock: 0 }
    try {
      const response = await fetch(`/api/admin/entry-notes/current-stock?article_id=${articleId}&warehouse_id=${warehouseId}`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      })
      const result = await response.json()
      if (!response.ok || !result?.status) throw new Error(result?.message || 'No se pudo obtener el stock actual')
      return result.data ?? { qty_in: 0, qty_out: 0, stock: 0 }
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return { qty_in: 0, qty_out: 0, stock: 0 }
    }
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
}

export default OrdersRest
