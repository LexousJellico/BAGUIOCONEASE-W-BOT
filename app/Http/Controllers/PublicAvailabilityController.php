<?php

namespace App\Http\Controllers;

use App\Services\BookingService;
use App\Support\VenueAreaCatalog;
use App\Support\VenuePackageCatalog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PublicAvailabilityController extends Controller
{
    public function __construct(
        protected BookingService $bookings,
    ) {}

    public function check(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['nullable'],
            'start_date' => ['nullable'],
            'end_date' => ['nullable'],
            'date_from' => ['nullable'],
            'date_to' => ['nullable'],
            'venue' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'package_code' => ['nullable', 'string', 'max:80'],
            'selected_package_code' => ['nullable', 'string', 'max:80'],
            'area_keys' => ['nullable', 'array'],
            'area_keys.*' => ['string', 'max:80'],
            'selected_area_keys' => ['nullable', 'array'],
            'selected_area_keys.*' => ['string', 'max:80'],
            'event_type' => ['nullable', 'string', 'max:255'],
            'guests' => ['nullable', 'integer', 'min:1', 'max:200000'],
            'exclude_booking_id' => ['nullable', 'integer', 'min:1'],
        ]);

        [$from, $to] = $this->resolveDateRange($data);

        if (! $from || ! $to) {
            throw ValidationException::withMessages([
                'date' => 'Please provide a valid date or date range.',
            ]);
        }

        if ($to->lt($from)) {
            throw ValidationException::withMessages([
                'end_date' => 'The end date must be the same as or later than the start date.',
            ]);
        }

        $days = (int) $from->diffInDays($to) + 1;

        if ($days > 31) {
            throw ValidationException::withMessages([
                'end_date' => 'Please limit public availability checks to 31 days or fewer.',
            ]);
        }

        $venue = trim((string) ($data['venue'] ?? $data['area'] ?? ''));
        $packageCode = VenuePackageCatalog::normalizeCode($data['package_code'] ?? $data['selected_package_code'] ?? null);
        $areaKeys = $this->resolveAreaKeys($data, $packageCode);

        if ($venue === '' && empty($areaKeys)) {
            throw ValidationException::withMessages([
                'venue' => 'Please select a venue area or package.',
            ]);
        }

        $eventType = isset($data['event_type']) && trim((string) $data['event_type']) !== ''
            ? trim((string) $data['event_type'])
            : null;

        $guests = isset($data['guests']) && $data['guests'] !== null
            ? (int) $data['guests']
            : null;

        $excludeBookingId = isset($data['exclude_booking_id']) && $data['exclude_booking_id'] !== null
            ? (int) $data['exclude_booking_id']
            : null;

        $results = [];

        for ($cursor = $from->copy(); $cursor->lte($to); $cursor->addDay()) {
            $date = $cursor->format('Y-m-d');

            $results[] = $this->normalizeDayResult(
                $this->safeDayStatus(
                    date: $date,
                    venue: $venue,
                    excludeBookingId: $excludeBookingId,
                    eventType: $eventType,
                    guests: $guests,
                    areaKeys: $areaKeys,
                ),
                $date,
                $venue,
                $eventType,
                $guests,
            );
        }

        if (count($results) === 1 && ! $this->isRangeRequest($request)) {
            return response()->json($results[0]);
        }

        return response()->json(
            $this->summarizeRange(
                results: $results,
                from: $from,
                to: $to,
                venue: $venue,
                eventType: $eventType,
                guests: $guests,
            )
        );
    }

    public function month(Request $request): JsonResponse
    {
        $data = $request->validate([
            'month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'venue' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
        ]);

        $venue = trim((string) ($data['venue'] ?? $data['area'] ?? ''));

        try {
            $days = $this->bookings->getPublicMonthCalendar(
                $data['month'],
                $venue !== '' ? $venue : null,
            );
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Invalid month format. Use YYYY-MM.',
            ], 422);
        }

        $normalizedDays = collect($days)
            ->map(fn (array $day) => $this->normalizeDayResult(
                result: $day,
                date: (string) ($day['date'] ?? ''),
                venue: (string) ($day['venue'] ?? $venue),
                eventType: $day['event_type'] ?? null,
                guests: isset($day['guests']) ? (int) $day['guests'] : null,
            ))
            ->values()
            ->all();

        return response()->json([
            'month' => $data['month'],
            'venue' => $venue !== '' ? $venue : null,
            'days' => $normalizedDays,
        ]);
    }

    protected function safeDayStatus(
        string $date,
        string $venue,
        ?int $excludeBookingId,
        ?string $eventType,
        ?int $guests,
        array $areaKeys = [],
    ): array {
        try {
            if (! empty($areaKeys)) {
                return $this->bookings->getPackageDayStatus(
                    $date,
                    $areaKeys,
                    $excludeBookingId,
                    $eventType,
                    $guests,
                );
            }

            return $this->bookings->getPublicDayStatus(
                $date,
                $venue,
                $excludeBookingId,
                $eventType,
                $guests,
            );
        } catch (\ArgumentCountError) {
            try {
                return $this->bookings->getPublicDayStatus(
                    $date,
                    $venue,
                    $excludeBookingId,
                );
            } catch (\Throwable $exception) {
                report($exception);

                return $this->fallbackUnavailableDay($date, $venue, $eventType, $guests, $areaKeys);
            }
        } catch (\Throwable $exception) {
            report($exception);

            return $this->fallbackUnavailableDay($date, $venue, $eventType, $guests, $areaKeys);
        }
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

    protected function resolveDateRange(array $data): array
    {
        $date = $this->dateOnly($data['date'] ?? null);

        $from = $this->dateOnly(
            $data['start_date']
                ?? $data['date_from']
                ?? $date?->format('Y-m-d')
                ?? null
        );

        $to = $this->dateOnly(
            $data['end_date']
                ?? $data['date_to']
                ?? $data['start_date']
                ?? $data['date_from']
                ?? $date?->format('Y-m-d')
                ?? null
        );

        return [$from, $to];
    }

    protected function dateOnly(mixed $value): ?Carbon
    {
        if ($value instanceof Carbon) {
            return $value->copy()->startOfDay();
        }

        if ($value === null || trim((string) $value) === '') {
            return null;
        }

        $value = trim((string) $value);

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1) {
            return Carbon::createFromFormat('Y-m-d', $value)->startOfDay();
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/', $value) === 1) {
            return Carbon::createFromFormat('Y-m-d', substr($value, 0, 10))->startOfDay();
        }

        try {
            return Carbon::parse($value)->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }

    protected function isRangeRequest(Request $request): bool
    {
        return $request->filled('start_date')
            || $request->filled('end_date')
            || $request->filled('date_from')
            || $request->filled('date_to');
    }

    protected function normalizeDayResult(
        array $result,
        string $date,
        string $venue,
        ?string $eventType = null,
        ?int $guests = null,
    ): array {
        $resolvedDate = (string) ($result['date'] ?? $date);
        $resolvedVenue = trim((string) ($result['venue'] ?? $venue));
        $status = $this->normalizeStatus((string) ($result['status'] ?? 'available'));
        $blocks = $this->normalizeBlocks($result['blocks'] ?? []);

        if ($status === 'available' && $this->closedBlockCount($blocks) > 0) {
            $status = $this->closedBlockCount($blocks) >= 3 ? 'private_booked' : 'limited';
        }

        $canProceed = (bool) ($result['can_proceed'] ?? ! in_array($status, ['blocked', 'private_booked'], true));

        return [
            'date' => $resolvedDate,
            'venue' => $resolvedVenue,
            'event_type' => $result['event_type'] ?? $eventType,
            'event_type_classification' => $result['event_type_classification'] ?? 'general',
            'guests' => $result['guests'] ?? $guests,
            'status' => $status,
            'title' => (string) ($result['title'] ?? $this->defaultTitle($status)),
            'description' => (string) ($result['description'] ?? $this->defaultDescription($status)),
            'note' => (string) ($result['note'] ?? $this->defaultNote($status)),
            'recommended_action' => (string) ($result['recommended_action'] ?? $this->defaultRecommendedAction($status)),
            'can_proceed' => $canProceed,
            'blocks' => $blocks,
            'busy' => array_values((array) ($result['busy'] ?? [])),
            'free' => array_values((array) ($result['free'] ?? [])),
            'is_fully_booked' => (bool) ($result['is_fully_booked'] ?? $this->closedBlockCount($blocks) >= 3),
            'isFullyBooked' => (bool) ($result['isFullyBooked'] ?? $result['is_fully_booked'] ?? $this->closedBlockCount($blocks) >= 3),
            'event_titles' => array_values(array_filter((array) ($result['event_titles'] ?? []))),
            'calendar_blocks' => array_values((array) ($result['calendar_blocks'] ?? [])),
            'venue_capacity_ok' => $result['venue_capacity_ok'] ?? null,
            'venue_capacity_message' => $result['venue_capacity_message'] ?? null,
            'matching_services' => array_values((array) ($result['matching_services'] ?? [])),
            'capacity_reasons' => array_values((array) ($result['capacity_reasons'] ?? [])),
        ];
    }

    protected function normalizeBlocks(mixed $blocks): array
    {
        $defaults = $this->defaultBlocks();

        if (! is_array($blocks) || $blocks === []) {
            return $defaults;
        }

        $normalized = [];

        foreach ($blocks as $key => $block) {
            if (is_bool($block)) {
                $blockKey = strtoupper((string) $key);

                $normalized[$blockKey] = [
                    'key' => $blockKey,
                    'label' => $this->blockLabel($blockKey),
                    'from' => $this->blockFrom($blockKey),
                    'to' => $this->blockTo($blockKey),
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

            if (! in_array($blockKey, ['AM', 'PM', 'EVE'], true)) {
                continue;
            }

            $unavailableByFlag = (bool) ($block['booked'] ?? false) || (bool) ($block['blocked'] ?? false);
            $explicitAvailable = array_key_exists('is_available', $block)
                ? (bool) $block['is_available']
                : (array_key_exists('isAvailable', $block) ? (bool) $block['isAvailable'] : true);

            $isAvailable = $explicitAvailable && ! $unavailableByFlag;

            $normalized[$blockKey] = [
                'key' => $blockKey,
                'label' => (string) ($block['label'] ?? $this->blockLabel($blockKey)),
                'from' => (string) ($block['from'] ?? $this->blockFrom($blockKey)),
                'to' => (string) ($block['to'] ?? $this->blockTo($blockKey)),
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
                'label' => 'Evening',
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

    protected function summarizeRange(
        array $results,
        Carbon $from,
        Carbon $to,
        string $venue,
        ?string $eventType,
        ?int $guests,
    ): array {
        $status = $this->rangeStatus($results);

        $canProceed = collect($results)->every(
            fn (array $day) => ($day['can_proceed'] ?? false) !== false
        );

        $daysCount = count($results);

        $availableDays = collect($results)
            ->filter(fn (array $day) => ($day['status'] ?? '') === 'available')
            ->count();

        $limitedDays = collect($results)
            ->filter(fn (array $day) => ($day['status'] ?? '') === 'limited')
            ->count();

        $blockedDays = collect($results)
            ->filter(fn (array $day) => in_array(($day['status'] ?? ''), ['blocked', 'private_booked'], true))
            ->count();

        [$title, $description, $note, $recommendedAction] = $this->rangeCopy(
            status: $status,
            canProceed: $canProceed,
            daysCount: $daysCount,
            availableDays: $availableDays,
            limitedDays: $limitedDays,
            blockedDays: $blockedDays,
        );

        return [
            'mode' => 'range',
            'from' => $from->format('Y-m-d'),
            'to' => $to->format('Y-m-d'),
            'date' => $from->format('Y-m-d'),
            'venue' => $venue,
            'event_type' => $eventType,
            'guests' => $guests,
            'status' => $status,
            'title' => $title,
            'description' => $description,
            'note' => $note,
            'recommended_action' => $recommendedAction,
            'can_proceed' => $canProceed,
            'days_count' => $daysCount,
            'available_days' => $availableDays,
            'limited_days' => $limitedDays,
            'blocked_days' => $blockedDays,
            'results' => array_values($results),
            'event_titles' => collect($results)
                ->flatMap(fn (array $day) => $day['event_titles'] ?? [])
                ->filter()
                ->unique()
                ->values()
                ->all(),
            'calendar_blocks' => collect($results)
                ->flatMap(fn (array $day) => $day['calendar_blocks'] ?? [])
                ->values()
                ->all(),
        ];
    }

    protected function rangeStatus(array $results): string
    {
        $statuses = collect($results)->pluck('status')->map(fn ($status) => (string) $status);

        if ($statuses->contains('unverified')) {
            return 'unverified';
        }

        if ($statuses->contains('blocked')) {
            return 'blocked';
        }

        if ($statuses->contains('private_booked')) {
            return 'private_booked';
        }

        if ($statuses->contains('public_booked')) {
            return 'public_booked';
        }

        if ($statuses->contains('limited')) {
            return 'limited';
        }

        return 'available';
    }

    protected function rangeCopy(
        string $status,
        bool $canProceed,
        int $daysCount,
        int $availableDays,
        int $limitedDays,
        int $blockedDays,
    ): array {
        if ($status === 'unverified') {
            return [
                'Unable to verify selected range',
                'The system could not safely verify one or more selected dates.',
                'For safety, unverified dates cannot proceed until the availability check succeeds.',
                'Try again or contact the BCCC office.',
            ];
        }

        if ($status === 'available') {
            return [
                'Selected range is open for booking',
                "All {$daysCount} selected date".($daysCount === 1 ? '' : 's').' currently show available public booking blocks.',
                'You may continue to the booking form after reviewing the day-by-day block status.',
                'Continue to the booking request flow.',
            ];
        }

        if ($status === 'limited') {
            return [
                'Selected range has limited availability',
                "{$availableDays} date".($availableDays === 1 ? '' : 's')." appear open and {$limitedDays} date".($limitedDays === 1 ? '' : 's').' have partial availability.',
                $canProceed ? 'Some blocks are still open. Review each day before continuing.' : 'At least one selected date needs adjustment before booking.',
                'Choose an open AM, PM, or EVE block, or adjust the range.',
            ];
        }

        if ($status === 'public_booked') {
            return [
                'Selected range includes public activity',
                'At least one selected date has a public-facing event or visible calendar activity.',
                $canProceed ? 'The date may still have usable blocks, but public activity is already present.' : 'Review the public events and adjust the date if needed.',
                'Coordinate with the office or choose another date if you need exclusivity.',
            ];
        }

        if ($status === 'private_booked') {
            return [
                'Selected range includes private reservations',
                "{$blockedDays} selected date".($blockedDays === 1 ? '' : 's').' include private or fully reserved venue time.',
                'Private booking details are hidden, but occupied blocks are reflected in the availability result.',
                'Choose a different date or venue area.',
            ];
        }

        return [
            'Selected range includes blocked dates',
            'At least one selected date is blocked or unavailable for public requests.',
            'Blocked dates cannot proceed through the public booking flow.',
            'Choose another date or contact the office for clarification.',
        ];
    }

    protected function fallbackUnavailableDay(
        string $date,
        string $venue,
        ?string $eventType,
        ?int $guests,
        array $areaKeys = [],
    ): array {
        return [
            'date' => $date,
            'venue' => $venue,
            'area_keys' => $areaKeys,
            'area_labels' => VenueAreaCatalog::displayNames($areaKeys),
            'event_type' => $eventType,
            'guests' => $guests,
            'status' => 'unverified',
            'title' => 'Unable to verify availability',
            'description' => 'The system could not safely verify this date and venue/package selection.',
            'note' => 'For safety, this date will not be marked available until verification succeeds.',
            'recommended_action' => 'Try again, adjust the date or package, or contact the BCCC office.',
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

    protected function closedBlockCount(array $blocks): int
    {
        return collect($blocks)
            ->filter(fn (array $block) => ($block['is_available'] ?? true) === false)
            ->count();
    }

    protected function normalizeStatus(string $status): string
    {
        $status = strtolower(trim(str_replace('-', '_', $status)));

        return match ($status) {
            'unverified', 'error', 'failed' => 'unverified',
            'available' => 'available',
            'limited', 'partial', 'partially_booked' => 'limited',
            'public', 'public_booked', 'public_event' => 'public_booked',
            'private', 'private_booked', 'reserved', 'full', 'fully_booked' => 'private_booked',
            'blocked', 'closed', 'unavailable' => 'blocked',
            default => 'available',
        };
    }

    protected function defaultTitle(string $status): string
    {
        return match ($status) {
            'unverified' => 'Unable to verify availability',
            'limited' => 'Selected date has limited availability',
            'public_booked' => 'Selected date includes a public event',
            'private_booked' => 'Selected date includes a private reservation',
            'blocked' => 'Selected date is blocked',
            default => 'Selected date is currently available',
        };
    }

    protected function defaultDescription(string $status): string
    {
        return match ($status) {
            'unverified' => 'The system could not safely verify this date and venue/package selection.',
            'limited' => 'Some time blocks are already occupied, but at least one block may still be open.',
            'public_booked' => 'A public-facing event or calendar activity is already listed for this date.',
            'private_booked' => 'Private booking details are hidden, but occupied blocks are reflected in availability.',
            'blocked' => 'This date is unavailable for public booking requests.',
            default => 'No conflict is currently shown for this date and selected venue area.',
        };
    }

    protected function defaultNote(string $status): string
    {
        return match ($status) {
            'unverified' => 'Try again or contact the office before continuing.',
            'limited' => 'Review the AM, PM, and EVE block status before continuing.',
            'public_booked' => 'The date may still have available blocks depending on the listed schedule.',
            'private_booked' => 'Choose another date, venue area, or contact the office for clarification.',
            'blocked' => 'Blocked dates cannot proceed through the public booking flow.',
            default => 'You may continue to booking, subject to staff verification.',
        };
    }

    protected function defaultRecommendedAction(string $status): string
    {
        return match ($status) {
            'unverified' => 'Try again or contact the office.',
            'limited' => 'Choose an open block or adjust the date.',
            'public_booked' => 'Check if another block remains available or coordinate with the office.',
            'private_booked', 'blocked' => 'Choose another date or venue area.',
            default => 'Continue to the booking request flow.',
        };
    }

    protected function blockLabel(string $key): string
    {
        return match (strtoupper($key)) {
            'AM' => 'Morning',
            'PM' => 'Afternoon',
            'EVE' => 'Evening',
            default => 'Whole Day',
        };
    }

    protected function blockFrom(string $key): string
    {
        return match (strtoupper($key)) {
            'PM' => '12:00',
            'EVE' => '18:00',
            default => '06:00',
        };
    }

    protected function blockTo(string $key): string
    {
        return match (strtoupper($key)) {
            'AM' => '12:00',
            'PM' => '18:00',
            default => '23:59',
        };
    }
}
