@php
    $totalIncome = array_sum(array_column($data, 'total_amount'));
    $totalTransactions = array_sum(array_column($data, 'count'));
    // Establece el locale a español para que date() devuelva el mes en español
    setlocale(LC_TIME, 'es_ES.UTF-8', 'es_ES', 'esp');
    $roas = $totalIncome > 0 ? number_format($totalIncome / (abs($summary['totalOutcomeAds']) ?: 1), 2) : '0.00';
    $cac = $totalTransactions > 0 ? number_format($totalIncome / $totalTransactions, 2) : '0.00';
@endphp

<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Reporte ventas {{ ucfirst($summary['range']) }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            font-family: 'Poppins', sans-serif;
            box-sizing: border-box;
        }
    </style>
</head>

<body style="background: linear-gradient(to bottom right, #C4B8D3, #EBCDB2); color: #fff; width: 1080px; height: 908px;">
    <header style="padding: 40px; display: flex; justify-content: space-between">
        <div style="border: 1px solid #fff; border-radius: 20px; display: flex;">
            <h1 style="font-size: 32px; font-weight: bold; padding: 10px 25px">Reportes ventas</h1>
            <h1
                style="font-size: 32px; background-color: #fff; color: #A191B8; font-weight: bold; padding: 10px 20px; border-radius: 18px;">
                {{ ucfirst($summary['range']) }}
            </h1>
        </div>
        <div>
            <img src="{{ asset('images/logo.png') }}" alt="">
        </div>
    </header>
    <main style="padding: 40px; padding-top: 0;">
        <section style="display: flex; gap: 20px;">
            <!-- Montos a la izquierda -->
            <div style="flex: 1;">
                <div style="margin-bottom: 20px;">
                    <h1 style="font-weight: bold;">Venta total:</h1>
                    <div style="font-size: 56px; font-weight: 900;">S/ {{ number_format($totalIncome, 2) }}</div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h1 style="font-weight: bold;">Gasto publicidad:</h1>
                    <div style="font-size: 56px; font-weight: 900;">S/
                        {{ number_format(abs($summary['totalOutcomeAds']), 2) }}</div>
                </div>
                <div style="display: flex; gap: 40px;">
                    <div>
                        <h1 style="font-weight: bold;">ROAS:</h1>
                        <div style="font-size: 56px; font-weight: 900;">{{ $roas }}</div>
                    </div>
                    <div style="flex: 1;">
                        <h1 style="font-weight: bold;">CAC:</h1>
                        <div style="font-size: 56px; font-weight: 900;">{{ $cac }}</div>
                    </div>
                </div>
            </div>
            <!-- Items a la derecha dentro de un cuadro blanco -->
            <div style="flex: 1; background-color: #fff; color: #333; border-radius: 15px; padding: 50px 40px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h1 style="font-weight: bold; font-size: 32px;">Transacciones:</h1>
                    <div style="font-size: 32px;">{{ number_format($totalTransactions ?? 0) }}</div>
                </div>
                @foreach ($summary['items'] as $item)
                    <div
                        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h1 style="font-weight: bold; font-size: 32px;">{{ $item['name'] }}:</h1>
                        <div style="font-size: 32px;">{{ number_format($item['total'] ?? 0) }}</div>
                    </div>
                @endforeach
            </div>
        </section>
        <section style="margin-top: 40px;">
            <!-- Simulación de gráfica con tabla -->
            <table style="border-collapse: collapse; width: 100%;">
                <!-- Primera fila: barras simuladas -->
                <tr>
                    @foreach ($data as $item)
                        @php
                            $tdWidth = 1000 / count($data);
                            $divWidth = $tdWidth * 0.9;
                        @endphp
                        <td style="vertical-align: bottom; text-align: center; width: {{ $tdWidth }}px; padding-bottom: 5px">
                            @php
                                $max = max(array_column($data, 'total_amount'));
                                $height = $max > 0 ? min(200, ($item['total_amount'] / $max) * 200) : 0;
                            @endphp
                            <div style="background-color: #A191B8; width: 60%; margin: 0 auto; height: {{ $height }}px; border-radius: 10px;"></div>
                        </td>
                    @endforeach
                </tr>
                <!-- Segunda fila: etiquetas con bordes -->
                <tr>
                    @foreach ($data as $item)
                        @php
                            $tdWidth = 1000 / count($data);
                        @endphp
                        <td style="border: 1px solid #fff; font-weight: 900; text-align: center; color: #fff; padding: 5px 0px; font-size: 14px; text-align: center; width: {{ $tdWidth }}px;">
                            <div>{{ \Carbon\Carbon::parse($item['date'])->format('d') }}</div>
                        </td>
                    @endforeach
                </tr>
            </table>
        </section>
    </main>
</body>

</html>
