import { createRoot } from 'react-dom/client'
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout from '../components/Layout'
import { Button, Container, Eyebrow, FullBleedHero, Heading, ImageFrame, Reveal, Section, Serif, SpecSheet, Stagger, StaggerItem } from '../components/ui'
import { FormNotice, Input, PrivacyCheckbox, SubmitButton, Textarea } from '../components/forms'
import { useInquiry } from '../components/inquiry'
import site from '../data/site'
import content from '../data/content'

// Datos de presentacion por servicio (la clave coincide con content.services)
// hero: fotos del hero; photo: foto del bloque de detalle; spec: ficha tecnica (datos reales del contenido)
const META = {
  'ventas-corporativas': {
    accent: 'Corporativa', type: 'corporativas',
    hero: [{ src: '/web/services/Ventas-corporativas.webp', alt: 'Equipo de ventas corporativas de Kamary', position: 'object-right' }],
    photo: { src: '/web/services/Farmacia.webp', alt: 'Químico farmacéutico de Kamary', position: 'object-[70%_30%]' },
    specTitle: 'Ficha del servicio',
    spec: [
      { k: 'Atiende a', v: 'Clínicas y empresas', note: 'Consultorios, instituciones y organizaciones' },
      { k: 'Abastecimiento', v: 'Programado' },
      { k: 'Entregas', v: 'Puntuales' },
    ],
  },
  'operador-logistico': {
    accent: 'sin esfuerzo', type: 'logistico',
    hero: [{ src: '/web/services/Operador-logistico.webp', alt: 'Operador logístico de Kamary', position: 'object-right' }],
    photo: { src: '/web/services/Bg-operador-logistico-1.png', alt: 'Entrega, monitoreo y transporte refrigerado', position: 'object-center', wide: true },
    specTitle: 'Ficha del servicio',
    spec: [
      { k: 'Modalidades', v: 'B2C y B2B' },
      { k: 'Cadena de frío', v: '2°C – 8°C', note: 'Cuando corresponde' },
      { k: 'Control', v: 'Trazabilidad', note: 'Procesos auditables y rutas optimizadas' },
    ],
  },
  'distribucion-y-transporte': {
    accent: 'Transporte', type: 'distribucion',
    hero: [
      { src: '/web/services/Operador-logistico.webp', alt: 'Equipo de distribución y transporte', position: 'object-right' },
      { src: '/web/services/Bg-operador-logistico-1.png', alt: 'Transporte refrigerado de medicamentos', position: 'object-right' },
    ],
    photo: { src: '/web/services/Bg-operador-logistico-1.png', alt: 'Transporte refrigerado de medicamentos', position: 'object-center', wide: true },
    specTitle: 'Ficha técnica',
    spec: [
      { k: 'Servicio desde', v: '07/08/2020' },
      { k: 'Flota', v: 'Acondicionada', note: 'Conserva calidad y eficacia' },
      { k: 'Certificaciones', v: 'BPDyT · BPA' },
    ],
  },
  'importacion-de-medicamentos': {
    accent: 'Importación', type: 'importacion',
    hero: [
      { src: '/web/services/Bg-operador-logistico-1.png', alt: 'Logística e importación de medicamentos', position: 'object-right' },
      { src: '/web/slider/slider-Farmacia.webp', alt: 'Laboratorio y farmacia', position: 'object-center' },
    ],
    photo: { src: '/web/slider/Imag-home-4.webp', alt: 'Zona de laboratorio de Kamary', position: 'object-[40%_40%]' },
    specTitle: 'Ficha técnica',
    spec: [
      { k: 'Productos', v: 'Medicamentos', note: 'Dispositivos médicos y productos sanitarios' },
      { k: 'Trámites', v: 'Desaduanaje' },
      { k: 'Certificaciones', v: 'BPDyT · BPA' },
    ],
  },
  almacen: {
    accent: 'Medicamentos', type: 'almacen',
    hero: [
      { src: '/web/slider/slider-Farmacia.webp', alt: 'Laboratorio y farmacia de Kamary', position: 'object-[70%_50%]' },
      { src: '/web/slider/Imag-Home-3.webp', alt: 'Equipo de Kamary Perú', position: 'object-[50%_45%]' },
    ],
    photo: { src: '/web/slider/Imag-Home-3.webp', alt: 'Equipo de almacén de Kamary', position: 'object-[50%_45%]' },
    specTitle: 'Ficha técnica',
    spec: [
      { k: 'Almacenes', v: '3', note: 'Áreas autorizadas por DIGEMID' },
      { k: 'Certificación', v: 'BPA', note: 'Buenas Prácticas de Almacenamiento' },
    ],
  },
  'asesoria-tecnica-y-comercial': {
    accent: 'Comercial', type: 'asesoria',
    hero: [
      { src: '/web/services/Farmacia.webp', alt: 'Asesoría técnica de Kamary', position: 'object-right' },
      { src: '/web/services/Img-Nosotros-Kamary.webp', alt: 'Equipo de Kamary Perú', position: 'object-[50%_30%]' },
    ],
    photo: { src: '/web/services/Img-Nosotros-Kamary-1.jpg', alt: 'Asesor de Kamary Perú', position: 'object-[50%_40%]' },
    specTitle: 'Ficha técnica',
    spec: [
      { k: 'Registros', v: 'Sanitarios', note: 'Medicamentos, cosméticos y dispositivos médicos' },
      { k: 'Inspecciones', v: 'DIGEMID · DIRIS' },
      { k: 'Certificaciones', v: 'BPDyT · BPA' },
    ],
  },
}

const telHref = (s) => `tel:+51${s.replace(/\D/g, '').replace(/^0/, '')}`

// Resalta una palabra del titulo con el acento serif
const withAccent = (text, accent) => {
  const i = accent ? text.indexOf(accent) : -1
  if (i < 0) return text
  return <>{text.slice(0, i)}<Serif className="text-white">{accent}</Serif>{text.slice(i + accent.length)}</>
}

const NotFoundBlock = () => (
  <Container className="py-28 text-center md:py-40">
    <Eyebrow>Error 404</Eyebrow>
    <Heading level={1} size="xl">Esta página no <Serif>existe</Serif></Heading>
    <p className="mx-auto mt-5 max-w-md text-lg">El enlace puede haber cambiado o el servicio ya no está disponible.</p>
    <div className="mt-8 flex justify-center gap-3">
      <Button href="/">Ir al inicio</Button>
      <Button href="/contacto" variant="ghost">Contáctanos</Button>
    </div>
  </Container>
)

const ServiceDetail = ({ serviceKey }) => {
  const s = content.services[serviceKey]
  const meta = META[serviceKey]
  const { bind, privacy, submit, result, sending } = useInquiry({
    type: meta.type,
    initial: { name: '', phone: '', email: '', subject: '', message: '' },
  })
  const waHref = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(`Hola Kamary Perú, quisiera información sobre ${s.title}.`)}`
  const phones = s.contact.phone.split('/').map(p => p.trim())
  const hasDetail = s.paragraphs.length > 0 || s.bullets.length > 0
  let n = 0
  const num = () => String(++n).padStart(2, '0')

  return (
    <>
      {/* Hero fotográfico a sangre */}
      <FullBleedHero images={meta.hero} className="min-h-[600px] lg:min-h-[760px]">
        <Container className="flex min-h-[600px] flex-col justify-center pb-24 pt-40 md:pt-48 lg:min-h-[760px]">
          <div className="max-w-3xl">
            <Eyebrow light n="KF">{s.eyebrow}</Eyebrow>
            {s.slogan && (
              <span className="mb-6 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white backdrop-blur-md">{s.slogan}</span>
            )}
            <Heading level={1} size="xl" light className="md:!text-6xl lg:!text-[72px]">{withAccent(s.title, meta.accent)}</Heading>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/80">{s.intro}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="#formulario">Escríbenos <ArrowRight size={18} /></Button>
              <Button variant="whatsapp" href={waHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> WhatsApp</Button>
            </div>
          </div>
          <div className="absolute right-8 top-[36%] hidden flex-col gap-3 xl:flex">
            {site.certifications.map((c, k) => (
              <div key={c} className={`flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-5 py-3 backdrop-blur-md ${k % 2 ? 'self-end' : ''}`}>
                <ShieldCheck size={16} />
                <span className="font-mono text-[11px] uppercase tracking-[0.14em]">{c}</span>
              </div>
            ))}
          </div>
        </Container>
      </FullBleedHero>

      {/* Detalle: foto + párrafos y bullets editoriales */}
      {(hasDetail || meta.spec.length > 0) && (
        <Section tone="surface">
          <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <Eyebrow n={num()}>Detalle del servicio</Eyebrow>
              <Heading size="lg">Así <Serif>trabajamos</Serif></Heading>
              {s.paragraphs.map(p => <p key={p} className="mt-6 text-lg leading-relaxed">{p}</p>)}
              {!meta.photo.wide && (
                <ImageFrame src={meta.photo.src} alt={meta.photo.alt} ratio="aspect-[4/3]" radius="rounded-[32px] rounded-tr-[100px]" position={meta.photo.position} className="mt-10" />
              )}
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              {s.bulletsLead && <p className="mb-6 text-lg font-medium text-kf-ink">{s.bulletsLead}</p>}
              {s.bullets.length > 0 && (
                <ul>
                  {s.bullets.map((b, k) => (
                    <li key={b} className="flex items-baseline gap-5 border-t border-kf-ink/15 py-6">
                      <span className="font-mono text-xs text-kf-red">0{k + 1}</span>
                      <span className="text-lg leading-relaxed text-kf-ink">{b}</span>
                    </li>
                  ))}
                  <li className="border-t border-kf-ink/15" />
                </ul>
              )}
              {s.bullets.length === 0 && <SpecSheet title={meta.specTitle} rows={meta.spec} />}
            </Reveal>
          </div>
          {meta.photo.wide && (
            <Reveal className="mt-16">
              <ImageFrame src={meta.photo.src} alt={meta.photo.alt} ratio="aspect-[1254/448]" radius="rounded-[28px]" parallax={false} />
            </Reveal>
          )}
        </Section>
      )}

      {/* Ficha técnica (cuando el detalle ya trae bullets) */}
      {s.bullets.length > 0 && s.highlights.length === 0 && (
        <Section>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <Eyebrow n={num()}>{meta.specTitle}</Eyebrow>
              <Heading size="lg">Datos <Serif>clave</Serif></Heading>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7"><SpecSheet rows={meta.spec} /></Reveal>
          </div>
        </Section>
      )}

      {/* Rangos de temperatura (almacén) */}
      {s.highlights.length > 0 && (
        <Section tone="navy">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <Eyebrow light n={num()}>Condiciones de almacenamiento</Eyebrow>
              <Heading light>Rangos de <Serif className="text-white">temperatura</Serif></Heading>
              <p className="mt-6 text-lg leading-relaxed text-white/75">Tres almacenes con áreas autorizadas por DIGEMID y Certificación en Buenas Prácticas de Almacenamiento.</p>
              <div className="mt-8 grid grid-cols-2 gap-6">
                {meta.spec.map(r => (
                  <div key={r.k} className="border-t border-white/20 pt-4">
                    <p className="font-display text-4xl font-semibold tracking-[-0.04em]">{r.v}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">{r.k}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              <SpecSheet light title="Almacenamiento · Rangos de temperatura"
                rows={s.highlights.map((h, k) => ({ k: h.label, v: h.range.replace(/-(?=\d)/g, '−'), note: `Almacén 0${k + 1}` }))} />
            </Reveal>
          </div>
        </Section>
      )}

      {/* Certificaciones con imágenes de certificados */}
      <Section tone={s.highlights.length > 0 ? 'white' : 'surface'}>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
          <Reveal className="lg:col-span-5">
            <Eyebrow n={num()}>Certificaciones</Eyebrow>
            <Heading size="lg">Procesos bajo <Serif>buenas prácticas</Serif></Heading>
            <p className="mt-6 text-lg leading-relaxed">Trabajamos con los lineamientos de DIGEMID y con certificación en BPA y BPDyT.</p>
            <SpecSheet className="mt-8" rows={[
              { k: 'Áreas autorizadas', v: 'DIGEMID' },
              { k: 'Almacenamiento', v: 'BPA' },
              { k: 'Distribución y Transporte', v: 'BPDyT' },
            ]} />
          </Reveal>
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
            {site.certificates.map(c => (
              <StaggerItem key={c.title}>
                <figure className={`flex h-full flex-col rounded-[28px] p-6 md:p-8 ${s.highlights.length > 0 ? 'bg-kf-sand' : 'bg-kf-canvas'} ${s.certificate === c.image ? 'ring-1 ring-kf-red/40' : ''}`}>
                  <div className="flex flex-1 items-center justify-center py-4">
                    <img src={c.image} alt={c.title} loading="lazy" className="max-h-56 w-auto max-w-full object-contain" />
                  </div>
                  <figcaption className="mt-6 border-t border-kf-ink/15 pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-kf-ink">{c.title}</figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Section>

      {/* Formulario + contacto directo */}
      <Section tone="surface" id="formulario" className="scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <Reveal>
            <Eyebrow n={num()}>Consulta</Eyebrow>
            <Heading level={2} size="lg">Cuéntanos qué <Serif>necesitas</Serif></Heading>
            <p className="mt-3 text-sm text-kf-muted">Los campos marcados con * son obligatorios.</p>
            <div className="mt-8 rounded-[32px] bg-kf-canvas p-6 shadow-[0_30px_60px_-40px_rgba(15,19,31,0.3)] md:p-10">
              <form noValidate onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                <Input label="Nombre" required placeholder="Tu nombre" autoComplete="given-name" {...bind('name')} />
                <Input label="Teléfono o celular" required type="tel" placeholder="999 999 999" autoComplete="tel" {...bind('phone')} />
                <Input label="Correo electrónico" required type="email" placeholder="correo@empresa.com" autoComplete="email" className="sm:col-span-2" {...bind('email')} />
                <Input label="Asunto" hint="Opcional" placeholder="Ej. Abastecimiento mensual" className="sm:col-span-2" {...bind('subject')} />
                <Textarea label="Mensaje" hint="Opcional" rows={5} placeholder="Cuéntanos tu necesidad" className="sm:col-span-2" {...bind('message')} />
                <div className="sm:col-span-2">
                  <PrivacyCheckbox checked={privacy.checked} onChange={privacy.onChange} error={privacy.error} />
                </div>
                <div className="space-y-4 sm:col-span-2">
                  <FormNotice result={result} successText="Gracias, recibimos tu consulta. Te contactaremos pronto." />
                  <SubmitButton sending={sending} className="w-full sm:w-auto">Enviar consulta</SubmitButton>
                </div>
              </form>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="kf-noise relative isolate h-full overflow-hidden rounded-[32px] bg-kf-navy-deep p-8 text-white md:p-10">
              <img src="/web/services/Ubicacion-local.webp" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-kf-navy-deep/70 to-kf-navy-deep" />
              <Eyebrow light>Contacto directo</Eyebrow>
              <Heading level={3} size="lg" light>Habla con nuestro <Serif className="text-white">equipo</Serif></Heading>
              <ul className="mt-8">
                <li className="border-t border-white/20 py-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">Teléfono</p>
                  {phones.map(p => <a key={p} href={telHref(p)} className="mt-1.5 block font-display text-2xl font-semibold tracking-[-0.02em] hover:underline">{p}</a>)}
                </li>
                <li className="border-t border-white/20 py-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">Correo</p>
                  <a href={`mailto:${s.contact.email}`} className="mt-1.5 block break-all text-lg font-medium hover:underline">{s.contact.email}</a>
                </li>
                <li className="border-y border-white/20 py-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">Dirección</p>
                  <a href={site.address.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-white/90 hover:underline">{site.address.line}, {site.address.city}</a>
                </li>
              </ul>
              <Button variant="whatsapp" block href={waHref} target="_blank" rel="noopener noreferrer" className="mt-8">
                <MessageCircle size={18} /> Escribir por WhatsApp
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  )
}

// Plantilla unica para todos los servicios; serviceKey llega como prop desde la ruta
const Service = ({ serviceKey }) => (content.services[serviceKey] && META[serviceKey]
  ? <ServiceDetail serviceKey={serviceKey} />
  : <NotFoundBlock />)

export default Service

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><Service {...properties} /></Layout>)
})
