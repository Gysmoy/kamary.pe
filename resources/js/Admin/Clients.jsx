import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import ClientsRest from '../Actions/Admin/ClientsRest';

const clientsRest = new ClientsRest()

const setRefValue = (ref, value) => {
  if (!ref?.current) return
  ref.current.value = value
}

const getRefValue = (ref) => {
  if (!ref?.current) return ''
  return ref.current.value ?? ''
}

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

const normalizePrefix = (value) => (value ?? '').toString().replace(/\D+/g, '')

const booleanLabel = (value) => value ? 'Si' : 'No'

const Clients = ({
  prefixes = [],
  sectionTitle = 'Clientes',
  filterValue = null,
  defaultClientKind = 'regular',
  requiredPermission = 'clients'
}) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const lookupTimeoutRef = useRef()
  const pendingModalDataRef = useRef(null)

  const idRef = useRef()
  const clientKindRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const fullNameRef = useRef()
  const isPlatformRef = useRef()
  const hasStorageServiceRef = useRef()
  const contractDueDaysRef = useRef()
  const commercialChannelRef = useRef()
  const segmentRef = useRef()
  const emailRef = useRef()
  const billingEmailRef = useRef()
  const primaryContactRef = useRef()
  const primaryContactPhoneRef = useRef()
  const phoneRef = useRef()
  const phonePrefixRef = useRef()
  const shortCodeRef = useRef()
  const ubigeoRef = useRef()
  const addressRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [clientKind, setClientKind] = useState(defaultClientKind)
  const [documentType, setDocumentType] = useState('dni')
  const [isSearchingDocument, setIsSearchingDocument] = useState(false)
  const [isDocumentDataLocked, setIsDocumentDataLocked] = useState(false)
  const [lastLookedDocumentKey, setLastLookedDocumentKey] = useState('')
  const [phonePrefix, setPhonePrefix] = useState('51')
  const [platformValue, setPlatformValue] = useState('0')
  const [storageServiceValue, setStorageServiceValue] = useState('0')

  const isRuc = documentType === 'ruc'
  const docMaxLength = documentType === 'dni' ? 8 : (documentType === 'ruc' ? 11 : 20)
  const kindLabel = clientKind === 'eventual' ? 'Eventual' : 'Regular'

  const clearForm = () => {
    setRefValue(idRef, '')
    setRefValue(clientKindRef, defaultClientKind)
    setRefValue(documentTypeRef, 'dni')
    setRefValue(documentNumberRef, '')
    setRefValue(fullNameRef, '')
    setPlatformValue('0')
    setStorageServiceValue('0')
    setRefValue(isPlatformRef, '0')
    setRefValue(hasStorageServiceRef, '0')
    setRefValue(contractDueDaysRef, '')
    setRefValue(commercialChannelRef, '')
    setRefValue(segmentRef, '')
    setRefValue(emailRef, '')
    setRefValue(billingEmailRef, '')
    setRefValue(primaryContactRef, '')
    setRefValue(primaryContactPhoneRef, '')
    setRefValue(phoneRef, '')
    setPhonePrefix('51')
    setRefValue(phonePrefixRef, '51')
    setRefValue(shortCodeRef, '')
    setRefValue(ubigeoRef, '')
    setRefValue(addressRef, '')
  }

  const applyApiClientData = (client = {}) => {
    if (client.full_name || client.business_name) setRefValue(fullNameRef, client.full_name ?? client.business_name)
    if (client.email) {
      setRefValue(emailRef, client.email)
      setRefValue(billingEmailRef, client.email)
    }
    if (client.phone) {
      setRefValue(phoneRef, client.phone)
      setRefValue(primaryContactPhoneRef, client.phone)
    }
    if (client.full_address) setRefValue(addressRef, client.full_address)
  }

  const lookupDocument = async (type, number) => {
    if (!['dni', 'ruc'].includes(type)) return
    if (!number || number.length < (type === 'dni' ? 8 : 11)) return

    const key = `${type}:${number}`
    if (key === lastLookedDocumentKey) return

    setIsSearchingDocument(true)
    setLastLookedDocumentKey(key)
    const result = await clientsRest.lookupByDocument(type, number)
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
    setRefValue(fullNameRef, '')
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

  const populateModalData = (data) => {
    setRefValue(idRef, data.id)
    setRefValue(clientKindRef, data.client_kind ?? defaultClientKind)
    setClientKind(data.client_kind ?? defaultClientKind)
    setRefValue(documentTypeRef, data.document_type ?? 'dni')
    setRefValue(documentNumberRef, data.document_number ?? '')
    setRefValue(fullNameRef, data.full_name ?? data.business_name ?? '')
    const nextPlatformValue = data.is_platform ? '1' : '0'
    const nextStorageValue = data.has_storage_service ? '1' : '0'
    setPlatformValue(nextPlatformValue)
    setStorageServiceValue(nextStorageValue)
    setRefValue(isPlatformRef, nextPlatformValue)
    setRefValue(hasStorageServiceRef, nextStorageValue)
    setRefValue(contractDueDaysRef, data.contract_due_days ?? '')
    setRefValue(commercialChannelRef, data.commercial_channel ?? '')
    setRefValue(segmentRef, data.segment ?? '')
    setRefValue(emailRef, data.email ?? '')
    setRefValue(billingEmailRef, data.billing_email ?? '')
    setRefValue(primaryContactRef, data.primary_contact ?? '')
    setRefValue(primaryContactPhoneRef, data.primary_contact_phone ?? '')
    setRefValue(phoneRef, data.phone ?? '')
    const normalizedPrefix = normalizePrefix(data.phone_prefix) || '51'
    setPhonePrefix(normalizedPrefix)
    setRefValue(phonePrefixRef, normalizedPrefix)
    setRefValue(shortCodeRef, data.short_code ?? '')
    setRefValue(ubigeoRef, data.ubigeo ?? '')
    setRefValue(addressRef, data.full_address ?? '')
  }

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    clearForm()
    setIsSearchingDocument(false)
    setIsDocumentDataLocked(false)
    setLastLookedDocumentKey('')

    if (data?.id) {
      const nextType = data.document_type ?? 'dni'
      const currentType = documentType
      setDocumentType(nextType)
      if (nextType !== currentType) {
        pendingModalDataRef.current = data
      } else {
        populateModalData(data)
      }
    } else {
      setClientKind(defaultClientKind)
      setDocumentType('dni')
      setPhonePrefix('51')
      pendingModalDataRef.current = null
    }

    $(modalRef.current).modal('show')
  }

  useEffect(() => {
    if (!pendingModalDataRef.current) return
    populateModalData(pendingModalDataRef.current)
    pendingModalDataRef.current = null
  }, [documentType])

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: getRefValue(idRef) || undefined,
      client_kind: getRefValue(clientKindRef),
      document_type: getRefValue(documentTypeRef),
      document_number: getRefValue(documentNumberRef).replace(/\D+/g, ''),
      full_name: getRefValue(fullNameRef).trim(),
      is_platform: getRefValue(isPlatformRef),
      has_storage_service: getRefValue(hasStorageServiceRef),
      contract_due_days: getRefValue(contractDueDaysRef).trim(),
      commercial_channel: getRefValue(commercialChannelRef).trim(),
      segment: getRefValue(segmentRef).trim(),
      email: getRefValue(emailRef).trim(),
      billing_email: getRefValue(billingEmailRef).trim(),
      primary_contact: getRefValue(primaryContactRef).trim(),
      primary_contact_phone: getRefValue(primaryContactPhoneRef).trim(),
      phone: getRefValue(phoneRef).trim(),
      phone_prefix: normalizePrefix(getRefValue(phonePrefixRef)),
      short_code: getRefValue(shortCodeRef).trim(),
      ubigeo: getRefValue(ubigeoRef).trim(),
      full_address: getRefValue(addressRef).trim(),
    }

    const result = await clientsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await clientsRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar cliente',
      text: 'Estas seguro de eliminar este cliente? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await clientsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const isIdentityBlocked = isEditing || (isDocumentDataLocked && ['dni', 'ruc'].includes(documentType))
  const displayNameLabel = isRuc ? 'Razon Social' : 'Nombre Completo'

  return (<>
    <Table
      gridRef={gridRef}
      title={sectionTitle}
      rest={clientsRest}
      filterValue={filterValue}
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
            title: 'Agregar',
            hint: `Agregar cliente ${kindLabel.toLowerCase()}`,
            onClick: () => onModalOpen()
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', width: 70 },
        { dataField: 'document_type', caption: 'Tipo Doc.', width: 95 },
        { dataField: 'document_number', caption: 'Numero', width: 120 },
        {
          dataField: 'client_kind',
          caption: 'Tipo',
          width: 100,
          calculateCellValue: (data) => data.client_kind === 'eventual' ? 'Eventual' : 'Regular'
        },
        {
          dataField: 'is_platform',
          caption: 'Plataforma',
          width: 100,
          calculateCellValue: (data) => booleanLabel(data.is_platform)
        },
        {
          dataField: 'display_name',
          caption: 'Cliente',
          minWidth: 220,
          calculateCellValue: (data) => data.full_name ?? data.business_name ?? ''
        },
        { dataField: 'email', caption: 'Correo', minWidth: 180 },
        { dataField: 'billing_email', caption: 'Correo Facturacion', minWidth: 180, visible: false },
        {
          dataField: 'mobile_full',
          caption: 'Celular',
          width: 140,
          calculateCellValue: (data) => {
            const prefix = normalizePrefix(data.phone_prefix)
            return `${prefix ? `+${prefix}` : ''} ${data.phone ?? ''}`.trim()
          }
        },
        { dataField: 'primary_contact', caption: 'Contacto', minWidth: 160, visible: false },
        { dataField: 'primary_contact_phone', caption: 'Tel. contacto', width: 130, visible: false },
        { dataField: 'commercial_channel', caption: 'Canal', minWidth: 120, visible: false },
        { dataField: 'segment', caption: 'Segmento', minWidth: 120, visible: false },
        { dataField: 'short_code', caption: 'Codigo corto', width: 120 },
        { dataField: 'ubigeo', caption: 'Ubigeo', width: 110, visible: false },
        { dataField: 'contract_due_days', caption: 'Dias Vcto.', width: 110 },
        {
          dataField: 'has_storage_service',
          caption: 'Almacenamiento',
          width: 130,
          calculateCellValue: (data) => booleanLabel(data.has_storage_service)
        },
        { dataField: 'full_address', caption: 'Direccion', minWidth: 220 },
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
              title: 'Eliminar cliente',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? `Editar cliente ${kindLabel.toLowerCase()}` : `Agregar cliente ${kindLabel.toLowerCase()}`} onSubmit={onModalSubmit} size='lg' btnSubmitText='Guardar'>
      <div className='row'>
        <input ref={idRef} type='hidden' />

        <SelectFormGroup
          eRef={clientKindRef}
          label='Tipo de cliente'
          col='col-md-4'
          required
          disabled={isEditing && !!filterValue}
          value={clientKind}
          onChange={(e) => setClientKind(e.target.value || defaultClientKind)}
          effectWith={[clientKind]}
        >
          <option value='regular'>Regular</option>
          <option value='eventual'>Eventual</option>
        </SelectFormGroup>

        <SelectFormGroup
          eRef={documentTypeRef}
          label='Tipo Doc.'
          col='col-md-4'
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
          label={`Documento${isSearchingDocument ? ' (consultando...)' : ''}`}
          col='col-md-4'
          required
          disabled={isEditing}
          max={docMaxLength}
          onChange={onDocumentNumberChanged}
          onKeyDown={(e) => {
            if (e.ctrlKey || e.metaKey) return
            if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) e.preventDefault()
          }}
        />

        <InputFormGroup eRef={fullNameRef} label={displayNameLabel} col='col-12' required disabled={isIdentityBlocked} />

        <SelectFormGroup eRef={isPlatformRef} label='Es plataforma' col='col-md-4' value={platformValue} onChange={(e) => setPlatformValue(e.target.value)} effectWith={[platformValue]}>
          <option value='0'>No</option>
          <option value='1'>Si</option>
        </SelectFormGroup>

        <SelectFormGroup eRef={hasStorageServiceRef} label='Cuenta con servicio de almacenamiento' col='col-md-4' value={storageServiceValue} onChange={(e) => setStorageServiceValue(e.target.value)} effectWith={[storageServiceValue]}>
          <option value='0'>No</option>
          <option value='1'>Si</option>
        </SelectFormGroup>

        <InputFormGroup eRef={contractDueDaysRef} label='Dias vcto. contrato' col='col-md-4' type='number' min='0' />

        <InputFormGroup eRef={emailRef} label='Correo principal' col='col-md-6' type='email' />
        <InputFormGroup eRef={billingEmailRef} label='Correo facturacion' col='col-md-6' type='email' />

        <InputFormGroup eRef={primaryContactRef} label='Contacto principal' col='col-md-6' />
        <InputFormGroup eRef={primaryContactPhoneRef} label='Telefono contacto' col='col-md-6' />

        <SelectFormGroup
          eRef={phonePrefixRef}
          label='Prefijo celular'
          col='col-md-4'
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
        <InputFormGroup eRef={shortCodeRef} label='Codigo corto' col='col-md-4' />

        <InputFormGroup eRef={commercialChannelRef} label='Canal comercial' col='col-md-4' />
        <InputFormGroup eRef={segmentRef} label='Segmento' col='col-md-4' />
        <InputFormGroup eRef={ubigeoRef} label='Ubigeo' col='col-md-4' />

        <InputFormGroup eRef={addressRef} label='Direccion completa' col='col-12' />
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  const canAccess = properties.can(properties.requiredPermission) || properties.can('clients') || properties.hasRole('Admin')
  if (!canAccess) location.href = '/admin/';

  createRoot(el).render(<BaseAdminto {...properties} title={properties.sectionTitle ?? 'Clientes'}>
    <Clients {...properties} />
  </BaseAdminto>);
})

