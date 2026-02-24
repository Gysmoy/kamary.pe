import Tippy from "@tippyjs/react"
import { useState, useRef, useEffect } from "react"
import LaravelSession from "../../Utils/LaravelSession"
import AuthRest from "../../Actions/auth-rest"
import { useBase } from "./BaseContext"
import CartContent from "./CartContent"
import Number2Currency from "../../Utils/Number2Currency"

const authRest = new AuthRest()

const Header = ({ hasRole }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const { session, cartCount, totalAmount } = useBase()

  const userDropdownRef = useRef(null)

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isCartOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      <CartContent isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
      <header className="sticky top-0 z-50 w-full bg-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center justify-between h-20 gap-6">
            <a href="/" className="flex-shrink-0">
              <img src='/assets/img/logo.svg' alt="" className="h-8" />
            </a>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                {
                  session
                    ? (
                      <div className="relative" ref={userDropdownRef}>
                        <button
                          onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                          className="flex items-center gap-2"
                        >
                          <img
                            className='w-6 h-6 object-cover object-centerd rounded-full'
                            src={`/storage/images/user/${session?.image}`}
                            alt={session?.fullname}
                            onError={e => e.target.src = `https://ui-avatars.com/api/?name=${session?.name}+${session?.lastname}&color=FFFFFF&background=4C6FFF`} />
                          <i className={`mdi mdi-chevron-down text-xl transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}></i>
                        </button>

                        {/* Desktop User Dropdown */}
                        {isUserDropdownOpen && (
                          <div className="absolute right-0 mt-6 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <ul className="py-2 text-deep">
                              <li>
                                <a href="/profile" className="flex text-sm items-center gap-2 px-4 py-2 hover:bg-gray-100">
                                  <i className="mdi mdi-account-outline "></i>
                                  Mi perfil
                                </a>
                              </li>
                              <li>
                                <a href="/profile" className="flex text-sm items-center gap-2 px-4 py-2 hover:bg-gray-100">
                                  <i className="mdi mdi-account-outline"></i>
                                  Mis pedidos
                                </a>
                              </li>
                              <li className="border-t border-gray-200 my-1 mx-4" />
                              <li>
                                <button
                                  onClick={() => authRest.logout()}
                                  className="flex text-sm items-center gap-2 w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                                >
                                  <i className="mdi mdi-logout text-red-500"></i>
                                  Cerrar sesión
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                    : <Tippy content='Iniciar sesión'>
                      <a href="/login" className="flex items-center relative cursor-pointer rounded-lg transition-colors gap-2">
                        <i className="mdi mdi-account-outline text-2xl"></i>
                      </a>
                    </Tippy>
                }

                <button className="flex items-center relative cursor-pointer rounded-lg transition-colors gap-2">
                  <i className="mdi mdi-heart-outline text-2xl"></i>
                </button>
                <button className="relative flex items-center cursor-pointer rounded-lg transition-colors gap-2" onClick={() => setIsCartOpen(true)}>
                  <i className="mdi mdi-cart-outline text-2xl"></i>
                  {/* {cartCount > 0 && ( */}
                  <span className="absolute -top-2.5 right-0 translate-x-1/2 h-5 min-w-5 px-1.5 bg-primary text-xs rounded-full flex items-center justify-center font-semibold">
                    {cartCount}
                  </span>
                  {/* )} */}
                </button>
              </div>
              <div className="text-sm hidden md:block">
                <span className="block font-medium">Tu carrito</span>
                <span className="block font-bold">S/ {Number2Currency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full bg-secondary z-10 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 uppercase text-sm flex gap-4 whitespace-nowrap scrollbar-hide">
            <a href="/" className="block p-3">Inicio</a>
            <a href="/catalog" className="block p-3">Repuestos</a>
            <a href="/catalog" className="block p-3">Llantas</a>
            <a href="/catalog" className="block p-3">Lubricantes</a>
            <a href="/about" className="block p-3">Nosotros</a>
            <a href="/blog" className="block p-3">Blog</a>
            <a href="/contact" className="block p-3">Contacto</a>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header