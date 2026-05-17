import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import Global from '../Utils/Global';
import TakeOrdersRestClient from '../Actions/Admin/TakeOrdersRest';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { openTakeOrderPdf } from '../Utils/takeOrderPdf';
import {
  commercialOrderStatusOptions,
  dispatchStatusOptions,
  toLookup,
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

const mapItemTotals = (item) => {
  const quantity = Number(item.quantity || 0)
  const price = Number(item.price_unit || 0)
  return {
    ...item,
    total: Number.isFinite(quantity * price) ? Number((quantity * price).toFixed(2)) : 0,
  }
}

const uniqueOptions = (values) => [...new Set(values.filter(value => value !== null && value !== undefined && `${value}`.trim() !== '').map(value => `${value}`.trim()))]

const TakeOrders = ({ pageTitle = 'Toma pedido' }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const clientRef = useRef()
  const priceListRef = useRef()
  const documentTypeRef = useRef()
  const paymentConditionRef = useRef()
  const promisedDateRef = useRef()
  const deliveryAddressRef = useRef()
  const deliveryReferenceRef = useRef()
  const ubigeoRef = useRef()
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
  const [clientSnapshot, setClientSnapshot] = useState(null)
  const [networks, setNetworks] = useState([])
  const [deliveryAddresses, setDeliveryAddresses] = useState([])
  const [items, setItems] = useState([])
  const [mapPoint, setMapPoint] = useState(defaultMapPoint)

  const profile = orderProfiles[activeProfile] ?? orderProfiles.micro
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + Number(item.total || 0), 0), [items])

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

  const resolveDefaults = async (data = null) => {
    let businessId = data?.business_id ? `${data.business_id}` : selectedBusinessId
    let warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : selectedWarehouseId
    let branchId = data?.business_branch_id ? `${data.business_branch_id}` : selectedBranchId

    if (!businessId) {
      const business = await takeOrdersRest.getDefaultBusiness()
      businessId = business?.id ? `${business.id}` : ''
    }

    if (!warehouseId) {
      const warehouse = await takeOrdersRest.getDefaultWarehouse()
      warehouseId = warehouse?.id ? `${warehouse.id}` : ''
      if (!branchId && warehouse?.business_branch_id) branchId = `${warehouse.business_branch_id}`
    }

    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)
    setSelectedBranchId(branchId || '')

    return { businessId, warehouseId, branchId: branchId || '' }
  }

  const clearAddressSnapshot = () => {
    setSelectedDeliveryAddressId('')
    if (deliveryAddressRef.current) deliveryAddressRef.current.value = ''
    if (deliveryReferenceRef.current) deliveryReferenceRef.current.value = ''
    if (ubigeoRef.current) ubigeoRef.current.value = ''
    if (dispatchContactNameRef.current) dispatchContactNameRef.current.value = ''
    if (dispatchContactPhoneRef.current) dispatchContactPhoneRef.current.value = ''
    setMapPoint(defaultMapPoint)
  }

  const applyDeliveryAddressSnapshot = (address, fallbackClient = null) => {
    if (!address && !fallbackClient) {
      clearAddressSnapshot()
      return
    }

    if (deliveryAddressRef.current) deliveryAddressRef.current.value = address?.address ?? fallbackClient?.full_address ?? ''
    if (deliveryReferenceRef.current) deliveryReferenceRef.current.value = address?.reference ?? ''
    if (ubigeoRef.current) ubigeoRef.current.value = address?.ubigeo ?? fallbackClient?.ubigeo ?? ''
    if (dispatchContactNameRef.current) {
      dispatchContactNameRef.current.value = address?.contact_name ?? fallbackClient?.primary_contact ?? ''
    }
    if (dispatchContactPhoneRef.current) {
      dispatchContactPhoneRef.current.value = address?.contact_phone ?? fallbackClient?.primary_contact_phone ?? fallbackClient?.phone ?? ''
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
      clearAddressSnapshot()
      return
    }

    const data = await takeOrdersRest.getDistributionNetworks(clientId)
    const active = (data ?? []).filter(item => item.status !== null)
    setNetworks(active)

    const defaultNetworkId = preferredNetworkId || active.find(item => item.is_default)?.id || active[0]?.id
    const selectedNetwork = active.find(item => `${item.id}` === `${defaultNetworkId}`)
    setSelectedNetworkId(defaultNetworkId ? `${defaultNetworkId}` : '')
    setSelectedCommercialChannel(selectedNetwork?.commercial_channel ?? fallbackClient?.commercial_channel ?? '')
    setSelectedSegment(selectedNetwork?.segment ?? fallbackClient?.segment ?? '')
    await loadDeliveryAddresses(defaultNetworkId, preferredAddressId, active, fallbackClient)
  }

  const repriceItem = async (item, overrides = {}) => {
    const articleId = overrides.article_id ?? item.article_id
    const quantity = Number(overrides.quantity ?? item.quantity ?? 0)
    const presentationId = overrides.presentation_id ?? item.presentation_id
    if (!articleId || !selectedWarehouseId || quantity <= 0) return null

    return await takeOrdersRest.resolvePrice({
      article_id: articleId,
      presentation_id: presentationId || null,
      quantity,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      price_list_id: selectedPriceListId || null,
      client_id: selectedClientId || null,
      client_distribution_network_id: selectedNetworkId || null,
      issue_date: new Date().toISOString().slice(0, 10),
      commercial_channel: selectedCommercialChannel || null,
      segment: selectedSegment || null,
    })
  }

  const repriceAllItems = async () => {
    for (const currentItem of items) {
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

  useEffect(() => {
    if (!items.some(item => item.article_id)) return
    repriceAllItems()
  }, [selectedPriceListId, selectedCommercialChannel, selectedSegment])

  const onModalOpen = async (data = null, profileKey = 'micro') => {
    setIsEditing(!!data?.id)
    setActiveProfile(data?.order_profile ?? profileKey)

    if (idRef.current) idRef.current.value = data?.id ?? ''
    if (codeRef.current) codeRef.current.value = data?.code ?? 'Se genera al guardar'
    if (documentTypeRef.current) documentTypeRef.current.value = data?.document_type ?? 'Factura'
    if (paymentConditionRef.current) paymentConditionRef.current.value = data?.payment_condition ?? ''
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

    hydratingRef.current = true
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
    document_type: documentTypeRef.current?.value || 'Factura',
    currency: 'PEN',
    payment_condition: paymentConditionRef.current?.value || '',
    payment_method: paymentConditionRef.current?.value || '',
    issue_date: new Date().toISOString().slice(0, 10),
    promised_delivery_at: promisedDateRef.current?.value || null,
    order_status: bill ? 'billed' : 'confirmed',
    dispatch_status: 'pending',
    billing_status: bill ? 'billed' : 'pending',
    payment_status: 'pending',
    commercial_channel: selectedCommercialChannel || '',
    segment: selectedSegment || '',
    delivery_address: deliveryAddressRef.current?.value?.trim() || '',
    delivery_reference: deliveryReferenceRef.current?.value?.trim() || '',
    ubigeo: ubigeoRef.current?.value?.trim() || '',
    map_lat: mapPoint.lat,
    map_lng: mapPoint.lng,
    dispatch_contact_name: dispatchContactNameRef.current?.value?.trim() || '',
    dispatch_contact_phone: dispatchContactPhoneRef.current?.value?.trim() || '',
    purchase_order: purchaseOrderRef.current?.value?.trim() || '',
    referral_guide: referralGuideRef.current?.value?.trim() || '',
    observations: observationsRef.current?.value?.trim() || '',
    tax_amount: 0,
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
  })

  const saveOrder = async (bill = false) => {
    const result = await takeOrdersRest.save(buildRequest(bill))
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
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
    setSelectedClientId(clientId)
    setClientSnapshot(selected)

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
    setSelectedCommercialChannel(network?.commercial_channel ?? selectedCommercialChannel)
    setSelectedSegment(network?.segment ?? selectedSegment)
    await loadDeliveryAddresses(networkId, null, networks, clientSnapshot)
  }

  const onDeliveryAddressChanged = (e) => {
    const addressId = e.target.value || ''
    setSelectedDeliveryAddressId(addressId)
    const selected = deliveryAddresses.find(item => `${item.id}` === `${addressId}`)
    applyDeliveryAddressSnapshot(selected, clientSnapshot)
  }

  const onPriceListChanged = async (e) => {
    if (hydratingRef.current) return
    setSelectedPriceListId(e.target.value || '')
  }

  const onItemArticleChanged = async (uid, e) => {
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

    if (field !== 'quantity') return

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

  const onItemAdded = () => setItems(prev => [...prev, emptyItem()])
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
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const openMap = () => {
    const address = deliveryAddressRef.current?.value?.trim()
    const query = address || `${mapPoint.lat},${mapPoint.lng}`
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
  }

  const mapSrc = Global.GMAPS_API_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${Global.GMAPS_API_KEY}&q=${mapPoint.lat},${mapPoint.lng}&zoom=13`
    : ''

  return (<>
    <div className='row mb-3'>
      {Object.values(orderProfiles).map((item) => (
        <div className='col-md-4 mb-3' key={`take-order-card-${item.key}`}>
          <button
            type='button'
            className='btn btn-primary w-100 text-start py-3'
            onClick={() => onModalOpen(null, item.key)}
          >
            <div className='d-flex justify-content-between align-items-start'>
              <div>
                <div className='fw-semibold'>Crear pedido</div>
                <div className='fs-4 lh-sm'>{item.title}</div>
              </div>
              <i className='mdi mdi-file-document-outline fs-2'></i>
            </div>
          </button>
        </div>
      ))}
    </div>

    <Table
      gridRef={gridRef}
      title='Lista de Toma pedido'
      rest={takeOrdersRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
      }}
      pageSize={25}
      columns={[
        {
          caption: 'Acciones',
          width: 120,
          fixed: true,
          fixedPosition: 'left',
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar pedido',
              icon: 'mdi mdi-menu',
              onClick: () => onModalOpen(data, data?.order_profile ?? 'micro')
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger ms-1',
              title: 'Imprimir PDF',
              icon: 'mdi mdi-file-pdf-box',
              onClick: () => openTakeOrderPdf(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger ms-1',
              title: 'Eliminar pedido',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          }
        },
        { dataField: 'order_status', caption: 'Estado', width: 120, lookup: toLookup(commercialOrderStatusOptions) },
        {
          dataField: 'code',
          caption: 'Código',
          width: 120,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data, data?.order_profile ?? 'micro'), 'Editar pedido')
        },
        {
          dataField: 'referral_guide',
          caption: 'Comprobante',
          width: 130,
          calculateCellValue: (data) => data.referral_guide || '-'
        },
        { dataField: 'document_type', caption: 'Tipo comprobante', width: 145 },
        {
          dataField: 'customer',
          caption: 'Cliente',
          minWidth: 250,
          calculateCellValue: formatCustomer
        },
        { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        { dataField: 'payment_condition', caption: 'Tipo de pago', width: 140 },
        {
          dataField: 'creator.fullname',
          caption: 'Usuario',
          width: 150,
          cellTemplate: (container, { data }) => container.text(formatAuditUser(data.creator))
        },
        { dataField: 'created_at', caption: 'Fecha registro', width: 150, dataType: 'datetime' },
        {
          dataField: 'updater.fullname',
          caption: 'Usuario registro',
          width: 160,
          cellTemplate: (container, { data }) => container.text(formatAuditUser(data.updater))
        },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 160 },
        { dataField: 'dispatch_status', caption: 'Despacho', width: 120, lookup: toLookup(dispatchStatusOptions), visible: false },
      ]}
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

          <div className='col-md-6 mb-2'>
            <label className='form-label'>{profile.channelLabel}</label>
            <select className='form-control' value={selectedCommercialChannel} onChange={(e) => setSelectedCommercialChannel(e.target.value)}>
              <option value=''>Seleccione</option>
              {channelOptions.map(option => <option key={`channel-${option}`} value={option}>{option}</option>)}
            </select>
          </div>
          <div className='col-md-6 mb-2'>
            <label className='form-label'>{profile.segmentLabel}</label>
            <select className='form-control' value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)}>
              <option value=''>Seleccione</option>
              {segmentOptions.map(option => <option key={`segment-${option}`} value={option}>{option}</option>)}
            </select>
          </div>

          <div className='col-md-6 mb-2'>
            <label className='form-label'>Celular</label>
            <input className='form-control' value={clientSnapshot?.phone ?? ''} disabled readOnly />
          </div>
          <div className='col-md-6 mb-2'>
            <label className='form-label'>Tipo comprobante</label>
            <select ref={documentTypeRef} className='form-control'>
              <option value=''>Seleccione</option>
              <option value='Factura'>Factura</option>
              <option value='Boleta'>Boleta</option>
              <option value='Ticket'>Ticket</option>
            </select>
          </div>
          <div className='col-md-6 mb-2'>
            <label className='form-label'>Tipo pago</label>
            <select ref={paymentConditionRef} className='form-control'>
              <option value=''>Seleccione</option>
              <option value='Contado'>Contado</option>
              <option value='Credito'>Crédito</option>
            </select>
          </div>
          <div className='col-md-6 mb-2'>
            <label className='form-label'>Fecha entrega <i className='mdi mdi-information text-muted'></i></label>
            <input ref={promisedDateRef} type='date' className='form-control' placeholder='Fecha de documento' />
          </div>

          <div className='col-12 mb-2'>
            <label className='form-label'>Dirección</label>
            <div className='input-group'>
              <select className='form-control' value={selectedDeliveryAddressId} onChange={onDeliveryAddressChanged}>
                <option value=''>Seleccione</option>
                {deliveryAddresses.map(address => (
                  <option key={`take-order-address-${address.id}`} value={address.id}>
                    {`${address.code ?? ''} ${address.name ?? address.address ?? ''}`.trim()}
                  </option>
                ))}
              </select>
              <button type='button' className='btn btn-info text-white' title='Abrir mapa' onClick={openMap}>
                <i className='mdi mdi-map-marker'></i>
              </button>
            </div>
          </div>

          <div className='col-12 mb-2'>
            <label className='form-label'>Ubigeo</label>
            <select ref={ubigeoRef} className='form-control' defaultValue=''>
              <option value=''>Seleccione</option>
              {deliveryAddresses.map(address => address.ubigeo && (
                <option key={`take-order-ubigeo-${address.id}`} value={address.ubigeo}>{address.ubigeo}</option>
              ))}
              {clientSnapshot?.ubigeo && <option value={clientSnapshot.ubigeo}>{clientSnapshot.ubigeo}</option>}
            </select>
          </div>

          <div className='col-12 mb-2'>
            <label className='form-label'>Referencia</label>
            <input ref={deliveryReferenceRef} className='form-control' readOnly />
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
                src={mapSrc}
                className='w-100 border-0'
                style={{ height: 330 }}
                allowFullScreen=''
                loading='lazy'
                referrerPolicy='no-referrer-when-downgrade'
              ></iframe>
            ) : (
              <div className='border rounded p-3 small text-muted'>Configura GMAPS_API_KEY para habilitar el mapa.</div>
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
            <button type='button' className='btn btn-primary' onClick={onItemAdded}>
              <i className='mdi mdi-plus-circle me-1'></i>INSERTAR ARTÍCULO
            </button>
          </div>

          <div className='col-12'>
            <div className='table-responsive border'>
              <table className='table table-sm mb-0 text-center align-middle'>
                <thead>
                  <tr>
                    <th colSpan='5'>ARTÍCULO</th>
                  </tr>
                  <tr>
                    <th style={{ minWidth: 260 }}>Artículo</th>
                    <th style={{ width: 130 }}>Precio</th>
                    <th style={{ width: 140 }}>Cantidad</th>
                    <th style={{ width: 140 }}>Subtotal</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan='5' className='text-muted py-3'>Sin artículos</td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.uid}>
                      <td>
                        <SelectAPIFormGroup
                          eRef={getArticleRef(item.uid)}
                          label=''
                          searchAPI='/api/admin/articles/paginate'
                          searchBy='name'
                          dropdownParent='#take-orders-form-container'
                          onChange={(e) => onItemArticleChanged(item.uid, e)}
                        />
                        <small className='text-muted d-block text-start'>
                          {[item.article_laboratory, item.article_principle, item.article_unit].filter(Boolean).join(' | ')}
                        </small>
                      </td>
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
                        <button type='button' className='btn btn-sm btn-outline-danger' onClick={() => onItemRemoved(item.uid)}>
                          <i className='mdi mdi-close'></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan='3' className='text-end fst-italic'>Total</th>
                    <th>
                      <input className='form-control text-end' value={subtotal.toFixed(2)} readOnly />
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
  if (!properties.can('orders') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.pageTitle || 'Toma pedido'}>
    <TakeOrders {...properties} />
  </BaseAdminto>);
})
