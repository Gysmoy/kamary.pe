// Utilidades comunes de las bandejas web del admin (consultas y libro de reclamaciones).

// Telefono -> enlace de WhatsApp. Si son 9 digitos (celular peruano) antepone 51.
export const waLink = (phone) => {
  let digits = `${phone ?? ''}`.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 9) digits = `51${digits}`
  return `https://wa.me/${digits}`
}

export const telLink = (phone) => {
  const clean = `${phone ?? ''}`.replace(/[^\d+]/g, '')
  return clean ? `tel:${clean}` : null
}

// "2026-10-19T14:05:00.000000Z" -> "19/10/2026 09:05" (hora local)
export const fmtDateTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return `${value}`
  const p = (n) => `${n}`.padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export const fmtDate = (value) => fmtDateTime(value).slice(0, 10)

// Valor para <input type="date"> en hora local
export const toDateInput = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
