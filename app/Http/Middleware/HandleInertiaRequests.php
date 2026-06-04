<?php

namespace App\Http\Middleware;

use App\Models\Booking;
use App\Models\PublicInquiry;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),

            'auth' => [
                'user' => $request->user()
                    ? [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'display_name' => $request->user()->display_name ?? $request->user()->name,
                        'first_name' => $request->user()->first_name,
                        'middle_name' => $request->user()->middle_name,
                        'last_name' => $request->user()->last_name,
                        'email' => $request->user()->email,
                        'phone_number' => $request->user()->phone_number,
                        'organization_name' => $request->user()->organization_name,
                        'organization_type' => $request->user()->organization_type,
                        'position_title' => $request->user()->position_title,
                        'address_line1' => $request->user()->address_line1,
                        'barangay' => $request->user()->barangay,
                        'city_municipality' => $request->user()->city_municipality,
                        'province' => $request->user()->province,
                        'postal_code' => $request->user()->postal_code,
                        'country' => $request->user()->country,
                        'google_avatar' => $request->user()->google_avatar,
                        'email_verified_at' => optional($request->user()->email_verified_at)->toIso8601String(),
                        'last_login_at' => optional($request->user()->last_login_at)->toIso8601String(),
                        'two_factor_enabled' => method_exists($request->user(), 'hasEnabledTwoFactorAuthentication')
                            ? $request->user()->hasEnabledTwoFactorAuthentication()
                            : false,
                        'role' => $this->userRole($request),
                        'role_name' => $this->userRole($request),
                        'roles' => $this->userRoles($request),
                        'permissions' => $this->userPermissions($request),
                    ]
                    : null,

                'roles' => $this->userRoles($request),
                'permissions' => $this->userPermissions($request),
            ],

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
                'message' => fn () => $request->session()->get('message'),
            ],

            'notificationSummary' => fn () => $this->notificationSummary($request),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function userRoles(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return [];
        }

        if (method_exists($user, 'getRoleNames')) {
            return $user->getRoleNames()->values()->all();
        }

        if (isset($user->role) && filled($user->role)) {
            return [(string) $user->role];
        }

        if (isset($user->role_name) && filled($user->role_name)) {
            return [(string) $user->role_name];
        }

        return [];
    }

    private function userRole(Request $request): ?string
    {
        $roles = $this->userRoles($request);

        if (count($roles) > 0) {
            return $roles[0];
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    private function userPermissions(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return [];
        }

        if (method_exists($user, 'getAllPermissions')) {
            return $user
                ->getAllPermissions()
                ->pluck('name')
                ->values()
                ->all();
        }

        if (property_exists($user, 'permissions') && is_array($user->permissions)) {
            return $user->permissions;
        }

        return [];
    }

    /**
     * @return array<string, int>
     */
    private function notificationSummary(Request $request): array
    {
        if (! $request->user()) {
            return [
                'totalUnread' => 0,
                'newInquiries' => 0,
                'pendingBookings' => 0,
                'pendingPayments' => 0,
                'newUsers' => 0,
            ];
        }

        $newInquiries = $this->newInquiryCount();
        $pendingBookings = $this->pendingBookingCount();
        $pendingPayments = $this->pendingPaymentCount();
        $newUsers = $this->newUserNotificationCount($request);

        return [
            'totalUnread' => $newInquiries + $pendingBookings + $pendingPayments + $newUsers,
            'newInquiries' => $newInquiries,
            'pendingBookings' => $pendingBookings,
            'pendingPayments' => $pendingPayments,
            'newUsers' => $newUsers,
        ];
    }

    private function newInquiryCount(): int
    {
        if (! class_exists(PublicInquiry::class) || ! Schema::hasTable('public_inquiries')) {
            return 0;
        }

        return PublicInquiry::query()
            ->when(
                Schema::hasColumn('public_inquiries', 'status'),
                fn ($query) => $query->where(function ($builder): void {
                    $builder
                        ->whereNull('status')
                        ->orWhere('status', '')
                        ->orWhere('status', 'new');
                }),
                fn ($query) => $query
            )
            ->count();
    }

    private function pendingBookingCount(): int
    {
        if (! class_exists(Booking::class) || ! Schema::hasTable('bookings')) {
            return 0;
        }

        if (! Schema::hasColumn('bookings', 'booking_status')) {
            return 0;
        }

        return Booking::query()
            ->whereIn('booking_status', [
                'pending',
                'pencil_booked',
                'pencil-booked',
                'for_review',
                'for review',
                'submitted',
            ])
            ->count();
    }


    private function newUserNotificationCount(Request $request): int
    {
        $user = $request->user();

        if (! $user || ! class_exists(UserNotification::class) || ! Schema::hasTable('user_notifications')) {
            return 0;
        }

        return UserNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->where(function ($query): void {
                $query->where('type', 'user_registered')
                    ->orWhere('type', 'user_self_registered')
                    ->orWhere('type', 'like', '%registered%')
                    ->orWhere('title', 'like', '%account created%')
                    ->orWhere('title', 'like', '%new client account%');
            })
            ->count();
    }

    private function pendingPaymentCount(): int
    {
        if (! class_exists(Booking::class) || ! Schema::hasTable('bookings')) {
            return 0;
        }

        if (! Schema::hasColumn('bookings', 'payment_status')) {
            return 0;
        }

        return Booking::query()
            ->whereIn('payment_status', [
                'pending',
                'submitted',
                'for_review',
                'for review',
                'awaiting_review',
                'awaiting review',
            ])
            ->count();
    }
}
