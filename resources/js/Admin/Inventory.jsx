import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
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

// El conteo se escribe en la tabla, celda por celda. Una linea "contada" es la que ya tiene stock
// real escrito; las demas se ignoran al aplicar para no descontar lo que nadie llego a contar.
const cleanLocation = (value) => `${value ?? ''}`.trim().toLocaleLowerCase('es-PE')
const isRelocated = (row) => cleanLocation(row?.system_location) !== cleanLocation(row?.location)
const isCounted = (row) => !!row?.counted
const hasRowChanges = (row) => Math.abs(Number(row?.difference || 0)) > 0.0001 || isRelocated(row)

// Lo escrito en la tabla vive en memoria hasta pulsar "Grabar". Guardar celda por celda obligaba a
// esperar al servidor en cada dato y no encaja con contar un almacen entero de corrido.
const draftLocation = (row, drafts) => drafts[row.id]?.location ?? row.location ?? ''
const draftRealStock = (row, drafts) => {
  const draft = drafts[row.id]
  if (draft && draft.real_stock !== undefined) return draft.real_stock
  return isCounted(row) ? Number(row.real_stock ?? 0) : null
}
const draftDifference = (row, drafts) => {
  const real = draftRealStock(row, drafts)
  if (real === null) return null
  return Math.round((real - Number(row.system_stock ?? 0)) * 1000) / 1000
}
const isDirtyField = (row, drafts, field) => drafts[row.id]?.[field] !== undefined

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
  system_location: item.system_location ?? item.location ?? '',
  temperature_range: item.temperature_range ?? '',
  system_stock: Number(item.system_stock ?? 0),
  real_stock: Number(item.real_stock ?? 0),
  counted: !!item.counted,
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
  system_location: item.system_location ?? item.location ?? '',
  system_stock: Number(item.system_stock ?? 0),
  real_stock: Number(item.real_stock ?? 0),
  counted: !!item.counted,
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
// Resumen de lo que se va a ajustar, para confirmar con datos y no a ciegas.
const applyConfirmHtml = (rows = []) => {
  const counted = rows.filter(isCounted)
  const pending = rows.length - counted.length
  const movidas = counted.filter(isRelocated)
  const ajustadas = counted.filter(row => !isRelocated(row))
  const faltan = ajustadas.filter(row => Number(row.difference || 0) < -0.0001)
  const sobran = ajustadas.filter(row => Number(row.difference || 0) > 0.0001)
  const total = (list) => list.reduce((sum, row) => sum + Math.abs(Number(row.difference || 0)), 0)
  return `Se ajustara el stock para que quede igual a lo que contaste:`
    + `<div class="mt-2 text-start" style="display:inline-block">`
    + `<div>&bull; <b>${faltan.length}</b> linea(s) con <b>faltante</b> (salen ${formatQty(total(faltan))} unidades)</div>`
    + `<div>&bull; <b>${sobran.length}</b> linea(s) con <b>sobrante</b> (entran ${formatQty(total(sobran))} unidades)</div>`
    + (movidas.length ? `<div>&bull; <b>${movidas.length}</b> linea(s) cambian de <b>ubicacion</b>: sale todo de la ubicacion anterior y entra lo contado en la nueva</div>` : '')
    + (pending ? `<div class="text-muted">&bull; <b>${pending}</b> linea(s) sin contar se quedan como estan</div>` : '')
    + `</div>`
    + `<div class="mt-2 text-muted" style="font-size:13px">Se generaran notas de entrada y salida por esos movimientos. Quedan registradas en el kardex.</div>`
}

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

// Celda que se edita con un click. Lo escrito queda en memoria hasta que se pulsa "Grabar", asi
// que se marca con un punto para que se vea de un vistazo que hay algo sin guardar. Cuando todavia
// no se puede editar no se apaga: responde igual y explica que falta.
const EditableCell = ({ value, display, type = 'text', editable, blockedReason, listId, placeholder, dirty, options = null, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const cancelled = useRef(false)

  const original = `${value ?? ''}`

  const startEditing = async () => {
    if (!editable) {
      await Swal.fire({ icon: 'info', title: 'Aun no se puede editar', text: blockedReason, confirmButtonText: 'Entendido' })
      return
    }
    cancelled.current = false
    setDraft(original)
    setEditing(true)
  }

  const commit = () => {
    setEditing(false)
    if (cancelled.current) {
      cancelled.current = false
      return
    }
    if (draft.trim() === original.trim()) return
    onSave(draft)
  }

  // Con `options` la celda obliga a elegir del catalogo (Almacenamiento, donde la ubicacion es un
  // dato controlado y el backend rechaza lo que no existe). Sin `options` queda como texto libre
  // con sugerencias via `listId`, que es como se usa en Kamary Peru.
  if (editing && options) {
    return <select
      autoFocus
      className='form-select form-select-sm'
      value={draft}
      onChange={(e) => {
        const next = e.target.value
        setDraft(next)
        setEditing(false)
        if (next.trim() !== original.trim()) onSave(next)
      }}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => { if (e.key === 'Escape') { cancelled.current = true; e.currentTarget.blur() } }}
    >
      <option value=''>-- Sin ubicacion --</option>
      {options.map(option => <option key={`loc-${option}`} value={option}>{option}</option>)}
    </select>
  }

  if (editing) {
    return <input
      autoFocus
      className='form-control form-control-sm'
      type={type}
      list={listId}
      placeholder={placeholder}
      min={type === 'number' ? 0 : undefined}
      step={type === 'number' ? 'any' : undefined}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
        if (e.key === 'Escape') { cancelled.current = true; e.currentTarget.blur() }
      }}
    />
  }

  return <span
    className={`inventory-editable-cell ${editable ? '' : 'is-locked'} ${dirty ? 'is-dirty' : ''}`}
    title={editable ? (dirty ? 'Sin grabar. Click para editar' : 'Click para editar') : blockedReason}
    onClick={startEditing}
  >
    <span>{display}</span>
    {dirty
      ? <i className='mdi mdi-circle inventory-dirty-dot' title='Sin grabar'></i>
      : <i className='mdi mdi-pencil-outline inventory-editable-icon'></i>}
  </span>
}

const StandardInventory = ({ moduleTitle = 'Inventario Kamary Peru', businessScopes = {}, businessScopeKey = 'kamary_peru' }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const [warehouses, setWarehouses] = useState([])
  const [laboratories, setLaboratories] = useState([])
  const [locations, setLocations] = useState([])
  const [filterWarehouseIds, setFilterWarehouseIds] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [laboratoryId, setLaboratoryId] = useState('')
  const [rows, setRows] = useState([])
  const [selectedCount, setSelectedCount] = useState(null)
  const [loadingRows, setLoadingRows] = useState(false)
  // Distingue "todavia no generaste el listado" de "lo generaste y no habia nada": sin esto la
  // pantalla quedaba vacia sin explicacion y parecia rota.
  const [previewRan, setPreviewRan] = useState(false)
  const [drafts, setDrafts] = useState({})
  const [savingCount, setSavingCount] = useState(false)
  const [tablePageSize, setTablePageSize] = useState(10)
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const draftsRef = useRef({})

  useEffect(() => {
    draftsRef.current = drafts
  }, [drafts])

  useEffect(() => {
    inventoryRest.getStandardOptions().then(data => {
      setWarehouses(data?.warehouses ?? [])
      setLaboratories(data?.laboratories ?? [])
      setLocations(data?.locations ?? [])
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
  const selectedCountApplied = selectedCount?.inventory_status === 'Aplicado'
  // Recien registrado, todas las lineas valen 0 y "parecen" diferencias. Aplicar en ese punto
  // vaciaria el almacen, asi que solo cuentan las lineas donde ya se escribio el stock real.
  const countedRows = useMemo(() => rows.filter(isCounted), [rows])
  const hasCountedRows = !!selectedCount?.id && countedRows.length > 0
  const hasSelectedDifferences = countedRows.some(hasRowChanges)
  // Se puede escribir apenas hay listado, sin registrar antes: "Grabar" crea el inventario y guarda
  // el conteo de una vez, para no obligar a dos pasos por lo mismo.
  const canEditCount = rows.length > 0 && !selectedCountApplied
  const editBlockedReason = 'Este inventario ya fue aplicado, el conteo no se puede modificar.'
  const dirtyCount = Object.keys(drafts).length
  const locationSuggestions = useMemo(() => {
    const seen = new Set()
    return locations
      .filter(item => !warehouseId || `${item.warehouse_id}` === `${warehouseId}`)
      .map(item => `${item.code ?? ''}`.trim())
      .filter(code => {
        if (!code || seen.has(code)) return false
        seen.add(code)
        return true
      })
  }, [locations, warehouseId])

  const tablePageCount = Math.max(1, Math.ceil(filteredRows.length / tablePageSize))
  const currentTablePage = Math.min(tablePage, tablePageCount)
  const paginatedRows = filteredRows.slice((currentTablePage - 1) * tablePageSize, currentTablePage * tablePageSize)

  // Ojo: no se resetea la pagina cuando cambian `rows`. Grabar reemplaza las filas con las que
  // devuelve el servidor y volver a la pagina 1 en pleno conteo seria insufrible.
  useEffect(() => {
    setTablePage(1)
  }, [tablePageSize, tableSearch])

  // Cerrar con el conteo a medias perderia todo lo escrito, asi que se avisa antes.
  useEffect(() => {
    const element = modalRef.current
    if (!element) return
    const onHide = (event) => {
      if (Object.keys(draftsRef.current).length === 0) return
      event.preventDefault()
      Swal.fire({
        icon: 'warning',
        title: 'Tienes el conteo sin grabar',
        text: 'Si cierras ahora se pierde lo que escribiste en la tabla.',
        showCancelButton: true,
        confirmButtonText: 'Salir sin grabar',
        cancelButtonText: 'Seguir contando',
      }).then(({ isConfirmed }) => {
        if (!isConfirmed) return
        draftsRef.current = {}
        setDrafts({})
        $(element).modal('hide')
      })
    }
    $(element).on('hide.bs.modal', onHide)
    return () => $(element).off('hide.bs.modal', onHide)
  }, [])

  const resetModal = (nextWarehouseId = '') => {
    setSelectedCount(null)
    setWarehouseId(nextWarehouseId)
    setLaboratoryId('')
    setRows([])
    setDrafts({})
    draftsRef.current = {}
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
    setDrafts({})
    draftsRef.current = {}
    setTableSearch('')
    setTablePage(1)
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
    setDrafts({})
    draftsRef.current = {}
    setPreviewRan(true)
    setTablePage(1)
    setLoadingRows(false)
  }

  // Anota el dato en el borrador. Nada viaja al servidor hasta pulsar "Grabar".
  const editCell = async (row, field, rawValue) => {
    if (!row?.id) return

    let value
    if (field === 'real_stock') {
      const text = `${rawValue ?? ''}`.replace(',', '.').trim()
      if (text === '') return
      value = Number(text)
      if (!Number.isFinite(value) || value < 0) {
        await Swal.fire({ icon: 'warning', title: 'Cantidad invalida', text: 'El stock real debe ser un numero mayor o igual a 0.', confirmButtonText: 'Entendido' })
        return
      }
    } else {
      value = `${rawValue ?? ''}`.trim()
    }

    setDrafts(current => ({ ...current, [row.id]: { ...current[row.id], [field]: value } }))
  }

  // Traduce el borrador a lineas para el servidor. Si el inventario se acaba de crear, las filas
  // del listado tienen ids 1..N y hay que emparejarlas con los items reales por su source_key.
  const draftLines = (count, wasRegistered) => {
    const items = count?.items ?? []
    const idBySource = new Map(items.filter(item => item.source_key).map(item => [`${item.source_key}`, item.id]))

    return Object.entries(drafts).map(([rowId, changes]) => {
      if (wasRegistered) return { id: Number(rowId), ...changes }
      const index = rows.findIndex(row => `${row.id}` === `${rowId}`)
      const row = rows[index]
      const id = idBySource.get(`${row?.source_key ?? ''}`) ?? items[index]?.id
      return id ? { id, ...changes } : null
    }).filter(Boolean)
  }

  const saveCount = async () => {
    if (rows.length === 0) {
      await Swal.fire({ icon: 'info', title: 'No hay nada que grabar', text: 'Genera el listado del almacen antes de grabar el inventario.', confirmButtonText: 'Entendido' })
      return
    }

    setSavingCount(true)
    const wasRegistered = !!selectedCount?.id
    let count = selectedCount

    if (!wasRegistered) {
      count = await inventoryRest.saveStandardInventory({
        warehouse_id: warehouseId || null,
        laboratory_id: laboratoryId || null,
      })
      if (!count) { setSavingCount(false); return }
      setSelectedCount(count)
      setRows((count.items ?? []).map(mapStandardItem))
    }

    const lines = draftLines(count, wasRegistered)
    let result = count
    if (lines.length > 0) {
      result = await inventoryRest.saveStandardItems(count.id, lines)
      // Si falla el conteo, el inventario ya quedo creado: se conserva y se dejan los borradores
      // para que el usuario reintente sin volver a escribir todo.
      if (!result) { setSavingCount(false); tableRef.current?.refresh(); return }
    }

    setSelectedCount(result)
    setRows((result.items ?? []).map(mapStandardItem))
    setDrafts({})
    draftsRef.current = {}
    setSavingCount(false)
    tableRef.current?.refresh()
  }

  const applyInventory = async () => {
    if (!selectedCount?.id) return
    if (dirtyCount > 0) {
      await Swal.fire({ icon: 'info', title: 'Falta grabar', text: 'Pulsa "Grabar inventario" antes de aplicar: hay datos escritos que todavia no se guardaron.', confirmButtonText: 'Entendido' })
      return
    }
    if (!hasCountedRows) {
      await Swal.fire({ icon: 'info', title: 'Falta contar', text: 'Escribe el stock real de al menos una linea antes de aplicar el inventario.', confirmButtonText: 'Entendido' })
      return
    }
    const { isConfirmed } = await Swal.fire({
      title: 'Aplicar inventario',
      html: applyConfirmHtml(rows),
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
        .inventory-count-hint {
          background: #eef4ff;
          border-radius: 6px;
          color: #30384d;
          font-size: .82rem;
          margin-bottom: 1.25rem;
          padding: .7rem .9rem;
        }
        .inventory-editable-cell {
          align-items: center;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          gap: .35rem;
          min-height: 26px;
          padding: 2px 6px;
          transition: background-color .15s ease;
        }
        .inventory-editable-cell:hover {
          background: #e7f0ff;
        }
        .inventory-editable-cell .inventory-editable-icon {
          color: #98a2b3;
          font-size: .85rem;
          opacity: 0;
        }
        .inventory-editable-cell:hover .inventory-editable-icon {
          opacity: 1;
        }
        .inventory-editable-cell.is-locked {
          cursor: help;
        }
        .inventory-editable-cell.is-locked:hover {
          background: #f1f1f5;
        }
        .inventory-editable-cell.is-dirty {
          background: #fff6e5;
          font-weight: 600;
        }
        .inventory-dirty-dot {
          color: #f5a623;
          font-size: .5rem;
        }
        .inventory-pending-cell {
          color: #98a2b3;
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
      <div className='d-flex flex-wrap justify-content-center align-items-center gap-3 storage-inventory-modal-actions'>
        {rows.length > 0 && !selectedCountApplied && <button type='button' className='btn btn-primary' disabled={savingCount} onClick={saveCount}>
          {savingCount
            ? <><i className='mdi mdi-spin mdi-loading me-1'></i>Grabando…</>
            : <><i className='mdi mdi-content-save-outline me-1'></i>Grabar inventario</>}
        </button>}
        {dirtyCount > 0 && <span className='badge badge-soft-warning fs-13'>
          <i className='mdi mdi-circle me-1' style={{ fontSize: '.5rem' }}></i>
          {dirtyCount} linea(s) sin grabar
        </span>}
        <button type='button' className='btn btn-light' data-bs-dismiss='modal'>
          <i className='mdi mdi-close me-1'></i>
          Cerrar
        </button>
        {hasCountedRows && !selectedCountApplied && hasSelectedDifferences && <button type="button" className="btn btn-success" onClick={applyInventory}>
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
            <strong>Este almacen todavia no tiene stock que inventariar.</strong>
            <div className='mt-1'>
              No se encontro nada en <strong>{selectedWarehouseName || 'el almacen seleccionado'}</strong>
              {selectedLaboratoryName ? <> con el laboratorio <strong>{selectedLaboratoryName}</strong></> : null}.
            </div>
            <div className='mt-2'>
              Esta pantalla <strong>cuenta</strong> stock que ya existe; para <strong>ingresarlo</strong> registra una nota de entrada.
            </div>
            <div className='mt-3'>
              <a className='btn btn-sm btn-primary' href='/admin/entry-note'>
                <i className='mdi mdi-file-document-plus-outline me-1'></i>Ir a Notas de entrada
              </a>
            </div>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className='inventory-count-hint'>
          <i className='mdi mdi-cursor-default-click-outline me-1'></i>
          {canEditCount
            ? <>Haz click en <strong>UBICACION</strong> o <strong>STOCK REAL</strong> para escribir el conteo y pulsa <strong>Grabar inventario</strong> cuando termines. Las lineas que dejes sin contar no se tocan al aplicar.</>
            : <>Este inventario ya fue aplicado: el conteo queda como historico y no se puede modificar.</>}
        </div>
      )}

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
        <datalist id='standard-inventory-locations'>
          {locationSuggestions.map(option => <option key={`standard-loc-${option}`} value={option} />)}
        </datalist>
        <table className='table table-sm table-striped mb-0 storage-inventory-table'>
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th style={{ minWidth: 120 }}>CODIGO LOTE</th>
              <th style={{ minWidth: 130 }}>CODIGO</th>
              <th style={{ minWidth: 260 }}>NOMBRE</th>
              <th style={{ minWidth: 180 }}>LABORATORIO</th>
              <th style={{ minWidth: 100 }}>U. MEDIDA</th>
              <th style={{ minWidth: 120 }}>UBICACION <i className='mdi mdi-information-outline text-muted' title='Opcional. Sugiere las ubicaciones registradas del almacen, pero se puede escribir cualquier texto.'></i></th>
              <th style={{ minWidth: 130 }}>STOCK SISTEMA</th>
              <th style={{ minWidth: 120 }}>STOCK REAL</th>
              <th style={{ minWidth: 120 }}>DIFERENCIA</th>
              <th style={{ minWidth: 120 }}>COSTO UNIT.</th>
              <th style={{ minWidth: 120 }}>TOTAL VAL.</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && <tr><td colSpan='12' className='text-center py-4'>No existen elementos</td></tr>}
            {/* En Kamary Peru la ubicacion es una ayuda de gestion, no un dato controlado: se puede
                escribir libre y esta lista solo sugiere las que ya estan registradas. El control
                estricto contra el catalogo vive en Almacenamiento, que si lo necesita. */}
            {paginatedRows.map((row, index) => {
              const location = draftLocation(row, drafts)
              const realStock = draftRealStock(row, drafts)
              const difference = draftDifference(row, drafts)
              return <tr key={`standard-inventory-detail-${row.id ?? index}`}>
                <td>{row.id ?? index + 1}</td>
                <td>{row.lot || '-'}</td>
                <td>{row.article_code || '-'}</td>
                <td>{row.article_name || '-'}</td>
                <td>{row.laboratory_name || '-'}</td>
                <td>{row.unit_label || '-'}</td>
                <td>
                  <EditableCell
                    value={location}
                    display={location || <span className='inventory-pending-cell'>Sin ubicacion</span>}
                    editable={canEditCount}
                    blockedReason={editBlockedReason}
                    listId='standard-inventory-locations'
                    placeholder='Ubicacion'
                    dirty={isDirtyField(row, drafts, 'location')}
                    onSave={(value) => editCell(row, 'location', value)}
                  />
                </td>
                <td>{formatQty(row.system_stock)}</td>
                <td>
                  <EditableCell
                    type='number'
                    value={realStock ?? ''}
                    display={realStock === null ? <span className='inventory-pending-cell'>Sin contar</span> : formatQty(realStock)}
                    editable={canEditCount}
                    blockedReason={editBlockedReason}
                    placeholder='0'
                    dirty={isDirtyField(row, drafts, 'real_stock')}
                    onSave={(value) => editCell(row, 'real_stock', value)}
                  />
                </td>
                <td className={difference === null || difference === 0 ? '' : (difference > 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold')}>
                  {difference === null ? <span className='inventory-pending-cell'>-</span> : formatQty(difference)}
                </td>
                <td>{formatMoney(row.cost_unit)}</td>
                <td>{formatMoney(row.total_cost)}</td>
              </tr>
            })}
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
  const [drafts, setDrafts] = useState({})
  const [savingCount, setSavingCount] = useState(false)
  const [tablePageSize, setTablePageSize] = useState(10)
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const draftsRef = useRef({})

  useEffect(() => {
    draftsRef.current = drafts
  }, [drafts])

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
  const selectedCountApplied = selectedCount?.inventory_status === 'Aplicado'
  // Recien registrado, todas las lineas valen 0 y "parecen" diferencias. Aplicar en ese punto
  // vaciaria el stock del cliente, asi que solo cuentan las lineas con stock real escrito.
  const countedRows = useMemo(() => rows.filter(isCounted), [rows])
  const hasCountedRows = !!selectedCount?.id && countedRows.length > 0
  const hasSelectedDifferences = countedRows.some(hasRowChanges)
  // Se puede escribir apenas hay listado, sin registrar antes: "Grabar" crea el inventario y guarda
  // el conteo de una vez, para no obligar a dos pasos por lo mismo.
  const canEditCount = rows.length > 0 && !selectedCountApplied
  const editBlockedReason = 'Este inventario ya fue aplicado, el conteo no se puede modificar.'
  const dirtyCount = Object.keys(drafts).length
  const tablePageCount = Math.max(1, Math.ceil(filteredRows.length / tablePageSize))
  const currentTablePage = Math.min(tablePage, tablePageCount)
  const paginatedRows = filteredRows.slice((currentTablePage - 1) * tablePageSize, currentTablePage * tablePageSize)
  const filteredLocations = useMemo(() => locations.filter(item => {
    if (!warehouseId || !clientId) return false
    return `${item.warehouse_id}` === `${warehouseId}`
      && `${item.client_id ?? ''}` === `${clientId}`
  }), [locations, warehouseId, clientId])
  // Para editar la ubicacion en la tabla basta con que la posicion sea del cliente del inventario:
  // el filtro de almacen de la cabecera puede venir vacio y aun asi hay que poder corregirla.
  const locationSuggestions = useMemo(() => {
    const countClientId = selectedCount?.client_id ?? clientId
    const countWarehouseId = selectedCount?.warehouse_id ?? warehouseId
    const seen = new Set()
    return locations
      .filter(item => !countClientId || `${item.client_id ?? ''}` === `${countClientId}`)
      .filter(item => !countWarehouseId || `${item.warehouse_id ?? ''}` === `${countWarehouseId}`)
      .map(item => `${item.location ?? ''}`.trim())
      .filter(code => {
        if (!code || seen.has(code)) return false
        seen.add(code)
        return true
      })
  }, [locations, selectedCount, clientId, warehouseId])

  // La ubicacion guardada puede no estar en el catalogo (se dio de baja, o venia de antes). Se
  // agrega a la lista para que abrir el select no la borre en silencio.
  const locationOptionsFor = (current) => {
    const actual = `${current ?? ''}`.trim()
    if (!actual || locationSuggestions.includes(actual)) return locationSuggestions
    return [actual, ...locationSuggestions]
  }

  const changeWarehouse = (value) => {
    setWarehouseId(value)
    setLocation('')
  }

  // Ojo: no se resetea la pagina cuando cambian `rows`. Grabar reemplaza las filas con las que
  // devuelve el servidor y volver a la pagina 1 en pleno conteo seria insufrible.
  useEffect(() => {
    setTablePage(1)
  }, [tablePageSize, tableSearch])

  // Cerrar con el conteo a medias perderia todo lo escrito, asi que se avisa antes.
  useEffect(() => {
    const element = modalRef.current
    if (!element) return
    const onHide = (event) => {
      if (Object.keys(draftsRef.current).length === 0) return
      event.preventDefault()
      Swal.fire({
        icon: 'warning',
        title: 'Tienes el conteo sin grabar',
        text: 'Si cierras ahora se pierde lo que escribiste en la tabla.',
        showCancelButton: true,
        confirmButtonText: 'Salir sin grabar',
        cancelButtonText: 'Seguir contando',
      }).then(({ isConfirmed }) => {
        if (!isConfirmed) return
        draftsRef.current = {}
        setDrafts({})
        $(element).modal('hide')
      })
    }
    $(element).on('hide.bs.modal', onHide)
    return () => $(element).off('hide.bs.modal', onHide)
  }, [])

  const resetModal = () => {
    setSelectedCount(null)
    setWarehouseId('')
    setLocation('')
    setClientId('')
    setRows([])
    setDrafts({})
    draftsRef.current = {}
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
    setDrafts({})
    draftsRef.current = {}
    setTableSearch('')
    setTablePage(1)
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
    setDrafts({})
    draftsRef.current = {}
    setPreviewRan(true)
    setTablePage(1)
    setLoadingRows(false)
  }

  // Anota el dato en el borrador. Nada viaja al servidor hasta pulsar "Grabar".
  const editCell = async (row, field, rawValue) => {
    if (!row?.id) return

    let value
    if (field === 'real_stock') {
      const text = `${rawValue ?? ''}`.replace(',', '.').trim()
      if (text === '') return
      value = Number(text)
      if (!Number.isFinite(value) || value < 0) {
        await Swal.fire({ icon: 'warning', title: 'Cantidad invalida', text: 'El stock real debe ser un numero mayor o igual a 0.', confirmButtonText: 'Entendido' })
        return
      }
    } else {
      value = `${rawValue ?? ''}`.trim()
    }

    setDrafts(current => ({ ...current, [row.id]: { ...current[row.id], [field]: value } }))
  }

  // Traduce el borrador a lineas para el servidor. Si el inventario se acaba de crear, las filas
  // del listado tienen ids 1..N y hay que emparejarlas con los items reales por su source_key.
  const draftLines = (count, wasRegistered) => {
    const items = count?.items ?? []
    const idBySource = new Map(items.filter(item => item.source_key).map(item => [`${item.source_key}`, item.id]))

    return Object.entries(drafts).map(([rowId, changes]) => {
      if (wasRegistered) return { id: Number(rowId), ...changes }
      const index = rows.findIndex(row => `${row.id}` === `${rowId}`)
      const row = rows[index]
      const id = idBySource.get(`${row?.source_key ?? ''}`) ?? items[index]?.id
      return id ? { id, ...changes } : null
    }).filter(Boolean)
  }

  const saveCount = async () => {
    if (rows.length === 0) {
      await Swal.fire({ icon: 'info', title: 'No hay nada que grabar', text: 'Pulsa "Filtrar" para cargar el listado antes de grabar el inventario.', confirmButtonText: 'Entendido' })
      return
    }

    setSavingCount(true)
    const wasRegistered = !!selectedCount?.id
    let count = selectedCount

    if (!wasRegistered) {
      count = await inventoryRest.saveStorageInventory({
        warehouse_id: warehouseId || null,
        location: location || null,
        client_id: clientId || null,
      })
      if (!count) { setSavingCount(false); return }
      setSelectedCount(count)
      setRows((count.items ?? []).map(mapStoredItem))
    }

    const lines = draftLines(count, wasRegistered)
    let result = count
    if (lines.length > 0) {
      result = await inventoryRest.saveStorageItems(count.id, lines)
      // Si falla el conteo, el inventario ya quedo creado: se conserva y se dejan los borradores
      // para que el usuario reintente sin volver a escribir todo.
      if (!result) { setSavingCount(false); tableRef.current?.refresh(); return }
    }

    setSelectedCount(result)
    setRows((result.items ?? []).map(mapStoredItem))
    setDrafts({})
    draftsRef.current = {}
    setSavingCount(false)
    tableRef.current?.refresh()
  }

  const applyInventory = async () => {
    if (!selectedCount?.id) return
    if (dirtyCount > 0) {
      await Swal.fire({ icon: 'info', title: 'Falta grabar', text: 'Pulsa "Grabar inventario" antes de aplicar: hay datos escritos que todavia no se guardaron.', confirmButtonText: 'Entendido' })
      return
    }
    if (!hasCountedRows) {
      await Swal.fire({ icon: 'info', title: 'Falta contar', text: 'Escribe el stock real de al menos una linea antes de aplicar el inventario.', confirmButtonText: 'Entendido' })
      return
    }
    const { isConfirmed } = await Swal.fire({
      title: 'Aplicar inventario',
      html: applyConfirmHtml(rows),
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
        .inventory-count-hint {
          background: #eef4ff;
          border-radius: 6px;
          color: #30384d;
          font-size: .82rem;
          margin-bottom: 1.25rem;
          padding: .7rem .9rem;
        }
        .inventory-editable-cell {
          align-items: center;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          gap: .35rem;
          min-height: 26px;
          padding: 2px 6px;
          transition: background-color .15s ease;
        }
        .inventory-editable-cell:hover {
          background: #e7f0ff;
        }
        .inventory-editable-cell .inventory-editable-icon {
          color: #98a2b3;
          font-size: .85rem;
          opacity: 0;
        }
        .inventory-editable-cell:hover .inventory-editable-icon {
          opacity: 1;
        }
        .inventory-editable-cell.is-locked {
          cursor: help;
        }
        .inventory-editable-cell.is-locked:hover {
          background: #f1f1f5;
        }
        .inventory-editable-cell.is-dirty {
          background: #fff6e5;
          font-weight: 600;
        }
        .inventory-dirty-dot {
          color: #f5a623;
          font-size: .5rem;
        }
        .inventory-pending-cell {
          color: #98a2b3;
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
      <div className='d-flex flex-wrap justify-content-center align-items-center gap-3 storage-inventory-modal-actions'>
        {rows.length > 0 && !selectedCountApplied && <button type='button' className='btn btn-primary' disabled={savingCount} onClick={saveCount}>
          {savingCount
            ? <><i className='mdi mdi-spin mdi-loading me-1'></i>Grabando…</>
            : <><i className='mdi mdi-content-save-outline me-1'></i>Grabar inventario</>}
        </button>}
        {dirtyCount > 0 && <span className='badge badge-soft-warning fs-13'>
          <i className='mdi mdi-circle me-1' style={{ fontSize: '.5rem' }}></i>
          {dirtyCount} linea(s) sin grabar
        </span>}
        <button type='button' className='btn btn-light' data-bs-dismiss='modal'>
          <i className='mdi mdi-close me-1'></i>
          Cerrar
        </button>
        {hasCountedRows && !selectedCountApplied && hasSelectedDifferences && <button type="button" className="btn btn-success" onClick={applyInventory}>
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
            <strong>Este cliente todavia no tiene stock que inventariar.</strong>
            <div className='mt-1'>
              No se encontro stock para{selectedClientName ? <> <strong>{selectedClientName}</strong></> : ' el cliente'} en
              el almacen y ubicacion elegidos.
            </div>
            <div className='mt-2'>
              Esta pantalla <strong>cuenta</strong> stock que ya existe; para <strong>ingresarlo</strong> usa los pasos de abajo.
            </div>
            <div className='d-flex flex-wrap gap-2 mt-3'>
              <a className='btn btn-sm btn-primary' href='/admin/storage-products'>
                <i className='mdi mdi-package-variant me-1'></i>1. Registrar productos del cliente
              </a>
              <a className='btn btn-sm btn-outline-primary' href='/admin/storage-entry-note'>
                <i className='mdi mdi-file-document-plus-outline me-1'></i>2. Registrar nota de entrada
              </a>
            </div>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className='inventory-count-hint'>
          <i className='mdi mdi-cursor-default-click-outline me-1'></i>
          {canEditCount
            ? <>Haz click en <strong>UBICACION</strong> o <strong>STOCK REAL</strong> para escribir el conteo y pulsa <strong>Grabar inventario</strong> cuando termines. Las lineas que dejes sin contar no se tocan al aplicar.</>
            : <>Este inventario ya fue aplicado: el conteo queda como historico y no se puede modificar.</>}
        </div>
      )}

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
            {paginatedRows.map((row, index) => {
              const location = draftLocation(row, drafts)
              const realStock = draftRealStock(row, drafts)
              const difference = draftDifference(row, drafts)
              return <tr key={`storage-inventory-detail-${row.id ?? index}`}>
                <td>{row.id ?? index + 1}</td>
                <td>{row.lot || '-'}</td>
                <td>{formatDate(row.expiration_date)}</td>
                <td>{row.article_name || '-'}</td>
                <td>{row.client_name || selectedClientName || '-'}</td>
                <td>{row.unit_label || '-'}</td>
                <td>
                  <EditableCell
                    value={location}
                    display={location || <span className='inventory-pending-cell'>Sin ubicacion</span>}
                    editable={canEditCount}
                    blockedReason={editBlockedReason}
                    options={locationOptionsFor(location)}
                    dirty={isDirtyField(row, drafts, 'location')}
                    onSave={(value) => editCell(row, 'location', value)}
                  />
                </td>
                <td>{row.temperature_range || '-'}</td>
                <td>{formatQty(row.system_stock)}</td>
                <td>
                  <EditableCell
                    type='number'
                    value={realStock ?? ''}
                    display={realStock === null ? <span className='inventory-pending-cell'>Sin contar</span> : formatQty(realStock)}
                    editable={canEditCount}
                    blockedReason={editBlockedReason}
                    placeholder='0'
                    dirty={isDirtyField(row, drafts, 'real_stock')}
                    onSave={(value) => editCell(row, 'real_stock', value)}
                  />
                </td>
                <td className={difference === null || difference === 0 ? '' : (difference > 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold')}>
                  {difference === null ? <span className='inventory-pending-cell'>-</span> : formatQty(difference)}
                </td>
              </tr>
            })}
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
