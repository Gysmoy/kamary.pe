<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetSessionDomainFromHost
{
    /**
     * Ajusta el dominio de la cookie de sesión según el host de la petición.
     *
     * SESSION_DOMAIN en producción apunta a kamary.xplain.pe, pero el sitio también
     * se sirve en kamaryfarma.com y www.kamaryfarma.com. El navegador rechaza una
     * cookie cuyo domain no coincide con el host, y eso rompe CSRF y el login.
     * Por eso el dominio se ajusta por petición, antes de StartSession y VerifyCsrfToken.
     */
    public function handle(Request $request, Closure $next)
    {
        $configured = config('session.domain');

        // Sin dominio configurado no se toca nada.
        if (empty($configured)) {
            return $next($request);
        }

        $configured = strtolower(ltrim((string) $configured, '.'));
        $host = strtolower($request->getHost());

        // El host coincide con el dominio configurado: se deja igual que hoy.
        if ($host === $configured || str_ends_with($host, '.'.$configured)) {
            return $next($request);
        }

        if ($host === 'kamaryfarma.com' || str_ends_with($host, '.kamaryfarma.com')) {
            // Cubre kamaryfarma.com y www.kamaryfarma.com con una sola cookie.
            config(['session.domain' => 'kamaryfarma.com']);
        } else {
            // Otro host (ej. 127.0.0.1 en local): cookie solo para ese host.
            config(['session.domain' => null]);
        }

        return $next($request);
    }
}
