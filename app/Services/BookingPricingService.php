<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Service;
use App\Support\ActiveVenueCatalog;
use App\Support\BcccBookingPolicyCatalog;
use App\Support\BookingScheduleCatalog;
use App\Support\DressingRoomCatalog;
use App\Support\VenuePackageCatalog;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class BookingPricingService
{
    public const BOND_AMOUNT = 10000.00;
    public const DOWN_PAYMENT_RATE = 0.50;

    public function fromPayload(array $payload, array $items = [], array $segments = []): array
    {
        $areaKeys = $this->areaKeysFromPayload($payload, $items);

        if ($error = ActiveVenueCatalog::combinationError($areaKeys)) {
            throw ValidationException::withMessages([
                'selected_area_keys' => $error,
            ]);
        }

        $segments = $this->normalizeSegmentsForPricing($payload, $segments, $areaKeys);

        $stage = strtolower((string) ($payload['computation_stage'] ?? $payload['pricing_stage'] ?? 'draft'));
        $discountsVisible = in_array($stage, ['review', 'final', 'final_review', 'admin_final', 'billing'], true)
            || filter_var($payload['finalize_computation'] ?? false, FILTER_VALIDATE_BOOL)
            || filter_var($payload['show_discounts'] ?? false, FILTER_VALIDATE_BOOL);

        $lineItems = [];
        $baseTotal = 0.0;
        $additionalTotal = 0.0;
        $dressingRoomTotal = 0.0;

        foreach ($segments as $segment) {
            $segmentKeys = ActiveVenueCatalog::sanitizeKeys($segment['area_keys'] ?? $areaKeys) ?: $areaKeys;
            $baseBlock = BookingScheduleCatalog::normalizeBaseBlock((string) ($segment['base_block'] ?? BookingScheduleCatalog::BLOCK_WHOLE_DAY));
            $duration = $baseBlock === BookingScheduleCatalog::BLOCK_WHOLE_DAY
                ? ActiveVenueCatalog::DURATION_WHOLE_DAY
                : ActiveVenueCatalog::DURATION_HALF_DAY;

            foreach ($segmentKeys as $key) {
                $rate = ActiveVenueCatalog::rate($key);

                if (! $rate) {
                    continue;
                }

                $amount = ActiveVenueCatalog::amount($key, $duration);
                $baseTotal += $amount;

                $lineItems[] = [
                    'type' => 'venue',
                    'area_key' => $key,
                    'label' => $rate['label'],
                    'date' => $segment['date'] ?? null,
                    'segment_role' => $segment['segment_role'] ?? BookingScheduleCatalog::ROLE_EVENT,
                    'duration' => $duration,
                    'duration_label' => $duration === ActiveVenueCatalog::DURATION_WHOLE_DAY ? 'Whole Day' : 'Half Day',
                    'quantity' => 1,
                    'unit_amount' => $this->roundMoney($amount),
                    'amount' => $this->roundMoney($amount),
                    'amount_label' => ActiveVenueCatalog::money($amount),
                ];

                $additionalHours = BookingScheduleCatalog::normalizeAdditionalHours($baseBlock, (int) ($segment['additional_hours'] ?? 0));

                if ($additionalHours > 0) {
                    $hourRate = ActiveVenueCatalog::amount($key, ActiveVenueCatalog::DURATION_ADDITIONAL_HOUR);
                    $hourAmount = $hourRate * $additionalHours;
                    $additionalTotal += $hourAmount;

                    $lineItems[] = [
                        'type' => 'additional_hour',
                        'area_key' => $key,
                        'label' => $rate['label'] . ' - Additional Hours',
                        'date' => $segment['date'] ?? null,
                        'segment_role' => $segment['segment_role'] ?? BookingScheduleCatalog::ROLE_EVENT,
                        'duration' => ActiveVenueCatalog::DURATION_ADDITIONAL_HOUR,
                        'duration_label' => 'Additional Hour',
                        'quantity' => $additionalHours,
                        'unit_amount' => $this->roundMoney($hourRate),
                        'amount' => $this->roundMoney($hourAmount),
                        'amount_label' => ActiveVenueCatalog::money($hourAmount),
                    ];
                }
            }
        }

        $dressingRoomLine = $this->dressingRoomLine($payload, $segments);

        if ($dressingRoomLine !== null) {
            $dressingRoomTotal = (float) ($dressingRoomLine['amount'] ?? 0);
            $lineItems[] = $dressingRoomLine;
        }

        $grossTotal = $this->roundMoney($baseTotal + $additionalTotal + $dressingRoomTotal);
        $discountLines = $discountsVisible ? $this->discountLines($segments, $areaKeys, $lineItems, $payload) : [];
        $discountTotal = $this->roundMoney(collect($discountLines)->sum(fn (array $line) => (float) ($line['amount'] ?? 0)));
        $netTotal = $this->roundMoney(max(0, $grossTotal - $discountTotal));
        $baseDownPayment = $this->roundMoney($netTotal * self::DOWN_PAYMENT_RATE);
        $bondAmount = BcccBookingPolicyCatalog::REQUIRED_BOND_AMOUNT;
        $downPayment = $this->roundMoney($baseDownPayment + $bondAmount);

        return [
            'pricing_source' => 'active_bccc_catalog',
            'catalog_scope' => 'full_hall_main_hall_led_wall_lounge_boardroom_only',
            'excluded_charge_items' => ActiveVenueCatalog::excludedChargeKeys(),
            'area_keys' => $areaKeys,
            'package_code' => VenuePackageCatalog::normalizeCode($payload['selected_package_code'] ?? $payload['package_code'] ?? null),
            'segments_count' => count($segments),
            'line_items' => $lineItems,
            'base_venue_total' => $this->roundMoney($baseTotal),
            'additional_hours_total' => $this->roundMoney($additionalTotal),
            'dressing_room_total' => $this->roundMoney($dressingRoomTotal),
            'gross_total' => $grossTotal,
            'estimated_base_total' => $grossTotal,
            'discounts_visible' => $discountsVisible,
            'discount_total' => $discountsVisible ? $discountTotal : 0.0,
            'discount_lines' => $discountsVisible ? $discountLines : [],
            'discount_note' => $discountsVisible
                ? 'Discounts are shown only during final computation/review.'
                : 'Discounts are intentionally hidden until final computation/review.',
            'estimated_total' => $netTotal,
            'final_estimated_total' => $netTotal,
            'grand_total' => $netTotal,
            'total_payable' => $netTotal,
            'down_payment_rate' => self::DOWN_PAYMENT_RATE,
            'base_down_payment_required' => $baseDownPayment,
            'down_payment_required' => $downPayment,
            'down_required' => $downPayment,
            'bond_required' => true,
            'bond_amount' => $bondAmount,
            'required_bond' => $bondAmount,
            'bond_amount_label' => ActiveVenueCatalog::money($bondAmount),
            'payment_total_including_bond' => $this->roundMoney($netTotal + $bondAmount),
            'total_with_bond' => $this->roundMoney($netTotal + $bondAmount),
            'currency' => 'PHP',
        ];
    }

    public function fromBooking(Booking $booking, bool $showDiscounts = false): array
    {
        $booking->loadMissing(['bookingServices.service.serviceType', 'scheduleSegments']);

        $items = $booking->bookingServices
            ->map(fn ($item) => [
                'service_id' => (int) $item->service_id,
                'quantity' => max(1, (int) ($item->quantity ?? 1)),
            ])
            ->all();

        $segments = $booking->scheduleSegments
            ->map(fn ($segment) => [
                'date' => optional($segment->date)->format('Y-m-d'),
                'segment_role' => $segment->segment_role,
                'base_block' => $segment->base_block,
                'additional_hours' => (int) ($segment->additional_hours ?? 0),
                'area_keys' => $segment->area_keys ?? [],
            ])
            ->all();

        $payload = [
            'selected_area_keys' => $booking->selected_area_keys ?? [],
            'selected_package_code' => $booking->selected_package_code,
            'booking_date_from' => optional($booking->booking_date_from)->toDateTimeString(),
            'booking_date_to' => optional($booking->booking_date_to)->toDateTimeString(),
            'dressing_room_selection' => $booking->dressing_room_selection,
            'dressing_room_charge' => $booking->dressing_room_charge,
            'organization_type' => $booking->organization_type,
            'show_discounts' => $showDiscounts,
            'pricing_stage' => $showDiscounts ? 'final_review' : 'draft',
        ];

        return $this->fromPayload($payload, $items, $segments);
    }

    protected function areaKeysFromPayload(array $payload, array $items): array
    {
        $keys = [];

        $packageCode = VenuePackageCatalog::normalizeCode($payload['selected_package_code'] ?? $payload['package_code'] ?? null);

        if ($packageCode && VenuePackageCatalog::exists($packageCode)) {
            $keys = array_merge($keys, VenuePackageCatalog::areaKeys($packageCode));
        }

        $keys = array_merge($keys, ActiveVenueCatalog::sanitizeKeys($payload['selected_area_keys'] ?? $payload['area_keys'] ?? []));

        $serviceIds = collect($items)
            ->pluck('service_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        if ($serviceIds !== []) {
            Service::query()
                ->with('serviceType')
                ->whereIn('id', $serviceIds)
                ->get()
                ->each(function (Service $service) use (&$keys): void {
                    $keys = array_merge($keys, ActiveVenueCatalog::sanitizeKeys([
                        $service->serviceType?->name ?? '',
                        $service->name ?? '',
                    ]));
                });
        }

        return collect($keys)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    protected function normalizeSegmentsForPricing(array $payload, array $segments, array $areaKeys): array
    {
        if ($segments !== []) {
            return collect($segments)->map(function (array $segment, int $index) use ($areaKeys): array {
                $baseBlock = BookingScheduleCatalog::normalizeBaseBlock((string) ($segment['base_block'] ?? BookingScheduleCatalog::BLOCK_WHOLE_DAY));

                return [
                    'date' => (string) ($segment['date'] ?? Carbon::parse($segment['starts_at'] ?? now())->toDateString()),
                    'segment_role' => BookingScheduleCatalog::normalizeRole((string) ($segment['segment_role'] ?? $segment['role'] ?? BookingScheduleCatalog::ROLE_EVENT)),
                    'base_block' => $baseBlock,
                    'additional_hours' => BookingScheduleCatalog::normalizeAdditionalHours($baseBlock, (int) ($segment['additional_hours'] ?? 0)),
                    'area_keys' => ActiveVenueCatalog::sanitizeKeys($segment['area_keys'] ?? $areaKeys) ?: $areaKeys,
                    'sort_order' => (int) ($segment['sort_order'] ?? ($index + 1)),
                ];
            })->values()->all();
        }

        $from = ! empty($payload['booking_date_from']) ? Carbon::parse($payload['booking_date_from']) : null;
        $to = ! empty($payload['booking_date_to']) ? Carbon::parse($payload['booking_date_to']) : null;

        if (! $from || ! $to) {
            return [];
        }

        $baseBlock = match (true) {
            $from->format('H:i') === '06:00' && $to->format('H:i') === '12:00' => BookingScheduleCatalog::BLOCK_AM,
            $from->format('H:i') === '12:00' && $to->lte($from->copy()->setTime(18, 0)) => BookingScheduleCatalog::BLOCK_PM,
            default => BookingScheduleCatalog::BLOCK_WHOLE_DAY,
        };

        $additionalHours = 0;
        $additionalBase = $from->copy()->setTime(18, 0);

        if (in_array($baseBlock, [BookingScheduleCatalog::BLOCK_PM, BookingScheduleCatalog::BLOCK_WHOLE_DAY], true) && $to->gt($additionalBase)) {
            $additionalHours = (int) ceil($additionalBase->diffInMinutes($to) / 60);
        }

        return [[
            'date' => $from->toDateString(),
            'segment_role' => BookingScheduleCatalog::ROLE_EVENT,
            'base_block' => $baseBlock,
            'additional_hours' => BookingScheduleCatalog::normalizeAdditionalHours($baseBlock, $additionalHours),
            'area_keys' => $areaKeys,
            'sort_order' => 1,
        ]];
    }

    protected function dressingRoomLine(array $payload, array $segments): ?array
    {
        $selection = DressingRoomCatalog::normalize(
            (string) (
                $payload['dressing_room_selection']
                ?? $payload['estimated_other_rentals']
                ?? 'none'
            )
        );

        $days = $this->chargeableDayCount($segments, $payload);
        $dailyRate = DressingRoomCatalog::charge($selection);
        $amount = DressingRoomCatalog::chargeForDays($selection, $days);

        if ($amount <= 0) {
            $stored = $this->money($payload['dressing_room_charge'] ?? 0);

            if ($stored <= 0) {
                return null;
            }

            $amount = $stored;
            $dailyRate = $days > 0 ? $stored / $days : $stored;
        }

        return [
            'type' => 'dressing_room',
            'area_key' => 'dressing_room',
            'label' => DressingRoomCatalog::label($selection),
            'date' => null,
            'segment_role' => BookingScheduleCatalog::ROLE_EVENT,
            'duration' => 'per_day',
            'duration_label' => $days === 1 ? '1 day' : $days . ' days',
            'quantity' => max(1, $days),
            'unit_amount' => $this->roundMoney($dailyRate),
            'amount' => $this->roundMoney($amount),
            'amount_label' => ActiveVenueCatalog::money($amount),
        ];
    }

    protected function chargeableDayCount(array $segments, array $payload): int
    {
        $dates = collect($segments)
            ->pluck('date')
            ->filter()
            ->map(fn ($date) => Carbon::parse((string) $date)->toDateString())
            ->unique()
            ->values();

        if ($dates->isNotEmpty()) {
            return $dates->count();
        }

        $from = ! empty($payload['booking_date_from'])
            ? Carbon::parse($payload['booking_date_from'])->startOfDay()
            : null;
        $to = ! empty($payload['booking_date_to'])
            ? Carbon::parse($payload['booking_date_to'])->startOfDay()
            : null;

        if (! $from || ! $to) {
            return 1;
        }

        return max(1, (int) $from->diffInDays($to) + 1);
    }

    protected function discountLines(array $segments, array $areaKeys, array $lineItems, array $payload = []): array
    {
        $discounts = [];
        $eventSegments = collect($segments)->values();
        $isGovernmentOrganization = BcccBookingPolicyCatalog::isGovernmentOrganization($payload['organization_type'] ?? null);

        if ($isGovernmentOrganization) {
            $grossBase = collect($lineItems)
                ->sum(fn (array $line) => (float) ($line['amount'] ?? 0));
            $governmentBasis = $this->roundMoney(max(0, $grossBase));

            if ($governmentBasis <= 0) {
                return [];
            }

            $governmentAmount = $this->roundMoney($governmentBasis * BcccBookingPolicyCatalog::GOVERNMENT_ORGANIZATION_DISCOUNT_RATE);

            return $governmentAmount > 0
                ? [[
                    'key' => 'government_organization_50_percent',
                    'label' => 'Government organization discount',
                    'rate' => BcccBookingPolicyCatalog::GOVERNMENT_ORGANIZATION_DISCOUNT_RATE,
                    'basis' => $governmentBasis,
                    'amount' => $governmentAmount,
                    'amount_label' => ActiveVenueCatalog::money($governmentAmount),
                    'visibility' => 'final_only',
                    'note' => 'Government organization bookings receive a 50% overall discount. Consecutive-day and ingress/egress discounts are not stacked.',
                ]]
                : [];
        }

        if ($eventSegments->count() > 1) {
            $dates = $eventSegments->pluck('date')->unique()->values();
            $discountableDates = $dates->slice(1)->all();

            $discountBase = collect($lineItems)
                ->filter(fn (array $line) => ($line['type'] ?? '') === 'venue' && in_array($line['date'] ?? null, $discountableDates, true))
                ->sum(fn (array $line) => (float) ($line['amount'] ?? 0));

            if ($discountBase > 0) {
                $discounts[] = [
                    'key' => 'consecutive_day_5_percent',
                    'label' => 'Consecutive-day discount',
                    'rate' => 0.05,
                    'basis' => $this->roundMoney($discountBase),
                    'amount' => $this->roundMoney($discountBase * 0.05),
                    'amount_label' => ActiveVenueCatalog::money($discountBase * 0.05),
                    'visibility' => 'final_only',
                ];
            }
        }

        $setupSegments = collect($segments)
            ->filter(fn (array $segment) => in_array($segment['segment_role'] ?? '', [BookingScheduleCatalog::ROLE_INGRESS, BookingScheduleCatalog::ROLE_EGRESS], true))
            ->values();

        if ($setupSegments->isNotEmpty()) {
            $setupDates = $setupSegments->pluck('date')->unique()->values()->all();
            $eligibleSetupAreas = ['main_hall', 'full_hall'];
            $setupBase = collect($lineItems)
                ->filter(function (array $line) use ($setupDates, $eligibleSetupAreas): bool {
                    if (($line['type'] ?? '') !== 'venue') {
                        return false;
                    }

                    $areaKey = strtolower((string) ($line['area_key'] ?? ''));
                    if (! in_array($areaKey, $eligibleSetupAreas, true)) {
                        return false;
                    }

                    $role = (string) ($line['segment_role'] ?? '');
                    if (in_array($role, [BookingScheduleCatalog::ROLE_INGRESS, BookingScheduleCatalog::ROLE_EGRESS], true)) {
                        return true;
                    }

                    return in_array($line['date'] ?? null, $setupDates, true);
                })
                ->sum(fn (array $line) => (float) ($line['amount'] ?? 0));

            if ($setupBase > 0) {
                $discounts[] = [
                    'key' => 'ingress_egress_preparation_30_percent',
                    'label' => 'Ingress/egress discount (Main/Full Hall only)',
                    'rate' => 0.30,
                    'basis' => $this->roundMoney($setupBase),
                    'amount' => $this->roundMoney($setupBase * 0.30),
                    'amount_label' => ActiveVenueCatalog::money($setupBase * 0.30),
                    'visibility' => 'final_only',
                    'note' => 'Applies only to Main Hall or Full Hall package charges during ingress/egress; VIP Lounge and Boardroom are not included.',
                ];
            }
        }

        return $discounts;
    }

    protected function roundMoney(float $value): float
    {
        return round($value, 2);
    }

    protected function money(mixed $value): float
    {
        if (is_numeric($value)) {
            return round((float) $value, 2);
        }

        if (is_string($value)) {
            $normalized = preg_replace('/[^0-9.\-]/', '', $value);

            return is_numeric($normalized) ? round((float) $normalized, 2) : 0.0;
        }

        return 0.0;
    }
}
