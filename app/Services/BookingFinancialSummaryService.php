<?php

namespace App\Services;

use App\Models\Booking;
use App\Support\BcccBookingPolicyCatalog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class BookingFinancialSummaryService
{
    private const CONFIRMED_PAYMENT_STATUSES = [
        'paid',
        'success',
        'successful',
        'completed',
        'complete',
        'confirmed',
        'approved',
        'verified',
        'settled',
    ];

    private const PENDING_PAYMENT_STATUSES = [
        'pending',
        'submitted',
        'processing',
        'review',
        'for_review',
        'under_review',
    ];

    private const DECLINED_PAYMENT_STATUSES = [
        'declined',
        'failed',
        'cancelled',
        'canceled',
        'void',
        'rejected',
    ];

    public function summarize(Booking $booking): array
    {
        $baseTotal = $this->resolveBookingTotal($booking);
        $discountTotal = $this->resolveDiscountTotal($booking);
        $baseSubtotal = $this->resolveBookingSubtotal($booking, $baseTotal, $discountTotal);
        $postEventTotal = $this->resolvePostEventChargeTotal($booking);
        $bondAmount = $this->resolveBondAmount($booking);
        $bondCharge = $this->resolveBondCharge($booking, $bondAmount);
        $totalBeforeBond = $baseTotal + $postEventTotal;
        $total = $totalBeforeBond + $bondCharge;
        $payments = $this->resolvePayments($booking);

        $paid = $payments
            ->filter(fn ($payment) => $this->isConfirmedStatus($payment->status ?? null))
            ->sum(fn ($payment) => $this->money($payment->amount ?? 0));

        $pending = $payments
            ->filter(fn ($payment) => $this->isPendingStatus($payment->status ?? null))
            ->sum(fn ($payment) => $this->money($payment->amount ?? 0));

        $declined = $payments
            ->filter(fn ($payment) => $this->isDeclinedStatus($payment->status ?? null))
            ->sum(fn ($payment) => $this->money($payment->amount ?? 0));

        $balance = max($total - $paid, 0);
        $overpaid = max($paid - $total, 0);

        $progress = $total > 0
            ? min(100, round(($paid / $total) * 100, 2))
            : 0;

        $minimumRequired = $this->resolveMinimumRequired($booking, $baseTotal, $bondCharge, $total);
        $minimumDueNow = max($minimumRequired - $paid, 0);

        $status = $this->resolveFinancialStatus(
            total: $total,
            paid: $paid,
            pending: $pending,
            balance: $balance,
            overpaid: $overpaid,
        );

        $chargeBreakdown = $this->chargeBreakdown($booking);

        return [
            'total' => $this->roundMoney($total),
            'base_total' => $this->roundMoney($baseTotal),
            'base_subtotal' => $this->roundMoney($baseSubtotal),
            'discount_total' => $this->roundMoney($discountTotal),
            'post_event_total' => $this->roundMoney($postEventTotal),
            'venue_total_with_post_event' => $this->roundMoney($totalBeforeBond),
            'bond_amount' => $this->roundMoney($bondAmount),
            'bond_charge' => $this->roundMoney($bondCharge),
            'required_bond' => $this->roundMoney($bondAmount),
            'total_with_bond' => $this->roundMoney($total),
            'payment_total_including_bond' => $this->roundMoney($total),
            'paid' => $this->roundMoney($paid),
            'pending' => $this->roundMoney($pending),
            'declined' => $this->roundMoney($declined),
            'balance' => $this->roundMoney($balance),
            'overpaid' => $this->roundMoney($overpaid),
            'minimum_required' => $this->roundMoney($minimumRequired),
            'minimum_due_now' => $this->roundMoney($minimumDueNow),
            'progress' => $progress,
            'status' => $status,
            'status_label' => $this->statusLabel($status),
            'total_label' => $this->peso($total),
            'paid_label' => $this->peso($paid),
            'pending_label' => $this->peso($pending),
            'balance_label' => $this->peso($balance),
            'minimum_required_label' => $this->peso($minimumRequired),
            'minimum_due_now_label' => $this->peso($minimumDueNow),
            'bond_amount_label' => $this->peso($bondAmount),
            'bond_charge_label' => $this->peso($bondCharge),
            'discounts_visible' => (bool) $this->paymentMetaValue($booking, 'discounts_visible', false),
            'discount_note' => (string) $this->paymentMetaValue($booking, 'discount_note', ''),
            'payment_count' => $payments->count(),
            'confirmed_payment_count' => $payments->filter(fn ($payment) => $this->isConfirmedStatus($payment->status ?? null))->count(),
            'pending_payment_count' => $payments->filter(fn ($payment) => $this->isPendingStatus($payment->status ?? null))->count(),
            'declined_payment_count' => $payments->filter(fn ($payment) => $this->isDeclinedStatus($payment->status ?? null))->count(),
            'next_action' => $this->nextAction($status, $balance, $minimumDueNow),
            'charges' => $chargeBreakdown,
            'post_event_charges' => $this->postEventChargeBreakdown($booking),
        ];
    }

    public function syncBookingPaymentStatus(Booking $booking): void
    {
        if (! Schema::hasColumn($booking->getTable(), 'payment_status')) {
            return;
        }

        $summary = $this->summarize($booking);

        $booking->forceFill([
            'payment_status' => $summary['status'],
        ])->saveQuietly();
    }

    private function resolveBookingTotal(Booking $booking): float
    {
        $finalizedTotal = $this->firstMoneyValue($booking, [
            'finalized_total',
        ]);

        if ($finalizedTotal > 0) {
            $discountTotal = $this->resolveDiscountTotal($booking);
            $baseSubtotal = $this->firstMoneyValue($booking, [
                'base_subtotal',
            ]);

            if ($discountTotal > 0 && $baseSubtotal > 0 && $finalizedTotal + 0.00001 >= $baseSubtotal) {
                return max($baseSubtotal - $discountTotal, 0);
            }

            return $finalizedTotal;
        }

        $baseSubtotal = $this->firstMoneyValue($booking, [
            'base_subtotal',
        ]);

        if ($baseSubtotal > 0) {
            return max($baseSubtotal - $this->resolveDiscountTotal($booking), 0);
        }

        $metaTotal = $this->paymentMetaTotal($booking);

        if ($metaTotal > 0) {
            return $metaTotal;
        }

        $directTotal = $this->firstMoneyValue($booking, [
            'grand_total',
            'total_payable',
            'total_amount',
            'estimated_total',
            'amount_due',
            'amount',
            'price',
            'rate',
        ]);

        if ($directTotal > 0) {
            return $directTotal;
        }

        $itemsTotal = $this->resolveBookingItemsTotal($booking) + $this->resolveComputedAddOnTotal($booking);

        if ($itemsTotal > 0) {
            return $itemsTotal;
        }

        $serviceTotal = $this->resolvePrimaryServiceTotal($booking);

        if ($serviceTotal > 0) {
            return $serviceTotal;
        }

        return 0;
    }

    private function paymentMetaTotal(Booking $booking): float
    {
        $meta = $booking->payment_meta;

        if (is_string($meta)) {
            $decoded = json_decode($meta, true);
            $meta = is_array($decoded) ? $decoded : [];
        }

        if (! is_array($meta)) {
            return 0;
        }

        foreach (['final_estimated_total', 'grand_total', 'total_payable', 'total_amount', 'amount_due', 'estimated_total'] as $key) {
            if (array_key_exists($key, $meta)) {
                $value = $this->money($meta[$key]);

                if ($value > 0) {
                    $hiddenDiscount = $this->money($meta['hidden_discount_preview'] ?? 0);

                    if ($key === 'estimated_total' && $hiddenDiscount > 0) {
                        return max($value - $hiddenDiscount, 0);
                    }

                    return $value;
                }
            }
        }

        $base = $this->money($meta['estimated_base_total'] ?? $meta['gross_total'] ?? 0);
        $discount = $this->money($meta['hidden_discount_preview'] ?? $meta['discount_total'] ?? 0);

        if ($base > 0) {
            return max($base - $discount, 0);
        }

        return 0;
    }

    private function resolveBookingSubtotal(Booking $booking, float $baseTotal, float $discountTotal): float
    {
        $stored = $this->firstMoneyValue($booking, [
            'base_subtotal',
        ]);

        if ($stored > 0) {
            return $stored;
        }

        $meta = $this->paymentMetaArray($booking);

        foreach (['estimated_base_total', 'gross_total', 'base_venue_total'] as $key) {
            $value = $this->money($meta[$key] ?? 0);

            if ($value > 0) {
                return $value;
            }
        }

        return $baseTotal + $discountTotal;
    }

    private function resolveDiscountTotal(Booking $booking): float
    {
        $stored = $this->firstMoneyValue($booking, [
            'discount_total',
        ]);

        if ($stored > 0) {
            return $stored;
        }

        $meta = $this->paymentMetaArray($booking);

        foreach (['discount_total', 'hidden_discount_preview'] as $key) {
            $value = $this->money($meta[$key] ?? 0);

            if ($value > 0) {
                return $value;
            }
        }

        return 0.0;
    }


    private function resolvePostEventChargeTotal(Booking $booking): float
    {
        return collect($this->resolvePostEventCharges($booking))
            ->filter(fn ($charge) => ! in_array($this->normalizeStatus($charge->status ?? null), ['void', 'waived', 'cancelled', 'canceled'], true))
            ->sum(fn ($charge) => $this->money($charge->amount ?? 0));
    }

    private function resolvePostEventCharges(Booking $booking): Collection
    {
        if (! method_exists($booking, 'postEventCharges')) {
            return collect();
        }

        return $booking->relationLoaded('postEventCharges')
            ? $booking->getRelation('postEventCharges')
            : $booking->postEventCharges()->latest()->get();
    }

    private function resolveBookingItemsTotal(Booking $booking): float
    {
        if (! method_exists($booking, 'bookingServices')) {
            return 0;
        }

        $items = $booking->relationLoaded('bookingServices')
            ? $booking->getRelation('bookingServices')
            : $booking->bookingServices()->with('service')->get();

        return $items->sum(function ($item) {
            $direct = $this->firstMoneyValue($item, [
                'line_total',
                'total_amount',
                'subtotal',
                'amount',
                'price',
                'rate',
            ]);

            if ($direct > 0) {
                return $direct;
            }

            $service = $item->relationLoaded('service') ? $item->getRelation('service') : ($item->service ?? null);

            if (! $service) {
                return 0;
            }

            $serviceRate = $this->firstMoneyValue($service, [
                'price',
                'rate',
                'amount',
                'base_price',
                'base_rate',
            ]);

            $quantity = $this->firstNumericValue($item, [
                'quantity',
                'qty',
                'units',
                'hours',
                'days',
            ]);

            return $serviceRate * max($quantity, 1);
        });
    }

    private function resolveComputedAddOnTotal(Booking $booking): float
    {
        $total = 0.0;

        if ($this->modelHasColumn($booking, 'dressing_room_charge')) {
            $total += $this->money($booking->getAttribute('dressing_room_charge'));
        }

        return $total;
    }

    private function chargeBreakdown(Booking $booking): array
    {
        $charges = [];
        $meta = $this->paymentMetaArray($booking);

        foreach ((array) ($meta['line_items'] ?? []) as $line) {
            if (! is_array($line)) {
                continue;
            }

            $amount = $this->money($line['amount'] ?? 0);

            if ($amount <= 0) {
                continue;
            }

            $charges[] = [
                'key' => (string) ($line['type'] ?? 'venue'),
                'label' => (string) ($line['label'] ?? 'Venue charge'),
                'amount' => $this->roundMoney($amount),
                'amount_label' => $this->peso($amount),
                'source' => 'active_bccc_catalog',
                'date' => $line['date'] ?? null,
                'duration_label' => $line['duration_label'] ?? null,
                'quantity' => $line['quantity'] ?? 1,
            ];
        }

        if ((bool) ($meta['discounts_visible'] ?? false)) {
            foreach ((array) ($meta['discount_lines'] ?? []) as $line) {
                if (! is_array($line)) {
                    continue;
                }

                $amount = $this->money($line['amount'] ?? 0);

                if ($amount <= 0) {
                    continue;
                }

                $charges[] = [
                    'key' => (string) ($line['key'] ?? 'discount'),
                    'label' => (string) ($line['label'] ?? 'Discount'),
                    'amount' => -1 * $this->roundMoney($amount),
                    'amount_label' => '-' . $this->peso($amount),
                    'source' => 'final_computation_discount',
                ];
            }
        }

        return $charges;
    }


    private function postEventChargeBreakdown(Booking $booking): array
    {
        return $this->resolvePostEventCharges($booking)
            ->filter(fn ($charge) => ! in_array($this->normalizeStatus($charge->status ?? null), ['void', 'waived', 'cancelled', 'canceled'], true))
            ->map(fn ($charge) => [
                'id' => $charge->id ?? null,
                'key' => 'post_event_charge',
                'label' => (string) ($charge->label ?? 'Post-event charge'),
                'category' => (string) ($charge->category ?? 'post_event'),
                'status' => (string) ($charge->status ?? 'assessed'),
                'amount' => $this->roundMoney($this->money($charge->amount ?? 0)),
                'amount_label' => $this->peso($this->money($charge->amount ?? 0)),
                'notes' => (string) ($charge->notes ?? ''),
            ])
            ->values()
            ->all();
    }

    private function resolvePrimaryServiceTotal(Booking $booking): float
    {
        if (! method_exists($booking, 'service')) {
            return 0;
        }

        $service = $booking->relationLoaded('service')
            ? $booking->getRelation('service')
            : $booking->service;

        if (! $service) {
            return 0;
        }

        return $this->firstMoneyValue($service, [
            'price',
            'rate',
            'amount',
            'base_price',
            'base_rate',
            'whole_day_rate',
            'half_day_rate',
        ]);
    }

    private function resolveMinimumRequired(Booking $booking, float $baseTotal, float $bondCharge, float $total): float
    {
        $direct = $this->firstMoneyValue($booking, [
            'minimum_payment',
            'required_downpayment',
            'downpayment_amount',
            'deposit_amount',
        ]);

        $computed = $baseTotal > 0
            ? round(($baseTotal * BcccBookingPolicyCatalog::REQUIRED_DOWN_PAYMENT_RATE) + $bondCharge, 2)
            : round($bondCharge, 2);

        if ($direct > 0) {
            return min(max($direct, $computed), $total);
        }

        return min($computed, $total);
    }

    private function resolveBondAmount(Booking $booking): float
    {
        $stored = $this->firstMoneyValue($booking, ['required_bond_amount']);
        $metaBond = $this->paymentMetaNumber($booking, 'required_bond') ?: $this->paymentMetaNumber($booking, 'bond_amount');

        return $stored > 0 ? $stored : ($metaBond > 0 ? $metaBond : BcccBookingPolicyCatalog::REQUIRED_BOND_AMOUNT);
    }

    private function resolveBondCharge(Booking $booking, float $bondAmount): float
    {
        $status = $this->normalizeStatus($booking->bond_status ?? null);

        return $status === 'waived' ? 0.0 : $this->roundMoney($bondAmount);
    }

    private function resolvePayments(Booking $booking): Collection
    {
        if (! method_exists($booking, 'payments')) {
            return collect();
        }

        return $booking->relationLoaded('payments')
            ? $booking->getRelation('payments')
            : $booking->payments()->latest()->get();
    }

    private function resolveFinancialStatus(
        float $total,
        float $paid,
        float $pending,
        float $balance,
        float $overpaid,
    ): string {
        if ($total <= 0 && $paid <= 0 && $pending <= 0) {
            return 'unpriced';
        }

        if ($overpaid > 0) {
            return 'overpaid';
        }

        if ($total > 0 && $paid >= $total) {
            return 'paid';
        }

        if ($paid > 0 && $balance > 0) {
            return 'partial';
        }

        if ($paid <= 0 && $pending > 0) {
            return 'pending';
        }

        return 'unpaid';
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'paid' => 'Fully Paid',
            'partial' => 'Partially Paid',
            'pending' => 'Payment Under Review',
            'overpaid' => 'Overpaid',
            'unpriced' => 'Awaiting Computation',
            default => 'Unpaid',
        };
    }

    private function nextAction(string $status, float $balance, float $minimumDueNow): string
    {
        return match ($status) {
            'paid' => 'No remaining balance. The payment is complete.',
            'partial' => $minimumDueNow > 0
                ? 'Minimum payment is not yet complete. Please settle the required amount.'
                : 'Minimum payment is complete. Remaining balance may still be settled.',
            'pending' => 'Payment has been submitted and is waiting for review.',
            'overpaid' => 'Payment exceeded the computed total. Please verify the amount.',
            'unpriced' => 'The total amount has not been computed yet.',
            default => $balance > 0
                ? 'No confirmed payment yet. Please submit payment to continue.'
                : 'Please wait for payment review.',
        };
    }

    private function isConfirmedStatus(?string $status): bool
    {
        return in_array(strtolower((string) $status), self::CONFIRMED_PAYMENT_STATUSES, true);
    }

    private function isPendingStatus(?string $status): bool
    {
        return in_array(strtolower((string) $status), self::PENDING_PAYMENT_STATUSES, true);
    }

    private function isDeclinedStatus(?string $status): bool
    {
        return in_array(strtolower((string) $status), self::DECLINED_PAYMENT_STATUSES, true);
    }

    private function firstMoneyValue(Model $model, array $columns): float
    {
        foreach ($columns as $column) {
            if (! $this->modelHasColumn($model, $column)) {
                continue;
            }

            $value = $this->money($model->getAttribute($column));

            if ($value > 0) {
                return $value;
            }
        }

        return 0;
    }

    private function firstNumericValue(Model $model, array $columns): float
    {
        foreach ($columns as $column) {
            if (! $this->modelHasColumn($model, $column)) {
                continue;
            }

            $value = $this->money($model->getAttribute($column));

            if ($value > 0) {
                return $value;
            }
        }

        return 1;
    }

    private function modelHasColumn(Model $model, string $column): bool
    {
        return Schema::hasColumn($model->getTable(), $column);
    }


    private function paymentMetaArray(Booking $booking): array
    {
        $meta = $booking->payment_meta;

        if (is_string($meta)) {
            $decoded = json_decode($meta, true);
            $meta = is_array($decoded) ? $decoded : [];
        }

        return is_array($meta) ? $meta : [];
    }

    private function paymentMetaValue(Booking $booking, string $key, mixed $default = null): mixed
    {
        $meta = $this->paymentMetaArray($booking);

        return array_key_exists($key, $meta) ? $meta[$key] : $default;
    }

    private function paymentMetaNumber(Booking $booking, string $key): float
    {
        return $this->money($this->paymentMetaValue($booking, $key, 0));
    }


    private function normalizeStatus(?string $status): string
    {
        return strtolower(str_replace(['-', ' '], '_', trim((string) $status)));
    }

    private function money(mixed $value): float
    {
        if ($value === null || $value === '') {
            return 0;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        $clean = preg_replace('/[^0-9.\-]/', '', (string) $value);

        if ($clean === '' || ! is_numeric($clean)) {
            return 0;
        }

        return (float) $clean;
    }

    private function roundMoney(float $value): float
    {
        return round($value, 2);
    }

    private function peso(float $value): string
    {
        return '₱' . number_format($value, 2);
    }
}
