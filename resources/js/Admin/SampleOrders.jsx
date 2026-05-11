import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import SampleOrdersRest from '../Actions/Admin/SampleOrdersRest';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';

const sampleOrdersRest = new SampleOrdersRest()

const orderStatusOptions = [
  { value: 'registered', label: 'Registrado' },
  { value: 'processing', label: 'En proceso' },
  { value: 'completed', label: 'Completo' },
  { value: 'cancelled', label: 'Anulado' },
]

const emailStatusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'sent', label: 'Enviado' },
  { value: 'failed', label: 'Fallido' },
]

const toLookup = (items) => ({
  dataSource: items,
  valueExpr: 'value',
  displayExpr: 'label',
})

const optionLabel = (items, value) => items.find(item => item.value === value)?.label ?? value ?? ''

const SampleOrders = ({ moduleTitle = 'Muestras - Pedido' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const orderNumberRef = useRef()
  const orderStatusRef = useRef()
  const emailStatusRef = useRef()
  const referralGuideRef = useRef()
  const totalGrossWeightRef = useRef()
  const channelRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const clientNameRef = useRef()
  const orderCompleteRef = useRef()
  const requestedAtRef = useRef()
  const deliveredAtRef = useRef()
  const supervisorNameRef = useRef()
  const cancellationReasonRef = useRef()
  const observationsRef = useRef()
  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    orderNumberRef.current.value = data?.order_number ?? 'Se genera al guardar'
    orderStatusRef.current.value = data?.order_status ?? 'registered'
    emailStatusRef.current.value = data?.email_status ?? 'pending'
    referralGuideRef.current.value = data?.referral_guide ?? ''
    totalGrossWeightRef.current.value = data?.total_gross_weight ?? ''
    channelRef.current.value = data?.channel ?? ''
    documentTypeRef.current.value = data?.document_type ?? 'RUC'
    documentNumberRef.current.value = data?.document_number ?? ''
    clientNameRef.current.value = data?.client_name ?? ''
    orderCompleteRef.current.checked = !!data?.order_complete
    requestedAtRef.current.value = data?.requested_at?.toString?.().slice?.(0, 10) ?? ''
    deliveredAtRef.current.value = data?.delivered_at?.toString?.().slice?.(0, 10) ?? ''
    supervisorNameRef.current.value = data?.supervisor_name ?? ''
    cancellationReasonRef.current.value = data?.cancellation_reason ?? ''
    observationsRef.current.value = data?.observations ?? ''
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const result = await sampleOrdersRest.save({
      id: idRef.current.value || undefined,
      order_number: isEditing ? orderNumberRef.current.value.trim() : '',
      order_status: orderStatusRef.current.value,
      email_status: emailStatusRef.current.value,
      referral_guide: referralGuideRef.current.value.trim(),
      total_gross_weight: totalGrossWeightRef.current.value,
      channel: channelRef.current.value.trim(),
      document_type: documentTypeRef.current.value,
      document_number: documentNumberRef.current.value.trim(),
      client_name: clientNameRef.current.value.trim(),
      order_complete: orderCompleteRef.current.checked,
      requested_at: requestedAtRef.current.value || null,
      delivered_at: deliveredAtRef.current.value || null,
      supervisor_name: supervisorNameRef.current.value.trim(),
      cancellation_reason: cancellationReasonRef.current.value.trim(),
      observations: observationsRef.current.value.trim(),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await sampleOrdersRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar pedido',
      text: 'Se dara de baja el pedido de muestra.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return
    const result = await sampleOrdersRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={sampleOrdersRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        { dataField: 'order_status', caption: 'Estado pedido', minWidth: 120, lookup: toLookup(orderStatusOptions), calculateCellValue: (data) => optionLabel(orderStatusOptions, data.order_status) },
        { dataField: 'email_status', caption: 'Estado email', minWidth: 120, lookup: toLookup(emailStatusOptions), calculateCellValue: (data) => optionLabel(emailStatusOptions, data.email_status) },
        { dataField: 'referral_guide', caption: 'Guia remision', minWidth: 140 },
        { dataField: 'total_gross_weight', caption: 'Peso bruto total', dataType: 'number', width: 130, format: { type: 'fixedPoint', precision: 3 } },
        { dataField: 'order_number', caption: 'Nro pedido', width: 130 },
        { dataField: 'channel', caption: 'Canal', minWidth: 120 },
        { dataField: 'document_type', caption: 'Tipo doc.', width: 95 },
        { dataField: 'document_number', caption: 'Documento', width: 130 },
        { dataField: 'client_name', caption: 'Cliente', minWidth: 220 },
        { dataField: 'order_complete', caption: 'Completo', dataType: 'boolean', width: 100 },
        { dataField: 'requested_at', caption: 'Fecha pedido', dataType: 'date', width: 120 },
        { dataField: 'delivered_at', caption: 'Fecha entrega', dataType: 'date', width: 120 },
        { dataField: 'supervisor_name', caption: 'Supervisor', minWidth: 150 },
        { dataField: 'cancellation_reason', caption: 'Motivo anulacion', minWidth: 180, visible: false },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onStatusChange(data)} />)
          }
        },
        {
          caption: 'Acciones',
          width: 160,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.sampleOrder(data)) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary ms-1', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
          }
        },
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar pedido de muestra' : 'Agregar pedido de muestra'} size='xl' onSubmit={onSave}>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Nro pedido</label><input ref={orderNumberRef} className='form-control' disabled={!isEditing} /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Estado pedido</label><select ref={orderStatusRef} className='form-control'>{orderStatusOptions.map(option => <option key={`sample-status-${option.value}`} value={option.value}>{option.label}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Estado email</label><select ref={emailStatusRef} className='form-control'>{emailStatusOptions.map(option => <option key={`sample-email-${option.value}`} value={option.value}>{option.label}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Guia remision</label><input ref={referralGuideRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Peso bruto total</label><input ref={totalGrossWeightRef} type='number' step='0.001' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Canal</label><input ref={channelRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Tipo documento</label><select ref={documentTypeRef} className='form-control'><option value='RUC'>RUC</option><option value='DNI'>DNI</option><option value='CE'>CE</option></select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Documento</label><input ref={documentNumberRef} className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>Cliente</label><input ref={clientNameRef} className='form-control' required /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha pedido</label><input ref={requestedAtRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha entrega</label><input ref={deliveredAtRef} type='date' className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>Supervisor</label><input ref={supervisorNameRef} className='form-control' /></div>
        <div className='col-md-3 mb-3 form-check mt-4'><input ref={orderCompleteRef} type='checkbox' className='form-check-input' id='sampleOrderComplete' /><label className='form-check-label' htmlFor='sampleOrderComplete'>Pedido completo</label></div>
        <div className='col-12 mb-3'><label className='form-label'>Motivo anulacion</label><textarea ref={cancellationReasonRef} className='form-control' rows='2' /></div>
        <div className='col-12 mb-1'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'sample-orders'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Muestras - Pedido'}><SampleOrders {...properties} /></BaseAdminto>)
})
