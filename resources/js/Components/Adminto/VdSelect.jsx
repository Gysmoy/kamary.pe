import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'

// Accent- and case-insensitive normalization for search matching.
const normalize = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

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
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })

  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const searchRef = useRef(null)

  // Normalize option list: string -> { value, label }.
  const normOptions = useMemo(
    () =>
      (options || []).map((opt) =>
        opt !== null && typeof opt === 'object'
          ? { value: opt.value, label: opt.label }
          : { value: opt, label: opt }
      ),
    [options]
  )

  const selected = useMemo(
    () => normOptions.find((opt) => String(opt.value) === String(value)),
    [normOptions, value]
  )

  // Decide whether the search box is shown.
  const showSearch =
    searchable === true ||
    (searchable === undefined && normOptions.length >= 8)

  // Filtered options based on the query.
  const filtered = useMemo(() => {
    if (!showSearch || !query) return normOptions
    const q = normalize(query)
    return normOptions.filter((opt) => normalize(opt.label).includes(q))
  }, [normOptions, query, showSearch])

  // Compute menu position from the trigger's bounding rect.
  const computePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }, [])

  const closeMenu = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const toggleMenu = useCallback(() => {
    if (disabled) return
    if (open) {
      closeMenu()
    } else {
      computePosition()
      setOpen(true)
    }
  }, [disabled, open, closeMenu, computePosition])

  // Auto-focus the search input when the menu opens.
  useEffect(() => {
    if (open && showSearch) {
      // Defer so the portaled input is mounted before focusing.
      const t = window.setTimeout(() => {
        if (searchRef.current) searchRef.current.focus()
      }, 0)
      return () => window.clearTimeout(t)
    }
  }, [open, showSearch])

  // Listeners to close the menu: outside click, Escape, resize, scroll.
  useEffect(() => {
    if (!open) return

    const onMouseDown = (e) => {
      const t = triggerRef.current
      const m = menuRef.current
      if (t && t.contains(e.target)) return
      if (m && m.contains(e.target)) return
      closeMenu()
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeMenu()
      }
    }

    const onResize = () => closeMenu()
    const onScroll = () => closeMenu()

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    // Capture phase so we catch scrolls on any scrollable ancestor.
    window.addEventListener('scroll', onScroll, true)

    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, closeMenu])

  const handleSelect = (opt) => {
    onChange(opt.value)
    closeMenu()
  }

  const triggerStyle = {
    width: '100%',
    height: '38px',
    padding: '0 12px',
    border: '1px solid #e2e2ea',
    borderRadius: '6px',
    background: '#fff',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#2c2b34',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }

  const chevronStyle = {
    color: '#9a99a8',
    fontSize: '12px',
    marginLeft: '8px',
    transition: 'transform .15s ease',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
  }

  const menuStyle = {
    position: 'absolute',
    top: pos.top,
    left: pos.left,
    width: pos.width,
    zIndex: 20000,
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 16px 40px rgba(30,30,45,.16)',
    border: '1px solid #e2e2ea',
    maxHeight: '260px',
    overflowY: 'auto',
    padding: '6px',
  }

  return (
    <div
      className={`form-group ${col} ${noMargin ? '' : 'mb-2'}`}
      style={style}
    >
      {label && (
        <label className="form-label mb-1" htmlFor={id}>
          {label} {required && <b style={{ color: '#ff5b5b' }}>*</b>}
        </label>
      )}

      <button
        type="button"
        id={id}
        ref={triggerRef}
        disabled={disabled}
        onClick={toggleMenu}
        style={triggerStyle}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selected ? '#2c2b34' : '#9a99a8',
          }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <i className="mdi mdi-chevron-down" style={chevronStyle} />
      </button>

      {open &&
        createPortal(
          <div ref={menuRef} style={menuStyle}>
            {showSearch && (
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  background: '#fff',
                  paddingBottom: '6px',
                  marginBottom: '2px',
                  zIndex: 1,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <i
                    className="mdi mdi-magnify"
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9a99a8',
                      fontSize: '12px',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    placeholder="Buscar…"
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      // Never submit the surrounding modal form.
                      e.stopPropagation()
                      if (e.key === 'Enter') e.preventDefault()
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        closeMenu()
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '34px',
                      padding: '0 10px 0 30px',
                      border: '1px solid #e2e2ea',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#2c2b34',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#9a99a8',
                  fontSize: '13px',
                  padding: '10px',
                }}
              >
                Sin resultados
              </div>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <button
                    key={`${String(opt.value)}-${i}`}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = '#f5f5f9'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = 'transparent'
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      border: 'none',
                      background: isSelected ? '#ff5b5b' : 'transparent',
                      color: isSelected ? '#fff' : '#2c2b34',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.label}
                    </span>
                    {isSelected && (
                      <i
                        className="mdi mdi-check"
                        style={{ fontSize: '14px', flexShrink: 0 }}
                      />
                    )}
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
