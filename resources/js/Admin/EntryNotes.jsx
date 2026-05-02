import React, { createRef, useEffect, useRef, useState } from 'react';
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
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import EntryNotesRest from '../Actions/Admin/EntryNotesRest';
import { scopedPermission } from '../Utils/permissionScope';

const entryNotesRest = new EntryNotesRest()

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
  batch_id: '',
  batch_label: '',
  batch_code: '',
  lot: '',
  article_id: '',
  article_label: '',
  article_laboratory: '',
  article_principle: '',
  article_unit: '',
  warehouse_id: '',
  stock: 0,
  cost_unit: 0,
  location: '',
  quantity: 0,
  total: 0,
})

const EntryNotes = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const createBatchModalRef = useRef()

  const idRef = useRef()
  const businessRef = useRef()
  const branchRef = useRef()
  const warehouseRef = useRef()
  const supplierRef = useRef()
  const documentTypeRef = useRef()
  const documentSeriesRef = useRef()
  const documentSequenceRef = useRef()
  const documentFileRef = useRef()
  const currencyRef = useRef()
  const observationsRef = useRef()
  const guideSeriesRef = useRef()
  const guideSequenceRef = useRef()
  const guideRucRef = useRef()
  const guideFileRef = useRef()
  const batchRefs = useRef({})
  const createBatchArticleRef = useRef()
  const createBatchLotRef = useRef()
  const createBatchExpirationRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [createBatchTargetUid, setCreateBatchTargetUid] = useState('')
  const [createBatchArticleId, setCreateBatchArticleId] = useState('')

  const getBatchRef = (uid) => {
    if (!batchRefs.current[uid]) batchRefs.current[uid] = createRef()
    return batchRefs.current[uid]
  }

  useEffect(() => {
    items.forEach(item => {
      const ref = getBatchRef(item.uid)
      if (!ref.current || !item.batch_id || !item.batch_label) return
      const current = $(ref.current).val()
      if (`${current}` === `${item.batch_id}`) return
      SetSelectValue(ref.current, item.batch_id, item.batch_label)
    })
  }, [items])

  const loadWarehouses = async () => {
    const warehousesData = await entryNotesRest.getWarehouses()
    setWarehouses((warehousesData ?? []).filter(item => item.status !== null))
  }

  const loadBranches = async (businessId, preferredId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
      return
    }
    const data = await entryNotesRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return
    }
    setSelectedBranchId('')
  }

  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return ''
    return warehouses.find(warehouse => `${warehouse.id}` === `${warehouseId}`)?.name ?? ''
  }

  const refreshItemStock = async (uid, articleId, warehouseId) => {
    if (!uid) return
    if (!articleId || !warehouseId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...item, stock: 0 } : item))
      return
    }
    const stockData = await entryNotesRest.getCurrentStock(articleId, warehouseId)
    setItems(prev => prev.map(item => item.uid === uid ? { ...item, stock: Number(stockData?.stock || 0) } : item))
  }

  const refreshAllStocks = async (warehouseId, currentItems = null) => {
    const current = currentItems ? [...currentItems] : [...items]
    for (const item of current) {
      await refreshItemStock(item.uid, item.article_id, warehouseId || item.warehouse_id)
    }
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)

    idRef.current.value = data?.id ?? ''
    documentTypeRef.current.value = data?.document_type ?? 'Boleta'
    documentSeriesRef.current.value = data?.document_series ?? ''
    documentSequenceRef.current.value = data?.document_sequence ?? ''
    currencyRef.current.value = data?.currency ?? 'PEN'
    observationsRef.current.value = data?.observations ?? ''
    guideSeriesRef.current.value = data?.guide_series ?? ''
    guideSequenceRef.current.value = data?.guide_sequence ?? ''
    guideRucRef.current.value = data?.guide_ruc ?? ''
    if (documentFileRef.current) documentFileRef.current.value = ''
    if (guideFileRef.current) guideFileRef.current.value = ''

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

    const detail = (data?.items ?? []).map(row => ({
      uid: crypto.randomUUID(),
      batch_id: row.lot ?? row.batch_code ?? '',
      batch_label: row.lot ?? row.batch_code ?? '',
      batch_code: row.batch_code ?? '',
      lot: row.lot ?? '',
      article_id: row.article_id ? `${row.article_id}` : '',
      article_label: row.article ? `${row.article.code ?? ''} - ${row.article.name ?? ''}`.trim() : '',
      article_laboratory: row.article?.laboratory?.name ?? '',
      article_principle: row.article?.activePrinciple?.name ?? row.article?.active_principle?.name ?? '',
      article_unit: row.article?.unit?.symbol ?? row.article?.unit?.name ?? '',
      warehouse_id: row.warehouse_id ? `${row.warehouse_id}` : warehouseId,
      stock: row.stock ?? 0,
      cost_unit: row.cost_unit ?? 0,
      location: row.location ?? '',
      quantity: row.quantity ?? 0,
      total: row.total ?? 0,
    }))
    const loadedItems = detail.length ? detail : [emptyItem()]
    setItems(loadedItems)

    $(modalRef.current).modal('show')
    await loadWarehouses()
    await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
    await refreshAllStocks(warehouseId, loadedItems)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    if (idRef.current.value) formData.append('id', idRef.current.value)
    formData.append('business_id', selectedBusinessId || '')
    formData.append('business_branch_id', selectedBranchId || '')
    formData.append('warehouse_id', selectedWarehouseId || '')
    formData.append('supplier_id', selectedSupplierId || '')
    formData.append('document_type', documentTypeRef.current.value || 'Boleta')
    formData.append('document_series', documentSeriesRef.current.value || '')
    formData.append('document_sequence', documentSequenceRef.current.value || '')
    formData.append('currency', currencyRef.current.value || 'PEN')
    formData.append('observations', observationsRef.current.value || '')
    formData.append('guide_series', guideSeriesRef.current.value || '')
    formData.append('guide_sequence', guideSequenceRef.current.value || '')
    formData.append('guide_ruc', guideRucRef.current.value || '')
    formData.append('items', JSON.stringify(items.map(item => ({
      batch_code: (item.batch_code ?? '').toString().trim(),
      lot: (item.lot ?? '').toString().trim(),
      article_id: item.article_id || null,
      warehouse_id: item.warehouse_id || selectedWarehouseId || null,
      stock: item.stock,
      cost_unit: item.cost_unit,
      location: (item.location ?? '').toString().trim(),
      quantity: item.quantity,
      total: item.total,
      status: true,
    }))))

    const documentFile = documentFileRef.current?.files?.[0]
    if (documentFile) formData.append('document_file', documentFile)
    const guideFile = guideFileRef.current?.files?.[0]
    if (guideFile) formData.append('guide_file', guideFile)

    const result = await entryNotesRest.save(formData)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await entryNotesRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar nota de entrada',
      text: 'Estas seguro de eliminar esta nota de entrada? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await entryNotesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onBusinessChanged = async (e) => {
    const businessId = e.target.value || ''
    setSelectedBusinessId(businessId)
    await loadBranches(businessId, null)
  }

  const onWarehouseChanged = async (e) => {
    const warehouseId = e.target.value || ''
    setSelectedWarehouseId(warehouseId)
    const updatedItems = items.map(item => ({ ...item, warehouse_id: warehouseId }))
    setItems(updatedItems)
    if (!warehouseId) return
    await refreshAllStocks(warehouseId, updatedItems)
  }

  const onItemUpdated = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (`${item[field] ?? ''}` === `${value ?? ''}`) return item
      const next = { ...item, [field]: value }
      const quantity = Number(next.quantity || 0)
      const costUnit = Number(next.cost_unit || 0)
      next.total = Number.isFinite(quantity * costUnit) ? quantity * costUnit : 0
      return next
    }))
  }

  const onItemBatchChanged = async (uid, e) => {
    const selected = $(e.target).select2('data')?.[0]
    const batch = selected?.data ?? null
    const batchId = e.target.value || ''
    const currentItem = items.find(item => item.uid === uid)

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (!batchId) {
        return {
          ...item,
          batch_id: '',
          batch_label: '',
          batch_code: '',
          lot: '',
          article_id: '',
          article_label: '',
          article_laboratory: '',
          article_principle: '',
          article_unit: '',
          stock: 0,
        }
      }
      if (!batch) {
        return {
          ...item,
          batch_id: batchId,
          batch_label: selected?.text ?? batchId,
          batch_code: selected?.text ?? batchId,
          lot: selected?.text ?? batchId,
          warehouse_id: selectedWarehouseId || item.warehouse_id,
        }
      }

      const article = batch.article ?? null
      const nextArticleId = article?.id ? `${article.id}` : item.article_id
      return {
        ...item,
        batch_id: batchId,
        batch_label: selected?.text ?? batch.lot ?? item.batch_label,
        batch_code: batch.lot ?? item.batch_code,
        lot: batch.lot ?? item.lot,
        article_id: nextArticleId,
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : item.article_label,
        article_laboratory: article?.laboratory?.name ?? item.article_laboratory,
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? item.article_principle,
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? item.article_unit,
        warehouse_id: selectedWarehouseId || item.warehouse_id,
      }
    }))

    if (!batch && currentItem?.article_id && selectedWarehouseId) {
      await refreshItemStock(uid, currentItem.article_id, selectedWarehouseId)
    }

    if (batch?.article?.id && selectedWarehouseId) {
      await refreshItemStock(uid, batch.article.id, selectedWarehouseId)
    }
  }

  const onCreateBatchForItem = async (uid) => {
    if (!selectedBusinessId) {
      await Swal.fire({ icon: 'warning', title: 'Empresa requerida', text: 'Selecciona la empresa antes de crear un lote' })
      return
    }

    const currentItem = items.find(item => item.uid === uid)
    setCreateBatchTargetUid(uid)
    setCreateBatchArticleId(currentItem?.article_id || '')
    if (createBatchLotRef.current) createBatchLotRef.current.value = currentItem?.lot || ''
    if (createBatchExpirationRef.current) createBatchExpirationRef.current.value = ''
    if (currentItem?.article_id && currentItem?.article_label && createBatchArticleRef.current) {
      SetSelectValue(createBatchArticleRef.current, currentItem.article_id, currentItem.article_label)
    } else if (createBatchArticleRef.current) {
      $(createBatchArticleRef.current).empty().trigger('change')
    }
    $(createBatchModalRef.current).modal('show')
  }

  const onCreateBatchModalSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBusinessId) return

    const lot = (createBatchLotRef.current?.value ?? '').trim()
    const expiration = createBatchExpirationRef.current?.value ?? ''
    if (!createBatchArticleId || !lot || !expiration) return

    const createdBatch = await entryNotesRest.createBatch({
      business_id: selectedBusinessId,
      article_id: createBatchArticleId,
      lot,
      expiration_date: expiration,
    })
    if (!createdBatch?.id) return

    const selectedArticle = $(createBatchArticleRef.current).select2('data')?.[0] ?? null
    const hydratedBatch = await entryNotesRest.getBatchById(createdBatch.id)
    const batchData = hydratedBatch ?? createdBatch
    const articleData = batchData?.article ?? await entryNotesRest.getArticleById(createBatchArticleId)
    const selectedArticleText = selectedArticle?.text ?? ''

    const articleLabel = articleData
      ? [articleData.code, articleData.name].filter(Boolean).join(' - ')
      : selectedArticleText

    setItems(prev => prev.map(item => item.uid === createBatchTargetUid ? {
      ...item,
      batch_id: `${createdBatch.id}`,
      batch_label: batchData?.lot ?? createdBatch.lot ?? lot,
      batch_code: batchData?.lot ?? createdBatch.lot ?? lot,
      lot: batchData?.lot ?? createdBatch.lot ?? lot,
      article_id: `${createBatchArticleId}`,
      article_label: articleLabel || item.article_label,
      article_laboratory: articleData?.laboratory?.name ?? item.article_laboratory,
      article_principle: articleData?.activePrinciple?.name ?? articleData?.active_principle?.name ?? item.article_principle,
      article_unit: articleData?.unit?.symbol ?? articleData?.unit?.name ?? item.article_unit,
      warehouse_id: selectedWarehouseId || item.warehouse_id,
    } : item))

    if (selectedWarehouseId) {
      await refreshItemStock(createBatchTargetUid, createBatchArticleId, selectedWarehouseId)
    }

    $(createBatchModalRef.current).modal('hide')
  }

  const onItemAdded = () => setItems(prev => [...prev, { ...emptyItem(), warehouse_id: selectedWarehouseId || '' }])
  const onItemRemoved = (uid) => {
    setItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyItem()]
    })
  }

  return (<>
    <Table
      gridRef={gridRef}
      title='Notas de entrada'
      rest={entryNotesRest}
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
            hint: 'Agregar nota de entrada',
            onClick: () => onModalOpen(null)
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', visible: false },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 150 },
        { dataField: 'branch.name', caption: 'Sede', minWidth: 140 },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 140 },
        { dataField: 'supplier.business_name', caption: 'Proveedor', minWidth: 200 },
        { dataField: 'document_type', caption: 'Tipo doc', width: 110 },
        { dataField: 'document_series', caption: 'Serie', width: 90 },
        { dataField: 'document_sequence', caption: 'Secuencia', width: 110 },
        { dataField: 'currency', caption: 'Moneda', width: 90 },
        {
          dataField: 'items.id',
          caption: 'Detalle',
          minWidth: 240,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            const lines = (data?.items ?? []).map(item => {
              const article = item?.article
              const label = [item?.lot || '-', article?.name || 'Articulo'].join(' - ')
              return `${label} | Cant. ${Number(item?.quantity || 0).toFixed(2)} | S/. ${Number(item?.total || 0).toFixed(2)}`
            })
            ReactAppend(container, <div>
              {lines.length === 0 && <small className='text-muted'>Sin detalle</small>}
              {lines.map((line, idx) => <div key={`entry-note-${data.id}-item-${idx}`}><small>{line}</small></div>)}
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
          caption: 'Estado',
          dataType: 'boolean',
          width: '95px',
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
          width: '120px',
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
              title: 'Eliminar nota de entrada',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar nota de entrada' : 'Agregar nota de entrada'} onSubmit={onModalSubmit} size='full-width'>
      <div className='row' id='entry-note-form-container'>
        <input ref={idRef} type='hidden' />

        <SelectAPIFormGroup
          eRef={businessRef}
          label='Empresa'
          col='col-md-3'
          required
          searchAPI='/api/admin/businesses/paginate'
          searchBy='name'
          dropdownParent='#entry-note-form-container'
          onChange={onBusinessChanged}
        />
        <SelectFormGroup
          eRef={branchRef}
          label='Sede'
          col='col-md-3'
          dropdownParent='#entry-note-form-container'
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          effectWith={[selectedBranchId, branches.length]}
        >
          <option value=''>-- Seleccione sede --</option>
          {branches.map(branch => <option key={`branch-${branch.id}`} value={branch.id}>{branch.name}</option>)}
        </SelectFormGroup>
        <SelectAPIFormGroup
          eRef={warehouseRef}
          label='Almacen'
          col='col-md-3'
          required
          searchAPI='/api/admin/warehouses/paginate'
          searchBy='name'
          dropdownParent='#entry-note-form-container'
          onChange={onWarehouseChanged}
        />
        <SelectAPIFormGroup
          eRef={supplierRef}
          label='Proveedor'
          col='col-md-3'
          searchAPI='/api/admin/suppliers/paginate'
          searchBy='business_name'
          dropdownParent='#entry-note-form-container'
          onChange={(e) => setSelectedSupplierId(e.target.value || '')}
        />

        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Tipo documento</label>
          <select ref={documentTypeRef} className='form-control'>
            <option value='Boleta'>Boleta</option>
            <option value='Factura'>Factura</option>
            <option value='Ticket'>Ticket</option>
            <option value='Otro'>Otro</option>
          </select>
        </div>
        <InputFormGroup eRef={documentSeriesRef} label='Serie' col='col-md-2' />
        <InputFormGroup eRef={documentSequenceRef} label='Secuencia' col='col-md-2' />
        <div className='form-group col-md-3 mb-2'>
          <label className='form-label'>Archivo</label>
          <input ref={documentFileRef} type='file' className='form-control' />
        </div>
        <div className='form-group col-md-3 mb-2'>
          <label className='form-label'>Moneda</label>
          <select ref={currencyRef} className='form-control'>
            <option value='PEN'>PEN</option>
            <option value='USD'>USD</option>
            <option value='EUR'>EUR</option>
          </select>
        </div>

        <TextareaFormGroup eRef={observationsRef} label='Observaciones' col='col-12' rows={2} />

        <h6 className='mt-3 mb-2'>Guia de remision</h6>
        <InputFormGroup eRef={guideSeriesRef} label='Serie' col='col-md-2' />
        <InputFormGroup eRef={guideSequenceRef} label='Secuencia' col='col-md-2' />
        <InputFormGroup eRef={guideRucRef} label='RUC' col='col-md-2' />
        <div className='form-group col-md-6 mb-2'>
          <label className='form-label'>Archivo</label>
          <input ref={guideFileRef} type='file' className='form-control' />
        </div>

        <div className='col-12 mt-3'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Nota de entrada</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={onItemAdded}>
              <i className='mdi mdi-plus me-1'></i> Agregar linea
            </button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>Codigo Lote</th>
                  <th>Lote</th>
                  <th>Articulo</th>
                  <th>Laboratorio | Principio activo</th>
                  <th>Unidad</th>
                  <th>Stock</th>
                  <th>Almacen</th>
                  <th>P. Costo Unit.</th>
                  <th>Ubicacion</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const articleExtra = item.article_id ? `${item.article_laboratory || '-'} | ${item.article_principle || '-'}` : '-'
                  const unitLabel = item.article_id ? (item.article_unit || '-') : '-'
                  const batchFilter = selectedBusinessId
                    ? ['business_id', '=', Number(selectedBusinessId)]
                    : null
                  return (
                    <tr key={item.uid}>
                      <td style={{ width: '20%' }}>
                        <div className='d-flex gap-1 align-items-center'>
                          <div style={{ flex: 1 }}>
                            <SelectAPIFormGroup
                              eRef={getBatchRef(item.uid)}
                              col='col-12'
                              searchAPI='/api/admin/batches/paginate'
                              searchBy='lot'
                              filter={batchFilter ?? undefined}
                              dropdownParent='#entry-note-form-container'
                              onChange={(e) => onItemBatchChanged(item.uid, e)}
                            />
                          </div>
                          <button type='button' className='btn btn-xs btn-soft-success' title='Crear lote' onClick={() => onCreateBatchForItem(item.uid)}>
                            <i className='mdi mdi-plus'></i>
                          </button>
                        </div>
                      </td>
                      <td><input className='form-control form-control-sm' value={item.lot} readOnly /></td>
                      <td><input className='form-control form-control-sm' value={item.article_label} readOnly /></td>
                      <td><small>{articleExtra}</small></td>
                      <td><small>{unitLabel}</small></td>
                      <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={Number(item.stock || 0).toFixed(3)} readOnly /></td>
                      <td><input className='form-control form-control-sm' value={getWarehouseName(item.warehouse_id || selectedWarehouseId)} readOnly /></td>
                      <td><input className='form-control form-control-sm' type='number' min='0' step='0.0001' value={item.cost_unit} onChange={(e) => onItemUpdated(item.uid, 'cost_unit', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' value={item.location} onChange={(e) => onItemUpdated(item.uid, 'location', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => onItemUpdated(item.uid, 'quantity', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' type='number' value={Number(item.total || 0).toFixed(2)} readOnly /></td>
                      <td>
                        <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onItemRemoved(item.uid)}>
                          <i className='mdi mdi-delete'></i>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>

    <Modal modalRef={createBatchModalRef} title='Crear lote' onSubmit={onCreateBatchModalSubmit} size='md'>
      <div className='row' id='entry-note-create-batch-container'>
        <SelectAPIFormGroup
          eRef={createBatchArticleRef}
          label='Articulo'
          col='col-12'
          required
          searchAPI='/api/admin/articles/paginate'
          searchBy='name'
          dropdownParent='#entry-note-create-batch-container'
          onChange={(e) => setCreateBatchArticleId(e.target.value || '')}
        />
        <InputFormGroup eRef={createBatchLotRef} label='Lote' col='col-12' required />
        <InputFormGroup eRef={createBatchExpirationRef} label='Fecha de vencimiento' col='col-12' type='date' required />
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can(scopedPermission('entry-note')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Notas de entrada'>
    <EntryNotes {...properties} />
  </BaseAdminto>);
})
