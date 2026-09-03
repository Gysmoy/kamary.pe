import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import { PortalDropdown } from '../Components/Adminto/VdTable';
import KpiCard, { kpiBackground } from '@Adminto/KpiCard';
import PeriodFilter from '@Adminto/PeriodFilter';
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
  early: '#2f9e44',
  on_time: '#f2b705',
  late: '#f2760c',
}

const reasonColor = ['#1361b8', '#2f9e44', '#f2760c', '#7048e8', '#16b5c2', '#e8590c', '#c2255c', '#868e96']

const EmptyState = ({ text = 'Sin pedidos para el periodo y los filtros elegidos.' }) => (
  <div className='text-center text-muted py-4'>{text}</div>
)

/* Barra de filtros en una sola linea, con el boton Aplicar al final. */
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
}) => {
  const dateFieldLabel = dateFieldOptions.find(option => option.value === filters.date_field)?.label ?? 'Fecha'

  return (
    <div className='card mb-3'>
      <div className='card-body' style={{ padding: 14 }}>
        <div className='d-flex flex-wrap align-items-center' style={{ gap: 10 }}>
          <div style={{ flex: '1 1 210px', minWidth: 180 }}>
            <PortalDropdown
              options={dateFieldOptions}
              value={filters.date_field}
              placeholder={`Filtrar por: ${dateFieldLabel}`}
              menuWidth={260}
              bordered
              clearable={false}
              onChange={value => onChange('date_field', value || 'requested_at')}
            />
          </div>
          <div style={{ flex: '1 1 150px', minWidth: 140 }}>
            <PortalDropdown
              options={statusOptions}
              value={filters.order_status}
              placeholder='Estado'
              menuWidth={200}
              bordered
              onChange={value => onChange('order_status', value)}
            />
          </div>
          <div style={{ flex: '1 1 170px', minWidth: 150 }}>
            <PortalDropdown
              options={clientOptions}
              value={filters.client_name}
              placeholder='Cliente'
              menuWidth={320}
              bordered
              onChange={value => onChange('client_name', value)}
            />
          </div>
          <div style={{ flex: '1 1 210px', minWidth: 180 }}>
            <PortalDropdown
              options={delayReasonOptions}
              value={filters.delay_reason}
              placeholder='Motivo de retraso'
              menuWidth={320}
              bordered
              onChange={value => onChange('delay_reason', value)}
            />
          </div>
          <button type='button' className='btn btn-primary' onClick={onApply} disabled={loading}>
            {loading
              ? <><span className='spinner-border spinner-border-sm me-1'></span>Calculando…</>
              : 'Aplicar'}
          </button>
          <button type='button' className='btn btn-light' onClick={onReset} disabled={loading} title='Limpiar filtros'>
            <i className='ti ti-eraser'></i>
          </button>
        </div>
        <div className='form-check mt-2 mb-0'>
          <input
            type='checkbox'
            className='form-check-input'
            id='sample-dashboard-only-delayed'
            checked={filters.only_delayed}
            onChange={(e) => onChange('only_delayed', e.target.checked)}
          />
          <label className='form-check-label text-muted' htmlFor='sample-dashboard-only-delayed'>
            Mostrar solo los pedidos entregados con retraso
          </label>
        </div>
      </div>
    </div>
  )
}

const OrdersTable = ({ dashboard = {} }) => {
  const rows = dashboard.rows || []

  return (
    <div className='card mb-3'>
      <div className='card-body'>
        <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3'>
          <div>
            <h5 className='mb-0'>Trazabilidad de fechas</h5>
            <small className='text-muted'>
              {number(dashboard.totalRows)} pedidos{dashboard.rowsTruncated ? ' (se muestran los 500 más recientes)' : ''}
            </small>
          </div>
          <a href='/admin/sample-orders' className='btn btn-sm btn-outline-primary'>Ver pedidos</a>
        </div>
        <div className='table-responsive'>
          <table className='table table-sm table-hover align-middle mb-0'>
            <thead className='table-light'>
              <tr>
                <th>ID Pedido</th>
                <th>Fecha de Registro</th>
                <th>Fecha de Aprobación</th>
                <th>Fecha Solicitada de Entrega</th>
                <th>Fecha de Entrega</th>
                <th>Estado</th>
                <th className='text-end'>Diferencia de Días</th>
                <th>Motivos de Retraso</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8}><EmptyState /></td></tr>}
              {rows.map(row => (
                <tr key={`order-${row.id}`}>
                  <td className='text-nowrap'>
                    <a href='/admin/sample-orders' className='fw-semibold'>{row.orderNumber || `#${row.id}`}</a>
                    <div className='text-muted' style={{ fontSize: 11.5 }}>{row.clientName}</div>
                  </td>
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
                  <td style={{ minWidth: 170 }}>
                    {row.delayReasonLabel
                      ? (
                        <>
                          <div className={row.isDelayed ? '' : 'text-success'}>{row.delayReasonLabel}</div>
                          {row.delayReasonNotes && <small className='text-muted'>{row.delayReasonNotes}</small>}
                        </>
                      )
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
  const avg = Number(summary.avgDelayDays || 0)

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <h5 className='text-primary mb-3'>Diferencia de Días</h5>
        {!hasData ? <EmptyState text='Todavía no hay pedidos entregados en el periodo.' /> : (
          <div className='d-flex flex-wrap justify-content-center align-items-center' style={{ gap: 26 }}>
            <div
              className='rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center'
              style={{ width: 190, height: 190, background: donutBackground(buckets) }}
            >
              <div
                className='rounded-circle bg-body d-flex flex-column align-items-center justify-content-center text-center'
                style={{ width: 118, height: 118 }}
              >
                <h3 className='mb-0 text-danger'>+{number(avg, 1)}</h3>
                <small className='text-muted lh-sm' style={{ fontSize: 11 }}>
                  días promedio<br />de retraso
                </small>
              </div>
            </div>
            <div>
              {buckets.map(bucket => (
                <div key={`bucket-${bucket.key}`} className='d-flex align-items-center mb-3' style={{ gap: 8 }}>
                  <span
                    className='rounded-circle d-inline-block flex-shrink-0'
                    style={{ width: 11, height: 11, background: bucketColor[bucket.key] || '#adb5bd' }}
                  ></span>
                  <span style={{ minWidth: 78 }}>{bucket.label}</span>
                  <strong>{number(bucket.count)}</strong>
                  <span className='text-muted'>({pct(bucket.pct)})</span>
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
        <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3'>
          <h5 className='text-primary mb-0'>Motivos de Retraso</h5>
          {Number(summary.withoutReason || 0) > 0 && (
            <span className='badge badge-soft-warning'>{number(summary.withoutReason)} sin motivo</span>
          )}
        </div>
        {reasons.length === 0 ? <EmptyState text='Ningún pedido se entregó con retraso en el periodo.' /> : (
          <div className='d-flex align-items-end justify-content-around flex-nowrap overflow-auto' style={{ gap: 14, minHeight: 250 }}>
            {reasons.map((reason, index) => {
              const color = reasonColor[index % reasonColor.length]
              const height = Math.max(30, (Number(reason.count || 0) / max) * 170)

              return (
                <div
                  key={`reason-${reason.key}`}
                  className='d-flex flex-column align-items-center text-center'
                  style={{ flex: '1 0 96px', maxWidth: 130 }}
                  title={`${reason.label}: ${number(reason.count)} pedidos`}
                >
                  <div
                    className='w-100 rounded-top d-flex justify-content-center'
                    style={{ height, background: color, paddingTop: 8 }}
                  >
                    <strong style={{ color: '#fff', fontSize: 15 }}>{pct(reason.pct)}</strong>
                  </div>
                  <div className='border-top w-100 pt-2'>
                    <div className='small fw-semibold lh-sm'>{reason.label}</div>
                    <small className='text-muted'>{number(reason.count)} · {number(reason.avgDays, 1)} d prom.</small>
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

const SampleOrdersDashboard = ({
  initialFilters = {},
  initialDashboard = {},
  dateFieldOptions = [],
  statusOptions = [],
  clientOptions = [],
  delayReasonOptions = [],
  availableYears = [],
}) => {
  const [filters, setFilters] = useState(initialFilters)
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [loading, setLoading] = useState(false)

  const summary = dashboard.summary || {}

  const onChange = (field, value) => {
    const next = { ...filters, [field]: value }
    setFilters(next)
    load(next)
  }

  const load = async (nextFilters) => {
    setLoading(true)
    const data = await sampleOrdersRest.dashboard(nextFilters)
    if (data) {
      setFilters(data.filters)
      setDashboard(data.dashboard)
    }
    setLoading(false)
  }

  return (
    <>
      <PeriodFilter
        value={filters}
        years={availableYears}
        loading={loading}
        onChange={setFilters}
        onApply={(next) => load(next ?? filters)}
      />

      <div className='row'>
        <KpiCard
          label='Pedidos en Preparación'
          value={number(summary.preparing)}
          icon='ti ti-package'
          background={kpiBackground.blue}
        />
        <KpiCard
          label='Pedidos en Ruta'
          value={number(summary.inRoute)}
          icon='ti ti-truck-delivery'
          background={kpiBackground.lightBlue}
        />
        <KpiCard
          label='Pedidos Entregados'
          value={number(summary.delivered)}
          hint={`${pct(summary.onTimePct)} en fecha`}
          icon='ti ti-checkbox'
          background={kpiBackground.green}
        />
        <KpiCard
          label='Retrasos'
          value={number(summary.delayed)}
          hint={`${number(summary.avgDelayDays, 1)} días promedio`}
          icon='ti ti-clock-exclamation'
          background={kpiBackground.red}
        />
      </div>

      <FilterBar
        filters={filters}
        onChange={onChange}
        onApply={() => load(filters)}
        onReset={() => { setFilters(initialFilters); load(initialFilters) }}
        loading={loading}
        dateFieldOptions={dateFieldOptions}
        statusOptions={statusOptions}
        clientOptions={clientOptions}
        delayReasonOptions={delayReasonOptions}
      />

      <OrdersTable dashboard={dashboard} />

      <div className='row'>
        <div className='col-xl-6 mb-3'>
          <DiffDaysPanel buckets={dashboard.diffBuckets || []} summary={summary} />
        </div>
        <div className='col-xl-6 mb-3'>
          <DelayReasonsPanel reasons={dashboard.delayReasons || []} summary={summary} />
        </div>
      </div>
    </>
  )
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Dashboard de Pedidos'>
    <SampleOrdersDashboard {...properties} />
  </BaseAdminto>);
});
