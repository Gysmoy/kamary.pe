<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', sans-serif;
        }
    </style>
</head>

<body>
    <div style="max-width: 1000px; margin: 0 auto; font-family: sans-serif; padding: 10px; display: flex; flex-direction: column; gap: 8px">
        @foreach ($items as $item)
            <div style="display: flex; gap: 20px; padding: 10px; background: #fafafa; align-items: center">
                <img src="https://vua.pe/api/items/media/{{ $item['image'] }}" alt="{{ $item['name'] }}"
                    style="width: 72px; height: 96px; object-fit: cover; object-position: center; border-radius: 8px;">
                <div>
                    <div style="font-size: 30px;">{{ $item['name'] }}</div>
                    <div style="font-size: 26px; color: #555; margin-top: 4px;">
                        {{ intval($item['count']) }} {{ $item['count'] == 1 ? 'botella' : 'botellas' }}
                    </div>
                </div>
            </div>
        @endforeach
    </div>
</body>

</html>
