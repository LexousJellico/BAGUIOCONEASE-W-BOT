<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class WorkspaceLegacyRedirectController extends Controller
{
    public function dashboard(Request $request): RedirectResponse
    {
        return redirect()->route($this->firstExistingRoute($this->dashboardCandidates($request)));
    }

    public function calendar(Request $request): RedirectResponse
    {
        return redirect()->route($this->firstExistingRoute($this->calendarCandidates($request)));
    }

    public function bookings(Request $request): RedirectResponse
    {
        return redirect()->route($this->firstExistingRoute($this->bookingIndexCandidates($request)));
    }

    public function createBooking(Request $request): RedirectResponse
    {
        return redirect()->route($this->firstExistingRoute($this->bookingCreateCandidates($request)));
    }

    public function payments(Request $request): RedirectResponse
    {
        return redirect()->route($this->firstExistingRoute($this->paymentCandidates($request)));
    }

    public function miceRegistry(Request $request): RedirectResponse
    {
        return redirect()->route($this->firstExistingRoute($this->miceRegistryCandidates($request)));
    }

    public function venueAreas(Request $request): RedirectResponse
    {
        return redirect()->route($this->firstExistingRoute([
            'admin.venue-areas.index',
            'admin.service-types.index',
            'service-types.index',
            'admin.dashboard',
        ]));
    }

    public function rentalOptions(Request $request): RedirectResponse
    {
        return redirect()->route($this->firstExistingRoute([
            'admin.rental-options.index',
            'admin.services.index',
            'services.index',
            'admin.dashboard',
        ]));
    }

    public function users(Request $request): RedirectResponse
    {
        return redirect()->route($this->firstExistingRoute([
            'admin.users.index',
            'users.index',
            'admin.dashboard',
        ]));
    }

    private function dashboardCandidates(Request $request): array
    {
        return match ($this->role($request)) {
            'admin' => ['admin.dashboard', 'dashboard'],
            'manager' => ['manager.dashboard', 'admin.dashboard', 'dashboard'],
            'staff' => ['staff.dashboard', 'admin.dashboard', 'dashboard'],
            default => ['user.dashboard', 'my-dashboard', 'dashboard'],
        };
    }

    private function calendarCandidates(Request $request): array
    {
        return match ($this->role($request)) {
            'admin' => ['admin.calendar', 'calendar'],
            'manager' => ['manager.calendar', 'admin.calendar', 'calendar'],
            'staff' => ['staff.calendar', 'admin.calendar', 'calendar'],
            default => ['user.dashboard', 'user.bookings.index', 'calendar'],
        };
    }

    private function bookingIndexCandidates(Request $request): array
    {
        return match ($this->role($request)) {
            'admin' => ['admin.bookings.index', 'bookings.index'],
            'manager' => ['manager.bookings.index', 'admin.bookings.index', 'bookings.index'],
            'staff' => ['staff.bookings.index', 'admin.bookings.index', 'bookings.index'],
            default => ['user.bookings.index', 'bookings.index'],
        };
    }

    private function bookingCreateCandidates(Request $request): array
    {
        return match ($this->role($request)) {
            'admin' => ['admin.bookings.create', 'bookings.create'],
            'staff' => ['staff.bookings.create', 'admin.bookings.create', 'bookings.create'],
            default => ['user.bookings.create', 'bookings.create'],
        };
    }

    private function paymentCandidates(Request $request): array
    {
        return match ($this->role($request)) {
            'admin' => ['admin.payments.review', 'payments.review'],
            'manager' => ['manager.payments.review', 'admin.payments.review', 'payments.review'],
            'staff' => ['staff.bookings.index', 'admin.bookings.index'],
            default => ['user.bookings.index', 'user.dashboard'],
        };
    }

    private function miceRegistryCandidates(Request $request): array
    {
        return match ($this->role($request)) {
            'admin' => ['admin.reports.mice-registry', 'reports.mice-registry'],
            'manager' => ['manager.reports.mice-registry', 'admin.reports.mice-registry', 'reports.mice-registry'],
            default => ['admin.dashboard', 'dashboard'],
        };
    }

    private function firstExistingRoute(array $candidates): string
    {
        foreach ($candidates as $candidate) {
            if (Route::has($candidate)) {
                return $candidate;
            }
        }

        return Route::has('admin.dashboard')
            ? 'admin.dashboard'
            : (Route::has('dashboard') ? 'dashboard' : 'login');
    }

    private function role(Request $request): string
    {
        $routeName = (string) optional($request->route())->getName();
        $path = '/' . ltrim($request->path(), '/');

        if (str_starts_with($routeName, 'admin.') || str_starts_with($path, '/admin/')) {
            return 'admin';
        }

        if (str_starts_with($routeName, 'manager.') || str_starts_with($path, '/manager/')) {
            return 'manager';
        }

        if (str_starts_with($routeName, 'staff.') || str_starts_with($path, '/staff/')) {
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

        return 'user';
    }
}
