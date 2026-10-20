import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useInView, useReducedMotion as useFmReduced, useScroll, useTransform } from 'framer-motion'
import { Pill, ShieldPlus, Sparkles, Zap, Dumbbell, Flame, User, Brain, ShieldCheck, Warehouse, Truck, FlaskConical, Snowflake, Heart, Leaf, Droplets, Apple, Activity, Bone, Baby, Building2, Package, Stethoscope, Syringe, Microscope, Phone, Mail, MapPin, Clock, FileText, Upload, Check, Star, Sun, Moon, Eye, Smile, Users, Award, Boxes, Thermometer, ClipboardList, Globe, Plane, Ship, Scale, HeartPulse, Dna, Atom, Salad, Bed, Wind, Gem, CheckCircle2, AlertCircle, MessageCircle, Send, Search, ShoppingBag, ArrowRight, Briefcase, Target, Handshake, Calendar, Lock, Facebook, Instagram, BookOpen } from 'lucide-react'

const icons = { ShieldPlus, Sparkles, Zap, Dumbbell, Flame, User, Brain, ShieldCheck, Warehouse, Truck, FlaskConical, Snowflake, Pill, Heart, Leaf, Droplets, Apple, Activity, Bone, Baby, Building2, Package, Stethoscope, Syringe, Microscope, Phone, Mail, MapPin, Clock, FileText, Upload, Check, Star, Sun, Moon, Eye, Smile, Users, Award, Boxes, Thermometer, ClipboardList, Globe, Plane, Ship, Scale, HeartPulse, Dna, Atom, Salad, Bed, Wind, Gem, CheckCircle2, AlertCircle, MessageCircle, Send, Search, ShoppingBag, ArrowRight, Briefcase, Target, Handshake, Calendar, Lock, Facebook, Instagram, BookOpen }

// Utilidades
// Sin animaciones de entrada si el usuario lo pide, o en capturas/bots headless (?static fuerza el modo)
const STATIC = typeof navigator !== 'undefined' && (/Headless/i.test(navigator.userAgent) || /[?&]static/.test(window.location.search))
const useReducedMotion = () => { const r = useFmReduced(); return r || STATIC }

export const cx = (...c) => c.filter(Boolean).join(' ')
export const money = (n) => `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Ícono lucide por nombre (acepta kebab-case o PascalCase) */
export const Icon = ({ name, className, size = 20, strokeWidth = 1.5 }) => {
  const pascal = `${name ?? ''}`.split(/[-_ ]/).filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join('')
  const Cmp = icons[pascal] || Pill
  return <Cmp className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />
}

export const Container = ({ className, children, as: Tag = 'div' }) => (
  <Tag className={cx('mx-auto w-full max-w-[1320px] px-5 md:px-8 lg:px-10', className)}>{children}</Tag>
)

/* ============ Sistema visual v2: canvas cálido + navy con grano ============ */
const tones = {
  white: 'bg-kf-canvas',
  canvas: 'bg-kf-canvas',
  surface: 'bg-kf-sand',
  mint: 'bg-kf-mint',
  navy: 'bg-kf-navy-deep text-white relative overflow-hidden kf-noise',
}
export const Section = ({ tone = 'white', className, children, id }) => (
  <section id={id} className={cx('relative py-20 md:py-28 lg:py-32', tones[tone], className)}>
    {tone === 'navy' && <GridPattern />}
    <Container className="relative">{children}</Container>
  </section>
)

/** Patrón sutil de grilla tipo laboratorio */
export const GridPattern = ({ className }) => (
  <div aria-hidden="true" className={cx('pointer-events-none absolute inset-0', className)}
    style={{
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      backgroundSize: '64px 64px',
      maskImage: 'radial-gradient(ellipse at 75% 20%, #000 0%, transparent 70%)',
      WebkitMaskImage: 'radial-gradient(ellipse at 75% 20%, #000 0%, transparent 70%)',
    }} />
)

/** Grano sutil sobre superficies navy (el padre debe ser relative) */
export const Noise = ({ className }) => <div aria-hidden="true" className={cx('kf-noise pointer-events-none absolute inset-0', className)} />

/** Eyebrow editorial. `n` agrega numeración mono ("01 — Servicios") */
export const Eyebrow = ({ children, className, light, n }) => (
  <p className={cx('mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] md:text-xs', light ? 'text-white/70' : 'text-kf-muted', className)}>
    {n != null && <span className={light ? 'text-white' : 'text-kf-red'}>{n}</span>}
    {n != null && <span className="h-px w-8 bg-current opacity-40" />}
    <span>{children}</span>
  </p>
)

/** Acento serif itálico para resaltar 1-2 palabras en títulos */
export const Serif = ({ children, className = 'text-kf-red' }) => (
  <em className={cx('font-serif text-[1.1em] font-normal italic leading-[0.9] tracking-[-0.01em]', className)}>{children}</em>
)

/** Titular que entra línea por línea (clip). `lines` = array de nodos; con `immediate` anima al montar */
export const Lines = ({ lines, as: Tag = 'h2', className, delay = 0, immediate }) => {
  const reduce = useReducedMotion()
  return (
    <Tag className={className}>
      {lines.map((l, i) => (
        <span key={i} className="-my-[0.1em] block overflow-hidden py-[0.1em]">
          <motion.span className="block" initial={reduce ? false : { y: '110%' }}
            {...(immediate ? { animate: { y: 0 } } : { whileInView: { y: 0 }, viewport: { once: true, amount: 0.1 } })}
            transition={{ duration: 0.9, delay: delay + i * 0.1, ease: [0.2, 0.7, 0.2, 1] }}>{l}</motion.span>
        </span>
      ))}
    </Tag>
  )
}

export const Heading = ({ level = 2, size, light, className, children, lines, immediate, delay }) => {
  const Tag = `h${level}`
  const sizes = {
    mega: 'text-[46px] leading-[1.0] md:text-7xl lg:text-[96px]',
    display: 'text-[44px] leading-[1.02] md:text-7xl lg:text-[84px]',
    xl: 'text-[34px] leading-[1.06] md:text-5xl lg:text-[58px]',
    lg: 'text-[28px] leading-[1.1] md:text-4xl lg:text-[42px]',
    md: 'text-xl md:text-2xl leading-snug',
  }
  const cls = cx('font-display font-semibold tracking-[-0.035em] [text-wrap:balance]', sizes[size || (level === 1 ? 'display' : 'xl')], light ? 'text-white' : 'text-kf-ink', className)
  if (lines) return <Lines as={Tag} lines={lines} className={cls} immediate={immediate} delay={delay} />
  return <Tag className={cls}>{children}</Tag>
}

/** Cabecera de sección: eyebrow numerado + titular + acción a la derecha. Props: n, eyebrow, title, text, action, light */
export const SectionHead = ({ n, eyebrow, title, lines, text, action, light, className, size = 'xl' }) => (
  <div className={cx('mb-12 flex flex-col justify-between gap-8 md:mb-16 md:flex-row md:items-end', className)}>
    <Reveal className="max-w-3xl">
      {eyebrow && <Eyebrow n={n} light={light}>{eyebrow}</Eyebrow>}
      <Heading size={size} light={light} lines={lines}>{title}</Heading>
      {text && <p className={cx('mt-6 max-w-xl text-lg leading-relaxed', light && 'text-white/75')}>{text}</p>}
    </Reveal>
    {action && <Reveal delay={0.1} className="shrink-0">{action}</Reveal>}
  </div>
)

const btnVariants = {
  primary: 'bg-kf-red text-white hover:bg-kf-red-dark',
  secondary: 'bg-kf-navy text-white hover:bg-kf-navy-deep',
  ghost: 'bg-transparent text-kf-ink border border-kf-ink/20 hover:border-kf-ink hover:bg-kf-ink hover:text-white',
  ghostLight: 'bg-white/5 text-white border border-white/30 backdrop-blur-sm hover:bg-white hover:text-kf-navy',
  whatsapp: 'bg-kf-wa text-white hover:brightness-95',
  white: 'bg-white text-kf-navy hover:bg-kf-sand',
}
export const Button = ({ variant = 'primary', href, className, children, block, size = 'md', ...rest }) => {
  const cls = cx(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kf-blue disabled:opacity-50 disabled:cursor-not-allowed',
    size === 'sm' ? 'h-10 px-5 text-sm' : 'h-[52px] px-8 text-[15px]',
    block && 'w-full', btnVariants[variant], className)
  return href ? <a href={href} className={cls} {...rest}>{children}</a> : <button className={cls} {...rest}>{children}</button>
}

const badgeTones = {
  neutral: 'bg-kf-sand text-kf-text',
  red: 'bg-kf-red text-white',
  navy: 'bg-kf-navy text-white',
  green: 'bg-emerald-50 text-emerald-700',
  outline: 'border border-kf-ink/15 text-kf-text',
}
export const Badge = ({ tone = 'neutral', className, children }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em]', badgeTones[tone], className)}>{children}</span>
)
export const Tag = ({ children, href, active, className }) => {
  const cls = cx('inline-flex items-center rounded-full border px-5 py-2.5 text-sm transition-colors', active ? 'bg-kf-navy border-kf-navy text-white' : 'border-kf-ink/15 bg-transparent text-kf-text hover:border-kf-navy hover:bg-kf-navy hover:text-white', className)
  return href ? <a href={href} className={cls}>{children}</a> : <span className={cls}>{children}</span>
}

export const Card = ({ className, children, hover = true, ...rest }) => (
  <div className={cx('rounded-[24px] border border-kf-ink/10 bg-white', hover && 'transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-20px_rgba(27,34,96,0.18)]', className)} {...rest}>{children}</div>
)

/** Aparece con fade-up al entrar en viewport (respeta prefers-reduced-motion) */
export const Reveal = ({ children, delay = 0, className, y = 24 }) => {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05, margin: '0px 0px -40px 0px' }} transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  )
}

/** Contenedor con stagger: los hijos `StaggerItem` entran en cascada */
export const Stagger = ({ children, className, gap = 0.08 }) => (
  <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }}
    variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}>{children}</motion.div>
)
export const StaggerItem = ({ children, className, y = 24 }) => {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className}
      variants={reduce ? { hidden: {}, show: {} } : { hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] } } }}>
      {children}
    </motion.div>
  )
}

/** Parallax suave: el contenido se desplaza ±amount px mientras el bloque cruza el viewport */
export const Parallax = ({ children, amount = 40, className }) => {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount])
  return <div ref={ref} className={className}><motion.div style={reduce ? undefined : { y }}>{children}</motion.div></div>
}

/** Número que cuenta hasta `to` al entrar en viewport */
export const Counter = ({ to, prefix = '', suffix = '', duration = 1.6 }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const reduce = useReducedMotion()
  const [v, setV] = useState(reduce ? to : 0)
  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(0, to, { duration, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) })
    return () => c.stop()
  }, [inView, to, duration, reduce])
  return <span ref={ref}>{prefix}{v}{suffix}</span>
}

/** Dato destacado con contador. Props: value, prefix, suffix, label, sub, light */
export const Stat = ({ value, prefix, suffix, label, sub, light, className }) => (
  <div className={cx('border-t pt-6', light ? 'border-white/20' : 'border-kf-ink/15', className)}>
    <p className={cx('font-display text-[56px] font-semibold leading-none tracking-[-0.045em] md:text-[76px]', light ? 'text-white' : 'text-kf-ink')}>
      <Counter to={value} prefix={prefix} suffix={suffix} />
    </p>
    <p className={cx('mt-4 font-mono text-[11px] uppercase tracking-[0.14em]', light ? 'text-white/80' : 'text-kf-ink')}>{label}</p>
    {sub && <p className={cx('mt-1 text-sm', light ? 'text-white/60' : 'text-kf-muted')}>{sub}</p>}
  </div>
)

/** Marco de imagen: radio grande, zoom lento al hover y parallax sutil. Props: src, alt, ratio, radius, parallax, overlay('navy'), position */
export const ImageFrame = ({ src, alt = '', ratio = 'aspect-[4/5]', radius = 'rounded-[28px]', parallax = true, overlay, position = 'object-center', className, children, eager }) => {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%'])
  return (
    <div ref={ref} className={cx('group isolate overflow-hidden bg-kf-sand', className?.includes('absolute') ? '' : 'relative', ratio, radius, className)}>
      <motion.div className="absolute inset-0 scale-[1.12]" style={parallax && !reduce ? { y } : undefined}>
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} className={cx('h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]', position)} />
      </motion.div>
      {overlay === 'navy' && <div className="absolute inset-0 bg-gradient-to-t from-kf-navy-deep/85 via-kf-navy-deep/20 to-transparent" />}
      {overlay === 'navy-left' && <div className="absolute inset-0 bg-gradient-to-r from-kf-navy-deep/90 via-kf-navy-deep/55 to-transparent" />}
      {children}
    </div>
  )
}

/** Hero fotográfico a sangre completa con crossfade + Ken Burns. images: [{src, alt, position, caption}] */
export const FullBleedHero = ({ images, interval = 6500, children, className }) => {
  const [i, setI] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (images.length < 2) return
    const t = setInterval(() => setI(v => (v + 1) % images.length), interval)
    return () => clearInterval(t)
  }, [images.length, interval])
  return (
    <section className={cx('kf-noise relative isolate overflow-hidden bg-kf-navy-deep text-white', className)}>
      <div className="absolute inset-y-0 right-0 w-full lg:w-[76%]">
        <AnimatePresence initial={false}>
          <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
            <img src={images[i].src} alt={images[i].alt} className={cx('h-full w-full object-cover', !reduce && 'animate-kf-kenburns', images[i].position || 'object-center')} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-kf-navy-deep via-kf-navy-deep/85 to-kf-navy-deep/10 lg:via-kf-navy-deep/70 lg:to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-kf-navy-deep via-transparent to-kf-navy-deep/60" />
      <GridPattern className="opacity-60" />
      <div className="relative z-10">{children}</div>
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-10 hidden md:block">
          <Container className="flex items-center justify-start gap-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">{String(i + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}{images[i].caption ? ` — ${images[i].caption}` : ''}</p>
            <div className="flex gap-1.5">
              {images.map((_, k) => <button key={k} type="button" aria-label={`Imagen ${k + 1}`} onClick={() => setI(k)} className={cx('h-[3px] rounded-full transition-all duration-500', k === i ? 'w-10 bg-white' : 'w-5 bg-white/35 hover:bg-white/60')} />)}
            </div>
          </Container>
        </div>
      )}
    </section>
  )
}

/** Split editorial 7/5: imagen grande + texto. Props: image (src o nodo), alt, reverse, ratio, imageClassName */
export const EditorialSplit = ({ image, alt = '', reverse, children, className, ratio = 'aspect-[5/4]', imageClassName, radius, position }) => (
  <div className={cx('grid items-center gap-10 lg:grid-cols-12 lg:gap-20', className)}>
    <Reveal className={cx('lg:col-span-7', reverse ? 'lg:order-2' : '')}>
      {typeof image === 'string'
        ? <ImageFrame src={image} alt={alt} ratio={ratio} radius={radius} position={position} className={imageClassName} />
        : image}
    </Reveal>
    <Reveal delay={0.1} className={cx('lg:col-span-5', reverse ? 'lg:order-1' : '')}>{children}</Reveal>
  </div>
)

/** Bento: grilla de 12 columnas con teselas de distinto tamaño */
export const Bento = ({ children, className }) => <div className={cx('grid grid-cols-12 gap-4 md:gap-5', className)}>{children}</div>
/** Tesela de bento con foto de fondo opcional. Props: span (clases col-span), href, image, position, dark, minH */
export const BentoTile = ({ span = 'col-span-12 md:col-span-4', href, image, position = 'object-center', dark, minH = 'min-h-[320px]', className, children, overlay = true }) => {
  const Tag = href ? 'a' : 'div'
  return (
    <Tag href={href} className={cx('group relative isolate flex overflow-hidden rounded-[28px]', minH, span, dark || image ? 'bg-kf-navy-deep text-white' : 'bg-kf-sand text-kf-ink', className)}>
      {image && <img src={image} alt="" loading="lazy" className={cx('absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]', position)} />}
      {image && overlay && <div className="absolute inset-0 -z-10 bg-gradient-to-t from-kf-navy-deep/90 via-kf-navy-deep/30 to-transparent" />}
      <div className="relative flex w-full flex-col justify-end p-7 md:p-9">{children}</div>
    </Tag>
  )
}

/** Ficha técnica estilo laboratorio. rows: [{k, v, note}] */
export const SpecSheet = ({ title, rows, light, className, compact }) => (
  <div className={cx(className)}>
    {title && <p className={cx('mb-2 font-mono text-[11px] uppercase tracking-[0.16em]', light ? 'text-white/60' : 'text-kf-muted')}>{title}</p>}
    <dl>
      {rows.map(r => (
        <div key={r.k} className={cx('flex items-baseline justify-between gap-6 border-t', compact ? 'py-4' : 'py-5', light ? 'border-white/20' : 'border-kf-ink/15')}>
          <dt className={cx('text-sm md:text-base', light ? 'text-white/80' : 'text-kf-text')}>{r.k}{r.note && <span className={cx('mt-1 block font-mono text-[10px] uppercase tracking-[0.14em]', light ? 'text-white/50' : 'text-kf-muted')}>{r.note}</span>}</dt>
          <dd className={cx('text-right font-display font-semibold tracking-[-0.03em]', compact ? 'text-lg md:text-xl' : 'text-2xl md:text-4xl', light ? 'text-white' : 'text-kf-ink')}>{r.v}</dd>
        </div>
      ))}
      <div className={cx('border-t', light ? 'border-white/20' : 'border-kf-ink/15')} />
    </dl>
  </div>
)

/** Marquee lento (se pausa en hover). `speed` = segundos por vuelta */
export const Marquee = ({ children, speed = 40, reverse, className, itemClassName }) => (
  <div className={cx('kf-marquee-pause overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]', className)}>
    <div className="flex w-max animate-kf-marquee" style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
      {[0, 1].map(k => (
        <div key={k} aria-hidden={k === 1 ? 'true' : undefined} className={cx('flex shrink-0 items-center', itemClassName)}>{children}</div>
      ))}
    </div>
  </div>
)

/** Sellos de confianza */
export const TRUST = [
  { icon: 'shield-check', label: 'DIGEMID', sub: 'Áreas autorizadas' },
  { icon: 'warehouse', label: 'BPA', sub: 'Buenas Prácticas de Almacenamiento' },
  { icon: 'truck', label: 'BPDyT', sub: 'Distribución y Transporte' },
  { icon: 'flask-conical', label: 'Químicos farmacéuticos', sub: 'Dirección técnica' },
  { icon: 'snowflake', label: 'Cadena de frío', sub: '2°C – 8°C' },
]
export const TrustStrip = ({ className, dark }) => (
  <div className={cx('grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-5', className)}>
    {TRUST.map((t, i) => (
      <div key={t.label} className={cx('border-t pt-5', dark ? 'border-white/20 text-white' : 'border-kf-ink/15', i === 4 && 'col-span-2 md:col-span-1')}>
        <p className={cx('font-mono text-[11px] uppercase tracking-[0.14em]', dark ? 'text-white' : 'text-kf-ink')}><span className="mr-2 text-kf-red">0{i + 1}</span>{t.label}</p>
        <p className={cx('mt-2 text-sm leading-snug', dark ? 'text-white/60' : 'text-kf-muted')}>{t.sub}</p>
      </div>
    ))}
  </div>
)

/** Banda CTA navy con grano; `image` opcional como fondo fotográfico */
export const CTABand = ({ eyebrow, title, text, children, image, imagePosition = 'object-center' }) => (
  <section className="kf-noise relative isolate overflow-hidden bg-kf-navy-deep py-24 md:py-32">
    {image && <img src={image} alt="" loading="lazy" className={cx('absolute inset-0 -z-10 h-full w-full object-cover opacity-40', imagePosition)} />}
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-kf-navy-deep/85 via-kf-navy-deep/60 to-kf-navy-deep/30" />
    <GridPattern />
    <Container className="relative flex flex-col items-start gap-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <Eyebrow light>{eyebrow}</Eyebrow>}
        <Heading level={2} size="xl" light>{title}</Heading>
        {text && <p className="mt-6 max-w-xl text-lg text-white/75">{text}</p>}
      </div>
      <div className="flex flex-wrap gap-3">{children}</div>
    </Container>
  </section>
)
