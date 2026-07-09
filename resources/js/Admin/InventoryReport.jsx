import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Swal from 'sweetalert2';
import InventoryReportRest from '../Actions/Admin/InventoryReportRest';

const inventoryReportRest = new InventoryReportRest()
const warehouseName = (warehouse) => `${warehouse?.name ?? ''}`.trim()
const uniqueWarehouseNameOptions = (warehouses = []) => {
  const grouped = new Map()

  warehouses.forEach(warehouse => {
    const name = warehouseName(warehouse)
    if (!name || warehouse?.id == null) return

    const key = name.toLocaleLowerCase('es-PE')
    const current = grouped.get(key)
    const ids = [...(current?.ids ?? []), `${warehouse.id}`]
    grouped.set(key, {
      ids,
      name: current?.name ?? name,
      value: ids.join(','),
    })
  })

  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name, 'es-PE'))
}

const formatQty = (value) => Number(value ?? 0).toFixed(3)
const formatMoney = (value) => Number(value ?? 0).toFixed(2)

const inventoryReportExportColumns = [
  ['Empresa', row => row.business_name ?? ''],
  ['Sede', row => row.branch_name ?? ''],
  ['Almacen', row => row.warehouse_name ?? ''],
  ['Codigo', row => row.article_code ?? ''],
  ['Descripcion', row => row.article_name ?? ''],
  ['Laboratorio', row => row.laboratory_name ?? ''],
  ['Unidad', row => row.unit_label ?? ''],
  ['Lote', row => row.batch_code ?? ''],
  ['Ubicacion', row => row.location ?? ''],
  ['Entradas', row => Number(row.qty_in ?? 0)],
  ['Salidas', row => Number(row.qty_out ?? 0)],
  ['Stock actual', row => Number(row.stock ?? 0)],
  ['Costo ref.', row => Number(row.reference_cost_unit ?? 0)],
  ['Valor total', row => Number(row.total_value ?? 0)],
  ['Estado', row => row.stock_state ?? ''],
]

const InventoryReport = ({ businessScopes = {}, businessScopeKey = 'kamary_peru' }) => {
  const tableRef = useRef()
  const [warehouses, setWarehouses] = useState([])
  const [laboratories, setLaboratories] = useState([])
  const [warehouseIds, setWarehouseIds] = useState('')
  const [laboratoryId, setLaboratoryId] = useState('')
  const [exporting, setExporting] = useState(false)
  const fixedBusinessLabel = (businessScopes?.[businessScopeKey] || 'KAMARY PERU').toUpperCase()
  const warehouseOptions = useMemo(() => uniqueWarehouseNameOptions(warehouses), [warehouses])
  const warehouseSelectOptions = useMemo(() => [
    { value: '', label: 'Todos' },
    ...warehouseOptions.map(row => ({ value: row.value, label: row.name })),
  ], [warehouseOptions])
  const laboratorySelectOptions = useMemo(() => [
    { value: '', label: 'Todos' },
    ...laboratories.map(item => ({ value: `${item.id}`, label: item.name })),
  ], [laboratories])

  useEffect(() => {
    inventoryReportRest.getInventoryOptions().then((options) => {
      setWarehouses((options?.warehouses ?? []).filter(row => row.status !== null))
      setLaboratories((options?.laboratories ?? []).filter(row => row.status !== null))
    })
  }, [])

  useEffect(() => {
    inventoryReportRest.setFilters({
      business_id: '',
      business_branch_id: '',
      warehouse_id: '',
      warehouse_ids: warehouseIds || '',
      laboratory_id: laboratoryId || '',
    })
    tableRef.current?.refresh()
  }, [warehouseIds, laboratoryId])

  const refresh = () => tableRef.current?.refresh()

  const exportInventoryReport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const rows = await tableRef.current?.loadAll()
      if (!rows?.length) {
        await Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay filas para exportar', confirmButtonText: 'Entendido' })
        return
      }

      if (window.ExcelJS && window.saveAs) {
        const workbook = new window.ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Inventario')
        worksheet.addRow(inventoryReportExportColumns.map(([label]) => label))
        rows.forEach(row => worksheet.addRow(inventoryReportExportColumns.map(([, value]) => value(row))))
        worksheet.columns.forEach(column => { column.width = 18 })
        const buffer = await workbook.xlsx.writeBuffer()
        window.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'reporte-inventario.xlsx')
        return
      }

      const csv = [
        inventoryReportExportColumns.map(([label]) => `"${label}"`).join(','),
        ...rows.map(row => inventoryReportExportColumns.map(([, value]) => `"${`${value(row) ?? ''}`.replaceAll('"', '""')}"`).join(',')),
      ].join('\n')
      window.saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'reporte-inventario.csv')
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: error?.message || 'No se pudo exportar el reporte', confirmButtonText: 'Entendido' })
    } finally {
      setExporting(false)
    }
  }

  return <div className='row'>
    <div className='col-12'>
      <div className='card mb-3'>
        <div className='card-body'>
          <div className='row'>
            <div className='col-md-4 mb-3'>
              <label className='form-label'>Empresa</label>
              <input className='form-control bg-light' value={fixedBusinessLabel} readOnly />
            </div>
            <VdSelect
              label='Almacen'
              col='col-md-4'
              value={warehouseIds}
              onChange={(value) => setWarehouseIds(value)}
              options={warehouseSelectOptions}
              placeholder='Todos'
            />
            <VdSelect
              label='Laboratorio'
              col='col-md-4'
              value={laboratoryId}
              onChange={(value) => setLaboratoryId(value)}
              options={laboratorySelectOptions}
              placeholder='Todos'
            />
          </div>
        </div>
      </div>
    </div>
    <div className='col-12'>
      <VdTable
        ref={tableRef}
        rest={inventoryReportRest}
        icon='mdi mdi-clipboard-text-outline'
        title='Reporte de inventario'
        unit='registros'
        defaultPageSize={25}
        searchFields={['business_name', 'branch_name', 'warehouse_name', 'article_code', 'article_name', 'laboratory_name', 'batch_code', 'location']}
        searchPlaceholder='Buscar por codigo, producto, laboratorio, lote o ubicacion…'
        emptyText='No se encontraron registros de inventario.'
        headerActions={<>
          <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={refresh}>
            <i className='mdi mdi-refresh'></i>
          </button>
          <button type='button' className='vdt-btn-soft' disabled={exporting} onClick={exportInventoryReport}>
            <i className={`mdi ${exporting ? 'mdi-loading mdi-spin' : 'mdi-file-excel'}`}></i> Exportar
          </button>
        </>}
        columns={[
          { key: 'empresa', label: 'Empresa', field: 'business_name', filter: { type: 'text' } },
          { key: 'sede', label: 'Sede', field: 'branch_name', filter: { type: 'text' } },
          { key: 'almacen', label: 'Almacen', field: 'warehouse_name', filter: { type: 'text' } },
          { key: 'codigo', label: 'Codigo', field: 'article_code', filter: { type: 'text' } },
          { key: 'descripcion', label: 'Descripcion', field: 'article_name', filter: { type: 'text' } },
          { key: 'laboratorio', label: 'Laboratorio', field: 'laboratory_name', filter: { type: 'text' } },
          { key: 'unidad', label: 'Unidad', field: 'unit_label', width: '90px', filter: { type: 'text' } },
          { key: 'lote', label: 'Lote', field: 'batch_code', filter: { type: 'text' } },
          { key: 'ubicacion', label: 'Ubicacion', field: 'location', filter: { type: 'text' } },
          {
            key: 'entradas', label: 'Entradas', field: 'qty_in', width: '100px', align: 'right', nowrap: true,
            filter: { type: 'number' },
            render: (row) => formatQty(row.qty_in),
          },
          {
            key: 'salidas', label: 'Salidas', field: 'qty_out', width: '100px', align: 'right', nowrap: true,
            filter: { type: 'number' },
            render: (row) => formatQty(row.qty_out),
          },
          {
            key: 'stock', label: 'Stock actual', field: 'stock', width: '110px', align: 'right', nowrap: true,
            filter: { type: 'number' },
            render: (row) => formatQty(row.stock),
          },
          {
            key: 'costo_ref', label: 'Costo ref.', field: 'reference_cost_unit', width: '110px', align: 'right', nowrap: true,
            filter: { type: 'number' },
            render: (row) => formatMoney(row.reference_cost_unit),
          },
          {
            key: 'valor_total', label: 'Valor total', field: 'total_value', width: '120px', align: 'right', nowrap: true,
            filter: { type: 'number' },
            render: (row) => formatMoney(row.total_value),
          },
          {
            key: 'estado', label: 'Estado', field: 'stock_state', width: '100px',
            filter: { type: 'text' },
            render: (row) => {
              const state = row.stock_state ?? ''
              const withStock = state === 'Con stock'
              return <span className={`badge ${withStock ? 'badge-soft-success' : 'badge-soft-secondary'}`}>{state || '-'}</span>
            },
          },
        ]}
        renderCard={(row) => (
          <div className='vdt-card'>
            <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.article_name}</p>
                <small className='text-muted'>{[row.article_code, row.laboratory_name].filter(Boolean).join(' · ')}</small>
              </div>
              <span className={`badge ${row.stock_state === 'Con stock' ? 'badge-soft-success' : 'badge-soft-secondary'}`}>{row.stock_state || '-'}</span>
            </div>
            <small className='text-muted d-block mt-2'>{[row.business_name, row.branch_name, row.warehouse_name].filter(Boolean).join(' · ')}</small>
            {(row.batch_code || row.location) && (
              <small className='text-muted d-block mt-1'>{[row.batch_code && `Lote ${row.batch_code}`, row.location].filter(Boolean).join(' · ')}</small>
            )}
            <div className='d-flex flex-wrap mt-2' style={{ gap: 12 }}>
              <small className='text-muted'>Entradas: <b>{formatQty(row.qty_in)}</b></small>
              <small className='text-muted'>Salidas: <b>{formatQty(row.qty_out)}</b></small>
              <small className='text-muted'>Stock: <b>{formatQty(row.stock)}</b></small>
            </div>
            <div className='d-flex flex-wrap mt-1' style={{ gap: 12 }}>
              <small className='text-muted'>Costo ref.: <b>{formatMoney(row.reference_cost_unit)}</b></small>
              <small className='text-muted'>Valor total: <b>{formatMoney(row.total_value)}</b></small>
            </div>
          </div>
        )}
      />
    </div>
  </div>
}

CreateReactScript((el, properties) => {
  if (!properties.can('inventory') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Reporte de inventario'><InventoryReport {...properties} /></BaseAdminto>)
})
