const SummaryScreen = ({ user }) => {
    return <>
        <img src="/assets/img/utils/user-summary.png" alt="Resumen de usuario" className="w-48 block mx-auto" />
        <div className='mb-8'>
            <h4 className="text-3xl font-bold mb-2 text-center">¡Tu cuenta está lista!</h4>
            <p className='text-center w-full text-gray-600'>Ya puedes empezar a comprar cartas Pokemon TCG en MasterSet. Explora miles de ofertas de vendedores verificados.</p>
        </div>
        <div className="border rounded-xl py-4 px-6 mb-8">
            <span className="block font-semibold mb-3">Información de cuenta</span>
            <div className="space-y-3 text-silver">
                <span className="block text-sm">
                    <i className="mdi mdi-account-outline me-2"></i>
                    {user.fullname} ({user.username})
                </span>
                <span className="block text-sm">
                    <i className="mdi mdi-email-outline me-2"></i>
                    {user.email}
                </span>
                <span className="block text-sm">
                    <i className="mdi mdi-clipboard-account-outline me-2"></i>
                    {user.document_type}: {user.document_number}
                </span>
            </div>
        </div>
        <div className="border rounded-xl py-4 px-6 mb-8 bg-[#E8F5FF]">
            <span className="block font-semibold mb-3">¿Qué puedes hacer ahora?</span>
            <div className="space-y-3 text-silver">
                <span className="block text-sm">
                    <i className="mdi mdi-check-circle-outline text-[#00A63E] me-2"></i>
                    Buscar y comprar cartas de vendedores verificados
                </span>
                <span className="block text-sm">
                    <i className="mdi mdi-check-circle-outline text-[#00A63E] me-2"></i>
                    Coordinar recojo en tiendas de confianza
                </span>
                <span className="block text-sm">
                    <i className="mdi mdi-check-circle-outline text-[#00A63E] me-2"></i>
                    Protección de comprador incluida en cada transacción
                </span>
                <span className="block text-sm">
                    <i className="mdi mdi-check-circle-outline text-[#00A63E] me-2"></i>
                    Mejorar a vendedor cuando quieras compartir tu colección
                </span>
            </div>
        </div>
        <div className="grid gap-6">
            <a href="/catalog" className="w-full py-3 px-4 text-sm text-center bg-primary text-white rounded-md hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55" type="submit">
                <i className="mdi mdi-cart-outline me-2"></i>
                Explorar cartas disponibles
            </a>
            <a href={`/onboarding/${user.uuid}`} className="mx-auto block underline text-primary text-sm">Convertirme en vendedor</a>
        </div>
    </>
}

export default SummaryScreen