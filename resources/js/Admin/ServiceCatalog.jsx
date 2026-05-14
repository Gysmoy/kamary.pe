import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import ServiceCatalogRest from '../Actions/Admin/ServiceCatalogRest';

const serviceCatalogRest = new ServiceCatalogRest()

const formatMoney = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const StorageGeneralService = ({ moduleTitle = 'Servicios Generales' }) => {
  const formRef = useRef()
  const [rows, setRows] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ selector: 'services.created_at', desc: true })
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    id: '',
    code: '',
    name: '',
    description: '',
    tariff: '',
    status: '1',
  })

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [pageSize, totalCount])
  const currentPage = Math.min(page, totalPages)
  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
    const end = Math.min(totalPages, Math.max(1, start) + 4)
    return Array.from({ length: Math.max(0, end - Math.max(1, start) + 1) }, (_, index) => Math.max(1, start) + index)
  }, [currentPage, totalPages])

  const buildFilter = useCallback(() => {
    const text = search.trim()
    if (!text) return undefined
    return [
      ['name', 'contains', text],
      'or',
      ['observations', 'contains', text],
      'or',
      ['unit_price_pen', 'contains', text],
    ]
  }, [search])

  const loadRows = useCallback(async () => {
    setLoading(true)
    try {
      const filter = buildFilter()
      const result = await serviceCatalogRest.paginate({
        skip: (page - 1) * pageSize,
        take: pageSize,
        requireTotalCount: true,
        sort: sort ? [sort] : undefined,
        ...(filter ? { filter } : {}),
      })
      if (Number(result?.status ?? 200) >= 400) throw new Error(result?.message || 'No se pudieron cargar los servicios')
      setRows(result?.data ?? [])
      setTotalCount(Number(result?.totalCount ?? result?.data?.length ?? 0))
    } catch (error) {
      if (error?.name !== 'AbortError') {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudieron cargar los servicios' })
      }
    } finally {
      setLoading(false)
    }
  }, [buildFilter, page, pageSize, sort])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  useEffect(() => {
    setPage(1)
  }, [pageSize, search])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const resetForm = () => {
    setForm({
      id: '',
      code: '',
      name: '',
      description: '',
      tariff: '',
      status: '1',
    })
    setTimeout(() => formRef.current?.querySelector('input[name="service-name"]')?.focus(), 0)
  }

  const editRow = (row) => {
    setForm({
      id: row.id ? `${row.id}` : '',
      code: row.code ?? '',
      name: row.name ?? '',
      description: row.observations ?? '',
      tariff: row.unit_price_pen ?? '',
      status: row.status === false || row.status === 0 || row.status === '0' ? '0' : '1',
    })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const saveService = async (event) => {
    event.preventDefault()
    const result = await serviceCatalogRest.save({
      id: form.id || undefined,
      code: form.code || undefined,
      name: form.name.trim(),
      observations: form.description.trim(),
      unit_price_pen: form.tariff,
      unit_price_usd: 0,
      status: form.status === '1',
      category: 'General',
      service_type: 'General',
      billing_unit: 'Servicio',
    })
    if (!result) return
    resetForm()
    await loadRows()
  }

  const changeSort = (selector) => {
    setPage(1)
    setSort(prev => prev?.selector === selector
      ? { selector, desc: !prev.desc }
      : { selector, desc: false })
  }

  const sortableHeader = (selector, label) => {
    const active = sort?.selector === selector
    const icon = active ? (sort.desc ? 'mdi-menu-down' : 'mdi-menu-up') : 'mdi-swap-vertical'
    return (
      <button type='button' className='btn btn-link p-0 text-uppercase text-muted fw-semibold text-decoration-none d-inline-flex align-items-center gap-1' onClick={() => changeSort(selector)}>
        <span>{label}</span>
        <i className={`mdi ${icon}`}></i>
      </button>
    )
  }

  return <>
    <div className='row g-3 mb-3'>
      <div className='col-12 col-lg-4'>
        <button type='button' className='btn w-100 d-flex align-items-center justify-content-between py-3 text-white' style={{ background: '#23264f' }} onClick={resetForm}>
          <span><i className='mdi mdi-plus-circle-outline me-1'></i> Registrar Servicio General</span>
          <i className='mdi mdi-calendar-month-outline fs-4'></i>
        </button>
      </div>
    </div>

    <div className='card mb-3' ref={formRef}>
      <div className='card-header text-white fw-bold text-uppercase py-2' style={{ background: '#23264f' }}>
        <i className='mdi mdi-plus-circle-outline me-1'></i> Formulario
      </div>
      <form className='card-body' onSubmit={saveService} autoComplete='off'>
        <h5 className='mb-3'>General</h5>
        <div className='row g-3 align-items-end'>
          <div className='col-12 col-lg-5'>
            <label className='form-label'>Nombre</label>
            <input name='service-name' className='form-control' value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className='col-12 col-lg-4'>
            <label className='form-label'>Descripcion</label>
            <input className='form-control' value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className='col-12 col-md-6 col-lg-2'>
            <label className='form-label'>Tarifa</label>
            <input type='number' step='0.01' min='0' className='form-control' value={form.tariff} onChange={(e) => setForm(prev => ({ ...prev, tariff: e.target.value }))} />
          </div>
          <div className='col-12 col-md-6 col-lg-1'>
            <label className='form-label'>Estado</label>
            <select className='form-select' value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}>
              <option value='1'>Activo</option>
              <option value='0'>Inactivo</option>
            </select>
          </div>
        </div>
        <hr className='my-4' />
        <div className='d-flex justify-content-center gap-3'>
          <button type='button' className='btn btn-link text-muted text-decoration-none' onClick={resetForm}>
            <i className='mdi mdi-close me-1'></i> Cerrar
          </button>
          <button type='submit' className='btn btn-outline-primary'>
            <i className='mdi mdi-plus me-1'></i> Guardar
          </button>
        </div>
      </form>
    </div>

    <div className='card'>
      <div className='card-header bg-white border-bottom-0 pb-0'>
        <div className='d-inline-block pb-3 border-bottom border-danger'>Servicios generales registrados</div>
      </div>
      <div className='card-body'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2'>
          <label className='d-inline-flex align-items-center gap-2 mb-0'>
            <span>Elementos :</span>
            <select className='form-select form-select-sm' style={{ width: 72 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
              {[10, 25, 50, 100].map(size => <option key={`storage-general-service-size-${size}`} value={size}>{size}</option>)}
            </select>
          </label>
          <label className='d-inline-flex align-items-center gap-2 mb-0'>
            <span>Filtrar :</span>
            <input className='form-control form-control-sm' style={{ width: 190 }} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </label>
        </div>

        <div className='table-responsive border'>
          <table className='table table-sm table-hover mb-0'>
            <thead>
              <tr>
                <th className='text-center text-uppercase' style={{ width: 120 }}>Acciones</th>
                <th style={{ minWidth: 320 }}>{sortableHeader('services.name', 'Nombre')}</th>
                <th style={{ minWidth: 320 }}>{sortableHeader('services.observations', 'Descripcion')}</th>
                <th className='text-end' style={{ minWidth: 120 }}>{sortableHeader('services.unit_price_pen', 'Tarifa')}</th>
                <th style={{ minWidth: 160 }}>{sortableHeader('creator.fullname', 'Usuario Registro')}</th>
                <th style={{ minWidth: 170 }}>{sortableHeader('services.created_at', 'F. Registro')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan='6' className='text-center text-muted py-4'><i className='mdi mdi-spin mdi-loading me-1'></i> Cargando...</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan='6' className='text-center text-muted py-4'>No existen elementos</td></tr>}
              {!loading && rows.map(row => (
                <tr key={row.id}>
                  <td className='text-center'>
                    <button type='button' className='btn btn-xs btn-outline-warning' title='Editar' onClick={() => editRow(row)}>
                      <i className='mdi mdi-pencil'></i>
                    </button>
                  </td>
                  <td>{row.name}</td>
                  <td>{row.observations || row.name}</td>
                  <td className='text-end'>{formatMoney(row.unit_price_pen)}</td>
                  <td>{row.creator_label || '-'}</td>
                  <td>{formatDateTime(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 pt-3'>
          <span className='text-muted'>{totalCount} elementos (Pagina {currentPage} de {totalPages})</span>
          <div className='btn-group btn-group-sm'>
            <button type='button' className='btn btn-light border' disabled={currentPage <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}>Anterior</button>
            {pageNumbers.map(item => (
              <button key={`storage-general-service-page-${item}`} type='button' className={`btn border ${item === currentPage ? 'btn-secondary' : 'btn-light'}`} onClick={() => setPage(item)}>
                {item}
              </button>
            ))}
            <button type='button' className='btn btn-light border' disabled={currentPage >= totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  </>
}

const ServiceCatalog = ({ moduleTitle = 'Servicios', serviceScope = 'services' }) => {
  if (serviceScope === 'storage_general') {
    return <StorageGeneralService moduleTitle={moduleTitle} />
  }

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
    serviceTypeRef.current.value = data?.service_type ?? (serviceScope === 'storage_general' ? 'General' : '')
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
        { dataField: 'service_type', caption: 'Tipo', width: 110 },
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
