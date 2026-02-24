import Number2Currency from "../../../Utils/Number2Currency";

const CardComponent = ({ ...card }) => {
    return <a href={`/card/${card.id}`}
        className={`block ${card.items_count == 0 ? 'cursor-default' : ''}`}
        onClick={e => {
            if (card.items_count == 0) e.preventDefault()
        }}>
        <div key={card.id} className="flex border bg-white rounded-lg p-6 gap-4">
            <img
                src={`//assets.tcgdex.net/${card.language.code}/${card.expansion.serie.code}/${card.expansion.code}/${card.code.split('-')[1]}/low.webp`}
                alt={card.name}
                className="w-28 h-auto bg-gray-300 aspect-[3/4] rounded"
                onError={(e) => {
                    e.target.src = '/images/default/card.png';
                }}
            />
            <div className="flex-1">
                <h4 className="font-bold mb-2">{card.fullname}</h4>
                <small className="block text-silver text-sm mb-2">
                    {card.expansion.code.toUpperCase()}: {card.expansion.name}
                </small>
                {card.items_count > 0 ? <>
                    <span className="block text-sm">{card.items_count} en venta desde</span>
                    <span className="block text-xl font-bold mb-2">
                        S/ {Number2Currency(card.cheapest?.price || 0)}
                    </span>
                    <p className="text-sm font-semibold">
                        Precio de mercado:{' '}
                        <span className="text-green-600">
                            S/ {Number2Currency(card.average || 0)}
                        </span>
                    </p>
                </> : (
                    <div className="flex gap-2 mb-2">
                        <span className="px-3 py-1 bg-black text-white text-sm rounded-full">Agotado</span>
                        <span className="px-3 py-1 bg-secondary text-white text-sm rounded-full">
                            <i className="mdi mdi-tag me-1"></i>
                            Pre-venta
                        </span>
                    </div>
                )}

            </div>
        </div>
    </a>
}

export default CardComponent