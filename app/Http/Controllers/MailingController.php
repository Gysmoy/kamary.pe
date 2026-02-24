<?php

namespace App\Http\Controllers;

use App\Helpers\EmailConfig;
use App\Models\Message;
use App\Models\Social;
use App\Models\Subscription;
use Exception;
use Illuminate\Http\Request;
use SoDe\Extend\File;
use SoDe\Extend\JSON;
use SoDe\Extend\Text;
use Illuminate\Support\Facades\View;
use SMTPValidateEmail\Validator as SMTP_Validate_Email;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;

class MailingController extends BasicController
{
    public $model = 'Mailing';
    public $reactView = 'Unsubscribe';
    public $reactRootView = 'public';

    public function setReactViewProperties(Request $request)
    {
        $id = $request->email;
        $subJpa = Subscription::where('id', $id)->first();
        if (!$subJpa) return redirect('/');
        $subJpa->update(['status' => false]);

        try {
            new Fetch(env('WA_URL') . '/api/send', [
                'method' => 'POST',
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'body' => [
                    'apiKey' => env('EVOAPI_APIKEY'),
                    'from' => env('EVOAPI_INSTANCE'),
                    'to' => [env('WAGROUP_VENTAS_ID')],
                    'attachment' => [[
                        'filename' => 'unsubscribe.jpeg',
                        'uri' => 'https://envoke.com/wp-content/uploads/2021/11/blog-cant-unsubscribe.jpg',
                    ]],
                    'content' => 'El correo ' . $subJpa->description . ' se ha desuscrito de las notificaciones automáticas.',
                ],
            ]);
        } catch (\Throwable $th) {
        }

        return [
            'email' => $subJpa->description,
        ];
    }

    static function isValid(string $email)
    {
        $dominio = substr(strrchr($email, "@"), 1);
        if (!checkdnsrr($dominio, "MX")) return false;

        $validator = new SMTP_Validate_Email();
        $result = $validator->validate([$email], env('MAIL_FROM_ADDRESS'));

        return $result[$email];
    }

    public function send(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $email = $request->email;
            $subject = $request->subject;
            $content = $request->content;

            $dominio = substr(strrchr($email, "@"), 1);
            if (!checkdnsrr($dominio, "MX")) throw new Exception("Dominio sin servidor de correo");

            $validator = new SMTP_Validate_Email();
            $result = $validator->validate([$email], env('MAIL_FROM_ADDRESS'));

            if (!$result[$email]) throw new Exception("El correo no existe o no es válido");

            $subJpa = Subscription::where('description', $email)->where('status', true)->first();
            if (!$subJpa) throw new Exception("El correo no está suscrito a la lista");

            $mail = EmailConfig::config();
            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body = $content . '<div style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
                Este correo fue enviado automáticamente, por favor no responda a este correo.
                <div style="margin-top: 10px;">
                    <a href="' . env('APP_URL') . '/unsubscribe?email=' . urlencode($subJpa->id) . '" style="color: #999;">Desuscribirse de esta lista</a>
                </div>
            </div>';
            if (env('APP_ENV') == 'production') {
                $mail->addAddress($email);
            } else {
                $mail->addAddress('gamboapalominocarlosmanuel@gmail.com');
            }
            $mail->send();
            try {
                $mail->smtpClose();
            } catch (\Throwable $th) {
                // dump('Cerrando STMP Connection: '.$th->getMessage());
            }
        });
        return response($response->toArray(), $response->status);
    }

    static function notifyContact(Message $messageJpa)
    {
        try {
            $content = File::get('../storage/app/utils/mailing/contact.html');
            $data =  [
                'contact' => $messageJpa->toArray(),
                'domain' => env('APP_DOMAIN')
            ];
            $mail = EmailConfig::config();
            $mail->Subject = '¡Gracias por escribirnos!';
            $mail->isHTML(true);
            $mail->Body = Text::replaceData($content, JSON::flatten($data), [
                'contact.name' => fn($x) => explode(' ', $x)[0]
            ]);
            $mail->addAddress($messageJpa->email, $messageJpa->name);
            $mail->send();
        } catch (\Throwable $th) {
            if (\env('APP_ENV') == 'local') {
                dump($th->getMessage());
            }
        }
    }

    static function simpleNotify(string $view, string $email, array $data, array $ccs = [])
    {
        try {

            $socials = Social::where('visible', true)->where('status', true)->get();
            $data =  \array_merge(
                ['socials' => $socials->toArray()],
                $data
            );
            $content = View::make($view, $data)->render();

            $mail = EmailConfig::config();
            $mail->Subject = $data['title'] ?? 'Hola que tal?';
            $mail->isHTML(true);
            $mail->Body = $content;
            $mail->addAddress($email);
            foreach ($ccs as $cc) {
                $mail->addCC($cc);
            }
            $mail->send();
        } catch (\Throwable $th) {
            if (\env('APP_ENV') == 'local') {
                dump($th->getMessage());
            }
        }
    }
}
