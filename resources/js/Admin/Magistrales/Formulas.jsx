import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import Table from '../../Components/Adminto/Table';
import Modal from '../../Components/Adminto/Modal';
import ReactAppend from '../../Utils/ReactAppend';
import DxButton from '../../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import FormulasRest from '../../Actions/Admin/Magistrales/FormulasRest';

const formulasRest = new FormulasRest()

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const formatDateTime = (value) => value?.toString?.().replace('T', ' ').slice(0, 16) || ''
const toNumber = (value) => Number.parseFloat(value || 0) || 0
const nextUid = () => crypto.randomUUID()

const emptyItem = () => ({
  uid: nextUid(),
  article_id: '',
  total_units: 0,
  code: '',
  description: '',
  quantity: 1,
  presentation: '',
  total_quantity: 1,
  unit_price: 0,
  subtotal: 0,
})

const recalculateItem = (item) => {
  const quantity = toNumber(item.quantity)
  const totalUnits = toNumber(item.total_units)
  const totalQuantity = totalUnits > 0 ? totalUnits * quantity : quantity
  const unitPrice = toNumber(item.unit_price)

  return {
    ...item,
    total_quantity: Number(totalQuantity.toFixed(3)),
    subtotal: Number((totalQuantity * unitPrice).toFixed(2)),
  }
}

const Formulas = ({ moduleTitle = 'Magistrales - Formulas' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const historyModalRef = useRef()
  const idRef = useRef()
  const articleRef = useRef()
  const changeReasonRef = useRef()
  const specialPreparationConditionsRef = useRef()
  const specializedEquipmentRef = useRef()
  const preparationInstructionsRef = useRef()
  const preparationMethodRef = useRef()
  const conservationRef = useRef()
  const stabilityRef = useRef()
  const usageRef = useRef()
  const othersRef = useRef()
  const [articles, setArticles] = useState([])
  const [formulaItems, setFormulaItems] = useState([emptyItem()])
  const [historyRows, setHistoryRows] = useState([])
  const [isEditing, setIsEditing] = useState(false)

  const structuredFields = [
    { key: 'special_preparation_conditions', label: 'Condiciones Especiales para Preparacion', ref: specialPreparationConditionsRef, rows: 2 },
    { key: 'specialized_equipment', label: 'Equipos Especializados', ref: specializedEquipmentRef, rows: 2 },
    { key: 'preparation_instructions', label: 'Instrucciones de Preparacion', ref: preparationInstructionsRef, rows: 3 },
    { key: 'preparation_method', label: 'Metodo de Preparacion', ref: preparationMethodRef, rows: 3 },
    { key: 'conservation', label: 'Conservacion', ref: conservationRef, rows: 2 },
    { key: 'stability', label: 'Estabilidad', ref: stabilityRef, rows: 2 },
    { key: 'usage', label: 'Uso', ref: usageRef, rows: 2 },
    { key: 'others', label: 'Otros', ref: othersRef, rows: 2 },
  ]

  useEffect(() => {
    formulasRest.getArticles().then(rows => setArticles((rows ?? []).filter(row => row.status !== null)))
  }, [])

  const hydrateItems = (rows = []) => {
    const next = rows.map(row => ({
      uid: nextUid(),
      article_id: row.article_id ?? '',
      total_units: row.total_units ?? 0,
      code: row.code ?? row.article?.code ?? '',
      description: row.description ?? row.article?.name ?? '',
      quantity: row.quantity ?? 1,
      presentation: row.presentation ?? row.article?.unit?.symbol ?? row.article?.unit?.name ?? '',
      total_quantity: row.total_quantity ?? row.quantity ?? 1,
      unit_price: row.unit_price ?? 0,
      subtotal: row.subtotal ?? 0,
    }))
    setFormulaItems(next.length ? next : [emptyItem()])
  }

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    articleRef.current.value = data?.article_id ?? ''
    changeReasonRef.current.value = ''
    structuredFields.forEach(field => {
      field.ref.current.value = data?.[field.key] ?? ''
    })
    hydrateItems(data?.items ?? [])
    $(modalRef.current).modal('show')
  }

  const updateItem = (uid, field, value) => {
    setFormulaItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      let next = { ...item, [field]: value }

      if (field === 'article_id') {
        const article = articles.find(row => `${row.id}` === `${value}`)
        next = {
          ...next,
          code: article?.code ?? '',
          description: article?.name ?? '',
          presentation: article?.unit?.symbol ?? article?.unit?.name ?? '',
          total_units: article?.units_per_article ?? next.total_units ?? 0,
          unit_price: article?.cost_price ?? article?.purchase_price_national ?? next.unit_price ?? 0,
        }
      }

      if (['article_id', 'quantity', 'total_units', 'unit_price'].includes(field)) {
        return recalculateItem(next)
      }

      if (field === 'total_quantity') {
        const totalQuantity = toNumber(value)
        return { ...next, subtotal: Number((totalQuantity * toNumber(next.unit_price)).toFixed(2)) }
      }

      return next
    }))
  }

  const removeItem = (uid) => {
    setFormulaItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyItem()]
    })
  }

  const onSave = async (e) => {
    e.preventDefault()
    const structuredPayload = structuredFields.reduce((carry, field) => ({
      ...carry,
      [field.key]: field.ref.current.value.trim(),
    }), {})
    const detail = structuredFields
      .map(field => `${field.label}: ${field.ref.current.value.trim()}`)
      .filter(text => !text.endsWith(': '))
      .join('\n\n')

    const result = await formulasRest.save({
      id: idRef.current.value || undefined,
      article_id: articleRef.current.value || null,
      change_reason: changeReasonRef.current.value.trim(),
      detail,
      ...structuredPayload,
      items: formulaItems.map(item => ({
        article_id: item.article_id || null,
        total_units: item.total_units,
        code: (item.code ?? '').toString().trim(),
        description: (item.description ?? '').toString().trim(),
        quantity: item.quantity,
        presentation: (item.presentation ?? '').toString().trim(),
        total_quantity: item.total_quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await formulasRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onHistoryOpen = (data) => {
    setHistoryRows(data?.histories ?? [])
    $(historyModalRef.current).modal('show')
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={formulasRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        {
          caption: 'Acciones',
          width: 150,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Detalle formula', icon: 'mdi mdi-file-document-edit', onClick: () => onModalOpen(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-info ms-1', title: 'Historial de actualizaciones', icon: 'mdi mdi-history', onClick: () => onHistoryOpen(data) }))
          }
        },
        { dataField: 'article.code', caption: 'Codigo', width: 140 },
        { dataField: 'article.name', caption: 'Articulo', minWidth: 220 },
        { dataField: 'last_edited_at', caption: 'F. ultima edicion', width: 155, calculateCellValue: (data) => formatDateTime(data.last_edited_at) },
        { dataField: 'last_editor_label', caption: 'Usuario ult. edicion', minWidth: 180, calculateCellValue: (data) => formatUser(data.last_editor ?? data.lastEditor) },
        { dataField: 'detail', caption: 'Detalle formula', visible: false },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          visible: false,
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onStatusChange(data)} />)
          }
        },
      ]}
    />

    <Modal modalRef={modalRef} title='Detalle formula' size='xl' onSubmit={onSave} btnSubmitText='Guardar'>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-8 mb-3'>
          <label className='form-label'>Articulo</label>
          <select ref={articleRef} className='form-control' required disabled={isEditing}>
            <option value=''>Seleccione</option>
            {articles.map(row => <option key={`mag-formula-article-${row.id}`} value={row.id}>{row.code} - {row.name}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Motivo</label>
          <input ref={changeReasonRef} className='form-control' placeholder={isEditing ? 'Actualizacion de formula' : 'Creacion de formula'} />
        </div>

        <div className='col-12 mt-1'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Insumos</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={() => setFormulaItems(prev => [...prev, emptyItem()])}><i className='mdi mdi-plus me-1'></i> Seleccionar insumos</button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Unidades totales</th>
                  <th style={{ width: 130 }}>Codigo</th>
                  <th style={{ minWidth: 240 }}>Articulo</th>
                  <th style={{ width: 110 }}>Cantidad</th>
                  <th style={{ width: 110 }}>Prese.</th>
                  <th style={{ width: 125 }}>Cantidad Total</th>
                  <th style={{ width: 110 }}>Precio</th>
                  <th style={{ width: 110 }}>Subtotal</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {formulaItems.map(item => (
                  <tr key={item.uid}>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.total_units} onChange={(e) => updateItem(item.uid, 'total_units', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' value={item.code} onChange={(e) => updateItem(item.uid, 'code', e.target.value)} /></td>
                    <td><select className='form-control form-control-sm' value={item.article_id} onChange={(e) => updateItem(item.uid, 'article_id', e.target.value)}><option value=''>Seleccione</option>{articles.map(article => <option key={`formula-item-article-${article.id}`} value={article.id}>{article.code} - {article.name}</option>)}</select></td>
                    <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' value={item.presentation} onChange={(e) => updateItem(item.uid, 'presentation', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.total_quantity} onChange={(e) => updateItem(item.uid, 'total_quantity', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.unit_price} onChange={(e) => updateItem(item.uid, 'unit_price', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.subtotal} onChange={(e) => updateItem(item.uid, 'subtotal', e.target.value)} /></td>
                    <td><button type='button' className='btn btn-xs btn-soft-danger' onClick={() => removeItem(item.uid)}><i className='mdi mdi-delete'></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className='col-12 mt-3'>
          <div className='row'>
            {structuredFields.map(field => (
              <div className='col-md-6 mb-3' key={`formula-field-${field.key}`}>
                <label className='form-label'>{field.label}</label>
                <textarea ref={field.ref} className='form-control' rows={field.rows} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>

    <Modal modalRef={historyModalRef} title='Historial de actualizaciones' size='lg' hideFooter>
      <div className='table-responsive border rounded'>
        <table className='table table-sm table-striped mb-0'>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Fecha</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.length === 0 && <tr><td colSpan='3' className='text-center text-muted py-3'>Sin historial</td></tr>}
            {historyRows.map(row => (
              <tr key={`formula-history-${row.id}`}>
                <td>{formatUser(row.editor)}</td>
                <td>{formatDateTime(row.created_at)}</td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{row.change_reason || row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-formulas'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Formulas'}><Formulas {...properties} /></BaseAdminto>)
})
