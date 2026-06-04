<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingLifecycleEvent;
use App\Support\BookingStatusCatalog;
use App\Support\BcccBookingPolicyCatalog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class BookingApprovalWorkflowService
{
    public function __construct(
        private readonly BookingBillingService $billing,
        private readonly BookingFinancialSummaryService $financialSummary,
    ) {
    }

    public function markForReview(Booking $booking, ?int $userId = null, ?string $remarks = null): Booking
    {
        return $this->transition(
            booking: $booking,
            toStatus: 'for_review',
            userId: $userId,
            title: 'Booking moved to review',
            remarks: $remarks,
            extra: ['payment_status' => 'unpaid']
        );
    }

    public function pencilBook(Booking $booking, ?int $userId = null, ?string $remarks = null): Booking
    {
        $this->billing->lockFinalComputation($booking, $userId, $remarks);
        $booking = $booking->fresh(['payments', 'bookingServices.service', 'postEventCharges']);

        $payload = [
            'payment_status' => 'unpaid',
        ];

        $deadlineService = app(BookingDeadlineService::class);
        $deadline = $booking->expired_at ?: $deadlineService->addWorkingDays(now(), BookingDeadlineService::PAYMENT_DEADLINE_WORKING_DAYS);

        if (Schema::hasColumn('bookings', 'down_payment_due_at')) {
            $payload['down_payment_due_at'] = $booking->down_payment_due_at ?: $deadline;
        }

        if (Schema::hasColumn('bookings', 'expired_at')) {
            $payload['expired_at'] = $booking->expired_at ?: $deadline;
        }

        return $this->transition(
            booking: $booking,
            toStatus: 'pencil_booked',
            userId: $userId,
            title: 'Booking pencil-booked pending down payment',
            remarks: $remarks,
            extra: $payload
        );
    }

    public function confirm(Booking $booking, ?int $userId = null, ?string $remarks = null, bool $force = false): Booking
    {
        $booking = $this->billing->lockFinalComputation($booking, $userId, $remarks);
        $summary = $this->billing->summarize($booking);

        if (! $force && ! ($summary['confirmation_ready'] ?? false)) {
            throw ValidationException::withMessages([
                'booking' => 'The required 50% down payment must be confirmed before this booking can be confirmed.',
            ]);
        }

        $payload = [
            'payment_status' => ((float) ($summary['balance'] ?? 0)) <= 0 ? 'paid' : 'partial',
        ];

        if (Schema::hasColumn('bookings', 'confirmed_at')) {
            $payload['confirmed_at'] = $booking->confirmed_at ?: now();
        }

        if ($userId && Schema::hasColumn('bookings', 'confirmed_by_user_id')) {
            $payload['confirmed_by_user_id'] = $userId;
        }

        if (Schema::hasColumn('bookings', 'balance_due_at') && blank($booking->balance_due_at)) {
            $eventStart = $booking->booking_date_from;
            $payload['balance_due_at'] = $eventStart ?: now()->addDays(7);
        }

        $confirmed = $this->transition(
            booking: $booking,
            toStatus: 'confirmed',
            userId: $userId,
            title: 'Booking confirmed after payment review',
            remarks: $remarks,
            extra: $payload
        );

        $this->finalizeMiceDraft($confirmed, $userId);

        return $confirmed->fresh(['payments', 'bookingServices.service', 'postEventCharges', 'miceRecord']);
    }

    public function decline(Booking $booking, ?int $userId = null, ?string $reason = null): Booking
    {
        $payload = ['payment_status' => 'declined'];

        if (Schema::hasColumn('bookings', 'declined_at')) {
            $payload['declined_at'] = now();
        }

        if ($userId && Schema::hasColumn('bookings', 'declined_by_user_id')) {
            $payload['declined_by_user_id'] = $userId;
        }

        return $this->transition(
            booking: $booking,
            toStatus: 'declined',
            userId: $userId,
            title: 'Booking declined',
            remarks: $reason,
            extra: $payload
        );
    }

    public function cancel(Booking $booking, ?int $userId = null, ?string $reason = null, bool $afterOfficeHoursDayBefore = false): Booking
    {
        $penalty = $this->computeCancellationPenalty($booking, $afterOfficeHoursDayBefore);

        $payload = ['payment_status' => 'declined'];

        if (Schema::hasColumn('bookings', 'cancelled_at')) {
            $payload['cancelled_at'] = now();
        }

        if ($userId && Schema::hasColumn('bookings', 'cancelled_by_user_id')) {
            $payload['cancelled_by_user_id'] = $userId;
        }

        if (Schema::hasColumn('bookings', 'cancellation_penalty_rate')) {
            $payload['cancellation_penalty_rate'] = $penalty['rate'];
        }

        if (Schema::hasColumn('bookings', 'cancellation_penalty_amount')) {
            $payload['cancellation_penalty_amount'] = $penalty['amount'];
        }

        return $this->transition(
            booking: $booking,
            toStatus: 'cancelled',
            userId: $userId,
            title: 'Booking cancelled',
            remarks: $reason,
            extra: $payload + ['cancellation_penalty' => $penalty]
        );
    }

    public function complete(Booking $booking, ?int $userId = null, ?string $remarks = null): Booking
    {
        $summary = $this->billing->summarize($booking);

        $payload = [
            'payment_status' => ((float) ($summary['balance'] ?? 0)) <= 0 ? 'paid' : 'owing',
        ];

        if (Schema::hasColumn('bookings', 'completed_at')) {
            $payload['completed_at'] = now();
        }

        if ($userId && Schema::hasColumn('bookings', 'completed_by_user_id')) {
            $payload['completed_by_user_id'] = $userId;
        }

        return $this->transition(
            booking: $booking,
            toStatus: 'completed',
            userId: $userId,
            title: 'Booking completed',
            remarks: $remarks,
            extra: $payload
        );
    }

    public function computeCancellationPenalty(Booking $booking, bool $afterOfficeHoursDayBefore = false): array
    {
        $eventDate = $booking->booking_date_from ? $booking->booking_date_from->copy()->startOfDay() : now()->startOfDay();
        $daysBefore = now()->startOfDay()->diffInDays($eventDate, false);
        $rate = BcccBookingPolicyCatalog::cancellationPenaltyRate($daysBefore, $afterOfficeHoursDayBefore);
        $summary = $this->financialSummary->summarize($booking);

        $venueFeeCandidates = [
            $booking->finalized_total ?? null,
            $summary['base_total'] ?? null,
            $summary['venue_total_with_post_event'] ?? null,
        ];

        $totalWithoutBond = max(0, (float) ($summary['total'] ?? 0) - (float) ($summary['bond_charge'] ?? 0));
        if ($totalWithoutBond > 0) {
            $venueFeeCandidates[] = $totalWithoutBond;
        }

        $baseTotal = 0.0;
        foreach ($venueFeeCandidates as $candidate) {
            $value = is_numeric($candidate) ? (float) $candidate : 0.0;

            if ($value > 0) {
                $baseTotal = $value;
                break;
            }
        }

        return [
            'days_before_event' => $daysBefore,
            'rate' => $rate,
            'amount' => round(max($baseTotal, 0) * $rate, 2),
        ];
    }

    private function transition(
        Booking $booking,
        string $toStatus,
        ?int $userId,
        string $title,
        ?string $remarks = null,
        array $extra = []
    ): Booking {
        return DB::transaction(function () use ($booking, $toStatus, $userId, $title, $remarks, $extra): Booking {
            $fromStatus = (string) ($booking->booking_status ?? '');
            $fromPaymentStatus = (string) ($booking->payment_status ?? '');

            $payload = [];

            if (Schema::hasColumn('bookings', 'booking_status')) {
                $payload['booking_status'] = BookingStatusCatalog::normalizeBookingStatus($toStatus, $toStatus);
            }

            foreach ($extra as $column => $value) {
                if (Schema::hasColumn('bookings', $column)) {
                    $payload[$column] = $value;
                }
            }

            if (! empty($payload)) {
                $booking->forceFill($payload)->save();
            }

            $booking = $booking->fresh(['payments', 'bookingServices.service', 'postEventCharges']);

            $this->recordLifecycleEvent(
                booking: $booking,
                userId: $userId,
                title: $title,
                fromStatus: $fromStatus,
                toStatus: (string) $booking->booking_status,
                fromPaymentStatus: $fromPaymentStatus,
                toPaymentStatus: (string) ($booking->payment_status ?? ''),
                reason: $remarks,
                meta: [
                    'extra' => $extra,
                ]
            );

            return $booking;
        });
    }

    private function finalizeMiceDraft(Booking $booking, ?int $userId = null): void
    {
        $record = $booking->miceRecord;

        if (! $record) {
            return;
        }

        $payload = [];
        $table = $record->getTable();

        if (Schema::hasColumn($table, 'status')) {
            $payload['status'] = 'finalized';
        }

        if (Schema::hasColumn($table, 'finalized_at')) {
            $payload['finalized_at'] = now();
        }

        if ($userId && Schema::hasColumn($table, 'finalized_by_user_id')) {
            $payload['finalized_by_user_id'] = $userId;
        }

        if (! empty($payload)) {
            $record->forceFill($payload)->save();
        }
    }

    private function recordLifecycleEvent(
        Booking $booking,
        ?int $userId,
        string $title,
        ?string $fromStatus,
        ?string $toStatus,
        ?string $fromPaymentStatus,
        ?string $toPaymentStatus,
        ?string $reason,
        array $meta = []
    ): void {
        if (! Schema::hasTable('booking_lifecycle_events')) {
            return;
        }

        try {
            BookingLifecycleEvent::query()->create([
                'booking_id' => $booking->id,
                'actor_user_id' => $userId,
                'event_key' => str($title)->slug('_')->toString(),
                'title' => $title,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'from_payment_status' => $fromPaymentStatus,
                'to_payment_status' => $toPaymentStatus,
                'reason' => $reason,
                'meta' => $meta,
                'event_at' => now(),
            ]);
        } catch (\Throwable) {
            // Lifecycle logging must not block operational decisions.
        }
    }
}
