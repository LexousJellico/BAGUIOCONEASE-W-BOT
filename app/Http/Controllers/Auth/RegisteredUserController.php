<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function create(): Response
    {
        return Inertia::render('auth/register', [
            'redirectTo' => $this->safeRedirectTarget(request()->query('redirect_to')),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'verification_code' => ['required', 'string', 'size:6'],
        ]);

        $email = $request->email;
        $code = \Illuminate\Support\Facades\Cache::get("register_code_{$email}");
        $attempts = \Illuminate\Support\Facades\Cache::get("register_attempts_{$email}", 0);

        if (!$code) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'verification_code' => 'The verification code has expired or was not requested.',
            ]);
        }

        if ($attempts >= 3) {
            \Illuminate\Support\Facades\Cache::forget("register_code_{$email}");
            \Illuminate\Support\Facades\Cache::forget("register_attempts_{$email}");
            throw \Illuminate\Validation\ValidationException::withMessages([
                'verification_code' => 'Too many failed attempts. Please request a new code.',
            ]);
        }

        if ($code !== $request->verification_code) {
            \Illuminate\Support\Facades\Cache::increment("register_attempts_{$email}");
            throw \Illuminate\Validation\ValidationException::withMessages([
                'verification_code' => 'The verification code is incorrect.',
            ]);
        }

        // Code is correct, clear from cache
        \Illuminate\Support\Facades\Cache::forget("register_code_{$email}");
        \Illuminate\Support\Facades\Cache::forget("register_attempts_{$email}");

        $user = User::create([
            'name' => (string) $request->name,
            'email' => strtolower(trim((string) $request->email)),
            'password' => Hash::make((string) $request->password),
        ]);

        $user->assignRole('user');

        event(new Registered($user));

        $this->notifications->userSelfRegistered($user);

        Auth::login($user);

        $redirectTo = $this->safeRedirectTarget($request->input('redirect_to'));

        if ($redirectTo) {
            $request->session()->put('url.intended', $redirectTo);
        }

        return redirect()->intended(route('verification.notice', absolute: false));
    }

    private function safeRedirectTarget(mixed $target): ?string
    {
        $value = trim((string) $target);

        if ($value === '' || ! str_starts_with($value, '/') || str_starts_with($value, '//')) {
            return null;
        }

        return $value;
    }
}