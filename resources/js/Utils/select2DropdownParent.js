export const select2DropdownParentFor = (select, explicitParent = null, fallbackParent = null) => {
  const $ = window.jQuery || window.$
  if (!$) return undefined

  if (select?.closest?.('[data-select2-local-dropdown]')) {
    const localParent = select.closest('.form-group, .input-group, td, th')
    if (localParent) return $(localParent)
  }

  if (explicitParent) return $(explicitParent)
  if (fallbackParent) return $(fallbackParent)

  return $(select?.closest?.('.modal, .offcanvas, .swal2-popup') || document.body)
}
