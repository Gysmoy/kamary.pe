const buildOptions = (entries) => entries.map(([value, label]) => ({ value, label }))

const fallbackLabel = (value) => {
  const normalized = `${value ?? ''}`.trim()
  if (!normalized) return '-'

  return normalized
    .replaceAll('_', ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const buildLabelResolver = (options) => {
  const labels = Object.fromEntries(options.map(({ value, label }) => [`${value}`.toLowerCase(), label]))

  return (value, emptyLabel = '-') => {
    const normalized = `${value ?? ''}`.trim()
    if (!normalized) return emptyLabel
    return labels[normalized.toLowerCase()] ?? fallbackLabel(normalized)
  }
}

export const toLookup = (options) => ({
  dataSource: options,
  valueExpr: 'value',
  displayExpr: 'label',
})

export const sourceTypeOptions = buildOptions([
  ['commercial_order', 'Pedido comercial'],
  ['service_order', 'Orden de servicio'],
])

export const commercialOrderStatusOptions = buildOptions([
  ['draft', 'Borrador'],
  ['confirmed', 'Confirmado'],
  ['preparing', 'Preparando'],
  ['dispatched', 'Despachado'],
  ['billed', 'Facturado'],
  ['closed', 'Cerrado'],
  ['cancelled', 'Cancelado'],
])

export const serviceOrderStatusOptions = buildOptions([
  ['draft', 'Borrador'],
  ['approved', 'Aprobada'],
  ['scheduled', 'Programada'],
  ['executing', 'En ejecución'],
  ['prefactured', 'Prefacturada'],
  ['invoiced', 'Facturada'],
  ['closed', 'Cerrada'],
  ['cancelled', 'Cancelada'],
])

export const operationalOrderStatusOptions = buildOptions([
  ['draft', 'Borrador'],
  ['confirmed', 'Confirmado'],
  ['preparing', 'Preparando'],
  ['dispatched', 'Despachado'],
  ['billed', 'Facturado'],
  ['closed', 'Cerrado'],
  ['approved', 'Aprobada'],
  ['scheduled', 'Programada'],
  ['executing', 'En ejecución'],
  ['prefactured', 'Prefacturada'],
  ['invoiced', 'Facturada'],
  ['cancelled', 'Cancelada'],
])

export const dispatchStatusOptions = buildOptions([
  ['pending', 'Pendiente'],
  ['preparing', 'Preparando'],
  ['dispatched', 'Despachado'],
  ['delivered', 'Entregado'],
  ['waiting', 'En espera'],
  ['assigned', 'Asignado'],
  ['in_route', 'En ruta'],
  ['incident', 'Incidencia'],
  ['closed', 'Cerrado'],
  ['cancelled', 'Cancelado'],
])

export const billingStatusOptions = buildOptions([
  ['pending', 'Pendiente'],
  ['partial', 'Parcial'],
  ['billed', 'Facturado'],
  ['cancelled', 'Cancelado'],
])

export const paymentStatusOptions = buildOptions([
  ['pending', 'Pendiente'],
  ['partial', 'Parcial'],
  ['paid', 'Pagado'],
  ['cancelled', 'Cancelado'],
])

export const purchaseOrderStatusOptions = buildOptions([
  ['draft', 'Borrador'],
  ['approved', 'Aprobada'],
  ['partial', 'Parcial'],
  ['completed', 'Completada'],
  ['cancelled', 'Anulada'],
])

export const approvalStatusOptions = buildOptions([
  ['pending', 'Pendiente'],
  ['approved', 'Aprobada'],
  ['rejected', 'Rechazada'],
])

export const purchaseReceiptStatusOptions = buildOptions([
  ['draft', 'Borrador'],
  ['confirmed', 'Confirmado'],
  ['cancelled', 'Anulado'],
])

export const billingDocumentStatusOptions = buildOptions([
  ['pending', 'Pendiente'],
  ['draft', 'Borrador'],
  ['sent', 'Enviado'],
  ['accepted', 'Aceptado'],
  ['observed', 'Observado'],
  ['rejected', 'Rechazado'],
  ['cancelled', 'Anulado'],
])

export const activityTypeOptions = buildOptions([
  ['delivery', 'Entrega'],
  ['pickup', 'Recojo'],
  ['transfer', 'Traslado'],
  ['return', 'Devolución'],
  ['visit', 'Visita'],
])

export const activityStatusOptions = buildOptions([
  ['scheduled', 'Programada'],
  ['assigned', 'Asignada'],
  ['in_progress', 'En progreso'],
  ['completed', 'Completada'],
  ['incident', 'Incidencia'],
  ['cancelled', 'Cancelada'],
])

export const shiftOptions = buildOptions([
  ['Manana', 'Mañana'],
  ['Tarde', 'Tarde'],
  ['Noche', 'Noche'],
])

export const getSourceTypeLabel = buildLabelResolver(sourceTypeOptions)
export const getCommercialOrderStatusLabel = buildLabelResolver(commercialOrderStatusOptions)
export const getServiceOrderStatusLabel = buildLabelResolver(serviceOrderStatusOptions)
export const getOperationalOrderStatusLabel = buildLabelResolver(operationalOrderStatusOptions)
export const getDispatchStatusLabel = buildLabelResolver(dispatchStatusOptions)
export const getBillingStatusLabel = buildLabelResolver(billingStatusOptions)
export const getPaymentStatusLabel = buildLabelResolver(paymentStatusOptions)
export const getPurchaseOrderStatusLabel = buildLabelResolver(purchaseOrderStatusOptions)
export const getApprovalStatusLabel = buildLabelResolver(approvalStatusOptions)
export const getPurchaseReceiptStatusLabel = buildLabelResolver(purchaseReceiptStatusOptions)
export const getBillingDocumentStatusLabel = buildLabelResolver(billingDocumentStatusOptions)
export const getActivityTypeLabel = buildLabelResolver(activityTypeOptions)
export const getActivityStatusLabel = buildLabelResolver(activityStatusOptions)
export const getShiftLabel = buildLabelResolver(shiftOptions)

export const getFacturadorSyncMeta = (value) => {
  const normalized = `${value ?? ''}`.trim().toLowerCase()

  if (!normalized) {
    return { label: 'Sin sincronizar', color: 'secondary' }
  }

  if (normalized === 'success') {
    return { label: 'Sincronizado', color: 'success' }
  }

  if (normalized === 'pending') {
    return { label: 'Pendiente', color: 'warning' }
  }

  if (normalized === 'error') {
    return { label: 'Error', color: 'danger' }
  }

  return { label: fallbackLabel(normalized), color: 'secondary' }
}
