import { createRoot } from 'react-dom/client';
import Base from './Components/Tailwind/Base';
import CreateReactScript from './Utils/CreateReactScript';
import { useState } from 'react';

const Pokedex = ({ pokedex }) => {
  const [query, setQuery] = useState('');

  const grouped = pokedex.reduce((acc, pokemon) => {
    const region = pokemon.region?.name || 'Sin región';
    if (!acc[region]) acc[region] = [];
    acc[region].push(pokemon);
    return acc;
  }, {});

  const handleCardClick = (searchQuery) => {
    window.location.href = `/catalog?search=${searchQuery}`;
  };

  const filteredGrouped = Object.entries(grouped).reduce((acc, [regionName, pokemons]) => {
    const filtered = pokemons.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.number.toString().includes(query)
    );
    if (filtered.length) acc[regionName] = filtered;
    return acc;
  }, {});

  return (
    <section className="w-full bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-3xl font-bold">Pokedex</h1>
        <div className="relative w-full" style={{ maxWidth: '320px' }}>
          <input
            type="text"
            className="border ps-4 pe-10 py-3 text-sm outline-none rounded-lg w-full"
            placeholder="Busca tu carta o producto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <i className="mdi mdi-magnify absolute right-4 top-1/2 -translate-y-1/2"></i>
        </div>

        {/* Renderizar cada grupo de regiones */}
        {Object.entries(filteredGrouped).map(([regionName, pokemons]) => (
          <div key={regionName} className="space-y-4">
            <h2 className="font-semibold text-silver">{regionName.toUpperCase()}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {pokemons.map((pokemon) => (
                <div
                  key={pokemon.number}
                  className="border px-3 py-3 sm:px-4 sm:py-4 rounded-lg bg-white cursor-pointer shadow-md hover:scale-105 transition-all"
                  onClick={() => handleCardClick(pokemon.name)}
                >
                  <i className='text-silver text-xs sm:text-sm'>#{pokemon.number}</i>
                  <img
                    src={`//static.dextcg.com/resources/pokemons/${pokemon.number}.png`}
                    alt={pokemon.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain mx-auto"
                  />
                  <h4 className="text-center font-bold text-sm sm:text-base">{pokemon.name}</h4>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Base {...properties}>
    <Pokedex {...properties} />
  </Base>);
})