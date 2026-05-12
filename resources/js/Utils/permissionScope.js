const MAGISTRALES_SCOPE_MAP = {
  articles: 'magistrales-products',
  batches: 'magistrales-products',
  laboratories: 'magistrales-laboratory',
  'units-of-measure': 'magistrales-products',
  suppliers: 'magistrales-procurement',
  'purchase-orders': 'magistrales-procurement',
  'purchase-receipts': 'magistrales-procurement',
  'accounts-payable': 'magistrales-procurement',
  inventory: 'magistrales-warehouse',
  kardex: 'magistrales-warehouse',
  'entry-note': 'magistrales-warehouse',
  'exit-note': 'magistrales-warehouse',
  'services-billing': 'magistrales-billing',
}

const STORAGE_SCOPE_MAP = {
  articles: 'storage-products',
  inventory: 'storage-inventory',
  kardex: 'storage-kardex',
  clients: 'storage-clients',
  'units-of-measure': 'storage-units',
  'entry-note': 'storage-entry-note',
  'exit-note': 'storage-exit-note',
  'services-services': 'storage-general-service',
  'services-billing': 'storage-billing-control',
  'services-service-order': 'storage-general-service-orders',
}

export const isMagistralesPath = (path = location.pathname) => {
  const normalizedPath = `${path ?? ''}`.toLowerCase()
  return normalizedPath.includes('/admin/magistrales/') || normalizedPath.includes('/admin/magistrales-')
}

export const isStoragePath = (path = location.pathname) => {
  const normalizedPath = `${path ?? ''}`.toLowerCase()
  return normalizedPath.includes('/admin/storage-')
}

export const scopedPermission = (permission, path = location.pathname) => {
  if (isMagistralesPath(path)) return MAGISTRALES_SCOPE_MAP[permission] ?? permission
  if (isStoragePath(path)) return STORAGE_SCOPE_MAP[permission] ?? permission
  return permission
}
