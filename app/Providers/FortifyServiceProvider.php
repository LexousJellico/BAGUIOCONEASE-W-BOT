<?php

namespace App\Providers;

use App\Http\Responses\TwoFactorLoginResponse;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TwoFactorLoginResponseContract::class, TwoFactorLoginResponse::class);
    }

    public function boot(): void
    {
        Fortify::loginView(fn () => Inertia::render('auth/login'));
        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));
        Fortify::registerView(fn () => Inertia::render('auth/register'));
        Fortify::requestPasswordResetLinkView(fn () => Inertia::render('auth/forgot-password'));
        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => (string) $request->email,
            'token' => (string) $request->route('token'),
        ]));
        Fortify::verifyEmailView(fn () => Inertia::render('auth/verify-email'));
        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));

        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->input('email', '');

            return Limit::perMinute(5)->by($email.$request->ip());
        });

        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by((string) $request->session()->get('login.id'));
        });
    }
}
