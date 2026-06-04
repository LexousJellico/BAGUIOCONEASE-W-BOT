<?php

namespace App\Support;

final class BookingStatusCatalog
{
    /** @var array<int, string> */
    public const BOOKING_STATUSES = [
        'draft',
        'submitted',
        'pencil_booked',
        'pending',
        'for_review',
        'awaiting_downpayment',
        'approved',
        'confirmed',
        'awaiting_balance',
        'active',
        'completed',
        'cancelled',
        'declined',
        'expired',
        'archived',
    ];

    /** @var array<int, string> */
    public const BOOKING_PAYMENT_STATUSES = [
        'unpaid',
        'pending',
        'for_review',
        'awaiting_downpayment',
        'partial',
        'paid',
        'awaiting_balance',
        'bond_due',
        'owing',
        'expired',
        'rejected',
        'declined',
        'failed',
        'refunded',
        'unpriced',
        'overpaid',
    ];

    /** @var array<int, string> */
    public const PAYMENT_PROOF_STATUSES = [
        'pending',
        'submitted',
        'for_review',
        'approved',
        'verified',
        'confirmed',
        'paid',
        'completed',
        'settled',
        'partial',
        'rejected',
        'declined',
        'failed',
        'refunded',
        'cancelled',
        'canceled',
        'void',
    ];

    /** @var array<string, string> */
    private const BOOKING_ALIASES = [
        '' => 'pending',
        'pencil booked' => 'pencil_booked',
        'pencil-booked' => 'pencil_booked',
        'pencil' => 'pencil_booked',
        'submitted' => 'submitted',
        'awaiting downpayment' => 'awaiting_downpayment',
        'awaiting_downpayment' => 'awaiting_downpayment',
        'awaiting balance' => 'awaiting_balance',
        'awaiting_balance' => 'awaiting_balance',
        'under review' => 'for_review',
        'under_review' => 'for_review',
        'for review' => 'for_review',
        'awaiting review' => 'for_review',
        'awaiting_review' => 'for_review',
        'approve' => 'approved',
        'approved' => 'approved',
        'cancelled' => 'cancelled',
        'canceled' => 'cancelled',
        'cancel' => 'cancelled',
        'decline' => 'declined',
        'rejected' => 'declined',
        'reject' => 'declined',
        'expired' => 'expired',
        'done' => 'completed',
        'complete' => 'completed',
    ];

    /** @var array<string, string> */
    private const BOOKING_PAYMENT_ALIASES = [
        '' => 'unpaid',
        'none' => 'unpaid',
        'no_payment' => 'unpaid',
        'no payment' => 'unpaid',
        'awaiting_payment' => 'unpaid',
        'awaiting payment' => 'unpaid',
        'awaiting_downpayment' => 'awaiting_downpayment',
        'awaiting downpayment' => 'awaiting_downpayment',
        'awaiting_balance' => 'awaiting_balance',
        'awaiting balance' => 'awaiting_balance',
        'bond due' => 'bond_due',
        'bond_due' => 'bond_due',
        'submitted' => 'for_review',
        'review' => 'for_review',
        'under_review' => 'for_review',
        'under review' => 'for_review',
        'for review' => 'for_review',
        'awaiting_review' => 'for_review',
        'awaiting review' => 'for_review',
        'partially_paid' => 'partial',
        'partially paid' => 'partial',
        'downpayment_paid' => 'partial',
        'down_payment_paid' => 'partial',
        'down payment paid' => 'partial',
        'balance_pending' => 'owing',
        'for_balance' => 'owing',
        'settled' => 'paid',
        'completed' => 'paid',
        'complete' => 'paid',
        'verified' => 'paid',
        'confirmed' => 'paid',
        'approved' => 'paid',
        'rejected' => 'rejected',
        'decline' => 'declined',
        'cancelled' => 'declined',
        'canceled' => 'declined',
    ];

    /** @var array<string, string> */
    private const PAYMENT_PROOF_ALIASES = [
        '' => 'pending',
        'review' => 'for_review',
        'under_review' => 'for_review',
        'under review' => 'for_review',
        'for review' => 'for_review',
        'awaiting_review' => 'for_review',
        'awaiting review' => 'for_review',
        'success' => 'approved',
        'successful' => 'approved',
        'approve' => 'approved',
        'verified' => 'approved',
        'confirmed' => 'approved',
        'paid' => 'approved',
        'completed' => 'approved',
        'complete' => 'approved',
        'settled' => 'approved',
        'reject' => 'rejected',
        'declined' => 'rejected',
        'decline' => 'rejected',
        'cancelled' => 'cancelled',
        'canceled' => 'cancelled',
        'cancel' => 'cancelled',
    ];

    public static function normalizeBookingStatus(?string $status, string $default = 'pending'): string
    {
        return self::normalize($status, self::BOOKING_STATUSES, self::BOOKING_ALIASES, $default);
    }

    public static function normalizeBookingPaymentStatus(?string $status, string $default = 'unpaid'): string
    {
        return self::normalize($status, self::BOOKING_PAYMENT_STATUSES, self::BOOKING_PAYMENT_ALIASES, $default);
    }

    public static function normalizePaymentProofStatus(?string $status, string $default = 'pending'): string
    {
        return self::normalize($status, self::PAYMENT_PROOF_STATUSES, self::PAYMENT_PROOF_ALIASES, $default);
    }

    /**
     * @param array<int, string> $allowed
     * @param array<string, string> $aliases
     */
    public static function normalize(?string $status, array $allowed, array $aliases = [], string $default = ''): string
    {
        $value = strtolower(trim((string) $status));
        $value = preg_replace('/\s+/', ' ', $value) ?: '';

        if (array_key_exists($value, $aliases)) {
            return $aliases[$value];
        }

        $key = str_replace(['-', ' '], '_', $value);

        if (array_key_exists($key, $aliases)) {
            return $aliases[$key];
        }

        if (in_array($key, $allowed, true)) {
            return $key;
        }

        return $default;
    }

    public static function bookingStatusLabel(?string $status): string
    {
        return self::label(self::normalizeBookingStatus($status));
    }

    public static function bookingPaymentStatusLabel(?string $status): string
    {
        return self::label(self::normalizeBookingPaymentStatus($status));
    }

    public static function paymentProofStatusLabel(?string $status): string
    {
        return self::label(self::normalizePaymentProofStatus($status));
    }

    private static function label(string $status): string
    {
        return collect(explode('_', $status))
            ->map(fn (string $word): string => ucfirst($word))
            ->implode(' ');
    }
}
