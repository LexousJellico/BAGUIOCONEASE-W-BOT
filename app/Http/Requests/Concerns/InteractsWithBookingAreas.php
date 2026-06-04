<?php

namespace App\Http\Requests\Concerns;

use App\Models\Booking;
use App\Models\Service;
use Carbon\Carbon;
use DateTimeInterface;

trait InteractsWithBookingAreas
{
    protected function parseDateTime($value): ?Carbon
    {
        if ($value instanceof DateTimeInterface) {
            return Carbon::instance($value);
        }

        if (! $value) {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    protected function normalizeSchedulePair(?string $fromRaw, ?string $toRaw): array
    {
        if (! $fromRaw || ! $toRaw) {
            return [$fromRaw, $toRaw];
        }

        $from = $this->parseDateTime($fromRaw);
        $to = $this->parseDateTime($toRaw);

        if (! $from || ! $to) {
            return [$fromRaw, $toRaw];
        }

        $fromTime = $from->format('H:i');
        $toTime = $to->format('H:i');

        if ($toTime === '00:00') {
            $fromDate = $from->copy()->startOfDay();
            $toDate = $to->copy()->startOfDay();

            $isNextDay = $toDate->equalTo($fromDate->copy()->addDay());
            $validStarts = in_array($fromTime, ['06:00', '12:00', '18:00'], true);

            if ($isNextDay && $validStarts) {
                $toFixed = $from->copy()->setTime(23, 59, 0);

                return [
                    $from->format('Y-m-d\TH:i'),
                    $toFixed->format('Y-m-d\TH:i'),
                ];
            }
        }

        return [
            $from->format('Y-m-d\TH:i'),
            $to->format('Y-m-d\TH:i'),
        ];
    }

    protected function validateBlockRange(Carbon $from, Carbon $to, bool $isAdmin): ?string
    {
        $fromTime = $from->format('H:i');
        $toTime = $to->format('H:i');

        if ($from->minute !== 0) {
            return 'Start time must be aligned to exact block hours (minutes must be :00).';
        }

        $endOk = ($to->minute === 0) || ($to->hour === 23 && $to->minute === 59);
        if (! $endOk) {
            return 'End time must be aligned to block hours (:00) or exactly 11:59 PM for EVE.';
        }

        $fromDate = $from->copy()->startOfDay();
        $toDate = $to->copy()->startOfDay();

        $sameDay = $toDate->equalTo($fromDate);
        $nextDay = $toDate->equalTo($fromDate->copy()->addDay());

        if ($sameDay && $fromTime === '00:00' && $toTime === '06:00') {
            return $isAdmin ? null : '11:59 PM – 6:00 AM is ADMIN-only. Please contact admin for this booking.';
        }

        if ($sameDay && $fromTime === '06:00' && $toTime === '12:00') return null;
        if ($sameDay && $fromTime === '12:00' && $toTime === '18:00') return null;
        if ($sameDay && $fromTime === '06:00' && $toTime === '18:00') return null;

        if ($sameDay && $fromTime === '18:00' && $toTime === '23:59') return null;
        if ($sameDay && $fromTime === '12:00' && $toTime === '23:59') return null;
        if ($sameDay && $fromTime === '06:00' && $toTime === '23:59') return null;

        if ($nextDay && in_array($fromTime, ['06:00', '12:00', '18:00'], true) && in_array($toTime, ['00:00', '23:59'], true)) {
            return null;
        }

        return 'Invalid schedule. Use AM (6–12), PM (12–6), EVE (6–11:59), or valid combinations.';
    }

    protected function validateNoOverlaps($validator, array $intervals): void
    {
        $count = count($intervals);

        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count; $j++) {
                $a = $intervals[$i];
                $b = $intervals[$j];

                /** @var Carbon $aFrom */
                $aFrom = $a['from'];
                /** @var Carbon $aTo */
                $aTo = $a['to'];

                /** @var Carbon $bFrom */
                $bFrom = $b['from'];
                /** @var Carbon $bTo */
                $bTo = $b['to'];

                if ($aFrom->lt($bTo) && $bFrom->lt($aTo)) {
                    $validator->errors()->add(
                        $b['error_field'],
                        'Schedules in this request overlap each other. Please choose non-overlapping blocks/dates.'
                    );
                }
            }
        }
    }

    protected function endForOverlap(Carbon $to): Carbon
    {
        return ($to->hour === 23 && $to->minute === 59)
            ? $to->copy()->addMinute()
            : $to;
    }

    protected function selectedAreaServiceIdsFromItems(?array $items): array
    {
        $serviceIds = collect($items ?? [])
            ->filter(fn ($row) => is_array($row) && ! empty($row['service_id']))
            ->pluck('service_id')
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if (empty($serviceIds)) {
            return [];
        }

        return Service::query()
            ->with('serviceType')
            ->whereIn('id', $serviceIds)
            ->get()
            ->filter(fn (Service $service) => $this->isAreaService($service))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    protected function bookingAreaServiceIds(?Booking $booking): array
    {
        if (! $booking) {
            return [];
        }

        $booking->loadMissing(['bookingServices.service.serviceType']);

        return $booking->bookingServices
            ->map(fn ($row) => $row->service)
            ->filter(fn ($service) => $service instanceof Service)
            ->filter(fn (Service $service) => $this->isAreaService($service))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    protected function findConflictForAreas(Carbon $from, Carbon $to, array $requestedAreaServiceIds, ?int $excludeId = null): ?Booking
    {
        $requestedLabels = $this->resolveAreaLabelsFromServiceIds($requestedAreaServiceIds);

        if (empty($requestedLabels)) {
            return null;
        }

        $toCalc = $this->endForOverlap($to);

        return Booking::query()
            ->with(['bookingServices.service.serviceType'])
            ->whereIn('booking_status', ['confirmed', 'active'])
            ->when($excludeId, fn ($query) => $query->where('id', '!=', $excludeId))
            ->where('booking_date_from', '<', $toCalc->toDateTimeString())
            ->where('booking_date_to', '>', $from->toDateTimeString())
            ->orderBy('booking_date_from', 'asc')
            ->get()
            ->first(function (Booking $booking) use ($requestedLabels) {
                return $this->bookingOverlapsRequestedAreas($booking, $requestedLabels);
            });
    }

    protected function resolveAreaLabelsFromServiceIds(array $serviceIds): array
    {
        if (empty($serviceIds)) {
            return [];
        }

        return Service::query()
            ->with('serviceType')
            ->whereIn('id', $serviceIds)
            ->get()
            ->filter(fn (Service $service) => $this->isAreaService($service))
            ->map(fn (Service $service) => (string) $service->name)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    protected function bookingOverlapsRequestedAreas(Booking $booking, array $requestedLabels): bool
    {
        $existingLabels = $this->extractAreaLabelsFromBooking($booking);

        foreach ($existingLabels as $existing) {
            foreach ($requestedLabels as $requested) {
                if ($this->areasOverlap($existing, $requested)) {
                    return true;
                }
            }
        }

        return false;
    }

    protected function extractAreaLabelsFromBooking(Booking $booking): array
    {
        $booking->loadMissing(['bookingServices.service.serviceType']);

        return $booking->bookingServices
            ->map(fn ($row) => $row->service)
            ->filter(fn ($service) => $service instanceof Service)
            ->filter(fn (Service $service) => $this->isAreaService($service))
            ->map(fn (Service $service) => (string) $service->name)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    protected function isAreaService(Service $service): bool
    {
        $type = strtolower(trim((string) ($service->serviceType?->name ?? '')));

        return $type === 'area' || $this->isRecognizedAreaLabel($service->name);
    }

    protected function isRecognizedAreaLabel(?string $label): bool
    {
        $key = $this->canonicalAreaKey($label);

        return in_array($key, array_keys($this->areaOverlapMatrix()), true);
    }

    protected function canonicalAreaKey(?string $value): string
    {
        $normalized = str_replace(' ', '', $this->normalizeAreaLabel($value));

        $map = [
            'fullhall' => 'full_hall',
            'fullvenue' => 'full_hall',
            'wholehall' => 'full_hall',
            'entirehall' => 'full_hall',

            'mainhall' => 'main_hall',
            'mainfunctionhall' => 'main_hall',

            'foyerlobbyarea' => 'foyer_lobby',
            'foyerandlobbyarea' => 'foyer_lobby',
            'foyerlobby' => 'foyer_lobby',
            'foyer' => 'foyer_lobby',
            'lobbyarea' => 'foyer_lobby',
            'lobby' => 'foyer_lobby',

            'viplounge' => 'vip_lounge',
            'viploungearea' => 'vip_lounge',
            'viplounge1' => 'vip_lounge',
            'viplounge2' => 'vip_lounge',

            'boardroom' => 'board_room',
            'boardrm' => 'board_room',

            'basement' => 'basement',

            'gallery2600' => 'gallery2600',
            'gallery' => 'gallery2600',
            'gallery2600hall' => 'gallery2600',

            'wholevenue' => 'whole_venue',
            'wholefacility' => 'whole_venue',
            'entirevenue' => 'whole_venue',
            'allareas' => 'whole_venue',
            'allarea' => 'whole_venue',
            'allspaces' => 'whole_venue',
            'wholeplace' => 'whole_venue',
            'whole' => 'whole_venue',
            'groundsparkingarea' => 'whole_venue',
            'lobbyfoyer' => 'foyer_lobby',
        ];

        return $map[$normalized] ?? $normalized;
    }

    protected function normalizeAreaLabel(?string $value): string
    {
        $value = mb_strtolower(trim((string) $value));
        $value = str_replace(['&', '/'], [' and ', ' '], $value);
        $value = preg_replace('/[^a-z0-9]+/u', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    }

    protected function areaOverlapMatrix(): array
    {
        return [
            'whole_venue' => ['whole_venue', 'full_hall', 'main_hall', 'foyer_lobby', 'vip_lounge', 'board_room', 'basement', 'gallery2600'],
            'full_hall' => ['whole_venue', 'full_hall', 'main_hall', 'foyer_lobby', 'vip_lounge', 'board_room', 'basement', 'gallery2600'],

            'main_hall' => ['whole_venue', 'full_hall', 'main_hall'],
            'foyer_lobby' => ['whole_venue', 'full_hall', 'foyer_lobby'],
            'vip_lounge' => ['whole_venue', 'full_hall', 'vip_lounge'],
            'board_room' => ['whole_venue', 'full_hall', 'board_room'],
            'basement' => ['whole_venue', 'full_hall', 'basement'],
            'gallery2600' => ['whole_venue', 'full_hall', 'gallery2600'],
        ];
    }

    protected function areasOverlap(?string $candidate, ?string $selected): bool
    {
        $candidateKey = $this->canonicalAreaKey($candidate);
        $selectedKey = $this->canonicalAreaKey($selected);

        if ($candidateKey === '' || $selectedKey === '') {
            return false;
        }

        if ($candidateKey === $selectedKey) {
            return true;
        }

        $matrix = $this->areaOverlapMatrix();

        return in_array($selectedKey, $matrix[$candidateKey] ?? [], true)
            || in_array($candidateKey, $matrix[$selectedKey] ?? [], true);
    }
}
