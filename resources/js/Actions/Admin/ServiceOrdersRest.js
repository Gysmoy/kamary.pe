import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isStoragePath } from "../../Utils/permissionScope";

const loadAll = async (path) => {
  try {
    const { status, result } = await Fetch(path, {
      method: 'POST',
      body: JSON.stringify({ take: 1000, skip: 0, isLoadingAll: true })
    })
    if (!status) throw new Error(result?.message || 'No se pudo cargar la lista')
    return result?.data ?? []
  } catch (error) {
    toast.error('Error', { description: error.message, duration: 3000, richColors: true })
    return []
  }
}

class ServiceOrdersRest extends BasicRest {
  path = isStoragePath()
    ? 'admin/storage/general-service-orders'
    : 'admin/service-orders'

  getBranchesByBusiness = async (businessId) => businessId ? (await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)) ?? [] : []
  getBusinesses = async () => await loadAll('/api/admin/businesses/paginate')
  getClients = async () => await loadAll(isStoragePath() ? '/api/admin/storage/clients/paginate' : '/api/admin/clients/paginate')
  getServices = async () => await loadAll(isStoragePath() ? '/api/admin/storage/general-service/paginate' : '/api/admin/services/paginate')
}

export default ServiceOrdersRest
