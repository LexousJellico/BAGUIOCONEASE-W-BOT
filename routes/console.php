<?php

use App\Support\BcccFinalQaAudit;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function (): void {
    $this->comment(\Illuminate\Foundation\Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('bookings:expire-deadlines')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('bookings:sync-lifecycle --quiet-report')
    ->everyThirtyMinutes()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('bookings:send-reminders')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->runInBackground();


Artisan::command('bccc:audit {--strict : Return a non-zero exit code when warnings are found}', function (): int {
    $result = BcccFinalQaAudit::run(base_path());

    $this->line('');
    $this->info('BCCC EASE Final Scope Audit');
    $this->line(str_repeat('-', 72));

    foreach ($result['checks'] as $check) {
        $status = strtoupper((string) $check['status']);
        $line = sprintf('[%s] %s', $status, $check['title']);

        match ($check['status']) {
            'pass' => $this->line('<fg=green>' . $line . '</>'),
            'warning' => $this->line('<fg=yellow>' . $line . '</>'),
            default => $this->line('<fg=red>' . $line . '</>'),
        };

        if (! empty($check['details'])) {
            foreach ((array) $check['details'] as $detail) {
                $this->line('  - ' . $detail);
            }
        }
    }

    $this->line(str_repeat('-', 72));
    $this->line(sprintf('Passed: %d | Warnings: %d | Failed: %d', $result['passed_count'], $result['warning_count'], $result['failed_count']));

    if ($result['failed_count'] > 0) {
        return self::FAILURE;
    }

    if ($this->option('strict') && $result['warning_count'] > 0) {
        return self::FAILURE;
    }

    return self::SUCCESS;
})->purpose('Audit the BCCC EASE booking scope, routes, and final patch integration.');
