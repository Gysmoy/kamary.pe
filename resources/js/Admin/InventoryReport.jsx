import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import InventoryReportRest from '../Actions/Admin/InventoryReportRest';

const inventoryReportRest = new InventoryReportRest()

const InventoryReport = () => {
  const gridRef = useRef()
  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [laboratories, setLaboratories] = useState([])
  const [businessId, setBusinessId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [laboratoryId, setLaboratoryId] = useState('')

  useEffect(() => {
    Promise.all([inventoryReportRest.getBusinesses(), inventoryReportRest.getLaboratories()]).then(([businessList, laboratoryList]) => {
      setBusinesses((businessList ?? []).filter(row => row.status !== null))
      setLaboratories((laboratoryList ?? []).filter(row => row.status !== null))
    })
  }, [])

  useEffect(() => {
    const loadBranches = async () => {
      if (!businessId) {
        setBranches([])
        setBranchId('')
        return
      }
      setBranches((await inventoryReportRest.getBranchesByBusiness(businessId))?.filter(row => row.status !== null) ?? [])
      setBranchId('')
    }
    loadBranches()
  }, [businessId])

  useEffect(() => {
    inventoryReportRest.setFilters({
      business_id: businessId || '',
      business_branch_id: branchId || '',
      laboratory_id: laboratoryId || '',
    })
    if (!gridRef.current) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }, [businessId, branchId, laboratoryId])

  return <div className='row'>
    <div className='col-12'>
      <div className='card mb-3'>
        <div className='card-body'>
          <div className='row'>
            <div className='col-md-4 mb-3'>
              <label className='form-label'>Empresa</label>
              <select className='form-control' value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                <option value=''>Todas</option>
                {businesses.map(row => <option key={`inventory-report-business-${row.id}`} value={row.id}>{row.name}</option>)}
              </select>
            </div>
            <div className='col-md-4 mb-3'>
              <label className='form-label'>Sede</label>
              <select className='form-control' value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value=''>Todas</option>
                {branches.map(row => <option key={`inventory-report-branch-${row.id}`} value={row.id}>{row.name}</option>)}
              </select>
            </div>
            <div className='col-md-4 mb-3'>
              <label className='form-label'>Laboratorio</label>
              <select className='form-control' value={laboratoryId} onChange={(e) => setLaboratoryId(e.target.value)}>
                <option value=''>Todos</option>
                {laboratories.map(row => <option key={`inventory-report-laboratory-${row.id}`} value={row.id}>{row.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className='col-12'>
      <Table
        gridRef={gridRef}
        title='Reporte de inventario'
        rest={inventoryReportRest}
        exportable
        pageSize={25}
        toolBar={(items) => {
          items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        }}
        columns={[
          { dataField: 'business_name', caption: 'Empresa', minWidth: 150 },
          { dataField: 'branch_name', caption: 'Sede', minWidth: 140 },
          { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 140 },
          { dataField: 'article_code', caption: 'Codigo', minWidth: 120 },
          { dataField: 'article_name', caption: 'Descripcion', minWidth: 220 },
          { dataField: 'laboratory_name', caption: 'Laboratorio', minWidth: 160 },
          { dataField: 'unit_label', caption: 'Unidad', width: 90 },
          { dataField: 'batch_code', caption: 'Lote', minWidth: 120 },
          { dataField: 'location', caption: 'Ubicacion', minWidth: 120 },
          { dataField: 'qty_in', caption: 'Entradas', width: 100, dataType: 'number', format: { type: 'fixedPoint', precision: 3 } },
          { dataField: 'qty_out', caption: 'Salidas', width: 100, dataType: 'number', format: { type: 'fixedPoint', precision: 3 } },
          { dataField: 'stock', caption: 'Stock actual', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 3 } },
          { dataField: 'reference_cost_unit', caption: 'Costo ref.', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'stock_state', caption: 'Estado', width: 100 },
        ]}
      />
    </div>
  </div>
}

CreateReactScript((el, properties) => {
  if (!properties.can('inventory') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Reporte de inventario'><InventoryReport {...properties} /></BaseAdminto>)
})
