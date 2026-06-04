<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\CalendarBlock;
use App\Models\PublicEvent;
use App\Services\Contracts\BookingServiceInterface;
use App\Support\VenueAreaCatalog;
use App\Support\WorkspaceAccess;
use App\Support\WorkspacePage;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CalendarManagementController extends Controller
{
    public function index(Request $request, BookingServiceInterface $bookingService): Response
    {
        $this->ensureAccess($request);

        $month = $this->resolveMonth((string) $request->query('month', ''));
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $monthAvailability = $this->buildMonthAvailability($bookingService, $start, $end);
        $bookingEvents = $this->bookingEvents($start, $end);
        $publicEvents = $this->publicEvents($start, $end);
        $publicEventItems = $this->publicEventItems($publicEvents);
        $blockEvents = $this->calendarBlockEvents($start, $end);

        $events = $bookingEvents
            ->concat($publicEventItems)
            ->concat($blockEvents)
            ->sortBy([
                ['start', 'asc'],
                ['kind', 'asc'],
                ['title', 'asc'],
            ])
            ->values();

        $areaOptions = method_exists($bookingService, 'calendarAreaOptions')
            ? $bookingService->calendarAreaOptions()
            : $this->fallbackAreaOptions();

        return Inertia::render(WorkspacePage::resolve($request, 'calendar/manage'), [
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
            'canManageCalendarBlocks' => $this->canManageCalendarBlocks($request),

            'month' => $month,
            'monthAvailability' => $monthAvailability,
            'events' => $events,
            'counts' => [
                'all' => $events->count(),
                'bookings' => $bookingEvents->count(),
                'blocks' => $blockEvents->count(),
                'public_events' => $publicEventItems->count(),
            ],
            'highlights' => $this->highlights($publicEvents),
            'areaOptions' => $areaOptions,
        ]);
    }

    protected function ensureAccess(Request $request): void
    {
        abort_unless($request->user(), 403);
        abort_unless($this->canManageCalendarBlocks($request), 403);
    }

    protected function canManageCalendarBlocks(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'manager'])) {
            return true;
        }

        if (method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('manager'))) {
            return true;
        }

        $role = (string) ($user->role_name ?? $user->role ?? '');

        if (in_array($role, ['admin', 'manager'], true)) {
            return true;
        }

        return in_array(WorkspaceAccess::role($request), ['admin', 'manager'], true);
    }

    protected function resolveMonth(string $month): string
    {
        $month = trim($month);

        if (preg_match('/^\d{4}-\d{2}$/', $month)) {
            return $month;
        }

        return Carbon::now()->format('Y-m');
    }

    protected function buildMonthAvailability(
        BookingServiceInterface $bookingService,
        Carbon $start,
        Carbon $end,
    ): array {
        if (method_exists($bookingService, 'getDashboardMonthAvailability')) {
            $monthAvailability = $bookingService->getDashboardMonthAvailability($start->format('Y-m'));

            if (is_array($monthAvailability) && count($monthAvailability) > 0) {
                return $monthAvailability;
            }
        }

        $monthAvailability = [];

        for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
            $dateKey = $day->format('Y-m-d');

            $monthAvailability[$dateKey] = $bookingService->getDashboardDayStatus($dateKey);
        }

        return $monthAvailability;
    }

    protected function bookingEvents(Carbon $start, Carbon $end): Collection
    {
        return Booking::query()
            ->with([
                'service.serviceType',
                'bookingServices.service.serviceType',
            ])
            ->whereDate('booking_date_to', '>=', $start->format('Y-m-d'))
            ->whereDate('booking_date_from', '<=', $end->format('Y-m-d'))
            ->orderBy('booking_date_from')
            ->get([
                'id',
                'service_id',
                'client_name',
                'client_email',
                'company_name',
                'type_of_event',
                'booking_status',
                'payment_status',
                'booking_date_from',
                'booking_date_to',
                'number_of_guests',
                'public_calendar_title',
                'is_public_calendar_visible',
            ])
            ->map(function (Booking $booking) {
                $titleBase = trim((string) (
                    $booking->public_calendar_title
                    ?: $booking->type_of_event
                    ?: 'Booking'
                ));

                $clientBase = trim((string) (
                    $booking->company_name
                    ?: $booking->client_name
                    ?: 'Client'
                ));

                $area = $this->bookingAreaLabel($booking);

                $status = strtolower((string) ($booking->booking_status ?? ''));
                $occupiesAvailability = in_array($status, VenueAreaCatalog::BLOCKING_BOOKING_STATUSES, true);

                return [
                    'id' => $booking->id,
                    'kind' => 'booking',
                    'title' => trim($titleBase . ' · ' . $clientBase),
                    'start' => $this->dateTimeValue($booking->booking_date_from),
                    'end' => $this->dateTimeValue($booking->booking_date_to),
                    'dateFrom' => $this->dateValue($booking->booking_date_from),
                    'dateTo' => $this->dateValue($booking->booking_date_to),
                    'status' => (string) ($booking->booking_status ?? ''),
                    'occupies_availability' => $occupiesAvailability,
                    'payment_status' => (string) ($booking->payment_status ?? ''),
                    'public_status' => $occupiesAvailability ? ($booking->is_public_calendar_visible ? 'blue' : 'gold') : 'open_request',
                    'area' => $area,
                    'block' => $this->inferBlockFromDateTimes($booking->booking_date_from, $booking->booking_date_to),
                    'note' => '',
                    'notes' => '',
                    'client_name' => (string) ($booking->client_name ?? ''),
                    'client_email' => (string) ($booking->client_email ?? ''),
                    'company_name' => (string) ($booking->company_name ?? ''),
                    'guest_count' => (int) ($booking->number_of_guests ?? 0),
                    'summary' => trim(($occupiesAvailability ? 'Occupies availability. ' : 'For review only; does not occupy availability. ') . ($area !== '' ? "Venue area: {$area}" : '')),
                    'description' => '',
                    'time' => $this->timeRangeLabel($booking->booking_date_from, $booking->booking_date_to),
                    'image' => '',
                    'groupKey' => substr(hash('sha1', 'booking|' . $booking->id), 0, 16),
                ];
            })
            ->values();
    }

    protected function publicEvents(Carbon $start, Carbon $end): Collection
    {
        return PublicEvent::query()
            ->where('is_public', true)
            ->whereDate('event_date', '>=', $start->format('Y-m-d'))
            ->whereDate('event_date', '<=', $end->format('Y-m-d'))
            ->orderBy('event_date')
            ->get([
                'id',
                'title',
                'description',
                'note',
                'venue',
                'event_date',
                'event_time',
                'images',
            ]);
    }

    protected function publicEventItems(Collection $publicEvents): Collection
    {
        return $publicEvents
            ->map(function (PublicEvent $event) {
                [$startAt, $endAt] = $this->publicEventDateTimes($event);

                return [
                    'id' => 'public-event-' . $event->id,
                    'kind' => 'public_event',
                    'title' => 'PUBLIC: ' . trim((string) ($event->title ?? 'Public Event')),
                    'start' => $startAt->format('Y-m-d\TH:i'),
                    'end' => $endAt->format('Y-m-d\TH:i'),
                    'dateFrom' => $startAt->format('Y-m-d'),
                    'dateTo' => $endAt->format('Y-m-d'),
                    'status' => 'public_booked',
                    'payment_status' => '',
                    'public_status' => 'blue',
                    'area' => (string) ($event->venue ?? ''),
                    'block' => $this->inferBlockFromDateTimes($startAt, $endAt),
                    'note' => (string) ($event->note ?? ''),
                    'notes' => (string) ($event->note ?? ''),
                    'client_name' => '',
                    'client_email' => '',
                    'company_name' => '',
                    'guest_count' => null,
                    'summary' => $this->summaryText($event),
                    'description' => (string) ($event->description ?? ''),
                    'time' => (string) ($event->event_time ?? ''),
                    'image' => $this->firstImage($event->images),
                    'groupKey' => substr(hash('sha1', 'public-event|' . $event->id), 0, 16),
                ];
            })
            ->values();
    }

    protected function calendarBlockEvents(Carbon $start, Carbon $end): Collection
    {
        return CalendarBlock::query()
            ->whereDate('date_to', '>=', $start->format('Y-m-d'))
            ->whereDate('date_from', '<=', $end->format('Y-m-d'))
            ->orderBy('date_from')
            ->get([
                'id',
                'title',
                'area',
                'notes',
                'block',
                'public_status',
                'date_from',
                'date_to',
            ])
            ->map(function (CalendarBlock $calendarBlock) use ($start, $end) {
                $block = strtoupper((string) ($calendarBlock->block ?? 'DAY'));
                $publicStatus = strtolower((string) ($calendarBlock->public_status ?? 'red'));

                $rangeStart = Carbon::parse($calendarBlock->date_from)->startOfDay();
                $rangeEnd = Carbon::parse($calendarBlock->date_to)->startOfDay();

                $clippedStart = $rangeStart->lt($start)
                    ? $start->copy()->startOfDay()
                    : $rangeStart->copy()->startOfDay();

                $clippedEnd = $rangeEnd->gt($end)
                    ? $end->copy()->startOfDay()
                    : $rangeEnd->copy()->startOfDay();

                [$startAt, $endAt] = $this->blockDateTimes($clippedStart, $clippedEnd, $block);

                $status = match ($publicStatus) {
                    'blue' => 'public_booked',
                    'gold' => 'private_booked',
                    default => 'blocked',
                };

                return [
                    'id' => 'block-' . $calendarBlock->id,
                    'kind' => 'block',
                    'block_id' => $calendarBlock->id,
                    'title' => 'BLOCK: ' . trim((string) ($calendarBlock->title ?: 'Calendar Block')),
                    'start' => $startAt->format('Y-m-d\TH:i'),
                    'end' => $endAt->format('Y-m-d\TH:i'),
                    'dateFrom' => $this->dateValue($calendarBlock->date_from),
                    'dateTo' => $this->dateValue($calendarBlock->date_to),
                    'status' => $status,
                    'payment_status' => '',
                    'public_status' => $publicStatus,
                    'area' => (string) ($calendarBlock->area ?? ''),
                    'block' => $block,
                    'note' => (string) ($calendarBlock->notes ?? ''),
                    'notes' => (string) ($calendarBlock->notes ?? ''),
                    'client_name' => '',
                    'client_email' => '',
                    'company_name' => '',
                    'guest_count' => null,
                    'summary' => $this->blockSummary($calendarBlock),
                    'description' => (string) ($calendarBlock->notes ?? ''),
                    'time' => $this->blockTimeLabel($block),
                    'image' => '',
                    'groupKey' => substr(hash('sha1', 'block|' . $calendarBlock->id), 0, 16),
                ];
            })
            ->values();
    }

    protected function highlights(Collection $publicEvents): array
    {
        $bcccEvents = $publicEvents
            ->filter(fn (PublicEvent $event) => $this->isBcccEvent($event))
            ->values();

        $cityEvents = $publicEvents
            ->filter(fn (PublicEvent $event) => ! $this->isBcccEvent($event))
            ->values();

        return [
            'bccc' => $bcccEvents
                ->map(fn (PublicEvent $event) => $this->highlightRow($event, 'bccc'))
                ->values(),
            'city' => $cityEvents
                ->map(fn (PublicEvent $event) => $this->highlightRow($event, 'city'))
                ->values(),
        ];
    }

    protected function highlightRow(PublicEvent $event, string $scope): array
    {
        return [
            'id' => (int) $event->id,
            'scope' => $scope,
            'title' => (string) ($event->title ?? ''),
            'venue' => (string) ($event->venue ?? ''),
            'date' => $this->dateValue($event->event_date),
            'time' => (string) ($event->event_time ?? ''),
            'summary' => $this->summaryText($event),
            'description' => (string) ($event->description ?? ''),
            'image' => $this->firstImage($event->images),
        ];
    }

    protected function isBcccEvent(PublicEvent $event): bool
    {
        $venue = strtolower((string) ($event->venue ?? ''));

        return str_contains($venue, 'bccc')
            || str_contains($venue, 'convention')
            || str_contains($venue, 'cultural center');
    }

    protected function publicEventDateTimes(PublicEvent $event): array
    {
        $eventDate = Carbon::parse($event->event_date)->startOfDay();
        $time = trim((string) ($event->event_time ?? ''));

        if ($time === '') {
            return [
                $eventDate->copy()->setTime(6, 0),
                $eventDate->copy()->setTime(23, 59),
            ];
        }

        $normalized = strtolower($time);
        $normalized = str_replace(['–', '—'], '-', $normalized);

        if (preg_match('/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i', $normalized, $matches)) {
            $startHour = (int) $matches[1];
            $startMinute = isset($matches[2]) && $matches[2] !== '' ? (int) $matches[2] : 0;
            $startMeridiem = $matches[3] ?: $matches[6] ?: null;

            $endHour = (int) $matches[4];
            $endMinute = isset($matches[5]) && $matches[5] !== '' ? (int) $matches[5] : 0;
            $endMeridiem = $matches[6] ?: $startMeridiem;

            $startAt = $eventDate->copy()->setTime(
                $this->hour24($startHour, $startMeridiem),
                $startMinute,
            );

            $endAt = $eventDate->copy()->setTime(
                $this->hour24($endHour, $endMeridiem),
                $endMinute,
            );

            if ($endAt->lessThanOrEqualTo($startAt)) {
                $endAt->addDay();
            }

            return [$startAt, $endAt];
        }

        try {
            $startAt = Carbon::parse($eventDate->format('Y-m-d') . ' ' . $time);

            return [
                $startAt,
                $startAt->copy()->addHours(2),
            ];
        } catch (\Throwable) {
            return [
                $eventDate->copy()->setTime(6, 0),
                $eventDate->copy()->setTime(23, 59),
            ];
        }
    }

    protected function hour24(int $hour, ?string $meridiem): int
    {
        $hour = max(1, min(12, $hour));
        $meridiem = strtolower((string) $meridiem);

        if ($meridiem === 'pm' && $hour !== 12) {
            return $hour + 12;
        }

        if ($meridiem === 'am' && $hour === 12) {
            return 0;
        }

        return $hour;
    }

    protected function blockDateTimes(Carbon $rangeStart, Carbon $rangeEnd, string $block): array
    {
        $block = strtoupper($block);

        $startAt = match ($block) {
            'AM' => $rangeStart->copy()->setTime(6, 0),
            'PM' => $rangeStart->copy()->setTime(12, 0),
            'EVE' => $rangeStart->copy()->setTime(18, 0),
            default => $rangeStart->copy()->setTime(6, 0),
        };

        $endAt = match ($block) {
            'AM' => $rangeEnd->copy()->setTime(12, 0),
            'PM' => $rangeEnd->copy()->setTime(18, 0),
            'EVE' => $rangeEnd->copy()->setTime(23, 59),
            default => $rangeEnd->copy()->setTime(23, 59),
        };

        return [$startAt, $endAt];
    }

    protected function blockTimeLabel(string $block): string
    {
        return match (strtoupper($block)) {
            'AM' => '6:00 AM - 12:00 PM',
            'PM' => '12:00 PM - 6:00 PM',
            'EVE' => '6:00 PM - 11:59 PM',
            default => '6:00 AM - 11:59 PM',
        };
    }

    protected function blockSummary(CalendarBlock $calendarBlock): string
    {
        $status = strtolower((string) ($calendarBlock->public_status ?? 'red'));

        $prefix = match ($status) {
            'blue' => 'Public-visible calendar activity',
            'gold' => 'Private reservation block',
            default => 'Unavailable calendar block',
        };

        $area = trim((string) ($calendarBlock->area ?? ''));
        $notes = trim((string) ($calendarBlock->notes ?? ''));

        return collect([
            $prefix,
            $area !== '' ? "Area: {$area}" : null,
            $notes !== '' ? Str::limit($notes, 120) : null,
        ])->filter()->implode(' · ');
    }

    protected function bookingAreaLabel(Booking $booking): string
    {
        $booking->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
        ]);

        $labels = collect();

        foreach ($booking->bookingServices as $bookingService) {
            if ($bookingService->service?->serviceType?->name) {
                $labels->push($bookingService->service->serviceType->name);
            }
        }

        if ($booking->service?->serviceType?->name) {
            $labels->push($booking->service->serviceType->name);
        }

        if ($booking->service?->name) {
            $labels->push($booking->service->name);
        }

        return $labels
            ->filter()
            ->unique()
            ->values()
            ->implode(', ');
    }

    protected function inferBlockFromDateTimes($from, $to): string
    {
        if (! $from || ! $to) {
            return 'DAY';
        }

        try {
            $start = $from instanceof \DateTimeInterface ? Carbon::instance($from) : Carbon::parse($from);
            $end = $to instanceof \DateTimeInterface ? Carbon::instance($to) : Carbon::parse($to);
        } catch (\Throwable) {
            return 'DAY';
        }

        $startTime = $start->format('H:i');
        $endTime = $end->format('H:i');

        if ($startTime === '06:00' && $endTime === '12:00') {
            return 'AM';
        }

        if ($startTime === '12:00' && $endTime === '18:00') {
            return 'PM';
        }

        if ($startTime === '18:00' && in_array($endTime, ['23:59', '00:00'], true)) {
            return 'EVE';
        }

        return 'DAY';
    }

    protected function timeRangeLabel($from, $to): string
    {
        if (! $from || ! $to) {
            return '';
        }

        try {
            $start = $from instanceof \DateTimeInterface ? Carbon::instance($from) : Carbon::parse($from);
            $end = $to instanceof \DateTimeInterface ? Carbon::instance($to) : Carbon::parse($to);

            return $start->format('g:i A') . ' - ' . $end->format('g:i A');
        } catch (\Throwable) {
            return '';
        }
    }

    protected function dateTimeValue($value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            $date = $value instanceof \DateTimeInterface ? Carbon::instance($value) : Carbon::parse($value);

            return $date->format('Y-m-d\TH:i');
        } catch (\Throwable) {
            return null;
        }
    }

    protected function dateValue($value): string
    {
        if (! $value) {
            return '';
        }

        try {
            $date = $value instanceof \DateTimeInterface ? Carbon::instance($value) : Carbon::parse($value);

            return $date->format('Y-m-d');
        } catch (\Throwable) {
            return (string) $value;
        }
    }

    protected function summaryText(PublicEvent $event): string
    {
        $note = trim((string) ($event->note ?? ''));

        if ($note !== '') {
            return $note;
        }

        return Str::limit((string) ($event->description ?? ''), 140);
    }

    protected function firstImage($images): string
    {
        if (is_array($images)) {
            return (string) ($images[0] ?? '');
        }

        if (is_string($images) && $images !== '') {
            $decoded = json_decode($images, true);

            if (is_array($decoded)) {
                return (string) ($decoded[0] ?? '');
            }

            return $images;
        }

        return '';
    }

    protected function fallbackAreaOptions(): array
    {
        return [
            'FULL HALL',
            'MAIN HALL',
            'FOYER & LOBBY AREA',
            'VIP LOUNGE',
            'BOARD ROOM',
            'BASEMENT',
            'GALLERY2600',
        ];
    }
}
