import { createRoot } from 'react-dom/client';
import Base from './Components/Tailwind/Base';
import CreateReactScript from './Utils/CreateReactScript';
import { useState, useRef, useEffect } from 'react';
import FilterPanel from './Components/Public/Catalog/FilterPanel';
import CardComponent from './Components/Public/Cards/CardComponent';
import { GET } from 'sode-extend-react';
import CatalogRest from './Actions/catalog-rest';

const catalogRest = new CatalogRest();

const Catalog = ({ conditions = [], languages = [], deliveryPoints = [] }) => {
  // Mobile filter drawer state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [sort, setSort] = useState({
    label: 'Precio: Mayor a menor',
    field: 'average',
    order: 'desc',
  });

  const sortDropdownRef = useRef(null);
  const pageDropdownRef = useRef(null);

  // Data for dropdown options
  const sortOptions = [{
    label: 'Precio: Menor a Mayor',
    field: 'average', order: 'asc',
  }, {
    label: 'Precio: Mayor a menor',
    field: 'average', order: 'desc',
  }, {
    label: 'Nombre: A-Z',
    field: 'fullname', order: 'asc',
  }, {
    label: 'Nombre: Z-A',
    field: 'fullname', order: 'desc',
  }];

  const [categories, setCategories] = useState([]);

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState(GET.search || null);
  const [filter, setFilter] = useState({
    categories: GET.categories ? [GET.categories] : null,
    conditions: [],
    language: GET.language ?? null,
    delivery: null,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const take = 8;

  const totalPages = Math.ceil(totalCount / take);

  const applyFilters = async (page = 1) => {
    setLoading(true);
    try {
      const response = await catalogRest.paginate({
        searchValue: query,
        expansion: filter.expansion,
        conditions: filter.conditions,
        language: filter.language,
        delivery: filter.delivery,
        take,
        skip: (page - 1) * take,
        sort
      });
      setCards(response.data ?? []);
      setTotalCount(response.totalCount);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load cards on initial mount
  useEffect(() => {
    applyFilters(currentPage);
  }, [filter, sort]);

  // Debounce search query changes
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query !== null) {
        applyFilters(1);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const isFiltering = query || filter.expansion || filter.conditions.length || filter.language || filter.delivery;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target)) {
        setShowPageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    if (page === currentPage) return; // Prevent unnecessary refresh
    applyFilters(page);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={i === currentPage}
          className={`text-sm w-10 h-10 rounded-lg shadow ${i === currentPage ? 'bg-primary text-white' : 'bg-white'}`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  const [showPageDropdown, setShowPageDropdown] = useState(false);

  const handlePageDropdownSelect = (page) => {
    setShowPageDropdown(false);
    handlePageChange(page);
  };

  return (
    <section className='relative space-y-4 sm:space-y-8 lg:space-y-10 py-8 sm:py-16 lg:py-20'>
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-auto'>
        <legend className="text-xs uppercase">Categoría - Todas</legend>
        <h4 className="font-title text-4xl font-semibold">
          Lista de productos
        </h4>
      </div>
      <hr className='border-secondary' />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Mobile filter toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="w-full border rounded-lg px-4 py-2.5 bg-white text-sm flex items-center justify-between"
          >
            <span>Filtros</span>
            <i className="mdi mdi-filter-variant" />
          </button>
        </div>

        <div className="grid md:grid-cols-7 gap-8">
          {/* Desktop filter sidebar */}
          <aside className="hidden md:block md:col-span-2 h-max">
            <div className='flex justify-between items-center mb-4'>
              <h4 className="font-medium text-sm uppercase">Filtros</h4>
              <button className='text-primary text-sm font-semibold font-title'>Limpiar</button>
            </div>
            <hr className='border-secondary mb-6' />
            <div className='border border-secondary rounded-3xl p-4 mb-6'>
              <FilterPanel
                query={query} setQuery={setQuery}
                filter={filter} setFilter={setFilter}
                conditions={conditions}
                languages={languages}
                deliveryPoints={deliveryPoints}
                onApply={() => applyFilters(1)} />
            </div>
            <div className='space-y-4'>
              <div className='flex justify-between cursor-pointer'>
                <span className='font-semibold'>Categoria</span>
                <i className='mdi mdi-chevron-down'></i>
              </div>
              <ul className='space-y-1'>
                {/* Dummy categories for tubo de escape, frenos, suspension, motor, etc. */}
                {[
                  { id: 1, name: 'Tubo de escape' },
                  { id: 2, name: 'Frenos' },
                  { id: 3, name: 'Suspensión' },
                  { id: 4, name: 'Motor' },
                  { id: 5, name: 'Transmisión' },
                  { id: 6, name: 'Dirección' },
                ].map((category) => {
                  return <li key={category.id}>
                    <label className='inline-flex items-center cursor-pointer font-semibold'>
                      <input
                        type='checkbox'
                        className='form-checkbox h-5 w-5 text-primary hidden'
                        checked={filter.category === category.id}
                        onChange={() => setFilter(prev => ({ ...prev, category: prev.category === category.id ? null : category.id }))}
                      />
                      <i className='mdi mdi-check-circle text-primary mdi-18px'></i>

                      <span className='ml-2'>{category.name}</span>
                    </label>
                  </li>
                })}
              </ul>
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Filtros</h4>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-2xl leading-none"
                  >
                    <i className="mdi mdi-close" />
                  </button>
                </div>
                <FilterPanel
                  query={query} setQuery={setQuery}
                  filter={filter} setFilter={setFilter}
                  conditions={conditions}
                  languages={languages}
                  deliveryPoints={deliveryPoints}
                  onApply={() => applyFilters(1)} />
              </div>
            </div>
          )}

          {/* Cards grid */}
          <main className="md:col-span-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4 mb-4">
              <span className="font-medium">
                {loading ? 'Cargando...' : `${totalCount} resultados`}
              </span>
              <div className="flex-1 flex gap-4 justify-end items-center">
                <span className="text-sm font-semibold">Ordenar por</span>
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="border rounded px-4 py-2.5 bg-white text-left min-w-[200px] flex items-center justify-between text-sm"
                  >
                    {sort.label}
                    <i className={`mdi mdi-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''} ms-1`} />
                  </button>
                  {isOpen && (
                    <ul className="absolute right-0 mt-2 w-full bg-white border rounded shadow-lg z-10">
                      {sortOptions.map((opt) => (
                        <li
                          key={opt.label}
                          onClick={() => {
                            setSort(opt)
                            setIsOpen(false);
                          }}
                          className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                          {opt.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: take }).map((_, idx) => (
                  <div key={idx} className="flex border bg-white rounded-lg p-6 gap-6 animate-pulse">
                    <div className="w-28 h-40 bg-gray-200 rounded" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-6 bg-gray-200 rounded w-1/4" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <i className="mdi mdi-inbox text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {isFiltering ? 'No hay resultados para esta búsqueda' : 'Aún no hay cartas registradas'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {isFiltering ? 'Intenta ajustar tus filtros' : 'Sé el primero en registrar una carta'}
                </p>
                {!isFiltering && (
                  <a
                    href="/my-collection"
                    className="inline-block bg-primary text-white rounded-lg px-6 py-2.5 text-sm hover:opacity-90 transition-opacity font-light"
                  >
                    Registrar carta
                  </a>
                )}
              </div>
            ) : (<>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {cards.map((card) => {
                  return <CardComponent key={card.id} {...card} />
                })}
              </div>
              {totalPages > 1 && (
                <div className='mt-8 flex flex-wrap justify-center gap-4'>
                  <div className='flex justify-center gap-4'>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className='text-sm w-10 h-10 disabled:opacity-50'
                    >
                      <i className='mdi mdi-chevron-left'></i>
                    </button>
                    {renderPaginationButtons()}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className='text-sm w-10 h-10 disabled:opacity-50'
                    >
                      <i className='mdi mdi-chevron-right'></i>
                    </button>
                  </div>
                  <div className="relative" ref={pageDropdownRef}>
                    <button
                      onClick={() => setShowPageDropdown(!showPageDropdown)}
                      className='text-sm px-4 h-10 rounded-lg bg-white shadow flex items-center'
                    >
                      Página {currentPage}
                      <i className={`mdi mdi-chevron-down ms-2 transition-transform ${showPageDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showPageDropdown && (
                      <ul className="absolute right-0 top-full mt-1 w-full bg-white border rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <li
                            key={page}
                            onClick={() => handlePageDropdownSelect(page)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          >
                            Página {page}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Base {...properties} title='Catálogo'>
    <Catalog {...properties} />
  </Base>);
});
