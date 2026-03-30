import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
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
import ArticlesRest from '../Actions/Admin/ArticlesRest';

const articlesRest = new ArticlesRest()

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

const normalizeHeader = (value) => (value ?? '')
  .toString()
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replaceAll('_', '')
  .replaceAll('-', '')
  .replaceAll(' ', '')

const parseFileRows = async (file) => {
  const extension = (file.name.split('.').pop() || '').toLowerCase()
  let rows = []

  if (extension === 'json') {
    const text = await file.text()
    const parsed = JSON.parse(text)

    if (Array.isArray(parsed)) {
      rows = parsed
    } else if (parsed && typeof parsed === 'object') {
      const firstArray = Object.values(parsed).find(value => Array.isArray(value))
      if (!firstArray) throw new Error('El JSON debe ser un array o contener un array en algun campo')
      rows = firstArray
    } else {
      throw new Error('Formato JSON invalido')
    }
  } else {
    const content = await file.arrayBuffer()
    const workbook = XLSX.read(content, { type: 'array' })
    const firstSheet = workbook.SheetNames[0]
    if (!firstSheet) throw new Error('No se encontro ninguna hoja en el archivo')
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' })
  }

  if (!Array.isArray(rows)) throw new Error('El archivo no contiene una coleccion de registros')
  if (rows.length === 0) throw new Error('El archivo no tiene filas para importar')

  return rows
}

const emptyPresentation = () => ({
  uid: crypto.randomUUID(),
  name: '',
  units: 1,
  price: 0,
})

const getStockByPresentation = (stockUnits, presentations) => {
  const totalUnits = Number(stockUnits || 0)
  const safeUnits = Number.isFinite(totalUnits) ? totalUnits : 0
  const rows = Array.isArray(presentations) ? presentations : []

  if (!rows.length) {
    const full = Math.floor(Math.max(0, safeUnits))
    return [{ label: 'Unidad', units: 1, full, totalUnits: safeUnits }]
  }

  return rows
    .map((presentation) => {
      const units = Number(presentation?.units || 0)
      const safePresentationUnits = Number.isFinite(units) && units > 0 ? units : 1
      const full = Math.floor(Math.max(0, safeUnits) / safePresentationUnits)
      return {
        label: presentation?.name || 'Presentacion',
        units: safePresentationUnits,
        full,
        totalUnits: safeUnits,
      }
    })
}

const Articles = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const stockModalRef = useRef()
  const importModalRef = useRef()
  const importFileRef = useRef()
  const principleCreateModalRef = useRef()
  const unitCreateModalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const nameRef = useRef()
  const laboratoryRef = useRef()
  const principleRef = useRef()
  const unitRef = useRef()
  const volumeRef = useRef()
  const marginRuleRef = useRef()
  const igvRuleRef = useRef()
  const unitsPerArticleRef = useRef()
  const unitWeightRef = useRef()
  const notesRef = useRef()
  const newPrincipleNameRef = useRef()
  const newUnitNameRef = useRef()
  const newUnitSymbolRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [principles, setPrinciples] = useState([])
  const [units, setUnits] = useState([])
  const [presentations, setPresentations] = useState([emptyPresentation()])
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState('')
  const [selectedPrincipleId, setSelectedPrincipleId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [isLoadingStock, setIsLoadingStock] = useState(false)
  const [stockArticle, setStockArticle] = useState(null)
  const [stockRows, setStockRows] = useState([])
  const [importRows, setImportRows] = useState([])
  const [importHeaders, setImportHeaders] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [mapping, setMapping] = useState({
    code: '',
    name: '',
    laboratory: '',
    active_principle: '',
    unit: '',
    status: '',
  })

  const loadUnits = async (preferredUnitId = null) => {
    const list = await articlesRest.getUnits()
    const active = list.filter(item => item.status !== null)
    setUnits(active)

    if (preferredUnitId && active.some(item => `${item.id}` === `${preferredUnitId}`)) {
      setSelectedUnitId(`${preferredUnitId}`)
      return
    }
    setSelectedUnitId('')
  }

  const loadPrinciples = async (laboratoryId, preferredPrincipleId = null) => {
    if (!laboratoryId) {
      setPrinciples([])
      setSelectedPrincipleId('')
      return
    }

    const data = await articlesRest.getPrinciplesByLaboratory(laboratoryId)
    const active = (data ?? []).filter(item => item.status !== null)
    setPrinciples(active)

    if (preferredPrincipleId && active.some(item => `${item.id}` === `${preferredPrincipleId}`)) {
      setSelectedPrincipleId(`${preferredPrincipleId}`)
      return
    }
    setSelectedPrincipleId('')
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)

    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? ''
    nameRef.current.value = data?.name ?? ''
    volumeRef.current.value = data?.volume ?? ''
    if (marginRuleRef.current) marginRuleRef.current.checked = !!data?.margin_rule
    if (igvRuleRef.current) igvRuleRef.current.checked = !!data?.igv_rule
    unitsPerArticleRef.current.value = data?.units_per_article ?? 1
    unitWeightRef.current.value = data?.unit_weight ?? ''
    notesRef.current.value = data?.notes ?? ''

    const laboratoryId = data?.laboratory_id ? `${data.laboratory_id}` : ''
    setSelectedLaboratoryId(laboratoryId)
    if (data?.laboratory_id && data?.laboratory?.name) {
      SetSelectValue(laboratoryRef.current, data.laboratory_id, data.laboratory.name)
    } else {
      $(laboratoryRef.current).empty().trigger('change')
    }

    const presentationRows = (data?.presentations ?? []).map(presentation => ({
      uid: crypto.randomUUID(),
      name: presentation.name ?? '',
      units: presentation.units ?? 1,
      price: presentation.price ?? 0,
    }))
    setPresentations(presentationRows.length ? presentationRows : [emptyPresentation()])

    $(modalRef.current).modal('show')
    await loadUnits(data?.unit_id ?? null)
    await loadPrinciples(data?.laboratory_id ?? null, data?.active_principle_id ?? null)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      code: codeRef.current.value.trim(),
      name: nameRef.current.value.trim(),
      laboratory_id: selectedLaboratoryId || null,
      active_principle_id: selectedPrincipleId || null,
      unit_id: selectedUnitId || null,
      volume: volumeRef.current.value,
      margin_rule: marginRuleRef.current.checked,
      igv_rule: igvRuleRef.current.checked,
      units_per_article: unitsPerArticleRef.current.value,
      unit_weight: unitWeightRef.current.value,
      notes: notesRef.current.value.trim(),
      presentations: presentations.map(item => ({
        name: (item.name ?? '').toString().trim(),
        units: item.units,
        price: item.price,
      }))
    }

    const result = await articlesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await articlesRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar articulo',
      text: 'Estas seguro de eliminar este articulo? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await articlesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onOpenStockModal = async (article) => {
    setIsLoadingStock(true)
    setStockRows([])
    setStockArticle({
      id: article?.id ?? null,
      code: article?.code ?? '',
      name: article?.name ?? '',
    })
    $(stockModalRef.current).modal('show')

    const result = await articlesRest.getStockByWarehouse(article?.id)
    if (!result) {
      setIsLoadingStock(false)
      return
    }

    setStockArticle(result.article ?? null)
    setStockRows(result.warehouses ?? [])
    setIsLoadingStock(false)
  }

  const onImportModalOpen = () => {
    setImportRows([])
    setImportHeaders([])
    setImportFileName('')
    setMapping({
      code: '',
      name: '',
      laboratory: '',
      active_principle: '',
      unit: '',
      status: '',
    })
    if (importFileRef.current) importFileRef.current.value = ''
    $(importModalRef.current).modal('show')
  }

  const autoMapHeaders = (headers) => {
    const withNorm = headers.map(header => ({
      header,
      norm: normalizeHeader(header)
    }))
    const findByNames = (candidates) => withNorm.find(({ norm }) => candidates.includes(norm))?.header ?? ''

    return {
      code: findByNames(['codigo', 'code', 'codigodearticulo', 'sku']),
      name: findByNames(['descripcion', 'description', 'name', 'nombre', 'articulo', 'producto']),
      laboratory: findByNames(['laboratorio', 'laboratory']),
      active_principle: findByNames(['principioactivo', 'activeprinciple', 'principio']),
      unit: findByNames(['unidad', 'unit', 'unidadmedida']),
      status: findByNames(['estado', 'status', 'activo', 'active', 'habilitado']),
    }
  }

  const onImportFileChanged = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const rows = await parseFileRows(file)
      const headersSet = new Set()
      rows.forEach(row => {
        if (row && typeof row === 'object') {
          Object.keys(row).forEach(key => headersSet.add(key))
        }
      })

      const headers = Array.from(headersSet)
      setImportRows(rows)
      setImportHeaders(headers)
      setImportFileName(file.name)
      setMapping(autoMapHeaders(headers))
    } catch (error) {
      setImportRows([])
      setImportHeaders([])
      setImportFileName('')
      setMapping({
        code: '',
        name: '',
        laboratory: '',
        active_principle: '',
        unit: '',
        status: '',
      })
      Swal.fire({
        icon: 'error',
        title: 'No se pudo leer el archivo',
        text: error.message
      })
    }
  }

  const onImportSubmit = async (e) => {
    e.preventDefault()

    if (!importRows.length) {
      Swal.fire({ icon: 'warning', title: 'Falta archivo', text: 'Primero carga un archivo con datos' })
      return
    }
    if (!mapping.code) {
      Swal.fire({ icon: 'warning', title: 'Campo obligatorio', text: 'Debes mapear el campo codigo' })
      return
    }

    setIsImporting(true)
    const result = await articlesRest.importRows({
      rows: importRows,
      mapping
    })
    setIsImporting(false)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(importModalRef.current).modal('hide')

    const errorsPreview = (result.errors || []).slice(0, 5).join('\n')
    await Swal.fire({
      icon: 'success',
      title: 'Importacion completada',
      html: `
        <div style="text-align:left">
          <p style="margin:0"><b>Creados:</b> ${result.created}</p>
          <p style="margin:0"><b>Actualizados:</b> ${result.updated}</p>
          <p style="margin:0"><b>Omitidos:</b> ${result.skipped}</p>
          ${errorsPreview ? `<pre style="margin-top:8px;white-space:pre-wrap;font-size:12px">${errorsPreview}</pre>` : ''}
        </div>
      `
    })
  }

  const onLaboratoryChanged = async (e) => {
    const laboratoryId = e.target.value || ''
    setSelectedLaboratoryId(laboratoryId)
    await loadPrinciples(laboratoryId, null)
  }

  const onOpenCreatePrincipleModal = () => {
    if (!selectedLaboratoryId) {
      Swal.fire({
        icon: 'warning',
        title: 'Laboratorio requerido',
        text: 'Primero selecciona un laboratorio para asociar el principio activo'
      })
      return
    }
    newPrincipleNameRef.current.value = ''
    $(principleCreateModalRef.current).modal('show')
  }

  const onCreatePrincipleSubmit = async (e) => {
    e.preventDefault()
    const name = (newPrincipleNameRef.current.value ?? '').trim()
    if (!name) return

    const created = await articlesRest.createPrinciple(selectedLaboratoryId, { name })
    if (!created) return

    await loadPrinciples(selectedLaboratoryId, created.id)
    $(principleCreateModalRef.current).modal('hide')
  }

  const onOpenCreateUnitModal = () => {
    newUnitNameRef.current.value = ''
    newUnitSymbolRef.current.value = ''
    $(unitCreateModalRef.current).modal('show')
  }

  const onCreateUnitSubmit = async (e) => {
    e.preventDefault()
    const request = {
      name: (newUnitNameRef.current.value ?? '').trim(),
      symbol: (newUnitSymbolRef.current.value ?? '').trim(),
    }
    if (!request.name || !request.symbol) return

    const created = await articlesRest.createUnit(request)
    if (!created?.id) return

    await loadUnits(created.id)
    $(unitCreateModalRef.current).modal('hide')
  }

  const onPresentationUpdated = (uid, field, value) => {
    setPresentations(prev => prev.map(item => item.uid === uid ? { ...item, [field]: value } : item))
  }

  const onPresentationAdded = () => {
    setPresentations(prev => [...prev, emptyPresentation()])
  }

  const onPresentationRemoved = (uid) => {
    setPresentations(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyPresentation()]
    })
  }

  const previewRows = importRows.slice(0, 5).map((row, idx) => ({
    row: idx + 1,
    code: mapping.code ? (row[mapping.code] ?? '') : '',
    name: mapping.name ? (row[mapping.name] ?? '') : '',
    laboratory: mapping.laboratory ? (row[mapping.laboratory] ?? '') : '',
    principle: mapping.active_principle ? (row[mapping.active_principle] ?? '') : '',
    unit: mapping.unit ? (row[mapping.unit] ?? '') : '',
    status: mapping.status ? (row[mapping.status] ?? '') : '',
  }))

  return (<>
    <Table
      gridRef={gridRef}
      title='Articulos'
      rest={articlesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'upload',
            title: 'Importar',
            hint: 'Importar masivamente',
            onClick: () => onImportModalOpen()
          }
        });
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
            hint: 'Agregar articulo',
            onClick: () => onModalOpen()
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', visible: false },
        { dataField: 'code', caption: 'Codigo', width: '130px' },
        { dataField: 'name', caption: 'Articulo', minWidth: 180 },
        { dataField: 'laboratory.name', caption: 'Laboratorio', width: '150px' },
        { dataField: 'activePrinciple.name', caption: 'Principio activo', width: '180px' },
        {
          dataField: 'unit.symbol',
          caption: 'Unidad',
          width: '110px',
          cellTemplate: (container, { data }) => container.text(data?.unit?.symbol || data?.unit?.name || '')
        },
        { dataField: 'volume', caption: 'Volumen', width: '100px' },
        { dataField: 'units_per_article', caption: 'Und x articulo', width: '110px' },
        { dataField: 'unit_weight', caption: 'Peso unit.', width: '100px' },
        {
          dataField: 'margin_rule',
          caption: 'Regla margen',
          dataType: 'boolean',
          width: '105px',
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.margin_rule == 1} onChange={() => onBooleanChange({
              id: data.id,
              field: 'margin_rule',
              value: !data.margin_rule
            })} />)
          }
        },
        {
          dataField: 'igv_rule',
          caption: 'Regla IGV',
          dataType: 'boolean',
          width: '95px',
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.igv_rule == 1} onChange={() => onBooleanChange({
              id: data.id,
              field: 'igv_rule',
              value: !data.igv_rule
            })} />)
          }
        },
        {
          dataField: 'presentations.name',
          caption: 'Presentaciones',
          allowFiltering: false,
          minWidth: 220,
          cellTemplate: (container, { data }) => {
            const lines = (data?.presentations ?? []).map(item => `${item.name} (${Number(item.units).toFixed(2)}) - S/. ${Number(item.price).toFixed(2)}`)
            ReactAppend(container, <div>
              {lines.length === 0 && <small className='text-muted'>Sin presentaciones</small>}
              {lines.map((line, idx) => <div key={`p-${data.id}-${idx}`}><small>{line}</small></div>)}
            </div>)
          }
        },
        { dataField: 'notes', caption: 'Notas', visible: false },
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
              className: 'btn btn-xs btn-soft-info',
              title: 'Stock por almacen',
              icon: 'mdi mdi-package-variant-closed',
              onClick: () => onOpenStockModal(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar articulo',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal
      modalRef={stockModalRef}
      title={`Stock por almacen${stockArticle?.name ? ` - ${stockArticle.name}` : ''}`}
      size='xl'
      hideButtonSubmit
    >
      <div className='row'>
        <div className='col-12 mb-2'>
          <small className='text-muted'>
            Articulo: <b>{stockArticle?.code || '-'}</b> {stockArticle?.name ? `- ${stockArticle.name}` : ''}
          </small>
        </div>
        <div className='col-12'>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Sede</th>
                  <th>Almacen</th>
                  <th>Entradas</th>
                  <th>Salidas</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingStock && (
                  <tr>
                    <td colSpan={6} className='text-center text-muted'>Cargando stock...</td>
                  </tr>
                )}
                {!isLoadingStock && stockRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className='text-center text-muted'>Sin datos de stock</td>
                  </tr>
                )}
                {!isLoadingStock && stockRows.map((row) => (
                  <tr key={`stock-row-${row.id}`}>
                    <td>{row.business_name || '-'}</td>
                    <td>{row.branch_name || '-'}</td>
                    <td>
                      {row.name || '-'}
                      {row.status == 0 && <span className='badge bg-soft-danger text-danger ms-2'>Inactivo</span>}
                    </td>
                    <td>{Number(row.qty_in || 0).toFixed(3)}</td>
                    <td>{Number(row.qty_out || 0).toFixed(3)}</td>
                    <td>
                      <b>{Number(row.stock || 0).toFixed(3)} und</b>
                      <div className='mt-1'>
                        {getStockByPresentation(row.stock, stockArticle?.presentations).map((presentation, idx) => (
                          <div key={`stock-presentation-${row.id}-${idx}`}>
                            <small>
                              {presentation.label} ({Number(presentation.units).toFixed(3)}): <b>{presentation.full}</b> en stock
                            </small>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>

    <Modal modalRef={modalRef} title={isEditing ? 'Editar articulo' : 'Agregar articulo'} onSubmit={onModalSubmit} size='xl'>
      <div className='row' id='article-form-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={codeRef} label='Codigo de articulo' col='col-md-4' required />
        <InputFormGroup eRef={nameRef} label='Nombre del articulo' col='col-md-8' required />

        <SelectAPIFormGroup
          eRef={laboratoryRef}
          label='Laboratorio'
          col='col-md-4'
          required
          searchAPI='/api/admin/laboratories/paginate'
          searchBy='name'
          dropdownParent='#article-form-container'
          onChange={onLaboratoryChanged}
        />

        <SelectFormGroup
          eRef={principleRef}
          label={<span>Principio activo <button type='button' className='btn btn-link p-0 ms-2' onClick={onOpenCreatePrincipleModal}>Agregar</button></span>}
          col='col-md-4'
          dropdownParent='#article-form-container'
          required
          value={selectedPrincipleId}
          onChange={(e) => setSelectedPrincipleId(e.target.value)}
          effectWith={[selectedPrincipleId, principles.length]}
        >
          <option value=''>Seleccionar...</option>
          {principles.map(principle => (
            <option key={`principle-${principle.id}`} value={principle.id}>{principle.name}</option>
          ))}
        </SelectFormGroup>

        <SelectFormGroup
          eRef={unitRef}
          label={<span>Unidad de medida <button type='button' className='btn btn-link p-0 ms-2' onClick={onOpenCreateUnitModal}>Agregar</button></span>}
          col='col-md-4'
          dropdownParent='#article-form-container'
          required
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
          effectWith={[selectedUnitId, units.length]}
        >
          <option value=''>Seleccionar...</option>
          {units.map(unit => (
            <option key={`unit-${unit.id}`} value={unit.id}>
              {unit.name}{unit.symbol ? ` (${unit.symbol})` : ''}
            </option>
          ))}
        </SelectFormGroup>

        <InputFormGroup eRef={volumeRef} label='Volumen' col='col-md-3' type='number' step='0.001' />
        <InputFormGroup eRef={unitsPerArticleRef} label='Unidad por articulo' col='col-md-3' type='number' min='1' required />
        <InputFormGroup eRef={unitWeightRef} label='Peso unitario' col='col-md-3' type='number' step='0.0001' />

        <div className='form-group col-md-3 mb-2'>
          <label className='form-label d-block'>Regla de margen</label>
          <div className='form-check form-switch'>
            <input ref={marginRuleRef} className='form-check-input' type='checkbox' />
          </div>
        </div>
        <div className='form-group col-md-3 mb-2'>
          <label className='form-label d-block'>Regla de IGV</label>
          <div className='form-check form-switch'>
            <input ref={igvRuleRef} className='form-check-input' type='checkbox' />
          </div>
        </div>

        <TextareaFormGroup eRef={notesRef} label='Notas' col='col-12' rows={3} />

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Presentaciones</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={onPresentationAdded}>
              <i className='mdi mdi-plus me-1'></i> Agregar presentacion
            </button>
          </div>

          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th style={{ width: '46%' }}>Nombre</th>
                  <th style={{ width: '20%' }}>Unidades</th>
                  <th style={{ width: '20%' }}>Precio</th>
                  <th style={{ width: '14%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {presentations.map((presentation) => (
                  <tr key={presentation.uid}>
                    <td>
                      <input
                        className='form-control form-control-sm'
                        value={presentation.name}
                        onChange={(e) => onPresentationUpdated(presentation.uid, 'name', e.target.value)}
                        placeholder='Ej. Six'
                      />
                    </td>
                    <td>
                      <input
                        className='form-control form-control-sm'
                        type='number'
                        min='0.001'
                        step='0.001'
                        value={presentation.units}
                        onChange={(e) => onPresentationUpdated(presentation.uid, 'units', e.target.value)}
                        placeholder='Ej. 6'
                      />
                    </td>
                    <td>
                      <input
                        className='form-control form-control-sm'
                        type='number'
                        min='0'
                        step='0.01'
                        value={presentation.price}
                        onChange={(e) => onPresentationUpdated(presentation.uid, 'price', e.target.value)}
                        placeholder='Ej. 25.90'
                      />
                    </td>
                    <td>
                      <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onPresentationRemoved(presentation.uid)}>
                        <i className='mdi mdi-delete'></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={importModalRef}
      title='Importacion masiva de articulos'
      onSubmit={onImportSubmit}
      size='xl'
      btnSubmitText={isImporting ? 'Importando...' : 'Importar'}
    >
      <div className='row'>
        <div className='col-12 mb-3'>
          <label className='form-label'>Archivo (JSON, XLSX, XLS o CSV)</label>
          <input
            ref={importFileRef}
            type='file'
            className='form-control'
            accept='.xlsx,.xls,.csv,.json'
            onChange={onImportFileChanged}
          />
          {importFileName && <div className='mt-1'><small className='text-muted'>Archivo: {importFileName} ({importRows.length} filas)</small></div>}
        </div>

        <div className='col-md-4 mb-2'>
          <label className='form-label'>Codigo *</label>
          <select className='form-control' value={mapping.code} onChange={(e) => setMapping(prev => ({ ...prev, code: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`code-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Descripcion</label>
          <select className='form-control' value={mapping.name} onChange={(e) => setMapping(prev => ({ ...prev, name: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`name-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Laboratorio</label>
          <select className='form-control' value={mapping.laboratory} onChange={(e) => setMapping(prev => ({ ...prev, laboratory: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`lab-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Principio activo</label>
          <select className='form-control' value={mapping.active_principle} onChange={(e) => setMapping(prev => ({ ...prev, active_principle: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`principle-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Unidad</label>
          <select className='form-control' value={mapping.unit} onChange={(e) => setMapping(prev => ({ ...prev, unit: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`unit-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Estado</label>
          <select className='form-control' value={mapping.status} onChange={(e) => setMapping(prev => ({ ...prev, status: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`status-${header}`} value={header}>{header}</option>)}
          </select>
        </div>

        <div className='col-12 mt-3'>
          <h6 className='mb-2'>Vista previa (primeras 5 filas)</h6>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Codigo</th>
                  <th>Descripcion</th>
                  <th>Laboratorio</th>
                  <th>Principio activo</th>
                  <th>Unidad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className='text-center text-muted'>Sin datos para previsualizar</td>
                  </tr>
                )}
                {previewRows.map(item => (
                  <tr key={`preview-${item.row}`}>
                    <td>{item.row}</td>
                    <td>{item.code?.toString?.() ?? ''}</td>
                    <td>{item.name?.toString?.() ?? ''}</td>
                    <td>{item.laboratory?.toString?.() ?? ''}</td>
                    <td>{item.principle?.toString?.() ?? ''}</td>
                    <td>{item.unit?.toString?.() ?? ''}</td>
                    <td>{item.status?.toString?.() ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={principleCreateModalRef}
      title='Agregar principio activo'
      onSubmit={onCreatePrincipleSubmit}
      size='md'
    >
      <InputFormGroup eRef={newPrincipleNameRef} label='Nombre del principio activo' col='col-12' required />
      <small className='text-muted'>Se asociara al laboratorio actualmente seleccionado.</small>
    </Modal>

    <Modal
      modalRef={unitCreateModalRef}
      title='Agregar unidad de medida'
      onSubmit={onCreateUnitSubmit}
      size='md'
    >
      <div className='row'>
        <InputFormGroup eRef={newUnitNameRef} label='Nombre' col='col-md-8' required />
        <InputFormGroup eRef={newUnitSymbolRef} label='Simbolo' col='col-md-4' required />
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('articles') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Articulos'>
    <Articles {...properties} />
  </BaseAdminto>);
})
