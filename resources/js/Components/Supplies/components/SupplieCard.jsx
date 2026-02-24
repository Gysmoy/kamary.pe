import React from "react"

const SupplieCard = ({...supplie}) => {
  return <article className="w-full bg-white p-2 rounded-lg relative">
    <div className="w-full aspect-[5/4]">
      <img className="w-full aspect-square object-contain object-right-top absolute -top-4 -right-4" src={`/api/supplies/media/${supplie.image}`} alt={supplie.name} />
    </div>
    <div className="h-12 line-clamp-3 text-start">
      <h4 className="text-xs font-bold">{supplie.name}</h4>
      <p className="text-xs font-extralight">{supplie.description}</p>
    </div>
  </article>
}

export default SupplieCard