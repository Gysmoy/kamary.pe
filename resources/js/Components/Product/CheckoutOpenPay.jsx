import { CreditCard, HeadphonesIcon, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Local, Notify } from 'sode-extend-react';
import OpenPayRest from '../../actions/OpenPayRest';
import Global from '../../Utils/Global';
import Number2Currency from '../../Utils/Number2Currency';
import CouponsRest from '../../Actions/CouponsRest';
import Tippy from '@tippyjs/react';
import places from './components/places.json';
import CardAnimation from './components/CardAnimation';
import BreakdownsRest from '../../actions/BreakdownsRest';
import OpenPayModal from './components/OpenPayModal';

const couponRest = new CouponsRest()
const breakdownsRest = new BreakdownsRest()

const CheckoutOpenPay = ({ formula, otherFormulas, goToPrevPage, publicKey, selectedPlan, bundles, planes, session, freeShipping, freeShippingMinimumAmount, freeShippingAmount, freeShippingZones, openPayId, openPayPublicKey }) => {

  const couponRef = useRef(null)

  const cart = Local.get('vua_cart')
  const [loading, isLoading] = useState(false);
  const [coupon, setCoupon] = useState(null)

  const [transactionOk, setTransactionOk] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)

  const [openPayModalOpen, setOpenPaymodalOpen] = useState(false)

  const [orderNumber, setOrderNumber] = useState(null)

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
  const bundleDiscount = totalPrice * (bundle?.percentage || 0)

  const department = Object.keys(places).find(x => places[x].name == session?.department)

  const [sale, setSale] = useState({
    name: session?.name || null,
    lastname: session?.lastname || null,
    email: formula.email,
    phone: session?.phone || null,
    country: 'Perú',
    department: department ? (department || 'provincias') : null,
    // department: Object.keys(places).find(x => places[x].name == session?.department) || null,
    province: session?.province || session?.department || null,
    district: session?.district || null,
    zip_code: session?.zip_code || null,
    address: session?.address || null,
    number: session?.address_number || null,
    reference: session?.address_reference || null,
    comment: null,
    billing_type: 'boleta',
    billing_number: '',
  });

  if (freeShipping == 'true' && !selectedPlan) {
    for (const zone of freeShippingZones.split(',')) {
      if ((totalPrice - bundleDiscount) >= freeShippingMinimumAmount) {
        places[zone].delivery = 'Gratis'
        places[zone].deliveryPrice = 0
      } else {
        places[zone].delivery = `S/ ${Number2Currency(freeShippingAmount)}`
        places[zone].deliveryPrice = Number(freeShippingAmount)
      }
    }
  }
  let delivery = places[sale?.department]?.deliveryPrice || 0

  const plan = planes.find(x => x.id == selectedPlan)
  const planDiscount = (totalPrice - bundleDiscount) * (plan?.percentage || 0)

  let couponDiscount = 0
  if (coupon) {
    if (coupon.type == 'fixed_amount') {
      couponDiscount = coupon?.amount || 0
    } else if (coupon.type == 'percentage') {
      couponDiscount = (totalPrice - bundleDiscount - planDiscount) * (coupon?.amount || 0) / 100
    }
  }

  const getSale = () => {
    let department = 'Lima';
    let province = 'Lima'
    let district = null

    if (Array.isArray(places[sale.department].items)) {
      department = places[sale.department].name
      province = sale.province
      district = null
    } else {
      department = sale.province
      province = null
      district = sale.district
    }

    return {
      ...sale,
      department_code: sale.department,
      department, province, district
    }
  }

  const onOpenPayOpen = async (e) => {
    e.preventDefault()
    if (loading) return
    isLoading(true)

    if (totalPrice > 6) {
      const resOP = await OpenPayRest.order({
        ...getSale(),
        order_number: orderNumber,
        user_formula_id: formula.id,
        renewal_id: selectedPlan,
        coupon: coupon?.name ?? null
      }, cart);
      if (resOP) {
        setOrderNumber(resOP.data.code)
      }
    }
    isLoading(false)

    setOpenPaymodalOpen(true)
  }

  const handleToken = async (token) => {
    setOverlayOpen(true)
    const deviceSessionId = OpenPay.deviceData.setup("formId");
    const resCQ = await OpenPayRest.token({ order: orderNumber, token: token.data, deviceSessionId })
    if (!resCQ) {
      setOverlayOpen(false)
      return
    }
    setTransactionOk(true)
    location.href = '/thanks'
  }

  const handleError = (error) => {
    Notify.add({
      icon: '/images/icon.png',
      title: error?.message ?? 'Error inesperado',
      body: error?.data?.description ?? 'Ocurrió un error desconocido al tokenizar la tarjeta',
      type: 'danger'
    })
  }

  const onCouponApply = (e) => {
    e.preventDefault()
    const coupon = (couponRef.current.value || '').trim().toUpperCase()
    if (!coupon) return
    couponRest.save({ coupon, amount: totalPrice, email: formula.email }).then(result => {
      if (result) setCoupon(result.data)
      else setCoupon(null)
    })
  }

  const onCouponKeyDown = (e) => {
    if (e.key == 'Enter') onCouponApply(e)
  }

  useEffect(() => {
    breakdownsRest.save({ field: 'reached_checkout' })
  }, []);

  return (
    <>
      <CardAnimation isOpen={overlayOpen} isOk={transactionOk} />
      <section className='px-[5%] md:px-[7.5%] lg:px-[10%] pb-[5%] mt-[7.5%] md:mt-[5%] lg:mt-[2.5%] text-[#404040]'>
        <div className='max-w-4xl mx-auto'>
          <div className="mb-6 flex justify-center space-x-8 text-sm text-white">
            <div className="flex items-center">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>SSL Pago Seguro</span>
            </div>
            <div className="flex items-center">
              <HeadphonesIcon className="mr-2 h-4 w-4" />
              <span>24/7 Atención al cliente</span>
            </div>
            <div className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Pago online</span>
            </div>
          </div>
          <form className="w-full rounded-lg bg-white p-8 shadow-lg" onSubmit={onOpenPayOpen} disabled={loading}>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5 relative">
              <div className='lg:col-span-3'>
                <button onClick={() => goToPrevPage(otherFormulas.length > 0 ? 2 : 1)} className='bg-[#C5B8D4] text-white text-sm px-4 py-2 rounded mb-4'>
                  <i className="mdi mdi-arrow-left me-1"></i>
                  VOLVER
                </button>
                <h2 className="mb-4 text-xl font-semibold">Información del cliente</h2>
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium " htmlFor="firstName">
                      Nombre <b className='text-red-500'>*</b>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                      value={sale.name}
                      onChange={(e) => setSale(old => ({ ...old, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium " htmlFor="lastName">
                      Apellidos <b className='text-red-500'>*</b>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                      value={sale.lastname}
                      onChange={(e) => setSale(old => ({ ...old, lastname: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium " htmlFor="email">
                    Dirección de correo electrónico <b className='text-red-500'>*</b>
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                    value={sale.email}
                    placeholder='Dirección de correo electrónico'
                    onChange={(e) => setSale(old => ({ ...old, email: e.target.value }))}
                    required
                    disabled
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium " htmlFor="phone">
                    Teléfono/Celular <b className='text-red-500'>*</b>
                  </label>
                  <div className='flex border rounded-md border-gray-300'>
                    <span className='py-2 px-3 border-e'>+51</span>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full p-2 text-sm outline-none"
                      value={sale.phone}
                      onChange={(e) => setSale(old => ({ ...old, phone: e.target.value }))}
                      placeholder='900000000'
                      required
                    />
                  </div>
                </div>
                <h2 className="mb-4 text-xl font-semibold">Dirección del cliente</h2>
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium " htmlFor="country">
                    País <b className='text-red-500'>*</b>
                  </label>
                  <input
                    type="text"
                    id="country"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                    value={sale.country}
                    disabled
                    required
                  />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-5">
                  <div className='md:col-span-3'>
                    <label className="mb-1 block text-sm font-medium " htmlFor="department">
                      Región <b className='text-red-500'>*</b>
                    </label>
                    <select
                      id="department"
                      className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                      value={sale.department || ''}
                      onChange={(e) => setSale(old => ({ ...old, department: e.target.value }))}
                      required
                    >
                      <option value=''>Elige una opción</option>
                      {
                        Object.keys(places).map((key, index) => {
                          return <option key={index} value={key}>{places[key].name}</option>
                        })
                      }
                    </select>
                  </div>
                </div>
                {
                  places[sale.department] &&
                  <div className="mt-4 grid gap-4 md:grid-cols-5">
                    {
                      Array.isArray(places[sale.department].items)
                        ? <>
                          <div className='md:col-span-3'>
                            <label className="mb-1 block text-sm font-medium " htmlFor="district">
                              Distrito <b className='text-red-500'>*</b>
                            </label>
                            <select
                              id="province"
                              className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                              value={sale.province}
                              onChange={(e) => setSale(old => ({ ...old, province: e.target.value }))}
                              required
                            >
                              <option value=''>Elige una opción</option>
                              {
                                places[sale.department].items.map((province, index) => {
                                  return <option key={index} value={province}>{province}</option>
                                })
                              }
                            </select>
                          </div>
                          <div className='md:col-span-2'>
                            <label className="mb-1 block text-sm font-medium  truncate text-ellipsis" htmlFor="postalCode" title='Código postal'>
                              Código postal
                            </label>
                            <input
                              type="text"
                              id="postalCode"
                              className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                              value={sale.zip_code}
                              onChange={(e) => setSale(old => ({ ...old, zip_code: e.target.value }))}
                            />
                          </div>
                        </>
                        : <>
                          <div className='md:col-span-2'>
                            <label className="mb-1 block text-sm font-medium  truncate text-ellipsis" htmlFor="postalCode" title='Código postal'>
                              Departamento <b className='text-red-500'>*</b>
                            </label>
                            <input
                              type="text"
                              id="postalCode"
                              className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                              value={sale.province ?? session?.department}
                              onChange={(e) => setSale(old => ({ ...old, province: e.target.value }))}
                              required
                            />
                          </div>
                          <div className='md:col-span-2'>
                            <label className="mb-1 block text-sm font-medium  truncate text-ellipsis" htmlFor="postalCode" title='Código postal'>
                              Distrito <b className='text-red-500'>*</b>
                            </label>
                            <input
                              type="text"
                              id="postalCode"
                              className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                              value={sale.district}
                              onChange={(e) => setSale(old => ({ ...old, district: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium  truncate text-ellipsis" htmlFor="postalCode" title='Código postal'>
                              Código postal
                            </label>
                            <input
                              type="text"
                              id="postalCode"
                              className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                              value={sale.zip_code}
                              onChange={(e) => setSale(old => ({ ...old, zip_code: e.target.value }))}
                            />
                          </div>
                        </>
                    }
                  </div>
                }
                <div className="mt-4">
                  <div className="mt-4 grid gap-4 md:grid-cols-5 lg:grid-cols-3">
                    <div className='md:col-span-3 lg:col-span-2'>
                      <label className="mb-1 block text-sm font-medium " htmlFor="address">
                        Dirección de la calle <b className='text-red-500'>*</b>
                      </label>
                      <input
                        type="text"
                        id="address"
                        className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                        value={sale.address}
                        placeholder='Nombre de la calle y número de la calle'
                        onChange={(e) => setSale(old => ({ ...old, address: e.target.value }))}
                        required
                      />
                    </div>
                    <div className='md:col-span-2 lg:col-span-1'>
                      <label className="mb-1 block text-sm font-medium " htmlFor="number">
                        Número <b className='text-red-500'>*</b>
                      </label>
                      <input
                        type="number"
                        id="number"
                        className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                        value={sale.number}
                        placeholder='Nombre de la calle y número de la calle'
                        onChange={(e) => setSale(old => ({ ...old, number: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium " htmlFor="apartment">
                    Apartamento, habitación, piso, etc. (opcional)
                  </label>
                  <input
                    type="text"
                    id="apartment"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                    value={sale.reference}
                    onChange={(e) => setSale(old => ({ ...old, reference: e.target.value }))}
                  />
                </div>
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium " htmlFor="orderNotes">
                    Notas del pedido (opcional)
                  </label>
                  <textarea
                    id="orderNotes"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                    rows={3}
                    placeholder="Notas sobre tu pedido, por ejemplo, notas especiales para la entrega."
                    value={sale.comment || ''}
                    onChange={(e) => setSale(old => ({ ...old, comment: e.target.value }))}
                    style={{
                      minHeight: 81,
                      fieldSizing: 'content'
                    }}
                  />
                </div>
                <div className="mt-6">
                  <h3 className="mb-4 text-xl font-semibold">Pago</h3>
                  <div className="rounded-md border border-gray-300">
                    <div className='p-4 py-3 flex justify-between'>
                      <img className='h-4' src="/assets/img/checkout/culqi-logo.svg" alt="Culqi" />
                      <div className='flex gap-2'>
                        <img className='h-4' src="/assets/img/checkout/cards.svg" alt="Cards" />
                        <img className='h-4' src="/assets/img/checkout/pagoefectivo.svg" alt="Pago efectivo" />
                        <img className='h-4' src="/assets/img/checkout/yape.svg" alt="Yape" />
                      </div>
                    </div>
                    <p className="text-xs bg-[#f9f9f9] p-4 px-6 rounded-b">
                      Acepta pagos con <b>tarjetas de débito y crédito, Yape, Cuotealo BCP y PagoEfectivo</b>
                      (billeteras móviles, agentes y bodegas).
                    </p>
                  </div>
                </div>
                <div className="mt-6 text-xs">
                  <p className='text-justify'>
                    Sus datos personales se utilizarán para procesar su pedido, respaldar su experiencia en este sitio web y para otros fines descritos en nuestra {' '}
                    <a href="#" className="text-purple-600 hover:underline">
                      política de privacidad
                    </a>.
                  </p>
                </div>
                {/* <button className="mt-6 w-full rounded-md bg-pink-400 py-3 text-white hover:bg-pink-500" onClick={onOpenPayOpen}>
                  <i className='mdi mdi-lock me-1'></i>
                  Realizar el pedido S/ {Number2Currency(totalPrice)}
                </button> */}
              </div>
              <div className='lg:col-span-2 relative'>
                <div className='block mb-6'>
                  <h2 className="mb-4 text-xl font-semibold">Tu pedido</h2>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-4 flex justify-between border-b pb-2 font-bold">
                      <span className="">Producto</span>
                      <span className="">Subtotal</span>
                    </div>
                    <div className='mb-2'>
                      {
                        cart.map((item, index) => {
                          return <div key={index} className="mb-1 flex items-center justify-between text-sm">
                            <div className='flex gap-2'>
                              <div className='h-10 aspect-[3/4] relative'>
                                <img className="h-10 aspect-[3/4] object-cover object-center rounded-md border" src={`/api/colors/media/${item.colors[0]?.image}`} alt={item.name} onError={e => e.target.src = `/api/items/media/${item.image}`} />
                              </div>
                              <div>
                                <p>{item.name}</p>
                                <small className="text-xs text-gray-500">
                                  <span className='w-6 inline-block text-nowrap'>
                                    × {item.quantity}
                                  </span>
                                  <div className='inline-flex flex-wrap gap-0.5'>
                                    {item.colors.map((color, index) => {
                                      return <i key={index} className='mdi mdi-circle' style={{ color: color?.hex ?? '#000', WebkitTextStroke: '1px #808080' }}></i>
                                    })}
                                  </div>
                                </small>
                              </div>
                            </div>
                            <span className=''>S/ {Number2Currency(item.price * item.quantity)}</span>
                          </div>
                        })
                      }
                    </div>
                    <div className="mb-2 mt-4 flex justify-between border-b pb-2 text-sm font-bold">
                      <span>Subtotal</span>
                      <span>S/ {Number2Currency(Math.round(totalPrice * 10) / 10)}</span>
                    </div>
                    {
                      bundle &&
                      <div className="mb-2 mt-2 flex justify-between items-center border-b pb-2 text-sm font-bold">
                        <span>
                          Descuento x paquete
                          <small className='block text-xs font-light'>Elegiste {bundle.name} (-{Math.round(bundle.percentage * 10000) / 100}%)</small>
                        </span>
                        <span>S/ -{Number2Currency(Math.round(bundleDiscount * 10) / 10)}</span>
                      </div>
                    }
                    {
                      plan &&
                      <div className="mb-2 mt-2 flex justify-between items-center border-b pb-2 text-sm font-bold">
                        <span>
                          Subscripción
                          <small className='block text-xs font-light'>{plan.name} (-{Math.round(plan.percentage * 10000) / 100}%)</small>
                        </span>
                        <span>S/ -{Number2Currency(Math.round(planDiscount * 10) / 10)}</span>
                      </div>
                    }
                    {
                      coupon &&
                      <div className="mb-2 mt-2 flex justify-between items-center border-b pb-2 text-sm font-bold">
                        <span>
                          Cupón aplicado <Tippy content='Eliminar'>
                            <i className='mdi mdi-close text-red-500 cursor-pointer' onClick={() => setCoupon(null)}></i>
                          </Tippy>
                          <small className='block text-xs font-light'>{coupon.name} <Tippy content={coupon.description}>
                            <i className='mdi mdi-information-outline ms-1'></i>
                          </Tippy> ({coupon.type == 'fixed_amount' ? `S/ -${Number2Currency(coupon.amount)}` : `-${Math.round(coupon.amount * 100) / 100}%`})</small>
                        </span>
                        <span>S/ -{Number2Currency(couponDiscount)}</span>
                      </div>
                    }
                    {
                      sale.department &&
                      <div className="mb-4 flex justify-between text-sm border-b pb-2">
                        <span className='font-bold'>Envío</span>
                        <span>
                          {
                            typeof places?.[sale.department]?.delivery == 'number'
                              ? `S/ ${Number2Currency(places?.[sale.department]?.delivery)}`
                              : places?.[sale.department]?.delivery
                          }
                        </span>
                      </div>
                    }
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>S/ {Number2Currency(Math.round((totalPrice - bundleDiscount - planDiscount - couponDiscount + delivery) * 10) / 10)}</span>
                    </div>
                  </div>
                  {
                    !coupon &&
                    <div className="mt-6 flex">
                      <input
                        ref={couponRef}
                        type="text"
                        placeholder="Código de cupón"
                        className="w-full rounded-l-md border border-gray-300 p-2 px-4 text-sm outline-none uppercase focus:border-[#C5B8D4]"
                        value={coupon?.name}
                        onKeyDown={onCouponKeyDown}
                        disabled={loading}
                      />
                      <button className="rounded-r-md bg-[#C5B8D4] px-4 py-2 text-sm text-white" type='button' onClick={onCouponApply} disabled={loading}>
                        Aplicar
                      </button>
                    </div>
                  }
                  {/* <button type='submit' className="mt-6 w-full rounded-md bg-[#C5B8D4] py-3 text-white disabled:cursor-not-allowed" disabled={loading}>
                    <i className='mdi mdi-lock me-1'></i>
                    Pagar Ahora
                    <small className='ms-1'>(S/ {Number2Currency(totalPrice - bundleDiscount - planDiscount - couponDiscount)})</small>
                  </button> */}
                </div>
                <div className='block sticky top-4'>
                  <h2 className="mb-4 text-xl font-semibold">Datos de facturacion</h2>

                  <div className='mb-3'>
                    <p className="mb-1 block text-sm font-medium " htmlFor="billing_type">
                      Tipo de comprobante <b className='text-red-500'>*</b>
                    </p>
                    <div className='grid grid-cols-2 gap-2'>
                      <div className='relative'>
                        <input type="radio" name="billing_type" value='boleta' id="billing_type_boleta" defaultChecked={sale.billing_type == 'boleta'} className='hidden peer' onChange={(e) => setSale(old => ({ ...old, billing_type: e.target.value }))} checked={sale.billing_type == 'boleta'} required />
                        <label htmlFor="billing_type_boleta" className='flex gap-1.5 items-center justify-center px-2 py-1 border rounded-md cursor-pointer peer-checked:bg-[#C5B8D4] peer-checked:text-white transition-colors'>
                          <i className='mdi mdi-account text-lg'></i>
                          <span>Boleta</span>
                        </label>
                      </div>
                      <div className='relative'>
                        <input type="radio" name="billing_type" value='factura' id="billing_type_factura" defaultChecked={sale.billing_type == 'factura'} className='hidden peer' onChange={(e) => setSale(old => ({ ...old, billing_type: e.target.value }))} checked={sale.billing_type == 'factura'} required />
                        <label htmlFor="billing_type_factura" className='flex gap-1.5 items-center justify-center px-2 py-1 border rounded-md cursor-pointer peer-checked:bg-[#C5B8D4] peer-checked:text-white transition-colors'>
                          <i className='mdi mdi-office-building text-lg'></i>
                          <span>Factura</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 block text-sm font-medium " htmlFor="billing_number">
                      Número de Documento <b className='text-red-500'>*</b>
                    </p>
                    <input
                      type="text"
                      id="billing_number"
                      className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none"
                      value={sale.billing_number}
                      maxLength={sale.billing_type == 'boleta' ? 8 : 11}
                      minLength={sale.billing_type == 'boleta' ? 8 : 11}
                      required
                      onChange={(e) => setSale(old => ({ ...old, billing_number: e.target.value }))}
                    />
                  </div>

                  <button type='submit' className="mt-6 w-full rounded-md bg-[#C5B8D4] py-3 text-white disabled:cursor-not-allowed" disabled={loading}>
                    <i className={`mdi ${loading ? 'mdi-spin mdi-loading' : 'mdi-lock'} me-1`}></i>
                    Pagar Ahora
                    <small className='ms-1'>(S/ {Number2Currency(Math.round((totalPrice - bundleDiscount - planDiscount - couponDiscount + delivery) * 10) / 10)})</small>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
      <OpenPayModal
        isOpen={openPayModalOpen}
        onRequestClose={() => setOpenPaymodalOpen(false)}
        openPayId={openPayId}
        openPayPublicKey={openPayPublicKey}
        handleToken={handleToken}
        handleError={handleError}
        amount={Math.round((totalPrice - bundleDiscount - planDiscount - couponDiscount + delivery) * 10) / 10} />
    </>
  );
};

export default CheckoutOpenPay