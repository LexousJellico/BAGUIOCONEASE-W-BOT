<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class WorkspaceAccess
{
    public static function role(Request $request): string
    {
        $routeName = (string) optional($request->route())->getName();

        if (str_starts_with($routeName, 'admin.')) {
            return 'admin';
        }

        if (str_starts_with($routeName, 'manager.')) {
            return 'manager';
        }

        if (str_starts_with($routeName, 'staff.')) {
            return 'staff';
        }

        if (str_starts_with($routeName, 'user.')) {
            return 'user';
        }

        $path = '/' . ltrim($request->path(), '/');

        if (str_starts_with($path, '/admin/')) {
            return 'admin';
        }

        if (str_starts_with($path, '/manager/')) {
            return 'manager';
        }

        if (str_starts_with($path, '/staff/')) {
            return 'staff';
        }

        $user = $request->user();

        if ($user && method_exists($user, 'hasRole')) {
            if ($user->hasRole('admin')) {
                return 'admin';
            }

            if ($user->hasRole('manager')) {
                return 'manager';
            }

            if ($user->hasRole('staff')) {
                return 'staff';
            }
        }

        $directRole = strtolower(str_replace(['_', '-'], ' ', trim((string) ($user?->role_name ?? $user?->role ?? ''))));

        if (in_array($directRole, ['admin', 'administrator'], true)) {
            return 'admin';
        }

        if (in_array($directRole, ['manager', 'management'], true)) {
            return 'manager';
        }

        if (in_array($directRole, ['staff', 'employee', 'operator'], true)) {
            return 'staff';
        }

        return 'user';
    }

    public static function isAdmin(Request $request): bool
    {
        return self::role($request) === 'admin';
    }

    public static function isManager(Request $request): bool
    {
        return self::role($request) === 'manager';
    }

    public static function isStaff(Request $request): bool
    {
        return self::role($request) === 'staff';
    }

    public static function isClient(Request $request): bool
    {
        return self::role($request) === 'user';
    }

    public static function isStaffLike(Request $request): bool
    {
        return in_array(self::role($request), ['admin', 'manager', 'staff'], true);
    }

    public static function canManageBookings(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (self::isStaffLike($request)) {
            return true;
        }

        return method_exists($user, 'can') && $user->can('bookings.view');
    }

    public static function canCreateBooking(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (self::isStaffLike($request)) {
            return true;
        }

        return true;
    }

    public static function canUpdateBooking(Request $request, Booking $booking): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (self::isStaffLike($request)) {
            return method_exists($user, 'can') ? $user->can('bookings.update') || self::isStaffLike($request) : true;
        }

        return self::ownsBooking($user, $booking);
    }

    public static function canDeleteBooking(Request $request, Booking $booking): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (! self::isStaffLike($request)) {
            return false;
        }

        return method_exists($user, 'can') ? $user->can('bookings.delete') : self::isAdmin($request);
    }

    public static function canManagePayments(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (! self::isStaffLike($request)) {
            return false;
        }

        return method_exists($user, 'can') ? $user->can('payments.manage') : self::isAdmin($request) || self::isManager($request);
    }

    public static function canViewBooking(Request $request, Booking $booking): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (self::isStaffLike($request)) {
            return true;
        }

        return self::ownsBooking($user, $booking);
    }

    public static function ownsBooking(User $user, Booking $booking): bool
    {
        $userId = (int) ($user->id ?? 0);
        $creatorId = (int) ($booking->created_by_user_id ?? 0);

        if ($userId > 0 && $creatorId > 0 && $userId === $creatorId) {
            return true;
        }

        $bookingEmail = strtolower(trim((string) ($booking->client_email ?? '')));
        $userEmail = strtolower(trim((string) ($user->email ?? '')));

        return $bookingEmail !== '' && $userEmail !== '' && $bookingEmail === $userEmail;
    }

    public static function applyBookingVisibility(Request $request, Builder $query): Builder
    {
        if (self::isStaffLike($request)) {
            return $query;
        }

        $user = $request->user();

        if (! $user) {
            return $query->whereRaw('1 = 0');
        }

        $email = strtolower(trim((string) ($user->email ?? '')));
        $userId = (int) ($user->id ?? 0);
        $hasCreatorColumn = Schema::hasColumn('bookings', 'created_by_user_id');

        return $query->where(function (Builder $scoped) use ($email, $userId, $hasCreatorColumn) {
            if ($email !== '') {
                $scoped->where('bookings.client_email', $email);
            } else {
                $scoped->whereRaw('1 = 0');
            }

            if ($hasCreatorColumn && $userId > 0) {
                $scoped->orWhere('bookings.created_by_user_id', $userId);
            }
        });
    }

    public static function clientSafeFilters(array $filters): array
    {
        return array_intersect_key($filters, array_flip([
            'booking_status',
            'payment_status',
            'q',
            'date_from',
            'date_to',
            'sort',
        ]));
    }

    public static function staffFilters(array $filters): array
    {
        return array_intersect_key($filters, array_flip([
            'booking_status',
            'payment_status',
            'service_id',
            'q',
            'date_from',
            'date_to',
            'sort',
        ]));
    }
}
