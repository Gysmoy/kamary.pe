import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '../Components/Adminto/VdTable';
import VdSelect from '../Components/Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
import Swal from 'sweetalert2';
import SampleOrdersRest from '../Actions/Admin/SampleOrdersRest';
import Global from '../Utils/Global';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import { getUbigeoCatalog } from '../Utils/ubigeoInei';
import { Autocomplete, GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const sampleOrdersRest = new SampleOrdersRest()

// Referencia estable para evitar recargas del script de Google Maps
const SAMPLE_MAP_LIBRARIES = ['places']
// Centro por defecto (Lima) cuando el pedido aun no tiene coordenadas
const DEFAULT_MAP_CENTER = { lat: -12.046374, lng: -77.042793 }

const orderStatusOptions = [
  { value: 'registered', label: 'Registrado', className: 'bg-warning-subtle text-warning border border-warning' },
  { value: 'approved', label: 'Aprobado', className: 'bg-success-subtle text-success border border-success' },
  { value: 'preparing', label: 'En preparacion', className: 'bg-warning-subtle text-warning border border-warning' },
  { value: 'in_route', label: 'En ruta', className: 'bg-info-subtle text-info border border-info' },
  { value: 'delivered', label: 'Entregado', className: 'bg-success-subtle text-success border border-success' },
  { value: 'cancelled', label: 'Anulado', className: 'bg-danger-subtle text-danger border border-danger' },
]

const emailStatusOptions = [
  { value: 'pending', label: 'Pendiente', className: 'bg-warning-subtle text-warning border border-warning' },
  { value: 'delivered', label: 'Entregado', className: 'bg-success-subtle text-success border border-success' },
  { value: 'failed', label: 'Fallido', className: 'bg-danger-subtle text-danger border border-danger' },
]

const activeStatusOptions = [
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' },
]

// Motivos de retraso: mismas claves que App\Support\SampleDelayReasons en el backend.
const delayReasonOptions = [
  { value: 'customs', label: 'Demora en aduana' },
  { value: 'traffic', label: 'Trafico vehicular' },
  { value: 'logistics', label: 'Fallas logisticas' },
  { value: 'stock', label: 'Falta de stock' },
  { value: 'client', label: 'Cliente no disponible' },
  { value: 'documentation', label: 'Documentacion incompleta' },
  { value: 'other', label: 'Otro motivo' },
]


const today = () => new Date().toISOString().slice(0, 10)

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  stock_key: '',
  article_id: '',
  warehouse_id: '',
  code: '',
  lot_code: '',
  name: '',
  unit: '',
  stock: 0,
  unit_weight: 0,
  quantity: 1,
  warehouse: '',
  expiration_date: '',
  laboratory: '',
  active_principle: '',
})

const emptyForm = () => ({
  id: '',
  order_number: '',
  order_status: 'registered',
  email_status: 'delivered',
  referral_guide: '',
  total_gross_weight: '',
  requested_at: today(),
  request_reason: '',
  request_reason_id: '',
  supervisor_id: '',
  supervisor_name: '',
  client_id: '',
  client_name: '',
  sales_channel: '',
  sales_subchannel: '',
  sales_channel_id: '',
  sales_subchannel_id: '',
  business_line: '',
  business_subline: '',
  giro_id: '',
  sub_giro_id: '',
  ubigeo: '',
  delivery_address: '',
  delivery_reference: '',
  service_type: '',
  service_type_id: '',
  delivered_at: today(),
  delay_reason: '',
  delay_reason_notes: '',
  document_type: 'RUC',
  document_number: '',
  contact_document: '',
  contact_name: '',
  contact_phone: '',
  observations: '',
  map_lat: '',
  map_lng: '',
  evidence_url: '',
  evidence_notes: '',
})

const normalizeText = (value) => (value ?? '').toString().trim()
const normalizeSearchText = (value) => normalizeText(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

// Palabras que Google agrega a los nombres administrativos pero el catalogo INEI no.
// Se quitan de ambos lados para emparejar departamento/provincia/distrito.
const UBIGEO_STOPWORDS = new Set(['region', 'provincia', 'departamento', 'distrito', 'province', 'district', 'department', 'de', 'del'])
const normalizeUbigeoName = (value) => normalizeSearchText(value)
  .split(' ')
  .filter(word => word && !UBIGEO_STOPWORDS.has(word))
  .join(' ')
const normalizeOrderStatus = (value) => ({ processing: 'preparing', completed: 'delivered' }[value] ?? value)
const normalizeEmailStatus = (value) => ({ sent: 'delivered' }[value] ?? value)
const getStatusOption = (options, value, normalizer = value => value) => options.find(option => option.value === normalizer(value)) ?? options[0]
const asDateText = (value) => normalizeText(value).slice(0, 10)
const asDateTimeText = (value) => normalizeText(value).replace('T', ' ').slice(0, 19)
const formatNumber = (value, digits = 2) => Number(value || 0).toFixed(digits)
const delayReasonLabel = (value) => delayReasonOptions.find(option => option.value === value)?.label ?? ''
// Diferencia en dias entre la entrega y la fecha solicitada: positiva = se entrego tarde.
const deliveryDiffDays = (row) => {
  const requested = asDateText(row.requested_at)
  const delivered = asDateText(row.delivered_at)
  if (!requested || !delivered) return null
  const diff = (new Date(`${delivered}T00:00:00`) - new Date(`${requested}T00:00:00`)) / 86400000
  return Number.isFinite(diff) ? Math.round(diff) : null
}
const deliveryDiffText = (row) => {
  const diff = deliveryDiffDays(row)
  if (diff === null) return '-'
  if (diff === 0) return 'A tiempo'
  const abs = Math.abs(diff)
  return `${diff > 0 ? '+' : '-'}${abs} ${abs === 1 ? 'dia' : 'dias'}`
}
const isEvidenceImage = (value) => {
  const url = normalizeText(value)
  return url.startsWith('blob:')
    || url.startsWith('data:image/')
    || /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(url)
    || url.includes('/sample-orders/evidence-media/')
}

const makeSelectOptions = (rows, formatter, valueResolver = row => row.id) => rows.map(row => ({
  value: `${valueResolver(row)}`,
  label: formatter(row),
  row,
}))

const flattenUbigeoOptions = (catalog) => {
  const rows = []
  catalog?.recordByCode?.forEach?.((item) => {
    const label = [item.department, item.province, item.district].filter(Boolean).join(' | ')
    if (!item.code || !label) return
    rows.push({ value: item.code, label })
  })

  return rows.sort((left, right) => left.label.localeCompare(right.label, 'es'))
}

const formatClient = (client) => {
  const document = normalizeText(client.document_number ?? client.ruc ?? client.doc_cliente ?? client.document)
  const name = normalizeText(client.display_name ?? client.full_name ?? client.name ?? client.razon_social ?? client.business_name ?? client.client_name)
  return [document, name].filter(Boolean).join(' - ') || `Cliente ${client.id}`
}

const formatUser = (user) => {
  const full = normalizeText(user.fullname)
  if (full) return full
  const name = `${normalizeText(user.name)} ${normalizeText(user.lastname)}`.trim()
  return name || normalizeText(user.username) || `Usuario ${user.id}`
}

const articleToItem = (article) => {
  const firstLot = article.storage_lots?.[0] ?? article.storageLots?.[0] ?? {}
  const warehouse = article.warehouse_name ?? article.warehouse?.name ?? firstLot.warehouse?.name ?? ''
  return {
    uid: crypto.randomUUID(),
    stock_key: article.stock_key ?? '',
    article_id: article.article_id ?? article.id ?? '',
    warehouse_id: article.warehouse_id ?? article.warehouse?.id ?? firstLot.warehouse?.id ?? '',
    code: article.code ?? '',
    lot_code: article.default_lot ?? article.lot ?? firstLot.lot ?? '',
    name: article.name ?? '',
    unit: article.unit?.symbol ?? article.unit?.name ?? '',
    stock: Number(article.stock ?? article.stock_available ?? article.stock_min ?? 0),
    unit_weight: Number(article.unit_weight ?? 0),
    quantity: 1,
    warehouse,
    expiration_date: asDateText(article.default_expiration_date ?? article.expiration_date ?? firstLot.expiration_date),
    laboratory: article.laboratory?.name ?? '',
    active_principle: article.activePrinciple?.name ?? article.active_principle?.name ?? '',
  }
}

const articleSearchValues = (article) => [
  article.code,
  article.default_lot,
  article.lot,
  article.stock_key,
  article.name,
  article.warehouse_name,
  article.warehouse?.name,
  article.category,
  article.category?.name,
  article.category?.description,
  article.sub_category,
  article.magistralCategory?.description,
  article.magistralCategory?.code,
  article.magistralFormat?.description,
  article.article_type,
  article.unit?.name,
  article.unit?.symbol,
  article.laboratory?.name,
  article.activePrinciple?.name,
  article.active_principle?.name,
].map(normalizeSearchText).filter(Boolean)

const articleSearchScore = (article, terms) => {
  if (terms.length === 0) return 0

  const primaryValues = [
    article.code,
    article.default_lot,
    article.name,
  ].map(normalizeSearchText).filter(Boolean)
  const allValues = articleSearchValues(article)

  if (primaryValues.some(value => terms.every(term => value === term))) return 0
  if (primaryValues.some(value => terms.every(term => value.startsWith(term)))) return 1
  if (terms.every(term => primaryValues.some(value => value.includes(term)))) return 2
  if (terms.every(term => allValues.some(value => value.includes(term)))) return 3

  return 99
}

const articleItemKey = (item) => [
  item.stock_key,
  item.article_id || item.code || item.name,
  item.warehouse_id || item.warehouse,
  item.lot_code || item.name,
  item.expiration_date,
].map(normalizeText).join('|')

const sampleItems = (data) => Array.isArray(data?.items) ? data.items : []
const sampleProducts = (data) => sampleItems(data)
  .map(item => [item?.code, item?.name].filter(Boolean).join(' - '))
  .filter(Boolean)
  .join(', ')
const sampleQuantity = (data) => sampleItems(data)
  .reduce((sum, item) => sum + Number(item?.quantity || 0), 0)
const sampleUnitWeight = (data) => {
  const values = [...new Set(sampleItems(data)
    .map(item => Number(item?.unit_weight || 0))
    .filter(value => value > 0)
    .map(value => formatNumber(value, 3)))]

  return values.join(', ')
}
const sampleGrossWeight = (data) => {
  const stored = Number(data?.total_gross_weight || 0)
  if (stored > 0) return stored

  return sampleItems(data)
    .reduce((sum, item) => sum + (Number(item?.quantity || 0) * Number(item?.unit_weight || 0)), 0)
}
// Pedido completo solo si hay items y el stock alcanza la cantidad pedida en cada uno
const isOrderComplete = (data) => {
  const list = sampleItems(data)
  return list.length > 0 && list.every(item => Number(item?.quantity || 0) > 0 && Number(item?.stock || 0) >= Number(item?.quantity || 0))
}

const statusBadge = (active) => active
  ? <span className='badge bg-success-subtle text-success border border-success'>Activo</span>
  : <span className='badge bg-danger-subtle text-danger border border-danger'>Inactivo</span>

// Lista reutilizable de un catalogo (motivo / giro / sub giro / supervisor) con filtro,
// paginado y acciones editar / eliminar
const CatalogList = ({ items, editingId, onEdit, onDelete, extraColumn, getLabel, labelHeader = 'Descripcion' }) => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const labelOf = (item) => (getLabel ? getLabel(item) : (item.name ?? ''))
  const term = search.trim().toLowerCase()
  const filtered = term
    ? items.filter(item => [labelOf(item), extraColumn ? extraColumn.value(item) : '', item.status ? 'activo' : 'inactivo'].join(' ').toLowerCase().includes(term))
    : items

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)
  const colSpan = extraColumn ? 4 : 3

  return (
    <div className='mt-3'>
      <div className='d-flex flex-wrap justify-content-between align-items-center mb-1 gap-2'>
        <div className='fw-bold' style={{ fontSize: 13 }}>Registrados</div>
        <div className='d-flex align-items-center gap-2'>
          <div style={{ width: 76 }}>
            <VdSelect
              noMargin
              value={`${pageSize}`}
              onChange={value => { setPageSize(Number(value)); setPage(1) }}
              options={[{ value: '5', label: '5' }, { value: '10', label: '10' }, { value: '25', label: '25' }]}
            />
          </div>
          <input className='form-control form-control-sm' style={{ width: 170 }} placeholder='Filtrar...' value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>
      <table className='table table-sm table-bordered align-middle mb-2' style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ width: 86 }}>Acciones</th>
            <th style={{ width: 84 }}>Estado</th>
            {extraColumn && <th>{extraColumn.header}</th>}
            <th>{labelHeader}</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.length === 0 && <tr><td colSpan={colSpan} className='text-center text-muted py-2'>Sin registros</td></tr>}
          {pageItems.map(item => (
            <tr key={item.id} className={`${editingId}` === `${item.id}` ? 'table-warning' : ''}>
              <td>
                <button type='button' className='btn btn-xs btn-outline-warning me-1' title='Editar' onClick={() => onEdit(item)}><i className='mdi mdi-pencil'></i></button>
                <button type='button' className='btn btn-xs btn-outline-danger' title='Eliminar' onClick={() => onDelete(item)}><i className='mdi mdi-delete'></i></button>
              </td>
              <td>{statusBadge(item.status)}</td>
              {extraColumn && <td>{extraColumn.value(item)}</td>}
              <td>{labelOf(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='d-flex flex-wrap justify-content-between align-items-center'>
        <small className='text-muted'>{filtered.length} registro(s) &middot; Pagina {currentPage} de {totalPages}</small>
        <div className='btn-group btn-group-sm'>
          <button type='button' className='btn btn-outline-secondary' disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</button>
          <button type='button' className='btn btn-outline-secondary' disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Siguiente</button>
        </div>
      </div>
    </div>
  )
}

const SampleSelect = ({ label, value, options = [], onChange, placeholder = 'Seleccione', addButton = false, onAdd, disabled = false }) => (
  <div className='sample-field'>
    <label className='form-label'>{label}</label>
    <div className='sample-input-group'>
      <VdSelect
        noMargin
        style={{ flex: 1 }}
        value={value ?? ''}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
      />
      {addButton && <button type='button' className='btn btn-outline-success sample-plus' onClick={onAdd ?? (() => Swal.fire('Dato adicional', 'Puedes escribir o seleccionar el valor requerido para este pedido.', 'info'))}>+</button>}
    </div>
  </div>
)

const SampleInput = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false, addButton = false, onAdd }) => (
  <div className='sample-field'>
    <label className='form-label'>{label}</label>
    <div className='sample-input-group'>
      <input className='form-control' type={type} value={value ?? ''} placeholder={placeholder} disabled={disabled} onChange={e => onChange(e.target.value)} />
      {addButton && <button type='button' className='btn btn-outline-success sample-plus' onClick={onAdd ?? (() => Swal.fire('Dato adicional', 'Puedes completar este campo manualmente.', 'info'))}>+</button>}
    </div>
  </div>
)

// Pide motivo y detalle del retraso antes de dar el pedido por entregado.
const askDelayReason = async (data, requestedAt) => {
  const { isConfirmed, value } = await Swal.fire({
    title: 'Motivo del retraso',
    html: `
      <p class="text-start mb-2">La entrega sale despues de la fecha solicitada (${requestedAt}).</p>
      <select id="sample-delay-reason" class="form-select mb-2">
        ${delayReasonOptions.map(option => `<option value="${option.value}">${option.label}</option>`).join('')}
      </select>
      <textarea id="sample-delay-notes" class="form-control" rows="2" placeholder="Detalle del retraso (opcional)"></textarea>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Registrar entrega',
    cancelButtonText: 'Cancelar',
    preConfirm: () => ({
      delay_reason: document.getElementById('sample-delay-reason')?.value ?? '',
      delay_reason_notes: document.getElementById('sample-delay-notes')?.value ?? '',
    }),
  })

  return isConfirmed ? value : null
}

const SampleOrders = ({ moduleTitle = 'Muestras - Pedido' }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const articleModalRef = useRef()
  const trackingModalRef = useRef()
  const evidenceModalRef = useRef()
  const evidenceFileRef = useRef()

  const giroModalRef = useRef()
  const subGiroModalRef = useRef()
  const reasonModalRef = useRef()
  const supervisorModalRef = useRef()
  const clientModalRef = useRef()
  const channelModalRef = useRef()
  const subchannelModalRef = useRef()
  const serviceTypeModalRef = useRef()

  const [form, setForm] = useState(emptyForm())
  const [items, setItems] = useState([])
  const [clients, setClients] = useState([])
  const [users, setUsers] = useState([])
  const [articles, setArticles] = useState([])
  const [giros, setGiros] = useState([])
  const [subGiros, setSubGiros] = useState([])
  const [requestReasons, setRequestReasons] = useState([])
  const [salesChannels, setSalesChannels] = useState([])
  const [salesSubchannels, setSalesSubchannels] = useState([])
  const [serviceTypes, setServiceTypes] = useState([])
  const [giroForm, setGiroForm] = useState({ id: '', name: '', status: '1' })
  const [subGiroForm, setSubGiroForm] = useState({ id: '', giro_id: '', name: '', status: '1' })
  const [reasonForm, setReasonForm] = useState({ id: '', name: '', status: '1' })
  const [channelForm, setChannelForm] = useState({ id: '', name: '', status: '1' })
  const [subchannelForm, setSubchannelForm] = useState({ id: '', sales_channel_id: '', name: '', status: '1' })
  const [serviceTypeForm, setServiceTypeForm] = useState({ id: '', name: '', status: '1' })
  const [supervisorForm, setSupervisorForm] = useState({ id: '', document_number: '', name: '', lastname_p: '', lastname_m: '', phone: '', status: '1' })
  const [clientForm, setClientForm] = useState({ document_type: '', document_number: '', full_name: '', email: '', phone: '', short_code: '', status: '1', full_address: '' })
  const [ubigeoOptions, setUbigeoOptions] = useState([])
  const [articleQuery, setArticleQuery] = useState('')
  const [articlePageSize, setArticlePageSize] = useState(10)
  const [articlePage, setArticlePage] = useState(1)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [evidenceOrder, setEvidenceOrder] = useState(null)
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [evidencePreview, setEvidencePreview] = useState('')
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapPoint, setMapPoint] = useState(DEFAULT_MAP_CENTER)
  const [hasMarker, setHasMarker] = useState(false)
  const addressAutocompleteRef = useRef(null)
  const geocoderRef = useRef(null)

  useEffect(() => {
    Promise.all([
      sampleOrdersRest.getClients(),
      sampleOrdersRest.getUsers(),
      sampleOrdersRest.getArticles(),
      sampleOrdersRest.getGiros(),
      sampleOrdersRest.getSubGiros(),
      sampleOrdersRest.getRequestReasons(),
      sampleOrdersRest.getSalesChannels(),
      sampleOrdersRest.getSalesSubchannels(),
      sampleOrdersRest.getServiceTypes(),
    ]).then(([clientRows, userRows, articleRows, giroRows, subGiroRows, reasonRows, channelRows, subchannelRows, serviceTypeRows]) => {
      setClients((clientRows ?? []).filter(row => row.status !== null))
      // El modelo User oculta 'id' y lo expone como 'entity_id'; lo normalizamos a id
      setUsers((userRows ?? []).filter(row => row.status !== null).map(row => ({ ...row, id: row.entity_id ?? row.id })))
      setArticles((articleRows ?? []).filter(row => row.status !== null))
      setGiros((giroRows ?? []).filter(row => row.status !== null))
      setSubGiros((subGiroRows ?? []).filter(row => row.status !== null))
      setRequestReasons((reasonRows ?? []).filter(row => row.status !== null))
      setSalesChannels((channelRows ?? []).filter(row => row.status !== null))
      setSalesSubchannels((subchannelRows ?? []).filter(row => row.status !== null))
      setServiceTypes((serviceTypeRows ?? []).filter(row => row.status !== null))
    })

    getUbigeoCatalog()
      .then(catalog => setUbigeoOptions(flattenUbigeoOptions(catalog)))
      .catch(() => setUbigeoOptions([]))
  }, [])

  useEffect(() => {
    return () => {
      if (evidencePreview?.startsWith('blob:')) URL.revokeObjectURL(evidencePreview)
    }
  }, [evidencePreview])

  const clientOptions = useMemo(() => makeSelectOptions(clients, formatClient, row => row.entity_id ?? row.id), [clients])
  const userOptions = useMemo(() => makeSelectOptions(users, formatUser), [users])
  // Para gestionar supervisores excluimos a los administradores (Admin/Root) por seguridad
  const supervisorListItems = useMemo(() => users.filter(row => !(row.roles ?? []).some(role => ['Admin', 'Root'].includes(role.name))), [users])
  const reasonOptions = useMemo(() => requestReasons.filter(row => row.status).map(row => ({ value: `${row.id}`, label: row.name })), [requestReasons])
  const serviceTypeOptions = useMemo(() => serviceTypes.filter(row => row.status).map(row => ({ value: `${row.id}`, label: row.name })), [serviceTypes])
  const channelOptions = useMemo(() => salesChannels.filter(row => row.status).map(row => ({ value: `${row.id}`, label: row.name })), [salesChannels])
  const subchannelOptions = useMemo(() => salesSubchannels
    .filter(row => row.status && form.sales_channel_id && `${row.sales_channel_id}` === `${form.sales_channel_id}`)
    .map(row => ({ value: `${row.id}`, label: row.name })), [salesSubchannels, form.sales_channel_id])
  const giroOptions = useMemo(() => giros.filter(row => row.status).map(row => ({ value: `${row.id}`, label: row.name })), [giros])
  const subGiroOptions = useMemo(() => subGiros
    .filter(row => row.status && form.giro_id && `${row.giro_id}` === `${form.giro_id}`)
    .map(row => ({ value: `${row.id}`, label: row.name })), [subGiros, form.giro_id])
  const articleMatches = useMemo(() => {
    const terms = normalizeSearchText(articleQuery).split(' ').filter(Boolean)
    return terms.length
      ? articles
        .map(article => ({ article, score: articleSearchScore(article, terms) }))
        .filter(row => row.score < 99)
        .sort((left, right) => left.score - right.score || normalizeText(left.article.name).localeCompare(normalizeText(right.article.name), 'es'))
        .map(row => row.article)
      : articles
  }, [articles, articleQuery])

  const articleTotalPages = Math.max(1, Math.ceil(articleMatches.length / articlePageSize))
  const articleCurrentPage = Math.min(articlePage, articleTotalPages)
  const articleStart = (articleCurrentPage - 1) * articlePageSize
  const articleRows = articleMatches.slice(articleStart, articleStart + articlePageSize)

  const itemTotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [items])
  const computedGrossWeight = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_weight || 0)), 0),
    [items]
  )
  const selectedArticleKeys = useMemo(() => new Set(
    items
      .filter(item => normalizeText(item.article_id) || normalizeText(item.code) || normalizeText(item.name))
      .map(articleItemKey)
  ), [items])
  const selectedUbigeoOptions = useMemo(() => {
    if (!form.ubigeo || ubigeoOptions.some(option => option.value === form.ubigeo)) return ubigeoOptions
    return [{ value: form.ubigeo, label: form.ubigeo }, ...ubigeoOptions]
  }, [form.ubigeo, ubigeoOptions])
  // Indices para resolver el codigo de ubigeo desde los nombres de Google.
  // exact: departamento|provincia|distrito ; byDeptDistrict: departamento|distrito (respaldo)
  const ubigeoIndex = useMemo(() => {
    const exact = new Map()
    const byDeptDistrict = new Map()
    for (const option of ubigeoOptions) {
      const parts = `${option.label ?? ''}`.split(' | ')
      if (parts.length < 3) continue
      const nd = normalizeUbigeoName(parts[0])
      const np = normalizeUbigeoName(parts[1])
      const nx = normalizeUbigeoName(parts[2])
      if (!nd || !nx) continue
      exact.set(`${nd}|${np}|${nx}`, option.value)
      const ddKey = `${nd}|${nx}`
      if (!byDeptDistrict.has(ddKey)) byDeptDistrict.set(ddKey, option.value)
    }
    return { exact, byDeptDistrict }
  }, [ubigeoOptions])
  const googleMapsApiKey = `${Global.GMAPS_API_KEY ?? ''}`.trim()

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  // Fija el punto en el mapa y guarda las coordenadas en el formulario.
  const setMapLocation = (lat, lng, { reverse = false } = {}) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const point = { lat, lng }
    setMapPoint(point)
    setHasMarker(true)
    setForm(prev => ({ ...prev, map_lat: lat, map_lng: lng }))
    if (reverse) reverseGeocode(point)
  }

  // Convierte coordenadas en direccion legible y la coloca en "Direccion de entrega".
  const reverseGeocode = (point) => {
    if (!window.google?.maps) return
    if (!geocoderRef.current) geocoderRef.current = new window.google.maps.Geocoder()
    geocoderRef.current.geocode({ location: point }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const formatted = `${results[0].formatted_address ?? ''}`.trim()
        if (formatted) setField('delivery_address', formatted)
        resolveUbigeoFromComponents(results[0].address_components)
      }
    })
  }

  // Mapea los componentes de direccion de Google al codigo de ubigeo INEI.
  const resolveUbigeoFromComponents = (components) => {
    if (!Array.isArray(components) || !components.length) return
    const pick = (type) => components.find(item => (item.types ?? []).includes(type))?.long_name ?? ''
    const department = pick('administrative_area_level_1')
    const province = pick('administrative_area_level_2')
    const district = pick('administrative_area_level_3') || pick('locality') || pick('sublocality_level_1') || pick('sublocality')
    if (!department || !district) return

    const nd = normalizeUbigeoName(department)
    const np = normalizeUbigeoName(province)
    const nx = normalizeUbigeoName(district)
    const code = ubigeoIndex.exact.get(`${nd}|${np}|${nx}`)
      ?? ubigeoIndex.exact.get(`${nd}|${nd}|${nx}`) // Lima y Callao: provincia = departamento
      ?? ubigeoIndex.byDeptDistrict.get(`${nd}|${nx}`)
    if (code) setField('ubigeo', code)
  }

  // Cuando el usuario elige un lugar del autocompletado de Google Places.
  const onAddressPlaceChanged = () => {
    const place = addressAutocompleteRef.current?.getPlace?.()
    if (!place) return
    const formatted = `${place.formatted_address ?? place.name ?? ''}`.trim()
    if (formatted) setField('delivery_address', formatted)
    resolveUbigeoFromComponents(place.address_components)
    const location = place.geometry?.location
    if (location) setMapLocation(location.lat(), location.lng())
  }

  const onMapClick = (event) => setMapLocation(event?.latLng?.lat?.(), event?.latLng?.lng?.(), { reverse: true })
  const onMarkerDragEnd = (event) => setMapLocation(event?.latLng?.lat?.(), event?.latLng?.lng?.(), { reverse: true })

  const clearMapLocation = () => {
    setHasMarker(false)
    setForm(prev => ({ ...prev, map_lat: '', map_lng: '' }))
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire('Ubicacion', 'Tu navegador no permite geolocalizacion.', 'info')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => setMapLocation(pos.coords.latitude, pos.coords.longitude, { reverse: true }),
      () => Swal.fire('Ubicacion', 'No se pudo obtener tu ubicacion. Revisa los permisos del navegador.', 'warning')
    )
  }
  const closeMainModal = () => $(modalRef.current).modal('hide')
  const refreshGrid = () => tableRef.current?.refresh()

  const onClientSelect = (clientId) => {
    const selected = clients.find(row => `${row.entity_id ?? row.id}` === `${clientId}`)
    const documentNumber = selected?.document_number ?? selected?.ruc ?? selected?.doc_cliente ?? ''
    const clientName = selected
      ? normalizeText(selected.display_name ?? selected.full_name ?? selected.business_name ?? selected.name ?? formatClient(selected))
      : ''
    setForm(prev => ({
      ...prev,
      client_id: clientId,
      client_name: clientName,
      document_number: documentNumber || prev.document_number,
      contact_document: documentNumber || prev.contact_document,
      contact_name: selected?.primary_contact ?? selected?.full_name ?? prev.contact_name,
      contact_phone: selected?.primary_contact_phone ?? selected?.phone ?? prev.contact_phone,
      ubigeo: selected?.ubigeo ?? prev.ubigeo,
      delivery_address: selected?.full_address ?? selected?.fiscal_address ?? prev.delivery_address,
    }))
  }

  const openClientModal = () => {
    setClientForm({ document_type: '', document_number: '', full_name: '', email: '', phone: '', short_code: '', status: '1', full_address: '' })
    $(clientModalRef.current).modal('show')
  }

  const onSaveClient = async (e) => {
    e.preventDefault()
    if (!clientForm.document_type) {
      Swal.fire({ icon: 'warning', title: 'Falta tipo de documento', text: 'Selecciona el tipo de documento.', confirmButtonText: 'Entendido' })
      return
    }
    const payload = {
      document_type: clientForm.document_type,
      document_number: (clientForm.document_number ?? '').trim(),
      full_name: (clientForm.full_name ?? '').trim(),
      email: (clientForm.email ?? '').trim() || null,
      phone: (clientForm.phone ?? '').trim() || null,
      short_code: (clientForm.short_code ?? '').trim() || null,
      full_address: (clientForm.full_address ?? '').trim() || null,
      status: clientForm.status === '1',
      client_kind: 'regular',
    }
    const result = await sampleOrdersRest.saveClient(payload)
    if (!result) return
    const saved = result?.data ?? result
    if (saved?.id) {
      const normalized = { ...saved, entity_id: saved.entity_id ?? saved.id }
      setClients(prev => [normalized, ...prev])
      setForm(prev => ({
        ...prev,
        client_id: `${normalized.entity_id}`,
        client_name: normalizeText(saved.full_name),
        document_number: saved.document_number ?? prev.document_number,
        contact_document: saved.document_number ?? prev.contact_document,
        contact_phone: saved.phone ?? prev.contact_phone,
        delivery_address: saved.full_address ?? prev.delivery_address,
      }))
    }
    $(clientModalRef.current).modal('hide')
  }

  const onSupervisorSelect = (userId) => {
    const selected = users.find(row => `${row.id}` === `${userId}`)
    setForm(prev => ({
      ...prev,
      supervisor_id: userId,
      supervisor_name: selected ? formatUser(selected) : '',
    }))
  }

  // Inserta o reemplaza un registro en el listado de un catalogo
  const upsertRow = (setter, saved) => setter(prev => {
    const exists = prev.some(row => `${row.id}` === `${saved.id}`)
    return exists ? prev.map(row => `${row.id}` === `${saved.id}` ? saved : row) : [saved, ...prev]
  })

  // ----- Motivo del pedido -----
  const onReasonSelect = (reasonId) => {
    const selected = requestReasons.find(row => `${row.id}` === `${reasonId}`)
    setForm(prev => ({ ...prev, request_reason_id: reasonId, request_reason: selected?.name ?? '' }))
  }

  const openReasonModal = () => {
    setReasonForm({ id: '', name: '', status: '1' })
    $(reasonModalRef.current).modal('show')
  }

  const editReason = (item) => setReasonForm({ id: `${item.id}`, name: item.name ?? '', status: item.status ? '1' : '0' })

  const onSaveReason = async (e) => {
    e.preventDefault()
    const name = (reasonForm.name ?? '').trim()
    if (!name) return
    const payload = { name, status: reasonForm.status === '1' }
    if (reasonForm.id) payload.id = reasonForm.id
    const result = await sampleOrdersRest.saveRequestReason(payload)
    if (!result) return
    const saved = result?.data ?? result
    if (saved?.id) {
      upsertRow(setRequestReasons, saved)
      if (!reasonForm.id && saved.status) setForm(prev => ({ ...prev, request_reason_id: `${saved.id}`, request_reason: saved.name ?? name }))
      else setForm(prev => `${prev.request_reason_id}` === `${saved.id}` ? { ...prev, request_reason: saved.name ?? name } : prev)
    }
    setReasonForm({ id: '', name: '', status: '1' })
  }

  const onDeleteReason = async (item) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar motivo', text: `Se eliminara "${item.name}".`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    if (!await sampleOrdersRest.deleteRequestReason(item.id)) return
    setRequestReasons(prev => prev.filter(row => `${row.id}` !== `${item.id}`))
    setForm(prev => `${prev.request_reason_id}` === `${item.id}` ? { ...prev, request_reason_id: '', request_reason: '' } : prev)
    if (`${reasonForm.id}` === `${item.id}`) setReasonForm({ id: '', name: '', status: '1' })
  }

  // ----- Tipo servicio -----
  const onServiceTypeSelect = (serviceTypeId) => {
    const selected = serviceTypes.find(row => `${row.id}` === `${serviceTypeId}`)
    setForm(prev => ({ ...prev, service_type_id: serviceTypeId, service_type: selected?.name ?? '' }))
  }

  const openServiceTypeModal = () => {
    setServiceTypeForm({ id: '', name: '', status: '1' })
    $(serviceTypeModalRef.current).modal('show')
  }

  const editServiceType = (item) => setServiceTypeForm({ id: `${item.id}`, name: item.name ?? '', status: item.status ? '1' : '0' })

  const onSaveServiceType = async (e) => {
    e.preventDefault()
    const name = (serviceTypeForm.name ?? '').trim()
    if (!name) return
    const payload = { name, status: serviceTypeForm.status === '1' }
    if (serviceTypeForm.id) payload.id = serviceTypeForm.id
    const result = await sampleOrdersRest.saveServiceType(payload)
    if (!result) return
    const saved = result?.data ?? result
    if (saved?.id) {
      upsertRow(setServiceTypes, saved)
      if (!serviceTypeForm.id && saved.status) setForm(prev => ({ ...prev, service_type_id: `${saved.id}`, service_type: saved.name ?? name }))
      else setForm(prev => `${prev.service_type_id}` === `${saved.id}` ? { ...prev, service_type: saved.name ?? name } : prev)
    }
    setServiceTypeForm({ id: '', name: '', status: '1' })
  }

  const onDeleteServiceType = async (item) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar tipo de servicio', text: `Se eliminara "${item.name}".`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    if (!await sampleOrdersRest.deleteServiceType(item.id)) return
    setServiceTypes(prev => prev.filter(row => `${row.id}` !== `${item.id}`))
    setForm(prev => `${prev.service_type_id}` === `${item.id}` ? { ...prev, service_type_id: '', service_type: '' } : prev)
    if (`${serviceTypeForm.id}` === `${item.id}`) setServiceTypeForm({ id: '', name: '', status: '1' })
  }

  // ----- Canal de venta -----
  const onChannelSelect = (channelId) => {
    const selected = salesChannels.find(row => `${row.id}` === `${channelId}`)
    // Al cambiar de canal se limpia el sub canal porque depende del canal
    setForm(prev => ({ ...prev, sales_channel_id: channelId, sales_channel: selected?.name ?? '', sales_subchannel_id: '', sales_subchannel: '' }))
  }

  const openChannelModal = () => {
    setChannelForm({ id: '', name: '', status: '1' })
    $(channelModalRef.current).modal('show')
  }

  const editChannel = (item) => setChannelForm({ id: `${item.id}`, name: item.name ?? '', status: item.status ? '1' : '0' })

  const onSaveChannel = async (e) => {
    e.preventDefault()
    const name = (channelForm.name ?? '').trim()
    if (!name) return
    const payload = { name, status: channelForm.status === '1' }
    if (channelForm.id) payload.id = channelForm.id
    const result = await sampleOrdersRest.saveSalesChannel(payload)
    if (!result) return
    const saved = result?.data ?? result
    if (saved?.id) {
      upsertRow(setSalesChannels, saved)
      if (!channelForm.id && saved.status) setForm(prev => ({ ...prev, sales_channel_id: `${saved.id}`, sales_channel: saved.name ?? name, sales_subchannel_id: '', sales_subchannel: '' }))
      else setForm(prev => `${prev.sales_channel_id}` === `${saved.id}` ? { ...prev, sales_channel: saved.name ?? name } : prev)
    }
    setChannelForm({ id: '', name: '', status: '1' })
  }

  const onDeleteChannel = async (item) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar canal de venta', text: `Se eliminara "${item.name}" y sus sub canales quedaran sin canal.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    if (!await sampleOrdersRest.deleteSalesChannel(item.id)) return
    setSalesChannels(prev => prev.filter(row => `${row.id}` !== `${item.id}`))
    setForm(prev => `${prev.sales_channel_id}` === `${item.id}` ? { ...prev, sales_channel_id: '', sales_channel: '', sales_subchannel_id: '', sales_subchannel: '' } : prev)
    if (`${channelForm.id}` === `${item.id}`) setChannelForm({ id: '', name: '', status: '1' })
  }

  // ----- Sub canal de venta -----
  const onSubchannelSelect = (subchannelId) => {
    const selected = salesSubchannels.find(row => `${row.id}` === `${subchannelId}`)
    setForm(prev => ({ ...prev, sales_subchannel_id: subchannelId, sales_subchannel: selected?.name ?? '' }))
  }

  const openSubchannelModal = () => {
    setSubchannelForm({ id: '', sales_channel_id: form.sales_channel_id || '', name: '', status: '1' })
    $(subchannelModalRef.current).modal('show')
  }

  const editSubchannel = (item) => setSubchannelForm({ id: `${item.id}`, sales_channel_id: item.sales_channel_id ? `${item.sales_channel_id}` : '', name: item.name ?? '', status: item.status ? '1' : '0' })

  const onSaveSubchannel = async (e) => {
    e.preventDefault()
    const name = (subchannelForm.name ?? '').trim()
    const channelId = subchannelForm.sales_channel_id
    if (!channelId) {
      Swal.fire({ icon: 'warning', title: 'Falta canal de venta', text: 'Selecciona el canal de venta.', confirmButtonText: 'Entendido' })
      return
    }
    if (!name) return
    const payload = { sales_channel_id: channelId, name, status: subchannelForm.status === '1' }
    if (subchannelForm.id) payload.id = subchannelForm.id
    const result = await sampleOrdersRest.saveSalesSubchannel(payload)
    if (!result) return
    const saved = result?.data ?? result
    if (saved?.id) {
      upsertRow(setSalesSubchannels, saved)
      if (!subchannelForm.id && saved.status) {
        const channelName = salesChannels.find(row => `${row.id}` === `${channelId}`)?.name
        setForm(prev => ({ ...prev, sales_channel_id: `${channelId}`, sales_channel: channelName ?? prev.sales_channel, sales_subchannel_id: `${saved.id}`, sales_subchannel: saved.name ?? name }))
      } else {
        setForm(prev => `${prev.sales_subchannel_id}` === `${saved.id}` ? { ...prev, sales_subchannel: saved.name ?? name } : prev)
      }
    }
    setSubchannelForm({ id: '', sales_channel_id: form.sales_channel_id || '', name: '', status: '1' })
  }

  const onDeleteSubchannel = async (item) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar sub canal', text: `Se eliminara "${item.name}".`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    if (!await sampleOrdersRest.deleteSalesSubchannel(item.id)) return
    setSalesSubchannels(prev => prev.filter(row => `${row.id}` !== `${item.id}`))
    setForm(prev => `${prev.sales_subchannel_id}` === `${item.id}` ? { ...prev, sales_subchannel_id: '', sales_subchannel: '' } : prev)
    if (`${subchannelForm.id}` === `${item.id}`) setSubchannelForm({ id: '', sales_channel_id: form.sales_channel_id || '', name: '', status: '1' })
  }

  // ----- Giro -----
  const onGiroSelect = (giroId) => {
    const selected = giros.find(row => `${row.id}` === `${giroId}`)
    // Al cambiar de giro se limpia el sub giro porque depende del giro
    setForm(prev => ({ ...prev, giro_id: giroId, business_line: selected?.name ?? '', sub_giro_id: '', business_subline: '' }))
  }

  const openGiroModal = () => {
    setGiroForm({ id: '', name: '', status: '1' })
    $(giroModalRef.current).modal('show')
  }

  const editGiro = (item) => setGiroForm({ id: `${item.id}`, name: item.name ?? '', status: item.status ? '1' : '0' })

  const onSaveGiro = async (e) => {
    e.preventDefault()
    const name = (giroForm.name ?? '').trim()
    if (!name) return
    const payload = { name, status: giroForm.status === '1' }
    if (giroForm.id) payload.id = giroForm.id
    const result = await sampleOrdersRest.saveGiro(payload)
    if (!result) return
    const saved = result?.data ?? result
    if (saved?.id) {
      upsertRow(setGiros, saved)
      if (!giroForm.id && saved.status) setForm(prev => ({ ...prev, giro_id: `${saved.id}`, business_line: saved.name ?? name, sub_giro_id: '', business_subline: '' }))
      else setForm(prev => `${prev.giro_id}` === `${saved.id}` ? { ...prev, business_line: saved.name ?? name } : prev)
    }
    setGiroForm({ id: '', name: '', status: '1' })
  }

  const onDeleteGiro = async (item) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar giro', text: `Se eliminara "${item.name}" y sus sub giros quedaran sin giro.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    if (!await sampleOrdersRest.deleteGiro(item.id)) return
    setGiros(prev => prev.filter(row => `${row.id}` !== `${item.id}`))
    setForm(prev => `${prev.giro_id}` === `${item.id}` ? { ...prev, giro_id: '', business_line: '', sub_giro_id: '', business_subline: '' } : prev)
    if (`${giroForm.id}` === `${item.id}`) setGiroForm({ id: '', name: '', status: '1' })
  }

  // ----- Sub Giro -----
  const onSubGiroSelect = (subGiroId) => {
    const selected = subGiros.find(row => `${row.id}` === `${subGiroId}`)
    setForm(prev => ({ ...prev, sub_giro_id: subGiroId, business_subline: selected?.name ?? '' }))
  }

  const openSubGiroModal = () => {
    setSubGiroForm({ id: '', giro_id: form.giro_id || '', name: '', status: '1' })
    $(subGiroModalRef.current).modal('show')
  }

  const editSubGiro = (item) => setSubGiroForm({ id: `${item.id}`, giro_id: item.giro_id ? `${item.giro_id}` : '', name: item.name ?? '', status: item.status ? '1' : '0' })

  const onSaveSubGiro = async (e) => {
    e.preventDefault()
    const name = (subGiroForm.name ?? '').trim()
    const giroId = subGiroForm.giro_id
    if (!giroId) {
      Swal.fire({ icon: 'warning', title: 'Falta giro', text: 'Selecciona el giro.', confirmButtonText: 'Entendido' })
      return
    }
    if (!name) return
    const payload = { giro_id: giroId, name, status: subGiroForm.status === '1' }
    if (subGiroForm.id) payload.id = subGiroForm.id
    const result = await sampleOrdersRest.saveSubGiro(payload)
    if (!result) return
    const saved = result?.data ?? result
    if (saved?.id) {
      upsertRow(setSubGiros, saved)
      if (!subGiroForm.id && saved.status) {
        const giroName = giros.find(row => `${row.id}` === `${giroId}`)?.name
        setForm(prev => ({ ...prev, giro_id: `${giroId}`, business_line: giroName ?? prev.business_line, sub_giro_id: `${saved.id}`, business_subline: saved.name ?? name }))
      } else {
        setForm(prev => `${prev.sub_giro_id}` === `${saved.id}` ? { ...prev, business_subline: saved.name ?? name } : prev)
      }
    }
    setSubGiroForm({ id: '', giro_id: form.giro_id || '', name: '', status: '1' })
  }

  const onDeleteSubGiro = async (item) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar sub giro', text: `Se eliminara "${item.name}".`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    if (!await sampleOrdersRest.deleteSubGiro(item.id)) return
    setSubGiros(prev => prev.filter(row => `${row.id}` !== `${item.id}`))
    setForm(prev => `${prev.sub_giro_id}` === `${item.id}` ? { ...prev, sub_giro_id: '', business_subline: '' } : prev)
    if (`${subGiroForm.id}` === `${item.id}`) setSubGiroForm({ id: '', giro_id: form.giro_id || '', name: '', status: '1' })
  }

  // ----- Supervisor (usuario) -----
  const emptySupervisorForm = () => ({ id: '', document_number: '', name: '', lastname_p: '', lastname_m: '', phone: '', status: '1' })

  const openSupervisorModal = () => {
    setSupervisorForm(emptySupervisorForm())
    $(supervisorModalRef.current).modal('show')
  }

  const editSupervisor = (item) => setSupervisorForm({
    id: `${item.id}`,
    document_number: item.document_number ?? '',
    name: item.name ?? '',
    lastname_p: item.lastname ?? '',
    lastname_m: '',
    phone: item.phone ?? '',
    status: item.status ? '1' : '0',
  })

  const onSaveSupervisor = async (e) => {
    e.preventDefault()
    const name = (supervisorForm.name ?? '').trim()
    if (!name) return
    const lastname = [supervisorForm.lastname_p, supervisorForm.lastname_m].map(value => (value ?? '').trim()).filter(Boolean).join(' ')
    const payload = {
      name,
      lastname,
      document_type: 'DNI',
      document_number: (supervisorForm.document_number ?? '').trim() || null,
      phone: (supervisorForm.phone ?? '').trim() || null,
      status: supervisorForm.status === '1',
    }
    if (supervisorForm.id) payload.id = supervisorForm.id
    const result = await sampleOrdersRest.saveSupervisor(payload)
    if (!result) return
    const saved = result?.data ?? result
    if (saved?.id) {
      upsertRow(setUsers, saved)
      if (!supervisorForm.id && saved.status) setForm(prev => ({ ...prev, supervisor_id: `${saved.id}`, supervisor_name: formatUser(saved) }))
      else setForm(prev => `${prev.supervisor_id}` === `${saved.id}` ? { ...prev, supervisor_name: formatUser(saved) } : prev)
    }
    setSupervisorForm(emptySupervisorForm())
  }

  const onDeleteSupervisor = async (item) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar supervisor', text: `Se eliminara "${formatUser(item)}".`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    if (!await sampleOrdersRest.deleteSupervisor(item.id)) return
    setUsers(prev => prev.filter(row => `${row.id}` !== `${item.id}`))
    setForm(prev => `${prev.supervisor_id}` === `${item.id}` ? { ...prev, supervisor_id: '', supervisor_name: '' } : prev)
    if (`${supervisorForm.id}` === `${item.id}`) setSupervisorForm(emptySupervisorForm())
  }

  const openModal = (data = null) => {
    if (data?.id) {
      // Los pedidos antiguos solo guardaron el texto (business_line); intentamos
      // emparejarlo con un giro/sub giro existente para preseleccionarlo por id.
      const giroId = data.giro_id ?? giros.find(row => row.name === data.business_line)?.id ?? ''
      const subGiroId = data.sub_giro_id ?? subGiros.find(row => row.name === data.business_subline && (!giroId || `${row.giro_id}` === `${giroId}`))?.id ?? ''
      const reasonId = data.request_reason_id ?? requestReasons.find(row => row.name === data.request_reason)?.id ?? ''
      const channelId = data.sales_channel_id ?? salesChannels.find(row => row.name === (data.sales_channel ?? data.channel))?.id ?? ''
      const subchannelId = data.sales_subchannel_id ?? salesSubchannels.find(row => row.name === data.sales_subchannel && (!channelId || `${row.sales_channel_id}` === `${channelId}`))?.id ?? ''
      const serviceTypeId = data.service_type_id ?? serviceTypes.find(row => row.name === data.service_type)?.id ?? ''
      setForm({
        ...emptyForm(),
        ...data,
        id: data.id,
        order_number: data.order_number ?? '',
        order_status: normalizeOrderStatus(data.order_status ?? 'registered'),
        email_status: normalizeEmailStatus(data.email_status ?? 'delivered'),
        requested_at: asDateText(data.requested_at),
        delivered_at: asDateText(data.delivered_at) || today(),
        delay_reason: data.delay_reason ?? '',
        delay_reason_notes: data.delay_reason_notes ?? '',
        client_id: data.client_id ? `${data.client_id}` : '',
        supervisor_id: data.supervisor_id ? `${data.supervisor_id}` : '',
        sales_channel: data.sales_channel ?? data.channel ?? '',
        sales_channel_id: channelId ? `${channelId}` : '',
        sales_subchannel_id: subchannelId ? `${subchannelId}` : '',
        service_type_id: serviceTypeId ? `${serviceTypeId}` : '',
        request_reason_id: reasonId ? `${reasonId}` : '',
        giro_id: giroId ? `${giroId}` : '',
        sub_giro_id: subGiroId ? `${subGiroId}` : '',
      })
      const nextItems = Array.isArray(data.items) && data.items.length ? data.items.map(item => ({ ...emptyItem(), ...item, uid: crypto.randomUUID() })) : []
      setItems(nextItems)
      const lat = Number(data.map_lat)
      const lng = Number(data.map_lng)
      if (data.map_lat != null && data.map_lat !== '' && data.map_lng != null && data.map_lng !== '' && Number.isFinite(lat) && Number.isFinite(lng)) {
        setMapPoint({ lat, lng })
        setHasMarker(true)
      } else {
        setMapPoint(DEFAULT_MAP_CENTER)
        setHasMarker(false)
      }
    } else {
      setForm(emptyForm())
      setItems([])
      setMapPoint(DEFAULT_MAP_CENTER)
      setHasMarker(false)
    }
    $(modalRef.current).modal('show')
  }

  const openArticleModal = () => {
    setArticleQuery('')
    setArticlePage(1)
    $(articleModalRef.current).modal('show')
  }

  const addItem = (item = emptyItem()) => setItems(prev => [...prev, item])
  const removeItem = (uid) => setItems(prev => prev.filter(item => item.uid !== uid))
  const updateItem = (uid, field, value) => setItems(prev => prev.map(item => item.uid === uid ? { ...item, [field]: value } : item))
  const addArticleItem = (article) => {
    const nextItem = articleToItem(article)
    const nextKey = articleItemKey(nextItem)

    setItems(prev => {
      if (prev.some(item => articleItemKey(item) === nextKey && (item.article_id || item.code || item.name))) return prev
      const emptyIndex = prev.findIndex(item => !item.article_id && !item.code && !item.name)
      if (emptyIndex === -1) return [...prev, nextItem]
      return prev.map((item, index) => index === emptyIndex ? nextItem : item)
    })
  }

  const saveEvidence = async (e) => {
    e.preventDefault()
    if (!evidenceOrder?.id) return
    const request = new FormData()
    request.append('evidence_url', form.evidence_url ?? '')
    request.append('evidence_notes', form.evidence_notes ?? '')
    if (evidenceFile) request.append('evidence_file', evidenceFile)

    const result = await sampleOrdersRest.saveEvidence(evidenceOrder.id, request)
    if (!result) return
    setEvidenceFile(null)
    setEvidencePreview('')
    if (evidenceFileRef.current) evidenceFileRef.current.value = ''
    $(evidenceModalRef.current).modal('hide')
    refreshGrid()
  }

  const openEvidence = (data) => {
    setEvidenceOrder(data)
    setEvidenceFile(null)
    setEvidencePreview(isEvidenceImage(data.evidence_url) ? data.evidence_url : '')
    setTimeout(() => {
      if (evidenceFileRef.current) evidenceFileRef.current.value = ''
    }, 0)
    setForm(prev => ({
      ...prev,
      evidence_url: data.evidence_url ?? '',
      evidence_notes: data.evidence_notes ?? '',
    }))
    $(evidenceModalRef.current).modal('show')
  }

  const onEvidenceFileChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setEvidenceFile(file)
    setEvidencePreview(file ? URL.createObjectURL(file) : (isEvidenceImage(form.evidence_url) ? form.evidence_url : ''))
  }

  const openTracking = (data) => {
    setTrackingOrder(data)
    $(trackingModalRef.current).modal('show')
  }

  const changeOrderStatus = async (data, nextStatus, title) => {
    const { isConfirmed } = await Swal.fire({
      title,
      text: `El pedido ${data.order_number} cambiara de estado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si, continuar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return

    // Al entregar despues de la fecha solicitada se pide el motivo: es lo que alimenta
    // el dashboard de muestras, asi que se captura en el momento y no despues.
    let delay = { delay_reason: '', delay_reason_notes: '' }
    const requestedAt = asDateText(data.requested_at)
    if (nextStatus === 'delivered' && requestedAt && today() > requestedAt) {
      const reason = await askDelayReason(data, requestedAt)
      if (!reason) return
      delay = reason
    }

    const result = await sampleOrdersRest.changeOrderStatus({ id: data.id, value: nextStatus, ...delay })
    if (result) refreshGrid()
  }

  const onDelete = async (data) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar pedido',
      text: `Se dara de baja el pedido ${data.order_number}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return
    const result = await sampleOrdersRest.delete(data.id)
    if (result) refreshGrid()
  }

  const onSave = async (e) => {
    e.preventDefault()
    const cleanItems = items
      .filter(item => normalizeText(item.code) || normalizeText(item.name) || normalizeText(item.lot_code))
      .map(item => ({
        article_id: item.article_id || null,
        warehouse_id: item.warehouse_id || null,
        stock_key: normalizeText(item.stock_key),
        code: normalizeText(item.code),
        lot_code: normalizeText(item.lot_code),
        name: normalizeText(item.name),
        unit: normalizeText(item.unit),
        stock: Number(item.stock || 0),
        quantity: Number(item.quantity || 0),
        unit_weight: Number(item.unit_weight || 0),
        warehouse: normalizeText(item.warehouse),
        expiration_date: item.expiration_date || null,
        laboratory: normalizeText(item.laboratory),
        active_principle: normalizeText(item.active_principle),
      }))

    const result = await sampleOrdersRest.save({
      ...form,
      id: form.id || undefined,
      order_number: form.id ? form.order_number : '',
      requested_at: form.requested_at || today(),
      delivered_at: form.delivered_at || null,
      total_gross_weight: Number(form.total_gross_weight || computedGrossWeight || 0),
      channel: form.sales_channel,
      document_type: form.document_type || 'RUC',
      order_complete: cleanItems.length > 0 && cleanItems.every(item => Number(item.quantity || 0) > 0 && Number(item.stock || 0) >= Number(item.quantity || 0)),
      items: cleanItems,
    })
    if (!result) return
    closeMainModal()
    refreshGrid()
  }

  const trackingRows = useMemo(() => {
    if (!trackingOrder) return []
    const currentStatus = normalizeOrderStatus(trackingOrder.order_status)
    const rows = [{ date: trackingOrder.created_at, status: 'La orden se registro en el sistema' }]
    if (['approved', 'preparing', 'in_route', 'delivered'].includes(currentStatus)) {
      rows.push({ date: trackingOrder.approved_at ?? trackingOrder.updated_at, status: 'La orden fue aprobada' })
    }
    if (['preparing', 'in_route', 'delivered'].includes(currentStatus)) {
      rows.push({ date: trackingOrder.updated_at, status: 'La guia fue enviada a picking para preparacion' })
    }
    if (['in_route', 'delivered'].includes(currentStatus)) {
      rows.push({ date: trackingOrder.updated_at, status: 'La orden esta en ruta' })
    }
    if (currentStatus === 'delivered') rows.push({ date: trackingOrder.delivered_at ?? trackingOrder.updated_at, status: 'La orden fue entregada' })
    if (currentStatus === 'cancelled') rows.push({ date: trackingOrder.updated_at, status: 'La orden fue anulada' })
    return rows
  }, [trackingOrder])

  // Botones de accion por fila, segun el estado del pedido
  const rowActions = (row) => {
    const currentStatus = normalizeOrderStatus(row.order_status)
    const complete = isOrderComplete(row)
    const approvedOrBeyond = ['approved', 'preparing', 'in_route', 'delivered'].includes(currentStatus)
    return [
      { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => openModal(r) },
      { icon: 'mdi mdi-check', title: 'Aprobar pedido', bg: '#e9f9ef', color: '#2f9e44', onClick: (r) => changeOrderStatus(r, 'approved', 'Aprobar pedido'), hidden: !(currentStatus === 'registered' && complete) },
      { icon: 'mdi mdi-package-variant-closed', title: 'Enviar a picking', bg: '#eef2ff', color: '#4a5fc1', onClick: (r) => changeOrderStatus(r, 'preparing', 'Enviar pedido a picking'), hidden: currentStatus !== 'approved' },
      { icon: 'mdi mdi-truck-fast-outline', title: 'En ruta', bg: '#fff4e5', color: '#e2941f', onClick: (r) => changeOrderStatus(r, 'in_route', 'Marcar pedido en ruta'), hidden: currentStatus !== 'preparing' },
      { icon: 'mdi mdi-check-all', title: 'Entregado', bg: '#e9f9ef', color: '#2f9e44', onClick: (r) => changeOrderStatus(r, 'delivered', 'Marcar pedido entregado'), hidden: currentStatus !== 'in_route' },
      { icon: 'mdi mdi-eye', title: 'Ver evidencia', bg: '#e6f7fb', color: '#17a2b8', onClick: (r) => openEvidence(r), hidden: !approvedOrBeyond },
      { icon: 'mdi mdi-map-marker-path', title: 'Tracking pedido', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openTracking(r), hidden: !approvedOrBeyond },
      { icon: 'mdi mdi-file-pdf-box', title: 'Imprimir guia de remision', bg: '#fdeee6', color: '#e2593f', onClick: (r) => openMagistralesRecordPdf(buildMagistralesRows.sampleOrder(r)), hidden: !approvedOrBeyond },
      { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDelete(r) },
    ]
  }

  // Columnas para exportar a Excel (misma info que la grilla, en texto plano)
  const exportColumns = [
    ['Nro pedido', row => row.order_number ?? ''],
    ['E. Pedido', row => getStatusOption(orderStatusOptions, row.order_status, normalizeOrderStatus).label],
    ['E. Email', row => getStatusOption(emailStatusOptions, row.email_status, normalizeEmailStatus).label],
    ['Guia Remision', row => row.referral_guide ?? ''],
    ['Producto', row => sampleProducts(row)],
    ['Cantidad', row => sampleQuantity(row)],
    ['Peso Unitario (Kg)', row => sampleUnitWeight(row)],
    ['Peso bruto total', row => formatNumber(sampleGrossWeight(row), 3)],
    ['Fecha solicitada', row => asDateText(row.requested_at)],
    ['Fecha aprobacion', row => row.approved_at ? asDateTimeText(row.approved_at) : ''],
    ['Fecha entrega', row => asDateText(row.delivered_at)],
    ['Diferencia de dias', row => deliveryDiffText(row)],
    ['Motivo de retraso', row => (deliveryDiffDays(row) ?? 0) > 0 ? (delayReasonLabel(row.delay_reason) || 'Sin motivo registrado') : ''],
    ['Canal', row => row.sales_channel ?? row.channel ?? ''],
    ['Cliente', row => row.client_name ?? ''],
    ['Pedido completo', row => isOrderComplete(row) ? 'COMPLETO' : 'INCOMPLETO'],
    ['Supervisor', row => row.supervisor_name ?? ''],
  ]

  const onExport = async () => {
    const rows = await tableRef.current?.loadAll()
    if (!rows?.length) {
      Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay pedidos para exportar.', confirmButtonText: 'Entendido' })
      return
    }
    if (!window.ExcelJS || !window.saveAs) {
      Swal.fire({ icon: 'error', title: 'Exportacion no disponible', text: 'No se pudo cargar el motor de exportacion.', confirmButtonText: 'Entendido' })
      return
    }
    const workbook = new window.ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Pedidos muestra')
    worksheet.addRow(exportColumns.map(([label]) => label))
    rows.forEach(row => worksheet.addRow(exportColumns.map(([, value]) => value(row))))
    worksheet.columns.forEach(column => { column.width = 18 })
    worksheet.getRow(1).font = { bold: true }
    const buffer = await workbook.xlsx.writeBuffer()
    window.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'pedidos-muestra.xlsx')
  }

  return <>
    <style>{`
      .sample-form-title { text-align: center; font-size: 22px; font-weight: 700; color: #565c68; margin-bottom: 26px; }
      .sample-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px 22px; }
      .sample-grid .span-2 { grid-column: span 2; }
      .sample-grid .span-4 { grid-column: span 4; }
      .sample-field .form-label { font-size: 13px; font-weight: 600; color: #27314c; margin-bottom: 6px; }
      .sample-input-group { display: flex; align-items: stretch; gap: 8px; }
      .sample-input-group .form-control { min-height: 38px; border-radius: 4px; }
      .sample-plus { width: 34px; border-radius: 4px; font-weight: 700; }
      .sample-map { width: 100%; height: 225px; border: 0; background: #90dcea; }
      .sample-map-empty { width: 100%; min-height: 225px; display: flex; align-items: center; justify-content: center; padding: 16px; border: 1px solid #d5dbe5; border-radius: 4px; color: #687385; background: #edf2f7; text-align: center; }
      .sample-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .sample-table th, .sample-table td { border: 1px solid #e4e8ee; padding: 8px; vertical-align: middle; }
      .sample-table th { color: #27314c; font-weight: 700; text-transform: uppercase; font-size: 11px; }
      .sample-table input { width: 100%; border: 1px solid #d5dbe5; border-radius: 3px; min-height: 32px; padding: 4px 8px; }
      .sample-items-scroll { width: 100%; overflow-x: auto; }
      @media (max-width: 991px) {
        .sample-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .sample-grid .span-2, .sample-grid .span-4 { grid-column: span 2; }
      }
      @media (max-width: 575px) {
        .sample-grid { grid-template-columns: 1fr; }
        .sample-grid .span-2, .sample-grid .span-4 { grid-column: span 1; }
      }
    `}</style>

    <VdTable
      ref={tableRef}
      rest={sampleOrdersRest}
      icon="mdi mdi-flask-outline"
      title="Pedido Muestra"
      unit="pedidos"
      defaultSort={{ field: 'requested_at', desc: true }}
      defaultPageSize={25}
      searchFields={['order_number', 'referral_guide', 'sales_channel', 'client_name', 'supervisor_name']}
      searchPlaceholder="Buscar por numero, guia, cliente, canal o supervisor…"
      emptyText="No se encontraron pedidos de muestra."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refreshGrid}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-soft" onClick={() => Swal.fire('Pedido masivo', 'El registro masivo queda preparado para conectar con importacion.', 'info')}>
          <i className="mdi mdi-plus"></i> Registrar Pedido Masivo
        </button>
        <button type="button" className="vdt-btn-soft" onClick={onExport}>
          <i className="mdi mdi-file-excel"></i> Exportar
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => openModal()}>
          <i className="mdi mdi-plus"></i> Registrar Pedido
        </button>
      </>}
      actions={rowActions}
      columns={[
        {
          key: 'numero', label: 'Nro pedido', field: 'order_number', width: '130px',
          filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => openModal(row)} title="Editar pedido">
              {row.order_number || '-'}
            </a>
          ),
        },
        {
          key: 'estado_pedido', label: 'E. Pedido', field: 'order_status', width: '150px',
          filter: { type: 'select', field: 'order_status', options: orderStatusOptions.map(o => ({ value: o.value, label: o.label })) },
          render: (row) => {
            const option = getStatusOption(orderStatusOptions, row.order_status, normalizeOrderStatus)
            return <span className={`badge rounded-pill px-2 py-1 ${option.className}`}>{option.label}</span>
          },
        },
        {
          key: 'estado_email', label: 'E. Email', field: 'email_status', width: '130px',
          filter: { type: 'select', field: 'email_status', options: emailStatusOptions.map(o => ({ value: o.value, label: o.label })) },
          render: (row) => {
            const option = getStatusOption(emailStatusOptions, row.email_status, normalizeEmailStatus)
            return <span className={`badge rounded-pill px-2 py-1 ${option.className}`}>{option.label}</span>
          },
        },
        { key: 'guia', label: 'Guia Remision', field: 'referral_guide', width: '130px', filter: { type: 'text' } },
        {
          key: 'productos', label: 'Producto', field: 'products', sortable: false, width: '300px',
          render: (row) => sampleProducts(row) || '-',
        },
        {
          key: 'cantidad', label: 'Cantidad', field: 'quantity_total', sortable: false, align: 'right', width: '105px',
          render: (row) => formatNumber(sampleQuantity(row), 0),
        },
        {
          key: 'peso_unitario', label: 'Peso Unitario (Kg)', field: 'unit_weight_total', sortable: false, width: '155px',
          render: (row) => sampleUnitWeight(row) || '-',
        },
        {
          key: 'peso_bruto', label: 'Peso bruto total', field: 'total_gross_weight', sortable: false, align: 'right', width: '140px',
          render: (row) => formatNumber(sampleGrossWeight(row), 3),
        },
        {
          key: 'fecha_solicitada', label: 'Fecha solicitada', field: 'requested_at', width: '145px',
          filter: { type: 'date' },
          render: (row) => asDateText(row.requested_at) || '-',
        },
        {
          key: 'fecha_aprobacion', label: 'Fecha aprobacion', field: 'approved_at', width: '155px',
          filter: { type: 'date' },
          render: (row) => row.approved_at ? asDateTimeText(row.approved_at) : '-',
        },
        {
          key: 'fecha_entrega', label: 'Fecha entrega', field: 'delivered_at', width: '130px',
          filter: { type: 'date' },
          render: (row) => asDateText(row.delivered_at) || '-',
        },
        {
          key: 'diferencia_dias', label: 'Diferencia de dias', field: 'delivered_at', sortable: false, align: 'right', width: '150px',
          render: (row) => {
            const diff = deliveryDiffDays(row)
            if (diff === null) return '-'
            const tone = diff > 0 ? 'text-danger' : diff < 0 ? 'text-primary' : 'text-success'
            return <span className={`fw-semibold ${tone}`}>{deliveryDiffText(row)}</span>
          },
        },
        {
          key: 'motivo_retraso', label: 'Motivo de retraso', field: 'delay_reason', width: '190px',
          filter: { type: 'select', field: 'delay_reason', options: delayReasonOptions },
          render: (row) => {
            if ((deliveryDiffDays(row) ?? 0) <= 0) return '-'
            return delayReasonLabel(row.delay_reason) || 'Sin motivo registrado'
          },
        },
        {
          key: 'canal', label: 'Canal', field: 'sales_channel', width: '110px', filter: { type: 'text' },
          render: (row) => row.sales_channel ?? row.channel ?? '',
        },
        { key: 'cliente', label: 'Cliente', field: 'client_name', width: '220px', filter: { type: 'text' } },
        {
          key: 'pedido_completo', label: 'Pedido completo', field: 'order_complete', sortable: false, width: '140px',
          filter: { type: 'select', field: 'order_complete', options: [{ value: 1, label: 'COMPLETO' }, { value: 0, label: 'INCOMPLETO' }] },
          render: (row) => {
            const complete = isOrderComplete(row)
            return <span className={`badge rounded-pill px-2 py-1 ${complete ? 'bg-success-subtle text-success border border-success' : 'bg-warning-subtle text-warning border border-warning'}`}>{complete ? 'COMPLETO' : 'INCOMPLETO'}</span>
          },
        },
        { key: 'supervisor', label: 'Supervisor', field: 'supervisor_name', width: '180px', filter: { type: 'text' } },
      ]}
      renderCard={(row, actionButtons) => {
        const statusOption = getStatusOption(orderStatusOptions, row.order_status, normalizeOrderStatus)
        const emailOption = getStatusOption(emailStatusOptions, row.email_status, normalizeEmailStatus)
        const complete = isOrderComplete(row)
        return (
          <div className="vdt-card" onClick={() => openModal(row)}>
            <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.order_number || '-'}</p>
                <small className="text-muted">{row.client_name}</small>
              </div>
              <span className={`badge rounded-pill px-2 py-1 ${statusOption.className}`}>{statusOption.label}</span>
            </div>
            <div className="d-flex flex-wrap mt-2" style={{ gap: 6 }}>
              <span className={`badge rounded-pill px-2 py-1 ${emailOption.className}`}>{emailOption.label}</span>
              <span className={`badge rounded-pill px-2 py-1 ${complete ? 'bg-success-subtle text-success border border-success' : 'bg-warning-subtle text-warning border border-warning'}`}>{complete ? 'COMPLETO' : 'INCOMPLETO'}</span>
            </div>
            <p className="text-muted mb-0 mt-2" style={{ fontSize: 12 }}>{sampleProducts(row) || 'Sin productos'}</p>
            <small className="text-muted d-block mt-2">
              <i className="mdi mdi-calendar me-1"></i>Solicitado: {asDateText(row.requested_at) || '-'} &middot; Entrega: {asDateText(row.delivered_at) || '-'}
            </small>
            {actionButtons && <div className="d-flex flex-wrap mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
          </div>
        )
      }}
    />

    <Modal
      modalRef={modalRef}
      title={form.id ? 'Editar pedido muestra' : 'Registrar pedido muestra'}
      size='full-width'
      btnCancelText='Cerrar'
      btnSubmitText={form.id ? 'Guardar' : 'Registrar'}
      bodyStyle={{ maxHeight: 'calc(100vh - 210px)', overflow: 'auto' }}
      preventEnterSubmit
      onSubmit={onSave}
    >
      <div className='sample-form-title'>Pedido N&deg;</div>

      <div className='sample-grid'>
        <SampleSelect label='Motivo del pedido' value={form.request_reason_id} onChange={onReasonSelect} options={reasonOptions} addButton onAdd={openReasonModal} />
        <SampleSelect label='Supervisor' value={form.supervisor_id} onChange={onSupervisorSelect} options={userOptions} addButton onAdd={openSupervisorModal} />
        <SampleSelect label='Seleccione cliente' value={form.client_id} onChange={onClientSelect} options={clientOptions} />
        <SampleInput label='Cliente' value={form.client_name} onChange={value => setField('client_name', value)} addButton onAdd={openClientModal} />

        <SampleSelect label='Canal de venta' value={form.sales_channel_id} onChange={onChannelSelect} options={channelOptions} addButton onAdd={openChannelModal} />
        <SampleSelect label='Sub canal de venta' value={form.sales_subchannel_id} onChange={onSubchannelSelect} options={subchannelOptions} addButton onAdd={openSubchannelModal} disabled={!form.sales_channel_id} placeholder={form.sales_channel_id ? 'Seleccione' : 'Seleccione un canal primero'} />
        <SampleSelect label='Giro' value={form.giro_id} onChange={onGiroSelect} options={giroOptions} addButton onAdd={openGiroModal} />
        <SampleSelect label='Sub Giro' value={form.sub_giro_id} onChange={onSubGiroSelect} options={subGiroOptions} addButton onAdd={openSubGiroModal} disabled={!form.giro_id} placeholder={form.giro_id ? 'Seleccione' : 'Seleccione un giro primero'} />

        <SampleSelect label='Ubigeo' value={form.ubigeo} onChange={value => setField('ubigeo', value)} options={selectedUbigeoOptions} placeholder='Seleccione Ubigeo' />
        <div className='sample-field'>
          <label className='form-label'>Direccion de entrega</label>
          {googleMapsApiKey ? (
            <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={SAMPLE_MAP_LIBRARIES} onLoad={() => setIsMapLoaded(true)}>
              <Autocomplete
                onLoad={instance => { addressAutocompleteRef.current = instance }}
                onPlaceChanged={onAddressPlaceChanged}
                options={{ componentRestrictions: { country: 'pe' } }}
              >
                <input className='form-control' value={form.delivery_address ?? ''} placeholder='Escribe y elige una direccion...' onChange={e => setField('delivery_address', e.target.value)} />
              </Autocomplete>
            </LoadScript>
          ) : (
            <input className='form-control' value={form.delivery_address ?? ''} placeholder='Introduce una ubicacion' onChange={e => setField('delivery_address', e.target.value)} />
          )}
        </div>
        <SampleInput label='Referencia' value={form.delivery_reference} onChange={value => setField('delivery_reference', value)} />
        <SampleSelect label='Tipo servicio' value={form.service_type_id} onChange={onServiceTypeSelect} options={serviceTypeOptions} addButton onAdd={openServiceTypeModal} />

        <SampleInput label='Fecha solicitada' value={form.requested_at} onChange={value => setField('requested_at', value)} type='date' />
        <SampleInput label='Fecha Entrega' value={form.delivered_at} onChange={value => setField('delivered_at', value)} type='date' />
        {(deliveryDiffDays(form) ?? 0) > 0 && (
          <>
            <SampleSelect label='Motivo de retraso' value={form.delay_reason} onChange={value => setField('delay_reason', value)} options={delayReasonOptions} placeholder='Seleccione el motivo' />
            <SampleInput label='Detalle del retraso' value={form.delay_reason_notes} onChange={value => setField('delay_reason_notes', value)} placeholder='Opcional' />
          </>
        )}
        <SampleInput label='Peso bruto total (Kg)' value={formatNumber(computedGrossWeight, 3)} onChange={() => { }} disabled />
        <SampleInput label='DNI' value={form.contact_document} onChange={value => setField('contact_document', value)} />
        <SampleInput label='Persona de contacto' value={form.contact_name} onChange={value => setField('contact_name', value)} />
        <SampleInput label='Celular' value={form.contact_phone} onChange={value => setField('contact_phone', value)} />

        <div className='sample-field span-4'>
          <label className='form-label'>Observaciones</label>
          <textarea className='form-control' rows='3' value={form.observations ?? ''} onChange={e => setField('observations', e.target.value)} />
        </div>

        <div className='span-4'>
          <div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1'>
            <label className='form-label mb-0'>Ubicacion de entrega <small className='text-muted'>(haz clic en el mapa o arrastra el pin)</small></label>
            {googleMapsApiKey && (
              <div className='d-flex gap-2'>
                <button type='button' className='btn btn-sm btn-outline-primary' onClick={useMyLocation}><i className='mdi mdi-crosshairs-gps me-1'></i>Mi ubicacion</button>
                {hasMarker && <button type='button' className='btn btn-sm btn-outline-danger' onClick={clearMapLocation}><i className='mdi mdi-map-marker-off me-1'></i>Quitar pin</button>}
              </div>
            )}
          </div>
          {googleMapsApiKey ? (
            isMapLoaded ? (
              <GoogleMap
                mapContainerClassName='sample-map'
                center={mapPoint}
                zoom={hasMarker ? 16 : 12}
                onClick={onMapClick}
                options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
              >
                {hasMarker && <Marker position={mapPoint} draggable onDragEnd={onMarkerDragEnd} />}
              </GoogleMap>
            ) : (
              <div className='sample-map-empty'>Cargando mapa...</div>
            )
          ) : (
            <div className='sample-map-empty'>Configura Google Maps API Key en Sistemas &gt; Datos generales &gt; Integraciones para usar el mapa.</div>
          )}
          {hasMarker && (
            <div className='text-muted mt-1' style={{ fontSize: 12 }}>
              <i className='mdi mdi-map-marker me-1'></i>Coordenadas: {Number(form.map_lat).toFixed(6)}, {Number(form.map_lng).toFixed(6)}
            </div>
          )}
        </div>
      </div>

      <div className='mt-4'>
        <button type='button' className='btn btn-sm btn-outline-primary fw-semibold' onClick={openArticleModal}>
          <i className='mdi mdi-plus-circle-outline me-1'></i>INSERTAR ARTICULO
        </button>
      </div>

      <div className='sample-items-scroll mt-3'>
        <table className='sample-table'>
          <thead>
            <tr>
              <th style={{ minWidth: 150 }}>Codigo</th>
              <th style={{ minWidth: 150 }}>Codigo lote</th>
              <th style={{ minWidth: 320 }}>Nombre</th>
              <th style={{ minWidth: 120 }}>Unidad</th>
              <th style={{ minWidth: 120 }}>Stock</th>
              <th style={{ minWidth: 140 }}>Peso Unitario (Kg)</th>
              <th style={{ minWidth: 120 }}>Cantidad</th>
              <th style={{ minWidth: 140 }}>Peso bruto (Kg)</th>
              <th style={{ width: 58 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.uid}>
                <td><input value={item.code} onChange={e => updateItem(item.uid, 'code', e.target.value)} /></td>
                <td><input value={item.lot_code} onChange={e => updateItem(item.uid, 'lot_code', e.target.value)} /></td>
                <td><input value={item.name} onChange={e => updateItem(item.uid, 'name', e.target.value)} /></td>
                <td><input value={item.unit} onChange={e => updateItem(item.uid, 'unit', e.target.value)} /></td>
                <td><input type='number' step='0.001' value={item.stock} onChange={e => updateItem(item.uid, 'stock', e.target.value)} /></td>
                <td><input type='number' step='0.001' value={item.unit_weight} onChange={e => updateItem(item.uid, 'unit_weight', e.target.value)} /></td>
                <td><input type='number' step='1' value={item.quantity} onChange={e => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                <td><input value={formatNumber(Number(item.quantity || 0) * Number(item.unit_weight || 0), 3)} disabled /></td>
                <td><button type='button' className='btn btn-sm btn-outline-danger' onClick={() => removeItem(item.uid)}><i className='mdi mdi-close'></i></button></td>
              </tr>
            ))}
            <tr>
              <td colSpan='6' className='text-end fw-semibold fst-italic'>Total</td>
              <td><input value={formatNumber(itemTotal, 0)} disabled /></td>
              <td><input value={formatNumber(computedGrossWeight, 3)} disabled /></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>

    <Modal
      modalRef={articleModalRef}
      title='Buscar articulos'
      size='full-width'
      hideButtonSubmit
      btnCancelText='Regresar'
      bodyStyle={{ maxHeight: 'calc(100vh - 210px)', overflow: 'auto' }}
      onSubmit={(e) => e.preventDefault()}
    >
      <div className='mb-3 fw-semibold'><i className='mdi mdi-menu me-2'></i>INGRESAR DATOS</div>
      <div className='sample-grid'>
        <div className='sample-field span-4'>
          <label className='form-label'>Descripcion del Articulo</label>
          <input className='form-control' value={articleQuery} onChange={e => { setArticleQuery(e.target.value); setArticlePage(1) }} placeholder='Ingrese codigo, nombre o categoria del articulo' />
        </div>
      </div>
      <div className='text-center my-3'>
        <button type='button' className='btn btn-sm btn-outline-primary fw-semibold' onClick={() => setArticlePage(1)}><i className='mdi mdi-magnify me-1'></i>Buscar</button>
      </div>
      <hr />
      <div className='d-flex align-items-center justify-content-between mb-2'>
        <div className='fw-semibold'><i className='mdi mdi-menu me-2'></i>SELECCIONAR ARTICULOS</div>
        <div className='d-flex align-items-center gap-2'>
          <span>Elementos:</span>
          <div style={{ width: 84 }}>
            <VdSelect
              noMargin
              value={`${articlePageSize}`}
              onChange={value => { setArticlePageSize(Number(value)); setArticlePage(1) }}
              options={[10, 20, 50, 100].map(size => ({ value: `${size}`, label: `${size}` }))}
            />
          </div>
        </div>
      </div>
      <div className='sample-items-scroll'>
        <table className='sample-table'>
          <thead>
            <tr>
              <th style={{ width: 60 }}></th>
              <th>Stock</th>
              <th>Almacen</th>
              <th>Codigo</th>
              <th>Codigo de lote</th>
              <th>Fecha vencimiento</th>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>Peso Unitario (Kg)</th>
              <th>Laboratorio</th>
              <th>Principio activo</th>
            </tr>
          </thead>
          <tbody>
            {articleRows.length === 0 && <tr><td colSpan='11' className='text-center text-muted py-3'>No existen elementos</td></tr>}
            {articleRows.map(article => {
              const item = articleToItem(article)
              const isSelected = selectedArticleKeys.has(articleItemKey(item))
              return <tr key={`sample-article-${article.stock_key ?? article.id}`}>
                <td>
                  <button
                    type='button'
                    className={`btn btn-sm ${isSelected ? 'btn-success' : 'btn-outline-primary'}`}
                    disabled={isSelected}
                    title={isSelected ? 'Articulo seleccionado' : 'Seleccionar articulo'}
                    onClick={() => addArticleItem(article)}
                  >
                    <i className={`mdi ${isSelected ? 'mdi-check-all' : 'mdi-check'}`}></i>
                  </button>
                </td>
                <td>{formatNumber(item.stock, 0)}</td>
                <td>{item.warehouse}</td>
                <td>{item.code}</td>
                <td>{item.lot_code}</td>
                <td>{item.expiration_date}</td>
                <td>{item.name}</td>
                <td>{item.unit}</td>
                <td>{formatNumber(item.unit_weight, 3)}</td>
                <td>{item.laboratory}</td>
                <td>{item.active_principle}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      <div className='mt-3 d-flex align-items-center justify-content-between flex-wrap gap-2'>
        <small className='text-muted'>{articleMatches.length} elemento(s) &middot; Pagina {articleCurrentPage} de {articleTotalPages}</small>
        <div className='btn-group btn-group-sm'>
          <button type='button' className='btn btn-outline-secondary' disabled={articleCurrentPage <= 1} onClick={() => setArticlePage(articleCurrentPage - 1)}>Anterior</button>
          <button type='button' className='btn btn-outline-secondary' disabled={articleCurrentPage >= articleTotalPages} onClick={() => setArticlePage(articleCurrentPage + 1)}>Siguiente</button>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={trackingModalRef}
      title='Tracking del pedido'
      size='lg'
      hideButtonSubmit
      btnCancelText='Cerrar'
      onSubmit={(e) => e.preventDefault()}
    >
      <table className='sample-table'>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {trackingRows.map((row, index) => (
            <tr key={`tracking-${index}`}>
              <td>{asDateTimeText(row.date)}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>

    <Modal
      modalRef={evidenceModalRef}
      title='Evidencias'
      size='lg'
      btnSubmitText='Registrar'
      onSubmit={saveEvidence}
    >
      <div className='mb-3'>
        <label className='form-label'>Evidencia</label>
        <input
          ref={evidenceFileRef}
          className='form-control'
          type='file'
          accept='image/png,image/jpeg,image/webp,image/gif'
          onChange={onEvidenceFileChange}
        />
      </div>
      <div className='mb-3'>
        <label className='form-label'>Observaciones</label>
        <textarea className='form-control' rows='4' value={form.evidence_notes ?? ''} onChange={e => setField('evidence_notes', e.target.value)} />
      </div>
      <div className='border rounded p-3'>
        <h5 className='mb-3'>Evidencia Pedido</h5>
        {evidencePreview ? (
          <img
            src={evidencePreview}
            alt='Evidencia del pedido'
            className='img-fluid rounded border bg-light'
            style={{ maxHeight: 360, width: '100%', objectFit: 'contain' }}
          />
        ) : form.evidence_url ? (
          <a href={form.evidence_url} target='_blank' rel='noreferrer'>Abrir evidencia registrada</a>
        ) : (
          <div className='text-muted py-4 text-center'>Sin evidencia registrada</div>
        )}
      </div>
    </Modal>

    <Modal modalRef={clientModalRef} title='Registrar Cliente' size='lg' btnSubmitText='Registrar' onSubmit={onSaveClient}>
      <div className='row'>
        <VdSelect
          label='Tipo de Documento' col='col-md-6' required
          value={clientForm.document_type}
          onChange={value => setClientForm(prev => ({ ...prev, document_type: value }))}
          options={[{ value: 'dni', label: 'DNI' }, { value: 'ruc', label: 'RUC' }, { value: 'ce', label: 'Carnet de extranjeria' }]}
          placeholder='Seleccione'
        />
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label mb-1'>N&deg; Documento <b className='text-danger'>*</b></label>
          <input className='form-control' value={clientForm.document_number} onChange={e => setClientForm(prev => ({ ...prev, document_number: e.target.value }))} required />
        </div>
        <div className='form-group col-12 mb-2'>
          <label className='form-label mb-1'>Razon Social <b className='text-danger'>*</b></label>
          <input className='form-control' value={clientForm.full_name} onChange={e => setClientForm(prev => ({ ...prev, full_name: e.target.value }))} required />
        </div>
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label mb-1'>Email</label>
          <input className='form-control' type='email' value={clientForm.email} onChange={e => setClientForm(prev => ({ ...prev, email: e.target.value }))} />
        </div>
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label mb-1'>Celular</label>
          <input className='form-control' value={clientForm.phone} onChange={e => setClientForm(prev => ({ ...prev, phone: e.target.value }))} />
        </div>
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label mb-1'>Codigo corto</label>
          <input className='form-control' value={clientForm.short_code} onChange={e => setClientForm(prev => ({ ...prev, short_code: e.target.value }))} />
        </div>
        <VdSelect
          label='Estado' col='col-md-6'
          value={clientForm.status}
          onChange={value => setClientForm(prev => ({ ...prev, status: value }))}
          options={activeStatusOptions}
        />
        <div className='form-group col-12 mb-2'>
          <label className='form-label mb-1'>Direccion</label>
          <input className='form-control' value={clientForm.full_address} onChange={e => setClientForm(prev => ({ ...prev, full_address: e.target.value }))} />
        </div>
      </div>
    </Modal>

    <Modal modalRef={supervisorModalRef} title='Registrar Supervisor' size='lg' btnSubmitText={supervisorForm.id ? 'Actualizar' : 'Registrar'} onSubmit={onSaveSupervisor}>
      <div className='row'>
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label mb-1'>Nro Documento</label>
          <input className='form-control' value={supervisorForm.document_number} onChange={e => setSupervisorForm(prev => ({ ...prev, document_number: e.target.value }))} placeholder='DNI' />
        </div>
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label mb-1'>Telefono</label>
          <input className='form-control' value={supervisorForm.phone} onChange={e => setSupervisorForm(prev => ({ ...prev, phone: e.target.value }))} />
        </div>
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label mb-1'>Nombres <b className='text-danger'>*</b>
            {supervisorForm.id && <a role='button' className='ms-2 small text-decoration-underline' onClick={() => setSupervisorForm(emptySupervisorForm())}>Cancelar edicion</a>}
          </label>
          <input className='form-control' value={supervisorForm.name} onChange={e => setSupervisorForm(prev => ({ ...prev, name: e.target.value }))} placeholder='Nombres' required />
        </div>
        <VdSelect
          label='Estado' col='col-md-6'
          value={supervisorForm.status}
          onChange={value => setSupervisorForm(prev => ({ ...prev, status: value }))}
          options={activeStatusOptions}
        />
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label mb-1'>Apellido Paterno</label>
          <input className='form-control' value={supervisorForm.lastname_p} onChange={e => setSupervisorForm(prev => ({ ...prev, lastname_p: e.target.value }))} />
        </div>
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label mb-1'>Apellido Materno</label>
          <input className='form-control' value={supervisorForm.lastname_m} onChange={e => setSupervisorForm(prev => ({ ...prev, lastname_m: e.target.value }))} />
        </div>
      </div>
      <CatalogList items={supervisorListItems} editingId={supervisorForm.id} onEdit={editSupervisor} onDelete={onDeleteSupervisor}
        getLabel={formatUser} labelHeader='Supervisor'
        extraColumn={{ header: 'Documento', value: item => item.document_number ?? '-' }} />
    </Modal>

    <Modal modalRef={serviceTypeModalRef} title='Registrar Tipo Servicio' size='md' btnSubmitText={serviceTypeForm.id ? 'Actualizar' : 'Registrar'} onSubmit={onSaveServiceType}>
      <div className='form-group mb-2'>
        <label className='form-label mb-1'>Descripcion <b className='text-danger'>*</b>
          {serviceTypeForm.id && <a role='button' className='ms-2 small text-decoration-underline' onClick={() => setServiceTypeForm({ id: '', name: '', status: '1' })}>Cancelar edicion</a>}
        </label>
        <input className='form-control' value={serviceTypeForm.name} onChange={e => setServiceTypeForm(prev => ({ ...prev, name: e.target.value }))} placeholder='Nombre del tipo de servicio' required />
      </div>
      <VdSelect
        label='Estado'
        value={serviceTypeForm.status}
        onChange={value => setServiceTypeForm(prev => ({ ...prev, status: value }))}
        options={activeStatusOptions}
      />
      <CatalogList items={serviceTypes} editingId={serviceTypeForm.id} onEdit={editServiceType} onDelete={onDeleteServiceType} />
    </Modal>

    <Modal modalRef={reasonModalRef} title='Registrar Motivo Pedido' size='md' btnSubmitText={reasonForm.id ? 'Actualizar' : 'Registrar'} onSubmit={onSaveReason}>
      <div className='form-group mb-2'>
        <label className='form-label mb-1'>Descripcion <b className='text-danger'>*</b>
          {reasonForm.id && <a role='button' className='ms-2 small text-decoration-underline' onClick={() => setReasonForm({ id: '', name: '', status: '1' })}>Cancelar edicion</a>}
        </label>
        <input className='form-control' value={reasonForm.name} onChange={e => setReasonForm(prev => ({ ...prev, name: e.target.value }))} placeholder='Nombre del motivo' required />
      </div>
      <VdSelect
        label='Estado'
        value={reasonForm.status}
        onChange={value => setReasonForm(prev => ({ ...prev, status: value }))}
        options={activeStatusOptions}
      />
      <CatalogList items={requestReasons} editingId={reasonForm.id} onEdit={editReason} onDelete={onDeleteReason} />
    </Modal>

    <Modal modalRef={channelModalRef} title='Registrar Canal Venta' size='md' btnSubmitText={channelForm.id ? 'Actualizar' : 'Registrar'} onSubmit={onSaveChannel}>
      <div className='form-group mb-2'>
        <label className='form-label mb-1'>Descripcion <b className='text-danger'>*</b>
          {channelForm.id && <a role='button' className='ms-2 small text-decoration-underline' onClick={() => setChannelForm({ id: '', name: '', status: '1' })}>Cancelar edicion</a>}
        </label>
        <input className='form-control' value={channelForm.name} onChange={e => setChannelForm(prev => ({ ...prev, name: e.target.value }))} placeholder='Nombre del canal' required />
      </div>
      <VdSelect
        label='Estado'
        value={channelForm.status}
        onChange={value => setChannelForm(prev => ({ ...prev, status: value }))}
        options={activeStatusOptions}
      />
      <CatalogList items={salesChannels} editingId={channelForm.id} onEdit={editChannel} onDelete={onDeleteChannel} />
    </Modal>

    <Modal modalRef={subchannelModalRef} title='Registrar Sub Canal Venta' size='md' btnSubmitText={subchannelForm.id ? 'Actualizar' : 'Registrar'} onSubmit={onSaveSubchannel}>
      <VdSelect
        label='Canal venta' required
        value={subchannelForm.sales_channel_id}
        onChange={value => setSubchannelForm(prev => ({ ...prev, sales_channel_id: value }))}
        options={channelOptions}
        placeholder='Seleccione'
      />
      <div className='form-group mb-2'>
        <label className='form-label mb-1'>Descripcion <b className='text-danger'>*</b>
          {subchannelForm.id && <a role='button' className='ms-2 small text-decoration-underline' onClick={() => setSubchannelForm({ id: '', sales_channel_id: form.sales_channel_id || '', name: '', status: '1' })}>Cancelar edicion</a>}
        </label>
        <input className='form-control' value={subchannelForm.name} onChange={e => setSubchannelForm(prev => ({ ...prev, name: e.target.value }))} placeholder='Nombre del sub canal' required />
      </div>
      <VdSelect
        label='Estado'
        value={subchannelForm.status}
        onChange={value => setSubchannelForm(prev => ({ ...prev, status: value }))}
        options={activeStatusOptions}
      />
      <CatalogList items={salesSubchannels} editingId={subchannelForm.id} onEdit={editSubchannel} onDelete={onDeleteSubchannel}
        extraColumn={{ header: 'Canal venta', value: item => salesChannels.find(row => `${row.id}` === `${item.sales_channel_id}`)?.name ?? '-' }} />
    </Modal>

    <Modal modalRef={giroModalRef} title='Registrar Giro' size='md' btnSubmitText={giroForm.id ? 'Actualizar' : 'Registrar'} onSubmit={onSaveGiro}>
      <div className='form-group mb-2'>
        <label className='form-label mb-1'>Descripcion <b className='text-danger'>*</b>
          {giroForm.id && <a role='button' className='ms-2 small text-decoration-underline' onClick={() => setGiroForm({ id: '', name: '', status: '1' })}>Cancelar edicion</a>}
        </label>
        <input className='form-control' value={giroForm.name} onChange={e => setGiroForm(prev => ({ ...prev, name: e.target.value }))} placeholder='Nombre del giro' required />
      </div>
      <VdSelect
        label='Estado'
        value={giroForm.status}
        onChange={value => setGiroForm(prev => ({ ...prev, status: value }))}
        options={activeStatusOptions}
      />
      <CatalogList items={giros} editingId={giroForm.id} onEdit={editGiro} onDelete={onDeleteGiro} />
    </Modal>

    <Modal modalRef={subGiroModalRef} title='Registrar Sub Giro' size='md' btnSubmitText={subGiroForm.id ? 'Actualizar' : 'Registrar'} onSubmit={onSaveSubGiro}>
      <VdSelect
        label='Giro' required
        value={subGiroForm.giro_id}
        onChange={value => setSubGiroForm(prev => ({ ...prev, giro_id: value }))}
        options={giroOptions}
        placeholder='Seleccione'
      />
      <div className='form-group mb-2'>
        <label className='form-label mb-1'>Descripcion <b className='text-danger'>*</b>
          {subGiroForm.id && <a role='button' className='ms-2 small text-decoration-underline' onClick={() => setSubGiroForm({ id: '', giro_id: form.giro_id || '', name: '', status: '1' })}>Cancelar edicion</a>}
        </label>
        <input className='form-control' value={subGiroForm.name} onChange={e => setSubGiroForm(prev => ({ ...prev, name: e.target.value }))} placeholder='Nombre del sub giro' required />
      </div>
      <VdSelect
        label='Estado'
        value={subGiroForm.status}
        onChange={value => setSubGiroForm(prev => ({ ...prev, status: value }))}
        options={activeStatusOptions}
      />
      <CatalogList items={subGiros} editingId={subGiroForm.id} onEdit={editSubGiro} onDelete={onDeleteSubGiro}
        extraColumn={{ header: 'Giro', value: item => giros.find(row => `${row.id}` === `${item.giro_id}`)?.name ?? '-' }} />
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'sample-orders'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Muestras - Pedido'}><SampleOrders {...properties} /></BaseAdminto>)
})
