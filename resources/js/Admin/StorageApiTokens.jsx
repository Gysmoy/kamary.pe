import React, { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import BaseAdminto from '@Adminto/Base'
import CreateReactScript from '../Utils/CreateReactScript'
import Table from '../Components/Adminto/Table'
import Modal from '../Components/Adminto/Modal'
import ReactAppend from '../Utils/ReactAppend'
import DxButton from '../Components/dx/DxButton'
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup'
import Swal from 'sweetalert2'
import StorageApiTokensRest from '../Actions/Admin/StorageApiTokensRest'
import renderGridEditLink from '../Utils/renderGridEditLink'

const tokensRest = new StorageApiTokensRest()

const defaultAbilities = ['stock:read', 'orders:read', 'orders:write']

const normalizeDate = (value) => {
  if (!value) return ''
  return value.toString().slice(0, 10)
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
  const gridRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const clientRef = useRef()
  const nameRef = useRef()
  const expiresAtRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [selectedAbilities, setSelectedAbilities] = useState(defaultAbilities)
  const [tokenEnabled, setTokenEnabled] = useState(true)

  const abilityChoices = useMemo(() => abilityOptions.length ? abilityOptions : [
    { value: 'stock:read', label: 'Consultar stock' },
    { value: 'orders:read', label: 'Consultar pedidos' },
    { value: 'orders:write', label: 'Crear pedidos' },
    { value: '*', label: 'Acceso completo' },
  ], [abilityOptions])

  const refreshGrid = () => $(gridRef.current).dxDataGrid('instance').refresh()

  const resetForm = () => {
    idRef.current.value = ''
    clientRef.current.value = ''
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
      clientRef.current.value = data.client_id ?? ''
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

    const payload = {
      id: idRef.current.value || undefined,
      client_id: clientRef.current.value,
      name: nameRef.current.value.trim(),
      expires_at: expiresAtRef.current.value || null,
      abilities: selectedAbilities,
      status: tokenEnabled,
    }

    const result = await tokensRest.save(payload)
    if (!result) return

    refreshGrid()
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

    refreshGrid()
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
    if (ok) refreshGrid()
  }

  const onBooleanChange = async ({ id, value }) => {
    const ok = await tokensRest.boolean({ id, field: 'status', value })
    if (ok) refreshGrid()
  }

  return (<>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={tokensRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'doc',
            text: 'Ver manual API',
            stylingMode: 'contained',
            type: 'default',
            hint: 'Ver documentacion API',
            elementAttr: {
              class: 'storage-api-manual-btn'
            },
            onClick: () => window.open(apiDocsUrl, '_blank')
          }
        })
        items.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: refreshGrid
          }
        })
        items.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'add',
            hint: 'Generar token',
            onClick: () => openModal()
          }
        })
      }}
      columns={[
        { dataField: 'id', caption: 'ID', visible: false },
        {
          dataField: 'client_label',
          caption: 'Cliente',
          minWidth: 240,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data.client_label, () => openModal(data), 'Editar token')
        },
        { dataField: 'name', caption: 'Nombre', width: 180 },
        { dataField: 'token_mask', caption: 'Token', width: 140 },
        { dataField: 'abilities_label', caption: 'Permisos', minWidth: 220 },
        { dataField: 'expires_at', caption: 'Expira', dataType: 'date', width: 120 },
        { dataField: 'last_used_at', caption: 'Ultimo uso', dataType: 'datetime', width: 160 },
        {
          dataField: 'status',
          caption: 'Activo',
          dataType: 'boolean',
          width: 100,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            ReactAppend(container, <SwitchFormGroup checked={data.status === true} onChange={() => onBooleanChange({ id: data.id, value: !data.status })} />)
          }
        },
        { dataField: 'creator_label', caption: 'Creado por', visible: false },
        { dataField: 'updater_label', caption: 'Actualizado por', visible: false },
        {
          caption: 'Acciones',
          width: 190,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-secondary',
              title: data.can_reveal ? 'Ver token' : 'No disponible, renovar',
              icon: 'mdi mdi-eye',
              onClick: () => revealToken(data)
            }))

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-warning',
              title: 'Renovar token',
              icon: 'mdi mdi-refresh',
              onClick: () => renewToken(data)
            }))

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => openModal(data)
            }))

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar',
              icon: 'mdi mdi-delete',
              onClick: () => deleteToken(data)
            }))
          }
        }
      ]}
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
        <div className='col-12'>
          <label className='form-label'>Cliente <b className='text-danger'>*</b></label>
          <select ref={clientRef} className='form-select' required disabled={isEditing}>
            <option value=''>Seleccione cliente</option>
            {clients.map(client => <option key={`storage-token-client-${client.id}`} value={client.id}>{client.label}</option>)}
          </select>
          {isEditing && <small className='text-muted'>Para otro cliente, genera un token nuevo.</small>}
        </div>

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
