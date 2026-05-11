import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import Table from '../../Components/Adminto/Table';
import Modal from '../../Components/Adminto/Modal';
import ReactAppend from '../../Utils/ReactAppend';
import DxButton from '../../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import SalesRest from '../../Actions/Admin/Magistrales/SalesRest';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../../Utils/magistralesRecordPdf';

const rest = new SalesRest()
const paymentLabels = { pending: 'Pendiente', paid: 'Pagado', partial: 'Parcial', cancelled: 'Cancelado' }

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  warehouse_id: '',
  description: '',
  stock: 0,
  quantity: 1,
  unit_price: 0,
  discount: 0,
})

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const formatDocument = (row) => [row?.document_type, row?.document_number].filter(Boolean).join(' ')
const itemSubtotal = (item) => Math.max(0, (Number(item.quantity || 0) * Number(item.unit_price || 0)) - Number(item.discount || 0))

const Sales = ({ moduleTitle = 'Magistrales - Ventas' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const pharmacyRef = useRef()
  const businessRef = useRef()
  const paymentStatusRef = useRef()
  const documentTypeRef = useRef()
  const documentNumberRef = useRef()
  const patientRef = useRef()
  const doctorRef = useRef()
  const discountPolicyRef = useRef()
  const saleTypeRef = useRef()
  const allergyRef = useRef()
  const intoleranceRef = useRef()
  const dateRef = useRef()
  const [businesses, setBusinesses] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [articles, setArticles] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    Promise.all([rest.getBusinesses(), rest.getWarehouses(), rest.getArticles()]).then(([businessRows, warehouseRows, articleRows]) => {
      setBusinesses((businessRows ?? []).filter(row => row.status !== null))
      setWarehouses((warehouseRows ?? []).filter(row => row.status !== null))
      setArticles((articleRows ?? []).filter(row => row.status !== null))
    })
  }, [])

  const totals = items.reduce((carry, item) => {
    carry.discount += Number(item.discount || 0)
    carry.total += itemSubtotal(item)
    return carry
  }, { discount: 0, total: 0 })
  totals.taxable = totals.total / 1.18
  totals.igv = totals.total - totals.taxable

  const openModal = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    pharmacyRef.current.value = data?.pharmacy ?? ''
    businessRef.current.value = data?.business_id ?? ''
    paymentStatusRef.current.value = data?.payment_status ?? 'pending'
    documentTypeRef.current.value = data?.document_type ?? 'Boleta'
    documentNumberRef.current.value = data?.document_number ?? ''
    patientRef.current.value = data?.patient ?? ''
    doctorRef.current.value = data?.doctor ?? ''
    discountPolicyRef.current.value = data?.discount_policy ?? ''
    saleTypeRef.current.value = data?.sale_type ?? 'venta'
    allergyRef.current.checked = !!data?.allergy
    intoleranceRef.current.checked = !!data?.intolerance
    dateRef.current.value = data?.sale_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    const nextItems = (data?.items ?? []).map(item => ({
      uid: crypto.randomUUID(),
      article_id: item.article_id ?? '',
      warehouse_id: item.warehouse_id ?? '',
      description: item.description ?? item.article?.name ?? '',
      stock: item.stock ?? 0,
      quantity: item.quantity ?? 1,
      unit_price: item.unit_price ?? 0,
      discount: item.discount ?? 0,
    }))
    setItems(nextItems.length ? nextItems : [emptyItem()])
    $(modalRef.current).modal('show')
  }

  const updateItem = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const next = { ...item, [field]: value }
      if (field === 'article_id') {
        const article = articles.find(row => `${row.id}` === `${value}`)
        next.description = article?.name ?? ''
        next.unit_price = article?.sale_price ?? next.unit_price
      }
      return next
    }))
  }

  const removeItem = (uid) => {
    setItems(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyItem()]
    })
  }

  const save = async (e, asQuote = false) => {
    e.preventDefault()
    const result = await rest.save({
      id: idRef.current.value || undefined,
      code: isEditing ? codeRef.current.value.trim() : '',
      pharmacy: pharmacyRef.current.value.trim(),
      business_id: businessRef.current.value || null,
      payment_status: paymentStatusRef.current.value,
      document_type: documentTypeRef.current.value.trim(),
      document_number: documentNumberRef.current.value.trim(),
      patient: patientRef.current.value.trim(),
      doctor: doctorRef.current.value.trim(),
      discount_policy: discountPolicyRef.current.value.trim(),
      sale_type: saleTypeRef.current.value.trim(),
      allergy: allergyRef.current.checked,
      intolerance: intoleranceRef.current.checked,
      is_quote: asQuote,
      sale_date: dateRef.current.value || null,
      items: items.map(item => ({
        article_id: item.article_id || null,
        warehouse_id: item.warehouse_id || null,
        description: (item.description ?? '').toString().trim(),
        stock: item.stock,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
      })),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar venta', text: 'Se dara de baja la venta magistral.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await rest.delete(id)
    if (result) $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={rest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => openModal() } })
      }}
      columns={[
        { dataField: 'business.name', caption: 'Empresa', minWidth: 170 },
        { dataField: 'code', caption: 'Codigo', width: 145 },
        { dataField: 'payment_status', caption: 'Estado Pago', width: 120, calculateCellValue: row => paymentLabels[row.payment_status] ?? row.payment_status },
        { dataField: 'document_label', caption: 'Documento', width: 160, calculateCellValue: formatDocument },
        { dataField: 'patient', caption: 'Paciente', minWidth: 170 },
        { dataField: 'total', caption: 'Total S/', dataType: 'number', width: 110, format: { type: 'fixedPoint', precision: 2 } },
        { dataField: 'creator_label', caption: 'Usuario Registro', minWidth: 160, calculateCellValue: row => formatUser(row.creator) },
        { dataField: 'created_at', caption: 'Fecha Registro', dataType: 'date', width: 130 },
        {
          dataField: 'status',
          caption: 'Activo',
          dataType: 'boolean',
          width: 90,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => rest.status(data).then(ok => ok && $(gridRef.current).dxDataGrid('instance').refresh())} />)
          }
        },
        {
          caption: 'Acciones',
          width: 160,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.sale(data)) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary ms-1', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => remove(data.id) }))
          }
        },
      ]}
    />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar venta magistral' : 'Registrar venta'} onSubmit={(e) => save(e, false)} size='xl'>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' disabled={!isEditing} /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Empresa</label><select ref={businessRef} className='form-control'><option value=''>Seleccione</option>{businesses.map(row => <option key={`mag-sale-business-${row.id}`} value={row.id}>{row.name}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Farmacia</label><input ref={pharmacyRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Estado pago</label><select ref={paymentStatusRef} className='form-control'>{Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Paciente</label><input ref={patientRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Doctor</label><input ref={doctorRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Tipo doc.</label><input ref={documentTypeRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Documento</label><input ref={documentNumberRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Fecha</label><input ref={dateRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Politica descuento</label><input ref={discountPolicyRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Tipo venta</label><input ref={saleTypeRef} className='form-control' /></div>
        <div className='col-md-3 mb-3 form-check mt-4'><input ref={allergyRef} type='checkbox' className='form-check-input' id='magSaleAllergy' /><label className='form-check-label' htmlFor='magSaleAllergy'>Alergia</label></div>
        <div className='col-md-3 mb-3 form-check mt-4'><input ref={intoleranceRef} type='checkbox' className='form-check-input' id='magSaleIntolerance' /><label className='form-check-label' htmlFor='magSaleIntolerance'>Intolerancia</label></div>

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Detalle de venta</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}><i className='mdi mdi-plus me-1'></i> Insertar articulo</button>
          </div>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th style={{ minWidth: 230 }}>Articulo</th>
                  <th style={{ minWidth: 150 }}>Almacen</th>
                  <th style={{ width: 100 }}>Stock</th>
                  <th style={{ width: 110 }}>Cantidad</th>
                  <th style={{ width: 110 }}>Precio</th>
                  <th style={{ width: 110 }}>Dscto</th>
                  <th style={{ width: 120 }}>Subtotal</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.uid}>
                    <td><select className='form-control form-control-sm' value={item.article_id} onChange={(e) => updateItem(item.uid, 'article_id', e.target.value)}><option value=''>Articulo</option>{articles.map(article => <option key={`sale-article-${article.id}`} value={article.id}>{article.code} - {article.name}</option>)}</select></td>
                    <td><select className='form-control form-control-sm' value={item.warehouse_id} onChange={(e) => updateItem(item.uid, 'warehouse_id', e.target.value)}><option value=''>Almacen</option>{warehouses.map(warehouse => <option key={`sale-wh-${warehouse.id}`} value={warehouse.id}>{warehouse.name}</option>)}</select></td>
                    <td><input className='form-control form-control-sm' type='number' step='0.001' value={item.stock} onChange={(e) => updateItem(item.uid, 'stock', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.unit_price} onChange={(e) => updateItem(item.uid, 'unit_price', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.discount} onChange={(e) => updateItem(item.uid, 'discount', e.target.value)} /></td>
                    <td>S/ {itemSubtotal(item).toFixed(2)}</td>
                    <td><button type='button' className='btn btn-xs btn-soft-danger' onClick={() => removeItem(item.uid)}><i className='mdi mdi-delete'></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='d-flex justify-content-end mt-2'>
            <div style={{ minWidth: 280 }}>
              <div className='d-flex justify-content-between'><span>Gravada</span><b>S/ {totals.taxable.toFixed(2)}</b></div>
              <div className='d-flex justify-content-between'><span>Descuento</span><b>S/ {totals.discount.toFixed(2)}</b></div>
              <div className='d-flex justify-content-between'><span>IGV</span><b>S/ {totals.igv.toFixed(2)}</b></div>
              <div className='d-flex justify-content-between'><span>Total</span><b>S/ {totals.total.toFixed(2)}</b></div>
              <div className='d-flex gap-2 justify-content-end mt-2'>
                <button type='button' className='btn btn-sm btn-outline-primary' onClick={(e) => save(e, true)}>Registrar cotizacion</button>
                <button type='button' className='btn btn-sm btn-primary' onClick={(e) => save(e, false)}>Registrar venta</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-sales'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Ventas'}><Sales {...properties} /></BaseAdminto>)
})
