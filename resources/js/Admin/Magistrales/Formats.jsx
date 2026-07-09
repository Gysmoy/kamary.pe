import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import Modal from '@Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import FormatsRest from '../../Actions/Admin/Magistrales/FormatsRest';
import setSwitchChecked from '../../Utils/setSwitchChecked';

const formatsRest = new FormatsRest()

const Formats = ({ moduleTitle = 'Magistrales - Formatos' }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const descriptionRef = useRef()
  const quantityRef = useRef()
  const statusRef = useRef()
  const [isEditing, setIsEditing] = useState(false)

  const refresh = () => tableRef.current?.refresh()

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    descriptionRef.current.value = data?.description ?? ''
    quantityRef.current.value = data?.quantity ?? 0
    setSwitchChecked(statusRef.current, data?.status !== false && data?.status !== 0)
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const result = await formatsRest.save({
      id: idRef.current.value || undefined,
      description: descriptionRef.current.value.trim(),
      quantity: quantityRef.current.value,
      status: statusRef.current.checked,
    })
    if (!result) return
    refresh()
    $(modalRef.current).modal('hide')
  }

  // OJO: el endpoint /status invierte el valor recibido en el backend,
  // por eso se envia el status ACTUAL de la fila (no el ya invertido).
  const onStatusChange = async ({ id, status }) => {
    const result = await formatsRest.status({ id, status })
    if (!result) return
    refresh()
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar formato', text: 'Se dara de baja el formato magistral.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await formatsRest.delete(id)
    if (!result) return
    refresh()
  }

  return <>
    <VdTable
      ref={tableRef}
      rest={formatsRest}
      icon="mdi mdi-flask-outline"
      title={moduleTitle}
      unit="formatos"
      defaultSort={{ field: 'description', desc: false }}
      defaultPageSize={25}
      searchFields={['description']}
      searchPlaceholder="Buscar por descripcion…"
      emptyText="No se encontraron formatos."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen()}>
          <i className="mdi mdi-plus"></i> Nuevo formato
        </button>
      </>}
      actions={(row) => [
        { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
        { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDelete(r.id) },
      ]}
      columns={[
        {
          key: 'descripcion', label: 'Descripcion', field: 'description', filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar formato">
              {row.description || '-'}
            </a>
          ),
        },
        {
          key: 'cantidad', label: 'Cantidad', field: 'quantity', width: '120px', align: 'right',
          filter: { type: 'number' },
          render: (row) => Number(row.quantity ?? 0).toFixed(3),
        },
        {
          key: 'estado', label: 'Estado', field: 'status', width: '95px',
          filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => {
            if (row.status === null) return ''
            return <SwitchFormGroup noMargin checked={row.status == 1} onChange={() => onStatusChange(row)} />
          },
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.description || '-'}</p>
              <small className="text-muted">Cantidad: {Number(row.quantity ?? 0).toFixed(3)}</small>
            </div>
            {row.status !== null && (
              <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>
            )}
          </div>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar formato magistral' : 'Agregar formato magistral'} size='md' onSubmit={onSave} btnSubmitText='Registrar'>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-8 mb-3'><label className='form-label'>Descripcion</label><input ref={descriptionRef} className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Cantidad</label><input ref={quantityRef} type='number' step='0.001' className='form-control' /></div>
        <SwitchFormGroup eRef={statusRef} label='Estado' col='col-md-4 mt-4' checked />
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-formats'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Formatos'}><Formats {...properties} /></BaseAdminto>)
})
