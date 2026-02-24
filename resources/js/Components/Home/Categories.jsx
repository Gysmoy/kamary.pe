import React, { useRef } from "react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const Categories = () => {
  const swiperRef = useRef(null);

  const categories = [
    { img: '/assets/img/categories/originales.png', title: 'Originales' },
    { img: '/assets/img/categories/llantas.png', title: 'Llantas' },
    { img: '/assets/img/categories/baterias.png', title: 'Baterías' },
    { img: '/assets/img/categories/lubricantes.png', title: 'Lubricantes' },
    { img: '/assets/img/categories/kit-arrastre.png', title: 'Kit de arrastre' },
  ];

  const goPrev = () => swiperRef.current?.swiper.slidePrev();
  const goNext = () => swiperRef.current?.swiper.slideNext();

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-auto">
      <div className="space-y-10">
        <div className="relative flex flex-col md:flex-row gap-10 items-start md:justify-between md:items-center z-10">
          <div>
            <legend className="text-sm uppercase">Categorías</legend>
            <h4 className="font-title text-4xl font-semibold">
              Encuentra tus respuestos o accesorios
            </h4>
          </div>
          <div className="flex gap-2">
            <button
              onClick={goPrev}
              className="h-10 w-10 rounded-full bg-secondary text-primary font-semibold"
            >
              <i className="mdi mdi-arrow-left mdi-18px" />
            </button>
            <button
              onClick={goNext}
              className="h-10 w-10 rounded-full bg-secondary text-primary font-semibold"
            >
              <i className="mdi mdi-arrow-right mdi-18px" />
            </button>
          </div>
        </div>

        <Swiper
          ref={swiperRef}
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
          {categories.map((cat, idx) => (
            <SwiperSlide key={idx}>
              <div className="space-y-6">
                <img
                  src={cat.img}
                  alt=""
                  className="bg-white w-full aspect-square rounded-2xl object-cover object-center"
                />
                <div className="text-center">
                  <span className="block text-[10px] md:text-xs md:mb-2 uppercase">Marca</span>
                  <h4 className="block font-title text-sm md:text-lg lg:text-2xl">{cat.title}</h4>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Categories;
