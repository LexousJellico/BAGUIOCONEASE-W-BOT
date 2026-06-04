<?php

use App\Support\ActiveVenueCatalog;
use App\Support\BcccBookingPolicyCatalog;
use App\Support\DressingRoomCatalog;
use App\Support\MiceReportCatalog;
use App\Support\VenuePackageCatalog;
use App\Services\BookingPricingService;

it('limits the active public booking catalog to the five approved charge choices', function () {
    $keys = ActiveVenueCatalog::activeKeys();
    sort($keys);

    expect($keys)->toBe([
        'board_room',
        'full_hall',
        'led_wall',
        'main_hall',
        'vip_lounge',
    ]);
});

it('rejects unavailable ordinance or support spaces as selectable booking charges', function () {
    foreach ([
        'Lobby Receiving Room',
        'Basement Function Room',
        'Basement Hall - Half',
        'Whole Basement',
        'Shop Rentals',
        'Catering Maintenance Fee',
        'Air Conditioning',
        'Stationery Kit',
        'Ordinance Special Package',
    ] as $label) {
        expect(ActiveVenueCatalog::isSelectableLabel($label))->toBeFalse($label . ' must not be selectable.');
    }
});

it('keeps active package combinations within the approved five choices', function () {
    $active = ActiveVenueCatalog::activeKeys();

    foreach (VenuePackageCatalog::defaults() as $package) {
        foreach ($package['area_keys'] as $areaKey) {
            expect($active)->toContain($areaKey);
        }
    }
});

it('keeps discounts private until final computation policy stage', function () {
    expect(BcccBookingPolicyCatalog::finalConfirmationNotice())
        ->toHaveKey('discount_privacy');
});

it('keeps MICE fixed fields aligned with BCCC report requirements', function () {
    expect(MiceReportCatalog::EVENT_CENTER_NAME)->toBe('BAGUIO CONVENTION AND CULTURAL CENTER')
        ->and(MiceReportCatalog::FUNCTION_HALLS_COUNT)->toBe(1)
        ->and(MiceReportCatalog::FUNCTION_HALL_CAPACITY)->toBe(2000)
        ->and(MiceReportCatalog::countries())->toContain('Philippines');
});

it('charges dressing rooms per selected booking date without half-day prorating', function () {
    expect(DressingRoomCatalog::chargeForDays(DressingRoomCatalog::ROOM_1, 3))->toBe(3000.0)
        ->and(DressingRoomCatalog::chargeForDays(DressingRoomCatalog::ROOM_1_AND_2, 2))->toBe(4000.0);
});

it('includes per-day dressing room add-ons in pricing before discounts', function () {
    $pricing = app(BookingPricingService::class)->fromPayload([
        'selected_area_keys' => [ActiveVenueCatalog::MAIN_HALL],
        'dressing_room_selection' => DressingRoomCatalog::ROOM_1,
        'show_discounts' => true,
    ], [], [
        [
            'date' => '2026-06-01',
            'segment_role' => 'event',
            'base_block' => 'am',
            'additional_hours' => 0,
            'area_keys' => [ActiveVenueCatalog::MAIN_HALL],
        ],
        [
            'date' => '2026-06-02',
            'segment_role' => 'event',
            'base_block' => 'pm',
            'additional_hours' => 0,
            'area_keys' => [ActiveVenueCatalog::MAIN_HALL],
        ],
    ]);

    expect($pricing['dressing_room_total'])->toBe(2000.0)
        ->and($pricing['gross_total'])->toBe(72000.0)
        ->and($pricing['discount_total'])->toBe(1750.0)
        ->and($pricing['grand_total'])->toBe(70250.0);
});
