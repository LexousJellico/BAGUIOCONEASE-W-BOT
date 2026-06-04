<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        $initialStatuses = [
            'pending',
            'submitted',
            'pencil_booked',
            'pencil-booked',
            'for_review',
            'for review',
            'awaiting_downpayment',
            'awaiting downpayment',
            'awaiting_down_payment',
            'awaiting down payment',
            'awaiting_payment',
            'awaiting payment',
        ];

        if (Schema::hasColumn('bookings', 'expired_at') && Schema::hasColumn('bookings', 'created_at')) {
            DB::table('bookings')
                ->select(['id', 'created_at', 'expired_at'])
                ->whereIn('booking_status', $initialStatuses)
                ->orderBy('id')
                ->chunkById(100, function ($bookings): void {
                    foreach ($bookings as $booking) {
                        $createdAt = $booking->created_at ? Carbon::parse($booking->created_at) : now();
                        $tenWorkingDays = $this->addWorkingDays($createdAt, 10);

                        if ($booking->expired_at && Carbon::parse($booking->expired_at)->greaterThanOrEqualTo($tenWorkingDays)) {
                            continue;
                        }

                        DB::table('bookings')
                            ->where('id', $booking->id)
                            ->update(['expired_at' => $tenWorkingDays]);
                    }
                });
        }

        if (
            Schema::hasColumn('bookings', 'payment_balance_due_at')
            && Schema::hasColumn('bookings', 'payment_status')
            && Schema::hasColumn('bookings', 'updated_at')
        ) {
            DB::table('bookings')
                ->select(['id', 'updated_at', 'created_at', 'payment_balance_due_at'])
                ->whereIn('payment_status', [
                    'partial',
                    'partially_paid',
                    'downpayment_paid',
                    'down_payment_paid',
                    'balance_pending',
                    'for_balance',
                    'awaiting_balance',
                    'awaiting balance',
                ])
                ->orderBy('id')
                ->chunkById(100, function ($bookings): void {
                    foreach ($bookings as $booking) {
                        $base = $booking->updated_at ?: $booking->created_at ?: now();
                        $tenWorkingDays = $this->addWorkingDays(Carbon::parse($base), 10);

                        if ($booking->payment_balance_due_at && Carbon::parse($booking->payment_balance_due_at)->greaterThanOrEqualTo($tenWorkingDays)) {
                            continue;
                        }

                        DB::table('bookings')
                            ->where('id', $booking->id)
                            ->update(['payment_balance_due_at' => $tenWorkingDays]);
                    }
                });
        }
    }

    public function down(): void
    {
        // Deadline policy data is intentionally not rolled back because shortening
        // already-issued client payment windows could cause unfair auto-declines.
    }

    private function addWorkingDays(Carbon $date, int $days): Carbon
    {
        $cursor = $date->copy();
        $remaining = max(0, $days);

        while ($remaining > 0) {
            $cursor->addDay();

            if (! $cursor->isWeekend()) {
                $remaining--;
            }
        }

        return $cursor;
    }
};
