import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

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

class ActivitiesRest extends BasicRest {
  path = 'admin/activities'

  getBranchesByBusiness = async (businessId) => businessId ? (await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)) ?? [] : []
  getBusinesses = async () => await loadAll('/api/admin/businesses/paginate')
  getWarehouses = async () => await loadAll('/api/admin/warehouses/paginate')
  getCommercialOrders = async () => await loadAll('/api/admin/commercial-orders/paginate')
  getDispatches = async () => await loadAll('/api/admin/dispatches/paginate')
  getDrivers = async () => await loadAll('/api/admin/drivers/paginate')
  getVehicles = async () => await loadAll('/api/admin/vehicles/paginate')
  getZones = async () => await loadAll('/api/admin/zones/paginate')
  getClients = async () => await loadAll('/api/admin/clients/paginate')
  getEventualClients = async () => await loadAll('/api/admin/eventual-clients/paginate')
  getArticles = async () => await loadAll('/api/admin/articles/paginate')
}

export default ActivitiesRest
