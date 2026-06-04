<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ImportedSnapshotSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/generated/current_data_snapshot.json');

        if (! File::exists($path)) {
            $this->command?->warn('Snapshot file not found: ' . $path);
            return;
        }

        $payload = json_decode(File::get($path), true);
        $tables = (array) data_get($payload, 'tables', []);

        $orderedTables = [
            'service_types',
            'services',
            'site_settings',
            'public_events',
            'calendar_blocks',
            'inquiries',
            'bookings',
            'booking_services',
            'booking_payments',
        ];

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            foreach ($orderedTables as $table) {
                if (! isset($tables[$table]) || ! DB::getSchemaBuilder()->hasTable($table)) {
                    continue;
                }

                DB::table($table)->truncate();

                $rows = array_map(function (array $row) {
                    unset($row['id']);
                    return $row;
                }, (array) $tables[$table]);

                if (! empty($rows)) {
                    foreach (array_chunk($rows, 200) as $chunk) {
                        DB::table($table)->insert($chunk);
                    }
                }
            }
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }
}
