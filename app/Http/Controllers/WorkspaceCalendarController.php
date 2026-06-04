<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\CalendarBlock;
use App\Models\PublicEvent;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceCalendarController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return $this->index($request);
    }

    public function index(Request $request): Response
    {
        /** @var BookingService $bookingService */
        $bookingService = app(BookingService::class);
        $bookingService->syncLifecycleStatuses();

        $workspaceRole = $this->resolveWorkspaceRole($request);

        $monthParam = (string) $request->query('month', '');
        $start = preg_match('/^\d{4}-\d{2}$/', $monthParam) === 1
            ? Carbon::createFromFormat('Y-m', $monthParam)->startOfMonth()
            : Carbon::now()->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $monthAvailability = $this->buildMonthAvailability($bookingService, $start, $end);
        $events = $this->buildCalendarEvents($request, $workspaceRole, $start, $end);
        $counts = $this->buildCounts($workspaceRole, $events, $bookingService->getStatusCounts());

        return Inertia::render($this->resolvePage($request, $workspaceRole), [
            'workspaceRole' => $workspaceRole,
            'counts' => $counts,
            'events' => $events->values(),
            'month' => $start->format('Y-m'),
            'monthAvailability' => $monthAvailability,
            'areaOptions' => $this->areaOptions(),
        ]);
    }

    private function buildMonthAvailability(BookingService $bookingService, Carbon $start, Carbon $end): array
    {
        $monthAvailability = [];

        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $dateKey = $d->format('Y-m-d');
            $dayStatus = $bookingService->getDashboardDayStatus($dateKey);

            $monthAvailability[$dateKey] = [
                'AM' => (bool) ($dayStatus['AM'] ?? true),
                'PM' => (bool) ($dayStatus['PM'] ?? true),
                'EVE' => (bool) ($dayStatus['EVE'] ?? true),
                'is_fully_booked' => (bool) ($dayStatus['is_fully_booked'] ?? false),
                'day_status' => (string) ($dayStatus['day_status'] ?? 'available'),
                'is_past' => $d->lt(Carbon::today()),
            ];
        }

        return $monthAvailability;
    }

    private function buildCounts(string $workspaceRole, Collection $events, array $globalStatusCounts): array
    {
        if ($workspaceRole === 'user') {
            return [
                'calendar_items' => $events->count(),
                'bookings' => $events->where('kind', 'booking')->count(),
                'blocks' => $events->where('kind', 'block')->count(),
                'public_events' => $events->where('kind', 'public_event')->count(),
            ];
        }

        return [
            'pending' => $globalStatusCounts['pending'] ?? 0,
            'confirmed' => $globalStatusCounts['confirmed'] ?? 0,
            'active' => $globalStatusCounts['active'] ?? 0,
            'completed' => $globalStatusCounts['completed'] ?? 0,
            'calendar_items' => $events->count(),
            'bookings' => $events->where('kind', 'booking')->count(),
            'blocks' => $events->where('kind', 'block')->count(),
            'public_events' => $events->where('kind', 'public_event')->count(),
        ];
    }

    private function resolveWorkspaceRole(Request $request): string
    {
        $routeName = (string) optional($request->route())->getName();

        if (str_starts_with($routeName, 'admin.')) {
            return 'admin';
        }

        if (str_starts_with($routeName, 'manager.')) {
            return 'manager';
        }

        if (str_starts_with($routeName, 'staff.')) {
            return 'staff';
        }

        if (str_starts_with($routeName, 'user.')) {
            return 'user';
        }

        $path = '/' . ltrim($request->path(), '/');

        if (str_starts_with($path, '/admin/')) {
            return 'admin';
        }

        if (str_starts_with($path, '/manager/')) {
            return 'manager';
        }

        if (str_starts_with($path, '/staff/')) {
            return 'staff';
        }

        $user = $request->user();

        if ($user && method_exists($user, 'hasRole')) {
            if ($user->hasRole('admin')) {
                return 'admin';
            }

            if ($user->hasRole('manager')) {
                return 'manager';
            }

            if ($user->hasRole('staff')) {
                return 'staff';
            }
        }

        return 'user';
    }

    private function resolvePage(Request $request, string $workspaceRole): string
    {
        $routeName = (string) optional($request->route())->getName();

        if (str_starts_with($routeName, 'admin.')) {
            return 'admin/calendar/index';
        }

        if (str_starts_with($routeName, 'manager.')) {
            return 'manager/calendar/index';
        }

        if (str_starts_with($routeName, 'staff.')) {
            return 'staff/calendar/index';
        }

        if ($workspaceRole === 'user') {
            return 'user/calendar/index';
        }

        return 'dashboard';
    }

    private function buildCalendarEvents(Request $request, string $workspaceRole, Carbon $start, Carbon $end): Collection
    {
        $user = $request->user();

        if ($workspaceRole === 'user') {
            return $this->buildUserBookingEvents((string) ($user?->email ?? ''), (int) ($user?->id ?? 0), $start, $end)
                ->concat($this->buildPublicEventItems($start, $end))
                ->concat($this->buildCalendarBlockEvents($start, $end, publicSafe: true))
                ->sortBy([
                    ['start', 'asc'],
                    ['title', 'asc'],
                ])
                ->values();
        }

        return $this->buildBookingEvents($start, $end)
            ->concat($this->buildPublicEventItems($start, $end))
            ->concat($this->buildCalendarBlockEvents($start, $end))
            ->sortBy([
                ['start', 'asc'],
                ['title', 'asc'],
            ])
            ->values();
    }

    private function buildUserBookingEvents(string $email, int $userId, Carbon $start, Carbon $end): Collection
    {
        if ($email === '' && $userId <= 0) {
            return collect();
        }

        $ownBookings = Booking::query()
            ->with(['service.serviceType'])
            ->whereDate('booking_date_to', '>=', $start)
            ->whereDate('booking_date_from', '<=', $end)
            ->where(function ($query) use ($email, $userId): void {
                if ($email !== '') {
                    $query->where('client_email', $email);
                }

                if ($userId > 0) {
                    $method = $email !== '' ? 'orWhere' : 'where';
                    $query->{$method}('created_by_user_id', $userId);
                }
            })
            ->orderBy('booking_date_from')
            ->get([
                'id',
                'service_id',
                'client_email',
                'client_name',
                'company_name',
                'type_of_event',
                'booking_status',
                'payment_status',
                'booking_date_from',
                'booking_date_to',
                'number_of_guests',
            ]);

        return $ownBookings
            ->map(fn (Booking $booking) => $this->bookingToCalendarEvent($booking, clientSafe: true))
            ->values();
    }

    private function buildBookingEvents(Carbon $start, Carbon $end): Collection
    {
        $bookings = Booking::query()
            ->with(['service.serviceType'])
            ->whereDate('booking_date_to', '>=', $start)
            ->whereDate('booking_date_from', '<=', $end)
            ->orderBy('booking_date_from')
            ->get([
                'id',
                'service_id',
                'client_email',
                'client_name',
                'company_name',
                'type_of_event',
                'booking_status',
                'payment_status',
                'booking_date_from',
                'booking_date_to',
                'number_of_guests',
                'is_public_calendar_visible',
                'public_calendar_title',
            ]);

        return $bookings->map(fn (Booking $booking) => $this->bookingToCalendarEvent($booking));
    }

    private function bookingToCalendarEvent(Booking $booking, bool $clientSafe = false): array
    {
        $venueArea = trim((string) ($booking->service?->serviceType?->name ?? ''));
        $serviceName = trim((string) ($booking->service?->name ?? ''));
        $status = (string) ($booking->booking_status ?? 'pending');
        $type = trim((string) ($booking->type_of_event ?? ''));

        $publicTitle = trim((string) ($booking->public_calendar_title ?? ''));
        $defaultTitle = ($type !== '' ? ($type . ' – ') : '')
            . ($booking->company_name ?: $booking->client_name ?: 'Booking');

        $groupSeed = strtolower(implode('|', array_map('trim', [
            (string) ($booking->client_email ?? ''),
            (string) ($booking->client_name ?? ''),
            (string) ($booking->company_name ?? ''),
            $type,
        ])));

        return [
            'id' => $booking->id,
            'kind' => 'booking',
            'title' => $clientSafe ? ($type !== '' ? $type : 'My Booking') : ($publicTitle !== '' ? $publicTitle : $defaultTitle),
            'start' => optional($booking->booking_date_from)->format('Y-m-d\TH:i'),
            'end' => optional($booking->booking_date_to)->format('Y-m-d\TH:i'),
            'status' => $status,
            'payment_status' => (string) ($booking->payment_status ?? 'unpaid'),
            'area' => $venueArea !== '' ? $venueArea : null,
            'block' => $serviceName !== '' ? $serviceName : null,
            'guests' => $booking->number_of_guests,
            'is_client_owned' => $clientSafe,
            'is_public_calendar_visible' => (bool) ($booking->is_public_calendar_visible ?? false),
            'groupKey' => substr(hash('sha1', $groupSeed !== '' ? $groupSeed : ('booking|' . $booking->id)), 0, 16),
        ];
    }

    private function buildPublicEventItems(Carbon $start, Carbon $end): Collection
    {
        $publicEvents = PublicEvent::query()
            ->where('is_public', true)
            ->whereDate('event_date', '>=', $start)
            ->whereDate('event_date', '<=', $end)
            ->orderBy('event_date')
            ->get([
                'id',
                'title',
                'venue',
                'event_date',
                'event_time',
            ]);

        return $publicEvents->map(function (PublicEvent $event) {
            $eventDate = Carbon::parse($event->event_date);
            $time = trim((string) ($event->event_time ?? ''));
            $startAt = $eventDate->copy()->startOfDay();
            $endAt = $eventDate->copy()->endOfDay();

            if (preg_match('/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/', $time, $matches) === 1) {
                $startAt = Carbon::parse($eventDate->format('Y-m-d') . ' ' . $matches[1]);
                $endAt = Carbon::parse($eventDate->format('Y-m-d') . ' ' . $matches[2]);
            }

            return [
                'id' => 'public-event-' . $event->id,
                'kind' => 'public_event',
                'title' => 'PUBLIC: ' . $event->title,
                'start' => $startAt->format('Y-m-d\TH:i'),
                'end' => $endAt->format('Y-m-d\TH:i'),
                'status' => 'public_booked',
                'area' => (string) ($event->venue ?? ''),
                'groupKey' => substr(hash('sha1', 'public-event|' . $event->id), 0, 16),
            ];
        });
    }

    private function buildCalendarBlockEvents(Carbon $start, Carbon $end, bool $publicSafe = false): Collection
    {
        $calendarBlocks = CalendarBlock::query()
            ->whereDate('date_to', '>=', $start->format('Y-m-d'))
            ->whereDate('date_from', '<=', $end->format('Y-m-d'))
            ->orderBy('date_from')
            ->get([
                'id',
                'title',
                'area',
                'block',
                'public_status',
                'date_from',
                'date_to',
            ]);

        return $calendarBlocks->map(function (CalendarBlock $calendarBlock) use ($start, $end, $publicSafe) {
            $rangeStart = Carbon::parse($calendarBlock->date_from)->startOfDay();
            $rangeEnd = Carbon::parse($calendarBlock->date_to)->startOfDay();

            if ($rangeStart->lt($start)) {
                $rangeStart = $start->copy()->startOfDay();
            }

            if ($rangeEnd->gt($end)) {
                $rangeEnd = $end->copy()->startOfDay();
            }

            $blockKey = strtoupper((string) ($calendarBlock->block ?? 'DAY'));
            $publicStatus = strtolower((string) ($calendarBlock->public_status ?? 'red'));

            $from = match ($blockKey) {
                'PM' => '12:00',
                'EVE' => '18:00',
                default => '06:00',
            };

            $startDt = $rangeStart->copy()->setTimeFromTimeString($from);

            $endDt = match ($blockKey) {
                'AM' => $rangeEnd->copy()->setTime(12, 0),
                'PM' => $rangeEnd->copy()->setTime(18, 0),
                'EVE', 'DAY' => $rangeEnd->copy()->setTime(23, 59),
                default => $rangeEnd->copy()->setTime(23, 59),
            };

            return [
                'id' => 'block-' . $calendarBlock->id,
                'kind' => 'block',
                'block_id' => $calendarBlock->id,
                'block' => $calendarBlock->block,
                'area' => $calendarBlock->area,
                'title' => $this->calendarBlockTitle($calendarBlock, $publicStatus, $publicSafe),
                'start' => $startDt->format('Y-m-d\TH:i'),
                'end' => $endDt->format('Y-m-d\TH:i'),
                'status' => match ($publicStatus) {
                    'blue' => 'public_booked',
                    'gold' => 'private_booked',
                    default => 'blocked',
                },
                'public_status' => $publicStatus,
                'groupKey' => substr(hash('sha1', 'block|' . $calendarBlock->id), 0, 16),
            ];
        });
    }

    private function calendarBlockTitle(CalendarBlock $calendarBlock, string $publicStatus, bool $publicSafe): string
    {
        $area = trim((string) ($calendarBlock->area ?? ''));
        $suffix = $area !== '' ? (' – ' . $area) : '';

        if (! $publicSafe) {
            return 'BLOCK: ' . ($calendarBlock->title ?: 'Calendar Block') . $suffix;
        }

        if ($publicStatus === 'blue') {
            return 'PUBLIC: ' . ($calendarBlock->title ?: 'Public Calendar Activity') . $suffix;
        }

        if ($publicStatus === 'gold') {
            return 'Reserved Block' . $suffix;
        }

        return 'Unavailable Block' . $suffix;
    }

    private function areaOptions(): array
    {
        return [
            'FULL HALL',
            'MAIN HALL',
            'FOYER & LOBBY AREA',
            'VIP LOUNGE',
            'BOARD ROOM',
            'BASEMENT',
            'GALLERY2600',
            'LED WALL',
        ];
    }
}
