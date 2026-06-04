<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RoleRedirectController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (method_exists($user, 'hasRole')) {
            if ($user->hasRole('admin')) {
                return redirect()->route('admin.dashboard');
            }

            if ($user->hasRole('manager')) {
                return redirect()->route('manager.dashboard');
            }

            if ($user->hasRole('staff')) {
                return redirect()->route('staff.dashboard');
            }
        }

        return redirect()->route('user.dashboard');
    }
}
