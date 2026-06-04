<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        $user = $request->user();
        $wasUnverified = ! $user->hasVerifiedEmail();

        if ($wasUnverified) {
            $request->fulfill();
            $this->notifications->userEmailVerified($user->refresh());
        }

        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'manager'])) {
            return redirect()->route('admin.home', ['verified' => 1]);
        }

        return redirect()->intended(route('dashboard', ['verified' => 1], absolute: false));
    }
}
