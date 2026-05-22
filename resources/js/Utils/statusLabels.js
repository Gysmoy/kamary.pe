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

const spanishStatusLabels = new Map([
  ['active', 'Activo'],
  ['inactive', 'Inactivo'],
  ['enabled', 'Habilitado'],
  ['disabled', 'Deshabilitado'],
  ['success', 'Sincronizado'],
  ['error', 'Error'],
  ['failed', 'Fallido'],
  ['pending', 'Pendiente'],
  ['draft', 'Borrador'],
  ['sent', 'Enviado'],
  ['accepted', 'Aceptado'],
  ['observed', 'Observado'],
  ['rejected', 'Rechazado'],
  ['cancelled', 'Anulado'],
  ['approved', 'Aprobado'],
  ['confirmed', 'Confirmado'],
  ['partial', 'Parcial'],
  ['completed', 'Completado'],
  ['preparing', 'Preparando'],
  ['dispatched', 'Despacho'],
  ['delivered', 'Entregado'],
  ['billed', 'Facturado'],
  ['closed', 'Cerrado'],
  ['waiting', 'En espera'],
  ['assigned', 'Asignado'],
  ['in_route', 'En ruta'],
  ['incident', 'Incidencia'],
  ['scheduled', 'Programado'],
  ['executing', 'En ejecucion'],
  ['prefactured', 'Prefacturado'],
  ['invoiced', 'Facturado'],
  ['paid', 'Pagado'],
  ['in_process', 'En proceso'],
  ['in_progress', 'En progreso'],
  ['finished', 'Finalizado'],
  ['registered', 'Registrado'],
  ['prepared', 'Generado'],
  ['processing', 'En proceso'],
  ['delivery', 'Entrega'],
  ['pickup', 'Recojo'],
  ['transfer', 'Traslado'],
  ['return', 'Devolucion'],
  ['visit', 'Visita'],
  ['commercial_order', 'Pedido comercial'],
  ['service_order', 'Orden de servicio'],
])

const spanishStatusPattern = /\b(active|inactive|enabled|disabled|success|error|failed|pending|draft|sent|accepted|observed|rejected|cancelled|approved|confirmed|partial|completed|preparing|dispatched|delivered|billed|closed|waiting|assigned|in_route|incident|scheduled|executing|prefactured|invoiced|paid|in_process|in_progress|finished|registered|prepared|processing|delivery|pickup|transfer|return|visit|commercial_order|service_order)\b/gi

export const getSpanishStatusLabel = (value, emptyLabel = '-') => {
  const normalized = `${value ?? ''}`.trim()
  if (!normalized) return emptyLabel
  return spanishStatusLabels.get(normalized.toLowerCase()) ?? fallbackLabel(normalized)
}

export const translateStatusText = (value, emptyLabel = '-') => {
  const text = `${value ?? ''}`.trim()
  if (!text) return emptyLabel

  return text.replace(spanishStatusPattern, (match) => (
    spanishStatusLabels.get(match.toLowerCase()) ?? match
  ))
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
  ['pending', 'Pendiente'],
  ['confirmed', 'Confirmado'],
  ['preparing', 'Preparando'],
  ['in_route', 'En ruta'],
  ['delivered', 'Entregado'],
  ['dispatched', 'Despacho'],
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
  ['dispatched', 'Despacho'],
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
  ['dispatched', 'Despacho'],
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

export const referralGuideStatusOptions = buildOptions([
  ['prepared', 'Generada'],
  ['pending', 'Pendiente'],
  ['sent', 'Enviada'],
  ['accepted', 'Aceptada'],
  ['observed', 'Observada'],
  ['rejected', 'Rechazada'],
  ['cancelled', 'Anulada'],
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
export const getReferralGuideStatusLabel = buildLabelResolver(referralGuideStatusOptions)
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
