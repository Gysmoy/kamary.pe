async (page) => {
  const normalize = (value) => String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[\uE000-\uF8FF]/g, '')
    .trim();

  const isLocal = page.url().includes('127.0.0.1') || page.url().includes('localhost');
  const menu = await page.evaluate((normalizeSource) => {
    const normalize = eval(`(${normalizeSource})`);
    let anchors = [...document.querySelectorAll('aside a[href], nav a[href], .app-menu a[href], .side-nav a[href], #sidebar a[href]')];
    if (anchors.length === 0) anchors = [...document.querySelectorAll('a[href]')];
    const rows = [];
    let currentGroup = 'Sin grupo';

    for (const a of anchors) {
      const rawText = normalize(a.innerText || a.textContent || '');
      const href = a.href || '';
      if (!rawText || !href || href.endsWith('#')) {
        if (rawText && !/^(×|x)$/i.test(rawText)) currentGroup = rawText;
        continue;
      }

      const parentLi = a.closest('ul')?.closest('li');
      const parentAnchor = parentLi?.querySelector(':scope > a');
      const group = normalize(parentAnchor?.innerText || currentGroup || 'Sin grupo');
      rows.push({ group, text: rawText, href });
    }

    const seen = new Set();
    return rows.filter((row) => {
      const key = `${row.group}|${row.text}|${row.href}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, normalize.toString());

  const skip = [/\/principal#?$/, /#item-/, /\/$/, /\/login$/, /^javascript:/i];
  const modules = menu.filter((item) => item.href && !skip.some((rx) => rx.test(item.href)));

  const extractPage = async (module) => {
    await page.goto(module.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 3500 }).catch(() => {});
    await page.waitForTimeout(500);

    const base = await page.evaluate((normalizeSource) => {
      const normalize = eval(`(${normalizeSource})`);
      const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      const labelFor = (el) => {
        if (el.id) {
          const direct = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
          if (direct) return normalize(direct.innerText || direct.textContent);
        }
        const wrapped = el.closest('label');
        if (wrapped) return normalize(wrapped.innerText || wrapped.textContent);
        const group = el.closest('.form-group, .mb-3, .col, .col-12, .col-md-3, .col-md-4, .col-md-6, .col-md-8');
        const label = group?.querySelector('label');
        return normalize(label?.innerText || label?.textContent);
      };

      const tableHeaders = [
        ...document.querySelectorAll('table thead th, .dx-datagrid-headers .dx-datagrid-text-content, .dx-header-row td, .ag-header-cell-text')
      ]
        .filter(visible)
        .map((el) => normalize(el.innerText || el.textContent))
        .filter(Boolean);

      const controls = [...document.querySelectorAll('input, select, textarea')]
        .filter(visible)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          type: el.type || '',
          name: el.getAttribute('name') || '',
          id: el.id || '',
          label: labelFor(el),
          placeholder: el.getAttribute('placeholder') || '',
          required: !!el.required,
          options: el.tagName === 'SELECT'
            ? [...el.options].slice(0, 12).map((option) => normalize(option.textContent)).filter(Boolean)
            : []
        }));

      const buttons = [...document.querySelectorAll('button, a.btn, input[type=button], input[type=submit], .dx-button, [role=button]')]
        .filter(visible)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          text: normalize(el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title')),
          title: normalize(el.getAttribute('title') || el.getAttribute('aria-label')),
          href: el.href || ''
        }))
        .filter((row) => row.text || row.title || row.href);

      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,.card-title,.header-title,.page-title')]
        .filter(visible)
        .map((el) => normalize(el.innerText || el.textContent))
        .filter(Boolean);

      const exportSignals = buttons
        .filter((button) => /excel|pdf|export|exportar|descargar|imprimir|print/i.test(`${button.text} ${button.title}`))
        .map((button) => button.text || button.title);

      return {
        url: location.href,
        title: document.title,
        headings: [...new Set(headings)].slice(0, 20),
        tableHeaders: [...new Set(tableHeaders)].slice(0, 80),
        controls,
        buttons: buttons.slice(0, 80),
        exportSignals: [...new Set(exportSignals)]
      };
    }, normalize.toString());

    const addCandidate = await page.evaluate((normalizeSource) => {
      const normalize = eval(`(${normalizeSource})`);
      const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      const candidates = [...document.querySelectorAll('button, a.btn, .dx-button, [role=button]')]
        .filter(visible)
        .map((el, index) => ({
          index,
          text: normalize(el.innerText || el.getAttribute('title') || el.getAttribute('aria-label')),
          title: normalize(el.getAttribute('title') || el.getAttribute('aria-label')),
          className: el.className || ''
        }))
        .filter((row) => /agregar|nuevo|crear|registrar|add/i.test(`${row.text} ${row.title} ${row.className}`));

      return candidates[0] || null;
    }, normalize.toString());

    let modal = null;
    if (addCandidate) {
      try {
        const clicked = await page.evaluate((candidate, normalizeSource) => {
          const normalize = eval(`(${normalizeSource})`);
          const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
          const elements = [...document.querySelectorAll('button, a.btn, .dx-button, [role=button]')].filter(visible);
          const el = elements[candidate.index];
          if (!el) return false;
          el.click();
          return true;
        }, addCandidate, normalize.toString());

        if (clicked) {
          await page.waitForTimeout(600);
          modal = await page.evaluate((normalizeSource) => {
            const normalize = eval(`(${normalizeSource})`);
            const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
            const roots = [...document.querySelectorAll('.modal.show, .modal:has(.modal-dialog), [role=dialog], .dx-popup-wrapper')]
              .filter(visible);
            const root = roots[0] || null;
            if (!root) return null;

            const fields = [...root.querySelectorAll('input, select, textarea')]
              .filter(visible)
              .map((el) => {
                const group = el.closest('.form-group, .mb-3, .col, .col-12, .col-md-3, .col-md-4, .col-md-6, .col-md-8');
                const label = group?.querySelector('label');
                return {
                  tag: el.tagName.toLowerCase(),
                  type: el.type || '',
                  name: el.getAttribute('name') || '',
                  label: normalize(label?.innerText || label?.textContent || el.getAttribute('placeholder') || el.id || el.name),
                  placeholder: el.getAttribute('placeholder') || '',
                  required: !!el.required,
                  options: el.tagName === 'SELECT'
                    ? [...el.options].slice(0, 12).map((option) => normalize(option.textContent)).filter(Boolean)
                    : []
                };
              });

            const buttons = [...root.querySelectorAll('button, a.btn, input[type=button], input[type=submit], .dx-button')]
              .filter(visible)
              .map((el) => normalize(el.innerText || el.value || el.getAttribute('title') || el.getAttribute('aria-label')))
              .filter(Boolean);

            return {
              title: normalize(root.querySelector('.modal-title, .dx-popup-title, h1,h2,h3,h4,h5')?.innerText || ''),
              fields,
              buttons: [...new Set(buttons)]
            };
          }, normalize.toString());

          await page.keyboard.press('Escape').catch(() => {});
          await page.waitForTimeout(250);
        }
      } catch (error) {
        modal = { error: error.message, candidate: addCandidate };
      }
    }

    return { ...module, ...base, addCandidate, modal };
  };

  const results = [];
  for (const module of modules) {
    try {
      results.push(await extractPage(module));
    } catch (error) {
      results.push({ ...module, error: error.message });
    }
  }

  return {
    source: isLocal ? 'local' : 'reference',
    capturedAt: new Date().toISOString(),
    startUrl: page.url(),
    menu,
    modules: results
  };
}
