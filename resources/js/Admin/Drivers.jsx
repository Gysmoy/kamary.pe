import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import DriversRest from '../Actions/Admin/DriversRest';

const driversRest = new DriversRest()

const Drivers = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const businessRef = useRef()
  const nameRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const licenseRef = useRef()
  const phoneRef = useRef()
  const emailRef = useRef()
  const observationsRef = useRef()
  const businessesRef = useRef([])

  useEffect(() => {
    driversRest.getBusinesses().then(data => {
      businessesRef.current = data ?? []
    })
  }, [])

  const onModalOpen = (data = null) => {
    idRef.current.value = data?.id ?? ''
    businessRef.current.value = data?.business_id ?? ''
    nameRef.current.value = data?.full_name ?? ''
    documentTypeRef.current.value = data?.document_type ?? 'DNI'
    documentNumberRef.current.value = data?.document_number ?? ''
    licenseRef.current.value = data?.license_number ?? ''
    phoneRef.current.value = data?.phone ?? ''
    emailRef.current.value = data?.email ?? ''
    observationsRef.current.value = data?.observations ?? ''
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const result = await driversRest.save({
      id: idRef.current.value || undefined,
      business_id: businessRef.current.value || null,
      full_name: nameRef.current.value.trim(),
      document_type: documentTypeRef.current.value,
      document_number: documentNumberRef.current.value.trim(),
      license_number: licenseRef.current.value.trim(),
      phone: phoneRef.current.value.trim(),
      email: emailRef.current.value.trim(),
      observations: observationsRef.current.value.trim(),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar conductor', text: 'El registro quedara inactivo.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const ok = await driversRest.delete(id)
    if (!ok) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table
      gridRef={gridRef}
      title='Conductores'
      rest={driversRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        { dataField: 'code', caption: 'Codigo', width: 110 },
        { dataField: 'full_name', caption: 'Nombre', minWidth: 220 },
        { dataField: 'document_type', caption: 'Doc', width: 90 },
        { dataField: 'document_number', caption: 'Numero', width: 110 },
        { dataField: 'license_number', caption: 'Licencia', width: 120 },
        { dataField: 'phone', caption: 'Telefono', width: 120 },
        { caption: 'Empresa', minWidth: 160, calculateCellValue: (row) => row.business?.name ?? '-' },
        { caption: 'Acciones', width: 130, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css('text-overflow', 'unset')
          container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
        } }
      ]}
    />

    <Modal modalRef={modalRef} title='Conductor' size='lg' onSubmit={onSave}>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Empresa</label>
          <select ref={businessRef} className='form-control'>
            <option value=''>Global</option>
            {businessesRef.current.map(row => <option key={`driver-business-${row.id}`} value={row.id}>{row.name}</option>)}
          </select>
        </div>
        <div className='col-md-8 mb-3'><label className='form-label'>Nombre completo</label><input ref={nameRef} className='form-control' required /></div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Tipo doc.</label>
          <select ref={documentTypeRef} className='form-control'>
            <option value='DNI'>DNI</option>
            <option value='CE'>CE</option>
            <option value='RUC'>RUC</option>
          </select>
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Numero doc.</label><input ref={documentNumberRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Licencia</label><input ref={licenseRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Telefono</label><input ref={phoneRef} className='form-control' /></div>
        <div className='col-12 mb-3'><label className='form-label'>Correo</label><input ref={emailRef} type='email' className='form-control' /></div>
        <div className='col-12'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.can('driver') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Conductores'><Drivers {...properties} /></BaseAdminto>)
})
