import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Autocomplete, GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
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
import Global from '../Utils/Global';
import OrdersRest from '../Actions/Admin/OrdersRest';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';

const ordersRest = new OrdersRest()

const defaultMapPoint = { lat: -12.046374, lng: -77.042793 }

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
  article_unit: '',
  article_laboratory: '',
  article_principle: '',
  presentations: [],
  presentation_id: '',
  presentation_units: 1,
  stock: 0,
  price_unit: 0,
  quantity: 1,
  total: 0,
})

const floorPresentationStock = (stock, units) => {
  const s = Number(stock || 0)
  const u = Number(units || 1)
  if (u <= 0) return 0
  return Math.floor(s / u)
}

const Orders = () => {
  const gridRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const businessRef = useRef()
  const branchRef = useRef()
  const warehouseRef = useRef()
  const clientRef = useRef()
  const documentTypeRef = useRef()
  const currencyRef = useRef()
  const discountRef = useRef()
  const addressRef = useRef()
  const purchaseOrderRef = useRef()
  const guideNumberRef = useRef()
  const dispatchGuideRef = useRef()
  const ubigeoRef = useRef()
  const mapLatRef = useRef()
  const mapLngRef = useRef()
  const articleRefs = useRef({})
  const addressAutocompleteRef = useRef(null)

  const [isEditing, setIsEditing] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [branches, setBranches] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [mapPoint, setMapPoint] = useState(defaultMapPoint)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(1)

  const getArticleRef = (uid) => {
    if (!articleRefs.current[uid]) articleRefs.current[uid] = createRef()
    return articleRefs.current[uid]
  }

  useEffect(() => {
    items.forEach(item => {
      const ref = getArticleRef(item.uid)
      if (!ref.current || !item.article_id || !item.article_label) return
      const current = $(ref.current).val()
      if (`${current}` === `${item.article_id}`) return
      SetSelectValue(ref.current, item.article_id, item.article_label)
    })
  }, [items])

  const loadBranches = async (businessId, preferredId = null) => {
    if (!businessId) {
      setBranches([])
      setSelectedBranchId('')
      return
    }
    const data = await ordersRest.getBranchesByBusiness(businessId)
    const active = (data ?? []).filter(item => item.status !== null)
    setBranches(active)
    if (preferredId && active.some(item => `${item.id}` === `${preferredId}`)) {
      setSelectedBranchId(`${preferredId}`)
      return
    }
    setSelectedBranchId('')
  }

  const refreshItemStock = async (uid, articleId, warehouseId) => {
    if (!uid) return
    if (!articleId || !warehouseId) {
      setItems(prev => prev.map(item => item.uid === uid ? { ...item, stock: 0 } : item))
      return
    }
    const stockData = await ordersRest.getCurrentStock(articleId, warehouseId)
    setItems(prev => prev.map(item => item.uid === uid ? { ...item, stock: Number(stockData?.stock || 0) } : item))
  }

  const refreshAllStocks = async (warehouseId, currentItems = null) => {
    const current = currentItems ? [...currentItems] : [...items]
    for (const item of current) {
      await refreshItemStock(item.uid, item.article_id, warehouseId)
    }
  }

  const mapItemTotals = (item) => {
    const quantity = Number(item.quantity || 0)
    const price = Number(item.price_unit || 0)
    return {
      ...item,
      total: Number.isFinite(quantity * price) ? (quantity * price) : 0,
    }
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)

    setRefValue(idRef, data?.id ?? '')
    setRefValue(documentTypeRef, data?.document_type ?? 'Factura')
    setRefValue(currencyRef, data?.currency ?? 'PEN')
    const discount = Number(data?.discount_percent ?? 1)
    setDiscountPercent(discount)
    setRefValue(discountRef, discount)
    setRefValue(addressRef, data?.delivery_address ?? '')
    setRefValue(purchaseOrderRef, data?.purchase_order ?? '')
    setRefValue(guideNumberRef, data?.guide_number ?? '')
    setRefValue(dispatchGuideRef, data?.dispatch_guide ?? '')
    setRefValue(ubigeoRef, data?.ubigeo ?? '')
    setRefValue(mapLatRef, data?.map_lat ?? defaultMapPoint.lat)
    setRefValue(mapLngRef, data?.map_lng ?? defaultMapPoint.lng)

    const businessId = data?.business_id ? `${data.business_id}` : ''
    const warehouseId = data?.warehouse_id ? `${data.warehouse_id}` : ''
    const clientId = data?.client_id ? `${data.client_id}` : ''
    setSelectedBusinessId(businessId)
    setSelectedWarehouseId(warehouseId)
    setSelectedClientId(clientId)

    if (businessId && data?.business?.name) {
      SetSelectValue(businessRef.current, businessId, data.business.name)
    } else {
      $(businessRef.current).empty().trigger('change')
    }
    if (warehouseId && data?.warehouse?.name) {
      SetSelectValue(warehouseRef.current, warehouseId, data.warehouse.name)
    } else {
      $(warehouseRef.current).empty().trigger('change')
    }
    if (clientId && data?.client?.full_name) {
      SetSelectValue(clientRef.current, clientId, `${data.client.document_number ?? ''} - ${data.client.full_name}`.trim())
    } else {
      $(clientRef.current).empty().trigger('change')
    }

    const lat = Number(data?.map_lat ?? defaultMapPoint.lat)
    const lng = Number(data?.map_lng ?? defaultMapPoint.lng)
    setMapPoint({
      lat: Number.isFinite(lat) ? lat : defaultMapPoint.lat,
      lng: Number.isFinite(lng) ? lng : defaultMapPoint.lng
    })

    const detail = (data?.items ?? []).map(row => {
      const article = row.article ?? null
      const presentations = (article?.presentations ?? []).filter(p => p?.status !== false && p?.status !== 0)
      const selectedPresentation = row.presentation ?? presentations[0] ?? null
      const presentationUnits = Number(row.presentation_units ?? selectedPresentation?.units ?? 1) || 1
      const item = {
        uid: crypto.randomUUID(),
        article_id: row.article_id ? `${row.article_id}` : '',
        article_label: article ? `${article.code ?? ''} - ${article.name ?? ''}`.trim() : '',
        article_unit: article?.unit?.symbol ?? article?.unit?.name ?? '',
        article_laboratory: article?.laboratory?.name ?? '',
        article_principle: article?.activePrinciple?.name ?? article?.active_principle?.name ?? '',
        presentations: presentations.map(p => ({
          id: `${p.id}`,
          name: p.name ?? 'Presentacion',
          units: Number(p.units || 1),
          price: Number(p.price || 0),
        })),
        presentation_id: selectedPresentation?.id ? `${selectedPresentation.id}` : '',
        presentation_units: presentationUnits,
        stock: Number(row.stock || 0),
        price_unit: Number(row.price_unit || selectedPresentation?.price || 0),
        quantity: Number(row.quantity || 1),
        total: Number(row.total || 0),
      }
      return mapItemTotals(item)
    })

    const loadedItems = detail.length ? detail : [emptyItem()]
    setItems(loadedItems)

    $(modalRef.current).modal('show')
    await loadBranches(data?.business_id ?? null, data?.business_branch_id ?? null)
    await refreshAllStocks(warehouseId, loadedItems)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: getRefValue(idRef) || undefined,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      warehouse_id: selectedWarehouseId || null,
      client_id: selectedClientId || null,
      document_type: getRefValue(documentTypeRef) || 'Factura',
      currency: getRefValue(currencyRef) || 'PEN',
      discount_percent: Number(getRefValue(discountRef) || 1),
      delivery_address: getRefValue(addressRef).trim(),
      purchase_order: getRefValue(purchaseOrderRef).trim(),
      guide_number: getRefValue(guideNumberRef).trim(),
      dispatch_guide: getRefValue(dispatchGuideRef).trim(),
      ubigeo: getRefValue(ubigeoRef).trim(),
      map_lat: Number(getRefValue(mapLatRef) || defaultMapPoint.lat),
      map_lng: Number(getRefValue(mapLngRef) || defaultMapPoint.lng),
      items: items.map(item => ({
        article_id: item.article_id || null,
        presentation_id: item.presentation_id || null,
        warehouse_id: selectedWarehouseId || null,
        stock: item.stock,
        price_unit: item.price_unit,
        presentation_units: item.presentation_units,
        quantity: item.quantity,
        total: item.total,
        status: true,
      }))
    }

    const result = await ordersRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await ordersRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar pedido',
      text: 'Estas seguro de eliminar este pedido? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await ordersRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onBusinessChanged = async (e) => {
    const businessId = e.target.value || ''
    setSelectedBusinessId(businessId)
    await loadBranches(businessId, null)
  }

  const onWarehouseChanged = async (e) => {
    const warehouseId = e.target.value || ''
    setSelectedWarehouseId(warehouseId)
    await refreshAllStocks(warehouseId)
  }

  const onAddressPlaceChanged = () => {
    if (!addressAutocompleteRef.current) return
    const place = addressAutocompleteRef.current.getPlace()
    if (!place) return

    const formatted = (place.formatted_address ?? '').toString().trim()
    if (formatted) setRefValue(addressRef, formatted)

    const location = place.geometry?.location
    if (!location) return
    const lat = location.lat()
    const lng = location.lng()
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    setMapPoint({ lat, lng })
    setRefValue(mapLatRef, lat)
    setRefValue(mapLngRef, lng)
  }

  const onMapClick = (event) => {
    const lat = event?.latLng?.lat?.()
    const lng = event?.latLng?.lng?.()
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    setMapPoint({ lat, lng })
    setRefValue(mapLatRef, lat)
    setRefValue(mapLngRef, lng)
  }

  const onItemUpdated = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const next = { ...item, [field]: value }
      return mapItemTotals(next)
    }))
  }

  const onItemArticleChanged = async (uid, e) => {
    const selected = $(e.target).select2('data')?.[0]
    const article = selected?.data ?? null
    const articleId = e.target.value || ''

    if (!articleId) {
      onItemUpdated(uid, 'article_id', '')
      setItems(prev => prev.map(item => item.uid === uid ? {
        ...emptyItem(),
        uid: item.uid,
      } : item))
      return
    }

    const hydrated = article ?? await ordersRest.getArticleById(articleId)
    const presentations = (hydrated?.presentations ?? []).filter(p => p?.status !== false && p?.status !== 0)
    const defaultPresentation = presentations[0] ?? null
    const articleLabel = hydrated
      ? `${hydrated.code ?? ''} - ${hydrated.name ?? ''}`.trim()
      : (selected?.text ?? articleId)

    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      return mapItemTotals({
        ...item,
        article_id: articleId,
        article_label: articleLabel,
        article_unit: hydrated?.unit?.symbol ?? hydrated?.unit?.name ?? '',
        article_laboratory: hydrated?.laboratory?.name ?? '',
        article_principle: hydrated?.activePrinciple?.name ?? hydrated?.active_principle?.name ?? '',
        presentations: presentations.map(p => ({
          id: `${p.id}`,
          name: p.name ?? 'Presentacion',
          units: Number(p.units || 1),
          price: Number(p.price || 0),
        })),
        presentation_id: defaultPresentation ? `${defaultPresentation.id}` : '',
        presentation_units: Number(defaultPresentation?.units || 1),
        price_unit: Number(defaultPresentation?.price || item.price_unit || 0),
      })
    }))

    if (selectedWarehouseId) {
      await refreshItemStock(uid, articleId, selectedWarehouseId)
    }
  }

  const onItemPresentationChanged = (uid, presentationId) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const selectedPresentation = (item.presentations ?? []).find(p => `${p.id}` === `${presentationId}`) ?? null
      const next = {
        ...item,
        presentation_id: presentationId,
        presentation_units: Number(selectedPresentation?.units || 1),
      }
      if (selectedPresentation) next.price_unit = Number(selectedPresentation.price || 0)
      return mapItemTotals(next)
    }))
  }

  const onItemAdded = () => setItems(prev => [...prev, emptyItem()])
  const onItemRemoved = (uid) => {
    setItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyItem()]
    })
  }

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + Number(item.total || 0), 0), [items])
  const discountAmount = useMemo(() => subtotal * (Number(discountPercent || 0) / 100), [subtotal, discountPercent])
  const grandTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount])

  return (<>
    <Table
      gridRef={gridRef}
      title='Pedidos'
      rest={ordersRest}
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
            title: 'Agregar',
            hint: 'Agregar pedido',
            onClick: () => onModalOpen(null)
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'code', caption: 'Codigo', width: 105 },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 140 },
        { dataField: 'branch.name', caption: 'Sede', minWidth: 130 },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 130 },
        { dataField: 'client.full_name', caption: 'Cliente', minWidth: 220 },
        { dataField: 'document_type', caption: 'Tipo doc', width: 110 },
        { dataField: 'currency', caption: 'Moneda', width: 90 },
        { dataField: 'discount_percent', caption: 'Dscto. %', width: 90 },
        { dataField: 'ubigeo', caption: 'Ubigeo', width: 90 },
        { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        {
          dataField: 'items.id',
          caption: 'Items',
          minWidth: 280,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            const lines = (data?.items ?? []).map(item => `${item?.article?.name || 'Articulo'} | Cant. ${Number(item?.quantity || 0).toFixed(2)} | ${data.currency} ${Number(item?.total || 0).toFixed(2)}`)
            ReactAppend(container, <div>
              {lines.length === 0 && <small className='text-muted'>Sin detalle</small>}
              {lines.map((line, idx) => <div key={`order-${data.id}-${idx}`}><small>{line}</small></div>)}
            </div>)
          }
        },
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
        },
        {
          caption: 'Acciones',
          width: '150px',
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
              title: 'Imprimir pedido',
              icon: 'mdi mdi-file-pdf-box',
              onClick: () => openMagistralesRecordPdf(buildMagistralesRows.order(data))
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger ms-1',
              title: 'Eliminar pedido',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar pedido' : 'Agregar pedido'} onSubmit={onModalSubmit} size='full-width'>
      <div className='row' id='order-form-container'>
        <input ref={idRef} type='hidden' />
        <input ref={mapLatRef} type='hidden' />
        <input ref={mapLngRef} type='hidden' />

        <SelectAPIFormGroup
          eRef={businessRef}
          label='Empresa'
          col='col-md-3'
          required
          searchAPI='/api/admin/businesses/paginate'
          searchBy='name'
          dropdownParent='#order-form-container'
          onChange={onBusinessChanged}
        />
        <SelectFormGroup
          eRef={branchRef}
          label='Sede'
          col='col-md-3'
          dropdownParent='#order-form-container'
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          effectWith={[selectedBranchId, branches.length]}
        >
          <option value=''>-- Seleccione sede --</option>
          {branches.map(branch => <option key={`order-branch-${branch.id}`} value={branch.id}>{branch.name}</option>)}
        </SelectFormGroup>
        <SelectAPIFormGroup
          eRef={warehouseRef}
          label='Almacen'
          col='col-md-3'
          required
          searchAPI='/api/admin/warehouses/paginate'
          searchBy='name'
          dropdownParent='#order-form-container'
          onChange={onWarehouseChanged}
        />
        <SelectAPIFormGroup
          eRef={clientRef}
          label='Cliente'
          col='col-md-3'
          required
          searchAPI='/api/admin/clients/paginate'
          searchBy='full_name'
          dropdownParent='#order-form-container'
          onChange={(e) => setSelectedClientId(e.target.value || '')}
        />

        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Tipo documento</label>
          <select ref={documentTypeRef} className='form-control'>
            <option value='Factura'>Factura</option>
            <option value='Boleta'>Boleta</option>
            <option value='Ticket'>Ticket</option>
          </select>
        </div>
        <div className='form-group col-md-2 mb-2'>
          <label className='form-label'>Moneda</label>
          <select ref={currencyRef} className='form-control'>
            <option value='PEN'>PEN</option>
            <option value='USD'>USD</option>
            <option value='EUR'>EUR</option>
          </select>
        </div>
        <InputFormGroup
          eRef={discountRef}
          label='Descuento (%)'
          col='col-md-2'
          type='number'
          min='1'
          max='5'
          step='0.1'
          required
          value={discountPercent}
          onChange={(e) => {
            const value = Number(e.target.value || 1)
            const clamped = Math.min(5, Math.max(1, value))
            setDiscountPercent(clamped)
            setRefValue(discountRef, clamped)
          }}
        />
        <InputFormGroup eRef={purchaseOrderRef} label='Orden de compra' col='col-md-2' />
        <InputFormGroup eRef={guideNumberRef} label='Numero de guia' col='col-md-2' />
        <InputFormGroup eRef={dispatchGuideRef} label='Guia remision' col='col-md-2' />
        <InputFormGroup eRef={ubigeoRef} label='Ubigeo' col='col-md-2' />

        <div className='col-md-6 mb-2'>
          <label className='form-label'>Direccion (Google Maps)</label>
          {Global.GMAPS_API_KEY ? (
            <LoadScript
              googleMapsApiKey={Global.GMAPS_API_KEY}
              libraries={['places']}
              onLoad={() => setIsMapLoaded(true)}
            >
              <Autocomplete
                onLoad={(instance) => { addressAutocompleteRef.current = instance }}
                onPlaceChanged={onAddressPlaceChanged}
              >
                <input ref={addressRef} className='form-control' placeholder='Escribe una direccion' />
              </Autocomplete>
            </LoadScript>
          ) : (
            <input ref={addressRef} className='form-control' placeholder='Direccion' />
          )}
        </div>
        <div className='col-md-6 mb-2'>
          <label className='form-label'>Punto en mapa</label>
          {Global.GMAPS_API_KEY && isMapLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '220px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              center={mapPoint}
              zoom={15}
              onClick={onMapClick}
            >
              <Marker position={mapPoint} />
            </GoogleMap>
          ) : (
            <div className='border rounded px-3 py-2 small text-muted'>
              Configura `GMAPS_API_KEY` para habilitar el mapa.
            </div>
          )}
        </div>

        <div className='col-12 mt-3'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Items</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={onItemAdded}>
              <i className='mdi mdi-plus me-1'></i> Agregar linea
            </button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>Articulo</th>
                  <th>Lab. | Principio</th>
                  <th>Unidad</th>
                  <th>Presentacion</th>
                  <th>Stock</th>
                  <th>P. Unit.</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const presentationStock = floorPresentationStock(item.stock, item.presentation_units)
                  return (
                    <tr key={item.uid}>
                      <td style={{ width: '22%' }}>
                        <SelectAPIFormGroup
                          eRef={getArticleRef(item.uid)}
                          col='col-12'
                          searchAPI='/api/admin/articles/paginate'
                          searchBy='name'
                          dropdownParent='#order-form-container'
                          onChange={(e) => onItemArticleChanged(item.uid, e)}
                        />
                      </td>
                      <td><small>{`${item.article_laboratory || '-'} | ${item.article_principle || '-'}`}</small></td>
                      <td><small>{item.article_unit || '-'}</small></td>
                      <td style={{ minWidth: '170px' }}>
                        <select
                          className='form-control form-control-sm'
                          value={item.presentation_id}
                          onChange={(e) => onItemPresentationChanged(item.uid, e.target.value)}
                        >
                          <option value=''>-- Sin presentacion --</option>
                          {(item.presentations ?? []).map(presentation => (
                            <option key={`order-item-pres-${item.uid}-${presentation.id}`} value={presentation.id}>
                              {presentation.name} ({Number(presentation.units || 1).toFixed(2)} und.)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <small className='d-block'>{Number(item.stock || 0).toFixed(3)} und.</small>
                        <small className='text-muted'>{presentationStock} present.</small>
                      </td>
                      <td>
                        <input
                          className='form-control form-control-sm'
                          type='number'
                          min='0'
                          step='0.01'
                          value={item.price_unit}
                          onChange={(e) => onItemUpdated(item.uid, 'price_unit', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className='form-control form-control-sm'
                          type='number'
                          min='0.001'
                          step='0.001'
                          value={item.quantity}
                          onChange={(e) => onItemUpdated(item.uid, 'quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <input className='form-control form-control-sm' type='number' value={Number(item.total || 0).toFixed(2)} readOnly />
                      </td>
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
          <div className='d-flex justify-content-end mt-2'>
            <div className='text-end'>
              <div><strong>Subtotal:</strong> {Number(subtotal).toFixed(2)}</div>
              <div><strong>Descuento ({Number(discountPercent).toFixed(2)}%):</strong> -{Number(discountAmount).toFixed(2)}</div>
              <div><strong>Total:</strong> {Number(grandTotal).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('orders') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Pedidos'>
    <Orders {...properties} />
  </BaseAdminto>);
})

const setRefValue = (ref, value) => {
  if (!ref?.current) return
  ref.current.value = value
}
const getRefValue = (ref) => {
  if (!ref?.current) return ''
  return ref.current.value ?? ''
}
