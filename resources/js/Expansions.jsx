import { createRoot } from 'react-dom/client';
import Base from './Components/Tailwind/Base';
import CreateReactScript from './Utils/CreateReactScript';
import { useState, useEffect, useRef } from 'react';
import ExpansionsRest from '../js/Actions/expansions-rest'

const expansionsRest = new ExpansionsRest();

const Expansions = ({ languages }) => {
  const [query, setQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]?.id || '');
  const [expansions, setExpansions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchExpansions = async () => {
    setLoading(true);
    try {
      const response = await expansionsRest.paginate({
        isLoadingAll: true,
        filter: [
          ['serie.language_id', '=', selectedLanguage],
          'and',
          ['name', 'contains', query]
        ]
      });
      setExpansions(response.data || []);
    } catch (error) {
      setExpansions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpansions();
  }, [selectedLanguage, query]);

  const grouped = expansions.reduce((acc, expansion) => {
    const serie = expansion.serie?.name || 'Sin serie';
    if (!acc[serie]) acc[serie] = [];
    acc[serie].push(expansion);
    return acc;
  }, {});

  const filteredGrouped = Object.entries(grouped).reduce((acc, [serieName, expansions]) => {
    const filtered = expansions.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    if (filtered.length) acc[serieName] = filtered;
    return acc;
  }, {});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLangName = languages.find(l => l.id === selectedLanguage)?.name || '';

  const SkeletonCard = () => (
    <div className="border rounded-lg bg-white shadow-md animate-pulse">
      <div className="px-3 py-3 sm:px-4 sm:py-4 space-y-3">
        <div className="h-5 w-auto bg-gray-200 rounded"></div>
        <div className="w-56 h-28 sm:w-40 sm:h-20 md:w-48 md:h-24 bg-gray-200 rounded mx-auto"></div>
        <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  );

  return (
    <section className="w-full bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-3xl font-bold">Expansiones</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-auto" style={{ maxWidth: '320px' }}>
            <input
              type="text"
              className="border ps-4 pe-10 py-3 text-sm outline-none rounded-lg w-full"
              placeholder="Busca tu carta o producto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <i className="mdi mdi-magnify absolute right-4 top-1/2 -translate-y-1/2"></i>
          </div>

          {/* Language Dropdown aligned to the right */}
          <div className="relative ml-auto" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="border px-4 py-3 text-sm outline-none rounded-lg bg-white flex items-center justify-between min-w-[180px]"
            >
              <span>{selectedLangName}</span>
              <i className={`mdi mdi-chevron-down ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
                {languages.map((lang) => (
                  <div
                    key={lang.id}
                    onClick={() => {
                      setSelectedLanguage(lang.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${lang.id === selectedLanguage ? 'bg-gray-200 font-semibold' : ''}`}
                  >
                    {lang.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Skeleton loader while loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          /* Renderizar cada grupo de regiones */
          Object.entries(filteredGrouped).map(([serieName, expansions]) => (
            <div key={serieName} className="space-y-4">
              <h2 className="font-semibold text-silver">{serieName.toUpperCase()}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {expansions.map((expansion) => (
                  <a
                    key={expansion.code}
                    href={`/catalog?expansion=${expansion.code}&language=${expansion.serie.language.code}`}
                    className="block border px-3 py-3 sm:px-4 sm:py-4 rounded-lg bg-white shadow-md hover:scale-105 transition-all"
                  >
                    <img src={`//assets.tcgdex.net/univ/${expansion.serie.code}/${expansion.code}/symbol.webp`} alt="" className='h-5 w-6 object-contain' onError={(e) => { e.target.src = '/images/icon.png'; }} />
                    <img
                      src={`//assets.tcgdex.net/${expansion.serie.language.code}/${expansion.serie.code}/${expansion.code}/logo.webp`}
                      alt={expansion.name}
                      className="w-56 h-28 sm:w-40 sm:h-20 md:w-48 md:h-24 object-contain mx-auto"
                      onError={(e) => { e.target.src = '/images/logo.png'; }}
                    />
                    <h4 className="text-center font-bold text-sm sm:text-base">{expansion.name}</h4>
                    <small className='text-silver block text-center text-sm'>{expansion.cards_count || 0} Cartas</small>
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Base {...properties}>
    <Expansions {...properties} />
  </Base>);
})