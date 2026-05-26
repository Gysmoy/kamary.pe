<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInternalRouteToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = trim((string) config('services.internal_routes_token'));

        if ($expected === '') {
            if (app()->environment('production')) {
                return response()->json([
                    'status' => 503,
                    'message' => 'Token interno no configurado.',
                ], 503);
            }

            return $next($request);
        }

        $provided = trim((string) $request->bearerToken());
        if ($provided === '') {
            $provided = trim((string) $request->header('X-Kamary-Internal-Token'));
        }
        if ($provided === '') {
            $provided = trim((string) $request->query('token', ''));
        }

        if ($provided === '' || !hash_equals($expected, $provided)) {
            return response()->json([
                'status' => 401,
                'message' => 'Token interno invalido.',
            ], 401);
        }

        return $next($request);
    }
}
