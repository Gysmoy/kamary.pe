import React, { useRef } from "react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Number2Currency from "../../Utils/Number2Currency"

const Bundles = () => {
    const swiperRef = useRef(null);

    const goPrev = () => swiperRef.current?.swiper.slidePrev();
    const goNext = () => swiperRef.current?.swiper.slideNext();

    // Array de paquetes (mínimo dos)
    const paquetes = [
        {
            id: 1,
            titulo: "Kit de Limpieza Básico",
            subtitulo: "Mantén tu moto impecable",
            etiqueta: "KIT LIMPIEZA",
            codigo: "KITLIMPIEZA",
            descripcion: "Kit esencial para la limpieza y mantenimiento de tu moto. Incluye productos especializados que cuidan cada componente, desde el chasis hasta el motor, dejando tu motocicleta con un acabado brillante y protegida contra la suciedad.",
            beneficios: [
                "Shampoo biodegradable que no daña la pintura ni los plásticos",
                "Cepillo multifuncional para limpiar rines y zonas difíciles",
                "Acondicionador de plásticos que revive los colores opacos",
                "Microfibra ultra suave que evita rayones en la carrocería"
            ],
            precioOriginal: 89,
            precioDescuento: 69,
            img: "/assets/img/bundles/bundle-1.png"
        },
        {
            id: 2,
            titulo: "Kit de Arrastre Pro",
            subtitulo: "Cadena, Piñón y Catalina",
            etiqueta: "ARRASTRE TOTAL",
            codigo: "ARRASTRE2025",
            descripcion: "Transforma la entrega de potencia de tu moto con este kit completo de arrastre de alta resistencia. Incluye cadena reforzada de eslabones sellados, piñón de aleación templada y catalina de precisión para una transferencia de potencia óptima y durabilidad extrema en cualquier terreno.",
            beneficios: [
                "Cadena de 520 con eslabones sellados al calor que triplica la vida útil",
                "Piñón de 15 dientes en acero al cromo-molibdeno con tratamiento térmico",
                "Catalina de 48 dientes en aleación 7075-T6 ultraligera y resistente",
                "Reduce el desgaste hasta un 70% y mejora la respuesta del acelerador"
            ],
            precioOriginal: 599,
            precioDescuento: 449,
            img: "/assets/img/bundles/bundle-2.png"
        }
    ];

    return (
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-auto">
            {/* Swiper que contiene los paquetes */}
            <Swiper
                ref={swiperRef}
                modules={[Navigation, Autoplay]}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                navigation={false}
                spaceBetween={1000}
                slidesPerView={1}
                loop={true}
                className="z-10"
            >
                {paquetes.map((p) => (
                    <SwiperSlide key={p.id}>
                        <div className="relative bg-container rounded-xl grid md:grid-cols-2 overflow-hidden h-full">
                            {/* Imagen cambiada dinámicamente */}
                            <div className="relative">
                                <img
                                    src={p.img}
                                    alt={p.titulo}
                                    className="w-full h-full object-cover object-center"
                                />
                                <span className="absolute bg-primary block top-0 left-0 font-semibold text-2xl px-6 py-2.5 pr-10 rounded-tr-[40px] rounded-br-2xl">
                                    {p.etiqueta}
                                </span>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Controles internos de navegación */}
                                <div className="relative flex flex-col-reverse md:flex-row gap-6 md:gap-10 items-start md:justify-between md:items-center z-10 mb-6">
                                    <div>
                                        <legend className="text-xs uppercase">{p.subtitulo}</legend>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={goPrev}
                                            className="h-10 w-10 rounded-full bg-secondary text-primary font-semibold"
                                            aria-label="Anterior"
                                        >
                                            <i className="mdi mdi-arrow-left mdi-18px" />
                                        </button>
                                        <button
                                            onClick={goNext}
                                            className="h-10 w-10 rounded-full bg-secondary text-primary font-semibold"
                                            aria-label="Siguiente"
                                        >
                                            <i className="mdi mdi-arrow-right mdi-18px" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-title text-4xl font-semibold">{p.titulo}</h4>
                                    <p className="text-sm mb-4">Aplica tu descuento: {p.codigo}</p>
                                    <div>{p.descripcion}</div>
                                </div>

                                <ul className="space-y-3">
                                    {p.beneficios.map((b, i) => (
                                        <li key={i} className="flex gap-2 items-start">
                                            <i className="mdi mdi-check-circle text-primary" />
                                            <span className="flex-1">{b}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="space-y-8">
                                    <div>
                                        <span className="font-title block text-sm line-through">S/ {Number2Currency(p.precioOriginal)}</span>
                                        <span className="font-title font-semibold text-3xl font-title">S/ {Number2Currency(p.precioDescuento)}</span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <button className="px-6 py-4 rounded-full bg-secondary font-semibold uppercase">
                                            Ver video
                                        </button>
                                        <button className="px-6 py-4 rounded-full bg-primary font-semibold uppercase">
                                            <i className="mdi mdi-cart-plus me-2" />
                                            Comprar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Fondo decorativo */}
            <div
                className="block absolute top-full right-0 translate-x-1/2 -translate-y-1/2 w-full max-w-6xl aspect-square z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(47, 59, 82, 0.66) 0%, rgba(47, 59, 82, 0) 70%)'
                }}
            />
        </section>
    );
};

export default Bundles;
