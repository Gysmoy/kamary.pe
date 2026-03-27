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
import SuppliersRest from '../Actions/Admin/SuppliersRest';

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

const Suppliers = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const importModalRef = useRef()
  const importFileRef = useRef()
  const rucLookupTimeoutRef = useRef()

  const idRef = useRef()
  const rucRef = useRef()
  const businessNameRef = useRef()
  const addressRef = useRef()
  const phoneRef = useRef()
  const mobileRef = useRef()
  const email1Ref = useRef()
  const email2Ref = useRef()
  const businessLineRef = useRef()
  const billingTypeRef = useRef()
  const creditTypeRef = useRef()
  const bankRef = useRef()
  const bankAccountCciRef = useRef()
  const paymentSystemRef = useRef()
  const evaluationRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [isSearchingRuc, setIsSearchingRuc] = useState(false)
  const [lastLookedRuc, setLastLookedRuc] = useState('')
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
    status: '',
  })

  const clearSupplierForm = () => {
    idRef.current.value = ''
    rucRef.current.value = ''
    businessNameRef.current.value = ''
    addressRef.current.value = ''
    phoneRef.current.value = ''
    mobileRef.current.value = ''
    email1Ref.current.value = ''
    email2Ref.current.value = ''
    businessLineRef.current.value = ''
    billingTypeRef.current.value = ''
    creditTypeRef.current.value = ''
    bankRef.current.value = ''
    bankAccountCciRef.current.value = ''
    paymentSystemRef.current.value = ''
    evaluationRef.current.value = ''
  }

  const applyProviderData = (provider = {}) => {
    businessNameRef.current.value = provider.business_name ?? businessNameRef.current.value
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
      addressRef.current.value = data.address ?? ''
      phoneRef.current.value = data.phone ?? ''
      mobileRef.current.value = data.mobile ?? ''
      email1Ref.current.value = data.email_1 ?? ''
      email2Ref.current.value = data.email_2 ?? ''
      businessLineRef.current.value = data.business_line ?? ''
      billingTypeRef.current.value = data.billing_type ?? ''
      creditTypeRef.current.value = data.credit_type ?? ''
      bankRef.current.value = data.bank ?? ''
      bankAccountCciRef.current.value = data.bank_account_cci ?? ''
      paymentSystemRef.current.value = data.payment_system ?? ''
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
      address: addressRef.current.value.trim(),
      phone: phoneRef.current.value.trim(),
      mobile: mobileRef.current.value.trim(),
      email_1: email1Ref.current.value.trim(),
      email_2: email2Ref.current.value.trim(),
      business_line: businessLineRef.current.value.trim(),
      billing_type: billingTypeRef.current.value.trim(),
      credit_type: creditTypeRef.current.value.trim(),
      bank: bankRef.current.value.trim(),
      bank_account_cci: bankAccountCciRef.current.value.trim(),
      payment_system: paymentSystemRef.current.value.trim(),
      evaluation: evaluationRef.current.value.trim(),
    }

    const result = await suppliersRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await suppliersRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
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
    $(gridRef.current).dxDataGrid('instance').refresh()
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
    ruc: mapping.ruc ? (row[mapping.ruc] ?? '') : '',
    business_name: mapping.business_name ? (row[mapping.business_name] ?? '') : '',
    address: mapping.address ? (row[mapping.address] ?? '') : '',
    phone: mapping.phone ? (row[mapping.phone] ?? '') : '',
    email_1: mapping.email_1 ? (row[mapping.email_1] ?? '') : '',
    bank_account_cci: mapping.bank_account_cci ? (row[mapping.bank_account_cci] ?? '') : '',
    status: mapping.status ? (row[mapping.status] ?? '') : '',
  }))

  return (<>
    <Table
      gridRef={gridRef}
      title='Proveedores'
      rest={suppliersRest}
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
            hint: 'Agregar proveedor',
            onClick: () => onModalOpen()
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', visible: false },
        { dataField: 'ruc', caption: 'RUC', width: '130px' },
        { dataField: 'business_name', caption: 'Razon Social', minWidth: 220 },
        { dataField: 'mobile', caption: 'Celular', width: '120px' },
        { dataField: 'phone', caption: 'Telefono fijo', width: '120px', visible: false },
        { dataField: 'email_1', caption: 'Correo 1', width: '190px' },
        { dataField: 'email_2', caption: 'Correo 2', width: '190px', visible: false },
        { dataField: 'address', caption: 'Direccion', visible: false },
        { dataField: 'business_line', caption: 'Giro del negocio', visible: false },
        { dataField: 'billing_type', caption: 'Tipo de facturacion', visible: false },
        { dataField: 'credit_type', caption: 'Tipo de credito', visible: false },
        { dataField: 'bank', caption: 'Banco', visible: false },
        { dataField: 'bank_account_cci', caption: 'Cuenta / CCI', visible: false },
        { dataField: 'payment_system', caption: 'Sistema de pago', visible: false },
        { dataField: 'evaluation', caption: 'Evaluacion', visible: false },
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
              title: 'Eliminar proveedor',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
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

        <InputFormGroup eRef={addressRef} label='Direccion' col='col-md-8' disabled={isSearchingRuc} />
        <InputFormGroup eRef={businessLineRef} label='Giro del Negocio' col='col-md-4' disabled={isSearchingRuc} />

        <InputFormGroup eRef={phoneRef} label='Telefono Fijo' col='col-md-3' disabled={isSearchingRuc} />
        <InputFormGroup eRef={mobileRef} label='Telefono Celular' col='col-md-3' disabled={isSearchingRuc} />
        <InputFormGroup eRef={email1Ref} label='Correo Electronico 1' col='col-md-3' type='email' disabled={isSearchingRuc} />
        <InputFormGroup eRef={email2Ref} label='Correo Electronico 2' col='col-md-3' type='email' disabled={isSearchingRuc} />

        <InputFormGroup eRef={billingTypeRef} label='Tipo de Facturacion' col='col-md-4' disabled={isSearchingRuc} />
        <InputFormGroup eRef={creditTypeRef} label='Tipo de Credito' col='col-md-4' disabled={isSearchingRuc} />
        <InputFormGroup eRef={paymentSystemRef} label='Sistema de Pago' col='col-md-4' disabled={isSearchingRuc} />

        <InputFormGroup eRef={bankRef} label='Banco' col='col-md-4' disabled={isSearchingRuc} />
        <InputFormGroup eRef={bankAccountCciRef} label='Cuenta Bancaria / CCI' col='col-md-8' disabled={isSearchingRuc} />

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

        <div className='col-md-4 mb-2'>
          <label className='form-label'>Mapeo: RUC *</label>
          <select className='form-select' value={mapping.ruc} onChange={e => setMapping(prev => ({ ...prev, ruc: e.target.value }))}>
            <option value=''>Sin mapear</option>
            {importHeaders.map(header => <option key={`ruc-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Mapeo: Razon Social *</label>
          <select className='form-select' value={mapping.business_name} onChange={e => setMapping(prev => ({ ...prev, business_name: e.target.value }))}>
            <option value=''>Sin mapear</option>
            {importHeaders.map(header => <option key={`business_name-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Mapeo: Direccion</label>
          <select className='form-select' value={mapping.address} onChange={e => setMapping(prev => ({ ...prev, address: e.target.value }))}>
            <option value=''>Sin mapear</option>
            {importHeaders.map(header => <option key={`address-${header}`} value={header}>{header}</option>)}
          </select>
        </div>

        <div className='col-md-4 mb-2'>
          <label className='form-label'>Mapeo: Telefono</label>
          <select className='form-select' value={mapping.phone} onChange={e => setMapping(prev => ({ ...prev, phone: e.target.value }))}>
            <option value=''>Sin mapear</option>
            {importHeaders.map(header => <option key={`phone-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Mapeo: Email</label>
          <select className='form-select' value={mapping.email_1} onChange={e => setMapping(prev => ({ ...prev, email_1: e.target.value }))}>
            <option value=''>Sin mapear</option>
            {importHeaders.map(header => <option key={`email_1-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Mapeo: Cuenta bancaria / CCI</label>
          <select className='form-select' value={mapping.bank_account_cci} onChange={e => setMapping(prev => ({ ...prev, bank_account_cci: e.target.value }))}>
            <option value=''>Sin mapear</option>
            {importHeaders.map(header => <option key={`bank_account_cci-${header}`} value={header}>{header}</option>)}
          </select>
        </div>

        <div className='col-md-4 mb-2'>
          <label className='form-label'>Mapeo: Estado</label>
          <select className='form-select' value={mapping.status} onChange={e => setMapping(prev => ({ ...prev, status: e.target.value }))}>
            <option value=''>Sin mapear</option>
            {importHeaders.map(header => <option key={`status-${header}`} value={header}>{header}</option>)}
          </select>
        </div>

        <div className='col-12 mt-2'>
          <h6 className='mb-2'>Vista previa (primeros 5)</h6>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>RUC</th>
                  <th>Razon Social</th>
                  <th>Direccion</th>
                  <th>Telefono</th>
                  <th>Email</th>
                  <th>Cuenta / CCI</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.length === 0 && <tr><td colSpan='8' className='text-center text-muted py-3'>Carga archivo y mapea columnas para previsualizar</td></tr>}
                {previewRows.map(item => (
                  <tr key={`preview-${item.row}`}>
                    <td>{item.row}</td>
                    <td>{item.ruc?.toString?.() ?? ''}</td>
                    <td>{item.business_name?.toString?.() ?? ''}</td>
                    <td>{item.address?.toString?.() ?? ''}</td>
                    <td>{item.phone?.toString?.() ?? ''}</td>
                    <td>{item.email_1?.toString?.() ?? ''}</td>
                    <td>{item.bank_account_cci?.toString?.() ?? ''}</td>
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
  if (!properties.can('suppliers') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Proveedores'>
    <Suppliers {...properties} />
  </BaseAdminto>);
})
