<?php

namespace App\Support;

final class VenueRateCatalog
{
    public const BLOCK_WHOLE_DAY = ActiveVenueCatalog::DURATION_WHOLE_DAY;
    public const BLOCK_HALF_DAY = ActiveVenueCatalog::DURATION_HALF_DAY;
    public const BLOCK_ADDITIONAL_HOUR = ActiveVenueCatalog::DURATION_ADDITIONAL_HOUR;

    public static function rates(): array
    {
        return ActiveVenueCatalog::rates();
    }

    public static function forArea(?string $area): ?array
    {
        return ActiveVenueCatalog::rate($area);
    }

    public static function amount(?string $area, ?string $duration): float
    {
        return ActiveVenueCatalog::amount($area, $duration);
    }

    public static function normalizeDuration(?string $duration): string
    {
        return ActiveVenueCatalog::normalizeDuration($duration);
    }

    public static function options(): array
    {
        return ActiveVenueCatalog::options();
    }

    public static function packageAmount(array $areaKeys, ?string $duration): float
    {
        return ActiveVenueCatalog::packageAmount($areaKeys, $duration);
    }

    public static function money(float|int $amount): string
    {
        return ActiveVenueCatalog::money($amount);
    }
}
