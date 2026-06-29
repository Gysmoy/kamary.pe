import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import xsrfToken from "../../Utils/xsrfToken";

const loadAll = async (path) => {
  try {
    const { status, result } = await Fetch(path, {
      method: 'POST',
      body: JSON.stringify({ take: 1000, skip: 0, isLoadingAll: true })
    })
    if (!status) throw new Error(result?.message || 'No se pudo cargar la lista')
    return result?.data ?? []
  } catch (error) {
    toast.error('Error', { description: error.message, duration: 3000, richColors: true })
    return []
  }
}

class SampleOrdersRest extends BasicRest {
  path = 'admin/sample-orders'

  getClients = async () => await loadAll('/api/admin/clients/paginate')
  getUsers = async () => await loadAll('/api/admin/users/paginate')
  getArticles = async () => await loadAll('/api/admin/sample-orders/articles')
  getGiros = async () => await loadAll('/api/admin/giros/paginate')
  getSubGiros = async () => await loadAll('/api/admin/sub-giros/paginate')
  getRequestReasons = async () => await loadAll('/api/admin/request-reasons/paginate')
  getSalesChannels = async () => await loadAll('/api/admin/sales-channels/paginate')
  getSalesSubchannels = async () => await loadAll('/api/admin/sales-subchannels/paginate')
  getServiceTypes = async () => await loadAll('/api/admin/service-types/paginate')

  saveGiro = async (request) => await this.simplePost('/api/admin/giros', request)
  saveSubGiro = async (request) => await this.simplePost('/api/admin/sub-giros', request)
  saveRequestReason = async (request) => await this.simplePost('/api/admin/request-reasons', request)

  simpleDelete = async (url) => {
    try {
      const { status, result } = await Fetch(url, { method: 'DELETE' })
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error inesperado')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return true
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return false
    }
  }

  saveSupervisor = async (request) => await this.simplePost('/api/admin/supervisors', request)
  saveClient = async (request) => await this.simplePost('/api/admin/clients', request)
  saveSalesChannel = async (request) => await this.simplePost('/api/admin/sales-channels', request)
  saveSalesSubchannel = async (request) => await this.simplePost('/api/admin/sales-subchannels', request)
  saveServiceType = async (request) => await this.simplePost('/api/admin/service-types', request)

  deleteGiro = async (id) => await this.simpleDelete(`/api/admin/giros/${id}`)
  deleteSubGiro = async (id) => await this.simpleDelete(`/api/admin/sub-giros/${id}`)
  deleteRequestReason = async (id) => await this.simpleDelete(`/api/admin/request-reasons/${id}`)
  deleteSupervisor = async (id) => await this.simpleDelete(`/api/admin/supervisors/${id}`)
  deleteSalesChannel = async (id) => await this.simpleDelete(`/api/admin/sales-channels/${id}`)
  deleteSalesSubchannel = async (id) => await this.simpleDelete(`/api/admin/sales-subchannels/${id}`)
  deleteServiceType = async (id) => await this.simpleDelete(`/api/admin/service-types/${id}`)

  booleanResult = async ({ id, field, value }) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/boolean`, {
        method: 'PATCH',
        body: JSON.stringify({ id, field, value })
      })
      if (!status) {
        return {
          ok: false,
          message: result?.message || 'Ocurrio un error inesperado',
        }
      }

      toast.success('Correcto', {
        description: result.message,
        duration: 3000,
        richColors: true,
      })

      return {
        ok: true,
        result,
      }
    } catch (error) {
      return {
        ok: false,
        message: error.message,
      }
    }
  }

  saveEvidence = async (id, request) => {
    try {
      const res = await fetch(`/api/${this.path}/${id}/evidence`, {
        method: 'POST',
        headers: {
          'X-Xsrf-Token': xsrfToken(),
        },
        body: request,
      })

      const text = await res.text()
      let result = {}
      try {
        result = text ? JSON.parse(text) : {}
      } catch {
        result = { message: text }
      }

      if (!res.ok) throw new Error(result?.message || 'No se pudo registrar la evidencia')

      toast.success('Correcto', {
        description: result.message,
        duration: 3000,
        richColors: true,
      })

      return result
    } catch (error) {
      toast.error('Error', {
        description: error.message,
        duration: 3000,
        richColors: true,
      })
      return null
    }
  }
}

export default SampleOrdersRest
