import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";
import { isStoragePath } from "../../Utils/permissionScope";

const isServicesClientPath = () => location.pathname.toLowerCase().includes('/admin/services-client')

class ClientsRest extends BasicRest {
  path = isStoragePath() ? 'admin/storage/clients' : (isServicesClientPath() ? 'admin/services-client' : 'admin/clients')

  resolvePath = (target = {}) => {
    if (isStoragePath()) return this.path
    if (isServicesClientPath()) return this.path

    const source = target?.data_source ?? ''
    if (source === 'eventual_client') return 'admin/eventual-clients'
    if (source === 'client') return this.path

    const kind = target?.client_kind ?? target?.kind ?? 'regular'
    if (kind === 'eventual') return 'admin/eventual-clients'
    return this.path
  }

  normalizePayload = (request = {}) => {
    const path = this.resolvePath(request)

    if (path === 'admin/eventual-clients') {
      return {
        id: request.id,
        document_type: request.document_type,
        document_number: request.document_number,
        business_name: request.full_name,
        email: request.email,
        phone_prefix: request.phone_prefix,
        phone: request.phone,
        address: request.full_address,
        contact_name: request.primary_contact,
        notes: request.notes,
      }
    }

    return {
      id: request.id,
      client_kind: 'regular',
      document_type: request.document_type,
      document_number: request.document_number,
      full_name: request.full_name,
      has_storage_service: isStoragePath() ? true : request.has_storage_service,
      storage_tariff_enabled: request.storage_tariff_enabled,
      contract_due_days: request.contract_due_days,
      commercial_channel: request.commercial_channel,
      segment: request.segment,
      email: request.email,
      billing_email: request.billing_email,
      primary_contact: request.primary_contact,
      primary_contact_phone: request.primary_contact_phone,
      phone: request.phone,
      phone_prefix: request.phone_prefix,
      birth_date: request.birth_date,
      secondary_phone: request.secondary_phone,
      company_ruc: request.company_ruc,
      position: request.position,
      sex: request.sex,
      short_code: request.short_code,
      ubigeo: request.ubigeo,
      full_address: request.full_address,
      fiscal_address: request.fiscal_address,
      zone_code: request.zone_code,
      domicile: request.domicile,
      domicile_condition: request.domicile_condition,
      interior: request.interior,
      kilometer: request.kilometer,
      block: request.block,
      lot: request.lot,
      street_name: request.street_name,
      street_type: request.street_type,
      address_number: request.address_number,
      zone_type: request.zone_type,
      apartment: request.apartment,
      department: request.department,
      province: request.province,
      district: request.district,
      taxpayer_status: request.taxpayer_status,
      tax_last_updated_at: request.tax_last_updated_at,
      status: request.status,
    }
  }

  runMutation = async (url, options, successMessage = 'Operacion correcta') => {
    try {
      const { status, result } = await Fetch(url, options)
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

      toast.success('Correcto', {
        description: result?.message || successMessage,
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

  save = async (request) => {
    const path = this.resolvePath(request)
    const payload = this.normalizePayload(request)
    return await this.runMutation(`/api/${path}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  boolean = async ({ id, field, value, client_kind = 'regular', data_source = null }) => {
    const path = this.resolvePath({ client_kind, data_source })
    const result = await this.runMutation(`/api/${path}/boolean`, {
      method: 'PATCH',
      body: JSON.stringify({ id, field, value })
    })

    return !!result
  }

  delete = async (target) => {
    const path = this.resolvePath(target)
    const entityId = target?.entity_id ?? target?.id ?? target
    const result = await this.runMutation(`/api/${path}/${entityId}`, {
      method: 'DELETE'
    })

    return !!result
  }

  lookupByDocument = async (documentType, documentNumber, clientKind = 'regular') => {
    try {
      const path = this.resolvePath({ client_kind: clientKind })
      const { status, result } = await Fetch(`/api/${path}/document/${documentType}/${documentNumber}`)
      if (!status) throw new Error(result?.message || 'No se pudo consultar el documento')
      return result.data
    } catch (error) {
      toast.error('Error', {
        description: error.message,
        duration: 3500,
        richColors: true,
      })
      return null
    }
  }
}

export default ClientsRest
