import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import ActivitiesRest from '../Actions/Admin/ActivitiesRest';
import {
  activityStatusOptions,
  activityTypeOptions,
  getDispatchStatusLabel,
  toLookup,
} from '../Utils/statusLabels';

const activitiesRest = new ActivitiesRest()
const emptyItem = () => ({ uid: crypto.randomUUID(), commercial_order_item_id: '', article_id: '', item_code: '', description: '', quantity: 1, delivered_quantity: 0 })

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
  const [items, setItems] = useState([emptyItem()])

  const orderMap = useMemo(() => Object.fromEntries(orders.map(row => [`${row.id}`, row])), [orders])
  const dispatchMap = useMemo(() => Object.fromEntries(dispatches.map(row => [`${row.id}`, row])), [dispatches])
  const articleMap = useMemo(() => Object.fromEntries(articles.map(row => [`${row.id}`, row])), [articles])
  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(row => [`${row.id}`, row])), [vehicles])

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
    setWarehouses(warehouseRows ?? [])
    setOrders((orderRows ?? []).filter(row => row.status !== null && row.order_status !== 'cancelled'))
    setDispatches((dispatchRows ?? []).filter(row => row.status !== null))
    setDrivers(driverRows ?? [])
    setVehicles(vehicleRows ?? [])
    setZones(zoneRows ?? [])
    setClients(clientRows ?? [])
    setEventualClients(eventualRows ?? [])
    setArticles(articleRows ?? [])
  }

  useEffect(() => { loadCatalogs() }, [])

  const loadBranches = async (businessId, preferred = '') => {
    const data = await activitiesRest.getBranchesByBusiness(businessId)
    setBranches(data ?? [])
    setSelectedBranchId(preferred ? `${preferred}` : '')
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

  const onModalOpen = async (data = null) => {
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    transferDateRef.current.value = data?.transfer_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    activityTypeRef.current.value = data?.activity_type ?? 'delivery'
    activityStatusRef.current.value = data?.activity_status ?? 'scheduled'
    manifestCodeRef.current.value = data?.manifest_code ?? ''
    customerNameRef.current.value = data?.customer_name ?? ''
    documentNumberRef.current.value = data?.document_number ?? ''
    originAddressRef.current.value = data?.origin_address ?? ''
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
    setSelectedBusinessId(data?.business_id ? `${data.business_id}` : '')
    setSelectedWarehouseId(data?.warehouse_id ? `${data.warehouse_id}` : '')
    setSelectedOrderId(data?.commercial_order_id ? `${data.commercial_order_id}` : '')
    setSelectedDispatchId(data?.dispatch_id ? `${data.dispatch_id}` : '')
    setSelectedClientId(data?.client_id ? `${data.client_id}` : '')
    setSelectedEventualClientId(data?.eventual_client_id ? `${data.eventual_client_id}` : '')
    setSelectedDriverId(data?.driver_id ? `${data.driver_id}` : '')
    setSelectedVehicleId(data?.vehicle_id ? `${data.vehicle_id}` : '')
    setSelectedZoneId(data?.zone_id ? `${data.zone_id}` : '')
    await loadBranches(data?.business_id ?? '', data?.business_branch_id ?? '')
    setItems((data?.items ?? []).map(row => ({ uid: crypto.randomUUID(), commercial_order_item_id: `${row.commercial_order_item_id ?? ''}`, article_id: `${row.article_id ?? ''}`, item_code: row.item_code ?? '', description: row.description ?? '', quantity: Number(row.quantity || 0), delivered_quantity: Number(row.delivered_quantity || 0) })) || [emptyItem()])
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
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      commercial_order_id: selectedOrderId || null,
      dispatch_id: selectedDispatchId || null,
      client_id: selectedClientId || null,
      eventual_client_id: selectedEventualClientId || null,
      driver_id: selectedDriverId || null,
      vehicle_id: selectedVehicleId || null,
      zone_id: selectedZoneId || null,
      activity_type: activityTypeRef.current.value,
      activity_status: activityStatusRef.current.value,
      transfer_date: transferDateRef.current.value,
      customer_name: customerNameRef.current.value.trim(),
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

  return <>
    <Table
      gridRef={gridRef}
      title='Actividades'
      rest={activitiesRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        { dataField: 'code', caption: 'Codigo', width: 110 },
        { dataField: 'transfer_date', caption: 'Fecha', dataType: 'date', width: 110 },
        { dataField: 'activity_type', caption: 'Tipo', width: 110, lookup: toLookup(activityTypeOptions) },
        { dataField: 'customer_name', caption: 'Cliente', minWidth: 180 },
        { caption: 'Pedido', width: 120, calculateCellValue: (row) => row.commercial_order?.code ?? row.commercialOrder?.code ?? '-' },
        { caption: 'Despacho', width: 120, calculateCellValue: (row) => row.dispatch?.code ?? '-' },
        { caption: 'Conductor', minWidth: 160, calculateCellValue: (row) => row.driver?.full_name ?? '-' },
        { caption: 'Vehiculo', minWidth: 140, calculateCellValue: (row) => row.vehicle?.plate ?? '-' },
        { caption: 'Zona', minWidth: 140, calculateCellValue: (row) => row.zone?.name ?? '-' },
        { dataField: 'activity_status', caption: 'Estado', width: 110, lookup: toLookup(activityStatusOptions) },
        { caption: 'Acciones', width: 130, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css('text-overflow', 'unset')
          container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
        } }
      ]}
    />

    <Modal modalRef={modalRef} title='Actividad' size='xl' onSubmit={onSave}>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' disabled /></div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Empresa</label>
          <select className='form-control' value={selectedBusinessId} onChange={async (e) => { setSelectedBusinessId(e.target.value); await loadBranches(e.target.value, ''); }} required>
            <option value=''>Seleccione</option>
            {businesses.map(row => <option key={`activity-business-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Sede</label>
          <select className='form-control' value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>
            <option value=''>Seleccione</option>
            {branches.map(row => <option key={`activity-branch-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Almacen</label>
          <select className='form-control' value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)}>
            <option value=''>Seleccione</option>
            {warehouses.map(row => <option key={`activity-warehouse-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Pedido comercial</label>
          <select className='form-control' value={selectedOrderId} onChange={(e) => { setSelectedOrderId(e.target.value); hydrateOrder(orderMap[e.target.value]); }}>
            <option value=''>Sin pedido</option>
            {orders.map(row => <option key={`activity-order-${row.id}`} value={row.id}>{row.code} - {row.client?.full_name ?? row.eventual_client?.business_name ?? row.eventualClient?.business_name ?? 'Cliente'}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Despacho</label>
          <select className='form-control' value={selectedDispatchId} onChange={(e) => { setSelectedDispatchId(e.target.value); hydrateDispatch(dispatchMap[e.target.value]); }}>
            <option value=''>Sin despacho</option>
            {dispatches.map(row => <option key={`activity-dispatch-${row.id}`} value={row.id}>{row.code} - {getDispatchStatusLabel(row.dispatch_status)}</option>)}
          </select>
        </div>
        <div className='col-md-2 mb-3'><label className='form-label'>Fecha</label><input ref={transferDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Manifiesto</label><input ref={manifestCodeRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Cliente regular</label>
          <select className='form-control' value={selectedClientId} onChange={(e) => { setSelectedClientId(e.target.value); if (e.target.value) setSelectedEventualClientId('') }}>
            <option value=''>Sin cliente regular</option>
            {clients.map(row => <option key={`activity-client-${row.id}`} value={row.id}>{row.full_name}</option>)}
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Cliente eventual</label>
          <select className='form-control' value={selectedEventualClientId} onChange={(e) => { setSelectedEventualClientId(e.target.value); if (e.target.value) setSelectedClientId('') }}>
            <option value=''>Sin eventual</option>
            {eventualClients.map(row => <option key={`activity-eventual-${row.id}`} value={row.id}>{row.business_name}</option>)}
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Tipo</label>
          <select ref={activityTypeRef} className='form-control'>
            {activityTypeOptions.map((option) => (
              <option key={`activity-type-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Estado</label>
          <select ref={activityStatusRef} className='form-control'>
            {activityStatusOptions.map((option) => (
              <option key={`activity-status-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Conductor</label>
          <select className='form-control' value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}>
            <option value=''>Sin conductor</option>
            {drivers.map(row => <option key={`activity-driver-${row.id}`} value={row.id}>{row.code} - {row.full_name}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Vehiculo</label>
          <select className='form-control' value={selectedVehicleId} onChange={(e) => onVehicleChange(e.target.value)}>
            <option value=''>Sin vehiculo</option>
            {vehicles.map(row => <option key={`activity-vehicle-${row.id}`} value={row.id}>{row.plate} - {row.label ?? row.code}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Zona</label>
          <select className='form-control' value={selectedZoneId} onChange={(e) => setSelectedZoneId(e.target.value)}>
            <option value=''>Sin zona</option>
            {zones.map(row => <option key={`activity-zone-${row.id}`} value={row.id}>{row.code} - {row.name}</option>)}
          </select>
        </div>
        <div className='col-md-8 mb-3'><label className='form-label'>Cliente visible</label><input ref={customerNameRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Documento</label><input ref={documentNumberRef} className='form-control' /></div>
        <div className='col-12 mb-3'><label className='form-label'>Origen</label><input ref={originAddressRef} className='form-control' /></div>
        <div className='col-12 mb-3'><label className='form-label'>Destino</label><input ref={destinationAddressRef} className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>Referencia destino</label><input ref={destinationReferenceRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Contacto</label><input ref={dispatchContactNameRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Telefono contacto</label><input ref={dispatchContactPhoneRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Ubigeo</label><input ref={ubigeoRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Latitud</label><input ref={mapLatRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Longitud</label><input ref={mapLngRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Bultos</label><input ref={packageCountRef} type='number' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Peso bruto</label><input ref={grossWeightRef} type='number' step='0.01' className='form-control' /></div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Items</label>
          <div className='border rounded p-2'>
            {items.map(row => <div key={row.uid} className='row align-items-end mb-2'>
              <div className='col-md-4'>
                <label className='form-label'>Articulo</label>
                <select className='form-control' value={row.article_id} onChange={(e) => onItemChange(row.uid, 'article_id', e.target.value)}>
                  <option value=''>Manual</option>
                  {articles.map(article => <option key={`activity-article-${article.id}`} value={article.id}>{article.code} - {article.name}</option>)}
                </select>
              </div>
              <div className='col-md-2'><label className='form-label'>Codigo</label><input className='form-control' value={row.item_code} onChange={(e) => onItemChange(row.uid, 'item_code', e.target.value)} /></div>
              <div className='col-md-3'><label className='form-label'>Descripcion</label><input className='form-control' value={row.description} onChange={(e) => onItemChange(row.uid, 'description', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Cant.</label><input type='number' step='0.001' className='form-control' value={row.quantity} onChange={(e) => onItemChange(row.uid, 'quantity', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Ent.</label><input type='number' step='0.001' className='form-control' value={row.delivered_quantity} onChange={(e) => onItemChange(row.uid, 'delivered_quantity', e.target.value)} /></div>
              <div className='col-md-1'><button type='button' className='btn btn-outline-danger w-100' onClick={() => setItems(prev => prev.length === 1 ? [emptyItem()] : prev.filter(item => item.uid !== row.uid))}>-</button></div>
            </div>)}
            <button type='button' className='btn btn-sm btn-outline-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}>Agregar item</button>
          </div>
        </div>
        <div className='col-12'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.can('activity') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Actividades'><Activities {...properties} /></BaseAdminto>)
})
