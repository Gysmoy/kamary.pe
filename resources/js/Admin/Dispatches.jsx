import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import VdUbigeoCascade from '@Adminto/VdUbigeoCascade';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import Modal from '../Components/Adminto/Modal';
import Swal from 'sweetalert2';
import CommercialOrdersRest from '../Actions/Admin/CommercialOrdersRest';
import DispatchesRest from '../Actions/Admin/DispatchesRest';
import ReferralGuidesRest from '../Actions/Admin/ReferralGuidesRest';
import ZonesRest from '../Actions/Admin/ZonesRest';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import { EMPTY_UBIGEO_SELECTION } from '../Utils/ubigeoInei';
import {
  dispatchStatusOptions,
  getDispatchStatusLabel,
  getShiftLabel,
  getReferralGuideStatusLabel,
  shiftOptions,
} from '../Utils/statusLabels';

const dispatchesRest = new DispatchesRest()
const commercialOrdersRest = new CommercialOrdersRest()
const referralGuidesRest = new ReferralGuidesRest()
const zonesRest = new ZonesRest()
const emptyAssignment = () => ({ uid: crypto.randomUUID(), commercial_order_id: '', customer_name: '', total: 0 })
const operationalDispatchStatuses = ['pending', 'preparing', 'dispatched', 'in_route', 'delivered', 'cancelled']
const manifestTabs = [
  { value: 'pending', label: 'Manifiestos de carga' },
  { value: 'approved', label: 'Manifiestos de carga Aprobados' },
]
const pendingManifestStatuses = ['pending', 'preparing', 'dispatched', 'waiting', 'assigned']
const approvedManifestStatuses = ['approved', 'in_route', 'delivered', 'closed']
// Un manifiesto cancelado no es pendiente ni aprobado, pero tiene que verse en alguna pestana:
// como el formulario deja elegir "Cancelado", al guardarlo desaparecia de las dos y el registro
// quedaba inaccesible desde el modulo. Va en la primera, con su badge rojo.
// Ojo: lista aparte de pendingManifestStatuses a proposito, porque esa manda sobre que acciones
// se habilitan (editar, asignar, eliminar) y un cancelado no debe recuperarlas.
const pendingTabStatuses = [...pendingManifestStatuses, 'cancelled']
const manifestReportHeaders = [
  'ACCIONES',
  'ESTADO',
  'CODIGO',
  'FECHA ENTREGA',
  'TURNO',
  'VEHICULO',
  'CONDUCTORES',
  'ZONA',
  'USUARIO REGISTRO',
  'FECHA REGISTRO',
]
const manifestReportColumns = [
  { wpx: 110 },
  { wpx: 110 },
  { wpx: 110 },
  { wpx: 110 },
  { wpx: 90 },
  { wpx: 190 },
  { wpx: 260 },
  { wpx: 150 },
  { wpx: 150 },
  { wpx: 170 },
]
const dispatchAssignments = (dispatch) => dispatch?.assignments ?? []
const dispatchGuides = (dispatch) => dispatch?.referral_guides ?? dispatch?.referralGuides ?? []
const dispatchEvidences = (dispatch) => dispatch?.delivery_evidences ?? dispatch?.deliveryEvidences ?? []
const assignmentOrder = (assignment) => assignment?.commercial_order ?? assignment?.commercialOrder
const orderDispatchAssignments = (order) => order?.dispatch_assignments ?? order?.dispatchAssignments ?? []
const isEnabledRecord = (value) => value !== null && value !== false && value !== 0 && `${value}` !== '0'
const textValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value.address ?? value.reference ?? value.name ?? value.description ?? fallback
  const text = `${value}`.trim()
  return text === '[object Object]' ? fallback : text
}
const orderDeliveryAddress = (order) => textValue(order?.delivery_address ?? order?.dispatch_address)
const evidenceProgress = (dispatch) => {
  const assignments = dispatchAssignments(dispatch)
  const evidences = dispatchEvidences(dispatch)
  const assignmentIds = new Set(assignments.map((assignment) => `${assignment?.commercial_order_id ?? assignmentOrder(assignment)?.id ?? ''}`).filter(Boolean))
  const covered = new Set(evidences
    .map((evidence) => `${evidence?.commercial_order_id ?? ''}`)
    .filter((orderId) => assignmentIds.has(orderId)))
  return { covered: covered.size, total: assignments.length, pending: Math.max(0, assignments.length - covered.size) }
}
const guideNumber = (guide) => guide?.external_reference || [guide?.series, guide?.sequence].filter(Boolean).join('-') || guide?.code || '-'
const canIssueGuide = (guide) => guide && !['accepted', 'cancelled'].includes(guide.guide_status)
const canCancelGuide = (guide) => guide && guide.guide_status !== 'cancelled'
const providerFileTypes = ['pdf', 'xml', 'cdr']
const nowDateTimeLocal = () => {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}
const isEvidenceImage = (value) => {
  const url = `${value ?? ''}`.toLowerCase()
  return /\.(png|jpe?g|webp|gif)(\?.*)?$/.test(url) || url.includes('/delivery-evidence-media/')
}
const isSameEvidenceTarget = (left, right) => (
  `${left?.commercial_order_id ?? ''}` === `${right?.commercial_order_id ?? ''}`
  && `${left?.dispatch_id ?? ''}` === `${right?.dispatch_id ?? ''}`
)
const guideResponsePayload = (guide) => {
  const payload = guide?.response_payload ?? guide?.responsePayload
  if (!payload) return {}
  if (typeof payload === 'object') return payload
  try {
    return JSON.parse(payload)
  } catch (error) {
    return {}
  }
}
const guideProviderLink = (guide, type) => guideResponsePayload(guide)?.links?.[type]
const orFilters = (filters) => filters.filter(Boolean).reduce((acc, filter) => acc ? [acc, 'or', filter] : filter, null)
const andFilters = (filters) => filters.filter(Boolean).reduce((acc, filter) => acc ? [acc, 'and', filter] : filter, null)
const manifestStatusFilter = (tab) => orFilters((tab === 'approved' ? approvedManifestStatuses : pendingTabStatuses).map(status => ['dispatch_status', '=', status]))
const manifestStatus = (dispatch) => `${dispatch?.dispatch_status ?? ''}`.trim()
const isPendingManifest = (dispatch) => pendingManifestStatuses.includes(manifestStatus(dispatch))
const isClosedManifest = (dispatch) => manifestStatus(dispatch) === 'closed'
const canConfirmManifest = (dispatch) => approvedManifestStatuses.includes(manifestStatus(dispatch)) && !isClosedManifest(dispatch)
const formatAuditUser = (user) => {
  if (!user) return ''
  return [user.name, user.lastname].filter(Boolean).join(' ').trim() || user.fullname || user.username || ''
}
const formatDateText = (value, withTime = false) => {
  const text = `${value ?? ''}`.trim()
  if (!text) return ''
  return text.replace('T', ' ').slice(0, withTime ? 19 : 10)
}
const manifestCode = (dispatch) => dispatch?.manifest_code || dispatch?.code || '-'
const manifestShift = (dispatch) => {
  const shift = dispatch?.shift
  if (`${shift ?? ''}` === 'Manana') return 'MANANA'
  return getShiftLabel(shift, '').toUpperCase()
}
const manifestVehicle = (dispatch) => [
  dispatch?.vehicle?.plate ?? dispatch?.vehicle_plate,
  dispatch?.vehicle?.label ?? dispatch?.vehicle_label,
].filter(Boolean).join(' - ') || '-'
const manifestDrivers = (dispatch) => {
  const mainDriver = dispatch?.driver?.full_name ?? dispatch?.driver_name
  const copilot = dispatch?.copilot_name
  return [mainDriver, copilot].filter(Boolean).join(' - ') || '-'
}
const manifestZone = (dispatch) => dispatch?.zone_master?.name ?? dispatch?.zoneMaster?.name ?? dispatch?.zone ?? '-'
const manifestStatusMeta = (status) => {
  if (['waiting', 'assigned', 'pending', 'preparing', 'dispatched'].includes(status)) {
    return { label: 'En espera', className: 'badge badge-soft-warning' }
  }
  if (['approved', 'in_route', 'delivered'].includes(status)) {
    return { label: 'Aprobado', className: 'badge badge-soft-success' }
  }
  if (status === 'closed') {
    return { label: 'Cerrado', className: 'badge badge-soft-info' }
  }
  if (status === 'cancelled') {
    return { label: 'Cancelado', className: 'badge badge-soft-danger' }
  }
  return { label: getDispatchStatusLabel(status), className: 'badge badge-soft-secondary' }
}
const optionsOf = (rows, label) => (rows ?? []).map(row => ({ value: `${row.id}`, label: label(row) }))
const todayLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
const DispatchSection = ({ icon, title, children, aside = null }) => <section className='dispatch-form-section'>
  <div className='d-flex justify-content-between align-items-start gap-2'>
    <div className='dispatch-form-section-title'><i className={icon}></i><span>{title}</span></div>
    {aside}
  </div>
  <div className='row g-2'>{children}</div>
</section>
const googleMapsRouteUrl = (dispatch) => {
  const stops = [...new Set(dispatchAssignments(dispatch)
    .map((assignment) => orderDeliveryAddress(assignmentOrder(assignment)))
    .filter(Boolean))]
  if (stops.length === 0) return null
  if (stops.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stops[0])}`
  }
  const destination = stops[stops.length - 1]
  const waypoints = stops.slice(0, -1).join('|')
  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}`
}

const Dispatches = ({ session }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const zoneModalRef = useRef()
  const guideModalRef = useRef()
  const evidenceModalRef = useRef()
  const evidenceFormModalRef = useRef()
  const evidenceFileRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const scheduledDateRef = useRef()
  const copilotNameRef = useRef()
  const manifestCodeRef = useRef()
  const observationsRef = useRef()
  const zoneIdRef = useRef()
  const zoneNameRef = useRef()
  const zoneReferenceRef = useRef()
  const zoneObservationsRef = useRef()

  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [orders, setOrders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [zones, setZones] = useState([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [shift, setShift] = useState('Manana')
  const [dispatchStatus, setDispatchStatus] = useState('dispatched')
  const [zoneBusinessId, setZoneBusinessId] = useState('')
  const [activeManifestTab, setActiveManifestTab] = useState('pending')
  const [manifestFilters, setManifestFilters] = useState({ startDate: '', endDate: '' })
  const [appliedManifestFilters, setAppliedManifestFilters] = useState({ startDate: '', endDate: '' })
  const [isExportingManifest, setIsExportingManifest] = useState(false)
  const [currentDispatchId, setCurrentDispatchId] = useState('')
  const [assignments, setAssignments] = useState([emptyAssignment()])
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingZone, setIsEditingZone] = useState(false)
  const [zoneLocation, setZoneLocation] = useState(EMPTY_UBIGEO_SELECTION)
  const [selectedGuideDispatch, setSelectedGuideDispatch] = useState(null)
  const [selectedGuides, setSelectedGuides] = useState([])
  const [selectedEvidenceDispatch, setSelectedEvidenceDispatch] = useState(null)
  const [selectedEvidences, setSelectedEvidences] = useState([])
  const [evidenceOrder, setEvidenceOrder] = useState(null)
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [evidencePreview, setEvidencePreview] = useState('')
  const [evidenceForm, setEvidenceForm] = useState({
    recipient_name: '',
    recipient_document_type: 'DNI',
    recipient_document_number: '',
    recipient_phone: '',
    delivered_at: '',
    evidence_notes: '',
    evidence_url: '',
    latitude: '',
    longitude: '',
  })
  const isDriverSession = Boolean(session?.is_driver)

  const orderMap = useMemo(() => Object.fromEntries(orders.map(order => [`${order.id}`, order])), [orders])
  const warehouseMap = useMemo(() => Object.fromEntries(warehouses.map(row => [`${row.id}`, row])), [warehouses])
  const driverMap = useMemo(() => Object.fromEntries(drivers.map(row => [`${row.id}`, row])), [drivers])
  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(row => [`${row.id}`, row])), [vehicles])
  const zoneMap = useMemo(() => Object.fromEntries(zones.map(row => [`${row.id}`, row])), [zones])
  const orderBelongsToCurrentDispatch = (order, dispatchId = currentDispatchId) => (
    !!dispatchId && orderDispatchAssignments(order).some((assignment) => (
      isEnabledRecord(assignment?.status)
      && `${assignment?.dispatch_id ?? assignment?.dispatch?.id ?? ''}` === `${dispatchId}`
    ))
  )
  const activeAssignmentForOtherDispatch = (order, dispatchId = currentDispatchId) => (
    orderDispatchAssignments(order).find((assignment) => {
      const dispatch = assignment?.dispatch
      if (!isEnabledRecord(assignment?.status) || !dispatch || !isEnabledRecord(dispatch?.status)) return false
      if (`${assignment?.dispatch_id ?? dispatch?.id ?? ''}` === `${dispatchId ?? ''}`) return false
      return `${dispatch?.dispatch_status ?? ''}` !== 'cancelled'
    }) ?? null
  )
  const availableOrders = useMemo(() => (
    orders.filter(order => {
      if (selectedBusinessId && `${order.business_id}` !== `${selectedBusinessId}`) return false
      if (!selectedWarehouseId) return false
      if (`${order.warehouse_id}` !== `${selectedWarehouseId}`) return false
      if (orderBelongsToCurrentDispatch(order)) return true
      if (activeAssignmentForOtherDispatch(order)) return false
      return `${order.dispatch_status ?? ''}` === 'dispatched'
    })
  ), [orders, selectedBusinessId, selectedWarehouseId, currentDispatchId])
  const selectedAssignmentOrderIds = useMemo(() => (
    new Set(assignments.map(row => `${row.commercial_order_id ?? ''}`).filter(Boolean))
  ), [assignments])
  const selectedAvailableOrderCount = useMemo(() => (
    availableOrders.filter(order => selectedAssignmentOrderIds.has(`${order.id}`)).length
  ), [availableOrders, selectedAssignmentOrderIds])
  const canAddAssignment = useMemo(() => (
    !!selectedWarehouseId && availableOrders.some(order => !selectedAssignmentOrderIds.has(`${order.id}`))
  ), [availableOrders, selectedAssignmentOrderIds, selectedWarehouseId])
  const dispatchGridFilter = useMemo(() => andFilters([
    manifestStatusFilter(activeManifestTab),
    appliedManifestFilters.startDate ? ['scheduled_date', '>=', appliedManifestFilters.startDate] : null,
    appliedManifestFilters.endDate ? ['scheduled_date', '<=', appliedManifestFilters.endDate] : null,
  ]), [activeManifestTab, appliedManifestFilters])

  const refreshZones = async () => {
    const zoneList = await dispatchesRest.getZones()
    setZones(zoneList ?? [])
    return zoneList ?? []
  }

  const refreshGrid = async () => {
    await tableRef.current?.refresh()
  }

  const normalizeDispatchOrders = (orderList = []) => (
    (orderList ?? []).filter(row => row.status !== null && row.order_status !== 'cancelled' && row.dispatch_status !== 'delivered' && row.dispatch_status !== 'cancelled')
  )

  const loadCommercialOrders = async () => {
    setIsLoadingOrders(true)
    try {
      const orderList = await dispatchesRest.getCommercialOrders()
      const normalized = normalizeDispatchOrders(orderList)
      setOrders(normalized)
      return normalized
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const loadCatalogs = async () => {
    if (isDriverSession) {
      const businessList = await dispatchesRest.getBusinesses()
      setBusinesses(businessList ?? [])
      return
    }

    const [businessList, warehouseList, orderList, driverList, vehicleList, zoneList] = await Promise.all([
      dispatchesRest.getBusinesses(),
      dispatchesRest.getWarehouses(),
      dispatchesRest.getCommercialOrders(),
      dispatchesRest.getDrivers(),
      dispatchesRest.getVehicles(),
      refreshZones(),
    ])
    setBusinesses(businessList)
    setWarehouses(warehouseList)
    setOrders(normalizeDispatchOrders(orderList))
    setDrivers(driverList ?? [])
    setVehicles(vehicleList ?? [])
    setZones(zoneList ?? [])
  }

  useEffect(() => { loadCatalogs() }, [isDriverSession])
  useEffect(() => () => {
    if (evidencePreview?.startsWith('blob:')) URL.revokeObjectURL(evidencePreview)
  }, [evidencePreview])

  const loadBranches = async (businessId, preferred = '') => {
    const data = await dispatchesRest.getBranchesByBusiness(businessId)
    setBranches(data ?? [])
    setSelectedBranchId(preferred ? `${preferred}` : '')
  }

  // Red de seguridad para la empresa unica: si el catalogo llega despues de que se abrio el modal,
  // onModalOpen no tenia con que autoseleccionar y el campo, al estar oculto, dejaria el formulario
  // sin empresa y sin manera de arreglarlo desde la pantalla.
  useEffect(() => {
    if (businesses.length !== 1 || selectedBusinessId) return
    const onlyBusinessId = `${businesses[0].id}`
    setSelectedBusinessId(onlyBusinessId)
    loadBranches(onlyBusinessId, '')
  }, [businesses, selectedBusinessId])

  const onModalOpen = async (data = null) => {
    setCurrentDispatchId(data?.id ? `${data.id}` : '')
    await loadCommercialOrders()
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    scheduledDateRef.current.value = data?.scheduled_date?.toString?.().slice?.(0, 10) ?? todayLima()
    setShift(data?.shift ?? 'Manana')
    copilotNameRef.current.value = data?.copilot_name ?? ''
    manifestCodeRef.current.value = data?.manifest_code ?? ''
    setDispatchStatus(data?.dispatch_status ?? 'dispatched')
    observationsRef.current.value = data?.observations ?? ''
    // Si el modulo solo alcanza una empresa, se elige sola: el campo esta oculto y sin esto el
    // formulario no se podria guardar (business_id es obligatorio en el backend).
    const soleBusinessId = businesses.length === 1 ? `${businesses[0].id}` : ''
    const businessId = data?.business_id ? `${data.business_id}` : soleBusinessId
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(data?.warehouse_id ? `${data.warehouse_id}` : '')
    setSelectedDriverId(data?.driver_id ? `${data.driver_id}` : '')
    setSelectedVehicleId(data?.vehicle_id ? `${data.vehicle_id}` : '')
    setSelectedZoneId(data?.zone_id ? `${data.zone_id}` : '')
    await loadBranches(businessId, data?.business_branch_id ?? '')
    const currentAssignments = (data?.assignments ?? []).map(row => ({ uid: crypto.randomUUID(), commercial_order_id: `${row.commercial_order_id}`, customer_name: row.customer_name ?? '', total: Number(row.total || 0) }))
    setAssignments(currentAssignments.length ? currentAssignments : [emptyAssignment()])
    $(modalRef.current).modal('show')
  }

  const onAssignmentChange = (uid, value) => {
    const order = orderMap[value]
    if (!order) {
      setAssignments(prev => prev.map(row => row.uid === uid ? { ...row, commercial_order_id: '', customer_name: '', total: 0 } : row))
      return
    }

    if (assignments.some(row => row.uid !== uid && `${row.commercial_order_id}` === `${value}`)) {
      Swal.fire('Pedido ya seleccionado', 'Este pedido ya esta agregado al despacho.', 'warning')
      return
    }
    if (selectedBusinessId && `${order.business_id}` !== `${selectedBusinessId}`) {
      Swal.fire('Empresa distinta', 'El pedido no pertenece a la empresa seleccionada.', 'warning')
      return
    }
    if (!selectedWarehouseId || `${order.warehouse_id}` !== `${selectedWarehouseId}`) {
      Swal.fire('Almacen distinto', 'El pedido no pertenece al almacen seleccionado. Cambia el almacen del despacho para verlo.', 'warning')
      return
    }

    if (!selectedZoneId && order?.ubigeo) {
      const matchedZone = zones.find(zone => `${zone?.ubigeo ?? ''}`.trim() !== '' && `${zone.ubigeo}` === `${order.ubigeo}`)
      if (matchedZone) setSelectedZoneId(`${matchedZone.id}`)
    }
    if (order?.dispatch_status === 'dispatched' && ['pending', 'preparing'].includes(dispatchStatus)) {
      setDispatchStatus('dispatched')
    }
    setAssignments(prev => prev.map(row => row.uid === uid ? {
      ...row,
      commercial_order_id: value,
      customer_name: order ? (order.client?.full_name ?? order.eventual_client?.business_name ?? order.eventualClient?.business_name ?? '') : '',
      total: Number(order?.total || 0)
    } : row))
  }

  const orderOptionLabel = (order) => {
    const customer = order.client?.full_name ?? order.eventual_client?.business_name ?? order.eventualClient?.business_name ?? 'Cliente'
    const warehouse = warehouseMap[order.warehouse_id]?.name ?? `Almacen ${order.warehouse_id ?? '-'}`
    return `${order.code} - ${customer} | ${warehouse}`
  }

  const isOrderSelectedInOtherAssignment = (orderId, uid) => (
    assignments.some(row => row.uid !== uid && `${row.commercial_order_id}` === `${orderId}`)
  )

  const onVehicleChange = (value) => {
    setSelectedVehicleId(value)
    const vehicle = vehicleMap[value]
    if (vehicle?.zone_id) setSelectedZoneId(`${vehicle.zone_id}`)
  }

  const openZoneModal = (zone = null) => {
    setIsEditingZone(!!zone?.id)
    zoneIdRef.current.value = zone?.id ?? ''
    setZoneBusinessId(`${zone?.business_id ?? selectedBusinessId ?? ''}`)
    zoneNameRef.current.value = zone?.name ?? ''
    zoneReferenceRef.current.value = zone?.reference ?? ''
    zoneObservationsRef.current.value = zone?.observations ?? ''
    setZoneLocation({
      ubigeo: zone?.ubigeo ?? '',
      department: zone?.department ?? '',
      province: zone?.province ?? '',
      district: zone?.district ?? '',
    })
    $(zoneModalRef.current).modal('show')
  }

  const onOpenSelectedZone = () => {
    const zone = zoneMap[selectedZoneId]
    if (!zone) return
    openZoneModal(zone)
  }

  const onSaveZone = async (e) => {
    e.preventDefault()
    const request = {
      id: zoneIdRef.current.value || undefined,
      business_id: zoneBusinessId || null,
      name: zoneNameRef.current.value.trim(),
      ubigeo: zoneLocation.ubigeo.trim(),
      department: zoneLocation.department.trim(),
      province: zoneLocation.province.trim(),
      district: zoneLocation.district.trim(),
      reference: zoneReferenceRef.current.value.trim(),
      observations: zoneObservationsRef.current.value.trim(),
    }
    const result = await zonesRest.save(request)
    if (!result) return
    const zoneList = await refreshZones()
    const matchedZone = [...zoneList].reverse().find((row) =>
      `${row.business_id ?? ''}` === `${request.business_id ?? ''}`
      && `${row.name ?? ''}`.trim().toLowerCase() === request.name.toLowerCase()
      && `${row.ubigeo ?? ''}` === request.ubigeo
    )
    if (matchedZone) setSelectedZoneId(`${matchedZone.id}`)
    $(zoneModalRef.current).modal('hide')
  }

  const openGuidesModal = (dispatch, guides = null) => {
    setSelectedGuideDispatch(dispatch)
    setSelectedGuides(guides ?? dispatchGuides(dispatch))
    $(guideModalRef.current).modal('show')
  }

  const onShowGuides = async (dispatch) => {
    const guides = dispatchGuides(dispatch)
    if (guides.length > 0) return openGuidesModal(dispatch, guides)

    const result = await referralGuidesRest.prepareFromDispatch(dispatch.id)
    if (!result) return
    await refreshGrid()
    openGuidesModal(dispatch, result.data ?? [])
  }

  const onPrepareGuides = async () => {
    if (!selectedGuideDispatch?.id) return
    const result = await referralGuidesRest.prepareFromDispatch(selectedGuideDispatch.id)
    if (!result) return
    setSelectedGuides(result.data ?? [])
    await refreshGrid()
  }

  const onIssueGuide = async (guide) => {
    if (!guide?.id) return
    const { isConfirmed } = await Swal.fire({
      title: 'Emitir guia',
      text: `Se emitira la guia ${guideNumber(guide)} en el modo de facturacion configurado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Emitir',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await referralGuidesRest.issue(guide.id)
    if (!result?.data) return
    setSelectedGuides(prev => prev.map(row => row.id === guide.id ? result.data : row))
    await refreshGrid()
  }

  const onIssuePendingGuides = async () => {
    const pending = selectedGuides.filter(canIssueGuide)
    if (pending.length === 0) return
    const { isConfirmed } = await Swal.fire({
      title: 'Emitir guias pendientes',
      text: `Se emitiran ${pending.length} guia(s) en el modo de facturacion configurado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Emitir',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const issued = []
    for (const guide of pending) {
      const result = await referralGuidesRest.issue(guide.id)
      if (result?.data) issued.push(result.data)
    }

    if (issued.length > 0) {
      setSelectedGuides(prev => prev.map(row => issued.find(item => item.id === row.id) ?? row))
      await refreshGrid()
    }
  }

  const onCancelGuide = async (guide) => {
    if (!guide?.id || !canCancelGuide(guide)) return
    const accepted = guide.guide_status === 'accepted'
    const { isConfirmed, value } = await Swal.fire({
      title: accepted ? 'Anular guia fiscal' : 'Anular guia',
      text: accepted
        ? 'Se enviara la anulacion al facturador en el modo configurado.'
        : 'La guia se anulara localmente.',
      input: 'textarea',
      inputLabel: 'Motivo',
      inputPlaceholder: 'Motivo de anulacion',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Anular',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await referralGuidesRest.cancel(guide.id, value ?? '')
    if (!result?.data) return
    setSelectedGuides(prev => prev.map(row => row.id === guide.id ? result.data : row))
    await refreshGrid()
  }

  const onShowEvidences = (dispatch) => {
    setSelectedEvidenceDispatch(dispatch)
    setSelectedEvidences(dispatchEvidences(dispatch))
    $(evidenceModalRef.current).modal('show')
  }

  const onStartRoute = async (dispatch) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Generar manifiesto',
      text: `El despacho ${dispatch.code} pasara a En ruta y se generara el manifiesto si aun no existe.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Generar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return

    const result = await dispatchesRest.save({
      id: dispatch.id,
      business_id: dispatch.business_id,
      business_branch_id: dispatch.business_branch_id,
      warehouse_id: dispatch.warehouse_id,
      scheduled_date: dispatch.scheduled_date?.toString?.().slice?.(0, 10) ?? todayLima(),
      shift: dispatch.shift ?? '',
      driver_id: dispatch.driver_id ?? null,
      copilot_name: dispatch.copilot_name ?? '',
      vehicle_id: dispatch.vehicle_id ?? null,
      zone_id: dispatch.zone_id ?? null,
      manifest_code: dispatch.manifest_code ?? '',
      dispatch_status: 'in_route',
      observations: dispatch.observations ?? '',
      assignments: dispatchAssignments(dispatch).map((assignment) => ({
        commercial_order_id: assignment?.commercial_order_id ?? assignmentOrder(assignment)?.id,
      })).filter((assignment) => assignment.commercial_order_id),
    })
    if (!result?.data) return

    await refreshGrid()
    await openDispatchManifestPdf(result.data)
  }

  const onConfirmManifestConformity = async (dispatch) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Conformidad de manifiesto',
      text: `Se cerrara el manifiesto ${manifestCode(dispatch)}. Luego solo se podra previsualizar/imprimir el PDF.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Dar conformidad',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return

    const result = await dispatchesRest.confirmManifestConformity(dispatch.id)
    if (!result?.data) return
    await refreshGrid()
  }

  const openDispatchManifestPdf = async (dispatch) => {
    const detail = dispatch?.id ? await dispatchesRest.get(dispatch.id) : null
    await openMagistralesRecordPdf(buildMagistralesRows.dispatch(detail ?? dispatch))
  }

  const onOpenRoute = (dispatch) => {
    const url = googleMapsRouteUrl(dispatch)
    if (!url) {
      Swal.fire('Ruta no disponible', 'Los pedidos asignados no tienen direccion de entrega registrada.', 'info')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const latestEvidenceForOrder = (orderId) => selectedEvidences.find((evidence) => `${evidence.commercial_order_id}` === `${orderId}`) ?? null

  const clearEvidenceForm = () => {
    setEvidenceOrder(null)
    setEvidenceFile(null)
    setEvidencePreview('')
    if (evidenceFileRef.current) evidenceFileRef.current.value = ''
  }

  const closeDispatchEvidenceForm = () => {
    clearEvidenceForm()
    if (selectedEvidenceDispatch?.id) {
      setTimeout(() => $(evidenceModalRef.current).modal('show'), 320)
    }
  }

  const openDispatchEvidenceForm = (assignment) => {
    const order = assignmentOrder(assignment) ?? {}
    const orderId = assignment?.commercial_order_id ?? order?.id
    if (!orderId) return

    const evidence = latestEvidenceForOrder(orderId)
    const normalizedOrder = {
      ...order,
      id: orderId,
      code: order?.code ?? assignment?.commercial_order_code ?? `Pedido ${orderId}`,
    }

    setEvidenceOrder(normalizedOrder)
    setEvidenceFile(null)
    setEvidencePreview(isEvidenceImage(evidence?.evidence_url) ? evidence.evidence_url : '')
    setEvidenceForm({
      recipient_name: evidence?.recipient_name ?? order?.dispatch_contact_name ?? assignment?.customer_name ?? '',
      recipient_document_type: evidence?.recipient_document_type ?? 'DNI',
      recipient_document_number: evidence?.recipient_document_number ?? '',
      recipient_phone: evidence?.recipient_phone ?? order?.dispatch_contact_phone ?? '',
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
    $(evidenceModalRef.current).modal('hide')
    setTimeout(() => $(evidenceFormModalRef.current).modal('show'), 320)
  }

  const onDispatchEvidenceFileChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setEvidenceFile(file)
    setEvidencePreview(file ? URL.createObjectURL(file) : (isEvidenceImage(evidenceForm.evidence_url) ? evidenceForm.evidence_url : ''))
  }

  const onEvidenceFieldChange = (field, value) => setEvidenceForm(prev => ({ ...prev, [field]: value }))

  const saveDispatchEvidence = async (e) => {
    e.preventDefault()
    if (!evidenceOrder?.id || !selectedEvidenceDispatch?.id) return

    const request = new FormData()
    request.append('dispatch_id', selectedEvidenceDispatch.id)
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
    if (!result?.data) return

    const savedEvidence = result.data
    setSelectedEvidences(prev => [savedEvidence, ...prev.filter(item => !isSameEvidenceTarget(item, savedEvidence))])
    setSelectedEvidenceDispatch(prev => {
      if (!prev) return prev
      const merged = [savedEvidence, ...dispatchEvidences(prev).filter(item => !isSameEvidenceTarget(item, savedEvidence))]
      return { ...prev, delivery_evidences: merged, deliveryEvidences: merged }
    })

    $(evidenceFormModalRef.current).modal('hide')
    await refreshGrid()
  }

  const onSave = async (e) => {
    e.preventDefault()
    const selectedOrderIds = assignments.map(row => row.commercial_order_id).filter(Boolean)
    const duplicatedOrderId = selectedOrderIds.find((orderId, index) => selectedOrderIds.indexOf(orderId) !== index)
    if (duplicatedOrderId) {
      Swal.fire('Pedido duplicado', `El pedido ${orderMap[duplicatedOrderId]?.code ?? duplicatedOrderId} ya esta seleccionado.`, 'warning')
      return
    }
    for (const orderId of selectedOrderIds) {
      const order = orderMap[orderId]
      if (!order) {
        Swal.fire('Pedido no disponible', 'Recarga pedidos y vuelve a seleccionar el pedido.', 'warning')
        return
      }
      const activeAssignment = activeAssignmentForOtherDispatch(order)
      if (activeAssignment) {
        const dispatchCode = activeAssignment.dispatch?.code ? ` ${activeAssignment.dispatch.code}` : ''
        Swal.fire('Pedido ya asignado', `El pedido ${order.code ?? orderId} ya esta asignado al despacho${dispatchCode}. Quitalo de este despacho o anulalo en el despacho anterior.`, 'warning')
        return
      }
    }
    const request = {
      id: idRef.current.value || undefined,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      scheduled_date: scheduledDateRef.current.value,
      shift,
      driver_id: selectedDriverId || null,
      copilot_name: copilotNameRef.current.value.trim(),
      vehicle_id: selectedVehicleId || null,
      zone_id: selectedZoneId || null,
      manifest_code: manifestCodeRef.current.value.trim(),
      dispatch_status: dispatchStatus,
      observations: observationsRef.current.value.trim(),
      assignments: selectedOrderIds.map(orderId => ({ commercial_order_id: orderId }))
    }
    const result = await dispatchesRest.save(request)
    if (!result) return
    await refreshGrid()
    $(modalRef.current).modal('hide')
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar despacho', text: 'Se dara de baja el despacho y su salida tecnica.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await dispatchesRest.delete(id)
    if (!result) return
    await refreshGrid()
  }

  const applyManifestFilters = (e) => {
    e.preventDefault()
    if (manifestFilters.startDate && manifestFilters.endDate && manifestFilters.startDate > manifestFilters.endDate) {
      Swal.fire('Fechas invalidas', 'La fecha inicio no puede ser mayor que la fecha fin.', 'warning')
      return
    }
    setAppliedManifestFilters({ ...manifestFilters })
  }

  const manifestReportRow = (dispatch) => [
    '',
    manifestStatusMeta(dispatch?.dispatch_status).label,
    manifestCode(dispatch),
    formatDateText(dispatch?.scheduled_date),
    manifestShift(dispatch),
    manifestVehicle(dispatch),
    manifestDrivers(dispatch),
    manifestZone(dispatch),
    formatAuditUser(dispatch?.creator),
    formatDateText(dispatch?.created_at, true),
  ]

  const fetchManifestRowsForExport = async () => {
    const response = await dispatchesRest.paginate({
      skip: 0,
      take: 0,
      isLoadingAll: true,
      requireTotalCount: false,
      filter: dispatchGridFilter || undefined,
      sort: [{ selector: 'scheduled_date', desc: true }, { selector: 'id', desc: true }],
    })

    if (response?.status && response.status !== 200) {
      throw new Error(response.message || 'No se pudo obtener el listado')
    }

    return response?.data ?? []
  }

  const copyManifestRows = async () => {
    try {
      const rows = await fetchManifestRowsForExport()
      const text = [manifestReportHeaders, ...rows.map(manifestReportRow)]
        .map(row => row.map(value => `${value ?? ''}`).join('\t'))
        .join('\n')
      await navigator.clipboard.writeText(text)
      Swal.fire('Copiado', 'El listado filtrado fue copiado al portapapeles.', 'success')
    } catch (error) {
      Swal.fire('No se pudo copiar', error.message || 'Ocurrio un error al copiar el listado', 'error')
    }
  }

  const exportManifestExcel = async () => {
    if (isExportingManifest) return

    setIsExportingManifest(true)
    try {
      const rows = await fetchManifestRowsForExport()
      const worksheet = XLSX.utils.aoa_to_sheet([manifestReportHeaders, ...rows.map(manifestReportRow)])
      worksheet['!cols'] = manifestReportColumns

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Manifiestos')
      XLSX.writeFile(workbook, `${Math.floor(Date.now() / 1000)}_reporte_manifiestos_despacho.xlsx`)
    } catch (error) {
      Swal.fire('No se pudo exportar', error.message || 'Ocurrio un error al generar el Excel', 'error')
    } finally {
      setIsExportingManifest(false)
    }
  }

  const currentDriver = driverMap[selectedDriverId]
  const currentVehicle = vehicleMap[selectedVehicleId]
  const currentZone = zoneMap[selectedZoneId]
  const manifestTabsToolbar = (
    <div className='d-flex flex-wrap align-items-end w-100' style={{ gap: 8 }}>
      <div className='d-flex flex-wrap' style={{ gap: 8 }}>
        {manifestTabs.map((tab) => (
          <button
            key={`dispatch-manifest-tab-${tab.value}`}
            type='button'
            className={activeManifestTab === tab.value ? 'vdt-btn-acc' : 'vdt-btn-soft'}
            onClick={() => setActiveManifestTab(tab.value)}
          >
            {tab.value === 'approved' ? <i className='mdi mdi-check-decagram'></i> : <i className='mdi mdi-clipboard-list-outline'></i>}
            <span className='d-none d-md-inline'>{tab.label}</span>
            <span className='d-md-none'>{tab.value === 'approved' ? 'Aprobados' : 'Pendientes'}</span>
          </button>
        ))}
      </div>
      <form className='d-flex flex-wrap align-items-end ms-lg-auto dispatch-filter-form' style={{ gap: 8 }} onSubmit={applyManifestFilters}>
        <div className='dispatch-filter-date'>
          <small className='text-muted d-block'>Desde</small>
          <input type='date' className='form-control' style={{ height: 40, borderRadius: 12 }} value={manifestFilters.startDate} onChange={(e) => setManifestFilters(prev => ({ ...prev, startDate: e.target.value }))} />
        </div>
        <div className='dispatch-filter-date'>
          <small className='text-muted d-block'>Hasta</small>
          <input type='date' className='form-control' style={{ height: 40, borderRadius: 12 }} value={manifestFilters.endDate} onChange={(e) => setManifestFilters(prev => ({ ...prev, endDate: e.target.value }))} />
        </div>
        <button type='submit' className='vdt-btn-soft'><i className='mdi mdi-filter-variant'></i> Filtrar</button>
        <button type='button' className='vdt-btn-soft' onClick={copyManifestRows}><i className='mdi mdi-content-copy'></i> Copiar</button>
        <button type='button' className='vdt-btn-soft' onClick={exportManifestExcel} disabled={isExportingManifest}>
          <i className='mdi mdi-file-excel'></i> {isExportingManifest ? 'Generando...' : 'Excel'}
        </button>
      </form>
    </div>
  )

  const rowActions = (data) => {
    if (isClosedManifest(data)) {
      return [{ icon: 'mdi mdi-file-pdf-box', title: 'Previsualizar o imprimir manifiesto PDF', label: 'PDF', bg: '#fcebeb', color: '#e24b4a', onClick: openDispatchManifestPdf }]
    }
    const pending = isPendingManifest(data)
    return [
      { icon: 'mdi mdi-pencil', title: 'Editar manifiesto', label: 'Editar', bg: '#e7f2fd', color: '#188ae2', hidden: !(pending && !isDriverSession), onClick: (r) => onModalOpen(r) },
      { icon: 'mdi mdi-map-marker-path', title: 'Abrir ruta en mapa', label: 'Ruta', bg: '#e6f4f8', color: '#35b8e0', hidden: !(pending || isDriverSession), onClick: onOpenRoute },
      { icon: 'mdi mdi-check', title: 'Aprobar manifiesto y poner en ruta', label: 'En ruta', bg: '#e6f6ef', color: '#10b981', hidden: !(pending && !isDriverSession), onClick: onStartRoute },
      { icon: 'mdi mdi-file-document', title: dispatchGuides(data).length ? 'Ver guias' : 'Generar guias', label: 'Guias', bg: '#fff5e0', color: '#f9a825', hidden: !(pending && !isDriverSession), onClick: onShowGuides },
      { icon: 'mdi mdi-check-decagram', title: 'Dar conformidad de manifiesto', label: 'Conformidad', bg: '#e6f6ef', color: '#10b981', hidden: !(canConfirmManifest(data) && !isDriverSession), onClick: onConfirmManifestConformity },
      { icon: 'mdi mdi-file-pdf-box', title: 'Previsualizar o imprimir manifiesto PDF', label: 'PDF', bg: '#fcebeb', color: '#e24b4a', onClick: openDispatchManifestPdf },
      { icon: 'mdi mdi-camera', title: 'Registrar o ver evidencias de entrega', label: 'Evidencias', bg: '#eef0f4', color: '#5b69bc', hidden: !(pending || isDriverSession), onClick: onShowEvidences },
      { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', hidden: !(pending && !isDriverSession), onClick: (r) => onDelete(r.id) },
    ]
  }

  const assignmentOrderOptions = (uid) => availableOrders.map(order => {
    const taken = isOrderSelectedInOtherAssignment(order.id, uid)
    return { value: `${order.id}`, label: `${orderOptionLabel(order)}${taken ? ' (ya seleccionado)' : ''}` }
  })

  return <>
    <style>{`
      .dispatch-form-section {
        border: 1px solid #eef0f4;
        border-radius: 10px;
        padding: 12px 14px 6px;
        margin-bottom: 12px;
      }
      .dispatch-form-section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 10px;
        color: #6c757d;
        font-size: .75rem;
        font-weight: 700;
        letter-spacing: .03em;
        text-transform: uppercase;
      }
      .dispatch-form-section-title i { color: var(--vd-primary, #e24b4a); font-size: 16px; }
      .dispatch-assignment-row {
        align-items: end;
        border-bottom: 1px dashed #eef0f4;
        display: grid;
        gap: 8px 12px;
        grid-template-columns: minmax(0, 1fr) 120px 40px;
        padding-bottom: 8px;
        margin-bottom: 8px;
      }
      .dispatch-assignment-row > :first-child { grid-column: 1 / -1; }
      @media (max-width: 575.98px) {
        .dispatch-filter-form { width: 100%; }
        .dispatch-filter-date { flex: 1 1 calc(50% - 4px); min-width: 0; }
        .dispatch-filter-form > button { flex: 1 1 auto; }
      }
    `}</style>
    <VdTable
      key={`dispatch-vdtable-${activeManifestTab}`}
      ref={tableRef}
      rest={dispatchesRest}
      icon='mdi mdi-truck-fast'
      title='Despachos'
      unit='manifiestos'
      defaultSort={{ field: 'scheduled_date', desc: true }}
      defaultPageSize={25}
      baseFilter={dispatchGridFilter}
      searchFields={['code', 'manifest_code', 'driver_name', 'vehicle_plate', 'zone']}
      searchPlaceholder='Buscar por codigo, manifiesto, conductor o placa…'
      emptyText='No hay manifiestos en esta pestaña.'
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={refreshGrid}>
          <i className='mdi mdi-refresh'></i>
        </button>
        {!isDriverSession && activeManifestTab === 'pending' && (
          <button type='button' className='vdt-btn-pri' onClick={() => onModalOpen()}>
            <i className='mdi mdi-plus'></i> Nuevo despacho
          </button>
        )}
      </>}
      toolbar={manifestTabsToolbar}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'manifest_code', label: 'Codigo', field: 'manifest_code', width: '140px',
          filter: { type: 'text', fields: ['manifest_code', 'code'] },
          render: (row) => (isDriverSession || !isPendingManifest(row))
            ? <span className='fw-semibold'>{manifestCode(row)}</span>
            : <a className='admin-grid-edit-link' style={{ cursor: 'pointer', fontWeight: 600 }} title='Editar manifiesto' onClick={() => onModalOpen(row)}>{manifestCode(row)}</a>,
        },
        {
          key: 'dispatch_status', label: 'Estado', field: 'dispatch_status', width: '120px',
          render: (row) => { const meta = manifestStatusMeta(row?.dispatch_status); return <span className={meta.className}>{meta.label}</span> },
        },
        { key: 'scheduled_date', label: 'Fecha entrega', field: 'scheduled_date', width: '130px', filter: { type: 'date' }, render: (row) => formatDateText(row.scheduled_date) || '-' },
        { key: 'shift', label: 'Turno', field: 'shift', width: '100px', render: manifestShift },
        { key: 'vehicle', label: 'Vehiculo', field: 'vehicle_plate', filter: { type: 'text', fields: ['vehicle_plate', 'vehicle_label'] }, render: manifestVehicle },
        { key: 'drivers', label: 'Conductores', field: 'driver_name', filter: { type: 'text', fields: ['driver_name', 'copilot_name'] }, render: manifestDrivers },
        { key: 'zone', label: 'Zona', field: 'zone', filter: { type: 'text' }, render: manifestZone },
        {
          key: 'orders', label: 'Pedidos', field: 'assignments', sortable: false,
          render: (row) => {
            const codes = dispatchAssignments(row).map(a => assignmentOrder(a)?.code ?? a?.commercial_order_code).filter(Boolean)
            return codes.length ? <div className='d-flex gap-1 flex-wrap'>{codes.map(code => <span key={code} className='badge badge-soft-secondary'>{code}</span>)}</div> : '-'
          },
        },
        { key: 'creator', label: 'Usuario registro', field: 'creator.fullname', sortable: false, render: (row) => formatAuditUser(row.creator) || '-' },
        { key: 'created_at', label: 'Fecha registro', field: 'created_at', width: '160px', render: (row) => formatDateText(row?.created_at, true) || '-' },
      ]}
      renderCard={(row, actionButtons) => {
        const meta = manifestStatusMeta(row?.dispatch_status)
        return <div className='vdt-card'>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{manifestCode(row)}</p>
              <small className='text-muted'>{formatDateText(row.scheduled_date)} · {manifestShift(row)}</small>
            </div>
            <span className={meta.className}>{meta.label}</span>
          </div>
          <small className='text-muted d-block mt-2'><i className='mdi mdi-truck me-1'></i>{manifestVehicle(row)}</small>
          <small className='text-muted d-block'><i className='mdi mdi-account me-1'></i>{manifestDrivers(row)}</small>
          <small className='text-muted d-block'><i className='mdi mdi-map-marker me-1'></i>{manifestZone(row)}</small>
          {actionButtons && <div className='d-flex flex-wrap mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }}>{actionButtons}</div>}
        </div>
      }}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar despacho' : 'Nuevo despacho'} size='lg' preventEnterSubmit onSubmit={onSave}>
      <div id='dispatch-form-container'>
        <input ref={idRef} hidden />
        <DispatchSection icon='mdi mdi-warehouse' title='Origen'>
          <InputFormGroup eRef={codeRef} col='col-md-4' label='Codigo' disabled />
          {/* Con una sola empresa en el alcance del modulo el campo no se muestra: se autoselecciona
              en onModalOpen. Si algun dia hay mas de una, el select vuelve solo. */}
          {businesses.length !== 1 && (
            <VdSelect col='col-md-8' label='Empresa' required value={selectedBusinessId}
              onChange={async (value) => { setSelectedBusinessId(value); await loadBranches(value, '') }}
              options={optionsOf(businesses, row => row.name)} placeholder='-- Seleccionar empresa --' />
          )}
          <VdSelect col='col-md-4' label='Sede' value={selectedBranchId} onChange={setSelectedBranchId}
            options={optionsOf(branches, row => row.name)} placeholder='-- Seleccionar sede --' clearable />
          <VdSelect col='col-md-4' label='Almacen' required value={selectedWarehouseId} onChange={setSelectedWarehouseId}
            options={optionsOf(warehouses, row => row.name)} placeholder='-- Seleccionar almacen --' />
        </DispatchSection>

        <DispatchSection icon='mdi mdi-calendar-clock' title='Programacion'>
          <InputFormGroup eRef={scheduledDateRef} col='col-md-4' label='Fecha programada' type='date' required />
          <VdSelect col='col-md-4' label='Turno' value={shift} onChange={setShift} options={shiftOptions} />
          <VdSelect col='col-md-4' label='Estado' value={dispatchStatus} onChange={setDispatchStatus}
            options={dispatchStatusOptions.filter((option) => operationalDispatchStatuses.includes(option.value))} />
          <InputFormGroup eRef={manifestCodeRef} col='col-md-4' label='Manifiesto' placeholder='Se genera al poner en ruta' />
        </DispatchSection>

        <DispatchSection icon='mdi mdi-truck' title='Conductor, vehiculo y zona'>
          <VdSelect col='col-md-6' label='Conductor' value={selectedDriverId} onChange={setSelectedDriverId} clearable
            options={optionsOf(drivers, row => `${row.code} - ${row.full_name}`)} placeholder='Sin conductor' />
          <InputFormGroup col='col-md-3' label='Licencia' value={currentDriver?.license_number ?? ''} disabled />
          <InputFormGroup eRef={copilotNameRef} col='col-md-3' label='Copiloto' />
          <VdSelect col='col-md-6' label='Vehiculo' value={selectedVehicleId} onChange={onVehicleChange} clearable
            options={optionsOf(vehicles, row => `${row.plate} - ${row.label ?? row.code}`)} placeholder='Sin vehiculo' />
          <InputFormGroup col='col-md-3' label='Placa' value={currentVehicle?.plate ?? ''} disabled />
          <div className='col-md-3' />
          <VdSelect col='col-md-6' label='Zona' value={selectedZoneId} onChange={setSelectedZoneId} clearable
            options={optionsOf(zones, row => `${row.code} - ${row.name}`)} placeholder='Sin zona' />
          <InputFormGroup col='col-md-3' label='Distrito zona' value={currentZone?.district ?? ''} disabled />
          <div className='col-md-3 d-flex align-items-end mb-2' style={{ gap: 6 }}>
            <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Nueva zona' onClick={() => openZoneModal()}><i className='mdi mdi-plus'></i></button>
            <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Editar zona' onClick={onOpenSelectedZone} disabled={!selectedZoneId}><i className='mdi mdi-pencil'></i></button>
          </div>
        </DispatchSection>

        <DispatchSection
          icon='mdi mdi-package-variant-closed'
          title='Pedidos asignados'
          aside={<button type='button' className='vdt-btn-soft' style={{ height: 32 }} onClick={loadCommercialOrders} disabled={isLoadingOrders}>
            <i className='mdi mdi-refresh'></i> {isLoadingOrders ? 'Cargando...' : 'Recargar'}
          </button>}
        >
          <div className='col-12'>
            <small className='text-muted d-block mb-2'>
              {!selectedWarehouseId
                ? 'Selecciona un almacen para listar sus pedidos disponibles.'
                : availableOrders.length > 0
                  ? `${availableOrders.length} pedido(s) disponible(s) del almacen seleccionado. ${selectedAvailableOrderCount} ya seleccionado(s).`
                  : 'No hay pedidos listos para este almacen. Revisa que el pedido este en "Listo" en picking y tenga el mismo almacen.'}
            </small>
            {assignments.map(row => <div key={row.uid} className='dispatch-assignment-row'>
              <VdSelect noMargin label='Pedido' value={`${row.commercial_order_id ?? ''}`} onChange={(value) => onAssignmentChange(row.uid, value ?? '')} clearable
                options={assignmentOrderOptions(row.uid)} placeholder={isLoadingOrders ? 'Cargando pedidos...' : (availableOrders.length ? '-- Seleccionar pedido --' : 'Sin pedidos disponibles')} />
              <InputFormGroup col='mb-0' label='Cliente' value={row.customer_name} disabled />
              <InputFormGroup col='mb-0' label='Total' value={Number(row.total || 0).toFixed(2)} disabled />
              <button
                type='button'
                className='vdt-btn-soft vdt-btn-icon mb-2'
                style={{ color: '#e24b4a' }}
                title='Quitar pedido'
                onClick={() => setAssignments(prev => prev.length === 1 ? [emptyAssignment()] : prev.filter(item => item.uid !== row.uid))}
              >
                <i className='mdi mdi-delete'></i>
              </button>
            </div>)}
            <button type='button' className='vdt-btn-soft mb-2' style={{ height: 34 }} onClick={() => setAssignments(prev => [...prev, emptyAssignment()])} disabled={!canAddAssignment}>
              <i className='mdi mdi-plus'></i> Agregar pedido
            </button>
          </div>
        </DispatchSection>

        <TextareaFormGroup eRef={observationsRef} col='col-12' label='Observaciones' rows={2} />
      </div>
    </Modal>

    <Modal modalRef={zoneModalRef} title={isEditingZone ? 'Editar zona' : 'Nueva zona'} size='lg' onSubmit={onSaveZone}>
      <div className='row'>
        <input ref={zoneIdRef} hidden />
        <VdSelect col='col-md-4' label='Empresa' value={zoneBusinessId} onChange={(value) => setZoneBusinessId(value ?? '')} clearable
          options={optionsOf(businesses, row => row.name)} placeholder='Global' />
        <InputFormGroup eRef={zoneNameRef} col='col-md-8' label='Nombre' placeholder='Ej. Lima Norte' required />
        <VdUbigeoCascade
          value={zoneLocation}
          onChange={setZoneLocation}
          showUbigeo={false}
          departmentCol='col-md-4'
          provinceCol='col-md-4'
          districtCol='col-md-4'
          required
        />
        <TextareaFormGroup eRef={zoneReferenceRef} col='col-12' label='Referencia' rows={2} />
        <TextareaFormGroup eRef={zoneObservationsRef} col='col-12' label='Observaciones' rows={2} />
      </div>
    </Modal>

    <Modal modalRef={evidenceModalRef} title='Evidencias de entrega' size='lg' hideButtonSubmit>
      <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3'>
        <div>
          <div className='fw-semibold'>{selectedEvidenceDispatch?.code ?? ''}</div>
          <small className='text-muted'>{selectedEvidenceDispatch?.manifest_code ? `Manifiesto ${selectedEvidenceDispatch.manifest_code}` : 'Sin manifiesto'}</small>
        </div>
        <span className={`badge ${evidenceProgress(selectedEvidenceDispatch).pending === 0 && evidenceProgress(selectedEvidenceDispatch).total > 0 ? 'bg-success' : 'bg-warning text-dark'}`}>
          {evidenceProgress(selectedEvidenceDispatch).covered}/{evidenceProgress(selectedEvidenceDispatch).total} evidencias
        </span>
      </div>
      <div className='table-responsive'>
        <table className='table table-sm table-bordered mb-0'>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Recibido por</th>
              <th>Documento</th>
              <th>Fecha entrega</th>
              <th>Evidencia</th>
              <th style={{ width: 130 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dispatchAssignments(selectedEvidenceDispatch).length === 0 && (
              <tr>
                <td colSpan='6' className='text-center text-muted'>Sin pedidos asignados</td>
              </tr>
            )}
            {dispatchAssignments(selectedEvidenceDispatch).map((assignment) => {
              const order = assignmentOrder(assignment)
              const orderId = assignment?.commercial_order_id ?? order?.id
              const evidence = latestEvidenceForOrder(orderId)
              return (
                <tr key={`dispatch-evidence-assignment-${assignment.id ?? orderId}`}>
                  <td>
                    <div className='fw-semibold'>{order?.code ?? assignment?.commercial_order_code ?? orderId}</div>
                    <small className='text-muted'>{assignment?.customer_name ?? '-'}</small>
                  </td>
                  <td>{evidence?.recipient_name ?? '-'}</td>
                  <td>{[evidence?.recipient_document_type, evidence?.recipient_document_number].filter(Boolean).join(' ') || '-'}</td>
                  <td>{evidence?.delivered_at ? new Date(evidence.delivered_at).toLocaleString('es-PE') : '-'}</td>
                  <td>
                    {evidence?.evidence_url ? (
                      <a href={evidence.evidence_url} target='_blank' rel='noreferrer' className='btn btn-xs btn-soft-primary'>Abrir</a>
                    ) : <span className='badge bg-warning text-dark'>Pendiente</span>}
                  </td>
                  <td>
                    <button type='button' className='btn btn-xs btn-soft-success' onClick={() => openDispatchEvidenceForm(assignment)}>
                      {evidence ? 'Editar' : 'Registrar'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Modal>

    <Modal modalRef={evidenceFormModalRef} title={`Evidencia ${evidenceOrder?.code ?? ''}`.trim()} size='lg' btnSubmitText='Guardar evidencia' onSubmit={saveDispatchEvidence} onClose={closeDispatchEvidenceForm}>
      <div className='row'>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Recibido por</label>
          <input className='form-control' value={evidenceForm.recipient_name} onChange={(e) => onEvidenceFieldChange('recipient_name', e.target.value)} />
        </div>
        <VdSelect col='col-md-3 mb-2' label='Tipo doc.' value={evidenceForm.recipient_document_type} onChange={(value) => onEvidenceFieldChange('recipient_document_type', value)}
          options={[{ value: 'DNI', label: 'DNI' }, { value: 'RUC', label: 'RUC' }, { value: 'CE', label: 'CE' }, { value: 'OTRO', label: 'Otro' }]} />
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
          <input ref={evidenceFileRef} className='form-control' type='file' accept='image/png,image/jpeg,image/webp,image/gif' onChange={onDispatchEvidenceFileChange} />
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

    <Modal modalRef={guideModalRef} title='Guias de remision' size='lg' hideButtonSubmit>
      <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3'>
        <div>
          <div className='fw-semibold'>{selectedGuideDispatch?.code ?? ''}</div>
          <small className='text-muted'>{selectedGuideDispatch?.manifest_code ? `Manifiesto ${selectedGuideDispatch.manifest_code}` : 'Sin manifiesto'}</small>
        </div>
        <button type='button' className='btn btn-sm btn-outline-primary' onClick={onPrepareGuides}>
          Actualizar guias
        </button>
        <button type='button' className='btn btn-sm btn-primary' onClick={onIssuePendingGuides} disabled={selectedGuides.filter(canIssueGuide).length === 0}>
          Emitir pendientes
        </button>
      </div>
      <div className='table-responsive'>
        <table className='table table-sm table-bordered mb-0'>
          <thead>
            <tr>
              <th>Guia</th>
              <th>Pedido</th>
              <th>Estado</th>
              <th>Traslado</th>
              <th>Destino</th>
              <th className='text-end'>Items</th>
              <th style={{ width: 260 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {selectedGuides.length === 0 && (
              <tr>
                <td colSpan='7' className='text-center text-muted'>Sin guias generadas</td>
              </tr>
            )}
            {selectedGuides.map((guide) => (
              <tr key={`dispatch-referral-guide-${guide.id}`}>
                <td>{guideNumber(guide)}</td>
                <td>{guide.commercial_order?.code ?? guide.commercialOrder?.code ?? guide.commercial_order_id}</td>
                <td>{getReferralGuideStatusLabel(guide.guide_status)}</td>
                <td>{`${guide.transfer_date ?? ''}`.slice(0, 10) || '-'}</td>
                <td>{guide.destination_address ?? '-'}</td>
                <td className='text-end'>{(guide.items ?? []).length}</td>
                <td>
                  <div className='d-flex flex-wrap gap-1'>
                    {canIssueGuide(guide) && (
                      <button type='button' className='btn btn-xs btn-soft-primary' onClick={() => onIssueGuide(guide)}>
                        Emitir
                      </button>
                    )}
                    <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => openMagistralesRecordPdf(buildMagistralesRows.referralGuide(guide))}>
                      PDF local
                    </button>
                    {providerFileTypes.map((type) => guideProviderLink(guide, type) ? (
                      <a
                        key={`guide-${guide.id}-${type}`}
                        href={referralGuidesRest.downloadUrl(guide.id, type)}
                        target='_blank'
                        rel='noreferrer'
                        className='btn btn-xs btn-soft-secondary text-uppercase'
                      >
                        {type}
                      </a>
                    ) : null)}
                    {canCancelGuide(guide) && (
                      <button type='button' className='btn btn-xs btn-soft-warning' onClick={() => onCancelGuide(guide)}>
                        Anular
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.can('dispatch') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Despachos'><Dispatches {...properties} /></BaseAdminto>)
})
