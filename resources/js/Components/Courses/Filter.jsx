import React from "react"

const Filter = ({ filter, setFilter }) => {
  return <section className="p-[5%] mt-16">
    <div className="flex flex-col justify-center w-full">
      <div
        $name="Todos nuestros Cursos & Talleres"
        className="text-2xl md:text-4xl not-italic font-medium text-[color:var(--Cerise-600,#EC008C)] max-md:text-4xl max-md:leading-[52px]"
      >
        <span className=" text-slate-700">Todos nuestros </span>
        <span className="font-bold text-pink-600">Cursos</span>{" "}
        <span className=" text-slate-700">& </span>
        <span className="font-bold text-pink-600">Talleres</span>
      </div>
      <div
        $name="Fusce a magna nec diam blandit hendrerit. In lobortis, est eget ultrices pharetra, est tortor pellentesque odio, ut auctor tortor ipsum ac orci."
        className="mt-6 text-base not-italic leading-6 text-[color:var(--Woodsmoke-900,#2B384F)]"
      >
        Fusce a magna nec diam blandit hendrerit. In lobortis, est eget ultrices
        pharetra, est tortor pellentesque odio, ut auctor tortor ipsum ac orci.
      </div>
    </div>
    <div className="flex flex-wrap gap-10 justify-between items-center mt-[5%] w-full text-base font-medium">
      <label htmlFor="txt-search" className="flex gap-2 items-center self-stretch px-6 py-4 my-auto rounded-3xl bg-slate-100 min-w-[240px] text-slate-900 w-[431px] max-md:px-5 max-md:max-w-full">
        <i className="mdi mdi-magnify"></i>
        <input
          id="txt-search"
          placeholder="Buscar curso"
          className="flex-1 shrink self-stretch my-auto basis-0 bg-transparent outline-none"
          onChange={(e) => setFilter(old => ({
            ...old,
            search: e.target.value
          }))}
        />
      </label>
      <button className="col-span-1 md:col-span-1 lg:col-span-2 px-6 py-4 text-base uppercase rounded-3xl bg-slate-100 text-slate-900 flex items-center justify-center transition-all" onClick={() => setFilter(old => ({
        ...old,
        sortOrder: old.sortOrder == 'desc' ? 'asc' : 'desc'
      }))}>
        Ordenar por precio
        <i className={`ml-2 mdi ${filter.sortOrder == 'asc' ? 'mdi-arrow-down' : 'mdi-arrow-up'}`}></i>
      </button>
    </div>
  </section>
}

export default Filter