import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import UbigeoCascade from '@Adminto/form/UbigeoCascade';
import ClientsRest from '../Actions/Admin/ClientsRest';
import UsersRest from '../Actions/Admin/UsersRest';
import StorageClientNotificationsRest from '../Actions/Admin/StorageClientNotificationsRest';
import StorageClientTariffsRest from '../Actions/Admin/StorageClientTariffsRest';
import StorageClientContractsRest from '../Actions/Admin/StorageClientContractsRest';
import { EMPTY_UBIGEO_SELECTION } from '../Utils/ubigeoInei';

const clientsRest = new ClientsRest()
const usersRest = new UsersRest()
const storageClientNotificationsRest = new StorageClientNotificationsRest()
const storageClientTariffsRest = new StorageClientTariffsRest()
const storageClientContractsRest = new StorageClientContractsRest()
const MAX_CONTRACT_FILE_BYTES = 20 * 1024 * 1024
const MAX_CONTRACT_FILE_MB = MAX_CONTRACT_FILE_BYTES / 1024 / 1024

const QUICK_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'regular', label: 'Regulares' },
  { key: 'eventual', label: 'Eventuales' },
  { key: 'habitual', label: 'Habituales' },
  { key: 'without-orders', label: 'Sin compras' },
]

const setRefValue = (ref, value) => {
  if (!ref?.current) return
  ref.current.value = value ?? ''
}

const getRefValue = (ref) => ref?.current?.value ?? ''
const setRefChecked = (ref, value) => {
  if (!ref?.current) return
  ref.current.checked = !!value
}
const getRefChecked = (ref) => !!ref?.current?.checked
const normalizePrefix = (value) => (value ?? '').toString().replace(/\D+/g, '')
const normalizeDigits = (value) => (value ?? '').toString().replace(/\D+/g, '')
const splitEmailList = (value) => (value ?? '').toString().split(/[,\n;]+/).map(email => email.trim()).filter(Boolean)
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const uniqueEmailList = (emails = []) => {
  const seen = new Set()
  return emails.filter(email => {
    const key = email.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
const normalizeEmailList = (value) => {
  return uniqueEmailList(splitEmailList(value)).join(', ')
}
const invalidEmailList = (value) => splitEmailList(value).filter(email => !isValidEmail(email))
const DEFAULT_STORAGE_USER_SCOPES = ['kamary-medicals']
const DEFAULT_STORAGE_NOTIFICATION_OPTIONS = [
  {
    value: 'storage_invoice_notification',
    label: 'Notificacion de Envio de Facturas a los Clientes - Kamary medical'
  },
  {
    value: 'storage_sample_order_registration',
    label: 'Notificacion de registro de pedidos muestra'
  }
]
const STORAGE_TEMPERATURE_OPTIONS = [
  { value: '-15C a -25C', label: '-15°C a -25°C' },
  { value: '2C a 8C', label: '2°C a 8°C' },
  { value: '15C a 25C', label: '15°C a 25°C' },
  { value: '-15C a -40C', label: '-15°C a -40°C' },
]
const STORAGE_CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles' },
  { value: 'USD', label: 'Dolares' },
]

const getNotificationOptionValue = (option) => (option?.value ?? option?.id ?? '').toString()
const getNotificationOptionLabel = (option) => option?.label ?? option?.name ?? option?.caption ?? ''

const EmailTagsInput = forwardRef(({
  col = 'col-12',
  label,
  placeholder = 'Para:',
  specification
}, ref) => {
  const inputRef = useRef()
  const [emails, setEmails] = useState([])
  const [draft, setDraft] = useState('')

  const value = useMemo(() => [...emails, draft.trim()].filter(Boolean).join(', '), [emails, draft])

  useImperativeHandle(ref, () => ({
    get value() {
      return value
    },
    set value(nextValue) {
      setEmails(uniqueEmailList(splitEmailList(nextValue)))
      setDraft('')
    },
    focus() {
      inputRef.current?.focus()
    }
  }), [value])

  const appendEmails = (items = []) => {
    const nextItems = items.map(email => email.trim()).filter(Boolean)
    if (!nextItems.length) return
    setEmails(current => uniqueEmailList([...current, ...nextItems]))
  }

  const commitDraft = () => {
    const nextEmails = splitEmailList(draft)
    if (!nextEmails.length) return
    appendEmails(nextEmails)
    setDraft('')
  }

  const removeEmail = (index) => {
    setEmails(current => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const onInputChange = (e) => {
    const nextValue = e.target.value
    if (/[,\n;]/.test(nextValue)) {
      appendEmails(splitEmailList(nextValue))
      setDraft('')
      return
    }
    setDraft(nextValue)
  }

  const onKeyDown = (e) => {
    if (['Enter', ',', ';'].includes(e.key)) {
      e.preventDefault()
      commitDraft()
      return
    }
    if (e.key === 'Backspace' && !draft && emails.length) {
      e.preventDefault()
      setEmails(current => current.slice(0, -1))
    }
  }

  return <div className={`form-group ${col} mb-2`}>
    {label && <label className='form-label mb-1'>
      {label}
      {specification && <small className='ms-1 mdi mdi-help-circle-outline text-muted' title={specification}></small>}
    </label>}
    <div
      className='form-control d-flex flex-wrap align-items-center gap-1 py-1'
      style={{ minHeight: 39, cursor: 'text' }}
      onClick={() => inputRef.current?.focus()}
    >
      {emails.map((email, index) => (
        <span
          key={`${email}-${index}`}
          className={`badge d-inline-flex align-items-center gap-1 px-2 py-1 ${isValidEmail(email) ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}
        >
          {email}
          <button
            type='button'
            className='btn btn-link btn-sm p-0 lh-1 text-reset text-decoration-none'
            onClick={(e) => {
              e.stopPropagation()
              removeEmail(index)
            }}
            aria-label={`Quitar ${email}`}
          >
            x
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type='text'
        className='border-0 flex-grow-1 p-0'
        style={{ outline: 'none', minWidth: 180 }}
        placeholder={placeholder}
        value={draft}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        onBlur={commitDraft}
      />
    </div>
  </div>
})

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-PE')
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return value.toString().replace('T', ' ').slice(0, 19)
}

const formatFileSize = (bytes = 0) => {
  const size = Number(bytes || 0)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const EmailListCell = ({ value }) => {
  const emails = splitEmailList(value)
  if (!emails.length) return '-'
  return <>{emails.map((email, index) => <div key={`${email}-${index}`}>{email}</div>)}</>
}

const StatusBadge = ({ value }) => {
  const active = value === true || value === 1 || value === '1'
  return <span className={`badge ${active ? 'bg-soft-success text-success border border-success' : 'bg-soft-secondary text-secondary border border-secondary'}`}>{active ? 'Activo' : 'Inactivo'}</span>
}

const fileIdentity = (file) => `${file.name}-${file.size}-${file.lastModified}`
const contractFileUrl = (id, download = false) => `/api/admin/storage/client-contracts/${id}/file${download ? '?download=1' : ''}`
const contractAnnexFileUrl = (id, download = false) => `/api/admin/storage/client-contract-annexes/${id}/file${download ? '?download=1' : ''}`
const storageContractConfirm = (options) => Swal.fire({
  ...options,
  heightAuto: false,
  customClass: {
    ...(options.customClass ?? {}),
    container: ['storage-contract-swal-container', options.customClass?.container].filter(Boolean).join(' ')
  },
  didOpen: (...args) => {
    options.didOpen?.(...args)
    const container = Swal.getContainer()
    if (container) container.style.zIndex = '20000'
  }
})

const resolveQuickFilterValue = (quickFilter) => {
  switch (quickFilter) {
    case 'regular':
      return ['client_kind', '=', 'regular']
    case 'eventual':
      return ['client_kind', '=', 'eventual']
    case 'habitual':
      return ['is_habitual', '=', 1]
    case 'without-orders':
      return ['purchase_count', '=', 0]
    default:
      return null
  }
}

const getCreateKindFromFilter = (quickFilter, fallback = 'regular') => {
  if (quickFilter === 'eventual') return 'eventual'
  if (quickFilter === 'regular') return 'regular'
  return fallback
}

const combineFilters = (...filters) => {
  const validFilters = filters.filter(Boolean)
  if (!validFilters.length) return null
  return validFilters.reduce((carry, filter) => carry ? [carry, 'and', filter] : filter, null)
}

const Clients = ({
  prefixes = [],
  sectionTitle = 'Clientes',
  defaultClientKind = 'regular',
  requiredPermission = 'clients',
  initialQuickFilter = 'all',
  storageContext = false,
  serviceContext = false,
  storageNotificationOptions = [],
}) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const usersModalRef = useRef()
  const userFormModalRef = useRef()
  const usersTableRef = useRef()
  const notificationsModalRef = useRef()
  const notificationsTableRef = useRef()
  const tariffModalRef = useRef()
  const contractsModalRef = useRef()
  const contractFormModalRef = useRef()
  const contractsTableRef = useRef()
  const lookupTimeoutRef = useRef()
  const pendingModalDataRef = useRef(null)

  const idRef = useRef()
  const dataSourceRef = useRef()
  const clientKindRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const fullNameRef = useRef()
  const hasStorageServiceRef = useRef()
  const storageTariffEnabledRef = useRef()
  const contractDueDaysRef = useRef()
  const commercialChannelRef = useRef()
  const segmentRef = useRef()
  const emailRef = useRef()
  const billingEmailRef = useRef()
  const primaryContactRef = useRef()
  const primaryContactPhoneRef = useRef()
  const phoneRef = useRef()
  const phonePrefixRef = useRef()
  const shortCodeRef = useRef()
  const addressRef = useRef()
  const notesRef = useRef()
  const statusRef = useRef()
  const documentLookupRef = useRef()
  const fiscalAddressRef = useRef()
  const zoneCodeRef = useRef()
  const domicileRef = useRef()
  const domicileConditionRef = useRef()
  const interiorRef = useRef()
  const kilometerRef = useRef()
  const blockRef = useRef()
  const lotRef = useRef()
  const streetNameRef = useRef()
  const streetTypeRef = useRef()
  const addressNumberRef = useRef()
  const zoneTypeRef = useRef()
  const apartmentRef = useRef()
  const departmentRef = useRef()
  const provinceRef = useRef()
  const districtRef = useRef()
  const serviceUbigeoRef = useRef()
  const taxpayerStatusRef = useRef()
  const taxLastUpdatedAtRef = useRef()
  const userIdRef = useRef()
  const userNameRef = useRef()
  const userLastNameFatherRef = useRef()
  const userLastNameMotherRef = useRef()
  const userEmailRef = useRef()
  const userUsernameRef = useRef()
  const userPasswordRef = useRef()
  const userPhonePrefixRef = useRef()
  const userPhoneRef = useRef()
  const userStatusRef = useRef()
  const notificationIdRef = useRef()
  const notificationSelectRef = useRef()
  const notificationToRef = useRef()
  const notificationCcRef = useRef()
  const tariffIdRef = useRef()
  const tariffTemperatureRef = useRef()
  const tariffCurrencyRef = useRef()
  const contractIdRef = useRef()
  const contractCodeRef = useRef()
  const contractStartRef = useRef()
  const contractEndRef = useRef()
  const contractFileRef = useRef()
  const contractAnnexesRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [isUserEditing, setIsUserEditing] = useState(false)
  const [isNotificationEditing, setIsNotificationEditing] = useState(false)
  const [clientKind, setClientKind] = useState(defaultClientKind)
  const [documentType, setDocumentType] = useState('dni')
  const [isSearchingDocument, setIsSearchingDocument] = useState(false)
  const [isDocumentDataLocked, setIsDocumentDataLocked] = useState(false)
  const [lastLookedDocumentKey, setLastLookedDocumentKey] = useState('')
  const [phonePrefix, setPhonePrefix] = useState('51')
  const [quickFilter, setQuickFilter] = useState(initialQuickFilter)
  const [statusValue, setStatusValue] = useState('1')
  const [ubigeoLocation, setUbigeoLocation] = useState(EMPTY_UBIGEO_SELECTION)
  const [selectedClientForUsers, setSelectedClientForUsers] = useState(null)
  const [selectedClientForNotifications, setSelectedClientForNotifications] = useState(null)
  const [selectedClientForTariff, setSelectedClientForTariff] = useState(null)
  const [selectedClientForContracts, setSelectedClientForContracts] = useState(null)
  const [isContractEditing, setIsContractEditing] = useState(false)
  const [contractEditingData, setContractEditingData] = useState(null)
  const [contractAnnexFiles, setContractAnnexFiles] = useState([])
  const [userStatus, setUserStatus] = useState('1')
  const [notificationValue, setNotificationValue] = useState('')
  const [tariffTemperature, setTariffTemperature] = useState('')
  const [tariffCurrency, setTariffCurrency] = useState('')

  const isEventual = clientKind === 'eventual'
  const isRuc = documentType === 'ruc'
  const docMaxLength = documentType === 'dni' ? 8 : (documentType === 'ruc' ? 11 : 20)
  const kindLabel = isEventual ? 'eventual' : 'regular'
  const filterValue = useMemo(() => combineFilters(
    storageContext ? ['has_storage_service', '=', 1] : null,
    resolveQuickFilterValue(quickFilter)
  ), [quickFilter, storageContext])

  const refresh = () => tableRef.current?.refresh()

  const displayNameLabel = isEventual
    ? (isRuc ? 'Razon social' : 'Nombre o razon social')
    : (isRuc ? 'Razon social' : 'Nombre completo')
  const notificationOptions = storageNotificationOptions.length ? storageNotificationOptions : DEFAULT_STORAGE_NOTIFICATION_OPTIONS

  const clearForm = (nextKind = defaultClientKind) => {
    setRefValue(idRef, '')
    setRefValue(dataSourceRef, nextKind === 'eventual' ? 'eventual_client' : 'client')
    setRefValue(clientKindRef, nextKind)
    setRefValue(documentTypeRef, serviceContext ? 'ruc' : 'dni')
    setRefValue(documentNumberRef, '')
    setRefValue(documentLookupRef, '')
    setRefValue(fullNameRef, '')
    setRefChecked(hasStorageServiceRef, storageContext)
    setRefChecked(storageTariffEnabledRef, false)
    setRefValue(contractDueDaysRef, '')
    setRefValue(commercialChannelRef, '')
    setRefValue(segmentRef, '')
    setRefValue(emailRef, '')
    setRefValue(billingEmailRef, '')
    setRefValue(primaryContactRef, '')
    setRefValue(primaryContactPhoneRef, '')
    setRefValue(phoneRef, '')
    setPhonePrefix('51')
    setRefValue(phonePrefixRef, '51')
    setRefValue(shortCodeRef, '')
    setUbigeoLocation(EMPTY_UBIGEO_SELECTION)
    setRefValue(addressRef, '')
    setRefValue(fiscalAddressRef, '')
    setRefValue(zoneCodeRef, '')
    setRefValue(domicileRef, '')
    setRefValue(domicileConditionRef, '')
    setRefValue(interiorRef, '')
    setRefValue(kilometerRef, '')
    setRefValue(blockRef, '')
    setRefValue(lotRef, '')
    setRefValue(streetNameRef, '')
    setRefValue(streetTypeRef, '')
    setRefValue(addressNumberRef, '')
    setRefValue(zoneTypeRef, '')
    setRefValue(apartmentRef, '')
    setRefValue(departmentRef, '')
    setRefValue(provinceRef, '')
    setRefValue(districtRef, '')
    setRefValue(serviceUbigeoRef, '')
    setRefValue(taxpayerStatusRef, '')
    setRefValue(taxLastUpdatedAtRef, '')
    setRefValue(notesRef, '')
    setRefValue(statusRef, '1')
    setStatusValue('1')
  }

  const applyApiClientData = (client = {}, kind = clientKind) => {
    const clientDocumentType = client.document_type ?? documentType
    const clientDocumentNumber = client.document_number ?? getRefValue(documentLookupRef) ?? ''

    if (clientDocumentType) {
      setDocumentType(clientDocumentType)
      setRefValue(documentTypeRef, clientDocumentType)
    }
    if (clientDocumentNumber) {
      setRefValue(documentNumberRef, clientDocumentNumber)
      setRefValue(documentLookupRef, clientDocumentNumber)
    }

    if (kind === 'eventual') {
      if (client.business_name || client.full_name) setRefValue(fullNameRef, client.business_name ?? client.full_name)
      if (client.address || client.full_address) setRefValue(addressRef, client.address ?? client.full_address)
      if (client.contact_name) setRefValue(primaryContactRef, client.contact_name)
    } else {
      if (client.full_name || client.business_name) setRefValue(fullNameRef, client.full_name ?? client.business_name)
      if (client.full_address || client.address) setRefValue(addressRef, client.full_address ?? client.address)
    }

    if (client.email) {
      setRefValue(emailRef, client.email)
      if (kind !== 'eventual') setRefValue(billingEmailRef, client.email)
    }
    if (client.phone) {
      setRefValue(phoneRef, client.phone)
      if (kind !== 'eventual') setRefValue(primaryContactPhoneRef, client.phone)
    }

    setRefValue(fiscalAddressRef, client.fiscal_address ?? client.full_address ?? client.address ?? '')
    setRefValue(zoneCodeRef, client.zone_code ?? client.codigo_zona ?? '')
    setRefValue(domicileRef, client.domicile ?? client.domicilio ?? '')
    setRefValue(domicileConditionRef, client.domicile_condition ?? client.condicion_domicilio ?? '')
    setRefValue(interiorRef, client.interior ?? '')
    setRefValue(kilometerRef, client.kilometer ?? client.kilometro ?? '')
    setRefValue(blockRef, client.block ?? client.manzana ?? '')
    setRefValue(lotRef, client.lot ?? client.lote ?? '')
    setRefValue(streetNameRef, client.street_name ?? client.nombre_via ?? '')
    setRefValue(streetTypeRef, client.street_type ?? client.tipo_via ?? '')
    setRefValue(addressNumberRef, client.address_number ?? client.numero ?? '')
    setRefValue(zoneTypeRef, client.zone_type ?? client.tipo_zona ?? '')
    setRefValue(apartmentRef, client.apartment ?? client.dpto ?? '')
    setRefValue(departmentRef, client.department ?? client.departamento ?? '')
    setRefValue(provinceRef, client.province ?? client.provincia ?? '')
    setRefValue(districtRef, client.district ?? client.distrito ?? '')
    setRefValue(serviceUbigeoRef, client.ubigeo ?? '')
    setRefValue(taxpayerStatusRef, client.taxpayer_status ?? client.estado_contribuyente ?? '')
    setRefValue(taxLastUpdatedAtRef, client.tax_last_updated_at ?? client.ultima_actualizacion ?? '')
  }

  const lookupDocument = async (type, number, kind = clientKind) => {
    if (!['dni', 'ruc'].includes(type)) return
    if (!number || number.length < (type === 'dni' ? 8 : 11)) return

    const key = `${kind}:${type}:${number}`
    if (key === lastLookedDocumentKey) return

    setIsSearchingDocument(true)
    setLastLookedDocumentKey(key)
    const result = await clientsRest.lookupByDocument(type, number, kind)
    setIsSearchingDocument(false)

    // Si el servicio falla, lookupByDocument ya muestra el error. Aqui se avisa el otro caso:
    // la consulta si corrio pero no hay datos. Sin este aviso el formulario se quedaba igual que
    // si nunca hubiera buscado, y no habia forma de distinguirlo.
    if (!result) return
    if (!result.found || !result.client) {
      setIsDocumentDataLocked(false)
      toast.info('Sin resultados', {
        description: `No se encontro informacion para el ${type.toUpperCase()} ${number}. Escribe los datos a mano.`,
        duration: 4000,
        richColors: true,
      })
      return
    }

    applyApiClientData(result.client, kind)
    setIsDocumentDataLocked(true)
  }

  const onDocumentTypeChanged = (value) => {
    const nextType = value || 'dni'
    setDocumentType(nextType)
    setRefValue(documentTypeRef, nextType)
    setIsDocumentDataLocked(false)
    setLastLookedDocumentKey('')
    setRefValue(documentNumberRef, '')
    setRefValue(fullNameRef, '')
  }

  const onDocumentNumberChanged = (e) => {
    const normalized = normalizeDigits(e.target.value).slice(0, docMaxLength)
    setRefValue(documentNumberRef, normalized)

    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current)
    setIsDocumentDataLocked(false)

    if (!['dni', 'ruc'].includes(documentType)) return
    const expectedLength = documentType === 'dni' ? 8 : 11
    if (normalized.length !== expectedLength) return

    lookupTimeoutRef.current = setTimeout(() => {
      lookupDocument(documentType, normalized)
    }, 450)
  }

  const onServiceDocumentSearch = async () => {
    const normalized = normalizeDigits(getRefValue(documentLookupRef))
    if (!normalized) return

    const nextType = normalized.length === 11 ? 'ruc' : 'dni'
    const maxLength = nextType === 'ruc' ? 11 : 8
    const nextNumber = normalized.slice(0, maxLength)
    setDocumentType(nextType)
    setRefValue(documentTypeRef, nextType)
    setRefValue(documentNumberRef, nextNumber)
    setRefValue(documentLookupRef, nextNumber)
    setLastLookedDocumentKey('')
    await lookupDocument(nextType, nextNumber, 'regular')
  }

  const populateModalData = (data) => {
    const nextKind = data.client_kind ?? defaultClientKind
    setRefValue(idRef, data.entity_id ?? data.id)
    setRefValue(dataSourceRef, data.data_source ?? (nextKind === 'eventual' ? 'eventual_client' : 'client'))
    setRefValue(clientKindRef, nextKind)
    setClientKind(nextKind)
    setRefValue(documentTypeRef, data.document_type ?? 'dni')
    setRefValue(documentNumberRef, data.document_number ?? '')
    setRefValue(documentLookupRef, data.document_number ?? '')
    setRefValue(fullNameRef, data.full_name ?? data.business_name ?? data.display_name ?? '')
    setRefChecked(hasStorageServiceRef, storageContext || !!data.has_storage_service)
    setRefChecked(storageTariffEnabledRef, !!data.storage_tariff_enabled)
    setRefValue(contractDueDaysRef, data.contract_due_days ?? '')
    setRefValue(commercialChannelRef, data.commercial_channel ?? '')
    setRefValue(segmentRef, data.segment ?? '')
    setRefValue(emailRef, data.email ?? '')
    setRefValue(billingEmailRef, data.billing_email ?? '')
    setRefValue(primaryContactRef, data.primary_contact ?? data.contact_name ?? '')
    setRefValue(primaryContactPhoneRef, data.primary_contact_phone ?? '')
    setRefValue(phoneRef, data.phone ?? '')
    const normalizedPrefix = normalizePrefix(data.phone_prefix) || '51'
    setPhonePrefix(normalizedPrefix)
    setRefValue(phonePrefixRef, normalizedPrefix)
    setRefValue(shortCodeRef, data.short_code ?? '')
    setUbigeoLocation({
      ...EMPTY_UBIGEO_SELECTION,
      ubigeo: data.ubigeo ?? '',
    })
    setRefValue(addressRef, data.full_address ?? data.address ?? '')
    setRefValue(fiscalAddressRef, data.fiscal_address ?? data.full_address ?? data.address ?? '')
    setRefValue(zoneCodeRef, data.zone_code ?? '')
    setRefValue(domicileRef, data.domicile ?? '')
    setRefValue(domicileConditionRef, data.domicile_condition ?? '')
    setRefValue(interiorRef, data.interior ?? '')
    setRefValue(kilometerRef, data.kilometer ?? '')
    setRefValue(blockRef, data.block ?? '')
    setRefValue(lotRef, data.lot ?? '')
    setRefValue(streetNameRef, data.street_name ?? '')
    setRefValue(streetTypeRef, data.street_type ?? '')
    setRefValue(addressNumberRef, data.address_number ?? '')
    setRefValue(zoneTypeRef, data.zone_type ?? '')
    setRefValue(apartmentRef, data.apartment ?? '')
    setRefValue(departmentRef, data.department ?? '')
    setRefValue(provinceRef, data.province ?? '')
    setRefValue(districtRef, data.district ?? '')
    setRefValue(serviceUbigeoRef, data.ubigeo ?? '')
    setRefValue(taxpayerStatusRef, data.taxpayer_status ?? '')
    setRefValue(taxLastUpdatedAtRef, data.tax_last_updated_at ?? '')
    setRefValue(notesRef, data.notes ?? '')
    const nextStatus = data.status === false || data.status === 0 ? '0' : '1'
    setRefValue(statusRef, nextStatus)
    setStatusValue(nextStatus)
  }

  const onModalOpen = (data = null, forcedKind = null) => {
    const nextKind = forcedKind ?? data?.client_kind ?? getCreateKindFromFilter(quickFilter, defaultClientKind)

    setIsEditing(!!data?.id || !!data?.entity_id)
    setClientKind(nextKind)
    clearForm(nextKind)
    setIsSearchingDocument(false)
    setIsDocumentDataLocked(false)
    setLastLookedDocumentKey('')

    if (data?.id || data?.entity_id) {
      const nextType = data.document_type ?? 'dni'
      const currentType = documentType
      setDocumentType(nextType)
      if (nextType !== currentType) {
        pendingModalDataRef.current = data
      } else {
        populateModalData(data)
      }
    } else {
      setDocumentType(serviceContext ? 'ruc' : 'dni')
      pendingModalDataRef.current = null
    }

    $(modalRef.current).modal('show')
  }

  useEffect(() => {
    if (!pendingModalDataRef.current) return
    populateModalData(pendingModalDataRef.current)
    pendingModalDataRef.current = null
  }, [documentType])

  useEffect(() => () => {
    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current)
  }, [])

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const rawEmailValue = getRefValue(emailRef).trim()
    const invalidEmails = storageContext ? invalidEmailList(rawEmailValue) : []
    if (invalidEmails.length) {
      await Swal.fire({
        icon: 'warning',
        title: 'Correo invalido',
        text: `Revisa: ${invalidEmails.join(', ')}`
      })
      return
    }

    const emailValue = storageContext ? normalizeEmailList(rawEmailValue) : rawEmailValue
    if (storageContext) setRefValue(emailRef, emailValue)

    const request = {
      id: getRefValue(idRef) || undefined,
      data_source: storageContext ? 'client' : (getRefValue(dataSourceRef) || (clientKind === 'eventual' ? 'eventual_client' : 'client')),
      client_kind: storageContext ? 'regular' : clientKind,
      document_type: documentType,
      document_number: normalizeDigits(getRefValue(documentNumberRef)),
      full_name: getRefValue(fullNameRef).trim(),
      has_storage_service: storageContext ? true : getRefChecked(hasStorageServiceRef),
      storage_tariff_enabled: storageContext ? getRefChecked(storageTariffEnabledRef) : undefined,
      contract_due_days: storageContext ? '' : getRefValue(contractDueDaysRef).trim(),
      commercial_channel: storageContext ? '' : getRefValue(commercialChannelRef).trim(),
      segment: storageContext ? '' : getRefValue(segmentRef).trim(),
      email: emailValue,
      billing_email: storageContext ? emailValue : getRefValue(billingEmailRef).trim(),
      primary_contact: storageContext ? '' : getRefValue(primaryContactRef).trim(),
      primary_contact_phone: storageContext ? '' : getRefValue(primaryContactPhoneRef).trim(),
      phone: getRefValue(phoneRef).trim(),
      phone_prefix: normalizePrefix(phonePrefix) || '51',
      short_code: getRefValue(shortCodeRef).trim(),
      ubigeo: serviceContext ? getRefValue(serviceUbigeoRef).trim() : (storageContext ? '' : (ubigeoLocation.ubigeo?.trim?.() ?? '')),
      full_address: serviceContext ? getRefValue(fiscalAddressRef).trim() : getRefValue(addressRef).trim(),
      fiscal_address: serviceContext ? getRefValue(fiscalAddressRef).trim() : undefined,
      zone_code: serviceContext ? getRefValue(zoneCodeRef).trim() : undefined,
      domicile: serviceContext ? getRefValue(domicileRef).trim() : undefined,
      domicile_condition: serviceContext ? getRefValue(domicileConditionRef).trim() : undefined,
      interior: serviceContext ? getRefValue(interiorRef).trim() : undefined,
      kilometer: serviceContext ? getRefValue(kilometerRef).trim() : undefined,
      block: serviceContext ? getRefValue(blockRef).trim() : undefined,
      lot: serviceContext ? getRefValue(lotRef).trim() : undefined,
      street_name: serviceContext ? getRefValue(streetNameRef).trim() : undefined,
      street_type: serviceContext ? getRefValue(streetTypeRef).trim() : undefined,
      address_number: serviceContext ? getRefValue(addressNumberRef).trim() : undefined,
      zone_type: serviceContext ? getRefValue(zoneTypeRef).trim() : undefined,
      apartment: serviceContext ? getRefValue(apartmentRef).trim() : undefined,
      department: serviceContext ? getRefValue(departmentRef).trim() : undefined,
      province: serviceContext ? getRefValue(provinceRef).trim() : undefined,
      district: serviceContext ? getRefValue(districtRef).trim() : undefined,
      taxpayer_status: serviceContext ? getRefValue(taxpayerStatusRef).trim() : undefined,
      tax_last_updated_at: serviceContext ? getRefValue(taxLastUpdatedAtRef).trim() : undefined,
      notes: getRefValue(notesRef).trim(),
      status: (storageContext || serviceContext) ? statusValue : (getRefValue(statusRef) || undefined),
    }

    const result = await clientsRest.save(request)
    if (!result) return

    refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async (data) => {
    const result = await clientsRest.boolean({
      id: data.entity_id ?? data.id,
      field: 'status',
      value: !data.status,
      client_kind: data.client_kind,
      data_source: data.data_source,
    })
    if (!result) return
    refresh()
  }

  const onDeleteClicked = async (data) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar cliente',
      text: 'Estas seguro de eliminar este cliente? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await clientsRest.delete(data)
    if (!result) return
    refresh()
  }

  const refreshUsersGrid = () => usersTableRef.current?.refresh()

  const refreshNotificationsGrid = () => notificationsTableRef.current?.refresh()

  const refreshContractsGrid = () => contractsTableRef.current?.refresh()

  const selectedClientId = selectedClientForUsers?.entity_id ?? selectedClientForUsers?.id ?? null
  const selectedClientName = selectedClientForUsers?.display_name ?? selectedClientForUsers?.full_name ?? selectedClientForUsers?.business_name ?? ''
  const usersFilterValue = useMemo(() => (
    selectedClientId ? ['storage_client_id', '=', selectedClientId] : ['storage_client_id', '=', null]
  ), [selectedClientId])
  const selectedNotificationClientId = selectedClientForNotifications?.entity_id ?? selectedClientForNotifications?.id ?? null
  const selectedNotificationClientName = selectedClientForNotifications?.display_name ?? selectedClientForNotifications?.full_name ?? selectedClientForNotifications?.business_name ?? ''
  const notificationsFilterValue = useMemo(() => (
    selectedNotificationClientId ? ['client_id', '=', selectedNotificationClientId] : ['client_id', '=', null]
  ), [selectedNotificationClientId])
  const selectedTariffClientId = selectedClientForTariff?.entity_id ?? selectedClientForTariff?.id ?? null
  const selectedTariffClientName = selectedClientForTariff?.display_name ?? selectedClientForTariff?.full_name ?? selectedClientForTariff?.business_name ?? ''
  const selectedContractClientId = selectedClientForContracts?.entity_id ?? selectedClientForContracts?.id ?? null
  const selectedContractClientName = selectedClientForContracts?.display_name ?? selectedClientForContracts?.full_name ?? selectedClientForContracts?.business_name ?? ''
  const selectedContractClientDocument = selectedClientForContracts?.document_number ?? ''
  const contractsFilterValue = useMemo(() => (
    selectedContractClientId ? ['client_id', '=', selectedContractClientId] : ['client_id', '=', null]
  ), [selectedContractClientId])
  const savedContractAnnexes = Array.isArray(contractEditingData?.annexes) ? contractEditingData.annexes : []
  const hasSavedContractFile = !!(contractEditingData?.id && contractEditingData?.file_path)

  const getNotificationLabel = (value) => {
    const option = notificationOptions.find(current => getNotificationOptionValue(current) === `${value ?? ''}`)
    return getNotificationOptionLabel(option)
  }

  const onUsersModalOpen = (data) => {
    setSelectedClientForUsers(data)
    setTimeout(() => {
      $(usersModalRef.current).modal('show')
      setTimeout(refreshUsersGrid, 150)
    }, 0)
  }

  const onNotificationsModalOpen = (data) => {
    setSelectedClientForNotifications(data)
    setTimeout(() => {
      $(notificationsModalRef.current).modal('show')
      setTimeout(refreshNotificationsGrid, 150)
    }, 0)
  }

  const clearNotificationForm = () => {
    setRefValue(notificationIdRef, '')
    setRefValue(notificationSelectRef, '')
    setRefValue(notificationToRef, '')
    setRefValue(notificationCcRef, '')
    setNotificationValue('')
    setIsNotificationEditing(false)
  }

  const onNotificationEditClicked = (data = null) => {
    clearNotificationForm()
    if (!data?.id) return

    const nextValue = data.notification_key ?? data.mailing_template_id ?? ''
    setRefValue(notificationIdRef, data.id)
    setRefValue(notificationSelectRef, nextValue)
    setRefValue(notificationToRef, data.to_emails ?? '')
    setRefValue(notificationCcRef, data.cc_emails ?? '')
    setNotificationValue(nextValue)
    setIsNotificationEditing(true)
  }

  const onNotificationSubmit = async (e) => {
    e.preventDefault()
    if (!selectedNotificationClientId) return

    const currentNotificationValue = notificationValue || getRefValue(notificationSelectRef)
    const currentNotificationName = getNotificationLabel(currentNotificationValue)
    if (!currentNotificationValue || !currentNotificationName) {
      await Swal.fire({
        icon: 'warning',
        title: 'Selecciona una notificacion',
        text: 'Debes elegir la notificacion antes de registrar.'
      })
      return
    }

    const toEmails = normalizeEmailList(getRefValue(notificationToRef))
    const ccEmails = normalizeEmailList(getRefValue(notificationCcRef))
    const invalidEmails = [...invalidEmailList(toEmails), ...invalidEmailList(ccEmails)]
    if (!toEmails || invalidEmails.length) {
      await Swal.fire({
        icon: 'warning',
        title: 'Correos invalidos',
        text: invalidEmails.length ? `Revisa: ${invalidEmails.join(', ')}` : 'Agrega al menos un correo en Para.'
      })
      return
    }

    const result = await storageClientNotificationsRest.save({
      id: getRefValue(notificationIdRef) || undefined,
      client_id: selectedNotificationClientId,
      notification_key: currentNotificationValue,
      notification_name: currentNotificationName,
      to_emails: toEmails,
      cc_emails: ccEmails,
      status: true
    })
    if (!result) return

    clearNotificationForm()
    refreshNotificationsGrid()
  }

  const onNotificationDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar notificacion',
      text: 'Estas seguro de eliminar esta notificacion? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await storageClientNotificationsRest.delete(id)
    if (!result) return
    if (getRefValue(notificationIdRef) === `${id}`) clearNotificationForm()
    refreshNotificationsGrid()
  }

  const clearTariffForm = () => {
    setRefValue(tariffIdRef, '')
    setRefValue(tariffTemperatureRef, '')
    setRefValue(tariffCurrencyRef, '')
    setTariffTemperature('')
    setTariffCurrency('')
  }

  const onTariffModalOpen = async (data) => {
    const clientId = data?.entity_id ?? data?.id
    setSelectedClientForTariff(data)
    clearTariffForm()
    setTimeout(() => $(tariffModalRef.current).modal('show'), 0)

    if (!clientId) return
    const result = await storageClientTariffsRest.getByClient(clientId)
    if (!result) return

    setRefValue(tariffIdRef, result.id)
    setRefValue(tariffTemperatureRef, result.temperature_range ?? '')
    setRefValue(tariffCurrencyRef, result.currency ?? '')
    setTariffTemperature(result.temperature_range ?? '')
    setTariffCurrency(result.currency ?? '')
  }

  const onTariffSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTariffClientId) return

    if (!tariffTemperature || !tariffCurrency) {
      await Swal.fire({
        icon: 'warning',
        title: 'Completa el tarifario',
        text: 'Debes seleccionar temperatura y moneda.'
      })
      return
    }

    const result = await storageClientTariffsRest.save({
      id: getRefValue(tariffIdRef) || undefined,
      client_id: selectedTariffClientId,
      temperature_range: tariffTemperature,
      currency: tariffCurrency,
    })
    if (!result) return

    $(tariffModalRef.current).modal('hide')
    refresh()
  }

  const clearContractForm = () => {
    setRefValue(contractIdRef, '')
    setRefValue(contractCodeRef, '')
    setRefValue(contractStartRef, '')
    setRefValue(contractEndRef, '')
    setRefValue(contractFileRef, '')
    setRefValue(contractAnnexesRef, '')
    setContractEditingData(null)
    setContractAnnexFiles([])
    setIsContractEditing(false)
  }

  const onContractAnnexesChanged = (e) => {
    const selectedFiles = Array.from(e.target.files ?? [])
    if (!selectedFiles.length) return

    setContractAnnexFiles((currentFiles) => {
      const knownFiles = new Set(currentFiles.map(fileIdentity))
      const newFiles = selectedFiles.filter((file) => !knownFiles.has(fileIdentity(file)))
      return [...currentFiles, ...newFiles]
    })

    e.target.value = ''
  }

  const removeContractAnnexFile = (index) => {
    setContractAnnexFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index))
  }

  const onContractOfficialFileDeleteClicked = async () => {
    const contractId = contractEditingData?.id || getRefValue(contractIdRef)
    if (!contractId) return

    const { isConfirmed } = await storageContractConfirm({
      title: 'Eliminar documento oficial',
      text: 'El documento oficial se quitara del contrato.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await storageClientContractsRest.deleteFile(contractId)
    if (!result) return

    setContractEditingData((current) => current ? {
      ...current,
      file_path: null,
      file_name: null,
      file_mime: null,
    } : current)
    refreshContractsGrid()
  }

  const onContractAnnexDeleteClicked = async (annex) => {
    if (!annex?.id) return

    const { isConfirmed } = await storageContractConfirm({
      title: 'Eliminar anexo',
      text: 'El anexo se quitara del contrato.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await storageClientContractsRest.deleteAnnex(annex.id)
    if (!result) return

    setContractEditingData((current) => current ? {
      ...current,
      annexes: (current.annexes ?? []).filter((item) => item.id !== annex.id),
      annexes_count: Math.max(0, Number(current.annexes_count ?? 1) - 1),
    } : current)
    refreshContractsGrid()
  }

  const onContractsModalOpen = (data) => {
    setSelectedClientForContracts(data)
    clearContractForm()
    setTimeout(() => {
      $(contractsModalRef.current).modal('show')
      setTimeout(refreshContractsGrid, 150)
    }, 0)
  }

  const onContractCreateClicked = () => {
    clearContractForm()
    setTimeout(() => $(contractFormModalRef.current).modal('show'), 0)
  }

  const onContractEditClicked = (data = null) => {
    clearContractForm()
    if (!data?.id) return

    setIsContractEditing(true)
    setContractEditingData({
      ...data,
      annexes: Array.isArray(data.annexes) ? data.annexes : []
    })
    setRefValue(contractIdRef, data.id)
    setRefValue(contractCodeRef, data.contract_code ?? '')
    setRefValue(contractStartRef, data.starts_at ? data.starts_at.toString().slice(0, 10) : '')
    setRefValue(contractEndRef, data.ends_at ? data.ends_at.toString().slice(0, 10) : '')
    setTimeout(() => $(contractFormModalRef.current).modal('show'), 0)
  }

  const onContractSubmit = async (e) => {
    e.preventDefault()
    if (!selectedContractClientId) return

    const code = getRefValue(contractCodeRef).trim()
    const startsAt = getRefValue(contractStartRef)
    const endsAt = getRefValue(contractEndRef)
    const id = getRefValue(contractIdRef)
    const file = contractFileRef.current?.files?.[0] ?? null
    const annexFiles = contractAnnexFiles
    const oversizedFile = [file, ...annexFiles].filter(Boolean).find((item) => item.size > MAX_CONTRACT_FILE_BYTES)

    if (!code || !startsAt || !endsAt || (!id && !file)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Completa el contrato',
        text: 'Debes ingresar codigo, fechas y documento oficial.'
      })
      return
    }

    if (oversizedFile) {
      await Swal.fire({
        icon: 'warning',
        title: 'Archivo muy grande',
        text: `${oversizedFile.name} supera el limite de ${MAX_CONTRACT_FILE_MB}MB.`
      })
      return
    }

    const request = new FormData()
    if (id) request.append('id', id)
    request.append('client_id', selectedContractClientId)
    request.append('contract_code', code)
    request.append('starts_at', startsAt)
    request.append('ends_at', endsAt)
    if (file) request.append('file', file)
    annexFiles.forEach((annex) => request.append('annexes[]', annex))

    const result = await storageClientContractsRest.save(request)
    if (!result) return

    $(contractFormModalRef.current).modal('hide')
    clearContractForm()
    refreshContractsGrid()
  }

  const onContractDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar contrato',
      text: 'Estas seguro de eliminar este contrato? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await storageClientContractsRest.delete(id)
    if (!result) return
    if (getRefValue(contractIdRef) === `${id}`) clearContractForm()
    refreshContractsGrid()
  }

  const clearUserForm = () => {
    setRefValue(userIdRef, '')
    setRefValue(userNameRef, '')
    setRefValue(userLastNameFatherRef, '')
    setRefValue(userLastNameMotherRef, '')
    setRefValue(userEmailRef, '')
    setRefValue(userUsernameRef, '')
    setRefValue(userPasswordRef, '')
    setRefValue(userPhoneRef, '')
    setRefValue(userPhonePrefixRef, '51')
    setRefValue(userStatusRef, '1')
    setUserStatus('1')
  }

  const onUserModalOpen = (data = null) => {
    setIsUserEditing(!!data?.uuid)
    clearUserForm()

    if (data?.uuid) {
      setRefValue(userIdRef, data.uuid)
      setRefValue(userNameRef, data.name ?? '')
      const [lastNameFather = '', ...lastNameMotherParts] = (data.lastname ?? '').trim().split(/\s+/).filter(Boolean)
      setRefValue(userLastNameFatherRef, lastNameFather)
      setRefValue(userLastNameMotherRef, lastNameMotherParts.join(' '))
      setRefValue(userEmailRef, data.email ?? '')
      setRefValue(userUsernameRef, data.username ?? '')
      setRefValue(userPhoneRef, data.phone ?? '')
      const normalizedPrefix = normalizePrefix(data.phone_prefix) || '51'
      setRefValue(userPhonePrefixRef, normalizedPrefix)
      const nextStatus = data.status === false || data.status === 0 ? '0' : '1'
      setRefValue(userStatusRef, nextStatus)
      setUserStatus(nextStatus)
    }

    $(userFormModalRef.current).modal('show')
  }

  const onUserModalSubmit = async (e) => {
    e.preventDefault()

    if (!selectedClientId) return

    const request = {
      id: getRefValue(userIdRef) || undefined,
      storage_client_id: selectedClientId,
      name: getRefValue(userNameRef).trim(),
      lastname: [getRefValue(userLastNameFatherRef), getRefValue(userLastNameMotherRef)].map(value => value.trim()).filter(Boolean).join(' '),
      email: getRefValue(userEmailRef).trim(),
      username: isUserEditing ? undefined : getRefValue(userUsernameRef).trim(),
      password: isUserEditing ? undefined : getRefValue(userPasswordRef),
      phone_prefix: normalizePrefix(getRefValue(userPhonePrefixRef)) || '51',
      phone: getRefValue(userPhoneRef).trim(),
      status: userStatus || getRefValue(userStatusRef) || '1',
      scope: DEFAULT_STORAGE_USER_SCOPES,
    }

    const result = await usersRest.save(request)
    if (!result) return

    refreshUsersGrid()
    $(userFormModalRef.current).modal('hide')
  }

  const onUserBooleanChange = async ({ id, field, value }) => {
    const result = await usersRest.boolean({ id, field, value })
    if (!result) return
    refreshUsersGrid()
  }

  const onUserDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar usuario',
      text: 'Estas seguro de eliminar este usuario? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await usersRest.delete(id)
    if (!result) return
    refreshUsersGrid()
  }

  const isIdentityBlocked = isEditing || (isDocumentDataLocked && ['dni', 'ruc'].includes(documentType))

  return (<>
    <VdTable
      key={quickFilter}
      ref={tableRef}
      rest={clientsRest}
      icon="mdi mdi-account-multiple"
      title={serviceContext ? 'Clientes' : `Lista de ${sectionTitle}`}
      unit="clientes"
      defaultPageSize={serviceContext ? 10 : 25}
      baseFilter={filterValue}
      searchFields={serviceContext
        ? ['document_number', 'display_name', 'fiscal_address', 'full_address', 'short_code']
        : ['document_number', 'display_name', 'full_name', 'business_name', 'email', 'primary_contact']}
      searchPlaceholder="Buscar cliente…"
      emptyText="No se encontraron clientes."
      toolbar={(!storageContext && !serviceContext) ? (
        <div className="d-flex flex-wrap align-items-center gap-2">
          {QUICK_FILTERS.map(filter => (
            <button
              key={filter.key}
              type="button"
              className={`btn btn-sm ${quickFilter === filter.key ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setQuickFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen(null, getCreateKindFromFilter(quickFilter, defaultClientKind))}>
          <i className="mdi mdi-plus"></i> Nuevo cliente {getCreateKindFromFilter(quickFilter, defaultClientKind) === 'eventual' ? 'eventual' : ''}
        </button>
      </>}
      actions={(row) => {
        if (serviceContext) return [
          { icon: 'mdi mdi-pencil', title: 'Editar cliente', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
          { icon: 'mdi mdi-delete', title: 'Eliminar cliente', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r) },
        ]
        const list = [{ icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) }]
        if (storageContext) {
          list.push({ icon: 'mdi mdi-currency-usd', title: 'Tarifario', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => onTariffModalOpen(r) })
          list.push({ icon: 'mdi mdi-file-document', title: 'Contrato cliente', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => onContractsModalOpen(r) })
          list.push({ icon: 'mdi mdi-account-group', title: 'Mantenimiento usuarios', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => onUsersModalOpen(r) })
          list.push({ icon: 'mdi mdi-send', title: 'Notificaciones cliente', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => onNotificationsModalOpen(r) })
        }
        list.push({ icon: 'mdi mdi-delete', title: 'Eliminar cliente', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r) })
        return list
      }}
      columns={serviceContext ? [
        {
          key: 'id', label: 'ID', field: 'entity_id', width: '80px', filter: { type: 'number' },
          render: (row) => String(row?.entity_id ?? '').padStart(3, '0'),
        },
        { key: 'ruc', label: 'RUC', field: 'document_number', width: '140px', filter: { type: 'text' } },
        {
          key: 'razon', label: 'Razón social', field: 'display_name', filter: { type: 'text', fields: ['display_name', 'full_name'] },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar cliente">
              {row?.display_name ?? row?.full_name ?? '-'}
            </a>
          ),
        },
        {
          key: 'fiscal', label: 'Dirección fiscal', field: 'fiscal_address', filter: { type: 'text', fields: ['fiscal_address', 'full_address'] },
          render: (row) => row.fiscal_address ?? row.full_address ?? '',
        },
        { key: 'short', label: 'Código corto', field: 'short_code', width: '140px', filter: { type: 'text' } },
        {
          key: 'due', label: 'Días vcto. contrato', field: 'contract_due_days', width: '165px', align: 'right',
          render: (row) => row.contract_due_days ? <span className="badge bg-success">{row.contract_due_days}</span> : '',
        },
        {
          key: 'estado', label: 'Estado', field: 'status', width: '110px',
          filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => <StatusBadge value={row.status} />,
        },
      ] : [
        { key: 'id', label: 'ID', field: 'entity_id', width: '80px', filter: { type: 'number' } },
        {
          key: 'tipo', label: 'Tipo', field: 'client_kind', width: '105px', align: 'center',
          filter: { type: 'select', field: 'client_kind', options: [{ value: 'regular', label: 'Regular' }, { value: 'eventual', label: 'Eventual' }] },
          render: (row) => row.client_kind === 'eventual'
            ? <span className="badge bg-warning text-dark">Eventual</span>
            : <span className="badge bg-primary">Regular</span>,
        },
        { key: 'tipodoc', label: 'Tipo Doc.', field: 'document_type', width: '95px', filter: { type: 'text' } },
        { key: 'numero', label: 'Número', field: 'document_number', width: '125px', filter: { type: 'text' } },
        {
          key: 'cliente', label: 'Cliente', field: 'display_name', filter: { type: 'text', fields: ['display_name', 'full_name', 'business_name'] },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar cliente">
              {row?.display_name ?? row?.full_name ?? '-'}
            </a>
          ),
        },
        { key: 'compras', label: 'Compras', field: 'purchase_count', width: '95px', align: 'right', filter: { type: 'number' } },
        {
          key: 'habitual', label: 'Habitual', field: 'is_habitual', width: '110px', align: 'center', sortable: false,
          render: (row) => row?.is_habitual
            ? <span className="badge bg-success"><i className="mdi mdi-star me-1"></i>Habitual</span>
            : <span className="badge bg-soft-secondary">—</span>,
        },
        {
          key: 'ultima', label: 'Última compra', field: 'last_purchase_at', width: '120px', filter: { type: 'date' },
          render: (row) => formatDate(row.last_purchase_at),
        },
        { key: 'correo', label: 'Correo', field: 'email', filter: { type: 'text' } },
        {
          key: 'celular', label: 'Celular', field: 'phone', width: '140px', sortable: false,
          render: (row) => {
            const prefix = normalizePrefix(row.phone_prefix)
            return `${prefix ? `+${prefix}` : ''} ${row.phone ?? ''}`.trim()
          },
        },
        {
          key: 'contacto', label: 'Contacto', field: 'primary_contact', filter: { type: 'text', fields: ['primary_contact', 'contact_name'] },
          render: (row) => row.primary_contact ?? row.contact_name ?? '',
        },
        {
          key: 'direccion', label: 'Dirección', field: 'full_address', filter: { type: 'text', fields: ['full_address', 'address'] },
          render: (row) => row.full_address ?? row.address ?? '',
        },
        {
          key: 'almacenamiento', label: 'Almacenamiento', field: 'has_storage_service', width: '130px', sortable: false,
          render: (row) => <SwitchFormGroup checked={!!row.has_storage_service} disabled noMargin />,
        },
        { key: 'diasvcto', label: 'Días vcto.', field: 'contract_due_days', width: '105px', visible: false },
        { key: 'canal', label: 'Canal', field: 'commercial_channel', visible: false },
        { key: 'segmento', label: 'Segmento', field: 'segment', visible: false },
        { key: 'correofact', label: 'Correo facturación', field: 'billing_email', visible: false },
        { key: 'codigocorto', label: 'Código corto', field: 'short_code', visible: false },
        { key: 'ubigeo', label: 'Ubigeo', field: 'ubigeo', visible: false },
        { key: 'notas', label: 'Notas', field: 'notes', visible: false },
        { key: 'creador', label: 'Creado por', field: 'creator_label', visible: false },
        { key: 'actualizador', label: 'Actualizado por', field: 'updater_label', visible: false },
        {
          key: 'estado', label: 'Estado', field: 'status', width: '95px',
          filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => row.status === null
            ? ''
            : <SwitchFormGroup checked={row.status == 1} onChange={() => onBooleanChange(row)} />,
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.display_name ?? row.full_name ?? '-'}</p>
              <small className="text-muted">{[(row.document_type || '').toUpperCase(), row.document_number].filter(Boolean).join(' · ')}</small>
            </div>
            {row.status !== null && <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>}
          </div>
          {row.email && <small className="text-muted d-block mt-2"><i className="mdi mdi-email-outline me-1"></i>{row.email}</small>}
          {!serviceContext && <small className="text-muted d-block mt-1"><i className="mdi mdi-cart-outline me-1"></i>{row.purchase_count ?? 0} compras</small>}
          {actionButtons && <div className="d-flex mt-3 pt-3 flex-wrap" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={serviceContext ? 'Cliente' : (storageContext ? 'Formulario cliente' : (isEditing ? `Editar cliente ${kindLabel}` : `Agregar cliente ${kindLabel}`))} onSubmit={onModalSubmit} size={storageContext || serviceContext ? 'xl' : 'lg'} btnSubmitText={serviceContext ? 'Registrar' : (storageContext ? 'Registrar cliente' : 'Guardar')}>
      <div className='row'>
        <input ref={idRef} type='hidden' />
        <input ref={dataSourceRef} type='hidden' />
        {serviceContext && <>
          <input ref={clientKindRef} type='hidden' />
          <input ref={documentTypeRef} type='hidden' />
          <input ref={phonePrefixRef} type='hidden' />
          <div className='col-12 mb-3'>
            <div className='row justify-content-center'>
              <div className='col-md-6'>
                <label className='form-label'>RUC o DNI</label>
                <div className='input-group'>
                  <input ref={documentLookupRef} className='form-control' onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      onServiceDocumentSearch()
                    }
                  }} />
                  <button type='button' className='btn btn-outline-primary' title='Buscar documento' onClick={onServiceDocumentSearch}>
                    <i className='mdi mdi-magnify'></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className='col-md-6 mb-3'><label className='form-label'>RUC</label><input ref={documentNumberRef} className='form-control' required /></div>
          <div className='col-md-6 mb-3'><label className='form-label'>Razon social</label><input ref={fullNameRef} className='form-control' required /></div>
          <div className='col-md-9 mb-3'><label className='form-label'>Direccion fiscal</label><input ref={fiscalAddressRef} className='form-control' /></div>
          <div className='col-md-3 mb-3'><label className='form-label'>Codigo de Zona</label><input ref={zoneCodeRef} className='form-control' /></div>
          <div className='col-md-9 mb-3'><label className='form-label'>Domicilio</label><input ref={domicileRef} className='form-control' /></div>
          <div className='col-md-3 mb-3'><label className='form-label'>Condicion de Domicilio</label><input ref={domicileConditionRef} className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Interior</label><input ref={interiorRef} className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Kilometro</label><input ref={kilometerRef} className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Manzana</label><input ref={blockRef} className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Lote</label><input ref={lotRef} className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Nombre de Via</label><input ref={streetNameRef} className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Tipo de Via</label><input ref={streetTypeRef} className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Numero</label><input ref={addressNumberRef} className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Tipo de Zona</label><input ref={zoneTypeRef} className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Dpto</label><input ref={apartmentRef} className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Ubigeo</label><input ref={serviceUbigeoRef} className='form-control' /></div>
          <div className='col-md-4 mb-3'><label className='form-label'>Ultima Actualizacion</label><input ref={taxLastUpdatedAtRef} className='form-control' /></div>
          <div className='col-md-4 mb-3'><label className='form-label'>Departamento</label><input ref={departmentRef} className='form-control' /></div>
          <div className='col-md-4 mb-3'><label className='form-label'>Provincia</label><input ref={provinceRef} className='form-control' /></div>
          <div className='col-md-4 mb-3'><label className='form-label'>Distrito</label><input ref={districtRef} className='form-control' /></div>
          <div className='col-md-4 mb-3'><label className='form-label'>Estado del Contribuyente</label><input ref={taxpayerStatusRef} className='form-control' /></div>
          <div className='col-md-4 mb-3'><label className='form-label'>Codigo corto</label><input ref={shortCodeRef} className='form-control' /></div>
          <VdSelect
            label='Estado'
            col='col-md-4'
            required
            value={statusValue}
            onChange={(value) => { setStatusValue(value); setRefValue(statusRef, value) }}
            options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}
          />
        </>}
        {storageContext && <>
          <input ref={clientKindRef} type='hidden' />
          <input ref={phonePrefixRef} type='hidden' />
        </>}

        {!storageContext && !serviceContext && <VdSelect
          label='Tipo de cliente'
          col='col-md-4'
          required
          disabled={isEditing}
          value={clientKind}
          onChange={(value) => setClientKind(value || defaultClientKind)}
          options={[{ value: 'regular', label: 'Regular' }, { value: 'eventual', label: 'Eventual' }]}
        />}

        {!serviceContext && <VdSelect
          label={storageContext ? 'Tipo de Documento' : 'Tipo Doc.'}
          col={storageContext ? 'col-md-2' : 'col-md-4'}
          required
          disabled={isEditing}
          value={documentType}
          onChange={onDocumentTypeChanged}
          options={[
            { value: 'dni', label: 'DNI' },
            { value: 'ce', label: storageContext ? 'CARNE DE EXTRANJERIA' : 'CE' },
            { value: 'ruc', label: 'RUC' },
          ]}
        />}

        {!serviceContext && <InputFormGroup
          eRef={documentNumberRef}
          label={`${storageContext ? 'Nro Documento' : 'Documento'}${isSearchingDocument ? ' (consultando...)' : ''}`}
          col={storageContext ? 'col-md-4' : 'col-md-4'}
          required
          disabled={isEditing}
          max={docMaxLength}
          onChange={onDocumentNumberChanged}
          onKeyDown={(e) => {
            if (e.ctrlKey || e.metaKey) return
            if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) e.preventDefault()
          }}
        />}

        {!serviceContext && <InputFormGroup eRef={fullNameRef} label={storageContext ? 'Razon Social' : displayNameLabel} col={storageContext ? 'col-md-6' : 'col-12'} required disabled={isIdentityBlocked} />}
        {storageContext && <>
          <InputFormGroup eRef={shortCodeRef} label='Codigo corto' col='col-md-6' />
          <InputFormGroup eRef={addressRef} label='Direccion' col='col-md-6' />
          <EmailTagsInput
            ref={emailRef}
            label='Emails para Envio de Comprobantes'
            placeholder='Para:'
            specification='Puedes separar varios correos con coma o punto y coma.'
            col='col-md-6'
          />
          <InputFormGroup eRef={phoneRef} label='Celular' col='col-md-6' />
          <VdSelect
            label='Estado'
            col='col-md-6'
            required
            value={statusValue}
            onChange={(value) => { setStatusValue(value); setRefValue(statusRef, value) }}
            options={[{ value: '1', label: 'ACTIVO' }, { value: '0', label: 'INACTIVO' }]}
          />
          <div className='form-group col-md-6 mb-2'>
            <label className='form-label d-block'>
              Tarifario por cliente <span className='text-danger'>(Referente al tarifario de servicio de almacen)</span>
            </label>
            <div className='form-check form-switch'>
              <input ref={storageTariffEnabledRef} type='checkbox' className='form-check-input' />
            </div>
          </div>
        </>}
        {!storageContext && !serviceContext && !isEventual && (
          <UbigeoCascade
            value={ubigeoLocation}
            onChange={setUbigeoLocation}
            showUbigeo={false}
            departmentCol='col-md-4'
            provinceCol='col-md-4'
            districtCol='col-md-4'
          />
        )}
        {!storageContext && !serviceContext && <TextareaFormGroup eRef={addressRef} label='Direccion completa' col='col-12' rows={2} />}

        {!storageContext && !serviceContext && !isEventual && (
          <>
            <div className='form-group col-md-4 mb-2'>
              <label className='form-label d-block'>Cuenta con servicio de almacenamiento</label>
              <div className='form-check form-switch'>
                <input ref={hasStorageServiceRef} type='checkbox' className='form-check-input' disabled={storageContext} />
              </div>
            </div>

            <InputFormGroup eRef={contractDueDaysRef} label='Dias vcto. contrato' col='col-md-4' type='number' min='0' />
          </>
        )}

        {!storageContext && !serviceContext && <InputFormGroup eRef={emailRef} label='Correo principal' col={isEventual ? 'col-md-6' : 'col-md-6'} type='email' />}
        {!storageContext && !serviceContext && !isEventual && <InputFormGroup eRef={billingEmailRef} label='Correo facturacion' col='col-md-6' type='email' />}

        {!storageContext && !serviceContext && <InputFormGroup eRef={primaryContactRef} label='Contacto principal' col={isEventual ? 'col-md-6' : 'col-md-6'} />}
        {!storageContext && !serviceContext && !isEventual && <InputFormGroup eRef={primaryContactPhoneRef} label='Telefono contacto' col='col-md-6' />}

        {!storageContext && !serviceContext && <VdSelect
          label='Prefijo celular'
          col='col-md-4'
          value={phonePrefix}
          onChange={(value) => setPhonePrefix(normalizePrefix(value))}
          options={prefixes.length
            ? prefixes.map((prefix) => ({ value: `${prefix.realCode}`, label: `${prefix.beautyCode} - ${prefix.country}` }))
            : [{ value: '51', label: '+51 - Peru' }]}
        />}
        {!storageContext && !serviceContext && <InputFormGroup eRef={phoneRef} label='Celular' col='col-md-4' />}
        {!storageContext && !serviceContext && !isEventual && <InputFormGroup eRef={shortCodeRef} label='Codigo corto' col='col-md-4' />}

        {!storageContext && !serviceContext && !isEventual && (
          <>
            <InputFormGroup eRef={commercialChannelRef} label='Canal comercial' col='col-md-6' />
            <InputFormGroup eRef={segmentRef} label='Segmento' col='col-md-6' />
          </>
        )}

        {!serviceContext && isEventual && (
          <div className='col-12'>
            <label className='form-label'>Notas</label>
            <textarea ref={notesRef} className='form-control' rows='3'></textarea>
          </div>
        )}
      </div>
    </Modal>

    {storageContext && <>
      <Modal
        id='modal-storage-contracts'
        modalRef={contractsModalRef}
        title='Contratos cliente'
        size='xl'
        hideFooter
        asForm={false}
        onSubmit={(e) => e.preventDefault()}
        onClose={() => {
          $(contractFormModalRef.current).modal('hide')
          setSelectedClientForContracts(null)
          clearContractForm()
        }}
      >
        <div className='row'>
          <div className='form-group col-md-4 mb-2'>
            <label className='form-label mb-1'>RUC Cliente</label>
            <input className='form-control' value={selectedContractClientDocument} readOnly />
          </div>
          <div className='form-group col-md-8 mb-2'>
            <label className='form-label mb-1'>Razon social</label>
            <input className='form-control' value={selectedContractClientName} readOnly />
          </div>
        </div>
        <VdTable
          key={`contracts-${selectedContractClientId ?? 'none'}`}
          ref={contractsTableRef}
          rest={storageClientContractsRest}
          icon="mdi mdi-file-document"
          title="Contratos registrados"
          unit="contratos"
          defaultPageSize={10}
          baseFilter={contractsFilterValue}
          searchFields={['contract_code', 'file_name']}
          searchPlaceholder="Buscar contrato…"
          emptyText="Sin contratos registrados."
          headerActions={<>
            <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refreshContractsGrid}>
              <i className="mdi mdi-refresh"></i>
            </button>
            <button type="button" className="vdt-btn-pri" disabled={!selectedContractClientId} onClick={onContractCreateClicked}>
              <i className="mdi mdi-plus"></i> Registrar contrato
            </button>
          </>}
          actions={(row) => [
            { icon: 'mdi mdi-pencil', title: 'Editar contrato', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onContractEditClicked(r) },
            { icon: 'mdi mdi-delete', title: 'Eliminar contrato', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onContractDeleteClicked(r.id) },
          ]}
          columns={[
            { key: 'id', label: '#', field: 'id', width: '70px', filter: { type: 'number' } },
            {
              key: 'estado', label: 'Estado', field: 'status', width: '95px',
              render: (row) => {
                const active = row.status === true || row.status === 1
                return <span className={`badge ${active ? 'bg-success' : 'badge-soft-secondary'}`}>{active ? 'Activo' : 'Inactivo'}</span>
              },
            },
            { key: 'codigo', label: 'Código', field: 'contract_code', filter: { type: 'text' } },
            { key: 'inicio', label: 'Fecha inicio', field: 'starts_at', width: '130px', render: (row) => formatDate(row.starts_at?.toString().slice(0, 10)) },
            { key: 'fin', label: 'Fecha fin', field: 'ends_at', width: '130px', render: (row) => formatDate(row.ends_at?.toString().slice(0, 10)) },
            {
              key: 'doc', label: 'Documento oficial', field: 'file_name', sortable: false,
              render: (row) => row.file_path
                ? <a href={`/api/admin/storage/client-contracts/${row.id}/file`} target="_blank" rel="noopener noreferrer" className="text-primary fw-semibold text-decoration-underline" title="Ver documento oficial">{row.file_name || 'Ver archivo'}</a>
                : '-',
            },
            {
              key: 'anexos', label: 'Anexos', field: 'annexes_count', sortable: false,
              render: (row) => {
                const annexes = Array.isArray(row.annexes) ? row.annexes : []
                if (!annexes.length) return '-'
                return <div className="d-flex flex-column gap-1">{annexes.map((annex, index) => (
                  <a key={annex.id ?? index} href={`/api/admin/storage/client-contract-annexes/${annex.id}/file`} target="_blank" rel="noopener noreferrer" className="text-primary fw-semibold text-decoration-underline" title="Ver anexo">{annex.file_name || `Anexo ${index + 1}`}</a>
                ))}</div>
              },
            },
            { key: 'registro', label: 'Fecha registro', field: 'created_at', width: '165px', render: (row) => formatDateTime(row.created_at) },
            { key: 'usuario', label: 'Usuario registro', field: 'creator_label', sortable: false },
          ]}
        />
      </Modal>

      <Modal
        id='modal-storage-contract-form'
        modalRef={contractFormModalRef}
        title={isContractEditing ? 'Editar contrato' : 'Registrar contrato'}
        size='lg'
        btnSubmitText={isContractEditing ? 'Actualizar' : 'Registrar'}
        onSubmit={onContractSubmit}
        onClose={clearContractForm}
        zIndex={1065}
      >
        <input ref={contractIdRef} type='hidden' />
        <style>{`
          .storage-contract-file-manager {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f8fafc;
            padding: 12px;
          }
          .storage-contract-file-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .storage-contract-file-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 12px;
            border: 1px solid #e9edf3;
            border-radius: 8px;
            background: #fff;
            padding: 10px 12px;
          }
          .storage-contract-file-name {
            min-width: 0;
            font-weight: 600;
            color: #344054;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .storage-contract-file-actions {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .storage-contract-file-actions .btn {
            width: 32px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
          }
          .storage-contract-swal-container {
            z-index: 20000 !important;
          }
        `}</style>
        <div className='row'>
          <div className='form-group col-md-4 mb-2'>
            <label className='form-label mb-1'>RUC Cliente</label>
            <input className='form-control' value={selectedContractClientDocument} readOnly />
          </div>
          <div className='form-group col-md-8 mb-2'>
            <label className='form-label mb-1'>Razon social</label>
            <input className='form-control' value={selectedContractClientName} readOnly />
          </div>
          <InputFormGroup eRef={contractCodeRef} label='Codigo Contrato' col='col-md-4' required />
          <div className='form-group col-md-4 mb-2'>
            <label htmlFor='storage-contract-start' className='form-label mb-1'>Fecha Inicio Contrato <b className='text-danger'>*</b></label>
            <input id='storage-contract-start' ref={contractStartRef} type='date' className='form-control' required />
          </div>
          <div className='form-group col-md-4 mb-2'>
            <label htmlFor='storage-contract-end' className='form-label mb-1'>Fecha Fin Contrato <b className='text-danger'>*</b></label>
            <input id='storage-contract-end' ref={contractEndRef} type='date' className='form-control' required />
          </div>
          <div className='form-group col-md-6 mb-2'>
            <label htmlFor='storage-contract-file' className='form-label mb-1'>
              Documento oficial {!isContractEditing && <b className='text-danger'>*</b>}
            </label>
            <input
              id='storage-contract-file'
              ref={contractFileRef}
              type='file'
              className='form-control'
              accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
            />
          </div>
          <div className='form-group col-md-6 mb-2'>
            <label htmlFor='storage-contract-annexes' className='form-label mb-1'>Anexos</label>
            <input
              id='storage-contract-annexes'
              ref={contractAnnexesRef}
              type='file'
              className='form-control'
              accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
              multiple
              onChange={onContractAnnexesChanged}
            />
          </div>
          {isContractEditing && <div className='col-12 mb-2'>
            <div className='storage-contract-file-manager'>
              <div className='row g-2'>
                <div className='col-12 col-lg-6'>
                  <div className='d-flex align-items-center justify-content-between mb-2'>
                    <span className='fw-semibold'>Documento oficial guardado</span>
                    <span className='badge bg-secondary'>{hasSavedContractFile ? '1' : '0'}</span>
                  </div>
                  {hasSavedContractFile ? (
                    <div className='storage-contract-file-row'>
                      <div className='storage-contract-file-name' title={contractEditingData.file_name || 'Documento oficial'}>
                        <i className='mdi mdi-file-document-outline me-1 text-primary'></i>
                        {contractEditingData.file_name || 'Documento oficial'}
                      </div>
                      <div className='storage-contract-file-actions'>
                        <a className='btn btn-soft-info' href={contractFileUrl(contractEditingData.id)} target='_blank' rel='noopener noreferrer' title='Ver documento'>
                          <i className='mdi mdi-eye'></i>
                        </a>
                        <a className='btn btn-soft-primary' href={contractFileUrl(contractEditingData.id, true)} title='Descargar documento'>
                          <i className='mdi mdi-download'></i>
                        </a>
                        <button type='button' className='btn btn-soft-danger' title='Eliminar documento' onClick={onContractOfficialFileDeleteClicked}>
                          <i className='mdi mdi-delete'></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className='text-muted border rounded bg-white px-2 py-2'>Sin documento oficial guardado</div>
                  )}
                </div>
                <div className='col-12 col-lg-6'>
                  <div className='d-flex align-items-center justify-content-between mb-2'>
                    <span className='fw-semibold'>Anexos guardados</span>
                    <span className='badge bg-secondary'>{savedContractAnnexes.length}</span>
                  </div>
                  {savedContractAnnexes.length > 0 ? (
                    <div className='storage-contract-file-list'>
                      {savedContractAnnexes.map((annex, index) => (
                        <div key={`saved-annex-${annex.id ?? index}`} className='storage-contract-file-row'>
                          <div className='storage-contract-file-name' title={annex.file_name || `Anexo ${index + 1}`}>
                            <i className='mdi mdi-paperclip me-1 text-primary'></i>
                            {annex.file_name || `Anexo ${index + 1}`}
                          </div>
                          <div className='storage-contract-file-actions'>
                            <a className='btn btn-soft-info' href={contractAnnexFileUrl(annex.id)} target='_blank' rel='noopener noreferrer' title='Ver anexo'>
                              <i className='mdi mdi-eye'></i>
                            </a>
                            <a className='btn btn-soft-primary' href={contractAnnexFileUrl(annex.id, true)} title='Descargar anexo'>
                              <i className='mdi mdi-download'></i>
                            </a>
                            <button type='button' className='btn btn-soft-danger' title='Eliminar anexo' onClick={() => onContractAnnexDeleteClicked(annex)}>
                              <i className='mdi mdi-delete'></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-muted border rounded bg-white px-2 py-2'>Sin anexos guardados</div>
                  )}
                </div>
              </div>
            </div>
          </div>}
          {contractAnnexFiles.length > 0 && <div className='col-12 mb-2'>
            <div className='border rounded p-2 bg-light'>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <span className='fw-semibold'>Anexos seleccionados</span>
                <span className='badge bg-primary'>{contractAnnexFiles.length}</span>
              </div>
              <div className='d-flex flex-column gap-1'>
                {contractAnnexFiles.map((annex, index) => (
                  <div key={`${fileIdentity(annex)}-${index}`} className='d-flex align-items-center justify-content-between gap-2 bg-white border rounded px-2 py-1'>
                    <span className='text-truncate'>{annex.name} <small className='text-muted'>({formatFileSize(annex.size)})</small></span>
                    <button type='button' className='btn btn-xs btn-soft-danger flex-shrink-0' title='Quitar anexo' onClick={() => removeContractAnnexFile(index)}>
                      <i className='mdi mdi-close'></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>}
        </div>
      </Modal>

      <Modal
        id='modal-storage-tariff'
        modalRef={tariffModalRef}
        title='Tarifario'
        size='xl'
        hideFooter
        onSubmit={onTariffSubmit}
        onClose={() => {
          setSelectedClientForTariff(null)
          clearTariffForm()
        }}
      >
        <input ref={tariffIdRef} type='hidden' />
        {selectedTariffClientName && <div className='d-flex justify-content-end mb-2'>
          <span className='badge badge-soft-secondary fs-14'>{selectedTariffClientName}</span>
        </div>}
        <div className='row justify-content-center'>
          <div className='col-md-4'>
            <VdSelect
              label='Temperatura'
              col='col-12'
              required
              value={tariffTemperature}
              onChange={(value) => setTariffTemperature(value)}
              options={STORAGE_TEMPERATURE_OPTIONS}
              placeholder='Seleccione temperatura'
            />
            <VdSelect
              label='Moneda'
              col='col-12'
              required
              value={tariffCurrency}
              onChange={(value) => setTariffCurrency(value)}
              options={STORAGE_CURRENCY_OPTIONS}
              placeholder='Seleccione moneda'
            />
          </div>
        </div>
        <hr />
        <div className='d-flex flex-wrap justify-content-center gap-4 my-3'>
          <button type='submit' className='btn btn-primary' disabled={!selectedTariffClientId}>
            <i className='mdi mdi-plus me-1'></i>
            Registrar
          </button>
          <button type='button' className='btn btn-light' data-bs-dismiss='modal'>
            <i className='mdi mdi-close me-1'></i>
            Cerrar
          </button>
        </div>
      </Modal>

      <Modal
        id='modal-storage-notifications'
        modalRef={notificationsModalRef}
        title='Notificaciones cliente'
        size='xl'
        hideFooter
        bodyStyle={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', overflowX: 'hidden' }}
        onSubmit={onNotificationSubmit}
        onClose={() => {
          setSelectedClientForNotifications(null)
          clearNotificationForm()
        }}
      >
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3'>
          <h5 className='mb-0'>Notificaciones registradas</h5>
          {selectedNotificationClientName && <span className='badge badge-soft-secondary fs-14'>{selectedNotificationClientName}</span>}
        </div>
        <input ref={notificationIdRef} type='hidden' />
        <div className='row'>
          <VdSelect
            id='storage-client-notification-select'
            label='Notificacion:'
            col='col-md-4'
            required
            value={notificationValue}
            onChange={(value) => setNotificationValue(value)}
            options={notificationOptions.map((option) => ({ value: getNotificationOptionValue(option), label: getNotificationOptionLabel(option) }))}
            placeholder='Seleccione'
          />
          <EmailTagsInput
            ref={notificationToRef}
            label='Para:'
            placeholder='Para:'
            col='col-12'
          />
          <EmailTagsInput
            ref={notificationCcRef}
            label='Copia:'
            placeholder='Copia:'
            col='col-12'
          />
        </div>
        <div className='d-flex flex-wrap justify-content-center gap-2 my-3'>
          <button
            type='button'
            className='btn btn-light'
            data-bs-dismiss='modal'
          >
            <i className='mdi mdi-close me-1'></i>
            Cerrar
          </button>
          <button type='submit' className='btn btn-primary' disabled={!selectedNotificationClientId}>
            <i className='mdi mdi-plus me-1'></i>
            {isNotificationEditing ? 'Guardar' : 'Registrar'}
          </button>
        </div>
        <VdTable
          key={`notifications-${selectedNotificationClientId ?? 'none'}`}
          ref={notificationsTableRef}
          rest={storageClientNotificationsRest}
          icon="mdi mdi-send"
          title="Notificaciones registradas"
          unit="notificaciones"
          defaultPageSize={10}
          baseFilter={notificationsFilterValue}
          searchFields={['notification_name', 'to_emails', 'cc_emails']}
          searchPlaceholder="Buscar notificación…"
          emptyText="Sin notificaciones registradas."
          headerActions={<button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refreshNotificationsGrid}>
            <i className="mdi mdi-refresh"></i>
          </button>}
          actions={(row) => [
            { icon: 'mdi mdi-pencil', title: 'Editar notificación', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onNotificationEditClicked(r) },
            { icon: 'mdi mdi-delete', title: 'Eliminar notificación', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onNotificationDeleteClicked(r.id) },
          ]}
          columns={[
            { key: 'id', label: '#', field: 'id', width: '70px', filter: { type: 'number' } },
            {
              key: 'estado', label: 'Estado', field: 'status', width: '95px',
              render: (row) => {
                const active = row.status === true || row.status === 1
                return <span className={`badge ${active ? 'bg-success' : 'badge-soft-secondary'}`}>{active ? 'Activo' : 'Inactivo'}</span>
              },
            },
            { key: 'notif', label: 'Notificación', field: 'notification_name', filter: { type: 'text' } },
            { key: 'para', label: 'Para', field: 'to_emails', render: (row) => <EmailListCell value={row.to_emails} /> },
            { key: 'copia', label: 'Copia', field: 'cc_emails', render: (row) => <EmailListCell value={row.cc_emails} /> },
            { key: 'usuario', label: 'Usuario registro', field: 'creator_label', sortable: false },
            { key: 'registro', label: 'Fecha registro', field: 'created_at', width: '165px', render: (row) => formatDateTime(row.created_at) },
          ]}
        />
      </Modal>

      <Modal
        modalRef={usersModalRef}
        title='Mantenimiento usuarios'
        size='xl'
        hideFooter
        onSubmit={(e) => e.preventDefault()}
        onClose={() => setSelectedClientForUsers(null)}
      >
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3'>
          <button
            type='button'
            className='btn btn-primary d-inline-flex align-items-center gap-2'
            onClick={() => onUserModalOpen(null)}
            disabled={!selectedClientId}
          >
            <i className='mdi mdi-plus-circle-outline'></i>
            Registrar usuario
          </button>
          {selectedClientName && <span className='badge badge-soft-secondary fs-14'>{selectedClientName}</span>}
        </div>
        <VdTable
          key={`users-${selectedClientId ?? 'none'}`}
          ref={usersTableRef}
          rest={usersRest}
          icon="mdi mdi-account-group"
          title="Usuarios registrados"
          unit="usuarios"
          defaultPageSize={10}
          baseFilter={usersFilterValue}
          searchFields={['username', 'name', 'lastname', 'email']}
          searchPlaceholder="Buscar usuario…"
          emptyText="Sin usuarios registrados."
          headerActions={<button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refreshUsersGrid}>
            <i className="mdi mdi-refresh"></i>
          </button>}
          actions={(row) => [
            { icon: 'mdi mdi-pencil', title: 'Editar usuario', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onUserModalOpen(r) },
            { icon: 'mdi mdi-delete', title: 'Eliminar usuario', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onUserDeleteClicked(r.uuid) },
          ]}
          columns={[
            { key: 'id', label: 'ID', field: 'entity_id', width: '80px', sortable: false },
            { key: 'username', label: 'Usuario', field: 'username', filter: { type: 'text' } },
            { key: 'nombres', label: 'Nombres', field: 'name', filter: { type: 'text' } },
            { key: 'apellidos', label: 'Apellidos', field: 'lastname', filter: { type: 'text' } },
            { key: 'email', label: 'Email', field: 'email', filter: { type: 'text' } },
            {
              key: 'telefono', label: 'Teléfono', field: 'phone', sortable: false,
              render: (row) => {
                const prefix = normalizePrefix(row.phone_prefix)
                return `${prefix ? `+${prefix}` : ''} ${row.phone ?? ''}`.trim()
              },
            },
            {
              key: 'estado', label: 'Estado', field: 'status', width: '100px',
              render: (row) => row.status === null
                ? 'Eliminado'
                : <SwitchFormGroup checked={row.status == 1} onChange={() => onUserBooleanChange({ id: row.uuid, field: 'status', value: !row.status })} />,
            },
          ]}
        />
      </Modal>

      <Modal
        modalRef={userFormModalRef}
        title={isUserEditing ? 'Editar usuario' : 'Registrar usuario'}
        onSubmit={onUserModalSubmit}
        size='lg'
        btnSubmitText={isUserEditing ? 'Guardar usuario' : 'Registrar usuario'}
        zIndex={1065}
      >
        <input ref={userIdRef} type='hidden' />
        <input ref={userPhonePrefixRef} type='hidden' />
        <div className='row'>
          <InputFormGroup eRef={userUsernameRef} label='Usuario' col='col-md-6' required disabled={isUserEditing} />
          {!isUserEditing && <InputFormGroup eRef={userPasswordRef} label='Clave' col='col-md-6' type='password' required />}
          <InputFormGroup eRef={userNameRef} label='Nombres' col='col-md-4' required />
          <InputFormGroup eRef={userLastNameFatherRef} label='Apellido Paterno' col='col-md-4' required />
          <InputFormGroup eRef={userLastNameMotherRef} label='Apellido Materno' col='col-md-4' required />
          <InputFormGroup eRef={userEmailRef} label='Email' col='col-md-4' type='email' required />
          <InputFormGroup eRef={userPhoneRef} label='Telefono' col='col-md-4' required />
          <VdSelect
            label='Estado'
            col='col-md-4'
            required
            value={userStatus}
            onChange={(value) => setUserStatus(value || '1')}
            options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}
          />
        </div>
      </Modal>
    </>}
  </>)
}

CreateReactScript((el, properties) => {
  const canAccess = properties.can(properties.requiredPermission) || properties.can('clients') || properties.can('eventual-clients') || properties.hasRole('Admin')
  if (!canAccess) location.href = '/admin/'

  createRoot(el).render(<BaseAdminto {...properties} title={properties.sectionTitle ?? 'Clientes'}>
    <Clients {...properties} />
  </BaseAdminto>)
})
