import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isMagistralesPath, isStoragePath } from "../../Utils/permissionScope";

class ArticlesRest extends BasicRest {
  path = isMagistralesPath()
    ? 'admin/magistrales/articles'
    : (isStoragePath() ? 'admin/storage/articles' : 'admin/articles')

  laboratoriesPath = () => isMagistralesPath() ? 'admin/magistrales/laboratories' : 'admin/laboratories'

  laboratoriesPaginateApi = () => `/api/${this.laboratoriesPath()}/paginate`

  unitsPath = () => isMagistralesPath()
    ? 'admin/magistrales/units'
    : (isStoragePath() ? 'admin/storage/units' : 'admin/units')

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

  getPrinciplesByLaboratory = async (laboratoryId) => {
    if (!laboratoryId) return []
    const result = await this.simpleGet(`/api/${this.path}/laboratories/${laboratoryId}/principles`)
    return result ?? []
  }

  createPrinciple = async (laboratoryId, request) => {
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
