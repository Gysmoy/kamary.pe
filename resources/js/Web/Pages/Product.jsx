import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Check, ChevronRight, Minus, Plus, MessageCircle } from 'lucide-react'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout from '../components/Layout'
import ProductCard from '../components/ProductCard'
import { Button, Container, Eyebrow, Heading, Reveal, Section, SectionHead, Serif, SpecSheet, cx, money } from '../components/ui'
import { useCart } from '../components/CartContext'
import NotFoundContent from '../components/NotFoundContent'
import site from '../data/site'
import categories from '../data/categories'
import products from '../data/products'

// Bloque de confianza editorial (datos reales de la empresa)
const TRUST_ITEMS = [
  { k: 'Dirección técnica', v: 'Químicos farmacéuticos', note: 'Asesoría profesional' },
  { k: 'Almacenamiento', v: 'DIGEMID · BPA', note: 'Áreas autorizadas' },
  { k: 'Entrega', v: 'Delivery en Lima', note: 'Un asesor confirma stock y tiempo de entrega' },
]

const Detail = ({ product }) => {
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [added, setAdded] = useState(false)

  const gallery = product.gallery?.length ? product.gallery : [product.image]
  const offer = product.regularPrice && product.regularPrice > product.price
  const cats = categories.filter(c => product.categories?.includes(c.slug))
  const related = products.filter(p => p.id !== product.id && p.categories?.some(c => product.categories?.includes(c))).slice(0, 4)
  const paragraphs = `${product.description || ''}`.split(/\n+/).map(s => s.trim()).filter(Boolean)
  const waText = `Hola Kamary Perú, quiero consultar por ${product.name}${product.presentation ? ` (${product.presentation})` : ''}.`
  const waHref = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(waText)}`
  const inStock = product.inStock !== false

  const specs = [
    product.brand && { k: 'Marca', v: product.brand },
    product.presentation && { k: 'Presentación', v: product.presentation },
    cats.length > 0 && { k: 'Categoría', v: cats.map(c => c.name).join(', ') },
    { k: 'Disponibilidad', v: inStock ? 'Disponible' : 'Sin stock', note: inStock ? 'Stock sujeto a confirmación' : undefined },
  ].filter(Boolean)

  const onAdd = () => {
    add(product.id, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <>
      <Container className="pt-8 md:pt-10">
        <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-kf-muted">
          <a href="/" className="hover:text-kf-ink">Inicio</a><ChevronRight size={12} />
          <a href="/tienda" className="hover:text-kf-ink">Tienda</a><ChevronRight size={12} />
          {cats[0] && <><a href={`/categoria-producto/${cats[0].slug}`} className="hover:text-kf-ink">{cats[0].name}</a><ChevronRight size={12} /></>}
          <span className="text-kf-ink">{product.name}</span>
        </nav>
      </Container>

      <Container className="py-8 md:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-20">
          {/* Galería sobre canvas beige */}
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[28px] bg-kf-sand md:rounded-[36px]">
              <img src={gallery[active]} alt={product.name} className="h-full w-full object-contain p-10 mix-blend-multiply md:p-16" />
              {offer && <span className="absolute left-6 top-6 font-mono text-[11px] uppercase tracking-[0.16em] text-kf-red">Oferta</span>}
              {gallery.length > 1 && <span className="absolute bottom-6 right-6 font-mono text-[11px] tracking-[0.14em] text-kf-muted">{String(active + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}</span>}
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {gallery.map((src, i) => (
                  <button key={src} type="button" onClick={() => setActive(i)} aria-label={`Ver imagen ${i + 1}`} aria-current={i === active}
                    className={cx('h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-kf-sand transition-colors', i === active ? 'border-kf-ink' : 'border-transparent hover:border-kf-ink/30')}>
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-contain p-2 mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información */}
          <div className="min-w-0 lg:py-6">
            {product.brand && <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-kf-muted">{product.brand}</p>}
            <Heading level={1} size="xl">{product.name}</Heading>
            {product.shortDescription && <p className="mt-5 text-lg leading-relaxed text-kf-text">{product.shortDescription}</p>}

            <div className="mt-8 flex flex-wrap items-baseline gap-4">
              <span className="font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-kf-ink">{money(product.price)}</span>
              {offer && <span className="text-lg text-kf-muted line-through">{money(product.regularPrice)}</span>}
              {offer && <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-kf-red">Ahorras {money(product.regularPrice - product.price)}</span>}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-kf-ink/15 pt-8 sm:flex-row">
              <div className="inline-flex h-[52px] items-center justify-between rounded-full border border-kf-ink/20 px-2 sm:w-36">
                <button type="button" aria-label="Disminuir cantidad" onClick={() => setQty(q => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-kf-sand"><Minus size={16} /></button>
                <span className="w-8 text-center font-medium text-kf-ink" aria-live="polite">{qty}</span>
                <button type="button" aria-label="Aumentar cantidad" onClick={() => setQty(q => q + 1)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-kf-sand"><Plus size={16} /></button>
              </div>
              <Button onClick={onAdd} disabled={!inStock} className={cx('flex-1', added && '!bg-emerald-600')}>
                {added ? <><Check size={18} /> Agregado al carrito</> : <><Plus size={18} /> Agregar al carrito</>}
              </Button>
            </div>
            <Button href={waHref} target="_blank" rel="noopener" variant="ghost" block className="mt-3"><MessageCircle size={18} /> Consultar por WhatsApp</Button>
            {added && <p className="mt-3 text-sm text-kf-text">Listo. <a href="/carrito" className="font-medium text-kf-blue hover:underline">Ver carrito</a></p>}

            <SpecSheet title="Ficha del producto" className="mt-12" rows={specs} compact />
          </div>
        </div>

        {paragraphs.length > 0 && (
          <div className="mt-20 grid gap-8 border-t border-kf-ink/15 pt-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
            <Eyebrow n="01">Descripción</Eyebrow>
            <div className="max-w-3xl space-y-4 text-base leading-relaxed text-kf-text md:text-lg">
              {paragraphs.map((t, i) => <p key={i} className={i === 0 && paragraphs.length > 1 && t.length < 60 ? 'font-semibold text-kf-ink' : ''}>{t}</p>)}
            </div>
          </div>
        )}
      </Container>

      {/* Confianza editorial */}
      <Section tone="navy" className="!py-16 md:!py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <Reveal>
            <Eyebrow light n="02">Respaldo Kamary</Eyebrow>
            <Heading size="lg" light>Un producto con <Serif className="text-white">respaldo</Serif> farmacéutico</Heading>
          </Reveal>
          <Reveal delay={0.1}>
            <dl>
              {TRUST_ITEMS.map(t => (
                <div key={t.k} className="flex flex-col gap-1 border-t border-white/20 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">{t.k}</dt>
                  <dd className="sm:text-right"><span className="font-display text-xl font-semibold tracking-[-0.02em] md:text-2xl">{t.v}</span><span className="block text-sm text-white/60">{t.note}</span></dd>
                </div>
              ))}
              <div className="border-t border-white/20" />
            </dl>
          </Reveal>
        </div>
      </Section>

      {related.length > 0 && (
        <Section tone="canvas">
          <SectionHead n="03" eyebrow="Te puede interesar" size="lg" lines={['Productos', <><Serif>relacionados</Serif></>]} title={null}
            action={<Button href="/tienda" variant="ghost">Ver toda la tienda</Button>} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-7 lg:grid-cols-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </Section>
      )}
    </>
  )
}

const Product = ({ slug }) => {
  const product = products.find(p => p.slug === slug)
  return product ? <Detail product={product} /> : <NotFoundContent />
}

export default Product

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><Product {...properties} /></Layout>)
})
