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
  if (normalized.includes('boleta')) return 'BOLETA DE VENTA\nELECTRÓNICA'
  if (normalized.includes('nota')) return 'NOTA DE CRÉDITO\nELECTRÓNICA'
  return 'FACTURA\nELECTRÓNICA'
}

const documentTitleSingleLine = (documentType) => documentTitle(documentType).replace('\n', ' ')

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

const normalizePaymentAccounts = (value) => {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch (error) {
      value = { lines: value.split(/\r?\n/) }
    }
  }
  if (!value || typeof value !== 'object') return null

  const title = asText(value.title, '').trim()
  const subtitle = asText(value.subtitle, '').trim()
  const lines = (Array.isArray(value.lines) ? value.lines : [])
    .map(line => asText(line, '').trim())
    .filter(Boolean)

  if (!title && !subtitle && lines.length === 0) return null
  return { title, subtitle, lines }
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

const drawBoxField = (doc, label, value, x, y, labelWidth = 82, valueWidth = 200) => {
  doc.setFont('helvetica', 'bold')
  doc.text(label, x, y)
  doc.text(':', x + labelWidth - 8, y)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(asText(value, ''), valueWidth)
  doc.text(lines, x + labelWidth, y)
  return Math.max(11, lines.length * 9)
}

const drawHeader = (doc, document) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  const boxWidth = 178
  const companyName = nested(document, 'business.name', 'KAMARY PERU SAC')
  const companyAddress = nested(document, 'branch.address') || nested(document, 'business.address') || ''
  const companyRuc = nested(document, 'business.tax_number')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(companyName, margin, 45)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  if (companyAddress) doc.text(doc.splitTextToSize(companyAddress, 330), margin, 65)

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.8)
  doc.rect(pageWidth - margin - boxWidth, 28, boxWidth, 78)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  if (companyRuc) doc.text(`RUC ${companyRuc}`, pageWidth - margin - (boxWidth / 2), 45, { align: 'center' })
  doc.text(documentTitle(document.document_type), pageWidth - margin - (boxWidth / 2), 64, { align: 'center' })
  doc.text(documentNumber(document), pageWidth - margin - (boxWidth / 2), 94, { align: 'center' })
}

const drawCustomerBlock = (doc, document) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  const startY = 124
  const leftWidth = 354
  const rightX = margin + leftWidth + 10
  const rightWidth = pageWidth - rightX - margin

  doc.setDrawColor(0, 0, 0)
  doc.rect(margin, startY, leftWidth, 76)
  doc.rect(rightX, startY, rightWidth, 76)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('DATOS DEL CLIENTE', margin + 5, startY + 13)
  doc.setFontSize(8)

  let y = startY + 26
  y += drawBoxField(doc, 'DOCUMENTO', customerDocument(document), margin + 5, y, 84, leftWidth - 96)
  y += drawBoxField(doc, 'DENOMINACIÓN', customerName(document), margin + 5, y, 84, leftWidth - 96)
  drawBoxField(doc, 'DIRECCIÓN', customerAddress(document), margin + 5, y, 84, leftWidth - 96)

  y = startY + 18
  y += drawBoxField(doc, 'FECHA EMISIÓN', asDate(document.issue_date), rightX + 5, y, 92, rightWidth - 104)
  y += drawBoxField(doc, 'MONEDA', document.currency === 'PEN' ? 'Soles' : document.currency, rightX + 5, y, 92, rightWidth - 104)
  y += drawBoxField(doc, 'FECHA VENCIMIENTO', asDate(document.due_date || document.issue_date), rightX + 5, y, 92, rightWidth - 104)
  drawBoxField(doc, 'ORDEN DE COMPRA', nested(document, 'metadata.purchase_order', ''), rightX + 5, y, 92, rightWidth - 104)

  return 224
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
  const margin = 40
  const currency = document.currency || 'PEN'
  const rate = Number(document.subtotal || 0) ? (Number(document.tax_amount || 0) / Number(document.subtotal || 1)) * 100 : 0
  const rows = [
    ['DESCUENTO GLOBAL', 0],
    ['INAFECTO', 0],
    ['GRAVADA', document.subtotal],
    [`IGV ${asNumber(rate)} %`, document.tax_amount],
    ['TOTAL', document.total],
  ]

  const labelX = pageWidth - margin - 152
  const symbolX = pageWidth - margin - 72
  const amountX = pageWidth - margin - 8

  doc.setFontSize(8)
  rows.forEach(([label, amount], index) => {
    const rowY = y + (index * 11)
    doc.setFont('helvetica', 'bold')
    doc.text(label, labelX, rowY, { align: 'right' })
    doc.text(currencySymbol(currency), symbolX, rowY)
    doc.text(asNumber(amount), amountX, rowY, { align: 'right' })
  })

  return y + rows.length * 11
}

const drawBankLine = (doc, line, x, y, width) => {
  const bankMatch = line.match(/^((?:Banco|Interbank)[^\d:]*)(.*)$/i)
  if (!bankMatch) {
    doc.setFont('helvetica', 'normal')
    const wrapped = doc.splitTextToSize(line, width)
    doc.text(wrapped, x, y)
    return Math.max(9, wrapped.length * 9)
  }

  const [, bank, number] = bankMatch
  doc.setFont('helvetica', 'bold')
  doc.text(bank.trim(), x, y)
  const bankWidth = doc.getTextWidth(bank.trim())
  doc.setFont('helvetica', 'normal')
  doc.text(number.trim(), x + bankWidth + 3, y)
  return 9
}

const drawPaymentAccountsBox = (doc, document, x, y, width, height) => {
  const accounts = normalizePaymentAccounts(
    nested(document, 'business.payment_accounts') || nested(document, 'business.paymentAccounts')
  )
  doc.rect(x, y, width, height)
  if (!accounts?.lines?.length) return

  let cursorY = y + 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  if (accounts.title) {
    doc.text(accounts.title, x + 5, cursorY)
    cursorY += 10
  }
  if (accounts.subtitle) {
    doc.text(accounts.subtitle, x + 5, cursorY)
    cursorY += 10
  }

  doc.setFontSize(7.5)
  accounts.lines.forEach((line) => {
    cursorY += drawBankLine(doc, line, x + 5, cursorY, width - 10)
  })
}

const drawDeliveryBox = (doc, document, x, y, width, height, paymentLabel) => {
  doc.rect(x, y, width, height)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('DATOS DE ENTREGA', x + (width / 2), y + 14, { align: 'center' })

  let cursorY = y + 30
  cursorY += drawBoxField(doc, 'NOMBRE', deliveryContactName(document), x + 5, cursorY, 92, width - 104)
  cursorY += drawBoxField(doc, 'CELULAR', deliveryContactPhone(document), x + 5, cursorY, 92, width - 104)
  cursorY += drawBoxField(doc, 'DIRECCIÓN', customerAddress(document), x + 5, cursorY, 92, width - 104)
  cursorY += drawBoxField(doc, 'REFERENCIA', deliveryReference(document), x + 5, cursorY, 92, width - 104)
  drawBoxField(doc, 'FORMA DE PAGO (REF)', paymentLabel, x + 5, cursorY, 92, width - 104)
}

const drawPaymentAndObservations = (doc, document, y) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  const paymentLabel = [document.payment_method, document.payment_condition].filter(Boolean).join(' | ') || '-'
  const currency = document.currency || 'PEN'

  doc.rect(margin, y, pageWidth - (margin * 2), 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('FORMA DE PAGO AL FACTURAR:', margin + 5, y + 13)
  doc.setFont('helvetica', 'normal')
  doc.text(`${paymentLabel} ${money(document.total, currency)}`, margin + 160, y + 13)

  y += 32
  const observations = asText(document.observations, '')
  const observationLines = doc.splitTextToSize(observations, pageWidth - (margin * 2) - 92)
  const observationHeight = Math.max(20, observationLines.length * 10 + 10)
  doc.rect(margin, y, pageWidth - (margin * 2), observationHeight)
  doc.setFont('helvetica', 'bold')
  doc.text('OBSERVACIONES:', margin + 5, y + 13)
  doc.setFont('helvetica', 'normal')
  if (observations) doc.text(observationLines, margin + 92, y + 13)

  return y + observationHeight + 12
}

const paymentAccountsBoxHeight = (document) => {
  const accounts = normalizePaymentAccounts(
    nested(document, 'business.payment_accounts') || nested(document, 'business.paymentAccounts')
  )
  return Math.max(92, 22 + ((accounts?.title ? 1 : 0) + (accounts?.subtitle ? 1 : 0) + (accounts?.lines?.length ?? 0)) * 10)
}

const drawFooterBoxes = (doc, document, y) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  const paymentLabel = [document.payment_method, document.payment_condition].filter(Boolean).join(' | ') || '-'
  const boxGap = 10
  const boxWidth = (pageWidth - (margin * 2) - boxGap) / 2
  const boxHeight = Math.max(92, paymentAccountsBoxHeight(document))

  drawPaymentAccountsBox(doc, document, margin, y, boxWidth, boxHeight)
  drawDeliveryBox(doc, document, margin + boxWidth + boxGap, y, boxWidth, boxHeight, paymentLabel)

  y += boxHeight + 12
  const legendHeight = 54
  doc.rect(margin, y, pageWidth - (margin * 2), legendHeight)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('Representacion impresa de la ', margin + 5, y + 18)
  doc.setFont('helvetica', 'bold')
  doc.text(documentTitleSingleLine(document.document_type), margin + 122, y + 18)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `, pedido ${sourceCode(document)}`,
    margin + 122 + doc.getTextWidth(documentTitleSingleLine(document.document_type)),
    y + 18,
  )

  return y + legendHeight
}

export const openBillingVoucherPreviewPdf = (document) => {
  const doc = ensurePdf()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40

  drawHeader(doc, document)
  const tableStartY = drawCustomerBlock(doc, document)
  const tableWidth = pageWidth - (margin * 2)
  doc.autoTable({
    startY: tableStartY,
    head: [['PRODUCTO', 'DESCRIPCION', 'MEDIDA', 'LOTE', 'F.V.', 'CANT.', 'P. SIN IGV', 'P. CON IGV', 'IMPORTE']],
    body: tableRows(document),
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: { fontSize: 6.7, cellPadding: 3, lineColor: [120, 120, 120], lineWidth: 0, overflow: 'linebreak' },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: { bottom: 0.5 } },
    columnStyles: {
      0: { cellWidth: 52 },
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

  const tableEndY = doc.lastAutoTable.finalY
  const totalsStartY = Math.max(tableEndY + 18, tableStartY + 72)
  const totalsEndY = drawTotals(doc, document, totalsStartY)
  const tableBoxBottom = Math.max(totalsEndY + 26, tableEndY + 44)
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.8)
  doc.rect(margin, tableStartY, tableWidth, tableBoxBottom - tableStartY)
  doc.line(margin + 5, tableEndY + 5, margin + tableWidth - 5, tableEndY + 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(amountInWords(document.total, document.currency || 'PEN'), margin, tableBoxBottom - 9)

  let y = tableBoxBottom + 12
  if (y > 620) {
    doc.addPage()
    y = 40
  }
  y = drawPaymentAndObservations(doc, document, y)
  if (y + Math.max(92, paymentAccountsBoxHeight(document)) + 75 > doc.internal.pageSize.getHeight()) {
    doc.addPage()
    y = 40
  }
  drawFooterBoxes(doc, document, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(`Pagina 1 de ${doc.getNumberOfPages()}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 18, { align: 'right' })

  showPdfSourceInModal(doc.output('blob'), `Vista previa ${documentNumber(document)}`, true)
}
