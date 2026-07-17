import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import Swal from 'sweetalert2'
import BaseAdminto from '@Adminto/Base'
import CreateReactScript from '../Utils/CreateReactScript'
import Table from '../Components/Adminto/Table'
import Modal from '../Components/Adminto/Modal'
import DxButton from '../Components/dx/DxButton'
import UbigeoCascade from '../Components/Adminto/Form/UbigeoCascade'
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
const UNITS = [
  { code: 'NIU', label: 'Unidad (NIU)' },
  { code: 'BX', label: 'Caja (BX)' },
  { code: 'KGM', label: 'Kilogramo (KGM)' },
  { code: 'ZZ', label: 'Servicio (ZZ)' },
]

const statusBadge = (container, guide) => {
  const s = (guide?.guide_status || '').toLowerCase()
  const map = {
    accepted: ['Aceptada', 'success'],
    sent: ['Enviada', 'info'],
    rejected: ['Rechazada', 'danger'],
    observed: ['Observada', 'warning'],
    cancelled: ['Anulada', 'secondary'],
    prepared: ['Borrador', 'secondary'],
    pending: ['Pendiente', 'secondary'],
  }
  const [label, color] = map[s] || [guide?.external_status || s || '-', 'secondary']
  container.html(`<span class="badge bg-soft-${color} text-${color} border border-${color}">${label}</span>`)
}

const emptyItem = () => ({ item_code: '', description: '', unit: 'NIU', quantity: 1, gross_weight: 0 })

const ManualGuides = ({ manualBusinesses = [], manualDrivers = [], manualVehicles = [] }) => {
  const gridRef = React.useRef()
  const modalRef = React.useRef()

  const defaultBusiness = useMemo(() => {
    const medical = manualBusinesses.find(b => String(b.tax_number) === '20604718237')
    return medical?.id ?? manualBusinesses[0]?.id ?? ''
  }, [manualBusinesses])

  const [form, setForm] = useState(null)
  const [items, setItems] = useState([emptyItem()])
  const [originUbigeo, setOriginUbigeo] = useState(EMPTY_UBIGEO_SELECTION)
  const [destUbigeo, setDestUbigeo] = useState(EMPTY_UBIGEO_SELECTION)
  const [saving, setSaving] = useState(false)

  const business = manualBusinesses.find(b => String(b.id) === String(form?.business_id))
  const branches = business?.branches ?? []
  const drivers = manualDrivers.filter(d => String(d.business_id) === String(form?.business_id))
  const vehicles = manualVehicles.filter(v => String(v.business_id) === String(form?.business_id))

  const set = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const openModal = () => {
    const bid = defaultBusiness
    const biz = manualBusinesses.find(b => String(b.id) === String(bid))
    const branch = biz?.branches?.[0]
    const bizDrivers = manualDrivers.filter(d => String(d.business_id) === String(bid))
    setForm({
      business_id: bid,
      business_branch_id: branch?.id ?? '',
      recipient_document_type: 'RUC',
      recipient_document_number: '',
      recipient_name: '',
      recipient_phone: '',
      transfer_reason: 'VENTA',
      transfer_mode: 'private',
      transfer_date: new Date().toISOString().slice(0, 10),
      origin_address: branch?.address ?? '',
      destination_address: '',
      driver_id: bizDrivers[0]?.id ?? '',
      driver_name: '', driver_document_type: 'DNI', driver_document_number: '', driver_license_number: '',
      vehicle_id: '',
      vehicle_plate: '',
      package_count: 1,
      gross_weight: 0,
      observations: '',
    })
    setItems([emptyItem()])
    setOriginUbigeo(branch?.ubigeo ? { ...EMPTY_UBIGEO_SELECTION, ubigeo: branch.ubigeo } : EMPTY_UBIGEO_SELECTION)
    setDestUbigeo(EMPTY_UBIGEO_SELECTION)
    $(modalRef.current).modal('show')
  }

  const onBusinessChange = (bid) => {
    const biz = manualBusinesses.find(b => String(b.id) === String(bid))
    const branch = biz?.branches?.[0]
    const bizDrivers = manualDrivers.filter(d => String(d.business_id) === String(bid))
    set({
      business_id: bid,
      business_branch_id: branch?.id ?? '',
      origin_address: branch?.address ?? '',
      driver_id: bizDrivers[0]?.id ?? '',
      vehicle_id: '',
    })
    setOriginUbigeo(branch?.ubigeo ? { ...EMPTY_UBIGEO_SELECTION, ubigeo: branch.ubigeo } : EMPTY_UBIGEO_SELECTION)
  }

  const onBranchChange = (branchId) => {
    const branch = branches.find(b => String(b.id) === String(branchId))
    set({ business_branch_id: branchId, origin_address: branch?.address ?? form.origin_address })
    if (branch?.ubigeo) setOriginUbigeo({ ...EMPTY_UBIGEO_SELECTION, ubigeo: branch.ubigeo })
  }

  const setItem = (idx, patch) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (idx) => setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const branch = branches.find(b => String(b.id) === String(form.business_branch_id))
    if (branch && !branch.synced) {
      const { isConfirmed } = await Swal.fire({
        title: 'Sede sin sincronizar',
        text: `La sede "${branch.name}" no está sincronizada con el facturador; SUNAT rechazará la guía. ¿Continuar igual?`,
        icon: 'warning', showCancelButton: true, confirmButtonText: 'Continuar', cancelButtonText: 'Cancelar'
      })
      if (!isConfirmed) return
    }

    const payload = {
      ...form,
      origin_ubigeo: originUbigeo?.ubigeo || '',
      destination_ubigeo: destUbigeo?.ubigeo || '',
      items: items.filter(it => it.description.trim() !== ''),
    }
    if (payload.items.length === 0) { toast.error('Error', { description: 'Agrega al menos un ítem', richColors: true }); return }
    if (!payload.recipient_name.trim()) { toast.error('Error', { description: 'Falta el destinatario', richColors: true }); return }
    if (!payload.destination_address.trim()) { toast.error('Error', { description: 'Falta la dirección de llegada', richColors: true }); return }
    if (!payload.vehicle_id && !payload.vehicle_plate.trim()) { toast.error('Error', { description: 'Selecciona un vehículo o ingresa la placa', richColors: true }); return }

    setSaving(true)
    try {
      const created = await referralGuidesRest.createManual(payload)
      if (!created?.data?.id) return
      const emitted = await referralGuidesRest.issue(created.data.id)
      $(gridRef.current).dxDataGrid('instance').refresh()
      if (emitted) $(modalRef.current).modal('hide')
    } finally {
      setSaving(false)
    }
  }

  const onIssue = async (id) => {
    const r = await referralGuidesRest.issue(id)
    if (r) $(gridRef.current).dxDataGrid('instance').refresh()
  }
  const onCancel = async (id) => {
    const { isConfirmed, value } = await Swal.fire({
      title: 'Anular guía', input: 'text', inputLabel: 'Motivo', showCancelButton: true,
      confirmButtonText: 'Anular', cancelButtonText: 'Cerrar'
    })
    if (!isConfirmed) return
    const r = await referralGuidesRest.cancel(id, value || 'Anulación')
    if (r) $(gridRef.current).dxDataGrid('instance').refresh()
  }

  if (!form && manualBusinesses.length === 0) {
    return <div className='alert alert-warning'>No hay empresas configuradas.</div>
  }

  return <>
    <Table
      gridRef={gridRef}
      title={<h4 className='header-title mb-0'>Guías de remisión manuales</h4>}
      rest={referralGuidesRest}
      pageSize={10}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { text: 'Nueva guía manual', icon: 'add', type: 'success', onClick: openModal } })
      }}
      columns={[
        { caption: 'Acciones', width: 175, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css('text-overflow', 'unset')
          const st = (data.guide_status || '').toLowerCase()
          if (!['accepted', 'cancelled'].includes(st)) {
            container.append(DxButton({ className: 'btn btn-xs btn-soft-success', title: 'Emitir', icon: 'mdi mdi-send', onClick: () => onIssue(data.id) }))
          }
          if (st === 'accepted') {
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Anular', icon: 'mdi mdi-cancel', onClick: () => onCancel(data.id) }))
          }
          container.append(DxButton({ className: 'btn btn-xs btn-soft-primary ms-1', title: 'PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => window.open(referralGuidesRest.downloadUrl(data.id, 'pdf'), '_blank') }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-info ms-1', title: 'XML', icon: 'mdi mdi-xml', onClick: () => window.open(referralGuidesRest.downloadUrl(data.id, 'xml'), '_blank') }))
        } },
        { dataField: 'external_reference', caption: 'Serie-Número', width: 130 },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 150, cellTemplate: (c, { data }) => c.text(data.business?.name ?? '-') },
        { dataField: 'recipient_name', caption: 'Destinatario', minWidth: 180 },
        { dataField: 'guide_status', caption: 'Estado SUNAT', width: 130, cellTemplate: (c, { data }) => statusBadge(c, data) },
        { dataField: 'issue_date', caption: 'Emisión', width: 110, dataType: 'date', format: 'yyyy-MM-dd' },
      ]}
    />

    <Modal modalRef={modalRef} title='Nueva guía de remisión manual' size='xl' onSubmit={onSubmit} btnSubmitText={saving ? 'Emitiendo...' : 'Crear y emitir'}>
      {form && <div className='row'>
        <div className='col-md-6 mb-2'>
          <label className='form-label'>Empresa</label>
          <select className='form-control' value={form.business_id} onChange={e => onBusinessChange(e.target.value)}>
            {manualBusinesses.map(b => <option key={b.id} value={b.id}>{b.name} ({b.tax_number})</option>)}
          </select>
        </div>
        <div className='col-md-6 mb-2'>
          <label className='form-label'>Sede (punto de partida)</label>
          <select className='form-control' value={form.business_branch_id} onChange={e => onBranchChange(e.target.value)}>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name} — cod {b.establishment_code || '—'}{b.synced ? '' : ' (sin sync)'}</option>)}
          </select>
        </div>

        <div className='col-12'><hr className='my-2' /><h5 className='mb-2'>Destinatario</h5></div>
        <div className='col-md-2 mb-2'>
          <label className='form-label'>Tipo doc.</label>
          <select className='form-control' value={form.recipient_document_type} onChange={e => set({ recipient_document_type: e.target.value })}>
            <option value='RUC'>RUC</option><option value='DNI'>DNI</option><option value='CE'>CE</option>
          </select>
        </div>
        <div className='col-md-3 mb-2'><label className='form-label'>N° documento</label><input className='form-control' value={form.recipient_document_number} onChange={e => set({ recipient_document_number: e.target.value })} /></div>
        <div className='col-md-5 mb-2'><label className='form-label'>Nombre / Razón social</label><input className='form-control' value={form.recipient_name} onChange={e => set({ recipient_name: e.target.value })} /></div>
        <div className='col-md-2 mb-2'><label className='form-label'>Teléfono</label><input className='form-control' value={form.recipient_phone} onChange={e => set({ recipient_phone: e.target.value })} /></div>

        <div className='col-12'><hr className='my-2' /><h5 className='mb-2'>Traslado</h5></div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Motivo</label>
          <select className='form-control' value={form.transfer_reason} onChange={e => set({ transfer_reason: e.target.value })}>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Modalidad</label>
          <select className='form-control' value={form.transfer_mode} onChange={e => set({ transfer_mode: e.target.value })}>
            <option value='private'>Transporte privado</option>
            <option value='public'>Transporte público</option>
          </select>
        </div>
        <div className='col-md-4 mb-2'><label className='form-label'>Fecha de traslado</label><input type='date' className='form-control' value={form.transfer_date} onChange={e => set({ transfer_date: e.target.value })} /></div>

        <div className='col-12 mt-1'><label className='form-label mb-1 text-muted'>Punto de partida (ubigeo)</label></div>
        <div className='col-12'><UbigeoCascade value={originUbigeo} onChange={setOriginUbigeo} /></div>
        <div className='col-12 mb-2'><label className='form-label'>Dirección de partida</label><input className='form-control' value={form.origin_address} onChange={e => set({ origin_address: e.target.value })} /></div>

        <div className='col-12 mt-1'><label className='form-label mb-1 text-muted'>Punto de llegada (ubigeo)</label></div>
        <div className='col-12'><UbigeoCascade value={destUbigeo} onChange={setDestUbigeo} /></div>
        <div className='col-12 mb-2'><label className='form-label'>Dirección de llegada</label><input className='form-control' value={form.destination_address} onChange={e => set({ destination_address: e.target.value })} /></div>

        <div className='col-12'><hr className='my-2' /><h5 className='mb-2'>Conductor y vehículo</h5></div>
        <div className='col-md-6 mb-2'>
          <label className='form-label'>Conductor</label>
          <select className='form-control' value={form.driver_id} onChange={e => set({ driver_id: e.target.value })}>
            <option value=''>— Ingresar manual —</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.document_number})</option>)}
          </select>
        </div>
        <div className='col-md-6 mb-2'>
          <label className='form-label'>Vehículo</label>
          <select className='form-control' value={form.vehicle_id} onChange={e => set({ vehicle_id: e.target.value })}>
            <option value=''>— Ingresar placa manual —</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate}{v.label && v.label !== v.plate ? ` (${v.label})` : ''}</option>)}
          </select>
        </div>
        {!form.driver_id && <>
          <div className='col-md-3 mb-2'><label className='form-label'>Nombre conductor</label><input className='form-control' value={form.driver_name} onChange={e => set({ driver_name: e.target.value })} placeholder='Nombres y apellidos' /></div>
          <div className='col-md-3 mb-2'>
            <label className='form-label'>Tipo doc.</label>
            <select className='form-control' value={form.driver_document_type} onChange={e => set({ driver_document_type: e.target.value })}><option value='DNI'>DNI</option><option value='CE'>CE</option></select>
          </div>
          <div className='col-md-3 mb-2'><label className='form-label'>N° documento</label><input className='form-control' value={form.driver_document_number} onChange={e => set({ driver_document_number: e.target.value })} /></div>
          <div className='col-md-3 mb-2'><label className='form-label'>N° brevete</label><input className='form-control' value={form.driver_license_number} onChange={e => set({ driver_license_number: e.target.value })} /></div>
        </>}
        {!form.vehicle_id && <div className='col-md-4 mb-2'><label className='form-label'>Placa (manual)</label><input className='form-control' value={form.vehicle_plate} onChange={e => set({ vehicle_plate: e.target.value.toUpperCase() })} placeholder='ABC123' /></div>}

        <div className='col-12'><hr className='my-2' /><h5 className='mb-2'>Bienes a trasladar</h5></div>
        {items.map((it, idx) => <div className='row g-1 align-items-end mb-1' key={idx}>
          <div className='col-md-2'><label className='form-label mb-0 small'>Código</label><input className='form-control form-control-sm' value={it.item_code} onChange={e => setItem(idx, { item_code: e.target.value })} /></div>
          <div className='col-md-4'><label className='form-label mb-0 small'>Descripción</label><input className='form-control form-control-sm' value={it.description} onChange={e => setItem(idx, { description: e.target.value })} /></div>
          <div className='col-md-2'><label className='form-label mb-0 small'>Unidad</label>
            <select className='form-control form-control-sm' value={it.unit} onChange={e => setItem(idx, { unit: e.target.value })}>{UNITS.map(u => <option key={u.code} value={u.code}>{u.label}</option>)}</select>
          </div>
          <div className='col-md-2'><label className='form-label mb-0 small'>Cantidad</label><input type='number' step='0.001' className='form-control form-control-sm' value={it.quantity} onChange={e => setItem(idx, { quantity: e.target.value })} /></div>
          <div className='col-md-1'><label className='form-label mb-0 small'>Peso</label><input type='number' step='0.001' className='form-control form-control-sm' value={it.gross_weight} onChange={e => setItem(idx, { gross_weight: e.target.value })} /></div>
          <div className='col-md-1'><button type='button' className='btn btn-sm btn-soft-danger w-100' onClick={() => removeItem(idx)}><i className='mdi mdi-delete' /></button></div>
        </div>)}
        <div className='col-12 mb-2'><button type='button' className='btn btn-sm btn-soft-primary' onClick={addItem}><i className='mdi mdi-plus' /> Agregar ítem</button></div>

        <div className='col-md-3 mb-2'><label className='form-label'>N° bultos</label><input type='number' className='form-control' value={form.package_count} onChange={e => set({ package_count: e.target.value })} /></div>
        <div className='col-md-3 mb-2'><label className='form-label'>Peso total (KGM)</label><input type='number' step='0.001' className='form-control' value={form.gross_weight} onChange={e => set({ gross_weight: e.target.value })} placeholder='auto si 0' /></div>
        <div className='col-md-6 mb-2'><label className='form-label'>Observaciones</label><input className='form-control' value={form.observations} onChange={e => set({ observations: e.target.value })} /></div>
      </div>}
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.hasRole('Admin') && !properties.can('referral_guides')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Guías manuales'><ManualGuides {...properties} /></BaseAdminto>)
})
