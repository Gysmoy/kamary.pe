import { createRoot } from 'react-dom/client'
import { ArrowRight, MessageCircle } from 'lucide-react'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout from '../components/Layout'
import {
  Button, Container, CTABand, EditorialSplit, Eyebrow, FullBleedHero, Heading, ImageFrame, Marquee, Reveal, Section, SectionHead,
  Serif, SpecSheet, Stagger, StaggerItem, Stat,
} from '../components/ui'
import site from '../data/site'
import content from '../data/content'

const { about } = content

// Imágenes del hero (collage rotativo con las fotos de equipo y laboratorio)
const HERO_IMAGES = [
  { src: '/web/slider/Imag-Home-3.webp', alt: 'Equipo de Kamary Perú', caption: 'Nuestro equipo', position: 'object-[50%_45%]' },
  { src: '/web/services/Img-Nosotros-Kamary.webp', alt: 'Equipo comercial de Kamary Perú', caption: 'Kamary Perú', position: 'object-[50%_30%]' },
  { src: '/web/slider/slider-Farmacia.webp', alt: 'Farmacia y laboratorio', caption: 'Farmacia y laboratorio', position: 'object-center' },
]

// Bloques de valor (textos tomados de la página Nosotros del sitio actual)
const VALUE_BLOCKS = [
  { title: 'Calidad garantizada', text: 'Ofrecemos productos de calidad y atención farmacéutica especializada.' },
  { title: 'Abastecimiento rápido', text: 'Abastecimiento programado y entregas puntuales.' },
  { title: 'Atención personalizada', text: 'Atención personalizada y asesoría profesional.' },
  { title: 'Equipo profesional', text: 'Operamos bajo el cumplimiento normativo, respaldados por un equipo de profesionales altamente capacitados.' },
]

const waLink = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(site.whatsapp.message)}`

/* ---------- Hero fotográfico a sangre ---------- */
const Hero = () => (
  <FullBleedHero images={HERO_IMAGES} className="min-h-[600px] lg:min-h-[780px]">
    <Container className="flex min-h-[600px] flex-col justify-center pb-24 pt-40 md:pt-48 lg:min-h-[780px]">
      <div className="max-w-3xl">
        <Eyebrow light n="KF">Nosotros</Eyebrow>
        <Heading level={1} size="display" light immediate
          lines={['Especialistas en el', <>sector <Serif className="text-white">farmacéutico</Serif></>]} />
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/80">{about.intro.paragraphs[0].split('. ')[0]}.</p>
        <div className="mt-8 flex flex-wrap gap-2">
          {site.certifications.map(c => (
            <span key={c} className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white backdrop-blur-md">{c}</span>
          ))}
        </div>
      </div>
    </Container>
  </FullBleedHero>
)

/* ---------- Cifras ---------- */
const Figures = () => (
  <section className="bg-kf-canvas py-20 md:py-24">
    <Container>
      <Stagger className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
        <StaggerItem><Stat value={11} prefix="+" label="Años de experiencia" sub="Empresa farmacéutica integral" /></StaggerItem>
        <StaggerItem><Stat value={3} label="Almacenes" sub="Áreas autorizadas por DIGEMID" /></StaggerItem>
        <StaggerItem><Stat value={3} label="Rangos de temperatura" sub="Congelado, frío y controlado" /></StaggerItem>
        <StaggerItem><Stat value={site.partners.length} label="Marcas que confían" sub="Proveedor homologado" /></StaggerItem>
      </Stagger>
    </Container>
  </section>
)

/* ---------- 01 Historia ---------- */
const Story = () => (
  <Section tone="surface">
    <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
      <Reveal className="lg:col-span-7">
        <div className="relative pb-[16%] pr-[6%]">
          <ImageFrame src="/web/services/Img-Nosotros-Kamary.webp" alt="Equipo comercial de Kamary Perú" ratio="aspect-[4/3]" radius="rounded-[32px] rounded-tr-[120px]" position="object-[50%_40%]" />
          <ImageFrame src="/web/services/Farmacia.webp" alt="Químico farmacéutico de Kamary" ratio="aspect-[4/3]" radius="rounded-[24px]" position="object-[70%_30%]"
            className="absolute bottom-0 right-0 w-[44%] border-[6px] border-kf-sand shadow-[0_24px_50px_-20px_rgba(15,19,31,0.35)]" />
        </div>
      </Reveal>
      <Reveal delay={0.1} className="lg:col-span-5">
        <Eyebrow n="01">{about.intro.title}</Eyebrow>
        <Heading>Una empresa <Serif>integral</Serif>, un solo proveedor</Heading>
        <p className="mt-6 text-lg leading-relaxed">{about.intro.paragraphs[0]}</p>
        <p className="mt-5 leading-relaxed">{about.intro.paragraphs[1]}</p>
      </Reveal>
    </div>
  </Section>
)

/* ---------- Enfoque (4 bloques de valor numerados) ---------- */
const Approach = () => (
  <Section>
    <SectionHead n="02" eyebrow="Nuestro enfoque" lines={['Lo que nos', <><Serif>distingue</Serif></>]} title={null} />
    <Stagger className="grid gap-x-10 gap-y-0 md:grid-cols-2">
      {VALUE_BLOCKS.map((b, k) => (
        <StaggerItem key={b.title}>
          <div className="flex gap-6 border-t border-kf-ink/15 py-8">
            <span className="font-mono text-xs text-kf-red">0{k + 1}</span>
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-[-0.03em] text-kf-ink md:text-3xl">{b.title}</h3>
              <p className="mt-3 max-w-md leading-relaxed">{b.text}</p>
            </div>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  </Section>
)

/* ---------- Compromiso + Misión / Visión editoriales ---------- */
const Commitment = () => (
  <Section tone="surface">
    <EditorialSplit reverse image={<ImageFrame src="/web/services/Img-Nosotros-Kamary-1.jpg" alt="Equipo de Kamary Perú" ratio="aspect-[4/3]" radius="rounded-[32px] rounded-br-[110px]" position="object-[50%_40%]" />}>
      <Eyebrow n="03">Compromiso</Eyebrow>
      <Heading size="lg">{about.trust.title}</Heading>
      <p className="mt-6 text-lg leading-relaxed">{about.trust.text}</p>
    </EditorialSplit>
  </Section>
)

const MissionVision = () => (
  <>
    <section className="bg-kf-canvas py-24 md:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <Eyebrow n="04">{about.mission.title}</Eyebrow>
            <p className="font-serif text-7xl italic leading-none text-kf-red md:text-8xl">{about.mission.title}</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-8">
            <p className="font-display text-2xl font-medium leading-[1.3] tracking-[-0.02em] text-kf-ink [text-wrap:pretty] md:text-3xl lg:text-[34px]">{about.mission.text}</p>
          </Reveal>
        </div>
      </Container>
    </section>
    <section className="kf-noise relative isolate overflow-hidden bg-kf-navy-deep py-24 text-white md:py-32">
      <img src="/web/services/Bg-elegirnos.webp" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover object-right opacity-40" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-kf-navy-deep via-kf-navy-deep/80 to-kf-navy-deep/30" />
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <Eyebrow light n="05">{about.vision.title}</Eyebrow>
            <p className="font-serif text-7xl italic leading-none text-white md:text-8xl">{about.vision.title}</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-8">
            <p className="font-display text-2xl font-medium leading-[1.3] tracking-[-0.02em] text-white [text-wrap:pretty] md:text-3xl lg:text-[34px]">{about.vision.text}</p>
          </Reveal>
        </div>
      </Container>
    </section>
  </>
)

/* ---------- Principios y ventajas ---------- */
const Principles = () => (
  <Section>
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
      <Reveal className="lg:col-span-5">
        <Eyebrow n="06">Valores</Eyebrow>
        <Heading size="lg">{about.valuesSection.title}</Heading>
        <p className="mt-6 text-lg leading-relaxed">{about.valuesSection.lead}</p>
      </Reveal>
      <Stagger className="lg:col-span-7">
        {about.valuesSection.items.map((it, k) => (
          <StaggerItem key={it.title}>
            <div className="grid gap-2 border-t border-kf-ink/15 py-7 md:grid-cols-[3rem_1fr_1.2fr] md:gap-6">
              <span className="font-mono text-xs text-kf-red">0{k + 1}</span>
              <h3 className="font-display text-2xl font-semibold tracking-[-0.03em] text-kf-ink">{it.title}</h3>
              <p className="leading-relaxed">{it.text}</p>
            </div>
          </StaggerItem>
        ))}
        <div className="border-t border-kf-ink/15" />
      </Stagger>
    </div>
  </Section>
)

const Advantages = () => (
  <section className="kf-noise relative isolate overflow-hidden bg-kf-navy-deep py-24 text-white md:py-32">
    <Container>
      <Reveal className="mb-14 max-w-3xl">
        <Eyebrow light n="07">Diferenciales</Eyebrow>
        <Heading light>{about.advantages.title}</Heading>
      </Reveal>
      <Stagger className="grid gap-x-10 md:grid-cols-3">
        {about.advantages.items.map((it, k) => (
          <StaggerItem key={it.title}>
            <div className="h-full border-t border-white/25 pt-6">
              <p className="font-display text-6xl font-semibold tracking-[-0.045em] text-white/90 md:text-7xl">0{k + 1}</p>
              <h3 className="mt-8 font-display text-xl font-semibold leading-snug tracking-[-0.02em] md:text-2xl">{it.title}</h3>
              <p className="mt-3 leading-relaxed text-white/75">{it.text}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Container>
  </section>
)

/* ---------- Certificaciones ---------- */
const Certifications = () => (
  <Section tone="surface">
    <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
      <Reveal className="lg:col-span-5">
        <Eyebrow n="08">Certificaciones</Eyebrow>
        <Heading size="lg">Operamos con <Serif>respaldo</Serif> documentado</Heading>
        <SpecSheet className="mt-10" title="Cumplimiento" rows={[
          { k: 'Áreas autorizadas', v: 'DIGEMID', note: 'Tres almacenes' },
          { k: 'Buenas Prácticas de Almacenamiento', v: 'BPA' },
          { k: 'Buenas Prácticas de Distribución y Transporte', v: 'BPDyT' },
        ]} />
      </Reveal>
      <Stagger className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
        {site.certificates.map(c => (
          <StaggerItem key={c.title}>
            <figure className="flex h-full flex-col rounded-[28px] bg-kf-canvas p-6 md:p-8">
              <div className="flex flex-1 items-center justify-center py-4">
                <img src={c.image} alt={c.title} loading="lazy" className="max-h-64 w-auto max-w-full object-contain" />
              </div>
              <figcaption className="mt-6 border-t border-kf-ink/15 pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-kf-ink">{c.title}</figcaption>
            </figure>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  </Section>
)

/* ---------- Socios ---------- */
const Partners = () => (
  <Section>
    <EditorialSplit reverse image={<ImageFrame src="/web/partners/Nuestros-Socios.jpg" alt="Equipo de Grupo Kamary" ratio="aspect-[4/3]" radius="rounded-[32px] rounded-bl-[110px]" position="object-[50%_60%]" />}>
      <Eyebrow n="09">{about.partners.title}</Eyebrow>
      <Heading size="lg">Somos proveedor <Serif>homologado</Serif> por</Heading>
      <p className="mt-6 text-lg leading-relaxed">{about.partners.text}</p>
      <p className="mt-6 border-t border-kf-ink/15 pt-5 text-xs leading-relaxed text-kf-muted">{about.intro.homologationDisclaimer}</p>
    </EditorialSplit>
    <div className="mt-20">
      <Marquee speed={45} itemClassName="gap-6 pr-6">
        {site.partners.map(p => (
          <span key={p.name} className="flex h-20 w-44 shrink-0 items-center justify-center rounded-2xl bg-white p-3 md:h-24 md:w-52">
            <img src={p.image} alt={p.name} loading="lazy" className="max-h-full max-w-full object-contain grayscale transition-all duration-500 hover:grayscale-0" />
          </span>
        ))}
      </Marquee>
    </div>
  </Section>
)

const About = () => (
  <>
    <Hero />
    <Figures />
    <Story />
    <Approach />
    <Commitment />
    <MissionVision />
    <Principles />
    <Advantages />
    <Certifications />
    <Partners />
    <CTABand
      image="/web/slider/Imag-home-4.webp"
      eyebrow="Contacto"
      title={<>Conversemos sobre tu <Serif className="text-white">necesidad</Serif></>}
      text="Nuestro equipo te orienta según tu sector: ventas corporativas, operador logístico o preparados magistrales."
    >
      <Button variant="white" href="/contacto">Contáctanos <ArrowRight size={18} /></Button>
      <Button variant="whatsapp" href={waLink} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> WhatsApp</Button>
    </CTABand>
  </>
)

export default About

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><About {...properties} /></Layout>)
})
