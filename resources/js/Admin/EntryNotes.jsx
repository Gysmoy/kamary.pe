import React, { createRef, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import { Fetch } from 'sode-extend-react';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import EntryNotesRest from '../Actions/Admin/EntryNotesRest';
import { isStoragePath, scopedPermission } from '../Utils/permissionScope';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';

const entryNotesRest = new EntryNotesRest()

const formatAuditUser = (user) => {
  if (!user) return ''
  const firstName = (user.name ?? '').toString().trim().split(' ')[0] ?? ''
  const firstLastname = (user.lastname ?? '').toString().trim().split(' ')[0] ?? ''
  const full = `${firstName} ${firstLastname}`.trim()
  const username = (user.username ?? '').toString().trim()
  if (full && username) return `${full} (@${username})`
  if (full) return full
  if (username) return `@${username}`
  return ''
}

const toDateInput = (value) => {
  if (!value) return ''
  return `${value}`.slice(0, 10)
}

const clientLabel = (client) => [client?.document_number, client?.full_name].filter(Boolean).join(' | ')
const warehouseBusinessId = (warehouse) => warehouse?.branch?.business_id || warehouse?.branch?.business?.id || ''
const warehouseBranchId = (warehouse) => warehouse?.business_branch_id || warehouse?.branch?.id || ''
const locationCodeFromValue = (value) => `${value ?? ''}`.split(',')[0].split('|')[0].trim()
const storageLocationOptionLabel = (location) => [location?.temperature_range, location?.code].filter(Boolean).join(' - ')

const articleOptionLabel = (article) => [article?.code, article?.name].filter(Boolean).join(' - ')

// Precio de compra configurado del articulo: el nacional para PEN y el extranjero para USD/EUR,
// tomando la presentacion por defecto y cayendo al precio del articulo si no hay presentaciones.
// Es la misma regla que ya aplica la orden de compra (resolvePresentationPrice en PurchaseOrders),
// para que el costo no salga distinto segun por donde entre la mercaderia.
const configuredPurchasePrice = (article, currency = 'PEN') => {
  if (!article) return 0
  const isForeign = currency === 'USD' || currency === 'EUR'
  const priceOf = (row) => {
    if (!row) return 0
    const configured = isForeign ? row.purchase_price_foreign : row.purchase_price_national
    return Number(configured ?? row.price ?? 0) || 0
  }

  const presentation = (article.presentations ?? [])
    .filter(row => row?.status === 1 || row?.status === true || row?.status === '1')
    .sort((a, b) => (Number(a.sort_order || 0) - Number(b.sort_order || 0)) || (Number(a.id || 0) - Number(b.id || 0)))[0]

  return priceOf(presentation) || priceOf(article)
}

const normalizeSearchText = (value) => `${value ?? ''}`
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const entryStatusLabel = (status) => ({
  approved: 'Aprobado',
  cancelled: 'Anulado',
  pending: 'En espera',
}[status] ?? 'En espera')

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  batch_id: '',
  batch_label: '',
  batch_code: '',
  lot: '',
  expiration_date: '',
  storage_condition: '',
  manufacturer_id: '',
  manufacturer_label: '',
  article_id: '',
  article_label: '',
  article_laboratory: '',
  article_principle: '',
  article_unit: '',
  storage_lots: [],
  warehouse_id: '',
  stock: 0,
  cost_unit: 0,
  location: '',
  locations: [],
  requested_quantity: 0,
  received_quantity: 0,
  quantity: 0,
  total: 0,
})

const EntryNotes = () => {
  const storageContext = isStoragePath()
  const tableRef = useRef()
  const modalRef = useRef()
  const createBatchModalRef = useRef()
  const lotSearchModalRef = useRef()
  const lotSearchTextRef = useRef()

  const idRef = useRef()
  const documentSeriesRef = useRef()
  const documentSequenceRef = useRef()
  const documentFileRef = useRef()
  const observationsRef = useRef()
  const guideSeriesRef = useRef()
  const guideSequenceRef = useRef()
  const guideRucRef = useRef()
  const guideFileRef = useRef()
  const articleRefs = useRef({})
  const batchOptionCacheRef = useRef({})
  const articleOptionCacheRef = useRef({})
  const createBatchArticleCacheRef = useRef({})
  const createBatchLotRef = useRef()
  const createBatchExpirationRef = useRef()
  const selectedStorageClientIdRef = useRef('')
  const providerDistributorRef = useRef()
  const entryDateRef = useRef()
  const documentDateRef = useRef()
  const voidModalRef = useRef()
  const invoiceSeriesRef = useRef()
  const invoiceSequenceRef = useRef()
  const invoiceDateRef = useRef()
  const duaNumberRef = useRef()
  const transportAgencyRef = useRef()
  const driverNameRef = useRef()
  const driverLicenseRef = useRef()
  const vehiclePlateRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  // Anulacion por nota de salida: detalle a confirmar y estado del envio.
  const [voidTarget, setVoidTarget] = useState(null)
  const [voidLoading, setVoidLoading] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedStorageClientId, setSelectedStorageClientId] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [invoiceType, setInvoiceType] = useState('')
  const [currency, setCurrency] = useState('PEN')
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [storageOptions, setStorageOptions] = useState({ businesses: [], branches: [], warehouses: [], locations: [], clients: [] })
  const [storageFilterClientId, setStorageFilterClientId] = useState('')
  const [storageFilterStartDate, setStorageFilterStartDate] = useState('')
  const [storageFilterEndDate, setStorageFilterEndDate] = useState('')
  const [storageGridFilter, setStorageGridFilter] = useState(null)
  const [isViewing, setIsViewing] = useState(false)
  const [items, setItems] = useState([emptyItem()])
  const [createBatchTargetUid, setCreateBatchTargetUid] = useState('')
  const [createBatchArticleId, setCreateBatchArticleId] = useState('')
  const [createBatchArticleLabel, setCreateBatchArticleLabel] = useState('')
  const [lotSearchWarehouseId, setLotSearchWarehouseId] = useState('')
  const [lotSearchTerm, setLotSearchTerm] = useState('')
  const [lotSearchRows, setLotSearchRows] = useState([])
  const [lotSearchSelectedIds, setLotSearchSelectedIds] = useState([])
  const [lotSearchFilter, setLotSearchFilter] = useState('')
  const [lotSearchPage, setLotSearchPage] = useState(1)
  const [lotSearchPageSize, setLotSearchPageSize] = useState(20)
  const [lotSearchLoading, setLotSearchLoading] = useState(false)

  const getArticleRef = (uid) => {
    if (!articleRefs.current[uid]) articleRefs.current[uid] = createRef()
    return articleRefs.current[uid]
  }

  useEffect(() => {
    if (!storageContext) return
    let mounted = true
    entryNotesRest.getStorageOptions().then(options => {
      if (!mounted) return
      const normalized = {
        businesses: options?.businesses ?? [],
        branches: options?.branches ?? [],
        warehouses: options?.warehouses ?? [],
        locations: options?.locations ?? [],
        clients: options?.clients ?? [],
      }
      setStorageOptions(normalized)
      setWarehouses(normalized.warehouses)
      const business = normalized.businesses[0]
      if (business?.id) setSelectedBusinessId(`${business.id}`)
    })
    return () => { mounted = false }
  }, [storageContext])

  // Listas completas (cliente-side) para alimentar los VdSelect de almacen/proveedor
  // del formulario estandar (no-almacenamiento); antes se buscaban vía select2 remoto.
  useEffect(() => {
    if (storageContext) return
    let mounted = true
    Promise.all([entryNotesRest.getWarehouses(), entryNotesRest.getSuppliers()]).then(([warehousesData, suppliersData]) => {
      if (!mounted) return
      setWarehouseOptions((warehousesData ?? []).filter(item => item.status !== null))
      setSupplierOptions((suppliersData ?? []).filter(item => item.status !== null))
    })
    return () => { mounted = false }
  }, [storageContext])

  useEffect(() => {
    if (storageContext) {
      items.forEach(item => {
        const ref = getArticleRef(item.uid)
        if (!ref.current || !item.article_id || !item.article_label) return
        const current = $(ref.current).val()
        if (`${current}` === `${item.article_id}`) return
        SetSelectValue(ref.current, item.article_id, item.article_label)
      })
    }
  }, [items])

  // Nota: ya no filtra por businessId (antes servia solo para acotar el <select> nativo de
  // almacen); con VdSelect el picker usa la lista completa (warehouseOptions) y esta lista
  // solo se usa para resolver nombres por ID (getWarehouseName), por lo que debe mantenerse
  // completa para no perder el nombre al elegir un almacen de otra empresa.
  const loadWarehouses = async () => {
    const warehousesData = await entryNotesRest.getWarehouses()
    setWarehouses((warehousesData ?? []).filter(item => item.status !== null))
  }

  const loadBranches = async (businessId, preferredId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
      return
    }
    const data = await entryNotesRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return
    }
    setSelectedBranchId('')
  }

  const resetStorageProductSelection = () => {
    setItems([])
    setLotSearchRows([])
    setLotSearchSelectedIds([])
    setLotSearchFilter('')
    setLotSearchPage(1)
  }

  const setCurrentStorageClientId = (clientId, { resetProducts = false } = {}) => {
    const normalized = `${clientId || ''}`
    const changed = selectedStorageClientIdRef.current !== normalized
    selectedStorageClientIdRef.current = normalized
    setSelectedStorageClientId(normalized)
    if (resetProducts && changed) resetStorageProductSelection()
  }

  const currentStorageClientId = () => selectedStorageClientIdRef.current || selectedStorageClientId || ''

  const onStorageClientChanged = (value) => {
    setCurrentStorageClientId(value || '', { resetProducts: true })
  }

  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return ''
    return warehouses.find(warehouse => `${warehouse.id}` === `${warehouseId}`)?.name ?? ''
  }

  const warehouseLocationLabel = (warehouseId, fallback = '') => getWarehouseName(warehouseId) || fallback || ''

  const refreshItemStock = async (uid, articleId, warehouseId) => {
    if (!uid) return
    if (!articleId || !warehouseId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...item, stock: 0 } : item))
      return
    }
    const stockData = await entryNotesRest.getCurrentStock(articleId, warehouseId, storageContext ? currentStorageClientId() : null)
    setItems(prev => prev.map(item => item.uid === uid ? { ...item, stock: Number(stockData?.stock || 0) } : item))
  }

  const refreshAllStocks = async (warehouseId, currentItems = null) => {
    const current = currentItems ? [...currentItems] : [...items]
    for (const item of current) {
      await refreshItemStock(item.uid, item.article_id, warehouseId || item.warehouse_id)
    }
  }

  const loadEntryNoteDetail = async (data) => {
    if (!data?.id) return data
    return await entryNotesRest.get(data.id) ?? data
  }

  const onModalOpen = async (data = null, options = {}) => {
    data = await loadEntryNoteDetail(data)

    setIsEditing(!!data?.id)
    setIsViewing(Boolean(options.viewOnly))

    if (idRef.current) idRef.current.value = data?.id ?? ''
    setDocumentType(data?.document_type ?? (storageContext ? 'Guia Remision' : 'Boleta'))
    if (documentSeriesRef.current) documentSeriesRef.current.value = data?.document_series ?? ''
    if (documentSequenceRef.current) documentSequenceRef.current.value = data?.document_sequence ?? ''
    setCurrency(data?.currency ?? 'PEN')
    if (observationsRef.current) observationsRef.current.value = data?.observations ?? ''
    if (guideSeriesRef.current) guideSeriesRef.current.value = data?.guide_series ?? ''
    if (guideSequenceRef.current) guideSequenceRef.current.value = data?.guide_sequence ?? ''
    if (guideRucRef.current) guideRucRef.current.value = data?.guide_ruc ?? ''
    if (documentFileRef.current) documentFileRef.current.value = ''
    if (guideFileRef.current) guideFileRef.current.value = ''

    if (providerDistributorRef.current) providerDistributorRef.current.value = data?.provider_distributor ?? ''
    if (entryDateRef.current) entryDateRef.current.value = toDateInput(data?.entry_date)
    if (documentDateRef.current) documentDateRef.current.value = toDateInput(data?.document_date)
    setInvoiceType(data?.invoice_type ?? '')
    if (invoiceSeriesRef.current) invoiceSeriesRef.current.value = data?.invoice_series ?? ''
    if (invoiceSequenceRef.current) invoiceSequenceRef.current.value = data?.invoice_sequence ?? ''
    if (invoiceDateRef.current) invoiceDateRef.current.value = toDateInput(data?.invoice_date)
    if (duaNumberRef.current) duaNumberRef.current.value = data?.dua_number ?? ''
    if (transportAgencyRef.current) transportAgencyRef.current.value = data?.transport_agency ?? ''
    if (driverNameRef.current) driverNameRef.current.value = data?.driver_name ?? ''
    if (driverLicenseRef.current) driverLicenseRef.current.value = data?.driver_license ?? ''
    if (vehiclePlateRef.current) vehiclePlateRef.current.value = data?.vehicle_plate ?? ''

    const businessId = data?.business_id ? `${data.business_id}` : (storageContext ? `${storageOptions.businesses[0]?.id ?? selectedBusinessId ?? ''}` : '')
    const warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : ''
    const supplierId = data?.supplier_id ? `${data.supplier_id}` : ''
    const clientId = data?.client_id ? `${data.client_id}` : ''
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)
    setSelectedSupplierId(supplierId)
    setCurrentStorageClientId(clientId)

    const detail = (data?.items ?? []).map(row => {
      const locationCode = locationCodeFromValue(row.location)
      const rowWarehouseId = row.warehouse_id ? `${row.warehouse_id}` : warehouseId
      const rowWarehouseLabel = row.warehouse?.name ?? data?.warehouse?.name ?? ''
      return ({
        uid: crypto.randomUUID(),
        batch_id: row.lot ?? row.batch_code ?? '',
        batch_label: row.lot ?? row.batch_code ?? '',
        batch_code: row.batch_code ?? '',
        lot: row.lot ?? '',
        expiration_date: toDateInput(row.expiration_date),
        storage_condition: row.storage_condition ?? '',
        manufacturer_id: row.manufacturer_id ? `${row.manufacturer_id}` : '',
        manufacturer_label: row.manufacturer?.name ?? '',
        article_id: row.article_id ? `${row.article_id}` : '',
        article_label: row.article ? `${row.article.code ?? ''} - ${row.article.name ?? ''}`.trim() : '',
        article_laboratory: row.article?.laboratory?.name ?? '',
        article_principle: row.article?.activePrinciple?.name ?? row.article?.active_principle?.name ?? '',
        article_unit: row.article?.unit?.symbol ?? row.article?.unit?.name ?? '',
        storage_lots: row.article?.storageLots ?? row.article?.storage_lots ?? [],
        warehouse_id: rowWarehouseId,
        stock: row.stock ?? 0,
        cost_unit: row.cost_unit ?? 0,
        location: storageContext ? locationCode : warehouseLocationLabel(rowWarehouseId, rowWarehouseLabel || locationCode),
        locations: storageContext && locationCode ? [locationCode] : [],
        requested_quantity: row.requested_quantity ?? row.quantity ?? 0,
        received_quantity: row.received_quantity ?? row.quantity ?? 0,
        quantity: row.quantity ?? 0,
        total: row.total ?? 0,
      })
    })
    const loadedItems = detail.length ? detail : (storageContext ? [] : [emptyItem()])
    setItems(loadedItems)

    $(modalRef.current).modal('show')
    if (!storageContext) {
      await loadWarehouses()
      await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
    }
    await refreshAllStocks(warehouseId, loadedItems)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    if (idRef.current.value) formData.append('id', idRef.current.value)
    if (storageContext || selectedBusinessId) {
      formData.append('business_id', selectedBusinessId || storageOptions.businesses[0]?.id || '')
    }
    formData.append('business_branch_id', selectedBranchId || '')
    formData.append('warehouse_id', selectedWarehouseId || '')
    formData.append('supplier_id', storageContext ? '' : (selectedSupplierId || ''))
    formData.append('client_id', storageContext ? (currentStorageClientId() || '') : '')
    formData.append('provider_distributor', storageContext ? (providerDistributorRef.current?.value || '') : '')
    formData.append('entry_date', storageContext ? (entryDateRef.current?.value || '') : '')
    formData.append('document_type', documentType || (storageContext ? 'Guia Remision' : 'Boleta'))
    formData.append('document_series', documentSeriesRef.current.value || '')
    formData.append('document_sequence', documentSequenceRef.current.value || '')
    formData.append('document_date', storageContext ? (documentDateRef.current?.value || '') : '')
    formData.append('invoice_type', storageContext ? (invoiceType || '') : '')
    formData.append('invoice_series', storageContext ? (invoiceSeriesRef.current?.value || '') : '')
    formData.append('invoice_sequence', storageContext ? (invoiceSequenceRef.current?.value || '') : '')
    formData.append('invoice_date', storageContext ? (invoiceDateRef.current?.value || '') : '')
    formData.append('dua_number', storageContext ? (duaNumberRef.current?.value || '') : '')
    formData.append('transport_agency', storageContext ? (transportAgencyRef.current?.value || '') : '')
    formData.append('driver_name', storageContext ? (driverNameRef.current?.value || '') : '')
    formData.append('driver_license', storageContext ? (driverLicenseRef.current?.value || '') : '')
    formData.append('vehicle_plate', storageContext ? (vehiclePlateRef.current?.value || '') : '')
    formData.append('currency', storageContext ? 'PEN' : (currency || 'PEN'))
    formData.append('observations', observationsRef.current.value || '')
    formData.append('guide_series', storageContext ? '' : (guideSeriesRef.current.value || ''))
    formData.append('guide_sequence', storageContext ? '' : (guideSequenceRef.current.value || ''))
    formData.append('guide_ruc', storageContext ? '' : (guideRucRef.current.value || ''))
    formData.append('items', JSON.stringify(items.map(item => {
      const selectedLot = selectedStorageLotForItem(item)
      const location = locationCodeFromValue(Array.isArray(item.locations) ? item.locations[0] : item.location)
      const warehouseId = item.warehouse_id || selectedWarehouseId || null
      const warehouseLabel = warehouseLocationLabel(warehouseId, item.location)
      const receivedQuantity = storageContext ? item.received_quantity : item.quantity
      const costUnit = Number(item.cost_unit || 0)
      const lot = (item.lot || item.batch_code || selectedLot?.lot || '').toString().trim()
      return {
        batch_code: lot,
        lot,
        expiration_date: item.expiration_date || selectedLot?.expiration_date || null,
        storage_condition: item.storage_condition || selectedLot?.storage_condition || null,
        manufacturer_id: item.manufacturer_id || selectedLot?.manufacturer_id || null,
        article_id: item.article_id || null,
        warehouse_id: warehouseId,
        stock: item.stock,
        cost_unit: costUnit,
        location: storageContext ? location : warehouseLabel.toString().trim(),
        requested_quantity: storageContext ? item.requested_quantity : item.quantity,
        received_quantity: receivedQuantity,
        quantity: receivedQuantity,
        total: Number(receivedQuantity || 0) * costUnit,
        status: true,
      }
    })))

    const documentFile = documentFileRef.current?.files?.[0]
    if (documentFile) formData.append('document_file', documentFile)
    const guideFile = guideFileRef.current?.files?.[0]
    if (guideFile) formData.append('guide_file', guideFile)

    const result = await entryNotesRest.save(formData)
    if (!result) return

    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await entryNotesRest.boolean({ id, field, value })
    if (!result) return
    tableRef.current?.refresh()
  }

  const onWarehouseChanged = async (warehouseId) => {
    warehouseId = warehouseId || ''
    const sourceList = storageContext ? storageOptions.warehouses : warehouseOptions
    const warehouse = sourceList.find(item => `${item.id}` === `${warehouseId}`) ?? null
    const warehouseLabel = warehouseLocationLabel(warehouseId, warehouse?.name)
    const businessId = warehouseBusinessId(warehouse)
    const branchId = warehouseBranchId(warehouse)

    setSelectedWarehouseId(warehouseId)
    if (!storageContext && (warehouse || !warehouseId)) {
      setSelectedBusinessId(businessId ? `${businessId}` : '')
      if (businessId) {
        await loadBranches(businessId, branchId || null)
      } else {
        setBranches([])
        setSelectedBranchId('')
      }
    }
    const updatedItems = items.map(item => ({
      ...item,
      warehouse_id: warehouseId,
      location: storageContext ? item.location : warehouseLabel,
    }))
    setItems(updatedItems)
    if (!warehouseId) return
    await refreshAllStocks(warehouseId, updatedItems)
  }

  const onItemUpdated = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (`${item[field] ?? ''}` === `${value ?? ''}`) return item
      const next = { ...item, [field]: value }
      const quantity = Number(storageContext ? (next.received_quantity || next.quantity || 0) : (next.quantity || 0))
      const costUnit = Number(next.cost_unit || 0)
      next.total = Number.isFinite(quantity * costUnit) ? quantity * costUnit : 0
      return next
    }))
  }

  const onItemBatchChanged = async (uid, value) => {
    const batchId = value || ''
    let batch = batchId ? (batchOptionCacheRef.current[batchId] ?? null) : null
    if (batchId && !batch) batch = await entryNotesRest.getBatchById(batchId)
    const currentItem = items.find(item => item.uid === uid)
    const warehouseLabel = warehouseLocationLabel(selectedWarehouseId, currentItem?.location)

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      // Quitar el lote no borra el articulo: el articulo se elige primero y manda sobre que lotes
      // se pueden ver, asi que limpiarlo aqui dejaba la linea inservible.
      if (!batchId) {
        return {
          ...item,
          batch_id: '',
          batch_label: '',
          batch_code: '',
          lot: '',
          location: storageContext ? item.location : warehouseLabel,
        }
      }
      if (!batch) {
        return {
          ...item,
          batch_id: batchId,
          batch_label: batchId,
          batch_code: batchId,
          lot: batchId,
          warehouse_id: selectedWarehouseId || item.warehouse_id,
          location: storageContext ? item.location : warehouseLabel,
        }
      }

      const article = batch.article ?? null
      const nextArticleId = article?.id ? `${article.id}` : item.article_id
      return {
        ...item,
        batch_id: batchId,
        batch_label: batch.lot ?? item.batch_label,
        batch_code: batch.lot ?? item.batch_code,
        lot: batch.lot ?? item.lot,
        article_id: nextArticleId,
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : item.article_label,
        article_laboratory: article?.laboratory?.name ?? item.article_laboratory,
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? item.article_principle,
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? item.article_unit,
        warehouse_id: selectedWarehouseId || item.warehouse_id,
        location: storageContext ? item.location : warehouseLabel,
      }
    }))

    if (!batch && currentItem?.article_id && selectedWarehouseId) {
      await refreshItemStock(uid, currentItem.article_id, selectedWarehouseId)
    }

    if (batch?.article?.id && selectedWarehouseId) {
      await refreshItemStock(uid, batch.article.id, selectedWarehouseId)
    }
  }

  // Picker de articulo de cada linea. Se elige antes que el lote porque un articulo tiene varios
  // lotes: primero el producto, y despues solo se ofrecen los lotes de ese producto. El almacen
  // decide si se ve el catalogo estandar o el de Magistrales (picker_warehouse_id, backend).
  const loadItemArticleOptions = async (query, warehouseId) => {
    const term = query || ''
    const request = {
      sort: [{ selector: 'name', desc: false }],
      take: 20,
      filter: [['name', 'contains', term], 'or', ['code', 'contains', term]],
    }
    if (warehouseId) request.picker_warehouse_id = Number(warehouseId)

    const { status, result } = await Fetch('/api/admin/articles/paginate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    if (!status) return []
    const rows = result?.data ?? []
    rows.forEach(row => { articleOptionCacheRef.current[`${row.id}`] = row })
    return rows.map(row => ({ value: `${row.id}`, label: articleOptionLabel(row) }))
  }

  const onItemArticleChanged = async (uid, value) => {
    const articleId = value || ''
    let article = articleId ? (articleOptionCacheRef.current[articleId] ?? null) : null
    if (articleId && !article) article = await entryNotesRest.getArticleById(articleId)

    const currentItem = items.find(item => item.uid === uid)
    const warehouseLabel = warehouseLocationLabel(selectedWarehouseId, currentItem?.location)
    // El costo arranca con el precio de compra configurado en vez de en cero: escribirlo a mano en
    // cada linea era la via facil para que el kardex quedara valorizado con cualquier numero.
    const costUnit = configuredPurchasePrice(article, currency)

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      // Cambiar de articulo invalida el lote elegido: cada lote pertenece a un articulo concreto.
      const withoutBatch = { ...item, batch_id: '', batch_label: '', batch_code: '', lot: '' }
      if (!articleId) {
        return {
          ...withoutBatch,
          article_id: '',
          article_label: '',
          article_laboratory: '',
          article_principle: '',
          article_unit: '',
          stock: 0,
          cost_unit: 0,
          total: 0,
          location: storageContext ? item.location : warehouseLabel,
        }
      }
      const quantity = Number(item.quantity || 0)
      return {
        ...withoutBatch,
        article_id: articleId,
        article_label: article ? articleOptionLabel(article) : item.article_label,
        article_laboratory: article?.laboratory?.name ?? '',
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
        cost_unit: costUnit,
        total: Number.isFinite(quantity * costUnit) ? quantity * costUnit : 0,
        warehouse_id: selectedWarehouseId || item.warehouse_id,
        location: storageContext ? item.location : warehouseLabel,
      }
    }))

    await refreshItemStock(uid, articleId, selectedWarehouseId)
  }

  // Picker de lote por item (antes select2 AJAX vía SelectAPIFormGroup). Mismo endpoint/campos
  // que usaba select2 (searchAPI '/api/admin/batches/paginate', searchBy 'lot', filter por
  // business_id). Cachea las filas completas (con .article) para que onItemBatchChanged pueda
  // resolver el articulo asociado sin depender de datos de select2.
  const loadBatchOptions = async (query, conditions = []) => {
    const extra = (Array.isArray(conditions) ? conditions : [conditions]).filter(Boolean)
    const base = ['lot', 'contains', query || '']
    const filter = extra.reduce((acc, condition) => [...acc, 'and', condition], [base])

    const { status, result } = await Fetch('/api/admin/batches/paginate', {
      method: 'POST',
      body: JSON.stringify({
        sort: [{ selector: 'lot', desc: false }],
        take: 20,
        filter: extra.length === 0 ? base : filter,
      }),
    })
    if (!status) return []
    const rows = result?.data ?? []
    rows.forEach(row => { batchOptionCacheRef.current[`${row.id}`] = row })
    return rows.map(row => ({ value: `${row.id}`, label: row.lot ?? `${row.id}` }))
  }

  const storageLocationsForWarehouse = (warehouseId, selectedLocation = '') => {
    if (!warehouseId) return []
    const selectedCode = locationCodeFromValue(selectedLocation)
    const clientId = currentStorageClientId()
    return (storageOptions.locations ?? [])
      .filter(location => `${location.warehouse_id}` === `${warehouseId}` && `${location.client_id ?? ''}` === `${clientId}` && (location.status === true || location.status === 1 || location.status === '1'))
      .filter(location => location.occupancy_status !== 'Ocupado' || `${location.code}` === selectedCode)
  }

  const selectedStorageLotForItem = (item) => {
    const lotKey = `${item.batch_id || item.lot || item.batch_code || item.batch_label || ''}`
    if (!lotKey) return null
    return (item.storage_lots ?? []).find(lot => {
      const values = [lot?.id, lot?.lot].filter(value => value !== undefined && value !== null)
      return values.some(value => `${value}` === lotKey)
    }) ?? null
  }

  const onStorageArticleChanged = async (uid, e) => {
    const selected = $(e.target).select2('data')?.[0]
    const article = selected?.data ?? null
    const articleId = e.target.value || ''

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (!articleId) {
        return {
          ...item,
          article_id: '',
          article_label: '',
          article_laboratory: '',
          article_principle: '',
          article_unit: '',
          storage_lots: [],
          batch_code: '',
          lot: '',
          expiration_date: '',
          storage_condition: '',
          manufacturer_id: '',
          manufacturer_label: '',
          stock: 0,
        }
      }

      const lots = article?.storageLots ?? article?.storage_lots ?? item.storage_lots ?? []
      return {
        ...item,
        article_id: articleId,
        article_label: article ? [article.code, article.name].filter(Boolean).join(' - ') : (selected?.text ?? articleId),
        article_laboratory: article?.laboratory?.name ?? item.article_laboratory,
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? item.article_principle,
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? item.article_unit,
        storage_lots: lots,
        batch_code: '',
        lot: '',
        expiration_date: '',
        storage_condition: '',
        manufacturer_id: '',
        manufacturer_label: '',
        warehouse_id: selectedWarehouseId || item.warehouse_id,
      }
    }))

    if (articleId && selectedWarehouseId) {
      await refreshItemStock(uid, articleId, selectedWarehouseId)
    }
  }

  const onStorageLotChanged = (uid, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const lot = (item.storage_lots ?? []).find(row => `${row.id ?? row.lot}` === `${value}` || `${row.lot}` === `${value}`) ?? null
      if (!value || !lot) {
        return {
          ...item,
          batch_id: value || '',
          batch_label: value || '',
          batch_code: value || '',
          lot: value || '',
          expiration_date: '',
          storage_condition: '',
          manufacturer_id: '',
          manufacturer_label: '',
        }
      }
      return {
        ...item,
        batch_id: `${lot.id ?? lot.lot ?? value}`,
        batch_label: lot.lot ?? value,
        batch_code: lot.lot ?? value,
        lot: lot.lot ?? value,
        expiration_date: toDateInput(lot.expiration_date),
        storage_condition: lot.storage_condition ?? '',
        manufacturer_id: lot.manufacturer_id ? `${lot.manufacturer_id}` : '',
        manufacturer_label: lot.manufacturer?.name ?? '',
      }
    }))
  }

  const onStorageLocationsChanged = (uid, value) => {
    const selected = locationCodeFromValue(value)
    setItems(prev => prev.map(item => item.uid === uid ? {
      ...item,
      locations: selected ? [selected] : [],
      location: selected,
    } : item))
  }

  const onCreateBatchForItem = async (uid) => {
    if (storageContext && !selectedBusinessId) {
      await Swal.fire({ icon: 'warning', title: 'Empresa requerida', text: 'No se pudo determinar la empresa del modulo de almacenamiento' })
      return
    }
    if (storageContext && !currentStorageClientId()) {
      await Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona el cliente antes de crear un lote' })
      return
    }

    const currentItem = items.find(item => item.uid === uid)
    setCreateBatchTargetUid(uid)
    setCreateBatchArticleId(currentItem?.article_id || '')
    setCreateBatchArticleLabel(currentItem?.article_id ? (currentItem?.article_label || '') : '')
    if (createBatchLotRef.current) createBatchLotRef.current.value = currentItem?.lot || ''
    if (createBatchExpirationRef.current) createBatchExpirationRef.current.value = ''
    $(createBatchModalRef.current).modal('show')
  }

  const onCreateBatchModalSubmit = async (e) => {
    e.preventDefault()
    if (storageContext && !selectedBusinessId) return

    if (!createBatchArticleId) {
      await Swal.fire({ icon: 'warning', title: 'Articulo requerido', text: 'Selecciona el articulo antes de crear el lote' })
      return
    }

    const lot = (createBatchLotRef.current?.value ?? '').trim()
    const expiration = createBatchExpirationRef.current?.value ?? ''
    if (!lot || !expiration) return

    const request = {
      article_id: createBatchArticleId,
      lot,
      expiration_date: expiration,
    }
    if (selectedBusinessId) request.business_id = selectedBusinessId

    const createdBatch = await entryNotesRest.createBatch(request)
    if (!createdBatch?.id) return

    const hydratedBatch = await entryNotesRest.getBatchById(createdBatch.id)
    const batchData = hydratedBatch ?? createdBatch
    const articleData = batchData?.article ?? await entryNotesRest.getArticleById(createBatchArticleId)

    const articleLabel = articleData
      ? [articleData.code, articleData.name].filter(Boolean).join(' - ')
      : createBatchArticleLabel

    setItems(prev => prev.map(item => item.uid === createBatchTargetUid ? {
      ...item,
      batch_id: `${createdBatch.id}`,
      batch_label: batchData?.lot ?? createdBatch.lot ?? lot,
      batch_code: batchData?.lot ?? createdBatch.lot ?? lot,
      lot: batchData?.lot ?? createdBatch.lot ?? lot,
      article_id: `${createBatchArticleId}`,
      article_label: articleLabel || item.article_label,
      article_laboratory: articleData?.laboratory?.name ?? item.article_laboratory,
      article_principle: articleData?.activePrinciple?.name ?? articleData?.active_principle?.name ?? item.article_principle,
      article_unit: articleData?.unit?.symbol ?? articleData?.unit?.name ?? item.article_unit,
      warehouse_id: selectedWarehouseId || item.warehouse_id,
    } : item))

    if (selectedWarehouseId) {
      await refreshItemStock(createBatchTargetUid, createBatchArticleId, selectedWarehouseId)
    }

    $(createBatchModalRef.current).modal('hide')
  }

  // Picker de articulo del modal "Crear lote" (antes select2 AJAX vía SelectAPIFormGroup).
  // Mismo endpoint/scope que usaba select2: comercial vs magistrales via picker_warehouse_id
  // (createBatchArticleExtraParams, calculado mas abajo a partir del almacen del item destino),
  // y filtro por cliente en contexto de almacenamiento (storageArticleClientFilter).
  const loadCreateBatchArticleOptions = async (query) => {
    const request = {
      sort: [{ selector: 'name', desc: false }],
      take: 20,
      filter: storageArticleClientFilter
        ? [['name', 'contains', query || ''], 'and', storageArticleClientFilter]
        : ['name', 'contains', query || ''],
    }
    if (createBatchArticleExtraParams) Object.assign(request, createBatchArticleExtraParams)
    const { status, result } = await Fetch(
      storageContext ? '/api/admin/storage/articles/paginate' : '/api/admin/articles/paginate',
      { method: 'POST', body: JSON.stringify(request) }
    )
    if (!status) return []
    const rows = result?.data ?? []
    rows.forEach(row => { createBatchArticleCacheRef.current[`${row.id}`] = row.name ?? `${row.id}` })
    return rows.map(row => ({ value: `${row.id}`, label: row.name ?? `${row.id}` }))
  }

  const onCreateBatchArticleChanged = (value) => {
    value = value || ''
    setCreateBatchArticleId(value)
    setCreateBatchArticleLabel(value ? (createBatchArticleCacheRef.current[value] ?? '') : '')
  }

  const openLotSearchModal = async () => {
    if (!currentStorageClientId()) {
      await Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona el cliente antes de insertar productos.' })
      return
    }
    if (!selectedWarehouseId) {
      await Swal.fire({ icon: 'warning', title: 'Almacen requerido', text: 'Selecciona el almacen antes de insertar productos.' })
      return
    }
    setLotSearchWarehouseId(selectedWarehouseId)
    setLotSearchTerm('')
    setLotSearchRows([])
    setLotSearchSelectedIds([])
    setLotSearchFilter('')
    setLotSearchPage(1)
    $(lotSearchModalRef.current).modal('show')
    setTimeout(() => lotSearchTextRef.current?.focus(), 250)
  }

  const lotSearchRowId = (article, lot) => `${article?.id ?? ''}-${lot?.id ?? lot?.lot ?? ''}`

  const searchStorageLots = async () => {
    const warehouseId = lotSearchWarehouseId || selectedWarehouseId
    const clientId = currentStorageClientId()
    if (!clientId) {
      await Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona el cliente para buscar sus productos.' })
      return
    }
    if (!warehouseId) {
      await Swal.fire({ icon: 'warning', title: 'Almacen requerido', text: 'Selecciona el almacen para buscar lotes.' })
      return
    }

    setLotSearchLoading(true)
    try {
      const articles = await entryNotesRest.getArticles(clientId)
      const needle = normalizeSearchText(lotSearchTerm)
      const rows = []

      ;(articles ?? []).forEach(article => {
        const lots = (article?.storageLots ?? article?.storage_lots ?? []).filter(lot => lot?.status !== null)
        lots.forEach(lot => {
          const unit = article?.unit?.symbol ?? article?.unit?.name ?? ''
          const articleLabel = [article?.code, article?.name].filter(Boolean).join(' - ')
          const searchable = normalizeSearchText([
            article?.code,
            article?.name,
            article?.health_registration,
            lot?.lot,
            unit,
          ].filter(Boolean).join(' '))
          if (needle && !searchable.includes(needle)) return

          rows.push({
            id: lotSearchRowId(article, lot),
            lot_id: lot?.id ?? lot?.lot ?? '',
            lot: lot?.lot ?? '',
            stock: 0,
            health_registration: article?.health_registration ?? '',
            expiration_date: toDateInput(lot?.expiration_date),
            storage_condition: lot?.storage_condition ?? '',
            manufacturer_id: lot?.manufacturer_id ? `${lot.manufacturer_id}` : '',
            manufacturer_label: lot?.manufacturer?.name ?? '',
            article_id: article?.id ? `${article.id}` : '',
            article_code: article?.code ?? '',
            article_name: article?.name ?? '',
            article_label: articleLabel,
            article_laboratory: article?.laboratory?.name ?? '',
            article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
            article_unit: unit,
            article_lots: lots,
          })
        })
      })

      const stockByArticle = {}
      const articleIds = [...new Set(rows.map(row => row.article_id).filter(Boolean))]
      await Promise.all(articleIds.map(async articleId => {
        const stockData = await entryNotesRest.getCurrentStock(articleId, warehouseId, storageContext ? currentStorageClientId() : null)
        stockByArticle[articleId] = Number(stockData?.stock || 0)
      }))

      setLotSearchRows(rows.map(row => ({ ...row, stock: stockByArticle[row.article_id] ?? 0 })))
      setLotSearchSelectedIds([])
      setLotSearchPage(1)
    } finally {
      setLotSearchLoading(false)
    }
  }

  const toggleLotSearchRow = (rowId, checked) => {
    setLotSearchSelectedIds(prev => {
      if (checked) return prev.includes(rowId) ? prev : [...prev, rowId]
      return prev.filter(id => id !== rowId)
    })
  }

  const addSelectedStorageLots = async () => {
    const selectedRows = lotSearchRows.filter(row => lotSearchSelectedIds.includes(row.id))
    if (selectedRows.length === 0) {
      await Swal.fire({ icon: 'warning', title: 'Selecciona lotes', text: 'Marca al menos un lote para insertarlo en la nota.' })
      return
    }
    const warehouseId = lotSearchWarehouseId || selectedWarehouseId
    setItems(prev => {
      const currentRows = prev.filter(item => item.article_id || item.lot || item.batch_code)
      const existing = new Set(currentRows.map(item => `${item.article_id}|${item.lot}`))
      const nextRows = selectedRows
        .filter(row => !existing.has(`${row.article_id}|${row.lot}`))
        .map(row => ({
          ...emptyItem(),
          batch_id: `${row.lot_id || row.lot}`,
          batch_label: row.lot,
          batch_code: row.lot,
          lot: row.lot,
          expiration_date: row.expiration_date,
          storage_condition: row.storage_condition,
          manufacturer_id: row.manufacturer_id,
          manufacturer_label: row.manufacturer_label,
          article_id: row.article_id,
          article_label: row.article_label,
          article_laboratory: row.article_laboratory,
          article_principle: row.article_principle,
          article_unit: row.article_unit,
          storage_lots: row.article_lots,
          warehouse_id: warehouseId,
          stock: row.stock,
        }))
      return [...currentRows, ...nextRows]
    })
    $(lotSearchModalRef.current).modal('hide')
  }

  const onItemAdded = () => setItems(prev => [...prev, {
    ...emptyItem(),
    warehouse_id: selectedWarehouseId || '',
    location: storageContext ? '' : warehouseLocationLabel(selectedWarehouseId),
  }])
  const onItemRemoved = (uid) => {
    setItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : (storageContext ? [] : [emptyItem()])
    })
  }

  const onEntryStatusChange = async (data, entryStatus) => {
    const title = entryStatus === 'approved' ? 'Aprobar nota de entrada' : 'Anular nota de entrada'
    const text = entryStatus === 'approved'
      ? 'La nota aprobada ingresara al stock disponible.'
      : 'La nota anulada dejara de afectar el stock.'
    const { isConfirmed } = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: entryStatus === 'approved' ? 'Si, aprobar' : 'Si, anular',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await entryNotesRest.setEntryStatus(data.id, entryStatus)
    if (!result) return
    tableRef.current?.refresh()
  }

  const openStorageDetailPdf = async (data) => {
    const detail = await loadEntryNoteDetail(data)
    openMagistralesRecordPdf(buildMagistralesRows.storageEntryNote(detail))
  }

  const openStorageActaPdf = async (data) => {
    const detail = await loadEntryNoteDetail(data)
    openMagistralesRecordPdf(buildMagistralesRows.storageEntryNoteActa(detail))
  }

  // Exporta TODAS las filas que calzan con el filtro/orden actual de la tabla (no solo la pagina visible)
  const storageExportRows = async () => {
    const rows = await tableRef.current?.loadAll()
    return Array.isArray(rows) ? rows.filter(Boolean) : []
  }

  const storageExportColumns = [
    ['Codigo', row => row?.code ?? row?.id ?? ''],
    ['Cliente', row => clientLabel(row?.client)],
    ['Almacen', row => row?.warehouse?.name ?? ''],
    ['Tipo de documento', row => row?.document_type ?? ''],
    ['Serie', row => row?.document_series ?? ''],
    ['Secuencia', row => row?.document_sequence ?? ''],
    ['Fecha de ingreso', row => toDateInput(row?.entry_date)],
    ['Usuario registro', row => formatAuditUser(row?.creator)],
    ['Fecha registro', row => `${row?.created_at ?? ''}`.replace('T', ' ').slice(0, 19)],
    ['Estado', row => entryStatusLabel(row?.entry_status)],
  ]

  const copyStorageGrid = async () => {
    const rows = await storageExportRows()
    const text = [
      storageExportColumns.map(([title]) => title).join('\t'),
      ...rows.map(row => storageExportColumns.map(([, getter]) => getter(row)).join('\t')),
    ].join('\n')
    await navigator.clipboard.writeText(text)
  }

  const downloadStorageBlob = (blob, filename) => {
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const downloadStorageCsv = async () => {
    const rows = await storageExportRows()
    const csv = [
      storageExportColumns.map(([title]) => `"${title}"`).join(','),
      ...rows.map(row => storageExportColumns.map(([, getter]) => `"${`${getter(row)}`.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadStorageBlob(blob, 'notas-entrada.csv')
  }

  const downloadStorageExcel = async () => {
    const rows = await storageExportRows()
    const matrix = [
      storageExportColumns.map(([title]) => title),
      ...rows.map(row => storageExportColumns.map(([, getter]) => getter(row))),
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(matrix)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas de entrada')
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    downloadStorageBlob(blob, 'notas-entrada.xlsx')
  }

  const downloadStoragePdf = async () => {
    const JsPDF = window.jspdf?.jsPDF || window.jsPDF
    if (!JsPDF) {
      printStorageGrid()
      return
    }
    const rows = await storageExportRows()
    const doc = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    doc.setFontSize(13)
    doc.text('Notas de entrada', 40, 35)
    doc.autoTable({
      startY: 50,
      head: [storageExportColumns.map(([title]) => title)],
      body: rows.map(row => storageExportColumns.map(([, getter]) => getter(row))),
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [36, 36, 76] },
    })
    doc.save('notas-entrada.pdf')
  }

  const printStorageGrid = () => window.print()

  const applyStorageFilter = () => {
    const filters = []
    if (storageFilterClientId) filters.push(['client_id', '=', Number(storageFilterClientId)])
    if (storageFilterStartDate) filters.push(['entry_date', '>=', storageFilterStartDate])
    if (storageFilterEndDate) filters.push(['entry_date', '<=', storageFilterEndDate])
    const filter = filters.reduce((acc, current) => acc ? [acc, 'and', current] : current, null)
    setStorageGridFilter(filter)
  }

  // Enlace de edicion inline reutilizado por las columnas "Codigo"/"Sede" (equivalente a renderGridEditLink, en JSX)
  const gridEditLink = (label, onClick, title = 'Editar') => (
    <button
      type='button'
      className='btn btn-link admin-grid-edit-link p-0 text-start fw-semibold'
      title={title}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}
    >
      {label === null || label === undefined || label === '' ? '-' : `${label}`}
    </button>
  )

  const storageRowActions = (row) => {
    const status = row?.entry_status ?? 'pending'
    if (status === 'approved') {
      return [
        { icon: 'mdi mdi-menu', title: 'Ver nota de entrada', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => onModalOpen(r, { viewOnly: true }) },
        { icon: 'mdi mdi-eye', title: 'Vista previa de nota de entrada', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openStorageDetailPdf(r) },
        { icon: 'mdi mdi-file-pdf-box', title: 'Detalle de nota de entrada', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => openStorageDetailPdf(r) },
        { icon: 'mdi mdi-file-document-outline', title: 'Acta de nota de entrada', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openStorageActaPdf(r) },
      ]
    }
    const list = []
    if (status !== 'cancelled') {
      list.push({ icon: 'mdi mdi-check', title: 'Aprobar nota de entrada', bg: '#eafaf0', color: '#1bb99a', onClick: (r) => onEntryStatusChange(r, 'approved') })
      list.push({ icon: 'mdi mdi-close', title: 'Anular nota de entrada', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onEntryStatusChange(r, 'cancelled') })
      list.push({ icon: 'mdi mdi-pencil', title: 'Editar nota de entrada', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) })
    }
    list.push({ icon: 'mdi mdi-file-pdf-box', title: 'Detalle de nota de entrada', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => openStorageDetailPdf(r) })
    list.push({ icon: 'mdi mdi-file-document-outline', title: 'Acta de nota de entrada', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openStorageActaPdf(r) })
    return list
  }

  // Una nota de entrada ya aprobada suma stock real (ver InventoryController::incomingTotalsQuery).
  // Borrarla lo haria desaparecer sin rastro en kardex, por eso no se ofrece eliminar: se anula
  // emitiendo una nota de salida espejo con las mismas cantidades.
  const standardRowActions = (row) => {
    const list = [
      { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
    ]
    if (!row?.voided_exit_note_id) {
      list.push({
        icon: 'mdi mdi-file-document-minus-outline',
        title: 'Anular con nota de salida',
        bg: '#fcebeb',
        color: '#e24b4a',
        onClick: (r) => onVoidClicked(r),
      })
    }
    return list
  }

  const onVoidClicked = async (row) => {
    const preview = await entryNotesRest.getVoidPreview(row.id)
    if (!preview) return
    setVoidTarget({ row, ...preview })
    $(voidModalRef.current).modal('show')
  }

  const onVoidConfirmed = async () => {
    if (!voidTarget?.row?.id || voidLoading) return
    setVoidLoading(true)
    const result = await entryNotesRest.void(voidTarget.row.id)
    setVoidLoading(false)
    if (!result) return
    $(voidModalRef.current).modal('hide')
    setVoidTarget(null)
    tableRef.current?.refresh()
  }

  const storageVdColumns = [
    {
      key: 'codigo', label: 'Codigo', field: 'code', width: '185px',
      filter: { type: 'text' },
      render: (row) => {
        const isApproved = row?.entry_status === 'approved'
        return gridEditLink(row?.code ?? row?.id, () => onModalOpen(row, { viewOnly: isApproved }), isApproved ? 'Ver nota de entrada' : 'Editar nota de entrada')
      },
    },
    {
      key: 'cliente', label: 'Cliente', field: 'client.full_name',
      filter: { type: 'text', fields: ['client.full_name', 'client.document_number'] },
      render: (row) => clientLabel(row?.client),
    },
    { key: 'almacen', label: 'Almacen', field: 'warehouse.name', filter: { type: 'text' } },
    { key: 'tipoDocumento', label: 'Tipo de documento', field: 'document_type', filter: { type: 'text' } },
    { key: 'serie', label: 'Serie', field: 'document_series', width: '90px', filter: { type: 'text' } },
    { key: 'secuencia', label: 'Secuencia', field: 'document_sequence', width: '120px', filter: { type: 'text' } },
    { key: 'fechaIngreso', label: 'Fecha de ingreso', field: 'entry_date', width: '140px', filter: { type: 'date' } },
    {
      key: 'usuarioRegistro', label: 'Usuario registro', field: 'creator.fullname', visible: false, sortable: false,
      render: (row) => formatAuditUser(row.creator),
    },
    { key: 'fechaRegistro', label: 'Fecha registro', field: 'created_at', visible: false, sortable: false },
    {
      key: 'estado', label: 'Estado', field: 'entry_status', width: '145px',
      filter: {
        type: 'select',
        options: [
          { value: 'approved', label: 'Aprobado' },
          { value: 'cancelled', label: 'Anulado' },
          { value: 'pending', label: 'En espera' },
        ],
      },
      render: (row) => {
        const status = row?.entry_status ?? 'pending'
        const className = status === 'approved' ? 'badge bg-success' : status === 'cancelled' ? 'badge bg-danger' : 'badge bg-warning text-dark'
        return <span className={className}>{entryStatusLabel(status)}</span>
      },
    },
  ]

  const standardVdColumns = [
    {
      key: 'sede', label: 'Sede', field: 'branch.name', filter: { type: 'text' },
      render: (row) => gridEditLink(row?.branch?.name, () => onModalOpen(row), 'Editar nota de entrada'),
    },
    { key: 'almacen', label: 'Almacen', field: 'warehouse.name', filter: { type: 'text' } },
    { key: 'proveedor', label: 'Proveedor', field: 'supplier.business_name', filter: { type: 'text' } },
    { key: 'tipoDoc', label: 'Tipo doc', field: 'document_type', width: '110px', filter: { type: 'text' } },
    { key: 'serie', label: 'Serie', field: 'document_series', width: '90px', filter: { type: 'text' } },
    { key: 'secuencia', label: 'Secuencia', field: 'document_sequence', width: '110px', filter: { type: 'text' } },
    { key: 'moneda', label: 'Moneda', field: 'currency', width: '90px' },
    {
      key: 'detalle', label: 'Detalle', field: 'items', sortable: false,
      render: (row) => {
        const lines = (row?.items ?? []).map(item => {
          const article = item?.article
          const label = [item?.lot || '-', article?.name || 'Articulo'].join(' - ')
          return `${label} | Cant. ${Number(item?.quantity || 0).toFixed(2)} | S/. ${Number(item?.total || 0).toFixed(2)}`
        })
        if (lines.length === 0) return <small className='text-muted'>Sin detalle</small>
        return <div>{lines.map((line, idx) => <div key={`entry-note-${row.id}-item-${idx}`}><small>{line}</small></div>)}</div>
      },
    },
    {
      key: 'creadoPor', label: 'Creado por', field: 'creator.fullname', visible: false, sortable: false,
      render: (row) => formatAuditUser(row.creator),
    },
    {
      key: 'actualizadoPor', label: 'Actualizado por', field: 'updater.fullname', visible: false, sortable: false,
      render: (row) => formatAuditUser(row.updater),
    },
    {
      key: 'estado', label: 'Estado', field: 'status', width: '110px',
      render: (row) => {
        if (row.status === null) return ''
        if (row.voided_exit_note_id) return <span className='badge bg-danger'>Anulada</span>
        return <SwitchFormGroup noMargin checked={row.status == 1} onChange={() => onBooleanChange({ id: row.id, field: 'status', value: !row.status })} />
      },
    },
  ]

  const lotSearchFilterNeedle = normalizeSearchText(lotSearchFilter)
  const lotSearchFilteredRows = lotSearchFilterNeedle
    ? lotSearchRows.filter(row => normalizeSearchText([
      row.lot,
      row.health_registration,
      row.expiration_date,
      row.article_label,
      row.article_unit,
      row.stock,
    ].join(' ')).includes(lotSearchFilterNeedle))
    : lotSearchRows
  const lotSearchTotalPages = Math.max(1, Math.ceil(lotSearchFilteredRows.length / lotSearchPageSize))
  const lotSearchCurrentPage = Math.min(lotSearchPage, lotSearchTotalPages)
  const lotSearchStart = (lotSearchCurrentPage - 1) * lotSearchPageSize
  const lotSearchPageRows = lotSearchFilteredRows.slice(lotSearchStart, lotSearchStart + lotSearchPageSize)
  const allLotSearchPageSelected = lotSearchPageRows.length > 0 && lotSearchPageRows.every(row => lotSearchSelectedIds.includes(row.id))
  const storageEntryQuantityTotal = items.reduce((total, item) => total + Number(item.received_quantity || item.quantity || 0), 0)
  const storageArticleClientFilter = storageContext
    ? ['client_id', '=', Number(currentStorageClientId() || 0)]
    : null
  // El almacen del item destino de "Crear lote" (o el del encabezado si aun no se sobreescribe)
  // decide si el selector de articulos muestra el catalogo estandar o el de Magistrales (ver
  // ArticleController::pickerEffectiveModuleScope, backend). Para cualquier otro almacen esto no
  // cambia nada del comportamiento actual. No aplica al contexto de almacenamiento (catalogo propio).
  const createBatchTargetItem = items.find(item => item.uid === createBatchTargetUid)
  const createBatchArticlePickerWarehouseId = createBatchTargetItem?.warehouse_id || selectedWarehouseId || ''
  const createBatchArticleExtraParams = (!storageContext && createBatchArticlePickerWarehouseId)
    ? { picker_warehouse_id: Number(createBatchArticlePickerWarehouseId) }
    : undefined
  // Si la linea ya tiene producto, el lote nuevo tiene que ser de ESE producto: cambiarlo aqui
  // crearia el lote para otro articulo y ademas cambiaria el de la linea sin que se note.
  const createBatchArticleLocked = !storageContext && !!createBatchTargetItem?.article_id

  const toggleLotSearchPage = (checked) => {
    const pageIds = lotSearchPageRows.map(row => row.id)
    setLotSearchSelectedIds(prev => {
      if (checked) return [...new Set([...prev, ...pageIds])]
      return prev.filter(id => !pageIds.includes(id))
    })
  }

  return (<>
    {storageContext && <style>{`
      .storage-entry-dialog {
        width: calc(100vw - 32px);
        max-width: calc(100vw - 32px);
        margin: 0.9rem auto;
      }

      .storage-entry-modal {
        border: 0;
        border-radius: 6px;
      }

      .storage-entry-header {
        background: #272954;
        color: #fff;
        padding: 0.65rem 1rem;
      }

      .storage-entry-header .modal-title {
        color: #fff;
        font-size: 0.88rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      .storage-entry-body {
        background: #fff;
        padding: 1rem 1.25rem 1.25rem;
      }

      .storage-entry-form {
        color: #30364d;
      }

      .storage-entry-form .form-label {
        color: #30364d;
        font-size: 0.8rem;
        font-weight: 600;
      }

      .storage-entry-form-section {
        border: 1px solid #e3e8ef;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1rem;
      }

      .storage-entry-lines-wrap {
        border: 1px solid #e3e8ef;
        border-radius: 6px;
        overflow: auto;
      }

      .storage-entry-lines {
        min-width: 1740px;
      }

      .storage-entry-lines th {
        color: #30364d;
        font-size: 0.74rem;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .storage-entry-lines td {
        vertical-align: middle;
      }

      @media (max-width: 767.98px) {
        .storage-entry-dialog {
          width: calc(100vw - 12px);
          max-width: calc(100vw - 12px);
        }
      }
    `}</style>}

    {storageContext && <div className='card mb-3'>
      <div className='card-header'>Nota de entrada registrados</div>
      <div className='card-body'>
        <div className='row align-items-end'>
          <VdSelect
            label='Cliente'
            col='col-md-4'
            value={storageFilterClientId}
            onChange={(value) => setStorageFilterClientId(value)}
            options={storageOptions.clients.map(client => ({ value: `${client.id}`, label: clientLabel(client) }))}
            placeholder='Seleccione'
          />
          <InputFormGroup label='Fecha inicio' col='col-md-3' type='date' value={storageFilterStartDate} onChange={(e) => setStorageFilterStartDate(e.target.value)} />
          <InputFormGroup label='Fecha fin' col='col-md-3' type='date' value={storageFilterEndDate} onChange={(e) => setStorageFilterEndDate(e.target.value)} />
          <div className='form-group col-md-2 mb-2 text-center'>
            <button type='button' className='btn btn-sm btn-outline-primary' onClick={applyStorageFilter}>
              <i className='mdi mdi-magnify me-1'></i> Buscar notas de entrada
            </button>
          </div>
        </div>
      </div>
    </div>}

    <VdTable
      ref={tableRef}
      rest={entryNotesRest}
      icon='mdi mdi-tray-arrow-down'
      title={storageContext ? 'Nota de entrada' : 'Notas de entrada'}
      unit='notas'
      defaultSort={{ field: 'id', desc: true }}
      defaultPageSize={storageContext ? 10 : 25}
      searchFields={storageContext
        ? ['code', 'client.full_name', 'client.document_number', 'warehouse.name', 'document_series', 'document_sequence']
        : ['branch.name', 'warehouse.name', 'supplier.business_name', 'document_series', 'document_sequence']}
      searchPlaceholder='Buscar…'
      emptyText='No se encontraron notas de entrada.'
      baseFilter={storageContext ? storageGridFilter : null}
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
        <button type='button' className='vdt-btn-pri' onClick={() => onModalOpen(null)}>
          <i className='mdi mdi-plus'></i> Agregar nota de entrada
        </button>
      </>}
      toolbar={storageContext ? <>
        <button type='button' className='vdt-btn-soft' onClick={printStorageGrid}>
          <i className='mdi mdi-printer'></i> Imprimir
        </button>
        <button type='button' className='vdt-btn-soft' onClick={downloadStoragePdf}>
          <i className='mdi mdi-file-pdf-box'></i> PDF
        </button>
        <button type='button' className='vdt-btn-soft' onClick={downloadStorageExcel}>
          <i className='mdi mdi-file-excel'></i> Excel
        </button>
        <button type='button' className='vdt-btn-soft' onClick={downloadStorageCsv}>
          <i className='mdi mdi-file-delimited-outline'></i> CSV
        </button>
        <button type='button' className='vdt-btn-soft' onClick={copyStorageGrid}>
          <i className='mdi mdi-content-copy'></i> Copiar
        </button>
      </> : null}
      actions={storageContext ? storageRowActions : standardRowActions}
      columns={storageContext ? storageVdColumns : standardVdColumns}
      renderCard={(row, actionButtons) => (
        <div className='vdt-card' onClick={() => onModalOpen(row, storageContext ? { viewOnly: row.entry_status === 'approved' } : {})}>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>
                {storageContext ? (row.code ?? row.id) : (row.branch?.name ?? '-')}
              </p>
              <small className='text-muted'>
                {storageContext ? clientLabel(row.client) : [row.warehouse?.name, row.supplier?.business_name].filter(Boolean).join(' · ')}
              </small>
            </div>
            {storageContext
              ? <span className={`badge ${row.entry_status === 'approved' ? 'bg-success' : row.entry_status === 'cancelled' ? 'bg-danger' : 'bg-warning text-dark'}`}>{entryStatusLabel(row.entry_status)}</span>
              : (row.status !== null && <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>)}
          </div>
          <small className='text-muted d-block mt-2'>{row.document_type} {row.document_series}-{row.document_sequence}</small>
          {actionButtons && <div className='d-flex flex-wrap mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal
      modalRef={modalRef}
      title={isViewing ? 'Ver nota de entrada' : (storageContext ? 'Registrar nota de entrada' : (isEditing ? 'Editar nota de entrada' : 'Agregar nota de entrada'))}
      onSubmit={onModalSubmit}
      size='full-width'
      preventEnterSubmit
      dialogClass={storageContext ? 'storage-entry-dialog modal-dialog-scrollable' : ''}
      contentClass={storageContext ? 'storage-entry-modal' : ''}
      headerClass={storageContext ? 'storage-entry-header' : ''}
      closeButtonClass={storageContext ? 'btn-close-white' : ''}
      bodyClass={storageContext ? 'storage-entry-body' : ''}
      hideButtonSubmit={isViewing}
    >
      {storageContext ? (
        <fieldset className='row storage-entry-form' id='entry-note-form-container' disabled={isViewing}>
          <input ref={idRef} type='hidden' />

          <VdSelect
            label='Cliente'
            col='col-md-6'
            required
            value={selectedStorageClientId}
            onChange={onStorageClientChanged}
            options={storageOptions.clients.map(client => ({ value: `${client.id}`, label: clientLabel(client) }))}
            placeholder='-- Seleccionar cliente --'
          />
          <InputFormGroup eRef={providerDistributorRef} label='Proveedor/Distribuidor' col='col-md-6' />

          <VdSelect
            label='Almacen'
            col='col-md-6'
            required
            value={selectedWarehouseId}
            onChange={onWarehouseChanged}
            options={storageOptions.warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
            placeholder='Seleccione'
          />
          <InputFormGroup eRef={entryDateRef} label='Fecha ingreso' col='col-md-6' type='date' required />

          <VdSelect
            label='Tipo documento'
            col='col-md-3'
            required
            value={documentType}
            onChange={setDocumentType}
            options={[
              { value: 'Guia Remision', label: 'Guia Remision' },
              { value: 'Factura', label: 'Factura' },
              { value: 'Boleta', label: 'Boleta' },
              { value: 'Nota de salida interna', label: 'Nota de salida interna' },
              { value: 'Nota de entrada interna', label: 'Nota de entrada interna' },
            ]}
          />
          <InputFormGroup eRef={documentSeriesRef} label='Serie' col='col-md-3' required />
          <InputFormGroup eRef={documentSequenceRef} label='Secuencia' col='col-md-3' required />
          <InputFormGroup eRef={documentDateRef} label='Fecha Documento' col='col-md-3' type='date' required />

          <hr className='my-3' />

          <VdSelect
            label='Invoice'
            col='col-md-3'
            value={invoiceType}
            onChange={setInvoiceType}
            options={[{ value: 'Invoice', label: 'Invoice' }, { value: 'Factura', label: 'Factura' }]}
            placeholder='Invoice'
          />
          <InputFormGroup eRef={invoiceSeriesRef} label='Invoice Serie' col='col-md-3' />
          <InputFormGroup eRef={invoiceSequenceRef} label='Invoice Secuencia' col='col-md-3' />
          <InputFormGroup eRef={invoiceDateRef} label='Invoice Fecha' col='col-md-3' type='date' />

          <InputFormGroup eRef={duaNumberRef} label='Nro DUA' col='col-md-2' />
          <InputFormGroup eRef={transportAgencyRef} label='Agencia Transporte' col='col-md-3' />
          <InputFormGroup eRef={driverNameRef} label='Nombre Chofer' col='col-md-3' required />
          <InputFormGroup eRef={driverLicenseRef} label='Numero brevete' col='col-md-2' required />
          <InputFormGroup eRef={vehiclePlateRef} label='N de placa' col='col-md-2' required />

          <TextareaFormGroup eRef={observationsRef} label='Observaciones' col='col-12' rows={2} />

          <div className='col-12 my-2'>
            <button type='button' className='btn btn-sm btn-outline-primary' onClick={openLotSearchModal}>
              <i className='mdi mdi-plus-circle me-1'></i> Insertar producto
            </button>
          </div>

          <div className='col-12'>
            <h4 className='text-center mb-3'>Nota de entrada</h4>
            <div className='storage-entry-lines-wrap'>
              <table className='table table-sm table-bordered mb-0 storage-entry-lines'>
                <thead>
                  <tr>
                    <th>Numero de lote</th>
                    <th>Fecha de vencimiento</th>
                    <th>Articulo</th>
                    <th>U. medida</th>
                    <th>Stock actual</th>
                    <th>Fabricante</th>
                    <th>Condicion almacenamiento</th>
                    <th>Ubicacion</th>
                    <th>Cantidad solicitada</th>
                    <th>Cantidad recibida</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && <tr><td colSpan='11' className='text-center text-muted py-3'>Sin productos</td></tr>}
                  {items.map(item => {
                    const selectedLocation = locationCodeFromValue(item.location || item.locations?.[0])
                    const locations = storageLocationsForWarehouse(item.warehouse_id || selectedWarehouseId, selectedLocation)
                    const selectedLot = selectedStorageLotForItem(item)
                    const lotCode = item.lot || item.batch_code || selectedLot?.lot || ''
                    const expirationDate = toDateInput(item.expiration_date || selectedLot?.expiration_date)
                    const manufacturerLabel = item.manufacturer_label || selectedLot?.manufacturer?.name || ''
                    const storageCondition = item.storage_condition || selectedLot?.storage_condition || ''
                    return (
                      <tr key={item.uid}>
                        <td style={{ minWidth: 160 }}>
                          <input className='form-control form-control-sm' value={lotCode} readOnly />
                        </td>
                        <td style={{ minWidth: 145 }}>
                          <input className='form-control form-control-sm' value={expirationDate} readOnly />
                        </td>
                        <td style={{ minWidth: 260 }}>
                          <input className='form-control form-control-sm' value={item.article_label} readOnly />
                        </td>
                        <td style={{ minWidth: 110 }}><input className='form-control form-control-sm' value={item.article_unit} readOnly /></td>
                        <td style={{ minWidth: 110 }}><input className='form-control form-control-sm bg-light text-muted' type='number' value={Number(item.stock || 0).toFixed(3)} readOnly tabIndex='-1' /></td>
                        <td style={{ minWidth: 170 }}><input className='form-control form-control-sm' value={manufacturerLabel} readOnly /></td>
                        <td style={{ minWidth: 210 }}><input className='form-control form-control-sm' value={storageCondition} readOnly /></td>
                        <td style={{ minWidth: 240 }}>
                          <VdSelect
                            col='col-12'
                            noMargin
                            value={selectedLocation}
                            disabled={locations.length === 0}
                            onChange={(value) => onStorageLocationsChanged(item.uid, value)}
                            options={locations.map(location => ({
                              value: `${location.code}`,
                              label: `${storageLocationOptionLabel(location)}${location.occupancy_status === 'Ocupado' ? ' | Ocupado' : ''}`,
                            }))}
                            placeholder='Seleccione'
                          />
                        </td>
                        <td style={{ minWidth: 140 }}><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.requested_quantity} onChange={(e) => onItemUpdated(item.uid, 'requested_quantity', e.target.value)} /></td>
                        <td style={{ minWidth: 140 }}><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.received_quantity} onChange={(e) => onItemUpdated(item.uid, 'received_quantity', e.target.value)} /></td>
                        <td>
                          <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onItemRemoved(item.uid)}>
                            <i className='mdi mdi-delete'></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {items.length > 0 && (
                    <tr>
                      <td colSpan='8'></td>
                      <td className='text-end fw-semibold fst-italic align-middle'>Total</td>
                      <td style={{ minWidth: 140 }}>
                        <input className='form-control form-control-sm' type='number' value={storageEntryQuantityTotal.toFixed(2)} readOnly />
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </fieldset>
      ) : (
      <fieldset className='row' id='entry-note-form-container' disabled={isViewing}>
        <input ref={idRef} type='hidden' />

        <VdSelect
          label='Sede'
          col='col-md-4'
          value={selectedBranchId}
          onChange={(value) => setSelectedBranchId(value)}
          options={branches.map(branch => ({ value: `${branch.id}`, label: branch.name }))}
          placeholder='-- Seleccione sede --'
        />
        <VdSelect
          label='Almacen'
          col='col-md-4'
          required
          value={selectedWarehouseId}
          onChange={onWarehouseChanged}
          options={warehouseOptions.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
          placeholder='-- Seleccionar almacen --'
        />
        <VdSelect
          label='Proveedor'
          col='col-md-4'
          value={selectedSupplierId}
          onChange={(value) => setSelectedSupplierId(value || '')}
          options={supplierOptions.map(supplier => ({ value: `${supplier.id}`, label: supplier.business_name }))}
          placeholder='-- Seleccionar proveedor --'
        />

        <VdSelect
          label='Tipo documento'
          col='col-md-2'
          value={documentType}
          onChange={setDocumentType}
          options={[
            { value: 'Boleta', label: 'Boleta' },
            { value: 'Factura', label: 'Factura' },
            { value: 'Ticket', label: 'Ticket' },
            { value: 'Otro', label: 'Otro' },
          ]}
        />
        <InputFormGroup eRef={documentSeriesRef} label='Serie' col='col-md-2' />
        <InputFormGroup eRef={documentSequenceRef} label='Secuencia' col='col-md-2' />
        <div className='form-group col-md-3 mb-2'>
          <label className='form-label'>Archivo</label>
          <input ref={documentFileRef} type='file' className='form-control' />
        </div>
        <VdSelect
          label='Moneda'
          col='col-md-3'
          value={currency}
          onChange={setCurrency}
          options={[{ value: 'PEN', label: 'PEN' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]}
        />

        <TextareaFormGroup eRef={observationsRef} label='Observaciones' col='col-12' rows={2} />

        <h6 className='mt-3 mb-2'>Guia de remision</h6>
        <InputFormGroup eRef={guideSeriesRef} label='Serie' col='col-md-2' />
        <InputFormGroup eRef={guideSequenceRef} label='Secuencia' col='col-md-2' />
        <InputFormGroup eRef={guideRucRef} label='RUC' col='col-md-2' />
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label'>Archivo</label>
          <input ref={guideFileRef} type='file' className='form-control' />
        </div>

        <div className='col-12 mt-3'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Nota de entrada</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={onItemAdded}>
              <i className='mdi mdi-plus me-1'></i> Agregar linea
            </button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>Articulo</th>
                  <th>Codigo Lote</th>
                  <th>Laboratorio | Principio activo</th>
                  <th>Unidad</th>
                  <th>Stock actual</th>
                  <th>Almacen</th>
                  <th>P. Costo Unit.</th>
                  <th>Ubicacion</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const articleExtra = item.article_id ? `${item.article_laboratory || '-'} | ${item.article_principle || '-'}` : '-'
                  const unitLabel = item.article_id ? (item.article_unit || '-') : '-'
                  const batchFilter = selectedBusinessId
                    ? ['business_id', '=', Number(selectedBusinessId)]
                    : null
                  const articleLotFilter = item.article_id ? ['article_id', '=', Number(item.article_id)] : null
                  return (
                    <tr key={item.uid}>
                      <td style={{ width: '24%' }}>
                        <VdSelect
                          col='col-12'
                          noMargin
                          clearable
                          value={item.article_id}
                          valueLabel={item.article_label}
                          placeholder='-- Seleccionar articulo --'
                          onChange={(value) => onItemArticleChanged(item.uid, value)}
                          loadOptions={(q) => loadItemArticleOptions(q, item.warehouse_id || selectedWarehouseId)}
                        />
                      </td>
                      <td style={{ width: '18%' }}>
                        <div className='d-flex gap-1 align-items-center'>
                          <div style={{ flex: 1 }}>
                            <VdSelect
                              col='col-12'
                              noMargin
                              clearable
                              disabled={!item.article_id}
                              value={item.batch_id}
                              valueLabel={item.batch_label}
                              placeholder={item.article_id ? '-- Seleccionar lote --' : 'Elige primero el articulo'}
                              onChange={(value) => onItemBatchChanged(item.uid, value)}
                              loadOptions={(q) => loadBatchOptions(q, [batchFilter, articleLotFilter])}
                            />
                          </div>
                          <button type='button' className='btn btn-xs btn-soft-success' title='Crear lote' onClick={() => onCreateBatchForItem(item.uid)}>
                            <i className='mdi mdi-plus'></i>
                          </button>
                        </div>
                      </td>
                      {/* La columna "Lote" era un campo de solo lectura que repetia el codigo ya
                          visible en el select de al lado. Se quita: item.lot se sigue llenando en
                          estado y viaja igual en el guardado. */}
                      <td><small>{articleExtra}</small></td>
                      <td><small>{unitLabel}</small></td>
                      <td><input className='form-control form-control-sm bg-light text-muted' type='number' min='0' step='0.001' value={Number(item.stock || 0).toFixed(3)} readOnly tabIndex='-1' /></td>
                      <td><input className='form-control form-control-sm' value={getWarehouseName(item.warehouse_id || selectedWarehouseId)} readOnly /></td>
                      <td><input className='form-control form-control-sm' type='number' min='0' step='0.0001' value={item.cost_unit} onChange={(e) => onItemUpdated(item.uid, 'cost_unit', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm bg-light text-muted' value={item.location || warehouseLocationLabel(item.warehouse_id || selectedWarehouseId)} readOnly tabIndex='-1' /></td>
                      <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => onItemUpdated(item.uid, 'quantity', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' type='number' value={Number(item.total || 0).toFixed(2)} readOnly /></td>
                      <td>
                        <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onItemRemoved(item.uid)}>
                          <i className='mdi mdi-delete'></i>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </fieldset>
      )}
    </Modal>

    {storageContext && <Modal
      modalRef={lotSearchModalRef}
      title={<span><i className='mdi mdi-menu me-1'></i> BUSCAR LOTES</span>}
      onSubmit={(e) => { e.preventDefault(); searchStorageLots() }}
      size='full-width'
      hideFooter
      headerClass='bg-primary text-white py-2'
      closeButtonClass='btn-close-white'
      bodyStyle={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}
      zIndex={1070}
    >
      <div className='px-1'>
        <div className='d-flex align-items-center gap-2 mb-2'>
          <i className='mdi mdi-menu text-muted'></i>
          <strong className='text-muted'>INGRESAR DATOS</strong>
        </div>
        <hr className='mt-0' />

        <div className='row align-items-end'>
          <div className='form-group col-md-6 mb-3'>
            <label className='form-label'>Descripcion del Articulo</label>
            <input
              ref={lotSearchTextRef}
              className='form-control'
              value={lotSearchTerm}
              placeholder='Ingrese codigo, nombre, lote'
              onChange={(e) => setLotSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                searchStorageLots()
              }}
            />
          </div>
          <VdSelect
            label='Seleccionar almacen'
            col='col-md-6'
            value={lotSearchWarehouseId}
            onChange={(value) => setLotSearchWarehouseId(value)}
            options={storageOptions.warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
            placeholder='Seleccione'
          />
        </div>

        <div className='d-flex gap-2 justify-content-center mb-4'>
          <button type='button' className='btn btn-primary' onClick={searchStorageLots} disabled={lotSearchLoading}>
            {lotSearchLoading ? <i className='mdi mdi-loading mdi-spin me-1'></i> : <i className='mdi mdi-magnify me-1'></i>}
            Buscar
          </button>
          <button type='button' className='btn btn-light' onClick={addSelectedStorageLots} disabled={lotSearchSelectedIds.length === 0}>
            <i className='mdi mdi-close me-1'></i> Regresar
          </button>
        </div>

        <div className='d-flex align-items-center gap-2 mb-2'>
          <i className='mdi mdi-menu text-muted'></i>
          <strong className='text-muted'>SELECCIONAR LOTES</strong>
        </div>
        <hr className='mt-0' />

        <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2'>
          <div className='d-flex align-items-center gap-2'>
            <span>Elementos:</span>
            <div style={{ width: 90 }}>
              <VdSelect
                noMargin
                value={lotSearchPageSize}
                onChange={(value) => {
                  setLotSearchPageSize(Number(value))
                  setLotSearchPage(1)
                }}
                options={[10, 20, 50].map(size => ({ value: size, label: `${size}` }))}
              />
            </div>
          </div>
          <label className='d-flex align-items-center gap-2 mb-0'>
            <span>Filtrar:</span>
            <input className='form-control form-control-sm' value={lotSearchFilter} onChange={(e) => { setLotSearchFilter(e.target.value); setLotSearchPage(1) }} />
          </label>
        </div>

        <div className='table-responsive border'>
          <table className='table table-sm table-hover mb-0'>
            <thead>
              <tr>
                <th style={{ width: 55 }} className='text-center'>
                  <input type='checkbox' checked={allLotSearchPageSelected} onChange={(e) => toggleLotSearchPage(e.target.checked)} />
                </th>
                <th className='text-center'>STOCK</th>
                <th>NUMERO DE LOTE</th>
                <th>REGISTRO SANITARIO</th>
                <th>FECHA DE VENCIMIENTO</th>
                <th>ARTICULO</th>
                <th>U. MEDIDA</th>
              </tr>
            </thead>
            <tbody>
              {lotSearchLoading && <tr><td colSpan='7' className='text-center py-4'><i className='mdi mdi-loading mdi-spin me-1'></i> Buscando lotes...</td></tr>}
              {!lotSearchLoading && lotSearchRows.length === 0 && <tr><td colSpan='7' className='text-muted py-3'>No existen elementos</td></tr>}
              {!lotSearchLoading && lotSearchRows.length > 0 && lotSearchPageRows.length === 0 && <tr><td colSpan='7' className='text-muted py-3'>No hay elementos a mostrar</td></tr>}
              {!lotSearchLoading && lotSearchPageRows.map(row => (
                <tr key={row.id}>
                  <td className='text-center'>
                    <input type='checkbox' checked={lotSearchSelectedIds.includes(row.id)} onChange={(e) => toggleLotSearchRow(row.id, e.target.checked)} />
                  </td>
                  <td className='text-center'>{Number(row.stock || 0).toFixed(3)}</td>
                  <td>{row.lot}</td>
                  <td>{row.health_registration}</td>
                  <td>{row.expiration_date}</td>
                  <td>{row.article_name}</td>
                  <td>{row.article_unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2'>
          <span className='text-muted'>
            {lotSearchFilteredRows.length > 0
              ? `${lotSearchFilteredRows.length} elementos (Pagina ${lotSearchCurrentPage} de ${lotSearchTotalPages})`
              : 'No hay elementos a mostrar'}
          </span>
          <div className='btn-group btn-group-sm'>
            <button type='button' className='btn btn-light' disabled={lotSearchCurrentPage <= 1} onClick={() => setLotSearchPage(page => Math.max(1, page - 1))}>Anterior</button>
            <button type='button' className='btn btn-light' disabled={lotSearchCurrentPage >= lotSearchTotalPages} onClick={() => setLotSearchPage(page => Math.min(lotSearchTotalPages, page + 1))}>Siguiente</button>
          </div>
        </div>
      </div>
    </Modal>}
    <Modal
      modalRef={voidModalRef}
      title={<h4 className='modal-title'><i className='mdi mdi-file-document-minus-outline me-2 text-danger'></i>Anular nota de entrada</h4>}
      size='lg'
      asForm={false}
      hideFooter
    >
      <div className='alert alert-warning d-flex align-items-start gap-2'>
        <i className='mdi mdi-information-outline fs-4 lh-1'></i>
        <div>
          <strong>Se creara una nota de salida con los mismos datos.</strong>
          <div className='mt-1'>
            Una entrada no se elimina: se anula con una salida por la misma cantidad, para que el
            movimiento quede registrado en el kardex. Si entraron 10 unidades, saldran 10 unidades.
          </div>
        </div>
      </div>

      <div className='row g-2 mb-3'>
        <div className='col-md-6'>
          <label className='form-label mb-1'>Nota de entrada</label>
          <input className='form-control bg-light' value={voidTarget?.entry_note?.code ?? ''} readOnly />
        </div>
        <div className='col-md-6'>
          <label className='form-label mb-1'>Almacen</label>
          <input className='form-control bg-light' value={voidTarget?.entry_note?.warehouse_name ?? ''} readOnly />
        </div>
      </div>

      <div className='table-responsive border rounded'>
        <table className='table table-sm table-striped mb-0'>
          <thead>
            <tr>
              <th>Articulo</th>
              <th style={{ width: 160 }}>Lote</th>
              <th style={{ width: 120 }} className='text-end'>Cantidad a salir</th>
            </tr>
          </thead>
          <tbody>
            {(voidTarget?.items ?? []).length === 0 && (
              <tr><td colSpan='3' className='text-center text-muted py-3'>Sin articulos</td></tr>
            )}
            {(voidTarget?.items ?? []).map((item, idx) => (
              <tr key={`void-item-${idx}`}>
                <td>{[item.article_code, item.article_name].filter(Boolean).join(' - ') || '-'}</td>
                <td>{item.lot || '-'}</td>
                <td className='text-end fw-semibold'>{Number(item.quantity ?? 0).toLocaleString('es-PE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='d-flex justify-content-end gap-2 mt-3'>
        <button type='button' className='btn btn-light' data-bs-dismiss='modal' disabled={voidLoading}>
          Cancelar
        </button>
        <button type='button' className='btn btn-danger' onClick={onVoidConfirmed} disabled={voidLoading || (voidTarget?.items ?? []).length === 0}>
          {voidLoading
            ? <><i className='mdi mdi-loading mdi-spin me-1'></i>Anulando...</>
            : <><i className='mdi mdi-check me-1'></i>Si, anular y crear nota de salida</>}
        </button>
      </div>
    </Modal>

    <Modal modalRef={createBatchModalRef} title='Crear lote' onSubmit={onCreateBatchModalSubmit} size='md'>
      <div className='row' id='entry-note-create-batch-container'>
        <VdSelect
          label='Articulo'
          col='col-12'
          required
          clearable={!createBatchArticleLocked}
          disabled={createBatchArticleLocked}
          value={createBatchArticleId}
          valueLabel={createBatchArticleLabel}
          placeholder='-- Seleccionar articulo --'
          onChange={onCreateBatchArticleChanged}
          loadOptions={loadCreateBatchArticleOptions}
        />
        {createBatchArticleLocked && (
          <div className='col-12 mb-2'>
            <small className='text-muted'>
              <i className='mdi mdi-information-outline me-1'></i>
              El lote se creara para el producto de la linea.
            </small>
          </div>
        )}
        <InputFormGroup eRef={createBatchLotRef} label='Lote' col='col-12' required />
        <InputFormGroup eRef={createBatchExpirationRef} label='Fecha de vencimiento' col='col-12' type='date' required />
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? scopedPermission('entry-note')
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Notas de entrada'}>
    <EntryNotes {...properties} />
  </BaseAdminto>);
})
