import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class ArticlesRest extends BasicRest {
  path = 'admin/articles'

  getUnits = async () => {
    try {
      const { status, result } = await Fetch('/api/admin/units/paginate', {
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
      const { status, result } = await Fetch(`/api/admin/laboratories/${laboratoryId}/principles`, {
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
      const { status, result } = await Fetch('/api/admin/units', {
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
}

export default ArticlesRest
