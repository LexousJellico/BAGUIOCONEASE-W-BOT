<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user && method_exists($user, 'hasVerifiedEmail') && $user->hasVerifiedEmail()) {
            if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'manager'])) {
                return redirect()->route('admin.home');
            }

            return redirect()->route('dashboard');
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }
}
