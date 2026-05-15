import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import DriversRest from '../Actions/Admin/DriversRest';

const driversRest = new DriversRest()

const statusBadge = (container, value) => {
  const active = value !== false && value !== 0 && value !== '0'
  container.html(`<span class="badge ${active ? 'bg-soft-success text-success border border-success' : 'bg-soft-secondary text-secondary border border-secondary'}">${active ? 'Activo' : 'Inactivo'}</span>`)
}

const Drivers = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const businessRef = useRef()
  const firstNameRef = useRef()
  const lastNameRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const licenseRef = useRef()
  const statusRef = useRef()

  const onModalOpen = (data = null) => {
    idRef.current.value = data?.id ?? ''
    businessRef.current.value = data?.business_id ?? ''
    firstNameRef.current.value = data?.full_name ?? ''
    lastNameRef.current.value = ''
    documentTypeRef.current.value = data?.document_type ?? ''
    documentNumberRef.current.value = data?.document_number ?? ''
    licenseRef.current.value = data?.license_number ?? ''
    statusRef.current.value = data?.status === false || data?.status === 0 || data?.status === '0' ? '0' : '1'
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const result = await driversRest.save({
      id: idRef.current.value || undefined,
      business_id: businessRef.current.value || null,
      full_name: [firstNameRef.current.value, lastNameRef.current.value].map(value => value.trim()).filter(Boolean).join(' '),
      document_type: documentTypeRef.current.value,
      document_number: documentNumberRef.current.value.trim(),
      license_number: licenseRef.current.value.trim(),
      status: statusRef.current.value === '1',
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  return <>
    <Table
      gridRef={gridRef}
      title={<h4 className='header-title mb-0'>Conductores registrados</h4>}
      rest={driversRest}
      pageSize={10}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        { caption: 'Acciones', width: 90, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css('text-overflow', 'unset')
          container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
        } },
        { dataField: 'id', caption: 'ID', width: 70 },
        { dataField: 'document_type', caption: 'Tipo documento', width: 130 },
        { dataField: 'document_number', caption: 'Nro documento', width: 140 },
        { dataField: 'full_name', caption: 'Nombres completos', minWidth: 260 },
        { dataField: 'license_number', caption: 'Licencia de conducir', width: 170 },
        { dataField: 'status', caption: 'Estado', width: 110, cellTemplate: (container, { value }) => statusBadge(container, value) },
      ]}
    />

    <Modal modalRef={modalRef} title='Registrar conductor' size='xl' onSubmit={onSave} btnSubmitText='Guardar'>
      <div className='row'>
        <input ref={idRef} hidden />
        <input ref={businessRef} hidden />
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Tipo documento</label>
          <select ref={documentTypeRef} className='form-control'>
            <option value=''>Seleccione</option>
            <option value='DNI'>DNI</option>
            <option value='CE'>CE</option>
            <option value='RUC'>RUC</option>
          </select>
        </div>
        <div className='col-md-4 mb-3'><label className='form-label'>Nro documento</label><input ref={documentNumberRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Nombres</label><input ref={firstNameRef} className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Apellidos</label><input ref={lastNameRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Nro licencia</label><input ref={licenseRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Estado</label>
          <select ref={statusRef} className='form-control'>
            <option value='1'>Activo</option>
            <option value='0'>Inactivo</option>
          </select>
        </div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.can('driver') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Conductor'><Drivers {...properties} /></BaseAdminto>)
})
