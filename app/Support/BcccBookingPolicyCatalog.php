<?php

namespace App\Support;

class BcccBookingPolicyCatalog
{
    public const ACTIVE_CHARGE_SCOPE = 'FULL_HALL_MAIN_HALL_LED_WALL_LOUNGE_BOARDROOM_ONLY';
    public const REQUIRED_DOWN_PAYMENT_RATE = 0.50;
    public const REQUIRED_BOND_AMOUNT = 10000.00;
    public const GOVERNMENT_ORGANIZATION_DISCOUNT_RATE = 0.50;
    public const FINAL_COMPUTATION_AUTO_FINALIZE_GRACE_HOURS = 24;

    public static function governmentOrganizationTypes(): array
    {
        return ['government', 'govt', 'government_agency', 'government_office'];
    }

    public static function isGovernmentOrganization(?string $value): bool
    {
        $normalized = strtolower(trim((string) $value));
        $normalized = preg_replace('/[^a-z0-9]+/', '_', $normalized) ?: '';

        return in_array(trim($normalized, '_'), self::governmentOrganizationTypes(), true);
    }

    public static function activeChargeChoices(): array
    {
        return [
            'FULL_HALL' => 'Full Hall',
            'MAIN_HALL' => 'Main Hall',
            'LED_WALL' => 'LED Wall',
            'LOUNGE' => 'Lounge',
            'BOARDROOM' => 'Boardroom',
        ];
    }

    public static function excludedUserCharges(): array
    {
        return [
            'LOBBY_RECEIVING_ROOM_STANDALONE' => 'Lobby Receiving Room as a standalone charge; lobby is included with Full Hall.',
            'BASEMENT_FUNCTION_ROOM' => 'Basement Function Room is not available as a user booking charge.',
            'BASEMENT_HALF' => 'Basement Hall - Half is not available as a user booking charge.',
            'WHOLE_BASEMENT' => 'Whole Basement is not available as a user booking charge.',
            'SHOP_RENTALS' => 'Shop rentals are not available in the user booking flow.',
            'CATERING_MAINTENANCE_FEE' => 'Catering maintenance fee is not implemented as a booking charge.',
            'AIR_CONDITIONING' => 'Air conditioning is not implemented as a booking charge.',
            'STATIONERY_KIT' => 'Stationery kit is not implemented as a booking charge.',
            'ORDINANCE_SPECIAL_PACKAGES' => 'Ordinance special package rates are not used; the system uses the active combinations defined by BCCC EASE.',
        ];
    }

    public static function finalConfirmationNotice(): array
    {
        return [
            'reservation_review' => 'Reservation requests remain subject to BCCC assessment, schedule verification, and approval.',
            'payment_review' => 'The reservation becomes confirmed only after the required payment is reviewed and accepted according to BCCC policy.',
            'bond' => 'A bond may be required before the event unless waived for qualified official city activities.',
            'discount_privacy' => 'Discounts are hidden during schedule and service selection and shown only during final computation/review.',
            'post_event' => 'Post-event charges may be assessed for damages, violations, extra use, or unpaid balances.',
        ];
    }

    public static function cancellationPenaltyRate(int $daysBeforeEvent, bool $afterOfficeHoursDayBefore = false): float
    {
        if ($afterOfficeHoursDayBefore || $daysBeforeEvent <= 0) {
            return 0.75;
        }

        if ($daysBeforeEvent < 7) {
            return 0.30;
        }

        if ($daysBeforeEvent < 14) {
            return 0.20;
        }

        return 0.00;
    }
}
