<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\RegistrationVerificationMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class RegistrationVerificationController extends Controller
{
    /**
     * Send a verification code to the given email address.
     */
    public function sendVerificationCode(Request $request)
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
        ]);

        $email = $request->email;
        $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store the code and initialize attempts to 0, expires in 15 minutes
        Cache::put("register_code_{$email}", $code, now()->addMinutes(15));
        Cache::put("register_attempts_{$email}", 0, now()->addMinutes(15));

        // Send email
        Mail::to($email)->send(new RegistrationVerificationMail($code));

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent.'
        ]);
    }
}