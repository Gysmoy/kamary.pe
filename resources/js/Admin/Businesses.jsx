import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import BaseAdminto from '@Adminto/Base'
import CreateReactScript from '../Utils/CreateReactScript'
import VdTable from '@Adminto/VdTable'
import Modal from '@Adminto/Modal'
import InputFormGroup from '@Adminto/form/InputFormGroup'
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup'
import BusinessesRest from '../Actions/Admin/BusinessesRest'

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

const Businesses = ({ can }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const refresh = () => tableRef.current?.refresh()

  const onModalOpen = (data) => {
    setIsEditing(!!data?.id)
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

    refresh()
    $(modalRef.current).modal('hide')
  }

  return <>
    <div className='alert alert-info border mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2'>
      <div>
        Estructura: Empresa &gt; Sedes &gt; Almacenes.
        {' '}La configuracion fiscal, sedes, series y certificados se gestionan en Sedes y facturacion.
        {can('services-billing') || can('businesses')
          ? <> Los almacenes se gestionan en <b>Configuraciones &gt; Estructura operativa &gt; Almacenes</b>.</>
          : null}
      </div>
      {(can('services-billing') || can('businesses')) && (
        <a href='/admin/billing-settings' className='btn btn-sm btn-primary'>
          Gestionar sedes
        </a>
      )}
    </div>

    <VdTable
      ref={tableRef}
      rest={businessesRest}
      icon="mdi mdi-domain"
      title="Empresas"
      unit="empresas"
      defaultSort={{ field: 'name', desc: false }}
      defaultPageSize={25}
      searchFields={['name', 'description', 'business_key']}
      searchPlaceholder="Buscar por nombre o descripción…"
      emptyText="No se encontraron empresas."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar tabla" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
      </>}
      actions={(row) => [
        { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
      ]}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'grupo', label: 'Grupo', field: 'business_key', width: '130px',
          filter: {
            type: 'select',
            options: [
              { value: 'kamary_medicals', label: 'Kamary Medicals' },
              { value: 'kamary_peru', label: 'Kamary Peru' },
            ],
          },
          render: (row) => {
            const label = row.business_key === 'kamary_medicals' ? 'Kamary Medicals' : 'Kamary Peru'
            const color = row.business_key === 'kamary_medicals' ? 'success' : 'primary'
            return <span className={`badge bg-${color}-subtle text-${color}`}>{label}</span>
          },
        },
        {
          key: 'nombre', label: 'Nombre', field: 'name', filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar empresa">
              {row.name}
            </a>
          ),
        },
        { key: 'descripcion', label: 'Descripción', field: 'description', filter: { type: 'text' }, muted: true },
        {
          key: 'creador', label: 'Creado por', field: 'creator.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.creator),
        },
        {
          key: 'actualizador', label: 'Actualizado por', field: 'updater.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.updater),
        },
        {
          key: 'estado', label: 'Estado', field: 'status', width: '100px',
          filter: { type: 'select', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => {
            const status = row.status == 1 ? 'Activo' : 'Inactivo'
            const color = row.status == 1 ? 'success' : 'secondary'
            return <span className={`badge bg-${color}-subtle text-${color}`}>{status}</span>
          },
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.name}</p>
              <small className="text-muted">{row.business_key === 'kamary_medicals' ? 'Kamary Medicals' : 'Kamary Peru'}</small>
            </div>
            <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-secondary'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>
          </div>
          {row.description && <p className="text-muted mb-0 mt-2" style={{ fontSize: 12 }}>{row.description}</p>}
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar empresa' : 'Agregar empresa'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <div className='row'>
        <InputFormGroup eRef={nameRef} label='Nombre' col='col-12' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' rows={3} />
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.can('businesses') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Empresas'>
    <Businesses {...properties} />
  </BaseAdminto>)
})
