<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingScheduleSegment;
use App\Models\CalendarBlock;
use App\Support\ActiveVenueCatalog;
use App\Support\BookingScheduleCatalog;
use App\Support\VenueAreaCatalog;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class BookingScheduleSegmentService
{
    /**
     * Normalize the schedule payload into strict per-day segments.
     *
     * Supported input sources, in priority order:
     * 1. schedule_segments[] from the new detailed booking calendar.
     * 2. schedule_meta.day_roles[] from the Batch 3 wizard.
     * 3. booking_date_from / booking_date_to as a legacy fallback.
     */
    public function normalizeFromPayload(array $payload, array $fallbackAreaLabelsOrKeys = []): array
    {
        $areaKeys = ActiveVenueCatalog::sanitizeKeys($payload['selected_area_keys'] ?? $payload['area_keys'] ?? $fallbackAreaLabelsOrKeys);

        if (empty($areaKeys)) {
            $areaKeys = ActiveVenueCatalog::sanitizeKeys($fallbackAreaLabelsOrKeys);
        }

        $rawSegments = $payload['schedule_segments'] ?? null;

        if (is_array($rawSegments) && $rawSegments !== []) {
            return $this->normalizeExplicitSegments($rawSegments, $areaKeys);
        }

        $meta = $payload['schedule_meta'] ?? [];

        if (is_string($meta)) {
            $decoded = json_decode($meta, true);
            $meta = is_array($decoded) ? $decoded : [];
        }

        if (is_array($meta) && ! empty($meta['day_roles']) && is_array($meta['day_roles'])) {
            return $this->normalizeMetaDayRoles($meta, $areaKeys);
        }

        if (! empty($payload['booking_date_from']) && ! empty($payload['booking_date_to'])) {
            return [$this->normalizeLegacyRange((string) $payload['booking_date_from'], (string) $payload['booking_date_to'], $areaKeys)];
        }

        return [];
    }

    protected function normalizeExplicitSegments(array $segments, array $fallbackAreaKeys): array
    {
        return collect($segments)
            ->map(function (array $segment, int $index) use ($fallbackAreaKeys) {
                $date = (string) ($segment['date'] ?? '');
                $role = BookingScheduleCatalog::normalizeRole((string) ($segment['segment_role'] ?? $segment['role'] ?? 'event'));
                $baseBlock = BookingScheduleCatalog::normalizeBaseBlock((string) ($segment['base_block'] ?? 'whole_day'));
                $additionalHours = (int) ($segment['additional_hours'] ?? 0);
                $areaKeys = ActiveVenueCatalog::sanitizeKeys($segment['area_keys'] ?? $fallbackAreaKeys);

                return $this->makeSegment(
                    $date,
                    $role,
                    $baseBlock,
                    $additionalHours,
                    $areaKeys ?: $fallbackAreaKeys,
                    $index,
                    (bool) ($segment['has_ingress_label'] ?? $segment['is_ingress_day'] ?? $role === BookingScheduleCatalog::ROLE_INGRESS),
                    (bool) ($segment['has_egress_label'] ?? $segment['is_egress_day'] ?? $role === BookingScheduleCatalog::ROLE_EGRESS),
                );
            })
            ->values()
            ->all();
    }

    protected function normalizeMetaDayRoles(array $meta, array $fallbackAreaKeys): array
    {
        $defaultBaseBlock = BookingScheduleCatalog::normalizeBaseBlock((string) ($meta['base_block'] ?? 'whole_day'));
        $defaultAdditionalHours = (int) ($meta['additional_hours'] ?? 0);

        return collect($meta['day_roles'])
            ->map(function (array $row, int $index) use ($fallbackAreaKeys, $defaultBaseBlock, $defaultAdditionalHours) {
                $date = (string) ($row['date'] ?? '');
                $role = BookingScheduleCatalog::normalizeRole((string) ($row['role'] ?? $row['segment_role'] ?? 'event'));
                $baseBlock = BookingScheduleCatalog::normalizeBaseBlock((string) ($row['base_block'] ?? $defaultBaseBlock));
                $additionalHours = (int) ($row['additional_hours'] ?? $defaultAdditionalHours);
                $areaKeys = ActiveVenueCatalog::sanitizeKeys($row['area_keys'] ?? $fallbackAreaKeys);

                return $this->makeSegment(
                    $date,
                    $role,
                    $baseBlock,
                    $additionalHours,
                    $areaKeys ?: $fallbackAreaKeys,
                    $index,
                    (bool) ($row['has_ingress_label'] ?? $row['is_ingress_day'] ?? $role === BookingScheduleCatalog::ROLE_INGRESS),
                    (bool) ($row['has_egress_label'] ?? $row['is_egress_day'] ?? $role === BookingScheduleCatalog::ROLE_EGRESS),
                );
            })
            ->values()
            ->all();
    }

    protected function normalizeLegacyRange(string $fromRaw, string $toRaw, array $areaKeys): array
    {
        $from = Carbon::parse($fromRaw);
        $to = Carbon::parse($toRaw);

        $baseBlock = match (true) {
            $from->format('H:i') === '06:00' && $to->format('H:i') === '12:00' => BookingScheduleCatalog::BLOCK_AM,
            $from->format('H:i') === '12:00' && $to->format('H:i') === '18:00' => BookingScheduleCatalog::BLOCK_PM,
            $from->format('H:i') === '12:00' && $to->gt($from->copy()->setTime(18, 0)) => BookingScheduleCatalog::BLOCK_PM,
            default => BookingScheduleCatalog::BLOCK_WHOLE_DAY,
        };

        $additionalHours = 0;
        $extensionBase = $from->copy()->setTime(18, 0);

        if (in_array($baseBlock, [BookingScheduleCatalog::BLOCK_PM, BookingScheduleCatalog::BLOCK_WHOLE_DAY], true) && $to->gt($extensionBase)) {
            $additionalHours = (int) ceil($extensionBase->diffInMinutes($to) / 60);
        }

        $segment = $this->makeSegment($from->toDateString(), BookingScheduleCatalog::ROLE_EVENT, $baseBlock, $additionalHours, $areaKeys, 0, false, false);

        // Preserve the exact legacy range when it is not one of the standard choices.
        $segment['starts_at'] = $from;
        $segment['ends_at'] = $to;

        return $segment;
    }

    protected function makeSegment(string $date, string $role, string $baseBlock, int $additionalHours, array $areaKeys, int $index, bool $hasIngressLabel = false, bool $hasEgressLabel = false): array
    {
        if ($date === '') {
            throw ValidationException::withMessages([
                'schedule_segments' => 'Every selected schedule day must include a date.',
            ]);
        }

        $baseBlock = BookingScheduleCatalog::normalizeBaseBlock($baseBlock);
        $role = BookingScheduleCatalog::normalizeRole($role);

        if (! BookingScheduleCatalog::allowsAdditionalHours($baseBlock) && $additionalHours > 0) {
            throw ValidationException::withMessages([
                'schedule_segments' => 'Additional hours are allowed only after PM or Whole Day schedules.',
            ]);
        }

        $additionalHours = BookingScheduleCatalog::normalizeAdditionalHours($baseBlock, $additionalHours);

        [$startsAt, $endsAt, $additionalStartsAt, $additionalEndsAt] = BookingScheduleCatalog::intervalForDate($date, $baseBlock, $additionalHours);

        if (BookingScheduleCatalog::isWithinLeadTime($startsAt)) {
            throw ValidationException::withMessages([
                'schedule_segments' => BookingScheduleCatalog::leadTimeMessage($baseBlock),
            ]);
        }

        if ($endsAt->lte($startsAt)) {
            throw ValidationException::withMessages([
                'schedule_segments' => 'Every schedule segment must end after it starts.',
            ]);
        }

        return [
            'date' => Carbon::parse($date)->toDateString(),
            'segment_role' => $role,
            'has_ingress_label' => $hasIngressLabel,
            'has_egress_label' => $hasEgressLabel,
            'base_block' => $baseBlock,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'has_additional_hours' => $additionalHours > 0,
            'additional_hours' => $additionalHours,
            'additional_starts_at' => $additionalStartsAt,
            'additional_ends_at' => $additionalEndsAt,
            'area_keys' => array_values(array_unique(ActiveVenueCatalog::sanitizeKeys($areaKeys))),
            'sort_order' => $index + 1,
        ];
    }

    public function assertSegmentsAvailable(array $segments, array $requestedAreaLabelsOrKeys, ?int $ignoreBookingId = null): void
    {
        if ($segments === []) {
            throw ValidationException::withMessages([
                'schedule_segments' => 'Please select at least one valid schedule segment.',
            ]);
        }

        $requestedKeys = ActiveVenueCatalog::sanitizeKeys($requestedAreaLabelsOrKeys);

        if (empty($requestedKeys)) {
            $requestedKeys = collect($segments)
                ->flatMap(fn (array $segment) => $segment['area_keys'] ?? [])
                ->pipe(fn ($items) => ActiveVenueCatalog::sanitizeKeys($items->all()))
                ->all();
        }

        if (empty($requestedKeys)) {
            throw ValidationException::withMessages([
                'selected_area_keys' => 'Please select a valid venue area before checking schedule availability.',
            ]);
        }

        foreach ($segments as $segment) {
            $this->assertSingleSegmentAvailable($segment, $requestedKeys, $ignoreBookingId);
        }
    }

    protected function assertSingleSegmentAvailable(array $segment, array $requestedKeys, ?int $ignoreBookingId): void
    {
        /** @var Carbon $startsAt */
        $startsAt = $segment['starts_at'];
        /** @var Carbon $endsAt */
        $endsAt = $segment['ends_at'];
        $segmentKeys = ActiveVenueCatalog::sanitizeKeys($segment['area_keys'] ?? $requestedKeys);
        $keysForCheck = $segmentKeys ?: $requestedKeys;

        if (Schema::hasTable('booking_schedule_segments')) {
            $conflictingSegment = BookingScheduleSegment::query()
                ->with(['booking.bookingServices.service.serviceType', 'booking.service.serviceType'])
                ->where('starts_at', '<', $this->endForOverlap($endsAt))
                ->where('ends_at', '>', $startsAt)
                ->whereHas('booking', function (Builder $query) use ($ignoreBookingId): void {
                    $query->whereIn('booking_status', VenueAreaCatalog::BLOCKING_BOOKING_STATUSES)
                        ->when($ignoreBookingId, fn (Builder $q) => $q->where('id', '!=', $ignoreBookingId));
                })
                ->get()
                ->first(fn (BookingScheduleSegment $existing) => $this->segmentOverlapsAreaKeys($existing, $keysForCheck));

            if ($conflictingSegment) {
                throw ValidationException::withMessages([
                    'schedule_segments' => 'This selected date/time overlaps an existing active booking for the same venue area.',
                ]);
            }
        }

        $legacyQuery = Booking::query()
            ->with(['bookingServices.service.serviceType', 'service.serviceType', 'scheduleSegments'])
            ->whereIn('booking_status', VenueAreaCatalog::BLOCKING_BOOKING_STATUSES)
            ->when($ignoreBookingId, fn (Builder $query) => $query->where('id', '!=', $ignoreBookingId))
            ->where('booking_date_from', '<', $this->endForOverlap($endsAt))
            ->where('booking_date_to', '>', $startsAt);

        if (Schema::hasTable('booking_schedule_segments')) {
            $legacyQuery->whereDoesntHave('scheduleSegments');
        }

        $conflictingBooking = $legacyQuery
            ->get()
            ->first(fn (Booking $booking) => $this->bookingOverlapsAreaKeys($booking, $keysForCheck));

        if ($conflictingBooking) {
            throw ValidationException::withMessages([
                'schedule_segments' => 'This selected date/time overlaps an existing active booking for the same venue area.',
            ]);
        }

        if (Schema::hasTable('calendar_blocks')) {
            $blocks = CalendarBlock::query()
                ->whereDate('date_to', '>=', $startsAt->copy()->toDateString())
                ->whereDate('date_from', '<=', $endsAt->copy()->toDateString())
                ->get();

            foreach ($blocks as $block) {
                $blockStartDate = Carbon::parse($block->date_from)->startOfDay();
                $blockEndDate = Carbon::parse($block->date_to)->startOfDay();

                for ($cursor = $blockStartDate->copy(); $cursor->lte($blockEndDate); $cursor->addDay()) {
                    [$blockFrom, $blockTo] = $this->calendarBlockIntervalForDate((string) ($block->block ?? 'DAY'), $cursor);

                    if (! $this->overlaps($startsAt, $this->endForOverlap($endsAt), $blockFrom, $blockTo)) {
                        continue;
                    }

                    foreach ($keysForCheck as $key) {
                        if (VenueAreaCatalog::overlaps((string) ($block->area ?? ''), $key)) {
                            throw ValidationException::withMessages([
                                'schedule_segments' => 'This selected date/time overlaps an admin calendar block for the selected venue area.',
                            ]);
                        }
                    }
                }
            }
        }
    }

    public function syncBookingSegments(Booking $booking, array $segments): void
    {
        if (! Schema::hasTable('booking_schedule_segments')) {
            return;
        }

        $booking->scheduleSegments()->delete();

        foreach ($segments as $segment) {
            $payload = [
                'date' => $segment['date'],
                'segment_role' => $segment['segment_role'],
                'base_block' => $segment['base_block'],
                'starts_at' => $segment['starts_at'],
                'ends_at' => $segment['ends_at'],
                'has_additional_hours' => (bool) $segment['has_additional_hours'],
                'additional_hours' => (int) $segment['additional_hours'],
                'additional_starts_at' => $segment['additional_starts_at'],
                'additional_ends_at' => $segment['additional_ends_at'],
                'area_keys' => $segment['area_keys'],
                'sort_order' => (int) $segment['sort_order'],
            ];

            if (Schema::hasColumn('booking_schedule_segments', 'has_ingress_label')) {
                $payload['has_ingress_label'] = (bool) ($segment['has_ingress_label'] ?? false);
            }

            if (Schema::hasColumn('booking_schedule_segments', 'has_egress_label')) {
                $payload['has_egress_label'] = (bool) ($segment['has_egress_label'] ?? false);
            }

            $booking->scheduleSegments()->create($payload);
        }
    }

    public function summaryRange(array $segments): array
    {
        if ($segments === []) {
            return [null, null];
        }

        $startsAt = collect($segments)
            ->pluck('starts_at')
            ->filter()
            ->sortBy(fn (Carbon $value) => $value->getTimestamp())
            ->first();

        $endsAt = collect($segments)
            ->pluck('ends_at')
            ->filter()
            ->sortBy(fn (Carbon $value) => $value->getTimestamp())
            ->last();

        return [$startsAt, $endsAt];
    }

    protected function segmentOverlapsAreaKeys(BookingScheduleSegment $segment, array $requestedKeys): bool
    {
        $existingKeys = ActiveVenueCatalog::sanitizeKeys($segment->area_keys ?? []);

        if (empty($existingKeys) && $segment->booking) {
            return $this->bookingOverlapsAreaKeys($segment->booking, $requestedKeys);
        }

        foreach ($existingKeys as $existingKey) {
            foreach ($requestedKeys as $requestedKey) {
                if (VenueAreaCatalog::overlaps($existingKey, $requestedKey)) {
                    return true;
                }
            }
        }

        return false;
    }

    protected function bookingOverlapsAreaKeys(Booking $booking, array $requestedKeys): bool
    {
        $booking->loadMissing(['bookingServices.service.serviceType', 'service.serviceType']);

        $existingKeys = ActiveVenueCatalog::sanitizeKeys($booking->selected_area_keys ?? []);

        if (empty($existingKeys)) {
            foreach ($booking->bookingServices ?? [] as $item) {
                $service = $item->service;

                if (! $service) {
                    continue;
                }

                $existingKeys = array_merge($existingKeys, ActiveVenueCatalog::sanitizeKeys([
                    $service->name ?? '',
                    $service->serviceType?->name ?? '',
                ]));
            }
        }

        if (empty($existingKeys) && $booking->service) {
            $existingKeys = array_merge($existingKeys, VenueAreaCatalog::canonicalKeys([
                $booking->service->name ?? '',
                $booking->service->serviceType?->name ?? '',
            ]));
        }

        foreach (array_values(array_unique($existingKeys)) as $existingKey) {
            foreach ($requestedKeys as $requestedKey) {
                if (VenueAreaCatalog::overlaps($existingKey, $requestedKey)) {
                    return true;
                }
            }
        }

        return false;
    }

    protected function calendarBlockIntervalForDate(string $block, Carbon $day): array
    {
        $block = strtoupper(trim($block));

        return match ($block) {
            'AM' => [$day->copy()->setTime(6, 0), $day->copy()->setTime(12, 0)],
            'PM' => [$day->copy()->setTime(12, 0), $day->copy()->setTime(18, 0)],
            'EVE' => [$day->copy()->setTime(18, 0), $day->copy()->setTime(23, 59)],
            default => [$day->copy()->setTime(6, 0), $day->copy()->setTime(23, 59)],
        };
    }

    protected function endForOverlap(Carbon $to): Carbon
    {
        return ($to->hour === 23 && $to->minute === 59)
            ? $to->copy()->addMinute()
            : $to->copy();
    }

    protected function overlaps(Carbon $aStart, Carbon $aEnd, Carbon $bStart, Carbon $bEnd): bool
    {
        return $aStart->lt($bEnd) && $aEnd->gt($bStart);
    }
}
