import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '@Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import BatchesRest from '../Actions/Admin/BatchesRest';
import ArticlesRest from '../Actions/Admin/ArticlesRest';
import { scopedPermission } from '../Utils/permissionScope';

const batchesRest = new BatchesRest()
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

const formatDate = (value) => value?.toString?.().slice?.(0, 10) || value || '-'

const articleLabel = (article) => `${article?.code ?? ''} ${article?.name ?? ''}`.trim()

const normalizeHeader = (value) => (value ?? '')
  .toString()
  .trim()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
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
  const tableRef = useRef()
  const modalRef = useRef()
  const importModalRef = useRef()
  const importFileRef = useRef()

  const idRef = useRef()
  const lotRef = useRef()
  const expirationDateRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [articles, setArticles] = useState([])
  const [selectedArticleId, setSelectedArticleId] = useState('')
  const [editingArticle, setEditingArticle] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importHeaders, setImportHeaders] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [mapping, setMapping] = useState({
    article: '',
    lot: '',
    expiration_date: '',
    status: '',
  })

  // Catalogo de articulos para el VdSelect del modal (reemplaza el buscador remoto select2)
  useEffect(() => {
    const loadArticles = async () => {
      const res = await articlesRest.paginate({
        isLoadingAll: true,
        take: 3000,
        sort: [{ selector: 'name', desc: false }],
      })
      setArticles(Array.isArray(res?.data) ? res.data : [])
    }
    loadArticles()
  }, [])

  const articleOptions = useMemo(() => {
    const base = articles.map(a => ({ value: `${a.id}`, label: articleLabel(a) }))
    if (editingArticle?.id && !base.some(o => o.value === `${editingArticle.id}`)) {
      base.unshift({ value: `${editingArticle.id}`, label: articleLabel(editingArticle) })
    }
    return base
  }, [articles, editingArticle])

  const mappingOptions = useMemo(() => [
    { value: '', label: 'Seleccionar...' },
    ...importHeaders.map(header => ({ value: header, label: header })),
  ], [importHeaders])

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)

    idRef.current.value = data?.id ?? ''
    lotRef.current.value = data?.lot ?? ''
    expirationDateRef.current.value = (data?.expiration_date ?? '').toString().slice(0, 10)

    setSelectedArticleId(data?.article_id ? `${data.article_id}` : '')
    setEditingArticle(data?.article ?? null)

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    if (!selectedArticleId) {
      Swal.fire({ icon: 'warning', title: 'Falta articulo', text: 'Selecciona un articulo.', confirmButtonText: 'Entendido' })
      return
    }

    const request = {
      id: idRef.current.value || undefined,
      article_id: selectedArticleId || null,
      lot: lotRef.current.value.trim(),
      expiration_date: expirationDateRef.current.value || null,
    }

    const result = await batchesRest.save(request)
    if (!result) return

    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await batchesRest.boolean({ id, field, value })
    if (!result) return
    tableRef.current?.refresh()
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
    tableRef.current?.refresh()
  }

  const onImportModalOpen = () => {
    setImportRows([])
    setImportHeaders([])
    setImportFileName('')
    setMapping({
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

    tableRef.current?.refresh()
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
    article: mapping.article ? (row[mapping.article] ?? '') : '',
    lot: mapping.lot ? (row[mapping.lot] ?? '') : '',
    expirationDate: mapping.expiration_date ? (row[mapping.expiration_date] ?? '') : '',
    status: mapping.status ? (row[mapping.status] ?? '') : '',
  }))

  return (<>
    <VdTable
      ref={tableRef}
      rest={batchesRest}
      icon="mdi mdi-package-variant-closed"
      title="Lotes"
      unit="lotes"
      defaultSort={{ field: 'id', desc: true }}
      defaultPageSize={25}
      searchFields={['article.code', 'article.name', 'lot']}
      searchPlaceholder="Buscar por articulo o lote…"
      emptyText="No se encontraron lotes."
      headerActions={<>
        <button type="button" className="vdt-btn-soft" onClick={onImportModalOpen}>
          <i className="mdi mdi-upload"></i> Importar
        </button>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={() => tableRef.current?.refresh()}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen(null)}>
          <i className="mdi mdi-plus"></i> Nuevo lote
        </button>
      </>}
      actions={(row) => [
        { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
        { icon: 'mdi mdi-delete', title: 'Eliminar lote', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
      ]}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'codigo', label: 'Cod. articulo', field: 'article.code', width: '130px',
          filter: { type: 'text', field: 'article.code' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar lote">
              {row.article?.code ?? '-'}
            </a>
          ),
        },
        {
          key: 'articulo', label: 'Articulo', field: 'article.name',
          filter: { type: 'text', field: 'article.name' },
        },
        { key: 'lote', label: 'Lote', field: 'lot', width: '140px', filter: { type: 'text' } },
        {
          key: 'vencimiento', label: 'F. vencimiento', field: 'expiration_date', width: '140px',
          filter: { type: 'date' },
          render: (row) => formatDate(row.expiration_date),
        },
        {
          key: 'creador', label: 'Creado por', field: 'creator.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.creator),
        },
        {
          key: 'actualizador', label: 'Actualizado por', field: 'updater.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.updater),
        },
        {
          key: 'estado', label: 'Estado', field: 'status', width: '95px',
          filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => {
            if (row.status === null) return ''
            return <SwitchFormGroup noMargin checked={row.status == 1} onChange={() => onBooleanChange({ id: row.id, field: 'status', value: !row.status })} />
          },
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.article?.code} — {row.article?.name}</p>
              <small className="text-muted">Lote: {row.lot}</small>
            </div>
            {row.status !== null && (
              <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>
            )}
          </div>
          <small className="text-muted d-block mt-2"><i className="mdi mdi-calendar me-1"></i>Vence: {formatDate(row.expiration_date)}</small>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar lote' : 'Agregar lote'} onSubmit={onModalSubmit} size='lg'>
      <div className='row' id='batch-form-container'>
        <input ref={idRef} type='hidden' />

        <VdSelect
          label='Articulo'
          col='col-md-12'
          required
          value={selectedArticleId}
          onChange={(value) => setSelectedArticleId(value || '')}
          options={articleOptions}
          placeholder='-- Seleccionar articulo --'
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

        <VdSelect
          label='Articulo'
          col='col-md-6'
          required
          value={mapping.article}
          onChange={(value) => setMapping(prev => ({ ...prev, article: value }))}
          options={mappingOptions}
          placeholder='Seleccionar...'
        />
        <VdSelect
          label='Lote'
          col='col-md-6'
          required
          value={mapping.lot}
          onChange={(value) => setMapping(prev => ({ ...prev, lot: value }))}
          options={mappingOptions}
          placeholder='Seleccionar...'
        />
        <VdSelect
          label='Fecha de vencimiento'
          col='col-md-6'
          value={mapping.expiration_date}
          onChange={(value) => setMapping(prev => ({ ...prev, expiration_date: value }))}
          options={mappingOptions}
          placeholder='Seleccionar...'
        />
        <VdSelect
          label='Estado'
          col='col-md-6'
          value={mapping.status}
          onChange={(value) => setMapping(prev => ({ ...prev, status: value }))}
          options={mappingOptions}
          placeholder='Seleccionar...'
        />

        <div className='col-12 mt-3'>
          <h6 className='mb-2'>Vista previa (primeras 5 filas)</h6>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Articulo</th>
                  <th>Lote</th>
                  <th>F. vencimiento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className='text-center text-muted'>Sin datos para previsualizar</td>
                  </tr>
                )}
                {previewRows.map(item => (
                  <tr key={`preview-${item.row}`}>
                    <td>{item.row}</td>
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
  if (!properties.can(scopedPermission('batches')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Lotes'>
    <Batches {...properties} />
  </BaseAdminto>);
})
