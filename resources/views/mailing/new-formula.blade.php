<!DOCTYPE html
    PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tu fórmula única</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet">
    <link href="{{ env('APP_URL') }}/lte/assets/css/icons.min.css" rel="stylesheet" type="text/css" />
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', sans-serif;
        }
    </style>
</head>

<body style="margin: 0; padding: 0; background-color: #fff; font-family: Arial, sans-serif;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0"
                    style="background-color: #F9F3EF; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td align="center"
                            style="padding: 10px 20px 20px; background-color: #C5B8D4; border-radius: 8px 8px 0 0;">
                            <img src="https://vua.pe/assets/img/logo.png" alt=""
                                style="width: 200px; aspect-ratio: 2/1">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px;">
                            <h1 style="color: #404040; margin: 0; font-size: 24px; font-weight: normal;">
                                Hola {{ explode(' ', $formula?->user?->name ?? 'Vua lover')[0] }}!
                            </h1>
                            <h2 style="color: #404040; margin: 10px 0; font-size: 28px;">¡Tu fórmula única está lista!
                            </h2>
                        </td>
                    </tr>

                    <!-- Benefits Tags -->
                    <tr>
                        <td align="center" style="padding: 0 20px 30px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        @foreach ($hair_goals as $goal)
                                            <span
                                                style="display: inline-block; background-color: #F7C2C6; color: #404040; padding: 8px 20px; border-radius: 20px; margin: 2.5px; font-weight: bold">{{ $goal->description }}
                                                profunda</span>
                                        @endforeach
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Progress Bars -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="padding: 10px 0;">
                                        @php
                                            $hydration = [
                                                'oily' => ['percent' => '25%', 'label' => 'BAJO'],
                                                'normal' => ['percent' => '55%', 'label' => 'MODERADO'],
                                                'dry' => ['percent' => '95%', 'label' => 'ALTO'],
                                            ];
                                        @endphp
                                        <p style="margin: 0 0 5px; color: #404040;">Tu falta de hidratación en el
                                            cabello:</p>
                                        <div
                                            style="background-color: #EFEAE5; height: 10px; border-radius: 10px; width: 100%;">
                                            <div
                                                style="background-color: #C5B8D4; height: 10px; border-radius: 10px; width: {{ $hydration[$formula->scalpType->correlative]['percent'] }};">
                                                &nbsp;
                                            </div>
                                        </div>
                                        <p
                                            style="margin: 5px 0 0; text-align: right; color: #404040; font-weight: bold">
                                            {{ $hydration[$formula->scalpType->correlative]['label'] }}
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <p style="margin: 0 0 5px; color: #404040;">Tu nivel de daño químico en el
                                            cabello:</p>
                                        <div
                                            style="background-color: #EFEAE5; height: 10px; border-radius: 10px; width: 100%;">
                                            <div
                                                style="background-color: #C5B8D4; height: 10px; border-radius: 10px; width: {{ $formula->hasTreatment->correlative == 'true' ? '95%' : '55%' }};">
                                                &nbsp;
                                            </div>
                                        </div>
                                        <p
                                            style="margin: 5px 0 0; text-align: right; color: #404040; font-weight: bold">
                                            {{ $formula->hasTreatment->correlative == 'true' ? 'ALTO' : 'MODERADO' }}
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        @php
                                            $heat_damage = ['percent' => '25%', 'label' => 'BAJO'];
                                            if ($formula->hasTreatment->correlative == 'true') {
                                                if ($formula->scalpType->correlative == 'normal') {
                                                    $heat_damage['percent'] = '55%';
                                                    $heat_damage['label'] = 'MODERADO';
                                                }
                                                if ($formula->scalpType->correlative == 'dry') {
                                                    $heat_damage['percent'] = '95%';
                                                    $heat_damage['label'] = 'ALTO';
                                                }
                                            }
                                        @endphp
                                        <p style="margin: 0 0 5px; color: #404040;">Tu nivel de daño por calor en el
                                            cabello:</p>
                                        <div
                                            style="background-color: #EFEAE5; height: 10px; border-radius: 10px; width: 100%;">
                                            <div
                                                style="background-color: #C5B8D4; height: 10px; border-radius: 10px; width: {{ $heat_damage['percent'] }};">
                                                &nbsp;
                                            </div>
                                        </div>
                                        <p
                                            style="margin: 5px 0 0; text-align: right; color: #404040; font-weight: bold">
                                            {{ $heat_damage['label'] }}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <div style="padding: 40px">
                        <a href="{{ env('APP_URL') }}/formula/{{ $formula->id }}"
                            style="padding: .57rem 4rem; background-color: #C5B8D4; color: #fff; text-decoration: none; display:block; margin: auto; width: max-content">COMPRAR</a>
                    </div>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #404040; margin: 0 0 20px; font-size: 24px; text-align: center;">Estos
                                serán tus
                                activos:</h2>
                            <p style="color: #404040; margin: 0 0 30px; text-align: center;">Tu fórmula única cumplirá
                                tus objetivos
                                gracias a</p>

                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                @foreach ($supplies as $index => $supply)
                                    @if ($index % 2 == 0)
                                        <tr>
                                    @endif
                                    <td width="50%" style="padding: 10px;">
                                        <table role="presentation" width="100%" border="0" cellspacing="0"
                                            cellpadding="0"
                                            style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 8px;">
                                            <tr>
                                                <td style="padding: 15px;">
                                                    <img src="https://vua.pe/api/supplies/media/{{ $supply->image }}"
                                                        style="width: 100%; object-fit: contain; object-position: center; aspect-ratio: 1;"
                                                        alt="">
                                                    <h3 style="margin: 0; color: #404040; font-size: 18px;">
                                                        {{ $supply->name }}</h3>
                                                    <p style="margin: 5px 0 0; color: #404040;">
                                                        {{ $supply->description }}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    @if ($index % 2 == 1 || $loop->last)
                    </tr>
                    @endif
                    @endforeach
                </table>
            </td>
        </tr>
        <div style="padding: 40px">
            <a href="{{ env('APP_URL') }}/formula/{{ $formula->id }}"
                style="padding: .57rem 4rem; background-color: #C5B8D4; color: #fff; text-decoration: none; display:block; margin: auto; width: max-content">COMPRAR</a>
        </div>
        <tr>
            <td align="center" style="padding: 20px 0px; background-color: #C5B8D4; border-radius: 0 0 8px 8px">
                <div style="padding: 2.5%; margin: auto; width: max-content">
                    @foreach ($socials as $social)
                        <a href="{{ $social['link'] }}" class="{{ $social['icon'] }}"
                            style="display: block; width: 40px; height: 40px; background-color: #fff; border-radius: 990px">
                            <img src="{{ env('APP_URL') }}/assets/mailing/{{ strtolower($social['description']) }}.png" alt=""
                                style="width: 100%; height: 100%; object-fit: contain;">
                        </a>
                    @endforeach
                </div>
            </td>
        </tr>
    </table>
    </td>
    </tr>
    </table>
</body>

</html>
