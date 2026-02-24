import React, { useEffect, useState } from "react"
import { Local } from "sode-extend-react"
import Number2Currency from "../../Utils/Number2Currency";
import AuthModal from '../Auth/AuthModal'
import BreakdownsRest from "../../actions/BreakdownsRest";

const breakdownsRest = new BreakdownsRest()

const SelectPlan = ({ otherFormulas, goToNextPage, goToPrevPage, setSelectedPlan, bundles = [], planes = [], session, setSession, recaptchaSiteKey }) => {
  const [showAuthModal, setShowAuthModal] = useState(false)

  const cart = Local.get('vua_cart') ?? []

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)

  const restBundles = bundles.filter(x => {
    switch (x.comparator) {
      case '<':
        return totalQuantity < x.items_quantity
      case '>':
        return totalQuantity > x.items_quantity
      default:
        return totalQuantity == x.items_quantity
    }
  }).sort((a, b) => b.percentage - a.percentage)
  const bundle = restBundles?.[0] ?? null

  const finalPrice = Math.round((totalPrice * (1 - (bundle?.percentage || 0))) * 10) / 10

  const onSelectPlan = (plan) => {
    setSelectedPlan(plan)
    breakdownsRest.save({ field: 'selected_plan' })
    goToNextPage()
  }

  useEffect(() => {
    if (otherFormulas.length > 0) onSelectPlan(null)
  }, [null])

  useEffect(() => {
    if (session?.id) setShowAuthModal(false)
  }, [session])

  return <section className='px-[3%] lg:px-[10%] py-[10%] md:py-[7.5%] lg:py-[5%] bg-[#F9F3EF] text-center'>

    <div className='max-w-2xl mx-auto '>
      <h1 className="text-2xl font-bold mb-2">¡Elije la frecuencia de tu pedido!</h1>
      <p className="mb-8 text-sm font-extralight">Conoce de qué manera puedes ahorrar en tu rutina</p>
    </div>

    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 sm:mt-8 lg:mt-10 items-center justify-center">

      <div className={`transition-all cursor-pointer p-6 bg-white group hover:bg-[#EFBEC1] hover:text-white rounded-2xl grid grid-cols-2 items-center justify-between gap-4 shadow-md h-full`}
        onClick={() => onSelectPlan(null)}>
        <div className="text-start">
          <span className="block font-extralight">Comprar por</span>
          <span className="block font-bold mb-2 -mt-1 text-[#303030]">1 sola vez</span>
        </div>
        <div className="flex flex-col gap-2 text-end">
          <span className="ms-auto text-4xl text-[#C0AFD4] group-hover:text-white font-extrabold tracking-tighter">
            S/{Number2Currency(finalPrice)}
          </span>
        </div>
      </div>
      {
        otherFormulas.length == 0 && <>
          {
            (!session?.id && planes.length > 0) ?
              <div className="p-4 text-center flex flex-col gap-2 items-center">
                <span>
                  o inicia sesion para acceder a <br />
                  <b>planes de suscripcion</b>
                </span>
                <button onClick={() => setShowAuthModal(true)}
                  className="block rounded-full px-3 py-2 bg-[#A191B8] text-white text-sm uppercase">
                  Iniciar sesion
                </button>
              </div>
              : planes.sort((a, b) => b.percentage - a.percentage).map((plan, index) => {
                const price = Math.round((finalPrice - (finalPrice * plan.percentage)) * 10) / 10
                return <div key={index}
                  className={`cursor-pointer p-6 bg-white transition-all rounded-2xl grid grid-cols-2 items-center justify-between gap-4 shadow-md h-full hover:bg-[#EFBEC1] hover:text-white peer-checked:bg-[#EFBEC1] peer-checked:text-white group`}
                  onClick={() => onSelectPlan(plan.id)}
                >
                  <div className="text-start">
                    <span className="block">Suscripción</span>
                    <span className="block font-bold mb-2 -mt-1">Cada {plan.name}</span>
                    <div
                      className={`border border-[#404040] text-xs px-2 py-1 rounded-full w-max  group-hover:border-white peer-checked:border-white `}
                    >
                      + Envío gratis Lima Met.
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-end">
                    <span
                      className={`ms-auto text-nowrap text-xs px-2 py-1 rounded-full w-max text-white bg-[#C0AFD4] group-hover:text-[#EEA9D2] group-hover:bg-white peer-checked:text-[#EEA9D2] peer-checked:bg-white `}
                    >
                      -{plan.percentage * 100}%OFF
                      <img className="w-3 inline-block ms-1" src="/assets/img/emojis/fire.png" alt="-{plan.percentage * 100}%OFF" />
                    </span>
                    <span className="ms-auto text-4xl text-[#C0AFD4] font-bold group-checked:text-white group-hover:text-white">
                      S/{Number2Currency(price)}
                    </span>
                  </div>
                </div>
              })
          }
        </>
      }
    </div>

    <div className="flex flex-wrap items-center justify-center gap-2 mx-auto md:mx-[12.5%] mt-5 sm:mt-10">
      <button onClick={() => goToPrevPage()} className='bg-[#C5B8D4] text-white text-sm px-16 py-3 rounded mt-4'>
        <i className="mdi mdi-arrow-left me-1"></i>
        VOLVER
      </button>
    </div>

    <AuthModal
      session={session}
      setSession={setSession}
      isOpen={showAuthModal}
      setIsOpen={setShowAuthModal}
      onClose={() => setShowAuthModal(false)}
      recaptchaSiteKey={recaptchaSiteKey}
    />
  </section>
}

export default SelectPlan
