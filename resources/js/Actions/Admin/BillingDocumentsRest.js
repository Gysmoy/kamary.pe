import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isStoragePath } from "../../Utils/permissionScope";

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

class BillingDocumentsRest extends BasicRest {
  path = isStoragePath() ? 'admin/storage/billing-control' : 'admin/billing-documents'

  getBusinesses = async () => await loadAll('/api/admin/businesses/paginate')
  getClients = async () => await loadAll(isStoragePath() ? '/api/admin/storage/clients/paginate' : '/api/admin/clients/paginate')
  getCommercialOrders = async () => await loadAll('/api/admin/commercial-orders/paginate')
  getServiceOrders = async () => {
    if (!isStoragePath()) return await loadAll('/api/admin/service-orders/paginate')

    const [storageOrders, generalOrders] = await Promise.all([
      loadAll('/api/admin/storage/service-orders/paginate'),
      loadAll('/api/admin/storage/general-service-orders/paginate'),
    ])

    return [...storageOrders, ...generalOrders].sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
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

  registerProviderResponse = async (id, request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/provider-response`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo registrar la respuesta')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  syncStatus = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/provider-status`, {
        method: 'POST'
      })
      if (!status) throw new Error(result?.message || 'No se pudo sincronizar el estado')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  downloadUrl = (id, type) => `/api/${this.path}/${id}/download/${type}`

  prepareVoucher = async (id, request = {}) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/prepare-voucher`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo preparar el comprobante')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result
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
      if (!status) throw new Error(result?.message || 'No se pudo emitir el comprobante')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  cancel = async (id, request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo anular el comprobante')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  creditNote = async (id, request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}/credit-note`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo emitir la nota de credito')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }
}

export default BillingDocumentsRest
