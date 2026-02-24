import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

const Expansions = ({ expansions = [] }) => {
    return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className=" font-bold mb-8 uppercase">Expansiones recientes</h2>

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
                    {expansions.map((expansion) => (
                        <SwiperSlide key={expansion.code}>
                            <div className="bg-white rounded-lg p-6 flex items-center hover:shadow-lg transition-shadow h-full">
                                <img
                                    src={`//assets.tcgdex.net/${expansion.serie.language.code}/${expansion.serie.code}/${expansion.code}/logo.webp`}
                                    alt={expansion.name}
                                    className="w-32 h-32 object-contain rounded flex-shrink-0"
                                />
                                <div className="ml-6 flex-1 text-left">
                                    <p className="text-silver text-sm mb-1">{expansion.serie.name}</p>
                                    <h3 className="text-lg sm:text-xl font-bold mb-4">{expansion.name}</h3>
                                    <a
                                        href={`/catalog?expansion=${expansion.code}&language=${expansion.serie.language.code}`}
                                        className="inline-block text-sm px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded transition-colors"
                                    >
                                        Compra ahora
                                    </a>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
    );
};

export default Expansions;
