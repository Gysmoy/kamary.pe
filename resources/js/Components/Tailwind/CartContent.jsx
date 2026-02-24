import Number2Currency from "../../Utils/Number2Currency";
import { useBase } from "./BaseContext";
import { useRef, useEffect } from "react";

const CartContent = ({ isCartOpen, setIsCartOpen }) => {

    const { cart, cartCount, totalAmount, removeFromCart, changeQuantity } = useBase()
    const cartRef = useRef(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    useEffect(() => {
        if (!isCartOpen) return;
        const el = cartRef.current;
        if (!el) return;

        const onTouchStart = e => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        };

        const onTouchEnd = e => {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                const deltaY = e.changedTouches[0].clientY - touchStartY.current;
                if (deltaY > 80) setIsCartOpen(false); // swipe down threshold
            } else {
                const deltaX = e.changedTouches[0].clientX - touchStartX.current;
                if (deltaX > 80) setIsCartOpen(false); // swipe right threshold
            }
        };

        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchend", onTouchEnd, { passive: true });

        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchend", onTouchEnd);
        };
    }, [isCartOpen, setIsCartOpen]);

    return <>
        {isCartOpen && (
            <div
                className="fixed inset-0 bg-[#040A14] bg-opacity-[88%] z-[100]"
                onClick={() => setIsCartOpen(false)} />
        )}
        <div
            ref={cartRef}
            className={`fixed flex flex-col top-0 right-0 h-[calc(100dvh-40px)] md:h-dvh max-w-[512px] rounded-t-xl md:rounded-l-xl w-full bg-cart shadow-lg transform transition-transform duration-300 z-[100] mt-10 md:mt-0 ${isCartOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"} p-6 space-y-6`}
        >
            {cartCount == 0 && (
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold font-title">Resumen del carrito</h2>
                    <p className="text-lg">{cartCount} {cartCount === 1 ? 'producto' : 'productos'} en tu carrito</p>
                </div>
            )}
            <div className="flex-1 space-y-6 overflow-y-auto scrollbar-hide">
                {/* <div className="h-full flex flex-col items-center justify-center text-center">
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="absolute top-6 right-6 rounded-lg transition-colors"
                    >
                        <i className="mdi mdi-close text-2xl"></i>
                    </button>
                    <p className="text-lg font-semibold">Tu carrito está vacío</p>
                    <p className="text-sm text-silver mt-2 mb-4">Agrega productos para continuar</p>
                    <a
                        href="/catalog"
                        className="bg-primary px-4 py-2 rounded-lg transition-colors"
                    >
                        Ver catalogo
                    </a>
                </div> */}
                <div className="flex gap-4">
                    <img src="/assets/img/items/item-1.png" alt="" className="w-24 h-24 rounded-lg object-cover object-center" />
                    <div className="flex-1 flex items-center">
                        <div className="space-y-2">
                            <p className="font-semibold font-title leading-tight h-10 line-clamp-2">Ponteira Esportiva CRT Titanium</p>
                            <p className="text-xs uppercase text-muted">AKRAPOVIC</p>
                            <p className="text-xs">
                                <span className="text-muted">SKU:</span>
                                <span className="ms-1">PE-983r35</span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <div className="flex flex-col justify-between h-full items-end">
                            <div className="flex">
                                <button
                                    className="h-8 w-8 rounded-full bg-secondary text-primary font-semibold"
                                    aria-label="Anterior"
                                >
                                    <i className="mdi mdi-minus mdi-18px" />
                                </button>
                                <span className="w-10 h-8 flex items-center justify-center">1</span>
                                <button
                                    className="h-8 w-8 rounded-full bg-secondary text-primary font-semibold"
                                    aria-label="Siguiente"
                                >
                                    <i className="mdi mdi-plus mdi-18px" />
                                </button>
                            </div>
                            <p className="text-lg font-semibold font-title">S/ {Number2Currency(299)}</p>
                            <button
                                className="flex items-center text-sm text-primary font-semibold"
                                onClick={() => removeFromCart(item.id)}
                            >
                                Eliminar
                                <i className="mdi mdi-trash-can-outline mdi-18px ms-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <img src="/assets/img/items/item-2.png" alt="" className="w-24 h-24 rounded-lg object-cover object-center" />
                    <div className="flex-1 flex items-center">
                        <div className="space-y-2">
                            <p className="font-semibold font-title leading-tight h-10 line-clamp-2">Ponteira Esportiva CRT Titanium</p>
                            <p className="text-xs uppercase text-muted">AKRAPOVIC</p>
                            <p className="text-xs">
                                <span className="text-muted">SKU:</span>
                                <span className="ms-1">PE-983r35</span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <div className="flex flex-col justify-between h-full items-end">
                            <div className="flex">
                                <button
                                    className="h-8 w-8 rounded-full bg-secondary text-primary font-semibold"
                                    aria-label="Anterior"
                                >
                                    <i className="mdi mdi-minus mdi-18px" />
                                </button>
                                <span className="w-10 h-8 flex items-center justify-center">1</span>
                                <button
                                    className="h-8 w-8 rounded-full bg-secondary text-primary font-semibold"
                                    aria-label="Siguiente"
                                >
                                    <i className="mdi mdi-plus mdi-18px" />
                                </button>
                            </div>
                            <p className="text-lg font-semibold font-title">S/ {Number2Currency(299)}</p>
                            <button
                                className="flex items-center text-sm text-primary font-semibold"
                                onClick={() => removeFromCart(item.id)}
                            >
                                Eliminar
                                <i className="mdi mdi-trash-can-outline mdi-18px ms-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <img src="/assets/img/items/item-3.png" alt="" className="w-24 h-24 rounded-lg object-cover object-center" />
                    <div className="flex-1 flex items-center">
                        <div className="space-y-2">
                            <p className="font-semibold font-title leading-tight h-10 line-clamp-2">Ponteira Esportiva CRT Titanium</p>
                            <p className="text-xs uppercase text-muted">AKRAPOVIC</p>
                            <p className="text-xs">
                                <span className="text-muted">SKU:</span>
                                <span className="ms-1">PE-983r35</span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <div className="flex flex-col justify-between h-full items-end">
                            <div className="flex">
                                <button
                                    className="h-8 w-8 rounded-full bg-secondary text-primary font-semibold"
                                    aria-label="Anterior"
                                >
                                    <i className="mdi mdi-minus mdi-18px" />
                                </button>
                                <span className="w-10 h-8 flex items-center justify-center">1</span>
                                <button
                                    className="h-8 w-8 rounded-full bg-secondary text-primary font-semibold"
                                    aria-label="Siguiente"
                                >
                                    <i className="mdi mdi-plus mdi-18px" />
                                </button>
                            </div>
                            <p className="text-lg font-semibold font-title">S/ {Number2Currency(299)}</p>
                            <button
                                className="flex items-center text-sm text-primary font-semibold"
                                onClick={() => removeFromCart(item.id)}
                            >
                                Eliminar
                                <i className="mdi mdi-trash-can-outline mdi-18px ms-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <img src="/assets/img/items/item-4.png" alt="" className="w-24 h-24 rounded-lg object-cover object-center" />
                    <div className="flex-1 flex items-center">
                        <div className="space-y-2">
                            <p className="font-semibold font-title leading-tight h-10 line-clamp-2">Ponteira Esportiva CRT Titanium</p>
                            <p className="text-xs uppercase text-muted">AKRAPOVIC</p>
                            <p className="text-xs">
                                <span className="text-muted">SKU:</span>
                                <span className="ms-1">PE-983r35</span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <div className="flex flex-col justify-between h-full items-end">
                            <div className="flex">
                                <button
                                    className="h-8 w-8 rounded-full bg-secondary text-primary font-semibold"
                                    aria-label="Anterior"
                                >
                                    <i className="mdi mdi-minus mdi-18px" />
                                </button>
                                <span className="w-10 h-8 flex items-center justify-center">1</span>
                                <button
                                    className="h-8 w-8 rounded-full bg-secondary text-primary font-semibold"
                                    aria-label="Siguiente"
                                >
                                    <i className="mdi mdi-plus mdi-18px" />
                                </button>
                            </div>
                            <p className="text-lg font-semibold font-title">S/ {Number2Currency(299)}</p>
                            <button
                                className="flex items-center text-sm text-primary font-semibold"
                                onClick={() => removeFromCart(item.id)}
                            >
                                Eliminar
                                <i className="mdi mdi-trash-can-outline mdi-18px ms-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <img src="/assets/img/items/item-1.png" alt="" className="w-24 h-24 rounded-lg object-cover object-center" />
                    <div className="flex-1 flex items-center">
                        <div className="space-y-2">
                            <p className="font-semibold font-title leading-tight h-10 line-clamp-2">Ponteira Esportiva CRT Titanium</p>
                            <p className="text-xs uppercase text-muted">AKRAPOVIC</p>
                            <p className="text-xs">
                                <span className="text-muted">SKU:</span>
                                <span className="ms-1">PE-983r35</span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <div className="flex flex-col justify-between h-full items-end">
                            <div className="flex">
                                <button
                                    className="h-8 w-8 rounded-full bg-secondary text-primary font-semibold"
                                    aria-label="Anterior"
                                >
                                    <i className="mdi mdi-minus mdi-18px" />
                                </button>
                                <span className="w-10 h-8 flex items-center justify-center">1</span>
                                <button
                                    className="h-8 w-8 rounded-full bg-secondary text-primary font-semibold"
                                    aria-label="Siguiente"
                                >
                                    <i className="mdi mdi-plus mdi-18px" />
                                </button>
                            </div>
                            <p className="text-lg font-semibold font-title">S/ {Number2Currency(299)}</p>
                            <button
                                className="flex items-center text-sm text-primary font-semibold"
                                onClick={() => removeFromCart(item.id)}
                            >
                                Eliminar
                                <i className="mdi mdi-trash-can-outline mdi-18px ms-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-deep rounded-2xl flex gap-4">
                    <span className="bg-cart h-[52px] w-[52px] flex items-center justify-center rounded-full">
                        <i className="mdi mdi-truck-outline mdi-24px text-primary" />
                    </span>
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between">
                            <p className="text-lg font-title font-semibold">Envio Gratis</p>
                            <p className="text-primary text-xl font-bold font-title">S/ {Number2Currency(500)}</p>
                        </div>
                        <div className="bg-muted w-full h-1.5 rounded-full">
                            <div className="bg-primary h-full rounded-full" style={{ width: '30%' }}></div>
                        </div>
                        <p className="text-sm text-muted">Estas a S/ 35.00 de calificar para envío gratuito!</p>
                    </div>
                </div>
            </div>
            {/* {cartCount != 0 && ( */}
            <hr className="border-secondary" />
            <div className="flex flex-col gap-8">
                <div className="flex justify-between items-center">
                    <span className="block text-lg font-medium">Total</span>
                    <p className="block text-2xl font-semibold font-title">S/ {Number2Currency(1257)}</p>
                </div>
                <div className="space-y-4">
                    <a
                        href="/cart"
                        onClick={() => handleAddToCart(item)}
                        className="block text-center w-full px-6 py-4 bg-primary text-sm text-white rounded-full uppercase"
                        type="button"
                    >
                        Pagar ahora
                    </a>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="w-full text-sm text-primary"
                    >
                        <i className="mdi mdi-chevron-left me-2"></i>
                        Seguir comprando
                    </button>
                </div>
            </div>
            {/* )} */}
        </div>
    </>
}

export default CartContent;