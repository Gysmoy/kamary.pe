import { useState } from 'react'
import { useWebForm } from './forms'

// Validacion y envio de formularios de consulta (servicios y magistrales)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^\+?[\d\s()-]{7,}$/
const MAX_BYTES = 10 * 1024 * 1024
const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MSG = {
  name: 'Ingresa tu nombre.',
  last_name: 'Ingresa tu apellido.',
  phone: 'Ingresa un teléfono o celular de contacto.',
  email: 'Ingresa tu correo electrónico.',
}

/**
 * Hook del formulario: valida en el frontend antes de enviar y expone
 * bind(name) para los campos y privacy para el checkbox de privacidad.
 */
export const useInquiry = ({ type, initial, fields = ['name', 'phone', 'email'], requireFile = false }) => {
  const form = useWebForm('/api/web/inquiries', { ...initial, accepted_privacy: false })
  const [file, setFileState] = useState(null)
  const [clientErr, setClientErr] = useState({})

  const setFile = (f) => {
    setFileState(f)
    setClientErr(p => ({ ...p, file: null }))
  }

  // Error local tiene prioridad; al escribir se limpia el error local del campo
  const bind = (name) => {
    const b = form.bind(name)
    return {
      ...b,
      error: clientErr[name] || b.error,
      onChange: (e) => {
        if (clientErr[name]) setClientErr(p => ({ ...p, [name]: null }))
        b.onChange(e)
      },
    }
  }

  const privacy = {
    checked: !!form.values.accepted_privacy,
    onChange: (v) => {
      if (clientErr.accepted_privacy) setClientErr(p => ({ ...p, accepted_privacy: null }))
      form.set('accepted_privacy', v)
    },
    error: clientErr.accepted_privacy || form.errors.accepted_privacy?.[0],
  }

  const fileError = clientErr.file || form.errors.file?.[0]

  const validate = () => {
    const v = form.values
    const e = {}
    fields.forEach(f => { if (!`${v[f] ?? ''}`.trim()) e[f] = MSG[f] })
    if (!e.phone && !PHONE.test(`${v.phone}`.trim())) e.phone = 'Revisa el teléfono: usa solo números, espacios o +.'
    if (!e.email && !EMAIL.test(`${v.email}`.trim())) e.email = 'Revisa el correo (ej. nombre@correo.com).'
    if (!v.accepted_privacy) e.accepted_privacy = 'Debes aceptar la política de privacidad para continuar.'
    if (requireFile) {
      if (!file) e.file = 'Adjunta tu receta médica en PDF o imagen.'
      else if (file.size > MAX_BYTES) e.file = 'El archivo supera los 10 MB permitidos.'
      else if (!FILE_TYPES.includes(file.type)) e.file = 'Sube un archivo PDF, JPG, PNG o WEBP.'
    }
    return e
  }

  const submit = async (e) => {
    e?.preventDefault?.()
    const errs = validate()
    setClientErr(errs)
    if (Object.keys(errs).length) return null
    const res = await form.submit(e, { type, file })
    if (res?.ok) setFileState(null)
    return res
  }

  return { form, bind, privacy, file, setFile, fileError, submit, result: form.result, sending: form.sending }
}
