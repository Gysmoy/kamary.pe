<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Services\Integrations\EcomsurOmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EcomsurController extends Controller
{
    public function logisticOrders(Request $request, EcomsurOmsService $service): JsonResponse
    {
        $this->assertToken($request, 'integrations.ecomsur.inbound_token');

        try {
            $result = $service->receiveLogisticOrders($request->all());
            return response()->json($result, $result['success'] ? 200 : 422);
        } catch (\Throwable $th) {
            return response()->json([
                'success' => false,
                'message' => $th->getMessage(),
            ], 422);
        }
    }

    public function stock(Request $request, EcomsurOmsService $service): JsonResponse
    {
        $this->assertToken($request, 'integrations.ecomsur.inbound_token');

        try {
            return response()->json([
                'success' => true,
                'data' => $service->stock($request->all()),
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                'success' => false,
                'message' => $th->getMessage(),
            ], 422);
        }
    }

    private function assertToken(Request $request, string $configKey): void
    {
        $expected = trim((string) config($configKey));
        if ($expected === '') {
            abort(503, 'Token de integracion no configurado');
        }

        $provided = trim((string) $request->bearerToken());
        if ($provided === '') {
            $provided = trim((string) $request->header('X-Kamary-Integration-Token'));
        }

        if ($provided === '' || !hash_equals($expected, $provided)) {
            abort(401, 'Token de integracion invalido');
        }
    }
}
