import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import Table from '../../Components/Adminto/Table';
import Modal from '../../Components/Adminto/Modal';
import ReactAppend from '../../Utils/ReactAppend';
import DxButton from '../../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InventoryRest from '../../Actions/Admin/Magistrales/InventoryRest';
import renderGridEditLink from '../../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../../Utils/magistralesRecordPdf';

const rest = new InventoryRest()

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  lot: '',
  expiration_date: '',
  system_stock: 0,
  real_stock: 0,
})

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''

const Inventory = ({ moduleTitle = 'Magistrales - Inventario', fixedWarehouse = null }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const warehouseRef = useRef()
  const countDateRef = useRef()
  const observationsRef = useRef()
  const [articles, setArticles] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [isEditing, setIsEditing] = useState(false)
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const fixedWarehouseLabel = fixedWarehouse?.name || 'Almacen Magistrales'

  useEffect(() => {
    Promise.all([rest.getArticles()]).then(([articleRows]) => {
      setArticles((articleRows ?? []).filter(row => row.status !== null))
    })
  }, [])

  const openModal = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    warehouseRef.current.value = data?.warehouse_id ?? fixedWarehouseId
    countDateRef.current.value = data?.count_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    observationsRef.current.value = data?.observations ?? ''
    const nextItems = (data?.items ?? []).map(item => ({
      uid: crypto.randomUUID(),
      article_id: item.article_id ?? '',
      lot: item.lot ?? '',
      expiration_date: item.expiration_date?.toString?.().slice?.(0, 10) ?? '',
      system_stock: item.system_stock ?? 0,
      real_stock: item.real_stock ?? 0,
    }))
    setItems(nextItems.length ? nextItems : [emptyItem()])
    $(modalRef.current).modal('show')
  }

  const stockPayloadFor = (item) => ({
    article_id: item.article_id || null,
    warehouse_id: warehouseRef.current?.value || null,
    lot: (item.lot ?? '').toString().trim() || null,
    expiration_date: item.expiration_date || null,
  })

  const refreshItemStock = async (uid, override = {}) => {
    let target = null
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      target = { ...item, ...override }
      return target
    }))

    if (!target) return
    if (!target.article_id) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...item, system_stock: 0 } : item))
      return
    }

    const expectedPayload = stockPayloadFor(target)
    const systemStock = await rest.getStock(expectedPayload)
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const currentPayload = stockPayloadFor(item)
      const stillSameRequest = ['article_id', 'warehouse_id', 'lot', 'expiration_date']
        .every(field => `${currentPayload[field] ?? ''}` === `${expectedPayload[field] ?? ''}`)
      return stillSameRequest ? { ...item, system_stock: systemStock } : item
    }))
  }

  const refreshAllSystemStock = async () => {
    const nextItems = await Promise.all(items.map(async item => {
      if (!item.article_id) return { ...item, system_stock: 0 }
      const systemStock = await rest.getStock(stockPayloadFor(item))
      return { ...item, system_stock: systemStock }
    }))
    setItems(nextItems)
  }

  const updateItem = (uid, field, value) => {
    setItems(prev => prev.map(item => item.uid === uid ? { ...item, [field]: value } : item))
  }

  const removeItem = (uid) => {
    setItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyItem()]
    })
  }

  const save = async (e) => {
    e.preventDefault()
    const result = await rest.save({
      id: idRef.current.value || undefined,
      code: isEditing ? codeRef.current.value.trim() : '',
      warehouse_id: warehouseRef.current.value || fixedWarehouseId || null,
      count_date: countDateRef.current.value || null,
      observations: observationsRef.current.value.trim(),
      items: items.map(item => ({
        article_id: item.article_id || null,
        lot: (item.lot ?? '').toString().trim(),
        expiration_date: item.expiration_date || null,
        system_stock: item.system_stock,
        real_stock: item.real_stock,
      })),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar inventario', text: 'Se dara de baja el inventario magistral.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await rest.delete(id)
    if (result) $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const articleById = (id) => articles.find(article => `${article.id}` === `${id}`)

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={rest}
      pageSize={25}
      toolBar={(toolbarItems) => {
        toolbarItems.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        toolbarItems.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => openModal() } })
      }}
      columns={[
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 150,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => openModal(data), 'Editar inventario')
        },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 170 },
        { dataField: 'creator_label', caption: 'Usuario registro', minWidth: 160, calculateCellValue: row => formatUser(row.creator) },
        { dataField: 'created_at', caption: 'Fecha registro', dataType: 'date', width: 135 },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => rest.status(data).then(ok => ok && $(gridRef.current).dxDataGrid('instance').refresh())} />)
          }
        },
        {
          caption: 'Acciones',
          width: 160,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.inventory(data)) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary ms-1', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => remove(data.id) }))
          }
        },
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar inventario' : 'Registrar pedidos'} size='xl' onSubmit={save}>
      <div className='row'>
        <input ref={idRef} hidden />
        <input ref={warehouseRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' disabled={!isEditing} /></div>
        <div className='col-md-5 mb-3'><label className='form-label'>Almacen</label><input className='form-control' value={fixedWarehouseLabel} disabled /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Fecha inventario</label><input ref={countDateRef} type='date' className='form-control' /></div>
        <div className='col-12 mb-2'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='2' /></div>

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Detalle de inventario</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}><i className='mdi mdi-plus me-1'></i> Insertar articulo</button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th style={{ minWidth: 220 }}>Articulo</th>
                  <th style={{ width: 120 }}>Lote</th>
                  <th style={{ width: 145 }}>F. vencimiento</th>
                  <th style={{ minWidth: 120 }}>Sub-categoria</th>
                  <th style={{ width: 125 }}>Stock sistema</th>
                  <th style={{ width: 115 }}>Stock real</th>
                  <th style={{ width: 105 }}>Diferencia</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const article = articleById(item.article_id)
                  const difference = Number(item.real_stock || 0) - Number(item.system_stock || 0)
                  return <tr key={item.uid}>
                    <td><select className='form-control form-control-sm' value={item.article_id} onChange={(e) => refreshItemStock(item.uid, { article_id: e.target.value })}><option value=''>Articulo</option>{articles.map(article => <option key={`inv-article-${article.id}`} value={article.id}>{article.code} - {article.name}</option>)}</select></td>
                    <td><input className='form-control form-control-sm' value={item.lot} onChange={(e) => updateItem(item.uid, 'lot', e.target.value)} onBlur={() => refreshItemStock(item.uid)} /></td>
                    <td><input className='form-control form-control-sm' type='date' value={item.expiration_date} onChange={(e) => refreshItemStock(item.uid, { expiration_date: e.target.value })} /></td>
                    <td>{article?.sub_category ?? '-'}</td>
                    <td><input className='form-control form-control-sm' type='number' step='0.001' value={item.system_stock} disabled /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.real_stock} onChange={(e) => updateItem(item.uid, 'real_stock', e.target.value)} /></td>
                    <td>{difference.toFixed(3)}</td>
                    <td><button type='button' className='btn btn-xs btn-soft-danger' onClick={() => removeItem(item.uid)}><i className='mdi mdi-delete'></i></button></td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-inventory'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Inventario'}><Inventory {...properties} /></BaseAdminto>)
})
