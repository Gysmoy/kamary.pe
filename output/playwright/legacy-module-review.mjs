import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const loginUrl = process.env.LEGACY_LOGIN_URL || 'https://kamary.l105.com/inicio/ingresar'
const username = process.env.LEGACY_USER
const password = process.env.LEGACY_PASS
const outDir = process.env.REVIEW_OUT_DIR || 'output/playwright'

if (!username || !password) {
  throw new Error('LEGACY_USER y LEGACY_PASS son obligatorios')
}

const waitSettled = async (page) => {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(900)
}

const clean = (value) => `${value ?? ''}`.replace(/\s+/g, ' ').trim()

const collectVisibleControls = async (page) => page.evaluate(() => {
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

const getMenuLinks = async (page) => page.evaluate(() => {
  const clean = (value) => `${value ?? ''}`.replace(/\s+/g, ' ').trim()
  const links = Array.from(document.querySelectorAll('nav a[href], aside a[href], .sidebar a[href]'))
    .map((a) => ({
      text: clean(a.innerText || a.textContent),
      href: a.href,
    }))
    .filter(link => link.href && !link.href.endsWith('#') && link.href.includes('kamary.l105.com'))
  const seen = new Set()
  return links.filter(link => {
    const key = `${link.text}|${link.href}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const findCreateTriggerIndexes = (buttons) => {
  const include = /(agregar|crear|registrar|nuevo|añadir|ingresar pedido|mantenedor)/i
  const exclude = /(filtrar|buscar|excel|pdf|imprimir|copiar|cerrar|cancelar|guardar|eliminar|borrar|anular|descargar|exportar|refrescar|actualizar)/i
  return buttons
    .map((button, index) => ({ ...button, index }))
    .filter(button => {
      const text = `${button.text} ${button.title}`.trim()
      if (!text) return false
      if (exclude.test(text)) return false
      return include.test(text) || text === '+' || text === ''
    })
    .slice(0, 2)
}

const clickCreateTrigger = async (page, candidate) => {
  const text = candidate.text || candidate.title
  const escapedText = text.replace(/"/g, '\\"')
  const clicked = await page.evaluate(async ({ text, title, href }) => {
    const clean = (value) => `${value ?? ''}`.replace(/\s+/g, ' ').trim()
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }
    const candidates = Array.from(document.querySelectorAll('button, a.btn, input[type="button"], input[type="submit"], [role="button"]'))
      .filter(isVisible)
      .filter((el) => {
        const label = clean(el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title'))
        return (text && label === text) || (title && clean(el.getAttribute('title')) === title) || (href && el.href === href)
      })
    const target = candidates[0]
    if (!target) return false
    target.click()
    return true
  }, { text, title: candidate.title, href: candidate.href })
  if (!clicked) {
    await page.locator(`text="${escapedText}"`).first().click({ timeout: 3000 }).catch(() => {})
  }
}

const closeOpenedSurface = async (page, originalUrl) => {
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
    await waitSettled(page)
  }
}

await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  ignoreHTTPSErrors: true,
})
const page = await context.newPage()
const consoleMessages = []
page.on('console', msg => {
  if (['error', 'warning'].includes(msg.type())) {
    consoleMessages.push({ type: msg.type(), text: msg.text(), url: page.url() })
  }
})
page.on('pageerror', error => {
  consoleMessages.push({ type: 'pageerror', text: error.message, url: page.url() })
})

await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
await waitSettled(page)
await page.locator('input[name="username"], input[type="text"]').first().fill(username)
await page.locator('input[name="password"], input[type="password"]').first().fill(password)
await page.getByRole('button', { name: /ingresar/i }).click()
await waitSettled(page)

const menuLinks = await getMenuLinks(page)
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
    await waitSettled(page)
    module.loaded = true
    module.redirectedUrl = page.url()

    const initial = await collectVisibleControls(page)
    Object.assign(module, initial)

    if (!initial.fields.length && !initial.tableHeaders.length && !initial.buttons.length) {
      module.problems.push('No se detectaron campos, tabla ni botones visibles.')
    }

    const createTriggers = findCreateTriggerIndexes(initial.buttons)
    for (const trigger of createTriggers) {
      const beforeUrl = page.url()
      await clickCreateTrigger(page, trigger)
      await waitSettled(page)
      const afterClick = await collectVisibleControls(page)
      module.createForms.push({
        trigger: trigger.text || trigger.title || trigger.href,
        urlAfterClick: page.url(),
        headings: afterClick.headings,
        fields: afterClick.modals.length ? afterClick.modals.flatMap(modal => modal.fields) : afterClick.fields,
        modalTitles: afterClick.modals.map(modal => modal.title).filter(Boolean),
        buttons: afterClick.modals.length ? afterClick.modals.flatMap(modal => modal.buttons) : afterClick.buttons,
      })
      await closeOpenedSurface(page, beforeUrl)
    }
  } catch (error) {
    module.status = 'error'
    module.problems.push(error.message)
    const filename = `legacy-error-${modules.length + 1}.png`
    await page.screenshot({ path: path.join(outDir, filename), fullPage: true }).catch(() => {})
    module.screenshot = filename
  }

  modules.push(module)
}

const report = {
  reviewedAt: new Date().toISOString(),
  loginUrl,
  menuCount: menuLinks.length,
  modules,
  consoleMessages,
}

await fs.writeFile(path.join(outDir, 'legacy-module-review.json'), JSON.stringify(report, null, 2))
await fs.writeFile(path.join(outDir, 'legacy-menu-links.json'), JSON.stringify(menuLinks, null, 2))
await browser.close()

console.log(JSON.stringify({
  menuCount: menuLinks.length,
  moduleCount: modules.length,
  errorCount: modules.filter(module => module.status === 'error').length,
  problemCount: modules.reduce((sum, module) => sum + module.problems.length, 0),
  report: path.join(outDir, 'legacy-module-review.json'),
}, null, 2))
