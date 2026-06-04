<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\CalendarBlock;
use App\Models\MiceRecord;
use App\Models\PublicEvent;
use App\Models\PublicInquiry;
use App\Models\Service;
use App\Models\ServiceType;
use App\Models\SitePageView;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\BookingService;
use App\Support\WorkspaceAccess;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class WorkspaceHomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return $this->index($request);
    }

    public function index(Request $request): Response
    {
        $role = $this->resolveWorkspaceRole($request);

        $this->syncBookingLifecycle();

        $props = [
            'workspaceRole' => $role,
            'workspaceStats' => $this->workspaceStats($request, $role),
            'recentBookings' => $this->recentBookings($request, $role),
            'todaySchedule' => $this->todaySchedule($request, $role),
            'workspaceSummary' => $this->workspaceSummary($role),
        ];

        if ($role === 'admin') {
            $props['adminCommandCenter'] = $this->adminCommandCenter($request, $props['workspaceStats']);
        }

        return Inertia::render($this->resolvePage($role), $props);
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

        if (in_array($path, ['/book', '/my-dashboard', '/my-bookings', '/my-calendar'], true) || str_starts_with($path, '/my-bookings/')) {
            return 'user';
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

    private function resolvePage(string $role): string
    {
        return match ($role) {
            'admin' => 'admin/dashboard',
            'manager' => 'manager/dashboard',
            'staff' => 'staff/dashboard',
            default => 'user/dashboard',
        };
    }

    private function workspaceSummary(string $role): array
    {
        return match ($role) {
            'admin' => [
                'eyebrow' => 'Executive Control Center',
                'title' => 'Administrator Dashboard',
                'description' => 'Full authority command center for public website content, bookings, users, reports, venue setup, payment deadlines, website visits, and operational monitoring.',
            ],
            'manager' => [
                'eyebrow' => 'Review and Approval Workspace',
                'title' => 'Manager Dashboard',
                'description' => 'Focused workspace for reviewing bookings, payment compliance, MICE reporting, inquiries, and calendar activities.',
            ],
            'staff' => [
                'eyebrow' => 'Daily Operations Desk',
                'title' => 'Staff Dashboard',
                'description' => 'Fast operational workspace for assisted bookings, schedule checking, handling inquiries, and supporting clients.',
            ],
            default => [
                'eyebrow' => 'Client Booking Portal',
                'title' => 'My Booking Dashboard',
                'description' => 'Private client workspace for creating event requests, tracking your submitted bookings, and checking your own schedule references.',
            ],
        };
    }

    private function syncBookingLifecycle(): void
    {
        try {
            /** @var BookingService $bookingService */
            $bookingService = app(BookingService::class);

            if (method_exists($bookingService, 'syncLifecycleStatuses')) {
                $bookingService->syncLifecycleStatuses();
            }
        } catch (Throwable) {
            // Keep dashboards usable even if lifecycle syncing has an issue.
        }
    }

    private function workspaceStats(Request $request, string $role): array
    {
        $statusCounts = $this->statusCounts($request, $role);
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();
        $bookingQuery = $this->bookingQuery($request, $role);

        return [
            'pending' => (int) ($statusCounts['pending'] ?? 0),
            'confirmed' => (int) ($statusCounts['confirmed'] ?? 0),
            'active' => (int) ($statusCounts['active'] ?? 0),
            'completed' => (int) ($statusCounts['completed'] ?? 0),
            'cancelled' => (int) ($statusCounts['cancelled'] ?? 0),
            'declined' => (int) ($statusCounts['declined'] ?? 0),
            'total_bookings' => $this->safeCount(fn () => (clone $bookingQuery)->count()),
            'today_bookings' => $this->safeCount(fn () => (clone $bookingQuery)
                ->whereDate('booking_date_from', '<=', $today)
                ->whereDate('booking_date_to', '>=', $today)
                ->count()),
            'month_bookings' => $this->safeCount(fn () => (clone $bookingQuery)
                ->whereDate('booking_date_to', '>=', $startOfMonth)
                ->whereDate('booking_date_from', '<=', $endOfMonth)
                ->count()),
            'month_blocks' => $this->safeCount(fn () => CalendarBlock::query()
                ->whereDate('date_to', '>=', $startOfMonth)
                ->whereDate('date_from', '<=', $endOfMonth)
                ->count()),
            'month_public_events' => $this->safeCount(fn () => PublicEvent::query()
                ->whereDate('event_date', '>=', $startOfMonth)
                ->whereDate('event_date', '<=', $endOfMonth)
                ->count()),
            'payments_pending' => $this->paymentReviewCount(),
            'inquiries_pending' => $this->openInquiryCount(),
        ];
    }

    private function adminCommandCenter(Request $request, array $workspaceStats): array
    {
        $paymentSummary = $this->paymentSummary();
        $websiteSummary = $this->websiteSummary($workspaceStats);
        $miceSummary = $this->miceSummary();

        return [
            'headlineMetrics' => [
                [
                    'label' => 'Total Bookings',
                    'value' => (int) ($workspaceStats['total_bookings'] ?? 0),
                    'helper' => 'All reservations recorded in the system.',
                    'href' => '/admin/bookings',
                    'tone' => 'neutral',
                ],
                [
                    'label' => 'Pending Review',
                    'value' => (int) ($workspaceStats['pending'] ?? 0),
                    'helper' => 'Pencil-booked, submitted, or review-stage bookings.',
                    'href' => '/admin/bookings?status=pending',
                    'tone' => 'warn',
                ],
                [
                    'label' => 'Payment Queue',
                    'value' => (int) ($paymentSummary['pending_review'] ?? 0),
                    'helper' => 'Proofs and balances requiring finance review.',
                    'href' => '/admin/payments/review',
                    'tone' => 'info',
                ],
                [
                    'label' => 'Website Visits',
                    'value' => (int) ($websiteSummary['visits_month'] ?? 0),
                    'helper' => 'Tracked public page views this month.',
                    'href' => '/admin/content',
                    'tone' => 'good',
                ],
            ],
            'bookingStatus' => $this->bookingStatusRows($workspaceStats),
            'bookingTrend' => $this->bookingTrend(),
            'packageUsage' => $this->packageUsage(),
            'scheduleMix' => $this->scheduleMix(),
            'paymentSummary' => $paymentSummary,
            'miceSummary' => $miceSummary,
            'websiteSummary' => $websiteSummary,
            'usersSummary' => $this->usersSummary(),
            'recentUsers' => $this->recentUsers(),
            'systemHealth' => $this->systemHealth($workspaceStats, $paymentSummary, $websiteSummary),
            'recentActivity' => $this->recentActivity(),
        ];
    }

    private function statusCounts(Request $request, string $role): array
    {
        $default = [
            'pending' => 0,
            'confirmed' => 0,
            'active' => 0,
            'completed' => 0,
            'cancelled' => 0,
            'declined' => 0,
        ];

        if (! Schema::hasTable('bookings') || ! Schema::hasColumn('bookings', 'booking_status')) {
            return $default;
        }

        try {
            $counts = (clone $this->bookingQuery($request, $role))
                ->selectRaw('booking_status, COUNT(*) as aggregate')
                ->groupBy('booking_status')
                ->pluck('aggregate', 'booking_status')
                ->mapWithKeys(fn ($value, $key) => [strtolower((string) $key) => (int) $value])
                ->all();

            return array_merge($default, [
                'pending' => $this->sumStatuses($counts, ['pending', 'pencil_booked', 'for_review', 'submitted', 'awaiting_downpayment', 'awaiting_balance']),
                'confirmed' => $this->sumStatuses($counts, ['confirmed', 'approved', 'accepted']),
                'active' => $this->sumStatuses($counts, ['active']),
                'completed' => $this->sumStatuses($counts, ['completed']),
                'cancelled' => $this->sumStatuses($counts, ['cancelled', 'canceled']),
                'declined' => $this->sumStatuses($counts, ['declined', 'rejected', 'expired', 'auto_declined']),
            ]);
        } catch (Throwable) {
            return $default;
        }
    }

    /**
     * @param array<string, int> $counts
     * @param array<int, string> $statuses
     */
    private function sumStatuses(array $counts, array $statuses): int
    {
        return array_sum(array_map(
            fn (string $status) => (int) ($counts[$status] ?? 0),
            $statuses,
        ));
    }

    private function bookingQuery(Request $request, string $role): Builder
    {
        $query = Booking::query();

        if ($role === 'user') {
            WorkspaceAccess::applyBookingVisibility($request, $query);
        }

        return $query;
    }

    private function recentBookings(Request $request, string $role): array
    {
        try {
            $query = $this->bookingQuery($request, $role)
                ->orderByDesc(Schema::hasColumn('bookings', 'created_at') ? 'created_at' : 'id')
                ->limit(8);

            $columns = $this->bookingColumns([
                'id',
                'client_name',
                'company_name',
                'type_of_event',
                'booking_status',
                'payment_status',
                'booking_date_from',
                'booking_date_to',
            ]);

            return $query
                ->get($columns)
                ->map(fn (Booking $booking) => [
                    'id' => $booking->id,
                    'client_name' => (string) ($booking->client_name ?? ''),
                    'company_name' => (string) ($booking->company_name ?? ''),
                    'type_of_event' => (string) ($booking->type_of_event ?? ''),
                    'booking_status' => (string) ($booking->booking_status ?? 'pending'),
                    'payment_status' => (string) ($booking->payment_status ?? ''),
                    'booking_date_from' => $this->formatDateTime($booking->booking_date_from),
                    'booking_date_to' => $this->formatDateTime($booking->booking_date_to),
                ])
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    private function todaySchedule(Request $request, string $role): array
    {
        try {
            $today = Carbon::today();

            return $this->bookingQuery($request, $role)
                ->whereDate('booking_date_from', '<=', $today)
                ->whereDate('booking_date_to', '>=', $today)
                ->orderBy('booking_date_from')
                ->limit(8)
                ->get($this->bookingColumns([
                    'id',
                    'client_name',
                    'company_name',
                    'type_of_event',
                    'booking_status',
                    'booking_date_from',
                    'booking_date_to',
                ]))
                ->map(fn (Booking $booking) => [
                    'id' => $booking->id,
                    'title' => trim(($booking->type_of_event ?: 'Booking') . ' - ' . ($booking->company_name ?: $booking->client_name ?: 'Client')),
                    'status' => (string) ($booking->booking_status ?? 'pending'),
                    'time' => $this->formatTimeRange($booking->booking_date_from, $booking->booking_date_to),
                ])
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @param array<int, string> $columns
     * @return array<int, string>
     */
    private function bookingColumns(array $columns): array
    {
        return array_values(array_filter(
            $columns,
            fn (string $column) => $column === 'id' || Schema::hasColumn('bookings', $column),
        ));
    }

    private function bookingStatusRows(array $stats): array
    {
        return [
            ['label' => 'Pending / Review', 'value' => (int) ($stats['pending'] ?? 0), 'helper' => 'Needs action'],
            ['label' => 'Confirmed', 'value' => (int) ($stats['confirmed'] ?? 0), 'helper' => 'Approved reservations'],
            ['label' => 'Active Today', 'value' => (int) ($stats['today_bookings'] ?? $stats['active'] ?? 0), 'helper' => 'Currently scheduled'],
            ['label' => 'Completed', 'value' => (int) ($stats['completed'] ?? 0), 'helper' => 'Finished events'],
            ['label' => 'Declined / Expired', 'value' => (int) ($stats['declined'] ?? 0), 'helper' => 'Closed without approval'],
        ];
    }

    private function bookingTrend(): array
    {
        if (! Schema::hasTable('bookings')) {
            return [];
        }

        $dateColumn = Schema::hasColumn('bookings', 'booking_date_from') ? 'booking_date_from' : (Schema::hasColumn('bookings', 'created_at') ? 'created_at' : null);

        if ($dateColumn === null) {
            return [];
        }

        try {
            $start = Carbon::now()->startOfMonth()->subMonths(5);
            $rows = Booking::query()
                ->selectRaw("DATE_FORMAT({$dateColumn}, '%Y-%m') as month_key, COUNT(*) as aggregate")
                ->whereDate($dateColumn, '>=', $start)
                ->groupBy('month_key')
                ->pluck('aggregate', 'month_key')
                ->mapWithKeys(fn ($value, $key) => [(string) $key => (int) $value])
                ->all();

            return collect(range(0, 5))
                ->map(function (int $index) use ($start, $rows) {
                    $date = (clone $start)->addMonths($index);
                    $key = $date->format('Y-m');

                    return [
                        'label' => $date->format('M'),
                        'value' => (int) ($rows[$key] ?? 0),
                    ];
                })
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    private function packageUsage(): array
    {
        if (! Schema::hasTable('bookings') || ! Schema::hasColumn('bookings', 'selected_package_code')) {
            return [];
        }

        try {
            return Booking::query()
                ->selectRaw("COALESCE(NULLIF(selected_package_code, ''), 'Manual Selection') as package_code, COUNT(*) as aggregate")
                ->groupBy('package_code')
                ->orderByDesc('aggregate')
                ->limit(6)
                ->get()
                ->map(fn ($row) => [
                    'label' => $this->cleanPackageLabel((string) $row->package_code),
                    'value' => (int) $row->aggregate,
                ])
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    private function scheduleMix(): array
    {
        if (! Schema::hasTable('booking_schedule_segments') || ! Schema::hasColumn('booking_schedule_segments', 'base_block')) {
            return [];
        }

        try {
            return DB::table('booking_schedule_segments')
                ->selectRaw('base_block, COUNT(*) as aggregate')
                ->groupBy('base_block')
                ->orderByDesc('aggregate')
                ->get()
                ->map(fn ($row) => [
                    'label' => $this->cleanPackageLabel((string) $row->base_block),
                    'value' => (int) $row->aggregate,
                ])
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    private function paymentSummary(): array
    {
        $summary = [
            'pending_review' => 0,
            'approved_amount' => 0.0,
            'submitted_amount' => 0.0,
            'rejected_amount' => 0.0,
            'overdue_bookings' => 0,
            'due_soon_bookings' => 0,
        ];

        if (Schema::hasTable('booking_payments')) {
            try {
                $statusColumn = Schema::hasColumn('booking_payments', 'status') ? 'status' : null;
                $amountColumn = Schema::hasColumn('booking_payments', 'amount') ? 'amount' : null;

                if ($statusColumn) {
                    $summary['pending_review'] = (int) BookingPayment::query()
                        ->whereIn($statusColumn, ['submitted', 'for_review', 'pending'])
                        ->count();
                }

                if ($statusColumn && $amountColumn) {
                    $summary['approved_amount'] = (float) BookingPayment::query()
                        ->whereIn($statusColumn, ['approved', 'verified', 'paid', 'completed'])
                        ->sum($amountColumn);

                    $summary['submitted_amount'] = (float) BookingPayment::query()
                        ->whereIn($statusColumn, ['submitted', 'for_review', 'pending'])
                        ->sum($amountColumn);

                    $summary['rejected_amount'] = (float) BookingPayment::query()
                        ->whereIn($statusColumn, ['rejected', 'declined', 'failed'])
                        ->sum($amountColumn);
                }
            } catch (Throwable) {
                // Keep partial summary.
            }
        }

        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'expired_at')) {
            try {
                $activeStatuses = ['pending', 'pencil_booked', 'for_review', 'awaiting_downpayment', 'awaiting_balance', 'approved', 'accepted', 'confirmed'];
                $paidStatuses = ['paid', 'verified', 'completed', 'fully_paid'];
                $now = now();

                $summary['overdue_bookings'] = (int) Booking::query()
                    ->whereNotIn('payment_status', $paidStatuses)
                    ->whereIn('booking_status', $activeStatuses)
                    ->whereNotNull('expired_at')
                    ->where('expired_at', '<=', $now)
                    ->count();

                $summary['due_soon_bookings'] = (int) Booking::query()
                    ->whereNotIn('payment_status', $paidStatuses)
                    ->whereIn('booking_status', $activeStatuses)
                    ->whereNotNull('expired_at')
                    ->whereBetween('expired_at', [$now, now()->addDays(3)])
                    ->count();
            } catch (Throwable) {
                // Keep partial summary.
            }
        }

        return $summary;
    }

    private function miceSummary(): array
    {
        $totalRecords = $this->safeCount(fn () => Schema::hasTable('mice_records') ? MiceRecord::query()->count() : 0);
        $participants = 0;
        $foreignAttendees = 0;
        $domesticAttendees = 0;
        $eventsWithExhibitions = 0;

        if (Schema::hasTable('mice_records')) {
            try {
                foreach (['total_participants', 'visitors_count'] as $column) {
                    if (Schema::hasColumn('mice_records', $column)) {
                        $participants += (int) MiceRecord::query()->sum($column);
                    }
                }

                if (Schema::hasColumn('mice_records', 'foreign_attendees')) {
                    $foreignAttendees = (int) MiceRecord::query()->sum('foreign_attendees');
                }

                if (Schema::hasColumn('mice_records', 'domestic_attendees')) {
                    $domesticAttendees = (int) MiceRecord::query()->sum('domestic_attendees');
                }

                if (Schema::hasColumn('mice_records', 'has_exhibitions')) {
                    $eventsWithExhibitions = (int) MiceRecord::query()->where('has_exhibitions', true)->count();
                }
            } catch (Throwable) {
                // Keep whatever summary was available.
            }
        }

        return [
            ['label' => 'Registry Records', 'value' => $totalRecords, 'tone' => 'neutral'],
            ['label' => 'Total Attendees / Visitors', 'value' => $participants, 'tone' => 'info'],
            ['label' => 'Domestic Attendees', 'value' => $domesticAttendees, 'tone' => 'good'],
            ['label' => 'Foreign Attendees', 'value' => $foreignAttendees, 'tone' => 'warn'],
            ['label' => 'With Exhibitions', 'value' => $eventsWithExhibitions, 'tone' => 'neutral'],
        ];
    }

    private function websiteSummary(array $workspaceStats): array
    {
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();
        $visitsToday = 0;
        $visitsMonth = 0;
        $uniqueMonth = 0;

        if (Schema::hasTable('site_page_views')) {
            try {
                $dateColumn = Schema::hasColumn('site_page_views', 'viewed_at') ? 'viewed_at' : 'created_at';
                $visitorColumn = Schema::hasColumn('site_page_views', 'visitor_hash') ? 'visitor_hash' : null;

                $visitsToday = (int) SitePageView::query()
                    ->whereDate($dateColumn, $today)
                    ->count();

                $visitsMonth = (int) SitePageView::query()
                    ->whereDate($dateColumn, '>=', $monthStart)
                    ->count();

                if ($visitorColumn) {
                    $uniqueMonth = (int) SitePageView::query()
                        ->whereDate($dateColumn, '>=', $monthStart)
                        ->whereNotNull($visitorColumn)
                        ->distinct($visitorColumn)
                        ->count($visitorColumn);
                }
            } catch (Throwable) {
                // Keep default zeros.
            }
        }

        $openInquiries = $this->openInquiryCount();
        $monthBookings = max(0, (int) ($workspaceStats['month_bookings'] ?? 0));
        $conversion = $visitsMonth > 0
            ? round(($monthBookings / $visitsMonth) * 100, 1) . '% booking-to-visit signal this month.'
            : 'Website conversion signal appears after public visit tracking records are available.';

        return [
            'visits_today' => $visitsToday,
            'visits_month' => $visitsMonth,
            'unique_visitors_month' => $uniqueMonth,
            'inquiries_open' => $openInquiries,
            'conversion_hint' => $conversion,
        ];
    }

    private function usersSummary(): array
    {
        if (! Schema::hasTable('users')) {
            return [
                'total' => 0,
                'verified' => 0,
                'unverified' => 0,
                'new_today' => 0,
                'operator_accounts' => 0,
                'client_accounts' => 0,
            ];
        }

        try {
            $operatorCount = 0;
            $clientCount = 0;

            if (Schema::hasTable('model_has_roles') && Schema::hasTable('roles')) {
                $operatorCount = (int) User::query()
                    ->whereHas('roles', fn ($query) => $query->whereIn('name', ['admin', 'manager', 'staff']))
                    ->count();

                $clientCount = (int) User::query()
                    ->whereDoesntHave('roles', fn ($query) => $query->whereIn('name', ['admin', 'manager', 'staff']))
                    ->count();
            }

            return [
                'total' => (int) User::query()->count(),
                'verified' => (int) User::query()->whereNotNull('email_verified_at')->count(),
                'unverified' => (int) User::query()->whereNull('email_verified_at')->count(),
                'new_today' => Schema::hasColumn('users', 'created_at')
                    ? (int) User::query()->whereDate('created_at', Carbon::today())->count()
                    : 0,
                'operator_accounts' => $operatorCount,
                'client_accounts' => $clientCount,
            ];
        } catch (Throwable) {
            return [
                'total' => 0,
                'verified' => 0,
                'unverified' => 0,
                'new_today' => 0,
                'operator_accounts' => 0,
                'client_accounts' => 0,
            ];
        }
    }

    private function recentUsers(): array
    {
        if (! Schema::hasTable('users')) {
            return [];
        }

        try {
            return User::query()
                ->with('roles')
                ->withCount([
                    'bookingsCreated as bookings_count',
                    'bookingsCreated as pending_bookings_count' => fn ($query) => $query->whereIn('booking_status', ['pending', 'pencil_booked', 'for_review', 'submitted', 'awaiting_downpayment', 'awaiting_balance']),
                ])
                ->orderByDesc(Schema::hasColumn('users', 'created_at') ? 'created_at' : 'id')
                ->limit(5)
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->display_name ?: $user->name,
                    'email' => $user->email,
                    'role' => $user->roles->pluck('name')->first() ?: 'client',
                    'email_verified' => (bool) $user->email_verified_at,
                    'bookings_count' => (int) ($user->bookings_count ?? 0),
                    'pending_bookings_count' => (int) ($user->pending_bookings_count ?? 0),
                    'created_at' => $this->formatDateTime($user->created_at),
                ])
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    private function systemHealth(array $workspaceStats, array $paymentSummary, array $websiteSummary): array
    {
        return [
            [
                'label' => 'Calendar Blocks',
                'value' => (int) ($workspaceStats['month_blocks'] ?? 0),
                'helper' => 'Blocks recorded for this month. Partial-day blocks should now remain visible as AM/PM-specific availability.',
                'state' => 'neutral',
            ],
            [
                'label' => 'Venue Setup',
                'value' => $this->safeCount(fn () => Schema::hasTable('service_types') ? ServiceType::query()->count() : 0) . ' areas',
                'helper' => $this->safeCount(fn () => Schema::hasTable('services') ? Service::query()->count() : 0) . ' rental options configured.',
                'state' => 'good',
            ],
            [
                'label' => 'User Accounts',
                'value' => $this->safeCount(fn () => Schema::hasTable('users') ? User::query()->count() : 0),
                'helper' => 'Admin can monitor role and account activity through notifications.',
                'state' => 'good',
            ],
            [
                'label' => 'Deadline Risk',
                'value' => (int) ($paymentSummary['overdue_bookings'] ?? 0),
                'helper' => 'Unpaid reservations past payment deadline.',
                'state' => ((int) ($paymentSummary['overdue_bookings'] ?? 0)) > 0 ? 'danger' : 'good',
            ],
            [
                'label' => 'Visit Tracking',
                'value' => (int) ($websiteSummary['visits_month'] ?? 0),
                'helper' => 'Public website visits captured this month.',
                'state' => ((int) ($websiteSummary['visits_month'] ?? 0)) > 0 ? 'good' : 'warn',
            ],
        ];
    }

    private function recentActivity(): array
    {
        if (! Schema::hasTable('user_notifications')) {
            return [];
        }

        try {
            return UserNotification::query()
                ->with('actor:id,name,email')
                ->orderByDesc(Schema::hasColumn('user_notifications', 'created_at') ? 'created_at' : 'id')
                ->limit(12)
                ->get()
                ->map(fn (UserNotification $notification) => [
                    'id' => $notification->id,
                    'title' => (string) ($notification->title ?? 'System activity'),
                    'message' => (string) ($notification->message ?? ''),
                    'type' => (string) ($notification->type ?? $notification->action_key ?? 'activity'),
                    'severity' => (string) ($notification->severity ?? 'info'),
                    'actor' => (string) (optional($notification->actor)->name ?? optional($notification->actor)->email ?? ''),
                    'created_at' => $notification->created_at instanceof \DateTimeInterface ? $notification->created_at->format(DATE_ATOM) : (string) ($notification->created_at ?? ''),
                    'link' => (string) ($notification->link ?? ''),
                ])
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    private function paymentReviewCount(): int
    {
        if (! Schema::hasTable('booking_payments') || ! Schema::hasColumn('booking_payments', 'status')) {
            return 0;
        }

        return $this->safeCount(fn () => BookingPayment::query()
            ->whereIn('status', ['submitted', 'for_review', 'pending'])
            ->count());
    }

    private function openInquiryCount(): int
    {
        $table = Schema::hasTable('public_inquiries') ? 'public_inquiries' : (Schema::hasTable('inquiries') ? 'inquiries' : null);

        if ($table === null) {
            return 0;
        }

        try {
            $model = $table === 'public_inquiries' ? PublicInquiry::query() : DB::table('inquiries');

            if (Schema::hasColumn($table, 'status')) {
                return (int) $model->whereIn('status', ['new', 'open', 'unread', 'pending'])->count();
            }

            if (Schema::hasColumn($table, 'read_at')) {
                return (int) $model->whereNull('read_at')->count();
            }

            return (int) $model->count();
        } catch (Throwable) {
            return 0;
        }
    }

    private function cleanPackageLabel(string $value): string
    {
        return trim(str_replace('  ', ' ', ucwords(strtolower(str_replace(['_', '-'], ' ', $value))))) ?: 'Not Set';
    }

    private function formatDateTime(mixed $value): string
    {
        if ($value instanceof Carbon) {
            return $value->format('M d, Y h:i A');
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->format('M d, Y h:i A');
        }

        if ($value === null || $value === '') {
            return '';
        }

        try {
            return Carbon::parse($value)->format('M d, Y h:i A');
        } catch (Throwable) {
            return (string) $value;
        }
    }

    private function formatTimeRange(mixed $from, mixed $to): string
    {
        $start = $this->formatTime($from);
        $end = $this->formatTime($to);

        if ($start === '' && $end === '') {
            return 'No time set';
        }

        return trim($start . ' - ' . $end, ' -');
    }

    private function formatTime(mixed $value): string
    {
        if ($value instanceof Carbon) {
            return $value->format('h:i A');
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->format('h:i A');
        }

        if ($value === null || $value === '') {
            return '';
        }

        try {
            return Carbon::parse($value)->format('h:i A');
        } catch (Throwable) {
            return '';
        }
    }

    private function safeCount(callable $callback): int
    {
        try {
            return (int) $callback();
        } catch (Throwable) {
            return 0;
        }
    }
}
