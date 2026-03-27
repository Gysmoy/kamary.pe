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
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import BatchesRest from '../Actions/Admin/BatchesRest';

const batchesRest = new BatchesRest()

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

const Batches = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const importModalRef = useRef()
  const importFileRef = useRef()

  const idRef = useRef()
  const businessRef = useRef()
  const articleRef = useRef()
  const lotRef = useRef()
  const expirationDateRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedArticleId, setSelectedArticleId] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importHeaders, setImportHeaders] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [mapping, setMapping] = useState({
    business: '',
    article: '',
    lot: '',
    expiration_date: '',
    status: '',
  })

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)

    idRef.current.value = data?.id ?? ''
    lotRef.current.value = data?.lot ?? ''
    expirationDateRef.current.value = (data?.expiration_date ?? '').toString().slice(0, 10)

    const businessId = data?.business_id ? `${data.business_id}` : ''
    const articleId = data?.article_id ? `${data.article_id}` : ''
    setSelectedBusinessId(businessId)
    setSelectedArticleId(articleId)

    if (businessId && data?.business?.name) {
      SetSelectValue(businessRef.current, businessId, data.business.name)
    } else {
      $(businessRef.current).empty().trigger('change')
    }

    if (articleId && data?.article?.name) {
      const articleLabel = `${data.article.code ?? ''} ${data.article.name ?? ''}`.trim()
      SetSelectValue(articleRef.current, articleId, articleLabel)
    } else {
      $(articleRef.current).empty().trigger('change')
    }

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      business_id: selectedBusinessId || null,
      article_id: selectedArticleId || null,
      lot: lotRef.current.value.trim(),
      expiration_date: expirationDateRef.current.value || null,
    }

    const result = await batchesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await batchesRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar lote',
      text: 'Estas seguro de eliminar este lote? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await batchesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onImportModalOpen = () => {
    setImportRows([])
    setImportHeaders([])
    setImportFileName('')
    setMapping({
      business: '',
      article: '',
      lot: '',
      expiration_date: '',
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
      business: findByNames(['empresa', 'business', 'compania', 'company']),
      article: findByNames(['articulo', 'article', 'codigo', 'code', 'descripcion', 'description']),
      lot: findByNames(['lote', 'lot', 'batch']),
      expiration_date: findByNames(['fechavencimiento', 'vencimiento', 'expirationdate', 'expirydate', 'fechaexpiracion']),
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
        business: '',
        article: '',
        lot: '',
        expiration_date: '',
        status: '',
      })
      Swal.fire({ icon: 'error', title: 'No se pudo leer el archivo', text: error.message })
    }
  }

  const onImportSubmit = async (e) => {
    e.preventDefault()

    if (!importRows.length) {
      Swal.fire({ icon: 'warning', title: 'Falta archivo', text: 'Primero carga un archivo con datos' })
      return
    }

    if (!mapping.article || !mapping.lot) {
      Swal.fire({ icon: 'warning', title: 'Campos obligatorios', text: 'Debes mapear articulo y lote' })
      return
    }

    setIsImporting(true)
    const result = await batchesRest.importRows({
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

  const previewRows = importRows.slice(0, 5).map((row, idx) => ({
    row: idx + 1,
    business: mapping.business ? (row[mapping.business] ?? '') : '',
    article: mapping.article ? (row[mapping.article] ?? '') : '',
    lot: mapping.lot ? (row[mapping.lot] ?? '') : '',
    expirationDate: mapping.expiration_date ? (row[mapping.expiration_date] ?? '') : '',
    status: mapping.status ? (row[mapping.status] ?? '') : '',
  }))

  return (<>
    <Table
      gridRef={gridRef}
      title='Lotes'
      rest={batchesRest}
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
            hint: 'Agregar lote',
            onClick: () => onModalOpen(null)
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', visible: false },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 180 },
        { dataField: 'article.code', caption: 'Cod. articulo', width: '130px' },
        { dataField: 'article.name', caption: 'Articulo', minWidth: 220 },
        { dataField: 'lot', caption: 'Lote', width: '140px' },
        { dataField: 'expiration_date', caption: 'F. vencimiento', dataType: 'date', width: '140px' },
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
              title: 'Eliminar lote',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar lote' : 'Agregar lote'} onSubmit={onModalSubmit} size='lg'>
      <div className='row' id='batch-form-container'>
        <input ref={idRef} type='hidden' />

        <SelectAPIFormGroup
          eRef={businessRef}
          label='Empresa'
          col='col-md-6'
          required
          searchAPI='/api/admin/businesses/paginate'
          searchBy='name'
          dropdownParent='#batch-form-container'
          onChange={(e) => setSelectedBusinessId(e.target.value || '')}
        />

        <SelectAPIFormGroup
          eRef={articleRef}
          label='Articulo'
          col='col-md-6'
          required
          searchAPI='/api/admin/articles/paginate'
          searchBy='name'
          dropdownParent='#batch-form-container'
          onChange={(e) => setSelectedArticleId(e.target.value || '')}
        />

        <InputFormGroup eRef={lotRef} label='Lote' col='col-md-6' required />
        <InputFormGroup eRef={expirationDateRef} label='Fecha de vencimiento' col='col-md-6' type='date' required />
      </div>
    </Modal>

    <Modal
      modalRef={importModalRef}
      title='Importacion masiva de lotes'
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
          <label className='form-label'>Empresa</label>
          <select className='form-control' value={mapping.business} onChange={(e) => setMapping(prev => ({ ...prev, business: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`business-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Articulo *</label>
          <select className='form-control' value={mapping.article} onChange={(e) => setMapping(prev => ({ ...prev, article: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`article-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Lote *</label>
          <select className='form-control' value={mapping.lot} onChange={(e) => setMapping(prev => ({ ...prev, lot: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`lot-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-6 mb-2'>
          <label className='form-label'>Fecha de vencimiento</label>
          <select className='form-control' value={mapping.expiration_date} onChange={(e) => setMapping(prev => ({ ...prev, expiration_date: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`expiration-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-6 mb-2'>
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
                  <th>Empresa</th>
                  <th>Articulo</th>
                  <th>Lote</th>
                  <th>F. vencimiento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className='text-center text-muted'>Sin datos para previsualizar</td>
                  </tr>
                )}
                {previewRows.map(item => (
                  <tr key={`preview-${item.row}`}>
                    <td>{item.row}</td>
                    <td>{item.business?.toString?.() ?? ''}</td>
                    <td>{item.article?.toString?.() ?? ''}</td>
                    <td>{item.lot?.toString?.() ?? ''}</td>
                    <td>{item.expirationDate?.toString?.() ?? ''}</td>
                    <td>{item.status?.toString?.() ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('batches') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Lotes'>
    <Batches {...properties} />
  </BaseAdminto>);
})
