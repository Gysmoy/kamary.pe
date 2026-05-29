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
import renderGridEditLink from '../../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../../Utils/magistralesRecordPdf';

const formulasRest = new FormulasRest()

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const formatDateTime = (value) => value?.toString?.().replace('T', ' ').slice(0, 16) || ''
const toNumber = (value) => Number.parseFloat(value || 0) || 0
const nextUid = () => crypto.randomUUID()
const normalizeText = (value) => (value ?? '').toString().trim().toLowerCase()
const isInputArticle = (article) => {
  const type = normalizeText(article?.article_type)
  const category = normalizeText(article?.magistralCategory?.description ?? article?.magistral_category?.description)
  return type.includes('insumo') || type.includes('envase') || category === 'insumos'
}
const articleCost = (article) => {
  const inputCost = toNumber(article?.magistral_input_cost)
  if (inputCost > 0) return inputCost

  for (const field of ['cost_price', 'purchase_price_national', 'sale_price_national', 'sale_price']) {
    const value = toNumber(article?.[field])
    if (value > 0) return value
  }

  return 0
}
const activePresentations = (article) => (article?.presentations ?? [])
  .filter(row => row?.status !== false && row?.status !== 0 && row?.status !== null)
const findPresentation = (article, value) => {
  const selected = normalizeText(value)
  if (!selected) return null

  return activePresentations(article).find(row => normalizeText(row?.name) === selected) ?? null
}
const presentationPrice = (article, value) => {
  const presentation = findPresentation(article, value)
  const price = toNumber(presentation?.price)

  return price > 0 ? price : articleCost(article)
}
const presentationOptionsFromArticle = (article, currentValue = '') => {
  const options = []
  const pushOption = (value, units = null, price = null) => {
    const label = (value ?? '').toString().trim()
    if (!label) return
    if (options.some(option => normalizeText(option.value) === normalizeText(label))) return
    const numericUnits = toNumber(units)
    const numericPrice = toNumber(price)
    options.push({
      value: label,
      label: numericUnits > 0 ? `${label} (${numericUnits.toFixed(3)})` : label,
      price: numericPrice,
    })
  }

  activePresentations(article)
    .forEach(row => pushOption(row?.name, row?.units, row?.price))

  pushOption(article?.magistral_presentation, null, articleCost(article))
  pushOption(article?.unit?.symbol ?? article?.unit?.name, null, articleCost(article))
  pushOption(currentValue)

  return options
}
const defaultPresentationForArticle = (article) => presentationOptionsFromArticle(article)[0]?.value ?? ''

const emptyItem = () => ({
  uid: nextUid(),
  article_id: '',
  total_units: 0,
  code: '',
  description: '',
  quantity: 1,
  presentation: '',
  article_data: null,
  presentation_options: [],
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
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const formulaArticles = articles.filter(article => !isInputArticle(article))
  const inputArticles = articles.filter(isInputArticle)
  const inputCostTotal = formulaItems.reduce((sum, item) => sum + toNumber(item.subtotal), 0)

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
    const next = rows.map(row => {
      const article = inputArticles.find(item => `${item.id}` === `${row.article_id}`) ?? row.article ?? null
      const presentationOptions = presentationOptionsFromArticle(article, row.presentation)
      const presentation = row.presentation ?? presentationOptions[0]?.value ?? ''
      const currentUnitPrice = presentationPrice(article, presentation)

      return recalculateItem({
        uid: nextUid(),
        article_id: row.article_id ?? '',
        total_units: row.total_units ?? 0,
        code: row.code ?? row.article?.code ?? '',
        description: row.description ?? row.article?.name ?? '',
        quantity: row.quantity ?? 1,
        presentation,
        article_data: article,
        presentation_options: presentationOptions,
        total_quantity: row.total_quantity ?? row.quantity ?? 1,
        unit_price: currentUnitPrice > 0 ? currentUnitPrice : (row.unit_price ?? 0),
        subtotal: row.subtotal ?? 0,
      })
    })
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
        const article = inputArticles.find(row => `${row.id}` === `${value}`)
        const presentationOptions = presentationOptionsFromArticle(article)
        const presentation = defaultPresentationForArticle(article)
        next = {
          ...next,
          code: article?.code ?? '',
          description: article?.name ?? '',
          presentation,
          article_data: article ?? null,
          presentation_options: presentationOptions,
          total_units: article?.units_per_article ?? next.total_units ?? 0,
          unit_price: presentationPrice(article, presentation),
        }
      }

      if (field === 'presentation') {
        const article = inputArticles.find(row => `${row.id}` === `${next.article_id}`) ?? next.article_data
        next = {
          ...next,
          unit_price: presentationPrice(article, value),
        }
      }

      if (['article_id', 'quantity', 'total_units', 'unit_price', 'presentation'].includes(field)) {
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

  const onHistoryOpen = async (data) => {
    setHistoryRows([])
    setIsHistoryLoading(true)
    $(historyModalRef.current).modal('show')

    const rows = data?.id ? await formulasRest.getHistories(data.id) : []
    setHistoryRows(rows)
    setIsHistoryLoading(false)
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
          dataField: 'article.code',
          caption: 'Codigo',
          width: 140,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.article?.code, () => onModalOpen(data), 'Editar formula')
        },
        { dataField: 'article.name', caption: 'Articulo', minWidth: 220 },
        { dataField: 'last_edited_at', caption: 'F. ultima edicion', width: 155, calculateCellValue: (data) => formatDateTime(data.last_edited_at) },
        { dataField: 'last_editor_label', caption: 'Usuario ult. edicion', minWidth: 180, calculateCellValue: (data) => formatUser(data.last_editor ?? data.lastEditor) },
        { dataField: 'detail', caption: 'Detalle formula', visible: false },
        {
          caption: 'Acciones',
          width: 190,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Detalle formula', icon: 'mdi mdi-file-document-edit', onClick: () => onModalOpen(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.magistralFormula(data)) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-info ms-1', title: 'Historial de actualizaciones', icon: 'mdi mdi-history', onClick: () => onHistoryOpen(data) }))
          }
        },
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
            {formulaArticles.map(row => <option key={`mag-formula-article-${row.id}`} value={row.id}>{row.code} - {row.name}</option>)}
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
                {formulaItems.map(item => {
                  const article = inputArticles.find(row => `${row.id}` === `${item.article_id}`) ?? item.article_data
                  const presentationOptions = presentationOptionsFromArticle(article, item.presentation)

                  return (
                    <tr key={item.uid}>
                      <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.total_units} onChange={(e) => updateItem(item.uid, 'total_units', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' value={item.code} onChange={(e) => updateItem(item.uid, 'code', e.target.value)} /></td>
                      <td><select className='form-control form-control-sm' value={item.article_id} onChange={(e) => updateItem(item.uid, 'article_id', e.target.value)}><option value=''>Seleccione</option>{inputArticles.map(article => <option key={`formula-item-article-${article.id}`} value={article.id}>{article.code} - {article.name}</option>)}</select></td>
                      <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                      <td>
                        <select className='form-control form-control-sm' value={item.presentation} disabled={!item.article_id} onChange={(e) => updateItem(item.uid, 'presentation', e.target.value)}>
                          <option value=''>Seleccione</option>
                          {presentationOptions.map(option => <option key={`formula-item-presentation-${item.uid}-${option.value}`} value={option.value}>{option.label}</option>)}
                        </select>
                      </td>
                      <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.total_quantity} onChange={(e) => updateItem(item.uid, 'total_quantity', e.target.value)} /></td>
                      <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.unit_price} disabled /></td>
                      <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.subtotal} disabled /></td>
                      <td><button type='button' className='btn btn-xs btn-soft-danger' onClick={() => removeItem(item.uid)}><i className='mdi mdi-delete'></i></button></td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan='7' className='text-end fw-semibold'>Costo insumos</td>
                  <td><input className='form-control form-control-sm' value={inputCostTotal.toFixed(2)} disabled /></td>
                  <td></td>
                </tr>
              </tfoot>
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
            {isHistoryLoading && <tr><td colSpan='3' className='text-center text-muted py-3'>Cargando historial...</td></tr>}
            {!isHistoryLoading && historyRows.length === 0 && <tr><td colSpan='3' className='text-center text-muted py-3'>Sin historial</td></tr>}
            {!isHistoryLoading && historyRows.map(row => (
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
