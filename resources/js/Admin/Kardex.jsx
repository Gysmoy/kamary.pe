import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import KardexRest from '../Actions/Admin/KardexRest';
import { isMagistralesPath, scopedPermission } from '../Utils/permissionScope';

const kardexRest = new KardexRest()

const Kardex = () => {
  const gridRef = useRef()
  const movementModalRef = useRef()

  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [laboratories, setLaboratories] = useState([])
  const [articles, setArticles] = useState([])
  const [warehouses, setWarehouses] = useState([])

  const [businessId, setBusinessId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [laboratoryId, setLaboratoryId] = useState('')
  const [articleId, setArticleId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [movementRows, setMovementRows] = useState([])
  const [movementTitle, setMovementTitle] = useState('')
  const isMagistrales = isMagistralesPath()

  useEffect(() => {
    const load = async () => {
      const [businessesData, labsData, articlesData, warehousesData] = await Promise.all([
        kardexRest.getBusinesses(),
        kardexRest.getLaboratories(),
        kardexRest.getArticles(),
        isMagistrales ? kardexRest.getWarehouses() : Promise.resolve([]),
      ])
      setBusinesses((businessesData ?? []).filter(item => item.status !== null))
      setLaboratories((labsData ?? []).filter(item => item.status !== null))
      setArticles((articlesData ?? []).filter(item => item.status !== null))
      setWarehouses((warehousesData ?? []).filter(item => item.status !== null))
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
      const data = await kardexRest.getBranchesByBusiness(businessId)
      setBranches((data ?? []).filter(item => item.status !== null))
      setBranchId('')
    }
    loadBranches()
  }, [businessId])

  useEffect(() => {
    kardexRest.setFilters({
      business_id: businessId || '',
      business_branch_id: branchId || '',
      laboratory_id: laboratoryId || '',
      article_id: articleId || '',
      warehouse_id: warehouseId || '',
    })
    if (!gridRef.current) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }, [businessId, branchId, laboratoryId, articleId, warehouseId])

  const openMovements = async (row) => {
    const rows = await kardexRest.getMovements({
      article_id: row.article_id,
      warehouse_id: row.warehouse_id || warehouseId || null,
    })
    setMovementRows(rows)
    setMovementTitle(`${row.article_code ?? ''} ${row.article_name ?? ''}`.trim())
    $(movementModalRef.current).modal('show')
  }

  const magistralesColumns = [
    {
      caption: 'Acciones',
      width: 95,
      allowFiltering: false,
      allowExporting: false,
      cellTemplate: (container, { data }) => {
        container.css('text-overflow', 'unset')
        container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Transacciones', icon: 'mdi mdi-format-list-bulleted', onClick: () => openMovements(data) }))
      }
    },
    { dataField: 'article_code', caption: 'Codigo', minWidth: 110 },
    { dataField: 'article_name', caption: 'Nombre', minWidth: 260 },
    {
      dataField: 'stock',
      caption: 'Stock',
      minWidth: 100,
      cellTemplate: (container, { data }) => container.text(Number(data.stock ?? 0).toFixed(3))
    },
    { dataField: 'unit_label', caption: 'Und', minWidth: 80 },
    {
      dataField: 'stock_min',
      caption: 'Min',
      minWidth: 80,
      cellTemplate: (container, { data }) => container.text(Number(data.stock_min ?? 0).toFixed(3))
    },
    {
      dataField: 'stock_max',
      caption: 'Max',
      minWidth: 80,
      cellTemplate: (container, { data }) => container.text(Number(data.stock_max ?? 0).toFixed(3))
    },
    { dataField: 'currency', caption: 'Moneda', minWidth: 90 },
    {
      dataField: 'cost_unit',
      caption: 'Costo Unitario',
      minWidth: 130,
      cellTemplate: (container, { data }) => container.text(Number(data.cost_unit ?? 0).toFixed(4))
    },
    {
      dataField: 'total_cost',
      caption: 'Total Costo',
      minWidth: 130,
      cellTemplate: (container, { data }) => container.text(Number(data.total_cost ?? 0).toFixed(2))
    },
    { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 150 },
  ]

  const movementColumns = [
    {
      dataField: 'movement_date',
      caption: 'Fecha',
      minWidth: 140,
      dataType: 'datetime'
    },
    { dataField: 'movement_type', caption: 'Tipo', minWidth: 90 },
    { dataField: 'business_name', caption: 'Empresa', minWidth: 180 },
    { dataField: 'branch_name', caption: 'Sede', minWidth: 140 },
    { dataField: 'batch_code', caption: 'Codigo Lote', minWidth: 130 },
    { dataField: 'article_code', caption: 'Codigo', minWidth: 110 },
    { dataField: 'article_name', caption: 'Producto', minWidth: 220 },
    {
      dataField: 'lab_principle',
      caption: 'Laboratorio | Principio activo',
      minWidth: 250,
      calculateCellValue: (rowData) => `${rowData.laboratory_name || '-'} | ${rowData.principle_name || '-'}`
    },
    { dataField: 'unit_label', caption: 'Unidad', minWidth: 90 },
    { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 140 },
    { dataField: 'location', caption: 'Ubicacion', minWidth: 120 },
    { dataField: 'destination_location', caption: 'Ubi. Destino', minWidth: 120 },
    {
      dataField: 'quantity_in',
      caption: 'Entrada',
      minWidth: 100,
      cellTemplate: (container, { data }) => container.text(Number(data.quantity_in ?? 0).toFixed(3))
    },
    {
      dataField: 'quantity_out',
      caption: 'Salida',
      minWidth: 100,
      cellTemplate: (container, { data }) => container.text(Number(data.quantity_out ?? 0).toFixed(3))
    },
    {
      dataField: 'delta',
      caption: 'Movimiento',
      minWidth: 100,
      cellTemplate: (container, { data }) => {
        const qtyIn = Number(data.quantity_in ?? 0)
        const qtyOut = Number(data.quantity_out ?? 0)
        container.text((qtyIn - qtyOut).toFixed(3))
      }
    },
  ]

  return (
    <div className='row'>
      <div className='col-12'>
        <div className='card mb-3'>
          <div className='card-body'>
            <div className='row'>
              {!isMagistrales && <div className='col-md-3'>
                <label className='form-label'>Empresa</label>
                <select className='form-control' value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                  <option value=''>-- Seleccionar empresa --</option>
                  {businesses.map(item => <option key={`kardex-business-${item.id}`} value={item.id}>{item.name}</option>)}
                </select>
              </div>}
              {!isMagistrales && <div className='col-md-3'>
                <label className='form-label'>Sede</label>
                <select className='form-control' value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  <option value=''>-- Seleccionar sede --</option>
                  {branches.map(item => <option key={`kardex-branch-${item.id}`} value={item.id}>{item.name}</option>)}
                </select>
              </div>}
              {!isMagistrales && <div className='col-md-3'>
                <label className='form-label'>Laboratorio</label>
                <select className='form-control' value={laboratoryId} onChange={(e) => setLaboratoryId(e.target.value)}>
                  <option value=''>-- Seleccionar laboratorio --</option>
                  {laboratories.map(item => <option key={`kardex-lab-${item.id}`} value={item.id}>{item.name}</option>)}
                </select>
              </div>}
              {isMagistrales && <div className='col-md-4'>
                <label className='form-label'>Almacen</label>
                <select className='form-control' value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                  <option value=''>-- Todos los almacenes --</option>
                  {warehouses.map(item => <option key={`kardex-wh-${item.id}`} value={item.id}>{item.name}</option>)}
                </select>
              </div>}
              <div className={isMagistrales ? 'col-md-4' : 'col-md-3'}>
                <label className='form-label'>Producto</label>
                <select className='form-control' value={articleId} onChange={(e) => setArticleId(e.target.value)}>
                  <option value=''>-- Seleccionar producto --</option>
                  {articles
                    .filter(item => !laboratoryId || `${item.laboratory_id}` === `${laboratoryId}`)
                    .map(item => <option key={`kardex-article-${item.id}`} value={item.id}>{item.code} - {item.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='col-12'>
        <Table
          gridRef={gridRef}
          title='Kardex'
          rest={kardexRest}
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
          columns={isMagistrales ? magistralesColumns : movementColumns}
        />
      </div>

      {isMagistrales && <Modal modalRef={movementModalRef} title={`Transacciones ${movementTitle}`} size='xl' hideFooter>
        <div className='table-responsive border rounded'>
          <table className='table table-sm table-striped mb-0'>
            <thead>
              <tr>
                <th style={{ minWidth: 170 }}>Transaccion -</th>
                <th style={{ width: 140 }}>Fecha</th>
                <th style={{ width: 140 }}>Documento</th>
                <th style={{ width: 120 }}>Operacion</th>
                <th style={{ width: 110 }}>Lote</th>
                <th style={{ width: 130 }}>F. Vencimiento</th>
                <th style={{ width: 100 }}>Entrada</th>
                <th style={{ width: 100 }}>Salida</th>
                <th style={{ width: 100 }}>Saldo</th>
                <th style={{ width: 90 }}>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {movementRows.length === 0 && <tr><td colSpan='10' className='text-center text-muted py-3'>Sin movimientos</td></tr>}
              {movementRows.map(row => (
                <tr key={row.id}>
                  <td>{row.transaction}</td>
                  <td>{row.movement_date?.toString?.().slice(0, 16)}</td>
                  <td>{row.document}</td>
                  <td>{row.operation}</td>
                  <td>{row.lot}</td>
                  <td>{row.expiration_date?.toString?.().slice(0, 10)}</td>
                  <td>{Number(row.quantity_in ?? 0).toFixed(3)}</td>
                  <td>{Number(row.quantity_out ?? 0).toFixed(3)}</td>
                  <td>{Number(row.balance ?? 0).toFixed(3)}</td>
                  <td>{row.unit_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>}
    </div>
  )
}

CreateReactScript((el, properties) => {
  if (!properties.can(scopedPermission('kardex')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Kardex'}>
    <Kardex {...properties} />
  </BaseAdminto>);
})
