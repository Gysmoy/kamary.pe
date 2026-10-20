import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { cx, money } from './ui'
import { useCart } from './CartContext'
import categories from '../data/categories'

/** Producto como objeto de lujo: lienzo arena, mucho aire, agregar discreto con ícono. Props: product, className */
export default function ProductCard({ product, className }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const cat = categories.find(c => product.categories?.includes(c.slug))
  const offer = product.regularPrice && product.regularPrice > product.price
  const href = `/producto/${product.slug}`
  const soldOut = product.inStock === false

  const onAdd = () => {
    add(product.id, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <article className={cx('group flex h-full flex-col', className)}>
      <div className="relative aspect-square overflow-hidden rounded-[24px] bg-kf-sand">
        <a href={href} className="block h-full w-full" aria-label={product.name}>
          <img src={product.image} alt={product.name} loading="lazy"
            className="h-full w-full object-contain p-8 mix-blend-multiply transition-transform duration-[900ms] ease-out group-hover:scale-[1.05] md:p-10" />
        </a>
        {(offer || soldOut) && (
          <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-kf-red">{soldOut ? 'Agotado' : 'Oferta'}</span>
        )}
        {!soldOut && (
          <button type="button" onClick={onAdd} aria-label={`Agregar ${product.name} al carrito`}
            className={cx('absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full shadow-[0_6px_18px_rgba(15,19,31,0.12)] transition-all duration-300 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kf-blue md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100',
              added ? 'bg-emerald-600 text-white' : 'bg-white text-kf-ink hover:bg-kf-ink hover:text-white')}>
            {added ? <Check size={17} /> : <Plus size={18} />}
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-kf-muted">{product.brand || cat?.name}</p>
        <h3 className="mt-1.5 font-display text-[17px] font-semibold leading-snug tracking-[-0.02em] text-kf-ink">
          <a href={href} className="hover:text-kf-blue">{product.name}</a>
        </h3>
        {product.presentation && <p className="mt-1 text-sm text-kf-muted">{product.presentation}</p>}
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-3">
          <span className="font-display text-lg font-semibold tracking-[-0.02em] text-kf-ink">{money(product.price)}</span>
          {offer && <span className="text-sm text-kf-muted line-through">{money(product.regularPrice)}</span>}
        </div>
      </div>
    </article>
  )
}
