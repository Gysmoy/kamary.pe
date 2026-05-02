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
import ExitNotesRest from '../Actions/Admin/ExitNotesRest';
import { scopedPermission } from '../Utils/permissionScope';

const exitNotesRest = new ExitNotesRest()

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
  article_id: '',
  article_label: '',
  article_laboratory: '',
  article_principle: '',
  article_unit: '',
  warehouse_id: '',
  stock: 0,
  expiration_date: '',
  location: '',
  destination_location: '',
  quantity: 0,
  total: 0,
})

const ExitNotes = () => {
  const gridRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const businessRef = useRef()
  const branchRef = useRef()
  const warehouseRef = useRef()
  const clientNameRef = useRef()
  const observationsRef = useRef()
  const motiveInputRef = useRef()
  const articleRefs = useRef({})
  const batchRefs = useRef({})

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [motives, setMotives] = useState([])

  const getArticleRef = (uid) => {
    if (!articleRefs.current[uid]) articleRefs.current[uid] = createRef()
    return articleRefs.current[uid]
  }

  const getBatchRef = (uid) => {
    if (!batchRefs.current[uid]) batchRefs.current[uid] = createRef()
    return batchRefs.current[uid]
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
    const warehousesData = await exitNotesRest.getWarehouses()
    setWarehouses((warehousesData ?? []).filter(item => item.status !== null))
  }

  const loadBranches = async (businessId, preferredId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
      return
    }
    const data = await exitNotesRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return
    }
    setSelectedBranchId('')
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)

    idRef.current.value = data?.id ?? ''
    clientNameRef.current.value = data?.client_name ?? ''
    observationsRef.current.value = data?.observations ?? ''
    setMotives(Array.isArray(data?.motives) ? data.motives : [])

    const businessId = data?.business_id ? `${data.business_id}` : ''
    const warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : ''
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)

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

    const detail = (data?.items ?? []).map(row => ({
      uid: crypto.randomUUID(),
      batch_id: row.batch_code ?? '',
      batch_label: row.batch_code ?? '',
      batch_code: row.batch_code ?? '',
      article_id: row.article_id ? `${row.article_id}` : '',
      article_label: row.article ? `${row.article.code ?? ''} - ${row.article.name ?? ''}`.trim() : '',
      article_laboratory: row.article?.laboratory?.name ?? '',
      article_principle: row.article?.activePrinciple?.name ?? row.article?.active_principle?.name ?? '',
      article_unit: row.article?.unit?.symbol ?? row.article?.unit?.name ?? '',
      warehouse_id: row.warehouse_id ? `${row.warehouse_id}` : '',
      stock: row.stock ?? 0,
      expiration_date: row.expiration_date ? row.expiration_date.toString().slice(0, 10) : '',
      location: row.location ?? '',
      destination_location: row.destination_location ?? '',
      quantity: row.quantity ?? 0,
      total: row.total ?? 0,
    }))
    setItems(detail.length ? detail : [emptyItem()])

    $(modalRef.current).modal('show')
    await loadWarehouses()
    await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()
    const request = {
      id: idRef.current.value || undefined,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      client_name: (clientNameRef.current.value ?? '').trim(),
      motives,
      observations: (observationsRef.current.value ?? '').trim(),
      items: items.map(item => ({
        batch_code: (item.batch_code ?? '').toString().trim(),
        article_id: item.article_id || null,
        warehouse_id: item.warehouse_id || selectedWarehouseId || null,
        stock: item.stock,
        expiration_date: item.expiration_date || null,
        location: (item.location ?? '').toString().trim(),
        destination_location: (item.destination_location ?? '').toString().trim(),
        quantity: item.quantity,
        total: item.total,
        status: true,
      }))
    }

    const result = await exitNotesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await exitNotesRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar nota de salida',
      text: 'Estas seguro de eliminar esta nota de salida? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await exitNotesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onBusinessChanged = async (e) => {
    const businessId = e.target.value || ''
    setSelectedBusinessId(businessId)
    await loadBranches(businessId, null)
  }

  const addMotive = () => {
    const value = (motiveInputRef.current?.value ?? '').trim()
    if (!value) return
    setMotives(prev => [...prev, value])
    motiveInputRef.current.value = ''
  }

  const removeMotive = (index) => setMotives(prev => prev.filter((_, i) => i !== index))

  const onItemUpdated = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (`${item[field] ?? ''}` === `${value ?? ''}`) return item
      const next = { ...item, [field]: value }
      const quantity = Number(next.quantity || 0)
      const total = Number(next.total || 0)
      next.total = Number.isFinite(total) ? total : quantity
      return next
    }))
  }

  const onItemBatchChanged = (uid, e) => {
    const selected = $(e.target).select2('data')?.[0]
    const batch = selected?.data ?? null
    const batchId = e.target.value || ''

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (!batchId) {
        return {
          ...item,
          batch_id: '',
          batch_label: '',
          batch_code: '',
          expiration_date: '',
          article_id: '',
          article_label: '',
          article_laboratory: '',
          article_principle: '',
          article_unit: '',
        }
      }
      if (!batch) {
        return {
          ...item,
          batch_id: batchId,
          batch_label: selected?.text ?? batchId,
          batch_code: selected?.text ?? batchId,
        }
      }

      const article = batch.article ?? null
      const nextArticleId = article?.id ? `${article.id}` : item.article_id
      return {
        ...item,
        batch_id: batchId,
        batch_label: selected?.text ?? batch.lot ?? item.batch_label,
        batch_code: batch.lot ?? item.batch_code,
        expiration_date: batch.expiration_date ? batch.expiration_date.toString().slice(0, 10) : item.expiration_date,
        article_id: nextArticleId,
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : item.article_label,
        article_laboratory: article?.laboratory?.name ?? item.article_laboratory,
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? item.article_principle,
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? item.article_unit,
      }
    }))
  }

  const onItemArticleChanged = (uid, e) => {
    const selected = $(e.target).select2('data')?.[0]
    const article = selected?.data ?? null
    const articleId = e.target.value || ''
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (!articleId) {
        return {
          ...item,
          batch_id: '',
          batch_label: '',
          article_id: '',
          article_label: '',
          article_laboratory: '',
          article_principle: '',
          article_unit: '',
        }
      }
      return {
        ...item,
        batch_id: item.article_id && item.article_id !== articleId ? '' : item.batch_id,
        batch_label: item.article_id && item.article_id !== articleId ? '' : item.batch_label,
        article_id: articleId,
        article_label: selected?.text ?? item.article_label,
        article_laboratory: article?.laboratory?.name ?? item.article_laboratory,
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? item.article_principle,
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? item.article_unit,
      }
    }))
  }

  const onCreateBatchForItem = async (uid) => {
    const currentItem = items.find(item => item.uid === uid)
    if (!selectedBusinessId) {
      await Swal.fire({ icon: 'warning', title: 'Empresa requerida', text: 'Selecciona la empresa antes de crear un lote' })
      return
    }
    if (!currentItem?.article_id) {
      await Swal.fire({ icon: 'warning', title: 'Articulo requerido', text: 'Selecciona un articulo antes de crear un lote' })
      return
    }

    const { value: formValues } = await Swal.fire({
      title: 'Crear lote',
      html: `
        <input id="swal-exit-batch-lot" class="swal2-input" placeholder="Lote" />
        <input id="swal-exit-batch-exp" type="date" class="swal2-input" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const lot = document.getElementById('swal-exit-batch-lot')?.value?.trim() || ''
        const expiration = document.getElementById('swal-exit-batch-exp')?.value || ''
        if (!lot) {
          Swal.showValidationMessage('El lote es obligatorio')
          return null
        }
        if (!expiration) {
          Swal.showValidationMessage('La fecha de vencimiento es obligatoria')
          return null
        }
        return { lot, expiration }
      }
    })

    if (!formValues) return

    const createdBatch = await exitNotesRest.createBatch({
      business_id: selectedBusinessId,
      article_id: currentItem.article_id,
      lot: formValues.lot,
      expiration_date: formValues.expiration,
    })
    if (!createdBatch?.id) return

    setItems(prev => prev.map(item => item.uid === uid ? {
      ...item,
      batch_id: `${createdBatch.id}`,
      batch_label: createdBatch.lot ?? formValues.lot,
      batch_code: createdBatch.lot ?? formValues.lot,
      expiration_date: createdBatch.expiration_date ? createdBatch.expiration_date.toString().slice(0, 10) : formValues.expiration,
    } : item))
  }

  const onItemAdded = () => setItems(prev => [...prev, emptyItem()])
  const onItemRemoved = (uid) => {
    setItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyItem()]
    })
  }

  return (<>
    <Table
      gridRef={gridRef}
      title='Notas de salida'
      rest={exitNotesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: { icon: 'refresh', hint: 'Refrescar tabla', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() }
        });
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: { icon: 'add', title: 'Agregar', hint: 'Agregar nota de salida', onClick: () => onModalOpen(null) }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', visible: false },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 150 },
        { dataField: 'branch.name', caption: 'Sede', minWidth: 140 },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 140 },
        { dataField: 'client_name', caption: 'Cliente', minWidth: 180 },
        { dataField: 'motives', caption: 'Motivos', minWidth: 220, cellTemplate: (container, { data }) => container.text((data?.motives ?? []).join(', ')) },
        {
          dataField: 'items.id', caption: 'Detalle', minWidth: 240, allowFiltering: false,
          cellTemplate: (container, { data }) => {
            const lines = (data?.items ?? []).map(item => `${item?.article?.name || 'Articulo'} | Cant. ${Number(item?.quantity || 0).toFixed(2)} | Total ${Number(item?.total || 0).toFixed(2)}`)
            ReactAppend(container, <div>
              {lines.length === 0 && <small className='text-muted'>Sin detalle</small>}
              {lines.map((line, idx) => <div key={`exit-note-${data.id}-${idx}`}><small>{line}</small></div>)}
            </div>)
          }
        },
        { dataField: 'creator.fullname', caption: 'Creado por', visible: false, cellTemplate: (c, { data }) => c.text(formatAuditUser(data.creator)) },
        { dataField: 'updater.fullname', caption: 'Actualizado por', visible: false, cellTemplate: (c, { data }) => c.text(formatAuditUser(data.updater)) },
        {
          dataField: 'status', caption: 'Estado', dataType: 'boolean', width: '95px',
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({ id: data.id, field: 'status', value: !data.status })} />)
          }
        },
        {
          caption: 'Acciones', width: '120px',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Eliminar nota de salida', icon: 'mdi mdi-delete', onClick: () => onDeleteClicked(data.id) }))
          },
          allowFiltering: false, allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar nota de salida' : 'Agregar nota de salida'} onSubmit={onModalSubmit} size='full-width'>
      <div className='row' id='exit-note-form-container'>
        <input ref={idRef} type='hidden' />

        <SelectAPIFormGroup eRef={businessRef} label='Empresa' col='col-md-3' required searchAPI='/api/admin/businesses/paginate' searchBy='name' dropdownParent='#exit-note-form-container' onChange={onBusinessChanged} />
        <SelectFormGroup eRef={branchRef} label='Sede' col='col-md-3' dropdownParent='#exit-note-form-container' value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} effectWith={[selectedBranchId, branches.length]}>
          <option value=''>-- Seleccionar sede --</option>
          {branches.map(branch => <option key={`exit-branch-${branch.id}`} value={branch.id}>{branch.name}</option>)}
        </SelectFormGroup>
        <SelectAPIFormGroup eRef={warehouseRef} label='Almacen' col='col-md-3' required searchAPI='/api/admin/warehouses/paginate' searchBy='name' dropdownParent='#exit-note-form-container' onChange={(e) => setSelectedWarehouseId(e.target.value || '')} />
        <InputFormGroup eRef={clientNameRef} label='Cliente' col='col-md-3' />

        <div className='form-group col-md-8 mb-2'>
          <label className='form-label'>Motivos</label>
          <div className='d-flex gap-2'>
            <input ref={motiveInputRef} className='form-control' placeholder='Escribe un motivo y pulsa agregar' />
            <button type='button' className='btn btn-primary' onClick={addMotive}>Agregar</button>
          </div>
          <div className='d-flex flex-wrap gap-1 mt-2'>
            {motives.map((motive, idx) => (
              <span key={`motive-${idx}`} className='badge bg-soft-secondary text-dark'>
                {motive}
                <button type='button' className='btn btn-link btn-xs p-0 ms-1 text-danger' onClick={() => removeMotive(idx)}>x</button>
              </span>
            ))}
          </div>
        </div>
        <TextareaFormGroup eRef={observationsRef} label='Observaciones' col='col-md-4' rows={3} />

        <div className='col-12 mt-3'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Nota de Salida</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={onItemAdded}>
              <i className='mdi mdi-plus me-1'></i> Agregar linea
            </button>
          </div>

          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>Lote registrado</th>
                  <th>Nombre</th>
                  <th>Laboratorio | Principio activo</th>
                  <th>Unidad</th>
                  <th>Stock</th>
                  <th>Almacen</th>
                  <th>Fecha Vencimiento</th>
                  <th>Ubicacion</th>
                  <th>Ubi. Destino</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const articleExtra = item.article_id ? `${item.article_laboratory || '-'} | ${item.article_principle || '-'}` : '-'
                  const unitLabel = item.article_id ? (item.article_unit || '-') : '-'
                  let batchFilter = null
                  if (selectedBusinessId && item.article_id) {
                    batchFilter = [['business_id', '=', Number(selectedBusinessId)], 'and', ['article_id', '=', Number(item.article_id)]]
                  } else if (selectedBusinessId) {
                    batchFilter = ['business_id', '=', Number(selectedBusinessId)]
                  } else if (item.article_id) {
                    batchFilter = ['article_id', '=', Number(item.article_id)]
                  }
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
                              dropdownParent='#exit-note-form-container'
                              onChange={(e) => onItemBatchChanged(item.uid, e)}
                            />
                          </div>
                          <button type='button' className='btn btn-xs btn-soft-success' title='Crear lote' onClick={() => onCreateBatchForItem(item.uid)}>
                            <i className='mdi mdi-plus'></i>
                          </button>
                        </div>
                      </td>
                      <td style={{width: '20%'}}>
                        <SelectAPIFormGroup
                          eRef={getArticleRef(item.uid)}
                          col='col-12'
                          searchAPI='/api/admin/articles/paginate'
                          searchBy='name'
                          dropdownParent='#exit-note-form-container'
                          onChange={(e) => onItemArticleChanged(item.uid, e)}
                        />
                      </td>
                      <td><small>{articleExtra}</small></td>
                      <td><small>{unitLabel}</small></td>
                      <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.stock} onChange={(e) => onItemUpdated(item.uid, 'stock', e.target.value)} /></td>
                      <td>
                        <select className='form-control form-control-sm' value={item.warehouse_id || selectedWarehouseId || ''} onChange={(e) => onItemUpdated(item.uid, 'warehouse_id', e.target.value)}>
                          <option value=''>Seleccionar...</option>
                          {warehouses.map(warehouse => <option key={`exit-warehouse-item-${item.uid}-${warehouse.id}`} value={warehouse.id}>{warehouse.name}</option>)}
                        </select>
                      </td>
                      <td><input className='form-control form-control-sm' type='date' value={item.expiration_date} onChange={(e) => onItemUpdated(item.uid, 'expiration_date', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' value={item.location} onChange={(e) => onItemUpdated(item.uid, 'location', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' value={item.destination_location} onChange={(e) => onItemUpdated(item.uid, 'destination_location', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => onItemUpdated(item.uid, 'quantity', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' type='number' value={Number(item.total || 0).toFixed(2)} onChange={(e) => onItemUpdated(item.uid, 'total', e.target.value)} /></td>
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
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can(scopedPermission('exit-note')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Notas de salida'>
    <ExitNotes {...properties} />
  </BaseAdminto>);
})
