import { createRoot } from 'react-dom/client'
import { Info, Minus, Plus, Trash2, MessageCircle, ArrowRight } from 'lucide-react'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout from '../components/Layout'
import ProductCard from '../components/ProductCard'
import { Button, Container, Eyebrow, Heading, Reveal, Section, SectionHead, Serif, money } from '../components/ui'
import { useCart } from '../components/CartContext'
import products from '../data/products'

const Cart = () => {
  const { items, count, total, setQty, remove, clear, checkout, ready } = useCart()
  const ids = items.map(i => i.product.id)
  const suggested = products.filter(p => !ids.includes(p.id)).slice(0, 4)

  if (!ready) return <Container className="py-32" />

  if (items.length === 0) {
    return (
      <>
        <section className="bg-kf-canvas py-24 md:py-32">
          <Container>
            <Reveal className="max-w-3xl">
              <Eyebrow n="01">Carrito</Eyebrow>
              <Heading level={1} size="display" immediate lines={['Tu carrito', <>está <Serif>vacío</Serif></>]} />
              <p className="mt-7 max-w-xl text-lg leading-relaxed">Aún no agregaste productos. Explora la tienda y arma tu pedido; lo finalizas por WhatsApp con un asesor.</p>
              <div className="mt-9"><Button href="/tienda">Ir a la tienda <ArrowRight size={18} /></Button></div>
            </Reveal>
          </Container>
        </section>
        <Section tone="surface">
          <SectionHead n="02" eyebrow="Sugeridos" size="lg" lines={['Productos que te', <>pueden <Serif>interesar</Serif></>]} title={null}
            action={<Button href="/tienda" variant="ghost">Ver toda la tienda</Button>} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-7 lg:grid-cols-4 [&_article>div:first-child]:bg-kf-canvas">
            {suggested.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </Section>
      </>
    )
  }

  return (
    <section className="bg-kf-canvas">
      <Container className="py-14 md:py-20">
        <Eyebrow n="01">Carrito</Eyebrow>
        <div className="flex items-end justify-between gap-4">
          <Heading level={1} size="xl" immediate lines={[<>Tu <Serif>pedido</Serif></>]} />
          <button type="button" onClick={clear} className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-kf-muted hover:text-kf-red">Vaciar carrito</button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-20">
          <ul className="min-w-0 border-t border-kf-ink/15">
            {items.map(({ product: p, qty }, k) => (
              <li key={p.id} className="flex gap-4 border-b border-kf-ink/15 py-7 md:gap-7">
                <a href={`/producto/${p.slug}`} className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-kf-sand md:h-36 md:w-36">
                  <img src={p.image} alt={p.name} className="h-full w-full object-contain p-3 mix-blend-multiply" />
                </a>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-kf-muted"><span className="mr-2 text-kf-red">0{k + 1}</span>{p.brand}</p>
                      <a href={`/producto/${p.slug}`} className="mt-1 block font-display text-lg font-semibold leading-snug tracking-[-0.02em] text-kf-ink hover:text-kf-blue md:text-xl">{p.name}</a>
                      {p.presentation && <p className="mt-0.5 text-sm text-kf-muted">{p.presentation}</p>}
                    </div>
                    <button type="button" onClick={() => remove(p.id)} aria-label={`Quitar ${p.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-kf-muted hover:bg-kf-sand hover:text-kf-red"><Trash2 size={18} /></button>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="inline-flex h-10 items-center rounded-full border border-kf-ink/20 px-1">
                      <button type="button" aria-label="Disminuir cantidad" onClick={() => setQty(p.id, qty - 1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-kf-sand"><Minus size={14} /></button>
                      <span className="w-8 text-center text-sm font-medium text-kf-ink">{qty}</span>
                      <button type="button" aria-label="Aumentar cantidad" onClick={() => setQty(p.id, qty + 1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-kf-sand"><Plus size={14} /></button>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold tracking-[-0.02em] text-kf-ink">{money(p.price * qty)}</p>
                      <p className="font-mono text-[11px] text-kf-muted">{money(p.price)} c/u</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="min-w-0">
            <div className="sticky top-28 rounded-[28px] bg-kf-sand p-7 md:p-9">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-kf-muted">Resumen del pedido</p>
              <dl className="mt-6 text-sm">
                <div className="flex justify-between border-t border-kf-ink/15 py-4"><dt className="text-kf-text">Productos</dt><dd className="font-mono text-kf-ink">{count}</dd></div>
                <div className="flex items-baseline justify-between border-t border-kf-ink/15 pt-5"><dt className="font-semibold text-kf-ink">Total</dt><dd className="font-display text-4xl font-semibold tracking-[-0.04em] text-kf-ink">{money(total)}</dd></div>
              </dl>
              <Button variant="whatsapp" block className="mt-7" onClick={checkout}><MessageCircle size={18} /> Finalizar pedido por WhatsApp</Button>
              <Button href="/tienda" variant="ghost" block className="mt-3">Seguir comprando</Button>
              <p className="mt-6 flex gap-2 border-t border-kf-ink/15 pt-5 text-xs leading-relaxed text-kf-muted"><Info size={14} className="mt-0.5 shrink-0" />Un asesor de Kamary confirmará stock, costo de delivery y forma de pago antes de cerrar tu pedido.</p>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  )
}

export default Cart

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><Cart {...properties} /></Layout>)
})
