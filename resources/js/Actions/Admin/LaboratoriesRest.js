import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isMagistralesPath } from "../../Utils/permissionScope";

class LaboratoriesRest extends BasicRest {
  path = isMagistralesPath() ? 'admin/magistrales/laboratories' : 'admin/laboratories'

  importRows = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/import`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al importar registros')

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

  getPrinciples = async (laboratoryId) => {
    return await this.simpleGet(`/api/${this.path}/${laboratoryId}/principles`)
  }

  savePrinciple = async (laboratoryId, request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${laboratoryId}/principles`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al guardar principio activo')
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

  booleanPrinciple = async ({ laboratoryId, principleId, field, value }) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${laboratoryId}/principles/${principleId}/${field}`, {
        method: 'PATCH',
        body: JSON.stringify({ field, value })
      })
      if (!status) throw new Error(result?.message || 'Error al actualizar principio activo')
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

  deletePrinciple = async (laboratoryId, principleId) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${laboratoryId}/principles/${principleId}`, {
        method: 'DELETE'
      })
      if (!status) throw new Error(result?.message || 'Error al eliminar principio activo')
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

  importPrinciples = async (laboratoryId, request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${laboratoryId}/principles/import`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al importar principios activos')
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

export default LaboratoriesRest
