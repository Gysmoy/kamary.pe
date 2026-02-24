<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $title }}</title>
  <link href="{{ asset('lte/assets/css/icons.min.css') }}" rel="stylesheet" type="text/css" />
  <style>
    * {
      margin: 0;
      padding: 0;
      font-family: 'Poopins', sans-serif;
      box-sizing: border-box;
      color: #fff;
    }
  </style>
</head>

<body
  style="background-image: url('{{ asset('assets/mailing/background.png') }}'); background-repeat: no-repeat; background-size: cover; min-height: 100vh; background-position: center;">
  <img src="{{ asset('assets/img/logo.png') }}" alt="Vuá" style="width: 100px; display: block; margin: 2.5% auto;">
  <div
    style="background-image: url('{{ asset('assets/mailing/background-2.png') }}'); background-repeat: no-repeat; background-size: cover; height: max-content; background-position: top center;">
    <div style="max-width: 600px; width: 100%; margin: auto; text-align: center; padding: 7.5%;">
      <h1 style="font-size: 48px; font-weight: bold; margin-bottom: 20px;">Bien!</h1>
      <h2 style="font-weight: lighter; margin-bottom: 20px;">Estás a punto de convertirte en un Vuá lover ✨</h2>
      <ul style="display: flex; flex-wrap: wrap; column-gap: 25px; justify-content: center; margin-bottom: 7.5%;">
        <li>Guarda tus fórmulas únicas</li>
        <li>Beneficios en tu cumpleaños</li>
        <li>Recibe las promos del mes primero</li>
      </ul>
      <a href="{{ route('confirmation', $preUser['confirmation_token']) }}"
        style="display: block; padding: 12px 24px; border-radius: 990px; background-color: #A191B8; border: none; width: max-content; margin: auto; color: #fff; text-decoration: none; font-weight: bold">CONFIRMAR
        CORREO</a>
    </div>
  </div>
  <div style="padding: 2.5%; margin: auto; width: max-content">
    @foreach ($socials as $social)
      <a href="{{ $social['link'] }}" class="{{ $social['icon'] }}"
        style="display: block, width: 20px; height: 20px; background-color: #fff; border-radius: 990px">{{ $social['name'] }}</a>
    @endforeach
  </div>
</body>

</html>