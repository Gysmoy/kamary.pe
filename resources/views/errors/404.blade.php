<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 | {{ env('APP_NAME') }}</title>
    <link rel="shortcut icon" href="/images/icon.png" type="image/png">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href='https://fonts.googleapis.com/css?family=Poppins' rel='stylesheet'>
    <link href="/lte/assets/css/icons.min.css" rel="stylesheet" type="text/css" />
    <style>
        * {
            font-family: Poppins;
            box-sizing: border-box;
        }

        .bg-masterset-blue {
            background-color: #306EFF;
        }

        .bg-masterset-light {
            background-color: #e8d8df;
        }

        .text-masterset-blue {
            color: #306EFF;
        }

        .border-masterset-blue {
            border-color: #306EFF;
        }

        .hover\:bg-masterset-blue:hover {
            background-color: #306EFF;
        }
    </style>
</head>

<body class="bg-white min-h-screen flex flex-col">
    <main class="flex-grow flex flex-col items-center justify-center px-4 py-12 text-center">
        <div class="max-w-md mx-auto">
            <h1 class="text-9xl font-bold text-masterset-blue flex items-center justify-center gap-4">
                <span>4</span>
                <img src="/images/icon.png" alt="" style="height: 100px;">
                <span>4</span>
            </h1>

            <div class="mt-6 mb-10">
                <h2 class="text-3xl font-semibold text-gray-700">¡Página no encontrada!</h2>
                <p class="mt-4 text-gray-600">
                    Lo sentimos, la página que estás buscando no existe o ha sido movida.
                </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <a href="/"
                    class="w-full bg-masterset-blue text-white px-6 py-3 rounded-md hover:bg-opacity-90 transition-all">
                    <i class="ti ti-home me-1"></i>
                    Inicio
                </a>
                <a href="/catalog"
                    class="w-full bg-white border border-masterset-blue text-masterset-blue px-6 py-3 rounded-md hover:bg-masterset-blue hover:text-white transition-all">
                    <i class="ti ti-cards me-1"></i>
                    Catalogo
                </a>
            </div>
        </div>
    </main>
</body>

</html>
