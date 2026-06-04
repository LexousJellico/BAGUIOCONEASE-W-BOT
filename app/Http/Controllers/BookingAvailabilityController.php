<?php

namespace App\Http\Controllers;

use App\Services\BookingService;
use App\Support\VenueAreaCatalog;
use App\Support\VenuePackageCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingAvailabilityController extends Controller
{
    public function __construct(
        protected BookingService $bookings,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'venue' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'package_code' => ['nullable', 'string', 'max:80'],
            'selected_package_code' => ['nullable', 'string', 'max:80'],
            'area_keys' => ['nullable', 'array'],
            'area_keys.*' => ['string', 'max:80'],
            'selected_area_keys' => ['nullable', 'array'],
            'selected_area_keys.*' => ['string', 'max:80'],
            'service_id' => ['nullable', 'integer', 'min:1'],
            'service_type_id' => ['nullable', 'integer', 'min:1'],
            'area_id' => ['nullable', 'integer', 'min:1'],
            'exclude_booking_id' => ['nullable', 'integer', 'min:1'],
            'event_type' => ['nullable', 'string', 'max:255'],
            'guests' => ['nullable', 'integer', 'min:1', 'max:200000'],
        ]);

        $date = (string) $data['date'];
        $venue = $this->resolveVenue($data);
        $packageCode = VenuePackageCatalog::normalizeCode($data['package_code'] ?? $data['selected_package_code'] ?? null);
        $areaKeys = $this->resolveAreaKeys($data, $packageCode);
        $excludeBookingId = isset($data['exclude_booking_id']) ? (int) $data['exclude_booking_id'] : null;
        $eventType = isset($data['event_type']) ? trim((string) $data['event_type']) : null;
        $guests = isset($data['guests']) ? (int) $data['guests'] : null;

        try {
            $result = ! empty($areaKeys)
                ? $this->bookings->getPackageDayStatus($date, $areaKeys, $excludeBookingId, $eventType, $guests)
                : $this->bookings->getPublicDayStatus($date, $venue, $excludeBookingId, $eventType, $guests);
        } catch (\Throwable $exception) {
            report($exception);

            $result = $this->unverified($date, $venue, $areaKeys);
        }

        $blocks = $this->normalizeBlocks($result['blocks'] ?? []);

        return response()->json([
            'date' => $date,
            'venue' => $venue !== '' ? $venue : ($result['venue'] ?? ''),
            'package_code' => $packageCode,
            'area_keys' => $areaKeys,
            'area_labels' => VenueAreaCatalog::displayNames($areaKeys),
            'status' => $this->normalizeStatus((string) ($result['status'] ?? 'unverified'), $blocks),
            'title' => $result['title'] ?? 'Availability checked',
            'description' => $result['description'] ?? 'Availability was checked for the selected date.',
            'note' => $result['note'] ?? '',
            'can_proceed' => (bool) ($result['can_proceed'] ?? false),
            'blocks' => $blocks,
            'busy' => array_values((array) ($result['busy'] ?? [])),
            'free' => array_values((array) ($result['free'] ?? [])),
            'event_titles' => array_values((array) ($result['event_titles'] ?? [])),
            'calendar_blocks' => array_values((array) ($result['calendar_blocks'] ?? [])),
            'areas' => array_values((array) ($result['areas'] ?? [])),
            'is_fully_booked' => collect($blocks)->every(fn (array $block) => ! $block['is_available']),
            'isFullyBooked' => collect($blocks)->every(fn (array $block) => ! $block['is_available']),
        ]);
    }

    protected function resolveVenue(array $data): string
    {
        $venue = trim((string) ($data['venue'] ?? $data['area'] ?? ''));

        if ($venue !== '') {
            return $venue;
        }

        if (! empty($data['area_id'])) {
            return 'area:'.$data['area_id'];
        }

        if (! empty($data['service_type_id'])) {
            return 'service-type:'.$data['service_type_id'];
        }

        if (! empty($data['service_id'])) {
            return 'service:'.$data['service_id'];
        }

        return '';
    }

    protected function resolveAreaKeys(array $data, ?string $packageCode): array
    {
        $keys = [];

        if ($packageCode) {
            $keys = array_merge($keys, VenuePackageCatalog::areaKeys($packageCode));
        }

        $keys = array_merge($keys, VenueAreaCatalog::canonicalKeys($data['area_keys'] ?? []));
        $keys = array_merge($keys, VenueAreaCatalog::canonicalKeys($data['selected_area_keys'] ?? []));

        return collect($keys)->filter()->unique()->values()->all();
    }

    protected function normalizeBlocks(mixed $blocks): array
    {
        $defaults = $this->defaultBlocks();

        if (! is_array($blocks) || $blocks === []) {
            return array_values($defaults);
        }

        $normalized = [];

        foreach ($blocks as $key => $block) {
            if (is_bool($block)) {
                $blockKey = strtoupper((string) $key);

                if (! isset($defaults[$blockKey])) {
                    continue;
                }

                $normalized[$blockKey] = [
                    ...$defaults[$blockKey],
                    'is_available' => $block,
                    'isAvailable' => $block,
                    'booked' => ! $block,
                    'blocked' => false,
                    'reason' => $block ? null : 'Booked or blocked',
                ];

                continue;
            }

            if (! is_array($block)) {
                continue;
            }

            $blockKey = strtoupper((string) ($block['key'] ?? $key));

            if (! isset($defaults[$blockKey])) {
                continue;
            }

            $unavailableByFlag = (bool) ($block['booked'] ?? false) || (bool) ($block['blocked'] ?? false);

            $explicitAvailable = array_key_exists('is_available', $block)
                ? (bool) $block['is_available']
                : (array_key_exists('isAvailable', $block) ? (bool) $block['isAvailable'] : true);

            $isAvailable = $explicitAvailable && ! $unavailableByFlag;

            $normalized[$blockKey] = [
                'key' => $blockKey,
                'label' => (string) ($block['label'] ?? $defaults[$blockKey]['label']),
                'from' => (string) ($block['from'] ?? $defaults[$blockKey]['from']),
                'to' => (string) ($block['to'] ?? $defaults[$blockKey]['to']),
                'is_available' => $isAvailable,
                'isAvailable' => $isAvailable,
                'booked' => (bool) ($block['booked'] ?? (! $isAvailable && ! ($block['blocked'] ?? false))),
                'blocked' => (bool) ($block['blocked'] ?? false),
                'reason' => $block['reason'] ?? ($isAvailable ? null : 'Booked or blocked'),
            ];
        }

        return collect(['AM', 'PM', 'EVE'])
            ->map(fn (string $key) => $normalized[$key] ?? $defaults[$key])
            ->values()
            ->all();
    }

    protected function defaultBlocks(): array
    {
        return [
            'AM' => [
                'key' => 'AM',
                'label' => 'Morning',
                'from' => '06:00',
                'to' => '12:00',
                'is_available' => true,
                'isAvailable' => true,
                'booked' => false,
                'blocked' => false,
                'reason' => null,
            ],
            'PM' => [
                'key' => 'PM',
                'label' => 'Afternoon',
                'from' => '12:00',
                'to' => '18:00',
                'is_available' => true,
                'isAvailable' => true,
                'booked' => false,
                'blocked' => false,
                'reason' => null,
            ],
            'EVE' => [
                'key' => 'EVE',
                'label' => 'Evening extension',
                'from' => '18:00',
                'to' => '23:59',
                'is_available' => true,
                'isAvailable' => true,
                'booked' => false,
                'blocked' => false,
                'reason' => null,
            ],
        ];
    }

    protected function normalizeStatus(string $status, array $blocks): string
    {
        $status = strtolower(trim(str_replace('-', '_', $status)));

        if (in_array($status, ['unverified', 'error', 'failed'], true)) {
            return 'unverified';
        }

        if ($status === 'blocked') {
            return 'blocked';
        }

        if (in_array($status, ['private_booked', 'reserved', 'full', 'fully_booked'], true)) {
            return 'private_booked';
        }

        if (in_array($status, ['public_booked', 'public_event', 'public'], true)) {
            return 'public_booked';
        }

        if (in_array($status, ['limited', 'partial', 'partially_booked'], true)) {
            return 'limited';
        }

        $closed = collect($blocks)->filter(fn (array $block) => ! $block['is_available'])->count();

        if ($closed >= 3) {
            return 'private_booked';
        }

        if ($closed > 0) {
            return 'limited';
        }

        return 'available';
    }

    protected function unverified(string $date, string $venue, array $areaKeys = []): array
    {
        return [
            'date' => $date,
            'venue' => $venue,
            'area_keys' => $areaKeys,
            'status' => 'unverified',
            'title' => 'Unable to verify availability',
            'description' => 'The system could not safely verify this schedule. Please try again or contact the BCCC office.',
            'note' => 'For safety, the system will not mark this date as available until verification succeeds.',
            'can_proceed' => false,
            'blocks' => collect($this->defaultBlocks())
                ->map(fn (array $block) => [
                    ...$block,
                    'is_available' => false,
                    'isAvailable' => false,
                    'blocked' => true,
                    'reason' => 'Availability could not be verified.',
                ])
                ->values()
                ->all(),
            'busy' => [],
            'free' => [],
            'event_titles' => [],
            'calendar_blocks' => [],
        ];
    }
}
