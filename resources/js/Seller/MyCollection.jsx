import { createRoot } from 'react-dom/client';
import Base from '../Components/Tailwind/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import { useEffect, useRef, useState } from 'react';
import CardsRest from '../Actions/Seller/cards-rest';
import Global from '../Utils/Global';
import Number2Currency from '../Utils/Number2Currency';
import Tippy from '@tippyjs/react';
import PriceAdvisor from '../Components/Seller/MyCollection/PriceAdvisor';
import buildSchedule from '../Utils/buildSchedule';
import Swal from 'sweetalert2';
import { useBase } from '../Components/Tailwind/BaseContext';

const cardsRest = new CardsRest();

const MyCollection = ({ points, languages, conditions }) => {

    const { session } = useBase()

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Step state: 0 = listado, 1: Carta, 2: Condición, 3: Precio, 4: Publicar
    const [step, setStep] = useState(0);

    // Language dropdown state
    const [selectedLang, setSelectedLang] = useState(languages[0]);

    // Wizard state
    const [selectedCard, setSelectedCard] = useState(null);
    const [variant, setVariant] = useState(null);
    const [condition, setCondition] = useState(null);
    const [price, setPrice] = useState(null);
    const [deliveryPoints, setDeliveryPoints] = useState([]);

    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [loadingCard, setLoadingCard] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [saving, setSaving] = useState(false);

    // Listado de cartas publicadas
    const [cards, setCards] = useState([]);
    const [loadingCards, setLoadingCards] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showPageDropdown, setShowPageDropdown] = useState(false);
    const pageDropdownRef = useRef(null);
    const pageSize = 12;

    // Editing state
    const [editingCardId, setEditingCardId] = useState(null);

    const handleSelectLang = (lang) => {
        setSelectedLang(lang);
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target)) {
                setShowPageDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cargar listado de cartas publicadas
    useEffect(() => {
        if (step === 0) {
            setLoadingCards(true);
            const skip = (currentPage - 1) * pageSize;
            cardsRest.paginate({ skip, take: pageSize, requireTotalCount: true }).then(data => {
                setCards(data.data || []);
                setTotalPages(Math.ceil((data.totalCount || 0) / pageSize));
                setLoadingCards(false);
            }).catch(() => setLoadingCards(false));
        }
    }, [step, currentPage]);

    // Search logic
    const onSearch = async () => {
        if (searching) return;
        if (searchQuery.length < 3 || !selectedLang) return;
        setSearching(true);
        const result = await cardsRest.search(selectedLang.code, searchQuery, cardNumber);
        setSearching(false);
        if (!result) setSearchResults([]);
        else setSearchResults(result || []);
    };

    const selectCard = async (card) => {
        setSelectedCard(card);
        setLoadingCard(true);
        const result = await cardsRest.get(selectedLang.code, card.id);
        setLoadingCard(false);
        setSelectedCard(result ?? null);
    };

    const selectCondition = (condition) => {
        setCondition(condition);
    };

    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const max = 1000;
                    let { width, height } = img;

                    if (width > height) {
                        if (width > max) {
                            height *= max / width;
                            width = max;
                        }
                    } else {
                        if (height > max) {
                            width *= max / height;
                            height = max;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        const resizedFile = new File([blob], file.name, { type: file.type });
                        resolve(resizedFile);
                    }, file.type);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async () => {
        if (!canGoNext() || saving) return;
        setSaving(true);

        // Build FormData to send images
        const formData = new FormData();
        if (editingCardId) formData.append('id', editingCardId);
        formData.append('language_id', selectedLang.id);
        formData.append('card_id', selectedCard.id);
        formData.append('condition', condition);
        formData.append('variant', variant)
        formData.append('price', parseFloat(price));
        deliveryPoints.forEach(id => formData.append('delivery_points[]', id));
        if (frontImage) formData.append('front_image', frontImage);
        if (backImage) formData.append('back_image', backImage);

        const result = await cardsRest.save(formData);

        setSaving(false);

        if (result) {
            // Mostrar modal de éxito
            Swal.fire({
                icon: 'success',
                title: editingCardId ? '¡Carta actualizada!' : '¡Carta registrada!',
                text: editingCardId ? 'Tu carta se ha actualizado correctamente.' : 'Tu carta se ha guardado correctamente.',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                // Ir al listado (paso 0)
                setStep(0);
                // Reset wizard
                setSelectedCard(null);
                setCondition('NM');
                setPrice(null);
                setDeliveryPoints([]);
                setSearchQuery('');
                setSearchResults([]);
                setSearching(false);
                setLoadingCard(false);
                setCardNumber('');
                setFrontImage(null);
                setBackImage(null);
                setEditingCardId(null);
            });
        } else {
            // SweetAlert error
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo guardar la publicación. Inténtalo de nuevo.',
                confirmButtonColor: '#d33'
            });
        }
    };

    const handleEdit = (card) => {
        setEditingCardId(card?.id ?? null);
        if (card) selectCard({
            id: card?.card.code,
            name: card?.card.name,
            localId: card?.card.number
        })
        else setSelectedCard(null)
        setCondition(card?.condition ?? null);
        setVariant(card?.variant ?? null)
        setPrice(parseFloat(card?.price) ?? 0);
        setSearchQuery('')
        setCardNumber('')
        setCards([])
        setDeliveryPoints(card?.delivery_points?.map(dp => dp.id) || []);
        setStep(1);
    };

    const handleDelete = async (cardId) => {
        const confirm = await Swal.fire({
            title: '¿Eliminar carta?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!confirm.isConfirmed) return;

        const result = await cardsRest.delete(cardId);
        if (result) {
            setCards(prev => prev.filter(c => c.id !== cardId));
            Swal.fire('Eliminada', 'Tu carta ha sido eliminada.', 'success');
        } else {
            Swal.fire('Error', 'No se pudo eliminar la carta.', 'error');
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePageDropdownSelect = (page) => {
        setCurrentPage(page);
        setShowPageDropdown(false);
    };

    const renderPaginationButtons = () => {
        const buttons = [];
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`text-sm w-10 h-10 rounded-lg ${currentPage === i ? 'bg-primary text-white' : 'bg-white shadow'}`}
                >
                    {i}
                </button>
            );
        }
        return buttons;
    };

    const canGoNext = () => {
        if (step === 1) return !!selectedCard && !!variant;
        if (step === 2) return !!condition;
        if (step === 3) return !!price && parseFloat(price) > 0;
        return true;
    };

    const goNext = () => {
        if (!canGoNext()) return;
        if (step < 4) setStep(s => s + 1);
        else handleSubmit();
    };

    const goBack = () => {
        if (step > 0) setStep(s => s - 1);
    };

    // Helper to render visible steps for mobile slider
    const getVisibleSteps = () => {
        if (step <= 2) return [1, 2, 3];
        if (step === 3) return [2, 3, 4];
        return [3, 4];
    };

    const visibleSteps = getVisibleSteps();

    const suggestedPrice = selectedCard?.pricing?.length > 0
        ? selectedCard.pricing.reduce((sum, p) => sum + p.marketPrice * (p.unit === 'USD' ? Global.USD_PRICE : p.unit === 'EUR' ? Global.EUR_PRICE : 1), 0) / selectedCard.pricing.length
        : null;
    const selectedCondition = conditions.find(x => x.value == condition)

    const renderStepContent = () => {
        switch (step) {
            case 0:
                // Listado de cartas publicadas
                return (
                    <div className="rounded-xl bg-white p-6 border border-[#D1D5DC]">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-lg font-semibold">Mis cartas publicadas</h4>
                            <button
                                onClick={() => handleEdit()}
                                className="text-sm px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                + Publicar nueva carta
                            </button>
                        </div>
                        {loadingCards ? (
                            <div className="text-center text-silver py-10">
                                <i className="mdi mdi-spin mdi-loading text-2xl"></i>
                                <p className="mt-2">Cargando cartas...</p>
                            </div>
                        ) : cards.length > 0 ? (
                            <>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {cards.map(card => {
                                        return <div key={card.id} className="border rounded-lg p-4 flex gap-4 hover:shadow relative group">
                                            <img
                                                src={`https://assets.tcgdex.net/${card.card.language.code}/${card.card.expansion.serie.code}/${card.card.expansion.code}/${card.card.code.split('-')[1]}/low.webp`}
                                                onError={(e) => { e.target.src = '/images/default/card.png'; }}
                                                alt={card.card.name}
                                                className="h-24 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <h5 className="font-semibold text-sm">{card.card.name}</h5>
                                                <p className="text-xs text-silver">{card.card.expansion.name}</p>
                                                <p className="text-xs mt-1">Condición: <span className="font-medium">{card.condition}</span></p>
                                                <p className="text-sm mt-2 font-bold">S/ {Number2Currency(card.price)}</p>
                                            </div>
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(card)}
                                                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    title="Editar"
                                                >
                                                    <i className="mdi mdi-pencil"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(card.id)}
                                                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                    title="Eliminar"
                                                >
                                                    <i className="mdi mdi-delete"></i>
                                                </button>
                                            </div>
                                        </div>
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
                        ) : (
                            <div className="text-center text-silver py-10">
                                <img src="/assets/img/utils/search-cards.png" alt="Sin cartas" className="w-32 mx-auto mb-4" />
                                <h4 className="text-base font-bold">Aún no has publicado cartas</h4>
                                <span className="block text-sm">Haz clic en "Publicar nueva carta" para empezar</span>
                            </div>
                        )}
                    </div>
                );
            case 1:
                return <div className="grid md:grid-cols-3 gap-6">
                    {/* Preview Card */}
                    <div className="rounded-xl bg-white p-6 border border-[#D1D5DC] md:order-1 order-2">
                        <h4 className="mb-6">Vista previa - Confirmar</h4>
                        {selectedCard ? (
                            <>
                                <img
                                    src={`${selectedCard.image}/high.webp`}
                                    onError={(e) => { e.target.src = '/images/default/card.png'; }}
                                    alt={selectedCard.name}
                                    className="w-44 rounded-lg aspect-[3/4] mx-auto mb-4 object-cover"
                                />
                                <h4 className=' mb-2'>
                                    {selectedCard.name} {selectedCard.localId}/
                                    <span className={`inline-block ${loadingCard ? 'bg-gray-200 w-6 h-4 rounded' : ''}`}>
                                        {selectedCard.set?.cardCount.official}
                                    </span>
                                </h4>
                                {loadingCard ? (
                                    <>
                                        <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                                        <div className='flex gap-1 mb-6'>
                                            <span className='h-6 bg-gray-200 rounded w-12'></span>
                                            <span className='h-6 bg-gray-200 rounded w-12'></span>
                                        </div>
                                        <div className='h-11 bg-gray-200 rounded-lg w-full'></div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-silver">{String(selectedCard.set?.id).toUpperCase()}: {selectedCard.set?.name}</p>
                                        <div className="flex gap-1 mt-2 mb-6">
                                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">{selectedCard.localId}{selectedCard.set?.cardCount?.official && `/${selectedCard.set?.cardCount?.official}`}</span>
                                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">{selectedCard?.rarity}</span>
                                        </div>
                                        <div className="mb-6 flex flex-wrap gap-2">
                                            {selectedCard?.variants_detailed.map((variantDetail, index) => {
                                                const stampText = variantDetail.stamp?.length > 0
                                                  ? ` - ${variantDetail.stamp[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
                                                  : variantDetail.subtype
                                                  ? ` - ${variantDetail.subtype.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
                                                  : '';
                                                const fullVariant = `${variantDetail.type.charAt(0).toUpperCase() + variantDetail.type.slice(1)}${stampText}`;
                                                const selected = variant === fullVariant
                                                return <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => setVariant(selected ? null : fullVariant)}
                                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selected
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {
                                                        selected
                                                            ? <i className='mdi mdi-check me-1' />
                                                            : <i className='mdi mdi-square-outline me-1' />
                                                    }
                                                    {fullVariant}
                                                </button>
                                            })}
                                        </div>
                                        <button
                                            onClick={() => goNext()}
                                            disabled={!canGoNext()}
                                            className="text-sm w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                                        >
                                            Confirmar carta
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <div className='w-44 rounded-lg border aspect-[3/4] mx-auto mb-4 flex items-center justify-center'>
                                    <span className='text-silver'>Sin selección</span>
                                </div>
                                <h4 className='text-silver text-center'>Primero busca y selecciona una carta</h4>
                            </>
                        )}
                    </div>

                    {/* Search Form */}
                    <div className="rounded-xl bg-white p-6 border border-[#D1D5DC] md:col-span-2 md:order-2 order-1">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="mb-0">Busca tu carta</h4>
                            <button
                                onClick={() => setStep(0)}
                                className="text-sm px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                Cancelar
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                            {/* Idioma */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-silver mb-2">Idioma</label>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary flex justify-between items-center"
                                    >
                                        <span className="truncate">{selectedLang.name}</span>
                                        <span className={`mdi mdi-chevron-down w-4 h-4 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></span>
                                    </button>
                                    {isDropdownOpen && (
                                        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                            {languages.map(lang => (
                                                <li
                                                    key={lang.id}
                                                    onClick={() => handleSelectLang(lang)}
                                                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm"
                                                >
                                                    {lang.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Nombre */}
                            <div className="flex flex-col sm:col-span-2">
                                <label className="text-sm font-medium text-silver mb-2">Nombre</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Black Lotus"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            onSearch();
                                        }
                                    }}
                                    className="text-sm w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Numeración */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-silver mb-2"># Número</label>
                                <input
                                    type="text"
                                    placeholder="Ej. 123"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            onSearch();
                                        }
                                    }}
                                    className="text-sm w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Botón Buscar */}
                            <div className="flex items-end">
                                <button
                                    onClick={onSearch}
                                    disabled={searching}
                                    className="text-sm w-full px-4 py-3 bg-primary flex items-center justify-center text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                                >
                                    {searching
                                        ? <>
                                            <i className='mdi mdi-spin mdi-loading'></i>
                                            <span className='ms-1'>Buscando</span>
                                        </> : <>
                                            <i className='mdi mdi-magnify'></i>
                                            <span className='ms-1'>Buscar</span>
                                        </>}
                                </button>
                            </div>
                        </div>

                        <hr className="w-full my-6" />

                        {/* Search Results */}
                        {searchResults.length > 0
                            ? <>
                                <h4 className='mb-4'>{searchResults.length} resultados</h4>
                                <div className="max-h-[474px] overflow-y-auto grid gap-4">
                                    {searchResults.map((card) => (
                                        <div
                                            key={card.id}
                                            className="border px-4 py-3 rounded-lg flex gap-3 items-center cursor-pointer hover:bg-gray-50 "
                                            onClick={() => selectCard(card)}
                                        >
                                            <img
                                                src={`${card.image}/low.webp`}
                                                alt={card.name}
                                                className="h-14 object-cover rounded"
                                                onError={(e) => { e.target.src = '/images/default/card.png'; }}
                                            />
                                            <div>
                                                <p className="block text-sm">{card.name} <span className='text-silver'>#{card.localId}</span></p>
                                                <small className="block text-xs">Código: {card.id}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                            : <div className="text-silver text-center">
                                <img src="/assets/img/utils/search-cards.png" alt={`Buscar cartas - ${Global.APP_NAME}`} className="w-40 mx-auto" />
                                <h4 className="text-base font-bold">Primero busca tu carta</h4>
                                <span className="block text-sm">Elige el idioma y busca tu carta por nombre y número</span>
                            </div>
                        }
                    </div>
                </div>
            case 2:
                return <div className="rounded-xl bg-white p-6 border border-[#D1D5DC]">
                    <h4 className="mb-1">Selecciona la condición de tu carta</h4>
                    <p className='text-silver mb-6'>Elige la condición más parecida al estado actual de tu carta.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
                        {conditions.map((c) => (
                            <div
                                key={c.value}
                                className={`border rounded-xl p-6 cursor-pointer h-full ${condition === c.value ? 'border-primary' : 'border-gray-300'}`}
                                onClick={() => selectCondition(c.value)}
                            >
                                <div className='text-3xl mb-2 flex justify-between'>
                                    <span>{c.icon}</span>
                                    {condition === c.value && <i className='mdi mdi-check-circle text-primary text-2xl' />}
                                </div>
                                <p className='mb-2'>{c.label}</p>
                                <p className="text-sm">{c.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className={`border rounded-xl p-6 h-full border-gray-300 flex gap-4 mb-6`}>
                        <div className='h-10 w-10 bg-[#F3F4F6] text-silver flex items-center justify-center rounded-lg'>
                            <i className='mdi mdi-upload text-2xl'></i>
                        </div>
                        <div className='flex-1'>
                            <h4>Subir fotos (Recomendado)</h4>
                            <p className='text-silver text-sm mb-4'>Subir fotos de tu carta te ayuda a venderla más rápido y generar confianza. Puedes subir máximo 2 fotos.</p>

                            {
                                (frontImage || backImage) &&
                                <div className="flex items-center gap-3 mb-4">
                                    {frontImage && (
                                        <div className="relative">
                                            <img
                                                src={URL.createObjectURL(frontImage)}
                                                alt="Frente"
                                                className="w-12 aspect-[600/825] border border-gray-300 object-cover rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFrontImage(null)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                            >
                                                <i className="mdi mdi-close"></i>
                                            </button>
                                        </div>
                                    )}
                                    {backImage && (
                                        <div className="relative">
                                            <img
                                                src={URL.createObjectURL(backImage)}
                                                alt="Reverso"
                                                className="w-12 aspect-[600/825] border border-gray-300 object-cover rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setBackImage(null)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                            >
                                                <i className="mdi mdi-close"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            }

                            {/* Input oculto múltiple */}
                            <input
                                id="multi-photo-input"
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const files = Array.from(e.target.files).slice(0, 2);
                                    if (files[0]) setFrontImage(await resizeImage(files[0]));
                                    if (files[1]) setBackImage(await resizeImage(files[1]));
                                }}
                            />

                            {/* Botón Agregar foto */}
                            <button
                                onClick={() => document.getElementById('multi-photo-input').click()}
                                disabled={!!frontImage && !!backImage}
                                className='py-2 px-4 text-sm border border-primary text-primary rounded-lg disabled:opacity-50'
                            >
                                Agregar foto
                            </button>
                        </div>
                    </div>
                    <div className='flex justify-end gap-2'>
                        <button
                            onClick={() => goBack()}
                            className='py-2 px-4 text-sm border border-primary text-primary rounded-lg disabled:opacity-50'
                        >
                            Regresar
                        </button>
                        <button
                            onClick={() => goNext()}
                            disabled={!condition}
                            className='py-2 px-4 text-sm border border-primary bg-primary text-white rounded-lg disabled:opacity-50'
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            case 3:
                return <div className="grid md:grid-cols-5 gap-6">
                    <div className="md:col-span-3 rounded-xl bg-white p-6 border border-[#D1D5DC]">
                        <h4 className="mb-2">Ingresa tu precio</h4>
                        <p className='text-silver mb-6'>Pon un precio competitivo para maximizar las ventas.</p>
                        <div className="flex flex-col mb-6">
                            <label className="text-sm font-medium text-silver mb-2">Precio de tu carta</label>
                            <div className='relative mb-4'>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="text-sm w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className='absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-silver'>S/</span>
                            </div>
                            <div className='flex justify-between text-sm'>
                                <span className='text-silver'>Precio sugerido: <span className="text-primary">S/ {Number2Currency(suggestedPrice)}</span></span>
                                <span
                                    className='text-primary underline cursor-pointer'
                                    onClick={() => setPrice(Number(suggestedPrice).toFixed(2))}>
                                    Usar precio sugerido
                                </span>
                            </div>
                        </div>
                        {
                            price && <div className='mb-6'>
                                {price && suggestedPrice && <div className='mb-4' children={<PriceAdvisor suggested={suggestedPrice} price={price} />} />}
                                <div className='border p-6 rounded-lg'>
                                    <h4 className='text-lg mb-4'>Resumen de ganancia</h4>
                                    <div className='mb-4'>
                                        <div className='flex justify-between items-center mb-2'>
                                            <span className='text-sm'>Pago del comprador</span>
                                            <span>S/ {Number2Currency(price)}</span>
                                        </div>
                                        <div className='flex justify-between items-center'>
                                            <span className='text-sm'>
                                                Tarifa de servicio
                                                <Tippy content='Comisión de la plataforma (8%)'>
                                                    <i className='mdi mdi-information-outline ms-1' />
                                                </Tippy>
                                            </span>
                                            <span>S/ {Number2Currency(price * 0.08)}</span>
                                        </div>
                                    </div>
                                    <hr className='mb-4' />
                                    <div className='flex justify-between items-center mb-2'>
                                        <span className='text-lg'>Recibirás</span>
                                        <span className='text-2xl font-bold text-primary'>S/ {Number2Currency(price * 0.92)}</span>
                                    </div>
                                </div>
                            </div>
                        }
                        <div className='flex justify-end gap-2'>
                            <button
                                onClick={() => goBack()}
                                className='py-2 px-4 text-sm border border-primary text-primary rounded-lg disabled:opacity-50'
                            >
                                Regresar
                            </button>
                            <button
                                onClick={() => goNext()}
                                disabled={!canGoNext()}
                                className='py-2 px-4 text-sm border border-primary bg-primary text-white rounded-lg disabled:opacity-50'
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-6 border border-[#D1D5DC] md:col-span-2">
                        <h4 className="mb-2">Precio del mercado</h4>
                        <p className='text-silver mb-6'>Revisa el precio del mercado.</p>
                        {selectedCard?.pricing?.length > 0 ? (
                            <div className='grid gap-4'>
                                {
                                    selectedCard.pricing.map((p) => {
                                        const solesPrice = p.marketPrice * (p.unit === 'USD' ? Global.USD_PRICE : p.unit === 'EUR' ? Global.EUR_PRICE : 1);
                                        return <div className="border p-4 rounded-xl" key={p.id}>
                                            <div className='mb-2 flex justify-between items-start'>
                                                <div className=''>
                                                    <h4 className='mb-1'>{p.name}</h4>
                                                    <span className='block text-2xl font-semibold'>S/ {Number2Currency(solesPrice)}</span>
                                                </div>
                                                <img
                                                    className='h-12 w-full max-w-16 object-contain'
                                                    src={`https://static.dextcg.com/resources/markets/${p.image}.webp`} alt={p.name} />
                                            </div>
                                            <small className='text-sm text-silver'>Precio base ({p.unit}): {Number2Currency(p.marketPrice)}</small>
                                        </div>
                                    })
                                }
                            </div>
                        ) : (
                            <p className="text-muted mb-0">No hay precios referenciales para esta carta</p>
                        )}
                    </div>
                </div>
            case 4:
                return <div className='grid gap-6 md:grid-cols-3'>
                    <div className="rounded-xl bg-white p-6 border border-[#D1D5DC] h-full">
                        <h4 className="mb-6">Detalles de la carta</h4>
                        <img
                            src={`${selectedCard.image}/high.webp`}
                            onError={(e) => { e.target.src = '/images/default/card.png'; }}
                            alt={selectedCard.name}
                            className="w-44 rounded-lg aspect-[3/4] mx-auto mb-4 object-cover"
                        />
                        <h4 className=' mb-2'>
                            {selectedCard.name} {selectedCard.localId}/
                            <span className={`inline-block ${loadingCard ? 'bg-gray-200 w-6 h-4 rounded' : ''}`}>
                                {selectedCard.set?.cardCount.official}
                            </span>
                        </h4>
                        <p className="text-xs text-silver">{String(selectedCard.set?.id).toUpperCase()}: {selectedCard.set?.name}</p>
                        <div className="flex gap-1 mt-2 mb-4">
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">{selectedCard.localId}{selectedCard.set?.cardCount?.official && `/${selectedCard.set?.cardCount?.official}`}</span>
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">{selectedCard?.rarity}</span>
                        </div>
                        <span className='block border rounded-xl p-4 mb-4'>
                            {selectedCondition.icon} {selectedCondition.label}
                        </span>
                        <div className='mb-4'>
                            <h4 className='text-sm mb-2'>Precio a publicar</h4>
                            <span className="text-2xl font-bold">S/ {Number2Currency(price)}</span>
                        </div>
                        <PriceAdvisor price={price} suggested={suggestedPrice} fullWidth />
                    </div>
                    <div className='md:col-span-2'>
                        <div className="rounded-xl bg-white p-6 border border-[#D1D5DC] mb-6">
                            <h4 className='mb-4'>Resumen de listado</h4>
                            <div className='mb-4'>
                                <div className='flex justify-between items-center mb-2'>
                                    <span className='text-sm'>Precio a publicar</span>
                                    <span>S/ {Number2Currency(price)}</span>
                                </div>
                                <div className='flex justify-between items-center'>
                                    <span className='text-sm'>
                                        Tarifa de servicio
                                        <Tippy content='Comisión de la plataforma (8%)'>
                                            <i className='mdi mdi-information-outline ms-1' />
                                        </Tippy>
                                    </span>
                                    <span>S/ {Number2Currency(price * 0.08)}</span>
                                </div>
                            </div>
                            <hr className='mb-4' />
                            <div className='flex justify-between items-center px-4 py-2 bg-green-50 border border-green-500 rounded-lg'>
                                <span className='text-lg font-bold'>Recibirás</span>
                                <span className='text-2xl font-bold text-green-600'>S/ {Number2Currency(price * 0.92)}</span>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white p-6 border border-[#D1D5DC]">
                            <h4 className="mb-2">Puntos de entrega</h4>
                            <p className='text-silver mb-6'>
                                Los compradores podrán elegir uno de estos puntos de recojo al momento de realizar el pago.
                                Puedes modificar los puntos de entrega en tu <a href="/profile" className="text-primary">perfil</a>.
                            </p>
                            <div className='grid gap-6'>
                                {
                                    session.points.map(point => {
                                        return (
                                            <div
                                                key={point.id}
                                                className={`relative border p-6 rounded-xl flex items-start justify-between gap-4`}
                                            >
                                                <span className='w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center'>
                                                    <i className='mdi mdi-store text-silver'></i>
                                                </span>
                                                <div className='flex-1'>
                                                    <h4 className='mb-1'>{point.name}</h4>
                                                    <span className='block text-silver text-sm mb-2'>{point.district}, {point.department}</span>
                                                    <ul className='text-silver text-sm grid gap-1'>
                                                        <li>
                                                            <i className='mdi mdi-map-marker-outline me-1' />
                                                            <span>{point.address} {point.number} {point.reference && `(${point.reference})`}</span>
                                                        </li>
                                                        <li>
                                                            <i className='mdi mdi-clock-outline me-1' />
                                                            <span>{buildSchedule(point.opening_hours)}</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-3 rounded-xl bg-white p-6 border border-[#D1D5DC] h-full">
                        <span className='block text-xs p-2 bg-[#E8F5FF] rounded text-silver mb-6'>
                            Tu anuncio aparecerá inmediatamente en la web. Asegúrate de que todos los datos sean correctos. Puedes editarlo o eliminarlo en cualquier momento desde tu Panel de Vendedor.
                        </span>
                        <div className='flex flex-col md:flex-row justify-between gap-6 items-end'>
                            <div>
                                <h4 className="mb-2">¿Listo para publicar?</h4>
                                <p className='text-silver'>Tu carta aparecerá inmediatamente en la web.</p>
                            </div>
                            <div className='flex justify-end gap-2'>
                                <button
                                    onClick={() => goBack()}
                                    disabled={saving}
                                    className='py-2 px-4 text-sm border border-primary text-primary rounded-lg disabled:opacity-50'
                                >
                                    Regresar
                                </button>
                                <button
                                    onClick={() => goNext()}
                                    disabled={!canGoNext() || saving}
                                    className='py-2 px-4 text-sm border border-primary bg-primary text-white rounded-lg disabled:opacity-50'
                                >
                                    Publicar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            default:
                return null
        }
    };

    return (
        <section className="w-full bg-[#EFF3F5] py-12 sm:py-16">
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6`}>
                <div>
                    <h4 className='text-lg font-bold mb-1'>Lista una carta</h4>
                    <p className=''>Añade tu carta, selecciona la condición y elige el mejor precio.</p>
                </div>
                {
                    step !== 0 &&
                    <div className='rounded-xl bg-white p-4 sm:p-6 border border-[#D1D5DC]'>
                        {/* Desktop: horizontal stepped bar */}
                        <div className='hidden md:flex gap-4 items-center justify-between'>
                            <div className='flex gap-3 items-center'>
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`}>
                                    {step > 1 ? <i className='mdi mdi-check' /> : 1}
                                </span>
                                <span className={`text-lg ${step >= 1 ? 'font-bold' : ''}`}>Carta</span>
                            </div>
                            <hr className={`flex-1 mx-2 ${step >= 2 ? 'border-primary' : 'border-gray-200'}`} />
                            <div className='flex gap-3 items-center'>
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}>
                                    {step > 2 ? <i className='mdi mdi-check' /> : 2}
                                </span>
                                <span className={`text-lg ${step >= 2 ? 'font-bold' : ''}`}>Condición</span>
                            </div>
                            <hr className={`flex-1 mx-2 ${step >= 3 ? 'border-primary' : 'border-gray-200'}`} />
                            <div className='flex gap-3 items-center'>
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}>
                                    {step > 3 ? <i className='mdi mdi-check' /> : 3}
                                </span>
                                <span className={`text-lg ${step >= 3 ? 'font-bold' : ''}`}>Precio</span>
                            </div>
                            <hr className={`flex-1 mx-2 ${step >= 4 ? 'border-primary' : 'border-gray-200'}`} />
                            <div className='flex gap-3 items-center'>
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${step >= 4 ? 'bg-primary' : 'bg-gray-200'}`}>
                                    {step > 4 ? <i className='mdi mdi-check' /> : 4}
                                </span>
                                <span className={`text-lg ${step >= 5 ? 'font-bold' : ''}`}>Publicar</span>
                            </div>
                        </div>

                        {/* Mobile: slider stepped list */}
                        <div className='md:hidden'>
                            <ul className='flex gap-2 overflow-hidden justify-between'>
                                {visibleSteps.map(stepNum => (
                                    <li key={stepNum} className='flex items-center gap-3 flex-shrink-0'>
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${step >= stepNum ? 'bg-primary' : 'bg-gray-200'}`}>{step > stepNum ? <i className='mdi mdi-check' /> : stepNum}

                                        </span>
                                        <span className={`text-base ${step >= stepNum ? 'font-bold text-black' : ''}`}>
                                            {stepNum === 1 ? 'Carta' : stepNum === 2 ? 'Condición' : stepNum === 3 ? 'Precio' : 'Publicar'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                }

                {/* Step Content */}
                {renderStepContent()}

                {/* Navigation */}
                {/* <div className='rounded-xl bg-white px-6 py-8 border border-[#D1D5DC]'>
                    <div className='flex justify-between items-center'>
                        <button
                            onClick={goBack}
                            disabled={step === 1}
                            className='py-2 px-4 text-sm border border-gray-300 rounded-lg disabled:opacity-40'
                        >
                            Atrás
                        </button>
                        {step === 4 ? (
                            <button
                                className='py-2 px-4 text-sm bg-primary text-white rounded-lg'
                            >
                                Publicar
                            </button>
                        ) : (
                            <button
                                onClick={goNext}
                                disabled={!canGoNext()}
                                className='py-2 px-4 text-sm bg-primary text-white rounded-lg disabled:opacity-50'
                            >
                                Siguiente
                            </button>
                        )}
                    </div>
                </div> */}
            </div>
        </section>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(
        <Base {...properties}>
            <MyCollection {...properties} />
        </Base>
    );
});
