import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PortalDropdown } from './VdTable'

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_LONG = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MODE_OPTIONS = [
  { value: 'month', label: 'Por mes' },
  { value: 'year', label: 'Por año' },
  { value: 'custom', label: 'Personalizado' },
]

/** 'YYYY-MM' -> 'Setiembre 2026' */
const monthLabel = (value) => {
  const [year, month] = (value ?? '').split('-').map(Number)
  if (!year || !month || month < 1 || month > 12) return 'Elegir mes'
  return `${MONTHS_LONG[month - 1]} ${year}`
}

/**
 * Selector de mes propio: un panel con el año navegable y la grilla de 12 meses.
 * Vive en un portal para que no lo corte el contenedor de la tarjeta.
 */
const MonthPicker = ({ value, years = [], onChange, bordered = true }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const [cursorYear, setCursorYear] = useState(() => Number((value ?? '').split('-')[0]) || new Date().getFullYear())
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  const selectedYear = Number((value ?? '').split('-')[0])
  const selectedMonth = Number((value ?? '').split('-')[1])

  // Los años con datos acotan la navegacion; si no llegan, se deja libre.
  const minYear = years.length ? Math.min(...years) : null
  const maxYear = years.length ? Math.max(...years) : null

  const place = () => {
    const el = triggerRef.current
    if (!el) return false
    const rect = el.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    if (rect.bottom < 0 || rect.top > viewportHeight) return false
    setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(rect.width, 260) })
    return true
  }

  useEffect(() => {
    if (!open) return
    place()
    setCursorYear(Number((value ?? '').split('-')[0]) || new Date().getFullYear())

    const onDoc = (e) => {
      if (triggerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    let frame = null
    const sync = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(() => {
        frame = null
        if (!place()) setOpen(false)
      })
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', sync, true)
    window.addEventListener('resize', sync)
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', sync, true)
      window.removeEventListener('resize', sync)
    }
  }, [open])

  const pick = (monthIndex) => {
    onChange(`${cursorYear}-${String(monthIndex + 1).padStart(2, '0')}`)
    setOpen(false)
  }

  return (
    <>
      <div ref={triggerRef} className={`vdt-fdd ${bordered ? 'vdt-fdd-bordered' : ''}`.trim()} onClick={() => setOpen(current => !current)}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{monthLabel(value)}</span>
        <i className='mdi mdi-chevron-down' style={{ fontSize: 14, color: '#b6b6c2', lineHeight: 1 }}></i>
      </div>
      {open && pos && createPortal(
        <div
          ref={panelRef}
          className='vdt-fdd-menu'
          style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 20000, padding: 12 }}
        >
          <div className='d-flex align-items-center justify-content-between mb-2'>
            <button
              type='button'
              className='btn btn-sm btn-light'
              disabled={minYear !== null && cursorYear <= minYear}
              onClick={() => setCursorYear(year => year - 1)}
            >
              <i className='mdi mdi-chevron-left'></i>
            </button>
            <strong>{cursorYear}</strong>
            <button
              type='button'
              className='btn btn-sm btn-light'
              disabled={maxYear !== null && cursorYear >= maxYear}
              onClick={() => setCursorYear(year => year + 1)}
            >
              <i className='mdi mdi-chevron-right'></i>
            </button>
          </div>
          <div className='d-grid' style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {MONTHS_SHORT.map((label, index) => {
              const active = cursorYear === selectedYear && index + 1 === selectedMonth
              return (
                <button
                  key={label}
                  type='button'
                  className={`btn btn-sm ${active ? 'btn-primary' : 'btn-light'}`}
                  onClick={() => pick(index)}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

/**
 * Filtro de periodo de los dashboards: por mes, por año o rango personalizado.
 * `value` es { mode, month, year, start, end } y viaja tal cual al backend.
 */
/** Si el periodo ya quedo bien definido, se puede consultar sin esperar al boton. */
const isComplete = (value) => {
  if (value.mode === 'custom') return !!(value.start && value.end)
  if (value.mode === 'year') return !!value.year
  return !!value.month
}

const PeriodFilter = ({ value = {}, years = [], loading = false, onChange, onApply }) => {
  const yearOptions = useMemo(
    () => years.map(year => ({ value: `${year}`, label: `${year}` })),
    [years]
  )

  const set = (field, fieldValue) => {
    const next = { ...value, [field]: fieldValue }
    onChange(next)
    // Se recarga al elegir; el boton queda para volver a traer los datos a mano.
    if (isComplete(next)) onApply(next)
  }

  return (
    <div className='card mb-3'>
      <div className='card-body' style={{ padding: 14 }}>
        <div className='d-flex flex-wrap align-items-center' style={{ gap: 10 }}>
          <div style={{ flex: '0 1 190px', minWidth: 160 }}>
            <PortalDropdown
              options={MODE_OPTIONS}
              value={value.mode ?? 'month'}
              placeholder='Por mes'
              menuWidth={200}
              bordered
              clearable={false}
              onChange={mode => set('mode', mode || 'month')}
            />
          </div>

          {(value.mode ?? 'month') === 'month' && (
            <div style={{ flex: '0 1 220px', minWidth: 190 }}>
              <MonthPicker value={value.month} years={years} onChange={month => set('month', month)} />
            </div>
          )}

          {value.mode === 'year' && (
            <div style={{ flex: '0 1 170px', minWidth: 150 }}>
              <PortalDropdown
                options={yearOptions}
                value={`${value.year ?? ''}`}
                placeholder='Elegir año'
                menuWidth={180}
                bordered
                clearable={false}
                onChange={year => set('year', year || new Date().getFullYear())}
              />
            </div>
          )}

          {value.mode === 'custom' && (
            <>
              <input
                type='date'
                className='form-control'
                style={{ flex: '0 1 170px', minWidth: 150 }}
                value={value.start ?? ''}
                onChange={(e) => set('start', e.target.value)}
              />
              <span className='text-muted'>hasta</span>
              <input
                type='date'
                className='form-control'
                style={{ flex: '0 1 170px', minWidth: 150 }}
                value={value.end ?? ''}
                onChange={(e) => set('end', e.target.value)}
              />
            </>
          )}

          <button type='button' className='btn btn-primary' onClick={() => onApply(value)} disabled={loading}>
            {loading
              ? <><span className='spinner-border spinner-border-sm me-1'></span>Actualizando…</>
              : <><i className='ti ti-refresh me-1'></i>Refrescar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PeriodFilter
