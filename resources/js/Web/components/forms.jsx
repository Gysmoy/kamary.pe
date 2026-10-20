import React, { useState } from 'react'
import xsrfToken from '../../Utils/xsrfToken'
import { Button, Icon, cx } from './ui'

// Envia un formulario publico (multipart) con el token CSRF de la sesion web
export const submitWebForm = async (endpoint, data) => {
  const body = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (typeof value === 'boolean') body.append(key, value ? '1' : '0')
    else body.append(key, value)
  })
  const res = await fetch(endpoint, {
    method: 'POST',
    body,
    credentials: 'same-origin',
    headers: { Accept: 'application/json', 'X-XSRF-TOKEN': xsrfToken() },
  })
  const json = await res.json().catch(() => ({}))
  // El backend responde 422 con data = { campo: [mensajes] }
  const errors = res.status === 422 && json?.data && typeof json.data === 'object' ? json.data : {}
  return { ok: res.ok && (json?.status ?? res.status) < 400, status: res.status, message: json?.message, data: json?.data, errors }
}

// Hook para manejar estado, envio, errores y exito de un formulario web
export const useWebForm = (endpoint, initial) => {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const set = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }
  const bind = (name) => ({ name, value: values[name] ?? '', onChange: (e) => set(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value), error: errors[name]?.[0] })

  const submit = async (e, extra = {}) => {
    e?.preventDefault?.()
    if (sending) return null
    setSending(true)
    setResult(null)
    try {
      const res = await submitWebForm(endpoint, { ...values, ...extra, website: '' })
      setErrors(res.errors)
      setResult(res)
      if (res.ok) setValues(initial)
      return res
    } catch {
      const res = { ok: false, message: 'No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo de nuevo.' }
      setResult(res)
      return res
    } finally {
      setSending(false)
    }
  }

  return { values, set, bind, errors, sending, result, submit, reset: () => { setValues(initial); setErrors({}); setResult(null) } }
}

const inputBase = 'w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-kf-ink placeholder:text-kf-muted/70 outline-none transition focus:border-kf-blue focus:ring-4 focus:ring-kf-blue/10'

export const Field = ({ label, required, error, hint, className, children }) => (
  <label className={cx('block', className)}>
    {label && <span className="mb-1.5 block text-sm font-medium text-kf-ink">{label}{required && <span className="text-kf-red"> *</span>}</span>}
    {children}
    {hint && !error && <span className="mt-1 block text-xs text-kf-muted">{hint}</span>}
    {error && <span className="mt-1 block text-xs text-kf-red">{error}</span>}
  </label>
)

export const Input = ({ label, required, error, hint, className, ...rest }) => (
  <Field label={label} required={required} error={error} hint={hint} className={className}>
    <input {...rest} required={required} className={cx(inputBase, error ? 'border-kf-red' : 'border-kf-line')} />
  </Field>
)

export const Textarea = ({ label, required, error, hint, className, rows = 4, ...rest }) => (
  <Field label={label} required={required} error={error} hint={hint} className={className}>
    <textarea {...rest} rows={rows} required={required} className={cx(inputBase, 'resize-y', error ? 'border-kf-red' : 'border-kf-line')} />
  </Field>
)

export const Select = ({ label, required, error, hint, className, options = [], ...rest }) => (
  <Field label={label} required={required} error={error} hint={hint} className={className}>
    <select {...rest} required={required} className={cx(inputBase, 'appearance-none', error ? 'border-kf-red' : 'border-kf-line')}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </Field>
)

// Archivo: el valor es un File, se maneja aparte del bind de texto
export const FileInput = ({ label, required, error, hint, accept = '.pdf,.jpg,.jpeg,.png,.webp', file, onFile, className }) => (
  <Field label={label} required={required} error={error} hint={hint ?? 'PDF o imagen, máx. 10 MB'} className={className}>
    <span className={cx('flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-kf-surface/60 px-4 py-4 text-sm text-kf-text transition hover:border-kf-blue', error ? 'border-kf-red' : 'border-kf-line')}>
      <Icon name="Upload" size={18} className="text-kf-blue" />
      <span className="truncate">{file ? file.name : 'Seleccionar archivo'}</span>
      <input type="file" accept={accept} className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </span>
  </Field>
)

export const Checkbox = ({ label, error, className, ...rest }) => (
  <label className={cx('flex items-start gap-3 text-sm text-kf-text', className)}>
    <input type="checkbox" {...rest} className="mt-0.5 h-4 w-4 rounded border-kf-line text-kf-red focus:ring-kf-red" />
    <span>{label}{error && <span className="mt-1 block text-xs text-kf-red">{error}</span>}</span>
  </label>
)

// Checkbox de politica de privacidad (obligatorio en todos los formularios)
export const PrivacyCheckbox = ({ checked, onChange, error }) => (
  <Checkbox
    checked={!!checked}
    onChange={(e) => onChange(e.target.checked)}
    error={error}
    label={<>Declaro que he leído y acepto la <a href="/politicas-de-privacidad" target="_blank" className="font-medium text-kf-blue underline-offset-2 hover:underline">política de privacidad</a>.</>}
  />
)

// Aviso de resultado del envio
export const FormNotice = ({ result, successText = 'Gracias, recibimos tu mensaje. Te contactaremos pronto.' }) => {
  if (!result) return null
  return (
    <div className={cx('flex items-start gap-3 rounded-xl px-4 py-3 text-sm', result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-kf-red')}>
      <Icon name={result.ok ? 'CheckCircle2' : 'AlertCircle'} size={18} />
      <span>{result.ok ? successText : (result.message || 'Revisa los campos marcados.')}</span>
    </div>
  )
}

export const SubmitButton = ({ sending, children = 'Enviar', className }) => (
  <Button type="submit" variant="primary" className={className} disabled={sending}>
    {sending ? 'Enviando…' : children}
  </Button>
)
