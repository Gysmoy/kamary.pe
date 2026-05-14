import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isStoragePath } from "../../Utils/permissionScope";

class ExitNotesRest extends BasicRest {
  path = isStoragePath() ? 'admin/storage/exit-notes' : 'admin/exit-notes'

  getBranchesByBusiness = async (businessId) => {
    if (!businessId) return []
    const result = await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)
    return result ?? []
  }

  getArticles = async () => {
    try {
      const { status, result } = await Fetch(`/api/${isStoragePath() ? 'admin/storage/articles' : 'admin/articles'}/paginate`, {
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

  getClients = async () => {
    try {
      const { status, result } = await Fetch('/api/admin/storage/clients/paginate', {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 1000,
          sort: [{ selector: 'full_name', desc: false }]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar clientes')
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

  getAvailableStock = async ({ warehouseId, search = '', exitNoteId = '' } = {}) => {
    try {
      const params = new URLSearchParams()
      if (warehouseId) params.set('warehouse_id', warehouseId)
      if (search) params.set('q', search)
      if (exitNoteId) params.set('exit_note_id', exitNoteId)

      const response = await fetch(`/api/${this.path}/available-stock?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      })
      const result = await response.json()
      if (!response.ok || !result?.status) throw new Error(result?.message || 'No se pudo obtener el stock disponible')
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

  setExitStatus = async (id, exitStatus) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ id, exit_status: exitStatus })
      })
      if (!status) throw new Error(result?.message || 'No se pudo actualizar la nota de salida')
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

export default ExitNotesRest
