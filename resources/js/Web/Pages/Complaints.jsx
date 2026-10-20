import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout from '../components/Layout'
import { Button, Container, Eyebrow, GridPattern, Heading, Icon, cx, Serif } from '../components/ui'
import { Checkbox, FileInput, FormNotice, Input, Select, SubmitButton, Textarea, useWebForm } from '../components/forms'
import content from '../data/content'

const { complaints } = content
const ENDPOINT = '/api/web/complaints'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INITIAL = {
  person_type: 'natural',
  first_name: '',
  last_name: '',
  business_name: '',
  document_type: 'DNI',
  document_number: '',
  address: '',
  district: '',
  department: '',
  phone: '',
  email: '',
  claim_type: 'reclamo',
  good_type: 'producto',
  product_detail: '',
  claim_detail: '',
  file: null,
  declaration: false,
}

// Fecha de la hoja: siempre la del momento en que se abre
const TODAY = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })

// Validacion del frontend: devuelve { campo: mensaje } solo con lo obligatorio o mal formado
const validate = (v) => {
  const e = {}
  const req = (k) => { if (!`${v[k] ?? ''}`.trim()) e[k] = 'Este campo es obligatorio.' }

  if (v.person_type === 'natural') { req('first_name'); req('last_name') }
  else req('business_name')

  req('document_number')
  if (v.document_number && v.document_type === 'DNI' && !/^\d{8}$/.test(v.document_number)) e.document_number = 'El DNI debe tener 8 dígitos.'
  if (v.document_number && v.document_type === 'RUC' && !/^\d{11}$/.test(v.document_number)) e.document_number = 'El RUC debe tener 11 dígitos.'

  ;['address', 'district', 'department', 'phone', 'product_detail'].forEach(req)
  req('email')
  if (v.email && !EMAIL_RE.test(v.email)) e.email = 'Ingresa un correo válido.'
  if (!v.declaration) e.declaration = 'Debes aceptar la declaración jurada para continuar.'
  return e
}

// Grupo de opciones tipo radio, con descripcion opcional por opcion
const Choice = ({ name, value, onChange, options, legend, error, columns = 'sm:grid-cols-2' }) => (
  <fieldset>
    <legend className="mb-3 text-sm font-medium text-kf-ink">{legend}</legend>
    <div className={cx('grid gap-3', columns)}>
      {options.map(o => {
        const on = value === o.value
        return (
          <label key={o.value} className={cx('flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors',
            on ? 'border-kf-navy bg-kf-navy/[0.03] ring-1 ring-kf-navy' : 'border-kf-ink/15 bg-white hover:border-kf-navy/40', error && !on && 'border-kf-red/50')}>
            <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)}
              className="mt-1 h-4 w-4 border-kf-line text-kf-navy focus:ring-kf-navy" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-kf-ink">{o.label}</span>
              {o.hint && <span className="mt-1 block text-xs leading-relaxed text-kf-muted">{o.hint}</span>}
            </span>
          </label>
        )
      })}
    </div>
    {error && <p className="mt-2 text-xs text-kf-red">{error}</p>}
  </fieldset>
)

// Seccion numerada de la hoja (01 / 02 / 03) con hairline superior
const Block = ({ n, title, children }) => (
  <section className="border-t border-kf-ink/15 pt-10 first:border-t-0 first:pt-0">
    <div className="mb-7 flex items-baseline gap-4">
      <span className="font-mono text-xs text-kf-red">{n}</span>
      <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-kf-ink md:text-2xl">{title}</h2>
    </div>
    {children}
  </section>
)

const ComplaintForm = () => {
  const form = useWebForm(ENDPOINT, INITIAL)
  const [cErr, setCErr] = useState({})
  const { values, set, errors, sending, result, submit, reset } = form
  const err = (k) => cErr[k] || errors[k]?.[0]
  const natural = values.person_type === 'natural'
  const kind = values.claim_type === 'queja' ? 'queja' : 'reclamo'

  const onSubmit = (e) => {
    e.preventDefault()
    const v = validate(values)
    setCErr(v)
    if (Object.keys(v).length) return
    // Solo se envian los nombres de la persona elegida
    submit(e, natural ? { business_name: '' } : { first_name: '', last_name: '' })
  }

  // Quita el error de cliente al cambiar el campo
  const change = (k) => (v) => { set(k, v); if (cErr[k]) setCErr(p => ({ ...p, [k]: null })) }
  const bindText = (k) => ({ ...form.bind(k), onChange: (e) => change(k)(e.target.value) })

  // Exito: se muestra el codigo de la hoja registrada
  if (result?.ok) {
    const code = result.data?.code
    return (
      <div className="px-6 py-14 text-center md:px-12 md:py-20">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Icon name="check-circle2" size={28} />
        </span>
        <h2 className="mt-6 font-display text-2xl font-semibold tracking-[-0.03em] text-kf-ink md:text-3xl">Hemos registrado tu {kind}</h2>
        {code ? (
          <>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-kf-muted">Código de tu hoja</p>
            <div className="mx-auto mt-3 inline-block rounded-2xl border-2 border-kf-navy bg-kf-navy/[0.03] px-8 py-4">
              <p className="font-mono text-3xl font-semibold tracking-[0.08em] text-kf-navy md:text-4xl">{code}</p>
            </div>
            <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-kf-text">Guarda este código para cualquier consulta sobre tu registro.</p>
          </>
        ) : (
          <p className="mt-4 text-sm text-kf-text">{result.message || 'Tu registro fue enviado correctamente.'}</p>
        )}
        <div className="mt-10"><Button variant="ghost" onClick={reset}>Registrar otro reclamo o queja</Button></div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-12">
      <Block n="01" title="Identificación del consumidor">
        <div className="space-y-6">
          <Choice name="person_type" value={values.person_type} onChange={change('person_type')} error={err('person_type')}
            legend="Tipo de persona"
            options={[{ value: 'natural', label: 'Persona natural' }, { value: 'juridica', label: 'Persona jurídica' }]} />

          <div className="grid gap-5 md:grid-cols-2">
            {natural ? (
              <>
                <Input label="Nombres" required {...bindText('first_name')} error={err('first_name')} />
                <Input label="Apellidos" required {...bindText('last_name')} error={err('last_name')} />
              </>
            ) : (
              <Input label="Razón social" required className="md:col-span-2" {...bindText('business_name')} error={err('business_name')} />
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-[180px_1fr]">
            <Select label="Documento" options={[{ value: 'DNI', label: 'DNI' }, { value: 'RUC', label: 'RUC' }]} value={values.document_type} onChange={(e) => change('document_type')(e.target.value)} />
            <Input label={`N.º de ${values.document_type}`} required inputMode="numeric" {...bindText('document_number')} error={err('document_number')} />
          </div>

          <Input label="Dirección" required {...bindText('address')} error={err('address')} />

          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Distrito" required {...bindText('district')} error={err('district')} />
            <Input label="Departamento" required {...bindText('department')} error={err('department')} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Teléfono" required type="tel" {...bindText('phone')} error={err('phone')} />
            <Input label="Correo electrónico" required type="email" {...bindText('email')} error={err('email')} />
          </div>
        </div>
      </Block>

      <Block n="02" title="Detalle de la reclamación">
        <div className="space-y-6">
          <Choice name="claim_type" value={values.claim_type} onChange={change('claim_type')} error={err('claim_type')}
            legend="Tipo de registro"
            options={[
              { value: 'reclamo', label: 'Reclamo', hint: complaints.types[0].text },
              { value: 'queja', label: 'Queja', hint: complaints.types[1].text },
            ]} />

          <Choice name="good_type" value={values.good_type} onChange={change('good_type')} error={err('good_type')}
            legend="Bien contratado"
            options={[{ value: 'producto', label: 'Producto' }, { value: 'servicio', label: 'Servicio' }]} />

          <Textarea label={`Detalle del ${values.good_type === 'servicio' ? 'servicio' : 'producto'}`} required rows={4}
            hint="Describe el producto o servicio involucrado."
            {...bindText('product_detail')} error={err('product_detail')} />

          <Textarea label={`Detalle del ${kind}`} rows={5}
            hint="Describe los hechos, fechas y lo que solicitas."
            {...bindText('claim_detail')} error={err('claim_detail')} />

          <FileInput label="Adjuntar archivo (opcional)" hint={complaints.attachmentNote} file={values.file} onFile={(f) => change('file')(f)} error={err('file')} />
        </div>
      </Block>

      <Block n="03" title="Declaración y envío">
        <div className="space-y-6">
          <div className="rounded-2xl bg-kf-sand p-5 md:p-6">
            <Checkbox checked={!!values.declaration} onChange={(e) => change('declaration')(e.target.checked)}
              error={err('declaration')} label={complaints.declaration} />
          </div>

          {result && !result.ok && <FormNotice result={result} />}

          <div className="flex flex-col gap-4 border-t border-kf-ink/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-kf-muted">Los campos marcados con * son obligatorios.</p>
            <SubmitButton sending={sending} className="w-full sm:w-auto">Registrar {kind}</SubmitButton>
          </div>
        </div>
      </Block>
    </form>
  )
}

const Complaints = () => (
  <>
    {/* Encabezado oficial: titular sobrio + sello del libro sobre navy */}
    <section className="kf-noise relative isolate overflow-hidden bg-kf-navy-deep text-white">
      <GridPattern />
      <Container className="relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Eyebrow light n="LR">Atención al consumidor</Eyebrow>
          <Heading level={1} size="xl" light immediate lines={['Registro de', <><Serif className="text-white">reclamos</Serif> y quejas</>]} />
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">{complaints.legalNote}</p>
        </div>
        <div className="lg:col-span-5 lg:justify-self-end">
          <div className="flex w-full max-w-sm items-center justify-center rounded-[28px] border border-white/15 bg-white/[0.04] p-10 md:p-12">
            <img src="/web/services/Libro_reclamaciones.webp" alt="Libro de reclamaciones" loading="eager" className="w-full object-contain" />
          </div>
        </div>
      </Container>
    </section>

    {/* Hoja de reclamacion */}
    <section className="bg-kf-canvas py-14 md:py-20">
      <div className="mx-auto w-full max-w-4xl px-5 md:px-8">
        <div className="overflow-hidden rounded-[28px] border border-kf-ink/10 bg-white shadow-[0_30px_70px_-40px_rgba(27,34,96,0.35)]">
          <div className="flex flex-col gap-2 border-b border-kf-ink/10 bg-kf-sand/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-10">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-kf-navy">Hoja de reclamación</p>
              <p className="mt-1 text-sm text-kf-text">Farmacia Kamary Perú</p>
            </div>
            <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-kf-ink">
              <Icon name="calendar" size={15} className="text-kf-blue" />
              Fecha: {TODAY}
            </p>
          </div>

          <div className="px-6 py-10 md:px-10 md:py-12">
            <div className="mb-12 grid gap-px overflow-hidden rounded-2xl border border-kf-ink/10 bg-kf-ink/10 md:grid-cols-2">
              {complaints.types.map((t, k) => (
                <div key={t.label} className="bg-white p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-kf-red">0{k + 1} — {t.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-kf-text">{t.text}</p>
                </div>
              ))}
            </div>

            <ComplaintForm />
          </div>
        </div>
      </div>
    </section>
  </>
)

export default Complaints

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><Complaints {...properties} /></Layout>)
})
