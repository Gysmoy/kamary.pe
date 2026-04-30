import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import VehiclesRest from '../Actions/Admin/VehiclesRest';
import ZonesRest from '../Actions/Admin/ZonesRest';
import UbigeoCascade from '@Adminto/form/UbigeoCascade';
import { EMPTY_UBIGEO_SELECTION } from '../Utils/ubigeoInei';

const vehiclesRest = new VehiclesRest()
const zonesRest = new ZonesRest()
const VIEW_FILTERS = [
  { key: 'all', label: 'Todo' },
  { key: 'zones', label: 'Solo zonas' },
  { key: 'vehicles', label: 'Solo vehiculos' },
]

const VehicleZones = () => {
  const zoneGridRef = useRef()
  const vehicleGridRef = useRef()
  const zoneModalRef = useRef()
  const vehicleModalRef = useRef()

  const zoneIdRef = useRef()
  const zoneBusinessRef = useRef()
  const zoneNameRef = useRef()
  const zoneReferenceRef = useRef()
  const zoneObservationsRef = useRef()

  const vehicleIdRef = useRef()
  const vehicleBusinessRef = useRef()
  const vehicleZoneRef = useRef()
  const vehiclePlateRef = useRef()
  const vehicleLabelRef = useRef()
  const vehicleBrandRef = useRef()
  const vehicleModelRef = useRef()
  const vehicleColorRef = useRef()
  const vehicleTypeRef = useRef()
  const vehicleCapacityRef = useRef()
  const vehicleWeightRef = useRef()
  const vehicleObservationsRef = useRef()

  const [businesses, setBusinesses] = useState([])
  const [zones, setZones] = useState([])
  const [zoneLocation, setZoneLocation] = useState(EMPTY_UBIGEO_SELECTION)
  const [viewFilter, setViewFilter] = useState('all')

  const refreshZones = async () => {
    const data = await zonesRest.paginate({ take: 1000, skip: 0, isLoadingAll: true })
    const rows = data?.data ?? []
    setZones(rows)
    return rows
  }

  useEffect(() => {
    Promise.all([zonesRest.getBusinesses(), refreshZones()]).then(([businessRows]) => {
      setBusinesses(businessRows ?? [])
    })
  }, [])

  const openZoneModal = (row = null) => {
    zoneIdRef.current.value = row?.id ?? ''
    zoneBusinessRef.current.value = row?.business_id ?? ''
    zoneNameRef.current.value = row?.name ?? ''
    setZoneLocation({
      ubigeo: row?.ubigeo ?? '',
      department: row?.department ?? '',
      province: row?.province ?? '',
      district: row?.district ?? '',
    })
    zoneReferenceRef.current.value = row?.reference ?? ''
    zoneObservationsRef.current.value = row?.observations ?? ''
    $(zoneModalRef.current).modal('show')
  }

  const saveZone = async (e) => {
    e.preventDefault()
    const result = await zonesRest.save({
      id: zoneIdRef.current.value || undefined,
      business_id: zoneBusinessRef.current.value || null,
      name: zoneNameRef.current.value.trim(),
      ubigeo: zoneLocation.ubigeo.trim(),
      department: zoneLocation.department.trim(),
      province: zoneLocation.province.trim(),
      district: zoneLocation.district.trim(),
      reference: zoneReferenceRef.current.value.trim(),
      observations: zoneObservationsRef.current.value.trim(),
    })
    if (!result) return
    $(zoneGridRef.current).dxDataGrid('instance').refresh()
    await refreshZones()
    $(zoneModalRef.current).modal('hide')
  }

  const deleteZone = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar zona', text: 'El registro quedara inactivo.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const ok = await zonesRest.delete(id)
    if (!ok) return
    $(zoneGridRef.current).dxDataGrid('instance').refresh()
    await refreshZones()
  }

  const openVehicleModal = (row = null) => {
    vehicleIdRef.current.value = row?.id ?? ''
    vehicleBusinessRef.current.value = row?.business_id ?? ''
    vehicleZoneRef.current.value = row?.zone_id ?? ''
    vehiclePlateRef.current.value = row?.plate ?? ''
    vehicleLabelRef.current.value = row?.label ?? ''
    vehicleBrandRef.current.value = row?.brand ?? ''
    vehicleModelRef.current.value = row?.model ?? ''
    vehicleColorRef.current.value = row?.color ?? ''
    vehicleTypeRef.current.value = row?.vehicle_type ?? ''
    vehicleCapacityRef.current.value = row?.capacity ?? 0
    vehicleWeightRef.current.value = row?.gross_weight ?? 0
    vehicleObservationsRef.current.value = row?.observations ?? ''
    $(vehicleModalRef.current).modal('show')
  }

  const saveVehicle = async (e) => {
    e.preventDefault()
    const result = await vehiclesRest.save({
      id: vehicleIdRef.current.value || undefined,
      business_id: vehicleBusinessRef.current.value || null,
      zone_id: vehicleZoneRef.current.value || null,
      plate: vehiclePlateRef.current.value.trim(),
      label: vehicleLabelRef.current.value.trim(),
      brand: vehicleBrandRef.current.value.trim(),
      model: vehicleModelRef.current.value.trim(),
      color: vehicleColorRef.current.value.trim(),
      vehicle_type: vehicleTypeRef.current.value.trim(),
      capacity: vehicleCapacityRef.current.value,
      gross_weight: vehicleWeightRef.current.value,
      observations: vehicleObservationsRef.current.value.trim(),
    })
    if (!result) return
    $(vehicleGridRef.current).dxDataGrid('instance').refresh()
    $(vehicleModalRef.current).modal('hide')
  }

  const deleteVehicle = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar vehiculo', text: 'El registro quedara inactivo.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const ok = await vehiclesRest.delete(id)
    if (!ok) return
    $(vehicleGridRef.current).dxDataGrid('instance').refresh()
  }

  const showZonesTable = viewFilter !== 'vehicles'
  const showVehiclesTable = viewFilter !== 'zones'

  return <>
    <div className='card mb-3'>
      <div className='card-body d-flex flex-wrap align-items-center justify-content-between gap-3'>
        <div>
          <h4 className='mb-1'>Vehiculos / Zonas</h4>
          <small className='text-muted'>Cambia la vista para trabajar solo con zonas o solo con vehiculos.</small>
        </div>
        <div className='d-flex flex-wrap align-items-center gap-2'>
          {VIEW_FILTERS.map((item) => (
            <button
              key={item.key}
              type='button'
              className={`btn btn-sm ${viewFilter === item.key ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {showZonesTable && (
      <Table
        gridRef={zoneGridRef}
        title='Zonas'
        rest={zonesRest}
        pageSize={15}
        toolBar={(items) => {
          items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: async () => { $(zoneGridRef.current).dxDataGrid('instance').refresh(); await refreshZones() } } })
          items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => openZoneModal() } })
        }}
        columns={[
          { dataField: 'code', caption: 'Codigo', width: 110 },
          { dataField: 'name', caption: 'Zona', minWidth: 180 },
          { dataField: 'district', caption: 'Distrito', width: 140 },
          { dataField: 'province', caption: 'Provincia', width: 140 },
          { dataField: 'department', caption: 'Departamento', width: 160 },
          { dataField: 'ubigeo', caption: 'Ubigeo', width: 100 },
          { caption: 'Acciones', width: 130, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openZoneModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => deleteZone(data.id) }))
          } }
        ]}
      />
    )}

    {showVehiclesTable && (
      <Table
        gridRef={vehicleGridRef}
        title='Vehiculos'
        rest={vehiclesRest}
        pageSize={15}
        toolBar={(items) => {
          items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(vehicleGridRef.current).dxDataGrid('instance').refresh() } })
          items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => openVehicleModal() } })
        }}
        columns={[
          { dataField: 'code', caption: 'Codigo', width: 110 },
          { dataField: 'plate', caption: 'Placa', width: 100 },
          { dataField: 'label', caption: 'Unidad', minWidth: 160 },
          { dataField: 'vehicle_type', caption: 'Tipo', width: 120 },
          { caption: 'Zona', minWidth: 140, calculateCellValue: (row) => row.zone?.name ?? '-' },
          { dataField: 'capacity', caption: 'Cap.', width: 90, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { caption: 'Acciones', width: 130, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openVehicleModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => deleteVehicle(data.id) }))
          } }
        ]}
      />
    )}

    <Modal modalRef={zoneModalRef} title='Zona' size='lg' onSubmit={saveZone}>
      <div className='row'>
        <input ref={zoneIdRef} hidden />
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Empresa</label>
          <select ref={zoneBusinessRef} className='form-control'>
            <option value=''>Global</option>
            {businesses.map(row => <option key={`zone-business-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-md-8 mb-3'><label className='form-label'>Nombre</label><input ref={zoneNameRef} className='form-control' required /></div>
        <UbigeoCascade
          value={zoneLocation}
          onChange={setZoneLocation}
          showUbigeo={false}
          departmentCol='col-md-4'
          provinceCol='col-md-4'
          districtCol='col-md-4'
          required
        />
        <div className='col-12 mb-3'><label className='form-label'>Referencia</label><textarea ref={zoneReferenceRef} className='form-control' rows='2' /></div>
        <div className='col-12'><label className='form-label'>Observaciones</label><textarea ref={zoneObservationsRef} className='form-control' rows='2' /></div>
      </div>
    </Modal>

    <Modal modalRef={vehicleModalRef} title='Vehiculo' size='lg' onSubmit={saveVehicle}>
      <div className='row'>
        <input ref={vehicleIdRef} hidden />
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Empresa</label>
          <select ref={vehicleBusinessRef} className='form-control'>
            <option value=''>Global</option>
            {businesses.map(row => <option key={`vehicle-business-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Zona</label>
          <select ref={vehicleZoneRef} className='form-control'>
            <option value=''>Sin zona</option>
            {zones.map(row => <option key={`vehicle-zone-${row.id}`} value={row.id}>{row.code} - {row.name}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-3'><label className='form-label'>Placa</label><input ref={vehiclePlateRef} className='form-control' required /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>Unidad</label><input ref={vehicleLabelRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Marca</label><input ref={vehicleBrandRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Modelo</label><input ref={vehicleModelRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Color</label><input ref={vehicleColorRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Tipo</label><input ref={vehicleTypeRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Capacidad</label><input ref={vehicleCapacityRef} type='number' step='0.01' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Peso bruto</label><input ref={vehicleWeightRef} type='number' step='0.01' className='form-control' /></div>
        <div className='col-12'><label className='form-label'>Observaciones</label><textarea ref={vehicleObservationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.can('vehicle-zone') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Vehiculos / Zonas'><VehicleZones {...properties} /></BaseAdminto>)
})
