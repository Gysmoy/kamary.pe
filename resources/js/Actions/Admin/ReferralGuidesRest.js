import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class ReferralGuidesRest extends BasicRest {
  path = 'admin/referral-guides'

  prepareFromDispatch = async (dispatchId) => {
    try {
      const { status, result } = await Fetch(`/api/admin/dispatches/${dispatchId}/referral-guides/prepare`, {
        method: 'POST'
      })
      if (!status) throw new Error(result?.message || 'No se pudieron generar las guias')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  prepareFromCommercialOrder = async (orderId) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/commercial-orders/${orderId}/prepare`, {
        method: 'POST'
      })
      if (!status) throw new Error(result?.message || 'No se pudo generar la guia')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  getConnectorPayload = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/connector-payload`)
      if (!status) throw new Error(result?.message || 'No se pudo generar el payload')
      return result?.data ?? null
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  issue = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/issue`, {
        method: 'POST'
      })
      if (!status) throw new Error(result?.message || 'No se pudo emitir la guia')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  cancel = async (id, reason = '') => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      })
      if (!status) throw new Error(result?.message || 'No se pudo anular la guia')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  downloadUrl = (id, type) => `/api/${this.path}/${id}/download/${type}`
}

export default ReferralGuidesRest
