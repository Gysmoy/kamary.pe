import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Swal from 'sweetalert2';
import SalesReportRest from '../Actions/Admin/SalesReportRest';
import {
  billingStatusOptions,
  getBillingStatusLabel,
  getPaymentStatusLabel,
  getSourceTypeLabel,
  operationalOrderStatusOptions,
  paymentStatusOptions,
  sourceTypeOptions,
} from '../Utils/statusLabels';

const salesReportRest = new SalesReportRest()

const documentTypeOptions = [
  { value: 'Factura', label: 'Factura' },
  { value: 'Boleta', label: 'Boleta' },
  { value: 'Nota de credito', label: 'Nota de credito' },
]

const money = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const getOrderStatusLabel = (value) => operationalOrderStatusOptions.find((option) => option.value === value)?.label ?? value ?? '-'

const exportColumns = [
  { label: 'Fecha', value: (row) => row.issue_date ?? '' },
  { label: 'Origen', value: (row) => getSourceTypeLabel(row.source_type) },
  { label: 'Documento', value: (row) => row.source_code ?? '' },
  { label: 'Empresa', value: (row) => row.business_name ?? '' },
  { label: 'Sede', value: (row) => row.branch_name ?? '' },
  { label: 'Almacen', value: (row) => row.warehouse_name ?? '' },
  { label: 'Cliente', value: (row) => row.customer_name ?? '' },
  { label: 'Vendedor', value: (row) => row.seller_name ?? '' },
  { label: 'Comp. esperado', value: (row) => row.document_type ?? '' },
  { label: 'Comprobantes', value: (row) => row.billing_documents ?? '' },
  { label: 'Subtotal', value: (row) => Number(row.subtotal ?? 0) },
  { label: 'IGV', value: (row) => Number(row.tax_amount ?? 0) },
  { label: 'Total', value: (row) => Number(row.total ?? 0) },
  { label: 'Pagado', value: (row) => Number(row.paid_amount ?? 0) },
  { label: 'Saldo', value: (row) => Number(row.balance_amount ?? 0) },
  { label: 'Estado pago', value: (row) => getPaymentStatusLabel(row.payment_status) },
  { label: 'Estado fact.', value: (row) => getBillingStatusLabel(row.billing_status) },
  { label: 'Estado oper.', value: (row) => getOrderStatusLabel(row.order_status) },
]

const SalesReport = () => {
  const tableRef = useRef()
  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [businessId, setBusinessId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exporting, setExporting] = useState(false)

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
    tableRef.current?.refresh()
  }, [businessId, branchId, sourceType, orderStatus, documentType, dateFrom, dateTo])

  const onExport = async () => {
    if (!window.ExcelJS) {
      Swal.fire({ icon: 'error', title: 'Exportacion no disponible', text: 'ExcelJS no esta cargado.' })
      return
    }
    setExporting(true)
    try {
      const rows = await tableRef.current?.loadAll()
      if (!rows?.length) {
        Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay filas para exportar.' })
        return
      }
      const workbook = new window.ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Reporte')
      worksheet.columns = exportColumns.map((column) => ({ header: column.label, key: column.label, width: 18 }))
      rows.forEach((row) => worksheet.addRow(exportColumns.map((column) => column.value(row))))
      worksheet.getRow(1).font = { bold: true }
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/octet-stream' })
      if (window.saveAs) {
        window.saveAs(blob, 'reporte-de-ventas.xlsx')
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'reporte-de-ventas.xlsx'
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error?.message || 'No se pudo exportar el reporte.' })
    } finally {
      setExporting(false)
    }
  }

  return <div className='row'>
    <div className='col-12'>
      <div className='card mb-3'>
        <div className='card-body'>
          <div className='row'>
            <VdSelect
              label='Empresa'
              col='col-md-3'
              value={businessId}
              onChange={setBusinessId}
              options={[{ value: '', label: 'Todas' }, ...businesses.map(row => ({ value: `${row.id}`, label: row.name }))]}
              placeholder='Todas'
            />
            <VdSelect
              label='Sede'
              col='col-md-3'
              value={branchId}
              onChange={setBranchId}
              options={[{ value: '', label: 'Todas' }, ...branches.map(row => ({ value: `${row.id}`, label: row.name }))]}
              placeholder='Todas'
            />
            <VdSelect
              label='Origen'
              col='col-md-2'
              value={sourceType}
              onChange={setSourceType}
              options={[{ value: '', label: 'Todos' }, ...sourceTypeOptions]}
              placeholder='Todos'
            />
            <VdSelect
              label='Estado'
              col='col-md-2'
              value={orderStatus}
              onChange={setOrderStatus}
              options={[{ value: '', label: 'Todos' }, ...operationalOrderStatusOptions]}
              placeholder='Todos'
            />
            <VdSelect
              label='Comprobante'
              col='col-md-2'
              value={documentType}
              onChange={setDocumentType}
              options={[{ value: '', label: 'Todos' }, ...documentTypeOptions]}
              placeholder='Todos'
            />
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
      <VdTable
        ref={tableRef}
        rest={salesReportRest}
        icon='mdi mdi-chart-line'
        title='Reporte de ventas'
        unit='ventas'
        defaultPageSize={25}
        searchFields={['source_code', 'business_name', 'branch_name', 'warehouse_name', 'customer_name', 'seller_name', 'billing_documents']}
        searchPlaceholder='Buscar por documento, cliente o vendedor…'
        emptyText='No se encontraron ventas.'
        headerActions={<>
          <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
            <i className='mdi mdi-refresh'></i>
          </button>
          <button type='button' className='vdt-btn-soft' disabled={exporting} onClick={onExport}>
            <i className={`mdi ${exporting ? 'mdi-loading mdi-spin' : 'mdi-file-excel'}`}></i> Exportar
          </button>
        </>}
        columns={[
          { key: 'fecha', label: 'Fecha', field: 'issue_date', width: '110px', filter: { type: 'date' } },
          {
            key: 'origen', label: 'Origen', field: 'source_type', width: '130px',
            filter: { type: 'select', options: sourceTypeOptions },
            render: (row) => getSourceTypeLabel(row.source_type),
          },
          { key: 'documento', label: 'Documento', field: 'source_code', width: '130px', filter: { type: 'text' } },
          { key: 'empresa', label: 'Empresa', field: 'business_name', filter: { type: 'text' } },
          { key: 'sede', label: 'Sede', field: 'branch_name', filter: { type: 'text' } },
          { key: 'almacen', label: 'Almacen', field: 'warehouse_name', filter: { type: 'text' } },
          { key: 'cliente', label: 'Cliente', field: 'customer_name', filter: { type: 'text' } },
          { key: 'vendedor', label: 'Vendedor', field: 'seller_name', filter: { type: 'text' } },
          {
            key: 'comp_esperado', label: 'Comp. esperado', field: 'document_type', width: '140px',
            filter: { type: 'select', options: documentTypeOptions },
          },
          { key: 'comprobantes', label: 'Comprobantes', field: 'billing_documents', filter: { type: 'text' } },
          {
            key: 'subtotal', label: 'Subtotal', field: 'subtotal', width: '110px', align: 'right',
            filter: { type: 'number' }, render: (row) => money(row.subtotal),
          },
          {
            key: 'igv', label: 'IGV', field: 'tax_amount', width: '100px', align: 'right',
            filter: { type: 'number' }, render: (row) => money(row.tax_amount),
          },
          {
            key: 'total', label: 'Total', field: 'total', width: '110px', align: 'right',
            filter: { type: 'number' }, render: (row) => money(row.total),
          },
          {
            key: 'pagado', label: 'Pagado', field: 'paid_amount', width: '110px', align: 'right',
            filter: { type: 'number' }, render: (row) => money(row.paid_amount),
          },
          {
            key: 'saldo', label: 'Saldo', field: 'balance_amount', width: '110px', align: 'right',
            filter: { type: 'number' }, render: (row) => money(row.balance_amount),
          },
          {
            key: 'estado_pago', label: 'Estado pago', field: 'payment_status', width: '120px',
            filter: { type: 'select', options: paymentStatusOptions },
            render: (row) => getPaymentStatusLabel(row.payment_status),
          },
          {
            key: 'estado_fact', label: 'Estado fact.', field: 'billing_status', width: '120px',
            filter: { type: 'select', options: billingStatusOptions },
            render: (row) => getBillingStatusLabel(row.billing_status),
          },
          {
            key: 'estado_oper', label: 'Estado oper.', field: 'order_status', width: '120px',
            filter: { type: 'select', options: operationalOrderStatusOptions },
            render: (row) => getOrderStatusLabel(row.order_status),
          },
        ]}
        renderCard={(row) => (
          <div className='vdt-card'>
            <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.source_code}</p>
                <small className='text-muted'>{row.issue_date} · {getSourceTypeLabel(row.source_type)}</small>
              </div>
              <span className='badge badge-soft-primary'>S/ {money(row.total)}</span>
            </div>
            <p className='text-muted mb-0 mt-2' style={{ fontSize: 12 }}>{row.customer_name}</p>
            <small className='text-muted d-block mt-1'>{[row.business_name, row.branch_name, row.warehouse_name].filter(Boolean).join(' · ')}</small>
            <div className='d-flex flex-wrap mt-2' style={{ gap: 6 }}>
              <span className='badge badge-soft-secondary'>{getPaymentStatusLabel(row.payment_status)}</span>
              <span className='badge badge-soft-secondary'>{getBillingStatusLabel(row.billing_status)}</span>
              <span className='badge badge-soft-secondary'>{getOrderStatusLabel(row.order_status)}</span>
            </div>
          </div>
        )}
      />
    </div>
  </div>
}

CreateReactScript((el, properties) => {
  if (!properties.can('orders') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Reporte de ventas'><SalesReport {...properties} /></BaseAdminto>)
})
