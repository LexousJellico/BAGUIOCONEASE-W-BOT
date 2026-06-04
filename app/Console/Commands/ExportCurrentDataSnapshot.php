<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ExportCurrentDataSnapshot extends Command
{
    protected $signature = 'app:export-current-data-snapshot {--path=database/seeders/generated/current_data_snapshot.json}';

    protected $description = 'Export the current working data into a reusable JSON snapshot that can later be loaded as a seed source.';

    public function handle(): int
    {
        $path = base_path((string) $this->option('path'));
        File::ensureDirectoryExists(dirname($path));

        $tables = [
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

        $payload = [
            'exported_at' => now()->toIso8601String(),
            'tables' => [],
        ];

        foreach ($tables as $table) {
            if (! DB::getSchemaBuilder()->hasTable($table)) {
                continue;
            }

            $payload['tables'][$table] = DB::table($table)
                ->orderBy('id')
                ->get()
                ->map(fn ($row) => (array) $row)
                ->all();
        }

        File::put($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        $this->info('Snapshot exported successfully: ' . $path);
        $this->line('You can load it later with ImportedSnapshotSeeder.');

        return self::SUCCESS;
    }
}
