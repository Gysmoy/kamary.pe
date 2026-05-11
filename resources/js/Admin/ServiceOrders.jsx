import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import ServiceOrdersRest from '../Actions/Admin/ServiceOrdersRest';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import {
  billingStatusOptions,
  getPaymentStatusLabel,
  serviceOrderStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const serviceOrdersRest = new ServiceOrdersRest()
const emptyItem = () => ({ uid: crypto.randomUUID(), service_id: '', description: '', quantity: 1, unit_price: 0, detraction_percent: 0, commission_percent: 0, total: 0 })

const ServiceOrders = ({ moduleTitle = 'Ordenes de servicio' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const issueDateRef = useRef()
  const scheduledAtRef = useRef()
  const firstDueDateRef = useRef()
  const expectedDocumentTypeRef = useRef()
  const currencyRef = useRef()
  const billingCycleRef = useRef()
  const paymentConditionRef = useRef()
  const installmentsRef = useRef()
  const orderStatusRef = useRef()
  const billingStatusRef = useRef()
  const taxAmountRef = useRef()
  const observationsRef = useRef()

  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [isEditing, setIsEditing] = useState(false)

  const serviceMap = Object.fromEntries(services.map(row => [`${row.id}`, row]))

  useEffect(() => {
    Promise.all([serviceOrdersRest.getBusinesses(), serviceOrdersRest.getClients(), serviceOrdersRest.getServices()]).then(([businessList, clientList, serviceList]) => {
      setBusinesses(businessList ?? [])
      setClients((clientList ?? []).filter(row => row.status !== null))
      setServices((serviceList ?? []).filter(row => row.status !== null))
    })
  }, [])

  const loadBranches = async (businessId, preferred = '') => {
    const data = await serviceOrdersRest.getBranchesByBusiness(businessId)
    setBranches(data ?? [])
    setSelectedBranchId(preferred ? `${preferred}` : '')
  }

  const recalc = (row) => ({ ...row, total: Number(row.quantity || 0) * Number(row.unit_price || 0) })

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    issueDateRef.current.value = data?.issue_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    scheduledAtRef.current.value = data?.scheduled_at?.toString?.().slice?.(0, 10) ?? ''
    firstDueDateRef.current.value = data?.first_due_date?.toString?.().slice?.(0, 10) ?? ''
    expectedDocumentTypeRef.current.value = data?.expected_document_type ?? 'Factura'
    currencyRef.current.value = data?.currency ?? 'PEN'
    billingCycleRef.current.value = data?.billing_cycle ?? ''
    paymentConditionRef.current.value = data?.payment_condition ?? 'Contado'
    installmentsRef.current.value = Number(data?.installments ?? 1)
    orderStatusRef.current.value = data?.order_status ?? 'draft'
    billingStatusRef.current.value = data?.billing_status ?? 'pending'
    taxAmountRef.current.value = Number(data?.tax_amount ?? 0)
    observationsRef.current.value = data?.observations ?? ''
    setSelectedBusinessId(data?.business_id ? `${data.business_id}` : '')
    setSelectedClientId(data?.client_id ? `${data.client_id}` : '')
    await loadBranches(data?.business_id ?? '', data?.business_branch_id ?? '')
    setItems((data?.items ?? []).map(row => ({ uid: crypto.randomUUID(), service_id: `${row.service_id}`, description: row.description ?? '', quantity: Number(row.quantity || 0), unit_price: Number(row.unit_price || 0), detraction_percent: Number(row.detraction_percent || 0), commission_percent: Number(row.commission_percent || 0), total: Number(row.total || 0) })) || [emptyItem()])
    $(modalRef.current).modal('show')
  }

  const onItemChange = (uid, field, value) => {
    setItems(prev => prev.map(row => {
      if (row.uid !== uid) return row
      const next = { ...row, [field]: value }
      if (field === 'service_id') {
        const service = serviceMap[value]
        next.description = next.description || service?.name || ''
        next.unit_price = Number(currencyRef.current?.value === 'USD' ? service?.unit_price_usd : service?.unit_price_pen) || 0
      }
      return recalc(next)
    }))
  }

  const onSave = async (e) => {
    e.preventDefault()
    const request = {
      id: idRef.current.value || undefined,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      client_id: selectedClientId || null,
      expected_document_type: expectedDocumentTypeRef.current.value,
      currency: currencyRef.current.value,
      billing_cycle: billingCycleRef.current.value.trim(),
      payment_condition: paymentConditionRef.current.value,
      installments: installmentsRef.current.value,
      issue_date: issueDateRef.current.value,
      scheduled_at: scheduledAtRef.current.value || null,
      first_due_date: firstDueDateRef.current.value || null,
      order_status: orderStatusRef.current.value,
      billing_status: billingStatusRef.current.value,
      tax_amount: taxAmountRef.current.value,
      observations: observationsRef.current.value.trim(),
      items: items.filter(row => row.service_id).map(row => ({ service_id: row.service_id, description: row.description, quantity: row.quantity, unit_price: row.unit_price, detraction_percent: row.detraction_percent, commission_percent: row.commission_percent, total: row.total }))
    }
    const result = await serviceOrdersRest.save(request)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar orden de servicio', text: 'Se dara de baja la orden.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await serviceOrdersRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={serviceOrdersRest}
      pageSize={25}
      toolBar={(itemsBar) => {
        itemsBar.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        itemsBar.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        { dataField: 'id', caption: 'ID', width: 70 },
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 120,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar orden de servicio')
        },
        { dataField: 'issue_date', caption: 'Fecha', dataType: 'date', width: 110 },
        { dataField: 'client.full_name', caption: 'Cliente', minWidth: 200 },
        { dataField: 'expected_document_type', caption: 'Comp.', width: 100 },
        { dataField: 'currency', caption: 'Moneda', width: 90 },
        { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        {
          dataField: 'accounts_receivable_code',
          caption: 'CXC',
          width: 130,
          calculateCellValue: (data) => data.accounts_receivable?.code ?? data.accountsReceivable?.code ?? '-'
        },
        {
          dataField: 'payment_status',
          caption: 'Cobranza',
          width: 110,
          calculateCellValue: (data) => getPaymentStatusLabel(data.accounts_receivable?.payment_status ?? data.accountsReceivable?.payment_status ?? data.payment_status ?? '-')
        },
        { dataField: 'order_status', caption: 'Estado', width: 110, lookup: toLookup(serviceOrderStatusOptions) },
        { dataField: 'billing_status', caption: 'Facturacion', width: 110, lookup: toLookup(billingStatusOptions) },
        { caption: 'Acciones', width: 170, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css('text-overflow', 'unset')
          container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.serviceOrder(data)) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
        } }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar orden de servicio' : 'Agregar orden de servicio'} size='xl' onSubmit={onSave}>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Código</label><input ref={codeRef} className='form-control' disabled /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Empresa</label><select className='form-control' value={selectedBusinessId} onChange={async (e) => { setSelectedBusinessId(e.target.value); await loadBranches(e.target.value, ''); }} required><option value=''>Seleccione</option>{businesses.map(row => <option key={`service-order-business-${row.id}`} value={row.id}>{row.name}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Sede</label><select className='form-control' value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}><option value=''>Seleccione</option>{branches.map(row => <option key={`service-order-branch-${row.id}`} value={row.id}>{row.name}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Cliente</label><select className='form-control' value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required><option value=''>Seleccione</option>{clients.map(row => <option key={`service-order-client-${row.id}`} value={row.id}>{row.full_name}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha</label><input ref={issueDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Programada</label><input ref={scheduledAtRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Primera cuota</label><input ref={firstDueDateRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Ciclo</label><input ref={billingCycleRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Comprobante</label><select ref={expectedDocumentTypeRef} className='form-control'><option value='Factura'>Factura</option><option value='Boleta'>Boleta</option></select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Moneda</label><select ref={currencyRef} className='form-control'><option value='PEN'>PEN</option><option value='USD'>USD</option></select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Pago</label><select ref={paymentConditionRef} className='form-control'><option value='Contado'>Contado</option><option value='Credito'>Crédito</option></select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Cuotas</label><input ref={installmentsRef} type='number' min='1' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Estado</label><select ref={orderStatusRef} className='form-control'>{serviceOrderStatusOptions.map((option) => <option key={`service-order-status-${option.value}`} value={option.value}>{option.label}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Facturación</label><select ref={billingStatusRef} className='form-control'>{billingStatusOptions.map((option) => <option key={`service-order-billing-status-${option.value}`} value={option.value}>{option.label}</option>)}</select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Impuesto</label><input ref={taxAmountRef} type='number' step='0.01' className='form-control' /></div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Servicios</label>
          <div className='border rounded p-2'>
            {items.map(row => <div key={row.uid} className='row align-items-end mb-2'>
              <div className='col-md-4'><label className='form-label'>Servicio</label><select className='form-control' value={row.service_id} onChange={(e) => onItemChange(row.uid, 'service_id', e.target.value)}><option value=''>Seleccione</option>{services.map(service => <option key={`service-order-item-${service.id}`} value={service.id}>{service.code} - {service.name}</option>)}</select></div>
              <div className='col-md-3'><label className='form-label'>Descripción</label><input className='form-control' value={row.description} onChange={(e) => onItemChange(row.uid, 'description', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Cant.</label><input type='number' step='0.001' className='form-control' value={row.quantity} onChange={(e) => onItemChange(row.uid, 'quantity', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>PU</label><input type='number' step='0.01' className='form-control' value={row.unit_price} onChange={(e) => onItemChange(row.uid, 'unit_price', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Det.</label><input type='number' step='0.01' className='form-control' value={row.detraction_percent} onChange={(e) => onItemChange(row.uid, 'detraction_percent', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Com.</label><input type='number' step='0.01' className='form-control' value={row.commission_percent} onChange={(e) => onItemChange(row.uid, 'commission_percent', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Total</label><input className='form-control' value={Number(row.total || 0).toFixed(2)} disabled /></div>
              <div className='col-md-1'><button type='button' className='btn btn-outline-danger w-100' onClick={() => setItems(prev => prev.length === 1 ? [emptyItem()] : prev.filter(item => item.uid !== row.uid))}>-</button></div>
            </div>)}
            <button type='button' className='btn btn-sm btn-outline-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}>Agregar servicio</button>
          </div>
        </div>
        <div className='col-12 mb-1'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'services-service-order'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Ordenes de servicio'}><ServiceOrders {...properties} /></BaseAdminto>)
})
