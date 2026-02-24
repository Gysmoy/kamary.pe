<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedido</title>
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
    <div style="background: linear-gradient(to bottom right, #C3B9D2, #EACCB0); padding: 40px; width: 680px;">
        @if (isset($sale->formula->id))
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h2 style="color: #fff; padding: 10px 20px; border: 1px solid #fff; border-radius: 16px;">
                    Tu fórmula única, {{ explode(' ', $sale->name)[0] }}:
                </h2>
                <img src="https://vua.pe/assets/img/logo.svg" alt="Vua" style="height: 40px; margin-top: -15px;">
            </div>
            <div
                style="background-color: #fff; padding: 20px; border-radius: 16px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                <p>
                    <b>
                        <img src="https://vua.pe/assets/img/emojis/face-glass.png" alt=""
                            style="height: 18px; width: 18px; object-fit: contain; object-position: center; padding-top: 5px;">
                        ¿Tu cabello recibió tratamiento?
                    </b>
                    {{ $sale->formula->hasTreatment->description }}
                </p>
                <p>
                    <b>
                        <img src="https://vua.pe/assets/img/emojis/eyes.png" alt=""
                            style="height: 18px; width: 18px; object-fit: contain; object-position: center; padding-top: 5px;">
                        Tipo de cabello
                    </b>
                    {{ $sale->formula->scalpType->description }}
                </p>
                <p>
                    <b>
                        <img src="https://vua.pe/assets/img/emojis/check.png" alt=""
                            style="height: 18px; width: 18px; object-fit: contain; object-position: center; padding-top: 5px;">
                        Cuero cabelludo
                    </b>
                    {{ $sale->formula->hairType->description }}
                </p>
                <p>
                    <b>
                        <img src="https://vua.pe/assets/img/emojis/check.png" alt=""
                            style="height: 18px; width: 18px; object-fit: contain; object-position: center; padding-top: 5px;">
                        Grosor de cabello
                    </b>
                    {{ $sale->formula->hairThickness->description }}
                </p>
                <p>
                    <b>
                        <img src="https://vua.pe/assets/img/emojis/bulb.png" alt=""
                            style="height: 18px; width: 18px; object-fit: contain; object-position: center; padding-top: 5px;">
                        Objetivos
                    </b>
                    @foreach ($sale->formula->hair_goals_list as $goal)
                        {{ $goal->description }},
                    @endforeach
                </p>
                <p>
                    <b>
                        <img src="https://vua.pe/assets/img/emojis/flower.png" alt=""
                            style="height: 18px; width: 18px; object-fit: contain; object-position: center; padding-top: 5px;">
                        Fragancia
                    </b>
                    {{ $sale->formula->fragrance->name }}
                </p>
            </div>
        @endif
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h2 style="color: #fff; padding: 10px 20px; border: 1px solid #fff; border-radius: 16px;">
                Resumen de tu pedido @if (!isset($sale->formula->id))
                    - {{ explode(' ', $sale->name)[0] }}:
                @endif
            </h2>
            @if (!isset($sale->formula->id))
                <img src="https://vua.pe/assets/img/logo.svg" alt="Vua" style="height: 40px; margin-top: -15px;">
            @endif
        </div>
        <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            @php
                $lastFormula = $sale->user_formula_id;
            @endphp
            @foreach ($sale->details as $detail)
                @if ($detail->user_formula_id != $lastFormula)
                    @php
                        $lastFormula = $detail->user_formula_id;
                    @endphp
        </div>
        <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            @endif
            <div style="width: 146.25px; background-color: #fff; border-radius: 16px; position: relative;">
                @if ($detail->quantity > 1)
                    <span
                        style="display: block; position: absolute; background-color: #9577B9; padding: 2px 10px; color: #fff; border-radius: 25px; right: 8px; top: 8px;">×{{ round($detail->quantity) }}</span>
                @endif
                @if (isset($detail->colors) && count($detail->colors) > 0)
                    <img src="https://vua.pe/api/colors/media/{{ $detail->colors[0]['image'] }}"
                        alt="{{ $detail->name }}"
                        style="width: 100%; aspect-ratio: 3/4; object-fit: cover; object-position: center;">
                @else
                    <img src="https://vua.pe/api/items/media/{{ $detail->item->image }}" alt="{{ $detail->name }}"
                        style="width: 100%; aspect-ratio: 3/4; object-fit: cover; object-position: center;">
                @endif
                <div
                    style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 5px; gap: 5px;">
                    <b style="text-align: center;">{{ $detail->name }}</b>
                    <div style="display: flex; justify-content: center; gap: 5px;">
                        @foreach ($detail->colors as $color)
                            <span
                                style="display: block; width: 20px; height: 20px; background-color: {{ $color['hex'] }}; border: 1px solid #000; border-radius: 50%;"></span>
                        @endforeach
                    </div>
                </div>
            </div>
            @endforeach
        </div>
        <div
            style="background-color: #fff; padding: 20px; border-radius: 16px; display: flex; justify-content: space-between; gap: 5px;">
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <p>
                    <b>Status:</b>
                    @if ($sale->status_id == 'f13fa605-72dd-4729-beaa-ee14c9bbc47b')
                        <span
                            style="background-color: rgba(255,91,91,.18); width: 22px; height: 22px; display: inline-block; text-align: center; border-radius: 50%; color: #ff5b5b; border: 1px solid #ff5b5b;">✗</span>
                    @else
                        <span
                            style="background-color: rgba(16,196,105,.18); width: 22px; height: 22px; display: inline-block; text-align: center; border-radius: 50%; color: #10c469; border: 1px solid #10c469;">✓</span>
                    @endif
                    {{ $sale->status->name }}
                </p>
                <p>
                    <b>Tipo de envío:</b>
                    @if ($sale->delivery == null)
                        Por Shalom - Pago en destino
                    @elseif ($sale->delivery == 0)
                        Envío gratis (S/ 0.00)
                    @else
                        S/. {{ $sale->delivery }}
                    @endif
                </p>
            </div>
            <div style="text-align: end; display: flex; flex-direction: column; gap: 10px;">
                <p style="text-wrap: nowrap;">
                    Subtotal: S/ {{ round($sale->total_amount * 0.82, 2) }}
                </p>
                <p style="text-wrap: nowrap;">
                    igv: S/ {{ round($sale->total_amount * 0.18, 2) }}
                </p>
                <p style="text-wrap: nowrap;">
                    Total:
                    <b>S/ {{ round($sale->total_amount, 2) }}</b>
                </p>
            </div>
        </div>
    </div>
</body>

</html>
