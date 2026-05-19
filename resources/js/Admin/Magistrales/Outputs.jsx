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
import OutputsRest from '../../Actions/Admin/Magistrales/OutputsRest';
import renderGridEditLink from '../../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../../Utils/magistralesRecordPdf';

const rest = new OutputsRest()

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  code: '',
  name: '',
  lot: '',
  expiration_date: '',
  stock: 0,
  unit_label: '',
  quantity: 1,
  total: 1,
})

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''

const Outputs = ({ moduleTitle = 'Magistrales - Salidas', fixedWarehouse = null }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const warehouseRef = useRef()
  const destinationRef = useRef()
  const reasonRef = useRef()
  const observationsRef = useRef()
  const dateRef = useRef()
  const [articles, setArticles] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [isEditing, setIsEditing] = useState(false)
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const fixedWarehouseLabel = [fixedWarehouse?.branch_name, fixedWarehouse?.name].filter(Boolean).join(' - ') || 'Almacen fijo de Magistrales'

  useEffect(() => {
    Promise.all([rest.getArticles()]).then(([articleRows]) => {
      setArticles((articleRows ?? []).filter(row => row.status !== null))
    })
  }, [])

  const openModal = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    warehouseRef.current.value = data?.origin_warehouse_id ?? fixedWarehouseId
    destinationRef.current.value = data?.destination ?? ''
    reasonRef.current.value = data?.reason ?? ''
    observationsRef.current.value = data?.observations ?? ''
    dateRef.current.value = data?.output_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    const nextItems = (data?.items ?? []).map(item => ({
      uid: crypto.randomUUID(),
      article_id: item.article_id ?? '',
      code: item.code ?? item.article?.code ?? '',
      name: item.name ?? item.article?.name ?? '',
      lot: item.lot ?? '',
      expiration_date: item.expiration_date?.toString?.().slice?.(0, 10) ?? '',
      stock: item.stock ?? 0,
      unit_label: item.unit_label ?? item.article?.unit?.symbol ?? item.article?.unit?.name ?? '',
      quantity: item.quantity ?? 1,
      total: item.total ?? item.quantity ?? 1,
    }))
    setItems(nextItems.length ? nextItems : [emptyItem()])
    $(modalRef.current).modal('show')
  }

  const updateItem = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const next = { ...item, [field]: value }
      if (field === 'article_id') {
        const article = articles.find(row => `${row.id}` === `${value}`)
        next.code = article?.code ?? ''
        next.name = article?.name ?? ''
        next.unit_label = article?.unit?.symbol ?? article?.unit?.name ?? ''
      }
      if (field === 'quantity') next.total = value
      return next
    }))
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
      origin_warehouse_id: warehouseRef.current.value || fixedWarehouseId || null,
      destination: destinationRef.current.value.trim(),
      reason: reasonRef.current.value.trim(),
      observations: observationsRef.current.value.trim(),
      output_date: dateRef.current.value || null,
      items: items.map(item => ({
        article_id: item.article_id || null,
        code: item.code,
        name: item.name,
        lot: (item.lot ?? '').toString().trim(),
        expiration_date: item.expiration_date || null,
        stock: item.stock,
        unit_label: item.unit_label,
        quantity: item.quantity,
        total: item.total,
      })),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar salida', text: 'Se dara de baja la salida magistral.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await rest.delete(id)
    if (result) $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={rest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => openModal() } })
      }}
      columns={[
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 145,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => openModal(data), 'Editar salida magistral')
        },
        { dataField: 'originWarehouse.name', caption: 'Almacen Origen', minWidth: 170 },
        { dataField: 'destination', caption: 'Destino', minWidth: 160 },
        { dataField: 'reason', caption: 'Motivo', minWidth: 160 },
        { dataField: 'observations', caption: 'Observacion', minWidth: 180 },
        { dataField: 'creator_label', caption: 'Usuario Registro', minWidth: 160, calculateCellValue: row => formatUser(row.creator) },
        { dataField: 'created_at', caption: 'Fecha Registro', dataType: 'date', width: 130 },
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
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.output(data)) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary ms-1', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => remove(data.id) }))
          }
        },
      ]}
    />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar salida magistral' : 'Registrar salida'} onSubmit={save} size='xl'>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' disabled={!isEditing} /></div>
        <input ref={warehouseRef} hidden />
        <div className='col-md-4 mb-3'><label className='form-label'>Almacen fijo</label><input className='form-control' value={fixedWarehouseLabel} disabled /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha</label><input ref={dateRef} type='date' className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>Destino</label><input ref={destinationRef} className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>Motivo</label><input ref={reasonRef} className='form-control' /></div>
        <div className='col-12 mb-2'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='2' /></div>

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Detalle de salida</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}><i className='mdi mdi-plus me-1'></i> Insertar articulo</button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th style={{ minWidth: 220 }}>Nombre</th>
                  <th style={{ width: 110 }}>Lote</th>
                  <th style={{ width: 145 }}>F. vencim.</th>
                  <th style={{ width: 110 }}>Stock</th>
                  <th style={{ width: 90 }}>Und</th>
                  <th style={{ width: 110 }}>Cantidad</th>
                  <th style={{ width: 110 }}>Total</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.uid}>
                    <td><select className='form-control form-control-sm' value={item.article_id} onChange={(e) => updateItem(item.uid, 'article_id', e.target.value)}><option value=''>Articulo</option>{articles.map(article => <option key={`output-article-${article.id}`} value={article.id}>{article.code} - {article.name}</option>)}</select></td>
                    <td><input className='form-control form-control-sm' value={item.lot} onChange={(e) => updateItem(item.uid, 'lot', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='date' value={item.expiration_date} onChange={(e) => updateItem(item.uid, 'expiration_date', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' step='0.001' value={item.stock} onChange={(e) => updateItem(item.uid, 'stock', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' value={item.unit_label} onChange={(e) => updateItem(item.uid, 'unit_label', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.total} onChange={(e) => updateItem(item.uid, 'total', e.target.value)} /></td>
                    <td><button type='button' className='btn btn-xs btn-soft-danger' onClick={() => removeItem(item.uid)}><i className='mdi mdi-delete'></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-outputs'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Salidas'}><Outputs {...properties} /></BaseAdminto>)
})
