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
const categoryOptions = ['Transporte', 'Almacenamiento', 'Distribucion', 'Administrativo']
const subcategoryOptions = ['Recojo y Entrega', 'Despacho', 'Alquiler', 'Asesoria']
const serviceTypeOptions = ['Por Alquiler Diario', 'Mensual', 'Eventual', 'General']

const selectOptions = (rows, currentValue = '') => {
  const options = [...rows]
  if (currentValue && !options.includes(currentValue)) options.unshift(currentValue)
  return options
}

const ServiceCatalog = ({ moduleTitle = 'Servicios', serviceScope = 'services' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const nameRef = useRef()
  const categoryRef = useRef()
  const subcategoryRef = useRef()
  const serviceTypeRef = useRef()
  const unitPricePenRef = useRef()
  const unitPriceUsdRef = useRef()
  const applicableZoneRef = useRef()
  const linkedVehicleTypeRef = useRef()
  const commissionYesRef = useRef()
  const commissionNoRef = useRef()
  const observationsRef = useRef()
  const statusRef = useRef()
  const [isEditing, setIsEditing] = useState(false)
  const [modalOptions, setModalOptions] = useState({ category: '', subcategory: '', serviceType: '' })
  const isStorageGeneral = serviceScope === 'storage_general'

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    setModalOptions({
      category: data?.category ?? '',
      subcategory: data?.subcategory ?? '',
      serviceType: data?.service_type ?? '',
    })
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? ''
    nameRef.current.value = data?.name ?? ''
    unitPricePenRef.current.value = Number(data?.unit_price_pen ?? 0)
    observationsRef.current.value = data?.observations ?? ''
    if (isStorageGeneral) {
      statusRef.current.value = data?.status === false || data?.status === 0 || data?.status === '0' ? '0' : '1'
    } else {
      categoryRef.current.value = data?.category ?? ''
      subcategoryRef.current.value = data?.subcategory ?? ''
      serviceTypeRef.current.value = data?.service_type ?? ''
      unitPriceUsdRef.current.value = Number(data?.unit_price_usd ?? 0)
      applicableZoneRef.current.value = data?.applicable_zone ?? ''
      linkedVehicleTypeRef.current.value = data?.linked_vehicle_type ?? ''
      commissionYesRef.current.checked = !!data?.commissions_enabled
      commissionNoRef.current.checked = !data?.commissions_enabled
    }
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const request = isStorageGeneral
      ? {
        id: idRef.current.value || undefined,
        code: codeRef.current.value.trim() || undefined,
        name: nameRef.current.value.trim(),
        category: 'General',
        service_type: 'General',
        billing_unit: 'Servicio',
        unit_price_pen: unitPricePenRef.current.value,
        unit_price_usd: 0,
        observations: observationsRef.current.value.trim(),
        status: statusRef.current.value === '1',
      }
      : {
        id: idRef.current.value || undefined,
        code: codeRef.current.value.trim(),
        name: nameRef.current.value.trim(),
        category: categoryRef.current.value.trim(),
        subcategory: subcategoryRef.current.value.trim(),
        service_type: serviceTypeRef.current.value.trim(),
        billing_unit: 'Servicio',
        unit_price_pen: unitPricePenRef.current.value,
        unit_price_usd: unitPriceUsdRef.current.value,
        applicable_zone: applicableZoneRef.current.value.trim(),
        linked_vehicle_type: linkedVehicleTypeRef.current.value.trim(),
        commissions_enabled: commissionYesRef.current.checked,
        observations: observationsRef.current.value.trim(),
      }
    const result = await serviceCatalogRest.save(request)
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

  const actionColumn = {
    caption: 'Acciones',
    width: 110,
    allowFiltering: false,
    allowExporting: false,
    cellTemplate: (container, { data }) => {
      container.css('text-overflow', 'unset')
      container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
      container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
    }
  }
  const statusColumn = {
    dataField: 'status',
    caption: 'Estado',
    width: 110,
    cellTemplate: (container, { data }) => {
      const active = data.status !== false && data.status !== 0 && data.status !== '0'
      container.html(`<span class="badge ${active ? 'bg-success-subtle text-success border border-success' : 'bg-secondary-subtle text-secondary border border-secondary'}">${active ? 'Activo' : 'Inactivo'}</span>`)
    },
    lookup: {
      dataSource: [
        { value: true, label: 'Activo' },
        { value: false, label: 'Inactivo' },
      ],
      valueExpr: 'value',
      displayExpr: 'label',
    },
  }

  const columns = isStorageGeneral
    ? [
      actionColumn,
      { dataField: 'name', caption: 'Nombre', minWidth: 260 },
      {
        dataField: 'observations',
        caption: 'Descripcion',
        minWidth: 320,
        cellTemplate: (container, { data }) => container.text(data.observations || data.name || '')
      },
      { dataField: 'unit_price_pen', caption: 'Tarifa', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
      { dataField: 'creator_label', caption: 'Usuario Registro', minWidth: 150, allowFiltering: false, allowSorting: false },
      { dataField: 'registered_at', caption: 'F. Registro', minWidth: 170, dataType: 'datetime', allowFiltering: false },
    ]
    : [
      { dataField: 'id', caption: '#', width: 55, allowFiltering: false },
      actionColumn,
      statusColumn,
      { dataField: 'code', caption: 'Codigo', width: 95 },
      { dataField: 'name', caption: 'Servicio', minWidth: 360 },
      { dataField: 'unit_price_pen', caption: 'Valor Unitario (S/)', minWidth: 140, dataType: 'number', format: { type: 'fixedPoint', precision: 5 } },
      { dataField: 'unit_price_usd', caption: 'Valor Unitario ($)', minWidth: 140, dataType: 'number', format: { type: 'fixedPoint', precision: 5 } },
      { dataField: 'category', caption: 'Categoria', minWidth: 130 },
      { dataField: 'subcategory', caption: 'Sub Categoria', minWidth: 140 },
      { dataField: 'service_type', caption: 'Tipo Servicio', minWidth: 150 },
      { dataField: 'creator_label', caption: 'Usuario Registro', minWidth: 150, allowFiltering: false, allowSorting: false },
      { dataField: 'registered_at', caption: 'Fecha Registro', minWidth: 170, dataType: 'datetime', allowFiltering: false, allowSorting: false },
    ]

  return <>
    {!isStorageGeneral && <style>{`
      .service-catalog-modal-body .form-label {
        font-size: 12px;
        color: #313a46;
        margin-bottom: 6px;
      }
      .service-catalog-modal-body .form-control,
      .service-catalog-modal-body .form-select {
        min-height: 32px;
        border-radius: 0;
        font-size: 13px;
      }
      .service-catalog-alert {
        background: #fff4e5;
        color: #ff8200;
        border: 1px solid #ffe3bd;
        padding: 12px;
        font-size: 12px;
        line-height: 1.45;
      }
      .service-catalog-alert strong {
        display: block;
        margin-bottom: 4px;
      }
      .service-catalog-commission-options {
        display: flex;
        gap: 18px;
        align-items: center;
        min-height: 32px;
      }
    `}</style>}
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={serviceCatalogRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={columns}
    />

    <Modal
      modalRef={modalRef}
      title={isEditing ? 'Editar servicio' : 'Agregar servicio'}
      size={isStorageGeneral ? 'lg' : 'full-width'}
      bodyClass={isStorageGeneral ? '' : 'service-catalog-modal-body'}
      btnSubmitText={isEditing ? 'Guardar' : 'Registrar'}
      onSubmit={onSave}
    >
      <div className='row'>
        <input ref={idRef} hidden />
        {isStorageGeneral && <input ref={codeRef} hidden />}
        {isStorageGeneral ? <>
          <div className='col-md-6 mb-3'><label className='form-label'>Nombre</label><input ref={nameRef} className='form-control' required /></div>
          <div className='col-md-6 mb-3'><label className='form-label'>Descripcion</label><input ref={observationsRef} className='form-control' /></div>
          <div className='col-md-6 mb-3'><label className='form-label'>Tarifa</label><input ref={unitPricePenRef} type='number' min='0' step='0.01' className='form-control' /></div>
          <div className='col-md-6 mb-3'>
            <label className='form-label'>Estado</label>
            <select ref={statusRef} className='form-select'>
              <option value='1'>Activo</option>
              <option value='0'>Inactivo</option>
            </select>
          </div>
        </> : <>
          <div className='col-md-4 mb-3'>
            <label className='form-label'>Categoria</label>
            <select ref={categoryRef} className='form-select' onChange={(e) => setModalOptions(prev => ({ ...prev, category: e.target.value }))}>
              <option value=''>Seleccione</option>
              {selectOptions(categoryOptions, modalOptions.category).map(option => <option key={`service-category-${option}`} value={option}>{option}</option>)}
            </select>
          </div>
          <div className='col-md-4 mb-3'>
            <label className='form-label'>Sub Categoria</label>
            <select ref={subcategoryRef} className='form-select' onChange={(e) => setModalOptions(prev => ({ ...prev, subcategory: e.target.value }))}>
              <option value=''>Seleccione</option>
              {selectOptions(subcategoryOptions, modalOptions.subcategory).map(option => <option key={`service-subcategory-${option}`} value={option}>{option}</option>)}
            </select>
          </div>
          <div className='col-md-4 mb-3'>
            <label className='form-label'>Tipo Servicio</label>
            <select ref={serviceTypeRef} className='form-select' onChange={(e) => setModalOptions(prev => ({ ...prev, serviceType: e.target.value }))}>
              <option value=''>Seleccione</option>
              {selectOptions(serviceTypeOptions, modalOptions.serviceType).map(option => <option key={`service-type-${option}`} value={option}>{option}</option>)}
            </select>
          </div>
          <input ref={applicableZoneRef} hidden />
          <input ref={linkedVehicleTypeRef} hidden />
          <div className='col-md-2 mb-3'><label className='form-label'>Valor Unitario (S/)</label><input ref={unitPricePenRef} type='number' min='0' step='0.00001' className='form-control' /></div>
          <div className='col-md-2 mb-3'><label className='form-label'>Valor Unitario ($)</label><input ref={unitPriceUsdRef} type='number' min='0' step='0.00001' className='form-control' /></div>
          <div className='col-md-4 mb-3'><label className='form-label'>Codigo Servicio</label><input ref={codeRef} className='form-control' required /></div>
          <div className='col-md-8 mb-3'><label className='form-label'>Nombre Servicio</label><input ref={nameRef} className='form-control' required /></div>
          <div className='col-12 mb-3'>
            <div className='service-catalog-alert'>
              <strong>Importante!</strong>
              <div>En el campo Glosa, se debe colocar los comodines de *cicloFacturacion* y *alcance* para el correcto funcionamiento automatico de asignacion de glosa en las prefacturas.</div>
              <br />
              <div>Ejemplo:</div>
              <div>Servicio *cicloFacturacion* de *alcance* cuentas/de Usuario Binance.</div>
              <br />
              <div>Resultado:</div>
              <div>Servicio Mensual de 5 cuentas/de Usuario Binance.</div>
            </div>
          </div>
          <div className='col-12 mb-3'><label className='form-label'>Glosa</label><input ref={observationsRef} className='form-control' /></div>
          <div className='col-12 mb-1'>
            <label className='form-label'>Este servicio paga comision al vendedor?</label>
            <div className='service-catalog-commission-options'>
              <label className='form-check-label'><input ref={commissionYesRef} type='radio' className='form-check-input me-1' name='service_commission' /> Si</label>
              <label className='form-check-label'><input ref={commissionNoRef} type='radio' className='form-check-input me-1' name='service_commission' defaultChecked /> No</label>
            </div>
          </div>
        </>}
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'services-services'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Servicios'}><ServiceCatalog {...properties} /></BaseAdminto>)
})
