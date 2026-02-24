import { createRoot } from 'react-dom/client';
import Base from './Components/Tailwind/Base';
import CreateReactScript from './Utils/CreateReactScript';
import Number2Currency from './Utils/Number2Currency';
import { useEffect, useState } from 'react';
import { useBase } from './Components/Tailwind/BaseContext';
import buildSchedule from './Utils/buildSchedule';

const ItemDetail = ({ item, condition = {} }) => {

  const { addToCart, alreadyInCart } = useBase()

  const [selectedImage, setSelectedImage] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Toggle body scroll when zoom state changes
  useEffect(() => {
    if (zoomOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [zoomOpen]);

  const images = [`//assets.tcgdex.net/${item.card.language.code}/${item.card.expansion.serie.code}/${item.card.expansion.code}/${item.card.code.split('-')[1]}/high.webp`]

  if (item.front_image) images.push(`/storage/images/item/${item.front_image}`)
  if (item.back_image) images.push(`/storage/images/item/${item.back_image}`)

  return <>
    {zoomOpen && (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        onClick={() => setZoomOpen(false)}>
        <img
          src={images[selectedImage]}
          alt={item.card.fullname}
          className="max-w-full max-h-full object-contain rounded-lg cursor-default"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => {
            e.target.src = '/images/default/card.png';
          }}
        />
      </div>
    )}
    <section className="w-full py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 40/60 responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 w-full gap-8">
          {/* Images 40% */}
          <div className="col-span-1 lg:col-span-2 py-8 px-6 bg-white rounded-2xl flex flex-col items-center h-max">
            {/* Main image */}
            <img
              src={images[selectedImage]}
              alt={item.card.fullname}
              className="w-full max-w-xs aspect-[3/4] object-contain mb-6 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 cursor-zoom-in"
              onClick={() => setZoomOpen(true)}
              onError={(e) => {
                e.target.src = '/images/default/card.png';
              }}
            />
            {/* Thumbnail gallery */}
            <div className="flex gap-3 items-center justify-center">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`thumbnail-${idx}`}
                  className={`w-14 aspect-[3/4] object-contain rounded-md cursor-pointer transition-all duration-300 
                    ${selectedImage === idx ? 'opacity-100 ring-2 ring-blue-400' : 'opacity-20 hover:opacity-60'}`}
                  onClick={() => setSelectedImage(idx)}
                  onError={(e) => {
                    e.target.src = '/images/default/card.png';
                  }}
                />
              ))}
            </div>
          </div>

          {/* Content 60% */}
          <div className="col-span-1 lg:col-span-3 grid gap-4 h-max">
            <div className='p-6 rounded-lg bg-white flex flex-col sm:flex-row justify-between gap-4'>
              <div className='text-center sm:text-left'>
                <p className="text-sm text-gray-600">{item.card.expansion.code.toUpperCase()}: {item.card.expansion.name}</p>
                <h2 className="text-3xl font-bold italic text-gray-900">{item.card.fullname}</h2>
              </div>
            </div>
            <div className='p-6 rounded-lg bg-white'>
              <p className='text-sm mb-1'>Vendido por</p>
              <h3 className='text-lg text-primary font-medium'>
                {item.user.username}
                {item.user.verified && <i className='mdi mdi-check-decagram ms-1 text-primary' />}
              </h3>
              <div className='text-sm text-silver flex gap-1'>
                {/* <i className='mdi mdi-star '></i> */}
                <span>{item.user_sales} venta{item.user_sales != 1 && 's'}</span>
              </div>
              {/* <a href="" className='text-sm text-primary underline mt-3'>Ver mas de esta tienda</a> */}
            </div>
            <div className='p-6 rounded-lg bg-white space-y-4'>
              <div className='space-y-3'>
                <h4 className='text-lg font-semibold'>Detalles del producto</h4>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Condición:</p>
                  <div className='flex gap-2 items-center'>
                    <span className='block text-sm px-3 py-1 bg-[#EFF3F5] w-max rounded-full text-silver mb-1'>{condition.value}</span>
                    <small className='block text-sm'>{condition.label}</small>
                  </div>
                  <p className='text-silver text-xs'>{condition.desc}</p>
                </div>
                <div className='text-sm'>
                  <p className='font-medium'>Variante:</p>
                  <p className=''>{item.variant ?? 'Normal'}</p>
                </div>
                <div className='text-sm space-y-1'>
                  <p className='font-medium'>Idioma:</p>
                  <p className=''>{item.card.language.name}</p>
                </div>
              </div>
              <hr />
              <div className='space-y-2'>
                <p className='text-sm'>Precio por carta:</p>
                <h4 className='text-2xl font-bold'>S/ {Number2Currency(item.price)}</h4>
              </div>
              <div className='space-y-2'>
                <button
                  onClick={() => addToCart(item)}
                  disabled={alreadyInCart(item.id)}
                  className={`w-full px-4 py-2.5 text-sm rounded-lg flex transition justify-center items-center ${alreadyInCart(item.id) ? 'bg-primary/60 text-white cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'}`}
                >
                  <i className="mdi mdi-cart me-2"></i>
                  <span>{alreadyInCart(item.id) ? 'Ya en el carrito' : 'Añadir al carrito'}</span>
                </button>
                <p className='text-xs text-silver text-center'>Protección del comprador incluida • Tiendas de recojo confirmados al finalizar la compra</p>
              </div>
            </div>
            <div className='p-6 rounded-lg bg-white space-y-4'>
              <h4 className='text-lg font-semibold'>Puntos de entrega del vendedor</h4>
              <p>Podrás elegir el punto de recojo desde tu carrito de compras.</p>
              {item.delivery_points.map((point) => {
                return <div className='bg-[#F9FAFB] rounded-lg p-4 space-y-2'>
                  <h5 className='block text-sm'>{point.name}</h5>
                  <p className='block text-xs text-silver'>{point.address} {point.number} {point.reference && `(${point.reference})`}</p>
                  <small className='block text-xs text-silver'>{buildSchedule(point.opening_hours)}</small>
                </div>
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  </>;
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Base {...properties}>
    <ItemDetail {...properties} />
  </Base>);
})