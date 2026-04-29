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
import EventualClientsRest from '../Actions/Admin/EventualClientsRest';

const eventualClientsRest = new EventualClientsRest()

const setRefValue = (ref, value) => {
  if (!ref?.current) return
  ref.current.value = value ?? ''
}

const getRefValue = (ref) => ref?.current?.value ?? ''
const normalizePrefix = (value) => (value ?? '').toString().replace(/\D+/g, '')

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

const EventualClients = ({ prefixes = [], sectionTitle = 'Clientes Eventuales', requiredPermission = 'eventual-clients' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const lookupTimeoutRef = useRef()

  const idRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const businessNameRef = useRef()
  const emailRef = useRef()
  const phonePrefixRef = useRef()
  const phoneRef = useRef()
  const addressRef = useRef()
  const contactNameRef = useRef()
  const notesRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [documentType, setDocumentType] = useState('dni')
  const [phonePrefix, setPhonePrefix] = useState('51')
  const [isSearchingDocument, setIsSearchingDocument] = useState(false)
  const [isDocumentDataLocked, setIsDocumentDataLocked] = useState(false)
  const [lastLookedDocumentKey, setLastLookedDocumentKey] = useState('')

  const docMaxLength = documentType === 'dni' ? 8 : (documentType === 'ruc' ? 11 : 20)
  const displayNameLabel = documentType === 'ruc' ? 'Razon social' : 'Nombre completo'

  const clearForm = () => {
    setRefValue(idRef, '')
    setRefValue(documentTypeRef, 'dni')
    setRefValue(documentNumberRef, '')
    setRefValue(businessNameRef, '')
    setRefValue(emailRef, '')
    setRefValue(phoneRef, '')
    setRefValue(addressRef, '')
    setRefValue(contactNameRef, '')
    setRefValue(notesRef, '')
    setPhonePrefix('51')
    setRefValue(phonePrefixRef, '51')
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
      setDocumentType(data.document_type ?? 'dni')
      setRefValue(idRef, data.id)
      setRefValue(documentTypeRef, data.document_type ?? 'dni')
      setRefValue(documentNumberRef, data.document_number ?? '')
      setRefValue(businessNameRef, data.business_name ?? '')
      setRefValue(emailRef, data.email ?? '')
      setRefValue(phoneRef, data.phone ?? '')
      setRefValue(addressRef, data.address ?? '')
      setRefValue(contactNameRef, data.contact_name ?? '')
      setRefValue(notesRef, data.notes ?? '')
      const normalizedPrefix = normalizePrefix(data.phone_prefix) || '51'
      setPhonePrefix(normalizedPrefix)
      setRefValue(phonePrefixRef, normalizedPrefix)
    } else {
      setDocumentType('dni')
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
      address: getRefValue(addressRef).trim(),
      contact_name: getRefValue(contactNameRef).trim(),
      notes: getRefValue(notesRef).trim(),
    }

    const result = await eventualClientsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, value }) => {
    const result = await eventualClientsRest.boolean({ id, field: 'status', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
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

  useEffect(() => () => {
    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current)
  }, [])

  return (<>
    <Table
      gridRef={gridRef}
      title={sectionTitle}
      rest={eventualClientsRest}
      pageSize={25}
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
            hint: 'Agregar cliente eventual',
            onClick: () => onModalOpen()
          }
        });
      }}
      columns={[
        { dataField: 'id', caption: 'ID', width: 70 },
        { dataField: 'document_type', caption: 'Tipo Doc.', width: 95 },
        { dataField: 'document_number', caption: 'Numero', width: 130 },
        { dataField: 'business_name', caption: 'Cliente eventual', minWidth: 220 },
        { dataField: 'contact_name', caption: 'Contacto', minWidth: 160 },
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
        { dataField: 'address', caption: 'Direccion', minWidth: 220 },
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
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({ id: data.id, value: !data.status })} />)
          }
        },
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
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar cliente eventual' : 'Agregar cliente eventual'} onSubmit={onModalSubmit} size='lg' btnSubmitText='Guardar'>
      <div className='row'>
        <input ref={idRef} type='hidden' />

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

        <InputFormGroup
          eRef={contactNameRef}
          label='Contacto'
          col='col-md-4'
          disabled={isDocumentDataLocked && documentType === 'dni'}
        />

        <InputFormGroup
          eRef={businessNameRef}
          label={displayNameLabel}
          col='col-md-8'
          required
          disabled={isEditing || isDocumentDataLocked}
        />

        <InputFormGroup eRef={emailRef} label='Correo' col='col-md-4' />

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
        <InputFormGroup eRef={addressRef} label='Direccion' col='col-md-12' />

        <div className='form-group col-12 mb-2'>
          <label className='form-label'>Notas</label>
          <textarea ref={notesRef} className='form-control' rows='3'></textarea>
        </div>
      </div>
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
