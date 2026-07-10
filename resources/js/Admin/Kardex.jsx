import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '../Components/Adminto/VdTable';
import VdSelect from '../Components/Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
import KardexRest from '../Actions/Admin/KardexRest';
import { isMagistralesPath, isStoragePath, scopedPermission } from '../Utils/permissionScope';
import Swal from 'sweetalert2';

const kardexRest = new KardexRest()

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const formatQty = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
const formatDate = (value) => {
  if (!value) return '-'
  const text = value.toString().slice(0, 10)
  if (!text || text === '0000-00-00') return text || '-'
  const date = new Date(`${text}T00:00:00`)
  if (Number.isNaN(date.getTime())) return text
  return date.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
const formatDateIso = (value) => {
  if (!value) return '-'
  const text = value.toString().slice(0, 10)
  if (!text || text === '0000-00-00') return '-'
  return text
}
const formatDateTime = (value) => {
  if (!value) return '0000-00-00 00:00:00'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
const currentMonth = () => new Date().toISOString().slice(0, 7)
const firstMonthOfCurrentYear = () => `${new Date().getFullYear()}-01`
const monthFromDate = (value, fallback = currentMonth()) => value ? `${value}`.slice(0, 7) : fallback
const monthStartDate = (month) => month ? `${month}-01` : null
const monthEndDate = (month) => {
  if (!month) return null
  const [year, rawMonth] = month.split('-').map(Number)
  if (!year || !rawMonth) return null
  return new Date(year, rawMonth, 0).toISOString().slice(0, 10)
}
const nested = (source, path, fallback = '') => {
  const value = path.split('.').reduce((current, key) => current?.[key], source)
  return value ?? fallback
}
const asDate = (value) => value ? `${value}`.slice(0, 10) : '-'
const documentStatusLabel = (type, data) => {
  const status = type === 'entry_note'
    ? data?.entry_status
    : (type === 'purchase_receipt' ? data?.receipt_status : data?.exit_status)
  return {
    approved: 'Completado',
    confirmed: 'Completado',
    pending: 'Pendiente',
    draft: 'Borrador',
    cancelled: 'Anulado',
  }[status] ?? (status || '-')
}
const documentPdfTitle = (type, data) => ({
  entry_note: `NOTA DE ENTRADA: ${data?.code || data?.id || ''}`,
  purchase_receipt: `RECEPCION DE COMPRA: ${data?.code || data?.id || ''}`,
  exit_note: `NOTA DE SALIDA: ${data?.code || data?.id || ''}`,
}[type] || `DOCUMENTO: ${data?.code || data?.id || ''}`)
const sourceItemQuantity = (item) => Number(item?.quantity ?? item?.received_quantity ?? 0)
const sourceItemUnitCost = (item) => {
  const total = Number(item?.total ?? 0)
  const quantity = sourceItemQuantity(item)
  return Number(item?.cost_unit ?? (quantity ? total / quantity : 0))
}
const sourceItemTotal = (item) => {
  const explicit = item?.total
  if (explicit !== null && explicit !== undefined && explicit !== '') return Number(explicit)
  return sourceItemUnitCost(item) * sourceItemQuantity(item)
}
const pdfImageCache = new Map()
const formatPdfDate = (date) => {
  const day = `${date.getDate()}`.padStart(2, '0')
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${day}-${month}-${date.getFullYear()}`
}
const formatPdfTime = (date) => [
  date.getHours(),
  date.getMinutes(),
  date.getSeconds(),
].map(part => `${part}`.padStart(2, '0')).join(':')
const loadPdfImageAsPng = (source) => {
  const url = new URL(source, window.location.href).href
  if (pdfImageCache.has(url)) return pdfImageCache.get(url)

  const promise = new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth || image.width
        canvas.height = image.naturalHeight || image.height
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      } catch (error) {
        reject(error)
      }
    }
    image.onerror = reject
    image.src = url
  })

  pdfImageCache.set(url, promise)
  return promise
}
const drawKardexDocumentLogo = async (doc, x, y, width, height) => {
  try {
    const dataUrl = await loadPdfImageAsPng('/assets/img/grupo-kamary-logo.jpg')
    doc.addImage(dataUrl, 'PNG', x, y, width, height)
  } catch {
    doc.setFillColor(245, 247, 250)
    doc.rect(x, y, width, height, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(210, 28, 38)
    doc.text('GRUPO KAMARY', x + (width / 2), y + (height / 2) + 3, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }
}

const StandardKardex = ({ fixedWarehouse = null, session = null }) => {
  const tableRef = useRef()
  const movementModalRef = useRef()

  const [laboratories, setLaboratories] = useState([])
  const [articles, setArticles] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [exporting, setExporting] = useState(false)

  const [laboratoryId, setLaboratoryId] = useState('')
  const [articleId, setArticleId] = useState('')
  // En Magistrales el almacen es fijo: inicializarlo desde el inicio evita una
  // primera carga del grid con warehouse_id vacio que luego se aborta (ERR_ABORTED).
  const [warehouseId, setWarehouseId] = useState(isMagistralesPath() && fixedWarehouse?.id ? `${fixedWarehouse.id}` : '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [movementRows, setMovementRows] = useState([])
  const [movementTitle, setMovementTitle] = useState('')
  const [movementContext, setMovementContext] = useState(null)
  const [movementStartMonth, setMovementStartMonth] = useState('')
  const [movementEndMonth, setMovementEndMonth] = useState('')
  const [movementLoading, setMovementLoading] = useState(false)
  const [detailRows, setDetailRows] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const isMagistrales = isMagistralesPath()
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const fixedWarehouseLabel = [fixedWarehouse?.branch_name, fixedWarehouse?.name].filter(Boolean).join(' - ') || 'Almacen fijo de Magistrales'

  useEffect(() => {
    const load = async () => {
      const [labsData, articlesData, warehousesData] = await Promise.all([
        kardexRest.getLaboratories(),
        kardexRest.getArticles(),
        (!isMagistrales || !fixedWarehouseId) ? kardexRest.getWarehouses() : Promise.resolve([]),
      ])
      setLaboratories((labsData ?? []).filter(item => item.status !== null))
      setArticles((articlesData ?? []).filter(item => item.status !== null))
      setWarehouses(isMagistrales && fixedWarehouseId
        ? [fixedWarehouse].filter(Boolean)
        : (warehousesData ?? []).filter(item => item.status !== null))
      if (isMagistrales && fixedWarehouseId) setWarehouseId(fixedWarehouseId)
    }
    load()
  }, [fixedWarehouse, fixedWarehouseId, isMagistrales])

  useEffect(() => {
    kardexRest.setFilters({
      business_id: '',
      business_branch_id: '',
      laboratory_id: laboratoryId || '',
      article_id: articleId || '',
      warehouse_id: warehouseId || '',
      section: isMagistrales ? 'kardex' : 'products',
      client_id: '',
      stock_mode: 'with_stock',
    })
    tableRef.current?.refresh()
  }, [laboratoryId, articleId, warehouseId, isMagistrales])

  const selectedArticle = useMemo(
    () => articles.find(item => `${item.id}` === `${articleId}`),
    [articles, articleId]
  )

  const loadDetailMovements = useCallback(async () => {
    if (isMagistrales || !articleId) {
      setDetailRows([])
      return
    }

    setDetailLoading(true)
    const rows = await kardexRest.getMovements({
      article_id: articleId,
      warehouse_id: warehouseId || null,
      start_date: startDate || null,
      end_date: endDate || null,
    })
    setDetailRows(rows)
    setDetailLoading(false)
  }, [articleId, endDate, isMagistrales, startDate, warehouseId])

  useEffect(() => {
    loadDetailMovements()
  }, [loadDetailMovements])

  const loadMovementRows = async (row = movementContext, startMonth = movementStartMonth, endMonth = movementEndMonth) => {
    if (!row?.article_id) return
    const request = {
      article_id: row.article_id,
      warehouse_id: row.warehouse_id || warehouseId || null,
    }
    if (!isMagistrales) {
      request.start_date = monthStartDate(startMonth) || startDate || null
      request.end_date = monthEndDate(endMonth) || endDate || null
    }
    setMovementLoading(true)
    const rows = await kardexRest.getMovements(request)
    setMovementRows(rows)
    setMovementLoading(false)
  }

  const openMovements = async (row) => {
    const nextStartMonth = monthFromDate(startDate, firstMonthOfCurrentYear())
    const nextEndMonth = monthFromDate(endDate, currentMonth())
    setMovementRows([])
    setMovementContext(row)
    setMovementStartMonth(nextStartMonth)
    setMovementEndMonth(nextEndMonth)
    setMovementTitle(`${row.article_code ?? ''} | ${row.article_name ?? ''}`.trim())
    $(movementModalRef.current).modal('show')
    await loadMovementRows(row, nextStartMonth, nextEndMonth)
  }

  const openDocument = async (row) => {
    if (!row?.source_type || !row?.source_id) {
      if (row?.document_url) window.open(row.document_url, '_blank', 'noopener')
      return
    }

    const popup = window.open('', '_blank')
    if (!popup) {
      await Swal.fire({ icon: 'warning', title: 'Ventana bloqueada', text: 'Permite ventanas emergentes para abrir el PDF.' })
      return
    }
    popup.opener = null
    popup.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Generando PDF...</p>')

    const detail = await kardexRest.getDocument(row.source_type, row.source_id)
    const data = detail?.document
    if (detail?.file_url) {
      popup.location.href = detail.file_url
      return
    }
    if (!data) {
      if (row.document_url) {
        popup.location.href = row.document_url
      } else {
        popup.close()
      }
      return
    }

    const JsPDF = window.jspdf?.jsPDF || window.jsPDF
    if (!JsPDF) {
      popup.close()
      await Swal.fire({ icon: 'error', title: 'PDF no disponible', text: 'jsPDF no esta cargado.' })
      return
    }
    const doc = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    if (!doc.autoTable) {
      popup.close()
      await Swal.fire({ icon: 'error', title: 'PDF no disponible', text: 'AutoTable no esta cargado.' })
      return
    }

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 42
    const now = new Date()
    const userLabel = session?.username || session?.fullname || session?.name || ''

    await drawKardexDocumentLogo(doc, margin + 2, 36, 76, 43)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Fecha de impresión: ${formatPdfDate(now)}`, pageWidth - margin, 40, { align: 'right' })
    doc.text(`Hora de impresión: ${formatPdfTime(now)}`, pageWidth - margin, 53, { align: 'right' })
    doc.text(`Usuario de impresión: ${userLabel || '-'}`, pageWidth - margin, 66, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(documentPdfTitle(row.source_type, data), pageWidth / 2, 122, { align: 'center' })

    const leftRows = row.source_type === 'exit_note'
      ? [
        ['Fecha Emisión', asDate(data?.exit_date || data?.created_at)],
        ['Tipo Documento', data?.document_type || 'Salida'],
        ['Serie', data?.document_series || '-'],
        ['Observacion', data?.observations || ''],
      ]
      : [
        ['Fecha Emisión', asDate(data?.entry_date || data?.issue_date || data?.created_at)],
        ['Tipo Documento', data?.document_type || '-'],
        ['Serie Guía', data?.guide_series || data?.document_series || '-'],
        ['Observacion', data?.observations || ''],
      ]
    const rightRows = row.source_type === 'exit_note'
      ? [
        ['Cliente', data?.client_name || nested(data, 'client.full_name')],
        ['Documento', [data?.document_series, data?.document_sequence].filter(Boolean).join('-')],
        ['Almacen', nested(data, 'warehouse.name')],
        ['Estado', documentStatusLabel(row.source_type, data)],
      ]
      : [
        ['RUC | Proveedor', [nested(data, 'supplier.ruc'), nested(data, 'supplier.business_name')].filter(Boolean).join(' | ')],
        ['RUC Guía', data?.guide_ruc || nested(data, 'supplier.ruc')],
        ['Secuencia Guía', data?.guide_sequence || data?.document_sequence || '-'],
        ['Estado', documentStatusLabel(row.source_type, data)],
      ]

    const drawMetaRows = (rows, x, y, valueWidth) => {
      let currentY = y
      rows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(label, x, currentY)
        doc.text(':', x + 78, currentY)
        const lines = doc.splitTextToSize(`${value ?? '-'}`, valueWidth)
        doc.text(lines, x + 86, currentY)
        currentY += Math.max(13, lines.length * 10)
      })
      return currentY
    }
    const leftBottom = drawMetaRows(leftRows, margin + 2, 150, 164)
    const rightBottom = drawMetaRows(rightRows, 316, 150, pageWidth - margin - 402)
    const tableStartY = Math.max(206, leftBottom, rightBottom) + 24

    const rows = (data?.items ?? []).map(item => [
      [item?.batch_code || item?.lot || '-', item?.id ? `${item.id}` : ''].filter(Boolean).join('\n'),
      nested(item, 'article.name', 'Articulo'),
      [nested(item, 'article.laboratory.name'), nested(item, 'article.active_principle.name') || nested(item, 'article.activePrinciple.name')].filter(Boolean).join(' | '),
      nested(item, 'article.unit.symbol') || nested(item, 'article.unit.name'),
      nested(item, 'warehouse.name') || nested(data, 'warehouse.name'),
      sourceItemUnitCost(item).toFixed(6),
      sourceItemQuantity(item).toFixed(3),
      sourceItemTotal(item).toFixed(4),
    ])

    doc.autoTable({
      startY: tableStartY,
      head: [['CODIGO LOTE', 'ARTICULO', 'LABORATORIO | PRINCIPIO ACTIVO', 'U. MEDIDA', 'ALMACEN', 'P. COSTO', 'CANT.', 'TOTAL']],
      body: rows.length ? rows : [['Sin detalle', '', '', '', '', '', '', '']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.55, valign: 'middle', overflow: 'linebreak' },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.85 },
      columnStyles: {
        0: { cellWidth: 62, halign: 'center' },
        1: { cellWidth: 93, halign: 'center' },
        2: { cellWidth: 100, halign: 'center' },
        3: { cellWidth: 52, halign: 'center' },
        4: { cellWidth: 76, halign: 'center' },
        5: { cellWidth: 50, halign: 'right' },
        6: { cellWidth: 40, halign: 'right' },
        7: { cellWidth: 50, halign: 'right' },
      },
      margin: { left: margin, right: 30 },
    })

    const url = URL.createObjectURL(doc.output('blob'))
    popup.location.href = `${url}#toolbar=1&navpanes=0&pagemode=none`
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  // Columnas VdTable (Magistrales): el backend de este endpoint no expone
  // stock_min/stock_max/currency (nunca lo hizo con dxDataGrid tampoco), por
  // eso se preservan mostrando 0.000 / vacio, igual que antes.
  const magistralesVdColumns = [
    { key: 'article_code', label: 'Codigo', field: 'article_code', width: '110px' },
    { key: 'article_name', label: 'Nombre', field: 'article_name' },
    {
      key: 'stock', label: 'Stock', field: 'stock', width: '100px', align: 'right', nowrap: true,
      render: (row) => Number(row.stock ?? 0).toFixed(3),
    },
    { key: 'unit_label', label: 'Und', field: 'unit_label', width: '80px' },
    {
      key: 'stock_min', label: 'Min', field: 'stock_min', width: '80px', align: 'right', nowrap: true,
      render: (row) => Number(row.stock_min ?? 0).toFixed(3),
    },
    {
      key: 'stock_max', label: 'Max', field: 'stock_max', width: '80px', align: 'right', nowrap: true,
      render: (row) => Number(row.stock_max ?? 0).toFixed(3),
    },
    { key: 'currency', label: 'Moneda', field: 'currency', width: '90px' },
    {
      key: 'cost_unit', label: 'Costo Unitario', field: 'cost_unit', width: '130px', align: 'right', nowrap: true,
      render: (row) => Number(row.cost_unit ?? 0).toFixed(4),
    },
    {
      key: 'total_cost', label: 'Total Costo', field: 'total_cost', width: '130px', align: 'right', nowrap: true,
      render: (row) => Number(row.total_cost ?? 0).toFixed(2),
    },
    { key: 'warehouse_name', label: 'Almacen', field: 'warehouse_name', width: '150px' },
  ]

  const movementColumns = [
    { dataField: 'movement_date', caption: 'Fecha', minWidth: 140, dataType: 'datetime' },
    { dataField: 'movement_type', caption: 'Tipo', minWidth: 90 },
    { dataField: 'business_name', caption: 'Empresa', minWidth: 180 },
    { dataField: 'branch_name', caption: 'Sede', minWidth: 140 },
    { dataField: 'batch_code', caption: 'Codigo Lote', minWidth: 130 },
    { dataField: 'article_code', caption: 'Codigo', minWidth: 110 },
    { dataField: 'article_name', caption: 'Producto', minWidth: 220 },
    {
      dataField: 'lab_principle',
      caption: 'Laboratorio | Principio activo',
      minWidth: 250,
      calculateCellValue: (rowData) => `${rowData.laboratory_name || '-'} | ${rowData.principle_name || '-'}`
    },
    { dataField: 'unit_label', caption: 'Unidad', minWidth: 90 },
    { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 140 },
    { dataField: 'location', caption: 'Ubicacion', minWidth: 120 },
    { dataField: 'destination_location', caption: 'Ubi. Destino', minWidth: 120 },
    {
      dataField: 'quantity_in',
      caption: 'Entrada',
      minWidth: 100,
      cellTemplate: (container, { data }) => container.text(Number(data.quantity_in ?? 0).toFixed(3))
    },
    {
      dataField: 'quantity_out',
      caption: 'Salida',
      minWidth: 100,
      cellTemplate: (container, { data }) => container.text(Number(data.quantity_out ?? 0).toFixed(3))
    },
    {
      dataField: 'delta',
      caption: 'Movimiento',
      minWidth: 100,
      cellTemplate: (container, { data }) => {
        const qtyIn = Number(data.quantity_in ?? 0)
        const qtyOut = Number(data.quantity_out ?? 0)
        container.text((qtyIn - qtyOut).toFixed(3))
      }
    },
  ]

  const standardProductVdColumns = [
    { key: 'article_code', label: 'Codigo', field: 'article_code', width: '110px' },
    { key: 'article_name', label: 'Nombre', field: 'article_name' },
    { key: 'laboratory_name', label: 'Laboratorio', field: 'laboratory_name', width: '160px' },
    { key: 'principle_name', label: 'Principio activo', field: 'principle_name', width: '180px' },
    { key: 'unit_label', label: 'Und', field: 'unit_label', width: '80px' },
    {
      key: 'qty_in', label: 'Entradas', field: 'qty_in', width: '100px', align: 'right', nowrap: true,
      render: (row) => Number(row.qty_in ?? 0).toFixed(3),
    },
    {
      key: 'qty_out', label: 'Salidas', field: 'qty_out', width: '100px', align: 'right', nowrap: true,
      render: (row) => Number(row.qty_out ?? 0).toFixed(3),
    },
    {
      key: 'stock', label: 'Stock', field: 'stock', width: '100px', align: 'right', nowrap: true,
      render: (row) => Number(row.stock ?? 0).toFixed(3),
    },
    {
      key: 'cost_unit', label: 'Costo Unit.', field: 'cost_unit', width: '120px', align: 'right', nowrap: true,
      render: (row) => Number(row.cost_unit ?? 0).toFixed(4),
    },
    {
      key: 'total_cost', label: 'Total Val.', field: 'total_cost', width: '120px', align: 'right', nowrap: true,
      render: (row) => Number(row.total_cost ?? 0).toFixed(2),
    },
    { key: 'warehouse_name', label: 'Almacen', field: 'warehouse_name', width: '150px' },
  ]

  // Exportacion (loadAll + ExcelJS): este grid no tenia export antes (el
  // dxDataGrid original no pasaba exportable=true), se agrega ahora siguiendo
  // el mismo patron ya usado en InventoryReport.jsx.
  const kardexExportColumns = isMagistrales
    ? [
      ['Codigo', row => row.article_code ?? ''],
      ['Nombre', row => row.article_name ?? ''],
      ['Stock', row => Number(row.stock ?? 0)],
      ['Und', row => row.unit_label ?? ''],
      ['Min', row => Number(row.stock_min ?? 0)],
      ['Max', row => Number(row.stock_max ?? 0)],
      ['Moneda', row => row.currency ?? ''],
      ['Costo Unitario', row => Number(row.cost_unit ?? 0)],
      ['Total Costo', row => Number(row.total_cost ?? 0)],
      ['Almacen', row => row.warehouse_name ?? ''],
    ]
    : [
      ['Codigo', row => row.article_code ?? ''],
      ['Nombre', row => row.article_name ?? ''],
      ['Laboratorio', row => row.laboratory_name ?? ''],
      ['Principio activo', row => row.principle_name ?? ''],
      ['Und', row => row.unit_label ?? ''],
      ['Entradas', row => Number(row.qty_in ?? 0)],
      ['Salidas', row => Number(row.qty_out ?? 0)],
      ['Stock', row => Number(row.stock ?? 0)],
      ['Costo Unit.', row => Number(row.cost_unit ?? 0)],
      ['Total Val.', row => Number(row.total_cost ?? 0)],
      ['Almacen', row => row.warehouse_name ?? ''],
    ]

  const exportKardex = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const rows = await tableRef.current?.loadAll()
      if (!rows?.length) {
        await Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay filas para exportar', confirmButtonText: 'Entendido' })
        return
      }

      if (window.ExcelJS && window.saveAs) {
        const workbook = new window.ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Kardex')
        worksheet.addRow(kardexExportColumns.map(([label]) => label))
        rows.forEach(row => worksheet.addRow(kardexExportColumns.map(([, value]) => value(row))))
        worksheet.columns.forEach(column => { column.width = 18 })
        const buffer = await workbook.xlsx.writeBuffer()
        window.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'kardex.xlsx')
        return
      }

      const csv = [
        kardexExportColumns.map(([label]) => `"${label}"`).join(','),
        ...rows.map(row => kardexExportColumns.map(([, value]) => `"${`${value(row) ?? ''}`.replaceAll('"', '""')}"`).join(',')),
      ].join('\n')
      window.saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'kardex.csv')
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: error?.message || 'No se pudo exportar el kardex', confirmButtonText: 'Entendido' })
    } finally {
      setExporting(false)
    }
  }

  const kardexRenderCard = (row, actionButtons) => (
    <div className='vdt-card'>
      <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.article_name}</p>
          <small className='text-muted'>{[row.article_code, !isMagistrales && row.laboratory_name].filter(Boolean).join(' · ')}</small>
        </div>
        <span className='badge badge-soft-primary' style={{ whiteSpace: 'nowrap' }}>{Number(row.stock ?? 0).toFixed(3)} {row.unit_label}</span>
      </div>
      <small className='text-muted d-block mt-2'><i className='mdi mdi-warehouse me-1'></i>{row.warehouse_name}</small>
      {!isMagistrales && <div className='d-flex flex-wrap mt-2' style={{ gap: 12 }}>
        <small className='text-muted'>Entradas: <b>{Number(row.qty_in ?? 0).toFixed(3)}</b></small>
        <small className='text-muted'>Salidas: <b>{Number(row.qty_out ?? 0).toFixed(3)}</b></small>
      </div>}
      <div className='d-flex flex-wrap mt-1' style={{ gap: 12 }}>
        <small className='text-muted'>Costo unit.: <b>{Number(row.cost_unit ?? 0).toFixed(4)}</b></small>
        <small className='text-muted'>Total: <b>{Number(row.total_cost ?? 0).toFixed(2)}</b></small>
      </div>
      {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
    </div>
  )

  return (
    <div className='row'>
      <div className='col-12'>
        <div className='card mb-3'>
          <div className='card-body'>
            <div className='row'>
              {!isMagistrales && <VdSelect
                label='Almacen'
                col='col-md-3'
                value={warehouseId}
                onChange={(value) => setWarehouseId(value)}
                options={warehouses.map(item => ({ value: `${item.id}`, label: item.name }))}
                placeholder='-- Todos los almacenes --'
              />}
              {!isMagistrales && <VdSelect
                label='Laboratorio'
                col='col-md-3'
                value={laboratoryId}
                onChange={(value) => { setLaboratoryId(value); setArticleId('') }}
                options={laboratories.map(item => ({ value: `${item.id}`, label: item.name }))}
                placeholder='-- Todos los laboratorios --'
              />}
              {isMagistrales && <div className='col-md-4'>
                <label className='form-label'>Almacen fijo</label>
                <input className='form-control' value={fixedWarehouseLabel} disabled />
              </div>}
              <VdSelect
                label='Producto'
                col={isMagistrales ? 'col-md-4' : 'col-md-3'}
                value={articleId}
                onChange={(value) => setArticleId(value)}
                options={articles
                  .filter(item => !laboratoryId || `${item.laboratory_id}` === `${laboratoryId}`)
                  .map(item => ({ value: `${item.id}`, label: `${item.code} - ${item.name}` }))}
                placeholder='-- Seleccionar producto --'
              />
              {!isMagistrales && <div className='col-md-3'>
                <label className='form-label'>Desde</label>
                <input className='form-control' type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>}
              {!isMagistrales && <div className='col-md-3 mt-2'>
                <label className='form-label'>Hasta</label>
                <input className='form-control' type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>}
            </div>
          </div>
        </div>
      </div>

      {!isMagistrales && articleId && <div className='col-12'>
        <div className='card mb-3'>
          <div className='card-body'>
            <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3'>
              <div>
                <h4 className='header-title mb-1'>Movimientos por producto</h4>
                <div className='text-muted'>
                  {[selectedArticle?.code, selectedArticle?.name].filter(Boolean).join(' - ')}
                </div>
              </div>
              <button type='button' className='btn btn-sm btn-outline-primary' disabled={detailLoading} onClick={loadDetailMovements}>
                <i className={`mdi ${detailLoading ? 'mdi-loading mdi-spin' : 'mdi-refresh'} me-1`}></i>
                Actualizar
              </button>
            </div>
            <div className='table-responsive border rounded'>
              <table className='table table-sm table-striped mb-0'>
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Fecha</th>
                    <th style={{ width: 120 }}>Operacion</th>
                    <th style={{ width: 140 }}>Documento</th>
                    <th style={{ minWidth: 180 }}>Proveedor/Cliente</th>
                    <th style={{ width: 130 }}>Almacen</th>
                    <th style={{ width: 120 }}>Ubicacion</th>
                    <th style={{ width: 100 }}>Entrada</th>
                    <th style={{ width: 100 }}>Salida</th>
                    <th style={{ width: 100 }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {detailLoading && <tr><td colSpan='9' className='text-center text-muted py-3'>Cargando movimientos...</td></tr>}
                  {!detailLoading && detailRows.length === 0 && <tr><td colSpan='9' className='text-center text-muted py-3'>Sin movimientos</td></tr>}
                  {!detailLoading && detailRows.map(row => (
                    <tr key={`kardex-detail-${row.id}`}>
                      <td>{row.movement_date?.toString?.().slice(0, 16)}</td>
                      <td>{row.operation}</td>
                      <td>
                        {row.source_type && row.source_id
                          ? <button type='button' className='btn btn-link p-0 text-danger text-decoration-none' onClick={() => openDocument(row)}>{row.document || '-'}</button>
                          : row.document}
                      </td>
                      <td>{row.partner ?? row.transaction ?? ''}</td>
                      <td>{row.warehouse_name}</td>
                      <td>{row.location}</td>
                      <td>{Number(row.quantity_in ?? 0).toFixed(3)}</td>
                      <td>{Number(row.quantity_out ?? 0).toFixed(3)}</td>
                      <td>{Number(row.balance ?? 0).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>}

      <div className='col-12'>
        <VdTable
          ref={tableRef}
          rest={kardexRest}
          icon='mdi mdi-clipboard-text-outline'
          title='Kardex'
          unit='productos'
          defaultSort={{ field: 'article_name', desc: false }}
          defaultPageSize={25}
          emptyText='No se encontraron productos.'
          headerActions={<>
            <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
              <i className='mdi mdi-refresh'></i>
            </button>
            <button type='button' className='vdt-btn-soft' disabled={exporting} onClick={exportKardex}>
              <i className={`mdi ${exporting ? 'mdi-loading mdi-spin' : 'mdi-file-excel'}`}></i> Exportar
            </button>
          </>}
          actions={(row) => [
            { icon: 'mdi mdi-format-list-bulleted', title: isMagistrales ? 'Transacciones' : 'Ver movimientos', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openMovements(r) },
          ]}
          columns={isMagistrales ? magistralesVdColumns : standardProductVdColumns}
          renderCard={kardexRenderCard}
        />
      </div>

      <Modal
        modalRef={movementModalRef}
        title='Kardex mensual por selección de códigos'
        size='xl'
        hideButtonSubmit
        btnCancelText='Cerrar'
        onSubmit={(e) => { e.preventDefault(); loadMovementRows() }}
      >
        <style>{`
          .standard-kardex-month-table { min-width: 1100px; }
          .standard-kardex-month-table th,
          .standard-kardex-month-table td { vertical-align: middle; }
          .standard-kardex-month-head th { font-size: 0.76rem; text-transform: uppercase; text-align: center; }
          .standard-kardex-product-row td { font-weight: 700; text-align: center; }
          .standard-kardex-document-link { color: #c52018; border: 0; background: transparent; padding: 0; font: inherit; }
        `}</style>

        <div className='row justify-content-center align-items-end g-3 mb-4'>
          <div className='col-md-4'>
            <label className='form-label d-block text-center'>Seleccionar fecha inicial</label>
            <input className='form-control' type='month' value={movementStartMonth} onChange={(e) => setMovementStartMonth(e.target.value)} />
          </div>
          <div className='col-md-4'>
            <label className='form-label d-block text-center'>Seleccionar fecha final</label>
            <input className='form-control' type='month' value={movementEndMonth} onChange={(e) => setMovementEndMonth(e.target.value)} />
          </div>
          <div className='col-md-2'>
            <button type='submit' className='btn btn-outline-primary w-100' disabled={movementLoading}>
              <i className={`mdi ${movementLoading ? 'mdi-loading mdi-spin' : 'mdi-magnify'} me-1`}></i> Buscar
            </button>
          </div>
        </div>

        <div className='row align-items-start mb-4'>
          <div className='col-md-6'>
            <h4 className='mb-0'>
              <span className='text-muted'>Kardex mensual:</span> <span className='fw-bold text-primary'>{movementTitle}</span>
            </h4>
          </div>
          <div className='col-md-6'>
            <h4 className='mb-1'><span className='text-muted'>Sede:</span> {movementContext?.branch_name || movementRows[0]?.branch_name || '-'}</h4>
            <h4 className='mb-0'><span className='text-muted'>Almacen:</span> {movementContext?.warehouse_name || movementRows[0]?.warehouse_name || '-'}</h4>
          </div>
        </div>

        <div className='table-responsive'>
          <table className='table table-bordered table-sm standard-kardex-month-table mb-0'>
            <thead className='table-light'>
              <tr>
                <th colSpan='10' className='text-center py-2'>TRANSACCION</th>
                <th rowSpan='2' className='text-center' style={{ width: 80 }}>SALDO</th>
              </tr>
              <tr className='standard-kardex-month-head'>
                <th style={{ width: 150 }}>Fecha</th>
                <th style={{ width: 120 }}>Operacion</th>
                <th style={{ width: 150 }}>Documento</th>
                <th style={{ minWidth: 240 }}>Proveedor/Cliente</th>
                <th style={{ width: 120 }}>Lote</th>
                <th style={{ width: 130 }}>F. Vencimiento</th>
                <th style={{ width: 140 }}>Ubicacion</th>
                <th style={{ width: 110 }}>Entrada</th>
                <th style={{ width: 110 }}>Salida</th>
                <th style={{ width: 90 }}>Unidad</th>
              </tr>
            </thead>
            <tbody>
              <tr className='standard-kardex-product-row'>
                <td colSpan='11'>{movementContext?.article_name || movementTitle}</td>
              </tr>
              {movementLoading && <tr><td colSpan='11' className='text-center text-muted py-4'>Cargando movimientos...</td></tr>}
              {!movementLoading && movementRows.length === 0 && <tr><td colSpan='11' className='text-center text-muted py-4'>No existen movimientos</td></tr>}
              {!movementLoading && movementRows.map(row => (
                <tr key={row.id}>
                  <td className='text-center'>{row.movement_date?.toString?.().slice(0, 16)}</td>
                  <td className='text-center'>{row.operation}</td>
                  <td className='text-center'>
                    {row.source_type && row.source_id
                      ? <button type='button' className='standard-kardex-document-link' onClick={() => openDocument(row)}>{row.document || '-'}</button>
                      : row.document}
                  </td>
                  <td>{row.partner ?? row.transaction ?? ''}</td>
                  <td className='text-center'>{row.lot || '-'}</td>
                  <td className='text-center'>{row.expiration_date?.toString?.().slice(0, 10) || '-'}</td>
                  <td className='text-center'>{row.location}</td>
                  <td className='text-end text-info fw-semibold'>{Number(row.quantity_in ?? 0) ? Number(row.quantity_in ?? 0).toFixed(3) : ''}</td>
                  <td className='text-end text-danger'>{Number(row.quantity_out ?? 0) ? Number(row.quantity_out ?? 0).toFixed(3) : ''}</td>
                  <td className='text-center'>{row.unit_label}</td>
                  <td className='text-end text-info fw-bold'>{Number(row.balance ?? 0).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}

const StorageKardex = () => {
  const tableRef = useRef()
  const warehouseModalRef = useRef()
  const locationModalRef = useRef()
  const monthlyKardexModalRef = useRef()

  const [activeTab, setActiveTab] = useState('kardex')
  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [clients, setClients] = useState([])
  const [temperatures, setTemperatures] = useState([])
  const [clientId, setClientId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [stockMode, setStockMode] = useState('with_stock')
  const [monthlyKardexRow, setMonthlyKardexRow] = useState(null)
  const [monthlyKardexRows, setMonthlyKardexRows] = useState([])
  const [monthlyStartMonth, setMonthlyStartMonth] = useState('')
  const [monthlyEndMonth, setMonthlyEndMonth] = useState('')
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [warehouseForm, setWarehouseForm] = useState({
    id: '',
    business_id: '',
    business_branch_id: '',
    country: 'Perú',
    name: '',
    description: '',
    status: '1',
  })
  const [locationForm, setLocationForm] = useState({
    id: '',
    warehouse_id: '',
    client_id: '',
    code: '',
    temperature_range: '',
    status: '1',
  })

  const loadOptions = async () => {
    const data = await kardexRest.getStorageOptions()
    setBusinesses(data?.businesses ?? [])
    setBranches(data?.branches ?? [])
    setWarehouses(data?.warehouses ?? [])
    setClients(data?.clients ?? [])
    setTemperatures(data?.temperatures ?? [])
  }

  useEffect(() => {
    loadOptions()
  }, [])

  // Sincroniza el scope (section) del rest con la pestaña activa y, en la
  // pestaña Kardex, con los filtros de Cliente/Almacen/Stock. El refresh()
  // explicito cubre tanto el cambio de tab (el VdTable se remonta por su key)
  // como el cambio de filtros sin cambiar de tab; el request-id interno de
  // VdTable descarta cualquier fetch que haya quedado en vuelo con el filtro
  // anterior, asi que no hay condicion de carrera con el mount del hijo.
  useEffect(() => {
    kardexRest.setFilters({
      section: activeTab,
      client_id: activeTab === 'kardex' ? clientId : '',
      warehouse_id: activeTab === 'kardex' ? warehouseId : '',
      stock_mode: activeTab === 'kardex' ? stockMode : 'with_stock',
      business_id: '',
      business_branch_id: '',
      laboratory_id: '',
      article_id: '',
    })
    tableRef.current?.refresh()
  }, [activeTab, clientId, warehouseId, stockMode])

  const defaultBusinessId = businesses[0]?.id ? `${businesses[0].id}` : ''
  const filteredBranches = useMemo(() => {
    if (!warehouseForm.business_id) return branches
    return branches.filter(branch => `${branch.business_id}` === `${warehouseForm.business_id}`)
  }, [branches, warehouseForm.business_id])

  const openWarehouseModal = (row = null) => {
    const businessId = row?.business_id ? `${row.business_id}` : defaultBusinessId
    const branchId = row?.branch_id ? `${row.branch_id}` : (branches.find(branch => `${branch.business_id}` === `${businessId}`)?.id ?? '')
    setWarehouseForm({
      id: row?.id ? `${row.id}` : '',
      business_id: businessId,
      business_branch_id: branchId ? `${branchId}` : '',
      country: row?.country ?? 'Perú',
      name: row?.warehouse_name ?? '',
      description: row?.description ?? '',
      status: row?.status === false || row?.status === 0 ? '0' : '1',
    })
    $(warehouseModalRef.current).modal('show')
  }

  const openLocationModal = (row = null) => {
    setLocationForm({
      id: row?.id ? `${row.id}` : '',
      warehouse_id: row?.warehouse_id ? `${row.warehouse_id}` : '',
      client_id: row?.client_id ? `${row.client_id}` : '',
      code: row?.code ?? '',
      temperature_range: row?.temperature_range ?? '',
      status: row?.status === false || row?.status === 0 ? '0' : '1',
    })
    $(locationModalRef.current).modal('show')
  }

  const saveWarehouse = async (event) => {
    event.preventDefault()
    const result = await kardexRest.saveStorageWarehouse(warehouseForm)
    if (!result) return
    $(warehouseModalRef.current).modal('hide')
    await loadOptions()
    if (activeTab === 'warehouses') tableRef.current?.refresh()
  }

  const saveLocation = async (event) => {
    event.preventDefault()
    const result = await kardexRest.saveStorageLocation(locationForm)
    if (!result) return
    $(locationModalRef.current).modal('hide')
    await loadOptions()
    if (activeTab === 'locations') tableRef.current?.refresh()
  }

  const removeWarehouse = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar almacen',
      text: 'Se dara de baja este almacen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const ok = await kardexRest.deleteStorageWarehouse(id)
    if (!ok) return
    await loadOptions()
    tableRef.current?.refresh()
  }

  const removeLocation = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar ubicacion',
      text: 'Se dara de baja esta ubicacion.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const ok = await kardexRest.deleteStorageLocation(id)
    if (!ok) return
    tableRef.current?.refresh()
  }

  const downloadLocationsReport = () => {
    window.open('/api/admin/storage/kardex/locations-report', '_blank', 'noopener,noreferrer')
  }

  const downloadInventoryReport = () => {
    const params = new URLSearchParams()
    if (clientId) params.set('client_id', clientId)
    if (warehouseId) params.set('warehouse_id', warehouseId)
    if (stockMode) params.set('stock_mode', stockMode)
    window.open(`/api/admin/storage/kardex/inventory-report?${params.toString()}`, '_blank', 'noopener,noreferrer')
  }

  const storageKardexExportColumns = [
    { caption: 'INVENTARIO', value: row => row.inventory ?? '' },
    { caption: 'LOTE', value: row => row.lot ?? '' },
    { caption: 'F.V.', value: row => formatDateIso(row.expiration_date) },
    { caption: 'U. MEDIDA', value: row => row.unit_label ?? '' },
    { caption: 'STOCK SISTEMA', value: row => formatQty(row.system_stock) },
    { caption: 'UBICACION', value: row => row.location ?? '' },
    { caption: 'ALMACEN', value: row => row.warehouse_name ?? '' },
  ]

  // Reutiliza el filtro/orden/busqueda ACTUAL del VdTable de Kardex (mismo
  // patron que StandardKardex.exportKardex), asi la exportacion siempre
  // coincide con lo que se ve en pantalla.
  const loadAllStorageKardexRows = async () => (await tableRef.current?.loadAll()) ?? []

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

  const exportStorageKardex = async (format) => {
    try {
      const rows = await loadAllStorageKardexRows()
      if (!rows.length) {
        Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay filas para exportar' })
        return
      }

      const headers = storageKardexExportColumns.map(column => column.caption)
      const body = rows.map(row => storageKardexExportColumns.map(column => column.value(row)))

      if (format === 'copy') {
        await navigator.clipboard.writeText([headers, ...body].map(row => row.join('\t')).join('\n'))
        Swal.fire({ icon: 'success', title: 'Copiado', timer: 1200, showConfirmButton: false })
        return
      }

      if (format === 'excel') {
        const XLSX = await import('xlsx')
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body])
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Kardex')
        XLSX.writeFile(workbook, 'kardex-almacenamiento.xlsx')
        return
      }

      if (format === 'pdf') {
        const JsPDF = window.jspdf?.jsPDF || window.jsPDF
        if (!JsPDF) {
          Swal.fire({ icon: 'error', title: 'PDF no disponible', text: 'jsPDF no esta cargado' })
          return
        }
        const doc = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
        if (!doc.autoTable) {
          Swal.fire({ icon: 'error', title: 'PDF no disponible', text: 'AutoTable no esta cargado' })
          return
        }
        doc.setFontSize(12)
        doc.text('Lista de Kardex', 24, 28)
        doc.autoTable({
          head: [headers],
          body,
          startY: 40,
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [31, 41, 82] },
        })
        doc.save('kardex-almacenamiento.pdf')
        return
      }

      if (format === 'print') {
        const rowsHtml = body.map(row => `<tr>${row.map(value => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')
        const win = window.open('', '_blank')
        if (!win) return
        win.document.write(`
          <html>
            <head>
              <title>Lista de Kardex</title>
              <style>
                body { font-family: Arial, sans-serif; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background: #f3f4f6; }
              </style>
            </head>
            <body>
              <h3>Lista de Kardex</h3>
              <table>
                <thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
                <tbody>${rowsHtml}</tbody>
              </table>
            </body>
          </html>
        `)
        win.document.close()
        win.focus()
        win.print()
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo exportar el kardex' })
      }
    }
  }

  const monthFromDate = (value) => {
    const text = value?.toString()
    if (text && /^\d{4}-\d{2}/.test(text)) return text.slice(0, 7)
    return new Date().toISOString().slice(0, 7)
  }

  const loadMonthlyKardexRows = async (row = monthlyKardexRow, startMonth = monthlyStartMonth, endMonth = monthlyEndMonth) => {
    if (!row) return
    if (startMonth && endMonth && startMonth > endMonth) {
      Swal.fire({ icon: 'warning', title: 'Rango invalido', text: 'La fecha inicial no puede ser mayor que la fecha final' })
      return
    }

    setMonthlyLoading(true)
    try {
      const rows = await kardexRest.getMovements({
        article_id: row.article_id,
        warehouse_id: row.warehouse_id,
        client_id: row.client_id || '',
        lot: row.lot || '',
        expiration_date: formatDateIso(row.expiration_date) === '-' ? '' : formatDateIso(row.expiration_date),
        location: row.location || '',
        start_month: startMonth || '',
        end_month: endMonth || '',
      })
      setMonthlyKardexRows(rows ?? [])
    } finally {
      setMonthlyLoading(false)
    }
  }

  const openMonthlyKardex = async (row) => {
    const month = monthFromDate(row?.last_movement_at)
    setMonthlyKardexRow(row)
    setMonthlyKardexRows([])
    setMonthlyStartMonth(month)
    setMonthlyEndMonth(month)
    $(monthlyKardexModalRef.current).modal('show')
    await loadMonthlyKardexRows(row, month, month)
  }

  const exportMonthlyKardexPdf = () => {
    if (!monthlyKardexRows.length) {
      Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay movimientos para exportar' })
      return
    }

    const JsPDF = window.jspdf?.jsPDF || window.jsPDF
    if (!JsPDF) {
      Swal.fire({ icon: 'error', title: 'PDF no disponible', text: 'jsPDF no esta cargado' })
      return
    }
    const doc = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    if (!doc.autoTable) {
      Swal.fire({ icon: 'error', title: 'PDF no disponible', text: 'AutoTable no esta cargado' })
      return
    }

    doc.setFontSize(12)
    doc.text(`Kardex mensual - ${monthlyKardexRow?.inventory ?? ''}`, 24, 28)
    doc.autoTable({
      head: [['FECHA', 'CODIGO', 'DOCUMENTO', 'OPERACION', 'ENTRADA', 'SALIDA', 'SALDO']],
      body: monthlyKardexRows.map(row => [
        formatDateTime(row.movement_date),
        row.code ?? '',
        row.document ?? '',
        row.operation ?? '',
        formatQty(row.quantity_in),
        formatQty(row.quantity_out),
        formatQty(row.balance),
      ]),
      startY: 42,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [9, 154, 164] },
    })
    doc.save('kardex-mensual.pdf')
  }

  const isActiveStatus = (status) => status === true || status === 1 || status === '1'
  const statusBadgeNode = (status) => (
    <span className={`badge ${isActiveStatus(status) ? 'badge-soft-success' : 'badge-soft-secondary'}`}>
      {isActiveStatus(status) ? 'Activo' : 'Inactivo'}
    </span>
  )
  const occupancyBadgeNode = (status) => {
    const occupied = status === 'Ocupado'
    return <span className={`badge ${occupied ? 'badge-soft-warning' : 'badge-soft-success'}`}>{occupied ? 'Ocupado' : 'Libre'}</span>
  }

  const storageClientLabel = (client) => [client.document_number, client.full_name].filter(Boolean).join(' - ') || client.full_name || ''

  const kardexVdColumns = [
    { key: 'inventory', label: 'Inventario', field: 'inventory', filter: { type: 'text' } },
    { key: 'lot', label: 'Lote', field: 'lot', width: '120px', filter: { type: 'text' } },
    { key: 'expiration_date', label: 'F.V.', field: 'expiration_date', width: '110px', render: (row) => formatDate(row.expiration_date) },
    { key: 'unit_label', label: 'U. Medida', field: 'unit_label', width: '110px' },
    {
      key: 'system_stock', label: 'Stock Sistema', field: 'system_stock', width: '135px', align: 'right', nowrap: true,
      render: (row) => formatQty(row.system_stock),
    },
    { key: 'location', label: 'Ubicacion', field: 'location', width: '130px', filter: { type: 'text' } },
    { key: 'warehouse_name', label: 'Almacen', field: 'warehouse_name', width: '170px', filter: { type: 'text' } },
  ]

  const warehouseVdColumns = [
    {
      key: 'status', label: 'Estado', field: 'status', width: '110px',
      filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
      render: (row) => statusBadgeNode(row.status),
    },
    { key: 'warehouse_name', label: 'Almacen', field: 'warehouse_name', filter: { type: 'text' } },
    { key: 'branch_name', label: 'Sede', field: 'branch_name', filter: { type: 'text' } },
    { key: 'business_name', label: 'Empresa', field: 'business_name', filter: { type: 'text' } },
    { key: 'country', label: 'Pais', field: 'country', width: '100px' },
    {
      key: 'created_at', label: 'Fecha registro', field: 'created_at', width: '165px', sortable: false,
      render: (row) => formatDateTime(row.created_at),
    },
    { key: 'creator_label', label: 'Usuario registro', field: 'creator_label', width: '170px' },
  ]

  const locationVdColumns = [
    {
      key: 'status', label: 'Estado', field: 'status', width: '100px',
      filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
      render: (row) => statusBadgeNode(row.status),
    },
    {
      key: 'occupancy_status', label: 'Ocupacion', field: 'occupancy_status', width: '110px', sortable: false,
      render: (row) => occupancyBadgeNode(row.occupancy_status),
    },
    { key: 'warehouse_name', label: 'Almacen', field: 'warehouse_name', width: '160px', filter: { type: 'text' } },
    { key: 'client_name', label: 'Cliente asignado', field: 'client_name', width: '220px', filter: { type: 'text' } },
    { key: 'code', label: 'Ubicacion', field: 'code', width: '120px', filter: { type: 'text' } },
    { key: 'temperature_range', label: 'Temperatura', field: 'temperature_range', width: '130px' },
    {
      key: 'occupied_clients', label: 'Cliente ocupante', field: 'occupied_clients', width: '220px', sortable: false,
      render: (row) => <span title={row.occupied_clients || '-'}>{row.occupied_clients || '-'}</span>,
    },
    {
      key: 'occupied_products', label: 'Productos ocupando', field: 'occupied_products', width: '300px', sortable: false,
      render: (row) => <span title={row.occupied_products || '-'}>{row.occupied_products || '-'}</span>,
    },
    {
      key: 'occupied_stock', label: 'Stock ocupado', field: 'occupied_stock', width: '125px', align: 'right', nowrap: true,
      render: (row) => formatQty(row.occupied_stock),
    },
    { key: 'occupied_from', label: 'Ocupado desde', field: 'occupied_from', width: '130px', render: (row) => formatDate(row.occupied_from) },
    { key: 'occupied_until', label: 'Ocupado hasta', field: 'occupied_until', width: '130px', render: (row) => formatDate(row.occupied_until) },
    {
      key: 'created_at', label: 'Fecha registro', field: 'created_at', width: '165px', sortable: false,
      render: (row) => formatDateTime(row.created_at),
    },
    { key: 'creator_label', label: 'Usuario registro', field: 'creator_label', width: '170px' },
  ]

  const kardexActions = () => [
    { icon: 'mdi mdi-swap-horizontal', title: 'Kardex mensual', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openMonthlyKardex(r) },
  ]

  const warehouseActions = () => [
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => openWarehouseModal(r) },
    { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => removeWarehouse(r.id) },
  ]

  const locationActions = () => [
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => openLocationModal(r) },
    { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => removeLocation(r.id) },
  ]

  const kardexRenderCard = (row, actionButtons) => (
    <div className='vdt-card'>
      <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.inventory}</p>
          <small className='text-muted'>{[row.lot, formatDateIso(row.expiration_date) !== '-' ? formatDateIso(row.expiration_date) : null].filter(Boolean).join(' · ')}</small>
        </div>
        <span className='badge badge-soft-primary' style={{ whiteSpace: 'nowrap' }}>{formatQty(row.system_stock)} {row.unit_label}</span>
      </div>
      <small className='text-muted d-block mt-2'><i className='mdi mdi-map-marker me-1'></i>{[row.location, row.warehouse_name].filter(Boolean).join(' · ')}</small>
      {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
    </div>
  )

  const warehouseRenderCard = (row, actionButtons) => (
    <div className='vdt-card'>
      <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.warehouse_name}</p>
          <small className='text-muted'>{[row.business_name, row.branch_name].filter(Boolean).join(' · ')}</small>
        </div>
        {statusBadgeNode(row.status)}
      </div>
      <small className='text-muted d-block mt-2'><i className='mdi mdi-map me-1'></i>{row.country}</small>
      {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
    </div>
  )

  const locationRenderCard = (row, actionButtons) => (
    <div className='vdt-card'>
      <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.code}</p>
          <small className='text-muted'>{row.warehouse_name}</small>
        </div>
        {statusBadgeNode(row.status)}
      </div>
      <div className='d-flex flex-wrap align-items-center mt-2' style={{ gap: 8 }}>
        {occupancyBadgeNode(row.occupancy_status)}
        {row.temperature_range && <small className='text-muted'>{row.temperature_range}</small>}
      </div>
      {row.client_name && <small className='text-muted d-block mt-2'><i className='mdi mdi-account me-1'></i>{row.client_name}</small>}
      {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
    </div>
  )

  const tableConfigByTab = {
    kardex: {
      icon: 'mdi mdi-clipboard-text-outline', title: 'Kárdex', unit: 'elementos',
      columns: kardexVdColumns, actions: kardexActions, renderCard: kardexRenderCard,
      searchFields: ['inventory', 'lot', 'expiration_date', 'unit_label', 'location', 'warehouse_name'],
      searchPlaceholder: 'Buscar por inventario, lote, ubicación…',
      emptyText: 'No existen elementos.',
      defaultSort: { field: 'last_movement_at', desc: true },
    },
    warehouses: {
      icon: 'mdi mdi-warehouse', title: 'Almacenes', unit: 'almacenes',
      columns: warehouseVdColumns, actions: warehouseActions, renderCard: warehouseRenderCard,
      searchFields: ['warehouse_name', 'branch_name', 'business_name', 'country'],
      searchPlaceholder: 'Buscar por almacén, sede o empresa…',
      emptyText: 'No se encontraron almacenes.',
      defaultSort: { field: 'warehouse_name', desc: false },
    },
    locations: {
      icon: 'mdi mdi-map-marker', title: 'Ubicaciones', unit: 'ubicaciones',
      columns: locationVdColumns, actions: locationActions, renderCard: locationRenderCard,
      searchFields: ['warehouse_name', 'client_name', 'code', 'temperature_range'],
      searchPlaceholder: 'Buscar por almacén, cliente o ubicación…',
      emptyText: 'No se encontraron ubicaciones.',
      defaultSort: { field: 'code', desc: false },
    },
  }
  const activeTableConfig = tableConfigByTab[activeTab]

  return <>
    <div className='row g-3 mb-3' hidden={activeTab === 'kardex'}>
      <div className='col-12 col-lg-4'>
        <button type='button' className='btn btn-success w-100 d-flex align-items-center justify-content-between py-3' onClick={downloadLocationsReport}>
          <span><i className='mdi mdi-plus-circle-outline me-1'></i> Descargar reporte de Ubicaciones</span>
          <i className='mdi mdi-file-excel-outline fs-4'></i>
        </button>
      </div>
      <div className='col-12 col-lg-4'>
        <button type='button' className='btn btn-warning text-white w-100 text-start py-3' onClick={() => openWarehouseModal()}>
          <i className='mdi mdi-plus-circle-outline me-1'></i>
          Registrar Almacén
        </button>
      </div>
      <div className='col-12 col-lg-4'>
        <button type='button' className='btn btn-info text-white w-100 text-start py-3' onClick={() => openLocationModal()}>
          <i className='mdi mdi-plus-circle-outline me-1'></i>
          Registrar Ubicación
        </button>
      </div>
    </div>

    <div className='card mb-3'>
      <div className='card-body'>
        <ul className='nav nav-tabs'>
          {[
            { key: 'kardex', label: 'Kárdex' },
            { key: 'warehouses', label: 'Almacenes' },
            { key: 'locations', label: 'Ubicaciones' },
          ].map(tab => (
            <li className='nav-item' key={`storage-kardex-tab-${tab.key}`}>
              <button type='button' className={`nav-link ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {activeTab === 'kardex' && <div className='pt-4 pb-2'>
          <div className='row g-3 align-items-end'>
            <VdSelect
              label='Cliente' col='col-12 col-lg-5'
              value={clientId}
              onChange={(value) => setClientId(value)}
              options={clients.map(client => ({ value: `${client.id}`, label: storageClientLabel(client) }))}
              placeholder='Seleccione Cliente'
            />
            <VdSelect
              label='Almacen' col='col-12 col-md-6 col-lg-5'
              value={warehouseId}
              onChange={(value) => setWarehouseId(value)}
              options={warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
              placeholder='Todos'
            />
            <VdSelect
              label='Stock' col='col-12 col-md-6 col-lg-2'
              value={stockMode}
              onChange={(value) => setStockMode(value || 'with_stock')}
              options={[
                { value: 'with_stock', label: 'Con stock' },
                { value: 'without_stock', label: 'Sin stock' },
                { value: 'all', label: 'Todos' },
              ]}
            />
            <div className='col-12 d-flex justify-content-center gap-2'>
              <button type='button' className='btn btn-outline-primary text-uppercase' onClick={() => tableRef.current?.refresh()}>
                <i className='mdi mdi-magnify me-1'></i>
                Buscar artículos
              </button>
              <button type='button' className='btn btn-outline-danger' onClick={downloadInventoryReport}>
                <i className='mdi mdi-file-pdf-box me-1'></i>
                Reporte para Inventario
              </button>
            </div>
          </div>
        </div>}
      </div>
    </div>

    <VdTable
      key={`storage-kardex-vdtable-${activeTab}`}
      ref={tableRef}
      rest={kardexRest}
      icon={activeTableConfig.icon}
      title={activeTableConfig.title}
      unit={activeTableConfig.unit}
      defaultSort={activeTableConfig.defaultSort}
      defaultPageSize={10}
      searchFields={activeTableConfig.searchFields}
      searchPlaceholder={activeTableConfig.searchPlaceholder}
      emptyText={activeTableConfig.emptyText}
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
      </>}
      toolbar={activeTab === 'kardex' ? (
        <div className='d-flex flex-wrap' style={{ gap: 8 }}>
          <button type='button' className='vdt-btn-soft' onClick={() => exportStorageKardex('copy')}><i className='mdi mdi-content-copy'></i> Copiar</button>
          <button type='button' className='vdt-btn-soft' onClick={() => exportStorageKardex('excel')}><i className='mdi mdi-file-excel'></i> Excel</button>
          <button type='button' className='vdt-btn-soft' onClick={() => exportStorageKardex('pdf')}><i className='mdi mdi-file-pdf-box'></i> PDF</button>
          <button type='button' className='vdt-btn-soft' onClick={() => exportStorageKardex('print')}><i className='mdi mdi-printer'></i> Imprimir</button>
        </div>
      ) : null}
      actions={activeTableConfig.actions}
      columns={activeTableConfig.columns}
      renderCard={activeTableConfig.renderCard}
    />

    <Modal
      modalRef={monthlyKardexModalRef}
      title='Kardex mensual'
      size='xl'
      hideButtonSubmit
      btnCancelText='Cerrar'
      onSubmit={(e) => { e.preventDefault(); loadMonthlyKardexRows() }}
    >
      <style>{`
        .storage-monthly-kardex-table th,
        .storage-monthly-kardex-table td { vertical-align: middle; }
        .storage-monthly-kardex-head th { text-transform: uppercase; }
      `}</style>
      <div>
        <div className='row justify-content-center g-3 mb-3'>
          <div className='col-12 col-md-4'>
            <label className='form-label text-center w-100'>Seleccionar fecha inicial</label>
            <input type='month' className='form-control' value={monthlyStartMonth} onChange={(e) => setMonthlyStartMonth(e.target.value)} />
          </div>
          <div className='col-12 col-md-4'>
            <label className='form-label text-center w-100'>Seleccionar fecha final</label>
            <input type='month' className='form-control' value={monthlyEndMonth} onChange={(e) => setMonthlyEndMonth(e.target.value)} />
          </div>
          <div className='col-12 d-flex justify-content-center gap-2'>
            <button type='button' className='btn btn-outline-primary' disabled={monthlyLoading} onClick={() => loadMonthlyKardexRows()}>
              <i className={`mdi ${monthlyLoading ? 'mdi-spin mdi-loading' : 'mdi-magnify'} me-1`}></i>
              Buscar
            </button>
            <button type='button' className='btn btn-outline-danger' onClick={exportMonthlyKardexPdf}>
              <i className='mdi mdi-file-pdf-box me-1'></i>
              Exportar PDF
            </button>
          </div>
        </div>

        <div className='table-responsive'>
          <table className='table table-bordered table-sm storage-monthly-kardex-table mb-0'>
            <thead className='table-light'>
              <tr>
                <th colSpan='7' className='text-center py-2'>TRANSACCION -</th>
              </tr>
              <tr className='storage-monthly-kardex-head text-center'>
                <th style={{ minWidth: 150 }}>FECHA</th>
                <th style={{ minWidth: 130 }}>CODIGO</th>
                <th style={{ minWidth: 220 }}>DOCUMENTO</th>
                <th style={{ minWidth: 150 }}>OPERACION</th>
                <th style={{ minWidth: 120 }}>ENTRADA</th>
                <th style={{ minWidth: 120 }}>SALIDA</th>
                <th style={{ minWidth: 120 }}>SALDO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan='7' className='text-center fw-bold fs-5 text-muted'>
                  {[monthlyKardexRow?.inventory, monthlyKardexRow?.unit_label ? `(${monthlyKardexRow.unit_label})` : ''].filter(Boolean).join(' ')}
                </td>
              </tr>
              {monthlyLoading && <tr><td colSpan='7' className='text-center text-muted py-4'><i className='mdi mdi-spin mdi-loading me-1'></i> Cargando...</td></tr>}
              {!monthlyLoading && monthlyKardexRows.length === 0 && <tr><td colSpan='7' className='text-center text-muted py-4'>No existen movimientos</td></tr>}
              {!monthlyLoading && monthlyKardexRows.map(row => (
                <tr key={row.id}>
                  <td className='text-center'>{formatDateTime(row.movement_date)}</td>
                  <td className='text-center text-danger'>{row.code}</td>
                  <td className='text-center'>{row.document}</td>
                  <td className='text-center'>{row.operation}</td>
                  <td className='text-end text-primary'>{Number(row.quantity_in ?? 0) > 0 ? formatQty(row.quantity_in) : ''}</td>
                  <td className='text-end text-danger'>{Number(row.quantity_out ?? 0) > 0 ? formatQty(row.quantity_out) : ''}</td>
                  <td className='text-end fw-bold text-info'>{formatQty(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={warehouseModalRef}
      title='Formulario almacén'
      size='xl'
      btnSubmitText={warehouseForm.id ? 'Actualizar' : 'Registrar'}
      onSubmit={saveWarehouse}
      bodyStyle={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', overflowX: 'hidden' }}
    >
      <div className='row g-3'>
        <VdSelect
          label='Empresa' col='col-12 col-lg-4'
          value={warehouseForm.business_id}
          onChange={(value) => setWarehouseForm(prev => ({ ...prev, business_id: value, business_branch_id: '' }))}
          options={businesses.map(business => ({ value: `${business.id}`, label: business.name }))}
          placeholder='Seleccione empresa'
        />
        <VdSelect
          label='Sede' col='col-12 col-lg-4'
          value={warehouseForm.business_branch_id}
          onChange={(value) => setWarehouseForm(prev => ({ ...prev, business_branch_id: value }))}
          options={filteredBranches.map(branch => ({ value: `${branch.id}`, label: branch.name }))}
          placeholder='Seleccione sede'
        />
        <VdSelect
          label='Pais' col='col-12 col-lg-4'
          value={warehouseForm.country}
          onChange={(value) => setWarehouseForm(prev => ({ ...prev, country: value }))}
          options={[{ value: 'Perú', label: 'Perú' }]}
        />
        <div className='col-12 col-lg-8'>
          <label className='form-label'>Nombre almacén</label>
          <input className='form-control' value={warehouseForm.name} onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))} />
        </div>
        <VdSelect
          label='Estado' col='col-12 col-lg-4'
          value={warehouseForm.status}
          onChange={(value) => setWarehouseForm(prev => ({ ...prev, status: value }))}
          options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}
        />
      </div>
    </Modal>

    <Modal
      modalRef={locationModalRef}
      title='Formulario ubicación'
      size='lg'
      btnSubmitText={locationForm.id ? 'Actualizar' : 'Registrar'}
      onSubmit={saveLocation}
      bodyStyle={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', overflowX: 'hidden' }}
    >
      <div className='row g-3'>
        <VdSelect
          label='Almacén' col='col-12 col-md-6'
          value={locationForm.warehouse_id}
          onChange={(value) => setLocationForm(prev => ({ ...prev, warehouse_id: value }))}
          options={warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
          placeholder='Seleccione almacén'
        />
        <VdSelect
          label='Cliente' col='col-12 col-md-6'
          disabled={!!locationForm.id && !!locationForm.client_id}
          value={locationForm.client_id}
          onChange={(value) => setLocationForm(prev => ({ ...prev, client_id: value }))}
          options={clients.map(client => ({ value: `${client.id}`, label: `${client.document_number ? `${client.document_number} | ` : ''}${client.full_name}` }))}
          placeholder='Seleccione cliente'
        />
        <VdSelect
          label='Temperatura' col='col-12 col-md-6'
          value={locationForm.temperature_range}
          onChange={(value) => setLocationForm(prev => ({ ...prev, temperature_range: value }))}
          options={temperatures.map(temp => ({ value: temp, label: temp }))}
          placeholder='Seleccione'
        />
        <div className='col-12 col-md-6'>
          <label className='form-label'>Codificación</label>
          <input className='form-control' value={locationForm.code} onChange={(e) => setLocationForm(prev => ({ ...prev, code: e.target.value }))} />
        </div>
        <VdSelect
          label='Estado' col='col-12 col-md-6'
          value={locationForm.status}
          onChange={(value) => setLocationForm(prev => ({ ...prev, status: value }))}
          options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}
        />
      </div>
    </Modal>
  </>
}

const Kardex = (props) => (props.storageContext || isStoragePath())
  ? <StorageKardex {...props} />
  : <StandardKardex {...props} />

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? scopedPermission('kardex')
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Kardex'}>
    <Kardex {...properties} />
  </BaseAdminto>);
})
