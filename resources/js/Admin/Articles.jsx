import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import { scopedPermission } from '../Utils/permissionScope';
import renderGridEditLink from '../Utils/renderGridEditLink';
import ArticlesRest from '../Actions/Admin/ArticlesRest';

const articlesRest = new ArticlesRest()

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
  .replaceAll('_', '')
  .replaceAll('-', '')
  .replaceAll(' ', '')

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

const yesNoOptions = [
  { value: '1', label: 'SI' },
  { value: '0', label: 'NO' },
]

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

const magistralArticleTypeOptions = ['INSUMOS', 'ENVASES', 'PRODUCTO TERMINADO']
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
  if (normalized.includes('INSUMO')) return 'INSUMOS'
  if (normalized.includes('ENVASE')) return 'ENVASES'
  if (normalized.includes('PRODUCTO')) return 'PRODUCTO TERMINADO'
  return rawValue.toUpperCase()
}

const magistralEquivalenceDefaultsByType = {
  INSUMOS: [
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
}

const allowedMagistralCategoryLabels = [
  'GINECOLOGIA',
  'INSUMOS',
  'ANDROLOGIA',
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

const getMagistralLaboratory = (data) => data?.magistralLaboratory ?? data?.magistral_laboratory ?? null

const getArticleLaboratoryId = (data, isMagistrales) => {
  if (!data) return ''
  if (isMagistrales) return data?.magistral_laboratory_id ? `${data.magistral_laboratory_id}` : ''
  return data?.laboratory_id ? `${data.laboratory_id}` : ''
}

const getArticleLaboratoryLabel = (data, isMagistrales) => {
  if (!data) return ''
  if (isMagistrales) return getMagistralLaboratory(data)?.description ?? ''
  return data?.laboratory?.name ?? ''
}

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

const storageConditionOptions = [
  '-15°C a -25°C',
  '2°C a 8°C',
  '15°C a 25°C',
  '-15°C a -40°C',
]

const manufacturerCountryOptions = ['Perú']

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
  const gridRef = useRef()
  const modalRef = useRef()
  const stockModalRef = useRef()
  const importModalRef = useRef()
  const importFileRef = useRef()
  const principleCreateModalRef = useRef()
  const unitCreateModalRef = useRef()
  const manufacturerCreateModalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const nameRef = useRef()
  const compositionRef = useRef()
  const articleTypeRef = useRef()
  const administrationRouteRef = useRef()
  const magistralCategoryRef = useRef()
  const subCategoryRef = useRef()
  const magistralPresentationRef = useRef()
  const healthRegistrationRef = useRef()
  const laboratoryRef = useRef()
  const principleRef = useRef()
  const unitRef = useRef()
  const volumeRef = useRef()
  const marginRuleRef = useRef()
  const igvRuleRef = useRef()
  const unitsPerArticleRef = useRef()
  const unitWeightRef = useRef()
  const packRef = useRef()
  const defaultLotRef = useRef()
  const defaultExpirationDateRef = useRef()
  const stockMinRef = useRef()
  const stockMaxRef = useRef()
  const currencyRef = useRef()
  const stockHasExpirationRef = useRef()
  const stockHasLotRef = useRef()
  const statusRef = useRef()
  const costPriceRef = useRef()
  const salePriceRef = useRef()
  const equivalenceQuantityRef = useRef()
  const equivalenceUnitRef = useRef()
  const salePriceNationalRef = useRef()
  const purchasePriceNationalRef = useRef()
  const purchasePriceForeignRef = useRef()
  const notesRef = useRef()
  const newPrincipleNameRef = useRef()
  const newUnitNameRef = useRef()
  const newUnitSymbolRef = useRef()
  const newManufacturerNameRef = useRef()
  const newManufacturerCountryRef = useRef()
  const newManufacturerStatusRef = useRef()
  const suppressMagistralCategoryChangeRef = useRef(false)
  const subcategoryLoadSequenceRef = useRef(0)

  const [isEditing, setIsEditing] = useState(false)
  const [isViewing, setIsViewing] = useState(false)
  const [principles, setPrinciples] = useState([])
  const [units, setUnits] = useState([])
  const [presentations, setPresentations] = useState([emptyPresentation()])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState('')
  const [selectedPrincipleId, setSelectedPrincipleId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [selectedEquivalenceUnitId, setSelectedEquivalenceUnitId] = useState('')
  const [selectedStorageClientId, setSelectedStorageClientId] = useState('')
  const [selectedMagistralCategoryId, setSelectedMagistralCategoryId] = useState('')
  const [selectedSubCategory, setSelectedSubCategory] = useState('')
  const [selectedMagistralPresentation, setSelectedMagistralPresentation] = useState('')
  const [magistralSubcategories, setMagistralSubcategories] = useState([])
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false)
  const [manufacturerTargetLotUid, setManufacturerTargetLotUid] = useState('')
  const [storageClients, setStorageClients] = useState([])
  const [storageManufacturers, setStorageManufacturers] = useState([])
  const [storageLots, setStorageLots] = useState([emptyStorageLot()])
  const [isImporting, setIsImporting] = useState(false)
  const [isLoadingStock, setIsLoadingStock] = useState(false)
  const [stockArticle, setStockArticle] = useState(null)
  const [stockRows, setStockRows] = useState([])
  const [importRows, setImportRows] = useState([])
  const [importHeaders, setImportHeaders] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [mapping, setMapping] = useState({
    code: '',
    name: '',
    laboratory: '',
    active_principle: '',
    unit: '',
    status: '',
  })

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

  const onMagistralCategoryChanged = async (e) => {
    if (suppressMagistralCategoryChangeRef.current) return
    await loadMagistralSubcategories(e.target.value)
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
    } else {
      setSelectedBusinessId('')
    }

    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? ''
    nameRef.current.value = data?.name ?? ''
    if (compositionRef.current) compositionRef.current.value = data?.composition ?? ''
    const normalizedArticleType = normalizeMagistralArticleType(data?.article_type ?? '')
    if (articleTypeRef.current) articleTypeRef.current.value = normalizedArticleType
    if (administrationRouteRef.current) administrationRouteRef.current.value = data?.administration_route ?? ''
    if (healthRegistrationRef.current) healthRegistrationRef.current.value = data?.health_registration ?? ''
    if (volumeRef.current) volumeRef.current.value = data?.volume ?? ''
    if (marginRuleRef.current) marginRuleRef.current.value = data?.margin_rule ? '1' : '0'
    if (igvRuleRef.current) {
      if (isMagistrales) {
        igvRuleRef.current.value = data?.igv_rule ? '1' : '0'
      } else {
        igvRuleRef.current.value = data?.igv_rule ? '1' : '0'
      }
    }
    if (unitsPerArticleRef.current) unitsPerArticleRef.current.value = data?.units_per_article ?? 1
    if (unitWeightRef.current) unitWeightRef.current.value = data?.unit_weight ?? ''
    if (packRef.current) packRef.current.value = data?.is_pack ? '1' : '0'
    if (defaultLotRef.current) defaultLotRef.current.value = data?.default_lot ?? ''
    if (defaultExpirationDateRef.current) defaultExpirationDateRef.current.value = data?.default_expiration_date ? data.default_expiration_date.toString().slice(0, 10) : ''
    if (stockMinRef.current) stockMinRef.current.value = data?.stock_min ?? ''
    if (stockMaxRef.current) stockMaxRef.current.value = data?.stock_max ?? ''
    if (currencyRef.current) currencyRef.current.value = data?.currency ?? 'PEN'
    if (stockHasExpirationRef.current) {
      if (isMagistrales) {
        stockHasExpirationRef.current.value = data?.stock_has_expiration ? '1' : '0'
      } else {
        stockHasExpirationRef.current.checked = !!data?.stock_has_expiration
      }
    }
    if (stockHasLotRef.current) {
      if (isMagistrales) {
        stockHasLotRef.current.value = data?.stock_has_lot ? '1' : '0'
      } else {
        stockHasLotRef.current.checked = !!data?.stock_has_lot
      }
    }
    if (statusRef.current) {
      if (isMagistrales) {
        statusRef.current.value = getMagistralStatusValue(data)
      } else if (isStorageProduct) {
        statusRef.current.value = data?.status === false || data?.status === 0 ? '0' : '1'
      } else {
        statusRef.current.value = data?.status === false || data?.status === 0 ? '0' : '1'
      }
    }
    if (costPriceRef.current) costPriceRef.current.value = data?.cost_price ?? ''
    if (salePriceRef.current) salePriceRef.current.value = data?.sale_price ?? ''
    if (equivalenceQuantityRef.current) equivalenceQuantityRef.current.value = data?.equivalence_quantity ?? ''
    if (salePriceNationalRef.current) salePriceNationalRef.current.value = data?.sale_price_national ?? ''
    if (purchasePriceNationalRef.current) purchasePriceNationalRef.current.value = data?.purchase_price_national ?? ''
    if (purchasePriceForeignRef.current) purchasePriceForeignRef.current.value = data?.purchase_price_foreign ?? ''
    if (notesRef.current) notesRef.current.value = data?.notes ?? ''

    const selectedCategoryIsAllowed = data?.magistral_category_id && data?.magistralCategory?.description && isAllowedMagistralCategory(data.magistralCategory.description)
    const preferredMagistralCategoryId = selectedCategoryIsAllowed ? data.magistral_category_id : null
    if (magistralCategoryRef.current) {
      suppressMagistralCategoryChangeRef.current = true
      if (preferredMagistralCategoryId) {
        SetSelectValue(magistralCategoryRef.current, data.magistral_category_id, data.magistralCategory.description)
      } else {
        $(magistralCategoryRef.current).empty().trigger('change')
      }
      suppressMagistralCategoryChangeRef.current = false
    }
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
      const laboratoryId = getArticleLaboratoryId(data, isMagistrales)
      const laboratoryLabel = getArticleLaboratoryLabel(data, isMagistrales)
      setSelectedLaboratoryId(laboratoryId)
      if (laboratoryId && laboratoryLabel) {
        SetSelectValue(laboratoryRef.current, laboratoryId, laboratoryLabel)
      } else {
        $(laboratoryRef.current).empty().trigger('change')
      }
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
      article_type: isMagistrales ? normalizeMagistralArticleType(articleTypeRef.current?.value) : (articleTypeRef.current?.value?.trim() ?? ''),
      administration_route: administrationRouteRef.current?.value?.trim() ?? '',
      magistral_category_id: magistralCategoryRef.current?.value || null,
      sub_category: (subCategoryRef.current?.value || selectedSubCategory || '').trim(),
      magistral_presentation: selectedMagistralPresentation || magistralPresentationRef.current?.value || null,
      health_registration: healthRegistrationRef.current?.value?.trim() ?? '',
      business_id: (!isStorageProduct && !isMagistrales) ? (selectedBusinessId || null) : null,
      laboratory_id: isMagistrales ? null : (selectedLaboratoryId || null),
      magistral_laboratory_id: isMagistrales ? (selectedLaboratoryId || null) : null,
      active_principle_id: isMagistrales ? null : (selectedPrincipleId || null),
      unit_id: selectedUnitId || null,
      volume: volumeRef.current?.value ?? '',
      margin_rule: marginRuleRef.current?.value === '1',
      igv_rule: igvRuleRef.current?.value === '1',
      units_per_article: unitsPerArticleRef.current?.value || 1,
      ...(isMagistrales ? {
        magistral_status: statusRef.current?.value || 'vigente',
        status: statusRef.current?.value !== 'de_baja',
      } : {}),
      ...(!isMagistrales && !isStorageProduct ? {
        status: statusRef.current?.value === '0' ? false : true,
        is_pack: packRef.current?.value === '1',
      } : {}),
      ...(isStorageProduct ? {
        client_id: selectedStorageClientId || null,
        status: statusRef.current?.value === '0' ? false : true,
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
      currency: currencyRef.current?.value ?? '',
      stock_has_expiration: isMagistrales ? stockHasExpirationRef.current?.value === '1' : (stockHasExpirationRef.current?.checked ?? false),
      stock_has_lot: isMagistrales ? stockHasLotRef.current?.value === '1' : (stockHasLotRef.current?.checked ?? false),
      cost_price: costPriceRef.current?.value ?? '',
      sale_price: salePriceRef.current?.value ?? '',
      equivalence_exchange_rate: null,
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

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await articlesRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
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
    $(gridRef.current).dxDataGrid('instance').refresh()
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

  const onImportModalOpen = () => {
    setImportRows([])
    setImportHeaders([])
    setImportFileName('')
    setMapping({
      code: '',
      name: '',
      laboratory: '',
      active_principle: '',
      unit: '',
      status: '',
    })
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
      code: findByNames(['codigo', 'code', 'codigodearticulo', 'sku']),
      name: findByNames(['descripcion', 'description', 'name', 'nombre', 'articulo', 'producto']),
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
      setMapping({
        code: '',
        name: '',
        laboratory: '',
        active_principle: '',
        unit: '',
        status: '',
      })
      Swal.fire({
        icon: 'error',
        title: 'No se pudo leer el archivo',
        text: error.message
      })
    }
  }

  const onImportSubmit = async (e) => {
    e.preventDefault()

    if (!importRows.length) {
      Swal.fire({ icon: 'warning', title: 'Falta archivo', text: 'Primero carga un archivo con datos' })
      return
    }
    if (!mapping.code) {
      Swal.fire({ icon: 'warning', title: 'Campo obligatorio', text: 'Debes mapear el campo codigo' })
      return
    }

    setIsImporting(true)
    const result = await articlesRest.importRows({
      rows: importRows,
      mapping
    })
    setIsImporting(false)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(importModalRef.current).modal('hide')

    const errorsPreview = (result.errors || []).slice(0, 5).join('\n')
    await Swal.fire({
      icon: 'success',
      title: 'Importacion completada',
      html: `
        <div style="text-align:left">
          <p style="margin:0"><b>Creados:</b> ${result.created}</p>
          <p style="margin:0"><b>Actualizados:</b> ${result.updated}</p>
          <p style="margin:0"><b>Omitidos:</b> ${result.skipped}</p>
          ${errorsPreview ? `<pre style="margin-top:8px;white-space:pre-wrap;font-size:12px">${errorsPreview}</pre>` : ''}
        </div>
      `
    })
  }

  const onLaboratoryChanged = async (e) => {
    const laboratoryId = e.target.value || ''
    setSelectedLaboratoryId(laboratoryId)
    if (isMagistrales) return
    await loadPrinciples(laboratoryId, null)
  }

  const onOpenCreatePrincipleModal = () => {
    if (isMagistrales) return
    if (!selectedLaboratoryId) {
      Swal.fire({
        icon: 'warning',
        title: 'Laboratorio requerido',
        text: 'Primero selecciona un laboratorio para asociar el principio activo'
      })
      return
    }
    newPrincipleNameRef.current.value = ''
    $(principleCreateModalRef.current).modal('show')
  }

  const onCreatePrincipleSubmit = async (e) => {
    e.preventDefault()
    const name = (newPrincipleNameRef.current.value ?? '').trim()
    if (!name) return

    const created = await articlesRest.createPrinciple(selectedLaboratoryId, { name })
    if (!created) return

    await loadPrinciples(selectedLaboratoryId, created.id)
    $(principleCreateModalRef.current).modal('hide')
  }

  const onOpenCreateUnitModal = () => {
    newUnitNameRef.current.value = ''
    newUnitSymbolRef.current.value = ''
    $(unitCreateModalRef.current).modal('show')
  }

  const onCreateUnitSubmit = async (e) => {
    e.preventDefault()
    const request = {
      name: (newUnitNameRef.current.value ?? '').trim(),
      symbol: (newUnitSymbolRef.current.value ?? '').trim(),
    }
    if (!request.name || !request.symbol) return

    const created = await articlesRest.createUnit(request)
    if (!created?.id) return

    await loadUnits(created.id)
    $(unitCreateModalRef.current).modal('hide')
  }

  const onPresentationUpdated = (uid, field, value) => {
    setPresentations(prev => prev.map(item => item.uid === uid ? { ...item, [field]: value } : item))
  }

  const onMagistralArticleTypeChanged = (value) => {
    const normalizedType = normalizeMagistralArticleType(value)
    if (articleTypeRef.current) articleTypeRef.current.value = normalizedType
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
    if (newManufacturerCountryRef.current) newManufacturerCountryRef.current.value = manufacturerCountryOptions[0]
    if (newManufacturerStatusRef.current) newManufacturerStatusRef.current.value = '1'
    $(manufacturerCreateModalRef.current).modal('show')
  }

  const onCreateManufacturerSubmit = async (e) => {
    e.preventDefault()

    const value = {
      name: newManufacturerNameRef.current?.value?.trim() ?? '',
      country: newManufacturerCountryRef.current?.value || manufacturerCountryOptions[0],
      status: newManufacturerStatusRef.current?.value !== '0',
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
    laboratory: mapping.laboratory ? (row[mapping.laboratory] ?? '') : '',
    principle: mapping.active_principle ? (row[mapping.active_principle] ?? '') : '',
    unit: mapping.unit ? (row[mapping.unit] ?? '') : '',
    status: mapping.status ? (row[mapping.status] ?? '') : '',
  }))

  const getStorageProductExportRows = () => {
    const instance = $(gridRef.current).dxDataGrid('instance')
    return instance?.getDataSource()?.items?.() ?? []
  }

  const buildStorageProductExportMatrix = () => {
    const rows = getStorageProductExportRows()
    const headers = storageProductExportColumns.map(column => column.caption)
    const body = rows.map(row => storageProductExportColumns.map(column => column.value(row)))
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
    const { headers, body } = buildStorageProductExportMatrix()
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

  const igvColumn = {
    dataField: 'igv_rule',
    caption: isMagistrales ? 'Afecto IGV' : 'Regla IGV',
    dataType: 'boolean',
    width: isMagistrales ? '105px' : '95px',
    cellTemplate: (container, { data }) => {
      $(container).empty()
      if (data.status === null) return
      ReactAppend(container, <SwitchFormGroup checked={data.igv_rule == 1} onChange={() => onBooleanChange({
        id: data.id,
        field: 'igv_rule',
        value: !data.igv_rule
      })} />)
    }
  }

  const statusColumn = {
    dataField: 'status',
    caption: 'Estado',
    dataType: 'boolean',
    width: '95px',
    cellTemplate: (container, { data }) => {
      $(container).empty()
      if (data.status === null) return
      ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({
        id: data.id,
        field: 'status',
        value: !data.status
      })} />)
    }
  }

  const magistralIgvColumn = {
    dataField: 'igv_rule',
    caption: 'Afecto IGV',
    width: '110px',
    cellTemplate: (container, { data }) => container.text(data?.igv_rule ? 'SI' : 'NO')
  }

  const magistralStatusColumn = {
    dataField: 'magistral_status',
    caption: 'Estado',
    width: '120px',
    calculateCellValue: (data) => magistralStatusMeta[getMagistralStatusValue(data)]?.label ?? 'VIGENTE',
    cellTemplate: (container, { data }) => {
      const meta = magistralStatusMeta[getMagistralStatusValue(data)] ?? magistralStatusMeta.vigente
      ReactAppend(container, <span className={`badge ${meta.className}`}>
        {meta.label}
      </span>)
    }
  }

  const actionsColumn = {
    caption: 'Acciones',
    width: isMagistrales ? '95px' : '120px',
    cellTemplate: (container, { data }) => {
      container.css('text-overflow', 'unset')
      if (isMagistrales) {
        container.append(DxButton({
          className: 'btn btn-xs btn-soft-success',
          title: 'Mostrar',
          icon: 'mdi mdi-eye',
          onClick: () => onModalOpen(data, 'view')
        }))
        container.append(DxButton({
          className: 'btn btn-xs btn-soft-info',
          title: 'Editar',
          icon: 'mdi mdi-pencil',
          onClick: () => onModalOpen(data)
        }))
        return
      }

      if (isStorageProduct) {
        container.append(DxButton({
          className: 'btn btn-xs btn-soft-primary',
          title: 'Editar',
          icon: 'mdi mdi-pencil',
          onClick: () => onModalOpen(data)
        }))
        container.append(DxButton({
          className: 'btn btn-xs btn-soft-danger',
          title: 'Eliminar articulo',
          icon: 'mdi mdi-delete',
          onClick: () => onDeleteClicked(data.id)
        }))
        return
      }

      container.append(DxButton({
        className: 'btn btn-xs btn-soft-primary',
        title: 'Editar',
        icon: 'mdi mdi-pencil',
        onClick: () => onModalOpen(data)
      }))
      container.append(DxButton({
        className: 'btn btn-xs btn-soft-info',
        title: 'Stock por almacen',
        icon: 'mdi mdi-package-variant-closed',
        onClick: () => onOpenStockModal(data)
      }))
      container.append(DxButton({
        className: 'btn btn-xs btn-soft-danger',
        title: 'Eliminar articulo',
        icon: 'mdi mdi-delete',
        onClick: () => onDeleteClicked(data.id)
      }))
    },
    allowFiltering: false,
    allowExporting: false
  }

  const unitColumn = {
    dataField: 'unit.symbol',
    caption: 'Unidad',
    width: '110px',
    cellTemplate: (container, { data }) => container.text(data?.unit?.symbol || data?.unit?.name || '')
  }

  const storageStatusColumn = {
    dataField: 'status',
    caption: 'Estado',
    width: '110px',
    cellTemplate: (container, { data }) => {
      const active = data?.status !== false && data?.status !== 0
      ReactAppend(container, <span className={`badge ${active ? 'bg-success' : 'bg-secondary'}`}>
        {active ? 'Activo' : 'Inactivo'}
      </span>)
    }
  }

  const presentationsColumn = {
    dataField: 'presentations.name',
    caption: isMagistrales ? 'Equivalencias' : 'Presentaciones',
    allowFiltering: false,
    minWidth: 220,
    cellTemplate: (container, { data }) => {
      const lines = (data?.presentations ?? []).map(item => `${item.name} (${Number(item.units).toFixed(2)}) - S/. ${Number(item.price).toFixed(2)}`)
      ReactAppend(container, <div>
        {lines.length === 0 && <small className='text-muted'>Sin presentaciones</small>}
        {lines.map((line, idx) => <div key={`p-${data.id}-${idx}`}><small>{line}</small></div>)}
      </div>)
    }
  }

  const auditColumns = [
    { dataField: 'notes', caption: 'Notas', visible: false },
    { dataField: 'composition', caption: 'Composicion', visible: false },
    {
      dataField: 'creator.fullname',
      caption: 'Creado por',
      visible: false,
      cellTemplate: (container, { data }) => container.text(formatAuditUser(data.creator))
    },
    {
      dataField: 'updater.fullname',
      caption: 'Actualizado por',
      visible: false,
      cellTemplate: (container, { data }) => container.text(formatAuditUser(data.updater))
    },
  ]

  const magistralesColumns = [
    actionsColumn,
    {
      dataField: 'code',
      caption: 'Codigo',
      width: '130px',
      cellTemplate: (container, { data }) => container.text(data?.code ?? '')
    },
    { dataField: 'article_type', caption: 'Tipo', width: '120px' },
    { dataField: 'magistral_presentation', caption: 'Presentacion', width: '150px' },
    { dataField: 'administration_route', caption: 'Via adm.', width: '120px' },
    { dataField: 'name', caption: 'Articulo', minWidth: 200 },
    {
      dataField: 'magistral_laboratory.description',
      caption: 'Laboratorio',
      width: '150px',
      cellTemplate: (container, { data }) => container.text(getArticleLaboratoryLabel(data, true))
    },
    magistralIgvColumn,
    { dataField: 'default_expiration_date', caption: 'F. venc.', width: '110px', dataType: 'date' },
    { dataField: 'default_lot', caption: 'Lote', width: '110px' },
    magistralStatusColumn,
  ]

  const standardColumns = [
    { dataField: 'id', caption: 'ID', visible: false },
    {
      dataField: 'code',
      caption: 'Codigo',
      width: '130px',
      cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar articulo')
    },
    {
      dataField: 'business.name',
      caption: 'Empresa',
      width: '170px',
      cellTemplate: (container, { data }) => container.text(data?.business?.name ?? '-')
    },
    { dataField: 'name', caption: 'Articulo', minWidth: 180 },
    { dataField: 'laboratory.name', caption: 'Laboratorio', width: '150px' },
    { dataField: 'activePrinciple.name', caption: 'Principio activo', width: '180px' },
    unitColumn,
    { dataField: 'volume', caption: 'Volumen', width: '100px' },
    { dataField: 'units_per_article', caption: 'Und x articulo', width: '110px' },
    { dataField: 'unit_weight', caption: 'Peso unit.', width: '100px' },
    {
      dataField: 'margin_rule',
      caption: 'Regla margen',
      dataType: 'boolean',
      width: '105px',
      cellTemplate: (container, { data }) => {
        $(container).empty()
        if (data.status === null) return
        ReactAppend(container, <SwitchFormGroup checked={data.margin_rule == 1} onChange={() => onBooleanChange({
          id: data.id,
          field: 'margin_rule',
          value: !data.margin_rule
        })} />)
      }
    },
    igvColumn,
    {
      dataField: 'is_pack',
      caption: 'Pack',
      dataType: 'boolean',
      width: '80px',
      cellTemplate: (container, { data }) => container.text(data?.is_pack ? 'SI' : 'NO')
    },
    presentationsColumn,
    ...auditColumns,
    statusColumn,
    actionsColumn,
  ]

  const storageProductColumns = [
    actionsColumn,
    {
      dataField: 'code',
      caption: 'Codigo',
      width: '130px',
      cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar articulo')
    },
    {
      dataField: 'client.full_name',
      caption: 'Cliente',
      minWidth: 220,
      cellTemplate: (container, { data }) => container.text(data?.client?.full_name ?? '')
    },
    { dataField: 'name', caption: 'Nombre articulo', minWidth: 260 },
    unitColumn,
    storageStatusColumn,
  ]

  const articleColumns = isMagistrales ? magistralesColumns : (isStorageProduct ? storageProductColumns : standardColumns)

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
          <div className='form-group col-md-2 mb-2'>
            <label className='form-label'>Estado</label>
            <select ref={statusRef} className='form-control' defaultValue='vigente'>
              {magistralStatusOptions.map(option => (
                <option key={`magistral-status-${option.value}`} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className='row g-3 mt-1'>
        <div className='col-lg-6'>
          <div className='magistrales-section h-100'>
            <div className='magistrales-section-title'>
              <i className='mdi mdi-shape-outline me-1'></i> Clasificación
            </div>
            <div className='row g-3 magistrales-section-body'>
              <SelectAPIFormGroup
                eRef={magistralCategoryRef}
                label='Categoría'
                col='col-md-4'
                searchAPI='/api/admin/magistrales/categories/paginate'
                searchBy='description'
                dropdownParent='#article-form-container'
                onChange={onMagistralCategoryChanged}
              />
              <SelectFormGroup
                eRef={subCategoryRef}
                label='Subcategoría'
                col='col-md-4'
                dropdownParent='#article-form-container'
                value={selectedSubCategory}
                disabled={!selectedMagistralCategoryId || isLoadingSubcategories || magistralSubcategories.length === 0}
                effectWith={[selectedMagistralCategoryId, isLoadingSubcategories, magistralSubcategories.map(item => `${item.id}:${item.description}`).join('|')]}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
              >
                <option value=''>
                  {!selectedMagistralCategoryId ? 'Seleccione una categoría' : (isLoadingSubcategories ? 'Cargando...' : (magistralSubcategories.length ? 'Seleccione' : 'Sin subcategorías'))}
                </option>
                {magistralSubcategories.map(subcategory => (
                  <option key={`magistral-subcategory-${subcategory.id}`} value={subcategory.description}>{subcategory.description}</option>
                ))}
              </SelectFormGroup>
              <SelectFormGroup
                eRef={magistralPresentationRef}
                label='Presentación'
                col='col-md-4'
                dropdownParent='#article-form-container'
                value={selectedMagistralPresentation}
                onChange={(e) => setSelectedMagistralPresentation(e.target.value)}
              >
                <option value=''>Seleccione</option>
                {magistralPresentationOptions.map(option => (
                  <option key={`magistral-presentation-${option}`} value={option}>{option}</option>
                ))}
              </SelectFormGroup>
              <div className='form-group col-md-3 mb-2'>
                <label className='form-label'>Tipo de artículo</label>
                <select
                  ref={articleTypeRef}
                  className='form-control'
                  defaultValue=''
                  onChange={(e) => onMagistralArticleTypeChanged(e.target.value)}
                >
                  <option value=''>Seleccione</option>
                  {magistralArticleTypeOptions.map(option => (
                    <option key={`magistral-type-${option}`} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className='form-group col-md-3 mb-2'>
                <label className='form-label'>Vía administración</label>
                <select ref={administrationRouteRef} className='form-control' defaultValue=''>
                  <option value=''>Seleccione</option>
                  {magistralAdministrationRouteOptions.map(option => (
                    <option key={`magistral-route-${option}`} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <SelectAPIFormGroup
                eRef={laboratoryRef}
                label='Laboratorio'
                col='col-md-3'
                required
                searchAPI={articlesRest.laboratoriesPaginateApi()}
                searchBy={articlesRest.laboratoriesSearchBy()}
                dropdownParent='#article-form-container'
                onChange={onLaboratoryChanged}
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
              <div className='form-group col-md-3 mb-2'>
                <label className='form-label'>Afecto a IGV</label>
                <select ref={igvRuleRef} className='form-control' defaultValue='0'>
                  {yesNoOptions.map(option => (
                    <option key={`magistral-igv-${option.value}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className='form-group col-md-3 mb-2'>
                <label className='form-label'>Moneda</label>
                <select ref={currencyRef} className='form-control' defaultValue='PEN'>
                  <option value='PEN'>Soles</option>
                  <option value='USD'>Dolares</option>
                </select>
              </div>
              <div className='form-group col-md-3 mb-2'>
                <label className='form-label'>Stock con Vencim.</label>
                <select ref={stockHasExpirationRef} className='form-control' defaultValue='0'>
                  {yesNoOptions.map(option => (
                    <option key={`magistral-exp-${option.value}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className='form-group col-md-3 mb-2'>
                <label className='form-label'>Stock con Lote</label>
                <select ref={stockHasLotRef} className='form-control' defaultValue='0'>
                  {yesNoOptions.map(option => (
                    <option key={`magistral-lot-${option.value}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <InputFormGroup eRef={costPriceRef} label='Precio Costo' col='col-md-3' type='number' min='0' step='0.01' />
              <InputFormGroup eRef={salePriceRef} label='Precio Venta' col='col-md-3' type='number' min='0' step='0.01' />
            </div>
          </div>
        </div>
      </div>

      <div className='mt-3'>
        <button type='button' className='btn btn-sm btn-soft-primary' onClick={onPresentationAdded}>
          <i className='mdi mdi-plus-circle-outline me-1'></i> Insertar equivalencia
        </button>
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
    {isStorageProduct && (
      <style>{`
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
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={articlesRest}
      toolBar={(container) => {
        if (isStorageProduct) {
          [
            { text: 'Imprimir', format: 'print' },
            { text: 'PDF', format: 'pdf' },
            { text: 'Excel', format: 'excel' },
            { text: 'CSV', format: 'csv' },
            { text: 'Copiar', format: 'copy' },
          ].forEach(item => {
            container.unshift({
              widget: 'dxButton',
              location: 'before',
              options: {
                text: item.text,
                stylingMode: 'outlined',
                onClick: () => onStorageProductExport(item.format)
              }
            })
          })
          container.unshift({
            widget: 'dxButton', location: 'after',
            options: {
              icon: 'refresh',
              hint: 'Refrescar tabla',
              onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
            }
          })
          container.unshift({
            widget: 'dxButton', location: 'after',
            options: {
              icon: 'add',
              title: 'Agregar',
              hint: 'Agregar articulo',
              onClick: () => onModalOpen()
            }
          })
          return
        }

        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'upload',
            title: 'Importar',
            hint: 'Importar masivamente',
            onClick: () => onImportModalOpen()
          }
        });
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
            title: 'Agregar',
            hint: 'Agregar articulo',
            onClick: () => onModalOpen()
          }
        });
      }}
      pageSize={25}
      columns={articleColumns}
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
      size='xl'
      dialogClass={isMagistrales ? 'magistrales-article-dialog' : (!isStorageProduct ? 'article-dialog' : '')}
      contentClass={isMagistrales ? 'magistrales-article-modal' : (!isStorageProduct ? 'article-modal' : '')}
      hideButtonSubmit={isViewing}
      btnSubmitText={isMagistrales ? 'Guardar artículo' : 'Registrar'}
    >
      <div className='row' id='article-form-container'>
        <input ref={idRef} type='hidden' />
        {isStorageProduct ? (
        <fieldset className='row p-0 m-0' disabled={isViewing}>
          <div className='form-group col-md-4 mb-2'>
            <label className='form-label'>Cliente <span className='text-danger'>*</span></label>
            <select
              className='form-control'
              value={selectedStorageClientId}
              onChange={(e) => setSelectedStorageClientId(e.target.value)}
              required
            >
              <option value=''>Seleccione Cliente</option>
              {storageClients.map(client => (
                <option key={`storage-client-${client.entity_id ?? client.id}`} value={client.entity_id ?? client.id}>
                  {client.document_number ? `${client.document_number} | ` : ''}{client.full_name ?? client.display_name}
                </option>
              ))}
            </select>
          </div>
          <InputFormGroup eRef={codeRef} label='Codigo de Articulo' col='col-md-4' readOnly placeholder='Se genera al guardar' />
          <InputFormGroup eRef={nameRef} label='Nombre de Articulo' col='col-md-4' required />
          <SelectFormGroup
            eRef={unitRef}
            label='Und. Med.'
            col='col-md-6'
            dropdownParent='#article-form-container'
            required
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            effectWith={[selectedUnitId, units.length]}
          >
            <option value=''>Seleccione Unidad</option>
            {units.map(unit => (
              <option key={`storage-unit-${unit.id}`} value={unit.id}>
                {unit.name}{unit.symbol ? ` (${unit.symbol})` : ''}
              </option>
            ))}
          </SelectFormGroup>
          <div className='form-group col-md-6 mb-2'>
            <label className='form-label'>Estado</label>
            <select ref={statusRef} className='form-control' defaultValue='1'>
              <option value='1'>Activo</option>
              <option value='0'>Inactivo</option>
            </select>
          </div>
          <TextareaFormGroup eRef={notesRef} label='Observaciones' col='col-12' rows={3} />

          <div className='col-12 mt-2'>
            <button type='button' className='btn btn-sm btn-outline-primary mb-3' onClick={onStorageLotAdded}>
              <i className='mdi mdi-plus-circle-outline me-1'></i> AÑADIR LOTE / SERIE
            </button>
            <div className='table-responsive border rounded'>
              <table className='table table-sm table-bordered mb-0 align-middle'>
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
                        <select
                          className='form-control form-control-sm'
                          value={lot.storage_condition}
                          onChange={(e) => onStorageLotUpdated(lot.uid, 'storage_condition', e.target.value)}
                        >
                          <option value=''>Seleccione</option>
                          {storageConditionOptions.map(condition => (
                            <option key={`storage-condition-${condition}`} value={condition}>{condition}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className='storage-manufacturer-picker'>
                          <select
                            className='form-control form-control-sm'
                            value={lot.manufacturer_id}
                            onChange={(e) => onStorageLotUpdated(lot.uid, 'manufacturer_id', e.target.value)}
                          >
                            <option value=''>Seleccione</option>
                            {storageManufacturers.map(manufacturer => (
                              <option key={`manufacturer-${manufacturer.id}`} value={manufacturer.id}>{manufacturer.name}</option>
                            ))}
                          </select>
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
        {!isMagistrales && !isStorageProduct && (
          <div className='form-group col-md-4 mb-2'>
            <label className='form-label'>Empresa <span className='text-danger'>*</span></label>
            <select
              className='form-control'
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              required
            >
              <option value=''>Seleccione empresa</option>
              {businesses.map(business => (
                <option key={`article-business-${business.id}`} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <InputFormGroup eRef={codeRef} label={isMagistrales ? 'Codigo' : 'Codigo de articulo'} col={isMagistrales ? 'col-md-4' : 'col-md-4'} required />
        <InputFormGroup eRef={nameRef} label={isMagistrales ? 'Descripcion' : 'Nombre del articulo'} col={isMagistrales ? 'col-md-8' : 'col-md-4'} required />

        {isMagistrales && <>
          <TextareaFormGroup eRef={compositionRef} label='Composicion' col='col-md-8' rows={2} />
          <div className='form-group col-md-4 mb-2'>
            <label className='form-label d-block'>Estado</label>
            <div className='form-check form-switch'>
              <input ref={statusRef} className='form-check-input' type='checkbox' />
            </div>
          </div>
          <SelectAPIFormGroup
            eRef={magistralCategoryRef}
            label='Categoria'
            col='col-md-3'
            searchAPI='/api/admin/magistrales/categories/paginate'
            searchBy='description'
            dropdownParent='#article-form-container'
            onChange={onMagistralCategoryChanged}
          />
          <SelectFormGroup
            eRef={subCategoryRef}
            label='Sub categoria'
            col='col-md-3'
            dropdownParent='#article-form-container'
            value={selectedSubCategory}
            disabled={!selectedMagistralCategoryId || isLoadingSubcategories || magistralSubcategories.length === 0}
            effectWith={[selectedMagistralCategoryId, isLoadingSubcategories, magistralSubcategories.map(item => `${item.id}:${item.description}`).join('|')]}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
          >
            <option value=''>
              {!selectedMagistralCategoryId ? 'Seleccione una categoria' : (isLoadingSubcategories ? 'Cargando...' : (magistralSubcategories.length ? 'Seleccione' : 'Sin subcategorias'))}
            </option>
            {magistralSubcategories.map(subcategory => (
              <option key={`magistral-subcategory-legacy-${subcategory.id}`} value={subcategory.description}>{subcategory.description}</option>
            ))}
          </SelectFormGroup>
          <SelectFormGroup
            eRef={magistralPresentationRef}
            label='Presentacion'
            col='col-md-3'
            dropdownParent='#article-form-container'
            value={selectedMagistralPresentation}
            onChange={(e) => setSelectedMagistralPresentation(e.target.value)}
          >
            <option value=''>Seleccione</option>
            {magistralPresentationOptions.map(option => (
              <option key={`magistral-presentation-legacy-${option}`} value={option}>{option}</option>
            ))}
          </SelectFormGroup>
          <InputFormGroup eRef={unitsPerArticleRef} label='Unidades por caja' col='col-md-3' type='number' min='1' required />
          <InputFormGroup eRef={articleTypeRef} label='Tipo de articulo' col='col-md-3' />
          <InputFormGroup eRef={administrationRouteRef} label='Via administracion' col='col-md-3' />
        </>}

        <SelectAPIFormGroup
          eRef={laboratoryRef}
          label='Laboratorio'
          col='col-md-4'
          required
          searchAPI={articlesRest.laboratoriesPaginateApi()}
          searchBy={articlesRest.laboratoriesSearchBy()}
          dropdownParent='#article-form-container'
          onChange={onLaboratoryChanged}
        />

        {isMagistrales && <InputFormGroup eRef={healthRegistrationRef} label='R. sanitario' col='col-md-4' />}

        {!isMagistrales && <SelectFormGroup
          eRef={principleRef}
          label={<span>Principio activo <button type='button' className='btn btn-link p-0 ms-2' onClick={onOpenCreatePrincipleModal}>Agregar</button></span>}
          col='col-md-4'
          dropdownParent='#article-form-container'
          required
          value={selectedPrincipleId}
          onChange={(e) => setSelectedPrincipleId(e.target.value)}
          effectWith={[selectedPrincipleId, principles.length]}
        >
          <option value=''>Seleccionar...</option>
          {principles.map(principle => (
            <option key={`principle-${principle.id}`} value={principle.id}>{principle.name}</option>
          ))}
        </SelectFormGroup>}

        <SelectFormGroup
          eRef={unitRef}
          label={<span>Unidad de medida <button type='button' className='btn btn-link p-0 ms-2' onClick={onOpenCreateUnitModal}>Agregar</button></span>}
          col='col-md-4'
          dropdownParent='#article-form-container'
          required
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
          effectWith={[selectedUnitId, units.length]}
        >
          <option value=''>Seleccionar...</option>
          {units.map(unit => (
            <option key={`unit-${unit.id}`} value={unit.id}>
              {unit.name}{unit.symbol ? ` (${unit.symbol})` : ''}
            </option>
          ))}
        </SelectFormGroup>

        {!isMagistrales && <>
          <InputFormGroup eRef={volumeRef} label='Volumen' col='col-md-3' type='number' step='0.001' />
          <InputFormGroup eRef={unitsPerArticleRef} label='Unidad por articulo' col='col-md-3' type='number' min='1' required />
          <InputFormGroup eRef={unitWeightRef} label='Peso Unitario (Kg)' col='col-md-3' type='number' step='0.0001' />
          <div className='form-group col-md-3 mb-2'>
            <label className='form-label'>Regla de margen</label>
            <select ref={marginRuleRef} className='form-control' defaultValue='0'>
              <option value=''>Seleccione</option>
              {yesNoOptions.map(option => (
                <option key={`margin-rule-${option.value}`} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className='form-group col-md-3 mb-2'>
            <label className='form-label'>Estado</label>
            <select ref={statusRef} className='form-control' defaultValue='1'>
              <option value='1'>Activo</option>
              <option value='0'>Inactivo</option>
            </select>
          </div>
          <div className='form-group col-md-3 mb-2'>
            <label className='form-label'>Pack</label>
            <select ref={packRef} className='form-control' defaultValue='0'>
              <option value='0'>NO</option>
              <option value='1'>SI</option>
            </select>
          </div>
        </>}

        {isMagistrales && <>
          <InputFormGroup eRef={stockMinRef} label='Stock minimo' col='col-md-3' type='number' min='0' step='0.001' />
          <InputFormGroup eRef={stockMaxRef} label='Stock maximo' col='col-md-3' type='number' min='0' step='0.001' />
          <SelectFormGroup eRef={currencyRef} label='Moneda' col='col-md-3' dropdownParent='#article-form-container'>
            <option value='PEN'>S/ - PEN</option>
            <option value='USD'>US$ - USD</option>
          </SelectFormGroup>
          <InputFormGroup eRef={costPriceRef} label='Precio costo' col='col-md-3' type='number' min='0' step='0.01' />
          <InputFormGroup eRef={salePriceRef} label='Precio venta' col='col-md-3' type='number' min='0' step='0.01' />
          <InputFormGroup eRef={defaultExpirationDateRef} label='F. vencimiento' col='col-md-3' type='date' />
          <InputFormGroup eRef={defaultLotRef} label='Lote' col='col-md-3' />
        </>}

        <div className='form-group col-md-3 mb-2'>
          <label className='form-label'>{isMagistrales ? 'Afecto a IGV' : 'Regla de IGV'}</label>
          <select ref={igvRuleRef} className='form-control' defaultValue='0'>
            <option value=''>Seleccione</option>
            {yesNoOptions.map(option => (
              <option key={`igv-rule-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {isMagistrales && <>
          <div className='form-group col-md-3 mb-2'>
            <label className='form-label d-block'>Stock con vencim.</label>
            <div className='form-check form-switch'>
              <input ref={stockHasExpirationRef} className='form-check-input' type='checkbox' />
            </div>
          </div>
          <div className='form-group col-md-3 mb-2'>
            <label className='form-label d-block'>Stock con lote</label>
            <div className='form-check form-switch'>
              <input ref={stockHasLotRef} className='form-check-input' type='checkbox' />
            </div>
          </div>
          <InputFormGroup eRef={equivalenceQuantityRef} label='Cantidad equivalente' col='col-md-3' type='number' min='0' step='0.001' />
          <SelectFormGroup
            eRef={equivalenceUnitRef}
            label='Unidad equivalente'
            col='col-md-3'
            dropdownParent='#article-form-container'
            value={selectedEquivalenceUnitId}
            onChange={(e) => setSelectedEquivalenceUnitId(e.target.value)}
            effectWith={[selectedEquivalenceUnitId, units.length]}
          >
            <option value=''>Seleccionar...</option>
            {units.map(unit => (
              <option key={`equivalence-unit-${unit.id}`} value={unit.id}>
                {unit.name}{unit.symbol ? ` (${unit.symbol})` : ''}
              </option>
            ))}
          </SelectFormGroup>
          <InputFormGroup eRef={salePriceNationalRef} label='P. venta (M.N)' col='col-md-3' type='number' min='0' step='0.01' />
          <InputFormGroup eRef={purchasePriceNationalRef} label='P. compra (M.N)' col='col-md-3' type='number' min='0' step='0.01' />
          <InputFormGroup eRef={purchasePriceForeignRef} label='P. compra (M.E)' col='col-md-3' type='number' min='0' step='0.01' />
        </>}

        {!isMagistrales && <TextareaFormGroup eRef={notesRef} label='Observaciones' col='col-12' rows={3} />}

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
        <div className='form-group mb-2'>
          <label className='form-label'>Pais</label>
          <select ref={newManufacturerCountryRef} className='form-control' defaultValue={manufacturerCountryOptions[0]} required>
            {manufacturerCountryOptions.map(country => (
              <option key={`manufacturer-country-${country}`} value={country}>{country}</option>
            ))}
          </select>
        </div>
        <div className='form-group mb-2'>
          <label className='form-label'>Estado</label>
          <select ref={newManufacturerStatusRef} className='form-control' defaultValue='1' required>
            <option value='1'>Activo</option>
            <option value='0'>Inactivo</option>
          </select>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={importModalRef}
      title='Importacion masiva de articulos'
      onSubmit={onImportSubmit}
      size='xl'
      btnSubmitText={isImporting ? 'Importando...' : 'Importar'}
    >
      <div className='row'>
        <div className='col-12 mb-3'>
          <label className='form-label'>Archivo (JSON, XLSX, XLS o CSV)</label>
          <input
            ref={importFileRef}
            type='file'
            className='form-control'
            accept='.xlsx,.xls,.csv,.json'
            onChange={onImportFileChanged}
          />
          {importFileName && <div className='mt-1'><small className='text-muted'>Archivo: {importFileName} ({importRows.length} filas)</small></div>}
        </div>

        <div className='col-md-4 mb-2'>
          <label className='form-label'>Codigo *</label>
          <select className='form-control' value={mapping.code} onChange={(e) => setMapping(prev => ({ ...prev, code: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`code-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Descripcion</label>
          <select className='form-control' value={mapping.name} onChange={(e) => setMapping(prev => ({ ...prev, name: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`name-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Laboratorio</label>
          <select className='form-control' value={mapping.laboratory} onChange={(e) => setMapping(prev => ({ ...prev, laboratory: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`lab-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Principio activo</label>
          <select className='form-control' value={mapping.active_principle} onChange={(e) => setMapping(prev => ({ ...prev, active_principle: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`principle-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Unidad</label>
          <select className='form-control' value={mapping.unit} onChange={(e) => setMapping(prev => ({ ...prev, unit: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`unit-${header}`} value={header}>{header}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Estado</label>
          <select className='form-control' value={mapping.status} onChange={(e) => setMapping(prev => ({ ...prev, status: e.target.value }))}>
            <option value=''>Seleccionar...</option>
            {importHeaders.map(header => <option key={`status-${header}`} value={header}>{header}</option>)}
          </select>
        </div>

        <div className='col-12 mt-3'>
          <h6 className='mb-2'>Vista previa (primeras 5 filas)</h6>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Codigo</th>
                  <th>Descripcion</th>
                  <th>Laboratorio</th>
                  <th>Principio activo</th>
                  <th>Unidad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className='text-center text-muted'>Sin datos para previsualizar</td>
                  </tr>
                )}
                {previewRows.map(item => (
                  <tr key={`preview-${item.row}`}>
                    <td>{item.row}</td>
                    <td>{item.code?.toString?.() ?? ''}</td>
                    <td>{item.name?.toString?.() ?? ''}</td>
                    <td>{item.laboratory?.toString?.() ?? ''}</td>
                    <td>{item.principle?.toString?.() ?? ''}</td>
                    <td>{item.unit?.toString?.() ?? ''}</td>
                    <td>{item.status?.toString?.() ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={principleCreateModalRef}
      title='Agregar principio activo'
      onSubmit={onCreatePrincipleSubmit}
      size='md'
    >
      <InputFormGroup eRef={newPrincipleNameRef} label='Nombre del principio activo' col='col-12' required />
      <small className='text-muted'>Se asociara al laboratorio actualmente seleccionado.</small>
    </Modal>

    <Modal
      modalRef={unitCreateModalRef}
      title='Agregar unidad de medida'
      onSubmit={onCreateUnitSubmit}
      size='md'
    >
      <div className='row'>
        <InputFormGroup eRef={newUnitNameRef} label='Nombre' col='col-md-8' required />
        <InputFormGroup eRef={newUnitSymbolRef} label='Simbolo' col='col-md-4' required />
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can(scopedPermission('articles')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Articulos'}>
    <Articles {...properties} />
  </BaseAdminto>);
})
