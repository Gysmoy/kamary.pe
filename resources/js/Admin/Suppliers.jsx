import React, { useRef, useState } from 'react';
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

const Suppliers = () => {
  const gridRef = useRef()
  const modalRef = useRef()
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

  return (<>
    <Table
      gridRef={gridRef}
      title='Proveedores'
      rest={suppliersRest}
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

    <Modal modalRef={modalRef} title={isEditing ? 'Editar proveedor' : 'Agregar proveedor'} onSubmit={onModalSubmit} size='xl'>
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
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('suppliers') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Proveedores'>
    <Suppliers {...properties} />
  </BaseAdminto>);
})
