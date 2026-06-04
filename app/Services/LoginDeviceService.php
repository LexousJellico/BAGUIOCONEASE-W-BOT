<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserLoginDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class LoginDeviceService
{
    public function recordSuccessfulLogin(Request $request, User $user, bool $trusted = false): ?UserLoginDevice
    {
        if (! Schema::hasTable('user_login_devices')) {
            return null;
        }

        $fingerprint = $this->fingerprint($request, $user);
        $profile = $this->deviceProfile($request);
        $location = $this->locationProfile($request);
        $now = now();

        return DB::transaction(function () use ($request, $user, $trusted, $fingerprint, $profile, $location, $now): UserLoginDevice {
            UserLoginDevice::query()
                ->where('user_id', $user->id)
                ->update(['is_current' => false]);

            /** @var UserLoginDevice $device */
            $device = UserLoginDevice::query()->firstOrNew([
                'user_id' => $user->id,
                'device_fingerprint' => $fingerprint,
            ]);

            $isNewOrRevoked = ! $device->exists || $device->revoked_at !== null;

            $device->fill([
                'session_id' => $request->session()->getId(),
                'device_name' => $profile['device_name'],
                'browser' => $profile['browser'],
                'platform' => $profile['platform'],
                'ip_address' => $request->ip(),
                'country' => $location['country'],
                'region' => $location['region'],
                'city' => $location['city'],
                'location_label' => $location['label'],
                'user_agent' => (string) $request->userAgent(),
                'is_current' => true,
                'is_trusted' => $trusted || (bool) $device->is_trusted,
                'first_seen_at' => $device->first_seen_at ?: $now,
                'last_seen_at' => $now,
                'revoked_at' => null,
            ]);

            $device->save();

            if ($isNewOrRevoked || ! $device->last_notified_at || $device->last_notified_at->lt($now->copy()->subDay())) {
                $this->notifyNewLogin($user, $device);
                $device->forceFill(['last_notified_at' => $now])->saveQuietly();
            }

            return $device;
        });
    }

    public function touchCurrentDevice(Request $request): void
    {
        $user = $request->user();

        if (! $user instanceof User || ! Schema::hasTable('user_login_devices')) {
            return;
        }

        $fingerprint = $this->fingerprint($request, $user);

        UserLoginDevice::query()
            ->where('user_id', $user->id)
            ->where('device_fingerprint', $fingerprint)
            ->whereNull('revoked_at')
            ->update([
                'session_id' => $request->session()->getId(),
                'is_current' => true,
                'last_seen_at' => now(),
                'ip_address' => $request->ip(),
            ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function devicesFor(User $user, ?string $currentSessionId = null): array
    {
        if (! Schema::hasTable('user_login_devices')) {
            return [];
        }

        return UserLoginDevice::query()
            ->where('user_id', $user->id)
            ->latest('last_seen_at')
            ->limit(20)
            ->get()
            ->map(fn (UserLoginDevice $device): array => [
                'id' => $device->id,
                'device_name' => $device->device_name ?: 'Unknown device',
                'browser' => $device->browser ?: 'Unknown browser',
                'platform' => $device->platform ?: 'Unknown platform',
                'ip_address' => $device->ip_address,
                'location_label' => $device->location_label ?: 'Location unavailable',
                'is_current' => $currentSessionId !== null && hash_equals((string) $currentSessionId, (string) $device->session_id),
                'is_trusted' => (bool) $device->is_trusted,
                'is_active' => $device->revoked_at === null,
                'first_seen_at' => optional($device->first_seen_at)->toIso8601String(),
                'last_seen_at' => optional($device->last_seen_at)->toIso8601String(),
                'revoked_at' => optional($device->revoked_at)->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    public function revoke(Request $request, UserLoginDevice $device): bool
    {
        $current = hash_equals((string) $request->session()->getId(), (string) $device->session_id);

        $device->forceFill([
            'is_current' => false,
            'is_trusted' => false,
            'revoked_at' => now(),
        ])->save();

        $sessionTable = (string) (config('session.table') ?: 'sessions');

        if ($device->session_id && $sessionTable !== '' && Schema::hasTable($sessionTable)) {
            DB::table($sessionTable)
                ->where('id', $device->session_id)
                ->delete();
        }

        return $current;
    }

    private function fingerprint(Request $request, User $user): string
    {
        $basis = implode('|', [
            $user->id,
            Str::limit((string) $request->userAgent(), 500, ''),
            (string) $request->ip(),
        ]);

        return hash('sha256', $basis);
    }

    /** @return array{device_name: string, browser: string, platform: string} */
    private function deviceProfile(Request $request): array
    {
        $agent = (string) $request->userAgent();
        $lower = strtolower($agent);

        $browser = match (true) {
            str_contains($lower, 'edg/') || str_contains($lower, 'edge/') => 'Microsoft Edge',
            str_contains($lower, 'opr/') || str_contains($lower, 'opera') => 'Opera',
            str_contains($lower, 'firefox') => 'Mozilla Firefox',
            str_contains($lower, 'chrome') || str_contains($lower, 'crios') => 'Google Chrome',
            str_contains($lower, 'safari') => 'Safari',
            default => 'Browser',
        };

        $platform = match (true) {
            str_contains($lower, 'windows') => 'Windows',
            str_contains($lower, 'iphone') || str_contains($lower, 'ipad') => 'iOS',
            str_contains($lower, 'android') => 'Android',
            str_contains($lower, 'mac os') || str_contains($lower, 'macintosh') => 'macOS',
            str_contains($lower, 'linux') => 'Linux',
            default => 'Device',
        };

        return [
            'device_name' => trim($browser.' on '.$platform),
            'browser' => $browser,
            'platform' => $platform,
        ];
    }

    /** @return array{country: ?string, region: ?string, city: ?string, label: string} */
    private function locationProfile(Request $request): array
    {
        $country = $request->header('CF-IPCountry') ?: $request->header('X-AppEngine-Country');
        $region = $request->header('X-AppEngine-Region');
        $city = $request->header('X-AppEngine-City');

        $parts = collect([$city, $region, $country])
            ->filter(fn ($part) => is_string($part) && trim($part) !== '' && trim($part) !== 'ZZ')
            ->map(fn ($part) => trim((string) $part))
            ->unique()
            ->values();

        return [
            'country' => $country ? (string) $country : null,
            'region' => $region ? (string) $region : null,
            'city' => $city ? (string) $city : null,
            'label' => $parts->isNotEmpty() ? $parts->implode(', ') : 'Approximate location unavailable',
        ];
    }

    private function notifyNewLogin(User $user, UserLoginDevice $device): void
    {
        if (! Schema::hasTable('user_notifications')) {
            return;
        }

        $user->notifications()->create([
            'type' => 'account_login_device',
            'title' => 'New login detected on your account',
            'message' => sprintf(
                'A login was recorded from %s near %s using IP %s. If this was not you, remove the device from Account Preferences > Two-Factor Auth immediately.',
                $device->device_name ?: 'a device',
                $device->location_label ?: 'an unavailable location',
                $device->ip_address ?: 'unknown'
            ),
            'link' => route('two-factor.show'),
            'severity' => 'warning',
            'audience' => 'client',
            'privacy_scope' => 'private',
            'action_key' => 'account.login_device',
            'data' => [
                'device_id' => $device->id,
                'device_name' => $device->device_name,
                'location' => $device->location_label,
                'ip_address' => $device->ip_address,
            ],
        ]);
    }
}
