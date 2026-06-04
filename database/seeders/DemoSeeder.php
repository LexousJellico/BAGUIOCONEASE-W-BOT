<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    /**
     * Legacy demo data is intentionally disabled.
     *
     * The old demo seeder inserted outdated selectable areas such as:
     * - Grounds/Parking Area
     * - Lobby/Foyer
     * - Gallery 2600
     * - Dressing Rooms
     * - Basement
     * - separate VIP Lounge entries
     *
     * Those are no longer part of the current booking package selector.
     *
     * Current package/service source of truth:
     * - BcccVenuePackageSeeder
     */
    public function run(): void
    {
        $this->call([
            BcccVenuePackageSeeder::class,
        ]);
    }
}
