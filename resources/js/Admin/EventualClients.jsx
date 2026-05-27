import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import EventualClientsRest from '../Actions/Admin/EventualClientsRest';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { getCommercialOrderStatusLabel } from '../Utils/statusLabels';

const eventualClientsRest = new EventualClientsRest()

const setRefValue = (ref, value) => {
  if (!ref?.current) return
  ref.current.value = value ?? ''
}

const getRefValue = (ref) => ref?.current?.value ?? ''
const normalizePrefix = (value) => (value ?? '').toString().replace(/\D+/g, '')
const normalizeDocumentType = (value) => `${value ?? ''}`.trim().toUpperCase()

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

const renderClientStatusBadge = (container, active) => {
  const enabled = active === true || active === 1 || active === '1'
  container.html(`<span class="badge ${enabled ? 'bg-soft-success text-success border border-success' : 'bg-soft-secondary text-secondary border border-secondary'}">${enabled ? 'Activo' : 'Inactivo'}</span>`)
}

const contractDueLabel = (days) => {
  const value = Number(days || 0)
  if (!Number.isFinite(value) || value <= 0) return 'SIN CONTRATO ACTIVO'
  return `${value} dia${value === 1 ? '' : 's'}`
}

const renderContractDue = (container, days) => {
  const value = Number(days || 0)
  if (Number.isFinite(value) && value > 0) {
    container.html(`<span class="badge bg-soft-success text-success border border-success">${contractDueLabel(value)}</span>`)
    return
  }
  container.text('SIN CONTRATO ACTIVO')
}

const orderStatusClass = (status) => ({
  draft: 'bg-soft-secondary text-secondary border border-secondary',
  pending: 'bg-soft-warning text-warning border border-warning',
  confirmed: 'bg-soft-info text-info border border-info',
  preparing: 'bg-soft-primary text-primary border border-primary',
  in_route: 'bg-soft-primary text-primary border border-primary',
  delivered: 'bg-soft-success text-success border border-success',
  dispatched: 'bg-soft-info text-info border border-info',
  billed: 'bg-soft-success text-success border border-success',
  closed: 'bg-soft-dark text-dark border border-dark',
  cancelled: 'bg-soft-danger text-danger border border-danger',
}[`${status ?? ''}`] ?? 'bg-soft-secondary text-secondary border border-secondary')

const renderOrderStatusBadge = (container, status) => {
  container.html(`<span class="badge ${orderStatusClass(status)}">${getCommercialOrderStatusLabel(status)}</span>`)
}

const paymentLabel = (data) => {
  const value = `${data?.payment_label ?? ''}`.trim()
  if (value) return value
  const method = `${data?.payment_method ?? '-'}`.trim() || '-'
  const condition = `${data?.payment_condition ?? ''}`.trim()
  return condition ? `${method} [${condition}]` : method
}

const customerLabel = (data) => {
  const direct = `${data?.customer_label ?? ''}`.trim()
  if (direct) return direct
  const client = data?.eventual_client ?? data?.eventualClient
  return `${client?.document_number ?? ''} | ${client?.business_name ?? ''}`.trim().replace(/^\|\s*/, '') || '-'
}

const EventualClients = ({ prefixes = [], sectionTitle = 'Clientes Eventuales', requiredPermission = 'eventual-clients' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const ordersModalRef = useRef()
  const ordersGridRef = useRef()
  const lookupTimeoutRef = useRef()

  const idRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const businessNameRef = useRef()
  const emailRef = useRef()
  const phonePrefixRef = useRef()
  const phoneRef = useRef()
  const shortCodeRef = useRef()
  const contractDueDaysRef = useRef()
  const statusRef = useRef()
  const addressRef = useRef()
  const contactNameRef = useRef()
  const notesRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [documentType, setDocumentType] = useState('dni')
  const [phonePrefix, setPhonePrefix] = useState('51')
  const [statusValue, setStatusValue] = useState('1')
  const [isSearchingDocument, setIsSearchingDocument] = useState(false)
  const [isDocumentDataLocked, setIsDocumentDataLocked] = useState(false)
  const [lastLookedDocumentKey, setLastLookedDocumentKey] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [ordersRest, setOrdersRest] = useState(null)

  const docMaxLength = documentType === 'dni' ? 8 : (documentType === 'ruc' ? 11 : 20)

  const clearForm = () => {
    setRefValue(idRef, '')
    setRefValue(documentTypeRef, 'dni')
    setRefValue(documentNumberRef, '')
    setRefValue(businessNameRef, '')
    setRefValue(emailRef, '')
    setRefValue(phoneRef, '')
    setRefValue(shortCodeRef, '')
    setRefValue(contractDueDaysRef, '')
    setRefValue(addressRef, '')
    setRefValue(contactNameRef, '')
    setRefValue(notesRef, '')
    setDocumentType('dni')
    setPhonePrefix('51')
    setStatusValue('1')
    setRefValue(phonePrefixRef, '51')
    setRefValue(statusRef, '1')
  }

  const applyApiClientData = (client = {}) => {
    if (client.business_name) setRefValue(businessNameRef, client.business_name)
    if (client.email) setRefValue(emailRef, client.email)
    if (client.phone) setRefValue(phoneRef, client.phone)
    if (client.address) setRefValue(addressRef, client.address)
    if (client.contact_name) setRefValue(contactNameRef, client.contact_name)
  }

  const lookupDocument = async (type, number) => {
    if (!['dni', 'ruc'].includes(type)) return
    if (!number || number.length < (type === 'dni' ? 8 : 11)) return

    const key = `${type}:${number}`
    if (key === lastLookedDocumentKey) return

    setIsSearchingDocument(true)
    setLastLookedDocumentKey(key)
    const result = await eventualClientsRest.lookupByDocument(type, number)
    setIsSearchingDocument(false)

    if (!result) return
    if (!result.found || !result.client) {
      setIsDocumentDataLocked(false)
      return
    }

    applyApiClientData(result.client)
    setIsDocumentDataLocked(true)
  }

  const onDocumentTypeChanged = (e) => {
    const nextType = e.target.value || 'dni'
    setDocumentType(nextType)
    setIsDocumentDataLocked(false)
    setLastLookedDocumentKey('')
    setRefValue(documentNumberRef, '')
    setRefValue(businessNameRef, '')
    setRefValue(contactNameRef, '')
  }

  const onDocumentNumberChanged = (e) => {
    const raw = e.target.value ?? ''
    const normalized = raw.replace(/\D+/g, '').slice(0, docMaxLength)
    setRefValue(documentNumberRef, normalized)

    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current)
    setIsDocumentDataLocked(false)

    if (!['dni', 'ruc'].includes(documentType)) return
    const expectedLength = documentType === 'dni' ? 8 : 11
    if (normalized.length !== expectedLength) return

    lookupTimeoutRef.current = setTimeout(() => {
      lookupDocument(documentType, normalized)
    }, 450)
  }

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    clearForm()
    setIsSearchingDocument(false)
    setIsDocumentDataLocked(false)
    setLastLookedDocumentKey('')

    if (data?.id) {
      const nextStatus = data.status === false || data.status === 0 || data.status === '0' ? '0' : '1'
      const normalizedPrefix = normalizePrefix(data.phone_prefix) || '51'

      setDocumentType(data.document_type ?? 'dni')
      setPhonePrefix(normalizedPrefix)
      setStatusValue(nextStatus)

      setRefValue(idRef, data.id)
      setRefValue(documentTypeRef, data.document_type ?? 'dni')
      setRefValue(documentNumberRef, data.document_number ?? '')
      setRefValue(businessNameRef, data.business_name ?? '')
      setRefValue(emailRef, data.email ?? '')
      setRefValue(phoneRef, data.phone ?? '')
      setRefValue(shortCodeRef, data.short_code ?? '')
      setRefValue(contractDueDaysRef, data.contract_due_days ?? '')
      setRefValue(addressRef, data.address ?? '')
      setRefValue(contactNameRef, data.contact_name ?? '')
      setRefValue(notesRef, data.notes ?? '')
      setRefValue(phonePrefixRef, normalizedPrefix)
      setRefValue(statusRef, nextStatus)
    }

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: getRefValue(idRef) || undefined,
      document_type: getRefValue(documentTypeRef),
      document_number: getRefValue(documentNumberRef).replace(/\D+/g, ''),
      business_name: getRefValue(businessNameRef).trim(),
      email: getRefValue(emailRef).trim(),
      phone_prefix: normalizePrefix(getRefValue(phonePrefixRef)),
      phone: getRefValue(phoneRef).trim(),
      short_code: getRefValue(shortCodeRef).trim(),
      contract_due_days: getRefValue(contractDueDaysRef).trim(),
      status: getRefValue(statusRef) === '1',
      address: getRefValue(addressRef).trim(),
      contact_name: getRefValue(contactNameRef).trim(),
      notes: getRefValue(notesRef).trim(),
    }

    const result = await eventualClientsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar cliente eventual',
      text: 'Esta accion dara de baja el registro.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await eventualClientsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onOrdersOpen = (data) => {
    setSelectedClient(data)
    setOrdersRest(eventualClientsRest.orders(data.id))
    $(ordersModalRef.current).modal('show')
  }

  const exportGrid = () => {
    const instance = $(gridRef.current).dxDataGrid('instance')
    if (!instance) return
    instance.exportToExcel(false)
  }

  useEffect(() => () => {
    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current)
  }, [])

  return (<>
    <div className='row g-2 mb-3'>
      <div className='col-md-4'>
        <button type='button' className='btn btn-primary w-100 d-flex align-items-center justify-content-between' onClick={() => onModalOpen()}>
          <span><i className='mdi mdi-plus-circle-outline me-1'></i> Registrar Cliente</span>
          <i className='mdi mdi-account-plus-outline'></i>
        </button>
      </div>
      <div className='col-md-4'>
        <button type='button' className='btn btn-success w-100 d-flex align-items-center justify-content-between' onClick={exportGrid}>
          <span><i className='mdi mdi-file-excel-outline me-1'></i> Exportar Clientes</span>
          <i className='mdi mdi-download-outline'></i>
        </button>
      </div>
    </div>

    <Table
      gridRef={gridRef}
      title={sectionTitle}
      rest={eventualClientsRest}
      pageSize={25}
      exportable
      toolBar={(container) => {
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
            hint: 'Registrar cliente eventual',
            onClick: () => onModalOpen()
          }
        });
      }}
      columns={[
        {
          caption: 'Acciones',
          width: 120,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger ms-1',
              title: 'Eliminar',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-info ms-1',
              title: 'Ver pedidos del cliente',
              icon: 'mdi mdi-view-grid-outline',
              onClick: () => onOrdersOpen(data)
            }))
          },
          allowFiltering: false,
          allowSorting: false,
          allowExporting: false
        },
        { dataField: 'id', caption: 'ID', width: 80 },
        {
          dataField: 'document_type',
          caption: 'Tipo documento',
          width: 140,
          calculateCellValue: (data) => normalizeDocumentType(data.document_type)
        },
        { dataField: 'document_number', caption: 'N documento', width: 135 },
        {
          dataField: 'business_name',
          caption: 'Razon social',
          minWidth: 260,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.business_name, () => onModalOpen(data), 'Editar cliente eventual')
        },
        { dataField: 'email', caption: 'Email', minWidth: 180 },
        { dataField: 'address', caption: 'Direccion', minWidth: 260 },
        {
          dataField: 'contract_due_days',
          caption: 'Dias vcto. contrato',
          width: 160,
          cellTemplate: (container, { data }) => renderContractDue(container, data.contract_due_days)
        },
        {
          dataField: 'status',
          caption: 'Estado',
          width: 110,
          dataType: 'boolean',
          cellTemplate: (container, { data }) => renderClientStatusBadge(container, data.status)
        },
        { dataField: 'short_code', caption: 'Codigo corto', width: 130, visible: false },
        {
          dataField: 'mobile_full',
          caption: 'Celular',
          width: 140,
          visible: false,
          calculateCellValue: (data) => {
            const prefix = normalizePrefix(data.phone_prefix)
            return `${prefix ? `+${prefix}` : ''} ${data.phone ?? ''}`.trim()
          }
        },
        {
          dataField: 'creator.fullname',
          caption: 'Creado por',
          visible: false,
          allowFiltering: false,
          cellTemplate: (container, { data }) => container.text(formatAuditUser(data.creator))
        },
        {
          dataField: 'updater.fullname',
          caption: 'Actualizado por',
          visible: false,
          allowFiltering: false,
          cellTemplate: (container, { data }) => container.text(formatAuditUser(data.updater))
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar cliente eventual' : 'Cliente eventual'} onSubmit={onModalSubmit} size='xl' btnSubmitText={isEditing ? 'Guardar cambios' : 'Registrar'}>
      <div className='row'>
        <input ref={idRef} type='hidden' />

        <SelectFormGroup
          eRef={documentTypeRef}
          label='Tipo de Documento'
          col='col-md-6'
          required
          disabled={isEditing}
          value={documentType}
          onChange={onDocumentTypeChanged}
          effectWith={[documentType]}
        >
          <option value='dni'>DNI</option>
          <option value='ce'>CE</option>
          <option value='ruc'>RUC</option>
        </SelectFormGroup>

        <InputFormGroup
          eRef={documentNumberRef}
          label={`N Documento${isSearchingDocument ? ' (consultando...)' : ''}`}
          col='col-md-6'
          required
          disabled={isEditing}
          max={docMaxLength}
          onChange={onDocumentNumberChanged}
          onKeyDown={(e) => {
            if (e.ctrlKey || e.metaKey) return
            if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) e.preventDefault()
          }}
        />

        <InputFormGroup
          eRef={businessNameRef}
          label='Razon Social'
          col='col-12'
          required
          disabled={isDocumentDataLocked}
        />

        <InputFormGroup eRef={emailRef} label='Emails' col='col-md-6' />

        <SelectFormGroup
          eRef={phonePrefixRef}
          label='Prefijo'
          col='col-md-2'
          value={phonePrefix}
          onChange={(e) => setPhonePrefix(normalizePrefix(e.target.value))}
          effectWith={[phonePrefix]}
        >
          {!prefixes.length && <option value='51'>+51 - Peru</option>}
          {prefixes.map((prefix, idx) => (
            <option key={`prefix-${idx}`} value={prefix.realCode}>
              {prefix.beautyCode} - {prefix.country}
            </option>
          ))}
        </SelectFormGroup>

        <InputFormGroup eRef={phoneRef} label='Celular' col='col-md-4' />
        <InputFormGroup eRef={shortCodeRef} label='Codigo corto' col='col-md-4' uppercase />
        <InputFormGroup eRef={contractDueDaysRef} label='Dias vcto. contrato' col='col-md-4' type='number' min='0' />

        <SelectFormGroup
          eRef={statusRef}
          label='Estado'
          col='col-md-4'
          required
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value)}
          effectWith={[statusValue]}
        >
          <option value='1'>ACTIVO</option>
          <option value='0'>INACTIVO</option>
        </SelectFormGroup>

        <InputFormGroup eRef={addressRef} label='Direccion' col='col-12' />
        <InputFormGroup eRef={contactNameRef} label='Contacto' col='col-md-6' />

        <div className='form-group col-md-6 mb-2'>
          <label className='form-label mb-1'>Notas</label>
          <textarea ref={notesRef} className='form-control' rows='2'></textarea>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={ordersModalRef}
      title={<div className='d-flex flex-wrap align-items-center gap-2'>
        <h4 className='modal-title mb-0'>Pedidos del cliente eventual</h4>
        {selectedClient && <span className='badge badge-soft-secondary'>{selectedClient.document_number} - {selectedClient.business_name}</span>}
      </div>}
      size='xl'
      hideFooter
      onSubmit={(e) => e.preventDefault()}
    >
      {ordersRest && <Table
        key={`eventual-client-orders-${selectedClient?.id ?? 'none'}`}
        gridRef={ordersGridRef}
        title='Pedidos'
        rest={ordersRest}
        pageSize={10}
        columns={[
          {
            dataField: 'order_status',
            caption: 'Estado',
            width: 135,
            cellTemplate: (container, { data }) => renderOrderStatusBadge(container, data.order_status)
          },
          { dataField: 'voucher_label', caption: 'Comprobante', width: 145, allowFiltering: false, allowSearch: false, calculateCellValue: (data) => data.voucher_label || '-' },
          { dataField: 'document_type', caption: 'Tipo documento', width: 150 },
          { dataField: 'customer_label', caption: 'Cliente', minWidth: 260, allowFiltering: false, allowSearch: false, calculateCellValue: customerLabel },
          { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
          { dataField: 'payment_label', caption: 'Tipo de pago', width: 180, allowFiltering: false, allowSearch: false, calculateCellValue: paymentLabel },
          { dataField: 'seller_label', caption: 'Usuario', width: 190, allowFiltering: false, allowSearch: false, calculateCellValue: (data) => data.seller_label || formatAuditUser(data.seller) || '-' },
          { dataField: 'created_at', caption: 'Fecha registro', width: 170, dataType: 'datetime' },
          { dataField: 'creator_label', caption: 'Usuario registro', width: 170, allowFiltering: false, allowSearch: false, calculateCellValue: (data) => data.creator_label || formatAuditUser(data.creator) || '-' },
          { dataField: 'code', caption: 'Codigo', width: 140 },
          { dataField: 'business_label', caption: 'Empresa', width: 190, allowFiltering: false, allowSearch: false, calculateCellValue: (data) => data.business_label || data.business?.name || '-' },
        ]}
        toolBar={(container) => {
          container.unshift({
            widget: 'dxButton', location: 'after',
            options: {
              icon: 'refresh',
              hint: 'Refrescar pedidos',
              onClick: () => $(ordersGridRef.current).dxDataGrid('instance').refresh()
            }
          });
        }}
      />}
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  const canAccess = properties.can(properties.requiredPermission) || properties.hasRole('Admin')
  if (!canAccess) location.href = '/admin/'

  createRoot(el).render(<BaseAdminto {...properties} title={properties.sectionTitle ?? 'Clientes Eventuales'}>
    <EventualClients {...properties} />
  </BaseAdminto>);
})
