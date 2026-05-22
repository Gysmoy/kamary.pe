import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import CommercialOrdersRest from '../Actions/Admin/CommercialOrdersRest';
import ReferralGuidesRest from '../Actions/Admin/ReferralGuidesRest';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import {
  billingStatusOptions,
  commercialOrderStatusOptions,
  dispatchStatusOptions,
  getDispatchStatusLabel,
  getReferralGuideStatusLabel,
  paymentStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const commercialOrdersRest = new CommercialOrdersRest()
const referralGuidesRest = new ReferralGuidesRest()

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

const mapItemTotals = (item) => {
  const quantity = Number(item.quantity || 0)
  const price = Number(item.price_unit || 0)
  return {
    ...item,
    total: Number.isFinite(quantity * price) ? Number((quantity * price).toFixed(2)) : 0,
  }
}

const normalizeDocumentType = (value) => {
  const normalized = `${value ?? ''}`.trim().toLowerCase()
  if (normalized === 'boleta') return 'Boleta'
  if (['nota de pedido', 'nota_pedido', 'note_order'].includes(normalized)) return 'Nota de pedido'
  return 'Factura'
}

const textValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') {
    return value.address ?? value.reference ?? value.name ?? value.description ?? fallback
  }
  const text = `${value}`
  return text === '[object Object]' ? fallback : text
}

const isTaxableDocumentType = (documentType) => ['Factura', 'Boleta'].includes(normalizeDocumentType(documentType))

const deriveDocumentTotals = (grossAmount, documentType) => {
  const gross = Number(grossAmount || 0)
  if (!isTaxableDocumentType(documentType)) {
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

const dispatchStatusSequence = ['pending', 'preparing', 'dispatched', 'in_route', 'delivered']
const orderGuides = (order) => order?.referral_guides ?? order?.referralGuides ?? []
const guideNumber = (guide) => guide?.external_reference || [guide?.series, guide?.sequence].filter(Boolean).join('-') || guide?.code || '-'
const canIssueGuide = (guide) => guide && !['accepted', 'cancelled'].includes(guide.guide_status)
const orderEvidences = (order) => order?.delivery_evidences ?? order?.deliveryEvidences ?? []
const latestEvidence = (order) => orderEvidences(order)[0] ?? null
const orderTrackingEvents = (order) => order?.tracking_events ?? order?.trackingEvents ?? []
const isEvidenceImage = (value) => {
  const url = `${value ?? ''}`.trim()
  return url.startsWith('blob:')
    || url.startsWith('data:image/')
    || /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(url)
    || url.includes('/delivery-evidence-media/')
}
const nowDateTimeLocal = () => {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

const getNextDispatchStatus = (value) => {
  const currentIndex = dispatchStatusSequence.indexOf(`${value ?? ''}`)
  if (currentIndex < 0 || currentIndex === dispatchStatusSequence.length - 1) return null
  return dispatchStatusSequence[currentIndex + 1]
}

const buildTrackingRows = (order) => {
  if (!order) return []
  const persistedRows = orderTrackingEvents(order).map((event) => ({
    date: event.happened_at ?? event.created_at,
    status: [event.title, event.description].filter(Boolean).join(' - '),
  }))
  const rows = [
    { date: order.created_at, status: 'La orden ingreso en el sistema' },
  ]

  if (order.approved_at && ['preparing', 'in_route', 'delivered', 'dispatched', 'billed', 'closed'].includes(order.order_status)) {
    rows.push({ date: order.approved_at, status: 'La orden paso a preparacion' })
  } else if (order.approved_at && order.order_status === 'confirmed') {
    rows.push({ date: order.approved_at, status: 'La orden fue confirmada' })
  } else if (['preparing', 'in_route', 'delivered', 'dispatched', 'billed', 'closed'].includes(order.order_status)) {
    rows.push({ date: order.updated_at, status: 'La orden paso a preparacion' })
  }

  const assignments = (order.dispatch_assignments ?? order.dispatchAssignments ?? [])
    .filter(item => item?.status !== false && item?.status !== 0 && item?.dispatch)
    .sort((left, right) => new Date(left?.dispatch?.departed_at || left?.dispatch?.scheduled_date || 0) - new Date(right?.dispatch?.departed_at || right?.dispatch?.scheduled_date || 0))

  const firstRoute = assignments.find(item => ['in_route', 'delivered', 'closed'].includes(item?.dispatch?.dispatch_status))
  if (firstRoute) {
    rows.push({
      date: firstRoute.dispatch.departed_at ?? firstRoute.dispatch.updated_at ?? firstRoute.dispatch.created_at,
      status: `Manifiesto ${firstRoute.dispatch.manifest_code || firstRoute.dispatch.code || ''}`.trim(),
    })
    rows.push({
      date: firstRoute.dispatch.departed_at ?? firstRoute.dispatch.updated_at ?? firstRoute.dispatch.created_at,
      status: 'El pedido salio en ruta',
    })
  } else if (order.dispatch_status === 'in_route') {
    rows.push({ date: order.updated_at, status: 'El pedido salio en ruta' })
  }

  if (order.dispatch_status === 'dispatched' || assignments.some(item => item?.dispatch?.dispatch_status === 'dispatched')) {
    rows.push({ date: order.updated_at, status: 'El pedido paso a despacho' })
  }

  orderGuides(order).forEach((guide) => {
    rows.push({
      date: guide.issue_date ?? guide.created_at ?? order.updated_at,
      status: `Guia de remision ${guideNumber(guide)} - ${getReferralGuideStatusLabel(guide.guide_status)}`,
    })
  })

  const deliveredDispatch = assignments.find(item => ['delivered', 'closed'].includes(item?.dispatch?.dispatch_status))
  if (deliveredDispatch) {
    rows.push({
      date: deliveredDispatch.dispatch.delivered_at ?? deliveredDispatch.dispatch.updated_at ?? deliveredDispatch.dispatch.created_at,
      status: 'El pedido fue entregado',
    })
  } else if (order.dispatch_status === 'delivered') {
    rows.push({ date: order.updated_at, status: 'El pedido fue entregado' })
  }

  if (order.order_status === 'cancelled' || order.dispatch_status === 'cancelled') {
    rows.push({ date: order.updated_at, status: 'El pedido fue cancelado' })
  }

  return [...persistedRows, ...rows]
    .filter(row => row.date)
    .sort((left, right) => new Date(left.date) - new Date(right.date))
}

const CommercialOrders = ({ requiredPermission = 'orders', externalSource = null, pageTitle = 'Pedidos comerciales' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const trackingModalRef = useRef()
  const evidenceModalRef = useRef()
  const evidenceFileRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const businessRef = useRef()
  const branchRef = useRef()
  const warehouseRef = useRef()
  const clientRef = useRef()
  const eventualClientRef = useRef()
  const issueDateRef = useRef()
  const promisedDateRef = useRef()
  const documentTypeRef = useRef()
  const currencyRef = useRef()
  const paymentConditionRef = useRef()
  const paymentMethodRef = useRef()
  const installmentsRef = useRef()
  const firstDueDateRef = useRef()
  const orderStatusRef = useRef()
  const dispatchStatusRef = useRef()
  const billingStatusRef = useRef()
  const taxAmountRef = useRef()
  const deliveryAddressRef = useRef()
  const deliveryReferenceRef = useRef()
  const ubigeoRef = useRef()
  const dispatchContactNameRef = useRef()
  const dispatchContactPhoneRef = useRef()
  const observationsRef = useRef()
  const articleRefs = useRef({})

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedEventualClientId, setSelectedEventualClientId] = useState('')
  const [selectedNetworkId, setSelectedNetworkId] = useState('')
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState('')
  const [branches, setBranches] = useState([])
  const [networks, setNetworks] = useState([])
  const [deliveryAddresses, setDeliveryAddresses] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [selectedDocumentType, setSelectedDocumentType] = useState('Factura')
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [evidenceOrder, setEvidenceOrder] = useState(null)
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [evidencePreview, setEvidencePreview] = useState('')
  const [evidenceForm, setEvidenceForm] = useState({
    recipient_name: '',
    recipient_document_type: 'DNI',
    recipient_document_number: '',
    recipient_phone: '',
    delivered_at: nowDateTimeLocal(),
    evidence_notes: '',
    evidence_url: '',
    latitude: '',
    longitude: '',
  })

  const articleSearchAPI = useMemo(() => {
    const search = new URLSearchParams()
    if (selectedBusinessId) search.append('business_id', selectedBusinessId)
    if (selectedBranchId) search.append('business_branch_id', selectedBranchId)
    if (selectedWarehouseId) search.append('warehouse_id', selectedWarehouseId)
    if (selectedClientId) search.append('client_id', selectedClientId)
    if (selectedEventualClientId) search.append('eventual_client_id', selectedEventualClientId)
    if (selectedNetworkId) search.append('client_distribution_network_id', selectedNetworkId)
    if (issueDateRef.current?.value) search.append('issue_date', issueDateRef.current.value)
    return `/api/admin/commercial-orders/articles?${search.toString()}`
  }, [
    selectedBusinessId,
    selectedBranchId,
    selectedWarehouseId,
    selectedClientId,
    selectedEventualClientId,
    selectedNetworkId,
  ])

  useEffect(() => {
    return () => {
      if (evidencePreview?.startsWith('blob:')) URL.revokeObjectURL(evidencePreview)
    }
  }, [evidencePreview])

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

  const loadBranches = async (businessId, preferredId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
      return
    }
    const data = await commercialOrdersRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return
    }
    setSelectedBranchId('')
  }

  const loadNetworks = async (clientId, preferredId = null) => {
    if (!clientId) {
      setNetworks([])
      setSelectedNetworkId('')
      setDeliveryAddresses([])
      setSelectedDeliveryAddressId('')
      return
    }
    const data = await commercialOrdersRest.getDistributionNetworks(clientId)
    const active = (data ?? []).filter(item => item.status !== null)
    setNetworks(active)
    const defaultId = preferredId || active.find(item => item.is_default)?.id
    if (defaultId && active.some(item => `${item.id}` === `${defaultId}`)) {
      setSelectedNetworkId(`${defaultId}`)
      await loadDeliveryAddresses(defaultId, null, active)
      return
    }
    setSelectedNetworkId('')
    setDeliveryAddresses([])
    setSelectedDeliveryAddressId('')
  }

  const loadDeliveryAddresses = async (networkId, preferredId = null, currentNetworks = null) => {
    if (!networkId) {
      setDeliveryAddresses([])
      setSelectedDeliveryAddressId('')
      return
    }
    let data = []
    const hydratedNetwork = (currentNetworks ?? networks).find(item => `${item.id}` === `${networkId}`)
    if ((hydratedNetwork?.addresses?.length ?? 0) > 0) {
      data = hydratedNetwork.addresses
    } else {
      data = await commercialOrdersRest.getDeliveryAddresses(networkId)
    }
    const active = (data ?? []).filter(item => item.status !== null)
    setDeliveryAddresses(active)
    const defaultId = preferredId || active.find(item => item.is_default)?.id
    if (defaultId && active.some(item => `${item.id}` === `${defaultId}`)) {
      setSelectedDeliveryAddressId(`${defaultId}`)
      applyDeliveryAddressSnapshot(active.find(item => `${item.id}` === `${defaultId}`))
      return
    }
    setSelectedDeliveryAddressId('')
  }

  const applyDeliveryAddressSnapshot = (address) => {
    if (!address) return
    if (deliveryAddressRef.current) deliveryAddressRef.current.value = textValue(address.address)
    if (deliveryReferenceRef.current) deliveryReferenceRef.current.value = textValue(address.reference)
    if (ubigeoRef.current) ubigeoRef.current.value = textValue(address.ubigeo)
    if (dispatchContactNameRef.current) dispatchContactNameRef.current.value = textValue(address.contact_name)
    if (dispatchContactPhoneRef.current) dispatchContactPhoneRef.current.value = textValue(address.contact_phone)
  }

  const repriceItem = async (item, overrides = {}) => {
    const articleId = overrides.article_id ?? item.article_id
    const quantity = Number(overrides.quantity ?? item.quantity ?? 0)
    const presentationId = overrides.presentation_id ?? item.presentation_id
    if (!articleId || !selectedWarehouseId || quantity <= 0) return null

    return await commercialOrdersRest.resolvePrice({
      article_id: articleId,
      presentation_id: presentationId || null,
      quantity,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      client_id: selectedClientId || null,
      eventual_client_id: selectedEventualClientId || null,
      client_distribution_network_id: selectedNetworkId || null,
      issue_date: issueDateRef.current?.value || null,
      commercial_channel: (networks.find(row => `${row.id}` === `${selectedNetworkId}`)?.commercial_channel) || null,
      segment: (networks.find(row => `${row.id}` === `${selectedNetworkId}`)?.segment) || null,
    })
  }

  const repriceAllItems = async (nextItems = null) => {
    const currentItems = nextItems ?? items
    for (const currentItem of currentItems) {
      if (!currentItem.article_id) continue
      const resolution = await repriceItem(currentItem)
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

  const clearCustomerSelections = (type) => {
    if (type === 'regular') {
      setSelectedEventualClientId('')
      $(eventualClientRef.current).empty().trigger('change')
    } else if (type === 'eventual') {
      setSelectedClientId('')
      setNetworks([])
      setSelectedNetworkId('')
      setDeliveryAddresses([])
      setSelectedDeliveryAddressId('')
      $(clientRef.current).empty().trigger('change')
    }
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)

    if (idRef.current) idRef.current.value = data?.id ?? ''
    if (codeRef.current) codeRef.current.value = data?.code ?? 'Se genera al guardar'
    if (issueDateRef.current) issueDateRef.current.value = data?.issue_date ? data.issue_date.toString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    if (promisedDateRef.current) promisedDateRef.current.value = data?.promised_delivery_at ? data.promised_delivery_at.toString().slice(0, 10) : ''
    setSelectedDocumentType(normalizeDocumentType(data?.document_type ?? 'Factura'))
    if (currencyRef.current) currencyRef.current.value = data?.currency ?? 'PEN'
    if (paymentConditionRef.current) paymentConditionRef.current.value = data?.payment_condition ?? 'Contado'
    if (paymentMethodRef.current) paymentMethodRef.current.value = data?.payment_method ?? 'Transferencia'
    if (installmentsRef.current) installmentsRef.current.value = data?.installments ?? 1
    if (firstDueDateRef.current) firstDueDateRef.current.value = data?.first_due_date ? data.first_due_date.toString().slice(0, 10) : ''
    if (orderStatusRef.current) orderStatusRef.current.value = data?.order_status ?? (data?.external_source ? 'pending' : 'draft')
    if (dispatchStatusRef.current) dispatchStatusRef.current.value = data?.dispatch_status ?? 'pending'
    if (billingStatusRef.current) billingStatusRef.current.value = data?.billing_status ?? 'pending'
    if (deliveryAddressRef.current) deliveryAddressRef.current.value = textValue(data?.delivery_address)
    if (deliveryReferenceRef.current) deliveryReferenceRef.current.value = textValue(data?.delivery_reference)
    if (ubigeoRef.current) ubigeoRef.current.value = textValue(data?.ubigeo)
    if (dispatchContactNameRef.current) dispatchContactNameRef.current.value = textValue(data?.dispatch_contact_name)
    if (dispatchContactPhoneRef.current) dispatchContactPhoneRef.current.value = textValue(data?.dispatch_contact_phone)
    if (observationsRef.current) observationsRef.current.value = data?.observations ?? ''

    const businessId = data?.business_id ? `${data.business_id}` : ''
    const warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : ''
    const clientId = data?.client_id ? `${data.client_id}` : ''
    const eventualClientId = data?.eventual_client_id ? `${data.eventual_client_id}` : ''
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)
    setSelectedClientId(clientId)
    setSelectedEventualClientId(eventualClientId)

    if (businessId && data?.business?.name) SetSelectValue(businessRef.current, businessId, data.business.name)
    else $(businessRef.current).empty().trigger('change')
    if (warehouseId && data?.warehouse?.name) SetSelectValue(warehouseRef.current, warehouseId, data.warehouse.name)
    else $(warehouseRef.current).empty().trigger('change')
    if (clientId && data?.client?.full_name) SetSelectValue(clientRef.current, clientId, `${data.client.document_number ?? ''} - ${data.client.full_name}`.trim())
    else $(clientRef.current).empty().trigger('change')
    if (eventualClientId && data?.eventual_client?.business_name) SetSelectValue(eventualClientRef.current, eventualClientId, `${data.eventual_client.document_number ?? ''} - ${data.eventual_client.business_name}`.trim())
    else $(eventualClientRef.current).empty().trigger('change')

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
          name: p.name ?? 'Presentacion',
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
    const loadedItems = detail.length ? detail : [emptyItem()]
    setItems(loadedItems)

    $(modalRef.current).modal('show')
    await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
    if (clientId) {
      await loadNetworks(clientId, data?.client_distribution_network_id ?? null)
      if (data?.client_distribution_network_id) {
        await loadDeliveryAddresses(data.client_distribution_network_id, data?.client_delivery_address_id ?? null)
      }
    } else {
      setNetworks([])
      setSelectedNetworkId('')
      setDeliveryAddresses([])
      setSelectedDeliveryAddressId('')
    }
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current?.value || undefined,
      external_source: externalSource || undefined,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      client_id: selectedClientId || null,
      eventual_client_id: selectedEventualClientId || null,
      client_distribution_network_id: selectedNetworkId || null,
      client_delivery_address_id: selectedDeliveryAddressId || null,
      document_type: selectedDocumentType,
      currency: currencyRef.current?.value || 'PEN',
      payment_condition: paymentConditionRef.current?.value || 'Contado',
      payment_method: paymentMethodRef.current?.value || '',
      issue_date: issueDateRef.current?.value || '',
      promised_delivery_at: promisedDateRef.current?.value || null,
      installments: installmentsRef.current?.value || 1,
      first_due_date: firstDueDateRef.current?.value || null,
      order_status: orderStatusRef.current?.value || (externalSource ? 'pending' : 'draft'),
      dispatch_status: dispatchStatusRef.current?.value || 'pending',
      billing_status: billingStatusRef.current?.value || 'pending',
      tax_amount: orderTotals.taxAmount,
      delivery_address: deliveryAddressRef.current?.value?.trim() || '',
      delivery_reference: deliveryReferenceRef.current?.value?.trim() || '',
      ubigeo: ubigeoRef.current?.value?.trim() || '',
      dispatch_contact_name: dispatchContactNameRef.current?.value?.trim() || '',
      dispatch_contact_phone: dispatchContactPhoneRef.current?.value?.trim() || '',
      observations: observationsRef.current?.value?.trim() || '',
      items: items.map(item => ({
        article_id: item.article_id || null,
        presentation_id: item.presentation_id || null,
        warehouse_id: selectedWarehouseId || null,
        stock_available: item.stock_available,
        presentation_units: item.presentation_units,
        price_unit: item.price_unit,
        quantity: item.quantity,
        total: item.total,
        status: true,
      })),
    }

    const result = await commercialOrdersRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBusinessChanged = async (e) => {
    const businessId = e.target.value || ''
    setSelectedBusinessId(businessId)
    await loadBranches(businessId, null)
  }

  const onWarehouseChanged = async (e) => {
    const warehouseId = e.target.value || ''
    setSelectedWarehouseId(warehouseId)
    await repriceAllItems()
  }

  const onClientChanged = async (e) => {
    const clientId = e.target.value || ''
    setSelectedClientId(clientId)
    clearCustomerSelections('regular')
    await loadNetworks(clientId, null)
    await repriceAllItems()
  }

  const onEventualClientChanged = async (e) => {
    const eventualClientId = e.target.value || ''
    setSelectedEventualClientId(eventualClientId)
    clearCustomerSelections('eventual')
    await repriceAllItems()
  }

  const onNetworkChanged = async (e) => {
    const networkId = e.target.value || ''
    setSelectedNetworkId(networkId)
    await loadDeliveryAddresses(networkId, null)
    await repriceAllItems()
  }

  const onDeliveryAddressChanged = (e) => {
    const addressId = e.target.value || ''
    setSelectedDeliveryAddressId(addressId)
    const selected = deliveryAddresses.find(item => `${item.id}` === `${addressId}`)
    if (selected) applyDeliveryAddressSnapshot(selected)
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await commercialOrdersRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const openTracking = (data) => {
    setTrackingOrder(data)
    $(trackingModalRef.current).modal('show')
  }

  const openEvidence = (data) => {
    const evidence = latestEvidence(data)
    setEvidenceOrder(data)
    setEvidenceFile(null)
    setEvidencePreview(isEvidenceImage(evidence?.evidence_url) ? evidence.evidence_url : '')
    setEvidenceForm({
      recipient_name: evidence?.recipient_name ?? data?.dispatch_contact_name ?? '',
      recipient_document_type: evidence?.recipient_document_type ?? 'DNI',
      recipient_document_number: evidence?.recipient_document_number ?? '',
      recipient_phone: evidence?.recipient_phone ?? data?.dispatch_contact_phone ?? '',
      delivered_at: evidence?.delivered_at ? `${evidence.delivered_at}`.replace(' ', 'T').slice(0, 16) : nowDateTimeLocal(),
      evidence_notes: evidence?.evidence_notes ?? '',
      evidence_url: evidence?.evidence_url ?? '',
      latitude: evidence?.latitude ?? '',
      longitude: evidence?.longitude ?? '',
    })
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setEvidenceForm(prev => ({
          ...prev,
          latitude: prev.latitude || position.coords.latitude,
          longitude: prev.longitude || position.coords.longitude,
        }))
      }, () => {}, { enableHighAccuracy: true, timeout: 5000 })
    }
    setTimeout(() => {
      if (evidenceFileRef.current) evidenceFileRef.current.value = ''
    }, 0)
    $(evidenceModalRef.current).modal('show')
  }

  const onEvidenceFileChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setEvidenceFile(file)
    setEvidencePreview(file ? URL.createObjectURL(file) : (isEvidenceImage(evidenceForm.evidence_url) ? evidenceForm.evidence_url : ''))
  }

  const onEvidenceFieldChange = (field, value) => setEvidenceForm(prev => ({ ...prev, [field]: value }))

  const saveEvidence = async (e) => {
    e.preventDefault()
    if (!evidenceOrder?.id) return

    const assignment = (evidenceOrder.dispatch_assignments ?? evidenceOrder.dispatchAssignments ?? [])
      .filter(item => item?.status !== false && item?.status !== 0 && item?.dispatch)
      .sort((left, right) => new Date(right?.dispatch?.scheduled_date || right?.created_at || 0) - new Date(left?.dispatch?.scheduled_date || left?.created_at || 0))[0]

    const request = new FormData()
    if (assignment?.dispatch_id) request.append('dispatch_id', assignment.dispatch_id)
    request.append('recipient_name', evidenceForm.recipient_name ?? '')
    request.append('recipient_document_type', evidenceForm.recipient_document_type ?? 'DNI')
    request.append('recipient_document_number', evidenceForm.recipient_document_number ?? '')
    request.append('recipient_phone', evidenceForm.recipient_phone ?? '')
    request.append('delivered_at', evidenceForm.delivered_at ?? '')
    request.append('evidence_notes', evidenceForm.evidence_notes ?? '')
    request.append('evidence_url', evidenceForm.evidence_url ?? '')
    request.append('latitude', evidenceForm.latitude ?? '')
    request.append('longitude', evidenceForm.longitude ?? '')
    if (evidenceFile) request.append('evidence_file', evidenceFile)

    const result = await commercialOrdersRest.saveDeliveryEvidence(evidenceOrder.id, request)
    if (!result) return
    setEvidenceFile(null)
    setEvidencePreview('')
    if (evidenceFileRef.current) evidenceFileRef.current.value = ''
    $(evidenceModalRef.current).modal('hide')
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onOpenReferralGuide = async (order) => {
    const existingGuide = orderGuides(order)[0]
    if (existingGuide) {
      if (canIssueGuide(existingGuide)) {
        const result = await Swal.fire({
          title: 'Guia de remision',
          text: `La guia ${guideNumber(existingGuide)} esta ${getReferralGuideStatusLabel(existingGuide.guide_status).toLowerCase()}.`,
          icon: 'question',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Emitir',
          denyButtonText: 'Ver PDF',
          cancelButtonText: 'Cancelar'
        })

        if (result.isConfirmed) {
          const issued = await referralGuidesRest.issue(existingGuide.id)
          if (!issued?.data) return
          $(gridRef.current).dxDataGrid('instance').refresh()
          await openMagistralesRecordPdf(buildMagistralesRows.referralGuide(issued.data))
          return
        }

        if (!result.isDenied) return
      }

      await openMagistralesRecordPdf(buildMagistralesRows.referralGuide(existingGuide))
      return
    }

    const result = await referralGuidesRest.prepareFromCommercialOrder(order.id)
    if (!result?.data) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    await openMagistralesRecordPdf(buildMagistralesRows.referralGuide(result.data))
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar pedido comercial',
      text: 'Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await commercialOrdersRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onItemArticleChanged = async (uid, e) => {
    const selected = $(e.target).select2('data')?.[0]
    const article = selected?.data ?? null
    const articleId = e.target.value || ''

    if (!articleId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...emptyItem(), uid: item.uid } : item))
      return
    }

    const hydrated = article ?? await commercialOrdersRest.getArticleById(articleId)
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
        name: p.name ?? 'Presentacion',
        units: Number(p.units || 1),
        price: Number(p.price || 0),
      })),
      presentation_id: defaultPresentation ? `${defaultPresentation.id}` : '',
      presentation_units: Number(defaultPresentation?.units || 1),
      quantity: 1,
    }

    setItems(prev => prev.map(item => item.uid === uid ? mapItemTotals({ ...item, ...draftItem }) : item))

    const resolution = await commercialOrdersRest.resolvePrice({
      article_id: articleId,
      presentation_id: defaultPresentation ? `${defaultPresentation.id}` : null,
      quantity: 1,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      client_id: selectedClientId || null,
      eventual_client_id: selectedEventualClientId || null,
      client_distribution_network_id: selectedNetworkId || null,
      issue_date: issueDateRef.current?.value || null,
      commercial_channel: (networks.find(row => `${row.id}` === `${selectedNetworkId}`)?.commercial_channel) || null,
      segment: (networks.find(row => `${row.id}` === `${selectedNetworkId}`)?.segment) || null,
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

    if (!['quantity', 'presentation_id'].includes(field)) return

    const presentation = nextState.presentations.find(row => `${row.id}` === `${field === 'presentation_id' ? value : nextState.presentation_id}`)
    const resolution = await repriceItem(nextState, {
      quantity: field === 'quantity' ? value : nextState.quantity,
      presentation_id: field === 'presentation_id' ? value : nextState.presentation_id,
    })
    if (!resolution) return

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      return mapItemTotals({
        ...item,
        presentation_units: Number(presentation?.units || item.presentation_units || 1),
        stock_available: Number(resolution.stock_available || 0),
        price_unit: Number(resolution.price_unit || 0),
        price_source: resolution.source || 'fallback',
        price_list_code: resolution.price_list_code || '',
      })
    }))
  }

  const onItemAdded = () => setItems(prev => [...prev, emptyItem()])
  const onItemRemoved = (uid) => {
    setItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyItem()]
    })
  }

  const grossSubtotal = useMemo(() => items.reduce((acc, item) => acc + Number(item.total || 0), 0), [items])
  const orderTotals = useMemo(() => deriveDocumentTotals(grossSubtotal, selectedDocumentType), [grossSubtotal, selectedDocumentType])
  const trackingRows = useMemo(() => buildTrackingRows(trackingOrder), [trackingOrder])

  return (<>
    <Table
      gridRef={gridRef}
      title={pageTitle}
      rest={commercialOrdersRest}
      filterValue={externalSource ? ['external_source', '=', externalSource] : null}
      toolBar={(container) => {
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
            hint: 'Agregar pedido comercial',
            onClick: () => onModalOpen(null)
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', width: 80 },
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 130,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar pedido')
        },
        { dataField: 'external_order_id', caption: 'Pedido VTEX', width: 150, visible: !!externalSource },
        { dataField: 'external_ecommerce', caption: 'Ecommerce', width: 140, visible: !!externalSource },
        { dataField: 'external_channel', caption: 'Canal', width: 130, visible: !!externalSource },
        { dataField: 'external_subservice', caption: 'Subservicio', width: 130, visible: !!externalSource },
        { dataField: 'external_sync_status', caption: 'Sync', width: 110, visible: !!externalSource },
        { dataField: 'issue_date', caption: 'F. emision', width: 110, dataType: 'date' },
        { dataField: 'promised_delivery_at', caption: 'F. entrega', width: 110, dataType: 'date' },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 140 },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 120 },
        {
          dataField: 'customer',
          caption: 'Cliente',
          minWidth: 240,
          calculateCellValue: (data) => data.client?.full_name ?? data.eventual_client?.business_name ?? '-'
        },
        {
          dataField: 'distribution_network_name',
          caption: 'Red',
          minWidth: 160,
          calculateCellValue: (data) => data.distribution_network?.name ?? data.distributionNetwork?.name ?? '-'
        },
        { dataField: 'order_status', caption: 'Estado comercial', width: 120, lookup: toLookup(commercialOrderStatusOptions) },
        { dataField: 'dispatch_status', caption: 'Estado entrega', width: 120, lookup: toLookup(dispatchStatusOptions) },
        { dataField: 'billing_status', caption: 'Facturacion', width: 110, lookup: toLookup(billingStatusOptions) },
        { dataField: 'payment_status', caption: 'Cobranza', width: 110, lookup: toLookup(paymentStatusOptions) },
        { dataField: 'document_type', caption: 'Doc. venta', width: 120, calculateCellValue: (data) => normalizeDocumentType(data?.document_type) },
        {
          caption: 'Guia',
          width: 140,
          calculateCellValue: (data) => {
            const guides = orderGuides(data)
            if (guides.length === 0) return '-'
            if (guides.length === 1) return guideNumber(guides[0])
            return `${guides.length} guias`
          }
        },
        {
          caption: 'Evidencia',
          width: 150,
          calculateCellValue: (data) => {
            const evidence = latestEvidence(data)
            if (!evidence) return '-'
            return evidence.recipient_name || evidence.code || 'Registrada'
          }
        },
        { dataField: 'currency', caption: 'Moneda', width: 90 },
        { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        {
          dataField: 'accounts_receivable_code',
          caption: 'CXC',
          width: 140,
          calculateCellValue: (data) => data.accounts_receivable?.code ?? data.accountsReceivable?.code ?? '-'
        },
        {
          dataField: 'items.id',
          caption: 'Detalle',
          minWidth: 280,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            const lines = (data?.items ?? []).map(item => `${item?.article?.name || 'Articulo'} | Cant. ${Number(item?.quantity || 0).toFixed(2)} | ${data.currency} ${Number(item?.total || 0).toFixed(2)}`)
            ReactAppend(container, <div>
              {lines.length === 0 && <small className='text-muted'>Sin detalle</small>}
              {lines.map((line, idx) => <div key={`commercial-order-${data.id}-${idx}`}><small>{line}</small></div>)}
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
          caption: 'Activo',
          dataType: 'boolean',
          width: 95,
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
          width: 335,
          fixed: true,
          fixedPosition: 'right',
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar pedido',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))
            const nextStatus = getNextDispatchStatus(data?.dispatch_status)
            if (nextStatus) {
              container.append(DxButton({
                className: 'btn btn-xs btn-soft-success ms-1',
                title: `Pasar a ${getDispatchStatusLabel(nextStatus)}`,
                icon: 'mdi mdi-arrow-right-bold-circle-outline',
                onClick: () => onBooleanChange({ id: data.id, field: 'dispatch_status', value: nextStatus })
              }))
            }
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-info ms-1',
              title: 'Tracking pedido',
              icon: 'mdi mdi-map-marker-path',
              onClick: () => openTracking(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-warning ms-1',
              title: orderGuides(data).length ? 'Ver guia' : 'Generar guia',
              icon: 'mdi mdi-file-document-plus-outline',
              onClick: () => onOpenReferralGuide(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-success ms-1',
              title: latestEvidence(data) ? 'Ver evidencia' : 'Registrar evidencia',
              icon: 'mdi mdi-image-check-outline',
              onClick: () => openEvidence(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger ms-1',
              title: 'Imprimir PDF',
              icon: 'mdi mdi-file-pdf-box',
              onClick: () => openMagistralesRecordPdf(buildMagistralesRows.commercialOrder(data))
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger ms-1',
              title: 'Eliminar pedido',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          }
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar pedido comercial' : 'Agregar pedido comercial'} size='xl' onSubmit={onModalSubmit}>
      <div id='commercial-orders-form-container' className='row'>
        <input ref={idRef} type='hidden' />
        <div className='col-md-3'>
          <label className='form-label'>Codigo</label>
          <input ref={codeRef} className='form-control' readOnly />
        </div>
        <div className='col-md-3'>
          <SelectAPIFormGroup eRef={businessRef} label='Empresa' required searchAPI='/api/admin/businesses/paginate' searchBy='name' dropdownParent='#commercial-orders-form-container' onChange={onBusinessChanged} />
        </div>
        <div className='col-md-3'>
          <SelectFormGroup eRef={branchRef} label='Sede' dropdownParent='#commercial-orders-form-container' value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value || '')}>
            <option value=''>Sin sede</option>
            {branches.map(branch => <option key={`commercial-order-branch-${branch.id}`} value={branch.id}>{branch.name}</option>)}
          </SelectFormGroup>
        </div>
        <div className='col-md-3'>
          <SelectAPIFormGroup eRef={warehouseRef} label='Almacen' required searchAPI='/api/admin/warehouses/paginate' searchBy='name' dropdownParent='#commercial-orders-form-container' onChange={onWarehouseChanged} />
        </div>

        <div className='col-md-3'>
          <label className='form-label'>Fecha emision</label>
          <input ref={issueDateRef} type='date' className='form-control' required />
        </div>
        <div className='col-md-3'>
          <label className='form-label'>Entrega prometida</label>
          <input ref={promisedDateRef} type='date' className='form-control' />
        </div>
        <div className='col-md-2'>
          <label className='form-label'>Doc. venta</label>
          <select ref={documentTypeRef} className='form-control' value={selectedDocumentType} onChange={(e) => setSelectedDocumentType(normalizeDocumentType(e.target.value))}>
            <option value='Factura'>Factura</option>
            <option value='Boleta'>Boleta</option>
            <option value='Nota de pedido'>Nota de pedido</option>
          </select>
        </div>
        <div className='col-md-2'>
          <label className='form-label'>Moneda</label>
          <select ref={currencyRef} className='form-control'>
            <option value='PEN'>PEN</option>
            <option value='USD'>USD</option>
            <option value='EUR'>EUR</option>
          </select>
        </div>
        <div className='col-md-2'>
          <label className='form-label'>Pago</label>
          <select ref={paymentConditionRef} className='form-control'>
            <option value='Contado'>Contado</option>
            <option value='Credito'>Credito</option>
          </select>
        </div>

        <div className='col-md-6'>
          <SelectAPIFormGroup eRef={clientRef} label='Cliente regular' searchAPI='/api/admin/clients/paginate' searchBy='full_name' dropdownParent='#commercial-orders-form-container' onChange={onClientChanged} />
        </div>
        <div className='col-md-6'>
          <SelectAPIFormGroup eRef={eventualClientRef} label='Cliente eventual' searchAPI='/api/admin/eventual-clients/paginate' searchBy='business_name' dropdownParent='#commercial-orders-form-container' onChange={onEventualClientChanged} />
        </div>

        <div className='col-md-4'>
          <label className='form-label'>Red / Nodo</label>
          <select className='form-control' value={selectedNetworkId} onChange={onNetworkChanged}>
            <option value=''>Sin red</option>
            {networks.map(network => (
              <option key={`commercial-order-network-${network.id}`} value={network.id}>
                {`${network.code ?? ''} ${network.name ?? ''}`.trim()}
              </option>
            ))}
          </select>
        </div>
        <div className='col-md-4'>
          <label className='form-label'>Direccion de entrega</label>
          <select className='form-control' value={selectedDeliveryAddressId} onChange={onDeliveryAddressChanged}>
            <option value=''>Sin direccion ligada</option>
            {deliveryAddresses.map(address => (
              <option key={`commercial-order-address-${address.id}`} value={address.id}>
                {`${address.code ?? ''} ${address.name ?? ''}`.trim()}
              </option>
            ))}
          </select>
        </div>
        <div className='col-md-4'>
          <label className='form-label'>Metodo de pago</label>
          <input ref={paymentMethodRef} className='form-control' placeholder='Transferencia, Yape, Efectivo...' />
        </div>

        <div className='col-md-2'>
          <label className='form-label'>Cuotas</label>
          <input ref={installmentsRef} type='number' min='1' step='1' defaultValue='1' className='form-control' />
        </div>
        <div className='col-md-2'>
          <label className='form-label'>Primera cuota</label>
          <input ref={firstDueDateRef} type='date' className='form-control' />
        </div>
        <div className='col-md-3'>
          <label className='form-label'>Estado pedido</label>
          <select ref={orderStatusRef} className='form-control'>
            {commercialOrderStatusOptions.map((option) => (
              <option key={`commercial-order-status-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className='col-md-2'>
          <label className='form-label'>Despacho</label>
          <select ref={dispatchStatusRef} className='form-control'>
            {dispatchStatusOptions
              .filter((option) => ['pending', 'preparing', 'dispatched', 'in_route', 'delivered', 'cancelled'].includes(option.value))
              .map((option) => (
                <option key={`commercial-order-dispatch-status-${option.value}`} value={option.value}>{option.label}</option>
              ))}
          </select>
        </div>
        <div className='col-md-3'>
          <label className='form-label'>Facturacion</label>
          <select ref={billingStatusRef} className='form-control'>
            {billingStatusOptions.map((option) => (
              <option key={`commercial-order-billing-status-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className='col-md-8'>
          <TextareaFormGroup eRef={deliveryAddressRef} label='Direccion de entrega' rows={2} />
        </div>
        <div className='col-md-4'>
          <TextareaFormGroup eRef={deliveryReferenceRef} label='Referencia entrega' rows={2} />
        </div>
        <div className='col-md-3'>
          <label className='form-label'>Ubigeo</label>
          <input ref={ubigeoRef} className='form-control' />
        </div>
        <div className='col-md-4'>
          <label className='form-label'>Contacto despacho</label>
          <input ref={dispatchContactNameRef} className='form-control' />
        </div>
        <div className='col-md-3'>
          <label className='form-label'>Telefono despacho</label>
          <input ref={dispatchContactPhoneRef} className='form-control' />
        </div>
        <div className='col-md-2'>
          <label className='form-label'>Impuesto</label>
          <input ref={taxAmountRef} type='number' step='0.01' className='form-control' value={orderTotals.taxAmount} readOnly />
        </div>

        <div className='col-12 mt-3 d-flex justify-content-between align-items-center'>
          <h5 className='mb-0'>Detalle del pedido</h5>
          <button type='button' className='btn btn-sm btn-outline-primary' onClick={onItemAdded}>
            Agregar item
          </button>
        </div>

        <div className='col-12 mt-2'>
          <div className='table-responsive border rounded'>
            <table className='table table-sm align-middle mb-0'>
              <thead>
                <tr>
                  <th style={{ minWidth: 260 }}>Articulo</th>
                  <th style={{ minWidth: 120 }}>Presentacion</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Origen precio</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uid}>
                    <td>
                      <SelectAPIFormGroup
                        eRef={getArticleRef(item.uid)}
                        searchAPI={articleSearchAPI}
                        searchBy='name'
                        dropdownParent='#commercial-orders-form-container'
                        disabled={!selectedWarehouseId}
                        onChange={(e) => onItemArticleChanged(item.uid, e)}
                      />
                      <small className='text-muted d-block mt-1'>
                        {[item.article_laboratory, item.article_principle, item.article_unit].filter(Boolean).join(' | ') || 'Sin datos'}
                      </small>
                    </td>
                    <td>
                      <select
                        className='form-control'
                        value={item.presentation_id}
                        onChange={(e) => onItemFieldChanged(item.uid, 'presentation_id', e.target.value)}
                      >
                        <option value=''>Sin presentacion</option>
                        {item.presentations.map(presentation => (
                          <option key={`commercial-order-presentation-${item.uid}-${presentation.id}`} value={presentation.id}>
                            {`${presentation.name} (${presentation.units})`}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{Number(item.stock_available || 0).toFixed(2)}</td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        className='form-control'
                        value={item.price_unit}
                        onChange={(e) => onItemFieldChanged(item.uid, 'price_unit', Number(e.target.value || 0))}
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0.01'
                        className='form-control'
                        value={item.quantity}
                        onChange={(e) => onItemFieldChanged(item.uid, 'quantity', Number(e.target.value || 0))}
                      />
                    </td>
                    <td>{Number(item.total || 0).toFixed(2)}</td>
                    <td>
                      <small className='text-muted d-block'>{item.price_source || '-'}</small>
                      <small className='text-muted d-block'>{item.price_list_code || '-'}</small>
                    </td>
                    <td className='text-end'>
                      <button type='button' className='btn btn-sm btn-outline-danger' onClick={() => onItemRemoved(item.uid)}>
                        <i className='mdi mdi-close'></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan='5' className='text-end'>Subtotal</th>
                  <th>{orderTotals.subtotal.toFixed(2)}</th>
                  <th colSpan='2'></th>
                </tr>
                <tr>
                  <th colSpan='5' className='text-end'>Impuesto</th>
                  <th>{orderTotals.taxAmount.toFixed(2)}</th>
                  <th colSpan='2'></th>
                </tr>
                <tr>
                  <th colSpan='5' className='text-end'>Total</th>
                  <th>{orderTotals.total.toFixed(2)}</th>
                  <th colSpan='2'></th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className='col-12 mt-3'>
          <TextareaFormGroup eRef={observationsRef} label='Observaciones' rows={3} />
        </div>
      </div>
    </Modal>

    <Modal modalRef={trackingModalRef} title='Tracking del pedido' size='lg' hideButtonSubmit>
      <div className='table-responsive'>
        <table className='table table-sm align-middle mb-0'>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {trackingRows.length === 0 && (
              <tr>
                <td colSpan='2' className='text-muted text-center py-3'>Sin eventos registrados.</td>
              </tr>
            )}
            {trackingRows.map((row, index) => (
              <tr key={`commercial-order-tracking-${index}`}>
                <td>{new Date(row.date).toLocaleString('es-PE')}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>

    <Modal modalRef={evidenceModalRef} title='Evidencia de entrega' size='lg' btnSubmitText='Registrar' onSubmit={saveEvidence}>
      <div className='row'>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Recibido por</label>
          <input className='form-control' value={evidenceForm.recipient_name} onChange={(e) => onEvidenceFieldChange('recipient_name', e.target.value)} />
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Tipo doc.</label>
          <select className='form-control' value={evidenceForm.recipient_document_type} onChange={(e) => onEvidenceFieldChange('recipient_document_type', e.target.value)}>
            <option value='DNI'>DNI</option>
            <option value='RUC'>RUC</option>
            <option value='CE'>CE</option>
            <option value='OTRO'>Otro</option>
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Numero</label>
          <input className='form-control' value={evidenceForm.recipient_document_number} onChange={(e) => onEvidenceFieldChange('recipient_document_number', e.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Telefono</label>
          <input className='form-control' value={evidenceForm.recipient_phone} onChange={(e) => onEvidenceFieldChange('recipient_phone', e.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Fecha y hora entrega</label>
          <input type='datetime-local' className='form-control' value={evidenceForm.delivered_at} onChange={(e) => onEvidenceFieldChange('delivered_at', e.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Foto / evidencia</label>
          <input ref={evidenceFileRef} className='form-control' type='file' accept='image/png,image/jpeg,image/webp,image/gif' capture='environment' onChange={onEvidenceFileChange} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Enlace evidencia</label>
          <input className='form-control' value={evidenceForm.evidence_url} onChange={(e) => onEvidenceFieldChange('evidence_url', e.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Latitud</label>
          <input className='form-control' value={evidenceForm.latitude} onChange={(e) => onEvidenceFieldChange('latitude', e.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Longitud</label>
          <input className='form-control' value={evidenceForm.longitude} onChange={(e) => onEvidenceFieldChange('longitude', e.target.value)} />
        </div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Observaciones</label>
          <textarea className='form-control' rows='3' value={evidenceForm.evidence_notes} onChange={(e) => onEvidenceFieldChange('evidence_notes', e.target.value)} />
        </div>
        <div className='col-12'>
          <div className='border rounded p-3'>
            {evidencePreview ? (
              <img
                src={evidencePreview}
                alt='Evidencia de entrega'
                className='img-fluid rounded border bg-light'
                style={{ maxHeight: 360, width: '100%', objectFit: 'contain' }}
              />
            ) : evidenceForm.evidence_url ? (
              <a href={evidenceForm.evidence_url} target='_blank' rel='noreferrer'>Abrir evidencia registrada</a>
            ) : (
              <div className='text-muted py-4 text-center'>Sin evidencia registrada</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('orders') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.pageTitle || 'Pedidos comerciales'}>
    <CommercialOrders {...properties} />
  </BaseAdminto>);
})
