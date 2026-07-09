import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import UsersRest from '../Actions/Admin/UsersRest';
import PasswordFormGroup from '../Components/Adminto/form/PasswordFormGroup';

const usersRest = new UsersRest()

const scopes = {
  'kamary-peru': 'Kamary Perú',
  'kamary-medicals': 'Kamary Medicals'
}

const Users = ({ prefixes, roles, drivers = [] }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const passwordModalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const lastnameRef = useRef()
  const emailRef = useRef()
  const usernameRef = useRef()
  const passwordRef = useRef()
  const phoneRef = useRef()
  const rolesRef = useRef()

  // Password form elements ref
  const passwordIdRef = useRef()
  const newPasswordRef = useRef()

  const [scope, setScope] = useState([]);
  const [isEditing, setIsEditing] = useState(false)
  const [phonePrefix, setPhonePrefix] = useState('51')
  const [selectedRoles, setSelectedRoles] = useState([])
  const [isDriver, setIsDriver] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState('')

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
    setScope(data?.uuid && Array.isArray(data?.scope) ? data.scope : ['kamary-peru'])
    setIsDriver(Boolean(data?.is_driver))
    setSelectedDriverId(data?.driver_id ? `${data.driver_id}` : '')

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
      is_driver: isDriver,
      driver_id: isDriver ? (selectedDriverId || null) : null,
      roles: selectedRoles
    }

    const result = await usersRest.save(request)
    if (!result) return

    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await usersRest.boolean({ id, field, value })
    if (!result) return
    tableRef.current?.refresh()
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
    tableRef.current?.refresh()
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

  const driverOptionLabel = (driver) => [
    driver.code,
    driver.full_name,
    driver.license_number ? `Lic. ${driver.license_number}` : '',
  ].filter(Boolean).join(' - ')

  return (<>
    <VdTable
      ref={tableRef}
      rest={usersRest}
      icon="mdi mdi-account-multiple"
      title="Usuarios"
      unit="usuarios"
      defaultSort={{ field: 'fullname', desc: false }}
      defaultPageSize={25}
      searchFields={['name', 'lastname', 'fullname', 'username', 'email', 'phone']}
      searchPlaceholder="Buscar por nombre, usuario, correo o celular…"
      emptyText="No se encontraron usuarios."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={() => tableRef.current?.refresh()}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen(null)}>
          <i className="mdi mdi-plus"></i> Nuevo usuario
        </button>
      </>}
      actions={(row) => [
        { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
        { icon: 'mdi mdi-key', title: 'Cambiar contraseña', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => onPasswordModalOpen(r) },
        { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.uuid) },
      ]}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'fullname', label: 'Nombre completo', field: 'fullname',
          filter: { type: 'text', fields: ['name', 'lastname', 'fullname', 'username'] },
          render: (row) => {
            const label = row.fullname || [row.name, row.lastname].filter(Boolean).join(' ') || row.username || ''
            if (!label) return ''
            return (
              <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar usuario">
                {label}
              </a>
            )
          },
        },
        {
          key: 'username', label: 'Usuario', field: 'username', filter: { type: 'text' },
          render: (row) => (
            <span>
              {row.username || ''}
              {row.verified && <i className="mdi mdi-check-decagram text-primary ms-1" title="Verificado"></i>}
            </span>
          ),
        },
        { key: 'email', label: 'Correo electronico', field: 'email', filter: { type: 'text' } },
        {
          key: 'phone', label: 'Celular', field: 'phone', filter: { type: 'text' },
          render: (row) => row.phone ? `+${row.phone_prefix} ${row.phone}` : '',
        },
        {
          key: 'scope', label: 'Con acceso a', field: 'scope', sortable: false,
          render: (row) => {
            if (!row.scope || !row.scope.length) return ''
            return (
              <div className="d-flex gap-1 flex-wrap">
                {row.scope.map((s, i) => <span key={i} className="badge badge-soft-secondary">{scopes[s] || s}</span>)}
              </div>
            )
          },
        },
        {
          key: 'is_driver', label: 'Chofer', field: 'is_driver', width: '95px',
          filter: { type: 'select', options: [{ value: 1, label: 'Si' }, { value: 0, label: 'No' }] },
          render: (row) => row.is_driver
            ? <span className="badge badge-soft-success">Si</span>
            : <span className="badge badge-soft-secondary">No</span>,
        },
        {
          key: 'driver', label: 'Conductor vinculado', field: 'driver.full_name', sortable: false,
          render: (row) => row.driver?.full_name ?? '-',
        },
        {
          key: 'roles', label: 'Roles', field: 'roles', sortable: false,
          render: (row) => row.roles && row.roles.length
            ? <div className="d-flex gap-1 flex-wrap">{row.roles.map((r, i) => <span key={i} className="badge badge-soft-primary">{r.name}</span>)}</div>
            : <i className="text-muted">Sin roles</i>,
        },
        {
          key: 'status', label: 'Estado', field: 'status', width: '100px',
          filter: { type: 'select', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => {
            if (row.status === null) return <i className="text-muted">Baneado</i>
            return <SwitchFormGroup noMargin checked={row.status == 1} onChange={() => onBooleanChange({ id: row.uuid, field: 'status', value: !row.status })} />
          },
        },
      ]}
      renderCard={(row, actionButtons) => {
        const label = row.fullname || [row.name, row.lastname].filter(Boolean).join(' ') || row.username || ''
        return (
          <div className="vdt-card" onClick={() => onModalOpen(row)}>
            <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{label}</p>
                <small className="text-muted">
                  {row.username}
                  {row.verified && <i className="mdi mdi-check-decagram text-primary ms-1" title="Verificado"></i>}
                </small>
              </div>
              {row.status === null
                ? <span className="badge badge-soft-secondary">Baneado</span>
                : <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>}
            </div>
            <small className="text-muted d-block mt-2">{row.email}</small>
            {row.phone && <small className="text-muted d-block">+{row.phone_prefix} {row.phone}</small>}
            {row.scope && row.scope.length > 0 && (
              <div className="d-flex gap-1 flex-wrap mt-2">
                {row.scope.map((s, i) => <span key={i} className="badge badge-soft-secondary">{scopes[s] || s}</span>)}
              </div>
            )}
            {row.roles && row.roles.length > 0 && (
              <div className="d-flex gap-1 flex-wrap mt-2">
                {row.roles.map((r, i) => <span key={i} className="badge badge-soft-primary">{r.name}</span>)}
              </div>
            )}
            {row.is_driver && (
              <small className="text-muted d-block mt-2">
                <i className="mdi mdi-car me-1"></i>Chofer{row.driver?.full_name ? ` · ${row.driver.full_name}` : ''}
              </small>
            )}
            {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
          </div>
        )
      }}
    />
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
        <VdSelect
          label='Prefijo'
          col='col-md-4'
          value={phonePrefix}
          onChange={(value) => setPhonePrefix(value)}
          options={prefixes.map((prefix) => ({ value: prefix.realCode, label: `${prefix.beautyCode} • ${prefix.country}` }))}
          placeholder='-- Seleccionar --'
        />
        <InputFormGroup eRef={phoneRef} label='Celular' col='col-md-8' />
        <div className='col-12 mb-2'>
          <div className='form-check form-switch'>
            <input
              className='form-check-input'
              type='checkbox'
              id='user-is-driver'
              checked={isDriver}
              onChange={(e) => {
                setIsDriver(e.target.checked)
                if (!e.target.checked) setSelectedDriverId('')
              }}
            />
            <label className='form-check-label' htmlFor='user-is-driver'>
              Es chofer
            </label>
          </div>
        </div>
        {isDriver && (
          <>
            <VdSelect
              label='Conductor vinculado'
              col='col-12'
              value={selectedDriverId}
              onChange={(value) => setSelectedDriverId(value)}
              options={[
                { value: '', label: 'Crear o vincular por nombre del usuario' },
                ...drivers.map((driver) => ({ value: `${driver.id}`, label: driverOptionLabel(driver) })),
              ]}
              placeholder='-- Seleccionar --'
            />
            <div className='col-12' style={{ marginTop: '-8px' }}>
              <small className='text-muted'>Si lo dejas vacio, se vinculara o creara un conductor usando el nombre del usuario.</small>
            </div>
          </>
        )}
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

