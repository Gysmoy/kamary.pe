import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '../Components/Adminto/Modal';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import { Fetch } from 'sode-extend-react';
import { scopedPermission } from '../Utils/permissionScope';
import ArticlesRest from '../Actions/Admin/ArticlesRest';
import UnitsRest from '../Actions/Admin/UnitsRest';
import LaboratoriesRest from '../Actions/Admin/LaboratoriesRest';
import CatalogManagerModal from '../Components/Adminto/CatalogManagerModal';
import setSwitchChecked from '../Utils/setSwitchChecked';

const articlesRest = new ArticlesRest()
const unitsRest = new UnitsRest()
const laboratoriesRest = new LaboratoriesRest()

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

const normalizeHeader = (value) => (value ?? '')
  .toString()
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')

const parseFileRows = async (file) => {
  const extension = (file.name.split('.').pop() || '').toLowerCase()
  let rows = []

  if (extension === 'json') {
    const text = await file.text()
    const parsed = JSON.parse(text)

    if (Array.isArray(parsed)) {
      rows = parsed
    } else if (parsed && typeof parsed === 'object') {
      const firstArray = Object.values(parsed).find(value => Array.isArray(value))
      if (!firstArray) throw new Error('El JSON debe ser un array o contener un array en algun campo')
      rows = firstArray
    } else {
      throw new Error('Formato JSON invalido')
    }
  } else {
    const content = await file.arrayBuffer()
    const workbook = XLSX.read(content, { type: 'array' })
    const firstSheet = workbook.SheetNames[0]
    if (!firstSheet) throw new Error('No se encontro ninguna hoja en el archivo')
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' })
  }

  if (!Array.isArray(rows)) throw new Error('El archivo no contiene una coleccion de registros')
  if (rows.length === 0) throw new Error('El archivo no tiene filas para importar')

  return rows
}

const emptyPresentation = (overrides = {}) => ({
  uid: crypto.randomUUID(),
  name: '',
  units: 1,
  price: 0,
  purchase_price_national: 0,
  purchase_price_foreign: 0,
  ...overrides,
})

const emptyStorageLot = () => ({
  uid: crypto.randomUUID(),
  lot: '',
  expiration_date: '',
  storage_condition: '',
  manufacturer_id: '',
  status: true,
})

const magistralStatusOptions = [
  { value: 'vigente', label: 'VIGENTE' },
  { value: 'vencido', label: 'VENCIDO' },
  { value: 'de_baja', label: 'DE BAJA' },
  { value: 'agotado', label: 'AGOTADO' },
]

const magistralStatusMeta = {
  vigente: { label: 'VIGENTE', className: 'bg-success' },
  vencido: { label: 'VENCIDO', className: 'bg-warning text-dark' },
  de_baja: { label: 'DE BAJA', className: 'bg-secondary' },
  agotado: { label: 'AGOTADO', className: 'bg-info' },
}

const getMagistralStatusValue = (data) => {
  const rawValue = data?.magistral_status ?? data?.magistralStatus
  const normalized = rawValue?.toString?.().trim().toLowerCase().replaceAll(' ', '_').replaceAll('-', '_')
  if (normalized && magistralStatusMeta[normalized]) return normalized
  return data?.status === false || data?.status === 0 ? 'de_baja' : 'vigente'
}

const magistralArticleTypeOptions = [
  'INSUMO',
  'ENVASES',
  'PRODUCTO COMERCIAL',
  'PRODUCTO TERMINADO',
  'BASE ESTANDARIZADA',
  'FORMULA',
]
const magistralArticleTypeFilterOptions = ['', ...magistralArticleTypeOptions]
const magistralAdministrationRouteOptions = [
  'N/A',
  'TOPICO',
  'ORAL',
  'ENDOVENOSO',
  'VAGINAL',
  'INTRAMUSCULAR',
  'INTRAMUSCULAR/INTRAARTICULAR',
  'INTRAUTERINO',
  'SUBDÉRMICA',
  'INTRAVENOSO',
  'ORAL-TOPICO',
]

const normalizeMagistralArticleType = (value) => {
  const rawValue = (value ?? '').toString().trim()
  const normalized = rawValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  if (!normalized) return ''
  if (normalized.includes('INSUMO')) return 'INSUMO'
  if (normalized.includes('ENVASE')) return 'ENVASES'
  if (normalized.includes('COMERCIAL')) return 'PRODUCTO COMERCIAL'
  if (normalized.includes('TERMINADO')) return 'PRODUCTO TERMINADO'
  if (normalized.includes('BASE')) return 'BASE ESTANDARIZADA'
  if (normalized.includes('FORMULA')) return 'FORMULA'
  if (normalized.includes('PRODUCTO')) return 'PRODUCTO TERMINADO'
  return rawValue.toUpperCase()
}

const magistralEquivalenceDefaultsByType = {
  INSUMO: [
    { units: 1, name: 'Kg' },
    { units: 1000, name: 'g' },
    { units: 1000000, name: 'mg' },
    { units: 1000000000, name: 'mcg' },
  ],
  ENVASES: [
    { units: 1, name: 'U' },
    { units: 1000, name: 'MLL' },
  ],
  'PRODUCTO TERMINADO': [
    { units: 1, name: 'U' },
  ],
  'PRODUCTO COMERCIAL': [
    { units: 1, name: 'U' },
  ],
  'BASE ESTANDARIZADA': [
    { units: 1, name: 'U' },
  ],
  FORMULA: [
    { units: 1, name: 'U' },
  ],
}

const allowedMagistralCategoryLabels = [
  'GINECOLOGIA',
  'INSUMOS',
  'ANDROLOGIA',
  'DERMATOLOGIA',
  'PEDIATRIA',
  'GASTROENTEROLOGIA',
  'DOLOR',
  'COSMETICA',
  'CAPSULAS',
  'NUTRICION',
]

const magistralPresentationOptions = [
  'BOLSA',
  'CAJA',
  'CREMA',
  'FRASCO',
  'LIQUIDO',
  'POLVO',
  'POTE',
  'ROLLO',
  'TUBO',
  'UNIDAD',
]

const isAllowedMagistralCategory = (value) => {
  const normalized = normalizeHeader(value)
  return allowedMagistralCategoryLabels.some(label => normalizeHeader(label) === normalized)
}

const getMagistralPresentationValue = (value) => {
  const normalized = normalizeHeader(value)
  if (!normalized) return ''

  const direct = magistralPresentationOptions.find(option => normalizeHeader(option) === normalized)
  if (direct) return direct

  const aliases = {
    CREMA: ['crema'],
    LIQUIDO: ['liquido', 'jarabe', 'solucion', 'suspension', 'gotas'],
    POTE: ['pote'],
    TUBO: ['tubo'],
    UNIDAD: ['unidad', 'und'],
  }

  return Object.entries(aliases)
    .find(([, needles]) => needles.some(needle => normalized.includes(needle)))?.[0] ?? ''
}

const getArticleLaboratoryId = (data) => (data?.laboratory_id ? `${data.laboratory_id}` : '')

const getArticleLaboratoryLabel = (data) => data?.laboratory?.name ?? ''

const getMagistralEquivalenceDefaults = (articleType) => {
  const normalizedType = normalizeMagistralArticleType(articleType)
  return (magistralEquivalenceDefaultsByType[normalizedType] ?? [])
    .map(row => emptyPresentation({
      ...row,
      price: 0,
      purchase_price_national: 0,
      purchase_price_foreign: 0,
    }))
}

const joinDxFilters = (filters, operator) => filters
  .filter(Boolean)
  .reduce((current, filter) => current ? [current, operator, filter] : filter, null)

const buildMagistralArticleTypeFilter = (value) => {
  const normalizedType = normalizeMagistralArticleType(value)
  if (!normalizedType) return null

  const aliases = {
    INSUMO: ['INSUMO', 'INSUMOS'],
    ENVASES: ['ENVASES', 'ENVASE'],
    'PRODUCTO COMERCIAL': ['PRODUCTO COMERCIAL'],
    'PRODUCTO TERMINADO': ['PRODUCTO TERMINADO'],
    'BASE ESTANDARIZADA': ['BASE ESTANDARIZADA'],
    FORMULA: ['FORMULA'],
  }

  return joinDxFilters(
    (aliases[normalizedType] ?? [normalizedType]).map(type => ['article_type', '=', type]),
    'or'
  )
}

const buildMagistralStatusFilter = (value) => {
  const normalizedStatus = value?.toString?.().trim().toLowerCase().replaceAll(' ', '_').replaceAll('-', '_')
  if (!normalizedStatus) return null

  if (normalizedStatus === 'vigente') {
    return joinDxFilters([
      ['magistral_status', '=', 'vigente'],
      ['magistral_status', '=', 'active'],
      ['magistral_status', '=', null],
    ], 'or')
  }

  if (normalizedStatus === 'de_baja') {
    return joinDxFilters([
      ['magistral_status', '=', 'de_baja'],
      ['status', '=', false],
    ], 'or')
  }

  return ['magistral_status', '=', normalizedStatus]
}

const buildMagistralFilterValue = (filters) => joinDxFilters([
  buildMagistralArticleTypeFilter(filters?.articleType),
  buildMagistralStatusFilter(filters?.status),
], 'and')

const storageConditionOptions = [
  '-15°C a -25°C',
  '2°C a 8°C',
  '15°C a 25°C',
  '-15°C a -40°C',
]

const manufacturerCountryOptions = ['Perú']

const articleImportTypeOptions = [
  { value: 'upsert', label: 'CREACION / ACTUALIZACION DE ARTICULOS' },
]

const standardArticleImportTypeOptions = [
  ...articleImportTypeOptions,
  { value: 'pack_components', label: 'CREACION / ACTUALIZACION DE COMPONENTES DE PACKS' },
  { value: 'corporate_catalog', label: 'CREACION / ACTUALIZACION DE ARTICULOS - CATALOGO CORPORATIVO' },
]

const emptyArticleImportMapping = () => ({
  code: '',
  name: '',
  pack_code: '',
  pack_name: '',
  component_code: '',
  component_name: '',
  component_quantity: '',
  warehouse: '',
  laboratory: '',
  active_principle: '',
  unit: '',
  status: '',
})

const storageProductExportColumns = [
  { caption: 'ACCIONES', value: () => '' },
  { caption: 'CODIGO', value: (row) => row?.code ?? '' },
  { caption: 'CLIENTE', value: (row) => row?.client?.full_name ?? '' },
  { caption: 'NOMBRE ARTICULO', value: (row) => row?.name ?? '' },
  { caption: 'UNIDAD', value: (row) => row?.unit?.symbol || row?.unit?.name || '' },
  { caption: 'ESTADO', value: (row) => row?.status === false || row?.status === 0 ? 'Inactivo' : 'Activo' },
]

const getStockByPresentation = (stockUnits, presentations) => {
  const totalUnits = Number(stockUnits || 0)
  const safeUnits = Number.isFinite(totalUnits) ? totalUnits : 0
  const rows = Array.isArray(presentations) ? presentations : []

  if (!rows.length) {
    const full = Math.floor(Math.max(0, safeUnits))
    return [{ label: 'Unidad', units: 1, full, totalUnits: safeUnits }]
  }

  return rows
    .map((presentation) => {
      const units = Number(presentation?.units || 0)
      const safePresentationUnits = Number.isFinite(units) && units > 0 ? units : 1
      const full = Math.floor(Math.max(0, safeUnits) / safePresentationUnits)
      return {
        label: presentation?.name || 'Presentacion',
        units: safePresentationUnits,
        full,
        totalUnits: safeUnits,
      }
    })
}

const Articles = ({ moduleTitle = 'Articulos', moduleScope, businessScopeKey }) => {
  const isMagistrales = moduleScope === 'magistrales'
  const isStorageProduct = moduleScope === 'storage'
  const importTypeOptions = !isStorageProduct && !isMagistrales
    ? standardArticleImportTypeOptions
    : articleImportTypeOptions

  const onArticleScopeChanged = (value) => {
    if (value === 'magistrales' && !isMagistrales) {
      window.location.href = '/admin/magistrales/articles'
    } else if (value === 'standard' && isMagistrales) {
      window.location.href = '/admin/articles'
    }
  }

  const tableRef = useRef()
  const modalRef = useRef()
  const stockModalRef = useRef()
  const importModalRef = useRef()
  const importFileRef = useRef()
  const labManagerRef = useRef()
  const principleManagerRef = useRef()
  const unitManagerRef = useRef()
  const manufacturerCreateModalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const nameRef = useRef()
  const compositionRef = useRef()
  const healthRegistrationRef = useRef()
  const volumeRef = useRef()
  const marginRuleRef = useRef()
  const igvRuleRef = useRef()
  const unitsPerArticleRef = useRef()
  const unitWeightRef = useRef()
  const defaultLotRef = useRef()
  const defaultExpirationDateRef = useRef()
  const stockMinRef = useRef()
  const stockMaxRef = useRef()
  const stockHasExpirationRef = useRef()
  const stockHasLotRef = useRef()
  const costPriceRef = useRef()
  const salePriceRef = useRef()
  const equivalenceExchangeRateRef = useRef()
  const equivalenceQuantityRef = useRef()
  const salePriceNationalRef = useRef()
  const purchasePriceNationalRef = useRef()
  const purchasePriceForeignRef = useRef()
  const notesRef = useRef()
  const newManufacturerNameRef = useRef()
  const subcategoryLoadSequenceRef = useRef(0)

  const [isEditing, setIsEditing] = useState(false)
  const [isViewing, setIsViewing] = useState(false)
  const [principles, setPrinciples] = useState([])
  const [units, setUnits] = useState([])
  const [presentations, setPresentations] = useState([emptyPresentation()])
  const [businesses, setBusinesses] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState('')
  const [selectedLaboratoryLabel, setSelectedLaboratoryLabel] = useState('')
  const [selectedPrincipleId, setSelectedPrincipleId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [selectedEquivalenceUnitId, setSelectedEquivalenceUnitId] = useState('')
  const [selectedStorageClientId, setSelectedStorageClientId] = useState('')
  const [selectedMagistralCategoryId, setSelectedMagistralCategoryId] = useState('')
  const [selectedMagistralCategoryLabel, setSelectedMagistralCategoryLabel] = useState('')
  const [selectedSubCategory, setSelectedSubCategory] = useState('')
  const [selectedMagistralPresentation, setSelectedMagistralPresentation] = useState('')
  const [magistralSubcategories, setMagistralSubcategories] = useState([])
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false)
  const [manufacturerTargetLotUid, setManufacturerTargetLotUid] = useState('')
  const [storageClients, setStorageClients] = useState([])
  // Alta masiva del catalogo de un cliente. Modal propio y simple: el import de articulos estandar
  // maneja packs y catalogo corporativo, que aqui no aplican, y ademas no asigna cliente.
  const stgImportModalRef = useRef()
  const stgImportFileRef = useRef()
  const [stgRows, setStgRows] = useState([])
  const [stgHeaders, setStgHeaders] = useState([])
  const [stgFileName, setStgFileName] = useState('')
  const [stgClientId, setStgClientId] = useState('')
  const [stgImporting, setStgImporting] = useState(false)
  const [stgMapping, setStgMapping] = useState({ code: '', name: '', unit: '' })
  const [storageManufacturers, setStorageManufacturers] = useState([])
  const [storageLots, setStorageLots] = useState([emptyStorageLot()])
  const [isImporting, setIsImporting] = useState(false)
  const [isLoadingStock, setIsLoadingStock] = useState(false)
  const [stockArticle, setStockArticle] = useState(null)
  const [stockRows, setStockRows] = useState([])
  const [magistralFilterDraft, setMagistralFilterDraft] = useState({
    articleType: '',
    status: 'vigente',
  })
  const [magistralAppliedFilters, setMagistralAppliedFilters] = useState({
    articleType: '',
    status: 'vigente',
  })
  const [importRows, setImportRows] = useState([])
  const [importHeaders, setImportHeaders] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [filterLaboratories, setFilterLaboratories] = useState([])
  const [filterPrinciples, setFilterPrinciples] = useState([])
  const [standardFilterDraft, setStandardFilterDraft] = useState({
    laboratoryId: '',
    principleId: '',
    code: '',
  })
  const [standardAppliedFilters, setStandardAppliedFilters] = useState({
    laboratoryId: '',
    principleId: '',
    code: '',
  })
  const [selectedImportBusinessId, setSelectedImportBusinessId] = useState('')
  const [selectedImportLaboratoryName, setSelectedImportLaboratoryName] = useState('')
  const [selectedImportType, setSelectedImportType] = useState('upsert')
  const [mapping, setMapping] = useState(emptyArticleImportMapping())
  const [selectedStatus, setSelectedStatus] = useState('1')
  const [selectedArticleType, setSelectedArticleType] = useState('')
  const [selectedAdministrationRoute, setSelectedAdministrationRoute] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('PEN')
  const [selectedManufacturerCountry, setSelectedManufacturerCountry] = useState(manufacturerCountryOptions[0])
  const [selectedManufacturerStatus, setSelectedManufacturerStatus] = useState('1')

  const defaultBusinessId = (rows = businesses) => {
    const scoped = rows.find(item => item.business_key === businessScopeKey)
    const active = rows.find(item => item.status !== false && item.status !== 0)
    return scoped?.id ? `${scoped.id}` : (active?.id ? `${active.id}` : '')
  }

  const loadBusinesses = async () => {
    const rows = (await articlesRest.getBusinesses()).filter(item => item.status !== null)
    setBusinesses(rows)
    return rows
  }

  const loadWarehouses = async () => {
    const rows = (await articlesRest.getWarehouses()).filter(item => item.status !== null)
    setWarehouses(rows)
    return rows
  }

  const loadStandardFilterOptions = async () => {
    const rows = (await articlesRest.getLaboratories()).filter(item => item.status !== null)
    setFilterLaboratories(rows)
    return rows
  }

  const loadUnits = async (preferredUnitId = null, preferredEquivalenceUnitId = null) => {
    const list = await articlesRest.getUnits()
    const active = list.filter(item => item.status !== null)
    setUnits(active)

    if (preferredUnitId && active.some(item => `${item.id}` === `${preferredUnitId}`)) {
      setSelectedUnitId(`${preferredUnitId}`)
    } else {
      setSelectedUnitId('')
    }

    if (preferredEquivalenceUnitId && active.some(item => `${item.id}` === `${preferredEquivalenceUnitId}`)) {
      setSelectedEquivalenceUnitId(`${preferredEquivalenceUnitId}`)
    } else {
      setSelectedEquivalenceUnitId('')
    }
  }

  const loadPrinciples = async (laboratoryId, preferredPrincipleId = null) => {
    if (!laboratoryId) {
      setPrinciples([])
      setSelectedPrincipleId('')
      return
    }

    const data = await articlesRest.getPrinciplesByLaboratory(laboratoryId)
    const active = (data ?? []).filter(item => item.status !== null)
    setPrinciples(active)

    if (preferredPrincipleId && active.some(item => `${item.id}` === `${preferredPrincipleId}`)) {
      setSelectedPrincipleId(`${preferredPrincipleId}`)
      return
    }
    setSelectedPrincipleId('')
  }

  const findSubcategoryDescription = (rows, value) => {
    const normalizedValue = normalizeHeader(value)
    if (!normalizedValue) return ''
    return rows.find(item => normalizeHeader(item?.description) === normalizedValue)?.description ?? ''
  }

  const loadMagistralSubcategories = async (categoryId, preferredSubCategory = '') => {
    const normalizedCategoryId = categoryId ? `${categoryId}` : ''
    const loadSequence = ++subcategoryLoadSequenceRef.current

    setSelectedMagistralCategoryId(normalizedCategoryId)
    setMagistralSubcategories([])
    setSelectedSubCategory('')

    if (!normalizedCategoryId) {
      setIsLoadingSubcategories(false)
      return
    }

    setIsLoadingSubcategories(true)
    const rows = await articlesRest.getMagistralSubcategories(normalizedCategoryId)
    if (loadSequence !== subcategoryLoadSequenceRef.current) return

    const activeRows = (rows ?? []).filter(item => item.status !== null)
    setMagistralSubcategories(activeRows)
    setSelectedSubCategory(findSubcategoryDescription(activeRows, preferredSubCategory))
    setIsLoadingSubcategories(false)
  }

  const onMagistralCategoryChanged = async (value) => {
    await loadMagistralSubcategories(value)
  }

  const onMagistralFilterChanged = (field, value) => {
    setMagistralFilterDraft(prev => ({ ...prev, [field]: value }))
  }

  const onMagistralFilterSubmitted = (e) => {
    e.preventDefault()
    setMagistralAppliedFilters({ ...magistralFilterDraft })
  }

  const onStandardFilterLaboratoryChanged = async (value) => {
    setStandardFilterDraft(prev => ({ ...prev, laboratoryId: value, principleId: '' }))
    setFilterPrinciples([])
    if (!value) return
    const rows = await articlesRest.getPrinciplesByLaboratory(value)
    setFilterPrinciples((rows ?? []).filter(item => item.status !== null))
  }

  const onStandardFilterSubmitted = (e) => {
    e.preventDefault()
    setStandardAppliedFilters({ ...standardFilterDraft })
  }

  const loadStorageProductOptions = async () => {
    const [clients, manufacturers] = await Promise.all([
      articlesRest.getStorageClients(),
      articlesRest.getManufacturers(),
    ])

    setStorageClients(clients)
    setStorageManufacturers(manufacturers)
  }

  useEffect(() => {
    if (!isStorageProduct) return
    loadStorageProductOptions()
    loadUnits()
  }, [isStorageProduct])

  useEffect(() => {
    if (isStorageProduct || isMagistrales) return
    loadBusinesses()
    loadWarehouses()
    loadStandardFilterOptions()
  }, [isStorageProduct, isMagistrales])

  const onModalOpen = async (data = null, mode = 'edit') => {
    setIsEditing(!!data?.id)
    setIsViewing(mode === 'view')
    let availableBusinesses = businesses
    if (!isStorageProduct && !isMagistrales && availableBusinesses.length === 0) {
      availableBusinesses = await loadBusinesses()
    }
    if (!isStorageProduct && !isMagistrales) {
      setSelectedBusinessId(data?.business_id ? `${data.business_id}` : defaultBusinessId(availableBusinesses))
      if (warehouses.length === 0) await loadWarehouses()
      setSelectedWarehouseId(data?.warehouse_id ? `${data.warehouse_id}` : '')
    } else {
      setSelectedBusinessId('')
      setSelectedWarehouseId('')
    }

    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? ''
    nameRef.current.value = data?.name ?? ''
    if (compositionRef.current) compositionRef.current.value = data?.composition ?? ''
    const normalizedArticleType = normalizeMagistralArticleType(data?.article_type ?? '')
    setSelectedArticleType(isMagistrales ? normalizedArticleType : '')
    setSelectedAdministrationRoute(isMagistrales ? (data?.administration_route ?? '') : '')
    if (healthRegistrationRef.current) healthRegistrationRef.current.value = data?.health_registration ?? ''
    if (volumeRef.current) volumeRef.current.value = data?.volume ?? ''
    if (marginRuleRef.current) marginRuleRef.current.checked = !!data?.margin_rule
    if (igvRuleRef.current) {
      if (isMagistrales) {
        setSwitchChecked(igvRuleRef.current, !!data?.igv_rule)
      } else {
        igvRuleRef.current.checked = !!data?.igv_rule
      }
    }
    if (unitsPerArticleRef.current) unitsPerArticleRef.current.value = data?.units_per_article ?? 1
    if (unitWeightRef.current) unitWeightRef.current.value = data?.unit_weight ?? ''
    if (defaultLotRef.current) defaultLotRef.current.value = data?.default_lot ?? ''
    if (defaultExpirationDateRef.current) defaultExpirationDateRef.current.value = data?.default_expiration_date ? data.default_expiration_date.toString().slice(0, 10) : ''
    if (stockMinRef.current) stockMinRef.current.value = data?.stock_min ?? ''
    if (stockMaxRef.current) stockMaxRef.current.value = data?.stock_max ?? ''
    setSelectedCurrency(isMagistrales ? (data?.currency ?? 'PEN') : '')
    if (stockHasExpirationRef.current) {
      if (isMagistrales) {
        setSwitchChecked(stockHasExpirationRef.current, !!data?.stock_has_expiration)
      } else {
        stockHasExpirationRef.current.checked = !!data?.stock_has_expiration
      }
    }
    if (stockHasLotRef.current) {
      if (isMagistrales) {
        setSwitchChecked(stockHasLotRef.current, !!data?.stock_has_lot)
      } else {
        stockHasLotRef.current.checked = !!data?.stock_has_lot
      }
    }
    if (isMagistrales) {
      setSelectedStatus(getMagistralStatusValue(data))
    } else {
      setSelectedStatus(data?.status === false || data?.status === 0 ? '0' : '1')
    }
    if (costPriceRef.current) costPriceRef.current.value = data?.cost_price ?? ''
    if (salePriceRef.current) salePriceRef.current.value = data?.sale_price ?? ''
    if (equivalenceExchangeRateRef.current) equivalenceExchangeRateRef.current.value = data?.equivalence_exchange_rate ?? ''
    if (equivalenceQuantityRef.current) equivalenceQuantityRef.current.value = data?.equivalence_quantity ?? ''
    if (salePriceNationalRef.current) salePriceNationalRef.current.value = data?.sale_price_national ?? ''
    if (purchasePriceNationalRef.current) purchasePriceNationalRef.current.value = data?.purchase_price_national ?? ''
    if (purchasePriceForeignRef.current) purchasePriceForeignRef.current.value = data?.purchase_price_foreign ?? ''
    if (notesRef.current) notesRef.current.value = data?.notes ?? ''

    const selectedCategoryIsAllowed = data?.magistral_category_id && data?.magistralCategory?.description && isAllowedMagistralCategory(data.magistralCategory.description)
    const preferredMagistralCategoryId = selectedCategoryIsAllowed ? data.magistral_category_id : null
    setSelectedMagistralCategoryLabel(preferredMagistralCategoryId ? (data?.magistralCategory?.description ?? '') : '')
    loadMagistralSubcategories(preferredMagistralCategoryId, data?.sub_category ?? '')
    setSelectedMagistralPresentation(getMagistralPresentationValue(data?.magistral_presentation ?? data?.magistralFormat?.description ?? ''))

    if (isStorageProduct) {
      setSelectedStorageClientId(data?.client_id ? `${data.client_id}` : '')
      const lotRows = (data?.storage_lots ?? data?.storageLots ?? []).map(lot => ({
        uid: crypto.randomUUID(),
        lot: lot?.lot ?? '',
        expiration_date: lot?.expiration_date ? lot.expiration_date.toString().slice(0, 10) : '',
        storage_condition: lot?.storage_condition ?? '',
        manufacturer_id: lot?.manufacturer_id ? `${lot.manufacturer_id}` : '',
        status: lot?.status !== false && lot?.status !== 0,
      }))
      setStorageLots(lotRows.length ? lotRows : [emptyStorageLot()])
    } else {
      setSelectedStorageClientId('')
      setStorageLots([emptyStorageLot()])
      const laboratoryId = getArticleLaboratoryId(data)
      const laboratoryLabel = getArticleLaboratoryLabel(data)
      setSelectedLaboratoryId(laboratoryId)
      setSelectedLaboratoryLabel(laboratoryId ? laboratoryLabel : '')
    }

    const presentationRows = (data?.presentations ?? []).map(presentation => ({
      uid: crypto.randomUUID(),
      name: presentation.name ?? '',
      units: presentation.units ?? 1,
      price: presentation.price ?? 0,
      purchase_price_national: presentation.purchase_price_national ?? data?.purchase_price_national ?? 0,
      purchase_price_foreign: presentation.purchase_price_foreign ?? data?.purchase_price_foreign ?? 0,
    }))
    setPresentations(presentationRows.length ? presentationRows : (isMagistrales ? getMagistralEquivalenceDefaults(normalizedArticleType) : [emptyPresentation()]))

    $(modalRef.current).modal('show')
    await loadUnits(data?.unit_id ?? null, data?.equivalence_unit_id ?? null)
    if (isStorageProduct) {
      await loadStorageProductOptions()
    } else if (isMagistrales) {
      setPrinciples([])
      setSelectedPrincipleId('')
    } else {
      await loadPrinciples(data?.laboratory_id ?? null, data?.active_principle_id ?? null)
    }
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()
    const firstPresentation = presentations[0] ?? {}

    const request = {
      id: idRef.current.value || undefined,
      code: codeRef.current.value.trim(),
      name: nameRef.current.value.trim(),
      composition: compositionRef.current?.value?.trim() ?? '',
      article_type: isMagistrales ? normalizeMagistralArticleType(selectedArticleType) : '',
      administration_route: (selectedAdministrationRoute ?? '').toString().trim(),
      magistral_category_id: selectedMagistralCategoryId || null,
      sub_category: (selectedSubCategory || '').trim(),
      magistral_presentation: selectedMagistralPresentation || null,
      health_registration: healthRegistrationRef.current?.value?.trim() ?? '',
      business_id: (!isStorageProduct && !isMagistrales) ? (selectedBusinessId || null) : null,
      warehouse_id: (!isStorageProduct && !isMagistrales) ? (selectedWarehouseId || null) : null,
      laboratory_id: selectedLaboratoryId || null,
      active_principle_id: isMagistrales ? null : (selectedPrincipleId || null),
      unit_id: selectedUnitId || null,
      volume: volumeRef.current?.value ?? '',
      margin_rule: marginRuleRef.current?.checked ?? false,
      igv_rule: igvRuleRef.current?.checked ?? false,
      units_per_article: unitsPerArticleRef.current?.value || 1,
      ...(isMagistrales ? {
        magistral_status: selectedStatus || 'vigente',
        status: selectedStatus !== 'de_baja',
      } : {}),
      ...(!isMagistrales && !isStorageProduct ? {
        status: selectedStatus === '0' ? false : true,
      } : {}),
      ...(isStorageProduct ? {
        client_id: selectedStorageClientId || null,
        status: selectedStatus === '0' ? false : true,
        storage_lots: storageLots.map(item => ({
          lot: (item.lot ?? '').toString().trim(),
          expiration_date: item.expiration_date || null,
          storage_condition: item.storage_condition || null,
          manufacturer_id: item.manufacturer_id || null,
          status: item.status !== false,
        })),
      } : {}),
      unit_weight: unitWeightRef.current?.value ?? '',
      default_lot: defaultLotRef.current?.value?.trim() ?? '',
      default_expiration_date: defaultExpirationDateRef.current?.value || null,
      stock_min: stockMinRef.current?.value ?? '',
      stock_max: stockMaxRef.current?.value ?? '',
      currency: selectedCurrency ?? '',
      stock_has_expiration: stockHasExpirationRef.current?.checked ?? false,
      stock_has_lot: stockHasLotRef.current?.checked ?? false,
      cost_price: costPriceRef.current?.value ?? '',
      sale_price: salePriceRef.current?.value ?? '',
      equivalence_exchange_rate: equivalenceExchangeRateRef.current?.value ?? '',
      equivalence_quantity: equivalenceQuantityRef.current?.value ?? '',
      equivalence_unit_id: selectedEquivalenceUnitId || null,
      sale_price_national: isMagistrales ? (firstPresentation.price === '' ? 0 : (firstPresentation.price ?? 0)) : (salePriceNationalRef.current?.value ?? ''),
      purchase_price_national: isMagistrales ? (firstPresentation.purchase_price_national === '' ? 0 : (firstPresentation.purchase_price_national ?? 0)) : (purchasePriceNationalRef.current?.value ?? ''),
      purchase_price_foreign: isMagistrales ? (firstPresentation.purchase_price_foreign === '' ? 0 : (firstPresentation.purchase_price_foreign ?? 0)) : (purchasePriceForeignRef.current?.value ?? ''),
      notes: notesRef.current?.value?.trim() ?? '',
      presentations: isStorageProduct ? [] : presentations.map(item => ({
        name: (item.name ?? '').toString().trim(),
        units: item.units,
        price: item.price === '' ? 0 : (item.price ?? 0),
        purchase_price_national: item.purchase_price_national === '' ? 0 : (item.purchase_price_national ?? 0),
        purchase_price_foreign: item.purchase_price_foreign === '' ? 0 : (item.purchase_price_foreign ?? 0),
      }))
    }

    const result = await articlesRest.save(request)
    if (!result) return

    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await articlesRest.boolean({ id, field, value })
    if (!result) return
    tableRef.current?.refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar articulo',
      text: 'Estas seguro de eliminar este articulo? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await articlesRest.delete(id)
    if (!result) return
    tableRef.current?.refresh()
  }

  const onOpenStockModal = async (article) => {
    setIsLoadingStock(true)
    setStockRows([])
    setStockArticle({
      id: article?.id ?? null,
      code: article?.code ?? '',
      name: article?.name ?? '',
    })
    $(stockModalRef.current).modal('show')

    const result = await articlesRest.getStockByWarehouse(article?.id)
    if (!result) {
      setIsLoadingStock(false)
      return
    }

    setStockArticle(result.article ?? null)
    setStockRows(result.warehouses ?? [])
    setIsLoadingStock(false)
  }

  const onImportModalOpen = async () => {
    let availableBusinesses = businesses
    if (!isStorageProduct && !isMagistrales && availableBusinesses.length === 0) {
      availableBusinesses = await loadBusinesses()
    }
    if (!isStorageProduct && !isMagistrales && warehouses.length === 0) {
      await loadWarehouses()
    }

    setImportRows([])
    setImportHeaders([])
    setImportFileName('')
    setSelectedImportBusinessId(defaultBusinessId(availableBusinesses))
    setSelectedImportLaboratoryName('')
    setSelectedImportType('upsert')
    setMapping(emptyArticleImportMapping())
    if (importFileRef.current) importFileRef.current.value = ''
    $(importModalRef.current).modal('show')
  }

  const autoMapHeaders = (headers) => {
    const withNorm = headers.map(header => ({
      header,
      norm: normalizeHeader(header)
    }))
    const findByNames = (candidates) => withNorm.find(({ norm }) => candidates.includes(norm))?.header ?? ''

    return {
      code: findByNames(['loteean', 'codigolote', 'codigo', 'code', 'codigodearticulo', 'sku', 'ean', 'lote']),
      name: findByNames(['descripcion', 'description', 'name', 'nombre', 'articulo', 'producto']),
      pack_code: findByNames(['codigopack', 'packcodigo', 'packcode', 'skupack', 'eanpack', 'loteeanpack']),
      pack_name: findByNames(['nombrepack', 'packnombre', 'descripcionpack', 'packdescription', 'packname']),
      component_code: findByNames(['codigocomponente', 'componentecode', 'skucomponente', 'eancomponente', 'codigodecomponente', 'codigocomponentepack']),
      component_name: findByNames(['nombrecomponente', 'componentename', 'descripcioncomponente', 'componentedescription']),
      component_quantity: findByNames(['cantidadcomponente', 'componentquantity', 'cantidad', 'quantity', 'qty', 'unidadescomponente']),
      warehouse: findByNames(['almacen', 'warehouse']),
      laboratory: findByNames(['laboratorio', 'laboratory']),
      active_principle: findByNames(['principioactivo', 'activeprinciple', 'principio']),
      unit: findByNames(['unidad', 'unit', 'unidadmedida']),
      status: findByNames(['estado', 'status', 'activo', 'active', 'habilitado']),
    }
  }

  const onImportFileChanged = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const rows = await parseFileRows(file)
      const headersSet = new Set()
      rows.forEach(row => {
        if (row && typeof row === 'object') {
          Object.keys(row).forEach(key => headersSet.add(key))
        }
      })

      const headers = Array.from(headersSet)
      setImportRows(rows)
      setImportHeaders(headers)
      setImportFileName(file.name)
      setMapping(autoMapHeaders(headers))
    } catch (error) {
      setImportRows([])
      setImportHeaders([])
      setImportFileName('')
      setMapping(emptyArticleImportMapping())
      Swal.fire({
        icon: 'error',
        title: 'No se pudo leer el archivo',
        text: error.message
      })
    }
  }

  const selectedImportWarehouseName = () => {
    if (isStorageProduct || isMagistrales) return ''
    const activeWarehouses = warehouses.filter(item => item.status !== null)
    const byBusiness = selectedImportBusinessId
      ? activeWarehouses.find(item => `${item?.branch?.business?.id ?? item?.branch?.business_id ?? ''}` === `${selectedImportBusinessId}`)
      : null
    return (byBusiness ?? activeWarehouses[0])?.name ?? ''
  }

  const rowsPreparedForImport = () => {
    let preparedRows = importRows
    const preparedMapping = { ...mapping }

    if (!isStorageProduct && !isMagistrales && !preparedMapping.warehouse) {
      const warehouseName = selectedImportWarehouseName()
      if (!warehouseName) {
        throw new Error('No hay almacen activo para la empresa seleccionada')
      }
      preparedRows = preparedRows.map(row => ({ ...row, __warehouse__: warehouseName }))
      preparedMapping.warehouse = '__warehouse__'
    }

    if (selectedImportLaboratoryName && !preparedMapping.laboratory) {
      preparedRows = preparedRows.map(row => ({ ...row, __laboratory__: selectedImportLaboratoryName }))
      preparedMapping.laboratory = '__laboratory__'
    }

    return { preparedRows, preparedMapping }
  }

  const articleImportHeaders = () => isMagistrales
    ? ['Codigo', 'Laboratorio', 'Descripcion', 'Unidad', 'Estado']
    : ['LOTE (EAN)', 'LABORATORIO', 'PRINCIPIO ACTIVO', 'NOMBRE', 'UNIDAD']

  const articleExportRow = (row) => {
    const common = [
      row?.code ?? '',
      getArticleLaboratoryLabel(row) || row?.laboratory_name || '',
      row?.name ?? '',
      row?.unit?.symbol || row?.unit?.name || '',
      row?.status === false || row?.status === 0 ? 'Inactivo' : 'Activo',
    ]

    if (isMagistrales) return common

    return [
      row?.code ?? '',
      row?.laboratory?.name ?? '',
      row?.active_principle?.name ?? row?.activePrinciple?.name ?? '',
      row?.name ?? '',
      row?.unit?.symbol || row?.unit?.name || '',
    ]
  }

  const onArticleExport = async () => {
    let rows = []
    try {
      const result = await articlesRest.paginate({
        isLoadingAll: true,
        take: 10000,
        sort: [{ selector: 'code', desc: false }],
        filter: isMagistrales ? magistralesFilterValue : (!isStorageProduct ? standardFilterValue : null),
      })
      rows = Array.isArray(result?.data) ? result.data : []
    } catch (error) {
      rows = []
    }

    if (!rows.length) {
      rows = (await tableRef.current?.loadAll()) ?? []
    }

    const worksheet = XLSX.utils.aoa_to_sheet([
      articleImportHeaders(),
      ...rows.map(articleExportRow),
    ])
    worksheet['!cols'] = articleImportHeaders().map(header => ({ wch: Math.max(14, header.length + 4) }))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Articulos')
    XLSX.writeFile(workbook, isMagistrales ? 'articulos_magistrales.xlsx' : 'articulos_kamary_peru.xlsx')
  }

  // --- Alta masiva de productos de almacenamiento ---
  const stgMappingOptions = [
    { value: '', label: 'Seleccionar...' },
    ...stgHeaders.map(h => ({ value: h, label: h })),
  ]

  // Igual que en nota de entrada: se puede llegar con el modal abierto desde el aviso de Inventario.
  useEffect(() => {
    if (!isStorageProduct) return
    if (!new URLSearchParams(window.location.search).has('import')) return
    const timer = setTimeout(() => stgOpenImport(), 700)
    return () => clearTimeout(timer)
  }, [isStorageProduct])

  const stgOpenImport = () => {
    setStgRows([]); setStgHeaders([]); setStgFileName(''); setStgClientId('')
    setStgMapping({ code: '', name: '', unit: '' })
    if (stgImportFileRef.current) stgImportFileRef.current.value = ''
    $(stgImportModalRef.current).modal('show')
  }

  const stgFileChanged = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const ext = (file.name.split('.').pop() || '').toLowerCase()
      let rows = []
      if (ext === 'json') {
        const parsed = JSON.parse(await file.text())
        rows = Array.isArray(parsed) ? parsed : (Object.values(parsed ?? {}).find(v => Array.isArray(v)) ?? [])
      } else {
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
        const sheet = wb.SheetNames?.[0]
        if (!sheet) throw new Error('El archivo no tiene ninguna hoja')
        rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '' })
      }
      if (!Array.isArray(rows) || rows.length === 0) throw new Error('El archivo no tiene filas para importar')
      const headers = Array.from(new Set(rows.flatMap(r => (r && typeof r === 'object') ? Object.keys(r) : [])))
      const norm = (v) => `${v ?? ''}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
      const find = (...c) => headers.find(h => c.some(x => norm(h).includes(x))) ?? ''
      setStgRows(rows); setStgHeaders(headers); setStgFileName(file.name)
      setStgMapping({
        code: find('codigo', 'sku', 'code'),
        name: find('nombre', 'producto', 'descripcion', 'articulo'),
        unit: find('unidad', 'medida', 'umedida', 'unit'),
      })
    } catch (error) {
      setStgRows([]); setStgHeaders([]); setStgFileName('')
      await Swal.fire({ icon: 'error', title: 'No se pudo leer el archivo', text: error.message })
    }
  }

  const stgImportSubmit = async (e) => {
    e?.preventDefault?.()
    if (!stgRows.length) { Swal.fire({ icon: 'warning', title: 'Falta el archivo', text: 'Primero sube el archivo con tus productos.' }); return }
    if (!stgClientId) { Swal.fire({ icon: 'warning', title: 'Falta el cliente', text: 'Indica de que cliente son estos productos.' }); return }
    if (!stgMapping.name) { Swal.fire({ icon: 'warning', title: 'Falta mapear', text: 'Indica que columna tiene el nombre del producto.' }); return }

    setStgImporting(true)
    const result = await articlesRest.importRows({ rows: stgRows, mapping: stgMapping, client_id: stgClientId })
    setStgImporting(false)
    if (!result) return

    $(stgImportModalRef.current).modal('hide')
    tableRef.current?.refresh()
    await Swal.fire({
      icon: 'success',
      title: 'Productos creados',
      html: `Se crearon <b>${result.created}</b> producto(s).<br/>Ya puedes cargarles stock desde <b>Nota de entrada &rsaquo; Importar stock</b>.`,
      confirmButtonText: 'Entendido',
    })
  }

  const onImportSubmit = async (e) => {
    e.preventDefault()

    if (!importRows.length) {
      Swal.fire({ icon: 'warning', title: 'Falta archivo', text: 'Primero carga un archivo con datos' })
      return
    }
    if (selectedImportType === 'pack_components' && (!mapping.pack_code || !mapping.component_code)) {
      Swal.fire({ icon: 'warning', title: 'Campos obligatorios', text: 'Debes mapear codigo pack y codigo componente' })
      return
    }
    if (selectedImportType !== 'pack_components' && !mapping.code) {
      Swal.fire({ icon: 'warning', title: 'Campo obligatorio', text: 'Debes mapear el campo codigo' })
      return
    }

    setIsImporting(true)
    let result = null
    try {
      const { preparedRows, preparedMapping } = rowsPreparedForImport()
      result = await articlesRest.importRows({
        import_type: selectedImportType,
        rows: preparedRows,
        mapping: preparedMapping
      })
    } catch (error) {
      await Swal.fire({ icon: 'warning', title: 'Dato obligatorio', text: error.message })
    }
    setIsImporting(false)
    if (!result) return

    tableRef.current?.refresh()
    $(importModalRef.current).modal('hide')

    const errorsPreview = (result.errors || []).slice(0, 5).join('\n')
    await Swal.fire({
      icon: 'success',
      title: 'Importacion completada',
      html: `
        <div style="text-align:left">
          <p style="margin:0"><b>Creados:</b> ${result.created}</p>
          <p style="margin:0"><b>Actualizados:</b> ${result.updated}</p>
          ${result.linked !== undefined ? `<p style="margin:0"><b>Componentes vinculados:</b> ${result.linked}</p>` : ''}
          <p style="margin:0"><b>Omitidos:</b> ${result.skipped}</p>
          ${errorsPreview ? `<pre style="margin-top:8px;white-space:pre-wrap;font-size:12px">${errorsPreview}</pre>` : ''}
        </div>
      `
    })
  }

  const onLaboratoryChanged = async (value) => {
    const laboratoryId = value || ''
    setSelectedLaboratoryId(laboratoryId)
    if (isMagistrales) return
    await loadPrinciples(laboratoryId, null)
  }

  // Búsqueda remota de laboratorios (reemplaza el select2 AJAX). Devuelve {value:id, label:name}.
  const loadLaboratoryOptions = async (query) => {
    const { result } = await Fetch(articlesRest.laboratoriesPaginateApi(), {
      method: 'POST',
      body: JSON.stringify({
        sort: [{ selector: articlesRest.laboratoriesSearchBy(), desc: false }],
        skip: 0,
        take: 50,
        filter: [articlesRest.laboratoriesSearchBy(), 'contains', query || ''],
      }),
    })
    return (result?.data ?? []).map(item => ({ value: `${item.id}`, label: item.name }))
  }

  // Igual que loadLaboratoryOptions pero el value es el NOMBRE (el import guarda el nombre, no el id).
  const loadImportLaboratoryOptions = async (query) => {
    const { result } = await Fetch(articlesRest.laboratoriesPaginateApi(), {
      method: 'POST',
      body: JSON.stringify({
        sort: [{ selector: articlesRest.laboratoriesSearchBy(), desc: false }],
        skip: 0,
        take: 50,
        filter: [articlesRest.laboratoriesSearchBy(), 'contains', query || ''],
      }),
    })
    return (result?.data ?? []).map(item => ({ value: item.name, label: item.name }))
  }

  // Búsqueda remota de categorías magistrales (reemplaza el select2 AJAX). searchBy='description'.
  const loadMagistralCategoryOptions = async (query) => {
    const { result } = await Fetch('/api/admin/magistrales/categories/paginate', {
      method: 'POST',
      body: JSON.stringify({
        sort: [{ selector: 'description', desc: false }],
        skip: 0,
        take: 50,
        filter: ['description', 'contains', query || ''],
      }),
    })
    return (result?.data ?? []).map(item => ({ value: `${item.id}`, label: item.description }))
  }

  const onPresentationUpdated = (uid, field, value) => {
    setPresentations(prev => prev.map(item => item.uid === uid ? { ...item, [field]: value } : item))
  }

  const onMagistralArticleTypeChanged = (value) => {
    const normalizedType = normalizeMagistralArticleType(value)
    setSelectedArticleType(normalizedType)
    setPresentations(getMagistralEquivalenceDefaults(normalizedType))
  }

  const onPresentationAdded = () => {
    setPresentations(prev => [...prev, emptyPresentation()])
  }

  const onPresentationRemoved = (uid) => {
    setPresentations(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyPresentation()]
    })
  }

  const onStorageLotUpdated = (uid, field, value) => {
    setStorageLots(prev => prev.map(item => item.uid === uid ? { ...item, [field]: value } : item))
  }

  const onStorageLotAdded = () => {
    setStorageLots(prev => [...prev, emptyStorageLot()])
  }

  const onStorageLotRemoved = (uid) => {
    setStorageLots(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyStorageLot()]
    })
  }

  const onCreateManufacturerForLot = (uid) => {
    if (window.$?.fn?.select2) {
      $('select.select2-hidden-accessible').select2('close')
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    setManufacturerTargetLotUid(uid)
    if (newManufacturerNameRef.current) newManufacturerNameRef.current.value = ''
    setSelectedManufacturerCountry(manufacturerCountryOptions[0])
    setSelectedManufacturerStatus('1')
    $(manufacturerCreateModalRef.current).modal('show')
  }

  const onCreateManufacturerSubmit = async (e) => {
    e.preventDefault()

    const value = {
      name: newManufacturerNameRef.current?.value?.trim() ?? '',
      country: selectedManufacturerCountry || manufacturerCountryOptions[0],
      status: selectedManufacturerStatus !== '0',
    }

    if (!value.name) {
      await Swal.fire({
        icon: 'warning',
        title: 'Dato obligatorio',
        text: 'El nombre del fabricante es obligatorio',
      })
      return
    }

    const created = await articlesRest.createManufacturer(value)
    if (!created?.id) return

    await loadStorageProductOptions()
    if (manufacturerTargetLotUid) onStorageLotUpdated(manufacturerTargetLotUid, 'manufacturer_id', `${created.id}`)
    $(manufacturerCreateModalRef.current).modal('hide')
  }

  const previewRows = importRows.slice(0, 5).map((row, idx) => ({
    row: idx + 1,
    code: mapping.code ? (row[mapping.code] ?? '') : '',
    name: mapping.name ? (row[mapping.name] ?? '') : '',
    packCode: mapping.pack_code ? (row[mapping.pack_code] ?? '') : '',
    packName: mapping.pack_name ? (row[mapping.pack_name] ?? '') : '',
    componentCode: mapping.component_code ? (row[mapping.component_code] ?? '') : '',
    componentName: mapping.component_name ? (row[mapping.component_name] ?? '') : '',
    componentQuantity: mapping.component_quantity ? (row[mapping.component_quantity] ?? '') : '',
    warehouse: mapping.warehouse ? (row[mapping.warehouse] ?? '') : '',
    laboratory: mapping.laboratory ? (row[mapping.laboratory] ?? '') : '',
    principle: mapping.active_principle ? (row[mapping.active_principle] ?? '') : '',
    unit: mapping.unit ? (row[mapping.unit] ?? '') : '',
    status: mapping.status ? (row[mapping.status] ?? '') : '',
  }))

  const buildStorageProductExportMatrix = (rows) => {
    const list = Array.isArray(rows) ? rows : []
    const headers = storageProductExportColumns.map(column => column.caption)
    const body = list.map(row => storageProductExportColumns.map(column => column.value(row)))
    return { headers, body }
  }

  const downloadTextFile = (content, filename, mime = 'text/plain;charset=utf-8;') => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const onStorageProductExport = async (format) => {
    const rows = (await tableRef.current?.loadAll()) ?? []
    const { headers, body } = buildStorageProductExportMatrix(rows)
    if (!body.length) {
      Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay filas para exportar' })
      return
    }

    if (format === 'copy') {
      const text = [headers, ...body].map(row => row.join('\t')).join('\n')
      await navigator.clipboard.writeText(text)
      Swal.fire({ icon: 'success', title: 'Copiado', timer: 1200, showConfirmButton: false })
      return
    }

    if (format === 'csv') {
      const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
      const csv = [headers, ...body].map(row => row.map(escapeCell).join(',')).join('\n')
      downloadTextFile(csv, 'productos-almacenamiento.csv', 'text/csv;charset=utf-8;')
      return
    }

    if (format === 'excel') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos')
      XLSX.writeFile(workbook, 'productos-almacenamiento.xlsx')
      return
    }

    if (format === 'pdf') {
      const JsPDF = window.jspdf?.jsPDF || window.jsPDF
      if (!JsPDF) {
        Swal.fire({ icon: 'error', title: 'PDF no disponible', text: 'jsPDF no esta cargado' })
        return
      }
      const doc = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      if (!doc.autoTable) {
        Swal.fire({ icon: 'error', title: 'PDF no disponible', text: 'AutoTable no esta cargado' })
        return
      }
      doc.setFontSize(12)
      doc.text('Lista de Serv. Almacenamiento - Creacion del producto', 24, 28)
      doc.autoTable({
        head: [headers],
        body,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [31, 41, 82] },
      })
      doc.save('productos-almacenamiento.pdf')
      return
    }

    if (format === 'print') {
      const escapeHtml = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
      const rowsHtml = body
        .map(row => `<tr>${row.map(value => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`)
        .join('')
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(`
        <html>
          <head>
            <title>Lista de productos</title>
            <style>
              body { font-family: Arial, sans-serif; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
              th { background: #f3f4f6; }
            </style>
          </head>
          <body>
            <h3>Lista de Serv. Almacenamiento - Creacion del producto</h3>
            <table>
              <thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </body>
        </html>
      `)
      win.document.close()
      win.focus()
      win.print()
    }
  }

  const renderStatusSwitch = (row, field) => {
    if (row.status === null) return ''
    return <SwitchFormGroup noMargin checked={row[field] == 1} onChange={() => onBooleanChange({ id: row.id, field, value: !row[field] })} />
  }

  const renderCodeLink = (row) => (
    <a className='admin-grid-edit-link' style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title='Editar articulo'>{row?.code ?? ''}</a>
  )

  const renderPresentations = (row) => {
    const lines = (row?.presentations ?? []).map(item => `${item.name} (${Number(item.units).toFixed(2)}) - S/. ${Number(item.price).toFixed(2)}`)
    return <div>
      {lines.length === 0 && <small className='text-muted'>Sin presentaciones</small>}
      {lines.map((line, idx) => <div key={`p-${row.id}-${idx}`}><small>{line}</small></div>)}
    </div>
  }

  const magistralesColumns = [
    { key: 'code', label: 'Codigo', field: 'code', width: '130px', filter: { type: 'text' } },
    { key: 'article_type', label: 'Tipo', field: 'article_type', width: '140px', filter: { type: 'text' }, render: (row) => normalizeMagistralArticleType(row?.article_type ?? '') || '' },
    { key: 'magistral_presentation', label: 'Presentacion', field: 'magistral_presentation', width: '150px' },
    { key: 'administration_route', label: 'Via adm.', field: 'administration_route', width: '120px' },
    { key: 'name', label: 'Articulo', field: 'name', filter: { type: 'text' } },
    { key: 'laboratory', label: 'Laboratorio', field: 'laboratory.name', width: '150px', filter: { type: 'text', field: 'laboratory.name' }, render: (row) => getArticleLaboratoryLabel(row) },
    { key: 'igv_rule', label: 'Afecto IGV', field: 'igv_rule', width: '110px', align: 'center', sortable: false, render: (row) => renderStatusSwitch(row, 'igv_rule') },
    { key: 'default_expiration_date', label: 'F. venc.', field: 'default_expiration_date', width: '110px' },
    { key: 'default_lot', label: 'Lote', field: 'default_lot', width: '110px' },
    { key: 'magistral_status', label: 'Estado', field: 'magistral_status', width: '120px', render: (row) => { const meta = magistralStatusMeta[getMagistralStatusValue(row)] ?? magistralStatusMeta.vigente; return <span className={`badge ${meta.className}`}>{meta.label}</span> } },
  ]

  const standardColumns = [
    { key: 'id', label: 'ID', field: 'id', visible: false },
    { key: 'code', label: 'Codigo', field: 'code', width: '170px', filter: { type: 'text' }, render: renderCodeLink },
    { key: 'warehouse', label: 'Almacen', field: 'warehouse.name', width: '180px', filter: { type: 'text', field: 'warehouse.name' }, render: (row) => row?.warehouse?.name ?? '' },
    { key: 'name', label: 'Articulo', field: 'name', filter: { type: 'text' } },
    { key: 'laboratory', label: 'Laboratorio', field: 'laboratory.name', width: '150px', filter: { type: 'text', field: 'laboratory.name' } },
    { key: 'active_principle', label: 'Principio activo', field: 'active_principle.name', width: '180px', filter: { type: 'text', field: 'active_principle.name' }, render: (row) => row?.active_principle?.name ?? row?.activePrinciple?.name ?? '' },
    { key: 'unit', label: 'Unidad', field: 'unit.symbol', width: '110px', render: (row) => row?.unit?.symbol || row?.unit?.name || '' },
    { key: 'volume', label: 'Volumen', field: 'volume', width: '100px' },
    { key: 'units_per_article', label: 'Und x articulo', field: 'units_per_article', width: '110px' },
    { key: 'unit_weight', label: 'Peso unit.', field: 'unit_weight', width: '100px' },
    { key: 'margin_rule', label: 'Regla margen', field: 'margin_rule', width: '105px', align: 'center', sortable: false, render: (row) => renderStatusSwitch(row, 'margin_rule') },
    { key: 'igv_rule', label: 'Regla IGV', field: 'igv_rule', width: '95px', align: 'center', sortable: false, render: (row) => renderStatusSwitch(row, 'igv_rule') },
    { key: 'presentations', label: 'Presentaciones', field: 'presentations.name', sortable: false, render: (row) => renderPresentations(row) },
    { key: 'notes', label: 'Notas', field: 'notes', visible: false },
    { key: 'composition', label: 'Composicion', field: 'composition', visible: false },
    { key: 'creator', label: 'Creado por', field: 'creator.fullname', visible: false, render: (row) => formatAuditUser(row.creator) },
    { key: 'updater', label: 'Actualizado por', field: 'updater.fullname', visible: false, render: (row) => formatAuditUser(row.updater) },
    { key: 'status', label: 'Estado', field: 'status', width: '95px', filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] }, render: (row) => renderStatusSwitch(row, 'status') },
  ]

  const storageProductColumns = [
    { key: 'code', label: 'Codigo', field: 'code', width: '130px', filter: { type: 'text' }, render: renderCodeLink },
    { key: 'client', label: 'Cliente', field: 'client.full_name', filter: { type: 'text', field: 'client.full_name' }, render: (row) => row?.client?.full_name ?? '' },
    { key: 'name', label: 'Nombre articulo', field: 'name', filter: { type: 'text' } },
    { key: 'unit', label: 'Unidad', field: 'unit.symbol', width: '110px', render: (row) => row?.unit?.symbol || row?.unit?.name || '' },
    { key: 'status', label: 'Estado', field: 'status', width: '110px', render: (row) => { const active = row?.status !== false && row?.status !== 0; return <span className={`badge ${active ? 'bg-success' : 'bg-secondary'}`}>{active ? 'Activo' : 'Inactivo'}</span> } },
  ]

  const articleActions = (row) => {
    if (isMagistrales) {
      return [
        { icon: 'mdi mdi-eye', title: 'Mostrar', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => onModalOpen(r, 'view') },
        { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
      ]
    }
    if (isStorageProduct) {
      return [
        { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
        { icon: 'mdi mdi-delete', title: 'Eliminar articulo', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
      ]
    }
    return [
      { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
      { icon: 'mdi mdi-package-variant-closed', title: 'Stock por almacen', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => onOpenStockModal(r) },
      { icon: 'mdi mdi-delete', title: 'Eliminar articulo', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
    ]
  }

  const articleColumns = isMagistrales ? magistralesColumns : (isStorageProduct ? storageProductColumns : standardColumns)
  const articleSearchFields = isMagistrales
    ? ['code', 'name', 'laboratory.name', 'article_type', 'magistral_presentation', 'default_lot']
    : (isStorageProduct ? ['code', 'name', 'client.full_name'] : ['code', 'name', 'laboratory.name', 'active_principle.name', 'warehouse.name'])
  const magistralesFilterValue = useMemo(
    () => isMagistrales ? buildMagistralFilterValue(magistralAppliedFilters) : null,
    [isMagistrales, magistralAppliedFilters.articleType, magistralAppliedFilters.status]
  )
  const standardFilterValue = useMemo(() => {
    if (isStorageProduct || isMagistrales) return null
    return joinDxFilters([
      standardAppliedFilters.laboratoryId ? ['laboratory_id', '=', Number(standardAppliedFilters.laboratoryId)] : null,
      standardAppliedFilters.principleId ? ['active_principle_id', '=', Number(standardAppliedFilters.principleId)] : null,
      standardAppliedFilters.code?.trim() ? ['code', 'contains', standardAppliedFilters.code.trim()] : null,
    ], 'and')
  }, [isStorageProduct, isMagistrales, standardAppliedFilters.laboratoryId, standardAppliedFilters.principleId, standardAppliedFilters.code])
  const articleFilterValue = isMagistrales ? magistralesFilterValue : standardFilterValue

  const didFilterMountRef = useRef(false)
  useEffect(() => {
    if (!didFilterMountRef.current) { didFilterMountRef.current = true; return }
    tableRef.current?.refresh()
  }, [articleFilterValue])

  const renderArticleCard = (row, actionButtons) => {
    const active = row.status !== false && row.status !== 0
    return (
      <div className='vdt-card'>
        <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.name}</p>
            <small className='text-muted'>{row.code}</small>
          </div>
          {isMagistrales
            ? (() => { const meta = magistralStatusMeta[getMagistralStatusValue(row)] ?? magistralStatusMeta.vigente; return <span className={`badge ${meta.className}`}>{meta.label}</span> })()
            : (row.status !== null && <span className={`badge ${active ? 'badge-soft-success' : 'badge-soft-danger'}`}>{active ? 'Activo' : 'Inactivo'}</span>)}
        </div>
        <div className='text-muted mt-2' style={{ fontSize: 12 }}>
          {isStorageProduct
            ? (row.client?.full_name ?? '')
            : [getArticleLaboratoryLabel(row) || row.laboratory?.name, row.unit?.symbol || row.unit?.name].filter(Boolean).join(' · ')}
        </div>
        {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }}>{actionButtons}</div>}
      </div>
    )
  }

  const renderMagistralesArticleForm = () => (
    <fieldset className='magistrales-article-form' data-select2-local-dropdown disabled={isViewing}>
      <div className='magistrales-section'>
        <div className='magistrales-section-title'>
          <i className='mdi mdi-package-variant-closed me-1'></i> Datos del artículo
        </div>
        <div className='row g-3 magistrales-section-body'>
          <InputFormGroup eRef={codeRef} label='Código' col='col-md-2' readOnly placeholder='Se genera al guardar' />
          <InputFormGroup eRef={nameRef} label='Descripción' col='col-md-4' required />
          <InputFormGroup eRef={compositionRef} label='Composición' col='col-md-4' />
          <VdSelect
            label='Estado'
            col='col-md-2'
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            options={magistralStatusOptions}
          />
        </div>
      </div>

      <div className='row g-3 mt-1'>
        <div className='col-lg-6'>
          <div className='magistrales-section h-100'>
            <div className='magistrales-section-title'>
              <i className='mdi mdi-shape-outline me-1'></i> Clasificación
            </div>
            <div className='row g-3 magistrales-section-body'>
              <VdSelect
                label='Categoría'
                col='col-md-4'
                value={selectedMagistralCategoryId}
                valueLabel={selectedMagistralCategoryLabel}
                onChange={onMagistralCategoryChanged}
                loadOptions={loadMagistralCategoryOptions}
                placeholder='Seleccione'
              />
              <VdSelect
                label='Subcategoría'
                col='col-md-4'
                value={selectedSubCategory}
                disabled={!selectedMagistralCategoryId || isLoadingSubcategories || magistralSubcategories.length === 0}
                onChange={(value) => setSelectedSubCategory(value)}
                options={magistralSubcategories.map(subcategory => ({ value: subcategory.description, label: subcategory.description }))}
                placeholder={!selectedMagistralCategoryId ? 'Seleccione una categoría' : (isLoadingSubcategories ? 'Cargando...' : (magistralSubcategories.length ? 'Seleccione' : 'Sin subcategorías'))}
              />
              <VdSelect
                label='Presentación'
                col='col-md-4'
                value={selectedMagistralPresentation}
                onChange={(value) => setSelectedMagistralPresentation(value)}
                options={magistralPresentationOptions.map(option => ({ value: option, label: option }))}
                placeholder='Seleccione'
              />
              <VdSelect
                label='Tipo de artículo'
                col='col-md-3'
                value={selectedArticleType}
                onChange={(value) => onMagistralArticleTypeChanged(value)}
                options={magistralArticleTypeOptions.map(option => ({ value: option, label: option }))}
                placeholder='Seleccione'
              />
              <VdSelect
                label='Vía administración'
                col='col-md-3'
                value={selectedAdministrationRoute}
                onChange={(value) => setSelectedAdministrationRoute(value)}
                options={magistralAdministrationRouteOptions.map(option => ({ value: option, label: option }))}
                placeholder='Seleccione'
              />
              <VdSelect
                label='Laboratorio'
                col='col-md-3'
                required
                value={selectedLaboratoryId}
                valueLabel={selectedLaboratoryLabel}
                onChange={onLaboratoryChanged}
                loadOptions={loadLaboratoryOptions}
                placeholder='Seleccionar...'
              />
              <InputFormGroup eRef={healthRegistrationRef} label='R. Sanitario' col='col-md-3' />
            </div>
          </div>
        </div>

        <div className='col-lg-6'>
          <div className='magistrales-section h-100'>
            <div className='magistrales-section-title'>
              <i className='mdi mdi-tune-variant me-1'></i> Datos de control
            </div>
            <div className='row g-3 magistrales-section-body'>
              <InputFormGroup eRef={stockMinRef} label='Stock mínimo' col='col-md-3' type='number' min='0' step='0.001' />
              <InputFormGroup eRef={stockMaxRef} label='Stock máximo' col='col-md-3' type='number' min='0' step='0.001' />
              <SwitchFormGroup eRef={igvRuleRef} label='Afecto a IGV' col='col-md-3' checked={false} />
              <VdSelect
                label='Moneda'
                col='col-md-3'
                value={selectedCurrency}
                onChange={(value) => setSelectedCurrency(value)}
                options={[{ value: 'PEN', label: 'Soles' }, { value: 'USD', label: 'Dolares' }]}
              />
              <SwitchFormGroup eRef={stockHasExpirationRef} label='Stock con Vencim.' col='col-md-3' checked={false} />
              <SwitchFormGroup eRef={stockHasLotRef} label='Stock con Lote' col='col-md-3' checked={false} />
              <InputFormGroup eRef={costPriceRef} label='Precio Costo' col='col-md-3' type='number' min='0' step='0.01' />
              <InputFormGroup eRef={salePriceRef} label='Precio Venta' col='col-md-3' type='number' min='0' step='0.01' />
            </div>
          </div>
        </div>
      </div>

      <div className='mt-3 d-flex flex-wrap align-items-end justify-content-between gap-2'>
        <button type='button' className='btn btn-sm btn-soft-primary' onClick={onPresentationAdded}>
          <i className='mdi mdi-plus-circle-outline me-1'></i> Insertar equivalencia
        </button>
        <div className='magistrales-exchange-rate-field'>
          <label className='form-label'>Tipo de cambio</label>
          <input ref={equivalenceExchangeRateRef} className='form-control' type='number' min='0' step='0.0001' />
        </div>
      </div>

      <div className='magistrales-equivalence-wrap mt-3'>
        <div className='table-responsive'>
          <table className='table table-sm table-bordered mb-0 align-middle'>
            <thead>
              <tr>
                <th>CANTIDAD EQUIVALENTE</th>
                <th>UNIDAD EQUIVALENTE</th>
                <th>P. VENTA (M.N)</th>
                <th>P. COMPRA (M.N)</th>
                <th>P. COMPRA (M.E)</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {presentations.map((presentation) => (
                <tr key={presentation.uid}>
                  <td>
                    <input
                      className='form-control form-control-sm'
                      type='number'
                      min='0.001'
                      step='0.001'
                      value={presentation.units}
                      onChange={(e) => onPresentationUpdated(presentation.uid, 'units', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className='form-control form-control-sm'
                      value={presentation.name}
                      onChange={(e) => onPresentationUpdated(presentation.uid, 'name', e.target.value)}
                      placeholder='Seleccione unidad equivalente'
                    />
                  </td>
                  <td>
                    <input
                      className='form-control form-control-sm'
                      type='number'
                      min='0'
                      step='0.0001'
                      value={presentation.price}
                      onChange={(e) => onPresentationUpdated(presentation.uid, 'price', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className='form-control form-control-sm'
                      type='number'
                      min='0'
                      step='0.0001'
                      value={presentation.purchase_price_national}
                      onChange={(e) => onPresentationUpdated(presentation.uid, 'purchase_price_national', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className='form-control form-control-sm'
                      type='number'
                      min='0'
                      step='0.0001'
                      value={presentation.purchase_price_foreign}
                      onChange={(e) => onPresentationUpdated(presentation.uid, 'purchase_price_foreign', e.target.value)}
                    />
                  </td>
                  <td className='text-center'>
                    <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onPresentationRemoved(presentation.uid)}>
                      <i className='mdi mdi-close'></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </fieldset>
  )

  return (<>
    <style>{`
      .article-import-actions {
        border-top: 1px solid #e6e9ef;
        display: flex;
        flex-wrap: wrap;
        gap: 0.85rem;
        justify-content: center;
        margin-top: 1.25rem;
        padding-top: 1.25rem;
      }

      .article-import-mapping summary {
        cursor: pointer;
        font-weight: 600;
      }
    `}</style>
    {isStorageProduct && (
      <style>{`
        .storage-product-dialog {
          width: calc(100vw - 32px);
          max-width: calc(100vw - 32px);
          margin: 0.9rem auto;
        }

        .storage-product-modal {
          border: 0;
          border-radius: 6px;
        }

        .storage-product-header {
          background: #272954;
          color: #fff;
          padding: 0.65rem 1rem;
        }

        .storage-product-header .modal-title {
          color: #fff;
          font-size: 0.88rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .storage-product-body {
          background: #fff;
          padding: 1rem 1.25rem 1.25rem;
        }

        .storage-product-form .form-label {
          color: #30364d;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .storage-product-section {
          border: 1px solid #e3e8ef;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .storage-product-section-title {
          align-items: center;
          color: #4b5563;
          display: flex;
          font-size: 0.78rem;
          font-weight: 700;
          gap: 0.35rem;
          margin-bottom: 0.8rem;
          text-transform: uppercase;
        }

        .storage-product-lots-wrap {
          border: 1px solid #e3e8ef;
          border-radius: 6px;
          overflow: auto;
        }

        .storage-product-lots {
          min-width: 1120px;
        }

        .storage-product-lots th {
          color: #30364d;
          font-size: 0.75rem;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .storage-product-lots td {
          vertical-align: middle;
        }

        .storage-manufacturer-picker {
          align-items: stretch;
          display: flex;
          flex-wrap: nowrap;
          width: 100%;
        }

        .storage-manufacturer-picker select,
        .storage-manufacturer-picker .select2-container {
          flex: 1 1 auto;
          min-width: 0;
          width: auto !important;
        }

        .storage-manufacturer-picker .select2-container .select2-selection {
          border-bottom-right-radius: 0;
          border-top-right-radius: 0;
          min-height: 31px;
        }

        .storage-manufacturer-picker .btn {
          border-bottom-left-radius: 0;
          border-top-left-radius: 0;
          flex: 0 0 40px;
        }

        .storage-manufacturer-form-modal .modal-header {
          background: #24264f;
          color: #fff;
          padding-bottom: 0.45rem;
          padding-top: 0.45rem;
        }

        .storage-manufacturer-form-modal .modal-title {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .storage-manufacturer-form-modal .modal-body {
          padding-bottom: 0.75rem;
        }

        .storage-manufacturer-form-grid {
          align-items: end;
          display: grid;
          gap: 1rem;
          grid-template-columns: minmax(0, 1fr) 150px 110px;
        }

        @media (max-width: 767.98px) {
          .storage-product-dialog {
            width: calc(100vw - 12px);
            max-width: calc(100vw - 12px);
          }

          .storage-manufacturer-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    )}
    {isMagistrales && (
      <style>{`
        .magistrales-article-dialog {
          max-width: calc(100vw - 48px);
        }

        .magistrales-article-modal .modal-title {
          color: #313a46;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0;
        }

        .magistrales-article-modal .modal-body {
          padding: 1.25rem;
        }

        .magistrales-article-modal .modal-footer {
          justify-content: flex-end;
        }

        .magistrales-section {
          background: #fff;
          border: 1px solid #d8dee8;
          border-radius: 0.375rem;
          overflow: visible;
        }

        .magistrales-section-title {
          background: #f8f9fa;
          border-bottom: 1px solid #e6e9ef;
          color: #313a46;
          font-size: 0.92rem;
          font-weight: 600;
          padding: 0.75rem 1rem;
        }

        .magistrales-section-body {
          padding: 1rem 1rem 1.1rem;
        }

        .magistrales-article-form .form-group {
          position: relative;
        }

        .magistrales-article-form .select2-container {
          width: 100% !important;
        }

        .magistrales-article-form .select2-dropdown {
          z-index: 1060;
        }

        .magistrales-equivalence-wrap {
          border-top: 1px solid #e6e9ef;
          padding-top: 1rem;
        }

        .magistrales-equivalence-wrap th {
          color: #30364d;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .magistrales-exchange-rate-field {
          flex: 0 1 260px;
        }

        .magistrales-article-filter-card {
          background: #fff;
          border: 1px solid #e6e9ef;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
        }

        .magistrales-article-filter-title {
          border-bottom: 1px solid #eef1f5;
          color: #30364d;
          font-size: 0.88rem;
          font-weight: 700;
          padding: 0.8rem 1rem;
        }

        .magistrales-article-filter-body {
          padding: 1rem;
        }

        @media (max-width: 991.98px) {
          .magistrales-article-dialog {
            max-width: calc(100vw - 16px);
          }
        }
      `}</style>
    )}
    {!isMagistrales && !isStorageProduct && (
      <style>{`
        .article-dialog {
          max-width: calc(100vw - 48px);
        }

        .article-modal .modal-body {
          padding: 1.25rem 1.5rem;
        }

        .article-modal .form-label {
          color: #30364d;
          font-weight: 600;
        }

        @media (max-width: 991.98px) {
          .article-dialog {
            max-width: calc(100vw - 16px);
          }
        }
      `}</style>
    )}
    {!isStorageProduct && (
      <div className='card mb-3'>
        <div className='card-body d-flex flex-wrap align-items-center gap-2'>
          <label className='form-label mb-0 fw-semibold'>Ver artículos de:</label>
          <VdSelect
            col=''
            noMargin
            style={{ minWidth: 260, maxWidth: 260 }}
            value={isMagistrales ? 'magistrales' : 'standard'}
            onChange={(value) => onArticleScopeChanged(value)}
            options={[{ value: 'standard', label: 'Almacén general' }, { value: 'magistrales', label: 'Magistrales (almacén 11)' }]}
          />
        </div>
      </div>
    )}
    {!isStorageProduct && (
      <div className='card mb-3'>
        <div className='card-body d-flex flex-wrap gap-2'>
          <button type='button' className='btn btn-primary d-inline-flex align-items-center gap-1' onClick={() => onModalOpen()}>
            <i className='mdi mdi-plus-circle-outline'></i>
            Registrar Articulo/Pack
          </button>
          <button type='button' className='btn btn-outline-primary d-inline-flex align-items-center gap-1' onClick={() => onImportModalOpen()}>
            <i className='mdi mdi-file-upload-outline'></i>
            Importar Articulo/Pack
          </button>
        </div>
      </div>
    )}
    {!isStorageProduct && !isMagistrales && (
      <form className='card mb-3' onSubmit={onStandardFilterSubmitted}>
        <div className='card-body'>
          <div className='row g-3 align-items-end'>
            <div className='col-12 col-lg-4'>
              <label className='form-label'>Seleccionar Laboratorio</label>
              <VdSelect
                col=''
                noMargin
                value={standardFilterDraft.laboratoryId}
                onChange={(value) => onStandardFilterLaboratoryChanged(value)}
                options={[{ value: '', label: 'TODOS' }, ...filterLaboratories.map(item => ({ value: `${item.id}`, label: item.name ?? item.description }))]}
              />
            </div>
            <div className='col-12 col-lg-4'>
              <label className='form-label'>Seleccionar Principio activo</label>
              <VdSelect
                col=''
                noMargin
                disabled={!standardFilterDraft.laboratoryId}
                value={standardFilterDraft.principleId}
                onChange={(value) => setStandardFilterDraft(prev => ({ ...prev, principleId: value }))}
                options={[{ value: '', label: 'TODOS' }, ...filterPrinciples.map(item => ({ value: `${item.id}`, label: item.name }))]}
              />
            </div>
            <div className='col-12 col-lg-2'>
              <label className='form-label'>Codigo</label>
              <input
                className='form-control'
                value={standardFilterDraft.code}
                onChange={(e) => setStandardFilterDraft(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div className='col-12 col-lg-2 d-grid'>
              <button type='submit' className='btn btn-outline-primary'>
                <i className='mdi mdi-magnify me-1'></i> Buscar
              </button>
            </div>
          </div>
        </div>
      </form>
    )}
    {isMagistrales && (
      <form className='magistrales-article-filter-card' onSubmit={onMagistralFilterSubmitted}>
        <div className='magistrales-article-filter-title'>Consulta por tipo y estado</div>
        <div className='magistrales-article-filter-body'>
          <div className='row g-3 align-items-end'>
            <div className='col-12 col-md-5'>
              <label className='form-label'>Seleccionar tipo</label>
              <VdSelect
                col=''
                noMargin
                value={magistralFilterDraft.articleType}
                onChange={(value) => onMagistralFilterChanged('articleType', value)}
                options={magistralArticleTypeFilterOptions.map(option => ({ value: option, label: option || 'TODOS' }))}
              />
            </div>
            <div className='col-12 col-md-5'>
              <label className='form-label'>Estado del Articulo</label>
              <VdSelect
                col=''
                noMargin
                value={magistralFilterDraft.status}
                onChange={(value) => onMagistralFilterChanged('status', value)}
                options={magistralStatusOptions}
              />
            </div>
            <div className='col-12 col-md-2'>
              <button type='submit' className='btn btn-outline-primary w-100'>
                <i className='mdi mdi-magnify me-1'></i> Buscar articulos
              </button>
            </div>
          </div>
        </div>
      </form>
    )}

    <VdTable
      ref={tableRef}
      rest={articlesRest}
      icon='mdi mdi-package-variant-closed'
      title={moduleTitle}
      unit='articulos'
      defaultSort={{ field: 'code', desc: false }}
      defaultPageSize={25}
      searchFields={articleSearchFields}
      searchPlaceholder='Buscar por codigo, nombre…'
      emptyText='No se encontraron articulos.'
      baseFilter={articleFilterValue}
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
        {isStorageProduct && <>
          <button type='button' className='vdt-btn-soft' onClick={() => onStorageProductExport('excel')}><i className='mdi mdi-file-excel'></i> Excel</button>
          <button type='button' className='vdt-btn-soft' onClick={() => onStorageProductExport('csv')}><i className='mdi mdi-download'></i> CSV</button>
          <button type='button' className='vdt-btn-soft' onClick={() => onStorageProductExport('pdf')}><i className='mdi mdi-file-pdf-box'></i> PDF</button>
          <button type='button' className='vdt-btn-soft' onClick={() => onStorageProductExport('print')}><i className='mdi mdi-printer'></i> Imprimir</button>
          <button type='button' className='vdt-btn-soft' onClick={() => onStorageProductExport('copy')}><i className='mdi mdi-content-copy'></i> Copiar</button>
          <button type='button' className='vdt-btn-soft' onClick={stgOpenImport}><i className='mdi mdi-upload'></i> Importar productos</button>
          <button type='button' className='vdt-btn-pri' onClick={() => onModalOpen()}><i className='mdi mdi-plus'></i> Nuevo articulo</button>
        </>}
      </>}
      actions={articleActions}
      columns={articleColumns}
      renderCard={renderArticleCard}
    />

    <Modal
      modalRef={stockModalRef}
      title={`Stock por almacen${stockArticle?.name ? ` - ${stockArticle.name}` : ''}`}
      size='xl'
      hideButtonSubmit
    >
      <div className='row'>
        <div className='col-12 mb-2'>
          <small className='text-muted'>
            Articulo: <b>{stockArticle?.code || '-'}</b> {stockArticle?.name ? `- ${stockArticle.name}` : ''}
          </small>
        </div>
        <div className='col-12'>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Sede</th>
                  <th>Almacen</th>
                  <th>Entradas</th>
                  <th>Salidas</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingStock && (
                  <tr>
                    <td colSpan={6} className='text-center text-muted'>Cargando stock...</td>
                  </tr>
                )}
                {!isLoadingStock && stockRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className='text-center text-muted'>Sin datos de stock</td>
                  </tr>
                )}
                {!isLoadingStock && stockRows.map((row) => (
                  <tr key={`stock-row-${row.id}`}>
                    <td>{row.business_name || '-'}</td>
                    <td>{row.branch_name || '-'}</td>
                    <td>
                      {row.name || '-'}
                      {row.status == 0 && <span className='badge bg-soft-danger text-danger ms-2'>Inactivo</span>}
                    </td>
                    <td>{Number(row.qty_in || 0).toFixed(3)}</td>
                    <td>{Number(row.qty_out || 0).toFixed(3)}</td>
                    <td>
                      <b>{Number(row.stock || 0).toFixed(3)} und</b>
                      <div className='mt-1'>
                        {getStockByPresentation(row.stock, stockArticle?.presentations).map((presentation, idx) => (
                          <div key={`stock-presentation-${row.id}-${idx}`}>
                            <small>
                              {presentation.label} ({Number(presentation.units).toFixed(3)}): <b>{presentation.full}</b> en stock
                            </small>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={modalRef}
      title={isMagistrales ? (isViewing ? 'Mostrar artículo magistral' : (isEditing ? 'Editar artículo magistral' : 'Agregar artículo magistral')) : (isStorageProduct ? 'ARTICULO' : (isViewing ? 'Mostrar articulo' : (isEditing ? 'Editar articulo' : 'Agregar articulo')))}
      onSubmit={onModalSubmit}
      size={isStorageProduct ? 'full-width' : 'xl'}
      dialogClass={`${isStorageProduct ? 'storage-product-dialog' : (isMagistrales ? 'magistrales-article-dialog' : (!isStorageProduct ? 'article-dialog' : ''))} modal-dialog-scrollable`}
      contentClass={isStorageProduct ? 'storage-product-modal' : (isMagistrales ? 'magistrales-article-modal' : (!isStorageProduct ? 'article-modal' : ''))}
      headerClass={isStorageProduct ? 'storage-product-header' : ''}
      closeButtonClass={isStorageProduct ? 'btn-close-white' : ''}
      bodyClass={isStorageProduct ? 'storage-product-body' : ''}
      bodyStyle={{ maxHeight: 'calc(100vh - 170px)', overflowY: 'auto', overflowX: 'hidden' }}
      hideButtonSubmit={isViewing}
      btnSubmitText={isMagistrales ? 'Guardar artículo' : 'Registrar'}
    >
      <div className='row' id='article-form-container'>
        <input ref={idRef} type='hidden' />
        {isStorageProduct ? (
        <fieldset className='row m-0 storage-product-form storage-product-section' disabled={isViewing}>
          <VdSelect
            label='Cliente'
            col='col-md-4'
            required
            value={selectedStorageClientId}
            onChange={(value) => setSelectedStorageClientId(value)}
            options={storageClients.map(client => ({ value: `${client.entity_id ?? client.id}`, label: `${client.document_number ? `${client.document_number} | ` : ''}${client.full_name ?? client.display_name}` }))}
            placeholder='Seleccione Cliente'
          />
          <InputFormGroup eRef={codeRef} label='Codigo de Articulo' col='col-md-4' readOnly placeholder='Se genera al guardar' />
          <InputFormGroup eRef={nameRef} label='Nombre de Articulo' col='col-md-4' required />
          <VdSelect
            label='Und. Med.'
            col='col-md-6'
            required
            value={selectedUnitId}
            onChange={(value) => setSelectedUnitId(value)}
            options={units.map(unit => ({ value: `${unit.id}`, label: `${unit.name}${unit.symbol ? ` (${unit.symbol})` : ''}` }))}
            placeholder='Seleccione Unidad'
          />
          <VdSelect
            label='Estado'
            col='col-md-6'
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}
          />
          <TextareaFormGroup eRef={notesRef} label='Observaciones' col='col-12' rows={3} />

          <div className='col-12 mt-2'>
            <button type='button' className='btn btn-sm btn-outline-primary mb-3' onClick={onStorageLotAdded}>
              <i className='mdi mdi-plus-circle-outline me-1'></i> AÑADIR LOTE / SERIE
            </button>
            <div className='storage-product-lots-wrap'>
              <table className='table table-sm table-bordered mb-0 align-middle storage-product-lots'>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>LOTE / SERIE</th>
                    <th style={{ width: '15%' }}>FECHA VENCIMIENTO</th>
                    <th style={{ width: '29%' }}>CONDICION ALMACENAMIENTO</th>
                    <th style={{ width: '21%' }}>FABRICANTE</th>
                    <th style={{ width: '5%' }}>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {storageLots.map(lot => (
                    <tr key={lot.uid}>
                      <td>
                        <input
                          className='form-control form-control-sm'
                          value={lot.lot}
                          onChange={(e) => onStorageLotUpdated(lot.uid, 'lot', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          className='form-control form-control-sm'
                          type='date'
                          value={lot.expiration_date}
                          onChange={(e) => onStorageLotUpdated(lot.uid, 'expiration_date', e.target.value)}
                        />
                      </td>
                      <td>
                        <VdSelect
                          col=''
                          noMargin
                          value={lot.storage_condition}
                          onChange={(value) => onStorageLotUpdated(lot.uid, 'storage_condition', value)}
                          options={[{ value: '', label: 'Seleccione' }, ...storageConditionOptions.map(condition => ({ value: condition, label: condition }))]}
                          placeholder='Seleccione'
                        />
                      </td>
                      <td>
                        <div className='storage-manufacturer-picker'>
                          <VdSelect
                            col=''
                            noMargin
                            style={{ flex: '1 1 auto', minWidth: 0 }}
                            value={lot.manufacturer_id}
                            onChange={(value) => onStorageLotUpdated(lot.uid, 'manufacturer_id', value)}
                            options={[{ value: '', label: 'Seleccione' }, ...storageManufacturers.map(manufacturer => ({ value: `${manufacturer.id}`, label: manufacturer.name }))]}
                            placeholder='Seleccione'
                          />
                          <button
                            type='button'
                            className='btn btn-sm btn-outline-success'
                            title='Agregar fabricante'
                            onClick={() => onCreateManufacturerForLot(lot.uid)}
                          >
                            <i className='mdi mdi-plus'></i>
                          </button>
                        </div>
                      </td>
                      <td className='text-center'>
                        <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onStorageLotRemoved(lot.uid)}>
                          <i className='mdi mdi-close'></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </fieldset>
        ) : isMagistrales ? (
          renderMagistralesArticleForm()
        ) : (
        <fieldset className='row p-0 m-0' disabled={isViewing}>
        <VdSelect
          label='Almacen'
          col='col-md-4'
          required
          value={selectedWarehouseId}
          onChange={(value) => setSelectedWarehouseId(value)}
          options={warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
          placeholder='Seleccione almacen'
        />
        <InputFormGroup eRef={codeRef} label='Codigo de articulo' col='col-md-4' readOnly placeholder='Se genera al guardar' />
        <InputFormGroup eRef={nameRef} label='Nombre del articulo' col='col-md-4' required />

        <div className='form-group col-md-4 mb-2'>
          <label className='form-label'>Laboratorio <b style={{ color: '#ff5b5b' }}>*</b></label>
          <div className='d-flex' style={{ gap: 6 }}>
            <VdSelect
              col=''
              noMargin
              style={{ flex: 1 }}
              value={selectedLaboratoryId}
              valueLabel={selectedLaboratoryLabel}
              onChange={onLaboratoryChanged}
              loadOptions={loadLaboratoryOptions}
              placeholder='Seleccionar...'
            />
            <button type='button' className='btn btn-success' title='Gestionar laboratorios' onClick={() => $(labManagerRef.current).modal('show')}><i className='mdi mdi-plus'></i></button>
          </div>
        </div>

        <div className='form-group col-md-4 mb-2'>
          <label className='form-label'>Principio activo <b style={{ color: '#ff5b5b' }}>*</b></label>
          <div className='d-flex' style={{ gap: 6 }}>
            <VdSelect
              col=''
              noMargin
              style={{ flex: 1 }}
              value={selectedPrincipleId}
              onChange={(value) => setSelectedPrincipleId(value)}
              options={principles.map(principle => ({ value: `${principle.id}`, label: principle.name }))}
              placeholder='Seleccionar...'
            />
            <button type='button' className='btn btn-success' title='Gestionar principios activos' onClick={() => $(principleManagerRef.current).modal('show')}><i className='mdi mdi-plus'></i></button>
          </div>
        </div>

        <div className='form-group col-md-4 mb-2'>
          <label className='form-label'>Unidad de medida <b style={{ color: '#ff5b5b' }}>*</b></label>
          <div className='d-flex' style={{ gap: 6 }}>
            <VdSelect
              col=''
              noMargin
              style={{ flex: 1 }}
              value={selectedUnitId}
              onChange={(value) => setSelectedUnitId(value)}
              options={units.map(unit => ({ value: `${unit.id}`, label: `${unit.name}${unit.symbol ? ` (${unit.symbol})` : ''}` }))}
              placeholder='Seleccionar...'
            />
            <button type='button' className='btn btn-success' title='Gestionar unidades de medida' onClick={() => $(unitManagerRef.current).modal('show')}><i className='mdi mdi-plus'></i></button>
          </div>
        </div>

        <InputFormGroup eRef={volumeRef} label='Volumen' col='col-md-3' type='number' step='0.001' />
        <InputFormGroup eRef={unitsPerArticleRef} label='Unidad por articulo' col='col-md-3' type='number' min='1' required />
        <InputFormGroup eRef={unitWeightRef} label='Peso Unitario (Kg)' col='col-md-3' type='number' step='0.0001' />
        <div className='form-group col-md-3 mb-2'>
          <label className='form-label d-block'>Regla de margen</label>
          <div className='form-check form-switch'>
            <input ref={marginRuleRef} className='form-check-input' type='checkbox' />
          </div>
        </div>
        <VdSelect
          label='Estado'
          col='col-md-3'
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value)}
          options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}
        />

        <div className='form-group col-md-3 mb-2'>
          <label className='form-label d-block'>Regla de IGV</label>
          <div className='form-check form-switch'>
            <input ref={igvRuleRef} className='form-check-input' type='checkbox' />
          </div>
        </div>

        <TextareaFormGroup eRef={notesRef} label='Observaciones' col='col-12' rows={3} />

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>{isMagistrales ? 'Equivalencias' : 'Presentaciones'}</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={onPresentationAdded}>
              <i className='mdi mdi-plus me-1'></i> {isMagistrales ? 'Agregar equivalencia' : 'Agregar presentacion'}
            </button>
          </div>

          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th style={{ width: '46%' }}>{isMagistrales ? 'Unidad equivalente' : 'Nombre'}</th>
                  <th style={{ width: '20%' }}>{isMagistrales ? 'Cantidad equivalente' : 'Unidades'}</th>
                  <th style={{ width: '20%' }}>{isMagistrales ? 'P. venta (M.N)' : 'Precio'}</th>
                  <th style={{ width: '14%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {presentations.map((presentation) => (
                  <tr key={presentation.uid}>
                    <td>
                      <input
                        className='form-control form-control-sm'
                        value={presentation.name}
                        onChange={(e) => onPresentationUpdated(presentation.uid, 'name', e.target.value)}
                        placeholder={isMagistrales ? 'Ej. Caja' : 'Ej. Six'}
                      />
                    </td>
                    <td>
                      <input
                        className='form-control form-control-sm'
                        type='number'
                        min='0.001'
                        step='0.001'
                        value={presentation.units}
                        onChange={(e) => onPresentationUpdated(presentation.uid, 'units', e.target.value)}
                        placeholder={isMagistrales ? 'Ej. 1' : 'Ej. 6'}
                      />
                    </td>
                    <td>
                      <input
                        className='form-control form-control-sm'
                        type='number'
                        min='0'
                        step='0.01'
                        value={presentation.price}
                        onChange={(e) => onPresentationUpdated(presentation.uid, 'price', e.target.value)}
                        placeholder='Ej. 25.90'
                      />
                    </td>
                    <td>
                      <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onPresentationRemoved(presentation.uid)}>
                        <i className='mdi mdi-delete'></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </fieldset>
        )}
      </div>
    </Modal>

    <Modal
      modalRef={manufacturerCreateModalRef}
      title={<span><i className='mdi mdi-plus-circle-outline me-1'></i> FORMULARIO FABRICANTE</span>}
      onSubmit={onCreateManufacturerSubmit}
      size='md'
      contentClass='storage-manufacturer-form-modal'
      closeButtonClass='btn-close-white'
      btnCancelText='Cerrar'
      btnSubmitText='Registrar Fabricante'
      zIndex={1065}
    >
      <div className='storage-manufacturer-form-grid'>
        <div className='form-group mb-2'>
          <label className='form-label'>Nombre del fabricante</label>
          <input ref={newManufacturerNameRef} className='form-control' required />
        </div>
        <VdSelect
          label='Pais'
          col=''
          noMargin
          value={selectedManufacturerCountry}
          onChange={(value) => setSelectedManufacturerCountry(value)}
          options={manufacturerCountryOptions.map(country => ({ value: country, label: country }))}
        />
        <VdSelect
          label='Estado'
          col=''
          noMargin
          value={selectedManufacturerStatus}
          onChange={(value) => setSelectedManufacturerStatus(value)}
          options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}
        />
      </div>
    </Modal>

    <Modal
      modalRef={stgImportModalRef}
      title={<h4 className='modal-title'><i className='mdi mdi-upload me-2'></i>Importar productos del cliente</h4>}
      size='xl'
      preventEnterSubmit
      btnSubmitText={stgImporting ? 'Creando...' : 'Crear productos'}
      onSubmit={stgImportSubmit}
    >
      <div className='alert alert-info d-flex align-items-start gap-2'>
        <i className='mdi mdi-information-outline fs-4 lh-1'></i>
        <div>
          <strong>Sube tu propio archivo, no hay plantilla que descargar.</strong>
          <div className='mt-1'>
            Esto crea el <b>catalogo</b> de productos del cliente (sin stock). Despues carga las
            cantidades desde <b>Nota de entrada &rsaquo; Importar stock</b>.
            Si una fila no trae codigo, el sistema le genera uno.
          </div>
        </div>
      </div>

      <div className='row g-2'>
        <div className='col-12'>
          <label className='form-label mb-1'>Archivo (XLSX, XLS, CSV o JSON)</label>
          <input ref={stgImportFileRef} type='file' className='form-control' accept='.xlsx,.xls,.csv,.json' onChange={stgFileChanged} />
          {stgFileName && <div className='mt-1'><small className='text-muted'>{stgFileName} — {stgRows.length} fila(s) leidas</small></div>}
        </div>
        <VdSelect
          col='col-12' label='Cliente dueno de los productos' required
          value={stgClientId} onChange={setStgClientId}
          options={(storageClients ?? []).map(c => ({ value: `${c.entity_id ?? c.id}`, label: [c.document_number, c.full_name ?? c.display_name].filter(Boolean).join(' | ') }))}
          placeholder='-- Seleccionar cliente --'
        />
      </div>

      {stgHeaders.length > 0 && <>
        <hr className='my-3' />
        <div className='fw-semibold mb-2'><i className='mdi mdi-table-arrow-right me-1'></i>Indica que columna de tu archivo es cada dato</div>
        <div className='row g-2'>
          <VdSelect col='col-md-4' label='Nombre del producto' required value={stgMapping.name}
            onChange={(v) => setStgMapping(p => ({ ...p, name: v }))} options={stgMappingOptions} placeholder='Seleccionar...' />
          <VdSelect col='col-md-4' label='Codigo (opcional)' value={stgMapping.code}
            onChange={(v) => setStgMapping(p => ({ ...p, code: v }))} options={stgMappingOptions} placeholder='Seleccionar...' />
          <VdSelect col='col-md-4' label='Unidad de medida (opcional)' value={stgMapping.unit}
            onChange={(v) => setStgMapping(p => ({ ...p, unit: v }))} options={stgMappingOptions} placeholder='Seleccionar...' />
        </div>
        <div className='table-responsive border rounded mt-3'>
          <table className='table table-sm table-striped mb-0'>
            <thead><tr>{stgHeaders.map(h => <th key={`stg-h-${h}`}>{h}</th>)}</tr></thead>
            <tbody>
              {stgRows.slice(0, 5).map((row, i) => (
                <tr key={`stg-r-${i}`}>{stgHeaders.map(h => <td key={`stg-c-${i}-${h}`}>{`${row?.[h] ?? ''}`}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <small className='text-muted'>Vista previa de las primeras 5 filas de {stgRows.length}.</small>
      </>}
    </Modal>

    <Modal
      modalRef={importModalRef}
      title={<span><i className='mdi mdi-file-upload-outline me-1'></i> Importar/exportar articulo / pack</span>}
      onSubmit={onImportSubmit}
      size='xl'
      hideFooter
    >
      <div id='article-import-form-container' className='article-import-form'>
        <div className='row g-3'>
          {!isStorageProduct && !isMagistrales && (
            <div className='col-md-6'>
              <label className='form-label'>Empresa</label>
              <VdSelect
                col=''
                noMargin
                value={selectedImportBusinessId}
                onChange={(value) => setSelectedImportBusinessId(value)}
                options={businesses.map(item => ({ value: `${item.id}`, label: item.name }))}
              />
            </div>
          )}
          <div className={!isStorageProduct && !isMagistrales ? 'col-md-6' : 'col-md-12'}>
            <label className='form-label'>Laboratorio</label>
            <VdSelect
              col=''
              noMargin
              value={selectedImportLaboratoryName}
              valueLabel={selectedImportLaboratoryName}
              onChange={(value) => setSelectedImportLaboratoryName(value)}
              loadOptions={loadImportLaboratoryOptions}
              placeholder='Seleccionar...'
            />
          </div>
          <div className='col-md-6'>
            <label className='form-label'>Tipo de carga</label>
            <VdSelect
              col=''
              noMargin
              value={selectedImportType}
              onChange={(value) => setSelectedImportType(value)}
              options={importTypeOptions}
            />
          </div>
          <div className='col-md-6'>
            <label className='form-label'>Subir archivo</label>
            <input
              ref={importFileRef}
              type='file'
              className='form-control'
              accept='.xlsx,.xls,.csv,.json'
              onChange={onImportFileChanged}
            />
            {importFileName && <div className='mt-1'><small className='text-muted'>Archivo: {importFileName} ({importRows.length} filas)</small></div>}
          </div>

          {importHeaders.length > 0 && (
            <div className='col-12'>
              <details className='article-import-mapping'>
                <summary>Ajustar columnas detectadas</summary>
                <div className='row g-2 mt-2'>
                  {selectedImportType === 'pack_components' ? (
                    <>
                      <div className='col-md-4'>
                        <label className='form-label'>Codigo pack *</label>
                        <VdSelect col='' noMargin value={mapping.pack_code} onChange={(value) => setMapping(prev => ({ ...prev, pack_code: value }))} placeholder='Seleccionar...' options={[{ value: '', label: 'Seleccionar...' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                      </div>
                      <div className='col-md-4'>
                        <label className='form-label'>Nombre pack</label>
                        <VdSelect col='' noMargin value={mapping.pack_name} onChange={(value) => setMapping(prev => ({ ...prev, pack_name: value }))} placeholder='Usar codigo pack' options={[{ value: '', label: 'Usar codigo pack' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                      </div>
                      <div className='col-md-4'>
                        <label className='form-label'>Codigo componente *</label>
                        <VdSelect col='' noMargin value={mapping.component_code} onChange={(value) => setMapping(prev => ({ ...prev, component_code: value }))} placeholder='Seleccionar...' options={[{ value: '', label: 'Seleccionar...' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                      </div>
                      <div className='col-md-4'>
                        <label className='form-label'>Nombre componente</label>
                        <VdSelect col='' noMargin value={mapping.component_name} onChange={(value) => setMapping(prev => ({ ...prev, component_name: value }))} placeholder='Usar codigo componente' options={[{ value: '', label: 'Usar codigo componente' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                      </div>
                      <div className='col-md-4'>
                        <label className='form-label'>Cantidad componente</label>
                        <VdSelect col='' noMargin value={mapping.component_quantity} onChange={(value) => setMapping(prev => ({ ...prev, component_quantity: value }))} placeholder='Usar 1' options={[{ value: '', label: 'Usar 1' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className='col-md-4'>
                        <label className='form-label'>{!isStorageProduct && !isMagistrales ? 'LOTE (EAN) *' : 'Codigo *'}</label>
                        <VdSelect col='' noMargin value={mapping.code} onChange={(value) => setMapping(prev => ({ ...prev, code: value }))} placeholder='Seleccionar...' options={[{ value: '', label: 'Seleccionar...' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                      </div>
                      <div className='col-md-4'>
                        <label className='form-label'>{!isStorageProduct && !isMagistrales ? 'Nombre' : 'Descripcion'}</label>
                        <VdSelect col='' noMargin value={mapping.name} onChange={(value) => setMapping(prev => ({ ...prev, name: value }))} placeholder='Seleccionar...' options={[{ value: '', label: 'Seleccionar...' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                      </div>
                    </>
                  )}
                  {!isStorageProduct && !isMagistrales && <div className='col-md-4'>
                    <label className='form-label'>Almacen</label>
                    <VdSelect col='' noMargin value={mapping.warehouse} onChange={(value) => setMapping(prev => ({ ...prev, warehouse: value }))} placeholder='Usar almacen por empresa' options={[{ value: '', label: 'Usar almacen por empresa' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                  </div>}
                  <div className='col-md-4'>
                    <label className='form-label'>Laboratorio</label>
                    <VdSelect col='' noMargin value={mapping.laboratory} onChange={(value) => setMapping(prev => ({ ...prev, laboratory: value }))} placeholder='Usar laboratorio seleccionado' options={[{ value: '', label: 'Usar laboratorio seleccionado' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Principio activo</label>
                    <VdSelect col='' noMargin value={mapping.active_principle} onChange={(value) => setMapping(prev => ({ ...prev, active_principle: value }))} placeholder='Seleccionar...' options={[{ value: '', label: 'Seleccionar...' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Unidad</label>
                    <VdSelect col='' noMargin value={mapping.unit} onChange={(value) => setMapping(prev => ({ ...prev, unit: value }))} placeholder='Seleccionar...' options={[{ value: '', label: 'Seleccionar...' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Estado</label>
                    <VdSelect col='' noMargin value={mapping.status} onChange={(value) => setMapping(prev => ({ ...prev, status: value }))} placeholder='Seleccionar...' options={[{ value: '', label: 'Seleccionar...' }, ...importHeaders.map(header => ({ value: header, label: header }))]} />
                  </div>
                </div>
              </details>
            </div>
          )}

          <div className='col-12'>
            <div className='table-responsive border'>
              <table className='table table-sm table-striped mb-0'>
                <thead>
                  {selectedImportType === 'pack_components' ? (
                    <tr>
                      <th>#</th>
                      <th>Codigo pack</th>
                      <th>Nombre pack</th>
                      <th>Codigo componente</th>
                      <th>Nombre componente</th>
                      <th>Cantidad</th>
                      {!isStorageProduct && !isMagistrales && <th>Almacen</th>}
                      <th>Laboratorio</th>
                      <th>Principio activo</th>
                      <th>Unidad</th>
                      <th>Estado</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>#</th>
                      <th>{!isStorageProduct && !isMagistrales ? 'LOTE (EAN)' : 'Codigo'}</th>
                      <th>{!isStorageProduct && !isMagistrales ? 'Nombre' : 'Descripcion'}</th>
                      {!isStorageProduct && !isMagistrales && <th>Almacen</th>}
                      <th>Laboratorio</th>
                      <th>Principio activo</th>
                      <th>Unidad</th>
                      <th>Estado</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {previewRows.length === 0 && (
                    <tr>
                      <td colSpan={selectedImportType === 'pack_components' ? (!isStorageProduct && !isMagistrales ? 11 : 10) : (!isStorageProduct && !isMagistrales ? 8 : 7)} className='text-center text-muted'>Sin datos para previsualizar</td>
                    </tr>
                  )}
                  {previewRows.map(item => selectedImportType === 'pack_components' ? (
                    <tr key={`preview-${item.row}`}>
                      <td>{item.row}</td>
                      <td>{item.packCode?.toString?.() ?? ''}</td>
                      <td>{item.packName?.toString?.() ?? ''}</td>
                      <td>{item.componentCode?.toString?.() ?? ''}</td>
                      <td>{item.componentName?.toString?.() ?? ''}</td>
                      <td>{item.componentQuantity?.toString?.() || '1'}</td>
                      {!isStorageProduct && !isMagistrales && <td>{item.warehouse?.toString?.() || selectedImportWarehouseName()}</td>}
                      <td>{item.laboratory?.toString?.() || selectedImportLaboratoryName}</td>
                      <td>{item.principle?.toString?.() ?? ''}</td>
                      <td>{item.unit?.toString?.() ?? ''}</td>
                      <td>{item.status?.toString?.() ?? ''}</td>
                    </tr>
                  ) : (
                    <tr key={`preview-${item.row}`}>
                      <td>{item.row}</td>
                      <td>{item.code?.toString?.() ?? ''}</td>
                      <td>{item.name?.toString?.() ?? ''}</td>
                      {!isStorageProduct && !isMagistrales && <td>{item.warehouse?.toString?.() || selectedImportWarehouseName()}</td>}
                      <td>{item.laboratory?.toString?.() || selectedImportLaboratoryName}</td>
                      <td>{item.principle?.toString?.() ?? ''}</td>
                      <td>{item.unit?.toString?.() ?? ''}</td>
                      <td>{item.status?.toString?.() ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className='col-12 article-import-actions'>
            <button type='button' className='btn btn-light' data-bs-dismiss='modal'>
              <i className='mdi mdi-close me-1'></i> Cerrar
            </button>
            <button type='submit' className='btn btn-primary' disabled={isImporting}>
              <i className='mdi mdi-plus me-1'></i> {isImporting ? 'Importando...' : 'Importar'}
            </button>
            <button type='button' className='btn btn-outline-warning' onClick={onArticleExport}>
              <i className='mdi mdi-plus me-1'></i> Exportar
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <CatalogManagerModal
      modalRef={unitManagerRef}
      title='Gestionar unidades de medida'
      fields={[
        { key: 'name', label: 'Nombre', col: 'col-md-8', required: true },
        { key: 'symbol', label: 'Simbolo', col: 'col-md-4', required: true },
      ]}
      fetchList={() => articlesRest.getUnits()}
      save={(payload) => unitsRest.save(payload)}
      remove={(id) => unitsRest.delete(id)}
      onChanged={() => loadUnits(selectedUnitId)}
    />

    <CatalogManagerModal
      modalRef={principleManagerRef}
      title='Gestionar principios activos'
      fields={[
        { key: 'name', label: 'Nombre', col: 'col-12', required: true },
      ]}
      canManage={!!selectedLaboratoryId}
      fetchList={() => articlesRest.getPrinciplesByLaboratory(selectedLaboratoryId)}
      save={(payload) => laboratoriesRest.savePrinciple(selectedLaboratoryId, payload)}
      remove={(id) => laboratoriesRest.deletePrinciple(selectedLaboratoryId, id)}
      onChanged={() => loadPrinciples(selectedLaboratoryId, selectedPrincipleId)}
    />

    <CatalogManagerModal
      modalRef={labManagerRef}
      title='Gestionar laboratorios'
      fields={[
        { key: 'code', label: 'Codigo', col: 'col-md-4', required: true },
        { key: 'name', label: 'Nombre', col: 'col-md-8', required: true },
      ]}
      fetchList={() => articlesRest.getLaboratories()}
      save={(payload) => laboratoriesRest.save({ country: 'Perú', status: true, ...payload })}
      remove={(id) => laboratoriesRest.delete(id)}
      onChanged={() => { }}
    />
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can(scopedPermission('articles')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Articulos'}>
    <Articles {...properties} />
  </BaseAdminto>);
})
