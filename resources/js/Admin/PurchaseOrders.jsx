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
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import {
  approvalStatusOptions,
  purchaseOrderStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const purchaseOrdersRest = new PurchaseOrdersRest()

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
  article_id: '',
  article_label: '',
  article_unit: '',
  article_laboratory: '',
  article_principle: '',
  requested_quantity: 1,
  received_quantity: 0,
  price_unit: 0,
  total: 0,
})

const PurchaseOrders = ({ moduleTitle = 'Ordenes de compra', moduleScope }) => {
  const isMagistrales = moduleScope === 'magistrales'
  const gridRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const businessRef = useRef()
  const branchRef = useRef()
  const warehouseRef = useRef()
  const supplierRef = useRef()
  const buyerNameRef = useRef()
  const issueDateRef = useRef()
  const expectedDateRef = useRef()
  const currencyRef = useRef()
  const paymentConditionRef = useRef()
  const orderStatusRef = useRef()
  const approvalStatusRef = useRef()
  const taxAmountRef = useRef()
  const observationsRef = useRef()
  const articleRefs = useRef({})

  const [isEditing, setIsEditing] = useState(false)
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
    const data = await purchaseOrdersRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return
    }
    setSelectedBranchId('')
  }

  const mapItemTotals = (item) => {
    const quantity = Number(item.requested_quantity || 0)
    const price = Number(item.price_unit || 0)
    return {
      ...item,
      total: Number.isFinite(quantity * price) ? (quantity * price) : 0,
    }
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)

    setRefValue(idRef, data?.id ?? '')
    setRefValue(codeRef, data?.code ?? 'Se genera al guardar')
    setRefValue(issueDateRef, data?.issue_date ? data.issue_date.toString().slice(0, 10) : new Date().toISOString().slice(0, 10))
    setRefValue(expectedDateRef, data?.expected_date ? data.expected_date.toString().slice(0, 10) : '')
    setRefValue(currencyRef, data?.currency ?? 'PEN')
    setRefValue(paymentConditionRef, data?.payment_condition ?? 'Contado')
    setRefValue(buyerNameRef, data?.buyer_name ?? '')
    setRefValue(orderStatusRef, data?.order_status ?? 'draft')
    setRefValue(approvalStatusRef, data?.approval_status ?? 'pending')
    setTaxAmount(Number(data?.tax_amount ?? 0))
    setRefValue(taxAmountRef, Number(data?.tax_amount ?? 0))
    setRefValue(observationsRef, data?.observations ?? '')

    const businessId = data?.business_id ? `${data.business_id}` : ''
    const warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : ''
    const supplierId = data?.supplier_id ? `${data.supplier_id}` : ''
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)
    setSelectedSupplierId(supplierId)

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

    const detail = (data?.items ?? []).map(row => {
      const article = row.article ?? null
      return mapItemTotals({
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
      })
    })
    setItems(detail.length ? detail : [emptyItem()])

    $(modalRef.current).modal('show')
    await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: getRefValue(idRef) || undefined,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      supplier_id: selectedSupplierId || null,
      buyer_name: getRefValue(buyerNameRef).trim(),
      issue_date: getRefValue(issueDateRef),
      expected_date: getRefValue(expectedDateRef) || null,
      currency: getRefValue(currencyRef) || 'PEN',
      payment_condition: getRefValue(paymentConditionRef) || 'Contado',
      order_status: getRefValue(orderStatusRef) || 'draft',
      approval_status: getRefValue(approvalStatusRef) || 'pending',
      tax_amount: Number(getRefValue(taxAmountRef) || 0),
      observations: getRefValue(observationsRef).trim(),
      items: items.map(item => ({
        article_id: item.article_id || null,
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

    const hydrated = article ?? await purchaseOrdersRest.getArticleById(articleId)
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

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + Number(item.total || 0), 0), [items])
  const grandTotal = useMemo(() => subtotal + Number(taxAmount || 0), [subtotal, taxAmount])

  return (<>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={purchaseOrdersRest}
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
        { dataField: 'code', caption: 'Código', width: 130 },
        { dataField: 'issue_date', caption: 'F. emisión', width: 110, dataType: 'date' },
        { dataField: 'expected_date', caption: 'F. esperada', width: 115, dataType: 'date' },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 140 },
        { dataField: 'branch.name', caption: 'Sede', minWidth: 130 },
        { dataField: 'warehouse.name', caption: 'Almacén', minWidth: 130 },
        { dataField: 'supplier.business_name', caption: 'Proveedor', minWidth: 220 },
        ...(isMagistrales ? [{ dataField: 'buyer_name', caption: 'Comprador', minWidth: 150 }] : []),
        { dataField: 'payment_condition', caption: 'Pago', width: 100 },
        { dataField: 'approval_status', caption: 'Aprobación', width: 110, lookup: toLookup(approvalStatusOptions) },
        { dataField: 'order_status', caption: 'Estado OC', width: 110, lookup: toLookup(purchaseOrderStatusOptions) },
        { dataField: 'currency', caption: 'Moneda', width: 90 },
        { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        {
          dataField: 'items.id',
          caption: 'Detalle',
          minWidth: 280,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            const lines = (data?.items ?? []).map(item => `${item?.article?.name || 'Artículo'} | Cant. ${Number(item?.requested_quantity || 0).toFixed(2)} | ${data.currency} ${Number(item?.total || 0).toFixed(2)}`)
            ReactAppend(container, <div>
              {lines.length === 0 && <small className='text-muted'>Sin detalle</small>}
              {lines.map((line, idx) => <div key={`purchase-order-${data.id}-${idx}`}><small>{line}</small></div>)}
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
          width: isMagistrales ? 160 : 120,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            if (isMagistrales) {
              container.append(DxButton({
                className: 'btn btn-xs btn-soft-danger',
                title: 'Imprimir PDF',
                icon: 'mdi mdi-file-pdf-box',
                onClick: () => openMagistralesRecordPdf(buildMagistralesRows.purchaseOrder(data))
              }))
            }
            container.append(DxButton({
              className: `btn btn-xs btn-soft-primary${isMagistrales ? ' ms-1' : ''}`,
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
        <SelectAPIFormGroup
          eRef={supplierRef}
          label='Proveedor'
          col='col-md-3'
          required
          searchAPI={purchaseOrdersRest.suppliersPaginateApi()}
          searchBy='business_name'
          dropdownParent='#purchase-order-form-container'
          onChange={(e) => setSelectedSupplierId(e.target.value || '')}
        />
        {isMagistrales && <InputFormGroup eRef={buyerNameRef} label='Comprador' col='col-md-3' />}

        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Código</label>
          <input ref={codeRef} className='form-control' disabled />
        </div>
        <InputFormGroup eRef={issueDateRef} label='Fecha emisión' col='col-md-2' type='date' required />
        <InputFormGroup eRef={expectedDateRef} label='Fecha esperada' col='col-md-2' type='date' />
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

        <div className='col-12 mt-3'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Items</h6>
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
                  <th>Cant. solicitada</th>
                  <th>P. Unit.</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.uid}>
                    <td style={{ width: '24%' }}>
                      <SelectAPIFormGroup
                        eRef={getArticleRef(item.uid)}
                        col='col-12'
                        searchAPI={purchaseOrdersRest.articlesPaginateApi()}
                        searchBy='name'
                        dropdownParent='#purchase-order-form-container'
                        onChange={(e) => onItemArticleChanged(item.uid, e)}
                      />
                    </td>
                    <td><small>{`${item.article_laboratory || '-'} | ${item.article_principle || '-'}`}</small></td>
                    <td><small>{item.article_unit || '-'}</small></td>
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
