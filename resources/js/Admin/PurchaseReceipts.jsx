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
import PurchaseReceiptsRest from '../Actions/Admin/PurchaseReceiptsRest';
import { scopedPermission } from '../Utils/permissionScope';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import {
  purchaseReceiptStatusOptions,
  getPurchaseReceiptStatusLabel,
} from '../Utils/statusLabels';

const purchaseReceiptsRest = new PurchaseReceiptsRest()

const documentTypeOptions = [
  { value: 'Factura', label: 'Factura' },
  { value: 'Boleta', label: 'Boleta' },
  { value: 'Ticket', label: 'Ticket' },
  { value: 'Otro', label: 'Otro' },
]

const currencyOptions = [
  { value: 'PEN', label: 'PEN' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
]

const paymentConditionOptions = [
  { value: 'Contado', label: 'Contado' },
  { value: 'Credito', label: 'Crédito' },
]

// Carga listas completas (acotadas) para alimentar los VdSelect que antes
// hacian busqueda remota via select2/SelectAPIFormGroup. VdSelect no soporta
// busqueda remota paginada, asi que se carga un lote generoso una sola vez.
const loadFullList = async (path, { take = 500, sort = 'name', desc = false, extra = {} } = {}) => {
  try {
    const { status, result } = await Fetch(`/api/${path}/paginate`, {
      method: 'POST',
      body: JSON.stringify({
        isLoadingAll: true,
        take,
        sort: [{ selector: sort, desc }],
        ...extra,
      })
    })
    if (!status) throw new Error(result?.message || 'No se pudo cargar la lista')
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

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  purchase_order_item_id: '',
  article_id: '',
  article_label: '',
  article_unit: '',
  article_laboratory: '',
  article_principle: '',
  ordered_quantity: 0,
  already_received: 0,
  pending_quantity: 0,
  batch_code: '',
  lot: '',
  expiration_date: '',
  stock_before: 0,
  units_per_box: 0,
  boxes_quantity: 0,
  cost_unit: 0,
  location: '',
  quantity: 0,
  total: 0,
})

const PurchaseReceipts = () => {
  const tableRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const issueDateRef = useRef()
  const documentSeriesRef = useRef()
  const documentSequenceRef = useRef()
  const documentFileRef = useRef()
  const firstDueDateRef = useRef()
  const installmentsRef = useRef()
  const taxAmountRef = useRef()
  const observationsRef = useRef()
  const guideSeriesRef = useRef()
  const guideSequenceRef = useRef()
  const guideRucRef = useRef()
  const guideFileRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState('')
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedReceiptStatus, setSelectedReceiptStatus] = useState('draft')
  const [selectedDocumentType, setSelectedDocumentType] = useState('Factura')
  const [selectedCurrency, setSelectedCurrency] = useState('PEN')
  const [selectedPaymentCondition, setSelectedPaymentCondition] = useState('Contado')
  const [branches, setBranches] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [taxAmount, setTaxAmount] = useState(0)

  const [businessesCatalog, setBusinessesCatalog] = useState([])
  const [warehousesCatalog, setWarehousesCatalog] = useState([])
  const [suppliersCatalog, setSuppliersCatalog] = useState([])
  const [purchaseOrdersCatalog, setPurchaseOrdersCatalog] = useState([])
  const [articlesCatalog, setArticlesCatalog] = useState([])

  const refresh = () => tableRef.current?.refresh()

  // Agrega un registro puntual (por ejemplo el de una recepcion en edicion)
  // al catalogo si el lote cargado al inicio no lo incluyo.
  const ensureCatalog = (setList, record) => {
    if (!record?.id) return
    setList(prev => prev.some(item => `${item.id}` === `${record.id}`) ? prev : [...prev, record])
  }

  useEffect(() => {
    const loadCatalogs = async () => {
      const [businessesData, warehousesData, suppliersData, purchaseOrdersData, articlesData] = await Promise.all([
        loadFullList('admin/businesses', { take: 500, sort: 'name' }),
        loadFullList('admin/warehouses', { take: 500, sort: 'name' }),
        loadFullList('admin/suppliers', { take: 1000, sort: 'business_name' }),
        loadFullList('admin/purchase-orders', { take: 1000, sort: 'id', desc: true }),
        loadFullList('admin/articles', { take: 1000, sort: 'name' }),
      ])
      setBusinessesCatalog(businessesData)
      setWarehousesCatalog(warehousesData)
      setSuppliersCatalog(suppliersData)
      setPurchaseOrdersCatalog(purchaseOrdersData)
      setArticlesCatalog(articlesData)
    }
    loadCatalogs()
  }, [])

  const businessOptions = useMemo(() => businessesCatalog.map(item => ({ value: `${item.id}`, label: item.name })), [businessesCatalog])
  const warehouseOptions = useMemo(() => warehousesCatalog.map(item => ({ value: `${item.id}`, label: item.name })), [warehousesCatalog])
  const supplierOptions = useMemo(() => suppliersCatalog.map(item => ({ value: `${item.id}`, label: item.business_name })), [suppliersCatalog])
  const purchaseOrderOptions = useMemo(() => purchaseOrdersCatalog.map(po => ({
    value: `${po.id}`,
    label: `${po.code ?? ''}${po?.supplier?.business_name ? ` - ${po.supplier.business_name}` : ''}`.trim(),
  })), [purchaseOrdersCatalog])
  const articleOptions = useMemo(() => articlesCatalog.map(a => ({ value: `${a.id}`, label: `${a.code ?? ''} - ${a.name ?? ''}`.trim() })), [articlesCatalog])

  // Si el articulo de una linea (guardado previamente) no esta en el catalogo
  // cargado, se agrega como opcion puntual para que el VdSelect lo muestre.
  const articleOptionsForItem = (item) => {
    if (!item.article_id || articlesCatalog.some(a => `${a.id}` === `${item.article_id}`)) return articleOptions
    return [...articleOptions, { value: `${item.article_id}`, label: item.article_label || `#${item.article_id}` }]
  }

  const loadBranches = async (businessId, preferredId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
      return
    }
    const data = await purchaseReceiptsRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return
    }
    setSelectedBranchId('')
  }

  const buildItemFromPurchaseOrderItem = (purchaseOrderItem) => {
    const article = purchaseOrderItem?.article ?? null
    const orderedQuantity = Number(purchaseOrderItem?.requested_quantity || 0)
    const alreadyReceived = Number(purchaseOrderItem?.received_quantity || 0)
    const pendingQuantity = Math.max(0, orderedQuantity - alreadyReceived)
    const presentationUnits = Number(purchaseOrderItem?.presentation_units || 1) || 1
    return mapItemTotals({
      uid: crypto.randomUUID(),
      purchase_order_item_id: purchaseOrderItem?.id ? `${purchaseOrderItem.id}` : '',
      article_id: purchaseOrderItem?.article_id ? `${purchaseOrderItem.article_id}` : '',
      article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : '',
      article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
      article_laboratory: article?.laboratory?.name ?? '',
      article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
      presentation_label: purchaseOrderItem?.presentation_label || purchaseOrderItem?.presentation?.name || '',
      presentation_units: presentationUnits,
      ordered_quantity: orderedQuantity,
      already_received: alreadyReceived,
      pending_quantity: pendingQuantity,
      cost_unit: Number(purchaseOrderItem?.price_unit || 0),
      quantity: pendingQuantity,
      total: Number(pendingQuantity * Number(purchaseOrderItem?.price_unit || 0)),
    })
  }

  const buildItemFromReceiptRow = (row) => {
    const article = row?.article ?? null
    const purchaseOrderItem = row?.purchaseOrderItem ?? row?.purchase_order_item ?? null
    const orderedQuantity = Number(purchaseOrderItem?.requested_quantity || 0)
    const alreadyReceived = Number(purchaseOrderItem?.received_quantity || 0)
    const presentationUnits = Number(purchaseOrderItem?.presentation_units || 1) || 1
    const quantity = purchaseOrderItem
      ? Number((Number(row?.quantity || 0) / presentationUnits).toFixed(3))
      : Number(row?.quantity || 0)
    return mapItemTotals({
      uid: crypto.randomUUID(),
      purchase_order_item_id: row?.purchase_order_item_id ? `${row.purchase_order_item_id}` : '',
      article_id: row?.article_id ? `${row.article_id}` : '',
      article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : '',
      article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
      article_laboratory: article?.laboratory?.name ?? '',
      article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
      presentation_label: purchaseOrderItem?.presentation_label || purchaseOrderItem?.presentation?.name || '',
      presentation_units: presentationUnits,
      ordered_quantity: orderedQuantity,
      already_received: alreadyReceived,
      pending_quantity: Math.max(0, orderedQuantity - alreadyReceived),
      batch_code: row?.batch_code ?? '',
      lot: row?.lot ?? '',
      expiration_date: row?.expiration_date ? row.expiration_date.toString().slice(0, 10) : '',
      stock_before: Number(row?.stock_before || 0),
      units_per_box: Number(row?.units_per_box || 0),
      boxes_quantity: Number(row?.boxes_quantity || 0),
      cost_unit: Number(row?.cost_unit || 0),
      location: row?.location ?? '',
      quantity,
      total: Number(row?.total || 0),
    })
  }

  const applyPurchaseOrderData = async (purchaseOrder) => {
    if (!purchaseOrder) return

    const purchaseOrderId = purchaseOrder?.id ? `${purchaseOrder.id}` : ''
    const businessId = purchaseOrder?.business_id ? `${purchaseOrder.business_id}` : ''
    const warehouseId = purchaseOrder?.warehouse_id ? `${purchaseOrder.warehouse_id}` : ''
    const supplierId = purchaseOrder?.supplier_id ? `${purchaseOrder.supplier_id}` : ''
    const branchId = purchaseOrder?.business_branch_id ? `${purchaseOrder.business_branch_id}` : ''

    setSelectedPurchaseOrderId(purchaseOrderId)
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)
    setSelectedSupplierId(supplierId)

    ensureCatalog(setBusinessesCatalog, purchaseOrder?.business)
    ensureCatalog(setWarehousesCatalog, purchaseOrder?.warehouse)
    ensureCatalog(setSuppliersCatalog, purchaseOrder?.supplier)

    setSelectedCurrency(purchaseOrder?.currency ?? 'PEN')
    setSelectedPaymentCondition(purchaseOrder?.payment_condition ?? 'Contado')
    await loadBranches(purchaseOrder?.business_id ?? null, purchaseOrder?.business_branch_id ?? branchId)

    const pendingItems = (purchaseOrder?.items ?? [])
      .map(buildItemFromPurchaseOrderItem)
      .filter(item => Number(item.pending_quantity || 0) > 0)

    setItems(pendingItems.length ? pendingItems : [emptyItem()])
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)

    setRefValue(idRef, data?.id ?? '')
    setRefValue(codeRef, data?.code ?? 'Se genera al guardar')
    setRefValue(issueDateRef, data?.issue_date ? data.issue_date.toString().slice(0, 10) : new Date().toISOString().slice(0, 10))
    setSelectedReceiptStatus(data?.receipt_status ?? 'draft')
    setSelectedDocumentType(data?.document_type ?? 'Factura')
    setRefValue(documentSeriesRef, data?.document_series ?? '')
    setRefValue(documentSequenceRef, data?.document_sequence ?? '')
    if (documentFileRef.current) documentFileRef.current.value = ''
    setSelectedCurrency(data?.currency ?? 'PEN')
    setSelectedPaymentCondition(data?.payment_condition ?? 'Contado')
    setRefValue(firstDueDateRef, data?.first_due_date ? data.first_due_date.toString().slice(0, 10) : '')
    setRefValue(installmentsRef, data?.installments ?? '')
    setTaxAmount(Number(data?.tax_amount ?? 0))
    setRefValue(taxAmountRef, Number(data?.tax_amount ?? 0))
    setRefValue(observationsRef, data?.observations ?? '')
    setRefValue(guideSeriesRef, data?.guide_series ?? '')
    setRefValue(guideSequenceRef, data?.guide_sequence ?? '')
    setRefValue(guideRucRef, data?.guide_ruc ?? '')
    if (guideFileRef.current) guideFileRef.current.value = ''

    const purchaseOrderId = data?.purchase_order_id ? `${data.purchase_order_id}` : ''
    const businessId = data?.business_id ? `${data.business_id}` : ''
    const warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : ''
    const supplierId = data?.supplier_id ? `${data.supplier_id}` : ''
    setSelectedPurchaseOrderId(purchaseOrderId)
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)
    setSelectedSupplierId(supplierId)

    if (purchaseOrderId) {
      ensureCatalog(setPurchaseOrdersCatalog, {
        ...(data?.purchaseOrder ?? { id: data.purchase_order_id, code: data?.purchaseOrder?.code }),
        supplier: data?.purchaseOrder?.supplier ?? data?.supplier ?? null,
      })
    }
    ensureCatalog(setBusinessesCatalog, data?.business)
    ensureCatalog(setWarehousesCatalog, data?.warehouse)
    ensureCatalog(setSuppliersCatalog, data?.supplier)

    const detail = (data?.items ?? []).map(buildItemFromReceiptRow)
    setItems(detail.length ? detail : [emptyItem()])
    ;(data?.items ?? []).forEach(row => { if (row?.article) ensureCatalog(setArticlesCatalog, row.article) })

    $(modalRef.current).modal('show')
    await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    if (!selectedBusinessId) {
      Swal.fire({ icon: 'warning', title: 'Falta empresa', text: 'Selecciona una empresa.', confirmButtonText: 'Entendido' })
      return
    }
    if (!selectedWarehouseId) {
      Swal.fire({ icon: 'warning', title: 'Falta almacén', text: 'Selecciona un almacén.', confirmButtonText: 'Entendido' })
      return
    }
    if (!selectedSupplierId) {
      Swal.fire({ icon: 'warning', title: 'Falta proveedor', text: 'Selecciona un proveedor.', confirmButtonText: 'Entendido' })
      return
    }

    const formData = new FormData()
    if (getRefValue(idRef)) formData.append('id', getRefValue(idRef))
    formData.append('purchase_order_id', selectedPurchaseOrderId || '')
    formData.append('business_id', selectedBusinessId || '')
    formData.append('business_branch_id', selectedBranchId || '')
    formData.append('warehouse_id', selectedWarehouseId || '')
    formData.append('supplier_id', selectedSupplierId || '')
    formData.append('issue_date', getRefValue(issueDateRef))
    formData.append('receipt_status', selectedReceiptStatus || 'draft')
    formData.append('document_type', selectedDocumentType || 'Factura')
    formData.append('document_series', getRefValue(documentSeriesRef))
    formData.append('document_sequence', getRefValue(documentSequenceRef))
    formData.append('currency', selectedCurrency || 'PEN')
    formData.append('payment_condition', selectedPaymentCondition || 'Contado')
    formData.append('first_due_date', getRefValue(firstDueDateRef))
    formData.append('installments', getRefValue(installmentsRef))
    formData.append('tax_amount', Number(getRefValue(taxAmountRef) || 0))
    formData.append('observations', getRefValue(observationsRef).trim())
    formData.append('guide_series', getRefValue(guideSeriesRef))
    formData.append('guide_sequence', getRefValue(guideSequenceRef))
    formData.append('guide_ruc', getRefValue(guideRucRef))
    formData.append('items', JSON.stringify(items.map(item => ({
      purchase_order_item_id: item.purchase_order_item_id || null,
      article_id: item.article_id || null,
      batch_code: (item.batch_code ?? '').toString().trim(),
      lot: (item.lot ?? '').toString().trim(),
      expiration_date: item.expiration_date || null,
      stock_before: Number(item.stock_before || 0),
      units_per_box: Number(item.units_per_box || 0),
      boxes_quantity: Number(item.boxes_quantity || 0),
      cost_unit: Number(item.cost_unit || 0),
      location: (item.location ?? '').toString().trim(),
      quantity: Number(item.quantity || 0),
      total: Number(item.total || 0),
      status: true,
    }))))

    const documentFile = documentFileRef.current?.files?.[0]
    if (documentFile) formData.append('document_file', documentFile)
    const guideFile = guideFileRef.current?.files?.[0]
    if (guideFile) formData.append('guide_file', guideFile)

    const result = await purchaseReceiptsRest.save(formData)
    if (!result) return

    refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await purchaseReceiptsRest.boolean({ id, field, value })
    if (!result) return
    refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar recepción de compra',
      text: '¿Estás seguro de eliminar esta recepción de compra? Esta acción no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await purchaseReceiptsRest.delete(id)
    if (!result) return
    refresh()
  }

  const onBusinessChanged = async (value) => {
    const businessId = value || ''
    setSelectedBusinessId(businessId)
    await loadBranches(businessId, null)
  }

  const onPurchaseOrderChanged = async (value) => {
    const purchaseOrderId = value || ''
    setSelectedPurchaseOrderId(purchaseOrderId)
    if (!purchaseOrderId) return

    // Se pide siempre el detalle completo (con items) por id: el catalogo
    // masivo del picker solo garantiza id/code/supplier para la etiqueta.
    const purchaseOrder = await purchaseReceiptsRest.getPurchaseOrderById(purchaseOrderId)
    if (!purchaseOrder) return
    ensureCatalog(setPurchaseOrdersCatalog, purchaseOrder)
    await applyPurchaseOrderData(purchaseOrder)
  }

  const onItemUpdated = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const next = { ...item, [field]: value }
      return mapItemTotals(next)
    }))
  }

  const onItemArticleChanged = async (uid, value) => {
    const articleId = value || ''

    if (!articleId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...emptyItem(), uid: item.uid } : item))
      return
    }

    const hydrated = articlesCatalog.find(a => `${a.id}` === `${articleId}`)
      ?? await purchaseReceiptsRest.getArticleById(articleId)
    if (hydrated) ensureCatalog(setArticlesCatalog, hydrated)
    const articleLabel = hydrated
      ? `${hydrated.code ?? ''} - ${hydrated.name ?? ''}`.trim()
      : `#${articleId}`

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      return mapItemTotals({
        ...item,
        article_id: articleId,
        article_label: articleLabel,
        article_unit: hydrated?.unit?.symbol ?? hydrated?.unit?.name ?? '',
        article_laboratory: hydrated?.laboratory?.name ?? '',
        article_principle: hydrated?.activePrinciple?.name ?? hydrated?.active_principle?.name ?? '',
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

  const mapItemTotals = (item) => {
    const quantity = Number(item.quantity || 0)
    const costUnit = Number(item.cost_unit || 0)
    return {
      ...item,
      total: Number.isFinite(quantity * costUnit) ? (quantity * costUnit) : 0,
    }
  }

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + Number(item.total || 0), 0), [items])
  const grandTotal = useMemo(() => subtotal + Number(taxAmount || 0), [subtotal, taxAmount])

  const rowActions = (row) => [
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
    { icon: 'mdi mdi-file-pdf-box', title: 'Imprimir PDF', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openMagistralesRecordPdf(buildMagistralesRows.purchaseReceipt(r)) },
    { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
  ]

  return (<>
    <VdTable
      ref={tableRef}
      rest={purchaseReceiptsRest}
      icon="mdi mdi-truck-check"
      title="Recepciones de compra"
      unit="recepciones"
      defaultSort={{ field: 'id', desc: true }}
      defaultPageSize={25}
      searchFields={['code', 'purchaseOrder.code', 'warehouse.name', 'supplier.business_name', 'document_series', 'document_sequence']}
      searchPlaceholder="Buscar por código, OC, almacén o proveedor…"
      emptyText="No se encontraron recepciones de compra."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen(null)}>
          <i className="mdi mdi-plus"></i> Nueva recepción
        </button>
      </>}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', width: '70px', filter: { type: 'number' } },
        {
          key: 'code', label: 'Código', field: 'code', width: '130px', filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar recepción de compra">
              {row.code || '-'}
            </a>
          ),
        },
        { key: 'oc', label: 'OC', field: 'purchaseOrder.code', width: '130px', sortable: false, filter: { type: 'text', field: 'purchaseOrder.code' } },
        { key: 'issue_date', label: 'F. emisión', field: 'issue_date', width: '110px', filter: { type: 'date' } },
        { key: 'warehouse', label: 'Almacén', field: 'warehouse.name', sortable: false, filter: { type: 'text', field: 'warehouse.name' } },
        { key: 'supplier', label: 'Proveedor', field: 'supplier.business_name', sortable: false, filter: { type: 'text', field: 'supplier.business_name' } },
        { key: 'document_type', label: 'Tipo doc', field: 'document_type', width: '110px', filter: { type: 'text' } },
        { key: 'document_series', label: 'Serie', field: 'document_series', width: '90px', filter: { type: 'text' } },
        { key: 'document_sequence', label: 'Secuencia', field: 'document_sequence', width: '110px', filter: { type: 'text' } },
        { key: 'payment_condition', label: 'Pago', field: 'payment_condition', width: '100px', filter: { type: 'text' } },
        {
          key: 'receipt_status', label: 'Estado', field: 'receipt_status', width: '120px',
          filter: { type: 'select', options: purchaseReceiptStatusOptions },
          render: (row) => getPurchaseReceiptStatusLabel(row.receipt_status),
        },
        {
          key: 'currency', label: 'Moneda', field: 'currency', width: '90px',
          filter: { type: 'select', options: currencyOptions },
        },
        {
          key: 'total', label: 'Total', field: 'total', width: '110px', align: 'right', filter: { type: 'number' },
          render: (row) => Number(row.total || 0).toFixed(2),
        },
        {
          key: 'detalle', label: 'Detalle', field: 'items', sortable: false,
          render: (row) => {
            const lines = (row?.items ?? []).map(item => `${item?.article?.name || 'Artículo'} | Lote ${item?.lot || '-'} | Cant. ${Number(item?.quantity || 0).toFixed(2)} | ${row.currency} ${Number(item?.total || 0).toFixed(2)}`)
            if (!lines.length) return <small className="text-muted">Sin detalle</small>
            return <div>{lines.map((line, idx) => <div key={`purchase-receipt-${row.id}-${idx}`}><small>{line}</small></div>)}</div>
          },
        },
        {
          key: 'creador', label: 'Creado por', field: 'creator.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.creator),
        },
        {
          key: 'actualizador', label: 'Actualizado por', field: 'updater.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.updater),
        },
        {
          key: 'status', label: 'Activo', field: 'status', width: '95px',
          filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
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
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.code || '-'}</p>
              <small className="text-muted">{[row.purchaseOrder?.code, row.warehouse?.name].filter(Boolean).join(' · ')}</small>
            </div>
            {row.status !== null && <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>}
          </div>
          <small className="text-muted d-block mt-2">{row.supplier?.business_name || '-'}</small>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted">{getPurchaseReceiptStatusLabel(row.receipt_status)}</small>
            <strong>{row.currency} {Number(row.total || 0).toFixed(2)}</strong>
          </div>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar recepción de compra' : 'Agregar recepción de compra'} onSubmit={onModalSubmit} size='full-width'>
      <div className='row' id='purchase-receipt-form-container'>
        <input ref={idRef} type='hidden' />

        <VdSelect
          label='Orden de compra'
          col='col-md-3'
          value={selectedPurchaseOrderId}
          onChange={onPurchaseOrderChanged}
          options={purchaseOrderOptions}
          placeholder='-- Sin orden de compra (opcional) --'
        />
        <VdSelect
          label='Empresa'
          col='col-md-3'
          required
          value={selectedBusinessId}
          onChange={onBusinessChanged}
          options={businessOptions}
          placeholder='-- Seleccionar empresa --'
        />
        <VdSelect
          label='Sede'
          col='col-md-3'
          value={selectedBranchId}
          onChange={(value) => setSelectedBranchId(value)}
          options={branches.map(branch => ({ value: `${branch.id}`, label: branch.name }))}
          placeholder='-- Seleccione sede --'
        />
        <VdSelect
          label='Almacén'
          col='col-md-3'
          required
          value={selectedWarehouseId}
          onChange={(value) => setSelectedWarehouseId(value || '')}
          options={warehouseOptions}
          placeholder='-- Seleccionar almacén --'
        />
        <VdSelect
          label='Proveedor'
          col='col-md-3'
          required
          value={selectedSupplierId}
          onChange={(value) => setSelectedSupplierId(value || '')}
          options={supplierOptions}
          placeholder='-- Seleccionar proveedor --'
        />
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Código</label>
          <input ref={codeRef} className='form-control' disabled />
        </div>
        <InputFormGroup eRef={issueDateRef} label='Fecha emisión' col='col-md-2' type='date' required />
        <VdSelect
          label='Estado recepción'
          col='col-md-2'
          value={selectedReceiptStatus}
          onChange={setSelectedReceiptStatus}
          options={purchaseReceiptStatusOptions}
        />
        <VdSelect
          label='Tipo documento'
          col='col-md-2'
          value={selectedDocumentType}
          onChange={setSelectedDocumentType}
          options={documentTypeOptions}
        />
        <InputFormGroup eRef={documentSeriesRef} label='Serie' col='col-md-1' />
        <InputFormGroup eRef={documentSequenceRef} label='Secuencia' col='col-md-2' />
        <div className='form-group col-md-3 mb-2'>
          <label className='form-label'>Archivo documento</label>
          <input ref={documentFileRef} type='file' className='form-control' />
        </div>
        <VdSelect
          label='Moneda'
          col='col-md-2'
          value={selectedCurrency}
          onChange={setSelectedCurrency}
          options={currencyOptions}
        />
        <VdSelect
          label='Condición de pago'
          col='col-md-2'
          value={selectedPaymentCondition}
          onChange={setSelectedPaymentCondition}
          options={paymentConditionOptions}
        />
        <InputFormGroup eRef={firstDueDateRef} label='Primera cuota' col='col-md-2' type='date' />
        <InputFormGroup eRef={installmentsRef} label='Cuotas' col='col-md-1' type='number' min='1' step='1' />
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

        <TextareaFormGroup eRef={observationsRef} label='Observaciones' col='col-12' rows={2} />

        <h6 className='mt-3 mb-2'>Guía de remisión</h6>
        <InputFormGroup eRef={guideSeriesRef} label='Serie' col='col-md-2' />
        <InputFormGroup eRef={guideSequenceRef} label='Secuencia' col='col-md-2' />
        <InputFormGroup eRef={guideRucRef} label='RUC' col='col-md-2' />
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label'>Archivo guía</label>
          <input ref={guideFileRef} type='file' className='form-control' />
        </div>

        <div className='col-12 mt-3'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Detalle recepción</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={onItemAdded}>
              <i className='mdi mdi-plus me-1'></i> Agregar línea
            </button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Lab. | Principio</th>
                  <th>Unidad</th>
                  <th>Presentacion</th>
                  <th>Solic.</th>
                  <th>Ya rec.</th>
                  <th>Pend.</th>
                  <th>Cod. lote</th>
                  <th>Lote</th>
                  <th>F. venc.</th>
                  <th>Stock ant.</th>
                  <th>Und/caja</th>
                  <th>Cajas</th>
                  <th>P. costo</th>
                  <th>Ubicación</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.uid}>
                    <td style={{ width: '20%' }}>
                      {item.purchase_order_item_id ? (
                        <input className='form-control form-control-sm' value={item.article_label} readOnly />
                      ) : (
                        <VdSelect
                          col=''
                          noMargin
                          value={item.article_id}
                          onChange={(value) => onItemArticleChanged(item.uid, value)}
                          options={articleOptionsForItem(item)}
                          placeholder='-- Artículo --'
                        />
                      )}
                    </td>
                    <td><small>{`${item.article_laboratory || '-'} | ${item.article_principle || '-'}`}</small></td>
                    <td><small>{item.article_unit || '-'}</small></td>
                    <td>
                      <small>{item.presentation_label || '-'}</small>
                      {item.presentation_units ? <small className='d-block text-muted'>{Number(item.presentation_units || 1).toFixed(3)} und.</small> : null}
                    </td>
                    <td><input className='form-control form-control-sm' value={Number(item.ordered_quantity || 0).toFixed(3)} readOnly /></td>
                    <td><input className='form-control form-control-sm' value={Number(item.already_received || 0).toFixed(3)} readOnly /></td>
                    <td><input className='form-control form-control-sm' value={Number(item.pending_quantity || 0).toFixed(3)} readOnly /></td>
                    <td><input className='form-control form-control-sm' value={item.batch_code} onChange={(e) => onItemUpdated(item.uid, 'batch_code', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' value={item.lot} onChange={(e) => onItemUpdated(item.uid, 'lot', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='date' value={item.expiration_date} onChange={(e) => onItemUpdated(item.uid, 'expiration_date', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.stock_before} onChange={(e) => onItemUpdated(item.uid, 'stock_before', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.units_per_box} onChange={(e) => onItemUpdated(item.uid, 'units_per_box', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.boxes_quantity} onChange={(e) => onItemUpdated(item.uid, 'boxes_quantity', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.cost_unit} onChange={(e) => onItemUpdated(item.uid, 'cost_unit', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' value={item.location} onChange={(e) => onItemUpdated(item.uid, 'location', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => onItemUpdated(item.uid, 'quantity', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' value={Number(item.total || 0).toFixed(2)} readOnly /></td>
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
              <div><strong>Subtotal:</strong> {Number(subtotal).toFixed(2)}</div>
              <div><strong>IGV / Impuesto:</strong> {Number(taxAmount || 0).toFixed(2)}</div>
              <div><strong>Total:</strong> {Number(grandTotal).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can(scopedPermission('purchase-receipts')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Recepciones de compra'>
    <PurchaseReceipts {...properties} />
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
