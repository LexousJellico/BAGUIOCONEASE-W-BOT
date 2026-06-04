<?php

namespace App\Support;

final class DressingRoomCatalog
{
    public const NONE = 'none';
    public const ROOM_1 = 'dressing_room_1';
    public const ROOM_2 = 'dressing_room_2';
    public const ROOM_1_AND_2 = 'dressing_room_1_and_2';

    public static function options(): array
    {
        return [
            self::NONE => [
                'value' => self::NONE,
                'label' => 'No dressing room',
                'rooms' => [],
                'charge' => 0.0,
            ],
            self::ROOM_1 => [
                'value' => self::ROOM_1,
                'label' => 'Dressing Room 1',
                'rooms' => ['Dressing Room 1'],
                'charge' => 1000.0,
            ],
            self::ROOM_2 => [
                'value' => self::ROOM_2,
                'label' => 'Dressing Room 2',
                'rooms' => ['Dressing Room 2'],
                'charge' => 1000.0,
            ],
            self::ROOM_1_AND_2 => [
                'value' => self::ROOM_1_AND_2,
                'label' => 'Dressing Room 1 & 2',
                'rooms' => ['Dressing Room 1', 'Dressing Room 2'],
                'charge' => 2000.0,
            ],
        ];
    }

    public static function normalize(?string $value): string
    {
        $value = strtolower(trim((string) $value));
        $value = str_replace([' ', '-', '&', '/'], ['_', '_', 'and', '_'], $value);
        $value = preg_replace('/_+/', '_', $value) ?? '';
        $value = trim($value, '_');

        return match ($value) {
            '1', 'room_1', 'dressing_room1', 'dressing_room_1' => self::ROOM_1,
            '2', 'room_2', 'dressing_room2', 'dressing_room_2' => self::ROOM_2,
            '12', '1_2', '1and2', '1_and_2', 'room_1_2', 'room_1_and_2', 'dressing_room_1_2', 'dressing_room_1_and_2' => self::ROOM_1_AND_2,
            default => self::NONE,
        };
    }

    public static function charge(?string $value): float
    {
        $key = self::normalize($value);

        return (float) (self::options()[$key]['charge'] ?? 0.0);
    }

    public static function chargeForDays(?string $value, int $days): float
    {
        return self::charge($value) * max(0, $days);
    }

    public static function label(?string $value): string
    {
        $key = self::normalize($value);

        return (string) (self::options()[$key]['label'] ?? 'No dressing room');
    }
}
