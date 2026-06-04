<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\LoginDeviceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class AuthenticatedSessionController extends Controller
{
    public function __construct(private readonly LoginDeviceService $devices)
    {
    }

    public function create(): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => request()->session()->get('status'),
            'redirectTo' => $this->safeRedirectTarget(request()->query('redirect_to')),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $user = $request->validateCredentials();

        if (
            Features::enabled(Features::twoFactorAuthentication()) &&
            method_exists($user, 'hasEnabledTwoFactorAuthentication') &&
            $user->hasEnabledTwoFactorAuthentication()
        ) {
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => $request->boolean('remember'),
            ]);

            return to_route('two-factor.login');
        }

        $redirectTo = $this->safeRedirectTarget($request->input('redirect_to'));

        if ($redirectTo) {
            $request->session()->put('url.intended', $redirectTo);
        }

        Auth::login($user, $request->boolean('remember'));

        if (Schema::hasColumn('users', 'last_login_at')) {
            $user->forceFill([
                'last_login_at' => now(),
            ])->saveQuietly();
        }

        $request->session()->regenerate();
        $request->session()->put([
            'auth.two_factor_user_id' => null,
            'auth.two_factor_confirmed_at' => null,
        ]);

        $this->devices->recordSuccessfulLogin($request, $user, $request->boolean('remember'));

        return redirect()->intended(route('role.home', absolute: false));
    }

    private function safeRedirectTarget(mixed $target): ?string
    {
        $value = trim((string) $target);

        if ($value === '' || ! str_starts_with($value, '/') || str_starts_with($value, '//')) {
            return null;
        }

        return $value;
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
