import React, { createRef, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import EntryNotesRest from '../Actions/Admin/EntryNotesRest';
import { isStoragePath, scopedPermission } from '../Utils/permissionScope';
import renderGridEditLink from '../Utils/renderGridEditLink';
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
const locationCodeFromValue = (value) => `${value ?? ''}`.split(',')[0].split('|')[0].trim()
const storageLocationOptionLabel = (location) => [location?.temperature_range, location?.code].filter(Boolean).join(' - ')

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
  const gridRef = useRef()
  const modalRef = useRef()
  const createBatchModalRef = useRef()
  const lotSearchModalRef = useRef()
  const lotSearchTextRef = useRef()

  const idRef = useRef()
  const businessRef = useRef()
  const branchRef = useRef()
  const warehouseRef = useRef()
  const supplierRef = useRef()
  const documentTypeRef = useRef()
  const documentSeriesRef = useRef()
  const documentSequenceRef = useRef()
  const documentFileRef = useRef()
  const currencyRef = useRef()
  const observationsRef = useRef()
  const guideSeriesRef = useRef()
  const guideSequenceRef = useRef()
  const guideRucRef = useRef()
  const guideFileRef = useRef()
  const batchRefs = useRef({})
  const articleRefs = useRef({})
  const createBatchArticleRef = useRef()
  const createBatchLotRef = useRef()
  const createBatchExpirationRef = useRef()
  const storageClientRef = useRef()
  const selectedStorageClientIdRef = useRef('')
  const providerDistributorRef = useRef()
  const entryDateRef = useRef()
  const documentDateRef = useRef()
  const invoiceTypeRef = useRef()
  const invoiceSeriesRef = useRef()
  const invoiceSequenceRef = useRef()
  const invoiceDateRef = useRef()
  const duaNumberRef = useRef()
  const transportAgencyRef = useRef()
  const driverNameRef = useRef()
  const driverLicenseRef = useRef()
  const vehiclePlateRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedStorageClientId, setSelectedStorageClientId] = useState('')
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [storageOptions, setStorageOptions] = useState({ businesses: [], branches: [], warehouses: [], locations: [], clients: [] })
  const [storageFilterClientId, setStorageFilterClientId] = useState('')
  const [storageFilterStartDate, setStorageFilterStartDate] = useState('')
  const [storageFilterEndDate, setStorageFilterEndDate] = useState('')
  const [storageGridFilter, setStorageGridFilter] = useState(null)
  const [isViewing, setIsViewing] = useState(false)
  const [items, setItems] = useState([emptyItem()])
  const [createBatchTargetUid, setCreateBatchTargetUid] = useState('')
  const [createBatchArticleId, setCreateBatchArticleId] = useState('')
  const [lotSearchWarehouseId, setLotSearchWarehouseId] = useState('')
  const [lotSearchTerm, setLotSearchTerm] = useState('')
  const [lotSearchRows, setLotSearchRows] = useState([])
  const [lotSearchSelectedIds, setLotSearchSelectedIds] = useState([])
  const [lotSearchFilter, setLotSearchFilter] = useState('')
  const [lotSearchPage, setLotSearchPage] = useState(1)
  const [lotSearchPageSize, setLotSearchPageSize] = useState(20)
  const [lotSearchLoading, setLotSearchLoading] = useState(false)

  const getBatchRef = (uid) => {
    if (!batchRefs.current[uid]) batchRefs.current[uid] = createRef()
    return batchRefs.current[uid]
  }

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

  useEffect(() => {
    if (!storageContext) return
    const updateGridDimensions = () => {
      try {
        $(gridRef.current).dxDataGrid('instance')?.updateDimensions()
      } catch (error) { }
    }
    const timers = [0, 250, 600].map(delay => setTimeout(updateGridDimensions, delay))
    return () => timers.forEach(timer => clearTimeout(timer))
  }, [storageContext])

  useEffect(() => {
    items.forEach(item => {
      const ref = getBatchRef(item.uid)
      if (!ref.current || !item.batch_id || !item.batch_label) return
      const current = $(ref.current).val()
      if (`${current}` === `${item.batch_id}`) return
      SetSelectValue(ref.current, item.batch_id, item.batch_label)
    })
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

  const loadWarehouses = async (businessId = selectedBusinessId) => {
    const warehousesData = await entryNotesRest.getWarehouses()
    const active = (warehousesData ?? []).filter(item => item.status !== null)
    setWarehouses(businessId
      ? active.filter(item => `${warehouseBusinessId(item)}` === `${businessId}`)
      : active
    )
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

  const currentStorageClientId = () => storageClientRef.current?.value || selectedStorageClientIdRef.current || selectedStorageClientId || ''

  const onStorageClientChanged = (e) => {
    setCurrentStorageClientId(e.target.value || '', { resetProducts: true })
  }

  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return ''
    return warehouses.find(warehouse => `${warehouse.id}` === `${warehouseId}`)?.name ?? ''
  }

  const refreshItemStock = async (uid, articleId, warehouseId) => {
    if (!uid) return
    if (!articleId || !warehouseId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...item, stock: 0 } : item))
      return
    }
    const stockData = await entryNotesRest.getCurrentStock(articleId, warehouseId)
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
    if (documentTypeRef.current) documentTypeRef.current.value = data?.document_type ?? (storageContext ? 'Guia Remision' : 'Boleta')
    if (documentSeriesRef.current) documentSeriesRef.current.value = data?.document_series ?? ''
    if (documentSequenceRef.current) documentSequenceRef.current.value = data?.document_sequence ?? ''
    if (currencyRef.current) currencyRef.current.value = data?.currency ?? 'PEN'
    if (observationsRef.current) observationsRef.current.value = data?.observations ?? ''
    if (guideSeriesRef.current) guideSeriesRef.current.value = data?.guide_series ?? ''
    if (guideSequenceRef.current) guideSequenceRef.current.value = data?.guide_sequence ?? ''
    if (guideRucRef.current) guideRucRef.current.value = data?.guide_ruc ?? ''
    if (documentFileRef.current) documentFileRef.current.value = ''
    if (guideFileRef.current) guideFileRef.current.value = ''

    if (providerDistributorRef.current) providerDistributorRef.current.value = data?.provider_distributor ?? ''
    if (entryDateRef.current) entryDateRef.current.value = toDateInput(data?.entry_date)
    if (documentDateRef.current) documentDateRef.current.value = toDateInput(data?.document_date)
    if (invoiceTypeRef.current) invoiceTypeRef.current.value = data?.invoice_type ?? ''
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

    if (!storageContext && businessId && data?.business?.name) {
      SetSelectValue(businessRef.current, businessId, data.business.name)
    } else if (!storageContext && businessRef.current) {
      $(businessRef.current).empty().trigger('change')
    }

    if (!storageContext && warehouseId && data?.warehouse?.name) {
      SetSelectValue(warehouseRef.current, warehouseId, data.warehouse.name)
    } else if (!storageContext && warehouseRef.current) {
      $(warehouseRef.current).empty().trigger('change')
    }

    if (!storageContext && supplierId && data?.supplier?.business_name) {
      SetSelectValue(supplierRef.current, supplierId, data.supplier.business_name)
    } else if (!storageContext && supplierRef.current) {
      $(supplierRef.current).empty().trigger('change')
    }

    if (storageContext && storageClientRef.current) {
      if (clientId && data?.client) {
        SetSelectValue(storageClientRef.current, clientId, clientLabel(data.client))
      } else {
        $(storageClientRef.current).empty().trigger('change')
      }
    }

    const detail = (data?.items ?? []).map(row => {
      const locationCode = locationCodeFromValue(row.location)
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
        warehouse_id: row.warehouse_id ? `${row.warehouse_id}` : warehouseId,
        stock: row.stock ?? 0,
        cost_unit: row.cost_unit ?? 0,
        location: locationCode,
        locations: locationCode ? [locationCode] : [],
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
      await loadWarehouses(businessId)
      await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
    }
    await refreshAllStocks(warehouseId, loadedItems)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    if (idRef.current.value) formData.append('id', idRef.current.value)
    formData.append('business_id', selectedBusinessId || storageOptions.businesses[0]?.id || '')
    formData.append('business_branch_id', selectedBranchId || '')
    formData.append('warehouse_id', selectedWarehouseId || '')
    formData.append('supplier_id', storageContext ? '' : (selectedSupplierId || ''))
    formData.append('client_id', storageContext ? (storageClientRef.current?.value || '') : '')
    formData.append('provider_distributor', storageContext ? (providerDistributorRef.current?.value || '') : '')
    formData.append('entry_date', storageContext ? (entryDateRef.current?.value || '') : '')
    formData.append('document_type', documentTypeRef.current.value || (storageContext ? 'Guia Remision' : 'Boleta'))
    formData.append('document_series', documentSeriesRef.current.value || '')
    formData.append('document_sequence', documentSequenceRef.current.value || '')
    formData.append('document_date', storageContext ? (documentDateRef.current?.value || '') : '')
    formData.append('invoice_type', storageContext ? (invoiceTypeRef.current?.value || '') : '')
    formData.append('invoice_series', storageContext ? (invoiceSeriesRef.current?.value || '') : '')
    formData.append('invoice_sequence', storageContext ? (invoiceSequenceRef.current?.value || '') : '')
    formData.append('invoice_date', storageContext ? (invoiceDateRef.current?.value || '') : '')
    formData.append('dua_number', storageContext ? (duaNumberRef.current?.value || '') : '')
    formData.append('transport_agency', storageContext ? (transportAgencyRef.current?.value || '') : '')
    formData.append('driver_name', storageContext ? (driverNameRef.current?.value || '') : '')
    formData.append('driver_license', storageContext ? (driverLicenseRef.current?.value || '') : '')
    formData.append('vehicle_plate', storageContext ? (vehiclePlateRef.current?.value || '') : '')
    formData.append('currency', storageContext ? 'PEN' : (currencyRef.current.value || 'PEN'))
    formData.append('observations', observationsRef.current.value || '')
    formData.append('guide_series', storageContext ? '' : (guideSeriesRef.current.value || ''))
    formData.append('guide_sequence', storageContext ? '' : (guideSequenceRef.current.value || ''))
    formData.append('guide_ruc', storageContext ? '' : (guideRucRef.current.value || ''))
    formData.append('items', JSON.stringify(items.map(item => {
      const selectedLot = selectedStorageLotForItem(item)
      const location = locationCodeFromValue(Array.isArray(item.locations) ? item.locations[0] : item.location)
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
        warehouse_id: item.warehouse_id || selectedWarehouseId || null,
        stock: item.stock,
        cost_unit: costUnit,
        location: storageContext ? location : (item.location ?? '').toString().trim(),
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

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await entryNotesRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar nota de entrada',
      text: 'Estas seguro de eliminar esta nota de entrada? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await entryNotesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onBusinessChanged = async (e) => {
    const businessId = e.target.value || ''
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId('')
    if (warehouseRef.current) $(warehouseRef.current).empty().trigger('change')
    setItems(prev => prev.map(item => ({ ...item, warehouse_id: '', stock: 0 })))
    await Promise.all([
      loadBranches(businessId, null),
      loadWarehouses(businessId),
    ])
  }

  const onWarehouseChanged = async (e) => {
    const warehouseId = e.target.value || ''
    setSelectedWarehouseId(warehouseId)
    const updatedItems = items.map(item => ({ ...item, warehouse_id: warehouseId }))
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

  const onItemBatchChanged = async (uid, e) => {
    const selected = $(e.target).select2('data')?.[0]
    const batch = selected?.data ?? null
    const batchId = e.target.value || ''
    const currentItem = items.find(item => item.uid === uid)

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (!batchId) {
        return {
          ...item,
          batch_id: '',
          batch_label: '',
          batch_code: '',
          lot: '',
          article_id: '',
          article_label: '',
          article_laboratory: '',
          article_principle: '',
          article_unit: '',
          stock: 0,
        }
      }
      if (!batch) {
        return {
          ...item,
          batch_id: batchId,
          batch_label: selected?.text ?? batchId,
          batch_code: selected?.text ?? batchId,
          lot: selected?.text ?? batchId,
          warehouse_id: selectedWarehouseId || item.warehouse_id,
        }
      }

      const article = batch.article ?? null
      const nextArticleId = article?.id ? `${article.id}` : item.article_id
      return {
        ...item,
        batch_id: batchId,
        batch_label: selected?.text ?? batch.lot ?? item.batch_label,
        batch_code: batch.lot ?? item.batch_code,
        lot: batch.lot ?? item.lot,
        article_id: nextArticleId,
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : item.article_label,
        article_laboratory: article?.laboratory?.name ?? item.article_laboratory,
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? item.article_principle,
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? item.article_unit,
        warehouse_id: selectedWarehouseId || item.warehouse_id,
      }
    }))

    if (!batch && currentItem?.article_id && selectedWarehouseId) {
      await refreshItemStock(uid, currentItem.article_id, selectedWarehouseId)
    }

    if (batch?.article?.id && selectedWarehouseId) {
      await refreshItemStock(uid, batch.article.id, selectedWarehouseId)
    }
  }

  const storageLocationsForWarehouse = (warehouseId, selectedLocation = '') => {
    if (!warehouseId) return []
    const selectedCode = locationCodeFromValue(selectedLocation)
    return (storageOptions.locations ?? [])
      .filter(location => `${location.warehouse_id}` === `${warehouseId}` && (location.status === true || location.status === 1 || location.status === '1'))
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

  const onStorageLocationsChanged = (uid, e) => {
    const selected = locationCodeFromValue(e.target.value)
    setItems(prev => prev.map(item => item.uid === uid ? {
      ...item,
      locations: selected ? [selected] : [],
      location: selected,
    } : item))
  }

  const onCreateBatchForItem = async (uid) => {
    if (!selectedBusinessId) {
      await Swal.fire({ icon: 'warning', title: 'Empresa requerida', text: 'Selecciona la empresa antes de crear un lote' })
      return
    }
    if (storageContext && !currentStorageClientId()) {
      await Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona el cliente antes de crear un lote' })
      return
    }

    const currentItem = items.find(item => item.uid === uid)
    setCreateBatchTargetUid(uid)
    setCreateBatchArticleId(currentItem?.article_id || '')
    if (createBatchLotRef.current) createBatchLotRef.current.value = currentItem?.lot || ''
    if (createBatchExpirationRef.current) createBatchExpirationRef.current.value = ''
    if (currentItem?.article_id && currentItem?.article_label && createBatchArticleRef.current) {
      SetSelectValue(createBatchArticleRef.current, currentItem.article_id, currentItem.article_label)
    } else if (createBatchArticleRef.current) {
      $(createBatchArticleRef.current).empty().trigger('change')
    }
    $(createBatchModalRef.current).modal('show')
  }

  const onCreateBatchModalSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBusinessId) return

    const lot = (createBatchLotRef.current?.value ?? '').trim()
    const expiration = createBatchExpirationRef.current?.value ?? ''
    if (!createBatchArticleId || !lot || !expiration) return

    const createdBatch = await entryNotesRest.createBatch({
      business_id: selectedBusinessId,
      article_id: createBatchArticleId,
      lot,
      expiration_date: expiration,
    })
    if (!createdBatch?.id) return

    const selectedArticle = $(createBatchArticleRef.current).select2('data')?.[0] ?? null
    const hydratedBatch = await entryNotesRest.getBatchById(createdBatch.id)
    const batchData = hydratedBatch ?? createdBatch
    const articleData = batchData?.article ?? await entryNotesRest.getArticleById(createBatchArticleId)
    const selectedArticleText = selectedArticle?.text ?? ''

    const articleLabel = articleData
      ? [articleData.code, articleData.name].filter(Boolean).join(' - ')
      : selectedArticleText

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
        const stockData = await entryNotesRest.getCurrentStock(articleId, warehouseId)
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
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const openStorageDetailPdf = async (data) => {
    const detail = await loadEntryNoteDetail(data)
    openMagistralesRecordPdf(buildMagistralesRows.storageEntryNote(detail))
  }

  const openStorageActaPdf = async (data) => {
    const detail = await loadEntryNoteDetail(data)
    openMagistralesRecordPdf(buildMagistralesRows.storageEntryNoteActa(detail))
  }

  const storageExportRows = () => {
    const grid = $(gridRef.current).dxDataGrid('instance')
    return (grid.getVisibleRows() ?? []).map(row => row.data).filter(Boolean)
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
    const rows = storageExportRows()
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

  const downloadStorageCsv = () => {
    const rows = storageExportRows()
    const csv = [
      storageExportColumns.map(([title]) => `"${title}"`).join(','),
      ...rows.map(row => storageExportColumns.map(([, getter]) => `"${`${getter(row)}`.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadStorageBlob(blob, 'notas-entrada.csv')
  }

  const downloadStorageExcel = () => {
    const rows = storageExportRows()
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

  const downloadStoragePdf = () => {
    const JsPDF = window.jspdf?.jsPDF || window.jsPDF
    if (!JsPDF) {
      printStorageGrid()
      return
    }
    const rows = storageExportRows()
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

  const storageColumns = [
    {
      caption: 'Acciones',
      width: 240,
      minWidth: 240,
      cellTemplate: (container, { data }) => {
        container.css({
          textOverflow: 'unset',
          overflow: 'visible',
          whiteSpace: 'nowrap'
        })
        const actions = $('<div>').css({
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'nowrap'
        })
        container.append(actions)
        const appendAction = (options) => actions.append(DxButton(options))
        const status = data?.entry_status ?? 'pending'
        if (status === 'approved') {
          appendAction({
            className: 'btn btn-xs btn-soft-warning',
            title: 'Ver nota de entrada',
            icon: 'mdi mdi-menu',
            onClick: () => onModalOpen(data, { viewOnly: true })
          })
          appendAction({
            className: 'btn btn-xs btn-soft-info',
            title: 'Vista previa de nota de entrada',
            icon: 'mdi mdi-eye',
            onClick: () => openStorageDetailPdf(data)
          })
          appendAction({
            className: 'btn btn-xs btn-soft-danger',
            title: 'Detalle de nota de entrada',
            icon: 'mdi mdi-file-pdf-box',
            onClick: () => openStorageDetailPdf(data)
          })
          appendAction({
            className: 'btn btn-xs btn-soft-info',
            title: 'Acta de nota de entrada',
            icon: 'mdi mdi-file-document-outline',
            onClick: () => openStorageActaPdf(data)
          })
          return
        }

        if (status !== 'cancelled') {
          appendAction({
            className: 'btn btn-xs btn-soft-success',
            title: 'Aprobar nota de entrada',
            icon: 'mdi mdi-check',
            onClick: () => onEntryStatusChange(data, 'approved')
          })
          appendAction({
            className: 'btn btn-xs btn-soft-danger',
            title: 'Anular nota de entrada',
            icon: 'mdi mdi-close',
            onClick: () => onEntryStatusChange(data, 'cancelled')
          })
          appendAction({
            className: 'btn btn-xs btn-soft-primary',
            title: 'Editar nota de entrada',
            icon: 'mdi mdi-pencil',
            onClick: () => onModalOpen(data)
          })
        }
        appendAction({
          className: 'btn btn-xs btn-soft-danger',
          title: 'Detalle de nota de entrada',
          icon: 'mdi mdi-file-pdf-box',
          onClick: () => openStorageDetailPdf(data)
        })
        appendAction({
          className: 'btn btn-xs btn-soft-info',
          title: 'Acta de nota de entrada',
          icon: 'mdi mdi-file-document-outline',
          onClick: () => openStorageActaPdf(data)
        })
      },
      allowFiltering: false,
      allowExporting: false
    },
    {
      dataField: 'code',
      caption: 'Codigo',
      minWidth: 110,
      cellTemplate: (container, { data }) => {
        const isApproved = data?.entry_status === 'approved'
        renderGridEditLink(container, data?.code ?? data?.id, () => onModalOpen(data, { viewOnly: isApproved }), isApproved ? 'Ver nota de entrada' : 'Editar nota de entrada')
      }
    },
    {
      dataField: 'client.full_name',
      caption: 'Cliente',
      minWidth: 260,
      cellTemplate: (container, { data }) => container.text(clientLabel(data?.client))
    },
    { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 140 },
    { dataField: 'document_type', caption: 'Tipo de documento', minWidth: 140 },
    { dataField: 'document_series', caption: 'Serie', width: 90 },
    { dataField: 'document_sequence', caption: 'Secuencia', width: 120 },
    { dataField: 'entry_date', caption: 'Fecha de ingreso', dataType: 'date', minWidth: 140 },
    {
      dataField: 'creator.fullname',
      caption: 'Usuario registro',
      minWidth: 150,
      cellTemplate: (container, { data }) => container.text(formatAuditUser(data.creator))
    },
    { dataField: 'created_at', caption: 'Fecha registro', dataType: 'datetime', minWidth: 150 },
    {
      dataField: 'entry_status',
      caption: 'Estado',
      width: 110,
      cellTemplate: (container, { data }) => {
        const status = data?.entry_status ?? 'pending'
        const className = status === 'approved' ? 'badge bg-success' : status === 'cancelled' ? 'badge bg-danger' : 'badge bg-warning text-dark'
        ReactAppend(container, <span className={className}>{entryStatusLabel(status)}</span>)
      }
    },
  ]

  const standardColumns = [
    { dataField: 'id', caption: 'ID', visible: false },
    {
      dataField: 'business.name',
      caption: 'Empresa',
      minWidth: 150,
      cellTemplate: (container, { data }) => renderGridEditLink(container, data?.business?.name, () => onModalOpen(data), 'Editar nota de entrada')
    },
    { dataField: 'branch.name', caption: 'Sede', minWidth: 140 },
    { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 140 },
    { dataField: 'supplier.business_name', caption: 'Proveedor', minWidth: 200 },
    { dataField: 'document_type', caption: 'Tipo doc', width: 110 },
    { dataField: 'document_series', caption: 'Serie', width: 90 },
    { dataField: 'document_sequence', caption: 'Secuencia', width: 110 },
    { dataField: 'currency', caption: 'Moneda', width: 90 },
    {
      dataField: 'items.id',
      caption: 'Detalle',
      minWidth: 240,
      allowFiltering: false,
      cellTemplate: (container, { data }) => {
        const lines = (data?.items ?? []).map(item => {
          const article = item?.article
          const label = [item?.lot || '-', article?.name || 'Articulo'].join(' - ')
          return `${label} | Cant. ${Number(item?.quantity || 0).toFixed(2)} | S/. ${Number(item?.total || 0).toFixed(2)}`
        })
        ReactAppend(container, <div>
          {lines.length === 0 && <small className='text-muted'>Sin detalle</small>}
          {lines.map((line, idx) => <div key={`entry-note-${data.id}-item-${idx}`}><small>{line}</small></div>)}
        </div>)
      }
    },
    {
      dataField: 'creator.fullname',
      caption: 'Creado por',
      visible: false,
      cellTemplate: (container, { data }) => container.text(formatAuditUser(data.creator))
    },
    {
      dataField: 'updater.fullname',
      caption: 'Actualizado por',
      visible: false,
      cellTemplate: (container, { data }) => container.text(formatAuditUser(data.updater))
    },
    {
      dataField: 'status',
      caption: 'Estado',
      dataType: 'boolean',
      width: '95px',
      cellTemplate: (container, { data }) => {
        $(container).empty()
        if (data.status === null) return
        ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({
          id: data.id,
          field: 'status',
          value: !data.status
        })} />)
      }
    },
    {
      caption: 'Acciones',
      width: '120px',
      cellTemplate: (container, { data }) => {
        container.css('text-overflow', 'unset')
        container.append(DxButton({
          className: 'btn btn-xs btn-soft-primary',
          title: 'Editar',
          icon: 'mdi mdi-pencil',
          onClick: () => onModalOpen(data)
        }))
        container.append(DxButton({
          className: 'btn btn-xs btn-soft-danger',
          title: 'Eliminar nota de entrada',
          icon: 'mdi mdi-delete',
          onClick: () => onDeleteClicked(data.id)
        }))
      },
      allowFiltering: false,
      allowExporting: false
    }
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

  const toggleLotSearchPage = (checked) => {
    const pageIds = lotSearchPageRows.map(row => row.id)
    setLotSearchSelectedIds(prev => {
      if (checked) return [...new Set([...prev, ...pageIds])]
      return prev.filter(id => !pageIds.includes(id))
    })
  }

  return (<>
    {storageContext && <div className='card mb-3'>
      <div className='card-header'>Nota de entrada registrados</div>
      <div className='card-body'>
        <div className='row align-items-end'>
          <SelectFormGroup
            label='Cliente'
            col='col-md-4'
            value={storageFilterClientId}
            onChange={(e) => setStorageFilterClientId(e.target.value)}
            effectWith={[storageOptions.clients.length]}
          >
            <option value=''>Seleccione</option>
            {storageOptions.clients.map(client => <option key={`entry-note-filter-client-${client.id}`} value={client.id}>{clientLabel(client)}</option>)}
          </SelectFormGroup>
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

    <Table
      gridRef={gridRef}
      title={storageContext ? 'Nota de entrada' : 'Notas de entrada'}
      rest={entryNotesRest}
      toolBar={(container) => {
        if (storageContext) {
          [
            { text: 'Imprimir', onClick: printStorageGrid },
            { text: 'PDF', onClick: downloadStoragePdf },
            { text: 'Excel', onClick: downloadStorageExcel },
            { text: 'CSV', onClick: downloadStorageCsv },
            { text: 'Copiar', onClick: copyStorageGrid },
          ].forEach(item => {
            container.unshift({
              widget: 'dxButton',
              location: 'before',
              options: {
                text: item.text,
                stylingMode: 'outlined',
                onClick: item.onClick
              }
            });
          })
        }
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'add',
            title: 'Agregar',
            hint: 'Agregar nota de entrada',
            onClick: () => onModalOpen(null)
          }
        });
      }}
      pageSize={storageContext ? 10 : 25}
      exportable={storageContext}
      filterValue={storageContext ? storageGridFilter : null}
      columns={storageContext ? storageColumns : standardColumns}
    />

    <Modal
      modalRef={modalRef}
      title={isViewing ? 'Ver nota de entrada' : (storageContext ? 'Registrar nota de entrada' : (isEditing ? 'Editar nota de entrada' : 'Agregar nota de entrada'))}
      onSubmit={onModalSubmit}
      size='full-width'
      hideButtonSubmit={isViewing}
    >
      {storageContext ? (
        <fieldset className='row' id='entry-note-form-container' disabled={isViewing}>
          <input ref={idRef} type='hidden' />

          <SelectAPIFormGroup
            eRef={storageClientRef}
            label='Cliente'
            col='col-md-6'
            required
            searchAPI='/api/admin/storage/clients/paginate'
            searchBy='full_name'
            dropdownParent='#entry-note-form-container'
            onChange={onStorageClientChanged}
          />
          <InputFormGroup eRef={providerDistributorRef} label='Proveedor/Distribuidor' col='col-md-6' />

          <SelectFormGroup
            label='Almacen'
            col='col-md-6'
            required
            value={selectedWarehouseId}
            onChange={onWarehouseChanged}
            effectWith={[storageOptions.warehouses.length, selectedWarehouseId]}
          >
            <option value=''>Seleccione</option>
            {storageOptions.warehouses.map(warehouse => <option key={`entry-note-warehouse-${warehouse.id}`} value={warehouse.id}>{warehouse.name}</option>)}
          </SelectFormGroup>
          <InputFormGroup eRef={entryDateRef} label='Fecha ingreso' col='col-md-6' type='date' required />

          <div className='form-group col-md-3 mb-2'>
            <label className='form-label'>Tipo documento <b className='text-danger'>*</b></label>
            <select ref={documentTypeRef} className='form-control' required>
              <option value='Guia Remision'>Guia Remision</option>
              <option value='Factura'>Factura</option>
              <option value='Boleta'>Boleta</option>
              <option value='Nota de salida interna'>Nota de salida interna</option>
              <option value='Nota de entrada interna'>Nota de entrada interna</option>
            </select>
          </div>
          <InputFormGroup eRef={documentSeriesRef} label='Serie' col='col-md-3' required />
          <InputFormGroup eRef={documentSequenceRef} label='Secuencia' col='col-md-3' required />
          <InputFormGroup eRef={documentDateRef} label='Fecha Documento' col='col-md-3' type='date' required />

          <hr className='my-3' />

          <div className='form-group col-md-3 mb-2'>
            <label className='form-label'>Invoice</label>
            <select ref={invoiceTypeRef} className='form-control'>
              <option value=''>Invoice</option>
              <option value='Invoice'>Invoice</option>
              <option value='Factura'>Factura</option>
            </select>
          </div>
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
            <div className='table-responsive border rounded'>
              <table className='table table-sm table-bordered mb-0'>
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
                          <SelectFormGroup
                            col='col-12'
                            noMargin
                            value={selectedLocation}
                            disabled={locations.length === 0}
                            onChange={(e) => onStorageLocationsChanged(item.uid, e)}
                            effectWith={[locations.length, selectedLocation]}
                          >
                            <option value=''>Seleccione</option>
                            {locations.map(location => (
                              <option key={`entry-note-location-${item.uid}-${location.id}`} value={`${location.code}`}>
                                {storageLocationOptionLabel(location)}{location.occupancy_status === 'Ocupado' ? ' | Ocupado' : ''}
                              </option>
                            ))}
                          </SelectFormGroup>
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

        <SelectAPIFormGroup
          eRef={businessRef}
          label='Empresa'
          col='col-md-3'
          required
          searchAPI='/api/admin/businesses/paginate'
          searchBy='name'
          dropdownParent='#entry-note-form-container'
          onChange={onBusinessChanged}
        />
        <SelectFormGroup
          eRef={branchRef}
          label='Sede'
          col='col-md-3'
          dropdownParent='#entry-note-form-container'
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          effectWith={[selectedBranchId, branches.length]}
        >
          <option value=''>-- Seleccione sede --</option>
          {branches.map(branch => <option key={`branch-${branch.id}`} value={branch.id}>{branch.name}</option>)}
        </SelectFormGroup>
        <SelectAPIFormGroup
          eRef={warehouseRef}
          label='Almacen'
          col='col-md-3'
          required
          searchAPI='/api/admin/warehouses/paginate'
          searchBy='name'
          filter={selectedBusinessId ? ['branch.business_id', '=', Number(selectedBusinessId)] : undefined}
          dropdownParent='#entry-note-form-container'
          onChange={onWarehouseChanged}
        />
        <SelectAPIFormGroup
          eRef={supplierRef}
          label='Proveedor'
          col='col-md-3'
          searchAPI='/api/admin/suppliers/paginate'
          searchBy='business_name'
          dropdownParent='#entry-note-form-container'
          onChange={(e) => setSelectedSupplierId(e.target.value || '')}
        />

        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Tipo documento</label>
          <select ref={documentTypeRef} className='form-control'>
            <option value='Boleta'>Boleta</option>
            <option value='Factura'>Factura</option>
            <option value='Ticket'>Ticket</option>
            <option value='Otro'>Otro</option>
          </select>
        </div>
        <InputFormGroup eRef={documentSeriesRef} label='Serie' col='col-md-2' />
        <InputFormGroup eRef={documentSequenceRef} label='Secuencia' col='col-md-2' />
        <div className='form-group col-md-3 mb-2'>
          <label className='form-label'>Archivo</label>
          <input ref={documentFileRef} type='file' className='form-control' />
        </div>
        <div className='form-group col-md-3 mb-2'>
          <label className='form-label'>Moneda</label>
          <select ref={currencyRef} className='form-control'>
            <option value='PEN'>PEN</option>
            <option value='USD'>USD</option>
            <option value='EUR'>EUR</option>
          </select>
        </div>

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
                  <th>Codigo Lote</th>
                  <th>Lote</th>
                  <th>Articulo</th>
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
                  return (
                    <tr key={item.uid}>
                      <td style={{ width: '20%' }}>
                        <div className='d-flex gap-1 align-items-center'>
                          <div style={{ flex: 1 }}>
                            <SelectAPIFormGroup
                              eRef={getBatchRef(item.uid)}
                              col='col-12'
                              searchAPI='/api/admin/batches/paginate'
                              searchBy='lot'
                              filter={batchFilter ?? undefined}
                              dropdownParent='#entry-note-form-container'
                              onChange={(e) => onItemBatchChanged(item.uid, e)}
                            />
                          </div>
                          <button type='button' className='btn btn-xs btn-soft-success' title='Crear lote' onClick={() => onCreateBatchForItem(item.uid)}>
                            <i className='mdi mdi-plus'></i>
                          </button>
                        </div>
                      </td>
                      <td><input className='form-control form-control-sm' value={item.lot} readOnly /></td>
                      <td><input className='form-control form-control-sm' value={item.article_label} readOnly /></td>
                      <td><small>{articleExtra}</small></td>
                      <td><small>{unitLabel}</small></td>
                      <td><input className='form-control form-control-sm bg-light text-muted' type='number' min='0' step='0.001' value={Number(item.stock || 0).toFixed(3)} readOnly tabIndex='-1' /></td>
                      <td><input className='form-control form-control-sm' value={getWarehouseName(item.warehouse_id || selectedWarehouseId)} readOnly /></td>
                      <td><input className='form-control form-control-sm' type='number' min='0' step='0.0001' value={item.cost_unit} onChange={(e) => onItemUpdated(item.uid, 'cost_unit', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' value={item.location} onChange={(e) => onItemUpdated(item.uid, 'location', e.target.value)} /></td>
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
          <SelectFormGroup
            label='Seleccionar almacen'
            col='col-md-6'
            value={lotSearchWarehouseId}
            onChange={(e) => setLotSearchWarehouseId(e.target.value)}
            effectWith={[storageOptions.warehouses.length, lotSearchWarehouseId]}
          >
            <option value=''>Seleccione</option>
            {storageOptions.warehouses.map(warehouse => <option key={`entry-note-lot-search-warehouse-${warehouse.id}`} value={warehouse.id}>{warehouse.name}</option>)}
          </SelectFormGroup>
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
          <label className='d-flex align-items-center gap-2 mb-0'>
            <span>Elementos:</span>
            <select
              className='form-select form-select-sm'
              style={{ width: 80 }}
              value={lotSearchPageSize}
              onChange={(e) => {
                setLotSearchPageSize(Number(e.target.value))
                setLotSearchPage(1)
              }}
            >
              {[10, 20, 50].map(size => <option key={`entry-note-lot-search-size-${size}`} value={size}>{size}</option>)}
            </select>
          </label>
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

    <Modal modalRef={createBatchModalRef} title='Crear lote' onSubmit={onCreateBatchModalSubmit} size='md'>
      <div className='row' id='entry-note-create-batch-container'>
        <SelectAPIFormGroup
          eRef={createBatchArticleRef}
          label='Articulo'
          col='col-12'
          required
          searchAPI={storageContext ? '/api/admin/storage/articles/paginate' : '/api/admin/articles/paginate'}
          searchBy='name'
          filter={storageArticleClientFilter ?? undefined}
          dropdownParent='#entry-note-create-batch-container'
          onChange={(e) => setCreateBatchArticleId(e.target.value || '')}
        />
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
