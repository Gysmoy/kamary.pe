import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '@Adminto/Modal';
import InputFormGroup from '@Adminto/form/InputFormGroup';
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

const isRowActive = (row) => row.status !== false && row.status !== 0 && row.status !== '0'

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const ServiceCatalog = ({ moduleTitle = 'Servicios', serviceScope = 'services' }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const nameRef = useRef()
  const unitPricePenRef = useRef()
  const unitPriceUsdRef = useRef()
  const applicableZoneRef = useRef()
  const linkedVehicleTypeRef = useRef()
  const commissionEnabledRef = useRef()
  const observationsRef = useRef()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedServiceType, setSelectedServiceType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('1')
  const isStorageGeneral = serviceScope === 'storage_general'

  const refresh = () => tableRef.current?.refresh()

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? ''
    nameRef.current.value = data?.name ?? ''
    unitPricePenRef.current.value = Number(data?.unit_price_pen ?? 0)
    observationsRef.current.value = data?.observations ?? ''
    if (isStorageGeneral) {
      setSelectedStatus(data?.status === false || data?.status === 0 || data?.status === '0' ? '0' : '1')
    } else {
      setSelectedCategory(data?.category ?? '')
      setSelectedSubcategory(data?.subcategory ?? '')
      setSelectedServiceType(data?.service_type ?? '')
      unitPriceUsdRef.current.value = Number(data?.unit_price_usd ?? 0)
      applicableZoneRef.current.value = data?.applicable_zone ?? ''
      linkedVehicleTypeRef.current.value = data?.linked_vehicle_type ?? ''
      commissionEnabledRef.current.checked = !!data?.commissions_enabled
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
        status: selectedStatus === '1',
      }
      : {
        id: idRef.current.value || undefined,
        code: codeRef.current.value.trim(),
        name: nameRef.current.value.trim(),
        category: selectedCategory.trim(),
        subcategory: selectedSubcategory.trim(),
        service_type: selectedServiceType.trim(),
        billing_unit: 'Servicio',
        unit_price_pen: unitPricePenRef.current.value,
        unit_price_usd: unitPriceUsdRef.current.value,
        applicable_zone: applicableZoneRef.current.value.trim(),
        linked_vehicle_type: linkedVehicleTypeRef.current.value.trim(),
        commissions_enabled: commissionEnabledRef.current.checked,
        observations: observationsRef.current.value.trim(),
      }
    const result = await serviceCatalogRest.save(request)
    if (!result) return
    refresh()
    $(modalRef.current).modal('hide')
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar servicio', text: 'Se dara de baja el servicio.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await serviceCatalogRest.delete(id)
    if (!result) return
    refresh()
  }

  const rowActions = (row) => [
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
    { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDelete(r.id) },
  ]

  const columns = isStorageGeneral
    ? [
      { key: 'nombre', label: 'Nombre', field: 'name', filter: { type: 'text' } },
      {
        key: 'descripcion', label: 'Descripcion', field: 'observations', filter: { type: 'text' }, muted: true,
        render: (row) => row.observations || row.name || '',
      },
      {
        key: 'tarifa', label: 'Tarifa', field: 'unit_price_pen', align: 'right', width: '120px', filter: { type: 'number' },
        render: (row) => Number(row.unit_price_pen ?? 0).toFixed(2),
      },
      { key: 'creador', label: 'Usuario Registro', field: 'creator_label', sortable: false },
      {
        key: 'fechaRegistro', label: 'F. Registro', field: 'registered_at', nowrap: true,
        render: (row) => formatDateTime(row.registered_at),
      },
    ]
    : [
      { key: 'id', label: '#', field: 'id', width: '60px' },
      {
        key: 'estado', label: 'Estado', field: 'status', width: '110px',
        filter: { type: 'select', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
        render: (row) => (
          <span className={`badge ${isRowActive(row) ? 'bg-success-subtle text-success border border-success' : 'bg-secondary-subtle text-secondary border border-secondary'}`}>
            {isRowActive(row) ? 'Activo' : 'Inactivo'}
          </span>
        ),
      },
      { key: 'codigo', label: 'Codigo', field: 'code', width: '100px', filter: { type: 'text' } },
      { key: 'nombre', label: 'Servicio', field: 'name', filter: { type: 'text' } },
      {
        key: 'valorPen', label: 'Valor Unitario (S/)', field: 'unit_price_pen', align: 'right', filter: { type: 'number' },
        render: (row) => Number(row.unit_price_pen ?? 0).toFixed(5),
      },
      {
        key: 'valorUsd', label: 'Valor Unitario ($)', field: 'unit_price_usd', align: 'right', filter: { type: 'number' },
        render: (row) => Number(row.unit_price_usd ?? 0).toFixed(5),
      },
      { key: 'categoria', label: 'Categoria', field: 'category', filter: { type: 'text' } },
      { key: 'subcategoria', label: 'Sub Categoria', field: 'subcategory', filter: { type: 'text' } },
      { key: 'tipoServicio', label: 'Tipo Servicio', field: 'service_type', filter: { type: 'text' } },
      { key: 'creador', label: 'Usuario Registro', field: 'creator_label', sortable: false },
      {
        key: 'fechaRegistro', label: 'Fecha Registro', field: 'registered_at', sortable: false, nowrap: true,
        render: (row) => formatDateTime(row.registered_at),
      },
    ]

  const searchFields = isStorageGeneral ? ['name', 'observations'] : ['name', 'code', 'category', 'subcategory', 'service_type']

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

    <VdTable
      ref={tableRef}
      rest={serviceCatalogRest}
      icon="mdi mdi-briefcase-variant-outline"
      title={moduleTitle}
      unit="servicios"
      defaultSort={{ field: 'name', desc: false }}
      defaultPageSize={25}
      searchFields={searchFields}
      searchPlaceholder="Buscar servicio…"
      emptyText="No se encontraron servicios."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen()}>
          <i className="mdi mdi-plus"></i> Nuevo servicio
        </button>
      </>}
      actions={rowActions}
      columns={columns}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.name}</p>
              {!isStorageGeneral && <small className="text-muted">{row.code}</small>}
            </div>
            {!isStorageGeneral && (
              <span className={`badge ${isRowActive(row) ? 'bg-success-subtle text-success border border-success' : 'bg-secondary-subtle text-secondary border border-secondary'}`}>
                {isRowActive(row) ? 'Activo' : 'Inactivo'}
              </span>
            )}
          </div>
          {isStorageGeneral
            ? (row.observations || row.name) && <p className="text-muted mb-0 mt-2" style={{ fontSize: 12 }}>{row.observations || row.name}</p>
            : (row.category || row.subcategory || row.service_type) && <small className="text-muted d-block mt-2">{[row.category, row.subcategory, row.service_type].filter(Boolean).join(' · ')}</small>}
          <small className="text-muted d-block mt-2">
            <i className="mdi mdi-cash-multiple me-1"></i>
            S/ {Number(row.unit_price_pen ?? 0).toFixed(isStorageGeneral ? 2 : 5)}
            {!isStorageGeneral && <> · $ {Number(row.unit_price_usd ?? 0).toFixed(5)}</>}
          </small>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
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
          <InputFormGroup eRef={nameRef} label='Nombre' col='col-md-6' required />
          <InputFormGroup eRef={observationsRef} label='Descripcion' col='col-md-6' />
          <InputFormGroup eRef={unitPricePenRef} label='Tarifa' col='col-md-6' type='number' min='0' step='0.01' />
          <VdSelect
            label='Estado'
            col='col-md-6'
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}
          />
        </> : <>
          <VdSelect
            label='Categoria'
            col='col-md-4'
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value)}
            options={selectOptions(categoryOptions, selectedCategory).map(option => ({ value: option, label: option }))}
            placeholder='-- Seleccione --'
          />
          <VdSelect
            label='Sub Categoria'
            col='col-md-4'
            value={selectedSubcategory}
            onChange={(value) => setSelectedSubcategory(value)}
            options={selectOptions(subcategoryOptions, selectedSubcategory).map(option => ({ value: option, label: option }))}
            placeholder='-- Seleccione --'
          />
          <VdSelect
            label='Tipo Servicio'
            col='col-md-4'
            value={selectedServiceType}
            onChange={(value) => setSelectedServiceType(value)}
            options={selectOptions(serviceTypeOptions, selectedServiceType).map(option => ({ value: option, label: option }))}
            placeholder='-- Seleccione --'
          />
          <input ref={applicableZoneRef} hidden />
          <input ref={linkedVehicleTypeRef} hidden />
          <InputFormGroup eRef={unitPricePenRef} label='Valor Unitario (S/)' col='col-md-2' type='number' min='0' step='0.00001' />
          <InputFormGroup eRef={unitPriceUsdRef} label='Valor Unitario ($)' col='col-md-2' type='number' min='0' step='0.00001' />
          <InputFormGroup eRef={codeRef} label='Codigo Servicio' col='col-md-4' required />
          <InputFormGroup eRef={nameRef} label='Nombre Servicio' col='col-md-8' required />
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
          <InputFormGroup eRef={observationsRef} label='Glosa' col='col-12' />
          <div className='col-12 mb-1'>
            <label className='form-label d-block'>Este servicio paga comision al vendedor?</label>
            <div className='form-check form-switch'>
              <input ref={commissionEnabledRef} type='checkbox' className='form-check-input' />
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
