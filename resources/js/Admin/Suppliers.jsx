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

const Suppliers = () => {
  const gridRef = useRef()
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
      bank: bankRef.current.value.trim(),
      bank_account_cci: bankAccountCciRef.current.value.trim(),
      payment_system: paymentSystemRef.current.value.trim(),
      payment_term_days: paymentTermDaysRef.current.value.trim(),
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
        { dataField: 'trade_name', caption: 'Nombre comercial', minWidth: 180, visible: false },
        { dataField: 'address', caption: 'Direccion', minWidth: 220 },
        {
          dataField: 'phone_display',
          caption: 'Telefono',
          width: 140,
          calculateCellValue: (data) => data.phone || data.mobile || data.contact_phone || ''
        },
        {
          dataField: 'email_display',
          caption: 'Email',
          minWidth: 180,
          calculateCellValue: (data) => data.email_1 || data.contact_email || data.email_2 || ''
        },
        { dataField: 'bank_account_cci', caption: 'Cuenta / CCI', minWidth: 170 },
        { dataField: 'contact_name', caption: 'Contacto', minWidth: 160, visible: false },
        { dataField: 'contact_position', caption: 'Cargo contacto', minWidth: 140, visible: false },
        { dataField: 'contact_phone', caption: 'Celular contacto', width: 130, visible: false },
        { dataField: 'contact_email', caption: 'Email contacto', minWidth: 180, visible: false },
        { dataField: 'business_line', caption: 'Giro del negocio', visible: false },
        { dataField: 'billing_type', caption: 'Tipo de facturacion', visible: false },
        { dataField: 'credit_type', caption: 'Tipo de credito', visible: false },
        { dataField: 'bank', caption: 'Banco', visible: false },
        { dataField: 'payment_system', caption: 'Sistema de pago', visible: false },
        { dataField: 'payment_term_days', caption: 'Dias de pago', width: 110, visible: false },
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
                ['status', 'Estado'],
              ].map(([key, label]) => (
                <div className='form-group mb-2' key={key}>
                  <label className='form-label mb-1'>{label}</label>
                  <select
                    className='form-control'
                    value={mapping[key]}
                    onChange={(e) => setMapping((old) => ({ ...old, [key]: e.target.value }))}
                  >
                    <option value=''>-- No mapear --</option>
                    {importHeaders.map(header => <option key={`${key}-${header}`} value={header}>{header}</option>)}
                  </select>
                </div>
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
  createRoot(el).render(<BaseAdminto {...properties} title='Proveedores'>
    <Suppliers {...properties} />
  </BaseAdminto>);
})
