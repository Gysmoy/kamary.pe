import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Global from '../Utils/Global';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
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
  getReferralGuideStatusLabel,
  paymentStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const commercialOrdersRest = new CommercialOrdersRest()
const referralGuidesRest = new ReferralGuidesRest()
const regularClientFilter = ['client_kind', '=', 'regular']
const lineDiscountOptions = [1, 2, 3, 4, 5]

const appendGridActionButton = (container, { variant, title, icon, onClick }) => {
  const button = $('<button type="button"></button>')
    .addClass(`btn btn-xs btn-soft-${variant} commercial-order-action-btn`)
    .attr('title', title)
    .attr('aria-label', title)
    .append($('<i></i>').addClass(icon))
    .on('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      onClick()
    })

  container.append(button)
}

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  article_label: '',
  article_code: '',
  article_lot: '',
  article_name: '',
  article_unit: '',
  article_laboratory: '',
  article_principle: '',
  presentations: [],
  presentation_id: '',
  presentation_units: 1,
  stock_available: 0,
  price_unit: 0,
  quantity: 1,
  gross_total: 0,
  discount_type: 'none',
  discount_value: 0,
  discount_amount: 0,
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

const roundMoney = (value) => Number((Number(value || 0)).toFixed(2))
const isManualPrice = (item) => item?.price_source === 'manual'
const resolvePriceUnitValue = (item, resolution, force = false) => {
  const currentPrice = Number(item?.price_unit || 0)
  const resolvedPrice = Number(resolution?.price_unit)
  if (!force && isManualPrice(item)) return currentPrice
  if (!Number.isFinite(resolvedPrice)) return currentPrice
  if (!force && resolvedPrice <= 0 && currentPrice > 0) return currentPrice
  return resolvedPrice
}
const resolvePriceSourceValue = (item, resolution, force = false) => {
  if (!force && isManualPrice(item)) return 'manual'
  return resolution?.source || item?.price_source || 'fallback'
}
const normalizePositiveNumberText = (value) => {
  const normalized = `${value ?? ''}`
    .replace(',', '.')
    .replace(/[^\d.]/g, '')
  if (!normalized) return ''

  const [wholeRaw, ...fractionParts] = normalized.split('.')
  const whole = wholeRaw.replace(/^0+(?=\d)/, '') || (wholeRaw || fractionParts.length ? '0' : '')
  const fraction = fractionParts.length ? `.${fractionParts.join('')}` : ''
  return `${whole}${fraction}`
}
const readPositiveNumberInput = (event) => {
  const normalized = normalizePositiveNumberText(event.target.value)
  if (event.target.value !== normalized) event.target.value = normalized
  return Number(normalized || 0)
}
const selectZeroInput = (event) => {
  if (Number(event.target.value || 0) === 0) event.target.select()
}

const calculateItemDiscount = (grossTotal, discountType, discountValue) => {
  const gross = roundMoney(grossTotal)
  const value = Number(discountValue || 0)
  if (!Number.isFinite(value) || value <= 0 || gross <= 0) return 0
  if (discountType === 'percent') return Math.min(gross, roundMoney(gross * Math.min(value, 100) / 100))
  if (discountType === 'amount') return Math.min(gross, roundMoney(value))
  return 0
}

const mapItemTotals = (item) => {
  const quantity = Number(item.quantity || 0)
  const price = Number(item.price_unit || 0)
  const grossTotal = Number.isFinite(quantity * price) ? roundMoney(quantity * price) : 0
  const discountAmount = calculateItemDiscount(grossTotal, item.discount_type, item.discount_value)
  return {
    ...item,
    discount_type: item.discount_type || 'none',
    discount_value: item.discount_type === 'none' ? 0 : Number(item.discount_value || 0),
    gross_total: grossTotal,
    discount_amount: discountAmount,
    total: roundMoney(Math.max(0, grossTotal - discountAmount)),
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
const normalizeSelectEntityId = (value) => {
  const text = `${value ?? ''}`.trim()
  const match = text.match(/^(client|eventual)-(\d+)$/)
  return match ? match[2] : text
}
const warehouseOptionTemplate = (option) => {
  if (option.loading) return option.text
  const warehouse = option.data ?? {}
  const name = option.text || warehouse.name || ''
  const branch = warehouse.branch?.name
  const business = warehouse.branch?.business?.name
  const container = $('<span>').text(name)
  if (branch) container.append($('<small>').addClass('text-muted ms-1').text(`- ${branch}`))
  if (business) container.append($('<small>').addClass('text-muted ms-1').text(`(${business})`))
  return container
}
const clearSelectValue = (ref) => {
  if (!ref?.current) return
  const select = $(ref.current)
  select.empty().val(null)
  select.trigger(select.data('select2') ? 'change.select2' : 'change')
}
const presentationEmptyLabel = (item) => item.article_id ? 'Unidad base' : 'Sin presentacion'

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

const defaultMapPosition = { lat: -12.046374, lng: -77.042793 }

const parseCoordinate = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const formatCoordinate = (value) => {
  const number = parseCoordinate(value)
  return number === null ? '' : number.toFixed(7)
}

const hasMapPosition = (position) => parseCoordinate(position?.lat) !== null && parseCoordinate(position?.lng) !== null

const GoogleDeliveryMapPicker = ({ modalRef, position, searchText, onPositionChange, onSearchTextChange, onAddressSelected, googleMapsApiKey }) => {
  const mapRef = useRef()
  const [loading, setLoading] = useState(false)
  const [mapError, setMapError] = useState('')
  const [results, setResults] = useState([])

  const resolvedPosition = hasMapPosition(position)
    ? { lat: parseCoordinate(position.lat), lng: parseCoordinate(position.lng) }
    : defaultMapPosition

  const applyPosition = (nextPosition, zoom = 17) => {
    const lat = parseCoordinate(nextPosition?.lat)
    const lng = parseCoordinate(nextPosition?.lng)
    if (lat === null || lng === null || !mapRef.current) return

    mapRef.current.setCenter({ lat, lng })
    mapRef.current.setZoom(zoom)
  }

  const handlePointSelected = (nextPosition) => {
    onPositionChange(nextPosition)
    applyPosition(nextPosition)
  }

  useEffect(() => {
    if (hasMapPosition(position)) {
      applyPosition(resolvedPosition)
      return
    }

    applyPosition(defaultMapPosition, 13)
  }, [position?.lat, position?.lng])

  useEffect(() => {
    const modal = modalRef?.current
    if (!modal) return undefined

    const onShown = () => {
      setTimeout(() => {
        if (hasMapPosition(position)) applyPosition(resolvedPosition)
        else applyPosition(defaultMapPosition, 13)
      }, 180)
    }

    $(modal).on('shown.bs.modal', onShown)
    return () => $(modal).off('shown.bs.modal', onShown)
  }, [modalRef, position?.lat, position?.lng])

  const searchAddress = async () => {
    const query = `${searchText ?? ''}`.trim()
    if (!query) {
      setResults([])
      setMapError('Escribe una direccion para buscar.')
      return
    }

    if (!window.google?.maps?.Geocoder) {
      setMapError('Google Maps aun no termino de cargar.')
      return
    }

    setLoading(true)
    setMapError('')
    try {
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({
        address: `${query}, Peru`,
        componentRestrictions: { country: 'PE' },
        region: 'PE',
      }, (response, status) => {
        setLoading(false)
        if (status !== 'OK' || !Array.isArray(response) || response.length === 0) {
          setResults([])
          setMapError('Sin resultados. Puedes marcar el punto manualmente en el mapa.')
          return
        }

        setResults(response.slice(0, 5).map((result) => ({
          place_id: result.place_id,
          display_name: result.formatted_address,
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
        })))
      })
    } catch (error) {
      setLoading(false)
      setMapError(`${error.message}. Puedes marcar el punto manualmente en el mapa.`)
      setResults([])
    }
  }

  const selectResult = (result) => {
    const nextPosition = { lat: parseCoordinate(result.lat), lng: parseCoordinate(result.lng) }
    onPositionChange(nextPosition)
    onSearchTextChange(result.display_name ?? '')
    onAddressSelected(result.display_name ?? '')
    applyPosition(nextPosition)
    setResults([])
  }

  return (
    <div className='commercial-order-map-picker'>
      <div className='commercial-order-map-search'>
        <div>
          <label className='form-label'>Buscar direccion en mapa</label>
          <div className='input-group'>
            <input
              type='text'
              className='form-control'
              value={searchText}
              onChange={(event) => onSearchTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  searchAddress()
                }
              }}
              placeholder='Ej. Av. Javier Prado 123, San Isidro'
            />
            <button type='button' className='btn btn-outline-primary' onClick={searchAddress} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
        <div className='commercial-order-map-coordinates'>
          <label className='form-label'>Coordenadas</label>
          <div className='commercial-order-map-coordinate-values'>
            <span>{formatCoordinate(position?.lat) || '-'}</span>
            <span>{formatCoordinate(position?.lng) || '-'}</span>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className='commercial-order-map-results'>
          {results.map((result) => (
            <button
              type='button'
              key={`${result.place_id}-${result.lat}-${result.lng}`}
              className='commercial-order-map-result'
              onClick={() => selectResult(result)}
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      {mapError && <small className='text-muted d-block mt-1'>{mapError}</small>}
      <LoadScript
        googleMapsApiKey={googleMapsApiKey}
        language='es'
        region='PE'
        onError={() => setMapError('No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio.')}
      >
        <GoogleMap
          mapContainerClassName='commercial-order-map-canvas'
          center={resolvedPosition}
          zoom={hasMapPosition(position) ? 17 : 13}
          options={{
            clickableIcons: true,
            fullscreenControl: true,
            gestureHandling: 'greedy',
            mapTypeControl: true,
            scrollwheel: true,
            streetViewControl: false,
          }}
          onLoad={(map) => {
            mapRef.current = map
            setTimeout(() => {
              if (hasMapPosition(position)) applyPosition(resolvedPosition)
              else applyPosition(defaultMapPosition, 13)
            }, 120)
          }}
          onClick={(event) => {
            const nextPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() }
            handlePointSelected(nextPosition)
          }}
        >
          {hasMapPosition(position) && (
            <Marker
              position={resolvedPosition}
              draggable
              onDragEnd={(event) => handlePointSelected({ lat: event.latLng.lat(), lng: event.latLng.lng() })}
            />
          )}
        </GoogleMap>
      </LoadScript>
      <small className='text-muted d-block mt-2'>Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega.</small>
    </div>
  )
}

const DeliveryMapPicker = (props) => {
  const googleMapsApiKey = `${Global.GMAPS_API_KEY ?? ''}`.trim()
  if (googleMapsApiKey) {
    return <GoogleDeliveryMapPicker {...props} googleMapsApiKey={googleMapsApiKey} />
  }

  return (
    <div className='commercial-order-map-picker'>
      <div className='commercial-order-map-empty'>
        Configura Google Maps API Key en Sistemas &gt; Datos generales &gt; Integraciones para habilitar el mapa.
      </div>
    </div>
  )
}

const canSendToPreparation = (order) => {
  if (!order || order.status === null) return false
  if (`${order.order_status ?? ''}` === 'cancelled') return false
  return `${order.dispatch_status ?? 'pending'}` === 'pending'
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
  const [mapPosition, setMapPosition] = useState({ lat: '', lng: '' })
  const [mapSearchText, setMapSearchText] = useState('')
  const [branches, setBranches] = useState([])
  const [networks, setNetworks] = useState([])
  const [deliveryAddresses, setDeliveryAddresses] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [selectedDocumentType, setSelectedDocumentType] = useState('Factura')
  const [discountMenu, setDiscountMenu] = useState(null)
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
  const warehouseFilter = useMemo(() => (
    selectedBranchId ? ['business_branch_id', '=', Number(selectedBranchId)] : null
  ), [selectedBranchId])

  useEffect(() => {
    return () => {
      if (evidencePreview?.startsWith('blob:')) URL.revokeObjectURL(evidencePreview)
    }
  }, [evidencePreview])

  useEffect(() => {
    if (!discountMenu) return undefined

    const closeMenu = () => setDiscountMenu(null)
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('click', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeMenu)
    window.addEventListener('scroll', closeMenu, true)

    return () => {
      document.removeEventListener('click', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [discountMenu])

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
    setMapSearchText(textValue(address.address))
    if (hasMapPosition({ lat: address.latitude, lng: address.longitude })) {
      setMapPosition({ lat: Number(address.latitude), lng: Number(address.longitude) })
    }
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
          price_unit: resolvePriceUnitValue(item, resolution),
          price_source: resolvePriceSourceValue(item, resolution),
          price_list_code: resolution.price_list_code || '',
        })
      }))
    }
  }

  const clearCustomerSelections = (type) => {
    if (type === 'regular') {
      setSelectedEventualClientId('')
      clearSelectValue(eventualClientRef)
    } else if (type === 'eventual') {
      setSelectedClientId('')
      setNetworks([])
      setSelectedNetworkId('')
      setDeliveryAddresses([])
      setSelectedDeliveryAddressId('')
      clearSelectValue(clientRef)
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
    setMapPosition({
      lat: hasMapPosition({ lat: data?.map_lat, lng: data?.map_lng }) ? Number(data.map_lat) : '',
      lng: hasMapPosition({ lat: data?.map_lat, lng: data?.map_lng }) ? Number(data.map_lng) : '',
    })
    setMapSearchText(textValue(data?.delivery_address))

    const businessId = data?.business_id ? `${data.business_id}` : ''
    const warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : ''
    const clientId = data?.client_id ? `${data.client_id}` : ''
    const eventualClientId = data?.eventual_client_id ? `${data.eventual_client_id}` : ''
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)
    setSelectedClientId(clientId)
    setSelectedEventualClientId(eventualClientId)

    if (businessId && data?.business?.name) SetSelectValue(businessRef.current, businessId, data.business.name)
    else clearSelectValue(businessRef)
    if (warehouseId && data?.warehouse?.name) SetSelectValue(warehouseRef.current, warehouseId, data.warehouse.name)
    else clearSelectValue(warehouseRef)
    if (clientId && data?.client?.full_name) SetSelectValue(clientRef.current, clientId, `${data.client.document_number ?? ''} - ${data.client.full_name}`.trim())
    else clearSelectValue(clientRef)
    if (eventualClientId && data?.eventual_client?.business_name) SetSelectValue(eventualClientRef.current, eventualClientId, `${data.eventual_client.document_number ?? ''} - ${data.eventual_client.business_name}`.trim())
    else clearSelectValue(eventualClientRef)

    const detail = (data?.items ?? []).map(row => {
      const article = row.article ?? null
      const presentations = (article?.presentations ?? []).filter(p => p?.status !== false && p?.status !== 0)
      const selectedPresentation = row.presentation ?? presentations[0] ?? null
      const presentationUnits = Number(row.presentation_units ?? selectedPresentation?.units ?? 1) || 1

      return mapItemTotals({
        uid: crypto.randomUUID(),
        article_id: row.article_id ? `${row.article_id}` : '',
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : '',
        article_code: article?.code ?? row.external_sku ?? '',
        article_lot: article?.default_lot ?? '',
        article_name: article?.name ?? '',
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
        discount_type: row.external_payload?.commercial_form?.discount_type ?? 'none',
        discount_value: Number(row.external_payload?.commercial_form?.discount_value || 0),
        discount_amount: Number(row.external_payload?.commercial_form?.discount_amount || 0),
        gross_total: Number(row.external_payload?.commercial_form?.gross_total || 0),
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
      map_lat: formatCoordinate(mapPosition.lat) || null,
      map_lng: formatCoordinate(mapPosition.lng) || null,
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
        gross_total: item.gross_total,
        discount_type: item.discount_type,
        discount_value: item.discount_value,
        discount_amount: item.discount_amount,
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
    setSelectedWarehouseId('')
    clearSelectValue(warehouseRef)
    await loadBranches(businessId, null)
  }

  const onBranchChanged = (e) => {
    const branchId = e.target.value || ''
    setSelectedBranchId(branchId)
    setSelectedWarehouseId('')
    clearSelectValue(warehouseRef)
  }

  const onWarehouseChanged = async (e) => {
    const warehouseId = e.target.value || ''
    setSelectedWarehouseId(warehouseId)
    await repriceAllItems()
  }

  const onClientChanged = async (e) => {
    const clientId = normalizeSelectEntityId(e.target.value)
    setSelectedClientId(clientId)
    clearCustomerSelections('regular')
    await loadNetworks(clientId, null)
    await repriceAllItems()
  }

  const onEventualClientChanged = async (e) => {
    const eventualClientId = normalizeSelectEntityId(e.target.value)
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
    if ($(e.target).data('select2')) $(e.target).select2('close')

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
      article_code: hydrated?.code ?? '',
      article_lot: hydrated?.default_lot ?? '',
      article_name: hydrated?.name ?? '',
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
    if (field === 'price_unit') {
      nextState.price_source = 'manual'
      nextState.price_list_code = ''
    }
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
        price_unit: resolvePriceUnitValue(item, resolution, field === 'presentation_id'),
        price_source: resolvePriceSourceValue(item, resolution, field === 'presentation_id'),
        price_list_code: field === 'presentation_id' ? (resolution.price_list_code || '') : (isManualPrice(item) ? item.price_list_code : (resolution.price_list_code || '')),
      })
    }))
  }

  const onItemDiscountPercentChanged = (uid, value) => {
    const percent = Number(value || 0)
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      return mapItemTotals({
        ...item,
        discount_type: percent > 0 ? 'percent' : 'none',
        discount_value: percent > 0 ? percent : 0,
      })
    }))
  }

  const onItemDiscountMenuOpened = (uid, event) => {
    event.preventDefault()
    event.stopPropagation()

    const rect = event.currentTarget.getBoundingClientRect()
    setDiscountMenu(current => current?.uid === uid ? null : {
      uid,
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 130),
    })
  }

  const onItemDiscountMenuSelected = (uid, value) => {
    onItemDiscountPercentChanged(uid, value)
    setDiscountMenu(null)
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
    <style>{`
      .commercial-order-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 312px;
        white-space: nowrap;
        overflow: visible !important;
      }
      .commercial-order-action-btn {
        width: 34px;
        height: 30px;
        padding: 0 !important;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        line-height: 1;
        flex: 0 0 34px;
      }
      .commercial-order-action-btn i {
        display: inline-flex;
        font-size: 16px;
        line-height: 1;
      }
      .commercial-order-action-btn:hover,
      .commercial-order-action-btn:focus,
      .commercial-order-action-btn:active {
        box-shadow: none !important;
        opacity: 1 !important;
      }
      .commercial-order-action-btn.btn-soft-primary,
      .commercial-order-action-btn.btn-soft-primary:hover,
      .commercial-order-action-btn.btn-soft-primary:focus,
      .commercial-order-action-btn.btn-soft-primary:active {
        background-color: rgba(59, 130, 246, 0.14) !important;
        border-color: rgba(59, 130, 246, 0.18) !important;
        color: #3b82f6 !important;
      }
      .commercial-order-action-btn.btn-soft-success,
      .commercial-order-action-btn.btn-soft-success:hover,
      .commercial-order-action-btn.btn-soft-success:focus,
      .commercial-order-action-btn.btn-soft-success:active {
        background-color: rgba(16, 196, 105, 0.14) !important;
        border-color: rgba(16, 196, 105, 0.18) !important;
        color: #10c469 !important;
      }
      .commercial-order-action-btn.btn-soft-info,
      .commercial-order-action-btn.btn-soft-info:hover,
      .commercial-order-action-btn.btn-soft-info:focus,
      .commercial-order-action-btn.btn-soft-info:active {
        background-color: rgba(53, 184, 224, 0.14) !important;
        border-color: rgba(53, 184, 224, 0.18) !important;
        color: #35b8e0 !important;
      }
      .commercial-order-action-btn.btn-soft-warning,
      .commercial-order-action-btn.btn-soft-warning:hover,
      .commercial-order-action-btn.btn-soft-warning:focus,
      .commercial-order-action-btn.btn-soft-warning:active {
        background-color: rgba(247, 184, 75, 0.16) !important;
        border-color: rgba(247, 184, 75, 0.2) !important;
        color: #f7b84b !important;
      }
      .commercial-order-action-btn.btn-soft-danger,
      .commercial-order-action-btn.btn-soft-danger:hover,
      .commercial-order-action-btn.btn-soft-danger:focus,
      .commercial-order-action-btn.btn-soft-danger:active {
        background-color: rgba(255, 91, 91, 0.14) !important;
        border-color: rgba(255, 91, 91, 0.18) !important;
        color: #ff5b5b !important;
      }
      .commercial-order-action-btn i,
      .commercial-order-action-btn:hover i,
      .commercial-order-action-btn:focus i,
      .commercial-order-action-btn:active i {
        color: inherit !important;
      }
      .commercial-order-modal-dialog {
        width: calc(100vw - 10px);
        max-width: calc(100vw - 10px);
      }
      .commercial-order-modal-dialog.modal-dialog-centered {
        align-items: flex-start;
        margin-top: 0.35rem;
        margin-bottom: 0.35rem;
      }
      .commercial-order-modal-body {
        padding: 12px 14px;
      }
      .commercial-order-modal-body .form-label {
        font-weight: 600;
        margin-bottom: 4px;
      }
      .commercial-order-form-section {
        border: 1px solid var(--ct-border-color);
        border-radius: 8px;
        padding: 14px 16px 16px;
        margin-bottom: 14px;
        background: var(--ct-secondary-bg);
      }
      .commercial-order-section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 12px;
        color: var(--ct-gray-700);
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .commercial-order-section-title i {
        color: var(--ct-primary);
        font-size: 16px;
      }
      .commercial-order-detail-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      .commercial-order-map-picker {
        border: 1px solid var(--ct-border-color);
        border-radius: 8px;
        padding: 10px;
        background: #fff;
      }
      .commercial-order-map-search {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 220px;
        gap: 10px;
        align-items: end;
        margin-bottom: 8px;
      }
      .commercial-order-map-coordinate-values {
        min-height: 38px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 2px;
        padding: 5px 10px;
        border: 1px solid var(--ct-border-color);
        border-radius: 6px;
        color: var(--ct-gray-700);
        background: var(--ct-light);
        font-size: 0.82rem;
        line-height: 1.2;
      }
      .commercial-order-map-canvas {
        width: 100%;
        height: 320px;
        border-radius: 6px;
        border: 1px solid var(--ct-border-color);
        overflow: hidden;
        background: var(--ct-light);
      }
      .commercial-order-map-empty {
        min-height: 160px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        border: 1px dashed var(--ct-border-color);
        border-radius: 6px;
        color: var(--ct-gray-600);
        background: var(--ct-light);
        text-align: center;
      }
      .commercial-order-map-results {
        max-height: 142px;
        overflow-y: auto;
        border: 1px solid var(--ct-border-color);
        border-radius: 6px;
        margin-bottom: 8px;
        background: #fff;
      }
      .commercial-order-map-result {
        display: block;
        width: 100%;
        padding: 7px 10px;
        border: 0;
        border-bottom: 1px solid var(--ct-border-color);
        background: #fff;
        color: var(--ct-gray-800);
        text-align: left;
        font-size: 0.86rem;
      }
      .commercial-order-map-result:hover,
      .commercial-order-map-result:focus {
        background: var(--ct-light);
      }
      .commercial-order-map-result:last-child {
        border-bottom: 0;
      }
      #commercial-orders-form-container .commercial-order-detail-table table {
        min-width: 1540px;
      }
      #commercial-orders-form-container .commercial-order-detail-table th {
        color: var(--ct-gray-700);
        font-size: 0.78rem;
        text-transform: uppercase;
        white-space: nowrap;
      }
      #commercial-orders-form-container .commercial-order-detail-table td {
        vertical-align: middle;
      }
      #commercial-orders-form-container .commercial-order-detail-table tfoot th,
      #commercial-orders-form-container .commercial-order-detail-table tfoot td {
        background: var(--ct-light);
        vertical-align: middle;
      }
      #commercial-orders-form-container .commercial-order-detail-table .form-group {
        position: relative;
        margin-bottom: 0 !important;
      }
      .commercial-order-detail-table .commercial-order-readonly-cell {
        min-height: 38px;
        display: flex;
        align-items: center;
        color: var(--ct-gray-700);
        font-size: 0.84rem;
      }
      .commercial-order-detail-table .commercial-order-article-name .select2-container .select2-selection--single {
        min-height: 38px;
      }
      .commercial-order-discount-cell {
        min-width: 92px;
      }
      .commercial-order-discount-trigger {
        min-width: 92px;
        width: 100%;
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border: 1px solid var(--ct-border-color);
        border-radius: 4px;
        background: #fff;
        color: var(--ct-gray-700);
        padding: 0.45rem 0.7rem;
        text-align: left;
      }
      .commercial-order-discount-trigger:hover,
      .commercial-order-discount-trigger:focus {
        border-color: var(--ct-primary);
        color: var(--ct-gray-800);
      }
      .commercial-order-discount-menu {
        position: fixed;
        z-index: 3000;
        padding: 4px;
        border: 1px solid var(--ct-border-color);
        border-radius: 6px;
        background: #fff;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
      }
      .commercial-order-discount-option {
        width: 100%;
        min-height: 34px;
        display: block;
        border: 0;
        border-radius: 4px;
        background: #fff;
        color: var(--ct-gray-700);
        padding: 6px 10px;
        text-align: left;
      }
      .commercial-order-discount-option:hover,
      .commercial-order-discount-option:focus,
      .commercial-order-discount-option.active {
        background: rgba(59, 130, 246, 0.12);
        color: var(--ct-primary);
      }
      #commercial-orders-form-container .commercial-order-detail-table .select2-container {
        width: 100% !important;
      }
      #commercial-orders-form-container .commercial-order-detail-table .select2-dropdown {
        min-width: 260px;
        z-index: 1065;
      }
      @media (max-width: 767.98px) {
        .commercial-order-modal-dialog {
          width: calc(100vw - 12px);
          max-width: calc(100vw - 12px);
          margin: 0.5rem auto;
        }
        .commercial-order-modal-body {
          padding: 12px;
        }
        .commercial-order-form-section {
          padding: 12px;
        }
        .commercial-order-detail-toolbar {
          align-items: flex-start;
          flex-direction: column;
        }
        .commercial-order-map-search {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
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
          width: 360,
          fixed: true,
          fixedPosition: 'right',
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.addClass('commercial-order-actions')
            appendGridActionButton(container, {
              variant: 'primary',
              title: 'Editar pedido',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            })
            if (canSendToPreparation(data)) {
              appendGridActionButton(container, {
                variant: 'success',
                title: 'Mandar a Preparacion',
                icon: 'mdi mdi-clipboard-check-outline',
                onClick: () => onBooleanChange({ id: data.id, field: 'dispatch_status', value: 'preparing' })
              })
            }
            appendGridActionButton(container, {
              variant: 'info',
              title: 'Tracking pedido',
              icon: 'mdi mdi-map-marker-path',
              onClick: () => openTracking(data)
            })
            appendGridActionButton(container, {
              variant: 'warning',
              title: orderGuides(data).length ? 'Ver guia' : 'Generar guia',
              icon: 'mdi mdi-file-document',
              onClick: () => onOpenReferralGuide(data)
            })
            appendGridActionButton(container, {
              variant: 'success',
              title: latestEvidence(data) ? 'Ver evidencia' : 'Registrar evidencia',
              icon: 'mdi mdi-camera',
              onClick: () => openEvidence(data)
            })
            appendGridActionButton(container, {
              variant: 'danger',
              title: 'Imprimir PDF',
              icon: 'mdi mdi-file-pdf-box',
              onClick: () => openMagistralesRecordPdf(buildMagistralesRows.commercialOrder(data))
            })
            appendGridActionButton(container, {
              variant: 'danger',
              title: 'Eliminar pedido',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            })
          }
        }
      ]}
    />

    <Modal
      modalRef={modalRef}
      title={isEditing ? 'Editar pedido comercial' : 'Agregar pedido comercial'}
      size='xl'
      dialogClass='commercial-order-modal-dialog modal-dialog-scrollable'
      bodyClass='commercial-order-modal-body'
      bodyStyle={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', overflowX: 'hidden' }}
      btnSubmitText='Guardar'
      onSubmit={onModalSubmit}
    >
      <div id='commercial-orders-form-container'>
        <input ref={idRef} type='hidden' />

        <section className='commercial-order-form-section'>
          <div className='commercial-order-section-title'>
            <i className='mdi mdi-file-document'></i>
            <span>Datos del pedido</span>
          </div>
          <div className='row g-2'>
            <div className='col-12 col-md-6 col-xl-2'>
              <label className='form-label'>Codigo</label>
              <input ref={codeRef} className='form-control' readOnly />
            </div>
            <div className='col-12 col-md-6 col-xl-3'>
              <SelectAPIFormGroup eRef={businessRef} label='Empresa' required searchAPI='/api/admin/businesses/paginate' searchBy='name' dropdownParent='#commercial-orders-form-container' onChange={onBusinessChanged} />
            </div>
            <div className='col-12 col-md-6 col-xl-3'>
              <SelectFormGroup eRef={branchRef} label='Sede' dropdownParent='#commercial-orders-form-container' value={selectedBranchId} onChange={onBranchChanged}>
                <option value=''>Sin sede</option>
                {branches.map(branch => <option key={`commercial-order-branch-${branch.id}`} value={branch.id}>{branch.name}</option>)}
              </SelectFormGroup>
            </div>
            <div className='col-12 col-md-6 col-xl-4'>
              <SelectAPIFormGroup
                eRef={warehouseRef}
                label='Almacen'
                required
                searchAPI='/api/admin/warehouses/paginate'
                searchBy='name'
                filter={warehouseFilter}
                dropdownParent='#commercial-orders-form-container'
                onChange={onWarehouseChanged}
                templateResult={warehouseOptionTemplate}
                templateSelection={warehouseOptionTemplate}
              />
            </div>
            <div className='col-12 col-sm-6 col-lg-4 col-xl-2'>
              <label className='form-label'>Fecha emision</label>
              <input ref={issueDateRef} type='date' className='form-control' required />
            </div>
            <div className='col-12 col-sm-6 col-lg-4 col-xl-2'>
              <label className='form-label'>Entrega prometida</label>
              <input ref={promisedDateRef} type='date' className='form-control' />
            </div>
            <div className='col-12 col-sm-6 col-lg-4 col-xl-2'>
              <label className='form-label'>Doc. venta</label>
              <select ref={documentTypeRef} className='form-control' value={selectedDocumentType} onChange={(e) => setSelectedDocumentType(normalizeDocumentType(e.target.value))}>
                <option value='Factura'>Factura</option>
                <option value='Boleta'>Boleta</option>
                <option value='Nota de pedido'>Nota de pedido</option>
              </select>
            </div>
            <div className='col-12 col-sm-6 col-lg-4 col-xl-2'>
              <label className='form-label'>Moneda</label>
              <select ref={currencyRef} className='form-control'>
                <option value='PEN'>PEN</option>
                <option value='USD'>USD</option>
                <option value='EUR'>EUR</option>
              </select>
            </div>
            <div className='col-12 col-sm-6 col-lg-4 col-xl-2'>
              <label className='form-label'>Pago</label>
              <select ref={paymentConditionRef} className='form-control'>
                <option value='Contado'>Contado</option>
                <option value='Credito'>Credito</option>
              </select>
            </div>
            <div className='col-12 col-sm-6 col-lg-4 col-xl-2'>
              <label className='form-label'>Metodo de pago</label>
              <input ref={paymentMethodRef} className='form-control' placeholder='Transferencia, Yape, Efectivo...' />
            </div>
          </div>
        </section>

        <section className='commercial-order-form-section'>
          <div className='commercial-order-section-title'>
            <i className='mdi mdi-account'></i>
            <span>Cliente y entrega</span>
          </div>
          <div className='row g-2'>
            <div className='col-12 col-xl-6'>
              <SelectAPIFormGroup
                eRef={clientRef}
                label='Cliente regular'
                searchAPI='/api/admin/clients/paginate'
                searchBy='full_name'
                selectBy='entity_id'
                filter={regularClientFilter}
                dropdownParent='#commercial-orders-form-container'
                onChange={onClientChanged}
              />
            </div>
            <div className='col-12 col-xl-6'>
              <SelectAPIFormGroup eRef={eventualClientRef} label='Cliente eventual' searchAPI='/api/admin/eventual-clients/paginate' searchBy='business_name' dropdownParent='#commercial-orders-form-container' onChange={onEventualClientChanged} />
            </div>
            <div className='col-12 col-md-6 col-xl-4'>
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
            <div className='col-12 col-md-6 col-xl-4'>
              <label className='form-label'>Direccion ligada</label>
              <select className='form-control' value={selectedDeliveryAddressId} onChange={onDeliveryAddressChanged}>
                <option value=''>Sin direccion ligada</option>
                {deliveryAddresses.map(address => (
                  <option key={`commercial-order-address-${address.id}`} value={address.id}>
                    {`${address.code ?? ''} ${address.name ?? ''}`.trim()}
                  </option>
                ))}
              </select>
            </div>
            <div className='col-12 col-md-6 col-xl-4'>
              <label className='form-label'>Ubigeo</label>
              <input ref={ubigeoRef} className='form-control' />
            </div>
            <div className='col-12 col-xl-8'>
              <TextareaFormGroup eRef={deliveryAddressRef} label='Direccion de entrega' rows={2} />
            </div>
            <div className='col-12 col-xl-4'>
              <TextareaFormGroup eRef={deliveryReferenceRef} label='Referencia entrega' rows={2} />
            </div>
            <div className='col-12'>
              <DeliveryMapPicker
                modalRef={modalRef}
                position={mapPosition}
                searchText={mapSearchText}
                onSearchTextChange={setMapSearchText}
                onPositionChange={setMapPosition}
                onAddressSelected={(address) => {
                  if (deliveryAddressRef.current) deliveryAddressRef.current.value = address
                }}
              />
            </div>
            <div className='col-12 col-md-6 col-xl-5'>
              <label className='form-label'>Contacto despacho</label>
              <input ref={dispatchContactNameRef} className='form-control' />
            </div>
            <div className='col-12 col-md-6 col-xl-3'>
              <label className='form-label'>Telefono despacho</label>
              <input ref={dispatchContactPhoneRef} className='form-control' />
            </div>
          </div>
        </section>

        <section className='commercial-order-form-section'>
          <div className='commercial-order-section-title'>
            <i className='mdi mdi-cash'></i>
            <span>Estados y cobranza</span>
          </div>
          <div className='row g-2'>
            <div className='col-12 col-sm-6 col-lg-2'>
              <label className='form-label'>Cuotas</label>
              <input ref={installmentsRef} type='number' min='1' step='1' defaultValue='1' className='form-control' />
            </div>
            <div className='col-12 col-sm-6 col-lg-2'>
              <label className='form-label'>Primera cuota</label>
              <input ref={firstDueDateRef} type='date' className='form-control' />
            </div>
            <div className='col-12 col-sm-6 col-lg-2'>
              <label className='form-label'>Estado pedido</label>
              <select ref={orderStatusRef} className='form-control'>
                {commercialOrderStatusOptions.map((option) => (
                  <option key={`commercial-order-status-${option.value}`} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className='col-12 col-sm-6 col-lg-2'>
              <label className='form-label'>Despacho</label>
              <select ref={dispatchStatusRef} className='form-control'>
                {dispatchStatusOptions
                  .filter((option) => ['pending', 'preparing', 'dispatched', 'in_route', 'delivered', 'cancelled'].includes(option.value))
                  .map((option) => (
                    <option key={`commercial-order-dispatch-status-${option.value}`} value={option.value}>{option.label}</option>
                  ))}
              </select>
            </div>
            <div className='col-12 col-sm-6 col-lg-2'>
              <label className='form-label'>Facturacion</label>
              <select ref={billingStatusRef} className='form-control'>
                {billingStatusOptions.map((option) => (
                  <option key={`commercial-order-billing-status-${option.value}`} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className='col-12 col-sm-6 col-lg-2'>
              <label className='form-label'>Impuesto</label>
              <input ref={taxAmountRef} type='number' step='0.01' className='form-control' value={orderTotals.taxAmount} readOnly />
            </div>
          </div>
        </section>

        <section className='commercial-order-form-section'>
          <div className='commercial-order-detail-toolbar'>
            <div className='commercial-order-section-title mb-0'>
              <i className='mdi mdi-format-list-bulleted'></i>
              <span>Detalle del pedido</span>
            </div>
            <button type='button' className='btn btn-sm btn-outline-primary' onClick={onItemAdded}>
              Agregar item
            </button>
          </div>
          <div className='table-responsive border rounded commercial-order-detail-table' data-select2-local-dropdown='true'>
            <table className='table table-sm align-middle mb-0'>
              <thead>
                <tr>
                  <th style={{ minWidth: 96 }}>Descuento</th>
                  <th style={{ minWidth: 104 }}>Codigo</th>
                  <th style={{ minWidth: 88 }}>Codigo lote</th>
                  <th style={{ minWidth: 280 }}>Nombre</th>
                  <th style={{ minWidth: 128 }}>Laboratorio</th>
                  <th style={{ minWidth: 130 }}>Principio activo</th>
                  <th style={{ minWidth: 110 }}>Unidad</th>
                  <th style={{ minWidth: 64 }}>Stock</th>
                  <th style={{ minWidth: 112 }}>P. venta con IGV</th>
                  <th style={{ minWidth: 112 }}>P. venta sin IGV</th>
                  <th style={{ minWidth: 92 }}>Cantidad</th>
                  <th style={{ minWidth: 96 }}>Total desc.</th>
                  <th style={{ minWidth: 96 }}>Sub total</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uid}>
                    <td>
                      <div className='commercial-order-discount-cell'>
                        <button
                          type='button'
                          className='commercial-order-discount-trigger'
                          onClick={(event) => onItemDiscountMenuOpened(item.uid, event)}
                        >
                          <span>{item.discount_type === 'percent' && Number(item.discount_value || 0) > 0 ? `${Number(item.discount_value)}%` : 'Seleccione'}</span>
                          <i className='mdi mdi-chevron-down'></i>
                        </button>
                        {discountMenu?.uid === item.uid && (
                          <div
                            className='commercial-order-discount-menu'
                            style={{
                              top: discountMenu.top,
                              left: discountMenu.left,
                              minWidth: discountMenu.width,
                            }}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type='button'
                              className={`commercial-order-discount-option ${item.discount_type !== 'percent' ? 'active' : ''}`}
                              onClick={() => onItemDiscountMenuSelected(item.uid, '')}
                            >
                              Seleccione
                            </button>
                            {lineDiscountOptions.map(percent => (
                              <button
                                type='button'
                                key={`commercial-order-discount-floating-${item.uid}-${percent}`}
                                className={`commercial-order-discount-option ${item.discount_type === 'percent' && Number(item.discount_value || 0) === percent ? 'active' : ''}`}
                                onClick={() => onItemDiscountMenuSelected(item.uid, percent)}
                              >
                                {percent}%
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td><div className='commercial-order-readonly-cell'>{item.article_code || '-'}</div></td>
                    <td><div className='commercial-order-readonly-cell'>{item.article_lot || '-'}</div></td>
                    <td className='commercial-order-article-name'>
                      <SelectAPIFormGroup
                        eRef={getArticleRef(item.uid)}
                        searchAPI={articleSearchAPI}
                        searchBy='name'
                        dropdownParent='#commercial-orders-form-container'
                        disabled={!selectedWarehouseId}
                        onChange={(e) => onItemArticleChanged(item.uid, e)}
                      />
                    </td>
                    <td><div className='commercial-order-readonly-cell'>{item.article_laboratory || '-'}</div></td>
                    <td><div className='commercial-order-readonly-cell'>{item.article_principle || '-'}</div></td>
                    <td>
                      <div>
                        <div className='commercial-order-readonly-cell'>{item.article_unit || '-'}</div>
                        {item.presentations.length > 0 && (
                          <select
                            className='form-control mt-1'
                            value={item.presentation_id}
                            disabled={!item.article_id}
                            onChange={(e) => onItemFieldChanged(item.uid, 'presentation_id', e.target.value)}
                          >
                            <option value=''>{presentationEmptyLabel(item)}</option>
                            {item.presentations.map(presentation => (
                              <option key={`commercial-order-presentation-${item.uid}-${presentation.id}`} value={presentation.id}>
                                {`${presentation.name} (${presentation.units})`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td><div className='commercial-order-readonly-cell'>{Number(item.stock_available || 0).toFixed(2)}</div></td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        className='form-control'
                        value={item.price_unit}
                        onFocus={selectZeroInput}
                        onChange={(e) => onItemFieldChanged(item.uid, 'price_unit', readPositiveNumberInput(e))}
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        className='form-control'
                        value={deriveDocumentTotals(Number(item.price_unit || 0), selectedDocumentType).subtotal.toFixed(2)}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0.01'
                        className='form-control'
                        value={item.quantity}
                        onFocus={selectZeroInput}
                        onChange={(e) => onItemFieldChanged(item.uid, 'quantity', readPositiveNumberInput(e))}
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        className='form-control'
                        value={Number(item.discount_amount || 0).toFixed(2)}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        className='form-control'
                        value={Number(item.total || 0).toFixed(2)}
                        readOnly
                      />
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
                  <th colSpan='12' className='text-end'>Sub total</th>
                  <th>{grossSubtotal.toFixed(2)}</th>
                  <th></th>
                </tr>
                <tr>
                  <th colSpan='12' className='text-end'>Descuento global</th>
                  <th>0.00</th>
                  <th></th>
                </tr>
                <tr>
                  <th colSpan='12' className='text-end'>Total</th>
                  <th>{orderTotals.total.toFixed(2)}</th>
                  <th></th>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className='commercial-order-form-section mb-0'>
          <div className='commercial-order-section-title'>
            <i className='mdi mdi-note-text'></i>
            <span>Observaciones</span>
          </div>
          <TextareaFormGroup eRef={observationsRef} label='Observaciones' rows={3} />
        </section>
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
