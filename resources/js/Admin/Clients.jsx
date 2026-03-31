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

const Clients = ({ prefixes = [] }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const lookupTimeoutRef = useRef()
  const pendingModalDataRef = useRef(null)

  const idRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const fullNameRef = useRef()
  const emailRef = useRef()
  const phoneRef = useRef()
  const phonePrefixRef = useRef()
  const shortCodeRef = useRef()
  const addressRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [documentType, setDocumentType] = useState('dni')
  const [isSearchingDocument, setIsSearchingDocument] = useState(false)
  const [isDocumentDataLocked, setIsDocumentDataLocked] = useState(false)
  const [lastLookedDocumentKey, setLastLookedDocumentKey] = useState('')
  const [phonePrefix, setPhonePrefix] = useState('51')

  const isRuc = documentType === 'ruc'
  const docMaxLength = documentType === 'dni' ? 8 : (documentType === 'ruc' ? 11 : 20)
  const docMinLength = documentType === 'dni' ? 8 : (documentType === 'ruc' ? 11 : 6)

  const clearForm = () => {
    setRefValue(idRef, '')
    setRefValue(documentTypeRef, 'dni')
    setRefValue(documentNumberRef, '')
    setRefValue(fullNameRef, '')
    setRefValue(emailRef, '')
    setRefValue(phoneRef, '')
    setPhonePrefix('51')
    setRefValue(phonePrefixRef, '51')
    setRefValue(shortCodeRef, '')
    setRefValue(addressRef, '')
  }

  const applyApiClientData = (client = {}) => {
    if (client.full_name || client.business_name) setRefValue(fullNameRef, client.full_name ?? client.business_name)
    if (client.email) setRefValue(emailRef, client.email)
    if (client.phone) setRefValue(phoneRef, client.phone)
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
    setRefValue(documentTypeRef, data.document_type ?? 'dni')
    setRefValue(documentNumberRef, data.document_number ?? '')
    setRefValue(fullNameRef, data.full_name ?? data.business_name ?? '')
    setRefValue(emailRef, data.email ?? '')
    setRefValue(phoneRef, data.phone ?? '')
    const normalizedPrefix = normalizePrefix(data.phone_prefix) || '51'
    setPhonePrefix(normalizedPrefix)
    setRefValue(phonePrefixRef, normalizedPrefix)
    setRefValue(shortCodeRef, data.short_code ?? '')
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
      document_type: getRefValue(documentTypeRef),
      document_number: getRefValue(documentNumberRef).replace(/\D+/g, ''),
      full_name: getRefValue(fullNameRef).trim(),
      email: getRefValue(emailRef).trim(),
      phone: getRefValue(phoneRef).trim(),
      phone_prefix: normalizePrefix(getRefValue(phonePrefixRef)),
      short_code: getRefValue(shortCodeRef).trim(),
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
      title='Clientes'
      rest={clientsRest}
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
            hint: 'Agregar cliente',
            onClick: () => onModalOpen()
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', visible: false },
        { dataField: 'document_type', caption: 'Tipo Doc.', width: 95 },
        { dataField: 'document_number', caption: 'Numero', width: 120 },
        {
          dataField: 'display_name',
          caption: 'Cliente',
          minWidth: 220,
          calculateCellValue: (data) => data.full_name ?? data.business_name ?? ''
        },
        { dataField: 'email', caption: 'Correo', minWidth: 180 },
        {
          dataField: 'mobile_full',
          caption: 'Celular',
          width: 140,
          calculateCellValue: (data) => {
            const prefix = normalizePrefix(data.phone_prefix)
            return `${prefix ? `+${prefix}` : ''} ${data.phone ?? ''}`.trim()
          }
        },
        { dataField: 'short_code', caption: 'Codigo corto', width: 120 },
        { dataField: 'full_address', caption: 'Direccion completa', visible: false },
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

    <Modal modalRef={modalRef} title={isEditing ? 'Editar cliente' : 'Agregar cliente'} onSubmit={onModalSubmit} size='md' btnSubmitText='Guardar'>
      <div className='row'>
        <input ref={idRef} type='hidden' />

        <SelectFormGroup
          eRef={documentTypeRef}
          label='Tipo Doc.'
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
          label={`Documento${isSearchingDocument ? ' (consultando...)' : ''}`}
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

        <InputFormGroup eRef={fullNameRef} label={displayNameLabel} col='col-12' required disabled={isIdentityBlocked} />

        <InputFormGroup eRef={emailRef} label='Correo' col='col-12' type='email' />
        <SelectFormGroup
          eRef={phonePrefixRef}
          label='Prefijo celular'
          col='col-md-5'
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
        <InputFormGroup eRef={phoneRef} label='Celular' col='col-md-7' />
        <InputFormGroup eRef={shortCodeRef} label='Codigo corto (identificador)' col='col-12' />

        <InputFormGroup eRef={addressRef} label='Direccion completa' col='col-12' />
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('clients') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Clientes'>
    <Clients {...properties} />
  </BaseAdminto>);
})
  const setRefValue = (ref, value) => {
    if (!ref?.current) return
    ref.current.value = value
  }
  const getRefValue = (ref) => {
    if (!ref?.current) return ''
    return ref.current.value ?? ''
  }
