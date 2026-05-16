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

const ensurePdf = (orientation = 'portrait') => {
  const JsPDF = window.jspdf?.jsPDF || window.jsPDF
  if (!JsPDF) throw new Error('jsPDF no esta disponible')
  const doc = new JsPDF({ orientation, unit: 'pt', format: 'a4' })
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

const manufacturerWithCountry = (item) => (
  [nested(item, 'manufacturer.name'), nested(item, 'manufacturer.country')]
    .filter(Boolean)
    .join(' | ')
)

const documentLabel = (data, separator = '-') => (
  [data?.document_series, data?.document_sequence]
    .filter(Boolean)
    .join(separator)
    || [data?.document_type, data?.document_series, data?.document_sequence].filter(Boolean).join(' ')
)

const documentTypeLabel = (value) => {
  const text = asText(value, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  return text || 'DOCUMENTO'
}

const asQuantity = (value) => {
  const number = Number(value || 0)
  return Number.isInteger(number) ? `${number}` : number.toFixed(3)
}

const invoicePackingLabel = (data) => (
  [data?.invoice_series, data?.invoice_sequence]
    .filter(Boolean)
    .join('-')
    || [data?.invoice_type, data?.invoice_series, data?.invoice_sequence].filter(Boolean).join(' ')
)

const addInlineField = (doc, label, value, x, y, width, labelWidth = 72) => {
  doc.setFont('helvetica', 'bold')
  doc.text(label, x, y)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(asClientText(value), width - labelWidth)
  doc.text(lines, x + labelWidth, y)
  return Math.max(12, lines.length * 10)
}

const drawGuideBox = (doc, x, y, width, height, title, rows = []) => {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.7)
  doc.rect(x, y, width, height)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(title, x + 6, y + 12)

  let currentY = y + 23
  rows.forEach(([label, value, labelWidth = 54]) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.text(label, x + 6, currentY)
    doc.setFont('helvetica', 'normal')
    const text = doc.splitTextToSize(`: ${asClientText(value, '')}`, Math.max(22, width - labelWidth - 12))
    doc.text(text, x + labelWidth, currentY)
    currentY += Math.max(9, text.length * 8)
  })
}

const drawKamaryLogoMark = (doc, x, y) => {
  doc.setFillColor(245, 247, 250)
  doc.rect(x, y, 52, 42, 'F')
  doc.setDrawColor(220, 225, 232)
  doc.rect(x, y, 52, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(210, 28, 38)
  doc.text('GRUPO', x + 26, y + 18, { align: 'center' })
  doc.setTextColor(23, 94, 172)
  doc.text('KAMARY', x + 26, y + 29, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

const renderSampleReferralGuidePdf = (doc, document) => {
  const data = document.source ?? {}
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  const contentWidth = pageWidth - (margin * 2)
  const halfGap = 10
  const halfWidth = (contentWidth - halfGap) / 2
  const companyRuc = data?.business_ruc || '20601542600'
  const companyName = data?.business_name || 'KAMARY PERU SAC'
  const companyAddress = data?.business_address || 'CAL.YEN ESCOBEDO GARRO NRO. 830\nURB. LA VINA LIMA - LIMA - SAN LUIS'
  const guideNumber = asText(data?.referral_guide || data?.order_number || data?.id)
  const issueDate = asDate(data?.created_at || data?.requested_at || new Date().toISOString())
  const transferDate = asDate(data?.delivered_at || data?.requested_at)
  const destinationAddress = asText(data?.delivery_address, '')
  const customerDocument = asText(data?.document_number || data?.contact_document, '')
  const items = Array.isArray(data?.items) ? data.items : []
  let y = 52

  drawKamaryLogoMark(doc, margin + 6, y - 16)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(companyName, margin + 88, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(companyAddress.split('\n'), margin + 88, y + 16)

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.8)
  doc.rect(pageWidth - margin - 152, y - 12, 152, 68)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`RUC ${companyRuc}`, pageWidth - margin - 76, y, { align: 'center' })
  doc.setFontSize(10.5)
  doc.text(['GUIA DE REMISION', 'REMITENTE', guideNumber], pageWidth - margin - 76, y + 18, { align: 'center' })

  y += 92
  drawGuideBox(doc, margin, y, halfWidth, 31, 'FECHA DE EMISION', [
    ['FECHA', issueDate, 54],
  ])
  drawGuideBox(doc, margin + halfWidth + halfGap, y, halfWidth, 31, 'FECHA DE TRASLADO', [
    ['DIRECCION', transferDate, 58],
  ])

  y += 60
  drawGuideBox(doc, margin, y, halfWidth, 42, 'PUNTO DE PARTIDA', [
    ['DIRECCION', companyAddress.replace(/\n/g, ' '), 58],
  ])
  drawGuideBox(doc, margin + halfWidth + halfGap, y, halfWidth, 42, 'PUNTO DE LLEGADA', [
    ['DIRECCION', destinationAddress, 58],
  ])

  y += 62
  drawGuideBox(doc, margin, y, halfWidth, 51, 'DESTINATARIO', [
    ['Sr(es)', data?.client_name, 58],
    ['R.U.C.', customerDocument, 58],
  ])
  drawGuideBox(doc, margin + halfWidth + halfGap, y, halfWidth, 51, 'UNIDAD DE TRANSPORTE / CONDUCTOR', [
    ['PLACA', data?.vehicle_plate, 68],
    ['CONDUCTOR', data?.driver_name, 68],
    ['DOCUMENTO', data?.driver_document || data?.driver_license, 68],
  ])

  y += 74
  const detailRows = items.length
    ? items.map((item, index) => [
      `${index + 1}`,
      joinText(item?.code, item?.name),
      asText(item?.unit, ''),
      asText(item?.lot_code || item?.lot, ''),
      asDate(item?.expiration_date),
      asQuantity(item?.quantity),
    ])
    : [['1', 'Sin detalle', '', '', '', '']]

  doc.autoTable({
    startY: y,
    head: [['ITEM', 'PRODUCTO', 'MEDIDA', 'LOTE', 'F. V.', 'CANT.']],
    body: detailRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: { top: 7, right: 4, bottom: 7, left: 4 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 40, halign: 'center' },
      1: { cellWidth: 245 },
      2: { cellWidth: 62, halign: 'center' },
      3: { cellWidth: 58, halign: 'center' },
      4: { cellWidth: 58, halign: 'center' },
      5: { cellWidth: 42, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  })

  y = doc.lastAutoTable.finalY + 30
  if (y + 172 > pageHeight - 20) {
    doc.addPage()
    y = 48
  }

  drawGuideBox(doc, margin, y, halfWidth, 42, 'TRANSPORTISTA', [
    ['NOMBRE', companyName, 62],
    ['DOCUMENTO', companyRuc, 62],
  ])
  drawGuideBox(doc, margin + halfWidth + halfGap, y, halfWidth, 42, 'MOTIVO DEL TRASLADO', [
    ['MOTIVO', data?.request_reason || 'VENTA', 62],
  ])

  y += 62
  doc.rect(margin, y, contentWidth, 64)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('DNI Contacto:', margin + 6, y + 14)
  doc.text('Contacto Destino:', margin + 166, y + 14)
  doc.text('Celular Contacto:', margin + 368, y + 14)
  doc.setFont('helvetica', 'normal')
  doc.text(asText(data?.contact_document, ''), margin + 62, y + 14)
  doc.text(doc.splitTextToSize(asText(data?.contact_name, ''), 120), margin + 245, y + 14)
  doc.text(asText(data?.contact_phone, ''), margin + 452, y + 14)
  doc.setFont('helvetica', 'bold')
  doc.text('Ref. direccion', margin + 6, y + 40)
  doc.text('entrega:', margin + 6, y + 50)
  doc.text('Observaciones:', margin + 6, y + 60)
  doc.setFont('helvetica', 'normal')
  doc.text(doc.splitTextToSize(asText(data?.delivery_reference, ''), contentWidth - 108), margin + 74, y + 40)
  doc.text(doc.splitTextToSize(asText(data?.observations, ''), contentWidth - 108), margin + 90, y + 60)

  y += 86
  const signWidth = 243
  doc.rect(pageWidth - margin - signWidth, y, signWidth, 51)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(companyName, pageWidth - margin - (signWidth / 2), y + 18, { align: 'center' })
  doc.text('CONFORMIDAD DEL CLIENTE', pageWidth - margin - (signWidth / 2), y + 42, { align: 'center' })
}

const renderStorageEntryNoteActaPdf = (doc, document, now) => {
  const data = document.source ?? {}
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 24
  const contentWidth = pageWidth - (margin * 2)
  let y = 30

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('ACTA DE RECEPCION DE PRODUCTOS FORM-F-46', pageWidth / 2, y, { align: 'center' })

  doc.setFontSize(8)
  y += 22
  const clientHeight = addInlineField(
    doc,
    'CLIENTE:',
    [nested(data, 'client.document_number'), nested(data, 'client.full_name')].filter(Boolean).join(' - '),
    margin,
    y,
    contentWidth - 190,
    48
  )
  addInlineField(doc, 'Nro ACTA:', document.code, pageWidth - 175, y, 150, 58)
  y += clientHeight + 4

  const providerHeight = addInlineField(
    doc,
    'PROVEEDOR/DISTRIBUIDOR:',
    data?.provider_distributor || nested(data, 'supplier.business_name'),
    margin,
    y,
    contentWidth - 260,
    128
  )
  addInlineField(doc, 'FACTURA/GUIA:', documentLabel(data), pageWidth - 282, y, 132, 72)
  addInlineField(doc, 'FECHA:', asDate(data?.document_date), pageWidth - 132, y, 108, 42)
  y += providerHeight + 8

  doc.setFont('helvetica', 'bold')
  doc.text('PARA IMPORTACIONES:', margin, y)
  y += 13
  addInlineField(doc, 'DUA Nro:', data?.dua_number, margin, y, 200, 48)
  addInlineField(doc, 'INVOICE/PACKING:', invoicePackingLabel(data), margin + 245, y, 260, 94)
  y += 15

  y += addInlineField(doc, 'Agencia de Transporte:', data?.transport_agency, margin, y, contentWidth, 116)
  y += 3
  addInlineField(doc, 'Nombre del Chofer:', data?.driver_name, margin, y, 310, 96)
  addInlineField(doc, 'Nro Brevete:', data?.driver_license, margin + 330, y, 180, 66)
  addInlineField(doc, 'Hora de Inicio:', '____:____', pageWidth - 190, y, 160, 78)
  y += 15
  addInlineField(doc, 'Fecha de Registro:', asDate(data?.created_at || data?.entry_date), margin, y, 230, 94)
  addInlineField(doc, 'Nro de Placa:', data?.vehicle_plate, margin + 330, y, 180, 72)
  addInlineField(doc, 'Hora de Termino:', '____:____', pageWidth - 190, y, 160, 84)
  y += 18

  const itemRows = (data?.items ?? []).map((item, index) => [
    `${index + 1}`,
    nested(item, 'article.code') || item?.batch_code || item?.lot,
    nested(item, 'article.name'),
    nested(item, 'article.unit.symbol') || nested(item, 'article.unit.name'),
    item?.lot || item?.batch_code,
    asDate(item?.expiration_date),
    manufacturerWithCountry(item),
    item?.protocol_certificate || item?.certificate || '',
    item?.storage_condition,
    asNumber(item?.requested_quantity ?? item?.quantity),
    asNumber(item?.received_quantity ?? item?.quantity),
  ])

  doc.autoTable({
    startY: y,
    head: [[
      'Item',
      'Codigo /\nModelo',
      'Nombre del Producto / Dispositivo Medico, Concentracion y Forma Farmaceutica',
      'Presentacion',
      'Lote',
      'Fecha\nVencimiento',
      'Fabricante | Pais',
      'Protocolo/\nCertificado',
      'Condicion\nAlmacenamiento',
      'Cantidad\nSolicitada',
      'Cantidad\nRecibida',
    ]],
    body: itemRows.length ? itemRows : [['', '', 'Sin detalle', '', '', '', '', '', '', '', '']],
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 3, overflow: 'linebreak', lineColor: [210, 214, 220], lineWidth: 0.3 },
    headStyles: { fillColor: [36, 36, 76], textColor: 255, fontStyle: 'bold', halign: 'center', valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 58 },
      2: { cellWidth: 140 },
      3: { cellWidth: 58 },
      4: { cellWidth: 58 },
      5: { cellWidth: 60 },
      6: { cellWidth: 88 },
      7: { cellWidth: 62 },
      8: { cellWidth: 78 },
      9: { cellWidth: 55, halign: 'right' },
      10: { cellWidth: 55, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })
  y = doc.lastAutoTable.finalY + 12

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('VERIFICACIONES', margin, y)
  y += 8

  doc.autoTable({
    startY: y,
    head: [['Descripcion', 'SI', 'NO', 'N.A.', 'OBSERVACIONES']],
    body: [
      ['Las cajas se encuentran debidamente selladas', '', '', '', ''],
      ['Las cajas se encuentran limpias, no arrugadas, quebradas o humedas', '', '', '', ''],
      ['Temperatura de Ingreso | Producto con cadena de frio', '', '', '', ''],
    ],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 4, lineColor: [210, 214, 220], lineWidth: 0.3 },
    headStyles: { fillColor: [245, 247, 250], textColor: [40, 48, 64], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 310 },
      1: { cellWidth: 34, halign: 'center' },
      2: { cellWidth: 34, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: contentWidth - 418 },
    },
    margin: { left: margin, right: margin },
  })
  y = doc.lastAutoTable.finalY + 36

  const signatureWidth = 190
  doc.setDrawColor(90, 90, 90)
  doc.line(margin + 90, y, margin + 90 + signatureWidth, y)
  doc.line(pageWidth - margin - 90 - signatureWidth, y, pageWidth - margin - 90, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Encargado de almacen', margin + 90 + (signatureWidth / 2), y + 12, { align: 'center' })
  doc.text('Transportista', pageWidth - margin - 90 - (signatureWidth / 2), y + 12, { align: 'center' })
  doc.text(`Generado: ${now}`, pageWidth - margin, pageHeight - 12, { align: 'right' })
  doc.text('Page 1', margin, pageHeight - 12)
}

const renderStorageEntryNoteDetailPdf = (doc, document) => {
  const data = document.source ?? {}
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 52
  const rightX = pageWidth - margin - 190
  let y = 82

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(`NOTA DE ENTRADA: ${asText(document.code)}`, pageWidth / 2, y, { align: 'center' })

  doc.setFontSize(9)
  y += 36
  const clientHeight = addInlineField(
    doc,
    'CLIENTE :',
    [nested(data, 'client.document_number'), nested(data, 'client.full_name')].filter(Boolean).join(' - '),
    margin,
    y,
    pageWidth - (margin * 2),
    62
  )
  y += clientHeight + 6

  addInlineField(doc, `${documentTypeLabel(data?.document_type)} :`, documentLabel(data, ' - '), margin, y, 270, 94)
  addInlineField(doc, 'F. DOCUMENTO :', asDate(data?.document_date), rightX, y, 190, 92)
  y += 18
  addInlineField(doc, 'ALMACEN :', nested(data, 'warehouse.name'), margin, y, 270, 62)
  addInlineField(doc, 'F. DESPACHO :', asDate(data?.entry_date), rightX, y, 190, 86)
  y += 24

  const rows = (data?.items ?? []).map(item => [
    nested(item, 'article.name'),
    item?.lot || item?.batch_code,
    asDate(item?.expiration_date),
    item?.location,
    asQuantity(item?.received_quantity ?? item?.quantity),
  ])

  doc.autoTable({
    startY: y,
    head: [['Descripcion', 'Lote/Serie', 'F. Vencim.', 'Ubic.', 'Cantidad']],
    body: rows.length ? rows : [['Sin detalle', '', '', '', '']],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', lineColor: [220, 224, 230], lineWidth: 0.3 },
    headStyles: { fillColor: [255, 255, 255], textColor: [45, 55, 72], fontStyle: 'bold', lineColor: [220, 224, 230], lineWidth: 0.3 },
    bodyStyles: { textColor: [45, 55, 72] },
    columnStyles: {
      0: { cellWidth: 230 },
      1: { cellWidth: 75 },
      2: { cellWidth: 70 },
      3: { cellWidth: 62 },
      4: { cellWidth: 54, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  y = doc.lastAutoTable.finalY + 28
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('OBSERVACIONES :', margin, y)
  doc.setFont('helvetica', 'normal')
  const observations = asClientText(data?.observations, '')
  if (observations) doc.text(doc.splitTextToSize(observations, pageWidth - (margin * 2) - 100), margin + 95, y)

  const signatureY = Math.max(y + 74, pageHeight - 142)
  const signatureWidth = 155
  doc.setDrawColor(70, 70, 70)
  doc.line(margin + 18, signatureY, margin + 18 + signatureWidth, signatureY)
  doc.line(pageWidth - margin - 18 - signatureWidth, signatureY, pageWidth - margin - 18, signatureY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Jefe de Almacen', margin + 18 + (signatureWidth / 2), signatureY + 14, { align: 'center' })
  doc.text('Responsable del cliente', pageWidth - margin - 18 - (signatureWidth / 2), signatureY + 14, { align: 'center' })
}

const renderStorageExitNotePdf = (doc, document) => {
  const data = document.source ?? {}
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 52
  const rightX = pageWidth - margin - 190
  let y = 82

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(`F-54 NOTA DE SALIDA: ${asText(document.code)}`, pageWidth / 2, y, { align: 'center' })

  doc.setFontSize(9)
  y += 36
  const clientHeight = addInlineField(
    doc,
    'CLIENTE :',
    data?.client_name || [nested(data, 'client.document_number'), nested(data, 'client.full_name')].filter(Boolean).join(' - '),
    margin,
    y,
    pageWidth - (margin * 2),
    62
  )
  y += clientHeight + 6

  addInlineField(doc, `${documentTypeLabel(data?.document_type)} :`, documentLabel(data, ' - '), margin, y, 270, 94)
  addInlineField(doc, 'FECHA DOCUMENTO :', asDate(data?.document_date), rightX, y, 190, 110)
  y += 18
  addInlineField(doc, 'ALMACEN :', nested(data, 'warehouse.name'), margin, y, 270, 62)
  addInlineField(doc, 'UBICACION :', [...new Set((data?.items ?? []).map(item => item?.destination_location).filter(Boolean))].join(', '), rightX, y, 190, 70)
  y += 18
  addInlineField(doc, 'F. DESPACHO :', asDate(data?.exit_date), margin, y, 270, 82)
  y += 18
  addInlineField(doc, 'HORA INICIO :', '', margin, y, 180, 78)
  addInlineField(doc, 'HORA TERMINO :', '', margin + 180, y, 190, 92)
  y += 26

  const rows = (data?.items ?? []).map(item => [
    nested(item, 'article.name'),
    item?.lot || item?.batch_code,
    asDate(item?.expiration_date),
    item?.location,
    asQuantity(item?.quantity ?? item?.total),
  ])

  doc.autoTable({
    startY: y,
    head: [['Descripcion', 'Lote/Serie', 'F. Vencim.', 'Ubic.', 'Cantidad']],
    body: rows.length ? rows : [['Sin detalle', '', '', '', '']],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak', lineColor: [220, 224, 230], lineWidth: 0.3 },
    headStyles: { fillColor: [255, 255, 255], textColor: [45, 55, 72], fontStyle: 'bold', lineColor: [220, 224, 230], lineWidth: 0.3 },
    bodyStyles: { textColor: [45, 55, 72] },
    columnStyles: {
      0: { cellWidth: 210 },
      1: { cellWidth: 75 },
      2: { cellWidth: 75 },
      3: { cellWidth: 65 },
      4: { cellWidth: 60, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  y = doc.lastAutoTable.finalY + 28
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('OBSERVACIONES :', margin, y)
  doc.setFont('helvetica', 'normal')
  const observations = asClientText(data?.observations, '')
  if (observations) doc.text(doc.splitTextToSize(observations, pageWidth - (margin * 2) - 100), margin + 95, y)

  const signatureY = Math.max(y + 74, pageHeight - 142)
  const signatureWidth = 155
  doc.setDrawColor(70, 70, 70)
  doc.line(margin + 18, signatureY, margin + 18 + signatureWidth, signatureY)
  doc.line(pageWidth - margin - 18 - signatureWidth, signatureY, pageWidth - margin - 18, signatureY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Jefe de Almacen', margin + 18 + (signatureWidth / 2), signatureY + 14, { align: 'center' })
  doc.text('Responsable del cliente', pageWidth - margin - 18 - (signatureWidth / 2), signatureY + 14, { align: 'center' })
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
    layout: 'storage-entry-note-detail',
    title: 'Detalle de nota de entrada',
    code: data?.code || data?.id,
    filename: `nota-entrada-almacenamiento-${data?.code || data?.id}`,
    source: data,
    meta: [
      ['Empresa', nested(data, 'business.name')],
      ['Sede', nested(data, 'branch.name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Cliente', [nested(data, 'client.document_number'), nested(data, 'client.full_name')].filter(Boolean).join(' - ')],
      ['Proveedor/Distribuidor', data?.provider_distributor || nested(data, 'supplier.business_name')],
      ['Documento', [data?.document_type, data?.document_series, data?.document_sequence].filter(Boolean).join(' ')],
      ['Fecha ingreso', asDate(data?.entry_date)],
      ['Fecha documento', asDate(data?.document_date)],
      ['Chofer', data?.driver_name],
      ['Brevete', data?.driver_license],
      ['Placa', data?.vehicle_plate],
      ['Usuario', nested(data, 'creator.fullname') || nested(data, 'creator.username')],
    ],
    columns: ['Numero lote', 'Fecha venc.', 'Articulo', 'U. medida', 'Stock', 'Fabricante', 'Condicion', 'Ubicacion', 'Cant. solicitada', 'Cant. recibida'],
    rows: (data?.items ?? []).map(item => [
      item?.lot || item?.batch_code,
      asDate(item?.expiration_date),
      nested(item, 'article.name'),
      nested(item, 'article.unit.symbol') || nested(item, 'article.unit.name'),
      asNumber(item?.stock),
      nested(item, 'manufacturer.name'),
      item?.storage_condition,
      item?.location,
      asNumber(item?.requested_quantity ?? item?.quantity),
      asNumber(item?.received_quantity ?? item?.quantity),
    ]),
    totals: [
      ['Total recibido', asNumber((data?.items ?? []).reduce((sum, item) => sum + Number(item?.received_quantity ?? item?.quantity ?? 0), 0))],
    ],
    observations: data?.observations,
  }),
  storageEntryNoteActa: (data) => ({
    layout: 'storage-entry-note-acta',
    orientation: 'landscape',
    title: 'Acta de nota de entrada',
    code: data?.code || data?.id,
    filename: `acta-nota-entrada-${data?.code || data?.id}`,
    source: data,
    meta: [
      ['Cliente', [nested(data, 'client.document_number'), nested(data, 'client.full_name')].filter(Boolean).join(' - ')],
      ['Proveedor/Distribuidor', data?.provider_distributor || nested(data, 'supplier.business_name')],
      ['Almacen', nested(data, 'warehouse.name')],
      ['Fecha ingreso', asDate(data?.entry_date)],
      ['Tipo documento', data?.document_type],
      ['Serie', data?.document_series],
      ['Secuencia', data?.document_sequence],
      ['Fecha documento', asDate(data?.document_date)],
      ['Invoice', [data?.invoice_type, data?.invoice_series, data?.invoice_sequence].filter(Boolean).join(' ')],
      ['Invoice fecha', asDate(data?.invoice_date)],
      ['Nro DUA', data?.dua_number],
      ['Agencia transporte', data?.transport_agency],
      ['Chofer', data?.driver_name],
      ['Brevete', data?.driver_license],
      ['Placa', data?.vehicle_plate],
    ],
    columns: ['Numero lote', 'Fecha venc.', 'Articulo', 'U. medida', 'Fabricante', 'Condicion', 'Ubicacion', 'Solicitada', 'Recibida'],
    rows: (data?.items ?? []).map(item => [
      item?.lot || item?.batch_code,
      asDate(item?.expiration_date),
      nested(item, 'article.name'),
      nested(item, 'article.unit.symbol') || nested(item, 'article.unit.name'),
      manufacturerWithCountry(item),
      item?.storage_condition,
      item?.location,
      asNumber(item?.requested_quantity ?? item?.quantity),
      asNumber(item?.received_quantity ?? item?.quantity),
    ]),
    observations: data?.observations,
  }),
  storageExitNote: (data) => ({
    layout: 'storage-exit-note',
    title: 'Nota de salida de almacenamiento',
    code: data?.code || data?.id,
    filename: `nota-salida-almacenamiento-${data?.code || data?.id}`,
    source: data,
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
    layout: 'sample-referral-guide',
    title: 'Guia Remision',
    code: data?.referral_guide || data?.order_number || data?.id,
    filename: `guia-remision-${data?.referral_guide || data?.order_number || data?.id}`,
    source: data,
  }),
}

export const openMagistralesRecordPdf = (document) => {
  try {
    const doc = ensurePdf(document.orientation ?? 'portrait')
    const now = new Date().toLocaleString('es-PE')
    if (document.layout === 'storage-entry-note-detail') {
      renderStorageEntryNoteDetailPdf(doc, document)
      showPdfInModal(doc, document)
      return
    }
    if (document.layout === 'storage-entry-note-acta') {
      renderStorageEntryNoteActaPdf(doc, document, now)
      showPdfInModal(doc, document)
      return
    }
    if (document.layout === 'storage-exit-note') {
      renderStorageExitNotePdf(doc, document)
      showPdfInModal(doc, document)
      return
    }
    if (document.layout === 'sample-referral-guide') {
      renderSampleReferralGuidePdf(doc, document)
      showPdfInModal(doc, document)
      return
    }
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
