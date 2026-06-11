<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PasswordResetLinkController extends Controller
{
    public function create(Request $request): Response
    {
        $broker = (string) config('auth.defaults.passwords', 'users');

        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
            'email' => $request->old('email', ''),
            'resetRequestCooldown' => $request->session()->get('password_reset_requested_at'),
            'resetRequestCooldownSeconds' => (int) config("auth.passwords.{$broker}.throttle", 60),
            'resetLinkExpiresInMinutes' => (int) config("auth.passwords.{$broker}.expire", 60),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'email' => mb_strtolower(trim((string) $request->input('email'))),
        ]);

        $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            Password::sendResetLink($request->only('email'));
        } catch (Throwable $exception) {
            $this->clearFailedResetToken((string) $request->input('email'));

            Log::error('Password reset link delivery failed.', [
                'exception' => $exception::class,
            ]);

            return back()->withErrors([
                'email' => __('We could not send a password reset email right now. Please verify your connection and try again shortly.'),
            ]);
        }

        return back()
            ->with('status', __('If the account exists, a password reset link has been sent. Check your inbox and spam folder.'))
            ->with('password_reset_requested_at', now()->toIso8601String());
    }

    private function clearFailedResetToken(string $email): void
    {
        $broker = (string) config('auth.defaults.passwords', 'users');
        $table = (string) config("auth.passwords.{$broker}.table", 'password_reset_tokens');

        if ($table !== '' && Schema::hasTable($table)) {
            DB::table($table)->where('email', $email)->delete();
        }
    }
}
