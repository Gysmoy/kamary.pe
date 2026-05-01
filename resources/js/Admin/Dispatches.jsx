import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import DispatchesRest from '../Actions/Admin/DispatchesRest';
import {
  dispatchStatusOptions,
  getShiftLabel,
  shiftOptions,
  toLookup,
} from '../Utils/statusLabels';

const dispatchesRest = new DispatchesRest()
const emptyAssignment = () => ({ uid: crypto.randomUUID(), commercial_order_id: '', customer_name: '', total: 0 })

const Dispatches = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const scheduledDateRef = useRef()
  const shiftRef = useRef()
  const copilotNameRef = useRef()
  const manifestCodeRef = useRef()
  const dispatchStatusRef = useRef()
  const observationsRef = useRef()

  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [orders, setOrders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [zones, setZones] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [assignments, setAssignments] = useState([emptyAssignment()])
  const [isEditing, setIsEditing] = useState(false)

  const orderMap = useMemo(() => Object.fromEntries(orders.map(order => [`${order.id}`, order])), [orders])
  const driverMap = useMemo(() => Object.fromEntries(drivers.map(row => [`${row.id}`, row])), [drivers])
  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(row => [`${row.id}`, row])), [vehicles])
  const zoneMap = useMemo(() => Object.fromEntries(zones.map(row => [`${row.id}`, row])), [zones])

  const loadCatalogs = async () => {
    const [businessList, warehouseList, orderList, driverList, vehicleList, zoneList] = await Promise.all([
      dispatchesRest.getBusinesses(),
      dispatchesRest.getWarehouses(),
      dispatchesRest.getCommercialOrders(),
      dispatchesRest.getDrivers(),
      dispatchesRest.getVehicles(),
      dispatchesRest.getZones(),
    ])
    setBusinesses(businessList)
    setWarehouses(warehouseList)
    setOrders((orderList ?? []).filter(row => row.status !== null && row.order_status !== 'cancelled'))
    setDrivers(driverList ?? [])
    setVehicles(vehicleList ?? [])
    setZones(zoneList ?? [])
  }

  useEffect(() => { loadCatalogs() }, [])

  const loadBranches = async (businessId, preferred = '') => {
    const data = await dispatchesRest.getBranchesByBusiness(businessId)
    setBranches(data ?? [])
    setSelectedBranchId(preferred ? `${preferred}` : '')
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    scheduledDateRef.current.value = data?.scheduled_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    shiftRef.current.value = data?.shift ?? 'Manana'
    copilotNameRef.current.value = data?.copilot_name ?? ''
    manifestCodeRef.current.value = data?.manifest_code ?? ''
    dispatchStatusRef.current.value = data?.dispatch_status ?? 'waiting'
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
    setAssignments(prev => prev.map(row => row.uid === uid ? {
      ...row,
      commercial_order_id: value,
      customer_name: order ? (order.client?.full_name ?? order.eventual_client?.business_name ?? order.eventualClient?.business_name ?? '') : '',
      total: Number(order?.total || 0)
    } : row))
  }

  const onVehicleChange = (value) => {
    setSelectedVehicleId(value)
    const vehicle = vehicleMap[value]
    if (vehicle?.zone_id) setSelectedZoneId(`${vehicle.zone_id}`)
  }

  const onSave = async (e) => {
    e.preventDefault()
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
      assignments: assignments.filter(row => row.commercial_order_id).map(row => ({ commercial_order_id: row.commercial_order_id }))
    }
    const result = await dispatchesRest.save(request)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar despacho', text: 'Se dara de baja el despacho y su salida tecnica.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await dispatchesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const currentDriver = driverMap[selectedDriverId]
  const currentVehicle = vehicleMap[selectedVehicleId]
  const currentZone = zoneMap[selectedZoneId]

  return <>
    <Table
      gridRef={gridRef}
      title='Despachos'
      rest={dispatchesRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        { dataField: 'id', caption: 'ID', width: 70 },
        { dataField: 'code', caption: 'Codigo', width: 120 },
        { dataField: 'scheduled_date', caption: 'Fecha', dataType: 'date', width: 110 },
        { dataField: 'shift', caption: 'Turno', width: 90, calculateCellValue: (data) => getShiftLabel(data.shift) },
        { caption: 'Placa', width: 110, calculateCellValue: (data) => data.vehicle?.plate ?? data.vehicle_plate ?? '-' },
        { caption: 'Conductor', minWidth: 180, calculateCellValue: (data) => data.driver?.full_name ?? data.driver_name ?? '-' },
        { caption: 'Zona', minWidth: 140, calculateCellValue: (data) => data.zone_master?.name ?? data.zoneMaster?.name ?? data.zone ?? '-' },
        { dataField: 'dispatch_status', caption: 'Estado', width: 110, lookup: toLookup(dispatchStatusOptions) },
        { caption: 'Pedidos', width: 90, cellTemplate: (container, { data }) => container.text((data.assignments ?? []).length) },
        { caption: 'Acciones', width: 130, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css('text-overflow', 'unset')
          container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
        } }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar despacho' : 'Agregar despacho'} size='xl' onSubmit={onSave}>
      <div className='row'>
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
        </div>
        <div className='col-md-4 mb-3'><label className='form-label'>Manifiesto</label><input ref={manifestCodeRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Estado</label>
          <select ref={dispatchStatusRef} className='form-control'>
            {dispatchStatusOptions
              .filter((option) => ['waiting', 'assigned', 'in_route', 'delivered', 'incident', 'closed', 'cancelled'].includes(option.value))
              .map((option) => (
                <option key={`dispatch-status-${option.value}`} value={option.value}>{option.label}</option>
              ))}
          </select>
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Licencia</label><input className='form-control' value={currentDriver?.license_number ?? ''} disabled /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Placa</label><input className='form-control' value={currentVehicle?.plate ?? ''} disabled /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Zona final</label><input className='form-control' value={currentZone?.name ?? ''} disabled /></div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Pedidos asignados</label>
          <div className='border rounded p-2'>
            {assignments.map(row => <div key={row.uid} className='row align-items-end mb-2'>
              <div className='col-md-6'>
                <label className='form-label'>Pedido</label>
                <select className='form-control' value={row.commercial_order_id} onChange={(e) => onAssignmentChange(row.uid, e.target.value)}>
                  <option value=''>Seleccione</option>
                  {orders.map(order => <option key={`dispatch-order-${order.id}`} value={order.id}>{order.code} - {order.client?.full_name ?? order.eventual_client?.business_name ?? order.eventualClient?.business_name ?? 'Cliente'}</option>)}
                </select>
              </div>
              <div className='col-md-3'><label className='form-label'>Cliente</label><input className='form-control' value={row.customer_name} disabled /></div>
              <div className='col-md-2'><label className='form-label'>Total</label><input className='form-control' value={Number(row.total || 0).toFixed(2)} disabled /></div>
              <div className='col-md-1'><button type='button' className='btn btn-outline-danger w-100' onClick={() => setAssignments(prev => prev.length === 1 ? [emptyAssignment()] : prev.filter(item => item.uid !== row.uid))}>-</button></div>
            </div>)}
            <button type='button' className='btn btn-sm btn-outline-primary' onClick={() => setAssignments(prev => [...prev, emptyAssignment()])}>Agregar pedido</button>
          </div>
        </div>
        <div className='col-12 mb-1'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.can('dispatch') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Despachos'><Dispatches {...properties} /></BaseAdminto>)
})
