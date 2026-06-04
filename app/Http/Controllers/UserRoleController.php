<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use App\Support\WorkspacePage;

class UserRoleController extends Controller
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function index(Request $request): Response
    {
        $query = User::query()->with('roles');

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('organization_name', 'like', "%{$search}%");
            });
        }

        if ($role = trim((string) $request->input('role', ''))) {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        $users = $query
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString()
            ->through(function (User $user) use ($request) {
                return [
                    'id' => $user->id,
                    'name' => $user->display_name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'organization_name' => $user->organization_name,
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                    'last_login_at' => $user->last_login_at?->toIso8601String(),
                    'role' => $user->roles->pluck('name')->first(),
                    'is_self' => $request->user()?->id === $user->id,
                ];
            });

        return Inertia::render(WorkspacePage::resolve($request, 'users/roles'), [
            'users' => $users,
            'availableRoles' => Role::query()->orderBy('name')->pluck('name')->all(),
            'filters' => [
                'search' => (string) $request->input('search', ''),
                'role' => (string) $request->input('role', ''),
            ],
            'summary' => [
                'total_users' => User::count(),
                'verified_users' => User::query()->whereNotNull('email_verified_at')->count(),
                'admin' => User::role('admin')->count(),
                'manager' => User::role('manager')->count(),
                'staff' => User::role('staff')->count(),
                'user' => User::role('user')->count(),
            ],
        ]);
    }

    public function update(User $user, Request $request): RedirectResponse
    {
        $actor = $request->user();
        $oldRoles = $user->roles->pluck('name')->all();
        $currentRole = $user->roles->pluck('name')->first();

        $data = $request->validate([
            'role' => ['nullable', 'string'],
        ]);

        $requestedRole = null;
        if (!empty($data['role']) && Role::where('name', $data['role'])->exists()) {
            $requestedRole = $data['role'];
        }

        if ($actor && $actor->id === $user->id && $currentRole !== $requestedRole) {
            return back()->with('error', 'You cannot change your own role from this screen. Ask another admin to do it instead.');
        }

        if ($user->hasRole('admin') && $requestedRole !== 'admin' && User::role('admin')->count() <= 1) {
            return back()->with('error', 'You cannot remove the admin role from the last remaining admin account.');
        }

        if ($requestedRole) {
            $user->syncRoles([$requestedRole]);
        } else {
            $user->syncRoles([]);
        }

        $newRoles = $user->roles->pluck('name')->all();

        if ($actor) {
            $oldSorted = $oldRoles;
            $newSorted = $newRoles;
            sort($oldSorted);
            sort($newSorted);

            if ($oldSorted !== $newSorted) {
                $this->notifications->userRolesUpdated($user, $actor, $oldRoles, $newRoles);
            }
        }

        return back()->with('success', 'Role updated for user: ' . $user->email);
    }
}
