const SummaryScreen = () => {
    return <>
        <div className='mb-8'>
            <h4 className="text-3xl font-bold mb-2 text-center">¡Listo, ya puedes empezar a <br className="hidden md:block" /> vender!</h4>
            <p className='text-center w-full text-gray-600'>Ya puedes publicar tu primera carta. Si más adelante quieres verificación de tienda, podrás solicitarla.</p>
        </div>
        <div className="border rounded-xl py-4 px-6 mb-8 bg-[#E8F5FF]">
            <span className="block font-semibold mb-3">Próximos pasos:</span>
            <div className="space-y-3 text-silver">
                <span className="block text-sm">
                    <i className="mdi mdi-check-circle-outline text-[#00A63E] me-2"></i>
                    Publica tus cartas con fotos reales para mayor confianza
                </span>
                <span className="block text-sm">
                    <i className="mdi mdi-check-circle-outline text-[#00A63E] me-2"></i>
                    Configura tus puntos de recojo
                </span>
                <span className="block text-sm">
                    <i className="mdi mdi-check-circle-outline text-[#00A63E] me-2"></i>
                    Recibe pagos seguros después de cada recojo confirmado
                </span>
            </div>
        </div>
        <div className="grid gap-6">
            <a href="/my-collection" className="w-full py-3 px-4 text-sm text-center bg-primary text-white rounded-md hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55" type="submit">
                <i className="mdi mdi-cube-outline me-2"></i>
                Publicar mi primera carta
            </a>
            <a href="/" className="mx-auto block underline text-primary text-sm">Volver al inicio</a>
        </div>
    </>
}

export default SummaryScreen