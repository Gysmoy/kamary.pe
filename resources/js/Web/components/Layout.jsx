import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Facebook, Instagram, Lock, MapPin, Menu, Phone, Search, ShoppingBag, X, MessageCircle, BookOpen } from 'lucide-react'
import site from '../data/site'
import categories from '../data/categories'
import products from '../data/products'
import { CartProvider, useCart } from './CartContext'
import { Button, Container, Icon, Marquee, cx, money } from './ui'

const NAV = [
  { label: 'Inicio', href: '/' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Tienda', href: '/tienda', mega: true },
  { label: 'Preparados Magistrales', href: '/preparados-magistrales' },
  { label: 'Ventas Corporativas', href: '/ventas-corporativas' },
  { label: 'Operador logístico', href: '/operador-logistico' },
  { label: 'Contacto', href: '/contacto' },
]

const tel = (s) => `tel:+51${`${s}`.replace(/\D/g, '').replace(/^0?1/, '1')}`
const norm = (s) => `${s ?? ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const isActive = (href) => {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname.replace(/\/$/, '') || '/'
  return href === '/' ? p === '/' : p === href || p.startsWith(href + '/') || (href === '/tienda' && p.startsWith('/categoria-producto'))
}

/* ---------- TopBar ---------- */
const TopBar = ({ clear }) => (
  <div className={cx('hidden text-white transition-colors md:block', clear ? 'border-b border-white/10 bg-transparent' : 'bg-kf-navy-deep')}>
    <Container className="flex h-10 items-center justify-between text-xs">
      <p className="text-white/80">{site.tagline}</p>
      <div className="flex items-center gap-6 font-mono tracking-wide">
        <a href={tel(site.phones.central)} className="flex items-center gap-1.5 hover:text-white/80"><Phone size={12} /> {site.phones.central}</a>
        <a href={tel(site.phones.ventas)} className="hover:text-white/80">{site.phones.ventas}</a>
        <span className="hidden items-center gap-3 border-l border-white/20 pl-6 lg:flex text-[11px] uppercase tracking-[0.12em] text-white/70">
          <span>DIGEMID</span><span>BPA</span><span>BPDyT</span>
        </span>
      </div>
    </Container>
  </div>
)

/* ---------- Buscador instantáneo ---------- */
export const ProductSearch = ({ className, autoFocus, onPick, large }) => {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const results = useMemo(() => {
    const t = norm(q).trim()
    if (t.length < 2) return []
    return products.filter(p => norm(`${p.name} ${p.brand} ${p.presentation}`).includes(t)).slice(0, 6)
  }, [q])

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const submit = (e) => { e.preventDefault(); if (q.trim()) window.location.href = `/tienda?buscar=${encodeURIComponent(q.trim())}` }

  return (
    <div ref={box} className={cx('relative', className)}>
      <form onSubmit={submit} role="search">
        <label className="sr-only" htmlFor={large ? 'kf-search-lg' : 'kf-search'}>Buscar productos</label>
        <Search size={large ? 20 : 17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-kf-muted" />
        <input id={large ? 'kf-search-lg' : 'kf-search'} value={q} autoFocus={autoFocus} autoComplete="off"
          onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
          placeholder="Buscar productos, marcas…"
          className={cx('w-full rounded-full border border-kf-line bg-white pl-11 pr-4 text-kf-ink placeholder:text-kf-muted focus:border-kf-navy focus:outline-none focus:ring-2 focus:ring-kf-navy/15', large ? 'h-14 text-base' : 'h-10 text-sm')} />
      </form>
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-kf-line bg-white shadow-[0_8px_30px_rgba(15,19,31,0.10)]">
          {results.length ? results.map(p => (
            <a key={p.id} href={`/producto/${p.slug}`} onClick={onPick} className="flex items-center gap-3 px-4 py-3 hover:bg-kf-surface">
              <img src={p.image} alt="" loading="lazy" decoding="async" className="h-11 w-11 rounded-lg bg-kf-surface object-contain p-1" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-kf-ink">{p.name}</span>
                <span className="block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-kf-muted">{p.brand}</span>
              </span>
              <span className="text-sm font-semibold text-kf-ink">{money(p.price)}</span>
            </a>
          )) : <p className="px-4 py-4 text-sm text-kf-muted">Sin resultados para “{q}”.</p>}
          {results.length > 0 && <a href={`/tienda?buscar=${encodeURIComponent(q.trim())}`} className="block border-t border-kf-line px-4 py-3 text-center text-sm font-medium text-kf-blue hover:bg-kf-surface">Ver todos los resultados</a>}
        </div>
      )}
    </div>
  )
}

/* ---------- Mega-menú de Tienda con colecciones fotográficas ---------- */
const COLLECTIONS = [
  { name: 'Colágenos', href: '/categoria-producto/colagenos', image: '/web/slider/Colageno-H.-Banner.webp' },
  { name: 'Complemento nutricional', href: '/tienda', image: '/web/slider/Complemento-N.-Banner.webp' },
  { name: 'Productos farmacéuticos', href: '/tienda', image: '/web/slider/Otros-Productos.webp' },
]
const MegaMenu = ({ onClose }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }}
    className="absolute left-0 right-0 top-full z-40 border-b border-kf-ink/10 bg-kf-canvas shadow-[0_24px_60px_-24px_rgba(15,19,31,0.25)]">
    <Container className="grid grid-cols-[1fr_520px] gap-12 py-10">
      <div>
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-kf-muted">Categorías</p>
        <div className="grid grid-cols-2 gap-x-8">
          {categories.map((c, k) => (
            <a key={c.slug} href={`/categoria-producto/${c.slug}`} onClick={onClose} className="group flex items-baseline gap-4 border-t border-kf-ink/10 py-3.5">
              <span className="font-mono text-[11px] text-kf-red">0{k + 1}</span>
              <span className="text-[15px] font-medium text-kf-ink transition-transform group-hover:translate-x-1">{c.name}</span>
            </a>
          ))}
        </div>
        <a href="/tienda" onClick={onClose} className="mt-6 inline-flex h-10 items-center rounded-full bg-kf-ink px-5 text-sm font-medium text-white hover:bg-kf-navy">Ver toda la tienda</a>
      </div>
      <div>
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-kf-muted">Colecciones</p>
        <div className="grid grid-cols-3 gap-3">
          {COLLECTIONS.map(c => (
            <a key={c.name} href={c.href} onClick={onClose} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl">
              <img src={c.image} alt={c.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-kf-navy-deep/90 to-transparent p-3 pt-10 font-mono text-[10px] uppercase tracking-[0.12em] text-white">{c.name}</span>
            </a>
          ))}
        </div>
      </div>
    </Container>
  </motion.div>
)

/* ---------- Header: transparente sobre el hero de la Home, sólido al hacer scroll ---------- */
const Header = ({ overlay }) => {
  const { count } = useCart()
  const [mega, setMega] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => { document.body.style.overflow = drawer ? 'hidden' : '' }, [drawer])

  const openMega = () => { clearTimeout(timer.current); setMega(true) }
  const closeMega = () => { timer.current = setTimeout(() => setMega(false), 120) }

  // Transparente solo si es página con hero a sangre, sin scroll y sin mega-menú abierto
  const clear = overlay && !scrolled && !mega
  const txt = clear ? 'text-white' : 'text-kf-ink'

  return (
    <header className={cx('top-0 z-50 w-full transition-all duration-500', overlay ? 'fixed inset-x-0' : 'sticky',
      clear ? 'border-b border-white/10 bg-transparent' : 'border-b border-kf-ink/10 bg-kf-canvas/90 backdrop-blur-xl', scrolled && 'shadow-[0_8px_30px_rgba(15,19,31,0.06)]')}>
      {!scrolled && <TopBar clear={clear} />}
      <div className="relative" onMouseLeave={closeMega}>
        <Container className="flex h-[72px] items-center gap-4 lg:gap-6">
          <button type="button" className={cx('-ml-2 p-2 xl:hidden', txt)} onClick={() => setDrawer(true)} aria-label="Abrir menú" aria-expanded={drawer} aria-controls="kf-drawer"><Menu size={24} /></button>
          <a href="/" className="shrink-0" aria-label="Farmacia Kamary Perú - Inicio">
            <img src={clear ? site.logoWhite : site.logo} alt={site.name} className="h-9 w-auto md:h-11" />
          </a>
          <nav className="ml-4 hidden items-center gap-0 xl:flex" aria-label="Principal">
            {NAV.map(n => n.mega ? (
              <div key={n.label} onMouseEnter={openMega} onFocus={openMega}>
                <a href={n.href} className={cx('flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium hover:text-kf-red', isActive(n.href) ? (clear ? 'text-white underline decoration-kf-red decoration-2 underline-offset-[10px]' : 'text-kf-red') : txt)}>
                  {n.label} <ChevronDown size={14} className={cx('transition-transform', mega && 'rotate-180')} />
                </a>
              </div>
            ) : (
              <a key={n.label} href={n.href} onMouseEnter={closeMega} className={cx('whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium hover:text-kf-red', isActive(n.href) ? (clear ? 'text-white underline decoration-kf-red decoration-2 underline-offset-[10px]' : 'text-kf-red') : txt)}>{n.label}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ProductSearch className="hidden w-48 2xl:block 2xl:w-64" />
            <a href="/login" className={cx('hidden items-center gap-1.5 text-xs font-medium hover:opacity-100 xl:flex', clear ? 'text-white/70' : 'text-kf-muted hover:text-kf-ink')}><Lock size={13} /> Intranet</a>
            <a href="/carrito" className={cx('relative flex h-11 w-11 items-center justify-center rounded-full border transition-colors', clear ? 'border-white/30 text-white hover:bg-white hover:text-kf-navy' : 'border-kf-ink/15 text-kf-ink hover:border-kf-ink')} aria-label={`Carrito, ${count} productos`}>
              <ShoppingBag size={19} />
              {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-kf-red px-1 font-mono text-[10px] font-medium text-white">{count}</span>}
            </a>
          </div>
        </Container>
        <AnimatePresence>{mega && <div onMouseEnter={openMega}><MegaMenu onClose={() => setMega(false)} /></div>}</AnimatePresence>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-kf-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.aside id="kf-drawer" role="dialog" aria-label="Menú" className="fixed inset-y-0 left-0 z-[70] flex w-[86%] max-w-sm flex-col overflow-y-auto bg-kf-canvas p-5 text-kf-ink" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.25 }}>
              <div className="mb-5 flex items-center justify-between">
                <img src={site.logo} alt={site.name} className="h-9 w-auto" />
                <button type="button" onClick={() => setDrawer(false)} aria-label="Cerrar menú" className="p-2"><X size={22} /></button>
              </div>
              <ProductSearch onPick={() => setDrawer(false)} />
              <nav className="mt-5 flex flex-col" aria-label="Móvil">
                {NAV.map(n => <a key={n.label} href={n.href} className={cx('border-b border-kf-ink/10 py-3.5 text-base font-medium', isActive(n.href) ? 'text-kf-red' : 'text-kf-ink')}>{n.label}</a>)}
              </nav>
              <p className="mb-2 mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-kf-muted">Categorías</p>
              <div className="flex flex-col">
                {categories.map(c => <a key={c.slug} href={`/categoria-producto/${c.slug}`} className="flex items-center gap-3 py-2.5 text-sm text-kf-text"><Icon name={c.icon} size={18} className="text-kf-navy" />{c.name}</a>)}
              </div>
              <div className="mt-auto pt-8">
                <Button variant="whatsapp" block href={`https://wa.me/${site.whatsapp.number}`}><MessageCircle size={18} /> Asesoría por WhatsApp</Button>
                <a href="/login" className="mt-4 flex items-center justify-center gap-1.5 text-xs text-kf-muted"><Lock size={13} /> Intranet</a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

/* ---------- Footer editorial ---------- */
const FooterCol = ({ title, children }) => (
  <div>
    <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">{title}</p>
    <ul className="space-y-3 text-sm">{children}</ul>
  </div>
)
const FL = ({ href, children }) => <li><a href={href} className="text-white/80 transition-colors hover:text-white">{children}</a></li>

const CERT_MARQUEE = ['DIGEMID', 'Buenas Prácticas de Almacenamiento', 'BPDyT', 'Cadena de frío 2°C – 8°C', 'Dirección técnica de químicos farmacéuticos', 'Productos con registro sanitario']

const Footer = () => {
  const social = { facebook: Facebook, instagram: Instagram }
  return (
    <footer className="kf-noise relative isolate overflow-hidden bg-kf-ink text-white">
      {/* Marquee de certificaciones */}
      <div className="border-b border-white/10 py-6">
        <Marquee speed={50}>
          {CERT_MARQUEE.map(c => (
            <span key={c} className="flex items-center gap-8 pr-8 font-mono text-xs uppercase tracking-[0.18em] text-white/70">{c}<span className="h-1.5 w-1.5 rounded-full bg-kf-red" /></span>
          ))}
        </Marquee>
      </div>
      <Container className="relative pb-10 pt-20 md:pt-28">
        <p className="max-w-4xl font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] md:text-6xl lg:text-7xl">
          Productos farmacéuticos y cosméticos, <em className="font-serif text-[1.1em] font-normal italic leading-[0.9] text-white/60">de primera calidad.</em>
        </p>
        <div className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <img src={site.logoWhite} alt={site.name} loading="lazy" decoding="async" className="h-11 w-auto" />
            <div className="mt-6 flex gap-2">
              {(site.socials || []).map(s => {
                const I = social[`${s.name}`.toLowerCase()] || MessageCircle
                return <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white hover:text-kf-ink"><I size={17} /></a>
              })}
            </div>
            <a href="/libro-de-reclamaciones" className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/20 px-5 py-3 text-sm transition-colors hover:bg-white/5">
              <BookOpen size={22} className="text-white" />
              <span><span className="block font-medium">Libro de Reclamaciones</span><span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">Hoja de reclamación virtual</span></span>
            </a>
          </div>
          <FooterCol title="Nuestra empresa">
            <FL href="/nosotros">Nosotros</FL><FL href="/contacto">Contacto</FL><FL href="/politicas-de-privacidad">Políticas de privacidad</FL><FL href="/login">Intranet</FL>
          </FooterCol>
          <FooterCol title="Enlaces de interés">
            <FL href="/tienda">Tienda</FL><FL href="/preparados-magistrales">Preparados magistrales</FL><FL href="/ventas-corporativas">Ventas corporativas</FL><FL href="/operador-logistico">Operador logístico</FL>
          </FooterCol>
          <FooterCol title="Sede central">
            <li className="flex gap-2 text-white/80"><MapPin size={16} className="mt-0.5 shrink-0" /><a href={site.address?.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">{site.address?.line}{site.address?.city ? `, ${site.address.city}` : ''}</a></li>
            <li className="flex gap-2 font-mono text-[13px] text-white/80"><Phone size={16} className="mt-0.5 shrink-0" /><span>{site.phones.central} · {site.phones.ventas}</span></li>
            <li className="text-white/80">{site.emails?.ventas}</li>
          </FooterCol>
        </div>

        {/* Wordmark gigante */}
        <p aria-hidden="true" className="pointer-events-none mt-16 select-none overflow-hidden text-center font-display text-[26vw] font-semibold leading-[0.8] tracking-[-0.06em] text-white/[0.06] md:text-[19vw]">Kamary</p>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Farmacia Kamary Perú. Todos los derechos reservados.</p>
          <p className="font-mono uppercase tracking-[0.12em]">Productos con registro sanitario · Dirección técnica de químicos farmacéuticos</p>
        </div>
      </Container>
    </footer>
  )
}

/* ---------- WhatsApp flotante ---------- */
export const WhatsAppFloat = () => (
  <a href={`https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent('Hola Kamary Perú, requiero más información.')}`} target="_blank" rel="noopener noreferrer"
    aria-label="Asesoría por WhatsApp"
    className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-kf-wa px-4 text-white shadow-[0_8px_30px_rgba(37,211,102,0.35)] transition-transform hover:scale-105 md:px-5">
    <MessageCircle size={24} />
    <span className="hidden text-sm font-medium md:inline">Asesoría por WhatsApp</span>
  </a>
)

/** Layout público: envuelve cada página con header, footer, carrito y WhatsApp */
export default function Layout({ children }) {
  // La Home tiene hero fotográfico a sangre: el header va transparente encima
  const overlay = typeof window !== 'undefined' && (window.location.pathname.replace(/\/$/, '') || '/') === '/'
  return (
    <CartProvider>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">Saltar al contenido</a>
      <Header overlay={overlay} />
      <main id="contenido">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </CartProvider>
  )
}
export { Layout, Header, Footer, TopBar }
