export const select2DropdownParentFor = (select, explicitParent = null, fallbackParent = null) => {
  const $ = window.jQuery || window.$
  if (!$) return undefined

  if (select?.closest?.('[data-select2-local-dropdown]')) {
    const localParent = select.closest('.form-group, .input-group, td, th')
    if (localParent) return $(localParent)
  }

  if (explicitParent) {
    const explicitElement = $(explicitParent).get(0)
    const modal = explicitElement?.closest?.('.modal')
    if (modal && explicitElement?.closest?.('.modal-body')) return $(modal)
    return $(explicitParent)
  }
  if (fallbackParent) return $(fallbackParent)

  return $(select?.closest?.('.modal, .offcanvas, .swal2-popup') || document.body)
}
