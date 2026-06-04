<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class BcccVenuePackageSeeder extends Seeder
{
    private array $currentAreas = [
        [
            'code' => 'FULL_HALL',
            'name' => 'Full Hall',
            'display_name' => 'Full Hall',
            'category' => 'package',
            'description' => 'Full Hall rental for large programs. VIP Lounge, Board Room, and LED Wall are separate add-ons/packages and are not automatically included. Foyer & Lobby and Backstage remain support spaces for approved movement and preparation.',
            'capacity' => 'Full convention capacity',
            'sort_order' => 10,
            'image' => '/marketing/images/events/darkmain.JPG',
            'support_notes' => [
                'Foyer & Lobby access is included as support space for guest flow and registration.',
                'Backstage access is included as support space for preparation and production movement.',
            ],
            'rates' => [
                'Whole Day' => [
                    'code' => 'FULL_HALL_WHOLE_DAY',
                    'price' => 80000,
                    'duration_key' => 'whole_day',
                    'uom' => 'booking',
                    'description' => 'Full Hall whole day rate. VIP Lounge, Board Room, and LED Wall are separate add-ons/packages.',
                    'sort_order' => 10,
                ],
                'Half Day' => [
                    'code' => 'FULL_HALL_HALF_DAY',
                    'price' => 45000,
                    'duration_key' => 'half_day',
                    'uom' => 'booking',
                    'description' => 'Full Hall half day rate. VIP Lounge, Board Room, and LED Wall are separate add-ons/packages.',
                    'sort_order' => 20,
                ],
                'Additional Hour' => [
                    'code' => 'FULL_HALL_ADDITIONAL_HOUR',
                    'price' => 5000,
                    'duration_key' => 'additional_hour',
                    'uom' => 'hour',
                    'description' => 'Full Hall additional hour rate. VIP Lounge, Board Room, and LED Wall are separate add-ons/packages.',
                    'sort_order' => 30,
                ],
            ],
        ],
        [
            'code' => 'MAIN_HALL',
            'name' => 'Main Hall',
            'display_name' => 'Main Hall',
            'category' => 'individual',
            'description' => 'Primary event hall for conferences, ceremonies, seminars, and formal programs.',
            'capacity' => 'Large audience setup',
            'sort_order' => 20,
            'image' => '/marketing/images/hero/noon2.jpg',
            'support_notes' => [],
            'rates' => [
                'Whole Day' => [
                    'code' => 'MAIN_HALL_WHOLE_DAY',
                    'price' => 60000,
                    'duration_key' => 'whole_day',
                    'uom' => 'booking',
                    'description' => 'Main Hall whole day rate.',
                    'sort_order' => 10,
                ],
                'Half Day' => [
                    'code' => 'MAIN_HALL_HALF_DAY',
                    'price' => 35000,
                    'duration_key' => 'half_day',
                    'uom' => 'booking',
                    'description' => 'Main Hall half day rate.',
                    'sort_order' => 20,
                ],
                'Additional Hour' => [
                    'code' => 'MAIN_HALL_ADDITIONAL_HOUR',
                    'price' => 5000,
                    'duration_key' => 'additional_hour',
                    'uom' => 'hour',
                    'description' => 'Main Hall additional hour rate.',
                    'sort_order' => 30,
                ],
            ],
        ],
        [
            'code' => 'LED_WALL',
            'name' => 'LED Wall',
            'display_name' => 'LED Wall',
            'category' => 'individual',
            'description' => 'Premium digital display support for presentations, branding, program visuals, and stage media.',
            'capacity' => 'Display support',
            'sort_order' => 30,
            'image' => '/marketing/images/facilities/darkvip.JPG',
            'support_notes' => [],
            'rates' => [
                'Whole Day' => [
                    'code' => 'LED_WALL_WHOLE_DAY',
                    'price' => 30000,
                    'duration_key' => 'whole_day',
                    'uom' => 'booking',
                    'description' => 'LED Wall whole day rate.',
                    'sort_order' => 10,
                ],
                'Half Day' => [
                    'code' => 'LED_WALL_HALF_DAY',
                    'price' => 15000,
                    'duration_key' => 'half_day',
                    'uom' => 'booking',
                    'description' => 'LED Wall half day rate.',
                    'sort_order' => 20,
                ],
                'Additional Hour' => [
                    'code' => 'LED_WALL_ADDITIONAL_HOUR',
                    'price' => 3500,
                    'duration_key' => 'additional_hour',
                    'uom' => 'hour',
                    'description' => 'LED Wall additional hour rate.',
                    'sort_order' => 30,
                ],
            ],
        ],
        [
            'code' => 'VIP_LOUNGE',
            'name' => 'VIP Lounge',
            'display_name' => 'VIP Lounge',
            'category' => 'individual',
            'description' => 'Executive support area for dignitaries, speakers, guests of honor, and protocol preparation.',
            'capacity' => 'Executive guest area',
            'sort_order' => 40,
            'image' => '/marketing/images/facilities/darkvip.JPG',
            'support_notes' => [],
            'rates' => [
                'Whole Day' => [
                    'code' => 'VIP_LOUNGE_WHOLE_DAY',
                    'price' => 6000,
                    'duration_key' => 'whole_day',
                    'uom' => 'booking',
                    'description' => 'VIP Lounge whole day rate.',
                    'sort_order' => 10,
                ],
                'Half Day' => [
                    'code' => 'VIP_LOUNGE_HALF_DAY',
                    'price' => 3500,
                    'duration_key' => 'half_day',
                    'uom' => 'booking',
                    'description' => 'VIP Lounge half day rate.',
                    'sort_order' => 20,
                ],
                'Additional Hour' => [
                    'code' => 'VIP_LOUNGE_ADDITIONAL_HOUR',
                    'price' => 500,
                    'duration_key' => 'additional_hour',
                    'uom' => 'hour',
                    'description' => 'VIP Lounge additional hour rate.',
                    'sort_order' => 30,
                ],
            ],
        ],
        [
            'code' => 'BOARD_ROOM',
            'name' => 'Board Room',
            'display_name' => 'Board Room',
            'category' => 'individual',
            'description' => 'Private room for briefings, planning sessions, committees, and focused meetings.',
            'capacity' => 'Small meeting setup',
            'sort_order' => 50,
            'image' => '/marketing/images/facilities/darkvip.JPG',
            'support_notes' => [],
            'rates' => [
                'Whole Day' => [
                    'code' => 'BOARD_ROOM_WHOLE_DAY',
                    'price' => 6000,
                    'duration_key' => 'whole_day',
                    'uom' => 'booking',
                    'description' => 'Board Room whole day rate.',
                    'sort_order' => 10,
                ],
                'Half Day' => [
                    'code' => 'BOARD_ROOM_HALF_DAY',
                    'price' => 3500,
                    'duration_key' => 'half_day',
                    'uom' => 'booking',
                    'description' => 'Board Room half day rate.',
                    'sort_order' => 20,
                ],
                'Additional Hour' => [
                    'code' => 'BOARD_ROOM_ADDITIONAL_HOUR',
                    'price' => 500,
                    'duration_key' => 'additional_hour',
                    'uom' => 'hour',
                    'description' => 'Board Room additional hour rate.',
                    'sort_order' => 30,
                ],
            ],
        ],
    ];

    private array $oldAreaNames = [
        'Foyer & Lobby',
        'Foyer & Lobby Area',
        'Foyer and Lobby',
        'Foyer and Lobby Area',
        'Backstage',
        'Back Stage',
        'Basement',
        'Gallery2600',
        'Gallery 2600',
        'Grounds & Parking',
        'Grounds and Parking',
        'Grounds/Parking Area',
        'Tech Booth',
        'Technical Booth',
        'Dressing Room',
        'Dressing Rooms',
        'Lobby/Foyer',
        'VIP Lounge - 1',
        'VIP Lounge - 2',
        'Lobby Receiving Room',
        'Basement Function Room',
        'Basement Hall - Half',
        'Whole Basement',
        'Shop Rentals',
        'Shop Rental',
        'Catering Maintenance Fee',
        'Air Conditioning',
        'Stationery Kit',
    ];

    public function run(): void
    {
        if (! Schema::hasTable('service_types') || ! Schema::hasTable('services')) {
            $this->command?->warn('Skipped BCCC venue package seeding because service_types or services table does not exist.');
            return;
        }

        DB::transaction(function () {
            $this->deactivateOldAreas();

            foreach ($this->currentAreas as $area) {
                $serviceTypeId = $this->upsertServiceType($area);

                foreach ($area['rates'] as $rateName => $rate) {
                    $this->upsertService($serviceTypeId, $area, $rateName, $rate);
                }
            }
        });
    }

    private function upsertServiceType(array $area): int
    {
        $table = 'service_types';

        $match = $this->hasColumn($table, 'code')
            ? ['code' => $area['code']]
            : ['name' => $area['name']];

        $payload = [
            'name' => $area['name'],
            'description' => $area['description'],
            'sort_order' => $area['sort_order'],
            'is_active' => true,
            'active' => true,
            'status' => 'active',
            'code' => $area['code'],
            'slug' => Str::slug($area['name']),
            'display_name' => $area['display_name'],
            'label' => $area['display_name'],
            'category' => $area['category'],
            'capacity' => $area['capacity'],
            'image' => $area['image'],
            'image_path' => $area['image'],
            'meta' => [
                'booking_key' => $area['code'],
                'category' => $area['category'],
                'display_name' => $area['display_name'],
                'support_notes' => $area['support_notes'],
                'seeded_by' => static::class,
            ],
            'metadata' => [
                'booking_key' => $area['code'],
                'category' => $area['category'],
                'display_name' => $area['display_name'],
                'support_notes' => $area['support_notes'],
                'seeded_by' => static::class,
            ],
        ];

        $payload = $this->filterPayload($table, $payload);

        DB::table($table)->updateOrInsert($match, $payload);

        return (int) DB::table($table)->where($match)->value('id');
    }

    private function upsertService(int $serviceTypeId, array $area, string $rateName, array $rate): void
    {
        $table = 'services';

        $match = $this->hasColumn($table, 'code')
            ? ['code' => $rate['code']]
            : [
                'service_type_id' => $serviceTypeId,
                'name' => $rateName,
            ];

        $price = $rate['price'];
        $uom = $rate['uom'];

        $payload = [
            'service_type_id' => $serviceTypeId,
            'name' => $rateName,
            'description' => $rate['description'],
            'sort_order' => $rate['sort_order'],

            'is_active' => true,
            'active' => true,
            'status' => 'active',

            'code' => $rate['code'],
            'slug' => Str::slug($area['name'] . '-' . $rateName),
            'label' => $area['display_name'] . ' · ' . $rateName,

            'price' => $price,
            'rate' => $price,
            'amount' => $price,
            'base_price' => $price,
            'base_rate' => $price,

            /*
             * Required by your current services table.
             */
            'quantity' => 1,
            'qty' => 1,
            'minimum_quantity' => 1,
            'maximum_quantity' => 1,

            /*
             * Required by your current services table.
             */
            'uom' => $uom,
            'unit' => $uom,
            'unit_of_measure' => $uom,

            'duration_type' => $rate['duration_key'],
            'duration_key' => $rate['duration_key'],

            'meta' => [
                'booking_key' => $area['code'],
                'area_label' => $area['display_name'],
                'duration_key' => $rate['duration_key'],
                'category' => $area['category'],
                'support_notes' => $area['support_notes'],
                'seeded_by' => static::class,
            ],
            'metadata' => [
                'booking_key' => $area['code'],
                'area_label' => $area['display_name'],
                'duration_key' => $rate['duration_key'],
                'category' => $area['category'],
                'support_notes' => $area['support_notes'],
                'seeded_by' => static::class,
            ],
        ];

        $payload = $this->filterPayload($table, $payload);

        DB::table($table)->updateOrInsert($match, $payload);
    }

    private function deactivateOldAreas(): void
    {
        $serviceTypeTable = 'service_types';
        $serviceTable = 'services';

        $oldTypeIds = DB::table($serviceTypeTable)
            ->whereIn('name', $this->oldAreaNames)
            ->pluck('id')
            ->filter()
            ->values();

        if ($oldTypeIds->isEmpty()) {
            return;
        }

        $serviceDeactivatePayload = $this->filterPayload($serviceTable, [
            'is_active' => false,
            'active' => false,
            'status' => 'inactive',
        ]);

        if (! empty($serviceDeactivatePayload) && $this->hasColumn($serviceTable, 'service_type_id')) {
            DB::table($serviceTable)
                ->whereIn('service_type_id', $oldTypeIds)
                ->update($serviceDeactivatePayload);
        }

        $typeDeactivatePayload = $this->filterPayload($serviceTypeTable, [
            'is_active' => false,
            'active' => false,
            'status' => 'inactive',
            'sort_order' => 999,
        ]);

        if (! empty($typeDeactivatePayload)) {
            DB::table($serviceTypeTable)
                ->whereIn('id', $oldTypeIds)
                ->update($typeDeactivatePayload);
        }
    }

    private function filterPayload(string $table, array $payload): array
{
    $filtered = [];

    foreach ($payload as $column => $value) {
        if (! $this->hasColumn($table, $column)) {
            continue;
        }

        if (is_array($value)) {
            $filtered[$column] = json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            continue;
        }

        $filtered[$column] = $value;
    }

    /*
     * Safety defaults for old/local database columns that are NOT nullable
     * and do not have database defaults.
     */
    foreach ($this->requiredColumnsWithoutDefaults($table) as $column) {
        if (array_key_exists($column, $filtered)) {
            continue;
        }

        $default = $this->defaultValueForRequiredColumn($column, $table);

        if ($default !== null) {
            $filtered[$column] = $default;
        }
    }

    if ($this->hasColumn($table, 'updated_at')) {
        $filtered['updated_at'] = now();
    }

    if ($this->hasColumn($table, 'created_at')) {
        $filtered['created_at'] = $filtered['created_at'] ?? now();
    }

    return $filtered;
}

private function requiredColumnsWithoutDefaults(string $table): array
{
    $database = DB::getDatabaseName();

    $columns = DB::select(
        '
        SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
        ',
        [$database, $table],
    );

    return collect($columns)
        ->filter(function ($column) {
            if ($column->IS_NULLABLE === 'YES') {
                return false;
            }

            if ($column->COLUMN_DEFAULT !== null) {
                return false;
            }

            if (str_contains(strtolower((string) $column->EXTRA), 'auto_increment')) {
                return false;
            }

            return true;
        })
        ->pluck('COLUMN_NAME')
        ->filter(fn ($column) => ! in_array($column, ['id', 'created_at', 'updated_at'], true))
        ->values()
        ->all();
}

private function defaultValueForRequiredColumn(string $column, string $table): mixed
{
    return match ($column) {
        'quantity', 'qty', 'minimum_quantity', 'maximum_quantity' => 1,

        'uom', 'unit', 'unit_of_measure' => 'booking',

        'price', 'rate', 'amount', 'base_price', 'base_rate', 'subtotal', 'total', 'total_amount' => 0,

        'is_active', 'active', 'is_available', 'is_visible', 'homepage_visible' => true,

        'sort_order', 'display_order', 'position' => 0,

        'status' => 'active',
        'type' => 'venue',
        'category' => 'venue',
        'currency' => 'PHP',

        'name', 'title', 'label' => 'BCCC Service',
        'description' => '',

        default => $this->fallbackDefaultForColumn($table, $column),
    };
}

private function fallbackDefaultForColumn(string $table, string $column): mixed
{
    $database = DB::getDatabaseName();

    $result = DB::selectOne(
        '
        SELECT DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        ',
        [$database, $table, $column],
    );

    $type = strtolower((string) ($result->DATA_TYPE ?? ''));

    if (in_array($type, ['int', 'bigint', 'smallint', 'mediumint', 'tinyint'], true)) {
        return 0;
    }

    if (in_array($type, ['decimal', 'double', 'float'], true)) {
        return 0;
    }

    if (in_array($type, ['json'], true)) {
        return json_encode([]);
    }

    if (in_array($type, ['date'], true)) {
        return now()->toDateString();
    }

    if (in_array($type, ['datetime', 'timestamp'], true)) {
        return now();
    }

    if (in_array($type, ['boolean', 'bool'], true)) {
        return false;
    }

    return '';
}
    private function hasColumn(string $table, string $column): bool
    {
        return Schema::hasColumn($table, $column);
    }
}
