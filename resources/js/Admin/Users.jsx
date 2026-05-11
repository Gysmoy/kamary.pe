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
import UsersRest from '../Actions/Admin/UsersRest';
import PasswordFormGroup from '../Components/Adminto/form/PasswordFormGroup';
import SelectFormGroup from '../Components/Adminto/Form/SelectFormGroup';

const usersRest = new UsersRest()

const scopes = {
  'kamary-peru': 'Kamary Perú',
  'kamary-medicals': 'Kamary Medicals'
}

const Users = ({ prefixes, roles }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const passwordModalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const lastnameRef = useRef()
  const emailRef = useRef()
  const usernameRef = useRef()
  const passwordRef = useRef()
  const phonePrefixRef = useRef()
  const phoneRef = useRef()
  const rolesRef = useRef()

  // Password form elements ref
  const passwordIdRef = useRef()
  const newPasswordRef = useRef()

  const [scope, setScope] = useState([]);
  const [isEditing, setIsEditing] = useState(false)
  const [phonePrefix, setPhonePrefix] = useState('51')
  const [selectedRoles, setSelectedRoles] = useState([])

  const onModalOpen = (data) => {
    if (data?.uuid) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.uuid ?? ''
    nameRef.current.value = data?.name ?? ''
    lastnameRef.current.value = data?.lastname ?? ''
    emailRef.current.value = data?.email ?? ''
    usernameRef.current.value = data?.username ?? ''
    passwordRef.current.value = ''
    phoneRef.current.value = data?.phone ?? ''
    setPhonePrefix(data?.phone_prefix ?? '51')
    setScope(Array.isArray(data?.scope) ? data.scope : [])

    const roleNames = data?.roles?.map(({ name }) => name) ?? []
    setSelectedRoles(roleNames)

    $(modalRef.current).modal('show')
  }

  const onPasswordModalOpen = (data) => {
    setIsEditing(true)

    passwordIdRef.current.value = data.uuid
    newPasswordRef.current.value = ''

    $(passwordModalRef.current).modal('show');
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      lastname: lastnameRef.current.value,
      username: isEditing ? undefined : usernameRef.current.value,
      password: isEditing ? undefined : passwordRef.current.value,
      email: emailRef.current.value,
      phone_prefix: phonePrefix,
      phone: phoneRef.current.value,
      scope,
      roles: selectedRoles
    }

    const result = await usersRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await usersRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar usuario',
      text: '¿Estas seguro de eliminar a este usuario? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, banear',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await usersRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onPasswordModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: passwordIdRef.current.value,
      password: newPasswordRef.current.value,
    }

    const result = await usersRest.save(request)
    if (!result) return

    $(passwordModalRef.current).modal('hide')
  }

  const handleRoleSelect = (roleName) => {
    if (!selectedRoles.includes(roleName)) {
      setSelectedRoles([...selectedRoles, roleName])
    }
  }

  const handleRoleRemove = (roleName) => {
    setSelectedRoles(selectedRoles.filter(r => r !== roleName))
  }

  return (<>
    <Table gridRef={gridRef} title='Usuarios' rest={usersRest}
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
            hint: 'Agregar usuario',
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
          dataField: 'fullname',
          caption: 'Nombre completo',
          cellTemplate: (container, { data }) => {
            const label = data.fullname || [data.name, data.lastname].filter(Boolean).join(' ') || data.username || ''
            if (!label) return

            container.empty()
            $('<button type="button" class="btn btn-link admin-grid-edit-link p-0 text-start fw-semibold"></button>')
              .text(label)
              .attr('title', 'Editar usuario')
              .on('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                onModalOpen(data)
              })
              .appendTo(container)
          }
        },
        {
          dataField: 'username',
          caption: 'Usuario',
          cellTemplate: (container, { data }) => {
            const verifiedIcon = data.verified
              ? '<i class="mdi mdi-check-decagram text-primary ms-1" title="Verificado"></i>'
              : '';
            container.html(`<span>${data.username || ''}</span>${verifiedIcon}`);
          }
        },
        {
          dataField: 'email',
          caption: 'Correo electronico',
        },
        {
          dataField: 'phone',
          caption: 'Celular',
          cellTemplate: (container, { data }) => {
            if (!data.phone) return
            container.text(`+${data.phone_prefix} ${data.phone}`)
          }
        },
        {
          dataField: 'scope',
          caption: 'Con acceso a',
          cellTemplate: (container, { data }) => {
            if (!data.scope || !data.scope.length) return;
            const labels = {
              'kamary-peru': 'Kamary Perú',
              'kamary-medicals': 'Kamary Medicals'
            };
            const badges = data.scope.map(s => `<span class="badge badge-soft-secondary me-1">${labels[s] || s}</span>`).join('');
            container.html(`<div class="d-flex gap-1">${badges}</div>`);
          }
        },
        {
          dataField: 'roles',
          caption: 'Roles',
          allowSorting: false,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            if (data.roles && data.roles.length) {
              const badgesHtml = data.roles.map(r => `<span class="badge badge-soft-primary mr-1">${r.name}</span>`).join('')
              container.html(`<div class='d-flex gap-1'>${badgesHtml}</div>`)
            } else {
              container.html(renderToString(<i className='text-muted'>Sin roles</i>))
            }
          }
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: '100px',
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) {
              container.html(renderToString(<i className='text-muted'>Baneado</i>))
            } else {
              ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({
                id: data.uuid,
                field: 'status',
                value: !data.status
              })} />)
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
              className: 'btn btn-xs btn-soft-info',
              title: 'Cambiar contraseña',
              icon: 'mdi mdi-key',
              onClick: () => onPasswordModalOpen(data)
            }))

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar usuario',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.uuid)
            }))

          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar usuario' : 'Agregar usuario'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <div className='row'>
        <InputFormGroup eRef={nameRef} label='Nombre' col='col-md-6' required />
        <InputFormGroup eRef={lastnameRef} label='Apellido' col='col-md-6' required />
        <div className="col-12">
          <div hidden={isEditing} className='row'>
            <InputFormGroup eRef={usernameRef} label='Usuario' col='col-md-6' required={!isEditing} />
            <InputFormGroup eRef={passwordRef} label='Contraseña' col='col-md-6' required={!isEditing} />
          </div>
        </div>
        <InputFormGroup eRef={emailRef} label='Correo' required />
        <SelectFormGroup eRef={phonePrefixRef} label='Prefijo' col='col-md-4' value={phonePrefix} onChange={e => setPhonePrefix(e.target.value)}>
          {
            prefixes.map((prefix, idx) => {
              return <option value={prefix.realCode}>{prefix.beautyCode} • {prefix.country}</option>
            })
          }
        </SelectFormGroup>
        <InputFormGroup eRef={phoneRef} label='Celular' col='col-md-8' />
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Con acceso a</label>
          <div className='d-flex gap-2'>
            {Object.keys(scopes).map((scp, idx) => (
              <div key={idx} className='form-check'>
                <input
                  className='form-check-input'
                  type='checkbox'
                  id={`scope-${scp}`}
                  value={scp}
                  checked={scope.includes(scp)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setScope([...scope, scp]);
                    } else {
                      setScope(scope.filter((s) => s !== scp));
                    }
                  }}
                />
                <label className='form-check-label text-nowrap' htmlFor={`scope-${scp}`}>
                  {scopes[scp]}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className='col-12'>
          <label className='form-label'>Roles</label>
          <div className="dropdown">
            <button
              className="btn btn-secondary dropdown-toggle"
              type="button"
              id="rolesDropdown"
              data-bs-toggle="dropdown"        // changed from data-toggle
              aria-haspopup="true"
              aria-expanded="false"
            >
              Seleccionar roles
            </button>
            <div className="dropdown-menu" aria-labelledby="rolesDropdown">
              {roles.map((role, idx) => (
                <button
                  key={idx}
                  className="dropdown-item"
                  type="button"
                  onClick={() => handleRoleSelect(role.name)}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>
          {
            selectedRoles.length > 0 &&
            <div className="mt-2 d-flex flex-wrap gap-1">
              {selectedRoles.map((role, idx) => (
                <span key={idx} className="bg-primary text-white fs-14 px-2 py-1  rounded-pill">
                  {role} <i className="mdi mdi-close fs-14 ms-1" onClick={() => handleRoleRemove(role)} style={{ cursor: 'pointer' }}></i>
                </span>
              ))}
            </div>
          }
        </div>
      </div>
    </Modal>

    <Modal modalRef={passwordModalRef} title='Cambio de contraseña' onSubmit={onPasswordModalSubmit} size='sm'>
      <input ref={passwordIdRef} type='hidden' />
      <PasswordFormGroup eRef={newPasswordRef} label='Contraseña nueva' />
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {
  if (!properties.can('users') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Usuarios'>
    <Users {...properties} />
  </BaseAdminto>);
})

