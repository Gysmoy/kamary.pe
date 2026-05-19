import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import WarehousesRest from '../Actions/Admin/WarehousesRest';
import { isMagistralesPath } from '../Utils/permissionScope';
import renderGridEditLink from '../Utils/renderGridEditLink';

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

const Warehouses = ({ fixedWarehouse = null }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const businessRef = useRef()
  const branchRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''

  const isLockedWarehouse = (warehouse) => `${warehouse?.id ?? ''}` === fixedWarehouseId

  useEffect(() => {
    const load = async () => {
      const data = await warehousesRest.getBusinesses()
      setBusinesses((data ?? []).filter(item => item.status !== null))
    }
    load()
  }, [])

  const loadBranches = async (businessId, preferredBranchId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
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
    const businessId = data?.branch?.business_id ? `${data.branch.business_id}` : ''
    setSelectedBusinessId(businessId)
    await loadBranches(businessId, data?.business_branch_id ?? null)

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value.trim(),
      description: descriptionRef.current.value.trim(),
      business_branch_id: selectedBranchId || null,
    }

    const result = await warehousesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await warehousesRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    if (`${id}` === fixedWarehouseId) {
      await Swal.fire({
        icon: 'info',
        title: 'Almacén fijo de Magistrales',
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
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onBusinessChange = async (e) => {
    const businessId = e.target.value || ''
    setSelectedBusinessId(businessId)
    await loadBranches(businessId)
  }

  return (<>
    <Table
      gridRef={gridRef}
      title='Almacenes'
      rest={warehousesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'add',
            title: 'Agregar',
            hint: 'Agregar almacen',
            onClick: () => onModalOpen(null)
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', visible: false },
        {
          dataField: 'branch.business.name',
          caption: 'Empresa',
          minWidth: 180
        },
        {
          dataField: 'branch.name',
          caption: 'Sede',
          minWidth: 160
        },
        {
          dataField: 'name',
          caption: 'Nombre',
          minWidth: 220,
          cellTemplate: (container, { data }) => {
            const locked = isLockedWarehouse(data)
            $(container).empty()
            if (!locked) {
              renderGridEditLink(container, data?.name, () => onModalOpen(data), 'Editar almacen')
              return
            }

            ReactAppend(container, <div>
              <span className='fw-semibold text-primary'>{data?.name}</span>
              <div><small className='badge badge-soft-primary mt-1'>Magistrales fijo</small></div>
            </div>)
          }
        },
        { dataField: 'description', caption: 'Descripcion', minWidth: 260 },
        {
          dataField: 'creator.fullname',
          caption: 'Creado por',
          visible: false,
          cellTemplate: (container, { data }) => {
            container.text(formatAuditUser(data.creator))
          }
        },
        {
          dataField: 'updater.fullname',
          caption: 'Actualizado por',
          visible: false,
          cellTemplate: (container, { data }) => {
            container.text(formatAuditUser(data.updater))
          }
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: '100px',
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            if (isLockedWarehouse(data)) {
              ReactAppend(container, <span className='badge badge-soft-primary'>Protegido</span>)
              return
            }
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({
              id: data.id,
              field: 'status',
              value: !data.status
            })} />)
          }
        },
        {
          caption: 'Acciones',
          width: '140px',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            if (isLockedWarehouse(data)) {
              container.append('<span class="text-muted small">Sin acciones</span>')
              return
            }

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar almacen',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar almacen' : 'Agregar almacen'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <div className='row' id='warehouse-form-container'>
        <SelectFormGroup
          eRef={businessRef}
          label='Empresa'
          col='col-12'
          required
          dropdownParent='#warehouse-form-container'
          value={selectedBusinessId}
          onChange={onBusinessChange}
          effectWith={[selectedBusinessId, businesses.length]}
        >
          <option value=''>-- Seleccionar empresa --</option>
          {businesses.map(item => (
            <option key={`warehouse-business-${item.id}`} value={item.id}>{item.name}</option>
          ))}
        </SelectFormGroup>
        <SelectFormGroup
          eRef={branchRef}
          label='Sede'
          col='col-12'
          required
          dropdownParent='#warehouse-form-container'
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          effectWith={[selectedBranchId, branches.length]}
        >
          <option value=''>-- Seleccionar sede --</option>
          {branches.map(item => (
            <option key={`warehouse-branch-${item.id}`} value={item.id}>{item.name}</option>
          ))}
        </SelectFormGroup>
        <InputFormGroup eRef={nameRef} label='Nombre' col='col-12' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' rows={3} />
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
