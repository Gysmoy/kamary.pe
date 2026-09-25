import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import Swal from 'sweetalert2'
import BaseAdminto from '@Adminto/Base'
import CreateReactScript from '../Utils/CreateReactScript'
import VdTable from '@Adminto/VdTable'
import VdSelect from '@Adminto/VdSelect'
import VdUbigeoCascade from '@Adminto/VdUbigeoCascade'
import InputFormGroup from '@Adminto/form/InputFormGroup'
import Modal from '../Components/Adminto/Modal'
import { EMPTY_UBIGEO_SELECTION } from '../Utils/ubigeoInei'
import ReferralGuidesRest from '../Actions/Admin/ReferralGuidesRest'

const referralGuidesRest = new ReferralGuidesRest()

const REASONS = [
  'VENTA',
  'COMPRA',
  'TRASLADO ENTRE ESTABLECIMIENTOS',
  'DEVOLUCION',
  'VENTA CON ENTREGA A TERCEROS',
]
const GUIDE_STATUS = {
  accepted: ['Aceptada', 'success'],
  sent: ['Enviada', 'info'],
  rejected: ['Rechazada', 'danger'],
  observed: ['Observada', 'warning'],
  cancelled: ['Anulada', 'secondary'],
  prepared: ['Borrador', 'secondary'],
  pending: ['Pendiente', 'secondary'],
}
const DISPATCH_STATUS = {
  pending: ['En cola', 'secondary'],
  preparing: ['Preparando', 'warning'],
  dispatched: ['Listo', 'info'],
  in_route: ['En ruta', 'primary'],
  delivered: ['Entregado', 'success'],
  cancelled: ['Cancelado', 'danger'],
}

const GuideStatusBadge = ({ guide }) => {
  const s = (guide?.guide_status || '').toLowerCase()
  const [label, color] = GUIDE_STATUS[s] || [guide?.external_status || s || '-', 'secondary']
  return <span className={`badge badge-soft-${color}`}>{label}</span>
}

const OrderBadge = ({ guide }) => {
  const order = guide?.commercial_order
  if (!order) return <span className='text-muted'>-</span>
  const [label, color] = DISPATCH_STATUS[order.dispatch_status] || [order.dispatch_status || '-', 'secondary']
  return <span className='d-inline-flex align-items-center gap-1'>
    <span className='fw-semibold'>{order.code}</span>
    <span className={`badge badge-soft-${color}`}>{label}</span>
  </span>
}

const itemFromArticle = (article) => ({
  article_id: article.id,
  code: article.code,
  name: article.name,
  unit: article.unit,
  stock: Number(article.stock || 0),
  presentations: article.presentations || [],
  presentation_id: '',
  quantity: 1,
})

const itemUnits = (it) => Number(it.presentations.find(p => String(p.id) === String(it.presentation_id))?.units || 1)
const formatDate = (value) => value ? `${value}`.slice(0, 10) : '-'

const Section = ({ icon, title, children }) => <section className='manual-guide-section'>
  <div className='manual-guide-section-title'><i className={icon}></i><span>{title}</span></div>
  <div className='row g-2'>{children}</div>
</section>

const ManualGuides = ({ manualBusinesses = [], manualDrivers = [], manualVehicles = [] }) => {
  const tableRef = useRef()
  const modalRef = useRef()

  const defaultBusiness = useMemo(() => {
    const medical = manualBusinesses.find(b => String(b.tax_number) === '20604718237')
    return medical?.id ?? manualBusinesses[0]?.id ?? ''
  }, [manualBusinesses])

  const [form, setForm] = useState(null)
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [articles, setArticles] = useState([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [originUbigeo, setOriginUbigeo] = useState(EMPTY_UBIGEO_SELECTION)
  const [destUbigeo, setDestUbigeo] = useState(EMPTY_UBIGEO_SELECTION)
  const [saving, setSaving] = useState(false)

  const business = manualBusinesses.find(b => String(b.id) === String(form?.business_id))
  const branches = business?.branches ?? []
  const warehouses = branches.find(b => String(b.id) === String(form?.business_branch_id))?.warehouses ?? []
  const drivers = manualDrivers.filter(d => String(d.business_id) === String(form?.business_id))
  const vehicles = manualVehicles.filter(v => String(v.business_id) === String(form?.business_id))

  const set = (patch) => setForm(prev => ({ ...prev, ...patch }))
  const bind = (field, transform = (v) => v) => ({ value: form?.[field] ?? '', onChange: (e) => set({ [field]: transform(e.target.value) }) })

  // Productos con stock del almacen elegido (busqueda con retardo)
  useEffect(() => {
    if (!form?.warehouse_id) { setArticles([]); return }
    // Descarta respuestas viejas: una busqueda anterior que llega tarde no pisa la actual
    let active = true
    const timer = setTimeout(async () => {
      setLoadingArticles(true)
      const rows = await referralGuidesRest.getWarehouseArticles({ businessId: form.business_id, warehouseId: form.warehouse_id, search })
      if (!active) return
      setArticles(rows)
      setLoadingArticles(false)
    }, 350)
    return () => { active = false; clearTimeout(timer) }
  }, [form?.business_id, form?.warehouse_id, search])

  const branchDefaults = (branch) => ({
    business_branch_id: branch?.id ? `${branch.id}` : '',
    warehouse_id: branch?.warehouses?.[0]?.id ? `${branch.warehouses[0].id}` : '',
    origin_address: branch?.address ?? '',
  })

  const openModal = () => {
    const biz = manualBusinesses.find(b => String(b.id) === String(defaultBusiness))
    const branch = biz?.branches?.[0]
    const bizDrivers = manualDrivers.filter(d => String(d.business_id) === String(defaultBusiness))
    setForm({
      business_id: `${defaultBusiness}`,
      ...branchDefaults(branch),
      order_document_type: '',
      recipient_document_type: 'RUC',
      recipient_document_number: '',
      recipient_name: '',
      recipient_phone: '',
      transfer_reason: 'VENTA',
      transfer_mode: 'private',
      // Fecha local de Lima (toISOString daria el dia siguiente pasadas las 7pm)
      transfer_date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }),
      destination_address: '',
      driver_id: bizDrivers[0]?.id ? `${bizDrivers[0].id}` : '',
      driver_name: '', driver_document_type: 'DNI', driver_document_number: '', driver_license_number: '',
      vehicle_id: '',
      vehicle_plate: '',
      package_count: 1,
      gross_weight: 0,
      observations: '',
    })
    setItems([])
    setSearch('')
    setOriginUbigeo(branch?.ubigeo ? { ...EMPTY_UBIGEO_SELECTION, ubigeo: branch.ubigeo } : EMPTY_UBIGEO_SELECTION)
    setDestUbigeo(EMPTY_UBIGEO_SELECTION)
    $(modalRef.current).modal('show')
  }

  const onBusinessChange = (bid) => {
    const biz = manualBusinesses.find(b => String(b.id) === String(bid))
    const branch = biz?.branches?.[0]
    const bizDrivers = manualDrivers.filter(d => String(d.business_id) === String(bid))
    set({ business_id: bid, ...branchDefaults(branch), driver_id: bizDrivers[0]?.id ? `${bizDrivers[0].id}` : '', vehicle_id: '' })
    setItems([])
    setOriginUbigeo(branch?.ubigeo ? { ...EMPTY_UBIGEO_SELECTION, ubigeo: branch.ubigeo } : EMPTY_UBIGEO_SELECTION)
  }

  const onBranchChange = (branchId) => {
    const branch = branches.find(b => String(b.id) === String(branchId))
    set(branchDefaults(branch))
    setItems([])
    if (branch?.ubigeo) setOriginUbigeo({ ...EMPTY_UBIGEO_SELECTION, ubigeo: branch.ubigeo })
  }

  const onWarehouseChange = (warehouseId) => {
    set({ warehouse_id: warehouseId })
    setItems([])
  }

  const setItem = (idx, patch) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  const addArticle = (article) => {
    if (items.some(it => String(it.article_id) === String(article.id))) {
      toast.info('Ya está en la guía', { description: article.name, richColors: true })
      return
    }
    setItems(prev => [...prev, itemFromArticle(article)])
  }
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const payload = {
      ...form,
      origin_ubigeo: originUbigeo?.ubigeo || '',
      destination_ubigeo: destUbigeo?.ubigeo || '',
      items: items.map(it => ({ article_id: it.article_id, presentation_id: it.presentation_id || null, quantity: Number(it.quantity) })),
    }
    const fail = (description) => { toast.error('Error', { description, richColors: true }); return true }
    if (!payload.warehouse_id && fail('Selecciona el almacén')) return
    if (payload.items.length === 0 && fail('Agrega al menos un producto del almacén')) return
    const overStock = items.find(it => Number(it.quantity) <= 0 || Number(it.quantity) * itemUnits(it) > it.stock)
    if (overStock && fail(`Cantidad inválida o mayor al stock disponible: ${overStock.name}`)) return
    if (!payload.recipient_name.trim() && fail('Falta el destinatario')) return
    if (!payload.destination_ubigeo && fail('Elige departamento, provincia y distrito de llegada')) return
    if (!payload.destination_address.trim() && fail('Falta la dirección de llegada')) return
    if (!payload.vehicle_id && !payload.vehicle_plate.trim() && fail('Selecciona un vehículo o ingresa la placa')) return

    const branch = branches.find(b => String(b.id) === String(form.business_branch_id))
    if (branch && !branch.synced) {
      const { isConfirmed } = await Swal.fire({
        title: 'Sede sin sincronizar',
        text: `La sede "${branch.name}" no está sincronizada con el facturador; SUNAT rechazará la guía. ¿Continuar igual?`,
        icon: 'warning', showCancelButton: true, confirmButtonText: 'Continuar', cancelButtonText: 'Cancelar'
      })
      if (!isConfirmed) return
    }

    setSaving(true)
    try {
      const created = await referralGuidesRest.createManual(payload)
      if (!created?.data?.id) return
      toast.success('Correcto', { description: created.message, duration: 5000, richColors: true })
      tableRef.current?.refresh()
      $(modalRef.current).modal('hide')
    } finally {
      setSaving(false)
    }
  }

  const onIssue = async (row) => {
    const r = await referralGuidesRest.issue(row.id)
    if (r) tableRef.current?.refresh()
  }
  const onCancel = async (row) => {
    const { isConfirmed, value } = await Swal.fire({
      title: 'Anular guía', input: 'text', inputLabel: 'Motivo', showCancelButton: true,
      confirmButtonText: 'Anular', cancelButtonText: 'Cerrar'
    })
    if (!isConfirmed) return
    const r = await referralGuidesRest.cancel(row.id, value || 'Anulación')
    if (r) tableRef.current?.refresh()
  }

  // Con pedido en picking la guia manual se emite sola al pasar a "Listo"
  const canIssue = (row) => {
    const st = (row.guide_status || '').toLowerCase()
    const inPicking = row.metadata?.source === 'manual' && ['pending', 'preparing'].includes(row.commercial_order?.dispatch_status)
    return !['accepted', 'cancelled'].includes(st) && !inPicking
  }

  const rowActions = (row) => [
    { icon: 'mdi mdi-send', title: 'Emitir', bg: '#e6f6ef', color: '#10b981', hidden: !canIssue(row), onClick: onIssue },
    { icon: 'mdi mdi-cancel', title: 'Anular', bg: '#fcebeb', color: '#e24b4a', hidden: (row.guide_status || '').toLowerCase() !== 'accepted', onClick: onCancel },
    { icon: 'mdi mdi-file-pdf-box', title: 'PDF', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => window.open(referralGuidesRest.downloadUrl(r.id, 'pdf'), '_blank') },
    { icon: 'mdi mdi-xml', title: 'XML', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => window.open(referralGuidesRest.downloadUrl(r.id, 'xml'), '_blank') },
  ]

  if (manualBusinesses.length === 0) {
    return <div className='alert alert-warning'>No hay empresas configuradas.</div>
  }

  const optionsOf = (list, label) => list.map(x => ({ value: `${x.id}`, label: label(x) }))

  return <>
    <style>{`
      .manual-guide-section {
        border: 1px solid #eef0f4;
        border-radius: 10px;
        padding: 12px 14px 6px;
        margin-bottom: 12px;
      }
      .manual-guide-section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 10px;
        color: #6c757d;
        font-size: .75rem;
        font-weight: 700;
        letter-spacing: .03em;
        text-transform: uppercase;
      }
      .manual-guide-section-title i { color: var(--vd-primary, #e24b4a); font-size: 16px; }
      .manual-guide-results { max-height: 200px; overflow-y: auto; overflow-x: hidden; }
      .manual-guide-result { background: #fff; border: 0; border-bottom: 1px solid #f1f1f6; width: 100%; text-align: left; padding: 7px 10px; display: flex; gap: 8px; align-items: center; }
      .manual-guide-result:hover { background: #f8f9fb; }
      .manual-guide-item {
        align-items: center;
        border-bottom: 1px dashed #eef0f4;
        display: grid;
        gap: 8px;
        grid-template-columns: minmax(0, 1fr) 170px 100px 40px;
        padding: 8px 0;
      }
      @media (max-width: 767.98px) {
        .manual-guide-item { grid-template-columns: minmax(0, 1fr) 90px 40px; }
        .manual-guide-item-name { grid-column: 1 / -1; }
      }
    `}</style>

    <VdTable
      ref={tableRef}
      rest={referralGuidesRest}
      icon='mdi mdi-truck-delivery'
      title='Guías de remisión'
      unit='guías'
      defaultSort={{ field: 'id', desc: true }}
      defaultPageSize={25}
      searchFields={['external_reference', 'recipient_name', 'recipient_document_number']}
      searchPlaceholder='Buscar por serie, destinatario o documento…'
      emptyText='No se encontraron guías.'
      headerActions={<>
        <button type='button' className='vdt-btn-soft vdt-btn-icon' title='Refrescar' onClick={() => tableRef.current?.refresh()}>
          <i className='mdi mdi-refresh'></i>
        </button>
        <button type='button' className='vdt-btn-pri' onClick={openModal}>
          <i className='mdi mdi-plus'></i> Nueva guía manual
        </button>
      </>}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'external_reference', label: 'Serie-Número', field: 'external_reference', width: '150px',
          filter: { type: 'text', fields: ['external_reference', 'code'] },
          render: (row) => <span className='fw-semibold'>{row.external_reference || row.code}</span>,
        },
        {
          key: 'order', label: 'Pedido', field: 'commercial_order.code', sortable: false,
          render: (row) => <OrderBadge guide={row} />,
        },
        {
          key: 'recipient_name', label: 'Destinatario', field: 'recipient_name',
          filter: { type: 'text', fields: ['recipient_name', 'recipient_document_number'] },
          render: (row) => <div>
            <div>{row.recipient_name || '-'}</div>
            {row.recipient_document_number && <small className='text-muted'>{row.recipient_document_type} {row.recipient_document_number}</small>}
          </div>,
        },
        { key: 'business', label: 'Empresa', field: 'business.name', sortable: false, render: (row) => row.business?.name ?? '-' },
        {
          key: 'guide_status', label: 'Estado SUNAT', field: 'guide_status', width: '130px',
          filter: { type: 'select', options: Object.entries(GUIDE_STATUS).map(([value, [label]]) => ({ value, label })) },
          render: (row) => <GuideStatusBadge guide={row} />,
        },
        {
          key: 'issue_date', label: 'Emisión', field: 'issue_date', width: '120px',
          filter: { type: 'date' },
          render: (row) => formatDate(row.issue_date),
        },
      ]}
      renderCard={(row, actionButtons) => <div className='vdt-card'>
        <div className='d-flex justify-content-between align-items-start' style={{ gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <p className='fw-semibold mb-0' style={{ color: 'var(--vd-ink)' }}>{row.external_reference || row.code}</p>
            <small className='text-muted'>{row.recipient_name || '-'}</small>
          </div>
          <GuideStatusBadge guide={row} />
        </div>
        <div className='mt-2'><OrderBadge guide={row} /></div>
        <small className='text-muted d-block mt-2'>{row.business?.name} · {formatDate(row.issue_date)}</small>
        {actionButtons && <div className='d-flex mt-3 pt-3' style={{ gap: 8, borderTop: '1px solid #f1f1f6' }}>{actionButtons}</div>}
      </div>}
    />

    <Modal modalRef={modalRef} title='Nueva guía de remisión' size='lg' preventEnterSubmit onSubmit={onSubmit} btnSubmitText={saving ? 'Creando...' : 'Crear pedido y guía'}>
      {form && <>
        <Section icon='mdi mdi-domain' title='Origen'>
          <VdSelect col='col-md-6' label='Empresa' required value={`${form.business_id}`} onChange={onBusinessChange}
            options={optionsOf(manualBusinesses, b => `${b.name} (${b.tax_number})`)} />
          <VdSelect col='col-md-6' label='Sede (punto de partida)' required value={form.business_branch_id} onChange={onBranchChange}
            options={optionsOf(branches, b => `${b.name} — cod ${b.establishment_code || '—'}${b.synced ? '' : ' (sin sync)'}`)} placeholder='-- Seleccionar sede --' />
          <VdSelect col='col-md-6' label='Almacén (sale el stock)' required value={form.warehouse_id} onChange={onWarehouseChange}
            options={optionsOf(warehouses, w => w.name)} placeholder={warehouses.length ? '-- Seleccionar almacén --' : 'La sede no tiene almacenes'} />
          <VdSelect col='col-md-6' label='Comprobante del pedido' value={form.order_document_type} onChange={(v) => set({ order_document_type: v })}
            clearable placeholder='Automático (RUC → Factura, otros → Boleta)'
            options={[
              { value: 'Factura', label: 'Factura' },
              { value: 'Boleta', label: 'Boleta' },
              { value: 'Nota de pedido', label: 'Nota de pedido' },
            ]} />
        </Section>

        <Section icon='mdi mdi-pill' title='Productos del almacén'>
          <div className='col-12 mb-2'>
            <input className='form-control' placeholder={form.warehouse_id ? 'Buscar producto por código o nombre…' : 'Primero elige el almacén'} disabled={!form.warehouse_id} value={search} onChange={e => setSearch(e.target.value)} />
            {form.warehouse_id && <div className='border rounded mt-1 manual-guide-results'>
              {loadingArticles && <div className='p-2 small text-muted'>Buscando…</div>}
              {!loadingArticles && articles.length === 0 && <div className='p-2 small text-muted'>Sin productos con stock</div>}
              {!loadingArticles && articles.map(a => <button type='button' key={a.id} className='manual-guide-result' onClick={() => addArticle(a)}>
                <i className='mdi mdi-plus-circle text-primary'></i>
                <span className='flex-grow-1'><small className='text-muted me-1'>{a.code}</small>{a.name}</span>
                <span className='badge badge-soft-success flex-shrink-0'>{a.stock} {a.unit}</span>
              </button>)}
            </div>}
          </div>
          <div className='col-12 mb-2'>
            {items.length === 0
              ? <div className='text-muted small py-2'>Agrega productos desde el buscador. Se reservará su stock y el pedido irá al tablero de picking.</div>
              : <div>
                {items.map((it, idx) => <div className='manual-guide-item' key={it.article_id}>
                  <div className='manual-guide-item-name'><small className='text-muted me-1'>{it.code}</small>{it.name}<small className='text-muted d-block'>Disponible: {it.stock} {it.unit}</small></div>
                  <VdSelect noMargin value={`${it.presentation_id}`} onChange={(v) => setItem(idx, { presentation_id: v })}
                    clearable placeholder={it.unit} options={[...it.presentations.map(p => ({ value: `${p.id}`, label: `${p.name} (x${p.units})` }))]} />
                  <input type='number' step='0.001' min='0' aria-label='Cantidad' className={`form-control ${Number(it.quantity) <= 0 || Number(it.quantity) * itemUnits(it) > it.stock ? 'is-invalid' : ''}`} value={it.quantity} onChange={e => setItem(idx, { quantity: e.target.value })} />
                  <button type='button' className='vdt-btn-soft vdt-btn-icon' style={{ color: '#e24b4a' }} title='Quitar' onClick={() => removeItem(idx)}><i className='mdi mdi-delete'></i></button>
                </div>)}
              </div>}
          </div>
        </Section>

        <Section icon='mdi mdi-account' title='Destinatario'>
          <VdSelect col='col-md-3' label='Tipo doc.' required value={form.recipient_document_type} onChange={(v) => set({ recipient_document_type: v })}
            options={['RUC', 'DNI', 'CE'].map(v => ({ value: v, label: v }))} />
          <InputFormGroup col='col-md-4' label='N° documento' required {...bind('recipient_document_number')} />
          <InputFormGroup col='col-md-5' label='Teléfono' {...bind('recipient_phone')} />
          <InputFormGroup col='col-12' label='Nombre / Razón social' required {...bind('recipient_name')} />
        </Section>

        <Section icon='mdi mdi-map-marker-path' title='Traslado'>
          <VdSelect col='col-md-4' label='Motivo' value={form.transfer_reason} onChange={(v) => set({ transfer_reason: v })} options={REASONS.map(r => ({ value: r, label: r }))} />
          <VdSelect col='col-md-4' label='Modalidad' value={form.transfer_mode} onChange={(v) => set({ transfer_mode: v })}
            options={[{ value: 'private', label: 'Transporte privado' }, { value: 'public', label: 'Transporte público' }]} />
          <InputFormGroup col='col-md-4' label='Fecha de traslado' type='date' required {...bind('transfer_date')} />
          <div className='col-12'><small className='text-muted'>Punto de partida</small></div>
          <VdUbigeoCascade value={originUbigeo} onChange={setOriginUbigeo} />
          <InputFormGroup col='col-12' label='Dirección de partida' required {...bind('origin_address')} />
          <div className='col-12'><small className='text-muted'>Punto de llegada</small></div>
          <VdUbigeoCascade value={destUbigeo} onChange={setDestUbigeo} required />
          <InputFormGroup col='col-12' label='Dirección de llegada' required {...bind('destination_address')} />
        </Section>

        <Section icon='mdi mdi-truck' title='Conductor y vehículo'>
          <VdSelect col='col-md-6' label='Conductor' value={form.driver_id} onChange={(v) => set({ driver_id: v })}
            clearable placeholder='— Ingresar manual —' options={[...optionsOf(drivers, d => `${d.full_name} (${d.document_number})`)]} />
          <VdSelect col='col-md-6' label='Vehículo' value={form.vehicle_id} onChange={(v) => set({ vehicle_id: v })}
            clearable placeholder='— Ingresar placa manual —' options={[...optionsOf(vehicles, v => `${v.plate}${v.label && v.label !== v.plate ? ` (${v.label})` : ''}`)]} />
          {!form.driver_id && <>
            <InputFormGroup col='col-md-6' label='Nombre conductor' placeholder='Nombres y apellidos' {...bind('driver_name')} />
            <VdSelect col='col-md-2' label='Tipo doc.' value={form.driver_document_type} onChange={(v) => set({ driver_document_type: v })}
              options={['DNI', 'CE'].map(v => ({ value: v, label: v }))} />
            <InputFormGroup col='col-md-2' label='N° documento' {...bind('driver_document_number')} />
            <InputFormGroup col='col-md-2' label='N° brevete' {...bind('driver_license_number')} />
          </>}
          {!form.vehicle_id && <InputFormGroup col='col-md-4' label='Placa (manual)' placeholder='ABC123' {...bind('vehicle_plate', v => v.toUpperCase())} />}
        </Section>

        <Section icon='mdi mdi-package-variant' title='Bultos'>
          <InputFormGroup col='col-md-3' label='N° bultos' type='number' {...bind('package_count')} />
          <InputFormGroup col='col-md-3' label='Peso total (KGM)' type='number' step='0.001' placeholder='auto si 0' {...bind('gross_weight')} />
          <InputFormGroup col='col-md-6' label='Observaciones' {...bind('observations')} />
        </Section>
      </>}
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.hasRole('Admin') && !properties.can('referral_guides')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Guías manuales'><ManualGuides {...properties} /></BaseAdminto>)
})
