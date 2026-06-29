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

  createGiro = async (request) => await this.simplePost('/api/admin/giros', request)
  createSubGiro = async (request) => await this.simplePost('/api/admin/sub-giros', request)

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
