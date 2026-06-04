<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingPostEventCharge;
use App\Support\BcccBookingPolicyCatalog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BookingBillingService
{
    public function __construct(
        private readonly BookingFinancialSummaryService $financialSummary,
        private readonly BookingPricingService $pricing,
    )
    {
    }

    public function summarize(Booking $booking): array
    {
        $booking->loadMissing(['payments', 'bookingServices.service', 'scheduleSegments', 'postEventCharges']);

        $financial = $this->financialSummary->summarize($booking);
        $pricing = $this->safeFinalPricing($booking);
        $discountTotal = $this->resolveDiscountTotal($booking, $pricing, $financial);
        $baseSubtotal = $this->resolveBaseSubtotal($booking, $pricing, $financial, $discountTotal);
        $baseTotal = $this->resolveBaseTotal($booking, $pricing, $financial, $baseSubtotal, $discountTotal);
        $postEventTotal = $booking->postEventCharges
            ->filter(fn (BookingPostEventCharge $charge): bool => ! in_array($this->normalize($charge->status), ['void', 'waived', 'cancelled', 'canceled'], true))
            ->sum(fn (BookingPostEventCharge $charge): float => $this->money($charge->amount));

        $venueTotalWithPostEvent = $baseTotal + $postEventTotal;
        $paid = $this->money($financial['paid'] ?? 0);
        $pending = $this->money($financial['pending'] ?? 0);
        $requiredBond = $this->resolveRequiredBond($booking);
        $bondCharge = $this->resolveChargeableBond($booking, $requiredBond);
        $totalWithBond = $venueTotalWithPostEvent + $bondCharge;
        $requiredDownPayment = $this->resolveRequiredDownPayment($booking, $baseTotal, $bondCharge);
        $bondPaid = $this->isBondPaid($booking, $paid, $requiredDownPayment, $totalWithBond, $bondCharge);
        $bondStatus = $bondPaid ? ($this->normalize($booking->bond_status) === 'waived' ? 'waived' : 'paid') : (string) ($booking->bond_status ?: 'pending');
        $this->syncBondStatusIfPaid($booking, $bondPaid);
        $finalComputationStatus = $this->syncFinalComputationStatus($booking);
        $balance = max($totalWithBond - $paid, 0);

        return [
            'base_total' => $this->roundMoney($baseTotal),
            'venue_total' => $this->roundMoney($baseTotal),
            'base_subtotal' => $this->roundMoney($baseSubtotal),
            'discount_total' => $this->roundMoney($discountTotal),
            'post_event_total' => $this->roundMoney($postEventTotal),
            'venue_total_with_post_event' => $this->roundMoney($venueTotalWithPostEvent),
            'bond_charge' => $this->roundMoney($bondCharge),
            'total_with_bond' => $this->roundMoney($totalWithBond),
            'payment_total_including_bond' => $this->roundMoney($totalWithBond),
            'total_with_post_event' => $this->roundMoney($totalWithBond),
            'paid' => $this->roundMoney($paid),
            'pending' => $this->roundMoney($pending),
            'balance' => $this->roundMoney($balance),
            'required_down_payment' => $this->roundMoney($requiredDownPayment),
            'base_required_down_payment' => $this->roundMoney(max(0, $requiredDownPayment - $bondCharge)),
            'required_bond' => $this->roundMoney($requiredBond),
            'bond_status' => $bondStatus,
            'bond_paid' => $bondPaid,
            'down_payment_paid' => $paid >= $requiredDownPayment && $requiredDownPayment > 0,
            'confirmation_ready' => $paid >= $requiredDownPayment && $requiredDownPayment > 0,
            'balance_due_at' => optional($booking->balance_due_at)->toIso8601String(),
            'down_payment_due_at' => optional($booking->down_payment_due_at)->toIso8601String(),
            'final_computation_locked_at' => optional($booking->final_computation_locked_at)->toIso8601String(),
            'final_computation_status' => $finalComputationStatus['status'],
            'final_computation_status_label' => $finalComputationStatus['label'],
            'final_computation_display_label' => $finalComputationStatus['label'],
            'final_computation_finalized_at' => $finalComputationStatus['finalized_at'],
            'final_computation_meta' => is_array($booking->final_computation_meta ?? null) ? $booking->final_computation_meta : [],
            'policy' => [
                'active_charge_scope' => BcccBookingPolicyCatalog::ACTIVE_CHARGE_SCOPE,
                'discount_privacy' => 'Discounts are only shown on final computation and internal billing review.',
                'excluded_charges' => BcccBookingPolicyCatalog::excludedUserCharges(),
            ],
        ];
    }

    public function lockFinalComputation(Booking $booking, ?int $userId = null, ?string $notes = null): Booking
    {
        return DB::transaction(function () use ($booking, $userId, $notes): Booking {
            $booking->loadMissing(['payments', 'bookingServices.service', 'scheduleSegments', 'postEventCharges']);

            $financial = $this->financialSummary->summarize($booking);
            $pricing = $this->safeFinalPricing($booking);
            $discountTotal = $this->resolveDiscountTotal($booking, $pricing, $financial);
            $baseSubtotal = $this->resolveBaseSubtotal($booking, $pricing, $financial, $discountTotal);
            $baseTotal = $this->resolveBaseTotal($booking, $pricing, $financial, $baseSubtotal, $discountTotal);
            $requiredBond = BcccBookingPolicyCatalog::REQUIRED_BOND_AMOUNT;
            $bondCharge = $this->resolveChargeableBond($booking, $requiredBond);
            $requiredDownPayment = $this->resolveRequiredDownPayment($booking, $baseTotal, $bondCharge);
            $totalWithBond = $baseTotal + $bondCharge;

            $payload = [];

            if (Schema::hasColumn('bookings', 'base_subtotal')) {
                $payload['base_subtotal'] = $baseSubtotal;
            }

            if (Schema::hasColumn('bookings', 'discount_total')) {
                $payload['discount_total'] = $discountTotal;
            }

            if (Schema::hasColumn('bookings', 'finalized_total')) {
                $payload['finalized_total'] = $baseTotal;
            }

            if (Schema::hasColumn('bookings', 'required_down_payment_amount')) {
                $payload['required_down_payment_amount'] = $requiredDownPayment;
            }

            if (Schema::hasColumn('bookings', 'required_bond_amount')) {
                $payload['required_bond_amount'] = $requiredBond;
            }

            if (Schema::hasColumn('bookings', 'final_computation_locked_at')) {
                $payload['final_computation_locked_at'] = now();
            }

            if (Schema::hasColumn('bookings', 'final_computation_status')) {
                $payload['final_computation_status'] = 'locked';
            }

            if ($userId && Schema::hasColumn('bookings', 'final_computation_locked_by_user_id')) {
                $payload['final_computation_locked_by_user_id'] = $userId;
            }

            if (Schema::hasColumn('bookings', 'final_computation_meta')) {
                $payload['final_computation_meta'] = [
                    'source' => 'admin_finalization',
                    'locked_by_user_id' => $userId,
                    'locked_at' => now()->toIso8601String(),
                    'active_charge_scope' => BcccBookingPolicyCatalog::ACTIVE_CHARGE_SCOPE,
                    'discounts_visible' => true,
                    'discounts_visible_only_on_final_review' => true,
                    'line_items' => $pricing['line_items'] ?? [],
                    'discount_lines' => $pricing['discount_lines'] ?? [],
                    'base_subtotal' => $baseSubtotal,
                    'discount_total' => $discountTotal,
                    'finalized_total' => $baseTotal,
                    'required_bond' => $requiredBond,
                    'bond_charge' => $bondCharge,
                    'required_down_payment' => $requiredDownPayment,
                    'payment_total_including_bond' => $totalWithBond,
                    'total_with_bond' => $totalWithBond,
                    'financial_summary' => $financial,
                ];
            }

            if ($notes !== null && Schema::hasColumn('bookings', 'billing_notes')) {
                $payload['billing_notes'] = trim($notes) ?: null;
            }

            $booking->forceFill($payload)->save();

            return $booking->fresh(['payments', 'bookingServices.service', 'postEventCharges']);
        });
    }

    public function updateBilling(Booking $booking, array $data, ?int $userId = null): Booking
    {
        return DB::transaction(function () use ($booking, $data, $userId): Booking {
            $payload = [];

            foreach ([
                'base_subtotal',
                'discount_total',
                'finalized_total',
                'required_down_payment_amount',
                'required_bond_amount',
                'bond_status',
                'bond_waiver_reason',
                'billing_notes',
            ] as $column) {
                if (array_key_exists($column, $data) && Schema::hasColumn('bookings', $column)) {
                    $payload[$column] = is_string($data[$column]) ? trim($data[$column]) : $data[$column];
                }
            }

            $baseSubtotal = $this->money($payload['base_subtotal'] ?? $booking->base_subtotal ?? 0);
            $discountTotal = $this->money($payload['discount_total'] ?? $booking->discount_total ?? 0);
            $incomingFinalTotal = array_key_exists('finalized_total', $payload)
                ? $this->money($payload['finalized_total'])
                : 0.0;
            $autoAdjustedFinalTotal = false;

            if ($baseSubtotal > 0 && $discountTotal > 0 && ($incomingFinalTotal <= 0 || $incomingFinalTotal + 0.00001 >= $baseSubtotal)) {
                $payload['finalized_total'] = max($baseSubtotal - $discountTotal, 0);
                $autoAdjustedFinalTotal = true;
            }

            if ($autoAdjustedFinalTotal && Schema::hasColumn('bookings', 'required_down_payment_amount')) {
                $requiredBond = $this->resolveChargeableBond($booking, $this->resolveRequiredBond($booking));
                $payload['required_down_payment_amount'] = $this->roundMoney(
                    ($this->money($payload['finalized_total']) * BcccBookingPolicyCatalog::REQUIRED_DOWN_PAYMENT_RATE) + $requiredBond
                );
            }

            $bondStatus = $this->normalize($payload['bond_status'] ?? $booking->bond_status ?? 'pending');

            if (Schema::hasColumn('bookings', 'bond_paid_at') && in_array($bondStatus, ['paid', 'posted', 'settled'], true)) {
                $payload['bond_paid_at'] = $booking->bond_paid_at ?: now();
            }

            if (Schema::hasColumn('bookings', 'bond_waived_at') && $bondStatus === 'waived') {
                $payload['bond_waived_at'] = $booking->bond_waived_at ?: now();
            }

            if ((bool) ($data['lock_final_computation'] ?? false)) {
                $booking->forceFill($payload)->save();
                return $this->lockFinalComputation($booking->fresh(), $userId, $data['billing_notes'] ?? null);
            }

            if (! empty($payload)) {
                $booking->forceFill($payload)->save();
            }

            return $booking->fresh(['payments', 'bookingServices.service', 'postEventCharges']);
        });
    }

    public function createPostEventCharge(Booking $booking, array $data, ?int $userId = null): BookingPostEventCharge
    {
        return $booking->postEventCharges()->create([
            'category' => $this->normalize($data['category'] ?? 'post_event'),
            'label' => trim((string) $data['label']),
            'amount' => $this->roundMoney($this->money($data['amount'] ?? 0)),
            'status' => $this->normalize($data['status'] ?? 'assessed'),
            'notes' => trim((string) ($data['notes'] ?? '')) ?: null,
            'assessed_at' => now(),
            'assessed_by_user_id' => $userId,
        ]);
    }

    public function updatePostEventCharge(BookingPostEventCharge $charge, array $data): BookingPostEventCharge
    {
        $charge->update([
            'category' => $this->normalize($data['category'] ?? $charge->category ?? 'post_event'),
            'label' => trim((string) ($data['label'] ?? $charge->label)),
            'amount' => $this->roundMoney($this->money($data['amount'] ?? $charge->amount ?? 0)),
            'status' => $this->normalize($data['status'] ?? $charge->status ?? 'assessed'),
            'notes' => array_key_exists('notes', $data) ? (trim((string) $data['notes']) ?: null) : $charge->notes,
        ]);

        return $charge->fresh();
    }

    public function deletePostEventCharge(BookingPostEventCharge $charge): void
    {
        $charge->delete();
    }

    private function resolveRequiredDownPayment(Booking $booking, float $baseTotal, float $bondCharge = 0.0): float
    {
        $stored = $this->money($booking->required_down_payment_amount ?? 0);
        $computed = $baseTotal > 0
            ? round(($baseTotal * BcccBookingPolicyCatalog::REQUIRED_DOWN_PAYMENT_RATE) + $bondCharge, 2)
            : round($bondCharge, 2);

        return max($stored, $computed);
    }

    private function resolveRequiredBond(Booking $booking): float
    {
        $stored = $this->money($booking->required_bond_amount ?? 0);

        return $stored > 0 ? $stored : BcccBookingPolicyCatalog::REQUIRED_BOND_AMOUNT;
    }

    private function resolveChargeableBond(Booking $booking, ?float $requiredBond = null): float
    {
        if ($this->normalize($booking->bond_status) === 'waived') {
            return 0.0;
        }

        return $this->roundMoney($requiredBond ?? $this->resolveRequiredBond($booking));
    }

    private function isBondPaid(Booking $booking, float $paid, float $requiredDownPayment, float $totalWithBond, float $bondCharge): bool
    {
        if ($bondCharge <= 0) {
            return true;
        }

        if (in_array($this->normalize($booking->bond_status), ['paid', 'posted', 'settled', 'waived'], true)) {
            return true;
        }

        $threshold = min($totalWithBond, max($requiredDownPayment, $bondCharge));

        return $threshold > 0 && $paid + 0.00001 >= $threshold;
    }

    private function syncBondStatusIfPaid(Booking $booking, bool $bondPaid, ?int $userId = null): void
    {
        if (! $bondPaid || $this->normalize($booking->bond_status) === 'waived' || ! Schema::hasColumn('bookings', 'bond_status')) {
            return;
        }

        if (in_array($this->normalize($booking->bond_status), ['paid', 'posted', 'settled'], true)) {
            return;
        }

        $payload = ['bond_status' => 'paid'];

        if (Schema::hasColumn('bookings', 'bond_paid_at')) {
            $payload['bond_paid_at'] = $booking->bond_paid_at ?: now();
        }

        if ($userId && Schema::hasColumn('bookings', 'updated_by_user_id')) {
            $payload['updated_by_user_id'] = $userId;
        }

        $booking->forceFill($payload)->saveQuietly();
        $booking->forceFill($payload);
    }

    public function syncFinalComputationStatus(Booking $booking): array
    {
        $lockedAt = $booking->final_computation_locked_at;
        $storedStatus = Schema::hasColumn('bookings', 'final_computation_status')
            ? $this->normalize($booking->final_computation_status ?? '')
            : '';
        $finalizedAt = Schema::hasColumn('bookings', 'final_computation_finalized_at')
            ? $booking->final_computation_finalized_at
            : null;

        if (! $lockedAt) {
            return [
                'status' => 'not_locked',
                'label' => 'Not Locked',
                'finalized_at' => optional($finalizedAt)->toIso8601String(),
            ];
        }

        if ($storedStatus === 'finalized' || $finalizedAt) {
            return [
                'status' => 'finalized',
                'label' => 'Finalized',
                'finalized_at' => optional($finalizedAt ?: $lockedAt)->toIso8601String(),
            ];
        }

        $completedAt = $this->completedAt($booking);
        $hasPostEventCharges = $this->hasActivePostEventCharges($booking);
        $eligibleAt = $completedAt?->copy()->addHours(BcccBookingPolicyCatalog::FINAL_COMPUTATION_AUTO_FINALIZE_GRACE_HOURS);

        if ($completedAt && ! $hasPostEventCharges && $eligibleAt?->lte(now())) {
            $payload = [];

            if (Schema::hasColumn('bookings', 'final_computation_status')) {
                $payload['final_computation_status'] = 'finalized';
            }

            if (Schema::hasColumn('bookings', 'final_computation_finalized_at')) {
                $payload['final_computation_finalized_at'] = now();
            }

            if (! empty($payload)) {
                $booking->forceFill($payload)->saveQuietly();
                $booking->forceFill($payload);
            }

            return [
                'status' => 'finalized',
                'label' => 'Finalized',
                'finalized_at' => optional($payload['final_computation_finalized_at'] ?? now())->toIso8601String(),
            ];
        }

        return [
            'status' => 'locked',
            'label' => 'Final Computation Locked',
            'finalized_at' => optional($finalizedAt)->toIso8601String(),
        ];
    }

    private function completedAt(Booking $booking): ?Carbon
    {
        $status = $this->normalize($booking->booking_status ?? '');

        foreach (['completed_at', 'actual_ended_at', 'event_completed_at'] as $column) {
            if (Schema::hasColumn('bookings', $column) && filled($booking->{$column})) {
                return Carbon::parse($booking->{$column});
            }
        }

        if (in_array($status, ['completed', 'approved', 'confirmed', 'active'], true) && $booking->booking_date_to) {
            $end = Carbon::parse($booking->booking_date_to);

            return $end->lte(now()) ? $end : null;
        }

        return null;
    }

    private function hasActivePostEventCharges(Booking $booking): bool
    {
        $charges = $booking->relationLoaded('postEventCharges')
            ? $booking->postEventCharges
            : $booking->postEventCharges()->get();

        return $charges
            ->filter(fn (BookingPostEventCharge $charge): bool => ! in_array($this->normalize($charge->status), ['void', 'waived', 'cancelled', 'canceled'], true))
            ->isNotEmpty();
    }

    private function safeFinalPricing(Booking $booking): array
    {
        try {
            return $this->pricing->fromBooking($booking, true);
        } catch (\Throwable) {
            return [];
        }
    }

    private function resolveDiscountTotal(Booking $booking, array $pricing, array $financial): float
    {
        $stored = $this->money($booking->discount_total ?? 0);

        if ($stored > 0) {
            return $stored;
        }

        foreach ([
            $pricing['discount_total'] ?? null,
            $financial['discount_total'] ?? null,
            data_get($booking->payment_meta, 'hidden_discount_preview'),
            data_get($booking->payment_meta, 'discount_total'),
        ] as $value) {
            $amount = $this->money($value);

            if ($amount > 0) {
                return $amount;
            }
        }

        return 0.0;
    }

    private function resolveBaseSubtotal(Booking $booking, array $pricing, array $financial, float $discountTotal): float
    {
        $stored = $this->money($booking->base_subtotal ?? 0);
        $pricingGross = $this->money($pricing['gross_total'] ?? 0);

        if ($pricingGross > 0 && (! $booking->final_computation_locked_at || $stored <= 0)) {
            return $pricingGross;
        }

        if ($stored > 0) {
            return $stored;
        }

        if ($pricingGross > 0) {
            return $pricingGross;
        }

        foreach ([
            $financial['base_subtotal'] ?? null,
            data_get($booking->payment_meta, 'estimated_base_total'),
        ] as $value) {
            $amount = $this->money($value);

            if ($amount > 0) {
                return $amount;
            }
        }

        $net = $this->money($pricing['grand_total'] ?? $financial['base_total'] ?? $financial['total'] ?? $booking->finalized_total ?? 0);

        return $net > 0 ? $net + $discountTotal : 0.0;
    }

    private function resolveBaseTotal(Booking $booking, array $pricing, array $financial, float $baseSubtotal, float $discountTotal): float
    {
        $stored = $this->money($booking->finalized_total ?? 0);

        if ($stored > 0 && ! ($discountTotal > 0 && $baseSubtotal > 0 && $stored + 0.00001 >= $baseSubtotal)) {
            return $stored;
        }

        foreach ([
            $pricing['grand_total'] ?? null,
            $pricing['estimated_total'] ?? null,
            $financial['base_total'] ?? null,
            $financial['total'] ?? null,
        ] as $value) {
            $amount = $this->money($value);

            if ($amount > 0) {
                return $amount;
            }
        }

        return max($baseSubtotal - $discountTotal, 0);
    }

    private function normalize(?string $value): string
    {
        $clean = strtolower(trim((string) $value));
        $clean = preg_replace('/[^a-z0-9]+/', '_', $clean) ?: '';

        return trim($clean, '_') ?: 'pending';
    }

    private function money(mixed $value): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        $clean = preg_replace('/[^0-9.\-]/', '', (string) $value);

        return $clean !== '' && is_numeric($clean) ? (float) $clean : 0.0;
    }

    private function roundMoney(float $value): float
    {
        return round($value, 2);
    }
}
