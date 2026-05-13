import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import KardexRest from '../Actions/Admin/KardexRest';
import { isMagistralesPath, isStoragePath, scopedPermission } from '../Utils/permissionScope';
import Swal from 'sweetalert2';

const kardexRest = new KardexRest()

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const formatQty = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
const formatDate = (value) => {
  if (!value) return '-'
  const text = value.toString().slice(0, 10)
  if (!text || text === '0000-00-00') return text || '-'
  const date = new Date(`${text}T00:00:00`)
  if (Number.isNaN(date.getTime())) return text
  return date.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
const formatDateTime = (value) => {
  if (!value) return '0000-00-00 00:00:00'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
const refreshGrid = (gridRef) => {
  if (!gridRef.current) return
  const instance = $(gridRef.current).dxDataGrid('instance')
  instance?.refresh()
}
const statusBadge = (container, status) => {
  const active = status === true || status === 1 || status === '1'
  container.html(`<span class="badge ${active ? 'badge-soft-success' : 'badge-soft-secondary'}">${active ? 'Activo' : 'Inactivo'}</span>`)
}

const StandardKardex = () => {
  const gridRef = useRef()
  const movementModalRef = useRef()
  const warehouseModalRef = useRef()
  const locationModalRef = useRef()

  const [activeTab, setActiveTab] = useState('kardex')
  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [warehouseBranches, setWarehouseBranches] = useState([])
  const [laboratories, setLaboratories] = useState([])
  const [articles, setArticles] = useState([])
  const [warehouses, setWarehouses] = useState([])

  const [businessId, setBusinessId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [laboratoryId, setLaboratoryId] = useState('')
  const [articleId, setArticleId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [stockMode, setStockMode] = useState('all')
  const [movementRows, setMovementRows] = useState([])
  const [movementTitle, setMovementTitle] = useState('')
  const [warehouseForm, setWarehouseForm] = useState({
    id: '',
    business_id: '',
    business_branch_id: '',
    name: '',
    description: '',
    status: '1',
  })
  const [locationForm, setLocationForm] = useState({
    id: '',
    warehouse_id: '',
    code: '',
    status: '1',
  })
  const isMagistrales = isMagistralesPath()

  const loadWarehouses = async () => {
    const data = await kardexRest.getWarehouses()
    const active = (data ?? []).filter(item => item.status !== null)
    setWarehouses(active)
    return active
  }

  useEffect(() => {
    const load = async () => {
      const [businessesData, labsData, articlesData] = await Promise.all([
        kardexRest.getBusinesses(),
        kardexRest.getLaboratories(),
        isMagistrales ? kardexRest.getArticles() : Promise.resolve([]),
      ])
      setBusinesses((businessesData ?? []).filter(item => item.status !== null))
      setLaboratories((labsData ?? []).filter(item => item.status !== null))
      setArticles((articlesData ?? []).filter(item => item.status !== null))
      await loadWarehouses()
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
      business_id: isMagistrales ? '' : (businessId || ''),
      business_branch_id: isMagistrales ? '' : (branchId || ''),
      laboratory_id: isMagistrales ? '' : (laboratoryId || ''),
      article_id: isMagistrales ? (articleId || '') : '',
      warehouse_id: warehouseId || '',
      section: activeTab,
      client_id: '',
      stock_mode: isMagistrales ? 'with_stock' : stockMode,
    })
    setTimeout(() => refreshGrid(gridRef), 0)
  }, [activeTab, businessId, branchId, laboratoryId, articleId, warehouseId, stockMode])

  const loadWarehouseBranches = async (businessId) => {
    if (!businessId) {
      setWarehouseBranches([])
      return []
    }
    const data = await kardexRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setWarehouseBranches(active)
    return active
  }

  const openMovements = async (row) => {
    const rows = await kardexRest.getMovements({
      article_id: row.article_id,
      warehouse_id: row.warehouse_id || warehouseId || null,
    })
    setMovementRows(rows)
    setMovementTitle(`${row.article_code ?? ''} ${row.article_name ?? ''}`.trim())
    $(movementModalRef.current).modal('show')
  }

  const openWarehouseModal = async (row = null) => {
    const business = row?.business_id ? `${row.business_id}` : (businessId || businesses[0]?.id || '')
    const branchOptions = await loadWarehouseBranches(business)
    const branch = row?.branch_id ? `${row.branch_id}` : (branchOptions[0]?.id ? `${branchOptions[0].id}` : '')

    setWarehouseForm({
      id: row?.id ? `${row.id}` : '',
      business_id: business ? `${business}` : '',
      business_branch_id: branch,
      name: row?.warehouse_name ?? '',
      description: row?.description ?? '',
      status: row?.status === false || row?.status === 0 ? '0' : '1',
    })
    $(warehouseModalRef.current).modal('show')
  }

  const openLocationModal = (row = null) => {
    setLocationForm({
      id: row?.location_id ? `${row.location_id}` : '',
      warehouse_id: row?.warehouse_id ? `${row.warehouse_id}` : (warehouseId || ''),
      code: row?.code ?? '',
      status: row?.status === false || row?.status === 0 ? '0' : '1',
    })
    $(locationModalRef.current).modal('show')
  }

  const saveWarehouse = async (event) => {
    event.preventDefault()
    const result = await kardexRest.saveWarehouse({
      id: warehouseForm.id || undefined,
      business_branch_id: warehouseForm.business_branch_id || null,
      name: warehouseForm.name.trim(),
      description: warehouseForm.description.trim(),
      status: warehouseForm.status,
    })
    if (!result) return
    $(warehouseModalRef.current).modal('hide')
    await loadWarehouses()
    refreshGrid(gridRef)
  }

  const saveLocation = async (event) => {
    event.preventDefault()
    const result = await kardexRest.saveLocation({
      id: locationForm.id || undefined,
      warehouse_id: locationForm.warehouse_id || null,
      code: locationForm.code.trim(),
      status: locationForm.status,
    })
    if (!result) return
    $(locationModalRef.current).modal('hide')
    refreshGrid(gridRef)
  }

  const removeWarehouse = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar almacen',
      text: 'Se dara de baja este almacen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const ok = await kardexRest.deleteWarehouse(id)
    if (!ok) return
    await loadWarehouses()
    refreshGrid(gridRef)
  }

  const removeLocation = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar ubicacion',
      text: 'Se dara de baja esta ubicacion.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const ok = await kardexRest.deleteLocation(id)
    if (!ok) return
    refreshGrid(gridRef)
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

  const standardKardexColumns = [
    { dataField: 'code', caption: 'Codigo', minWidth: 110 },
    { dataField: 'ubic', caption: 'Ubic.', minWidth: 95 },
    {
      dataField: 'mt2',
      caption: 'MT2',
      minWidth: 85,
      cellTemplate: (container, { data }) => container.text(Number(data.mt2 ?? 0).toFixed(3))
    },
    { dataField: 'lot', caption: 'Lote', minWidth: 110 },
    { dataField: 'nombre', caption: 'Nombre', minWidth: 260 },
    { dataField: 'unidad', caption: 'Unidad', minWidth: 90 },
    {
      dataField: 'stock',
      caption: 'Stock',
      minWidth: 90,
      cellTemplate: (container, { data }) => container.text(Number(data.stock ?? 0).toFixed(3))
    },
    {
      dataField: 'mt3',
      caption: 'MT3',
      minWidth: 90,
      cellTemplate: (container, { data }) => container.text(Number(data.mt3 ?? 0).toFixed(3))
    },
    {
      dataField: 'valor',
      caption: 'Valor (S/.)',
      minWidth: 115,
      cellTemplate: (container, { data }) => container.text(Number(data.valor ?? 0).toFixed(2))
    },
    {
      dataField: 'total_price',
      caption: 'P.Total (S/.)',
      minWidth: 120,
      cellTemplate: (container, { data }) => container.text(Number(data.total_price ?? 0).toFixed(2))
    },
    { dataField: 'laboratorio', caption: 'Laboratorio', minWidth: 180 },
  ]

  const packColumns = [
    { caption: 'Acciones', width: 95, allowFiltering: false, allowSorting: false, allowExporting: false },
    { dataField: 'lot', caption: 'Lote', minWidth: 120 },
    {
      dataField: 'possible_stock',
      caption: 'Stock posible',
      minWidth: 115,
      cellTemplate: (container, { data }) => container.text(Number(data.possible_stock ?? 0).toFixed(0))
    },
    { dataField: 'laboratory_name', caption: 'Laboratorio', minWidth: 160 },
    { dataField: 'description', caption: 'Descripcion', minWidth: 360 },
    { dataField: 'components_quantity', caption: 'Componentes - Cantidad', minWidth: 260 },
    {
      dataField: 'status',
      caption: 'Estado',
      minWidth: 95,
      cellTemplate: (container, { data }) => statusBadge(container, data.status)
    },
  ]

  const standardWarehouseColumns = [
    {
      caption: 'Acciones',
      width: 115,
      allowFiltering: false,
      allowSorting: false,
      allowExporting: false,
      cellTemplate: (container, { data }) => {
        container.css('text-overflow', 'unset')
        container.append(DxButton({ className: 'btn btn-xs btn-soft-warning', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openWarehouseModal(data) }))
        container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => removeWarehouse(data.id) }))
      }
    },
    {
      dataField: 'status',
      caption: 'Estado',
      minWidth: 95,
      cellTemplate: (container, { data }) => statusBadge(container, data.status)
    },
    { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 180 },
    { dataField: 'branch_name', caption: 'Sede', minWidth: 160 },
    { dataField: 'business_name', caption: 'Empresa', minWidth: 200 },
    { dataField: 'country', caption: 'Pais', minWidth: 90 },
    {
      dataField: 'created_at',
      caption: 'Fecha registro',
      minWidth: 165,
      allowFiltering: false,
      cellTemplate: (container, { data }) => container.text(formatDateTime(data.created_at))
    },
    { dataField: 'creator_label', caption: 'Usuario registro', minWidth: 170 },
  ]

  const standardLocationColumns = [
    {
      caption: 'Acciones',
      width: 115,
      allowFiltering: false,
      allowSorting: false,
      allowExporting: false,
      cellTemplate: (container, { data }) => {
        container.css('text-overflow', 'unset')
        if (data.source !== 'registered') return
        container.append(DxButton({ className: 'btn btn-xs btn-soft-warning', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openLocationModal(data) }))
        container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => removeLocation(data.location_id) }))
      }
    },
    {
      dataField: 'status',
      caption: 'Estado',
      minWidth: 95,
      cellTemplate: (container, { data }) => statusBadge(container, data.status)
    },
    { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 180 },
    { dataField: 'code', caption: 'Ubicacion', minWidth: 120 },
    {
      dataField: 'created_at',
      caption: 'Fecha registro',
      minWidth: 165,
      allowFiltering: false,
      cellTemplate: (container, { data }) => container.text(formatDateTime(data.created_at))
    },
    { dataField: 'creator_label', caption: 'Usuario registro', minWidth: 170 },
  ]

  const standardTabs = [
    { key: 'kardex', label: 'Kardex mensual' },
    { key: 'packs', label: 'Lista de packs' },
    { key: 'warehouses', label: 'Almacenes' },
    { key: 'locations', label: 'Ubicaciones' },
  ]

  const columnsByTab = {
    kardex: standardKardexColumns,
    packs: packColumns,
    warehouses: standardWarehouseColumns,
    locations: standardLocationColumns,
  }

  const titlesByTab = {
    kardex: 'Kardex',
    packs: 'packs',
    warehouses: 'Almacenes',
    locations: 'Ubicaciones',
  }

  if (isMagistrales) {
    return (
      <div className='row'>
        <div className='col-12'>
          <div className='card mb-3'>
            <div className='card-body'>
              <div className='row'>
                <div className='col-md-4'>
                  <label className='form-label'>Almacen</label>
                  <select className='form-control' value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                    <option value=''>-- Todos los almacenes --</option>
                    {warehouses.map(item => <option key={`kardex-wh-${item.id}`} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div className='col-md-4'>
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
                options: { icon: 'refresh', hint: 'Refrescar tabla', onClick: () => refreshGrid(gridRef) }
              })
            }}
            columns={magistralesColumns}
          />
        </div>

        <Modal modalRef={movementModalRef} title={`Transacciones ${movementTitle}`} size='xl' hideFooter>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th style={{ minWidth: 170 }}>Transaccion</th>
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
        </Modal>
      </div>
    )
  }

  return <>
    <div className='row g-3 mb-3'>
      <div className='col-12 col-lg-4'>
        <button type='button' className='btn btn-warning text-white w-100 text-start py-3' onClick={() => openWarehouseModal()}>
          <i className='mdi mdi-plus-circle-outline me-1'></i>
          Registrar Almacen
        </button>
      </div>
      <div className='col-12 col-lg-4'>
        <button type='button' className='btn btn-info text-white w-100 text-start py-3' onClick={() => openLocationModal()}>
          <i className='mdi mdi-plus-circle-outline me-1'></i>
          Registrar Ubicacion
        </button>
      </div>
    </div>

    <div className='card mb-3'>
      <div className='card-body pb-0'>
        <ul className='nav nav-tabs'>
          {standardTabs.map(tab => (
            <li className='nav-item' key={`standard-kardex-tab-${tab.key}`}>
              <button type='button' className={`nav-link ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {activeTab === 'kardex' && <div className='pt-4 pb-3'>
          <div className='row g-3 align-items-end'>
            <div className='col-12 col-lg-4'>
              <label className='form-label'>Empresa</label>
              <select className='form-select' value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                <option value=''>-- Seleccionar empresa --</option>
                {businesses.map(item => <option key={`kardex-business-${item.id}`} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className='col-12 col-lg-4'>
              <label className='form-label'>Sede</label>
              <select className='form-select' value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value=''>-- Seleccionar sede --</option>
                {branches.map(item => <option key={`kardex-branch-${item.id}`} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className='col-12 col-lg-4'>
              <label className='form-label'>Almacen</label>
              <select className='form-select' value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value=''>TODOS</option>
                {warehouses.map(item => <option key={`kardex-filter-wh-${item.id}`} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className='col-12 col-lg-9'>
              <label className='form-label'>Laboratorio</label>
              <select className='form-select' value={laboratoryId} onChange={(e) => setLaboratoryId(e.target.value)}>
                <option value=''>TODOS</option>
                {laboratories.map(item => <option key={`kardex-lab-${item.id}`} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className='col-12 col-lg-3'>
              <label className='form-label'>Stock</label>
              <select className='form-select' value={stockMode} onChange={(e) => setStockMode(e.target.value)}>
                <option value='all'>TODOS</option>
                <option value='with_stock'>CON STOCK</option>
                <option value='without_stock'>SIN STOCK</option>
              </select>
            </div>
            <div className='col-12 d-flex justify-content-center'>
              <button type='button' className='btn btn-outline-primary' onClick={() => refreshGrid(gridRef)}>
                <i className='mdi mdi-magnify me-1'></i>
                BUSCAR ARTICULOS
              </button>
            </div>
          </div>
        </div>}
      </div>
    </div>

    <Table
      key={`standard-kardex-table-${activeTab}`}
      gridRef={gridRef}
      title={titlesByTab[activeTab]}
      rest={kardexRest}
      pageSize={activeTab === 'kardex' ? 20 : 10}
      exportable
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton',
          location: 'after',
          options: { icon: 'refresh', hint: 'Refrescar tabla', onClick: () => refreshGrid(gridRef) }
        })
      }}
      columns={columnsByTab[activeTab]}
    />

    <Modal
      modalRef={warehouseModalRef}
      title={warehouseForm.id ? 'Editar almacen' : 'Registrar almacen'}
      size='md'
      btnSubmitText={warehouseForm.id ? 'Actualizar' : 'Registrar'}
      onSubmit={saveWarehouse}
    >
      <div className='row g-3'>
        <div className='col-12'>
          <label className='form-label'>Empresa</label>
          <select
            className='form-select'
            value={warehouseForm.business_id}
            onChange={async (e) => {
              const selected = e.target.value
              const options = await loadWarehouseBranches(selected)
              setWarehouseForm(prev => ({
                ...prev,
                business_id: selected,
                business_branch_id: options[0]?.id ? `${options[0].id}` : '',
              }))
            }}
          >
            <option value=''>Seleccione empresa</option>
            {businesses.map(item => <option key={`standard-wh-business-${item.id}`} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className='col-12'>
          <label className='form-label'>Sede</label>
          <select className='form-select' value={warehouseForm.business_branch_id} onChange={(e) => setWarehouseForm(prev => ({ ...prev, business_branch_id: e.target.value }))}>
            <option value=''>Seleccione sede</option>
            {warehouseBranches.map(item => <option key={`standard-wh-branch-${item.id}`} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className='col-12'>
          <label className='form-label'>Nombre almacen</label>
          <input className='form-control' value={warehouseForm.name} onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))} />
        </div>
        <div className='col-12'>
          <label className='form-label'>Descripcion</label>
          <textarea className='form-control' rows={3} value={warehouseForm.description} onChange={(e) => setWarehouseForm(prev => ({ ...prev, description: e.target.value }))} />
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={locationModalRef}
      title={locationForm.id ? 'Editar ubicacion' : 'Registrar ubicacion'}
      size='md'
      btnSubmitText={locationForm.id ? 'Actualizar' : 'Registrar'}
      onSubmit={saveLocation}
    >
      <div className='row g-3'>
        <div className='col-12'>
          <label className='form-label'>Almacen</label>
          <select className='form-select' value={locationForm.warehouse_id} onChange={(e) => setLocationForm(prev => ({ ...prev, warehouse_id: e.target.value }))}>
            <option value=''>Seleccione almacen</option>
            {warehouses.map(item => <option key={`standard-location-wh-${item.id}`} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className='col-12'>
          <label className='form-label'>Ubicacion</label>
          <input className='form-control' value={locationForm.code} onChange={(e) => setLocationForm(prev => ({ ...prev, code: e.target.value }))} />
        </div>
        <div className='col-12'>
          <label className='form-label'>Estado</label>
          <select className='form-select' value={locationForm.status} onChange={(e) => setLocationForm(prev => ({ ...prev, status: e.target.value }))}>
            <option value='1'>Activo</option>
            <option value='0'>Inactivo</option>
          </select>
        </div>
      </div>
    </Modal>
  </>
}

const StorageKardex = () => {
  const gridRef = useRef()
  const warehouseModalRef = useRef()
  const locationModalRef = useRef()

  const [activeTab, setActiveTab] = useState('kardex')
  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [clients, setClients] = useState([])
  const [temperatures, setTemperatures] = useState([])
  const [clientId, setClientId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [stockMode, setStockMode] = useState('with_stock')
  const [warehouseForm, setWarehouseForm] = useState({
    id: '',
    business_id: '',
    business_branch_id: '',
    country: 'Perú',
    name: '',
    description: '',
    status: '1',
  })
  const [locationForm, setLocationForm] = useState({
    id: '',
    warehouse_id: '',
    code: '',
    temperature_range: '',
    status: '1',
  })

  const loadOptions = async () => {
    const data = await kardexRest.getStorageOptions()
    setBusinesses(data?.businesses ?? [])
    setBranches(data?.branches ?? [])
    setWarehouses(data?.warehouses ?? [])
    setClients(data?.clients ?? [])
    setTemperatures(data?.temperatures ?? [])
  }

  useEffect(() => {
    loadOptions()
  }, [])

  useEffect(() => {
    kardexRest.setFilters({
      section: activeTab,
      client_id: activeTab === 'kardex' ? clientId : '',
      warehouse_id: activeTab === 'kardex' ? warehouseId : '',
      stock_mode: activeTab === 'kardex' ? stockMode : 'with_stock',
      business_id: '',
      business_branch_id: '',
      laboratory_id: '',
      article_id: '',
    })
    setTimeout(() => refreshGrid(gridRef), 0)
  }, [activeTab, clientId, warehouseId, stockMode])

  const defaultBusinessId = businesses[0]?.id ? `${businesses[0].id}` : ''
  const filteredBranches = useMemo(() => {
    if (!warehouseForm.business_id) return branches
    return branches.filter(branch => `${branch.business_id}` === `${warehouseForm.business_id}`)
  }, [branches, warehouseForm.business_id])

  const openWarehouseModal = (row = null) => {
    const businessId = row?.business_id ? `${row.business_id}` : defaultBusinessId
    const branchId = row?.branch_id ? `${row.branch_id}` : (branches.find(branch => `${branch.business_id}` === `${businessId}`)?.id ?? '')
    setWarehouseForm({
      id: row?.id ? `${row.id}` : '',
      business_id: businessId,
      business_branch_id: branchId ? `${branchId}` : '',
      country: row?.country ?? 'Perú',
      name: row?.warehouse_name ?? '',
      description: row?.description ?? '',
      status: row?.status === false || row?.status === 0 ? '0' : '1',
    })
    $(warehouseModalRef.current).modal('show')
  }

  const openLocationModal = (row = null) => {
    setLocationForm({
      id: row?.id ? `${row.id}` : '',
      warehouse_id: row?.warehouse_id ? `${row.warehouse_id}` : '',
      code: row?.code ?? '',
      temperature_range: row?.temperature_range ?? '',
      status: row?.status === false || row?.status === 0 ? '0' : '1',
    })
    $(locationModalRef.current).modal('show')
  }

  const saveWarehouse = async (event) => {
    event.preventDefault()
    const result = await kardexRest.saveStorageWarehouse(warehouseForm)
    if (!result) return
    $(warehouseModalRef.current).modal('hide')
    await loadOptions()
    if (activeTab === 'warehouses') refreshGrid(gridRef)
  }

  const saveLocation = async (event) => {
    event.preventDefault()
    const result = await kardexRest.saveStorageLocation(locationForm)
    if (!result) return
    $(locationModalRef.current).modal('hide')
    await loadOptions()
    if (activeTab === 'locations') refreshGrid(gridRef)
  }

  const removeWarehouse = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar almacen',
      text: 'Se dara de baja este almacen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const ok = await kardexRest.deleteStorageWarehouse(id)
    if (!ok) return
    await loadOptions()
    refreshGrid(gridRef)
  }

  const removeLocation = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar ubicacion',
      text: 'Se dara de baja esta ubicacion.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const ok = await kardexRest.deleteStorageLocation(id)
    if (!ok) return
    refreshGrid(gridRef)
  }

  const downloadLocationsReport = () => {
    window.open('/api/admin/storage/kardex/locations-report', '_blank', 'noopener,noreferrer')
  }

  const downloadInventoryReport = () => {
    const params = new URLSearchParams()
    if (clientId) params.set('client_id', clientId)
    if (warehouseId) params.set('warehouse_id', warehouseId)
    if (stockMode) params.set('stock_mode', stockMode)
    window.open(`/api/admin/storage/kardex/inventory-report?${params.toString()}`, '_blank', 'noopener,noreferrer')
  }

  const statusBadge = (container, status) => {
    const active = status === true || status === 1 || status === '1'
    container.html(`<span class="badge ${active ? 'badge-soft-success' : 'badge-soft-secondary'}">${active ? 'Activo' : 'Inactivo'}</span>`)
  }

  const kardexColumns = [
    {
      caption: 'Acciones',
      width: 95,
      allowFiltering: false,
      allowSorting: false,
      allowExporting: false,
      cellTemplate: (container) => {
        container.css('text-overflow', 'unset')
        container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Stock', icon: 'mdi mdi-format-list-bulleted', onClick: () => { } }))
      }
    },
    { dataField: 'inventory', caption: 'Inventario', minWidth: 240 },
    { dataField: 'lot', caption: 'Lote', minWidth: 110 },
    {
      dataField: 'expiration_date',
      caption: 'F.V.',
      minWidth: 110,
      cellTemplate: (container, { data }) => container.text(formatDate(data.expiration_date))
    },
    { dataField: 'unit_label', caption: 'U. Medida', minWidth: 100 },
    {
      dataField: 'system_stock',
      caption: 'Stock sistema',
      minWidth: 130,
      cellTemplate: (container, { data }) => container.text(formatQty(data.system_stock))
    },
    { dataField: 'location', caption: 'Ubicacion', minWidth: 120 },
    { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 160 },
  ]

  const warehouseColumns = [
    {
      caption: 'Acciones',
      width: 115,
      allowFiltering: false,
      allowSorting: false,
      allowExporting: false,
      cellTemplate: (container, { data }) => {
        container.css('text-overflow', 'unset')
        container.append(DxButton({ className: 'btn btn-xs btn-soft-warning', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openWarehouseModal(data) }))
        container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => removeWarehouse(data.id) }))
      }
    },
    {
      dataField: 'status',
      caption: 'Estado',
      minWidth: 95,
      cellTemplate: (container, { data }) => statusBadge(container, data.status)
    },
    { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 180 },
    { dataField: 'branch_name', caption: 'Sede', minWidth: 160 },
    { dataField: 'business_name', caption: 'Empresa', minWidth: 200 },
    { dataField: 'country', caption: 'Pais', minWidth: 90 },
    {
      dataField: 'created_at',
      caption: 'Fecha registro',
      minWidth: 165,
      allowFiltering: false,
      cellTemplate: (container, { data }) => container.text(formatDateTime(data.created_at))
    },
    { dataField: 'creator_label', caption: 'Usuario registro', minWidth: 170 },
  ]

  const locationColumns = [
    {
      caption: 'Acciones',
      width: 115,
      allowFiltering: false,
      allowSorting: false,
      allowExporting: false,
      cellTemplate: (container, { data }) => {
        container.css('text-overflow', 'unset')
        container.append(DxButton({ className: 'btn btn-xs btn-soft-warning', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openLocationModal(data) }))
        container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => removeLocation(data.id) }))
      }
    },
    {
      dataField: 'status',
      caption: 'Estado',
      minWidth: 95,
      cellTemplate: (container, { data }) => statusBadge(container, data.status)
    },
    { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 160 },
    { dataField: 'code', caption: 'Ubicacion', minWidth: 120 },
    { dataField: 'temperature_range', caption: 'Temperatura', minWidth: 130 },
    {
      dataField: 'created_at',
      caption: 'Fecha registro',
      minWidth: 165,
      allowFiltering: false,
      cellTemplate: (container, { data }) => container.text(formatDateTime(data.created_at))
    },
    { dataField: 'creator_label', caption: 'Usuario registro', minWidth: 170 },
  ]

  const columnsByTab = {
    kardex: kardexColumns,
    warehouses: warehouseColumns,
    locations: locationColumns,
  }

  const titlesByTab = {
    kardex: 'Kárdex',
    warehouses: 'Almacenes',
    locations: 'Ubicaciones',
  }

  return <>
    <div className='row g-3 mb-3'>
      <div className='col-12 col-lg-4'>
        <button type='button' className='btn btn-success w-100 d-flex align-items-center justify-content-between py-3' onClick={downloadLocationsReport}>
          <span><i className='mdi mdi-plus-circle-outline me-1'></i> Descargar reporte de Ubicaciones</span>
          <i className='mdi mdi-file-excel-outline fs-4'></i>
        </button>
      </div>
      <div className='col-12 col-lg-4'>
        <button type='button' className='btn btn-warning text-white w-100 text-start py-3' onClick={() => openWarehouseModal()}>
          <i className='mdi mdi-plus-circle-outline me-1'></i>
          Registrar Almacén
        </button>
      </div>
      <div className='col-12 col-lg-4'>
        <button type='button' className='btn btn-info text-white w-100 text-start py-3' onClick={() => openLocationModal()}>
          <i className='mdi mdi-plus-circle-outline me-1'></i>
          Registrar Ubicación
        </button>
      </div>
    </div>

    <div className='card mb-3'>
      <div className='card-body pb-0'>
        <ul className='nav nav-tabs'>
          {[
            { key: 'kardex', label: 'Kárdex' },
            { key: 'warehouses', label: 'Almacenes' },
            { key: 'locations', label: 'Ubicaciones' },
          ].map(tab => (
            <li className='nav-item' key={`storage-kardex-tab-${tab.key}`}>
              <button type='button' className={`nav-link ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {activeTab === 'kardex' && <div className='pt-4 pb-3'>
          <div className='row g-3 align-items-end'>
            <div className='col-12 col-lg-5'>
              <label className='form-label'>Cliente</label>
              <select className='form-select' value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value=''>Seleccione Cliente</option>
                {clients.map(client => <option key={`storage-kardex-client-${client.id}`} value={client.id}>{client.full_name}</option>)}
              </select>
            </div>
            <div className='col-12 col-md-6 col-lg-4'>
              <label className='form-label'>Almacen</label>
              <select className='form-select' value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value=''>Todos</option>
                {warehouses.map(warehouse => <option key={`storage-kardex-wh-${warehouse.id}`} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </div>
            <div className='col-12 col-md-6 col-lg-3'>
              <label className='form-label'>Stock</label>
              <select className='form-select' value={stockMode} onChange={(e) => setStockMode(e.target.value)}>
                <option value='with_stock'>Con stock</option>
                <option value='without_stock'>Sin stock</option>
                <option value='all'>Todos</option>
              </select>
            </div>
            <div className='col-12 d-flex justify-content-center gap-2'>
              <button type='button' className='btn btn-outline-primary' onClick={() => refreshGrid(gridRef)}>
                <i className='mdi mdi-magnify me-1'></i>
                Buscar artículos
              </button>
              <button type='button' className='btn btn-outline-danger' onClick={downloadInventoryReport}>
                <i className='mdi mdi-file-pdf-box me-1'></i>
                Reporte para Inventario
              </button>
            </div>
          </div>
        </div>}
      </div>
    </div>

    <Table
      key={`storage-kardex-table-${activeTab}`}
      gridRef={gridRef}
      title={titlesByTab[activeTab]}
      rest={kardexRest}
      pageSize={10}
      exportable
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton',
          location: 'after',
          options: { icon: 'refresh', hint: 'Refrescar tabla', onClick: () => refreshGrid(gridRef) }
        })
      }}
      columns={columnsByTab[activeTab]}
    />

    <Modal
      modalRef={warehouseModalRef}
      title='Formulario almacén'
      size='xl'
      btnSubmitText={warehouseForm.id ? 'Actualizar' : 'Registrar'}
      onSubmit={saveWarehouse}
      bodyStyle={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', overflowX: 'hidden' }}
    >
      <div className='row g-3'>
        <div className='col-12 col-lg-4'>
          <label className='form-label'>Empresa</label>
          <select className='form-select' value={warehouseForm.business_id} onChange={(e) => setWarehouseForm(prev => ({ ...prev, business_id: e.target.value, business_branch_id: '' }))}>
            <option value=''>Seleccione empresa</option>
            {businesses.map(business => <option key={`storage-wh-business-${business.id}`} value={business.id}>{business.name}</option>)}
          </select>
        </div>
        <div className='col-12 col-lg-4'>
          <label className='form-label'>Sede</label>
          <select className='form-select' value={warehouseForm.business_branch_id} onChange={(e) => setWarehouseForm(prev => ({ ...prev, business_branch_id: e.target.value }))}>
            <option value=''>Seleccione sede</option>
            {filteredBranches.map(branch => <option key={`storage-wh-branch-${branch.id}`} value={branch.id}>{branch.name}</option>)}
          </select>
        </div>
        <div className='col-12 col-lg-4'>
          <label className='form-label'>Pais</label>
          <select className='form-select' value={warehouseForm.country} onChange={(e) => setWarehouseForm(prev => ({ ...prev, country: e.target.value }))}>
            <option value='Perú'>Perú</option>
          </select>
        </div>
        <div className='col-12 col-lg-8'>
          <label className='form-label'>Nombre almacén</label>
          <input className='form-control' value={warehouseForm.name} onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))} />
        </div>
        <div className='col-12 col-lg-4'>
          <label className='form-label'>Estado</label>
          <select className='form-select' value={warehouseForm.status} onChange={(e) => setWarehouseForm(prev => ({ ...prev, status: e.target.value }))}>
            <option value='1'>Activo</option>
            <option value='0'>Inactivo</option>
          </select>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={locationModalRef}
      title='Formulario ubicación'
      size='lg'
      btnSubmitText={locationForm.id ? 'Actualizar' : 'Registrar'}
      onSubmit={saveLocation}
      bodyStyle={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', overflowX: 'hidden' }}
    >
      <div className='row g-3'>
        <div className='col-12 col-md-6'>
          <label className='form-label'>Almacén</label>
          <select className='form-select' value={locationForm.warehouse_id} onChange={(e) => setLocationForm(prev => ({ ...prev, warehouse_id: e.target.value }))}>
            <option value=''>Seleccione almacén</option>
            {warehouses.map(warehouse => <option key={`storage-location-wh-${warehouse.id}`} value={warehouse.id}>{warehouse.name}</option>)}
          </select>
        </div>
        <div className='col-12 col-md-6'>
          <label className='form-label'>Temperatura</label>
          <select className='form-select' value={locationForm.temperature_range} onChange={(e) => setLocationForm(prev => ({ ...prev, temperature_range: e.target.value }))}>
            <option value=''>Seleccione</option>
            {temperatures.map(temp => <option key={`storage-location-temp-${temp}`} value={temp}>{temp}</option>)}
          </select>
        </div>
        <div className='col-12 col-md-6'>
          <label className='form-label'>Codificación</label>
          <input className='form-control' value={locationForm.code} onChange={(e) => setLocationForm(prev => ({ ...prev, code: e.target.value }))} />
        </div>
        <div className='col-12 col-md-6'>
          <label className='form-label'>Estado</label>
          <select className='form-select' value={locationForm.status} onChange={(e) => setLocationForm(prev => ({ ...prev, status: e.target.value }))}>
            <option value='1'>Activo</option>
            <option value='0'>Inactivo</option>
          </select>
        </div>
      </div>
    </Modal>
  </>
}

const Kardex = (props) => (props.storageContext || isStoragePath())
  ? <StorageKardex {...props} />
  : <StandardKardex {...props} />

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? scopedPermission('kardex')
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Kardex'}>
    <Kardex {...properties} />
  </BaseAdminto>);
})
