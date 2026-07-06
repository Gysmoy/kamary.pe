import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isMagistralesPath, isStoragePath } from "../../Utils/permissionScope";

class ArticlesRest extends BasicRest {
  path = isMagistralesPath()
    ? 'admin/magistrales/articles'
    : (isStoragePath() ? 'admin/storage/articles' : 'admin/articles')

  laboratoriesPath = () => 'admin/laboratories'

  laboratoriesSearchBy = () => 'name'

  laboratoriesPaginateApi = () => `/api/${this.laboratoriesPath()}/paginate`

  getLaboratories = async () => {
    try {
      const { status, result } = await Fetch(this.laboratoriesPaginateApi(), {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 1000,
          sort: [{ selector: this.laboratoriesSearchBy(), desc: false }],
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar los laboratorios')
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

  unitsPath = () => isStoragePath() ? 'admin/storage/units' : 'admin/units'

  importRows = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/import`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al importar articulos')

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

  getBusinesses = async () => {
    try {
      const { status, result } = await Fetch('/api/admin/businesses/paginate', {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 100,
          sort: [{ selector: 'name', desc: false }],
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar las empresas')
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
      if (!status) throw new Error(result?.message || 'No se pudieron cargar los almacenes')
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

  getUnits = async () => {
    try {
      const { status, result } = await Fetch(`/api/${this.unitsPath()}/paginate`, {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 500,
          sort: [{ selector: 'name', desc: false }]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar las unidades')
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

  getStorageClients = async () => {
    try {
      const { status, result } = await Fetch('/api/admin/storage/clients/paginate', {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 1000,
          sort: [{ selector: 'full_name', desc: false }],
          filter: [
            ['client_kind', '=', 'regular'],
            'and',
            ['has_storage_service', '=', 1],
          ],
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar los clientes')
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

  getManufacturers = async () => {
    try {
      const { status, result } = await Fetch(`/api/${this.laboratoriesPath()}/paginate`, {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take: 1000,
          sort: [{ selector: 'name', desc: false }]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar los fabricantes')
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

  createManufacturer = async (request) => {
    try {
      const name = (request?.name ?? '').trim()
      const code = (request?.code ?? '').trim() || name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .slice(0, 24)
      const finalCode = code || `FAB-${Date.now()}`
      const { status, result } = await Fetch(`/api/${this.laboratoriesPath()}`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          code: finalCode,
          country: request?.country ?? 'Perú',
          status: request?.status ?? true,
        })
      })
      if (!status) throw new Error(result?.message || 'Error al crear fabricante')
      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      });
      if (result?.data?.id) return result.data

      const manufacturers = await this.getManufacturers()
      return manufacturers.find(item => item.code === finalCode || item.name === name) ?? null
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return null
    }
  }

  getPrinciplesByLaboratory = async (laboratoryId) => {
    if (!laboratoryId) return []
    if (isMagistralesPath()) return []
    const result = await this.simpleGet(`/api/${this.path}/laboratories/${laboratoryId}/principles`)
    return result ?? []
  }

  createPrinciple = async (laboratoryId, request) => {
    if (isMagistralesPath()) return null
    try {
      const { status, result } = await Fetch(`/api/${this.laboratoriesPath()}/${laboratoryId}/principles`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al crear principio activo')
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

  createUnit = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.unitsPath()}`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al crear unidad de medida')
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

  getMagistralSubcategories = async (categoryId) => {
    if (!categoryId) return []
    const result = await this.simpleGet(`/api/admin/magistrales/categories/${categoryId}/subcategories`)
    return result ?? []
  }

  getStockByWarehouse = async (articleId) => {
    if (!articleId) return null
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${articleId}/stock-by-warehouse`)
      if (!status) throw new Error(result?.message || 'No se pudo obtener el stock por almacen')
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
}

export default ArticlesRest
