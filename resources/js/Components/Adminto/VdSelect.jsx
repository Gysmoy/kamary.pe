import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'

// Accent- and case-insensitive normalization for search matching.
const normalize = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const normOpt = (opt) =>
  opt !== null && typeof opt === 'object' ? { value: opt.value, label: opt.label } : { value: opt, label: opt }

const VdSelect = ({
  id,
  label,
  col = '',
  required = false,
  disabled = false,
  value,
  onChange = () => {},
  options = [],
  placeholder = 'Seleccionar…',
  searchable,
  noMargin = false,
  style,
  // Modo asíncrono / búsqueda remota: (query) => Promise<[{value,label}]>
  loadOptions = null,
  valueLabel = null,   // etiqueta a mostrar para el value actual en modo async (modo edición)
  clearable = false,   // muestra una "x" para limpiar la selección
  minSearchLength = 0, // en async, nº mínimo de caracteres para buscar
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, placement: 'bottom', maxHeight: 260 })
  const [asyncResults, setAsyncResults] = useState([])
  const [loadingAsync, setLoadingAsync] = useState(false)
  const [pickedLabel, setPickedLabel] = useState(null) // etiqueta de lo último seleccionado por el usuario

  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const asyncReqRef = useRef(0)

  const isAsync = typeof loadOptions === 'function'

  // Normalize static option list: string -> { value, label }.
  const normOptions = useMemo(() => (options || []).map(normOpt), [options])

  // Decide whether the search box is shown (siempre en async).
  const showSearch = isAsync || searchable === true || (searchable === undefined && normOptions.length >= 8)

  // Opciones a mostrar: en async las que devolvió el servidor; en estático, filtradas localmente.
  const filteredStatic = useMemo(() => {
    if (!showSearch || !query) return normOptions
    const q = normalize(query)
    return normOptions.filter((opt) => normalize(opt.label).includes(q))
  }, [normOptions, query, showSearch])
  const displayOptions = isAsync ? asyncResults : filteredStatic

  // Etiqueta del valor seleccionado (para el trigger).
  const selectedLabel = useMemo(() => {
    if (value === '' || value == null) return null
    const pool = isAsync ? asyncResults : normOptions
    const hit = pool.find((o) => String(o.value) === String(value))
    if (hit) return hit.label
    if (pickedLabel != null) return pickedLabel
    if (valueLabel != null) return valueLabel
    return null
  }, [value, isAsync, asyncResults, normOptions, pickedLabel, valueLabel])

  const hasValue = value !== '' && value != null

  // Compute menu position from the trigger's bounding rect. Devuelve false si el trigger ya no
  // esta visible (scrolleado fuera de su contenedor), para que quien llame decida cerrar.
  const computePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return false
    const rect = el.getBoundingClientRect()
    const viewportH = window.innerHeight || document.documentElement.clientHeight
    const viewportW = window.innerWidth || document.documentElement.clientWidth

    if (rect.bottom < 0 || rect.top > viewportH || rect.right < 0 || rect.left > viewportW) return false

    // Si abajo no cabe y arriba hay mas sitio, el menu se ancla al borde superior del trigger y se
    // desplaza con translateY(-100%): asi no hace falta conocer su altura real de antemano.
    const spaceBelow = viewportH - rect.bottom - 8
    const spaceAbove = rect.top - 8
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow

    setPos({
      top: openUp ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
      placement: openUp ? 'top' : 'bottom',
      maxHeight: Math.max(140, Math.min(260, openUp ? spaceAbove : spaceBelow)),
    })
    return true
  }, [])

  const closeMenu = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const toggleMenu = useCallback(() => {
    if (disabled) return
    if (open) closeMenu()
    else { computePosition(); setOpen(true) }
  }, [disabled, open, closeMenu, computePosition])

  // Auto-focus the search input when the menu opens.
  useEffect(() => {
    if (open && showSearch) {
      const t = window.setTimeout(() => { if (searchRef.current) searchRef.current.focus() }, 0)
      return () => window.clearTimeout(t)
    }
  }, [open, showSearch])

  // Modo async: buscar al abrir y al teclear (con debounce), con guardia de carrera.
  useEffect(() => {
    if (!open || !isAsync) return
    if (query && query.length < minSearchLength) { setAsyncResults([]); setLoadingAsync(false); return }
    const reqId = ++asyncReqRef.current
    setLoadingAsync(true)
    const run = async () => {
      try {
        const res = await loadOptions(query)
        if (reqId !== asyncReqRef.current) return
        setAsyncResults((res || []).map(normOpt))
      } catch {
        if (reqId === asyncReqRef.current) setAsyncResults([])
      } finally {
        if (reqId === asyncReqRef.current) setLoadingAsync(false)
      }
    }
    const t = window.setTimeout(run, query ? 350 : 0)
    return () => window.clearTimeout(t)
  }, [open, query, isAsync, minSearchLength])

  // Listeners to close the menu: outside click, Escape, resize, scroll.
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      closeMenu()
    }
    // En FASE DE CAPTURA a proposito: dentro de un modal de Bootstrap el handler de Escape del
    // modal esta enganchado al propio modal, que en burbujeo recibe el evento antes que document.
    // Sin capturar aqui, un Escape para cerrar el desplegable cerraba el formulario entero.
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      closeMenu()
    }
    // El menu vive en un portal a document.body, asi que hay que reseguir al trigger cuando scrollea
    // cualquier contenedor (cuerpo del modal, .table-responsive, la pagina). Cerrarlo en cada scroll
    // hacia imposible elegir en formularios largos.
    let frame = null
    const sync = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(() => {
        frame = null
        if (!computePosition()) closeMenu()
      })
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
    }
  }, [open, closeMenu, computePosition])

  const handleSelect = (opt) => {
    setPickedLabel(opt.label)
    onChange(opt.value)
    closeMenu()
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setPickedLabel(null)
    onChange('')
  }

  const triggerStyle = {
    width: '100%', height: '38px', padding: '0 12px', border: '1px solid #e2e2ea', borderRadius: '6px',
    background: '#fff', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: '14px', color: '#2c2b34', opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
  }
  const chevronStyle = {
    color: '#9a99a8', fontSize: '12px', marginLeft: '8px',
    transition: 'transform .15s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
  }
  const menuStyle = {
    position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 20000,
    background: '#fff', borderRadius: '12px', boxShadow: '0 16px 40px rgba(30,30,45,.16)',
    border: '1px solid #e2e2ea', maxHeight: `${pos.maxHeight}px`, overflowY: 'auto', padding: '6px',
    transform: pos.placement === 'top' ? 'translateY(-100%)' : 'none',
  }

  return (
    <div className={`form-group ${col} ${noMargin ? '' : 'mb-2'}`} style={style}>
      {label && (
        <label className="form-label mb-1" htmlFor={id}>
          {label} {required && <b style={{ color: '#ff5b5b' }}>*</b>}
        </label>
      )}

      <button type="button" id={id} ref={triggerRef} disabled={disabled} onClick={toggleMenu} style={triggerStyle}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedLabel ? '#2c2b34' : '#9a99a8' }}>
          {selectedLabel ?? placeholder}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {clearable && hasValue && !disabled && (
            <i className="mdi mdi-close" onClick={handleClear} title="Limpiar"
              style={{ color: '#9a99a8', fontSize: '14px', marginLeft: '6px', cursor: 'pointer' }} />
          )}
          <i className="mdi mdi-chevron-down" style={chevronStyle} />
        </span>
      </button>

      {open &&
        createPortal(
          <div ref={menuRef} style={menuStyle}>
            {showSearch && (
              <div style={{ position: 'sticky', top: 0, background: '#fff', paddingBottom: '6px', marginBottom: '2px', zIndex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <i className="mdi mdi-magnify" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9a99a8', fontSize: '12px', pointerEvents: 'none' }} />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    placeholder={isAsync ? 'Buscar…' : 'Buscar…'}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') e.preventDefault()
                      if (e.key === 'Escape') { e.preventDefault(); closeMenu() }
                    }}
                    style={{ width: '100%', height: '34px', padding: '0 10px 0 30px', border: '1px solid #e2e2ea', borderRadius: '8px', fontSize: '13px', color: '#2c2b34', outline: 'none' }}
                  />
                </div>
              </div>
            )}

            {isAsync && loadingAsync ? (
              <div style={{ textAlign: 'center', color: '#9a99a8', fontSize: '13px', padding: '10px' }}>
                <i className="mdi mdi-loading mdi-spin" style={{ marginRight: 6 }} />Buscando…
              </div>
            ) : displayOptions.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9a99a8', fontSize: '13px', padding: '10px' }}>
                {isAsync && query && query.length < minSearchLength ? `Escribe al menos ${minSearchLength} caracteres` : 'Sin resultados'}
              </div>
            ) : (
              displayOptions.map((opt, i) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <button
                    key={`${String(opt.value)}-${i}`}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f5f5f9' }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: '8px', fontSize: '13px',
                      border: 'none', background: isSelected ? '#ff5b5b' : 'transparent', color: isSelected ? '#fff' : '#2c2b34',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
                    {isSelected && <i className="mdi mdi-check" style={{ fontSize: '14px', flexShrink: 0 }} />}
                  </button>
                )
              })
            )}
          </div>,
          document.body
        )}
    </div>
  )
}

export default VdSelect
