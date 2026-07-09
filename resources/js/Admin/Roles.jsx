import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import Modal from '../Components/Adminto/Modal';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import RolesRest from '../Actions/Admin/roles-rest';

const rolesRest = new RolesRest()

const MAGISTRALES_MENU_PERMISSIONS = [
  'magistrales-dashboard',
  'magistrales-products',
  'magistrales-procurement',
  'magistrales-warehouse',
  'magistrales-billing',
  'magistrales-articles',
  'magistrales-category',
  'magistrales-formats',
  'magistrales-formulas',
  'magistrales-incomes',
  'magistrales-inventory',
  'magistrales-kardex',
  'magistrales-laboratory',
  'magistrales-purchase-order',
  'magistrales-production-order',
  'magistrales-supplier',
  'magistrales-responsible',
  'magistrales-outputs',
  'magistrales-unit',
  'magistrales-sales'
]

const STORAGE_MENU_PERMISSIONS = [
  'storage-inventory',
  'storage-clients',
  'storage-service-orders',
  'storage-units',
  'storage-products',
  'storage-entry-note',
  'storage-exit-note',
  'storage-kardex',
  'storage-general-service',
  'storage-billing-control',
  'storage-general-service-orders',
  'storage-api-tokens'
]

const HIDDEN_PERMISSION_NAMES = ['client-distribution']

const QUICK_FLAGS = {
  kamaryMedicals: STORAGE_MENU_PERMISSIONS,
  kamaryPeru: [
    'dashboard',
    'businesses',
    'expenses',
    'suppliers',
    'purchase-orders',
    'purchase-receipts',
    'accounts-payable',
    'clients',
    'eventual-clients',
    'pricing',
    'take-orders',
    'orders',
    'accounts-receivable',
    'services-billing',
    'services-service-order',
    'services-services',
    'dispatch',
    'driver',
    'vehicle-zone',
    'activity',
    'daily-summary',
    'articles',
    'inventory',
    'kardex',
    'laboratories',
    'batches',
    'entry-note',
    'exit-note',
    'units-of-measure',
    'services-client',
    'sample-orders',
    ...MAGISTRALES_MENU_PERMISSIONS
  ]
}

const PERMISSION_GROUPS = [
  {
    key: 'sistemas',
    title: 'Sistemas',
    permissions: ['dashboard', 'businesses', 'users', 'roles']
  },
  {
    key: 'almacen',
    title: 'Almacen',
    permissions: ['articles', 'inventory', 'kardex', 'laboratories', 'batches', 'entry-note', 'exit-note', 'suppliers', 'units-of-measure']
  },
  {
    key: 'administracion',
    title: 'Administracion',
    permissions: ['purchase-orders', 'purchase-receipts', 'accounts-payable', 'expenses', 'daily-summary']
  },
  {
    key: 'comercial',
    title: 'Comercial',
    permissions: ['clients', 'eventual-clients', 'accounts-receivable', 'take-orders', 'orders', 'pricing']
  },
  {
    key: 'almacenamiento',
    title: 'Serv. Almacenamiento',
    permissions: ['storage-inventory', 'storage-clients', 'storage-service-orders', 'storage-units', 'storage-products', 'storage-entry-note', 'storage-exit-note', 'storage-kardex', 'storage-general-service', 'storage-billing-control', 'storage-general-service-orders', 'storage-api-tokens']
  },
  {
    key: 'despacho',
    title: 'Despacho',
    permissions: ['activity', 'driver', 'dispatch', 'vehicle-zone']
  },
  {
    key: 'servicios',
    title: 'Servicios',
    permissions: ['services-client', 'services-billing', 'services-service-order', 'services-services']
  },
  {
    key: 'muestras',
    title: 'Muestras',
    permissions: ['sample-orders']
  },
  {
    key: 'magistrales',
    title: 'Magistrales',
    permissions: MAGISTRALES_MENU_PERMISSIONS
  }
]

const CRITICAL_PERMISSIONS = ['users', 'roles']

const unique = (values) => [...new Set(values)]

const hasAll = (selectedPermissions, permissionsToCheck) => {
  const selectedSet = new Set(selectedPermissions)
  return permissionsToCheck.length > 0 && permissionsToCheck.every(permission => selectedSet.has(permission))
}

const resolveProfileLabel = (permissionNames = []) => {
  const medicalsEnabled = hasAll(permissionNames, QUICK_FLAGS.kamaryMedicals)
  const peruEnabled = hasAll(permissionNames, QUICK_FLAGS.kamaryPeru)

  if (medicalsEnabled && peruEnabled) return 'Mixto'
  if (medicalsEnabled) return 'Kamary Medicals'
  if (peruEnabled) return 'Kamary Peru'
  if (!permissionNames.length) return 'Sin permisos'
  return 'Personalizado'
}

const surfaceClass = 'border rounded-3 bg-white shadow-sm h-100'
const surfaceMutedClass = 'border rounded-3 bg-light-subtle shadow-sm h-100'

const Roles = ({ permissions }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const nameRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [permissionSearch, setPermissionSearch] = useState('')

  const visiblePermissions = useMemo(() => {
    return permissions.filter(permission => !HIDDEN_PERMISSION_NAMES.includes(permission.name))
  }, [permissions])

  const permissionMap = useMemo(() => {
    return new Map(visiblePermissions.map(permission => [permission.name, permission]))
  }, [visiblePermissions])

  const knownPermissionNames = useMemo(() => {
    return new Set(PERMISSION_GROUPS.flatMap(group => group.permissions))
  }, [])

  const availableFlags = useMemo(() => {
    return {
      kamaryMedicals: QUICK_FLAGS.kamaryMedicals.filter(permission => permissionMap.has(permission)),
      kamaryPeru: QUICK_FLAGS.kamaryPeru.filter(permission => permissionMap.has(permission))
    }
  }, [permissionMap])

  const visibleGroups = useMemo(() => {
    const search = permissionSearch.trim().toLowerCase()
    const matchesSearch = (permission) => {
      if (!search) return true
      return (permission.beauty_name ?? '').toLowerCase().includes(search)
        || (permission.name ?? '').toLowerCase().includes(search)
    }

    const grouped = PERMISSION_GROUPS.map(group => {
      const items = group.permissions
        .map(name => permissionMap.get(name))
        .filter(Boolean)
        .filter(matchesSearch)

      return {
        ...group,
        items,
      }
    }).filter(group => group.items.length > 0)

    const otherPermissions = visiblePermissions
      .filter(permission => !knownPermissionNames.has(permission.name))
      .filter(matchesSearch)

    if (otherPermissions.length > 0) {
      grouped.push({
        key: 'otros',
        title: 'Otros permisos',
        items: otherPermissions,
      })
    }

    return grouped
  }, [knownPermissionNames, permissionMap, permissionSearch, visiblePermissions])

  const selectedPermissionsSet = useMemo(() => new Set(selectedPermissions), [selectedPermissions])
  const currentProfileLabel = useMemo(() => resolveProfileLabel(selectedPermissions), [selectedPermissions])

  const refreshGrid = () => tableRef.current?.refresh()

  const onModalOpen = (data) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    const permissionNames = data?.permissions?.map(({ name }) => name) ?? []
    setSelectedPermissions(permissionNames)
    setPermissionSearch('')
    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      permissions: unique(selectedPermissions)
    }

    const result = await rolesRest.save(request)
    if (!result) return

    refreshGrid()
    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar rol',
      text: 'Estas seguro de eliminar este rol? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!isConfirmed) return

    const result = await rolesRest.delete(id)
    if (!result) return

    refreshGrid()
  }

  const handlePermissionToggle = (permissionName) => {
    setSelectedPermissions(previous => previous.includes(permissionName)
      ? previous.filter(permission => permission !== permissionName)
      : [...previous, permissionName]
    )
  }

  const handleSelectAllPermissions = () => {
    setSelectedPermissions(visiblePermissions.map(({ name }) => name))
  }

  const handleClearAllPermissions = () => {
    setSelectedPermissions([])
  }

  const handleToggleFlag = (flagKey) => {
    const flagPermissions = availableFlags[flagKey] ?? []
    if (!flagPermissions.length) return

    setSelectedPermissions(previous => {
      const previousSet = new Set(previous)
      const fullyEnabled = flagPermissions.every(permission => previousSet.has(permission))

      if (fullyEnabled) {
        return previous.filter(permission => !flagPermissions.includes(permission))
      }

      return unique([...previous, ...flagPermissions])
    })
  }

  const handleReplaceWithFlag = (flagKey) => {
    const flagPermissions = availableFlags[flagKey] ?? []
    setSelectedPermissions(unique(flagPermissions))
  }

  const handleToggleGroup = (groupPermissions) => {
    if (!groupPermissions.length) return

    setSelectedPermissions(previous => {
      const previousSet = new Set(previous)
      const allSelected = groupPermissions.every(permission => previousSet.has(permission))

      if (allSelected) {
        return previous.filter(permission => !groupPermissions.includes(permission))
      }

      return unique([...previous, ...groupPermissions])
    })
  }

  const rowActions = (role) => [
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
    { icon: 'mdi mdi-delete', title: 'Eliminar rol', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
  ]

  return (<>
    <VdTable
      ref={tableRef}
      rest={rolesRest}
      icon="mdi mdi-account-key"
      title="Roles"
      unit="roles"
      defaultSort={{ field: 'name', desc: false }}
      defaultPageSize={25}
      searchFields={['name']}
      searchPlaceholder="Buscar por nombre de rol…"
      emptyText="No se encontraron roles."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refreshGrid}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen(null)}>
          <i className="mdi mdi-plus"></i> Nuevo rol
        </button>
      </>}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'nombre', label: 'Nombre del rol', field: 'name', filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar rol">
              {row.name}
            </a>
          ),
        },
        {
          key: 'perfil', label: 'Perfil sugerido', sortable: false, width: '150px',
          render: (row) => resolveProfileLabel((row.permissions ?? []).map(permission => permission.name)),
        },
        {
          key: 'total_permisos', label: 'Total permisos', sortable: false, align: 'right', width: '120px', nowrap: true,
          render: (row) => <span className="fw-semibold">{row.permissions?.length ?? 0}</span>,
        },
        {
          key: 'permisos', label: 'Permisos', field: 'permissions', sortable: false,
          render: (row) => {
            if (row.permissions && row.permissions.length) {
              return (
                <div className="d-flex flex-wrap align-items-start" style={{ maxHeight: '4.5em', overflow: 'hidden' }}>
                  {row.permissions.map(permission => (
                    <span key={permission.name} className="badge badge-soft-primary me-1 mb-1">{permission.beauty_name}</span>
                  ))}
                </div>
              )
            }
            return <i className="text-muted">Sin permisos</i>
          },
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.name}</p>
              <small className="text-muted">{resolveProfileLabel((row.permissions ?? []).map(permission => permission.name))}</small>
            </div>
            <span className="badge badge-soft-secondary">{row.permissions?.length ?? 0} permisos</span>
          </div>
          {row.permissions && row.permissions.length > 0 && (
            <div className="d-flex flex-wrap mt-2" style={{ maxHeight: '4.5em', overflow: 'hidden' }}>
              {row.permissions.map(permission => (
                <span key={permission.name} className="badge badge-soft-primary me-1 mb-1">{permission.beauty_name}</span>
              ))}
            </div>
          )}
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal
      modalRef={modalRef}
      title={isEditing ? 'Editar rol' : 'Agregar rol'}
      onSubmit={onModalSubmit}
      size='xl'
      btnSubmitText='Guardar'
    >
      <input ref={idRef} type='hidden' />
      <div className='row g-2'>
        <div className='col-12'>
          <div className={surfaceMutedClass}>
            <div className='p-3'>
              <div className='row g-2 align-items-end'>
                <div className='col-12 col-xl-4'>
                  <InputFormGroup eRef={nameRef} label='Nombre del rol' required disabled={isEditing} col='col-12' />
                </div>
                <div className='col-12 col-xl-4'>
                  <label className='form-label mb-1'>Resumen rapido</label>
                  <div className='border rounded-3 bg-white px-3 py-2 d-flex flex-wrap align-items-center gap-2 h-100'>
                    <span className='badge badge-soft-primary'>{selectedPermissions.length} permisos</span>
                    <span className='badge badge-soft-secondary'>{currentProfileLabel}</span>
                    {CRITICAL_PERMISSIONS.some(permission => selectedPermissionsSet.has(permission))
                      ? <span className='badge badge-soft-danger'>Criticos activos</span>
                      : <span className='badge badge-soft-success'>Sin criticos</span>}
                  </div>
                </div>
                <div className='col-12 col-sm-6 col-xl-2'>
                  <label className='form-label mb-1'>Acciones</label>
                  <div className='d-grid gap-2'>
                    <button type='button' className='btn btn-sm btn-outline-dark' onClick={handleSelectAllPermissions}>Seleccionar todo</button>
                    <button type='button' className='btn btn-sm btn-outline-danger' onClick={handleClearAllPermissions}>Limpiar</button>
                  </div>
                </div>
                <div className='col-12 col-sm-6 col-xl-2'>
                  <label className='form-label mb-1'>Buscar permiso</label>
                  <input
                    className='form-control'
                    placeholder='Nombre o codigo'
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className='row g-2 mt-1'>
                <div className='col-12 col-xl-6'>
                  <div className='border rounded-3 bg-white px-3 py-2 h-100'>
                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-2'>
                      <div>
                        <strong className='text-primary d-block'>Kamary Medicals</strong>
                        <small className='text-muted'>Preset orientado a servicios de almacenamiento</small>
                      </div>
                      <div className='d-flex flex-wrap gap-2'>
                        <span className={`badge align-self-center ${hasAll(selectedPermissions, availableFlags.kamaryMedicals) ? 'bg-primary' : 'badge-soft-primary'}`}>
                          {availableFlags.kamaryMedicals.length}
                        </span>
                        <button
                          type='button'
                          className={`btn btn-sm ${hasAll(selectedPermissions, availableFlags.kamaryMedicals) ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => handleToggleFlag('kamaryMedicals')}
                        >
                          Activar
                        </button>
                        <button
                          type='button'
                          className='btn btn-sm btn-outline-primary'
                          onClick={() => handleReplaceWithFlag('kamaryMedicals')}
                        >
                          Solo este
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='col-12 col-xl-6'>
                  <div className='border rounded-3 bg-white px-3 py-2 h-100'>
                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-2'>
                      <div>
                        <strong className='text-success d-block'>Kamary Peru</strong>
                        <small className='text-muted'>Preset orientado al negocio principal y magistrales</small>
                      </div>
                      <div className='d-flex flex-wrap gap-2'>
                        <span className={`badge align-self-center ${hasAll(selectedPermissions, availableFlags.kamaryPeru) ? 'bg-success' : 'badge-soft-success'}`}>
                          {availableFlags.kamaryPeru.length}
                        </span>
                        <button
                          type='button'
                          className={`btn btn-sm ${hasAll(selectedPermissions, availableFlags.kamaryPeru) ? 'btn-success' : 'btn-outline-success'}`}
                          onClick={() => handleToggleFlag('kamaryPeru')}
                        >
                          Activar
                        </button>
                        <button
                          type='button'
                          className='btn btn-sm btn-outline-success'
                          onClick={() => handleReplaceWithFlag('kamaryPeru')}
                        >
                          Solo este
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='col-12'>
          <div className='row g-3'>
            {visibleGroups.map(group => {
              const groupPermissionNames = group.items.map(permission => permission.name)
              const selectedInGroup = groupPermissionNames.filter(permission => selectedPermissionsSet.has(permission)).length
              const allSelected = groupPermissionNames.length > 0 && selectedInGroup === groupPermissionNames.length

              return (
                <div key={group.key} className='col-12 col-xl-6'>
                  <div className={surfaceClass}>
                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom px-3 py-2 bg-light-subtle'>
                      <div>
                        <h5 className='mb-1'>{group.title}</h5>
                        <small className='text-muted'>{selectedInGroup}/{groupPermissionNames.length} seleccionados</small>
                      </div>
                      <button
                        type='button'
                        className={`btn btn-sm ${allSelected ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                        onClick={() => handleToggleGroup(groupPermissionNames)}
                      >
                        {allSelected ? 'Quitar grupo' : 'Marcar grupo'}
                      </button>
                    </div>
                    <div className='p-2' style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <div className='row g-2'>
                        {group.items.map(permission => {
                          const checked = selectedPermissionsSet.has(permission.name)
                          const isCritical = CRITICAL_PERMISSIONS.includes(permission.name)

                          return (
                            <div key={permission.name} className='col-12'>
                              <label
                                htmlFor={`permission-${permission.name}`}
                                className={`d-flex align-items-start justify-content-between gap-3 border rounded-3 px-3 py-2 w-100 ${checked ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white border-light-subtle'}`}
                                style={{ cursor: 'pointer' }}
                              >
                                <span>
                                  <strong className='d-block'>{permission.beauty_name}</strong>
                                  <small className={checked ? 'text-white' : 'text-muted'}>{permission.name}</small>
                                </span>
                                <span className='d-flex align-items-center gap-2'>
                                  {isCritical && <span className={`badge ${checked ? 'bg-white text-danger' : 'bg-danger'}`}>Critico</span>}
                                  <input
                                    id={`permission-${permission.name}`}
                                    type='checkbox'
                                    checked={checked}
                                    onChange={() => handlePermissionToggle(permission.name)}
                                  />
                                </span>
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {visibleGroups.length === 0 && (
              <div className='col-12'>
                <div className='alert alert-light border mb-0'>No hay permisos que coincidan con la busqueda actual.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('roles') && !properties.hasRole('Admin')) location.href = '/admin/'

  createRoot(el).render(<BaseAdminto {...properties} title='Roles'>
    <Roles {...properties} />
  </BaseAdminto>)
})
