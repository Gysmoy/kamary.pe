import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, ArrowUpRight, MapPin, MessageCircle } from 'lucide-react'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout from '../components/Layout'
import { Button, Container, Eyebrow, Heading, Icon, ImageFrame, Reveal, Section, SectionHead, Serif } from '../components/ui'
import { FileInput, FormNotice, Input, PrivacyCheckbox, SubmitButton, Textarea, useWebForm } from '../components/forms'
import site from '../data/site'
import content from '../data/content'

const { contact } = content
const ENDPOINT = '/api/web/inquiries'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Telefono para enlaces tel: (solo digitos, con prefijo de Peru)
const telHref = (s) => `tel:+51${`${s}`.replace(/\D/g, '').replace(/^0?1/, '1')}`
const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent('Yen Escobedo Garro 830, Lima 15021')}&output=embed`
const waLink = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(site.whatsapp.message)}`

// Validacion minima antes de enviar; devuelve { campo: mensaje }
const validate = (v, required, withPrivacy = true) => {
  const e = {}
  required.forEach(k => { if (!`${v[k] ?? ''}`.trim()) e[k] = 'Este campo es obligatorio.' })
  if (v.email && !EMAIL_RE.test(v.email)) e.email = 'Ingresa un correo válido.'
  if (withPrivacy && !v.accepted_privacy) e.accepted_privacy = 'Debes aceptar la política de privacidad.'
  return e
}

// Canales como lista editorial: cada fila es un hairline con datos en mono
const CHANNELS = [
  {
    title: 'Sede central',
    lines: [site.address.line, site.address.city],
    links: [{ label: 'Ver en el mapa', href: site.address.mapsUrl, external: true }],
  },
  {
    title: 'Ventas',
    lines: [site.phones.central, site.phones.ventas],
    phones: [site.phones.central, site.phones.ventas],
    links: [{ label: site.emails.ventas, href: `mailto:${site.emails.ventas}` }],
  },
  {
    title: 'Ventas corporativas',
    lines: [site.phones.corporativas],
    phones: [site.phones.corporativas],
    links: [{ label: site.emails.corporativas, href: `mailto:${site.emails.corporativas}` }],
  },
  {
    title: 'Preparados magistrales',
    lines: [site.phones.magistrales],
    phones: [site.phones.magistrales],
    links: [{ label: site.emails.magistrales, href: `mailto:${site.emails.magistrales}` }],
  },
  {
    title: 'WhatsApp',
    lines: [site.whatsapp.display],
    phones: [site.whatsapp.display],
    links: [{ label: 'Escribir por WhatsApp', href: waLink, external: true }],
  },
  {
    title: 'Redes sociales',
    lines: [],
    links: site.socials.map(s => ({ label: s.name, href: s.url, external: true, icon: s.icon.toLowerCase() })),
  },
]

/* ---------- Hero editorial con la fotografia de la sede ---------- */
const Hero = () => (
  <section className="relative overflow-hidden bg-kf-canvas pb-20 pt-16 md:pb-28 md:pt-24">
    <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-6">
        <Eyebrow n="KF">{contact.title}</Eyebrow>
        <Heading level={1} size="xl" immediate lines={['Encuentra la asesoría', <>que <Serif>necesitas</Serif></>]} />
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-kf-text">{contact.intro}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button variant="whatsapp" href={waLink} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> Escribir por WhatsApp</Button>
          <Button variant="ghost" href="#formularios">Enviar consulta <ArrowRight size={16} /></Button>
        </div>
      </div>
      <Reveal delay={0.1} className="lg:col-span-6">
        <ImageFrame src={contact.location.image} alt="Fachada de la sede de Farmacia Kamary Perú en Yen Escobedo Garro 830" ratio="aspect-[4/5] lg:aspect-[5/4]"
          radius="rounded-[32px] rounded-tr-[120px]" position="object-[50%_60%]" eager />
        <p className="mt-4 flex flex-wrap justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-kf-muted">
          <span>Sede central</span><span>Yen Escobedo Garro 830 · Lima</span>
        </p>
      </Reveal>
    </Container>
  </section>
)

/* ---------- Canales de atencion: lista editorial ---------- */
const Channels = () => (
  <Section tone="canvas" className="!pt-0">
    <SectionHead n="01" eyebrow="Canales de atención" lines={['Escríbenos o llámanos', <>por el canal que <Serif>prefieras</Serif></>]} title={null} />
    <Reveal>
      <ul>
        {CHANNELS.map((c, k) => (
          <li key={c.title} className="grid gap-4 border-t border-kf-ink/15 py-7 md:grid-cols-12 md:gap-8 md:py-9">
            <div className="flex items-baseline gap-4 md:col-span-4">
              <span className="font-mono text-xs text-kf-red">0{k + 1}</span>
              <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-kf-ink md:text-2xl">{c.title}</h3>
            </div>
            <div className="space-y-1.5 md:col-span-5">
              {c.lines.map(l => (
                c.phones?.includes(l)
                  ? <a key={l} href={telHref(l)} className="block font-mono text-[15px] text-kf-ink transition-colors hover:text-kf-red">{l}</a>
                  : <p key={l} className="text-[15px] leading-relaxed text-kf-text">{l}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm md:col-span-3 md:flex-col md:items-end md:text-right">
              {c.links.map(l => (
                <a key={l.label} href={l.href} target={l.external ? '_blank' : undefined} rel={l.external ? 'noopener noreferrer' : undefined}
                  className="group inline-flex items-center gap-1.5 font-mono text-[13px] text-kf-blue underline-offset-4 hover:underline md:text-[14px]">
                  {l.icon && <Icon name={l.icon} size={15} />}
                  {l.label}
                  {l.external && <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
                </a>
              ))}
            </div>
          </li>
        ))}
        <li className="border-t border-kf-ink/15" />
      </ul>
    </Reveal>
  </Section>
)

/* ---------- Ubicacion: texto + mapa en marco redondeado ---------- */
const MapBlock = () => (
  <Section tone="surface" className="!py-20 md:!py-24">
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <Reveal className="flex flex-col justify-between gap-10 lg:col-span-4">
        <div>
          <Eyebrow n="02">{contact.location?.title ?? 'Ubicación'}</Eyebrow>
          <Heading size="lg">Visítanos en <Serif>Lima</Serif></Heading>
          <p className="mt-6 flex items-start gap-3 text-lg leading-relaxed text-kf-text">
            <MapPin size={20} className="mt-1 shrink-0 text-kf-red" />{contact.location.address}
          </p>
        </div>
        <div className="border-t border-kf-ink/15 pt-6">
          <Button variant="secondary" href={contact.location.mapsUrl} target="_blank" rel="noopener noreferrer">Abrir en Google Maps <ArrowUpRight size={16} /></Button>
        </div>
      </Reveal>
      <Reveal delay={0.08} className="lg:col-span-8">
        <div className="overflow-hidden rounded-[32px] border border-kf-ink/10 bg-white shadow-[0_24px_60px_-30px_rgba(27,34,96,0.25)]">
          <iframe title="Mapa de ubicación de Farmacia Kamary Perú" src={mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            className="block h-80 w-full md:h-[480px]" style={{ border: 0 }} allowFullScreen />
        </div>
      </Reveal>
    </div>
  </Section>
)

/* ---------- Formularios: contacto y trabaja con nosotros (misma logica) ---------- */
const FormShell = ({ children, className }) => (
  <div className={`h-full rounded-[28px] border border-kf-ink/10 bg-white p-7 shadow-[0_20px_50px_-30px_rgba(27,34,96,0.2)] md:p-10 ${className ?? ''}`}>{children}</div>
)

const ContactForm = () => {
  const form = useWebForm(ENDPOINT, { type: 'contacto', name: '', phone: '', email: '', message: '', accepted_privacy: false })
  const [cErr, setCErr] = useState({})
  const { values, set, errors, sending, result, submit, reset } = form
  const err = (k) => cErr[k] || errors[k]?.[0]

  const onSubmit = (e) => {
    e.preventDefault()
    const v = validate(values, ['name', 'phone', 'email'])
    setCErr(v)
    if (Object.keys(v).length) return
    submit(e)
  }

  if (result?.ok) {
    return (
      <FormShell className="flex flex-col items-start gap-6">
        <Eyebrow>{contact.form.title}</Eyebrow>
        <FormNotice result={result} />
        <Button variant="ghost" size="sm" onClick={reset}>Enviar otra consulta</Button>
      </FormShell>
    )
  }

  return (
    <FormShell>
      <Eyebrow>Consulta general</Eyebrow>
      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-kf-ink">{contact.form.title}</h2>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Nombre" required {...form.bind('name')} error={err('name')} />
          <Input label="Teléfono" required type="tel" {...form.bind('phone')} error={err('phone')} />
        </div>
        <Input label="Correo electrónico" required type="email" {...form.bind('email')} error={err('email')} />
        <Textarea label="Consultas o comentario" rows={4} {...form.bind('message')} error={err('message')} />
        <PrivacyCheckbox checked={values.accepted_privacy} onChange={(v) => { set('accepted_privacy', v); setCErr(p => ({ ...p, accepted_privacy: null })) }} error={err('accepted_privacy')} />
        {result && !result.ok && <FormNotice result={result} />}
        <SubmitButton sending={sending}>Enviar consulta</SubmitButton>
      </form>
    </FormShell>
  )
}

const JobForm = () => {
  const form = useWebForm(ENDPOINT, { type: 'trabaja', name: '', phone: '', email: '', file: null, accepted_privacy: false })
  const [cErr, setCErr] = useState({})
  const { values, set, errors, sending, result, submit, reset } = form
  const err = (k) => cErr[k] || errors[k]?.[0]

  const onSubmit = (e) => {
    e.preventDefault()
    const v = validate(values, ['name', 'phone', 'email'])
    setCErr(v)
    if (Object.keys(v).length) return
    submit(e)
  }

  if (result?.ok) {
    return (
      <FormShell className="flex flex-col items-start gap-6">
        <Eyebrow>Empleo</Eyebrow>
        <FormNotice result={result} successText="Gracias por tu interés. Recibimos tu postulación." />
        <Button variant="ghost" size="sm" onClick={reset}>Enviar otra postulación</Button>
      </FormShell>
    )
  }

  return (
    <FormShell>
      <Eyebrow>Empleo</Eyebrow>
      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-kf-ink">{contact.jobs.title}</h2>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Input label="Nombre" required {...form.bind('name')} error={err('name')} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Teléfono" required type="tel" {...form.bind('phone')} error={err('phone')} />
          <Input label="Correo electrónico" required type="email" {...form.bind('email')} error={err('email')} />
        </div>
        <FileInput label="Adjunta tu CV (opcional)" file={values.file} onFile={(f) => set('file', f)} error={err('file')} />
        <PrivacyCheckbox checked={values.accepted_privacy} onChange={(v) => { set('accepted_privacy', v); setCErr(p => ({ ...p, accepted_privacy: null })) }} error={err('accepted_privacy')} />
        {result && !result.ok && <FormNotice result={result} />}
        <SubmitButton sending={sending}>Enviar postulación</SubmitButton>
      </form>
    </FormShell>
  )
}

const Forms = () => (
  <Section tone="canvas" id="formularios">
    <SectionHead n="03" eyebrow="Formularios" lines={['Cuéntanos qué', <>necesitas, <Serif>te respondemos</Serif></>]} title={null} />
    <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
      <Reveal className="h-full">
        <ContactForm />
      </Reveal>
      <Reveal delay={0.08} className="h-full">
        <JobForm />
      </Reveal>
    </div>
  </Section>
)

const Contact = () => (
  <>
    <Hero />
    <Channels />
    <MapBlock />
    <Forms />
  </>
)

export default Contact

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><Contact {...properties} /></Layout>)
})
