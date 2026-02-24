import { createRoot } from 'react-dom/client';
import Base from './Components/Tailwind/Base';
import CreateReactScript from './Utils/CreateReactScript';
import Number2Currency from './Utils/Number2Currency';
import { useEffect, useState } from 'react';
import Dropdown from './Reutilizables/Utils/Dropdown/Dropdown';
import ItemsRest from './Actions/items-rest';
import { useBase } from './Components/Tailwind/BaseContext';

const itemsRest = new ItemsRest()

const CardDetail = ({ card, conditions }) => {

  const { addToCart, alreadyInCart, loadingCart } = useBase()

  const [condition, setCondition] = useState('');
  const [orderBy, setOrderBy] = useState('recommended');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState({});

  const getItems = async () => {
    setLoading(true)
    const res = await itemsRest.paginate({ cardId: card.id, condition, orderBy })
    setItems(res.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    getItems()
  }, [condition, orderBy])

  const handleQuantityChange = (itemId, value) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(1, parseInt(value) || 1) }));
  };

  const handleAddToCart = (item) => {
    addToCart({ ...item, card })
  };

  return <section className="w-full py-12 sm:py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-10 w-full gap-8">
        {/* Imagen tamaño 1 a la izquierda */}
        <div className="col-span-1 lg:col-span-3 py-8 px-10 bg-white rounded-2xl">
          <img
            src={`//assets.tcgdex.net/${card.language.code}/${card.expansion.serie.code}/${card.expansion.code}/${card.code.split('-')[1]}/low.webp`}
            alt={card.fullname} className="w-full"
            onError={(e) => {
              e.target.src = '/images/default/card.png';
            }} />
        </div>
        {/* Detalle tamaño 2 a la derecha */}
        <div className="col-span-1 lg:col-span-7 grid gap-6 h-max">
          <div className='p-4 rounded-lg bg-white flex flex-col sm:flex-row justify-between gap-4'>
            <div className='text-center md:text-start'>
              <p className="text-sm">{card.expansion.code.toUpperCase()}: {card.expansion.name}</p>
              <h2 className="text-3xl font-bold italic">{card.fullname}</h2>
            </div>
            <div className='text-center md:text-end'>
              <small className='text-sm'>
                <i className="ti ti-activity-heartbeat me-2 text-primary"></i>
                Precio de mercado
              </small>
              <p className="text-2xl font-bold text-success">S/ {Number2Currency(card.average || 0)}</p>
            </div>
          </div>
          <div className="flex gap-4 justify-center md:justify-start">
            <div className="flex items-center gap-4" >
              <label className="hidden md:block text-sm font-semibold">Condición:</label>
              <Dropdown
                label="Condición"
                value={condition}
                options={[{ value: '', label: 'Todas', count: card.items_count }, ...conditions]}
                onSelect={setCondition}
                renderItem={option => {
                  return <>
                    <span className='block truncate'>{option.label}</span>
                    <small className='block text-sm text-silver'>{option.count} cartas</small>
                  </>
                }}
              />
            </div>

            {/* Ordenar por */}
            <div className="flex items-center gap-4" >
              <label className="hidden md:block text-sm font-semibold">Ordenar por:</label>
              <Dropdown
                label="Ordenar por"
                value={orderBy}
                options={[
                  { value: 'recommended', label: 'Recomendado' },
                  { value: 'price', label: 'Precio' }
                ]}
                onSelect={setOrderBy}
              />
            </div>

          </div>
          <h4 className="text-2xl font-bold">
            {card.items_count} {card.items_count === 1 ? 'carta' : 'cartas'} en venta
          </h4>
          <div className='grid gap-4'>
            {items.map(item => {
              const condition = conditions.find(opt => opt.value === item.condition) || { label: 'Desconocida' }
              return <div key={item.id} className='bg-white rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='order-1'>
                  <h4 className='text-sm text-primary'>
                    {item.user.username}
                    {item.user.verified && <i className='mdi mdi-check-decagram ms-1' />}
                  </h4>
                  <div className='text-sm'>
                    {/* <i className='mdi mdi-star me-2' /> */}
                    <span className='text-silver'>({item.user_sales} venta{item.user_sales != 1 && 's'})</span>
                  </div>
                </div>
                <div className='order-3 md:order-2 flex md:block col-span-2 md:col-span-1 w-full items-center'>
                  <div className='flex-1 flex gap-2 items-center md:block'>
                    <span className='block text-sm px-3 py-1 bg-gray-50 w-max rounded-full text-silver mb-1'>{condition.value}</span>
                    <small className='block text-sm mb-1'>{condition.label}</small>
                    <span className='text-silver text-sm'>Variante: {item.variant ?? 'Normal'}</span>
                  </div>
                  {
                    (item.front_image || item.back_image) &&
                    <a href={`/item/${item.id}`} className='block underline text-sm text-primary'>
                      Ver fotos
                      <i className='mdi mdi-arrow-top-right ms-1'></i>
                    </a>
                  }
                </div>
                <div className='order-2 md:order-3 text-2xl font-bold self-center text-end md:text-start'>
                  S/ {Number2Currency(item.price || 0)}
                </div>
                <div className='order-4 col-span-2 md:col-span-1 flex items-center gap-2'>
                  {/* <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) - 1)}
                      className="px-4 py-2.5 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantities[item.id] || 1}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      className="w-12 py-2.5 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) + 1)}
                      className="px-4 py-2.5 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div> */}
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={alreadyInCart(item.id) || loadingCart}
                    className={`w-full px-4 py-2.5 text-sm rounded-lg flex transition justify-center items-center bg-primary text-white hover:bg-primary-dark disabled:bg-primary/60 disabled:text-white disabled:cursor-not-allowed`}
                  >
                    {
                      loadingCart
                        ? <>
                          <i className="mdi mdi-loading mdi-spin me-2"></i>
                          <span className='block'>Verificando</span>
                        </>
                        : <>
                          <i className="mdi mdi-cart me-2"></i>
                          <span className='block'>{alreadyInCart(item.id) ? 'Ya en el carrito' : 'Añadir al carrito'}</span>
                        </>
                    }
                  </button>
                </div>
              </div>
            })}
          </div>
        </div>
      </div>
    </div>
  </section>
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Base {...properties}>
    <CardDetail {...properties} />
  </Base>);
})