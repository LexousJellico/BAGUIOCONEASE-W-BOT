<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingLifecycleEvent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use App\Support\BcccExcelExport;
use App\Support\WorkspacePage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookingAuditController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $this->filtersFromRequest($request);
        $perPage = max(10, min(100, (int) $request->integer('per_page', 20)));

        $query = $this->baseQuery($filters);
        $stats = $this->buildStats(clone $query);

        $paginator = (clone $query)
            ->orderByDesc('event_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        $paginator->setCollection($this->transformEvents(collect($paginator->items())));

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/audit'), [
            'events' => $paginator,
            'filters' => $filters,
            'stats' => $stats,
            'eventKeys' => $this->eventKeys(),
            'statusOptions' => $this->statusOptions(),
            'paymentStatusOptions' => $this->paymentStatusOptions(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $filters = $this->filtersFromRequest($request);

        $rows = $this->transformEvents(
            $this->baseQuery($filters)
                ->orderByDesc('event_at')
                ->orderByDesc('id')
                ->limit(5000)
                ->get()
        );

        $headers = [
            'Audit ID',
            'Booking ID',
            'Booking Exists',
            'Event Key',
            'Title',
            'From Booking Status',
            'To Booking Status',
            'From Payment Status',
            'To Payment Status',
            'Reason',
            'Actor Name',
            'Actor Email',
            'Event At',
            'Created At',
            'Meta',
        ];

        return BcccExcelExport::download('booking-audit-' . now()->format('Y-m-d_H-i-s') . '.xls', [
            [
                'name' => 'Audit Trail',
                'title' => 'BCCC Booking Audit Export',
                'subtitle' => 'Lifecycle activity, status movement, and payment review trace - generated ' . now()->format('F d, Y h:i A'),
                'widths' => [70, 80, 90, 160, 230, 125, 125, 135, 135, 260, 160, 220, 145, 145, 300],
                'rows' => [
                    BcccExcelExport::section('Audit Trail'),
                    BcccExcelExport::header($headers),
                    ...$rows->map(fn ($row) => BcccExcelExport::row([
                        $row['id'],
                        $row['booking_id'],
                        $row['booking_exists'] ? 'Yes' : 'No',
                        $row['event_key'],
                        $row['title'],
                        $row['from_status'],
                        $row['to_status'],
                        $row['from_payment_status'],
                        $row['to_payment_status'],
                        $row['reason'],
                        data_get($row, 'actor.name'),
                        data_get($row, 'actor.email'),
                        $row['event_at'],
                        $row['created_at'],
                        json_encode($row['meta'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    ]))->all(),
                ],
            ],
        ]);
    }

    public function printReport(Request $request): Response
    {
        $filters = $this->filtersFromRequest($request);
        $query = $this->baseQuery($filters);
        $stats = $this->buildStats(clone $query);

        $events = $this->transformEvents(
            (clone $query)
                ->orderByDesc('event_at')
                ->orderByDesc('id')
                ->limit(300)
                ->get()
        );

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/audit-print'), [
            'events' => $events,
            'filters' => $filters,
            'stats' => $stats,
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    protected function filtersFromRequest(Request $request): array
    {
        return [
            'q' => trim((string) $request->string('q')->toString()),
            'event_key' => trim((string) $request->string('event_key')->toString()),
            'status' => trim((string) $request->string('status')->toString()),
            'payment_status' => trim((string) $request->string('payment_status')->toString()),
            'date_from' => trim((string) $request->string('date_from')->toString()),
            'date_to' => trim((string) $request->string('date_to')->toString()),
            'booking_id' => trim((string) $request->string('booking_id')->toString()),
            'only_deleted' => $request->boolean('only_deleted'),
        ];
    }

    protected function baseQuery(array $filters): Builder
    {
        return BookingLifecycleEvent::query()
            ->with(['actor:id,name,email'])
            ->when($filters['q'] !== '', function (Builder $q) use ($filters) {
                $needle = $filters['q'];
                $q->where(function (Builder $inner) use ($needle) {
                    $inner->where('title', 'like', "%{$needle}%")
                        ->orWhere('reason', 'like', "%{$needle}%")
                        ->orWhere('event_key', 'like', "%{$needle}%")
                        ->orWhereHas('actor', function (Builder $actor) use ($needle) {
                            $actor->where('name', 'like', "%{$needle}%")
                                ->orWhere('email', 'like', "%{$needle}%");
                        });

                    if (is_numeric($needle)) {
                        $inner->orWhere('booking_id', (int) $needle)
                            ->orWhere('id', (int) $needle);
                    }
                });
            })
            ->when($filters['booking_id'] !== '' && is_numeric($filters['booking_id']), function (Builder $q) use ($filters) {
                $q->where('booking_id', (int) $filters['booking_id']);
            })
            ->when($filters['event_key'] !== '', fn (Builder $q) => $q->where('event_key', $filters['event_key']))
            ->when($filters['status'] !== '', function (Builder $q) use ($filters) {
                $status = $filters['status'];
                $q->where(function (Builder $inner) use ($status) {
                    $inner->where('to_status', $status)
                        ->orWhere('from_status', $status);
                });
            })
            ->when($filters['payment_status'] !== '', function (Builder $q) use ($filters) {
                $paymentStatus = $filters['payment_status'];
                $q->where(function (Builder $inner) use ($paymentStatus) {
                    $inner->where('to_payment_status', $paymentStatus)
                        ->orWhere('from_payment_status', $paymentStatus);
                });
            })
            ->when($filters['only_deleted'], fn (Builder $q) => $q->where('event_key', 'booking_auto_deleted'))
            ->when($filters['date_from'] !== '', fn (Builder $q) => $q->whereDate('event_at', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '', fn (Builder $q) => $q->whereDate('event_at', '<=', $filters['date_to']));
    }

    protected function buildStats(Builder $statsQuery): array
    {
        return [
            'total' => (clone $statsQuery)->count(),
            'status_changes' => (clone $statsQuery)->where('event_key', 'booking_status_changed')->count(),
            'payment_changes' => (clone $statsQuery)->where('event_key', 'payment_status_changed')->count(),
            'auto_deleted' => (clone $statsQuery)->where('event_key', 'booking_auto_deleted')->count(),
            'today' => (clone $statsQuery)->whereDate('event_at', now()->toDateString())->count(),
            'unique_bookings' => (clone $statsQuery)->whereNotNull('booking_id')->distinct('booking_id')->count('booking_id'),
        ];
    }

    protected function transformEvents(Collection $items): Collection
    {
        $existingIds = Booking::query()
            ->whereIn('id', $items->pluck('booking_id')->filter()->unique()->values())
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
        $existingMap = array_fill_keys($existingIds, true);

        return $items->map(function (BookingLifecycleEvent $event) use ($existingMap) {
            $actor = $event->actor;
            $bookingId = $event->booking_id ? (int) $event->booking_id : null;
            $meta = is_array($event->meta) ? $event->meta : [];

            return [
                'id' => (int) $event->id,
                'booking_id' => $bookingId,
                'booking_exists' => $bookingId ? isset($existingMap[$bookingId]) : false,
                'event_key' => (string) $event->event_key,
                'title' => (string) $event->title,
                'from_status' => $event->from_status,
                'to_status' => $event->to_status,
                'from_payment_status' => $event->from_payment_status,
                'to_payment_status' => $event->to_payment_status,
                'reason' => $event->reason,
                'meta' => $meta,
                'event_at' => optional($event->event_at ?? $event->created_at)->toIso8601String(),
                'created_at' => optional($event->created_at)->toIso8601String(),
                'actor' => $actor ? [
                    'id' => (int) $actor->id,
                    'name' => (string) $actor->name,
                    'email' => (string) $actor->email,
                ] : null,
            ];
        })->values();
    }

    protected function eventKeys(): array
    {
        return [
            'booking_created',
            'booking_updated',
            'payment_status_changed',
            'booking_status_changed',
            'booking_auto_deleted',
        ];
    }

    protected function statusOptions(): array
    {
        return [
            'pending',
            'confirmed',
            'active',
            'completed',
            'declined',
            'cancelled',
            'deleted',
        ];
    }

    protected function paymentStatusOptions(): array
    {
        return [
            'unpaid',
            'partial',
            'paid',
            'owing',
        ];
    }
}
