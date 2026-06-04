<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PublicSiteContentSeeder::class,
            UsersTableSeeder::class,
            RolePermissionSeeder::class,

            /*
             * Current BCCC booking package/service source of truth.
             *
             * This seeds only:
             * - Full Hall
             * - Main Hall
             * - LED Wall
             * - VIP Lounge
             * - Board Room
             *
             * Foyer & Lobby and Backstage are NOT selectable services.
             * They are only Full Hall support notes.
             */
            BcccVenuePackageSeeder::class,

            /*
             * Public operational package combinations for the homepage and booking entry.
             * Full Hall does not automatically include VIP Lounge, Board Room, or LED Wall.
             */
            VenuePackageTemplateSeeder::class,
        ]);
    }
}
