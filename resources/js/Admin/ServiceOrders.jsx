import React, { useEffect, useRef, useState } from 'react';
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
  billingStatusOptions,
  getPaymentStatusLabel,
  getServiceOrderStatusLabel,
  serviceOrderStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const serviceOrdersRest = new ServiceOrdersRest()
const formatGridUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const emptyItem = () => ({ uid: crypto.randomUUID(), service_id: '', description: '', quantity: 1, unit_price: 0, detraction_percent: 0, commission_percent: 0, total: 0 })
const normalizeStorageText = (value = '') => value.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
const storageServiceTypeNames = ['Servicio de almacenamiento', 'Servicio de almacenamiento - Adicional']
const currencyOptions = [
  { value: 'PEN', label: 'Soles' },
  { value: 'USD', label: 'Dolares' },
]
const storageWarehouseName = (warehouse) => warehouse?.name ?? warehouse?.warehouse_name ?? ''
const storageWarehouseId = (warehouse) => warehouse?.id ?? warehouse?.warehouse_id ?? ''
const storageOrderStatusLabel = (value) => value === 'approved' ? 'Aprobado' : getServiceOrderStatusLabel(value)
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
  const paymentConditionRef = useRef()
  const installmentsRef = useRef()
  const orderStatusRef = useRef()
  const billingStatusRef = useRef()
  const taxAmountRef = useRef()
  const observationsRef = useRef()
  const storageCatalogPromiseRef = useRef(null)
  const businessSelectRef = useRef()
  const branchSelectRef = useRef()
  const clientSelectRef = useRef()
  const storageServiceSelectRef = useRef()

  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedStorageServiceId, setSelectedStorageServiceId] = useState('')
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
      const [businessList, clientList, serviceList, storageCatalog] = await Promise.all([
        serviceOrdersRest.getBusinesses(),
        serviceOrdersRest.getClients(),
        serviceOrdersRest.getServices(),
        storageCatalogPromise,
      ])
      const activeBusinesses = businessList ?? []
      setBusinesses(activeBusinesses)
      setClients((clientList ?? []).filter(row => row.status !== null))
      setServices((serviceList ?? []).filter(row => row.status !== null))

      if (isStorageService) {
        setStorageBlocks(emptyStorageBlocks(storageCatalog.warehouseRows))

        const defaultBusiness = activeBusinesses[0]
        if (defaultBusiness) {
          setSelectedBusinessId(`${defaultBusiness.id}`)
          const branchRows = await loadBranches(defaultBusiness.id)
          if (branchRows[0]?.id) setSelectedBranchId(`${branchRows[0].id}`)
        }
      }
    }
    loadInitialData()
  }, [])

  const loadBranches = async (businessId, preferred = '') => {
    const data = await serviceOrdersRest.getBranchesByBusiness(businessId)
    const branchRows = data ?? []
    setBranches(branchRows)
    setSelectedBranchId(preferred ? `${preferred}` : '')
    return branchRows
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
  const locationOptionsForBlock = (block, locationRows = storageLocations, warehouseRows = storageWarehouses) => {
    const warehouseId = blockWarehouseId(block, warehouseRows)
    return locationRows.filter(location => {
      if (warehouseId && `${location.warehouse_id}` === `${warehouseId}`) return true
      return normalizeStorageText(location.warehouse_name) === normalizeStorageText(block.warehouse_name)
    })
  }
  const findStorageLocation = (block, locationRows = storageLocations, warehouseRows = storageWarehouses) => {
    const options = locationOptionsForBlock(block, locationRows, warehouseRows)
    return options.find(location => `${location.id}` === `${block.location_id}`)
      ?? options.find(location => normalizeStorageText(storageLocationLabel(location)) === normalizeStorageText(block.location_label))
      ?? null
  }
  const findStorageLocations = (block, locationRows = storageLocations, warehouseRows = storageWarehouses) => {
    const options = locationOptionsForBlock(block, locationRows, warehouseRows)
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
  const buildStorageBlocksFromItems = (itemRows = [], warehouseRows = storageWarehouses, locationRows = storageLocations) => {
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
      const locations = findStorageLocations(next, locationRows, warehouseRows)
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
      const location = patch.location_id
        ? storageLocations.find(row => `${row.id}` === `${patch.location_id}`)
        : null
      const locations = patchLocationIds
        ? storageLocations.filter(row => patchLocationIds.includes(`${row.id}`))
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
    currencyRef.current.value = data?.currency ?? (isStorageOrderList ? '' : 'PEN')
    billingCycleRef.current.value = data?.billing_cycle ?? ''
    paymentConditionRef.current.value = data?.payment_condition ?? 'Contado'
    installmentsRef.current.value = Number(data?.installments ?? 1)
    orderStatusRef.current.value = data?.order_status ?? (isStorageGeneral ? 'approved' : 'draft')
    billingStatusRef.current.value = data?.billing_status ?? 'pending'
    taxAmountRef.current.value = Number(data?.tax_amount ?? 0)
    observationsRef.current.value = data?.observations ?? ''
    const nextBusinessId = data?.business_id ? `${data.business_id}` : (selectedBusinessId || (businesses[0]?.id ? `${businesses[0].id}` : ''))
    setSelectedBusinessId(nextBusinessId)
    setSelectedClientId(data?.client_id ? `${data.client_id}` : '')
    const branchRows = await loadBranches(nextBusinessId, data?.business_branch_id ?? selectedBranchId)
    if (!data?.business_branch_id && !selectedBranchId && branchRows[0]?.id) setSelectedBranchId(`${branchRows[0].id}`)
    const itemRows = (data?.items ?? []).map(row => ({ uid: crypto.randomUUID(), service_id: `${row.service_id}`, description: row.description ?? '', quantity: Number(row.quantity || 0), unit_price: Number(row.unit_price || 0), detraction_percent: Number(row.detraction_percent || 0), commission_percent: Number(row.commission_percent || 0), total: Number(row.total || 0) }))
    setSelectedStorageServiceId(itemRows[0]?.service_id ?? '')
    let warehouseRows = storageWarehouses
    let locationRows = storageLocations
    if (isStorageService && (!warehouseRows.length || !locationRows.length || !isStorageCatalogLoaded)) {
      const catalog = await loadStorageCatalog()
      warehouseRows = catalog.warehouseRows
      locationRows = catalog.locationRows
    }
    setStorageBlocks(isStorageService ? buildStorageBlocksFromItems(data?.items ?? [], warehouseRows, locationRows) : emptyStorageBlocks())
    setItems(itemRows.length ? itemRows : (isStorageGeneral ? [] : [emptyItem()]))
    $(modalRef.current).modal('show')
  }

  const onItemChange = (uid, field, value) => {
    setItems(prev => prev.map(row => {
      if (row.uid !== uid) return row
      const next = { ...row, [field]: value }
      if (field === 'service_id') {
        const service = serviceMap[value]
        next.description = next.description || service?.name || ''
        next.unit_price = Number(currencyRef.current?.value === 'USD' ? service?.unit_price_usd : service?.unit_price_pen) || 0
      }
      return recalc(next)
    }))
  }

  const onCurrencyChange = (value) => {
    setItems(prev => prev.map(row => {
      if (!row.service_id) return row
      const service = serviceMap[row.service_id]
      return recalc({
        ...row,
        unit_price: Number(value === 'USD' ? service?.unit_price_usd : service?.unit_price_pen) || 0,
      })
    }))
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
      const result = await serviceOrdersRest.save(request)
      if (!result) return
      $(gridRef.current).dxDataGrid('instance').refresh()
      $(modalRef.current).modal('hide')
      return
    }
    const businessId = currentSelectValue(businessSelectRef, selectedBusinessId)
    const branchId = currentSelectValue(branchSelectRef, selectedBranchId)
    const clientId = normalizeClientIdValue(currentSelectValue(clientSelectRef, selectedClientId))
    const itemPayload = items
      .filter(row => row.service_id)
      .map(row => ({
        service_id: row.service_id,
        description: row.description,
        quantity: row.quantity,
        unit_price: row.unit_price,
        detraction_percent: row.detraction_percent,
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
    }
    const request = {
      id: idRef.current.value || undefined,
      business_id: businessId || null,
      business_branch_id: branchId || null,
      client_id: clientId || null,
      expected_document_type: expectedDocumentTypeRef.current.value,
      currency: currencyRef.current.value,
      billing_cycle: billingCycleRef.current.value.trim(),
      payment_condition: paymentConditionRef.current.value,
      installments: installmentsRef.current.value,
      issue_date: issueDateRef.current.value,
      scheduled_at: scheduledAtRef.current.value || null,
      first_due_date: firstDueDateRef.current.value || null,
      order_status: orderStatusRef.current.value,
      billing_status: billingStatusRef.current.value,
      tax_amount: taxAmountRef.current.value,
      observations: observationsRef.current.value.trim(),
      items: itemPayload
    }
    const result = await serviceOrdersRest.save(request)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onCancel = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Anular orden de servicio', text: 'Se dara de baja la orden de servicio.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, anular', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await serviceOrdersRest.delete(id)
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

  const actionColumn = {
    caption: 'Acciones',
    width: isStorageOrderList ? 92 : 170,
    allowFiltering: false,
    allowExporting: false,
    cellTemplate: (container, { data }) => {
      container.css('text-overflow', 'unset')
      container.append(DxButton({
        className: isStorageOrderList ? 'btn btn-xs btn-soft-warning' : 'btn btn-xs btn-soft-primary',
        title: 'Editar orden de servicio',
        icon: 'mdi mdi-pencil',
        onClick: () => onModalOpen(data)
      }))
      if (!isStorageOrderList) {
        container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.serviceOrder(data)) }))
      }
      container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Anular orden de servicio', icon: isStorageOrderList ? 'mdi mdi-close' : 'mdi mdi-delete', onClick: () => onCancel(data.id) }))
    }
  }

  const defaultServiceOrderColumns = [
    { dataField: 'id', caption: 'ID', width: 70 },
    {
      dataField: 'code',
      caption: 'Codigo',
      width: 120,
      cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar orden de servicio')
    },
    { dataField: 'issue_date', caption: 'Fecha', dataType: 'date', width: 110 },
    { dataField: 'scheduled_at', caption: 'Programada', dataType: 'date', width: 115 },
    { dataField: 'business.name', caption: 'Empresa', minWidth: 140 },
    { dataField: 'branch.name', caption: 'Sede', minWidth: 130 },
    { dataField: 'client.full_name', caption: 'Cliente', minWidth: 200 },
    { dataField: 'billing_cycle', caption: 'Ciclo', minWidth: 130 },
    { dataField: 'expected_document_type', caption: 'Comp.', width: 100 },
    { dataField: 'currency', caption: 'Moneda', width: 90 },
    { dataField: 'subtotal', caption: 'Subtotal', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
    { dataField: 'tax_amount', caption: 'Impuesto', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
    { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
    {
      caption: 'Detalle',
      minWidth: 260,
      allowFiltering: false,
      calculateCellValue: (data) => (data.items ?? [])
        .map(row => `${Number(row.quantity || 0).toFixed(3)} ${row.service?.billing_unit ?? ''} ${row.description ?? row.service?.name ?? ''}`.trim())
        .join(' | ')
    },
    {
      dataField: 'accounts_receivable_code',
      caption: 'CXC',
      width: 130,
      calculateCellValue: (data) => data.accounts_receivable?.code ?? data.accountsReceivable?.code ?? '-'
    },
    {
      dataField: 'payment_status',
      caption: 'Cobranza',
      width: 110,
      calculateCellValue: (data) => getPaymentStatusLabel(data.accounts_receivable?.payment_status ?? data.accountsReceivable?.payment_status ?? data.payment_status ?? '-')
    },
    { dataField: 'order_status', caption: 'Estado', width: 110, lookup: toLookup(serviceOrderStatusOptions) },
    { dataField: 'billing_status', caption: 'Facturacion', width: 110, lookup: toLookup(billingStatusOptions) },
    { dataField: 'creator.fullname', caption: 'Creado por', minWidth: 140, visible: false },
    { dataField: 'updater.fullname', caption: 'Actualizado por', minWidth: 140, visible: false },
    actionColumn
  ]

  const storageServiceOrderColumns = [
    actionColumn,
    { dataField: 'order_status', caption: 'Estado', width: 115, lookup: toLookup(serviceOrderStatusOptions), cellTemplate: renderStorageOrderStatus },
    {
      dataField: 'code',
      caption: 'Codigo',
      width: 125,
      cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar orden de servicio')
    },
    { dataField: 'business.name', caption: 'Empresa', minWidth: 170 },
    { dataField: 'client.full_name', caption: 'Cliente', minWidth: 220 },
    { dataField: 'expected_document_type', caption: 'Tipo comprobante', width: 160 },
    { dataField: 'currency', caption: 'Moneda', width: 105, lookup: toLookup(currencyOptions) },
    { dataField: 'created_at', caption: 'Fecha registro', dataType: 'datetime', width: 170, format: 'yyyy-MM-dd HH:mm:ss' },
    { dataField: 'creator.fullname', caption: 'Usuario registro', minWidth: 160, calculateCellValue: (data) => formatGridUser(data.creator) },
  ]

  const serviceOrderColumns = isStorageOrderList ? storageServiceOrderColumns : defaultServiceOrderColumns
  const generalOrderTotal = items.reduce((sum, row) => sum + Number(row.total || 0), 0)

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={serviceOrdersRest}
      pageSize={25}
      toolBar={(itemsBar) => {
        itemsBar.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        itemsBar.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
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
            <select ref={clientSelectRef} className='form-select' value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required>
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
            const disabled = !block.enabled || locationsLoading
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
                          {!locationsLoading && !selectedLocations.length && <span className='storage-location-picker-placeholder'>{locationOptions.length ? 'Seleccione ubicaciones' : 'Sin ubicaciones'}</span>}
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
          .storage-general-lines {
            width: 100%;
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

        <div className='table-responsive'>
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
                    <select className='form-select' value={row.service_id} onChange={(e) => onItemChange(row.uid, 'service_id', e.target.value)} required>
                      <option value=''>Seleccione servicio</option>
                      {services.map(service => <option key={`general-order-service-${service.id}`} value={service.id}>{service.name}</option>)}
                    </select>
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
    <Modal modalRef={modalRef} title={isEditing ? `Editar ${isStorageGeneral ? 'orden de servicio general' : 'orden de servicio'}` : `Agregar ${isStorageGeneral ? 'orden de servicio general' : 'orden de servicio'}`} size='xl' onSubmit={onSave}>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Código</label><input ref={codeRef} className='form-control' disabled /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Empresa</label><select ref={businessSelectRef} className='form-control' value={selectedBusinessId} onChange={async (e) => { setSelectedBusinessId(e.target.value); await loadBranches(e.target.value, ''); }} required><option value=''>Seleccione</option>{businesses.map(row => <option key={`service-order-business-${row.id}`} value={row.id}>{row.name}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Sede</label><select ref={branchSelectRef} className='form-control' value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}><option value=''>Seleccione</option>{branches.map(row => <option key={`service-order-branch-${row.id}`} value={row.id}>{row.name}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Cliente</label><select ref={clientSelectRef} className='form-control' value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required><option value=''>Seleccione</option>{clients.map(row => <option key={`service-order-client-${row.id}`} value={row.entity_id ?? row.id}>{row.full_name}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha</label><input ref={issueDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Programada</label><input ref={scheduledAtRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Primera cuota</label><input ref={firstDueDateRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Ciclo</label><input ref={billingCycleRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Comprobante</label><select ref={expectedDocumentTypeRef} className='form-control'><option value='Factura'>Factura</option><option value='Boleta'>Boleta</option></select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Moneda</label><select ref={currencyRef} className='form-control'><option value='PEN'>PEN</option><option value='USD'>USD</option></select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Pago</label><select ref={paymentConditionRef} className='form-control'><option value='Contado'>Contado</option><option value='Credito'>Crédito</option></select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Cuotas</label><input ref={installmentsRef} type='number' min='1' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Estado</label><select ref={orderStatusRef} className='form-control'>{serviceOrderStatusOptions.map((option) => <option key={`service-order-status-${option.value}`} value={option.value}>{option.label}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Facturación</label><select ref={billingStatusRef} className='form-control'>{billingStatusOptions.map((option) => <option key={`service-order-billing-status-${option.value}`} value={option.value}>{option.label}</option>)}</select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Impuesto</label><input ref={taxAmountRef} type='number' step='0.01' className='form-control' /></div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Servicios</label>
          <div className='border rounded p-2'>
            {items.map(row => <div key={row.uid} className='row align-items-end mb-2'>
              <div className='col-md-4'><label className='form-label'>Servicio</label><select className='form-control' value={row.service_id} onChange={(e) => onItemChange(row.uid, 'service_id', e.target.value)}><option value=''>Seleccione</option>{services.map(service => <option key={`service-order-item-${service.id}`} value={service.id}>{service.code} - {service.name}</option>)}</select></div>
              <div className='col-md-3'><label className='form-label'>Descripción</label><input className='form-control' value={row.description} onChange={(e) => onItemChange(row.uid, 'description', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Cant.</label><input type='number' step='0.001' className='form-control' value={row.quantity} onChange={(e) => onItemChange(row.uid, 'quantity', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>PU</label><input type='number' step='0.01' className='form-control' value={row.unit_price} onChange={(e) => onItemChange(row.uid, 'unit_price', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Det.</label><input type='number' step='0.01' className='form-control' value={row.detraction_percent} onChange={(e) => onItemChange(row.uid, 'detraction_percent', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Com.</label><input type='number' step='0.01' className='form-control' value={row.commission_percent} onChange={(e) => onItemChange(row.uid, 'commission_percent', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Total</label><input className='form-control' value={Number(row.total || 0).toFixed(2)} disabled /></div>
              <div className='col-md-1'><button type='button' className='btn btn-outline-danger w-100' onClick={() => setItems(prev => prev.length === 1 ? [emptyItem()] : prev.filter(item => item.uid !== row.uid))}>-</button></div>
            </div>)}
            <button type='button' className='btn btn-sm btn-outline-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}>Agregar servicio</button>
          </div>
        </div>
        <div className='col-12 mb-1'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
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
