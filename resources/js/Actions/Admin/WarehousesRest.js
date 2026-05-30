import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class WarehousesRest extends BasicRest {
  path = 'admin/warehouses'

  getBusinesses = async () => {
    try {
      const { status, result } = await Fetch('/api/admin/businesses/paginate', {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 500,
          sort: [{ selector: 'name', desc: false }]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar empresas')
      return result.data ?? []
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return []
    }
  }

  getBranches = async (businessId) => {
    if (!businessId) return []
    const result = await this.simpleGet(`/api/admin/businesses/${businessId}/branches`)
    return result ?? []
  }

  getLocations = async (warehouseId) => {
    if (!warehouseId) return []
    return await this.simpleGet(`/api/admin/warehouses/${warehouseId}/locations`) ?? []
  }

  saveLocation = async (warehouseId, request) => {
    try {
      const { status, result } = await Fetch(`/api/admin/warehouses/${warehouseId}/locations`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo guardar la ubicacion')
      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      });
      return result.data
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return null
    }
  }

  deleteLocation = async (warehouseId, locationId) => {
    try {
      const { status, result } = await Fetch(`/api/admin/warehouses/${warehouseId}/locations/${locationId}`, {
        method: 'DELETE'
      })
      if (!status) throw new Error(result?.message || 'No se pudo eliminar la ubicacion')
      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      });
      return true
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return false
    }
  }
}

export default WarehousesRest
