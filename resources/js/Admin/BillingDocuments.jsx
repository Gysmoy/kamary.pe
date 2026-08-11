import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '@Adminto/Modal';
import Swal from 'sweetalert2';
import BillingDocumentsRest from '../Actions/Admin/BillingDocumentsRest';
import {
  billingDocumentStatusOptions,
  getBillingDocumentStatusLabel,
  getSourceTypeLabel,
} from '../Utils/statusLabels';
import { scopedPermission } from '../Utils/permissionScope';

const billingDocumentsRest = new BillingDocumentsRest()

const receivablePaymentMethodOptions = [
  'Efectivo',
  'Transferencia',
  'Deposito',
  'Yape',
  'Plin',
  'POS',
  'Cheque',
  'Otro'
]

const today = () => {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const storageTabs = [
  { id: 'prefactures', label: 'Prefacturas' },
  { id: 'issued', label: 'Facturas Emitidas' },
  { id: 'cancelled', label: 'Facturas Anuladas' },
  { id: 'credit-notes', label: 'Notas de Credito' },
]

const emptyFilters = () => ({
  businessId: '',
  clientId: '',
  startDate: '',
  endDate: '',
})

const defaultStorageFilters = () => ({
  ...emptyFilters(),
  startDate: today(),
  endDate: today(),
})

const reportFilters = () => ({
  businessId: '',
  startDate: today(),
  endDate: today(),
})

const formatMoney = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatPaymentAmount = (value) => Number(value || 0).toFixed(2)
const formatDate = (value) => value?.toString?.().slice?.(0, 10) ?? ''
const formatDateTime = (value) => {
  if (!value) return ''
  const text = value.toString()
  return text.length > 10 ? text.slice(0, 19).replace('T', ' ') : text
}
const currencyLabel = (value) => `${value ?? ''}`.toUpperCase() === 'USD' ? 'Dolares' : 'Soles'
const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']
const emptyBulkFilters = () => ({ clientId: '', documentType: 'Factura', currency: 'PEN', detraction: false, detractionPercent: 12, detractionTypeId: '', detractionCode: '' })

// Detraccion configurada en el pedido comercial de origen, si el comprobante viene de uno.
const orderDetraction = (row) => {
  const order = row?.commercial_order ?? row?.commercialOrder ?? null
  if (!order || !order.detraction_enabled) return null

  return {
    enabled: true,
    typeId: order.detraction_type_id ? `${order.detraction_type_id}` : '',
    code: order.detraction_code ?? '',
    percent: Number(order.detraction_percent ?? 0),
  }
}
const billingControlStatusOptions = [
  { value: 'pending', label: 'En espera' },
  { value: 'sent', label: 'Facturado' },
  { value: 'accepted', label: 'Facturado' },
  { value: 'observed', label: 'Facturado' },
  { value: 'rejected', label: 'Facturado' },
  { value: 'cancelled', label: 'Anulado' },
]
const currencyFilterOptions = [{ value: 'PEN', label: 'Soles' }, { value: 'USD', label: 'Dolares' }]

// Paleta de acciones por fila (misma paleta usada en el resto del panel admin)
const rowActionColors = {
  blue: { bg: '#e7f2fd', color: '#188ae2' },
  red: { bg: '#fcebeb', color: '#e24b4a' },
  slate: { bg: '#eef0f4', color: '#5b69bc' },
  green: { bg: '#e7faf1', color: '#10c469' },
  amber: { bg: '#fff4e5', color: '#f1a325' },
}

const toNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}
const roundMoney = (value) => Math.round(toNumber(value) * 100) / 100

const rowClientName = (row) => row?.client?.full_name
  ?? row?.eventualClient?.business_name
  ?? row?.eventual_client?.business_name
  ?? '-'

const rowClientDocument = (row) => row?.client?.document_number
  ?? row?.eventualClient?.document_number
  ?? row?.eventual_client?.document_number
  ?? ''

const rowClientLabel = (row) => {
  const document = rowClientDocument(row)
  const name = rowClientName(row)
  return document ? `${document} | ${name}` : name
}

const rowCustomerEmail = (row) => row?.customer_email
  ?? row?.client?.billing_email
  ?? row?.client?.email
  ?? row?.eventualClient?.email
  ?? row?.eventual_client?.email
  ?? ''

const rowSourceCode = (row) => row?.commercial_order?.code
  ?? row?.commercialOrder?.code
  ?? row?.service_order?.code
  ?? row?.serviceOrder?.code
  ?? row?.metadata?.source_code
  ?? '-'

const rowServiceOrderDate = (row) => row?.service_order_issue_date
  ?? row?.service_order?.issue_date
  ?? row?.serviceOrder?.issue_date
  ?? row?.service_order_scheduled_at
  ?? row?.service_order?.scheduled_at
  ?? row?.serviceOrder?.scheduled_at
  ?? row?.service_order_created_at
  ?? row?.service_order?.created_at
  ?? row?.serviceOrder?.created_at
  ?? ''

const rowDescription = (row) => row?.items?.[0]?.description
  ?? row?.observations
  ?? row?.document_type
  ?? '-'

const cleanText = (value, fallback = '') => {
  const text = `${value ?? ''}`.trim()
  return text && text !== '-' ? text : fallback
}

const rowDocumentNumber = (row) => {
  const series = cleanText(row?.series)
  const sequence = cleanText(row?.sequence)
  if (series && sequence) return `${series}-${sequence}`
  return series || sequence || cleanText(row?.code, 'comprobante')
}
const rowHasPreparedVoucher = (row) => !!(`${row?.series ?? ''}`.trim() && `${row?.sequence ?? ''}`.trim())

const rowBillingCycleLabel = (row) => {
  const raw = cleanText(rowDescription(row))
  if (/mes\s+.+a(?:n|ñ)o/i.test(raw)) return ''

  const dateText = rowServiceOrderDate(row) || row?.issue_date || row?.created_at
  if (!dateText) return ''
  const date = new Date(`${dateText}`.slice(0, 10))
  if (Number.isNaN(date.getTime())) return ''
  return `Mes ${monthNames[date.getUTCMonth()]} - Año ${date.getUTCFullYear()}`
}

const rowEmailConcept = (row) => {
  const description = cleanText(rowDescription(row), 'Servicios generales')
  const cycle = rowBillingCycleLabel(row)
  return [description, cycle].filter(Boolean).join(' - ')
}

const rowEmailSubject = (row) => {
  const source = cleanText(rowSourceCode(row), cleanText(row?.code, 'Documento'))
  return `${source} | ${rowClientName(row)} | Documento ${rowDocumentNumber(row)}`
}

const defaultEmailDraft = (row) => ({
  to: rowCustomerEmail(row),
  cc: '',
  subject: rowEmailSubject(row),
  body: [
    `Estimado ${rowClientName(row)}`,
    '',
    `El motivo del presente correo es para realizar el envío de la factura por ${rowEmailConcept(row)}`,
    '',
    'Para cualquier consulta, puede escribir al siguiente número: 972 830 676',
    '',
    'Estamos a la espera de su abono correspondiente.',
    '',
    `KAMARY MEDICAL SAC ${currencyLabel(row?.currency).toUpperCase()}`,
    'BBVA CUENTA CORRIENTE 0011-0341-0100042988',
    'BBVA CCI 011-341-000100042988-54',
    '',
    'Guisela Carrión Navarro',
    'Departamento de Facturación y Cobranzas',
    'KAMARY MEDICAL S.A.C.',
    '972 830 676',
    'administracion01@kamaryfarma.com',
    '',
    'Saludos cordiales',
  ].join('\n')
})

const splitEmailValues = (value) => `${value ?? ''}`
  .split(/[;,\s]+/)
  .map(item => item.trim())
  .filter(Boolean)

const normalizeEmailValues = (values) => Array.from(new Set(values.map(item => item.trim()).filter(Boolean)))

const EmailTagsInput = ({ value, onChange, placeholder }) => {
  const [draft, setDraft] = useState('')
  const emails = useMemo(() => splitEmailValues(value), [value])

  const setEmails = (items) => {
    onChange(normalizeEmailValues(items).join(', '))
  }

  const commitDraft = (text = draft) => {
    const nextItems = splitEmailValues(text)
    if (!nextItems.length) return false
    setEmails([...emails, ...nextItems])
    setDraft('')
    return true
  }

  const onInputChange = (event) => {
    const next = event.target.value
    if (/[;,\s]/.test(next)) {
      commitDraft(next)
      return
    }
    setDraft(next)
  }

  const onInputKeyDown = (event) => {
    if (['Enter', 'Tab', ',', ';', ' '].includes(event.key)) {
      if (draft.trim()) {
        event.preventDefault()
        commitDraft()
      }
      return
    }

    if (event.key === 'Backspace' && !draft && emails.length) {
      event.preventDefault()
      setEmails(emails.slice(0, -1))
    }
  }

  const removeEmail = (index) => {
    setEmails(emails.filter((_, itemIndex) => itemIndex !== index))
  }

  return <div className='billing-email-tags' onClick={(event) => event.currentTarget.querySelector('input')?.focus()}>
    {emails.map((email, index) => <span className='billing-email-chip' key={`billing-email-chip-${email}-${index}`}>
      <span>{email}</span>
      <button type='button' onClick={(event) => { event.stopPropagation(); removeEmail(index) }} aria-label={`Quitar ${email}`}>x</button>
    </span>)}
    <input
      value={draft}
      onChange={onInputChange}
      onKeyDown={onInputKeyDown}
      onBlur={() => commitDraft()}
      placeholder={emails.length ? '' : placeholder}
    />
  </div>
}

const normalizedStatus = (value) => `${value ?? ''}`.trim().toLowerCase()

const rowSunatMeta = (row) => {
  if (isDemoProviderRow(row)) return { label: 'Demo', className: 'badge bg-soft-warning text-warning border border-warning' }

  const status = normalizedStatus(row?.external_status || row?.local_status)
  if (row?.local_status === 'pending' && rowHasPreparedVoucher(row)) {
    return { label: 'Pendiente', className: 'badge bg-soft-warning text-warning border border-warning' }
  }
  if (status.includes('acept') || status === 'accepted') return { label: 'Aceptado', className: 'badge bg-soft-success text-success border border-success' }
  if (status.includes('observ') || status === 'observed') return { label: 'Observado', className: 'badge bg-soft-warning text-warning border border-warning' }
  if (status.includes('rechaz') || status === 'rejected') return { label: 'Rechazado', className: 'badge bg-soft-danger text-danger border border-danger' }
  if (status.includes('anulad') || status === 'cancelled') return { label: 'Anulado', className: 'badge bg-soft-danger text-danger border border-danger' }
  if (status.includes('envi') || status === 'sent') return { label: 'Enviado', className: 'badge bg-soft-info text-info border border-info' }
  return { label: getBillingDocumentStatusLabel(row?.external_status || row?.local_status), className: 'badge bg-soft-secondary text-secondary border border-secondary' }
}

const rowSunatLabel = (row) => rowSunatMeta(row).label

const rowPaidAmount = (row) => toNumber(row?.receivable_paid_amount ?? row?.metadata?.paid_amount, 0)

const rowBalanceAmount = (row) => {
  if (row?.receivable_balance_amount !== null && row?.receivable_balance_amount !== undefined) return toNumber(row.receivable_balance_amount, 0)
  if (row?.metadata?.balance_amount !== null && row?.metadata?.balance_amount !== undefined) return toNumber(row.metadata.balance_amount, 0)
  return Math.max(0, roundMoney(toNumber(row?.total, 0) - rowPaidAmount(row)))
}

const rowPaymentMeta = (row) => {
  const status = normalizedStatus(row?.receivable_payment_status)
  const paid = rowPaidAmount(row)
  const balance = rowBalanceAmount(row)
  if (status === 'paid' || (toNumber(row?.total, 0) > 0 && balance <= 0)) return { label: 'Cancelado', className: 'badge bg-soft-success text-success border border-success' }
  if (status === 'partial' || paid > 0) return { label: 'Parcial', className: 'badge bg-soft-info text-info border border-info' }
  if (status === 'cancelled') return { label: 'Anulado', className: 'badge bg-soft-danger text-danger border border-danger' }
  return { label: 'Pendiente', className: 'badge bg-soft-warning text-warning border border-warning' }
}

const rowPaymentLabel = (row) => rowPaymentMeta(row).label

const rowIssuedAt = (row) => row?.sent_at
  ?? row?.accepted_at
  ?? row?.updated_at
  ?? row?.issue_date
  ?? row?.created_at
  ?? ''

const rowDetractionPercent = (row) => {
  const metadataPercent = toNumber(row?.metadata?.detraction_percent, 0)
  if (metadataPercent > 0) return metadataPercent
  return (row?.items ?? []).reduce((carry, item) => Math.max(carry, toNumber(item?.metadata?.detraction_percent, 0)), 0)
}
const rowsDetractionPercent = (rows) => rows.reduce((carry, row) => Math.max(carry, rowDetractionPercent(row)), 0)
const rowDetractionAmount = (row, percent) => {
  const metadataAmount = toNumber(row?.metadata?.detraction_amount, 0)
  if (metadataAmount > 0) return roundMoney(metadataAmount)
  return roundMoney(toNumber(row?.total, 0) * toNumber(percent, 0) / 100)
}
const isDemoProviderRow = (row) => {
  const currentMode = `${row?.fiscal_readiness?.mode ?? ''}`.trim().toLowerCase()
  if ((row?.local_status ?? 'pending') === 'pending' && currentMode) return currentMode === 'demo'
  return `${row?.provider_mode ?? currentMode}`.trim().toLowerCase() === 'demo'
}

const combineFilters = (filters) => filters.filter(Boolean).reduce((carry, filter) => {
  if (!carry) return filter
  return [carry, 'and', filter]
}, null)

const tabFilter = (tab) => {
  const notCreditNote = ['document_type', '<>', 'Nota de credito']
  if (tab === 'issued') {
    return [[
      ['local_status', '=', 'sent'],
      'or',
      ['local_status', '=', 'accepted'],
      'or',
      ['local_status', '=', 'observed'],
      'or',
      ['local_status', '=', 'rejected'],
      'or',
      "raw:(billing_documents.local_status = 'pending' AND billing_documents.series IS NOT NULL AND billing_documents.series <> '' AND billing_documents.sequence IS NOT NULL AND billing_documents.sequence <> '')",
    ], 'and', notCreditNote]
  }
  if (tab === 'cancelled') return [['local_status', '=', 'cancelled'], 'and', notCreditNote]
  if (tab === 'credit-notes') return ['document_type', '=', 'Nota de credito']
  return [
    ['local_status', '=', 'pending'],
    'and',
    [['series', '=', null], 'or', ['series', '=', '']],
    'and',
    [['sequence', '=', null], 'or', ['sequence', '=', '']],
    'and',
    notCreditNote,
  ]
}

const buildStorageFilter = (tab, filters) => {
  const dateField = tab === 'prefactures' ? 'source_service_order.issue_date' : 'updated_at'
  return combineFilters([
    tabFilter(tab),
    filters.businessId ? ['business_id', '=', Number(filters.businessId)] : null,
    filters.clientId ? ['client_id', '=', Number(filters.clientId)] : null,
    filters.startDate ? [dateField, '>=', filters.startDate] : null,
    filters.endDate ? [dateField, '<=', dateField === 'updated_at' ? `${filters.endDate} 23:59:59` : filters.endDate] : null,
  ])
}

const BillingDocuments = ({ moduleTitle = 'Facturacion', requiredPermission, billingMode }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const payloadModalRef = useRef()
  const providerModalRef = useRef()
  const cancelModalRef = useRef()
  const creditNoteModalRef = useRef()
  const reportModalRef = useRef()
  const bulkModalRef = useRef()
  const pdfPreviewModalRef = useRef()
  const emailModalRef = useRef()
  const receivablePaymentModalRef = useRef()
  const idRef = useRef()
  const issueDateRef = useRef()
  const dueDateRef = useRef()
  const seriesRef = useRef()
  const sequenceRef = useRef()
  const customerEmailRef = useRef()
  const observationsRef = useRef()
  const externalStatusRef = useRef()
  const externalIdRef = useRef()
  const externalReferenceRef = useRef()
  const errorMessageRef = useRef()
  const responsePayloadRef = useRef()
  const cancelReasonRef = useRef()
  const creditNoteSeriesRef = useRef()
  const creditNoteIssueDateRef = useRef()
  const creditNoteReasonRef = useRef()
  const creditNoteNoteRef = useRef()
  const receivablePaymentAmountRef = useRef()
  const receivablePaymentDateRef = useRef()
  const receivablePaymentBankRef = useRef()
  const receivablePaymentOperationRef = useRef()
  const receivablePaymentFileRef = useRef()
  const receivablePaymentObservationsRef = useRef()
  const isStorageBilling = billingMode === 'storage' || requiredPermission === 'storage-billing-control' || location.pathname.includes('storage-billing-control')

  const [sourceType, setSourceType] = useState(isStorageBilling ? 'service_order' : 'commercial_order')
  const [sourceId, setSourceId] = useState('')
  const [documentType, setDocumentType] = useState('Factura')
  const [paymentCondition, setPaymentCondition] = useState('Contado')
  const [paymentMethod, setPaymentMethod] = useState('Transferencia')
  const [providerLocalStatus, setProviderLocalStatus] = useState('pending')
  const [receivablePaymentMethod, setReceivablePaymentMethod] = useState('Transferencia')
  const [commercialOrders, setCommercialOrders] = useState([])
  const [serviceOrders, setServiceOrders] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [clients, setClients] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [payloadText, setPayloadText] = useState('')
  const [activeStorageTab, setActiveStorageTab] = useState('prefactures')
  const [storageFilters, setStorageFilters] = useState(defaultStorageFilters())
  const [appliedStorageFilters, setAppliedStorageFilters] = useState(emptyFilters())
  const [modalReportFilters, setModalReportFilters] = useState(reportFilters())
  const [bulkFilters, setBulkFilters] = useState(emptyBulkFilters())
  const [detractionTypes, setDetractionTypes] = useState([])
  const [bulkRows, setBulkRows] = useState([])
  const [bulkSelected, setBulkSelected] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [pdfPreview, setPdfPreview] = useState({ title: '', url: '', downloadUrl: '' })
  const [emailDraft, setEmailDraft] = useState({ to: '', cc: '', subject: '', body: '' })
  const [emailSending, setEmailSending] = useState(false)
  const [paymentSending, setPaymentSending] = useState(false)

  useEffect(() => {
    Promise.all([
      billingDocumentsRest.getCommercialOrders(),
      billingDocumentsRest.getServiceOrders(),
      billingDocumentsRest.getBusinesses(),
      billingDocumentsRest.getClients(),
      billingDocumentsRest.getDetractionTypes(),
    ]).then(([commercial, services, businessRows, clientRows, detractionRows]) => {
      setCommercialOrders((commercial ?? []).filter(row => row.status !== null))
      setServiceOrders((services ?? []).filter(row => row.status !== null))
      setBusinesses((businessRows ?? []).filter(row => row.status !== null))
      setClients((clientRows ?? []).filter(row => row.status !== null))
      setDetractionTypes((detractionRows ?? []).filter(row => row.status !== null))
    })
  }, [])

  const escapeHtml = (value) => `${value ?? ''}`
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

  const getReadinessMeta = (readiness) => {
    const status = readiness?.status ?? 'blocked'
    if (status === 'ready') return { label: 'Listo', className: 'bg-soft-success text-success', icon: 'success' }
    if (status === 'warning') return { label: 'Revisar', className: 'bg-soft-warning text-warning', icon: 'warning' }
    return { label: 'Bloqueado', className: 'bg-soft-danger text-danger', icon: 'warning' }
  }

  const normalizeDocumentType = (value) => `${value ?? ''}`.trim().toLowerCase().replaceAll('_', ' ')

  const isCreditNoteDocument = (row) => normalizeDocumentType(row?.document_type) === 'nota de credito'

  const canEditDocument = (row) => row?.local_status === 'pending'

  const canSyncDocument = (row) => {
    if (!row) return false
    if ((row.local_status ?? 'pending') !== 'pending') return true
    return !!(row.external_id || row?.metadata?.voided_ticket || row?.metadata?.voided_external_id || row?.response_payload)
  }

  const canCancelDocument = (row) => row?.local_status === 'accepted' && !isCreditNoteDocument(row)

  const canCreditNoteDocument = (row) => row?.local_status === 'accepted' && !isCreditNoteDocument(row)

  const canDownloadDocument = (row) => {
    if (!row) return false
    return ['accepted', 'observed', 'cancelled'].includes(row.local_status) || !!row.external_id
  }

  const canPayDocument = (row) => !!row?.receivable_id && rowBalanceAmount(row) > 0

  const hasPreparedVoucher = rowHasPreparedVoucher

  const canRetryIssueDocument = (row) => row?.local_status === 'pending' && hasPreparedVoucher(row) && !isDemoProviderRow(row)

  const canPreviewPdfDocument = (row) => {
    if (!row) return false
    return canDownloadDocument(row)
      || row.provider_mode === 'demo'
      || row?.metadata?.document_origin === 'storage_billing_control_demo'
      || hasPreparedVoucher(row)
  }

  const showBlockedAction = async (title, text) => {
    await Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'Cerrar'
    })
  }

  const openReadinessModal = async (row, title = 'Validación fiscal') => {
    const readiness = row?.fiscal_readiness ?? {}
    const errors = readiness.errors ?? []
    const warnings = readiness.warnings ?? []
    const html = `
      <div class="text-start">
        <div class="mb-2"><b>Modo:</b> ${escapeHtml(readiness.mode ?? 'demo')}</div>
        <div class="mb-2"><b>Serie usada:</b> ${escapeHtml(readiness.resolved_series ?? '-')}</div>
        ${errors.length ? `<div class="mb-2"><b>Bloqueos</b><ul class="mb-0 ps-3">${errors.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
        ${warnings.length ? `<div><b>Advertencias</b><ul class="mb-0 ps-3">${warnings.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
        ${!errors.length && !warnings.length ? '<div class="text-success">Listo para emitir.</div>' : ''}
      </div>
    `
    await Swal.fire({
      icon: getReadinessMeta(readiness).icon,
      title,
      html,
      confirmButtonText: 'Cerrar'
    })
  }

  const onModalOpen = (data = null) => {
    if (data && !canEditDocument(data)) {
      showBlockedAction('Comprobante bloqueado', 'Solo puedes editar comprobantes pendientes.')
      return
    }

    idRef.current.value = data?.id ?? ''
    issueDateRef.current.value = data?.issue_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    dueDateRef.current.value = data?.due_date?.toString?.().slice?.(0, 10) ?? ''
    setDocumentType(data?.document_type ?? 'Factura')
    seriesRef.current.value = data?.series ?? ''
    sequenceRef.current.value = data?.sequence ?? ''
    setPaymentCondition(data?.payment_condition ?? 'Contado')
    setPaymentMethod(data?.payment_method ?? 'Transferencia')
    customerEmailRef.current.value = data?.customer_email ?? ''
    observationsRef.current.value = data?.observations ?? ''
    setSourceType(isStorageBilling ? 'service_order' : (data?.source_type ?? 'commercial_order'))
    setSourceId(`${data?.source_id ?? ''}`)
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()

    if (!sourceId) {
      Swal.fire({ icon: 'warning', title: 'Falta documento origen', text: 'Selecciona el documento origen del comprobante.', confirmButtonText: 'Entendido' })
      return
    }

    const request = {
      id: idRef.current.value || undefined,
      document_type: documentType,
      issue_date: issueDateRef.current.value,
      due_date: dueDateRef.current.value || null,
      series: seriesRef.current.value.trim(),
      sequence: sequenceRef.current.value.trim(),
      payment_condition: paymentCondition,
      payment_method: paymentMethod,
      customer_email: customerEmailRef.current.value.trim(),
      observations: observationsRef.current.value.trim(),
    }
    if (!isStorageBilling && sourceType === 'commercial_order') request.commercial_order_id = sourceId || null
    else request.service_order_id = sourceId || null

    const result = await billingDocumentsRest.save(request)
    if (!result) return
    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onOpenPayload = async (row) => {
    const payload = await billingDocumentsRest.getConnectorPayload(row.id)
    if (!payload) return
    setSelectedRow(row)
    setPayloadText(JSON.stringify(payload, null, 2))
    $(payloadModalRef.current).modal('show')
  }

  const onOpenProviderModal = (row) => {
    setSelectedRow(row)
    setProviderLocalStatus(row.local_status ?? 'pending')
    externalStatusRef.current.value = row.external_status ?? 'draft'
    externalIdRef.current.value = row.external_id ?? ''
    externalReferenceRef.current.value = row.external_reference ?? ''
    errorMessageRef.current.value = row.error_message ?? ''
    responsePayloadRef.current.value = row.response_payload ?? ''
    $(providerModalRef.current).modal('show')
  }

  const onSaveProvider = async (e) => {
    e.preventDefault()
    if (!selectedRow) return
    const payload = responsePayloadRef.current.value.trim()
    let decodedPayload = payload
    try { decodedPayload = payload ? JSON.parse(payload) : null } catch (error) { }
    const result = await billingDocumentsRest.registerProviderResponse(selectedRow.id, {
      local_status: providerLocalStatus,
      external_status: externalStatusRef.current.value,
      external_id: externalIdRef.current.value.trim(),
      external_reference: externalReferenceRef.current.value.trim(),
      error_message: errorMessageRef.current.value.trim(),
      response_payload: decodedPayload,
    })
    if (!result) return
    $(providerModalRef.current).modal('hide')
    tableRef.current?.refresh()
  }

  const onIssue = async (row) => {
    if (isDemoProviderRow(row)) {
      await showBlockedAction('Facturador en modo demo', 'No se enviara a SUNAT hasta configurar el facturador en produccion.')
      return
    }

    if (row?.fiscal_readiness?.can_issue === false) {
      await openReadinessModal(row, 'El comprobante no está listo para emitir')
      return
    }

    const { isConfirmed } = await Swal.fire({ title: 'Emitir comprobante', text: `Se emitira ${row.code} usando el conector configurado.`, icon: 'question', showCancelButton: true, confirmButtonText: 'Emitir', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await billingDocumentsRest.issue(row.id)
    if (!result) return
    tableRef.current?.refresh()
  }

  const onPrepareVoucher = async (row) => {
    openBulkModal(row)
  }

  const onSyncStatus = async (row) => {
    if (!canSyncDocument(row)) {
      await showBlockedAction('Sync no disponible', 'El comprobante aun no tiene datos remotos para sincronizar.')
      return
    }

    const result = await billingDocumentsRest.syncStatus(row.id)
    if (!result) return
    tableRef.current?.refresh()
  }

  const onOpenCancel = (row) => {
    if (!canCancelDocument(row)) {
      showBlockedAction('Anulación no disponible', 'Solo puedes anular comprobantes aceptados que no sean notas de crédito.')
      return
    }

    setSelectedRow(row)
    cancelReasonRef.current.value = row?.metadata?.cancel_reason ?? ''
    $(cancelModalRef.current).modal('show')
  }

  const onSaveCancel = async (e) => {
    e.preventDefault()
    if (!selectedRow) return
    const result = await billingDocumentsRest.cancel(selectedRow.id, { reason: cancelReasonRef.current.value.trim() })
    if (!result) return
    $(cancelModalRef.current).modal('hide')
    tableRef.current?.refresh()
  }

  const onOpenCreditNote = (row) => {
    if (!canCreditNoteDocument(row)) {
      showBlockedAction('Nota de crédito no disponible', 'Solo puedes generar nota de crédito desde comprobantes aceptados que no sean notas de crédito.')
      return
    }

    setSelectedRow(row)
    creditNoteSeriesRef.current.value = row?.branch?.series_nota_credito ?? 'FC01'
    creditNoteIssueDateRef.current.value = new Date().toISOString().slice(0, 10)
    creditNoteReasonRef.current.value = 'Anulación de la operación'
    creditNoteNoteRef.current.value = ''
    $(creditNoteModalRef.current).modal('show')
  }

  const onSaveCreditNote = async (e) => {
    e.preventDefault()
    if (!selectedRow) return
    const result = await billingDocumentsRest.creditNote(selectedRow.id, {
      series: creditNoteSeriesRef.current.value.trim(),
      issue_date: creditNoteIssueDateRef.current.value,
      reason: creditNoteReasonRef.current.value.trim(),
      note: creditNoteNoteRef.current.value.trim(),
    })
    if (!result) return
    $(creditNoteModalRef.current).modal('hide')
    tableRef.current?.refresh()
  }

  const onDownload = (row, type) => {
    if (type === 'pdf') {
      onPreviewPdf(row)
      return
    }

    if (!canDownloadDocument(row)) {
      showBlockedAction('Descarga no disponible', 'El comprobante todavía no tiene archivos fiscales disponibles.')
      return
    }

    window.open(billingDocumentsRest.downloadUrl(row.id, type), '_blank', 'noopener')
  }

  const onPreviewPdf = (row) => {
    if (!canPreviewPdfDocument(row)) {
      showBlockedAction('PDF no disponible', 'El comprobante todavía no tiene PDF disponible.')
      return
    }

    const url = billingDocumentsRest.downloadUrl(row.id, 'pdf')
    setPdfPreview({
      title: `Vista previa PDF - ${row.code ?? row.series ?? ''}`,
      url,
      downloadUrl: `${url}?download=1`,
    })
    $(pdfPreviewModalRef.current).modal('show')
  }

  const downloadPreviewPdf = () => {
    if (!pdfPreview.downloadUrl) return
    window.open(pdfPreview.downloadUrl, '_blank', 'noopener')
  }

  const resetReceivablePaymentForm = (row = null) => {
    if (receivablePaymentAmountRef.current) receivablePaymentAmountRef.current.value = row ? formatPaymentAmount(rowBalanceAmount(row)) : ''
    if (receivablePaymentDateRef.current) receivablePaymentDateRef.current.value = new Date().toISOString().slice(0, 10)
    setReceivablePaymentMethod('Transferencia')
    if (receivablePaymentBankRef.current) receivablePaymentBankRef.current.value = ''
    if (receivablePaymentOperationRef.current) receivablePaymentOperationRef.current.value = ''
    if (receivablePaymentFileRef.current) receivablePaymentFileRef.current.value = ''
    if (receivablePaymentObservationsRef.current) receivablePaymentObservationsRef.current.value = ''
  }

  const onOpenReceivablePayment = (row) => {
    if (!canPayDocument(row)) {
      showBlockedAction('Pago no disponible', row?.receivable_id ? 'El comprobante no tiene saldo pendiente.' : 'No se encontro una cuenta por cobrar relacionada.')
      return
    }

    setSelectedRow(row)
    setTimeout(() => {
      resetReceivablePaymentForm(row)
      $(receivablePaymentModalRef.current).modal('show')
    }, 0)
  }

  const onSubmitReceivablePayment = async (e) => {
    e.preventDefault()
    if (!selectedRow || paymentSending) return

    if (!receivablePaymentMethod) {
      Swal.fire({ icon: 'warning', title: 'Falta tipo de pago', text: 'Selecciona el tipo de pago.', confirmButtonText: 'Entendido' })
      return
    }

    setPaymentSending(true)
    try {
      const formData = new FormData()
      formData.append('amount', receivablePaymentAmountRef.current?.value || '')
      formData.append('payment_date', receivablePaymentDateRef.current?.value || '')
      formData.append('payment_method', receivablePaymentMethod)
      formData.append('bank', receivablePaymentBankRef.current?.value || '')
      formData.append('operation_number', receivablePaymentOperationRef.current?.value || '')
      formData.append('observations', receivablePaymentObservationsRef.current?.value || '')

      const file = receivablePaymentFileRef.current?.files?.[0]
      if (file) formData.append('payment_file', file)

      const result = await billingDocumentsRest.registerReceivablePayment(selectedRow.id, formData)
      if (!result?.data) return

      $(receivablePaymentModalRef.current).modal('hide')
      tableRef.current?.refresh()
    } finally {
      setPaymentSending(false)
    }
  }

  const onEmailDocument = (row) => {
    setSelectedRow(row)
    setEmailDraft(defaultEmailDraft(row))
    $(emailModalRef.current).modal('show')
  }

  const onEmailDraftChange = (field, value) => {
    setEmailDraft(previous => ({ ...previous, [field]: value }))
  }

  const onSendBillingEmail = async (e) => {
    e.preventDefault()
    if (!selectedRow || emailSending) return
    setEmailSending(true)
    try {
      const result = await billingDocumentsRest.email(selectedRow.id, emailDraft)
      if (!result) return
      $(emailModalRef.current).modal('hide')
      tableRef.current?.refresh()
    } finally {
      setEmailSending(false)
    }
  }

  const onPrintPreparedVoucher = async (row) => {
    if (canPreviewPdfDocument(row)) {
      onPreviewPdf(row)
      return
    }

    if (!hasPreparedVoucher(row)) {
      await showBlockedAction('Comprobante no preparado', 'Primero debes facturar la prefactura para generar serie y numero.')
      return
    }

    const popup = window.open('', '_blank')
    if (!popup) {
      await showBlockedAction('Impresion bloqueada', 'El navegador bloqueo la ventana de impresion.')
      return
    }

    const items = row?.items ?? []
    const itemsHtml = items.length
      ? items.map(item => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td class="right">${Number(item.quantity ?? 0).toFixed(2)}</td>
          <td class="right">${Number(item.unit_price ?? 0).toFixed(2)}</td>
          <td class="right">${Number(item.total ?? 0).toFixed(2)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" class="muted">Sin detalle de items</td></tr>'

    popup.document.write(`<!doctype html>
      <html>
        <head>
          <title>${escapeHtml(row.code)} - ${escapeHtml(row.series)}-${escapeHtml(row.sequence)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #222; margin: 28px; font-size: 12px; }
            h1 { font-size: 20px; margin: 0 0 4px; }
            h2 { font-size: 15px; margin: 20px 0 8px; }
            .muted { color: #666; }
            .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #ddd; padding-bottom: 14px; }
            .number { text-align: right; font-size: 16px; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-top: 18px; }
            .label { color: #666; font-size: 11px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
            th { background: #f5f5f5; text-align: left; }
            .right { text-align: right; }
            .totals { width: 260px; margin-left: auto; margin-top: 14px; }
            @media print { button { display: none; } body { margin: 0; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Imprimir</button>
          <div class="header">
            <div>
              <h1>${escapeHtml(row?.business?.name ?? 'Empresa')}</h1>
              <div class="muted">${escapeHtml(row?.branch?.address ?? '')}</div>
              <div class="muted">${escapeHtml(row?.business?.tax_number ?? '')}</div>
            </div>
            <div class="number">
              ${escapeHtml(row.document_type ?? 'Comprobante')}<br>
              ${escapeHtml(row.series)}-${escapeHtml(row.sequence)}
            </div>
          </div>
          <div class="grid">
            <div><div class="label">Prefactura</div>${escapeHtml(row.code)}</div>
            <div><div class="label">Fecha</div>${escapeHtml(formatDate(row.issue_date))}</div>
            <div><div class="label">Cliente</div>${escapeHtml(rowClientName(row))}</div>
            <div><div class="label">Moneda</div>${escapeHtml(currencyLabel(row.currency))}</div>
            <div><div class="label">Orden de servicio</div>${escapeHtml(rowSourceCode(row))}</div>
            <div><div class="label">Condicion</div>${escapeHtml(row.payment_condition ?? '-')}</div>
          </div>
          <h2>Detalle</h2>
          <table>
            <thead>
              <tr>
                <th>Descripcion</th>
                <th class="right">Cantidad</th>
                <th class="right">P. Unitario</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <table class="totals">
            <tr><th>Subtotal</th><td class="right">${Number(row.subtotal ?? 0).toFixed(2)}</td></tr>
            <tr><th>IGV</th><td class="right">${Number(row.tax_amount ?? 0).toFixed(2)}</td></tr>
            <tr><th>Total</th><td class="right">${Number(row.total ?? 0).toFixed(2)}</td></tr>
          </table>
        </body>
      </html>`)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  const refreshGrid = () => tableRef.current?.refresh()
  const updateStorageFilter = (field, value) => setStorageFilters(prev => ({ ...prev, [field]: value }))
  const applyStorageFilters = (e) => {
    e?.preventDefault?.()
    setAppliedStorageFilters({ ...storageFilters })
  }
  const openReportModal = () => {
    setModalReportFilters(reportFilters())
    $(reportModalRef.current).modal('show')
  }
  const openBulkModal = (row = null) => {
    const rowClientId = row?.client_id ?? row?.client?.id ?? ''
    const defaultFilters = emptyBulkFilters()
    const rawDetractionPercent = row ? rowDetractionPercent(row) : 0
    // Lo que se marco en el pedido comercial manda como valor inicial: si alli se dijo que la
    // operacion lleva detraccion, no tiene sentido volver a decidirlo aqui desde cero.
    const fromOrder = orderDetraction(row)
    const detractionPercent = fromOrder?.percent || rawDetractionPercent || defaultFilters.detractionPercent
    setBulkFilters({
      clientId: row ? `${rowClientId}` : '',
      documentType: row?.document_type ?? defaultFilters.documentType,
      currency: row?.currency ?? defaultFilters.currency,
      detraction: !!fromOrder?.enabled || Boolean(row?.metadata?.detraction_enabled) || rawDetractionPercent > 0,
      detractionPercent,
      detractionTypeId: fromOrder?.typeId ?? '',
      detractionCode: fromOrder?.code ?? '',
    })
    setBulkRows(row ? [row] : [])
    setBulkSelected(row?.id ? [row.id] : [])
    $(bulkModalRef.current).modal('show')
  }
  const storageFilterValue = useMemo(
    () => isStorageBilling ? buildStorageFilter(activeStorageTab, appliedStorageFilters) : null,
    [isStorageBilling, activeStorageTab, appliedStorageFilters]
  )
  const gridKey = isStorageBilling
    ? `storage-billing-${activeStorageTab}-${JSON.stringify(storageFilterValue)}`
    : 'billing-documents'
  const prefacturesForBulkFilter = () => combineFilters([
    tabFilter('prefactures'),
    bulkFilters.clientId ? ['client_id', '=', Number(bulkFilters.clientId)] : null,
    bulkFilters.currency ? ['currency', '=', bulkFilters.currency] : null,
    bulkFilters.documentType ? ['document_type', '=', bulkFilters.documentType] : null,
  ])
  const loadBulkPrefactures = async (e) => {
    e?.preventDefault?.()
    if (!bulkFilters.clientId) {
      await showBlockedAction('Cliente requerido', 'Selecciona un cliente para buscar prefacturas.')
      return
    }
    setBulkLoading(true)
    try {
      const response = await billingDocumentsRest.paginate({ skip: 0, take: 1000, isLoadingAll: true, filter: prefacturesForBulkFilter() })
      if (Number(response?.status ?? 200) >= 400) throw new Error(response?.message || 'No se pudieron cargar las prefacturas')
      const rows = response?.data ?? []
      const detractionPercent = rowsDetractionPercent(rows)
      // Si los pedidos de origen ya traian tipo de detraccion, se toma el primero que aparezca en
      // vez de dejar al usuario elegirlo otra vez.
      const fromOrder = rows.map(orderDetraction).find(Boolean) ?? null
      setBulkRows(rows)
      setBulkSelected(rows.map(row => row.id))
      setBulkFilters(prev => ({
        ...prev,
        detraction: prev.detraction || !!fromOrder || detractionPercent > 0,
        detractionPercent: fromOrder?.percent || detractionPercent || prev.detractionPercent || 12,
        detractionTypeId: prev.detractionTypeId || fromOrder?.typeId || '',
        detractionCode: prev.detractionCode || fromOrder?.code || '',
      }))
    } catch (error) {
      await showBlockedAction('Error', error.message || 'No se pudieron cargar las prefacturas.')
    } finally {
      setBulkLoading(false)
    }
  }
  const toggleBulkRow = (id, checked) => setBulkSelected(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(item => item !== id))
  const toggleAllBulkRows = (checked) => setBulkSelected(checked ? bulkRows.map(row => row.id) : [])
  const selectedBulkRows = bulkRows.filter(row => bulkSelected.includes(row.id))
  const bulkTotal = selectedBulkRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0)
  const bulkDetractionPercent = toNumber(bulkFilters.detractionPercent, 0)
  const bulkDetractionAmount = bulkFilters.detraction ? selectedBulkRows.reduce((sum, row) => sum + rowDetractionAmount(row, bulkDetractionPercent), 0) : 0
  const bulkNetTotal = roundMoney(bulkTotal - bulkDetractionAmount)
  const onIssueBulk = async (e) => {
    e.preventDefault()
    if (bulkSelected.length === 0) {
      await showBlockedAction('Seleccion requerida', 'Selecciona al menos una prefactura.')
      return
    }
    const selectedRows = selectedBulkRows
    if (selectedRows.some(isDemoProviderRow)) {
      await showBlockedAction('Facturador en modo demo', 'No se enviara a SUNAT hasta configurar el facturador en produccion.')
      return
    }

    const selectedLabel = selectedRows.length === 1 ? selectedRows[0]?.code : `${bulkSelected.length} prefacturas seleccionadas`
    const { isConfirmed } = await Swal.fire({
      title: selectedRows.length === 1 ? 'Facturar prefactura' : 'Facturar en bloque',
      text: `Se asignara serie y numero a ${selectedLabel} y se enviara al conector configurado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Facturar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return
    for (const row of selectedRows) {
      const prepared = await billingDocumentsRest.prepareVoucher(row.id, {
        detraction_enabled: bulkFilters.detraction,
        detraction_percent: bulkFilters.detraction ? bulkDetractionPercent : null,
        detraction_amount: bulkFilters.detraction ? rowDetractionAmount(row, bulkDetractionPercent) : null,
        // El codigo sale del tipo elegido en el catalogo; 022 solo queda como respaldo
        // para no cambiar el comportamiento de quien no elija tipo.
        detraction_code: bulkFilters.detractionCode || '022',
        detraction_payment_method_code: '001',
      })
      if (!prepared) return
      const result = await billingDocumentsRest.issue(row.id)
      if (!result) return
    }
    $(bulkModalRef.current).modal('hide')
    refreshGrid()
  }

  const reportFilterValue = (filters = modalReportFilters) => buildStorageFilter('issued', filters)
  const loadReportRows = async (filters = modalReportFilters) => {
    const response = await billingDocumentsRest.paginate({ skip: 0, take: 5000, isLoadingAll: true, filter: reportFilterValue(filters) })
    if (Number(response?.status ?? 200) >= 400) throw new Error(response?.message || 'No se pudo generar el reporte')
    return response?.data ?? []
  }
  const reportColumns = [
    ['Serie', row => row.series ?? ''],
    ['Secuencia', row => row.sequence ?? ''],
    ['SUNAT', row => rowSunatLabel(row)],
    ['E. Pago', row => rowPaymentLabel(row)],
    ['Cliente', row => rowClientLabel(row)],
    ['Moneda', row => currencyLabel(row.currency)],
    ['Gravada', row => Number(row.subtotal ?? 0)],
    ['IGV', row => Number(row.tax_amount ?? 0)],
    ['Importe', row => Number(row.total ?? 0)],
    ['A cuenta', row => rowPaidAmount(row)],
    ['Saldo', row => rowBalanceAmount(row)],
    ['Fecha Facturacion', row => formatDateTime(rowIssuedAt(row))],
  ]
  const exportRows = async (rows, fileName, type = 'xlsx', columns = reportColumns) => {
    if (type === 'pdf') {
      const JsPDF = window.jspdf?.jsPDF || window.jsPDF
      if (!JsPDF || !JsPDF.API?.autoTable) throw new Error('jsPDF o AutoTable no estan disponibles')
      const doc = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      doc.setFontSize(12)
      doc.text(fileName, 24, 28)
      doc.autoTable({
        head: [columns.map(([label]) => label)],
        body: rows.map(row => columns.map(([, value]) => value(row))),
        startY: 40,
        styles: { fontSize: 7, cellPadding: 3 },
      })
      doc.save(`${fileName}.pdf`)
      return
    }
    if (window.ExcelJS && window.saveAs) {
      const workbook = new window.ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Reporte')
      worksheet.addRow(columns.map(([label]) => label))
      rows.forEach(row => worksheet.addRow(columns.map(([, value]) => value(row))))
      worksheet.columns.forEach(column => { column.width = 18 })
      const buffer = await workbook.xlsx.writeBuffer()
      window.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${fileName}.xlsx`)
      return
    }
    const csv = [
      columns.map(([label]) => `"${label}"`).join(','),
      ...rows.map(row => columns.map(([, value]) => `"${`${value(row) ?? ''}`.replaceAll('"', '""')}"`).join(',')),
    ].join('\n')
    window.saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${fileName}.csv`)
  }
  const generateIssuedReport = async (type = 'xlsx', filters = modalReportFilters) => {
    try {
      const rows = await loadReportRows(filters)
      await exportRows(rows, 'reporte-facturas-emitidas', type)
    } catch (error) {
      await showBlockedAction('Reporte no disponible', error.message || 'No se pudo generar el reporte.')
    }
  }
  const storageStatusBadge = (row) => {
    if (row?.local_status === 'pending') {
      return hasPreparedVoucher(row)
        ? { label: 'Facturado', className: 'badge bg-soft-success text-success border border-success' }
        : { label: 'En espera', className: 'badge bg-soft-warning text-warning border border-warning' }
    }
    if (['sent', 'accepted', 'observed', 'rejected'].includes(row?.local_status)) {
      return { label: 'Facturado', className: 'badge bg-soft-success text-success border border-success' }
    }
    if (row?.local_status === 'cancelled') return { label: 'Anulada', className: 'badge bg-soft-danger text-danger border border-danger' }
    return { label: getBillingDocumentStatusLabel(row?.local_status), className: 'badge bg-soft-secondary text-secondary' }
  }

  // Estado SUNAT claro y con color para la tabla general
  const sunatStatusBadge = (row) => {
    const isDemo = (row?.provider_mode ?? '') === 'demo'
    switch (row?.local_status) {
      case 'accepted': return { label: isDemo ? 'Aceptada (demo)' : 'Aceptada', className: 'badge bg-soft-success text-success border border-success' }
      case 'rejected': return { label: 'Rechazada', className: 'badge bg-soft-danger text-danger border border-danger' }
      case 'observed': return { label: 'Observada', className: 'badge bg-soft-warning text-warning border border-warning' }
      case 'sent': return { label: 'Enviada', className: 'badge bg-soft-info text-info border border-info' }
      case 'cancelled': return { label: 'Anulada', className: 'badge bg-soft-danger text-danger border border-danger' }
      case 'pending':
        return hasPreparedVoucher(row)
          ? { label: 'Por enviar', className: 'badge bg-soft-warning text-warning border border-warning' }
          : { label: 'Borrador', className: 'badge bg-soft-secondary text-secondary border border-secondary' }
      default: return { label: getBillingDocumentStatusLabel(row?.local_status) || 'Pendiente', className: 'badge bg-soft-secondary text-secondary border border-secondary' }
    }
  }

  // Exportacion a Excel del listado (reemplaza el export nativo de dxDataGrid); respeta filtros/orden actuales via tableRef.loadAll()
  const storageExportColumnsByTab = {
    prefactures: [
      ['Estado', row => storageStatusBadge(row).label],
      ['Codigo', row => row.code ?? ''],
      ['Comprobante', row => `${row.series || ''}${row.series || row.sequence ? ' - ' : ''}${row.sequence || ''}` || row.document_type || ''],
      ['OS', row => rowSourceCode(row)],
      ['Tipo', row => rowDescription(row)],
      ['Cliente', row => rowClientName(row)],
      ['Importe', row => Number(row.total ?? 0)],
      ['Tipo comprobante', row => row.document_type ?? ''],
      ['Moneda', row => currencyLabel(row.currency)],
      ['F. OS', row => formatDate(rowServiceOrderDate(row))],
      ['F. Registro', row => formatDateTime(row.created_at)],
    ],
    issued: reportColumns,
    cancelled: [
      ['Serie', row => row.series ?? ''],
      ['Secuencia', row => row.sequence ?? ''],
      ['Cliente', row => rowClientName(row)],
      ['Moneda', row => currencyLabel(row.currency)],
      ['Total Gravada', row => Number(row.subtotal ?? 0)],
      ['IGV', row => Number(row.tax_amount ?? 0)],
      ['Importe Factura', row => Number(row.total ?? 0)],
      ['F. Facturacion', row => formatDate(row.issue_date)],
      ['F. Anulacion', row => formatDateTime(row.cancelled_at)],
    ],
    'credit-notes': [
      ['Serie', row => row.series ?? ''],
      ['Secuencia', row => row.sequence ?? ''],
      ['SUNAT', row => rowSunatLabel(row)],
      ['Doc. Afecto', row => row.reference_document?.code ?? row.referenceDocument?.code ?? '-'],
      ['Cliente', row => rowClientName(row)],
      ['Moneda', row => currencyLabel(row.currency)],
      ['Total Gravada', row => Number(row.subtotal ?? 0)],
      ['IGV', row => Number(row.tax_amount ?? 0)],
      ['Importe Factura', row => Number(row.total ?? 0)],
      ['Tipo de pago', row => row.payment_condition ?? ''],
      ['Fecha Facturacion', row => formatDate(row.issue_date)],
    ],
  }

  const exportStorageGrid = async () => {
    try {
      const rows = await tableRef.current?.loadAll()
      if (!rows) return
      const columns = storageExportColumnsByTab[activeStorageTab] ?? storageExportColumnsByTab.prefactures
      await exportRows(rows, `control-facturacion-${activeStorageTab}`, 'xlsx', columns)
    } catch (error) {
      await showBlockedAction('Exportación no disponible', error.message || 'No se pudo exportar el listado.')
    }
  }

  const storageColumnsByTab = {
    prefactures: [
      {
        key: 'estado_facturacion', label: 'E. Facturación', field: 'local_status', width: '130px',
        filter: { type: 'select', field: 'local_status', options: billingControlStatusOptions },
        render: (row) => { const badge = storageStatusBadge(row); return <span className={badge.className}>{badge.label}</span> },
      },
      { key: 'codigo', label: 'Código', field: 'code', width: '115px', filter: { type: 'text' } },
      {
        key: 'comprobante', label: 'Comprobante', sortable: false, width: '130px',
        render: (row) => `${row.series || ''}${row.series || row.sequence ? ' - ' : ''}${row.sequence || ''}` || row.document_type,
      },
      { key: 'os', label: 'OS', sortable: false, width: '120px', render: (row) => rowSourceCode(row) },
      { key: 'tipo', label: 'Tipo', sortable: false, render: (row) => rowDescription(row) },
      { key: 'cliente', label: 'Cliente', sortable: false, render: (row) => rowClientName(row) },
      { key: 'importe', label: 'Importe', field: 'total', width: '110px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.total) },
      { key: 'tipo_comprobante', label: 'Tipo comprobante', field: 'document_type', width: '140px', filter: { type: 'text' } },
      {
        key: 'moneda', label: 'Moneda', field: 'currency', width: '100px',
        filter: { type: 'select', field: 'currency', options: currencyFilterOptions },
        render: (row) => currencyLabel(row.currency),
      },
      { key: 'fecha_os', label: 'F. OS', sortable: false, width: '120px', render: (row) => formatDate(rowServiceOrderDate(row)) },
      { key: 'fecha_registro', label: 'F. Registro', field: 'created_at', width: '160px', filter: { type: 'date' }, render: (row) => formatDateTime(row.created_at) },
    ],
    issued: [
      { key: 'serie', label: 'Serie', field: 'series', width: '90px', filter: { type: 'text' } },
      { key: 'secuencia', label: 'Secuencia', field: 'sequence', width: '110px', filter: { type: 'text' } },
      {
        key: 'sunat', label: 'SUNAT', sortable: false, width: '110px',
        render: (row) => { const badge = rowSunatMeta(row); return <span className={badge.className}>{badge.label}</span> },
      },
      {
        key: 'e_pago', label: 'E. Pago', sortable: false, width: '110px',
        render: (row) => { const badge = rowPaymentMeta(row); return <span className={badge.className}>{badge.label}</span> },
      },
      { key: 'cliente', label: 'Cliente', sortable: false, render: (row) => rowClientLabel(row) },
      {
        key: 'moneda', label: 'Moneda', field: 'currency', width: '100px',
        filter: { type: 'select', field: 'currency', options: currencyFilterOptions },
        render: (row) => currencyLabel(row.currency),
      },
      { key: 'gravada', label: 'Gravada', field: 'subtotal', width: '110px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.subtotal) },
      { key: 'igv', label: 'IGV', field: 'tax_amount', width: '90px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.tax_amount) },
      { key: 'importe', label: 'Importe', field: 'total', width: '110px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.total) },
      { key: 'a_cuenta', label: 'A cuenta', sortable: false, width: '105px', align: 'right', render: (row) => formatMoney(rowPaidAmount(row)) },
      { key: 'saldo', label: 'Saldo', sortable: false, width: '105px', align: 'right', render: (row) => formatMoney(rowBalanceAmount(row)) },
      { key: 'fecha_facturacion', label: 'Fecha Facturación', field: 'updated_at', width: '170px', render: (row) => formatDateTime(rowIssuedAt(row)) },
    ],
    cancelled: [
      { key: 'serie', label: 'Serie', field: 'series', width: '90px', filter: { type: 'text' } },
      { key: 'secuencia', label: 'Secuencia', field: 'sequence', width: '110px', filter: { type: 'text' } },
      { key: 'cliente', label: 'Cliente', sortable: false, render: (row) => rowClientName(row) },
      {
        key: 'moneda', label: 'Moneda', field: 'currency', width: '100px',
        filter: { type: 'select', field: 'currency', options: currencyFilterOptions },
        render: (row) => currencyLabel(row.currency),
      },
      { key: 'gravada', label: 'Total Gravada', field: 'subtotal', width: '130px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.subtotal) },
      { key: 'igv', label: 'IGV', field: 'tax_amount', width: '90px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.tax_amount) },
      { key: 'importe', label: 'Importe Factura', field: 'total', width: '130px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.total) },
      { key: 'fecha_facturacion', label: 'F. Facturación', field: 'issue_date', width: '130px', filter: { type: 'date' }, render: (row) => formatDate(row.issue_date) },
      { key: 'fecha_anulacion', label: 'F. Anulación', field: 'cancelled_at', width: '160px', filter: { type: 'date' }, render: (row) => formatDateTime(row.cancelled_at) },
    ],
    'credit-notes': [
      { key: 'serie', label: 'Serie', field: 'series', width: '90px', filter: { type: 'text' } },
      { key: 'secuencia', label: 'Secuencia', field: 'sequence', width: '110px', filter: { type: 'text' } },
      { key: 'sunat', label: 'SUNAT', sortable: false, width: '140px', render: (row) => rowSunatLabel(row) },
      { key: 'doc_afecto', label: 'Doc. Afecto', sortable: false, width: '130px', render: (row) => row.reference_document?.code ?? row.referenceDocument?.code ?? '-' },
      { key: 'cliente', label: 'Cliente', sortable: false, render: (row) => rowClientName(row) },
      {
        key: 'moneda', label: 'Moneda', field: 'currency', width: '100px',
        filter: { type: 'select', field: 'currency', options: currencyFilterOptions },
        render: (row) => currencyLabel(row.currency),
      },
      { key: 'gravada', label: 'Total Gravada', field: 'subtotal', width: '130px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.subtotal) },
      { key: 'igv', label: 'IGV', field: 'tax_amount', width: '90px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.tax_amount) },
      { key: 'importe', label: 'Importe Factura', field: 'total', width: '130px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.total) },
      { key: 'tipo_pago', label: 'Tipo de pago', field: 'payment_condition', width: '120px', filter: { type: 'text' } },
      { key: 'fecha_facturacion', label: 'Fecha Facturación', field: 'issue_date', width: '150px', filter: { type: 'date' }, render: (row) => formatDate(row.issue_date) },
    ],
  }

  const regularColumns = [
    { key: 'id', label: 'ID', field: 'id', width: '70px', filter: { type: 'number' } },
    { key: 'codigo', label: 'Código', field: 'code', width: '120px', filter: { type: 'text' } },
    { key: 'origen', label: 'Origen', field: 'source_type', width: '120px', filter: { type: 'text' }, render: (row) => getSourceTypeLabel(row.source_type) },
    { key: 'documento_origen', label: 'Documento origen', sortable: false, render: (row) => row.commercial_order?.code ?? row.commercialOrder?.code ?? row.service_order?.code ?? row.serviceOrder?.code ?? '-' },
    { key: 'comprobante', label: 'Comprobante', field: 'document_type', width: '120px', filter: { type: 'text' } },
    {
      key: 'estado_sunat', label: 'Estado SUNAT', field: 'local_status', width: '130px',
      filter: {
        type: 'select', field: 'local_status', options: [
          { value: 'accepted', label: 'Aceptada' },
          { value: 'rejected', label: 'Rechazada' },
          { value: 'observed', label: 'Observada' },
          { value: 'sent', label: 'Enviada' },
          { value: 'pending', label: 'Pendiente' },
          { value: 'cancelled', label: 'Anulada' },
        ],
      },
      render: (row) => {
        const meta = sunatStatusBadge(row)
        return <span className={meta.className} title={row.external_status ?? ''}>{meta.label}</span>
      },
    },
    { key: 'referencia', label: 'Referencia', sortable: false, render: (row) => row.reference_document?.code ?? row.referenceDocument?.code ?? '-' },
    { key: 'serie', label: 'Serie', field: 'series', width: '80px', filter: { type: 'text' } },
    { key: 'numero', label: 'Número', field: 'sequence', width: '100px', filter: { type: 'text' } },
    { key: 'fecha', label: 'Fecha', field: 'issue_date', width: '110px', filter: { type: 'date' }, render: (row) => formatDate(row.issue_date) },
    { key: 'total', label: 'Total', field: 'total', width: '100px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoney(row.total) },
    {
      key: 'listo_fiscal', label: 'Listo fiscal', sortable: false, width: '120px',
      render: (row) => {
        const readiness = row?.fiscal_readiness ?? {}
        const meta = getReadinessMeta(readiness)
        return (
          <button type='button' className={`btn btn-xs w-100 ${meta.className}`} title={readiness.summary ?? meta.label} onClick={() => openReadinessModal(row, `Validación fiscal - ${row.code}`)}>
            {meta.label}
          </button>
        )
      },
    },
  ]

  // Botones de accion por fila (tabla regular): siempre visibles, coloreados segun disponibilidad;
  // al hacer click en un estado bloqueado se explica el motivo (misma UX que ya usaba esta pantalla)
  const regularRowActions = (row) => {
    const readiness = row?.fiscal_readiness ?? {}
    const canIssueNow = readiness?.can_issue !== false
    const canEdit = canEditDocument(row)
    const canSync = canSyncDocument(row)
    const canCancel = canCancelDocument(row)
    const canCreditNote = canCreditNoteDocument(row)
    const canDownload = canDownloadDocument(row)
    const canPreviewPdf = canPreviewPdfDocument(row)

    return [
      { icon: canEdit ? 'mdi mdi-pencil' : 'mdi mdi-lock-outline', title: canEdit ? 'Editar comprobante' : 'Solo lectura', ...(canEdit ? rowActionColors.blue : rowActionColors.slate), onClick: (r) => canEditDocument(r) ? onModalOpen(r) : showBlockedAction('Comprobante bloqueado', 'Solo puedes editar comprobantes pendientes.') },
      { icon: 'mdi mdi-code-json', title: 'Ver payload del conector', ...rowActionColors.slate, onClick: (r) => onOpenPayload(r) },
      { icon: canIssueNow ? 'mdi mdi-send' : 'mdi mdi-alert-circle-outline', title: canIssueNow ? 'Emitir comprobante' : 'Revisar requisitos fiscales', ...(canIssueNow ? rowActionColors.green : rowActionColors.slate), onClick: (r) => (r?.fiscal_readiness?.can_issue !== false) ? onIssue(r) : openReadinessModal(r, `Validación fiscal - ${r.code}`) },
      { icon: canSync ? 'mdi mdi-sync' : 'mdi mdi-sync-off', title: canSync ? 'Sincronizar estado' : 'Sincronización no disponible', ...(canSync ? rowActionColors.blue : rowActionColors.slate), onClick: (r) => canSyncDocument(r) ? onSyncStatus(r) : showBlockedAction('Sync no disponible', 'El comprobante aún no tiene datos remotos para sincronizar.') },
      { icon: canCancel ? 'mdi mdi-close-circle' : 'mdi mdi-lock-outline', title: canCancel ? 'Anular comprobante' : 'Anulación no disponible', ...(canCancel ? rowActionColors.red : rowActionColors.slate), onClick: (r) => canCancelDocument(r) ? onOpenCancel(r) : showBlockedAction('Anulación no disponible', 'Solo puedes anular comprobantes aceptados que no sean notas de crédito.') },
      { icon: canCreditNote ? 'mdi mdi-file-replace' : 'mdi mdi-file-lock-outline', title: canCreditNote ? 'Generar nota de crédito' : 'Nota de crédito no disponible', ...rowActionColors.slate, onClick: (r) => canCreditNoteDocument(r) ? onOpenCreditNote(r) : showBlockedAction('Nota de crédito no disponible', 'Solo puedes generar nota de crédito desde comprobantes aceptados que no sean notas de crédito.') },
      { icon: canPreviewPdf ? 'mdi mdi-file-pdf-box' : 'mdi mdi-file-cancel-outline', title: canPreviewPdf ? 'Previsualizar PDF' : 'PDF no disponible', ...(canPreviewPdf ? rowActionColors.red : rowActionColors.slate), onClick: (r) => canPreviewPdfDocument(r) ? onPreviewPdf(r) : showBlockedAction('PDF no disponible', 'El comprobante todavía no tiene PDF disponible.') },
      { icon: canDownload ? 'mdi mdi-code-tags' : 'mdi mdi-file-cancel-outline', title: canDownload ? 'Descargar XML' : 'XML no disponible', ...(canDownload ? rowActionColors.blue : rowActionColors.slate), onClick: (r) => canDownloadDocument(r) ? onDownload(r, 'xml') : showBlockedAction('Descarga no disponible', 'El comprobante todavía no tiene archivos fiscales disponibles.') },
      { icon: canDownload ? 'mdi mdi-shield-check' : 'mdi mdi-file-cancel-outline', title: canDownload ? 'Descargar CDR' : 'CDR no disponible', ...(canDownload ? rowActionColors.green : rowActionColors.slate), onClick: (r) => canDownloadDocument(r) ? onDownload(r, 'cdr') : showBlockedAction('Descarga no disponible', 'El comprobante todavía no tiene archivos fiscales disponibles.') },
      { icon: 'mdi mdi-cloud-check', title: 'Registrar respuesta del proveedor', ...rowActionColors.slate, onClick: (r) => onOpenProviderModal(r) },
    ]
  }

  const prefacturesRowActions = (row) => {
    const isPrepared = hasPreparedVoucher(row)
    return [
      {
        icon: isPrepared ? 'mdi mdi-file-pdf-box' : 'mdi mdi-file-send-outline',
        title: isPrepared ? 'Previsualizar PDF' : 'Facturar',
        ...(isPrepared ? rowActionColors.red : rowActionColors.blue),
        onClick: (r) => hasPreparedVoucher(r) ? onPrintPreparedVoucher(r) : onPrepareVoucher(r),
      },
    ]
  }

  const issuedRowActions = (row) => {
    const canPay = canPayDocument(row)
    const shouldShowRetryIssue = row?.local_status === 'pending' && hasPreparedVoucher(row)
    const canRetryIssue = canRetryIssueDocument(row)
    const canCreditNote = canCreditNoteDocument(row)
    const canPreviewPdf = canPreviewPdfDocument(row)
    const canCancel = canCancelDocument(row)
    const canDownloadFiscalFiles = canDownloadDocument(row) && !isDemoProviderRow(row)
    const hasEmail = !!rowCustomerEmail(row)

    return [
      { icon: 'mdi mdi-cash-plus', title: canPay ? 'Realizar pago' : 'Pago no disponible', ...(canPay ? rowActionColors.amber : rowActionColors.slate), onClick: (r) => onOpenReceivablePayment(r) },
      {
        icon: 'mdi mdi-send',
        title: canRetryIssue ? 'Reintentar envío a SUNAT' : (isDemoProviderRow(row) ? 'Envío a SUNAT deshabilitado en modo demo' : 'Comprobante ya emitido o cerrado'),
        ...(canRetryIssue ? rowActionColors.green : rowActionColors.slate),
        hidden: !shouldShowRetryIssue,
        onClick: (r) => onIssue(r),
      },
      { icon: 'mdi mdi-refresh', title: canCreditNote ? 'Generar nota de crédito' : 'Nota de crédito no disponible', ...(canCreditNote ? rowActionColors.amber : rowActionColors.slate), onClick: (r) => onOpenCreditNote(r) },
      { icon: canPreviewPdf ? 'mdi mdi-file-pdf-box' : 'mdi mdi-file-cancel-outline', title: canPreviewPdf ? 'Previsualizar PDF' : 'PDF no disponible', ...(canPreviewPdf ? rowActionColors.blue : rowActionColors.slate), onClick: (r) => onPreviewPdf(r) },
      { icon: 'mdi mdi-minus-circle', title: canCancel ? 'Anular comprobante' : 'Anulación no disponible', ...(canCancel ? rowActionColors.red : rowActionColors.slate), onClick: (r) => onOpenCancel(r) },
      {
        icon: 'mdi mdi-email-outline',
        title: canPreviewPdf ? (hasEmail ? 'Enviar por correo' : 'Enviar por correo sin destinatario guardado') : 'Correo no disponible',
        ...(canPreviewPdf ? (hasEmail ? rowActionColors.green : rowActionColors.amber) : rowActionColors.slate),
        onClick: (r) => canPreviewPdfDocument(r) ? onEmailDocument(r) : showBlockedAction('Correo no disponible', 'El comprobante todavía no tiene PDF disponible para enviar por correo.'),
      },
      { icon: canDownloadFiscalFiles ? 'mdi mdi-file-code-outline' : 'mdi mdi-file-cancel-outline', title: canDownloadFiscalFiles ? 'Descargar XML' : 'XML no disponible', ...(canDownloadFiscalFiles ? rowActionColors.green : rowActionColors.slate), onClick: (r) => (canDownloadDocument(r) && !isDemoProviderRow(r)) ? onDownload(r, 'xml') : showBlockedAction('Descarga no disponible', 'El comprobante todavía no tiene archivos fiscales disponibles.') },
      { icon: canDownloadFiscalFiles ? 'mdi mdi-file-document-outline' : 'mdi mdi-file-cancel-outline', title: canDownloadFiscalFiles ? 'Descargar CDR' : 'CDR no disponible', ...(canDownloadFiscalFiles ? rowActionColors.amber : rowActionColors.slate), onClick: (r) => (canDownloadDocument(r) && !isDemoProviderRow(r)) ? onDownload(r, 'cdr') : showBlockedAction('Descarga no disponible', 'El comprobante todavía no tiene archivos fiscales disponibles.') },
    ]
  }

  const readonlyRowActions = (row) => {
    const canPreviewPdf = canPreviewPdfDocument(row)
    return [
      {
        icon: canPreviewPdf ? 'mdi mdi-file-pdf-box' : 'mdi mdi-file-document-outline',
        title: canPreviewPdf ? 'Previsualizar PDF' : 'Ver validación fiscal',
        ...(canPreviewPdf ? rowActionColors.red : rowActionColors.blue),
        onClick: (r) => canPreviewPdfDocument(r) ? onPreviewPdf(r) : openReadinessModal(r, `Validación fiscal - ${r.code}`),
      },
    ]
  }

  const rowActions = (row) => {
    if (!isStorageBilling) return regularRowActions(row)
    if (activeStorageTab === 'prefactures') return prefacturesRowActions(row)
    if (activeStorageTab === 'issued') return issuedRowActions(row)
    return readonlyRowActions(row)
  }

  const activeStorageTabLabel = storageTabs.find(tab => tab.id === activeStorageTab)?.label ?? 'Listado'

  const storageToolbar = (
    <div className='mb-3'>
      <ul className='nav nav-tabs nav-bordered mb-3'>
        {storageTabs.map(tab => (
          <li className='nav-item' key={`storage-billing-tab-${tab.id}`}>
            <button
              type='button'
              className={`nav-link ${activeStorageTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveStorageTab(tab.id)
                setStorageFilters(defaultStorageFilters())
                setAppliedStorageFilters(emptyFilters())
              }}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      <form className='row g-3 align-items-end' onSubmit={applyStorageFilters}>
        <div className='col-12 col-lg-4'>
          <VdSelect
            label='Empresa'
            noMargin
            value={storageFilters.businessId}
            onChange={(value) => updateStorageFilter('businessId', value)}
            options={[{ value: '', label: 'Todos' }, ...businesses.map(row => ({ value: `${row.id}`, label: row.name }))]}
            placeholder='Todos'
          />
        </div>
        {activeStorageTab === 'prefactures' && <div className='col-12 col-lg-3'>
          <VdSelect
            label='Cliente'
            noMargin
            value={storageFilters.clientId}
            onChange={(value) => updateStorageFilter('clientId', value)}
            options={[{ value: '', label: 'Todos' }, ...clients.map(row => ({ value: `${row.id}`, label: `${row.document_number ? `${row.document_number} - ` : ''}${row.full_name}` }))]}
            placeholder='Todos'
          />
        </div>}
        <div className='col-12 col-md-6 col-lg-2'>
          <label className='form-label'>{activeStorageTab === 'prefactures' ? 'Fecha OS Inicio' : 'Fecha Registro Inicio'}</label>
          <input type='date' className='form-control' value={storageFilters.startDate} onChange={(e) => updateStorageFilter('startDate', e.target.value)} />
        </div>
        <div className='col-12 col-md-6 col-lg-2'>
          <label className='form-label'>{activeStorageTab === 'prefactures' ? 'Fecha OS Fin' : 'Fecha Registro Fin'}</label>
          <input type='date' className='form-control' value={storageFilters.endDate} onChange={(e) => updateStorageFilter('endDate', e.target.value)} />
        </div>
        <div className='col-12 col-lg-1 d-flex gap-2'>
          <button type='submit' className='btn btn-outline-primary w-100'><i className='mdi mdi-magnify me-1'></i>Filtrar</button>
        </div>
        {activeStorageTab === 'issued' && <div className='col-12 d-flex justify-content-center gap-2'>
          <button type='button' className='btn btn-outline-danger' onClick={() => generateIssuedReport('pdf', appliedStorageFilters)}><i className='mdi mdi-file-pdf-box me-1'></i>Generar reporte</button>
          <button type='button' className='btn btn-outline-success' onClick={() => generateIssuedReport('xlsx', appliedStorageFilters)}><i className='mdi mdi-file-excel-box me-1'></i>Reporte Excel</button>
        </div>}
      </form>
    </div>
  )

  return <>
    <style>{`
      .billing-email-form {
        color: #4b5563;
      }
      .billing-email-form .form-label {
        font-weight: 600;
      }
      .billing-email-tags {
        min-height: 38px;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        width: 100%;
        padding: 5px 8px;
        border: 1px solid #ced4da;
        border-radius: .25rem;
        background: #fff;
        cursor: text;
      }
      .billing-email-tags:focus-within {
        border-color: #86b7fe;
        box-shadow: 0 0 0 .2rem rgba(13, 110, 253, .15);
      }
      .billing-email-tags input {
        flex: 1 1 180px;
        min-width: 160px;
        border: 0;
        outline: 0;
        padding: 4px 6px;
        color: #4b5563;
      }
      .billing-email-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        max-width: 100%;
        padding: 4px 8px;
        border: 1px solid #ced4da;
        border-radius: 3px;
        background: #f8f9fa;
        color: #4b5563;
        font-size: .82rem;
        font-weight: 600;
        line-height: 1.1;
      }
      .billing-email-chip span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .billing-email-chip button {
        border: 0;
        background: transparent;
        color: #6c757d;
        line-height: 1;
        padding: 0;
        font-weight: 700;
      }
      .billing-email-editor {
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: #fff;
      }
      .billing-email-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 36px;
        padding: 7px 12px;
        border-bottom: 1px solid #e5e7eb;
        color: #4b5563;
      }
      .billing-email-body {
        min-height: 300px;
        border: 0;
        border-radius: 0;
        resize: vertical;
        line-height: 1.7;
        padding: 24px;
        white-space: pre-wrap;
      }
      .billing-email-body:focus {
        box-shadow: none;
      }
    `}</style>
    {isStorageBilling && <div className='row g-3 mb-3'>
      <div className='col-12 col-md-6 col-xl-3'>
        <button type='button' className='btn btn-primary w-100 d-flex align-items-center justify-content-between py-3' onClick={openBulkModal}>
          <span><i className='mdi mdi-plus-circle-outline me-1'></i>Facturar en bloque</span>
          <i className='mdi mdi-file-outline fs-4'></i>
        </button>
      </div>
      <div className='col-12 col-md-6 col-xl-3'>
        <button type='button' className='btn btn-outline-primary w-100 d-flex align-items-center justify-content-between py-3' onClick={openReportModal}>
          <span><i className='mdi mdi-file-chart-outline me-1'></i>Reporte Facturas Emitidas</span>
          <i className='mdi mdi-file-outline fs-4'></i>
        </button>
      </div>
    </div>}

    {isStorageBilling && storageToolbar}

    <VdTable
      key={gridKey}
      ref={tableRef}
      rest={billingDocumentsRest}
      icon="mdi mdi-file-document-outline"
      title={isStorageBilling ? `Listado - ${activeStorageTabLabel}` : moduleTitle}
      unit="comprobantes"
      defaultSort={isStorageBilling && activeStorageTab === 'issued' ? { field: 'updated_at', desc: true } : null}
      defaultPageSize={isStorageBilling ? 20 : 25}
      searchFields={['code', 'document_type', 'series', 'sequence']}
      searchPlaceholder="Buscar…"
      emptyText="No se encontraron comprobantes."
      baseFilter={isStorageBilling ? storageFilterValue : null}
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={() => tableRef.current?.refresh()}>
          <i className="mdi mdi-refresh"></i>
        </button>
        {isStorageBilling && (
          <button type="button" className="vdt-btn-soft" onClick={exportStorageGrid}>
            <i className="mdi mdi-file-excel"></i> Exportar
          </button>
        )}
        {!isStorageBilling && (
          <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen()}>
            <i className="mdi mdi-plus"></i> Nuevo comprobante
          </button>
        )}
      </>}
      actions={rowActions}
      columns={isStorageBilling ? (storageColumnsByTab[activeStorageTab] ?? storageColumnsByTab.prefactures) : regularColumns}
      renderCard={(row, actionButtons) => {
        const isRegular = !isStorageBilling
        const heading = isRegular ? (row.code ?? '-') : (rowDocumentNumber(row) || row.code)
        const subtitle = isRegular
          ? getSourceTypeLabel(row.source_type)
          : (activeStorageTab === 'prefactures' ? rowDescription(row) : rowClientLabel(row))
        const badge = isRegular
          ? { label: getBillingDocumentStatusLabel(row.local_status), className: 'badge bg-soft-secondary text-secondary' }
          : (activeStorageTab === 'prefactures' ? storageStatusBadge(row) : (activeStorageTab === 'issued' ? rowSunatMeta(row) : null))
        return (
          <div className="vdt-card">
            <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{heading}</p>
                <small className="text-muted">{subtitle}</small>
              </div>
              {badge && <span className={badge.className}>{badge.label}</span>}
            </div>
            <p className="text-muted mb-0 mt-2" style={{ fontSize: 12 }}>{rowClientName(row)}</p>
            <small className="text-muted d-block mt-2"><i className="mdi mdi-cash me-1"></i>{formatMoney(row.total)} {currencyLabel(row.currency)}</small>
            {actionButtons && <div className="d-flex flex-wrap mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
          </div>
        )
      }}
    />

    <Modal modalRef={pdfPreviewModalRef} title={pdfPreview.title || 'Vista previa PDF'} size='xl' hideFooter asForm={false} bodyClass='p-0' bodyStyle={{ overflow: 'hidden' }}>
      <div className='d-flex flex-column' style={{ height: 'calc(100vh - 9rem)', minHeight: 520 }}>
        <div className='d-flex justify-content-end gap-2 p-2 border-bottom bg-light'>
          <button type='button' className='btn btn-sm btn-outline-secondary' onClick={() => window.open(pdfPreview.url, '_blank', 'noopener')} disabled={!pdfPreview.url}>
            <i className='mdi mdi-open-in-new me-1'></i>Abrir en pestaña
          </button>
          <button type='button' className='btn btn-sm btn-primary' onClick={downloadPreviewPdf} disabled={!pdfPreview.downloadUrl}>
            <i className='mdi mdi-download me-1'></i>Descargar
          </button>
          <button type='button' className='btn btn-sm btn-light' data-bs-dismiss='modal'>Cerrar</button>
        </div>
        {pdfPreview.url
          ? <iframe title='Vista previa PDF' src={`${pdfPreview.url}#toolbar=1&navpanes=0`} className='border-0 w-100 flex-grow-1' />
          : <div className='d-flex align-items-center justify-content-center flex-grow-1 text-muted'>PDF no disponible</div>}
      </div>
    </Modal>

    <Modal
      modalRef={emailModalRef}
      title={<span><i className='mdi mdi-plus-circle-outline me-2'></i>ENVIAR COMPROBANTE POR CORREO ELECTRÓNICO</span>}
      size='xl'
      btnSubmitText={emailSending ? 'Enviando...' : 'Enviar Correo'}
      onSubmit={onSendBillingEmail}
    >
      <div className='billing-email-form'>
        <div className='mb-3'>
          <label className='form-label'>Para:</label>
          <EmailTagsInput
            value={emailDraft.to}
            onChange={(value) => onEmailDraftChange('to', value)}
            placeholder='Para:'
          />
        </div>
        <div className='mb-3'>
          <label className='form-label'>Copia:</label>
          <EmailTagsInput
            value={emailDraft.cc}
            onChange={(value) => onEmailDraftChange('cc', value)}
            placeholder='Copia:'
          />
        </div>
        <div className='mb-3'>
          <label className='form-label'>Asunto</label>
          <input
            className='form-control'
            value={emailDraft.subject}
            onChange={(event) => onEmailDraftChange('subject', event.target.value)}
          />
        </div>
        <div className='billing-email-editor'>
          <div className='billing-email-toolbar'>
            <span className='fw-semibold'>Source</span>
            <i className='mdi mdi-format-bold'></i>
            <i className='mdi mdi-format-italic'></i>
            <i className='mdi mdi-format-underline'></i>
            <i className='mdi mdi-format-list-bulleted'></i>
            <i className='mdi mdi-link-variant'></i>
            <i className='mdi mdi-image-outline'></i>
          </div>
          <textarea
            className='form-control billing-email-body'
            value={emailDraft.body}
            onChange={(event) => onEmailDraftChange('body', event.target.value)}
          />
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={receivablePaymentModalRef}
      title={selectedRow ? `Realizar pago - ${selectedRow.receivable_code ?? selectedRow.code}` : 'Realizar pago'}
      size='lg'
      btnSubmitText={paymentSending ? 'Registrando...' : 'Registrar pago'}
      onSubmit={onSubmitReceivablePayment}
      onClose={() => resetReceivablePaymentForm()}
    >
      <div className='row'>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Total</label>
          <input className='form-control' value={formatMoney(selectedRow?.total)} readOnly />
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Pagado</label>
          <input className='form-control' value={formatMoney(rowPaidAmount(selectedRow))} readOnly />
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Saldo</label>
          <input className='form-control' value={formatMoney(rowBalanceAmount(selectedRow))} readOnly />
        </div>

        <div className='col-md-4 mb-3'>
          <label className='form-label'>Monto a pagar</label>
          <input ref={receivablePaymentAmountRef} type='number' min='0.01' step='0.01' className='form-control' required />
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Fecha de pago</label>
          <input ref={receivablePaymentDateRef} type='date' className='form-control' required />
        </div>
        <div className='col-md-4 mb-3'>
          <VdSelect
            label='Tipo de pago'
            noMargin
            required
            value={receivablePaymentMethod}
            onChange={setReceivablePaymentMethod}
            options={receivablePaymentMethodOptions.map(option => ({ value: option, label: option }))}
            placeholder='-- Seleccionar --'
          />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Banco</label>
          <input ref={receivablePaymentBankRef} type='text' className='form-control' />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Nro operacion</label>
          <input ref={receivablePaymentOperationRef} type='text' className='form-control' />
        </div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Archivo de sustento</label>
          <input ref={receivablePaymentFileRef} type='file' className='form-control' />
        </div>
        <div className='col-12 mb-1'>
          <label className='form-label'>Observaciones</label>
          <textarea ref={receivablePaymentObservationsRef} className='form-control' rows='3' />
        </div>
      </div>
    </Modal>

    <Modal modalRef={modalRef} title='Documento de facturación' size='xl' onSubmit={onSave}>
      <div className='row'>
        <input ref={idRef} hidden />
        {!isStorageBilling && <div className='col-md-4 mb-3'>
          <VdSelect
            label='Origen'
            noMargin
            value={sourceType}
            onChange={(value) => { setSourceType(value); setSourceId('') }}
            options={[{ value: 'commercial_order', label: 'Pedido comercial' }, { value: 'service_order', label: 'Orden de servicio' }]}
          />
        </div>}
        <div className={`${isStorageBilling ? 'col-md-12' : 'col-md-8'} mb-3`}>
          <VdSelect
            label={isStorageBilling ? 'Orden de servicio de almacenamiento' : 'Documento origen'}
            noMargin
            required
            value={sourceId}
            onChange={setSourceId}
            options={((!isStorageBilling && sourceType === 'commercial_order') ? commercialOrders : serviceOrders).map(row => ({ value: `${row.id}`, label: `${row.code} - ${row.client?.full_name ?? row.eventual_client?.business_name ?? row.eventualClient?.business_name ?? 'Cliente'}` }))}
            placeholder='Seleccione'
          />
        </div>
        <div className='col-md-3 mb-3'>
          <VdSelect
            label='Comprobante'
            noMargin
            value={documentType}
            onChange={setDocumentType}
            options={[{ value: 'Factura', label: 'Factura' }, { value: 'Boleta', label: 'Boleta' }]}
          />
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Serie</label><input ref={seriesRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Correlativo</label><input ref={sequenceRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Correo cliente</label><input ref={customerEmailRef} type='email' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha emisión</label><input ref={issueDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha vencimiento</label><input ref={dueDateRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'>
          <VdSelect
            label='Condición de pago'
            noMargin
            value={paymentCondition}
            onChange={setPaymentCondition}
            options={[{ value: 'Contado', label: 'Contado' }, { value: 'Credito', label: 'Crédito' }]}
          />
        </div>
        <div className='col-md-3 mb-3'>
          <VdSelect
            label='Medio pago'
            noMargin
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={[{ value: 'Transferencia', label: 'Transferencia' }, { value: 'Efectivo', label: 'Efectivo' }, { value: 'Deposito', label: 'Depósito' }]}
          />
        </div>
        <div className='col-12 mb-1'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>

    {isStorageBilling && <Modal modalRef={reportModalRef} title='Reporte de Facturas Emitidas' size='xl' btnSubmitText='Generar Reporte Excel' onSubmit={(e) => { e.preventDefault(); generateIssuedReport('xlsx', modalReportFilters) }}>
      <div className='row align-items-end'>
        <div className='col-12 col-lg-4 mb-3'>
          <VdSelect
            label='Empresa'
            noMargin
            value={modalReportFilters.businessId}
            onChange={(value) => setModalReportFilters(prev => ({ ...prev, businessId: value }))}
            options={[{ value: '', label: 'Todos' }, ...businesses.map(row => ({ value: `${row.id}`, label: row.name }))]}
            placeholder='Todos'
          />
        </div>
        <div className='col-12 col-lg-4 mb-3'>
          <label className='form-label'>Fecha Inicio</label>
          <input type='date' className='form-control' value={modalReportFilters.startDate} onChange={(e) => setModalReportFilters(prev => ({ ...prev, startDate: e.target.value }))} />
        </div>
        <div className='col-12 col-lg-4 mb-3'>
          <label className='form-label'>Fecha Fin</label>
          <input type='date' className='form-control' value={modalReportFilters.endDate} onChange={(e) => setModalReportFilters(prev => ({ ...prev, endDate: e.target.value }))} />
        </div>
      </div>
    </Modal>}

    {isStorageBilling && <Modal modalRef={bulkModalRef} title='Facturar Pre-Facturas' size='xl' btnSubmitText='Facturar' onSubmit={onIssueBulk}>
      <div className='row align-items-end'>
        <div className='col-12 col-lg-7 mb-3'>
          <VdSelect
            label='Cliente'
            noMargin
            value={bulkFilters.clientId}
            onChange={(value) => setBulkFilters(prev => ({ ...prev, clientId: value }))}
            options={clients.map(row => ({ value: `${row.id}`, label: `${row.document_number ? `${row.document_number} - ` : ''}${row.full_name}` }))}
            placeholder='Seleccione cliente'
          />
        </div>
        <div className='col-12 col-md-6 col-lg-2 mb-3'>
          <VdSelect
            label='Tipo documento'
            noMargin
            value={bulkFilters.documentType}
            onChange={(value) => setBulkFilters(prev => ({ ...prev, documentType: value }))}
            options={[{ value: 'Factura', label: 'Factura' }, { value: 'Boleta', label: 'Boleta' }]}
          />
        </div>
        <div className='col-12 col-md-6 col-lg-2 mb-3'>
          <VdSelect
            label='Moneda'
            noMargin
            value={bulkFilters.currency}
            onChange={(value) => setBulkFilters(prev => ({ ...prev, currency: value }))}
            options={currencyFilterOptions}
          />
        </div>
        <div className='col-12 col-lg-1 mb-3'>
          <button type='button' className='btn btn-outline-primary w-100' onClick={loadBulkPrefactures} disabled={bulkLoading}>
            <i className={`mdi ${bulkLoading ? 'mdi-loading mdi-spin' : 'mdi-check'} me-1`}></i>Filtrar
          </button>
        </div>
      </div>
      <div className='d-flex justify-content-between align-items-center mt-3 mb-2'>
        <div className='d-flex align-items-end gap-3 flex-wrap'>
          <div>
          <label className='form-label d-block mb-1'>Detraccion</label>
          <div className='form-check form-switch'>
            <input className='form-check-input' type='checkbox' checked={bulkFilters.detraction} onChange={(e) => setBulkFilters(prev => ({ ...prev, detraction: e.target.checked }))} id='billing-bulk-detraction' />
            <label className='form-check-label' htmlFor='billing-bulk-detraction'>{bulkFilters.detraction ? 'SI' : 'NO'}</label>
          </div>
          </div>
          {bulkFilters.detraction && <div style={{ minWidth: 320 }}>
            <label className='form-label'>Tipo de detraccion</label>
            <select
              className='form-select'
              value={bulkFilters.detractionTypeId}
              onChange={(e) => {
                const type = detractionTypes.find(row => `${row.id}` === `${e.target.value}`) ?? null
                // El tipo manda: fija el codigo que viaja a SUNAT y el porcentaje que se aplica.
                setBulkFilters(prev => ({
                  ...prev,
                  detractionTypeId: e.target.value,
                  detractionCode: type?.code ?? '',
                  detractionPercent: type ? Number(type.percent ?? 0) : prev.detractionPercent,
                }))
              }}
            >
              <option value=''>-- Sin tipo (usa {bulkFilters.detractionPercent}% y codigo 022) --</option>
              {detractionTypes.map(type => (
                <option key={`detraction-type-${type.id}`} value={type.id}>
                  [{type.code}] {type.description} — {Number(type.percent ?? 0)}%
                </option>
              ))}
            </select>
          </div>}
          {bulkFilters.detraction && <div style={{ width: 130 }}>
            <label className='form-label'>% detraccion</label>
            <input
              type='number'
              min='0'
              step='0.01'
              className={`form-control ${bulkFilters.detractionTypeId ? 'bg-light text-muted' : ''}`}
              value={bulkFilters.detractionPercent}
              readOnly={!!bulkFilters.detractionTypeId}
              title={bulkFilters.detractionTypeId ? 'Lo define el tipo elegido' : 'Sin tipo elegido se puede escribir a mano'}
              onChange={(e) => setBulkFilters(prev => ({ ...prev, detractionPercent: e.target.value }))}
            />
          </div>}
        </div>
        <div className='text-end'>
          <h3 className='mb-0'>Importe: <span className='text-success'>{formatMoney(bulkTotal)}</span></h3>
          {bulkFilters.detraction && <div className='text-muted mt-1'>
            Detraccion: {formatMoney(bulkDetractionAmount)} | Neto: {formatMoney(bulkNetTotal)}
          </div>}
        </div>
      </div>
      <h5 className='mt-4'>Lista de Pedidos</h5>
      <div className='d-flex justify-content-end mb-2'>
        <div className='form-check'>
          <input className='form-check-input' type='checkbox' checked={bulkRows.length > 0 && bulkSelected.length === bulkRows.length} onChange={(e) => toggleAllBulkRows(e.target.checked)} id='billing-bulk-check-all' />
          <label className='form-check-label' htmlFor='billing-bulk-check-all'>Seleccionar todos</label>
        </div>
      </div>
      <div className='table-responsive border'>
        <table className='table table-sm table-hover mb-0'>
          <thead>
            <tr>
              <th style={{ width: 90 }}>Acciones</th>
              <th>O. Servicio</th>
              <th>Tipo</th>
              <th>T. Documento</th>
              <th>N de Pre-Factura</th>
              <th>Cliente</th>
              <th>Moneda</th>
              <th className='text-end'>Importe</th>
              <th>Fecha Registro</th>
              <th>Usuario Registro</th>
            </tr>
          </thead>
          <tbody>
            {bulkRows.length === 0 && <tr><td colSpan='10' className='text-muted'>No existen elementos</td></tr>}
            {bulkRows.map(row => (
              <tr key={`bulk-billing-row-${row.id}`}>
                <td><input type='checkbox' checked={bulkSelected.includes(row.id)} onChange={(e) => toggleBulkRow(row.id, e.target.checked)} /></td>
                <td>{rowSourceCode(row)}</td>
                <td>{rowDescription(row)}</td>
                <td>{row.document_type}</td>
                <td>{row.code}</td>
                <td>{rowClientName(row)}</td>
                <td>{currencyLabel(row.currency)}</td>
                <td className='text-end'>{formatMoney(row.total)}</td>
                <td>{formatDate(row.created_at)}</td>
                <td>{row.creator?.fullname ?? row.creator?.username ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>}

    <Modal modalRef={payloadModalRef} title={`Payload del conector${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='xl' hideFooter>
      <textarea className='form-control' rows='24' value={payloadText} readOnly />
    </Modal>

    <Modal modalRef={providerModalRef} title={`Respuesta del proveedor${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='lg' onSubmit={onSaveProvider}>
      <div className='row'>
        <div className='col-md-6 mb-3'>
          <VdSelect
            label='Estado local'
            noMargin
            value={providerLocalStatus}
            onChange={setProviderLocalStatus}
            options={billingDocumentStatusOptions
              .filter((option) => ['pending', 'sent', 'accepted', 'observed', 'rejected', 'cancelled'].includes(option.value))
              .map((option) => ({ value: option.value, label: option.label }))}
          />
        </div>
        <div className='col-md-6 mb-3'><label className='form-label'>Estado externo</label><input ref={externalStatusRef} className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>ID externo</label><input ref={externalIdRef} className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>Referencia externa</label><input ref={externalReferenceRef} className='form-control' /></div>
        <div className='col-12 mb-3'><label className='form-label'>Error / observación</label><input ref={errorMessageRef} className='form-control' /></div>
        <div className='col-12 mb-1'><label className='form-label'>Payload de respuesta</label><textarea ref={responsePayloadRef} className='form-control' rows='8' /></div>
      </div>
    </Modal>

    <Modal modalRef={cancelModalRef} title={`Anular comprobante${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='md' onSubmit={onSaveCancel}>
      <div className='mb-1'>
        <label className='form-label'>Motivo</label>
        <textarea ref={cancelReasonRef} className='form-control' rows='4' required />
      </div>
    </Modal>

    <Modal modalRef={creditNoteModalRef} title={`Nota de crédito${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='lg' onSubmit={onSaveCreditNote}>
      <div className='row'>
        <div className='col-md-4 mb-3'><label className='form-label'>Serie</label><input ref={creditNoteSeriesRef} className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Fecha emisión</label><input ref={creditNoteIssueDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Motivo SUNAT</label><input ref={creditNoteReasonRef} className='form-control' required /></div>
        <div className='col-12 mb-1'><label className='form-label'>Observación interna</label><textarea ref={creditNoteNoteRef} className='form-control' rows='4' /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? scopedPermission('services-billing')
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Facturacion'}><BillingDocuments {...properties} /></BaseAdminto>)
})
