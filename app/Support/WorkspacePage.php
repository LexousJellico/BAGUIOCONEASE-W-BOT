<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class WorkspacePage
{
    public static function resolve(Request $request, string $defaultPage): string
    {
        $role = self::role($request);

        $map = [
            'admin' => [
                'admin/home' => 'admin/content/index',
                'admin/dashboard' => 'admin/dashboard',
                'admin/inquiries/index' => 'admin/inquiries/index',
                'admin/guidelines-contacts' => 'admin/guidelines-contacts',

                'dashboard' => 'admin/calendar/index',

                'calendar/manage' => 'admin/calendar/manage',
                'calendar/analytics' => 'admin/calendar/analytics',
                'calendar/analytics-print' => 'admin/calendar/analytics-print',

                'bookings/index' => 'admin/bookings/index',
                'bookings/create' => 'admin/bookings/create',
                'bookings/show' => 'admin/bookings/show',
                'bookings/edit' => 'admin/bookings/edit',
                'bookings/survey' => 'admin/bookings/survey',
                'bookings/analytics' => 'admin/bookings/analytics',
                'bookings/analytics-print' => 'admin/bookings/analytics-print',
                'bookings/audit' => 'admin/bookings/audit',
                'bookings/audit-print' => 'admin/bookings/audit-print',
                'bookings/operations' => 'admin/bookings/operations',

                'payments/review' => 'admin/payments/review',

                'reports/mice-registry' => 'admin/reports/mice-registry/index',
                'reports/mice-registry-form' => 'admin/reports/mice-registry/form',
                'reports/mice-registry-print' => 'admin/reports/mice-registry/print',

                'services/index' => 'admin/rental-options/index',
                'service-types/index' => 'admin/venue-areas/index',

                'users/index' => 'admin/users/index',
                'users/create' => 'admin/users/create',
                'users/show' => 'admin/users/show',
                'users/edit' => 'admin/users/edit',
                'users/roles' => 'admin/users/roles',
            ],

            'manager' => [
                'admin/dashboard' => 'manager/dashboard',
                'admin/inquiries/index' => 'manager/inquiries/index',
                'admin/guidelines-contacts' => 'manager/guidelines-contacts',

                'dashboard' => 'manager/calendar/index',

                'calendar/manage' => 'manager/calendar/manage',
                'calendar/analytics' => 'manager/calendar/analytics',
                'calendar/analytics-print' => 'manager/calendar/analytics-print',

                'bookings/index' => 'manager/bookings/index',
                'bookings/show' => 'manager/bookings/show',
                'bookings/edit' => 'manager/bookings/edit',
                'bookings/survey' => 'manager/bookings/survey',
                'bookings/analytics' => 'manager/bookings/analytics',
                'bookings/analytics-print' => 'manager/bookings/analytics-print',
                'bookings/audit' => 'manager/bookings/audit',
                'bookings/audit-print' => 'manager/bookings/audit-print',
                'bookings/operations' => 'manager/bookings/operations',


                'payments/review' => 'manager/payments/review',

                'reports/mice-registry' => 'manager/reports/mice-registry/index',
                'reports/mice-registry-form' => 'manager/reports/mice-registry/form',
                'reports/mice-registry-print' => 'manager/reports/mice-registry/print',
            ],

            'staff' => [
                'admin/inquiries/index' => 'staff/inquiries/index',
                'admin/guidelines-contacts' => 'staff/guidelines-contacts',

                'dashboard' => 'staff/calendar/index',

                'bookings/index' => 'staff/bookings/index',
                'bookings/create' => 'staff/bookings/create',
                'bookings/show' => 'staff/bookings/show',
                'bookings/edit' => 'staff/bookings/edit',
                'bookings/survey' => 'staff/bookings/survey',
            ],

            'user' => [
                'dashboard' => 'user/dashboard',

                'bookings/index' => 'user/bookings/index',
                'bookings/create' => 'user/bookings/create',
                'bookings/show' => 'user/bookings/show',
                'bookings/edit' => 'user/bookings/edit',
                'bookings/survey' => 'user/bookings/survey',
            ],
        ];

        return $map[$role][$defaultPage] ?? $defaultPage;
    }

    public static function routeName(Request $request, string $baseName): string
    {
        $role = self::role($request);

        $candidates = match ($role) {
            'admin' => [
                'admin.' . $baseName,
                $baseName,
            ],
            'manager' => [
                'manager.' . $baseName,
                $baseName,
            ],
            'staff' => [
                'staff.' . $baseName,
                $baseName,
            ],
            default => [
                'user.' . $baseName,
                $baseName,
            ],
        };

        foreach ($candidates as $candidate) {
            if (Route::has($candidate)) {
                return $candidate;
            }
        }

        return $baseName;
    }

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

    public static function isStaffLike(Request $request): bool
    {
        $role = self::role($request);

        return in_array($role, ['admin', 'manager', 'staff'], true);
    }
}
