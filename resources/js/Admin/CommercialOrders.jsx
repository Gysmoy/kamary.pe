import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Global from '../Utils/Global';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import VdUbigeoCascade from '@Adminto/VdUbigeoCascade';
import Modal from '../Components/Adminto/Modal';
import { EMPTY_UBIGEO_SELECTION } from '../Utils/ubigeoInei';
import Swal from 'sweetalert2';
import { Fetch } from 'sode-extend-react';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import BillingDocumentsRest from '../Actions/Admin/BillingDocumentsRest';
import CommercialOrdersRest from '../Actions/Admin/CommercialOrdersRest';
import DeliveryDelayReasonsRest from '../Actions/Admin/DeliveryDelayReasonsRest';
import ReferralGuidesRest from '../Actions/Admin/ReferralGuidesRest';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import { openBillingVoucherPreviewPdf, openPdfUrlInModal } from '../Utils/billingVoucherPreviewPdf';
import {
  commercialOrderStatusOptions,
  getCommercialOrderStatusLabel,
  getReferralGuideStatusLabel,
} from '../Utils/statusLabels';

const commercialOrdersRest = new CommercialOrdersRest()
const billingDocumentsRest = new BillingDocumentsRest()
const deliveryDelayReasonsRest = new DeliveryDelayReasonsRest()
const referralGuidesRest = new ReferralGuidesRest()
const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100
// La retencion de IGV es 3% por norma: no se pide por pantalla para que nadie la altere.
const RETENTION_PERCENT = 3

const regularClientFilter = ['client_kind', '=', 'regular']
// El pedido comercial pertenece al modulo de Kamary Peru. El scoping automatico del backend no
// aplica aqui porque /admin/commercial-orders esta declarado como ruta neutra
// (BusinessController::resolveScopeKeyForPagination), asi que se filtra de forma explicita.
const kamaryPeruBusinessFilter = ['business_key', '=', 'kamary_peru']
const creditNoteBaseFilter = [['document_type', '<>', 'Nota de credito'], 'and', ['source_type', '=', 'commercial_order']]

// Reemplazo del AJAX de select2 (SelectAPIFormGroup) para VdSelect async.
// Replica EXACTO el mismo endpoint y cuerpo (sort/skip/take + filter contains) que usaba
// select2 y devuelve [{value,label}] mediante `map`. `filter` es el filtro adicional en
// cascada (mismo formato dx) o null.
const fetchPaginateOptions = async (url, searchBy, filter, term, map, take = 50) => {
  const value = term ?? ''
  try {
    const { status, result } = await Fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        sort: [{ selector: searchBy, desc: false }],
        skip: 0,
        take,
        filter: filter
          ? [[searchBy, 'contains', value], 'and', filter]
          : [searchBy, 'contains', value],
      }),
    })
    if (!status) return []
    return (result?.data ?? []).map(map)
  } catch {
    return []
  }
}

// Etiqueta plana para el almacen (antes templateResult jQuery: nombre - sede (empresa)).
const warehouseOptionLabel = (warehouse) => {
  const name = warehouse?.name ?? ''
  const branch = warehouse?.branch?.name
  const business = warehouse?.branch?.business?.name
  return [name, branch ? `- ${branch}` : '', business ? `(${business})` : ''].filter(Boolean).join(' ')
}
const lineDiscountOptions = [1, 2, 3, 4, 5]
const paymentMethodOptions = [
  'EFECTIVO [CONTADO]',
  'TRANSFERENCIA [CONTADO]',
  'YAPE [CONTADO]',
  'PLIN [CONTADO]',
  'TARJETA [CONTADO]',
  'TRANSFERENCIA [CREDITO]',
]
const defaultExternalSource = 'ecomsur_oms'
const listingTabs = [
  { id: 'orders', label: 'Pedidos', kind: 'orders' },
  { id: 'issued', label: 'Facturas Emitidas', kind: 'billing' },
  { id: 'credit-notes', label: 'Notas de Credito', kind: 'billing' },
  { id: 'visitors', label: 'Pedidos - Visitadores', kind: 'static' },
  { id: 'multivende', label: 'Pedidos - Multivende', kind: 'multivende' },
]

const staticListingTabs = {
  visitors: {
    pageSize: 20,
    exports: ['Copiar', 'Excel'],
    filters: [
      { key: 'visitor', label: 'Visitador', type: 'select', options: ['ALICIA ASTO ASTO'] },
      { key: 'dateRange', label: 'Fecha Registro (Inicio - Fin):', type: 'dateRange' },
    ],
    headers: ['ACCIONES', 'ESTADO', 'COMPROBANTE', 'TIPO DOCUMENTO', 'CLIENTE', 'TOTAL', 'TIPO DE PAGO', 'F.E COMPROBANTE', 'F.E GUIA', 'USUARIO', 'FECHA REGISTRO', 'USUARIO REGISTRO', 'CODIGO', 'EMPRESA'],
  },
}

const statusBadgeClass = (value) => {
  const key = `${value ?? 'empty'}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-')
  return `commercial-order-status-badge commercial-order-status-${key || 'empty'}`
}

const StatusBadge = ({ value, label }) => (
  <span className={statusBadgeClass(value)}>{label}</span>
)

const formatDateCell = (value) => {
  if (!value) return ''
  const date = new Date(`${value}`.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? `${value}` : date.toLocaleDateString('es-PE')
}

const formatMoneyCell = (value) => Number(value || 0).toFixed(2)

// Colores de los botones de accion por fila (paleta de marca)
const ACTION_COLORS = {
  primary: { bg: '#e7f2fd', color: '#188ae2' },
  success: { bg: '#e6f7ef', color: '#10c469' },
  info: { bg: '#e6f6fb', color: '#35b8e0' },
  warning: { bg: '#fef4e4', color: '#f7b84b' },
  dark: { bg: '#eef0f4', color: '#5b69bc' },
  secondary: { bg: '#eef0f4', color: '#5b69bc' },
  danger: { bg: '#fcebeb', color: '#e24b4a' },
}

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  article_label: '',
  article_code: '',
  article_lot: '',
  article_name: '',
  article_unit: '',
  article_laboratory: '',
  article_principle: '',
  presentations: [],
  presentation_id: '',
  presentation_units: 1,
  stock_available: 0,
  reserved_quantity: 0,
  price_unit: 0,
  quantity: 1,
  gross_total: 0,
  discount_type: 'none',
  discount_value: 0,
  discount_amount: 0,
  total: 0,
  price_source: 'fallback',
  price_list_code: '',
})

const formatAuditUser = (user) => {
  if (!user) return ''
  const firstName = (user.name ?? '').toString().trim().split(' ')[0] ?? ''
  const firstLastname = (user.lastname ?? '').toString().trim().split(' ')[0] ?? ''
  const full = `${firstName} ${firstLastname}`.trim()
  const username = (user.username ?? '').toString().trim()
  if (full && username) return `${full} (@${username})`
  if (full) return full
  if (username) return `@${username}`
  return ''
}

const formatPlainUser = (user) => {
  if (!user) return '-'
  const fullname = (user.fullname ?? '').toString().trim()
  if (fullname) return fullname
  const full = `${user.name ?? ''} ${user.lastname ?? ''}`.trim()
  return full || (user.username ?? '').toString().trim() || '-'
}

const formatUserRegistry = (user) => {
  if (!user) return '-'
  return (user.username ?? '').toString().trim()
    || (user.fullname ?? '').toString().trim()
    || `${user.name ?? ''} ${user.lastname ?? ''}`.trim()
    || '-'
}

const roundMoney = (value) => Number((Number(value || 0)).toFixed(2))
const escapeHtml = (value) => $('<div>').text(value ?? '').html()
const formatQuantity = (value) => {
  const rounded = Number(Number(value || 0).toFixed(3))
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`.replace(/\.?0+$/, '')
}
const isManualPrice = (item) => item?.price_source === 'manual'
const resolvePriceUnitValue = (item, resolution, force = false) => {
  const currentPrice = Number(item?.price_unit || 0)
  const resolvedPrice = Number(resolution?.price_unit)
  if (!force && isManualPrice(item)) return currentPrice
  if (!Number.isFinite(resolvedPrice)) return currentPrice
  if (!force && resolvedPrice <= 0 && currentPrice > 0) return currentPrice
  return resolvedPrice
}
const resolvePriceSourceValue = (item, resolution, force = false) => {
  if (!force && isManualPrice(item)) return 'manual'
  return resolution?.source || item?.price_source || 'fallback'
}
const normalizePositiveNumberText = (value) => {
  const normalized = `${value ?? ''}`
    .replace(',', '.')
    .replace(/[^\d.]/g, '')
  if (!normalized) return ''

  const [wholeRaw, ...fractionParts] = normalized.split('.')
  const whole = wholeRaw.replace(/^0+(?=\d)/, '') || (wholeRaw || fractionParts.length ? '0' : '')
  const fraction = fractionParts.length ? `.${fractionParts.join('')}` : ''
  return `${whole}${fraction}`
}
const readPositiveNumberInput = (event) => {
  const normalized = normalizePositiveNumberText(event.target.value)
  if (event.target.value !== normalized) event.target.value = normalized
  return Number(normalized || 0)
}
const selectZeroInput = (event) => {
  if (Number(event.target.value || 0) === 0) event.target.select()
}

const calculateItemDiscount = (grossTotal, discountType, discountValue) => {
  const gross = roundMoney(grossTotal)
  const value = Number(discountValue || 0)
  if (!Number.isFinite(value) || value <= 0 || gross <= 0) return 0
  if (discountType === 'percent') return Math.min(gross, roundMoney(gross * Math.min(value, 100) / 100))
  if (discountType === 'amount') return Math.min(gross, roundMoney(value))
  return 0
}

const mapItemTotals = (item) => {
  const quantity = Number(item.quantity || 0)
  const price = Number(item.price_unit || 0)
  const grossTotal = Number.isFinite(quantity * price) ? roundMoney(quantity * price) : 0
  const discountAmount = calculateItemDiscount(grossTotal, item.discount_type, item.discount_value)
  return {
    ...item,
    discount_type: item.discount_type || 'none',
    discount_value: item.discount_type === 'none' ? 0 : Number(item.discount_value || 0),
    gross_total: grossTotal,
    discount_amount: discountAmount,
    total: roundMoney(Math.max(0, grossTotal - discountAmount)),
  }
}

const normalizeDocumentType = (value) => {
  const normalized = `${value ?? ''}`.trim().toLowerCase()
  if (normalized === 'boleta') return 'Boleta'
  if (['nota de pedido', 'nota_pedido', 'note_order'].includes(normalized)) return 'Nota de pedido'
  return 'Factura'
}

const orderBillingDocuments = (order) => order?.billing_documents ?? order?.billingDocuments ?? []
const latestBillingDocument = (order) => orderBillingDocuments(order)[0] ?? null
const billingDocumentNumber = (document) => {
  if (!document) return ''
  return [document?.series, document?.sequence].filter(Boolean).join('-') || document?.code || ''
}
const hasPreparedBillingDocument = (document) => !!(`${document?.series ?? ''}`.trim() && `${document?.sequence ?? ''}`.trim())
const orderVoucherLabel = (order) => {
  const document = latestBillingDocument(order)
  const documentNumber = billingDocumentNumber(document)
  return documentNumber || order?.referral_guide || order?.guide_number || order?.purchase_order || '-'
}
const billingDocumentCustomerLabel = (document) => document?.client?.full_name
  ?? document?.eventual_client?.business_name
  ?? document?.eventualClient?.business_name
  ?? '-'
const billingDocumentSourceCode = (document) => document?.commercial_order?.code
  ?? document?.commercialOrder?.code
  ?? document?.metadata?.source_code
  ?? '-'
const orderDocumentTypeLabel = (order) => normalizeDocumentType(latestBillingDocument(order)?.document_type ?? order?.document_type)
const orderCustomerLabel = (order) => {
  const customer = order?.client ?? order?.eventual_client ?? order?.eventualClient ?? null
  const documentNumber = `${customer?.document_number ?? ''}`.trim()
  const name = `${customer?.full_name ?? customer?.business_name ?? ''}`.trim()
  return [documentNumber, name].filter(Boolean).join(' | ') || '-'
}
const orderPaymentLabel = (order) => {
  const method = `${order?.payment_method ?? ''}`.trim()
  const condition = `${order?.payment_condition ?? ''}`.trim()
  if (!method && !condition) return '-'
  if (!condition || method.includes('[')) return method || '-'
  return `${method || '-'} [${condition.toUpperCase()}]`
}
const formatDelayReasonDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return `${value}`
  return date.toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
const todayPathDate = () => new Date().toISOString().slice(0, 10).replaceAll('-', '/')
const defaultDateRange = () => {
  const today = todayPathDate()
  return `${today} - ${today}`
}
const loadScriptOnce = (id, src) => new Promise((resolve, reject) => {
  const current = document.getElementById(id)
  if (current) {
    if (current.dataset.loaded === 'true') resolve()
    else current.addEventListener('load', resolve, { once: true })
    return
  }

  const script = document.createElement('script')
  script.id = id
  script.src = src
  script.async = true
  script.onload = () => {
    script.dataset.loaded = 'true'
    resolve()
  }
  script.onerror = reject
  document.body.appendChild(script)
})
const loadStyleOnce = (id, href) => {
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}
const loadDateRangePickerAssets = async () => {
  loadStyleOnce('commercial-order-daterangepicker-css', '/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/css/daterangepicker.css')
  if (!window.moment) await loadScriptOnce('commercial-order-moment-js', '/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/moment.min.js')
  if (!window.$?.fn?.daterangepicker) await loadScriptOnce('commercial-order-daterangepicker-js', '/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/daterangepicker.js')
}
const emptyListingFilters = () => ({
  orders: {
    businessId: '',
    dateRange: defaultDateRange(),
    laboratoryId: '',
    dispatchStatus: '',
  },
  issued: {
    businessId: '',
    dateRange: defaultDateRange(),
  },
  'credit-notes': {
    businessId: '',
    dateRange: defaultDateRange(),
  },
  visitors: {
    visitor: 'ALICIA ASTO ASTO',
    dateRange: defaultDateRange(),
  },
  multivende: {
    dateRange: defaultDateRange(),
    orderVtex: '',
  },
})
const emptyAppliedListingFilters = () => {
  const filters = emptyListingFilters()
  return {
    ...filters,
    orders: {
      ...filters.orders,
      dateRange: '',
    },
  }
}
const normalizeDateText = (value) => {
  const text = `${value ?? ''}`.trim()
  if (!text) return ''
  return text.replaceAll('/', '-').slice(0, 10)
}
const dateRangeParts = (value) => {
  const [start = '', end = ''] = `${value ?? ''}`.split(/\s+-\s+/)
  return {
    start: normalizeDateText(start),
    end: normalizeDateText(end || start),
  }
}
const combineDxFilters = (filters) => filters.filter(Boolean).reduce((carry, filter) => {
  if (!carry) return filter
  return [carry, 'and', filter]
}, null)
const dateRangeFilter = (range, field = 'created_at') => {
  const { start, end } = dateRangeParts(range)
  return combineDxFilters([
    start ? [field, '>=', `${start} 00:00:00`] : null,
    end ? [field, '<=', `${end} 23:59:59`] : null,
  ])
}
const billingDocumentTabFilter = (tab) => {
  const notCreditNote = ['document_type', '<>', 'Nota de credito']
  if (tab === 'issued') {
    return [[['local_status', '=', 'sent'], 'or', ['local_status', '=', 'accepted'], 'or', ['local_status', '=', 'observed'], 'or', ['local_status', '=', 'rejected']], 'and', notCreditNote]
  }
  if (tab === 'credit-notes') return ['document_type', '=', 'Nota de credito']
  return null
}
const buildBillingFilter = (tab, filters) => combineDxFilters([
  ['source_type', '=', 'commercial_order'],
  billingDocumentTabFilter(tab),
  filters?.businessId ? ['business_id', '=', Number(filters.businessId)] : null,
  dateRangeFilter(filters?.dateRange, 'created_at'),
])
const buildOrderFilter = (filters) => combineDxFilters([
  filters?.businessId ? ['business_id', '=', Number(filters.businessId)] : null,
  filters?.dispatchStatus ? ['dispatch_status', '=', filters.dispatchStatus] : null,
  dateRangeFilter(filters?.dateRange, 'created_at'),
])
const buildMultivendeFilter = (filters, source) => {
  const orderText = `${filters?.orderVtex ?? ''}`.trim()
  return combineDxFilters([
    ['external_source', '=', source || defaultExternalSource],
    dateRangeFilter(filters?.dateRange, 'created_at'),
    orderText
      ? [['external_order_id', 'contains', orderText], 'or', ['external_checkout_id', 'contains', orderText]]
      : null,
  ])
}
const billingDocumentClientLabel = (row) => {
  const customer = row?.client ?? row?.eventualClient ?? row?.eventual_client ?? null
  const documentNumber = `${customer?.document_number ?? ''}`.trim()
  const name = `${customer?.full_name ?? customer?.business_name ?? ''}`.trim()
  return [documentNumber, name].filter(Boolean).join(' | ') || '-'
}
// Etiqueta plana para el comprobante a anular (antes templateResult jQuery: N° · cliente).
const billingDocOptionLabel = (document) => {
  const num = [document?.series, document?.sequence].filter(Boolean).join('-') || document?.code || `#${document?.id}`
  const client = billingDocumentClientLabel(document)
  return client && client !== '-' ? `${num} · ${client}` : num
}
const currencyLabel = (value) => `${value ?? ''}`.toUpperCase() === 'USD' ? 'Dolares' : 'Soles'
const billingDocumentSunatLabel = (row) => row?.external_reference || row?.external_id || row?.external_status || '-'
const billingDocumentAffectedLabel = (row) => row?.referenceDocument?.code ?? row?.reference_document?.code ?? '-'
const billingDocumentReasonLabel = (row) => row?.cancel_reason ?? row?.metadata?.cancel_reason ?? row?.metadata?.reason ?? '-'
const orderSunatLabel = (order) => latestBillingDocument(order)?.external_status ?? latestBillingDocument(order)?.external_reference ?? '-'
const orderExternalIdLabel = (order) => order?.external_order_id || order?.external_checkout_id || '-'
const orderDeliveredDate = (order) => {
  const evidence = latestEvidence(order)
  if (evidence?.delivered_at) return evidence.delivered_at
  const dispatches = order?.dispatchAssignments ?? order?.dispatch_assignments ?? []
  const delivered = dispatches.find(row => row?.dispatch?.delivered_at)
  return delivered?.dispatch?.delivered_at ?? ''
}
const orderProcessTime = (order) => {
  const start = order?.created_at ? new Date(order.created_at) : null
  const endRaw = orderDeliveredDate(order) || order?.updated_at
  const end = endRaw ? new Date(endRaw) : null
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'
  const minutes = Math.max(0, Math.round((end - start) / 60000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

const textValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') {
    return value.address ?? value.reference ?? value.name ?? value.description ?? fallback
  }
  const text = `${value}`
  return text === '[object Object]' ? fallback : text
}
const paymentConditionFromPaymentMethod = (value) => `${value ?? ''}`.toUpperCase().includes('CREDITO') ? 'Credito' : 'Contado'
const normalizePaymentMethodForForm = (value) => {
  const text = `${value ?? ''}`.trim()
  if (!text) return 'EFECTIVO [CONTADO]'
  if (text.toUpperCase() === 'TRANSFERENCIA') return 'TRANSFERENCIA [CONTADO]'
  return text
}
const clientAddressValue = (client) => textValue(client?.full_address, textValue(client?.address, textValue(client?.fiscal_address)))
const clientUbigeoValue = (client) => textValue(client?.ubigeo, textValue(client?.district_ubigeo, textValue(client?.inei_ubigeo)))
const normalizeSelectEntityId = (value) => {
  const text = `${value ?? ''}`.trim()
  const match = text.match(/^(client|eventual)-(\d+)$/)
  return match ? match[2] : text
}
const presentationEmptyLabel = (item) => item.article_id ? 'Unidad base' : 'Sin presentacion'
const presentationOptionLabel = (presentation, item) => {
  const name = presentation?.name || 'Presentacion'
  const units = formatQuantity(presentation?.units || 1)
  const unit = item?.article_unit ? ` ${item.article_unit}` : ' unidad(es) base'
  return `${name} (${units}${unit})`
}

const isTaxableDocumentType = (documentType) => ['Factura', 'Boleta'].includes(normalizeDocumentType(documentType))

const deriveDocumentTotals = (grossAmount, documentType) => {
  const gross = Number(grossAmount || 0)
  if (!isTaxableDocumentType(documentType)) {
    return {
      subtotal: Number(gross.toFixed(2)),
      taxAmount: 0,
      total: Number(gross.toFixed(2)),
    }
  }

  const subtotal = Number((gross / 1.18).toFixed(2))
  return {
    subtotal,
    taxAmount: Number((gross - subtotal).toFixed(2)),
    total: Number(gross.toFixed(2)),
  }
}

const buildStockShortages = (items, warehouseId = '') => {
  const usedByKey = new Map()

  return (items ?? []).flatMap((item) => {
    if (!item?.article_id) return []

    const key = `${item.article_id}:${item.warehouse_id || warehouseId || ''}`
    const lineQuantity = Number(item.quantity || 0)
    const presentationUnits = Number(item.presentation_units || 1) || 1
    const quantity = Number((lineQuantity * presentationUnits).toFixed(3))
    const stock = Number(item.stock_available || 0)
    const used = Number(usedByKey.get(key) || 0)
    const availableForLine = Math.max(0, stock - used)
    const reserved = Math.min(quantity, availableForLine)
    const shortage = Math.max(0, quantity - reserved)
    usedByKey.set(key, used + reserved)

    if (shortage <= 0.0001) return []
    return [{
      article: item.article_name || item.article_label || item.article_code || 'Articulo',
      quantity,
      lineQuantity,
      presentationUnits,
      available: availableForLine,
      shortage,
    }]
  })
}

const orderGuides = (order) => order?.referral_guides ?? order?.referralGuides ?? []
const guideNumber = (guide) => guide?.external_reference || [guide?.series, guide?.sequence].filter(Boolean).join('-') || guide?.code || '-'
const canIssueGuide = (guide) => guide && !['accepted', 'cancelled'].includes(guide.guide_status)
const orderEvidences = (order) => order?.delivery_evidences ?? order?.deliveryEvidences ?? []
const latestEvidence = (order) => orderEvidences(order)[0] ?? null
const orderTrackingEvents = (order) => order?.tracking_events ?? order?.trackingEvents ?? []
const isEvidenceImage = (value) => {
  const url = `${value ?? ''}`.trim()
  return url.startsWith('blob:')
    || url.startsWith('data:image/')
    || /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(url)
    || url.includes('/delivery-evidence-media/')
}
const nowDateTimeLocal = () => {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

const defaultMapPosition = { lat: -12.046374, lng: -77.042793 }

const parseCoordinate = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const formatCoordinate = (value) => {
  const number = parseCoordinate(value)
  return number === null ? '' : number.toFixed(7)
}

const hasMapPosition = (position) => parseCoordinate(position?.lat) !== null && parseCoordinate(position?.lng) !== null

const GoogleDeliveryMapPicker = ({ modalRef, position, searchText, onPositionChange, onSearchTextChange, onAddressSelected, googleMapsApiKey, disabled = false }) => {
  const mapRef = useRef()
  const [loading, setLoading] = useState(false)
  const [mapError, setMapError] = useState('')
  const [results, setResults] = useState([])

  const resolvedPosition = hasMapPosition(position)
    ? { lat: parseCoordinate(position.lat), lng: parseCoordinate(position.lng) }
    : defaultMapPosition

  const applyPosition = (nextPosition, zoom = 17) => {
    const lat = parseCoordinate(nextPosition?.lat)
    const lng = parseCoordinate(nextPosition?.lng)
    if (lat === null || lng === null || !mapRef.current) return

    mapRef.current.setCenter({ lat, lng })
    mapRef.current.setZoom(zoom)
  }

  const handlePointSelected = (nextPosition) => {
    if (disabled) return
    onPositionChange(nextPosition)
    applyPosition(nextPosition)
  }

  useEffect(() => {
    if (hasMapPosition(position)) {
      applyPosition(resolvedPosition)
      return
    }

    applyPosition(defaultMapPosition, 13)
  }, [position?.lat, position?.lng])

  useEffect(() => {
    const modal = modalRef?.current
    if (!modal) return undefined

    const onShown = () => {
      setTimeout(() => {
        if (hasMapPosition(position)) applyPosition(resolvedPosition)
        else applyPosition(defaultMapPosition, 13)
      }, 180)
    }

    $(modal).on('shown.bs.modal', onShown)
    return () => $(modal).off('shown.bs.modal', onShown)
  }, [modalRef, position?.lat, position?.lng])

  const searchAddress = async () => {
    if (disabled) return
    const query = `${searchText ?? ''}`.trim()
    if (!query) {
      setResults([])
      setMapError('Escribe una direccion para buscar.')
      return
    }

    if (!window.google?.maps?.Geocoder) {
      setMapError('Google Maps aun no termino de cargar.')
      return
    }

    setLoading(true)
    setMapError('')
    try {
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({
        address: `${query}, Peru`,
        componentRestrictions: { country: 'PE' },
        region: 'PE',
      }, (response, status) => {
        setLoading(false)
        if (status !== 'OK' || !Array.isArray(response) || response.length === 0) {
          setResults([])
          setMapError('Sin resultados. Puedes marcar el punto manualmente en el mapa.')
          return
        }

        setResults(response.slice(0, 5).map((result) => ({
          place_id: result.place_id,
          display_name: result.formatted_address,
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
        })))
      })
    } catch (error) {
      setLoading(false)
      setMapError(`${error.message}. Puedes marcar el punto manualmente en el mapa.`)
      setResults([])
    }
  }

  const selectResult = (result) => {
    if (disabled) return
    const nextPosition = { lat: parseCoordinate(result.lat), lng: parseCoordinate(result.lng) }
    onPositionChange(nextPosition)
    onSearchTextChange(result.display_name ?? '')
    onAddressSelected(result.display_name ?? '')
    applyPosition(nextPosition)
    setResults([])
  }

  return (
    <div className='commercial-order-map-picker'>
      <div className='commercial-order-map-search'>
        <div>
          <label className='form-label'>Buscar direccion en mapa</label>
          <div className='input-group'>
            <input
              type='text'
              className='form-control'
              value={searchText}
              disabled={disabled}
              onChange={(event) => onSearchTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  searchAddress()
                }
              }}
              placeholder='Ej. Av. Javier Prado 123, San Isidro'
            />
            <button type='button' className='btn btn-outline-primary' onClick={searchAddress} disabled={loading || disabled}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
        <div className='commercial-order-map-coordinates'>
          <label className='form-label'>Coordenadas</label>
          <div className='commercial-order-map-coordinate-values'>
            <span>{formatCoordinate(position?.lat) || '-'}</span>
            <span>{formatCoordinate(position?.lng) || '-'}</span>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className='commercial-order-map-results'>
          {results.map((result) => (
            <button
              type='button'
              key={`${result.place_id}-${result.lat}-${result.lng}`}
              className='commercial-order-map-result'
              disabled={disabled}
              onClick={() => selectResult(result)}
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      {mapError && <small className='text-muted d-block mt-1'>{mapError}</small>}
      <LoadScript
        googleMapsApiKey={googleMapsApiKey}
        language='es'
        region='PE'
        onError={() => setMapError('No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio.')}
      >
        <GoogleMap
          mapContainerClassName='commercial-order-map-canvas'
          center={resolvedPosition}
          zoom={hasMapPosition(position) ? 17 : 13}
          options={{
            clickableIcons: !disabled,
            fullscreenControl: true,
            gestureHandling: disabled ? 'none' : 'greedy',
            mapTypeControl: true,
            scrollwheel: !disabled,
            streetViewControl: false,
          }}
          onLoad={(map) => {
            mapRef.current = map
            setTimeout(() => {
              if (hasMapPosition(position)) applyPosition(resolvedPosition)
              else applyPosition(defaultMapPosition, 13)
            }, 120)
          }}
          onClick={(event) => {
            if (disabled) return
            const nextPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() }
            handlePointSelected(nextPosition)
          }}
        >
          {hasMapPosition(position) && (
            <Marker
              position={resolvedPosition}
              draggable={!disabled}
              onDragEnd={(event) => handlePointSelected({ lat: event.latLng.lat(), lng: event.latLng.lng() })}
            />
          )}
        </GoogleMap>
      </LoadScript>
      <small className='text-muted d-block mt-2'>Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega.</small>
    </div>
  )
}

const DeliveryMapPicker = (props) => {
  const googleMapsApiKey = `${Global.GMAPS_API_KEY ?? ''}`.trim()
  if (googleMapsApiKey) {
    return <GoogleDeliveryMapPicker {...props} googleMapsApiKey={googleMapsApiKey} />
  }

  return (
    <div className='commercial-order-map-picker'>
      <div className='commercial-order-map-empty'>
        Configura Google Maps API Key en Sistemas &gt; Datos generales &gt; Integraciones para habilitar el mapa.
      </div>
    </div>
  )
}

const canSendToPreparation = (order) => {
  if (!order || order.status === null) return false
  if (`${order.order_status ?? ''}` === 'cancelled') return false
  return `${order.dispatch_status ?? 'pending'}` === 'pending'
}

const canCreateBillingDocumentFromOrder = (order) => {
  if (!order || order.status === null || order.status === false || order.status === 0) return false
  return !['draft', 'cancelled'].includes(`${order.order_status ?? ''}`)
}

const canDownloadBillingDocument = (document) => {
  if (!document) return false
  const status = `${document.local_status ?? ''}`
  return ['accepted', 'observed', 'cancelled'].includes(status) || !!document.external_id
}

const isIssuedBillingDocument = (document) => {
  if (!document) return false
  const status = `${document.local_status ?? ''}`
  return ['accepted', 'sent', 'observed'].includes(status) || !!document.external_id
}

const commercialOrderEditLockReason = (order) => {
  if (!order?.id) return ''
  const document = latestBillingDocument(order)
  if (isIssuedBillingDocument(document) || `${order.billing_status ?? ''}` === 'billed') {
    const documentLabel = billingDocumentNumber(document) || document?.code || 'emitido'
    return `Este pedido ya tiene comprobante ${documentLabel}. No se pueden modificar datos ni productos despues de emitir.`
  }
  return ''
}

const billingDocumentActionMeta = (order) => {
  const document = latestBillingDocument(order)
  if (!document) {
    return {
      icon: 'mdi mdi-file-send-outline',
      title: 'Generar comprobante de venta para este pedido',
    }
  }
  if (canDownloadBillingDocument(document)) {
    return {
      icon: 'mdi mdi-file-eye-outline',
      title: `Previsualizar PDF del comprobante ${billingDocumentNumber(document) || document.code}`,
    }
  }
  if (hasPreparedBillingDocument(document)) {
    return {
      icon: 'mdi mdi-file-eye-outline',
      title: `Emitir o previsualizar comprobante ${billingDocumentNumber(document) || document.code}`,
    }
  }
  return {
    icon: 'mdi mdi-send',
    title: `Emitir comprobante ${billingDocumentNumber(document) || document.code}`,
  }
}

const buildTrackingRows = (order) => {
  if (!order) return []
  const persistedRows = orderTrackingEvents(order).map((event) => ({
    date: event.happened_at ?? event.created_at,
    status: [event.title, event.description].filter(Boolean).join(' - '),
  }))
  const rows = [
    { date: order.created_at, status: 'La orden ingreso en el sistema' },
  ]

  if (order.approved_at && ['preparing', 'in_route', 'delivered', 'dispatched', 'billed', 'closed'].includes(order.order_status)) {
    rows.push({ date: order.approved_at, status: 'La orden paso a preparacion' })
  } else if (order.approved_at && order.order_status === 'confirmed') {
    rows.push({ date: order.approved_at, status: 'La orden fue confirmada' })
  } else if (['preparing', 'in_route', 'delivered', 'dispatched', 'billed', 'closed'].includes(order.order_status)) {
    rows.push({ date: order.updated_at, status: 'La orden paso a preparacion' })
  }

  const assignments = (order.dispatch_assignments ?? order.dispatchAssignments ?? [])
    .filter(item => item?.status !== false && item?.status !== 0 && item?.dispatch)
    .sort((left, right) => new Date(left?.dispatch?.departed_at || left?.dispatch?.scheduled_date || 0) - new Date(right?.dispatch?.departed_at || right?.dispatch?.scheduled_date || 0))

  const firstRoute = assignments.find(item => ['in_route', 'delivered', 'closed'].includes(item?.dispatch?.dispatch_status))
  if (firstRoute) {
    rows.push({
      date: firstRoute.dispatch.departed_at ?? firstRoute.dispatch.updated_at ?? firstRoute.dispatch.created_at,
      status: `Manifiesto ${firstRoute.dispatch.manifest_code || firstRoute.dispatch.code || ''}`.trim(),
    })
    rows.push({
      date: firstRoute.dispatch.departed_at ?? firstRoute.dispatch.updated_at ?? firstRoute.dispatch.created_at,
      status: 'El pedido salio en ruta',
    })
  } else if (order.dispatch_status === 'in_route') {
    rows.push({ date: order.updated_at, status: 'El pedido salio en ruta' })
  }

  if (order.dispatch_status === 'dispatched' || assignments.some(item => item?.dispatch?.dispatch_status === 'dispatched')) {
    rows.push({ date: order.updated_at, status: 'El pedido paso a despacho' })
  }

  orderGuides(order).forEach((guide) => {
    rows.push({
      date: guide.issue_date ?? guide.created_at ?? order.updated_at,
      status: `Guia de remision ${guideNumber(guide)} - ${getReferralGuideStatusLabel(guide.guide_status)}`,
    })
  })

  const deliveredDispatch = assignments.find(item => ['delivered', 'closed'].includes(item?.dispatch?.dispatch_status))
  if (deliveredDispatch) {
    rows.push({
      date: deliveredDispatch.dispatch.delivered_at ?? deliveredDispatch.dispatch.updated_at ?? deliveredDispatch.dispatch.created_at,
      status: 'El pedido fue entregado',
    })
  } else if (order.dispatch_status === 'delivered') {
    rows.push({ date: order.updated_at, status: 'El pedido fue entregado' })
  }

  if (order.order_status === 'cancelled' || order.dispatch_status === 'cancelled') {
    rows.push({ date: order.updated_at, status: 'El pedido fue cancelado' })
  }

  return [...persistedRows, ...rows]
    .filter(row => row.date)
    .sort((left, right) => new Date(left.date) - new Date(right.date))
}

const LegacyListingPanel = ({ title, config }) => {
  const pageSize = config?.pageSize ?? 20
  const [listSize, setListSize] = useState(`${pageSize}`)
  return (
    <div className='row'>
      <div className='col-12'>
        <div className='card'>
          <div className='card-header'>{title}</div>
          <div className='card-body'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2'>
              <div className='d-flex align-items-center gap-2'>
                <label className='form-label mb-0'>Elementos :</label>
                <div style={{ width: 90 }}>
                  <VdSelect
                    noMargin
                    value={listSize}
                    onChange={(value) => setListSize(value)}
                    options={[10, 20, 25, 50].map(size => ({ value: `${size}`, label: `${size}` }))}
                  />
                </div>
              </div>
              <div className='d-flex align-items-center gap-2'>
                <label className='form-label mb-0'>Filtrar :</label>
                <input className='form-control form-control-sm commercial-order-list-search' />
              </div>
            </div>
            {(config?.exports ?? []).length > 0 && (
              <div className='d-flex flex-wrap gap-1 mb-2'>
                {config.exports.map(label => <button type='button' className='btn btn-sm btn-light' key={`commercial-list-export-${label}`}>{label}</button>)}
              </div>
            )}
            <div className='table-responsive commercial-order-legacy-table'>
              <table className='table table-sm table-bordered table-striped align-middle mb-0'>
                <thead>
                  <tr>
                    {(config?.headers ?? []).map(header => <th key={`commercial-list-header-${header}`}>{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={(config?.headers ?? []).length || 1} className='text-muted'>No existen elementos</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2'>
              <span className='text-muted'>No hay elementos a mostrar</span>
              <div className='d-flex align-items-center gap-2 text-muted'>
                <span>Anterior</span>
                <button type='button' className='btn btn-sm btn-light active'>1</button>
                <span>Siguiente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CommercialOrders = ({ requiredPermission = 'orders', externalSource = null, pageTitle = 'Pedidos comerciales' }) => {
  commercialOrdersRest.externalSource = null

  const gridRef = useRef()
  const billingGridRef = useRef()
  const multivendeGridRef = useRef()
  const modalRef = useRef()
  const multivendeModalRef = useRef()
  const multivendeCheckoutRef = useRef()
  const delayReasonModalRef = useRef()
  const delayReasonIdRef = useRef()
  const delayReasonDescriptionRef = useRef()
  const trackingModalRef = useRef()
  const evidenceModalRef = useRef()
  const evidenceFileRef = useRef()
  const creditNoteModalRef = useRef()
  const creditNoteReasonRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const doctorNameRef = useRef()
  const issueDateRef = useRef()
  const promisedDateRef = useRef()
  const paymentConditionRef = useRef()
  const purchaseOrderRef = useRef()
  const guideNumberRef = useRef()
  const referralGuideRef = useRef()
  const installmentsRef = useRef()
  const firstDueDateRef = useRef()
  const orderStatusRef = useRef()
  const dispatchStatusRef = useRef()
  const billingStatusRef = useRef()
  const taxAmountRef = useRef()
  const deliveryAddressRef = useRef()
  const deliveryReferenceRef = useRef()
  const dispatchContactNameRef = useRef()
  const dispatchContactPhoneRef = useRef()
  const observationsRef = useRef()
  const clientRecordsRef = useRef({})
  const articleRecordsRef = useRef({})

  const [isEditing, setIsEditing] = useState(false)
  // Solo se persiste el codigo (columna commercial_orders.ubigeo); departamento/provincia/distrito
  // se derivan del catalogo INEI al abrir el pedido.
  const [deliveryUbigeo, setDeliveryUbigeo] = useState(EMPTY_UBIGEO_SELECTION)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedEventualClientId, setSelectedEventualClientId] = useState('')
  const [selectedSellerId, setSelectedSellerId] = useState('')
  const [businessLabel, setBusinessLabel] = useState('')
  const [warehouseLabel, setWarehouseLabel] = useState('')
  const [clientLabel, setClientLabel] = useState('')
  const [eventualClientLabel, setEventualClientLabel] = useState('')
  const [sellerLabel, setSellerLabel] = useState('')
  const [creditNoteDocId, setCreditNoteDocId] = useState('')
  const [formInstanceKey, setFormInstanceKey] = useState(0)
  const [selectedNetworkId, setSelectedNetworkId] = useState('')
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState('')
  const [mapPosition, setMapPosition] = useState({ lat: '', lng: '' })
  const [mapSearchText, setMapSearchText] = useState('')
  const [branches, setBranches] = useState([])
  const [networks, setNetworks] = useState([])
  const [deliveryAddresses, setDeliveryAddresses] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [selectedDocumentType, setSelectedDocumentType] = useState('Factura')
  const [selectedCurrency, setSelectedCurrency] = useState('PEN')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [detractionTypes, setDetractionTypes] = useState([])
  const [detractionEnabled, setDetractionEnabled] = useState(false)
  const [selectedDetractionTypeId, setSelectedDetractionTypeId] = useState('')
  const [retentionEnabled, setRetentionEnabled] = useState(false)
  const [delayReasonStatus, setDelayReasonStatus] = useState('1')
  const [discountMenu, setDiscountMenu] = useState(null)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [evidenceOrder, setEvidenceOrder] = useState(null)
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [evidencePreview, setEvidencePreview] = useState('')
  const [delayReasons, setDelayReasons] = useState([])
  const [delayReasonFilter, setDelayReasonFilter] = useState('')
  const [delayReasonsLoading, setDelayReasonsLoading] = useState(false)
  const [activeListingTab, setActiveListingTab] = useState(externalSource ? 'multivende' : 'orders')
  const [businessOptions, setBusinessOptions] = useState([])
  const [laboratoryOptions, setLaboratoryOptions] = useState([])
  const [listingFilters, setListingFilters] = useState(emptyListingFilters())
  const [appliedListingFilters, setAppliedListingFilters] = useState(emptyAppliedListingFilters())
  const [formLockReason, setFormLockReason] = useState('')
  const [evidenceForm, setEvidenceForm] = useState({
    recipient_name: '',
    recipient_document_type: 'DNI',
    recipient_document_number: '',
    recipient_phone: '',
    delivered_at: nowDateTimeLocal(),
    evidence_notes: '',
    evidence_url: '',
    latitude: '',
    longitude: '',
  })
  const multivendeOrdersRest = useMemo(() => {
    const rest = new CommercialOrdersRest()
    rest.externalSource = externalSource || defaultExternalSource
    return rest
  }, [externalSource])
  const activeTab = listingTabs.find(tab => tab.id === activeListingTab) ?? listingTabs[0]
  const activeFilters = listingFilters[activeListingTab] ?? {}
  const activeAppliedFilters = appliedListingFilters[activeListingTab] ?? {}
  const ordersFilterValue = useMemo(() => buildOrderFilter(appliedListingFilters.orders), [appliedListingFilters.orders])
  const billingFilterValue = useMemo(() => buildBillingFilter(activeListingTab, activeAppliedFilters), [activeListingTab, activeAppliedFilters])
  const multivendeFilterValue = useMemo(() => buildMultivendeFilter(appliedListingFilters.multivende, externalSource || defaultExternalSource), [appliedListingFilters.multivende, externalSource])

  const articleSearchAPI = useMemo(() => {
    const search = new URLSearchParams()
    if (selectedBusinessId) search.append('business_id', selectedBusinessId)
    if (selectedBranchId) search.append('business_branch_id', selectedBranchId)
    if (selectedWarehouseId) search.append('warehouse_id', selectedWarehouseId)
    if (selectedClientId) search.append('client_id', selectedClientId)
    if (selectedEventualClientId) search.append('eventual_client_id', selectedEventualClientId)
    if (selectedNetworkId) search.append('client_distribution_network_id', selectedNetworkId)
    if (issueDateRef.current?.value) search.append('issue_date', issueDateRef.current.value)
    return `/api/admin/commercial-orders/articles?${search.toString()}`
  }, [
    selectedBusinessId,
    selectedBranchId,
    selectedWarehouseId,
    selectedClientId,
    selectedEventualClientId,
    selectedNetworkId,
  ])
  const warehouseFilter = useMemo(() => (
    selectedBranchId ? ['business_branch_id', '=', Number(selectedBranchId)] : null
  ), [selectedBranchId])

  useEffect(() => {
    return () => {
      if (evidencePreview?.startsWith('blob:')) URL.revokeObjectURL(evidencePreview)
    }
  }, [evidencePreview])

  useEffect(() => {
    let mounted = true
    Promise.all([
      billingDocumentsRest.getBusinesses(),
      commercialOrdersRest.getLaboratories(),
      fetchPaginateOptions('/api/admin/detraction-types/paginate', 'description', null, '', (x) => x, 200),
    ]).then(([businesses, laboratories, types]) => {
      if (!mounted) return
      setBusinessOptions(businesses)
      setLaboratoryOptions(laboratories)
      setDetractionTypes(types ?? [])
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!discountMenu) return undefined

    const closeMenu = () => setDiscountMenu(null)
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('click', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeMenu)
    window.addEventListener('scroll', closeMenu, true)

    return () => {
      document.removeEventListener('click', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [discountMenu])

  const loadBranches = async (businessId, preferredId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
      return
    }
    const data = await commercialOrdersRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return
    }
    setSelectedBranchId('')
  }

  const applyClientSnapshot = (client) => {
    if (!client) return
    const address = clientAddressValue(client)
    const ubigeo = clientUbigeoValue(client)
    if (address && deliveryAddressRef.current) deliveryAddressRef.current.value = address
    if (ubigeo) setDeliveryUbigeo({ ...EMPTY_UBIGEO_SELECTION, ubigeo })
    if (address) setMapSearchText(address)
  }

  const loadNetworks = async (clientId, preferredId = null, fallbackClient = null) => {
    if (!clientId) {
      setNetworks([])
      setSelectedNetworkId('')
      setDeliveryAddresses([])
      setSelectedDeliveryAddressId('')
      return
    }
    const data = await commercialOrdersRest.getDistributionNetworks(clientId)
    const active = (data ?? []).filter(item => item.status !== null)
    setNetworks(active)
    const defaultId = preferredId || active.find(item => item.is_default)?.id
    if (defaultId && active.some(item => `${item.id}` === `${defaultId}`)) {
      setSelectedNetworkId(`${defaultId}`)
      await loadDeliveryAddresses(defaultId, null, active)
      return
    }
    setSelectedNetworkId('')
    setDeliveryAddresses([])
    setSelectedDeliveryAddressId('')
    applyClientSnapshot(fallbackClient)
  }

  const loadDeliveryAddresses = async (networkId, preferredId = null, currentNetworks = null) => {
    if (!networkId) {
      setDeliveryAddresses([])
      setSelectedDeliveryAddressId('')
      return
    }
    let data = []
    const hydratedNetwork = (currentNetworks ?? networks).find(item => `${item.id}` === `${networkId}`)
    if ((hydratedNetwork?.addresses?.length ?? 0) > 0) {
      data = hydratedNetwork.addresses
    } else {
      data = await commercialOrdersRest.getDeliveryAddresses(networkId)
    }
    const active = (data ?? []).filter(item => item.status !== null)
    setDeliveryAddresses(active)
    const defaultId = preferredId || active.find(item => item.is_default)?.id
    if (defaultId && active.some(item => `${item.id}` === `${defaultId}`)) {
      setSelectedDeliveryAddressId(`${defaultId}`)
      applyDeliveryAddressSnapshot(active.find(item => `${item.id}` === `${defaultId}`))
      return
    }
    setSelectedDeliveryAddressId('')
  }

  const applyDeliveryAddressSnapshot = (address) => {
    if (!address) return
    if (deliveryAddressRef.current) deliveryAddressRef.current.value = textValue(address.address)
    if (deliveryReferenceRef.current) deliveryReferenceRef.current.value = textValue(address.reference)
    setDeliveryUbigeo({
      ubigeo: textValue(address.ubigeo),
      department: textValue(address.department),
      province: textValue(address.province),
      district: textValue(address.district),
    })
    if (dispatchContactNameRef.current) dispatchContactNameRef.current.value = textValue(address.contact_name)
    if (dispatchContactPhoneRef.current) dispatchContactPhoneRef.current.value = textValue(address.contact_phone)
    setMapSearchText(textValue(address.address))
    if (hasMapPosition({ lat: address.latitude, lng: address.longitude })) {
      setMapPosition({ lat: Number(address.latitude), lng: Number(address.longitude) })
    }
  }

  const repriceItem = async (item, overrides = {}) => {
    const articleId = overrides.article_id ?? item.article_id
    const quantity = Number(overrides.quantity ?? item.quantity ?? 0)
    const presentationId = overrides.presentation_id ?? item.presentation_id
    if (!articleId || !selectedWarehouseId || quantity <= 0) return null

    return await commercialOrdersRest.resolvePrice({
      article_id: articleId,
      presentation_id: presentationId || null,
      quantity,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      client_id: selectedClientId || null,
      eventual_client_id: selectedEventualClientId || null,
      client_distribution_network_id: selectedNetworkId || null,
      issue_date: issueDateRef.current?.value || null,
      commercial_channel: (networks.find(row => `${row.id}` === `${selectedNetworkId}`)?.commercial_channel) || null,
      segment: (networks.find(row => `${row.id}` === `${selectedNetworkId}`)?.segment) || null,
    })
  }

  const repriceAllItems = async (nextItems = null) => {
    const currentItems = nextItems ?? items
    for (const currentItem of currentItems) {
      if (!currentItem.article_id) continue
      const resolution = await repriceItem(currentItem)
      if (!resolution) continue
      setItems(prev => prev.map(item => {
        if (item.uid !== currentItem.uid) return item
        return mapItemTotals({
          ...item,
          stock_available: Number(resolution.stock_available || 0),
          price_unit: resolvePriceUnitValue(item, resolution),
          price_source: resolvePriceSourceValue(item, resolution),
          price_list_code: resolution.price_list_code || '',
        })
      }))
    }
  }

  const clearCustomerSelections = (type) => {
    if (type === 'regular') {
      setSelectedEventualClientId('')
    } else if (type === 'eventual') {
      setSelectedClientId('')
      setNetworks([])
      setSelectedNetworkId('')
      setDeliveryAddresses([])
      setSelectedDeliveryAddressId('')
    }
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)
    setFormInstanceKey(key => key + 1)
    setFormLockReason(commercialOrderEditLockReason(data))

    if (idRef.current) idRef.current.value = data?.id ?? ''
    if (codeRef.current) codeRef.current.value = data?.code ?? 'Se genera al guardar'
    if (issueDateRef.current) issueDateRef.current.value = data?.issue_date ? data.issue_date.toString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    if (promisedDateRef.current) promisedDateRef.current.value = data?.promised_delivery_at ? data.promised_delivery_at.toString().slice(0, 10) : ''
    setSelectedDocumentType(normalizeDocumentType(data?.document_type ?? 'Factura'))
    setSelectedCurrency(data?.currency ?? 'PEN')
    if (paymentConditionRef.current) paymentConditionRef.current.value = data?.payment_condition ?? 'Contado'
    setSelectedPaymentMethod(normalizePaymentMethodForForm(data?.payment_method))
    if (installmentsRef.current) installmentsRef.current.value = data?.installments ?? 1
    if (firstDueDateRef.current) firstDueDateRef.current.value = data?.first_due_date ? data.first_due_date.toString().slice(0, 10) : ''
    if (orderStatusRef.current) orderStatusRef.current.value = data?.order_status ?? (data?.external_source ? 'pending' : 'draft')
    if (dispatchStatusRef.current) dispatchStatusRef.current.value = data?.dispatch_status ?? 'pending'
    if (billingStatusRef.current) billingStatusRef.current.value = data?.billing_status ?? 'pending'
    if (deliveryAddressRef.current) deliveryAddressRef.current.value = textValue(data?.delivery_address)
    if (deliveryReferenceRef.current) deliveryReferenceRef.current.value = textValue(data?.delivery_reference)
    setDeliveryUbigeo({ ...EMPTY_UBIGEO_SELECTION, ubigeo: textValue(data?.ubigeo) })
    if (dispatchContactNameRef.current) dispatchContactNameRef.current.value = textValue(data?.dispatch_contact_name)
    if (dispatchContactPhoneRef.current) dispatchContactPhoneRef.current.value = textValue(data?.dispatch_contact_phone)
    if (purchaseOrderRef.current) purchaseOrderRef.current.value = data?.purchase_order ?? ''
    if (guideNumberRef.current) guideNumberRef.current.value = data?.guide_number ?? ''
    if (referralGuideRef.current) referralGuideRef.current.value = data?.referral_guide ?? ''
    if (doctorNameRef.current) doctorNameRef.current.value = data?.doctor_name ?? ''
    if (observationsRef.current) observationsRef.current.value = data?.observations ?? ''
    setMapPosition({
      lat: hasMapPosition({ lat: data?.map_lat, lng: data?.map_lng }) ? Number(data.map_lat) : '',
      lng: hasMapPosition({ lat: data?.map_lat, lng: data?.map_lng }) ? Number(data.map_lng) : '',
    })
    setMapSearchText(textValue(data?.delivery_address))

    const businessId = data?.business_id ? `${data.business_id}` : ''
    const warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : ''
    const clientId = data?.client_id ? `${data.client_id}` : ''
    const eventualClientId = data?.eventual_client_id ? `${data.eventual_client_id}` : ''
    setDetractionEnabled(!!data?.detraction_enabled)
    setSelectedDetractionTypeId(data?.detraction_type_id ? `${data.detraction_type_id}` : '')
    setRetentionEnabled(!!data?.retention_enabled)
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)
    setSelectedClientId(clientId)
    setSelectedEventualClientId(eventualClientId)

    clientRecordsRef.current = {}
    articleRecordsRef.current = {}
    setBusinessLabel(businessId && data?.business?.name ? data.business.name : '')
    setWarehouseLabel(warehouseId && data?.warehouse?.name ? data.warehouse.name : '')
    setClientLabel(clientId && data?.client?.full_name ? [data.client.document_number, data.client.full_name].filter(Boolean).join(' - ') : '')
    setEventualClientLabel(eventualClientId && data?.eventual_client?.business_name ? [data.eventual_client.document_number, data.eventual_client.business_name].filter(Boolean).join(' - ') : '')
    const sellerId = data?.seller_id ? `${data.seller_id}` : ''
    setSelectedSellerId(sellerId)
    setSellerLabel(sellerId && data?.seller ? formatAuditUser(data.seller) : '')

    const detail = (data?.items ?? []).map(row => {
      const article = row.article ?? null
      const presentations = (article?.presentations ?? []).filter(p => p?.status !== false && p?.status !== 0)
      const selectedPresentation = row.presentation ?? presentations[0] ?? null
      const presentationUnits = Number(row.presentation_units ?? selectedPresentation?.units ?? 1) || 1

      return mapItemTotals({
        uid: crypto.randomUUID(),
        article_id: row.article_id ? `${row.article_id}` : '',
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : '',
        article_code: article?.code ?? row.external_sku ?? '',
        article_lot: article?.default_lot ?? '',
        article_name: article?.name ?? '',
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
        article_laboratory: article?.laboratory?.name ?? '',
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
        presentations: presentations.map(p => ({
          id: `${p.id}`,
          name: p.name ?? 'Presentacion',
          units: Number(p.units || 1),
          price: Number(p.price || 0),
        })),
        presentation_id: selectedPresentation?.id ? `${selectedPresentation.id}` : '',
        presentation_units: presentationUnits,
        stock_available: Number(row.stock_available || 0),
        reserved_quantity: Number(row.reserved_quantity || 0),
        price_unit: Number(row.price_unit || 0),
        quantity: Number(row.quantity || 1),
        discount_type: row.external_payload?.commercial_form?.discount_type ?? 'none',
        discount_value: Number(row.external_payload?.commercial_form?.discount_value || 0),
        discount_amount: Number(row.external_payload?.commercial_form?.discount_amount || 0),
        gross_total: Number(row.external_payload?.commercial_form?.gross_total || 0),
        total: Number(row.total || 0),
        price_source: row.price_source || 'fallback',
        price_list_code: row?.price_list_item?.price_list?.code || data?.price_list?.code || '',
      })
    })
    const loadedItems = detail.length ? detail : [emptyItem()]
    setItems(loadedItems)

    $(modalRef.current).modal('show')
    await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
    if (clientId) {
      await loadNetworks(clientId, data?.client_distribution_network_id ?? null)
      if (data?.client_distribution_network_id) {
        await loadDeliveryAddresses(data.client_distribution_network_id, data?.client_delivery_address_id ?? null)
      }
    } else {
      setNetworks([])
      setSelectedNetworkId('')
      setDeliveryAddresses([])
      setSelectedDeliveryAddressId('')
    }
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()
    if (formLockReason) {
      Swal.fire('Pedido bloqueado', formLockReason, 'info')
      return
    }

    if (!selectedBusinessId) {
      Swal.fire({ icon: 'warning', title: 'Empresa requerida', text: 'Selecciona la empresa del pedido.' })
      return
    }
    if (!selectedWarehouseId) {
      Swal.fire({ icon: 'warning', title: 'Almacen requerido', text: 'Selecciona el almacen del pedido.' })
      return
    }

    const request = {
      id: idRef.current?.value || undefined,
      external_source: externalSource || undefined,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      client_id: selectedClientId || null,
      eventual_client_id: selectedEventualClientId || null,
      seller_id: selectedSellerId || null,
      client_distribution_network_id: selectedNetworkId || null,
      client_delivery_address_id: selectedDeliveryAddressId || null,
      document_type: selectedDocumentType,
      currency: selectedCurrency || 'PEN',
      payment_condition: paymentConditionFromPaymentMethod(selectedPaymentMethod || paymentConditionRef.current?.value || 'Contado'),
      payment_method: selectedPaymentMethod || '',
      purchase_order: purchaseOrderRef.current?.value?.trim() || '',
      guide_number: guideNumberRef.current?.value?.trim() || '',
      referral_guide: referralGuideRef.current?.value?.trim() || '',
      doctor_name: doctorNameRef.current?.value?.trim() || '',
      issue_date: issueDateRef.current?.value || '',
      promised_delivery_at: promisedDateRef.current?.value || null,
      installments: installmentsRef.current?.value || 1,
      first_due_date: firstDueDateRef.current?.value || null,
      order_status: orderStatusRef.current?.value || (externalSource ? 'pending' : 'draft'),
      dispatch_status: dispatchStatusRef.current?.value || 'pending',
      billing_status: billingStatusRef.current?.value || 'pending',
      tax_amount: orderTotals.taxAmount,
      detraction_enabled: detractionEnabled,
      detraction_type_id: detractionEnabled ? (selectedDetractionTypeId || null) : null,
      retention_enabled: retentionEnabled,
      delivery_address: deliveryAddressRef.current?.value?.trim() || '',
      delivery_reference: deliveryReferenceRef.current?.value?.trim() || '',
      ubigeo: deliveryUbigeo.ubigeo?.trim() || '',
      map_lat: formatCoordinate(mapPosition.lat) || null,
      map_lng: formatCoordinate(mapPosition.lng) || null,
      dispatch_contact_name: dispatchContactNameRef.current?.value?.trim() || '',
      dispatch_contact_phone: dispatchContactPhoneRef.current?.value?.trim() || '',
      observations: observationsRef.current?.value?.trim() || '',
      items: items.map(item => ({
        article_id: item.article_id || null,
        presentation_id: item.presentation_id || null,
        warehouse_id: selectedWarehouseId || null,
        stock_available: item.stock_available,
        reserved_quantity: item.reserved_quantity,
        presentation_units: item.presentation_units,
        price_unit: item.price_unit,
        quantity: item.quantity,
        gross_total: item.gross_total,
        discount_type: item.discount_type,
        discount_value: item.discount_value,
        discount_amount: item.discount_amount,
        total: item.total,
        status: true,
      })),
    }

    const shortages = buildStockShortages(items, selectedWarehouseId)
    if (shortages.length > 0) {
      const html = `
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${shortages.map(row => `<li><strong>${escapeHtml(row.article)}</strong>: faltan ${formatQuantity(row.shortage)} unidad(es) base para completar ${formatQuantity(row.quantity)}. Cantidad: ${formatQuantity(row.lineQuantity)} x ${formatQuantity(row.presentationUnits)}. Disponible: ${formatQuantity(row.available)}.</li>`).join('')}
          </ul>
        </div>
      `
      const { isConfirmed } = await Swal.fire({
        title: 'Stock insuficiente',
        html,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Crear de todas formas',
        cancelButtonText: 'Revisar pedido',
      })
      if (!isConfirmed) return
      request.allow_stock_shortage = true
    }

    const result = await commercialOrdersRest.save(request)
    if (!result) return

    refreshActiveListingGrid()
    $(modalRef.current).modal('hide')
  }

  const onBusinessChanged = async (value) => {
    const businessId = value || ''
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId('')
    setWarehouseLabel('')
    await loadBranches(businessId, null)
  }

  const onBranchChanged = (value) => {
    const branchId = value || ''
    setSelectedBranchId(branchId)
    setSelectedWarehouseId('')
    setWarehouseLabel('')
  }

  const onWarehouseChanged = async (value) => {
    const warehouseId = value || ''
    setSelectedWarehouseId(warehouseId)
    await repriceAllItems()
  }

  // Valor y etiqueta del desplegable unico, derivados de cual de los dos clientes esta elegido.
  const selectedCustomerValue = selectedClientId
    ? `client-${selectedClientId}`
    : (selectedEventualClientId ? `eventual-${selectedEventualClientId}` : '')
  const selectedCustomerLabel = selectedClientId
    ? clientLabel
    : (selectedEventualClientId ? `${eventualClientLabel}${eventualClientLabel ? ' · Eventual' : ''}` : '')

  const onClientChanged = async (value) => {
    const clientId = normalizeSelectEntityId(value)
    const selectedClient = clientRecordsRef.current[`${value}`] ?? null
    setSelectedClientId(clientId)
    clearCustomerSelections('regular')
    applyClientSnapshot(selectedClient)
    await loadNetworks(clientId, null, selectedClient)
    await repriceAllItems()
  }

  const onEventualClientChanged = async (value) => {
    const eventualClientId = normalizeSelectEntityId(value)
    setSelectedEventualClientId(eventualClientId)
    clearCustomerSelections('eventual')
    await repriceAllItems()
  }

  // Un solo desplegable de cliente. El pedido sigue guardando client_id o eventual_client_id por
  // separado, asi que las opciones viajan con el prefijo que ya usa normalizeSelectEntityId para
  // saber de que tipo es cada una.
  const loadCustomerOptions = async (term) => {
    const [regulares, eventuales] = await Promise.all([
      fetchPaginateOptions('/api/admin/clients/paginate', 'full_name', regularClientFilter, term, (x) => {
        clientRecordsRef.current[`${x.entity_id}`] = x
        return {
          value: `client-${x.entity_id}`,
          label: [x.document_number, x.full_name].filter(Boolean).join(' - ') || x.full_name || `#${x.entity_id}`,
        }
      }, 25),
      fetchPaginateOptions('/api/admin/eventual-clients/paginate', 'business_name', null, term, (x) => ({
        value: `eventual-${x.id}`,
        // Se marca el tipo: un mismo negocio puede estar en las dos listas y hay que poder elegir.
        label: `${[x.document_number, x.business_name].filter(Boolean).join(' - ') || x.business_name || `#${x.id}`} · Eventual`,
      }), 25),
    ])

    return [...(regulares ?? []), ...(eventuales ?? [])]
  }

  const onCustomerChanged = async (value) => {
    const raw = `${value ?? ''}`.trim()
    if (!raw) {
      setSelectedEventualClientId('')
      await onClientChanged('')
      return
    }
    if (raw.startsWith('eventual-')) {
      await onEventualClientChanged(raw)
      return
    }
    await onClientChanged(normalizeSelectEntityId(raw))
  }

  const onNetworkChanged = async (e) => {
    const networkId = e.target.value || ''
    setSelectedNetworkId(networkId)
    await loadDeliveryAddresses(networkId, null)
    await repriceAllItems()
  }

  const onDeliveryAddressChanged = (e) => {
    const addressId = e.target.value || ''
    setSelectedDeliveryAddressId(addressId)
    const selected = deliveryAddresses.find(item => `${item.id}` === `${addressId}`)
    if (selected) applyDeliveryAddressSnapshot(selected)
  }

  const updateListingFilter = (tabId, key, value) => {
    setListingFilters(current => ({
      ...current,
      [tabId]: {
        ...(current[tabId] ?? {}),
        [key]: value,
      },
    }))
  }

  const getActiveListingTableRef = (tabId = activeListingTab) => {
    if (tabId === 'multivende') return multivendeGridRef
    return listingTabs.find(tab => tab.id === tabId)?.kind === 'billing' ? billingGridRef : gridRef
  }

  const refreshActiveListingGrid = (tabId = activeListingTab) => {
    getActiveListingTableRef(tabId).current?.refresh()
  }

  const applyListingFiltersForTab = (tabId = activeListingTab) => {
    const nextFilters = listingFilters[tabId] ?? {}
    if (tabId === 'orders') {
      commercialOrdersRest.setFilters({
        laboratory_id: nextFilters.laboratoryId || '',
      })
    }
    setAppliedListingFilters(current => ({
      ...current,
      [tabId]: nextFilters,
    }))
    setTimeout(() => refreshActiveListingGrid(tabId), 0)
  }

  const applyListingFilters = (event) => {
    event?.preventDefault?.()
    applyListingFiltersForTab(activeListingTab)
  }

  // Columnas de exportacion (etiqueta + extractor de texto) por pestaña
  const listingExportColumns = (tabId) => {
    if (tabId === 'orders') return [
      ['Estado', row => getCommercialOrderStatusLabel(row.order_status)],
      ['Comprobante', row => orderVoucherLabel(row)],
      ['Tipo documento', row => orderDocumentTypeLabel(row)],
      ['Cliente', row => orderCustomerLabel(row)],
      ['Total', row => Number(row.total || 0)],
      ['Tipo de pago', row => orderPaymentLabel(row)],
      ['Usuario', row => formatPlainUser(row.seller)],
      ['Fecha registro', row => formatDateCell(row.created_at)],
      ['Usuario registro', row => formatUserRegistry(row.creator)],
      ['Codigo', row => row.code ?? ''],
      ['Empresa', row => row.business?.name ?? ''],
    ]
    if (tabId === 'issued' || tabId === 'credit-notes') {
      const columns = [
        ['Serie', row => row.series ?? ''],
        ['Secuencia', row => row.sequence ?? ''],
        ['SUNAT', row => billingDocumentSunatLabel(row)],
      ]
      if (tabId === 'credit-notes') columns.push(['Doc. Afecto', row => billingDocumentAffectedLabel(row)])
      return [
        ...columns,
        ['Cliente', row => billingDocumentClientLabel(row)],
        ['Moneda', row => currencyLabel(row.currency)],
        ['Total Gravada', row => Number(row.subtotal || 0)],
        ['IGV', row => Number(row.tax_amount || 0)],
        ['Importe Factura', row => Number(row.total || 0)],
        ['Tipo de Pago', row => row.payment_method ?? ''],
        ['Fecha Facturacion', row => formatDateCell(row.issue_date)],
      ]
    }
    if (tabId === 'multivende') return [
      ['E. Pedido', row => getCommercialOrderStatusLabel(row.order_status)],
      ['E. SUNAT', row => orderSunatLabel(row)],
      ['Pedido VTEX', row => orderExternalIdLabel(row)],
      ['Canal', row => row.external_channel ?? ''],
      ['Comprobante', row => orderVoucherLabel(row)],
      ['Tipo Documento', row => orderDocumentTypeLabel(row)],
      ['Cliente', row => orderCustomerLabel(row)],
      ['Total', row => Number(row.total || 0)],
      ['F. Entrega Estimada', row => formatDateCell(row.promised_delivery_at)],
      ['F. de Entrega', row => formatDateCell(orderDeliveredDate(row))],
      ['Tiempo de Proceso', row => orderProcessTime(row)],
      ['Fecha Registro', row => formatDateCell(row.created_at)],
      ['Codigo', row => row.code ?? ''],
    ]
    return null
  }

  const exportFileName = (tabId) => ({
    orders: 'pedidos-comerciales',
    issued: 'facturas-emitidas',
    'credit-notes': 'notas-de-credito',
    multivende: 'pedidos-multivende',
  }[tabId] || 'reporte')

  const exportRowsToFile = async (columns, rows, fileName) => {
    if (window.ExcelJS && window.saveAs) {
      const workbook = new window.ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Reporte')
      worksheet.addRow(columns.map(([label]) => label))
      rows.forEach(row => worksheet.addRow(columns.map(([, value]) => value(row))))
      worksheet.columns.forEach(column => { column.width = 20 })
      const buffer = await workbook.xlsx.writeBuffer()
      window.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${fileName}.xlsx`)
      return
    }
    const csv = [
      columns.map(([label]) => `"${label}"`).join(','),
      ...rows.map(row => columns.map(([, value]) => `"${`${value(row) ?? ''}`.replaceAll('"', '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    if (window.saveAs) {
      window.saveAs(blob, `${fileName}.csv`)
      return
    }
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(blob)
    anchor.download = `${fileName}.csv`
    anchor.click()
    URL.revokeObjectURL(anchor.href)
  }

  const exportActiveListingGrid = (applyFiltersFirst = false) => {
    const tabId = activeListingTab
    if (applyFiltersFirst) applyListingFiltersForTab(tabId)

    const run = async () => {
      const columns = listingExportColumns(tabId)
      if (!columns) return
      let rows = []
      try {
        rows = await getActiveListingTableRef(tabId).current?.loadAll() ?? []
      } catch (error) {
        rows = []
      }
      await exportRowsToFile(columns, rows, exportFileName(tabId))
    }

    if (applyFiltersFirst) setTimeout(run, 350)
    else run()
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await commercialOrdersRest.boolean({ id, field, value })
    if (!result) return
    gridRef.current?.refresh()
  }

  const openTracking = (data) => {
    setTrackingOrder(data)
    $(trackingModalRef.current).modal('show')
  }

  const openEvidence = (data) => {
    const evidence = latestEvidence(data)
    setEvidenceOrder(data)
    setEvidenceFile(null)
    setEvidencePreview(isEvidenceImage(evidence?.evidence_url) ? evidence.evidence_url : '')
    setEvidenceForm({
      recipient_name: evidence?.recipient_name ?? data?.dispatch_contact_name ?? '',
      recipient_document_type: evidence?.recipient_document_type ?? 'DNI',
      recipient_document_number: evidence?.recipient_document_number ?? '',
      recipient_phone: evidence?.recipient_phone ?? data?.dispatch_contact_phone ?? '',
      delivered_at: evidence?.delivered_at ? `${evidence.delivered_at}`.replace(' ', 'T').slice(0, 16) : nowDateTimeLocal(),
      evidence_notes: evidence?.evidence_notes ?? '',
      evidence_url: evidence?.evidence_url ?? '',
      latitude: evidence?.latitude ?? '',
      longitude: evidence?.longitude ?? '',
    })
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setEvidenceForm(prev => ({
          ...prev,
          latitude: prev.latitude || position.coords.latitude,
          longitude: prev.longitude || position.coords.longitude,
        }))
      }, () => {}, { enableHighAccuracy: true, timeout: 5000 })
    }
    setTimeout(() => {
      if (evidenceFileRef.current) evidenceFileRef.current.value = ''
    }, 0)
    $(evidenceModalRef.current).modal('show')
  }

  const onEvidenceFileChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setEvidenceFile(file)
    setEvidencePreview(file ? URL.createObjectURL(file) : (isEvidenceImage(evidenceForm.evidence_url) ? evidenceForm.evidence_url : ''))
  }

  const onEvidenceFieldChange = (field, value) => setEvidenceForm(prev => ({ ...prev, [field]: value }))

  const saveEvidence = async (e) => {
    e.preventDefault()
    if (!evidenceOrder?.id) return

    const assignment = (evidenceOrder.dispatch_assignments ?? evidenceOrder.dispatchAssignments ?? [])
      .filter(item => item?.status !== false && item?.status !== 0 && item?.dispatch)
      .sort((left, right) => new Date(right?.dispatch?.scheduled_date || right?.created_at || 0) - new Date(left?.dispatch?.scheduled_date || left?.created_at || 0))[0]

    const request = new FormData()
    if (assignment?.dispatch_id) request.append('dispatch_id', assignment.dispatch_id)
    request.append('recipient_name', evidenceForm.recipient_name ?? '')
    request.append('recipient_document_type', evidenceForm.recipient_document_type ?? 'DNI')
    request.append('recipient_document_number', evidenceForm.recipient_document_number ?? '')
    request.append('recipient_phone', evidenceForm.recipient_phone ?? '')
    request.append('delivered_at', evidenceForm.delivered_at ?? '')
    request.append('evidence_notes', evidenceForm.evidence_notes ?? '')
    request.append('evidence_url', evidenceForm.evidence_url ?? '')
    request.append('latitude', evidenceForm.latitude ?? '')
    request.append('longitude', evidenceForm.longitude ?? '')
    if (evidenceFile) request.append('evidence_file', evidenceFile)

    const result = await commercialOrdersRest.saveDeliveryEvidence(evidenceOrder.id, request)
    if (!result) return
    setEvidenceFile(null)
    setEvidencePreview('')
    if (evidenceFileRef.current) evidenceFileRef.current.value = ''
    $(evidenceModalRef.current).modal('hide')
    gridRef.current?.refresh()
  }

  const onOpenReferralGuide = async (order) => {
    const existingGuide = orderGuides(order)[0]
    if (existingGuide) {
      if (canIssueGuide(existingGuide)) {
        const result = await Swal.fire({
          title: 'Guia de remision',
          text: `La guia ${guideNumber(existingGuide)} esta ${getReferralGuideStatusLabel(existingGuide.guide_status).toLowerCase()}.`,
          icon: 'question',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Emitir',
          denyButtonText: 'Ver PDF',
          cancelButtonText: 'Cancelar'
        })

        if (result.isConfirmed) {
          const issued = await referralGuidesRest.issue(existingGuide.id)
          if (!issued?.data) return
          refreshActiveListingGrid()
          await openMagistralesRecordPdf(buildMagistralesRows.referralGuide(issued.data))
          return
        }

        if (!result.isDenied) return
      }

      await openMagistralesRecordPdf(buildMagistralesRows.referralGuide(existingGuide))
      return
    }

    const result = await referralGuidesRest.prepareFromCommercialOrder(order.id)
    if (!result?.data) return
    refreshActiveListingGrid()
    await openMagistralesRecordPdf(buildMagistralesRows.referralGuide(result.data))
  }

  const loadBillingDocument = async (document) => {
    if (!document?.id) return document
    if (document.items && (document.business || document.commercial_order || document.commercialOrder)) return document
    const response = await billingDocumentsRest.paginate({
      skip: 0,
      take: 1,
      isLoadingAll: true,
      filter: ['id', '=', Number(document.id)],
    })
    return response?.data?.[0] ?? document
  }

  const previewBillingDocument = async (document) => {
    const refreshed = `${document?.local_status ?? 'pending'}` === 'pending'
      ? (await billingDocumentsRest.prepareVoucher(document.id))?.data ?? document
      : document
    const row = await loadBillingDocument(refreshed)
    if (!hasPreparedBillingDocument(row)) {
      await Swal.fire({
        title: 'Comprobante no preparado',
        text: 'Primero genera serie y correlativo del comprobante.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      })
      return
    }

    openBillingVoucherPreviewPdf(row)
  }

  const onOpenBillingDocument = async (order) => {
    let document = latestBillingDocument(order)

    if (document && canDownloadBillingDocument(document)) {
      openPdfUrlInModal(
        billingDocumentsRest.downloadUrl(document.id, 'pdf'),
        `Comprobante ${billingDocumentNumber(document) || document.code}`,
      )
      return
    }

    if (!document) {
      if (!canCreateBillingDocumentFromOrder(order)) {
        await Swal.fire({
          title: 'Comprobante no disponible',
          text: 'Primero envia el pedido a preparacion o confirma el pedido. Los pedidos en borrador no se pueden facturar.',
          icon: 'warning',
          confirmButtonText: 'Entendido',
        })
        return
      }

      const documentType = orderDocumentTypeLabel(order)
      const createResult = await Swal.fire({
        title: 'Generar comprobante',
        text: `Se generara un comprobante ${documentType} para el pedido ${order.code}.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Generar',
        cancelButtonText: 'Cancelar',
      })
      if (!createResult.isConfirmed) return

      const saved = await billingDocumentsRest.save({
        commercial_order_id: order.id,
        document_type: documentType,
      })
      if (!saved?.data?.id) return

      const prepared = await billingDocumentsRest.prepareVoucher(saved.data.id)
      document = prepared?.data ?? saved.data
      gridRef.current?.refresh()

      const issueNow = await Swal.fire({
        title: 'Comprobante generado',
        text: `Se genero ${billingDocumentNumber(document) || document.code}. Puedes emitirlo o previsualizarlo ahora.`,
        icon: 'success',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Emitir',
        denyButtonText: 'Previsualizar PDF',
        cancelButtonText: 'Cerrar',
      })
      if (issueNow.isDenied) {
        await previewBillingDocument(document)
        return
      }
      if (!issueNow.isConfirmed) return
    } else {
      const issueResult = await Swal.fire({
        title: 'Emitir comprobante',
        text: hasPreparedBillingDocument(document)
          ? `El comprobante ${billingDocumentNumber(document) || document.code} ya esta preparado. Puedes emitirlo o previsualizarlo.`
          : `Se emitira ${billingDocumentNumber(document) || document.code} usando el conector configurado.`,
        icon: 'question',
        showCancelButton: true,
        showDenyButton: hasPreparedBillingDocument(document),
        confirmButtonText: 'Emitir',
        denyButtonText: 'Previsualizar PDF',
        cancelButtonText: 'Cancelar',
      })
      if (issueResult.isDenied) {
        await previewBillingDocument(document)
        return
      }
      if (!issueResult.isConfirmed) return
    }

    const issued = await billingDocumentsRest.issue(document.id)
    if (!issued) return
    gridRef.current?.refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar pedido comercial',
      text: 'Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await commercialOrdersRest.delete(id)
    if (!result) return
    gridRef.current?.refresh()
  }

  const openMultivendeModal = () => {
    if (multivendeCheckoutRef.current) multivendeCheckoutRef.current.value = ''
    $(multivendeModalRef.current).modal('show')
    setTimeout(() => multivendeCheckoutRef.current?.focus(), 150)
  }

  const onMultivendeSubmit = async (e) => {
    e.preventDefault()
    const checkoutId = multivendeCheckoutRef.current?.value?.trim() || ''
    if (!checkoutId) {
      await Swal.fire({
        title: 'CHECK OUT ID requerido',
        text: 'Ingresa el CHECK OUT ID del pedido Multivende.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      })
      return
    }

    await Swal.fire({
      title: 'Integracion pendiente',
      text: `El formulario ya captura el CHECK OUT ID ${checkoutId}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,
      icon: 'info',
      confirmButtonText: 'Aceptar'
    })
  }

  const resetDelayReasonForm = () => {
    if (delayReasonIdRef.current) delayReasonIdRef.current.value = ''
    if (delayReasonDescriptionRef.current) delayReasonDescriptionRef.current.value = ''
    setDelayReasonStatus('1')
  }

  const loadDelayReasons = async () => {
    setDelayReasonsLoading(true)
    try {
      const response = await deliveryDelayReasonsRest.paginate({
        take: 100,
        skip: 0,
        requireTotalCount: true,
        sort: [{ selector: 'id', desc: false }],
      })
      setDelayReasons(response?.data ?? [])
    } finally {
      setDelayReasonsLoading(false)
    }
  }

  const openDelayReasonModal = async () => {
    resetDelayReasonForm()
    setDelayReasonFilter('')
    $(delayReasonModalRef.current).modal('show')
    await loadDelayReasons()
    setTimeout(() => delayReasonDescriptionRef.current?.focus(), 150)
  }

  const editDelayReason = (reason) => {
    if (delayReasonIdRef.current) delayReasonIdRef.current.value = reason?.id ?? ''
    if (delayReasonDescriptionRef.current) delayReasonDescriptionRef.current.value = reason?.description ?? ''
    setDelayReasonStatus(reason?.status ? '1' : '0')
    delayReasonDescriptionRef.current?.focus()
  }

  const saveDelayReason = async () => {
    const description = delayReasonDescriptionRef.current?.value?.trim() || ''
    if (!description) {
      await Swal.fire({
        title: 'Motivo requerido',
        text: 'Ingresa la descripcion del motivo de retraso.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      })
      return
    }

    const result = await deliveryDelayReasonsRest.save({
      id: delayReasonIdRef.current?.value || undefined,
      description,
      status: delayReasonStatus === '1',
    })
    if (!result) return
    resetDelayReasonForm()
    await loadDelayReasons()
  }

  const onItemArticleChanged = async (uid, value) => {
    const articleId = value || ''

    if (!articleId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...emptyItem(), uid: item.uid } : item))
      return
    }

    const article = articleRecordsRef.current[`${articleId}`] ?? null
    const hydrated = article ?? await commercialOrdersRest.getArticleById(articleId)
    const presentations = (hydrated?.presentations ?? []).filter(p => p?.status !== false && p?.status !== 0)
    const defaultPresentation = presentations[0] ?? null
    const articleLabel = hydrated
      ? `${hydrated.code ?? ''} - ${hydrated.name ?? ''}`.trim()
      : `${articleId}`

    const draftItem = {
      article_id: articleId,
      article_label: articleLabel,
      article_code: hydrated?.code ?? '',
      article_lot: hydrated?.default_lot ?? '',
      article_name: hydrated?.name ?? '',
      article_unit: hydrated?.unit?.symbol ?? hydrated?.unit?.name ?? '',
      article_laboratory: hydrated?.laboratory?.name ?? '',
      article_principle: hydrated?.activePrinciple?.name ?? hydrated?.active_principle?.name ?? '',
      presentations: presentations.map(p => ({
        id: `${p.id}`,
        name: p.name ?? 'Presentacion',
        units: Number(p.units || 1),
        price: Number(p.price || 0),
      })),
      presentation_id: defaultPresentation ? `${defaultPresentation.id}` : '',
      presentation_units: Number(defaultPresentation?.units || 1),
      quantity: 1,
    }

    setItems(prev => prev.map(item => item.uid === uid ? mapItemTotals({ ...item, ...draftItem }) : item))

    const resolution = await commercialOrdersRest.resolvePrice({
      article_id: articleId,
      presentation_id: defaultPresentation ? `${defaultPresentation.id}` : null,
      quantity: 1,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      client_id: selectedClientId || null,
      eventual_client_id: selectedEventualClientId || null,
      client_distribution_network_id: selectedNetworkId || null,
      issue_date: issueDateRef.current?.value || null,
      commercial_channel: (networks.find(row => `${row.id}` === `${selectedNetworkId}`)?.commercial_channel) || null,
      segment: (networks.find(row => `${row.id}` === `${selectedNetworkId}`)?.segment) || null,
    })

    if (!resolution) return
    setItems(prev => prev.map(item => item.uid === uid ? mapItemTotals({
      ...item,
      ...draftItem,
      stock_available: Number(resolution.stock_available || 0),
      price_unit: Number(resolution.price_unit || 0),
      price_source: resolution.source || 'fallback',
      price_list_code: resolution.price_list_code || '',
    }) : item))
  }

  const onItemFieldChanged = async (uid, field, value) => {
    const currentItem = items.find(item => item.uid === uid)
    if (!currentItem) return

    const selectedPresentation = field === 'presentation_id'
      ? currentItem.presentations.find(row => `${row.id}` === `${value}`)
      : null
    const nextState = mapItemTotals({
      ...currentItem,
      [field]: value,
      ...(field === 'presentation_id' ? { presentation_units: Number(selectedPresentation?.units || 1) } : {}),
    })
    if (field === 'price_unit') {
      nextState.price_source = 'manual'
      nextState.price_list_code = ''
    }
    setItems(prev => prev.map(item => item.uid === uid ? nextState : item))

    if (!['quantity', 'presentation_id'].includes(field)) return

    const presentation = nextState.presentations.find(row => `${row.id}` === `${field === 'presentation_id' ? value : nextState.presentation_id}`)
    const resolution = await repriceItem(nextState, {
      quantity: field === 'quantity' ? value : nextState.quantity,
      presentation_id: field === 'presentation_id' ? value : nextState.presentation_id,
    })
    if (!resolution) return

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      return mapItemTotals({
        ...item,
        presentation_units: Number(presentation?.units || item.presentation_units || 1),
        stock_available: Number(resolution.stock_available || 0),
        price_unit: resolvePriceUnitValue(item, resolution, field === 'presentation_id'),
        price_source: resolvePriceSourceValue(item, resolution, field === 'presentation_id'),
        price_list_code: field === 'presentation_id' ? (resolution.price_list_code || '') : (isManualPrice(item) ? item.price_list_code : (resolution.price_list_code || '')),
      })
    }))
  }

  const onItemDiscountPercentChanged = (uid, value) => {
    const percent = Number(value || 0)
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      return mapItemTotals({
        ...item,
        discount_type: percent > 0 ? 'percent' : 'none',
        discount_value: percent > 0 ? percent : 0,
      })
    }))
  }

  const onItemDiscountMenuOpened = (uid, event) => {
    event.preventDefault()
    event.stopPropagation()

    const rect = event.currentTarget.getBoundingClientRect()
    setDiscountMenu(current => current?.uid === uid ? null : {
      uid,
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 130),
    })
  }

  const onItemDiscountMenuSelected = (uid, value) => {
    onItemDiscountPercentChanged(uid, value)
    setDiscountMenu(null)
  }

  const onItemAdded = () => setItems(prev => [...prev, emptyItem()])
  const onItemRemoved = (uid) => {
    setItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyItem()]
    })
  }

  const grossSubtotal = useMemo(() => items.reduce((acc, item) => acc + Number(item.total || 0), 0), [items])
  const orderTotals = useMemo(() => deriveDocumentTotals(grossSubtotal, selectedDocumentType), [grossSubtotal, selectedDocumentType])
  // Detraccion y retencion se calculan sobre el total del pedido. El backend los vuelve a calcular
  // al guardar; esto es solo lo que se ve mientras se arma el pedido.
  const selectedDetractionType = useMemo(
    () => detractionTypes.find(type => `${type.id}` === `${selectedDetractionTypeId}`) ?? null,
    [detractionTypes, selectedDetractionTypeId]
  )
  const detractionPercent = detractionEnabled ? Number(selectedDetractionType?.percent ?? 0) : 0
  const retentionPercent = retentionEnabled ? RETENTION_PERCENT : 0
  const detractionAmount = round2(orderTotals.total * detractionPercent / 100)
  const retentionAmount = round2(orderTotals.total * retentionPercent / 100)
  const netTotal = round2(orderTotals.total - detractionAmount - retentionAmount)
  const isFormLocked = formLockReason !== ''
  const trackingRows = useMemo(() => buildTrackingRows(trackingOrder), [trackingOrder])
  const filteredDelayReasons = useMemo(() => {
    const query = delayReasonFilter.trim().toLowerCase()
    if (!query) return delayReasons
    return delayReasons.filter(reason => [
      reason.description,
      reason.status ? 'Activo' : 'Inactivo',
      formatUserRegistry(reason.creator),
      formatDelayReasonDate(reason.created_at),
    ].some(value => `${value ?? ''}`.toLowerCase().includes(query)))
  }, [delayReasons, delayReasonFilter])
  const renderListingFilterField = (tabId, field) => (
    <div className={`commercial-order-filter-field commercial-order-filter-${field.key}`} key={`commercial-order-main-filter-${tabId}-${field.key}`}>
      <label className='form-label'>
        {field.label}
        {field.helper && <span className='commercial-order-filter-helper'> {field.helper}</span>}
      </label>
      {field.type === 'business' ? (
        <VdSelect
          noMargin
          value={`${activeFilters[field.key] ?? ''}`}
          onChange={(value) => updateListingFilter(tabId, field.key, value)}
          options={businessOptions.map(business => ({ value: `${business.id}`, label: business.name }))}
          placeholder='Todos'
        />
      ) : field.type === 'laboratory' ? (
        <VdSelect
          noMargin
          value={`${activeFilters[field.key] ?? ''}`}
          onChange={(value) => updateListingFilter(tabId, field.key, value)}
          options={laboratoryOptions.map(laboratory => ({ value: `${laboratory.id}`, label: laboratory.name }))}
          placeholder='Todos'
        />
      ) : field.type === 'select' ? (
        <VdSelect
          noMargin
          value={`${activeFilters[field.key] ?? ''}`}
          onChange={(value) => updateListingFilter(tabId, field.key, value)}
          options={(field.options ?? []).map(option => ({ value: `${option.value ?? option}`, label: option.label ?? option }))}
          placeholder='Seleccionar'
        />
      ) : field.type === 'dateRange' ? (
        <input
          className='form-control commercial-order-date-range-input'
          data-tab-id={tabId}
          value={activeFilters[field.key] ?? ''}
          onChange={(event) => updateListingFilter(tabId, field.key, event.target.value)}
          placeholder={field.placeholder ?? 'YYYY/MM/DD - YYYY/MM/DD'}
        />
      ) : (
        <input className='form-control' value={activeFilters[field.key] ?? ''} onChange={(event) => updateListingFilter(tabId, field.key, event.target.value)} placeholder={field.placeholder ?? ''} />
      )}
    </div>
  )
  const listingFilterFields = {
    orders: [
      { key: 'dateRange', label: 'Fecha Registro (Inicio - Fin):', type: 'dateRange' },
      {
        key: 'laboratoryId',
        label: 'Laboratorio',
        helper: '(Solo para Reporte con Visitadores)',
        type: 'laboratory',
      },
      {
        key: 'dispatchStatus',
        label: 'Despachado',
        type: 'select',
        options: [
          { value: '', label: 'Seleccionar' },
          { value: 'dispatched', label: 'Pedidos despachados' },
          { value: 'pending', label: 'Pedidos sin despachar' },
        ],
      },
    ],
    issued: [
      { key: 'dateRange', label: 'Fecha Registro (Inicio - Fin):', type: 'dateRange' },
    ],
    'credit-notes': [
      { key: 'dateRange', label: 'Fecha Registro (Inicio - Fin):', type: 'dateRange' },
    ],
    multivende: [
      { key: 'dateRange', label: 'Fecha Registro (Inicio - Fin):', type: 'dateRange' },
      { key: 'orderVtex', label: 'Pedido VTEX', type: 'text', placeholder: 'Numero de pedido' },
    ],
  }
  const activeFilterFields = listingFilterFields[activeListingTab] ?? staticListingTabs[activeListingTab]?.filters ?? []
  const hasDateRangeFilter = activeFilterFields.some(field => field.type === 'dateRange')
  useEffect(() => {
    if (!hasDateRangeFilter) return undefined

    let mounted = true
    loadDateRangePickerAssets().then(() => {
      if (!mounted || !window.$?.fn?.daterangepicker || !window.moment) return
      window.moment.locale('es')

      $('.commercial-order-date-range-input').each(function () {
        const $input = $(this)
        const tabId = $input.data('tab-id') || activeListingTab
        const value = `${$input.val() || defaultDateRange()}`.trim()
        const { start, end } = dateRangeParts(value)
        const startDate = window.moment(start || todayPathDate().replaceAll('/', '-'), 'YYYY-MM-DD')
        const endDate = window.moment(end || start || todayPathDate().replaceAll('/', '-'), 'YYYY-MM-DD')
        const existing = $input.data('daterangepicker')

        if (existing) existing.remove()
        $input.off('.commercialOrderDateRange')
        $input.daterangepicker({
          startDate,
          endDate,
          autoUpdateInput: false,
          alwaysShowCalendars: true,
          linkedCalendars: false,
          opens: 'center',
          locale: {
            format: 'YYYY/MM/DD',
            separator: ' - ',
            applyLabel: 'Aplicar',
            cancelLabel: 'Limpiar',
            fromLabel: 'Desde',
            toLabel: 'Hasta',
            customRangeLabel: 'Personalizado',
            weekLabel: 'S',
            daysOfWeek: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
            monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            firstDay: 1,
          },
        }, (selectedStart, selectedEnd) => {
          const nextValue = `${selectedStart.format('YYYY/MM/DD')} - ${selectedEnd.format('YYYY/MM/DD')}`
          $input.val(nextValue)
          updateListingFilter(tabId, 'dateRange', nextValue)
        })
        $input.on('cancel.daterangepicker.commercialOrderDateRange', () => {
          $input.val('')
          updateListingFilter(tabId, 'dateRange', '')
        })
      })
    }).catch(() => {})

    return () => {
      mounted = false
      $('.commercial-order-date-range-input').each(function () {
        const picker = $(this).data('daterangepicker')
        if (picker) picker.remove()
        $(this).off('.commercialOrderDateRange')
      })
    }
  }, [activeListingTab, hasDateRangeFilter])

  const onOpenCreateCreditNote = () => {
    setCreditNoteDocId('')
    if (creditNoteReasonRef.current) creditNoteReasonRef.current.value = 'Anulacion de la operacion'
    $(creditNoteModalRef.current).modal('show')
  }

  const onCreateCreditNoteSubmit = async (e) => {
    e.preventDefault()
    const documentId = creditNoteDocId
    const reason = (creditNoteReasonRef.current?.value ?? '').trim()
    if (!documentId) {
      Swal.fire({ icon: 'warning', title: 'Selecciona un comprobante', text: 'Elige la factura o boleta a anular.' })
      return
    }
    if (!reason) {
      Swal.fire({ icon: 'warning', title: 'Motivo requerido', text: 'Indica el motivo de la anulacion.' })
      return
    }
    const result = await billingDocumentsRest.creditNote(documentId, { reason })
    if (!result) return
    $(creditNoteModalRef.current).modal('hide')
    Swal.fire({ icon: 'success', title: 'Nota de credito generada', timer: 2200, showConfirmButton: false })
    refreshActiveListingGrid()
  }

  const listingHeader = (
    <div className='commercial-order-listing-header'>
      <div className='d-flex align-items-center justify-content-between gap-2 mb-2'>
        <h4 className='header-title mb-0'>Listado</h4>
        <button type='button' className='btn btn-xs btn-light' onClick={() => refreshActiveListingGrid()} title='Refrescar listado'>
          <i className='mdi mdi-refresh'></i>
        </button>
      </div>
      <ul className='nav nav-tabs nav-bordered flex-nowrap overflow-auto mb-3'>
        {listingTabs.map(tab => (
          <li className='nav-item' key={`commercial-order-tab-${tab.id}`}>
            <button
              type='button'
              className={`nav-link text-nowrap ${activeListingTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveListingTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      {activeFilterFields.length > 0 && (
        <form className='commercial-order-filter-form mb-2' onSubmit={applyListingFilters}>
          {activeFilterFields.map(field => renderListingFilterField(activeListingTab, field))}
          <div className='commercial-order-filter-actions'>
            {activeListingTab === 'credit-notes' && (
              <button type='button' className='btn btn-primary' onClick={onOpenCreateCreditNote}>
                <i className='mdi mdi-plus me-1'></i>Crear Nota de Crédito
              </button>
            )}
            <button type='submit' className='btn btn-outline-primary'>
              <i className='mdi mdi-magnify me-1'></i>Filtrar
            </button>
            {activeTab.kind !== 'static' && (
              <button type='button' className='btn btn-outline-success' onClick={() => exportActiveListingGrid(false)}>
                <i className='mdi mdi-file-excel-box me-1'></i>Exportar a Excel
              </button>
            )}
            {activeListingTab === 'multivende' && (
              <button type='button' className='btn btn-outline-success'>
                <i className='mdi mdi-calendar-refresh me-1'></i>Actualizar fechas de entrega
              </button>
            )}
          </div>
        </form>
      )}
      {activeListingTab === 'issued' && (
        <div className='row g-3 mt-1'>
          {['Total', 'IGV', 'IGV Recuperado'].map(label => (
            <div className='col-12 col-md-4' key={`commercial-order-total-${label}`}>
              <label className='form-label'>{label}</label>
              <input className='form-control' value='0.00' readOnly />
            </div>
          ))}
        </div>
      )}
    </div>
  )
  const onCreditNoteOpen = async (document) => {
    const label = billingDocumentNumber(document) || document.code
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Generar nota de credito',
      html: `Se anulara el comprobante <b>${label}</b> generando una nota de credito que lo deja sin efecto.`,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Motivo de la anulacion',
      inputValue: 'Anulacion de la operacion',
      inputPlaceholder: 'Describe el motivo de la anulacion',
      showCancelButton: true,
      confirmButtonText: 'Generar nota de credito',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => (!value || !value.trim()) ? 'El motivo es obligatorio' : undefined,
    })
    if (!isConfirmed) return

    const result = await billingDocumentsRest.creditNote(document.id, { reason: reason.trim() })
    if (!result) return

    Swal.fire({
      icon: 'success',
      title: 'Nota de credito generada',
      text: 'Revisala en la pestaña Notas de Credito.',
      timer: 2500,
      showConfirmButton: false,
    })
    refreshActiveListingGrid()
  }

  // --- Acciones y columnas VdTable ---
  const billingActions = (row) => [
    {
      icon: 'mdi mdi-file-eye-outline', title: 'Previsualizar PDF del comprobante', ...ACTION_COLORS.danger,
      onClick: () => openPdfUrlInModal(billingDocumentsRest.downloadUrl(row.id, 'pdf'), `Comprobante ${billingDocumentNumber(row) || row.code}`),
    },
    {
      icon: 'mdi mdi-file-cancel-outline', title: 'Anular: generar nota de credito de este comprobante', ...ACTION_COLORS.warning,
      hidden: `${row.document_type ?? ''}`.trim().toLowerCase() === 'nota de credito',
      onClick: () => onCreditNoteOpen(row),
    },
  ]
  const billingColumnsBase = [
    { key: 'series', label: 'Serie', field: 'series', width: '90px', filter: { type: 'text' } },
    { key: 'sequence', label: 'Secuencia', field: 'sequence', width: '110px', filter: { type: 'text' } },
    { key: 'sunat', label: 'SUNAT', field: 'external_reference', width: '140px', sortable: false, render: (row) => billingDocumentSunatLabel(row) },
  ]
  const billingColumnsTail = [
    { key: 'cliente', label: 'Cliente', field: 'client.full_name', sortable: false, render: (row) => billingDocumentClientLabel(row) },
    { key: 'moneda', label: 'Moneda', field: 'currency', width: '100px', render: (row) => currencyLabel(row.currency) },
    { key: 'subtotal', label: 'Total Gravada', field: 'subtotal', width: '130px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoneyCell(row.subtotal) },
    { key: 'tax_amount', label: 'IGV', field: 'tax_amount', width: '90px', align: 'right', render: (row) => formatMoneyCell(row.tax_amount) },
    { key: 'total', label: 'Importe Factura', field: 'total', width: '130px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoneyCell(row.total) },
    { key: 'payment_method', label: 'Tipo de Pago', field: 'payment_method', width: '150px', filter: { type: 'text' } },
    { key: 'issue_date', label: 'Fecha Facturacion', field: 'issue_date', width: '150px', filter: { type: 'date' }, render: (row) => formatDateCell(row.issue_date) },
  ]
  const billingColumnsByTab = {
    issued: [...billingColumnsBase, ...billingColumnsTail],
    'credit-notes': [
      ...billingColumnsBase,
      { key: 'doc_afecto', label: 'Doc. Afecto', field: 'reference_document.code', width: '130px', sortable: false, render: (row) => billingDocumentAffectedLabel(row) },
      ...billingColumnsTail,
    ],
  }

  const multivendeActions = (row) => {
    const hasReferralGuide = orderGuides(row).length > 0
    return [
      { icon: 'mdi mdi-pencil', title: 'Editar pedido Multivende', ...ACTION_COLORS.primary, onClick: () => onModalOpen(row) },
      { icon: 'mdi mdi-timeline-clock-outline', title: 'Ver tracking del pedido Multivende', ...ACTION_COLORS.info, onClick: () => openTracking(row) },
      {
        icon: hasReferralGuide ? 'mdi mdi-eye' : 'mdi mdi-file-document',
        title: hasReferralGuide ? 'Ver guia de remision asociada' : 'Generar guia de remision',
        ...(hasReferralGuide ? ACTION_COLORS.dark : ACTION_COLORS.warning),
        onClick: () => onOpenReferralGuide(row),
      },
    ]
  }
  const multivendeColumns = [
    { key: 'order_status', label: 'E. Pedido', field: 'order_status', width: '130px', nowrap: true, filter: { type: 'select', field: 'order_status', options: commercialOrderStatusOptions }, render: (row) => <StatusBadge value={row.order_status} label={getCommercialOrderStatusLabel(row.order_status)} /> },
    { key: 'sunat', label: 'E. SUNAT', field: 'external_status', width: '120px', sortable: false, render: (row) => orderSunatLabel(row) },
    { key: 'vtex', label: 'Pedido VTEX', field: 'external_order_id', width: '150px', sortable: false, render: (row) => orderExternalIdLabel(row) },
    { key: 'external_channel', label: 'Canal', field: 'external_channel', width: '130px', filter: { type: 'text' } },
    { key: 'voucher_label', label: 'Comprobante', field: 'voucher_label', width: '130px', sortable: false, render: (row) => orderVoucherLabel(row) },
    { key: 'document_type', label: 'Tipo Documento', field: 'document_type', width: '140px', nowrap: true, render: (row) => { const label = orderDocumentTypeLabel(row); return <StatusBadge value={label} label={label || '-'} /> } },
    { key: 'customer_label', label: 'Cliente', field: 'customer_label', sortable: false, render: (row) => orderCustomerLabel(row) },
    { key: 'total', label: 'Total', field: 'total', width: '110px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoneyCell(row.total) },
    { key: 'promised_delivery_at', label: 'F. Entrega Estimada', field: 'promised_delivery_at', width: '160px', filter: { type: 'date' }, render: (row) => formatDateCell(row.promised_delivery_at) },
    { key: 'delivered_at', label: 'F. de Entrega', field: 'delivered_at', width: '150px', sortable: false, render: (row) => formatDateCell(orderDeliveredDate(row)) },
    { key: 'process_time', label: 'Tiempo de Proceso', field: 'process_time', width: '150px', sortable: false, render: (row) => orderProcessTime(row) },
    { key: 'created_at', label: 'Fecha Registro', field: 'created_at', width: '140px', filter: { type: 'date' }, render: (row) => formatDateCell(row.created_at) },
    { key: 'code', label: 'Codigo', field: 'code', width: '130px', filter: { type: 'text' } },
  ]

  const ordersActions = (row) => {
    const hasReferralGuide = orderGuides(row).length > 0
    const editLockReason = commercialOrderEditLockReason(row)
    const billingMeta = billingDocumentActionMeta(row)
    return [
      {
        icon: editLockReason ? 'mdi mdi-eye-outline' : 'mdi mdi-pencil',
        title: editLockReason || 'Editar datos, cliente, entrega y productos del pedido comercial',
        ...ACTION_COLORS.primary,
        onClick: () => onModalOpen(row),
      },
      {
        icon: 'mdi mdi-clipboard-check-outline',
        title: 'Enviar este pedido a preparacion para iniciar picking',
        ...ACTION_COLORS.success,
        hidden: !canSendToPreparation(row),
        onClick: () => onBooleanChange({ id: row.id, field: 'dispatch_status', value: 'preparing' }),
      },
      {
        icon: 'mdi mdi-timeline-clock-outline',
        title: 'Ver tracking del pedido: estados, guia, ruta y entrega',
        ...ACTION_COLORS.info,
        onClick: () => openTracking(row),
      },
      {
        icon: billingMeta.icon,
        title: billingMeta.title,
        ...ACTION_COLORS.secondary,
        onClick: () => onOpenBillingDocument(row),
      },
      {
        icon: hasReferralGuide ? 'mdi mdi-eye' : 'mdi mdi-file-document',
        title: hasReferralGuide
          ? 'Ver, emitir o descargar la guia de remision asociada al pedido'
          : 'Generar guia de remision para este pedido',
        ...(hasReferralGuide ? ACTION_COLORS.dark : ACTION_COLORS.warning),
        onClick: () => onOpenReferralGuide(row),
      },
      {
        icon: 'mdi mdi-camera',
        title: latestEvidence(row)
          ? 'Ver o actualizar foto y datos de evidencia de entrega'
          : 'Registrar foto y datos de evidencia de entrega',
        ...ACTION_COLORS.success,
        onClick: () => openEvidence(row),
      },
      {
        icon: 'mdi mdi-file-pdf-box',
        title: 'Previsualizar o descargar PDF resumen del pedido comercial',
        ...ACTION_COLORS.danger,
        onClick: () => openMagistralesRecordPdf(buildMagistralesRows.commercialOrder(row)),
      },
      {
        icon: 'mdi mdi-delete',
        title: 'Eliminar este pedido comercial del listado',
        ...ACTION_COLORS.danger,
        onClick: () => onDeleteClicked(row.id),
      },
    ]
  }
  const ordersColumns = [
    { key: 'order_status', label: 'Estado', field: 'order_status', width: '140px', nowrap: true, filter: { type: 'select', field: 'order_status', options: commercialOrderStatusOptions }, render: (row) => <StatusBadge value={row.order_status} label={getCommercialOrderStatusLabel(row.order_status)} /> },
    { key: 'voucher_label', label: 'Comprobante', field: 'voucher_label', width: '130px', sortable: false, render: (row) => orderVoucherLabel(row) },
    { key: 'document_type', label: 'Tipo documento', field: 'document_type', width: '140px', nowrap: true, render: (row) => { const label = orderDocumentTypeLabel(row); return <StatusBadge value={label} label={label || '-'} /> } },
    { key: 'customer_label', label: 'Cliente', field: 'customer_label', sortable: false, render: (row) => orderCustomerLabel(row) },
    { key: 'total', label: 'Total', field: 'total', width: '110px', align: 'right', filter: { type: 'number' }, render: (row) => formatMoneyCell(row.total) },
    { key: 'payment_label', label: 'Tipo de pago', field: 'payment_label', width: '170px', sortable: false, render: (row) => orderPaymentLabel(row) },
    { key: 'seller', label: 'Usuario', field: 'seller.fullname', width: '190px', sortable: false, render: (row) => formatPlainUser(row.seller) },
    { key: 'created_at', label: 'Fecha registro', field: 'created_at', width: '140px', filter: { type: 'date' }, render: (row) => formatDateCell(row.created_at) },
    { key: 'creator', label: 'Usuario registro', field: 'creator.username', width: '160px', sortable: false, render: (row) => formatUserRegistry(row.creator) },
    { key: 'code', label: 'Código', field: 'code', width: '130px', filter: { type: 'text' } },
    { key: 'business', label: 'Empresa', field: 'business.name', sortable: false, filter: { type: 'text', field: 'business.name' }, render: (row) => row.business?.name ?? '' },
  ]

  return (<>
    <style>{`
      .commercial-order-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 352px;
        white-space: nowrap;
        overflow: visible !important;
      }
      .commercial-order-action-btn {
        width: 34px;
        height: 30px;
        padding: 0 !important;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        line-height: 1;
        flex: 0 0 34px;
      }
      .commercial-order-action-btn i {
        display: inline-flex;
        font-size: 16px;
        line-height: 1;
      }
      .commercial-order-form-readonly {
        pointer-events: none;
      }
      .commercial-order-status-cell {
        overflow: visible !important;
      }
      .commercial-order-status-badge {
        align-items: center;
        border: 1px solid transparent;
        border-radius: 999px;
        display: inline-flex;
        font-size: 0.78rem;
        font-weight: 700;
        justify-content: center;
        line-height: 1.15;
        max-width: 100%;
        min-height: 24px;
        padding: 4px 9px;
        white-space: nowrap;
      }
      .commercial-order-status-draft {
        background: #f1f5f9;
        border-color: #cbd5e1;
        color: #475569;
      }
      .commercial-order-status-pending {
        background: #fff7ed;
        border-color: #fed7aa;
        color: #9a3412;
      }
      .commercial-order-status-confirmed {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #1d4ed8;
      }
      .commercial-order-status-partial {
        background: #f5f3ff;
        border-color: #c4b5fd;
        color: #6d28d9;
      }
      .commercial-order-status-preparing {
        background: #fef3c7;
        border-color: #fbbf24;
        color: #92400e;
      }
      .commercial-order-status-dispatched {
        background: #ede9fe;
        border-color: #c4b5fd;
        color: #6d28d9;
      }
      .commercial-order-status-in_route {
        background: #e0f2fe;
        border-color: #7dd3fc;
        color: #0369a1;
      }
      .commercial-order-status-delivered {
        background: #dcfce7;
        border-color: #86efac;
        color: #166534;
      }
      .commercial-order-status-cancelled {
        background: #fee2e2;
        border-color: #fca5a5;
        color: #b91c1c;
      }
      .commercial-order-status-billed,
      .commercial-order-status-closed,
      .commercial-order-status-paid {
        background: #ecfdf5;
        border-color: #6ee7b7;
        color: #047857;
      }
      .commercial-order-status-factura {
        background: #eef2ff;
        border-color: #a5b4fc;
        color: #3730a3;
      }
      .commercial-order-status-boleta {
        background: #ccfbf1;
        border-color: #5eead4;
        color: #0f766e;
      }
      .commercial-order-status-nota-de-pedido {
        background: #f8fafc;
        border-color: #94a3b8;
        color: #334155;
      }
      .commercial-order-status-empty {
        background: #f8fafc;
        border-color: #e2e8f0;
        color: #64748b;
      }
      .commercial-order-action-btn:hover,
      .commercial-order-action-btn:focus,
      .commercial-order-action-btn:active {
        box-shadow: none !important;
        opacity: 1 !important;
      }
      .commercial-order-action-btn.btn-soft-primary,
      .commercial-order-action-btn.btn-soft-primary:hover,
      .commercial-order-action-btn.btn-soft-primary:focus,
      .commercial-order-action-btn.btn-soft-primary:active {
        background-color: rgba(59, 130, 246, 0.14) !important;
        border-color: rgba(59, 130, 246, 0.18) !important;
        color: #3b82f6 !important;
      }
      .commercial-order-action-btn.btn-soft-success,
      .commercial-order-action-btn.btn-soft-success:hover,
      .commercial-order-action-btn.btn-soft-success:focus,
      .commercial-order-action-btn.btn-soft-success:active {
        background-color: rgba(16, 196, 105, 0.14) !important;
        border-color: rgba(16, 196, 105, 0.18) !important;
        color: #10c469 !important;
      }
      .commercial-order-action-btn.btn-soft-info,
      .commercial-order-action-btn.btn-soft-info:hover,
      .commercial-order-action-btn.btn-soft-info:focus,
      .commercial-order-action-btn.btn-soft-info:active {
        background-color: rgba(53, 184, 224, 0.14) !important;
        border-color: rgba(53, 184, 224, 0.18) !important;
        color: #35b8e0 !important;
      }
      .commercial-order-action-btn.btn-soft-warning,
      .commercial-order-action-btn.btn-soft-warning:hover,
      .commercial-order-action-btn.btn-soft-warning:focus,
      .commercial-order-action-btn.btn-soft-warning:active {
        background-color: rgba(247, 184, 75, 0.16) !important;
        border-color: rgba(247, 184, 75, 0.2) !important;
        color: #f7b84b !important;
      }
      .commercial-order-action-btn.btn-soft-danger,
      .commercial-order-action-btn.btn-soft-danger:hover,
      .commercial-order-action-btn.btn-soft-danger:focus,
      .commercial-order-action-btn.btn-soft-danger:active {
        background-color: rgba(255, 91, 91, 0.14) !important;
        border-color: rgba(255, 91, 91, 0.18) !important;
        color: #ff5b5b !important;
      }
      .commercial-order-action-btn i,
      .commercial-order-action-btn:hover i,
      .commercial-order-action-btn:focus i,
      .commercial-order-action-btn:active i {
        color: inherit !important;
      }
      .commercial-order-top-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: flex-end;
        margin-bottom: 12px;
      }
      .commercial-order-multivende-action,
      .commercial-order-delay-action {
        min-height: 46px;
        min-width: min(100%, 360px);
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        border-radius: 4px;
        padding: 0 16px;
        font-weight: 600;
      }
      .commercial-order-delay-action {
        background: #f7b84b;
        border-color: #f7b84b;
        color: #fff;
      }
      .commercial-order-delay-action:hover,
      .commercial-order-delay-action:focus {
        background: #eba934;
        border-color: #eba934;
        color: #fff;
      }
      .commercial-order-multivende-action span,
      .commercial-order-delay-action span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .commercial-order-multivende-form {
        padding: 8px 2px 0;
      }
      .commercial-order-delay-maintainer {
        padding: 4px 4px 0;
      }
      .commercial-order-delay-actions {
        display: flex;
        gap: 6px;
        justify-content: center;
        margin-bottom: 22px;
      }
      .commercial-order-delay-filter {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        margin-bottom: 8px;
      }
      .commercial-order-delay-filter .form-control {
        max-width: 220px;
      }
      .commercial-order-delay-table {
        max-height: 380px;
        overflow: auto;
      }
      .commercial-order-delay-table table {
        min-width: 780px;
      }
      .commercial-order-delay-table th {
        color: var(--ct-gray-700);
        font-size: 0.78rem;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .commercial-order-delay-summary {
        color: var(--ct-gray-700);
        font-size: 0.86rem;
        margin-top: 10px;
      }
      .commercial-order-listing-header .nav-link {
        background: transparent;
        border: 0;
      }
      .commercial-order-filter-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 12px 16px;
        align-items: end;
      }
      .commercial-order-filter-field {
        min-width: 0;
      }
      .commercial-order-filter-field .form-label {
        margin-bottom: 6px;
        font-weight: 600;
      }
      .commercial-order-filter-helper {
        color: var(--ct-success);
        font-size: 0.78rem;
        font-weight: 700;
      }
      .commercial-order-filter-actions {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }
      .commercial-order-filter-actions .btn {
        min-height: 38px;
        white-space: nowrap;
      }
      .daterangepicker {
        z-index: 1080;
      }
      @media (min-width: 1200px) {
        .commercial-order-filter-form {
          grid-template-columns:
            minmax(190px, 0.95fr)
            minmax(250px, 1fr)
            minmax(260px, 1fr)
            minmax(180px, 0.85fr)
            auto;
        }
        .commercial-order-filter-actions {
          justify-content: flex-end;
        }
      }
      .commercial-order-page-size {
        width: 76px;
      }
      .commercial-order-list-search {
        width: 220px;
      }
      .commercial-order-legacy-table table {
        min-width: 1180px;
      }
      .commercial-order-legacy-table th {
        color: var(--ct-gray-700);
        font-size: 0.76rem;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .commercial-order-modal-dialog {
        width: calc(100vw - 10px);
        max-width: calc(100vw - 10px);
      }
      .commercial-order-modal-dialog.modal-dialog-centered {
        align-items: flex-start;
        margin-top: 0.35rem;
        margin-bottom: 0.35rem;
      }
      .commercial-order-modal-body {
        padding: 12px 14px;
      }
      .commercial-order-modal-body .form-label {
        font-weight: 600;
        margin-bottom: 4px;
      }
      .commercial-order-form-section {
        border: 1px solid var(--ct-border-color);
        border-radius: 8px;
        padding: 14px 16px 16px;
        margin-bottom: 14px;
        background: var(--ct-secondary-bg);
      }
      .commercial-order-section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 12px;
        color: var(--ct-gray-700);
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .commercial-order-section-title i {
        color: var(--ct-primary);
        font-size: 16px;
      }
      .commercial-order-detail-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      .commercial-order-map-picker {
        border: 1px solid var(--ct-border-color);
        border-radius: 8px;
        padding: 10px;
        background: #fff;
      }
      .commercial-order-map-search {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 220px;
        gap: 10px;
        align-items: end;
        margin-bottom: 8px;
      }
      .commercial-order-map-coordinate-values {
        min-height: 38px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 2px;
        padding: 5px 10px;
        border: 1px solid var(--ct-border-color);
        border-radius: 6px;
        color: var(--ct-gray-700);
        background: var(--ct-light);
        font-size: 0.82rem;
        line-height: 1.2;
      }
      .commercial-order-map-canvas {
        width: 100%;
        height: 320px;
        border-radius: 6px;
        border: 1px solid var(--ct-border-color);
        overflow: hidden;
        background: var(--ct-light);
      }
      .commercial-order-map-empty {
        min-height: 160px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        border: 1px dashed var(--ct-border-color);
        border-radius: 6px;
        color: var(--ct-gray-600);
        background: var(--ct-light);
        text-align: center;
      }
      .commercial-order-map-results {
        max-height: 142px;
        overflow-y: auto;
        border: 1px solid var(--ct-border-color);
        border-radius: 6px;
        margin-bottom: 8px;
        background: #fff;
      }
      .commercial-order-map-result {
        display: block;
        width: 100%;
        padding: 7px 10px;
        border: 0;
        border-bottom: 1px solid var(--ct-border-color);
        background: #fff;
        color: var(--ct-gray-800);
        text-align: left;
        font-size: 0.86rem;
      }
      .commercial-order-map-result:hover,
      .commercial-order-map-result:focus {
        background: var(--ct-light);
      }
      .commercial-order-map-result:last-child {
        border-bottom: 0;
      }
      #commercial-orders-form-container .commercial-order-detail-table table {
        min-width: 1540px;
      }
      #commercial-orders-form-container .commercial-order-detail-table th {
        color: var(--ct-gray-700);
        font-size: 0.78rem;
        text-transform: uppercase;
        white-space: nowrap;
      }
      #commercial-orders-form-container .commercial-order-detail-table td {
        vertical-align: middle;
      }
      #commercial-orders-form-container .commercial-order-detail-table tfoot th,
      #commercial-orders-form-container .commercial-order-detail-table tfoot td {
        background: var(--ct-light);
        vertical-align: middle;
      }
      #commercial-orders-form-container .commercial-order-detail-table .form-group {
        position: relative;
        margin-bottom: 0 !important;
      }
      .commercial-order-detail-table .commercial-order-readonly-cell {
        min-height: 38px;
        display: flex;
        align-items: center;
        color: var(--ct-gray-700);
        font-size: 0.84rem;
      }
      .commercial-order-detail-table .commercial-order-article-name .select2-container .select2-selection--single {
        min-height: 38px;
      }
      .commercial-order-discount-cell {
        min-width: 92px;
      }
      .commercial-order-discount-trigger {
        min-width: 92px;
        width: 100%;
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border: 1px solid var(--ct-border-color);
        border-radius: 4px;
        background: #fff;
        color: var(--ct-gray-700);
        padding: 0.45rem 0.7rem;
        text-align: left;
      }
      .commercial-order-discount-trigger:hover,
      .commercial-order-discount-trigger:focus {
        border-color: var(--ct-primary);
        color: var(--ct-gray-800);
      }
      .commercial-order-discount-menu {
        position: fixed;
        z-index: 3000;
        padding: 4px;
        border: 1px solid var(--ct-border-color);
        border-radius: 6px;
        background: #fff;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
      }
      .commercial-order-discount-option {
        width: 100%;
        min-height: 34px;
        display: block;
        border: 0;
        border-radius: 4px;
        background: #fff;
        color: var(--ct-gray-700);
        padding: 6px 10px;
        text-align: left;
      }
      .commercial-order-discount-option:hover,
      .commercial-order-discount-option:focus,
      .commercial-order-discount-option.active {
        background: rgba(59, 130, 246, 0.12);
        color: var(--ct-primary);
      }
      #commercial-orders-form-container .commercial-order-detail-table .select2-container {
        width: 100% !important;
      }
      #commercial-orders-form-container .commercial-order-detail-table .select2-dropdown {
        min-width: 260px;
        z-index: 1065;
      }
      @media (max-width: 767.98px) {
        .commercial-order-modal-dialog {
          width: calc(100vw - 12px);
          max-width: calc(100vw - 12px);
          margin: 0.5rem auto;
        }
        .commercial-order-modal-body {
          padding: 12px;
        }
        .commercial-order-form-section {
          padding: 12px;
        }
        .commercial-order-detail-toolbar {
          align-items: flex-start;
          flex-direction: column;
        }
        .commercial-order-map-search {
          grid-template-columns: 1fr;
        }
        .commercial-order-top-actions {
          justify-content: stretch;
        }
        .commercial-order-multivende-action,
        .commercial-order-delay-action {
          width: 100%;
        }
      }
    `}</style>
    <div className='commercial-order-top-actions'>
      <button
        type='button'
        className='btn btn-success commercial-order-multivende-action'
        title='Ingresar pedido Multivende por CHECK OUT ID'
        onClick={openMultivendeModal}
      >
        <span><i className='mdi mdi-plus-circle-outline'></i> Ingresar pedido multivende</span>
        <i className='mdi mdi-calendar-month-outline'></i>
      </button>
      <button
        type='button'
        className='btn commercial-order-delay-action'
        title='Abrir mantenedor de motivos de retraso de entrega'
        onClick={openDelayReasonModal}
      >
        <span>Mantenedor Retraso Entrega</span>
        <i className='mdi mdi-cog'></i>
      </button>
    </div>
    <div className='row'>
      <div className='col-12'>
        <div className='card'>
          <div className='card-body'>
            {listingHeader}
          </div>
        </div>
      </div>
    </div>

    {activeListingTab === 'orders' && <VdTable
      key='orders'
      ref={gridRef}
      rest={commercialOrdersRest}
      icon='mdi mdi-cart-outline'
      title='Pedidos'
      unit='pedidos'
      defaultSort={{ field: 'created_at', desc: true }}
      defaultPageSize={25}
      searchFields={['code', 'purchase_order', 'guide_number', 'referral_guide']}
      searchPlaceholder='Buscar por codigo, O. compra, guia…'
      emptyText='No se encontraron pedidos comerciales.'
      baseFilter={ordersFilterValue}
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => gridRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
        <button type='button' className='vdt-btn-pri' onClick={() => onModalOpen(null)}>
          <i className='mdi mdi-plus'></i> Nuevo pedido
        </button>
      </>}
      actions={ordersActions}
      columns={ordersColumns}
      renderCard={(row, actionButtons) => (
        <div className='vdt-card'>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.code || orderVoucherLabel(row)}</p>
              <small className='text-muted'>{orderCustomerLabel(row)}</small>
            </div>
            <StatusBadge value={row.order_status} label={getCommercialOrderStatusLabel(row.order_status)} />
          </div>
          <div className='d-flex justify-content-between mt-2' style={{ fontSize: 12 }}>
            <span className='text-muted'>{orderPaymentLabel(row)}</span>
            <span className='fw-semibold'>S/ {formatMoneyCell(row.total)}</span>
          </div>
          <small className='text-muted d-block mt-1'>{formatDateCell(row.created_at)}{row.business?.name ? ` · ${row.business.name}` : ''}</small>
          {actionButtons && <div className='d-flex flex-wrap mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }}>{actionButtons}</div>}
        </div>
      )}
    />}

    {activeTab.kind === 'billing' && <VdTable
      key={`billing-${activeListingTab}`}
      ref={billingGridRef}
      rest={billingDocumentsRest}
      icon='mdi mdi-file-document-outline'
      title={activeListingTab === 'credit-notes' ? 'Notas de Credito' : 'Facturas Emitidas'}
      unit='comprobantes'
      defaultSort={{ field: 'issue_date', desc: true }}
      defaultPageSize={20}
      searchFields={['series', 'sequence', 'code']}
      searchPlaceholder='Buscar por serie, secuencia o codigo…'
      emptyText='No se encontraron comprobantes.'
      baseFilter={billingFilterValue}
      headerActions={<button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => billingGridRef.current?.refresh()}>
        <i className='mdi mdi-refresh'></i>
      </button>}
      actions={billingActions}
      columns={billingColumnsByTab[activeListingTab] ?? billingColumnsByTab.issued}
      renderCard={(row, actionButtons) => (
        <div className='vdt-card'>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{[row.series, row.sequence].filter(Boolean).join('-') || row.code}</p>
              <small className='text-muted'>{billingDocumentClientLabel(row)}</small>
            </div>
            <span className='fw-semibold'>S/ {formatMoneyCell(row.total)}</span>
          </div>
          <small className='text-muted d-block mt-2'>{row.payment_method || '-'} · {formatDateCell(row.issue_date)}</small>
          {actionButtons && <div className='d-flex flex-wrap mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }}>{actionButtons}</div>}
        </div>
      )}
    />}

    {activeListingTab === 'multivende' && <VdTable
      key='multivende'
      ref={multivendeGridRef}
      rest={multivendeOrdersRest}
      icon='mdi mdi-storefront-outline'
      title='Pedidos Multivende'
      unit='pedidos'
      defaultSort={{ field: 'created_at', desc: true }}
      defaultPageSize={10}
      searchFields={['code', 'external_order_id', 'external_checkout_id']}
      searchPlaceholder='Buscar por codigo o pedido…'
      emptyText='No se encontraron pedidos Multivende.'
      baseFilter={multivendeFilterValue}
      headerActions={<button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => multivendeGridRef.current?.refresh()}>
        <i className='mdi mdi-refresh'></i>
      </button>}
      actions={multivendeActions}
      columns={multivendeColumns}
      renderCard={(row, actionButtons) => (
        <div className='vdt-card'>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{orderExternalIdLabel(row)}</p>
              <small className='text-muted'>{orderCustomerLabel(row)}</small>
            </div>
            <StatusBadge value={row.order_status} label={getCommercialOrderStatusLabel(row.order_status)} />
          </div>
          <div className='d-flex justify-content-between mt-2' style={{ fontSize: 12 }}>
            <span className='text-muted'>{row.external_channel || '-'}</span>
            <span className='fw-semibold'>S/ {formatMoneyCell(row.total)}</span>
          </div>
          <small className='text-muted d-block mt-1'>{formatDateCell(row.created_at)}</small>
          {actionButtons && <div className='d-flex flex-wrap mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }}>{actionButtons}</div>}
        </div>
      )}
    />}

    {activeTab.kind === 'static' && <LegacyListingPanel
      title={activeTab.label}
      config={staticListingTabs[activeListingTab]}
    />}

    <Modal
      modalRef={modalRef}
      title={isFormLocked ? 'Ver pedido comercial' : (isEditing ? 'Editar pedido comercial' : 'Agregar pedido comercial')}
      size='xl'
      dialogClass='commercial-order-modal-dialog modal-dialog-scrollable'
      bodyClass='commercial-order-modal-body'
      bodyStyle={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', overflowX: 'hidden' }}
      btnSubmitText='Guardar'
      hideButtonSubmit={isFormLocked}
      preventEnterSubmit
      onSubmit={onModalSubmit}
    >
      <div id='commercial-orders-form-container'>
        <input ref={idRef} type='hidden' />
        <input ref={codeRef} type='hidden' />
        <input ref={issueDateRef} type='hidden' />
        <input ref={promisedDateRef} type='hidden' />
        <input ref={paymentConditionRef} type='hidden' />
        <input ref={installmentsRef} type='hidden' />
        <input ref={firstDueDateRef} type='hidden' />
        <input ref={orderStatusRef} type='hidden' />
        <input ref={dispatchStatusRef} type='hidden' />
        <input ref={billingStatusRef} type='hidden' />
        <input ref={taxAmountRef} type='hidden' value={orderTotals.taxAmount} readOnly />
        <input ref={deliveryReferenceRef} type='hidden' />

        {isFormLocked && (
          <div className='alert alert-warning py-2 mb-2'>
            <i className='mdi mdi-lock-outline me-1'></i>{formLockReason}
          </div>
        )}

        <fieldset className={isFormLocked ? 'commercial-order-form-readonly' : ''} disabled={isFormLocked} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
        <section className='commercial-order-form-section'>
          <div className='commercial-order-section-title'>
            <i className='mdi mdi-file-document'></i>
            <span>Datos del pedido</span>
          </div>
          <div className='row g-2'>
            <VdSelect
              key={`co-business-${formInstanceKey}`}
              col='col-12 col-md-6 col-xl-4'
              label='Empresa'
              required
              disabled={isFormLocked}
              value={selectedBusinessId}
              valueLabel={businessLabel}
              onChange={onBusinessChanged}
              loadOptions={(q) => fetchPaginateOptions('/api/admin/businesses/paginate', 'name', kamaryPeruBusinessFilter, q, (x) => ({ value: `${x.id}`, label: x.name }))}
              placeholder='-- Seleccionar empresa --'
            />
            <VdSelect
              col='col-12 col-md-6 col-xl-4'
              label='Sede'
              disabled={isFormLocked}
              value={selectedBranchId}
              onChange={onBranchChanged}
              options={branches.map(branch => ({ value: `${branch.id}`, label: branch.name }))}
              placeholder='Sin sede'
            />
            <VdSelect
              key={`co-warehouse-${formInstanceKey}`}
              col='col-12 col-md-6 col-xl-4'
              label='Almacen'
              required
              disabled={isFormLocked}
              value={selectedWarehouseId}
              valueLabel={warehouseLabel}
              onChange={onWarehouseChanged}
              loadOptions={(q) => fetchPaginateOptions('/api/admin/warehouses/paginate', 'name', warehouseFilter, q, (x) => ({ value: `${x.id}`, label: warehouseOptionLabel(x) }))}
              placeholder='-- Seleccionar almacen --'
            />
            <VdSelect
              col='col-12 col-sm-6 col-lg-4 col-xl-3'
              label='Doc. venta'
              disabled={isFormLocked}
              value={selectedDocumentType}
              onChange={(value) => setSelectedDocumentType(normalizeDocumentType(value))}
              options={[
                { value: 'Factura', label: 'Factura' },
                { value: 'Boleta', label: 'Boleta' },
                { value: 'Nota de pedido', label: 'Nota de pedido' },
              ]}
              placeholder='Seleccione'
            />
            <VdSelect
              col='col-12 col-sm-6 col-lg-4 col-xl-3'
              label='Moneda'
              disabled={isFormLocked}
              value={selectedCurrency}
              onChange={(value) => setSelectedCurrency(value)}
              options={[
                { value: 'PEN', label: 'PEN' },
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
              ]}
            />
            <VdSelect
              col='col-12 col-sm-6 col-lg-4 col-xl-3'
              label='Forma de pago'
              disabled={isFormLocked}
              value={selectedPaymentMethod}
              onChange={(value) => setSelectedPaymentMethod(value)}
              options={paymentMethodOptions.map(option => ({ value: option, label: option }))}
              placeholder='Seleccione'
            />
          </div>
        </section>

        <section className='commercial-order-form-section'>
          <div className='commercial-order-section-title'>
            <i className='mdi mdi-account'></i>
            <span>Cliente y entrega</span>
          </div>
          <div className='row g-2'>
            <VdSelect
              key={`co-customer-${formInstanceKey}`}
              col='col-12'
              label='Cliente'
              disabled={isFormLocked}
              clearable
              value={selectedCustomerValue}
              valueLabel={selectedCustomerLabel}
              onChange={onCustomerChanged}
              loadOptions={loadCustomerOptions}
              placeholder='-- Seleccionar cliente --'
            />
            <div className='col-12 col-md-6 col-xl-2'>
              <label className='form-label'>Orden de compra</label>
              <input ref={purchaseOrderRef} className='form-control' />
            </div>
            <div className='col-12 col-md-6 col-xl-2'>
              <label className='form-label'>Numero de guia</label>
              <input ref={guideNumberRef} className='form-control' />
            </div>
            <div className='col-12 col-md-6 col-xl-2'>
              <label className='form-label'>Guia remision</label>
              <input ref={referralGuideRef} className='form-control' />
            </div>
            <div className='col-12 col-xl-6'>
              <TextareaFormGroup eRef={deliveryAddressRef} label='Direccion de entrega' rows={2} />
            </div>
            <VdUbigeoCascade
              value={deliveryUbigeo}
              onChange={setDeliveryUbigeo}
              disabled={isFormLocked}
            />
            {/* El mapa se retiro del formulario. Las coordenadas (map_lat/map_lng) se siguen
                guardando y respetando: las que ya tienen los pedidos no se pierden ni se borran. */}
            <div className='col-12 col-md-6 col-xl-5'>
              <label className='form-label'>Nombre contacto entrega</label>
              <input ref={dispatchContactNameRef} className='form-control' />
            </div>
            <div className='col-12 col-md-6 col-xl-3'>
              <label className='form-label'>Celular contacto entrega</label>
              <input ref={dispatchContactPhoneRef} className='form-control' />
            </div>
            <VdSelect
              key={`co-seller-${formInstanceKey}`}
              col='col-12 col-md-6 col-xl-2'
              label='Vendedor'
              disabled={isFormLocked}
              clearable
              value={selectedSellerId}
              valueLabel={sellerLabel}
              onChange={(v) => setSelectedSellerId(v)}
              loadOptions={(q) => fetchPaginateOptions('/api/admin/users/paginate', 'fullname', null, q, (x) => ({ value: `${x.id}`, label: x.fullname || [x.name, x.lastname].filter(Boolean).join(' ') || `#${x.id}` }))}
              placeholder='-- Seleccionar vendedor --'
            />
            <div className='col-12 col-md-6 col-xl-2'>
              <label className='form-label'>Medico</label>
              <input ref={doctorNameRef} className='form-control' />
            </div>
          </div>
        </section>

        <section className='commercial-order-form-section'>
          <div className='commercial-order-detail-toolbar'>
            <div className='commercial-order-section-title mb-0'>
              <i className='mdi mdi-format-list-bulleted'></i>
              <span>Detalle del pedido</span>
            </div>
            <button type='button' className='btn btn-sm btn-outline-primary' onClick={onItemAdded}>
              Agregar item
            </button>
          </div>
          <div className='table-responsive border rounded commercial-order-detail-table' data-select2-local-dropdown='true'>
            <table className='table table-sm align-middle mb-0'>
              <thead>
                <tr>
                  <th style={{ minWidth: 96 }}>Descuento</th>
                  <th style={{ minWidth: 104 }}>Codigo</th>
                  <th style={{ minWidth: 88 }}>Codigo lote</th>
                  <th style={{ minWidth: 280 }}>Nombre</th>
                  <th style={{ minWidth: 128 }}>Laboratorio</th>
                  <th style={{ minWidth: 130 }}>Principio activo</th>
                  <th style={{ minWidth: 110 }}>Unidad</th>
                  <th style={{ minWidth: 64 }}>Stock</th>
                  <th style={{ minWidth: 112 }}>P. venta con IGV</th>
                  <th style={{ minWidth: 112 }}>P. venta sin IGV</th>
                  <th style={{ minWidth: 92 }}>Cantidad</th>
                  <th style={{ minWidth: 96 }}>Total desc.</th>
                  <th style={{ minWidth: 96 }}>Sub total</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uid}>
                    <td>
                      <div className='commercial-order-discount-cell'>
                        <button
                          type='button'
                          className='commercial-order-discount-trigger'
                          onClick={(event) => onItemDiscountMenuOpened(item.uid, event)}
                        >
                          <span>{item.discount_type === 'percent' && Number(item.discount_value || 0) > 0 ? `${Number(item.discount_value)}%` : 'Seleccione'}</span>
                          <i className='mdi mdi-chevron-down'></i>
                        </button>
                        {discountMenu?.uid === item.uid && (
                          <div
                            className='commercial-order-discount-menu'
                            style={{
                              top: discountMenu.top,
                              left: discountMenu.left,
                              minWidth: discountMenu.width,
                            }}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type='button'
                              className={`commercial-order-discount-option ${item.discount_type !== 'percent' ? 'active' : ''}`}
                              onClick={() => onItemDiscountMenuSelected(item.uid, '')}
                            >
                              Seleccione
                            </button>
                            {lineDiscountOptions.map(percent => (
                              <button
                                type='button'
                                key={`commercial-order-discount-floating-${item.uid}-${percent}`}
                                className={`commercial-order-discount-option ${item.discount_type === 'percent' && Number(item.discount_value || 0) === percent ? 'active' : ''}`}
                                onClick={() => onItemDiscountMenuSelected(item.uid, percent)}
                              >
                                {percent}%
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td><div className='commercial-order-readonly-cell'>{item.article_code || '-'}</div></td>
                    <td><div className='commercial-order-readonly-cell'>{item.article_lot || '-'}</div></td>
                    <td className='commercial-order-article-name'>
                      <VdSelect
                        noMargin
                        disabled={!selectedWarehouseId || isFormLocked}
                        value={item.article_id}
                        valueLabel={item.article_label}
                        onChange={(value) => onItemArticleChanged(item.uid, value)}
                        loadOptions={(q) => fetchPaginateOptions(articleSearchAPI, 'name', null, q, (x) => {
                          articleRecordsRef.current[`${x.id}`] = x
                          return { value: `${x.id}`, label: `${x.code ?? ''} - ${x.name ?? ''}`.trim() }
                        })}
                        placeholder={selectedWarehouseId ? 'Buscar articulo...' : 'Seleccione almacen primero'}
                      />
                    </td>
                    <td><div className='commercial-order-readonly-cell'>{item.article_laboratory || '-'}</div></td>
                    <td><div className='commercial-order-readonly-cell'>{item.article_principle || '-'}</div></td>
                    <td>
                      <div>
                        <div className='commercial-order-readonly-cell'>{item.article_unit || '-'}</div>
                        {item.presentations.length > 0 && (
                          <div className='mt-1'>
                            <VdSelect
                              noMargin
                              value={item.presentation_id}
                              disabled={!item.article_id || isFormLocked}
                              onChange={(value) => onItemFieldChanged(item.uid, 'presentation_id', value)}
                              options={[
                                { value: '', label: presentationEmptyLabel(item) },
                                ...item.presentations.map(presentation => ({
                                  value: `${presentation.id}`,
                                  label: presentationOptionLabel(presentation, item),
                                })),
                              ]}
                              placeholder={presentationEmptyLabel(item)}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td><div className='commercial-order-readonly-cell'>{Number(item.stock_available || 0).toFixed(2)}</div></td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        className='form-control'
                        value={item.price_unit}
                        onFocus={selectZeroInput}
                        onChange={(e) => onItemFieldChanged(item.uid, 'price_unit', readPositiveNumberInput(e))}
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        className='form-control'
                        value={deriveDocumentTotals(Number(item.price_unit || 0), selectedDocumentType).subtotal.toFixed(2)}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0.01'
                        className='form-control'
                        value={item.quantity}
                        onFocus={selectZeroInput}
                        onChange={(e) => onItemFieldChanged(item.uid, 'quantity', readPositiveNumberInput(e))}
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        className='form-control'
                        value={Number(item.discount_amount || 0).toFixed(2)}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        className='form-control'
                        value={Number(item.total || 0).toFixed(2)}
                        readOnly
                      />
                    </td>
                    <td className='text-end'>
                      <button type='button' className='btn btn-sm btn-outline-danger' onClick={() => onItemRemoved(item.uid)}>
                        <i className='mdi mdi-close'></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan='12' className='text-end'>{isTaxableDocumentType(selectedDocumentType) ? 'Total gravada' : 'Sub total'}</th>
                  <th>{orderTotals.subtotal.toFixed(2)}</th>
                  <th></th>
                </tr>
                <tr>
                  <th colSpan='12' className='text-end'>Descuento global</th>
                  <th>0.00</th>
                  <th></th>
                </tr>
                <tr>
                  <th colSpan='12' className='text-end'>IGV</th>
                  <th>{orderTotals.taxAmount.toFixed(2)}</th>
                  <th></th>
                </tr>
                <tr>
                  <th colSpan='12' className='text-end'>Total</th>
                  <th>{orderTotals.total.toFixed(2)}</th>
                  <th></th>
                </tr>
                {detractionEnabled && (
                  <tr>
                    <th colSpan='12' className='text-end'>Detraccion ({detractionPercent}%)</th>
                    <th className='text-danger'>-{detractionAmount.toFixed(2)}</th>
                    <th></th>
                  </tr>
                )}
                {retentionEnabled && (
                  <tr>
                    <th colSpan='12' className='text-end'>Retencion ({retentionPercent}%)</th>
                    <th className='text-danger'>-{retentionAmount.toFixed(2)}</th>
                    <th></th>
                  </tr>
                )}
                {(detractionEnabled || retentionEnabled) && (
                  <tr>
                    <th colSpan='12' className='text-end'>Total neto a pagar</th>
                    <th>{netTotal.toFixed(2)}</th>
                    <th></th>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </section>

        <section className='commercial-order-form-section'>
          <div className='commercial-order-section-title'>
            <i className='mdi mdi-percent-outline'></i>
            <span>Detraccion y retencion</span>
          </div>
          <div className='row g-2 align-items-end'>
            {/* Switches controlados de Bootstrap y no SwitchFormGroup: ese es un checkbox no
                controlado (defaultChecked + Switchery), asi que apagar uno desde el otro no se
                veria reflejado en pantalla. */}
            <div className='col-12 col-md-3'>
              <label className='form-label mb-1 d-block'>¿Detraccion?</label>
              <div className='form-check form-switch'>
                <input
                  id='commercial-order-detraction'
                  className='form-check-input'
                  type='checkbox'
                  role='switch'
                  checked={detractionEnabled}
                  disabled={isFormLocked}
                  onChange={(e) => {
                    const next = e.target.checked
                    setDetractionEnabled(next)
                    // Excluyentes: una operacion sujeta a detraccion no lleva retencion.
                    if (next) setRetentionEnabled(false)
                    else setSelectedDetractionTypeId('')
                  }}
                />
                <label className='form-check-label' htmlFor='commercial-order-detraction'>
                  {detractionEnabled ? 'SI' : 'NO'}
                </label>
              </div>
            </div>
            <div className='col-12 col-md-3'>
              <label className='form-label mb-1 d-block'>¿Retencion?</label>
              <div className='form-check form-switch'>
                <input
                  id='commercial-order-retention'
                  className='form-check-input'
                  type='checkbox'
                  role='switch'
                  checked={retentionEnabled}
                  disabled={isFormLocked || detractionEnabled}
                  onChange={(e) => {
                    const next = e.target.checked
                    setRetentionEnabled(next)
                    if (next) { setDetractionEnabled(false); setSelectedDetractionTypeId('') }
                  }}
                />
                <label className='form-check-label' htmlFor='commercial-order-retention'>
                  {retentionEnabled ? 'SI' : 'NO'}
                </label>
              </div>
            </div>
            <VdSelect
              col='col-12 col-md-6'
              label='Tipo de detraccion'
              disabled={isFormLocked || !detractionEnabled}
              value={selectedDetractionTypeId}
              onChange={(value) => setSelectedDetractionTypeId(value || '')}
              options={detractionTypes.map(type => ({ value: `${type.id}`, label: `[${type.code}] ${type.description} — ${Number(type.percent ?? 0)}%` }))}
              placeholder={detractionEnabled ? '-- Seleccionar tipo --' : 'Marca la detraccion primero'}
            />
            <div className='col-12'>
              <small className='text-muted'>
                {detractionEnabled
                  ? <>El porcentaje sale del tipo elegido y se puede cambiar en <strong>Sistemas › Tipos de detracción</strong>.</>
                  : (retentionEnabled
                    ? <>La retencion es siempre del {RETENTION_PERCENT}%.</>
                    : <>Ambas son excluyentes: una operacion sujeta a detraccion no lleva retencion.</>)}
              </small>
            </div>
          </div>
        </section>

        <section className='commercial-order-form-section mb-0'>
          <div className='commercial-order-section-title'>
            <i className='mdi mdi-note-text'></i>
            <span>Observaciones</span>
          </div>
          <TextareaFormGroup eRef={observationsRef} label='Observaciones' rows={3} disabled={isFormLocked} />
        </section>
        </fieldset>
      </div>
    </Modal>

    <Modal
      modalRef={multivendeModalRef}
      title='Ingresar pedido multivende'
      size='lg'
      btnSubmitText='Registrar'
      onSubmit={onMultivendeSubmit}
    >
      <div className='commercial-order-multivende-form'>
        <section className='commercial-order-form-section'>
          <div className='commercial-order-section-title'>
            <i className='mdi mdi-file-document-plus-outline'></i>
            <span>General</span>
          </div>
          <div className='mb-2'>
            <label className='form-label'>Ingrese el <strong>CHECK OUT ID</strong></label>
            <input
              ref={multivendeCheckoutRef}
              name='external_checkout_id'
              className='form-control'
              autoComplete='off'
            />
          </div>
        </section>
      </div>
    </Modal>

    <Modal
      modalRef={delayReasonModalRef}
      title='Mantenedor motivo retraso entrega'
      size='lg'
      hideFooter
      onSubmit={(e) => {
        e.preventDefault()
        saveDelayReason()
      }}
    >
      <div className='commercial-order-delay-maintainer'>
        <div className='commercial-order-delay-actions'>
          <button type='button' className='btn btn-sm btn-light' data-bs-dismiss='modal'>
            <i className='mdi mdi-close me-1'></i> Cerrar
          </button>
          <button type='submit' className='btn btn-sm btn-outline-primary'>
            <i className='mdi mdi-plus me-1'></i> Registrar
          </button>
        </div>

        <input ref={delayReasonIdRef} type='hidden' />

        <div className='row'>
          <div className='col-12 mb-3'>
            <label className='form-label'>Descripcion:</label>
            <input ref={delayReasonDescriptionRef} className='form-control' autoComplete='off' />
          </div>
          <VdSelect
            col='col-12 mb-3'
            label='Estado:'
            value={delayReasonStatus}
            onChange={(value) => setDelayReasonStatus(value)}
            options={[
              { value: '1', label: 'Activo' },
              { value: '0', label: 'Inactivo' },
            ]}
          />
        </div>

        <hr />

        <div className='commercial-order-delay-filter'>
          <label className='form-label mb-0'>Filtrar :</label>
          <input className='form-control form-control-sm' value={delayReasonFilter} onChange={(e) => setDelayReasonFilter(e.target.value)} />
        </div>

        <div className='table-responsive commercial-order-delay-table'>
          <table className='table table-sm table-bordered table-striped align-middle mb-0'>
            <thead>
              <tr>
                <th className='text-center'>Acciones</th>
                <th className='text-center'>Estado</th>
                <th>Motivo</th>
                <th>Fecha registro</th>
                <th>Usuario registro</th>
              </tr>
            </thead>
            <tbody>
              {delayReasonsLoading && (
                <tr>
                  <td colSpan='5' className='text-center text-muted py-3'>Cargando motivos...</td>
                </tr>
              )}
              {!delayReasonsLoading && filteredDelayReasons.length === 0 && (
                <tr>
                  <td colSpan='5' className='text-center text-muted py-3'>No existen elementos</td>
                </tr>
              )}
              {!delayReasonsLoading && filteredDelayReasons.map(reason => (
                <tr key={`delivery-delay-reason-${reason.id}`}>
                  <td className='text-center'>
                    <button
                      type='button'
                      className='btn btn-xs btn-outline-info'
                      title='Editar motivo de retraso'
                      onClick={() => editDelayReason(reason)}
                    >
                      <i className='mdi mdi-pencil'></i>
                    </button>
                  </td>
                  <td className='text-center'>
                    <span className={statusBadgeClass(reason.status ? 'billed' : 'cancelled')}>
                      {reason.status ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{reason.description}</td>
                  <td>{formatDelayReasonDate(reason.created_at)}</td>
                  <td>{formatUserRegistry(reason.creator)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='commercial-order-delay-summary'>
          {filteredDelayReasons.length} elementos (Pagina 1 de 1)
        </div>
      </div>
    </Modal>

    <Modal modalRef={trackingModalRef} title='Tracking del pedido' size='lg' hideButtonSubmit>
      <div className='table-responsive'>
        <table className='table table-sm align-middle mb-0'>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {trackingRows.length === 0 && (
              <tr>
                <td colSpan='2' className='text-muted text-center py-3'>Sin eventos registrados.</td>
              </tr>
            )}
            {trackingRows.map((row, index) => (
              <tr key={`commercial-order-tracking-${index}`}>
                <td>{new Date(row.date).toLocaleString('es-PE')}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>

    <Modal modalRef={evidenceModalRef} title='Evidencia de entrega' size='lg' btnSubmitText='Registrar' onSubmit={saveEvidence}>
      <div className='row'>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Recibido por</label>
          <input className='form-control' value={evidenceForm.recipient_name} onChange={(e) => onEvidenceFieldChange('recipient_name', e.target.value)} />
        </div>
        <VdSelect
          col='col-md-3 mb-3'
          label='Tipo doc.'
          value={evidenceForm.recipient_document_type}
          onChange={(value) => onEvidenceFieldChange('recipient_document_type', value)}
          options={[
            { value: 'DNI', label: 'DNI' },
            { value: 'RUC', label: 'RUC' },
            { value: 'CE', label: 'CE' },
            { value: 'OTRO', label: 'Otro' },
          ]}
        />
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Numero</label>
          <input className='form-control' value={evidenceForm.recipient_document_number} onChange={(e) => onEvidenceFieldChange('recipient_document_number', e.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Telefono</label>
          <input className='form-control' value={evidenceForm.recipient_phone} onChange={(e) => onEvidenceFieldChange('recipient_phone', e.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Fecha y hora entrega</label>
          <input type='datetime-local' className='form-control' value={evidenceForm.delivered_at} onChange={(e) => onEvidenceFieldChange('delivered_at', e.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Foto / evidencia</label>
          <input ref={evidenceFileRef} className='form-control' type='file' accept='image/png,image/jpeg,image/webp,image/gif' onChange={onEvidenceFileChange} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Latitud</label>
          <input className='form-control' value={evidenceForm.latitude} onChange={(e) => onEvidenceFieldChange('latitude', e.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Longitud</label>
          <input className='form-control' value={evidenceForm.longitude} onChange={(e) => onEvidenceFieldChange('longitude', e.target.value)} />
        </div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Observaciones</label>
          <textarea className='form-control' rows='3' value={evidenceForm.evidence_notes} onChange={(e) => onEvidenceFieldChange('evidence_notes', e.target.value)} />
        </div>
        <div className='col-12'>
          <div className='border rounded p-3'>
            {evidencePreview ? (
              <img
                src={evidencePreview}
                alt='Evidencia de entrega'
                className='img-fluid rounded border bg-light'
                style={{ maxHeight: 360, width: '100%', objectFit: 'contain' }}
              />
            ) : evidenceForm.evidence_url ? (
              <a href={evidenceForm.evidence_url} target='_blank' rel='noreferrer'>Abrir evidencia registrada</a>
            ) : (
              <div className='text-muted py-4 text-center'>Sin evidencia registrada</div>
            )}
          </div>
        </div>
      </div>
    </Modal>

    <Modal modalRef={creditNoteModalRef} title='Crear nota de credito' size='md' btnSubmitText='Generar nota de credito' onSubmit={onCreateCreditNoteSubmit}>
      <div className='row'>
        <VdSelect
          col='col-12'
          label='Comprobante a anular (Factura / Boleta)'
          required
          value={creditNoteDocId}
          onChange={(v) => setCreditNoteDocId(v)}
          loadOptions={(q) => fetchPaginateOptions('/api/admin/billing-documents/paginate', 'sequence', creditNoteBaseFilter, q, (x) => ({ value: `${x.id}`, label: billingDocOptionLabel(x) }))}
          placeholder='-- Seleccionar comprobante --'
        />
        <TextareaFormGroup eRef={creditNoteReasonRef} label='Motivo de la anulacion' col='col-12' rows={3} required />
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('orders') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.pageTitle || 'Pedidos comerciales'}>
    <CommercialOrders {...properties} />
  </BaseAdminto>);
})
