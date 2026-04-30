import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import ReactAppend from '../Utils/ReactAppend';
import SetSelectValue from '../Utils/SetSelectValue';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import ClientDistributionNetworksRest from '../Actions/Admin/ClientDistributionNetworksRest';
import UbigeoCascade from '@Adminto/form/UbigeoCascade';
import { EMPTY_UBIGEO_SELECTION } from '../Utils/ubigeoInei';

const clientDistributionNetworksRest = new ClientDistributionNetworksRest()

const emptyAddress = () => ({
  rowKey: crypto.randomUUID(),
  code: '',
  name: '',
  ...EMPTY_UBIGEO_SELECTION,
  address: '',
  reference: '',
  latitude: '',
  longitude: '',
  contact_name: '',
  contact_phone: '',
  is_default: false,
  status: true,
})

const renderAddressSummary = (addresses = []) => {
  const active = addresses.filter(item => item?.status !== null && item?.status !== false)
  if (!active.length) return '<div class="text-muted">Sin direcciones</div>'

  return `
    <div class="p-3 bg-light border rounded">
      <div class="fw-semibold mb-2">Direcciones de entrega</div>
      ${active.map((item) => `
        <div class="border rounded bg-white p-2 mb-2">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <div class="fw-semibold">${item.name ?? ''}</div>
              <div class="small text-muted">${item.ubigeo ?? ''} ${item.department ?? ''} ${item.province ?? ''} ${item.district ?? ''}</div>
            </div>
            ${item.is_default ? '<span class="badge bg-primary-subtle text-primary">Default</span>' : ''}
          </div>
          <div class="small mt-2">${item.address ?? ''}</div>
          ${item.reference ? `<div class="small text-muted">Ref.: ${item.reference}</div>` : ''}
          ${(item.contact_name || item.contact_phone) ? `<div class="small text-muted mt-1">Contacto: ${item.contact_name ?? ''} ${item.contact_phone ?? ''}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `
}

const ClientDistributionNetworks = ({ requiredPermission = 'client-distribution' }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const clientRef = useRef()
  const codeRef = useRef()
  const nameRef = useRef()
  const commercialChannelRef = useRef()
  const segmentRef = useRef()
  const contactNameRef = useRef()
  const contactPhoneRef = useRef()
  const contactEmailRef = useRef()
  const observationsRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [isDefault, setIsDefault] = useState(false)
  const [addresses, setAddresses] = useState([emptyAddress()])

  const clearForm = () => {
    if (idRef.current) idRef.current.value = ''
    if (codeRef.current) codeRef.current.value = ''
    if (nameRef.current) nameRef.current.value = ''
    if (commercialChannelRef.current) commercialChannelRef.current.value = ''
    if (segmentRef.current) segmentRef.current.value = ''
    if (contactNameRef.current) contactNameRef.current.value = ''
    if (contactPhoneRef.current) contactPhoneRef.current.value = ''
    if (contactEmailRef.current) contactEmailRef.current.value = ''
    if (observationsRef.current) observationsRef.current.value = ''
    SetSelectValue(clientRef.current, null)
    setIsDefault(false)
    setAddresses([emptyAddress()])
  }

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    clearForm()

    if (data?.id) {
      idRef.current.value = data.id
      codeRef.current.value = data.code ?? ''
      nameRef.current.value = data.name ?? ''
      commercialChannelRef.current.value = data.commercial_channel ?? ''
      segmentRef.current.value = data.segment ?? ''
      contactNameRef.current.value = data.contact_name ?? ''
      contactPhoneRef.current.value = data.contact_phone ?? ''
      contactEmailRef.current.value = data.contact_email ?? ''
      observationsRef.current.value = data.observations ?? ''
      setIsDefault(!!data.is_default)
      SetSelectValue(clientRef.current, data.client?.id, data.client?.full_name ?? data.client?.document_number ?? data.client?.id)
      const currentAddresses = (data.addresses ?? [])
        .filter(item => item?.status !== null)
        .map(item => ({
          rowKey: crypto.randomUUID(),
          code: item.code ?? '',
          name: item.name ?? '',
          ubigeo: item.ubigeo ?? '',
          department: item.department ?? '',
          province: item.province ?? '',
          district: item.district ?? '',
          address: item.address ?? '',
          reference: item.reference ?? '',
          latitude: item.latitude ?? '',
          longitude: item.longitude ?? '',
          contact_name: item.contact_name ?? '',
          contact_phone: item.contact_phone ?? '',
          is_default: !!item.is_default,
          status: item.status ?? true,
        }))
      setAddresses(currentAddresses.length ? currentAddresses : [emptyAddress()])
    }

    $(modalRef.current).modal('show')
  }

  const addAddress = () => setAddresses(prev => [...prev, emptyAddress()])

  const updateAddress = (rowKey, field, value) => {
    setAddresses(prev => prev.map(item => {
      if (item.rowKey !== rowKey) {
        if (field === 'is_default' && value) return { ...item, is_default: false }
        return item
      }
      return { ...item, [field]: value }
    }))
  }

  const patchAddress = (rowKey, patch) => {
    setAddresses(prev => prev.map(item => {
      if (item.rowKey !== rowKey) return item
      return { ...item, ...patch }
    }))
  }

  const removeAddress = (rowKey) => {
    setAddresses(prev => {
      const next = prev.filter(item => item.rowKey !== rowKey)
      if (!next.length) return [emptyAddress()]
      if (!next.some(item => item.is_default)) next[0].is_default = true
      return [...next]
    })
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      client_id: clientRef.current?.value || '',
      code: codeRef.current.value?.trim(),
      name: nameRef.current.value?.trim(),
      commercial_channel: commercialChannelRef.current.value?.trim(),
      segment: segmentRef.current.value?.trim(),
      contact_name: contactNameRef.current.value?.trim(),
      contact_phone: contactPhoneRef.current.value?.trim(),
      contact_email: contactEmailRef.current.value?.trim(),
      observations: observationsRef.current.value?.trim(),
      is_default: isDefault,
      addresses: addresses.map(item => ({
        code: item.code?.trim(),
        name: item.name?.trim(),
        ubigeo: item.ubigeo?.trim(),
        department: item.department?.trim(),
        province: item.province?.trim(),
        district: item.district?.trim(),
        address: item.address?.trim(),
        reference: item.reference?.trim(),
        latitude: item.latitude?.toString().trim(),
        longitude: item.longitude?.toString().trim(),
        contact_name: item.contact_name?.trim(),
        contact_phone: item.contact_phone?.trim(),
        is_default: !!item.is_default,
        status: item.status !== false,
      }))
    }

    const result = await clientDistributionNetworksRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await clientDistributionNetworksRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar red de distribucion',
      text: 'Se dara de baja la red y sus direcciones.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await clientDistributionNetworksRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const masterDetail = {
    enabled: true,
    template: (container, { data }) => {
      $(container).html(renderAddressSummary(data.addresses ?? []))
    }
  }

  return (<>
    <Table
      gridRef={gridRef}
      title='Red de distribucion'
      rest={clientDistributionNetworksRest}
      pageSize={20}
      masterDetail={masterDetail}
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
            hint: 'Nueva red de distribucion',
            onClick: () => onModalOpen()
          }
        });
      }}
      columns={[
        { dataField: 'id', caption: 'ID', width: 70 },
        { dataField: 'code', caption: 'Codigo', width: 120 },
        {
          dataField: 'client.full_name',
          caption: 'Cliente',
          minWidth: 220,
          calculateCellValue: (data) => data.client?.full_name ?? ''
        },
        { dataField: 'name', caption: 'Red / Nodo', minWidth: 180 },
        { dataField: 'commercial_channel', caption: 'Canal', minWidth: 120 },
        { dataField: 'segment', caption: 'Segmento', minWidth: 120 },
        {
          dataField: 'active_addresses_count',
          caption: 'Direcciones',
          width: 105,
        },
        {
          dataField: 'default_address',
          caption: 'Direccion default',
          minWidth: 200,
          calculateCellValue: (data) => {
            const address = (data.addresses ?? []).find(item => item.is_default && item.status !== null)
            return address ? `${address.name} - ${address.address}` : ''
          }
        },
        { dataField: 'contact_name', caption: 'Contacto', minWidth: 140, visible: false },
        { dataField: 'contact_phone', caption: 'Telefono', width: 120, visible: false },
        {
          dataField: 'is_default',
          caption: 'Default',
          width: 90,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.is_default == 1} onChange={() => onBooleanChange({ id: data.id, field: 'is_default', value: !data.is_default })} />)
          }
        },
        {
          dataField: 'status',
          caption: 'Estado',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({ id: data.id, field: 'status', value: !data.status })} />)
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

    <Modal modalRef={modalRef} title={isEditing ? 'Editar red de distribucion' : 'Agregar red de distribucion'} onSubmit={onModalSubmit} size='xl' btnSubmitText='Guardar'>
      <div className='row' id='client-distribution-container'>
        <input ref={idRef} type='hidden' />

        <SelectAPIFormGroup
          eRef={clientRef}
          label='Cliente regular'
          col='col-md-6'
          required
          searchAPI='/api/admin/clients/paginate'
          searchBy='full_name'
          filter={['client_kind', '=', 'regular']}
          dropdownParent='#client-distribution-container'
        />

        <InputFormGroup eRef={codeRef} label='Codigo' col='col-md-3' />
        <InputFormGroup eRef={nameRef} label='Red / Nodo' col='col-md-3' required />
        <InputFormGroup eRef={commercialChannelRef} label='Canal comercial' col='col-md-3' />
        <InputFormGroup eRef={segmentRef} label='Segmento' col='col-md-3' />
        <InputFormGroup eRef={contactNameRef} label='Contacto nodo' col='col-md-3' />
        <InputFormGroup eRef={contactPhoneRef} label='Telefono nodo' col='col-md-3' />
        <InputFormGroup eRef={contactEmailRef} label='Correo nodo' col='col-md-6' />

        <div className='form-group col-md-3 mb-2'>
          <label className='form-label d-block'>Nodo default</label>
          <div className='form-check mt-2'>
            <input id='network-default' className='form-check-input' type='checkbox' checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            <label className='form-check-label' htmlFor='network-default'>Usar como red principal</label>
          </div>
        </div>

        <div className='form-group col-12 mb-2'>
          <label className='form-label'>Observaciones</label>
          <textarea ref={observationsRef} className='form-control' rows='3'></textarea>
        </div>

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h5 className='mb-0'>Direcciones de entrega</h5>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={addAddress}>
              <i className='mdi mdi-plus me-1'></i>Agregar direccion
            </button>
          </div>
        </div>

        {addresses.map((item, index) => (
          <div className='col-12' key={item.rowKey}>
            <div className='card border shadow-none mb-2'>
              <div className='card-body'>
                <div className='d-flex justify-content-between align-items-center mb-2'>
                  <div className='fw-semibold'>Direccion #{index + 1}</div>
                  <div className='d-flex align-items-center gap-3'>
                    <div className='form-check'>
                      <input
                        className='form-check-input'
                        type='checkbox'
                        checked={!!item.is_default}
                        onChange={(e) => updateAddress(item.rowKey, 'is_default', e.target.checked)}
                        id={`default-address-${item.rowKey}`}
                      />
                      <label className='form-check-label' htmlFor={`default-address-${item.rowKey}`}>Default</label>
                    </div>
                    <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => removeAddress(item.rowKey)}>
                      <i className='mdi mdi-delete'></i>
                    </button>
                  </div>
                </div>

                <div className='row'>
                  <div className='form-group col-md-3 mb-2'>
                    <label className='form-label'>Codigo</label>
                    <input className='form-control' value={item.code} onChange={(e) => updateAddress(item.rowKey, 'code', e.target.value)} />
                  </div>
                  <div className='form-group col-md-5 mb-2'>
                    <label className='form-label'>Nombre</label>
                    <input className='form-control' value={item.name} onChange={(e) => updateAddress(item.rowKey, 'name', e.target.value)} required />
                  </div>
                  <UbigeoCascade
                    value={item}
                    onChange={(nextValue) => patchAddress(item.rowKey, nextValue)}
                    showUbigeo={false}
                    departmentCol='col-md-4'
                    provinceCol='col-md-4'
                    districtCol='col-md-4'
                    required
                  />
                  <div className='form-group col-md-8 mb-2'>
                    <label className='form-label'>Direccion</label>
                    <input className='form-control' value={item.address} onChange={(e) => updateAddress(item.rowKey, 'address', e.target.value)} required />
                  </div>
                  <div className='form-group col-md-4 mb-2'>
                    <label className='form-label'>Referencia</label>
                    <input className='form-control' value={item.reference} onChange={(e) => updateAddress(item.rowKey, 'reference', e.target.value)} />
                  </div>
                  <div className='form-group col-md-3 mb-2'>
                    <label className='form-label'>Latitud</label>
                    <input className='form-control' value={item.latitude} onChange={(e) => updateAddress(item.rowKey, 'latitude', e.target.value)} />
                  </div>
                  <div className='form-group col-md-3 mb-2'>
                    <label className='form-label'>Longitud</label>
                    <input className='form-control' value={item.longitude} onChange={(e) => updateAddress(item.rowKey, 'longitude', e.target.value)} />
                  </div>
                  <div className='form-group col-md-3 mb-2'>
                    <label className='form-label'>Contacto</label>
                    <input className='form-control' value={item.contact_name} onChange={(e) => updateAddress(item.rowKey, 'contact_name', e.target.value)} />
                  </div>
                  <div className='form-group col-md-3 mb-2'>
                    <label className='form-label'>Telefono</label>
                    <input className='form-control' value={item.contact_phone} onChange={(e) => updateAddress(item.rowKey, 'contact_phone', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  const canAccess = properties.can(properties.requiredPermission ?? 'client-distribution') || properties.can('client-distribution') || properties.hasRole('Admin')
  if (!canAccess) location.href = '/admin/'

  createRoot(el).render(<BaseAdminto {...properties} title='Red de distribucion'>
    <ClientDistributionNetworks {...properties} />
  </BaseAdminto>);
})
