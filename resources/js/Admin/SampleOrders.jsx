import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import SampleOrdersRest from '../Actions/Admin/SampleOrdersRest';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import { getUbigeoCatalog } from '../Utils/ubigeoInei';

const sampleOrdersRest = new SampleOrdersRest()

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

const requestReasonOptions = ['CAPACITACIONES', 'NUEVO CLIENTE', 'PRUEBA PILOTO', 'CODIFICACION NUEVO SKU', 'EVENTOS', 'REPOSICION', 'PROMOCION', 'MUESTRA MEDICA']
const salesChannelOptions = ['B2B', 'DIRECTOS', 'E COMERCE', 'RETAIL', 'TRADICIONAL', 'TRADE', 'MKT', 'COMMERCIAL EXCELLENCE']
const salesSubchannelOptions = ['LIMA 1', 'LIMA 2', 'PROVINCIAS']
const businessLineOptions = ['EDUCACION', 'GASTRONOMIA', 'HOTELERIA', 'INDUSTRIAS', 'OFICINAS', 'BELLEZA', 'BTL', 'PROVEEDOR JABONES', 'MUESTRAS', 'REPOSICION', 'INSTITUCION', 'FARMACIA', 'RETAIL', 'CLINICA']
const businessSublineOptions = ['BARES RESTAURANTES', 'BOTICAS', 'CADENAS', 'INDEPENDIENTE']
const serviceTypeOptions = ['NEXT DAY', 'SAME DAY', 'PROGRAMADO']

const today = () => new Date().toISOString().slice(0, 10)

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  code: '',
  lot_code: '',
  name: '',
  unit: '',
  stock: 0,
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
  request_reason: '',
  supervisor_id: '',
  supervisor_name: '',
  client_id: '',
  client_name: '',
  sales_channel: '',
  sales_subchannel: '',
  business_line: '',
  business_subline: '',
  ubigeo: '',
  delivery_address: '',
  delivery_reference: '',
  service_type: '',
  delivered_at: today(),
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
const normalizeOrderStatus = (value) => ({ processing: 'preparing', completed: 'delivered' }[value] ?? value)
const normalizeEmailStatus = (value) => ({ sent: 'delivered' }[value] ?? value)
const getOptionLabel = (options, value, normalizer = value => value) => options.find(option => option.value === normalizer(value))?.label ?? value ?? ''
const getStatusOption = (options, value, normalizer = value => value) => options.find(option => option.value === normalizer(value)) ?? options[0]
const asDateText = (value) => normalizeText(value).slice(0, 10)
const asDateTimeText = (value) => normalizeText(value).replace('T', ' ').slice(0, 19)
const formatNumber = (value, digits = 2) => Number(value || 0).toFixed(digits)

const renderBadge = (container, label, className) => {
  $(container).empty().append($('<span/>', {
    class: `badge rounded-pill px-2 py-1 ${className}`,
    text: label,
  }))
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
  return {
    uid: crypto.randomUUID(),
    article_id: article.id ?? '',
    code: article.code ?? '',
    lot_code: article.default_lot ?? firstLot.lot ?? '',
    name: article.name ?? '',
    unit: article.unit?.symbol ?? article.unit?.name ?? '',
    stock: Number(article.stock ?? article.stock_available ?? article.stock_min ?? 0),
    quantity: 1,
    warehouse: article.warehouse?.name ?? firstLot.warehouse?.name ?? '',
    expiration_date: asDateText(article.default_expiration_date ?? firstLot.expiration_date),
    laboratory: article.laboratory?.name ?? '',
    active_principle: article.activePrinciple?.name ?? article.active_principle?.name ?? '',
  }
}

const articleSearchValues = (article) => [
  article.code,
  article.default_lot,
  article.name,
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
  item.article_id || item.code || item.name,
  item.lot_code || item.name,
].map(normalizeText).join('|')

const SampleSelect = ({ label, value, options = [], onChange, placeholder = 'Seleccione', addButton = false, disabled = false }) => (
  <div className='sample-field'>
    <label className='form-label'>{label}</label>
    <div className='sample-input-group'>
      <select className='form-select' data-placeholder={placeholder} value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled}>
        <option value=''>{placeholder}</option>
        {options.map(option => <option key={`${label}-${option.value ?? option}`} value={option.value ?? option}>{option.label ?? option}</option>)}
      </select>
      {addButton && <button type='button' className='btn btn-outline-success sample-plus' onClick={() => Swal.fire('Dato adicional', 'Puedes escribir o seleccionar el valor requerido para este pedido.', 'info')}>+</button>}
    </div>
  </div>
)

const SampleInput = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false, addButton = false }) => (
  <div className='sample-field'>
    <label className='form-label'>{label}</label>
    <div className='sample-input-group'>
      <input className='form-control' type={type} value={value ?? ''} placeholder={placeholder} disabled={disabled} onChange={e => onChange(e.target.value)} />
      {addButton && <button type='button' className='btn btn-outline-success sample-plus' onClick={() => Swal.fire('Dato adicional', 'Puedes completar este campo manualmente.', 'info')}>+</button>}
    </div>
  </div>
)

const SampleOrders = ({ moduleTitle = 'Muestras - Pedido' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const articleModalRef = useRef()
  const trackingModalRef = useRef()
  const evidenceModalRef = useRef()

  const [form, setForm] = useState(emptyForm())
  const [items, setItems] = useState([emptyItem()])
  const [clients, setClients] = useState([])
  const [users, setUsers] = useState([])
  const [articles, setArticles] = useState([])
  const [ubigeoOptions, setUbigeoOptions] = useState([])
  const [articleQuery, setArticleQuery] = useState('')
  const [articlePageSize, setArticlePageSize] = useState(20)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [evidenceOrder, setEvidenceOrder] = useState(null)

  useEffect(() => {
    Promise.all([
      sampleOrdersRest.getClients(),
      sampleOrdersRest.getUsers(),
      sampleOrdersRest.getArticles(),
    ]).then(([clientRows, userRows, articleRows]) => {
      setClients((clientRows ?? []).filter(row => row.status !== null))
      setUsers((userRows ?? []).filter(row => row.status !== null))
      setArticles((articleRows ?? []).filter(row => row.status !== null))
    })

    getUbigeoCatalog()
      .then(catalog => setUbigeoOptions(flattenUbigeoOptions(catalog)))
      .catch(() => setUbigeoOptions([]))
  }, [])

  const clientOptions = useMemo(() => makeSelectOptions(clients, formatClient, row => row.entity_id ?? row.id), [clients])
  const userOptions = useMemo(() => makeSelectOptions(users, formatUser), [users])
  const articleRows = useMemo(() => {
    const terms = normalizeSearchText(articleQuery).split(' ').filter(Boolean)
    const rows = terms.length
      ? articles
        .map(article => ({ article, score: articleSearchScore(article, terms) }))
        .filter(row => row.score < 99)
        .sort((left, right) => left.score - right.score || normalizeText(left.article.name).localeCompare(normalizeText(right.article.name), 'es'))
        .map(row => row.article)
      : articles

    return rows.slice(0, articlePageSize)
  }, [articles, articleQuery, articlePageSize])

  const itemTotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [items])
  const selectedArticleKeys = useMemo(() => new Set(
    items
      .filter(item => normalizeText(item.article_id) || normalizeText(item.code) || normalizeText(item.name))
      .map(articleItemKey)
  ), [items])
  const selectedUbigeoOptions = useMemo(() => {
    if (!form.ubigeo || ubigeoOptions.some(option => option.value === form.ubigeo)) return ubigeoOptions
    return [{ value: form.ubigeo, label: form.ubigeo }, ...ubigeoOptions]
  }, [form.ubigeo, ubigeoOptions])

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const closeMainModal = () => $(modalRef.current).modal('hide')
  const refreshGrid = () => $(gridRef.current).dxDataGrid('instance').refresh()

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

  const onSupervisorSelect = (userId) => {
    const selected = users.find(row => `${row.id}` === `${userId}`)
    setForm(prev => ({
      ...prev,
      supervisor_id: userId,
      supervisor_name: selected ? formatUser(selected) : '',
    }))
  }

  const openModal = (data = null) => {
    if (data?.id) {
      setForm({
        ...emptyForm(),
        ...data,
        id: data.id,
        order_number: data.order_number ?? '',
        order_status: normalizeOrderStatus(data.order_status ?? 'registered'),
        email_status: normalizeEmailStatus(data.email_status ?? 'delivered'),
        requested_at: asDateText(data.requested_at),
        delivered_at: asDateText(data.delivered_at) || today(),
        client_id: data.client_id ? `${data.client_id}` : '',
        supervisor_id: data.supervisor_id ? `${data.supervisor_id}` : '',
        sales_channel: data.sales_channel ?? data.channel ?? '',
      })
      const nextItems = Array.isArray(data.items) && data.items.length ? data.items.map(item => ({ ...emptyItem(), ...item, uid: crypto.randomUUID() })) : [emptyItem()]
      setItems(nextItems)
    } else {
      setForm(emptyForm())
      setItems([emptyItem()])
    }
    $(modalRef.current).modal('show')
  }

  const openArticleModal = () => {
    setArticleQuery('')
    $(articleModalRef.current).modal('show')
  }

  const addItem = (item = emptyItem()) => setItems(prev => [...prev, item])
  const removeItem = (uid) => setItems(prev => prev.length > 1 ? prev.filter(item => item.uid !== uid) : [emptyItem()])
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
    const result = await sampleOrdersRest.save({
      ...evidenceOrder,
      evidence_url: form.evidence_url,
      evidence_notes: form.evidence_notes,
    })
    if (!result) return
    $(evidenceModalRef.current).modal('hide')
    refreshGrid()
  }

  const openEvidence = (data) => {
    setEvidenceOrder(data)
    setForm(prev => ({
      ...prev,
      evidence_url: data.evidence_url ?? '',
      evidence_notes: data.evidence_notes ?? '',
    }))
    $(evidenceModalRef.current).modal('show')
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
    const result = await sampleOrdersRest.boolean({ id: data.id, field: 'order_status', value: nextStatus })
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
        code: normalizeText(item.code),
        lot_code: normalizeText(item.lot_code),
        name: normalizeText(item.name),
        unit: normalizeText(item.unit),
        stock: Number(item.stock || 0),
        quantity: Number(item.quantity || 0),
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
      channel: form.sales_channel,
      document_type: form.document_type || 'RUC',
      order_complete: cleanItems.length > 0 && cleanItems.every(item => Number(item.quantity || 0) > 0),
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
      rows.push({ date: trackingOrder.updated_at, status: 'La orden fue aprobada' })
    }
    if (['preparing', 'in_route', 'delivered'].includes(currentStatus)) {
      rows.push({ date: trackingOrder.updated_at, status: 'La orden esta en preparacion' })
    }
    if (['in_route', 'delivered'].includes(currentStatus)) {
      rows.push({ date: trackingOrder.updated_at, status: 'La orden esta en ruta' })
    }
    if (currentStatus === 'delivered') rows.push({ date: trackingOrder.delivered_at ?? trackingOrder.updated_at, status: 'La orden fue entregada' })
    if (currentStatus === 'cancelled') rows.push({ date: trackingOrder.updated_at, status: 'La orden fue anulada' })
    return rows
  }, [trackingOrder])

  return <>
    <style>{`
      .sample-action-row { display: flex; gap: 22px; margin-bottom: 22px; flex-wrap: wrap; }
      .sample-action-card { width: min(405px, 100%); min-height: 58px; border-radius: 6px; border: 0; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 22px; font-weight: 700; }
      .sample-action-card.primary { background: #23244f; }
      .sample-action-card.secondary { background: #23244f; }
      .sample-form-title { text-align: center; font-size: 22px; font-weight: 700; color: #565c68; margin-bottom: 26px; }
      .sample-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px 22px; }
      .sample-grid .span-2 { grid-column: span 2; }
      .sample-grid .span-4 { grid-column: span 4; }
      .sample-field .form-label { font-size: 13px; font-weight: 600; color: #27314c; margin-bottom: 6px; }
      .sample-input-group { display: flex; align-items: stretch; }
      .sample-input-group .form-control { min-height: 38px; border-radius: 4px; }
      .sample-plus { width: 34px; border-radius: 0 4px 4px 0; font-weight: 700; }
      .sample-map { width: 100%; height: 225px; border: 0; background: #90dcea; }
      .sample-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .sample-table th, .sample-table td { border: 1px solid #e4e8ee; padding: 8px; vertical-align: middle; }
      .sample-table th { color: #27314c; font-weight: 700; text-transform: uppercase; font-size: 11px; }
      .sample-table input { width: 100%; border: 1px solid #d5dbe5; border-radius: 3px; min-height: 32px; padding: 4px 8px; }
      .sample-items-scroll { width: 100%; overflow-x: auto; }
      .sample-grid-actions { display: inline-flex; gap: 6px; flex-wrap: nowrap; align-items: center; width: max-content; max-width: 100%; }
      .sample-grid-actions .btn { flex: 0 0 34px; width: 34px; height: 34px; margin-right: 0 !important; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
      @media (max-width: 991px) {
        .sample-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .sample-grid .span-2, .sample-grid .span-4 { grid-column: span 2; }
      }
      @media (max-width: 575px) {
        .sample-grid { grid-template-columns: 1fr; }
        .sample-grid .span-2, .sample-grid .span-4 { grid-column: span 1; }
      }
    `}</style>

    <div className='sample-action-row'>
      <button className='sample-action-card primary' type='button' onClick={() => openModal()}>
        <span><i className='mdi mdi-plus-circle-outline me-2'></i>Registrar Pedido</span>
        <i className='mdi mdi-calendar fs-3'></i>
      </button>
      <button className='sample-action-card secondary' type='button' onClick={() => Swal.fire('Pedido masivo', 'El registro masivo queda preparado para conectar con importacion.', 'info')}>
        <span><i className='mdi mdi-plus-circle-outline me-2'></i>Registrar Pedido Masivo</span>
        <i className='mdi mdi-calendar fs-3'></i>
      </button>
    </div>

    <Table
      gridRef={gridRef}
      title='Pedido Muestra'
      rest={sampleOrdersRest}
      pageSize={25}
      exportable
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', hint: 'Actualizar', onClick: refreshGrid } })
      }}
      columns={[
        {
          caption: '#',
          width: 55,
          allowFiltering: false,
          allowSorting: false,
          cellTemplate: (container, options) => container.text((options.rowIndex ?? 0) + 1),
        },
        {
          caption: 'Acciones',
          width: 315,
          minWidth: 315,
          fixed: true,
          fixedPosition: 'left',
          allowFiltering: false,
          allowSorting: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css({ overflow: 'hidden', whiteSpace: 'nowrap' })
            const currentStatus = normalizeOrderStatus(data.order_status)
            const actions = $('<div/>', { class: 'sample-grid-actions' })
            actions.append(DxButton({ className: 'btn btn-xs btn-outline-warning tippy-here', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openModal(data) }))
            if (!['approved', 'preparing', 'in_route', 'delivered', 'cancelled'].includes(currentStatus)) {
              actions.append(DxButton({ className: 'btn btn-xs btn-outline-success tippy-here', title: 'Aprobar pedido', icon: 'mdi mdi-check', onClick: () => changeOrderStatus(data, 'approved', 'Aprobar pedido') }))
            }
            actions.append(DxButton({ className: 'btn btn-xs btn-outline-primary tippy-here', title: 'En ruta', icon: 'mdi mdi-truck-fast-outline', onClick: () => changeOrderStatus(data, 'in_route', 'Marcar pedido en ruta') }))
            actions.append(DxButton({ className: 'btn btn-xs btn-outline-info tippy-here', title: 'Ver evidencia', icon: 'mdi mdi-eye', onClick: () => openEvidence(data) }))
            actions.append(DxButton({ className: 'btn btn-xs btn-outline-dark tippy-here', title: 'Tracking pedido', icon: 'mdi mdi-map-marker-path', onClick: () => openTracking(data) }))
            actions.append(DxButton({ className: 'btn btn-xs btn-outline-danger tippy-here', title: 'Imprimir guia', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.sampleOrder(data)) }))
            actions.append(DxButton({ className: 'btn btn-xs btn-outline-danger tippy-here', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data) }))
            container.empty().append(actions)
          }
        },
        {
          dataField: 'order_status',
          caption: 'E. Pedido',
          minWidth: 125,
          lookup: { dataSource: orderStatusOptions, valueExpr: 'value', displayExpr: 'label' },
          calculateCellValue: data => getOptionLabel(orderStatusOptions, data.order_status, normalizeOrderStatus),
          cellTemplate: (container, { data }) => {
            const option = getStatusOption(orderStatusOptions, data.order_status, normalizeOrderStatus)
            renderBadge(container, option.label, option.className)
          }
        },
        {
          dataField: 'email_status',
          caption: 'E. Email',
          minWidth: 115,
          lookup: { dataSource: emailStatusOptions, valueExpr: 'value', displayExpr: 'label' },
          calculateCellValue: data => getOptionLabel(emailStatusOptions, data.email_status, normalizeEmailStatus),
          cellTemplate: (container, { data }) => {
            const option = getStatusOption(emailStatusOptions, data.email_status, normalizeEmailStatus)
            renderBadge(container, option.label, option.className)
          }
        },
        { dataField: 'referral_guide', caption: 'Guia Remision', minWidth: 130 },
        { dataField: 'total_gross_weight', caption: 'Peso bruto total', dataType: 'number', minWidth: 140, format: { type: 'fixedPoint', precision: 2 } },
        {
          dataField: 'order_number',
          caption: 'Nro pedido',
          minWidth: 120,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.order_number, () => openModal(data), 'Editar pedido')
        },
        { dataField: 'sales_channel', caption: 'Canal', minWidth: 110, calculateCellValue: row => row.sales_channel ?? row.channel ?? '' },
        { dataField: 'document_number', caption: 'Nro documento', minWidth: 130 },
        { dataField: 'client_name', caption: 'Cliente', minWidth: 260 },
        {
          dataField: 'order_complete',
          caption: 'Pedido completo',
          minWidth: 140,
          calculateCellValue: data => data.order_complete ? 'COMPLETO' : 'INCOMPLETO',
          cellTemplate: (container, { data }) => renderBadge(container, data.order_complete ? 'COMPLETO' : 'INCOMPLETO', data.order_complete ? 'bg-success-subtle text-success border border-success' : 'bg-warning-subtle text-warning border border-warning')
        },
        { dataField: 'requested_at', caption: 'Fecha solicitada', dataType: 'date', minWidth: 145 },
        { dataField: 'delivered_at', caption: 'Fecha entrega', dataType: 'date', minWidth: 130 },
        { dataField: 'supervisor_name', caption: 'Supervisor', minWidth: 200 },
      ]}
    />

    <Modal
      modalRef={modalRef}
      title={form.id ? 'Editar pedido muestra' : 'Registrar pedido muestra'}
      size='full-width'
      btnCancelText='Cerrar'
      btnSubmitText={form.id ? 'Guardar' : 'Registrar'}
      bodyStyle={{ maxHeight: 'calc(100vh - 210px)', overflow: 'auto' }}
      onSubmit={onSave}
    >
      <div className='sample-form-title'>Pedido N&deg;</div>

      <div className='sample-grid'>
        <SampleSelect label='Motivo del pedido' value={form.request_reason} onChange={value => setField('request_reason', value)} options={requestReasonOptions} addButton />
        <SampleSelect label='Supervisor' value={form.supervisor_id} onChange={onSupervisorSelect} options={userOptions} addButton />
        <SampleSelect label='Seleccione cliente' value={form.client_id} onChange={onClientSelect} options={clientOptions} />
        <SampleInput label='Cliente' value={form.client_name} onChange={value => setField('client_name', value)} addButton />

        <SampleSelect label='Canal de venta' value={form.sales_channel} onChange={value => setField('sales_channel', value)} options={salesChannelOptions} addButton />
        <SampleSelect label='Sub canal de venta' value={form.sales_subchannel} onChange={value => setField('sales_subchannel', value)} options={salesSubchannelOptions} addButton />
        <SampleSelect label='Giro' value={form.business_line} onChange={value => setField('business_line', value)} options={businessLineOptions} addButton />
        <SampleSelect label='Sub Giro' value={form.business_subline} onChange={value => setField('business_subline', value)} options={businessSublineOptions} addButton />

        <SampleSelect label='Ubigeo' value={form.ubigeo} onChange={value => setField('ubigeo', value)} options={selectedUbigeoOptions} placeholder='Seleccione Ubigeo' />
        <SampleInput label='Direccion de entrega' value={form.delivery_address} onChange={value => setField('delivery_address', value)} placeholder='Introduce una ubicacion' />
        <SampleInput label='Referencia' value={form.delivery_reference} onChange={value => setField('delivery_reference', value)} />
        <SampleSelect label='Tipo servicio' value={form.service_type} onChange={value => setField('service_type', value)} options={serviceTypeOptions} addButton />

        <SampleInput label='Fecha Entrega' value={form.delivered_at} onChange={value => setField('delivered_at', value)} type='date' />
        <SampleInput label='DNI' value={form.contact_document} onChange={value => setField('contact_document', value)} />
        <SampleInput label='Persona de contacto' value={form.contact_name} onChange={value => setField('contact_name', value)} />
        <SampleInput label='Celular' value={form.contact_phone} onChange={value => setField('contact_phone', value)} />

        <div className='sample-field span-4'>
          <label className='form-label'>Observaciones</label>
          <textarea className='form-control' rows='3' value={form.observations ?? ''} onChange={e => setField('observations', e.target.value)} />
        </div>

        <div className='span-4'>
          <iframe
            className='sample-map'
            loading='lazy'
            src={`https://maps.google.com/maps?q=${encodeURIComponent(form.delivery_address || 'Lima Peru')}&z=11&output=embed`}
          />
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
              <th style={{ minWidth: 120 }}>Cantidad</th>
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
                <td><input type='number' step='1' value={item.quantity} onChange={e => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                <td><button type='button' className='btn btn-sm btn-outline-danger' onClick={() => removeItem(item.uid)}><i className='mdi mdi-close'></i></button></td>
              </tr>
            ))}
            <tr>
              <td colSpan='5' className='text-end fw-semibold fst-italic'>Total</td>
              <td><input value={formatNumber(itemTotal, 0)} disabled /></td>
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
          <input className='form-control' value={articleQuery} onChange={e => setArticleQuery(e.target.value)} placeholder='Ingrese codigo, nombre o categoria del articulo' />
        </div>
      </div>
      <div className='text-center my-3'>
        <button type='button' className='btn btn-sm btn-outline-primary fw-semibold' onClick={() => setArticlePageSize(20)}><i className='mdi mdi-magnify me-1'></i>Buscar</button>
      </div>
      <hr />
      <div className='d-flex align-items-center justify-content-between mb-2'>
        <div className='fw-semibold'><i className='mdi mdi-menu me-2'></i>SELECCIONAR ARTICULOS</div>
        <div className='d-flex align-items-center gap-2'>
          <span>Elementos:</span>
          <select className='form-control form-control-sm' style={{ width: 78 }} value={articlePageSize} onChange={e => setArticlePageSize(Number(e.target.value))}>
            {[10, 20, 50, 100].map(size => <option key={`article-page-${size}`} value={size}>{size}</option>)}
          </select>
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
              <th>Laboratorio</th>
              <th>Principio activo</th>
            </tr>
          </thead>
          <tbody>
            {articleRows.length === 0 && <tr><td colSpan='10' className='text-center text-muted py-3'>No existen elementos</td></tr>}
            {articleRows.map(article => {
              const item = articleToItem(article)
              const isSelected = selectedArticleKeys.has(articleItemKey(item))
              return <tr key={`sample-article-${article.id}`}>
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
                <td>{item.laboratory}</td>
                <td>{item.active_principle}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      <div className='mt-3 text-muted'>{articleRows.length} elementos</div>
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
      title='Evidencia del pedido'
      size='lg'
      btnSubmitText='Guardar evidencia'
      onSubmit={saveEvidence}
    >
      <div className='mb-3'>
        <label className='form-label'>URL o referencia de evidencia</label>
        <input className='form-control' value={form.evidence_url ?? ''} onChange={e => setField('evidence_url', e.target.value)} />
      </div>
      <div className='mb-3'>
        <label className='form-label'>Notas de evidencia</label>
        <textarea className='form-control' rows='4' value={form.evidence_notes ?? ''} onChange={e => setField('evidence_notes', e.target.value)} />
      </div>
      {form.evidence_url && <a href={form.evidence_url} target='_blank' rel='noreferrer'>Abrir evidencia</a>}
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'sample-orders'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Muestras - Pedido'}><SampleOrders {...properties} /></BaseAdminto>)
})
