const Brands = () => {
    return <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-auto">
        <div className="block absolute -top-full left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl aspect-square z-0" style={{
            background: 'radial-gradient(circle, rgba(47, 59, 82, 0.66) 0%, rgba(47, 59, 82, 0) 70%)'
        }} />
        <div className="space-y-10">
            <div className="relative flex flex-col md:flex-row gap-10 items-start md:justify-between md:items-center z-10">
                <div>
                    <legend className="text-sm uppercase">Marcas</legend>
                    <h4 className="font-title text-4xl font-semibold">Encuentra tu respuesto por marca</h4>
                </div>
                <button className="py-4 px-6 rounded-full bg-container font-semibold">
                    SABER MAS
                </button>
            </div>
            <div className="relative grid grid-cols-3 lg:grid-cols-4 gap-6 z-10">
                <div className="relative h-40 md:h-60 lg:h-80 lg:col-span-2">
                    <img src="/assets/img/brands/brand-benelli.png" alt="" className="block h-full w-full object-cover object-center rounded-lg" />
                    <img src="/assets/img/brands/brand-mini-benelli.png" alt="" className="block max-h-12 w-3/4 md:w-1/2 lg:w-1/3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-auto object-contain object-center" />
                </div>
                <div className="relative h-40 md:h-60 lg:h-80">
                    <img src="/assets/img/brands/brand-bajaj.png" alt="" className="block h-full w-full object-cover object-center rounded-lg" />
                    <img src="/assets/img/brands/brand-mini-bajaj.png" alt="" className="block lg:hidden max-h-12 w-3/4 md:w-1/2 lg:w-1/3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-auto object-contain object-center" />
                </div>
                <div className="relative h-40 md:h-60 lg:h-80">
                    <img src="/assets/img/brands/brand-ktm.png" alt="" className="block h-full w-full object-cover object-center rounded-lg" />
                    <img src="/assets/img/brands/brand-mini-ktm.png" alt="" className="block lg:hidden max-h-12 w-3/4 md:w-1/2 lg:w-1/3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-auto object-contain object-center" />
                </div>
            </div>
            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 p-10 bg-container rounded-2xl auto-rows-max z-10">
                <img src="/assets/img/brands/brand-mini-triumph.png" alt="" className="max-h-12 w-full h-full object-contain" />
                <img src="/assets/img/brands/brand-mini-honda.png" alt="" className="max-h-12 w-full h-full object-contain" />
                <img src="/assets/img/brands/brand-mini-aprilia.png" alt="" className="max-h-12 w-full h-full object-contain" />
                <img src="/assets/img/brands/brand-mini-norton.png" alt="" className="max-h-12 w-full h-full object-contain" />
                <img src="/assets/img/brands/brand-mini-suzuki.png" alt="" className="max-h-12 w-full h-full object-contain" />
                <img src="/assets/img/brands/brand-mini-kawasaki.png" alt="" className="max-h-12 w-full h-full object-contain" />
                <img src="/assets/img/brands/brand-mini-ktm.png" alt="" className="max-h-12 w-full h-full object-contain" />
                <img src="/assets/img/brands/brand-mini-bajaj.png" alt="" className="max-h-12 w-full h-full object-contain" />
            </div>
        </div>
        <div className="block absolute top-full left-0 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl aspect-square z-0" style={{
            background: 'radial-gradient(circle, rgba(47, 59, 82, 0.66) 0%, rgba(47, 59, 82, 0) 70%)'
        }} />
    </section>
}

export default Brands