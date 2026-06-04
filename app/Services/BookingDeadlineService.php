<?php

namespace App\Services;

use App\Models\Booking;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Schema;

class BookingDeadlineService
{
    public function __construct(protected ?NotificationService $notifications = null)
    {
    }

    /**
     * BCCC policy requested in Batch 2: reservations remain payable for
     * ten working days, then unpaid reservations are automatically declined.
     */
    public const PAYMENT_DEADLINE_WORKING_DAYS = 10;
    public const INITIAL_DEADLINE_WORKING_DAYS = self::PAYMENT_DEADLINE_WORKING_DAYS;
    public const BALANCE_DEADLINE_WORKING_DAYS = self::PAYMENT_DEADLINE_WORKING_DAYS;

    /**
     * Legacy constants retained so older services still compile. They now
     * point to the weekday policy equivalent rather than the old 24-hour rule.
     */
    public const INITIAL_DEADLINE_HOURS = self::PAYMENT_DEADLINE_WORKING_DAYS * 24;
    public const BALANCE_DEADLINE_HOURS = self::PAYMENT_DEADLINE_WORKING_DAYS * 24;

    public const DUE_SOON_WORKING_DAYS = 2;

    /**
     * Run all safe deadline automation.
     *
     * @return array<string, int>
     */
    public function run(?CarbonInterface $now = null): array
    {
        $now ??= now();

        if (! Schema::hasTable('bookings')) {
            return [
                'seeded_initial_deadlines' => 0,
                'expired_initial_deadlines' => 0,
                'seeded_balance_deadlines' => 0,
                'expired_balance_deadlines' => 0,
            ];
        }

        return [
            'seeded_initial_deadlines' => $this->seedMissingInitialDeadlines($now),
            'expired_initial_deadlines' => $this->expireInitialDeadlines($now),
            'seeded_balance_deadlines' => $this->seedMissingBalanceDeadlines($now),
            'expired_balance_deadlines' => $this->expireBalanceDeadlines($now),
        ];
    }

    public function addWorkingDays(CarbonInterface $date, int $days): Carbon
    {
        $cursor = Carbon::parse($date)->copy();
        $remaining = max(0, $days);

        while ($remaining > 0) {
            $cursor->addDay();

            if (! $cursor->isWeekend()) {
                $remaining--;
            }
        }

        return $cursor;
    }

    public function seedMissingInitialDeadlines(?CarbonInterface $now = null): int
    {
        $now ??= now();

        if (! $this->canUseInitialDeadline()) {
            return 0;
        }

        $updated = 0;

        Booking::query()
            ->whereNull('expired_at')
            ->whereIn('booking_status', $this->initialDeadlineStatuses())
            ->orderBy('id')
            ->chunkById(100, function ($bookings) use (&$updated, $now): void {
                foreach ($bookings as $booking) {
                    $base = $booking->created_at ?: $now;

                    $booking->forceFill([
                        'expired_at' => $this->addWorkingDays($base, self::INITIAL_DEADLINE_WORKING_DAYS),
                    ])->save();

                    $this->recordDeadlineLifecycle(
                        booking: $booking,
                        eventKey: 'payment_deadline_seeded',
                        title: 'Payment deadline assigned',
                        reason: 'The system assigned the 10-working-day payment deadline.',
                        toStatus: (string) ($booking->booking_status ?? ''),
                        toPaymentStatus: (string) ($booking->payment_status ?? ''),
                        meta: ['expired_at' => optional($booking->expired_at)->toIso8601String()],
                    );

                    $updated++;
                }
            });

        return $updated;
    }

    public function expireInitialDeadlines(?CarbonInterface $now = null): int
    {
        $now ??= now();

        if (! $this->canUseInitialDeadline()) {
            return 0;
        }

        $expired = 0;

        Booking::query()
            ->whereNotNull('expired_at')
            ->where('expired_at', '<=', $now)
            ->whereIn('booking_status', $this->initialDeadlineStatuses())
            ->orderBy('id')
            ->chunkById(100, function ($bookings) use (&$expired, $now): void {
                foreach ($bookings as $booking) {
                    if ($this->isProtectedFromAutoDecline($booking)) {
                        continue;
                    }

                    $previousStatus = (string) ($booking->booking_status ?? '');
                    $previousPaymentStatus = (string) ($booking->payment_status ?? '');

                    $payload = [
                        'booking_status' => 'declined',
                    ];

                    if (Schema::hasColumn('bookings', 'payment_status')) {
                        $payload['payment_status'] = 'expired';
                    }

                    if (Schema::hasColumn('bookings', 'auto_declined_at')) {
                        $payload['auto_declined_at'] = $now;
                    }

                    if (Schema::hasColumn('bookings', 'auto_decline_reason')) {
                        $payload['auto_decline_reason'] = 'Automatically declined because the 10-working-day payment deadline expired without settlement.';
                    }

                    $booking->forceFill($payload)->save();

                    $this->recordDeadlineLifecycle(
                        booking: $booking,
                        eventKey: 'payment_deadline_auto_declined',
                        title: 'Booking automatically declined',
                        reason: 'The 10-working-day payment deadline expired without settlement.',
                        fromStatus: $previousStatus,
                        toStatus: 'declined',
                        fromPaymentStatus: $previousPaymentStatus,
                        toPaymentStatus: (string) ($booking->payment_status ?? 'expired'),
                        meta: [
                            'expired_at' => optional($booking->expired_at)->toIso8601String(),
                            'auto_declined_at' => optional($booking->auto_declined_at)->toIso8601String(),
                            'deadline_policy' => self::PAYMENT_DEADLINE_WORKING_DAYS . ' working days',
                        ],
                    );

                    $this->notifications?->bookingAutoDeclinedByDeadline(
                        $booking,
                        'payment',
                        'The 10-working-day payment deadline expired without settlement.'
                    );

                    $expired++;
                }
            });

        return $expired;
    }

    public function seedMissingBalanceDeadlines(?CarbonInterface $now = null): int
    {
        $now ??= now();

        if (! $this->canUseBalanceDeadline()) {
            return 0;
        }

        $updated = 0;

        Booking::query()
            ->whereNull('payment_balance_due_at')
            ->whereIn('booking_status', $this->activeBookingStatuses())
            ->whereIn('payment_status', $this->partialPaymentStatuses())
            ->orderBy('id')
            ->chunkById(100, function ($bookings) use (&$updated, $now): void {
                foreach ($bookings as $booking) {
                    $base = $booking->updated_at ?: $booking->created_at ?: $now;

                    $booking->forceFill([
                        'payment_balance_due_at' => $this->addWorkingDays($base, self::BALANCE_DEADLINE_WORKING_DAYS),
                    ])->save();

                    $this->recordDeadlineLifecycle(
                        booking: $booking,
                        eventKey: 'balance_deadline_seeded',
                        title: 'Balance payment deadline assigned',
                        reason: 'The system assigned the 10-working-day balance payment deadline.',
                        toStatus: (string) ($booking->booking_status ?? ''),
                        toPaymentStatus: (string) ($booking->payment_status ?? ''),
                        meta: ['payment_balance_due_at' => optional($booking->payment_balance_due_at)->toIso8601String()],
                    );

                    $updated++;
                }
            });

        return $updated;
    }

    public function expireBalanceDeadlines(?CarbonInterface $now = null): int
    {
        $now ??= now();

        if (! $this->canUseBalanceDeadline()) {
            return 0;
        }

        $expired = 0;

        Booking::query()
            ->whereNotNull('payment_balance_due_at')
            ->where('payment_balance_due_at', '<=', $now)
            ->whereIn('booking_status', $this->activeBookingStatuses())
            ->whereIn('payment_status', $this->partialPaymentStatuses())
            ->orderBy('id')
            ->chunkById(100, function ($bookings) use (&$expired, $now): void {
                foreach ($bookings as $booking) {
                    if ($this->isProtectedFromAutoDecline($booking)) {
                        continue;
                    }

                    $previousStatus = (string) ($booking->booking_status ?? '');
                    $previousPaymentStatus = (string) ($booking->payment_status ?? '');

                    $payload = [
                        'booking_status' => 'declined',
                        'payment_status' => 'expired',
                    ];

                    if (Schema::hasColumn('bookings', 'auto_declined_at')) {
                        $payload['auto_declined_at'] = $now;
                    }

                    if (Schema::hasColumn('bookings', 'auto_decline_reason')) {
                        $payload['auto_decline_reason'] = 'Automatically declined because the 10-working-day balance payment deadline expired without settlement.';
                    }

                    $booking->forceFill($payload)->save();

                    $this->recordDeadlineLifecycle(
                        booking: $booking,
                        eventKey: 'balance_deadline_auto_declined',
                        title: 'Booking automatically declined',
                        reason: 'The 10-working-day balance payment deadline expired without settlement.',
                        fromStatus: $previousStatus,
                        toStatus: 'declined',
                        fromPaymentStatus: $previousPaymentStatus,
                        toPaymentStatus: 'expired',
                        meta: [
                            'payment_balance_due_at' => optional($booking->payment_balance_due_at)->toIso8601String(),
                            'auto_declined_at' => optional($booking->auto_declined_at)->toIso8601String(),
                            'deadline_policy' => self::PAYMENT_DEADLINE_WORKING_DAYS . ' working days',
                        ],
                    );

                    $this->notifications?->bookingAutoDeclinedByDeadline(
                        $booking,
                        'balance',
                        'The 10-working-day balance payment deadline expired without settlement.'
                    );

                    $expired++;
                }
            });

        return $expired;
    }

    public function assignInitialDeadline(Booking $booking, ?CarbonInterface $baseTime = null): Booking
    {
        if (! Schema::hasColumn('bookings', 'expired_at')) {
            return $booking;
        }

        $baseTime ??= $booking->created_at ?: now();

        if (blank($booking->expired_at)) {
            $booking->forceFill([
                'expired_at' => $this->addWorkingDays($baseTime, self::INITIAL_DEADLINE_WORKING_DAYS),
            ])->save();
        }

        return $booking;
    }

    public function assignBalanceDeadline(Booking $booking, ?CarbonInterface $baseTime = null): Booking
    {
        if (! Schema::hasColumn('bookings', 'payment_balance_due_at')) {
            return $booking;
        }

        $baseTime ??= now();

        $booking->forceFill([
            'payment_balance_due_at' => $this->addWorkingDays($baseTime, self::BALANCE_DEADLINE_WORKING_DAYS),
        ])->save();

        return $booking;
    }

    public function currentDeadlineFor($booking): ?CarbonInterface
{
    $deadline = null;

    // your existing logic here...

    if (empty($deadline)) {
        return null;
    }

    return $deadline instanceof CarbonInterface
        ? $deadline
        : Carbon::parse($deadline);
}

    /**
     * @return array<string, mixed>
     */
    public function deadlinePayload(Booking $booking, ?CarbonInterface $now = null): array
    {
        $now ??= now();
        $deadline = $this->currentDeadlineFor($booking);
        $bookingStatus = $this->normalizeStatus($booking->booking_status ?? '');
        $paymentStatus = $this->normalizeStatus($booking->payment_status ?? '');
        $secondsRemaining = $deadline ? Carbon::parse($deadline)->getTimestamp() - Carbon::parse($now)->getTimestamp() : null;
        $dueSoonAt = $deadline ? Carbon::parse($deadline)->copy()->subWeekdays(self::DUE_SOON_WORKING_DAYS) : null;

        $state = 'none';

        if (filled($booking->auto_declined_at) || in_array($bookingStatus, ['declined', 'rejected'], true)) {
            $state = 'auto_declined';
        } elseif ($this->isProtectedFromAutoDecline($booking)) {
            $state = 'protected';
        } elseif ($deadline && $deadline->lessThanOrEqualTo($now)) {
            $state = 'expired';
        } elseif ($deadline && $dueSoonAt && $now->greaterThanOrEqualTo($dueSoonAt)) {
            $state = 'due_soon';
        } elseif ($deadline) {
            $state = 'active';
        }

        return [
            'deadline_at' => optional($deadline)->toIso8601String(),
            'deadline_state' => $state,
            'deadline_label' => $this->deadlineLabel($state, $paymentStatus),
            'deadline_seconds_remaining' => $secondsRemaining,
            'deadline_is_expired' => $state === 'expired' || $state === 'auto_declined',
            'deadline_is_due_soon' => $state === 'due_soon',
            'deadline_policy' => self::PAYMENT_DEADLINE_WORKING_DAYS . ' working days',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function initialDeadlineStatuses(): array
    {
        return [
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
    }

    /**
     * @return array<int, string>
     */
    private function activeBookingStatuses(): array
    {
        return [
            ...$this->initialDeadlineStatuses(),
            'approved',
            'confirmed',
            'active',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function completedBookingStatuses(): array
    {
        return [
            'approved',
            'confirmed',
            'active',
            'completed',
            'cancelled',
            'canceled',
            'declined',
            'rejected',
            'archived',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function completedPaymentStatuses(): array
    {
        return [
            'paid',
            'verified',
            'completed',
            'settled',
            'approved',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function partialPaymentStatuses(): array
    {
        return [
            'partial',
            'partially_paid',
            'downpayment_paid',
            'down_payment_paid',
            'balance_pending',
            'for_balance',
            'awaiting_balance',
            'awaiting balance',
        ];
    }

    private function canUseInitialDeadline(): bool
    {
        return Schema::hasColumn('bookings', 'booking_status')
            && Schema::hasColumn('bookings', 'expired_at');
    }

    private function canUseBalanceDeadline(): bool
    {
        return Schema::hasColumn('bookings', 'booking_status')
            && Schema::hasColumn('bookings', 'payment_status')
            && Schema::hasColumn('bookings', 'payment_balance_due_at');
    }

    private function isProtectedFromAutoDecline(Booking $booking): bool
    {
        $bookingStatus = $this->normalizeStatus($booking->booking_status ?? '');
        $paymentStatus = $this->normalizeStatus($booking->payment_status ?? '');

        if (in_array($bookingStatus, $this->completedBookingStatuses(), true)) {
            return true;
        }

        if (in_array($paymentStatus, $this->completedPaymentStatuses(), true)) {
            return true;
        }

        if (Schema::hasColumn('bookings', 'archived_at') && filled($booking->archived_at)) {
            return true;
        }

        return false;
    }

    private function normalizeStatus(mixed $value): string
    {
        return strtolower(str_replace(['-', ' '], '_', trim((string) $value)));
    }

    private function deadlineLabel(string $state, string $paymentStatus): string
    {
        if ($state === 'auto_declined') {
            return 'Auto-declined after payment deadline';
        }

        if ($state === 'expired') {
            return 'Payment deadline expired';
        }

        if ($state === 'due_soon') {
            return 'Payment deadline due soon';
        }

        if ($state === 'protected') {
            return in_array($paymentStatus, $this->completedPaymentStatuses(), true)
                ? 'Payment settled'
                : 'Deadline protected';
        }

        if ($state === 'active') {
            return 'Payment deadline active';
        }

        return 'No payment deadline';
    }

    private function recordDeadlineLifecycle(
        Booking $booking,
        string $eventKey,
        string $title,
        ?string $reason = null,
        ?string $fromStatus = null,
        ?string $toStatus = null,
        ?string $fromPaymentStatus = null,
        ?string $toPaymentStatus = null,
        array $meta = [],
    ): void {
        if (! Schema::hasTable('booking_lifecycle_events') || ! method_exists($booking, 'lifecycleEvents')) {
            return;
        }

        try {
            $booking->lifecycleEvents()->create([
                'actor_user_id' => null,
                'event_key' => $eventKey,
                'title' => $title,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'from_payment_status' => $fromPaymentStatus,
                'to_payment_status' => $toPaymentStatus,
                'reason' => $reason,
                'meta' => collect($meta)->filter(fn ($value) => $value !== null && $value !== '' && $value !== [])->all(),
                'event_at' => now(),
            ]);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
