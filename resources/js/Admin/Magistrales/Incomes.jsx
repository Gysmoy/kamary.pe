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
import IncomesRest from '../../Actions/Admin/Magistrales/IncomesRest';
import renderGridEditLink from '../../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../../Utils/magistralesRecordPdf';

const incomesRest = new IncomesRest()

const emptyItem = () => ({
  uid: crypto.randomUUID(),
  article_id: '',
  description: '',
  quantity: 1,
  presentation: '',
  expiration_date: '',
  lot: '',
  price_without_igv: 0,
  price_with_igv: 0,
})

const formatUser = (user) => user?.fullname || [user?.name, user?.lastname].filter(Boolean).join(' ') || user?.username || ''
const formatDocumentGuide = (data) => {
  const document = [data?.document_type, data?.document_series, data?.document_sequence].filter(Boolean).join(' ')
  const guide = data?.guide_number || [data?.guide_series, data?.guide_sequence].filter(Boolean).join('-')
  return [document, guide].filter(Boolean).join(' / ')
}

const itemSubtotal = (item) => Number(item.quantity || 0) * Number(item.price_with_igv || 0)
const itemBaseTotal = (item) => Number(item.quantity || 0) * Number(item.price_without_igv || 0)

const Incomes = ({ moduleTitle = 'Magistrales - Nota de entrada', fixedWarehouse = null }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const purchaseOrderCodeRef = useRef()
  const documentTypeRef = useRef()
  const documentSeriesRef = useRef()
  const documentSequenceRef = useRef()
  const filePathRef = useRef()
  const guideNumberRef = useRef()
  const guideSeriesRef = useRef()
  const guideSequenceRef = useRef()
  const guideRucRef = useRef()
  const guideFilePathRef = useRef()
  const businessRef = useRef()
  const warehouseRef = useRef()
  const supplierRef = useRef()
  const paymentMethodRef = useRef()
  const originRef = useRef()
  const currencyRef = useRef()
  const affectsIgvRef = useRef()
  const issueDateRef = useRef()
  const observationsRef = useRef()
  const [businesses, setBusinesses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [articles, setArticles] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [isEditing, setIsEditing] = useState(false)
  const fixedWarehouseId = fixedWarehouse?.id ? `${fixedWarehouse.id}` : ''
  const fixedWarehouseLabel = [fixedWarehouse?.branch_name, fixedWarehouse?.name].filter(Boolean).join(' - ') || 'Almacen fijo de Magistrales'

  useEffect(() => {
    Promise.all([
      incomesRest.getBusinesses(),
      incomesRest.getSuppliers(),
      incomesRest.getArticles(),
    ]).then(([businessRows, supplierRows, articleRows]) => {
      setBusinesses((businessRows ?? []).filter(row => row.status !== null))
      setSuppliers((supplierRows ?? []).filter(row => row.status !== null))
      setArticles((articleRows ?? []).filter(row => row.status !== null))
    })
  }, [])

  const totals = items.reduce((carry, item) => {
    carry.subtotal += itemBaseTotal(item)
    carry.total += itemSubtotal(item)
    return carry
  }, { subtotal: 0, total: 0 })
  totals.igv = Math.max(0, totals.total - totals.subtotal)

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    purchaseOrderCodeRef.current.value = data?.purchase_order_code ?? ''
    documentTypeRef.current.value = data?.document_type ?? 'Factura'
    documentSeriesRef.current.value = data?.document_series ?? ''
    documentSequenceRef.current.value = data?.document_sequence ?? ''
    filePathRef.current.value = data?.file_path ?? ''
    guideNumberRef.current.value = data?.guide_number ?? ''
    guideSeriesRef.current.value = data?.guide_series ?? ''
    guideSequenceRef.current.value = data?.guide_sequence ?? ''
    guideRucRef.current.value = data?.guide_ruc ?? ''
    guideFilePathRef.current.value = data?.guide_file_path ?? ''
    businessRef.current.value = data?.business_id ?? ''
    warehouseRef.current.value = data?.warehouse_id ?? fixedWarehouseId
    supplierRef.current.value = data?.supplier_id ?? ''
    paymentMethodRef.current.value = data?.payment_method ?? ''
    originRef.current.value = data?.origin ?? ''
    currencyRef.current.value = data?.currency ?? 'PEN'
    affectsIgvRef.current.checked = !!data?.affects_igv
    issueDateRef.current.value = data?.issue_date?.toString?.().slice?.(0, 10) ?? new Date().toISOString().slice(0, 10)
    observationsRef.current.value = data?.observations ?? ''

    const nextItems = (data?.items ?? []).map(item => ({
      uid: crypto.randomUUID(),
      article_id: item.article_id ?? '',
      description: item.description ?? '',
      quantity: item.quantity ?? 1,
      presentation: item.presentation ?? '',
      expiration_date: item.expiration_date?.toString?.().slice?.(0, 10) ?? '',
      lot: item.lot ?? '',
      price_without_igv: item.price_without_igv ?? 0,
      price_with_igv: item.price_with_igv ?? 0,
    }))
    setItems(nextItems.length ? nextItems : [emptyItem()])
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const result = await incomesRest.save({
      id: idRef.current.value || undefined,
      code: isEditing ? codeRef.current.value.trim() : '',
      purchase_order_code: purchaseOrderCodeRef.current.value.trim(),
      document_type: documentTypeRef.current.value,
      document_series: documentSeriesRef.current.value.trim(),
      document_sequence: documentSequenceRef.current.value.trim(),
      file_path: filePathRef.current.value.trim(),
      guide_number: guideNumberRef.current.value.trim(),
      guide_series: guideSeriesRef.current.value.trim(),
      guide_sequence: guideSequenceRef.current.value.trim(),
      guide_ruc: guideRucRef.current.value.trim(),
      guide_file_path: guideFilePathRef.current.value.trim(),
      business_id: businessRef.current.value || null,
      warehouse_id: warehouseRef.current.value || fixedWarehouseId || null,
      supplier_id: supplierRef.current.value || null,
      payment_method: paymentMethodRef.current.value.trim(),
      origin: originRef.current.value.trim(),
      currency: currencyRef.current.value,
      affects_igv: affectsIgvRef.current.checked,
      issue_date: issueDateRef.current.value || null,
      observations: observationsRef.current.value.trim(),
      items: items.map(item => ({
        article_id: item.article_id || null,
        description: (item.description ?? '').toString().trim(),
        quantity: item.quantity,
        presentation: (item.presentation ?? '').toString().trim(),
        expiration_date: item.expiration_date || null,
        lot: (item.lot ?? '').toString().trim(),
        price_without_igv: item.price_without_igv,
        price_with_igv: item.price_with_igv,
      })),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await incomesRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar nota de entrada', text: 'Se dara de baja la nota de entrada magistral.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await incomesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const updateItem = (uid, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.uid !== uid) return item
      const next = { ...item, [field]: value }
      if (field === 'article_id') {
        const article = articles.find(row => `${row.id}` === `${value}`)
        if (article && !next.description) next.description = article.name
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

  return <>
    <style>{`
      .mag-income-dialog {
        max-width: min(1600px, calc(100vw - 32px));
      }

      .mag-income-modal .modal-body {
        max-height: calc(100vh - 150px);
        overflow-y: auto;
      }

      .mag-income-detail-scroll {
        overflow-x: auto;
      }

      .mag-income-detail-table {
        min-width: 1480px;
        table-layout: fixed;
      }

      .mag-income-detail-table th {
        color: #313a46;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: none;
        white-space: nowrap;
      }

      .mag-income-detail-table td {
        vertical-align: middle;
      }

      .mag-income-detail-table .form-control,
      .mag-income-detail-table .form-select {
        min-width: 0;
        width: 100%;
      }

      .mag-income-col-article { width: 250px; }
      .mag-income-col-description { width: 260px; }
      .mag-income-col-quantity { width: 105px; }
      .mag-income-col-presentation { width: 155px; }
      .mag-income-col-expiration { width: 170px; }
      .mag-income-col-lot { width: 130px; }
      .mag-income-col-price { width: 125px; }
      .mag-income-col-subtotal { width: 120px; }
      .mag-income-col-actions { width: 70px; }

      @media (max-width: 991.98px) {
        .mag-income-dialog {
          max-width: calc(100vw - 12px);
          margin-left: auto;
          margin-right: auto;
        }
      }
    `}</style>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={incomesRest}
      pageSize={25}
      toolBar={(toolbarItems) => {
        toolbarItems.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        toolbarItems.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 150,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar nota de entrada magistral')
        },
        { dataField: 'document_guide', caption: 'Nro comp. / Guia R.', minWidth: 170, calculateCellValue: formatDocumentGuide },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 180 },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 160 },
        { dataField: 'supplier.business_name', caption: 'Proveedor', minWidth: 190 },
        { dataField: 'creator_label', caption: 'Usuario registro', minWidth: 160, calculateCellValue: (data) => formatUser(data.creator) },
        { dataField: 'created_at', caption: 'Fecha registro', dataType: 'date', width: 130 },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onStatusChange(data)} />)
          }
        },
        {
          caption: 'Acciones',
          width: 160,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.income(data)) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary ms-1', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
          }
        },
      ]}
    />

    <Modal
      modalRef={modalRef}
      title={isEditing ? 'Editar nota de entrada magistral' : 'Registrar nota de entrada magistral'}
      size='xl'
      dialogClass='mag-income-dialog'
      contentClass='mag-income-modal'
      onSubmit={onSave}
    >
      <div className='row'>
        <input ref={idRef} hidden />
        <input ref={warehouseRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' disabled={!isEditing} /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Orden de compra</label><input ref={purchaseOrderCodeRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Almacen fijo</label><input className='form-control' value={fixedWarehouseLabel} disabled /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Empresa</label><select ref={businessRef} className='form-control'><option value=''>Seleccione</option>{businesses.map(row => <option key={`mag-income-business-${row.id}`} value={row.id}>{row.name}</option>)}</select></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Proveedor</label><select ref={supplierRef} className='form-control'><option value=''>Seleccione</option>{suppliers.map(row => <option key={`mag-income-supplier-${row.id}`} value={row.id}>{row.ruc} - {row.business_name}</option>)}</select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Forma de pago</label><input ref={paymentMethodRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Archivo</label><input ref={filePathRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Procedencia</label><input ref={originRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Tipo documento</label><input ref={documentTypeRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Serie</label><input ref={documentSeriesRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Secuencia</label><input ref={documentSequenceRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Moneda</label><select ref={currencyRef} className='form-control'><option value='PEN'>PEN</option><option value='USD'>USD</option></select></div>
        <div className='col-md-3 mb-3 form-check mt-4'><input ref={affectsIgvRef} type='checkbox' className='form-check-input' id='magIncomeAffectsIgv' /><label className='form-check-label' htmlFor='magIncomeAffectsIgv'>Afecto IGV</label></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha</label><input ref={issueDateRef} type='date' className='form-control' /></div>

        <div className='col-12'><hr className='my-2' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Guia serie</label><input ref={guideSeriesRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Guia secuencia</label><input ref={guideSequenceRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Guia numero</label><input ref={guideNumberRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>RUC guia</label><input ref={guideRucRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Archivo guia</label><input ref={guideFilePathRef} className='form-control' /></div>
        <div className='col-12 mb-2'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='2' /></div>

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Detalle de nota de entrada</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}><i className='mdi mdi-plus me-1'></i> Insertar articulo</button>
          </div>
          <div className='table-responsive border rounded mag-income-detail-scroll'>
            <table className='table table-sm table-striped mb-0 mag-income-detail-table'>
              <colgroup>
                <col className='mag-income-col-article' />
                <col className='mag-income-col-description' />
                <col className='mag-income-col-quantity' />
                <col className='mag-income-col-presentation' />
                <col className='mag-income-col-expiration' />
                <col className='mag-income-col-lot' />
                <col className='mag-income-col-price' />
                <col className='mag-income-col-price' />
                <col className='mag-income-col-subtotal' />
                <col className='mag-income-col-actions' />
              </colgroup>
              <thead>
                <tr>
                  <th>Ingreso</th>
                  <th>Descripcion</th>
                  <th>Cantidad</th>
                  <th>Presentacion</th>
                  <th>F. vencimiento</th>
                  <th>Lote</th>
                  <th>P. sin IGV</th>
                  <th>P. con IGV</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.uid}>
                    <td><select className='form-control form-control-sm' value={item.article_id} onChange={(e) => updateItem(item.uid, 'article_id', e.target.value)}><option value=''>Articulo</option>{articles.map(article => <option key={`income-article-${article.id}`} value={article.id}>{article.code} - {article.name}</option>)}</select></td>
                    <td><input className='form-control form-control-sm' value={item.description} onChange={(e) => updateItem(item.uid, 'description', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0.001' step='0.001' value={item.quantity} onChange={(e) => updateItem(item.uid, 'quantity', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' value={item.presentation} onChange={(e) => updateItem(item.uid, 'presentation', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='date' value={item.expiration_date} onChange={(e) => updateItem(item.uid, 'expiration_date', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' value={item.lot} onChange={(e) => updateItem(item.uid, 'lot', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.price_without_igv} onChange={(e) => updateItem(item.uid, 'price_without_igv', e.target.value)} /></td>
                    <td><input className='form-control form-control-sm' type='number' min='0' step='0.01' value={item.price_with_igv} onChange={(e) => updateItem(item.uid, 'price_with_igv', e.target.value)} /></td>
                    <td>S/ {itemSubtotal(item).toFixed(2)}</td>
                    <td><button type='button' className='btn btn-xs btn-soft-danger' onClick={() => removeItem(item.uid)}><i className='mdi mdi-delete'></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='d-flex justify-content-end mt-2'>
            <div style={{ minWidth: 260 }}>
              <div className='d-flex justify-content-between'><span>Subtotal</span><b>S/ {totals.subtotal.toFixed(2)}</b></div>
              <div className='d-flex justify-content-between'><span>IGV</span><b>S/ {totals.igv.toFixed(2)}</b></div>
              <div className='d-flex justify-content-between'><span>Total</span><b>S/ {totals.total.toFixed(2)}</b></div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-incomes'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Nota de entrada'}><Incomes {...properties} /></BaseAdminto>)
})
