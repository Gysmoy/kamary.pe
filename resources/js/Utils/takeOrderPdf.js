import { toast } from 'sonner'

const PDF_MODAL_ID = 'take-order-pdf-modal'
const PDF_IFRAME_ID = 'take-order-pdf-frame'
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

const asMoney = (value) => Number(value || 0).toFixed(2)

const asQuantity = (value) => {
  const number = Number(value || 0)
  return Number.isInteger(number) ? `${number}` : number.toFixed(3)
}

const customerName = (data) => (
  nested(data, 'client.full_name')
  || nested(data, 'eventual_client.business_name')
  || nested(data, 'eventualClient.business_name')
  || '-'
)

const customerDocument = (data) => (
  nested(data, 'client.document_number')
  || nested(data, 'eventual_client.document_number')
  || nested(data, 'eventualClient.document_number')
  || '-'
)

const customerAddress = (data) => (
  data?.delivery_address
  || nested(data, 'client.full_address')
  || nested(data, 'eventual_client.address')
  || nested(data, 'eventualClient.address')
  || '-'
)

const customerPhone = (data) => (
  data?.dispatch_contact_phone
  || nested(data, 'client.phone')
  || nested(data, 'eventual_client.phone')
  || nested(data, 'eventualClient.phone')
  || '-'
)

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
  '&zoom=85',
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
    <div class="modal-dialog modal-dialog-centered" style="width: 980px; max-width: calc(100vw - 64px);">
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

const showPdfInModal = (doc, data) => {
  const modal = ensurePdfModal()
  const iframe = modal.querySelector(`#${PDF_IFRAME_ID}`)
  const title = modal.querySelector('[data-pdf-title]')

  if (!iframe) throw new Error('No se encontro el visor PDF')
  if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl)

  currentPdfBlobUrl = URL.createObjectURL(doc.output('blob'))
  title.textContent = `Toma pedido${data?.code ? ` - ${data.code}` : ''}`
  iframe.src = withPdfViewerOptions(currentPdfBlobUrl)
  $(modal).modal('show')
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

const amountInWords = (amount, currency) => {
  const total = Number(amount || 0)
  const integer = Math.floor(total)
  const cents = Math.round((total - integer) * 100)
  return `SON: ${numberToWords(integer).toUpperCase()} CON ${String(cents).padStart(2, '0')}/100 ${currency || 'PEN'}`
}

const drawHeader = (doc, data) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 36
  const companyName = nested(data, 'business.trade_name') || nested(data, 'business.name') || 'KAMARY PERU SAC'
  const companyRuc = nested(data, 'business.tax_number')
  const branchAddress = nested(data, 'branch.address') || nested(data, 'business.description')
  const branchPhone = nested(data, 'branch.telephone')
  const branchEmail = nested(data, 'branch.email')

  doc.setDrawColor(60, 60, 60)
  doc.setLineWidth(0.8)
  doc.rect(margin, 32, pageWidth - (margin * 2), 82)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(companyName, margin + 12, 52)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  if (companyRuc) doc.text(`RUC: ${companyRuc}`, margin + 12, 66)
  if (branchAddress) doc.text(doc.splitTextToSize(branchAddress, 285), margin + 12, 79)
  if (branchPhone || branchEmail) doc.text([branchPhone, branchEmail].filter(Boolean).join(' | '), margin + 12, 104)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('COTIZACION', pageWidth - margin - 120, 58, { align: 'center' })
  doc.setFontSize(11)
  doc.text(asText(data?.code, 'SIN CODIGO'), pageWidth - margin - 120, 80, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Fecha: ${asDate(data?.issue_date || data?.created_at)}`, pageWidth - margin - 120, 99, { align: 'center' })
}

const drawCustomerBlock = (doc, data, startY) => {
  const margin = 36
  const pageWidth = doc.internal.pageSize.getWidth()
  const rows = [
    ['Cliente', customerName(data), 'Documento', customerDocument(data)],
    ['Direccion', customerAddress(data), 'Telefono', customerPhone(data)],
    ['Forma pago', data?.payment_condition || data?.payment_method, 'Moneda', data?.currency || 'PEN'],
    ['F. entrega', asDate(data?.promised_delivery_at), 'O. compra', data?.purchase_order || '-'],
  ]

  doc.autoTable({
    startY,
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4, lineColor: [70, 70, 70], lineWidth: 0.3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 68, fillColor: [242, 244, 247] },
      1: { cellWidth: 252 },
      2: { fontStyle: 'bold', cellWidth: 70, fillColor: [242, 244, 247] },
      3: { cellWidth: pageWidth - (margin * 2) - 390 },
    },
    margin: { left: margin, right: margin },
  })

  return doc.lastAutoTable.finalY + 14
}

const renderTakeOrderPdf = (doc, data) => {
  const margin = 36
  const pageWidth = doc.internal.pageSize.getWidth()
  const currency = data?.currency || 'PEN'
  const items = data?.items ?? []

  drawHeader(doc, data)
  let y = drawCustomerBlock(doc, data, 130)

  const rows = items.length ? items.map((item) => {
    const product = [
      nested(item, 'article.code'),
      nested(item, 'article.name', 'Articulo'),
    ].filter(Boolean).join(' - ')

    return [
      product,
      nested(item, 'presentation.name') || nested(item, 'article.unit.symbol') || nested(item, 'article.unit.name') || '-',
      item?.lot || '-',
      asDate(item?.expiration_date),
      asQuantity(item?.quantity),
      asMoney(item?.price_unit),
      asMoney(item?.total),
    ]
  }) : [['Sin detalle', '-', '-', '-', '-', '-', '-']]

  doc.autoTable({
    startY: y,
    head: [['PRODUCTO', 'MEDIDA', 'LOTE', 'F.V.', 'CANT.', 'PRECIO', 'IMPORTE']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 4, lineColor: [70, 70, 70], lineWidth: 0.25, overflow: 'linebreak' },
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 210 },
      1: { cellWidth: 70 },
      2: { halign: 'center', cellWidth: 58 },
      3: { halign: 'center', cellWidth: 58 },
      4: { halign: 'right', cellWidth: 52 },
      5: { halign: 'right', cellWidth: 58 },
      6: { halign: 'right', cellWidth: 64 },
    },
    margin: { left: margin, right: margin },
  })

  y = doc.lastAutoTable.finalY + 14
  const subtotal = Number(data?.subtotal ?? items.reduce((sum, item) => sum + Number(item?.total || 0), 0))
  const taxAmount = Number(data?.tax_amount || 0)
  const total = Number(data?.total ?? subtotal + taxAmount)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const amountLines = doc.splitTextToSize(amountInWords(total, currency), pageWidth - (margin * 2) - 175)
  doc.text(amountLines, margin, y + 8)

  doc.autoTable({
    startY: y,
    body: [
      ['GRAVADA', asMoney(subtotal)],
      ['IGV', asMoney(taxAmount)],
      ['TOTAL', asMoney(total)],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, lineColor: [70, 70, 70], lineWidth: 0.3 },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'right', cellWidth: 75, fillColor: [242, 244, 247] },
      1: { halign: 'right', cellWidth: 80 },
    },
    margin: { left: pageWidth - margin - 155, right: margin },
  })

  y = Math.max(doc.lastAutoTable.finalY + 22, y + (amountLines.length * 10) + 22)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('OBSERVACIONES:', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const observations = [
    data?.delivery_reference ? `Referencia: ${data.delivery_reference}` : '',
    data?.referral_guide ? `Guia remision: ${data.referral_guide}` : '',
    data?.observations || '',
  ].filter(Boolean).join('\n')
  doc.text(doc.splitTextToSize(observations || '-', pageWidth - (margin * 2) - 100), margin + 92, y)

  const footerY = doc.internal.pageSize.getHeight() - 48
  doc.setDrawColor(80, 80, 80)
  doc.line(margin, footerY - 18, margin + 180, footerY - 18)
  doc.line(pageWidth - margin - 180, footerY - 18, pageWidth - margin, footerY - 18)
  doc.setFontSize(8)
  doc.text('VENDEDOR', margin + 90, footerY, { align: 'center' })
  doc.text('CLIENTE', pageWidth - margin - 90, footerY, { align: 'center' })
}

export const openTakeOrderPdf = async (data) => {
  try {
    const doc = ensurePdf()
    renderTakeOrderPdf(doc, data)
    showPdfInModal(doc, data)
  } catch (error) {
    toast.error('No se pudo generar el PDF', {
      description: error.message,
      duration: 3500,
      richColors: true,
    })
  }
}
