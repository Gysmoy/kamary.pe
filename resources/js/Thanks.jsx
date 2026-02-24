import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript'
import Global from './Utils/Global'
import Base from './Components/Tailwind/Base'

import { useBase } from './Components/Tailwind/BaseContext'
import { Local } from 'sode-extend-react'
import Number2Currency from './Utils/Number2Currency'

const Onboarding = ({ sales }) => {

  const { setCart } = useBase()

  useEffect(() => {
    setCart([])
    Local.set('masterset_cart', [])
  }, [null])

  // Calculate total from all sales
  const totalAmount = sales.reduce((acc, sale) => {
    return acc + sale.details.reduce((sum, detail) => sum + (detail.price * detail.quantity), 0)
  }, 0)

  return (<>
    <section className="w-full bg-[#EFF3F5] py-12 sm:py-16">
      <div className={`max-w-2xl mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className='px-6 py-8 bg-white rounded-2xl border border-[#D1D5DC] space-y-8'>
          <div>
            <img src="/assets/img/utils/thanks.png" alt={Global.APP_NAME} className='w-48 h-48 object-contain object-center block mx-auto' />
            <h4 className='text-3xl mb-2 font-semibold text-center'>Gracias por tu compra</h4>
            <p className='text-silver text-center'>Te enviaremos actualizaciones sobre el estado de tu compra.</p>
          </div>
          <div className='space-y-8'>
            {
              sales.map((sale, index) => {
                return <div key={sale.id} className='space-y-6 border-dashed border-b-2 pb-8'>
                  <div className='flex justify-between text-silver'>
                    <div>
                      <small className='block text-sm mb-1'>Número de orden</small>
                      <h4 className='text-2xl'>MS{sale.id.toString().padStart(8, '0')}</h4>
                    </div>
                    <div className='text-end'>
                      <small className='block text-sm mb-1'>Fecha de compra</small>
                      <p className='w-full'>{new Date(sale.date).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                  <div className='flex justify-between gap-6'>
                    <div className='flex-1 flex gap-2 text-silver text-sm'>
                      <i className='mdi mdi-map-marker-outline' />
                      <div>
                        <p>{sale.delivery_point_name}</p>
                        <p>{sale.delivery_point_district}, {sale.delivery_point_department}</p>
                        <p>{sale.delivery_point_address} {sale.delivery_point_number} {sale.delivery_point_reference && `(${sale.delivery_point_reference})`}</p>
                      </div>
                    </div>
                    <a href={`/storage/images/receipts/${sale.receipt}`} target="_blank" rel="noopener noreferrer">
                      <img src={`/storage/images/receipts/${sale.receipt}`} alt="" className='aspect-[3/4] border rounded w-[45px]' />
                    </a>
                  </div>
                  <hr />
                  <div className='space-y-4'>
                    {
                      sale.details.map(detail => {
                        return <div key={detail.id} className="flex gap-3">
                          <img
                            src={`//assets.tcgdex.net/${detail.item.card.language.code}/${detail.item.card.expansion.serie.code}/${detail.item.card.expansion.code}/${detail.item.card.code.split('-')[1]}/low.webp`}
                            alt={detail.item.card.fullname}
                            className="w-14 h-auto rounded"
                            onError={(e) => { e.target.src = '/images/default/card.png'; }}
                          />
                          <div className="flex-1">
                            <p className="font-bold mb-1">{detail.item.card.fullname}</p>
                            <p className="text-silver text-sm">{detail.item.card.expansion.code.toUpperCase()}: {detail.item.card.expansion.name}</p>
                            <p className='block text-sm px-3 py-1 bg-gray-50 w-max rounded-full text-silver mb-2'>{detail.condition}</p>
                          </div>
                          <div className="">
                            <div className="h-full flex flex-col items-end justify-between">
                              <p>Cantidad: {detail.quantity}</p>
                              <p className="font-bold text-primary">S/ {Number2Currency(detail.price * detail.quantity)}</p>
                            </div>
                          </div>
                        </div>
                      })
                    }
                  </div>
                </div>
              })
            }
          </div>
          <div className='flex justify-between items-center'>
            <h4 className='font-semibold text-lg'>Total pagado</h4>
            <h4 className='text-2xl text-primary'>S/ {Number2Currency(totalAmount)}</h4>
          </div>
          <div className='border border-success rounded bg-[#F0FDF4] p-4 flex gap-2'>
            <i className='mdi mdi-shield-check-outline text-success' />
            <div className='text-silver'>
              <h4 className='font-semibold mb-1'>Tu compra está protegida</h4>
              <small className='text-xs block'>Retenemos el pago hasta que tus cartas sean entregadas. Tienes un plazo de 72 horas luego de que tu carta fue entregada para que des conformidad de esta.</small>
            </div>
          </div>
          <div className="grid gap-8">
            <a href="/orders" className="w-full py-3 px-4 text-sm text-center bg-primary text-white rounded-md hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55" type="submit">
              <i className="mdi mdi-cube-outline me-2"></i>
              Ver el estado de mi pedido
            </a>
            <a href="/catalog" className="mx-auto block underline text-primary text-sm">Seguir comprando</a>
          </div>
        </div>
      </div>
    </section>
  </>)
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Base {...properties} title='Gracias por tu compra'>
    <Onboarding {...properties} />
  </Base>);
})