import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import CommercialOrdersRest from '../Actions/Admin/CommercialOrdersRest';
import renderGridEditLink from '../Utils/renderGridEditLink';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import { dispatchStatusOptions, toLookup } from '../Utils/statusLabels';

const commercialOrdersRest = new CommercialOrdersRest()

const pickingStatusOptions = [
  { value: 'preparing', label: 'En preparacion' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'dispatched', label: 'Listos para despacho' },
  { value: 'all', label: 'Todos' },
]
const basePickingFilter = [
  ['order_status', '<>', 'draft'],
  'and',
  ['order_status', '<>', 'cancelled'],
]
const pickingStatusLabel = (value) => pickingStatusOptions.find((option) => option.value === value)?.label ?? value
const customerName = (data) => data?.client?.full_name ?? data?.eventual_client?.business_name ?? data?.eventualClient?.business_name ?? '-'
const textValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value.address ?? value.reference ?? value.name ?? value.description ?? fallback
  const text = `${value}`.trim()
  return text === '[object Object]' ? fallback : text
}
const itemLines = (data) => (data?.items ?? []).map((item) => (
  `${item?.article?.name || 'Articulo'} | Cant. ${Number(item?.quantity || 0).toFixed(2)}`
))

const Picking = () => {
  const gridRef = useRef()
  const [selectedStatus, setSelectedStatus] = useState('preparing')
  const filterValue = useMemo(() => (
    selectedStatus === 'all'
      ? basePickingFilter
      : [...basePickingFilter, 'and', ['dispatch_status', '=', selectedStatus]]
  ), [selectedStatus])

  const refreshGrid = async () => {
    const instance = gridRef.current ? $(gridRef.current).dxDataGrid('instance') : null
    if (instance) await instance.refresh()
  }

  const updatePickingStatus = async (order, nextStatus) => {
    const isCompleting = nextStatus === 'dispatched'
    const isStarting = nextStatus === 'preparing'
    const { isConfirmed } = await Swal.fire({
      title: isCompleting ? 'Completar preparacion' : 'Actualizar preparacion',
      text: isStarting
        ? `El pedido ${order.code} pasara a En preparacion.`
        : `El pedido ${order.code} pasara a ${pickingStatusLabel(nextStatus)}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isCompleting ? 'Completar' : 'Actualizar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return

    const result = await commercialOrdersRest.boolean({
      id: order.id,
      field: 'dispatch_status',
      value: nextStatus,
    })
    if (!result) return
    await refreshGrid()
  }

  return (
    <Table
      gridRef={gridRef}
      title='Preparacion'
      rest={commercialOrdersRest}
      pageSize={25}
      filterValue={filterValue}
      toolBar={(items) => {
        items.unshift({
          widget: 'dxSelectBox',
          location: 'after',
          options: {
            dataSource: pickingStatusOptions,
            valueExpr: 'value',
            displayExpr: 'label',
            value: selectedStatus,
            width: 190,
            onValueChanged: (e) => setSelectedStatus(e.value),
          }
        })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: refreshGrid } })
      }}
      columns={[
        { dataField: 'id', caption: 'ID', width: 70 },
        { dataField: 'order_status', caption: 'Estado pedido', visible: false, showInColumnChooser: false },
        {
          dataField: 'code',
          caption: 'Pedido',
          width: 130,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.code, () => { window.location.href = '/admin/commercial-orders' }, 'Ver pedido')
        },
        { dataField: 'promised_delivery_at', caption: 'F. entrega', width: 110, dataType: 'date' },
        { dataField: 'business.name', caption: 'Empresa', minWidth: 130 },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 120 },
        { caption: 'Cliente', minWidth: 220, calculateCellValue: customerName },
        { caption: 'Direccion', minWidth: 240, calculateCellValue: (data) => textValue(data?.delivery_address) },
        { dataField: 'dispatch_status', caption: 'Estado', width: 120, lookup: toLookup(dispatchStatusOptions) },
        {
          caption: 'Items',
          minWidth: 280,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            const lines = itemLines(data)
            if (lines.length === 0) return container.text('Sin detalle')
            lines.forEach((line) => container.append($('<div>').append($('<small>').text(line))))
          }
        },
        {
          caption: 'Acciones',
          width: 150,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            if (data.dispatch_status === 'pending') {
              container.append(DxButton({
                className: 'btn btn-xs btn-soft-primary',
                title: 'Iniciar preparacion',
                icon: 'mdi mdi-play-circle-outline',
                onClick: () => updatePickingStatus(data, 'preparing'),
              }))
            }
            if (data.dispatch_status === 'preparing') {
              container.append(DxButton({
                className: 'btn btn-xs btn-soft-success',
                title: 'Completar preparacion',
                icon: 'mdi mdi-check-circle-outline',
                onClick: () => updatePickingStatus(data, 'dispatched'),
              }))
            }
            if (data.dispatch_status === 'dispatched') {
              container.append(DxButton({
                className: 'btn btn-xs btn-soft-warning',
                title: 'Reabrir preparacion',
                icon: 'mdi mdi-restore',
                onClick: () => updatePickingStatus(data, 'preparing'),
              }))
            }
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger ms-1',
              title: 'Imprimir pedido',
              icon: 'mdi mdi-file-pdf-box',
              onClick: () => openMagistralesRecordPdf(buildMagistralesRows.commercialOrder(data)),
            }))
          }
        },
      ]}
    />
  )
}

CreateReactScript((el, properties) => {
  if (!properties.can('dispatch') && !properties.hasRole('Admin')) {
    location.href = '/admin/'
    return
  }
  createRoot(el).render(<BaseAdminto {...properties} title='Preparacion'><Picking {...properties} /></BaseAdminto>)
})
