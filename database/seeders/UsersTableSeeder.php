<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'BCCC Admin',
                'email' => 'admin@bccc-ease.test',
                'password' => 'password123',
            ],
            [
                'name' => 'BCCC Manager',
                'email' => 'manager@bccc-ease.test',
                'password' => 'password123',
            ],
            [
                'name' => 'BCCC Staff',
                'email' => 'staff@bccc-ease.test',
                'password' => 'password123',
            ],
            [
                'name' => 'BCCC Client User',
                'email' => 'user@bccc-ease.test',
                'password' => 'password123',
            ],
        ];

        foreach ($users as $entry) {
            User::updateOrCreate(
                ['email' => $entry['email']],
                [
                    'name' => $entry['name'],
                    'password' => Hash::make($entry['password']),
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
