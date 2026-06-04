<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'dashboard.view',
            'bookings.view',
            'bookings.create',
            'bookings.update',
            'bookings.delete',
            'payments.manage',
            'services.manage',
            'service_types.manage',
            'users.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $staff = Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
        $userRole = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        $admin->syncPermissions(Permission::all());

        $manager->syncPermissions([
            'dashboard.view',
            'bookings.view',
            'bookings.create',
            'bookings.update',
            'payments.manage',
            'services.manage',
            'service_types.manage',
        ]);

        $staff->syncPermissions([
            'dashboard.view',
            'bookings.view',
        ]);

        $userRole->syncPermissions([
            'dashboard.view',
            'bookings.view',
            'bookings.create',
            'bookings.update',
        ]);

        $roleMap = [
            'admin@bccc-ease.test' => 'admin',
            'manager@bccc-ease.test' => 'manager',
            'staff@bccc-ease.test' => 'staff',
            'user@bccc-ease.test' => 'user',
        ];

        foreach ($roleMap as $email => $roleName) {
            $user = User::where('email', $email)->first();

            if ($user) {
                $user->syncRoles([$roleName]);
            }
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
