<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\UserLoginDevice;
use App\Services\LoginDeviceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginDeviceController extends Controller
{
    public function __construct(private readonly LoginDeviceService $devices)
    {
    }

    public function destroy(Request $request, UserLoginDevice $device): RedirectResponse
    {
        $user = $request->user();

        if (! $user || (int) $device->user_id !== (int) $user->id) {
            abort(403);
        }

        $isCurrentDevice = $this->devices->revoke($request, $device);

        if ($isCurrentDevice) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->with('status', 'current-device-removed');
        }

        return back()->with('status', 'device-removed');
    }
}
