<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Http\Request;
use Laravel\Fortify\Features;
use Symfony\Component\HttpFoundation\Response;

class RequirePasswordConfirmationForTwoFactorSettings
{
    public function __construct(private readonly RequirePassword $requirePassword) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! Features::optionEnabled(Features::twoFactorAuthentication(), 'confirmPassword')) {
            return $next($request);
        }

        return $this->requirePassword->handle($request, $next);
    }
}
