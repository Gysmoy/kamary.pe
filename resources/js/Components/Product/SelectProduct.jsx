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

  // Helper: calcula bundle y precios para una fórmula dada
  const getFormulaPrice = (formulaId) => {
    const formulaItems = cart.filter(item => item.formula_id === formulaId);
    const totalQuantity = formulaItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = formulaItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const restBundles = bundles.filter(x => {
      switch (x.comparator) {
        case '<':
          return totalQuantity < x.items_quantity
        case '>':
          return totalQuantity > x.items_quantity
        default:
          return totalQuantity == x.items_quantity
      }
    }).sort((a, b) => b.percentage - a.percentage);

    const bundle = restBundles?.[0] ?? null;
    const finalPrice = Math.round((totalPrice * (1 - (bundle?.percentage || 0))) * 10) / 10;

    return { totalPrice, finalPrice, bundle, totalQuantity };
  };

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
      document.getElementById(`item-${item.id}-${formula_id}`).checked = true
      setCart(old => ([...old, { ...item, quantity: 1, formula_id }]))
    }
  }

  const onMinusClicked = (item, formula_id_in) => {
    const formula_id = formula_id_in ?? formula.id
    setCart(old => {
      return old.map(x => {
        if (x.id == item.id && x.formula_id == formula_id) x.quantity--
        if (x.quantity <= 0) return document.getElementById(`item-${item.id}-${formula_id}`).checked = false
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
  const onPromotedClicked = (bundleItems) => {
    setCart(bundleItems.map(item => ({ ...item, quantity: 1, formula_id: formula.id })))
    breakdownsRest.save({ field: 'selected_item' })
    setTimeout(() => {
      goToNextPage();
    }, 100);
  }

  useEffect(() => {
    Local.set('vua_cart', cart)
  }, [cart])

  useEffect(() => {
    Aos.init()
  }, [null])

  const promotedBundles = bundles.filter(x => x.is_promoted)

  // Precios por fórmula
  const mainFormulaPrice = getFormulaPrice(formula.id);
  const otherFormulasPrices = otherFormulas.map(f => ({ id: f.id, ...getFormulaPrice(f.id) }));

  // Totales generales
  const totalFinalPrice = mainFormulaPrice.finalPrice + otherFormulasPrices.reduce((sum, f) => sum + f.finalPrice, 0);
  const totalOriginalPrice = mainFormulaPrice.totalPrice + otherFormulasPrices.reduce((sum, f) => sum + f.totalPrice, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return <section className='relative bg-[#F9F3EF] text-center text-[#404040] min-h-screen w-full'>
    {
      otherFormulas.length == 0
        ? <div className="px-[3%] lg:px-[10%] py-[10%] md:py-[7.5%] lg:py-[5%] w-full">
          <div className='max-w-2xl mx-auto '>
            <h1 className="text-2xl font-bold mb-2">¡Selecciona tu rutina capilar!</h1>
            <p className="mb-8 text-sm font-extralight">
              <span>Conoce las combinaciones favoritas de las vualovers</span>
              <img className="w-4 inline-block ms-2" src="/assets/img/emojis/stars.png" alt="Conoce las combinaciones favoritas de las vualovers" />
            </p>
          </div>
          {
            promotedBundles.length > 0 &&
            <div className="mb-8 flex flex-wrap justify-center items-center gap-4 w-max max-w-full mx-auto">
              {
                promotedBundles.map((bundle, index) => {
                  const bundleItems = bundle.items.map(item => items.find(i => i.id === item))
                  const bundlePrice = bundleItems.reduce((sum, item) => sum + Number(item.price), 0)
                  const bundleFinalPrice = Math.round(bundlePrice * (1 - bundle.percentage) * 10) / 10
                  return (<div key={index} className="grid grid-cols-8 items-center gap-4 w-[330px] bg-white rounded-xl shadow p-4">
                    {/* Imagen a la izquierda */}
                    <img
                      src={`/api/bundles/media/${bundle.image}`}
                      alt={bundle.name}
                      className="col-span-3 w-full h-36 object-cover object-center rounded-lg"
                      onError={e => e.target.src = '/assets/img/routine/conditioner.png'}
                    />
                    {/* Textos a la derecha */}
                    <div className="col-span-5 text-left">
                      <p className="text-sm font-extralight flex items-center justify-center text-center h-[80px] w-full whitespace-pre-line">
                        <span>
                        {bundleItems.map(item => <>
                          {item.name} <small className="text-[#808080] text-xxs">{item.size}</small><br />
                        </>)}
                        </span>
                      </p>
                      <span className="text-4xl font-extrabold text-[#A191B8] text-center block my-2">S/ {Number2Currency(bundleFinalPrice)}</span>
                      <span className="text-sm text-center block ">Antes S/{Number2Currency(bundlePrice)}</span>
                    </div>
                    {/* Botón abajo ocupando todo el ancho */}
                    <div className="col-span-7 mt-2">
                      <button
                        type="button"
                        onClick={() => onPromotedClicked(bundleItems)}
                        className="w-full bg-[#C5B8D4] text-white px-4 py-3 rounded-lg text-sm font-light tracking-wider hover:opacity-90 transition uppercase"
                      >
                        Agregar al carrito
                      </button>
                    </div>
                  </div>);
                })
              }
            </div>
          }

          <div className="w-full max-w-[48rem] mx-auto mb-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 w-full">
                {
                  items.map((itemDB, index) => {
                    const item = structuredClone(itemDB)
                    delete item.colors
                    const selected = cart.find(x => x.id == item.id && x.formula_id == formula.id)
                    const quantity = selected?.quantity ?? 0
                    return <div key={index} className="flex flex-col w-[180px] whitespace-nowrap">
                      <input type="checkbox" name="" id={`item-${item.id}-${formula.id}`} className="peer hidden" onChange={(e) => handleCheckbox(e, item)} checked={!!selected} required />
                      <label htmlFor={`item-${item.id}-${formula.id}`} className="flex overflow-hidden flex-col tracking-normal leading-none text-center bg-transparent rounded-xl border peer-checked:border-[#808080] peer-checked:shadow-md text-[#404040] cursor-pointer mb-3 transition-all">
                        {/* Desktop: image on top, name below */}
                        <div className="relative">
                          <img loading="lazy" src={`/api/items/media/${item.image}`} className="hidden md:block object-cover object-center aspect-[3/4] w-full border-b" alt="Shampoo product image" onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />
                          <p className="text-center text-xs absolute bottom-2 right-2 bg-[#C5B8D4] text-white px-2 rounded-full">{item.size}</p>
                        </div>
                        {/* Mobile: image left, name & price right */}
                        <div className="md:hidden flex items-center gap-3 p-2">
                          <img loading="lazy" src={`/api/items/media/${item.image}`} className="object-cover object-center aspect-[3/4] w-12 border rounded" alt="Shampoo product image" onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />
                          <div className="flex-1 text-left">
                            <h2 className="font-semibold text-wrap">{item.name == 'Acondicionador' ? 'Acond.' : item.name}</h2>
                            <small className="text-[#808080] text-xs block mb-1">{item.size}</small>
                            <span className="text-sm text-[#404040]">S/ {Number2Currency(item.price)}</span>
                          </div>
                        </div>
                        {/* Desktop name */}
                        <h2 className="hidden md:block self-center px-4 py-3">{item.name}</h2>
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
              <div>
                <div className="bg-[#EFBEC1] p-8 text-white text-start rounded-2xl">
                  <div className="hidden md:block mb-4">
                    <p className="text-lg font-light mb-1">o personaliza aún más</p>
                    <h4 className="text-2xl font-bold">tu Pack ideal:</h4>
                  </div>
                  <div className="bg-[#D5A4A7] px-4 py-2 mb-8 text-center text-xl">
                    Elegiste {
                      mainFormulaPrice.bundle
                        ? mainFormulaPrice.bundle.name
                        : <>{mainFormulaPrice.totalQuantity} {mainFormulaPrice.totalQuantity == 1 ? 'producto' : 'productos'}</>
                    }
                  </div>
                  <div className="flex flex-row md:flex-col justify-between items-center md:items-start md:justify-start gap-4 mb-4">
                    <span className="block text-5xl font-extrabold mb-1">S/{Number2Currency(mainFormulaPrice.finalPrice)}</span>
                    <span className="block text-lg text-start font-extralight line-through">Antes: S/{Number2Currency(mainFormulaPrice.totalPrice)}</span>
                  </div>

                  <button className="w-full bg-white text-[#9577B9] px-4 py-3 rounded-lg text-sm font-bold tracking-wider hover:opacity-90 transition uppercase"
                    onClick={onNextClicked}>AGREGAR AL CARRITO</button>

                </div>
                <NewFormulaButton formula={formula} roundedFull showIcon />
              </div>
            </div>
          </div>
        </div>
        : <>
          <div className="px-[3%] lg:px-[10%] py-[10%] md:py-[7.5%] lg:py-[5%] z-10 flex-1">
            <h1 className="text-2xl font-bold mb-2">¡Selecciona tu rutina capilar!</h1>
            <p className="mb-8 text-sm font-extralight">
              <span>Conoce las combinaciones favoritas de las vualovers</span>
              <img className="w-4 inline-block ms-2" src="/assets/img/emojis/stars.png" alt="Conoce las combinaciones favoritas de las vualovers" />
            </p>
            <hr className="block w-1/2 mx-auto mb-4" />
            <h2 className="text-xl mb-6">Productos para tu <b>fórmula principal</b></h2>
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex flex-wrap items-center justify-center gap-4">
                {
                  items.map((itemDB, index) => {
                    const item = structuredClone(itemDB)
                    delete item.colors
                    const selected = cart.find(x => x.id == item.id && x.formula_id == formula.id)
                    const quantity = selected?.quantity ?? 0
                    return <div key={index} className="flex flex-col w-[180px] whitespace-nowrap" data-aos="fade-up">
                      <input type="checkbox" name="" id={`item-${item.id}-${formula.id}`} className="peer hidden" onChange={(e) => handleCheckbox(e, item)} checked={!!selected} required />
                      <label htmlFor={`item-${item.id}-${formula.id}`} className="flex overflow-hidden flex-col tracking-normal leading-none text-center bg-transparent rounded-xl border peer-checked:border-[#808080] peer-checked:shadow-md text-[#404040] cursor-pointer mb-3 transition-all">
                        {/* Desktop: image on top, name below */}
                        <div className="relative">
                          <img loading="lazy" src={`/api/items/media/${item.image}`} className="hidden md:block object-cover object-center aspect-[3/4] w-full border-b" alt="Shampoo product image" onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />
                          <p className="text-center text-xs absolute bottom-2 right-2 bg-[#C5B8D4] text-white px-2 rounded-full">{item.size}</p>
                        </div>
                        {/* Mobile: image left, name & price right */}
                        <div className="md:hidden flex items-center gap-3 p-2">
                          <img loading="lazy" src={`/api/items/media/${item.image}`} className="object-cover object-center aspect-[3/4] w-12 border rounded" alt="Shampoo product image" onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />
                          <div className="flex-1 text-left">
                            <h2 className="font-semibold text-wrap">{item.name == 'Acondicionador' ? 'Acond.' : item.name}</h2>
                            <small className="text-[#808080] text-xs block mb-1">{item.size}</small>
                            <span className="text-sm text-[#404040]">S/ {Number2Currency(item.price)}</span>
                          </div>
                        </div>
                        {/* Desktop name */}
                        <h2 className="hidden md:block self-center px-4 py-3">{item.name}</h2>
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
              otherFormulas.map((otherFormula, index) => {
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
                          <label htmlFor={`item-${item.id}-${otherFormula.id}`} className="flex overflow-hidden flex-col tracking-normal leading-none text-center bg-transparent rounded-xl border peer-checked:border-[#808080] peer-checked:shadow-md text-[#404040] cursor-pointer mb-3 transition-all">
                            {/* Desktop: image on top, name below */}
                            <div className="relative">
                              <img loading="lazy" src={`/api/items/media/${item.image}`} className="hidden md:block object-cover object-center aspect-[3/4] w-full border-b" alt="Shampoo product image" onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />
                              <p className="text-center text-xs absolute bottom-2 right-2 bg-[#C5B8D4] text-white px-2 rounded-full">{item.size}</p>
                            </div>
                            {/* Mobile: image left, name & price right */}
                            <div className="md:hidden flex items-center gap-3 p-2">
                              <img loading="lazy" src={`/api/items/media/${item.image}`} className="object-cover object-center aspect-[3/4] w-12 border rounded" alt="Shampoo product image" onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />
                              <div className="flex-1 text-left">
                                <h2 className="font-semibold text-wrap">{item.name == 'Acondicionador' ? 'Acond.' : item.name}</h2>
                                <small className="text-[#808080] text-xs block mb-1">{item.size}</small>
                                <span className="text-sm text-[#404040]">S/ {Number2Currency(item.price)}</span>
                              </div>
                            </div>
                            {/* Desktop name */}
                            <h2 className="hidden md:block self-center px-4 py-3">{item.name}</h2>
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

          </div>
          <div className="sticky bottom-0 z-20 bg-[#EFBEC1]">
            <div className="w-full flex flex-col md:flex-row gap-4 justify-between items-center text-white rounded-3xl py-4 max-w-4xl px-[5%] mx-auto font-extrabold">
              <div className="flex gap-8 text-start items-center">
                <div>
                  <p className="text-lg font-light">Elegiste</p>
                  <p className="text-2xl">
                    {totalQuantity} {totalQuantity == 1 ? 'producto' : 'productos'}
                  </p>
                </div>
                <div>
                  <h2 className="text-2xl">S/{Number2Currency(totalFinalPrice)}</h2>
                  {totalOriginalPrice !== totalFinalPrice && (
                    <p className="font-light line-through">Antes: S/{Number2Currency(totalOriginalPrice)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="w-full bg-white text-[#9577B9] px-4 py-3 rounded-lg text-sm font-bold tracking-wider hover:opacity-90 transition uppercase"
                  onClick={onNextClicked}>AGREGAR AL CARRITO</button>
              </div>
            </div>
          </div>
        </>
    }
  </section>
}

export default SelectProduct
