import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isMagistralesPath } from "../../Utils/permissionScope";

class PurchaseOrdersRest extends BasicRest {
  path = isMagistralesPath() ? 'admin/magistrales/purchase-orders' : 'admin/purchase-orders'

  articlesPath = () => isMagistralesPath() ? 'admin/magistrales/articles' : 'admin/articles'

  suppliersPath = () => 'admin/suppliers'

  articlesPaginateApi = () => `/api/${this.articlesPath()}/paginate`

  suppliersPaginateApi = () => `/api/${this.suppliersPath()}/paginate`

  getBranchesByBusiness = async (businessId) => {
    if (!businessId) return []
    const result = await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)
    return result ?? []
  }

  // Aprobar / rechazar desde el listado, sin abrir el formulario completo.
  setApproval = async (id, approvalStatus) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ approval_status: approvalStatus }),
      })
      if (!status) throw new Error(result?.message || 'No se pudo actualizar la aprobacion')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result.data ?? true
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 4000, richColors: true })
      return null
    }
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
