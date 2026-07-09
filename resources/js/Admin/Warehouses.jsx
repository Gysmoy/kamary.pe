import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '@Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import WarehousesRest from '../Actions/Admin/WarehousesRest';
import { isMagistralesPath } from '../Utils/permissionScope';

const warehousesRest = new WarehousesRest()

const formatAuditUser = (user) => {
  if (!user) return ''
  const firstName = (user.name ?? '').toString().trim().split(' ')[0] ?? ''
  const firstLastname = (user.lastname ?? '').toString().trim().split(' ')[0] ?? ''
  const full = `${firstName} ${firstLastname}`.trim()
  const username = (user.username ?? '').toString().trim()
  if (full && username) return `${full} (@${username})`
  if (full) return full
  if (username) return `@${username}`
  return ''
}

const Warehouses = ({ fixedWarehouse = null, sampleWarehouse = null, fixedBusiness = null, defaultBranch = null }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const locationModalRef = useRef()

  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const locationIdRef = useRef()
  const locationCodeRef = useRef()
  const locationDescriptionRef = useRef()
  const locationStatusRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [locations, setLocations] = useState([])
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const sampleWarehouseId = sampleWarehouse?.id ? `${sampleWarehouse.id}` : ''
  const fixedBusinessId = fixedBusiness?.id ? `${fixedBusiness.id}` : ''
  const fixedBranchId = defaultBranch?.id ? `${defaultBranch.id}` : ''

  const refresh = () => tableRef.current?.refresh()

  const isLockedWarehouse = (warehouse) => {
    const id = `${warehouse?.id ?? ''}`
    return id !== '' && (id === fixedWarehouseId || id === sampleWarehouseId)
  }
  // Etiqueta del almacen fijo segun a que modulo pertenece
  const lockedLabel = (warehouse) => `${warehouse?.id ?? ''}` === sampleWarehouseId ? 'Muestras fijo' : 'Magistrales fijo'

  const locationsCount = (warehouse) => (warehouse?.locations ?? []).filter(item => item.status !== null).length

  useEffect(() => {
    const load = async () => {
      if (fixedBusiness?.id) {
        setBusinesses([fixedBusiness])
        setSelectedBusinessId(`${fixedBusiness.id}`)
        if (defaultBranch?.id) {
          setBranches([defaultBranch])
          setSelectedBranchId(`${defaultBranch.id}`)
        }
        return
      }
      const data = await warehousesRest.getBusinesses()
      setBusinesses((data ?? []).filter(item => item.status !== null))
    }
    load()
  }, [fixedBusiness?.id, defaultBranch?.id])

  const loadBranches = async (businessId, preferredBranchId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
      return
    }
    if (fixedBusinessId && `${businessId}` === fixedBusinessId && defaultBranch?.id) {
      setBranches([defaultBranch])
      setSelectedBranchId(`${preferredBranchId || defaultBranch.id}`)
      return
    }
    const data = await warehousesRest.getBranches(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)

    if (preferredBranchId && active.some(item => `${item.id}` === `${preferredBranchId}`)) {
      setSelectedBranchId(`${preferredBranchId}`)
      return
    }
    setSelectedBranchId('')
  }

  const onModalOpen = async (data) => {
    if (data?.id && isLockedWarehouse(data)) {
      await Swal.fire({
        icon: 'info',
        title: 'Almacén fijo de Magistrales',
        text: 'Este almacén está protegido y no se puede editar desde esta pantalla.',
        confirmButtonText: 'Entendido'
      })
      return
    }

    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    descriptionRef.current.value = data?.description ?? ''
    const businessId = data?.branch?.business_id ? `${data.branch.business_id}` : fixedBusinessId
    setSelectedBusinessId(businessId)
    await loadBranches(businessId, data?.business_branch_id ?? fixedBranchId)

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    if (!fixedBusinessId) {
      if (!selectedBusinessId) {
        Swal.fire({ icon: 'warning', title: 'Falta empresa', text: 'Selecciona una empresa.', confirmButtonText: 'Entendido' })
        return
      }
      if (!selectedBranchId) {
        Swal.fire({ icon: 'warning', title: 'Falta sede', text: 'Selecciona una sede.', confirmButtonText: 'Entendido' })
        return
      }
    }

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value.trim(),
      description: descriptionRef.current.value.trim(),
      business_branch_id: selectedBranchId || fixedBranchId || null,
    }

    const result = await warehousesRest.save(request)
    if (!result) return

    refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await warehousesRest.boolean({ id, field, value })
    if (!result) return
    refresh()
  }

  const onDeleteClicked = async (id) => {
    if (`${id}` === fixedWarehouseId || `${id}` === sampleWarehouseId) {
      await Swal.fire({
        icon: 'info',
        title: 'Almacén fijo protegido',
        text: 'Este almacén está protegido y no se puede eliminar.',
        confirmButtonText: 'Entendido'
      })
      return
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar almacen',
      text: 'Estas seguro de eliminar este almacen? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await warehousesRest.delete(id)
    if (!result) return
    refresh()
  }

  const openLocationsModal = async (warehouse) => {
    setSelectedWarehouse(warehouse)
    setLocations(await warehousesRest.getLocations(warehouse.id))
    clearLocationForm()
    $(locationModalRef.current).modal('show')
  }

  const clearLocationForm = () => {
    if (locationIdRef.current) locationIdRef.current.value = ''
    if (locationCodeRef.current) locationCodeRef.current.value = ''
    if (locationDescriptionRef.current) locationDescriptionRef.current.value = ''
    if (locationStatusRef.current) locationStatusRef.current.checked = true
  }

  const editLocation = (location) => {
    locationIdRef.current.value = location?.id ?? ''
    locationCodeRef.current.value = location?.code ?? ''
    locationDescriptionRef.current.value = location?.description ?? ''
    locationStatusRef.current.checked = location?.status !== false && location?.status !== 0
  }

  const saveLocation = async (e) => {
    e?.preventDefault?.()
    if (!selectedWarehouse?.id) return
    const result = await warehousesRest.saveLocation(selectedWarehouse.id, {
      id: locationIdRef.current.value || undefined,
      code: locationCodeRef.current.value.trim(),
      description: locationDescriptionRef.current.value.trim(),
      status: locationStatusRef.current.checked,
    })
    if (!result) return
    setLocations(await warehousesRest.getLocations(selectedWarehouse.id))
    clearLocationForm()
    refresh()
  }

  const deleteLocation = async (locationId) => {
    if (!selectedWarehouse?.id) return
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar ubicacion',
      text: 'Esta ubicacion se dara de baja.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await warehousesRest.deleteLocation(selectedWarehouse.id, locationId)
    if (!result) return
    setLocations(await warehousesRest.getLocations(selectedWarehouse.id))
    refresh()
  }

  const onBusinessChange = async (businessId) => {
    const id = businessId || ''
    setSelectedBusinessId(id)
    await loadBranches(id)
  }

  const rowActions = (warehouse) => {
    if (isLockedWarehouse(warehouse)) return []
    return [
      { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
      { icon: 'mdi mdi-map-marker', title: 'Ubicaciones', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openLocationsModal(r) },
      { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
    ]
  }

  return (<>
    <VdTable
      ref={tableRef}
      rest={warehousesRest}
      icon="mdi mdi-warehouse"
      title="Almacenes"
      unit="almacenes"
      defaultSort={{ field: 'name', desc: false }}
      defaultPageSize={25}
      searchFields={['name', 'description', 'branch.name', 'branch.business.name']}
      searchPlaceholder="Buscar almacén…"
      searchMobileOnly
      emptyText="No se encontraron almacenes."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen(null)}>
          <i className="mdi mdi-plus"></i> Nuevo almacén
        </button>
      </>}
      actions={rowActions}
      columns={[
        {
          key: 'empresa', label: 'Empresa', field: 'branch.business.name', visible: false, sortable: false,
          filter: { type: 'text', field: 'branch.business.name' },
        },
        {
          key: 'sede', label: 'Sede', field: 'branch.name', visible: false, sortable: false,
          filter: { type: 'text', field: 'branch.name' },
        },
        {
          key: 'nombre', label: 'Nombre', field: 'name', filter: { type: 'text' },
          render: (row) => {
            if (isLockedWarehouse(row)) {
              return (<div>
                <span className="fw-semibold" style={{ color: '#188ae2' }}>{row.name}</span>
                <div><small className="badge badge-soft-primary mt-1">{lockedLabel(row)}</small></div>
              </div>)
            }
            return (
              <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar almacen">
                {row.name}
              </a>
            )
          },
        },
        { key: 'descripcion', label: 'Descripción', field: 'description', filter: { type: 'text' }, muted: true },
        {
          key: 'ubicaciones', label: 'Ubicaciones', field: 'locations', sortable: false, align: 'right', width: '120px', nowrap: true,
          render: (row) => <span className="fw-semibold">{locationsCount(row)}</span>,
        },
        {
          key: 'creador', label: 'Creado por', field: 'creator.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.creator),
        },
        {
          key: 'actualizador', label: 'Actualizado por', field: 'updater.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.updater),
        },
        {
          key: 'estado', label: 'Estado', field: 'status', width: '110px',
          filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => {
            if (row.status === null) return ''
            if (isLockedWarehouse(row)) return <span className="badge badge-soft-primary">Protegido</span>
            return <SwitchFormGroup noMargin checked={row.status == 1} onChange={() => onBooleanChange({ id: row.id, field: 'status', value: !row.status })} />
          },
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.name}</p>
              <small className="text-muted">{[row.branch?.business?.name, row.branch?.name].filter(Boolean).join(' · ')}</small>
            </div>
            {row.status !== null && (isLockedWarehouse(row)
              ? <span className="badge badge-soft-primary">Protegido</span>
              : <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>)}
          </div>
          {row.description && <p className="text-muted mb-0 mt-2" style={{ fontSize: 12 }}>{row.description}</p>}
          <small className="text-muted d-block mt-2"><i className="mdi mdi-map-marker me-1"></i>{locationsCount(row)} ubicaciones</small>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar almacen' : 'Agregar almacen'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <div className='row' id='warehouse-form-container'>
        {!fixedBusinessId && <VdSelect
          label='Empresa'
          col='col-12'
          required
          value={selectedBusinessId}
          onChange={onBusinessChange}
          options={businesses.map(item => ({ value: `${item.id}`, label: item.name }))}
          placeholder='-- Seleccionar empresa --'
        />}
        {!fixedBusinessId && <VdSelect
          label='Sede'
          col='col-12'
          required
          disabled={!selectedBusinessId}
          value={selectedBranchId}
          onChange={(value) => setSelectedBranchId(value)}
          options={branches.map(item => ({ value: `${item.id}`, label: item.name }))}
          placeholder='-- Seleccionar sede --'
        />}
        <InputFormGroup eRef={nameRef} label='Nombre' col='col-12' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' rows={3} />
      </div>
    </Modal>

    <Modal modalRef={locationModalRef} title='Formulario ubicacion' size='lg' hideFooter>
      <div className='row align-items-end mb-3'>
        <input ref={locationIdRef} type='hidden' />
        <div className='form-group col-12 mb-2'>
          <label className='form-label'>Almacen</label>
          <input className='form-control' value={selectedWarehouse?.name ?? ''} disabled />
        </div>
        <InputFormGroup eRef={locationCodeRef} label='Codificacion' col='col-md-4' required />
        <InputFormGroup eRef={locationDescriptionRef} label='Descripcion' col='col-md-4' />
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label d-block'>Estado</label>
          <div className='form-check form-switch'>
            <input ref={locationStatusRef} className='form-check-input' type='checkbox' defaultChecked />
          </div>
        </div>
        <div className='col-md-2 mb-2 d-grid'>
          <button type='button' className='btn btn-primary' onClick={saveLocation}>
            Guardar
          </button>
        </div>
      </div>
      <div className='table-responsive border rounded'>
        <table className='table table-sm table-striped mb-0'>
          <thead>
            <tr>
              <th style={{ width: 90 }}>ID</th>
              <th>Codificacion</th>
              <th>Descripcion</th>
              <th style={{ width: 110 }}>Estado</th>
              <th style={{ width: 110 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 && <tr><td colSpan='5' className='text-center text-muted py-3'>Sin ubicaciones</td></tr>}
            {locations.map(location => (
              <tr key={`warehouse-location-${location.id}`}>
                <td>{location.id}</td>
                <td>{location.code}</td>
                <td>{location.description || '-'}</td>
                <td>{location.status === null ? 'Eliminado' : (location.status ? 'Activo' : 'Inactivo')}</td>
                <td>
                  <button type='button' className='btn btn-xs btn-soft-primary me-1' onClick={() => editLocation(location)}>
                    <i className='mdi mdi-pencil'></i>
                  </button>
                  <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => deleteLocation(location.id)}>
                    <i className='mdi mdi-delete'></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  const hasAccess = properties.hasRole('Admin')
    || (isMagistralesPath() ? properties.can('magistrales-warehouse') : (properties.can('exit-note') || properties.can('businesses')))
  if (!hasAccess) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Almacenes'>
    <Warehouses {...properties} />
  </BaseAdminto>);
})
