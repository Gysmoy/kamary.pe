const RegisterScreen = ({ onSubmit, email, setEmail, loading }) => {
    return <>
        <div className='mb-8'>
            <h4 className="text-3xl font-bold mb-2 text-center">Crear cuenta</h4>
            <p className='text-center w-full text-gray-600'>Te enviaremos un código de acceso a tu correo.</p>
        </div>
        <form onSubmit={onSubmit} className="text-start">
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2" htmlFor="email">Correo electrónico</label>
                <div className='relative'>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3 ps-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="Ingresa tu correo electrónico" />
                    <i className='absolute top-1/2 -translate-y-1/2 left-4 ti ti-mail text-silver' />
                </div>
            </div>

            <div className='bg-[#E8F5FF] text-xs p-2 rounded mb-6'>
                Revisa tu bandeja de entrada y spam. El código es válido solo por unos minutos.
            </div>

            <div className="grid">
                <button className="w-full py-3 px-4 text-sm bg-primary text-white rounded-md hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55" type="submit" disabled={!email || loading}>{
                    loading ? 'Enviando...' : 'Enviar código'
                }</button>
            </div>
        </form>
    </>
}

export default RegisterScreen