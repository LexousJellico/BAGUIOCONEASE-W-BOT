<?php

namespace App\Services;

use App\Models\Booking;
use App\Support\BcccBookingPolicyCatalog;

class BookingFinalComputationService
{
    public function __construct(private readonly BookingPricingService $pricingService)
    {
    }

    public function forBooking(Booking $booking): array
    {
        $pricing = $this->pricingService->fromBooking($booking, true);

        return $this->withPolicy($pricing);
    }

    public function forPayload(array $payload, array $items = [], array $segments = []): array
    {
        $payload['pricing_stage'] = 'final_review';
        $payload['show_discounts'] = true;
        $payload['finalize_computation'] = true;

        $pricing = $this->pricingService->fromPayload($payload, $items, $segments);

        return $this->withPolicy($pricing);
    }

    protected function withPolicy(array $pricing): array
    {
        $venueNet = (float) ($pricing['grand_total'] ?? $pricing['estimated_total'] ?? 0);
        $bond = BcccBookingPolicyCatalog::REQUIRED_BOND_AMOUNT;
        $paymentTotal = round($venueNet + $bond, 2);
        $baseDownPayment = round($venueNet * BcccBookingPolicyCatalog::REQUIRED_DOWN_PAYMENT_RATE, 2);
        $downPaymentWithBond = round($baseDownPayment + $bond, 2);

        return array_merge($pricing, [
            'final_computation' => true,
            'discounts_visible' => true,
            'active_charge_scope' => BcccBookingPolicyCatalog::ACTIVE_CHARGE_SCOPE,
            'excluded_user_charges' => BcccBookingPolicyCatalog::excludedUserCharges(),
            'venue_total' => $venueNet,
            'payment_total_including_bond' => $paymentTotal,
            'total_with_bond' => $paymentTotal,
            'required_down_payment' => $downPaymentWithBond,
            'base_required_down_payment' => $baseDownPayment,
            'required_down_payment_rate' => BcccBookingPolicyCatalog::REQUIRED_DOWN_PAYMENT_RATE,
            'required_bond' => $bond,
            'balance_after_down_payment' => max($paymentTotal - $downPaymentWithBond, 0),
            'policy_notice' => BcccBookingPolicyCatalog::finalConfirmationNotice(),
        ]);
    }
}
