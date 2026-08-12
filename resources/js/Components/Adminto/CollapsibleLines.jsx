import React, { useState } from 'react'

// Celda de detalle que no estira la fila. Una nota con 20 lineas hacia que su fila ocupara toda
// la pantalla y el listado dejara de leerse, asi que se muestran solo las primeras y el resto
// queda detras de un "Ver mas".
const CollapsibleLines = ({ lines = [], visible = 2, emptyText = 'Sin detalle', renderLine = null }) => {
  const [open, setOpen] = useState(false)

  if (lines.length === 0) return <small className='text-muted'>{emptyText}</small>

  const hidden = lines.length - visible
  const shown = open ? lines : lines.slice(0, visible)

  return (
    <div>
      {shown.map((line, idx) => (
        <div key={`linea-${idx}`}>{renderLine ? renderLine(line, idx) : <small>{line}</small>}</div>
      ))}
      {hidden > 0 && (
        <button
          type='button'
          className='btn btn-link btn-sm p-0 mt-1'
          style={{ fontSize: '11.5px', textDecoration: 'none' }}
          // La fila puede tener su propio click (abrir el registro): esto solo despliega.
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        >
          <i className={`mdi ${open ? 'mdi-chevron-up' : 'mdi-chevron-down'} me-1`}></i>
          {open ? 'Ver menos' : `Ver ${hidden} mas`}
        </button>
      )}
    </div>
  )
}

export default CollapsibleLines
