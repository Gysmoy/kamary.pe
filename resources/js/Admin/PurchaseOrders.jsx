import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Fetch } from 'sode-extend-react';
import { toast } from 'sonner';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '@Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import PurchaseOrdersRest from '../Actions/Admin/PurchaseOrdersRest';
import { scopedPermission } from '../Utils/permissionScope';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import setSwitchChecked from '../Utils/setSwitchChecked';
import {
  approvalStatusOptions,
  purchaseOrderStatusOptions,
  getApprovalStatusLabel,
  getPurchaseOrderStatusLabel,
} from '../Utils/statusLabels';

const purchaseOrdersRest = new PurchaseOrdersRest()

const MAGISTRAL_ARTICLE_TYPES = [
  { value: 'INSUMOS Y ENVASES', label: 'Insumos y envases' },
  { value: 'PRODUCTOS COMERCIALES', label: 'Productos comerciales' },
]

const PAYMENT_METHOD_OPTIONS = [
  'Seleccione',
  'Deposíto en cuenta',
  'Transferencia',
  'Yape',
  'Plin',
  'Efectivo',
  'Tarjeta',
]

const DOCUMENT_TYPE_OPTIONS = [
  'Seleccione',
  'Factura',
  'Boleta',
  'Cotizacion',
  'Proforma',
]

const combineDxFilters = (filters) => filters
  .filter(Boolean)
  .reduce((carry, filter) => carry ? [carry, 'and', filter] : filter, null)

const canonicalMagistralPurchaseArticleType = (value) => {
  const normalized = (value ?? '').toString().trim().toLowerCase()
  if (!normalized) return ''
  if (normalized.includes('comercial')) return 'PRODUCTOS COMERCIALES'
  if (normalized.includes('insumo') || normalized.includes('envase')) return 'INSUMOS Y ENVASES'
  return ''
}

// Equivalente client-side del filtro DevExtreme que antes se mandaba al backend
// (magistralArticleFilterByType) para el picker de articulos de Magistrales. Ahora el
// catalogo completo se precarga (ver loadArticleCatalog) y se filtra aqui mismo.
const articleMatchesMagistralType = (article, type) => {
  const raw = (article?.article_type ?? '').toString().trim().toUpperCase()
  if (type === 'INSUMOS Y ENVASES') return ['INSUMO', 'INSUMOS', 'ENVASE', 'ENVASES'].includes(raw)
  if (type === 'PRODUCTOS COMERCIALES') return ['PRODUCTO COMERCIAL', 'PRODUCTOS COMERCIALES'].includes(raw)
  return false
}

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

const dateOnly = (value) => {
  if (!value) return ''
  return value.toString().slice(0, 10)
}

const dateTimeLabel = (value) => {
  if (!value) return ''
  return value.toString().slice(0, 16).replace('T', ' ')
}

const defaultPresentationLabel = (article = null) => (
  article?.magistral_presentation
  || article?.unit?.symbol
  || article?.unit?.name
  || 'UND'
)

const presentationOptionsFromArticle = (article = null) => {
  const rows = Array.isArray(article?.presentations) ? article.presentations : []
  const options = rows
    .filter(row => row?.status !== false && row?.status !== 0)
    .map(row => ({
      id: row.id ? `${row.id}` : '',
      name: row.name ?? '',
      units: Number(row.units || 1),
      purchase_price_national: Number(row.purchase_price_national ?? row.price ?? 0),
      purchase_price_foreign: Number(row.purchase_price_foreign ?? row.price ?? 0),
      price: Number(row.price ?? 0),
    }))

  if (options.length > 0) return options

  return [{
    id: '',
    name: defaultPresentationLabel(article),
    units: 1,
    purchase_price_national: Number(article?.purchase_price_national || article?.cost_price || 0),
    purchase_price_foreign: Number(article?.purchase_price_foreign || article?.cost_price || 0),
    price: Number(article?.cost_price || 0),
  }]
}

const resolvePresentationPrice = (presentation, currency = 'PEN') => {
  if (!presentation) return 0
  if (currency === 'USD' || currency === 'EUR') {
    return Number(presentation.purchase_price_foreign ?? presentation.price ?? 0)
  }
  return Number(presentation.purchase_price_national ?? presentation.price ?? 0)
}

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  article_label: '',
  article_unit: '',
  article_laboratory: '',
  article_principle: '',
  requested_quantity: 1,
  received_quantity: 0,
  price_unit: 0,
  total: 0,
  presentation_id: '',
  presentation_label: '',
  presentation_units: 1,
  last_price: 0,
  presentation_options: [],
  article_data: null,
})

const hydrateItemTotals = (item) => {
  const quantity = Number(item.requested_quantity || 0)
  const price = Number(item.price_unit || 0)
  return {
    ...item,
    total: Number.isFinite(quantity * price) ? (quantity * price) : 0,
  }
}

const hydrateItemFromArticle = (item, article, currency) => {
  const presentationOptions = presentationOptionsFromArticle(article)
  const selectedPresentation = presentationOptions[0] ?? null
  const lastPrice = resolvePresentationPrice(selectedPresentation, currency)
  const articleLabel = article
    ? `${article.code ?? ''} - ${article.name ?? ''}`.trim()
    : ''

  return hydrateItemTotals({
    ...item,
    article_id: article?.id ? `${article.id}` : '',
    article_label: articleLabel,
    article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
    article_laboratory: article?.laboratory?.name ?? '',
    article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
    article_data: article ?? null,
    presentation_options: presentationOptions,
    presentation_id: selectedPresentation?.id ?? '',
    presentation_label: selectedPresentation?.name ?? defaultPresentationLabel(article),
    presentation_units: Number(selectedPresentation?.units || 1),
    last_price: Number(lastPrice || 0),
    price_unit: Number(lastPrice || 0),
  })
}

// Carga catalogos completos (isLoadingAll) para alimentar VdSelect, igual que hace
// Warehouses.jsx con getBusinesses/getWarehouses. VdSelect no pega a la API por cada
// tecleo: filtra en memoria, asi que el catalogo entero se trae de una vez.
const fetchCatalogAll = async (url, sortField = 'name', take = 1000, extraBody = {}) => {
  try {
    const { status, result } = await Fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        isLoadingAll: true,
        take,
        sort: [{ selector: sortField, desc: false }],
        ...extraBody,
      })
    })
    if (!status) throw new Error(result?.message || 'No se pudo cargar el catalogo')
    return result?.data ?? []
  } catch (error) {
    toast.error('Error', {
      description: error.message,
      duration: 3000,
      richColors: true,
    });
    return []
  }
}

// Inyecta el registro actual (empresa/almacen/proveedor de una OC existente) en la lista
// precargada si no vino incluido (p.ej. quedo inactivo despues de crear la OC). Reemplaza
// lo que antes hacia SetSelectValue con select2.
const ensureOption = (list, record) => {
  if (!record?.id) return list
  const id = `${record.id}`
  return list.some(item => `${item.id}` === id) ? list : [...list, record]
}

const PurchaseOrders = ({ moduleTitle = 'Ordenes de compra', moduleScope, fixedWarehouse = null }) => {
  const isMagistrales = moduleScope === 'magistrales'
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const fixedBusinessId = fixedWarehouse?.business_id ? `${fixedWarehouse.business_id}` : ''
  const fixedBranchId = fixedWarehouse?.business_branch_id ? `${fixedWarehouse.business_branch_id}` : ''
  const fixedWarehouseLabel = [fixedWarehouse?.branch_name, fixedWarehouse?.name].filter(Boolean).join(' - ') || 'Almacen fijo de Magistrales'
  const fixedBusinessLabel = fixedWarehouse?.business_name || 'KAMARY PERU SAC'
  const tableRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const buyerNameRef = useRef()
  const issueDateRef = useRef()
  const expectedDateRef = useRef()
  const maxDeliveryDateRef = useRef()
  const taxAmountRef = useRef()
  const observationsRef = useRef()
  const deliveryPlaceRef = useRef()
  const affectsIgvRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState(isMagistrales ? fixedBusinessId : '')
  const [selectedBranchId, setSelectedBranchId] = useState(isMagistrales ? fixedBranchId : '')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(isMagistrales ? fixedWarehouseId : '')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedArticleType, setSelectedArticleType] = useState('')
  const [businesses, setBusinesses] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [articleCatalog, setArticleCatalog] = useState([])
  const [branches, setBranches] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [taxAmount, setTaxAmount] = useState(0)
  const [currencyCode, setCurrencyCode] = useState('PEN')
  const [paymentCondition, setPaymentCondition] = useState('Contado')
  const [paymentMethod, setPaymentMethod] = useState('Seleccione')
  const [documentType, setDocumentType] = useState('Seleccione')
  const [orderStatus, setOrderStatus] = useState('draft')
  const [approvalStatus, setApprovalStatus] = useState('pending')
  const [affectsIgv, setAffectsIgv] = useState(true)
  const [listSupplierId, setListSupplierId] = useState('')
  const [listStartDate, setListStartDate] = useState('')
  const [listEndDate, setListEndDate] = useState('')
  const [listFilterValue, setListFilterValue] = useState(null)
  const isFirstFilterRun = useRef(true)

  useEffect(() => {
    if (!isMagistrales) return
    setSelectedBusinessId(fixedBusinessId)
    setSelectedBranchId(fixedBranchId)
    setSelectedWarehouseId(fixedWarehouseId)
  }, [fixedBranchId, fixedBusinessId, fixedWarehouseId, isMagistrales])

  // Precarga empresas/almacenes (solo modulo comercial, Magistrales usa el almacen fijo) y
  // proveedores (ambos modulos), igual que Warehouses.jsx precarga empresas.
  useEffect(() => {
    const loadCatalogs = async () => {
      if (!isMagistrales) {
        const [businessesData, warehousesData] = await Promise.all([
          fetchCatalogAll('/api/admin/businesses/paginate', 'name', 300),
          fetchCatalogAll('/api/admin/warehouses/paginate', 'name', 500),
        ])
        setBusinesses(businessesData.filter(item => item.status !== null))
        setWarehouses(warehousesData.filter(item => item.status !== null))
      }
      const suppliersData = await fetchCatalogAll(purchaseOrdersRest.suppliersPaginateApi(), 'business_name', 1000)
      setSuppliers(suppliersData)
    }
    loadCatalogs()
  }, [isMagistrales])

  // El almacen seleccionado en el encabezado decide si el picker de articulos muestra el
  // catalogo estandar o el de Magistrales/Muestras (ver ArticleController::
  // pickerEffectiveModuleScope, backend). Antes esto viajaba como `extraParams` en cada
  // tecleo del select2; ahora recargamos el catalogo completo cuando cambia el almacen.
  //
  // Ademas se limita a los articulos de ESE almacen (articles.warehouse_id): comprar algo que
  // no pertenece al almacen que va a recibir la mercaderia no tiene sentido, y mezclarlo todo
  // obligaba a buscar entre articulos de otros almacenes. En Magistrales no se aplica porque
  // ese modulo ya trae su propio catalogo completo por scope.
  useEffect(() => {
    const loadArticles = async () => {
      const extra = (!isMagistrales && selectedWarehouseId)
        ? {
          picker_warehouse_id: Number(selectedWarehouseId),
          filter: ['warehouse_id', '=', Number(selectedWarehouseId)],
        }
        : {}
      const data = await fetchCatalogAll(purchaseOrdersRest.articlesPaginateApi(), 'name', 3000, extra)
      setArticleCatalog(data)
    }
    loadArticles()
  }, [isMagistrales, selectedWarehouseId])

  const loadBranches = async (businessId, preferredId = null) => {
    if (!businessId || isMagistrales) {
      setBranches([])
      if (!isMagistrales) setSelectedBranchId('')
      return
    }
    const data = await purchaseOrdersRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return
    }
    setSelectedBranchId('')
  }

  const refreshLinePricing = (item, nextCurrency) => {
    const options = item.presentation_options ?? []
    const selected = options.find(option => `${option.id}` === `${item.presentation_id}`) ?? options[0] ?? null
    const lastPrice = resolvePresentationPrice(selected, nextCurrency)
    return hydrateItemTotals({
      ...item,
      last_price: Number(lastPrice || 0),
      price_unit: Number(lastPrice || 0),
    })
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)

    setRefValue(idRef, data?.id ?? '')
    setRefValue(codeRef, data?.code ?? 'Se genera al guardar')
    setRefValue(issueDateRef, data?.issue_date ? data.issue_date.toString().slice(0, 10) : new Date().toISOString().slice(0, 10))
    setRefValue(expectedDateRef, data?.expected_date ? data.expected_date.toString().slice(0, 10) : '')
    setRefValue(maxDeliveryDateRef, data?.max_delivery_date ? data.max_delivery_date.toString().slice(0, 10) : '')
    setCurrencyCode(data?.currency ?? 'PEN')
    setPaymentCondition(data?.payment_condition ?? 'Contado')
    setPaymentMethod(data?.payment_method ?? 'Seleccione')
    setDocumentType(data?.document_type ?? 'Seleccione')
    setRefValue(buyerNameRef, data?.buyer_name ?? '')
    setOrderStatus(data?.order_status ?? 'draft')
    setApprovalStatus(data?.approval_status ?? 'pending')
    setRefValue(deliveryPlaceRef, data?.delivery_place ?? '')
    const currentArticleType = canonicalMagistralPurchaseArticleType(data?.article_type)
    setSelectedArticleType(currentArticleType)
    const currentAffectsIgv = typeof data?.affects_igv === 'boolean' ? data.affects_igv : true
    setAffectsIgv(currentAffectsIgv)
    setSwitchChecked(affectsIgvRef.current, currentAffectsIgv)

    setTaxAmount(Number(data?.tax_amount ?? 0))
    setRefValue(taxAmountRef, Number(data?.tax_amount ?? 0))
    setRefValue(observationsRef, data?.observations ?? '')

    const businessId = isMagistrales ? fixedBusinessId : (data?.business_id ? `${data.business_id}` : '')
    const branchId = isMagistrales ? fixedBranchId : (data?.business_branch_id ? `${data.business_branch_id}` : '')
    const warehouseId = isMagistrales ? fixedWarehouseId : (data?.warehouse_id ? `${data.warehouse_id}` : '')
    const supplierId = data?.supplier_id ? `${data.supplier_id}` : ''
    setSelectedBusinessId(businessId)
    setSelectedBranchId(branchId)
    setSelectedWarehouseId(warehouseId)
    setSelectedSupplierId(supplierId)

    if (!isMagistrales) {
      if (data?.business) setBusinesses(prev => ensureOption(prev, data.business))
      if (data?.warehouse) setWarehouses(prev => ensureOption(prev, data.warehouse))
    }
    if (data?.supplier) setSuppliers(prev => ensureOption(prev, data.supplier))

    const detail = (data?.items ?? []).map(row => {
      const article = row.article ?? null
      const presentationOptions = presentationOptionsFromArticle(article)
      const selectedPresentation = presentationOptions.find(option => `${option.id}` === `${row.presentation_id ?? ''}`) ?? presentationOptions[0] ?? null
      return hydrateItemTotals({
        uid: crypto.randomUUID(),
        article_id: row.article_id ? `${row.article_id}` : '',
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : '',
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
        article_laboratory: article?.laboratory?.name ?? '',
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
        requested_quantity: Number(row.requested_quantity || 1),
        received_quantity: Number(row.received_quantity || 0),
        price_unit: Number(row.price_unit || 0),
        total: Number(row.total || 0),
        presentation_id: row.presentation_id ? `${row.presentation_id}` : (selectedPresentation?.id ?? ''),
        presentation_label: row.presentation_label ?? selectedPresentation?.name ?? defaultPresentationLabel(article),
        presentation_units: Number(row.presentation_units ?? selectedPresentation?.units ?? 1),
        last_price: Number(row.last_price ?? resolvePresentationPrice(selectedPresentation, data?.currency ?? 'PEN')),
        presentation_options: presentationOptions,
        article_data: article,
      })
    })
    setItems(detail.length ? detail : [emptyItem()])

    $(modalRef.current).modal('show')
    if (!isMagistrales) {
      await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
    }
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    if (!isMagistrales) {
      if (!selectedBusinessId) {
        Swal.fire({ icon: 'warning', title: 'Falta empresa', text: 'Selecciona una empresa.', confirmButtonText: 'Entendido' })
        return
      }
      if (!selectedWarehouseId) {
        Swal.fire({ icon: 'warning', title: 'Falta almacén', text: 'Selecciona un almacén.', confirmButtonText: 'Entendido' })
        return
      }
    }
    if (!selectedSupplierId) {
      Swal.fire({ icon: 'warning', title: 'Falta proveedor', text: 'Selecciona un proveedor.', confirmButtonText: 'Entendido' })
      return
    }

    const request = {
      id: getRefValue(idRef) || undefined,
      business_id: isMagistrales ? (fixedBusinessId || null) : (selectedBusinessId || null),
      business_branch_id: isMagistrales ? (fixedBranchId || null) : (selectedBranchId || null),
      warehouse_id: isMagistrales ? (fixedWarehouseId || null) : (selectedWarehouseId || null),
      supplier_id: selectedSupplierId || null,
      buyer_name: getRefValue(buyerNameRef).trim(),
      article_type: isMagistrales ? (canonicalMagistralPurchaseArticleType(selectedArticleType) || null) : null,
      issue_date: getRefValue(issueDateRef),
      expected_date: getRefValue(expectedDateRef) || null,
      max_delivery_date: isMagistrales ? (getRefValue(maxDeliveryDateRef) || null) : null,
      delivery_place: isMagistrales ? (getRefValue(deliveryPlaceRef).trim() || null) : null,
      currency: currencyCode || 'PEN',
      payment_condition: paymentCondition || 'Contado',
      payment_method: isMagistrales ? ((paymentMethod || '').replace('Seleccione', '').trim() || null) : null,
      document_type: isMagistrales ? ((documentType || '').replace('Seleccione', '').trim() || null) : null,
      affects_igv: isMagistrales ? affectsIgv : null,
      order_status: orderStatus || 'draft',
      approval_status: approvalStatus || 'pending',
      tax_amount: isMagistrales ? computedTaxAmount : Number(getRefValue(taxAmountRef) || 0),
      total: grandTotal,
      observations: getRefValue(observationsRef).trim(),
      items: items.map(item => ({
        article_id: item.article_id || null,
        presentation_id: item.presentation_id || null,
        presentation_label: item.presentation_label || null,
        presentation_units: Number(item.presentation_units || 1),
        last_price: Number(item.last_price || 0),
        requested_quantity: Number(item.requested_quantity || 0),
        received_quantity: Number(item.received_quantity || 0),
        price_unit: Number(item.price_unit || 0),
        total: Number(item.total || 0),
        status: true,
      }))
    }

    const result = await purchaseOrdersRest.save(request)
    if (!result) return

    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await purchaseOrdersRest.boolean({ id, field, value })
    if (!result) return
    tableRef.current?.refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar orden de compra',
      text: '¿Estás seguro de eliminar esta orden de compra? Esta acción no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await purchaseOrdersRest.delete(id)
    if (!result) return
    tableRef.current?.refresh()
  }

  const onBusinessChanged = async (value) => {
    const businessId = value || ''
    setSelectedBusinessId(businessId)
    await loadBranches(businessId, null)
  }

  const onMagistralArticleTypeChanged = (value) => {
    const nextType = canonicalMagistralPurchaseArticleType(value)
    setSelectedArticleType(nextType)
    setItems([emptyItem()])
  }

  const onItemUpdated = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      return hydrateItemTotals({ ...item, [field]: value })
    }))
  }

  const onItemArticleChanged = async (uid, value) => {
    const articleId = value || ''

    if (!articleId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...emptyItem(), uid: item.uid } : item))
      return
    }

    const found = articleCatalog.find(article => `${article.id}` === `${articleId}`)
    const hydrated = found ?? await purchaseOrdersRest.getArticleById(articleId)
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      return hydrateItemFromArticle(item, hydrated, currencyCode)
    }))
  }

  const onItemPresentationChanged = (uid, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const options = item.presentation_options ?? []
      const selectedPresentation = options.find(option => `${option.id}` === `${value}`) ?? options[0] ?? null
      const lastPrice = resolvePresentationPrice(selectedPresentation, currencyCode)
      return hydrateItemTotals({
        ...item,
        presentation_id: selectedPresentation?.id ?? '',
        presentation_label: selectedPresentation?.name ?? item.presentation_label,
        presentation_units: Number(selectedPresentation?.units ?? item.presentation_units ?? 1),
        last_price: Number(lastPrice || 0),
        price_unit: Number(lastPrice || 0),
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

  // Opciones base del picker de articulos: catalogo precargado (ya scopeado por almacen o
  // por tipo de articulo magistral, ver los useEffect de arriba).
  const articleOptionsBase = useMemo(() => {
    const source = isMagistrales
      ? articleCatalog.filter(article => articleMatchesMagistralType(article, selectedArticleType))
      : articleCatalog
    return source.map(article => ({
      value: `${article.id}`,
      label: `${article.code ?? ''} - ${article.name ?? ''}`.trim(),
    }))
  }, [articleCatalog, isMagistrales, selectedArticleType])

  // Si el articulo ya elegido en esa fila no esta en el catalogo filtrado actual (p.ej. se
  // cambio el almacen despues de elegirlo), lo agrega igual para no perder la seleccion.
  const articleOptionsForItem = (item) => {
    if (item.article_id && item.article_label && !articleOptionsBase.some(option => option.value === item.article_id)) {
      return [{ value: item.article_id, label: item.article_label }, ...articleOptionsBase]
    }
    return articleOptionsBase
  }

  const presentationOptionsForItem = (item) => {
    const options = (item.presentation_options ?? []).map(option => ({ value: `${option.id}`, label: option.name }))
    if (options.length > 0) return options
    return [{ value: '', label: item.presentation_label || 'UND' }]
  }

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + Number(item.total || 0), 0), [items])
  const computedTaxAmount = useMemo(() => {
    if (!isMagistrales) return Number(taxAmount || 0)
    if (!affectsIgv) return 0
    const net = subtotal / 1.18
    return Number((subtotal - net).toFixed(2))
  }, [affectsIgv, isMagistrales, subtotal, taxAmount])
  const computedSubtotal = useMemo(() => {
    if (!isMagistrales) return subtotal
    if (!affectsIgv) return subtotal
    return Number((subtotal - computedTaxAmount).toFixed(2))
  }, [affectsIgv, computedTaxAmount, isMagistrales, subtotal])
  const grandTotal = useMemo(() => (
    isMagistrales
      ? Number(subtotal.toFixed(2))
      : subtotal + Number(taxAmount || 0)
  ), [isMagistrales, subtotal, taxAmount])

  const onCurrencyChanged = (value) => {
    const nextCurrency = value || 'PEN'
    setCurrencyCode(nextCurrency)
    setItems(prev => prev.map(item => refreshLinePricing(item, nextCurrency)))
  }

  const onAffectsIgvChanged = (e) => {
    const next = !!e.target.checked
    setAffectsIgv(next)
  }

  const onListFilterSubmitted = (e) => {
    e.preventDefault()
    setListFilterValue(combineDxFilters([
      listSupplierId ? ['supplier_id', '=', Number(listSupplierId)] : null,
      listStartDate ? ['created_at', '>=', `${listStartDate} 00:00:00`] : null,
      listEndDate ? ['created_at', '<=', `${listEndDate} 23:59:59`] : null,
    ]))
  }

  const onListFilterCleared = () => {
    setListSupplierId('')
    setListStartDate('')
    setListEndDate('')
    setListFilterValue(null)
  }

  // VdTable no reacciona solo a cambios de `baseFilter` (su useEffect interno no lo tiene
  // como dependencia): hay que pedirle refresh() explicito despues de cambiarlo.
  useEffect(() => {
    if (isFirstFilterRun.current) { isFirstFilterRun.current = false; return }
    tableRef.current?.refresh()
  }, [listFilterValue])

  // Aprobar / rechazar sin abrir la orden. Con recepciones ya registradas la aprobacion queda
  // congelada: el backend tambien lo rechaza, aqui solo se evita ofrecer un boton que va a fallar.
  const onApprovalClicked = async (row, target) => {
    const isApprove = target === 'approved'
    const { isConfirmed } = await Swal.fire({
      title: isApprove ? 'Aprobar orden de compra' : 'Rechazar orden de compra',
      html: isApprove
        ? `Se aprobara la orden <b>${row.code ?? ''}</b> y quedara lista para recibir mercaderia.`
        : `Se rechazara la orden <b>${row.code ?? ''}</b> y volvera a Borrador. No se podra recibir mercaderia contra ella.`,
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'Si, aprobar' : 'Si, rechazar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return

    const result = await purchaseOrdersRest.setApproval(row.id, target)
    if (!result) return
    tableRef.current?.refresh()
  }

  const rowActions = (row) => {
    const approval = row?.approval_status ?? 'pending'
    const locked = ['partial', 'completed', 'cancelled'].includes(row?.order_status)
    return [
      ...(!locked && approval !== 'approved' ? [{
        icon: 'mdi mdi-check-circle-outline', title: 'Aprobar orden', bg: '#e7f7ee', color: '#2fa36b',
        onClick: (r) => onApprovalClicked(r, 'approved'),
      }] : []),
      ...(!locked && approval !== 'rejected' ? [{
        icon: 'mdi mdi-close-circle-outline', title: 'Rechazar orden', bg: '#fdf1e3', color: '#e08a2e',
        onClick: (r) => onApprovalClicked(r, 'rejected'),
      }] : []),
      { icon: 'mdi mdi-file-pdf-box', title: 'Imprimir PDF', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openMagistralesRecordPdf(buildMagistralesRows.purchaseOrder(r)) },
      { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
      { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
    ]
  }

  return (<>
    {isMagistrales && (
      <form id='purchase-order-list-filter' className='card mb-3' onSubmit={onListFilterSubmitted}>
        <div className='card-body'>
          <h4 className='header-title mb-3'>Consulta de ordenes de compra</h4>
          <div className='row align-items-end'>
            <VdSelect
              label='Proveedor'
              col='col-md-4'
              value={listSupplierId}
              onChange={(value) => setListSupplierId(value || '')}
              options={suppliers.map(supplier => ({ value: `${supplier.id}`, label: supplier.business_name }))}
              placeholder='-- Todos --'
            />
            <InputFormGroup
              label='Fecha registro inicio'
              col='col-md-3'
              type='date'
              value={listStartDate}
              onChange={(e) => setListStartDate(e.target.value)}
            />
            <InputFormGroup
              label='Fecha registro fin'
              col='col-md-3'
              type='date'
              value={listEndDate}
              onChange={(e) => setListEndDate(e.target.value)}
            />
            <div className='col-md-2 mb-2 d-flex gap-2'>
              <button type='submit' className='btn btn-primary w-100'>
                <i className='mdi mdi-magnify me-1'></i> Buscar
              </button>
              <button type='button' className='btn btn-light' onClick={onListFilterCleared}>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </form>
    )}

    <VdTable
      ref={tableRef}
      rest={purchaseOrdersRest}
      icon="mdi mdi-cart-outline"
      title={moduleTitle}
      unit="órdenes"
      defaultSort={{ field: 'id', desc: true }}
      defaultPageSize={25}
      baseFilter={isMagistrales ? listFilterValue : null}
      searchFields={['code', 'business.name', 'branch.name', 'warehouse.name', 'supplier.business_name', 'buyer_name']}
      searchPlaceholder="Buscar por código, empresa o proveedor…"
      emptyText="No se encontraron órdenes de compra."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={() => tableRef.current?.refresh()}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen(null)}>
          <i className="mdi mdi-plus"></i> Agregar orden de compra
        </button>
      </>}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', width: '80px', filter: { type: 'number' } },
        {
          key: 'codigo', label: 'Codigo', field: 'code', width: '130px', filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar orden de compra">
              {row.code ?? '-'}
            </a>
          ),
        },
        { key: 'emision', label: 'F. emisión', field: 'issue_date', width: '110px', filter: { type: 'date' }, render: (row) => dateOnly(row.issue_date) },
        { key: 'esperada', label: 'F. estimada', field: 'expected_date', width: '115px', filter: { type: 'date' }, render: (row) => dateOnly(row.expected_date) },
        ...(isMagistrales ? [{ key: 'maxima', label: 'F. máxima', field: 'max_delivery_date', width: '115px', filter: { type: 'date' }, render: (row) => dateOnly(row.max_delivery_date) }] : []),
        { key: 'empresa', label: isMagistrales ? 'Comprador' : 'Empresa', field: 'business.name', filter: { type: 'text' } },
        ...(!isMagistrales ? [
          { key: 'sede', label: 'Sede', field: 'branch.name', filter: { type: 'text' } },
          { key: 'almacen', label: 'Almacén', field: 'warehouse.name', filter: { type: 'text' } },
        ] : []),
        { key: 'proveedor', label: 'Proveedor', field: 'supplier.business_name', filter: { type: 'text' } },
        ...(isMagistrales ? [{ key: 'tipo_articulo', label: 'Tipo artículo', field: 'article_type', filter: { type: 'text' } }] : []),
        { key: 'condicion', label: 'Condición', field: 'payment_condition', width: '110px', filter: { type: 'text' } },
        ...(isMagistrales ? [{ key: 'forma_pago', label: 'Forma pago', field: 'payment_method', width: '130px', filter: { type: 'text' } }] : []),
        ...(isMagistrales ? [{ key: 'tipo_doc', label: 'Documento', field: 'document_type', width: '110px', filter: { type: 'text' } }] : []),
        {
          key: 'aprobacion', label: isMagistrales ? 'Estado' : 'Aprobación', field: 'approval_status', width: '110px',
          filter: { type: 'select', options: approvalStatusOptions },
          render: (row) => getApprovalStatusLabel(row.approval_status),
        },
        {
          key: 'estado_oc', label: 'Estado OC', field: 'order_status', width: '110px',
          filter: { type: 'select', options: purchaseOrderStatusOptions },
          render: (row) => getPurchaseOrderStatusLabel(row.order_status),
        },
        { key: 'moneda', label: 'Moneda', field: 'currency', width: '90px', filter: { type: 'text' } },
        { key: 'total', label: 'Total', field: 'total', width: '110px', align: 'right', filter: { type: 'number' }, render: (row) => Number(row.total || 0).toFixed(2) },
        {
          key: 'detalle', label: 'Detalle', sortable: false,
          render: (row) => {
            const lines = (row?.items ?? []).map(item => {
              const articleName = item?.article?.name || 'Artículo'
              const presentation = item?.presentation_label || item?.presentation?.name || ''
              const priceLabel = isMagistrales ? ` | P. IGV ${Number(item?.price_unit || 0).toFixed(2)}` : ` | ${row.currency} ${Number(item?.total || 0).toFixed(2)}`
              return `${articleName}${presentation ? ` | ${presentation}` : ''} | Cant. ${Number(item?.requested_quantity || 0).toFixed(2)}${priceLabel}`
            })
            return (<div>
              {lines.length === 0 && <small className='text-muted'>Sin detalle</small>}
              {lines.map((line, idx) => <div key={`purchase-order-${row.id}-${idx}`}><small>{line}</small></div>)}
            </div>)
          }
        },
        ...(isMagistrales ? [{ key: 'fecha_registro', label: 'Fecha registro', field: 'created_at', width: '160px', filter: { type: 'date' }, render: (row) => dateTimeLabel(row.created_at) }] : []),
        {
          key: 'usuario_registro', label: isMagistrales ? 'Usuario registro' : 'Creado por', field: 'creator.fullname',
          visible: isMagistrales, sortable: false,
          render: (row) => formatAuditUser(row.creator),
        },
        {
          key: 'actualizado_por', label: 'Actualizado por', field: 'updater.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.updater),
        },
        {
          key: 'estado', label: 'Activo', field: 'status', visible: !isMagistrales, width: '95px',
          filter: { type: 'select', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => {
            if (row.status === null) return ''
            return <SwitchFormGroup noMargin checked={row.status == 1} onChange={() => onBooleanChange({ id: row.id, field: 'status', value: !row.status })} />
          },
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.code}</p>
              <small className="text-muted">{[row.business?.name, row.supplier?.business_name].filter(Boolean).join(' · ')}</small>
            </div>
            <span className="badge badge-soft-primary">{getPurchaseOrderStatusLabel(row.order_status)}</span>
          </div>
          <small className="text-muted d-block mt-2">
            <i className="mdi mdi-calendar me-1"></i>{dateOnly(row.issue_date)} · {row.currency} {Number(row.total || 0).toFixed(2)}
          </small>
          <small className="text-muted d-block mt-1">{getApprovalStatusLabel(row.approval_status)}</small>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar orden de compra' : 'Agregar orden de compra'} onSubmit={onModalSubmit} size='full-width' preventEnterSubmit>
      <div className='row' id='purchase-order-form-container'>
        <input ref={idRef} type='hidden' />

        {isMagistrales ? (
          <>
            <div className='col-md-3 mb-2'>
              <label className='form-label'>Comprador</label>
              <input className='form-control' value={fixedBusinessLabel} disabled />
            </div>
            <div className='col-md-3 mb-2'>
              <label className='form-label'>Almacén fijo</label>
              <input className='form-control' value={fixedWarehouseLabel} disabled />
            </div>
          </>
        ) : (
          <>
            <VdSelect
              label='Empresa'
              col='col-md-3'
              required
              value={selectedBusinessId}
              onChange={onBusinessChanged}
              options={businesses.map(business => ({ value: `${business.id}`, label: business.name }))}
              placeholder='-- Seleccionar empresa --'
            />
            <VdSelect
              label='Sede'
              col='col-md-3'
              disabled={!selectedBusinessId}
              value={selectedBranchId}
              onChange={(value) => setSelectedBranchId(value || '')}
              options={branches.map(branch => ({ value: `${branch.id}`, label: branch.name }))}
              placeholder='-- Seleccione sede --'
            />
            <VdSelect
              label='Almacén'
              col='col-md-3'
              required
              value={selectedWarehouseId}
              onChange={(value) => setSelectedWarehouseId(value || '')}
              options={warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
              placeholder='-- Seleccionar almacén --'
            />
          </>
        )}

        <VdSelect
          label='Proveedor'
          col={isMagistrales ? 'col-md-6' : 'col-md-3'}
          required
          value={selectedSupplierId}
          onChange={(value) => setSelectedSupplierId(value || '')}
          options={suppliers.map(supplier => ({ value: `${supplier.id}`, label: supplier.business_name }))}
          placeholder='-- Seleccionar proveedor --'
        />

        {isMagistrales && (
          <VdSelect
            label='Tipo de artículo'
            col='col-md-3'
            value={selectedArticleType}
            onChange={onMagistralArticleTypeChanged}
            options={MAGISTRAL_ARTICLE_TYPES}
            placeholder='Seleccione'
          />
        )}

        {!isMagistrales && <InputFormGroup eRef={buyerNameRef} label='Comprador' col='col-md-3' />}

        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Código</label>
          <input ref={codeRef} className='form-control' disabled />
        </div>
        <InputFormGroup eRef={issueDateRef} label='Fecha emisión' col='col-md-2' type='date' required />
        <InputFormGroup eRef={expectedDateRef} label={isMagistrales ? 'Fecha estimada entrega' : 'Fecha esperada'} col='col-md-2' type='date' />
        {isMagistrales && <InputFormGroup eRef={maxDeliveryDateRef} label='Fecha máxima entrega' col='col-md-2' type='date' />}
        <VdSelect
          label='Moneda'
          col='col-md-2'
          value={currencyCode}
          onChange={onCurrencyChanged}
          options={[{ value: 'PEN', label: 'PEN' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]}
        />
        <VdSelect
          label='Condición de pago'
          col='col-md-2'
          value={paymentCondition}
          onChange={(value) => setPaymentCondition(value || 'Contado')}
          options={[{ value: 'Contado', label: 'Contado' }, { value: 'Credito', label: 'Crédito' }]}
        />
        {isMagistrales && (
          <>
            <VdSelect
              label='Forma de pago'
              col='col-md-2'
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value || 'Seleccione')}
              options={PAYMENT_METHOD_OPTIONS.map(option => ({ value: option, label: option }))}
            />
            <VdSelect
              label='Tipo documento'
              col='col-md-2'
              value={documentType}
              onChange={(value) => setDocumentType(value || 'Seleccione')}
              options={DOCUMENT_TYPE_OPTIONS.map(option => ({ value: option, label: option }))}
            />
            <SwitchFormGroup eRef={affectsIgvRef} label='Afecto IGV' col='col-md-2' checked={affectsIgv} onChange={onAffectsIgvChanged} refreshable={isMagistrales} />
          </>
        )}
        <VdSelect
          label='Estado OC'
          col='col-md-2'
          value={orderStatus}
          onChange={(value) => setOrderStatus(value || 'draft')}
          options={purchaseOrderStatusOptions}
        />
        <VdSelect
          label='Aprobación'
          col='col-md-2'
          value={approvalStatus}
          onChange={(value) => setApprovalStatus(value || 'pending')}
          options={approvalStatusOptions}
        />
        {!isMagistrales && (
          <InputFormGroup
            eRef={taxAmountRef}
            label='IGV / Impuesto'
            col='col-md-2'
            type='number'
            min='0'
            step='0.01'
            value={taxAmount}
            onChange={(e) => {
              const value = Number(e.target.value || 0)
              setTaxAmount(value)
              setRefValue(taxAmountRef, value)
            }}
          />
        )}
        {isMagistrales && <InputFormGroup eRef={deliveryPlaceRef} label='Lugar de entrega' col='col-md-6' />}

        <TextareaFormGroup eRef={observationsRef} label='Observaciones' col='col-12' rows={2} />

        <div className='col-12 mt-3'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Items</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={onItemAdded} disabled={isMagistrales && !selectedArticleType}>
              <i className='mdi mdi-plus me-1'></i> Agregar línea
            </button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>Artículo</th>
                  {isMagistrales ? <th>Presentación</th> : <th>Lab. | Principio</th>}
                  {!isMagistrales && <th>Unidad</th>}
                  <th>{isMagistrales ? 'Cantidad' : 'Cant. solicitada'}</th>
                  {isMagistrales && <th>Últ. precio</th>}
                  <th>{isMagistrales ? 'Precio con IGV' : 'P. Unit.'}</th>
                  <th>Subtotal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.uid}>
                    <td style={{ width: isMagistrales ? '34%' : '24%' }}>
                      <VdSelect
                        col='col-12'
                        noMargin
                        value={item.article_id}
                        onChange={(value) => onItemArticleChanged(item.uid, value)}
                        options={articleOptionsForItem(item)}
                        disabled={isMagistrales && !selectedArticleType}
                        placeholder='-- Artículo --'
                      />
                    </td>
                    {isMagistrales ? (
                      <td style={{ width: '14%' }}>
                        <VdSelect
                          col='col-12'
                          noMargin
                          value={item.presentation_id}
                          onChange={(value) => onItemPresentationChanged(item.uid, value)}
                          options={presentationOptionsForItem(item)}
                        />
                      </td>
                    ) : (
                      <>
                        <td><small>{`${item.article_laboratory || '-'} | ${item.article_principle || '-'}`}</small></td>
                        <td><small>{item.article_unit || '-'}</small></td>
                      </>
                    )}
                    <td>
                      <input
                        className='form-control form-control-sm'
                        type='number'
                        min='0.001'
                        step='0.001'
                        value={item.requested_quantity}
                        onChange={(e) => onItemUpdated(item.uid, 'requested_quantity', e.target.value)}
                      />
                    </td>
                    {isMagistrales && (
                      <td>
                        <input className='form-control form-control-sm' type='number' value={Number(item.last_price || 0).toFixed(2)} readOnly />
                      </td>
                    )}
                    <td>
                      <input
                        className='form-control form-control-sm'
                        type='number'
                        min='0'
                        step='0.01'
                        value={item.price_unit}
                        onChange={(e) => onItemUpdated(item.uid, 'price_unit', e.target.value)}
                      />
                    </td>
                    <td>
                      <input className='form-control form-control-sm' type='number' value={Number(item.total || 0).toFixed(2)} readOnly />
                    </td>
                    <td>
                      <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onItemRemoved(item.uid)}>
                        <i className='mdi mdi-delete'></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='d-flex justify-content-end mt-2'>
            <div className='text-end'>
              <div><strong>Subtotal:</strong> {Number(computedSubtotal).toFixed(2)}</div>
              <div><strong>IGV / Impuesto:</strong> {Number(computedTaxAmount || 0).toFixed(2)}</div>
              <div><strong>Total:</strong> {Number(grandTotal).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can(scopedPermission('purchase-orders')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Órdenes de compra'}>
    <PurchaseOrders {...properties} />
  </BaseAdminto>);
})

const setRefValue = (ref, value) => {
  if (!ref?.current) return
  ref.current.value = value
}

const getRefValue = (ref) => {
  if (!ref?.current) return ''
  return ref.current.value ?? ''
}
