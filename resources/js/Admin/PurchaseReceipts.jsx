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
import PurchaseReceiptsRest from '../Actions/Admin/PurchaseReceiptsRest';
import { scopedPermission } from '../Utils/permissionScope';
import {
  purchaseReceiptStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const purchaseReceiptsRest = new PurchaseReceiptsRest()

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
  const gridRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const purchaseOrderRef = useRef()
  const businessRef = useRef()
  const branchRef = useRef()
  const warehouseRef = useRef()
  const supplierRef = useRef()
  const issueDateRef = useRef()
  const receiptStatusRef = useRef()
  const documentTypeRef = useRef()
  const documentSeriesRef = useRef()
  const documentSequenceRef = useRef()
  const documentFileRef = useRef()
  const currencyRef = useRef()
  const paymentConditionRef = useRef()
  const firstDueDateRef = useRef()
  const installmentsRef = useRef()
  const taxAmountRef = useRef()
  const observationsRef = useRef()
  const guideSeriesRef = useRef()
  const guideSequenceRef = useRef()
  const guideRucRef = useRef()
  const guideFileRef = useRef()
  const articleRefs = useRef({})

  const [isEditing, setIsEditing] = useState(false)
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState('')
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [branches, setBranches] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [taxAmount, setTaxAmount] = useState(0)

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
    return mapItemTotals({
      uid: crypto.randomUUID(),
      purchase_order_item_id: purchaseOrderItem?.id ? `${purchaseOrderItem.id}` : '',
      article_id: purchaseOrderItem?.article_id ? `${purchaseOrderItem.article_id}` : '',
      article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : '',
      article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
      article_laboratory: article?.laboratory?.name ?? '',
      article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
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
    return mapItemTotals({
      uid: crypto.randomUUID(),
      purchase_order_item_id: row?.purchase_order_item_id ? `${row.purchase_order_item_id}` : '',
      article_id: row?.article_id ? `${row.article_id}` : '',
      article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : '',
      article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
      article_laboratory: article?.laboratory?.name ?? '',
      article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
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
      quantity: Number(row?.quantity || 0),
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

    if (purchaseOrderId) {
      const poLabel = `${purchaseOrder.code ?? ''}${purchaseOrder?.supplier?.business_name ? ` - ${purchaseOrder.supplier.business_name}` : ''}`.trim()
      SetSelectValue(purchaseOrderRef.current, purchaseOrderId, poLabel)
    }
    if (businessId && purchaseOrder?.business?.name) {
      SetSelectValue(businessRef.current, businessId, purchaseOrder.business.name)
    }
    if (warehouseId && purchaseOrder?.warehouse?.name) {
      SetSelectValue(warehouseRef.current, warehouseId, purchaseOrder.warehouse.name)
    }
    if (supplierId && purchaseOrder?.supplier?.business_name) {
      SetSelectValue(supplierRef.current, supplierId, purchaseOrder.supplier.business_name)
    }

    setRefValue(currencyRef, purchaseOrder?.currency ?? 'PEN')
    setRefValue(paymentConditionRef, purchaseOrder?.payment_condition ?? 'Contado')
    await loadBranches(purchaseOrder?.business_id ?? null, purchaseOrder?.business_branch_id ?? null)

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
    setRefValue(receiptStatusRef, data?.receipt_status ?? 'draft')
    setRefValue(documentTypeRef, data?.document_type ?? 'Factura')
    setRefValue(documentSeriesRef, data?.document_series ?? '')
    setRefValue(documentSequenceRef, data?.document_sequence ?? '')
    if (documentFileRef.current) documentFileRef.current.value = ''
    setRefValue(currencyRef, data?.currency ?? 'PEN')
    setRefValue(paymentConditionRef, data?.payment_condition ?? 'Contado')
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

    if (purchaseOrderId && data?.purchaseOrder?.code) {
      const poLabel = `${data.purchaseOrder.code ?? ''}${data?.supplier?.business_name ? ` - ${data.supplier.business_name}` : ''}`.trim()
      SetSelectValue(purchaseOrderRef.current, purchaseOrderId, poLabel)
    } else {
      $(purchaseOrderRef.current).empty().trigger('change')
    }
    if (businessId && data?.business?.name) {
      SetSelectValue(businessRef.current, businessId, data.business.name)
    } else {
      $(businessRef.current).empty().trigger('change')
    }
    if (warehouseId && data?.warehouse?.name) {
      SetSelectValue(warehouseRef.current, warehouseId, data.warehouse.name)
    } else {
      $(warehouseRef.current).empty().trigger('change')
    }
    if (supplierId && data?.supplier?.business_name) {
      SetSelectValue(supplierRef.current, supplierId, data.supplier.business_name)
    } else {
      $(supplierRef.current).empty().trigger('change')
    }

    const detail = (data?.items ?? []).map(buildItemFromReceiptRow)
    setItems(detail.length ? detail : [emptyItem()])

    $(modalRef.current).modal('show')
    await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    if (getRefValue(idRef)) formData.append('id', getRefValue(idRef))
    formData.append('purchase_order_id', selectedPurchaseOrderId || '')
    formData.append('business_id', selectedBusinessId || '')
    formData.append('business_branch_id', selectedBranchId || '')
    formData.append('warehouse_id', selectedWarehouseId || '')
    formData.append('supplier_id', selectedSupplierId || '')
    formData.append('issue_date', getRefValue(issueDateRef))
    formData.append('receipt_status', getRefValue(receiptStatusRef) || 'draft')
    formData.append('document_type', getRefValue(documentTypeRef) || 'Factura')
    formData.append('document_series', getRefValue(documentSeriesRef))
    formData.append('document_sequence', getRefValue(documentSequenceRef))
    formData.append('currency', getRefValue(currencyRef) || 'PEN')
    formData.append('payment_condition', getRefValue(paymentConditionRef) || 'Contado')
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

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await purchaseReceiptsRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
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
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onBusinessChanged = async (e) => {
    const businessId = e.target.value || ''
    setSelectedBusinessId(businessId)
    await loadBranches(businessId, null)
  }

  const onPurchaseOrderChanged = async (e) => {
    const purchaseOrderId = e.target.value || ''
    setSelectedPurchaseOrderId(purchaseOrderId)
    if (!purchaseOrderId) return

    const selected = $(e.target).select2('data')?.[0]
    const purchaseOrder = selected?.data ?? await purchaseReceiptsRest.getPurchaseOrderById(purchaseOrderId)
    await applyPurchaseOrderData(purchaseOrder)
  }

  const onItemUpdated = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const next = { ...item, [field]: value }
      return mapItemTotals(next)
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

    const hydrated = article ?? await purchaseReceiptsRest.getArticleById(articleId)
    const articleLabel = hydrated
      ? `${hydrated.code ?? ''} - ${hydrated.name ?? ''}`.trim()
      : (selected?.text ?? articleId)

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

  return (<>
    <Table
      gridRef={gridRef}
      title='Recepciones de compra'
      rest={purchaseReceiptsRest}
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
            hint: 'Agregar recepción de compra',
            onClick: () => onModalOpen(null)
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', width: 80 },
        { dataField: 'code', caption: 'Código', width: 130 },
        { dataField: 'purchaseOrder.code', caption: 'OC', width: 130 },
        { dataField: 'issue_date', caption: 'F. emisión', width: 110, dataType: 'date' },
        { dataField: 'warehouse.name', caption: 'Almacén', minWidth: 130 },
        { dataField: 'supplier.business_name', caption: 'Proveedor', minWidth: 220 },
        { dataField: 'document_type', caption: 'Tipo doc', width: 110 },
        { dataField: 'document_series', caption: 'Serie', width: 90 },
        { dataField: 'document_sequence', caption: 'Secuencia', width: 110 },
        { dataField: 'payment_condition', caption: 'Pago', width: 100 },
        { dataField: 'receipt_status', caption: 'Estado', width: 110, lookup: toLookup(purchaseReceiptStatusOptions) },
        { dataField: 'currency', caption: 'Moneda', width: 90 },
        { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        {
          dataField: 'items.id',
          caption: 'Detalle',
          minWidth: 320,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            const lines = (data?.items ?? []).map(item => `${item?.article?.name || 'Artículo'} | Lote ${item?.lot || '-'} | Cant. ${Number(item?.quantity || 0).toFixed(2)} | ${data.currency} ${Number(item?.total || 0).toFixed(2)}`)
            ReactAppend(container, <div>
              {lines.length === 0 && <small className='text-muted'>Sin detalle</small>}
              {lines.map((line, idx) => <div key={`purchase-receipt-${data.id}-${idx}`}><small>{line}</small></div>)}
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
          width: 120,
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
              title: 'Eliminar recepción de compra',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar recepción de compra' : 'Agregar recepción de compra'} onSubmit={onModalSubmit} size='full-width'>
      <div className='row' id='purchase-receipt-form-container'>
        <input ref={idRef} type='hidden' />

        <SelectAPIFormGroup
          eRef={purchaseOrderRef}
          label='Orden de compra'
          col='col-md-3'
          searchAPI='/api/admin/purchase-orders/paginate'
          searchBy='code'
          dropdownParent='#purchase-receipt-form-container'
          onChange={onPurchaseOrderChanged}
        />
        <SelectAPIFormGroup
          eRef={businessRef}
          label='Empresa'
          col='col-md-3'
          required
          searchAPI='/api/admin/businesses/paginate'
          searchBy='name'
          dropdownParent='#purchase-receipt-form-container'
          onChange={onBusinessChanged}
        />
        <SelectFormGroup
          eRef={branchRef}
          label='Sede'
          col='col-md-3'
          dropdownParent='#purchase-receipt-form-container'
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          effectWith={[selectedBranchId, branches.length]}
        >
          <option value=''>-- Seleccione sede --</option>
          {branches.map(branch => <option key={`purchase-receipt-branch-${branch.id}`} value={branch.id}>{branch.name}</option>)}
        </SelectFormGroup>
        <SelectAPIFormGroup
          eRef={warehouseRef}
          label='Almacén'
          col='col-md-3'
          required
          searchAPI='/api/admin/warehouses/paginate'
          searchBy='name'
          dropdownParent='#purchase-receipt-form-container'
          onChange={(e) => setSelectedWarehouseId(e.target.value || '')}
        />
        <SelectAPIFormGroup
          eRef={supplierRef}
          label='Proveedor'
          col='col-md-3'
          required
          searchAPI='/api/admin/suppliers/paginate'
          searchBy='business_name'
          dropdownParent='#purchase-receipt-form-container'
          onChange={(e) => setSelectedSupplierId(e.target.value || '')}
        />
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Código</label>
          <input ref={codeRef} className='form-control' disabled />
        </div>
        <InputFormGroup eRef={issueDateRef} label='Fecha emisión' col='col-md-2' type='date' required />
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Estado recepción</label>
          <select ref={receiptStatusRef} className='form-control'>
            {purchaseReceiptStatusOptions.map((option) => (
              <option key={`purchase-receipt-status-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Tipo documento</label>
          <select ref={documentTypeRef} className='form-control'>
            <option value='Factura'>Factura</option>
            <option value='Boleta'>Boleta</option>
            <option value='Ticket'>Ticket</option>
            <option value='Otro'>Otro</option>
          </select>
        </div>
        <InputFormGroup eRef={documentSeriesRef} label='Serie' col='col-md-1' />
        <InputFormGroup eRef={documentSequenceRef} label='Secuencia' col='col-md-2' />
        <div className='form-group col-md-3 mb-2'>
          <label className='form-label'>Archivo documento</label>
          <input ref={documentFileRef} type='file' className='form-control' />
        </div>
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Moneda</label>
          <select ref={currencyRef} className='form-control'>
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
                        <SelectAPIFormGroup
                          eRef={getArticleRef(item.uid)}
                          col='col-12'
                          searchAPI='/api/admin/articles/paginate'
                          searchBy='name'
                          dropdownParent='#purchase-receipt-form-container'
                          onChange={(e) => onItemArticleChanged(item.uid, e)}
                        />
                      )}
                    </td>
                    <td><small>{`${item.article_laboratory || '-'} | ${item.article_principle || '-'}`}</small></td>
                    <td><small>{item.article_unit || '-'}</small></td>
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
