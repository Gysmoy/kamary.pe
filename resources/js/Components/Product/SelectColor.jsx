import React, { useEffect, useState } from "react"
import { Local } from "sode-extend-react"
import Tippy from "@tippyjs/react"
import Aos from "aos"
import BreakdownsRest from "../../actions/BreakdownsRest"
import Number2Currency from "../../Utils/Number2Currency"
import ReactModal from "react-modal"
import AuthModal from "../Auth/AuthModal"
import duoImage from './images/duo.png'
import NewFormulaButton from "./Components/NewFormulaButton"

const breakdownsRest = new BreakdownsRest()

const SelectColor = ({ session, formula, otherFormulas, goToNextPage, goToPrevPage, items = [], defaultColors = {}, setSelectedPlan, planes = [], bundles = [], setSession, recaptchaSiteKey }) => {
  const [cart, setCart] = useState((Local.get('vua_cart') ?? []).filter(item => !!item.formula_id))
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [preCheckoutModalOpen, setPreCheckoutModalOpen] = useState(false)

  useEffect(() => {
    setCart(old => {
      return old.map(item => {
        const colors = items.find(x => x.id == item.id)?.colors ?? []
        const currentColors = item.colors ?? []
        const quantity = item.quantity
        const leftColorsCount = quantity - currentColors.length
        const color2fill = structuredClone(colors).sort((a, b) => defaultColors[item.id] == a.id ? -1 : 1)
        const leftColor = new Array(leftColorsCount > 0 ? leftColorsCount : 0).fill(color2fill?.[0] ?? null)

        if (currentColors.length < quantity) item.colors = [...currentColors, ...leftColor].filter(Boolean)
        else item.colors = currentColors.slice(0, quantity).filter(Boolean)
        return item
      })
    })
  }, [null])

  const onSelectColor = (itemId, colorIndex, color, formula_id_in) => {
    const formula_id = formula_id_in ?? formula?.id
    setCart(old => {
      return old.map(item => {
        if (item.id == itemId && item.formula_id == formula_id) item.colors[colorIndex] = color
        return item
      })
    })
  }

  const onSelectPlan = (plan) => {
    setSelectedPlan(plan)
    breakdownsRest.save({ field: 'selected_color' })
    setPreCheckoutModalOpen(true)
  }

  const onNextClicked = () => {
    breakdownsRest.save({ field: 'selected_plan' })
    goToNextPage()
  }

  useEffect(() => {
    Local.set('vua_cart', cart)
  }, [cart])

  useEffect(() => {
    Aos.init()
  }, [null])

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

  return <section className='px-[3%] lg:px-[10%] py-[10%] md:py-[7.5%] lg:py-[5%] bg-[#F9F3EF] text-center min-h-[540px] text-[#404040]'>

    <div className='max-w-2xl mx-auto '>
      <h1 className="text-2xl font-bold mb-2">¡Ahora selecciona el color!</h1>
      {/* <p className="mb-8 text-sm font-extralight">
        <span>Elije tus colores favoritos para tu rutina</span>
        <img className="w-4 inline-block ms-2" src="/assets/img/emojis/stars.png" alt="Elije tus colores favoritos para tu rutina" />
      </p> */}
    </div>

    <div className="flex flex-wrap justify-center gap-5 mt-5 sm:mt-8 lg:mt-10">
      {
        cart.sort((a, b) => {
          const formula_a = otherFormulas.find(x => x.id == a.formula_id) ?? formula
          const formula_b = otherFormulas.find(x => x.id == b.formula_id) ?? formula
          return formula_a.created_at < formula_b.created_at ? -1 : 1
        }).map((item, i) => {
          const formulaIndex = otherFormulas.findIndex(x => x.id == item.formula_id) + 1
          const itemFormula = otherFormulas.find(x => x.id == item.formula_id) ?? formula
          const colors = items.find(x => x.id == item.id)?.colors ?? []

          if (colors.length == 0) return null
          return item.colors?.map((existence, j) => {
            return <div key={`existence-${i}-${j}`} className="overflow-hidden w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-13.33px)] bg-white rounded-2xl shadow-md" data-aos='fade-down'>
              <div className="flex flex-row gap-2 items-center p-2">
                <div className="">
                  {/* <ItemContainer color={existence.hex} /> */}
                  <img className="h-[120px] aspect-[3/4] object-cover object-center rounded-md" src={`/api/colors/media/${existence?.image}`} alt={item.name} />
                </div>
                <div className="">
                  <div className="flex flex-wrap gap-3 items-end self-stretch my-auto ">
                    <div className="flex flex-col items-start self-stretch">
                      <small className="block font-semibold rounded-full bg-[#C4B8D3] px-3 py-1 text-white">
                        <i className="mdi mdi-flask me-1"></i>
                        {
                          formulaIndex == 0
                            ? 'Fórmula principal'
                            : <>{formulaIndex + 1}<sup>a</sup> fórmula</>
                        }
                      </small>
                      <h2 className="text-lg font-semibold tracking-normal leading-none text-neutral-700 my-4">
                        {item.name} {j + 1}
                      </h2>
                      {/* <p className=" text-sm font-light tracking-normal leading-none text-neutral-700 mb-2">Selecciona tu color:</p> */}
                      <div className="flex gap-x-3 gap-y-2 flex-wrap mb-2">
                        {
                          colors.map((color, index) => {
                            const isSelected = existence?.id == color.id
                            return <Tippy key={index} content={color.name}>
                              <button className={`flex shrink-0 w-8 aspect-square rounded-full border ${isSelected ? 'shadow-md border-[#000000]' : ''}`} style={{
                                backgroundColor: color.hex || '#fff'
                              }} onClick={() => onSelectColor(item.id, j, color, itemFormula.id)} />
                            </Tippy>
                          })
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          })
        }).filter(Boolean)
      }
    </div>


    {
      (planes.length > 0 && otherFormulas.length == 0) &&
      <>
        <div className='max-w-2xl mx-auto mt-[5%]'>
          <h1 className="text-2xl font-bold mb-2">¡Elije la frecuencia de tu pedido!</h1>
        </div>
        <div className="mx-auto flex flex-wrap justify-center gap-4 mt-5 sm:mt-8 lg:mt-10 items-center">

          <div className={`cursor-pointer px-6 py-4 bg-white transition-all rounded-2xl shadow-md h-full w-[270px] hover:bg-[#EFBEC1] hover:text-white peer-checked:bg-[#EFBEC1] peer-checked:text-white group`}
            onClick={() => onSelectPlan(null)}>
            <div className="h-6 mb-2"></div>
            <div className="text-start text-lg mb-4">
              <span className="block font-extralight">Comprar por</span>
              <span className="block font-bold -mt-1">1 sola vez</span>
            </div>
            <div className="text-start text-5xl text-[#C0AFD4] group-hover:text-white font-extrabold tracking-tighter">
              S/{Number2Currency(finalPrice)}
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
                      className={`cursor-pointer px-6 py-4 bg-white transition-all rounded-2xl shadow-md h-full w-[270px] hover:bg-[#EFBEC1] hover:text-white peer-checked:bg-[#EFBEC1] peer-checked:text-white group`}
                      onClick={() => onSelectPlan(plan.id)}
                    >
                      <div className="h-6 mb-2">
                        <div
                          className={`text-nowrap text-xs px-2 py-1 rounded-full w-max text-white bg-[#C0AFD4] group-hover:text-[#EEA9D2] group-hover:bg-white peer-checked:text-[#EEA9D2] peer-checked:bg-white `}
                        >
                          -{plan.percentage * 100}%OFF
                          <img className="w-3 inline-block ms-1" src="/assets/img/emojis/fire.png" alt="-{plan.percentage * 100}%OFF" />
                        </div>
                      </div>
                      <div className="text-start text-lg mb-4">
                        <span className="block">Suscripción</span>
                        <span className="block font-bold -mt-1">Cada {plan.name}</span>
                      </div>
                      <div className="text-start text-5xl text-[#C0AFD4] font-bold group-checked:text-white group-hover:text-white">
                        S/{Number2Currency(price)}
                      </div>
                    </div>
                  })
              }
            </>
          }
        </div>
      </>
    }


    <div className="flex flex-wrap items-center justify-center gap-2 mx-auto md:mx-[12.5%] mt-5 sm:mt-10">
      <button onClick={() => goToPrevPage()} className='bg-[#C5B8D4] text-white text-sm px-16 py-3 rounded mt-4'>
        <i className="mdi mdi-arrow-left me-1"></i>
        VOLVER
      </button>
      {
        (planes.length == 0 || otherFormulas.length > 0) &&
        <button onClick={() => onSelectPlan(null)} className='bg-[#C5B8D4] text-white text-sm px-14 py-3 rounded mt-4'>
          SIGUIENTE
          <i className="mdi mdi-arrow-right ms-1"></i>
        </button>
      }
    </div>

    <AuthModal
      session={session}
      setSession={setSession}
      isOpen={showAuthModal}
      setIsOpen={setShowAuthModal}
      onClose={() => setShowAuthModal(false)}
      recaptchaSiteKey={recaptchaSiteKey}
    />

    {
      preCheckoutModalOpen &&
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => {
        setSelectedPlan(null)
        setPreCheckoutModalOpen(false)
      }}>
        <div className="bg-white rounded-xl w-full max-h-[90vh] max-w-xl overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
          <i className="mdi mdi-close text-2xl absolute top-4 right-4 cursor-pointer" onClick={() => {
            setSelectedPlan(null)
            setPreCheckoutModalOpen(false)
          }}></i>
          <div className="grid grid-cols-2 gap-2 md:gap-6 p-6 md:p-10">
            {/* Columna izquierda: 3 de ancho */}
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-[#404040]">
                Estás a punto de tener tu fórmula única
              </h2>
              <p className="text-base md:text-lg text-gray-600 mb-4">
                Creada solo para ti
              </p>
              <button className="bg-[#C5B8D4] text-white text-xs md:text-base px-2 py-3 rounded" onClick={() => onNextClicked()}>
                TERMINAR MI COMPRA
              </button>
              {
                otherFormulas?.length < 1 &&
                <a href={`/test/${formula.id}`} className={`block w-max mx-auto text-[#9577B9] text-xs md:text-sm mt-6`}>
                  <i className="mdi mdi-plus me-1"></i>
                  CREAR OTRA FÓRMULA
                </a>}
            </div>
            {/* Columna derecha: 2 de ancho */}
            <div className="flex items-center justify-center">
              <img
                className="w-full h-auto rounded-lg object-cover"
                src={duoImage}
                alt="Imagen del producto"
              />
            </div>
          </div>
        </div>
      </div>
    }
  </section>
}

export default SelectColor 