import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Modal from '../Components/Adminto/Modal';
import DispatchesRest from '../Actions/Admin/DispatchesRest';
import CommercialOrdersRest from '../Actions/Admin/CommercialOrdersRest';
import Swal from 'sweetalert2';
import { getDispatchStatusLabel } from '../Utils/statusLabels';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';

const dispatchesRest = new DispatchesRest()
const commercialOrdersRest = new CommercialOrdersRest()

const nowDateTimeLocal = () => {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

const dispatchAssignments = (dispatch) => dispatch?.assignments ?? []
const dispatchEvidences = (dispatch) => dispatch?.delivery_evidences ?? dispatch?.deliveryEvidences ?? []
const assignmentOrder = (assignment) => assignment?.commercial_order ?? assignment?.commercialOrder
const customerName = (assignment) => assignment?.customer_name
  ?? assignmentOrder(assignment)?.client?.full_name
  ?? assignmentOrder(assignment)?.eventual_client?.business_name
  ?? assignmentOrder(assignment)?.eventualClient?.business_name
  ?? '-'

const textValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value.address ?? value.reference ?? value.name ?? value.description ?? fallback
  const text = `${value}`.trim()
  return text === '[object Object]' ? fallback : text
}

const orderAddress = (order) => textValue(order?.delivery_address ?? order?.dispatch_address)
const latestEvidenceForOrder = (dispatch, orderId) => (
  dispatchEvidences(dispatch).find((evidence) => `${evidence?.commercial_order_id}` === `${orderId}`) ?? null
)

const evidenceProgress = (dispatch) => {
  const assignments = dispatchAssignments(dispatch)
  const assignmentIds = new Set(assignments.map((assignment) => `${assignment?.commercial_order_id ?? assignmentOrder(assignment)?.id ?? ''}`).filter(Boolean))
  const covered = new Set(dispatchEvidences(dispatch)
    .map((evidence) => `${evidence?.commercial_order_id ?? ''}`)
    .filter((orderId) => assignmentIds.has(orderId)))
  return { covered: covered.size, total: assignments.length }
}

const googleMapsRouteUrl = (dispatch) => {
  const stops = [...new Set(dispatchAssignments(dispatch)
    .map((assignment) => orderAddress(assignmentOrder(assignment)))
    .filter(Boolean))]
  if (stops.length === 0) return null
  if (stops.length === 1) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stops[0])}`
  const destination = stops[stops.length - 1]
  const waypoints = stops.slice(0, -1).join('|')
  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}`
}

const routeFilter = (driverId, status) => {
  const statusFilter = status === 'all'
    ? [['dispatch_status', '=', 'in_route'], 'or', ['dispatch_status', '=', 'delivered']]
    : ['dispatch_status', '=', status]

  if (!driverId) return statusFilter
  return [statusFilter, 'and', ['driver_id', '=', Number(driverId)]]
}

const DriverRoutes = () => {
  const evidenceModalRef = useRef()
  const evidenceFileRef = useRef()

  const [drivers, setDrivers] = useState([])
  const [dispatches, setDispatches] = useState([])
  const [selectedDriverId, setSelectedDriverId] = useState(new URLSearchParams(window.location.search).get('driver_id') ?? '')
  const [selectedStatus, setSelectedStatus] = useState('in_route')
  const [loading, setLoading] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [evidencePreview, setEvidencePreview] = useState('')
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

  const selectedOrder = useMemo(() => assignmentOrder(selectedAssignment) ?? null, [selectedAssignment])

  const loadDrivers = async () => {
    const rows = await dispatchesRest.getDrivers()
    setDrivers(rows ?? [])
  }

  const loadDispatches = async () => {
    setLoading(true)
    try {
      const result = await dispatchesRest.paginate({
        take: 1000,
        skip: 0,
        isLoadingAll: true,
        filter: routeFilter(selectedDriverId, selectedStatus),
        sort: [{ selector: 'scheduled_date', desc: false }],
      })
      setDispatches(result?.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDrivers() }, [])
  useEffect(() => { loadDispatches() }, [selectedDriverId, selectedStatus])
  useEffect(() => () => {
    if (evidencePreview?.startsWith('blob:')) URL.revokeObjectURL(evidencePreview)
  }, [evidencePreview])

  const openRoute = (dispatch) => {
    const url = googleMapsRouteUrl(dispatch)
    if (!url) {
      Swal.fire('Ruta no disponible', 'Los pedidos no tienen direccion de entrega registrada.', 'info')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const openEvidence = (dispatch, assignment) => {
    const order = assignmentOrder(assignment) ?? {}
    const orderId = assignment?.commercial_order_id ?? order?.id
    if (!orderId) return
    const evidence = latestEvidenceForOrder(dispatch, orderId)

    setSelectedDispatch(dispatch)
    setSelectedAssignment(assignment)
    setEvidenceFile(null)
    setEvidencePreview(evidence?.evidence_url ?? '')
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
        setEvidenceForm((prev) => ({
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

  const onEvidenceFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setEvidenceFile(file)
    setEvidencePreview(file ? URL.createObjectURL(file) : evidenceForm.evidence_url)
  }

  const onEvidenceFieldChange = (field, value) => setEvidenceForm((prev) => ({ ...prev, [field]: value }))

  const saveEvidence = async (event) => {
    event.preventDefault()
    const order = selectedOrder
    const orderId = selectedAssignment?.commercial_order_id ?? order?.id
    if (!orderId || !selectedDispatch?.id) return

    const request = new FormData()
    request.append('dispatch_id', selectedDispatch.id)
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

    const result = await commercialOrdersRest.saveDeliveryEvidence(orderId, request)
    if (!result?.data) return

    $(evidenceModalRef.current).modal('hide')
    await loadDispatches()
  }

  return (
    <>
      <div className='card'>
        <div className='card-header d-flex flex-wrap justify-content-between align-items-center gap-2'>
          <div>
            <h4 className='card-title mb-0'>Ruta conductor</h4>
            <small className='text-muted'>Despachos en ruta y registro de entrega</small>
          </div>
          <button type='button' className='btn btn-sm btn-outline-primary' onClick={loadDispatches} disabled={loading}>
            <i className='mdi mdi-refresh me-1'></i>Actualizar
          </button>
        </div>
        <div className='card-body'>
          <div className='row g-2 mb-3'>
            <div className='col-md-5'>
              <label className='form-label'>Conductor</label>
              <select className='form-control' value={selectedDriverId} onChange={(event) => setSelectedDriverId(event.target.value)}>
                <option value=''>Todos los conductores</option>
                {drivers.map((driver) => (
                  <option key={`route-driver-${driver.id}`} value={driver.id}>{driver.code} - {driver.full_name}</option>
                ))}
              </select>
            </div>
            <div className='col-md-3'>
              <label className='form-label'>Estado</label>
              <select className='form-control' value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                <option value='in_route'>En ruta</option>
                <option value='delivered'>Entregado</option>
                <option value='all'>En ruta y entregado</option>
              </select>
            </div>
          </div>

          {loading && <div className='text-muted'>Cargando rutas...</div>}
          {!loading && dispatches.length === 0 && <div className='alert alert-info mb-0'>No hay despachos para el filtro seleccionado.</div>}

          <div className='d-grid gap-3'>
            {dispatches.map((dispatch) => {
              const progress = evidenceProgress(dispatch)
              return (
                <div className='border rounded p-3' key={`driver-route-${dispatch.id}`}>
                  <div className='d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3'>
                    <div>
                      <div className='fw-semibold'>{dispatch.code} {dispatch.manifest_code ? `| Manifiesto ${dispatch.manifest_code}` : ''}</div>
                      <small className='text-muted'>
                        {[dispatch.scheduled_date?.toString?.().slice?.(0, 10), dispatch.driver?.full_name ?? dispatch.driver_name, dispatch.vehicle?.plate ?? dispatch.vehicle_plate, dispatch.zone_master?.name ?? dispatch.zoneMaster?.name ?? dispatch.zone].filter(Boolean).join(' | ')}
                      </small>
                    </div>
                    <div className='d-flex flex-wrap gap-2 align-items-center'>
                      <span className='badge bg-info'>{getDispatchStatusLabel(dispatch.dispatch_status)}</span>
                      <span className={progress.total > 0 && progress.covered >= progress.total ? 'badge bg-success' : 'badge bg-warning text-dark'}>
                        {progress.covered}/{progress.total} evidencias
                      </span>
                      <button type='button' className='btn btn-sm btn-outline-primary' onClick={() => openRoute(dispatch)}>
                        <i className='mdi mdi-map-marker-path me-1'></i>Mapa
                      </button>
                      <button type='button' className='btn btn-sm btn-outline-danger' onClick={() => openMagistralesRecordPdf(buildMagistralesRows.dispatch(dispatch))}>
                        <i className='mdi mdi-file-pdf-box me-1'></i>PDF
                      </button>
                    </div>
                  </div>

                  <div className='table-responsive'>
                    <table className='table table-sm table-bordered align-middle mb-0'>
                      <thead>
                        <tr>
                          <th>Pedido</th>
                          <th>Cliente</th>
                          <th>Direccion</th>
                          <th>Contacto</th>
                          <th>Entrega</th>
                          <th style={{ width: 150 }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dispatchAssignments(dispatch).map((assignment) => {
                          const order = assignmentOrder(assignment) ?? {}
                          const orderId = assignment?.commercial_order_id ?? order?.id
                          const evidence = latestEvidenceForOrder(dispatch, orderId)
                          return (
                            <tr key={`driver-route-assignment-${dispatch.id}-${assignment.id ?? orderId}`}>
                              <td>
                                <div className='fw-semibold'>{order?.code ?? assignment?.commercial_order_code ?? orderId}</div>
                                <small className='text-muted'>{getDispatchStatusLabel(order?.dispatch_status ?? assignment?.assignment_status)}</small>
                              </td>
                              <td>{customerName(assignment)}</td>
                              <td>{orderAddress(order) || '-'}</td>
                              <td>{[order?.dispatch_contact_name, order?.dispatch_contact_phone].filter(Boolean).join(' | ') || '-'}</td>
                              <td>
                                {evidence ? (
                                  <>
                                    <span className='badge bg-success'>Registrada</span>
                                    <div><small>{evidence.delivered_at ? new Date(evidence.delivered_at).toLocaleString('es-PE') : ''}</small></div>
                                  </>
                                ) : <span className='badge bg-warning text-dark'>Pendiente</span>}
                              </td>
                              <td>
                                <button type='button' className='btn btn-sm btn-success' onClick={() => openEvidence(dispatch, assignment)}>
                                  {evidence ? 'Actualizar' : 'Entregar'}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Modal modalRef={evidenceModalRef} title={`Entrega ${selectedOrder?.code ?? ''}`.trim()} size='lg' btnSubmitText='Guardar entrega' onSubmit={saveEvidence}>
        <div className='row'>
          <div className='col-md-6 mb-3'>
            <label className='form-label'>Recibido por</label>
            <input className='form-control' value={evidenceForm.recipient_name} onChange={(event) => onEvidenceFieldChange('recipient_name', event.target.value)} />
          </div>
          <div className='col-md-3 mb-3'>
            <label className='form-label'>Tipo doc.</label>
            <select className='form-control' value={evidenceForm.recipient_document_type} onChange={(event) => onEvidenceFieldChange('recipient_document_type', event.target.value)}>
              <option value='DNI'>DNI</option>
              <option value='RUC'>RUC</option>
              <option value='CE'>CE</option>
              <option value='OTRO'>Otro</option>
            </select>
          </div>
          <div className='col-md-3 mb-3'>
            <label className='form-label'>Numero</label>
            <input className='form-control' value={evidenceForm.recipient_document_number} onChange={(event) => onEvidenceFieldChange('recipient_document_number', event.target.value)} />
          </div>
          <div className='col-md-4 mb-3'>
            <label className='form-label'>Telefono</label>
            <input className='form-control' value={evidenceForm.recipient_phone} onChange={(event) => onEvidenceFieldChange('recipient_phone', event.target.value)} />
          </div>
          <div className='col-md-4 mb-3'>
            <label className='form-label'>Fecha entrega</label>
            <input type='datetime-local' className='form-control' value={evidenceForm.delivered_at} onChange={(event) => onEvidenceFieldChange('delivered_at', event.target.value)} />
          </div>
          <div className='col-md-4 mb-3'>
            <label className='form-label'>Foto</label>
            <input ref={evidenceFileRef} type='file' accept='image/*' capture='environment' className='form-control' onChange={onEvidenceFileChange} />
          </div>
          <div className='col-md-3 mb-3'>
            <label className='form-label'>Latitud</label>
            <input className='form-control' value={evidenceForm.latitude} onChange={(event) => onEvidenceFieldChange('latitude', event.target.value)} />
          </div>
          <div className='col-md-3 mb-3'>
            <label className='form-label'>Longitud</label>
            <input className='form-control' value={evidenceForm.longitude} onChange={(event) => onEvidenceFieldChange('longitude', event.target.value)} />
          </div>
          <div className='col-12 mb-3'>
            <label className='form-label'>Notas</label>
            <textarea className='form-control' rows='2' value={evidenceForm.evidence_notes} onChange={(event) => onEvidenceFieldChange('evidence_notes', event.target.value)} />
          </div>
          {evidencePreview && (
            <div className='col-12'>
              <img src={evidencePreview} alt='Evidencia' className='img-fluid rounded border' style={{ maxHeight: 260 }} />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

CreateReactScript((el, properties) => {
  if (!properties.can('dispatch') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Ruta conductor'><DriverRoutes {...properties} /></BaseAdminto>)
})
