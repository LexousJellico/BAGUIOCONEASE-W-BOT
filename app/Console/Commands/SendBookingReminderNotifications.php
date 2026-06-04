<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\NotificationService;
use Carbon\CarbonInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class SendBookingReminderNotifications extends Command
{
    protected $signature = 'bookings:send-reminders {--dry-run : Show matching reminder counts without writing notifications}';

    protected $description = 'Send approved-booking event reminders and payment due reminders.';

    public function handle(NotificationService $notifications): int
    {
        if (! Schema::hasTable('bookings')) {
            $this->warn('The bookings table does not exist yet.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $counts = [
            'event_10d' => 0,
            'event_3d' => 0,
            'event_1d' => 0,
            'payment_due' => 0,
        ];

        $this->sendEventReminders($notifications, $counts, $dryRun);
        $this->sendPaymentDueReminders($notifications, $counts, $dryRun);

        $this->info('Booking reminder check completed.');
        $this->table(
            ['Reminder', 'Count'],
            [
                ['Approved booking: 10 days before', $counts['event_10d']],
                ['Approved booking: 3 days before', $counts['event_3d']],
                ['Approved booking: 1 day before', $counts['event_1d']],
                ['Payment or balance due soon', $counts['payment_due']],
            ]
        );

        return self::SUCCESS;
    }

    /**
     * @param array<string, int> $counts
     */
    private function sendEventReminders(NotificationService $notifications, array &$counts, bool $dryRun): void
    {
        if (! Schema::hasColumn('bookings', 'booking_date_from')) {
            return;
        }

        Booking::query()
            ->whereNotNull('booking_date_from')
            ->whereIn('booking_status', ['approved', 'confirmed', 'active'])
            ->orderBy('booking_date_from')
            ->chunkById(100, function ($bookings) use ($notifications, &$counts, $dryRun): void {
                foreach ($bookings as $booking) {
                    $eventStart = $booking->booking_date_from;

                    if (! $eventStart instanceof CarbonInterface) {
                        continue;
                    }

                    $days = now()->startOfDay()->diffInDays($eventStart->copy()->startOfDay(), false);

                    if (! in_array($days, [10, 3, 1], true)) {
                        continue;
                    }

                    $column = match ($days) {
                        10 => 'event_reminder_10d_sent_at',
                        3 => 'event_reminder_3d_sent_at',
                        default => 'event_reminder_1d_sent_at',
                    };

                    if (Schema::hasColumn('bookings', $column) && filled($booking->{$column})) {
                        continue;
                    }

                    $counts['event_' . $days . 'd']++;

                    if ($dryRun) {
                        continue;
                    }

                    $notifications->bookingEventReminder($booking, $days);

                    if (Schema::hasColumn('bookings', $column)) {
                        $booking->forceFill([$column => now()])->saveQuietly();
                    }
                }
            });
    }

    /**
     * @param array<string, int> $counts
     */
    private function sendPaymentDueReminders(NotificationService $notifications, array &$counts, bool $dryRun): void
    {
        if (! Schema::hasColumn('bookings', 'payment_status')) {
            return;
        }

        Booking::query()
            ->whereIn('booking_status', ['pending', 'submitted', 'pencil_booked', 'for_review', 'confirmed', 'approved', 'active'])
            ->whereIn('payment_status', ['unpaid', 'pending', 'for_review', 'awaiting_downpayment', 'partial', 'awaiting_balance', 'owing'])
            ->orderBy('id')
            ->chunkById(100, function ($bookings) use ($notifications, &$counts, $dryRun): void {
                foreach ($bookings as $booking) {
                    if (Schema::hasColumn('bookings', 'payment_due_reminder_sent_at') && filled($booking->payment_due_reminder_sent_at)) {
                        continue;
                    }

                    $deadlineType = $this->deadlineType($booking);
                    $deadline = $deadlineType === 'balance'
                        ? $booking->payment_balance_due_at
                        : ($booking->expired_at ?: $booking->payment_balance_due_at);

                    if (! $deadline instanceof CarbonInterface) {
                        continue;
                    }

                    $daysRemaining = now()->startOfDay()->diffInDays($deadline->copy()->startOfDay(), false);

                    if ($daysRemaining < 0 || $daysRemaining > 2) {
                        continue;
                    }

                    $counts['payment_due']++;

                    if ($dryRun) {
                        continue;
                    }

                    $notifications->bookingPaymentDueReminder($booking, $deadlineType);

                    if (Schema::hasColumn('bookings', 'payment_due_reminder_sent_at')) {
                        $booking->forceFill(['payment_due_reminder_sent_at' => now()])->saveQuietly();
                    }
                }
            });
    }

    private function deadlineType(Booking $booking): string
    {
        $paymentStatus = strtolower(str_replace(['-', ' '], '_', (string) ($booking->payment_status ?? '')));

        return in_array($paymentStatus, ['partial', 'awaiting_balance', 'owing'], true) ? 'balance' : 'payment';
    }
}
