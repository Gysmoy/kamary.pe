<?php

namespace App\Http\Middleware;

use App\Models\StorageApiToken;
use App\Support\StorageScope;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateStorageApiToken
{
    public function handle(Request $request, Closure $next, ?string $ability = null): Response
    {
        $plainToken = trim((string) $request->bearerToken());
        if ($plainToken === '') {
            $plainToken = trim((string) $request->header('X-Storage-Token', ''));
        }

        if ($plainToken === '') {
            return $this->unauthorized('Token de almacenamiento requerido.');
        }

        $token = StorageApiToken::with('client')
            ->where('token_hash', StorageApiToken::hashToken($plainToken))
            ->first();

        if (!$token || !$token->isUsable()) {
            return $this->unauthorized('Token de almacenamiento invalido o expirado.');
        }

        if (!$token->allows($ability)) {
            return response()->json([
                'success' => false,
                'message' => 'El token no tiene permiso para esta accion.',
            ], 403);
        }

        try {
            $client = StorageScope::assertClient((int) $token->client_id);
        } catch (\Throwable) {
            return response()->json([
                'success' => false,
                'message' => 'El cliente del token no esta habilitado para almacenamiento.',
            ], 403);
        }

        $token->forceFill(['last_used_at' => now()])->saveQuietly();

        $request->attributes->set('storage_api_token', $token);
        $request->attributes->set('storage_api_client', $client);

        return $next($request);
    }

    private function unauthorized(string $message)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 401);
    }
}
