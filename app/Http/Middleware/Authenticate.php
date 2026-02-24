<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    protected function redirectTo(Request $request): ?string
    {
        if ($request->expectsJson()) {
            return null;
        }
        $intended = $request->path() === 'checkout' ? '/checkout' : null;

        return route('login', $intended ? ['redirectTo' => $intended] : []);
    }
}
