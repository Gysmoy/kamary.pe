import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import Number2Currency from "../../../Utils/Number2Currency"
import CardComponent from "../Cards/CardComponent"

const Items = ({ title, items, striped = false }) => {
    return (
        // <section className={`w-full ${striped ? 'bg-[#EFF3F5]' : 'bg-white'} py-12 sm:py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-bold mb-8 uppercase">{title}</h2>

            <Swiper
                modules={[Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                }}
                loop
                autoplay={{ delay: 3000, disableOnInteraction: false }}
            >
                {[...items, ...items].map((item) => (
                    <SwiperSlide key={item.id || item.code}>
                        <CardComponent {...item} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
        // </section>
    )
}
export default Items