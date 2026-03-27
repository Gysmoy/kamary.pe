import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class BusinessesRest extends BasicRest {
  path = 'admin/businesses'

  getBranches = async (businessId) => {
    return await this.simpleGet(`/api/${this.path}/${businessId}/branches`)
  }

  saveBranch = async (businessId, request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${businessId}/branches`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al guardar sede')
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

  booleanBranch = async ({ businessId, branchId, field, value }) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${businessId}/branches/${branchId}/${field}`, {
        method: 'PATCH',
        body: JSON.stringify({ field, value })
      })
      if (!status) throw new Error(result?.message || 'Error al actualizar sede')
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

  deleteBranch = async (businessId, branchId) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${businessId}/branches/${branchId}`, {
        method: 'DELETE'
      })
      if (!status) throw new Error(result?.message || 'Error al eliminar sede')
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

export default BusinessesRest
