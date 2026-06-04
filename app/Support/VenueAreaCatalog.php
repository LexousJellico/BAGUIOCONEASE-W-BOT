<?php

namespace App\Support;

final class VenueAreaCatalog
{
    /**
     * Booking statuses that actually reserve venue availability.
     *
     * Pending / for-review requests stay visible to staff/admin, but they do
     * not occupy AM/PM/EVE availability. This keeps booking first-come,
     * first-served: the first request with a confirmed payment becomes the
     * confirmed booking that blocks the venue. Pencil-booked remains blocking
     * because it is a manual priority/private reservation status.
     */
    public const BLOCKING_BOOKING_STATUSES = [
        'pencil_booked',
        'confirmed',
        'active',
    ];

    public static function normalizeLabel(?string $value): string
    {
        $value = mb_strtolower(trim((string) $value));
        $value = str_replace(['&', '/', '+'], [' and ', ' ', ' '], $value);
        $value = preg_replace('/[^a-z0-9]+/u', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    }

    public static function canonicalKey(?string $value): string
    {
        $normalized = str_replace(' ', '', self::normalizeLabel($value));

        if ($normalized === '') {
            return '';
        }

        $map = [
            'all' => 'whole_venue',
            'allarea' => 'whole_venue',
            'allareas' => 'whole_venue',
            'allspaces' => 'whole_venue',
            'allvenue' => 'whole_venue',
            'allvenues' => 'whole_venue',
            'any' => 'whole_venue',
            'anyarea' => 'whole_venue',
            'anyvenue' => 'whole_venue',
            'entirefacility' => 'whole_venue',
            'entireplace' => 'whole_venue',
            'entirevenue' => 'whole_venue',
            'global' => 'whole_venue',
            'whole' => 'whole_venue',
            'wholefacility' => 'whole_venue',
            'wholeplace' => 'whole_venue',
            'wholevenue' => 'whole_venue',

            'full' => 'full_hall',
            'fullhall' => 'full_hall',
            'fullhallonly' => 'full_hall',
            'fullhallpackage' => 'full_hall',
            'fullvenue' => 'full_hall',
            'wholehall' => 'full_hall',
            'entirehall' => 'full_hall',
            'conventionhall' => 'full_hall',

            'main' => 'main_hall',
            'mainhall' => 'main_hall',
            'mainfunctionhall' => 'main_hall',
            'mainvenue' => 'main_hall',
            'primaryhall' => 'main_hall',

            'led' => 'led_wall',
            'ledwall' => 'led_wall',
            'ledwalls' => 'led_wall',
            'ledscreen' => 'led_wall',
            'leddisplay' => 'led_wall',
            'digitaldisplay' => 'led_wall',

            'foyer' => 'foyer_lobby',
            'foyerarea' => 'foyer_lobby',
            'foyerlobby' => 'foyer_lobby',
            'foyerlobbyarea' => 'foyer_lobby',
            'foyerandlobby' => 'foyer_lobby',
            'foyerandlobbyarea' => 'foyer_lobby',
            'lobby' => 'foyer_lobby',
            'lobbyarea' => 'foyer_lobby',
            'lobbyfoyer' => 'foyer_lobby',

            'vip' => 'vip_lounge',
            'viplounge' => 'vip_lounge',
            'viploungearea' => 'vip_lounge',
            'viphall' => 'vip_lounge',
            'viproom' => 'vip_lounge',

            'board' => 'board_room',
            'boardroom' => 'board_room',
            'boardrm' => 'board_room',
            'meetingroom' => 'board_room',
            'conferenceroom' => 'board_room',

            'basement' => 'basement',
            'basementarea' => 'basement',

            'gallery' => 'gallery2600',
            'gallery2600' => 'gallery2600',
            'gallery2600area' => 'gallery2600',

            'grounds' => 'grounds_parking',
            'parking' => 'grounds_parking',
            'parkingarea' => 'grounds_parking',
            'groundsparking' => 'grounds_parking',
            'groundsandparking' => 'grounds_parking',

            'backstage' => 'backstage',
            'backstagearea' => 'backstage',
            'techbooth' => 'tech_booth',
            'technicalbooth' => 'tech_booth',
        ];

        return $map[$normalized] ?? $normalized;
    }

    public static function canonicalKeys(mixed $values): array
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
            ->unique()
            ->values()
            ->all();
    }

    public static function isGlobal(?string $value): bool
    {
        $label = self::normalizeLabel($value);

        if ($label === '') {
            return true;
        }

        return self::canonicalKey($value) === 'whole_venue';
    }

    public static function isWholeVenue(?string $value): bool
    {
        return self::canonicalKey($value) === 'whole_venue';
    }

    public static function matrix(): array
    {
        return [
            'whole_venue' => [
                'whole_venue',
                'full_hall',
                'main_hall',
                'led_wall',
                'foyer_lobby',
                'vip_lounge',
                'board_room',
                'basement',
                'gallery2600',
                'grounds_parking',
                'backstage',
                'tech_booth',
            ],
            // Full Hall is NOT VIP Lounge, Board Room, or LED Wall.
            // These are separate package/add-on selections and only conflict when explicitly selected.
            'full_hall' => [
                'whole_venue',
                'full_hall',
                'main_hall',
                'foyer_lobby',
                'grounds_parking',
                'backstage',
                'tech_booth',
            ],
            'main_hall' => ['whole_venue', 'full_hall', 'main_hall'],
            'led_wall' => ['whole_venue', 'led_wall'],
            'foyer_lobby' => ['whole_venue', 'full_hall', 'foyer_lobby'],
            'vip_lounge' => ['whole_venue', 'vip_lounge'],
            'board_room' => ['whole_venue', 'board_room'],
            'basement' => ['whole_venue', 'basement'],
            'gallery2600' => ['whole_venue', 'gallery2600'],
            'grounds_parking' => ['whole_venue', 'full_hall', 'grounds_parking'],
            'backstage' => ['whole_venue', 'full_hall', 'backstage'],
            'tech_booth' => ['whole_venue', 'full_hall', 'tech_booth'],
        ];
    }

    public static function overlaps(?string $candidate, ?string $selected): bool
    {
        if (self::isGlobal($candidate) || self::isGlobal($selected)) {
            return true;
        }

        $candidateKey = self::canonicalKey($candidate);
        $selectedKey = self::canonicalKey($selected);

        if ($candidateKey === '' || $selectedKey === '') {
            return false;
        }

        if ($candidateKey === $selectedKey) {
            return true;
        }

        $matrix = self::matrix();

        return in_array($selectedKey, $matrix[$candidateKey] ?? [], true)
            || in_array($candidateKey, $matrix[$selectedKey] ?? [], true);
    }

    public static function displayName(?string $value): string
    {
        return match (self::canonicalKey($value)) {
            'whole_venue' => 'All venue areas',
            'full_hall' => 'Full Hall',
            'main_hall' => 'Main Hall',
            'led_wall' => 'LED Wall',
            'foyer_lobby' => 'Foyer & Lobby Area',
            'vip_lounge' => 'VIP Lounge',
            'board_room' => 'Board Room',
            'basement' => 'Basement',
            'gallery2600' => 'Gallery2600',
            'grounds_parking' => 'Grounds & Parking',
            'backstage' => 'Backstage',
            'tech_booth' => 'Tech Booth',
            default => trim((string) $value),
        };
    }

    public static function displayNames(mixed $values): array
    {
        return collect(self::canonicalKeys($values))
            ->map(fn (string $key) => self::displayName($key))
            ->unique()
            ->values()
            ->all();
    }

    public static function activeSelectableKeys(): array
    {
        return ActiveVenueCatalog::activeKeys();
    }

    public static function isActiveSelectable(?string $value): bool
    {
        return ActiveVenueCatalog::isSelectableLabel($value);
    }

    public static function activeCanonicalKeys(mixed $values): array
    {
        return ActiveVenueCatalog::sanitizeKeys($values);
    }

    public static function publicOptions(): array
    {
        return ActiveVenueCatalog::options();
    }
}

