<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\CalendarBlock;
use App\Models\PublicEvent;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use App\Support\BcccExcelExport;
use App\Support\WorkspacePage;

class CalendarAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        [$start, $end] = $this->resolveRange($request);
        $payload = $this->buildPayload($start, $end);

        return Inertia::render(WorkspacePage::resolve($request, 'calendar/analytics'), $payload);
    }

    public function print(Request $request)
    {
        [$start, $end] = $this->resolveRange($request);
        $payload = $this->buildPayload($start, $end);

        return Inertia::render(WorkspacePage::resolve($request, 'calendar/analytics-print'), $payload);
    }

    public function export(Request $request)
    {
        [$start, $end] = $this->resolveRange($request);
        $payload = $this->buildPayload($start, $end);

        $summaryRows = collect($payload['summary'])
            ->map(fn ($value, $key) => BcccExcelExport::row([
                ucwords(str_replace('_', ' ', (string) $key)),
                is_scalar($value) ? (string) $value : json_encode($value),
            ]))
            ->values()
            ->all();

        return BcccExcelExport::download('calendar-analytics-' . $start->format('Ymd') . '-' . $end->format('Ymd') . '.xls', [
            [
                'name' => 'Summary',
                'title' => 'BCCC Calendar Analytics Export',
                'subtitle' => 'Date range ' . $payload['filters']['start_date'] . ' to ' . $payload['filters']['end_date'] . ' - generated ' . now()->format('F d, Y h:i A'),
                'widths' => [250, 180],
                'rows' => [
                    BcccExcelExport::section('Summary Metrics'),
                    BcccExcelExport::header(['Metric', 'Value']),
                    ...$summaryRows,
                    BcccExcelExport::section('Block Usage'),
                    BcccExcelExport::header(['Block', 'Occupied Block Days']),
                    ...collect($payload['block_usage'])->map(fn ($row) => BcccExcelExport::row([$row['block'], $row['count']]))->all(),
                    BcccExcelExport::section('Block Status Mix'),
                    BcccExcelExport::header(['Status', 'Days']),
                    ...collect($payload['block_status_mix'])->map(fn ($row) => BcccExcelExport::row([$row['status'], $row['count']]))->all(),
                    BcccExcelExport::section('Weekday Utilization'),
                    BcccExcelExport::header(['Weekday', 'Activity']),
                    ...collect($payload['weekday_usage'])->map(fn ($row) => BcccExcelExport::row([$row['weekday'], $row['count']]))->all(),
                ],
            ],
            [
                'name' => 'Areas',
                'title' => 'Area Utilization',
                'subtitle' => 'Booking services, calendar blocks, and public events by area.',
                'widths' => [240, 120, 130, 130, 100],
                'rows' => [
                    BcccExcelExport::header(['Area', 'Booking Services', 'Calendar Blocks', 'Public Events', 'Total']),
                    ...collect($payload['area_usage'])->map(fn ($row) => BcccExcelExport::row([$row['area'], $row['bookings'], $row['calendar_blocks'], $row['public_events'], $row['total']]))->all(),
                ],
            ],
            [
                'name' => 'Busiest Dates',
                'title' => 'Busiest Calendar Dates',
                'subtitle' => 'Highest-activity days in the selected range.',
                'widths' => [120, 140, 130, 130, 110, 130],
                'rows' => [
                    BcccExcelExport::header(['Date', 'Occupied Blocks', 'Public Events', 'Calendar Blocks', 'Bookings', 'Total Activity']),
                    ...collect($payload['busiest_dates'])->map(fn ($row) => BcccExcelExport::row([$row['date'], $row['occupied_blocks'], $row['public_events'], $row['calendar_blocks'], $row['bookings'], $row['total_activity']]))->all(),
                ],
            ],
            [
                'name' => 'Date Series',
                'title' => 'Calendar Daily Series',
                'subtitle' => 'Daily activity details for charting and reconciliation.',
                'widths' => [120, 140, 110, 130, 130, 130],
                'rows' => [
                    BcccExcelExport::header(['Date', 'Occupied Blocks', 'Bookings', 'Calendar Blocks', 'Public Events', 'Total Activity']),
                    ...collect($payload['date_series'])->map(fn ($row) => BcccExcelExport::row([$row['date'], $row['occupied_blocks'], $row['bookings'], $row['calendar_blocks'], $row['public_events'], $row['total_activity']]))->all(),
                ],
            ],
        ]);
    }

    protected function buildPayload(Carbon $start, Carbon $end): array
    {
        $bookings = Booking::query()
            ->with(['bookingServices.service'])
            ->whereDate('booking_date_to', '>=', $start->toDateString())
            ->whereDate('booking_date_from', '<=', $end->toDateString())
            ->get();

        $calendarBlocks = CalendarBlock::query()
            ->whereDate('date_to', '>=', $start->toDateString())
            ->whereDate('date_from', '<=', $end->toDateString())
            ->get();

        $publicEvents = PublicEvent::query()
            ->where('is_public', true)
            ->whereDate('event_date', '>=', $start->toDateString())
            ->whereDate('event_date', '<=', $end->toDateString())
            ->get();

        $dateSeries = [];
        foreach (CarbonPeriod::create($start->copy(), $end->copy()) as $date) {
            $key = $date->toDateString();
            $dateSeries[$key] = [
                'date' => $key,
                'occupied_blocks' => 0,
                'bookings' => 0,
                'calendar_blocks' => 0,
                'public_events' => 0,
                'total_activity' => 0,
            ];
        }

        $blockUsage = ['AM' => 0, 'PM' => 0, 'EVE' => 0];
        $blockStatusMix = [
            'blocked' => 0,
            'private_booked' => 0,
            'public_booked' => 0,
        ];
        $weekdayUsage = [
            'Sunday' => 0,
            'Monday' => 0,
            'Tuesday' => 0,
            'Wednesday' => 0,
            'Thursday' => 0,
            'Friday' => 0,
            'Saturday' => 0,
        ];
        $areaUsage = [];
        $upcomingWindow = [];

        foreach ($bookings as $booking) {
            $bookingRangeStart = optional($booking->booking_date_from)?->copy() ?? Carbon::parse($booking->booking_date_from);
            $bookingRangeEnd = optional($booking->booking_date_to)?->copy() ?? Carbon::parse($booking->booking_date_to);

            $periodStart = $bookingRangeStart->copy()->startOfDay()->max($start->copy()->startOfDay());
            $periodEnd = $bookingRangeEnd->copy()->startOfDay()->min($end->copy()->startOfDay());

            foreach (CarbonPeriod::create($periodStart, $periodEnd) as $date) {
                $dateKey = $date->toDateString();
                $touchedBlocks = $this->bookingTouchedBlocksOnDate($bookingRangeStart, $bookingRangeEnd, $date);

                if (!empty($touchedBlocks)) {
                    $dateSeries[$dateKey]['bookings']++;
                    $dateSeries[$dateKey]['occupied_blocks'] += count($touchedBlocks);
                    $weekdayUsage[$date->englishDayOfWeek] += count($touchedBlocks);
                }

                foreach ($touchedBlocks as $block) {
                    $blockUsage[$block]++;
                }
            }

            foreach (($booking->bookingServices ?? collect()) as $item) {
                $service = $item->service;
                $area = trim((string) (
                    $service->service_type
                    ?? data_get($service, 'serviceType.name')
                    ?? $service->name
                    ?? 'Booked service'
                ));

                if ($area === '') {
                    $area = 'Booked service';
                }

                if (!isset($areaUsage[$area])) {
                    $areaUsage[$area] = [
                        'area' => $area,
                        'bookings' => 0,
                        'calendar_blocks' => 0,
                        'public_events' => 0,
                        'total' => 0,
                    ];
                }

                $areaUsage[$area]['bookings']++;
                $areaUsage[$area]['total']++;
            }
        }

        foreach ($calendarBlocks as $block) {
            $rangeStart = Carbon::parse($block->date_from)->startOfDay()->max($start->copy()->startOfDay());
            $rangeEnd = Carbon::parse($block->date_to)->startOfDay()->min($end->copy()->startOfDay());
            $statusKey = match (strtolower((string) ($block->public_status ?? 'red'))) {
                'blue' => 'public_booked',
                'gold' => 'private_booked',
                default => 'blocked',
            };

            $area = trim((string) ($block->area ?? '')) ?: 'Unspecified area';
            if (!isset($areaUsage[$area])) {
                $areaUsage[$area] = [
                    'area' => $area,
                    'bookings' => 0,
                    'calendar_blocks' => 0,
                    'public_events' => 0,
                    'total' => 0,
                ];
            }

            foreach (CarbonPeriod::create($rangeStart, $rangeEnd) as $date) {
                $dateKey = $date->toDateString();
                $touchedBlocks = $this->calendarBlockTouchedBlocks((string) $block->block);

                $dateSeries[$dateKey]['calendar_blocks']++;
                $dateSeries[$dateKey]['occupied_blocks'] += count($touchedBlocks);
                $weekdayUsage[$date->englishDayOfWeek] += count($touchedBlocks);

                foreach ($touchedBlocks as $blockKey) {
                    $blockUsage[$blockKey]++;
                    $blockStatusMix[$statusKey]++;
                }

                $areaUsage[$area]['calendar_blocks']++;
                $areaUsage[$area]['total']++;
            }
        }

        foreach ($publicEvents as $event) {
            $date = Carbon::parse($event->event_date);
            $key = $date->toDateString();
            if (!isset($dateSeries[$key])) {
                continue;
            }

            $dateSeries[$key]['public_events']++;
            $dateSeries[$key]['total_activity']++;
            $weekdayUsage[$date->englishDayOfWeek]++;

            $venue = trim((string) ($event->venue ?? '')) ?: 'Unspecified venue';
            if (!isset($areaUsage[$venue])) {
                $areaUsage[$venue] = [
                    'area' => $venue,
                    'bookings' => 0,
                    'calendar_blocks' => 0,
                    'public_events' => 0,
                    'total' => 0,
                ];
            }

            $areaUsage[$venue]['public_events']++;
            $areaUsage[$venue]['total']++;
        }

        foreach ($dateSeries as &$row) {
            $row['total_activity'] = $row['occupied_blocks'] + $row['public_events'];
        }
        unset($row);

        $busiestDates = collect($dateSeries)
            ->sortByDesc('total_activity')
            ->take(12)
            ->values()
            ->all();

        $areaUsageRows = collect($areaUsage)
            ->sortByDesc('total')
            ->take(20)
            ->values()
            ->all();

        $today = Carbon::today();
        for ($i = 0; $i < 30; $i++) {
            $date = $today->copy()->addDays($i)->toDateString();
            if (isset($dateSeries[$date])) {
                $upcomingWindow[] = $dateSeries[$date];
            }
        }

        $summary = [
            'bookings_in_range' => $bookings->count(),
            'public_events_in_range' => $publicEvents->count(),
            'calendar_blocks_in_range' => $calendarBlocks->count(),
            'occupied_block_days' => array_sum($blockUsage),
            'total_activity' => (int) collect($dateSeries)->sum('total_activity'),
            'range_days' => $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1,
            'booked_guest_volume' => (int) $bookings->sum(fn ($booking) => (int) ($booking->number_of_guests ?? 0)),
            'tracked_areas' => count($areaUsageRows),
            'peak_daily_activity' => (int) (collect($dateSeries)->max('total_activity') ?? 0),
            'peak_daily_occupied_blocks' => (int) (collect($dateSeries)->max('occupied_blocks') ?? 0),
        ];

        return [
            'filters' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'generated_at' => now()->toIso8601String(),
            'summary' => $summary,
            'block_usage' => collect($blockUsage)->map(fn ($count, $block) => [
                'block' => $block,
                'count' => $count,
            ])->values()->all(),
            'block_status_mix' => collect($blockStatusMix)->map(fn ($count, $status) => [
                'status' => $status,
                'count' => $count,
            ])->values()->all(),
            'weekday_usage' => collect($weekdayUsage)->map(fn ($count, $weekday) => [
                'weekday' => $weekday,
                'count' => $count,
            ])->values()->all(),
            'area_usage' => $areaUsageRows,
            'busiest_dates' => $busiestDates,
            'date_series' => array_values($dateSeries),
            'upcoming_window' => $upcomingWindow,
        ];
    }

    protected function resolveRange(Request $request): array
    {
        $start = $request->filled('start_date')
            ? Carbon::parse($request->string('start_date')->toString())->startOfDay()
            : now()->startOfMonth();

        $end = $request->filled('end_date')
            ? Carbon::parse($request->string('end_date')->toString())->endOfDay()
            : now()->endOfMonth();

        if ($end->lt($start)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        if ($start->diffInDays($end) > 366) {
            $end = $start->copy()->addDays(366)->endOfDay();
        }

        return [$start, $end];
    }

    protected function bookingTouchedBlocksOnDate(Carbon $start, Carbon $end, Carbon $date): array
    {
        $blocks = [];

        foreach (['AM', 'PM', 'EVE'] as $block) {
            [$blockStart, $blockEnd] = $this->dateBlockRange($date, $block);
            if ($start->lt($blockEnd) && $end->gt($blockStart)) {
                $blocks[] = $block;
            }
        }

        return $blocks;
    }

    protected function calendarBlockTouchedBlocks(string $block): array
    {
        return match (strtoupper($block)) {
            'AM' => ['AM'],
            'PM' => ['PM'],
            'EVE' => ['EVE'],
            default => ['AM', 'PM', 'EVE'],
        };
    }

    protected function dateBlockRange(Carbon $date, string $block): array
    {
        return match (strtoupper($block)) {
            'AM' => [$date->copy()->setTime(6, 0), $date->copy()->setTime(12, 0)],
            'PM' => [$date->copy()->setTime(12, 0), $date->copy()->setTime(18, 0)],
            default => [$date->copy()->setTime(18, 0), $date->copy()->addDay()->startOfDay()],
        };
    }

    protected function csv(array $values): string
    {
        return collect($values)
            ->map(function ($value) {
                $string = (string) $value;
                if (str_contains($string, '"') || str_contains($string, ',') || str_contains($string, "\n")) {
                    $string = '"' . str_replace('"', '""', $string) . '"';
                }
                return $string;
            })
            ->implode(',');
    }
}
