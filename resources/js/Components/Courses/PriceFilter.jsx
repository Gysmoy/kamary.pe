import React, { useState } from "react";

const PriceFilter = ({ filter, setFilter }) => {
  // Estados para manejar el rango de precios
  const [minPrice, setMinPrice] = useState(filter.minPrice || "00.00");
  const [maxPrice, setMaxPrice] = useState(filter.maxPrice || "00.00");

  // Estado para controlar la visibilidad del filtro de precios
  const [isPriceFilterVisible, setIsPriceFilterVisible] = useState(false);

  // Maneja el cambio del rango mínimo
  const handleMinPriceChange = (e) => {
    const value = e.target.value;
    setMinPrice(value);
    setFilter((old) => ({
      ...old,
      minPrice: value,
    }));
  };

  // Maneja el cambio del rango máximo
  const handleMaxPriceChange = (e) => {
    const value = e.target.value;
    setMaxPrice(value);
    setFilter((old) => ({
      ...old,
      maxPrice: value,
    }));
  };

  // Alterna la visibilidad del filtro de precios
  const togglePriceFilter = () => {
    setIsPriceFilterVisible(!isPriceFilterVisible);
  };

  return (
    <div className="flex flex-col mt-8 w-full leading-none text-[color:var(--Woodsmoke-950,#07090D)]">
      {/* Cabecera que alterna la visibilidad del filtro */}
      <div
        className="flex gap-2 items-center p-4 w-full text-base tracking-normal uppercase whitespace-nowrap rounded-3xl bg-slate-100 cursor-pointer"
        onClick={togglePriceFilter}
      >
        <div className="flex-1 shrink self-stretch my-auto not-italic basis-0">
          Precio
        </div>
        <i className={`mdi mdi-chevron-down text-2xl ${isPriceFilterVisible && 'rotate-180'}`}></i>
      </div>

      {/* Contenido del filtro que se muestra/oculta */}
      {isPriceFilterVisible && (
        <div className="flex gap-3 items-center mt-3 w-full uppercase whitespace-nowrap">
          <div className="flex flex-col flex-1 shrink justify-center self-stretch my-auto basis-0">
            <div $name="Desde" className="text-xs not-italic tracking-normal">
              Desde
            </div>
            <input
              type="number"
              value={minPrice}
              onChange={handleMinPriceChange}
              className="flex gap-2 items-center self-stretch px-6 py-4 mt-1 w-full text-base not-italic tracking-normal rounded-3xl border border-solid border-slate-100 max-md:px-5 outline-none"
              placeholder="00.00"
            />
          </div>

          <div className="flex flex-col flex-1 shrink justify-center self-stretch my-auto basis-0">
            <div $name="Hasta" className="text-xs not-italic tracking-normal">
              Hasta
            </div>
            <input
              type="number"
              value={maxPrice}
              onChange={handleMaxPriceChange}
              className="flex gap-2 items-center self-stretch px-6 py-4 mt-1 w-full text-base not-italic tracking-normal rounded-3xl border border-solid border-slate-100 max-md:px-5 outline-none"
              placeholder="00.00"
            />
          </div>
        </div>
      )}
    </div>
  );
}


export default PriceFilter