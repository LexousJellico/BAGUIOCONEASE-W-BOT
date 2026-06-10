<?php

namespace App\Http\Responses;

use App\Models\User;
use App\Services\AssistantChatSessionService;
use App\Services\LoginDeviceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;

class TwoFactorLoginResponse implements TwoFactorLoginResponseContract
{
    public function __construct(
        private readonly LoginDeviceService $devices,
        private readonly AssistantChatSessionService $chatSessions,
    ) {}

    public function toResponse($request): RedirectResponse
    {
        /** @var User|null $user */
        $user = Auth::user();

        if ($user instanceof User) {
            $request->session()->put([
                'auth.two_factor_user_id' => $user->getKey(),
                'auth.two_factor_confirmed_at' => now()->toIso8601String(),
            ]);

            if (Schema::hasColumn('users', 'last_login_at')) {
                $user->forceFill(['last_login_at' => now()])->saveQuietly();
            }

            $this->chatSessions->claimRememberedGuestConversation($request, $user);
            $this->devices->recordSuccessfulLogin($request, $user, (bool) $request->session()->pull('login.remember', false));
        }

        return redirect()->intended(route('role.home', absolute: false));
    }
}
