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
import InputFormGroup from '@Adminto/form/InputFormGroup';
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import PurchaseOrdersRest from '../Actions/Admin/PurchaseOrdersRest';
import { scopedPermission } from '../Utils/permissionScope';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import setSwitchChecked from '../Utils/setSwitchChecked';
import {
  approvalStatusOptions,
  purchaseOrderStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const purchaseOrdersRest = new PurchaseOrdersRest()

const MAGISTRAL_ARTICLE_TYPES = [
  { value: '', label: 'Seleccione' },
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

const magistralArticleFilterByType = (value) => {
  const type = canonicalMagistralPurchaseArticleType(value)
  if (type === 'INSUMOS Y ENVASES') {
    return [
      ['article_type', '=', 'INSUMO'],
      'or',
      ['article_type', '=', 'INSUMOS'],
      'or',
      ['article_type', '=', 'ENVASE'],
      'or',
      ['article_type', '=', 'ENVASES'],
    ]
  }
  if (type === 'PRODUCTOS COMERCIALES') {
    return [
      ['article_type', '=', 'PRODUCTO COMERCIAL'],
      'or',
      ['article_type', '=', 'PRODUCTOS COMERCIALES'],
    ]
  }

  return ['id', '=', -1]
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
    article_laboratory: article?.laboratory?.name ?? article?.magistralLaboratory?.description ?? '',
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

const PurchaseOrders = ({ moduleTitle = 'Ordenes de compra', moduleScope, fixedWarehouse = null }) => {
  const isMagistrales = moduleScope === 'magistrales'
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const fixedBusinessId = fixedWarehouse?.business_id ? `${fixedWarehouse.business_id}` : ''
  const fixedBranchId = fixedWarehouse?.business_branch_id ? `${fixedWarehouse.business_branch_id}` : ''
  const fixedWarehouseLabel = [fixedWarehouse?.branch_name, fixedWarehouse?.name].filter(Boolean).join(' - ') || 'Almacen fijo de Magistrales'
  const fixedBusinessLabel = fixedWarehouse?.business_name || 'KAMARY PERU SAC'
  const gridRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const businessRef = useRef()
  const branchRef = useRef()
  const warehouseRef = useRef()
  const supplierRef = useRef()
  const buyerNameRef = useRef()
  const articleTypeRef = useRef()
  const issueDateRef = useRef()
  const expectedDateRef = useRef()
  const maxDeliveryDateRef = useRef()
  const currencyRef = useRef()
  const paymentConditionRef = useRef()
  const paymentMethodRef = useRef()
  const documentTypeRef = useRef()
  const orderStatusRef = useRef()
  const approvalStatusRef = useRef()
  const taxAmountRef = useRef()
  const observationsRef = useRef()
  const deliveryPlaceRef = useRef()
  const affectsIgvRef = useRef()
  const listSupplierRef = useRef()
  const articleRefs = useRef({})

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState(isMagistrales ? fixedBusinessId : '')
  const [selectedBranchId, setSelectedBranchId] = useState(isMagistrales ? fixedBranchId : '')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(isMagistrales ? fixedWarehouseId : '')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedArticleType, setSelectedArticleType] = useState('')
  const [branches, setBranches] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [taxAmount, setTaxAmount] = useState(0)
  const [currencyCode, setCurrencyCode] = useState('PEN')
  const [affectsIgv, setAffectsIgv] = useState(true)
  const [listSupplierId, setListSupplierId] = useState('')
  const [listStartDate, setListStartDate] = useState('')
  const [listEndDate, setListEndDate] = useState('')
  const [listFilterValue, setListFilterValue] = useState(null)
  const warehouseForArticleType = () => fixedWarehouse
  const activeWarehouse = warehouseForArticleType(selectedArticleType)
  const activeWarehouseId = activeWarehouse?.id ? `${activeWarehouse.id}` : fixedWarehouseId
  const activeBusinessId = activeWarehouse?.business_id ? `${activeWarehouse.business_id}` : fixedBusinessId
  const activeBranchId = activeWarehouse?.business_branch_id ? `${activeWarehouse.business_branch_id}` : fixedBranchId
  const activeWarehouseLabel = fixedWarehouseLabel

  const getArticleRef = (uid) => {
    if (!articleRefs.current[uid]) articleRefs.current[uid] = createRef()
    return articleRefs.current[uid]
  }

  useEffect(() => {
    if (!isMagistrales) return
    setSelectedBusinessId(activeBusinessId)
    setSelectedBranchId(activeBranchId)
    setSelectedWarehouseId(activeWarehouseId)
  }, [activeBranchId, activeBusinessId, activeWarehouseId, isMagistrales])

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
    setRefValue(currencyRef, data?.currency ?? 'PEN')
    setCurrencyCode(data?.currency ?? 'PEN')
    setRefValue(paymentConditionRef, data?.payment_condition ?? 'Contado')
    setRefValue(paymentMethodRef, data?.payment_method ?? 'Seleccione')
    setRefValue(documentTypeRef, data?.document_type ?? 'Seleccione')
    setRefValue(buyerNameRef, data?.buyer_name ?? '')
    setRefValue(orderStatusRef, data?.order_status ?? 'draft')
    setRefValue(approvalStatusRef, data?.approval_status ?? 'pending')
    setRefValue(deliveryPlaceRef, data?.delivery_place ?? '')
    const currentArticleType = canonicalMagistralPurchaseArticleType(data?.article_type)
    setRefValue(articleTypeRef, currentArticleType)
    setSelectedArticleType(currentArticleType)
    const currentAffectsIgv = typeof data?.affects_igv === 'boolean' ? data.affects_igv : true
    setAffectsIgv(currentAffectsIgv)
    setSwitchChecked(affectsIgvRef.current, currentAffectsIgv)

    setTaxAmount(Number(data?.tax_amount ?? 0))
    setRefValue(taxAmountRef, Number(data?.tax_amount ?? 0))
    setRefValue(observationsRef, data?.observations ?? '')

    const modalWarehouse = warehouseForArticleType(currentArticleType)
    const businessId = isMagistrales ? (modalWarehouse?.business_id ? `${modalWarehouse.business_id}` : fixedBusinessId) : (data?.business_id ? `${data.business_id}` : '')
    const branchId = isMagistrales ? (modalWarehouse?.business_branch_id ? `${modalWarehouse.business_branch_id}` : fixedBranchId) : (data?.business_branch_id ? `${data.business_branch_id}` : '')
    const warehouseId = isMagistrales ? (modalWarehouse?.id ? `${modalWarehouse.id}` : fixedWarehouseId) : (data?.warehouse_id ? `${data.warehouse_id}` : '')
    const supplierId = data?.supplier_id ? `${data.supplier_id}` : ''
    setSelectedBusinessId(businessId)
    setSelectedBranchId(branchId)
    setSelectedWarehouseId(warehouseId)
    setSelectedSupplierId(supplierId)

    if (!isMagistrales) {
      if (businessId && data?.business?.name) {
        SetSelectValue(businessRef.current, businessId, data.business.name)
      } else {
        $(businessRef.current).empty().trigger('change')
      }
      if (warehouseId && data?.warehouse?.name) {
        SetSelectValue(warehouseRef.current, warehouseId, data.warehouse.name)
      } else if (warehouseRef.current) {
        $(warehouseRef.current).empty().trigger('change')
      }
    }

    if (supplierId && data?.supplier?.business_name) {
      SetSelectValue(supplierRef.current, supplierId, data.supplier.business_name)
    } else {
      $(supplierRef.current).empty().trigger('change')
    }

    const detail = (data?.items ?? []).map(row => {
      const article = row.article ?? null
      const presentationOptions = presentationOptionsFromArticle(article)
      const selectedPresentation = presentationOptions.find(option => `${option.id}` === `${row.presentation_id ?? ''}`) ?? presentationOptions[0] ?? null
      return hydrateItemTotals({
        uid: crypto.randomUUID(),
        article_id: row.article_id ? `${row.article_id}` : '',
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : '',
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
        article_laboratory: article?.laboratory?.name ?? article?.magistralLaboratory?.description ?? '',
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

    const requestArticleType = canonicalMagistralPurchaseArticleType(getRefValue(articleTypeRef))
    const requestWarehouse = warehouseForArticleType(requestArticleType)
    const request = {
      id: getRefValue(idRef) || undefined,
      business_id: isMagistrales ? (requestWarehouse?.business_id || null) : (selectedBusinessId || null),
      business_branch_id: isMagistrales ? (requestWarehouse?.business_branch_id || null) : (selectedBranchId || null),
      warehouse_id: isMagistrales ? (requestWarehouse?.id || null) : (selectedWarehouseId || null),
      supplier_id: selectedSupplierId || null,
      buyer_name: getRefValue(buyerNameRef).trim(),
      article_type: isMagistrales ? (requestArticleType || null) : null,
      issue_date: getRefValue(issueDateRef),
      expected_date: getRefValue(expectedDateRef) || null,
      max_delivery_date: isMagistrales ? (getRefValue(maxDeliveryDateRef) || null) : null,
      delivery_place: isMagistrales ? (getRefValue(deliveryPlaceRef).trim() || null) : null,
      currency: getRefValue(currencyRef) || 'PEN',
      payment_condition: getRefValue(paymentConditionRef) || 'Contado',
      payment_method: isMagistrales ? ((getRefValue(paymentMethodRef) || '').replace('Seleccione', '').trim() || null) : null,
      document_type: isMagistrales ? ((getRefValue(documentTypeRef) || '').replace('Seleccione', '').trim() || null) : null,
      affects_igv: isMagistrales ? affectsIgv : null,
      order_status: getRefValue(orderStatusRef) || 'draft',
      approval_status: getRefValue(approvalStatusRef) || 'pending',
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

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await purchaseOrdersRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
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
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onBusinessChanged = async (e) => {
    const businessId = e.target.value || ''
    setSelectedBusinessId(businessId)
    await loadBranches(businessId, null)
  }

  const onMagistralArticleTypeChanged = (e) => {
    const nextType = canonicalMagistralPurchaseArticleType(e.target.value)
    setSelectedArticleType(nextType)
    setRefValue(articleTypeRef, nextType)
    articleRefs.current = {}
    setItems([emptyItem()])
  }

  const onItemUpdated = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      return hydrateItemTotals({ ...item, [field]: value })
    }))
  }

  const onItemArticleChanged = async (uid, e) => {
    const selected = $(e.target).select2('data')?.[0]
    const article = selected?.data ?? null
    const articleId = e.target.value || ''

    if (!articleId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...emptyItem(), uid: item.uid } : item))
      return
    }

    const hydrated = article ?? await purchaseOrdersRest.getArticleById(articleId)
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

  const articleFilter = useMemo(() => {
    if (!isMagistrales) return null
    return magistralArticleFilterByType(selectedArticleType)
  }, [isMagistrales, selectedArticleType])

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

  const onCurrencyChanged = (e) => {
    const nextCurrency = e.target.value || 'PEN'
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
    if (listSupplierRef.current) $(listSupplierRef.current).empty().trigger('change')
  }

  return (<>
    {isMagistrales && (
      <form id='purchase-order-list-filter' className='card mb-3' onSubmit={onListFilterSubmitted}>
        <div className='card-body'>
          <h4 className='header-title mb-3'>Consulta de ordenes de compra</h4>
          <div className='row align-items-end'>
            <SelectAPIFormGroup
              eRef={listSupplierRef}
              label='Proveedor'
              col='col-md-4'
              searchAPI={purchaseOrdersRest.suppliersPaginateApi()}
              searchBy='business_name'
              dropdownParent='#purchase-order-list-filter'
              onChange={(e) => setListSupplierId(e.target.value || '')}
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

    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={purchaseOrdersRest}
      filterValue={isMagistrales ? listFilterValue : null}
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
            hint: 'Agregar orden de compra',
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
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar orden de compra')
        },
        { dataField: 'issue_date', caption: 'F. emisión', width: 110, dataType: 'date' },
        { dataField: 'expected_date', caption: 'F. estimada', width: 115, dataType: 'date' },
        ...(isMagistrales ? [{ dataField: 'max_delivery_date', caption: 'F. máxima', width: 115, dataType: 'date' }] : []),
        { dataField: 'business.name', caption: isMagistrales ? 'Comprador' : 'Empresa', minWidth: 160 },
        ...(!isMagistrales ? [
          { dataField: 'branch.name', caption: 'Sede', minWidth: 130 },
          { dataField: 'warehouse.name', caption: 'Almacén', minWidth: 130 },
        ] : []),
        { dataField: 'supplier.business_name', caption: 'Proveedor', minWidth: 220 },
        ...(isMagistrales ? [{ dataField: 'article_type', caption: 'Tipo artículo', minWidth: 150 }] : []),
        { dataField: 'payment_condition', caption: 'Condición', width: 110 },
        ...(isMagistrales ? [{ dataField: 'payment_method', caption: 'Forma pago', width: 130 }] : []),
        ...(isMagistrales ? [{ dataField: 'document_type', caption: 'Documento', width: 110 }] : []),
        { dataField: 'approval_status', caption: isMagistrales ? 'Estado' : 'Aprobación', width: 110, lookup: toLookup(approvalStatusOptions) },
        { dataField: 'order_status', caption: 'Estado OC', width: 110, lookup: toLookup(purchaseOrderStatusOptions) },
        { dataField: 'currency', caption: 'Moneda', width: 90 },
        { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        {
          dataField: 'items.id',
          caption: 'Detalle',
          minWidth: isMagistrales ? 340 : 280,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            const lines = (data?.items ?? []).map(item => {
              const articleName = item?.article?.name || 'Artículo'
              const presentation = item?.presentation_label || item?.presentation?.name || ''
              const priceLabel = isMagistrales ? ` | P. IGV ${Number(item?.price_unit || 0).toFixed(2)}` : ` | ${data.currency} ${Number(item?.total || 0).toFixed(2)}`
              return `${articleName}${presentation ? ` | ${presentation}` : ''} | Cant. ${Number(item?.requested_quantity || 0).toFixed(2)}${priceLabel}`
            })
            ReactAppend(container, <div>
              {lines.length === 0 && <small className='text-muted'>Sin detalle</small>}
              {lines.map((line, idx) => <div key={`purchase-order-${data.id}-${idx}`}><small>{line}</small></div>)}
            </div>)
          }
        },
        ...(isMagistrales ? [{ dataField: 'created_at', caption: 'Fecha registro', width: 160, dataType: 'datetime' }] : []),
        {
          dataField: 'creator.fullname',
          caption: isMagistrales ? 'Usuario registro' : 'Creado por',
          visible: isMagistrales,
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
          visible: !isMagistrales,
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
          width: 160,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Imprimir PDF',
              icon: 'mdi mdi-file-pdf-box',
              onClick: () => openMagistralesRecordPdf(buildMagistralesRows.purchaseOrder(data))
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary ms-1',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar orden de compra',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar orden de compra' : 'Agregar orden de compra'} onSubmit={onModalSubmit} size='full-width'>
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
              <input className='form-control' value={activeWarehouseLabel} disabled />
            </div>
          </>
        ) : (
          <>
            <SelectAPIFormGroup
              eRef={businessRef}
              label='Empresa'
              col='col-md-3'
              required
              searchAPI='/api/admin/businesses/paginate'
              searchBy='name'
              dropdownParent='#purchase-order-form-container'
              onChange={onBusinessChanged}
            />
            <SelectFormGroup
              eRef={branchRef}
              label='Sede'
              col='col-md-3'
              dropdownParent='#purchase-order-form-container'
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              effectWith={[selectedBranchId, branches.length]}
            >
              <option value=''>-- Seleccione sede --</option>
              {branches.map(branch => <option key={`purchase-order-branch-${branch.id}`} value={branch.id}>{branch.name}</option>)}
            </SelectFormGroup>
            <SelectAPIFormGroup
              eRef={warehouseRef}
              label='Almacén'
              col='col-md-3'
              required
              searchAPI='/api/admin/warehouses/paginate'
              searchBy='name'
              dropdownParent='#purchase-order-form-container'
              onChange={(e) => setSelectedWarehouseId(e.target.value || '')}
            />
          </>
        )}

        <SelectAPIFormGroup
          eRef={supplierRef}
          label='Proveedor'
          col={isMagistrales ? 'col-md-6' : 'col-md-3'}
          required
          searchAPI={purchaseOrdersRest.suppliersPaginateApi()}
          searchBy='business_name'
          dropdownParent='#purchase-order-form-container'
          onChange={(e) => setSelectedSupplierId(e.target.value || '')}
        />

        {isMagistrales && (
          <SelectFormGroup
            eRef={articleTypeRef}
            label='Tipo de artículo'
            col='col-md-3'
            value={selectedArticleType}
            onChange={onMagistralArticleTypeChanged}
            effectWith={[selectedArticleType]}
          >
            {MAGISTRAL_ARTICLE_TYPES.map(option => (
              <option key={`purchase-order-article-type-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
            ))}
          </SelectFormGroup>
        )}

        {!isMagistrales && <InputFormGroup eRef={buyerNameRef} label='Comprador' col='col-md-3' />}

        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Código</label>
          <input ref={codeRef} className='form-control' disabled />
        </div>
        <InputFormGroup eRef={issueDateRef} label='Fecha emisión' col='col-md-2' type='date' required />
        <InputFormGroup eRef={expectedDateRef} label={isMagistrales ? 'Fecha estimada entrega' : 'Fecha esperada'} col='col-md-2' type='date' />
        {isMagistrales && <InputFormGroup eRef={maxDeliveryDateRef} label='Fecha máxima entrega' col='col-md-2' type='date' />}
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Moneda</label>
          <select ref={currencyRef} className='form-control' onChange={onCurrencyChanged}>
            <option value='PEN'>PEN</option>
            <option value='USD'>USD</option>
            <option value='EUR'>EUR</option>
          </select>
        </div>
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Condición de pago</label>
          <select ref={paymentConditionRef} className='form-control'>
            <option value='Contado'>Contado</option>
            <option value='Credito'>Crédito</option>
          </select>
        </div>
        {isMagistrales && (
          <>
            <div className='form-group col-md-2 mb-2'>
              <label className='form-label'>Forma de pago</label>
              <select ref={paymentMethodRef} className='form-control'>
                {PAYMENT_METHOD_OPTIONS.map(option => <option key={`purchase-order-payment-method-${option}`} value={option}>{option}</option>)}
              </select>
            </div>
            <div className='form-group col-md-2 mb-2'>
              <label className='form-label'>Tipo documento</label>
              <select ref={documentTypeRef} className='form-control'>
                {DOCUMENT_TYPE_OPTIONS.map(option => <option key={`purchase-order-document-type-${option}`} value={option}>{option}</option>)}
              </select>
            </div>
            <SwitchFormGroup eRef={affectsIgvRef} label='Afecto IGV' col='col-md-2' checked={affectsIgv} onChange={onAffectsIgvChanged} refreshable={isMagistrales} />
          </>
        )}
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Estado OC</label>
          <select ref={orderStatusRef} className='form-control'>
            {purchaseOrderStatusOptions.map((option) => (
              <option key={`purchase-order-status-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Aprobación</label>
          <select ref={approvalStatusRef} className='form-control'>
            {approvalStatusOptions.map((option) => (
              <option key={`purchase-order-approval-status-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
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
                  {isMagistrales && <th>Recibido</th>}
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
                      <SelectAPIFormGroup
                        eRef={getArticleRef(item.uid)}
                        col='col-12'
                        searchAPI={purchaseOrdersRest.articlesPaginateApi()}
                        searchBy='name'
                        dropdownParent='#purchase-order-form-container'
                        filter={articleFilter}
                        disabled={isMagistrales && !selectedArticleType}
                        onChange={(e) => onItemArticleChanged(item.uid, e)}
                      />
                    </td>
                    {isMagistrales ? (
                      <td style={{ width: '14%' }}>
                        <select
                          className='form-control form-control-sm'
                          value={item.presentation_id}
                          onChange={(e) => onItemPresentationChanged(item.uid, e.target.value)}
                        >
                          {(item.presentation_options ?? []).map(option => (
                            <option key={`purchase-order-presentation-${item.uid}-${option.id || option.name}`} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                          {(item.presentation_options ?? []).length === 0 && <option value=''>{item.presentation_label || 'UND'}</option>}
                        </select>
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
                        <input
                          className='form-control form-control-sm'
                          type='number'
                          min='0'
                          step='0.001'
                          value={item.received_quantity}
                          onChange={(e) => onItemUpdated(item.uid, 'received_quantity', e.target.value)}
                        />
                      </td>
                    )}
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
