import { createRoot } from 'react-dom/client';
import BaseAdminto from '../Components/Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import { useRef, useState } from 'react';
import CardsRest from '../Actions/Seller/cards-rest';
import Modal from '../Components/Adminto/Modal';
import Number2Currency from '../Utils/Number2Currency';
import Global from '../Utils/Global';
import SelectFormGroup from '../Components/Adminto/Form/SelectFormGroup';
import InputFormGroup from '../Components/Adminto/Form/InputFormGroup';

const cardsRest = new CardsRest();

const Cards = ({ languages }) => {
    const gridRef = useRef();
    const modalRef = useRef();

    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [loadingCard, setLoadingCard] = useState(false);

    // wizard state
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedCondition, setSelectedCondition] = useState(null);
    const [price, setPrice] = useState('');
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);

    // new state for language and number
    const [selectedLanguage, setSelectedLanguage] = useState('es');
    const [cardNumber, setCardNumber] = useState('');

    const onModalOpen = (data) => {
        if (data?.id) setIsEditing(true)
        else setIsEditing(false)

        $(modalRef.current).modal('show');
    }

    const onModalSubmit = async (e) => {
        e.preventDefault();

        $(modalRef.current).modal('hide');
        $(gridRef.current).dxDataGrid('instance').refresh();
    }

    const onSearch = async () => {
        if (searching) return
        // require language and number along with name
        if (searchQuery.length < 3 || !selectedLanguage) return
        setSearching(true)
        const result = await cardsRest.search(selectedLanguage, searchQuery, cardNumber);
        setSearching(false)
        if (!result) setSearchResults([]);
        else setSearchResults(result || []);
    }

    const selectCard = async (card) => {
        setSelectedCard(card);
        setLoadingCard(true);
        const result = await cardsRest.get(selectedLanguage, card.id);
        setLoadingCard(false);
        setSelectedCard(result ?? null)
    }

    const selectCondition = (condition) => {
        setSelectedCondition(condition);
    }

    const canGoNext = () => {
        if (activeTab === 'search') return !!selectedCard;
        if (activeTab === 'condition') return !!selectedCondition;
        if (activeTab === 'price') return !!price && parseFloat(price) > 0;
        return true;
    };

    const goNext = () => {
        if (!canGoNext()) return;
        if (activeTab === 'search') setActiveTab('condition');
        else if (activeTab === 'condition') setActiveTab('price');
        else if (activeTab === 'price') setActiveTab('publish');
    };

    const goBack = () => {
        if (activeTab === 'search') {
            $(modalRef.current).modal('hide');
            return;
        }
        if (activeTab === 'condition') setActiveTab('search');
        else if (activeTab === 'price') setActiveTab('condition');
        else if (activeTab === 'publish') setActiveTab('price');
    };

    const leftBtnLabel = activeTab === 'search' ? 'Cancelar' : 'Atrás';
    const rightBtnLabel = activeTab === 'publish' ? 'Publicar' : 'Siguiente';

    const isTabEnabled = (tab) => {
        if (tab === 'search') return true;
        if (tab === 'condition') return !!selectedCard;
        if (tab === 'price') return !!selectedCard && !!selectedCondition;
        if (tab === 'publish') return !!selectedCard && !!selectedCondition && !!price && parseFloat(price) > 0;
        return false;
    };

    // preview helpers
    const frontPreview = frontImage ? URL.createObjectURL(frontImage) : null;
    const backPreview = backImage ? URL.createObjectURL(backImage) : null;

    const suggestedPrice = selectedCard?.pricing?.length > 0
        ? selectedCard.pricing.reduce((sum, p) => sum + p.marketPrice * (p.unit === 'USD' ? Global.USD_PRICE : p.unit === 'EUR' ? Global.EUR_PRICE : 1), 0) / selectedCard.pricing.length
        : null;

    return <>
        <Table gridRef={gridRef} title='Cartas' rest={cardsRest}
            toolBar={(container) => {
                container.unshift({
                    widget: 'dxButton', location: 'after',
                    options: {
                        icon: 'refresh',
                        hint: 'Refrescar tabla',
                        onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
                    }
                });
                container.unshift({
                    widget: 'dxButton', location: 'after',
                    options: {
                        icon: 'plus',
                        hint: 'Agregar carta',
                        onClick: () => onModalOpen()
                    }
                });
            }}
            columns={[
                {
                    dataField: 'id',
                    caption: 'ID',
                    visible: false
                },
                {
                    dataField: 'name',
                    caption: 'Nombre',
                    width: '50%',
                    cellTemplate: (container, { data }) => {
                        ReactAppend(container, <p className='mb-0' style={{ width: '100%' }}>
                            <b className='d-block'>{data.name}</b>
                            <small className='text-wrap text-muted' style={{
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                            }}>{data.description}</small>
                        </p>)
                    }
                },
                {
                    dataField: 'size',
                    caption: 'Tamaño',
                    width: '100px',
                },
                {
                    dataField: 'price',
                    caption: 'Precio',
                    dataType: 'number',
                    width: '100px',
                    cellTemplate: (container, { data }) => {
                        container.text(`S/.${Number(data.price).toFixed(2)}`)
                    }
                },
                {
                    dataField: 'image',
                    caption: 'Imagen',
                    width: '60px',
                    allowFiltering: false,
                    cellTemplate: (container, { data }) => {
                        ReactAppend(container, <img src={`/api/items/media/${data.image}`} style={{ width: '40px', aspectRatio: 3 / 4, objectFit: 'cover', objectPosition: 'center', borderRadius: '4px' }} onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />)
                    }
                },
                {
                    dataField: 'is_default',
                    caption: 'Preseleccionar',
                    dataType: 'boolean',
                    width: '120px',
                    cellTemplate: (container, { data }) => {
                        ReactAppend(container, <SwitchFormGroup checked={data.is_default} onChange={(e) => onIsDefaultChange({ id: data.id, value: e.target.checked })} />)
                    }
                },
                {
                    dataField: 'featured',
                    caption: 'Destacado',
                    dataType: 'boolean',
                    width: '120px',
                    cellTemplate: (container, { data }) => {
                        ReactAppend(container, <SwitchFormGroup checked={data.featured} onChange={(e) => onFeaturedChange({ id: data.id, value: e.target.checked })} />)
                    }
                },
                {
                    dataField: 'visible',
                    caption: 'Visible',
                    dataType: 'boolean',
                    width: '120px',
                    cellTemplate: (container, { data }) => {
                        ReactAppend(container, <SwitchFormGroup checked={data.visible} onChange={(e) => onVisibleChange({ id: data.id, value: e.target.checked })} />)
                    }
                },
                {
                    caption: 'Acciones',
                    cellTemplate: (container, { data }) => {
                        container.css('text-overflow', 'unset')
                        container.append(DxButton({
                            className: 'btn btn-xs btn-soft-primary',
                            title: 'Editar',
                            icon: 'fa fa-pen',
                            onClick: () => onModalOpen(data)
                        }))
                        container.append(DxButton({
                            className: 'btn btn-xs btn-soft-danger',
                            title: 'Eliminar',
                            icon: 'fa fa-trash',
                            onClick: () => onDeleteClicked(data.id)
                        }))
                    },
                    allowFiltering: false,
                    allowExporting: false
                }
            ]} />

        <Modal modalRef={modalRef} title={isEditing ? 'Editar carta' : 'Agregar carta'} onSubmit={onModalSubmit} bodyClass='p-0' hideFooter onClose={() => {
            setSelectedCard(null)
            setSearchQuery('')
            setSearchResults([])
            setActiveTab('search')
            setSelectedCondition(null)
            setPrice('')
            setFrontImage(null)
            setBackImage(null)
            setSelectedLanguage('es')
            setCardNumber('')
        }}
            size={activeTab === 'price' ? 'lg' : 'md'}
        >
            <ul className="nav nav-pills nav-justified form-wizard-header">
                <li className="nav-item">
                    <button data-bs-toggle="tab" data-toggle="tab"
                        className={`nav-link rounded-0 py-1 ${activeTab == 'search' ? 'active' : ''}`}
                        onClick={() => isTabEnabled('search') && setActiveTab('search')}
                        disabled={!isTabEnabled('search')}
                        type='button'>
                        <i className="mdi mdi-magnify align-middle me-1"></i>
                        <span className="d-none d-sm-inline">Busca</span>
                    </button>
                </li>
                <li className="nav-item">
                    <button data-bs-toggle="tab" data-toggle="tab"
                        className={`nav-link rounded-0 py-1 ${activeTab == 'condition' ? 'active' : ''}`}
                        onClick={() => isTabEnabled('condition') && setActiveTab('condition')}
                        disabled={!isTabEnabled('condition')}
                        type='button'>
                        <i className="mdi mdi-check align-middle me-1"></i>
                        <span className="d-none d-sm-inline">Condición</span>
                    </button>
                </li>
                <li className="nav-item">
                    <button data-bs-toggle="tab" data-toggle="tab"
                        className={`nav-link rounded-0 py-1 ${activeTab == 'price' ? 'active' : ''}`}
                        onClick={() => isTabEnabled('price') && setActiveTab('price')}
                        disabled={!isTabEnabled('price')}
                        type='button'>
                        <i className="mdi mdi-currency-usd align-middle me-1"></i>
                        <span className="d-none d-sm-inline">Precio</span>
                    </button>
                </li>
                <li className="nav-item">
                    <button data-bs-toggle="tab" data-toggle="tab"
                        className={`nav-link rounded-0 py-1 ${activeTab == 'publish' ? 'active' : ''}`}
                        onClick={() => isTabEnabled('publish') && setActiveTab('publish')}
                        disabled={!isTabEnabled('publish')}
                        type='button'>
                        <i className="mdi mdi-upload align-middle me-1"></i>
                        <span className="d-none d-sm-inline">Publicar</span>
                    </button>
                </li>
            </ul>

            <div className="tab-content b-0 mb-0 p-3">
                {/* TAB 1: Buscador con resultados dinámicos */}
                <div className={`tab-pane ${activeTab === 'search' ? 'active' : ''}`}>
                    {
                        selectedCard
                            ? <div className='position-relative '>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-soft-danger position-absolute top-0 end-0"
                                    onClick={() => setSelectedCard(null)}
                                    aria-label="Quitar selección"
                                >
                                    <i className="mdi mdi-close"></i> Volver
                                </button>
                                <img
                                    src={`${selectedCard.image}/high.webp`}
                                    onError={(e) => { e.target.src = '/images/default/card.png'; }}
                                    alt={selectedCard.name}
                                    className="img-fluid rounded d-block mx-auto shadow-sm"
                                    style={{
                                        maxWidth: '280px',
                                        aspectRatio: 0.727
                                    }}
                                />
                                <div className="mt-3">
                                    <h5 className="mb-1 fw-bold text-center">{selectedCard.name} <span className='fw-normal text-muted'>#{selectedCard.localId}</span></h5>
                                    {loadingCard ? (
                                        <>
                                            <div style={{ height: '20px', backgroundColor: '#e0e0e0', borderRadius: '4px', width: '50%', margin: '0 auto 8px' }}></div>
                                            <div className="d-flex flex-wrap gap-1 justify-content-center">
                                                <span style={{ height: '20px', backgroundColor: '#e0e0e0', borderRadius: '12px', width: '60px' }}></span>
                                                <span style={{ height: '20px', backgroundColor: '#e0e0e0', borderRadius: '12px', width: '60px' }}></span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mb-2 text-muted text-center">{selectedCard.set?.name}</p>
                                            <div className="d-flex flex-wrap gap-1 justify-content-center">
                                                <span className="badge badge-outline-primary">
                                                    {selectedCard.localId}
                                                    {selectedCard.set?.cardCount?.official && `/${selectedCard.set?.cardCount?.official}`}
                                                </span>
                                                <span className="badge badge-outline-secondary">
                                                    {selectedCard?.rarity}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            : <>
                                <div className="row">
                                    <SelectFormGroup
                                        label="Idioma"
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value)}
                                        minimumResultsForSearch={-1}
                                        col="col-md-4"
                                    >
                                        {languages
                                            .sort((a, b) => a.label.localeCompare(b.label))
                                            .map((lang) => (
                                                <option key={lang.id} value={lang.id}>
                                                    {lang.label}
                                                </option>
                                            ))}
                                    </SelectFormGroup>

                                    <InputFormGroup
                                        label="Nombre de la carta"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                onSearch();
                                            }
                                        }}
                                        col="col-md-8"
                                    />
                                </div>

                                {/* Optional card number input */}
                                <div className="mb-3 d-flex gap-2 gap-md-3 align-items-end w-100">
                                    <div className='flex-grow-1'>
                                        <label className="form-label mb-1">Número de carta (opcional)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ej: 123"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    onSearch();
                                                }
                                            }}
                                        />
                                    </div>
                                    <button className="btn btn-primary" onClick={onSearch} type='button' disabled={searching}>
                                        <i className={`mdi ${searching ? 'mdi-spin mdi-loading' : 'mdi-magnify'}`} />
                                        <span className='ms-1'>Buscar carta</span>
                                    </button>
                                </div>
                                <div className="search-results" style={{ height: '300px', overflowY: 'auto' }}>
                                    {searchResults.map((card) => (
                                        <div
                                            key={card.id}
                                            className="border p-2 rounded d-flex gap-2 justify-content-between align-items-center mb-2 cursor-pointer"
                                            onClick={() => selectCard(card)}
                                        >
                                            <div className="d-flex align-items-center">
                                                <img
                                                    className='shadow-sm rounded'
                                                    src={`${card.image}/low.webp`}
                                                    alt={card.name}
                                                    style={{ width: '50px', aspectRatio: 0.727, objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }}
                                                    onError={(e) => { e.target.src = '/images/default/card.png'; }}
                                                />
                                                <div>
                                                    <p className="mb-0 fw-bold">{card.name} <span className='fw-normal text-muted'>#{card.localId}</span></p>
                                                    <small className="text-muted">Código: <span className='font-mono'>{card.id}</span></small>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                    }
                </div>

                {/* TAB 2: Condición en español con descripción y subida de fotos */}
                <div className={`tab-pane ${activeTab === 'condition' ? 'active' : ''}`}>
                    <label className="form-label mb-1">Selecciona la condición de la carta:</label>
                    <div className="row g-1 mb-2">
                        {[
                            { value: 'mint', icon: 'mdi mdi-star-four-points', label: 'Nueva', desc: 'Perfecta condición. Sin defectos visibles de ningún tipo.' },
                            { value: 'near-mint', icon: 'mdi mdi-diamond', label: 'Casi Nueva', desc: 'Parece recién salida del sobre. Solo imperfecciones menores de impresión.' },
                            { value: 'lightly-played', icon: 'mdi mdi-thumb-up-outline', label: 'Ligeramente Jugada', desc: 'Desgaste leve en bordes o esquinas. Sin ralladuras importantes.' },
                            { value: 'moderately-played', icon: 'mdi mdi-thumb-down-outline', label: 'Moderadamente Jugada', desc: 'Desgaste notable en bordes, esquinas o superficie.' },
                            { value: 'heavily-played', icon: 'mdi mdi-thumb-down', label: 'Muy Jugada', desc: 'Desgaste severo, blanqueamiento, ralladuras. Aún legal para torneos.' },
                            { value: 'damaged', icon: 'mdi mdi-alert', label: 'Dañada', desc: 'Daños importantes como arrugas, rasgaduras o daños por agua.' }
                        ].map((c) => (
                            <div className="col-md-6" key={c.value}>
                                <div
                                    className={`card border cursor-pointer h-100 mb-0 ${selectedCondition === c.value ? 'border-primary' : ''}`}
                                    onClick={() => selectCondition(c.value)}
                                >
                                    <div className="card-body p-2">
                                        <p className={`mb-1 fw-bold ${selectedCondition === c.value ? 'text-primary' : ''}`}>
                                            <i className={c.icon}></i>
                                            <span className='ms-1'>{c.label}</span>
                                        </p>
                                        <p className="text-muted mb-0">{c.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div >
                        <label className="form-label mb-1">Fotos de la carta (opcional):</label>
                        <div className="row g-2">
                            <div className="col-6">
                                <label className="form-label small">Frente</label>
                                <div
                                    className="card border d-flex align-items-center justify-content-center cursor-pointer"
                                    style={{ aspectRatio: 0.727, position: 'relative', overflow: 'hidden' }}
                                    onClick={() => document.getElementById('front-file-input').click()}
                                >
                                    {frontPreview ? (
                                        <img
                                            src={frontPreview}
                                            alt="Frente"
                                            className="img-fluid rounded"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <i className="mdi mdi-plus fs-2 text-muted"></i>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="front-file-input"
                                    type="file"
                                    className="d-none"
                                    accept="image/*"
                                    onChange={(e) => setFrontImage(e.target.files[0])}
                                />
                            </div>
                            <div className="col-6">
                                <label className="form-label small">Reverso</label>
                                <div
                                    className="card border d-flex align-items-center justify-content-center cursor-pointer"
                                    style={{ aspectRatio: 0.727, position: 'relative', overflow: 'hidden' }}
                                    onClick={() => document.getElementById('back-file-input').click()}
                                >
                                    {backPreview ? (
                                        <img
                                            src={backPreview}
                                            alt="Reverso"
                                            className="img-fluid rounded"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <i className="mdi mdi-plus fs-2 text-muted"></i>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="back-file-input"
                                    type="file"
                                    className="d-none"
                                    accept="image/*"
                                    onChange={(e) => setBackImage(e.target.files[0])}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAB 3: Precio con comparación */}
                <div className={`tab-pane ${activeTab === 'price' ? 'active' : ''}`}>
                    <div className="row g-2 g-md-3">
                        <div className="col-md-6">
                            <div className='mb-1'>
                                <label className="form-label">Precio de venta (S/.)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0.00"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                            </div>
                            {
                                suggestedPrice && <div className='d-flex justify-content-between'>
                                    <div className='fw-bold'>
                                        {(() => {
                                            if (!suggestedPrice) return null;
                                            const val = parseFloat(price);
                                            if (isNaN(val) || val === 0) return null;
                                            const lower = suggestedPrice * 0.95;
                                            const upper = suggestedPrice * 1.10;
                                            if (val < lower) return <span className='text-success'><i className='mdi mdi-check' /> Venderá rápido</span>;
                                            if (val > upper) return <span className='text-danger'><i className='mdi mdi-alert' /> Por encima del mercado</span>;
                                            return <span className='text-warning'><i className='mdi mdi-pulse' /> Competitivo</span>
                                        })()}
                                    </div>
                                    <span className='ms-2 cursor-pointer text-primary' onClick={() => setPrice(suggestedPrice.toFixed(2))}>Usar precio sugerido</span>
                                </div>
                            }
                            <div className='border rounded p-2 mt-2'>
                                <p className="fw-bold mb-2">Desglose de ganancias</p>
                                <div className='d-flex flex-column gap-1'>
                                    <div className="d-flex justify-content-between">
                                        <span>Comprador paga</span>
                                        <span>S/ {Number2Currency(price)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>Comisión de plataforma (8%)</span>
                                        <span>- S/ {Number2Currency(price * 0.08)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>Tarifa de procesamiento</span>
                                        <span>- S/ {Number2Currency(0.50)}</span>
                                    </div>
                                    <hr className='my-0' />
                                    <div className="d-flex justify-content-between fw-bold">
                                        <span>Tú recibes</span>
                                        <span>S/ {Number2Currency((price * 0.92) - 0.50)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className='border rounded p-2'>
                                <p className="fw-bold mb-2">Precios en otras tiendas</p>
                                {selectedCard?.pricing?.length > 0 ? (
                                    <div className='d-flex flex-column gap-1'>
                                        <div className="d-flex justify-content-between">
                                            <span>Precio sugerido</span>
                                            <span>S/ {Number2Currency(suggestedPrice)}</span>
                                        </div>
                                        <hr className='my-0' />
                                        {
                                            selectedCard.pricing.map((p) => {
                                                const solesPrice = p.marketPrice * (p.unit === 'USD' ? Global.USD_PRICE : p.unit === 'EUR' ? Global.EUR_PRICE : 1);
                                                return <div className="d-flex justify-content-between" key={p.id}>
                                                    <span>{p.name}</span>
                                                    <span><small className='text-muted'>({p.unit} {Number2Currency(p.marketPrice)})</small> S/ {Number2Currency(solesPrice)}</span>
                                                </div>
                                            })
                                        }
                                    </div>
                                ) : (
                                    <p className="text-muted mb-0">No hay precios referenciales para esta carta</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAB 4: Publicar con agencias de envío */}
                <div className={`tab-pane ${activeTab === 'publish' ? 'active' : ''}`}>
                    <div className="border rounded p-3 mb-3">
                        <h6>Resumen de la publicación</h6>
                        <ul className="list-unstyled mb-0">
                            <li><strong>Carta:</strong> {selectedCard?.name || '—'}</li>
                            <li><strong>Condición:</strong> {selectedCondition || '—'}</li>
                            <li><strong>Precio:</strong> S/. {price || '—'}</li>
                        </ul>
                    </div>
                    <div>
                        <label className="form-label">Agencias de envío</label>
                        <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="agency1" />
                            <label className="form-check-label" htmlFor="agency1">Serpost</label>
                        </div>
                        <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="agency2" />
                            <label className="form-check-label" htmlFor="agency2">Olva Courier</label>
                        </div>
                        <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="agency3" />
                            <label className="form-check-label" htmlFor="agency3">TNT</label>
                        </div>
                    </div>
                </div>

                {/* Dynamic two-button footer */}
                <div className="d-flex justify-content-between flex-wrap gap-2 mt-3">
                    <button
                        className="btn btn-primary"
                        onClick={goBack}
                        type='button'
                    >
                        {leftBtnLabel}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={activeTab === 'publish' ? onModalSubmit : goNext}
                        disabled={!canGoNext()}
                        type='button'
                    >
                        {rightBtnLabel}
                    </button>
                </div>
            </div>
        </Modal>
    </>
};

CreateReactScript((el, properties) => {
    createRoot(el).render(<BaseAdminto {...properties} title="Mis cartas">
        <Cards {...properties} />
    </BaseAdminto>);
});
