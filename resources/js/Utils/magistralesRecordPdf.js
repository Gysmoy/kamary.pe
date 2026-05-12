import { toast } from 'sonner'
import {
  getActivityStatusLabel,
  getActivityTypeLabel,
  getApprovalStatusLabel,
  getBillingStatusLabel,
  getDispatchStatusLabel,
  getOperationalOrderStatusLabel,
  getPaymentStatusLabel,
  getPurchaseOrderStatusLabel,
  getPurchaseReceiptStatusLabel,
  getServiceOrderStatusLabel,
  getSourceTypeLabel,
  translateStatusText,
} from './statusLabels'

const asText = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback
  return `${value}`
}

const asMoney = (value, currency = 'PEN') => {
  const amount = Number(value || 0).toFixed(2)
  return `${currency} ${amount}`
}

const asNumber = (value, decimals = 3) => Number(value || 0).toFixed(decimals)

const asDate = (value) => {
  if (!value) return '-'
  const text = `${value}`
  return text.includes('T') ? text.slice(0, 10) : text.slice(0, 10)
}

const joinText = (...values) => values.flat().filter(value => value !== null && value !== undefined && value !== '').join(' ')

const asClientText = (value, fallback = '-') => translateStatusText(value, fallback)

const customerName = (data) => (
  nested(data, 'client.full_name')
  || nested(data, 'eventual_client.business_name')
  || nested(data, 'eventualClient.business_name')
  || data?.customer_name
)

const nested = (source, path, fallback = '') => {
  const value = path.split('.').reduce((current, key) => current?.[key], source)
  return value ?? fallback
}

const PDF_MODAL_ID = 'magistrales-record-pdf-modal'
const PDF_IFRAME_ID = 'magistrales-record-pdf-frame'
let currentPdfBlobUrl = null

const ensurePdf = () => {
  const JsPDF = window.jspdf?.jsPDF || window.jsPDF
  if (!JsPDF) throw new Error('jsPDF no esta disponible')
  const doc = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  if (!doc.autoTable) throw new Error('AutoTable no esta disponible')
  return doc
}

const withPdfViewerOptions = (blobUrl) => [
  blobUrl,
  '#toolbar=1',
  '&navpanes=0',
  '&pagemode=none',
  '&scrollbar=1',
  '&zoom=75',
].join('')

const ensurePdfModal = () => {
  let modal = document.getElementById(PDF_MODAL_ID)
  if (modal) return modal

  modal = document.createElement('div')
  modal.id = PDF_MODAL_ID
  modal.className = 'modal fade'
  modal.tabIndex = -1
  modal.setAttribute('aria-hidden', 'true')
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered" style="width: 1040px; max-width: calc(100vw - 64px);">
      <div class="modal-content" style="height: min(760px, calc(100vh - 80px));">
        <div class="modal-header py-2">
          <h4 class="modal-title mb-0" data-pdf-title>PDF</h4>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body p-0" style="height: calc(100% - 53px); overflow: hidden; background: #525659;">
          <iframe
            id="${PDF_IFRAME_ID}"
            title="Vista previa PDF"
            style="width: 100%; height: 100%; border: 0; display: block;"
            allow="fullscreen"
          ></iframe>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  $(modal).on('hidden.bs.modal', () => {
    const iframe = document.getElementById(PDF_IFRAME_ID)
    if (iframe) iframe.removeAttribute('src')
    if (!currentPdfBlobUrl) return
    URL.revokeObjectURL(currentPdfBlobUrl)
    currentPdfBlobUrl = null
  })

  return modal
}

const showPdfInModal = (doc, document) => {
  const modal = ensurePdfModal()
  const iframe = modal.querySelector(`#${PDF_IFRAME_ID}`)
  const title = modal.querySelector('[data-pdf-title]')

  if (!iframe) throw new Error('No se encontro el visor PDF')
  if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl)

  currentPdfBlobUrl = URL.createObjectURL(doc.output('blob'))
  title.textContent = `${document.title}${document.code ? ` - ${document.code}` : ''}`
  iframe.src = withPdfViewerOptions(currentPdfBlobUrl)
  $(modal).modal('show')
}

export const buildMagistralesRows = {
  purchaseOrder: (data) => ({
    title: data?.module_scope === 'magistrales' ? 'Orden de compra magistral' : 'Orden de compra',
    code: data?.code,
    filename: `orden-compra-${data?.code || data?.id}`,
    meta: [
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Proveedor', nested(data, 'supplier.business_name')],
      ['Comprador', data?.buyer_name],
      ['Emision', asDate(data?.issue_date)],
      ['Fecha esperada', asDate(data?.expected_date)],
      ['Pago', data?.payment_condition],
      ['Aprobacion', getApprovalStatusLabel(data?.approval_status)],
      ['Estado OC', getPurchaseOrderStatusLabel(data?.order_status)],
      ['Moneda', data?.currency],
    ],
    columns: ['Codigo', 'Articulo', 'Solicitada', 'Recibida', 'P. unit.', 'Total'],
    rows: (data?.items ?? []).map(item => [
      nested(item, 'article.code'),
      nested(item, 'article.name', 'Articulo'),
      asNumber(item?.requested_quantity),
      asNumber(item?.received_quantity),
      asMoney(item?.price_unit, data?.currency || 'PEN'),
      asMoney(item?.total, data?.currency || 'PEN'),
    ]),
    totals: [
      ['Subtotal', asMoney(data?.subtotal, data?.currency || 'PEN')],
      ['Impuesto', asMoney(data?.tax_amount, data?.currency || 'PEN')],
      ['Total', asMoney(data?.total, data?.currency || 'PEN')],
    ],
    observations: data?.observations,
  }),
  purchaseReceipt: (data) => ({
    title: 'Recepcion de compra',
    code: data?.code,
    filename: `recepcion-compra-${data?.code || data?.id}`,
    meta: [
      ['Orden compra', nested(data, 'purchaseOrder.code')],
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Proveedor', nested(data, 'supplier.business_name')],
      ['Documento', [data?.document_type, data?.document_series, data?.document_sequence].filter(Boolean).join(' ')],
      ['Guia', [data?.guide_series, data?.guide_sequence].filter(Boolean).join('-')],
      ['RUC guia', data?.guide_ruc],
      ['Emision', asDate(data?.issue_date)],
      ['Estado', getPurchaseReceiptStatusLabel(data?.receipt_status)],
      ['Pago', data?.payment_condition],
      ['Primera cuota', asDate(data?.first_due_date)],
      ['Cuotas', data?.installments],
      ['Moneda', data?.currency],
    ],
    columns: ['Articulo', 'Lote', 'Vencimiento', 'Solic.', 'Ya rec.', 'Pend.', 'Recibida', 'P. costo', 'Total', 'Ubicacion'],
    rows: (data?.items ?? []).map(item => [
      nested(item, 'article.name', 'Articulo'),
      item?.lot || item?.batch_code,
      asDate(item?.expiration_date),
      asNumber(nested(item, 'purchaseOrderItem.requested_quantity', item?.ordered_quantity ?? 0)),
      asNumber(nested(item, 'purchaseOrderItem.received_quantity', item?.already_received ?? 0)),
      asNumber(Math.max(0, Number(nested(item, 'purchaseOrderItem.requested_quantity', item?.ordered_quantity ?? 0)) - Number(nested(item, 'purchaseOrderItem.received_quantity', item?.already_received ?? 0)))),
      asNumber(item?.quantity),
      asMoney(item?.cost_unit, data?.currency || 'PEN'),
      asMoney(item?.total, data?.currency || 'PEN'),
      item?.location,
    ]),
    totals: [
      ['Subtotal', asMoney(data?.subtotal, data?.currency || 'PEN')],
      ['Impuesto', asMoney(data?.tax_amount, data?.currency || 'PEN')],
      ['Total', asMoney(data?.total, data?.currency || 'PEN')],
    ],
    observations: data?.observations,
  }),
  income: (data) => ({
    title: 'Ingreso magistral',
    code: data?.code,
    filename: `ingreso-${data?.code || data?.id}`,
    meta: [
      ['Orden compra', data?.purchase_order_code],
      ['Documento', [data?.document_type, data?.document_series, data?.document_sequence].filter(Boolean).join(' ')],
      ['Guia', data?.guide_number || [data?.guide_series, data?.guide_sequence].filter(Boolean).join('-')],
      ['Empresa', nested(data, 'business.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Proveedor', nested(data, 'supplier.business_name')],
      ['Forma pago', data?.payment_method],
      ['Procedencia', data?.origin],
      ['Fecha', asDate(data?.issue_date || data?.created_at)],
      ['Moneda', data?.currency],
    ],
    columns: ['Articulo', 'Descripcion', 'Cantidad', 'Presentacion', 'Vencimiento', 'Lote', 'P. sin IGV', 'P. con IGV', 'Subtotal'],
    rows: (data?.items ?? []).map(item => [
      nested(item, 'article.code'),
      item?.description || nested(item, 'article.name'),
      asNumber(item?.quantity),
      item?.presentation,
      asDate(item?.expiration_date),
      item?.lot,
      asMoney(item?.price_without_igv, data?.currency || 'PEN'),
      asMoney(item?.price_with_igv, data?.currency || 'PEN'),
      asMoney(item?.subtotal, data?.currency || 'PEN'),
    ]),
    totals: [
      ['Subtotal', asMoney(data?.subtotal, data?.currency || 'PEN')],
      ['IGV', asMoney(data?.igv, data?.currency || 'PEN')],
      ['Total', asMoney(data?.total, data?.currency || 'PEN')],
    ],
    observations: data?.observations,
  }),
  inventory: (data) => ({
    title: 'Ajuste de inventario magistral',
    code: data?.code,
    filename: `inventario-${data?.code || data?.id}`,
    meta: [
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Fecha conteo', asDate(data?.count_date || data?.created_at)],
      ['Usuario', nested(data, 'creator.fullname') || nested(data, 'creator.username')],
    ],
    columns: ['Codigo', 'Articulo', 'Lote', 'Vencimiento', 'Stock sistema', 'Stock real', 'Diferencia'],
    rows: (data?.items ?? []).map(item => [
      nested(item, 'article.code'),
      nested(item, 'article.name'),
      item?.lot,
      asDate(item?.expiration_date),
      asNumber(item?.system_stock),
      asNumber(item?.real_stock),
      asNumber(item?.difference),
    ]),
    observations: data?.observations,
  }),
  output: (data) => ({
    title: 'Salida magistral',
    code: data?.code,
    filename: `salida-${data?.code || data?.id}`,
    meta: [
      ['Almacen origen', nested(data, 'originWarehouse.name')],
      ['Destino', data?.destination],
      ['Motivo', data?.reason],
      ['Fecha salida', asDate(data?.output_date || data?.created_at)],
      ['Usuario', nested(data, 'creator.fullname') || nested(data, 'creator.username')],
    ],
    columns: ['Codigo', 'Articulo', 'Lote', 'Vencimiento', 'Stock', 'Unidad', 'Cantidad', 'Total'],
    rows: (data?.items ?? []).map(item => [
      item?.code || nested(item, 'article.code'),
      item?.name || nested(item, 'article.name'),
      item?.lot,
      asDate(item?.expiration_date),
      asNumber(item?.stock),
      item?.unit_label,
      asNumber(item?.quantity),
      asNumber(item?.total),
    ]),
    observations: data?.observations,
  }),
  productionOrder: (data) => ({
    title: 'Orden de produccion magistral',
    code: data?.code,
    filename: `orden-produccion-${data?.code || data?.id}`,
    meta: [
      ['Estado', asClientText(data?.order_status)],
      ['Responsable', nested(data, 'responsible.name')],
      ['Destino', nested(data, 'destinationWarehouse.name') || data?.destination],
      ['Producto', nested(data, 'article.name')],
      ['Formato', nested(data, 'format.description')],
      ['Cantidad tanda', asNumber(data?.batch_quantity)],
      ['Cantidad producto', asNumber(data?.quantity)],
      ['Fecha entrega', asDate(data?.delivery_date)],
      ['Fecha registro', asDate(data?.registration_date || data?.created_at)],
    ],
    columns: ['Codigo', 'Articulo', 'Vencimiento', 'Cantidad', 'Formula', 'Total'],
    rows: (data?.items ?? []).map(item => [
      nested(item, 'article.code'),
      item?.description || nested(item, 'article.name'),
      asDate(item?.expiration_date),
      asNumber(item?.quantity),
      nested(item, 'formula.article_id') ? `Formula ${nested(item, 'formula.id')}` : asText(item?.magistral_formula_id),
      asNumber(item?.total),
    ]),
    observations: data?.observations,
  }),
  sale: (data) => ({
    title: data?.is_quote ? 'Cotizacion magistral' : 'Venta magistral',
    code: data?.code,
    filename: `${data?.is_quote ? 'cotizacion' : 'venta'}-${data?.code || data?.id}`,
    meta: [
      ['Empresa', nested(data, 'business.name')],
      ['Farmacia', data?.pharmacy],
      ['Estado pago', getPaymentStatusLabel(data?.payment_status)],
      ['Documento', [data?.document_type, data?.document_number].filter(Boolean).join(' ')],
      ['Paciente', data?.patient],
      ['Doctor', data?.doctor],
      ['Tipo venta', data?.sale_type],
      ['Fecha', asDate(data?.sale_date || data?.created_at)],
    ],
    columns: ['Articulo', 'Almacen', 'Stock', 'Cantidad', 'Precio', 'Dscto.', 'Subtotal'],
    rows: (data?.items ?? []).map(item => [
      item?.description || nested(item, 'article.name'),
      nested(item, 'warehouse.name'),
      asNumber(item?.stock),
      asNumber(item?.quantity),
      asMoney(item?.unit_price),
      asMoney(item?.discount),
      asMoney(item?.subtotal),
    ]),
    totals: [
      ['Gravada', asMoney(data?.taxable_amount)],
      ['Descuento', asMoney(data?.discount_total)],
      ['IGV', asMoney(data?.igv)],
      ['Total', asMoney(data?.total)],
    ],
    observations: data?.discount_policy,
  }),
  accountsPayable: (data) => ({
    title: 'Cuenta por pagar',
    code: data?.code,
    filename: `cuenta-por-pagar-${data?.code || data?.id}`,
    meta: [
      ['Recepcion', data?.purchase_receipt_code],
      ['Orden compra', data?.purchase_order_code],
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Proveedor', nested(data, 'supplier.business_name')],
      ['Documento', [data?.document_type, data?.series, data?.sequence].filter(Boolean).join(' ')],
      ['Emision', asDate(data?.issue_date)],
      ['Vencimiento', asDate(data?.due_date)],
      ['Condicion', data?.payment_condition],
      ['Estado pago', getPaymentStatusLabel(data?.payment_status)],
      ['Moneda', data?.currency],
    ],
    columns: ['Cuota', 'Vencimiento', 'Importe', 'Pagado', 'Saldo', 'Estado', 'Fecha pago'],
    rows: (data?.installments ?? []).map(item => [
      asText(item?.installment_number),
      asDate(item?.due_date),
      asMoney(item?.amount, data?.currency || 'PEN'),
      asMoney(item?.paid_amount, data?.currency || 'PEN'),
      asMoney(item?.balance_amount, data?.currency || 'PEN'),
      getPaymentStatusLabel(item?.payment_status),
      asDate(item?.paid_at),
    ]),
    totals: [
      ['Subtotal', asMoney(data?.subtotal, data?.currency || 'PEN')],
      ['Impuesto', asMoney(data?.tax_amount, data?.currency || 'PEN')],
      ['Total', asMoney(data?.total, data?.currency || 'PEN')],
      ['Pagado', asMoney(data?.paid_amount, data?.currency || 'PEN')],
      ['Saldo', asMoney(data?.balance_amount, data?.currency || 'PEN')],
    ],
    observations: data?.observations,
  }),
  accountsReceivable: (data) => ({
    title: 'Cuenta por cobrar',
    code: data?.code,
    filename: `cuenta-por-cobrar-${data?.code || data?.id}`,
    meta: [
      ['Origen', getSourceTypeLabel(data?.source_type)],
      ['Documento origen', nested(data, 'commercial_order.code') || nested(data, 'commercialOrder.code') || nested(data, 'service_order.code') || nested(data, 'serviceOrder.code')],
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Cliente', customerName(data)],
      ['Documento', joinText(data?.document_type, data?.series, data?.sequence)],
      ['Emision', asDate(data?.issue_date)],
      ['Vencimiento', asDate(data?.due_date)],
      ['Condicion', data?.payment_condition],
      ['Estado pago', getPaymentStatusLabel(data?.payment_status)],
      ['Moneda', data?.currency],
    ],
    columns: ['Cuota', 'Vencimiento', 'Importe', 'Pagado', 'Saldo', 'Estado', 'Fecha pago'],
    rows: (data?.installments ?? []).map(item => [
      asText(item?.installment_number),
      asDate(item?.due_date),
      asMoney(item?.amount, data?.currency || 'PEN'),
      asMoney(item?.paid_amount, data?.currency || 'PEN'),
      asMoney(item?.balance_amount, data?.currency || 'PEN'),
      getPaymentStatusLabel(item?.payment_status),
      asDate(item?.paid_at),
    ]),
    totals: [
      ['Subtotal', asMoney(data?.subtotal, data?.currency || 'PEN')],
      ['Impuesto', asMoney(data?.tax_amount, data?.currency || 'PEN')],
      ['Total', asMoney(data?.total, data?.currency || 'PEN')],
      ['Cobrado', asMoney(data?.paid_amount, data?.currency || 'PEN')],
      ['Saldo', asMoney(data?.balance_amount, data?.currency || 'PEN')],
    ],
    observations: data?.observations,
  }),
  commercialOrder: (data) => ({
    title: 'Pedido comercial',
    code: data?.code,
    filename: `pedido-comercial-${data?.code || data?.id}`,
    meta: [
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Cliente', customerName(data)],
      ['Red', nested(data, 'distribution_network.name') || nested(data, 'distributionNetwork.name')],
      ['Emision', asDate(data?.issue_date)],
      ['Entrega prometida', asDate(data?.promised_delivery_at)],
      ['Documento', data?.document_type],
      ['Pago', data?.payment_condition],
      ['Metodo pago', data?.payment_method],
      ['Estado pedido', getOperationalOrderStatusLabel(data?.order_status)],
      ['Despacho', getDispatchStatusLabel(data?.dispatch_status)],
      ['Facturacion', getBillingStatusLabel(data?.billing_status)],
      ['Cobranza', getPaymentStatusLabel(data?.payment_status)],
      ['Moneda', data?.currency],
    ],
    columns: ['Articulo', 'Presentacion', 'Stock', 'Cantidad', 'P. unit.', 'Total', 'Tarifario'],
    rows: (data?.items ?? []).map(item => [
      nested(item, 'article.name', 'Articulo'),
      nested(item, 'presentation.name') || item?.presentation_name,
      asNumber(item?.stock_available),
      asNumber(item?.quantity),
      asMoney(item?.price_unit, data?.currency || 'PEN'),
      asMoney(item?.total, data?.currency || 'PEN'),
      nested(item, 'price_list_item.price_list.code') || nested(data, 'price_list.code'),
    ]),
    totals: [
      ['Subtotal', asMoney((data?.items ?? []).reduce((sum, item) => sum + Number(item?.total || 0), 0), data?.currency || 'PEN')],
      ['Impuesto', asMoney(data?.tax_amount, data?.currency || 'PEN')],
      ['Total', asMoney(data?.total, data?.currency || 'PEN')],
    ],
    observations: [data?.delivery_address, data?.delivery_reference, data?.observations].filter(Boolean).join('\n'),
  }),
  priceList: (data) => ({
    title: 'Tarifario',
    code: data?.code,
    filename: `tarifario-${data?.code || data?.id}`,
    meta: [
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Cliente regular', nested(data, 'client.full_name')],
      ['Cliente eventual', nested(data, 'eventual_client.business_name')],
      ['Red', nested(data, 'distribution_network.name')],
      ['Canal', data?.channel],
      ['Segmento', data?.segment],
      ['Moneda', data?.currency],
      ['Prioridad', data?.priority],
      ['Vigencia inicio', asDate(data?.starts_at)],
      ['Vigencia fin', asDate(data?.ends_at)],
    ],
    columns: ['Articulo', 'Laboratorio', 'Categoria', 'Subcategoria', 'Precio fijo', 'Margen %', 'Cant. min.'],
    rows: (data?.items ?? []).map(item => [
      nested(item, 'article.name') || '-',
      nested(item, 'laboratory.name') || '-',
      item?.category,
      item?.subcategory,
      item?.fixed_price ? asMoney(item.fixed_price, data?.currency || 'PEN') : '-',
      item?.margin_percent ? `${Number(item.margin_percent || 0).toFixed(3)}%` : '-',
      asNumber(item?.minimum_quantity),
    ]),
    observations: data?.observations,
  }),
  serviceOrder: (data) => ({
    title: data?.order_type === 'storage_general' ? 'Orden de servicio general' : 'Orden de servicio',
    code: data?.code,
    filename: `${data?.order_type === 'storage_general' ? 'orden-servicio-general' : 'orden-servicio'}-${data?.code || data?.id}`,
    meta: [
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Cliente', nested(data, 'client.full_name')],
      ['Emision', asDate(data?.issue_date)],
      ['Programada', asDate(data?.scheduled_at)],
      ['Comprobante', data?.expected_document_type],
      ['Ciclo', data?.billing_cycle],
      ['Pago', data?.payment_condition],
      ['Cuotas', data?.installments],
      ['Estado', getServiceOrderStatusLabel(data?.order_status)],
      ['Facturacion', getBillingStatusLabel(data?.billing_status)],
      ['Moneda', data?.currency],
    ],
    columns: ['Servicio', 'Descripcion', 'Cantidad', 'P. unit.', 'Detraccion %', 'Comision %', 'Total'],
    rows: (data?.items ?? []).map(item => [
      nested(item, 'service.name') || item?.description,
      item?.description,
      asNumber(item?.quantity),
      asMoney(item?.unit_price, data?.currency || 'PEN'),
      `${Number(item?.detraction_percent || 0).toFixed(2)}%`,
      `${Number(item?.commission_percent || 0).toFixed(2)}%`,
      asMoney(item?.total, data?.currency || 'PEN'),
    ]),
    totals: [
      ['Subtotal', asMoney((data?.items ?? []).reduce((sum, item) => sum + Number(item?.total || 0), 0), data?.currency || 'PEN')],
      ['Impuesto', asMoney(data?.tax_amount, data?.currency || 'PEN')],
      ['Total', asMoney(data?.total, data?.currency || 'PEN')],
    ],
    observations: data?.observations,
  }),
  dispatch: (data) => ({
    title: 'Despacho',
    code: data?.code,
    filename: `despacho-${data?.code || data?.id}`,
    meta: [
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Fecha programada', asDate(data?.scheduled_date)],
      ['Turno', data?.shift],
      ['Conductor', nested(data, 'driver.full_name') || data?.driver_name],
      ['Vehiculo', nested(data, 'vehicle.plate') || data?.vehicle_plate],
      ['Zona', nested(data, 'zone_master.name') || nested(data, 'zoneMaster.name') || data?.zone],
      ['Copiloto', data?.copilot_name],
      ['Manifiesto', data?.manifest_code],
      ['Estado', getDispatchStatusLabel(data?.dispatch_status)],
    ],
    columns: ['Pedido', 'Cliente', 'Total'],
    rows: (data?.assignments ?? []).map(item => [
      nested(item, 'commercial_order.code') || nested(item, 'commercialOrder.code') || item?.commercial_order_id,
      item?.customer_name || customerName(item?.commercial_order || item?.commercialOrder || {}),
      asMoney(item?.total, nested(item, 'commercial_order.currency') || nested(item, 'commercialOrder.currency') || 'PEN'),
    ]),
    observations: data?.observations,
  }),
  activity: (data) => ({
    title: 'Actividad de despacho',
    code: data?.code,
    filename: `actividad-${data?.code || data?.id}`,
    meta: [
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Pedido', nested(data, 'commercial_order.code') || nested(data, 'commercialOrder.code')],
      ['Despacho', nested(data, 'dispatch.code')],
      ['Tipo', getActivityTypeLabel(data?.activity_type)],
      ['Estado', getActivityStatusLabel(data?.activity_status)],
      ['Fecha', asDate(data?.transfer_date)],
      ['Cliente', data?.customer_name],
      ['Documento', data?.document_number],
      ['Conductor', nested(data, 'driver.full_name')],
      ['Vehiculo', nested(data, 'vehicle.plate')],
      ['Zona', nested(data, 'zone.name')],
      ['Manifiesto', data?.manifest_code],
      ['Bultos', data?.package_count],
      ['Peso bruto', data?.gross_weight],
    ],
    columns: ['Codigo', 'Articulo', 'Cantidad', 'Entregado'],
    rows: (data?.items ?? []).map(item => [
      item?.item_code,
      item?.description || nested(item, 'article.name'),
      asNumber(item?.quantity),
      asNumber(item?.delivered_quantity),
    ]),
    observations: [data?.origin_address, data?.destination_address, data?.destination_reference, data?.observations].filter(Boolean).join('\n'),
  }),
  magistralFormula: (data) => ({
    title: 'Formula magistral',
    code: nested(data, 'article.code') || data?.id,
    filename: `formula-magistral-${nested(data, 'article.code') || data?.id}`,
    meta: [
      ['Articulo', nested(data, 'article.name')],
      ['Ultima edicion', asDate(data?.last_edited_at)],
      ['Usuario ult. edicion', nested(data, 'last_editor.fullname') || nested(data, 'lastEditor.fullname') || nested(data, 'last_editor.username') || nested(data, 'lastEditor.username')],
      ['Estado', data?.status === null ? 'Inactivo' : 'Activo'],
    ],
    columns: ['Codigo', 'Insumo', 'Cantidad', 'Presentacion', 'Cant. total', 'P. unit.', 'Subtotal'],
    rows: (data?.items ?? []).map(item => [
      item?.code || nested(item, 'article.code'),
      item?.description || nested(item, 'article.name'),
      asNumber(item?.quantity),
      item?.presentation,
      asNumber(item?.total_quantity),
      asMoney(item?.unit_price),
      asMoney(item?.subtotal),
    ]),
    totals: [
      ['Total formula', asMoney((data?.items ?? []).reduce((sum, item) => sum + Number(item?.subtotal || 0), 0))],
    ],
    observations: [
      ['Condiciones especiales', data?.special_preparation_conditions],
      ['Equipos especializados', data?.specialized_equipment],
      ['Instrucciones', data?.preparation_instructions],
      ['Metodo', data?.preparation_method],
      ['Conservacion', data?.conservation],
      ['Estabilidad', data?.stability],
      ['Uso', data?.usage],
      ['Otros', data?.others],
    ].filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n\n'),
  }),
  storageEntryNote: (data) => ({
    title: 'Nota de entrada de almacenamiento',
    code: data?.code || data?.id,
    filename: `nota-entrada-almacenamiento-${data?.code || data?.id}`,
    meta: [
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Proveedor', nested(data, 'supplier.business_name')],
      ['Documento', [data?.document_type, data?.document_series, data?.document_sequence].filter(Boolean).join(' ')],
      ['Guia', [data?.guide_series, data?.guide_sequence].filter(Boolean).join('-')],
      ['RUC guia', data?.guide_ruc],
      ['Moneda', data?.currency],
      ['Usuario', nested(data, 'creator.fullname') || nested(data, 'creator.username')],
    ],
    columns: ['Lote', 'Articulo', 'Laboratorio', 'Unidad', 'Stock ant.', 'Cantidad', 'Costo', 'Total', 'Ubicacion'],
    rows: (data?.items ?? []).map(item => [
      item?.lot || item?.batch_code,
      nested(item, 'article.name'),
      nested(item, 'article.laboratory.name'),
      nested(item, 'article.unit.symbol') || nested(item, 'article.unit.name'),
      asNumber(item?.stock),
      asNumber(item?.quantity),
      asMoney(item?.cost_unit, data?.currency || 'PEN'),
      asMoney(item?.total, data?.currency || 'PEN'),
      item?.location,
    ]),
    totals: [
      ['Total', asMoney((data?.items ?? []).reduce((sum, item) => sum + Number(item?.total || 0), 0), data?.currency || 'PEN')],
    ],
    observations: data?.observations,
  }),
  storageExitNote: (data) => ({
    title: 'Nota de salida de almacenamiento',
    code: data?.code || data?.id,
    filename: `nota-salida-almacenamiento-${data?.code || data?.id}`,
    meta: [
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Cliente', data?.client_name],
      ['Motivos', (data?.motives ?? []).join(', ')],
      ['Usuario', nested(data, 'creator.fullname') || nested(data, 'creator.username')],
    ],
    columns: ['Lote', 'Articulo', 'Laboratorio', 'Unidad', 'Stock', 'Cantidad', 'Total', 'Ubicacion', 'Destino'],
    rows: (data?.items ?? []).map(item => [
      item?.batch_code,
      nested(item, 'article.name'),
      nested(item, 'article.laboratory.name'),
      nested(item, 'article.unit.symbol') || nested(item, 'article.unit.name'),
      asNumber(item?.stock),
      asNumber(item?.quantity),
      asNumber(item?.total),
      item?.location,
      item?.destination_location,
    ]),
    observations: data?.observations,
  }),
  sampleOrder: (data) => ({
    title: 'Pedido de muestra',
    code: data?.order_number || data?.id,
    filename: `pedido-muestra-${data?.order_number || data?.id}`,
    meta: [
      ['Estado pedido', asClientText(data?.order_status)],
      ['Estado email', asClientText(data?.email_status)],
      ['Guia remision', data?.referral_guide],
      ['Peso bruto total', data?.total_gross_weight ? asNumber(data.total_gross_weight) : ''],
      ['Canal', data?.channel],
      ['Documento', [data?.document_type, data?.document_number].filter(Boolean).join(' ')],
      ['Cliente', data?.client_name],
      ['Pedido completo', data?.order_complete ? 'Si' : 'No'],
      ['Fecha solicitada', asDate(data?.requested_at)],
      ['Fecha entrega', asDate(data?.delivered_at)],
      ['Supervisor', data?.supervisor_name],
    ],
    columns: ['Campo', 'Valor'],
    rows: [
      ['Nro pedido', asText(data?.order_number)],
      ['Guia remision', asText(data?.referral_guide)],
      ['Cliente', asText(data?.client_name)],
      ['Canal', asText(data?.channel)],
      ['Documento', asText([data?.document_type, data?.document_number].filter(Boolean).join(' '))],
    ],
    observations: data?.cancellation_reason || data?.observations,
  }),
}

export const openMagistralesRecordPdf = (document) => {
  try {
    const doc = ensurePdf()
    const now = new Date().toLocaleString('es-PE')
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 42

    doc.setFontSize(16)
    doc.text(document.title, 40, y)
    doc.setFontSize(10)
    doc.text(`Codigo: ${asText(document.code)}`, 40, y + 18)
    doc.text(`Generado: ${now}`, pageWidth - 40, y + 18, { align: 'right' })

    y += 42
    const metaRows = (document.meta ?? [])
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([label, value]) => [label, asClientText(value)])

    if (metaRows.length) {
      doc.autoTable({
        startY: y,
        theme: 'grid',
        body: metaRows,
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [245, 247, 250], cellWidth: 95 },
        },
        margin: { left: 40, right: 40 },
      })
      y = doc.lastAutoTable.finalY + 18
    }

    const detailRows = document.rows?.length
      ? document.rows.map(row => row.map(cell => asClientText(cell)))
      : [['Sin detalle']]

    doc.autoTable({
      startY: y,
      head: [document.columns ?? []],
      body: detailRows,
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [55, 65, 81] },
      margin: { left: 40, right: 40 },
    })
    y = doc.lastAutoTable.finalY + 16

    if (document.totals?.length) {
      const totalRows = document.totals.map(row => row.map(cell => asClientText(cell)))
      doc.autoTable({
        startY: y,
        body: totalRows,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { halign: 'right', fontStyle: 'bold' },
          1: { halign: 'right' },
        },
        margin: { left: pageWidth - 230, right: 40 },
      })
      y = doc.lastAutoTable.finalY + 16
    }

    if (document.observations) {
      doc.setFontSize(9)
      doc.text('Observaciones', 40, y)
      doc.setFontSize(8)
      doc.text(doc.splitTextToSize(asClientText(document.observations), pageWidth - 80), 40, y + 14)
    }

    showPdfInModal(doc, document)
  } catch (error) {
    toast.error('No se pudo generar el PDF', {
      description: error.message,
      duration: 3500,
      richColors: true,
    })
  }
}
