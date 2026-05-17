<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Models\IntegrationLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MultivendeWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $this->assertToken($request);

        IntegrationLog::create([
            'provider' => 'multivende',
            'direction' => 'inbound',
            'event_type' => 'webhook',
            'external_id' => (string)($request->input('_id') ?: $request->input('id') ?: $request->input('resourceId') ?: ''),
            'status' => 'received',
            'request_payload' => $request->all(),
            'message' => 'Webhook recibido. Debe complementarse con polling segun documentacion Multivende.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Webhook recibido',
        ]);
    }

    private function assertToken(Request $request): void
    {
        $expected = trim((string) config('integrations.multivende.webhook_token'));
        if ($expected === '') {
            abort(503, 'MULTIVENDE_WEBHOOK_TOKEN no configurado');
        }

        $provided = trim((string) $request->bearerToken());
        if ($provided === '') {
            $provided = trim((string) $request->header('X-Kamary-Integration-Token'));
        }

        if ($provided === '' || !hash_equals($expected, $provided)) {
            abort(401, 'Token de webhook invalido');
        }
    }
}
