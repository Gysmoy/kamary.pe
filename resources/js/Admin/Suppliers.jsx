import React, { useRef, useState } from 'react';
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
import SuppliersRest from '../Actions/Admin/SuppliersRest';
import { scopedPermission } from '../Utils/permissionScope';

const suppliersRest = new SuppliersRest()

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
  .replaceAll('/', '')

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

const Suppliers = ({ moduleTitle = 'Proveedores' }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const importModalRef = useRef()
  const importFileRef = useRef()
  const rucLookupTimeoutRef = useRef()

  const idRef = useRef()
  const rucRef = useRef()
  const businessNameRef = useRef()
  const tradeNameRef = useRef()
  const addressRef = useRef()
  const phoneRef = useRef()
  const mobileRef = useRef()
  const contactNameRef = useRef()
  const contactPositionRef = useRef()
  const contactPhoneRef = useRef()
  const contactEmailRef = useRef()
  const email1Ref = useRef()
  const email2Ref = useRef()
  const businessLineRef = useRef()
  const billingTypeRef = useRef()
  const creditTypeRef = useRef()
  const bankRef = useRef()
  const bankAccountCciRef = useRef()
  const paymentSystemRef = useRef()
  const paymentTermDaysRef = useRef()
  const evaluationRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [isSearchingRuc, setIsSearchingRuc] = useState(false)
  const [lastLookedRuc, setLastLookedRuc] = useState('')
  const [paymentCondition, setPaymentCondition] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importHeaders, setImportHeaders] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [mapping, setMapping] = useState({
    ruc: '',
    business_name: '',
    address: '',
    phone: '',
    email_1: '',
    bank_account_cci: '',
    payment_condition: '',
    status: '',
  })

  const refresh = () => tableRef.current?.refresh()

  const clearSupplierForm = () => {
    idRef.current.value = ''
    rucRef.current.value = ''
    businessNameRef.current.value = ''
    tradeNameRef.current.value = ''
    addressRef.current.value = ''
    phoneRef.current.value = ''
    mobileRef.current.value = ''
    contactNameRef.current.value = ''
    contactPositionRef.current.value = ''
    contactPhoneRef.current.value = ''
    contactEmailRef.current.value = ''
    email1Ref.current.value = ''
    email2Ref.current.value = ''
    businessLineRef.current.value = ''
    billingTypeRef.current.value = ''
    creditTypeRef.current.value = ''
    setPaymentCondition('')
    bankRef.current.value = ''
    bankAccountCciRef.current.value = ''
    paymentSystemRef.current.value = ''
    paymentTermDaysRef.current.value = ''
    evaluationRef.current.value = ''
  }

  const applyProviderData = (provider = {}) => {
    businessNameRef.current.value = provider.business_name ?? businessNameRef.current.value
    tradeNameRef.current.value = provider.business_name ?? tradeNameRef.current.value
    addressRef.current.value = provider.address ?? addressRef.current.value
    mobileRef.current.value = provider.mobile ?? mobileRef.current.value
    email1Ref.current.value = provider.email_1 ?? email1Ref.current.value
  }

  const lookupRuc = async (rawRuc) => {
    const ruc = (rawRuc ?? '').replace(/\D+/g, '')
    if (ruc.length !== 11) return

    if (ruc === lastLookedRuc) return
    setIsSearchingRuc(true)
    setLastLookedRuc(ruc)

    const result = await suppliersRest.lookupRuc(ruc)
    setIsSearchingRuc(false)

    if (!result) return
    if (!result.found) {
      await Swal.fire({
        icon: 'info',
        title: 'RUC no encontrado',
        text: 'No se encontro en el API externo. Puedes completar los datos manualmente.'
      })
      return
    }

    applyProviderData(result.provider || {})
  }

  const onRucChanged = (e) => {
    const normalized = (e.target.value ?? '').replace(/\D+/g, '').slice(0, 11)
    rucRef.current.value = normalized

    if (rucLookupTimeoutRef.current) clearTimeout(rucLookupTimeoutRef.current)
    if (normalized.length !== 11) return

    rucLookupTimeoutRef.current = setTimeout(() => {
      lookupRuc(normalized)
    }, 450)
  }

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    setIsSearchingRuc(false)
    setLastLookedRuc('')
    clearSupplierForm()

    if (data?.id) {
      idRef.current.value = data.id
      rucRef.current.value = data.ruc ?? ''
      businessNameRef.current.value = data.business_name ?? ''
      tradeNameRef.current.value = data.trade_name ?? ''
      addressRef.current.value = data.address ?? ''
      phoneRef.current.value = data.phone ?? ''
      mobileRef.current.value = data.mobile ?? ''
      contactNameRef.current.value = data.contact_name ?? ''
      contactPositionRef.current.value = data.contact_position ?? ''
      contactPhoneRef.current.value = data.contact_phone ?? ''
      contactEmailRef.current.value = data.contact_email ?? ''
      email1Ref.current.value = data.email_1 ?? ''
      email2Ref.current.value = data.email_2 ?? ''
      businessLineRef.current.value = data.business_line ?? ''
      billingTypeRef.current.value = data.billing_type ?? ''
      creditTypeRef.current.value = data.credit_type ?? ''
      setPaymentCondition(data.payment_condition ?? '')
      bankRef.current.value = data.bank ?? ''
      bankAccountCciRef.current.value = data.bank_account_cci ?? ''
      paymentSystemRef.current.value = data.payment_system ?? ''
      paymentTermDaysRef.current.value = data.payment_term_days ?? ''
      evaluationRef.current.value = data.evaluation ?? ''
    }

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      ruc: (rucRef.current.value ?? '').replace(/\D+/g, ''),
      business_name: businessNameRef.current.value.trim(),
      trade_name: tradeNameRef.current.value.trim(),
      address: addressRef.current.value.trim(),
      phone: phoneRef.current.value.trim(),
      mobile: mobileRef.current.value.trim(),
      contact_name: contactNameRef.current.value.trim(),
      contact_position: contactPositionRef.current.value.trim(),
      contact_phone: contactPhoneRef.current.value.trim(),
      contact_email: contactEmailRef.current.value.trim(),
      email_1: email1Ref.current.value.trim(),
      email_2: email2Ref.current.value.trim(),
      business_line: businessLineRef.current.value.trim(),
      billing_type: billingTypeRef.current.value.trim(),
      credit_type: creditTypeRef.current.value.trim(),
      payment_condition: paymentCondition || '',
      bank: bankRef.current.value.trim(),
      bank_account_cci: bankAccountCciRef.current.value.trim(),
      payment_system: paymentSystemRef.current.value.trim(),
      payment_term_days: paymentTermDaysRef.current.value.trim(),
      evaluation: evaluationRef.current.value.trim(),
    }

    const result = await suppliersRest.save(request)
    if (!result) return

    refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await suppliersRest.boolean({ id, field, value })
    if (!result) return
    refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar proveedor',
      text: 'Estas seguro de eliminar este proveedor? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await suppliersRest.delete(id)
    if (!result) return
    refresh()
  }

  const onImportModalOpen = () => {
    setImportRows([])
    setImportHeaders([])
    setImportFileName('')
    setMapping({
      ruc: '',
      business_name: '',
      address: '',
      phone: '',
      email_1: '',
      bank_account_cci: '',
      payment_condition: '',
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
      ruc: findByNames(['ruc', 'doc', 'documento']),
      business_name: findByNames(['razonsocial', 'razonsocialonombre', 'businessname', 'nombre', 'proveedor']),
      address: findByNames(['direccion', 'address', 'domicilio']),
      phone: findByNames(['telefono', 'phone', 'celular', 'movil']),
      email_1: findByNames(['email', 'correo', 'correoelectronico', 'mail']),
      bank_account_cci: findByNames(['cuentabancariacci', 'cuentabancaria', 'cci', 'banco']),
      payment_condition: findByNames(['condicionpago', 'condiciondepago', 'paymentcondition', 'pago']),
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
      const suggestedMapping = autoMapHeaders(headers)

      setImportRows(rows)
      setImportHeaders(headers)
      setImportFileName(file.name)
      setMapping(suggestedMapping)
    } catch (error) {
      setImportRows([])
      setImportHeaders([])
      setImportFileName('')
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

    if (!mapping.ruc || !mapping.business_name) {
      Swal.fire({ icon: 'warning', title: 'Campos obligatorios', text: 'Debes mapear RUC y Razon Social' })
      return
    }

    setIsImporting(true)
    const result = await suppliersRest.importRows({
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
    ruc: mapping.ruc ? (row[mapping.ruc] ?? '') : '',
    business_name: mapping.business_name ? (row[mapping.business_name] ?? '') : '',
    address: mapping.address ? (row[mapping.address] ?? '') : '',
    phone: mapping.phone ? (row[mapping.phone] ?? '') : '',
    email_1: mapping.email_1 ? (row[mapping.email_1] ?? '') : '',
    bank_account_cci: mapping.bank_account_cci ? (row[mapping.bank_account_cci] ?? '') : '',
    payment_condition: mapping.payment_condition ? (row[mapping.payment_condition] ?? '') : '',
    status: mapping.status ? (row[mapping.status] ?? '') : '',
  }))

  const rowActions = (row) => [
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
    { icon: 'mdi mdi-delete', title: 'Eliminar proveedor', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
  ]

  return (<>
    <VdTable
      ref={tableRef}
      rest={suppliersRest}
      icon="mdi mdi-truck-delivery"
      title={moduleTitle}
      unit="proveedores"
      defaultSort={{ field: 'business_name', desc: false }}
      defaultPageSize={25}
      searchFields={['ruc', 'business_name', 'trade_name', 'address', 'phone', 'mobile', 'contact_phone', 'email_1', 'contact_email', 'bank_account_cci']}
      searchPlaceholder="Buscar por RUC, razón social, dirección…"
      emptyText="No se encontraron proveedores."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-soft" title="Importar masivamente" onClick={() => onImportModalOpen()}>
          <i className="mdi mdi-upload"></i> Importar
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen()}>
          <i className="mdi mdi-plus"></i> Nuevo proveedor
        </button>
      </>}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'ruc', label: 'RUC', field: 'ruc', width: '130px', filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar proveedor">
              {row.ruc || '-'}
            </a>
          ),
        },
        { key: 'business_name', label: 'Razón Social', field: 'business_name', filter: { type: 'text' } },
        { key: 'trade_name', label: 'Nombre comercial', field: 'trade_name', visible: false, filter: { type: 'text' } },
        { key: 'address', label: 'Dirección', field: 'address', filter: { type: 'text' } },
        {
          key: 'phone_display', label: 'Teléfono', field: 'phone', width: '140px', sortable: false,
          filter: { type: 'text', fields: ['phone', 'mobile', 'contact_phone'] },
          render: (row) => row.phone || row.mobile || row.contact_phone || '',
        },
        {
          key: 'email_display', label: 'Email', field: 'email_1', sortable: false,
          filter: { type: 'text', fields: ['email_1', 'contact_email', 'email_2'] },
          render: (row) => row.email_1 || row.contact_email || row.email_2 || '',
        },
        { key: 'bank_account_cci', label: 'Cuenta / CCI', field: 'bank_account_cci', filter: { type: 'text' } },
        { key: 'contact_name', label: 'Contacto', field: 'contact_name', visible: false, sortable: false },
        { key: 'contact_position', label: 'Cargo contacto', field: 'contact_position', visible: false, sortable: false },
        { key: 'contact_phone', label: 'Celular contacto', field: 'contact_phone', width: '130px', visible: false, sortable: false },
        { key: 'contact_email', label: 'Email contacto', field: 'contact_email', visible: false, sortable: false },
        { key: 'business_line', label: 'Giro del negocio', field: 'business_line', visible: false, sortable: false },
        { key: 'billing_type', label: 'Tipo de facturacion', field: 'billing_type', visible: false, sortable: false },
        { key: 'credit_type', label: 'Tipo de credito', field: 'credit_type', visible: false, sortable: false },
        { key: 'payment_condition', label: 'Condición pago', field: 'payment_condition', width: '130px', filter: { type: 'text' } },
        { key: 'bank', label: 'Banco', field: 'bank', visible: false, sortable: false },
        { key: 'payment_system', label: 'Sistema de pago', field: 'payment_system', visible: false, sortable: false },
        { key: 'payment_term_days', label: 'Dias de pago', field: 'payment_term_days', width: '110px', visible: false, sortable: false },
        { key: 'evaluation', label: 'Evaluacion', field: 'evaluation', visible: false, sortable: false },
        {
          key: 'creador', label: 'Creado por', field: 'creator.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.creator),
        },
        {
          key: 'actualizador', label: 'Actualizado por', field: 'updater.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.updater),
        },
        {
          key: 'status', label: 'Estado', field: 'status', width: '110px',
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
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.business_name}</p>
              <small className="text-muted">RUC {row.ruc || '-'}</small>
            </div>
            {row.status !== null && (
              <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>
            )}
          </div>
          {row.address && <p className="text-muted mb-0 mt-2" style={{ fontSize: 12 }}>{row.address}</p>}
          <small className="text-muted d-block mt-2">
            {(row.phone || row.mobile || row.contact_phone) && <><i className="mdi mdi-phone me-1"></i>{row.phone || row.mobile || row.contact_phone}</>}
            {(row.email_1 || row.contact_email || row.email_2) && <><i className="mdi mdi-email-outline ms-3 me-1"></i>{row.email_1 || row.contact_email || row.email_2}</>}
          </small>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar proveedor' : 'Agregar proveedor'} onSubmit={onModalSubmit} size='lg'>
      <div className='row'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup
          eRef={rucRef}
          label={`RUC${isSearchingRuc ? ' (consultando...)' : ''}`}
          col='col-md-4'
          required
          max={11}
          onChange={onRucChanged}
          onKeyDown={(e) => {
            if (e.ctrlKey || e.metaKey) return
            if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) e.preventDefault()
          }}
        />
        <InputFormGroup eRef={businessNameRef} label='Razon Social' col='col-md-8' required disabled={isSearchingRuc} />

        <InputFormGroup eRef={tradeNameRef} label='Nombre comercial' col='col-md-6' disabled={isSearchingRuc} />
        <InputFormGroup eRef={businessLineRef} label='Giro del Negocio' col='col-md-6' disabled={isSearchingRuc} />

        <InputFormGroup eRef={addressRef} label='Direccion' col='col-12' disabled={isSearchingRuc} />

        <InputFormGroup eRef={phoneRef} label='Telefono fijo' col='col-md-3' disabled={isSearchingRuc} />
        <InputFormGroup eRef={mobileRef} label='Telefono celular' col='col-md-3' disabled={isSearchingRuc} />
        <InputFormGroup eRef={email1Ref} label='Correo Electronico 1' col='col-md-3' type='email' disabled={isSearchingRuc} />
        <InputFormGroup eRef={email2Ref} label='Correo Electronico 2' col='col-md-3' type='email' disabled={isSearchingRuc} />

        <InputFormGroup eRef={contactNameRef} label='Contacto principal' col='col-md-4' />
        <InputFormGroup eRef={contactPositionRef} label='Cargo del contacto' col='col-md-4' />
        <InputFormGroup eRef={contactPhoneRef} label='Telefono contacto' col='col-md-4' />

        <InputFormGroup eRef={contactEmailRef} label='Correo contacto' col='col-md-4' type='email' />
        <InputFormGroup eRef={billingTypeRef} label='Tipo de Facturacion' col='col-md-4' disabled={isSearchingRuc} />
        <InputFormGroup eRef={creditTypeRef} label='Tipo de Credito' col='col-md-4' disabled={isSearchingRuc} />

        <VdSelect
          label='Condicion de pago'
          col='col-md-4'
          disabled={isSearchingRuc}
          value={paymentCondition}
          onChange={setPaymentCondition}
          options={[{ value: 'Contado', label: 'Contado' }, { value: 'Credito', label: 'Credito' }]}
          placeholder='No definido'
        />
        <InputFormGroup eRef={paymentSystemRef} label='Sistema de Pago' col='col-md-4' disabled={isSearchingRuc} />
        <InputFormGroup eRef={paymentTermDaysRef} label='Dias de pago' col='col-md-4' type='number' min='0' />
        <InputFormGroup eRef={bankRef} label='Banco' col='col-md-4' disabled={isSearchingRuc} />

        <InputFormGroup eRef={bankAccountCciRef} label='Cuenta Bancaria / CCI' col='col-12' disabled={isSearchingRuc} />

        <div className='form-group col-12 mb-2'>
          <label className='form-label mb-1'>Evaluacion</label>
          <textarea ref={evaluationRef} className='form-control' rows={3} disabled={isSearchingRuc}></textarea>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={importModalRef}
      title='Importacion masiva de proveedores'
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
          <small className='text-muted'>Clave de sincronizacion: <b>RUC</b>. Si existe se actualiza, si no existe se crea.</small>
          {importFileName && <div className='mt-1'><small className='text-muted'>Archivo: {importFileName} ({importRows.length} filas)</small></div>}
        </div>

        <div className='col-lg-4'>
          <div className='card border'>
            <div className='card-body'>
              <h5 className='card-title mb-2'>Mapeo de columnas</h5>
              {[
                ['ruc', 'RUC *'],
                ['business_name', 'Razon social *'],
                ['address', 'Direccion'],
                ['phone', 'Telefono/Celular'],
                ['email_1', 'Correo'],
                ['bank_account_cci', 'Cuenta / CCI'],
                ['payment_condition', 'Condicion pago'],
                ['status', 'Estado'],
              ].map(([key, label]) => (
                <VdSelect
                  key={key}
                  label={label}
                  col='col-12'
                  value={mapping[key]}
                  onChange={(value) => setMapping((old) => ({ ...old, [key]: value }))}
                  options={[{ value: '', label: '-- No mapear --' }, ...importHeaders.map(header => ({ value: header, label: header }))]}
                  placeholder='-- No mapear --'
                />
              ))}
            </div>
          </div>
        </div>

        <div className='col-lg-8'>
          <div className='card border'>
            <div className='card-body'>
              <h5 className='card-title mb-2'>Vista previa</h5>
              {!previewRows.length && <p className='text-muted mb-0'>Carga un archivo para ver una muestra.</p>}
              {!!previewRows.length && (
                <div className='table-responsive'>
                  <table className='table table-sm table-bordered mb-0'>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>RUC</th>
                        <th>Razon Social</th>
                        <th>Direccion</th>
                        <th>Telefono</th>
                        <th>Correo</th>
                        <th>Cuenta / CCI</th>
                        <th>Condicion</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map(item => (
                        <tr key={`preview-${item.row}`}>
                          <td>{item.row}</td>
                          <td>{item.ruc}</td>
                          <td>{item.business_name}</td>
                          <td>{item.address}</td>
                          <td>{item.phone}</td>
                          <td>{item.email_1}</td>
                          <td>{item.bank_account_cci}</td>
                          <td>{item.payment_condition}</td>
                          <td>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can(scopedPermission('suppliers')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Proveedores'}>
    <Suppliers {...properties} />
  </BaseAdminto>);
})
