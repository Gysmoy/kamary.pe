import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import VdTable from '../../Components/Adminto/VdTable';
import VdSelect from '../../Components/Adminto/VdSelect';
import Modal from '../../Components/Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import ProductionOrdersRest from '../../Actions/Admin/Magistrales/ProductionOrdersRest';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../../Utils/magistralesRecordPdf';

const rest = new ProductionOrdersRest()
const statusLabels = { pending: 'Pendiente', in_process: 'En proceso', finished: 'Finalizado', cancelled: 'Cancelado' }
const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }))
const toNumber = (value) => Number.parseFloat(value || 0) || 0
const normalizeText = (value) => (value ?? '').toString().trim().toLowerCase()
const isInputArticle = (article) => {
  const type = normalizeText(article?.article_type)
  const category = normalizeText(article?.magistralCategory?.description ?? article?.magistral_category?.description)
  return type.includes('insumo') || type.includes('envase') || category === 'insumos'
}

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  description: '',
  expiration_date: '',
  quantity: 1,
  magistral_formula_id: '',
  total: 1,
  formula_label: '',
})

const ProductionOrders = ({ moduleTitle = 'Magistrales - O. Produccion', fixedWarehouse = null }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const warehouseRef = useRef()
  const batchQuantityRef = useRef()
  const quantityRef = useRef()
  const deliveryDateRef = useRef()
  const dateRef = useRef()
  const observationsRef = useRef()
  const [responsibles, setResponsibles] = useState([])
  const [articles, setArticles] = useState([])
  const [formats, setFormats] = useState([])
  const [formulas, setFormulas] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [isEditing, setIsEditing] = useState(false)
  const [orderStatus, setOrderStatus] = useState('pending')
  const [selectedResponsibleId, setSelectedResponsibleId] = useState('')
  const [selectedArticleId, setSelectedArticleId] = useState('')
  const [selectedFormatId, setSelectedFormatId] = useState('')
  const [productionQuantity, setProductionQuantity] = useState(1)
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const fixedWarehouseLabel = [fixedWarehouse?.branch_name, fixedWarehouse?.name].filter(Boolean).join(' - ') || 'Almacen fijo de Magistrales'
  const productArticles = articles.filter(article => !isInputArticle(article))
  const inputArticles = articles.filter(isInputArticle)
  const selectedFormula = formulas.find(formula => `${formula.article_id}` === `${selectedArticleId}`)

  const refresh = () => tableRef.current?.refresh()

  useEffect(() => {
    Promise.all([
      rest.getResponsibles(),
      rest.getArticles(),
      rest.getFormats(),
      rest.getFormulas(),
    ]).then(([responsibleRows, articleRows, formatRows, formulaRows]) => {
      setResponsibles((responsibleRows ?? []).filter(row => row.status !== null))
      setArticles((articleRows ?? []).filter(row => row.status !== null))
      setFormats((formatRows ?? []).filter(row => row.status !== null))
      setFormulas((formulaRows ?? []).filter(row => row.status !== null))
    })
  }, [])

  const formulaRowsForQuantity = (articleId, quantity, currentItems = items) => {
    const formula = formulas.find(row => `${row.article_id}` === `${articleId}`)
    if (!formula?.items?.length) return [emptyItem()]

    const datesByArticle = new Map(currentItems.map(item => [`${item.article_id}`, item.expiration_date ?? '']))
    const multiplier = Math.max(0, toNumber(quantity))
    return formula.items
      .filter(item => item.article_id)
      .map(item => {
        const article = inputArticles.find(row => `${row.id}` === `${item.article_id}`) ?? item.article
        const baseQuantity = toNumber(item.total_quantity || item.quantity)
        return {
          uid: crypto.randomUUID(),
          article_id: item.article_id ?? '',
          description: item.description ?? article?.name ?? '',
          expiration_date: datesByArticle.get(`${item.article_id}`) ?? '',
          quantity: Number(baseQuantity.toFixed(3)),
          magistral_formula_id: formula.id,
          total: Number((baseQuantity * multiplier).toFixed(3)),
          formula_label: `${formula.article?.code ?? formula.id} - ${formula.article?.name ?? 'Formula'}`,
        }
      })
  }

  const applyFormula = (articleId, quantity, currentItems = items) => {
    const formula = formulas.find(row => `${row.article_id}` === `${articleId}`)
    if (!formula) {
      setItems([emptyItem()])
      return
    }
    setItems(formulaRowsForQuantity(articleId, quantity, currentItems))
  }

  const openModal = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    setOrderStatus(data?.order_status ?? 'pending')
    setSelectedResponsibleId(data?.responsible_id ? `${data.responsible_id}` : '')
    warehouseRef.current.value = data?.destination_warehouse_id ?? fixedWarehouseId
    const nextArticleId = data?.article_id ? `${data.article_id}` : ''
    setSelectedArticleId(nextArticleId)
    setSelectedFormatId(data?.format_id ? `${data.format_id}` : '')
    batchQuantityRef.current.value = data?.batch_quantity ?? 0
    const nextQuantity = data?.quantity ?? 1
    setProductionQuantity(nextQuantity)
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
      formula_label: item.formula?.article?.name ?? '',
    }))
    setItems(nextItems.length ? nextItems : [emptyItem()])
    $(modalRef.current).modal('show')
  }

  const onProductChange = (value) => {
    setSelectedArticleId(value)
    applyFormula(value, productionQuantity)
  }

  const onProductionQuantityChange = (value) => {
    setProductionQuantity(value)
    applyFormula(selectedArticleId, value)
  }

  const updateItem = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const next = { ...item, [field]: value }
      if (field === 'article_id') {
        const article = inputArticles.find(row => `${row.id}` === `${value}`)
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
    const result = await rest.save({
      id: idRef.current.value || undefined,
      code: isEditing ? codeRef.current.value.trim() : '',
      order_status: orderStatus,
      responsible_id: selectedResponsibleId || null,
      destination: fixedWarehouse?.name ?? fixedWarehouseLabel,
      destination_warehouse_id: warehouseRef.current.value || fixedWarehouseId || null,
      article_id: selectedArticleId || null,
      format_id: selectedFormatId || null,
      batch_quantity: batchQuantityRef.current.value,
      quantity: productionQuantity,
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
    refresh()
    $(modalRef.current).modal('hide')
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar orden', text: 'Se dara de baja la orden de produccion.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await rest.delete(id)
    if (result) refresh()
  }

  const rowActions = (row) => [
    { icon: 'mdi mdi-file-pdf-box', title: 'Imprimir PDF', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openMagistralesRecordPdf(buildMagistralesRows.productionOrder(r)) },
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => openModal(r) },
    { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => remove(r.id) },
  ]

  return <>
    <VdTable
      ref={tableRef}
      rest={rest}
      icon="mdi mdi-flask-outline"
      title={moduleTitle}
      unit="ordenes"
      defaultSort={{ field: 'created_at', desc: true }}
      defaultPageSize={25}
      searchFields={['code', 'responsible.name', 'destinationWarehouse.name', 'article.name']}
      searchPlaceholder="Buscar por codigo, responsable, destino o producto…"
      emptyText="No se encontraron ordenes de produccion."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => openModal()}>
          <i className="mdi mdi-plus"></i> Nueva orden
        </button>
      </>}
      actions={rowActions}
      columns={[
        {
          key: 'codigo', label: 'Codigo', field: 'code', width: '145px', filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => openModal(row)} title="Editar orden de produccion">
              {row.code}
            </a>
          ),
        },
        {
          key: 'estado_orden', label: 'Estado', field: 'order_status', width: '120px',
          filter: { type: 'select', field: 'order_status', options: statusOptions },
          render: (row) => statusLabels[row.order_status] ?? row.order_status,
        },
        { key: 'responsable', label: 'Responsable', field: 'responsible.name', filter: { type: 'text' } },
        { key: 'destino', label: 'Destino', field: 'destinationWarehouse.name', filter: { type: 'text' } },
        { key: 'producto', label: 'Producto', field: 'article.name', filter: { type: 'text' } },
        {
          key: 'fecha_registro', label: 'Fecha Registro', field: 'created_at', width: '130px',
          filter: { type: 'date' },
          render: (row) => row.created_at?.toString?.().slice?.(0, 10) ?? '',
        },
        {
          key: 'activo', label: 'Activo', field: 'status', width: '90px',
          filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => {
            if (row.status === null) return ''
            return <SwitchFormGroup noMargin checked={row.status == 1} onChange={() => rest.status(row).then(ok => ok && refresh())} />
          },
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => openModal(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.code}</p>
              <small className="text-muted">{row.article?.name || '-'}</small>
            </div>
            <span className="badge badge-soft-primary">{statusLabels[row.order_status] ?? row.order_status}</span>
          </div>
          <small className="text-muted d-block mt-2">{[row.responsible?.name, row.destinationWarehouse?.name].filter(Boolean).join(' · ')}</small>
          {row.status !== null && (
            <span className={`badge mt-2 ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>
          )}
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar orden de produccion' : 'Registrar orden de produccion'} onSubmit={save} size='xl'>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' disabled={!isEditing} /></div>
        <VdSelect label='Estado' col='col-md-3' value={orderStatus} onChange={setOrderStatus} options={statusOptions} />
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha entrega</label><input ref={deliveryDateRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha registro</label><input ref={dateRef} type='date' className='form-control' /></div>
        <VdSelect
          label='Responsable' col='col-md-4'
          value={selectedResponsibleId}
          onChange={setSelectedResponsibleId}
          options={responsibles.map(row => ({ value: `${row.id}`, label: `${row.document_number} - ${row.name}` }))}
          placeholder='-- Seleccionar --'
        />
        <input ref={warehouseRef} hidden />
        <div className='col-md-4 mb-3'><label className='form-label'>Almacen fijo</label><input className='form-control' value={fixedWarehouseLabel} disabled /></div>
        <VdSelect
          label='Producto' col='col-md-4'
          value={selectedArticleId}
          onChange={onProductChange}
          options={productArticles.map(row => ({ value: `${row.id}`, label: `${row.code} - ${row.name}` }))}
          placeholder='-- Seleccionar --'
        />
        <VdSelect
          label='Formato' col='col-md-4'
          value={selectedFormatId}
          onChange={setSelectedFormatId}
          options={formats.map(row => ({ value: `${row.id}`, label: `${row.description} (${row.quantity})` }))}
          placeholder='-- Seleccionar --'
        />
        <div className='col-md-4 mb-3'><label className='form-label'>Cantidad tanda</label><input ref={batchQuantityRef} type='number' min='0' step='0.001' className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Cantidad producto</label><input ref={quantityRef} type='number' min='0' step='0.001' className='form-control' value={productionQuantity} onChange={(e) => onProductionQuantityChange(e.target.value)} /></div>
        <div className='col-12 mb-2'><label className='form-label'>Observaciones generales</label><textarea ref={observationsRef} className='form-control' rows='2' /></div>

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Detalle de articulos</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' disabled={!!selectedFormula} onClick={() => setItems(prev => [...prev, emptyItem()])}><i className='mdi mdi-plus me-1'></i> Insertar articulo</button>
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
                    <td style={{ minWidth: 230 }}>
                      <VdSelect
                        noMargin
                        value={item.article_id}
                        disabled={!!selectedFormula}
                        onChange={(value) => updateItem(item.uid, 'article_id', value)}
                        options={inputArticles.map(article => ({ value: `${article.id}`, label: `${article.code} - ${article.name}` }))}
                        placeholder='Articulo'
                      />
                    </td>
                    <td><input className='form-control form-control-sm' type='date' value={item.expiration_date} onChange={(e) => updateItem(item.uid, 'expiration_date', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} disabled={!!selectedFormula} onChange={(e) => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' value={item.formula_label || (selectedFormula ? `${selectedFormula.article?.code ?? selectedFormula.id} - ${selectedFormula.article?.name ?? 'Formula'}` : '')} disabled /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.total} disabled={!!selectedFormula} onChange={(e) => updateItem(item.uid, 'total', e.target.value)} /></td>
                    <td><button type='button' className='btn btn-xs btn-soft-danger' disabled={!!selectedFormula} onClick={() => removeItem(item.uid)}><i className='mdi mdi-delete'></i></button></td>
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
