import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import xsrfToken from "../../Utils/xsrfToken";

class BusinessesRest extends BasicRest {
  path = 'admin/businesses'

  getBranches = async (businessId) => {
    return await this.simpleGet(`/api/${this.path}/${businessId}/branches`)
  }

  exportData = async () => {
    try {
      const res = await fetch(`/api/${this.path}/export-data`, {
        method: 'GET',
        headers: { 'X-Xsrf-Token': xsrfToken() }
      })
      if (!res.ok) throw new Error('No se pudo exportar la data')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')
      a.href = url
      a.download = `kamary_data_dump_${stamp}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('Correcto', { description: 'Data exportada', duration: 3000, richColors: true })
      return true
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return false
    }
  }

  getFacturadorMode = async () => {
    return await this.simpleGet('/api/admin/billing-settings/facturador-mode')
  }

  updateFacturadorMode = async (mode) => {
    try {
      const { status, result } = await Fetch('/api/admin/billing-settings/facturador-mode', {
        method: 'PATCH',
        body: JSON.stringify({ mode })
      })
      if (!status) throw new Error(result?.message || 'Error al actualizar modo de facturacion')
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

  uploadFiscalAssets = async (businessId, request) => {
    try {
      const formData = new FormData()
      if (request.logo) formData.append('logo', request.logo)
      if (request.certificate) formData.append('certificate', request.certificate)
      if (request.certificate_password) formData.append('certificate_password', request.certificate_password)

      const res = await fetch(`/api/${this.path}/${businessId}/fiscal-assets`, {
        method: 'POST',
        headers: {
          'X-Xsrf-Token': xsrfToken()
        },
        body: formData
      })

      const result = JSON.parse(await res.text())
      if (!res.ok) throw new Error(result?.message || 'Error al guardar archivos fiscales')

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

  deleteFiscalAsset = async (businessId, type) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${businessId}/fiscal-assets/${type}`, {
        method: 'DELETE'
      })
      if (!status) throw new Error(result?.message || 'Error al eliminar archivo fiscal')
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

  syncFacturador = async (businessId) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${businessId}/facturador-sync`, {
        method: 'POST'
      })
      if (!status) throw new Error(result?.message || 'Error al sincronizar con facturador')
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

export default BusinessesRest
