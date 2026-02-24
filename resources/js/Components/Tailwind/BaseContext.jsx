import React, { createContext, useContext, useEffect, useState } from "react"
import Global from "../../Utils/Global";
import { Local } from "sode-extend-react";
import Swal from "sweetalert2";
import CartRest from "../../Actions/cart-rest";
import { Toaster } from "sonner";

const cartRest = new CartRest()

const BaseContext = createContext()

export const BaseProvider = ({ title = 'Página', children, session: sessionDB }) => {
  const [session, setSession] = useState(sessionDB)
  const [cart, setCart] = useState(null)
  const [loadingCart, setLoadingCart] = useState(false)

  document.title = `${title} | ${Global.APP_NAME}`

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev?.find(item => item.id === product.id)
      if (existing) {
        return prev?.map(item =>
          item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        )
      }
      return [...(prev ?? []), { ...product, quantity: 1 }]
    })

    // Show success notification after adding to cart
    Swal.fire({
      title: "¡Agregado!",
      html: `La carta <strong>${product.card.fullname}</strong> de <strong>${product.user.username}</strong> ha sido agregada a tu carrito.`,
      icon: "success",
      button: "Aceptar",
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev?.filter(item => item.id !== productId))
  }

  const cleanCart = () => {
    setCart([])
  }

  const changeQuantity = (item, quantity) => {
    setCart(prev => prev.map(cartItem =>
      cartItem.id === item.id ? { ...cartItem, quantity: Number(quantity) } : cartItem
    ))
  }

  const alreadyInCart = (itemId) => {
    return cart?.some(item => item.id === itemId)
  }

  const verifyItems = async () => {
    const items = Local.get('masterset_cart') ?? []
    setLoadingCart(true)
    const cartVerified = await cartRest.verify(items.map(({ id }) => id))
    setLoadingCart(false)
    setCart(cartVerified.map(item => ({ ...item, quantity: 1 })))
  }

  useEffect(() => {
    if (!cart) return
    Local.set('masterset_cart', cart)
  }, [cart])

  useEffect(() => {
    verifyItems()
  }, [null])

  const cartCount = cart?.reduce((acc, item) => acc + (item.quantity || 1), 0) ?? 0
  const totalAmount = cart?.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0)

  return <BaseContext.Provider value={{
    session, setSession,
    cart, setCart,
    addToCart,
    removeFromCart,
    cleanCart,
    changeQuantity,
    alreadyInCart,
    cartCount,
    totalAmount,
    loadingCart
  }}>
    {children}
    <Toaster />
  </BaseContext.Provider>
}

export const useBase = () => {
  const context = useContext(BaseContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}