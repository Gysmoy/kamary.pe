import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import Modal from '../Components/Adminto/Modal';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import Swal from 'sweetalert2';
import DetractionTypesRest from '../Actions/Admin/DetractionTypesRest';

const detractionTypesRest = new DetractionTypesRest()

const formatPercent = (value) => `${Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`

const DetractionTypes = () => {
  const tableRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const descriptionRef = useRef()
  const percentRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    if (idRef.current) idRef.current.value = data?.id ?? ''
    if (codeRef.current) codeRef.current.value = data?.code ?? ''
    if (descriptionRef.current) descriptionRef.current.value = data?.description ?? ''
    if (percentRef.current) percentRef.current.value = data?.percent ?? ''
    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const result = await detractionTypesRest.save({
      id: idRef.current.value || undefined,
      code: (codeRef.current.value ?? '').trim(),
      description: (descriptionRef.current.value ?? '').trim(),
      percent: percentRef.current.value,
    })
    if (!result) return

    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (row) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar tipo de detraccion',
      html: `Se dara de baja <b>[${row.code}] ${row.description}</b>.<br/>Los documentos que ya lo usaron conservan su porcentaje.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return

    const result = await detractionTypesRest.delete(row.id)
    if (!result) return
    tableRef.current?.refresh()
  }

  return (<>
    <div className='alert alert-info d-flex align-items-start gap-2'>
      <i className='mdi mdi-information-outline fs-4 lh-1'></i>
      <div>
        Estos son los tipos que aparecen al marcar <strong>detraccion</strong> en un pedido o en un comprobante.
        El porcentaje de cada tipo lo define SUNAT: cuando cambie una tasa, se corrige aqui y los documentos
        nuevos la toman de inmediato. <strong>Los documentos ya emitidos no se recalculan.</strong>
      </div>
    </div>

    <VdTable
      ref={tableRef}
      rest={detractionTypesRest}
      icon='mdi mdi-percent-outline'
      title='Tipos de detraccion'
      unit='tipos'
      defaultPageSize={25}
      searchFields={['code', 'description']}
      searchPlaceholder='Buscar por codigo o descripcion…'
      emptyText='No hay tipos de detraccion registrados.'
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
        <button type='button' className='vdt-btn-pri' onClick={() => onModalOpen()}>
          <i className='mdi mdi-plus'></i> Nuevo tipo
        </button>
      </>}
      actions={(row) => [
        { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
        { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r) },
      ]}
      columns={[
        {
          key: 'codigo', label: 'Codigo', field: 'code', width: '120px', filter: { type: 'text' },
          render: (row) => (
            <a className='admin-grid-edit-link' style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title='Editar'>
              {row.code}
            </a>
          ),
        },
        { key: 'descripcion', label: 'Descripcion', field: 'description', filter: { type: 'text' } },
        {
          key: 'porcentaje', label: 'Porcentaje', field: 'percent', width: '140px',
          render: (row) => <span className='fw-semibold'>{formatPercent(row.percent)}</span>,
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className='vdt-card' onClick={() => onModalOpen(row)}>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>[{row.code}] {row.description}</p>
            </div>
            <span className='badge badge-soft-primary'>{formatPercent(row.percent)}</span>
          </div>
          {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal
      modalRef={modalRef}
      title={isEditing ? 'Editar tipo de detraccion' : 'Agregar tipo de detraccion'}
      onSubmit={onModalSubmit}
      size='md'
    >
      <div className='row' id='detraction-types-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={codeRef} label='Codigo' col='col-md-4' required placeholder='019' />
        <InputFormGroup eRef={percentRef} label='Porcentaje (%)' col='col-md-4' type='number' step='0.01' min='0' max='100' required />
        <InputFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' required placeholder='Arrendamiento de bienes muebles' />
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('businesses') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Tipos de detraccion'>
    <DetractionTypes {...properties} />
  </BaseAdminto>);
})
