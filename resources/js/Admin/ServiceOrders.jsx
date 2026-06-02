import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import ServiceOrdersRest from '../Actions/Admin/ServiceOrdersRest';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import {
  getServiceOrderStatusLabel,
  serviceOrderStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const serviceOrdersRest = new ServiceOrdersRest()
const formatGridUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const emptyItem = () => ({
  uid: crypto.randomUUID(),
  service_id: '',
  scope: '',
  gloss: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  detraction_percent: 0,
  commission_percent: 0,
  total: 0,
})
const normalizeStorageText = (value = '') => value.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
const storageServiceTypeNames = ['Servicio de almacenamiento', 'Servicio de almacenamiento - Adicional']
const currencyOptions = [
  { value: 'PEN', label: 'Soles' },
  { value: 'USD', label: 'Dolares' },
]
const storageBusinessKey = 'kamary_medicals'
const storageWarehouseName = (warehouse) => warehouse?.name ?? warehouse?.warehouse_name ?? ''
const storageWarehouseId = (warehouse) => warehouse?.id ?? warehouse?.warehouse_id ?? ''
const storageOrderStatusLabel = (value) => value === 'approved' ? 'Aprobado' : getServiceOrderStatusLabel(value)
const findDefaultStorageBusiness = (rows = []) => rows.find(row => `${row.business_key ?? ''}` === storageBusinessKey)
  ?? rows.find(row => normalizeStorageText([row.name, row.trade_name].filter(Boolean).join(' ')).includes('kamarymedicals'))
  ?? rows[0]
const storageBlockFromWarehouse = (warehouse) => {
  const warehouseId = storageWarehouseId(warehouse)
  const warehouseName = storageWarehouseName(warehouse)
  return {
    key: warehouseId ? `warehouse-${warehouseId}` : normalizeStorageText(warehouseName),
    warehouse_name: warehouseName,
    warehouse_id: warehouseId ? `${warehouseId}` : '',
    enabled: false,
    location_id: '',
    location_ids: [],
    location_label: '',
    location_labels: [],
    start_date: '',
    months: '',
    end_date: '',
    billing_dates: [],
    quantity_m3: '',
    tariff: '',
    monthly_amount: '',
  }
}
const emptyStorageBlocks = (warehouses = []) => warehouses
  .filter(warehouse => warehouse?.status !== null)
  .map(storageBlockFromWarehouse)
const toInputDate = (value) => value?.toString?.().slice?.(0, 10) ?? ''
const toNumber = (value) => Number(value || 0)
const addMonths = (dateValue, monthsValue, allowZero = false) => {
  if (!dateValue) return ''
  const months = Number(monthsValue)
  if (!Number.isFinite(months) || months < 0 || (!allowZero && months <= 0)) return ''
  const date = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  const result = new Date(date)
  const day = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  result.setDate(Math.min(day, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()))
  return result.toISOString().slice(0, 10)
}
const billingDateRows = (startDate, monthsValue) => {
  const months = Number.parseInt(monthsValue, 10)
  if (!startDate || !Number.isFinite(months) || months <= 0) return []
  return Array.from({ length: months }, (_, index) => ({
    month: index + 1,
    date: addMonths(startDate, index, true),
  }))
}
const storageLocationLabel = (location) => {
  if (!location) return ''
  return [location.code, location.temperature_range].filter(Boolean).join(' | ')
}
const splitLocationLabels = (value = '') => value
  .split(',')
  .map(label => label.trim())
  .filter(Boolean)
const blockLocationIds = (block) => {
  if (Array.isArray(block.location_ids)) return block.location_ids.filter(Boolean).map(value => `${value}`)
  return block.location_id ? [`${block.location_id}`] : []
}
const buildStorageDescription = (block, locations) => [
  block.warehouse_name,
  (Array.isArray(locations) ? locations.map(storageLocationLabel).filter(Boolean).join(', ') : storageLocationLabel(locations))
    || block.location_label,
  `${block.start_date || ''} - ${block.end_date || ''}`,
  `${block.months || 0} meses`,
  `${block.quantity_m3 || 0} m3`,
].filter(Boolean).join('; ')
const parseStorageDescription = (description = '') => {
  const parts = description.split(';').map(part => part.trim())
  const dates = (parts[2] ?? '').split('-').map(part => part.trim())
  return {
    warehouse_name: parts[0] ?? '',
    location_label: parts[1] ?? '',
    location_labels: splitLocationLabels(parts[1] ?? ''),
    start_date: dates.length >= 3 ? `${dates[0]}-${dates[1]}-${dates[2]}`.slice(0, 10) : '',
    end_date: dates.length >= 6 ? `${dates[3]}-${dates[4]}-${dates[5]}`.slice(0, 10) : '',
    months: parseFloat(parts[3]) || '',
    quantity_m3: parseFloat(parts[4]) || '',
  }
}

const ServiceOrders = ({ moduleTitle = 'Ordenes de servicio', serviceOrderType = 'service' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const issueDateRef = useRef()
  const scheduledAtRef = useRef()
  const firstDueDateRef = useRef()
  const expectedDocumentTypeRef = useRef()
  const currencyRef = useRef()
  const billingCycleRef = useRef()
  const contractLabelRef = useRef()
  const paymentConditionRef = useRef()
  const installmentsRef = useRef()
  const billingDayRef = useRef()
  const orderStatusRef = useRef()
  const billingStatusRef = useRef()
  const taxAmountRef = useRef()
  const observationsRef = useRef()
  const storageCatalogPromiseRef = useRef(null)
  const businessSelectRef = useRef()
  const branchSelectRef = useRef()
  const clientSelectRef = useRef()
  const storageServiceSelectRef = useRef()
  const quickServiceModalRef = useRef()
  const quickServiceTargetUidRef = useRef('')
  const quickServiceNameRef = useRef()
  const quickServiceDescriptionRef = useRef()
  const quickServicePriceRef = useRef()

  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedStorageServiceId, setSelectedStorageServiceId] = useState('')
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('PEN')
  const [detractionEnabled, setDetractionEnabled] = useState(false)
  const [activeServiceTab, setActiveServiceTab] = useState('services')
  const [serviceFilterClientId, setServiceFilterClientId] = useState('')
  const [serviceFilterStart, setServiceFilterStart] = useState('')
  const [serviceFilterEnd, setServiceFilterEnd] = useState('')
  const [serviceGridFilter, setServiceGridFilter] = useState(null)
  const [serviceSummary, setServiceSummary] = useState({ penTotal: 0, penBilled: 0, usdTotal: 0, usdBilled: 0 })
  const [items, setItems] = useState([emptyItem()])
  const [storageWarehouses, setStorageWarehouses] = useState([])
  const [storageLocations, setStorageLocations] = useState([])
  const [storageBlocks, setStorageBlocks] = useState(() => emptyStorageBlocks())
  const [isStorageCatalogLoaded, setIsStorageCatalogLoaded] = useState(false)
  const [openLocationPickerKey, setOpenLocationPickerKey] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const isStorageGeneral = serviceOrderType === 'storage_general'
  const isStorageService = serviceOrderType === 'storage_service'
  const isStorageOrderList = isStorageGeneral || isStorageService
  const isServiceOrderContext = !isStorageOrderList
  const storageServiceTypeOptions = services.filter(service => storageServiceTypeNames.some(name => normalizeStorageText(name) === normalizeStorageText(service.name)))
  const serviceMap = Object.fromEntries(services.map(row => [`${row.id}`, row]))

  const loadStorageCatalog = async () => {
    if (!isStorageService) return { warehouseRows: [], locationRows: [] }

    if (!storageCatalogPromiseRef.current) {
      storageCatalogPromiseRef.current = (async () => {
        const storageOptions = await serviceOrdersRest.getStorageOptions()
        let warehouseRows = (storageOptions?.warehouses ?? []).filter(row => row.status !== null)
        let locationRows = (storageOptions?.locations ?? []).filter(row => row.status !== null)

        if (!warehouseRows.length || !locationRows.length) {
          const [fallbackLocations, fallbackWarehouses] = await Promise.all([
            locationRows.length ? Promise.resolve(locationRows) : serviceOrdersRest.getStorageLocations(),
            warehouseRows.length ? Promise.resolve(warehouseRows) : serviceOrdersRest.getStorageWarehouses(),
          ])
          warehouseRows = (warehouseRows.length ? warehouseRows : (fallbackWarehouses ?? [])).filter(row => row.status !== null)
          locationRows = (locationRows.length ? locationRows : (fallbackLocations ?? [])).filter(row => row.status !== null)
        }

        return { warehouseRows, locationRows }
      })()
    }

    const { warehouseRows, locationRows } = await storageCatalogPromiseRef.current
    setStorageWarehouses(warehouseRows)
    setStorageLocations(locationRows)
    setIsStorageCatalogLoaded(true)
    return { warehouseRows, locationRows }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      const storageCatalogPromise = isStorageService ? loadStorageCatalog() : Promise.resolve({ warehouseRows: [], locationRows: [] })
      const [businessList, clientList, , storageCatalog] = await Promise.all([
        serviceOrdersRest.getBusinesses(),
        serviceOrdersRest.getClients(),
        loadServices(),
        storageCatalogPromise,
      ])
      const activeBusinesses = businessList ?? []
      setBusinesses(activeBusinesses)
      setClients((clientList ?? []).filter(row => row.status !== null))

      if (isStorageService) {
        setStorageBlocks(emptyStorageBlocks(storageCatalog.warehouseRows))
      }

      if (isStorageOrderList || isServiceOrderContext) {
        const defaultBusiness = isStorageOrderList ? findDefaultStorageBusiness(activeBusinesses) : activeBusinesses[0]
        if (defaultBusiness) {
          setSelectedBusinessId(`${defaultBusiness.id}`)
          const branchRows = await loadBranches(defaultBusiness.id)
          if (branchRows[0]?.id) setSelectedBranchId(`${branchRows[0].id}`)
        }
      }
    }
    loadInitialData()
  }, [])

  useLayoutEffect(() => {
    if (!isServiceOrderContext) return
    serviceOrdersRest.deleted = activeServiceTab === 'deleted'
    setServiceSummary({ penTotal: 0, penBilled: 0, usdTotal: 0, usdBilled: 0 })
    const instance = gridRef.current ? $(gridRef.current).dxDataGrid('instance') : null
    if (instance) {
      instance.pageIndex(0)
      instance.getDataSource().reload()
    }
  }, [activeServiceTab])

  const applyServiceFilters = () => {
    const filter = []
    if (serviceFilterClientId) filter.push(['client_id', '=', Number(serviceFilterClientId)])
    if (serviceFilterStart) filter.push(['created_at', '>=', `${serviceFilterStart} 00:00:00`])
    if (serviceFilterEnd) filter.push(['created_at', '<=', `${serviceFilterEnd} 23:59:59`])

    setServiceGridFilter(filter.length ? filter.reduce((carry, row) => carry.length ? [...carry, 'and', row] : row, []) : null)
  }

  const resetServiceFilters = () => {
    setServiceFilterClientId('')
    setServiceFilterStart('')
    setServiceFilterEnd('')
    setServiceGridFilter(null)
  }

  const onServiceGridRefresh = (result) => {
    const rows = result?.data ?? []
    const summary = rows.reduce((carry, row) => {
      const currency = `${row.currency ?? 'PEN'}`.toUpperCase()
      const total = Number(row.total || 0)
      const billed = row.billing_status === 'billed' || row.order_status === 'invoiced' ? total : Number(row.paid_amount || 0)
      if (currency === 'USD') {
        carry.usdTotal += total
        carry.usdBilled += billed
      } else {
        carry.penTotal += total
        carry.penBilled += billed
      }
      return carry
    }, { penTotal: 0, penBilled: 0, usdTotal: 0, usdBilled: 0 })
    setServiceSummary(summary)
  }

  const loadBranches = async (businessId, preferred = '') => {
    const data = await serviceOrdersRest.getBranchesByBusiness(businessId)
    const branchRows = data ?? []
    setBranches(branchRows)
    setSelectedBranchId(preferred ? `${preferred}` : '')
    return branchRows
  }

  const loadServices = async () => {
    const serviceList = await serviceOrdersRest.getServices()
    const activeServices = (serviceList ?? []).filter(row => row.status !== null)
    setServices(activeServices)
    return activeServices
  }

  const recalc = (row) => ({ ...row, total: Number(row.quantity || 0) * Number(row.unit_price || 0) })
  const currentSelectValue = (ref, fallback = '') => ref.current?.value || fallback || ''
  const normalizeClientIdValue = (value = '') => {
    const text = `${value ?? ''}`.trim()
    const match = text.match(/^client-(\d+)$/i)
    return match ? match[1] : text
  }
  const findStorageWarehouse = (warehouseName, warehouseRows = storageWarehouses) => warehouseRows.find(row => normalizeStorageText(storageWarehouseName(row)) === normalizeStorageText(warehouseName))
  const blockWarehouseId = (block, warehouseRows = storageWarehouses) => block.warehouse_id || findStorageWarehouse(block.warehouse_name, warehouseRows)?.id || ''
  const locationOptionsForBlock = (block, locationRows = storageLocations, warehouseRows = storageWarehouses, clientValue = selectedClientId) => {
    const warehouseId = blockWarehouseId(block, warehouseRows)
    const currentClientId = normalizeClientIdValue(clientValue)
    return locationRows.filter(location => {
      if (!currentClientId || `${location.client_id ?? ''}` !== `${currentClientId}`) return false
      if (warehouseId && `${location.warehouse_id}` === `${warehouseId}`) return true
      return normalizeStorageText(location.warehouse_name) === normalizeStorageText(block.warehouse_name)
    })
  }
  const findStorageLocation = (block, locationRows = storageLocations, warehouseRows = storageWarehouses, clientValue = selectedClientId) => {
    const options = locationOptionsForBlock(block, locationRows, warehouseRows, clientValue)
    return options.find(location => `${location.id}` === `${block.location_id}`)
      ?? options.find(location => normalizeStorageText(storageLocationLabel(location)) === normalizeStorageText(block.location_label))
      ?? null
  }
  const findStorageLocations = (block, locationRows = storageLocations, warehouseRows = storageWarehouses, clientValue = selectedClientId) => {
    const options = locationOptionsForBlock(block, locationRows, warehouseRows, clientValue)
    const selectedIds = blockLocationIds(block)
    const byId = selectedIds.length
      ? options.filter(location => selectedIds.includes(`${location.id}`))
      : []
    if (byId.length) return byId

    const labels = Array.isArray(block.location_labels) && block.location_labels.length
      ? block.location_labels
      : splitLocationLabels(block.location_label)
    return labels
      .map(label => options.find(location => normalizeStorageText(storageLocationLabel(location)) === normalizeStorageText(label)))
      .filter(Boolean)
  }
  const buildStorageBlocksFromItems = (itemRows = [], warehouseRows = storageWarehouses, locationRows = storageLocations, clientValue = selectedClientId) => {
    const blocks = emptyStorageBlocks(warehouseRows)
    itemRows.forEach(row => {
      const parsed = parseStorageDescription(row.description ?? '')
      const index = blocks.findIndex(block => normalizeStorageText(block.warehouse_name) === normalizeStorageText(parsed.warehouse_name))
      if (index < 0) return
      const next = {
        ...blocks[index],
        enabled: true,
        warehouse_id: findStorageWarehouse(blocks[index].warehouse_name, warehouseRows)?.id ?? blocks[index].warehouse_id,
        location_label: parsed.location_label,
        location_labels: parsed.location_labels,
        start_date: parsed.start_date,
        months: parsed.months || '',
        end_date: parsed.end_date || addMonths(parsed.start_date, parsed.months),
        billing_dates: billingDateRows(parsed.start_date, parsed.months),
        quantity_m3: parsed.quantity_m3 || Number(row.quantity || 0) || '',
        tariff: Number(row.unit_price || 0) || '',
        monthly_amount: Number(row.total || 0) || '',
      }
      const locations = findStorageLocations(next, locationRows, warehouseRows, clientValue)
      blocks[index] = {
        ...next,
        location_id: locations[0]?.id ? `${locations[0].id}` : '',
        location_ids: locations.map(location => `${location.id}`),
      }
    })
    return blocks
  }
  const updateStorageBlock = (key, patch) => {
    setStorageBlocks(prev => prev.map(block => {
      if (block.key !== key) return block
      const patchLocationIds = 'location_ids' in patch
        ? (Array.isArray(patch.location_ids) ? patch.location_ids : [patch.location_ids]).filter(Boolean).map(value => `${value}`)
        : null
      const currentClientId = normalizeClientIdValue(selectedClientId)
      const scopedStorageLocations = storageLocations.filter(row => currentClientId && `${row.client_id ?? ''}` === `${currentClientId}`)
      const location = patch.location_id
        ? scopedStorageLocations.find(row => `${row.id}` === `${patch.location_id}`)
        : null
      const locations = patchLocationIds
        ? scopedStorageLocations.filter(row => patchLocationIds.includes(`${row.id}`))
        : null
      const next = {
        ...block,
        ...patch,
        warehouse_id: blockWarehouseId(block),
      }
      if (location) next.location_label = storageLocationLabel(location)
      if (locations) {
        next.location_ids = patchLocationIds
        next.location_id = patchLocationIds[0] ?? ''
        next.location_labels = locations.map(storageLocationLabel).filter(Boolean)
        next.location_label = next.location_labels.join(', ')
      }
      if ('start_date' in patch || 'months' in patch) {
        next.end_date = addMonths(next.start_date, next.months)
        next.billing_dates = billingDateRows(next.start_date, next.months)
      }
      if ('quantity_m3' in patch || 'tariff' in patch) {
        const amount = toNumber(next.quantity_m3) * toNumber(next.tariff)
        next.monthly_amount = amount ? amount.toFixed(2) : ''
      }
      return next
    }))
  }
  const updateStorageBillingDate = (key, index, date) => {
    setStorageBlocks(prev => prev.map(block => {
      if (block.key !== key) return block
      return {
        ...block,
        billing_dates: (block.billing_dates ?? []).map((row, rowIndex) => rowIndex === index ? { ...row, date } : row),
      }
    }))
  }
  const toggleStorageLocation = (block, locationId) => {
    const id = `${locationId}`
    const selectedIds = blockLocationIds(block)
    const nextIds = selectedIds.includes(id)
      ? selectedIds.filter(value => value !== id)
      : [...selectedIds, id]
    updateStorageBlock(block.key, { location_ids: nextIds })
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    issueDateRef.current.value = toInputDate(data?.issue_date) || new Date().toISOString().slice(0, 10)
    scheduledAtRef.current.value = toInputDate(data?.scheduled_at)
    firstDueDateRef.current.value = toInputDate(data?.first_due_date)
    expectedDocumentTypeRef.current.value = data?.expected_document_type ?? (isStorageOrderList ? '' : 'Factura')
    const nextCurrency = data?.currency ?? (isStorageOrderList ? '' : 'PEN')
    currencyRef.current.value = nextCurrency
    setSelectedCurrencyCode(nextCurrency || 'PEN')
    billingCycleRef.current.value = data?.billing_cycle ?? (isServiceOrderContext ? 'Unico' : '')
    if (contractLabelRef.current) contractLabelRef.current.value = data?.contract_label ?? ''
    paymentConditionRef.current.value = data?.payment_condition ?? 'Contado'
    installmentsRef.current.value = Number(data?.installments ?? 1)
    if (billingDayRef.current) billingDayRef.current.value = data?.billing_day ?? ''
    orderStatusRef.current.value = data?.order_status ?? (isStorageGeneral ? 'approved' : 'draft')
    billingStatusRef.current.value = data?.billing_status ?? 'pending'
    taxAmountRef.current.value = Number(data?.tax_amount ?? 0)
    observationsRef.current.value = data?.observations ?? ''
    setDetractionEnabled(Boolean(data?.detraction_enabled ?? (data?.items ?? []).some(row => Number(row.detraction_percent || 0) > 0)))
    const defaultBusiness = isStorageOrderList ? findDefaultStorageBusiness(businesses) : businesses[0]
    const nextBusinessId = data?.business_id ? `${data.business_id}` : (selectedBusinessId || (defaultBusiness?.id ? `${defaultBusiness.id}` : ''))
    setSelectedBusinessId(nextBusinessId)
    setSelectedClientId(data?.client_id ? `${data.client_id}` : '')
    const branchRows = await loadBranches(nextBusinessId, data?.business_branch_id ?? selectedBranchId)
    if (!data?.business_branch_id && !selectedBranchId && branchRows[0]?.id) setSelectedBranchId(`${branchRows[0].id}`)
    const itemRows = (data?.items ?? []).map(row => ({
      uid: crypto.randomUUID(),
      service_id: `${row.service_id}`,
      scope: row.scope ?? row.service?.category ?? '',
      gloss: row.gloss ?? row.description ?? row.service?.name ?? '',
      description: row.description ?? '',
      quantity: Number(row.quantity || 0),
      unit_price: Number(row.unit_price || 0),
      detraction_percent: Number(row.detraction_percent || 0),
      commission_percent: Number(row.commission_percent || 0),
      total: Number(row.total || 0),
    }))
    setSelectedStorageServiceId(itemRows[0]?.service_id ?? '')
    let warehouseRows = storageWarehouses
    let locationRows = storageLocations
    if (isStorageService && (!warehouseRows.length || !locationRows.length || !isStorageCatalogLoaded)) {
      const catalog = await loadStorageCatalog()
      warehouseRows = catalog.warehouseRows
      locationRows = catalog.locationRows
    }
    setStorageBlocks(isStorageService ? buildStorageBlocksFromItems(data?.items ?? [], warehouseRows, locationRows, data?.client_id ? `${data.client_id}` : selectedClientId) : emptyStorageBlocks())
    setItems(itemRows.length ? itemRows : (isStorageGeneral ? [] : [emptyItem()]))
    $(modalRef.current).modal('show')
  }

  const onItemChange = (uid, field, value) => {
    setItems(prev => prev.map(row => {
      if (row.uid !== uid) return row
      const next = { ...row, [field]: value }
      if (field === 'service_id') {
        const service = serviceMap[value]
        next.scope = next.scope || service?.category || ''
        next.gloss = next.gloss || service?.name || ''
        next.description = next.gloss || next.description || service?.name || ''
        next.unit_price = Number(currencyRef.current?.value === 'USD' ? service?.unit_price_usd : service?.unit_price_pen) || 0
      }
      if (field === 'gloss') next.description = value
      return recalc(next)
    }))
  }

  const onCurrencyChange = (value) => {
    setSelectedCurrencyCode(value || 'PEN')
    setItems(prev => prev.map(row => {
      if (!row.service_id) return row
      const service = serviceMap[row.service_id]
      return recalc({
        ...row,
        unit_price: Number(value === 'USD' ? service?.unit_price_usd : service?.unit_price_pen) || 0,
      })
    }))
  }

  const onQuickServiceOpen = (uid) => {
    quickServiceTargetUidRef.current = uid
    if (quickServiceNameRef.current) quickServiceNameRef.current.value = ''
    if (quickServiceDescriptionRef.current) quickServiceDescriptionRef.current.value = ''
    if (quickServicePriceRef.current) quickServicePriceRef.current.value = '0.00'
    $(quickServiceModalRef.current).modal('show')
    setTimeout(() => quickServiceNameRef.current?.focus(), 150)
  }

  const onQuickServiceSave = async (e) => {
    e.preventDefault()
    const name = quickServiceNameRef.current.value.trim()
    const observations = quickServiceDescriptionRef.current.value.trim()
    const unitPricePen = quickServicePriceRef.current.value || 0

    if (!name) {
      Swal.fire('Formulario incompleto', 'Ingresa el nombre del servicio general.', 'warning')
      return
    }

    const previousIds = new Set(services.map(row => `${row.id}`))
    const result = await serviceOrdersRest.saveStorageGeneralService({
      name,
      category: 'General',
      service_type: 'General',
      billing_unit: 'Servicio',
      unit_price_pen: unitPricePen,
      unit_price_usd: 0,
      observations,
      status: true,
    })
    if (!result) return

    const activeServices = await loadServices()
    const createdService = activeServices.find(row => !previousIds.has(`${row.id}`) && normalizeStorageText(row.name) === normalizeStorageText(name))
      ?? [...activeServices].reverse().find(row => normalizeStorageText(row.name) === normalizeStorageText(name))

    if (createdService && quickServiceTargetUidRef.current) {
      setItems(prev => prev.map(row => {
        if (row.uid !== quickServiceTargetUidRef.current) return row
        return recalc({
          ...row,
          service_id: `${createdService.id}`,
          scope: row.scope || createdService.category || '',
          gloss: row.gloss || createdService.name || '',
          description: row.description || row.gloss || createdService.name || '',
          unit_price: Number(currencyRef.current?.value === 'USD' ? createdService.unit_price_usd : createdService.unit_price_pen) || 0,
        })
      }))
    }

    $(quickServiceModalRef.current).modal('hide')
  }

  const showSaveSuccess = (result) => {
    Swal.fire({
      icon: 'success',
      title: 'Correcto',
      text: result?.message || 'Orden de servicio guardada correctamente.',
      timer: 1800,
      showConfirmButton: false,
    })
  }

  const saveServiceOrder = async (request) => {
    const previousShowSavedMessage = serviceOrdersRest.showSavedMessage
    serviceOrdersRest.showSavedMessage = false
    try {
      return await serviceOrdersRest.save(request)
    } finally {
      serviceOrdersRest.showSavedMessage = previousShowSavedMessage
    }
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (isStorageService) {
      const businessId = currentSelectValue(businessSelectRef, selectedBusinessId)
      const branchId = currentSelectValue(branchSelectRef, selectedBranchId)
      const clientId = normalizeClientIdValue(currentSelectValue(clientSelectRef, selectedClientId))
      const storageServiceId = currentSelectValue(storageServiceSelectRef, selectedStorageServiceId)
      const selectedBlocks = storageBlocks.filter(row => row.enabled)
      const missingBlock = selectedBlocks.find(row => !blockLocationIds(row).length || !row.start_date || !row.months || !row.end_date || !row.quantity_m3 || !row.tariff)
      if (!businessId || !branchId || !clientId || !expectedDocumentTypeRef.current.value || !currencyRef.current.value || !storageServiceId) {
        Swal.fire('Formulario incompleto', 'Completa empresa, cliente, tipo documento, moneda y tipo de servicio.', 'warning')
        return
      }
      if (!selectedBlocks.length) {
        Swal.fire('Formulario incompleto', 'Selecciona al menos un almacen.', 'warning')
        return
      }
      if (missingBlock) {
        Swal.fire('Formulario incompleto', `Completa los datos de ${missingBlock.warehouse_name}.`, 'warning')
        return
      }
      const missingBillingDate = selectedBlocks.find(row => {
        const months = Number.parseInt(row.months, 10)
        return !Array.isArray(row.billing_dates)
          || row.billing_dates.length !== months
          || row.billing_dates.some(item => !item.date)
      })
      if (missingBillingDate) {
        Swal.fire('Formulario incompleto', `Completa las fechas de facturacion de ${missingBillingDate.warehouse_name}.`, 'warning')
        return
      }
      const startDates = selectedBlocks.map(row => row.start_date).filter(Boolean).sort()
      const maxMonths = Math.max(...selectedBlocks.map(row => Number(row.months || 1)))
      const service = serviceMap[storageServiceId]
      const request = {
        id: idRef.current.value || undefined,
        business_id: businessId || null,
        business_branch_id: branchId || null,
        client_id: clientId || null,
        expected_document_type: expectedDocumentTypeRef.current.value,
        currency: currencyRef.current.value,
        billing_cycle: service?.name ?? '',
        payment_condition: 'Contado',
        installments: maxMonths || 1,
        issue_date: issueDateRef.current.value || new Date().toISOString().slice(0, 10),
        scheduled_at: startDates[0] ?? null,
        first_due_date: startDates[0] ?? null,
        order_status: orderStatusRef.current.value || 'draft',
        billing_status: billingStatusRef.current.value || 'pending',
        tax_amount: 0,
        observations: observationsRef.current.value.trim(),
        items: selectedBlocks.map(block => {
          const locations = findStorageLocations(block)
          const quantity = toNumber(block.quantity_m3)
          const unitPrice = toNumber(block.tariff)
          const total = toNumber(block.monthly_amount) || quantity * unitPrice
          return {
            service_id: storageServiceId,
            description: buildStorageDescription(block, locations),
            quantity,
            unit_price: unitPrice,
            detraction_percent: 0,
            commission_percent: 0,
            total,
            billing_dates: (block.billing_dates ?? []).map(item => item.date),
          }
        }),
      }
      const result = await saveServiceOrder(request)
      if (!result) return
      $(gridRef.current).dxDataGrid('instance').refresh()
      $(modalRef.current).modal('hide')
      showSaveSuccess(result)
      return
    }
    const businessId = currentSelectValue(businessSelectRef, selectedBusinessId)
    const branchId = currentSelectValue(branchSelectRef, selectedBranchId)
    const clientId = normalizeClientIdValue(currentSelectValue(clientSelectRef, selectedClientId))
    const itemPayload = items
      .filter(row => row.service_id)
      .map(row => ({
        service_id: row.service_id,
        scope: row.scope,
        gloss: row.gloss,
        description: row.gloss || row.description,
        quantity: row.quantity,
        unit_price: row.unit_price,
        detraction_percent: isServiceOrderContext && detractionEnabled ? (row.detraction_percent || 12) : row.detraction_percent,
        commission_percent: row.commission_percent,
        total: row.total,
      }))
    if (isStorageGeneral) {
      if (!businessId || !branchId || !clientId || !expectedDocumentTypeRef.current.value || !currencyRef.current.value) {
        Swal.fire('Formulario incompleto', 'Completa empresa, cliente, tipo documento y moneda.', 'warning')
        return
      }
      if (!itemPayload.length) {
        Swal.fire('Formulario incompleto', 'Agrega al menos un servicio general.', 'warning')
        return
      }
    } else if (isServiceOrderContext) {
      if (!businessId || !branchId || !clientId || !expectedDocumentTypeRef.current.value || !currencyRef.current.value || !billingCycleRef.current.value) {
        Swal.fire('Formulario incompleto', 'Completa cliente, comprobante, moneda y ciclo de facturacion.', 'warning')
        return
      }
      if (!itemPayload.length) {
        Swal.fire('Formulario incompleto', 'Agrega al menos un item de servicio.', 'warning')
        return
      }
    }
    const serviceSubtotal = itemPayload.reduce((sum, row) => sum + Number(row.total || 0), 0)
    const serviceTaxAmount = isServiceOrderContext ? Number((serviceSubtotal * 0.18).toFixed(2)) : Number(taxAmountRef.current.value || 0)
    const request = {
      id: idRef.current.value || undefined,
      business_id: businessId || null,
      business_branch_id: branchId || null,
      client_id: clientId || null,
      contract_label: contractLabelRef.current?.value?.trim?.() || null,
      expected_document_type: expectedDocumentTypeRef.current.value,
      currency: currencyRef.current.value,
      billing_cycle: billingCycleRef.current.value.trim(),
      payment_condition: paymentConditionRef.current.value,
      installments: installmentsRef.current.value,
      billing_day: billingDayRef.current?.value || null,
      detraction_enabled: isServiceOrderContext ? detractionEnabled : false,
      issue_date: issueDateRef.current.value,
      scheduled_at: scheduledAtRef.current.value || null,
      first_due_date: firstDueDateRef.current.value || null,
      order_status: orderStatusRef.current.value,
      billing_status: billingStatusRef.current.value,
      tax_amount: serviceTaxAmount,
      observations: observationsRef.current.value.trim(),
      items: itemPayload
    }
    const result = await saveServiceOrder(request)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
    showSaveSuccess(result)
  }

  const onCancel = async (row) => {
    const id = typeof row === 'object' ? row?.id : row
    if (!id || row?.order_status === 'cancelled' || row?.status === null) return
    const { isConfirmed } = await Swal.fire({
      title: 'Anular orden de servicio',
      text: isStorageOrderList ? 'La orden quedara anulada y se mantendra visible en el historial.' : 'Se dara de baja la orden de servicio.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, anular',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = isStorageOrderList
      ? await serviceOrdersRest.boolean({ id, field: 'order_status', value: 'cancelled' })
      : await serviceOrdersRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const renderStorageOrderStatus = (container, { data }) => {
    const status = data?.order_status ?? ''
    const badge = document.createElement('span')
    badge.className = `badge ${status === 'approved' ? 'bg-soft-success text-success' : status === 'cancelled' ? 'bg-soft-danger text-danger' : 'bg-soft-warning text-warning'}`
    badge.textContent = storageOrderStatusLabel(status)
    container.append(badge)
  }

  const renderServiceBillingStatus = (container, { data }) => {
    const billed = data?.billing_status === 'billed' || data?.order_status === 'invoiced'
    const badge = document.createElement('span')
    badge.className = `badge ${billed ? 'bg-soft-success text-success' : 'bg-soft-warning text-warning'}`
    badge.textContent = billed ? 'Facturado' : 'Pendiente'
    container.append(badge)
  }

  const serviceItemsText = (data) => (data.items ?? [])
    .map(row => row.gloss || row.description || row.service?.name)
    .filter(Boolean)
    .join(' | ')

  const billedTotal = (data) => (data?.billing_status === 'billed' || data?.order_status === 'invoiced')
    ? Number(data?.total || 0)
    : 0

  const actionColumn = {
    caption: 'Acciones',
    width: isStorageOrderList ? 136 : 150,
    minWidth: isStorageOrderList ? 136 : 150,
    fixed: isStorageOrderList,
    fixedPosition: 'left',
    allowFiltering: false,
    allowExporting: false,
    cellTemplate: (container, { data }) => {
      const isCancelled = data?.order_status === 'cancelled' || data?.status === null
      container.css({
        overflow: 'visible',
        textOverflow: 'unset',
        whiteSpace: 'nowrap',
      })
      const actions = $('<div>').css({
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        minWidth: 'max-content',
      })
      container.append(actions)
      actions.append(DxButton({
        className: isStorageOrderList ? 'btn btn-xs btn-soft-warning' : 'btn btn-xs btn-soft-primary',
        title: 'Editar orden de servicio',
        icon: 'mdi mdi-pencil',
        onClick: () => onModalOpen(data)
      }))
      if (!isStorageOrderList) {
        actions.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.serviceOrder(data)) }))
      }
      if (!isCancelled) {
        actions.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Anular orden de servicio', icon: isStorageOrderList ? 'mdi mdi-close' : 'mdi mdi-delete', onClick: () => onCancel(data) }))
      }
    }
  }

  const defaultServiceOrderColumns = [
    { dataField: 'client_id', caption: 'Cliente ID', visible: false, showInColumnChooser: false },
    { dataField: 'row_number', caption: '#', width: 56, allowFiltering: false, calculateCellValue: (data) => data.id },
    actionColumn,
    {
      dataField: 'billing_status',
      caption: 'Estado',
      width: 130,
      lookup: toLookup([
        { value: 'pending', label: 'Pendiente' },
        { value: 'billed', label: 'Facturado' },
      ]),
      cellTemplate: renderServiceBillingStatus,
    },
    {
      dataField: 'code',
      caption: 'Orden Servicio',
      width: 150,
      cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar orden de servicio')
    },
    { dataField: 'billing_cycle', caption: 'Ciclo Facturación', width: 155 },
    { dataField: 'client.document_number', caption: 'Doc. Cliente', width: 140 },
    { dataField: 'client.full_name', caption: 'Cliente', minWidth: 200 },
    {
      dataField: 'services_text',
      caption: 'Servicios',
      minWidth: 260,
      calculateCellValue: serviceItemsText,
    },
    {
      dataField: 'total_prefactures',
      caption: 'Total Prefacturas',
      width: 150,
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      calculateCellValue: (data) => Number(data.total || 0),
    },
    {
      dataField: 'total',
      caption: 'Total Servicio',
      width: 145,
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
    },
    {
      dataField: 'total_billed',
      caption: 'Total Facturado',
      width: 150,
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      calculateCellValue: billedTotal,
    },
    { dataField: 'contract_label', caption: 'Contrato', width: 150 },
    { dataField: 'creator.fullname', caption: 'Usuario Registro', minWidth: 150, calculateCellValue: (data) => formatGridUser(data.creator) },
    { dataField: 'created_at', caption: 'Fecha Registro', dataType: 'datetime', width: 170, format: 'yyyy-MM-dd HH:mm:ss' },
  ]

  const storageServiceOrderColumns = [
    { dataField: 'client_id', caption: 'Cliente ID', visible: false, showInColumnChooser: false },
    actionColumn,
    { dataField: 'order_status', caption: 'Estado', width: 145, minWidth: 145, lookup: toLookup(serviceOrderStatusOptions), cellTemplate: renderStorageOrderStatus },
    {
      dataField: 'code',
      caption: 'Codigo',
      width: 185,
      minWidth: 185,
      cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar orden de servicio')
    },
    { dataField: 'business.name', caption: 'Empresa', minWidth: 210 },
    { dataField: 'client.full_name', caption: 'Cliente', minWidth: 330 },
    { dataField: 'expected_document_type', caption: 'Tipo comprobante', width: 170, minWidth: 170 },
    { dataField: 'currency', caption: 'Moneda', width: 105, lookup: toLookup(currencyOptions) },
    { dataField: 'created_at', caption: 'Fecha registro', dataType: 'datetime', width: 185, minWidth: 185, format: 'yyyy-MM-dd HH:mm:ss' },
    { dataField: 'creator.fullname', caption: 'Usuario registro', minWidth: 185, calculateCellValue: (data) => formatGridUser(data.creator) },
  ]

  const serviceOrderColumns = isStorageOrderList ? storageServiceOrderColumns : defaultServiceOrderColumns
  const generalOrderTotal = items.reduce((sum, row) => sum + Number(row.total || 0), 0)
  const serviceOrderSubtotal = items.reduce((sum, row) => sum + Number(row.total || 0), 0)
  const serviceOrderTaxAmount = Number((serviceOrderSubtotal * 0.18).toFixed(2))
  const serviceOrderGrandTotal = Number((serviceOrderSubtotal + serviceOrderTaxAmount).toFixed(2))
  const serviceCurrencySymbol = selectedCurrencyCode === 'USD' ? '$' : 'S/'
  const money = (value) => Number(value || 0).toFixed(5)
  const serviceTableHeader = isServiceOrderContext ? (
    <div className='service-order-list-panel'>
      <div className='service-order-tabs'>
        <button type='button' className={activeServiceTab === 'services' ? 'active' : ''} onClick={() => setActiveServiceTab('services')}>Servicios</button>
        <button type='button' className={activeServiceTab === 'deleted' ? 'active' : ''} onClick={() => setActiveServiceTab('deleted')}>OS Eliminadas</button>
      </div>
      <div className='service-order-filter-panel'>
        <div className='row g-3 align-items-end'>
          <div className='col-12 col-lg-6'>
            <label className='form-label'>Cliente</label>
            <select className='form-select' value={serviceFilterClientId} onChange={(e) => setServiceFilterClientId(e.target.value)}>
              <option value=''>{activeServiceTab === 'deleted' ? 'Seleccione' : 'Todos'}</option>
              {clients.map(row => <option key={`service-order-filter-client-${row.id}`} value={row.entity_id ?? row.id}>{row.document_number ? `${row.document_number} - ` : ''}{row.full_name}</option>)}
            </select>
          </div>
          <div className='col-12 col-lg-6'>
            <label className='form-label'>Fecha Registro (Inicio - Fin):</label>
            <div className='service-order-date-range'>
              <input type='date' className='form-control' value={serviceFilterStart} onChange={(e) => setServiceFilterStart(e.target.value)} />
              <input type='date' className='form-control' value={serviceFilterEnd} onChange={(e) => setServiceFilterEnd(e.target.value)} />
            </div>
          </div>
        </div>
        <div className='service-order-filter-actions'>
          <button type='button' className='btn service-order-outline-btn' onClick={applyServiceFilters}><i className='mdi mdi-filter me-1'></i> Filtrar</button>
          {(serviceFilterClientId || serviceFilterStart || serviceFilterEnd || serviceGridFilter) && (
            <button type='button' className='btn service-order-muted-btn' onClick={resetServiceFilters}>Limpiar</button>
          )}
        </div>
      </div>
      {activeServiceTab === 'services' && (
        <div className='service-order-list-summary'>
          <div>
            <span>Importe Total</span>
            <strong className='text-success'>S/ {money(serviceSummary.penTotal)}</strong>
            <strong className='text-success'>$ {money(serviceSummary.usdTotal)}</strong>
          </div>
          <div>
            <span>Total Facturado</span>
            <strong className='text-warning'>S/ {money(serviceSummary.penBilled)}</strong>
            <strong className='text-warning'>$ {money(serviceSummary.usdBilled)}</strong>
          </div>
        </div>
      )}
    </div>
  ) : moduleTitle

  return <>
    {isServiceOrderContext && (
      <>
        <style>{`
          .service-order-action-row {
            display: grid;
            grid-template-columns: minmax(240px, 1fr) minmax(240px, 1fr);
            gap: 22px;
            max-width: 1128px;
            margin-bottom: 22px;
          }
          .service-order-action-tile {
            border: 0;
            border-radius: 0;
            min-height: 52px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 18px;
            color: #fff;
            font-weight: 500;
            text-align: left;
          }
          .service-order-action-tile.primary { background: #202146; }
          .service-order-action-tile.warning { background: #f5b955; }
          .service-order-list-panel { color: #33394a; }
          .service-order-tabs {
            display: flex;
            gap: 22px;
            border-bottom: 1px solid #e9ecef;
            margin: -8px -8px 16px;
            padding: 0 8px;
          }
          .service-order-tabs button {
            border: 0;
            background: transparent;
            color: #9aa1ac;
            padding: 12px 0 10px;
            font-size: 13px;
          }
          .service-order-tabs button.active {
            color: #26324d;
            border-bottom: 2px solid #d93025;
          }
          .service-order-filter-panel {
            border: 1px solid #e6e9ef;
            padding: 16px 12px 18px;
            margin-bottom: 16px;
          }
          .service-order-filter-panel .form-label {
            font-size: 12px;
            color: #26324d;
          }
          .service-order-filter-panel .form-control,
          .service-order-filter-panel .form-select {
            min-height: 28px;
            border-radius: 0;
            font-size: 12px;
            padding: 4px 9px;
          }
          .service-order-date-range {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .service-order-filter-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 18px;
          }
          .service-order-outline-btn {
            border: 1px solid #11184a;
            color: #11184a;
            background: #fff;
            border-radius: 0;
            font-size: 12px;
            font-weight: 600;
          }
          .service-order-muted-btn {
            border: 1px solid #f0f0f0;
            color: #777f8c;
            background: #f0f0f0;
            border-radius: 0;
            font-size: 12px;
          }
          .service-order-list-summary {
            min-height: 108px;
            border: 1px solid #e6e9ef;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0;
            margin-bottom: 14px;
          }
          .service-order-list-summary > div {
            min-width: 96px;
            padding: 8px 16px;
            text-align: center;
            border-right: 1px solid #d7dce5;
          }
          .service-order-list-summary > div:last-child { border-right: 0; }
          .service-order-list-summary span {
            display: block;
            font-size: 12px;
            margin-bottom: 14px;
          }
          .service-order-list-summary strong {
            display: block;
            font-size: 13px;
            line-height: 1.8;
            font-weight: 500;
          }
          @media (max-width: 767.98px) {
            .service-order-action-row { grid-template-columns: 1fr; }
            .service-order-date-range { grid-template-columns: 1fr; }
          }
        `}</style>
        <div className='service-order-action-row'>
          <button type='button' className='service-order-action-tile primary' onClick={() => onModalOpen()}>
            <span><i className='mdi mdi-plus-circle-outline me-1'></i> Registrar Orden de Servicio</span>
            <i className='mdi mdi-calendar-month-outline fs-4'></i>
          </button>
          <button type='button' className='service-order-action-tile warning' onClick={() => Swal.fire('Procesar actividades pendientes', 'Este proceso quedo listo como acceso del modulo. Falta conectar una regla automatica de actividades cuando se defina el flujo operativo.', 'info')}>
            <span><i className='mdi mdi-plus-circle-outline me-1'></i> Procesar Actividades Pendientes</span>
            <i className='mdi mdi-calendar-month-outline fs-4'></i>
          </button>
        </div>
      </>
    )}
    <Table
      key={isServiceOrderContext ? `service-order-${activeServiceTab}` : `service-order-${serviceOrderType}`}
      gridRef={gridRef}
      title={serviceTableHeader}
      rest={serviceOrdersRest}
      pageSize={25}
      filterValue={isServiceOrderContext ? serviceGridFilter : null}
      onRefresh={isServiceOrderContext ? onServiceGridRefresh : undefined}
      toolBar={(itemsBar) => {
        itemsBar.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        if (!isServiceOrderContext) {
          itemsBar.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
        }
      }}
      columns={serviceOrderColumns}
    />

    {isStorageService ? (
      <Modal
        modalRef={modalRef}
        title={<span className='storage-service-order-title'><i className='mdi mdi-menu me-1'></i> ORDEN DE SERVICIO</span>}
        size='full-width'
        dialogClass='storage-service-order-dialog modal-dialog-scrollable'
        contentClass='storage-service-order-content'
        headerClass='storage-service-order-header'
        closeButtonClass='btn-close-white'
        bodyClass='storage-service-order-body'
        hideFooter
        onSubmit={onSave}
      >
        <style>{`
          .storage-service-order-dialog {
            width: calc(100vw - 34px);
            max-width: calc(100vw - 34px);
            margin: 7px auto;
            align-items: flex-start;
          }
          .storage-service-order-content {
            border: 0;
            border-radius: 0;
            min-height: calc(100vh - 38px);
          }
          .storage-service-order-header {
            background: #202146;
            color: #fff;
            min-height: 36px;
            padding: 7px 14px;
            border-bottom: 0;
          }
          .storage-service-order-header .btn-close {
            transform: scale(.72);
            opacity: .85;
          }
          .storage-service-order-title {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0;
          }
          .storage-service-order-body {
            padding: 0 30px 28px;
            color: #33394a;
          }
          .storage-service-order-actions {
            display: flex;
            justify-content: center;
            gap: 16px;
            padding: 22px 0 14px;
            border-bottom: 1px solid #e9ecef;
          }
          .storage-service-order-actions .btn {
            border-radius: 0;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 16px;
            line-height: 1;
          }
          .storage-service-order-actions .btn-primary-outline {
            color: #11184a;
            background: #fff;
            border: 1px solid #11184a;
          }
          .storage-service-order-actions .btn-muted {
            color: #8f949a;
            background: #f0f0f0;
            border: 1px solid #f0f0f0;
          }
          .storage-service-order-heading {
            text-align: center;
            font-size: 22px;
            font-weight: 600;
            color: #555b66;
            margin: 32px 0 20px;
          }
          .storage-service-order-body .form-label {
            color: #26324d;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .storage-service-order-body .form-control,
          .storage-service-order-body .form-select {
            border-radius: 2px;
            min-height: 26px;
            padding: 3px 10px;
            font-size: 12px;
          }
          .storage-service-order-body .form-control:disabled,
          .storage-service-order-body .form-select:disabled {
            background-color: #f5f5f5;
            color: #9ca3af;
          }
          .storage-service-order-separator {
            border-top: 1px solid #e9ecef;
            margin: 28px 0 16px;
          }
          .storage-service-card {
            border: 1px solid #e9ecef;
            background: #fff;
            min-height: 248px;
          }
          .storage-service-card-header {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #f7f7f7;
            padding: 11px 12px;
            min-height: 44px;
          }
          .storage-service-card-title {
            margin: 0;
            font-size: 14px;
            font-weight: 500;
            color: #3b4250;
          }
          .storage-service-card-body {
            padding: 13px 12px 20px;
          }
          .storage-location-picker {
            position: relative;
          }
          .storage-location-picker-toggle {
            width: 100%;
            min-height: 42px;
            border: 1px solid #cfd6df;
            border-radius: 2px;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 5px 8px;
            text-align: left;
          }
          .storage-location-picker-toggle:disabled {
            background: #f5f5f5;
            color: #9ca3af;
          }
          .storage-location-picker-values {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            min-width: 0;
          }
          .storage-location-picker-placeholder {
            color: #8b919b;
            font-size: 13px;
          }
          .storage-location-chip {
            background: #0ea5c6;
            color: #fff;
            border-radius: 2px;
            padding: 3px 7px;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.1;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .storage-location-picker-menu {
            position: absolute;
            z-index: 30;
            top: calc(100% + 3px);
            left: 0;
            right: 0;
            max-height: 230px;
            overflow-y: auto;
            border: 1px solid #cfd6df;
            background: #fff;
            box-shadow: 0 10px 24px rgba(15, 23, 42, .16);
          }
          .storage-location-option {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            margin: 0;
            cursor: pointer;
            font-size: 12px;
            color: #26324d;
          }
          .storage-location-option:hover {
            background: #eef7fb;
          }
          .storage-location-option input {
            margin: 0;
          }
          .storage-location-empty {
            padding: 10px;
            color: #8b919b;
            font-size: 12px;
          }
          .storage-order-checkbox {
            width: 22px;
            height: 22px;
            border-radius: 1px;
            margin: 0;
          }
          .storage-billing-schedule {
            margin-top: 16px;
            border: 1px solid #e9ecef;
            overflow-x: auto;
          }
          .storage-billing-schedule table {
            width: 100%;
            margin: 0;
            border-collapse: collapse;
            font-size: 11px;
          }
          .storage-billing-schedule th,
          .storage-billing-schedule td {
            border-bottom: 1px solid #eef0f2;
            padding: 8px;
            vertical-align: middle;
          }
          .storage-billing-schedule th {
            color: #26324d;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            background: #fff;
          }
          .storage-billing-schedule td:first-child {
            width: 86px;
            text-align: center;
          }
          .storage-billing-schedule tr:last-child td {
            border-bottom: 0;
          }
          @media (max-width: 767.98px) {
            .storage-service-order-dialog {
              width: calc(100vw - 12px);
              max-width: calc(100vw - 12px);
            }
            .storage-service-order-body {
              padding: 0 16px 24px;
            }
          }
        `}</style>
        <input ref={idRef} hidden />
        <input ref={codeRef} hidden />
        <input ref={issueDateRef} type='date' hidden />
        <input ref={scheduledAtRef} type='date' hidden />
        <input ref={firstDueDateRef} type='date' hidden />
        <input ref={billingCycleRef} hidden />
        <input ref={paymentConditionRef} hidden />
        <input ref={installmentsRef} type='number' hidden />
        <input ref={orderStatusRef} hidden />
        <input ref={billingStatusRef} hidden />
        <input ref={taxAmountRef} type='number' hidden />
        <textarea ref={observationsRef} hidden />

        <div className='storage-service-order-actions'>
          <button type='submit' className='btn btn-primary-outline'><i className='mdi mdi-plus me-1'></i> Registrar</button>
          <button type='button' className='btn btn-muted' data-bs-dismiss='modal'><i className='mdi mdi-close me-1'></i> Cerrar</button>
        </div>

        <h3 className='storage-service-order-heading'>Orden de servicio N&deg;</h3>

        <div className='row g-4 align-items-end'>
          <div className='col-12 col-md-6 col-xl'>
            <label className='form-label'>Empresa</label>
            <select
              ref={businessSelectRef}
              className='form-select'
              value={selectedBusinessId}
              onChange={async (e) => {
                setSelectedBusinessId(e.target.value)
                const branchRows = await loadBranches(e.target.value)
                setSelectedBranchId(branchRows[0]?.id ? `${branchRows[0].id}` : '')
              }}
              required
            >
              <option value=''>Seleccione</option>
              {businesses.map(row => <option key={`storage-order-business-${row.id}`} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          <div className='col-12 col-md-6 col-xl-4'>
            <label className='form-label'>Cliente</label>
            <select ref={clientSelectRef} className='form-select' value={selectedClientId} onChange={(e) => {
              setSelectedClientId(e.target.value)
              if (isStorageService) {
                setOpenLocationPickerKey('')
                setStorageBlocks(prev => prev.map(block => ({
                  ...block,
                  location_id: '',
                  location_ids: [],
                  location_label: '',
                  location_labels: [],
                })))
              }
            }} required>
              <option value=''>Seleccione</option>
              {clients.map(row => <option key={`storage-order-client-${row.id}`} value={row.entity_id ?? row.id}>{row.document_number ? `${row.document_number} | ` : ''}{row.full_name}</option>)}
            </select>
          </div>
          <div className='col-12 col-md-4 col-xl'>
            <label className='form-label'>Tipo documento</label>
            <select ref={expectedDocumentTypeRef} className='form-select' required>
              <option value=''>Seleccione</option>
              <option value='Factura'>Factura</option>
              <option value='Boleta'>Boleta</option>
              <option value='Nota de pedido'>Nota de pedido</option>
            </select>
          </div>
          <div className='col-12 col-md-4 col-xl'>
            <label className='form-label'>Moneda</label>
            <select ref={currencyRef} className='form-select' required>
              <option value=''>Seleccione</option>
              <option value='PEN'>Soles</option>
              <option value='USD'>Dolares</option>
            </select>
          </div>
          <div className='col-12 col-md-4 col-xl'>
            <label className='form-label'>Tipo de servicio</label>
            <select ref={storageServiceSelectRef} className='form-select' value={selectedStorageServiceId} onChange={(e) => setSelectedStorageServiceId(e.target.value)} required>
              <option value=''>Seleccione</option>
              {storageServiceTypeOptions.map(service => <option key={`storage-order-service-${service.id}`} value={service.id}>{service.name}</option>)}
            </select>
          </div>
        </div>

        <div className='storage-service-order-separator'></div>

        <div className='row g-3'>
          {storageBlocks.map(block => {
            const locationOptions = locationOptionsForBlock(block)
            const locationsLoading = isStorageService && !isStorageCatalogLoaded
            const clientMissing = !normalizeClientIdValue(selectedClientId)
            const disabled = !block.enabled || locationsLoading || clientMissing
            const selectedLocationIds = blockLocationIds(block)
            const selectedLocations = locationOptions.filter(location => selectedLocationIds.includes(`${location.id}`))
            const pickerOpen = openLocationPickerKey === block.key
            return <div className='col-12 col-lg-4' key={`storage-order-block-${block.key}`}>
              <div className='storage-service-card'>
                <div className='storage-service-card-header'>
                  <input
                    type='checkbox'
                    className='form-check-input storage-order-checkbox'
                    checked={block.enabled}
                    onChange={(e) => {
                      updateStorageBlock(block.key, { enabled: e.target.checked })
                      if (!e.target.checked) setOpenLocationPickerKey('')
                    }}
                  />
                  <p className='storage-service-card-title'>{block.warehouse_name}</p>
                </div>
                <div className='storage-service-card-body'>
                  <div className='mb-3'>
                    <label className='form-label'>Ubicaci&oacute;n</label>
                    <div className='storage-location-picker'>
                      <button
                        type='button'
                        className='storage-location-picker-toggle'
                        disabled={disabled}
                        onClick={() => setOpenLocationPickerKey(prev => prev === block.key ? '' : block.key)}
                      >
                        <span className='storage-location-picker-values'>
                          {locationsLoading && <span className='storage-location-picker-placeholder'>Cargando ubicaciones...</span>}
                          {!locationsLoading && !selectedLocations.length && <span className='storage-location-picker-placeholder'>{clientMissing ? 'Seleccione cliente primero' : (locationOptions.length ? 'Seleccione ubicaciones' : 'Sin ubicaciones')}</span>}
                          {selectedLocations.map(location => (
                            <span className='storage-location-chip' key={`storage-order-location-chip-${block.key}-${location.id}`}>{storageLocationLabel(location)}</span>
                          ))}
                        </span>
                        <i className='mdi mdi-chevron-down'></i>
                      </button>
                      {pickerOpen && !disabled && (
                        <div className='storage-location-picker-menu'>
                          {!locationOptions.length && <div className='storage-location-empty'>Sin ubicaciones</div>}
                          {locationOptions.map(location => {
                            const locationId = `${location.id}`
                            return (
                              <label className='storage-location-option' key={`storage-order-location-${block.key}-${location.id}`}>
                                <input
                                  type='checkbox'
                                  checked={selectedLocationIds.includes(locationId)}
                                  onChange={() => toggleStorageLocation(block, locationId)}
                                />
                                <span>{storageLocationLabel(location)}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='row g-3 mb-3'>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Fecha de inicio</label>
                      <input
                        type='date'
                        className='form-control'
                        value={block.start_date}
                        disabled={disabled}
                        onChange={(e) => updateStorageBlock(block.key, { start_date: e.target.value })}
                        required={block.enabled}
                      />
                    </div>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Nro de meses</label>
                      <input
                        type='number'
                        min='1'
                        className='form-control'
                        value={block.months}
                        disabled={disabled}
                        onChange={(e) => updateStorageBlock(block.key, { months: e.target.value })}
                        required={block.enabled}
                      />
                    </div>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Fecha fin</label>
                      <input type='date' className='form-control' value={block.end_date} disabled />
                    </div>
                  </div>
                  <div className='row g-3'>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Cantidad de m3</label>
                      <input
                        type='number'
                        min='0'
                        step='0.001'
                        className='form-control'
                        value={block.quantity_m3}
                        disabled={disabled}
                        onChange={(e) => updateStorageBlock(block.key, { quantity_m3: e.target.value })}
                        required={block.enabled}
                      />
                    </div>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Tarifa</label>
                      <input
                        type='number'
                        min='0'
                        step='0.01'
                        className='form-control'
                        value={block.tariff}
                        disabled={disabled}
                        onChange={(e) => updateStorageBlock(block.key, { tariff: e.target.value })}
                        required={block.enabled}
                      />
                    </div>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Importe mensual</label>
                      <input type='number' className='form-control' value={block.monthly_amount} disabled />
                    </div>
                  </div>
                  {block.enabled && (block.billing_dates ?? []).length > 0 && (
                    <div className='storage-billing-schedule'>
                      <table>
                        <thead>
                          <tr>
                            <th>N&deg; mes</th>
                            <th>Fecha facturaci&oacute;n</th>
                          </tr>
                        </thead>
                        <tbody>
                          {block.billing_dates.map((row, index) => (
                            <tr key={`storage-order-billing-${block.key}-${row.month}`}>
                              <td>{row.month}</td>
                              <td>
                                <input
                                  type='date'
                                  className='form-control'
                                  value={row.date}
                                  onChange={(e) => updateStorageBillingDate(block.key, index, e.target.value)}
                                  required={block.enabled}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          })}
        </div>
      </Modal>
    ) : isStorageGeneral ? (
      <Modal
        modalRef={modalRef}
        title={<span className='storage-service-order-title'><i className='mdi mdi-menu me-1'></i> ORDEN DE SERVICIO</span>}
        size='full-width'
        dialogClass='storage-general-order-dialog modal-dialog-scrollable'
        contentClass='storage-general-order-content'
        headerClass='storage-service-order-header'
        closeButtonClass='btn-close-white'
        bodyClass='storage-general-order-body'
        hideFooter
        onSubmit={onSave}
      >
        <style>{`
          .storage-general-order-dialog {
            width: calc(100vw - 34px);
            max-width: calc(100vw - 34px);
            margin: 7px auto;
            align-items: flex-start;
          }
          .storage-general-order-content {
            border: 0;
            border-radius: 0;
            min-height: auto;
          }
          .storage-general-order-body {
            padding: 0 30px 28px;
            color: #33394a;
          }
          .storage-general-order-actions {
            display: flex;
            justify-content: center;
            gap: 16px;
            padding: 22px 0 14px;
            border-bottom: 1px solid #e9ecef;
          }
          .storage-general-order-actions .btn {
            border-radius: 0;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 16px;
            line-height: 1;
          }
          .storage-general-order-actions .btn-primary-outline {
            color: #11184a;
            background: #fff;
            border: 1px solid #11184a;
          }
          .storage-general-order-actions .btn-muted {
            color: #8f949a;
            background: #f0f0f0;
            border: 1px solid #f0f0f0;
          }
          .storage-general-order-heading {
            text-align: center;
            font-size: 22px;
            font-weight: 600;
            color: #555b66;
            margin: 32px 0 20px;
          }
          .storage-general-order-body .form-label {
            color: #26324d;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .storage-general-order-body .form-control,
          .storage-general-order-body .form-select {
            border-radius: 2px;
            min-height: 26px;
            padding: 3px 10px;
            font-size: 12px;
          }
          .storage-general-insert {
            border-radius: 0;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .storage-general-service-selector {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 34px;
            gap: 6px;
            align-items: center;
          }
          .storage-general-service-selector .form-select {
            min-width: 0;
          }
          .storage-general-service-add {
            width: 34px;
            height: 26px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border-radius: 2px;
          }
          .storage-general-lines-wrap {
            border: 1px solid #e9ecef;
            border-radius: 4px;
            overflow: auto;
          }
          .storage-general-lines {
            width: 100%;
            min-width: 980px;
            border-collapse: collapse;
            font-size: 12px;
          }
          .storage-general-lines th,
          .storage-general-lines td {
            border: 1px solid #e9ecef;
            padding: 8px;
            vertical-align: middle;
          }
          .storage-general-lines th {
            font-size: 11px;
            font-weight: 700;
            color: #26324d;
            text-transform: uppercase;
            background: #fff;
          }
          .storage-general-lines tfoot td {
            background: #fff;
          }
          .storage-general-total-label {
            font-style: italic;
            font-weight: 700;
            text-align: right;
          }
          @media (max-width: 767.98px) {
            .storage-general-order-dialog {
              width: calc(100vw - 12px);
              max-width: calc(100vw - 12px);
            }
            .storage-general-order-body {
              padding: 0 16px 24px;
            }
          }
        `}</style>
        <input ref={idRef} hidden />
        <input ref={codeRef} hidden />
        <input ref={issueDateRef} type='date' hidden />
        <input ref={scheduledAtRef} type='date' hidden />
        <input ref={firstDueDateRef} type='date' hidden />
        <input ref={billingCycleRef} hidden />
        <input ref={paymentConditionRef} hidden />
        <input ref={installmentsRef} type='number' hidden />
        <input ref={orderStatusRef} hidden />
        <input ref={billingStatusRef} hidden />
        <input ref={taxAmountRef} type='number' hidden />
        <textarea ref={observationsRef} hidden />
        <input ref={branchSelectRef} type='hidden' value={selectedBranchId} readOnly />

        <div className='storage-general-order-actions'>
          <button type='submit' className='btn btn-primary-outline'><i className='mdi mdi-plus me-1'></i> Guardar</button>
          <button type='button' className='btn btn-muted' data-bs-dismiss='modal'><i className='mdi mdi-close me-1'></i> Cerrar</button>
        </div>

        <h3 className='storage-general-order-heading'>Orden de servicio N&deg;</h3>

        <div className='row g-4 align-items-end'>
          <div className='col-12 col-md-6 col-xl-2'>
            <label className='form-label'>Empresa</label>
            <select
              ref={businessSelectRef}
              className='form-select'
              value={selectedBusinessId}
              onChange={async (e) => {
                setSelectedBusinessId(e.target.value)
                const branchRows = await loadBranches(e.target.value)
                setSelectedBranchId(branchRows[0]?.id ? `${branchRows[0].id}` : '')
              }}
              required
            >
              <option value=''>Seleccione</option>
              {businesses.map(row => <option key={`general-order-business-${row.id}`} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          <div className='col-12 col-md-6 col-xl-4'>
            <label className='form-label'>Cliente</label>
            <select ref={clientSelectRef} className='form-select' value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required>
              <option value=''>Seleccione</option>
              {clients.map(row => <option key={`general-order-client-${row.id}`} value={row.entity_id ?? row.id}>{row.document_number ? `${row.document_number} | ` : ''}{row.full_name}</option>)}
            </select>
          </div>
          <div className='col-12 col-md-6 col-xl-3'>
            <label className='form-label'>Tipo documento</label>
            <select ref={expectedDocumentTypeRef} className='form-select' required>
              <option value=''>Seleccione</option>
              <option value='Factura'>Factura</option>
              <option value='Boleta'>Boleta</option>
              <option value='Nota de pedido'>Nota de pedido</option>
            </select>
          </div>
          <div className='col-12 col-md-6 col-xl-3'>
            <label className='form-label'>Moneda</label>
            <select ref={currencyRef} className='form-select' onChange={(e) => onCurrencyChange(e.target.value)} required>
              <option value=''>Seleccione</option>
              <option value='PEN'>Soles</option>
              <option value='USD'>Dolares</option>
            </select>
          </div>
        </div>

        <div className='mt-4 mb-3'>
          <button type='button' className='btn btn-outline-primary storage-general-insert' onClick={() => setItems(prev => [...prev, emptyItem()])}>
            <i className='mdi mdi-plus-circle me-1'></i> Insertar servicio general
          </button>
        </div>

        <div className='storage-general-lines-wrap'>
          <table className='storage-general-lines'>
            <thead>
              <tr>
                <th>Servicio</th>
                <th style={{ width: 115 }}>Tarifa</th>
                <th style={{ width: 115 }}>Cantidad</th>
                <th style={{ width: 130 }}>Total</th>
                <th style={{ width: 42 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <tr key={`general-order-item-${row.uid}`}>
                  <td>
                    <div className='storage-general-service-selector'>
                      <select className='form-select' value={row.service_id} onChange={(e) => onItemChange(row.uid, 'service_id', e.target.value)} required>
                        <option value=''>Seleccione servicio</option>
                        {services.map(service => <option key={`general-order-service-${service.id}`} value={service.id}>{service.name}</option>)}
                      </select>
                      <button type='button' className='btn btn-outline-primary storage-general-service-add' title='Agregar servicio general' onClick={() => onQuickServiceOpen(row.uid)}>
                        <i className='mdi mdi-plus'></i>
                      </button>
                    </div>
                  </td>
                  <td><input type='number' step='0.01' className='form-control' value={row.unit_price} onChange={(e) => onItemChange(row.uid, 'unit_price', e.target.value)} /></td>
                  <td><input type='number' step='0.001' min='0' className='form-control' value={row.quantity} onChange={(e) => onItemChange(row.uid, 'quantity', e.target.value)} /></td>
                  <td><input className='form-control' value={Number(row.total || 0).toFixed(2)} disabled /></td>
                  <td><button type='button' className='btn btn-outline-danger btn-sm' onClick={() => setItems(prev => prev.filter(item => item.uid !== row.uid))}><i className='mdi mdi-close'></i></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan='3' className='storage-general-total-label'>Total</td>
                <td><input className='form-control' value={generalOrderTotal.toFixed(2)} disabled /></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Modal>
    ) : (
    <Modal
      modalRef={modalRef}
      title={isEditing ? 'Editar orden de servicio' : 'Registrar orden de servicio'}
      size='xl'
      bodyClass='service-order-form-modal-body'
      btnCancelText='Cerrar'
      btnSubmitText='Guardar'
      onSubmit={onSave}
    >
      <style>{`
        .service-order-form-modal-body .form-label { color: #374151; font-weight: 600; }
        .service-order-form-section-title { color: #313a46; font-size: 0.9rem; font-weight: 700; margin: 0; }
        .service-order-items-wrapper { border: 1px solid #e6ebf1; border-radius: 6px; overflow: auto; }
        .service-order-items-table { min-width: 1120px; }
        .service-order-items-table th { color: #4b5563; font-size: .72rem; text-transform: uppercase; white-space: nowrap; }
        .service-order-items-table td { vertical-align: middle; }
        .service-order-items-table .form-control,
        .service-order-items-table .form-select { min-height: 34px; }
        .service-order-summary { max-width: 360px; margin-left: auto; }
        .service-order-summary-row { display: grid; grid-template-columns: 130px 1fr; align-items: center; gap: .75rem; margin-bottom: .5rem; }
        .service-order-summary-label { font-weight: 700; text-align: right; color: #313a46; }
        .service-order-detraction-options { display: flex; gap: 1rem; align-items: center; min-height: 38px; }
        @media (max-width: 767.98px) {
          .service-order-summary { max-width: none; }
          .service-order-summary-row { grid-template-columns: 1fr; gap: .25rem; }
          .service-order-summary-label { text-align: left; }
        }
      `}</style>

      <input ref={idRef} hidden />
      <input ref={codeRef} hidden readOnly />
      <input ref={businessSelectRef} type='hidden' value={selectedBusinessId} readOnly />
      <input ref={branchSelectRef} type='hidden' value={selectedBranchId} readOnly />
      <input ref={issueDateRef} type='hidden' />
      <input ref={scheduledAtRef} type='hidden' />
      <input ref={firstDueDateRef} type='hidden' />
      <input ref={installmentsRef} type='hidden' defaultValue='1' />
      <input ref={orderStatusRef} type='hidden' defaultValue='draft' />
      <input ref={billingStatusRef} type='hidden' defaultValue='pending' />
      <input ref={taxAmountRef} type='hidden' />
      <textarea ref={observationsRef} hidden />

      <div className='row g-3'>
        <div className='col-12'>
          <h5 className='service-order-form-section-title'>Datos de la orden</h5>
        </div>
        <div className='col-12 col-lg-6'>
          <label className='form-label'>Cliente</label>
          <select ref={clientSelectRef} className='form-select' value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required>
            <option value=''>Seleccione</option>
            {clients.map(row => (
              <option key={`service-order-client-${row.id}`} value={row.entity_id ?? row.id}>
                {row.document_number ? `${row.document_number} - ` : ''}{row.display_name ?? row.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className='col-12 col-lg-3'>
          <label className='form-label'>Contrato</label>
          <input ref={contractLabelRef} className='form-control' placeholder='Seleccionar' />
        </div>
        <div className='col-12 col-lg-3'>
          <label className='form-label'>Ciclo de facturaci&oacute;n</label>
          <select ref={billingCycleRef} className='form-select' required>
            <option value='Unico'>Unico</option>
            <option value='Mensual'>Mensual</option>
            <option value='Eventual'>Eventual</option>
          </select>
        </div>
        <div className='col-12 col-md-6 col-lg-3'>
          <label className='form-label'>Moneda</label>
          <select ref={currencyRef} className='form-select' onChange={(e) => onCurrencyChange(e.target.value)} required>
            <option value='PEN'>S/ | Soles</option>
            <option value='USD'>$ | Dolares</option>
          </select>
        </div>
        <div className='col-12 col-md-6 col-lg-3'>
          <label className='form-label'>Comprobante</label>
          <select ref={expectedDocumentTypeRef} className='form-select' required>
            <option value=''>Seleccione</option>
            <option value='Factura'>Factura</option>
            <option value='Boleta'>Boleta</option>
            <option value='Nota de pedido'>Nota de pedido</option>
          </select>
        </div>
      </div>

      <hr className='my-4' />

      <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2'>
        <h5 className='service-order-form-section-title'>Detalle de servicios</h5>
        <button type='button' className='btn btn-sm btn-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}>
          <i className='mdi mdi-plus me-1'></i> Agregar item
        </button>
      </div>

      <div className='service-order-items-wrapper'>
        <table className='table table-sm table-bordered align-middle service-order-items-table mb-0'>
          <thead className='table-light'>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Servicio</th>
              <th style={{ width: 170 }}>Alcance</th>
              <th>Glosa</th>
              <th style={{ width: 135 }}>P. Unit.<br />(Sin IGV)</th>
              <th style={{ width: 130 }}>Subtotal</th>
              <th style={{ width: 42 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => (
              <tr key={`service-order-item-row-${row.uid}`}>
                <td>{index + 1}</td>
                <td>
                  <select className='form-select' value={row.service_id} onChange={(e) => onItemChange(row.uid, 'service_id', e.target.value)} required>
                    <option value=''>Seleccione servicio</option>
                    {services.map(service => (
                      <option key={`service-order-item-${service.id}`} value={service.id}>{service.code ? `${service.code} - ` : ''}{service.name}</option>
                    ))}
                  </select>
                </td>
                <td><input className='form-control' value={row.scope} onChange={(e) => onItemChange(row.uid, 'scope', e.target.value)} /></td>
                <td><input className='form-control' value={row.gloss} onChange={(e) => onItemChange(row.uid, 'gloss', e.target.value)} /></td>
                <td><input type='number' step='0.01' min='0' className='form-control text-end' value={row.unit_price} onChange={(e) => onItemChange(row.uid, 'unit_price', e.target.value)} /></td>
                <td><input className='form-control text-end' value={Number(row.total || 0).toFixed(2)} disabled /></td>
                <td><button type='button' className='btn btn-outline-danger btn-sm' onClick={() => setItems(prev => prev.length === 1 ? [emptyItem()] : prev.filter(item => item.uid !== row.uid))}><i className='mdi mdi-close'></i></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='service-order-summary mt-3'>
        <div className='service-order-summary-row'>
          <span className='service-order-summary-label'>Gravadas: {serviceCurrencySymbol}</span>
          <input className='form-control text-end' value={serviceOrderSubtotal.toFixed(2)} disabled />
        </div>
        <div className='service-order-summary-row'>
          <span className='service-order-summary-label'>I.G.V.: {serviceCurrencySymbol}</span>
          <input className='form-control text-end' value={serviceOrderTaxAmount.toFixed(2)} disabled />
        </div>
        <div className='service-order-summary-row'>
          <span className='service-order-summary-label'>Total: {serviceCurrencySymbol}</span>
          <input className='form-control text-end' value={serviceOrderGrandTotal.toFixed(2)} disabled />
        </div>
      </div>

      <hr className='my-4' />

      <div className='row g-3 align-items-end'>
        <div className='col-12 col-lg-4'>
          <label className='form-label d-block'>Detracci&oacute;n</label>
          <div className='form-check form-switch service-order-detraction-options'>
            <input className='form-check-input' id='service-order-detraction-enabled' type='checkbox' checked={detractionEnabled} onChange={(e) => setDetractionEnabled(e.target.checked)} />
          </div>
        </div>
        <div className='col-12 col-lg-6'>
          <label className='form-label'>Forma de pago</label>
          <select ref={paymentConditionRef} className='form-select'>
            <option value='Contado'>Contado</option>
            <option value='Credito'>Credito</option>
          </select>
        </div>
        <div className='col-12 col-lg-2'>
          <label className='form-label'>D&iacute;a facturaci&oacute;n</label>
          <select ref={billingDayRef} className='form-select'>
            <option value=''>Seleccionar</option>
            {Array.from({ length: 31 }, (_, index) => index + 1).map(day => <option key={`service-order-billing-day-${day}`} value={day}>{day}</option>)}
          </select>
        </div>
      </div>
    </Modal>
    )}
    {isStorageGeneral && (
      <Modal
        modalRef={quickServiceModalRef}
        title='Agregar servicio general'
        size='md'
        btnCancelText='Cerrar'
        btnSubmitText='Guardar'
        zIndex={1070}
        onSubmit={onQuickServiceSave}
      >
        <div className='row g-3'>
          <div className='col-12'>
            <label className='form-label'>Nombre</label>
            <input ref={quickServiceNameRef} className='form-control' required />
          </div>
          <div className='col-12'>
            <label className='form-label'>Descripcion</label>
            <input ref={quickServiceDescriptionRef} className='form-control' />
          </div>
          <div className='col-12'>
            <label className='form-label'>Tarifa</label>
            <input ref={quickServicePriceRef} type='number' min='0' step='0.01' className='form-control' defaultValue='0.00' />
          </div>
        </div>
      </Modal>
    )}
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'services-service-order'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Ordenes de servicio'}><ServiceOrders {...properties} /></BaseAdminto>)
})
