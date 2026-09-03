import React from 'react'

/**
 * Tarjeta de indicador con fondo solido de color. La comparten el dashboard comercial
 * y el de muestras para que la cabecera se vea igual en los dos.
 */
const KpiCard = ({
  label,
  value,
  hint = null,
  icon,
  background,
  col = 'col-sm-6 col-xl-3',
  href = null,
}) => {
  const card = (
    <div
      className='rounded d-flex align-items-center justify-content-between h-100'
      style={{ background, color: '#fff', padding: '16px 18px', gap: 12 }}
    >
      <span className='d-flex align-items-center' style={{ gap: 10, minWidth: 0 }}>
        <i className={icon} style={{ fontSize: 26, opacity: .92, flexShrink: 0 }}></i>
        <span style={{ minWidth: 0 }}>
          <span className='d-block' style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
          {hint && <span className='d-block' style={{ fontSize: 11.5, opacity: .85 }}>{hint}</span>}
        </span>
      </span>
      <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )

  return (
    <div className={`${col} mb-3`}>
      {href
        ? <a href={href} className='text-decoration-none d-block h-100'>{card}</a>
        : card}
    </div>
  )
}

/** Paleta de fondos, para que los colores no se repitan sueltos en cada pantalla. */
export const kpiBackground = {
  blue: 'linear-gradient(135deg, #1e63c8, #2f7fe0)',
  lightBlue: 'linear-gradient(135deg, #1275c4, #2b9ae8)',
  teal: 'linear-gradient(135deg, #0b7285, #14919b)',
  green: 'linear-gradient(135deg, #2f9e44, #45b85c)',
  orange: 'linear-gradient(135deg, #e8590c, #f2760c)',
  red: 'linear-gradient(135deg, #c92a2a, #e34747)',
  purple: 'linear-gradient(135deg, #5f3dc4, #7048e8)',
  slate: 'linear-gradient(135deg, #495057, #6c757d)',
}

export default KpiCard
