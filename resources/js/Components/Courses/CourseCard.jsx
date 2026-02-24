import React from "react";
import Number2Currency from "../../Utils/Number2Currency";

const CourseCard = ({id, name, category, created_at, summary, image, price, firstImage = false, showPrice = false, clickable = false, showCategory = false }) => (
  <div className={`flex flex-col ${firstImage && 'flex-col-reverse'} w-full gap-4`}>
    <div>
      {
        showPrice && <p className="my-4 text-xl fotn-bold text-pink-600">S/.{Number2Currency(price)}</p>
      }
      <h3 className="text-xl md:text-2xl font-semibold tracking-tight line-clamp-2 h-16 text-ellipsis text-[#2B384F]">
        {name}
      </h3>
      <p className="mt-3 md:mt-5 text-sm line-clamp-3 text-ellipsis text-[#2E405E] h-[60px]">
        {summary}
      </p>
      {
        (clickable && showCategory) && <div className="flex justify-between items-center mt-4 sm:mt-5 md:mt-6 w-full gap-4">
          <a href={`/courses/${id}`} className="flex gap-2 items-center text-sm sm:text-base font-semibold leading-snug text-[#2B384F]">
            <span>{category?.name || 'Sin categoría'}</span>
            <i className="mdi mdi-arrow-top-right"></i>
          </a>
          <span className="text-xs sm:text-sm text-end font-medium leading-snug text-[#FF27B9]">
            {moment(created_at).format('ll')}
          </span>
        </div>
      }
    </div>
    <img
      src={`/api/courses/media/${image}`}
      alt={name}
      className={`w-full object-cover aspect-[1.1] ${clickable && 'cursor-pointer'}`}
      onError={e => e.target.src = `https://placehold.co/600x400?text=${name}`}
      onClick={() => clickable ? location.href = `/courses/${id}`: ''}    />
  </div>
);

export default CourseCard