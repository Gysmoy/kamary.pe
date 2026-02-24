<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8" />
    <title>Código de inicio de sesión</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f7fb; font-family:Arial, Helvetica, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fb; padding:40px 0;">
        <tr>
            <td align="center">

                <table width="100%" cellpadding="0" cellspacing="0"
                    style="max-width:480px; background-color:#ffffff; border-radius:8px; padding:32px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

                    <!-- Logo -->
                    <tr>
                        <td style="text-align:center; padding-bottom:16px;">
                            <img src="{{ asset('images/logo.png') }}" alt="Logo" style="max-height:48px;">
                        </td>
                    </tr>

                    <!-- Header -->
                    <tr>
                        <td style="text-align:center; padding-bottom:24px;">
                            <h1 style="margin:0; font-size:22px; color:#111827;">
                                Código de autenticación
                            </h1>
                        </td>
                    </tr>

                    <!-- Message -->
                    <tr>
                        <td
                            style="font-size:14px; color:#374151; line-height:1.6; text-align:center; padding-bottom:24px;">
                            Usa el siguiente código para iniciar sesión.
                            Este código es válido por unos minutos.
                        </td>
                    </tr>

                    <!-- Code -->
                    <tr>
                        <td align="center" style="padding-bottom:32px;">
                            <div
                                style="display:inline-block; background-color:#f3f4f6; padding:16px 32px; border-radius:6px; font-size:24px; letter-spacing:6px; font-weight:bold; color:#111827;">
                                {{ $code }}
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="font-size:12px; color:#6b7280; text-align:center; line-height:1.5;">
                            Si no solicitaste este código, puedes ignorar este mensaje.
                            <br />
                            © 2025 {{ env('APP_NAME') }}. Todos los derechos reservados.
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>

</html>
