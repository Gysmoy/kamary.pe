import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay } from "swiper/modules";

const Banner = () => {
  const slides = [
    {
      desktop: '/assets/img/banners/banner-desktop.jpeg',
      tablet: '/assets/img/banners/banner-tablet.jpeg',
      mobile: '/assets/img/banners/banner-mobile.jpeg',
    },
    {
      desktop: '/assets/img/banners/banner-1.png',
      tablet: '/assets/img/banners/banner-2.png',
      mobile: '/assets/img/banners/banner-2.png',
    },
    {
      desktop: '/assets/img/banners/banner-desktop-2.jpeg',
      tablet: '/assets/img/banners/banner-tablet-2.jpeg',
      mobile: '/assets/img/banners/banner-mobile-2.jpeg',
    },
  ];

  return (
    <section className="relative z-10">
      <div className="max-w-7xl mx-auto">
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          loop
          modules={[Autoplay]}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
        >
          {slides.map((slide, idx) => (
            <SwiperSlide key={idx}>
              <picture>
                <source media="(min-width: 1024px)" srcSet={slide.desktop} />
                <source media="(min-width: 768px)" srcSet={slide.tablet} />
                <img
                  src={slide.mobile}
                  alt=""
                  className="w-full h-auto aspect-square md:aspect-[2] lg:aspect-[3] object-cover object-center"
                />
              </picture>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Banner;
