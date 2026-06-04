<?php

namespace App\Support;

final class ActiveVenueCatalog
{
    public const FULL_HALL = 'full_hall';
    public const MAIN_HALL = 'main_hall';
    public const LED_WALL = 'led_wall';
    public const LOUNGE = 'vip_lounge';
    public const BOARDROOM = 'board_room';

    public const DURATION_WHOLE_DAY = 'whole_day';
    public const DURATION_HALF_DAY = 'half_day';
    public const DURATION_ADDITIONAL_HOUR = 'additional_hour';

    /**
     * Only these five keys are bookable in the active public/admin reservation flow.
     * Lobby, basement spaces, shop rentals, catering maintenance, air-conditioning,
     * stationery kits, and ordinance special packages are intentionally unavailable.
     */
    public static function activeKeys(): array
    {
        return [
            self::FULL_HALL,
            self::MAIN_HALL,
            self::LED_WALL,
            self::LOUNGE,
            self::BOARDROOM,
        ];
    }

    public static function excludedChargeKeys(): array
    {
        return [
            'foyer_lobby',
            'lobby_receiving_room',
            'basement',
            'basement_function_room',
            'basement_hall_half',
            'whole_basement',
            'shop_rental',
            'catering_maintenance_fee',
            'air_conditioning',
            'stationery_kit',
            'ordinance_special_package',
        ];
    }

    public static function rates(): array
    {
        return [
            self::FULL_HALL => [
                'area_key' => self::FULL_HALL,
                'code' => 'FULL_HALL',
                'label' => 'Full Hall',
                'display_label' => 'FULL HALL',
                'official_label' => 'Full Hall',
                'whole_day' => 80000.00,
                'half_day' => 45000.00,
                'additional_hour' => 5000.00,
                'image_path' => '/marketing/images/events/darkmain.JPG',
                'description' => 'Full Hall rental for large-format programs. Lobby access is included as support circulation and registration flow, not as a separate charge.',
                'support_notes' => ['Lobby access is included.', 'VIP Lounge, Board Room, and LED Wall remain separate selections.'],
                'capacity_max' => 2000,
                'sort_order' => 10,
            ],
            self::MAIN_HALL => [
                'area_key' => self::MAIN_HALL,
                'code' => 'MAIN_HALL',
                'label' => 'Main Hall',
                'display_label' => 'MAIN HALL',
                'official_label' => 'Ground Hall / Main Hall',
                'whole_day' => 60000.00,
                'half_day' => 35000.00,
                'additional_hour' => 5000.00,
                'image_path' => '/marketing/images/hero/noon2.jpg',
                'description' => 'Primary hall for conferences, ceremonies, seminars, assemblies, and formal civic programs.',
                'support_notes' => [],
                'capacity_max' => 2000,
                'sort_order' => 20,
            ],
            self::LED_WALL => [
                'area_key' => self::LED_WALL,
                'code' => 'LED_WALL',
                'label' => 'LED Wall',
                'display_label' => 'LED WALL',
                'official_label' => 'LED Video Wall',
                'whole_day' => 30000.00,
                'half_day' => 15000.00,
                'additional_hour' => 3500.00,
                'image_path' => '/marketing/images/facilities/ledwall.jpg',
                'description' => 'Digital display support for presentations, branding, stage visuals, and program media.',
                'support_notes' => [],
                'sort_order' => 30,
            ],
            self::LOUNGE => [
                'area_key' => self::LOUNGE,
                'code' => 'VIP_LOUNGE',
                'label' => 'Lounge',
                'display_label' => 'LOUNGE',
                'official_label' => 'Executive Lounge / VIP Lounge',
                'whole_day' => 6000.00,
                'half_day' => 3500.00,
                'additional_hour' => 500.00,
                'image_path' => '/marketing/images/facilities/darkvip.JPG',
                'description' => 'Executive support area for dignitaries, speakers, guests of honor, and protocol preparation.',
                'support_notes' => [],
                'sort_order' => 40,
            ],
            self::BOARDROOM => [
                'area_key' => self::BOARDROOM,
                'code' => 'BOARD_ROOM',
                'label' => 'Boardroom',
                'display_label' => 'BOARDROOM',
                'official_label' => 'Executive Boardroom / Board Room',
                'whole_day' => 6000.00,
                'half_day' => 3500.00,
                'additional_hour' => 500.00,
                'image_path' => '/marketing/images/facilities/boardroom.jpg',
                'description' => 'Private room for briefings, planning sessions, committees, and focused meetings.',
                'support_notes' => [],
                'sort_order' => 50,
            ],
        ];
    }

    public static function packages(): array
    {
        return [
            [
                'code' => 'GRAND_CONVENTION_PACKAGE',
                'name' => 'Grand Convention Package',
                'subtitle' => 'Full Hall flagship convention setup',
                'description' => 'Best for citywide conventions, large assemblies, civic programs, graduations, summits, and high-capacity formal events. Full Hall includes lobby circulation and grounds/parking support as part of the booking scope, while LED Wall, Lounge, and Boardroom remain explicit add-on selections only when included by the package.',
                'area_keys' => [self::FULL_HALL, self::LED_WALL, self::LOUNGE, self::BOARDROOM],
                'image_path' => '/marketing/images/events/darkmain.JPG',
                'capacity_min' => 801,
                'capacity_max' => 2000,
                'notice' => 'FULL HALL maximum capacity is 2,000. Lobby and grounds/parking support are included with Full Hall; Main Hall cannot be added separately because it is already occupied by Full Hall use.',
                'is_public' => true,
                'is_featured' => true,
                'sort_order' => 10,
            ],
            [
                'code' => 'PREMIUM_CONFERENCE_PACKAGE',
                'name' => 'Premium Conference Package',
                'subtitle' => 'Main Hall with VIP and display support',
                'description' => 'Best for premium conferences, formal forums, regional meetings, executive briefings, and speaker-led programs needing the Main Hall, LED Wall, Lounge, and Boardroom support.',
                'area_keys' => [self::MAIN_HALL, self::LED_WALL, self::LOUNGE, self::BOARDROOM],
                'image_path' => '/marketing/images/hero/noon2.jpg',
                'capacity_min' => 301,
                'capacity_max' => 2000,
                'notice' => 'MAIN HALL maximum capacity is 2,000 pax for official booking capacity guidance.',
                'is_public' => true,
                'is_featured' => true,
                'sort_order' => 20,
            ],
            [
                'code' => 'CORPORATE_FORUM_PACKAGE',
                'name' => 'Corporate Forum Package',
                'subtitle' => 'Main Hall with LED Wall for formal forums',
                'description' => 'Best for business forums, corporate assemblies, seminars, public consultations, and institutional programs that need a strong main presentation area with LED Wall support.',
                'area_keys' => [self::MAIN_HALL, self::LED_WALL],
                'image_path' => '/marketing/images/events/darkmain.JPG',
                'capacity_min' => 101,
                'capacity_max' => 2000,
                'notice' => 'MAIN HALL maximum capacity is 2,000 pax for official booking capacity guidance.',
                'is_public' => true,
                'is_featured' => true,
                'sort_order' => 30,
            ],
            [
                'code' => 'CEREMONY_AWARDS_PACKAGE',
                'name' => 'Ceremony & Awards Package',
                'subtitle' => 'Formal ceremony layout with VIP support',
                'description' => 'Best for recognition rites, awarding ceremonies, institutional programs, graduations, oath-taking ceremonies, and formal stage-centered events requiring Main Hall and Lounge support.',
                'area_keys' => [self::MAIN_HALL, self::LOUNGE, self::LED_WALL],
                'image_path' => '/marketing/images/facilities/darkvip.JPG',
                'capacity_min' => 101,
                'capacity_max' => 2000,
                'notice' => 'MAIN HALL maximum capacity is 2,000 pax for official booking capacity guidance.',
                'is_public' => true,
                'is_featured' => true,
                'sort_order' => 40,
            ],
            [
                'code' => 'TRAINING_WORKSHOP_PACKAGE',
                'name' => 'Training & Workshop Package',
                'subtitle' => 'Workshop-ready Main Hall with coordination room',
                'description' => 'Best for trainings, workshops, seminars, breakout-style learning sessions, and coordination-heavy programs using Main Hall and Boardroom support.',
                'area_keys' => [self::MAIN_HALL, self::BOARDROOM],
                'image_path' => '/marketing/images/hero/noon2.jpg',
                'capacity_min' => 50,
                'capacity_max' => 2000,
                'notice' => 'MAIN HALL maximum capacity is 2,000 pax for official booking capacity guidance.',
                'is_public' => true,
                'is_featured' => false,
                'sort_order' => 50,
            ],
            [
                'code' => 'EXECUTIVE_MEETING_PACKAGE',
                'name' => 'Executive Meeting Package',
                'subtitle' => 'Lounge and Boardroom executive setup',
                'description' => 'Best for small executive meetings, coordination meetings, VIP holding, board sessions, planning work, and protocol preparation without the Main Hall.',
                'area_keys' => [self::LOUNGE, self::BOARDROOM],
                'image_path' => '/marketing/images/facilities/boardroom.jpg',
                'capacity_min' => 1,
                'capacity_max' => 80,
                'notice' => 'Designed for compact executive use. Main Hall and Full Hall are not included in this package.',
                'is_public' => true,
                'is_featured' => false,
                'sort_order' => 60,
            ],
            [
                'code' => 'EXHIBIT_TRADE_FAIR_GRAND_PACKAGE',
                'name' => 'Exhibit & Trade Fair Package - Grand',
                'subtitle' => 'Full Hall exhibit setup with display support',
                'description' => 'Best for larger exhibits, trade fairs, product showcases, expos, and multi-booth programs needing Full Hall capacity plus LED Wall and support rooms.',
                'area_keys' => [self::FULL_HALL, self::LED_WALL, self::LOUNGE, self::BOARDROOM],
                'image_path' => '/marketing/images/events/darkmain.JPG',
                'capacity_min' => 801,
                'capacity_max' => 2000,
                'notice' => 'FULL HALL maximum capacity is 2,000. Lobby and grounds/parking support are included with Full Hall.',
                'is_public' => true,
                'is_featured' => false,
                'sort_order' => 70,
            ],
            [
                'code' => 'EXHIBIT_TRADE_FAIR_STANDARD_PACKAGE',
                'name' => 'Exhibit & Trade Fair Package - Standard',
                'subtitle' => 'Main Hall exhibit and trade-fair setup',
                'description' => 'Best for standard exhibits, bazaars, fairs, product showcases, and booth-based programs that need Main Hall with optional presentation support.',
                'area_keys' => [self::MAIN_HALL, self::LED_WALL],
                'image_path' => '/marketing/images/facilities/ledwall.jpg',
                'capacity_min' => 50,
                'capacity_max' => 2000,
                'notice' => 'MAIN HALL maximum capacity is 2,000 pax for official booking capacity guidance.',
                'is_public' => true,
                'is_featured' => false,
                'sort_order' => 80,
            ],
        ];
    }

    public static function aliases(): array
    {
        return [
            'full' => self::FULL_HALL,
            'fullhall' => self::FULL_HALL,
            'full_hall' => self::FULL_HALL,
            'wholehall' => self::FULL_HALL,
            'conventionhall' => self::FULL_HALL,
            'main' => self::MAIN_HALL,
            'mainhall' => self::MAIN_HALL,
            'main_hall' => self::MAIN_HALL,
            'groundhall' => self::MAIN_HALL,
            'ground_hall' => self::MAIN_HALL,
            'led' => self::LED_WALL,
            'ledwall' => self::LED_WALL,
            'led_wall' => self::LED_WALL,
            'ledvideowall' => self::LED_WALL,
            'video_wall' => self::LED_WALL,
            'lounge' => self::LOUNGE,
            'vip' => self::LOUNGE,
            'viplounge' => self::LOUNGE,
            'vip_lounge' => self::LOUNGE,
            'executivelounge' => self::LOUNGE,
            'executive_lounge' => self::LOUNGE,
            'board' => self::BOARDROOM,
            'boardroom' => self::BOARDROOM,
            'board_room' => self::BOARDROOM,
            'executiveboardroom' => self::BOARDROOM,
            'executive_boardroom' => self::BOARDROOM,
        ];
    }

    public static function normalizedToken(?string $value): string
    {
        $value = mb_strtolower(trim((string) $value));
        $value = str_replace(['&', '/', '+'], [' and ', ' ', ' '], $value);
        $value = preg_replace('/[^a-z0-9_]+/u', '', str_replace([' ', '-'], '_', $value)) ?? '';

        return trim($value, '_');
    }

    public static function canonicalKey(?string $value): string
    {
        $token = self::normalizedToken($value);

        if ($token === '') {
            return '';
        }

        $compact = str_replace('_', '', $token);
        $aliases = self::aliases();

        return $aliases[$token] ?? $aliases[$compact] ?? VenueAreaCatalog::canonicalKey($value);
    }

    public static function isSelectableKey(?string $key): bool
    {
        return in_array(self::canonicalKey($key), self::activeKeys(), true);
    }

    public static function isSelectableLabel(?string $label): bool
    {
        return self::isSelectableKey($label);
    }

    public static function serviceMatchesActiveChoice(?string $serviceName, ?string $serviceTypeName): bool
    {
        return self::isSelectableLabel($serviceTypeName) || self::isSelectableLabel($serviceName);
    }

    public static function sanitizeKeys(mixed $values): array
    {
        if ($values === null || $values === '') {
            return [];
        }

        if (is_string($values)) {
            $decoded = json_decode($values, true);
            $values = is_array($decoded) ? $decoded : preg_split('/[,;|]+/', $values);
        }

        if (! is_array($values)) {
            $values = [$values];
        }

        return collect($values)
            ->flatten()
            ->map(fn ($value) => self::canonicalKey(is_scalar($value) ? (string) $value : ''))
            ->filter(fn (string $key) => in_array($key, self::activeKeys(), true))
            ->unique()
            ->values()
            ->all();
    }

    public static function unavailableKeys(mixed $values): array
    {
        if ($values === null || $values === '') {
            return [];
        }

        if (is_string($values)) {
            $decoded = json_decode($values, true);
            $values = is_array($decoded) ? $decoded : preg_split('/[,;|]+/', $values);
        }

        if (! is_array($values)) {
            $values = [$values];
        }

        return collect($values)
            ->flatten()
            ->map(fn ($value) => self::canonicalKey(is_scalar($value) ? (string) $value : ''))
            ->filter()
            ->reject(fn (string $key) => in_array($key, self::activeKeys(), true))
            ->unique()
            ->values()
            ->all();
    }

    public static function hasFullMainConflict(mixed $values): bool
    {
        $keys = self::sanitizeKeys($values);

        return in_array(self::FULL_HALL, $keys, true) && in_array(self::MAIN_HALL, $keys, true);
    }

    public static function combinationError(mixed $values): ?string
    {
        if (self::hasFullMainConflict($values)) {
            return 'Full Hall already includes and occupies the Main Hall. Please choose Full Hall with LED Wall, Lounge, or Boardroom, or choose Main Hall without Full Hall.';
        }

        return null;
    }

    public static function validCombination(mixed $values): bool
    {
        return self::combinationError($values) === null;
    }

    public static function rate(?string $key): ?array
    {
        $key = self::canonicalKey($key);

        return self::rates()[$key] ?? null;
    }

    public static function amount(?string $key, ?string $duration): float
    {
        $rate = self::rate($key);
        $duration = self::normalizeDuration($duration);

        if (! $rate || $duration === '') {
            return 0.0;
        }

        return (float) ($rate[$duration] ?? 0.0);
    }

    public static function normalizeDuration(?string $duration): string
    {
        $value = mb_strtolower(trim((string) $duration));
        $value = str_replace([' ', '-'], '_', $value);

        return match ($value) {
            'whole', 'wholeday', 'whole_day', 'full_day', 'day', 'am_pm', 'am+pm' => self::DURATION_WHOLE_DAY,
            'half', 'halfday', 'half_day', 'am', 'pm', 'half_day_am', 'half_day_pm' => self::DURATION_HALF_DAY,
            'additional', 'additional_hour', 'additional_hours', 'hour', 'hours', 'hourly' => self::DURATION_ADDITIONAL_HOUR,
            default => '',
        };
    }

    public static function packageAmount(array $areaKeys, ?string $duration): float
    {
        $duration = self::normalizeDuration($duration);

        if ($duration === '') {
            return 0.0;
        }

        return collect(self::sanitizeKeys($areaKeys))
            ->reduce(fn (float $sum, string $key): float => $sum + self::amount($key, $duration), 0.0);
    }

    public static function rateSummary(array $areaKeys): array
    {
        $whole = self::packageAmount($areaKeys, self::DURATION_WHOLE_DAY);
        $half = self::packageAmount($areaKeys, self::DURATION_HALF_DAY);
        $hour = self::packageAmount($areaKeys, self::DURATION_ADDITIONAL_HOUR);

        return [
            'whole_day' => $whole,
            'half_day' => $half,
            'additional_hour' => $hour,
            'whole_day_label' => self::money($whole),
            'half_day_label' => self::money($half),
            'additional_hour_label' => self::money($hour),
        ];
    }

    public static function options(): array
    {
        return collect(self::rates())
            ->sortBy('sort_order')
            ->map(fn (array $rate) => [
                ...$rate,
                'value' => $rate['area_key'],
                'area_key' => $rate['area_key'],
                'name' => $rate['label'],
                'label' => $rate['display_label'],
                'whole_day_label' => self::money((float) $rate['whole_day']),
                'half_day_label' => self::money((float) $rate['half_day']),
                'additional_hour_label' => self::money((float) $rate['additional_hour']),
                'is_selectable' => true,
            ])
            ->values()
            ->all();
    }

    public static function money(float|int $amount): string
    {
        return '₱' . number_format((float) $amount, 2);
    }
}
