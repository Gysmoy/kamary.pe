import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class CommercialOrdersRest extends BasicRest {
  path = 'admin/commercial-orders'

  getBranchesByBusiness = async (businessId) => {
    if (!businessId) return []
    const result = await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)
    return result ?? []
  }

  getDistributionNetworks = async (clientId) => {
    if (!clientId) return []
    const result = await this.simpleGet(`/api/${this.path}/clients/${clientId}/distribution-networks`)
    return result ?? []
  }

  getDeliveryAddresses = async (networkId) => {
    if (!networkId) return []
    const result = await this.simpleGet(`/api/${this.path}/distribution-networks/${networkId}/addresses`)
    return result ?? []
  }

  resolvePrice = async (params) => {
    try {
      const search = new URLSearchParams()
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        search.append(key, value)
      })

      const { status, result } = await Fetch(`/api/${this.path}/pricing/resolve?${search.toString()}`)
      if (!status) throw new Error(result?.message || 'No se pudo resolver el precio')
      return result?.data ?? null
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return null
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

export default CommercialOrdersRest
