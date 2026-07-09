import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Swal from 'sweetalert2';
import DailySummaryRest from '../Actions/Admin/DailySummaryRest';

const dailySummaryRest = new DailySummaryRest()

const numberFormat = (value) => Number(value ?? 0).toFixed(2)

const exportColumns = [
  ['Fecha', (row) => row.operation_date ?? ''],
  ['Empresa', (row) => row.business_name ?? ''],
  ['Sede', (row) => row.branch_name ?? ''],
  ['Pedidos/OS', (row) => row.registered_orders_count ?? 0],
  ['Pedidos', (row) => row.commercial_orders_count ?? 0],
  ['OS', (row) => row.service_orders_count ?? 0],
  ['Facturados', (row) => row.billed_documents_count ?? 0],
  ['Importe reg.', (row) => numberFormat(row.registered_total)],
  ['Importe fact.', (row) => numberFormat(row.billed_total)],
  ['Cobros', (row) => numberFormat(row.receivable_payments_total)],
  ['Pagos', (row) => numberFormat(row.payable_payments_total)],
  ['Caja neta', (row) => numberFormat(row.net_cash)],
  ['Margen basico', (row) => numberFormat(row.basic_margin)],
  ['Anulaciones', (row) => row.cancelled_operations_count ?? 0],
]

const DailySummary = () => {
  const tableRef = useRef()
  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [businessId, setBusinessId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const load = async () => setBusinesses((await dailySummaryRest.getBusinesses())?.filter(row => row.status !== null) ?? [])
    load()
  }, [])

  useEffect(() => {
    const loadBranches = async () => {
      if (!businessId) {
        setBranches([])
        setBranchId('')
        return
      }
      setBranches((await dailySummaryRest.getBranchesByBusiness(businessId))?.filter(row => row.status !== null) ?? [])
      setBranchId('')
    }
    loadBranches()
  }, [businessId])

  useEffect(() => {
    dailySummaryRest.setFilters({
      business_id: businessId || '',
      business_branch_id: branchId || '',
      date_from: dateFrom || '',
      date_to: dateTo || '',
    })
    tableRef.current?.refresh()
  }, [businessId, branchId, dateFrom, dateTo])

  const onExport = async () => {
    const rows = await tableRef.current?.loadAll()
    if (!rows?.length) {
      Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay registros para exportar.', confirmButtonText: 'Entendido' })
      return
    }
    if (!window.ExcelJS || !window.saveAs) {
      Swal.fire({ icon: 'error', title: 'Exportación no disponible', text: 'No se pudo cargar el motor de exportación.', confirmButtonText: 'Entendido' })
      return
    }
    const workbook = new window.ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Resumen diario')
    worksheet.addRow(exportColumns.map(([label]) => label))
    rows.forEach(row => worksheet.addRow(exportColumns.map(([, value]) => value(row))))
    worksheet.columns.forEach(column => { column.width = 16 })
    const buffer = await workbook.xlsx.writeBuffer()
    window.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'resumen-diario.xlsx')
  }

  return <div className='row'>
    <div className='col-12'>
      <div className='card mb-3'>
        <div className='card-body'>
          <div className='row'>
            <VdSelect
              label='Empresa'
              col='col-md-3'
              noMargin
              value={businessId}
              onChange={setBusinessId}
              options={[{ value: '', label: 'Todas' }, ...businesses.map(row => ({ value: `${row.id}`, label: row.name }))]}
            />
            <VdSelect
              label='Sede'
              col='col-md-3'
              noMargin
              value={branchId}
              onChange={setBranchId}
              options={[{ value: '', label: 'Todas' }, ...branches.map(row => ({ value: `${row.id}`, label: row.name }))]}
            />
            <div className='col-md-3 mb-3'>
              <label className='form-label'>Desde</label>
              <input type='date' className='form-control' value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className='col-md-3 mb-3'>
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
        rest={dailySummaryRest}
        icon='mdi mdi-chart-bar'
        title='Resumen diario'
        unit='registros'
        defaultSort={{ field: 'operation_date', desc: true }}
        defaultPageSize={25}
        searchFields={['business_name', 'branch_name']}
        searchPlaceholder='Buscar por empresa o sede…'
        emptyText='No se encontraron registros para el periodo seleccionado.'
        headerActions={<>
          <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
            <i className='mdi mdi-refresh'></i>
          </button>
          <button type='button' className='vdt-btn-soft' onClick={onExport}>
            <i className='mdi mdi-file-excel'></i> Exportar
          </button>
        </>}
        columns={[
          { key: 'fecha', label: 'Fecha', field: 'operation_date', width: '110px', filter: { type: 'date' } },
          { key: 'empresa', label: 'Empresa', field: 'business_name', filter: { type: 'text' } },
          { key: 'sede', label: 'Sede', field: 'branch_name', filter: { type: 'text' } },
          { key: 'pedidos_os', label: 'Pedidos/OS', field: 'registered_orders_count', width: '100px', align: 'right', filter: { type: 'number' } },
          { key: 'pedidos', label: 'Pedidos', field: 'commercial_orders_count', width: '90px', align: 'right', filter: { type: 'number' } },
          { key: 'os', label: 'OS', field: 'service_orders_count', width: '80px', align: 'right', filter: { type: 'number' } },
          { key: 'facturados', label: 'Facturados', field: 'billed_documents_count', width: '100px', align: 'right', filter: { type: 'number' } },
          { key: 'importe_reg', label: 'Importe reg.', field: 'registered_total', width: '110px', align: 'right', filter: { type: 'number' }, render: (row) => numberFormat(row.registered_total) },
          { key: 'importe_fact', label: 'Importe fact.', field: 'billed_total', width: '110px', align: 'right', filter: { type: 'number' }, render: (row) => numberFormat(row.billed_total) },
          { key: 'cobros', label: 'Cobros', field: 'receivable_payments_total', width: '100px', align: 'right', filter: { type: 'number' }, render: (row) => numberFormat(row.receivable_payments_total) },
          { key: 'pagos', label: 'Pagos', field: 'payable_payments_total', width: '100px', align: 'right', filter: { type: 'number' }, render: (row) => numberFormat(row.payable_payments_total) },
          { key: 'caja_neta', label: 'Caja neta', field: 'net_cash', width: '110px', align: 'right', filter: { type: 'number' }, render: (row) => numberFormat(row.net_cash) },
          { key: 'margen_basico', label: 'Margen basico', field: 'basic_margin', width: '120px', align: 'right', filter: { type: 'number' }, render: (row) => numberFormat(row.basic_margin) },
          { key: 'anulaciones', label: 'Anulaciones', field: 'cancelled_operations_count', width: '100px', align: 'right', filter: { type: 'number' } },
        ]}
        renderCard={(row) => (
          <div className='vdt-card'>
            <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.operation_date}</p>
                <small className='text-muted'>{[row.business_name, row.branch_name].filter(Boolean).join(' · ')}</small>
              </div>
              <span className='badge badge-soft-primary'>{row.registered_orders_count ?? 0} ped/OS</span>
            </div>
            <div className='row mt-2' style={{ fontSize: 12 }}>
              <div className='col-6'><span className='text-muted'>Importe reg.</span><div className='fw-semibold'>{numberFormat(row.registered_total)}</div></div>
              <div className='col-6'><span className='text-muted'>Importe fact.</span><div className='fw-semibold'>{numberFormat(row.billed_total)}</div></div>
              <div className='col-6 mt-2'><span className='text-muted'>Caja neta</span><div className='fw-semibold'>{numberFormat(row.net_cash)}</div></div>
              <div className='col-6 mt-2'><span className='text-muted'>Margen basico</span><div className='fw-semibold'>{numberFormat(row.basic_margin)}</div></div>
            </div>
          </div>
        )}
      />
    </div>
  </div>
}

CreateReactScript((el, properties) => {
  if (!properties.can('daily-summary') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Resumen diario'><DailySummary {...properties} /></BaseAdminto>)
})
