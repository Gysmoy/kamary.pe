import React, { useEffect, useState } from 'react'
import Number2Currency from '../../../Utils/Number2Currency';
import InputMask from 'react-input-mask';
import Select from 'react-select';
import Global from '../../../Utils/Global';
import { Notify } from 'sode-extend-react';

// 🔍 JSON con reglas básicas
const CARD_RULES = [
    { type: 'visa', startswith: [/^4/], mask: '9999 9999 9999 9999', cvvMask: '999' },
    { type: 'mastercard', startswith: [/^5[1-5]/, /^2[2-7]/], mask: '9999 9999 9999 9999', cvvMask: '999' },
    { type: 'amex', startswith: [/^3[47]/], mask: '9999 999999 99999', cvvMask: '9999' },
    { type: 'discover', startswith: [/^6(?:011|5|4[4-9])/], mask: '9999 9999 9999 9999', cvvMask: '999' },
    { type: 'diners', startswith: [/^3(?:0[0-5]|[68])/], mask: '9999 999999 9999', cvvMask: '999' },
    { type: 'jcb', startswith: [/^35[2-8]/], mask: '9999 9999 9999 9999', cvvMask: '999' },
    { type: 'maestro', startswith: [/^(5[06-9]|6[0-9])/], mask: '9999 9999 9999 9999', cvvMask: '999' },
];

// 🎯 función para detectar tipo de tarjeta
function detectCardType(number) {
    const clean = number.replace(/\D/g, '');
    for (const rule of CARD_RULES) {
        if (rule.startswith.some(r => r.test(clean))) {
            return rule;
        }
    }
    return { type: 'unknown', mask: '9999 9999 9999 9999', cvvMask: '999' };
}

const OpenPayModal = ({ isOpen, amount, openPayId, openPayPublicKey, handleToken, handleError, onRequestClose = () => { } }) => {
    OpenPay.setId(openPayId)
    OpenPay.setApiKey(openPayPublicKey);
    OpenPay.setSandboxMode(Global.APP_ENV == 'local');

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => (document.body.style.overflow = '');
    }, [isOpen]);

    const [cardNumber, setCardNumber] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardType, setCardType] = useState({ type: 'unknown', mask: '9999 9999 9999 9999', cvvMask: '999' });
    const [installments, setInstallments] = useState([]);
    const [selectedInstallment, setSelectedInstallment] = useState(null);
    const [loadingInstallments, setLoadingInstallments] = useState(false);

    const [loading, setLoading] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault();
        const [expMonth, expYear] = expiry.split('/').map(s => s.trim());

        // Validar campos requeridos
        if (!cardNumber || !cardholderName || !expMonth || !expYear || !cvv) {
            Notify.add({
                icon: '/images/icon.png',
                title: 'Campos incompletos',
                body: 'Por favor completa todos los campos requeridos.',
                type: 'danger'
            });
            return;
        }

        const request = {
            "card_number": cardNumber.replace(/\s/g, ''),
            "holder_name": cardholderName,
            "expiration_year": expYear || '',
            "expiration_month": expMonth || '',
            "cvv2": cvv,
        };
        setLoading(true);
        OpenPay.token.create(
            request,
            (result) => {
                setLoading(false);
                handleToken(result);
            },
            (error) => {
                setLoading(false);
                Notify.add({
                    icon: '/images/icon.png',
                    title: error?.message ?? 'Error inesperado',
                    body: error?.data?.description ?? 'Ocurrió un error desconocido al tokenizar la tarjeta',
                    type: 'danger'
                });
                handleError(error);
            }
        );
    };

    // Detectar tipo de tarjeta cada vez que cambia el número
    useEffect(() => {
        const newCardType = detectCardType(cardNumber);
        setCardType(newCardType);
        const clean = cardNumber.replace(/\D/g, '');
        if (clean.length >= 6 && openPayId) {
            const bin = clean.slice(0, 6);
            fetchInstallments(bin);
        } else {
            setInstallments([]);
            setSelectedInstallment(null);
        }
    }, [cardNumber, openPayId]);

    const fetchInstallments = async (bin) => {
        setLoadingInstallments(true);
        try {
            const res = await fetch(`https://api.openpay.pe/v1/${openPayId}/bines/${bin}/promotions`);
            const data = await res.json();
            const opts = (data.installments || []).map(n => ({
                value: n,
                label: n === 1 ? `${n} cuota` : `${n} cuotas`
            }));
            setInstallments(opts);
            setSelectedInstallment(opts.length ? opts[0] : null);
        } catch (e) {
            setInstallments([]);
            setSelectedInstallment(null);
        } finally {
            setLoadingInstallments(false);
        }
    };

    const customSelectStyles = {
        control: (provided) => ({
            ...provided,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(64,64,64,0.4)',
            borderRadius: 0,
            minHeight: '32px',
            boxShadow: 'none',
            '&:hover': { borderBottom: '1px solid rgba(64,64,64,0.4)' }
        }),
        valueContainer: (provided) => ({
            ...provided,
            paddingLeft: 0
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#404040',
            fontSize: '14px'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: 'rgba(64,64,64,0.4)',
            fontSize: '14px'
        }),
        indicatorSeparator: () => ({ display: 'none' }),
        dropdownIndicator: (provided) => ({
            ...provided,
            color: 'rgba(64,64,64,0.4)',
            padding: '0 8px 0 0'
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(64,64,64,0.2)',
            borderRadius: '4px',
            marginTop: '4px'
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#C5B8D4' : 'transparent',
            color: '#404040',
            fontSize: '14px',
            '&:hover': { backgroundColor: 'rgba(197,184,212,0.3)' }
        })
    };

    return (
        <div
            className="fixed inset-0 w-screen h-screen bg-black bg-opacity-75 z-[99]"
            hidden={!isOpen}
        >
            <div className="h-[420px] w-[650px] m-auto shadow-lg rounded-2xl absolute inset-0 z-[100]">
                <div className="bg-white h-full w-full relative rounded-2xl">
                    {/* Panel del producto */}
                    <div className="bg-gradient-to-r from-[#C5B8D4] to-[#DBC8C9] h-full w-[45%] flex flex-col justify-between p-4 shadow-xl absolute left-0 rounded-br-3xl rounded-l-2xl">
                        <div className="flex-1 flex items-center justify-center">
                            <img
                                className="w-full h-auto"
                                src="https://vua.pe/api/bundles/media/624a278e-62b4-41d0-9b96-57647cf4f727.png"
                                alt="Product"
                            />
                        </div>
                        <div className="mx-auto text-base text-center text-white rounded-full font-semibold text-nowrap">
                            Precio Total: S/ {Number2Currency(amount)}
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="absolute w-3/5 top-0 right-0 font-semibold bg-[#C5B8D4] py-2 px-4 ps-8 text-lg text-white rounded-2xl rounded-l-full uppercase shadow-lg">
                    Ingresa los Datos de Pago
                    <button onClick={onRequestClose} className='float-end absolute top-1/2 -translate-y-1/2 right-3'>
                        <i className='mdi mdi-24px mdi-close font-semibold text-white'></i>
                    </button>
                </div>

                {/* Formulario */}
                <div className="absolute w-[350px] h-full top-14 right-0">
                    <form className="space-y-4 p-4" onSubmit={handleSubmit}>
                        {/* Número de tarjeta */}
                        <fieldset>
                            <label htmlFor='cardNumber' className="block text-xs text-[#404040] font-medium mb-1">
                                Número de Tarjeta <span className="text-[#404040]/60 text-[10px]">({cardType.type})</span>
                            </label>
                            <InputMask
                                id='cardNumber'
                                mask={cardType.mask}
                                value={cardNumber}
                                onChange={e => setCardNumber(e.target.value)}
                                className="w-full h-8 bg-transparent border-b border-[#404040]/40 text-[#404040] placeholder:text-[#404040]/40 focus:outline-none focus:border-[#C5B8D4]"
                                placeholder="0000 0000 0000 0000"
                            />
                        </fieldset>

                        {/* Titular */}
                        <fieldset>
                            <label htmlFor='cardHolderName' className="block text-xs text-[#404040] font-medium mb-1">
                                Nombre del Titular
                            </label>
                            <input
                                id='cardHolderName'
                                type="text"
                                value={cardholderName}
                                onChange={e => setCardholderName(e.target.value.toUpperCase())}
                                className="w-full h-8 bg-transparent border-b border-[#404040]/40 text-[#404040] placeholder:text-[#404040]/40 focus:outline-none focus:border-[#C5B8D4]"
                            />
                        </fieldset>

                        {/* Vencimiento y CVV */}
                        <div className="flex gap-4">
                            <fieldset className="w-3/5">
                                <label className="block text-xs text-[#404040] font-medium mb-1">
                                    Vencimiento
                                </label>
                                <InputMask
                                    mask="99/99"
                                    value={expiry}
                                    onChange={e => {
                                        let val = e.target.value;
                                        const [month] = val.split('/');
                                        if (month && parseInt(month, 10) > 12) {
                                            val = `12/${val.split('/')[1] || ''}`;
                                        }
                                        setExpiry(val);
                                    }}
                                    placeholder="MM/YY"
                                    className="w-full h-8 bg-transparent border-b border-[#404040]/40 text-[#404040] placeholder:text-[#404040]/40 focus:outline-none focus:border-[#C5B8D4]"
                                />
                            </fieldset>

                            <fieldset className="w-2/5">
                                <label htmlFor='cardCVV' className="block text-xs text-[#404040] font-medium mb-1">
                                    CVV
                                </label>
                                <InputMask
                                    id='cardCVV'
                                    mask={cardType.cvvMask}
                                    value={cvv}
                                    onChange={e => setCvv(e.target.value)}
                                    className="w-full h-8 bg-transparent border-b border-[#404040]/40 text-[#404040] placeholder:text-[#404040]/40 focus:outline-none focus:border-[#C5B8D4]"
                                />
                            </fieldset>
                        </div>

                        {/* Cuotas */}
                        <fieldset>
                            <label className="block text-xs text-[#404040] font-medium mb-1">
                                Número de cuotas
                            </label>
                            <Select
                                value={selectedInstallment}
                                onChange={setSelectedInstallment}
                                options={installments}
                                isLoading={loadingInstallments}
                                isDisabled={loadingInstallments || !installments.length}
                                placeholder="Selecciona cuotas"
                                noOptionsMessage={() => 'Sin cuotas disponibles'}
                                styles={customSelectStyles}
                            />
                        </fieldset>

                        {/* Botón */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`block mx-auto mt-8 px-6 py-2 rounded-full bg-[#C5B8D4] text-white font-bold shadow-lg ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {loading ? 'Generando token...' : 'Confirmar y Pagar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OpenPayModal;
