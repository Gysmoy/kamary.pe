import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
import ExitNotesRest from '../Actions/Admin/ExitNotesRest';
import { isStoragePath, scopedPermission } from '../Utils/permissionScope';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';

const exitNotesRest = new ExitNotesRest()

const toDateInput = (value) => {
  if (!value) return ''
  return `${value}`.slice(0, 10)
}

const todayInput = () => new Date().toISOString().slice(0, 10)

const normalizeSearchText = (value) => `${value ?? ''}`
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

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

const clientLabel = (client) => {
  if (!client) return ''
  return [client.document_number, client.full_name || client.business_name || client.display_name].filter(Boolean).join(' - ')
}

const clientRealId = (client) => {
  if (!client) return ''
  if (client.entity_id) return `${client.entity_id}`
  const rawId = `${client.id ?? ''}`.trim()
  const match = rawId.match(/^client-(\d+)$/i)
  return match ? match[1] : rawId
}

const clientDocumentNumber = (client) => `${client?.document_number ?? ''}`.replace(/\D+/g, '')

const extractDocumentNumber = (value) => {
  const match = `${value ?? ''}`.match(/\b\d{8,11}\b/)
  return match ? match[0] : ''
}

const normalizeClientSelectionValue = (value) => {
  const text = `${value ?? ''}`.trim()
  const match = text.match(/^client-(\d+)$/i)
  if (match) return match[1]
  if (/^\d+$/.test(text) && text.length < 8) return text
  return ''
}

const warehouseBusinessId = (warehouse) => warehouse?.branch?.business_id || warehouse?.branch?.business?.id || ''
const warehouseBranchId = (warehouse) => warehouse?.business_branch_id || warehouse?.branch?.id || ''

const documentOptions = ['Guia Remision', 'Factura', 'Boleta', 'Nota de salida interna']
const motiveOptions = ['Despacho', 'Traslado interno', 'Retiro de producto', 'Muestra', 'Ajuste de inventario', 'Otro']

const exitStatusLabel = (status) => {
  if (status === 'approved') return 'Aprobado'
  if (status === 'cancelled') return 'Anulado'
  return 'En espera'
}

const exitStatusClass = (status) => {
  if (status === 'approved') return 'badge bg-soft-info text-info border border-info'
  if (status === 'cancelled') return 'badge bg-soft-danger text-danger border border-danger'
  return 'badge bg-soft-warning text-warning border border-warning'
}

const combineFilters = (filters) => {
  const active = filters.filter(Boolean)
  if (active.length === 0) return null
  return active.reduce((carry, filter) => carry ? [carry, 'and', filter] : filter, null)
}

const storageDestinationLabel = (data) => [...new Set((data?.items ?? [])
  .map(item => item?.destination_location)
  .filter(Boolean))]
  .join(', ')

const storageMotivesLabel = (data) => (data?.motives ?? []).join(', ')

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  batch_id: '',
  batch_label: '',
  batch_code: '',
  lot: '',
  health_registration: '',
  article_id: '',
  article_label: '',
  article_laboratory: '',
  article_principle: '',
  article_unit: '',
  warehouse_id: '',
  warehouse_name: '',
  stock: 0,
  expiration_date: '',
  location: '',
  destination_location: '',
  quantity: 0,
  total: 0,
})

const ExitNotes = () => {
  const storageContext = isStoragePath()
  const tableRef = useRef()
  const modalRef = useRef()
  const stockSearchModalRef = useRef()
  const stockSearchTextRef = useRef()

  const idRef = useRef()
  const clientNameRef = useRef()
  const observationsRef = useRef()
  const motiveInputRef = useRef()
  const exitDateRef = useRef()
  const documentSeriesRef = useRef()
  const documentSequenceRef = useRef()
  const documentDateRef = useRef()
  // Cache de filas crudas devueltas por el loadOptions async de cada picker (por uid de fila).
  // VdSelect en modo async solo entrega el `value` elegido en onChange (no el registro completo
  // como hacia select2 con `.select2('data')`), asi que guardamos aqui lo ultimo que devolvio
  // el backend para poder resolver relaciones (article, laboratory, activePrinciple, unit) al
  // elegir una opcion, igual que antes.
  const articleOptionsCacheRef = useRef({})
  const batchOptionsCacheRef = useRef({})

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [storageClients, setStorageClients] = useState([])
  const [items, setItems] = useState(storageContext ? [] : [emptyItem()])
  const [motives, setMotives] = useState([])
  const [documentTypeValue, setDocumentTypeValue] = useState('')
  const [motiveSelectValue, setMotiveSelectValue] = useState('')
  const [storageFilterClientId, setStorageFilterClientId] = useState('')
  const [storageFilterStartDate, setStorageFilterStartDate] = useState('')
  const [storageFilterEndDate, setStorageFilterEndDate] = useState('')
  const [storageGridFilter, setStorageGridFilter] = useState(null)
  const [stockSearchWarehouseId, setStockSearchWarehouseId] = useState('')
  const [stockSearchTerm, setStockSearchTerm] = useState('')
  const [stockSearchRows, setStockSearchRows] = useState([])
  const [stockSearchSelectedIds, setStockSearchSelectedIds] = useState([])
  const [stockSearchFilter, setStockSearchFilter] = useState('')
  const [stockSearchPage, setStockSearchPage] = useState(1)
  const [stockSearchPageSize, setStockSearchPageSize] = useState(20)
  const [stockSearchLoading, setStockSearchLoading] = useState(false)

  useEffect(() => {
    if (!storageContext) return
    loadWarehouses()
    loadStorageClients()
  }, [])

  // VdTable no re-consulta automaticamente cuando cambia baseFilter (a diferencia del
  // filterValue reactivo de dxDataGrid), asi que forzamos el refresh cuando el filtro
  // de la cabecera (cliente/fechas) cambia.
  useEffect(() => {
    if (!storageContext) return
    tableRef.current?.refresh()
  }, [storageGridFilter])

  const loadWarehouses = async () => {
    const warehousesData = await exitNotesRest.getWarehouses()
    const active = (warehousesData ?? []).filter(item => item.status !== null)
    setWarehouses(active)
    return active
  }

  const loadStorageClients = async () => {
    const clientsData = await exitNotesRest.getClients()
    setStorageClients(clientsData ?? [])
    return clientsData ?? []
  }

  const loadBranches = async (businessId, preferredId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
      return []
    }
    const data = await exitNotesRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return active
    }
    setSelectedBranchId('')
    return active
  }

  const syncWarehouseContext = async (warehouseId, sourceWarehouses = warehouses) => {
    const warehouse = sourceWarehouses.find(item => `${item.id}` === `${warehouseId}`)
    const businessId = warehouseBusinessId(warehouse)
    const branchId = warehouseBranchId(warehouse)
    setSelectedBusinessId(businessId ? `${businessId}` : '')
    setSelectedBranchId(branchId ? `${branchId}` : '')
    if (businessId) await loadBranches(businessId, branchId)
  }

  const onStorageWarehouseChanged = async (value) => {
    const warehouseId = value || ''
    setSelectedWarehouseId(warehouseId)
    await syncWarehouseContext(warehouseId)
  }

  // Antes usaba SelectAPIFormGroup (select2 + ajax) y leia el almacen elegido desde
  // e.target/select2('data'). VdSelect entrega el value directo y las opciones salen
  // de la lista `warehouses` ya cargada (mismo endpoint /api/admin/warehouses/paginate
  // que usaba el ajax), asi que reutilizamos syncWarehouseContext tal cual lo hace
  // onStorageWarehouseChanged.
  const onWarehouseChanged = async (value) => {
    const warehouseId = value || ''
    setSelectedWarehouseId(warehouseId)
    await syncWarehouseContext(warehouseId, warehouses)
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)

    if (idRef.current) idRef.current.value = data?.id ?? ''
    if (clientNameRef.current) clientNameRef.current.value = data?.client_name ?? ''
    if (observationsRef.current) observationsRef.current.value = data?.observations ?? ''
    if (exitDateRef.current) exitDateRef.current.value = toDateInput(data?.exit_date) || todayInput()
    setDocumentTypeValue(data?.document_type ?? '')
    if (documentSeriesRef.current) documentSeriesRef.current.value = data?.document_series ?? ''
    if (documentSequenceRef.current) documentSequenceRef.current.value = data?.document_sequence ?? ''
    if (documentDateRef.current) documentDateRef.current.value = toDateInput(data?.document_date) || todayInput()
    setMotives(Array.isArray(data?.motives) ? data.motives : [])
    setSelectedClientId(data?.client_id ? `${data.client_id}` : '')

    const currentWarehouses = warehouses.length ? warehouses : await loadWarehouses()
    const businessId = data?.business_id ? `${data.business_id}` : ''
    const warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : (storageContext && currentWarehouses[0]?.id ? `${currentWarehouses[0].id}` : '')

    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)

    if (storageContext) {
      await syncWarehouseContext(warehouseId, currentWarehouses)
    } else {
      // El Almacen ahora es un VdSelect controlado por selectedWarehouseId (ya
      // seteado arriba) contra la lista `warehouses`; no requiere sincronizar el DOM.
      await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
    }

    const detail = (data?.items ?? []).map(row => ({
      uid: crypto.randomUUID(),
      batch_id: row.batch_code ?? '',
      batch_label: row.batch_code ?? '',
      batch_code: row.batch_code ?? '',
      lot: row.batch_code ?? '',
      health_registration: row.article?.health_registration ?? '',
      article_id: row.article_id ? `${row.article_id}` : '',
      article_label: row.article ? `${row.article.code ?? ''} - ${row.article.name ?? ''}`.trim() : '',
      article_laboratory: row.article?.laboratory?.name ?? '',
      article_principle: row.article?.activePrinciple?.name ?? row.article?.active_principle?.name ?? '',
      article_unit: row.article?.unit?.symbol ?? row.article?.unit?.name ?? '',
      warehouse_id: row.warehouse_id ? `${row.warehouse_id}` : '',
      warehouse_name: row.warehouse?.name ?? '',
      stock: row.stock ?? 0,
      expiration_date: row.expiration_date ? row.expiration_date.toString().slice(0, 10) : '',
      location: row.location ?? '',
      destination_location: row.destination_location ?? '',
      quantity: row.quantity ?? 0,
      total: row.total ?? row.quantity ?? 0,
    }))
    setItems(detail.length ? detail : (storageContext ? [] : [emptyItem()]))

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    // Los selects de Cliente/Almacen/Tipo de documento ya no son <select required>
    // nativos (ahora son VdSelect, que no participa de la validacion HTML5), asi que
    // validamos a mano lo que antes garantizaba el atributo required.
    if (storageContext) {
      if (!selectedClientId) {
        await Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona el cliente.' })
        return
      }
      if (!selectedWarehouseId) {
        await Swal.fire({ icon: 'warning', title: 'Almacen requerido', text: 'Selecciona el almacen.' })
        return
      }
      if (!documentTypeValue) {
        await Swal.fire({ icon: 'warning', title: 'Tipo de documento requerido', text: 'Selecciona el tipo de documento.' })
        return
      }
    } else if (!selectedWarehouseId) {
      await Swal.fire({ icon: 'warning', title: 'Almacen requerido', text: 'Selecciona el almacen.' })
      return
    }

    // selectedClientId ya queda sincronizado por el onChange del VdSelect, asi que
    // el cliente elegido se resuelve directo desde el estado (antes se leia del DOM
    // del <select> nativo).
    const rawClientValue = storageContext ? `${selectedClientId || ''}` : ''
    const selectedClient = storageContext
      ? storageClients.find(client => clientRealId(client) === rawClientValue || `${client.id ?? ''}` === rawClientValue)
      : null
    const selectedDocumentNumber = selectedClient ? clientDocumentNumber(selectedClient) : extractDocumentNumber(rawClientValue)
    const currentClientId = storageContext
      ? (selectedClient ? clientRealId(selectedClient) : normalizeClientSelectionValue(rawClientValue))
      : ''
    const selectedClientText = storageContext
      ? (selectedClient ? clientLabel(selectedClient) : '')
      : ''
    const request = {
      id: idRef.current.value || undefined,
      business_id: (storageContext || selectedBusinessId) ? (selectedBusinessId || null) : undefined,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      client_id: storageContext ? currentClientId || null : undefined,
      client_document_number: storageContext ? (selectedClient ? clientDocumentNumber(selectedClient) : selectedDocumentNumber) || undefined : undefined,
      client_name: storageContext ? selectedClientText : (clientNameRef.current.value ?? '').trim(),
      exit_date: storageContext ? exitDateRef.current?.value || null : undefined,
      document_type: storageContext ? documentTypeValue.trim() : undefined,
      document_series: storageContext ? (documentSeriesRef.current?.value ?? '').trim() : undefined,
      document_sequence: storageContext ? (documentSequenceRef.current?.value ?? '').trim() : undefined,
      document_date: storageContext ? documentDateRef.current?.value || null : undefined,
      motives,
      observations: (observationsRef.current?.value ?? '').trim(),
      items: items.map(item => ({
        batch_code: (item.batch_code ?? item.lot ?? '').toString().trim(),
        lot: (item.lot ?? item.batch_code ?? '').toString().trim(),
        article_id: item.article_id || null,
        warehouse_id: item.warehouse_id || selectedWarehouseId || null,
        stock: item.stock,
        expiration_date: item.expiration_date || null,
        location: (item.location ?? '').toString().trim(),
        destination_location: (item.destination_location ?? '').toString().trim(),
        quantity: item.quantity,
        total: item.total,
        status: true,
      }))
    }

    const result = await exitNotesRest.save(request)
    if (!result) return

    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async (data) => {
    const activating = !data.status
    const { isConfirmed } = await Swal.fire({
      title: activating ? 'Activar nota de salida' : 'Desactivar nota de salida',
      text: activating
        ? 'Se validara que exista stock disponible para todos los lotes.'
        : 'La nota dejara de descontar stock mientras este desactivada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activating ? 'Si, activar' : 'Si, desactivar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await exitNotesRest.status({ id: data.id, status: data.status ? 1 : 0 })
    if (!result) return
    tableRef.current?.refresh()
  }

  const onExitStatusChange = async (data, nextStatus) => {
    const approving = nextStatus === 'approved'
    const cancelling = nextStatus === 'cancelled'
    const { isConfirmed } = await Swal.fire({
      title: approving ? 'Aprobar nota de salida' : 'Anular nota de salida',
      text: approving
        ? 'La nota aprobada descontara el stock disponible.'
        : 'La nota anulada dejara de afectar el stock.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: approving ? 'Si, aprobar' : 'Si, anular',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await exitNotesRest.setExitStatus(data.id, cancelling ? 'cancelled' : 'approved')
    if (!result) return
    tableRef.current?.refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar nota de salida',
      text: 'Estas seguro de eliminar esta nota de salida? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await exitNotesRest.delete(id)
    if (!result) return
    tableRef.current?.refresh()
  }

  const addMotive = () => {
    const value = storageContext
      ? (motiveSelectValue ?? '').trim()
      : (motiveInputRef.current?.value ?? '').trim()
    if (!value || motives.includes(value)) return
    setMotives(prev => [...prev, value])
    if (storageContext) setMotiveSelectValue('')
    if (!storageContext && motiveInputRef.current) motiveInputRef.current.value = ''
  }

  const removeMotive = (index) => setMotives(prev => prev.filter((_, i) => i !== index))

  const onItemUpdated = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (`${item[field] ?? ''}` === `${value ?? ''}`) return item
      const next = { ...item, [field]: value }
      const quantity = Number(next.quantity || 0)
      const total = Number(next.total || 0)
      next.total = Number.isFinite(total) && total > 0 ? total : quantity
      return next
    }))
  }

  // Antes leia el registro elegido desde `$(e.target).select2('data')` (evento nativo de
  // select2). VdSelect async solo entrega el `value` en su onChange, asi que resolvemos el
  // mismo objeto crudo (con la relacion `article` y sus relaciones anidadas) desde el cache
  // que llena el `loadOptions` del picker de esta fila.
  const onItemBatchSelected = (uid, batchId) => {
    const batch = batchId ? (batchOptionsCacheRef.current[uid]?.[batchId] ?? null) : null

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (!batchId) {
        return {
          ...item,
          batch_id: '',
          batch_label: '',
          batch_code: '',
          lot: '',
          expiration_date: '',
          article_id: '',
          article_label: '',
          article_laboratory: '',
          article_principle: '',
          article_unit: '',
        }
      }
      if (!batch) {
        return {
          ...item,
          batch_id: batchId,
          batch_label: batchId,
          batch_code: batchId,
          lot: batchId,
        }
      }

      const article = batch.article ?? null
      const nextArticleId = article?.id ? `${article.id}` : item.article_id
      return {
        ...item,
        batch_id: batchId,
        batch_label: batch.lot ?? item.batch_label,
        batch_code: batch.lot ?? item.batch_code,
        lot: batch.lot ?? item.lot,
        expiration_date: batch.expiration_date ? batch.expiration_date.toString().slice(0, 10) : item.expiration_date,
        article_id: nextArticleId,
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : item.article_label,
        article_laboratory: article?.laboratory?.name ?? item.article_laboratory,
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? item.article_principle,
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? item.article_unit,
      }
    }))
  }

  // Igual que onItemBatchSelected: VdSelect async solo entrega el `value`, asi que resolvemos
  // el articulo elegido desde el cache que llena el `loadOptions` del picker de esta fila.
  const onItemArticleSelected = (uid, articleId) => {
    const article = articleId ? (articleOptionsCacheRef.current[uid]?.[articleId] ?? null) : null
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      if (!articleId) {
        return {
          ...item,
          batch_id: '',
          batch_label: '',
          batch_code: '',
          lot: '',
          article_id: '',
          article_label: '',
          article_laboratory: '',
          article_principle: '',
          article_unit: '',
        }
      }
      return {
        ...item,
        batch_id: item.article_id && item.article_id !== articleId ? '' : item.batch_id,
        batch_label: item.article_id && item.article_id !== articleId ? '' : item.batch_label,
        batch_code: item.article_id && item.article_id !== articleId ? '' : item.batch_code,
        lot: item.article_id && item.article_id !== articleId ? '' : item.lot,
        article_id: articleId,
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : (item.article_label || articleId),
        article_laboratory: article?.laboratory?.name ?? item.article_laboratory,
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? item.article_principle,
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? item.article_unit,
      }
    }))
  }

  const onCreateBatchForItem = async (uid) => {
    const currentItem = items.find(item => item.uid === uid)
    if (storageContext && !selectedBusinessId) {
      await Swal.fire({ icon: 'warning', title: 'Empresa requerida', text: 'No se pudo determinar la empresa del modulo de almacenamiento' })
      return
    }
    if (!currentItem?.article_id) {
      await Swal.fire({ icon: 'warning', title: 'Articulo requerido', text: 'Selecciona un articulo antes de crear un lote' })
      return
    }

    const { value: formValues } = await Swal.fire({
      title: 'Crear lote',
      html: `
        <input id="swal-exit-batch-lot" class="swal2-input" placeholder="Lote" />
        <input id="swal-exit-batch-exp" type="date" class="swal2-input" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const lot = document.getElementById('swal-exit-batch-lot')?.value?.trim() || ''
        const expiration = document.getElementById('swal-exit-batch-exp')?.value || ''
        if (!lot) {
          Swal.showValidationMessage('El lote es obligatorio')
          return null
        }
        if (!expiration) {
          Swal.showValidationMessage('La fecha de vencimiento es obligatoria')
          return null
        }
        return { lot, expiration }
      }
    })

    if (!formValues) return
    if (storageContext && !selectedBusinessId) return

    const request = {
      article_id: currentItem.article_id,
      lot: formValues.lot,
      expiration_date: formValues.expiration,
    }
    if (selectedBusinessId) request.business_id = selectedBusinessId

    const createdBatch = await exitNotesRest.createBatch(request)
    if (!createdBatch?.id) return

    setItems(prev => prev.map(item => item.uid === uid ? {
      ...item,
      batch_id: `${createdBatch.id}`,
      batch_label: createdBatch.lot ?? formValues.lot,
      batch_code: createdBatch.lot ?? formValues.lot,
      lot: createdBatch.lot ?? formValues.lot,
      expiration_date: createdBatch.expiration_date ? createdBatch.expiration_date.toString().slice(0, 10) : formValues.expiration,
    } : item))
  }

  const openStockSearchModal = async () => {
    if (!selectedClientId) {
      await Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona el cliente antes de insertar productos.' })
      return
    }
    if (!selectedWarehouseId) {
      await Swal.fire({ icon: 'warning', title: 'Almacen requerido', text: 'Selecciona el almacen antes de insertar productos.' })
      return
    }
    setStockSearchWarehouseId(selectedWarehouseId)
    setStockSearchTerm('')
    setStockSearchRows([])
    setStockSearchSelectedIds([])
    setStockSearchFilter('')
    setStockSearchPage(1)
    $(stockSearchModalRef.current).modal('show')
    setTimeout(() => stockSearchTextRef.current?.focus(), 250)
  }

  const searchAvailableStockRows = async () => {
    const warehouseId = stockSearchWarehouseId || selectedWarehouseId
    const clientId = selectedClientId
    if (!clientId) {
      await Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Selecciona el cliente para buscar stock.' })
      return
    }
    if (!warehouseId) {
      await Swal.fire({ icon: 'warning', title: 'Almacen requerido', text: 'Selecciona el almacen para buscar stock.' })
      return
    }

    setStockSearchLoading(true)
    try {
      const rows = await exitNotesRest.getAvailableStock({
        warehouseId,
        clientId,
        search: stockSearchTerm,
        exitNoteId: idRef.current?.value || ''
      })
      setStockSearchRows(rows ?? [])
      setStockSearchSelectedIds([])
      setStockSearchPage(1)
    } finally {
      setStockSearchLoading(false)
    }
  }

  const toggleStockSearchRow = (rowId, checked) => {
    setStockSearchSelectedIds(prev => {
      if (checked) return prev.includes(rowId) ? prev : [...prev, rowId]
      return prev.filter(id => id !== rowId)
    })
  }

  const addSelectedStockRows = async () => {
    const selectedRows = stockSearchRows.filter(row => stockSearchSelectedIds.includes(row.id))
    if (selectedRows.length === 0) {
      await Swal.fire({ icon: 'warning', title: 'Selecciona productos', text: 'Marca al menos un lote para insertarlo en la nota.' })
      return
    }

    setItems(prev => {
      const currentRows = prev.filter(item => item.article_id || item.batch_code || item.lot)
      const existing = new Set(currentRows.map(item => [
        item.article_id,
        item.warehouse_id || selectedWarehouseId,
        selectedClientId,
        item.lot || item.batch_code,
        item.expiration_date,
        item.location,
      ].join('|')))
      const nextRows = selectedRows
        .filter(row => !existing.has([
          row.article_id,
          row.warehouse_id || stockSearchWarehouseId || selectedWarehouseId,
          row.client_id || selectedClientId,
          row.lot,
          row.expiration_date,
          row.location,
        ].join('|')))
        .map(row => ({
          ...emptyItem(),
          batch_id: row.lot,
          batch_label: row.lot,
          batch_code: row.lot,
          lot: row.lot,
          health_registration: row.health_registration ?? '',
          article_id: row.article_id ? `${row.article_id}` : '',
          article_label: [row.article_code, row.article_name].filter(Boolean).join(' - '),
          article_laboratory: row.laboratory_name ?? '',
          article_principle: row.principle_name ?? '',
          article_unit: row.unit_label ?? '',
          warehouse_id: row.warehouse_id ? `${row.warehouse_id}` : (stockSearchWarehouseId || selectedWarehouseId),
          warehouse_name: row.warehouse_name ?? '',
          stock: row.stock ?? 0,
          expiration_date: toDateInput(row.expiration_date),
          location: row.location ?? '',
          destination_location: '',
          quantity: 0,
          total: 0,
        }))
      return [...currentRows, ...nextRows]
    })
    $(stockSearchModalRef.current).modal('hide')
  }

  const onItemAdded = () => setItems(prev => [...prev, emptyItem()])
  const onItemRemoved = (uid) => {
    setItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : (storageContext ? [] : [emptyItem()])
    })
  }

  const applyStorageFilter = () => {
    setStorageGridFilter(combineFilters([
      storageFilterClientId ? ['client_id', '=', Number(storageFilterClientId)] : null,
      storageFilterStartDate ? ['exit_date', '>=', storageFilterStartDate] : null,
      storageFilterEndDate ? ['exit_date', '<=', storageFilterEndDate] : null,
    ]))
  }

  const storageQuantityTotal = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const stockSearchFilterNeedle = normalizeSearchText(stockSearchFilter)
  const stockSearchFilteredRows = stockSearchFilterNeedle
    ? stockSearchRows.filter(row => normalizeSearchText([
      row.location,
      row.stock,
      row.lot,
      row.health_registration,
      row.expiration_date,
      row.article_code,
      row.article_name,
      row.unit_label,
    ].join(' ')).includes(stockSearchFilterNeedle))
    : stockSearchRows
  const stockSearchTotalPages = Math.max(1, Math.ceil(stockSearchFilteredRows.length / stockSearchPageSize))
  const stockSearchCurrentPage = Math.min(stockSearchPage, stockSearchTotalPages)
  const stockSearchStart = (stockSearchCurrentPage - 1) * stockSearchPageSize
  const stockSearchPageRows = stockSearchFilteredRows.slice(stockSearchStart, stockSearchStart + stockSearchPageSize)
  const allStockSearchPageSelected = stockSearchPageRows.length > 0 && stockSearchPageRows.every(row => stockSearchSelectedIds.includes(row.id))
  const toggleStockSearchPage = (checked) => {
    const pageIds = stockSearchPageRows.map(row => row.id)
    setStockSearchSelectedIds(prev => checked
      ? [...new Set([...prev, ...pageIds])]
      : prev.filter(id => !pageIds.includes(id)))
  }

  // Botones de accion por fila. En el modulo de almacenamiento cambian segun el
  // estado de la nota (pending/approved/cancelled); en el modulo comercial son
  // simplemente editar/eliminar.
  const rowActions = (row) => {
    if (storageContext) {
      const status = row?.exit_status ?? 'pending'
      if (status === 'pending') {
        return [
          { icon: 'mdi mdi-check-bold', title: 'Aprobar nota de salida', bg: '#e9f9ef', color: '#1bc47d', onClick: (r) => onExitStatusChange(r, 'approved') },
          { icon: 'mdi mdi-pencil', title: 'Editar nota de salida', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
          { icon: 'mdi mdi-close', title: 'Anular nota de salida', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onExitStatusChange(r, 'cancelled') },
          { icon: 'mdi mdi-file-pdf-box', title: 'PDF nota de salida', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => openMagistralesRecordPdf(buildMagistralesRows.storageExitNote(r)) },
        ]
      }
      return [
        { icon: 'mdi mdi-menu', title: 'Detalle nota de salida', bg: '#fff4e5', color: '#f1a325', onClick: (r) => onModalOpen(r) },
        { icon: 'mdi mdi-eye', title: 'Ver nota de salida', bg: '#e7f6fb', color: '#17a2b8', onClick: (r) => openMagistralesRecordPdf(buildMagistralesRows.storageExitNote(r)) },
        { icon: 'mdi mdi-file-pdf-box', title: 'PDF nota de salida', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => openMagistralesRecordPdf(buildMagistralesRows.storageExitNote(r)) },
      ]
    }
    return [
      { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
      { icon: 'mdi mdi-delete', title: 'Eliminar nota de salida', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
    ]
  }

  const storageVdColumns = [
    {
      key: 'codigo', label: 'Codigo', field: 'code', width: '185px', filter: { type: 'text' },
      render: (row) => (
        <a className='admin-grid-edit-link' style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title='Editar nota de salida'>
          {row.code || `NS${`${row.id ?? ''}`.padStart(5, '0')}`}
        </a>
      ),
    },
    { key: 'cliente', label: 'Cliente', field: 'client_name', filter: { type: 'text' } },
    { key: 'almacen', label: 'Almacen origen', field: 'warehouse.name', sortable: false, filter: { type: 'text', field: 'warehouse.name' } },
    { key: 'destino', label: 'Destino', sortable: false, render: (row) => storageDestinationLabel(row) },
    { key: 'motivo', label: 'Motivo', sortable: false, render: (row) => storageMotivesLabel(row) },
    { key: 'tipo_documento', label: 'Tipo de documento', field: 'document_type', filter: { type: 'text' } },
    { key: 'serie', label: 'Serie', field: 'document_series', filter: { type: 'text' } },
    { key: 'secuencia', label: 'Secuencia', field: 'document_sequence', filter: { type: 'text' } },
    { key: 'fecha_salida', label: 'Fecha salida', field: 'exit_date', filter: { type: 'date' }, render: (row) => toDateInput(row.exit_date), nowrap: true },
    { key: 'usuario_registro', label: 'Usuario registro', field: 'creator.fullname', sortable: false, render: (row) => formatAuditUser(row.creator) },
    { key: 'fecha_registro', label: 'Fecha registro', field: 'created_at', filter: { type: 'date' }, nowrap: true },
    {
      key: 'estado', label: 'Estado', field: 'exit_status', width: '145px',
      filter: { type: 'select', field: 'exit_status', options: [{ value: 'pending', label: 'En espera' }, { value: 'approved', label: 'Aprobado' }, { value: 'cancelled', label: 'Anulado' }] },
      render: (row) => <span className={exitStatusClass(row?.exit_status)}>{exitStatusLabel(row?.exit_status)}</span>,
    },
  ]

  const standardVdColumns = [
    {
      key: 'sede', label: 'Sede', field: 'branch.name', filter: { type: 'text', field: 'branch.name' },
      render: (row) => (
        <a className='admin-grid-edit-link' style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title='Editar nota de salida'>
          {row.branch?.name}
        </a>
      ),
    },
    { key: 'almacen', label: 'Almacen', field: 'warehouse.name', filter: { type: 'text', field: 'warehouse.name' } },
    { key: 'cliente', label: 'Cliente', field: 'client_name', filter: { type: 'text' } },
    { key: 'motivos', label: 'Motivos', sortable: false, render: (row) => (row?.motives ?? []).join(', ') },
    {
      key: 'detalle', label: 'Detalle', sortable: false,
      render: (row) => {
        const lines = (row?.items ?? []).map(item => `${item?.article?.name || 'Articulo'} | Cant. ${Number(item?.quantity || 0).toFixed(2)} | Total ${Number(item?.total || 0).toFixed(2)}`)
        return (<div>
          {lines.length === 0 && <small className='text-muted'>Sin detalle</small>}
          {lines.map((line, idx) => <div key={`exit-note-${row.id}-${idx}`}><small>{line}</small></div>)}
        </div>)
      },
    },
    { key: 'creado_por', label: 'Creado por', field: 'creator.fullname', visible: false, sortable: false, render: (row) => formatAuditUser(row.creator) },
    { key: 'actualizado_por', label: 'Actualizado por', field: 'updater.fullname', visible: false, sortable: false, render: (row) => formatAuditUser(row.updater) },
    {
      key: 'estado', label: 'Estado', field: 'status', width: '95px',
      filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
      render: (row) => {
        if (row.status === null) return ''
        return <SwitchFormGroup noMargin checked={row.status == 1} onChange={() => onStatusChange(row)} />
      },
    },
  ]

  return (<>
    {storageContext && <>
      <style>{`
        .storage-exit-modal { border-radius: 0; }
        .storage-exit-modal-header { background: #272954; color: #fff; padding: 0.45rem 1rem; }
        .storage-exit-modal-header .modal-title { color: #fff; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
        .storage-exit-dialog { width: calc(100vw - 24px); max-width: calc(100vw - 24px); }
        .storage-exit-form label { font-size: 0.78rem; color: #30384d; margin-bottom: 0.25rem; }
        .storage-exit-form .form-control, .storage-exit-form .form-select { min-height: 28px; border-radius: 0; font-size: 0.78rem; padding: 0.25rem 0.55rem; }
        .storage-exit-form .btn { border-radius: 0; font-weight: 700; font-size: 0.74rem; }
        .storage-exit-form table th { font-size: 0.72rem; color: #30384d; text-transform: uppercase; vertical-align: middle; }
        .storage-exit-form table td { vertical-align: middle; }
        .storage-exit-toolbar { border-bottom: 1px solid #e4e7ec; padding: 1.1rem 0 1rem; }
        .storage-exit-total-label { font-style: italic; font-weight: 700; text-align: right; }
        .storage-exit-actions { display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; min-width: max-content; }
        .storage-exit-actions .btn { flex: 0 0 auto; margin-right: 0 !important; }
        .storage-exit-lines-wrap { border: 1px solid #e3e8ef; border-radius: 6px; overflow: auto; }
        .storage-exit-lines { min-width: 1560px; }
        .storage-exit-lines th { color: #30364d; font-size: 0.74rem; text-transform: uppercase; white-space: nowrap; }
        .storage-exit-lines td { vertical-align: middle; }
      `}</style>
      <div className='card mb-3'>
        <div className='card-body'>
          <div className='row align-items-end g-3'>
            <VdSelect
              label='Cliente'
              col='col-md-4'
              value={storageFilterClientId}
              onChange={(value) => setStorageFilterClientId(value)}
              options={storageClients.map(client => ({ value: clientRealId(client), label: clientLabel(client) }))}
              placeholder='Seleccione'
            />
            <div className='col-md-3'>
              <label className='form-label'>Fecha inicio</label>
              <input className='form-control' type='date' value={storageFilterStartDate} onChange={(e) => setStorageFilterStartDate(e.target.value)} />
            </div>
            <div className='col-md-3'>
              <label className='form-label'>Fecha fin</label>
              <input className='form-control' type='date' value={storageFilterEndDate} onChange={(e) => setStorageFilterEndDate(e.target.value)} />
            </div>
            <div className='col-md-2'>
              <button type='button' className='btn btn-outline-primary w-100' onClick={applyStorageFilter}>
                <i className='mdi mdi-magnify me-1'></i> Buscar notas de salida
              </button>
            </div>
          </div>
        </div>
      </div>
    </>}

    <VdTable
      ref={tableRef}
      rest={exitNotesRest}
      icon='mdi mdi-tray-arrow-up'
      title={storageContext ? 'Nota de salida' : 'Notas de salida'}
      unit='notas de salida'
      defaultPageSize={storageContext ? 10 : 25}
      searchFields={storageContext
        ? ['code', 'client_name', 'warehouse.name', 'document_type', 'document_series', 'document_sequence']
        : ['branch.name', 'warehouse.name', 'client_name']}
      searchPlaceholder='Buscar…'
      emptyText='No se encontraron notas de salida.'
      baseFilter={storageContext ? storageGridFilter : null}
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
        <button type='button' className='vdt-btn-pri' onClick={() => onModalOpen(null)}>
          <i className='mdi mdi-plus'></i> Agregar nota de salida
        </button>
      </>}
      actions={rowActions}
      columns={storageContext ? storageVdColumns : standardVdColumns}
      renderCard={(row, actionButtons) => (
        <div className='vdt-card' onClick={() => onModalOpen(row)}>
          <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>
                {storageContext ? (row.code || `NS${`${row.id ?? ''}`.padStart(5, '0')}`) : (row.branch?.name || `Nota #${row.id}`)}
              </p>
              <small className='text-muted'>{row.client_name}</small>
            </div>
            {storageContext
              ? <span className={exitStatusClass(row?.exit_status)}>{exitStatusLabel(row?.exit_status)}</span>
              : (row.status !== null && <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>)}
          </div>
          <small className='text-muted d-block mt-2'><i className='mdi mdi-warehouse me-1'></i>{row.warehouse?.name}</small>
          {storageContext && <small className='text-muted d-block'>{storageMotivesLabel(row)}</small>}
          {actionButtons && <div className='d-flex flex-wrap mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal
      modalRef={modalRef}
      title={storageContext
        ? <h4 className='modal-title'><i className='mdi mdi-menu me-1'></i> {isEditing ? 'EDITAR NOTA DE SALIDA' : 'REGISTRAR NOTA DE SALIDA'}</h4>
        : (isEditing ? 'Editar nota de salida' : 'Agregar nota de salida')}
      onSubmit={onModalSubmit}
      size='full-width'
      preventEnterSubmit
      hideFooter={storageContext}
      headerClass={storageContext ? 'storage-exit-modal-header' : ''}
      closeButtonClass={storageContext ? 'btn-close-white' : ''}
      contentClass={storageContext ? 'storage-exit-modal' : ''}
      dialogClass={storageContext ? 'storage-exit-dialog' : ''}
      bodyClass={storageContext ? 'storage-exit-form' : ''}
    >
      <div id='exit-note-form-container'>
        <input ref={idRef} type='hidden' />
        {storageContext ? <>
          <div className='storage-exit-toolbar text-center'>
            <button type='submit' className='btn btn-outline-primary me-2'>
              <i className='mdi mdi-plus me-1'></i> Registrar
            </button>
            <button type='button' className='btn btn-light' data-bs-dismiss='modal'>
              <i className='mdi mdi-close me-1'></i> Cerrar
            </button>
          </div>

          <div className='px-2 pt-4'>
            <div className='row g-3'>
              <VdSelect
                label='Cliente'
                col='col-md-3'
                required
                value={selectedClientId}
                onChange={(value) => setSelectedClientId(value)}
                options={storageClients.map(client => ({ value: clientRealId(client), label: clientLabel(client) }))}
                placeholder='Seleccione Cliente'
              />
              <VdSelect
                label='Almacen'
                col='col-md-3'
                required
                value={selectedWarehouseId}
                onChange={onStorageWarehouseChanged}
                options={warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
                placeholder='Seleccione'
              />
              <div className='col-md-2'>
                <label>Fecha salida</label>
                <input ref={exitDateRef} className='form-control' type='date' required />
              </div>
              <div className='col-md-4'>
                <label>Motivos</label>
                <div className='d-flex gap-2'>
                  <div style={{ flex: 1 }}>
                    <VdSelect
                      noMargin
                      value={motiveSelectValue}
                      onChange={(value) => setMotiveSelectValue(value)}
                      options={motiveOptions.map(option => ({ value: option, label: option }))}
                      placeholder='Seleccione motivos'
                    />
                  </div>
                  <button type='button' className='btn btn-light border' onClick={addMotive}>+</button>
                </div>
                {motives.length > 0 && <div className='d-flex flex-wrap gap-1 mt-2'>
                  {motives.map((motive, idx) => (
                    <span key={`motive-${idx}`} className='badge bg-soft-secondary text-dark'>
                      {motive}
                      <button type='button' className='btn btn-link btn-xs p-0 ms-1 text-danger' onClick={() => removeMotive(idx)}>x</button>
                    </span>
                  ))}
                </div>}
              </div>

              <VdSelect
                label='Tipo documento'
                col='col-md-3'
                required
                value={documentTypeValue}
                onChange={(value) => setDocumentTypeValue(value)}
                options={documentOptions.map(option => ({ value: option, label: option }))}
                placeholder='Seleccione'
              />
              <div className='col-md-3'>
                <label>Serie</label>
                <input ref={documentSeriesRef} className='form-control' required />
              </div>
              <div className='col-md-3'>
                <label>Secuencia</label>
                <input ref={documentSequenceRef} className='form-control' required />
              </div>
              <div className='col-md-3'>
                <label>Fecha de documento</label>
                <input ref={documentDateRef} className='form-control' type='date' required />
              </div>
              <div className='col-12'>
                <label>Observaciones</label>
                <textarea ref={observationsRef} className='form-control' rows='3'></textarea>
              </div>
            </div>

            <button type='button' className='btn btn-outline-primary mt-3' onClick={openStockSearchModal}>
              <i className='mdi mdi-plus-circle me-1'></i> Insertar producto
            </button>

            <h4 className='text-center my-4'>Nota de salida</h4>
            <div className='storage-exit-lines-wrap'>
              <table className='table table-sm mb-0 storage-exit-lines'>
                <thead>
                  <tr>
                    <th>Numero de lote</th>
                    <th>Registro sanitario</th>
                    <th>Fecha de vencimiento</th>
                    <th>Articulo</th>
                    <th>U. medida</th>
                    <th>Stock</th>
                    <th>Ubic.</th>
                    <th>Ubic. destino</th>
                    <th>Cantidad</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.uid}>
                      <td style={{ minWidth: 160 }}><input className='form-control' value={item.lot || item.batch_code} readOnly /></td>
                      <td style={{ minWidth: 180 }}><input className='form-control' value={item.health_registration || ''} readOnly /></td>
                      <td style={{ minWidth: 150 }}><input className='form-control' type='date' value={item.expiration_date} readOnly /></td>
                      <td style={{ minWidth: 320 }}><input className='form-control' value={item.article_label || ''} readOnly /></td>
                      <td style={{ minWidth: 110 }}><input className='form-control' value={item.article_unit || ''} readOnly /></td>
                      <td style={{ minWidth: 95 }}><input className='form-control' value={Number(item.stock || 0).toFixed(3)} readOnly /></td>
                      <td style={{ minWidth: 120 }}><input className='form-control' value={item.location || ''} readOnly /></td>
                      <td style={{ minWidth: 170 }}><input className='form-control' value={item.destination_location || ''} onChange={(e) => onItemUpdated(item.uid, 'destination_location', e.target.value)} /></td>
                      <td style={{ minWidth: 130 }}><input className='form-control' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => onItemUpdated(item.uid, 'quantity', e.target.value)} /></td>
                      <td style={{ width: 54 }}>
                        <button type='button' className='btn btn-soft-danger' onClick={() => onItemRemoved(item.uid)}>
                          <i className='mdi mdi-delete'></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan='7'></td>
                    <td className='storage-exit-total-label'>Total</td>
                    <td><input className='form-control' value={storageQuantityTotal.toFixed(3)} readOnly /></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </> : <div className='row'>
          <VdSelect
            label='Sede'
            col='col-md-4'
            value={selectedBranchId}
            onChange={(value) => setSelectedBranchId(value)}
            options={branches.map(branch => ({ value: `${branch.id}`, label: branch.name }))}
            placeholder='-- Seleccionar sede --'
          />
          <VdSelect
            label='Almacen'
            col='col-md-4'
            required
            value={selectedWarehouseId}
            onChange={onWarehouseChanged}
            options={warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
            placeholder='-- Seleccionar almacen --'
          />
          <InputFormGroup eRef={clientNameRef} label='Cliente' col='col-md-4' />

          <div className='form-group col-md-8 mb-2'>
            <label className='form-label'>Motivos</label>
            <div className='d-flex gap-2'>
              <input ref={motiveInputRef} className='form-control' placeholder='Escribe un motivo y pulsa agregar' />
              <button type='button' className='btn btn-primary' onClick={addMotive}>Agregar</button>
            </div>
            <div className='d-flex flex-wrap gap-1 mt-2'>
              {motives.map((motive, idx) => (
                <span key={`motive-${idx}`} className='badge bg-soft-secondary text-dark'>
                  {motive}
                  <button type='button' className='btn btn-link btn-xs p-0 ms-1 text-danger' onClick={() => removeMotive(idx)}>x</button>
                </span>
              ))}
            </div>
          </div>
          <TextareaFormGroup eRef={observationsRef} label='Observaciones' col='col-md-4' rows={3} />

          <div className='col-12 mt-3'>
            <div className='d-flex justify-content-between align-items-center mb-2'>
              <h6 className='mb-0'>Nota de Salida</h6>
              <button type='button' className='btn btn-sm btn-soft-primary' onClick={onItemAdded}>
                <i className='mdi mdi-plus me-1'></i> Agregar linea
              </button>
            </div>

            <div className='table-responsive border rounded'>
              <table className='table table-sm table-striped mb-0'>
                <thead>
                  <tr>
                    <th>Lote registrado</th>
                    <th>Nombre</th>
                    <th>Laboratorio | Principio activo</th>
                    <th>Unidad</th>
                    <th>Stock</th>
                    <th>Almacen</th>
                    <th>Fecha Vencimiento</th>
                    <th>Ubicacion</th>
                    <th>Ubi. Destino</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const articleExtra = item.article_id ? `${item.article_laboratory || '-'} | ${item.article_principle || '-'}` : '-'
                    const unitLabel = item.article_id ? (item.article_unit || '-') : '-'
                    let batchFilter = null
                    if (selectedBusinessId && item.article_id) {
                      batchFilter = [['business_id', '=', Number(selectedBusinessId)], 'and', ['article_id', '=', Number(item.article_id)]]
                    } else if (selectedBusinessId) {
                      batchFilter = ['business_id', '=', Number(selectedBusinessId)]
                    } else if (item.article_id) {
                      batchFilter = ['article_id', '=', Number(item.article_id)]
                    }
                    // El almacen de la linea (o el del encabezado si aun no se sobreescribe) decide
                    // si el selector de articulos muestra el catalogo estandar o el de Magistrales
                    // (ver ArticleController::pickerEffectiveModuleScope, backend). Para cualquier
                    // otro almacen esto no cambia nada del comportamiento actual.
                    const articlePickerWarehouseId = item.warehouse_id || selectedWarehouseId || ''
                    const articleExtraParams = articlePickerWarehouseId ? { picker_warehouse_id: Number(articlePickerWarehouseId) } : undefined
                    return (
                      <tr key={item.uid}>
                        <td style={{ width: '20%' }}>
                          <div className='d-flex gap-1 align-items-center'>
                            <div style={{ flex: 1 }}>
                              <VdSelect
                                col='col-12'
                                noMargin
                                value={item.batch_id}
                                valueLabel={item.batch_label || item.batch_code || item.lot || null}
                                onChange={(value) => onItemBatchSelected(item.uid, value)}
                                placeholder='Buscar lote…'
                                loadOptions={async (q) => {
                                  // Replica exacta del filtro de SelectAPIFormGroup: busqueda por
                                  // `lot` combinada (AND) con el mismo `batchFilter` en cascada
                                  // (business_id/article_id) que ya calcula esta fila arriba.
                                  const searchClause = ['lot', 'contains', q || '']
                                  const filter = batchFilter
                                    ? (q ? [searchClause, 'and', batchFilter] : batchFilter)
                                    : (q ? searchClause : undefined)
                                  const { result } = await Fetch('/api/admin/batches/paginate', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                      sort: [{ selector: 'lot', desc: false }],
                                      skip: 0,
                                      take: 30,
                                      filter,
                                    }),
                                  })
                                  const rows = result?.data ?? []
                                  const cache = {}
                                  rows.forEach(b => { cache[`${b.id}`] = b })
                                  batchOptionsCacheRef.current[item.uid] = cache
                                  return rows.map(b => ({ value: `${b.id}`, label: b.lot }))
                                }}
                              />
                            </div>
                            <button type='button' className='btn btn-xs btn-soft-success' title='Crear lote' onClick={() => onCreateBatchForItem(item.uid)}>
                              <i className='mdi mdi-plus'></i>
                            </button>
                          </div>
                        </td>
                        <td style={{ width: '20%' }}>
                          <VdSelect
                            col='col-12'
                            noMargin
                            value={item.article_id}
                            valueLabel={item.article_label || null}
                            onChange={(value) => onItemArticleSelected(item.uid, value)}
                            placeholder='Buscar articulo…'
                            loadOptions={async (q) => {
                              // Replica exacta de SelectAPIFormGroup: busqueda por `name` +
                              // mismo extraParams `picker_warehouse_id` (cascada de scope
                              // comercial/magistrales/muestras segun el almacen de la fila).
                              const { result } = await Fetch('/api/admin/articles/paginate', {
                                method: 'POST',
                                body: JSON.stringify({
                                  sort: [{ selector: 'name', desc: false }],
                                  skip: 0,
                                  take: 30,
                                  filter: q ? ['name', 'contains', q] : undefined,
                                  ...(articleExtraParams || {}),
                                }),
                              })
                              const rows = result?.data ?? []
                              const cache = {}
                              rows.forEach(a => { cache[`${a.id}`] = a })
                              articleOptionsCacheRef.current[item.uid] = cache
                              return rows.map(a => ({ value: `${a.id}`, label: `${a.code ?? ''} - ${a.name ?? ''}`.trim() }))
                            }}
                          />
                        </td>
                        <td><small>{articleExtra}</small></td>
                        <td><small>{unitLabel}</small></td>
                        <td><input className='form-control form-control-sm' type='number' min='0' step='0.001' value={item.stock} onChange={(e) => onItemUpdated(item.uid, 'stock', e.target.value)} /></td>
                        <td style={{ minWidth: 160 }}>
                          <VdSelect
                            noMargin
                            value={`${item.warehouse_id || selectedWarehouseId || ''}`}
                            onChange={(value) => onItemUpdated(item.uid, 'warehouse_id', value)}
                            options={warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
                            placeholder='Seleccionar...'
                          />
                        </td>
                        <td><input className='form-control form-control-sm' type='date' value={item.expiration_date} onChange={(e) => onItemUpdated(item.uid, 'expiration_date', e.target.value)} /></td>
                        <td><input className='form-control form-control-sm' value={item.location} onChange={(e) => onItemUpdated(item.uid, 'location', e.target.value)} /></td>
                        <td><input className='form-control form-control-sm' value={item.destination_location} onChange={(e) => onItemUpdated(item.uid, 'destination_location', e.target.value)} /></td>
                        <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => onItemUpdated(item.uid, 'quantity', e.target.value)} /></td>
                        <td><input className='form-control form-control-sm' type='number' value={Number(item.total || 0).toFixed(2)} onChange={(e) => onItemUpdated(item.uid, 'total', e.target.value)} /></td>
                        <td>
                          <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onItemRemoved(item.uid)}>
                            <i className='mdi mdi-delete'></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>}
      </div>
    </Modal>

    {storageContext && <Modal
      modalRef={stockSearchModalRef}
      title={<h4 className='modal-title'><i className='mdi mdi-menu me-1'></i> BUSCAR LOTES</h4>}
      onSubmit={(e) => { e.preventDefault(); searchAvailableStockRows() }}
      size='full-width'
      hideFooter
      headerClass='storage-exit-modal-header'
      closeButtonClass='btn-close-white'
      contentClass='storage-exit-modal'
      dialogClass='storage-exit-dialog'
      bodyStyle={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}
      zIndex={1070}
    >
      <div className='px-1 storage-exit-form'>
        <div className='d-flex align-items-center gap-2 mb-2'>
          <i className='mdi mdi-menu text-muted'></i>
          <strong className='text-muted'>INGRESAR DATOS</strong>
        </div>
        <hr className='mt-0' />

        <div className='row align-items-end'>
          <div className='form-group col-md-6 mb-3'>
            <label className='form-label'>Descripcion del Articulo</label>
            <input
              ref={stockSearchTextRef}
              className='form-control'
              value={stockSearchTerm}
              placeholder='Ingrese codigo, nombre, lote'
              onChange={(e) => setStockSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                searchAvailableStockRows()
              }}
            />
          </div>
          <VdSelect
            label='Seleccionar almacen'
            col='col-md-6'
            value={stockSearchWarehouseId}
            onChange={(value) => setStockSearchWarehouseId(value)}
            options={warehouses.map(warehouse => ({ value: `${warehouse.id}`, label: warehouse.name }))}
            placeholder='Seleccione'
          />
        </div>

        <div className='d-flex gap-2 justify-content-center mb-4'>
          <button type='button' className='btn btn-outline-primary' onClick={searchAvailableStockRows} disabled={stockSearchLoading}>
            {stockSearchLoading ? <i className='mdi mdi-loading mdi-spin me-1'></i> : <i className='mdi mdi-magnify me-1'></i>}
            Buscar
          </button>
          <button type='button' className='btn btn-light' onClick={addSelectedStockRows} disabled={stockSearchSelectedIds.length === 0}>
            <i className='mdi mdi-keyboard-return me-1'></i> Regresar
          </button>
        </div>

        <div className='d-flex align-items-center gap-2 mb-2'>
          <i className='mdi mdi-menu text-muted'></i>
          <strong className='text-muted'>SELECCIONAR LOTES</strong>
        </div>
        <hr className='mt-0' />

        <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2'>
          <div className='d-flex align-items-center gap-2'>
            <span>Elementos:</span>
            <div style={{ width: 90 }}>
              <VdSelect
                noMargin
                value={`${stockSearchPageSize}`}
                onChange={(value) => {
                  setStockSearchPageSize(Number(value))
                  setStockSearchPage(1)
                }}
                options={[10, 20, 50].map(size => ({ value: `${size}`, label: `${size}` }))}
              />
            </div>
          </div>
          <label className='d-flex align-items-center gap-2 mb-0'>
            <span>Filtrar:</span>
            <input className='form-control form-control-sm' value={stockSearchFilter} onChange={(e) => { setStockSearchFilter(e.target.value); setStockSearchPage(1) }} />
          </label>
        </div>

        <div className='table-responsive border'>
          <table className='table table-sm table-hover mb-0'>
            <thead>
              <tr>
                <th style={{ width: 55 }} className='text-center'>
                  <input type='checkbox' checked={allStockSearchPageSelected} onChange={(e) => toggleStockSearchPage(e.target.checked)} />
                </th>
                <th>UBICACION</th>
                <th className='text-center'>STOCK</th>
                <th>NUMERO DE LOTE</th>
                <th>REGISTRO SANITARIO</th>
                <th>FECHA DE VENCIMIENTO</th>
                <th>ARTICULO</th>
                <th>U. MEDIDA</th>
              </tr>
            </thead>
            <tbody>
              {stockSearchLoading && <tr><td colSpan='8' className='text-center py-4'><i className='mdi mdi-loading mdi-spin me-1'></i> Buscando stock...</td></tr>}
              {!stockSearchLoading && stockSearchRows.length === 0 && <tr><td colSpan='8' className='text-muted py-3'>No existen elementos</td></tr>}
              {!stockSearchLoading && stockSearchRows.length > 0 && stockSearchPageRows.length === 0 && <tr><td colSpan='8' className='text-muted py-3'>No hay elementos a mostrar</td></tr>}
              {!stockSearchLoading && stockSearchPageRows.map(row => (
                <tr key={row.id}>
                  <td className='text-center'>
                    <input type='checkbox' checked={stockSearchSelectedIds.includes(row.id)} onChange={(e) => toggleStockSearchRow(row.id, e.target.checked)} />
                  </td>
                  <td>{row.location}</td>
                  <td className='text-center'>{Number(row.stock || 0).toFixed(3)}</td>
                  <td>{row.lot}</td>
                  <td>{row.health_registration}</td>
                  <td>{row.expiration_date}</td>
                  <td>{row.article_name}</td>
                  <td>{row.unit_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2'>
          <span className='text-muted'>
            {stockSearchFilteredRows.length > 0
              ? `${stockSearchFilteredRows.length} elementos (Pagina ${stockSearchCurrentPage} de ${stockSearchTotalPages})`
              : 'No hay elementos a mostrar'}
          </span>
          <div className='btn-group btn-group-sm'>
            <button type='button' className='btn btn-light' disabled={stockSearchCurrentPage <= 1} onClick={() => setStockSearchPage(page => Math.max(1, page - 1))}>Anterior</button>
            <button type='button' className='btn btn-light' disabled={stockSearchCurrentPage >= stockSearchTotalPages} onClick={() => setStockSearchPage(page => Math.min(stockSearchTotalPages, page + 1))}>Siguiente</button>
          </div>
        </div>
      </div>
    </Modal>}
  </>)
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? scopedPermission('exit-note')
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Notas de salida'}>
    <ExitNotes {...properties} />
  </BaseAdminto>);
})
