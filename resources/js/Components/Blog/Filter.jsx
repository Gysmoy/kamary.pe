import React from "react"

const Filter = ({ categories, filter, setFilter }) => {
  return <section className="p-[5%]">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-8 items-center">
      <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center lg:text-left">
        <h2 className="text-3xl md:text-4xl tracking-tighter">
          <span className="text-slate-700">Todas las </span>
          <span className="font-bold text-pink-600">Publicaciones</span>
          <br />
          <span className="text-slate-700">de nuestra newsletter</span>
        </h2>
      </div>

      <button className="col-span-1 md:col-span-1 lg:col-span-2 px-6 py-4 text-base uppercase rounded-3xl bg-slate-100 text-slate-900 flex items-center justify-center transition-all" onClick={() => setFilter(old => ({
        ...old,
        sortOrder: old.sortOrder == 'desc' ? 'asc' : 'desc'
      }))}>
        Ordenar por Mes
        <i className={`ml-2 mdi ${filter.sortOrder == 'asc' ? 'mdi-arrow-down' : 'mdi-arrow-up'}`}></i>
      </button>

      <label htmlFor="txt-search" className="col-span-1 md:col-span-1 lg:col-span-2 px-6 py-4 flex items-center rounded-3xl bg-slate-100">
        <i className="fas fa-search text-slate-500 mr-2"></i>
        <input
          id="txt-search"
          type="text"
          placeholder="Buscar publicación"
          className="w-full bg-transparent border-none outline-none text-slate-800"
          onChange={(e) => setFilter(old => ({
            ...old,
            search: e.target.value
          }))}
        />
      </label>

      <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-wrap gap-3 justify-center lg:justify-start">
        {
          categories.map((item, index) => {
            return <button key={index} className={`transition-all px-6 py-4 rounded-3xl ${item.id == filter.category ? 'bg-blue-800 text-slate-100' : 'bg-slate-100 text-slate-900'} uppercase`} onClick={() => setFilter(old => ({
              ...old,
              category: item.id == filter.category ? null : item.id
            }))}>
              {item.name}
            </button>
          })
        }
      </div>
    </div>
  </section>
}

export default Filter