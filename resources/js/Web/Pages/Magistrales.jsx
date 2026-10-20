import { createRoot } from 'react-dom/client'
import { ArrowRight, ArrowUpRight, FlaskConical, MessageCircle, ShieldCheck, Upload } from 'lucide-react'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout from '../components/Layout'
import { Button, Container, EditorialSplit, Eyebrow, FullBleedHero, Heading, ImageFrame, Reveal, Section, SectionHead, Serif, Stagger, StaggerItem } from '../components/ui'
import { FileInput, FormNotice, Input, PrivacyCheckbox, SubmitButton, Textarea } from '../components/forms'
import { useInquiry } from '../components/inquiry'
import site from '../data/site'
import content from '../data/content'

const M = content.magistrales

// Foto de banco del laboratorio primero; luego las fotos reales de la zona de producción de Kamary
const HERO_IMAGES = [
  { src: '/web/extra/banners/band-magistrales.webp', alt: 'Químico farmacéutico pesando una fórmula magistral', caption: 'Formulación magistral', position: 'object-[45%_30%]' },
  { src: '/web/services/Preparados-Magistrales.jpg', alt: 'Laboratorio de preparados magistrales de Kamary Perú', caption: 'Zona de producción', position: 'object-[30%_45%]' },
  { src: '/web/extra/banners/magistrales.webp', alt: 'Química farmacéutica en el laboratorio', caption: 'Control de calidad', position: 'object-[65%_40%]' },
  { src: '/web/services/Bg-preparados.webp', alt: 'Elaboración de preparados en laboratorio', caption: 'Elaboración', position: 'object-[60%_50%]' },
]

const AREAS = [
  { label: 'Pediatría', tone: 'navy' },
  { label: 'Dermatología', tone: 'sand' },
  { label: 'Geriatría', tone: 'photo' },
]

const STEPS = [
  { title: 'Envías tu receta', text: 'Adjunta tu receta médica en esta página o escríbenos por WhatsApp.' },
  { title: 'Evaluamos', text: 'Nuestro equipo de químicos farmacéuticos revisa la receta y los datos indicados.' },
  { title: 'Elaboramos', text: 'Preparamos tu fórmula en nuestro laboratorio, con insumos certificados y control de calidad.' },
  { title: 'Entregamos', text: 'Coordinamos la entrega de tu preparado con nuestro servicio de logística.' },
]

const waHref = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent('Hola Kamary Perú, quisiera enviar una receta para un preparado magistral.')}`

/* ---------- Hero fotográfico a sangre ---------- */
const Hero = () => (
  <FullBleedHero images={HERO_IMAGES} className="min-h-[640px] lg:min-h-[820px]">
    <Container className="flex min-h-[640px] flex-col justify-center pb-24 pt-40 md:pt-48 lg:min-h-[820px]">
      <div className="max-w-3xl">
        <Eyebrow light n="KF">{M.eyebrow}</Eyebrow>
        <Heading level={1} size="display" light immediate
          lines={['Preparados magistrales', <>de <Serif className="text-white">recetas médicas</Serif></>]} />
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/80">{M.intro}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button href="#receta">Envíenos su receta <ArrowRight size={18} /></Button>
          <Button variant="whatsapp" href={waHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> WhatsApp</Button>
        </div>
      </div>
      {/* Datos técnicos flotantes */}
      <div className="absolute right-8 top-[34%] hidden flex-col gap-3 xl:flex">
        <div className="flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-5 py-3 backdrop-blur-md">
          <FlaskConical size={16} />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Dosis exactas · Laboratorio</span>
        </div>
        <div className="flex items-center gap-3 self-end rounded-full border border-white/25 bg-white/10 px-5 py-3 backdrop-blur-md">
          <ShieldCheck size={16} />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Insumos certificados</span>
        </div>
      </div>
    </Container>
  </FullBleedHero>
)

/* ---------- 01 Pilares ---------- */
const Pillars = () => (
  <Section>
    <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-20">
      <Reveal className="lg:col-span-5">
        <Eyebrow n="01">Nuestro laboratorio</Eyebrow>
        <Heading>Calidad en cada <Serif>preparado</Serif></Heading>
        <p className="mt-6 text-lg leading-relaxed">{M.paragraphs[0]}</p>
        <ImageFrame src="/web/slider/Imag-home-4.webp" alt="Zona de producción de preparados magistrales" ratio="aspect-[4/3]" radius="rounded-[32px] rounded-tr-[100px]" position="object-[40%_40%]" className="mt-10" />
      </Reveal>
      <Stagger className="lg:col-span-7">
        {M.blocks.map((b, k) => (
          <StaggerItem key={b.title}>
            <div className="grid gap-3 border-t border-kf-ink/15 py-9 md:grid-cols-[4.5rem_1fr] md:gap-6">
              <span className="font-display text-5xl font-semibold leading-none tracking-[-0.045em] text-kf-red/90 md:text-6xl">0{k + 1}</span>
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-[-0.03em] text-kf-ink md:text-3xl">{b.title}</h3>
                <p className="mt-3 max-w-xl leading-relaxed">{b.text}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
        <div className="border-t border-kf-ink/15" />
      </Stagger>
    </div>
  </Section>
)

/* ---------- 02 Áreas de atención (bento tipográfico) ---------- */
const Areas = () => (
  <Section tone="surface">
    <SectionHead n="02" eyebrow="Áreas de atención" lines={['Dosis precisas para', <><Serif>cada etapa</Serif></>]} title={null} />
    <div className="grid grid-cols-12 gap-4 md:gap-5">
      {AREAS.map((a, k) => {
        const span = ['col-span-12 md:col-span-7', 'col-span-12 md:col-span-5', 'col-span-12'][k]
        const dark = a.tone !== 'sand'
        return (
          <Reveal key={a.label} delay={k * 0.08} className={span}>
            <div className={`group relative isolate flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-[28px] p-8 md:min-h-[340px] md:p-10 ${dark ? 'bg-kf-navy-deep text-white' : 'bg-kf-canvas text-kf-ink'}`}>
              {a.tone === 'navy' && <img src="/web/extra/nosotros/bg-magistrales.webp" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70 transition-transform duration-[1400ms] group-hover:scale-[1.04]" />}
              {a.tone === 'photo' && <img src="/web/services/Preparados-Magistrales.jpg" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_40%] opacity-35 transition-transform duration-[1400ms] group-hover:scale-[1.04]" />}
              {dark && <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-kf-navy-deep/90 via-kf-navy-deep/40 to-kf-navy-deep/20" />}
              <p className={`font-mono text-[11px] uppercase tracking-[0.16em] ${dark ? 'text-white/70' : 'text-kf-muted'}`}><span className={dark ? 'text-white' : 'text-kf-red'}>0{k + 1}</span> — Área {k + 1}</p>
              <h3 className="font-serif text-6xl italic leading-none tracking-[-0.01em] md:text-8xl">{a.label}</h3>
            </div>
          </Reveal>
        )
      })}
    </div>
  </Section>
)

/* ---------- 03 Proceso ---------- */
const Process = () => (
  <Section>
    <SectionHead n="03" eyebrow="Proceso" lines={['Cómo', <><Serif>funciona</Serif></>]} title={null} />
    <ol className="relative grid gap-0 md:grid-cols-4 md:gap-8">
      <span aria-hidden="true" className="absolute left-0 right-0 top-[7px] hidden h-px bg-kf-ink/20 md:block" />
      {STEPS.map((s, k) => (
        <li key={s.title}>
          <Reveal delay={k * 0.08} className="relative border-t border-kf-ink/15 py-8 md:border-t-0 md:pt-0">
            <span className="relative z-10 hidden h-[15px] w-[15px] rounded-full border-2 border-kf-red bg-kf-canvas md:block" />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-kf-muted md:mt-8"><span className="text-kf-red">0{k + 1}</span> — Paso {k + 1}</p>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-kf-ink">{s.title}</h3>
            <p className="mt-3 leading-relaxed">{s.text}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  </Section>
)

/* ---------- Formulario de receta ---------- */
const RecetaForm = () => {
  const { bind, privacy, file, setFile, fileError, submit, result, sending } = useInquiry({
    type: 'magistrales',
    fields: ['name', 'last_name', 'phone', 'email'],
    requireFile: true,
    initial: { name: '', last_name: '', phone: '', email: '', message: '' },
  })
  return (
    <Section tone="surface" id="receta" className="scroll-mt-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <Reveal>
          <Eyebrow n="04">Solicitud</Eyebrow>
          <Heading>Envíenos su <Serif>receta</Serif></Heading>
          <p className="mt-6 text-lg leading-relaxed">{M.form.intro}</p>
          <p className="mt-3 text-sm text-kf-muted">Los campos marcados con * son obligatorios.</p>
          <ImageFrame src="/web/extra/banners/magistrales.webp" alt="Preparación de fórmulas magistrales" ratio="aspect-[4/3]" radius="rounded-[28px] rounded-tr-[90px]" position="object-[68%_35%]" className="mt-10 hidden lg:block" />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-[32px] bg-kf-canvas p-6 shadow-[0_30px_60px_-40px_rgba(15,19,31,0.3)] md:p-10">
            <form noValidate onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
              <Input label="Nombre" required placeholder="Tu nombre" autoComplete="given-name" {...bind('name')} />
              <Input label="Apellido" required placeholder="Tu apellido" autoComplete="family-name" {...bind('last_name')} />
              <Input label="Correo electrónico" required type="email" placeholder="correo@correo.com" autoComplete="email" className="sm:col-span-2" {...bind('email')} />
              <Input label="Teléfono o celular" required type="tel" placeholder="999 999 999" autoComplete="tel" className="sm:col-span-2" {...bind('phone')} />
              <FileInput label={M.form.fileLabel} required file={file} onFile={setFile} error={fileError} className="sm:col-span-2" />
              <div className="rounded-2xl border-l-4 border-kf-red bg-kf-sand p-4 text-sm leading-relaxed text-kf-ink sm:col-span-2">
                <p>{M.form.note}</p>
              </div>
              <Textarea label="Mensaje" hint="Opcional" rows={4} placeholder="Indícanos alergias, hipertensión o problemas coronarios, si aplica" className="sm:col-span-2" {...bind('message')} />
              <div className="sm:col-span-2">
                <PrivacyCheckbox checked={privacy.checked} onChange={privacy.onChange} error={privacy.error} />
              </div>
              <div className="space-y-4 sm:col-span-2">
                <FormNotice result={result} successText="Gracias, recibimos tu receta. Nuestro equipo te contactará pronto." />
                <SubmitButton sending={sending} className="w-full sm:w-auto"><Upload size={18} /> Enviar receta</SubmitButton>
              </div>
            </form>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

/* ---------- Canales de atención ---------- */
const Channels = () => {
  const rows = [
    { label: 'Teléfono', value: M.channels.phone, href: `tel:+51${M.channels.phone.replace(/\D/g, '')}` },
    { label: 'Correo', value: M.channels.email, href: `mailto:${M.channels.email}` },
    { label: 'WhatsApp', value: site.whatsapp.display, href: waHref, external: true },
  ]
  return (
    <section className="kf-noise relative isolate overflow-hidden bg-kf-navy-deep py-24 text-white md:py-32">
      <img src="/web/extra/banners/band-magistrales.webp" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover object-[60%_30%] opacity-50" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-kf-navy-deep via-kf-navy-deep/80 to-kf-navy-deep/40" />
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <Reveal>
          <Eyebrow light n="05">{M.channels.title}</Eyebrow>
          <Heading light size="lg">{M.cta.title}</Heading>
          <p className="mt-6 text-lg leading-relaxed text-white/80">{M.cta.text}</p>
        </Reveal>
        <Stagger className="self-end">
          {rows.map(c => (
            <StaggerItem key={c.label}>
              <a href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
                className="group flex items-center justify-between gap-4 border-t border-white/25 py-6">
                <span>
                  <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">{c.label}</span>
                  <span className="mt-2 block break-all font-display text-xl font-semibold tracking-[-0.02em] md:text-3xl">{c.value}</span>
                </span>
                <ArrowUpRight size={22} className="shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </a>
            </StaggerItem>
          ))}
          <div className="border-t border-white/25" />
        </Stagger>
      </Container>
    </section>
  )
}

const Magistrales = () => (
  <>
    <Hero />
    <Pillars />
    <Areas />
    <Process />
    <RecetaForm />
    <Channels />
  </>
)

export default Magistrales

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><Magistrales {...properties} /></Layout>)
})
