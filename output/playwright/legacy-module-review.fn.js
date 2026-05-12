async (page) => {
  const waitSettled = async () => {
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(900)
  }

  const collectVisibleControls = async () => page.evaluate(() => {
    const clean = (value) => `${value ?? ''}`.replace(/\s+/g, ' ').trim()
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }
    const labelFor = (el) => {
      if (el.id) {
        const exact = document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
        if (exact) return clean(exact.innerText)
      }
      const container = el.closest('.form-group, .form-material, .input-group, .col-md-1, .col-md-2, .col-md-3, .col-md-4, .col-md-5, .col-md-6, .col-sm-12, .col-xs-12, .row')
      const label = container?.querySelector('label')
      if (label) return clean(label.innerText)
      let prev = el.previousElementSibling
      for (let i = 0; prev && i < 3; i += 1, prev = prev.previousElementSibling) {
        const text = clean(prev.innerText || prev.textContent)
        if (text && text.length < 80) return text
      }
      return clean(el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.name || el.id)
    }
    const fieldSelector = 'input:not([type="hidden"]), select, textarea'
    const fields = Array.from(document.querySelectorAll(fieldSelector))
      .filter(isVisible)
      .map((el) => ({
        label: labelFor(el),
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        name: el.getAttribute('name') || '',
        id: el.id || '',
        placeholder: el.getAttribute('placeholder') || '',
        required: Boolean(el.required || el.getAttribute('required') !== null),
        disabled: Boolean(el.disabled),
        options: el.tagName.toLowerCase() === 'select' ? Array.from(el.options).slice(0, 8).map(opt => clean(opt.textContent)) : [],
      }))

    const buttonSelector = 'button, a.btn, input[type="button"], input[type="submit"], [role="button"]'
    const buttons = Array.from(document.querySelectorAll(buttonSelector))
      .filter(isVisible)
      .map((el) => ({
        text: clean(el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title')),
        title: clean(el.getAttribute('title')),
        href: el.href || '',
        className: clean(el.className),
      }))
      .filter(btn => btn.text || btn.title || btn.href)

    const tableHeaders = Array.from(document.querySelectorAll('table thead th, .dx-header-row td, .k-grid-header th'))
      .filter(isVisible)
      .map(el => clean(el.innerText || el.textContent))
      .filter(Boolean)

    const tabs = Array.from(document.querySelectorAll('.nav-tabs a, [role="tab"], .tabs a'))
      .filter(isVisible)
      .map(el => clean(el.innerText || el.textContent))
      .filter(Boolean)

    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,.content-heading,.block-title,.page-heading'))
      .filter(isVisible)
      .map(el => clean(el.innerText || el.textContent))
      .filter(Boolean)

    const modals = Array.from(document.querySelectorAll('.modal.in, .modal.show, .modal[style*="display: block"], [role="dialog"]'))
      .filter(isVisible)
      .map((modal) => ({
        title: clean(modal.querySelector('.modal-title, h1, h2, h3, h4')?.innerText || ''),
        fields: Array.from(modal.querySelectorAll(fieldSelector))
          .filter(isVisible)
          .map((el) => ({
            label: labelFor(el),
            tag: el.tagName.toLowerCase(),
            type: el.getAttribute('type') || '',
            name: el.getAttribute('name') || '',
            placeholder: el.getAttribute('placeholder') || '',
            required: Boolean(el.required || el.getAttribute('required') !== null),
            disabled: Boolean(el.disabled),
          })),
        buttons: Array.from(modal.querySelectorAll(buttonSelector))
          .filter(isVisible)
          .map(el => clean(el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title')))
          .filter(Boolean),
      }))

    return { headings, fields, buttons, tableHeaders, tabs, modals }
  })

  const getMenuLinks = async () => page.evaluate(() => {
    const clean = (value) => `${value ?? ''}`.replace(/\s+/g, ' ').trim()
    const links = Array.from(document.querySelectorAll('nav a[href], aside a[href], .sidebar a[href]'))
      .map((a) => ({ text: clean(a.innerText || a.textContent), href: a.href }))
      .filter(link => link.href && !link.href.endsWith('#') && link.href.includes('kamary.l105.com'))
    const seen = new Set()
    return links.filter(link => {
      const key = `${link.text}|${link.href}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })

  const findCreateTriggers = (buttons) => {
    const include = /(agregar|crear|registrar|nuevo|añadir|ingresar pedido|mantenedor)/i
    const exclude = /(filtrar|buscar|excel|pdf|imprimir|copiar|cerrar|cancelar|guardar|eliminar|borrar|anular|descargar|exportar|refrescar|actualizar)/i
    return buttons
      .filter(button => {
        const text = `${button.text} ${button.title}`.trim()
        if (!text || exclude.test(text)) return false
        return include.test(text) || text === '+' || text === ''
      })
      .slice(0, 2)
  }

  const clickTrigger = async (trigger) => page.evaluate(({ text, title, href }) => {
    const clean = (value) => `${value ?? ''}`.replace(/\s+/g, ' ').trim()
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }
    const target = Array.from(document.querySelectorAll('button, a.btn, input[type="button"], input[type="submit"], [role="button"]'))
      .filter(isVisible)
      .find((el) => {
        const label = clean(el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title'))
        return (text && label === text) || (title && clean(el.getAttribute('title')) === title) || (href && el.href === href)
      })
    if (!target) return false
    target.click()
    return true
  }, trigger)

  const closeOpenedSurface = async (originalUrl) => {
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(300)
    await page.evaluate(() => {
      const closeText = /(cerrar|cancelar|close|×|x)/i
      const isVisible = (el) => {
        const rect = el.getBoundingClientRect()
        const style = window.getComputedStyle(el)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      }
      const target = Array.from(document.querySelectorAll('.modal.in button, .modal.show button, [role="dialog"] button, button.close, .btn'))
        .filter(isVisible)
        .find(el => closeText.test(`${el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || ''}`))
      if (target) target.click()
    }).catch(() => {})
    await page.waitForTimeout(300)
    if (page.url() !== originalUrl) {
      await page.goto(originalUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
      await waitSettled()
    }
  }

  await page.goto('https://kamary.l105.com/principal', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await waitSettled()
  const menuLinks = await getMenuLinks()
  const modules = []

  for (const link of menuLinks) {
    const module = {
      menu: link.text,
      url: link.href,
      loaded: false,
      redirectedUrl: '',
      status: 'ok',
      headings: [],
      fields: [],
      buttons: [],
      tableHeaders: [],
      tabs: [],
      createForms: [],
      problems: [],
    }

    try {
      await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await waitSettled()
      module.loaded = true
      module.redirectedUrl = page.url()
      const initial = await collectVisibleControls()
      Object.assign(module, initial)

      if (!initial.fields.length && !initial.tableHeaders.length && !initial.buttons.length) {
        module.problems.push('No se detectaron campos, tabla ni botones visibles.')
      }

      for (const trigger of findCreateTriggers(initial.buttons)) {
        const beforeUrl = page.url()
        await clickTrigger(trigger)
        await waitSettled()
        const afterClick = await collectVisibleControls()
        module.createForms.push({
          trigger: trigger.text || trigger.title || trigger.href,
          urlAfterClick: page.url(),
          headings: afterClick.headings,
          modalTitles: afterClick.modals.map(modal => modal.title).filter(Boolean),
          fields: afterClick.modals.length ? afterClick.modals.flatMap(modal => modal.fields) : afterClick.fields,
          buttons: afterClick.modals.length ? afterClick.modals.flatMap(modal => modal.buttons) : afterClick.buttons,
        })
        await closeOpenedSurface(beforeUrl)
      }
    } catch (error) {
      module.status = 'error'
      module.problems.push(error.message)
    }

    modules.push(module)
  }

  return {
    reviewedAt: new Date().toISOString(),
    menuCount: menuLinks.length,
    modules,
    summary: {
      errorCount: modules.filter(module => module.status === 'error').length,
      problemCount: modules.reduce((sum, module) => sum + module.problems.length, 0),
      modulesWithoutCreateForm: modules.filter(module => !module.createForms.length).map(module => module.menu),
    },
  }
}
