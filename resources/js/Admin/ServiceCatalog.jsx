import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import ServiceCatalogRest from '../Actions/Admin/ServiceCatalogRest';

const serviceCatalogRest = new ServiceCatalogRest()

const ServiceCatalog = ({ moduleTitle = 'Servicios' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const nameRef = useRef()
  const categoryRef = useRef()
  const subcategoryRef = useRef()
  const serviceTypeRef = useRef()
  const billingUnitRef = useRef()
  const unitPricePenRef = useRef()
  const unitPriceUsdRef = useRef()
  const applicableZoneRef = useRef()
  const linkedVehicleTypeRef = useRef()
  const commissionsEnabledRef = useRef()
  const observationsRef = useRef()
  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? ''
    nameRef.current.value = data?.name ?? ''
    categoryRef.current.value = data?.category ?? ''
    subcategoryRef.current.value = data?.subcategory ?? ''
    serviceTypeRef.current.value = data?.service_type ?? ''
    billingUnitRef.current.value = data?.billing_unit ?? ''
    unitPricePenRef.current.value = Number(data?.unit_price_pen ?? 0)
    unitPriceUsdRef.current.value = Number(data?.unit_price_usd ?? 0)
    applicableZoneRef.current.value = data?.applicable_zone ?? ''
    linkedVehicleTypeRef.current.value = data?.linked_vehicle_type ?? ''
    commissionsEnabledRef.current.checked = !!data?.commissions_enabled
    observationsRef.current.value = data?.observations ?? ''
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const result = await serviceCatalogRest.save({
      id: idRef.current.value || undefined,
      code: codeRef.current.value.trim(),
      name: nameRef.current.value.trim(),
      category: categoryRef.current.value.trim(),
      subcategory: subcategoryRef.current.value.trim(),
      service_type: serviceTypeRef.current.value.trim(),
      billing_unit: billingUnitRef.current.value.trim(),
      unit_price_pen: unitPricePenRef.current.value,
      unit_price_usd: unitPriceUsdRef.current.value,
      applicable_zone: applicableZoneRef.current.value.trim(),
      linked_vehicle_type: linkedVehicleTypeRef.current.value.trim(),
      commissions_enabled: commissionsEnabledRef.current.checked,
      observations: observationsRef.current.value.trim(),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar servicio', text: 'Se dara de baja el servicio.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await serviceCatalogRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={serviceCatalogRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        { dataField: 'id', caption: 'ID', width: 70 },
        { dataField: 'code', caption: 'Codigo', width: 120 },
        { dataField: 'name', caption: 'Servicio', minWidth: 180 },
        { dataField: 'category', caption: 'Categoria', minWidth: 130 },
        { dataField: 'subcategory', caption: 'Subcategoria', minWidth: 130 },
        { dataField: 'billing_unit', caption: 'Unidad', width: 110 },
        { dataField: 'unit_price_pen', caption: 'PEN', width: 90, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        { dataField: 'unit_price_usd', caption: 'USD', width: 90, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        { caption: 'Acciones', width: 130, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css('text-overflow', 'unset')
          container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
        } }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar servicio' : 'Agregar servicio'} size='lg' onSubmit={onSave}>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-4 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' required /></div>
        <div className='col-md-8 mb-3'><label className='form-label'>Nombre</label><input ref={nameRef} className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Categoria</label><input ref={categoryRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Subcategoria</label><input ref={subcategoryRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Tipo</label><input ref={serviceTypeRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Unidad de cobro</label><input ref={billingUnitRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Valor PEN</label><input ref={unitPricePenRef} type='number' step='0.01' className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Valor USD</label><input ref={unitPriceUsdRef} type='number' step='0.01' className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>Zona aplicable</label><input ref={applicableZoneRef} className='form-control' /></div>
        <div className='col-md-6 mb-3'><label className='form-label'>Vehiculo asociado</label><input ref={linkedVehicleTypeRef} className='form-control' /></div>
        <div className='col-md-4 mb-3 form-check mt-4'><input ref={commissionsEnabledRef} type='checkbox' className='form-check-input' id='commissionsEnabledRef' /><label className='form-check-label' htmlFor='commissionsEnabledRef'>Comisionable</label></div>
        <div className='col-12 mb-1'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'services-services'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Servicios'}><ServiceCatalog {...properties} /></BaseAdminto>)
})
