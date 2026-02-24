import { createRoot } from 'react-dom/client';
import Base from './Components/Tailwind/Base';
import CreateReactScript from './Utils/CreateReactScript';
import { useBase } from './Components/Tailwind/BaseContext';
import Number2Currency from './Utils/Number2Currency';
import { useEffect } from 'react';
import CheckoutSummary from './Components/Public/Checkout/CheckoutSummary';

const Cart = ({ }) => {
    const { cart, removeFromCart } = useBase()

    if (cart?.length == 0) {
        useEffect(() => {
            const timer = setTimeout(() => {
                location.href = '/catalog';
            }, 3000);
            return () => clearTimeout(timer);
        }, []);

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
                    <i className="ti ti-shopping-cart-off text-6xl text-gray-400 mb-4"></i>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Carrito vacío</h2>
                    <p className="text-gray-600 mb-4">Redirigiendo al catálogo por no tener items en el carrito.</p>
                    <p className="text-sm text-gray-500">Por favor, agrega productos al carrito antes de proceder con el checkout.</p>
                    <div className="mt-6">
                        <div className="animate-pulse flex space-x-1 justify-center">
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                            <div className="h-2 w-2 bg-gray-400 rounded-full animation-delay-200"></div>
                            <div className="h-2 w-2 bg-gray-400 rounded-full animation-delay-400"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const groupedCart = cart?.reduce((acc, item) => {
        const userId = item.user?.uuid || 'unknown';
        if (!acc[userId]) {
            acc[userId] = {
                username: item.user?.username || 'unknown',
                verified: item.user?.verified,
                items: []
            };
        }
        acc[userId].items.push(item);
        return acc;
    }, {});
    console.log(cart)

    const isEmpty = cart?.length == 0
    return (
        <section className="w-full bg-[#EFF3F5] py-12 sm:py-16">
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6`}>
                <div>
                    <h4 className='text-3xl font-semibold mb-1'>Tu carrito</h4>
                </div>
                <div className='grid md:grid-cols-12 gap-6'>
                    <div className="md:col-span-7 flex-1 space-y-4 overflow-y-auto">
                        {isEmpty ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="absolute top-8 right-6 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <i className="mdi mdi-close text-silver text-2xl"></i>
                                </button>
                                <p className="text-lg font-semibold text-gray-700">Tu carrito está vacío</p>
                                <p className="text-sm text-silver mt-2 mb-4">Agrega productos para continuar</p>
                                <a
                                    href="/catalog"
                                    className="bg-[#007BFF] text-white px-4 py-2 rounded-lg hover:bg-[#0056b3] transition-colors"
                                >
                                    Ver catalogo
                                </a>
                            </div>
                        ) : (
                            Object.entries(groupedCart ?? []).map(([userId, group]) => (
                                <div key={userId} className="bg-white p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold flex gap-2 items-center">
                                        <i className="mdi mdi-store-outline" />
                                        <span>
                                            {group.username}
                                            {group.verified && <i className='mdi mdi-check-decagram ms-1 text-primary' />}
                                        </span>
                                    </h3>
                                    <hr className="my-4" />
                                    <div className="space-y-4">
                                        {group.items.map((item) => {
                                            return <div key={item.id} className="flex gap-4">
                                                <img src={`//assets.tcgdex.net/${item.card.language.code}/${item.card.expansion.serie.code}/${item.card.expansion.code}/${item.card.code.split('-')[1]}/low.webp`}
                                                    alt={item.card.fullname} className="w-20"
                                                    onError={(e) => {
                                                        e.target.src = '/images/default/card.png';
                                                    }} />
                                                <div className="flex-1 text-sm">
                                                    <p className="font-bold">{item.card.fullname}</p>
                                                    <p className="text-silver mb-2">{item.card.expansion.code.toUpperCase()}: {item.card.expansion.name}</p>
                                                    <p className='block text-sm px-3 py-1 bg-gray-50 w-max rounded-full text-silver mb-2'>{item.condition}</p>
                                                    <p className="text-silver">S/ {Number2Currency(item.price)} - c/u</p>
                                                </div>
                                                <div className="">
                                                    <div className="h-full flex flex-col items-end justify-evenly">
                                                        <span className="block text-sm">Cant. {item.quantity}</span>
                                                        {/* <div className="flex items-center border rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => changeQuantity(item, (item.quantity || 1) - 1)}
                                                        className="py-1.5 px-2.5 bg-white hover:bg-gray-100 text-sm disabled:bg-gray-100 disabled:text-silver disabled:cursor-not-allowed"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity || 1}
                                                        onChange={(e) => changeQuantity(item, e.target.value)}
                                                        className="py-1.5 w-10 p-2.5 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none outline-none"
                                                    />
                                                    <button
                                                        onClick={() => changeQuantity(item, (item.quantity || 1) + 1)}
                                                        className="py-1.5 px-2.5 bg-white hover:bg-gray-100 text-sm"
                                                    >
                                                        +
                                                    </button>
                                                </div> */}
                                                        <div className="flex-1 flex items-center">
                                                            <p>S/ {Number2Currency(item.price * (item.quantity || 1))}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-sm text-secondary underline"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className='col-span-5 p-6 bg-white rounded-lg space-y-6 h-max'>
                        <CheckoutSummary
                            showPrevButton={false}
                            onNextClicked={() => location.href = '/checkout'} />
                    </div>
                </div>
            </div>
        </section>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(<Base {...properties} title='Carrito'>
        <Cart {...properties} />
    </Base>);
});
