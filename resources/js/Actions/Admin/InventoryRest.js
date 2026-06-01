import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isMagistralesPath, isStoragePath } from "../../Utils/permissionScope";
import xsrfToken from "../../Utils/xsrfToken";

class InventoryRest extends BasicRest {
  path = isMagistralesPath()
    ? 'admin/magistrales/inventory'
    : (isStoragePath() ? 'admin/storage/inventory' : 'admin/inventory')
  filters = {
    business_id: '',
    business_branch_id: '',
    warehouse_id: '',
  }

  setFilters = (filters = {}) => {
    this.filters = {
      ...this.filters,
      ...filters,
    }
  }

  paginate = async (params) => {
    this.controller.abort('Nothing')
    this.controller = new AbortController()
    const signal = this.controller.signal
    const res = await fetch(`/api/${this.path}/paginate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Xsrf-Token': xsrfToken()
      },
      body: JSON.stringify({
        ...params,
        ...this.filters,
      }),
      signal
    })
    return await res.json()
  }

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

  getBranchesByBusiness = async (businessId) => {
    if (!businessId) return []
    const result = await this.simpleGet(`/api/admin/businesses/${businessId}/branches`)
    return result ?? []
  }

  getStandardOptions = async () => {
    if (isStoragePath() || isMagistralesPath()) return null
    return await this.simpleGet('/api/admin/inventory/options')
  }

  previewStandardInventory = async (request) => {
    try {
      const { status, result } = await Fetch('/api/admin/inventory/preview', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo cargar el detalle de inventario')
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

  saveStandardInventory = async (request) => {
    try {
      const { status, result } = await Fetch('/api/admin/inventory', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo registrar el inventario')
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

  getStandardInventory = async (id) => {
    if (!id) return null
    return await this.simpleGet(`/api/admin/inventory/${id}`)
  }

  importStandardFormat = async (id, formData) => {
    try {
      const res = await fetch(`/api/admin/inventory/${id}/import`, {
        method: 'POST',
        headers: {
          'X-Xsrf-Token': xsrfToken()
        },
        body: formData
      })
      const result = JSON.parseable(await res.text())
      if (!res.ok) throw new Error(result?.message || 'No se pudo subir el formato')
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

  applyStandardInventory = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/admin/inventory/${id}/apply`, {
        method: 'POST',
        body: JSON.stringify({})
      })
      if (!status) throw new Error(result?.message || 'No se pudo aplicar el inventario')
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

  getStorageOptions = async () => {
    if (!isStoragePath()) return null
    return await this.simpleGet('/api/admin/storage/inventory/options')
  }

  previewStorageInventory = async (request) => {
    try {
      const { status, result } = await Fetch('/api/admin/storage/inventory/preview', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo cargar el detalle de inventario')
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

  saveStorageInventory = async (request) => {
    try {
      const { status, result } = await Fetch('/api/admin/storage/inventory', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo registrar el inventario')
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

  getStorageInventory = async (id) => {
    if (!id) return null
    return await this.simpleGet(`/api/admin/storage/inventory/${id}`)
  }

  importStorageFormat = async (id, formData) => {
    try {
      const res = await fetch(`/api/admin/storage/inventory/${id}/import`, {
        method: 'POST',
        headers: {
          'X-Xsrf-Token': xsrfToken()
        },
        body: formData
      })
      const result = JSON.parseable(await res.text())
      if (!res.ok) throw new Error(result?.message || 'No se pudo subir el formato')
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

  applyStorageInventory = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/admin/storage/inventory/${id}/apply`, {
        method: 'POST',
        body: JSON.stringify({})
      })
      if (!status) throw new Error(result?.message || 'No se pudo aplicar el inventario')
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
}

export default InventoryRest
