<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Facturación Electrónica</title>

    {{-- React Login CSS (estilos premium) --}}
    <link rel="stylesheet" href="{{ asset('react-app/login/login.css') }}" />
</head>

<body style="margin:0;padding:0;background:#0a0e1a;">

    <div id="app">
        @yield('content')
    </div>

    {{-- React Login JS --}}
    <script src="{{ asset('react-app/login/login.js') }}"></script>
    @stack('scripts')
</body>

</html>