import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import DailySummaryRest from '../Actions/Admin/DailySummaryRest';

const dailySummaryRest = new DailySummaryRest()

const DailySummary = () => {
  const gridRef = useRef()
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
    if (!gridRef.current) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }, [businessId, branchId, dateFrom, dateTo])

  return <div className='row'>
    <div className='col-12'>
      <div className='card mb-3'>
        <div className='card-body'>
          <div className='row'>
            <div className='col-md-3 mb-3'>
              <label className='form-label'>Empresa</label>
              <select className='form-control' value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                <option value=''>Todas</option>
                {businesses.map(row => <option key={`daily-summary-business-${row.id}`} value={row.id}>{row.name}</option>)}
              </select>
            </div>
            <div className='col-md-3 mb-3'>
              <label className='form-label'>Sede</label>
              <select className='form-control' value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value=''>Todas</option>
                {branches.map(row => <option key={`daily-summary-branch-${row.id}`} value={row.id}>{row.name}</option>)}
              </select>
            </div>
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
      <Table
        gridRef={gridRef}
        title='Resumen diario'
        rest={dailySummaryRest}
        exportable
        pageSize={25}
        toolBar={(items) => {
          items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        }}
        columns={[
          { dataField: 'operation_date', caption: 'Fecha', dataType: 'date', width: 110 },
          { dataField: 'business_name', caption: 'Empresa', minWidth: 160 },
          { dataField: 'branch_name', caption: 'Sede', minWidth: 140 },
          { dataField: 'registered_orders_count', caption: 'Pedidos/OS', width: 100, dataType: 'number' },
          { dataField: 'commercial_orders_count', caption: 'Pedidos', width: 90, dataType: 'number' },
          { dataField: 'service_orders_count', caption: 'OS', width: 80, dataType: 'number' },
          { dataField: 'billed_documents_count', caption: 'Facturados', width: 100, dataType: 'number' },
          { dataField: 'registered_total', caption: 'Importe reg.', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'billed_total', caption: 'Importe fact.', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'receivable_payments_total', caption: 'Cobros', width: 100, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'payable_payments_total', caption: 'Pagos', width: 100, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'net_cash', caption: 'Caja neta', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'basic_margin', caption: 'Margen basico', width: 120, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'cancelled_operations_count', caption: 'Anulaciones', width: 100, dataType: 'number' },
        ]}
      />
    </div>
  </div>
}

CreateReactScript((el, properties) => {
  if (!properties.can('daily-summary') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Resumen diario'><DailySummary {...properties} /></BaseAdminto>)
})
