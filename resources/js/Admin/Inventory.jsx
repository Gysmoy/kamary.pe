import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import InventoryRest from '../Actions/Admin/InventoryRest';

const inventoryRest = new InventoryRest()

const Inventory = () => {
  const gridRef = useRef()
  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [businessId, setBusinessId] = useState('')
  const [branchId, setBranchId] = useState('')

  useEffect(() => {
    const load = async () => {
      const data = await inventoryRest.getBusinesses()
      setBusinesses((data ?? []).filter(item => item.status !== null))
    }
    load()
  }, [])

  useEffect(() => {
    const loadBranches = async () => {
      if (!businessId) {
        setBranches([])
        setBranchId('')
        return
      }
      const data = await inventoryRest.getBranchesByBusiness(businessId)
      setBranches((data ?? []).filter(item => item.status !== null))
      setBranchId('')
    }
    loadBranches()
  }, [businessId])

  useEffect(() => {
    inventoryRest.setFilters({
      business_id: businessId || '',
      business_branch_id: branchId || '',
    })
    if (!gridRef.current) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }, [businessId, branchId])

  return (
    <div className='row'>
      <div className='col-12'>
        <div className='card mb-3'>
          <div className='card-body'>
            <div className='row'>
              <div className='col-md-6'>
                <label className='form-label'>Empresa</label>
                <select className='form-control' value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                  <option value=''>-- Seleccionar empresa --</option>
                  {businesses.map(item => <option key={`inventory-business-${item.id}`} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className='col-md-6'>
                <label className='form-label'>Sede</label>
                <select className='form-control' value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  <option value=''>-- Seleccionar sede --</option>
                  {branches.map(item => <option key={`inventory-branch-${item.id}`} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='col-12'>
        <Table
          gridRef={gridRef}
          title='Inventario'
          rest={inventoryRest}
          pageSize={25}
          toolBar={(container) => {
            container.unshift({
              widget: 'dxButton',
              location: 'after',
              options: {
                icon: 'refresh',
                hint: 'Refrescar tabla',
                onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
              }
            })
          }}
          columns={[
            { dataField: 'code', caption: 'Codigo', minWidth: 120 },
            { dataField: 'name', caption: 'Articulo', minWidth: 250 },
            { dataField: 'laboratory.name', caption: 'Laboratorio', minWidth: 170 },
            { dataField: 'active_principle.name', caption: 'Principio Activo', minWidth: 180 },
            { dataField: 'unit.symbol', caption: 'Unidad', width: 90 },
            {
              dataField: 'qty_in',
              caption: 'Entradas',
              dataType: 'number',
              minWidth: 100,
              cellTemplate: (container, { data }) => {
                container.text(Number(data.qty_in ?? 0).toFixed(3))
              }
            },
            {
              dataField: 'qty_out',
              caption: 'Salidas',
              dataType: 'number',
              minWidth: 100,
              cellTemplate: (container, { data }) => {
                container.text(Number(data.qty_out ?? 0).toFixed(3))
              }
            },
            {
              dataField: 'stock',
              caption: 'Stock',
              dataType: 'number',
              minWidth: 100,
              cellTemplate: (container, { data }) => {
                const stock = Number(data.qty_in ?? 0) - Number(data.qty_out ?? 0)
                container.text(stock.toFixed(3))
              }
            },
          ]}
        />
      </div>
    </div>
  )
}

CreateReactScript((el, properties) => {
  if (!properties.can('inventory') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Inventario'>
    <Inventory {...properties} />
  </BaseAdminto>);
})
