import React, { useEffect, useState } from "react"
import FilterPagination from "../../Reutilizables/Pagination/FilterPagination"
import CourseCard from "./CourseCard"
import CoursesRest from "../../Actions/CoursesRest"
import ArrayJoin from "../../Utils/ArrayJoin"
import { ChevronDown, ChevronUp } from "lucide-react"
import PriceFilter from "./PriceFilter"

const coursesRest = new CoursesRest()

export default function Results({ categories, filter, setFilter }) {
  const [results, setResults] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [showCategories, setShowCategories] = useState(true)

  useEffect(() => {
    const filter2search = []

    if (filter.search) {
      filter2search.push(
        ['name', 'contains', filter.search || ''],
        ['summary', 'contains', filter.search || ''],
      )
    }

    // Filtrar por categorías si están definidas
    if (filter.categories) {
      filter2search.push(ArrayJoin(filter.categories.map(x => (['category.id', '=', x])), 'or'))
    }

    // Filtrar por precio o descuento
    if (filter.minPrice || filter.maxPrice) {
      filter2search.push([
        [
          ['discount', '>', 0], // Si el descuento es mayor a 0, usamos el descuento
          ['discount', '>=', filter.minPrice || 0],
          ['discount', '<=', filter.maxPrice || Infinity],
        ],
        'or',
        [
          ['discount', '=', 0], // Si el descuento es 0, usamos el precio
          ['price', '>=', filter.minPrice || 0],
          ['price', '<=', filter.maxPrice || Infinity],
        ]
      ])
    }

    // Ejecutar la paginación con los filtros
    coursesRest.paginate({
      filter: ArrayJoin(filter2search, 'and'),
      requireTotalCount: true,
      skip: 12 * (currentPage - 1) < 0 ? 0 : 12 * (currentPage - 1),
      sort: [{ selector: 'price', desc: filter.sortOrder === 'desc' }],
      take: 12,
    })
      .then(({ status, data, totalCount }) => {
        if (status !== 200) return
        setPages(Math.ceil(totalCount / 12))
        setResults(data)
      })
  }, [filter, currentPage])


  return (
    <div className="p-[5%] pt-0 flex flex-col sm:flex-row">
      <div className="w-full sm:w-1/2 md:w-1/2 lg:w-1/3 xl:w-1/4 mb-4 sm:mb-0 sm:mr-4">
        <div className="flex flex-col w-full">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="flex justify-between items-center p-4 w-full text-base uppercase rounded-3xl bg-slate-100 text-gray-900"
          >
            <span>Categorías</span>
            {showCategories ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showCategories && (
            <div className="flex flex-col mt-1 w-full text-sm leading-snug text-gray-800">
              {categories.map((item, index) => (
                <label key={index} className="flex gap-3 items-center px-4 py-2.5 w-full">
                  <span className="flex-1">{item.name}</span>
                  <input
                    type="checkbox"
                    checked={filter.categories?.includes(item.id) || false} // Asegura que el estado refleje si el checkbox está marcado
                    onChange={(e) =>
                      setFilter((old) => {
                        let newCategories = [...(old.categories ?? [])] // Copia segura del array
                        if (e.target.checked) {
                          if (!newCategories.includes(item.id)) {
                            newCategories.push(item.id) // Agrega solo si no está en el array
                          }
                        } else {
                          newCategories = newCategories.filter((x) => x !== item.id) // Remueve el ID si está desmarcado
                        }
                        return {
                          ...old,
                          categories: newCategories,
                        }
                      })
                    }
                  />
                </label>
              ))}
            </div>
          )}
        </div>
        <PriceFilter filter={filter} setFilter={setFilter} />
      </div>
      <div className="w-full sm:w-1/2 md:w-1/2 lg:w-2/3 xl:w-3/4">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8 items-start">
          {results.map((item, index) => (
            <CourseCard key={index} {...item} firstImage showPrice clickable showCategory />
          ))}
        </div>
        <div className="p-[5%]">
          <FilterPagination pages={pages} current={currentPage} setCurrent={setCurrentPage} />
        </div>
      </div>
    </div>
  )
}