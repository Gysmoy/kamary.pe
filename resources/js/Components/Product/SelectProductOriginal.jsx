import React, { useEffect, useState } from "react"
import Number2Currency from "../../Utils/Number2Currency";
import { Local } from "sode-extend-react";
import Aos from "aos";
import NewFormulaButton from "./Components/NewFormulaButton";
import Tippy from "@tippyjs/react";
import UserFormulasRest from "../../Actions/UserFormulasRest";
import Swal from "sweetalert2";
import BreakdownsRest from "../../actions/BreakdownsRest";

const userFormulasRest = new UserFormulasRest()
const breakdownsRest = new BreakdownsRest()

const SelectProduct = ({ formula, otherFormulas, setOtherFormulas, goToNextPage, items = [], bundles = [], freeShipping, freeShippingBannerText }) => {

  const vua_cart = Local.get('vua_cart') ?? items.map(itemDB => {
    const item = structuredClone(itemDB)
    delete item.colors
    if (!item.is_default) return
    item.quantity = 1;
    item.formula_id = formula.id;
    return item;
  }).filter(Boolean)
  const [cart, setCart] = useState(vua_cart.filter(x => !!items.find(y => x.id == y.id)) ?? []);

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckbox = (e, item, formula_id_in) => {
    const formula_id = formula_id_in ?? formula.id
    const checked = e.target.checked
    if (checked) {
      setCart(old => ([...old, { ...item, quantity: 1, formula_id }]))
    } else {
      setCart(old => {
        return old.filter(x => !(x.id == item.id && x.formula_id == formula_id))
      })
    }
  }

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

  const onPlusClicked = (item, formula_id_in) => {
    const formula_id = formula_id_in ?? formula.id
    if (cart.find(x => x.id == item.id && x.formula_id == formula_id)) {
      setCart(old => {
        return old.map(x => {
          if (x.id == item.id && x.formula_id == formula_id) x.quantity++
          return x
        })
      })
    } else {
      document.getElementById(`item-${item.id}`).checked = true
      setCart(old => ([...old, { ...item, quantity: 1, formula_id }]))
    }
  }

  const onMinusClicked = (item, formula_id_in) => {
    const formula_id = formula_id_in ?? formula.id
    setCart(old => {
      return old.map(x => {
        if (x.id == item.id && x.formula_id == formula_id) x.quantity--
        if (x.quantity <= 0) return document.getElementById(`item-${item.id}`).checked = false
        return x
      }).filter(Boolean)
    })
  }

  const onDeleteFormula = async (formulaId) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Estás seguro de eliminar esta fórmula?",
      showCancelButton: true,
      confirmButtonColor: '#71b6f9',
      cancelButtonColor: '#d94d4d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await userFormulasRest.delete(formulaId)
    if (!result) return
    setOtherFormulas(old => old.filter(x => x.id != formulaId))
    setCart(old => old.filter(x => x.formula_id != formulaId))
  }

  const onNextClicked = async () => {
    const hasMainFormulaItems = cart.some(item => item.formula_id === formula.id);

    // Check if there's at least one item for each secondary formula
    const hasAllSecondaryFormulaItems = otherFormulas.every(otherFormula =>
      cart.some(item => item.formula_id === otherFormula.id)
    );

    // If any formula has no items, show warning
    if (!hasMainFormulaItems || !hasAllSecondaryFormulaItems) {
      await Swal.fire({
        title: '¡Hay una fórmula vacía!',
        text: 'Selecciona al menos un producto por fórmula.',
        confirmButtonColor: '#71b6f9',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    breakdownsRest.save({ field: 'selected_item' })
    goToNextPage();
  }

  useEffect(() => {
    Local.set('vua_cart', cart)
  }, [cart])

  useEffect(() => {
    Aos.init()
  }, [null])

  return <form className='px-[3%] lg:px-[10%] py-[10%] md:py-[7.5%] lg:py-[5%] bg-[#F9F3EF] text-center text-[#404040]'>
    <div className='max-w-2xl mx-auto '>
      <h1 className="text-2xl font-bold mb-2">¡Selecciona tus productos personalizados!</h1>
      <p className="mb-8 text-sm font-extralight">
        <span>Para mejores resultados arma una rutina completa</span>
        <img className="w-4 inline-block ms-2" src="/assets/img/emojis/stars.png" alt="Para mejores resultados arma una rutina completa" />
      </p>
    </div>

    {
      otherFormulas.length > 0 && <>
        <hr className="block w-1/2 mx-auto mb-4" />
        <h2 className="text-xl mb-6">Productos para tu <b>fórmula principal</b></h2>
      </>
    }

    <div className="max-w-4xl mx-auto mb-8">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {
          items.map((itemDB, index) => {
            const item = structuredClone(itemDB)
            delete item.colors
            const selected = cart.find(x => x.id == item.id && x.formula_id == formula.id)
            const quantity = selected?.quantity ?? 0
            return <div key={index} className="flex flex-col w-[180px] whitespace-nowrap" data-aos="fade-up">
              <input type="checkbox" name="" id={`item-${item.id}`} className="peer hidden" onChange={(e) => handleCheckbox(e, item)} checked={!!selected} required />
              <label htmlFor={`item-${item.id}`} className="flex overflow-hidden flex-col tracking-normal leading-none text-center bg-white rounded-xl border peer-checked:border-[#808080] peer-checked:shadow-md text-[#404040] cursor-pointer mb-3 transition-all">
                <img loading="lazy" src={`/api/items/media/${item.image}`} className="object-cover object-center aspect-[3/4] w-full border-b" alt="Shampoo product image" onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />
                <h2 className="self-center px-4 py-3">{item.name}</h2>
              </label>
              <div className="flex gap-5 justify-between items-center self-center py-1 text-sm bg-transparent rounded-lg border border-[#808080] w-[70%] px-4 font-bold">
                <button type="button" className="disabled:cursor-not-allowed" onClick={() => onMinusClicked(item)} disabled={quantity <= 0}>-</button>
                <span>{quantity}</span>
                <button type="button" className="disabled:cursor-not-allowed" onClick={() => onPlusClicked(item)}>+</button>
              </div>
            </div>
          })
        }
      </div>
    </div>

    {
      otherFormulas.length > 0 && otherFormulas.map((otherFormula, index) => {
        return <div key={index} className="max-w-4xl mx-auto mb-8">
          <h2 className="text-xl mb-6">
            Productos para tu <b>{index + 2}<sup>a</sup> fórmula</b>
            <Tippy content="Eliminar esta fórmula">
              <i className="mdi mdi-trash-can-outline text-red-400 font-bold ms-2 cursor-pointer" onClick={() => onDeleteFormula(otherFormula.id)}></i>
            </Tippy>
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {
              items.map((itemDB, index) => {
                const item = structuredClone(itemDB)
                delete item.colors
                const selected = cart.find(x => x.id == item.id && x.formula_id == otherFormula.id)
                const quantity = selected?.quantity ?? 0
                return <div key={index} className="flex flex-col w-[180px] whitespace-nowrap" data-aos="fade-up">
                  <input type="checkbox" name="" id={`item-${item.id}-${otherFormula.id}`} className="peer hidden" onChange={(e) => handleCheckbox(e, item, otherFormula.id)} checked={!!selected} required />
                  <label htmlFor={`item-${item.id}-${otherFormula.id}`} className="flex overflow-hidden flex-col tracking-normal leading-none text-center bg-white rounded-xl border peer-checked:border-[#808080] peer-checked:shadow-md text-[#404040] cursor-pointer mb-3 transition-all">
                    <img loading="lazy" src={`/api/items/media/${item.image}`} className="object-cover object-center aspect-[3/4] w-full border-b" alt="Shampoo product image" onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />
                    <h2 className="self-center px-4 py-3">{item.name}</h2>
                  </label>
                  <div className="flex gap-5 justify-between items-center self-center py-1 text-sm bg-transparent rounded-lg border border-[#808080] w-[70%] px-4 font-bold">
                    <button type="button" className="disabled:cursor-not-allowed" onClick={() => onMinusClicked(item, otherFormula.id)} disabled={quantity <= 0}>-</button>
                    <span>{quantity}</span>
                    <button type="button" className="disabled:cursor-not-allowed" onClick={() => onPlusClicked(item, otherFormula.id)}>+</button>
                  </div>
                </div>
              })
            }
          </div>
        </div>
      })
    }

    {otherFormulas?.length < 3 && <NewFormulaButton formula={formula} roundedFull showIcon />}

    <div className='max-w-2xl mx-auto mt-5 sm:mt-8 lg:mt-10 px-[3%]'>

      <p className='text-md'>
        Agrega más de un producto y <b>obtén nuestros descuentos</b> por packs.
      </p>

      {
        freeShipping == 'true' &&
        <div>
          <div className="text-sm font-semibold bg-[#C5B8D4] text-white rounded-3xl mt-4 py-4 px-[5%] whitespace-pre-line shadow-lg">
            {freeShippingBannerText}
          </div>
        </div>
      }

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#EFBEC1] text-white rounded-3xl mt-4 py-4 px-[5%] font-extrabold shadow-lg">
        <div className="text-xl text-start">
          Elegiste {
            bundle
              ? bundle.name
              : <>{totalQuantity} {totalQuantity == 1 ? 'producto' : 'productos'}</>
          }
          {bundle && <span className="block text-xs font-light">{bundle.description}</span>}
        </div>
        <div className="flex flex-row text-white items-center gap-4">
          {
            totalPrice != finalPrice &&
            <p className="font-light line-through">Antes: S/{Number2Currency(totalPrice)}</p>
          }
          <h2 className="text-2xl">S/{Number2Currency(finalPrice)}</h2>
        </div>
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-center gap-2 mx-auto md:mx-[12.5%] mt-5 sm:mt-10">
      <a href={`/test/result/${formula.id}`} className='bg-[#C5B8D4] text-white text-sm px-16 py-3 rounded mt-4'>
        <i className="mdi mdi-arrow-left me-1"></i>
        VOLVER
      </a>
      <button onClick={onNextClicked} className='bg-[#C5B8D4] text-white text-sm px-14 py-3 tracking-widest rounded mt-4 disabled:cursor-not-allowed leadin' disabled={totalQuantity == 0}>
        SIGUIENTE
        <i className="mdi mdi-arrow-right ms-1"></i>
      </button>
    </div>

  </form>
}

export default SelectProduct 