import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isMagistralesPath, isStoragePath } from "../../Utils/permissionScope";
import xsrfToken from "../../Utils/xsrfToken";

class KardexRest extends BasicRest {
  path = isMagistralesPath()
    ? 'admin/magistrales/kardex'
    : (isStoragePath() ? 'admin/storage/kardex' : 'admin/kardex')
  filters = {
    business_id: '',
    business_branch_id: '',
    laboratory_id: '',
    article_id: '',
    warehouse_id: '',
    client_id: '',
    stock_mode: 'with_stock',
    section: 'kardex',
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

  getLaboratories = async () => {
    try {
      const laboratoriesPath = isMagistralesPath() ? 'admin/magistrales/laboratories' : 'admin/laboratories'
      const labelField = isMagistralesPath() ? 'description' : 'name'
      const { status, result } = await Fetch(`/api/${laboratoriesPath}/paginate`, {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 500,
          sort: [{ selector: labelField, desc: false }]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar laboratorios')
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

  getArticles = async () => {
    try {
      const articlesPath = isMagistralesPath()
        ? 'admin/magistrales/articles'
        : (isStoragePath() ? 'admin/storage/articles' : 'admin/articles')
      const { status, result } = await Fetch(`/api/${articlesPath}/paginate`, {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 1000,
          sort: [{ selector: 'name', desc: false }]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar articulos')
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

  getWarehouses = async () => {
    try {
      const { status, result } = await Fetch('/api/admin/warehouses/paginate', {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 500,
          sort: [{ selector: 'name', desc: false }]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar almacenes')
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

  getMovements = async (params = {}) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/movements`, {
        method: 'POST',
        body: JSON.stringify(params)
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar movimientos')
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

  getStorageOptions = async () => {
    if (!isStoragePath()) return null
    return await this.simpleGet('/api/admin/storage/kardex/options')
  }

  saveStorageWarehouse = async (request) => {
    try {
      const { status, result } = await Fetch('/api/admin/storage/kardex/warehouses', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo guardar el almacen')
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

  deleteStorageWarehouse = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/admin/storage/kardex/warehouses/${id}`, {
        method: 'DELETE'
      })
      if (!status) throw new Error(result?.message || 'No se pudo eliminar el almacen')
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

  saveStorageLocation = async (request) => {
    try {
      const { status, result } = await Fetch('/api/admin/storage/kardex/locations', {
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

  deleteStorageLocation = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/admin/storage/kardex/locations/${id}`, {
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

export default KardexRest
