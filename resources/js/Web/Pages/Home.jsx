import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Check, MessageCircle, Plus, Snowflake, ShieldCheck } from 'lucide-react'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout, { ProductSearch } from '../components/Layout'
import ProductCard from '../components/ProductCard'
import { useCart } from '../components/CartContext'
import {
  Bento, BentoTile, Button, Container, CTABand, EditorialSplit, Eyebrow, FullBleedHero, GridPattern, Heading, ImageFrame, Marquee,
  Reveal, Section, SectionHead, Serif, SpecSheet, Stagger, StaggerItem, Stat, Tag, TrustStrip, cx, money,
} from '../components/ui'
import site from '../data/site'
import categories from '../data/categories'
import benefits from '../data/benefits'
import products from '../data/products'

// Hero: foto de banco de la farmacéutica primero, mezclada con fotos reales de Kamary (laboratorio y equipo)
const HERO_IMAGES = [
  { src: '/web/extra/hero/hero-farmacia.webp', alt: 'Química farmacéutica en una farmacia moderna', caption: 'Farmacia', position: 'object-[50%_28%]' },
  { src: '/web/slider/Imag-home-4.webp', alt: 'Zona de producción de preparados magistrales', caption: 'Preparados magistrales', position: 'object-[50%_35%]' },
  { src: '/web/extra/banners/nosotros.webp', alt: 'Interior de una farmacia con atención personalizada', caption: 'Atención farmacéutica', position: 'object-[40%_50%]' },
  { src: '/web/slider/Imag-Home-3.webp', alt: 'Equipo de Kamary Perú', caption: 'Nuestro equipo', position: 'object-[50%_40%]' },
]

const WHY = [
  { title: 'Proveedor Integral', text: 'Farmacia, preparados magistrales, ventas corporativas y logística de última milla en un solo proveedor confiable.', icon: '/web/services/Icon-proveedor.webp' },
  { title: 'Servicio seguro y adaptable', text: 'Procesos logísticos seguros y controlados, con cumplimiento de normativas sanitarias.', icon: '/web/services/Icon-servicio.webp' },
  { title: 'Experiencia cliente', text: 'Atención personalizada para cada sector.', icon: '/web/services/Icon-experiencia.webp' },
]

// Banners panorámicos de producto (1351x352)
const PANORAMAS = [
  { src: '/web/slider/Slider-Collagen-3000.webp', alt: 'Collagen 3000 Plus Sticks', href: '/producto/collagen-3000-plus-sticks' },
  { src: '/web/slider/Slider-extracto.webp', alt: 'Extracto de Saw Palmetto, Pygeum y Ortiga', href: '/producto/pharmaris-extracto-de-saw-palmetto-pygeum-ortiga' },
  { src: '/web/slider/Slider-garcinia-1.webp', alt: 'Garcinia Cambogia, Té verde y Vinagre de manzana', href: '/producto/garcinia-cambogia-te-verde-vinagre-de-manzana' },
]

const waLink = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent('Hola Kamary Perú, requiero más información.')}`

/* ---------- Hero fotográfico a sangre ---------- */
const Hero = () => (
  <FullBleedHero images={HERO_IMAGES} className="min-h-[640px] lg:min-h-[860px]">
    <Container className="flex min-h-[640px] flex-col justify-center pb-24 pt-40 md:pt-48 lg:min-h-[860px]">
      <div className="max-w-3xl">
        <Eyebrow light n="KF">Farmacia · Magistrales · Logística B2B / B2C</Eyebrow>
        <Heading level={1} size="display" light immediate
          lines={['Especialistas en el', <>sector <Serif className="text-white">farmacéutico</Serif></>]} />
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/80">
          Somos Kamary Perú, empresa farmacéutica integral especializada en distribución y comercialización de productos farmacéuticos, dispositivos médicos y productos sanitarios.
        </p>
        <ProductSearch large className="mt-9 max-w-xl [&_input]:border-white/0" />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/tienda">Ir a la tienda <ArrowRight size={18} /></Button>
          <Button href="/preparados-magistrales" variant="ghostLight">Preparados magistrales</Button>
        </div>
      </div>
      {/* Datos técnicos flotantes */}
      <div className="absolute right-8 top-[34%] hidden flex-col gap-3 xl:flex">
        <div className="flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-5 py-3 backdrop-blur-md">
          <Snowflake size={16} className="text-white" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em]">2°C – 8°C · Cadena de frío</span>
        </div>
        <div className="flex items-center gap-3 self-end rounded-full border border-white/25 bg-white/10 px-5 py-3 backdrop-blur-md">
          <ShieldCheck size={16} className="text-white" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em]">DIGEMID · BPA · BPDyT</span>
        </div>
      </div>
    </Container>
  </FullBleedHero>
)

/* ---------- Carrusel panorámico de destacados ---------- */
const Panoramas = () => {
  const box = useRef(null)
  const paused = useRef(false)
  const go = (dir) => {
    const el = box.current
    if (!el) return
    const step = el.firstElementChild ? el.firstElementChild.getBoundingClientRect().width + 16 : el.clientWidth
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
    if (dir > 0 && end) el.scrollTo({ left: 0, behavior: 'smooth' })
    else el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }
  useEffect(() => {
    const t = setInterval(() => { if (!paused.current) go(1) }, 6000)
    return () => clearInterval(t)
  }, [])
  return (
    <div onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      <div ref={box} className="kf-hide-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth">
        {PANORAMAS.map(p => (
          <a key={p.src} href={p.href} className="group relative block w-[88%] shrink-0 snap-start overflow-hidden rounded-[24px] md:w-[78%] lg:w-[70%]">
            <img src={p.src} alt={p.alt} loading="lazy" decoding="async" className="aspect-[1351/352] w-full object-cover transition-transform duration-[1400ms] group-hover:scale-[1.03]" />
            <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-kf-ink opacity-0 transition-opacity group-hover:opacity-100"><ArrowUpRight size={18} /></span>
          </a>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="flex h-11 w-11 items-center justify-center rounded-full border border-kf-ink/20 transition-colors hover:bg-kf-ink hover:text-white"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="flex h-11 w-11 items-center justify-center rounded-full border border-kf-ink/20 transition-colors hover:bg-kf-ink hover:text-white"><ChevronRight size={18} /></button>
      </div>
    </div>
  )
}

/* ---------- Producto protagonista de la vitrina ---------- */
const FeaturedProduct = ({ product }) => {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const onAdd = () => { add(product.id, 1); setAdded(true); setTimeout(() => setAdded(false), 1400) }
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[32px] bg-kf-sand">
      <a href={`/producto/${product.slug}`} className="relative flex flex-1 items-center justify-center" aria-label={product.name}>
        <div className="flex aspect-square w-full items-center justify-center p-10 md:p-14 lg:aspect-auto lg:min-h-[480px]">
          <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="max-h-[420px] w-full object-contain mix-blend-multiply transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
        </div>
        <span className="absolute left-7 top-7 font-mono text-[11px] uppercase tracking-[0.16em] text-kf-red">Selección Kamary</span>
      </a>
      <div className="flex items-end justify-between gap-4 p-7 pt-0 md:p-9 md:pt-0">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-kf-muted">{product.brand}</p>
          <h3 className="mt-1.5 font-display text-2xl font-semibold tracking-[-0.03em] text-kf-ink md:text-3xl"><a href={`/producto/${product.slug}`}>{product.name}</a></h3>
          <p className="mt-2 font-display text-xl font-semibold text-kf-ink">{money(product.price)}</p>
        </div>
        <button type="button" onClick={onAdd} aria-label={`Agregar ${product.name} al carrito`}
          className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors', added ? 'bg-emerald-600 text-white' : 'bg-kf-ink text-white hover:bg-kf-red')}>
          {added ? <Check size={18} /> : <Plus size={20} />}
        </button>
      </div>
    </article>
  )
}

const byId = (id) => products.find(p => p.id === id)

const Home = () => {
  const star = byId(675) || products[0]
  const shelf = [680, 678, 689, 676].map(byId).filter(Boolean)
  return (
    <>
      <Hero />

      {/* Cifras */}
      <section className="bg-kf-canvas py-20 md:py-24">
        <Container>
          <Stagger className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            <StaggerItem><Stat value={11} prefix="+" label="Años de experiencia" sub="Empresa farmacéutica integral" /></StaggerItem>
            <StaggerItem><Stat value={3} label="Almacenes" sub="Áreas autorizadas por DIGEMID" /></StaggerItem>
            <StaggerItem><Stat value={3} label="Rangos de temperatura" sub="Congelado, frío y controlado" /></StaggerItem>
            <StaggerItem><Stat value={products.length} label="Productos en tienda" sub={`${categories.length} categorías`} /></StaggerItem>
          </Stagger>
          <Reveal className="mt-20"><TrustStrip /></Reveal>
        </Container>
      </section>

      {/* 01 Servicios */}
      <Section tone="surface">
        <SectionHead n="01" eyebrow="Servicios" lines={['Una sola empresa,', <><Serif>tres</Serif> soluciones</>]} title={null}
          action={<Button href="/ventas-corporativas" variant="ghost">Ventas corporativas <ArrowRight size={16} /></Button>} />
        <Bento>
          <BentoTile href="/preparados-magistrales" image="/web/extra/banners/band-magistrales.webp" position="object-[42%_30%]" span="col-span-12 md:col-span-7" minH="min-h-[420px] md:min-h-[600px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">01 — Magistrales</p>
            <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">Preparados magistrales</h3>
            <p className="mt-3 max-w-md text-white/80">Formulaciones personalizadas bajo estrictos estándares de calidad, con químicos farmacéuticos especializados.</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">Más información <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
          </BentoTile>
          <div className="col-span-12 grid gap-4 md:col-span-5 md:gap-5">
            <BentoTile href="/ventas-corporativas" image="/web/extra/negocio/ventas-corporativas.webp" position="object-[50%_20%]" span="" minH="min-h-[300px]">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">02 — B2B</p>
              <h3 className="mt-2 max-w-[15rem] font-display text-2xl font-semibold tracking-[-0.03em] md:text-3xl">Ventas corporativas</h3>
              <p className="mt-2 max-w-[17rem] text-sm text-white/80">Abastecimiento de productos farmacéuticos, dispositivos médicos y productos sanitarios para empresas e instituciones.</p>
            </BentoTile>
            <BentoTile href="/operador-logistico" image="/web/extra/banners/band-operador.webp" position="object-[50%_35%]" span="" minH="min-h-[300px]">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">03 — Logística</p>
              <h3 className="mt-2 max-w-[15rem] font-display text-2xl font-semibold tracking-[-0.03em] md:text-3xl">Operador logístico</h3>
              <p className="mt-2 max-w-[17rem] text-sm text-white/80">Salud en movimiento: abastecimiento programado, trazabilidad completa y cadena de frío.</p>
            </BentoTile>
          </div>
        </Bento>
      </Section>

      {/* 02 Especialistas — collage */}
      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
          <Reveal className="lg:col-span-7">
            <div className="relative pb-[18%] pr-[8%]">
              <ImageFrame src="/web/slider/Imag-Home-3.webp" alt="Equipo de Kamary Perú" ratio="aspect-[5/4]" radius="rounded-[32px] rounded-tr-[120px]" position="object-[50%_45%]" />
              <ImageFrame src="/web/services/Farmacia.webp" alt="Químico farmacéutico" ratio="aspect-[4/3]" radius="rounded-[24px]" position="object-[70%_30%]"
                className="absolute bottom-0 right-0 w-[46%] border-[6px] border-kf-canvas shadow-[0_24px_50px_-20px_rgba(15,19,31,0.35)]" />
              <ImageFrame src="/web/services/Img-Nosotros-Kamary-1.webp" alt="Equipo comercial de Kamary" ratio="aspect-[3/4]" radius="rounded-[24px]" position="object-[75%_55%]"
                className="absolute -bottom-0 left-[6%] hidden w-[26%] border-[6px] border-kf-canvas shadow-[0_24px_50px_-20px_rgba(15,19,31,0.35)] md:block" />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5">
            <Eyebrow n="02">Nosotros</Eyebrow>
            <Heading>Especialistas en el sector <Serif>farmacéutico</Serif></Heading>
            <p className="mt-6 text-lg leading-relaxed">
              Somos Kamary Perú, empresa farmacéutica integral especializada en distribución y comercialización de productos farmacéuticos, dispositivos médicos y productos sanitarios. Integramos farmacia, preparados magistrales, ventas corporativas y logística de última milla en un solo proveedor confiable.
            </p>
            <ul className="mt-8">
              {['Cumplimiento de normativas sanitarias', 'Procesos logísticos seguros y controlados', 'Atención personalizada para cada sector'].map((t, k) => (
                <li key={t} className="flex items-baseline gap-4 border-t border-kf-ink/15 py-4 text-kf-ink">
                  <span className="font-mono text-xs text-kf-red">0{k + 1}</span>{t}
                </li>
              ))}
              <li className="border-t border-kf-ink/15" />
            </ul>
            <Button href="/nosotros" variant="secondary" className="mt-8">Conoce más sobre nosotros</Button>
          </Reveal>
        </div>
      </Section>

      {/* 03 Colecciones */}
      <Section tone="surface">
        <SectionHead n="03" eyebrow="Tienda" lines={['Explora por', <><Serif>colección</Serif></>]} title={null}
          action={<Button href="/tienda" variant="ghost">Ver toda la tienda</Button>} />
        <Bento>
          {[
            { src: '/web/slider/Colageno-H.-Banner.webp', name: 'Colágenos', href: '/categoria-producto/colagenos' },
            { src: '/web/slider/Complemento-N.-Banner.webp', name: 'Complemento nutricional', href: '/tienda' },
            { src: '/web/slider/Otros-Productos.webp', name: 'Productos farmacéuticos', href: '/tienda' },
          ].map((c, k) => (
            <BentoTile key={c.name} href={c.href} image={c.src} overlay={false} span={cx('col-span-12 md:col-span-4', k === 1 && 'md:translate-y-10')} minH="aspect-[7/8] min-h-0" className="rounded-[32px]">
              <span className="mt-auto flex items-center justify-between rounded-full bg-white px-6 py-4 text-kf-ink shadow-[0_10px_30px_rgba(15,19,31,0.15)]">
                <span className="font-display font-semibold tracking-[-0.02em]"><span className="mr-3 font-mono text-[11px] text-kf-red">0{k + 1}</span>{c.name}</span>
                <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </BentoTile>
          ))}
        </Bento>
        <Reveal className="mt-24 grid gap-x-10 md:mt-28 md:grid-cols-2">
          {categories.map((c, k) => (
            <a key={c.slug} href={`/categoria-producto/${c.slug}`} className="group flex items-baseline justify-between gap-4 border-t border-kf-ink/15 py-4">
              <span className="flex items-baseline gap-4"><span className="font-mono text-xs text-kf-red">0{k + 1}</span><span className="font-medium text-kf-ink transition-transform group-hover:translate-x-1">{c.name}</span></span>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-kf-muted">{c.count} productos</span>
            </a>
          ))}
        </Reveal>
      </Section>

      {/* 04 Destacados del mes */}
      <Section>
        <SectionHead n="04" eyebrow="Destacados del mes" lines={['Lo nuevo,', <>en <Serif>primer plano</Serif></>]} title={null} />
        <Reveal><Panoramas /></Reveal>
      </Section>

      {/* 05 Vitrina */}
      <Section tone="canvas" className="!pt-0">
        <SectionHead n="05" eyebrow="Productos destacados" lines={['Lo más', <><Serif>buscado</Serif> de la tienda</>]} title={null}
          action={<Button href="/tienda" variant="secondary">Ver más <ArrowRight size={18} /></Button>} />
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          <Reveal className="h-full"><FeaturedProduct product={star} /></Reveal>
          <Stagger className="grid grid-cols-2 gap-x-4 gap-y-10 lg:gap-x-6">
            {shelf.map(p => <StaggerItem key={p.id}><ProductCard product={p} /></StaggerItem>)}
          </Stagger>
        </div>
      </Section>

      {/* 06 Beneficios */}
      <Section tone="surface" className="!py-20 md:!py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          <Reveal>
            <Eyebrow n="06">Por beneficio</Eyebrow>
            <Heading size="lg">Encuentra lo que <Serif>necesitas</Serif></Heading>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap content-start gap-3">
            {benefits.map(b => <Tag key={b.slug} href={`/tienda?beneficio=${b.slug}`}>{b.name}</Tag>)}
          </Reveal>
        </div>
      </Section>

      {/* 07 Operador logístico */}
      <Section tone="navy">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <Reveal className="lg:col-span-6">
            <Eyebrow light n="07">Operador logístico</Eyebrow>
            <Heading light lines={['Salud en', <><Serif className="text-white">movimiento</Serif></>]} title={null} />
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">Cadena de frío y cumplimiento normativo, con trazabilidad en cada entrega.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {['2°C – 8°C', 'BPA', 'BPDyT', 'Trazabilidad'].map(c => <span key={c} className="rounded-full border border-white/25 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/90">{c}</span>)}
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              {[{ t: 'B2C', items: ['Entregas a domicilio', 'Monitoreo en tiempo real'] }, { t: 'B2B', items: ['Abastecimiento programado', 'Trazabilidad completa'] }].map(b => (
                <div key={b.t} className="border-t border-white/20 pt-4">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">{b.t}</p>
                  <ul className="mt-3 space-y-1.5 font-medium">{b.items.map(i => <li key={i}>{i}</li>)}</ul>
                </div>
              ))}
            </div>
            <Button href="/operador-logistico" variant="white" className="mt-10">Conoce el servicio</Button>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6">
            <SpecSheet light title="Almacenamiento · Rangos de temperatura" rows={[
              { k: 'Medicamentos congelados', v: '-15°C a -25°C', note: 'Almacén 01' },
              { k: 'Cadena de frío', v: '2°C a 8°C', note: 'Almacén 02' },
              { k: 'Temperatura controlada', v: '15°C a 25°C', note: 'Almacén 03' },
            ]} />
            <div className="mt-10 flex items-center gap-6">
              {(site.certificates || []).map(c => (
                <figure key={c.image} className="flex items-center gap-4">
                  <img src={c.image} alt={c.title} loading="lazy" decoding="async" className="h-24 w-24 object-contain" />
                  <figcaption className="max-w-[9rem] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-white/70">{c.title}</figcaption>
                </figure>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-16 grid gap-4 md:mt-20 md:grid-cols-12 md:gap-5">
          <ImageFrame src="/web/extra/banners/logistica.webp" alt="Flota de furgonetas cargando pedidos en el almacén" ratio="aspect-[16/10]" radius="rounded-[28px]" position="object-[65%_50%]" className="md:col-span-7" parallax={false} />
          <div className="grid grid-cols-2 gap-4 md:col-span-5 md:grid-cols-1 md:gap-5">
            <ImageFrame src="/web/extra/nosotros/envios-delivery.webp" alt="Equipo de reparto de Kamary Perú con motos" ratio="aspect-[4/3] md:aspect-auto md:h-full" radius="rounded-[28px] rounded-br-[90px]" position="object-[50%_60%]" parallax={false} />
            <ImageFrame src="/web/extra/banners/band-operador.webp" alt="Entrega de medicamentos en caja térmica" ratio="aspect-[4/3] md:aspect-auto md:h-full" radius="rounded-[28px]" position="object-[50%_45%]" parallax={false} className="hidden md:block" />
          </div>
        </Reveal>
      </Section>

      {/* Preparados magistrales — banda fotográfica */}
      <section className="kf-noise relative isolate overflow-hidden bg-kf-navy-deep py-24 text-white md:py-32">
        <img src="/web/extra/banners/magistrales.webp" alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover object-[75%_40%] opacity-90" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-kf-navy-deep via-kf-navy-deep/70 to-transparent" />
        <Container className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <Eyebrow light>Preparados magistrales</Eyebrow>
            <Heading light>Preparados Magistrales <Serif className="text-white">a tu medida</Serif></Heading>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">Elaboramos formulaciones personalizadas bajo estrictos estándares de calidad, con químicos farmacéuticos especializados e insumos certificados.</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:text-right"><Button href="/preparados-magistrales">Solicitar asesoría</Button></Reveal>
        </Container>
      </section>

      {/* 08 Por qué elegirnos */}
      <section className="kf-noise relative isolate overflow-hidden bg-kf-navy-deep py-24 text-white md:py-32">
        <img src="/web/extra/banners/razones.webp" alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_60%]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-kf-navy-deep/75 lg:bg-gradient-to-r lg:from-kf-navy-deep/90 lg:via-kf-navy-deep/55 lg:to-kf-navy-deep/15" />
        <Container>
          <Reveal className="mb-14 max-w-3xl">
            <Eyebrow light n="08">Somos tu socio estratégico en el sector farmacéutico</Eyebrow>
            <Heading light>Elegir a nuestra marca es una <Serif className="text-white">decisión inteligente</Serif> por varias razones</Heading>
          </Reveal>
          <Stagger className="grid max-w-3xl gap-0">
            {WHY.map((w, k) => (
              <StaggerItem key={w.title}>
                <div className="flex gap-6 border-t border-white/25 py-7 md:gap-8">
                  <img src={w.icon} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 object-contain md:h-16 md:w-16" />
                  <div>
                    <p className="font-mono text-xs text-white/60">0{k + 1}</p>
                    <h3 className="mt-1 font-display text-xl font-semibold tracking-[-0.02em] md:text-2xl">{w.title}</h3>
                    <p className="mt-2 max-w-xl leading-relaxed text-white/80">{w.text}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* 09 Socios */}
      <Section tone="surface">
        <EditorialSplit reverse image={<ImageFrame src="/web/partners/Nuestros-Socios.webp" alt="Equipo de Grupo Kamary" ratio="aspect-[4/3]" radius="rounded-[32px] rounded-bl-[110px]" position="object-[50%_60%]" />}>
          <Eyebrow n="09">Marcas líderes que confían en Kamary</Eyebrow>
          <Heading size="lg">Somos proveedor <Serif>homologado</Serif> por</Heading>
          <p className="mt-6 text-lg leading-relaxed">Trabajamos con clientes que confían en la calidad de nuestros productos y en nuestro compromiso con el bienestar y la salud.</p>
          <p className="mt-6 border-t border-kf-ink/15 pt-5 text-xs leading-relaxed text-kf-muted">{site.homologationDisclaimer}</p>
        </EditorialSplit>
        <div className="mt-20">
          <Marquee speed={45} itemClassName="gap-6 pr-6">
            {(site.partners || []).map(p => (
              <span key={p.name} className="flex h-20 w-44 shrink-0 items-center justify-center rounded-2xl bg-white p-3 md:h-24 md:w-52"><img src={p.image} alt={p.name} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain grayscale transition-all duration-500 hover:grayscale-0" /></span>
            ))}
            <span className="flex h-20 w-44 shrink-0 items-center justify-center rounded-2xl bg-white p-3 md:h-24 md:w-52"><img src="/web/slider/MEGA.webp" alt="MEGA, proveedor homologado" loading="lazy" decoding="async" className="max-h-full max-w-full object-contain grayscale transition-all duration-500 hover:grayscale-0" /></span>
          </Marquee>
        </div>
      </Section>

      <CTABand image="/web/extra/banners/band-valores.webp" imagePosition="object-[50%_30%]" eyebrow="Asesoría" title={<>¿Necesitas ayuda para <Serif className="text-white">elegir</Serif>?</>} text="Escríbenos por WhatsApp y te asesoramos con tu pedido.">
        <Button variant="whatsapp" href={waLink} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> Escribir por WhatsApp</Button>
        <Button variant="ghostLight" href="/contacto">Contáctanos</Button>
      </CTABand>
    </>
  )
}

export default Home

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><Home {...properties} /></Layout>)
})
