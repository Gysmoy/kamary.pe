import React, { useEffect, useRef, useState } from 'react';
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
} from '../Utils/statusLabels';

const billingDocumentsRest = new BillingDocumentsRest()

const BillingDocuments = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const payloadModalRef = useRef()
  const providerModalRef = useRef()
  const cancelModalRef = useRef()
  const creditNoteModalRef = useRef()
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

  const [sourceType, setSourceType] = useState('commercial_order')
  const [sourceId, setSourceId] = useState('')
  const [commercialOrders, setCommercialOrders] = useState([])
  const [serviceOrders, setServiceOrders] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [payloadText, setPayloadText] = useState('')

  useEffect(() => {
    Promise.all([billingDocumentsRest.getCommercialOrders(), billingDocumentsRest.getServiceOrders()]).then(([commercial, services]) => {
      setCommercialOrders((commercial ?? []).filter(row => row.status !== null))
      setServiceOrders((services ?? []).filter(row => row.status !== null))
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

  const showBlockedAction = async (title, text) => {
    await Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'Cerrar'
    })
  }

  const openReadinessModal = async (row, title = 'Validacion fiscal') => {
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
    setSourceType(data?.source_type ?? 'commercial_order')
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
    if (sourceType === 'commercial_order') request.commercial_order_id = sourceId || null
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
      await openReadinessModal(row, 'El comprobante no esta listo para emitir')
      return
    }

    const { isConfirmed } = await Swal.fire({ title: 'Emitir comprobante', text: `Se emitira ${row.code} usando el conector configurado.`, icon: 'question', showCancelButton: true, confirmButtonText: 'Emitir', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await billingDocumentsRest.issue(row.id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
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
      showBlockedAction('Anulacion no disponible', 'Solo puedes anular comprobantes aceptados que no sean notas de credito.')
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
      showBlockedAction('Nota de credito no disponible', 'Solo puedes generar nota de credito desde comprobantes aceptados que no sean notas de credito.')
      return
    }

    setSelectedRow(row)
    creditNoteSeriesRef.current.value = row?.branch?.series_nota_credito ?? 'FC01'
    creditNoteIssueDateRef.current.value = new Date().toISOString().slice(0, 10)
    creditNoteReasonRef.current.value = 'Anulacion de la operacion'
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
      showBlockedAction('Descarga no disponible', 'El comprobante todavia no tiene archivos fiscales disponibles.')
      return
    }

    window.open(billingDocumentsRest.downloadUrl(row.id, type), '_blank', 'noopener')
  }

  return <>
    <Table
      gridRef={gridRef}
      title='Facturacion'
      rest={billingDocumentsRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        { dataField: 'id', caption: 'ID', width: 70 },
        { dataField: 'code', caption: 'Codigo', width: 120 },
        { dataField: 'source_type', caption: 'Origen', width: 120, calculateCellValue: (data) => getSourceTypeLabel(data.source_type) },
        { caption: 'Documento origen', minWidth: 150, calculateCellValue: (data) => data.commercial_order?.code ?? data.commercialOrder?.code ?? data.service_order?.code ?? data.serviceOrder?.code ?? '-' },
        { dataField: 'document_type', caption: 'Comprobante', width: 120 },
        { caption: 'Referencia', minWidth: 140, calculateCellValue: (data) => data.reference_document?.code ?? data.referenceDocument?.code ?? '-' },
        { dataField: 'series', caption: 'Serie', width: 80 },
        { dataField: 'sequence', caption: 'Numero', width: 100 },
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
              .on('click', () => openReadinessModal(data, `Validacion fiscal - ${data.code}`))
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
          container.append(DxButton({ className: `btn btn-xs ${canEdit ? 'btn-soft-primary' : 'btn-soft-secondary'} `, title: canEdit ? 'Editar' : 'Solo lectura', icon: canEdit ? 'mdi mdi-pencil' : 'mdi mdi-lock-outline', onClick: () => canEdit ? onModalOpen(data) : showBlockedAction('Comprobante bloqueado', 'Solo puedes editar comprobantes pendientes.') }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-info ms-1', title: 'Payload', icon: 'mdi mdi-code-json', onClick: () => onOpenPayload(data) }))
          container.append(DxButton({ className: `btn btn-xs ${canIssue ? 'btn-soft-success' : 'btn-soft-secondary'} ms-1`, title: canIssue ? 'Emitir' : 'Revisar requisitos fiscales', icon: canIssue ? 'mdi mdi-send' : 'mdi mdi-alert-circle-outline', onClick: () => canIssue ? onIssue(data) : openReadinessModal(data, `Validacion fiscal - ${data.code}`) }))
          container.append(DxButton({ className: `btn btn-xs ${canSync ? 'btn-soft-info' : 'btn-soft-secondary'} ms-1`, title: canSync ? 'Sync' : 'Sync no disponible', icon: canSync ? 'mdi mdi-sync' : 'mdi mdi-sync-off', onClick: () => canSync ? onSyncStatus(data) : showBlockedAction('Sync no disponible', 'El comprobante aun no tiene datos remotos para sincronizar.') }))
          container.append(DxButton({ className: `btn btn-xs ${canCancel ? 'btn-soft-warning' : 'btn-soft-secondary'} ms-1`, title: canCancel ? 'Anular' : 'Anulacion no disponible', icon: canCancel ? 'mdi mdi-close-circle' : 'mdi mdi-lock-outline', onClick: () => canCancel ? onOpenCancel(data) : showBlockedAction('Anulacion no disponible', 'Solo puedes anular comprobantes aceptados que no sean notas de credito.') }))
          container.append(DxButton({ className: `btn btn-xs ${canCreditNote ? 'btn-soft-secondary' : 'btn-soft-secondary'} ms-1`, title: canCreditNote ? 'N/C' : 'N/C no disponible', icon: canCreditNote ? 'mdi mdi-file-replace' : 'mdi mdi-file-lock-outline', onClick: () => canCreditNote ? onOpenCreditNote(data) : showBlockedAction('Nota de credito no disponible', 'Solo puedes generar nota de credito desde comprobantes aceptados que no sean notas de credito.') }))
          container.append(DxButton({ className: `btn btn-xs ${canDownload ? 'btn-soft-danger' : 'btn-soft-secondary'} ms-1`, title: canDownload ? 'PDF' : 'PDF no disponible', icon: canDownload ? 'mdi mdi-file-pdf-box' : 'mdi mdi-file-cancel-outline', onClick: () => canDownload ? onDownload(data, 'pdf') : showBlockedAction('Descarga no disponible', 'El comprobante todavia no tiene archivos fiscales disponibles.') }))
          container.append(DxButton({ className: `btn btn-xs ${canDownload ? 'btn-soft-primary' : 'btn-soft-secondary'} ms-1`, title: canDownload ? 'XML' : 'XML no disponible', icon: canDownload ? 'mdi mdi-code-tags' : 'mdi mdi-file-cancel-outline', onClick: () => canDownload ? onDownload(data, 'xml') : showBlockedAction('Descarga no disponible', 'El comprobante todavia no tiene archivos fiscales disponibles.') }))
          container.append(DxButton({ className: `btn btn-xs ${canDownload ? 'btn-soft-success' : 'btn-soft-secondary'} ms-1`, title: canDownload ? 'CDR' : 'CDR no disponible', icon: canDownload ? 'mdi mdi-shield-check' : 'mdi mdi-file-cancel-outline', onClick: () => canDownload ? onDownload(data, 'cdr') : showBlockedAction('Descarga no disponible', 'El comprobante todavia no tiene archivos fiscales disponibles.') }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-dark ms-1', title: 'Proveedor', icon: 'mdi mdi-cloud-check', onClick: () => onOpenProviderModal(data) }))
        } }
      ]}
    />

    <Modal modalRef={modalRef} title='Documento de facturacion' size='xl' onSubmit={onSave}>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Origen</label>
          <select className='form-control' value={sourceType} onChange={(e) => { setSourceType(e.target.value); setSourceId('') }}>
            <option value='commercial_order'>Pedido comercial</option>
            <option value='service_order'>Orden de servicio</option>
          </select>
        </div>
        <div className='col-md-8 mb-3'>
          <label className='form-label'>Documento origen</label>
          <select className='form-control' value={sourceId} onChange={(e) => setSourceId(e.target.value)} required>
            <option value=''>Seleccione</option>
            {(sourceType === 'commercial_order' ? commercialOrders : serviceOrders).map(row => <option key={`billing-source-${sourceType}-${row.id}`} value={row.id}>{row.code} - {row.client?.full_name ?? row.eventual_client?.business_name ?? row.eventualClient?.business_name ?? 'Cliente'}</option>)}
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
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha emision</label><input ref={issueDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha vencimiento</label><input ref={dueDateRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Condicion pago</label>
          <select ref={paymentConditionRef} className='form-control'>
            <option value='Contado'>Contado</option>
            <option value='Credito'>Credito</option>
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Medio pago</label>
          <select ref={paymentMethodRef} className='form-control'>
            <option value='Transferencia'>Transferencia</option>
            <option value='Efectivo'>Efectivo</option>
            <option value='Deposito'>Deposito</option>
          </select>
        </div>
        <div className='col-12 mb-1'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>

    <Modal modalRef={payloadModalRef} title={`Payload REST${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='xl' hideFooter>
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
        <div className='col-12 mb-3'><label className='form-label'>Error / observacion</label><input ref={errorMessageRef} className='form-control' /></div>
        <div className='col-12 mb-1'><label className='form-label'>Payload de respuesta</label><textarea ref={responsePayloadRef} className='form-control' rows='8' /></div>
      </div>
    </Modal>

    <Modal modalRef={cancelModalRef} title={`Anular comprobante${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='md' onSubmit={onSaveCancel}>
      <div className='mb-1'>
        <label className='form-label'>Motivo</label>
        <textarea ref={cancelReasonRef} className='form-control' rows='4' required />
      </div>
    </Modal>

    <Modal modalRef={creditNoteModalRef} title={`Nota de credito${selectedRow ? ` - ${selectedRow.code}` : ''}`} size='lg' onSubmit={onSaveCreditNote}>
      <div className='row'>
        <div className='col-md-4 mb-3'><label className='form-label'>Serie</label><input ref={creditNoteSeriesRef} className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Fecha emision</label><input ref={creditNoteIssueDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Motivo SUNAT</label><input ref={creditNoteReasonRef} className='form-control' required /></div>
        <div className='col-12 mb-1'><label className='form-label'>Observacion interna</label><textarea ref={creditNoteNoteRef} className='form-control' rows='4' /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.can('services-billing') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Facturacion'><BillingDocuments {...properties} /></BaseAdminto>)
})
