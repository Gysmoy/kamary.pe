import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import ServiceOrdersRest from '../Actions/Admin/ServiceOrdersRest';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import {
  billingStatusOptions,
  getPaymentStatusLabel,
  serviceOrderStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const serviceOrdersRest = new ServiceOrdersRest()
const emptyItem = () => ({ uid: crypto.randomUUID(), service_id: '', description: '', quantity: 1, unit_price: 0, detraction_percent: 0, commission_percent: 0, total: 0 })
const normalizeStorageText = (value = '') => value.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
const storageWarehouseName = (warehouse) => warehouse?.name ?? warehouse?.warehouse_name ?? ''
const storageWarehouseId = (warehouse) => warehouse?.id ?? warehouse?.warehouse_id ?? ''
const storageBlockFromWarehouse = (warehouse) => {
  const warehouseId = storageWarehouseId(warehouse)
  const warehouseName = storageWarehouseName(warehouse)
  return {
    key: warehouseId ? `warehouse-${warehouseId}` : normalizeStorageText(warehouseName),
    warehouse_name: warehouseName,
    warehouse_id: warehouseId ? `${warehouseId}` : '',
    enabled: false,
    location_id: '',
    location_label: '',
    start_date: '',
    months: '',
    end_date: '',
    quantity_m3: '',
    tariff: '',
    monthly_amount: '',
  }
}
const emptyStorageBlocks = (warehouses = []) => warehouses
  .filter(warehouse => warehouse?.status !== null)
  .map(storageBlockFromWarehouse)
const toInputDate = (value) => value?.toString?.().slice?.(0, 10) ?? ''
const toNumber = (value) => Number(value || 0)
const addMonths = (dateValue, monthsValue) => {
  if (!dateValue || !monthsValue) return ''
  const months = Number(monthsValue)
  if (!Number.isFinite(months) || months <= 0) return ''
  const date = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  const result = new Date(date)
  const day = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  result.setDate(Math.min(day, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()))
  return result.toISOString().slice(0, 10)
}
const storageLocationLabel = (location) => {
  if (!location) return ''
  return [location.code, location.temperature_range].filter(Boolean).join(' | ')
}
const buildStorageDescription = (block, location) => [
  block.warehouse_name,
  storageLocationLabel(location) || block.location_label,
  `${block.start_date || ''} - ${block.end_date || ''}`,
  `${block.months || 0} meses`,
  `${block.quantity_m3 || 0} m3`,
].filter(Boolean).join('; ')
const parseStorageDescription = (description = '') => {
  const parts = description.split(';').map(part => part.trim())
  const dates = (parts[2] ?? '').split('-').map(part => part.trim())
  return {
    warehouse_name: parts[0] ?? '',
    location_label: parts[1] ?? '',
    start_date: dates.length >= 3 ? `${dates[0]}-${dates[1]}-${dates[2]}`.slice(0, 10) : '',
    end_date: dates.length >= 6 ? `${dates[3]}-${dates[4]}-${dates[5]}`.slice(0, 10) : '',
    months: parseFloat(parts[3]) || '',
    quantity_m3: parseFloat(parts[4]) || '',
  }
}

const ServiceOrders = ({ moduleTitle = 'Ordenes de servicio', serviceOrderType = 'service' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const issueDateRef = useRef()
  const scheduledAtRef = useRef()
  const firstDueDateRef = useRef()
  const expectedDocumentTypeRef = useRef()
  const currencyRef = useRef()
  const billingCycleRef = useRef()
  const paymentConditionRef = useRef()
  const installmentsRef = useRef()
  const orderStatusRef = useRef()
  const billingStatusRef = useRef()
  const taxAmountRef = useRef()
  const observationsRef = useRef()

  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedStorageServiceId, setSelectedStorageServiceId] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [storageWarehouses, setStorageWarehouses] = useState([])
  const [storageLocations, setStorageLocations] = useState([])
  const [storageBlocks, setStorageBlocks] = useState(() => emptyStorageBlocks())
  const [isEditing, setIsEditing] = useState(false)

  const isStorageGeneral = serviceOrderType === 'storage_general'
  const isStorageService = serviceOrderType === 'storage_service'
  const serviceMap = Object.fromEntries(services.map(row => [`${row.id}`, row]))

  useEffect(() => {
    const loadInitialData = async () => {
      const [businessList, clientList, serviceList] = await Promise.all([
        serviceOrdersRest.getBusinesses(),
        serviceOrdersRest.getClients(),
        serviceOrdersRest.getServices(),
      ])
      const activeBusinesses = businessList ?? []
      setBusinesses(activeBusinesses)
      setClients((clientList ?? []).filter(row => row.status !== null))
      setServices((serviceList ?? []).filter(row => row.status !== null))

      if (isStorageService) {
        const [storageOptions, locationList, warehouseList] = await Promise.all([
          serviceOrdersRest.getStorageOptions(),
          serviceOrdersRest.getStorageLocations(),
          serviceOrdersRest.getStorageWarehouses(),
        ])
        const optionWarehouses = storageOptions?.warehouses ?? []
        const warehouseRows = (optionWarehouses.length ? optionWarehouses : warehouseList).filter(row => row.status !== null)
        setStorageWarehouses(warehouseRows)
        setStorageLocations(locationList ?? [])
        setStorageBlocks(emptyStorageBlocks(warehouseRows))

        const defaultBusiness = activeBusinesses[0]
        if (defaultBusiness) {
          setSelectedBusinessId(`${defaultBusiness.id}`)
          const branchRows = await loadBranches(defaultBusiness.id)
          if (branchRows[0]?.id) setSelectedBranchId(`${branchRows[0].id}`)
        }
      }
    }
    loadInitialData()
  }, [])

  const loadBranches = async (businessId, preferred = '') => {
    const data = await serviceOrdersRest.getBranchesByBusiness(businessId)
    const branchRows = data ?? []
    setBranches(branchRows)
    setSelectedBranchId(preferred ? `${preferred}` : '')
    return branchRows
  }

  const recalc = (row) => ({ ...row, total: Number(row.quantity || 0) * Number(row.unit_price || 0) })
  const findStorageWarehouse = (warehouseName, warehouseRows = storageWarehouses) => warehouseRows.find(row => normalizeStorageText(storageWarehouseName(row)) === normalizeStorageText(warehouseName))
  const blockWarehouseId = (block) => block.warehouse_id || findStorageWarehouse(block.warehouse_name)?.id || ''
  const locationOptionsForBlock = (block) => {
    const warehouseId = blockWarehouseId(block)
    return storageLocations.filter(location => {
      if (warehouseId && `${location.warehouse_id}` === `${warehouseId}`) return true
      return normalizeStorageText(location.warehouse_name) === normalizeStorageText(block.warehouse_name)
    })
  }
  const findStorageLocation = (block) => {
    const options = locationOptionsForBlock(block)
    return options.find(location => `${location.id}` === `${block.location_id}`)
      ?? options.find(location => normalizeStorageText(storageLocationLabel(location)) === normalizeStorageText(block.location_label))
      ?? null
  }
  const buildStorageBlocksFromItems = (itemRows = [], warehouseRows = storageWarehouses) => {
    const blocks = emptyStorageBlocks(warehouseRows)
    itemRows.forEach(row => {
      const parsed = parseStorageDescription(row.description ?? '')
      const index = blocks.findIndex(block => normalizeStorageText(block.warehouse_name) === normalizeStorageText(parsed.warehouse_name))
      if (index < 0) return
      const next = {
        ...blocks[index],
        enabled: true,
        warehouse_id: findStorageWarehouse(blocks[index].warehouse_name, warehouseRows)?.id ?? blocks[index].warehouse_id,
        location_label: parsed.location_label,
        start_date: parsed.start_date,
        months: parsed.months || '',
        end_date: parsed.end_date || addMonths(parsed.start_date, parsed.months),
        quantity_m3: parsed.quantity_m3 || Number(row.quantity || 0) || '',
        tariff: Number(row.unit_price || 0) || '',
        monthly_amount: Number(row.total || 0) || '',
      }
      const location = findStorageLocation(next)
      blocks[index] = { ...next, location_id: location?.id ? `${location.id}` : '' }
    })
    return blocks
  }
  const updateStorageBlock = (key, patch) => {
    setStorageBlocks(prev => prev.map(block => {
      if (block.key !== key) return block
      const location = patch.location_id
        ? storageLocations.find(row => `${row.id}` === `${patch.location_id}`)
        : null
      const next = {
        ...block,
        ...patch,
        warehouse_id: blockWarehouseId(block),
      }
      if (location) next.location_label = storageLocationLabel(location)
      if ('start_date' in patch || 'months' in patch) next.end_date = addMonths(next.start_date, next.months)
      if ('quantity_m3' in patch || 'tariff' in patch) {
        const amount = toNumber(next.quantity_m3) * toNumber(next.tariff)
        next.monthly_amount = amount ? amount.toFixed(2) : ''
      }
      return next
    }))
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? 'Se genera al guardar'
    issueDateRef.current.value = toInputDate(data?.issue_date) || new Date().toISOString().slice(0, 10)
    scheduledAtRef.current.value = toInputDate(data?.scheduled_at)
    firstDueDateRef.current.value = toInputDate(data?.first_due_date)
    expectedDocumentTypeRef.current.value = data?.expected_document_type ?? (isStorageService ? '' : 'Factura')
    currencyRef.current.value = data?.currency ?? (isStorageService ? '' : 'PEN')
    billingCycleRef.current.value = data?.billing_cycle ?? ''
    paymentConditionRef.current.value = data?.payment_condition ?? 'Contado'
    installmentsRef.current.value = Number(data?.installments ?? 1)
    orderStatusRef.current.value = data?.order_status ?? 'draft'
    billingStatusRef.current.value = data?.billing_status ?? 'pending'
    taxAmountRef.current.value = Number(data?.tax_amount ?? 0)
    observationsRef.current.value = data?.observations ?? ''
    const nextBusinessId = data?.business_id ? `${data.business_id}` : (selectedBusinessId || (businesses[0]?.id ? `${businesses[0].id}` : ''))
    setSelectedBusinessId(nextBusinessId)
    setSelectedClientId(data?.client_id ? `${data.client_id}` : '')
    const branchRows = await loadBranches(nextBusinessId, data?.business_branch_id ?? selectedBranchId)
    if (!data?.business_branch_id && !selectedBranchId && branchRows[0]?.id) setSelectedBranchId(`${branchRows[0].id}`)
    const itemRows = (data?.items ?? []).map(row => ({ uid: crypto.randomUUID(), service_id: `${row.service_id}`, description: row.description ?? '', quantity: Number(row.quantity || 0), unit_price: Number(row.unit_price || 0), detraction_percent: Number(row.detraction_percent || 0), commission_percent: Number(row.commission_percent || 0), total: Number(row.total || 0) }))
    setSelectedStorageServiceId(itemRows[0]?.service_id ?? '')
    setStorageBlocks(isStorageService ? buildStorageBlocksFromItems(data?.items ?? []) : emptyStorageBlocks())
    setItems(itemRows.length ? itemRows : [emptyItem()])
    $(modalRef.current).modal('show')
  }

  const onItemChange = (uid, field, value) => {
    setItems(prev => prev.map(row => {
      if (row.uid !== uid) return row
      const next = { ...row, [field]: value }
      if (field === 'service_id') {
        const service = serviceMap[value]
        next.description = next.description || service?.name || ''
        next.unit_price = Number(currencyRef.current?.value === 'USD' ? service?.unit_price_usd : service?.unit_price_pen) || 0
      }
      return recalc(next)
    }))
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (isStorageService) {
      const selectedBlocks = storageBlocks.filter(row => row.enabled)
      const missingBlock = selectedBlocks.find(row => !row.location_id || !row.start_date || !row.months || !row.end_date || !row.quantity_m3 || !row.tariff)
      if (!selectedBusinessId || !selectedBranchId || !selectedClientId || !expectedDocumentTypeRef.current.value || !currencyRef.current.value || !selectedStorageServiceId) {
        Swal.fire('Formulario incompleto', 'Completa empresa, cliente, tipo documento, moneda y tipo de servicio.', 'warning')
        return
      }
      if (!selectedBlocks.length) {
        Swal.fire('Formulario incompleto', 'Selecciona al menos un almacen.', 'warning')
        return
      }
      if (missingBlock) {
        Swal.fire('Formulario incompleto', `Completa los datos de ${missingBlock.warehouse_name}.`, 'warning')
        return
      }
      const startDates = selectedBlocks.map(row => row.start_date).filter(Boolean).sort()
      const maxMonths = Math.max(...selectedBlocks.map(row => Number(row.months || 1)))
      const service = serviceMap[selectedStorageServiceId]
      const request = {
        id: idRef.current.value || undefined,
        business_id: selectedBusinessId || null,
        business_branch_id: selectedBranchId || null,
        client_id: selectedClientId || null,
        expected_document_type: expectedDocumentTypeRef.current.value,
        currency: currencyRef.current.value,
        billing_cycle: service?.name ?? '',
        payment_condition: 'Contado',
        installments: maxMonths || 1,
        issue_date: issueDateRef.current.value || new Date().toISOString().slice(0, 10),
        scheduled_at: startDates[0] ?? null,
        first_due_date: startDates[0] ?? null,
        order_status: orderStatusRef.current.value || 'draft',
        billing_status: billingStatusRef.current.value || 'pending',
        tax_amount: 0,
        observations: observationsRef.current.value.trim(),
        items: selectedBlocks.map(block => {
          const location = findStorageLocation(block)
          const quantity = toNumber(block.quantity_m3)
          const unitPrice = toNumber(block.tariff)
          const total = toNumber(block.monthly_amount) || quantity * unitPrice
          return {
            service_id: selectedStorageServiceId,
            description: buildStorageDescription(block, location),
            quantity,
            unit_price: unitPrice,
            detraction_percent: 0,
            commission_percent: 0,
            total,
          }
        }),
      }
      const result = await serviceOrdersRest.save(request)
      if (!result) return
      $(gridRef.current).dxDataGrid('instance').refresh()
      $(modalRef.current).modal('hide')
      return
    }
    const request = {
      id: idRef.current.value || undefined,
      business_id: selectedBusinessId || null,
      business_branch_id: selectedBranchId || null,
      client_id: selectedClientId || null,
      expected_document_type: expectedDocumentTypeRef.current.value,
      currency: currencyRef.current.value,
      billing_cycle: billingCycleRef.current.value.trim(),
      payment_condition: paymentConditionRef.current.value,
      installments: installmentsRef.current.value,
      issue_date: issueDateRef.current.value,
      scheduled_at: scheduledAtRef.current.value || null,
      first_due_date: firstDueDateRef.current.value || null,
      order_status: orderStatusRef.current.value,
      billing_status: billingStatusRef.current.value,
      tax_amount: taxAmountRef.current.value,
      observations: observationsRef.current.value.trim(),
      items: items.filter(row => row.service_id).map(row => ({ service_id: row.service_id, description: row.description, quantity: row.quantity, unit_price: row.unit_price, detraction_percent: row.detraction_percent, commission_percent: row.commission_percent, total: row.total }))
    }
    const result = await serviceOrdersRest.save(request)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar orden de servicio', text: 'Se dara de baja la orden.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await serviceOrdersRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={serviceOrdersRest}
      pageSize={25}
      toolBar={(itemsBar) => {
        itemsBar.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        itemsBar.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        { dataField: 'id', caption: 'ID', width: 70 },
        {
          dataField: 'code',
          caption: 'Codigo',
          width: 120,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => onModalOpen(data), 'Editar orden de servicio')
        },
        { dataField: 'issue_date', caption: 'Fecha', dataType: 'date', width: 110 },
        { dataField: 'scheduled_at', caption: 'Programada', dataType: 'date', width: 115 },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 140 },
        { dataField: 'branch.name', caption: 'Sede', minWidth: 130 },
        { dataField: 'client.full_name', caption: 'Cliente', minWidth: 200 },
        { dataField: 'billing_cycle', caption: 'Ciclo', minWidth: 130 },
        { dataField: 'expected_document_type', caption: 'Comp.', width: 100 },
        { dataField: 'currency', caption: 'Moneda', width: 90 },
        { dataField: 'subtotal', caption: 'Subtotal', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        { dataField: 'tax_amount', caption: 'Impuesto', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        {
          caption: 'Detalle',
          minWidth: 260,
          allowFiltering: false,
          calculateCellValue: (data) => (data.items ?? [])
            .map(row => `${Number(row.quantity || 0).toFixed(3)} ${row.service?.billing_unit ?? ''} ${row.description ?? row.service?.name ?? ''}`.trim())
            .join(' | ')
        },
        {
          dataField: 'accounts_receivable_code',
          caption: 'CXC',
          width: 130,
          calculateCellValue: (data) => data.accounts_receivable?.code ?? data.accountsReceivable?.code ?? '-'
        },
        {
          dataField: 'payment_status',
          caption: 'Cobranza',
          width: 110,
          calculateCellValue: (data) => getPaymentStatusLabel(data.accounts_receivable?.payment_status ?? data.accountsReceivable?.payment_status ?? data.payment_status ?? '-')
        },
        { dataField: 'order_status', caption: 'Estado', width: 110, lookup: toLookup(serviceOrderStatusOptions) },
        { dataField: 'billing_status', caption: 'Facturacion', width: 110, lookup: toLookup(billingStatusOptions) },
        { dataField: 'creator.fullname', caption: 'Creado por', minWidth: 140, visible: false },
        { dataField: 'updater.fullname', caption: 'Actualizado por', minWidth: 140, visible: false },
        { caption: 'Acciones', width: 170, allowFiltering: false, allowExporting: false, cellTemplate: (container, { data }) => {
          container.css('text-overflow', 'unset')
          container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Imprimir PDF', icon: 'mdi mdi-file-pdf-box', onClick: () => openMagistralesRecordPdf(buildMagistralesRows.serviceOrder(data)) }))
          container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
        } }
      ]}
    />

    {isStorageService ? (
      <Modal
        modalRef={modalRef}
        title={<span className='storage-service-order-title'><i className='mdi mdi-menu me-1'></i> ORDEN DE SERVICIO</span>}
        size='full-width'
        dialogClass='storage-service-order-dialog modal-dialog-scrollable'
        contentClass='storage-service-order-content'
        headerClass='storage-service-order-header'
        closeButtonClass='btn-close-white'
        bodyClass='storage-service-order-body'
        hideFooter
        onSubmit={onSave}
      >
        <style>{`
          .storage-service-order-dialog {
            width: calc(100vw - 34px);
            max-width: calc(100vw - 34px);
            margin: 7px auto;
            align-items: flex-start;
          }
          .storage-service-order-content {
            border: 0;
            border-radius: 0;
            min-height: calc(100vh - 38px);
          }
          .storage-service-order-header {
            background: #202146;
            color: #fff;
            min-height: 36px;
            padding: 7px 14px;
            border-bottom: 0;
          }
          .storage-service-order-header .btn-close {
            transform: scale(.72);
            opacity: .85;
          }
          .storage-service-order-title {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0;
          }
          .storage-service-order-body {
            padding: 0 30px 28px;
            color: #33394a;
          }
          .storage-service-order-actions {
            display: flex;
            justify-content: center;
            gap: 16px;
            padding: 22px 0 14px;
            border-bottom: 1px solid #e9ecef;
          }
          .storage-service-order-actions .btn {
            border-radius: 0;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 16px;
            line-height: 1;
          }
          .storage-service-order-actions .btn-primary-outline {
            color: #11184a;
            background: #fff;
            border: 1px solid #11184a;
          }
          .storage-service-order-actions .btn-muted {
            color: #8f949a;
            background: #f0f0f0;
            border: 1px solid #f0f0f0;
          }
          .storage-service-order-heading {
            text-align: center;
            font-size: 22px;
            font-weight: 600;
            color: #555b66;
            margin: 32px 0 20px;
          }
          .storage-service-order-body .form-label {
            color: #26324d;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .storage-service-order-body .form-control,
          .storage-service-order-body .form-select {
            border-radius: 2px;
            min-height: 26px;
            padding: 3px 10px;
            font-size: 12px;
          }
          .storage-service-order-body .form-control:disabled,
          .storage-service-order-body .form-select:disabled {
            background-color: #f5f5f5;
            color: #9ca3af;
          }
          .storage-service-order-separator {
            border-top: 1px solid #e9ecef;
            margin: 28px 0 16px;
          }
          .storage-service-card {
            border: 1px solid #e9ecef;
            background: #fff;
            min-height: 248px;
          }
          .storage-service-card-header {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #f7f7f7;
            padding: 11px 12px;
            min-height: 44px;
          }
          .storage-service-card-title {
            margin: 0;
            font-size: 14px;
            font-weight: 500;
            color: #3b4250;
          }
          .storage-service-card-body {
            padding: 13px 12px 20px;
          }
          .storage-order-checkbox {
            width: 22px;
            height: 22px;
            border-radius: 1px;
            margin: 0;
          }
          @media (max-width: 767.98px) {
            .storage-service-order-dialog {
              width: calc(100vw - 12px);
              max-width: calc(100vw - 12px);
            }
            .storage-service-order-body {
              padding: 0 16px 24px;
            }
          }
        `}</style>
        <input ref={idRef} hidden />
        <input ref={codeRef} hidden />
        <input ref={issueDateRef} type='date' hidden />
        <input ref={scheduledAtRef} type='date' hidden />
        <input ref={firstDueDateRef} type='date' hidden />
        <input ref={billingCycleRef} hidden />
        <input ref={paymentConditionRef} hidden />
        <input ref={installmentsRef} type='number' hidden />
        <input ref={orderStatusRef} hidden />
        <input ref={billingStatusRef} hidden />
        <input ref={taxAmountRef} type='number' hidden />
        <textarea ref={observationsRef} hidden />

        <div className='storage-service-order-actions'>
          <button type='submit' className='btn btn-primary-outline'><i className='mdi mdi-plus me-1'></i> Registrar</button>
          <button type='button' className='btn btn-muted' data-bs-dismiss='modal'><i className='mdi mdi-close me-1'></i> Cerrar</button>
        </div>

        <h3 className='storage-service-order-heading'>Orden de servicio N&deg;</h3>

        <div className='row g-4 align-items-end'>
          <div className='col-12 col-md-6 col-xl'>
            <label className='form-label'>Empresa</label>
            <select
              className='form-select'
              value={selectedBusinessId}
              onChange={async (e) => {
                setSelectedBusinessId(e.target.value)
                const branchRows = await loadBranches(e.target.value)
                setSelectedBranchId(branchRows[0]?.id ? `${branchRows[0].id}` : '')
              }}
              required
            >
              <option value=''>Seleccione</option>
              {businesses.map(row => <option key={`storage-order-business-${row.id}`} value={row.id}>{row.name}</option>)}
            </select>
          </div>
          <div className='col-12 col-md-6 col-xl-4'>
            <label className='form-label'>Cliente</label>
            <select className='form-select' value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required>
              <option value=''>Seleccione</option>
              {clients.map(row => <option key={`storage-order-client-${row.id}`} value={row.id}>{row.document_number ? `${row.document_number} | ` : ''}{row.full_name}</option>)}
            </select>
          </div>
          <div className='col-12 col-md-4 col-xl'>
            <label className='form-label'>Tipo documento</label>
            <select ref={expectedDocumentTypeRef} className='form-select' required>
              <option value=''>Seleccione</option>
              <option value='Factura'>Factura</option>
              <option value='Boleta'>Boleta</option>
              <option value='Nota de pedido'>Nota de pedido</option>
            </select>
          </div>
          <div className='col-12 col-md-4 col-xl'>
            <label className='form-label'>Moneda</label>
            <select ref={currencyRef} className='form-select' required>
              <option value=''>Seleccione</option>
              <option value='PEN'>Soles</option>
              <option value='USD'>Dolares</option>
            </select>
          </div>
          <div className='col-12 col-md-4 col-xl'>
            <label className='form-label'>Tipo de servicio</label>
            <select className='form-select' value={selectedStorageServiceId} onChange={(e) => setSelectedStorageServiceId(e.target.value)} required>
              <option value=''>Seleccione</option>
              {services.map(service => <option key={`storage-order-service-${service.id}`} value={service.id}>{service.name}</option>)}
            </select>
          </div>
        </div>

        <div className='storage-service-order-separator'></div>

        <div className='row g-3'>
          {storageBlocks.map(block => {
            const locationOptions = locationOptionsForBlock(block)
            const disabled = !block.enabled
            return <div className='col-12 col-lg-4' key={`storage-order-block-${block.key}`}>
              <div className='storage-service-card'>
                <div className='storage-service-card-header'>
                  <input
                    type='checkbox'
                    className='form-check-input storage-order-checkbox'
                    checked={block.enabled}
                    onChange={(e) => updateStorageBlock(block.key, { enabled: e.target.checked })}
                  />
                  <p className='storage-service-card-title'>{block.warehouse_name}</p>
                </div>
                <div className='storage-service-card-body'>
                  <div className='mb-3'>
                    <label className='form-label'>Ubicaci&oacute;n</label>
                    <select
                      className='form-select'
                      value={block.location_id}
                      disabled={disabled}
                      onChange={(e) => updateStorageBlock(block.key, { location_id: e.target.value })}
                      required={block.enabled}
                    >
                      <option value=''>{locationOptions.length ? 'Seleccione ubicacion' : 'Sin ubicaciones'}</option>
                      {locationOptions.map(location => (
                        <option key={`storage-order-location-${block.key}-${location.id}`} value={location.id}>{storageLocationLabel(location)}</option>
                      ))}
                    </select>
                  </div>
                  <div className='row g-3 mb-3'>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Fecha de inicio</label>
                      <input
                        type='date'
                        className='form-control'
                        value={block.start_date}
                        disabled={disabled}
                        onChange={(e) => updateStorageBlock(block.key, { start_date: e.target.value })}
                        required={block.enabled}
                      />
                    </div>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Nro de meses</label>
                      <input
                        type='number'
                        min='1'
                        className='form-control'
                        value={block.months}
                        disabled={disabled}
                        onChange={(e) => updateStorageBlock(block.key, { months: e.target.value })}
                        required={block.enabled}
                      />
                    </div>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Fecha fin</label>
                      <input type='date' className='form-control' value={block.end_date} disabled />
                    </div>
                  </div>
                  <div className='row g-3'>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Cantidad de m3</label>
                      <input
                        type='number'
                        min='0'
                        step='0.001'
                        className='form-control'
                        value={block.quantity_m3}
                        disabled={disabled}
                        onChange={(e) => updateStorageBlock(block.key, { quantity_m3: e.target.value })}
                        required={block.enabled}
                      />
                    </div>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Tarifa</label>
                      <input
                        type='number'
                        min='0'
                        step='0.01'
                        className='form-control'
                        value={block.tariff}
                        disabled={disabled}
                        onChange={(e) => updateStorageBlock(block.key, { tariff: e.target.value })}
                        required={block.enabled}
                      />
                    </div>
                    <div className='col-12 col-sm-4'>
                      <label className='form-label'>Importe mensual</label>
                      <input type='number' className='form-control' value={block.monthly_amount} disabled />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          })}
        </div>
      </Modal>
    ) : (
    <Modal modalRef={modalRef} title={isEditing ? `Editar ${isStorageGeneral ? 'orden de servicio general' : 'orden de servicio'}` : `Agregar ${isStorageGeneral ? 'orden de servicio general' : 'orden de servicio'}`} size='xl' onSubmit={onSave}>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-3 mb-3'><label className='form-label'>Código</label><input ref={codeRef} className='form-control' disabled /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Empresa</label><select className='form-control' value={selectedBusinessId} onChange={async (e) => { setSelectedBusinessId(e.target.value); await loadBranches(e.target.value, ''); }} required><option value=''>Seleccione</option>{businesses.map(row => <option key={`service-order-business-${row.id}`} value={row.id}>{row.name}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Sede</label><select className='form-control' value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}><option value=''>Seleccione</option>{branches.map(row => <option key={`service-order-branch-${row.id}`} value={row.id}>{row.name}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Cliente</label><select className='form-control' value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required><option value=''>Seleccione</option>{clients.map(row => <option key={`service-order-client-${row.id}`} value={row.id}>{row.full_name}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Fecha</label><input ref={issueDateRef} type='date' className='form-control' required /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Programada</label><input ref={scheduledAtRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Primera cuota</label><input ref={firstDueDateRef} type='date' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Ciclo</label><input ref={billingCycleRef} className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Comprobante</label><select ref={expectedDocumentTypeRef} className='form-control'><option value='Factura'>Factura</option><option value='Boleta'>Boleta</option></select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Moneda</label><select ref={currencyRef} className='form-control'><option value='PEN'>PEN</option><option value='USD'>USD</option></select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Pago</label><select ref={paymentConditionRef} className='form-control'><option value='Contado'>Contado</option><option value='Credito'>Crédito</option></select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Cuotas</label><input ref={installmentsRef} type='number' min='1' className='form-control' /></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Estado</label><select ref={orderStatusRef} className='form-control'>{serviceOrderStatusOptions.map((option) => <option key={`service-order-status-${option.value}`} value={option.value}>{option.label}</option>)}</select></div>
        <div className='col-md-3 mb-3'><label className='form-label'>Facturación</label><select ref={billingStatusRef} className='form-control'>{billingStatusOptions.map((option) => <option key={`service-order-billing-status-${option.value}`} value={option.value}>{option.label}</option>)}</select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>Impuesto</label><input ref={taxAmountRef} type='number' step='0.01' className='form-control' /></div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Servicios</label>
          <div className='border rounded p-2'>
            {items.map(row => <div key={row.uid} className='row align-items-end mb-2'>
              <div className='col-md-4'><label className='form-label'>Servicio</label><select className='form-control' value={row.service_id} onChange={(e) => onItemChange(row.uid, 'service_id', e.target.value)}><option value=''>Seleccione</option>{services.map(service => <option key={`service-order-item-${service.id}`} value={service.id}>{service.code} - {service.name}</option>)}</select></div>
              <div className='col-md-3'><label className='form-label'>Descripción</label><input className='form-control' value={row.description} onChange={(e) => onItemChange(row.uid, 'description', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Cant.</label><input type='number' step='0.001' className='form-control' value={row.quantity} onChange={(e) => onItemChange(row.uid, 'quantity', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>PU</label><input type='number' step='0.01' className='form-control' value={row.unit_price} onChange={(e) => onItemChange(row.uid, 'unit_price', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Det.</label><input type='number' step='0.01' className='form-control' value={row.detraction_percent} onChange={(e) => onItemChange(row.uid, 'detraction_percent', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Com.</label><input type='number' step='0.01' className='form-control' value={row.commission_percent} onChange={(e) => onItemChange(row.uid, 'commission_percent', e.target.value)} /></div>
              <div className='col-md-1'><label className='form-label'>Total</label><input className='form-control' value={Number(row.total || 0).toFixed(2)} disabled /></div>
              <div className='col-md-1'><button type='button' className='btn btn-outline-danger w-100' onClick={() => setItems(prev => prev.length === 1 ? [emptyItem()] : prev.filter(item => item.uid !== row.uid))}>-</button></div>
            </div>)}
            <button type='button' className='btn btn-sm btn-outline-primary' onClick={() => setItems(prev => [...prev, emptyItem()])}>Agregar servicio</button>
          </div>
        </div>
        <div className='col-12 mb-1'><label className='form-label'>Observaciones</label><textarea ref={observationsRef} className='form-control' rows='3' /></div>
      </div>
    </Modal>
    )}
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'services-service-order'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Ordenes de servicio'}><ServiceOrders {...properties} /></BaseAdminto>)
})
