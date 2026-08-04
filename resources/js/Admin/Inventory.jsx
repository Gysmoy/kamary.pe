import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
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
const storageInventoryHeaders = ['ID', 'LOTE', 'F. VENCIMIENTO', 'ARTICULO', 'CLIENTE', 'U. MEDIDA', 'UBICACION', 'TEMPERATURA', 'STOCK SISTEMA', 'STOCK REAL']

const safeExcelFileName = (value) => `${value || 'inventario'}`.replace(/[\\/:*?"<>|]+/g, '-')
const warehouseName = (warehouse) => `${warehouse?.name ?? ''}`.trim()
const warehouseNameKey = (warehouse) => warehouseName(warehouse).toLocaleLowerCase('es-PE')
// Un almacen por opcion. Antes se agrupaban por nombre, de modo que dos almacenes distintos
// llamados igual (p. ej. "Principal" en dos sedes) colapsaban en una sola entrada y el segundo
// resultaba inseleccionable. Cuando el nombre se repite se desambigua con la sede.
const warehouseSelectOptions = (warehouses = []) => {
  const valid = warehouses.filter(warehouse => warehouseName(warehouse) && warehouse?.id != null)

  const timesUsed = new Map()
  valid.forEach(warehouse => {
    const key = warehouseNameKey(warehouse)
    timesUsed.set(key, (timesUsed.get(key) ?? 0) + 1)
  })

  return valid
    .map(warehouse => {
      const name = warehouseName(warehouse)
      const isDuplicated = (timesUsed.get(warehouseNameKey(warehouse)) ?? 0) > 1
      const branch = `${warehouse?.branch?.name ?? ''}`.trim()
      return {
        value: `${warehouse.id}`,
        name: isDuplicated ? [name, branch || `#${warehouse.id}`].join(' - ') : name,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es-PE'))
}

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

const inventoryStatusOptions = [
  { value: 'En espera', label: 'En espera' },
  { value: 'Sin diferencias', label: 'Sin diferencias' },
  { value: 'Con diferencias', label: 'Con diferencias' },
  { value: 'Aplicado', label: 'Aplicado' },
]
const inventoryStatusBadge = (status) => {
  const normalized = status || 'En espera'
  const className = {
    Aplicado: 'badge-soft-success',
    'Sin diferencias': 'badge-soft-info',
    'Con diferencias': 'badge-soft-danger',
    'En espera': 'badge-soft-warning',
  }[normalized] ?? 'badge-soft-secondary'
  return <span className={`badge ${className}`}>{normalized}</span>
}

const StandardInventory = ({ moduleTitle = 'Inventario Kamary Peru', businessScopes = {}, businessScopeKey = 'kamary_peru' }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const fileRef = useRef()
  const [warehouses, setWarehouses] = useState([])
  const [laboratories, setLaboratories] = useState([])
  const [filterWarehouseIds, setFilterWarehouseIds] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [laboratoryId, setLaboratoryId] = useState('')
  const [rows, setRows] = useState([])
  const [selectedCount, setSelectedCount] = useState(null)
  const [loadingRows, setLoadingRows] = useState(false)
  // Distingue "todavia no generaste el listado" de "lo generaste y no habia nada": sin esto los
  // botones quedaban apagados sin explicacion y parecian rotos.
  const [previewRan, setPreviewRan] = useState(false)
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
    inventoryRest.setFilters({ warehouse_id: '', warehouse_ids: filterWarehouseIds || '' })
    tableRef.current?.refresh()
  }, [filterWarehouseIds])

  const fixedBusinessLabel = (businessScopes?.[businessScopeKey] || 'KAMARY PERU').toUpperCase()
  const filterWarehouseOptions = useMemo(() => warehouseSelectOptions(warehouses), [warehouses])
  const firstFilterWarehouseId = filterWarehouseIds.split(',').filter(Boolean)[0] || ''
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
    setPreviewRan(false)
    setTableSearch('')
    setTablePage(1)
  }

  const openNewModal = () => {
    resetModal(firstFilterWarehouseId)
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
    setPreviewRan(true)
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
    tableRef.current?.refresh()
  }

  // El formato en blanco se puede bajar apenas hay listado, sin obligar a registrar antes el
  // inventario: registrar crea un InventoryCount en base de datos y no deberia ser el precio a
  // pagar por imprimir la hoja de conteo.
  const downloadFormat = () => {
    if (rows.length === 0) return
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
      tableRef.current?.refresh()
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
    tableRef.current?.refresh()
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
    tableRef.current?.refresh()
  }

  return <>
    <div className='card mb-3'>
      <div className='card-body'>
        <div className='row g-3 align-items-end'>
          <div className='col-12 col-md-4'>
            <label className='form-label'>Empresa</label>
            <input className='form-control bg-light' value={fixedBusinessLabel} readOnly />
          </div>
          <VdSelect
            col='col-12 col-md-4'
            label='Almacen'
            value={filterWarehouseIds}
            onChange={(value) => setFilterWarehouseIds(value)}
            options={[{ value: '', label: 'Todos' }, ...filterWarehouseOptions.map(warehouse => ({ value: warehouse.value, label: warehouse.name }))]}
            placeholder='Todos'
          />
        </div>
      </div>
    </div>

    <VdTable
      ref={tableRef}
      rest={inventoryRest}
      icon='mdi mdi-clipboard-list-outline'
      title='Inventarios registrados'
      unit='inventarios'
      defaultPageSize={10}
      searchFields={['code', 'warehouse.name', 'laboratory.name']}
      searchPlaceholder='Buscar por codigo, almacen o laboratorio…'
      emptyText='No se encontraron inventarios registrados.'
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
        <button type='button' className='vdt-btn-pri' onClick={openNewModal}>
          <i className='mdi mdi-plus'></i> Registrar inventario
        </button>
      </>}
      actions={(row) => [
        { icon: 'mdi mdi-pencil', title: 'Ver inventario', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => openExistingModal(r) },
        { icon: 'mdi mdi-delete', title: 'Eliminar inventario', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => remove(r.id) },
      ]}
      columns={[
        {
          key: 'codigo', label: 'Codigo', field: 'code', width: '150px', filter: { type: 'text' },
          render: (row) => (
            <a className='admin-grid-edit-link' style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => openExistingModal(row)} title='Ver inventario'>
              {row.code}
            </a>
          ),
        },
        { key: 'almacen', label: 'Almacen', field: 'warehouse.name', filter: { type: 'text', field: 'warehouse.name' } },
        { key: 'laboratorio', label: 'Laboratorio', field: 'laboratory.name', filter: { type: 'text', field: 'laboratory.name' } },
        {
          key: 'usuario', label: 'Usuario registro', field: 'creator.fullname', sortable: false,
          render: (row) => formatUser(row.creator),
        },
        {
          key: 'fecha', label: 'Fecha registro', field: 'created_at', width: '165px', nowrap: true,
          render: (row) => formatDateTime(row.created_at),
        },
        {
          key: 'estado', label: 'Estado', field: 'inventory_status', width: '145px',
          filter: { type: 'select', field: 'inventory_status', options: inventoryStatusOptions },
          render: (row) => inventoryStatusBadge(row.inventory_status),
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className='vdt-card' onClick={() => openExistingModal(row)}>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.code}</p>
              <small className='text-muted'>{[row.warehouse?.name, row.laboratory?.name].filter(Boolean).join(' · ')}</small>
            </div>
            {inventoryStatusBadge(row.inventory_status)}
          </div>
          <small className='text-muted d-block mt-2'>{formatUser(row.creator)} · {formatDateTime(row.created_at)}</small>
          {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
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
        <VdSelect
          col='col-12 col-md-6 col-xl-4'
          label='Almacen'
          required
          disabled={!!selectedCount}
          value={warehouseId}
          onChange={(value) => setWarehouseId(value)}
          options={filterWarehouseOptions.map(warehouse => ({ value: warehouse.value, label: warehouse.name }))}
          placeholder='Seleccione almacen'
        />
        <VdSelect
          col='col-12 col-md-6 col-xl-4'
          label='Laboratorio'
          disabled={!!selectedCount}
          value={laboratoryId}
          onChange={(value) => setLaboratoryId(value)}
          options={[{ value: '', label: 'Todos' }, ...laboratories.map(lab => ({ value: `${lab.id}`, label: lab.name }))]}
          placeholder='Todos'
        />
        <div className='col-12 col-xl-4 d-grid'>
          <button type='button' className='btn btn-outline-primary py-2 fw-semibold' disabled={!!selectedCount || !warehouseId || loadingRows} onClick={refreshPreview}>
            <i className='mdi mdi-magnify me-1'></i>
            Generar listado
          </button>
        </div>
      </div>

      {previewRan && rows.length === 0 && !selectedCount && (
        <div className='alert alert-warning d-flex align-items-start gap-2 mb-3'>
          <i className='mdi mdi-alert-outline fs-4 lh-1'></i>
          <div>
            <strong>Este almacen no tiene articulos para inventariar.</strong>
            <div className='mt-1'>
              No se encontro stock ni articulos asignados a <strong>{selectedWarehouseName || 'el almacen seleccionado'}</strong>
              {selectedLaboratoryName ? <> con el laboratorio <strong>{selectedLaboratoryName}</strong></> : null}.
              Por eso los botones de Excel estan deshabilitados. Revisa que el almacen tenga notas de entrada aprobadas
              o articulos asignados, o prueba con otro almacen.
            </div>
          </div>
        </div>
      )}

      <div className='d-flex flex-wrap gap-4 storage-inventory-toolbar'>
        <button
          type='button'
          className='btn btn-outline-success px-4'
          disabled={rows.length === 0}
          title={rows.length > 0
            ? 'Descargar el formato de conteo'
            : (previewRan ? 'El almacen seleccionado no tiene articulos para inventariar' : 'Genera primero el listado para descargar el formato')}
          onClick={downloadFormat}
        >
          Descargar Excel
        </button>
        <button
          type='button'
          className='btn btn-outline-success px-4'
          disabled={!selectedCount?.id || selectedCountApplied}
          title={selectedCountApplied
            ? 'Este inventario ya fue aplicado'
            : (!selectedCount?.id ? 'Pulsa "Registrar" antes de subir el conteo' : 'Subir el formato con el stock real')}
          onClick={() => fileRef.current?.click()}
        >
          Subir Excel
        </button>
      </div>

      <h3 className='storage-inventory-heading mb-4'>INVENTARIO Nro. {selectedCountCode}</h3>
      <div className='d-flex flex-wrap justify-content-end gap-2 mb-2'>
        {selectedWarehouseName && <span className='badge badge-soft-secondary fs-14'>{selectedWarehouseName}</span>}
        {selectedLaboratoryName && <span className='badge badge-soft-info fs-14'>{selectedLaboratoryName}</span>}
      </div>
      <div className='d-flex flex-wrap justify-content-between align-items-center gap-3 mb-2'>
        <label className='d-inline-flex align-items-center gap-2 mb-0'>
          Elementos:
          <div style={{ width: 90 }}>
            <VdSelect
              noMargin
              value={tablePageSize}
              onChange={(value) => setTablePageSize(Number(value))}
              options={[10, 25, 50, 100].map(size => ({ value: size, label: `${size}` }))}
            />
          </div>
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
  const tableRef = useRef()
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
  // Mismo criterio que en el inventario estandar: saber si el filtro ya se ejecuto.
  const [previewRan, setPreviewRan] = useState(false)
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
    setPreviewRan(false)
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
    setPreviewRan(true)
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
    tableRef.current?.refresh()
  }

  // Mismo criterio que en el inventario estandar: el formato en blanco no exige registrar antes.
  const downloadFormat = () => {
    if (rows.length === 0) return
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
      tableRef.current?.refresh()
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
    tableRef.current?.refresh()
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
    tableRef.current?.refresh()
  }

  return <>
    <VdTable
      ref={tableRef}
      rest={inventoryRest}
      icon='mdi mdi-clipboard-list-outline'
      title='Inventarios registrados'
      unit='inventarios'
      defaultPageSize={10}
      searchFields={['code', 'warehouse.name', 'client.full_name', 'location']}
      searchPlaceholder='Buscar por codigo, almacen, cliente o ubicacion…'
      emptyText='No se encontraron inventarios registrados.'
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
        <button type='button' className='vdt-btn-pri' onClick={openNewModal}>
          <i className='mdi mdi-plus'></i> Registrar inventario
        </button>
      </>}
      actions={(row) => [
        { icon: 'mdi mdi-pencil', title: 'Ver inventario', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => openExistingModal(r) },
        { icon: 'mdi mdi-delete', title: 'Eliminar inventario', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => remove(r.id) },
      ]}
      columns={[
        {
          key: 'codigo', label: 'Codigo', field: 'code', width: '150px', filter: { type: 'text' },
          render: (row) => (
            <a className='admin-grid-edit-link' style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => openExistingModal(row)} title='Ver inventario'>
              {row.code}
            </a>
          ),
        },
        { key: 'almacen', label: 'Almacen', field: 'warehouse.name', filter: { type: 'text', field: 'warehouse.name' } },
        { key: 'cliente', label: 'Cliente', field: 'client.full_name', filter: { type: 'text', field: 'client.full_name' } },
        { key: 'ubicacion', label: 'Ubicacion', field: 'location', filter: { type: 'text' } },
        {
          key: 'usuario', label: 'Usuario registro', field: 'creator.fullname', sortable: false,
          render: (row) => formatUser(row.creator),
        },
        {
          key: 'fecha', label: 'Fecha registro', field: 'created_at', width: '165px', nowrap: true,
          render: (row) => formatDateTime(row.created_at),
        },
        {
          key: 'estado', label: 'Estado', field: 'inventory_status', width: '145px',
          filter: { type: 'select', field: 'inventory_status', options: inventoryStatusOptions },
          render: (row) => inventoryStatusBadge(row.inventory_status),
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className='vdt-card' onClick={() => openExistingModal(row)}>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.code}</p>
              <small className='text-muted'>{[row.warehouse?.name, row.client?.full_name].filter(Boolean).join(' · ')}</small>
            </div>
            {inventoryStatusBadge(row.inventory_status)}
          </div>
          <small className='text-muted d-block mt-2'>{formatUser(row.creator)} · {formatDateTime(row.created_at)}</small>
          {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
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
        <VdSelect
          col='col-12 col-md-6 col-xl-2'
          label='Almacen'
          disabled={!!selectedCount}
          value={warehouseId}
          onChange={(value) => changeWarehouse(value)}
          options={[{ value: '', label: 'Seleccione Almacen' }, ...warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))]}
          placeholder='Seleccione Almacen'
        />
        <VdSelect
          col='col-12 col-md-6 col-xl-3'
          label='Ubicacion'
          disabled={!!selectedCount || !warehouseId || !clientId}
          value={location}
          onChange={(value) => setLocation(value)}
          options={[{ value: '', label: 'Seleccione ubicacion' }, ...filteredLocations.map(item => ({ value: item.location, label: item.location }))]}
          placeholder={warehouseId && clientId ? 'Seleccione ubicacion' : 'Seleccione almacen y cliente primero'}
        />
        <VdSelect
          col='col-12 col-xl-5'
          label='Cliente'
          required
          disabled={!!selectedCount}
          value={clientId}
          onChange={(value) => {
            setClientId(value)
            setLocation('')
          }}
          options={clients.map(client => ({ value: `${client.id}`, label: client.full_name }))}
          placeholder='Seleccione cliente'
        />
        <div className='col-12 col-xl-2 d-grid'>
          <button type='button' className='btn btn-outline-primary py-2 fw-semibold' disabled={!!selectedCount || !warehouseId || !clientId || loadingRows} onClick={refreshPreview}>
            <i className='mdi mdi-magnify me-1'></i>
            Filtrar
          </button>
        </div>
      </div>

      {previewRan && rows.length === 0 && !selectedCount && (
        <div className='alert alert-warning d-flex align-items-start gap-2 mb-3'>
          <i className='mdi mdi-alert-outline fs-4 lh-1'></i>
          <div>
            <strong>No hay articulos para inventariar con estos filtros.</strong>
            <div className='mt-1'>
              No se encontro stock para el cliente{selectedClientName ? <> <strong>{selectedClientName}</strong></> : null} en
              el almacen y ubicacion elegidos. Por eso los botones de Excel estan deshabilitados.
              Revisa los filtros o que el cliente tenga notas de entrada aprobadas.
            </div>
          </div>
        </div>
      )}

      <div className='d-flex flex-wrap gap-4 storage-inventory-toolbar'>
        <button
          type='button'
          className='btn btn-outline-success px-4'
          disabled={rows.length === 0}
          title={rows.length > 0
            ? 'Descargar el formato de conteo'
            : (previewRan ? 'No hay articulos para inventariar con estos filtros' : 'Filtra primero para descargar el formato')}
          onClick={downloadFormat}
        >
          Descargar Excel
        </button>
        <button
          type='button'
          className='btn btn-outline-success px-4'
          disabled={!selectedCount?.id || selectedCountApplied}
          title={selectedCountApplied
            ? 'Este inventario ya fue aplicado'
            : (!selectedCount?.id ? 'Pulsa "Registrar" antes de subir el conteo' : 'Subir el formato con el stock real')}
          onClick={() => fileRef.current?.click()}
        >
          Subir Excel
        </button>
      </div>

      <h3 className='storage-inventory-heading mb-4'>INVENTARIO Nro. {selectedCountCode}</h3>
      {selectedClientName && <div className='d-flex justify-content-end mb-2'><span className='badge badge-soft-secondary fs-14'>{selectedClientName}</span></div>}
      <div className='d-flex flex-wrap justify-content-between align-items-center gap-3 mb-2'>
        <label className='d-inline-flex align-items-center gap-2 mb-0'>
          Elementos:
          <div style={{ width: 90 }}>
            <VdSelect
              noMargin
              value={tablePageSize}
              onChange={(value) => setTablePageSize(Number(value))}
              options={[10, 25, 50, 100].map(size => ({ value: size, label: `${size}` }))}
            />
          </div>
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
