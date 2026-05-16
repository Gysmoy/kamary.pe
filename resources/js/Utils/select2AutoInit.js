import select2SpanishLanguage from './select2SpanishLanguage'

const getJQuery = () => window.jQuery || window.$

const getDropdownParent = (select) => {
  return select.closest('.modal, .offcanvas, .swal2-popup') || document.body
}

const shouldSkipSelect2 = (select) => {
  return select.classList?.contains('swal2-select')
    || Boolean(select.closest?.('.swal2-popup, .swal2-container'))
}

const getPlaceholder = (select) => {
  return select.getAttribute('data-placeholder')
    || select.querySelector('option[value=""]')?.textContent?.trim()
    || select.getAttribute('placeholder')
    || 'Seleccione'
}

const dispatchNativeChange = (select) => {
  if (select.dataset.select2Dispatching === 'true') return

  select.dataset.select2Dispatching = 'true'
  select.dispatchEvent(new Event('change', { bubbles: true }))

  requestAnimationFrame(() => {
    delete select.dataset.select2Dispatching
  })
}

const destroyAutoSelect2 = (select) => {
  const $ = getJQuery()
  if (!$?.fn?.select2 || !select?.matches?.('select')) return

  const $select = $(select)
  $select.off('.select2Auto')

  if ($select.data('select2') && select.dataset.select2Auto === 'true') {
    $select.select2('destroy')
    delete select.dataset.select2Auto
  }
}

const destroyAutoSelect2In = (node) => {
  if (!node?.matches) return

  if (node.matches('select')) {
    destroyAutoSelect2(node)
    return
  }

  node.querySelectorAll?.('select').forEach(destroyAutoSelect2)
}

export const syncSelect2 = (root = document) => {
  const $ = getJQuery()
  if (!$?.fn?.select2 || !root?.querySelectorAll) return

  root
    .querySelectorAll('select:not([data-no-select2]):not([data-select2-managed]):not(.swal2-select)')
    .forEach((select) => {
      if (shouldSkipSelect2(select)) return

      const $select = $(select)

      if (!$select.data('select2')) {
        const hasEmptyOption = Boolean(select.querySelector('option[value=""]'))

        $select.select2({
          width: '100%',
          dropdownParent: $(getDropdownParent(select)),
          placeholder: getPlaceholder(select),
          allowClear: !select.required && !select.multiple && hasEmptyOption,
          minimumResultsForSearch: 0,
          language: select2SpanishLanguage
        })

        $select.on(
          'select2:select.select2Auto select2:unselect.select2Auto select2:clear.select2Auto',
          () => dispatchNativeChange(select)
        )

        select.dataset.select2Auto = 'true'
      }

      $select.trigger('change.select2')
    })
}

export const observeSelect2 = (root = document) => {
  syncSelect2(root)

  const target = root.body || root
  if (!window.MutationObserver || !target) return () => { }

  let frame = null
  const scheduleSync = () => {
    if (frame) return

    frame = requestAnimationFrame(() => {
      frame = null
      syncSelect2(root)
    })
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach(destroyAutoSelect2In)
    })

    scheduleSync()
  })
  observer.observe(target, { childList: true, subtree: true })

  return () => {
    if (frame) cancelAnimationFrame(frame)
    observer.disconnect()

    const $ = getJQuery()
    if (!$?.fn?.select2 || !root?.querySelectorAll) return

    root.querySelectorAll('select').forEach(destroyAutoSelect2)
  }
}
