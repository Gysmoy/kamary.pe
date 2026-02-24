import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Number2Currency from "../../Utils/Number2Currency";

const Items = () => {
    const items = [
        {
            img: '/assets/img/items/item-1.png',
            title: 'Colector  2x1 Inox Polido R-77 MT-07',
            price: 1299
        },
        {
            img: '/assets/img/items/item-2.png',
            title: 'Tuvo de escape Full System Carbon Racing - Honda CB 650R',
            price: 1299
        },
        {
            img: '/assets/img/items/item-3.png',
            title: 'Guantes de Cuero Profesional XR-2026',
            price: 450
        },
        {
            img: '/assets/img/items/item-4.png',
            title: 'Ponteira Esportiva CRT Titanium',
            price: 1299
        },
    ];

    return <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-auto">
        <div className="space-y-10">
            <div className="relative flex flex-col md:flex-row gap-10 items-start md:justify-between md:items-center z-10">
                <div>
                    <legend className="text-sm uppercase">Productos</legend>
                    <h4 className="font-title text-4xl font-semibold">Produtos destacados</h4>
                </div>
                <button className="py-4 px-6 rounded-full bg-container font-semibold">
                    VER CATÁLOGO
                </button>
            </div>
            <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={24}
                slidesPerView={2}
                loop={true}
                autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                }}
                breakpoints={{
                    640: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                }}
            >
                {[...items, ...items].map((cat, idx) => (
                    <SwiperSlide key={idx}>
                        <div className="space-y-6">
                            <div className="relative w-full aspect-[6/5] rounded-2xl overflow-hidden">
                                <img
                                    src={cat.img}
                                    alt=""
                                    className="bg-white w-full h-full object-cover object-center"
                                />
                                <span className="absolute bg-primary block top-0 left-0 font-bold text-xs md:text-sm px-4 py-2 pr-6 rounded-tr-[40px] rounded-br-2xl">Nuevo ingreso</span>
                                <button className="absolute right-4 top-4 w-8 h-8 bg-primary rounded-full">
                                    <i className="mdi mdi-heart-outline mdi-24px"></i>
                                </button>
                            </div>
                            <div className="">
                                <span className="block text-[10px] md:text-xs md:mb-2 uppercase">Marca</span>
                                <h4 className="block font-title text-lg font-semibold overflow-hidden mb-4 h-14" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {cat.title}
                                </h4>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
                                    <div className="flex-1">
                                        <span className="font-title block text-xs line-through">S/ {Number2Currency(1529)}</span>
                                        <span className="font-title font-semibold text-lg font-title">S/ {Number2Currency(1299)}</span>
                                    </div>
                                    <button className="text-primary font-semibold text-sm">
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    </section>
}

export default Items