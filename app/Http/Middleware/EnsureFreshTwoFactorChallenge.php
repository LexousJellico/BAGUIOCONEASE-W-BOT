<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Features;
use Symfony\Component\HttpFoundation\Response;

class EnsureFreshTwoFactorChallenge
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! Features::enabled(Features::twoFactorAuthentication())) {
            return $next($request);
        }

        if (! method_exists($user, 'hasEnabledTwoFactorAuthentication') || ! $user->hasEnabledTwoFactorAuthentication()) {
            return $next($request);
        }

        if ($this->isAllowedWithoutChallenge($request)) {
            return $next($request);
        }

        $confirmedForUser = (int) $request->session()->get('auth.two_factor_user_id') === (int) $user->getKey()
            && $request->session()->has('auth.two_factor_confirmed_at');

        if ($confirmedForUser) {
            return $next($request);
        }

        $intended = $request->fullUrl();
        if ($request->expectsJson()) {
            abort(423, 'Two-factor authentication challenge required.');
        }

        $remember = false;
        try {
            $remember = $request->cookies->has(Auth::guard('web')->getRecallerName());
        } catch (\Throwable) {
            $remember = false;
        }

        Auth::guard('web')->logout();

        $request->session()->put([
            'login.id' => $user->getKey(),
            'login.remember' => $remember,
            'url.intended' => $intended,
        ]);
        $request->session()->forget(['auth.two_factor_user_id', 'auth.two_factor_confirmed_at']);

        return redirect()->route('two-factor.login');
    }

    private function isAllowedWithoutChallenge(Request $request): bool
    {
        if ($request->routeIs('two-factor.*') || $request->routeIs('logout')) {
            return true;
        }

        if ($request->is('two-factor-challenge')
            || $request->is('user/two-factor-*')
            || $request->is('user/confirmed-two-factor-authentication')
        ) {
            return true;
        }

        return $request->is('login')
            || $request->is('register*')
            || $request->is('forgot-password')
            || $request->is('reset-password*')
            || $request->is('email/verification-notification')
            || $request->is('verify-email*');
    }
}
