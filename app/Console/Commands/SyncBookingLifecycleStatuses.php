<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SyncBookingLifecycleStatuses extends Command
{
    protected $signature = 'bookings:sync-statuses {--quiet-report : Suppress per-item output from the lifecycle sync command}';

    protected $description = 'Backward-compatible alias for bookings:sync-lifecycle.';

    public function handle(): int
    {
        return (int) $this->call('bookings:sync-lifecycle', [
            '--quiet-report' => (bool) $this->option('quiet-report'),
        ]);
    }
}
