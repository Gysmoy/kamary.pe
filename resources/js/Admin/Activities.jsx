import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import ActivitiesRest from '../Actions/Admin/ActivitiesRest';
import renderGridEditLink from '../Utils/renderGridEditLink';
import Global from '../Utils/Global';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import {
  activityStatusOptions,
  activityTypeOptions,
  getActivityStatusLabel,
  getActivityTypeLabel,
  toLookup,
} from '../Utils/statusLabels';

const activitiesRest = new ActivitiesRest()
const defaultActivityItem = {
  item_code: '001',
  description: 'SERVICIO DE RECOJO Y ENTREGA DE PAQUETES',
  quantity: 1,
}
const emptyItem = (withDefaults = false) => ({
  uid: crypto.randomUUID(),
  commercial_order_item_id: '',
  article_id: '',
  item_code: withDefaults ? defaultActivityItem.item_code : '',
  description: withDefaults ? defaultActivityItem.description : '',
  quantity: withDefaults ? defaultActivityItem.quantity : 1,
  delivered_quantity: 0,
})
const defaultOriginAddress = 'CAL.YEN ESCOBEDO GARRO NRO. 830 URB. LA VINA LIMA - LIMA - SAN LUIS'

const emptyDateFilters = () => ({ start: '', end: '' })
const buildDateFilter = ({ start, end }) => {
  const filters = []
  if (start) filters.push(['created_at', '>=', `${start} 00:00:00`])
  if (end) filters.push(['created_at', '<=', `${end} 23:59:59`])
  return filters.reduce((acc, filter) => acc ? [acc, 'and', filter] : filter, null)
}

const cleanCustomerText = (value) => `${value ?? ''}`.trim().toLowerCase()
const clientLabel = (row) => [row?.document_number, row?.full_name || row?.display_name].filter(Boolean).join(' - ') || row?.full_name || row?.display_name || ''
const eventualClientLabel = (row) => [row?.document_number, row?.business_name || row?.display_name].filter(Boolean).join(' - ') || row?.business_name || row?.display_name || ''
const parseCustomerValue = (value) => {
  if (value.startsWith('client-')) return ['client', value.slice('client-'.length)]
  if (value.startsWith('eventual-')) return ['eventual', value.slice('eventual-'.length)]
  return ['', '']
}
const stripCustomerPrefix = (value, prefix) => {
  const text = `${value ?? ''}`.trim()
  return text.startsWith(`${prefix}-`) ? text.slice(prefix.length + 1) : text
}
const normalizeClientRows = (rows) => (rows ?? [])
  .filter(row => row?.client_kind !== 'eventual' && !`${row?.id ?? ''}`.startsWith('eventual-'))
  .map(row => ({
    ...row,
    id: stripCustomerPrefix(row?.entity_id ?? row?.id, 'client'),
    full_name: row?.full_name || row?.display_name || '',
  }))
const normalizeEventualClientRows = (rows) => (rows ?? [])
  .filter(row => row?.client_kind === 'eventual' || `${row?.id ?? ''}`.startsWith('eventual-') || row?.business_name)
  .map(row => ({
    ...row,
    id: stripCustomerPrefix(row?.entity_id ?? row?.id, 'eventual'),
    business_name: row?.business_name || row?.display_name || '',
  }))
const mergeCustomerRows = (...groups) => {
  const rows = new Map()
  groups.flat().forEach(row => {
    if (!row?.id) return
    rows.set(`${row.id}`, row)
  })
  return Array.from(rows.values())
}
const resolveCustomerSelection = (data, clientRows, eventualRows) => {
  const clientId = stripCustomerPrefix(data?.client_id ?? data?.client?.id, 'client')
  if (clientId) return { clientId, eventualClientId: '' }

  const eventualClientId = stripCustomerPrefix(data?.eventual_client_id ?? data?.eventualClient?.id ?? data?.eventual_client?.id, 'eventual')
  if (eventualClientId) return { clientId: '', eventualClientId }

  const documentNumber = cleanCustomerText(data?.document_number)
  const customerName = cleanCustomerText(data?.customer_name)
  const regular = clientRows.find(row =>
    (documentNumber && cleanCustomerText(row?.document_number) === documentNumber)
    || (customerName && cleanCustomerText(row?.full_name || row?.display_name) === customerName)
  )
  if (regular) return { clientId: `${regular.id}`, eventualClientId: '' }

  const eventual = eventualRows.find(row =>
    (documentNumber && cleanCustomerText(row?.document_number) === documentNumber)
    || (customerName && cleanCustomerText(row?.business_name || row?.display_name) === customerName)
  )
  if (eventual) return { clientId: '', eventualClientId: `${eventual.id}` }

  return { clientId: '', eventualClientId: '' }
}
const selectedCustomerFallback = (data, selection) => {
  if (selection.clientId) {
    return {
      id: selection.clientId,
      document_number: data?.document_number ?? data?.client?.document_number ?? '',
      full_name: data?.customer_name ?? data?.client?.full_name ?? '',
      display_name: data?.customer_name ?? data?.client?.full_name ?? '',
    }
  }
  if (selection.eventualClientId) {
    return {
      id: selection.eventualClientId,
      document_number: data?.document_number ?? data?.eventualClient?.document_number ?? data?.eventual_client?.document_number ?? '',
      business_name: data?.customer_name ?? data?.eventualClient?.business_name ?? data?.eventual_client?.business_name ?? '',
      display_name: data?.customer_name ?? data?.eventualClient?.business_name ?? data?.eventual_client?.business_name ?? '',
    }
  }
  return null
}
const formatAuditUser = (user) => {
  if (!user) return ''
  return [user.name, user.lastname].filter(Boolean).join(' ').trim() || user.fullname || ''
}
const formatReportDate = (value, withTime = false) => {
  const text = `${value ?? ''}`.trim()
  if (!text) return ''
  return text.replace('T', ' ').slice(0, withTime ? 19 : 10)
}
const activityReportHeaders = [
  'E. Pedido',
  'Código',
  'Manifiesto',
  'Cliente',
  'Tipo',
  'Ubigeo',
  'Dirección',
  'Fecha Traslado',
  'Fecha Registro',
  'Usuario Registro',
]
const activityReportColumns = [
  { wpx: 160 },
  { wpx: 112 },
  { wpx: 176 },
  { wpx: 128 },
  { wpx: 80 },
  { wpx: 112 },
  { wpx: 160 },
  { wpx: 240 },
  { wpx: 240 },
  { wpx: 272 },
]

const Activities = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const transferDateRef = useRef()
  const activityTypeRef = useRef()
  const activityStatusRef = useRef()
  const manifestCodeRef = useRef()
  const customerNameRef = useRef()
  const recipientDocumentTypeRef = useRef()
  const documentNumberRef = useRef()
  const originAddressRef = useRef()
  const destinationAddressRef = useRef()
  const destinationReferenceRef = useRef()
  const dispatchContactNameRef = useRef()
  const dispatchContactPhoneRef = useRef()
  const ubigeoRef = useRef()
  const mapLatRef = useRef()
  const mapLngRef = useRef()
  const packageCountRef = useRef()
  const grossWeightRef = useRef()
  const observationsRef = useRef()

  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [orders, setOrders] = useState([])
  const [dispatches, setDispatches] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [zones, setZones] = useState([])
  const [clients, setClients] = useState([])
  const [eventualClients, setEventualClients] = useState([])
  const [articles, setArticles] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [selectedDispatchId, setSelectedDispatchId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedEventualClientId, setSelectedEventualClientId] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [items, setItems] = useState([emptyItem(true)])
  const [mapPreview, setMapPreview] = useState({ lat: '', lng: '', address: defaultOriginAddress })
  const [dateFilters, setDateFilters] = useState(emptyDateFilters())
  const [appliedDateFilters, setAppliedDateFilters] = useState(emptyDateFilters())
  const [isExportingReport, setIsExportingReport] = useState(false)

  const orderMap = useMemo(() => Object.fromEntries(orders.map(row => [`${row.id}`, row])), [orders])
  const dispatchMap = useMemo(() => Object.fromEntries(dispatches.map(row => [`${row.id}`, row])), [dispatches])
  const articleMap = useMemo(() => Object.fromEntries(articles.map(row => [`${row.id}`, row])), [articles])
  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(row => [`${row.id}`, row])), [vehicles])
  const selectedCustomerKey = selectedClientId ? `client-${selectedClientId}` : (selectedEventualClientId ? `eventual-${selectedEventualClientId}` : '')
  const mapQuery = (mapPreview.lat && mapPreview.lng)
    ? `${mapPreview.lat},${mapPreview.lng}`
    : (mapPreview.address || defaultOriginAddress)
  const googleMapsApiKey = `${Global.GMAPS_API_KEY ?? ''}`.trim()
  const mapUrl = googleMapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(mapQuery)}&zoom=12`
    : ''
  const activityGridFilter = useMemo(() => buildDateFilter(appliedDateFilters), [appliedDateFilters])

  const loadCatalogs = async () => {
    const [businessRows, warehouseRows, orderRows, dispatchRows, driverRows, vehicleRows, zoneRows, clientRows, eventualRows, articleRows] = await Promise.all([
      activitiesRest.getBusinesses(),
      activitiesRest.getWarehouses(),
      activitiesRest.getCommercialOrders(),
      activitiesRest.getDispatches(),
      activitiesRest.getDrivers(),
      activitiesRest.getVehicles(),
      activitiesRest.getZones(),
      activitiesRest.getClients(),
      activitiesRest.getEventualClients(),
      activitiesRest.getArticles(),
    ])
    setBusinesses(businessRows ?? [])
    if ((businessRows ?? []).length) {
      setSelectedBusinessId(prev => prev || `${businessRows[0].id}`)
      loadBranches(`${businessRows[0].id}`, '')
    }
    setWarehouses(warehouseRows ?? [])
    setOrders((orderRows ?? []).filter(row => row.status !== null && row.order_status !== 'cancelled'))
    setDispatches((dispatchRows ?? []).filter(row => row.status !== null))
    setDrivers(driverRows ?? [])
    setVehicles(vehicleRows ?? [])
    setZones(zoneRows ?? [])
    setClients(normalizeClientRows(clientRows))
    setEventualClients(mergeCustomerRows(
      normalizeEventualClientRows(clientRows),
      normalizeEventualClientRows(eventualRows),
    ))
    setArticles(articleRows ?? [])
  }

  useEffect(() => { loadCatalogs() }, [])

  const loadBranches = async (businessId, preferred = '') => {
    const data = await activitiesRest.getBranchesByBusiness(businessId)
    setBranches(data ?? [])
    setSelectedBranchId(preferred ? `${preferred}` : '')
  }

  const ensureCustomerCatalogs = async () => {
    if (clients.length || eventualClients.length) {
      return { clientRows: clients, eventualRows: eventualClients }
    }

    const [clientRows, eventualRows] = await Promise.all([
      activitiesRest.getClients(),
      activitiesRest.getEventualClients(),
    ])
    const nextClients = normalizeClientRows(clientRows)
    const nextEventualClients = mergeCustomerRows(
      normalizeEventualClientRows(clientRows),
      normalizeEventualClientRows(eventualRows),
    )
    setClients(nextClients)
    setEventualClients(nextEventualClients)
    return { clientRows: nextClients, eventualRows: nextEventualClients }
  }

  const hydrateOrder = (order) => {
    if (!order) return
    setSelectedBusinessId(order.business_id ? `${order.business_id}` : '')
    loadBranches(order.business_id, order.business_branch_id)
    setSelectedWarehouseId(order.warehouse_id ? `${order.warehouse_id}` : '')
    setSelectedClientId(order.client_id ? `${order.client_id}` : '')
    setSelectedEventualClientId(order.eventual_client_id ? `${order.eventual_client_id}` : '')
    customerNameRef.current.value = order.client?.full_name ?? order.eventual_client?.business_name ?? order.eventualClient?.business_name ?? ''
    documentNumberRef.current.value = order.client?.document_number ?? order.eventual_client?.document_number ?? order.eventualClient?.document_number ?? ''
    destinationAddressRef.current.value = order.delivery_address ?? ''
    destinationReferenceRef.current.value = order.delivery_reference ?? ''
    dispatchContactNameRef.current.value = order.dispatch_contact_name ?? ''
    dispatchContactPhoneRef.current.value = order.dispatch_contact_phone ?? ''
    ubigeoRef.current.value = order.ubigeo ?? ''
    mapLatRef.current.value = order.map_lat ?? ''
    mapLngRef.current.value = order.map_lng ?? ''
    setMapPreview({
      lat: order.map_lat ?? '',
      lng: order.map_lng ?? '',
      address: order.delivery_address || defaultOriginAddress,
    })
    const mappedItems = (order.items ?? []).map(row => ({
      uid: crypto.randomUUID(),
      commercial_order_item_id: `${row.id}`,
      article_id: `${row.article_id ?? ''}`,
      item_code: row.article?.code ?? '',
      description: row.article?.name ?? 'Articulo',
      quantity: Number(row.quantity || 0),
      delivered_quantity: 0,
    }))
    if (mappedItems.length > 0) setItems(mappedItems)
  }

  const hydrateDispatch = (dispatch) => {
    if (!dispatch) return
    setSelectedBusinessId(dispatch.business_id ? `${dispatch.business_id}` : '')
    loadBranches(dispatch.business_id, dispatch.business_branch_id)
    setSelectedWarehouseId(dispatch.warehouse_id ? `${dispatch.warehouse_id}` : '')
    setSelectedDriverId(dispatch.driver_id ? `${dispatch.driver_id}` : '')
    setSelectedVehicleId(dispatch.vehicle_id ? `${dispatch.vehicle_id}` : '')
    setSelectedZoneId(dispatch.zone_id ? `${dispatch.zone_id}` : '')
    manifestCodeRef.current.value = dispatch.manifest_code ?? ''
  }

  const onCustomerChange = (value) => {
    if (!value) {
      setSelectedClientId('')
      setSelectedEventualClientId('')
      customerNameRef.current.value = ''
      documentNumberRef.current.value = ''
      return
    }

    const [type, id] = parseCustomerValue(value)
    if (type === 'client') {
      const client = clients.find(row => `${row.id}` === `${id}`)
      setSelectedClientId(id)
      setSelectedEventualClientId('')
      customerNameRef.current.value = client?.full_name ?? ''
      documentNumberRef.current.value = client?.document_number ?? ''
      return
    }

    const eventual = eventualClients.find(row => `${row.id}` === `${id}`)
    setSelectedClientId('')
    setSelectedEventualClientId(id)
    customerNameRef.current.value = eventual?.business_name ?? ''
    documentNumberRef.current.value = eventual?.document_number ?? ''
  }

  const syncMapPreview = () => setMapPreview({
    lat: mapLatRef.current?.value ?? '',
    lng: mapLngRef.current?.value ?? '',
    address: destinationAddressRef.current?.value || originAddressRef.current?.value || defaultOriginAddress,
  })

  const onModalOpen = async (data = null) => {
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    transferDateRef.current.value = data?.transfer_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    activityTypeRef.current.value = data?.activity_type ?? 'delivery'
    activityStatusRef.current.value = data?.activity_status ?? 'scheduled'
    manifestCodeRef.current.value = data?.manifest_code ?? ''
    customerNameRef.current.value = data?.customer_name ?? ''
    recipientDocumentTypeRef.current.value = data?.recipient_document_type ?? 'DNI'
    documentNumberRef.current.value = data?.document_number ?? ''
    originAddressRef.current.value = data?.origin_address ?? defaultOriginAddress
    destinationAddressRef.current.value = data?.destination_address ?? ''
    destinationReferenceRef.current.value = data?.destination_reference ?? ''
    dispatchContactNameRef.current.value = data?.dispatch_contact_name ?? ''
    dispatchContactPhoneRef.current.value = data?.dispatch_contact_phone ?? ''
    ubigeoRef.current.value = data?.ubigeo ?? ''
    mapLatRef.current.value = data?.map_lat ?? ''
    mapLngRef.current.value = data?.map_lng ?? ''
    packageCountRef.current.value = data?.package_count ?? 0
    grossWeightRef.current.value = data?.gross_weight ?? 0
    observationsRef.current.value = data?.observations ?? ''
    const defaultBusinessId = data?.business_id ? `${data.business_id}` : (selectedBusinessId || (businesses[0]?.id ? `${businesses[0].id}` : ''))
    setSelectedBusinessId(defaultBusinessId)
    setSelectedWarehouseId(data?.warehouse_id ? `${data.warehouse_id}` : '')
    setSelectedOrderId(data?.commercial_order_id ? `${data.commercial_order_id}` : '')
    setSelectedDispatchId(data?.dispatch_id ? `${data.dispatch_id}` : '')
    const { clientRows, eventualRows } = await ensureCustomerCatalogs()
    const customerSelection = resolveCustomerSelection(data, clientRows, eventualRows)
    const fallbackCustomer = selectedCustomerFallback(data, customerSelection)
    if (customerSelection.clientId && fallbackCustomer && !clientRows.some(row => `${row.id}` === `${customerSelection.clientId}`)) {
      setClients(prev => mergeCustomerRows(prev, [fallbackCustomer]))
    }
    if (customerSelection.eventualClientId && fallbackCustomer && !eventualRows.some(row => `${row.id}` === `${customerSelection.eventualClientId}`)) {
      setEventualClients(prev => mergeCustomerRows(prev, [fallbackCustomer]))
    }
    setSelectedClientId(customerSelection.clientId)
    setSelectedEventualClientId(customerSelection.eventualClientId)
    setSelectedDriverId(data?.driver_id ? `${data.driver_id}` : '')
    setSelectedVehicleId(data?.vehicle_id ? `${data.vehicle_id}` : '')
    setSelectedZoneId(data?.zone_id ? `${data.zone_id}` : '')
    await loadBranches(defaultBusinessId, data?.business_branch_id ?? '')
    const detailRows = (data?.items ?? []).map(row => ({ uid: crypto.randomUUID(), commercial_order_item_id: `${row.commercial_order_item_id ?? ''}`, article_id: `${row.article_id ?? ''}`, item_code: row.item_code ?? '', description: row.description ?? '', quantity: Number(row.quantity || 0), delivered_quantity: Number(row.delivered_quantity || 0) }))
    setItems(detailRows.length ? detailRows : [emptyItem(!data)])
    setMapPreview({
      lat: data?.map_lat ?? '',
      lng: data?.map_lng ?? '',
      address: data?.destination_address || data?.origin_address || defaultOriginAddress,
    })
    $(modalRef.current).modal('show')
  }

  const onItemChange = (uid, field, value) => {
    setItems(prev => prev.map(row => {
      if (row.uid !== uid) return row
      const next = { ...row, [field]: value }
      if (field === 'article_id') {
        const article = articleMap[value]
        next.item_code = article?.code ?? ''
        next.description = article?.name ?? next.description
      }
      return next
    }))
  }

  const onVehicleChange = (value) => {
    setSelectedVehicleId(value)
    const vehicle = vehicleMap[value]
    if (vehicle?.zone_id) setSelectedZoneId(`${vehicle.zone_id}`)
  }

  const onSave = async (e) => {
    e.preventDefault()
    const result = await activitiesRest.save({
      id: idRef.current.value || undefined,
      business_id: selectedBusinessId || (businesses[0]?.id ? `${businesses[0].id}` : null),
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      commercial_order_id: selectedOrderId || null,
      dispatch_id: selectedDispatchId || null,
      client_id: stripCustomerPrefix(selectedClientId, 'client') || null,
      eventual_client_id: stripCustomerPrefix(selectedEventualClientId, 'eventual') || null,
      driver_id: selectedDriverId || null,
      vehicle_id: selectedVehicleId || null,
      zone_id: selectedZoneId || null,
      activity_type: activityTypeRef.current.value,
      activity_status: activityStatusRef.current.value,
      transfer_date: transferDateRef.current.value,
      customer_name: customerNameRef.current.value.trim(),
      recipient_document_type: recipientDocumentTypeRef.current.value,
      document_number: documentNumberRef.current.value.trim(),
      manifest_code: manifestCodeRef.current.value.trim(),
      origin_address: originAddressRef.current.value.trim(),
      destination_address: destinationAddressRef.current.value.trim(),
      destination_reference: destinationReferenceRef.current.value.trim(),
      dispatch_contact_name: dispatchContactNameRef.current.value.trim(),
      dispatch_contact_phone: dispatchContactPhoneRef.current.value.trim(),
      ubigeo: ubigeoRef.current.value.trim(),
      map_lat: mapLatRef.current.value.trim(),
      map_lng: mapLngRef.current.value.trim(),
      package_count: packageCountRef.current.value,
      gross_weight: grossWeightRef.current.value,
      observations: observationsRef.current.value.trim(),
      items: items.filter(row => row.article_id || row.description.trim()).map(row => ({
        commercial_order_item_id: row.commercial_order_item_id || null,
        article_id: row.article_id || null,
        item_code: row.item_code,
        description: row.description,
        quantity: row.quantity,
        delivered_quantity: row.delivered_quantity,
      }))
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar actividad', text: 'La actividad quedara inactiva.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const ok = await activitiesRest.delete(id)
    if (!ok) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const applyDateFilters = (e) => {
    e.preventDefault()
    setAppliedDateFilters({ ...dateFilters })
  }

  const exportActivityReport = async () => {
    if (isExportingReport) return

    setIsExportingReport(true)
    try {
      const reportFilter = buildDateFilter(dateFilters)

      const response = await activitiesRest.paginate({
        skip: 0,
        take: 0,
        isLoadingAll: true,
        requireTotalCount: false,
        filter: reportFilter || undefined,
        sort: [{ selector: 'created_at', desc: true }],
      })

      if (response?.status && response.status !== 200) {
        throw new Error(response.message || 'No se pudo generar el reporte')
      }

      const rows = (response?.data ?? []).map(row => [
        getActivityStatusLabel(row.activity_status, ''),
        row.code ?? '',
        row.manifest_code ?? '',
        row.customer_name ?? '',
        getActivityTypeLabel(row.activity_type, ''),
        row.ubigeo ?? '',
        row.destination_address ?? '',
        formatReportDate(row.transfer_date),
        formatReportDate(row.created_at, true),
        formatAuditUser(row.creator),
      ])

      const worksheet = XLSX.utils.aoa_to_sheet([activityReportHeaders, ...rows])
      worksheet['!cols'] = activityReportColumns

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')
      XLSX.writeFile(workbook, `${Math.floor(Date.now() / 1000)}_reporte_pedidos_actividad.xlsx`)
    } catch (error) {
      Swal.fire('No se pudo exportar', error.message || 'Ocurrio un error al generar el Excel', 'error')
    } finally {
      setIsExportingReport(false)
    }
  }

  const listTitle = (
    <div className='activity-list-header'>
      <div className='d-flex justify-content-between align-items-center'>
        <h4 className='header-title mb-0'>Listado</h4>
      </div>
      <ul className='nav nav-tabs nav-bordered mt-3'>
        <li className='nav-item'>
          <span className='nav-link active'>Actividades</span>
        </li>
      </ul>
      <form className='row g-3 align-items-end mt-2' onSubmit={applyDateFilters}>
        <div className='col-12 col-md-5'>
          <label className='form-label'>F. Registro Inicio</label>
          <input
            type='date'
            className='form-control'
            value={dateFilters.start}
            onChange={(e) => setDateFilters(prev => ({ ...prev, start: e.target.value }))}
          />
        </div>
        <div className='col-12 col-md-5'>
          <label className='form-label'>F. Registro Fin</label>
          <input
            type='date'
            className='form-control'
            value={dateFilters.end}
            onChange={(e) => setDateFilters(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
        <div className='col-12 col-md-2 d-flex gap-2'>
          <button type='submit' className='btn btn-outline-primary w-100'>
            <i className='mdi mdi-magnify me-1'></i>Filtrar
          </button>
          <button type='button' className='btn btn-outline-success w-100' onClick={exportActivityReport} disabled={isExportingReport}>
            <i className={`mdi ${isExportingReport ? 'mdi-loading mdi-spin' : 'mdi-file-excel-box'} me-1`}></i>{isExportingReport ? 'Generando...' : 'Reporte'}
          </button>
        </div>
      </form>
    </div>
  )

  return <>
    <style>{`
      .activity-modal-dialog { width: calc(100vw - 32px); max-width: calc(100vw - 32px); }
      .activity-modal-dialog.modal-dialog-centered { align-items: flex-start; margin-top: 1rem; }
      .activity-modal-content { max-height: calc(100vh - 32px); overflow: auto; }
      .activity-modal-body { padding: 0.95rem 1.15rem 1.35rem; }
      .activity-modal-body label { font-size: .72rem; color: #30384d; margin-bottom: .28rem; }
      .activity-modal-body .form-control,
      .activity-modal-body .form-select { min-height: 29px; border-radius: 0; font-size: .74rem; padding: .25rem .55rem; }
      .activity-modal-body .btn { border-radius: 0; font-size: .72rem; font-weight: 700; }
      .activity-toolbar { border-bottom: 1px solid #e5e7eb; padding: .7rem 0 1rem; text-align: center; }
      .activity-title { color: #555c68; font-size: 1.18rem; font-weight: 700; text-align: center; margin: 1.55rem 0 1.1rem; }
      .activity-separator { border-top: 1px solid #e8eaef; margin: 1rem 0; }
      .activity-map { width: 100%; height: 190px; border: 1px solid #d8dde6; overflow: hidden; background: #edf2f7; }
      .activity-map iframe { width: 100%; height: 100%; border: 0; display: block; }
      .activity-map-empty { height: 100%; display: flex; align-items: center; justify-content: center; padding: 14px; color: #687385; text-align: center; }
      .activity-items-table { width: 100%; border-collapse: collapse; margin-top: .9rem; }
      .activity-items-table th,
      .activity-items-table td { border: 1px solid #e1e5ec; padding: .45rem; vertical-align: middle; }
      .activity-items-table th { font-size: .7rem; color: #30384d; text-transform: uppercase; }
      .activity-total-label { font-style: italic; font-weight: 700; text-align: right; }
    `}</style>
    <Table
      gridRef={gridRef}
      title={listTitle}
      rest={activitiesRest}
      pageSize={10}
      filterValue={activityGridFilter}
      // Mismo caso que en Despacho: sin esto la tabla publica su filtro interno y deja borrarlo.
      allowQueryBuilder={false}
      exportable
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        { caption: 'Acciones', width: 165, minWidth: 165, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css({ 'text-overflow': 'unset', overflow: 'visible', 'white-space': 'nowrap' })
          container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.activity(data)) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
        } },
        { dataField: 'activity_status', caption: 'E. Pedido', width: 115, lookup: toLookup(activityStatusOptions) },
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 110,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar actividad')
        },
        { dataField: 'manifest_code', caption: 'Manifiesto', width: 130 },
        { dataField: 'customer_name', caption: 'Cliente', minWidth: 180 },
        { dataField: 'activity_type', caption: 'Tipo', width: 110, lookup: toLookup(activityTypeOptions) },
        { dataField: 'ubigeo', caption: 'Ubigeo', width: 120 },
        { dataField: 'destination_address', caption: 'Direccion', minWidth: 230 },
        { dataField: 'transfer_date', caption: 'Fecha traslado', dataType: 'date', width: 130 },
        { dataField: 'created_at', caption: 'Fecha registro', dataType: 'datetime', width: 155 },
        { dataField: 'creator.fullname', caption: 'Usuario registro', width: 145, cellTemplate: (container, { data }) => container.text(formatAuditUser(data.creator)) },
      ]}
    />

    <Modal
      modalRef={modalRef}
      title={<h4 className='modal-title'><i className='mdi mdi-menu me-1'></i> REGISTRAR PEDIDO</h4>}
      size='xl'
      onSubmit={onSave}
      hideFooter
      dialogClass='activity-modal-dialog'
      contentClass='activity-modal-content'
      bodyClass='activity-modal-body'
    >
      <div>
        <input ref={idRef} hidden />
        <input ref={codeRef} type='hidden' />
        <input ref={activityStatusRef} type='hidden' />
        <input ref={manifestCodeRef} type='hidden' />
        <input ref={destinationReferenceRef} type='hidden' />
        <input ref={dispatchContactNameRef} type='hidden' />
        <input ref={dispatchContactPhoneRef} type='hidden' />

        <div className='activity-toolbar'>
          <button type='submit' className='btn btn-outline-primary me-2'><i className='mdi mdi-plus me-1'></i> Guardar</button>
          <button type='button' className='btn btn-light' data-bs-dismiss='modal'><i className='mdi mdi-close me-1'></i> Cerrar</button>
        </div>

        <div className='activity-title'>Actividad N°</div>

        <div className='row g-3'>
          <div className='col-md-3'>
            <label>Seleccione cliente</label>
            <select className='form-select' value={selectedCustomerKey} onChange={(e) => onCustomerChange(e.target.value)}>
              <option value=''>Seleccione Cliente</option>
              {clients.map(row => <option key={`activity-client-${row.id}`} value={`client-${row.id}`}>{clientLabel(row)}</option>)}
              {eventualClients.map(row => <option key={`activity-eventual-${row.id}`} value={`eventual-${row.id}`}>{eventualClientLabel(row)}</option>)}
            </select>
          </div>
          <div className='col-md-3'>
            <label>Tipo</label>
            <select ref={activityTypeRef} className='form-select'>
              {activityTypeOptions.map((option) => (
                <option key={`activity-type-${option.value}`} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className='col-md-2'>
            <label>Fecha de Traslado</label>
            <input ref={transferDateRef} type='date' className='form-control' required />
          </div>
        </div>

        <div className='activity-separator' />
        <div className='row g-3'>
          <div className='col-md-3'>
            <label>Direccion de partida</label>
            <select ref={originAddressRef} className='form-select' onChange={syncMapPreview}>
              <option value={defaultOriginAddress}>{defaultOriginAddress}</option>
            </select>
          </div>
          <div className='col-md-2'>
            <label>Ubigeo entrega</label>
            <input ref={ubigeoRef} className='form-control' placeholder='Seleccione Ubigeo' />
          </div>
          <div className='col-md-3'>
            <label>Direccion de entrega</label>
            <input ref={destinationAddressRef} className='form-control' placeholder='Introduce una ubicacion' onChange={syncMapPreview} />
          </div>
          <div className='col-md-2'>
            <label>Latitud</label>
            <input ref={mapLatRef} className='form-control' onChange={syncMapPreview} />
          </div>
          <div className='col-md-2'>
            <label>Longitud</label>
            <input ref={mapLngRef} className='form-control' onChange={syncMapPreview} />
          </div>
        </div>

        <div className='activity-separator' />
        <div className='activity-map'>
          {mapUrl ? (
            <iframe title='Mapa de actividad' src={mapUrl} loading='lazy' referrerPolicy='no-referrer-when-downgrade'></iframe>
          ) : (
            <div className='activity-map-empty'>Configura Google Maps API Key en Sistemas &gt; Datos generales &gt; Integraciones para ver el mapa.</div>
          )}
        </div>

        <div className='row g-3 mt-2'>
          <div className='col-md-4'>
            <label>Vehiculo</label>
            <select className='form-select' value={selectedVehicleId} onChange={(e) => onVehicleChange(e.target.value)}>
              <option value=''>Seleccionar vehiculo</option>
              {vehicles.map(row => <option key={`activity-vehicle-${row.id}`} value={row.id}>{row.plate} - {row.label ?? row.code}</option>)}
            </select>
          </div>
          <div className='col-md-4'>
            <label>Conductor</label>
            <select className='form-select' value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}>
              <option value=''>Seleccionar conductor</option>
              {drivers.map(row => <option key={`activity-driver-${row.id}`} value={row.id}>{row.code} - {row.full_name}</option>)}
            </select>
          </div>
          <div className='col-md-2'>
            <label>Nro Bultos</label>
            <input ref={packageCountRef} type='number' className='form-control' />
          </div>
          <div className='col-md-2'>
            <label>Peso Bruto Total</label>
            <input ref={grossWeightRef} type='number' step='0.01' className='form-control' />
          </div>
          <div className='col-md-3'>
            <label>Tipo documento - DESTINATARIO</label>
            <select ref={recipientDocumentTypeRef} className='form-select' defaultValue='DNI'>
              <option>DNI</option>
              <option>RUC</option>
              <option>CE</option>
              <option>OTRO</option>
            </select>
          </div>
          <div className='col-md-3'>
            <label>N° documento - DESTINATARIO</label>
            <input ref={documentNumberRef} className='form-control' />
          </div>
          <div className='col-md-6'>
            <label>Nombres completos - DESTINATARIO</label>
            <input ref={customerNameRef} className='form-control' />
          </div>
          <div className='col-12'>
            <label>Observaciones</label>
            <textarea ref={observationsRef} className='form-control' rows='2' />
          </div>
        </div>

        <div className='activity-separator' />
        <button type='button' className='btn btn-outline-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}>
          <i className='mdi mdi-plus-circle me-1'></i> INSERTAR ITEM
        </button>

        <table className='activity-items-table'>
          <thead>
            <tr>
              <th style={{ width: '17%' }}>Codigo</th>
              <th>Descripcion</th>
              <th style={{ width: '14%' }}>Cantidad</th>
              <th style={{ width: 44 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map(row => (
              <tr key={row.uid}>
                <td><input className='form-control' value={row.item_code} onChange={(e) => onItemChange(row.uid, 'item_code', e.target.value)} /></td>
                <td><input className='form-control' value={row.description} onChange={(e) => onItemChange(row.uid, 'description', e.target.value)} /></td>
                <td><input type='number' step='0.001' className='form-control' value={row.quantity} onChange={(e) => onItemChange(row.uid, 'quantity', e.target.value)} /></td>
                <td><button type='button' className='btn btn-outline-danger w-100' onClick={() => setItems(prev => prev.length === 1 ? [emptyItem()] : prev.filter(item => item.uid !== row.uid))}>x</button></td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} className='activity-total-label'>Total</td>
              <td><input className='form-control' value={items.reduce((sum, row) => sum + Number(row.quantity || 0), 0)} disabled /></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.can('activity') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Actividades'><Activities {...properties} /></BaseAdminto>)
})
