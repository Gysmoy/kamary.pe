<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Atalaya\Business;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WhatsAppController extends Controller
{
    public function verify(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $instanceName = env('EVOAPI_INSTANCE') . $request->session;
            $res = new Fetch(env('EVOAPI_URL') . '/instance/fetchInstances?instanceName=' . $instanceName, [
                'headers' => ['apikey' => env('EVOAPI_APIKEY')]
            ]);

            $raw = $res->text();
            $data = JSON::parseable($raw);
            if (!$res->ok) throw new Exception($data['response']['message'] ?? 'Error al verificar WhatsApp');

            if ($data[0]['connectionStatus'] !== 'open') throw new Exception('WhatsApp desconectado. Escanee el QR');

            $session = $data[0];
            return [
                'pushname' => $session['profileName'],
                'profile' => $session['profilePicUrl'],
                'me' => [
                    'user' => explode('@', $session['ownerJid'])[0],
                    'server' => explode('@', $session['ownerJid'])[1]
                ],
            ];
        });

        return response($response->toArray(), $response->status);
    }

    /**
     * Envía datos formateados como SSE
     */
    private function write($content)
    {
        $data = is_array($content) ? JSON::stringify($content) : $content;
        echo 'data: ' . $data . Text::lineBreak(2);

        while (ob_get_level() > 0) {
            @ob_end_flush();
        }
        flush();

        if (connection_aborted() || connection_status() === CONNECTION_ABORTED) {
            throw new \RuntimeException('Client disconnected');
        }
    }

    /**
     * Convierte la sesión de WhatsApp en un array con la info del perfil
     */
    private function getProfile(array $session): array
    {
        return [
            'pushname' => $session['profileName'] ?? null,
            'profile' => $session['profilePicUrl'] ?? null,
            'me' => [
                'user'   => explode('@', $session['ownerJid'])[0] ?? null,
                'server' => explode('@', $session['ownerJid'])[1] ?? null,
            ],
        ];
    }

    /**
     * Endpoint SSE para iniciar/verificar conexión de WhatsApp
     */
    public function stream(Request $request)
    {
        $response = new StreamedResponse(function () use ($request) {
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');

            $this->write('ping');
            $this->write(['status' => 'loading_screen']);

            $instanceName = env('EVOAPI_INSTANCE') . $request->session;

            // 1. Consultar instancia actual
            $sessionRes = new Fetch(env('EVOAPI_URL') . '/instance/fetchInstances?instanceName=' . $instanceName, [
                'headers' => ['apikey' => env('EVOAPI_APIKEY')]
            ]);
            $sessions = $sessionRes->json();

            // 2. Si hay sesión activa -> enviar ready y salir
            if ($sessionRes->ok && !empty($sessions) && $sessions[0]['connectionStatus'] === 'open') {
                $this->write(['status' => 'ready', 'info'   => $this->getProfile($sessions[0])]);
                return;
            }

            // 3. Si no existe, intentar crear la sesión
            if (!$sessionRes->ok) {
                $body = [
                    'integration'   => 'WHATSAPP-BAILEYS',
                    'instanceName'  => $instanceName,
                    'token'         => env('EVOAPI_APIKEY'),
                ];
                new Fetch(env('EVOAPI_URL') . '/instance/create', [
                    'method'  => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'apikey'       => env('EVOAPI_APIKEY')
                    ],
                    'body'    => $body
                ]);
            }

            // 4. Polling hasta que se conecte o entregue QR
            ignore_user_abort(false);
            $lastQr = null;
            while (true) {
                $this->write(['status' => 'ping']);
                if (connection_aborted() || connection_status() !== CONNECTION_NORMAL) {
                    break; // 🛑 cortamos el SSE porque el front se desconectó
                }

                $qrRes = new Fetch(env('EVOAPI_URL') . '/instance/connect/' . $instanceName, [
                    'headers' => ['apikey' => env('EVOAPI_APIKEY')]
                ]);
                $qrData = $qrRes->json();

                if (!$qrRes->ok) {
                    $this->write(['status'  => 'error', 'message' => $qrData['response']['message'] ?? 'Error al verificar QR']);
                    continue;
                }

                $state = $qrData['instance']['state'] ?? 'closed';

                // ✅ Ya autenticado
                if ($state === 'open') {
                    $this->write(['status' => 'authenticated']);

                    $sessionRes = new Fetch(env('EVOAPI_URL') . '/instance/fetchInstances?instanceName=' . $instanceName, [
                        'headers' => ['apikey' => env('EVOAPI_APIKEY')]
                    ]);
                    $session = $sessionRes->json()[0] ?? [];

                    $this->write(['status' => 'ready', 'info'   => $this->getProfile($session)]);
                    break;
                }

                // 📸 Nuevo QR disponible
                if (($qrData['code'] ?? null) !== $lastQr) {
                    $lastQr = $qrData['code'];
                    $this->write(['status' => 'qr', 'qr' => $lastQr]);
                }

                sleep(2);
            }
        });
        return $response;
    }

    public function close(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $instanceName = env('EVOAPI_INSTANCE') . $request->session;

            $res = new Fetch(env('EVOAPI_URL') . '/instance/logout/' . $instanceName, [
                'method' => 'DELETE',
                'headers' => ['apikey' => env('EVOAPI_APIKEY')]
            ]);

            if (!$res->ok) {
                $data = $res->json();
                throw new Exception($data['response']['message'] ?? 'Error closing WhatsApp session');
            }
        });

        return response($response->toArray(), $response->status);
    }
}
