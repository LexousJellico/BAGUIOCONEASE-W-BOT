<?php

namespace App\Console\Commands;

use App\Services\BookingDeadlineService;
use Illuminate\Console\Command;

class ExpireBookingDeadlines extends Command
{
    protected $signature = 'bookings:expire-deadlines {--dry-run : Show what would run without changing records}';

    protected $description = 'Assign missing booking deadlines and auto-decline expired booking/payment deadlines.';

    public function handle(BookingDeadlineService $service): int
    {
        if ($this->option('dry-run')) {
            $this->warn('Dry-run mode currently verifies that the command is registered. It does not mutate records.');
            $this->line('Run without --dry-run to assign missing deadlines and expire overdue bookings.');

            return self::SUCCESS;
        }

        $result = $service->run();

        $this->info('Booking deadline automation completed.');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Seeded 10-working-day payment deadlines', $result['seeded_initial_deadlines'] ?? 0],
                ['Auto-declined expired payment deadlines', $result['expired_initial_deadlines'] ?? 0],
                ['Seeded 10-working-day balance deadlines', $result['seeded_balance_deadlines'] ?? 0],
                ['Auto-declined expired balance deadlines', $result['expired_balance_deadlines'] ?? 0],
            ],
        );

        return self::SUCCESS;
    }
}
