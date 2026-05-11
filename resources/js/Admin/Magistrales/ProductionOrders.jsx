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
import ProductionOrdersRest from '../../Actions/Admin/Magistrales/ProductionOrdersRest';
import renderGridEditLink from '../../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../../Utils/magistralesRecordPdf';

const rest = new ProductionOrdersRest()
const statusLabels = { pending: 'Pendiente', in_process: 'En proceso', finished: 'Finalizado', cancelled: 'Cancelado' }

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  description: '',
  expiration_date: '',
  quantity: 1,
  magistral_formula_id: '',
  total: 1,
})

const ProductionOrders = ({ moduleTitle = 'Magistrales - O. Produccion' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const statusRef = useRef()
  const responsibleRef = useRef()
  const warehouseRef = useRef()
  const articleRef = useRef()
  const formatRef = useRef()
  const batchQuantityRef = useRef()
  const quantityRef = useRef()
  const deliveryDateRef = useRef()
  const dateRef = useRef()
  const observationsRef = useRef()
  const [responsibles, setResponsibles] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [articles, setArticles] = useState([])
  const [formats, setFormats] = useState([])
  const [formulas, setFormulas] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    Promise.all([
      rest.getResponsibles(),
      rest.getWarehouses(),
      rest.getArticles(),
      rest.getFormats(),
      rest.getFormulas(),
    ]).then(([responsibleRows, warehouseRows, articleRows, formatRows, formulaRows]) => {
      setResponsibles((responsibleRows ?? []).filter(row => row.status !== null))
      setWarehouses((warehouseRows ?? []).filter(row => row.status !== null))
      setArticles((articleRows ?? []).filter(row => row.status !== null))
      setFormats((formatRows ?? []).filter(row => row.status !== null))
      setFormulas((formulaRows ?? []).filter(row => row.status !== null))
    })
  }, [])

  const openModal = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    statusRef.current.value = data?.order_status ?? 'pending'
    responsibleRef.current.value = data?.responsible_id ?? ''
    warehouseRef.current.value = data?.destination_warehouse_id ?? ''
    articleRef.current.value = data?.article_id ?? ''
    formatRef.current.value = data?.format_id ?? ''
    batchQuantityRef.current.value = data?.batch_quantity ?? 0
    quantityRef.current.value = data?.quantity ?? 1
    deliveryDateRef.current.value = data?.delivery_date?.toString?.().slice?.(0, 10) ?? ''
    dateRef.current.value = data?.registration_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    observationsRef.current.value = data?.observations ?? ''
    const nextItems = (data?.items ?? []).map(item => ({
      uid: crypto.randomUUID(),
      article_id: item.article_id ?? '',
      description: item.description ?? '',
      expiration_date: item.expiration_date?.toString?.().slice?.(0, 10) ?? '',
      quantity: item.quantity ?? 1,
      magistral_formula_id: item.magistral_formula_id ?? '',
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
        if (article && !next.description) next.description = article.name
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
    const warehouse = warehouses.find(row => `${row.id}` === `${warehouseRef.current.value}`)
    const result = await rest.save({
      id: idRef.current.value || undefined,
      code: isEditing ? codeRef.current.value.trim() : '',
      order_status: statusRef.current.value,
      responsible_id: responsibleRef.current.value || null,
      destination: warehouse?.name ?? '',
      destination_warehouse_id: warehouseRef.current.value || null,
      article_id: articleRef.current.value || null,
      format_id: formatRef.current.value || null,
      batch_quantity: batchQuantityRef.current.value,
      quantity: quantityRef.current.value,
      delivery_date: deliveryDateRef.current.value || null,
      registration_date: dateRef.current.value || null,
      observations: observationsRef.current.value.trim(),
      items: items.map(item => ({
        article_id: item.article_id || null,
        description: (item.description ?? '').toString().trim(),
        expiration_date: item.expiration_date || null,
        quantity: item.quantity,
        magistral_formula_id: item.magistral_formula_id || null,
        total: item.total,
      })),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar orden', text: 'Se dara de baja la orden de produccion.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
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
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => openModal(data), 'Editar orden de produccion')
        },
        { dataField: 'order_status', caption: 'Estado', width: 120, calculateCellValue: row => statusLabels[row.order_status] ?? row.order_status },
        { dataField: 'responsible.name', caption: 'Responsable', minWidth: 170 },
        { dataField: 'destinationWarehouse.name', caption: 'Destino', minWidth: 160 },
        { dataField: 'article.name', caption: 'Producto', minWidth: 220 },
        { dataField: 'created_at', caption: 'Fecha Registro', dataType: 'date', width: 130 },
        {
          dataField: 'status',
          caption: 'Activo',
          dataType: 'boolean',
          width: 90,
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
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.productionOrder(data)) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary ms-1', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => remove(data.id) }))
          }
        },
      ]}
    />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar orden de produccion' : 'Registrar orden de produccion'} onSubmit={save} size='xl'>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' disabled={!isEditing} /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Estado</label><select ref={statusRef} className='form-control'>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha entrega</label><input ref={deliveryDateRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha registro</label><input ref={dateRef} type='date' className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Responsable</label><select ref={responsibleRef} className='form-control'><option value=''>Seleccione</option>{responsibles.map(row => <option key={`mag-po-resp-${row.id}`} value={row.id}>{row.document_number} - {row.name}</option>)}</select></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Almacen destino</label><select ref={warehouseRef} className='form-control'><option value=''>Seleccione</option>{warehouses.map(row => <option key={`mag-po-wh-${row.id}`} value={row.id}>{row.name}</option>)}</select></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Producto</label><select ref={articleRef} className='form-control'><option value=''>Seleccione</option>{articles.map(row => <option key={`mag-po-article-${row.id}`} value={row.id}>{row.code} - {row.name}</option>)}</select></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Formato</label><select ref={formatRef} className='form-control'><option value=''>Seleccione</option>{formats.map(row => <option key={`mag-po-format-${row.id}`} value={row.id}>{row.description} ({row.quantity})</option>)}</select></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Cantidad tanda</label><input ref={batchQuantityRef} type='number' min='0' step='0.001' className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Cantidad producto</label><input ref={quantityRef} type='number' min='0' step='0.001' className='form-control' /></div>
        <div className='col-12 mb-2'><label className='form-label'>Observaciones generales</label><textarea ref={observationsRef} className='form-control' rows='2' /></div>

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Detalle de articulos</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}><i className='mdi mdi-plus me-1'></i> Insertar articulo</button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th style={{ minWidth: 230 }}>Descripcion</th>
                  <th style={{ width: 145 }}>F. vencimiento</th>
                  <th style={{ width: 110 }}>Cantidad</th>
                  <th style={{ minWidth: 190 }}>Formula</th>
                  <th style={{ width: 110 }}>Total</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.uid}>
                    <td><select className='form-control form-control-sm' value={item.article_id} onChange={(e) => updateItem(item.uid, 'article_id', e.target.value)}><option value=''>Articulo</option>{articles.map(article => <option key={`po-item-article-${article.id}`} value={article.id}>{article.code} - {article.name}</option>)}</select></td>
                    <td><input className='form-control form-control-sm' type='date' value={item.expiration_date} onChange={(e) => updateItem(item.uid, 'expiration_date', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                    <td><select className='form-control form-control-sm' value={item.magistral_formula_id} onChange={(e) => updateItem(item.uid, 'magistral_formula_id', e.target.value)}><option value=''>Sin formula</option>{formulas.map(formula => <option key={`po-formula-${formula.id}`} value={formula.id}>{formula.article?.code ?? formula.id} - {formula.article?.name ?? 'Formula'}</option>)}</select></td>
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
  const requiredPermission = properties.requiredPermission ?? 'magistrales-production-order'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - O. Produccion'}><ProductionOrders {...properties} /></BaseAdminto>)
})
