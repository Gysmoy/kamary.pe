import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import CommercialOrdersRest from '../Actions/Admin/CommercialOrdersRest';
import DispatchesRest from '../Actions/Admin/DispatchesRest';
import ReferralGuidesRest from '../Actions/Admin/ReferralGuidesRest';
import ZonesRest from '../Actions/Admin/ZonesRest';
import UbigeoCascade from '../Components/Adminto/form/UbigeoCascade';
import SelectFormGroup from '../Components/Adminto/form/SelectFormGroup';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import { EMPTY_UBIGEO_SELECTION } from '../Utils/ubigeoInei';
import {
  dispatchStatusOptions,
  getDispatchStatusLabel,
  getShiftLabel,
  getReferralGuideStatusLabel,
  shiftOptions,
  toLookup,
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
    return { label: 'En espera', className: 'badge border border-warning text-warning bg-warning-subtle' }
  }
  if (['approved', 'in_route', 'delivered'].includes(status)) {
    return { label: 'Aprobado', className: 'badge border border-success text-success bg-success-subtle' }
  }
  if (status === 'closed') {
    return { label: 'Cerrado', className: 'badge border border-info text-info bg-info-subtle' }
  }
  if (status === 'cancelled') {
    return { label: 'Cancelado', className: 'badge border border-danger text-danger bg-danger-subtle' }
  }
  return { label: getDispatchStatusLabel(status), className: 'badge border border-secondary text-secondary bg-light' }
}
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
  const gridRef = useRef()
  const modalRef = useRef()
  const zoneModalRef = useRef()
  const guideModalRef = useRef()
  const evidenceModalRef = useRef()
  const evidenceFormModalRef = useRef()
  const evidenceFileRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const scheduledDateRef = useRef()
  const shiftRef = useRef()
  const copilotNameRef = useRef()
  const manifestCodeRef = useRef()
  const dispatchStatusRef = useRef()
  const observationsRef = useRef()
  const zoneIdRef = useRef()
  const zoneBusinessRef = useRef()
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
  const [activeManifestTab, setActiveManifestTab] = useState('pending')
  const [manifestFilters, setManifestFilters] = useState({ businessId: '', startDate: '', endDate: '' })
  const [appliedManifestFilters, setAppliedManifestFilters] = useState({ businessId: '', startDate: '', endDate: '' })
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
    appliedManifestFilters.businessId ? ['business_id', '=', Number(appliedManifestFilters.businessId)] : null,
    appliedManifestFilters.startDate ? ['scheduled_date', '>=', appliedManifestFilters.startDate] : null,
    appliedManifestFilters.endDate ? ['scheduled_date', '<=', appliedManifestFilters.endDate] : null,
  ]), [activeManifestTab, appliedManifestFilters])

  const refreshZones = async () => {
    const zoneList = await dispatchesRest.getZones()
    setZones(zoneList ?? [])
    return zoneList ?? []
  }

  const refreshGrid = async () => {
    const instance = gridRef.current ? $(gridRef.current).dxDataGrid('instance') : null
    if (instance) await instance.refresh()
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

  const onModalOpen = async (data = null) => {
    setCurrentDispatchId(data?.id ? `${data.id}` : '')
    await loadCommercialOrders()
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    scheduledDateRef.current.value = data?.scheduled_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    shiftRef.current.value = data?.shift ?? 'Manana'
    copilotNameRef.current.value = data?.copilot_name ?? ''
    manifestCodeRef.current.value = data?.manifest_code ?? ''
    dispatchStatusRef.current.value = data?.dispatch_status ?? 'dispatched'
    observationsRef.current.value = data?.observations ?? ''
    setSelectedBusinessId(data?.business_id ? `${data.business_id}` : '')
    setSelectedWarehouseId(data?.warehouse_id ? `${data.warehouse_id}` : '')
    setSelectedDriverId(data?.driver_id ? `${data.driver_id}` : '')
    setSelectedVehicleId(data?.vehicle_id ? `${data.vehicle_id}` : '')
    setSelectedZoneId(data?.zone_id ? `${data.zone_id}` : '')
    await loadBranches(data?.business_id ?? '', data?.business_branch_id ?? '')
    setAssignments((data?.assignments ?? []).map(row => ({ uid: crypto.randomUUID(), commercial_order_id: `${row.commercial_order_id}`, customer_name: row.customer_name ?? '', total: Number(row.total || 0) })) || [emptyAssignment()])
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
    if (order?.dispatch_status === 'dispatched' && ['pending', 'preparing'].includes(dispatchStatusRef.current?.value)) {
      dispatchStatusRef.current.value = 'dispatched'
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

  const assignmentSelectEffectKey = useMemo(() => (
    [
      selectedWarehouseId,
      availableOrders.map(order => order.id).join(','),
      assignments.map(row => `${row.uid}:${row.commercial_order_id}`).join('|'),
    ].join('::')
  ), [assignments, availableOrders, selectedWarehouseId])

  const onVehicleChange = (value) => {
    setSelectedVehicleId(value)
    const vehicle = vehicleMap[value]
    if (vehicle?.zone_id) setSelectedZoneId(`${vehicle.zone_id}`)
  }

  const openZoneModal = (zone = null) => {
    setIsEditingZone(!!zone?.id)
    zoneIdRef.current.value = zone?.id ?? ''
    zoneBusinessRef.current.value = zone?.business_id ?? selectedBusinessId ?? ''
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
      business_id: zoneBusinessRef.current.value || null,
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
      scheduled_date: dispatch.scheduled_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10),
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
      shift: shiftRef.current.value,
      driver_id: selectedDriverId || null,
      copilot_name: copilotNameRef.current.value.trim(),
      vehicle_id: selectedVehicleId || null,
      zone_id: selectedZoneId || null,
      manifest_code: manifestCodeRef.current.value.trim(),
      dispatch_status: dispatchStatusRef.current.value,
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
  const manifestListTitle = (
    <div className='dispatch-manifest-list-header'>
      <div className='d-flex justify-content-between align-items-center'>
        <h4 className='header-title mb-0'>Listado</h4>
      </div>
      <ul className='nav nav-tabs nav-bordered mt-3 flex-nowrap overflow-auto'>
        {manifestTabs.map((tab) => (
          <li className='nav-item' key={`dispatch-manifest-tab-${tab.value}`}>
            <a
              href='#'
              className={`nav-link ${activeManifestTab === tab.value ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                setActiveManifestTab(tab.value)
              }}
            >
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
      <form className='mt-3' onSubmit={applyManifestFilters}>
        <div className='row g-3 align-items-end'>
          <div className='col-12 col-lg-4'>
            <label className='form-label'>Empresa</label>
            <select
              className='form-select'
              value={manifestFilters.businessId}
              onChange={(e) => setManifestFilters(prev => ({ ...prev, businessId: e.target.value }))}
            >
              <option value=''>Todas</option>
              {businesses.map(row => <option key={`manifest-filter-business-${row.id}`} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          <div className='col-12 col-lg-4'>
            <label className='form-label'>Fecha Inicio</label>
            <input
              type='date'
              className='form-control'
              value={manifestFilters.startDate}
              onChange={(e) => setManifestFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className='col-12 col-lg-4'>
            <label className='form-label'>Fecha Fin</label>
            <input
              type='date'
              className='form-control'
              value={manifestFilters.endDate}
              onChange={(e) => setManifestFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>
        <div className='d-flex justify-content-center mt-3'>
          <button type='submit' className='btn btn-outline-primary px-4'>
            <i className='mdi mdi-magnify me-1'></i>Filtrar
          </button>
        </div>
      </form>
      <div className='d-flex flex-wrap gap-2 mt-4'>
        <button type='button' className='btn btn-sm btn-light border' onClick={copyManifestRows}>
          Copiar
        </button>
        <button type='button' className='btn btn-sm btn-light border' onClick={exportManifestExcel} disabled={isExportingManifest}>
          {isExportingManifest ? 'Generando...' : 'Excel'}
        </button>
      </div>
    </div>
  )

  return <>
    <style>{`
      #dispatch-form-container .dispatch-assignment-summary {
        color: var(--ct-gray-600);
        font-size: 0.82rem;
      }
      #dispatch-form-container .dispatch-assignment-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      #dispatch-form-container .dispatch-assignment-row {
        align-items: end;
        display: grid;
        gap: 12px 16px;
        grid-template-columns: minmax(360px, 1fr) minmax(210px, 250px) minmax(120px, 160px) 68px;
      }
      #dispatch-form-container .dispatch-assignment-field,
      #dispatch-form-container .dispatch-assignment-order-field {
        min-width: 0;
      }
      #dispatch-form-container .dispatch-assignment-row .form-label {
        line-height: 1.2;
        margin-bottom: 6px;
      }
      #dispatch-form-container .dispatch-assignment-row .form-control,
      #dispatch-form-container .dispatch-assignment-row .select2-container .select2-selection--single {
        min-height: 38px;
      }
      #dispatch-form-container .dispatch-assignment-row .select2-container {
        width: 100% !important;
      }
      #dispatch-form-container .dispatch-assignment-row .select2-container .select2-selection--single {
        align-items: center;
        border-color: var(--ct-border-color);
        display: flex;
      }
      #dispatch-form-container .dispatch-assignment-row .select2-container .select2-selection__rendered {
        line-height: 36px;
        padding-left: 12px;
        padding-right: 28px;
      }
      #dispatch-form-container .dispatch-assignment-row .select2-container .select2-selection__arrow {
        height: 36px;
      }
      #dispatch-form-container .select2-dropdown {
        z-index: 1065;
      }
      #dispatch-form-container .dispatch-assignment-remove {
        height: 38px;
      }
      .dispatch-grid-actions {
        align-items: center;
        display: flex;
        flex-wrap: nowrap;
        gap: 4px;
        min-width: max-content;
      }
      .dispatch-grid-actions .dx-button {
        flex: 0 0 auto;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      @media (max-width: 991.98px) {
        #dispatch-form-container .dispatch-assignment-row {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 575.98px) {
        #dispatch-form-container .dispatch-assignment-row {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
    <Table
      gridRef={gridRef}
      title={manifestListTitle}
      rest={dispatchesRest}
      pageSize={10}
      filterValue={dispatchGridFilter}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        if (!isDriverSession && activeManifestTab === 'pending') {
          items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
        }
      }}
      columns={[
        { caption: 'ACCIONES', width: isDriverSession ? 120 : 260, fixed: true, fixedPosition: 'left', allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css({ overflow: 'visible', textOverflow: 'unset' })
          const actions = $('<div>').addClass('dispatch-grid-actions')

          if (isClosedManifest(data)) {
            actions.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Previsualizar o imprimir manifiesto PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openDispatchManifestPdf(data) }))
            container.append(actions)
            return
          }

          if (isPendingManifest(data) && !isDriverSession) {
            actions.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar manifiesto', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
          }
          if (isPendingManifest(data) || isDriverSession) {
            actions.append(DxButton({ className: 'btn btn-xs btn-soft-info', title: 'Abrir ruta en mapa', icon: 'mdi mdi-map-marker-path', onClick: () => onOpenRoute(data) }))
          }
          if (isPendingManifest(data) && !isDriverSession) {
            actions.append(DxButton({ className: 'btn btn-xs btn-soft-success', title: 'Aprobar manifiesto y poner en ruta', icon: 'mdi mdi-check', onClick: () => onStartRoute(data) }))
          }
          if (isPendingManifest(data) && !isDriverSession) {
            actions.append(DxButton({ className: 'btn btn-xs btn-soft-warning', title: dispatchGuides(data).length ? 'Ver guias' : 'Generar guias', icon: 'mdi mdi-file-document', onClick: () => onShowGuides(data) }))
          }
          if (canConfirmManifest(data) && !isDriverSession) {
            actions.append(DxButton({ className: 'btn btn-xs btn-soft-success', title: 'Dar conformidad de manifiesto', icon: 'mdi mdi-check-decagram', onClick: () => onConfirmManifestConformity(data) }))
          }
          actions.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Previsualizar o imprimir manifiesto PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openDispatchManifestPdf(data) }))
          if (isPendingManifest(data) || isDriverSession) {
            actions.append(DxButton({ className: 'btn btn-xs btn-soft-success', title: 'Registrar o ver evidencias de entrega', icon: 'mdi mdi-camera', onClick: () => onShowEvidences(data) }))
          }
          if (isPendingManifest(data) && !isDriverSession) {
            actions.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
          }
          container.append(actions)
        } },
        {
          dataField: 'dispatch_status',
          caption: 'ESTADO',
          width: 130,
          lookup: toLookup(dispatchStatusOptions),
          cellTemplate: (container, { data }) => {
            const meta = manifestStatusMeta(data?.dispatch_status)
            container.append($('<span>').addClass(meta.className).text(meta.label))
          }
        },
        {
          dataField: 'manifest_code',
          caption: 'CODIGO',
          width: 125,
          calculateCellValue: manifestCode,
          cellTemplate: (container, { data }) => {
            if (isDriverSession || !isPendingManifest(data)) {
              container.text(manifestCode(data))
              return
            }
            renderGridEditLink(container, manifestCode(data), () => onModalOpen(data), 'Editar manifiesto')
          }
        },
        { dataField: 'scheduled_date', caption: 'FECHA ENTREGA', dataType: 'date', width: 140 },
        { dataField: 'shift', caption: 'TURNO', width: 100, calculateCellValue: manifestShift },
        { caption: 'VEHICULO', minWidth: 185, calculateCellValue: manifestVehicle },
        { caption: 'CONDUCTORES', minWidth: 250, calculateCellValue: manifestDrivers },
        { caption: 'ZONA', minWidth: 150, calculateCellValue: manifestZone },
        { dataField: 'creator.fullname', caption: 'USUARIO REGISTRO', width: 170, cellTemplate: (container, { data }) => container.text(formatAuditUser(data.creator) || '-') },
        {
          dataField: 'created_at',
          caption: 'FECHA REGISTRO',
          dataType: 'datetime',
          width: 170,
          cellTemplate: (container, { data }) => container.text(formatDateText(data?.created_at, true) || '-')
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar despacho' : 'Agregar despacho'} size='xl' onSubmit={onSave}>
      <div id='dispatch-form-container' className='row'>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Codigo</label>
          <input ref={codeRef} className='form-control' disabled />
          <input ref={idRef} hidden />
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Empresa</label>
          <select className='form-control' value={selectedBusinessId} onChange={async (e) => { setSelectedBusinessId(e.target.value); await loadBranches(e.target.value, ''); }} required>
            <option value=''>Seleccione</option>
            {businesses.map(row => <option key={`dispatch-business-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Sede</label>
          <select className='form-control' value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>
            <option value=''>Seleccione</option>
            {branches.map(row => <option key={`dispatch-branch-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Almacen</label>
          <select className='form-control' value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)} required>
            <option value=''>Seleccione</option>
            {warehouses.map(row => <option key={`dispatch-warehouse-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha programada</label><input ref={scheduledDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Turno</label>
          <select ref={shiftRef} className='form-control'>
            {shiftOptions.map((option) => (
              <option key={`dispatch-shift-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Conductor</label>
          <select className='form-control' value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}>
            <option value=''>Sin conductor</option>
            {drivers.map(row => <option key={`dispatch-driver-${row.id}`} value={row.id}>{row.code} - {row.full_name}</option>)}
          </select>
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Copiloto</label><input ref={copilotNameRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Vehiculo</label>
          <select className='form-control' value={selectedVehicleId} onChange={(e) => onVehicleChange(e.target.value)}>
            <option value=''>Sin vehiculo</option>
            {vehicles.map(row => <option key={`dispatch-vehicle-${row.id}`} value={row.id}>{row.plate} - {row.label ?? row.code}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Zona</label>
          <select className='form-control' value={selectedZoneId} onChange={(e) => setSelectedZoneId(e.target.value)}>
            <option value=''>Sin zona</option>
            {zones.map(row => <option key={`dispatch-zone-${row.id}`} value={row.id}>{row.code} - {row.name}</option>)}
          </select>
          <div className='d-flex gap-2 mt-2'>
            <button type='button' className='btn btn-sm btn-outline-primary' onClick={() => openZoneModal()}>
              Nueva zona
            </button>
            <button type='button' className='btn btn-sm btn-outline-secondary' onClick={onOpenSelectedZone} disabled={!selectedZoneId}>
              Editar zona
            </button>
          </div>
        </div>
        <div className='col-md-4 mb-3'><label className='form-label'>Manifiesto</label><input ref={manifestCodeRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Estado</label>
          <select ref={dispatchStatusRef} className='form-control'>
            {dispatchStatusOptions
              .filter((option) => operationalDispatchStatuses.includes(option.value))
              .map((option) => (
                <option key={`dispatch-status-${option.value}`} value={option.value}>{option.label}</option>
              ))}
          </select>
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Licencia</label><input className='form-control' value={currentDriver?.license_number ?? ''} disabled /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Placa</label><input className='form-control' value={currentVehicle?.plate ?? ''} disabled /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Zona final</label><input className='form-control' value={currentZone?.name ?? ''} disabled /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Distrito zona</label><input className='form-control' value={currentZone?.district ?? ''} disabled /></div>
        <div className='col-12 mb-3'>
          <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2'>
            <div>
              <label className='form-label mb-0'>Pedidos asignados</label>
              <div className='dispatch-assignment-summary'>
                {!selectedWarehouseId
                  ? 'Selecciona un almacen para listar sus pedidos disponibles.'
                  : availableOrders.length > 0
                    ? `${availableOrders.length} pedido(s) disponible(s) del almacen seleccionado. ${selectedAvailableOrderCount} ya seleccionado(s).`
                    : 'No hay pedidos disponibles para este almacen. Revisa que el pedido tenga el mismo almacen y no este entregado/cancelado.'}
              </div>
            </div>
            <button type='button' className='btn btn-sm btn-outline-secondary' onClick={loadCommercialOrders} disabled={isLoadingOrders}>
              {isLoadingOrders ? 'Cargando pedidos...' : 'Recargar pedidos'}
            </button>
          </div>
          <div className='border rounded p-2'>
            <div className='dispatch-assignment-list'>
              {assignments.map(row => <div key={row.uid} className='dispatch-assignment-row'>
                <SelectFormGroup
                  col='dispatch-assignment-order-field'
                  label='Pedido'
                  value={row.commercial_order_id}
                  dropdownParent='#dispatch-form-container'
                  noMargin
                  effectWith={[assignmentSelectEffectKey]}
                  onChange={(e) => onAssignmentChange(row.uid, e.target.value)}
                >
                  <option value=''>{isLoadingOrders ? 'Cargando pedidos...' : 'Seleccione'}</option>
                  {!isLoadingOrders && availableOrders.length === 0 && <option value='' disabled>Sin pedidos disponibles</option>}
                  {availableOrders.map(order => {
                    const selectedInOtherRow = isOrderSelectedInOtherAssignment(order.id, row.uid)
                    return (
                      <option key={`dispatch-order-${order.id}`} value={order.id} disabled={selectedInOtherRow}>
                        {`${orderOptionLabel(order)}${selectedInOtherRow ? ' (ya seleccionado)' : ''}`}
                      </option>
                    )
                  })}
                </SelectFormGroup>
                <div className='dispatch-assignment-field'>
                  <label className='form-label'>Cliente</label>
                  <input className='form-control' value={row.customer_name} disabled />
                </div>
                <div className='dispatch-assignment-field'>
                  <label className='form-label'>Total</label>
                  <input className='form-control' value={Number(row.total || 0).toFixed(2)} disabled />
                </div>
                <div className='dispatch-assignment-field'>
                  <button
                    type='button'
                    className='btn btn-outline-danger w-100 dispatch-assignment-remove'
                    title='Eliminar pedido asignado'
                    onClick={() => setAssignments(prev => prev.length === 1 ? [emptyAssignment()] : prev.filter(item => item.uid !== row.uid))}
                  >
                    <i className='mdi mdi-delete'></i>
                  </button>
                </div>
              </div>)}
            </div>
            <button type='button' className='btn btn-sm btn-outline-primary mt-2' onClick={() => setAssignments(prev => [...prev, emptyAssignment()])} disabled={!canAddAssignment}>
              Agregar pedido
            </button>
          </div>
        </div>
        <div className='col-12 mb-1'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>

    <Modal modalRef={zoneModalRef} title={isEditingZone ? 'Editar zona' : 'Nueva zona'} size='lg' onSubmit={onSaveZone}>
      <div className='row'>
        <input ref={zoneIdRef} hidden />
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Empresa</label>
          <select ref={zoneBusinessRef} className='form-control'>
            <option value=''>Global</option>
            {businesses.map(row => <option key={`dispatch-zone-business-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-md-8 mb-3'>
          <label className='form-label'>Nombre</label>
          <input ref={zoneNameRef} className='form-control' placeholder='Ej. Lima Norte' required />
        </div>
        <UbigeoCascade
          value={zoneLocation}
          onChange={setZoneLocation}
          showUbigeo={false}
          departmentCol='col-md-4'
          provinceCol='col-md-4'
          districtCol='col-md-4'
          required
        />
        <div className='col-12 mb-3'>
          <label className='form-label'>Referencia</label>
          <textarea ref={zoneReferenceRef} className='form-control' rows='2' />
        </div>
        <div className='col-12'>
          <label className='form-label'>Observaciones</label>
          <textarea ref={zoneObservationsRef} className='form-control' rows='2' />
        </div>
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
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Tipo doc.</label>
          <select className='form-control' value={evidenceForm.recipient_document_type} onChange={(e) => onEvidenceFieldChange('recipient_document_type', e.target.value)}>
            <option value='DNI'>DNI</option>
            <option value='RUC'>RUC</option>
            <option value='CE'>CE</option>
            <option value='OTRO'>Otro</option>
          </select>
        </div>
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
          <input ref={evidenceFileRef} className='form-control' type='file' accept='image/png,image/jpeg,image/webp,image/gif' capture='environment' onChange={onDispatchEvidenceFileChange} />
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
