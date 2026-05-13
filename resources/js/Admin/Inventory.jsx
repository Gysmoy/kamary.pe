import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import InventoryRest from '../Actions/Admin/InventoryRest';
import { scopedPermission } from '../Utils/permissionScope';
import Swal from 'sweetalert2';

const inventoryRest = new InventoryRest()

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
const formatDate = (value) => {
  if (!value) return '-'
  const text = value.toString().slice(0, 10)
  const date = new Date(`${text}T00:00:00`)
  if (Number.isNaN(date.getTime())) return text
  return date.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
const formatQty = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 3 })

const mapStoredItem = (item) => ({
  id: item.id,
  lot: item.lot ?? '',
  expiration_date: item.expiration_date?.toString?.().slice?.(0, 10) ?? '',
  article_name: item.article_name ?? item.article?.name ?? '',
  client_name: item.client_name ?? '',
  unit_label: item.unit_label ?? '',
  location: item.location ?? '',
  temperature_range: item.temperature_range ?? '',
  system_stock: Number(item.system_stock ?? 0),
  real_stock: Number(item.real_stock ?? 0),
})

const StandardInventory = ({ moduleTitle = 'Inventario' }) => {
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
          title={moduleTitle}
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

const StorageInventory = ({ moduleTitle = 'Serv. Almacenamiento - Inventario' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const fileRef = useRef()
  const [warehouses, setWarehouses] = useState([])
  const [clients, setClients] = useState([])
  const [locations, setLocations] = useState([])
  const [warehouseId, setWarehouseId] = useState('')
  const [location, setLocation] = useState('')
  const [clientId, setClientId] = useState('')
  const [rows, setRows] = useState([])
  const [selectedCount, setSelectedCount] = useState(null)
  const [loadingRows, setLoadingRows] = useState(false)
  const [tablePageSize, setTablePageSize] = useState(10)
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)

  useEffect(() => {
    inventoryRest.getStorageOptions().then(data => {
      setWarehouses(data?.warehouses ?? [])
      setClients(data?.clients ?? [])
      setLocations((data?.locations ?? []).map(item => typeof item === 'string'
        ? { location: item, warehouse_id: null, temperature_range: null }
        : item
      ))
    })
  }, [])

  const selectedCountCode = selectedCount?.code ?? ''
  const selectedClientName = selectedCount?.client?.full_name || clients.find(client => `${client.id}` === `${clientId}`)?.full_name || ''
  const filteredRows = useMemo(() => {
    const term = tableSearch.trim().toLowerCase()
    if (!term) return rows

    return rows.filter(row => [
      row.id,
      row.lot,
      row.expiration_date,
      row.article_name,
      row.client_name,
      row.unit_label,
      row.location,
      row.temperature_range,
      row.system_stock,
      row.real_stock,
    ].some(value => `${value ?? ''}`.toLowerCase().includes(term)))
  }, [rows, tableSearch])
  const tablePageCount = Math.max(1, Math.ceil(filteredRows.length / tablePageSize))
  const currentTablePage = Math.min(tablePage, tablePageCount)
  const paginatedRows = filteredRows.slice((currentTablePage - 1) * tablePageSize, currentTablePage * tablePageSize)
  const filteredLocations = useMemo(() => locations.filter(item => {
    if (!warehouseId) return false
    return `${item.warehouse_id}` === `${warehouseId}`
  }), [locations, warehouseId])

  const changeWarehouse = (value) => {
    setWarehouseId(value)
    setLocation('')
  }

  useEffect(() => {
    setTablePage(1)
  }, [rows, tablePageSize, tableSearch])

  const resetModal = () => {
    setSelectedCount(null)
    setWarehouseId('')
    setLocation('')
    setClientId('')
    setRows([])
    setTableSearch('')
    setTablePage(1)
  }

  const openNewModal = () => {
    resetModal()
    $(modalRef.current).modal('show')
  }

  const openExistingModal = async (data) => {
    const result = await inventoryRest.getStorageInventory(data.id)
    if (!result) return
    setSelectedCount(result)
    setWarehouseId(result.warehouse_id ? `${result.warehouse_id}` : '')
    setLocation(result.location ?? '')
    setClientId(result.client_id ? `${result.client_id}` : '')
    setRows((result.items ?? []).map(mapStoredItem))
    $(modalRef.current).modal('show')
  }

  const refreshPreview = async () => {
    setLoadingRows(true)
    const data = await inventoryRest.previewStorageInventory({
      warehouse_id: warehouseId || null,
      location: location || null,
      client_id: clientId || null,
    })
    setRows(data ?? [])
    setLoadingRows(false)
  }

  const registerInventory = async () => {
    const result = await inventoryRest.saveStorageInventory({
      warehouse_id: warehouseId || null,
      location: location || null,
      client_id: clientId || null,
    })
    if (!result) return
    setSelectedCount(result)
    setRows((result.items ?? []).map(mapStoredItem))
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const downloadFormat = () => {
    if (!selectedCount?.id) return
    window.open(`/api/admin/storage/inventory/${selectedCount.id}/format`, '_blank', 'noopener,noreferrer')
  }

  const uploadFormat = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !selectedCount?.id) return
    const formData = new FormData()
    formData.append('format_file', file)
    const result = await inventoryRest.importStorageFormat(selectedCount.id, formData)
    if (!result) return
    setSelectedCount(result)
    setRows((result.items ?? []).map(mapStoredItem))
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar inventario',
      text: 'Se dara de baja este inventario registrado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await inventoryRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <div className='card mb-3'>
      <div className='card-body'>
        <button type='button' className='btn btn-primary d-inline-flex align-items-center gap-2' onClick={openNewModal}>
          <i className='mdi mdi-plus-circle-outline'></i>
          Registrar inventario
        </button>
      </div>
    </div>

    <Table
      gridRef={gridRef}
      title='Inventarios registrados'
      rest={inventoryRest}
      pageSize={10}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton',
          location: 'after',
          options: { icon: 'refresh', hint: 'Refrescar tabla', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() }
        })
        container.unshift({
          widget: 'dxButton',
          location: 'after',
          options: { icon: 'add', hint: 'Registrar inventario', onClick: openNewModal }
        })
      }}
      columns={[
        {
          caption: 'Acciones',
          width: 110,
          allowFiltering: false,
          allowSorting: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Ver inventario', icon: 'mdi mdi-pencil', onClick: () => openExistingModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar inventario', icon: 'mdi mdi-delete', onClick: () => remove(data.id) }))
          }
        },
        {
          dataField: 'code',
          caption: 'Codigo',
          minWidth: 130,
          cellTemplate: (container, { data }) => {
            $('<a></a>').attr('href', '#').text(data.code ?? '').on('click', (e) => {
              e.preventDefault()
              openExistingModal(data)
            }).appendTo(container)
          }
        },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 180 },
        { dataField: 'client.full_name', caption: 'Cliente', minWidth: 220 },
        { dataField: 'location', caption: 'Ubicacion', minWidth: 120 },
        { dataField: 'creator.fullname', caption: 'Usuario registro', minWidth: 170, allowFiltering: false, calculateCellValue: row => formatUser(row.creator) },
        {
          dataField: 'created_at',
          caption: 'Fecha registro',
          minWidth: 165,
          allowFiltering: false,
          cellTemplate: (container, { data }) => container.text(formatDateTime(data.created_at))
        },
        {
          dataField: 'inventory_status',
          caption: 'Estado',
          width: 115,
          cellTemplate: (container, { data }) => container.html(`<span class="badge badge-soft-warning">${data.inventory_status ?? 'En espera'}</span>`)
        },
      ]}
    />

    <Modal
      modalRef={modalRef}
      title={<div className='d-flex align-items-center gap-2 text-white fw-bold fs-6 text-uppercase'>
        <i className='mdi mdi-format-list-bulleted'></i>
        Registrar pedidos
      </div>}
      size='fullscreen'
      hideFooter
      dialogClass='modal-dialog-scrollable'
      contentClass='rounded-0'
      headerClass='py-2 border-0 bg-storage-inventory-modal'
      closeButtonClass='btn-close-white'
      bodyClass='p-4'
      bodyStyle={{ maxHeight: 'calc(100vh - 88px)', overflowY: 'auto', overflowX: 'hidden' }}
      onSubmit={(e) => e.preventDefault()}
      onClose={resetModal}
    >
      <style>{`
        .bg-storage-inventory-modal { background: #25274f; }
        .storage-inventory-modal-actions { min-height: 43px; }
        .storage-inventory-filter-row .form-label { margin-bottom: 0.45rem; font-weight: 600; }
        .storage-inventory-table-wrap { min-height: 160px; }
      `}</style>
      <input ref={fileRef} type='file' accept='.csv' hidden onChange={uploadFormat} />
      <div className='d-flex justify-content-center gap-4 storage-inventory-modal-actions my-3'>
        {!selectedCount && <button type='button' className='btn btn-primary' onClick={registerInventory}>
          <i className='mdi mdi-plus me-1'></i>
          Registrar
        </button>}
        <button type='button' className='btn btn-light' data-bs-dismiss='modal'>
          <i className='mdi mdi-close me-1'></i>
          Cerrar
        </button>
      </div>
      <hr className='my-4' />

      <div className='row g-4 align-items-end storage-inventory-filter-row mb-4'>
        <div className='col-12 col-md-6 col-xl-2'>
          <label className='form-label'>Almacen</label>
          <select className='form-select' value={warehouseId} disabled={!!selectedCount} onChange={(e) => changeWarehouse(e.target.value)}>
            <option value=''>Seleccione Almacen</option>
            {warehouses.map(warehouse => (
              <option key={`storage-inv-wh-${warehouse.id}`} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
        <div className='col-12 col-md-6 col-xl-3'>
          <label className='form-label'>Ubicacion</label>
          <select className='form-select' value={location} disabled={!!selectedCount || !warehouseId} onChange={(e) => setLocation(e.target.value)}>
            <option value=''>{warehouseId ? 'Seleccione ubicación' : 'Seleccione almacén primero'}</option>
            {filteredLocations.map(item => (
              <option key={`storage-inv-location-${item.warehouse_id ?? 'all'}-${item.location}`} value={item.location}>
                {item.location}
              </option>
            ))}
          </select>
        </div>
        <div className='col-12 col-xl-5'>
          <label className='form-label'>Cliente</label>
          <select className='form-select' value={clientId} disabled={!!selectedCount} onChange={(e) => setClientId(e.target.value)}>
            <option value=''>Seleccione cliente</option>
            {clients.map(client => (
              <option key={`storage-inv-client-${client.id}`} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className='col-12 col-xl-2 d-grid'>
          <button type='button' className='btn btn-outline-primary py-2 fw-semibold' disabled={!!selectedCount || !warehouseId || loadingRows} onClick={refreshPreview}>
            <i className='mdi mdi-magnify me-1'></i>
            Filtrar
          </button>
        </div>
      </div>

      <div className='d-flex flex-wrap gap-4 mb-5'>
        <button type='button' className='btn btn-outline-success px-5 py-2' disabled={!selectedCount?.id} onClick={downloadFormat}>
          Descargar Formato
        </button>
        <button type='button' className='btn btn-outline-success px-5 py-2' disabled={!selectedCount?.id} onClick={() => fileRef.current?.click()}>
          Subir Formato
        </button>
      </div>

      <h3 className='text-center mb-4'>INVENTARIO N° {selectedCountCode}</h3>
      {selectedClientName && <div className='d-flex justify-content-end mb-2'><span className='badge badge-soft-secondary fs-14'>{selectedClientName}</span></div>}
      <div className='d-flex flex-wrap justify-content-between align-items-center gap-3 mb-2'>
        <label className='d-inline-flex align-items-center gap-2 mb-0'>
          Elementos:
          <select className='form-select form-select-sm w-auto' value={tablePageSize} onChange={(e) => setTablePageSize(Number(e.target.value))}>
            {[10, 25, 50, 100].map(size => <option key={`storage-inv-page-size-${size}`} value={size}>{size}</option>)}
          </select>
        </label>
        <label className='d-inline-flex align-items-center gap-2 mb-0'>
          Filtrar:
          <input className='form-control form-control-sm' style={{ width: 220 }} value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} />
        </label>
      </div>
      <div className='table-responsive border rounded position-relative storage-inventory-table-wrap'>
        {loadingRows && <div className='position-absolute top-0 start-0 end-0 bottom-0 bg-white bg-opacity-75 d-flex align-items-center justify-content-center' style={{ zIndex: 1 }}>
          <i className='mdi mdi-spin mdi-loading mdi-36px'></i>
        </div>}
        <table className='table table-sm table-striped mb-0'>
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th style={{ minWidth: 120 }}>LOTE</th>
              <th style={{ minWidth: 130 }}>F. VENCIMIENTO</th>
              <th style={{ minWidth: 260 }}>ARTICULO</th>
              <th style={{ minWidth: 220 }}>CLIENTE</th>
              <th style={{ minWidth: 100 }}>U. MEDIDA</th>
              <th style={{ minWidth: 110 }}>UBICACION</th>
              <th style={{ minWidth: 130 }}>TEMPERATURA</th>
              <th style={{ minWidth: 130 }}>STOCK SISTEMA</th>
              <th style={{ minWidth: 120 }}>STOCK REAL</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && <tr><td colSpan='10' className='text-center py-4'>No existen elementos</td></tr>}
            {paginatedRows.map((row, index) => (
              <tr key={`storage-inventory-detail-${row.id ?? index}`}>
                <td>{row.id ?? index + 1}</td>
                <td>{row.lot || '-'}</td>
                <td>{formatDate(row.expiration_date)}</td>
                <td>{row.article_name || '-'}</td>
                <td>{row.client_name || selectedClientName || '-'}</td>
                <td>{row.unit_label || '-'}</td>
                <td>{row.location || '-'}</td>
                <td>{row.temperature_range || '-'}</td>
                <td>{formatQty(row.system_stock)}</td>
                <td>{formatQty(row.real_stock)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='d-flex flex-wrap justify-content-between align-items-center gap-3 mt-2'>
        <div>
          {filteredRows.length} elementos
          {filteredRows.length > 0 && ` (Página ${currentTablePage} de ${tablePageCount})`}
        </div>
        <div className='d-inline-flex align-items-center gap-2'>
          <button type='button' className='btn btn-link p-0 text-muted text-decoration-none' disabled={currentTablePage <= 1} onClick={() => setTablePage(page => Math.max(1, page - 1))}>
            Anterior
          </button>
          <button type='button' className='btn btn-sm btn-primary' disabled>
            {currentTablePage}
          </button>
          <button type='button' className='btn btn-link p-0 text-decoration-none' disabled={currentTablePage >= tablePageCount} onClick={() => setTablePage(page => Math.min(tablePageCount, page + 1))}>
            Siguiente
          </button>
        </div>
      </div>
    </Modal>
  </>
}

const Inventory = (props) => props.storageContext
  ? <StorageInventory {...props} />
  : <StandardInventory {...props} />

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? scopedPermission('inventory')
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Inventario'}>
    <Inventory {...properties} />
  </BaseAdminto>);
})
