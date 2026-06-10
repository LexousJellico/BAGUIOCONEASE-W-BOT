<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AssistantChatSessionService;
use App\Services\NotificationService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly AssistantChatSessionService $chatSessions,
    ) {}

    public function create(): Response
    {
        return Inertia::render('auth/register', [
            'redirectTo' => $this->safeRedirectTarget(request()->query('redirect_to')),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->chatSessions->rememberGuestConversation($request);

        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'verification_code' => ['required', 'string', 'size:6'],
        ]);

        $email = $request->email;
        $emailKey = hash('sha256', $email);
        $code = Cache::get("register_code_{$emailKey}");
        $attempts = Cache::get("register_attempts_{$emailKey}", 0);

        if (! is_string($code) || ! Hash::isHashed($code)) {
            throw ValidationException::withMessages([
                'verification_code' => 'The verification code has expired or was not requested.',
            ]);
        }

        if ($attempts >= 3) {
            Cache::forget("register_code_{$emailKey}");
            Cache::forget("register_attempts_{$emailKey}");
            throw ValidationException::withMessages([
                'verification_code' => 'Too many failed attempts. Please request a new code.',
            ]);
        }

        if (! Hash::check((string) $request->verification_code, $code)) {
            Cache::increment("register_attempts_{$emailKey}");
            throw ValidationException::withMessages([
                'verification_code' => 'The verification code is incorrect.',
            ]);
        }

        Cache::forget("register_code_{$emailKey}");
        Cache::forget("register_attempts_{$emailKey}");

        $user = User::create([
            'name' => (string) $request->name,
            'email' => strtolower(trim((string) $request->email)),
            'password' => Hash::make((string) $request->password),
        ]);

        $user->assignRole('user');

        event(new Registered($user));

        $this->notifications->userSelfRegistered($user);

        Auth::login($user);
        $request->session()->regenerate();
        $this->chatSessions->claimRememberedGuestConversation($request, $user);

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
