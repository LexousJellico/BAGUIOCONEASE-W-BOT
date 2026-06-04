<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        if (! $this->googleIsConfigured()) {
            return redirect()
                ->route('login')
                ->with('error', 'Google sign-in is not configured yet. Please use your email and password for now.');
        }

        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function callback(): RedirectResponse
    {
        if (! $this->googleIsConfigured()) {
            return redirect()
                ->route('login')
                ->with('error', 'Google sign-in is not configured yet. Please use your email and password for now.');
        }

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (Throwable $e) {
            report($e);

            return redirect()
                ->route('login')
                ->with('error', 'Google sign-in could not be completed. Please try again.');
        }

        $email = Str::lower(trim((string) $googleUser->getEmail()));

        if ($email === '') {
            return redirect()
                ->route('login')
                ->with('error', 'Google sign-in requires an email address.');
        }

        $user = DB::transaction(function () use ($googleUser, $email) {
            $googleId = (string) $googleUser->getId();
            $avatar = $googleUser->getAvatar();

            $existingByGoogle = User::query()
                ->where('google_id', $googleId)
                ->first();

            if ($existingByGoogle) {
                $existingByGoogle->forceFill([
                    'email' => $email,
                    'google_avatar' => $avatar,
                    'last_login_at' => now(),
                    'email_verified_at' => $existingByGoogle->email_verified_at ?? now(),
                ])->save();

                return $existingByGoogle;
            }

            $existingByEmail = User::query()
                ->where('email', $email)
                ->first();

            if ($existingByEmail) {
                $existingByEmail->forceFill([
                    'google_id' => $googleId,
                    'google_avatar' => $avatar,
                    'last_login_at' => now(),
                    'email_verified_at' => $existingByEmail->email_verified_at ?? now(),
                ])->save();

                return $existingByEmail;
            }

            [$firstName, $middleName, $lastName, $displayName] = $this->splitName(
                trim((string) $googleUser->getName())
            );

            $user = User::create([
                'name' => $displayName,
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'last_name' => $lastName,
                'email' => $email,
                'password' => Hash::make(Str::random(40)),
                'google_id' => $googleId,
                'google_avatar' => $avatar,
                'country' => 'Philippines',
                'last_login_at' => now(),
                'email_verified_at' => now(),
            ]);

            $user->assignRole('user');

            return $user;
        });

        Auth::login($user, true);
        request()->session()->regenerate();

        return redirect()
            ->intended($this->resolvePostLoginTarget($user))
            ->with('success', 'Signed in with Google successfully.');
    }

    protected function resolvePostLoginTarget(User $user): string
    {
        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'manager'])) {
            return '/admin/home';
        }

        return route('dashboard', absolute: false);
    }

    protected function googleIsConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }

    /**
     * @return array{0:string,1:?string,2:string,3:string}
     */
    protected function splitName(string $fullName): array
    {
        $clean = trim(preg_replace('/\s+/u', ' ', $fullName) ?? $fullName);

        if ($clean === '') {
            return ['Google', null, 'User', 'Google User'];
        }

        $parts = array_values(array_filter(explode(' ', $clean), fn ($part) => $part !== ''));

        if (count($parts) === 1) {
            return [$parts[0], null, 'User', trim($parts[0] . ' User')];
        }

        $firstName = array_shift($parts) ?: 'Google';
        $lastName = array_pop($parts) ?: 'User';
        $middleName = count($parts) > 0 ? implode(' ', $parts) : null;

        $displayName = trim(implode(' ', array_filter([$firstName, $middleName, $lastName])));

        return [$firstName, $middleName, $lastName, $displayName];
    }
}
