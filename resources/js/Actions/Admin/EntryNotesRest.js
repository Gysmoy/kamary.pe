import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isStoragePath } from "../../Utils/permissionScope";

class EntryNotesRest extends BasicRest {
  path = isStoragePath() ? 'admin/storage/entry-notes' : 'admin/entry-notes'
  hasFiles = true

  getBranchesByBusiness = async (businessId) => {
    if (!businessId) return []
    const result = await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)
    return result ?? []
  }

  getStorageOptions = async () => {
    const result = await this.simpleGet('/api/admin/storage/kardex/options')
    return result ?? {
      businesses: [],
      branches: [],
      warehouses: [],
      locations: [],
      clients: [],
    }
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

  getSuppliers = async () => {
    try {
      const { status, result } = await Fetch('/api/admin/suppliers/paginate', {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 500,
          sort: [{ selector: 'business_name', desc: false }]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar proveedores')
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

  getArticles = async (clientId = null) => {
    try {
      const normalizedClientId = Number(clientId || 0)
      const request = {
        isLoadingAll: true,
        take: 1000,
        sort: [{ selector: 'name', desc: false }]
      }
      if (isStoragePath()) {
        request.filter = ['client_id', '=', normalizedClientId || 0]
      }
      const { status, result } = await Fetch(`/api/${isStoragePath() ? 'admin/storage/articles' : 'admin/articles'}/paginate`, {
        method: 'POST',
        body: JSON.stringify(request)
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

  createBatch = async (request) => {
    try {
      const { status, result } = await Fetch('/api/admin/batches', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo crear el lote')
      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      });
      return result.data ?? null
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
      const { status, result } = await Fetch(`/api/${isStoragePath() ? 'admin/storage/articles' : 'admin/articles'}/paginate`, {
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

  getBatchById = async (batchId) => {
    if (!batchId) return null
    try {
      const { status, result } = await Fetch('/api/admin/batches/paginate', {
        method: 'POST',
        body: JSON.stringify({
          take: 1,
          skip: 0,
          filter: ['id', '=', Number(batchId)]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudo obtener el lote')
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

  getCurrentStock = async (articleId, warehouseId) => {
    if (!articleId || !warehouseId) return { qty_in: 0, qty_out: 0, stock: 0 }
    try {
      const response = await fetch(`/api/${this.path}/current-stock?article_id=${articleId}&warehouse_id=${warehouseId}`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      })
      const result = await response.json()
      if (!response.ok || !result?.status) throw new Error(result?.message || 'No se pudo obtener el stock actual')
      return result.data ?? { qty_in: 0, qty_out: 0, stock: 0 }
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return { qty_in: 0, qty_out: 0, stock: 0 }
    }
  }

  setEntryStatus = async (id, entryStatus) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/entry-status`, {
        method: 'PATCH',
        body: JSON.stringify({ entry_status: entryStatus })
      })
      if (!status) throw new Error(result?.message || 'No se pudo actualizar la nota de entrada')
      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      });
      return result.data ?? true
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

export default EntryNotesRest
