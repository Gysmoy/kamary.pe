import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Swal from 'sweetalert2';
import CommercialOrdersRest from '../Actions/Admin/CommercialOrdersRest';
import SampleOrdersRest from '../Actions/Admin/SampleOrdersRest';
import '../../css/vdtable.css';

const commercialOrdersRest = new CommercialOrdersRest()
const sampleOrdersRest = new SampleOrdersRest()

const boardStatuses = [
  {
    value: 'pending',
    title: 'En cola',
    description: 'Pedido en cola para ser preparado.',
    accent: '#0acf97',
    action: 'Preparar',
    icon: 'mdi mdi-play',
    nextStatus: 'preparing',
  },
  {
    value: 'preparing',
    title: 'Preparando',
    description: 'Pedido en preparacion.',
    accent: '#f9bc0b',
    action: 'Listo',
    icon: 'mdi mdi-check',
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
  const compact = status.value === 'pending'
  const isSampleOrder = order?.source_type === 'sample'
  const warehouseName = order?.warehouse?.name ?? order?.items?.find?.(item => item?.warehouse)?.warehouse ?? '-'
  const contact = [order.dispatch_contact_name, order.dispatch_contact_phone].filter(Boolean).join(' · ')

  return (
    <article
      className={`vdt-card preparation-card ${isUpdating ? 'is-updating' : ''}`}
      draggable={!isUpdating}
      onDragStart={(event) => onDragStart(event, order)}
    >
      <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div className='d-flex align-items-center flex-wrap' style={{ gap: 6 }}>
            <span className='fw-semibold' style={{ color: 'var(--vd-ink)' }}>{order.code ?? order.order_number ?? `Pedido ${order.id}`}</span>
            {isSampleOrder && <span className='badge badge-soft-info'>Muestras</span>}
          </div>
          <small className='text-muted'><i className='mdi mdi-calendar-blank-outline me-1'></i>{formatDate(order.promised_delivery_at || order.issue_date) || 'Sin fecha'}</small>
        </div>
        <button
          type='button'
          className='vdt-btn-pri preparation-action'
          disabled={isUpdating}
          onClick={() => onMove(order, status.nextStatus)}
        >
          {isUpdating ? <i className='mdi mdi-loading mdi-spin'></i> : <><i className={status.icon}></i> {status.action}</>}
        </button>
      </div>

      <div className='preparation-meta'>
        <div className='text-truncate' title={customerName(order)}><i className='mdi mdi-account-outline'></i>{customerName(order)}</div>
        <div className='text-truncate'><i className='mdi mdi-warehouse'></i>{warehouseName}</div>
        {!compact && <div className='text-truncate' title={textValue(order.delivery_address, '')}><i className='mdi mdi-map-marker-outline'></i>{textValue(order.delivery_address, '-')}</div>}
        {!compact && contact && <div className='text-truncate'><i className='mdi mdi-phone-outline'></i>{contact}</div>}
      </div>

      {!compact && (
        <div className='d-flex flex-wrap mt-2' style={{ gap: 6 }}>
          <span className='badge badge-soft-secondary'>{order.document_type ?? 'Sin documento'}</span>
          <span className='badge badge-soft-secondary'>Total {Number(order.total || order.total_gross_weight || 0).toFixed(2)}</span>
        </div>
      )}

      <div className='preparation-items'>
        {items.length === 0 && <div className='preparation-item text-muted'>Sin detalle</div>}
        {items.map((item) => (
          <div className='preparation-item' key={`preparation-order-${order.source_type ?? 'commercial'}-${order.id}-item-${item.id ?? item.stock_key ?? item.code ?? item.name}`}>
            <div style={{ minWidth: 0 }}>
              <div className='text-truncate' title={itemName(item)}>{itemName(item)}</div>
              {itemPresentation(item) && <small className='text-muted'>{itemPresentation(item)}</small>}
            </div>
            <span className='preparation-qty'>x{itemQuantity(item)}</span>
          </div>
        ))}
      </div>

      {status.value === 'preparing' && !isSampleOrder && (
        <div className='mt-2 pt-2' style={{ borderTop: '1px solid #f1f1f6' }}>
          <button
            type='button'
            className='vdt-btn-soft'
            style={{ height: 32 }}
            disabled={isUpdating}
            onClick={() => onMove(order, 'pending')}
          >
            <i className='mdi mdi-undo'></i> Regresar a cola
          </button>
        </div>
      )}
    </article>
  )
}

const PreparationColumn = ({ status, orders, onMove, updatingId, onDropOrder, onDragStart, hiddenOnMobile }) => (
  <section
    className={`preparation-column ${hiddenOnMobile ? 'd-none d-lg-flex' : 'd-flex'}`}
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => onDropOrder(event, status.value)}
  >
    <div className='preparation-column-header'>
      <div className='d-flex align-items-center' style={{ gap: 8 }}>
        <span className='preparation-dot' style={{ background: status.accent }}></span>
        <div>
          <div className='fw-semibold' style={{ color: 'var(--vd-ink)' }}>{status.title}</div>
          <small className='text-muted'>{status.description}</small>
        </div>
      </div>
      <span className='preparation-count'>{orders.length}</span>
    </div>

    <div className='preparation-list'>
      {orders.length === 0 && <p className='vdt-empty mb-0'>No hay pedidos en este estado.</p>}
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
  const [search, setSearch] = useState('')
  const [mobileStatus, setMobileStatus] = useState('pending')

  const groupedOrders = useMemo(() => {
    // Busqueda local por codigo, cliente, almacen o producto
    const needle = search.trim().toLowerCase()
    const matches = (order) => !needle || [
      order.code, order.order_number, customerName(order), order?.warehouse?.name,
      ...(order.items ?? []).map(itemName),
    ].filter(Boolean).some(value => `${value}`.toLowerCase().includes(needle))
    return boardStatuses.reduce((carry, status) => ({
      ...carry,
      [status.value]: orders.filter((order) => order.dispatch_status === status.value && matches(order)),
    }), {})
  }, [orders, search])

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

  const totalOrders = boardStatuses.reduce((sum, status) => sum + (groupedOrders[status.value]?.length ?? 0), 0)

  return (
    <>
      <style>{`
        .preparation-board {
          display: grid;
          gap: 16px;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.4fr);
          margin-top: 16px;
        }
        .preparation-column {
          background: #f8f9fb;
          border: 1px solid #eeeef4;
          border-radius: 14px;
          flex-direction: column;
          min-width: 0;
          padding: 12px;
        }
        .preparation-column-header {
          align-items: center;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .preparation-dot { border-radius: 50%; flex-shrink: 0; height: 10px; width: 10px; }
        .preparation-count {
          background: #fff;
          border: 1px solid #eeeef4;
          border-radius: 999px;
          color: var(--vd-ink);
          font-size: 12px;
          font-weight: 700;
          min-width: 32px;
          padding: 3px 10px;
          text-align: center;
        }
        .preparation-list { display: grid; gap: 10px; }
        .preparation-card { cursor: grab; }
        .preparation-card.is-updating { opacity: .6; pointer-events: none; }
        .preparation-action { height: 34px; padding: 0 12px; flex-shrink: 0; }
        .preparation-meta { color: #6b6b7b; display: grid; font-size: 12.5px; gap: 3px; margin-top: 10px; }
        .preparation-meta i { color: #b6b6c2; margin-right: 6px; }
        .preparation-items { margin-top: 10px; }
        .preparation-item {
          align-items: center;
          border-top: 1px solid #f1f1f6;
          display: flex;
          font-size: 13px;
          gap: 10px;
          justify-content: space-between;
          padding: 6px 0;
        }
        .preparation-item:first-child { border-top: 0; }
        .preparation-qty {
          background: var(--vd-secondary-soft);
          border-radius: 8px;
          color: var(--vd-secondary);
          flex-shrink: 0;
          font-weight: 700;
          padding: 2px 8px;
        }
        .preparation-tabs { display: none; }
        @media (max-width: 991.98px) {
          .preparation-board { grid-template-columns: 1fr; }
          .preparation-tabs { display: flex; }
        }
      `}</style>
      <div className='vd-card vd-panel vd-fade-up' style={{ padding: 16 }}>
        <div className='d-flex align-items-center justify-content-between flex-wrap' style={{ gap: 12 }}>
          <div className='d-flex align-items-center' style={{ gap: 12 }}>
            <span className='vdt-chip'><i className='mdi mdi-package-variant-closed'></i></span>
            <div>
              <h4 className='mb-0' style={{ fontSize: 16, fontWeight: 700, color: 'var(--vd-ink)' }}>Picking</h4>
              <small style={{ color: 'var(--vd-muted)' }}>{totalOrders} pedidos por preparar</small>
            </div>
          </div>
          <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Actualizar' onClick={loadOrders} disabled={loading}>
            <i className={`mdi mdi-refresh ${loading ? 'mdi-spin' : ''}`}></i>
          </button>
        </div>

        <div className='d-flex align-items-center flex-wrap mt-3' style={{ gap: 8 }}>
          <div className='position-relative' style={{ flex: '1 1 260px', maxWidth: 420 }}>
            <i className='mdi mdi-magnify vdt-search-ico'></i>
            <input className='vdt-search' placeholder='Buscar por pedido, cliente o producto…' value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className='preparation-tabs flex-wrap' style={{ gap: 8 }}>
            {boardStatuses.map((status) => (
              <button
                key={`preparation-tab-${status.value}`}
                type='button'
                className={mobileStatus === status.value ? 'vdt-btn-acc' : 'vdt-btn-soft'}
                onClick={() => setMobileStatus(status.value)}
              >
                {status.title} <span className='badge bg-white text-dark ms-1'>{groupedOrders[status.value]?.length ?? 0}</span>
              </button>
            ))}
          </div>
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
              hiddenOnMobile={mobileStatus !== status.value}
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
