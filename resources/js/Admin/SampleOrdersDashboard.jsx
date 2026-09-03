import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import SampleOrdersRest from '../Actions/Admin/SampleOrdersRest';

const sampleOrdersRest = new SampleOrdersRest()

const number = (value, digits = 0) => Number(value || 0).toLocaleString('es-PE', {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
})

const pct = (value) => `${number(value, 1)}%`

const date = (value) => {
  if (!value) return '—'
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('es-PE')
}

// Diferencia de dias con signo: positiva = se entrego despues de lo solicitado.
const diffLabel = (days) => {
  if (days === null || days === undefined) return '—'
  if (days === 0) return 'A tiempo'
  const abs = Math.abs(days)
  return `${days > 0 ? '+' : '−'}${number(abs)} ${abs === 1 ? 'día' : 'días'}`
}

const diffTone = (days) => {
  if (days === null || days === undefined) return 'secondary'
  if (days > 0) return 'danger'
  if (days < 0) return 'primary'
  return 'success'
}

const statusTone = {
  registered: 'warning',
  approved: 'success',
  preparing: 'warning',
  in_route: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

const bucketColor = {
  early: '#0d6efd',
  on_time: '#2f9e44',
  late: '#f76707',
}

const reasonColor = ['#0d6efd', '#2f9e44', '#f76707', '#7048e8', '#16b5c2', '#e8590c', '#868e96']

const EmptyState = ({ text = 'Sin pedidos para el periodo y los filtros elegidos.' }) => (
  <div className='text-center text-muted py-4'>{text}</div>
)

const SectionHeader = ({ title, meta = null, action = null }) => (
  <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3'>
    <div>
      <h5 className='mb-0'>{title}</h5>
      {meta && <small className='text-muted'>{meta}</small>}
    </div>
    {action}
  </div>
)

const MetricTile = ({ label, value, hint, icon, color = 'primary' }) => (
  <div className='col-sm-6 col-xl-3 mb-3'>
    <div className='card h-100 mb-0'>
      <div className='card-body'>
        <div className='d-flex justify-content-between align-items-start gap-2'>
          <div>
            <p className='text-muted mb-1'>{label}</p>
            <h3 className='mb-1'>{value}</h3>
            <small className='text-muted'>{hint}</small>
          </div>
          <div className={`avatar-sm bg-${color}-subtle rounded d-flex align-items-center justify-content-center flex-shrink-0`}>
            <i className={`${icon} fs-24 text-${color}`}></i>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const FilterBar = ({
  filters,
  onChange,
  onApply,
  onReset,
  loading,
  dateFieldOptions = [],
  statusOptions = [],
  clientOptions = [],
  delayReasonOptions = [],
}) => (
  <div className='card'>
    <div className='card-body'>
      <div className='row g-2 align-items-end'>
        <div className='col-md-6 col-xl-3'>
          <label className='form-label mb-1'>Filtrar por</label>
          <select
            className='form-select'
            value={filters.date_field}
            onChange={(e) => onChange('date_field', e.target.value)}
          >
            {dateFieldOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className='col-md-3 col-xl-2'>
          <label className='form-label mb-1'>Desde</label>
          <input
            type='date'
            className='form-control'
            value={filters.start}
            onChange={(e) => onChange('start', e.target.value)}
          />
        </div>
        <div className='col-md-3 col-xl-2'>
          <label className='form-label mb-1'>Hasta</label>
          <input
            type='date'
            className='form-control'
            value={filters.end}
            onChange={(e) => onChange('end', e.target.value)}
          />
        </div>
        <div className='col-md-4 col-xl-2'>
          <label className='form-label mb-1'>Estado</label>
          <select
            className='form-select'
            value={filters.order_status}
            onChange={(e) => onChange('order_status', e.target.value)}
          >
            <option value=''>Todos</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className='col-md-4 col-xl-3'>
          <label className='form-label mb-1'>Cliente</label>
          <select
            className='form-select'
            value={filters.client_name}
            onChange={(e) => onChange('client_name', e.target.value)}
          >
            <option value=''>Todos</option>
            {clientOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className='col-md-4 col-xl-3'>
          <label className='form-label mb-1'>Motivo de retraso</label>
          <select
            className='form-select'
            value={filters.delay_reason}
            onChange={(e) => onChange('delay_reason', e.target.value)}
          >
            <option value=''>Todos</option>
            {delayReasonOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className='col-md-5 col-xl-3'>
          <div className='form-check mt-2'>
            <input
              type='checkbox'
              className='form-check-input'
              id='sample-dashboard-only-delayed'
              checked={filters.only_delayed}
              onChange={(e) => onChange('only_delayed', e.target.checked)}
            />
            <label className='form-check-label' htmlFor='sample-dashboard-only-delayed'>
              Solo pedidos entregados con retraso
            </label>
          </div>
        </div>
        <div className='col-md-7 col-xl-6 d-flex justify-content-md-end gap-2'>
          <button type='button' className='btn btn-light' onClick={onReset} disabled={loading}>
            <i className='ti ti-eraser me-1'></i>Limpiar
          </button>
          <button type='button' className='btn btn-primary' onClick={onApply} disabled={loading}>
            {loading
              ? <><span className='spinner-border spinner-border-sm me-1'></span>Calculando…</>
              : <><i className='ti ti-filter me-1'></i>Aplicar</>}
          </button>
        </div>
      </div>
    </div>
  </div>
)

// Donut CSS: cada bucket ocupa su porcentaje del anillo.
const donutBackground = (buckets = []) => {
  let cursor = 0
  const segments = buckets
    .filter(bucket => Number(bucket.pct || 0) > 0)
    .map(bucket => {
      const start = cursor
      cursor += Number(bucket.pct || 0)
      return `${bucketColor[bucket.key] || '#adb5bd'} ${start}% ${cursor}%`
    })

  return segments.length ? `conic-gradient(${segments.join(', ')})` : '#eef2f7'
}

const DiffDaysPanel = ({ buckets = [], summary = {} }) => {
  const hasData = buckets.some(bucket => Number(bucket.count || 0) > 0)
  const avg = Number(summary.avgDiffDays || 0)

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <SectionHeader
          title='Diferencia de días'
          meta='Fecha de entrega contra fecha solicitada, sobre los pedidos ya entregados'
        />
        {!hasData ? <EmptyState text='Todavía no hay pedidos entregados en el periodo.' /> : (
          <div className='d-flex flex-wrap justify-content-center align-items-center gap-4'>
            <div
              className='rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center'
              style={{ width: 210, height: 210, background: donutBackground(buckets) }}
            >
              <div
                className='rounded-circle bg-body d-flex flex-column align-items-center justify-content-center text-center'
                style={{ width: 130, height: 130 }}
              >
                <h3 className={`mb-0 text-${diffTone(avg > 0 ? 1 : avg < 0 ? -1 : 0)}`}>
                  {avg > 0 ? '+' : avg < 0 ? '−' : ''}{number(Math.abs(avg), 1)}
                </h3>
                <small className='text-muted lh-sm'>días promedio<br />de diferencia</small>
              </div>
            </div>
            <div>
              {buckets.map(bucket => (
                <div key={`bucket-${bucket.key}`} className='mb-3'>
                  <div className='d-flex align-items-center gap-2'>
                    <span
                      className='rounded-circle d-inline-block flex-shrink-0'
                      style={{ width: 10, height: 10, background: bucketColor[bucket.key] || '#adb5bd' }}
                    ></span>
                    <span className='me-1'>{bucket.label}</span>
                    <strong>{number(bucket.count)}</strong>
                    <span className='text-muted'>({pct(bucket.pct)})</span>
                  </div>
                  <small className='text-muted ps-3'>{bucket.hint}</small>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className='row text-center border-top pt-3 mt-2'>
          <div className='col-4'>
            <div className='text-muted small'>Cumplimiento</div>
            <h5 className='mb-0'>{pct(summary.onTimePct)}</h5>
          </div>
          <div className='col-4'>
            <div className='text-muted small'>Retraso promedio</div>
            <h5 className='mb-0 text-danger'>{number(summary.avgDelayDays, 1)}</h5>
          </div>
          <div className='col-4'>
            <div className='text-muted small'>Retraso máximo</div>
            <h5 className='mb-0 text-danger'>{number(summary.maxDelayDays)}</h5>
          </div>
        </div>
      </div>
    </div>
  )
}

const DelayReasonsPanel = ({ reasons = [], summary = {} }) => {
  const max = Math.max(1, ...reasons.map(reason => Number(reason.count || 0)))

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <SectionHeader
          title='Motivos de retraso'
          meta={`${number(summary.delayed)} pedidos entregados después de lo solicitado`}
          action={Number(summary.withoutReason || 0) > 0
            ? <span className='badge badge-soft-warning'>{number(summary.withoutReason)} sin motivo</span>
            : null}
        />
        {reasons.length === 0 ? <EmptyState text='Ningún pedido se entregó con retraso en el periodo.' /> : (
          <div className='d-flex align-items-end gap-3 flex-wrap' style={{ minHeight: 220 }}>
            {reasons.map((reason, index) => {
              const color = reasonColor[index % reasonColor.length]
              const height = Math.max(16, (Number(reason.count || 0) / max) * 170)

              return (
                <div
                  key={`reason-${reason.key}`}
                  className='d-flex flex-column align-items-center text-center'
                  style={{ flex: '1 1 90px', minWidth: 90 }}
                >
                  <strong className='mb-1'>{pct(reason.pct)}</strong>
                  <div
                    className='w-100 rounded-top'
                    style={{ height, background: color }}
                    title={`${reason.label}: ${number(reason.count)} pedidos`}
                  ></div>
                  <div className='border-top w-100 pt-2 mt-0'>
                    <div className='small fw-semibold lh-sm'>{reason.label}</div>
                    <small className='text-muted'>
                      {number(reason.count)} · {number(reason.avgDays, 1)} d prom.
                    </small>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const StatusPanel = ({ rows = [] }) => (
  <div className='card h-100'>
    <div className='card-body'>
      <SectionHeader title='Estado del pedido' meta='Reparto de los pedidos del periodo' />
      {rows.length === 0 ? <EmptyState /> : rows.map(row => (
        <div key={`status-${row.status}`} className='mb-3'>
          <div className='d-flex justify-content-between mb-1'>
            <span>{row.label}</span>
            <span>{number(row.count)} <span className='text-muted'>({pct(row.pct)})</span></span>
          </div>
          <div className='progress' style={{ height: 6 }}>
            <div
              className={`progress-bar bg-${statusTone[row.status] || 'secondary'}`}
              style={{ width: `${Math.max(0, Math.min(100, Number(row.pct || 0)))}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const OrdersTable = ({ dashboard = {} }) => {
  const rows = dashboard.rows || []

  return (
    <div className='card'>
      <div className='card-body'>
        <SectionHeader
          title='Trazabilidad de fechas'
          meta={`${number(dashboard.totalRows)} pedidos${dashboard.rowsTruncated ? ' (se muestran los 500 más recientes)' : ''}`}
          action={<a href='/admin/sample-orders' className='btn btn-sm btn-outline-primary'>Ver pedidos</a>}
        />
        <div className='table-responsive'>
          <table className='table table-sm table-hover align-middle mb-0'>
            <thead className='table-light'>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>F. registro</th>
                <th>F. aprobación</th>
                <th>F. solicitada</th>
                <th>F. entrega</th>
                <th>Estado</th>
                <th className='text-end'>Diferencia</th>
                <th>Motivo de retraso</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9}><EmptyState /></td></tr>
              )}
              {rows.map(row => (
                <tr key={`order-${row.id}`}>
                  <td className='fw-semibold text-nowrap'>{row.orderNumber || `#${row.id}`}</td>
                  <td>{row.clientName || '—'}</td>
                  <td className='text-nowrap'>{date(row.registeredAt)}</td>
                  <td className='text-nowrap'>{date(row.approvedAt)}</td>
                  <td className='text-nowrap'>{date(row.requestedAt)}</td>
                  <td className='text-nowrap'>{date(row.deliveredAt)}</td>
                  <td>
                    <span className={`badge badge-soft-${statusTone[row.orderStatus] || 'secondary'}`}>
                      {row.orderStatusLabel}
                    </span>
                  </td>
                  <td className={`text-end text-nowrap fw-semibold text-${diffTone(row.diffDays)}`}>
                    {diffLabel(row.diffDays)}
                  </td>
                  <td>
                    {row.isDelayed
                      ? <>
                        <div>{row.delayReasonLabel}</div>
                        {row.delayReasonNotes && <small className='text-muted'>{row.delayReasonNotes}</small>}
                      </>
                      : <span className='text-muted'>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const SampleOrdersDashboard = ({
  initialFilters = {},
  initialDashboard = {},
  dateFieldOptions = [],
  statusOptions = [],
  clientOptions = [],
  delayReasonOptions = [],
}) => {
  const [filters, setFilters] = useState(initialFilters)
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [loading, setLoading] = useState(false)

  const summary = dashboard.summary || {}
  const period = dashboard.period || {}

  const periodMeta = useMemo(() => (
    `${period.dateFieldLabel || 'Periodo'}: ${date(period.start)} — ${date(period.end)}`
  ), [period.dateFieldLabel, period.start, period.end])

  const onChange = (field, value) => setFilters(current => ({ ...current, [field]: value }))

  const load = async (nextFilters) => {
    setLoading(true)
    const data = await sampleOrdersRest.dashboard(nextFilters)
    if (data) {
      setFilters(data.filters)
      setDashboard(data.dashboard)
    }
    setLoading(false)
  }

  const onApply = () => load(filters)

  const onReset = () => {
    setFilters(initialFilters)
    load(initialFilters)
  }

  return (
    <>
      <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3'>
        <div>
          <h4 className='mb-0'>Dashboard de pedidos de muestra</h4>
          <small className='text-muted'>{periodMeta}</small>
        </div>
      </div>

      <div className='row'>
        <div className='col-12 mb-3'>
          <FilterBar
            filters={filters}
            onChange={onChange}
            onApply={onApply}
            onReset={onReset}
            loading={loading}
            dateFieldOptions={dateFieldOptions}
            statusOptions={statusOptions}
            clientOptions={clientOptions}
            delayReasonOptions={delayReasonOptions}
          />
        </div>

        <MetricTile
          label='Pedidos en preparación'
          value={number(summary.preparing)}
          hint={`${number(summary.total)} pedidos en el periodo`}
          icon='ti ti-package'
          color='warning'
        />
        <MetricTile
          label='Pedidos en ruta'
          value={number(summary.inRoute)}
          hint='Salieron a reparto y siguen abiertos'
          icon='ti ti-truck-delivery'
          color='info'
        />
        <MetricTile
          label='Pedidos entregados'
          value={number(summary.delivered)}
          hint={`${pct(summary.onTimePct)} cumplió la fecha solicitada`}
          icon='ti ti-checkbox'
          color='success'
        />
        <MetricTile
          label='Retrasos'
          value={number(summary.delayed)}
          hint={`${number(summary.avgDelayDays, 1)} días de retraso promedio`}
          icon='ti ti-clock-exclamation'
          color='danger'
        />

        <div className='col-xl-7 mb-3'>
          <DiffDaysPanel buckets={dashboard.diffBuckets || []} summary={summary} />
        </div>
        <div className='col-xl-5 mb-3'>
          <StatusPanel rows={dashboard.statusBreakdown || []} />
        </div>
        <div className='col-12 mb-3'>
          <DelayReasonsPanel reasons={dashboard.delayReasons || []} summary={summary} />
        </div>
        <div className='col-12 mb-3'>
          <OrdersTable dashboard={dashboard} />
        </div>
      </div>
    </>
  )
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Muestras - Dashboard'>
    <SampleOrdersDashboard {...properties} />
  </BaseAdminto>);
});
