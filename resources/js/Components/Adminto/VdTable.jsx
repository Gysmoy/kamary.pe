import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../../../css/vdtable.css'

/* ------------------------------------------------------------------ helpers */

const getByPath = (obj, path) => {
  if (!path) return undefined
  return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

const normalize = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Combina un arreglo de grupos de filtro DevExtreme con un operador logico
const joinFilters = (groups, op) => {
  const clean = groups.filter((g) => g != null && g.length)
  if (clean.length === 0) return null
  if (clean.length === 1) return clean[0]
  const out = []
  clean.forEach((g, i) => { if (i) out.push(op); out.push(g) })
  return out
}

// Construye el filtro DevExtreme para una columna segun su definicion
const buildColumnFilter = (col, value) => {
  const def = col.filter
  if (!def || value === '' || value == null) return null
  const field = def.field || col.field || col.key
  switch (def.type) {
    case 'text': {
      const fields = def.fields && def.fields.length ? def.fields : [field]
      return joinFilters(fields.map((f) => [f, 'contains', value]), 'or')
    }
    case 'number': {
      const n = Number(value)
      if (Number.isNaN(n)) return null
      return [field, '=', n]
    }
    case 'select':
      return [field, '=', value]
    case 'date':
      return [[field, '>=', `${value} 00:00:00`], 'and', [field, '<=', `${value} 23:59:59`]]
    default:
      return null
  }
}

// Paginado con elipsis: [1, '...', 4, 5, 6, '...', 20]
const paginationRange = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  if (current <= 3) { pages.add(2); pages.add(3); pages.add(4) }
  if (current >= total - 2) { pages.add(total - 1); pages.add(total - 2); pages.add(total - 3) }
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('...')
    out.push(p)
    prev = p
  }
  return out
}

/* ------------------------------------------------- dropdown portal (filtros) */

const PortalDropdown = ({ options, value, placeholder, onChange, align = 'left', menuWidth }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const opts = useMemo(() => options.map((o) => (typeof o === 'object' ? o : { value: o, label: o })), [options])
  const selected = opts.find((o) => String(o.value) === String(value))
  const searchable = opts.length >= 8

  const place = () => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const w = menuWidth || Math.max(r.width, 180)
    let left = r.left + window.scrollX
    if (align === 'right') left = r.right + window.scrollX - w
    setPos({ top: r.bottom + window.scrollY + 4, left, width: w })
  }

  useEffect(() => {
    if (!open) return
    place()
    const onDoc = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  const filtered = query ? opts.filter((o) => normalize(o.label).includes(normalize(query))) : opts

  return (
    <>
      <div ref={triggerRef} className="vdt-fdd" onClick={() => setOpen((v) => !v)}>
        <span className={selected ? '' : 'vdt-fdd-placeholder'} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : (placeholder ?? 'Todos')}
        </span>
        <i className="mdi mdi-chevron-down" style={{ fontSize: 14, color: '#b6b6c2', lineHeight: 1 }}></i>
      </div>
      {open && pos && createPortal(
        <div ref={menuRef} className="vdt-fdd-menu" style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 20000 }}>
          {searchable && (
            <div style={{ position: 'sticky', top: 0, background: '#fff', paddingBottom: 6 }}>
              <input
                autoFocus
                className="form-control form-control-sm"
                placeholder="Buscar…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                style={{ fontSize: 12.5 }}
              />
            </div>
          )}
          <button type="button" className={`vdt-fdd-item ${!selected ? 'active' : ''}`} onClick={() => { onChange(''); setOpen(false); setQuery('') }}>
            {placeholder ?? 'Todos'}
          </button>
          {filtered.map((o) => (
            <button
              type="button"
              key={`${o.value}`}
              className={`vdt-fdd-item ${String(o.value) === String(value) ? 'active' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); setQuery('') }}
            >
              {o.label}
            </button>
          ))}
          {filtered.length === 0 && <div className="vdt-empty" style={{ padding: '12px 0' }}>Sin resultados</div>}
        </div>,
        document.body
      )}
    </>
  )
}

/* --------------------------------------------------------------- VdTable */

const VdTable = forwardRef(({
  gridRef,
  rest,
  icon = 'mdi mdi-table',
  title = '',
  unit = 'registros',
  defaultSort = null,
  defaultPageSize = 10,
  pageSizes = [10, 25, 50, 100],
  columnsMenu = true,
  searchFields = null,
  searchPlaceholder = 'Buscar…',
  searchMobileOnly = false,
  baseFilter = null,
  rowOnClick = null,
  emptyText = 'No se encontraron registros.',
  headerActions = null,
  toolbar = null,
  actions = null,
  columns = [],
  renderCard = null,
}, ref) => {
  const [rows, setRows] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [sort, setSort] = useState(defaultSort ? { field: defaultSort.field, desc: !!defaultSort.desc } : null)
  const [filters, setFilters] = useState({})   // key -> valor aplicado
  const [rawText, setRawText] = useState({})    // key -> valor en pantalla (text/number/date)
  const [search, setSearch] = useState('')
  const [searchRaw, setSearchRaw] = useState('')
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(() => {
    const h = {}
    columns.forEach((c) => { if (c.visible === false) h[c.key] = true })
    return h
  })

  const debounceRef = useRef({})
  const searchDebounceRef = useRef(null)
  const reqIdRef = useRef(0)
  const colMenuBoxRef = useRef(null)
  const reloadRef = useRef(() => {})

  const visibleColumns = columns.filter((c) => !hidden[c.key])

  /* -------- construccion de loadOptions y carga -------- */
  const buildFilter = () => {
    const groups = [baseFilter]
    columns.forEach((c) => {
      if (filters[c.key] !== undefined && filters[c.key] !== '') {
        groups.push(buildColumnFilter(c, filters[c.key]))
      }
    })
    if (search && searchFields?.length) {
      groups.push(joinFilters(searchFields.map((f) => [f, 'contains', search]), 'or'))
    }
    return joinFilters(groups, 'and')
  }

  const buildLoadOptions = (extra = {}) => {
    const opts = {
      requireTotalCount: true,
      skip: (page - 1) * pageSize,
      take: pageSize,
      ...extra,
    }
    if (sort?.field) opts.sort = [{ selector: sort.field, desc: !!sort.desc }]
    const filter = buildFilter()
    if (filter) opts.filter = filter
    return opts
  }

  const load = async () => {
    const id = ++reqIdRef.current
    setLoading(true)
    try {
      const res = await rest.paginate(buildLoadOptions())
      if (id !== reqIdRef.current) return
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
      const count = Number.isFinite(Number(res?.totalCount)) ? Number(res.totalCount) : data.length
      setRows(data)
      setTotalCount(count)
    } catch (e) {
      if (id !== reqIdRef.current) return
      if (e?.name !== 'AbortError') { setRows([]); setTotalCount(0) }
    } finally {
      if (id === reqIdRef.current) setLoading(false)
    }
  }
  reloadRef.current = load

  useEffect(() => { load() }, [page, pageSize, sort, filters, search])

  /* -------- imperativo -------- */
  useImperativeHandle(ref, () => ({
    refresh: () => load(),
    setColFilter: (key, val) => {
      setRawText((r) => ({ ...r, [key]: val }))
      setFilters((f) => { const n = { ...f }; if (val === '' || val == null) delete n[key]; else n[key] = val; return n })
      setPage(1)
    },
    loadAll: async () => {
      const opts = buildLoadOptions({ isLoadingAll: true, requireTotalCount: false, skip: 0, take: undefined })
      delete opts.skip; delete opts.take
      if (typeof rest.exportAll === 'function') {
        const res = await rest.exportAll(opts)
        return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
      }
      const res = await rest.paginate(opts)
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    },
  }))

  /* -------- puente legado dxDataGrid('instance').refresh() -------- */
  useEffect(() => {
    if (!gridRef?.current || typeof window === 'undefined' || !window.$?.fn) return
    const node = gridRef.current
    node._vdInstance = {
      refresh: () => reloadRef.current(),
      option: () => {},
      getDataSource: () => ({ reload: () => reloadRef.current() }),
    }
    if (!$.fn.__vdPatched) {
      const orig = $.fn.dxDataGrid
      $.fn.dxDataGrid = function (...args) {
        if (args[0] === 'instance' && this[0]?._vdInstance) return this[0]._vdInstance
        return orig ? orig.apply(this, args) : undefined
      }
      $.fn.dxDataGrid.__orig = orig
      $.fn.__vdPatched = true
    }
    return () => { if (node) delete node._vdInstance }
  }, [])

  /* -------- cerrar menu de columnas al click fuera -------- */
  useEffect(() => {
    if (!colMenuOpen) return
    const onDoc = (e) => { if (!colMenuBoxRef.current?.contains(e.target)) setColMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [colMenuOpen])

  /* -------- handlers de filtro -------- */
  const commitFilter = (key, value) => {
    setFilters((f) => { const n = { ...f }; if (value === '' || value == null) delete n[key]; else n[key] = value; return n })
    setPage(1)
  }
  const onDebouncedFilter = (key, value) => {
    setRawText((r) => ({ ...r, [key]: value }))
    clearTimeout(debounceRef.current[key])
    debounceRef.current[key] = setTimeout(() => commitFilter(key, value), 400)
  }
  const onInstantFilter = (key, value) => {
    setRawText((r) => ({ ...r, [key]: value }))
    commitFilter(key, value)
  }
  const onSearchChange = (value) => {
    setSearchRaw(value)
    clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => { setSearch(value); setPage(1) }, 400)
  }

  const onSortClick = (col) => {
    if (col.sortable === false) return
    const field = col.field || col.key
    setSort((s) => (s && s.field === field ? { field, desc: !s.desc } : { field, desc: false }))
    setPage(1)
  }

  /* -------- botones de accion por fila -------- */
  const buildActions = (row, variant) => {
    if (!actions) return null
    const list = actions(row).filter((a) => a && !a.hidden)
    if (!list.length) return variant === 'row' ? <span className="text-muted small">—</span> : null
    return list.map((a, i) => (
      <button
        key={i}
        type="button"
        title={a.title}
        className={variant === 'row' ? 'vdt-row-action' : 'vdt-card-action'}
        style={{ background: a.bg || '#f2f2f6', color: a.color || '#555' }}
        onClick={(e) => { e.stopPropagation(); a.onClick?.(row) }}
      >
        <i className={a.icon}></i>{variant === 'card' && a.title ? <span>{a.title}</span> : null}
      </button>
    ))
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const skelRows = Math.min(pageSize, 8)
  const colSpanAll = visibleColumns.length + (actions ? 1 : 0)

  /* -------- render de celda -------- */
  const renderCell = (col, row) => {
    if (col.render) return col.render(row)
    const val = getByPath(row, col.field || col.key)
    return val ?? ''
  }

  return (
    <div className="vd-card vd-panel vd-fade-up" style={{ padding: 16 }}>
      {/* header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: 12 }}>
        <div className="d-flex align-items-center" style={{ gap: 12 }}>
          <span className="vdt-chip"><i className={icon}></i></span>
          <div>
            <h4 className="mb-0" style={{ fontSize: 16, fontWeight: 700, color: 'var(--vd-ink)' }}>{title}</h4>
            <small style={{ color: 'var(--vd-muted)' }}>{totalCount.toLocaleString('es-PE')} {unit} en total</small>
          </div>
        </div>
        {headerActions && <div className="d-flex align-items-center flex-wrap" style={{ gap: 8 }}>{headerActions}</div>}
      </div>

      {/* toolbar: extras + columnas + buscador */}
      {(toolbar || columnsMenu || searchFields) && (
        <div className="d-flex align-items-center flex-wrap mt-3" style={{ gap: 8 }}>
          {toolbar}
          {columnsMenu && (
            <div className="position-relative" ref={colMenuBoxRef}>
              <button type="button" className="vdt-btn-soft" onClick={() => setColMenuOpen((v) => !v)}>
                <i className="mdi mdi-view-column"></i> Columnas
              </button>
              {colMenuOpen && (
                <div className="vdt-colmenu">
                  <p className="vdt-colmenu-title">Mostrar columnas</p>
                  {columns.map((c) => (
                    <label className="vdt-colmenu-item" key={c.key}>
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        checked={!hidden[c.key]}
                        onChange={() => setHidden((h) => ({ ...h, [c.key]: !h[c.key] }))}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          {searchFields?.length > 0 && (
            <div className={`position-relative ${searchMobileOnly ? 'd-md-none' : ''}`} style={{ flex: '1 1 220px', minWidth: 180 }}>
              <i className="mdi mdi-magnify vdt-search-ico"></i>
              <input className="vdt-search" placeholder={searchPlaceholder} value={searchRaw} onChange={(e) => onSearchChange(e.target.value)} />
            </div>
          )}
        </div>
      )}

      {/* tabla desktop */}
      <div className={renderCard ? 'd-none d-md-block' : ''}>
        <div className="vdt-wrap mt-3">
          <table className="vdt-table">
            <thead>
              <tr>
                {visibleColumns.map((c) => {
                  const field = c.field || c.key
                  const active = sort?.field === field
                  return (
                    <th
                      key={c.key}
                      className={c.sortable === false ? '' : 'vdt-sortable'}
                      style={{ width: c.width, textAlign: c.align || 'left' }}
                      onClick={() => onSortClick(c)}
                    >
                      {c.label}
                      {c.sortable !== false && active && (
                        <i className={`vdt-th-caret mdi mdi-menu-${sort.desc ? 'down' : 'up'}`}></i>
                      )}
                    </th>
                  )
                })}
                {actions && <th className="vdt-th-sticky" style={{ background: '#fbfbfd', textAlign: 'right' }}>Acciones</th>}
              </tr>
              {/* fila de filtros */}
              <tr className="vdt-filter-row">
                {visibleColumns.map((c) => (
                  <th key={c.key}>
                    {c.filter?.type === 'text' && (
                      <input className="vdt-fin" placeholder="Filtrar…" value={rawText[c.key] ?? ''} onChange={(e) => onDebouncedFilter(c.key, e.target.value)} />
                    )}
                    {c.filter?.type === 'number' && (
                      <input type="number" className="vdt-fin vdt-fnum" placeholder="Filtrar…" value={rawText[c.key] ?? ''} onChange={(e) => onDebouncedFilter(c.key, e.target.value)} />
                    )}
                    {c.filter?.type === 'date' && (
                      <input type="date" className="vdt-fin" value={rawText[c.key] ?? ''} onChange={(e) => onInstantFilter(c.key, e.target.value)} />
                    )}
                    {c.filter?.type === 'select' && (
                      <PortalDropdown
                        options={c.filter.options || []}
                        value={filters[c.key] ?? ''}
                        placeholder={c.filter.placeholder ?? 'Todos'}
                        onChange={(v) => onInstantFilter(c.key, v)}
                      />
                    )}
                  </th>
                ))}
                {actions && <th className="vdt-th-sticky" style={{ background: '#fff' }}></th>}
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: skelRows }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  {visibleColumns.map((c) => (
                    <td key={c.key}><span className="vdt-skel" style={{ width: `${40 + ((i * 7 + c.key.length) % 45)}%` }}></span></td>
                  ))}
                  {actions && <td className="vdt-td-sticky" style={{ textAlign: 'right' }}><span className="vdt-skel vdt-skel-btn"></span></td>}
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={colSpanAll}><p className="vdt-empty">{emptyText}</p></td></tr>
              )}
              {!loading && rows.map((row, ri) => (
                <tr
                  key={row.id ?? ri}
                  className={rowOnClick ? 'vdt-row-click' : ''}
                  onClick={rowOnClick ? () => rowOnClick(row) : undefined}
                >
                  {visibleColumns.map((c) => (
                    <td
                      key={c.key}
                      className={c.muted ? 'vdt-muted' : ''}
                      style={{ textAlign: c.align || 'left', whiteSpace: c.nowrap ? 'nowrap' : undefined }}
                    >
                      {renderCell(c, row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="vdt-td-sticky" style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex justify-content-end" style={{ gap: 6 }}>{buildActions(row, 'row')}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* cards mobile */}
      {renderCard && (
        <div className="d-md-none mt-3 d-flex flex-column" style={{ gap: 10 }}>
          {loading && Array.from({ length: skelRows }).map((_, i) => (
            <div className="vdt-card" key={`skc-${i}`}>
              <span className="vdt-skel" style={{ width: '60%' }}></span>
              <div className="mt-2"><span className="vdt-skel" style={{ width: '40%' }}></span></div>
            </div>
          ))}
          {!loading && rows.length === 0 && <p className="vdt-empty">{emptyText}</p>}
          {!loading && rows.map((row, ri) => (
            <div key={row.id ?? ri}>{renderCard(row, buildActions(row, 'card'))}</div>
          ))}
        </div>
      )}

      {/* paginacion */}
      <div className="d-flex align-items-center justify-content-between flex-wrap mt-3" style={{ gap: 12 }}>
        <div className="d-flex align-items-center" style={{ gap: 8 }}>
          <small style={{ color: 'var(--vd-muted)' }}>Mostrar</small>
          <div style={{ width: 84 }}>
            <PortalDropdown
              options={pageSizes.map((n) => ({ value: n, label: `${n}` }))}
              value={pageSize}
              placeholder={`${pageSize}`}
              onChange={(v) => { setPageSize(Number(v)); setPage(1) }}
              menuWidth={100}
            />
          </div>
          <small style={{ color: 'var(--vd-muted)' }}>por pagina</small>
        </div>
        <div className="d-flex align-items-center" style={{ gap: 4 }}>
          <button type="button" className="vdt-pg-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <i className="mdi mdi-chevron-left"></i>
          </button>
          {paginationRange(page, totalPages).map((p, i) => (
            p === '...'
              ? <span key={`e-${i}`} className="vdt-pg-btn" style={{ cursor: 'default' }}>…</span>
              : <button key={p} type="button" className={`vdt-pg-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button type="button" className="vdt-pg-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            <i className="mdi mdi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  )
})

VdTable.displayName = 'VdTable'

export default VdTable
