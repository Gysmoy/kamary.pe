import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isMagistralesPath } from "../../Utils/permissionScope";

class PurchaseOrdersRest extends BasicRest {
  path = isMagistralesPath() ? 'admin/magistrales/purchase-orders' : 'admin/purchase-orders'

  articlesPath = () => isMagistralesPath() ? 'admin/magistrales/articles' : 'admin/articles'

  suppliersPath = () => isMagistralesPath() ? 'admin/magistrales/suppliers' : 'admin/suppliers'

  articlesPaginateApi = () => `/api/${this.articlesPath()}/paginate`

  suppliersPaginateApi = () => `/api/${this.suppliersPath()}/paginate`

  getBranchesByBusiness = async (businessId) => {
    if (!businessId) return []
    const result = await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)
    return result ?? []
  }

  getArticleById = async (articleId) => {
    if (!articleId) return null
    try {
      const { status, result } = await Fetch(this.articlesPaginateApi(), {
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

export default PurchaseOrdersRest
