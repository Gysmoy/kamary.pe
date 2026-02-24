import { useEffect, useRef, useState } from "react";

const ProfileScreen = ({
    email,
    name, setName,
    lastname, setLastname,
    documentType, setDocumentType,
    documentNumber, setDocumentNumber,
    username, setUsername,
    onSubmit, loading
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleSelectDocumentType = (value) => {
        setDocumentType(value);
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        // Allow only letters and a single space between words
        const sanitized = value
            .replace(/[^a-zA-Z\s]/g, '') // Remove any non-letter and non-space characters
            .replace(/\s+/g, ' ');       // Replace multiple spaces with a single space
        setUsername(sanitized);
    };

    return <>
        <div className='mb-8'>
            <h4 className="text-3xl font-bold mb-2 text-center">Completa tu perfil</h4>
            <p className='text-center w-full text-gray-600'>Solo tomará unos segundos.</p>
        </div>
        <form onSubmit={onSubmit} className="text-start">
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="email">Correo electrónico</label>
                <div className='relative'>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-3 ps-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="Ingresa tu correo electrónico" />
                    <i className='absolute top-1/2 -translate-y-1/2 left-4 ti ti-mail text-silver' />
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="name">Nombres <span className="text-[#FB2C36]">*</span></label>
                <div className='relative'>
                    <input
                        type="name"
                        id="name"
                        name="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="Tus nombres" />
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="lastname">Apellidos <span className="text-[#FB2C36]">*</span></label>
                <div className='relative'>
                    <input
                        type="lastname"
                        id="lastname"
                        name="lastname"
                        value={lastname}
                        onChange={e => setLastname(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="Tus apellidos" />
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="document">Documento de identidad <span className="text-[#FB2C36]">*</span></label>
                <div className='relative flex items-center mb-1'>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="h-full px-4 py-3 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:border-primary bg-white flex items-center justify-between"
                        >
                            {documentType.toUpperCase()}
                            <i className={`ti ti-chevron-down ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDropdownOpen && (
                            <ul className="absolute top-full left-0 mt-1 w-20 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                                <li
                                    onClick={() => handleSelectDocumentType('dni')}
                                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                >
                                    DNI
                                </li>
                                <li
                                    onClick={() => handleSelectDocumentType('ce')}
                                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                >
                                    CE
                                </li>
                            </ul>
                        )}
                    </div>
                    <input
                        type="text"
                        id="document"
                        name="document"
                        value={documentNumber}
                        onChange={e => setDocumentNumber(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:border-primary"
                        placeholder="Ingresa tu número de documento" />
                </div>
                <small className="text-xs text-[#4B5563]">Nos ayuda a evitar fraudes. Necesario para recoger pedidos.</small>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="username">Nombre de usuario <span className="text-[#FB2C36]">*</span></label>
                <div className='relative mb-1'>
                    <input
                        type="username"
                        id="username"
                        name="username"
                        value={username}
                        onChange={handleUsernameChange}
                        className="w-full px-4 py-3 ps-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="Cómo quieres que te vean en MasterSet" />
                    <i className='absolute top-1/2 -translate-y-1/2 left-4 ti ti-user text-silver' />
                </div>
                <small className="text-xs text-[#4B5563]">Este será tu nombre público en la plataforma.</small>
            </div>
            <div className='bg-[#E8F5FF] text-xs p-4 rounded mb-6'>
                Puedes editar estos datos después en tu perfil.
            </div>
            <div className="grid">
                <button className="w-full py-3 px-4 text-sm bg-primary text-white rounded-md hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55" type="submit" disabled={loading}>{
                    loading ? 'Enviando...' : 'Guardar y continuar'
                }</button>
            </div>
        </form>
    </>
}

export default ProfileScreen