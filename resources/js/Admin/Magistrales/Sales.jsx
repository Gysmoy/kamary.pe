import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '../../Components/Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import SalesRest from '../../Actions/Admin/Magistrales/SalesRest';
import BillingDocumentsRest from '../../Actions/Admin/BillingDocumentsRest';
import ClientsRest from '../../Actions/Admin/ClientsRest';
import DoctorsRest from '../../Actions/Admin/Magistrales/DoctorsRest';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../../Utils/magistralesRecordPdf';
import setSwitchChecked from '../../Utils/setSwitchChecked';
import { getBillingDocumentStatusLabel } from '../../Utils/statusLabels';

const rest = new SalesRest()
const billingDocumentsRest = new BillingDocumentsRest()
const clientsRest = new ClientsRest()
const doctorsRest = new DoctorsRest()
const paymentLabels = { pending: 'Pendiente', paid: 'Pagado', partial: 'Parcial', cancelled: 'Cancelado' }
const saleDocumentTypes = ['Factura', 'Boleta', 'Nota de pedido']
const saleTypeOptions = ['PRESENCIAL', 'RECOJO EN TIENDA', 'DELIVERY']
const noDiscountPolicyValue = '__NONE__'
const discountPolicyOptions = [
  { value: noDiscountPolicyValue, label: 'Seleccione' },
  { value: 'DESCUENTO EMPLEADOS', label: 'DESCUENTO EMPLEADOS' },
  { value: 'DESCUENTO MAYORISTA', label: 'DESCUENTO MAYORISTA' },
]
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
  warehouse_stock_rows: [],
  stock: 0,
  quantity: 1,
  unit_price: 0,
  discount: 0,
})

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const formatDocument = (row) => [row?.document_type, row?.document_number].filter(Boolean).join(' ')
const itemSubtotal = (item) => Math.max(0, (Number(item.quantity || 0) * Number(item.unit_price || 0)) - Number(item.discount || 0))
const emptyFilters = () => ({ patient: '', startDate: '', endDate: '' })
const combineFilters = (filters) => filters.filter(Boolean).reduce((carry, filter) => {
  if (!carry) return filter
  return [carry, 'and', filter]
}, null)
const money = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const stockLabel = (value) => Number(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
const billingDocumentNumber = (row) => [row?.series, row?.sequence].filter(Boolean).join(' - ') || row?.code || ''
const billingClientLabel = (row) => row?.client?.full_name ?? row?.eventualClient?.business_name ?? row?.eventual_client?.business_name ?? '-'
const billingStatusLabel = (row) => getBillingDocumentStatusLabel(row?.local_status ?? row?.external_status)
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
const patientBillingRuc = (row) => {
  const companyRuc = (row?.company_ruc ?? '').toString().replace(/\D+/g, '')
  if (companyRuc.length === 11 && (companyRuc.startsWith('20') || companyRuc.startsWith('10'))) return companyRuc

  const documentNumber = (row?.document_number ?? '').toString().replace(/\D+/g, '')
  const documentType = (row?.document_type ?? '').toString().trim().toUpperCase()
  if (documentNumber.length === 11 && (documentType === 'RUC' || documentNumber.startsWith('20') || documentNumber.startsWith('10'))) return documentNumber

  return ''
}
const patientFilter = (term) => {
  const sourceFilter = ['data_source', '=', 'client']
  const text = (term ?? '').trim()
  if (!text) return sourceFilter
  return [sourceFilter, 'and', [
    ['document_number', 'contains', text],
    'or',
    ['full_name', 'contains', text],
    'or',
    ['display_name', 'contains', text],
  ]]
}
const emptyDoctorForm = () => ({
  names: '',
  paternal_lastname: '',
  maternal_lastname: '',
  cmp: '',
  specialty: '',
  medical_center: '',
})
const doctorLabel = (doctor) => doctor?.select_label || [doctor?.cmp, [doctor?.paternal_lastname, doctor?.maternal_lastname].filter(Boolean).join(' '), doctor?.names].filter(Boolean).join(' | ')
const articleOptionLabel = (article) => [article?.name, `stock: ${stockLabel(article?.current_stock)}`, `S/. ${money(article?.sale_price)}`].filter(Boolean).join(' | ')
const warehouseStockLines = (article, fallbackLabel) => {
  const rows = Array.isArray(article?.warehouse_stock_rows) ? article.warehouse_stock_rows : []
  if (rows.length) return rows.map(row => `${row.label} - STOCK: ${stockLabel(row.stock)}`)
  return [fallbackLabel]
}
const buildItemFromArticle = (article, warehouseId, fallbackWarehouseLabel) => ({
  article_id: article?.id ? `${article.id}` : '',
  warehouse_id: warehouseId,
  description: article?.name ?? '',
  warehouse_stock_rows: warehouseStockLines(article, fallbackWarehouseLabel),
  stock: Number(article?.current_stock ?? 0),
  quantity: 1,
  unit_price: Number(article?.sale_price ?? 0),
  discount: 0,
})
const dateOnly = (value) => value ? `${value}`.toString().slice(0, 10) : ''

const salesFilter = (tab, filters) => combineFilters([
  ['is_quote', '=', tab === 'quotes'],
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
    filters.startDate ? ['issue_date', '>=', filters.startDate] : null,
    filters.endDate ? ['issue_date', '<=', filters.endDate] : null,
  ])
}

const Sales = ({ moduleTitle = 'Magistrales - Ventas', fixedWarehouse = null }) => {
  const tableRef = useRef()
  const modalRef = useRef()
  const patientSearchModalRef = useRef()
  const patientFormModalRef = useRef()
  const doctorFormModalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const paymentStatusRef = useRef()
  const allergyRef = useRef()
  const intoleranceRef = useRef()
  const dateRef = useRef()
  const observationsRef = useRef()
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const fixedWarehouseLabel = fixedWarehouse?.name || 'Almacen Magistrales'
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
  const [patientValue, setPatientValue] = useState('')
  const [selectedPatientData, setSelectedPatientData] = useState(null)
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm())
  const [doctorValue, setDoctorValue] = useState('')
  const [selectedDocumentType, setSelectedDocumentType] = useState('Boleta')
  const [discountPolicyValue, setDiscountPolicyValue] = useState('')
  const [saleTypeValue, setSaleTypeValue] = useState('PRESENCIAL')
  const [billingRuc, setBillingRuc] = useState('')
  const [billingBusinessName, setBillingBusinessName] = useState('')
  const isBillingTab = activeTab === 'issued' || activeTab === 'cancelled'
  const activeRest = isBillingTab ? billingDocumentsRest : rest
  const activeFilterValue = useMemo(
    () => isBillingTab ? billingFilter(activeTab, appliedFilters) : salesFilter(activeTab, appliedFilters),
    [activeTab, appliedFilters, isBillingTab]
  )
  const fixedBusinessId = fixedWarehouse?.business_id ? `${fixedWarehouse.business_id}` : ''
  const fixedBusinessLabel = fixedWarehouse?.business_name || 'Kamary Peru'
  const doctorOptions = useMemo(() => doctors.map(doctor => ({ id: doctor.id, label: doctorLabel(doctor) })).filter(row => row.label), [doctors])
  const showLegacyDoctorOption = !!doctorValue && !doctorOptions.some(row => row.label === doctorValue)
  const isFacturaDocumentType = selectedDocumentType === 'Factura'

  const syncBillingDataFromPatient = (row) => {
    if (!row || selectedDocumentType !== 'Factura') return
    const ruc = patientBillingRuc(row)
    if (!ruc) {
      setBillingRuc('')
      setBillingBusinessName('')
      return
    }
    setBillingRuc(ruc)
    setBillingBusinessName(patientName(row))
  }

  useEffect(() => {
    Promise.all([rest.getArticles(), rest.getDoctors()]).then(([articleRows, doctorRows]) => {
      setArticles((articleRows ?? []).filter(row => row.status !== null))
      setDoctors((doctorRows ?? []).filter(row => row.status !== null))
    })
  }, [fixedWarehouseId])

  useEffect(() => {
    if (selectedDocumentType !== 'Factura' || !selectedPatientData) return
    syncBillingDataFromPatient(selectedPatientData)
  }, [selectedDocumentType, selectedPatientData])

  // VdTable no vuelve a consultar automaticamente cuando cambia baseFilter (a
  // diferencia del filterValue reactivo de dxDataGrid), asi que forzamos el
  // refresh cuando se aplican los filtros de paciente/fechas del formulario.
  useEffect(() => {
    tableRef.current?.refresh()
  }, [appliedFilters])

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
    paymentStatusRef.current.value = data?.payment_status ?? 'pending'
    const nextDocumentType = saleDocumentTypes.includes(data?.document_type) ? data.document_type : 'Boleta'
    setSelectedDocumentType(nextDocumentType)
    setBillingRuc(data?.billing_ruc ?? '')
    setBillingBusinessName(data?.billing_business_name ?? '')
    setPatientValue(data?.patient ?? '')
    setSelectedPatientData(null)
    setDoctorValue(data?.doctor ?? '')
    const nextDiscountPolicy = data?.discount_policy ?? ''
    setDiscountPolicyValue(discountPolicyOptions.some(option => option.value === nextDiscountPolicy && option.value !== noDiscountPolicyValue) ? nextDiscountPolicy : '')
    setSaleTypeValue(saleTypeOptions.includes(data?.sale_type) ? data.sale_type : 'PRESENCIAL')
    setSwitchChecked(allergyRef.current, !!data?.allergy)
    setSwitchChecked(intoleranceRef.current, !!data?.intolerance)
    dateRef.current.value = data?.sale_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    observationsRef.current.value = data?.observations ?? ''
    const nextItems = (data?.items ?? []).map(item => ({
      uid: crypto.randomUUID(),
      article_id: item.article_id ?? '',
      warehouse_id: item.warehouse_id ?? fixedWarehouseId,
      description: item.description ?? item.article?.name ?? '',
      warehouse_stock_rows: warehouseStockLines(articles.find(row => `${row.id}` === `${item.article_id}`), fixedWarehouseLabel),
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
      return { ...item, [field]: value }
    }))
  }

  const selectArticle = async (uid, articleId) => {
    if (!articleId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...emptyItem(fixedWarehouseId), uid } : item))
      return
    }

    const article = articles.find(row => `${row.id}` === `${articleId}`)
    if (!article) return

    if (Number(article.current_stock ?? 0) <= 0) {
      const confirmation = await Swal.fire({
        title: 'Producto sin stock',
        text: 'Este producto no tiene stock. Desea agregarlo tambien?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Si, agregar',
        cancelButtonText: 'No',
      })
      if (!confirmation.isConfirmed) return
    }

    setItems(prev => prev.map(item => (
      item.uid === uid
        ? { ...item, ...buildItemFromArticle(article, fixedWarehouseId, fixedWarehouseLabel) }
        : item
    )))
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
    const cmp = doctorForm.cmp.replace(/\D+/g, '')
    if (!doctorForm.names.trim() || !doctorForm.paternal_lastname.trim() || !cmp) {
      Swal.fire('Datos incompletos', 'Nombres, apellido paterno y numero CMP son obligatorios.', 'warning')
      return
    }

    const result = await doctorsRest.save({
      names: doctorForm.names,
      paternal_lastname: doctorForm.paternal_lastname,
      maternal_lastname: doctorForm.maternal_lastname,
      cmp,
      specialty: doctorForm.specialty,
      medical_center: doctorForm.medical_center,
      status: true,
    })
    if (!result) return

    const rows = await rest.getDoctors()
    setDoctors((rows ?? []).filter(row => row.status !== null))

    const saved = result?.data ?? {
      ...doctorForm,
      cmp,
      status: true,
    }
    setDoctorValue(doctorLabel(saved))
    $(doctorFormModalRef.current).modal('hide')
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
    const value = patientName(row)
    setPatientValue(value)
    setSelectedPatientData(row)
    syncBillingDataFromPatient(row)
    $(patientSearchModalRef.current).modal('hide')
    $(patientFormModalRef.current).modal('hide')
  }

  const clearPatient = () => {
    setPatientValue('')
    setSelectedPatientData(null)
    if (selectedDocumentType === 'Factura') {
      setBillingRuc('')
      setBillingBusinessName('')
    }
  }

  const openPatientSearch = () => {
    const term = patientValue
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
      Swal.fire('Empresa no disponible', 'No se encontro la configuracion fija de Kamary Peru para registrar la venta.', 'warning')
      return
    }
    const documentType = selectedDocumentType.trim()
    const normalizedBillingRuc = billingRuc.replace(/\D+/g, '')
    const normalizedBillingBusinessName = billingBusinessName.trim()
    if (documentType === 'Factura') {
      if (normalizedBillingRuc.length !== 11 || !normalizedBillingBusinessName) {
        Swal.fire('Datos incompletos', 'Para factura debes registrar un RUC de facturacion valido y la razon social.', 'warning')
        return
      }
    }
    const result = await rest.save({
      id: idRef.current.value || undefined,
      code: isEditing ? codeRef.current.value.trim() : '',
      pharmacy: '',
      business_id: fixedBusinessId,
      payment_status: paymentStatusRef.current.value || 'pending',
      document_type: documentType,
      document_number: '',
      billing_ruc: documentType === 'Factura' ? normalizedBillingRuc : '',
      billing_business_name: documentType === 'Factura' ? normalizedBillingBusinessName : '',
      patient: patientValue.trim(),
      doctor: doctorValue.trim(),
      discount_policy: discountPolicyValue.trim(),
      sale_type: saleTypeValue.trim(),
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
    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar venta', text: 'Se dara de baja la venta magistral.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await rest.delete(id)
    if (result) tableRef.current?.refresh()
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

  // Botones de accion por fila. En comprobantes solo se puede ver el PDF; en
  // cotizaciones/ventas se puede imprimir, editar y eliminar.
  const rowActions = (row) => {
    if (isBillingTab) {
      return [
        { icon: 'mdi mdi-file-pdf-box', title: 'Ver PDF', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openBillingPdf(r) },
      ]
    }
    return [
      { icon: 'mdi mdi-file-pdf-box', title: 'Imprimir PDF', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openMagistralesRecordPdf(buildMagistralesRows.sale(r)) },
      { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => openModal(r) },
      { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => remove(r.id) },
    ]
  }

  const saleVdColumns = [
    {
      key: 'codigo', label: activeTab === 'quotes' ? 'Cod. Cotizacion' : 'Codigo', field: 'code', width: '145px', filter: { type: 'text' },
      render: (row) => (
        <a className='admin-grid-edit-link' style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => openModal(row)} title='Editar venta magistral'>
          {row.code}
        </a>
      ),
    },
    activeTab === 'quotes'
      ? { key: 'tipo_venta', label: 'Tipo Venta', field: 'sale_type', width: '130px', filter: { type: 'text' } }
      : { key: 'estado_pago', label: 'Estado Pago', field: 'payment_status', width: '120px', filter: { type: 'text' }, render: (row) => paymentLabels[row.payment_status] ?? row.payment_status },
    activeTab === 'sales' ? { key: 'documento', label: 'Documento', width: '160px', sortable: false, render: (row) => formatDocument(row) } : null,
    { key: 'paciente', label: 'Paciente', field: 'patient', filter: { type: 'text' } },
    { key: 'total', label: 'Total S/', field: 'total', align: 'right', width: '110px', filter: { type: 'number' }, render: (row) => money(row.total) },
    { key: 'usuario_registro', label: 'Usuario Registro', field: 'creator.fullname', sortable: false, render: (row) => formatUser(row.creator) },
    { key: 'fecha_registro', label: 'Fecha Registro', field: 'created_at', width: '130px', filter: { type: 'date' }, nowrap: true, render: (row) => dateOnly(row.created_at) },
  ].filter(Boolean)

  const billingVdColumns = [
    {
      key: 'estado', label: activeTab === 'cancelled' ? 'Est. Anulacion' : 'Est. Comprobante', field: 'local_status', width: '145px', filter: { type: 'text' },
      render: (row) => billingStatusLabel(row),
    },
    { key: 'comprobante', label: 'Comprobante', field: 'document_number', width: '160px', filter: { type: 'text' }, render: (row) => billingDocumentNumber(row) },
    { key: 'cliente', label: 'Cliente', sortable: false, render: (row) => billingClientLabel(row) },
    { key: 'gravada', label: 'Total Gravada S/', field: 'subtotal', align: 'right', width: '140px', filter: { type: 'number' }, render: (row) => money(row.subtotal) },
    { key: 'igv', label: 'IGV', field: 'tax_amount', align: 'right', width: '110px', filter: { type: 'number' }, render: (row) => money(row.tax_amount) },
    { key: 'importe', label: 'Importe Factura', field: 'total', align: 'right', width: '140px', filter: { type: 'number' }, render: (row) => money(row.total) },
    { key: 'f_facturacion', label: 'F. Facturacion', field: 'issue_date', width: '130px', filter: { type: 'date' }, nowrap: true, render: (row) => dateOnly(row.issue_date) },
    activeTab === 'cancelled' ? { key: 'f_anulacion', label: 'F. Anulacion', field: 'cancelled_at', width: '130px', filter: { type: 'date' }, nowrap: true, render: (row) => dateOnly(row.cancelled_at) } : null,
  ].filter(Boolean)

  // Opciones de doctor para el VdSelect: incluye una opcion vacia para poder
  // limpiar el campo (el <select> nativo anterior tenia un <option value=''>)
  // y, si la venta trae un doctor guardado que ya no esta activo, lo agrega
  // como opcion "legado" para que siga visible/seleccionado.
  const doctorSelectOptions = useMemo(() => {
    const base = doctorOptions.map(doctor => ({ value: doctor.label, label: doctor.label }))
    const withLegacy = showLegacyDoctorOption ? [{ value: doctorValue, label: doctorValue }, ...base] : base
    return [{ value: '', label: 'Sin doctor asignado' }, ...withLegacy]
  }, [doctorOptions, showLegacyDoctorOption, doctorValue])

  // Idem para el articulo de cada linea: se agrega una opcion vacia para
  // poder volver a dejar la linea sin articulo seleccionado.
  const articleSelectOptions = useMemo(() => [
    { value: '', label: 'Articulo' },
    ...articles.map(article => ({ value: `${article.id}`, label: articleOptionLabel(article) })),
  ], [articles])

  return <>
    <style>{`
      .magistrales-sale-dialog {
        width: calc(100vw - 32px);
        max-width: 1640px;
      }
      .magistrales-sale-content {
        min-height: calc(100vh - 64px);
      }
      .mag-sale-field-action {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        width: 100%;
      }
      .mag-sale-field-action > div:first-child {
        flex: 1 1 auto;
        min-width: 0;
      }
      .mag-sale-field-action .btn {
        flex: 0 0 auto;
        height: 38px;
      }
    `}</style>
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

    <div className='card mb-3'>
      <div className='card-body'>
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
          {!isBillingTab && <div className='col-12 col-lg-4 mb-2'>
            <label className='form-label'>Paciente</label>
            <input className='form-control' value={filters.patient} placeholder='DNI o nombre del paciente' onChange={(event) => setFilters(prev => ({ ...prev, patient: event.target.value }))} />
          </div>}
          <div className='col-12 col-md-4 col-lg-3 mb-2'>
            <label className='form-label'>Fecha Inicio</label>
            <input type='date' className='form-control' value={filters.startDate} onChange={(event) => setFilters(prev => ({ ...prev, startDate: event.target.value }))} />
          </div>
          <div className='col-12 col-md-4 col-lg-3 mb-2'>
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
      </div>
    </div>

    <VdTable
      key={`magistrales-sales-table-${activeTab}`}
      ref={tableRef}
      rest={activeRest}
      icon={isBillingTab ? 'mdi mdi-file-document-outline' : (activeTab === 'quotes' ? 'mdi mdi-file-document-edit-outline' : 'mdi mdi-cash-register')}
      title={tabs.find(tab => tab.id === activeTab)?.label ?? 'Listado'}
      unit={isBillingTab ? 'comprobantes' : (activeTab === 'quotes' ? 'cotizaciones' : 'ventas')}
      defaultPageSize={25}
      searchFields={isBillingTab ? ['document_number', 'client.full_name', 'eventualClient.business_name'] : ['code', 'patient']}
      searchPlaceholder='Buscar…'
      emptyText={isBillingTab ? 'No se encontraron comprobantes.' : 'No se encontraron registros.'}
      baseFilter={activeFilterValue}
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
        {!isBillingTab && <button type='button' className='vdt-btn-pri' onClick={() => openModal(null, activeTab === 'quotes')}>
          <i className='mdi mdi-plus'></i> {activeTab === 'quotes' ? 'Crear cotizacion' : 'Crear venta'}
        </button>}
      </>}
      actions={rowActions}
      columns={isBillingTab ? billingVdColumns : saleVdColumns}
      renderCard={(row, actionButtons) => (
        <div className='vdt-card' onClick={() => (isBillingTab ? null : openModal(row))}>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>
                {isBillingTab ? billingDocumentNumber(row) : row.code}
              </p>
              <small className='text-muted'>{isBillingTab ? billingClientLabel(row) : row.patient}</small>
            </div>
            <span className='fw-semibold'>S/ {money(row.total)}</span>
          </div>
          <small className='text-muted d-block mt-2'>
            {isBillingTab
              ? billingStatusLabel(row)
              : (activeTab === 'quotes' ? row.sale_type : (paymentLabels[row.payment_status] ?? row.payment_status))}
          </small>
          {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />
    <Modal
      modalRef={modalRef}
      title={isEditing ? (modalDefaultQuote ? 'Editar cotizacion' : 'Editar venta') : (modalDefaultQuote ? 'Registrar cotizacion' : 'Registrar venta')}
      onSubmit={(e) => save(e, modalDefaultQuote)}
      size='xl'
      centered={false}
      dialogClass='magistrales-sale-dialog'
      contentClass='magistrales-sale-content'
      hideButtonSubmit
      footerActions={<>
        {!isEditing && <button type='button' className='btn btn-outline-primary' onClick={(e) => save(e, !modalDefaultQuote)}>
          <i className='mdi mdi-file-document-outline me-1'></i> Registrar {modalDefaultQuote ? 'venta' : 'cotizacion'}
        </button>}
        <button type='button' className='btn btn-primary' onClick={(e) => save(e, modalDefaultQuote)}>
          <i className='mdi mdi-check me-1'></i> {isEditing ? 'Guardar cambios' : `Registrar ${modalDefaultQuote ? 'cotizacion' : 'venta'}`}
        </button>
      </>}
    >
      <div className='row'>
        <input ref={idRef} hidden />

        <div className='col-12'>
          <h6 className='border-bottom pb-2 mb-3'><i className='mdi mdi-account-circle-outline me-1'></i> Datos del paciente</h6>
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' disabled={!isEditing} /></div>
        <div className='col-md-3 mb-3'>
          <label className='form-label'>Empresa</label>
          <input className='form-control' value={fixedBusinessLabel} readOnly disabled />
        </div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha</label><input ref={dateRef} type='date' className='form-control' /></div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Paciente</label>
          <div className='mag-sale-field-action'>
            <div>
              <input
                className='form-control'
                value={patientValue}
                placeholder='Seleccione paciente'
                readOnly
                onClick={openPatientSearch}
                style={{ cursor: 'pointer', backgroundColor: '#fff' }}
              />
            </div>
            <button type='button' className='btn btn-outline-primary' onClick={openPatientSearch} title='Buscar paciente'>
              <i className='mdi mdi-magnify'></i>
            </button>
            <button type='button' className='btn btn-outline-success' onClick={openPatientForm} title='Agregar paciente'>
              <i className='mdi mdi-account-plus'></i>
            </button>
            <button type='button' className='btn btn-outline-danger' onClick={clearPatient} title='Limpiar paciente'>
              <i className='mdi mdi-close'></i>
            </button>
          </div>
        </div>
        <div className='col-md-4 mb-3'>
          <div className='mag-sale-field-action'>
            <div>
              <VdSelect
                label='Doctor'
                noMargin
                value={doctorValue}
                onChange={(value) => setDoctorValue(value)}
                options={doctorSelectOptions}
                placeholder='Seleccione'
              />
            </div>
            <button type='button' className='btn btn-outline-success' onClick={openDoctorForm} title='Agregar doctor'>
              <i className='mdi mdi-plus'></i>
            </button>
          </div>
        </div>
        <VdSelect
          label='Tipo documento'
          col='col-md-4'
          value={selectedDocumentType}
          onChange={(value) => setSelectedDocumentType(value)}
          options={saleDocumentTypes.map(type => ({ value: type, label: type }))}
          placeholder='Seleccione'
        />
        <input ref={paymentStatusRef} type='hidden' />
        {isFacturaDocumentType && <>
          <div className='col-md-3 mb-3'>
            <label className='form-label'>RUC de facturacion</label>
            <input className='form-control' maxLength='11' value={billingRuc} onChange={(event) => setBillingRuc(event.target.value)} />
          </div>
          <div className='col-md-5 mb-3'>
            <label className='form-label'>Razon social</label>
            <input className='form-control' value={billingBusinessName} onChange={(event) => setBillingBusinessName(event.target.value)} />
          </div>
        </>}
        <VdSelect
          label='Politica descuento'
          col={isFacturaDocumentType ? 'col-md-3' : 'col-md-4'}
          value={discountPolicyValue}
          onChange={(value) => setDiscountPolicyValue(value)}
          options={discountPolicyOptions.filter(option => option.value !== noDiscountPolicyValue)}
          placeholder='Seleccione'
        />
        <VdSelect
          label='Tipo de venta'
          col='col-md-3'
          value={saleTypeValue}
          onChange={(value) => setSaleTypeValue(value)}
          options={saleTypeOptions.map(type => ({ value: type, label: type }))}
          placeholder='Seleccione'
        />
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
                  <th style={{ minWidth: 220 }}>Almacen - stock</th>
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
                    <td style={{ minWidth: 230 }}>
                      <VdSelect
                        noMargin
                        value={item.article_id}
                        onChange={(value) => selectArticle(item.uid, value)}
                        options={articleSelectOptions}
                        placeholder='Articulo'
                      />
                    </td>
                    <td className='align-middle text-muted small'>
                      <div className='d-flex flex-column'>
                        {(item.warehouse_stock_rows?.length ? item.warehouse_stock_rows : [fixedWarehouseLabel]).map((label, index) => (
                          <span key={`${item.uid}-warehouse-${index}`}>{label}</span>
                        ))}
                      </div>
                    </td>
                    <td><input className='form-control form-control-sm bg-light' type='number' step='0.001' value={item.stock} readOnly /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm bg-light' type='number' min='0' step='0.01' value={item.unit_price} readOnly /></td>
                    <td><input className='form-control form-control-sm bg-light' type='number' min='0' step='0.01' value={item.discount} readOnly /></td>
                    <td className='align-middle'>S/ {itemSubtotal(item).toFixed(2)}</td>
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
          <input className='form-control' inputMode='numeric' placeholder='Numero de colegiatura CMP' value={doctorForm.cmp} onChange={(event) => updateDoctorForm('cmp', event.target.value.replace(/\D+/g, ''))} />
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
        <VdSelect
          label='Tipo de Documento'
          col='col-md-2'
          value={patientForm.document_type}
          onChange={(value) => updatePatientForm('document_type', value)}
          options={identityDocumentTypes.map(type => ({ value: type, label: type }))}
          placeholder='Seleccione'
        />
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
        <VdSelect
          label='Sexo'
          col='col-md-4'
          value={patientForm.sex}
          onChange={(value) => updatePatientForm('sex', value)}
          options={patientSexOptions.map(option => ({ value: option, label: option }))}
          placeholder='Seleccione'
        />
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
