import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
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
const formatMoney = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const standardInventoryHeaders = ['ID', 'CODIGO LOTE', 'NOMBRE', 'LABORATORIO', 'UBICACION', 'STOCK SISTEMA', 'STOCK REAL']
const storageInventoryHeaders = ['ID', 'LOTE', 'F. VENCIMIENTO', 'ARTÍCULO', 'CLIENTE', 'U. MEDIDA', 'UBICACION', 'TEMPERATURA', 'STOCK SISTEMA', 'STOCK REAL']

const safeExcelFileName = (value) => `${value || 'inventario'}`.replace(/[\\/:*?"<>|]+/g, '-')

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
  difference: Number(item.difference ?? (Number(item.real_stock ?? 0) - Number(item.system_stock ?? 0))),
})

const mapStandardItem = (item) => ({
  id: item.id,
  lot: item.lot ?? '',
  expiration_date: item.expiration_date?.toString?.().slice?.(0, 10) ?? '',
  article_code: item.article_code ?? item.article?.code ?? '',
  article_name: item.article_name ?? item.article?.name ?? '',
  laboratory_name: item.laboratory_name ?? item.article?.laboratory?.name ?? '',
  unit_label: item.unit_label ?? '',
  location: item.location ?? '',
  system_stock: Number(item.system_stock ?? 0),
  real_stock: Number(item.real_stock ?? 0),
  difference: Number(item.difference ?? (Number(item.real_stock ?? 0) - Number(item.system_stock ?? 0))),
  cost_unit: Number(item.cost_unit ?? 0),
  total_cost: Number(item.total_cost ?? 0),
})

const inventoryStatusBadge = (status) => {
  const normalized = status || 'En espera'
  const className = {
    Aplicado: 'badge-soft-success',
    'Sin diferencias': 'badge-soft-info',
    'Con diferencias': 'badge-soft-danger',
    'En espera': 'badge-soft-warning',
  }[normalized] ?? 'badge-soft-secondary'
  return `<span class="badge ${className}">${normalized}</span>`
}

const StandardInventory = ({ moduleTitle = 'Inventario Kamary Peru', businessScopes = {}, businessScopeKey = 'kamary_peru' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const fileRef = useRef()
  const [warehouses, setWarehouses] = useState([])
  const [laboratories, setLaboratories] = useState([])
  const [filterWarehouseId, setFilterWarehouseId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [laboratoryId, setLaboratoryId] = useState('')
  const [rows, setRows] = useState([])
  const [selectedCount, setSelectedCount] = useState(null)
  const [loadingRows, setLoadingRows] = useState(false)
  const [tablePageSize, setTablePageSize] = useState(10)
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)

  useEffect(() => {
    inventoryRest.getStandardOptions().then(data => {
      setWarehouses(data?.warehouses ?? [])
      setLaboratories(data?.laboratories ?? [])
    })
  }, [])

  useEffect(() => {
    inventoryRest.setFilters({ warehouse_id: filterWarehouseId || '' })
    if (!gridRef.current) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }, [filterWarehouseId])

  const fixedBusinessLabel = (businessScopes?.[businessScopeKey] || 'KAMARY PERU').toUpperCase()
  const selectedCountCode = selectedCount?.code ?? ''
  const selectedWarehouseName = selectedCount?.warehouse?.name || warehouses.find(warehouse => `${warehouse.id}` === `${warehouseId}`)?.name || ''
  const selectedLaboratoryName = selectedCount?.laboratory?.name || laboratories.find(lab => `${lab.id}` === `${laboratoryId}`)?.name || ''
  const filteredRows = useMemo(() => {
    const term = tableSearch.trim().toLowerCase()
    if (!term) return rows

    return rows.filter(row => [
      row.id,
      row.lot,
      row.article_code,
      row.article_name,
      row.laboratory_name,
      row.unit_label,
      row.location,
      row.system_stock,
      row.real_stock,
      row.difference,
      row.cost_unit,
      row.total_cost,
    ].some(value => `${value ?? ''}`.toLowerCase().includes(term)))
  }, [rows, tableSearch])
  const hasSelectedDifferences = rows.some(row => Math.abs(Number(row.difference || 0)) > 0.0001)
  const selectedCountApplied = selectedCount?.inventory_status === 'Aplicado'
  const tablePageCount = Math.max(1, Math.ceil(filteredRows.length / tablePageSize))
  const currentTablePage = Math.min(tablePage, tablePageCount)
  const paginatedRows = filteredRows.slice((currentTablePage - 1) * tablePageSize, currentTablePage * tablePageSize)

  useEffect(() => {
    setTablePage(1)
  }, [rows, tablePageSize, tableSearch])

  const resetModal = (nextWarehouseId = '') => {
    setSelectedCount(null)
    setWarehouseId(nextWarehouseId)
    setLaboratoryId('')
    setRows([])
    setTableSearch('')
    setTablePage(1)
  }

  const openNewModal = () => {
    resetModal(filterWarehouseId)
    $(modalRef.current).modal('show')
  }

  const openExistingModal = async (data) => {
    const result = await inventoryRest.getStandardInventory(data.id)
    if (!result) return
    setSelectedCount(result)
    setWarehouseId(result.warehouse_id ? `${result.warehouse_id}` : '')
    setLaboratoryId(result.laboratory_id ? `${result.laboratory_id}` : '')
    setRows((result.items ?? []).map(mapStandardItem))
    $(modalRef.current).modal('show')
  }

  const refreshPreview = async () => {
    if (!warehouseId) {
      await Swal.fire({ icon: 'warning', title: 'Almacen requerido', text: 'Selecciona el almacen antes de generar el listado.' })
      return
    }
    setLoadingRows(true)
    const data = await inventoryRest.previewStandardInventory({
      warehouse_id: warehouseId || null,
      laboratory_id: laboratoryId || null,
    })
    setRows(data ?? [])
    setLoadingRows(false)
  }

  const registerInventory = async () => {
    if (!warehouseId) {
      await Swal.fire({ icon: 'warning', title: 'Almacen requerido', text: 'Selecciona el almacen antes de registrar inventario.' })
      return
    }
    const result = await inventoryRest.saveStandardInventory({
      warehouse_id: warehouseId || null,
      laboratory_id: laboratoryId || null,
    })
    if (!result) return
    setSelectedCount(result)
    setRows((result.items ?? []).map(mapStandardItem))
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const downloadFormat = () => {
    if (!selectedCount?.id) return
    const worksheetRows = [
      [`Formato de inventario fisico - ${selectedWarehouseName || 'Almacen'}`],
      selectedLaboratoryName ? [`Laboratorio: ${selectedLaboratoryName}`] : [],
      standardInventoryHeaders,
      ...rows.map(row => [
        row.id ?? '',
        row.lot ?? '',
        row.article_name ?? '',
        row.laboratory_name ?? '',
        row.location ?? '',
        Number(row.system_stock ?? 0),
        '',
      ]),
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetRows)
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: standardInventoryHeaders.length - 1 } }]
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 16 },
      { wch: 44 },
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario')
    XLSX.writeFile(workbook, `${safeExcelFileName(selectedCountCode)}_formato_inventario_kamary_peru.xlsx`)
  }

  const uploadFormat = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !selectedCount?.id) return
    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      let csvContent = ''
      if (extension === 'csv') {
        csvContent = await file.text()
      } else {
        const content = await file.arrayBuffer()
        const workbook = XLSX.read(content, { type: 'array' })
        const firstSheet = workbook.SheetNames?.[0]
        if (!firstSheet) throw new Error('El archivo no contiene hojas para procesar')
        csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet], { FS: ',', blankrows: false })
      }
      const csvFile = new File([`\ufeff${csvContent}`], `${safeExcelFileName(selectedCountCode)}_formato_inventario_kamary_peru.csv`, { type: 'text/csv;charset=utf-8' })
      const formData = new FormData()
      formData.append('format_file', csvFile)
      const result = await inventoryRest.importStandardFormat(selectedCount.id, formData)
      if (!result) return
      setSelectedCount(result)
      setRows((result.items ?? []).map(mapStandardItem))
      $(gridRef.current).dxDataGrid('instance').refresh()
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Formato invalido', text: error.message })
    }
  }

  const applyInventory = async () => {
    if (!selectedCount?.id) return
    const { isConfirmed } = await Swal.fire({
      title: 'Aplicar inventario',
      text: 'Se crearan ajustes de entrada o salida para igualar el stock al conteo real.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, aplicar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await inventoryRest.applyStandardInventory(selectedCount.id)
    if (!result) return
    setSelectedCount(result)
    setRows((result.items ?? []).map(mapStandardItem))
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
        <div className='row g-3 align-items-end'>
          <div className='col-12 col-md-4'>
            <label className='form-label'>Empresa</label>
            <input className='form-control bg-light' value={fixedBusinessLabel} readOnly />
          </div>
          <div className='col-12 col-md-4'>
            <label className='form-label'>Almacen</label>
            <select className='form-control' value={filterWarehouseId} onChange={(e) => setFilterWarehouseId(e.target.value)}>
              <option value=''>Todos</option>
              {warehouses.map(warehouse => (
                <option key={`standard-inv-filter-wh-${warehouse.id}`} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div className='col-12 col-md-4'>
            <button type='button' className='btn btn-primary d-inline-flex align-items-center gap-2' onClick={openNewModal}>
              <i className='mdi mdi-plus-circle-outline'></i>
              Registrar inventario
            </button>
          </div>
        </div>
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
          width: 135,
          minWidth: 135,
          fixed: true,
          fixedPosition: 'left',
          allowFiltering: false,
          allowSorting: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css({ overflow: 'visible', textOverflow: 'unset', whiteSpace: 'nowrap' })
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Ver inventario', icon: 'mdi mdi-pencil', onClick: () => openExistingModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar inventario', icon: 'mdi mdi-delete', onClick: () => remove(data.id) }))
          }
        },
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 185,
          minWidth: 185,
          cellTemplate: (container, { data }) => {
            $('<a></a>').attr('href', '#').text(data.code ?? '').on('click', (e) => {
              e.preventDefault()
              openExistingModal(data)
            }).appendTo(container)
          }
        },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 180 },
        { dataField: 'laboratory.name', caption: 'Laboratorio', minWidth: 180 },
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
          width: 145,
          minWidth: 145,
          cellTemplate: (container, { data }) => container.html(inventoryStatusBadge(data.inventory_status))
        },
      ]}
    />

    <Modal
      modalRef={modalRef}
      title='Registrar inventario'
      size='xl'
      hideFooter
      dialogClass='modal-dialog-scrollable storage-inventory-dialog'
      bodyClass='storage-inventory-template-body'
      bodyStyle={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', overflowX: 'hidden' }}
      onSubmit={(e) => e.preventDefault()}
      onClose={() => resetModal()}
    >
      <style>{`
        .storage-inventory-dialog {
          width: calc(100vw - 32px);
          max-width: calc(100vw - 32px);
          margin: .9rem auto;
        }
        .storage-inventory-template-body {
          padding: 1rem 1.25rem 1.25rem;
          color: #30384d;
        }
        .storage-inventory-template-body .form-label {
          margin-bottom: .45rem;
          font-weight: 600;
        }
        .storage-inventory-modal-actions {
          border-bottom: 1px solid #e4e7ec;
          margin: 0 0 1.25rem !important;
          min-height: 0;
          padding: 1rem 0;
        }
        .storage-inventory-template-subtitle {
          color: #30384d;
          font-size: .78rem;
          font-weight: 700;
          margin-bottom: .75rem;
          text-transform: uppercase;
        }
        .storage-inventory-toolbar {
          border-bottom: 1px solid #e4e7ec;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
        }
        .storage-inventory-heading {
          color: #30384d;
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: 0;
          text-align: center;
        }
        .storage-inventory-table-wrap {
          border: 1px solid #e3e8ef;
          border-radius: 0;
          min-height: 160px;
          overflow: auto;
        }
        .storage-inventory-table {
          min-width: 1500px;
        }
        .storage-inventory-table th {
          color: #30364d;
          font-size: 0.75rem;
          text-transform: uppercase;
          white-space: nowrap;
          background: #fff;
        }
        .storage-inventory-table td {
          vertical-align: middle;
        }
      `}</style>
      <input ref={fileRef} type='file' accept='.xlsx,.xls,.csv' hidden onChange={uploadFormat} />
      <div className='d-flex flex-wrap justify-content-center gap-4 storage-inventory-modal-actions'>
        {!selectedCount && <button type='button' className='btn btn-primary' onClick={registerInventory}>
          <i className='mdi mdi-plus me-1'></i>
          Registrar
        </button>}
        <button type='button' className='btn btn-light' data-bs-dismiss='modal'>
          <i className='mdi mdi-close me-1'></i>
          Cerrar
        </button>
        {selectedCount?.id && !selectedCountApplied && hasSelectedDifferences && <button type='button' className='btn btn-success' onClick={applyInventory}>
          <i className='mdi mdi-check-circle-outline me-1'></i>
          Aplicar inventario
        </button>}
      </div>

      <div className='storage-inventory-template-subtitle'>
        <i className='mdi mdi-filter-outline me-1'></i>
        INGRESAR DATOS
      </div>
      <div className='row g-3 align-items-end storage-inventory-filter-row mb-3'>
        <div className='col-12 col-md-6 col-xl-4'>
          <label className='form-label'>Almacen</label>
          <select className='form-select' value={warehouseId} disabled={!!selectedCount} onChange={(e) => setWarehouseId(e.target.value)}>
            <option value=''>Seleccione almacen</option>
            {warehouses.map(warehouse => (
              <option key={`standard-inv-wh-${warehouse.id}`} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
        <div className='col-12 col-md-6 col-xl-4'>
          <label className='form-label'>Laboratorio</label>
          <select className='form-select' value={laboratoryId} disabled={!!selectedCount} onChange={(e) => setLaboratoryId(e.target.value)}>
            <option value=''>Todos</option>
            {laboratories.map(lab => (
              <option key={`standard-inv-lab-${lab.id}`} value={lab.id}>{lab.name}</option>
            ))}
          </select>
        </div>
        <div className='col-12 col-xl-4 d-grid'>
          <button type='button' className='btn btn-outline-primary py-2 fw-semibold' disabled={!!selectedCount || !warehouseId || loadingRows} onClick={refreshPreview}>
            <i className='mdi mdi-magnify me-1'></i>
            Generar listado
          </button>
        </div>
      </div>

      <div className='d-flex flex-wrap gap-4 storage-inventory-toolbar'>
        <button type='button' className='btn btn-outline-success px-4' disabled={!selectedCount?.id} onClick={downloadFormat}>
          Descargar Excel
        </button>
        <button type='button' className='btn btn-outline-success px-4' disabled={!selectedCount?.id || selectedCountApplied} onClick={() => fileRef.current?.click()}>
          Subir Excel
        </button>
      </div>

      <h3 className='storage-inventory-heading mb-4'>INVENTARIO NÂ° {selectedCountCode}</h3>
      <div className='d-flex flex-wrap justify-content-end gap-2 mb-2'>
        {selectedWarehouseName && <span className='badge badge-soft-secondary fs-14'>{selectedWarehouseName}</span>}
        {selectedLaboratoryName && <span className='badge badge-soft-info fs-14'>{selectedLaboratoryName}</span>}
      </div>
      <div className='d-flex flex-wrap justify-content-between align-items-center gap-3 mb-2'>
        <label className='d-inline-flex align-items-center gap-2 mb-0'>
          Elementos:
          <select className='form-select form-select-sm w-auto' value={tablePageSize} onChange={(e) => setTablePageSize(Number(e.target.value))}>
            {[10, 25, 50, 100].map(size => <option key={`standard-inv-page-size-${size}`} value={size}>{size}</option>)}
          </select>
        </label>
        <label className='d-inline-flex align-items-center gap-2 mb-0'>
          Filtrar:
          <input className='form-control form-control-sm' style={{ width: 220 }} value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} />
        </label>
      </div>
      <div className='position-relative storage-inventory-table-wrap'>
        {loadingRows && <div className='position-absolute top-0 start-0 end-0 bottom-0 bg-white bg-opacity-75 d-flex align-items-center justify-content-center' style={{ zIndex: 1 }}>
          <i className='mdi mdi-spin mdi-loading mdi-36px'></i>
        </div>}
        <table className='table table-sm table-striped mb-0 storage-inventory-table'>
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th style={{ minWidth: 120 }}>CODIGO LOTE</th>
              <th style={{ minWidth: 130 }}>CODIGO</th>
              <th style={{ minWidth: 260 }}>NOMBRE</th>
              <th style={{ minWidth: 180 }}>LABORATORIO</th>
              <th style={{ minWidth: 100 }}>U. MEDIDA</th>
              <th style={{ minWidth: 120 }}>UBICACION</th>
              <th style={{ minWidth: 130 }}>STOCK SISTEMA</th>
              <th style={{ minWidth: 120 }}>STOCK REAL</th>
              <th style={{ minWidth: 120 }}>DIFERENCIA</th>
              <th style={{ minWidth: 120 }}>COSTO UNIT.</th>
              <th style={{ minWidth: 120 }}>TOTAL VAL.</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && <tr><td colSpan='12' className='text-center py-4'>No existen elementos</td></tr>}
            {paginatedRows.map((row, index) => (
              <tr key={`standard-inventory-detail-${row.id ?? index}`}>
                <td>{row.id ?? index + 1}</td>
                <td>{row.lot || '-'}</td>
                <td>{row.article_code || '-'}</td>
                <td>{row.article_name || '-'}</td>
                <td>{row.laboratory_name || '-'}</td>
                <td>{row.unit_label || '-'}</td>
                <td>{row.location || '-'}</td>
                <td>{formatQty(row.system_stock)}</td>
                <td>{formatQty(row.real_stock)}</td>
                <td className={Number(row.difference || 0) === 0 ? '' : (Number(row.difference || 0) > 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold')}>
                  {formatQty(row.difference)}
                </td>
                <td>{formatMoney(row.cost_unit)}</td>
                <td>{formatMoney(row.total_cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='d-flex flex-wrap justify-content-between align-items-center gap-3 mt-2'>
        <div>
          {filteredRows.length} elementos
          {filteredRows.length > 0 && ` (Pagina ${currentTablePage} de ${tablePageCount})`}
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
  const hasSelectedDifferences = rows.some(row => Math.abs(Number(row.difference || 0)) > 0.0001)
  const selectedCountApplied = selectedCount?.inventory_status === 'Aplicado'
  const tablePageCount = Math.max(1, Math.ceil(filteredRows.length / tablePageSize))
  const currentTablePage = Math.min(tablePage, tablePageCount)
  const paginatedRows = filteredRows.slice((currentTablePage - 1) * tablePageSize, currentTablePage * tablePageSize)
  const filteredLocations = useMemo(() => locations.filter(item => {
    if (!warehouseId || !clientId) return false
    return `${item.warehouse_id}` === `${warehouseId}`
      && `${item.client_id ?? ''}` === `${clientId}`
  }), [locations, warehouseId, clientId])

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
    if (!clientId) {
      await Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona el cliente antes de filtrar inventario.' })
      return
    }
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
    if (!clientId) {
      await Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona el cliente antes de registrar inventario.' })
      return
    }
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
    const warehouseName = selectedCount?.warehouse?.name
      || warehouses.find(warehouse => `${warehouse.id}` === `${warehouseId}`)?.name
      || 'Almacen'
    const worksheetRows = [
      [`Formato de ajuste de inventario - ${warehouseName}`],
      [],
      storageInventoryHeaders,
      ...rows.map(row => [
        row.id ?? '',
        row.lot ?? '',
        row.expiration_date ?? '',
        row.article_name ?? '',
        row.client_name || selectedClientName || '',
        row.unit_label ?? '',
        row.location ?? '',
        row.temperature_range ?? '',
        Number(row.system_stock ?? 0),
        '',
      ]),
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetRows)
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: storageInventoryHeaders.length - 1 } }]
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 44 },
      { wch: 28 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario')
    XLSX.writeFile(workbook, `${safeExcelFileName(selectedCountCode)}_formato_ajuste_inventario.xlsx`)
  }

  const uploadFormat = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !selectedCount?.id) return
    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      let csvContent = ''
      if (extension === 'csv') {
        csvContent = await file.text()
      } else {
        const content = await file.arrayBuffer()
        const workbook = XLSX.read(content, { type: 'array' })
        const firstSheet = workbook.SheetNames?.[0]
        if (!firstSheet) throw new Error('El archivo no contiene hojas para procesar')
        csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet], { FS: ',', blankrows: false })
      }
      const csvFile = new File([`\ufeff${csvContent}`], `${safeExcelFileName(selectedCountCode)}_formato_ajuste_inventario.csv`, { type: 'text/csv;charset=utf-8' })
      const formData = new FormData()
      formData.append('format_file', csvFile)
      const result = await inventoryRest.importStorageFormat(selectedCount.id, formData)
      if (!result) return
      setSelectedCount(result)
      setRows((result.items ?? []).map(mapStoredItem))
      $(gridRef.current).dxDataGrid('instance').refresh()
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Formato invalido', text: error.message })
    }
  }

  const applyInventory = async () => {
    if (!selectedCount?.id) return
    const { isConfirmed } = await Swal.fire({
      title: 'Aplicar inventario',
      text: 'Se crearan ajustes de entrada o salida para que el stock quede igual al conteo real.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, aplicar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await inventoryRest.applyStorageInventory(selectedCount.id)
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
          width: 135,
          minWidth: 135,
          fixed: true,
          fixedPosition: 'left',
          allowFiltering: false,
          allowSorting: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css({ overflow: 'visible', textOverflow: 'unset', whiteSpace: 'nowrap' })
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Ver inventario', icon: 'mdi mdi-pencil', onClick: () => openExistingModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar inventario', icon: 'mdi mdi-delete', onClick: () => remove(data.id) }))
          }
        },
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 185,
          minWidth: 185,
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
          width: 145,
          minWidth: 145,
          cellTemplate: (container, { data }) => container.html(inventoryStatusBadge(data.inventory_status))
        },
      ]}
    />

    <Modal
      modalRef={modalRef}
      title='Registrar inventario'
      size='xl'
      hideFooter
      dialogClass='modal-dialog-scrollable storage-inventory-dialog'
      bodyClass='storage-inventory-template-body'
      bodyStyle={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', overflowX: 'hidden' }}
      onSubmit={(e) => e.preventDefault()}
      onClose={resetModal}
    >
      <style>{`
        .storage-inventory-dialog {
          width: calc(100vw - 32px);
          max-width: calc(100vw - 32px);
          margin: .9rem auto;
        }
        .storage-inventory-template-body {
          padding: 1rem 1.25rem 1.25rem;
          color: #30384d;
        }
        .storage-inventory-template-body .form-label {
          margin-bottom: .45rem;
          font-weight: 600;
        }
        .storage-inventory-modal-actions {
          border-bottom: 1px solid #e4e7ec;
          margin: 0 0 1.25rem !important;
          min-height: 0;
          padding: 1rem 0;
        }
        .storage-inventory-template-subtitle {
          color: #30384d;
          font-size: .78rem;
          font-weight: 700;
          margin-bottom: .75rem;
          text-transform: uppercase;
        }
        .storage-inventory-toolbar {
          border-bottom: 1px solid #e4e7ec;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
        }
        .storage-inventory-heading {
          color: #30384d;
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: 0;
          text-align: center;
        }
        .storage-inventory-table-wrap {
          border: 1px solid #e3e8ef;
          border-radius: 0;
          min-height: 160px;
          overflow: auto;
        }
        .storage-inventory-table {
          min-width: 1580px;
        }
        .storage-inventory-table th {
          color: #30364d;
          font-size: 0.75rem;
          text-transform: uppercase;
          white-space: nowrap;
          background: #fff;
        }
        .storage-inventory-table td {
          vertical-align: middle;
        }
        @media (max-width: 767.98px) {
          .storage-inventory-dialog { width: calc(100vw - 12px); max-width: calc(100vw - 12px); }
          .storage-inventory-template-body { padding: 0 1rem 1rem; }
        }
      `}</style>
      <input ref={fileRef} type='file' accept='.xlsx,.xls,.csv' hidden onChange={uploadFormat} />
      <div className='d-flex flex-wrap justify-content-center gap-4 storage-inventory-modal-actions'>
        {!selectedCount && <button type='button' className='btn btn-primary' onClick={registerInventory}>
          <i className='mdi mdi-plus me-1'></i>
          Registrar
        </button>}
        <button type='button' className='btn btn-light' data-bs-dismiss='modal'>
          <i className='mdi mdi-close me-1'></i>
          Cerrar
        </button>
        {selectedCount?.id && !selectedCountApplied && hasSelectedDifferences && <button type='button' className='btn btn-success' onClick={applyInventory}>
          <i className='mdi mdi-check-circle-outline me-1'></i>
          Aplicar inventario
        </button>}
      </div>

      <div className='storage-inventory-template-subtitle'>
        <i className='mdi mdi-filter-outline me-1'></i>
        INGRESAR DATOS
      </div>
      <div className='row g-3 align-items-end storage-inventory-filter-row mb-3'>
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
          <select className='form-select' value={location} disabled={!!selectedCount || !warehouseId || !clientId} onChange={(e) => setLocation(e.target.value)}>
            <option value=''>{warehouseId && clientId ? 'Seleccione ubicación' : 'Seleccione almacén y cliente primero'}</option>
            {filteredLocations.map(item => (
              <option key={`storage-inv-location-${item.warehouse_id ?? 'all'}-${item.client_id ?? 'all'}-${item.location}`} value={item.location}>
                {item.location}
              </option>
            ))}
          </select>
        </div>
        <div className='col-12 col-xl-5'>
          <label className='form-label'>Cliente</label>
          <select className='form-select' value={clientId} disabled={!!selectedCount} onChange={(e) => {
            setClientId(e.target.value)
            setLocation('')
          }}>
            <option value=''>Seleccione cliente</option>
            {clients.map(client => (
              <option key={`storage-inv-client-${client.id}`} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className='col-12 col-xl-2 d-grid'>
          <button type='button' className='btn btn-outline-primary py-2 fw-semibold' disabled={!!selectedCount || !warehouseId || !clientId || loadingRows} onClick={refreshPreview}>
            <i className='mdi mdi-magnify me-1'></i>
            Filtrar
          </button>
        </div>
      </div>

      <div className='d-flex flex-wrap gap-4 storage-inventory-toolbar'>
        <button type='button' className='btn btn-outline-success px-4' disabled={!selectedCount?.id} onClick={downloadFormat}>
          Descargar Excel
        </button>
        <button type='button' className='btn btn-outline-success px-4' disabled={!selectedCount?.id || selectedCountApplied} onClick={() => fileRef.current?.click()}>
          Subir Excel
        </button>
      </div>

      <h3 className='storage-inventory-heading mb-4'>INVENTARIO N° {selectedCountCode}</h3>
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
      <div className='position-relative storage-inventory-table-wrap'>
        {loadingRows && <div className='position-absolute top-0 start-0 end-0 bottom-0 bg-white bg-opacity-75 d-flex align-items-center justify-content-center' style={{ zIndex: 1 }}>
          <i className='mdi mdi-spin mdi-loading mdi-36px'></i>
        </div>}
        <table className='table table-sm table-striped mb-0 storage-inventory-table'>
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
              <th style={{ minWidth: 120 }}>DIFERENCIA</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && <tr><td colSpan='11' className='text-center py-4'>No existen elementos</td></tr>}
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
                <td className={Number(row.difference || 0) === 0 ? '' : (Number(row.difference || 0) > 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold')}>
                  {formatQty(row.difference)}
                </td>
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
