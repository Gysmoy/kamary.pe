import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import products from '../data/products'
import site from '../data/site'
import { money } from './ui'

const KEY = 'kf_cart_v1'
const CartContext = createContext(null)

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch (e) { return [] }
}

/** Carrito en localStorage: guarda solo {id, qty} y resuelve el producto desde products.js */
export const CartProvider = ({ children }) => {
  const [lines, setLines] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => { setLines(read()); setReady(true) }, [])
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(KEY, JSON.stringify(lines)) } catch (e) { /* sin storage */ }
  }, [lines, ready])
  // Sincroniza entre pestañas
  useEffect(() => {
    const onStorage = (e) => { if (e.key === KEY) setLines(read()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((id, qty = 1) => setLines(prev => {
    const found = prev.find(l => l.id === id)
    return found ? prev.map(l => l.id === id ? { ...l, qty: l.qty + qty } : l) : [...prev, { id, qty }]
  }), [])
  const remove = useCallback((id) => setLines(prev => prev.filter(l => l.id !== id)), [])
  const setQty = useCallback((id, qty) => setLines(prev => qty <= 0 ? prev.filter(l => l.id !== id) : prev.map(l => l.id === id ? { ...l, qty } : l)), [])
  const clear = useCallback(() => setLines([]), [])

  const items = useMemo(() => lines
    .map(l => ({ ...l, product: products.find(p => p.id === l.id) }))
    .filter(l => l.product), [lines])
  const count = items.reduce((s, l) => s + l.qty, 0)
  const total = items.reduce((s, l) => s + l.qty * l.product.price, 0)

  /** Mensaje de pedido para WhatsApp */
  const checkoutUrl = useCallback(() => {
    const detail = items.map(l => `• ${l.qty} x ${l.product.name} (${money(l.product.price)} c/u)`).join('\n')
    const msg = `Hola Kamary Perú, quiero hacer el siguiente pedido:\n\n${detail}\n\nTotal: ${money(total)}\n\nQuedo atento a la confirmación de stock, envío y forma de pago.`
    return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(msg)}`
  }, [items, total])
  const checkout = useCallback(() => { window.open(checkoutUrl(), '_blank', 'noopener') }, [checkoutUrl])

  const value = { items, count, total, add, remove, setQty, clear, checkoutUrl, checkout, ready }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider (Layout lo incluye)')
  return ctx
}
export default CartContext
