import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
import WebInquiriesRest from '../Actions/Admin/WebInquiriesRest';
import { fmtDateTime, telLink, waLink } from '../Utils/webInbox';

const inquiriesRest = new WebInquiriesRest()

const TYPES = {
  contacto: 'Contacto',
  magistrales: 'Magistrales / receta',
  corporativas: 'Corporativas',
  logistico: 'Logístico',
  distribucion: 'Distribución',
  importacion: 'Importación',
  almacen: 'Almacén',
  asesoria: 'Asesoría',
  trabaja: 'Trabaja con nosotros',
}

const STATUSES = {
  new: { label: 'Nuevo', badge: 'badge-soft-danger' },
  in_process: { label: 'En proceso', badge: 'badge-soft-warning' },
  attended: { label: 'Atendido', badge: 'badge-soft-success' },
  archived: { label: 'Archivado', badge: 'badge-soft-secondary' },
}

const typeOptions = Object.entries(TYPES).map(([value, label]) => ({ value, label }))
const statusOptions = Object.entries(STATUSES).map(([value, { label }]) => ({ value, label }))

const StatusBadge = ({ status }) => {
  const s = STATUSES[status]
  return <span className={`badge ${s?.badge ?? 'badge-soft-secondary'}`}>{s?.label ?? status}</span>
}

const fullName = (row) => [row.name, row.last_name].filter(Boolean).join(' ')
const summary = (row) => {
  const text = [row.subject, row.message].filter(Boolean).join(' — ')
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

// Fila "etiqueta: valor" del detalle
const Field = ({ label, children }) => (
  <div className="col-md-6 mb-2">
    <small className="text-muted d-block">{label}</small>
    <div style={{ wordBreak: 'break-word' }}>{children || <i className="text-muted">—</i>}</div>
  </div>
)

const WebInquiries = () => {
  const tableRef = useRef()
  const modalRef = useRef()

  const [current, setCurrent] = useState(null)
  const [status, setStatus] = useState('new')
  const [notes, setNotes] = useState('')

  // Abrir el detalle NO cambia el estado: el paso a "en proceso" es siempre manual.
  const onModalOpen = (row) => {
    setCurrent(row)
    setStatus(row.status ?? 'new')
    setNotes(row.internal_notes ?? '')
    $(modalRef.current).modal('show')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const result = await inquiriesRest.update(current.id, { status, internal_notes: notes })
    if (!result) return
    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  // Cambio rápido de estado desde la fila
  const quickStatus = async (row, newStatus) => {
    const result = await inquiriesRest.update(row.id, { status: newStatus })
    if (result) tableRef.current?.refresh()
  }

  const wa = waLink(current?.phone)
  const tel = telLink(current?.phone)

  return (<>
    <VdTable
      ref={tableRef}
      rest={inquiriesRest}
      icon="mdi mdi-message-text-outline"
      title="Consultas web"
      unit="consultas"
      defaultSort={{ field: 'created_at', desc: true }}
      defaultPageSize={25}
      searchFields={['name', 'last_name', 'email', 'phone', 'subject', 'message']}
      searchPlaceholder="Buscar por nombre, correo, teléfono o mensaje…"
      emptyText="Aún no hay consultas."
      headerActions={
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={() => tableRef.current?.refresh()}>
          <i className="mdi mdi-refresh"></i>
        </button>
      }
      actions={(row) => [
        { icon: 'mdi mdi-eye', title: 'Ver detalle', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
        { icon: 'mdi mdi-progress-clock', title: 'Marcar en proceso', bg: '#fff4e0', color: '#e08a00', hidden: row.status !== 'new', onClick: (r) => quickStatus(r, 'in_process') },
        { icon: 'mdi mdi-check', title: 'Marcar atendido', bg: '#e6f6ee', color: '#1abc9c', hidden: row.status === 'attended' || row.status === 'archived', onClick: (r) => quickStatus(r, 'attended') },
      ]}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'created_at', label: 'Fecha', field: 'created_at', width: '140px',
          filter: { type: 'date' },
          render: (row) => fmtDateTime(row.created_at),
        },
        {
          key: 'type', label: 'Tipo', field: 'type', width: '170px',
          filter: { type: 'select', options: typeOptions },
          render: (row) => <span className="badge badge-soft-primary">{TYPES[row.type] ?? row.type}</span>,
        },
        {
          key: 'name', label: 'Nombre', field: 'name',
          filter: { type: 'text', fields: ['name', 'last_name'] },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)}>{fullName(row)}</a>
          ),
        },
        { key: 'phone', label: 'Teléfono', field: 'phone', filter: { type: 'text' } },
        { key: 'email', label: 'Correo', field: 'email', filter: { type: 'text' } },
        {
          key: 'message', label: 'Asunto / mensaje', field: 'message', sortable: false,
          filter: { type: 'text', fields: ['subject', 'message'] },
          render: (row) => <span title={[row.subject, row.message].filter(Boolean).join(' — ')}>{summary(row)}</span>,
        },
        {
          key: 'has_file', label: 'Adjunto', field: 'file_path', width: '90px', sortable: false,
          render: (row) => Number(row.has_file)
            ? <span className="badge badge-soft-info"><i className="mdi mdi-paperclip"></i> Sí</span>
            : <span className="text-muted">No</span>,
        },
        {
          key: 'status', label: 'Estado', field: 'status', width: '120px',
          filter: { type: 'select', options: statusOptions },
          render: (row) => <StatusBadge status={row.status} />,
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{fullName(row)}</p>
              <small className="text-muted">{fmtDateTime(row.created_at)}</small>
            </div>
            <StatusBadge status={row.status} />
          </div>
          <div className="mt-2"><span className="badge badge-soft-primary">{TYPES[row.type] ?? row.type}</span></div>
          <small className="text-muted d-block mt-2">{summary(row)}</small>
          <small className="text-muted d-block mt-1">{row.phone} · {row.email}</small>
          {Number(row.has_file) > 0 && <small className="text-muted d-block mt-1"><i className="mdi mdi-paperclip"></i> Con adjunto</small>}
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={current ? `Consulta · ${TYPES[current.type] ?? current.type}` : 'Consulta'} onSubmit={onSubmit} size='lg' btnSubmitText='Guardar'>
      {current && <>
        <div className="row">
          <Field label="Fecha">{fmtDateTime(current.created_at)}</Field>
          <Field label="Tipo">{TYPES[current.type] ?? current.type}</Field>
          <Field label="Nombre">{fullName(current)}</Field>
          <Field label="Teléfono">
            {current.phone && <>
              {current.phone}
              <span className="ms-2 d-inline-flex gap-1">
                {tel && <a className="btn btn-xs btn-soft-primary" href={tel} title="Llamar"><i className="mdi mdi-phone"></i></a>}
                {wa && <a className="btn btn-xs btn-soft-success" href={wa} target="_blank" rel="noopener noreferrer" title="Escribir por WhatsApp"><i className="mdi mdi-whatsapp"></i></a>}
              </span>
            </>}
          </Field>
          <Field label="Correo">
            {current.email && <a href={`mailto:${current.email}`}>{current.email}</a>}
          </Field>
          <Field label="Asunto">{current.subject}</Field>
          <div className="col-12 mb-2">
            <small className="text-muted d-block">Mensaje</small>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{current.message || <i className="text-muted">—</i>}</div>
          </div>
          <div className="col-12 mb-3">
            <small className="text-muted d-block">Adjunto</small>
            {Number(current.has_file)
              ? <a className="btn btn-sm btn-soft-primary" href={inquiriesRest.fileUrl(current.id)}><i className="mdi mdi-download me-1"></i>Descargar adjunto</a>
              : <i className="text-muted">Sin adjunto</i>}
          </div>
        </div>
        <hr className="mt-0" />
        <div className="row">
          <VdSelect label="Estado" col="col-md-4" value={status} onChange={setStatus} options={statusOptions} />
          <div className="col-12">
            <label className="form-label mb-1">Notas internas</label>
            <textarea className="form-control" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Solo las ve el equipo, no se envían al cliente." maxLength={5000} />
          </div>
        </div>
        <small className="text-muted d-block mt-3">IP: {current.ip || '—'}</small>
      </>}
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('web-inquiries') && !properties.hasRole('Admin') && !properties.hasRole('Root')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Consultas web'>
    <WebInquiries {...properties} />
  </BaseAdminto>);
})
