<?php

namespace App\Http\Middleware;

use App\Models\Breakdown;
use Closure;
use Illuminate\Http\Request;
use SoDe\Extend\Crypto;
use Symfony\Component\HttpFoundation\Response;

class BreakDownMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If user is authenticated and has admin role, skip breakdown creation
        if (auth()->check() && auth()->user()->hasRole('Admin')) {
            return $next($request);
        }

        $breakdownId = $request->cookie('breakdown_id');
        if (!$breakdownId) {
            $breakdownJpa = Breakdown::create();
            $response = $next($request);
            return $response->withCookie(cookie('breakdown_id', $breakdownJpa->id));
        }

        // Verify if breakdown exists in database
        $existingBreakdown = Breakdown::find($breakdownId);
        if (!$existingBreakdown) {
            $breakdownJpa = Breakdown::create();
            $response = $next($request);
            return $response->withCookie(cookie('breakdown_id', $breakdownJpa->id));
        }

        return $next($request);
    }
}
