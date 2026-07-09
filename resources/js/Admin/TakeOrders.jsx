import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '../Components/Adminto/VdTable';
import VdSelect from '../Components/Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
import Swal from 'sweetalert2';
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import Global from '../Utils/Global';
import TakeOrdersRestClient from '../Actions/Admin/TakeOrdersRest';
import { openTakeOrderPdf } from '../Utils/takeOrderPdf';
import {
  commercialOrderStatusOptions,
  dispatchStatusOptions,
  getCommercialOrderStatusLabel,
  getDispatchStatusLabel,
} from '../Utils/statusLabels';

const takeOrdersRest = new TakeOrdersRestClient()

const defaultMapPoint = { lat: -12.046374, lng: -77.042793 }

const orderProfiles = {
  micro: {
    key: 'micro',
    title: 'SOFTYS | SOFTYS MICRO',
    channelLabel: 'Giro',
    segmentLabel: 'Sub giro',
  },
  mediana: {
    key: 'mediana',
    title: 'SOFTYS | SOFTYS MEDIANA',
    channelLabel: 'Segmento',
    segmentLabel: 'Sub segmento',
  },
}

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  article_label: '',
  article_unit: '',
  article_laboratory: '',
  article_principle: '',
  presentations: [],
  presentation_id: '',
  presentation_units: 1,
  stock_available: 0,
  price_unit: 0,
  quantity: 1,
  total: 0,
  price_source: 'fallback',
  price_list_code: '',
})

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

const formatCustomer = (data) => (
  data?.client?.full_name
  ?? data?.eventual_client?.business_name
  ?? data?.eventualClient?.business_name
  ?? '-'
)

const formatDateTime = (value) => value ? `${value}`.slice(0, 19).replace('T', ' ') : ''

const mapItemTotals = (item) => {
  const quantity = Number(item.quantity || 0)
  const price = Number(item.price_unit || 0)
  return {
    ...item,
    total: Number.isFinite(quantity * price) ? Number((quantity * price).toFixed(2)) : 0,
  }
}

const shouldResolveQuantity = (value) => {
  const normalized = `${value ?? ''}`
  return normalized !== '' && !normalized.endsWith('.') && Number(normalized) > 0
}

const uniqueOptions = (values) => [...new Set(values.filter(value => value !== null && value !== undefined && `${value}`.trim() !== '').map(value => `${value}`.trim()))]

const documentTypeFromClient = (client) => {
  const documentType = `${client?.document_type ?? ''}`.trim().toLowerCase()
  if (documentType === 'ruc') return 'Factura'
  if (['dni', 'ce', 'carnet extranjeria', 'carnet de extranjeria'].includes(documentType)) return 'Boleta'
  return 'Factura'
}

const deriveDocumentTotals = (grossAmount, documentType) => {
  const gross = Math.max(0, Number(grossAmount || 0))
  if (`${documentType ?? ''}`.trim().toLowerCase() === 'nota de pedido') {
    return {
      subtotal: Number(gross.toFixed(2)),
      taxAmount: 0,
      total: Number(gross.toFixed(2)),
    }
  }

  const subtotal = Number((gross / 1.18).toFixed(2))
  return {
    subtotal,
    taxAmount: Number((gross - subtotal).toFixed(2)),
    total: Number(gross.toFixed(2)),
  }
}

const textValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') {
    return value.address ?? value.reference ?? value.name ?? value.description ?? fallback
  }
  const text = `${value}`
  return text === '[object Object]' ? fallback : text
}

const paymentConditionFromClient = (client) => Number(client?.contract_due_days || 0) > 0 ? 'Credito' : 'Contado'

const TakeOrders = ({ pageTitle = 'Toma pedido' }) => {
  const tableRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const clientRef = useRef()
  const warehouseRef = useRef()
  const priceListRef = useRef()
  const promisedDateRef = useRef()
  const deliveryAddressRef = useRef()
  const deliveryReferenceRef = useRef()
  const dispatchContactNameRef = useRef()
  const dispatchContactPhoneRef = useRef()
  const purchaseOrderRef = useRef()
  const referralGuideRef = useRef()
  const observationsRef = useRef()
  const articleRefs = useRef({})
  const hydratingRef = useRef(false)

  const [isEditing, setIsEditing] = useState(false)
  const [activeProfile, setActiveProfile] = useState('micro')
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedNetworkId, setSelectedNetworkId] = useState('')
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState('')
  const [selectedPriceListId, setSelectedPriceListId] = useState('')
  const [selectedCommercialChannel, setSelectedCommercialChannel] = useState('')
  const [selectedSegment, setSelectedSegment] = useState('')
  const [selectedDocumentType, setSelectedDocumentType] = useState('Factura')
  const [selectedPaymentCondition, setSelectedPaymentCondition] = useState('')
  const [selectedUbigeo, setSelectedUbigeo] = useState('')
  const [clientSnapshot, setClientSnapshot] = useState(null)
  const [networks, setNetworks] = useState([])
  const [deliveryAddresses, setDeliveryAddresses] = useState([])
  const [items, setItems] = useState([])
  const [mapPoint, setMapPoint] = useState(defaultMapPoint)

  const profile = orderProfiles[activeProfile] ?? orderProfiles.micro
  const grossSubtotal = useMemo(() => items.reduce((acc, item) => acc + Number(item.total || 0), 0), [items])
  const orderTotals = useMemo(() => deriveDocumentTotals(grossSubtotal, selectedDocumentType), [grossSubtotal, selectedDocumentType])

  const channelOptions = useMemo(() => uniqueOptions([
    clientSnapshot?.commercial_channel,
    ...networks.map(network => network.commercial_channel),
    selectedCommercialChannel,
  ]), [clientSnapshot, networks, selectedCommercialChannel])

  const segmentOptions = useMemo(() => uniqueOptions([
    clientSnapshot?.segment,
    ...networks.map(network => network.segment),
    selectedSegment,
  ]), [clientSnapshot, networks, selectedSegment])

  const articleSearchAPI = useMemo(() => {
    const search = new URLSearchParams()
    if (selectedBusinessId) search.append('business_id', selectedBusinessId)
    if (selectedBranchId) search.append('business_branch_id', selectedBranchId)
    if (selectedWarehouseId) search.append('warehouse_id', selectedWarehouseId)
    if (selectedClientId) search.append('client_id', selectedClientId)
    if (selectedNetworkId) search.append('client_distribution_network_id', selectedNetworkId)
    if (selectedPriceListId) search.append('price_list_id', selectedPriceListId)
    if (selectedCommercialChannel) search.append('commercial_channel', selectedCommercialChannel)
    if (selectedSegment) search.append('segment', selectedSegment)
    search.append('issue_date', new Date().toISOString().slice(0, 10))
    return `/api/admin/take-orders/articles?${search.toString()}`
  }, [
    selectedBusinessId,
    selectedBranchId,
    selectedWarehouseId,
    selectedClientId,
    selectedNetworkId,
    selectedPriceListId,
    selectedCommercialChannel,
    selectedSegment,
  ])

  const getArticleRef = (uid) => {
    if (!articleRefs.current[uid]) articleRefs.current[uid] = createRef()
    return articleRefs.current[uid]
  }

  useEffect(() => {
    items.forEach(item => {
      const ref = getArticleRef(item.uid)
      if (!ref.current || !item.article_id || !item.article_label) return
      const current = $(ref.current).val()
      if (`${current}` === `${item.article_id}`) return
      SetSelectValue(ref.current, item.article_id, item.article_label)
    })
  }, [items])

  const warehouseLabel = (warehouse) => {
    if (!warehouse) return ''
    const branchName = warehouse?.branch?.name ?? ''
    const warehouseName = warehouse?.name ?? ''
    return branchName ? `${branchName} - ${warehouseName}` : warehouseName
  }

  const loadWarehouses = async (branchId, preferredId = null) => {
    if (!branchId) {
      setSelectedWarehouseId('')
      if (warehouseRef.current) SetSelectValue(warehouseRef.current, null)
      return { warehouseId: '', warehouse: null }
    }

    const rows = await takeOrdersRest.getWarehousesByBranch(branchId)

    const preferredWarehouse = rows.find(row => `${row.id}` === `${preferredId}`)
    const nextWarehouse = preferredWarehouse ?? rows[0] ?? null
    const nextWarehouseId = nextWarehouse?.id ? `${nextWarehouse.id}` : ''
    setSelectedWarehouseId(nextWarehouseId)

    if (warehouseRef.current) {
      if (nextWarehouse) SetSelectValue(warehouseRef.current, nextWarehouseId, warehouseLabel(nextWarehouse))
      else SetSelectValue(warehouseRef.current, null)
    }

    return { warehouseId: nextWarehouseId, warehouse: nextWarehouse }
  }

  const resolveDefaults = async (data = null) => {
    let businessId = data?.business_id ? `${data.business_id}` : selectedBusinessId
    let warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : selectedWarehouseId
    let branchId = data?.business_branch_id ? `${data.business_branch_id}` : selectedBranchId

    if (!businessId) {
      const business = await takeOrdersRest.getDefaultBusiness()
      businessId = business?.id ? `${business.id}` : ''
    }

    if (!branchId && businessId) {
      const branches = await takeOrdersRest.getBranchesByBusiness(businessId)
      const activeBranches = (branches ?? []).filter(row => row.status !== null)
      branchId = activeBranches[0]?.id ? `${activeBranches[0].id}` : ''
    }

    setSelectedBusinessId(businessId)
    setSelectedBranchId(branchId || '')

    const warehouseState = await loadWarehouses(branchId || '', warehouseId || null)

    return {
      businessId,
      branchId: branchId || '',
      warehouseId: warehouseState.warehouseId,
      warehouse: warehouseState.warehouse,
    }
  }

  const clearAddressSnapshot = () => {
    setSelectedDeliveryAddressId('')
    if (deliveryAddressRef.current) deliveryAddressRef.current.value = ''
    if (deliveryReferenceRef.current) deliveryReferenceRef.current.value = ''
    setSelectedUbigeo('')
    if (dispatchContactNameRef.current) dispatchContactNameRef.current.value = ''
    if (dispatchContactPhoneRef.current) dispatchContactPhoneRef.current.value = ''
    setMapPoint(defaultMapPoint)
  }

  const applyDeliveryAddressSnapshot = (address, fallbackClient = null) => {
    if (!address && !fallbackClient) {
      clearAddressSnapshot()
      return
    }

    if (deliveryAddressRef.current) deliveryAddressRef.current.value = textValue(address?.address, textValue(fallbackClient?.full_address))
    if (deliveryReferenceRef.current) deliveryReferenceRef.current.value = textValue(address?.reference)
    setSelectedUbigeo(textValue(address?.ubigeo, textValue(fallbackClient?.ubigeo)))
    if (dispatchContactNameRef.current) {
      dispatchContactNameRef.current.value = textValue(address?.contact_name, textValue(fallbackClient?.primary_contact))
    }
    if (dispatchContactPhoneRef.current) {
      dispatchContactPhoneRef.current.value = textValue(address?.contact_phone, textValue(fallbackClient?.primary_contact_phone, textValue(fallbackClient?.phone)))
    }

    const lat = Number(address?.latitude ?? defaultMapPoint.lat)
    const lng = Number(address?.longitude ?? defaultMapPoint.lng)
    setMapPoint({
      lat: Number.isFinite(lat) ? lat : defaultMapPoint.lat,
      lng: Number.isFinite(lng) ? lng : defaultMapPoint.lng,
    })
  }

  const loadDeliveryAddresses = async (networkId, preferredId = null, currentNetworks = null, fallbackClient = null) => {
    if (!networkId) {
      setDeliveryAddresses([])
      setSelectedDeliveryAddressId('')
      applyDeliveryAddressSnapshot(null, fallbackClient)
      return
    }

    let data = []
    const hydratedNetwork = (currentNetworks ?? networks).find(item => `${item.id}` === `${networkId}`)
    if ((hydratedNetwork?.addresses?.length ?? 0) > 0) {
      data = hydratedNetwork.addresses
    } else {
      data = await takeOrdersRest.getDeliveryAddresses(networkId)
    }

    const active = (data ?? []).filter(item => item.status !== null)
    setDeliveryAddresses(active)
    const defaultId = preferredId || active.find(item => item.is_default)?.id || active[0]?.id
    if (defaultId && active.some(item => `${item.id}` === `${defaultId}`)) {
      setSelectedDeliveryAddressId(`${defaultId}`)
      applyDeliveryAddressSnapshot(active.find(item => `${item.id}` === `${defaultId}`), fallbackClient)
      return
    }

    setSelectedDeliveryAddressId('')
    applyDeliveryAddressSnapshot(null, fallbackClient)
  }

  const loadClientContext = async (clientId, preferredNetworkId = null, preferredAddressId = null, fallbackClient = null) => {
    if (!clientId) {
      setNetworks([])
      setSelectedNetworkId('')
      setDeliveryAddresses([])
      setSelectedCommercialChannel('')
      setSelectedSegment('')
      setSelectedDocumentType('')
      setSelectedPaymentCondition('')
      clearAddressSnapshot()
      return
    }

    const data = await takeOrdersRest.getDistributionNetworks(clientId)
    const active = (data ?? []).filter(item => item.status !== null)
    setNetworks(active)

    const defaultNetworkId = preferredNetworkId || active.find(item => item.is_default)?.id || active[0]?.id
    const selectedNetwork = active.find(item => `${item.id}` === `${defaultNetworkId}`)
    setSelectedNetworkId(defaultNetworkId ? `${defaultNetworkId}` : '')
    setSelectedCommercialChannel(fallbackClient?.commercial_channel ?? selectedNetwork?.commercial_channel ?? '')
    setSelectedSegment(fallbackClient?.segment ?? selectedNetwork?.segment ?? '')
    const documentType = documentTypeFromClient(fallbackClient)
    setSelectedDocumentType(documentType)
    setSelectedPaymentCondition(paymentConditionFromClient(fallbackClient))
    await loadDeliveryAddresses(defaultNetworkId, preferredAddressId, active, fallbackClient)
  }

  const repriceItem = async (item, overrides = {}) => {
    const articleId = overrides.article_id ?? item.article_id
    const quantity = Number(overrides.quantity ?? item.quantity ?? 0)
    const presentationId = overrides.presentation_id ?? item.presentation_id
    const warehouseId = overrides.warehouse_id ?? selectedWarehouseId
    if (!articleId || !warehouseId || quantity <= 0) return null

    return await takeOrdersRest.resolvePrice({
      article_id: articleId,
      presentation_id: presentationId || null,
      quantity,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: warehouseId || null,
      price_list_id: selectedPriceListId || null,
      client_id: selectedClientId || null,
      client_distribution_network_id: selectedNetworkId || null,
      issue_date: new Date().toISOString().slice(0, 10),
      commercial_channel: selectedCommercialChannel || null,
      segment: selectedSegment || null,
    })
  }

  const repriceAllItems = async (warehouseIdOverride = null) => {
    for (const currentItem of items) {
      if (!currentItem.article_id) continue
      const resolution = await repriceItem(currentItem, warehouseIdOverride ? { warehouse_id: warehouseIdOverride } : {})
      if (!resolution) continue
      setItems(prev => prev.map(item => {
        if (item.uid !== currentItem.uid) return item
        return mapItemTotals({
          ...item,
          stock_available: Number(resolution.stock_available || 0),
          price_unit: Number(resolution.price_unit || 0),
          price_source: resolution.source || 'fallback',
          price_list_code: resolution.price_list_code || '',
        })
      }))
    }
  }

  useEffect(() => {
    if (!items.some(item => item.article_id)) return
    repriceAllItems()
  }, [selectedPriceListId, selectedCommercialChannel, selectedSegment])

  const onModalOpen = async (data = null, profileKey = 'micro') => {
    setIsEditing(!!data?.id)
    setActiveProfile(data?.order_profile ?? profileKey)
    hydratingRef.current = true

    if (idRef.current) idRef.current.value = data?.id ?? ''
    if (codeRef.current) codeRef.current.value = data?.code ?? 'Se genera al guardar'
    const documentType = data?.document_type ?? 'Factura'
    setSelectedDocumentType(documentType)
    setSelectedPaymentCondition(data?.payment_condition ?? '')
    if (promisedDateRef.current) promisedDateRef.current.value = data?.promised_delivery_at ? data.promised_delivery_at.toString().slice(0, 10) : ''
    if (purchaseOrderRef.current) purchaseOrderRef.current.value = data?.purchase_order ?? ''
    if (referralGuideRef.current) referralGuideRef.current.value = data?.referral_guide ?? ''
    if (observationsRef.current) observationsRef.current.value = data?.observations ?? ''

    const defaults = await resolveDefaults(data)
    const clientId = data?.client_id ? `${data.client_id}` : ''
    const networkId = data?.client_distribution_network_id ? `${data.client_distribution_network_id}` : ''
    const addressId = data?.client_delivery_address_id ? `${data.client_delivery_address_id}` : ''
    const priceListId = data?.price_list_id ? `${data.price_list_id}` : ''

    setSelectedClientId(clientId)
    setSelectedNetworkId(networkId)
    setSelectedDeliveryAddressId(addressId)
    setSelectedPriceListId(priceListId)
    setClientSnapshot(data?.client ?? null)
    setSelectedCommercialChannel(data?.commercial_channel ?? data?.client?.commercial_channel ?? '')
    setSelectedSegment(data?.segment ?? data?.client?.segment ?? '')

    if (clientId && data?.client?.full_name) {
      SetSelectValue(clientRef.current, clientId, `${data.client.document_number ?? ''} - ${data.client.full_name}`.trim())
      setClientSnapshot(data.client)
    } else {
      SetSelectValue(clientRef.current, null)
    }

    if (priceListId && data?.price_list?.code) {
      SetSelectValue(priceListRef.current, priceListId, data.price_list.code)
    } else {
      SetSelectValue(priceListRef.current, null)
    }
    if (defaults.warehouseId && warehouseRef.current) {
      const warehouseLabelText = defaults.warehouse?.name
        ? warehouseLabel(defaults.warehouse)
        : (data?.warehouse?.name ?? defaults.warehouseId)
      SetSelectValue(warehouseRef.current, defaults.warehouseId, warehouseLabelText)
    } else if (warehouseRef.current) {
      SetSelectValue(warehouseRef.current, null)
    }
    hydratingRef.current = false

    const detail = (data?.items ?? []).map(row => {
      const article = row.article ?? null
      const presentations = (article?.presentations ?? []).filter(p => p?.status !== false && p?.status !== 0)
      const selectedPresentation = row.presentation ?? presentations[0] ?? null
      const presentationUnits = Number(row.presentation_units ?? selectedPresentation?.units ?? 1) || 1

      return mapItemTotals({
        uid: crypto.randomUUID(),
        article_id: row.article_id ? `${row.article_id}` : '',
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : '',
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
        article_laboratory: article?.laboratory?.name ?? '',
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
        presentations: presentations.map(p => ({
          id: `${p.id}`,
          name: p.name ?? 'Presentación',
          units: Number(p.units || 1),
          price: Number(p.price || 0),
        })),
        presentation_id: selectedPresentation?.id ? `${selectedPresentation.id}` : '',
        presentation_units: presentationUnits,
        stock_available: Number(row.stock_available || 0),
        price_unit: Number(row.price_unit || 0),
        quantity: Number(row.quantity || 1),
        total: Number(row.total || 0),
        price_source: row.price_source || 'fallback',
        price_list_code: row?.price_list_item?.price_list?.code || data?.price_list?.code || '',
      })
    })
    setItems(detail)

    applyDeliveryAddressSnapshot(data?.delivery_address ? {
      address: data.delivery_address,
      reference: data.delivery_reference,
      ubigeo: data.ubigeo,
      latitude: data.map_lat,
      longitude: data.map_lng,
      contact_name: data.dispatch_contact_name,
      contact_phone: data.dispatch_contact_phone,
    } : null, data?.client ?? null)

    $(modalRef.current).modal('show')

    if (clientId) {
      await loadClientContext(clientId, networkId, addressId, data?.client ?? null)
    } else {
      setNetworks([])
      setDeliveryAddresses([])
      clearAddressSnapshot()
    }
    if (data?.id) {
      const persistedDocumentType = data?.document_type ?? 'Factura'
      setSelectedDocumentType(persistedDocumentType)
      setSelectedPaymentCondition(data?.payment_condition ?? '')
    }

    setSelectedBusinessId(defaults.businessId)
    setSelectedWarehouseId(defaults.warehouseId)
    setSelectedBranchId(defaults.branchId)
  }

  const buildRequest = (bill = false) => ({
    id: idRef.current?.value || undefined,
    order_profile: activeProfile,
    business_id: selectedBusinessId || null,
    business_branch_id: selectedBranchId || null,
    warehouse_id: selectedWarehouseId || null,
    client_id: selectedClientId || null,
    client_distribution_network_id: selectedNetworkId || null,
    client_delivery_address_id: selectedDeliveryAddressId || null,
    price_list_id: selectedPriceListId || null,
    document_type: selectedDocumentType || 'Factura',
    currency: 'PEN',
    payment_condition: selectedPaymentCondition || '',
    payment_method: selectedPaymentCondition ? 'Transferencia' : '',
    issue_date: new Date().toISOString().slice(0, 10),
    promised_delivery_at: promisedDateRef.current?.value || null,
    order_status: bill ? 'billed' : 'pending',
    dispatch_status: 'pending',
    billing_status: bill ? 'billed' : 'pending',
    payment_status: 'pending',
    commercial_channel: selectedCommercialChannel || '',
    segment: selectedSegment || '',
    delivery_address: deliveryAddressRef.current?.value?.trim() || '',
    delivery_reference: deliveryReferenceRef.current?.value?.trim() || '',
    ubigeo: `${selectedUbigeo || ''}`.trim(),
    map_lat: mapPoint.lat,
    map_lng: mapPoint.lng,
    dispatch_contact_name: dispatchContactNameRef.current?.value?.trim() || '',
    dispatch_contact_phone: dispatchContactPhoneRef.current?.value?.trim() || '',
    purchase_order: purchaseOrderRef.current?.value?.trim() || '',
    referral_guide: referralGuideRef.current?.value?.trim() || '',
    observations: observationsRef.current?.value?.trim() || '',
    tax_amount: orderTotals.taxAmount,
    items: items.map(item => ({
      article_id: item.article_id || null,
      presentation_id: item.presentation_id || null,
      warehouse_id: selectedWarehouseId || null,
      stock_available: Number(item.stock_available || 0),
      presentation_units: Number(item.presentation_units || 0),
      price_unit: Number(item.price_unit || 0),
      quantity: Number(item.quantity || 0),
      total: Number(item.total || 0),
      status: true,
    })),
  })

  const saveOrder = async (bill = false) => {
    const invalidStockItem = items.find(item => {
      const baseQuantity = Number(item.quantity || 0) * (Number(item.presentation_units || 1) || 1)
      return item.article_id && baseQuantity > Number(item.stock_available || 0)
    })
    if (invalidStockItem) {
      const baseQuantity = Number(invalidStockItem.quantity || 0) * (Number(invalidStockItem.presentation_units || 1) || 1)
      await Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `${invalidStockItem.article_label || 'El articulo seleccionado'} necesita ${baseQuantity.toFixed(2)} unidad(es) base y solo tiene ${Number(invalidStockItem.stock_available || 0).toFixed(2)} disponible en el almacen elegido.`,
      })
      return
    }

    const result = await takeOrdersRest.save(buildRequest(bill))
    if (!result) return
    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()
    await saveOrder(false)
  }

  const onClientChanged = async (e) => {
    if (hydratingRef.current) return
    const clientId = e.target.value || ''
    const selected = $(e.target).select2('data')?.[0]?.data ?? null
    const clientChanged = `${selectedClientId || ''}` !== `${clientId}`

    setSelectedClientId(clientId)
    setClientSnapshot(selected)
    if (clientChanged) {
      setItems([emptyItem()])
      setSelectedPriceListId('')
      SetSelectValue(priceListRef.current, null)
    }

    if (!clientId) {
      await loadClientContext('', null, null, null)
      return
    }

    await loadClientContext(clientId, null, null, selected)
    await repriceAllItems()
  }

  const onNetworkChanged = async (e) => {
    const networkId = e.target.value || ''
    setSelectedNetworkId(networkId)
    const network = networks.find(item => `${item.id}` === `${networkId}`)
    setSelectedCommercialChannel(clientSnapshot?.commercial_channel ?? network?.commercial_channel ?? '')
    setSelectedSegment(clientSnapshot?.segment ?? network?.segment ?? '')
    await loadDeliveryAddresses(networkId, null, networks, clientSnapshot)
    await repriceAllItems()
  }

  const onDeliveryAddressChanged = (value) => {
    const addressId = value || ''
    setSelectedDeliveryAddressId(addressId)
    const selected = deliveryAddresses.find(item => `${item.id}` === `${addressId}`)
    applyDeliveryAddressSnapshot(selected, clientSnapshot)
  }

  const onPriceListChanged = async (e) => {
    if (hydratingRef.current) return
    const priceListId = e.target.value || ''
    const selected = $(e.target).select2('data')?.[0]?.data ?? null
    setSelectedPriceListId(priceListId)

    if (selected?.business_branch_id) setSelectedBranchId(`${selected.business_branch_id}`)
    if (selected?.warehouse_id) {
      const warehouseId = `${selected.warehouse_id}`
      setSelectedWarehouseId(warehouseId)
      if (warehouseRef.current) {
        SetSelectValue(warehouseRef.current, warehouseId, warehouseLabel(selected.warehouse ?? selected))
      }
      await repriceAllItems(warehouseId)
      return
    }

    await repriceAllItems()
  }

  const onWarehouseChanged = async (e) => {
    if (hydratingRef.current) return
    const warehouseId = e.target.value || ''
    const selected = $(e.target).select2('data')?.[0]?.data ?? null

    setSelectedWarehouseId(warehouseId)
    if (selected?.business_branch_id) setSelectedBranchId(`${selected.business_branch_id}`)
    await repriceAllItems(warehouseId)
  }

  const onItemArticleChanged = async (uid, e) => {
    if (!selectedClientId) {
      SetSelectValue(e.target, null)
      return
    }
    const selected = $(e.target).select2('data')?.[0]
    const article = selected?.data ?? null
    const articleId = e.target.value || ''

    if (!articleId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...emptyItem(), uid: item.uid } : item))
      return
    }

    const hydrated = article ?? await takeOrdersRest.getArticleById(articleId)
    const presentations = (hydrated?.presentations ?? []).filter(p => p?.status !== false && p?.status !== 0)
    const defaultPresentation = presentations[0] ?? null
    const articleLabel = hydrated
      ? `${hydrated.code ?? ''} - ${hydrated.name ?? ''}`.trim()
      : (selected?.text ?? articleId)

    const draftItem = {
      article_id: articleId,
      article_label: articleLabel,
      article_unit: hydrated?.unit?.symbol ?? hydrated?.unit?.name ?? '',
      article_laboratory: hydrated?.laboratory?.name ?? '',
      article_principle: hydrated?.activePrinciple?.name ?? hydrated?.active_principle?.name ?? '',
      presentations: presentations.map(p => ({
        id: `${p.id}`,
        name: p.name ?? 'Presentación',
        units: Number(p.units || 1),
        price: Number(p.price || 0),
      })),
      presentation_id: defaultPresentation ? `${defaultPresentation.id}` : '',
      presentation_units: Number(defaultPresentation?.units || 1),
      quantity: 1,
    }

    setItems(prev => prev.map(item => item.uid === uid ? mapItemTotals({ ...item, ...draftItem }) : item))

    const resolution = await repriceItem({ ...draftItem, uid }, {
      article_id: articleId,
      presentation_id: defaultPresentation ? `${defaultPresentation.id}` : null,
      quantity: 1,
    })

    if (!resolution) return
    setItems(prev => prev.map(item => item.uid === uid ? mapItemTotals({
      ...item,
      ...draftItem,
      stock_available: Number(resolution.stock_available || 0),
      price_unit: Number(resolution.price_unit || 0),
      price_source: resolution.source || 'fallback',
      price_list_code: resolution.price_list_code || '',
    }) : item))
  }

  const onItemFieldChanged = async (uid, field, value) => {
    const currentItem = items.find(item => item.uid === uid)
    if (!currentItem) return

    const nextState = mapItemTotals({ ...currentItem, [field]: value })
    setItems(prev => prev.map(item => item.uid === uid ? nextState : item))

    if (field !== 'quantity' || !shouldResolveQuantity(value)) return

    const resolution = await repriceItem(nextState, { quantity: value })
    if (!resolution) return

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      return mapItemTotals({
        ...item,
        stock_available: Number(resolution.stock_available || 0),
        price_unit: Number(resolution.price_unit || 0),
        price_source: resolution.source || 'fallback',
        price_list_code: resolution.price_list_code || '',
      })
    }))
  }

  const onItemAdded = async () => {
    if (!selectedClientId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Cliente obligatorio',
        text: 'Debes seleccionar un cliente antes de agregar articulos',
      })
      return
    }
    setItems(prev => [...prev, emptyItem()])
  }
  const onItemRemoved = (uid) => setItems(prev => prev.filter(item => item.uid !== uid))

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar toma pedido',
      text: '¿Estás seguro de eliminar este toma pedido? Esta acción no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await takeOrdersRest.delete(id)
    if (!result) return
    tableRef.current?.refresh()
  }

  const openMap = () => {
    const address = deliveryAddressRef.current?.value?.trim()
    const query = address || `${mapPoint.lat},${mapPoint.lng}`
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
  }

  const googleMapsApiKey = `${Global.GMAPS_API_KEY ?? ''}`.trim()
  const mapQuery = deliveryAddressRef.current?.value?.trim() || `${mapPoint.lat},${mapPoint.lng}` || 'Lima Peru'
  const mapSrc = googleMapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(mapQuery)}&zoom=13`
    : ''

  const rowActions = (row) => [
    { icon: 'mdi mdi-pencil', title: 'Editar pedido', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r, r?.order_profile ?? 'micro') },
    { icon: 'mdi mdi-file-pdf-box', title: 'Imprimir PDF', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openTakeOrderPdf(r) },
    { icon: 'mdi mdi-delete', title: 'Eliminar pedido', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
  ]

  return (<>
    <VdTable
      ref={tableRef}
      rest={takeOrdersRest}
      icon='mdi mdi-cart-outline'
      title='Toma pedido'
      unit='pedidos'
      defaultPageSize={25}
      searchFields={['code', 'referral_guide', 'client.full_name', 'eventual_client.business_name', 'business.name', 'creator.fullname']}
      searchPlaceholder='Buscar por código, comprobante, cliente o empresa…'
      emptyText='No se encontraron tomas de pedido.'
      headerActions={<>
        {Object.values(orderProfiles).map((item) => (
          <button key={item.key} type='button' className='vdt-btn-pri' title={`Crear pedido ${item.title}`} onClick={() => onModalOpen(null, item.key)}>
            <i className='mdi mdi-plus'></i> {item.title}
          </button>
        ))}
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar tabla' onClick={() => tableRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
      </>}
      actions={rowActions}
      columns={[
        {
          key: 'estado', label: 'Estado', field: 'order_status', width: '120px',
          filter: { type: 'select', options: commercialOrderStatusOptions },
          render: (row) => getCommercialOrderStatusLabel(row.order_status),
        },
        {
          key: 'codigo', label: 'Código', field: 'code', width: '150px', filter: { type: 'text' },
          render: (row) => (
            <a className='admin-grid-edit-link' style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row, row?.order_profile ?? 'micro')} title='Editar pedido'>
              {row.code}
            </a>
          ),
        },
        {
          key: 'comprobante', label: 'Comprobante', field: 'referral_guide', width: '130px', filter: { type: 'text' },
          render: (row) => row.referral_guide || '-',
        },
        { key: 'tipo_comprobante', label: 'Tipo comprobante', field: 'document_type', width: '145px', filter: { type: 'text' } },
        {
          key: 'cliente', label: 'Cliente', field: 'client.full_name', sortable: false,
          filter: { type: 'text', fields: ['client.full_name', 'eventual_client.business_name'] },
          render: (row) => formatCustomer(row),
        },
        {
          key: 'total', label: 'Total', field: 'total', width: '110px', align: 'right', filter: { type: 'number' },
          render: (row) => Number(row.total || 0).toFixed(2),
        },
        { key: 'tipo_pago', label: 'Tipo de pago', field: 'payment_condition', width: '140px', filter: { type: 'text' } },
        {
          key: 'usuario', label: 'Usuario', field: 'creator.fullname', width: '150px',
          filter: { type: 'text', field: 'creator.fullname' },
          render: (row) => formatAuditUser(row.creator),
        },
        {
          key: 'fecha_registro', label: 'Fecha registro', field: 'created_at', width: '150px', filter: { type: 'date' },
          render: (row) => formatDateTime(row.created_at),
        },
        {
          key: 'usuario_registro', label: 'Usuario registro', field: 'updater.fullname', width: '160px',
          filter: { type: 'text', field: 'updater.fullname' },
          render: (row) => formatAuditUser(row.updater),
        },
        {
          key: 'empresa', label: 'Empresa', field: 'business.name', visible: false, sortable: false,
          filter: { type: 'text', field: 'business.name' },
        },
        {
          key: 'despacho', label: 'Despacho', field: 'dispatch_status', visible: false,
          filter: { type: 'select', options: dispatchStatusOptions },
          render: (row) => getDispatchStatusLabel(row.dispatch_status),
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className='vdt-card' onClick={() => onModalOpen(row, row?.order_profile ?? 'micro')}>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.code}</p>
              <small className='text-muted'>{formatCustomer(row)}</small>
            </div>
            <span className='badge badge-soft-primary'>{getCommercialOrderStatusLabel(row.order_status)}</span>
          </div>
          <div className='d-flex justify-content-between mt-2'>
            <small className='text-muted'>{row.document_type}</small>
            <span className='fw-semibold'>S/ {Number(row.total || 0).toFixed(2)}</span>
          </div>
          <small className='text-muted d-block mt-1'>{formatDateTime(row.created_at)}</small>
          {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal
      modalRef={modalRef}
      title={<h4 className='modal-title'><i className='mdi mdi-menu me-2'></i>REGISTRAR PEDIDO</h4>}
      size='lg'
      hideFooter
      onSubmit={onModalSubmit}
    >
      <div id='take-orders-form-container' className='px-2 pb-2'>
        <input ref={idRef} type='hidden' />
        <input ref={codeRef} type='hidden' />
        <input ref={deliveryAddressRef} type='hidden' />

        <div className='text-center mb-3'>
          <h3 className='fw-semibold mb-3'>{profile.title}</h3>
          <hr />
          <h4 className='fw-semibold mb-2'>Buscar cliente</h4>
        </div>

        <div className='row'>
          <div className='col-12 mb-2'>
            <div className='input-group'>
              <div className='flex-grow-1'>
                <SelectAPIFormGroup
                  eRef={clientRef}
                  label=''
                  searchAPI='/api/admin/clients/paginate'
                  searchBy='full_name'
                  selectBy='entity_id'
                  dropdownParent='#take-orders-form-container'
                  filter={['client_kind', '=', 'regular']}
                  onChange={onClientChanged}
                />
              </div>
              <button type='button' className='btn btn-info text-white mb-2' title='Agregar cliente' onClick={() => window.open('/admin/clients', '_blank')}>
                <i className='mdi mdi-account-plus'></i>
              </button>
            </div>
          </div>

          <VdSelect
            label={profile.channelLabel}
            col='col-md-6'
            disabled
            value={selectedCommercialChannel}
            onChange={setSelectedCommercialChannel}
            options={channelOptions.map(option => ({ value: option, label: option }))}
            placeholder='Seleccione'
          />
          <VdSelect
            label={profile.segmentLabel}
            col='col-md-6'
            disabled
            value={selectedSegment}
            onChange={setSelectedSegment}
            options={segmentOptions.map(option => ({ value: option, label: option }))}
            placeholder='Seleccione'
          />

          <div className='col-md-6 mb-2'>
            <label className='form-label'>Celular</label>
            <input className='form-control' value={clientSnapshot?.phone ?? ''} disabled readOnly />
          </div>
          <VdSelect
            label='Tipo comprobante'
            col='col-md-6'
            disabled
            value={selectedDocumentType}
            onChange={setSelectedDocumentType}
            options={[
              { value: 'Factura', label: 'Factura' },
              { value: 'Boleta', label: 'Boleta' },
              { value: 'Nota de pedido', label: 'Nota de pedido' },
            ]}
            placeholder='Seleccione'
          />
          <VdSelect
            label='Tipo pago'
            col='col-md-6'
            disabled
            value={selectedPaymentCondition}
            onChange={setSelectedPaymentCondition}
            options={[
              { value: 'Contado', label: 'TRANSFERENCIA [CONTADO]' },
              { value: 'Credito', label: 'TRANSFERENCIA [CREDITO]' },
            ]}
            placeholder='Seleccione'
          />
          <div className='col-md-6 mb-2'>
            <label className='form-label'>Fecha entrega <i className='mdi mdi-information text-muted'></i></label>
            <input ref={promisedDateRef} type='date' className='form-control' placeholder='Fecha de documento' />
          </div>

          <div className='col-12 mb-2'>
            <label className='form-label'>Dirección</label>
            <div className='d-flex align-items-start' style={{ gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <VdSelect
                  noMargin
                  value={selectedDeliveryAddressId}
                  onChange={onDeliveryAddressChanged}
                  options={deliveryAddresses.map(address => ({
                    value: `${address.id}`,
                    label: `${address.code ?? ''} ${address.name ?? address.address ?? ''}`.trim(),
                  }))}
                  placeholder='Seleccione'
                />
              </div>
              <button type='button' className='btn btn-info text-white' style={{ height: 38 }} title='Abrir mapa' onClick={openMap}>
                <i className='mdi mdi-map-marker'></i>
              </button>
            </div>
          </div>

          <VdSelect
            label='Ubigeo'
            col='col-12'
            disabled
            value={selectedUbigeo}
            onChange={setSelectedUbigeo}
            options={[
              ...deliveryAddresses.filter(address => address.ubigeo).map(address => ({ value: address.ubigeo, label: address.ubigeo })),
              ...(clientSnapshot?.ubigeo ? [{ value: clientSnapshot.ubigeo, label: clientSnapshot.ubigeo }] : []),
            ]}
            placeholder='Seleccione'
          />

          <div className='col-12 mb-2'>
            <label className='form-label'>Referencia</label>
            <input ref={deliveryReferenceRef} className='form-control' disabled readOnly />
          </div>
          <div className='col-md-6 mb-2'>
            <label className='form-label'>Nombre contacto</label>
            <input ref={dispatchContactNameRef} className='form-control' placeholder='Nombre de contacto' />
          </div>
          <div className='col-md-6 mb-2'>
            <label className='form-label'>Celular contacto</label>
            <input ref={dispatchContactPhoneRef} className='form-control' placeholder='Celular de contacto' />
          </div>

          <div className='col-12 mb-3'>
            {mapSrc ? (
              <iframe
                title='Mapa de entrega'
                src={mapSrc}
                className='w-100 border-0'
                style={{ height: 330 }}
                allowFullScreen=''
                loading='lazy'
                referrerPolicy='no-referrer-when-downgrade'
              ></iframe>
            ) : (
              <div className='d-flex align-items-center justify-content-center text-muted bg-light border rounded' style={{ minHeight: 220 }}>
                Configura Google Maps API Key en Sistemas &gt; Datos generales &gt; Integraciones para ver el mapa.
              </div>
            )}
          </div>

          <div className='col-md-6 mb-2'>
            <label className='form-label'>Orden de compra</label>
            <input ref={purchaseOrderRef} className='form-control' />
          </div>
          <div className='col-md-6 mb-2'>
            <label className='form-label'>Guía remisión</label>
            <input ref={referralGuideRef} className='form-control' />
          </div>
          <div className='col-12 mb-3'>
            <TextareaFormGroup eRef={observationsRef} label='Observación' rows={3} />
          </div>

          <div className='col-md-6 mb-3'>
            <SelectAPIFormGroup
              eRef={warehouseRef}
              label='Almacén'
              searchAPI='/api/admin/warehouses/paginate'
              searchBy='name'
              dropdownParent='#take-orders-form-container'
              filter={selectedBranchId ? [['business_branch_id', '=', Number(selectedBranchId)], 'and', ['status', '=', true]] : ['status', '=', true]}
              onChange={onWarehouseChanged}
            />
          </div>

          <div className='col-12 text-center mb-2'>
            <label className='form-label d-block fw-bold'>Tarifario</label>
            <SelectAPIFormGroup
              eRef={priceListRef}
              label=''
              searchAPI='/api/admin/price-lists/paginate'
              searchBy='code'
              dropdownParent='#take-orders-form-container'
              filter={['status', '=', true]}
              onChange={onPriceListChanged}
            />
          </div>

          <div className='col-12 text-center mb-3'>
            <button type='button' className='btn btn-primary' onClick={onItemAdded} disabled={!selectedClientId}>
              <i className='mdi mdi-plus-circle me-1'></i>INSERTAR ARTÍCULO
            </button>
          </div>

          <div className='col-12'>
            <div className='table-responsive border'>
              <table className='table table-sm mb-0 text-center align-middle'>
                <thead>
                  <tr>
                    <th colSpan='6'>ARTÍCULO</th>
                  </tr>
                  <tr>
                    <th style={{ minWidth: 260 }}>Artículo</th>
                    <th style={{ width: 120 }}>Stock</th>
                    <th style={{ width: 130 }}>Precio</th>
                    <th style={{ width: 140 }}>Cantidad</th>
                    <th style={{ width: 140 }}>Subtotal</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan='6' className='text-muted py-3'>Sin artículos</td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.uid}>
                      <td>
                        <SelectAPIFormGroup
                          eRef={getArticleRef(item.uid)}
                          label=''
                          searchAPI={articleSearchAPI}
                          searchBy='name'
                          dropdownParent='#take-orders-form-container'
                          disabled={!selectedClientId}
                          onChange={(e) => onItemArticleChanged(item.uid, e)}
                        />
                        <small className='text-muted d-block text-start'>
                          {[item.article_laboratory, item.article_principle, item.article_unit].filter(Boolean).join(' | ')}
                        </small>
                      </td>
                      <td>{Number(item.stock_available || 0).toFixed(2)}</td>
                      <td>
                        <input
                          type='number'
                          step='0.01'
                          min='0'
                          className='form-control'
                          value={item.price_unit ?? ''}
                          onChange={(e) => onItemFieldChanged(item.uid, 'price_unit', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type='number'
                          step='0.01'
                          min='0.01'
                          className='form-control'
                          value={item.quantity ?? ''}
                          onChange={(e) => onItemFieldChanged(item.uid, 'quantity', e.target.value)}
                        />
                      </td>
                      <td>{Number(item.total || 0).toFixed(2)}</td>
                      <td>
                        <button type='button' className='btn btn-sm btn-outline-danger' onClick={() => onItemRemoved(item.uid)}>
                          <i className='mdi mdi-close'></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan='4' className='text-end fst-italic'>Subtotal</th>
                    <th>
                      <input className='form-control text-end' value={orderTotals.subtotal.toFixed(2)} readOnly />
                    </th>
                    <th></th>
                  </tr>
                  <tr>
                    <th colSpan='4' className='text-end fst-italic'>IGV</th>
                    <th>
                      <input className='form-control text-end' value={orderTotals.taxAmount.toFixed(2)} readOnly />
                    </th>
                    <th></th>
                  </tr>
                  <tr>
                    <th colSpan='4' className='text-end fst-italic'>Total</th>
                    <th>
                      <input className='form-control text-end' value={orderTotals.total.toFixed(2)} readOnly />
                    </th>
                    <th></th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className='col-12 d-flex justify-content-center gap-3 mt-4'>
            <button type='button' className='btn btn-primary' onClick={() => saveOrder(false)}>
              <i className='mdi mdi-plus me-1'></i>Registrar
            </button>
            <button type='button' className='btn btn-primary' onClick={() => saveOrder(true)}>
              <i className='mdi mdi-plus me-1'></i>Registrar y Facturar
            </button>
            <button type='button' className='btn btn-light' data-bs-dismiss='modal'>
              <i className='mdi mdi-close me-1'></i>Cerrar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('take-orders') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.pageTitle || 'Toma pedido'}>
    <TakeOrders {...properties} />
  </BaseAdminto>);
})
