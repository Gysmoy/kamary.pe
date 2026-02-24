import { createRoot } from 'react-dom/client';
import Base from './Components/Tailwind/Base';
import CreateReactScript from './Utils/CreateReactScript';
import React, { useEffect, useRef, useState } from 'react';
import Number2Currency from './Utils/Number2Currency';
import buildSchedule from './Utils/buildSchedule';
import { useBase } from './Components/Tailwind/BaseContext';
import CheckoutSummary from './Components/Public/Checkout/CheckoutSummary';
import resizeImage from './Utils/resizeImage';
import SalesRest from './Actions/sales-rest';

const salesRest = new SalesRest()

const Checkout = ({ prefixes = [], paymentMethods }) => {

    const { cart, session } = useBase()

    if (cart?.length == 0) {
        useEffect(() => {
            const timer = setTimeout(() => {
                location.href = '/catalog';
            }, 3000);
            return () => clearTimeout(timer);
        }, []);

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
                    <i className="ti ti-shopping-cart-off text-6xl text-gray-400 mb-4"></i>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Carrito vacío</h2>
                    <p className="text-gray-600 mb-4">Redirigiendo al catálogo por no tener items en el carrito.</p>
                    <p className="text-sm text-gray-500">Por favor, agrega productos al carrito antes de proceder con el checkout.</p>
                    <div className="mt-6">
                        <div className="animate-pulse flex space-x-1 justify-center">
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                            <div className="h-2 w-2 bg-gray-400 rounded-full animation-delay-200"></div>
                            <div className="h-2 w-2 bg-gray-400 rounded-full animation-delay-400"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const [isDocumentDDOpen, setIsDocumentDDOpen] = useState(false);
    const [isPhoneDDOpen, setIsPhoneDDOpen] = useState(false);
    const documentDDRef = useRef(null);
    const phoneDDRef = useRef(null);

    const [step, setStep] = useState(1);

    const [deliveryPoints, setDeliveryPoints] = useState({});
    const [paymentProofs, setPaymentProofs] = useState({});
    const [termsAccepted, setTermsAccepted] = useState(false)

    const [saving, setSaving] = useState(false)

    const toggleDeliveryPoint = (userId, pointId) => {
        setDeliveryPoints(prev => ({
            ...prev,
            [userId]: pointId
        }));
    }

    const setPaymentProof = async (userId, file) => {
        const optimized = await resizeImage(file)
        setPaymentProofs(old => ({ ...old, [userId]: optimized }))
    }

    const [sale, setSale] = useState({
        documentType: session?.document_type?.toLowerCase(),
        documentNumber: session?.document_number,
        name: session?.name,
        lastname: session?.lastname,
        email: session?.email,
        phone_prefix: '51',
        phone: session?.phone
    })

    const handleSelectDocumentType = (value) => {
        setSale(old => ({ ...old, documentType: value }));
        setIsDocumentDDOpen(false); setIsDocumentDDOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (documentDDRef.current && !documentDDRef.current.contains(event.target)) {
                setIsDocumentDDOpen(false);
            }
            if (phoneDDRef.current && !phoneDDRef.current.contains(event.target)) {
                setIsPhoneDDOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to render visible steps for mobile slider
    const getVisibleSteps = () => {
        if (step <= 2) return [1, 2, 3];
        if (step === 3) return [2, 3, 4];
        return [3, 4];
    };

    const visibleSteps = getVisibleSteps();

    const selectedPrefix = prefixes.find(x => x.realCode == sale.phone_prefix)

    const groupedCart = cart?.reduce((acc, item) => {
        const userId = item.user?.uuid || 'unknown';
        if (!acc[userId]) {
            acc[userId] = {
                username: item.user?.username || 'unknown',
                verified: item.user?.verified,
                points: item.user?.points,
                billing: item.user?.billing ?? 'masterset',
                items: []
            };
        }
        acc[userId].items.push(item);
        return acc;
    }, {});

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault()
        const formData = new FormData()

        // Datos del comprador (customer)
        formData.append('document_type', sale.documentType)
        formData.append('document_number', sale.documentNumber)
        formData.append('name', sale.name)
        formData.append('lastname', sale.lastname)
        formData.append('phone_prefix', sale.phone_prefix)
        formData.append('phone', sale.phone)
        formData.append('email', sale.email)

        // Por cada vendedor (seller) crear un grupo de campos
        Object.entries(groupedCart).forEach(([userId, group], idx) => {
            const prefix = `sellers[${idx}]`

            // seller_id
            formData.append(`${prefix}[seller_id]`, userId)

            // billing
            formData.append(`${prefix}[billing]`, group.billing)

            // delivery_point_id (solo el id, el back completa el resto)
            formData.append(`${prefix}[delivery_point_id]`, deliveryPoints[userId] || '')

            // receipt (archivo subido)
            if (paymentProofs[userId]) {
                formData.append(`${prefix}[receipt]`, paymentProofs[userId])
            }

            // sale_details: array de cartas
            group.items.forEach((item, cardIdx) => {
                const cardPrefix = `${prefix}[cards][${cardIdx}]`
                formData.append(`${cardPrefix}[item_id]`, item.id)
                formData.append(`${cardPrefix}[quantity]`, item.quantity)
                formData.append(`${cardPrefix}[variant]`, item.variant)
            })
        })

        setSaving(true)
        const result = await salesRest.save(formData)
        if (!result) {
            setSaving(false)
            return
        }
        location.href = `/thanks?code=${result.data}`
    }

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return <div className="rounded-xl bg-white px-6 py-8 border border-[#D1D5DC] space-y-8">
                    <div className='space-y-2'>
                        <h4 className="text-3xl font-semibold">Verifica tus datos</h4>
                        <p className='text-silver'>Revisa que la información sea correcta. Necesitarás presentar tu DNI en físico para recoger tus cartas.</p>
                    </div>
                    <form action="" className='space-y-6'>
                        <div className='grid grid-cols-2 gap-6'>
                            <div>
                                <label className="block text-sm mb-2" htmlFor="name">Nombres</label>
                                <div className='relative'>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={sale.name}
                                        disabled
                                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                        placeholder="Tus nombres" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm mb-2" htmlFor="lastname">Apellidos</label>
                                <div className='relative'>
                                    <input
                                        type="text"
                                        id="lastname"
                                        name="lastname"
                                        value={sale.lastname}
                                        disabled
                                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                        placeholder="Tus apellidos" />
                                </div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm mb-2" htmlFor="document">Documento de identidad <span className="text-[#FB2C36]">*</span></label>
                            <div className='relative flex items-center mb-1'>
                                <input
                                    type="text"
                                    id="documentType"
                                    name="documentType"
                                    value={sale.documentType?.toUpperCase()}
                                    disabled
                                    className="px-4 py-3 text-sm border border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 w-20"
                                />
                                <input
                                    type="text"
                                    id="document"
                                    name="document"
                                    value={sale.documentNumber}
                                    disabled
                                    className="w-full px-4 py-3 text-sm border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-600"
                                    placeholder="Ingresa tu número de documento" />
                            </div>
                            <small className="text-xs text-silver">Nos ayuda a evitar fraudes. Necesario para recoger pedidos.</small>
                        </div>
                        <div >
                            <label className="block text-sm mb-2" htmlFor="email">Correo electrónico</label>
                            <div className='relative'>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={sale.email}
                                    disabled
                                    className="w-full px-4 py-3 ps-10 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                    placeholder="Ingresa tu correo electrónico" />
                                <i className='absolute top-1/2 -translate-y-1/2 left-4 ti ti-mail text-silver' />
                            </div>
                        </div>
                        <div className='border-success bg-success bg-opacity-5 text-silver text-xs p-4 rounded' style={{ borderWidth: '1px' }}>
                            <i className='mdi mdi-shield-check-outline text-success me-2'></i>
                            Para garantizar la seguridad y entrega de tus productos se utilizan tus nombres y documento de identidad registrado en tu perfil.
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm mb-2" htmlFor="phone">Teléfono <span className="text-[#FB2C36]">*</span></label>
                            <div className='relative flex items-center mb-1'>
                                <div className="relative" ref={phoneDDRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsPhoneDDOpen(!isPhoneDDOpen)}
                                        className="h-full px-4 py-3 w-40 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:border-primary bg-white flex items-center justify-between"
                                    >
                                        <p className='truncate space-x-1'>
                                            <span className='font-emoji'>{selectedPrefix.flag}</span>
                                            <span>{selectedPrefix.beautyCode}</span>
                                            <small className='text-xs text-silver'>{selectedPrefix.country}</small>
                                        </p>
                                        <i className={`ti ti-chevron-down ml-2 transition-transform ${isPhoneDDOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isPhoneDDOpen && (
                                        <ul className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                            {
                                                prefixes
                                                    .sort((a, b) => a.country.localeCompare(b.country))
                                                    .map(prefix => {
                                                        return <li
                                                            onClick={() => {
                                                                setSale(old => ({ ...old, phone_prefix: prefix.realCode }))
                                                                setIsPhoneDDOpen(false)
                                                            }}
                                                            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                                        >
                                                            <p className='truncate space-x-1'>
                                                                <span className='font-emoji'>{prefix.flag}</span>
                                                                <span>{prefix.beautyCode}</span>
                                                                <small className='text-xs text-silver'>{prefix.country}</small>
                                                            </p>
                                                        </li>
                                                    })
                                            }
                                        </ul>
                                    )}
                                </div>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={sale.phone}
                                    onChange={e => setSale(old => ({ ...old, phone: e.target.value }))}
                                    className="w-full px-4 py-3 text-sm border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:border-primary"
                                    placeholder="999 999 999" />
                            </div>
                            <small className="text-xs text-[#4B5563]">Usaremos este número solo para contacto de seguridad.</small>
                        </div>
                        <div className="text-right">
                            <a href="/profile" className="text-sm text-primary hover:underline">¿Deseas cambiar tus datos?</a>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => window.history.back()}
                                className="block w-full text-center py-3 px-4 text-sm border border-primary text-primary rounded-lg hover:opacity-80"
                                type="button">
                                Regresar
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-3 px-4 text-sm bg-primary text-white rounded-lg hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55 disabled:cursor-not-allowed"
                                type="button"
                                disabled={!sale.phone}>
                                Guardar y continuar
                            </button>
                        </div>
                    </form>
                </div>
            case 2:
                return <div className="grid md:grid-cols-12 gap-2.5">
                    <div className="col-span-7 rounded-xl bg-white p-6 border border-[#D1D5DC] space-y-6">
                        <div className='space-y-2'>
                            <h4 className="text-3xl font-semibold">Elige el punto de recojo</h4>
                            <p className='text-silver'>Podrás elegir en que tienda deseas recoger tus cartas.</p>
                        </div>
                        <div className='space-y-4'>
                            {
                                Object.entries((groupedCart ?? [])).map(([userId, group]) => {
                                    const totalCount = group.items.length
                                    return <div key={userId} className="p-6 rounded-lg border grid md:grid-cols-2 gap-4">
                                        <div className='space-y-4'>
                                            <div>
                                                <h3 className="text-lg font-semibold flex gap-2 items-center underline">
                                                    <i className="mdi mdi-store-outline" />
                                                    <span>
                                                        {group.username}
                                                        {group.verified && <i className='mdi mdi-check-decagram ms-1 text-primary' />}
                                                    </span>
                                                </h3>
                                                <p className='text-sm text-silver'>{totalCount} {totalCount == 1 ? 'carta' : 'cartas'}</p>
                                            </div>
                                            <div className="space-y-4">
                                                {group.items.map((item) => {
                                                    return <div key={item.id} className="flex gap-4">
                                                        <div>
                                                            <img src={`//assets.tcgdex.net/${item.card.language.code}/${item.card.expansion.serie.code}/${item.card.expansion.code}/${item.card.code.split('-')[1]}/low.webp`}
                                                                alt={item.card.fullname} className="w-20 h-auto"
                                                                onError={(e) => {
                                                                    e.target.src = '/images/default/card.png';
                                                                }} />
                                                        </div>
                                                        <div className="flex-1 text-sm">
                                                            <p className="font-bold mb-2">{item.card.fullname}</p>
                                                            <p className="text-silver mb-2">{item.card.expansion.code.toUpperCase()}: {item.card.expansion.name}</p>
                                                            <p className='block text-sm px-3 py-1 bg-gray-50 w-max rounded-full text-silver mb-2'>{item.condition}</p>
                                                            <p className='text-xl font-bold mb-6'>S/ {Number2Currency(item.price)}</p>
                                                            <div className='p-2 border rounded-lg w-max flex gap-2'>
                                                                <span>Cantidad: {item.quantity}</span>
                                                                <i className='mdi mdi-chevron-down'></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                })}
                                            </div>
                                        </div>
                                        <div>
                                            <div className='grid gap-2'>
                                                {group.points.map(point => {
                                                    const isSelected = deliveryPoints[userId]?.includes(point.id)
                                                    return <div
                                                        key={point.id}
                                                        onClick={() => toggleDeliveryPoint(userId, point.id)}
                                                        className={`relative border p-4 rounded-xl h-max cursor-pointer ${isSelected ? 'border-primary' : 'border-gray-300'}`}
                                                    >
                                                        <div className="w-full flex items-center justify-between gap-4 mb-2">
                                                            <span className='w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center'>
                                                                <i className='mdi mdi-store text-silver'></i>
                                                            </span>
                                                            <div className='flex-1'>
                                                                <h4 className='mb-0'>{point.name}</h4>
                                                                <span className='block text-silver text-sm'>{point.district}, {point.department}</span>
                                                            </div>
                                                        </div>
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
                                                        {
                                                            isSelected &&
                                                            <i
                                                                className={`mdi mdi-checkbox-marked-outline text-2xl text-primary absolute top-6 right-6 cursor-pointer`}
                                                            />
                                                        }
                                                    </div>
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                })
                            }
                        </div>
                    </div>
                    <div className='col-span-5 p-6 bg-white rounded-lg space-y-6 h-max'>
                        <CheckoutSummary
                            onPrevClicked={() => setStep(1)}
                            onNextClicked={() => setStep(3)}
                            disableNextButton={Object.keys((groupedCart ?? [])).some(userId => !deliveryPoints[userId]?.length)}
                        />
                    </div>
                </div>
            case 3:
                return <div className="grid md:grid-cols-12 gap-2.5">
                    <div className="col-span-7 rounded-xl bg-white p-6 border border-[#D1D5DC] space-y-6">
                        <div className='space-y-2'>
                            <h4 className="text-3xl font-semibold">Métodos de pago</h4>
                            <p className='text-silver'>Debes realizar el pago por separado a cada uno de los usuarios, ya que se generará un pedido independiente por cada vendedor al que deseas comprar.</p>
                        </div>
                        <div className="space-y-4">
                            {Object.entries(groupedCart).map(([userId, group]) => {
                                const subtotal = group.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                                const user = group.items[0]?.user;
                                const isMasterSet = user?.billing === 'masterset';
                                const methods = isMasterSet
                                    ? (paymentMethods.map(({ type, number, cci, holder }) => ({
                                        account_type: type,
                                        account_number: number,
                                        account_cci: cci,
                                        holder_name: holder
                                    })) || [])
                                    : [{
                                        account_type: user?.account_type,
                                        account_number: user?.account_number,
                                        account_cci: user?.account_cci,
                                        holder_name: user?.holder_name
                                    }];
                                return (
                                    <div key={userId} className="border rounded-xl p-4 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <i className="mdi mdi-account-outline text-silver" />
                                            <span className="font-semibold">{group.username}</span>
                                            {group.verified && <i className="mdi mdi-check-decagram text-primary" />}
                                        </div>

                                        <div className="border-t border-gray-100" />

                                        <div className="flex justify-between items-start gap-4">
                                            <div className="text-sm space-y-2 flex-1">
                                                <p className="text-xs text-silver mb-1">
                                                    {isMasterSet ? 'Pagarás a Masterset (Intermediario)' : 'Pagarás directamente al vendedor'}
                                                </p>
                                                {methods.map((pm, idx) => {
                                                    const label = pm.account_type === 'cci' ? 'Cuenta bancaria' : 'Yape/Plin';
                                                    return (
                                                        <div key={idx} className="space-y-1">
                                                            <p className="text-xs text-silver">{label}</p>
                                                            <p className="font-mono text-sm">{pm.account_number}</p>
                                                            {pm.account_type === 'cci' && (
                                                                <p className="text-xs">CCI: <span className="font-medium">{pm.account_cci}</span></p>
                                                            )}
                                                            <p className="text-xs">Titular: <span className="font-medium">{pm.holder_name}</span></p>
                                                        </div>
                                                    );
                                                })}
                                                <p className="pt-2 text-sm">Subtotal: <span className="font-bold text-primary">S/ {Number2Currency(subtotal)}</span></p>
                                            </div>

                                            {/* 3:4 clickable image placeholder */}
                                            <label className="cursor-pointer flex-shrink-0">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) setPaymentProof(userId, file);
                                                    }}
                                                    className="hidden"
                                                />
                                                {paymentProofs[userId] ? (
                                                    <img
                                                        src={URL.createObjectURL(paymentProofs[userId])}
                                                        alt="Comprobante"
                                                        className="w-24 h-32 object-cover rounded-lg border-2 border-gray-300 hover:border-primary transition"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary transition">
                                                        <i className="mdi mdi-cloud-upload-outline text-gray-400 text-2xl mb-1" />
                                                        <span className="text-xs text-gray-500 text-center px-2">Subir comprobante</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className='col-span-5 p-6 bg-white rounded-lg space-y-6 h-max'>
                        <CheckoutSummary
                            onPrevClicked={() => setStep(2)}
                            onNextClicked={() => setStep(4)}
                            disableNextButton={Object.keys(groupedCart).some(userId => !paymentProofs[userId])}
                        />
                    </div>
                </div>
            case 4:
                return <div className="grid md:grid-cols-12 gap-2.5">
                    {/* Left: order summary with icon, user, selected point, items, subtotal */}
                    <div className="col-span-7 rounded-xl bg-white p-6 border border-[#D1D5DC] space-y-6">
                        <div className='space-y-2'>
                            <h4 className="text-3xl font-semibold">Confirmar pedido</h4>
                            <p className='text-silver'>Revisa tu pedido antes de confirmar.</p>
                        </div>

                        {Object.entries(groupedCart).map(([userId, group]) => {
                            const selectedPoint = group.points.find(p => deliveryPoints[userId]?.includes(p.id));
                            const subtotal = group.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                            return (
                                <div key={userId} className="border rounded-xl p-4 space-y-4">
                                    {/* Icon + Username + Selected Point */}
                                    <div className="flex items-start gap-3">
                                        <i className="mdi mdi-store-outline text-primary text-xl" />
                                        <div className="flex-1">
                                            <p className="font-semibold">{group.username}</p>
                                            <p className="text-sm text-silver">{selectedPoint ? `${selectedPoint.name}, ${selectedPoint.district}` : 'Sin punto seleccionado'}</p>
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Items */}
                                    <div className="space-y-3">
                                        {group.items.map(item => (
                                            <div key={item.id} className="flex gap-3">
                                                <img
                                                    src={`//assets.tcgdex.net/${item.card.language.code}/${item.card.expansion.serie.code}/${item.card.expansion.code}/${item.card.code.split('-')[1]}/low.webp`}
                                                    alt={item.card.fullname}
                                                    className="w-14 h-auto rounded"
                                                    onError={(e) => { e.target.src = '/images/default/card.png'; }}
                                                />
                                                <div className="flex-1 text-sm">
                                                    <p className="font-bold">{item.card.fullname}</p>
                                                    <p className="text-silver">{item.card.expansion.code.toUpperCase()}: {item.card.expansion.name}</p>
                                                    <p className="text-silver">Condición: {item.condition}</p>
                                                    <p className="text-sm">Cantidad: {item.quantity}</p>
                                                </div>
                                                <p className="font-bold text-primary">S/ {Number2Currency(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Subtotal */}
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Subtotal</span>
                                        <span className="font-bold text-primary">S/ {Number2Currency(subtotal)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: usual summary + confirm button */}
                    <div className='col-span-5 p-6 bg-white rounded-lg space-y-6 h-max'>
                        <CheckoutSummary
                            onPrevClicked={() => setStep(3)}
                            onNextClicked={handleCheckoutSubmit}
                            disableNextButton={!termsAccepted || saving}
                            nextLabel="Confirmar compra"
                        >
                            <div className='border p-4 bg-[#E8F5FF] rounded-xl space-y-4 mb-6'>
                                <h4 className='font-medium'>Siguiente pasos:</h4>
                                <div className='flex gap-4'>
                                    <i className='mdi mdi-cube-outline text-primary text-sm' />
                                    <span className='block text-silver text-sm'>Notificaremos a cada vendedor para que entregue tu carta.</span>
                                </div>
                                <div className='flex gap-4'>
                                    <i className='mdi mdi-truck-outline text-primary text-sm' />
                                    <span className='block text-silver text-sm'>Recibirás una notificación por correo cuando tu carta este lista para recojo.</span>
                                </div>
                                <div className='flex gap-4'>
                                    <i className='mdi mdi-check-circle-outline text-primary text-sm' />
                                    <span className='block text-silver text-sm'>Tendrás hasta 72 horas para confirmar la entrega de tu carta</span>
                                </div>
                            </div>
                            <label className='text-xs flex items-center justify-center w-full'>
                                <input type="checkbox" checked={termsAccepted} className='me-2 text-primary focus:ring-primary focus:ring-offset-0' onChange={e => setTermsAccepted(e.target.checked)} />
                                Acepto los <span className='text-primary underline ms-1'>Términos y condiciones</span>
                            </label>
                        </CheckoutSummary>
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
                    <h4 className='text-lg font-bold mb-1'>Checkout</h4>
                    <p className=''>Completa los datos y confirma tu pedido.</p>
                </div>
                <div className='rounded-xl bg-white p-4 sm:p-6 border border-[#D1D5DC]'>
                    {/* Desktop: horizontal stepped bar */}
                    <div className='hidden md:flex gap-4 items-center justify-between'>
                        <div className='flex gap-3 items-center'>
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`}>
                                {step > 1 ? <i className='mdi mdi-check' /> : 1}
                            </span>
                            <span className={`text-lg ${step >= 1 ? 'font-bold' : ''}`}>Contacto</span>
                        </div>
                        <hr className={`flex-1 mx-2 ${step >= 2 ? 'border-primary' : 'border-gray-200'}`} />
                        <div className='flex gap-3 items-center'>
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}>
                                {step > 2 ? <i className='mdi mdi-check' /> : 2}
                            </span>
                            <span className={`text-lg ${step >= 2 ? 'font-bold' : ''}`}>Entrega</span>
                        </div>
                        <hr className={`flex-1 mx-2 ${step >= 3 ? 'border-primary' : 'border-gray-200'}`} />
                        <div className='flex gap-3 items-center'>
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}>
                                {step > 3 ? <i className='mdi mdi-check' /> : 3}
                            </span>
                            <span className={`text-lg ${step >= 3 ? 'font-bold' : ''}`}>Pago</span>
                        </div>
                        <hr className={`flex-1 mx-2 ${step >= 4 ? 'border-primary' : 'border-gray-200'}`} />
                        <div className='flex gap-3 items-center'>
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${step >= 4 ? 'bg-primary' : 'bg-gray-200'}`}>
                                {step > 4 ? <i className='mdi mdi-check' /> : 4}
                            </span>
                            <span className={`text-lg ${step >= 4 ? 'font-bold' : ''}`}>Confirmar</span>
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
                                        {stepNum === 1 ? 'Contacto' : stepNum === 2 ? 'Entrega' : stepNum === 3 ? 'Pago' : 'Confirmar'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {renderStepContent()}
            </div>
        </section>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(<Base {...properties}>
        <Checkout {...properties} />
    </Base>);
});
