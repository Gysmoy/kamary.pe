import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import Modal from '@Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import Swal from 'sweetalert2';
import ResponsiblesRest from '../../Actions/Admin/Magistrales/ResponsiblesRest';

const rest = new ResponsiblesRest()

const Responsibles = ({ moduleTitle = 'Magistrales - Responsable' }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const documentRef = useRef()
  const nameRef = useRef()
  const [isEditing, setIsEditing] = useState(false)

  const refresh = () => tableRef.current?.refresh()

  const openModal = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    documentRef.current.value = data?.document_number ?? ''
    nameRef.current.value = data?.name ?? ''
    $(modalRef.current).modal('show')
  }

  const save = async (e) => {
    e.preventDefault()
    const result = await rest.save({
      id: idRef.current.value || undefined,
      document_number: documentRef.current.value.trim(),
      name: nameRef.current.value.trim(),
    })
    if (!result) return
    refresh()
    $(modalRef.current).modal('hide')
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar responsable', text: 'Se dara de baja el responsable.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await rest.delete(id)
    if (result) refresh()
  }

  const rowActions = (row) => [
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => openModal(r) },
    { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => remove(r.id) },
  ]

  return <>
    <VdTable
      ref={tableRef}
      rest={rest}
      icon="mdi mdi-account-tie"
      title={moduleTitle}
      unit="responsables"
      defaultSort={{ field: 'name', desc: false }}
      defaultPageSize={25}
      searchFields={['document_number', 'name']}
      searchPlaceholder="Buscar por documento o nombre…"
      emptyText="No se encontraron responsables."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => openModal()}>
          <i className="mdi mdi-plus"></i> Nuevo responsable
        </button>
      </>}
      actions={rowActions}
      columns={[
        {
          key: 'documento', label: 'Documento', field: 'document_number', width: '140px',
          filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => openModal(row)} title="Editar responsable">
              {row.document_number}
            </a>
          ),
        },
        { key: 'nombre', label: 'Nombre', field: 'name', filter: { type: 'text' } },
        {
          key: 'estado', label: 'Estado', field: 'status', width: '95px', sortable: false,
          render: (row) => {
            if (row.status === null) return ''
            return <SwitchFormGroup noMargin checked={row.status == 1} onChange={() => rest.status(row).then(ok => ok && refresh())} />
          },
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => openModal(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.name}</p>
              <small className="text-muted">{row.document_number}</small>
            </div>
            {row.status !== null && (
              <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>
            )}
          </div>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar responsable' : 'Agregar responsable'} onSubmit={save} size='md'>
      <div className='row'>
        <input ref={idRef} hidden />
        <InputFormGroup eRef={documentRef} label='Documento' col='col-md-4' required />
        <InputFormGroup eRef={nameRef} label='Nombre' col='col-md-8' required />
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-responsible'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Responsable'}><Responsibles {...properties} /></BaseAdminto>)
})
