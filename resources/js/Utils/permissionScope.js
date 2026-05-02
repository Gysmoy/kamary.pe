const MAGISTRALES_SCOPE_MAP = {
  articles: 'magistrales-products',
  batches: 'magistrales-products',
  laboratories: 'magistrales-products',
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

export const isMagistralesPath = (path = location.pathname) => {
  return `${path ?? ''}`.toLowerCase().includes('/admin/magistrales/')
}

export const scopedPermission = (permission, path = location.pathname) => {
  if (!isMagistralesPath(path)) return permission
  return MAGISTRALES_SCOPE_MAP[permission] ?? permission
}
