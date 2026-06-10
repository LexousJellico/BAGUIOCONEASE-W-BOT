<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use App\Services\LoginDeviceService;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class TwoFactorAuthenticationController extends Controller
{
    public function __construct(private readonly LoginDeviceService $devices) {}

    public function show(TwoFactorAuthenticationRequest $request): Response
    {
        $request->ensureStateIsValid();

        $user = $request->user();
        $twoFactorEnabled = method_exists($user, 'hasEnabledTwoFactorAuthentication')
            ? $user->hasEnabledTwoFactorAuthentication()
            : false;
        $loginDevices = $this->devices->devicesFor($user, $request->session()->getId());

        return Inertia::render('settings/two-factor', [
            'twoFactorEnabled' => $twoFactorEnabled,
            'requiresConfirmation' => Features::optionEnabled(
                Features::twoFactorAuthentication(),
                'confirm'
            ),
            'loginDevices' => $loginDevices,
            'securitySummary' => [
                'two_factor_policy' => 'Every fresh login session is challenged when 2FA is enabled. Remember me keeps the account remembered, but it does not silently bypass the 2FA login challenge.',
                'active_devices' => collect($loginDevices)->where('is_active', true)->count(),
                'current_device' => collect($loginDevices)->firstWhere('is_current'),
            ],
        ]);
    }
}
