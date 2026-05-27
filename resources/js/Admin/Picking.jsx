import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Swal from 'sweetalert2';
import CommercialOrdersRest from '../Actions/Admin/CommercialOrdersRest';
import SampleOrdersRest from '../Actions/Admin/SampleOrdersRest';

const commercialOrdersRest = new CommercialOrdersRest()
const sampleOrdersRest = new SampleOrdersRest()

const boardStatuses = [
  {
    value: 'pending',
    title: 'En cola',
    description: 'Pedido en cola para ser preparado.',
    accent: '#0acf97',
    action: 'Preparar',
    nextStatus: 'preparing',
  },
  {
    value: 'preparing',
    title: 'Preparando',
    description: 'Pedido en preparacion.',
    accent: '#f9bc0b',
    action: 'Listo',
    nextStatus: 'dispatched',
  },
]

const basePreparationFilter = [
  ['order_status', '<>', 'draft'],
  'and',
  ['order_status', '<>', 'cancelled'],
  'and',
  [
    ['dispatch_status', '=', 'pending'],
    'or',
    ['dispatch_status', '=', 'preparing'],
  ],
]

const customerName = (data) => data?.client?.full_name
  ?? data?.eventual_client?.business_name
  ?? data?.eventualClient?.business_name
  ?? data?.client_name
  ?? '-'

const textValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value.address ?? value.reference ?? value.name ?? value.description ?? fallback
  const text = `${value}`.trim()
  return text === '[object Object]' ? fallback : text
}

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return `${value}`.slice(0, 10)
  return date.toLocaleDateString('es-PE')
}

const itemName = (item) => item?.article?.name || item?.description || item?.item_name || 'Articulo'
const itemPresentation = (item) => item?.presentation?.name || item?.presentation_name || item?.article?.unit?.symbol || ''
const itemQuantity = (item) => {
  const quantity = Number(item?.quantity || 0)
  return Number.isInteger(quantity) ? quantity.toFixed(0) : quantity.toFixed(2)
}
const orderKey = (order) => `${order?.source_type ?? 'commercial'}:${order?.id ?? ''}`

const PreparationCard = ({ order, status, onMove, updatingId, onDragStart }) => {
  const items = order?.items ?? []
  const isUpdating = `${updatingId ?? ''}` === orderKey(order)
  const compact = status === 'pending'
  const isSampleOrder = order?.source_type === 'sample'
  const warehouseName = order?.warehouse?.name ?? order?.items?.find?.(item => item?.warehouse)?.warehouse ?? '-'

  return (
    <article
      className={`preparation-card ${isUpdating ? 'is-updating' : ''}`}
      draggable={!isUpdating}
      onDragStart={(event) => onDragStart(event, order)}
    >
      <div className='preparation-card-header'>
        <div className='preparation-code'>
          <strong>{order.code ?? order.order_number ?? `Pedido ${order.id}`}</strong>
          {isSampleOrder && <small className='preparation-source'>Muestras</small>}
          <span>{formatDate(order.promised_delivery_at || order.issue_date)}</span>
        </div>
        <button
          type='button'
          className='btn btn-sm btn-primary'
          disabled={isUpdating}
          onClick={() => onMove(order, status.nextStatus)}
        >
          {isUpdating ? '...' : status.action}
        </button>
      </div>

      <div className='preparation-meta'>
        <div><span>Cliente:</span> {customerName(order)}</div>
        <div><span>Almacen:</span> {warehouseName}</div>
        {!compact && <div><span>Direccion:</span> {textValue(order.delivery_address, '-')}</div>}
        {!compact && <div><span>Contacto:</span> {[order.dispatch_contact_name, order.dispatch_contact_phone].filter(Boolean).join(' | ') || '-'}</div>}
      </div>

      {!compact && (
        <div className='preparation-detail'>
          <div>
            <span>Documento:</span> {order.document_type ?? '-'}
          </div>
          <div>
            <span>Entrega:</span> {formatDate(order.promised_delivery_at || order.delivered_at) || '-'}
          </div>
          <div>
            <span>Total:</span> {Number(order.total || order.total_gross_weight || 0).toFixed(2)}
          </div>
        </div>
      )}

      <div className='preparation-items'>
        {items.length === 0 && <div className='preparation-item muted'>Sin detalle</div>}
        {items.map((item) => (
          <div className='preparation-item' key={`preparation-order-${order.source_type ?? 'commercial'}-${order.id}-item-${item.id ?? item.stock_key ?? item.code ?? item.name}`}>
            <div>
              <strong>{itemName(item)}</strong>
              {itemPresentation(item) && <small>{itemPresentation(item)}</small>}
            </div>
            <strong>x{itemQuantity(item)}</strong>
          </div>
        ))}
      </div>

      {status.value === 'preparing' && !isSampleOrder && (
        <div className='preparation-card-footer'>
          <button
            type='button'
            className='btn btn-xs btn-outline-secondary'
            disabled={isUpdating}
            onClick={() => onMove(order, 'pending')}
          >
            Regresar a cola
          </button>
        </div>
      )}
    </article>
  )
}

const PreparationColumn = ({ status, orders, onMove, updatingId, onDropOrder, onDragStart }) => (
  <section
    className='preparation-column'
    style={{ '--preparation-accent': status.accent }}
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => onDropOrder(event, status.value)}
  >
    <div className='preparation-column-header'>
      <div>
        <h4>{status.title}</h4>
        <p>{status.description}</p>
      </div>
      <span>{orders.length} pedidos</span>
    </div>

    <div className='preparation-list'>
      {orders.length === 0 && <div className='preparation-empty'>No hay pedidos en este estado.</div>}
      {orders.map((order) => (
        <PreparationCard
          key={`preparation-order-${order.source_type ?? 'commercial'}-${order.id}`}
          order={order}
          status={status}
          onMove={onMove}
          updatingId={updatingId}
          onDragStart={onDragStart}
        />
      ))}
    </div>
  </section>
)

const Picking = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  const groupedOrders = useMemo(() => (
    boardStatuses.reduce((carry, status) => ({
      ...carry,
      [status.value]: orders.filter((order) => order.dispatch_status === status.value),
    }), {})
  ), [orders])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const [commercialResult, sampleResult] = await Promise.all([
        commercialOrdersRest.paginate({
          take: 1000,
          skip: 0,
          isLoadingAll: true,
          filter: basePreparationFilter,
          sort: [{ selector: 'promised_delivery_at', desc: false }],
        }),
        sampleOrdersRest.paginate({
          take: 1000,
          skip: 0,
          isLoadingAll: true,
          filter: ['order_status', '=', 'preparing'],
          sort: [{ selector: 'delivered_at', desc: false }],
        }),
      ])
      const commercialRows = (commercialResult?.data ?? []).map(order => ({ ...order, source_type: 'commercial' }))
      const sampleRows = (sampleResult?.data ?? []).map(order => ({
        ...order,
        source_type: 'sample',
        dispatch_status: 'preparing',
        code: order.order_number,
        promised_delivery_at: order.delivered_at,
        dispatch_contact_name: order.contact_name,
        dispatch_contact_phone: order.contact_phone,
      }))

      setOrders([...commercialRows, ...sampleRows])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  const moveOrder = async (order, nextStatus) => {
    if (!order?.id || order.dispatch_status === nextStatus || updatingId) return
    setUpdatingId(orderKey(order))
    const previousOrders = orders
    const leavesBoard = nextStatus === 'dispatched' || (order.source_type === 'sample' && nextStatus === 'pending')
    const nextOrders = leavesBoard
      ? orders.filter((item) => `${item.id}` !== `${order.id}`)
      : orders.map((item) => `${item.id}` === `${order.id}` ? { ...item, dispatch_status: nextStatus } : item)
    setOrders(nextOrders)

    const result = order.source_type === 'sample'
      ? await sampleOrdersRest.booleanResult({
        id: order.id,
        field: 'order_status',
        value: nextStatus === 'dispatched' ? 'in_route' : nextStatus === 'pending' ? 'approved' : nextStatus,
      })
      : await commercialOrdersRest.booleanResult({
        id: order.id,
        field: 'dispatch_status',
        value: nextStatus,
      })

    if (!result?.ok) {
      setOrders(previousOrders)
      Swal.fire(
        nextStatus === 'dispatched' ? 'Stock insuficiente' : 'No se pudo mover',
        result?.message || 'El estado del pedido no se actualizo.',
        'error'
      )
    } else {
      await loadOrders()
    }
    setUpdatingId(null)
  }

  const onDragStart = (event, order) => {
    event.dataTransfer.setData('text/plain', JSON.stringify({ id: order.id, source_type: order.source_type ?? 'commercial' }))
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDropOrder = (event, nextStatus) => {
    event.preventDefault()
    const raw = event.dataTransfer.getData('text/plain')
    let payload = { id: raw, source_type: 'commercial' }
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = { id: raw, source_type: 'commercial' }
    }
    const order = orders.find((item) => `${item.id}` === `${payload.id}` && `${item.source_type ?? 'commercial'}` === `${payload.source_type ?? 'commercial'}`)
    if (!order) return
    moveOrder(order, nextStatus)
  }

  return (
    <>
      <style>{`
        .preparation-page {
          min-height: calc(100vh - 175px);
        }
        .preparation-toolbar {
          align-items: center;
          display: flex;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .preparation-toolbar h3 {
          color: #263238;
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
        }
        .preparation-board {
          display: grid;
          gap: 22px;
          grid-template-columns: minmax(320px, 0.95fr) minmax(420px, 1.55fr);
        }
        .preparation-column {
          border-left: 4px solid var(--preparation-accent);
          min-width: 0;
          padding-left: 10px;
        }
        .preparation-column-header {
          align-items: start;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .preparation-column-header h4 {
          color: #263238;
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
        }
        .preparation-column-header p {
          color: #6c7a86;
          margin: 2px 0 0;
        }
        .preparation-column-header span {
          color: #98a6ad;
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .preparation-list {
          display: grid;
          gap: 8px;
        }
        .preparation-card {
          background: #fff;
          border: 1px solid #edf1f4;
          border-radius: 5px;
          box-shadow: 0 1px 2px rgba(31, 45, 61, 0.04);
          cursor: grab;
          padding: 13px 14px;
        }
        .preparation-card.is-updating {
          opacity: 0.65;
          pointer-events: none;
        }
        .preparation-card-header {
          align-items: start;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .preparation-code {
          align-items: baseline;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          min-width: 0;
        }
        .preparation-code strong {
          color: #313a46;
          font-size: 0.98rem;
        }
        .preparation-code span {
          color: #98a6ad;
          font-size: 0.82rem;
        }
        .preparation-source {
          background: #e8f3ff;
          border: 1px solid #b8dcff;
          border-radius: 999px;
          color: #1473c9;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 1px 7px;
        }
        .preparation-meta {
          color: #6c7a86;
          display: grid;
          gap: 3px;
          margin-bottom: 12px;
        }
        .preparation-meta span,
        .preparation-detail span {
          color: #98a6ad;
          font-weight: 600;
        }
        .preparation-detail {
          border: 1px solid #dfe6ed;
          border-radius: 4px;
          color: #6c7a86;
          display: grid;
          gap: 4px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 8px;
          padding: 10px 12px;
        }
        .preparation-items {
          display: grid;
        }
        .preparation-item {
          align-items: center;
          border-top: 1px solid #eef2f5;
          color: #313a46;
          display: flex;
          gap: 10px;
          justify-content: space-between;
          min-height: 32px;
        }
        .preparation-item:first-child {
          border-top: 0;
        }
        .preparation-item strong {
          font-size: 0.95rem;
        }
        .preparation-item small {
          color: #98a6ad;
          display: block;
          font-size: 0.78rem;
        }
        .preparation-item.muted {
          color: #98a6ad;
        }
        .preparation-card-footer {
          margin-top: 10px;
        }
        .preparation-empty {
          background: rgba(255, 255, 255, 0.65);
          border: 1px dashed #cfd8df;
          border-radius: 5px;
          color: #7f8c96;
          padding: 18px;
          text-align: center;
        }
        @media (max-width: 991.98px) {
          .preparation-board {
            grid-template-columns: 1fr;
          }
          .preparation-detail {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className='preparation-page'>
        <div className='preparation-toolbar'>
          <h3>Preparacion</h3>
          <button type='button' className='btn btn-sm btn-outline-primary' onClick={loadOrders} disabled={loading}>
            <i className='mdi mdi-refresh me-1'></i>{loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        <div className='preparation-board'>
          {boardStatuses.map((status) => (
            <PreparationColumn
              key={`preparation-column-${status.value}`}
              status={status}
              orders={groupedOrders[status.value] ?? []}
              onMove={moveOrder}
              updatingId={updatingId}
              onDropOrder={onDropOrder}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      </div>
    </>
  )
}

CreateReactScript((el, properties) => {
  if (!properties.can('dispatch') && !properties.hasRole('Admin')) {
    location.href = '/admin/'
    return
  }
  createRoot(el).render(<BaseAdminto {...properties} title='Preparacion'><Picking {...properties} /></BaseAdminto>)
})
