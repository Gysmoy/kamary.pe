import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import UbigeoCascade from '@Adminto/form/UbigeoCascade';
import ClientsRest from '../Actions/Admin/ClientsRest';
import { EMPTY_UBIGEO_SELECTION } from '../Utils/ubigeoInei';
import renderGridEditLink from '../Utils/renderGridEditLink';

const clientsRest = new ClientsRest()

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
const normalizePrefix = (value) => (value ?? '').toString().replace(/\D+/g, '')
const normalizeDigits = (value) => (value ?? '').toString().replace(/\D+/g, '')
const booleanLabel = (value) => value ? 'Si' : 'No'
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
      {specification && <small className='ms-1 fa fa-question-circle text-muted' title={specification}></small>}
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
  serviceContext = false
}) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const lookupTimeoutRef = useRef()
  const pendingModalDataRef = useRef(null)

  const idRef = useRef()
  const dataSourceRef = useRef()
  const clientKindRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const fullNameRef = useRef()
  const isPlatformRef = useRef()
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

  const [isEditing, setIsEditing] = useState(false)
  const [clientKind, setClientKind] = useState(defaultClientKind)
  const [documentType, setDocumentType] = useState('dni')
  const [isSearchingDocument, setIsSearchingDocument] = useState(false)
  const [isDocumentDataLocked, setIsDocumentDataLocked] = useState(false)
  const [lastLookedDocumentKey, setLastLookedDocumentKey] = useState('')
  const [phonePrefix, setPhonePrefix] = useState('51')
  const [platformValue, setPlatformValue] = useState('0')
  const [storageServiceValue, setStorageServiceValue] = useState('0')
  const [quickFilter, setQuickFilter] = useState(initialQuickFilter)
  const [totalRows, setTotalRows] = useState(0)
  const [ubigeoLocation, setUbigeoLocation] = useState(EMPTY_UBIGEO_SELECTION)

  const isEventual = clientKind === 'eventual'
  const isRuc = documentType === 'ruc'
  const docMaxLength = documentType === 'dni' ? 8 : (documentType === 'ruc' ? 11 : 20)
  const kindLabel = isEventual ? 'eventual' : 'regular'
  const filterValue = useMemo(() => combineFilters(
    storageContext ? ['has_storage_service', '=', 1] : null,
    resolveQuickFilterValue(quickFilter)
  ), [quickFilter, storageContext])

  const displayNameLabel = isEventual
    ? (isRuc ? 'Razon social' : 'Nombre o razon social')
    : (isRuc ? 'Razon social' : 'Nombre completo')

  const clearForm = (nextKind = defaultClientKind) => {
    setRefValue(idRef, '')
    setRefValue(dataSourceRef, nextKind === 'eventual' ? 'eventual_client' : 'client')
    setRefValue(clientKindRef, nextKind)
    setRefValue(documentTypeRef, 'dni')
    setRefValue(documentNumberRef, '')
    setRefValue(fullNameRef, '')
    setPlatformValue('0')
    setStorageServiceValue(storageContext ? '1' : '0')
    setRefValue(isPlatformRef, '0')
    setRefValue(hasStorageServiceRef, storageContext ? '1' : '0')
    setRefValue(storageTariffEnabledRef, '0')
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
    setRefValue(notesRef, '')
    setRefValue(statusRef, '1')
  }

  const applyApiClientData = (client = {}, kind = clientKind) => {
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

    if (!result) return
    if (!result.found || !result.client) {
      setIsDocumentDataLocked(false)
      return
    }

    applyApiClientData(result.client, kind)
    setIsDocumentDataLocked(true)
  }

  const onDocumentTypeChanged = (e) => {
    const nextType = e.target.value || 'dni'
    setDocumentType(nextType)
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

  const populateModalData = (data) => {
    const nextKind = data.client_kind ?? defaultClientKind
    setRefValue(idRef, data.entity_id ?? data.id)
    setRefValue(dataSourceRef, data.data_source ?? (nextKind === 'eventual' ? 'eventual_client' : 'client'))
    setRefValue(clientKindRef, nextKind)
    setClientKind(nextKind)
    setRefValue(documentTypeRef, data.document_type ?? 'dni')
    setRefValue(documentNumberRef, data.document_number ?? '')
    setRefValue(fullNameRef, data.full_name ?? data.business_name ?? data.display_name ?? '')
    const nextPlatformValue = data.is_platform ? '1' : '0'
    const nextStorageValue = storageContext ? '1' : (data.has_storage_service ? '1' : '0')
    setPlatformValue(nextPlatformValue)
    setStorageServiceValue(nextStorageValue)
    setRefValue(isPlatformRef, nextPlatformValue)
    setRefValue(hasStorageServiceRef, nextStorageValue)
    setRefValue(storageTariffEnabledRef, data.storage_tariff_enabled ? '1' : '0')
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
    setRefValue(notesRef, data.notes ?? '')
    setRefValue(statusRef, data.status === false || data.status === 0 ? '0' : '1')
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
      setDocumentType('dni')
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
      client_kind: storageContext ? 'regular' : getRefValue(clientKindRef),
      document_type: getRefValue(documentTypeRef),
      document_number: normalizeDigits(getRefValue(documentNumberRef)),
      full_name: getRefValue(fullNameRef).trim(),
      is_platform: storageContext ? false : getRefValue(isPlatformRef),
      has_storage_service: storageContext ? true : getRefValue(hasStorageServiceRef),
      storage_tariff_enabled: storageContext ? getRefValue(storageTariffEnabledRef) : undefined,
      contract_due_days: storageContext ? '' : getRefValue(contractDueDaysRef).trim(),
      commercial_channel: storageContext ? '' : getRefValue(commercialChannelRef).trim(),
      segment: storageContext ? '' : getRefValue(segmentRef).trim(),
      email: emailValue,
      billing_email: storageContext ? emailValue : getRefValue(billingEmailRef).trim(),
      primary_contact: storageContext ? '' : getRefValue(primaryContactRef).trim(),
      primary_contact_phone: storageContext ? '' : getRefValue(primaryContactPhoneRef).trim(),
      phone: getRefValue(phoneRef).trim(),
      phone_prefix: normalizePrefix(getRefValue(phonePrefixRef)) || '51',
      short_code: getRefValue(shortCodeRef).trim(),
      ubigeo: storageContext ? '' : (ubigeoLocation.ubigeo?.trim?.() ?? ''),
      full_address: getRefValue(addressRef).trim(),
      notes: getRefValue(notesRef).trim(),
      status: getRefValue(statusRef) || undefined,
    }

    const result = await clientsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
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
    $(gridRef.current).dxDataGrid('instance').refresh()
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
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const isIdentityBlocked = isEditing || (isDocumentDataLocked && ['dni', 'ruc'].includes(documentType))

  return (<>
    <Table
      gridRef={gridRef}
      title={<div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
        <div>
          <h4 className='mb-1'>Lista de {sectionTitle}</h4>
          <small className='text-muted'>{storageContext ? 'Clientes con servicio de almacenamiento.' : (serviceContext ? 'Clientes asociados a servicios y contratos.' : 'Modulo unificado para clientes regulares y eventuales.')}</small>
        </div>
        {!storageContext && <div className='d-flex flex-wrap align-items-center gap-2'>
          {QUICK_FILTERS.map(filter => (
            <button
              key={filter.key}
              type='button'
              className={`btn btn-sm ${quickFilter === filter.key ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setQuickFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
          <span className='badge badge-soft-secondary'>{totalRows} registros</span>
        </div>}
      </div>}
      rest={clientsRest}
      filterValue={filterValue}
      onRefresh={(payload) => setTotalRows(payload?.totalCount ?? 0)}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        })
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'add',
            title: 'Agregar',
            hint: `Agregar cliente ${getCreateKindFromFilter(quickFilter, defaultClientKind) === 'eventual' ? 'eventual' : 'regular'}`,
            onClick: () => onModalOpen(null, getCreateKindFromFilter(quickFilter, defaultClientKind))
          }
        })
      }}
      pageSize={25}
      columns={[
        { dataField: 'entity_id', caption: 'ID', width: 80 },
        {
          dataField: 'client_kind',
          caption: 'Tipo',
          width: 105,
          calculateCellValue: (data) => data.client_kind === 'eventual' ? 'Eventual' : 'Regular'
        },
        { dataField: 'document_type', caption: 'Tipo Doc.', width: 95 },
        { dataField: 'document_number', caption: 'Numero', width: 125 },
        {
          dataField: 'display_name',
          caption: 'Cliente',
          minWidth: 220,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.display_name ?? data?.full_name, () => onModalOpen(data), 'Editar cliente')
        },
        {
          dataField: 'purchase_count',
          caption: 'Compras',
          width: 95,
        },
        {
          dataField: 'is_habitual',
          caption: 'Habitual',
          width: 95,
          dataType: 'boolean',
          cellTemplate: (container, { data }) => {
            const badgeClass = data.is_habitual ? 'badge bg-success' : 'badge badge-soft-secondary'
            container.html(`<span class="${badgeClass}">${data.is_habitual ? 'Si' : 'No'}</span>`)
          }
        },
        {
          dataField: 'last_purchase_at',
          caption: 'Ultima compra',
          width: 120,
          cellTemplate: (container, { data }) => container.text(formatDate(data.last_purchase_at))
        },
        { dataField: 'email', caption: 'Correo', minWidth: 180 },
        {
          dataField: 'mobile_full',
          caption: 'Celular',
          width: 140,
          calculateCellValue: (data) => {
            const prefix = normalizePrefix(data.phone_prefix)
            return `${prefix ? `+${prefix}` : ''} ${data.phone ?? ''}`.trim()
          }
        },
        { dataField: 'primary_contact', caption: 'Contacto', minWidth: 160, calculateCellValue: (data) => data.primary_contact ?? data.contact_name ?? '' },
        { dataField: 'full_address', caption: 'Direccion', minWidth: 220, calculateCellValue: (data) => data.full_address ?? data.address ?? '' },
        {
          dataField: 'is_platform',
          caption: 'Plataforma',
          width: 100,
          calculateCellValue: (data) => booleanLabel(data.is_platform)
        },
        {
          dataField: 'has_storage_service',
          caption: 'Almacenamiento',
          width: 130,
          calculateCellValue: (data) => booleanLabel(data.has_storage_service)
        },
        { dataField: 'contract_due_days', caption: 'Dias vcto.', width: 105, visible: false },
        { dataField: 'commercial_channel', caption: 'Canal', minWidth: 120, visible: false },
        { dataField: 'segment', caption: 'Segmento', minWidth: 120, visible: false },
        { dataField: 'billing_email', caption: 'Correo facturacion', minWidth: 180, visible: false },
        { dataField: 'short_code', caption: 'Codigo corto', width: 120, visible: false },
        { dataField: 'ubigeo', caption: 'Ubigeo', width: 110, visible: false },
        { dataField: 'notes', caption: 'Notas', minWidth: 180, visible: false },
        { dataField: 'creator_label', caption: 'Creado por', minWidth: 160, visible: false },
        { dataField: 'updater_label', caption: 'Actualizado por', minWidth: 160, visible: false },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange(data)} />)
          }
        },
        {
          caption: 'Acciones',
          width: 120,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar cliente',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={storageContext ? 'Formulario cliente' : (isEditing ? `Editar cliente ${kindLabel}` : `Agregar cliente ${kindLabel}`)} onSubmit={onModalSubmit} size={storageContext ? 'xl' : 'lg'} btnSubmitText={storageContext ? 'Registrar cliente' : 'Guardar'}>
      <div className='row'>
        <input ref={idRef} type='hidden' />
        <input ref={dataSourceRef} type='hidden' />
        {storageContext && <>
          <input ref={clientKindRef} type='hidden' />
          <input ref={phonePrefixRef} type='hidden' />
        </>}

        {!storageContext && <SelectFormGroup
            eRef={clientKindRef}
            label='Tipo de cliente'
            col='col-md-4'
            required
            disabled={isEditing}
            value={clientKind}
            onChange={(e) => setClientKind(e.target.value || defaultClientKind)}
            effectWith={[clientKind]}
          >
            <option value='regular'>Regular</option>
            <option value='eventual'>Eventual</option>
          </SelectFormGroup>}

        <SelectFormGroup
          eRef={documentTypeRef}
          label={storageContext ? 'Tipo de Documento' : 'Tipo Doc.'}
          col={storageContext ? 'col-md-2' : 'col-md-4'}
          required
          disabled={isEditing}
          value={documentType}
          onChange={onDocumentTypeChanged}
          effectWith={[documentType]}
        >
          <option value='dni'>DNI</option>
          <option value='ce'>{storageContext ? 'CARNE DE EXTRANJERIA' : 'CE'}</option>
          <option value='ruc'>RUC</option>
        </SelectFormGroup>

        <InputFormGroup
          eRef={documentNumberRef}
          label={`${storageContext ? 'N° Documento' : 'Documento'}${isSearchingDocument ? ' (consultando...)' : ''}`}
          col={storageContext ? 'col-md-4' : 'col-md-4'}
          required
          disabled={isEditing}
          max={docMaxLength}
          onChange={onDocumentNumberChanged}
          onKeyDown={(e) => {
            if (e.ctrlKey || e.metaKey) return
            if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) e.preventDefault()
          }}
        />

        <InputFormGroup eRef={fullNameRef} label={storageContext ? 'Razón Social' : displayNameLabel} col={storageContext ? 'col-md-6' : 'col-12'} required disabled={isIdentityBlocked} />
        {storageContext && <>
          <InputFormGroup eRef={shortCodeRef} label='Código corto' col='col-md-6' />
          <InputFormGroup eRef={addressRef} label='Dirección' col='col-md-6' />
          <EmailTagsInput
            ref={emailRef}
            label='Emails para Envío de Comprobantes'
            placeholder='Para:'
            specification='Puedes separar varios correos con coma o punto y coma.'
            col='col-md-6'
          />
          <InputFormGroup eRef={phoneRef} label='Celular' col='col-md-6' />
          <SelectFormGroup eRef={statusRef} label='Estado' col='col-md-6' required>
            <option value='1'>ACTIVO</option>
            <option value='0'>INACTIVO</option>
          </SelectFormGroup>
          <SelectFormGroup
            eRef={storageTariffEnabledRef}
            label={<span>Tarifario por cliente <span className='text-danger'>(Referente al tarifario de servicio de almacen)</span></span>}
            col='col-md-6'
          >
            <option value='0'>Inactivo</option>
            <option value='1'>Activo</option>
          </SelectFormGroup>
        </>}
        {!storageContext && !isEventual && (
          <UbigeoCascade
            value={ubigeoLocation}
            onChange={setUbigeoLocation}
            showUbigeo={false}
            departmentCol='col-md-4'
            provinceCol='col-md-4'
            districtCol='col-md-4'
          />
        )}
        {!storageContext && <TextareaFormGroup eRef={addressRef} label='Direccion completa' col='col-12' rows={2} />}

        {!storageContext && !isEventual && (
          <>
            <SelectFormGroup eRef={isPlatformRef} label='Es plataforma' col='col-md-4' value={platformValue} onChange={(e) => setPlatformValue(e.target.value)} effectWith={[platformValue]}>
              <option value='0'>No</option>
              <option value='1'>Si</option>
            </SelectFormGroup>

            <SelectFormGroup eRef={hasStorageServiceRef} label='Cuenta con servicio de almacenamiento' col='col-md-4' value={storageServiceValue} onChange={(e) => setStorageServiceValue(e.target.value)} effectWith={[storageServiceValue]} disabled={storageContext}>
              <option value='0'>No</option>
              <option value='1'>Si</option>
            </SelectFormGroup>

            <InputFormGroup eRef={contractDueDaysRef} label='Dias vcto. contrato' col='col-md-4' type='number' min='0' />
          </>
        )}

        {!storageContext && <InputFormGroup eRef={emailRef} label='Correo principal' col={isEventual ? 'col-md-6' : 'col-md-6'} type='email' />}
        {!storageContext && !isEventual && <InputFormGroup eRef={billingEmailRef} label='Correo facturacion' col='col-md-6' type='email' />}

        {!storageContext && <InputFormGroup eRef={primaryContactRef} label='Contacto principal' col={isEventual ? 'col-md-6' : 'col-md-6'} />}
        {!storageContext && !isEventual && <InputFormGroup eRef={primaryContactPhoneRef} label='Telefono contacto' col='col-md-6' />}

        {!storageContext && <SelectFormGroup
          eRef={phonePrefixRef}
          label='Prefijo celular'
          col='col-md-4'
          value={phonePrefix}
          onChange={(e) => setPhonePrefix(normalizePrefix(e.target.value))}
          effectWith={[phonePrefix]}
        >
          {!prefixes.length && <option value='51'>+51 - Peru</option>}
          {prefixes.map((prefix, idx) => (
            <option key={`prefix-${idx}`} value={prefix.realCode}>
              {prefix.beautyCode} - {prefix.country}
            </option>
          ))}
        </SelectFormGroup>}
        {!storageContext && <InputFormGroup eRef={phoneRef} label='Celular' col='col-md-4' />}
        {!storageContext && !isEventual && <InputFormGroup eRef={shortCodeRef} label='Codigo corto' col='col-md-4' />}

        {!storageContext && !isEventual && (
          <>
            <InputFormGroup eRef={commercialChannelRef} label='Canal comercial' col='col-md-6' />
            <InputFormGroup eRef={segmentRef} label='Segmento' col='col-md-6' />
          </>
        )}

        {isEventual && (
          <div className='col-12'>
            <label className='form-label'>Notas</label>
            <textarea ref={notesRef} className='form-control' rows='3'></textarea>
          </div>
        )}
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  const canAccess = properties.can(properties.requiredPermission) || properties.can('clients') || properties.can('eventual-clients') || properties.hasRole('Admin')
  if (!canAccess) location.href = '/admin/'

  createRoot(el).render(<BaseAdminto {...properties} title={properties.sectionTitle ?? 'Clientes'}>
    <Clients {...properties} />
  </BaseAdminto>)
})
