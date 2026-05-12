async (page) => {
  const target = await page.evaluate(() => window.localStorage.getItem('STORAGE_TARGET'));
  const modules = {
    inventory: {
      name: 'Inventario',
      url: 'https://kamary.l105.com/almacenamiento/inventario',
      trigger: '.openmodalinventario_nuevo',
    },
    clients: {
      name: 'Clientes',
      url: 'https://kamary.l105.com/almacen/clientealmacenamiento',
      trigger: '.btncrearclientesform',
    },
    serviceOrder: {
      name: 'O. Servicio',
      url: 'https://kamary.l105.com/almacenamiento/ordenservicio',
      trigger: '.nuevoordenservicio',
    },
    unit: {
      name: 'Und. de medida',
      url: 'https://kamary.l105.com/almacenamiento/unidad',
      trigger: '.unidadbtnnuevoalmacenamiento',
    },
    product: {
      name: 'Creacion del producto',
      url: 'https://kamary.l105.com/almacenamiento/articulo',
      trigger: '.nuevoarticuloclientebtn',
    },
    entryNote: {
      name: 'Nota de entrada',
      url: 'https://kamary.l105.com/almacenamiento/notaentrada',
      trigger: '.nuevorequerimientoalmacenamiento',
    },
    exitNote: {
      name: 'Nota de salida',
      url: 'https://kamary.l105.com/almacenamiento/notasalida',
      trigger: '.nuevorequerimientoalmacenamiento',
    },
    kardex: {
      name: 'Kardex',
      url: 'https://kamary.l105.com/almacenamiento/kardex',
      trigger: '',
    },
    generalService: {
      name: 'Servicio General',
      url: 'https://kamary.l105.com/almacenamiento/serviciogeneral',
      trigger: '.serviciogeneralbtnnuevo',
    },
    billing: {
      name: 'Control de Facturacion',
      url: 'https://kamary.l105.com/almacenamiento/facturacion',
      trigger: '.nuevofacturalote',
    },
    generalServiceOrder: {
      name: 'O. Servicio General',
      url: 'https://kamary.l105.com/almacenamiento/ordenserviciogeneral',
      trigger: '.ordenserviciogeneralbtnnuevo',
    },
  };

  const mod = modules[target];
  if (!mod) return { error: `STORAGE_TARGET invalido: ${target}`, allowed: Object.keys(modules) };

  const waitSettled = async () => {
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(700);
  };

  const collect = async () => page.evaluate(() => {
    const clean = (value) => `${value ?? ''}`.replace(/\s+/g, ' ').trim();
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const labelFor = (el) => {
      if (el.id) {
        const exact = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (exact) return clean(exact.innerText);
      }
      const container = el.closest('.form-group,.form-material,.input-group,.col-md-1,.col-md-2,.col-md-3,.col-md-4,.col-md-5,.col-md-6,.col-md-7,.col-md-8,.col-sm-1,.col-sm-2,.col-sm-3,.col-sm-4,.col-sm-5,.col-sm-6,.col-xs-12,td,th');
      const label = container?.querySelector('label,.control-label');
      if (label) return clean(label.innerText);
      return clean(el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.name || el.id);
    };
    const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]),select,textarea'))
      .filter(visible)
      .map((el) => ({
        label: labelFor(el),
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        name: el.getAttribute('name') || '',
        id: el.id || '',
        placeholder: el.getAttribute('placeholder') || '',
        required: Boolean(el.required || el.getAttribute('required') !== null || /\brequired\b/i.test(el.className?.toString?.() || '')),
        disabled: Boolean(el.disabled),
        options: el.tagName.toLowerCase() === 'select'
          ? Array.from(el.options).slice(0, 14).map((option) => clean(option.textContent)).filter(Boolean)
          : [],
      }));
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,.modal-title,.block-title,.content-heading'))
      .filter(visible)
      .map((el) => clean(el.innerText || el.textContent))
      .filter(Boolean)
      .slice(0, 20);
    const buttons = Array.from(document.querySelectorAll('button,a.btn,input[type=button],input[type=submit],[role=button]'))
      .filter(visible)
      .map((el) => ({
        text: clean(el.innerText || el.value || el.title || el.getAttribute('aria-label')),
        title: clean(el.title),
        className: clean(el.className),
        href: el.href || '',
      }))
      .filter((button) => button.text || button.title || button.className || button.href)
      .slice(0, 70);
    const tableHeaders = Array.from(document.querySelectorAll('table thead th'))
      .filter(visible)
      .map((el) => clean(el.innerText || el.textContent))
      .filter(Boolean);
    const visibleTexts = Array.from(document.querySelectorAll('.modal.in,.modal.show,[role=dialog],form,.block-content'))
      .filter(visible)
      .map((el) => clean(el.innerText || el.textContent))
      .filter(Boolean)
      .map((text) => text.slice(0, 400))
      .slice(0, 8);
    return { headings, fields, buttons, tableHeaders, visibleTexts };
  });

  const clickVisible = async (selector) => page.evaluate((selector) => {
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const target = Array.from(document.querySelectorAll(selector)).find(visible);
    if (!target) return false;
    target.click();
    return true;
  }, selector);

  await page.goto(mod.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitSettled();
  const initial = await collect();
  let form = null;
  let clicked = false;
  if (mod.trigger) {
    clicked = await clickVisible(mod.trigger);
    await waitSettled();
    form = await collect();
  }

  return {
    target,
    name: mod.name,
    url: mod.url,
    trigger: mod.trigger,
    clicked,
    urlAfterClick: page.url(),
    initial,
    form,
  };
}
