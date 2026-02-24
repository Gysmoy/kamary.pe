import { useEffect, useRef, useState } from "react";

const FilterPanel = ({ query, setQuery, filter, setFilter, brands = [], models = [], years = [], onApply }) => {
    const brandSelected = filter.brand ? brands.find(b => b.id === filter.brand)?.name : 'Todas las marcas';
    const modelSelected = filter.model ? models.find(m => m.id === filter.model)?.name : 'Todos los modelos';
    const yearSelected = filter.year ? years.find(y => y.id === filter.year)?.name : 'Todos';

    const [brandOpen, setBrandOpen] = useState(false);
    const [modelOpen, setModelOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

    const brandDropdownRef = useRef(null);
    const modelDropdownRef = useRef(null);
    const yearDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
                setBrandOpen(false);
            }
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
                setModelOpen(false);
            }
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
                setYearOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return <div className="space-y-6">
        <div className="flex items-center font-semibold">
            <i className="mdi mdi-motorbike mdi-18px text-primary me-2"></i>
            Mi moto
        </div>
        {/* Search input */}
        {/* <div>
            <span className="text-sm block mb-2">Buscar</span>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar marca, modelo o año..."
                className="w-full border rounded px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
        </div> */}

        {/* Marca dropdown */}
        <div className="relative" ref={brandDropdownRef}>
            <span className="text-xs block font-medium mb-2">Marca</span>
            <button
                onClick={() => setBrandOpen(!brandOpen)}
                className="w-full border rounded-full px-4 py-3  bg-light text-deep font-medium text-left flex items-center justify-between"
            >
                {brandSelected}
                <i className={`mdi mdi-chevron-down transition-transform ${brandOpen ? 'rotate-180' : ''}`} />
            </button>
            {brandOpen && (
                <ul className="absolute z-10 w-full bg-light text-deep border rounded shadow-lg mt-1 max-h-60 overflow-auto">
                    <li
                        onClick={() => {
                            setFilter({ ...filter, brand: null, model: null });
                            setBrandOpen(false);
                        }}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                    >
                        Todas las marcas
                    </li>
                    {brands.map((brand) => (
                        <li
                            key={brand.id}
                            onClick={() => {
                                setFilter({ ...filter, brand: brand.id, model: null });
                                setBrandOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                        >
                            {brand.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* Modelo dropdown */}
        <div className="relative" ref={modelDropdownRef}>
            <span className="text-xs block font-medium mb-2">Modelo</span>
            <button
                onClick={() => setModelOpen(!modelOpen)}
                className="w-full border rounded-full px-4 py-3 bg-light text-deep font-medium text-left flex items-center justify-between"
            >
                {modelSelected}
                <i className={`mdi mdi-chevron-down transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
            </button>
            {modelOpen && (
                <ul className="absolute z-10 w-full bg-light text-deep border rounded shadow-lg mt-1 max-h-60 overflow-auto">
                    <li
                        onClick={() => {
                            setFilter({ ...filter, model: null });
                            setModelOpen(false);
                        }}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                    >
                        Todos los modelos
                    </li>
                    {models.map((model) => (
                        <li
                            key={model.id}
                            onClick={() => {
                                setFilter({ ...filter, model: model.id });
                                setModelOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                        >
                            {model.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* Año dropdown */}
        <div className="relative" ref={yearDropdownRef}>
            <span className="text-xs block font-medium mb-2">Año</span>
            <button
                onClick={() => setYearOpen(!yearOpen)}
                className="w-full border rounded-full px-4 py-3 bg-light text-deep font-medium text-left flex items-center justify-between"
            >
                {yearSelected}
                <i className={`mdi mdi-chevron-down transition-transform ${yearOpen ? 'rotate-180' : ''}`} />
            </button>
            {yearOpen && (
                <ul className="absolute z-10 w-full bg-light text-deep border rounded shadow-lg mt-1 max-h-60 overflow-auto">
                    <li
                        onClick={() => {
                            setFilter({ ...filter, year: null });
                            setYearOpen(false);
                        }}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                    >
                        Todos
                    </li>
                    {years.map((year) => (
                        <li
                            key={year.id}
                            onClick={() => {
                                setFilter({ ...filter, year: year.id });
                                setYearOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                        >
                            {year.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </div>
}

export default FilterPanel