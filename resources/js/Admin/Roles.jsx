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
import { renderToString } from 'react-dom/server';
import RolesRest from '../Actions/Admin/roles-rest';

const rolesRest = new RolesRest()

const Roles = ({ permissions }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState([])

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    const permissionNames = data?.permissions?.map(({ name }) => name) ?? []
    setSelectedPermissions(permissionNames)

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      permissions: selectedPermissions
    }

    const result = await rolesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await rolesRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar rol',
      text: '¿Estás seguro de eliminar este rol? Esta acción no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await rolesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const handlePermissionToggle = (permissionName) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    )
  }

  const handleSelectAllPermissions = () => {
    setSelectedPermissions(permissions.map(({ name }) => name))
  }

  return (<>
    <Table gridRef={gridRef} title='Roles' rest={rolesRest}
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
            hint: 'Agregar rol',
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
          caption: 'Nombre del rol',
        },
        {
          dataField: 'permissions',
          caption: 'Permisos',
          allowSorting: false,
          allowFiltering: false,
          width: '360px',
          cellTemplate: (container, { data }) => {
            if (data.permissions && data.permissions.length) {
              const badgesHtml = data.permissions.map(p => `<span class="badge badge-soft-primary mr-1">${p.beauty_name}</span>`).join('')
              container.html(`<div class='d-flex flex-wrap gap-1' style='max-height: 3em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;'>${badgesHtml}</div>`)
            } else {
              container.html(renderToString(<i className='text-muted'>Sin permisos</i>))
            }
          }
        },
        {
          caption: 'Acciones',
          width: '160px',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar rol',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))

          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar rol' : 'Agregar rol'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <div className='row'>
        <InputFormGroup eRef={nameRef} label='Nombre del rol' required disabled={isEditing} />
        <div className='col-12'>
          <div className='d-flex align-items-center justify-content-between mb-2'>
            <label className='form-label mb-0'>Permisos</label>
            <div className='d-flex align-items-center gap-2'>
              <span className='badge badge-soft-primary'>
                {selectedPermissions.length} seleccionados
              </span>
              <button
                type='button'
                className='btn btn-xs btn-soft-primary'
                onClick={handleSelectAllPermissions}
                disabled={permissions.length === 0 || selectedPermissions.length === permissions.length}
              >
                Seleccionar todo
              </button>
            </div>
          </div>
          <div className='border rounded p-2 bg-light' style={{ maxHeight: '260px', overflowY: 'auto' }}>
            <div className='row'>
              {permissions.map((permission) => {
                const checked = selectedPermissions.includes(permission.name)
                return (
                  <div key={permission.name} className='col-12 col-md-6 mb-2'>
                    <div className={`custom-control custom-checkbox border rounded px-2 py-2 ${checked ? 'bg-primary text-white border-primary' : 'bg-white border-light'}`}>
                      <input
                        className='custom-control-input'
                        type='checkbox'
                        id={`permission-${permission.name}`}
                        checked={checked}
                        onChange={() => handlePermissionToggle(permission.name)}
                      />
                      <label className='custom-control-label w-100' htmlFor={`permission-${permission.name}`} style={{ cursor: 'pointer' }}>
                        {permission.beauty_name}
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {
  console.log(properties.hasRole('Admin'))
  if (!properties.can('roles') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Roles'>
    <Roles {...properties} />
  </BaseAdminto>);
})
