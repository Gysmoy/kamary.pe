import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import Swal from 'sweetalert2'
import BaseAdminto from '@Adminto/Base'
import CreateReactScript from '../../Utils/CreateReactScript'
import Table from '../../Components/Adminto/Table'
import Modal from '../../Components/Adminto/Modal'
import ReactAppend from '../../Utils/ReactAppend'
import DxButton from '../../Components/dx/DxButton'
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup'
import OutputsRest from '../../Actions/Admin/Magistrales/OutputsRest'
import renderGridEditLink from '../../Utils/renderGridEditLink'
import { buildMagistralesRows, openMagistralesRecordPdf } from '../../Utils/magistralesRecordPdf'

const rest = new OutputsRest()

const DEFAULT_REASON_OPTIONS = [
  'TRANSFERENCIA',
  'REGULARIZACION DE STOCK',
  'VENTA INTERNA',
  'PREPARACION DE BASES',
  'PREPARACION DE BASE GEL DE CARBOPOL',
  'PREPARACION DE BASE CREMA NO IONICA',
]

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  code: '',
  name: '',
  lot: '',
  expiration_date: '',
  stock: 0,
  unit_label: '',
  quantity: '',
  total: 0,
  type: '',
  is_lot_tracked: false,
})

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''

const toDateInput = (value) => {
  if (!value) return ''
  return `${value}`.slice(0, 10)
}

const todayInput = () => new Date().toISOString().slice(0, 10)

const asNumber = (value, decimals = 3) => Number(value || 0).toFixed(decimals)

const defaultQuantityForStock = (stock) => {
  const amount = Number(stock || 0)
  if (amount <= 0) return '0.001'
  return `${Math.min(amount, 1).toFixed(3)}`
}

const itemKey = (row) => [
  `${row.article_id || ''}`.trim(),
  `${row.lot || ''}`.trim().toLowerCase(),
  `${row.expiration_date || ''}`.trim(),
].join('|')

const normalizeReason = (value) => `${value ?? ''}`.trim().toUpperCase()

const Outputs = ({
  moduleTitle = 'Magistrales - Salidas',
  fixedWarehouse = null,
  reasonOptions: providedReasonOptions = [],
}) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const stockModalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const dateRef = useRef()
  const observationsRef = useRef()
  const stockSearchTextRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [warehouses, setWarehouses] = useState([])
  const [items, setItems] = useState([])
  const [reasonOptions, setReasonOptions] = useState(
    [...new Set([...(providedReasonOptions?.length ? providedReasonOptions : DEFAULT_REASON_OPTIONS)].map(normalizeReason).filter(Boolean))]
  )
  const [selectedReason, setSelectedReason] = useState('')
  const [selectedDestinationWarehouseId, setSelectedDestinationWarehouseId] = useState('')
  const [stockSearchTerm, setStockSearchTerm] = useState('')
  const [stockSearchRows, setStockSearchRows] = useState([])
  const [stockSearchSelectedIds, setStockSearchSelectedIds] = useState([])
  const [stockSearchFilter, setStockSearchFilter] = useState('')
  const [stockSearchPage, setStockSearchPage] = useState(1)
  const [stockSearchPageSize, setStockSearchPageSize] = useState(10)
  const [stockSearchLoading, setStockSearchLoading] = useState(false)

  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const fixedWarehouseLabel = [fixedWarehouse?.branch_name, fixedWarehouse?.name].filter(Boolean).join(' - ') || 'Almacen fijo de Magistrales'

  useEffect(() => {
    rest.getWarehouses().then((rows) => {
      const active = (rows ?? []).filter(row => row.status !== null)
      setWarehouses(active)
    })
  }, [])

  const destinationWarehouses = warehouses.filter(row => `${row.id}` !== fixedWarehouseId)
  const isTransferReason = selectedReason === 'TRANSFERENCIA'

  const stockSearchFilteredRows = stockSearchRows.filter((row) => {
    const search = `${stockSearchFilter ?? ''}`.trim().toLowerCase()
    if (!search) return true
    const haystack = [
      row.code,
      row.name,
      row.lot,
      row.expiration_date,
      row.type,
      row.unit_label,
    ].join(' ').toLowerCase()
    return haystack.includes(search)
  })

  const stockSearchTotalPages = Math.max(1, Math.ceil(stockSearchFilteredRows.length / stockSearchPageSize))
  const stockSearchCurrentPage = Math.min(stockSearchPage, stockSearchTotalPages)
  const stockSearchPageRows = stockSearchFilteredRows.slice(
    (stockSearchCurrentPage - 1) * stockSearchPageSize,
    stockSearchCurrentPage * stockSearchPageSize
  )
  const allStockSearchPageSelected = stockSearchPageRows.length > 0 && stockSearchPageRows.every(row => stockSearchSelectedIds.includes(row.id))
  const quantityTotal = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  const ensureReasonOption = (reason) => {
    const normalized = normalizeReason(reason)
    if (!normalized) return
    setReasonOptions(prev => prev.includes(normalized) ? prev : [...prev, normalized])
  }

  const resetStockSearchState = () => {
    setStockSearchTerm('')
    setStockSearchRows([])
    setStockSearchSelectedIds([])
    setStockSearchFilter('')
    setStockSearchPage(1)
    setStockSearchPageSize(10)
  }

  const openModal = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    dateRef.current.value = toDateInput(data?.output_date) || todayInput()
    observationsRef.current.value = data?.observations ?? ''

    const reason = normalizeReason(data?.reason)
    ensureReasonOption(reason)
    setSelectedReason(reason)
    setSelectedDestinationWarehouseId(data?.destination_warehouse_id ? `${data.destination_warehouse_id}` : '')

    const nextItems = (data?.items ?? []).map(item => ({
      uid: crypto.randomUUID(),
      article_id: item.article_id ? `${item.article_id}` : '',
      code: item.code ?? item.article?.code ?? '',
      name: item.name ?? item.article?.name ?? '',
      lot: item.lot ?? '',
      expiration_date: toDateInput(item.expiration_date),
      stock: Number(item.stock || 0),
      unit_label: item.unit_label ?? item.article?.unit?.symbol ?? item.article?.unit?.name ?? '',
      quantity: `${Number(item.quantity || 0)}`,
      total: Number(item.total || item.quantity || 0),
      type: normalizeReason(item.article?.article_type ?? ''),
      is_lot_tracked: !!(item.lot || item.expiration_date),
    }))

    setItems(nextItems)
    resetStockSearchState()
    $(modalRef.current).modal('show')
  }

  const updateItem = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const next = { ...item, [field]: value }
      if (field === 'quantity') next.total = Number(value || 0)
      return next
    }))
  }

  const removeItem = (uid) => {
    setItems(prev => prev.filter(item => item.uid !== uid))
  }

  const save = async (e) => {
    e.preventDefault()

    if (!selectedReason) {
      toast.error('Error', {
        description: 'Debes seleccionar un motivo para la nota de salida',
        duration: 3000,
        richColors: true,
      })
      return
    }

    if (isTransferReason && !selectedDestinationWarehouseId) {
      toast.error('Error', {
        description: 'Debes seleccionar el almacen destino para la transferencia',
        duration: 3000,
        richColors: true,
      })
      return
    }

    if (items.length === 0) {
      toast.error('Error', {
        description: 'Debes agregar al menos un articulo a la salida',
        duration: 3000,
        richColors: true,
      })
      return
    }

    const result = await rest.save({
      id: idRef.current.value || undefined,
      code: isEditing ? codeRef.current.value.trim() : '',
      origin_warehouse_id: fixedWarehouseId || null,
      destination_warehouse_id: isTransferReason ? selectedDestinationWarehouseId || null : null,
      reason: selectedReason,
      observations: observationsRef.current.value.trim(),
      output_date: dateRef.current.value || null,
      items: items.map(item => ({
        article_id: item.article_id || null,
        code: item.code,
        name: item.name,
        lot: `${item.lot ?? ''}`.trim(),
        expiration_date: item.expiration_date || null,
        stock: item.stock,
        unit_label: item.unit_label,
        quantity: item.quantity,
        total: item.total,
      })),
    })

    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar salida magistral',
      text: 'La nota de salida dejara de estar disponible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return
    const result = await rest.delete(id)
    if (result) $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const addCustomReason = async () => {
    const { isConfirmed, value } = await Swal.fire({
      title: 'Agregar motivo',
      input: 'text',
      inputLabel: 'Nuevo motivo para la nota de salida',
      inputPlaceholder: 'Ej. MERMA CONTROLADA',
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      inputValidator: (inputValue) => {
        if (!`${inputValue ?? ''}`.trim()) return 'Debes ingresar un motivo'
        return null
      }
    })

    if (!isConfirmed) return

    const reason = normalizeReason(value)
    ensureReasonOption(reason)
    setSelectedReason(reason)
  }

  const searchAvailableStockRows = async () => {
    setStockSearchLoading(true)
    try {
      const rows = await rest.availableStock({
        q: stockSearchTerm,
        output_id: idRef.current.value || '',
      })
      setStockSearchRows(rows)
      setStockSearchSelectedIds([])
      setStockSearchPage(1)
    } finally {
      setStockSearchLoading(false)
    }
  }

  const openStockSearchModal = () => {
    resetStockSearchState()
    $(stockModalRef.current).modal('show')
    setTimeout(() => stockSearchTextRef.current?.focus(), 180)
  }

  const toggleStockSearchRow = (rowId, checked) => {
    setStockSearchSelectedIds(prev => checked
      ? [...new Set([...prev, rowId])]
      : prev.filter(id => id !== rowId)
    )
  }

  const toggleStockSearchPage = (checked) => {
    const pageIds = stockSearchPageRows.map(row => row.id)
    setStockSearchSelectedIds(prev => {
      if (checked) return [...new Set([...prev, ...pageIds])]
      return prev.filter(id => !pageIds.includes(id))
    })
  }

  const addSelectedStockRows = () => {
    const selectedRows = stockSearchRows.filter(row => stockSearchSelectedIds.includes(row.id))
    if (selectedRows.length === 0) return

    const existingKeys = new Set(items.map(itemKey))
    const nextItems = [...items]
    let ignored = 0

    selectedRows.forEach((row) => {
      const key = itemKey(row)
      if (existingKeys.has(key)) {
        ignored++
        return
      }

      existingKeys.add(key)
      nextItems.push({
        uid: crypto.randomUUID(),
        article_id: `${row.article_id}`,
        code: row.code,
        name: row.name,
        lot: row.lot ?? '',
        expiration_date: row.expiration_date ?? '',
        stock: Number(row.stock || 0),
        unit_label: row.unit_label ?? '',
        quantity: defaultQuantityForStock(row.stock),
        total: Number(defaultQuantityForStock(row.stock)),
        type: row.type ?? '',
        is_lot_tracked: !!row.is_lot_tracked,
      })
    })

    setItems(nextItems)
    $(stockModalRef.current).modal('hide')

    if (ignored > 0) {
      toast.warning('Articulos omitidos', {
        description: `${ignored} registro(s) ya estaban agregados en la nota`,
        duration: 3000,
        richColors: true,
      })
    }
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={rest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => openModal() } })
      }}
      columns={[
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 150,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => openModal(data), 'Editar nota de salida magistral')
        },
        { dataField: 'originWarehouse.name', caption: 'Almacen origen', minWidth: 170 },
        {
          caption: 'Destino',
          minWidth: 180,
          calculateCellValue: row => {
            const branchName = row?.destinationWarehouse?.branch?.name
            const warehouseName = row?.destinationWarehouse?.name
            return [branchName, warehouseName].filter(Boolean).join(' - ') || row?.destination || '-'
          }
        },
        { dataField: 'reason', caption: 'Motivo', minWidth: 180 },
        { dataField: 'observations', caption: 'Observacion', minWidth: 220 },
        { dataField: 'creator_label', caption: 'Usuario registro', minWidth: 160, calculateCellValue: row => formatUser(row.creator) },
        { dataField: 'created_at', caption: 'Fecha registro', dataType: 'date', width: 130 },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => rest.status(data).then(ok => ok && $(gridRef.current).dxDataGrid('instance').refresh())} />)
          }
        },
        {
          caption: 'Acciones',
          width: 160,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.output(data)) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary ms-1', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => remove(data.id) }))
          }
        },
      ]}
    />

    <Modal
      modalRef={modalRef}
      title={isEditing ? 'Editar nota de salida' : 'Registrar nota de salida'}
      onSubmit={save}
      size='xl'
      btnSubmitText={isEditing ? 'Actualizar' : 'Registrar'}
      bodyClass='pt-3'
    >
      <input ref={idRef} hidden />

      <div className='row g-3'>
        <div className='col-md-4'>
          <label className='form-label'>Codigo</label>
          <input ref={codeRef} className='form-control' disabled />
        </div>
        <div className='col-md-4'>
          <label className='form-label'>Fecha de salida</label>
          <input ref={dateRef} type='date' className='form-control' required />
        </div>
        <div className='col-md-4'>
          <label className='form-label'>Resumen</label>
          <div className='border rounded px-3 py-2 bg-light h-100 d-flex align-items-center justify-content-between'>
            <span className='text-muted'>Lineas: {items.length}</span>
            <span className='fw-semibold'>Total: {asNumber(quantityTotal)}</span>
          </div>
        </div>

        <div className='col-12'>
          <div className='card border shadow-sm mb-0'>
            <div className='card-header bg-light'>
              <div className='d-flex align-items-center gap-2'>
                <i className='mdi mdi-warehouse text-primary'></i>
                <strong>Origen</strong>
              </div>
            </div>
            <div className='card-body'>
              <div className='row g-3'>
                <div className='col-md-6'>
                  <label className='form-label'>Almacen fijo</label>
                  <input className='form-control' value={fixedWarehouseLabel} disabled />
                </div>
                <div className='col-md-6'>
                  <label className='form-label'>Motivo</label>
                  <div className='input-group'>
                    <select className='form-select' value={selectedReason} onChange={(e) => setSelectedReason(normalizeReason(e.target.value))} required>
                      <option value=''>Seleccione</option>
                      {reasonOptions.map(reason => <option key={`mag-output-reason-${reason}`} value={reason}>{reason}</option>)}
                    </select>
                    <button type='button' className='btn btn-light border' title='Agregar motivo' onClick={addCustomReason}>
                      <i className='mdi mdi-plus'></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isTransferReason && <div className='col-12'>
          <div className='card border shadow-sm mb-0'>
            <div className='card-header bg-light'>
              <div className='d-flex align-items-center gap-2'>
                <i className='mdi mdi-swap-horizontal text-primary'></i>
                <strong>Destino</strong>
              </div>
            </div>
            <div className='card-body'>
              <div className='row g-3'>
                <div className='col-md-8'>
                  <label className='form-label'>Almacen destino</label>
                  <select
                    className='form-select'
                    value={selectedDestinationWarehouseId}
                    onChange={(e) => setSelectedDestinationWarehouseId(e.target.value)}
                    required={isTransferReason}
                  >
                    <option value=''>Seleccione</option>
                    {destinationWarehouses.map(warehouse => (
                      <option key={`mag-output-destination-${warehouse.id}`} value={warehouse.id}>
                        {[warehouse.branch?.name, warehouse.name].filter(Boolean).join(' - ') || warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='col-md-4'>
                  <label className='form-label'>Tipo de salida</label>
                  <input className='form-control' value='Transferencia entre almacenes' disabled />
                </div>
              </div>
            </div>
          </div>
        </div>}

        <div className='col-12'>
          <label className='form-label'>Observaciones</label>
          <textarea ref={observationsRef} className='form-control' rows='3' placeholder='Comentarios internos de la salida' />
        </div>

        <div className='col-12'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <div>
              <h5 className='mb-0'>Detalle de salida</h5>
              <small className='text-muted'>Selecciona los lotes desde el stock disponible del almacen fijo.</small>
            </div>
            <button type='button' className='btn btn-primary btn-sm' onClick={openStockSearchModal}>
              <i className='mdi mdi-plus me-1'></i> Insertar articulo
            </button>
          </div>

          <div className='table-responsive border rounded'>
            <table className='table table-sm align-middle mb-0'>
              <thead className='table-light'>
                <tr>
                  <th style={{ minWidth: 110 }}>Codigo</th>
                  <th style={{ minWidth: 260 }}>Nombre</th>
                  <th style={{ minWidth: 110 }}>Lote</th>
                  <th style={{ minWidth: 140 }}>F. vencim.</th>
                  <th style={{ minWidth: 100 }}>Stock</th>
                  <th style={{ minWidth: 90 }}>Und</th>
                  <th style={{ minWidth: 130 }}>Cantidad</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr>
                  <td colSpan='8' className='text-center text-muted py-4'>
                    No hay articulos agregados a la nota de salida
                  </td>
                </tr>}
                {items.map(item => (
                  <tr key={item.uid}>
                    <td>
                      <div className='fw-semibold'>{item.code || '-'}</div>
                      {!!item.type && <small className='text-muted'>{item.type}</small>}
                    </td>
                    <td>{item.name || '-'}</td>
                    <td>{item.lot || <span className='text-muted'>Sin lote</span>}</td>
                    <td>{item.expiration_date || <span className='text-muted'>-</span>}</td>
                    <td>{asNumber(item.stock)}</td>
                    <td>{item.unit_label || '-'}</td>
                    <td>
                      <input
                        className='form-control form-control-sm'
                        type='number'
                        min='0.001'
                        max={item.stock || undefined}
                        step='0.001'
                        value={item.quantity}
                        onChange={(e) => updateItem(item.uid, 'quantity', e.target.value)}
                      />
                    </td>
                    <td>
                      <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => removeItem(item.uid)}>
                        <i className='mdi mdi-delete'></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length > 0 && <tr className='table-light'>
                  <td colSpan='6' className='text-end fw-semibold'>Total</td>
                  <td className='fw-semibold'>{asNumber(quantityTotal)}</td>
                  <td></td>
                </tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={stockModalRef}
      title='Buscar stock disponible'
      size='xl'
      hideFooter
      bodyClass='pt-3'
    >
      <div className='row g-3'>
        <div className='col-md-8'>
          <label className='form-label'>Buscar por codigo, articulo o lote</label>
          <input
            ref={stockSearchTextRef}
            className='form-control'
            value={stockSearchTerm}
            placeholder='Ej. UREA, INS-21, LOTE-001'
            onChange={(e) => setStockSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              searchAvailableStockRows()
            }}
          />
        </div>
        <div className='col-md-4'>
          <label className='form-label'>Almacen origen</label>
          <input className='form-control' value={fixedWarehouseLabel} disabled />
        </div>

        <div className='col-12 d-flex flex-wrap gap-2 justify-content-between align-items-center'>
          <div className='d-flex gap-2'>
            <button type='button' className='btn btn-primary' onClick={searchAvailableStockRows} disabled={stockSearchLoading}>
              {stockSearchLoading ? <i className='mdi mdi-loading mdi-spin me-1'></i> : <i className='mdi mdi-magnify me-1'></i>}
              Buscar
            </button>
            <button type='button' className='btn btn-light' onClick={() => $(stockModalRef.current).modal('hide')}>
              Cerrar
            </button>
          </div>
          <button type='button' className='btn btn-success' onClick={addSelectedStockRows} disabled={stockSearchSelectedIds.length === 0}>
            <i className='mdi mdi-check me-1'></i> Agregar seleccionados
          </button>
        </div>

        <div className='col-12'>
          <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2'>
            <label className='d-flex align-items-center gap-2 mb-0'>
              <span>Elementos:</span>
              <select
                className='form-select form-select-sm'
                style={{ width: 82 }}
                value={stockSearchPageSize}
                onChange={(e) => {
                  setStockSearchPageSize(Number(e.target.value))
                  setStockSearchPage(1)
                }}
              >
                {[10, 20, 50].map(size => <option key={`mag-output-stock-size-${size}`} value={size}>{size}</option>)}
              </select>
            </label>
            <label className='d-flex align-items-center gap-2 mb-0'>
              <span>Filtrar:</span>
              <input className='form-control form-control-sm' value={stockSearchFilter} onChange={(e) => {
                setStockSearchFilter(e.target.value)
                setStockSearchPage(1)
              }} />
            </label>
          </div>

          <div className='table-responsive border rounded'>
            <table className='table table-sm table-hover align-middle mb-0'>
              <thead className='table-light'>
                <tr>
                  <th className='text-center' style={{ width: 56 }}>
                    <input type='checkbox' checked={allStockSearchPageSelected} onChange={(e) => toggleStockSearchPage(e.target.checked)} />
                  </th>
                  <th style={{ minWidth: 100 }}>Stock</th>
                  <th style={{ minWidth: 90 }}>Und</th>
                  <th style={{ minWidth: 120 }}>Codigo lote</th>
                  <th style={{ minWidth: 140 }}>F. vencimiento</th>
                  <th style={{ minWidth: 110 }}>Codigo articulo</th>
                  <th style={{ minWidth: 260 }}>Articulo</th>
                  <th style={{ minWidth: 120 }}>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {stockSearchLoading && <tr>
                  <td colSpan='8' className='text-center py-4'>
                    <i className='mdi mdi-loading mdi-spin me-1'></i> Buscando stock disponible...
                  </td>
                </tr>}
                {!stockSearchLoading && stockSearchRows.length === 0 && <tr>
                  <td colSpan='8' className='text-center text-muted py-4'>
                    No hay resultados. Ejecuta una busqueda para ver el stock disponible.
                  </td>
                </tr>}
                {!stockSearchLoading && stockSearchRows.length > 0 && stockSearchPageRows.length === 0 && <tr>
                  <td colSpan='8' className='text-center text-muted py-4'>
                    No hay elementos para el filtro actual.
                  </td>
                </tr>}
                {!stockSearchLoading && stockSearchPageRows.map(row => (
                  <tr key={row.id}>
                    <td className='text-center'>
                      <input type='checkbox' checked={stockSearchSelectedIds.includes(row.id)} onChange={(e) => toggleStockSearchRow(row.id, e.target.checked)} />
                    </td>
                    <td>{asNumber(row.stock)}</td>
                    <td>{row.unit_label || '-'}</td>
                    <td>{row.lot || <span className='text-muted'>Sin lote</span>}</td>
                    <td>{row.expiration_date || <span className='text-muted'>-</span>}</td>
                    <td>{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.type || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2'>
            <span className='text-muted'>
              {stockSearchFilteredRows.length > 0
                ? `${stockSearchFilteredRows.length} elementos (Pagina ${stockSearchCurrentPage} de ${stockSearchTotalPages})`
                : 'No hay elementos a mostrar'}
            </span>
            <div className='btn-group btn-group-sm'>
              <button type='button' className='btn btn-light' disabled={stockSearchCurrentPage <= 1} onClick={() => setStockSearchPage(page => Math.max(1, page - 1))}>Anterior</button>
              <button type='button' className='btn btn-light' disabled={stockSearchCurrentPage >= stockSearchTotalPages} onClick={() => setStockSearchPage(page => Math.min(stockSearchTotalPages, page + 1))}>Siguiente</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-outputs'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(
    <BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Salidas'}>
      <Outputs {...properties} />
    </BaseAdminto>
  )
})
