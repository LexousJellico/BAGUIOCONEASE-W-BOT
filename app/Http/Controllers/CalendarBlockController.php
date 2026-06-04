<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkCalendarBlockRequest;
use App\Http\Requests\StoreCalendarBlockRequest;
use App\Models\CalendarBlock;
use App\Services\NotificationService;
use App\Support\WorkspaceAccess;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarBlockController extends Controller
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function store(StoreCalendarBlockRequest $request): JsonResponse
    {
        $this->ensureManageAccess($request);

        $payload = $this->payload($request);
        $payload['created_by_user_id'] = $request->user()?->id;

        $calendarBlock = CalendarBlock::query()->create($payload);

        $this->notifications->calendarBlockCreated($calendarBlock->fresh(), $request->user());

        return response()->json([
            'message' => 'Calendar block created successfully.',
            'item' => $this->row($calendarBlock->fresh()),
        ]);
    }

    public function bulkStore(BulkCalendarBlockRequest $request): JsonResponse
    {
        $this->ensureManageAccess($request);

        $payload = $this->bulkPayload($request);
        $payload['created_by_user_id'] = $request->user()?->id;

        $excludeDates = collect((array) $request->input('exclude_dates', []))
            ->filter()
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->values()
            ->all();

        $start = Carbon::parse($request->input('date_from'))->startOfDay();
        $end = Carbon::parse($request->input('date_to'))->startOfDay();

        $explodeByDay = (bool) $request->boolean('explode_by_day');
        $excludeWeekends = (bool) $request->boolean('exclude_weekends');

        $created = collect();

        if (! $explodeByDay) {
            $created->push(CalendarBlock::query()->create([
                ...$payload,
                'date_from' => $start->toDateString(),
                'date_to' => $end->toDateString(),
            ]));
        } else {
            for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
                if ($excludeWeekends && in_array((int) $day->dayOfWeekIso, [6, 7], true)) {
                    continue;
                }

                if (in_array($day->toDateString(), $excludeDates, true)) {
                    continue;
                }

                $created->push(CalendarBlock::query()->create([
                    ...$payload,
                    'date_from' => $day->toDateString(),
                    'date_to' => $day->toDateString(),
                ]));
            }
        }

        $this->notifications->calendarBlocksBulkCreated($created, $request->user());

        return response()->json([
            'message' => $created->count() === 1
                ? 'Bulk calendar action created 1 block.'
                : 'Bulk calendar action created ' . $created->count() . ' blocks.',
            'created_count' => $created->count(),
            'items' => $created
                ->take(50)
                ->map(fn (CalendarBlock $block) => $this->row($block->fresh()))
                ->values(),
        ]);
    }

    public function update(StoreCalendarBlockRequest $request, CalendarBlock $calendarBlock): JsonResponse
    {
        $this->ensureManageAccess($request);

        $original = $calendarBlock->getOriginal();
        $calendarBlock->update($this->payload($request));

        $this->notifications->calendarBlockUpdated($calendarBlock->fresh(), $request->user(), $this->changedFields($original, $calendarBlock->getAttributes()));

        return response()->json([
            'message' => 'Calendar block updated successfully.',
            'item' => $this->row($calendarBlock->fresh()),
        ]);
    }

    public function destroy(Request $request, CalendarBlock $calendarBlock): JsonResponse
    {
        $this->ensureManageAccess($request);

        $id = $calendarBlock->id;
        $this->notifications->calendarBlockDeleted($calendarBlock, $request->user());
        $calendarBlock->delete();

        return response()->json([
            'message' => 'Calendar block deleted successfully.',
            'id' => $id,
        ]);
    }


    protected function changedFields(array $before, array $after): array
    {
        $changes = [];

        foreach (['title', 'area', 'notes', 'block', 'public_status', 'date_from', 'date_to'] as $field) {
            $old = $before[$field] ?? null;
            $new = $after[$field] ?? null;

            if ((string) $old !== (string) $new) {
                $changes[$field] = [$old, $new];
            }
        }

        return $changes;
    }

    protected function payload(StoreCalendarBlockRequest $request): array
    {
        return [
            'title' => trim((string) $request->input('title')),
            'area' => $request->filled('area') ? trim((string) $request->input('area')) : null,
            'notes' => $request->filled('notes') ? trim((string) $request->input('notes')) : null,
            'block' => strtoupper((string) $request->input('block')),
            'public_status' => strtolower((string) $request->input('public_status')),
            'date_from' => Carbon::parse($request->input('date_from'))->toDateString(),
            'date_to' => Carbon::parse($request->input('date_to'))->toDateString(),
        ];
    }

    protected function bulkPayload(BulkCalendarBlockRequest $request): array
    {
        return [
            'title' => trim((string) $request->input('title')),
            'area' => $request->filled('area') ? trim((string) $request->input('area')) : null,
            'notes' => $request->filled('notes') ? trim((string) $request->input('notes')) : null,
            'block' => strtoupper((string) $request->input('block')),
            'public_status' => strtolower((string) $request->input('public_status')),
        ];
    }

    protected function row(CalendarBlock $calendarBlock): array
    {
        $calendarBlock->loadMissing('createdBy');

        $dateFrom = $this->dateString($calendarBlock->date_from);
        $dateTo = $this->dateString($calendarBlock->date_to);
        $block = strtoupper((string) ($calendarBlock->block ?? 'DAY'));
        $publicStatus = strtolower((string) ($calendarBlock->public_status ?? 'red'));

        return [
            'id' => $calendarBlock->id,
            'title' => $calendarBlock->title,
            'area' => $calendarBlock->area ?? '',
            'notes' => $calendarBlock->notes ?? '',
            'note' => $calendarBlock->notes ?? '',
            'block' => $block,
            'blockLabel' => $this->blockLabel($block),
            'public_status' => $publicStatus,
            'statusColor' => $publicStatus,
            'statusLabel' => $this->statusLabel($publicStatus),
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'starts_at' => $this->startDateTime($dateFrom, $block),
            'ends_at' => $this->endDateTime($dateTo, $block),
            'spansMultipleDays' => $dateFrom !== '' && $dateTo !== '' && $dateFrom !== $dateTo,
            'created_by_user_id' => $calendarBlock->created_by_user_id,
            'created_by' => $calendarBlock->createdBy ? [
                'id' => $calendarBlock->createdBy->id,
                'name' => $calendarBlock->createdBy->name,
                'email' => $calendarBlock->createdBy->email,
            ] : null,
            'created_at' => optional($calendarBlock->created_at)->toIso8601String(),
            'updated_at' => optional($calendarBlock->updated_at)->toIso8601String(),
        ];
    }

    protected function dateString($value): string
    {
        if (! $value) {
            return '';
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->format('Y-m-d');
        }

        return Carbon::parse($value)->format('Y-m-d');
    }

    protected function startDateTime(string $date, string $block): ?string
    {
        if ($date === '') {
            return null;
        }

        $day = Carbon::parse($date)->startOfDay();

        return match (strtoupper($block)) {
            'AM' => $day->copy()->setTime(6, 0)->format('Y-m-d\TH:i'),
            'PM' => $day->copy()->setTime(12, 0)->format('Y-m-d\TH:i'),
            'EVE' => $day->copy()->setTime(18, 0)->format('Y-m-d\TH:i'),
            default => $day->copy()->setTime(6, 0)->format('Y-m-d\TH:i'),
        };
    }

    protected function endDateTime(string $date, string $block): ?string
    {
        if ($date === '') {
            return null;
        }

        $day = Carbon::parse($date)->startOfDay();

        return match (strtoupper($block)) {
            'AM' => $day->copy()->setTime(12, 0)->format('Y-m-d\TH:i'),
            'PM' => $day->copy()->setTime(18, 0)->format('Y-m-d\TH:i'),
            'EVE' => $day->copy()->setTime(23, 59)->format('Y-m-d\TH:i'),
            default => $day->copy()->setTime(23, 59)->format('Y-m-d\TH:i'),
        };
    }

    protected function blockLabel(string $block): string
    {
        return match (strtoupper($block)) {
            'AM' => 'AM (6:00 AM - 12:00 PM)',
            'PM' => 'PM (12:00 PM - 6:00 PM)',
            'EVE' => 'EVE (6:00 PM - 11:59 PM)',
            default => 'Whole Day',
        };
    }

    protected function statusLabel(string $publicStatus): string
    {
        return match (strtolower($publicStatus)) {
            'blue' => 'Public / visible event',
            'gold' => 'Private / reserved',
            default => 'Blocked / unavailable',
        };
    }

    protected function ensureManageAccess(Request $request): void
    {
        $user = $request->user();

        abort_unless($user, 403);

        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'manager'])) {
            return;
        }

        if (in_array((string) ($user->role_name ?? $user->role ?? ''), ['admin', 'manager'], true)) {
            return;
        }

        abort_unless(WorkspaceAccess::role($request) === 'admin' || WorkspaceAccess::role($request) === 'manager', 403);
    }
}
