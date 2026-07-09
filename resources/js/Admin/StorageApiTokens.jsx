import React, { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import BaseAdminto from '@Adminto/Base'
import CreateReactScript from '../Utils/CreateReactScript'
import VdTable from '@Adminto/VdTable'
import VdSelect from '@Adminto/VdSelect'
import Modal from '@Adminto/Modal'
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup'
import Swal from 'sweetalert2'
import StorageApiTokensRest from '../Actions/Admin/StorageApiTokensRest'

const tokensRest = new StorageApiTokensRest()

const defaultAbilities = ['stock:read', 'orders:read', 'orders:write']

const normalizeDate = (value) => {
  if (!value) return ''
  return value.toString().slice(0, 10)
}

const formatDateTime = (value) => {
  if (!value) return ''
  const [date, time] = value.toString().split(/[ T]/)
  return time ? `${date} ${time.slice(0, 5)}` : date
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    Swal.fire({ icon: 'success', title: 'Token copiado', timer: 1400, showConfirmButton: false })
  } catch {
    Swal.fire({ icon: 'info', title: 'Copia manualmente el token', text })
  }
}

const showTokenDialog = async (token, title = 'Token de acceso') => {
  if (!token) return

  const escaped = token.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]))

  const result = await Swal.fire({
    title,
    html: `
      <div class="text-start">
        <label class="form-label">Token</label>
        <textarea class="form-control font-monospace" rows="4" readonly>${escaped}</textarea>
        <small class="text-muted d-block mt-2">Usar como Authorization: Bearer TOKEN</small>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Copiar',
    cancelButtonText: 'Cerrar',
    width: 720,
  })

  if (result.isConfirmed) await copyText(token)
}

const StorageApiTokens = ({ moduleTitle = 'Tokens acceso API', clients = [], abilityOptions = [], apiDocsUrl = '/api-docs/storage' }) => {
  const tableRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const nameRef = useRef()
  const expiresAtRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedAbilities, setSelectedAbilities] = useState(defaultAbilities)
  const [tokenEnabled, setTokenEnabled] = useState(true)

  const abilityChoices = useMemo(() => abilityOptions.length ? abilityOptions : [
    { value: 'stock:read', label: 'Consultar stock' },
    { value: 'orders:read', label: 'Consultar pedidos' },
    { value: 'orders:write', label: 'Crear pedidos' },
    { value: '*', label: 'Acceso completo' },
  ], [abilityOptions])

  const refresh = () => tableRef.current?.refresh()

  const resetForm = () => {
    idRef.current.value = ''
    setSelectedClientId('')
    nameRef.current.value = ''
    expiresAtRef.current.value = ''
    setSelectedAbilities(defaultAbilities)
    setTokenEnabled(true)
  }

  const openModal = (data = null) => {
    resetForm()
    setIsEditing(!!data?.id)

    if (data?.id) {
      idRef.current.value = data.id
      setSelectedClientId(data.client_id ? `${data.client_id}` : '')
      nameRef.current.value = data.name ?? ''
      expiresAtRef.current.value = normalizeDate(data.expires_at)
      setSelectedAbilities(data.abilities?.length ? data.abilities : defaultAbilities)
      setTokenEnabled(data.status !== false)
    }

    $(modalRef.current).modal('show')
  }

  const toggleAbility = (ability) => {
    if (ability === '*') {
      setSelectedAbilities(previous => previous.includes('*') ? defaultAbilities : ['*'])
      return
    }

    setSelectedAbilities(previous => {
      const withoutAll = previous.filter(item => item !== '*')
      if (withoutAll.includes(ability)) {
        const next = withoutAll.filter(item => item !== ability)
        return next.length ? next : defaultAbilities
      }
      return [...withoutAll, ability]
    })
  }

  const submitModal = async (event) => {
    event.preventDefault()

    if (!selectedClientId) {
      Swal.fire({ icon: 'warning', title: 'Falta cliente', text: 'Selecciona un cliente.', confirmButtonText: 'Entendido' })
      return
    }

    const payload = {
      id: idRef.current.value || undefined,
      client_id: selectedClientId,
      name: nameRef.current.value.trim(),
      expires_at: expiresAtRef.current.value || null,
      abilities: selectedAbilities,
      status: tokenEnabled,
    }

    const result = await tokensRest.save(payload)
    if (!result) return

    refresh()
    $(modalRef.current).modal('hide')

    if (result.data?.token) {
      await showTokenDialog(result.data.token, 'Token generado')
    }
  }

  const revealToken = async (data) => {
    const result = await tokensRest.reveal(data.id)
    if (!result?.token) return
    await showTokenDialog(result.token, `Token ${data.token_mask}`)
  }

  const renewToken = async (data) => {
    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: 'Renovar token',
      text: 'El token anterior dejara de funcionar para el sistema externo. Debes entregar el nuevo token al cliente.',
      showCancelButton: true,
      confirmButtonText: 'Renovar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return

    const result = await tokensRest.renew(data.id)
    if (!result?.token) return

    refresh()
    await showTokenDialog(result.token, 'Token renovado')
  }

  const deleteToken = async (data) => {
    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar token',
      text: 'El token dejara de aparecer y ya no podra usarse en la API.',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return

    const ok = await tokensRest.delete(data.id)
    if (ok) refresh()
  }

  const onBooleanChange = async ({ id, value }) => {
    const ok = await tokensRest.boolean({ id, field: 'status', value })
    if (ok) refresh()
  }

  const rowActions = (row) => [
    { icon: 'mdi mdi-eye', title: row.can_reveal ? 'Ver token' : 'No disponible, renovar', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => revealToken(r) },
    { icon: 'mdi mdi-refresh', title: 'Renovar token', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => renewToken(r) },
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => openModal(r) },
    { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => deleteToken(r) },
  ]

  return (<>
    <VdTable
      ref={tableRef}
      rest={tokensRest}
      icon="mdi mdi-key-variant"
      title={moduleTitle}
      unit="tokens"
      defaultPageSize={25}
      searchFields={['name', 'client_name', 'client_document_number', 'token_prefix']}
      searchPlaceholder="Buscar por cliente, nombre o token…"
      emptyText="No se encontraron tokens."
      headerActions={<>
        <button type="button" className="vdt-btn-soft" onClick={() => window.open(apiDocsUrl, '_blank')}>
          <i className="mdi mdi-book-open-page-variant"></i> Ver manual API
        </button>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => openModal()}>
          <i className="mdi mdi-plus"></i> Generar token
        </button>
      </>}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false },
        {
          key: 'cliente', label: 'Cliente', field: 'client_name',
          filter: { type: 'text', fields: ['client_name', 'client_document_number'] },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => openModal(row)} title="Editar token">
              {row.client_label}
            </a>
          ),
        },
        { key: 'nombre', label: 'Nombre', field: 'name', width: '180px', filter: { type: 'text' } },
        {
          key: 'token', label: 'Token', field: 'token_prefix', width: '140px', nowrap: true,
          filter: { type: 'text' },
          render: (row) => row.token_mask,
        },
        {
          key: 'permisos', label: 'Permisos', field: 'abilities', sortable: false, muted: true,
          render: (row) => row.abilities_label,
        },
        {
          key: 'expira', label: 'Expira', field: 'expires_at', width: '120px', filter: { type: 'date' },
          render: (row) => row.expires_at ? normalizeDate(row.expires_at) : <span className="text-muted">—</span>,
        },
        {
          key: 'ultimo_uso', label: 'Ultimo uso', field: 'last_used_at', width: '160px', filter: { type: 'date' },
          render: (row) => row.last_used_at ? formatDateTime(row.last_used_at) : <span className="text-muted">—</span>,
        },
        {
          key: 'estado', label: 'Activo', field: 'status', width: '100px',
          filter: { type: 'select', options: [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }] },
          render: (row) => <SwitchFormGroup noMargin checked={row.status === true} onChange={() => onBooleanChange({ id: row.id, value: !row.status })} />,
        },
        { key: 'creador', label: 'Creado por', field: 'creator_label', visible: false, sortable: false },
        { key: 'actualizador', label: 'Actualizado por', field: 'updater_label', visible: false, sortable: false },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => openModal(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.client_label}</p>
              <small className="text-muted">{row.name || 'Sin nombre'}</small>
            </div>
            <span className={`badge ${row.status ? 'badge-soft-success' : 'badge-soft-danger'}`}>{row.status ? 'Activo' : 'Inactivo'}</span>
          </div>
          <small className="text-muted d-block mt-2"><i className="mdi mdi-key-variant me-1"></i>{row.token_mask}</small>
          {row.abilities_label && <small className="text-muted d-block mt-1">{row.abilities_label}</small>}
          {row.expires_at && <small className="text-muted d-block mt-1"><i className="mdi mdi-calendar me-1"></i>Expira {normalizeDate(row.expires_at)}</small>}
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal
      modalRef={modalRef}
      title={isEditing ? 'Editar token de acceso' : 'Generar token de acceso'}
      onSubmit={submitModal}
      size='lg'
      btnSubmitText={isEditing ? 'Guardar cambios' : 'Generar token'}
    >
      <input ref={idRef} type='hidden' />

      <div className='row g-3'>
        <VdSelect
          label='Cliente'
          col='col-12'
          required
          disabled={isEditing}
          value={selectedClientId}
          onChange={setSelectedClientId}
          options={clients.map(client => ({ value: `${client.id}`, label: client.label }))}
          placeholder='-- Seleccionar cliente --'
        />
        {isEditing && <div className='col-12'><small className='text-muted'>Para otro cliente, genera un token nuevo.</small></div>}

        <div className='col-md-8'>
          <label className='form-label'>Nombre</label>
          <input ref={nameRef} className='form-control' placeholder='ERP Cliente, Integracion WMS, etc.' />
        </div>

        <div className='col-md-4'>
          <label className='form-label'>Expira</label>
          <input ref={expiresAtRef} className='form-control' type='date' />
        </div>

        <div className='col-12'>
          <label className='form-label'>Permisos</label>
          <div className='row g-2'>
            {abilityChoices.map(option => {
              const checked = selectedAbilities.includes(option.value)
              return (
                <div className='col-md-6' key={`storage-token-ability-${option.value}`}>
                  <label className={`border rounded px-3 py-2 d-flex align-items-center justify-content-between ${checked ? 'border-primary bg-primary-subtle' : 'bg-white'}`}>
                    <span>
                      <strong className='d-block'>{option.label}</strong>
                      <small className='text-muted'>{option.value}</small>
                    </span>
                    <input type='checkbox' checked={checked} onChange={() => toggleAbility(option.value)} />
                  </label>
                </div>
              )
            })}
          </div>
        </div>

        <div className='col-12'>
          <div className='form-check form-switch'>
            <input
              className='form-check-input'
              type='checkbox'
              id='storage-api-token-status'
              checked={tokenEnabled}
              onChange={(event) => setTokenEnabled(event.target.checked)}
            />
            <label className='form-check-label' htmlFor='storage-api-token-status'>Token activo</label>
          </div>
        </div>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('storage-api-tokens') && !properties.hasRole('Admin')) location.href = '/admin/'

  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Tokens acceso API'}>
    <StorageApiTokens {...properties} />
  </BaseAdminto>)
})
