import { useEffect, useRef, useState } from "react";

const ContactScreen = ({ prefixes, phonePrefix, setPhonePrefix, phone, setPhone, province, setProvince, district, setDistrict, ubigeo, onSubmit }) => {
    const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false)
    const [isProvinceDropdownOpen, setIsProvinceDropdownOpen] = useState(false);
    const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

    const phoneDropdownRef = useRef()
    const provinceDropdownRef = useRef(null);
    const districtDropdownRef = useRef(null);

    const provinces = ubigeo
        .filter(item => item.department === 'Lima')
        .reduce((acc, item) => {
            const id = item.code.slice(0, 4);
            if (!acc.find(p => p.id === id)) {
                acc.push({ id, province: item.province });
            }
            return acc;
        }, []);

    const districts = ubigeo
        .filter(item => item.province === province)
        .reduce((acc, item) => {
            const id = item.code;
            if (!acc.find(d => d.id === id)) {
                acc.push({ id, district: item.district });
            }
            return acc;
        }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (provinceDropdownRef.current && !provinceDropdownRef.current.contains(event.target)) {
                setIsProvinceDropdownOpen(false);
            }
            if (districtDropdownRef.current && !districtDropdownRef.current.contains(event.target)) {
                setIsDistrictDropdownOpen(false);
            }
            if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target)) {
                setIsPhoneDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedPrefix = prefixes.find(x => x.realCode == phonePrefix)

    return <>
        <div className='mb-8'>
            <h4 className="text-3xl font-bold mb-2 text-start">Activa tu perfil vendedor</h4>
            <p className='text-start w-full text-gray-600'>Pedimos estos datos para proteger tus ventas y habilitar tus pagos.</p>
        </div>
        <form onSubmit={onSubmit} className="text-start" >
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="phone">Teléfono <span className="text-[#FB2C36]">*</span></label>
                <div className='relative flex items-center mb-1'>
                    <div className="relative" ref={phoneDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsPhoneDropdownOpen(!isPhoneDropdownOpen)}
                            className="h-full px-4 py-3 w-40 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:border-primary bg-white flex items-center justify-between"
                        >
                            <p className='truncate space-x-1'>
                                <span className='font-emoji'>{selectedPrefix.flag}</span>
                                <span>{selectedPrefix.beautyCode}</span>
                                <small className='text-xs text-silver'>{selectedPrefix.country}</small>
                            </p>
                            <i className={`ti ti-chevron-down ml-2 transition-transform ${isPhoneDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isPhoneDropdownOpen && (
                            <ul className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                {
                                    prefixes
                                        .sort((a, b) => a.country.localeCompare(b.country))
                                        .map(prefix => {
                                            return <li
                                                onClick={() => {
                                                    setPhonePrefix( prefix.realCode)
                                                    setIsPhoneDropdownOpen(false)
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
                        type="phone"
                        id="phone"
                        name="phone"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:border-primary"
                        placeholder="999 999 999" />
                </div>
                <small className="text-xs text-[#4B5563]">Usaremos este número solo para contacto de seguridad.</small>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="province">Ciudad <span className="text-[#FB2C36]">*</span></label>
                <div className="relative w-full " ref={provinceDropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsProvinceDropdownOpen(!isProvinceDropdownOpen)}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary bg-white flex items-center justify-between"
                    >
                        {province || 'Selecciona una provincia'}
                        <i className={`ti ti-chevron-down ml-2 transition-transform ${isProvinceDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isProvinceDropdownOpen && (
                        <ul className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
                            {provinces.map((p) => (
                                <li
                                    key={p.id}
                                    onClick={() => {
                                        setProvince(p.province);
                                        setDistrict('');
                                        setIsProvinceDropdownOpen(false);
                                    }}
                                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                >
                                    {p.province}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="mb-8">
                <label className="block text-sm font-medium mb-2" htmlFor="district">Distrito <span className="text-[#FB2C36]">*</span></label>
                <div className="relative w-full " ref={districtDropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
                        disabled={!province}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary bg-white flex items-center justify-between disabled:opacity-50"
                    >
                        {district || 'Selecciona un distrito'}
                        <i className={`ti ti-chevron-down ml-2 transition-transform ${isDistrictDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDistrictDropdownOpen && (
                        <ul className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
                            {districts.map((d) => (
                                <li
                                    key={d.id}
                                    onClick={() => {
                                        setDistrict(d.district);
                                        setIsDistrictDropdownOpen(false);
                                    }}
                                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                >
                                    {d.district}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <a href="/" className="block w-full text-center py-3 px-4 text-sm border border-primary text-primary rounded-lg hover:opacity-80" type="button">
                    Cancelar
                </a>
                <button className="w-full py-3 px-4 text-sm bg-primary text-white rounded-lg hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55 disabled:cursor-not-allowed" type="submit" disabled={!phone || !province || !district}>{
                    'Continuar'
                }</button>
            </div>
        </form>
    </>
}

export default ContactScreen