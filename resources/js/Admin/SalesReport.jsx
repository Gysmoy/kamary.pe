import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import SalesReportRest from '../Actions/Admin/SalesReportRest';
import {
  billingStatusOptions,
  getSourceTypeLabel,
  operationalOrderStatusOptions,
  paymentStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const salesReportRest = new SalesReportRest()

const SalesReport = () => {
  const gridRef = useRef()
  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [businessId, setBusinessId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const load = async () => setBusinesses((await salesReportRest.getBusinesses())?.filter(row => row.status !== null) ?? [])
    load()
  }, [])

  useEffect(() => {
    const loadBranches = async () => {
      if (!businessId) {
        setBranches([])
        setBranchId('')
        return
      }
      setBranches((await salesReportRest.getBranchesByBusiness(businessId))?.filter(row => row.status !== null) ?? [])
      setBranchId('')
    }
    loadBranches()
  }, [businessId])

  useEffect(() => {
    salesReportRest.setFilters({
      business_id: businessId || '',
      business_branch_id: branchId || '',
      source_type: sourceType || '',
      order_status: orderStatus || '',
      document_type: documentType || '',
      date_from: dateFrom || '',
      date_to: dateTo || '',
    })
    if (!gridRef.current) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }, [businessId, branchId, sourceType, orderStatus, documentType, dateFrom, dateTo])

  return <div className='row'>
    <div className='col-12'>
      <div className='card mb-3'>
        <div className='card-body'>
          <div className='row'>
            <div className='col-md-3 mb-3'>
              <label className='form-label'>Empresa</label>
              <select className='form-control' value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                <option value=''>Todas</option>
                {businesses.map(row => <option key={`sales-report-business-${row.id}`} value={row.id}>{row.name}</option>)}
              </select>
            </div>
            <div className='col-md-3 mb-3'>
              <label className='form-label'>Sede</label>
              <select className='form-control' value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value=''>Todas</option>
                {branches.map(row => <option key={`sales-report-branch-${row.id}`} value={row.id}>{row.name}</option>)}
              </select>
            </div>
            <div className='col-md-2 mb-3'>
              <label className='form-label'>Origen</label>
              <select className='form-control' value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                <option value=''>Todos</option>
                <option value='commercial_order'>Pedido comercial</option>
                <option value='service_order'>Orden de servicio</option>
              </select>
            </div>
            <div className='col-md-2 mb-3'>
              <label className='form-label'>Estado</label>
              <select className='form-control' value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
                <option value=''>Todos</option>
                {operationalOrderStatusOptions.map((option) => (
                  <option key={`sales-report-order-status-${option.value}`} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className='col-md-2 mb-3'>
              <label className='form-label'>Comprobante</label>
              <select className='form-control' value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                <option value=''>Todos</option>
                <option value='Factura'>Factura</option>
                <option value='Boleta'>Boleta</option>
                <option value='Nota de credito'>Nota de credito</option>
              </select>
            </div>
            <div className='col-md-2 mb-3'>
              <label className='form-label'>Desde</label>
              <input type='date' className='form-control' value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className='col-md-2 mb-3'>
              <label className='form-label'>Hasta</label>
              <input type='date' className='form-control' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className='col-12'>
      <Table
        gridRef={gridRef}
        title='Reporte de ventas'
        rest={salesReportRest}
        exportable
        pageSize={25}
        toolBar={(items) => {
          items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        }}
        columns={[
          { dataField: 'issue_date', caption: 'Fecha', dataType: 'date', width: 110 },
          { dataField: 'source_type', caption: 'Origen', width: 120, calculateCellValue: (data) => getSourceTypeLabel(data.source_type) },
          { dataField: 'source_code', caption: 'Documento', width: 130 },
          { dataField: 'business_name', caption: 'Empresa', minWidth: 150 },
          { dataField: 'branch_name', caption: 'Sede', minWidth: 140 },
          { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 140 },
          { dataField: 'customer_name', caption: 'Cliente', minWidth: 220 },
          { dataField: 'seller_name', caption: 'Vendedor', minWidth: 160 },
          { dataField: 'document_type', caption: 'Comp. esperado', width: 120 },
          { dataField: 'billing_documents', caption: 'Comprobantes', minWidth: 220 },
          { dataField: 'subtotal', caption: 'Subtotal', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'tax_amount', caption: 'IGV', width: 100, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'paid_amount', caption: 'Pagado', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'balance_amount', caption: 'Saldo', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'payment_status', caption: 'Estado pago', width: 110, lookup: toLookup(paymentStatusOptions) },
          { dataField: 'billing_status', caption: 'Estado fact.', width: 110, lookup: toLookup(billingStatusOptions) },
          { dataField: 'order_status', caption: 'Estado oper.', width: 110, calculateCellValue: (data) => operationalOrderStatusOptions.find((option) => option.value === data.order_status)?.label ?? data.order_status ?? '-' },
        ]}
      />
    </div>
  </div>
}

CreateReactScript((el, properties) => {
  if (!properties.can('orders') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Reporte de ventas'><SalesReport {...properties} /></BaseAdminto>)
})
