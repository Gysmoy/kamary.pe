import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isStoragePath } from "../../Utils/permissionScope";

const loadAll = async (path, body = {}) => {
  try {
    const { status, result } = await Fetch(path, {
      method: 'POST',
      body: JSON.stringify({ take: 1000, skip: 0, isLoadingAll: true, ...body })
    })
    if (!status) throw new Error(result?.message || 'No se pudo cargar la lista')
    return result?.data ?? []
  } catch (error) {
    toast.error('Error', { description: error.message, duration: 3000, richColors: true })
    return []
  }
}

const isStorageGeneralOrdersPath = () => location.pathname.includes('/admin/storage-general-service-orders')
const isStorageServiceOrdersPath = () => location.pathname.includes('/admin/storage-service-orders')

class ServiceOrdersRest extends BasicRest {
  path = isStoragePath()
    ? (isStorageGeneralOrdersPath() ? 'admin/storage/general-service-orders' : 'admin/storage/service-orders')
    : 'admin/service-orders'
  deleted = false

  async paginate(params) {
    return await super.paginate({ ...params, deleted: this.deleted })
  }

  getBranchesByBusiness = async (businessId) => businessId ? (await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)) ?? [] : []
  getBusinesses = async () => await loadAll('/api/admin/businesses/paginate')
  getClients = async () => await loadAll(isStoragePath() ? '/api/admin/storage/clients/paginate' : '/api/admin/services-client/paginate')
  getServices = async () => await loadAll(
    isStoragePath() ? '/api/admin/storage/general-service/paginate' : '/api/admin/services/paginate',
    isStorageServiceOrdersPath() ? { storage_service_types: true } : {}
  )
  getStorageOptions = async () => isStoragePath() ? await this.simpleGet('/api/admin/storage/kardex/options') : null
  getStorageWarehouses = async () => isStoragePath()
    ? await loadAll('/api/admin/storage/kardex/paginate', { section: 'warehouses', sort: [{ selector: 'warehouse_name', desc: false }] })
    : []
  getStorageLocations = async () => isStoragePath()
    ? await loadAll('/api/admin/storage/kardex/paginate', { section: 'locations' })
    : []
}

export default ServiceOrdersRest
