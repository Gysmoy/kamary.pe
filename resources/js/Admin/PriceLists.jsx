import React, { createRef, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import PriceListsRest from '../Actions/Admin/PriceListsRest';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';

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

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  article_label: '',
  laboratory_id: '',
  laboratory_label: '',
  category: '',
  subcategory: '',
  fixed_price: '',
  margin_percent: '',
  minimum_quantity: 1,
})

const PriceLists = ({ requiredPermission = 'pricing' }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const businessRef = useRef()
  const branchRef = useRef()
  const warehouseRef = useRef()
  const clientRef = useRef()
  const eventualClientRef = useRef()
  const networkRef = useRef()
  const channelRef = useRef()
  const segmentRef = useRef()
  const currencyRef = useRef()
  const priorityRef = useRef()
  const startsAtRef = useRef()
  const endsAtRef = useRef()
  const observationsRef = useRef()
  const articleRefs = useRef({})
  const laboratoryRefs = useRef({})

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [branches, setBranches] = useState([])
  const [items, setItems] = useState([emptyItem()])

  const getArticleRef = (uid) => {
    if (!articleRefs.current[uid]) articleRefs.current[uid] = createRef()
    return articleRefs.current[uid]
  }

  const getLaboratoryRef = (uid) => {
    if (!laboratoryRefs.current[uid]) laboratoryRefs.current[uid] = createRef()
    return laboratoryRefs.current[uid]
  }

  useEffect(() => {
    items.forEach(item => {
      const articleRef = getArticleRef(item.uid)
      if (articleRef.current && item.article_id && item.article_label) {
        const current = $(articleRef.current).val()
        if (`${current}` !== `${item.article_id}`) SetSelectValue(articleRef.current, item.article_id, item.article_label)
      }

      const laboratoryRef = getLaboratoryRef(item.uid)
      if (laboratoryRef.current && item.laboratory_id && item.laboratory_label) {
        const current = $(laboratoryRef.current).val()
        if (`${current}` !== `${item.laboratory_id}`) SetSelectValue(laboratoryRef.current, item.laboratory_id, item.laboratory_label)
      }
    })
  }, [items])

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

  const clearForm = () => {
    if (idRef.current) idRef.current.value = ''
    if (codeRef.current) codeRef.current.value = 'Se genera al guardar'
    if (channelRef.current) channelRef.current.value = ''
    if (segmentRef.current) segmentRef.current.value = ''
    if (currencyRef.current) currencyRef.current.value = 'PEN'
    if (priorityRef.current) priorityRef.current.value = '100'
    if (startsAtRef.current) startsAtRef.current.value = ''
    if (endsAtRef.current) endsAtRef.current.value = ''
    if (observationsRef.current) observationsRef.current.value = ''
    SetSelectValue(businessRef.current, null)
    SetSelectValue(warehouseRef.current, null)
    SetSelectValue(clientRef.current, null)
    SetSelectValue(eventualClientRef.current, null)
    SetSelectValue(networkRef.current, null)
    setSelectedBusinessId('')
    setSelectedBranchId('')
    setSelectedClientId('')
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
      currencyRef.current.value = data.currency ?? 'PEN'
      priorityRef.current.value = data.priority ?? 100
      startsAtRef.current.value = data.starts_at ? data.starts_at.toString().slice(0, 10) : ''
      endsAtRef.current.value = data.ends_at ? data.ends_at.toString().slice(0, 10) : ''
      observationsRef.current.value = data.observations ?? ''

      const businessId = data.business_id ? `${data.business_id}` : ''
      const branchId = data.business_branch_id ? `${data.business_branch_id}` : ''
      const clientId = data.client_id ? `${data.client_id}` : ''
      setSelectedBusinessId(businessId)
      setSelectedClientId(clientId)

      if (businessId && data.business?.name) SetSelectValue(businessRef.current, businessId, data.business.name)
      if (data.warehouse_id && data.warehouse?.name) SetSelectValue(warehouseRef.current, `${data.warehouse_id}`, data.warehouse.name)
      if (clientId && data.client?.full_name) SetSelectValue(clientRef.current, clientId, data.client.full_name)
      if (data.eventual_client_id && data.eventual_client?.business_name) SetSelectValue(eventualClientRef.current, `${data.eventual_client_id}`, data.eventual_client.business_name)
      if (data.client_distribution_network_id && data.distribution_network?.name) SetSelectValue(networkRef.current, `${data.client_distribution_network_id}`, `${data.distribution_network.code ?? ''} - ${data.distribution_network.name}`)

      const detail = (data.items ?? []).map(row => ({
        uid: crypto.randomUUID(),
        article_id: row.article_id ? `${row.article_id}` : '',
        article_label: row.article ? `${row.article.code ?? ''} - ${row.article.name ?? ''}`.trim() : '',
        laboratory_id: row.laboratory_id ? `${row.laboratory_id}` : '',
        laboratory_label: row.laboratory?.name ?? '',
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

    const request = {
      id: idRef.current.value || undefined,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: warehouseRef.current?.value || null,
      client_id: clientRef.current?.value || null,
      eventual_client_id: eventualClientRef.current?.value || null,
      client_distribution_network_id: networkRef.current?.value || null,
      code: codeRef.current.value?.trim(),
      channel: channelRef.current.value?.trim(),
      segment: segmentRef.current.value?.trim(),
      currency: currencyRef.current.value || 'PEN',
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

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, value }) => {
    const result = await priceListsRest.boolean({ id, field: 'status', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
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
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table
      gridRef={gridRef}
      title='Tarifario'
      rest={priceListsRest}
      pageSize={20}
      toolBar={(container) => {
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
            hint: 'Agregar tarifario',
            onClick: () => onModalOpen()
          }
        });
      }}
      columns={[
        { dataField: 'id', caption: 'ID', width: 70 },
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 120,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar tarifario')
        },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 180 },
        { dataField: 'branch.name', caption: 'Sede', minWidth: 140, visible: false },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 140, visible: false },
        {
          dataField: 'scope',
          caption: 'Alcance',
          minWidth: 250,
          calculateCellValue: (data) => {
            const parts = []
            if (data.client?.full_name) parts.push(`Cliente: ${data.client.full_name}`)
            if (data.eventual_client?.business_name) parts.push(`Eventual: ${data.eventual_client.business_name}`)
            if (data.distribution_network?.name) parts.push(`Nodo: ${data.distribution_network.name}`)
            if (data.channel) parts.push(`Canal: ${data.channel}`)
            if (data.segment) parts.push(`Segmento: ${data.segment}`)
            return parts.join(' | ') || 'General'
          }
        },
        { dataField: 'currency', caption: 'Moneda', width: 90 },
        { dataField: 'priority', caption: 'Prioridad', width: 90 },
        {
          dataField: 'items_count',
          caption: 'Reglas',
          width: 80,
          calculateCellValue: (data) => (data.items ?? []).filter(item => item.status !== null).length
        },
        { dataField: 'starts_at', caption: 'Vigencia inicio', width: 110, dataType: 'date' },
        { dataField: 'ends_at', caption: 'Vigencia fin', width: 110, dataType: 'date' },
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
        {
          dataField: 'status',
          caption: 'Estado',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({ id: data.id, value: !data.status })} />)
          }
        },
        {
          caption: 'Acciones',
          width: 160,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger ms-1',
              title: 'Imprimir PDF',
              icon: 'mdi mdi-file-pdf-box',
              onClick: () => openMagistralesRecordPdf(buildMagistralesRows.priceList(data))
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger ms-1',
              title: 'Eliminar',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar tarifario' : 'Agregar tarifario'} onSubmit={onModalSubmit} size='xl' btnSubmitText='Guardar'>
      <div className='row' id='price-lists-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={codeRef} label='Codigo' col='col-md-3' />
        <SelectAPIFormGroup
          eRef={businessRef}
          label='Empresa'
          col='col-md-5'
          required
          searchAPI='/api/admin/businesses/paginate'
          searchBy='name'
          dropdownParent='#price-lists-container'
          onChange={async (e) => {
            const value = e.target.value || ''
            setSelectedBusinessId(value)
            await loadBranches(value)
          }}
        />
        <SelectFormGroup eRef={branchRef} label='Sede' col='col-md-4' value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value || '')} effectWith={[selectedBranchId, branches.length]}>
          <option value=''>Todas</option>
          {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </SelectFormGroup>

        <SelectAPIFormGroup
          eRef={warehouseRef}
          label='Almacen'
          col='col-md-4'
          searchAPI='/api/admin/warehouses/paginate'
          searchBy='name'
          filter={selectedBranchId ? ['business_branch_id', '=', Number(selectedBranchId)] : null}
          dropdownParent='#price-lists-container'
        />
        <SelectAPIFormGroup
          eRef={clientRef}
          label='Cliente regular'
          col='col-md-4'
          searchAPI='/api/admin/clients/paginate'
          searchBy='full_name'
          filter={['client_kind', '=', 'regular']}
          dropdownParent='#price-lists-container'
          onChange={(e) => setSelectedClientId(e.target.value || '')}
        />
        <SelectAPIFormGroup
          eRef={eventualClientRef}
          label='Cliente eventual'
          col='col-md-4'
          searchAPI='/api/admin/eventual-clients/paginate'
          searchBy='business_name'
          dropdownParent='#price-lists-container'
        />

        <SelectAPIFormGroup
          eRef={networkRef}
          label='Red de distribucion'
          col='col-md-4'
          searchAPI='/api/admin/client-distribution/paginate'
          searchBy='name'
          filter={selectedClientId ? ['client_id', '=', Number(selectedClientId)] : null}
          dropdownParent='#price-lists-container'
        />
        <InputFormGroup eRef={channelRef} label='Canal' col='col-md-2' />
        <InputFormGroup eRef={segmentRef} label='Segmento' col='col-md-2' />
        <SelectFormGroup eRef={currencyRef} label='Moneda' col='col-md-2'>
          <option value='PEN'>PEN</option>
          <option value='USD'>USD</option>
          <option value='EUR'>EUR</option>
        </SelectFormGroup>
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
                  <SelectAPIFormGroup
                    eRef={getArticleRef(item.uid)}
                    label='Articulo'
                    col='col-md-5'
                    searchAPI='/api/admin/articles/paginate'
                    searchBy='name'
                    dropdownParent='#price-lists-container'
                    onChange={(e) => updateItem(item.uid, {
                      article_id: e.target.value || '',
                      article_label: $(e.target).find('option:selected').text() || '',
                    })}
                  />
                  <SelectAPIFormGroup
                    eRef={getLaboratoryRef(item.uid)}
                    label='Laboratorio'
                    col='col-md-3'
                    searchAPI='/api/admin/laboratories/paginate'
                    searchBy='name'
                    dropdownParent='#price-lists-container'
                    onChange={(e) => updateItem(item.uid, {
                      laboratory_id: e.target.value || '',
                      laboratory_label: $(e.target).find('option:selected').text() || '',
                    })}
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
