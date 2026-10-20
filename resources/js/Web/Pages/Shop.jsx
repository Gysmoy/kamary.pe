import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ChevronRight, MessageCircle, Search, SlidersHorizontal, X } from 'lucide-react'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout from '../components/Layout'
import ProductCard from '../components/ProductCard'
import { Button, Container, Eyebrow, Heading, Icon, ImageFrame, Reveal, Serif, GridPattern, cx } from '../components/ui'
import NotFoundContent from '../components/NotFoundContent'
import site from '../data/site'
import categories from '../data/categories'
import benefits from '../data/benefits'
import products from '../data/products'

const SORTS = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre (A-Z)' },
]

const norm = (s) => `${s ?? ''}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Pesos de la búsqueda: un término que coincide en el nombre vale más que uno en la descripción
const WEIGHTS = { name: 4, brand: 3, presentation: 2, category: 2, short: 1 }
const categoryName = Object.fromEntries(categories.map(c => [c.slug, c.name]))

// Campos normalizados de cada producto, calculados una sola vez
const indexed = products.map(p => ({
  p,
  f: {
    name: norm(p.name),
    brand: norm(p.brand),
    presentation: norm(p.presentation),
    category: norm((p.categories || []).map(s => categoryName[s] || '').join(' ')),
    short: norm(p.shortDescription),
  },
}))

// Puntaje del producto: cada término debe aparecer en algún campo; 0 = no coincide
const scoreOf = (f, terms) => {
  let total = 0
  for (const t of terms) {
    let best = 0
    for (const key of Object.keys(WEIGHTS)) if (f[key].includes(t) && WEIGHTS[key] > best) best = WEIGHTS[key]
    if (!best) return 0
    total += best
  }
  return total
}

// Banner de colección según la categoría
const collectionImage = (slug) => slug === 'colagenos' ? '/web/slider/Colageno-H.-Banner.webp'
  : ['salud-masculina', 'linea-topica-y-deportiva'].includes(slug) ? '/web/slider/Otros-Productos.webp'
  : '/web/slider/Complemento-N.-Banner.webp'

const readParams = () => {
  const q = new URLSearchParams(window.location.search)
  return { buscar: q.get('buscar') || '', beneficio: q.get('beneficio') || '', orden: q.get('orden') || 'relevancia' }
}

/** Panel de filtros (sidebar en desktop y drawer en móvil) */
const Filters = ({ category, buscar, setBuscar, beneficio, setBeneficio, orden, setOrden, catCounts }) => {
  const label = 'font-mono text-[11px] uppercase tracking-[0.12em] text-kf-muted'
  return (
    <div className="space-y-8">
      <div>
        <p className={label}>Buscar</p>
        <div className="relative mt-3">
          <Search size={17} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-kf-muted" />
          <input type="search" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Nombre, marca o presentación"
            className="h-11 w-full border-0 border-b border-kf-ink/20 bg-transparent pl-8 pr-2 text-sm text-kf-ink placeholder:text-kf-muted focus:border-kf-ink focus:outline-none focus:ring-0" />
        </div>
      </div>

      <div>
        <p className={label}>Ordenar por</p>
        <select value={orden} onChange={e => setOrden(e.target.value)} aria-label="Ordenar productos"
          className="mt-3 h-11 w-full border-0 border-b border-kf-ink/20 bg-transparent px-0 text-sm text-kf-ink focus:border-kf-ink focus:outline-none focus:ring-0">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <p className={label}>Categorías</p>
        <ul className="mt-3 border-t border-kf-ink/15">
          <li>
            <a href="/tienda" className={cx('flex items-center justify-between border-b border-kf-ink/15 py-3 text-sm transition-colors', !category ? 'font-semibold text-kf-red' : 'text-kf-text hover:text-kf-navy')}>
              <span>Todos los productos</span>
              <span className="font-mono text-xs text-kf-muted">{products.length}</span>
            </a>
          </li>
          {categories.map(c => (
            <li key={c.slug}>
              <a href={`/categoria-producto/${c.slug}`} aria-current={category === c.slug ? 'page' : undefined}
                className={cx('flex items-center justify-between gap-3 border-b border-kf-ink/15 py-3 text-sm transition-colors', category === c.slug ? 'font-semibold text-kf-red' : 'text-kf-text hover:text-kf-navy')}>
                <span>{c.name}</span>
                <span className="font-mono text-xs text-kf-muted">{catCounts[c.slug] ?? c.count}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className={label}>Beneficios</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {benefits.map(b => {
            const active = beneficio === b.slug
            return (
              <button key={b.slug} type="button" aria-pressed={active} onClick={() => setBeneficio(active ? '' : b.slug)}
                className={cx('rounded-full border px-3.5 py-2 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-kf-blue',
                  active ? 'border-kf-ink bg-kf-ink text-white' : 'border-kf-ink/15 bg-transparent text-kf-text hover:border-kf-ink hover:text-kf-ink')}>
                {b.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const Shop = ({ category = null }) => {
  const cat = category ? categories.find(c => c.slug === category) : null
  const [{ buscar, beneficio, orden }, setState] = useState({ buscar: '', beneficio: '', orden: 'relevancia' })
  const [drawer, setDrawer] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const setBuscar = (v) => setState(s => ({ ...s, buscar: v }))
  const setBeneficio = (v) => setState(s => ({ ...s, beneficio: v }))
  const setOrden = (v) => setState(s => ({ ...s, orden: v }))

  // Lee los parámetros al montar
  useEffect(() => { setState(readParams()); setHydrated(true) }, [])
  // Escribe los parámetros sin recargar
  useEffect(() => {
    if (!hydrated) return
    const q = new URLSearchParams()
    if (buscar) q.set('buscar', buscar)
    if (beneficio) q.set('beneficio', beneficio)
    if (orden && orden !== 'relevancia') q.set('orden', orden)
    const qs = q.toString()
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
  }, [buscar, beneficio, orden, hydrated])
  // Bloquea el scroll con el drawer abierto
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setDrawer(false)
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [drawer])

  const catCounts = useMemo(() => Object.fromEntries(categories.map(c => [c.slug, products.filter(p => p.categories?.includes(c.slug)).length])), [])

  const list = useMemo(() => {
    let r = indexed.filter(({ p }) => !cat || p.categories?.includes(cat.slug))
    if (beneficio) r = r.filter(({ p }) => p.tags?.includes(beneficio))
    const terms = norm(buscar).split(/\s+/).filter(Boolean)
    if (terms.length) r = r.map(it => ({ ...it, score: scoreOf(it.f, terms) })).filter(it => it.score > 0)
    const sorted = [...r]
    if (orden === 'precio-asc') sorted.sort((a, b) => a.p.price - b.p.price)
    else if (orden === 'precio-desc') sorted.sort((a, b) => b.p.price - a.p.price)
    else if (orden === 'nombre') sorted.sort((a, b) => a.p.name.localeCompare(b.p.name, 'es'))
    else if (terms.length) sorted.sort((a, b) => b.score - a.score)
    return sorted.map(it => it.p)
  }, [cat, beneficio, buscar, orden])

  if (category && !cat) return <NotFoundContent />

  const activeCount = (beneficio ? 1 : 0) + (buscar ? 1 : 0)
  const clear = () => setState({ buscar: '', beneficio: '', orden: 'relevancia' })
  const filterProps = { category, buscar, setBuscar, beneficio, setBeneficio, orden, setOrden, catCounts }
  const waText = `Hola Kamary Perú, estoy buscando ${buscar ? `"${buscar}"` : 'un producto'} y no lo encuentro en la tienda. ¿Me pueden ayudar?`
  const waHref = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(waText)}`

  return (
    <>
      {/* Hero editorial con imagen de colección */}
      <section className="kf-noise relative isolate overflow-hidden bg-kf-navy-deep pb-14 pt-10 text-white md:pb-20 md:pt-14">
        {/* Foto de la farmacia a la derecha, fundida con el navy para dar legibilidad */}
        {!cat && (
          <>
            <img src="/web/extra/banners/tienda.webp" alt="" className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover object-[70%_50%] lg:w-[72%]" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-kf-navy-deep via-kf-navy-deep/85 to-kf-navy-deep/30 lg:via-kf-navy-deep/70 lg:to-transparent" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-kf-navy-deep/80 via-transparent to-kf-navy-deep/40" />
          </>
        )}
        <GridPattern />
        <Container className="relative">
          <nav aria-label="Migas de pan" className="mb-10 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">
            <a href="/" className="hover:text-white">Inicio</a><ChevronRight size={12} />
            {cat
              ? <><a href="/tienda" className="hover:text-white">Tienda</a><ChevronRight size={12} /><span className="text-white">{cat.name}</span></>
              : <span className="text-white">Tienda</span>}
          </nav>
          <div className={cx('grid items-end gap-10', cat && 'lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16')}>
            <div className="min-w-0">
              <Eyebrow light n={cat ? '01' : 'KF'}>{cat ? 'Colección' : 'Catálogo Kamary'}</Eyebrow>
              <Heading level={1} size={cat ? "xl" : "display"} light immediate
                lines={cat ? [cat.name] : ['Nuestra', <><Serif className="text-white">tienda</Serif></>]} />
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
                {cat ? cat.description : 'Suplementos, colágenos y productos de cuidado, con respaldo de químicos farmacéuticos y despacho a todo Lima.'}
              </p>
            </div>
            {cat && (
              <ImageFrame src={collectionImage(cat.slug)} alt={`Colección ${cat.name}`} ratio="aspect-[7/8]" radius="rounded-[28px] rounded-tr-[90px]"
                className="hidden w-full max-w-[20rem] justify-self-end lg:block" parallax={false} />
            )}
          </div>
          {!cat && (
            <Reveal className="mt-12 md:mt-16">
              <ImageFrame src="/web/slider/Slider-Collagen-3000.jpg" alt="Collagen 3000 Plus Sticks" ratio="aspect-[1351/352]" radius="rounded-[24px] md:rounded-[32px]" parallax={false} eager />
            </Reveal>
          )}
        </Container>
      </section>

      <section className="bg-kf-canvas"><Container className="py-12 md:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block"><div className="sticky top-28"><Filters {...filterProps} /></div></aside>

          <div className="min-w-0">
            {/* Barra superior */}
            <div className="mb-8 flex items-center justify-between gap-4 border-b border-kf-ink/15 pb-5">
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-kf-muted" aria-live="polite">
                {list.length} {list.length === 1 ? 'producto' : 'productos'}
              </p>
              <div className="flex items-center gap-3">
                {activeCount > 0 && <button type="button" onClick={clear} className="text-sm text-kf-blue hover:underline">Limpiar filtros</button>}
                <button type="button" onClick={() => setDrawer(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-kf-ink/20 px-4 text-sm text-kf-ink hover:border-kf-ink lg:hidden">
                  <SlidersHorizontal size={16} /> Filtros{activeCount > 0 && <span className="rounded-full bg-kf-red px-1.5 text-[11px] text-white">{activeCount}</span>}
                </button>
              </div>
            </div>

            {/* Categorías en móvil: chips con scroll horizontal */}
            <div className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-2 lg:hidden">
              <a href="/tienda" className={cx('shrink-0 rounded-full border px-4 py-2 text-sm', !cat ? 'border-kf-navy bg-kf-navy text-white' : 'border-kf-line bg-white text-kf-text')}>Todos</a>
              {categories.map(c => (
                <a key={c.slug} href={`/categoria-producto/${c.slug}`} className={cx('shrink-0 rounded-full border px-4 py-2 text-sm', cat?.slug === c.slug ? 'border-kf-navy bg-kf-navy text-white' : 'border-kf-line bg-white text-kf-text')}>{c.name}</a>
              ))}
            </div>

            {list.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-7 md:gap-y-16 xl:grid-cols-3 2xl:grid-cols-4">
                {list.map((p, i) => <Reveal key={p.id} delay={Math.min(i % 4, 3) * 0.05} y={12}><ProductCard product={p} /></Reveal>)}
              </div>
            ) : (
              <div className="rounded-[28px] bg-kf-sand px-6 py-16 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-kf-navy"><Search size={24} /></span>
                <Heading level={2} size="md" className="mt-6">No encontramos productos con esos filtros</Heading>
                <p className="mx-auto mt-3 max-w-md text-kf-text">Prueba con otra palabra o quita algún filtro. Si buscas algo en particular, un asesor te ayuda por WhatsApp.</p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button variant="ghost" onClick={clear}>Limpiar filtros</Button>
                  <Button href={waHref} target="_blank" rel="noopener" variant="whatsapp"><MessageCircle size={18} /> Consultar por WhatsApp</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container></section>

      {/* Drawer / bottom sheet móvil */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="absolute inset-0 bg-kf-ink/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[24px] bg-white">
            <div className="flex items-center justify-between border-b border-kf-line px-5 py-4">
              <p className="font-semibold text-kf-ink">Filtros</p>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Cerrar filtros" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-kf-surface"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto px-5 py-6"><Filters {...filterProps} /></div>
            <div className="flex gap-3 border-t border-kf-line p-4">
              <Button variant="ghost" className="flex-1" onClick={clear}>Limpiar</Button>
              <Button className="flex-1" onClick={() => setDrawer(false)}>Ver {list.length} {list.length === 1 ? 'producto' : 'productos'}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Shop

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><Shop {...properties} /></Layout>)
})
