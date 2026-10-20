<!DOCTYPE html>
<html lang="es">

<head>
    @viteReactRefresh
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $seo['title'] ?? 'Farmacia Kamary Perú' }}</title>
    <meta name="description" content="{{ $seo['description'] ?? '' }}" />
    <link rel="canonical" href="{{ url()->current() }}" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="{{ url()->current() }}" />
    <meta property="og:title" content="{{ $seo['title'] ?? 'Farmacia Kamary Perú' }}" />
    <meta property="og:description" content="{{ $seo['description'] ?? '' }}" />
    <meta property="og:image" content="{{ asset($seo['image'] ?? '/web/slider/Imag-home-4.webp') }}" />
    <meta property="og:site_name" content="Farmacia Kamary Perú" />
    <meta property="og:locale" content="es_PE" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{{ $seo['title'] ?? 'Farmacia Kamary Perú' }}" />
    <meta name="twitter:description" content="{{ $seo['description'] ?? '' }}" />
    <meta name="twitter:image" content="{{ asset($seo['image'] ?? '/web/slider/Imag-home-4.webp') }}" />

    <link rel="icon" type="image/png" href="/web/brand/favicon.png" />
    <link rel="apple-touch-icon" href="/web/brand/favicon.png" />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <style>
        html { scroll-behavior: smooth; }
        /* Grano sutil sobre superficies navy */
        .kf-noise::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .05; mix-blend-mode: overlay;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .kf-marquee-pause:hover .animate-kf-marquee { animation-play-state: paused; }
        .kf-hide-scroll { scrollbar-width: none; } .kf-hide-scroll::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            .animate-kf-marquee, .animate-kf-kenburns { animation: none !important; }
        }
        body { font-family: 'Inter', system-ui, sans-serif; color: #35415b; background: #FBFAF8; -webkit-font-smoothing: antialiased; margin: 0; }
    </style>

    @isset($component)
        @vite(['resources/css/app.css', 'resources/js/' . $component . '.jsx'])
    @else
        @vite(['resources/css/app.css'])
    @endisset
    @inertiaHead
</head>

<body>
    @inertia
</body>

</html>
