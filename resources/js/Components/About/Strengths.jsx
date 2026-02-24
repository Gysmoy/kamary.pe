import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const StrengthCard = ({ name, description }) => (
  <div className="p-5 bg-slate-100 w-full h-full">
    <div className="flex justify-between items-center w-full">
      <h3 className="text-2xl font-medium tracking-tight text-gray-800">{name}</h3>
    </div>
    <hr className='my-4 border-[#F8B62C] border-2' />
    <span className="text-sm text-gray-600 text-wrap">{description}</span>
  </div>
)

const Strengths = ({ strength, strengths }) => {

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 p-[5%] w-full">
      <div className="lg:col-span-2 w-full">
        <div className="w-full">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter leading-tight">
            <span className="text-slate-700">Inspirar </span>
            <span className="font-bold text-pink-600">hábitos saludables</span>
            <br />
            <span className="text-slate-700">en los demás en nuestra misión</span>
          </h2>
          <p className="mt-6 text-base md:text-lg leading-7 text-gray-600">
            {strength}
          </p>
        </div>
        <a href='/courses' className="flex gap-2 items-center px-6 py-4 mt-10 text-base font-medium tracking-normal text-white uppercase rounded-full bg-gray-800 hover:bg-gray-700 transition-colors duration-300 w-max">
          CURSOS Y TALLERES
          <i className='mdi mdi-arrow-top-right ms-1'></i>
        </a>
      </div>
      <div className="lg:col-span-3 w-full overflow-hidden">
        <Swiper
          modules={[Pagination]}
          spaceBetween={20}
          slidesPerView={2}
          loop
          pagination={{ clickable: true }}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: 20,
            },
            480: {
              slidesPerView: 2,
              spaceBetween: 24,
            },
            768: {
              slidesPerView: 1,
              spaceBetween: 30,
            },
            1024: {
              slidesPerView: 2,
              spaceBetween: 32,
            },
            1280: {
              slidesPerView: 3,
              spaceBetween: 32,
            },
          }}
          className='w-full'
        >
          {strengths.map((item, index) => (
            <SwiperSlide key={index} className="h-auto">
              <StrengthCard {...item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default Strengths