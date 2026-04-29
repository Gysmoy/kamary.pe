import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

const loadAll = async (path, filter = null) => {
  try {
    const { status, result } = await Fetch(path, {
      method: 'POST',
      body: JSON.stringify({ take: 1000, skip: 0, isLoadingAll: true, ...(filter ? { filter } : {}) })
    })
    if (!status) throw new Error(result?.message || 'No se pudo cargar la lista')
    return result?.data ?? []
  } catch (error) {
    toast.error('Error', { description: error.message, duration: 3000, richColors: true })
    return []
  }
}

class DispatchesRest extends BasicRest {
  path = 'admin/dispatches'

  getBranchesByBusiness = async (businessId) => businessId ? (await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)) ?? [] : []
  getBusinesses = async () => await loadAll('/api/admin/businesses/paginate')
  getWarehouses = async () => await loadAll('/api/admin/warehouses/paginate')
  getCommercialOrders = async () => await loadAll('/api/admin/commercial-orders/paginate')
  getDrivers = async () => await loadAll('/api/admin/drivers/paginate')
  getVehicles = async () => await loadAll('/api/admin/vehicles/paginate')
  getZones = async () => await loadAll('/api/admin/zones/paginate')
}

export default DispatchesRest
