import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
import WebComplaintsRest from '../Actions/Admin/WebComplaintsRest';
import { fmtDate, fmtDateTime, telLink, toDateInput, waLink } from '../Utils/webInbox';

const complaintsRest = new WebComplaintsRest()

// Plazo legal: 15 días hábiles para responder. En la tabla se avisa a partir de los 10 días corridos.
const ALERT_DAYS = 10

const STATUSES = {
  new: { label: 'Nuevo', badge: 'badge-soft-danger' },
  in_process: { label: 'En proceso', badge: 'badge-soft-warning' },
  answered: { label: 'Respondido', badge: 'badge-soft-success' },
  closed: { label: 'Cerrado', badge: 'badge-soft-secondary' },
}
const statusOptions = Object.entries(STATUSES).map(([value, { label }]) => ({ value, label }))

const CLAIM_TYPES = { reclamo: 'Reclamo', queja: 'Queja' }
const GOOD_TYPES = { producto: 'Producto', servicio: 'Servicio' }
const claimOptions = Object.entries(CLAIM_TYPES).map(([value, label]) => ({ value, label }))
const goodOptions = Object.entries(GOOD_TYPES).map(([value, label]) => ({ value, label }))

const StatusBadge = ({ status }) => {
  const s = STATUSES[status]
  return <span className={`badge ${s?.badge ?? 'badge-soft-secondary'}`}>{s?.label ?? status}</span>
}

const isJuridica = (row) => row.person_type === 'juridica'
const consumer = (row) => isJuridica(row)
  ? (row.business_name || '')
  : [row.first_name, row.last_name].filter(Boolean).join(' ')
const documentLabel = (row) => [row.document_type, row.document_number].filter(Boolean).join(' ')

// Pendiente (nuevo / en proceso) con más de 10 días
const isOverdue = (row) => ['new', 'in_process'].includes(row.status) && Number(row.age_days) > ALERT_DAYS

const Field = ({ label, children, col = 'col-md-6' }) => (
  <div className={`${col} mb-2`}>
    <small className="text-muted d-block">{label}</small>
    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{children || <i className="text-muted">—</i>}</div>
  </div>
)

const OverdueBadge = ({ row }) => isOverdue(row)
  ? <span className="badge bg-danger ms-1" title={`Lleva ${row.age_days} días sin respuesta. El plazo legal es de 15 días hábiles.`}><i className="mdi mdi-alert"></i> {row.age_days} días</span>
  : null

const WebComplaints = () => {
  const tableRef = useRef()
  const modalRef = useRef()

  const [current, setCurrent] = useState(null)
  const [status, setStatus] = useState('new')
  const [responseText, setResponseText] = useState('')
  const [respondedAt, setRespondedAt] = useState('')

  const onModalOpen = (row) => {
    setCurrent(row)
    setStatus(row.status ?? 'new')
    setResponseText(row.response_text ?? '')
    setRespondedAt(toDateInput(row.responded_at))
    $(modalRef.current).modal('show')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const result = await complaintsRest.update(current.id, {
      status,
      response_text: responseText,
      responded_at: respondedAt || null,
    })
    if (!result) return
    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const quickStatus = async (row, newStatus) => {
    const result = await complaintsRest.update(row.id, { status: newStatus })
    if (result) tableRef.current?.refresh()
  }

  const wa = waLink(current?.phone)
  const tel = telLink(current?.phone)

  return (<>
    <VdTable
      ref={tableRef}
      rest={complaintsRest}
      icon="mdi mdi-book-open-page-variant-outline"
      title="Libro de reclamaciones"
      unit="reclamos"
      defaultSort={{ field: 'created_at', desc: true }}
      defaultPageSize={25}
      searchFields={['code', 'first_name', 'last_name', 'business_name', 'document_number', 'email', 'phone']}
      searchPlaceholder="Buscar por código, consumidor, documento o correo…"
      emptyText="Aún no hay reclamos ni quejas."
      headerActions={
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={() => tableRef.current?.refresh()}>
          <i className="mdi mdi-refresh"></i>
        </button>
      }
      actions={(row) => [
        { icon: 'mdi mdi-eye', title: 'Ver detalle', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
        { icon: 'mdi mdi-progress-clock', title: 'Marcar en proceso', bg: '#fff4e0', color: '#e08a00', hidden: row.status !== 'new', onClick: (r) => quickStatus(r, 'in_process') },
      ]}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'code', label: 'Código LR', field: 'code', width: '120px',
          filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)}>{row.code}</a>
          ),
        },
        {
          key: 'created_at', label: 'Fecha', field: 'created_at', width: '140px',
          filter: { type: 'date' },
          render: (row) => <>{fmtDateTime(row.created_at)}<OverdueBadge row={row} /></>,
        },
        {
          key: 'claim_type', label: 'Tipo', field: 'claim_type', width: '110px',
          filter: { type: 'select', options: claimOptions },
          render: (row) => <span className={`badge ${row.claim_type === 'queja' ? 'badge-soft-info' : 'badge-soft-primary'}`}>{CLAIM_TYPES[row.claim_type] ?? row.claim_type}</span>,
        },
        {
          key: 'consumer', label: 'Consumidor', field: 'last_name', sortable: false,
          filter: { type: 'text', fields: ['first_name', 'last_name', 'business_name'] },
          render: (row) => <span>{consumer(row)}{isJuridica(row) && <small className="text-muted ms-1">(jurídica)</small>}</span>,
        },
        {
          key: 'document_number', label: 'Documento', field: 'document_number', width: '140px',
          filter: { type: 'text' },
          render: (row) => documentLabel(row),
        },
        {
          key: 'good_type', label: 'Bien', field: 'good_type', width: '110px',
          filter: { type: 'select', options: goodOptions },
          render: (row) => GOOD_TYPES[row.good_type] ?? row.good_type,
        },
        {
          key: 'status', label: 'Estado', field: 'status', width: '120px',
          filter: { type: 'select', options: statusOptions },
          render: (row) => <StatusBadge status={row.status} />,
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)} style={isOverdue(row) ? { borderLeft: '4px solid #e24b4a' } : undefined}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.code} · {consumer(row)}</p>
              <small className="text-muted">{fmtDateTime(row.created_at)}</small><OverdueBadge row={row} />
            </div>
            <StatusBadge status={row.status} />
          </div>
          <div className="d-flex gap-1 mt-2">
            <span className="badge badge-soft-primary">{CLAIM_TYPES[row.claim_type] ?? row.claim_type}</span>
            <span className="badge badge-soft-secondary">{GOOD_TYPES[row.good_type] ?? row.good_type}</span>
          </div>
          <small className="text-muted d-block mt-2">{documentLabel(row)}</small>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={current ? `Hoja de reclamación ${current.code}` : 'Reclamo'} onSubmit={onSubmit} size='lg' btnSubmitText='Guardar'>
      {current && <>
        {isOverdue(current) && (
          <div className="alert alert-danger py-2">
            <i className="mdi mdi-alert me-1"></i>Lleva {current.age_days} días sin respuesta. La norma exige responder en 15 días hábiles.
          </div>
        )}
        <div className="row">
          <Field label="Código">{current.code}</Field>
          <Field label="Fecha de registro">{fmtDateTime(current.created_at)}</Field>
          <Field label="Tipo de persona">{isJuridica(current) ? 'Persona jurídica' : 'Persona natural'}</Field>
          {isJuridica(current)
            ? <Field label="Razón social">{current.business_name}</Field>
            : <Field label="Nombres y apellidos">{consumer(current)}</Field>}
          <Field label="Documento">{documentLabel(current)}</Field>
          <Field label="Dirección">{current.address}</Field>
          <Field label="Distrito">{current.district}</Field>
          <Field label="Departamento">{current.department}</Field>
          <Field label="Teléfono">
            {current.phone && <>
              {current.phone}
              <span className="ms-2 d-inline-flex gap-1">
                {tel && <a className="btn btn-xs btn-soft-primary" href={tel} title="Llamar"><i className="mdi mdi-phone"></i></a>}
                {wa && <a className="btn btn-xs btn-soft-success" href={wa} target="_blank" rel="noopener noreferrer" title="Escribir por WhatsApp"><i className="mdi mdi-whatsapp"></i></a>}
              </span>
            </>}
          </Field>
          <Field label="Correo">{current.email && <a href={`mailto:${current.email}`}>{current.email}</a>}</Field>
          <Field label="Tipo de reclamación">{CLAIM_TYPES[current.claim_type] ?? current.claim_type}</Field>
          <Field label="Bien contratado">{GOOD_TYPES[current.good_type] ?? current.good_type}</Field>
          <Field label="Detalle del producto o servicio" col="col-12">{current.product_detail}</Field>
          <Field label="Detalle del reclamo o queja" col="col-12">{current.claim_detail}</Field>
          <div className="col-12 mb-3">
            <small className="text-muted d-block">Adjunto</small>
            {Number(current.has_file)
              ? <a className="btn btn-sm btn-soft-primary" href={complaintsRest.fileUrl(current.id)}><i className="mdi mdi-download me-1"></i>Descargar adjunto</a>
              : <i className="text-muted">Sin adjunto</i>}
          </div>
        </div>
        <hr className="mt-0" />
        <div className="row">
          <VdSelect label="Estado" col="col-md-4" value={status} onChange={setStatus} options={statusOptions} />
          <div className="col-md-4 mb-2">
            <label className="form-label mb-1">Fecha de respuesta</label>
            <input type="date" className="form-control" value={respondedAt} onChange={(e) => setRespondedAt(e.target.value)} />
          </div>
          <div className="col-12">
            <label className="form-label mb-1">Respuesta / observación interna</label>
            <textarea className="form-control" rows={4} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Respuesta dada al consumidor u observaciones del equipo." maxLength={5000} />
          </div>
        </div>
        <small className="text-muted d-block mt-3">IP: {current.ip || '—'}{current.responded_at ? ` · Respondido el ${fmtDate(current.responded_at)}` : ''}</small>
      </>}
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('web-complaints') && !properties.hasRole('Admin') && !properties.hasRole('Root')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Libro de reclamaciones'>
    <WebComplaints {...properties} />
  </BaseAdminto>);
})
