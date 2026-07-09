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
import UnitsRest from '../Actions/Admin/UnitsRest';
import { scopedPermission } from '../Utils/permissionScope';

const unitsRest = new UnitsRest()

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

const Units = ({ moduleTitle = 'Unidades de medida' }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const importModalRef = useRef()
  const importFileRef = useRef()

  const idRef = useRef()
  const nameRef = useRef()
  const symbolRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importHeaders, setImportHeaders] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [mapping, setMapping] = useState({
    name: '',
    symbol: '',
    status: '',
  })

  const refresh = () => tableRef.current?.refresh()

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    symbolRef.current.value = data?.symbol ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value.trim(),
      symbol: symbolRef.current.value.trim(),
    }

    const result = await unitsRest.save(request)
    if (!result) return

    refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await unitsRest.boolean({ id, field, value })
    if (!result) return
    refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar unidad',
      text: '¿Estas seguro de eliminar esta unidad de medida? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await unitsRest.delete(id)
    if (!result) return
    refresh()
  }

  const onImportModalOpen = () => {
    setImportRows([])
    setImportHeaders([])
    setImportFileName('')
    setMapping({ name: '', symbol: '', status: '' })
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
      symbol: findByNames(['symbol', 'simbolo', 'símbolo', 'abreviatura', 'sigla', 'codigo', 'code']),
      name: findByNames(['name', 'nombre', 'unidad', 'description', 'descripcion']),
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
        if (row && typeof row === 'object') {
          Object.keys(row).forEach(key => headersSet.add(key))
        }
      })

      const headers = Array.from(headersSet)
      const suggestedMapping = autoMapHeaders(headers)

      setImportRows(rows)
      setImportHeaders(headers)
      setImportFileName(file.name)
      setMapping(suggestedMapping)
    } catch (error) {
      setImportRows([])
      setImportHeaders([])
      setImportFileName('')
      setMapping({ name: '', symbol: '', status: '' })
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

    if (!mapping.symbol) {
      Swal.fire({ icon: 'warning', title: 'Campo obligatorio', text: 'Debes mapear el campo simbolo' })
      return
    }

    setIsImporting(true)
    const result = await unitsRest.importRows({
      rows: importRows,
      mapping
    })
    setIsImporting(false)

    if (!result) return

    refresh()
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
    name: mapping.name ? (row[mapping.name] ?? '') : '',
    symbol: mapping.symbol ? (row[mapping.symbol] ?? '') : '',
    status: mapping.status ? (row[mapping.status] ?? '') : '',
  }))

  const mappingOptions = [{ value: '', label: 'Sin mapear' }, ...importHeaders.map(header => ({ value: header, label: header }))]

  const rowActions = (row) => [
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
    { icon: 'mdi mdi-delete', title: 'Eliminar unidad', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
  ]

  return (<>
    <VdTable
      ref={tableRef}
      rest={unitsRest}
      icon="mdi mdi-ruler"
      title={moduleTitle}
      unit="unidades"
      defaultSort={{ field: 'name', desc: false }}
      defaultPageSize={25}
      searchFields={['name', 'symbol']}
      searchPlaceholder="Buscar por nombre o simbolo…"
      emptyText="No se encontraron unidades de medida."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-soft" title="Importar masivamente" onClick={onImportModalOpen}>
          <i className="mdi mdi-upload"></i> Importar
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen(null)}>
          <i className="mdi mdi-plus"></i> Nueva unidad
        </button>
      </>}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'nombre', label: 'Unidad de medida', field: 'name', filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar unidad">
              {row.name}
            </a>
          ),
        },
        { key: 'simbolo', label: 'Simbolo', field: 'symbol', filter: { type: 'text' } },
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
              <small className="text-muted">{row.symbol}</small>
            </div>
            {row.status !== null && (
              <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>
            )}
          </div>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar unidad de medida' : 'Agregar unidad de medida'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <div className='row'>
        <InputFormGroup eRef={nameRef} label='Nombre' col='col-md-8' required />
        <InputFormGroup eRef={symbolRef} label='Simbolo' col='col-md-4' required />
      </div>
    </Modal>

    <Modal
      modalRef={importModalRef}
      title='Importacion masiva de unidades'
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
          <small className='text-muted'>Clave de sincronizacion: <b>symbol</b>. Si existe se actualiza, si no existe se crea.</small>
          {importFileName && <div className='mt-1'><small className='text-muted'>Archivo: {importFileName} ({importRows.length} filas)</small></div>}
        </div>

        <VdSelect
          label='Mapeo: Nombre'
          col='col-md-4'
          value={mapping.name}
          onChange={(value) => setMapping(prev => ({ ...prev, name: value }))}
          options={mappingOptions}
          placeholder='Sin mapear'
        />

        <VdSelect
          label='Mapeo: Simbolo'
          col='col-md-4'
          required
          value={mapping.symbol}
          onChange={(value) => setMapping(prev => ({ ...prev, symbol: value }))}
          options={mappingOptions}
          placeholder='Sin mapear'
        />

        <VdSelect
          label='Mapeo: Estado'
          col='col-md-4'
          value={mapping.status}
          onChange={(value) => setMapping(prev => ({ ...prev, status: value }))}
          options={mappingOptions}
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
                  <th>Simbolo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.length === 0 && <tr><td colSpan='4' className='text-center text-muted py-3'>Carga archivo y mapea columnas para previsualizar</td></tr>}
                {previewRows.map(item => (
                  <tr key={`preview-${item.row}`}>
                    <td>{item.row}</td>
                    <td>{item.name?.toString?.() ?? ''}</td>
                    <td>{item.symbol?.toString?.() ?? ''}</td>
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
  const requiredPermission = properties.requiredPermission ?? scopedPermission('units-of-measure')
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Unidades de medida'}>
    <Units {...properties} />
  </BaseAdminto>);
})
