<!DOCTYPE html>
<html lang="es">

<head>
    @viteReactRefresh
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>{{ env('APP_NAME', 'Ursa Repuestos') }}</title>

    <meta name="title" content="Ursa Repuestos" />
    <meta name="description"
        content="Tienda especializada en repuestos para motos Benelli. Encuentra motor, transmisión, frenos, suspensión y accesorios originales y alternativos a precios justos. Envío rápido y garantía de calidad." />
    <meta name="keywords"
        content="repuestos para motos, repuestos Benelli, tienda repuestos Benelli, repuestos originales Benelli, repuestos alternativos moto, motor Benelli, transmisión Benelli, frenos Benelli, suspensión Benelli, accesorios Benelli, repuestos Benelli TNT, repuestos Benelli TRK 502, repuestos Benelli 302, partes para motos, comprar repuestos Benelli online, envío rápido repuestos moto" />
    {{-- Canonical URL --}}
    <link rel="canonical" href="{{ url()->current() }}" />

    {{-- Open Graph / Facebook --}}
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{{ url()->current() }}" />
    <meta property="og:title" content="Ursa Repuestos" />
    <meta property="og:description"
        content="Tienda especializada en repuestos para motos Benelli. Encuentra motor, transmisión, frenos, suspensión y accesorios originales y alternativos a precios justos. Envío rápido y garantía de calidad." />
    <meta property="og:image" content="{{ asset('/assets/img/icons/og-image.jpg') }}" />
    <meta property="og:image:alt" content="Ursa Repuestos - Especialistas en repuestos Benelli" />
    <meta property="og:site_name" content="Ursa Repuestos" />
    <meta property="og:locale" content="es_ES" />

    {{-- Twitter / X --}}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="{{ url()->current() }}" />
    <meta name="twitter:title" content="Ursa Repuestos" />
    <meta name="twitter:description"
        content="Tienda especializada en repuestos para motos Benelli. Encuentra motor, transmisión, frenos, suspensión y accesorios originales y alternativos a precios justos. Envío rápido y garantía de calidad." />
    <meta name="twitter:image" content="{{ asset('/assets/img/icons/og-image.jpg') }}" />
    <meta name="twitter:image:alt" content="Ursa Repuestos - Especialistas en repuestos Benelli" />

    {{-- WhatsApp --}}
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    {{-- Instagram --}}
    <meta name="instagram:card" content="summary_large_image" />
    <meta name="instagram:title" content="Ursa Repuestos" />
    <meta name="instagram:description"
        content="Tienda especializada en repuestos para motos Benelli. Encuentra motor, transmisión, frenos, suspensión y accesorios originales y alternativos a precios justos. Envío rápido y garantía de calidad." />
    <meta name="instagram:image" content="{{ asset('/assets/img/icons/og-image.jpg') }}" />


    <link rel="icon" type="image/png" href="/assets/img/icons/icon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/assets/img/icons/icon.svg" />
    <link rel="shortcut icon" type="image/svg+xml" href="/assets/img/icons/icon.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/img/icons/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-title" content="Ursa" />
    <link rel="manifest" href="/manifest.webmanifest">

    <link href="/lte/assets/css/icons.min.css" rel="stylesheet" type="text/css" />
    <link href="/lte/assets/css/mdi-icons.css" rel="stylesheet" type="text/css" />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Noto+Color+Emoji&display=swap"
        rel="stylesheet">

    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">

    <style>
        * {
            font-family: Inter;
            box-sizing: border-box;
        }

        .font-title {
            font-family: "Instrument Sans", sans-serif;
        }

        .font-emoji {
            font-family: "Noto Color Emoji", sans-serif;
        }
    </style>

    @if ($component == 'Formula.jsx')
        <script type="application/javascript" src="https://checkout.culqi.com/js/v4"></script>
        <script type="application/javascript" src="https://3ds.culqi.com" defer></script>
        <script type="application/javascript" src="https://js.openpay.pe/openpay.v1.min.js"></script>
        <script type="application/javascript" src="https://js.openpay.pe/openpay-data.v1.min.js"></script>
    @elseif ($component == 'MyAccount.jsx')
        <link href="/lte/assets/libs/dxdatagrid/css/dx.light.compact.css?v=06d3ebc8-645c-4d80-a600-c9652743c425"
            rel="stylesheet" type="text/css" id="dg-default-stylesheet" />
        <link href="/lte/assets/libs/dxdatagrid/css/dx.dark.compact.css?v=06d3ebc8-645c-4d80-a600-c9652743c425"
            rel="stylesheet" type="text/css" id="dg-dark-stylesheet" disabled="disabled" />
    @endif

    @isset($component)
        @vite(['resources/css/app.css', 'resources/js/' . $component . '.jsx'])
    @else
        @vite(['resources/css/app.css'])
    @endisset
    @inertiaHead

    <style>
        .ql-editor blockquote {
            border-left: 4px solid #f8b62c;
            padding-left: 16px;
        }

        .ql-editor * {
            color: #475569;
        }

        .ql-editor img {
            border-radius: 8px;
        }
    </style>

</head>

<body>
    @inertia

    <script src="/lte/assets/js/vendor.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flowbite@2.4.1/dist/flowbite.min.js"></script>
    <script src="/lte/assets/libs/moment/min/moment.min.js"></script>
    <script src="/lte/assets/libs/moment/moment-timezone.js"></script>
    <script src="/lte/assets/libs/moment/locale/es.js"></script>

    <script src="/lte/assets/libs/tippy.js/tippy.all.min.js"></script>

    <script>
        document.addEventListener('click', function(event) {
            const target = event.target;

            if (target.tagName === 'BUTTON' && target.hasAttribute('href')) {
                const href = target.getAttribute('href');

                if (target.getAttribute('target') === '_blank') {
                    window.open(href, '_blank');
                } else {
                    window.location.href = href;
                }
            }
        });
    </script>
</body>

</html>
