import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const normalizeText = (value) => `${value ?? ''}`.toLowerCase()

const getFieldValue = (row, field) => {
  if (!field) return ''
  return field.split('.').reduce((current, key) => current?.[key], row)
}

const compareValue = (left, operator, right) => {
  const leftText = normalizeText(left)
  const rightText = normalizeText(right)

  switch (operator) {
    case '=': return `${left ?? ''}` == `${right ?? ''}`
    case '<>': return `${left ?? ''}` != `${right ?? ''}`
    case 'contains': return leftText.includes(rightText)
    case 'notcontains': return !leftText.includes(rightText)
    case 'startswith': return leftText.startsWith(rightText)
    case 'endswith': return leftText.endsWith(rightText)
    case '>': return Number(left) > Number(right)
    case '>=': return Number(left) >= Number(right)
    case '<': return Number(left) < Number(right)
    case '<=': return Number(left) <= Number(right)
    default: return true
  }
}

const evaluateFilter = (row, filter) => {
  if (!filter) return true
  if (!Array.isArray(filter)) return true

  if (filter[0] === '!') return !evaluateFilter(row, filter[1])

  if (typeof filter[0] === 'string' && typeof filter[1] === 'string' && filter.length >= 3) {
    return compareValue(getFieldValue(row, filter[0]), filter[1], filter[2])
  }

  let result = evaluateFilter(row, filter[0])
  for (let i = 1; i < filter.length; i += 2) {
    const operator = `${filter[i]}`.toLowerCase()
    const next = evaluateFilter(row, filter[i + 1])
    result = operator === 'or' ? result || next : result && next
  }
  return result
}

const applySearch = (rows, params) => {
  const searchValue = normalizeText(params?.searchValue)
  if (!searchValue) return rows

  const searchExpr = Array.isArray(params?.searchExpr)
    ? params.searchExpr
    : ['category_label', 'code', 'name', 'business_name', 'plate', 'vehicle_type', 'zone_name', 'district', 'province', 'department', 'ubigeo']

  return rows.filter(row => searchExpr.some(field => normalizeText(getFieldValue(row, field)).includes(searchValue)))
}

const applySort = (rows, sort = []) => {
  if (!Array.isArray(sort) || sort.length === 0) return rows

  return [...rows].sort((a, b) => {
    for (const item of sort) {
      const selector = typeof item === 'string' ? item : item.selector
      const desc = typeof item === 'object' && item.desc
      const left = getFieldValue(a, selector)
      const right = getFieldValue(b, selector)
      if (left == right) continue
      const comparison = left > right ? 1 : -1
      return desc ? comparison * -1 : comparison
    }
    return 0
  })
}

const VehicleZones = () => {
  const gridRef = useRef()
  const zoneModalRef = useRef()
  const vehicleModalRef = useRef()
  const viewFilterRef = useRef('all')

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

  const refreshGrid = async () => {
    const instance = gridRef.current ? $(gridRef.current).dxDataGrid('instance') : null
    if (instance) await instance.refresh()
  }

  const refreshZones = async () => {
    const data = await zonesRest.paginate({ take: 1000, skip: 0, isLoadingAll: true })
    const rows = data?.data ?? []
    setZones(rows)
    return rows
  }

  const combinedRest = useMemo(() => ({
    paginate: async (params = {}) => {
      const [zoneData, vehicleData] = await Promise.all([
        zonesRest.paginate({ take: 1000, skip: 0, isLoadingAll: true }),
        vehiclesRest.paginate({ take: 1000, skip: 0, isLoadingAll: true }),
      ])

      const zoneRows = (zoneData?.data ?? []).map(row => ({
        ...row,
        row_key: `zone-${row.id}`,
        source_id: row.id,
        category: 'zone',
        category_label: 'Zona',
        name: row.name,
        business_name: row.business?.name ?? 'Global',
        zone_name: row.name,
        plate: '',
        vehicle_type: '',
        capacity: null,
      }))

      const vehicleRows = (vehicleData?.data ?? []).map(row => ({
        ...row,
        row_key: `vehicle-${row.id}`,
        source_id: row.id,
        category: 'vehicle',
        category_label: 'Vehiculo',
        name: row.label ?? row.plate,
        business_name: row.business?.name ?? 'Global',
        zone_name: row.zone?.name ?? '-',
        district: row.zone?.district ?? '',
        province: row.zone?.province ?? '',
        department: row.zone?.department ?? '',
        ubigeo: row.zone?.ubigeo ?? '',
      }))

      let rows = [...zoneRows, ...vehicleRows]
      if (viewFilterRef.current === 'zones') rows = rows.filter(row => row.category === 'zone')
      if (viewFilterRef.current === 'vehicles') rows = rows.filter(row => row.category === 'vehicle')
      rows = rows.filter(row => evaluateFilter(row, params.filter))
      rows = applySearch(rows, params)
      rows = applySort(rows, params.sort)

      const totalCount = rows.length
      const skip = Number(params.skip ?? 0)
      const take = Number(params.take ?? (totalCount || 10))

      return {
        data: rows.slice(skip, skip + take),
        totalCount,
        summary: [],
      }
    }
  }), [])

  useEffect(() => {
    Promise.all([zonesRest.getBusinesses(), refreshZones()]).then(([businessRows]) => {
      setBusinesses(businessRows ?? [])
    })
  }, [])

  useEffect(() => {
    viewFilterRef.current = viewFilter
    refreshGrid()
  }, [viewFilter])

  const openZoneModal = (row = null) => {
    zoneIdRef.current.value = row?.source_id ?? row?.id ?? ''
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
    await refreshZones()
    await refreshGrid()
    $(zoneModalRef.current).modal('hide')
  }

  const deleteZone = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar zona', text: 'El registro quedara inactivo.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const ok = await zonesRest.delete(id)
    if (!ok) return
    await refreshZones()
    await refreshGrid()
  }

  const openVehicleModal = (row = null) => {
    vehicleIdRef.current.value = row?.source_id ?? row?.id ?? ''
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
    await refreshGrid()
    $(vehicleModalRef.current).modal('hide')
  }

  const deleteVehicle = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar vehiculo', text: 'El registro quedara inactivo.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const ok = await vehiclesRest.delete(id)
    if (!ok) return
    await refreshGrid()
  }

  const openRowModal = (row) => {
    if (row.category === 'zone') return openZoneModal(row)
    return openVehicleModal(row)
  }

  const deleteRow = (row) => {
    if (row.category === 'zone') return deleteZone(row.source_id)
    return deleteVehicle(row.source_id)
  }

  return <>
    <div className='card mb-3'>
      <div className='card-body d-flex flex-wrap align-items-center justify-content-between gap-3'>
        <div>
          <h4 className='mb-1'>Vehiculos / Zonas</h4>
          <small className='text-muted'>Una sola tabla para administrar zonas y vehiculos. Usa los filtros rapidos para ver una categoria especifica.</small>
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

    <Table
      gridRef={gridRef}
      title='Vehiculos / Zonas'
      rest={combinedRest}
      pageSize={15}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: async () => { await refreshZones(); await refreshGrid() } } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'car', hint: 'Agregar vehiculo', onClick: () => openVehicleModal() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'map', hint: 'Agregar zona', onClick: () => openZoneModal() } })
      }}
      columns={[
        { dataField: 'category_label', caption: 'Categoria', width: 110 },
        { dataField: 'code', caption: 'Codigo', width: 110 },
        { dataField: 'name', caption: 'Nombre', minWidth: 180 },
        { dataField: 'business_name', caption: 'Empresa', minWidth: 160 },
        { dataField: 'plate', caption: 'Placa', width: 100 },
        { dataField: 'vehicle_type', caption: 'Tipo vehiculo', width: 130 },
        { dataField: 'zone_name', caption: 'Zona asignada', minWidth: 150 },
        { dataField: 'district', caption: 'Distrito', width: 140 },
        { dataField: 'province', caption: 'Provincia', width: 140 },
        { dataField: 'department', caption: 'Departamento', width: 150 },
        { dataField: 'ubigeo', caption: 'Ubigeo', width: 100 },
        { dataField: 'capacity', caption: 'Cap.', width: 90, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        { caption: 'Acciones', width: 130, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css('text-overflow', 'unset')
          container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: `Editar ${data.category_label.toLowerCase()}`, icon: 'mdi mdi-pencil', onClick: () => openRowModal(data) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: `Eliminar ${data.category_label.toLowerCase()}`, icon: 'mdi mdi-delete', onClick: () => deleteRow(data) }))
        } }
      ]}
    />

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
