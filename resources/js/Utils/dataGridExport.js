import { translateStatusText } from './statusLabels'

const toPromise = (deferred) => new Promise((resolve, reject) => {
  if (!deferred) {
    resolve()
    return
  }

  if (typeof deferred.done === 'function') {
    deferred.done(resolve)
    if (typeof deferred.fail === 'function') deferred.fail(reject)
    return
  }

  if (typeof deferred.then === 'function') {
    deferred.then(resolve, reject)
    return
  }

  resolve(deferred)
})

const sanitizeFileName = (name) => (name || 'reporte')
  .toString()
  .trim()
  .replace(/[\\/:*?"<>|]+/g, '-')
  .replace(/\s+/g, ' ')
  || 'reporte'

const textValue = (value) => {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(textValue).join('\n')
  if (value instanceof Date) return value.toLocaleDateString('es-PE')
  if (typeof value === 'object') return translateStatusText(JSON.stringify(value), '')
  return translateStatusText(String(value), '')
}

const notifyExportError = (error, type) => {
  console.error(error)
  if (window?.toastr?.error) {
    window.toastr.error(`No se pudo generar el archivo ${type}.`)
    return
  }
  window.alert(`No se pudo generar el archivo ${type}.`)
}

export const exportDataGridToExcel = async (e, { exportableName, customizeCell = () => { } } = {}) => {
  if (!window.ExcelJS || !window.DevExpress?.excelExporter || !window.saveAs) {
    throw new Error('ExcelJS, DevExpress.excelExporter o saveAs no estan disponibles')
  }

  const workbook = new window.ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Reporte')

  await window.DevExpress.excelExporter.exportDataGrid({
    worksheet,
    component: e.component,
    customizeCell: (options) => {
      customizeCell(options)
      options.excelCell.alignment = {
        horizontal: 'left',
        vertical: 'top',
        ...options.excelCell.alignment,
      }
    },
  })

  const buffer = await workbook.xlsx.writeBuffer()
  window.saveAs(
    new Blob([buffer], { type: 'application/octet-stream' }),
    `${sanitizeFileName(exportableName)}.xlsx`
  )
}

export const exportDataGridToPdf = async (e, { exportableName } = {}) => {
  const JsPDF = window.jspdf?.jsPDF || window.jsPDF
  if (!JsPDF || !JsPDF.API?.autoTable) {
    throw new Error('jsPDF o AutoTable no estan disponibles')
  }

  const doc = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const title = sanitizeFileName(exportableName)
  const provider = e.component.getDataProvider(Boolean(e.selectedRowsOnly))

  await toPromise(provider.ready())

  const rowsCount = provider.getRowsCount()
  const headerRowsCount = typeof provider.getHeaderRowCount === 'function'
    ? provider.getHeaderRowCount()
    : 1
  const columns = provider.getColumns() || []
  const head = []
  const body = []

  for (let rowIndex = 0; rowIndex < rowsCount; rowIndex++) {
    const target = rowIndex < headerRowsCount ? head : body
    const row = []

    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const cell = provider.getCellData(rowIndex, columnIndex, true)
      row.push(textValue(cell?.value))
    }

    target.push(row)
  }

  if (!head.length && columns.length) {
    head.push(columns.map((column) => textValue(column.caption || column.dataField || column.name)))
  }

  doc.setFontSize(12)
  doc.text(title, 24, 28)
  doc.autoTable({
    head,
    body,
    startY: 40,
    margin: { top: 40, right: 24, bottom: 24, left: 24 },
    styles: {
      fontSize: 7,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  })

  const pageCount = doc.internal.getNumberOfPages()
  const pageHeight = typeof doc.internal.pageSize.getHeight === 'function'
    ? doc.internal.pageSize.getHeight()
    : doc.internal.pageSize.height

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.text(`Pagina ${page} de ${pageCount}`, 24, pageHeight - 12)
  }

  doc.save(`${title}.pdf`)
}

export const handleDataGridExport = (e, options = {}) => {
  e.cancel = true

  if (e.format === 'pdf') {
    exportDataGridToPdf(e, options).catch((error) => notifyExportError(error, 'PDF'))
    return
  }

  exportDataGridToExcel(e, options).catch((error) => notifyExportError(error, 'Excel'))
}
