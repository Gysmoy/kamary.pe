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
import PriceListsRest from '../Actions/Admin/PriceListsRest';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import { Fetch } from 'sode-extend-react';
import { toast } from 'sonner';

const priceListsRest = new PriceListsRest()

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

// Etiqueta de alcance (a quien/que aplica el tarifario), usada en la columna y en la card mobile
const buildScopeLabel = (data) => {
  const parts = []
  if (data.client?.full_name) parts.push(`Cliente: ${data.client.full_name}`)
  if (data.eventual_client?.business_name) parts.push(`Eventual: ${data.eventual_client.business_name}`)
  if (data.distribution_network?.name) parts.push(`Nodo: ${data.distribution_network.name}`)
  if (data.channel) parts.push(`Canal: ${data.channel}`)
  if (data.segment) parts.push(`Segmento: ${data.segment}`)
  return parts.join(' | ') || 'General'
}

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  laboratory_id: '',
  category: '',
  subcategory: '',
  fixed_price: '',
  margin_percent: '',
  minimum_quantity: 1,
})

// Fusiona registros puntuales (p.ej. los relacionados de un tarifario en edicion) a una lista de opciones,
// para que VdSelect pueda mostrarlos aunque no vengan en la carga general (p.ej. si quedaron inactivos)
const mergeOptionRecords = (setList, records) => {
  const valid = (records || []).filter(Boolean)
  if (!valid.length) return
  setList(prev => {
    const seen = new Set(prev.map(item => `${item.id}`))
    const extra = []
    valid.forEach(r => {
      if (r?.id == null) return
      const key = `${r.id}`
      if (seen.has(key)) return
      seen.add(key)
      extra.push(r)
    })
    return extra.length ? [...prev, ...extra] : prev
  })
}

const loadFullList = async (url, { sortField = 'name', filter = null } = {}) => {
  try {
    const { status, result } = await Fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        isLoadingAll: true,
        sort: [{ selector: sortField, desc: false }],
        ...(filter ? { filter } : {}),
      })
    })
    if (!status) throw new Error(result?.message || 'No se pudo cargar la lista')
    return result.data ?? []
  } catch (error) {
    toast.error("Error", {
      description: error.message,
      duration: 3000,
      richColors: true,
    });
    return []
  }
}

const PriceLists = ({ requiredPermission = 'pricing' }) => {
  const tableRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const channelRef = useRef()
  const segmentRef = useRef()
  const priorityRef = useRef()
  const startsAtRef = useRef()
  const endsAtRef = useRef()
  const observationsRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [currency, setCurrency] = useState('PEN')

  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedEventualClientId, setSelectedEventualClientId] = useState('')
  const [selectedNetworkId, setSelectedNetworkId] = useState('')

  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [clients, setClients] = useState([])
  const [eventualClients, setEventualClients] = useState([])
  const [distributionNetworks, setDistributionNetworks] = useState([])
  const [articles, setArticles] = useState([])
  const [laboratories, setLaboratories] = useState([])

  const [items, setItems] = useState([emptyItem()])

  const loadBusinesses = async () => setBusinesses(await loadFullList('/api/admin/businesses/paginate', { sortField: 'name' }))
  const loadClients = async () => setClients(await loadFullList('/api/admin/clients/paginate', { sortField: 'full_name', filter: ['client_kind', '=', 'regular'] }))
  const loadEventualClients = async () => setEventualClients(await loadFullList('/api/admin/eventual-clients/paginate', { sortField: 'business_name' }))
  const loadArticlesList = async () => setArticles(await loadFullList('/api/admin/articles/paginate', { sortField: 'name' }))
  const loadLaboratoriesList = async () => setLaboratories(await loadFullList('/api/admin/laboratories/paginate', { sortField: 'name' }))
  const loadWarehousesList = async (branchId) => setWarehouses(await loadFullList('/api/admin/warehouses/paginate', { sortField: 'name', filter: branchId ? ['business_branch_id', '=', Number(branchId)] : null }))
  const loadNetworksList = async (clientId) => setDistributionNetworks(await loadFullList('/api/admin/client-distribution/paginate', { sortField: 'name', filter: clientId ? ['client_id', '=', Number(clientId)] : null }))

  // Catalogos de tamaño acotado: se cargan una sola vez al montar
  useEffect(() => {
    loadBusinesses()
    loadClients()
    loadEventualClients()
    loadArticlesList()
    loadLaboratoriesList()
  }, [])

  // Cascadas: almacenes por sede, red de distribucion por cliente (tambien cubren la carga inicial sin filtro)
  useEffect(() => { loadWarehousesList(selectedBranchId || null) }, [selectedBranchId])
  useEffect(() => { loadNetworksList(selectedClientId || null) }, [selectedClientId])

  const loadBranches = async (businessId, preferredId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
      return
    }

    const data = await priceListsRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return
    }
    setSelectedBranchId('')
  }

  const onBusinessChange = async (value) => {
    const id = value || ''
    setSelectedBusinessId(id)
    setSelectedWarehouseId('')
    await loadBranches(id)
  }

  const clearForm = () => {
    if (idRef.current) idRef.current.value = ''
    if (codeRef.current) codeRef.current.value = 'Se genera al guardar'
    if (channelRef.current) channelRef.current.value = ''
    if (segmentRef.current) segmentRef.current.value = ''
    if (priorityRef.current) priorityRef.current.value = '100'
    if (startsAtRef.current) startsAtRef.current.value = ''
    if (endsAtRef.current) endsAtRef.current.value = ''
    if (observationsRef.current) observationsRef.current.value = ''
    setCurrency('PEN')
    setSelectedBusinessId('')
    setSelectedBranchId('')
    setSelectedWarehouseId('')
    setSelectedClientId('')
    setSelectedEventualClientId('')
    setSelectedNetworkId('')
    setBranches([])
    setItems([emptyItem()])
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)
    clearForm()

    if (data?.id) {
      idRef.current.value = data.id
      codeRef.current.value = data.code ?? ''
      channelRef.current.value = data.channel ?? ''
      segmentRef.current.value = data.segment ?? ''
      setCurrency(data.currency ?? 'PEN')
      priorityRef.current.value = data.priority ?? 100
      startsAtRef.current.value = data.starts_at ? data.starts_at.toString().slice(0, 10) : ''
      endsAtRef.current.value = data.ends_at ? data.ends_at.toString().slice(0, 10) : ''
      observationsRef.current.value = data.observations ?? ''

      const businessId = data.business_id ? `${data.business_id}` : ''
      const branchId = data.business_branch_id ? `${data.business_branch_id}` : ''
      const clientId = data.client_id ? `${data.client_id}` : ''
      const warehouseId = data.warehouse_id ? `${data.warehouse_id}` : ''
      const eventualClientId = data.eventual_client_id ? `${data.eventual_client_id}` : ''
      const networkId = data.client_distribution_network_id ? `${data.client_distribution_network_id}` : ''

      setSelectedBusinessId(businessId)
      setSelectedClientId(clientId)
      setSelectedWarehouseId(warehouseId)
      setSelectedEventualClientId(eventualClientId)
      setSelectedNetworkId(networkId)

      // Asegura que las opciones referenciadas por este registro esten disponibles en los VdSelect
      // aunque el catalogo activo no las incluya (p.ej. quedaron inactivas luego de crear el tarifario)
      mergeOptionRecords(setBusinesses, [data.business])
      mergeOptionRecords(setWarehouses, [data.warehouse])
      mergeOptionRecords(setClients, [data.client])
      mergeOptionRecords(setEventualClients, [data.eventual_client])
      mergeOptionRecords(setDistributionNetworks, [data.distribution_network])
      mergeOptionRecords(setArticles, (data.items ?? []).map(row => row.article))
      mergeOptionRecords(setLaboratories, (data.items ?? []).map(row => row.laboratory))

      const detail = (data.items ?? []).map(row => ({
        uid: crypto.randomUUID(),
        article_id: row.article_id ? `${row.article_id}` : '',
        laboratory_id: row.laboratory_id ? `${row.laboratory_id}` : '',
        category: row.category ?? '',
        subcategory: row.subcategory ?? '',
        fixed_price: row.fixed_price ?? '',
        margin_percent: row.margin_percent ?? '',
        minimum_quantity: row.minimum_quantity ?? 1,
      }))
      setItems(detail.length ? detail : [emptyItem()])
      await loadBranches(data.business_id ?? null, branchId)
    }

    $(modalRef.current).modal('show')
  }

  const updateItem = (uid, patch) => {
    setItems(prev => prev.map(item => item.uid === uid ? { ...item, ...patch } : item))
  }

  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (uid) => setItems(prev => prev.length > 1 ? prev.filter(item => item.uid !== uid) : [emptyItem()])

  const onModalSubmit = async (e) => {
    e.preventDefault()

    if (!selectedBusinessId) {
      Swal.fire({ icon: 'warning', title: 'Falta empresa', text: 'Selecciona una empresa.', confirmButtonText: 'Entendido' })
      return
    }

    const request = {
      id: idRef.current.value || undefined,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      client_id: selectedClientId || null,
      eventual_client_id: selectedEventualClientId || null,
      client_distribution_network_id: selectedNetworkId || null,
      code: codeRef.current.value?.trim(),
      channel: channelRef.current.value?.trim(),
      segment: segmentRef.current.value?.trim(),
      currency: currency || 'PEN',
      priority: priorityRef.current.value || 100,
      starts_at: startsAtRef.current.value || null,
      ends_at: endsAtRef.current.value || null,
      observations: observationsRef.current.value?.trim(),
      items: items.map(item => ({
        article_id: item.article_id || null,
        laboratory_id: item.laboratory_id || null,
        category: item.category?.trim(),
        subcategory: item.subcategory?.trim(),
        fixed_price: item.fixed_price?.toString().trim(),
        margin_percent: item.margin_percent?.toString().trim(),
        minimum_quantity: item.minimum_quantity?.toString().trim() || '1',
        status: true,
      })),
    }

    const result = await priceListsRest.save(request)
    if (!result) return

    tableRef.current?.refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, value }) => {
    const result = await priceListsRest.boolean({ id, field: 'status', value })
    if (!result) return
    tableRef.current?.refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar tarifario',
      text: 'Se dara de baja el tarifario seleccionado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await priceListsRest.delete(id)
    if (!result) return
    tableRef.current?.refresh()
  }

  const rowActions = (row) => [
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r) },
    { icon: 'mdi mdi-file-pdf-box', title: 'Imprimir PDF', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => openMagistralesRecordPdf(buildMagistralesRows.priceList(r)) },
    { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id) },
  ]

  return (<>
    <VdTable
      ref={tableRef}
      rest={priceListsRest}
      icon="mdi mdi-cash-multiple"
      title="Tarifario"
      unit="tarifarios"
      defaultPageSize={20}
      searchFields={['code', 'business.name', 'branch.name', 'warehouse.name', 'channel', 'segment']}
      searchPlaceholder="Buscar por codigo, empresa, sede…"
      emptyText="No se encontraron tarifarios."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={() => tableRef.current?.refresh()}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen()}>
          <i className="mdi mdi-plus"></i> Nuevo tarifario
        </button>
      </>}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', width: '70px' },
        {
          key: 'codigo', label: 'Codigo', field: 'code', width: '120px', filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onModalOpen(row)} title="Editar tarifario">
              {row.code || '-'}
            </a>
          ),
        },
        { key: 'empresa', label: 'Empresa', field: 'business.name', filter: { type: 'text' } },
        { key: 'sede', label: 'Sede', field: 'branch.name', visible: false, filter: { type: 'text' } },
        { key: 'almacen', label: 'Almacén', field: 'warehouse.name', visible: false, filter: { type: 'text' } },
        {
          key: 'alcance', label: 'Alcance', sortable: false,
          render: (row) => buildScopeLabel(row),
        },
        { key: 'moneda', label: 'Moneda', field: 'currency', width: '90px' },
        { key: 'prioridad', label: 'Prioridad', field: 'priority', width: '90px' },
        {
          key: 'reglas', label: 'Reglas', width: '80px', sortable: false, align: 'right',
          render: (row) => (row.items ?? []).filter(item => item.status !== null).length,
        },
        { key: 'vigencia_inicio', label: 'Vigencia inicio', field: 'starts_at', width: '110px', filter: { type: 'date' } },
        { key: 'vigencia_fin', label: 'Vigencia fin', field: 'ends_at', width: '110px', filter: { type: 'date' } },
        {
          key: 'creador', label: 'Creado por', field: 'creator.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.creator),
        },
        {
          key: 'actualizador', label: 'Actualizado por', field: 'updater.fullname', visible: false, sortable: false,
          render: (row) => formatAuditUser(row.updater),
        },
        {
          key: 'estado', label: 'Estado', field: 'status', width: '110px',
          filter: { type: 'select', field: 'status', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => {
            if (row.status === null) return ''
            return <SwitchFormGroup noMargin checked={row.status == 1} onChange={() => onBooleanChange({ id: row.id, value: !row.status })} />
          },
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onModalOpen(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.code || '-'}</p>
              <small className="text-muted">{[row.business?.name, row.branch?.name].filter(Boolean).join(' · ')}</small>
            </div>
            {row.status !== null && (
              <span className={`badge ${row.status == 1 ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status == 1 ? 'Activo' : 'Inactivo'}</span>
            )}
          </div>
          <p className="text-muted mb-0 mt-2" style={{ fontSize: 12 }}>{buildScopeLabel(row)}</p>
          <small className="text-muted d-block mt-2">
            <i className="mdi mdi-currency-usd me-1"></i>{row.currency} · Prioridad {row.priority} · {(row.items ?? []).filter(item => item.status !== null).length} reglas
          </small>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar tarifario' : 'Agregar tarifario'} onSubmit={onModalSubmit} size='xl' btnSubmitText='Guardar'>
      <div className='row'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={codeRef} label='Codigo' col='col-md-3' />
        <VdSelect
          label='Empresa'
          col='col-md-5'
          required
          value={selectedBusinessId}
          onChange={onBusinessChange}
          options={businesses.map(b => ({ value: `${b.id}`, label: b.name }))}
          placeholder='-- Seleccionar empresa --'
        />
        <VdSelect
          label='Sede'
          col='col-md-4'
          value={selectedBranchId}
          onChange={(value) => { setSelectedBranchId(value || ''); setSelectedWarehouseId('') }}
          options={[{ value: '', label: 'Todas' }, ...branches.map(b => ({ value: `${b.id}`, label: b.name }))]}
          placeholder='Todas'
        />

        <VdSelect
          label='Almacen'
          col='col-md-4'
          value={selectedWarehouseId}
          onChange={(value) => setSelectedWarehouseId(value || '')}
          options={warehouses.map(w => ({ value: `${w.id}`, label: w.name }))}
          placeholder='-- Seleccionar almacen --'
        />
        <VdSelect
          label='Cliente regular'
          col='col-md-4'
          value={selectedClientId}
          onChange={(value) => { setSelectedClientId(value || ''); setSelectedNetworkId('') }}
          options={clients.map(c => ({ value: `${c.id}`, label: c.full_name }))}
          placeholder='-- Seleccionar cliente --'
        />
        <VdSelect
          label='Cliente eventual'
          col='col-md-4'
          value={selectedEventualClientId}
          onChange={(value) => setSelectedEventualClientId(value || '')}
          options={eventualClients.map(c => ({ value: `${c.id}`, label: c.business_name }))}
          placeholder='-- Seleccionar cliente eventual --'
        />

        <VdSelect
          label='Red de distribucion'
          col='col-md-4'
          value={selectedNetworkId}
          onChange={(value) => setSelectedNetworkId(value || '')}
          options={distributionNetworks.map(n => ({ value: `${n.id}`, label: [n.code, n.name].filter(Boolean).join(' - ') }))}
          placeholder='-- Seleccionar red --'
        />
        <InputFormGroup eRef={channelRef} label='Canal' col='col-md-2' />
        <InputFormGroup eRef={segmentRef} label='Segmento' col='col-md-2' />
        <VdSelect
          label='Moneda'
          col='col-md-2'
          value={currency}
          onChange={(value) => setCurrency(value || 'PEN')}
          options={[{ value: 'PEN', label: 'PEN' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]}
        />
        <InputFormGroup eRef={priorityRef} label='Prioridad' col='col-md-2' type='number' min='1' />
        <InputFormGroup eRef={startsAtRef} label='Vigencia inicio' col='col-md-2' type='date' />
        <InputFormGroup eRef={endsAtRef} label='Vigencia fin' col='col-md-2' type='date' />

        <div className='form-group col-12 mb-2'>
          <label className='form-label'>Observaciones</label>
          <textarea ref={observationsRef} className='form-control' rows='3'></textarea>
        </div>

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h5 className='mb-0'>Reglas del tarifario</h5>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={addItem}>
              <i className='mdi mdi-plus me-1'></i>Agregar regla
            </button>
          </div>
        </div>

        {items.map((item, index) => (
          <div className='col-12' key={item.uid}>
            <div className='card border shadow-none mb-2'>
              <div className='card-body'>
                <div className='d-flex justify-content-between align-items-center mb-2'>
                  <div className='fw-semibold'>Regla #{index + 1}</div>
                  <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => removeItem(item.uid)}>
                    <i className='mdi mdi-delete'></i>
                  </button>
                </div>
                <div className='row'>
                  <VdSelect
                    label='Articulo'
                    col='col-md-5'
                    value={item.article_id}
                    onChange={(value) => updateItem(item.uid, { article_id: value })}
                    options={articles.map(a => ({ value: `${a.id}`, label: [a.code, a.name].filter(Boolean).join(' - ') }))}
                    placeholder='-- Seleccionar articulo --'
                  />
                  <VdSelect
                    label='Laboratorio'
                    col='col-md-3'
                    value={item.laboratory_id}
                    onChange={(value) => updateItem(item.uid, { laboratory_id: value })}
                    options={laboratories.map(l => ({ value: `${l.id}`, label: l.name }))}
                    placeholder='-- Seleccionar laboratorio --'
                  />
                  <div className='form-group col-md-2 mb-2'>
                    <label className='form-label'>Categoria</label>
                    <input className='form-control' value={item.category} onChange={(e) => updateItem(item.uid, { category: e.target.value })} />
                  </div>
                  <div className='form-group col-md-2 mb-2'>
                    <label className='form-label'>Subcategoria</label>
                    <input className='form-control' value={item.subcategory} onChange={(e) => updateItem(item.uid, { subcategory: e.target.value })} />
                  </div>
                  <div className='form-group col-md-3 mb-2'>
                    <label className='form-label'>Precio fijo</label>
                    <input className='form-control' type='number' step='0.0001' value={item.fixed_price} onChange={(e) => updateItem(item.uid, { fixed_price: e.target.value })} />
                  </div>
                  <div className='form-group col-md-3 mb-2'>
                    <label className='form-label'>Margen %</label>
                    <input className='form-control' type='number' step='0.001' value={item.margin_percent} onChange={(e) => updateItem(item.uid, { margin_percent: e.target.value })} />
                  </div>
                  <div className='form-group col-md-2 mb-2'>
                    <label className='form-label'>Cant. minima</label>
                    <input className='form-control' type='number' step='0.001' min='0.001' value={item.minimum_quantity} onChange={(e) => updateItem(item.uid, { minimum_quantity: e.target.value })} />
                  </div>
                  <div className='col-md-4 small text-muted d-flex align-items-center'>
                    Usa precio fijo o margen. No ambos en la misma regla.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  const canAccess = properties.can(properties.requiredPermission ?? 'pricing') || properties.can('pricing') || properties.hasRole('Admin')
  if (!canAccess) location.href = '/admin/'

  createRoot(el).render(<BaseAdminto {...properties} title='Tarifario'>
    <PriceLists {...properties} />
  </BaseAdminto>);
})
