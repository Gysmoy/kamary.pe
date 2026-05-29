import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import { renderToString } from 'react-dom/server';
import RolesRest from '../Actions/Admin/roles-rest';
import renderGridEditLink from '../Utils/renderGridEditLink';

const rolesRest = new RolesRest()

const MAGISTRALES_MENU_PERMISSIONS = [
  'magistrales-dashboard',
  'magistrales-articles',
  'magistrales-formats',
  'magistrales-formulas',
  'magistrales-purchase-order',
  'magistrales-production-order'
]

const HIDDEN_PERMISSION_NAMES = ['client-distribution']

const QUICK_FLAGS = {
  kamaryMedicals: MAGISTRALES_MENU_PERMISSIONS,
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
    'services-client',
    'sample-orders'
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
    permissions: ['storage-inventory', 'storage-clients', 'storage-service-orders', 'storage-units', 'storage-products', 'storage-entry-note', 'storage-exit-note', 'storage-kardex', 'storage-general-service', 'storage-billing-control', 'storage-general-service-orders']
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
  const gridRef = useRef()
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

  const refreshGrid = () => $(gridRef.current).dxDataGrid('instance').refresh()

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

  return (<>
    <Table
      gridRef={gridRef}
      title='Roles'
      rest={rolesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: refreshGrid
          }
        })
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'add',
            title: 'Agregar',
            hint: 'Agregar rol',
            onClick: () => onModalOpen(null)
          }
        })
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
          minWidth: 180,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.name, () => onModalOpen(data), 'Editar rol')
        },
        {
          caption: 'Perfil sugerido',
          width: 150,
          calculateCellValue: (data) => resolveProfileLabel((data.permissions ?? []).map(permission => permission.name))
        },
        {
          caption: 'Total permisos',
          width: 120,
          calculateCellValue: (data) => data.permissions?.length ?? 0
        },
        {
          dataField: 'permissions',
          caption: 'Permisos',
          allowSorting: false,
          allowFiltering: false,
          minWidth: 420,
          cellTemplate: (container, { data }) => {
            if (data.permissions && data.permissions.length) {
              const badgesHtml = data.permissions
                .map(permission => `<span class="badge badge-soft-primary me-1 mb-1">${permission.beauty_name}</span>`)
                .join('')

              container.html(`<div class='d-flex flex-wrap align-items-start' style='max-height: 4.5em; overflow: hidden;'>${badgesHtml}</div>`)
            } else {
              container.html(renderToString(<i className='text-muted'>Sin permisos</i>))
            }
          }
        },
        {
          caption: 'Acciones',
          width: 160,
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
      ]}
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
                        <small className='text-muted'>Preset orientado a magistrales</small>
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
                        <small className='text-muted'>Preset orientado al negocio principal</small>
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
