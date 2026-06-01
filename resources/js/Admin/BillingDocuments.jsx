import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import BillingDocumentsRest from '../Actions/Admin/BillingDocumentsRest';
import {
  billingDocumentStatusOptions,
  getBillingDocumentStatusLabel,
  getSourceTypeLabel,
  toLookup,
} from '../Utils/statusLabels';
import { scopedPermission } from '../Utils/permissionScope';

const billingDocumentsRest = new BillingDocumentsRest()

const today = () => new Date().toISOString().slice(0, 10)

const storageTabs = [
  { id: 'prefactures', label: 'Prefacturas' },
  { id: 'issued', label: 'Facturas Emitidas' },
  { id: 'cancelled', label: 'Facturas Anuladas' },
  { id: 'credit-notes', label: 'Notas de Credito' },
]

const emptyFilters = () => ({
  businessId: '',
  clientId: '',
  startDate: '',
  endDate: '',
})

const reportFilters = () => ({
  businessId: '',
  startDate: today(),
  endDate: today(),
})

const formatMoney = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate = (value) => value?.toString?.().slice?.(0, 10) ?? ''
const currencyLabel = (value) => `${value ?? ''}`.toUpperCase() === 'USD' ? 'Dolares' : 'Soles'
const emptyBulkFilters = () => ({ clientId: '', documentType: 'Factura', currency: 'PEN', detraction: false, detractionPercent: 12 })
const billingControlStatusOptions = [
  { value: 'pending', label: 'En espera' },
  { value: 'sent', label: 'Facturado' },
  { value: 'accepted', label: 'Facturado' },
  { value: 'observed', label: 'Facturado' },
  { value: 'rejected', label: 'Facturado' },
  { value: 'cancelled', label: 'Anulado' },
]
const toNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}
const roundMoney = (value) => Math.round(toNumber(value) * 100) / 100

const rowClientName = (row) => row?.client?.full_name
  ?? row?.eventualClient?.business_name
  ?? row?.eventual_client?.business_name
  ?? '-'

const rowSourceCode = (row) => row?.commercial_order?.code
  ?? row?.commercialOrder?.code
  ?? row?.service_order?.code
  ?? row?.serviceOrder?.code
  ?? row?.metadata?.source_code
  ?? '-'

const rowServiceOrderDate = (row) => row?.service_order_issue_date
  ?? row?.service_order?.issue_date
  ?? row?.serviceOrder?.issue_date
  ?? row?.service_order_scheduled_at
  ?? row?.service_order?.scheduled_at
  ?? row?.serviceOrder?.scheduled_at
  ?? row?.service_order_created_at
  ?? row?.service_order?.created_at
  ?? row?.serviceOrder?.created_at
  ?? ''

const rowDescription = (row) => row?.items?.[0]?.description
  ?? row?.observations
  ?? row?.document_type
  ?? '-'

const rowSunatLabel = (row) => row?.external_reference || row?.external_id || getBillingDocumentStatusLabel(row?.external_status)
const rowDetractionPercent = (row) => {
  const metadataPercent = toNumber(row?.metadata?.detraction_percent, 0)
  if (metadataPercent > 0) return metadataPercent
  return (row?.items ?? []).reduce((carry, item) => Math.max(carry, toNumber(item?.metadata?.detraction_percent, 0)), 0)
}
const rowsDetractionPercent = (rows) => rows.reduce((carry, row) => Math.max(carry, rowDetractionPercent(row)), 0)
const rowDetractionAmount = (row, percent) => {
  const metadataAmount = toNumber(row?.metadata?.detraction_amount, 0)
  if (metadataAmount > 0) return roundMoney(metadataAmount)
  return roundMoney(toNumber(row?.total, 0) * toNumber(percent, 0) / 100)
}

const combineFilters = (filters) => filters.filter(Boolean).reduce((carry, filter) => {
  if (!carry) return filter
  return [carry, 'and', filter]
}, null)

const tabFilter = (tab) => {
  const notCreditNote = ['document_type', '<>', 'Nota de credito']
  if (tab === 'issued') {
    return [[['local_status', '=', 'sent'], 'or', ['local_status', '=', 'accepted'], 'or', ['local_status', '=', 'observed'], 'or', ['local_status', '=', 'rejected']], 'and', notCreditNote]
  }
  if (tab === 'cancelled') return [['local_status', '=', 'cancelled'], 'and', notCreditNote]
  if (tab === 'credit-notes') return ['document_type', '=', 'Nota de credito']
  return [
    ['local_status', '=', 'pending'],
    'and',
    [['series', '=', null], 'or', ['series', '=', '']],
    'and',
    [['sequence', '=', null], 'or', ['sequence', '=', '']],
    'and',
    notCreditNote,
  ]
}

const buildStorageFilter = (tab, filters) => {
  const dateField = tab === 'prefactures' ? 'source_service_order.issue_date' : 'created_at'
  return combineFilters([
    tabFilter(tab),
    filters.businessId ? ['business_id', '=', Number(filters.businessId)] : null,
    filters.clientId ? ['client_id', '=', Number(filters.clientId)] : null,
    filters.startDate ? [dateField, '>=', filters.startDate] : null,
    filters.endDate ? [dateField, '<=', dateField === 'created_at' ? `${filters.endDate} 23:59:59` : filters.endDate] : null,
  ])
}

const BillingDocuments = ({ moduleTitle = 'Facturacion', requiredPermission, billingMode }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const payloadModalRef = useRef()
  const providerModalRef = useRef()
  const cancelModalRef = useRef()
  const creditNoteModalRef = useRef()
  const reportModalRef = useRef()
  const bulkModalRef = useRef()
  const idRef = useRef()
  const issueDateRef = useRef()
  const dueDateRef = useRef()
  const documentTypeRef = useRef()
  const seriesRef = useRef()
  const sequenceRef = useRef()
  const paymentConditionRef = useRef()
  const paymentMethodRef = useRef()
  const customerEmailRef = useRef()
  const observationsRef = useRef()
  const localStatusRef = useRef()
  const externalStatusRef = useRef()
  const externalIdRef = useRef()
  const externalReferenceRef = useRef()
  const errorMessageRef = useRef()
  const responsePayloadRef = useRef()
  const cancelReasonRef = useRef()
  const creditNoteSeriesRef = useRef()
  const creditNoteIssueDateRef = useRef()
  const creditNoteReasonRef = useRef()
  const creditNoteNoteRef = useRef()
  const isStorageBilling = billingMode === 'storage' || requiredPermission === 'storage-billing-control' || location.pathname.includes('storage-billing-control')

  const [sourceType, setSourceType] = useState(isStorageBilling ? 'service_order' : 'commercial_order')
  const [sourceId, setSourceId] = useState('')
  const [commercialOrders, setCommercialOrders] = useState([])
  const [serviceOrders, setServiceOrders] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [clients, setClients] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [payloadText, setPayloadText] = useState('')
  const [activeStorageTab, setActiveStorageTab] = useState('prefactures')
  const [storageFilters, setStorageFilters] = useState(emptyFilters())
  const [appliedStorageFilters, setAppliedStorageFilters] = useState(emptyFilters())
  const [modalReportFilters, setModalReportFilters] = useState(reportFilters())
  const [bulkFilters, setBulkFilters] = useState(emptyBulkFilters())
  const [bulkRows, setBulkRows] = useState([])
  const [bulkSelected, setBulkSelected] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      billingDocumentsRest.getCommercialOrders(),
      billingDocumentsRest.getServiceOrders(),
      billingDocumentsRest.getBusinesses(),
      billingDocumentsRest.getClients(),
    ]).then(([commercial, services, businessRows, clientRows]) => {
      setCommercialOrders((commercial ?? []).filter(row => row.status !== null))
      setServiceOrders((services ?? []).filter(row => row.status !== null))
      setBusinesses((businessRows ?? []).filter(row => row.status !== null))
      setClients((clientRows ?? []).filter(row => row.status !== null))
    })
  }, [])

  const escapeHtml = (value) => `${value ?? ''}`
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

  const getReadinessMeta = (readiness) => {
    const status = readiness?.status ?? 'blocked'
    if (status === 'ready') return { label: 'Listo', className: 'bg-soft-success text-success', icon: 'success' }
    if (status === 'warning') return { label: 'Revisar', className: 'bg-soft-warning text-warning', icon: 'warning' }
    return { label: 'Bloqueado', className: 'bg-soft-danger text-danger', icon: 'warning' }
  }

  const normalizeDocumentType = (value) => `${value ?? ''}`.trim().toLowerCase().replaceAll('_', ' ')

  const isCreditNoteDocument = (row) => normalizeDocumentType(row?.document_type) === 'nota de credito'

  const canEditDocument = (row) => row?.local_status === 'pending'

  const canSyncDocument = (row) => {
    if (!row) return false
    if ((row.local_status ?? 'pending') !== 'pending') return true
    return !!(row.external_id || row?.metadata?.voided_ticket || row?.metadata?.voided_external_id || row?.response_payload)
  }

  const canCancelDocument = (row) => row?.local_status === 'accepted' && !isCreditNoteDocument(row)

  const canCreditNoteDocument = (row) => row?.local_status === 'accepted' && !isCreditNoteDocument(row)

  const canDownloadDocument = (row) => {
    if (!row) return false
    return ['accepted', 'observed', 'cancelled'].includes(row.local_status) || !!row.external_id
  }

  const hasPreparedVoucher = (row) => !!(`${row?.series ?? ''}`.trim() && `${row?.sequence ?? ''}`.trim())

  const showBlockedAction = async (title, text) => {
    await Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'Cerrar'
    })
  }

  const openReadinessModal = async (row, title = 'Validación fiscal') => {
    const readiness = row?.fiscal_readiness ?? {}
    const errors = readiness.errors ?? []
    const warnings = readiness.warnings ?? []
    const html = `
      <div class="text-start">
        <div class="mb-2"><b>Modo:</b> ${escapeHtml(readiness.mode ?? 'demo')}</div>
        <div class="mb-2"><b>Serie usada:</b> ${escapeHtml(readiness.resolved_series ?? '-')}</div>
        ${errors.length ? `<div class="mb-2"><b>Bloqueos</b><ul class="mb-0 ps-3">${errors.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
        ${warnings.length ? `<div><b>Advertencias</b><ul class="mb-0 ps-3">${warnings.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
        ${!errors.length && !warnings.length ? '<div class="text-success">Listo para emitir.</div>' : ''}
      </div>
    `
    await Swal.fire({
      icon: getReadinessMeta(readiness).icon,
      title,
      html,
      confirmButtonText: 'Cerrar'
    })
  }

  const onModalOpen = (data = null) => {
    if (data && !canEditDocument(data)) {
      showBlockedAction('Comprobante bloqueado', 'Solo puedes editar comprobantes pendientes.')
      return
    }

    idRef.current.value = data?.id ?? ''
    issueDateRef.current.value = data?.issue_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    dueDateRef.current.value = data?.due_date?.toString?.().slice?.(0, 10) ?? ''
    documentTypeRef.current.value = data?.document_type ?? 'Factura'
    seriesRef.current.value = data?.series ?? ''
    sequenceRef.current.value = data?.sequence ?? ''
    paymentConditionRef.current.value = data?.payment_condition ?? 'Contado'
    paymentMethodRef.current.value = data?.payment_method ?? 'Transferencia'
    customerEmailRef.current.value = data?.customer_email ?? ''
    observationsRef.current.value = data?.observations ?? ''
    setSourceType(isStorageBilling ? 'service_order' : (data?.source_type ?? 'commercial_order'))
    setSourceId(`${data?.source_id ?? ''}`)
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const request = {
      id: idRef.current.value || undefined,
      document_type: documentTypeRef.current.value,
      issue_date: issueDateRef.current.value,
      due_date: dueDateRef.current.value || null,
      series: seriesRef.current.value.trim(),
      sequence: sequenceRef.current.value.trim(),
      payment_condition: paymentConditionRef.current.value.trim(),
      payment_method: paymentMethodRef.current.value.trim(),
      customer_email: customerEmailRef.current.value.trim(),
      observations: observationsRef.current.value.trim(),
    }
    if (!isStorageBilling && sourceType === 'commercial_order') request.commercial_order_id = sourceId || null
    else request.service_order_id = sourceId || null

    const result = await billingDocumentsRest.save(request)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onOpenPayload = async (row) => {
    const payload = await billingDocumentsRest.getConnectorPayload(row.id)
    if (!payload) return
    setSelectedRow(row)
    setPayloadText(JSON.stringify(payload, null, 2))
    $(payloadModalRef.current).modal('show')
  }

  const onOpenProviderModal = (row) => {
    setSelectedRow(row)
    localStatusRef.current.value = row.local_status ?? 'pending'
    externalStatusRef.current.value = row.external_status ?? 'draft'
    externalIdRef.current.value = row.external_id ?? ''
    externalReferenceRef.current.value = row.external_reference ?? ''
    errorMessageRef.current.value = row.error_message ?? ''
    responsePayloadRef.current.value = row.response_payload ?? ''
    $(providerModalRef.current).modal('show')
  }

  const onSaveProvider = async (e) => {
    e.preventDefault()
    if (!selectedRow) return
    const payload = responsePayloadRef.current.value.trim()
    let decodedPayload = payload
    try { decodedPayload = payload ? JSON.parse(payload) : null } catch (error) { }
    const result = await billingDocumentsRest.registerProviderResponse(selectedRow.id, {
      local_status: localStatusRef.current.value,
      external_status: externalStatusRef.current.value,
      external_id: externalIdRef.current.value.trim(),
      external_reference: externalReferenceRef.current.value.trim(),
      error_message: errorMessageRef.current.value.trim(),
      response_payload: decodedPayload,
    })
    if (!result) return
    $(providerModalRef.current).modal('hide')
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onIssue = async (row) => {
    if (row?.fiscal_readiness?.can_issue === false) {
      await openReadinessModal(row, 'El comprobante no está listo para emitir')
      return
    }

    const { isConfirmed } = await Swal.fire({ title: 'Emitir comprobante', text: `Se emitira ${row.code} usando el conector configurado.`, icon: 'question', showCancelButton: true, confirmButtonText: 'Emitir', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await billingDocumentsRest.issue(row.id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onPrepareVoucher = async (row) => {
    openBulkModal(row)
  }

  const onSyncStatus = async (row) => {
    if (!canSyncDocument(row)) {
      await showBlockedAction('Sync no disponible', 'El comprobante aun no tiene datos remotos para sincronizar.')
      return
    }

    const result = await billingDocumentsRest.syncStatus(row.id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onOpenCancel = (row) => {
    if (!canCancelDocument(row)) {
      showBlockedAction('Anulación no disponible', 'Solo puedes anular comprobantes aceptados que no sean notas de crédito.')
      return
    }

    setSelectedRow(row)
    cancelReasonRef.current.value = row?.metadata?.cancel_reason ?? ''
    $(cancelModalRef.current).modal('show')
  }

  const onSaveCancel = async (e) => {
    e.preventDefault()
    if (!selectedRow) return
    const result = await billingDocumentsRest.cancel(selectedRow.id, { reason: cancelReasonRef.current.value.trim() })
    if (!result) return
    $(cancelModalRef.current).modal('hide')
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onOpenCreditNote = (row) => {
    if (!canCreditNoteDocument(row)) {
      showBlockedAction('Nota de crédito no disponible', 'Solo puedes generar nota de crédito desde comprobantes aceptados que no sean notas de crédito.')
      return
    }

    setSelectedRow(row)
    creditNoteSeriesRef.current.value = row?.branch?.series_nota_credito ?? 'FC01'
    creditNoteIssueDateRef.current.value = new Date().toISOString().slice(0, 10)
    creditNoteReasonRef.current.value = 'Anulación de la operación'
    creditNoteNoteRef.current.value = ''
    $(creditNoteModalRef.current).modal('show')
  }

  const onSaveCreditNote = async (e) => {
    e.preventDefault()
    if (!selectedRow) return
    const result = await billingDocumentsRest.creditNote(selectedRow.id, {
      series: creditNoteSeriesRef.current.value.trim(),
      issue_date: creditNoteIssueDateRef.current.value,
      reason: creditNoteReasonRef.current.value.trim(),
      note: creditNoteNoteRef.current.value.trim(),
    })
    if (!result) return
    $(creditNoteModalRef.current).modal('hide')
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDownload = (row, type) => {
    if (!canDownloadDocument(row)) {
      showBlockedAction('Descarga no disponible', 'El comprobante todavía no tiene archivos fiscales disponibles.')
      return
    }

    window.open(billingDocumentsRest.downloadUrl(row.id, type), '_blank', 'noopener')
  }

  const onPrintPreparedVoucher = async (row) => {
    if (canDownloadDocument(row)) {
      onDownload(row, 'pdf')
      return
    }

    if (!hasPreparedVoucher(row)) {
      await showBlockedAction('Comprobante no preparado', 'Primero debes facturar la prefactura para generar serie y numero.')
      return
    }

    const popup = window.open('', '_blank')
    if (!popup) {
      await showBlockedAction('Impresion bloqueada', 'El navegador bloqueo la ventana de impresion.')
      return
    }

    const items = row?.items ?? []
    const itemsHtml = items.length
      ? items.map(item => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td class="right">${Number(item.quantity ?? 0).toFixed(2)}</td>
          <td class="right">${Number(item.unit_price ?? 0).toFixed(2)}</td>
          <td class="right">${Number(item.total ?? 0).toFixed(2)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" class="muted">Sin detalle de items</td></tr>'

    popup.document.write(`<!doctype html>
      <html>
        <head>
          <title>${escapeHtml(row.code)} - ${escapeHtml(row.series)}-${escapeHtml(row.sequence)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #222; margin: 28px; font-size: 12px; }
            h1 { font-size: 20px; margin: 0 0 4px; }
            h2 { font-size: 15px; margin: 20px 0 8px; }
            .muted { color: #666; }
            .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #ddd; padding-bottom: 14px; }
            .number { text-align: right; font-size: 16px; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-top: 18px; }
            .label { color: #666; font-size: 11px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
            th { background: #f5f5f5; text-align: left; }
            .right { text-align: right; }
            .totals { width: 260px; margin-left: auto; margin-top: 14px; }
            @media print { button { display: none; } body { margin: 0; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Imprimir</button>
          <div class="header">
            <div>
              <h1>${escapeHtml(row?.business?.name ?? 'Empresa')}</h1>
              <div class="muted">${escapeHtml(row?.branch?.address ?? '')}</div>
              <div class="muted">${escapeHtml(row?.business?.tax_number ?? '')}</div>
            </div>
            <div class="number">
              ${escapeHtml(row.document_type ?? 'Comprobante')}<br>
              ${escapeHtml(row.series)}-${escapeHtml(row.sequence)}
            </div>
          </div>
          <div class="grid">
            <div><div class="label">Prefactura</div>${escapeHtml(row.code)}</div>
            <div><div class="label">Fecha</div>${escapeHtml(formatDate(row.issue_date))}</div>
            <div><div class="label">Cliente</div>${escapeHtml(rowClientName(row))}</div>
            <div><div class="label">Moneda</div>${escapeHtml(currencyLabel(row.currency))}</div>
            <div><div class="label">Orden de servicio</div>${escapeHtml(rowSourceCode(row))}</div>
            <div><div class="label">Condicion</div>${escapeHtml(row.payment_condition ?? '-')}</div>
          </div>
          <h2>Detalle</h2>
          <table>
            <thead>
              <tr>
                <th>Descripcion</th>
                <th class="right">Cantidad</th>
                <th class="right">P. Unitario</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <table class="totals">
            <tr><th>Subtotal</th><td class="right">${Number(row.subtotal ?? 0).toFixed(2)}</td></tr>
            <tr><th>IGV</th><td class="right">${Number(row.tax_amount ?? 0).toFixed(2)}</td></tr>
            <tr><th>Total</th><td class="right">${Number(row.total ?? 0).toFixed(2)}</td></tr>
          </table>
        </body>
      </html>`)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  const refreshGrid = () => $(gridRef.current).dxDataGrid('instance')?.refresh()
  const updateStorageFilter = (field, value) => setStorageFilters(prev => ({ ...prev, [field]: value }))
  const applyStorageFilters = (e) => {
    e?.preventDefault?.()
    setAppliedStorageFilters({ ...storageFilters })
  }
  const openReportModal = () => {
    setModalReportFilters(reportFilters())
    $(reportModalRef.current).modal('show')
  }
  const openBulkModal = (row = null) => {
    const rowClientId = row?.client_id ?? row?.client?.id ?? ''
    const defaultFilters = emptyBulkFilters()
    const rawDetractionPercent = row ? rowDetractionPercent(row) : 0
    const detractionPercent = rawDetractionPercent || defaultFilters.detractionPercent
    setBulkFilters({
      clientId: row ? `${rowClientId}` : '',
      documentType: row?.document_type ?? defaultFilters.documentType,
      currency: row?.currency ?? defaultFilters.currency,
      detraction: Boolean(row?.metadata?.detraction_enabled) || rawDetractionPercent > 0,
      detractionPercent,
    })
    setBulkRows(row ? [row] : [])
    setBulkSelected(row?.id ? [row.id] : [])
    $(bulkModalRef.current).modal('show')
  }
  const storageFilterValue = useMemo(
    () => isStorageBilling ? buildStorageFilter(activeStorageTab, appliedStorageFilters) : null,
    [isStorageBilling, activeStorageTab, appliedStorageFilters]
  )
  const prefacturesForBulkFilter = () => combineFilters([
    tabFilter('prefactures'),
    bulkFilters.clientId ? ['client_id', '=', Number(bulkFilters.clientId)] : null,
    bulkFilters.currency ? ['currency', '=', bulkFilters.currency] : null,
    bulkFilters.documentType ? ['document_type', '=', bulkFilters.documentType] : null,
  ])
  const loadBulkPrefactures = async (e) => {
    e?.preventDefault?.()
    if (!bulkFilters.clientId) {
      await showBlockedAction('Cliente requerido', 'Selecciona un cliente para buscar prefacturas.')
      return
    }
    setBulkLoading(true)
    try {
      const response = await billingDocumentsRest.paginate({ skip: 0, take: 1000, isLoadingAll: true, filter: prefacturesForBulkFilter() })
      if (Number(response?.status ?? 200) >= 400) throw new Error(response?.message || 'No se pudieron cargar las prefacturas')
      const rows = response?.data ?? []
      const detractionPercent = rowsDetractionPercent(rows)
      setBulkRows(rows)
      setBulkSelected(rows.map(row => row.id))
      setBulkFilters(prev => ({ ...prev, detraction: prev.detraction || detractionPercent > 0, detractionPercent: detractionPercent || prev.detractionPercent || 12 }))
    } catch (error) {
      await showBlockedAction('Error', error.message || 'No se pudieron cargar las prefacturas.')
    } finally {
      setBulkLoading(false)
    }
  }
  const toggleBulkRow = (id, checked) => setBulkSelected(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(item => item !== id))
  const toggleAllBulkRows = (checked) => setBulkSelected(checked ? bulkRows.map(row => row.id) : [])
  const selectedBulkRows = bulkRows.filter(row => bulkSelected.includes(row.id))
  const bulkTotal = selectedBulkRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0)
  const bulkDetractionPercent = toNumber(bulkFilters.detractionPercent, 0)
  const bulkDetractionAmount = bulkFilters.detraction ? selectedBulkRows.reduce((sum, row) => sum + rowDetractionAmount(row, bulkDetractionPercent), 0) : 0
  const bulkNetTotal = roundMoney(bulkTotal - bulkDetractionAmount)
  const onIssueBulk = async (e) => {
    e.preventDefault()
    if (bulkSelected.length === 0) {
      await showBlockedAction('Seleccion requerida', 'Selecciona al menos una prefactura.')
      return
    }
    const selectedRows = selectedBulkRows
    const selectedLabel = selectedRows.length === 1 ? selectedRows[0]?.code : `${bulkSelected.length} prefacturas seleccionadas`
    const { isConfirmed } = await Swal.fire({
      title: selectedRows.length === 1 ? 'Facturar prefactura' : 'Facturar en bloque',
      text: `Se asignara serie y numero a ${selectedLabel}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Facturar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return
    for (const row of selectedRows) {
      const result = await billingDocumentsRest.prepareVoucher(row.id, {
        detraction_enabled: bulkFilters.detraction,
        detraction_percent: bulkFilters.detraction ? bulkDetractionPercent : null,
        detraction_amount: bulkFilters.detraction ? rowDetractionAmount(row, bulkDetractionPercent) : null,
        detraction_code: '022',
        detraction_payment_method_code: '001',
      })
      if (!result) return
    }
    $(bulkModalRef.current).modal('hide')
    refreshGrid()
  }

  const reportFilterValue = (filters = modalReportFilters) => buildStorageFilter('issued', filters)
  const loadReportRows = async (filters = modalReportFilters) => {
    const response = await billingDocumentsRest.paginate({ skip: 0, take: 5000, isLoadingAll: true, filter: reportFilterValue(filters) })
    if (Number(response?.status ?? 200) >= 400) throw new Error(response?.message || 'No se pudo generar el reporte')
    return response?.data ?? []
  }
  const reportColumns = [
    ['Serie', row => row.series ?? ''],
    ['Secuencia', row => row.sequence ?? ''],
    ['SUNAT', row => rowSunatLabel(row)],
    ['E. Pago', row => row.payment_condition ?? ''],
    ['Cliente', row => rowClientName(row)],
    ['Moneda', row => currencyLabel(row.currency)],
    ['Gravada', row => Number(row.subtotal ?? 0)],
    ['IGV', row => Number(row.tax_amount ?? 0)],
    ['Importe', row => Number(row.total ?? 0)],
    ['A cuenta', () => 0],
    ['Saldo', () => 0],
    ['Fecha Facturacion', row => formatDate(row.issue_date)],
  ]
  const exportRows = async (rows, fileName, type = 'xlsx') => {
    if (type === 'pdf') {
      const JsPDF = window.jspdf?.jsPDF || window.jsPDF
      if (!JsPDF || !JsPDF.API?.autoTable) throw new Error('jsPDF o AutoTable no estan disponibles')
      const doc = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      doc.setFontSize(12)
      doc.text(fileName, 24, 28)
      doc.autoTable({
        head: [reportColumns.map(([label]) => label)],
        body: rows.map(row => reportColumns.map(([, value]) => value(row))),
        startY: 40,
        styles: { fontSize: 7, cellPadding: 3 },
      })
      doc.save(`${fileName}.pdf`)
      return
    }
    if (window.ExcelJS && window.saveAs) {
      const workbook = new window.ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Reporte')
      worksheet.addRow(reportColumns.map(([label]) => label))
      rows.forEach(row => worksheet.addRow(reportColumns.map(([, value]) => value(row))))
      worksheet.columns.forEach(column => { column.width = 18 })
      const buffer = await workbook.xlsx.writeBuffer()
      window.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${fileName}.xlsx`)
      return
    }
    const csv = [
      reportColumns.map(([label]) => `"${label}"`).join(','),
      ...rows.map(row => reportColumns.map(([, value]) => `"${`${value(row) ?? ''}`.replaceAll('"', '""')}"`).join(',')),
    ].join('\n')
    window.saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${fileName}.csv`)
  }
  const generateIssuedReport = async (type = 'xlsx', filters = modalReportFilters) => {
    try {
      const rows = await loadReportRows(filters)
      await exportRows(rows, 'reporte-facturas-emitidas', type)
    } catch (error) {
      await showBlockedAction('Reporte no disponible', error.message || 'No se pudo generar el reporte.')
    }
  }
  const storageStatusBadge = (row) => {
    if (row?.local_status === 'pending') {
      return hasPreparedVoucher(row)
        ? { label: 'Facturado', className: 'badge bg-soft-success text-success border border-success' }
        : { label: 'En espera', className: 'badge bg-soft-warning text-warning border border-warning' }
    }
    if (['sent', 'accepted', 'observed', 'rejected'].includes(row?.local_status)) {
      return { label: 'Facturado', className: 'badge bg-soft-success text-success border border-success' }
    }
    if (row?.local_status === 'cancelled') return { label: 'Anulada', className: 'badge bg-soft-danger text-danger border border-danger' }
    return { label: getBillingDocumentStatusLabel(row?.local_status), className: 'badge bg-soft-secondary text-secondary' }
  }

  const storageActionColumn = {
    caption: 'Acciones',
    width: 90,
    allowFiltering: false,
    allowExporting: false,
    allowSorting: false,
    cellTemplate: (container, { data }) => {
      const canDownload = canDownloadDocument(data)
      const isPrepared = hasPreparedVoucher(data)
      container.css({ textOverflow: 'unset', overflow: 'visible' })

      if (activeStorageTab === 'prefactures') {
        container.append(DxButton({
          className: `btn btn-xs ${isPrepared ? 'btn-outline-success' : 'btn-outline-primary'}`,
          title: isPrepared ? 'Imprimir comprobante' : 'Facturar',
          icon: isPrepared ? 'mdi mdi-file-document-outline' : 'mdi mdi-file-send-outline',
          onClick: () => isPrepared ? onPrintPreparedVoucher(data) : onPrepareVoucher(data)
        }))
        return
      }

      container.append(DxButton({
        className: `btn btn-xs ${canDownload ? 'btn-outline-danger' : 'btn-outline-info'}`,
        title: canDownload ? 'Descargar PDF' : 'Ver validacion fiscal',
        icon: canDownload ? 'mdi mdi-file-pdf-box' : 'mdi mdi-file-document-outline',
        onClick: () => canDownload ? onDownload(data, 'pdf') : openReadinessModal(data, `Validacion fiscal - ${data.code}`)
      }))
    }
  }

  const storageFilterFieldColumns = [
    { dataField: 'local_status', caption: 'Estado local', visible: false, showInColumnChooser: false, lookup: toLookup(billingControlStatusOptions) },
    { dataField: 'document_type', caption: 'Tipo comprobante', visible: false, showInColumnChooser: false },
    { dataField: 'business_id', caption: 'Empresa', dataType: 'number', visible: false, showInColumnChooser: false },
    { dataField: 'client_id', caption: 'Cliente', dataType: 'number', visible: false, showInColumnChooser: false },
    { dataField: 'created_at', caption: 'F. Registro', dataType: 'datetime', visible: false, showInColumnChooser: false },
  ]

  const withStorageFilterFields = (columns) => {
    const dataFields = new Set(columns.map(column => column?.dataField).filter(Boolean))
    return [
      ...columns,
      ...storageFilterFieldColumns.filter(column => !dataFields.has(column.dataField)),
    ]
  }

  const storageColumnsByTab = {
    prefactures: [
      storageActionColumn,
      {
        dataField: 'local_status',
        caption: 'E. Facturacion',
        width: 130,
        lookup: toLookup(billingControlStatusOptions),
        cellTemplate: (container, { data }) => {
          const badge = storageStatusBadge(data)
          container.append($('<span>').addClass(badge.className).text(badge.label))
        }
      },
      { dataField: 'code', caption: 'Codigo', width: 115 },
      { caption: 'Comprobante', width: 130, allowSorting: false, calculateCellValue: (data) => `${data.series || ''}${data.series || data.sequence ? ' - ' : ''}${data.sequence || ''}` || data.document_type },
      { caption: 'OS', width: 120, allowSorting: false, calculateCellValue: rowSourceCode },
      { caption: 'Tipo', minWidth: 260, allowSorting: false, calculateCellValue: rowDescription },
      { caption: 'Cliente', minWidth: 220, allowSorting: false, calculateCellValue: rowClientName },
      { dataField: 'total', caption: 'Importe', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { dataField: 'document_type', caption: 'Tipo comprobante', width: 140 },
      { dataField: 'currency', caption: 'Moneda', width: 100, calculateCellValue: (data) => currencyLabel(data.currency) },
      { caption: 'F. OS', dataType: 'date', width: 120, allowSorting: false, allowFiltering: false, calculateCellValue: rowServiceOrderDate },
      { dataField: 'created_at', caption: 'F. Registro', dataType: 'datetime', width: 160 },
    ],
    issued: [
      storageActionColumn,
      { dataField: 'series', caption: 'Serie', width: 90 },
      { dataField: 'sequence', caption: 'Secuencia', width: 110 },
      { caption: 'SUNAT', width: 140, allowSorting: false, calculateCellValue: rowSunatLabel },
      { dataField: 'payment_condition', caption: 'E. Pago', width: 110 },
      { caption: 'Cliente', minWidth: 220, allowSorting: false, calculateCellValue: rowClientName },
      { dataField: 'currency', caption: 'Moneda', width: 100, calculateCellValue: (data) => currencyLabel(data.currency) },
      { dataField: 'subtotal', caption: 'Gravada', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { dataField: 'tax_amount', caption: 'IGV', width: 90, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { dataField: 'total', caption: 'Importe', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { caption: 'A cuenta', width: 100, allowSorting: false, calculateCellValue: () => '0.00' },
      { caption: 'Saldo', width: 100, allowSorting: false, calculateCellValue: () => '0.00' },
      { dataField: 'issue_date', caption: 'Fecha Facturacion', dataType: 'date', width: 150 },
    ],
    cancelled: [
      storageActionColumn,
      { dataField: 'series', caption: 'Serie', width: 90 },
      { dataField: 'sequence', caption: 'Secuencia', width: 110 },
      { caption: 'Cliente', minWidth: 220, allowSorting: false, calculateCellValue: rowClientName },
      { dataField: 'currency', caption: 'Moneda', width: 100, calculateCellValue: (data) => currencyLabel(data.currency) },
      { dataField: 'subtotal', caption: 'Total Gravada', width: 130, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { dataField: 'tax_amount', caption: 'IGV', width: 90, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { dataField: 'total', caption: 'Importe Factura', width: 130, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { dataField: 'issue_date', caption: 'F. Facturacion', dataType: 'date', width: 130 },
      { dataField: 'cancelled_at', caption: 'F. Anulacion', dataType: 'datetime', width: 160 },
    ],
    'credit-notes': [
      storageActionColumn,
      { dataField: 'series', caption: 'Serie', width: 90 },
      { dataField: 'sequence', caption: 'Secuencia', width: 110 },
      { caption: 'SUNAT', width: 140, allowSorting: false, calculateCellValue: rowSunatLabel },
      { caption: 'Doc. Afecto', width: 130, allowSorting: false, calculateCellValue: (data) => data.reference_document?.code ?? data.referenceDocument?.code ?? '-' },
      { caption: 'Cliente', minWidth: 220, allowSorting: false, calculateCellValue: rowClientName },
      { dataField: 'currency', caption: 'Moneda', width: 100, calculateCellValue: (data) => currencyLabel(data.currency) },
      { dataField: 'subtotal', caption: 'Total Gravada', width: 130, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { dataField: 'tax_amount', caption: 'IGV', width: 90, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { dataField: 'total', caption: 'Importe Factura', width: 130, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { dataField: 'payment_condition', caption: 'Tipo de pago', width: 120 },
      { dataField: 'issue_date', caption: 'Fecha Facturacion', dataType: 'date', width: 150 },
    ],
  }

  const currentStorageColumns = withStorageFilterFields(storageColumnsByTab[activeStorageTab] ?? storageColumnsByTab.prefactures)

  const storageTitle = <div>
    <div className='d-flex align-items-center justify-content-between mb-2'>
      <h4 className='header-title mb-0'>Listado</h4>
      <button type='button' className='btn btn-xs btn-light' onClick={refreshGrid} title='Actualizar'><i className='mdi mdi-refresh'></i></button>
    </div>
    <ul className='nav nav-tabs nav-bordered mb-3'>
      {storageTabs.map(tab => (
        <li className='nav-item' key={`storage-billing-tab-${tab.id}`}>
          <button
            type='button'
            className={`nav-link ${activeStorageTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveStorageTab(tab.id)
              setStorageFilters(tab.id === 'prefactures' ? emptyFilters() : reportFilters())
              setAppliedStorageFilters(tab.id === 'prefactures' ? emptyFilters() : reportFilters())
            }}
          >
            {tab.label}
          </button>
        </li>
      ))}
    </ul>
    <form className='row g-3 align-items-end' onSubmit={applyStorageFilters}>
      <div className='col-12 col-lg-4'>
        <label className='form-label'>Empresa</label>
        <select className='form-select' value={storageFilters.businessId} onChange={(e) => updateStorageFilter('businessId', e.target.value)}>
          <option value=''>Todos</option>
          {businesses.map(row => <option key={`billing-business-${row.id}`} value={row.id}>{row.name}</option>)}
        </select>
      </div>
      {activeStorageTab === 'prefactures' && <div className='col-12 col-lg-3'>
        <label className='form-label'>Cliente</label>
        <select className='form-select' value={storageFilters.clientId} onChange={(e) => updateStorageFilter('clientId', e.target.value)}>
          <option value=''>Todos</option>
          {clients.map(row => <option key={`billing-client-${row.id}`} value={row.id}>{row.document_number ? `${row.document_number} - ` : ''}{row.full_name}</option>)}
        </select>
      </div>}
      <div className='col-12 col-md-6 col-lg-2'>
        <label className='form-label'>{activeStorageTab === 'prefactures' ? 'Fecha OS Inicio' : 'Fecha Registro Inicio'}</label>
        <input type='date' className='form-control' value={storageFilters.startDate} onChange={(e) => updateStorageFilter('startDate', e.target.value)} />
      </div>
      <div className='col-12 col-md-6 col-lg-2'>
        <label className='form-label'>{activeStorageTab === 'prefactures' ? 'Fecha OS Fin' : 'Fecha Registro Fin'}</label>
        <input type='date' className='form-control' value={storageFilters.endDate} onChange={(e) => updateStorageFilter('endDate', e.target.value)} />
      </div>
      <div className='col-12 col-lg-1 d-flex gap-2'>
        <button type='submit' className='btn btn-outline-primary w-100'><i className='mdi mdi-magnify me-1'></i>Filtrar</button>
      </div>
      {activeStorageTab === 'issued' && <div className='col-12 d-flex justify-content-center gap-2'>
        <button type='button' className='btn btn-outline-danger' onClick={() => generateIssuedReport('pdf', appliedStorageFilters)}><i className='mdi mdi-file-pdf-box me-1'></i>Generar reporte</button>
        <button type='button' className='btn btn-outline-success' onClick={() => generateIssuedReport('xlsx', appliedStorageFilters)}><i className='mdi mdi-file-excel-box me-1'></i>Reporte Excel</button>
      </div>}
    </form>
  </div>

  return <>
    {isStorageBilling && <div className='row g-3 mb-3'>
      <div className='col-12 col-md-6 col-xl-3'>
        <button type='button' className='btn w-100 d-flex align-items-center justify-content-between py-3 text-white' style={{ background: '#23264f' }} onClick={openBulkModal}>
          <span><i className='mdi mdi-plus-circle-outline me-1'></i>Facturar en bloque</span>
          <i className='mdi mdi-file-outline fs-4'></i>
        </button>
      </div>
      <div className='col-12 col-md-6 col-xl-3'>
        <button type='button' className='btn btn-success w-100 d-flex align-items-center justify-content-between py-3' onClick={openReportModal}>
          <span><i className='mdi mdi-plus-circle-outline me-1'></i>Reporte Facturas Emitidas</span>
          <i className='mdi mdi-file-outline fs-4'></i>
        </button>
      </div>
    </div>}

    <Table
      gridRef={gridRef}
      title={isStorageBilling ? storageTitle : moduleTitle}
      rest={billingDocumentsRest}
      pageSize={isStorageBilling ? 20 : 25}
      filterValue={storageFilterValue}
      exportable={isStorageBilling}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        if (!isStorageBilling) items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={isStorageBilling ? currentStorageColumns : [
        { dataField: 'id', caption: 'ID', width: 70 },
        { dataField: 'code', caption: 'Código', width: 120 },
        { dataField: 'source_type', caption: 'Origen', width: 120, calculateCellValue: (data) => getSourceTypeLabel(data.source_type) },
        { caption: 'Documento origen', minWidth: 150, calculateCellValue: (data) => data.commercial_order?.code ?? data.commercialOrder?.code ?? data.service_order?.code ?? data.serviceOrder?.code ?? '-' },
        { dataField: 'document_type', caption: 'Comprobante', width: 120 },
        { caption: 'Referencia', minWidth: 140, calculateCellValue: (data) => data.reference_document?.code ?? data.referenceDocument?.code ?? '-' },
        { dataField: 'series', caption: 'Serie', width: 80 },
        { dataField: 'sequence', caption: 'Número', width: 100 },
        { dataField: 'issue_date', caption: 'Fecha', dataType: 'date', width: 110 },
        { dataField: 'total', caption: 'Total', width: 100, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        {
          caption: 'Listo fiscal',
          width: 120,
          allowFiltering: false,
          allowSorting: false,
          cellTemplate: (container, { data }) => {
            const readiness = data?.fiscal_readiness ?? {}
            const meta = getReadinessMeta(readiness)
            const button = $('<button type="button" class="btn btn-xs w-100">')
              .addClass(meta.className)
              .text(meta.label)
              .attr('title', readiness.summary ?? meta.label)
              .on('click', () => openReadinessModal(data, `Validación fiscal - ${data.code}`))
            container.append(button)
          }
        },
        { dataField: 'local_status', caption: 'Estado local', width: 110, calculateCellValue: (data) => getBillingDocumentStatusLabel(data.local_status) },
        { dataField: 'external_status', caption: 'Estado externo', width: 120, calculateCellValue: (data) => getBillingDocumentStatusLabel(data.external_status) },
        { caption: 'Acciones', width: 470, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          const readiness = data?.fiscal_readiness ?? {}
          const canIssue = readiness?.can_issue !== false
          const canEdit = canEditDocument(data)
          const canSync = canSyncDocument(data)
          const canCancel = canCancelDocument(data)
          const canCreditNote = canCreditNoteDocument(data)
          const canDownload = canDownloadDocument(data)
          container.css('text-overflow', 'unset')
          container.append(DxButton({ className: `btn btn-xs ${canEdit ? 'btn-soft-primary' : 'btn-soft-secondary'} `, title: canEdit ? 'Editar comprobante' : 'Solo lectura', icon: canEdit ? 'mdi mdi-pencil' : 'mdi mdi-lock-outline', onClick: () => canEdit ? onModalOpen(data) : showBlockedAction('Comprobante bloqueado', 'Solo puedes editar comprobantes pendientes.') }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-info ms-1', title: 'Ver payload del conector', icon: 'mdi mdi-code-json', onClick: () => onOpenPayload(data) }))
          container.append(DxButton({ className: `btn btn-xs ${canIssue ? 'btn-soft-success' : 'btn-soft-secondary'} ms-1`, title: canIssue ? 'Emitir comprobante' : 'Revisar requisitos fiscales', icon: canIssue ? 'mdi mdi-send' : 'mdi mdi-alert-circle-outline', onClick: () => canIssue ? onIssue(data) : openReadinessModal(data, `Validación fiscal - ${data.code}`) }))
          container.append(DxButton({ className: `btn btn-xs ${canSync ? 'btn-soft-info' : 'btn-soft-secondary'} ms-1`, title: canSync ? 'Sincronizar estado' : 'Sincronización no disponible', icon: canSync ? 'mdi mdi-sync' : 'mdi mdi-sync-off', onClick: () => canSync ? onSyncStatus(data) : showBlockedAction('Sync no disponible', 'El comprobante aún no tiene datos remotos para sincronizar.') }))
          container.append(DxButton({ className: `btn btn-xs ${canCancel ? 'btn-soft-warning' : 'btn-soft-secondary'} ms-1`, title: canCancel ? 'Anular comprobante' : 'Anulación no disponible', icon: canCancel ? 'mdi mdi-close-circle' : 'mdi mdi-lock-outline', onClick: () => canCancel ? onOpenCancel(data) : showBlockedAction('Anulación no disponible', 'Solo puedes anular comprobantes aceptados que no sean notas de crédito.') }))
          container.append(DxButton({ className: `btn btn-xs ${canCreditNote ? 'btn-soft-secondary' : 'btn-soft-secondary'} ms-1`, title: canCreditNote ? 'Generar nota de crédito' : 'Nota de crédito no disponible', icon: canCreditNote ? 'mdi mdi-file-replace' : 'mdi mdi-file-lock-outline', onClick: () => canCreditNote ? onOpenCreditNote(data) : showBlockedAction('Nota de crédito no disponible', 'Solo puedes generar nota de crédito desde comprobantes aceptados que no sean notas de crédito.') }))
          container.append(DxButton({ className: `btn btn-xs ${canDownload ? 'btn-soft-danger' : 'btn-soft-secondary'} ms-1`, title: canDownload ? 'Descargar PDF' : 'PDF no disponible', icon: canDownload ? 'mdi mdi-file-pdf-box' : 'mdi mdi-file-cancel-outline', onClick: () => canDownload ? onDownload(data, 'pdf') : showBlockedAction('Descarga no disponible', 'El comprobante todavía no tiene archivos fiscales disponibles.') }))
          container.append(DxButton({ className: `btn btn-xs ${canDownload ? 'btn-soft-primary' : 'btn-soft-secondary'} ms-1`, title: canDownload ? 'Descargar XML' : 'XML no disponible', icon: canDownload ? 'mdi mdi-code-tags' : 'mdi mdi-file-cancel-outline', onClick: () => canDownload ? onDownload(data, 'xml') : showBlockedAction('Descarga no disponible', 'El comprobante todavía no tiene archivos fiscales disponibles.') }))
          container.append(DxButton({ className: `btn btn-xs ${canDownload ? 'btn-soft-success' : 'btn-soft-secondary'} ms-1`, title: canDownload ? 'Descargar CDR' : 'CDR no disponible', icon: canDownload ? 'mdi mdi-shield-check' : 'mdi mdi-file-cancel-outline', onClick: () => canDownload ? onDownload(data, 'cdr') : showBlockedAction('Descarga no disponible', 'El comprobante todavía no tiene archivos fiscales disponibles.') }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-dark ms-1', title: 'Registrar respuesta del proveedor', icon: 'mdi mdi-cloud-check', onClick: () => onOpenProviderModal(data) }))
        } }
      ]}
    />

    <Modal modalRef={modalRef} title='Documento de facturación' size='xl' onSubmit={onSave}>
      <div className='row'>
        <input ref={idRef} hidden />
        {!isStorageBilling && <div className='col-md-4 mb-3'>
          <label className='form-label'>Origen</label>
          <select className='form-control' value={sourceType} onChange={(e) => { setSourceType(e.target.value); setSourceId('') }}>
            <option value='commercial_order'>Pedido comercial</option>
            <option value='service_order'>Orden de servicio</option>
          </select>
        </div>}
        <div className={`${isStorageBilling ? 'col-md-12' : 'col-md-8'} mb-3`}>
          <label className='form-label'>{isStorageBilling ? 'Orden de servicio de almacenamiento' : 'Documento origen'}</label>
          <select className='form-control' value={sourceId} onChange={(e) => setSourceId(e.target.value)} required>
            <option value=''>Seleccione</option>
            {((!isStorageBilling && sourceType === 'commercial_order') ? commercialOrders : serviceOrders).map(row => <option key={`billing-source-${sourceType}-${row.id}`} value={row.id}>{row.code} - {row.client?.full_name ?? row.eventual_client?.business_name ?? row.eventualClient?.business_name ?? 'Cliente'}</option>)}
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Comprobante</label>
          <select ref={documentTypeRef} className='form-control'>
            <option value='Factura'>Factura</option>
            <option value='Boleta'>Boleta</option>
          </select>
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Serie</label><input ref={seriesRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Correlativo</label><input ref={sequenceRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Correo cliente</label><input ref={customerEmailRef} type='email' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha emisión</label><input ref={issueDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha vencimiento</label><input ref={dueDateRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Condición de pago</label>
          <select ref={paymentConditionRef} className='form-control'>
            <option value='Contado'>Contado</option>
            <option value='Credito'>Crédito</option>
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Medio pago</label>
          <select ref={paymentMethodRef} className='form-control'>
            <option value='Transferencia'>Transferencia</option>
            <option value='Efectivo'>Efectivo</option>
            <option value='Deposito'>Depósito</option>
          </select>
        </div>
        <div className='col-12 mb-1'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>

    {isStorageBilling && <Modal modalRef={reportModalRef} title='Reporte de Facturas Emitidas' size='xl' btnSubmitText='Generar Reporte Excel' onSubmit={(e) => { e.preventDefault(); generateIssuedReport('xlsx', modalReportFilters) }}>
      <div className='row align-items-end'>
        <div className='col-12 col-lg-4 mb-3'>
          <label className='form-label'>Empresa</label>
          <select className='form-select' value={modalReportFilters.businessId} onChange={(e) => setModalReportFilters(prev => ({ ...prev, businessId: e.target.value }))}>
            <option value=''>Todos</option>
            {businesses.map(row => <option key={`billing-report-business-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-12 col-lg-4 mb-3'>
          <label className='form-label'>Fecha Inicio</label>
          <input type='date' className='form-control' value={modalReportFilters.startDate} onChange={(e) => setModalReportFilters(prev => ({ ...prev, startDate: e.target.value }))} />
        </div>
        <div className='col-12 col-lg-4 mb-3'>
          <label className='form-label'>Fecha Fin</label>
          <input type='date' className='form-control' value={modalReportFilters.endDate} onChange={(e) => setModalReportFilters(prev => ({ ...prev, endDate: e.target.value }))} />
        </div>
      </div>
    </Modal>}

    {isStorageBilling && <Modal modalRef={bulkModalRef} title='Facturar Pre-Facturas' size='xl' btnSubmitText='Facturar' onSubmit={onIssueBulk}>
      <div className='row align-items-end'>
        <div className='col-12 col-lg-7 mb-3'>
          <label className='form-label'>Cliente</label>
          <select className='form-select' value={bulkFilters.clientId} onChange={(e) => setBulkFilters(prev => ({ ...prev, clientId: e.target.value }))}>
            <option value=''>Seleccione cliente</option>
            {clients.map(row => <option key={`billing-bulk-client-${row.id}`} value={row.id}>{row.document_number ? `${row.document_number} - ` : ''}{row.full_name}</option>)}
          </select>
        </div>
        <div className='col-12 col-md-6 col-lg-2 mb-3'>
          <label className='form-label'>Tipo documento</label>
          <select className='form-select' value={bulkFilters.documentType} onChange={(e) => setBulkFilters(prev => ({ ...prev, documentType: e.target.value }))}>
            <option value='Factura'>Factura</option>
            <option value='Boleta'>Boleta</option>
          </select>
        </div>
        <div className='col-12 col-md-6 col-lg-2 mb-3'>
          <label className='form-label'>Moneda</label>
          <select className='form-select' value={bulkFilters.currency} onChange={(e) => setBulkFilters(prev => ({ ...prev, currency: e.target.value }))}>
            <option value='PEN'>Soles</option>
            <option value='USD'>Dolares</option>
          </select>
        </div>
        <div className='col-12 col-lg-1 mb-3'>
          <button type='button' className='btn btn-outline-primary w-100' onClick={loadBulkPrefactures} disabled={bulkLoading}>
            <i className={`mdi ${bulkLoading ? 'mdi-loading mdi-spin' : 'mdi-check'} me-1`}></i>Filtrar
          </button>
        </div>
      </div>
      <div className='d-flex justify-content-between align-items-center mt-3 mb-2'>
        <div className='d-flex align-items-end gap-3 flex-wrap'>
          <div>
          <label className='form-label d-block mb-1'>Detraccion</label>
          <div className='form-check form-switch'>
            <input className='form-check-input' type='checkbox' checked={bulkFilters.detraction} onChange={(e) => setBulkFilters(prev => ({ ...prev, detraction: e.target.checked }))} id='billing-bulk-detraction' />
            <label className='form-check-label' htmlFor='billing-bulk-detraction'>{bulkFilters.detraction ? 'SI' : 'NO'}</label>
          </div>
          </div>
          {bulkFilters.detraction && <div style={{ width: 140 }}>
            <label className='form-label'>% detraccion</label>
            <input type='number' min='0' step='0.01' className='form-control' value={bulkFilters.detractionPercent} onChange={(e) => setBulkFilters(prev => ({ ...prev, detractionPercent: e.target.value }))} />
          </div>}
        </div>
        <div className='text-end'>
          <h3 className='mb-0'>Importe: <span className='text-success'>{formatMoney(bulkTotal)}</span></h3>
          {bulkFilters.detraction && <div className='text-muted mt-1'>
            Detraccion: {formatMoney(bulkDetractionAmount)} | Neto: {formatMoney(bulkNetTotal)}
          </div>}
        </div>
      </div>
      <h5 className='mt-4'>Lista de Pedidos</h5>
      <div className='d-flex justify-content-end mb-2'>
        <div className='form-check'>
          <input className='form-check-input' type='checkbox' checked={bulkRows.length > 0 && bulkSelected.length === bulkRows.length} onChange={(e) => toggleAllBulkRows(e.target.checked)} id='billing-bulk-check-all' />
          <label className='form-check-label' htmlFor='billing-bulk-check-all'>Seleccionar todos</label>
        </div>
      </div>
      <div className='table-responsive border'>
        <table className='table table-sm table-hover mb-0'>
          <thead>
            <tr>
              <th style={{ width: 90 }}>Acciones</th>
              <th>O. Servicio</th>
              <th>Tipo</th>
              <th>T. Documento</th>
              <th>N de Pre-Factura</th>
              <th>Cliente</th>
              <th>Moneda</th>
              <th className='text-end'>Importe</th>
              <th>Fecha Registro</th>
              <th>Usuario Registro</th>
            </tr>
          </thead>
          <tbody>
            {bulkRows.length === 0 && <tr><td colSpan='10' className='text-muted'>No existen elementos</td></tr>}
            {bulkRows.map(row => (
              <tr key={`bulk-billing-row-${row.id}`}>
                <td><input type='checkbox' checked={bulkSelected.includes(row.id)} onChange={(e) => toggleBulkRow(row.id, e.target.checked)} /></td>
                <td>{rowSourceCode(row)}</td>
                <td>{rowDescription(row)}</td>
                <td>{row.document_type}</td>
                <td>{row.code}</td>
                <td>{rowClientName(row)}</td>
                <td>{currencyLabel(row.currency)}</td>
                <td className='text-end'>{formatMoney(row.total)}</td>
                <td>{formatDate(row.created_at)}</td>
                <td>{row.creator?.fullname ?? row.creator?.username ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>}

    <Modal modalRef={payloadModalRef} title={`Payload del conector${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='xl' hideFooter>
      <textarea className='form-control' rows='24' value={payloadText} readOnly />
    </Modal>

    <Modal modalRef={providerModalRef} title={`Respuesta del proveedor${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='lg' onSubmit={onSaveProvider}>
      <div className='row'>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Estado local</label>
          <select ref={localStatusRef} className='form-control'>
            {billingDocumentStatusOptions
              .filter((option) => ['pending', 'sent', 'accepted', 'observed', 'rejected', 'cancelled'].includes(option.value))
              .map((option) => (
                <option key={`billing-document-local-status-${option.value}`} value={option.value}>{option.label}</option>
              ))}
          </select>
        </div>
        <div className='col-md-6 mb-3'><label className='form-label'>Estado externo</label><input ref={externalStatusRef} className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>ID externo</label><input ref={externalIdRef} className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>Referencia externa</label><input ref={externalReferenceRef} className='form-control' /></div>
        <div className='col-12 mb-3'><label className='form-label'>Error / observación</label><input ref={errorMessageRef} className='form-control' /></div>
        <div className='col-12 mb-1'><label className='form-label'>Payload de respuesta</label><textarea ref={responsePayloadRef} className='form-control' rows='8' /></div>
      </div>
    </Modal>

    <Modal modalRef={cancelModalRef} title={`Anular comprobante${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='md' onSubmit={onSaveCancel}>
      <div className='mb-1'>
        <label className='form-label'>Motivo</label>
        <textarea ref={cancelReasonRef} className='form-control' rows='4' required />
      </div>
    </Modal>

    <Modal modalRef={creditNoteModalRef} title={`Nota de crédito${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='lg' onSubmit={onSaveCreditNote}>
      <div className='row'>
        <div className='col-md-4 mb-3'><label className='form-label'>Serie</label><input ref={creditNoteSeriesRef} className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Fecha emisión</label><input ref={creditNoteIssueDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Motivo SUNAT</label><input ref={creditNoteReasonRef} className='form-control' required /></div>
        <div className='col-12 mb-1'><label className='form-label'>Observación interna</label><textarea ref={creditNoteNoteRef} className='form-control' rows='4' /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? scopedPermission('services-billing')
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Facturacion'}><BillingDocuments {...properties} /></BaseAdminto>)
})
