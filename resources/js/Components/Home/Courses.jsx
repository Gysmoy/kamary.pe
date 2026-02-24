import Number2Currency from "../../Utils/Number2Currency"
import React, { useRef, useState } from "react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const coursesData = [
  {
    price: 1299,
    title: "Aprende mecánica automotriz",
    description: "Domina el diagnóstico y reparación de vehículos con nuestros cursos certificados. Desde lo básico hasta técnicas avanzadas.",
    buttonText: "Explorar todos los cursos",
    features: [
      { icon: "mdi-certificate-outline", text: "Certificado incluso" },
      { icon: "mdi-speedometer", text: "Acesso vitalício" }
    ]
  },
  {
    price: 999,
    title: "Electricidad automotriz",
    description: "Aprende a diagnosticar y reparar sistemas eléctricos modernos. Multímetros, diagramas y redes CAN.",
    buttonText: "Ver curso de electricidad",
    features: [
      { icon: "mdi-certificate-outline", text: "Certificado incluso" },
      { icon: "mdi-flash", text: "Laboratorio práctico" }
    ]
  },
  {
    price: 1599,
    title: "Tuning y performance",
    description: "Optimiza motores, suspensión y electrónica. Remapeo de ECU, turbo y preparación de pista.",
    buttonText: "Ver curso de tuning",
    features: [
      { icon: "mdi-trophy-outline", text: "Proyecto final" },
      { icon: "mdi-car-turbocharger", text: "Clases dinámicas" }
    ]
  }
];

const Courses = () => {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goPrev = () => swiperRef.current?.swiper.slidePrev();
  const goNext = () => swiperRef.current?.swiper.slideNext();

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-auto space-y-10">
      <Swiper
        ref={swiperRef}
        modules={[Autoplay, Navigation]}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop={true}
        spaceBetween={1000}
        slidesPerView={1}
        className="w-full !h-max !overflow-visible"
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
      >
        {coursesData.map((course, idx) => (
          <SwiperSlide key={idx}>
            <div className="bg-cart rounded-xl grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
              <div className="relative space-y-8 p-6 md:p-8 lg:p-10 bg-gradient-to-r from-cart to-transparent rounded-l-xl z-10">
                <div>
                  <span className="block text-xs uppercase">
                    A partir de: <b>S/ {Number2Currency(course.price)}</b>
                  </span>
                  <h4 className="font-title text-4xl font-semibold mb-4">{course.title}</h4>
                  <div>{course.description}</div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {course.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-deep">
                        <i className={`mdi ${f.icon} mdi-18px text-primary`} />
                      </div>
                      <span className="flex-1">{f.text}</span>
                    </div>
                  ))}
                </div>
                <button className="px-6 py-4 rounded-full bg-primary font-semibold uppercase">
                  {course.buttonText}
                </button>
              </div>
              <div className="relative z-0">
                <img
                  src="/assets/img/courses/course-1.png"
                  alt=""
                  className="relative md:absolute object-cover w-full md:w-[calc(100%+60px)] h-full md:h-[calc(100%+60px)] bottom-0 left-0"
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="flex justify-center gap-6">
        <button
          onClick={goPrev}
          className="h-10 w-10 rounded-full bg-secondary text-primary font-semibold"
          aria-label="Anterior"
        >
          <i className="mdi mdi-arrow-left mdi-18px" />
        </button>

        <div className="flex items-center gap-2">
          {coursesData.map((_, idx) => (
            <span
              key={idx}
              className={`h-3 rounded-full transition-all ${idx === activeIndex ? "w-6 bg-primary" : "w-3 bg-secondary"
                }`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className="h-10 w-10 rounded-full bg-secondary text-primary font-semibold"
          aria-label="Siguiente"
        >
          <i className="mdi mdi-arrow-right mdi-18px" />
        </button>
      </div>
    </div>
  );
};

export default Courses