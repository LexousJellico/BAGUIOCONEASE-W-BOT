<?php

namespace App\Support;

final class VenuePackageCatalog
{
    public static function defaults(): array
    {
        return ActiveVenueCatalog::packages();
    }

    public static function officialCodes(): array
    {
        return collect(self::defaults())->pluck('code')->values()->all();
    }

    public static function normalizeCode(?string $code): ?string
    {
        $code = strtoupper(trim((string) $code));
        $code = preg_replace('/[^A-Z0-9_]+/', '_', $code) ?: '';
        $code = trim($code, '_');

        if ($code === '') {
            return null;
        }

        $aliases = [
            'GRAND_CONVENTION' => 'GRAND_CONVENTION_PACKAGE',
            'GRAND_CONVENTION_PACKAGE' => 'GRAND_CONVENTION_PACKAGE',
            'PREMIUM_CONFERENCE' => 'PREMIUM_CONFERENCE_PACKAGE',
            'PREMIUM_CONFERENCE_PACKAGE' => 'PREMIUM_CONFERENCE_PACKAGE',
            'CORPORATE_FORUM' => 'CORPORATE_FORUM_PACKAGE',
            'CORPORATE_FORUM_PACKAGE' => 'CORPORATE_FORUM_PACKAGE',
            'CEREMONY_AWARDS' => 'CEREMONY_AWARDS_PACKAGE',
            'CEREMONY_AND_AWARDS' => 'CEREMONY_AWARDS_PACKAGE',
            'CEREMONY_AWARDS_PACKAGE' => 'CEREMONY_AWARDS_PACKAGE',
            'TRAINING_WORKSHOP' => 'TRAINING_WORKSHOP_PACKAGE',
            'TRAINING_AND_WORKSHOP' => 'TRAINING_WORKSHOP_PACKAGE',
            'TRAINING_WORKSHOP_PACKAGE' => 'TRAINING_WORKSHOP_PACKAGE',
            'EXECUTIVE_MEETING' => 'EXECUTIVE_MEETING_PACKAGE',
            'EXECUTIVE_MEETING_PACKAGE' => 'EXECUTIVE_MEETING_PACKAGE',
            'EXHIBIT_TRADE_FAIR_GRAND' => 'EXHIBIT_TRADE_FAIR_GRAND_PACKAGE',
            'EXHIBIT_AND_TRADE_FAIR_GRAND' => 'EXHIBIT_TRADE_FAIR_GRAND_PACKAGE',
            'EXHIBIT_TRADE_FAIR_GRAND_PACKAGE' => 'EXHIBIT_TRADE_FAIR_GRAND_PACKAGE',
            'EXHIBIT_TRADE_FAIR_STANDARD' => 'EXHIBIT_TRADE_FAIR_STANDARD_PACKAGE',
            'EXHIBIT_AND_TRADE_FAIR_STANDARD' => 'EXHIBIT_TRADE_FAIR_STANDARD_PACKAGE',
            'EXHIBIT_TRADE_FAIR_STANDARD_PACKAGE' => 'EXHIBIT_TRADE_FAIR_STANDARD_PACKAGE',

            // Legacy package codes mapped to the closest new official package so old drafts/links do not crash.
            'FULL_HALL' => 'GRAND_CONVENTION_PACKAGE',
            'FULL_HALL_ONLY' => 'GRAND_CONVENTION_PACKAGE',
            'FULL_HALL_PACKAGE' => 'GRAND_CONVENTION_PACKAGE',
            'FULL_LED' => 'GRAND_CONVENTION_PACKAGE',
            'FULL_LED_WALL' => 'GRAND_CONVENTION_PACKAGE',
            'FULL_LOUNGE' => 'GRAND_CONVENTION_PACKAGE',
            'FULL_BOARD' => 'GRAND_CONVENTION_PACKAGE',
            'FULL_LED_LOUNGE' => 'GRAND_CONVENTION_PACKAGE',
            'FULL_LED_BOARD' => 'GRAND_CONVENTION_PACKAGE',
            'FULL_LOUNGE_BOARD' => 'GRAND_CONVENTION_PACKAGE',
            'FULL_LED_LOUNGE_BOARD' => 'GRAND_CONVENTION_PACKAGE',
            'MAIN_HALL' => 'CORPORATE_FORUM_PACKAGE',
            'MAIN_HALL_ONLY' => 'CORPORATE_FORUM_PACKAGE',
            'MAIN_HALL_PACKAGE' => 'CORPORATE_FORUM_PACKAGE',
            'MAIN_LED' => 'CORPORATE_FORUM_PACKAGE',
            'MAIN_LED_WALL' => 'CORPORATE_FORUM_PACKAGE',
            'MAIN_BOARD' => 'TRAINING_WORKSHOP_PACKAGE',
            'MAIN_HALL_BOARDROOM' => 'TRAINING_WORKSHOP_PACKAGE',
            'MAIN_BOARDROOM' => 'TRAINING_WORKSHOP_PACKAGE',
            'MAIN_HALL_BOARD_ROOM' => 'TRAINING_WORKSHOP_PACKAGE',
            'MAIN_LOUNGE' => 'CEREMONY_AWARDS_PACKAGE',
            'MAIN_HALL_LOUNGE' => 'CEREMONY_AWARDS_PACKAGE',
            'MAIN_LOUNGE_BOARD' => 'PREMIUM_CONFERENCE_PACKAGE',
            'LED_WALL' => 'CORPORATE_FORUM_PACKAGE',
            'LED_WALL_ONLY' => 'CORPORATE_FORUM_PACKAGE',
            'LED' => 'CORPORATE_FORUM_PACKAGE',
            'LOUNGE' => 'EXECUTIVE_MEETING_PACKAGE',
            'VIP_LOUNGE' => 'EXECUTIVE_MEETING_PACKAGE',
            'VIP_LOUNGE_ONLY' => 'EXECUTIVE_MEETING_PACKAGE',
            'BOARDROOM' => 'EXECUTIVE_MEETING_PACKAGE',
            'BOARD_ROOM' => 'EXECUTIVE_MEETING_PACKAGE',
            'BOARD_ROOM_ONLY' => 'EXECUTIVE_MEETING_PACKAGE',
            'LOUNGE_BOARD' => 'EXECUTIVE_MEETING_PACKAGE',
            'LOUNGE_BOARDROOM' => 'EXECUTIVE_MEETING_PACKAGE',
            'LOUNGE_BOARD_ROOM' => 'EXECUTIVE_MEETING_PACKAGE',
            'LED_LOUNGE' => 'CORPORATE_FORUM_PACKAGE',
            'LED_BOARD' => 'CORPORATE_FORUM_PACKAGE',
            'LED_LOUNGE_BOARD' => 'CORPORATE_FORUM_PACKAGE',
        ];

        return $aliases[$code] ?? $code;
    }

    public static function find(?string $code): ?array
    {
        $code = self::normalizeCode($code);

        if (! $code) {
            return null;
        }

        return collect(self::defaults())->firstWhere('code', $code);
    }

    public static function exists(?string $code): bool
    {
        return self::find($code) !== null;
    }

    public static function areaKeys(?string $code): array
    {
        $package = self::find($code);

        if (! $package) {
            return [];
        }

        return ActiveVenueCatalog::sanitizeKeys($package['area_keys'] ?? []);
    }

    public static function rateSummary(array $areaKeys): array
    {
        return ActiveVenueCatalog::rateSummary($areaKeys);
    }

    public static function options(): array
    {
        return collect(self::defaults())
            ->map(function (array $package): array {
                $areaKeys = ActiveVenueCatalog::sanitizeKeys($package['area_keys'] ?? []);

                return [
                    'code' => $package['code'],
                    'name' => $package['name'],
                    'label' => $package['name'],
                    'subtitle' => $package['subtitle'] ?? null,
                    'description' => $package['description'] ?? null,
                    'notice' => $package['notice'] ?? null,
                    'capacity_min' => $package['capacity_min'] ?? null,
                    'capacity_max' => $package['capacity_max'] ?? null,
                    'area_keys' => $areaKeys,
                    'area_labels' => VenueAreaCatalog::displayNames($areaKeys),
                    'rates' => self::rateSummary($areaKeys),
                    'image_path' => $package['image_path'] ?? null,
                    'is_public' => (bool) ($package['is_public'] ?? true),
                    'is_featured' => (bool) ($package['is_featured'] ?? false),
                    'sort_order' => (int) ($package['sort_order'] ?? 0),
                ];
            })
            ->filter(fn (array $package): bool => ! empty($package['area_keys']) && ActiveVenueCatalog::validCombination($package['area_keys']))
            ->sortBy('sort_order')
            ->values()
            ->all();
    }
}
