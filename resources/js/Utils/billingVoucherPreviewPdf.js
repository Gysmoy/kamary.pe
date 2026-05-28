const PDF_MODAL_ID = 'billing-voucher-preview-modal'
const PDF_IFRAME_ID = 'billing-voucher-preview-frame'
let currentPdfBlobUrl = null

const nested = (source, path, fallback = '') => {
  const value = path.split('.').reduce((current, key) => current?.[key], source)
  return value ?? fallback
}

const asText = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback
  return `${value}`
}

const asDate = (value) => {
  if (!value) return '-'
  const text = `${value}`
  return text.includes('T') ? text.slice(0, 10) : text.slice(0, 10)
}

const asNumber = (value, decimals = 2) => Number(value || 0).toFixed(decimals)

const currencySymbol = (currency = 'PEN') => {
  const normalized = `${currency ?? 'PEN'}`.toUpperCase()
  if (normalized === 'USD') return 'US$'
  if (normalized === 'EUR') return 'EUR'
  return 'S/.'
}

const money = (value, currency = 'PEN') => `${currencySymbol(currency)} ${asNumber(value)}`

const documentNumber = (document) => (
  [document?.series, document?.sequence].filter(Boolean).join('-')
  || document?.code
  || '-'
)

const documentTitle = (documentType) => {
  const normalized = `${documentType ?? ''}`.trim().toLowerCase()
  if (normalized.includes('boleta')) return 'BOLETA DE VENTA\nELECTRONICA'
  if (normalized.includes('nota')) return 'NOTA DE CREDITO\nELECTRONICA'
  return 'FACTURA\nELECTRONICA'
}

const customerName = (document) => (
  nested(document, 'client.full_name')
  || nested(document, 'eventual_client.business_name')
  || nested(document, 'eventualClient.business_name')
  || '-'
)

const customerDocument = (document) => (
  nested(document, 'client.document_number')
  || nested(document, 'eventual_client.document_number')
  || nested(document, 'eventualClient.document_number')
  || '-'
)

const customerAddress = (document) => (
  nested(document, 'metadata.delivery_address')
  || nested(document, 'commercial_order.delivery_address')
  || nested(document, 'commercialOrder.delivery_address')
  || nested(document, 'client.full_address')
  || nested(document, 'eventual_client.address')
  || nested(document, 'eventualClient.address')
  || '-'
)

const deliveryContactName = (document) => (
  nested(document, 'metadata.dispatch_contact_name')
  || nested(document, 'commercial_order.dispatch_contact_name')
  || nested(document, 'commercialOrder.dispatch_contact_name')
  || '-'
)

const deliveryContactPhone = (document) => (
  nested(document, 'metadata.dispatch_contact_phone')
  || nested(document, 'commercial_order.dispatch_contact_phone')
  || nested(document, 'commercialOrder.dispatch_contact_phone')
  || nested(document, 'client.phone')
  || nested(document, 'eventual_client.phone')
  || nested(document, 'eventualClient.phone')
  || '-'
)

const deliveryReference = (document) => (
  nested(document, 'metadata.delivery_reference')
  || nested(document, 'commercial_order.delivery_reference')
  || nested(document, 'commercialOrder.delivery_reference')
  || '-'
)

const sourceCode = (document) => (
  nested(document, 'metadata.source_code')
  || nested(document, 'commercial_order.code')
  || nested(document, 'commercialOrder.code')
  || nested(document, 'service_order.code')
  || nested(document, 'serviceOrder.code')
  || '-'
)

const normalizeQuantity = (value) => {
  const number = Number(value || 0)
  return Number.isInteger(number) ? number.toFixed(4) : number.toFixed(4)
}

const smallNumberToWords = (value) => {
  const units = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
  const specials = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve']
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

  if (value < 10) return units[value]
  if (value < 20) return specials[value - 10]
  if (value === 20) return 'veinte'
  if (value < 30) return `veinti${units[value - 20]}`
  if (value < 100) {
    const ten = Math.floor(value / 10)
    const unit = value % 10
    return unit ? `${tens[ten]} y ${units[unit]}` : tens[ten]
  }
  if (value === 100) return 'cien'
  const hundred = Math.floor(value / 100)
  const remainder = value % 100
  return remainder ? `${hundreds[hundred]} ${smallNumberToWords(remainder)}` : hundreds[hundred]
}

const numberToWords = (value) => {
  const number = Math.max(0, Math.floor(Number(value || 0)))
  if (number < 1000) return smallNumberToWords(number)
  if (number < 1000000) {
    const thousands = Math.floor(number / 1000)
    const remainder = number % 1000
    const prefix = thousands === 1 ? 'mil' : `${smallNumberToWords(thousands)} mil`
    return remainder ? `${prefix} ${smallNumberToWords(remainder)}` : prefix
  }
  const millions = Math.floor(number / 1000000)
  const remainder = number % 1000000
  const prefix = millions === 1 ? 'un millon' : `${numberToWords(millions)} millones`
  return remainder ? `${prefix} ${numberToWords(remainder)}` : prefix
}

const amountInWords = (amount, currency = 'PEN') => {
  const total = Number(amount || 0)
  const integer = Math.floor(Math.abs(total))
  const cents = Math.round((Math.abs(total) - integer) * 100)
  const currencyLabel = `${currency}`.toUpperCase() === 'PEN' ? 'SOLES' : `${currency}`.toUpperCase()
  return `IMPORTE EN LETRAS: ${numberToWords(integer).toUpperCase()} CON ${String(cents).padStart(2, '0')}/100 ${currencyLabel}`
}

const ensurePdf = () => {
  const JsPDF = window.jspdf?.jsPDF || window.jsPDF
  if (!JsPDF) throw new Error('jsPDF no esta disponible')
  const doc = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  if (!doc.autoTable) throw new Error('AutoTable no esta disponible')
  return doc
}

const withPdfViewerOptions = (url, zoom = 90) => [
  url,
  '#toolbar=1',
  '&navpanes=0',
  '&pagemode=none',
  '&scrollbar=1',
  `&zoom=${zoom}`,
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
      <div class="modal-content" style="height: min(780px, calc(100vh - 80px));">
        <div class="modal-header py-2">
          <h4 class="modal-title mb-0" data-pdf-title>Comprobante</h4>
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

const showPdfSourceInModal = (source, title, isBlob = false) => {
  const modal = ensurePdfModal()
  const iframe = modal.querySelector(`#${PDF_IFRAME_ID}`)
  const titleNode = modal.querySelector('[data-pdf-title]')

  if (!iframe) throw new Error('No se encontro el visor PDF')
  if (currentPdfBlobUrl) {
    URL.revokeObjectURL(currentPdfBlobUrl)
    currentPdfBlobUrl = null
  }

  if (isBlob) {
    currentPdfBlobUrl = URL.createObjectURL(source)
    iframe.src = withPdfViewerOptions(currentPdfBlobUrl)
  } else {
    iframe.src = withPdfViewerOptions(source)
  }

  titleNode.textContent = title
  $(modal).modal('show')
}

export const openPdfUrlInModal = (url, title = 'Comprobante PDF') => {
  showPdfSourceInModal(url, title, false)
}

const addTextRow = (doc, label, value, x, y, width) => {
  doc.setFont('helvetica', 'bold')
  doc.text(`${label} :`, x, y)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(asText(value, ''), width)
  doc.text(lines, x + 86, y)
  return Math.max(11, lines.length * 9)
}

const drawHeader = (doc, document) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 28
  const boxWidth = 182
  const companyName = nested(document, 'business.name', 'KAMARY PERU SAC')
  const companyAddress = nested(document, 'branch.address') || nested(document, 'business.address') || ''
  const companyRuc = nested(document, 'business.tax_number')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(companyName, margin, 35)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  if (companyAddress) doc.text(doc.splitTextToSize(companyAddress, 300), margin, 49)
  if (companyRuc) {
    doc.setFont('helvetica', 'bold')
    doc.text(`RUC ${companyRuc}`, margin, 78)
  }

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.8)
  doc.rect(pageWidth - margin - boxWidth, 24, boxWidth, 78)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(documentTitle(document.document_type), pageWidth - margin - (boxWidth / 2), 48, { align: 'center' })
  doc.setFontSize(11)
  doc.text(documentNumber(document), pageWidth - margin - (boxWidth / 2), 86, { align: 'center' })
}

const drawCustomerBlock = (doc, document) => {
  const margin = 28
  const startY = 124
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('DATOS DEL CLIENTE', margin, startY)
  doc.setFontSize(8)

  let y = startY + 18
  y += addTextRow(doc, 'DOCUMENTO', customerDocument(document), margin, y, 392)
  y += addTextRow(doc, 'DENOMINACION', customerName(document), margin, y, 392)
  y += addTextRow(doc, 'DIRECCION', customerAddress(document), margin, y, 392)

  const rightX = 360
  y = startY + 18
  y += addTextRow(doc, 'FECHA EMISION', asDate(document.issue_date), rightX, y, 130)
  y += addTextRow(doc, 'MONEDA', document.currency === 'PEN' ? 'Soles' : document.currency, rightX, y, 130)
  y += addTextRow(doc, 'FECHA VENCIMIENTO', asDate(document.due_date || document.issue_date), rightX, y, 130)
  addTextRow(doc, 'ORDEN DE COMPRA', nested(document, 'metadata.purchase_order', ''), rightX, y, 130)

  return 202
}

const tableRows = (document) => {
  const taxRate = Number(document.subtotal || 0) === 0 ? 0 : Math.max(0, Number(document.tax_amount || 0) / Number(document.subtotal || 1))
  const pricesIncludeTax = document.source_type === 'commercial_order' && taxRate > 0

  return (document.items ?? []).filter(item => item?.status !== false && item?.status !== 0).map((item) => {
    const quantity = Number(item.quantity || 0)
    const storedUnitPrice = Number(item.unit_price || 0)
    const storedTotal = Number(item.total || 0)
    const unitWithTax = pricesIncludeTax ? storedUnitPrice : storedUnitPrice * (1 + taxRate)
    const unitWithoutTax = pricesIncludeTax && taxRate > 0 ? storedUnitPrice / (1 + taxRate) : storedUnitPrice
    const totalWithTax = pricesIncludeTax ? storedTotal : storedTotal * (1 + taxRate)

    return [
      asText(item.item_code, ''),
      asText(item.description, ''),
      asText(item.metadata?.unit || item.metadata?.unit_code || 'UNIDAD', 'UNIDAD'),
      asText(item.metadata?.lot || item.item_code, '-'),
      asDate(item.metadata?.expiration_date),
      normalizeQuantity(quantity),
      asNumber(unitWithoutTax, 4),
      asNumber(unitWithTax, 4),
      asNumber(totalWithTax, 4),
    ]
  })
}

const drawTotals = (doc, document, y) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const currency = document.currency || 'PEN'
  const rows = [
    ['DESCUENTO GLOBAL', money(0, currency)],
    ['INAFECTO', money(0, currency)],
    ['GRAVADA', money(document.subtotal, currency)],
    [`IGV ${asNumber(Number(document.subtotal || 0) ? (Number(document.tax_amount || 0) / Number(document.subtotal || 1)) * 100 : 0)} %`, money(document.tax_amount, currency)],
    ['TOTAL', money(document.total, currency)],
  ]

  doc.autoTable({
    startY: y,
    body: rows,
    theme: 'plain',
    margin: { left: pageWidth - 210, right: 28 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'right', cellWidth: 110 },
      1: { halign: 'right', cellWidth: 72 },
    },
  })

  return doc.lastAutoTable.finalY + 12
}

const drawFooter = (doc, document, y) => {
  const margin = 28
  const currency = document.currency || 'PEN'
  const paymentLabel = [document.payment_method, document.payment_condition].filter(Boolean).join(' | ') || '-'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(amountInWords(document.total, currency), margin, y)
  y += 15
  doc.text(`FORMA DE PAGO AL FACTURAR: ${paymentLabel} ${money(document.total, currency)}`, margin, y)
  y += 18
  doc.text('OBSERVACIONES:', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(asText(document.observations, ''), margin + 76, y)

  y += 32
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DE ENTREGA', margin, y)
  y += 14
  doc.setFontSize(8)
  y += addTextRow(doc, 'NOMBRE', deliveryContactName(document), margin, y, 410)
  y += addTextRow(doc, 'CELULAR', deliveryContactPhone(document), margin, y, 410)
  y += addTextRow(doc, 'DIRECCION', customerAddress(document), margin, y, 410)
  y += addTextRow(doc, 'REFERENCIA', deliveryReference(document), margin, y, 410)
  y += addTextRow(doc, 'FORMA DE PAGO (REF)', paymentLabel, margin, y, 410)

  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(
    `Representacion impresa de la ${documentTitle(document.document_type).replace('\n', ' ')}, pedido ${sourceCode(document)}`,
    margin,
    y,
  )
}

export const openBillingVoucherPreviewPdf = (document) => {
  const doc = ensurePdf()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 28

  drawHeader(doc, document)
  const tableStartY = drawCustomerBlock(doc, document)
  doc.autoTable({
    startY: tableStartY,
    head: [['PRODUCTO', 'DESCRIPCION', 'MEDIDA', 'LOTE', 'F.V.', 'CANT.', 'P. SIN IGV', 'P. CON IGV', 'IMPORTE']],
    body: tableRows(document),
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 6.7, cellPadding: 3, lineColor: [170, 170, 170], lineWidth: 0.25, overflow: 'linebreak' },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [120, 120, 120] },
    columnStyles: {
      0: { cellWidth: 48 },
      1: { cellWidth: 126 },
      2: { cellWidth: 48 },
      3: { cellWidth: 52 },
      4: { cellWidth: 50 },
      5: { cellWidth: 42, halign: 'right' },
      6: { cellWidth: 54, halign: 'right' },
      7: { cellWidth: 54, halign: 'right' },
      8: { cellWidth: 54, halign: 'right' },
    },
  })

  let y = drawTotals(doc, document, doc.lastAutoTable.finalY + 8)
  if (y > 640) {
    doc.addPage()
    y = 40
  }
  drawFooter(doc, document, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(`Pagina 1 de ${doc.getNumberOfPages()}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 18, { align: 'right' })

  showPdfSourceInModal(doc.output('blob'), `Vista previa ${documentNumber(document)}`, true)
}
