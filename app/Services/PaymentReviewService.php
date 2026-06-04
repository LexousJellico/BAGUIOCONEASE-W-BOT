<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingLifecycleEvent;
use App\Models\BookingPayment;
use App\Support\BcccBookingPolicyCatalog;
use App\Support\BookingStatusCatalog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PaymentReviewService
{
    public function approve(BookingPayment $payment, ?int $userId = null): BookingPayment
    {
        return DB::transaction(function () use ($payment, $userId): BookingPayment {
            $payment->loadMissing('booking');

            $this->updatePaymentStatus($payment, 'approved', $userId);
            $this->syncBookingPaymentStatus($payment->booking, $userId, 'Payment proof approved.');

            return $payment->fresh(['booking']);
        });
    }

    public function reject(BookingPayment $payment, ?int $userId = null, ?string $remarks = null): BookingPayment
    {
        return DB::transaction(function () use ($payment, $userId, $remarks): BookingPayment {
            $payment->loadMissing('booking');

            $this->updatePaymentStatus($payment, 'rejected', $userId, $remarks);
            $this->syncBookingPaymentStatus($payment->booking, $userId, 'Payment proof rejected.');

            return $payment->fresh(['booking']);
        });
    }

    public function updatePaymentStatus(
        BookingPayment $payment,
        string $status,
        ?int $userId = null,
        ?string $remarks = null
    ): void {
        $status = BookingStatusCatalog::normalizePaymentProofStatus($status, 'pending');
        $now = now();
        $payload = [];

        if (Schema::hasColumn($payment->getTable(), 'status')) {
            $payload['status'] = $status;
        }

        if (Schema::hasColumn($payment->getTable(), 'payment_status')) {
            $payload['payment_status'] = $status;
        }

        if ($status === 'approved') {
            foreach (['paid_at', 'approved_at', 'verified_at', 'reviewed_at'] as $column) {
                if (Schema::hasColumn($payment->getTable(), $column)) {
                    $payload[$column] = $payment->{$column} ?: $now;
                }
            }

            foreach (['declined_at', 'failed_at', 'rejected_at'] as $column) {
                if (Schema::hasColumn($payment->getTable(), $column)) {
                    $payload[$column] = null;
                }
            }
        }

        if ($status === 'rejected') {
            foreach (['declined_at', 'rejected_at', 'reviewed_at'] as $column) {
                if (Schema::hasColumn($payment->getTable(), $column)) {
                    $payload[$column] = $now;
                }
            }
        }

        foreach (['reviewed_by_user_id', 'verified_by_user_id', 'updated_by_user_id'] as $column) {
            if ($userId && Schema::hasColumn($payment->getTable(), $column)) {
                $payload[$column] = $userId;
            }
        }

        if ($remarks !== null && Schema::hasColumn($payment->getTable(), 'remarks')) {
            $payload['remarks'] = $remarks;
        }

        if (! empty($payload)) {
            $payment->forceFill($payload)->save();
        }
    }

    public function syncBookingPaymentStatus(?Booking $booking, ?int $userId = null, ?string $eventDescription = null): void
    {
        if (! $booking) {
            return;
        }

        $booking->loadMissing(['payments', 'bookingServices.service']);

        $totalCharges = $this->bookingTotalCharges($booking);
        $approvedPayments = $this->approvedPaymentTotal($booking);
        $submittedPayments = $this->submittedPaymentTotal($booking);
        $bondCharge = $this->bookingBondCharge($booking);
        $baseCharges = max($totalCharges - $bondCharge, 0);
        $requiredDownPayment = $this->bookingRequiredDownPayment($booking, $baseCharges, $bondCharge, $totalCharges);
        $remainingBalance = max($totalCharges - $approvedPayments, 0);
        $previousBookingStatus = (string) ($booking->booking_status ?? '');
        $previousPaymentStatus = (string) ($booking->payment_status ?? '');

        $bookingPayload = [];

        if (Schema::hasColumn('bookings', 'payment_status')) {
            $bookingPayload['payment_status'] = $this->resolveBookingPaymentStatus(
                totalCharges: $totalCharges,
                approvedPayments: $approvedPayments,
                submittedPayments: $submittedPayments,
                currentPaymentStatus: $previousPaymentStatus
            );
        }

        if ($bondCharge <= 0 || $approvedPayments + 0.00001 >= min($totalCharges, $requiredDownPayment)) {
            $this->applyBondPaidPayload($booking, $bookingPayload);
        }

        if ($approvedPayments > 0 && $remainingBalance <= 0) {
            $this->applyFullyPaidBookingPayload($booking, $bookingPayload, $userId);
        } elseif ($approvedPayments > 0 && $remainingBalance > 0) {
            $this->applyPartiallyPaidBookingPayload($booking, $bookingPayload, $userId);
        }

        if ($userId && Schema::hasColumn('bookings', 'updated_by_user_id')) {
            $bookingPayload['updated_by_user_id'] = $userId;
        }

        if (! empty($bookingPayload)) {
            $booking->forceFill($bookingPayload)->save();
        }

        $booking = $booking->fresh(['payments', 'bookingServices.service']);

        try {
            app(BookingService::class)->syncLifecycleStatus($booking);
            $booking = $booking->fresh(['payments', 'bookingServices.service']);
        } catch (\Throwable) {
            // Payment review should not fail just because lifecycle automation is unavailable.
        }

        $this->recordLifecycleEvent(
            booking: $booking,
            userId: $userId,
            description: $eventDescription,
            meta: [
                'total_charges' => $totalCharges,
                'approved_payments' => $approvedPayments,
                'submitted_payments' => $submittedPayments,
                'remaining_balance' => $remainingBalance,
                'required_down_payment_including_bond' => $requiredDownPayment,
                'bond_charge' => $bondCharge,
                'from_booking_status' => $previousBookingStatus,
                'to_booking_status' => $booking?->booking_status,
                'from_payment_status' => $previousPaymentStatus,
                'to_payment_status' => $booking?->payment_status,
            ]
        );
    }

    public function bookingTotalCharges(Booking $booking): float
    {
        return round($this->bookingBaseTotalCharges($booking) + $this->bookingBondCharge($booking), 2);
    }

    private function bookingBaseTotalCharges(Booking $booking): float
    {
        if (isset($booking->totals) && is_array($booking->totals) && isset($booking->totals['items_total'])) {
            return (float) $booking->totals['items_total'];
        }

        $meta = $booking->payment_meta;
        if (is_string($meta)) {
            $decoded = json_decode($meta, true);
            $meta = is_array($decoded) ? $decoded : [];
        }

        if (is_array($meta)) {
            foreach (['total_payable', 'grand_total', 'final_estimated_total', 'estimated_total', 'amount_due', 'items_total'] as $key) {
                if (isset($meta[$key]) && (float) $meta[$key] > 0) {
                    return (float) $meta[$key];
                }
            }
        }

        foreach (['finalized_total', 'total_amount', 'grand_total', 'amount_due', 'estimated_total', 'total_price'] as $column) {
            if (Schema::hasColumn('bookings', $column) && filled($booking->{$column})) {
                return (float) $booking->{$column};
            }
        }

        if (method_exists($booking, 'bookingServices')) {
            try {
                $items = $booking->relationLoaded('bookingServices')
                    ? $booking->bookingServices
                    : $booking->bookingServices()->with('service')->get();

                $sum = 0.0;

                foreach ($items as $item) {
                    foreach (['total', 'amount', 'price', 'subtotal', 'line_total', 'total_amount'] as $column) {
                        if (isset($item->{$column}) && (float) $item->{$column} > 0) {
                            $sum += (float) $item->{$column};
                            continue 2;
                        }
                    }

                    $service = $item->service ?? null;
                    if ($service) {
                        foreach (['price', 'rate', 'amount', 'base_price', 'base_rate'] as $column) {
                            if (isset($service->{$column}) && (float) $service->{$column} > 0) {
                                $sum += (float) $service->{$column} * max(1, (int) ($item->quantity ?? 1));
                                continue 2;
                            }
                        }
                    }
                }

                if ($sum > 0) {
                    return round($sum, 2);
                }
            } catch (\Throwable) {
                return 0;
            }
        }

        return 0;
    }

    public function approvedPaymentTotal(Booking $booking): float
    {
        return $this->paymentTotalByStatuses($booking, [
            'approved',
            'verified',
            'paid',
            'completed',
            'settled',
            'confirmed',
        ]);
    }

    public function submittedPaymentTotal(Booking $booking): float
    {
        return $this->paymentTotalByStatuses($booking, [
            'pending',
            'submitted',
            'for_review',
            'awaiting_review',
            'awaiting review',
        ]);
    }

    private function applyBondPaidPayload(Booking $booking, array &$payload): void
    {
        if (Schema::hasColumn('bookings', 'bond_status') && $this->normalizeStatus($booking->bond_status ?? '') !== 'waived') {
            $payload['bond_status'] = 'paid';
        }

        if (Schema::hasColumn('bookings', 'bond_paid_at') && blank($booking->bond_paid_at)) {
            $payload['bond_paid_at'] = now();
        }
    }

    private function bookingRequiredDownPayment(Booking $booking, float $baseCharges, float $bondCharge, float $totalCharges): float
    {
        $stored = Schema::hasColumn('bookings', 'required_down_payment_amount')
            ? (float) ($booking->required_down_payment_amount ?? 0)
            : 0.0;
        $computed = round(($baseCharges * BcccBookingPolicyCatalog::REQUIRED_DOWN_PAYMENT_RATE) + $bondCharge, 2);

        return min(max($stored, $computed), $totalCharges);
    }

    private function bookingBondCharge(Booking $booking): float
    {
        if (Schema::hasColumn('bookings', 'bond_status') && $this->normalizeStatus($booking->bond_status ?? '') === 'waived') {
            return 0.0;
        }

        $stored = Schema::hasColumn('bookings', 'required_bond_amount')
            ? (float) ($booking->required_bond_amount ?? 0)
            : 0.0;

        if ($stored > 0) {
            return round($stored, 2);
        }

        $meta = $booking->payment_meta;
        if (is_string($meta)) {
            $decoded = json_decode($meta, true);
            $meta = is_array($decoded) ? $decoded : [];
        }

        if (is_array($meta)) {
            foreach (['required_bond', 'bond_amount'] as $key) {
                if (isset($meta[$key]) && (float) $meta[$key] > 0) {
                    return round((float) $meta[$key], 2);
                }
            }
        }

        return BcccBookingPolicyCatalog::REQUIRED_BOND_AMOUNT;
    }

    private function applyFullyPaidBookingPayload(Booking $booking, array &$payload, ?int $userId): void
    {
        if (Schema::hasColumn('bookings', 'payment_balance_due_at')) {
            $payload['payment_balance_due_at'] = null;
        }

        if (Schema::hasColumn('bookings', 'balance_due_at')) {
            $payload['balance_due_at'] = null;
        }

        if (Schema::hasColumn('bookings', 'expired_at')) {
            $payload['expired_at'] = null;
        }

        if (Schema::hasColumn('bookings', 'booking_status')) {
            $currentStatus = $this->normalizeStatus($booking->booking_status ?? '');

            if (in_array($currentStatus, ['pending', 'submitted', 'pencil_booked', 'for_review', 'confirmed', 'awaiting_downpayment', 'awaiting_payment', 'awaiting_balance'], true)) {
                $payload['booking_status'] = 'confirmed';
            }
        }

        if (Schema::hasColumn('bookings', 'confirmed_at') && blank($booking->confirmed_at)) {
            $payload['confirmed_at'] = now();
        }

        if ($userId && Schema::hasColumn('bookings', 'confirmed_by_user_id') && blank($booking->confirmed_by_user_id)) {
            $payload['confirmed_by_user_id'] = $userId;
        }

        if (Schema::hasColumn('bookings', 'is_public_calendar_visible')) {
            $payload['is_public_calendar_visible'] = true;
        }

        if (Schema::hasColumn('bookings', 'public_calendar_title') && blank($booking->public_calendar_title)) {
            $payload['public_calendar_title'] = $booking->type_of_event ?: 'Reserved Event';
        }
    }

    private function applyPartiallyPaidBookingPayload(Booking $booking, array &$payload, ?int $userId): void
    {
        if (Schema::hasColumn('bookings', 'payment_balance_due_at') && blank($booking->payment_balance_due_at)) {
            $payload['payment_balance_due_at'] = app(BookingDeadlineService::class)
                ->addWorkingDays(now(), BookingDeadlineService::BALANCE_DEADLINE_WORKING_DAYS);
        }

        if (Schema::hasColumn('bookings', 'balance_due_at') && blank($booking->balance_due_at)) {
            $payload['balance_due_at'] = $booking->booking_date_from ?: app(BookingDeadlineService::class)
                ->addWorkingDays(now(), BookingDeadlineService::BALANCE_DEADLINE_WORKING_DAYS);
        }

        if (Schema::hasColumn('bookings', 'booking_status')) {
            $currentStatus = $this->normalizeStatus($booking->booking_status ?? '');

            if (in_array($currentStatus, ['pending', 'submitted', 'pencil_booked', 'for_review', 'awaiting_downpayment', 'awaiting_payment'], true)) {
                $payload['booking_status'] = 'confirmed';
            }
        }

        if (Schema::hasColumn('bookings', 'confirmed_at') && blank($booking->confirmed_at)) {
            $payload['confirmed_at'] = now();
        }

        if ($userId && Schema::hasColumn('bookings', 'confirmed_by_user_id') && blank($booking->confirmed_by_user_id)) {
            $payload['confirmed_by_user_id'] = $userId;
        }
    }

    private function paymentTotalByStatuses(Booking $booking, array $statuses): float
    {
        if (! method_exists($booking, 'payments')) {
            return 0;
        }

        try {
            $payments = $booking->relationLoaded('payments')
                ? $booking->payments
                : $booking->payments()->get();

            $normalizedStatuses = array_map(fn (string $value): string => $this->normalizeStatus($value), $statuses);

            return (float) $payments
                ->filter(function ($payment) use ($normalizedStatuses): bool {
                    $status = $this->normalizeStatus((string) ($payment->status ?? $payment->payment_status ?? ''));

                    return in_array($status, $normalizedStatuses, true);
                })
                ->sum(fn ($payment): float => (float) ($payment->amount ?? 0));
        } catch (\Throwable) {
            return 0;
        }
    }

    private function resolveBookingPaymentStatus(
        float $totalCharges,
        float $approvedPayments,
        float $submittedPayments,
        string $currentPaymentStatus
    ): string {
        if ($totalCharges > 0 && $approvedPayments + 0.00001 >= $totalCharges) {
            return 'paid';
        }

        if ($totalCharges <= 0 && $approvedPayments > 0) {
            return 'paid';
        }

        if ($approvedPayments > 0) {
            return 'partial';
        }

        if ($submittedPayments > 0) {
            return 'for_review';
        }

        $normalized = $this->normalizeStatus($currentPaymentStatus);

        if (in_array($normalized, ['expired', 'rejected', 'declined', 'failed'], true)) {
            return $normalized;
        }

        return 'unpaid';
    }

    private function recordLifecycleEvent(
        ?Booking $booking,
        ?int $userId,
        ?string $description,
        array $meta = []
    ): void {
        if (! $booking || ! class_exists(BookingLifecycleEvent::class) || ! Schema::hasTable('booking_lifecycle_events')) {
            return;
        }

        try {
            $payload = [
                'booking_id' => $booking->id,
            ];

            $table = 'booking_lifecycle_events';

            if (Schema::hasColumn($table, 'actor_user_id') && $userId) {
                $payload['actor_user_id'] = $userId;
            }

            if (Schema::hasColumn($table, 'label')) {
                $payload['label'] = 'payment_review';
            }

            if (Schema::hasColumn($table, 'event_key')) {
                $payload['event_key'] = 'payment_review_updated';
            }

            if (Schema::hasColumn($table, 'title')) {
                $payload['title'] = 'Payment Review Updated';
            }

            if (Schema::hasColumn($table, 'description')) {
                $payload['description'] = $description ?: 'Payment review status was updated.';
            }

            if (Schema::hasColumn($table, 'reason')) {
                $payload['reason'] = $description ?: 'Payment review status was updated.';
            }

            if (Schema::hasColumn($table, 'from_payment_status')) {
                $payload['from_payment_status'] = $meta['from_payment_status'] ?? null;
            }

            if (Schema::hasColumn($table, 'to_payment_status')) {
                $payload['to_payment_status'] = $meta['to_payment_status'] ?? ($booking->payment_status ?? null);
            }

            if (Schema::hasColumn($table, 'from_status')) {
                $payload['from_status'] = $meta['from_booking_status'] ?? null;
            }

            if (Schema::hasColumn($table, 'to_status')) {
                $payload['to_status'] = $meta['to_booking_status'] ?? ($booking->booking_status ?? null);
            }

            if (Schema::hasColumn($table, 'from_booking_status')) {
                $payload['from_booking_status'] = $meta['from_booking_status'] ?? null;
            }

            if (Schema::hasColumn($table, 'to_booking_status')) {
                $payload['to_booking_status'] = $meta['to_booking_status'] ?? ($booking->booking_status ?? null);
            }

            if (Schema::hasColumn($table, 'event_at')) {
                $payload['event_at'] = now();
            }

            if (Schema::hasColumn($table, 'user_id') && $userId) {
                $payload['user_id'] = $userId;
            }

            if (Schema::hasColumn($table, 'created_by_user_id') && $userId) {
                $payload['created_by_user_id'] = $userId;
            }

            if (Schema::hasColumn($table, 'meta')) {
                $payload['meta'] = collect($meta)
                    ->filter(fn ($value) => $value !== null && $value !== '' && $value !== [])
                    ->all();
            }

            BookingLifecycleEvent::query()->create($payload);
        } catch (\Throwable) {
            // Do not block payment review if audit logging shape differs.
        }
    }

    private function normalizeStatus(mixed $value): string
    {
        return strtolower(str_replace(['-', ' '], '_', trim((string) $value)));
    }
}
