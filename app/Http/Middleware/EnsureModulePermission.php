<?php

namespace App\Http\Middleware;

use App\Support\ModulePermissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModulePermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $permissions = array_values(array_filter(array_map('trim', $permissions)));
        $user = $request->user();

        if (ModulePermissions::isSuperUser($user)) {
            return $next($request);
        }

        foreach ($permissions as $permission) {
            if (ModulePermissions::userCan($user, $permission)) {
                return $next($request);
            }
        }

        if ($request->expectsJson() || str_starts_with('/' . trim($request->path(), '/'), '/api/')) {
            return response()->json([
                'status' => 403,
                'message' => 'No tienes permiso para acceder a este modulo.',
            ], 403);
        }

        abort(403, 'No tienes permiso para acceder a este modulo.');
    }
}
