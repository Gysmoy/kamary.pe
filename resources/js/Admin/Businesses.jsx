import React, { useRef, useState } from 'react';
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
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import BusinessesRest from '../Actions/Admin/BusinessesRest';

const businessesRest = new BusinessesRest()

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

const Businesses = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const branchesModalRef = useRef()
  const branchModalRef = useRef()

  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const branchIdRef = useRef()
  const branchNameRef = useRef()
  const branchModeRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [branches, setBranches] = useState([])
  const [isBranchEditing, setIsBranchEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    descriptionRef.current.value = data?.description ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value.trim(),
      description: descriptionRef.current.value.trim(),
    }

    const result = await businessesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await businessesRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar empresa',
      text: 'Estas seguro de eliminar esta empresa? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await businessesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const loadBranches = async (businessId) => {
    const data = await businessesRest.getBranches(businessId)
    if (!data) return
    setBranches(data)
  }

  const onBranchesOpen = async (business) => {
    setSelectedBusiness(business)
    setBranches([])
    await loadBranches(business.id)
    $(branchesModalRef.current).modal('show')
  }

  const onBranchModalOpen = (branch = null) => {
    const editing = !!branch?.id
    setIsBranchEditing(editing)
    branchModeRef.current.value = editing ? 'update' : 'create'
    branchIdRef.current.value = branch?.id ?? ''
    branchNameRef.current.value = branch?.name ?? ''
    $(branchModalRef.current).modal('show')
  }

  const onBranchSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBusiness?.id) return

    const request = {
      mode: branchModeRef.current.value || (isBranchEditing ? 'update' : 'create'),
      id: (branchModeRef.current.value === 'update' ? (branchIdRef.current.value || undefined) : undefined),
      name: branchNameRef.current.value.trim(),
    }

    const result = await businessesRest.saveBranch(selectedBusiness.id, request)
    if (!result) return

    await loadBranches(selectedBusiness.id)
    $(branchModalRef.current).modal('hide')
  }

  const onDeleteBranchClicked = async (branchId) => {
    if (!selectedBusiness?.id) return

    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar sede',
      text: 'Estas seguro de eliminar esta sede?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await businessesRest.deleteBranch(selectedBusiness.id, branchId)
    if (!result) return
    await loadBranches(selectedBusiness.id)
  }

  const onBranchBooleanChange = async ({ branchId, value }) => {
    if (!selectedBusiness?.id) return

    const result = await businessesRest.booleanBranch({
      businessId: selectedBusiness.id,
      branchId,
      field: 'status',
      value
    })
    if (!result) return
    await loadBranches(selectedBusiness.id)
  }

  return (<>
    <Table
      gridRef={gridRef}
      title='Businesses'
      rest={businessesRest}
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
            hint: 'Agregar empresa',
            onClick: () => onModalOpen(null)
          }
        });
      }}
      pageSize={25}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'name',
          caption: 'Nombre',
          minWidth: 220
        },
        {
          dataField: 'description',
          caption: 'Descripcion',
          minWidth: 260
        },
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
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({
              id: data.id,
              field: 'status',
              value: !data.status
            })} />)
          }
        },
        {
          caption: 'Acciones',
          width: '210px',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-info',
              title: 'Sedes',
              icon: 'mdi mdi-office-building-marker',
              onClick: () => onBranchesOpen(data)
            }))

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar empresa',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar empresa' : 'Agregar empresa'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <div className='row'>
        <InputFormGroup eRef={nameRef} label='Nombre' col='col-12' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' rows={3} />
      </div>
    </Modal>

    <Modal
      modalRef={branchesModalRef}
      title={`Sedes${selectedBusiness ? ` - ${selectedBusiness.name}` : ''}`}
      size='lg'
      hideButtonSubmit
    >
      <div className='d-flex justify-content-end mb-2'>
        <button type='button' className='btn btn-sm btn-primary' onClick={() => onBranchModalOpen()}>
          <i className='mdi mdi-plus me-1'></i> Agregar sede
        </button>
      </div>

      <div className='table-responsive border rounded'>
        <table className='table table-sm table-striped mb-0'>
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Nombre</th>
              <th style={{ width: '20%' }}>Estado</th>
              <th style={{ width: '30%' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 && (
              <tr>
                <td colSpan={3} className='text-center text-muted'>Sin sedes registradas</td>
              </tr>
            )}
            {branches.map(branch => (
              <tr key={`branch-${branch.id}`}>
                <td>{branch.name}</td>
                <td>
                  {branch.status === null ? <span className='text-muted'>-</span> : (
                    <SwitchFormGroup checked={branch.status == 1} onChange={() => onBranchBooleanChange({
                      branchId: branch.id,
                      value: !branch.status
                    })} />
                  )}
                </td>
                <td>
                  <div className='d-flex gap-1'>
                    <button type='button' className='btn btn-xs btn-soft-primary' onClick={() => onBranchModalOpen(branch)}>
                      <i className='mdi mdi-pencil'></i>
                    </button>
                    <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onDeleteBranchClicked(branch.id)}>
                      <i className='mdi mdi-delete'></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>

    <Modal
      modalRef={branchModalRef}
      title={isBranchEditing ? 'Editar sede' : 'Agregar sede'}
      onSubmit={onBranchSubmit}
      size='md'
    >
      <input ref={branchModeRef} type='hidden' defaultValue='create' />
      <input ref={branchIdRef} type='hidden' />
      <InputFormGroup eRef={branchNameRef} label='Nombre de la sede' col='col-12' required />
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('businesses') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Businesses'>
    <Businesses {...properties} />
  </BaseAdminto>);
})
