import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import LaboratoriesRest from '../Actions/Admin/LaboratoriesRest';
import { scopedPermission } from '../Utils/permissionScope';

const laboratoriesRest = new LaboratoriesRest()

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

    if (Array.isArray(parsed)) rows = parsed
    else if (parsed && typeof parsed === 'object') {
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

const Laboratories = ({ moduleTitle = 'Laboratorios' }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const importModalRef = useRef()
  const importFileRef = useRef()

  const principlesModalRef = useRef()
  const principleModalRef = useRef()
  const principleImportModalRef = useRef()
  const principleImportFileRef = useRef()

  const idRef = useRef()
  const nameRef = useRef()
  const codeRef = useRef()

  const principleIdRef = useRef()
  const principleNameRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importHeaders, setImportHeaders] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [mapping, setMapping] = useState({
    name: '',
    code: '',
    status: '',
  })

  const [selectedLaboratory, setSelectedLaboratory] = useState(null)
  const [principles, setPrinciples] = useState([])
  const [isPrincipleEditing, setIsPrincipleEditing] = useState(false)
  const [isPrincipleImporting, setIsPrincipleImporting] = useState(false)
  const [principleImportRows, setPrincipleImportRows] = useState([])
  const [principleImportHeaders, setPrincipleImportHeaders] = useState([])
  const [principleImportFileName, setPrincipleImportFileName] = useState('')
  const [principleMapping, setPrincipleMapping] = useState({ name: '', status: '' })

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    codeRef.current.value = data?.code ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value.trim(),
      code: codeRef.current.value.trim(),
    }

    const result = await laboratoriesRest.save(request)
    if (!result) return

    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await laboratoriesRest.boolean({ id, field, value })
    if (!result) return
    tableRef.current?.refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar laboratorio',
      text: 'Estas seguro de eliminar este laboratorio? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await laboratoriesRest.delete(id)
    if (!result) return
    tableRef.current?.refresh()
  }

  const onImportModalOpen = () => {
    setImportRows([])
    setImportHeaders([])
    setImportFileName('')
    setMapping({ name: '', code: '', status: '' })
    if (importFileRef.current) importFileRef.current.value = ''
    $(importModalRef.current).modal('show')
  }

  const autoMapHeaders = (headers) => {
    const withNorm = headers.map(header => ({ header, norm: normalizeHeader(header) }))
    const findByNames = (candidates) => withNorm.find(({ norm }) => candidates.includes(norm))?.header ?? ''

    return {
      code: findByNames(['code', 'codigo', 'sigla']),
      name: findByNames(['name', 'nombre', 'laboratory', 'laboratorio']),
      status: findByNames(['status', 'estado', 'activo', 'active', 'enabled', 'habilitado']),
    }
  }

  const autoMapPrincipleHeaders = (headers) => {
    const withNorm = headers.map(header => ({ header, norm: normalizeHeader(header) }))
    const findByNames = (candidates) => withNorm.find(({ norm }) => candidates.includes(norm))?.header ?? ''

    return {
      name: findByNames(['name', 'nombre', 'principioactivo', 'principio', 'activeprinciple']),
      status: findByNames(['status', 'estado', 'activo', 'active', 'enabled', 'habilitado']),
    }
  }

  const onImportFileChanged = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const rows = await parseFileRows(file)
      const headersSet = new Set()
      rows.forEach(row => {
        if (row && typeof row === 'object') Object.keys(row).forEach(key => headersSet.add(key))
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
      setMapping({ name: '', code: '', status: '' })
      Swal.fire({ icon: 'error', title: 'No se pudo leer el archivo', text: error.message })
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
    const result = await laboratoriesRest.importRows({ rows: importRows, mapping })
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

  const loadPrinciples = async (laboratoryId) => {
    const data = await laboratoriesRest.getPrinciples(laboratoryId)
    if (!data) return
    setPrinciples(data)
  }

  const onPrinciplesOpen = async (lab) => {
    setSelectedLaboratory(lab)
    setPrinciples([])
    await loadPrinciples(lab.id)
    $(principlesModalRef.current).modal('show')
  }

  const onPrincipleModalOpen = (principle = null) => {
    setIsPrincipleEditing(!!principle?.id)
    principleIdRef.current.value = principle?.id ?? ''
    principleNameRef.current.value = principle?.name ?? ''
    $(principleModalRef.current).modal('show')
  }

  const onPrincipleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedLaboratory?.id) return

    const request = {
      id: principleIdRef.current.value || undefined,
      name: principleNameRef.current.value.trim(),
    }

    const result = await laboratoriesRest.savePrinciple(selectedLaboratory.id, request)
    if (!result) return

    await loadPrinciples(selectedLaboratory.id)
    $(principleModalRef.current).modal('hide')
  }

  const onDeletePrincipleClicked = async (principleId) => {
    if (!selectedLaboratory?.id) return

    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar principio activo',
      text: 'Estas seguro de eliminar este principio activo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await laboratoriesRest.deletePrinciple(selectedLaboratory.id, principleId)
    if (!result) return
    await loadPrinciples(selectedLaboratory.id)
  }

  const onPrincipleBooleanChange = async ({ principleId, value }) => {
    if (!selectedLaboratory?.id) return

    const result = await laboratoriesRest.booleanPrinciple({
      laboratoryId: selectedLaboratory.id,
      principleId,
      field: 'status',
      value
    })
    if (!result) return
    await loadPrinciples(selectedLaboratory.id)
  }

  const onPrincipleImportOpen = () => {
    setPrincipleImportRows([])
    setPrincipleImportHeaders([])
    setPrincipleImportFileName('')
    setPrincipleMapping({ name: '', status: '' })
    if (principleImportFileRef.current) principleImportFileRef.current.value = ''
    $(principleImportModalRef.current).modal('show')
  }

  const onPrincipleImportFileChanged = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const rows = await parseFileRows(file)
      const headersSet = new Set()
      rows.forEach(row => {
        if (row && typeof row === 'object') Object.keys(row).forEach(key => headersSet.add(key))
      })
      const headers = Array.from(headersSet)

      setPrincipleImportRows(rows)
      setPrincipleImportHeaders(headers)
      setPrincipleImportFileName(file.name)
      setPrincipleMapping(autoMapPrincipleHeaders(headers))
    } catch (error) {
      setPrincipleImportRows([])
      setPrincipleImportHeaders([])
      setPrincipleImportFileName('')
      setPrincipleMapping({ name: '', status: '' })
      Swal.fire({ icon: 'error', title: 'No se pudo leer el archivo', text: error.message })
    }
  }

  const onPrincipleImportSubmit = async (e) => {
    e.preventDefault()
    if (!selectedLaboratory?.id) return

    if (!principleImportRows.length) {
      Swal.fire({ icon: 'warning', title: 'Falta archivo', text: 'Primero carga un archivo con datos' })
      return
    }
    if (!principleMapping.name) {
      Swal.fire({ icon: 'warning', title: 'Campo obligatorio', text: 'Debes mapear el campo nombre' })
      return
    }

    setIsPrincipleImporting(true)
    const result = await laboratoriesRest.importPrinciples(selectedLaboratory.id, {
      rows: principleImportRows,
      mapping: principleMapping
    })
    setIsPrincipleImporting(false)
    if (!result) return

    await loadPrinciples(selectedLaboratory.id)
    $(principleImportModalRef.current).modal('hide')

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
    name: mapping.name ? (row[mapping.name] ?? '') : '',
    code: mapping.code ? (row[mapping.code] ?? '') : '',
    status: mapping.status ? (row[mapping.status] ?? '') : '',
  }))

  const principlePreviewRows = principleImportRows.slice(0, 5).map((row, idx) => ({
    row: idx + 1,
    name: principleMapping.name ? (row[principleMapping.name] ?? '') : '',
    status: principleMapping.status ? (row[principleMapping.status] ?? '') : '',
  }))

  return (<>
    <VdTable
      ref={tableRef}
      rest={laboratoriesRest}
      icon="mdi mdi-flask"
      title={moduleTitle}
      unit="laboratorios"
      defaultSort={{ field: 'name', desc: false }}
      defaultPageSize={25}
      searchFields={['name', 'code']}
      searchPlaceholder="Buscar por nombre o codigo…"
      emptyText="No se encontraron laboratorios."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={() => tableRef.current?.refresh()}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-soft" onClick={() => onImportModalOpen()}>
          <i className="mdi mdi-upload"></i> Importar
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen(null)}>
          <i className="mdi mdi-plus"></i> Nuevo laboratorio
        </button>
      </>}
      actions={(row) => [
        { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
        { icon: 'mdi mdi-layers', title: 'Principios activos', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => onPrinciplesOpen(r) },
        { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
      ]}
      columns={[
        {
          key: 'nombre', label: 'Nombre', field: 'name', filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar laboratorio">
              {row.name}
            </a>
          ),
        },
        { key: 'codigo', label: 'Codigo', field: 'code', width: '180px', filter: { type: 'text' } },
        {
          key: 'creador', label: 'Creado por', field: 'creator.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.creator),
        },
        {
          key: 'actualizador', label: 'Actualizado por', field: 'updater.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.updater),
        },
        {
          key: 'estado', label: 'Estado', field: 'status', width: '100px',
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
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.name}</p>
              <small className="text-muted">{row.code}</small>
            </div>
            {row.status !== null && (
              <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>
            )}
          </div>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar laboratorio' : 'Agregar laboratorio'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <div className='row'>
        <InputFormGroup eRef={nameRef} label='Nombre' col='col-md-8' required />
        <InputFormGroup eRef={codeRef} label='Codigo' col='col-md-4' required />
      </div>
    </Modal>

    <Modal
      modalRef={principlesModalRef}
      title={`Principios activos${selectedLaboratory ? ` - ${selectedLaboratory.name}` : ''}`}
      size='lg'
      hideButtonSubmit
    >
      <div className='d-flex justify-content-between align-items-center mb-2'>
        <div className='fw-semibold'>Listado de principios activos</div>
        <div className='d-flex gap-2'>
          <button type='button' className='btn btn-sm btn-soft-secondary' onClick={() => selectedLaboratory?.id && loadPrinciples(selectedLaboratory.id)}>Refrescar</button>
          <button type='button' className='btn btn-sm btn-soft-info' onClick={() => onPrincipleImportOpen()}>Importar masivo</button>
          <button type='button' className='btn btn-sm btn-primary' onClick={() => onPrincipleModalOpen()}>Agregar principio activo</button>
        </div>
      </div>

      <div className='table-responsive border rounded'>
        <table className='table table-sm table-striped mb-0'>
          <thead>
            <tr>
              <th style={{ width: '48px' }}>#</th>
              <th>Nombre</th>
              <th style={{ width: '110px' }}>Estado</th>
              <th style={{ width: '130px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {principles.length === 0 && (
              <tr>
                <td colSpan='4' className='text-center text-muted py-3'>Sin principios activos</td>
              </tr>
            )}
            {principles.map((principle, idx) => (
              <tr key={`principle-${principle.id}`}>
                <td>{idx + 1}</td>
                <td>{principle.name}</td>
                <td>
                  <SwitchFormGroup checked={principle.status == 1} onChange={() => onPrincipleBooleanChange({
                    principleId: principle.id,
                    value: !principle.status
                  })} />
                </td>
                <td>
                  <button type='button' className='btn btn-xs btn-soft-primary me-1' onClick={() => onPrincipleModalOpen(principle)}>
                    <i className='mdi mdi-pencil'></i>
                  </button>
                  <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onDeletePrincipleClicked(principle.id)}>
                    <i className='mdi mdi-delete'></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>

    <Modal
      modalRef={principleModalRef}
      title={isPrincipleEditing ? 'Editar principio activo' : 'Agregar principio activo'}
      onSubmit={onPrincipleSubmit}
      size='md'
    >
      <input ref={principleIdRef} type='hidden' />
      <div className='row'>
        <InputFormGroup eRef={principleNameRef} label='Nombre' col='col-12' required />
      </div>
    </Modal>

    <Modal
      modalRef={principleImportModalRef}
      title='Importacion masiva de principios activos'
      onSubmit={onPrincipleImportSubmit}
      size='xl'
      btnSubmitText={isPrincipleImporting ? 'Importando...' : 'Importar'}
    >
      <div className='row'>
        <div className='col-12 mb-2'>
          <label className='form-label'>Archivo (Excel, CSV o JSON)</label>
          <input
            ref={principleImportFileRef}
            className='form-control'
            type='file'
            accept='.xlsx,.xls,.csv,.json'
            onChange={onPrincipleImportFileChanged}
          />
          <small className='text-muted'>Clave de sincronizacion: <b>name</b> dentro del laboratorio seleccionado.</small>
          {principleImportFileName && <div className='mt-1'><small className='text-muted'>Archivo: {principleImportFileName} ({principleImportRows.length} filas)</small></div>}
        </div>

        <VdSelect
          label='Mapeo: Nombre'
          col='col-md-6'
          required
          value={principleMapping.name}
          onChange={(value) => setPrincipleMapping(prev => ({ ...prev, name: value }))}
          options={[{ value: '', label: 'Sin mapear' }, ...principleImportHeaders.map(header => ({ value: header, label: header }))]}
          placeholder='Sin mapear'
        />
        <VdSelect
          label='Mapeo: Estado'
          col='col-md-6'
          value={principleMapping.status}
          onChange={(value) => setPrincipleMapping(prev => ({ ...prev, status: value }))}
          options={[{ value: '', label: 'Sin mapear' }, ...principleImportHeaders.map(header => ({ value: header, label: header }))]}
          placeholder='Sin mapear'
        />

        <div className='col-12 mt-2'>
          <h6 className='mb-2'>Vista previa (primeros 5)</h6>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {principlePreviewRows.length === 0 && <tr><td colSpan='3' className='text-center text-muted py-3'>Carga archivo y mapea columnas para previsualizar</td></tr>}
                {principlePreviewRows.map(item => (
                  <tr key={`p-preview-${item.row}`}>
                    <td>{item.row}</td>
                    <td>{item.name?.toString?.() ?? ''}</td>
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
      modalRef={importModalRef}
      title='Importacion masiva de laboratorios'
      onSubmit={onImportSubmit}
      size='xl'
      btnSubmitText={isImporting ? 'Importando...' : 'Importar'}
    >
      <div className='row'>
        <div className='col-12 mb-2'>
          <label className='form-label'>Archivo (Excel, CSV o JSON)</label>
          <input
            ref={importFileRef}
            className='form-control'
            type='file'
            accept='.xlsx,.xls,.csv,.json'
            onChange={onImportFileChanged}
          />
          <small className='text-muted'>Clave de sincronizacion: <b>code</b>. Si existe se actualiza, si no existe se crea.</small>
          {importFileName && <div className='mt-1'><small className='text-muted'>Archivo: {importFileName} ({importRows.length} filas)</small></div>}
        </div>

        <VdSelect
          label='Mapeo: Nombre'
          col='col-md-4'
          value={mapping.name}
          onChange={(value) => setMapping(prev => ({ ...prev, name: value }))}
          options={[{ value: '', label: 'Sin mapear' }, ...importHeaders.map(header => ({ value: header, label: header }))]}
          placeholder='Sin mapear'
        />
        <VdSelect
          label='Mapeo: Codigo'
          col='col-md-4'
          required
          value={mapping.code}
          onChange={(value) => setMapping(prev => ({ ...prev, code: value }))}
          options={[{ value: '', label: 'Sin mapear' }, ...importHeaders.map(header => ({ value: header, label: header }))]}
          placeholder='Sin mapear'
        />
        <VdSelect
          label='Mapeo: Estado'
          col='col-md-4'
          value={mapping.status}
          onChange={(value) => setMapping(prev => ({ ...prev, status: value }))}
          options={[{ value: '', label: 'Sin mapear' }, ...importHeaders.map(header => ({ value: header, label: header }))]}
          placeholder='Sin mapear'
        />

        <div className='col-12 mt-2'>
          <h6 className='mb-2'>Vista previa (primeros 5)</h6>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Codigo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.length === 0 && <tr><td colSpan='4' className='text-center text-muted py-3'>Carga archivo y mapea columnas para previsualizar</td></tr>}
                {previewRows.map(item => (
                  <tr key={`preview-${item.row}`}>
                    <td>{item.row}</td>
                    <td>{item.name?.toString?.() ?? ''}</td>
                    <td>{item.code?.toString?.() ?? ''}</td>
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
  const requiredPermission = properties.requiredPermission ?? scopedPermission('laboratories')
  const moduleTitle = properties.moduleTitle ?? 'Laboratorios'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={moduleTitle}>
    <Laboratories {...properties} />
  </BaseAdminto>);
})
