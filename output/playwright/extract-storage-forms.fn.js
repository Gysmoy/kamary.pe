async (page) => {
  const modules = [
    {
      name: 'Inventario',
      url: 'https://kamary.l105.com/almacenamiento/inventario',
      triggers: ['.openmodalinventario_nuevo', '.editarinventario'],
    },
    {
      name: 'Clientes',
      url: 'https://kamary.l105.com/almacen/clientealmacenamiento',
      triggers: ['.btncrearclientesform', '.btnContratosClienteAlmacenamiento', '.cliente-mantenimiento-usuarios', '.btnNotificacionCliente', '.btnRedDistribucion'],
    },
    {
      name: 'O. Servicio',
      url: 'https://kamary.l105.com/almacenamiento/ordenservicio',
      triggers: ['.nuevoordenservicio', '.editarordenservicio'],
    },
    {
      name: 'Und. de medida',
      url: 'https://kamary.l105.com/almacenamiento/unidad',
      triggers: ['.unidadbtnnuevoalmacenamiento', '.unidadeditaralmacenamientobtn'],
    },
    {
      name: 'Creacion del producto',
      url: 'https://kamary.l105.com/almacenamiento/articulo',
      triggers: ['.nuevoarticuloclientebtn', '.editararticuloclientebtn', '.editararticulobtn'],
    },
    {
      name: 'Nota de entrada',
      url: 'https://kamary.l105.com/almacenamiento/notaentrada',
      triggers: ['.nuevorequerimientoalmacenamiento', '.editarrequerimientoalmacenamiento', '.btnVerEvidenciasNotaEntrada'],
    },
    {
      name: 'Nota de salida',
      url: 'https://kamary.l105.com/almacenamiento/notasalida',
      triggers: ['.nuevorequerimientoalmacenamiento', '.editarrequerimientoalmacenamiento', '.btnVerEvidenciasNotaEntrada'],
    },
    {
      name: 'Kardex',
      url: 'https://kamary.l105.com/almacenamiento/kardex',
      triggers: [],
    },
    {
      name: 'Servicio General',
      url: 'https://kamary.l105.com/almacenamiento/serviciogeneral',
      triggers: ['.serviciogeneralbtnnuevo', '.serviciogeneraleditarbtn'],
    },
    {
      name: 'Control de Facturacion',
      url: 'https://kamary.l105.com/almacenamiento/facturacion',
      triggers: ['.nuevofacturalote', '.reportFacturaEmitidas', '.btnfacturar-prefactura'],
    },
    {
      name: 'O. Servicio General',
      url: 'https://kamary.l105.com/almacenamiento/ordenserviciogeneral',
      triggers: ['.ordenserviciogeneralbtnnuevo', '.ordenserviciogeneraleditarbtn'],
    },
  ];

  const clean = (value) => `${value ?? ''}`.replace(/\s+/g, ' ').trim();
  const waitSettled = async () => {
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
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
      let previous = el.previousElementSibling;
      for (let i = 0; previous && i < 3; i += 1, previous = previous.previousElementSibling) {
        const text = clean(previous.innerText || previous.textContent);
        if (text && text.length < 100) return text;
      }
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
          ? Array.from(el.options).slice(0, 16).map((option) => clean(option.textContent)).filter(Boolean)
          : [],
      }));
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,.modal-title,.block-title,.content-heading,.font-w600'))
      .filter(visible)
      .map((el) => clean(el.innerText || el.textContent))
      .filter(Boolean)
      .slice(0, 30);
    const buttons = Array.from(document.querySelectorAll('button,a.btn,input[type=button],input[type=submit],[role=button]'))
      .filter(visible)
      .map((el) => ({
        text: clean(el.innerText || el.value || el.title || el.getAttribute('aria-label')),
        title: clean(el.title),
        className: clean(el.className),
        href: el.href || '',
      }))
      .filter((button) => button.text || button.title || button.className || button.href)
      .slice(0, 80);
    const tableHeaders = Array.from(document.querySelectorAll('table thead th'))
      .filter(visible)
      .map((el) => clean(el.innerText || el.textContent))
      .filter(Boolean);
    const tabTexts = Array.from(document.querySelectorAll('.nav-tabs a,[role=tab]'))
      .filter(visible)
      .map((el) => clean(el.innerText || el.textContent))
      .filter(Boolean);
    const bodyHints = Array.from(document.querySelectorAll('.modal.in,.modal.show,[role=dialog],form,.block'))
      .filter(visible)
      .map((el) => clean(el.innerText || el.textContent))
      .filter(Boolean)
      .map((text) => text.slice(0, 500))
      .slice(0, 12);

    return { headings, fields, buttons, tableHeaders, tabTexts, bodyHints };
  });

  const clickFirst = async (selector) => page.evaluate((selector) => {
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

  const closeSurface = async (url) => {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      const closePattern = /(cerrar|cancelar|close|×|x)/i;
      const visible = (el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const target = Array.from(document.querySelectorAll('button,a.btn,input[type=button],input[type=submit]'))
        .filter(visible)
        .find((el) => closePattern.test(`${el.innerText || el.value || el.title || el.getAttribute('aria-label') || ''}`));
      if (target) target.click();
    }).catch(() => {});
    await page.waitForTimeout(250);
    if (page.url() !== url) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await waitSettled();
    }
  };

  const report = [];
  for (const mod of modules) {
    await page.goto(mod.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitSettled();
    const initial = await collect();
    const entry = { name: mod.name, url: mod.url, initial, forms: [] };

    for (const selector of mod.triggers) {
      await page.goto(mod.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitSettled();
      const clicked = await clickFirst(selector);
      await waitSettled();
      entry.forms.push({
        selector,
        clicked,
        urlAfterClick: page.url(),
        snapshot: clicked ? await collect() : null,
      });
      await closeSurface(mod.url);
    }

    report.push(entry);
  }

  return report;
}
