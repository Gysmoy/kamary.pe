import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import Table from '../../Components/Adminto/Table';
import Modal from '../../Components/Adminto/Modal';
import DxButton from '../../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import SalesRest from '../../Actions/Admin/Magistrales/SalesRest';
import BillingDocumentsRest from '../../Actions/Admin/BillingDocumentsRest';
import ClientsRest from '../../Actions/Admin/ClientsRest';
import DoctorsRest from '../../Actions/Admin/Magistrales/DoctorsRest';
import renderGridEditLink from '../../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../../Utils/magistralesRecordPdf';
import setSwitchChecked from '../../Utils/setSwitchChecked';
import { getBillingDocumentStatusLabel } from '../../Utils/statusLabels';

const rest = new SalesRest()
const billingDocumentsRest = new BillingDocumentsRest()
const clientsRest = new ClientsRest()
const doctorsRest = new DoctorsRest()
const paymentLabels = { pending: 'Pendiente', paid: 'Pagado', partial: 'Parcial', cancelled: 'Cancelado' }
const tabs = [
  { id: 'quotes', label: 'Cotizacion' },
  { id: 'sales', label: 'Ventas' },
  { id: 'issued', label: 'Comprobantes Emitidos' },
  { id: 'cancelled', label: 'Comprobantes Anulados' },
]

const emptyItem = (warehouseId = '') => ({
  uid: crypto.randomUUID(),
  article_id: '',
  warehouse_id: warehouseId,
  description: '',
  stock: 0,
  quantity: 1,
  unit_price: 0,
  discount: 0,
})

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const formatDocument = (row) => [row?.document_type, row?.document_number].filter(Boolean).join(' ')
const itemSubtotal = (item) => Math.max(0, (Number(item.quantity || 0) * Number(item.unit_price || 0)) - Number(item.discount || 0))
const emptyFilters = () => ({ businessId: '', patient: '', startDate: '', endDate: '' })
const combineFilters = (filters) => filters.filter(Boolean).reduce((carry, filter) => {
  if (!carry) return filter
  return [carry, 'and', filter]
}, null)
const money = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const billingDocumentNumber = (row) => [row?.series, row?.sequence].filter(Boolean).join(' - ') || row?.code || ''
const billingClientLabel = (row) => row?.client?.full_name ?? row?.eventualClient?.business_name ?? row?.eventual_client?.business_name ?? '-'
const billingStatusLabel = (row) => getBillingDocumentStatusLabel(row?.local_status ?? row?.external_status)
const normalizeLabel = (value) => (value ?? '').toString().trim().toLowerCase()
const isFixedBusiness = (row) => normalizeLabel(row?.name).includes('kamary peru')
const identityDocumentTypes = ['DNI', 'CE', 'RUC']
const patientSexOptions = ['FEMENINO', 'MASCULINO']
const emptyPatientForm = () => ({
  document_type: 'DNI',
  document_number: '',
  names: '',
  lastnames: '',
  full_address: '',
  phone: '',
  birth_date: '',
  email: '',
  company_ruc: '',
  position: '',
  sex: 'FEMENINO',
  secondary_phone: '',
})
const patientName = (row) => row?.full_name || row?.display_name || row?.business_name || ''
const patientDocument = (row) => [row?.document_type?.toString?.().toUpperCase?.(), row?.document_number].filter(Boolean).join(' ')
const emptyDoctorForm = () => ({
  names: '',
  paternal_lastname: '',
  maternal_lastname: '',
  cmp: '',
  specialty: '',
  medical_center: '',
})
const doctorLabel = (doctor) => doctor?.select_label || [doctor?.cmp, [doctor?.paternal_lastname, doctor?.maternal_lastname].filter(Boolean).join(' '), doctor?.names].filter(Boolean).join(' | ')

const salesFilter = (tab, filters) => combineFilters([
  ['is_quote', '=', tab === 'quotes'],
  filters.businessId ? ['business_id', '=', Number(filters.businessId)] : null,
  filters.patient ? ['patient', 'contains', filters.patient] : null,
  filters.startDate ? ['sale_date', '>=', filters.startDate] : null,
  filters.endDate ? ['sale_date', '<=', filters.endDate] : null,
])

const billingFilter = (tab, filters) => {
  const statusFilter = tab === 'cancelled'
    ? ['local_status', '=', 'cancelled']
    : [
      ['local_status', '=', 'sent'],
      'or',
      ['local_status', '=', 'accepted'],
      'or',
      ['local_status', '=', 'observed'],
      'or',
      ['local_status', '=', 'rejected'],
    ]

  return combineFilters([
    ['source_type', '=', 'magistral_sale'],
    statusFilter,
    filters.businessId ? ['business_id', '=', Number(filters.businessId)] : null,
    filters.startDate ? ['issue_date', '>=', filters.startDate] : null,
    filters.endDate ? ['issue_date', '<=', filters.endDate] : null,
  ])
}

const Sales = ({ moduleTitle = 'Magistrales - Ventas', fixedWarehouse = null }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const patientSearchModalRef = useRef()
  const patientFormModalRef = useRef()
  const doctorFormModalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const businessRef = useRef()
  const paymentStatusRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const patientRef = useRef()
  const discountPolicyRef = useRef()
  const saleTypeRef = useRef()
  const allergyRef = useRef()
  const intoleranceRef = useRef()
  const dateRef = useRef()
  const observationsRef = useRef()
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const fixedWarehouseLabel = [fixedWarehouse?.branch_name, fixedWarehouse?.name].filter(Boolean).join(' - ') || 'Almacen fijo de Magistrales'
  const [businesses, setBusinesses] = useState([])
  const [articles, setArticles] = useState([])
  const [doctors, setDoctors] = useState([])
  const [items, setItems] = useState([emptyItem(fixedWarehouseId)])
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('quotes')
  const [filters, setFilters] = useState(emptyFilters())
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters())
  const [modalDefaultQuote, setModalDefaultQuote] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientRows, setPatientRows] = useState([])
  const [patientLoading, setPatientLoading] = useState(false)
  const [patientForm, setPatientForm] = useState(emptyPatientForm())
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm())
  const [doctorValue, setDoctorValue] = useState('')
  const isBillingTab = activeTab === 'issued' || activeTab === 'cancelled'
  const activeRest = isBillingTab ? billingDocumentsRest : rest
  const activeFilterValue = useMemo(
    () => isBillingTab ? billingFilter(activeTab, appliedFilters) : salesFilter(activeTab, appliedFilters),
    [activeTab, appliedFilters, isBillingTab]
  )
  const fixedBusiness = useMemo(() => businesses.find(isFixedBusiness) ?? businesses[0] ?? null, [businesses])
  const fixedBusinessId = fixedBusiness?.id ? `${fixedBusiness.id}` : ''
  const fixedBusinessLabel = fixedBusiness?.name ?? 'Kamary Peru'
  const doctorOptions = useMemo(() => doctors.map(doctor => ({ id: doctor.id, label: doctorLabel(doctor) })).filter(row => row.label), [doctors])
  const showLegacyDoctorOption = !!doctorValue && !doctorOptions.some(row => row.label === doctorValue)

  useEffect(() => {
    Promise.all([rest.getBusinesses(), rest.getArticles(), rest.getDoctors()]).then(([businessRows, articleRows, doctorRows]) => {
      setBusinesses((businessRows ?? []).filter(row => row.status !== null))
      setArticles((articleRows ?? []).filter(row => row.status !== null))
      setDoctors((doctorRows ?? []).filter(row => row.status !== null))
    })
  }, [fixedWarehouseId])

  useEffect(() => {
    if (businessRef.current && fixedBusinessId) {
      businessRef.current.value = fixedBusinessId
    }
  }, [fixedBusinessId])

  const totals = items.reduce((carry, item) => {
    carry.discount += Number(item.discount || 0)
    carry.total += itemSubtotal(item)
    return carry
  }, { discount: 0, total: 0 })
  totals.taxable = totals.total / 1.18
  totals.igv = totals.total - totals.taxable

  const openModal = (data = null, asQuote = activeTab === 'quotes') => {
    setIsEditing(!!data?.id)
    setModalDefaultQuote(data?.id ? !!data?.is_quote : !!asQuote)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    businessRef.current.value = fixedBusinessId || data?.business_id || ''
    paymentStatusRef.current.value = data?.payment_status ?? 'pending'
    documentTypeRef.current.value = data?.document_type ?? 'Boleta'
    documentNumberRef.current.value = data?.document_number ?? ''
    patientRef.current.value = data?.patient ?? ''
    setDoctorValue(data?.doctor ?? '')
    discountPolicyRef.current.value = data?.discount_policy ?? ''
    saleTypeRef.current.value = data?.sale_type ?? 'venta'
    setSwitchChecked(allergyRef.current, !!data?.allergy)
    setSwitchChecked(intoleranceRef.current, !!data?.intolerance)
    dateRef.current.value = data?.sale_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    observationsRef.current.value = data?.observations ?? ''
    const nextItems = (data?.items ?? []).map(item => ({
      uid: crypto.randomUUID(),
      article_id: item.article_id ?? '',
      warehouse_id: item.warehouse_id ?? fixedWarehouseId,
      description: item.description ?? item.article?.name ?? '',
      stock: item.stock ?? 0,
      quantity: item.quantity ?? 1,
      unit_price: item.unit_price ?? 0,
      discount: item.discount ?? 0,
    }))
    setItems(nextItems.length ? nextItems : [emptyItem(fixedWarehouseId)])
    $(modalRef.current).modal('show')
  }

  const updateItem = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const next = { ...item, [field]: value }
      if (field === 'article_id') {
        const article = articles.find(row => `${row.id}` === `${value}`)
        next.description = article?.name ?? ''
        next.unit_price = article?.sale_price ?? next.unit_price
        next.warehouse_id = fixedWarehouseId
      }
      return next
    }))
  }

  const removeItem = (uid) => {
    setItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyItem(fixedWarehouseId)]
    })
  }

  const updatePatientForm = (field, value) => {
    setPatientForm(prev => ({ ...prev, [field]: value }))
  }

  const updateDoctorForm = (field, value) => {
    setDoctorForm(prev => ({ ...prev, [field]: value }))
  }

  const openDoctorForm = () => {
    setDoctorForm(emptyDoctorForm())
    $(doctorFormModalRef.current).modal('show')
  }

  const saveDoctor = async (event) => {
    event?.preventDefault?.()
    if (!doctorForm.names.trim() || !doctorForm.paternal_lastname.trim() || !doctorForm.cmp.trim()) {
      Swal.fire('Datos incompletos', 'Nombres, apellido paterno y CMP son obligatorios.', 'warning')
      return
    }

    const result = await doctorsRest.save({
      names: doctorForm.names,
      paternal_lastname: doctorForm.paternal_lastname,
      maternal_lastname: doctorForm.maternal_lastname,
      cmp: doctorForm.cmp,
      specialty: doctorForm.specialty,
      medical_center: doctorForm.medical_center,
      status: true,
    })
    if (!result) return

    const rows = await rest.getDoctors()
    setDoctors((rows ?? []).filter(row => row.status !== null))

    const saved = result?.data ?? {
      ...doctorForm,
      cmp: doctorForm.cmp.replace(/\D+/g, ''),
      status: true,
    }
    setDoctorValue(doctorLabel(saved))
    $(doctorFormModalRef.current).modal('hide')
  }

  const patientFilter = (term) => {
    const sourceFilter = ['data_source', '=', 'client']
    const text = term.trim()
    if (!text) return sourceFilter
    return [sourceFilter, 'and', [
      ['document_number', 'contains', text],
      'or',
      ['full_name', 'contains', text],
      'or',
      ['display_name', 'contains', text],
    ]]
  }

  const searchPatients = async (event, forcedTerm = null) => {
    event?.preventDefault?.()
    const term = forcedTerm ?? patientSearch
    setPatientLoading(true)
    try {
      const response = await clientsRest.paginate({
        skip: 0,
        take: 10,
        requireTotalCount: true,
        filter: patientFilter(term),
        sort: [{ selector: 'display_name', desc: false }],
      })
      if (response?.status && response.status !== 200) throw new Error(response.message || 'No se pudo buscar pacientes')
      setPatientRows(response?.data ?? [])
    } catch (error) {
      setPatientRows([])
      if (error?.name !== 'AbortError') Swal.fire('No se pudo buscar', error.message || 'Ocurrio un error inesperado', 'error')
    } finally {
      setPatientLoading(false)
    }
  }

  const selectPatient = (row) => {
    patientRef.current.value = patientName(row)
    $(patientSearchModalRef.current).modal('hide')
    $(patientFormModalRef.current).modal('hide')
  }

  const clearPatient = () => {
    patientRef.current.value = ''
  }

  const openPatientSearch = () => {
    const term = patientRef.current?.value ?? ''
    setPatientSearch(term)
    setPatientRows([])
    $(patientSearchModalRef.current).modal('show')
    window.setTimeout(() => searchPatients(null, term), 0)
  }

  const openPatientForm = () => {
    setPatientForm(emptyPatientForm())
    if ($(patientSearchModalRef.current).hasClass('show')) {
      $(patientSearchModalRef.current).modal('hide')
    }
    window.setTimeout(() => $(patientFormModalRef.current).modal('show'), 150)
  }

  const savePatient = async (event) => {
    event?.preventDefault?.()
    const fullName = [patientForm.names, patientForm.lastnames].map(value => value.trim()).filter(Boolean).join(' ')
    if (!patientForm.document_number.trim() || !fullName) {
      Swal.fire('Datos incompletos', 'Documento, nombres y apellidos son obligatorios.', 'warning')
      return
    }

    const result = await clientsRest.save({
      client_kind: 'regular',
      module_scope: 'commercial',
      document_type: patientForm.document_type,
      document_number: patientForm.document_number,
      full_name: fullName,
      full_address: patientForm.full_address,
      phone: patientForm.phone,
      secondary_phone: patientForm.secondary_phone,
      birth_date: patientForm.birth_date,
      email: patientForm.email,
      company_ruc: patientForm.company_ruc,
      position: patientForm.position,
      sex: patientForm.sex,
      status: true,
    })
    if (!result) return

    const saved = result?.data
      ?? await clientsRest.lookupByDocument(patientForm.document_type, patientForm.document_number)
      ?? {
        document_type: patientForm.document_type,
        document_number: patientForm.document_number,
        full_name: fullName,
        display_name: fullName,
        status: true,
      }

    selectPatient(saved)
  }

  const save = async (e, asQuote = modalDefaultQuote) => {
    e.preventDefault()
    if (!fixedBusinessId) {
      Swal.fire('Empresa no disponible', 'No se encontro Kamary Peru para registrar la venta.', 'warning')
      return
    }
    const result = await rest.save({
      id: idRef.current.value || undefined,
      code: isEditing ? codeRef.current.value.trim() : '',
      pharmacy: '',
      business_id: fixedBusinessId,
      payment_status: paymentStatusRef.current.value,
      document_type: documentTypeRef.current.value.trim(),
      document_number: documentNumberRef.current.value.trim(),
      patient: patientRef.current.value.trim(),
      doctor: doctorValue.trim(),
      discount_policy: discountPolicyRef.current.value.trim(),
      sale_type: saleTypeRef.current.value.trim(),
      allergy: allergyRef.current.checked,
      intolerance: intoleranceRef.current.checked,
      is_quote: asQuote,
      sale_date: dateRef.current.value || null,
      observations: observationsRef.current.value.trim(),
      items: items.map(item => ({
        article_id: item.article_id || null,
        warehouse_id: fixedWarehouseId || item.warehouse_id || null,
        description: (item.description ?? '').toString().trim(),
        stock: item.stock,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
      })),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar venta', text: 'Se dara de baja la venta magistral.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await rest.delete(id)
    if (result) $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const applyFilters = (event) => {
    event?.preventDefault?.()
    setAppliedFilters({ ...filters })
  }

  const onTabChange = (tab) => {
    setActiveTab(tab)
  }

  const openBillingPdf = (row) => {
    window.open(billingDocumentsRest.downloadUrl(row.id, 'pdf'), '_blank', 'noopener')
  }

  const saleActionColumn = {
    caption: 'Acciones',
    width: 145,
    minWidth: 145,
    allowFiltering: false,
    allowExporting: false,
    cellTemplate: (container, { data }) => {
      container.css({ overflow: 'visible', textOverflow: 'unset', whiteSpace: 'nowrap' })
      const actions = $('<div>').addClass('d-flex align-items-center flex-nowrap')
      actions.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.sale(data)) }))
      actions.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openModal(data) }))
      actions.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => remove(data.id) }))
      container.append(actions)
    }
  }

  const saleColumns = [
    saleActionColumn,
    { dataField: 'is_quote', visible: false, showInColumnChooser: false },
    { dataField: 'business_id', visible: false, showInColumnChooser: false },
    { dataField: 'sale_date', visible: false, showInColumnChooser: false },
    {
      dataField: 'business.name',
      caption: 'Empresa',
      minWidth: 170,
      cellTemplate: (container, { data }) => renderGridEditLink(container, data?.business?.name, () => openModal(data), 'Editar venta magistral')
    },
    { dataField: 'code', caption: activeTab === 'quotes' ? 'Cod. Cotizacion' : 'Codigo', width: 145 },
    activeTab === 'quotes'
      ? { dataField: 'sale_type', caption: 'Tipo Venta', width: 130 }
      : { dataField: 'payment_status', caption: 'Estado Pago', width: 120, calculateCellValue: row => paymentLabels[row.payment_status] ?? row.payment_status },
    activeTab === 'sales' ? { dataField: 'document_label', caption: 'Documento', width: 160, calculateCellValue: formatDocument } : null,
    { dataField: 'patient', caption: 'Paciente', minWidth: 170 },
    { dataField: 'total', caption: 'Total S/', dataType: 'number', width: 110, format: { type: 'fixedPoint', precision: 2 } },
    { dataField: 'creator_label', caption: 'Usuario Registro', minWidth: 160, calculateCellValue: row => formatUser(row.creator) },
    { dataField: 'created_at', caption: 'Fecha Registro', dataType: 'date', width: 130 },
  ].filter(Boolean)

  const billingColumns = [
    {
      caption: 'Acciones',
      width: 80,
      allowFiltering: false,
      allowExporting: false,
      cellTemplate: (container, { data }) => {
        container.css('text-overflow', 'unset')
        container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Ver PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openBillingPdf(data) }))
      }
    },
    { dataField: 'source_type', visible: false, showInColumnChooser: false },
    { dataField: 'business_id', visible: false, showInColumnChooser: false },
    { dataField: 'business.name', caption: 'Empresa', minWidth: 170 },
    { dataField: 'local_status', caption: activeTab === 'cancelled' ? 'Est. Anulacion' : 'Est. Comprobante', width: 145, calculateCellValue: billingStatusLabel },
    { dataField: 'document_number', caption: 'Comprobante', width: 160, calculateCellValue: billingDocumentNumber },
    { caption: 'Cliente', minWidth: 220, calculateCellValue: billingClientLabel },
    { dataField: 'subtotal', caption: 'Total Gravada S/', dataType: 'number', width: 140, format: { type: 'fixedPoint', precision: 2 } },
    { dataField: 'tax_amount', caption: 'IGV', dataType: 'number', width: 110, format: { type: 'fixedPoint', precision: 2 } },
    { dataField: 'total', caption: 'Importe Factura', dataType: 'number', width: 140, format: { type: 'fixedPoint', precision: 2 } },
    { dataField: 'issue_date', caption: 'F. Facturacion', dataType: 'date', width: 130 },
    activeTab === 'cancelled' ? { dataField: 'cancelled_at', caption: 'F. Anulacion', dataType: 'date', width: 130 } : null,
  ].filter(Boolean)

  return <>
    <div className='row mb-3'>
      <div className='col-12'>
        <div className='d-flex gap-2 flex-wrap'>
          <button type='button' className='btn btn-primary' onClick={() => openModal(null, false)}>
            <i className='mdi mdi-plus-circle-outline me-1'></i> Crear Venta
          </button>
          <button type='button' className='btn btn-outline-primary' onClick={() => openModal(null, true)}>
            <i className='mdi mdi-file-document-outline me-1'></i> Crear Cotizacion
          </button>
          <button type='button' className='btn btn-outline-secondary' disabled title='Pendiente de conectar al modulo de mensajes'>
            <i className='mdi mdi-message-text-outline me-1'></i> Mensaje
          </button>
        </div>
      </div>
    </div>

    <Table
      key={`magistrales-sales-table-${activeTab}`}
      gridRef={gridRef}
      title={<div>
        <div className='d-flex align-items-center justify-content-between flex-wrap gap-2'>
          <h4 className='header-title mb-0'>Listado</h4>
          <span className='text-muted small'>{tabs.find(tab => tab.id === activeTab)?.label}</span>
        </div>
        <ul className='nav nav-tabs mt-3'>
          {tabs.map(tab => (
            <li className='nav-item' key={`mag-sale-tab-${tab.id}`}>
              <button type='button' className={`nav-link ${activeTab === tab.id ? 'active' : ''}`} onClick={() => onTabChange(tab.id)}>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
        <form className='row align-items-end mt-3' onSubmit={applyFilters}>
          <div className='col-12 col-lg-3 mb-2'>
            <label className='form-label'>Empresa</label>
            <select className='form-select' value={filters.businessId} onChange={(event) => setFilters(prev => ({ ...prev, businessId: event.target.value }))}>
              <option value=''>Todos</option>
              {businesses.map(row => <option key={`mag-sale-filter-business-${row.id}`} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          {!isBillingTab && <div className='col-12 col-lg-3 mb-2'>
            <label className='form-label'>Paciente</label>
            <input className='form-control' value={filters.patient} placeholder='DNI o nombre del paciente' onChange={(event) => setFilters(prev => ({ ...prev, patient: event.target.value }))} />
          </div>}
          <div className='col-12 col-md-4 col-lg-2 mb-2'>
            <label className='form-label'>Fecha Inicio</label>
            <input type='date' className='form-control' value={filters.startDate} onChange={(event) => setFilters(prev => ({ ...prev, startDate: event.target.value }))} />
          </div>
          <div className='col-12 col-md-4 col-lg-2 mb-2'>
            <label className='form-label'>Fecha Fin</label>
            <input type='date' className='form-control' value={filters.endDate} onChange={(event) => setFilters(prev => ({ ...prev, endDate: event.target.value }))} />
          </div>
          <div className='col-12 col-md-4 col-lg-2 mb-2'>
            <button type='submit' className='btn btn-outline-primary w-100'>
              <i className='mdi mdi-magnify me-1'></i> Filtrar
            </button>
          </div>
        </form>
        {isBillingTab && <div className='alert alert-info py-2 mt-2 mb-0'>
          Estas pestanas quedan separadas para comprobantes de origen magistral. La emision fiscal de ventas magistrales se conectara sin usar los comprobantes de almacenamiento.
        </div>}
      </div>}
      rest={activeRest}
      pageSize={25}
      baseFilterValue={activeFilterValue}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        if (!isBillingTab) {
          items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', hint: activeTab === 'quotes' ? 'Crear cotizacion' : 'Crear venta', onClick: () => openModal(null, activeTab === 'quotes') } })
        }
      }}
      columns={isBillingTab ? billingColumns : saleColumns}
    />
    <Modal
      modalRef={modalRef}
      title={isEditing ? (modalDefaultQuote ? 'Editar cotizacion' : 'Editar venta') : (modalDefaultQuote ? 'Registrar cotizacion' : 'Registrar venta')}
      onSubmit={(e) => save(e, modalDefaultQuote)}
      size='xl'
      hideButtonSubmit
    >
      <div className='row'>
        <input ref={idRef} hidden />

        <div className='col-12'>
          <h6 className='border-bottom pb-2 mb-3'><i className='mdi mdi-account-circle-outline me-1'></i> Datos del paciente</h6>
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' disabled={!isEditing} /></div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Empresa</label>
          <input ref={businessRef} type='hidden' value={fixedBusinessId} readOnly />
          <input className='form-control' value={fixedBusinessLabel} readOnly disabled />
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha</label><input ref={dateRef} type='date' className='form-control' /></div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Paciente</label>
          <div className='input-group'>
            <button type='button' className='btn btn-outline-primary' onClick={openPatientSearch}>
              <i className='mdi mdi-magnify me-1'></i> Buscar
            </button>
            <button type='button' className='btn btn-outline-success' onClick={openPatientForm} title='Agregar paciente'>
              <i className='mdi mdi-account-plus'></i>
            </button>
            <input ref={patientRef} className='form-control' placeholder='Seleccione paciente' />
            <button type='button' className='btn btn-outline-danger' onClick={clearPatient} title='Limpiar paciente'>
              <i className='mdi mdi-close'></i>
            </button>
          </div>
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Doctor</label>
          <div className='input-group'>
            <select className='form-control' value={doctorValue} onChange={(event) => setDoctorValue(event.target.value)}>
              <option value=''>Seleccione</option>
              {showLegacyDoctorOption && <option value={doctorValue}>{doctorValue}</option>}
              {doctorOptions.map(doctor => <option key={`mag-sale-doctor-${doctor.id}`} value={doctor.label}>{doctor.label}</option>)}
            </select>
            <button type='button' className='btn btn-outline-success' onClick={openDoctorForm} title='Agregar doctor'>
              <i className='mdi mdi-plus'></i>
            </button>
          </div>
        </div>
        <div className='col-md-2 mb-3'><label className='form-label'>Tipo doc.</label><input ref={documentTypeRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Documento</label><input ref={documentNumberRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Estado pago</label><select ref={paymentStatusRef} className='form-control'>{Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Politica descuento</label><input ref={discountPolicyRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Tipo venta</label><input ref={saleTypeRef} className='form-control' /></div>
        <SwitchFormGroup eRef={allergyRef} label='Alergia' col='col-md-3 mt-4' />
        <SwitchFormGroup eRef={intoleranceRef} label='Intolerancia' col='col-md-3 mt-4' />

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center border-bottom pb-2 mb-3'>
            <h6 className='mb-0'><i className='mdi mdi-pill me-1'></i> Datos del articulo</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={() => setItems(prev => [...prev, emptyItem(fixedWarehouseId)])}><i className='mdi mdi-plus me-1'></i> Insertar articulo</button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th style={{ minWidth: 230 }}>Articulo</th>
                  <th style={{ minWidth: 150 }}>Almacen fijo</th>
                  <th style={{ width: 100 }}>Stock</th>
                  <th style={{ width: 110 }}>Cantidad</th>
                  <th style={{ width: 110 }}>Precio</th>
                  <th style={{ width: 110 }}>Dscto</th>
                  <th style={{ width: 120 }}>Subtotal</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.uid}>
                    <td><select className='form-control form-control-sm' value={item.article_id} onChange={(e) => updateItem(item.uid, 'article_id', e.target.value)}><option value=''>Articulo</option>{articles.map(article => <option key={`sale-article-${article.id}`} value={article.id}>{article.code} - {article.name}</option>)}</select></td>
                    <td className='align-middle text-muted small'>{fixedWarehouseLabel}</td>
                    <td><input className='form-control form-control-sm' type='number' step='0.001' value={item.stock} onChange={(e) => updateItem(item.uid, 'stock', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.unit_price} onChange={(e) => updateItem(item.uid, 'unit_price', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.discount} onChange={(e) => updateItem(item.uid, 'discount', e.target.value)} /></td>
                    <td>S/ {itemSubtotal(item).toFixed(2)}</td>
                    <td><button type='button' className='btn btn-xs btn-soft-danger' onClick={() => removeItem(item.uid)}><i className='mdi mdi-delete'></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='d-flex justify-content-end mt-3'>
            <div style={{ minWidth: 280 }}>
              <div className='d-flex justify-content-between'><span>Gravada</span><b>S/ {money(totals.taxable)}</b></div>
              <div className='d-flex justify-content-between'><span>Descuento</span><b>S/ {money(totals.discount)}</b></div>
              <div className='d-flex justify-content-between'><span>IGV</span><b>S/ {money(totals.igv)}</b></div>
              <div className='d-flex justify-content-between fs-5'><span>Total</span><b>S/ {money(totals.total)}</b></div>
            </div>
          </div>
        </div>

        <div className='col-12 mt-3'>
          <h6 className='border-bottom pb-2 mb-3'><i className='mdi mdi-note-text-outline me-1'></i> Observaciones</h6>
          <textarea ref={observationsRef} className='form-control' rows='3' placeholder='Comentarios internos de la venta magistral' />
        </div>

        <div className='col-12 d-flex gap-2 justify-content-center mt-4'>
          {!isEditing && <button type='button' className='btn btn-outline-primary' onClick={(e) => save(e, !modalDefaultQuote)}>
            <i className='mdi mdi-file-document-outline me-1'></i> Registrar {modalDefaultQuote ? 'venta' : 'cotizacion'}
          </button>}
          <button type='button' className='btn btn-primary' onClick={(e) => save(e, modalDefaultQuote)}>
            <i className='mdi mdi-check me-1'></i> {isEditing ? 'Guardar cambios' : `Registrar ${modalDefaultQuote ? 'cotizacion' : 'venta'}`}
          </button>
        </div>
      </div>
    </Modal>
    <Modal
      modalRef={doctorFormModalRef}
      title='Formulario doctor'
      onSubmit={saveDoctor}
      size='lg'
      btnSubmitText='Registrar'
      zIndex={1060}
      onClose={() => {
        if ($(modalRef.current).hasClass('show')) $('body').addClass('modal-open')
      }}
    >
      <div className='row'>
        <div className='col-12'>
          <h6 className='border-bottom pb-2 mb-3'><i className='mdi mdi-doctor me-1'></i> General</h6>
        </div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Nombres</label>
          <input className='form-control' value={doctorForm.names} onChange={(event) => updateDoctorForm('names', event.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Apellido paterno</label>
          <input className='form-control' value={doctorForm.paternal_lastname} onChange={(event) => updateDoctorForm('paternal_lastname', event.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Apellido materno</label>
          <input className='form-control' value={doctorForm.maternal_lastname} onChange={(event) => updateDoctorForm('maternal_lastname', event.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>CMP</label>
          <input className='form-control' value={doctorForm.cmp} onChange={(event) => updateDoctorForm('cmp', event.target.value)} />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Especialidad</label>
          <input className='form-control' value={doctorForm.specialty} onChange={(event) => updateDoctorForm('specialty', event.target.value)} />
        </div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Centro Medico</label>
          <input className='form-control' value={doctorForm.medical_center} onChange={(event) => updateDoctorForm('medical_center', event.target.value)} />
        </div>
      </div>
    </Modal>
    <Modal
      modalRef={patientSearchModalRef}
      title='Buscar paciente'
      onSubmit={searchPatients}
      size='lg'
      hideFooter
      zIndex={1060}
      onClose={() => {
        if ($(modalRef.current).hasClass('show')) $('body').addClass('modal-open')
      }}
    >
      <div>
        <label className='form-label'>Documento de Identidad o nombre del paciente</label>
        <div className='input-group'>
          <input
            className='form-control'
            value={patientSearch}
            placeholder='Ingrese palabra clave'
            onChange={(event) => setPatientSearch(event.target.value)}
          />
          <button type='button' className='btn btn-outline-primary' onClick={searchPatients} disabled={patientLoading}>
            <i className='mdi mdi-magnify me-1'></i> Buscar
          </button>
          <button type='button' className='btn btn-outline-success' onClick={openPatientForm}>
            <i className='mdi mdi-account-plus me-1'></i> Agregar paciente
          </button>
        </div>
        <div className='table-responsive mt-3 border rounded'>
          <table className='table table-sm table-hover mb-0'>
            <thead className='table-light'>
              <tr>
                <th style={{ width: 90 }}>Acciones</th>
                <th style={{ minWidth: 130 }}>Documento</th>
                <th>Nombres y apellidos</th>
                <th style={{ width: 110 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {patientLoading && <tr><td colSpan='4' className='text-center text-muted py-3'>Buscando...</td></tr>}
              {!patientLoading && patientRows.length === 0 && <tr><td colSpan='4' className='text-center text-muted py-3'>No existen elementos</td></tr>}
              {!patientLoading && patientRows.map(row => (
                <tr key={`patient-result-${row.id}`}>
                  <td>
                    <button type='button' className='btn btn-xs btn-soft-primary' onClick={() => selectPatient(row)} title='Seleccionar paciente'>
                      <i className='mdi mdi-check'></i>
                    </button>
                  </td>
                  <td>{patientDocument(row) || '-'}</td>
                  <td>{patientName(row) || '-'}</td>
                  <td>
                    <span className={`badge ${row.status ? 'bg-success' : 'bg-secondary'}`}>{row.status ? 'Activo' : 'Inactivo'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='d-flex justify-content-end mt-3'>
          <button type='button' className='btn btn-light' data-bs-dismiss='modal'>Cerrar</button>
        </div>
      </div>
    </Modal>
    <Modal
      modalRef={patientFormModalRef}
      title='Formulario paciente'
      onSubmit={savePatient}
      size='xl'
      btnSubmitText='Registrar'
      zIndex={1070}
      onClose={() => {
        if ($(modalRef.current).hasClass('show')) $('body').addClass('modal-open')
      }}
    >
      <div className='row'>
        <div className='col-12'>
          <h6 className='border-bottom pb-2 mb-3'><i className='mdi mdi-account-plus-outline me-1'></i> General</h6>
        </div>
        <div className='col-md-2 mb-3'>
          <label className='form-label'>Tipo de Documento</label>
          <select className='form-control' value={patientForm.document_type} onChange={(event) => updatePatientForm('document_type', event.target.value)}>
            {identityDocumentTypes.map(type => <option key={`patient-document-type-${type}`} value={type}>{type}</option>)}
          </select>
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Documento</label>
          <input className='form-control' value={patientForm.document_number} onChange={(event) => updatePatientForm('document_number', event.target.value)} />
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Nombres</label>
          <input className='form-control' value={patientForm.names} onChange={(event) => updatePatientForm('names', event.target.value)} />
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Apellidos</label>
          <input className='form-control' value={patientForm.lastnames} onChange={(event) => updatePatientForm('lastnames', event.target.value)} />
        </div>
        <div className='col-md-5 mb-3'>
          <label className='form-label'>Direccion</label>
          <input className='form-control' value={patientForm.full_address} onChange={(event) => updatePatientForm('full_address', event.target.value)} />
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Telefono</label>
          <input className='form-control' value={patientForm.phone} onChange={(event) => updatePatientForm('phone', event.target.value)} />
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Fecha de nacimiento</label>
          <input type='date' className='form-control' value={patientForm.birth_date} onChange={(event) => updatePatientForm('birth_date', event.target.value)} />
        </div>
        <div className='col-md-5 mb-3'>
          <label className='form-label'>Correo</label>
          <input type='email' className='form-control' value={patientForm.email} onChange={(event) => updatePatientForm('email', event.target.value)} />
        </div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>RUC Empresa</label>
          <input className='form-control' value={patientForm.company_ruc} onChange={(event) => updatePatientForm('company_ruc', event.target.value)} />
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Cargo</label>
          <input className='form-control' value={patientForm.position} onChange={(event) => updatePatientForm('position', event.target.value)} />
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Sexo</label>
          <select className='form-control' value={patientForm.sex} onChange={(event) => updatePatientForm('sex', event.target.value)}>
            {patientSexOptions.map(option => <option key={`patient-sex-${option}`} value={option}>{option}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Telefono 2</label>
          <input className='form-control' value={patientForm.secondary_phone} onChange={(event) => updatePatientForm('secondary_phone', event.target.value)} />
        </div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-sales'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Ventas'}><Sales {...properties} /></BaseAdminto>)
})
