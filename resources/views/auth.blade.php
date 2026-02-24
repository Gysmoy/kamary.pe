<!DOCTYPE html>
<html lang="es" data-layout-mode="fluid" data-menu-color="light">

<head>
    @viteReactRefresh
    <meta charset="utf-8" />
    <title>Auth | {{ env('APP_NAME') }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta content="A fully featured admin theme which can be used to build CRM, CMS, etc." name="description" />
    <meta content="Coderthemes" name="author" />

    <!-- App favicon -->
    <link rel="icon" type="image/png" href="/assets/img/icons/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/assets/img/icons/favicon.svg" />
    <link rel="shortcut icon" href="/assets/img/icons/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/img/icons/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-title" content="Ursa" />
    <link rel="manifest" href="/manifest.webmanifest">

    <!-- Theme Config Js -->
    <script src="/lte/assets/js/config.js"></script>

    <!-- Vendor css -->
    <link href="/lte/assets/css/vendor.min.css" rel="stylesheet" type="text/css" />

    <!-- App css -->
    <link href="/lte/assets/css/app.min.css" rel="stylesheet" type="text/css" id="app-style" />

    <!-- Icons css -->
    <link href="/lte/assets/css/icons.min.css" rel="stylesheet" type="text/css" />
    <link href="/lte/assets/css/mdi-icons.css" rel="stylesheet" type="text/css" />

    @vite(['resources/css/app.css', 'resources/js/' . Route::currentRouteName()])
    @inertiaHead
</head>

<body>

    <div class="auth-bg d-flex min-vh-100">
        <div class="row g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
            <div class="col-xxl-3 col-lg-5 col-md-6">
                <a href="index.html" class="auth-brand d-flex justify-content-center mb-2">
                    <img src="/assets/img/logo.svg" alt="dark logo" height="26" style="height: 32px;">
                </a>

                <p class="fw-semibold mb-4 text-center text-muted fs-15">Accede a tu panel de administración</p>
                <div class="card overflow-hidden text-center p-xxl-4 p-3 mb-0">
                    @inertia
                </div>
                <p class="mt-4 text-center mb-0">
                    <script>
                        document.write(new Date().getFullYear())
                    </script> © {{ env('APP_NAME') }}
                </p>
            </div>
        </div>
    </div>

    <!-- Vendor js -->
    <script src="/lte/assets/js/vendor.min.js"></script>

    <!-- App js -->
    <script src="/lte/assets/js/app.js"></script>

</body>

</html>
