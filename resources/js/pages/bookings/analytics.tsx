import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    AlertTriangle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    CircleDollarSign,
    Download,
    FileText,
    Gauge,
    PieChart,
    Search,
    ShieldAlert,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { type CSSProperties, useMemo, useState } from 'react';

type Option = {
    id: number;
    name: string;
};

type Breakdown = {
    label: string;
    value: number;
};

type TrendPoint = {
    key?: string;
    label: string;
    bookings: number;
    guests: number;
    confirmed_revenue: number;
    total_revenue?: number;
    unpaid_balance?: number;
};

type ServicePoint = {
    label: string;
    usage_count: number;
    revenue_total: number;
};

type WorkloadPoint = {
    label: string;
    bookings: number;
    guests: number;
};

type RiskBooking = {
    id: number;
    client_name: string;
    company_name: string;
    type_of_event: string;
    booking_status: string;
    payment_status: string;
    booking_date_from: string | null;
    booking_date_to: string | null;
    created_at: string | null;
    number_of_guests: number;
    items_total: number;
    submitted_total: number;
    confirmed_total: number;
    outstanding: number;
    policy?: {
        state?: string;
        label?: string;
        half_required?: number;
        half_paid_met?: boolean;
        fully_paid_met?: boolean;
        down_payment_due_at?: string | null;
        full_payment_due_at?: string | null;
        hours_since_created?: number | null;
    };
};

type Props = {
    filters: {
        q?: string;
        booking_status?: string;
        payment_status?: string;
        service_id?: string;
        date_from?: string;
        date_to?: string;
    };
    services: Option[];
    summary: {
        total_bookings: number;
        total_guests: number;
        pending: number;
        active: number;
        confirmed: number;
        completed: number;
        cancelled_declined: number;
        submitted_revenue: number;
        confirmed_revenue: number;
        net_booking_total?: number;
        total_revenue?: number;
        outstanding_balance: number;
        total_unpaid_balance?: number;
        due_24h_soon: number;
        due_24h_overdue: number;
        due_48h_soon: number;
        due_48h_overdue: number;
        half_paid_met: number;
        fully_paid_met: number;
        automation_events_7d: number;
        auto_declined_7d: number;
        auto_deleted_7d: number;
    };
    statusBreakdown: Breakdown[];
    paymentBreakdown: Breakdown[];
    monthlyTrend: TrendPoint[];
    upcomingWorkload: WorkloadPoint[];
    topServices: ServicePoint[];
    highRiskBookings: RiskBooking[];
};

function currentBookingsBase() {
    if (window.location.pathname.startsWith('/admin')) return '/admin/bookings';
    if (window.location.pathname.startsWith('/manager'))
        return '/manager/bookings';

    return '/bookings';
}

function breadcrumbs(): BreadcrumbItem[] {
    return [
        { title: 'Bookings', href: currentBookingsBase() },
        { title: 'Analytics', href: `${currentBookingsBase()}/analytics` },
    ];
}

function money(value: unknown) {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

function numberValue(value: unknown) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function cleanLabel(value: unknown) {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value?: string | null) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function queryString(filters: Props['filters']) {
    const params = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ''
        ) {
            params.set(key, String(value));
        }
    });

    return params.toString();
}

function maxValue<T>(items: T[], getter: (item: T) => number) {
    return Math.max(1, ...items.map((item) => getter(item)));
}

function sumValue<T>(items: T[], getter: (item: T) => number) {
    return items.reduce((sum, item) => sum + getter(item), 0);
}

function trendRevenue(item?: TrendPoint | null) {
    return numberValue(item?.total_revenue ?? item?.confirmed_revenue);
}

function trendUnpaid(item?: TrendPoint | null) {
    return numberValue(item?.unpaid_balance);
}

function percentChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;

    return ((current - previous) / Math.abs(previous)) * 100;
}

function compactNumber(value: number) {
    return new Intl.NumberFormat('en-PH', {
        notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
        maximumFractionDigits: Math.abs(value) >= 10000 ? 1 : 0,
    }).format(value);
}

type LinePoint = {
    label: string;
    value: number;
    detail?: string;
};

type LineSeries = {
    key: string;
    label: string;
    color: string;
    points: LinePoint[];
};

function AnalyticsLinePanel({
    eyebrow,
    title,
    description,
    series,
    active,
    onActiveChange,
    icon: Icon,
}: {
    eyebrow: string;
    title: string;
    description: string;
    series: LineSeries[];
    active?: Record<string, boolean>;
    onActiveChange?: (
        updater: (current: Record<string, boolean>) => Record<string, boolean>,
    ) => void;
    icon: LucideIcon;
}) {
    const visibleSeries = series.filter((item) => active?.[item.key] ?? true);
    const pointCount = Math.max(
        1,
        ...visibleSeries.map((item) => item.points.length),
    );
    const allValues = visibleSeries.flatMap((item) =>
        item.points.map((point) => point.value),
    );
    const max = Math.max(1, ...allValues);
    const width = 720;
    const height = 260;
    const paddingX = 44;
    const paddingY = 34;
    const xFor = (index: number, count: number) =>
        count <= 1
            ? width / 2
            : paddingX +
              (index * (width - paddingX * 2)) / Math.max(count - 1, 1);
    const yFor = (value: number) =>
        height -
        paddingY -
        (value / max) * Math.max(height - paddingY * 2, 1);

    function toggleSeries(key: string) {
        if (!onActiveChange || !active) return;

        onActiveChange((current) => {
            const enabledCount = Object.values(current).filter(Boolean).length;

            if (current[key] && enabledCount <= 1) {
                return current;
            }

            return {
                ...current,
                [key]: !current[key],
            };
        });
    }

    return (
        <article className="analytics-line-panel">
            <div className="analytics-panel-header">
                <div>
                    <p className="backend-booking-label">{eyebrow}</p>
                    <h2>{title}</h2>
                    <span>{description}</span>
                </div>
                <Icon className="h-5 w-5 text-slate-400" />
            </div>

            <div className="analytics-line-legend">
                {series.map((item) => {
                    const selected = active?.[item.key] ?? true;

                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleSeries(item.key)}
                            className={selected ? 'is-active' : ''}
                            style={{ '--line-color': item.color } as CSSProperties}
                        >
                            <span />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {visibleSeries.length > 0 && visibleSeries.some((item) => item.points.length > 0) ? (
                <div className="analytics-line-chart-wrap">
                    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                            const y = paddingY + ratio * (height - paddingY * 2);
                            return (
                                <line
                                    key={ratio}
                                    x1={paddingX}
                                    x2={width - paddingX}
                                    y1={y}
                                    y2={y}
                                    className="analytics-line-grid-rule"
                                />
                            );
                        })}

                        {visibleSeries.map((item) => {
                            const count = Math.max(item.points.length, pointCount);
                            const points = item.points.map((point, index) => ({
                                ...point,
                                x: xFor(index, count),
                                y: yFor(point.value),
                            }));
                            const path = points.map((point) => `${point.x},${point.y}`).join(' ');

                            return (
                                <g key={item.key} className="analytics-line-series">
                                    <polyline points={path} fill="none" stroke={item.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                    {points.map((point, index) => (
                                        <g key={`${item.key}-${point.label}-${index}`} className="analytics-line-point">
                                            <circle cx={point.x} cy={point.y} r="5.5" fill={item.color}>
                                                <title>
                                                    {item.label}: {point.detail ?? compactNumber(point.value)}
                                                </title>
                                            </circle>
                                            <text x={point.x} y={Math.max(16, point.y - 12)} textAnchor="middle">
                                                {point.detail ?? compactNumber(point.value)}
                                            </text>
                                        </g>
                                    ))}
                                </g>
                            );
                        })}

                        {visibleSeries[0]?.points.map((point, index) => {
                            const count = Math.max(visibleSeries[0].points.length, pointCount);
                            return (
                                <text key={`${point.label}-${index}`} x={xFor(index, count)} y={height - 8} textAnchor="middle" className="analytics-line-axis-label">
                                    {point.label.replace(/\s+\d{4}$/u, '')}
                                </text>
                            );
                        })}
                    </svg>
                </div>
            ) : (
                <EmptyState
                    icon={Icon}
                    title="No chart data yet"
                    description="The line graph will populate as matching records are created."
                />
            )}
        </article>
    );
}

function MonthlyMetricCard({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    helper: string;
    icon: LucideIcon;
}) {
    return (
        <article className="analytics-monthly-card">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="backend-booking-label">{label}</p>
                    <strong>{value}</strong>
                </div>
                <Icon className="h-5 w-5 text-[#9d7b3d] dark:text-[#f1d89b]" />
            </div>
            <p>{helper}</p>
        </article>
    );
}

function MovementMetricCard({
    percent,
    deltaRevenue,
}: {
    percent: number;
    deltaRevenue: number;
}) {
    const improved = percent >= 0;
    const Icon = improved ? ArrowUpRight : ArrowDownRight;

    return (
        <article className={`analytics-monthly-card analytics-movement-card ${improved ? 'is-up' : 'is-down'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="backend-booking-label">Monthly Rate</p>
                    <strong>{Math.abs(percent).toFixed(1)}%</strong>
                </div>
                <Icon className="h-5 w-5" />
            </div>
            <div className="analytics-movement-split">
                <span>{improved ? 'Increase' : 'Decrease'}</span>
                <strong>{deltaRevenue >= 0 ? '+' : '-'}{money(Math.abs(deltaRevenue))}</strong>
            </div>
        </article>
    );
}

function policyTone(state?: string) {
    const value = String(state || '').toLowerCase();

    if (value.includes('overdue')) return 'is-bad';
    if (value.includes('soon')) return 'is-warn';
    if (value.includes('watch')) return 'is-public';

    return 'is-good';
}

function StatCard({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    helper: string;
    icon: LucideIcon;
}) {
    return (
        <article className="analytics-kpi-card">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="backend-booking-label">{label}</p>
                    <p className="analytics-kpi-value mt-3 text-3xl font-black tracking-[-0.055em] text-slate-950 dark:text-white">
                        {value}
                    </p>
                </div>

                <div className="alh-admin-kpi-icon">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {helper}
            </p>
        </article>
    );
}

function MiniBar({
    label,
    value,
    max,
    suffix,
}: {
    label: string;
    value: number;
    max: number;
    suffix?: string;
}) {
    const width = Math.max(4, Math.min(100, (value / Math.max(max, 1)) * 100));

    return (
        <div className="analytics-mini-bar">
            <div className="flex items-center justify-between gap-3">
                <span>{label}</span>
                <strong>
                    {value}
                    {suffix || ''}
                </strong>
            </div>

            <div className="analytics-mini-bar-track">
                <div style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}

function RevenueBar({
    label,
    bookings,
    guests,
    revenue,
    maxBookings,
    maxRevenue,
}: {
    label: string;
    bookings: number;
    guests: number;
    revenue: number;
    maxBookings: number;
    maxRevenue: number;
}) {
    const bookingWidth = Math.max(
        4,
        Math.min(100, (bookings / Math.max(maxBookings, 1)) * 100),
    );
    const revenueWidth = Math.max(
        4,
        Math.min(100, (revenue / Math.max(maxRevenue, 1)) * 100),
    );

    return (
        <article className="analytics-trend-row">
            <div>
                <p>{label}</p>
                <span>
                    {bookings} booking{bookings === 1 ? '' : 's'} · {guests}{' '}
                    guest
                    {guests === 1 ? '' : 's'}
                </span>
            </div>

            <div className="analytics-trend-bars">
                <div>
                    <span style={{ width: `${bookingWidth}%` }} />
                </div>
                <div>
                    <span style={{ width: `${revenueWidth}%` }} />
                </div>
            </div>

            <strong>{money(revenue)}</strong>
        </article>
    );
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="analytics-empty-state">
            <Icon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}

export default function BookingAnalytics({
    filters,
    services = [],
    summary,
    statusBreakdown = [],
    paymentBreakdown = [],
    monthlyTrend = [],
    upcomingWorkload = [],
    topServices = [],
    highRiskBookings = [],
}: Props) {
    const basePath = currentBookingsBase();
    const analyticsPath = `${basePath}/analytics`;
    const query = queryString(filters);
    const exportHref = query
        ? `${analyticsPath}/export?${query}`
        : `${analyticsPath}/export`;
    const printHref = query
        ? `${analyticsPath}/print?${query}`
        : `${analyticsPath}/print`;

    const [movementLines, setMovementLines] = useState<Record<string, boolean>>({
        bookings: true,
        guests: true,
    });
    const [financeLines, setFinanceLines] = useState<Record<string, boolean>>({
        revenue: true,
        unpaid: true,
    });
    const totalRevenue = numberValue(
        summary.total_revenue ??
            summary.net_booking_total ??
            summary.confirmed_revenue,
    );
    const totalUnpaidBalance = numberValue(
        summary.total_unpaid_balance ?? summary.outstanding_balance,
    );
    const trendMonthCount = Math.max(monthlyTrend.length, 1);
    const yearlyBookings = sumValue(monthlyTrend, (item) =>
        numberValue(item.bookings),
    );
    const yearlyGuests = sumValue(monthlyTrend, (item) =>
        numberValue(item.guests),
    );
    const yearlyRevenue = sumValue(monthlyTrend, trendRevenue);
    const latestMonth = monthlyTrend.at(-1) ?? null;
    const previousMonth = monthlyTrend.at(-2) ?? null;
    const latestRevenue = trendRevenue(latestMonth);
    const previousRevenue = trendRevenue(previousMonth);
    const revenueDelta = latestRevenue - previousRevenue;
    const revenueRate = percentChange(latestRevenue, previousRevenue);
    const movementSeries = useMemo<LineSeries[]>(
        () => [
            {
                key: 'bookings',
                label: 'Bookings',
                color: '#176456',
                points: monthlyTrend.map((item) => ({
                    label: item.label,
                    value: numberValue(item.bookings),
                    detail: `${numberValue(item.bookings)} bookings`,
                })),
            },
            {
                key: 'guests',
                label: 'Guests',
                color: '#d6a43f',
                points: monthlyTrend.map((item) => ({
                    label: item.label,
                    value: numberValue(item.guests),
                    detail: `${numberValue(item.guests)} guests`,
                })),
            },
        ],
        [monthlyTrend],
    );
    const financeSeries = useMemo<LineSeries[]>(
        () => [
            {
                key: 'revenue',
                label: 'Total Revenue',
                color: '#176456',
                points: monthlyTrend.map((item) => ({
                    label: item.label,
                    value: trendRevenue(item),
                    detail: money(trendRevenue(item)),
                })),
            },
            {
                key: 'unpaid',
                label: 'Unpaid Balance',
                color: '#b45309',
                points: monthlyTrend.map((item) => ({
                    label: item.label,
                    value: trendUnpaid(item),
                    detail: money(trendUnpaid(item)),
                })),
            },
        ],
        [monthlyTrend],
    );
    const statusSeries = useMemo<LineSeries[]>(
        () => [
            {
                key: 'status',
                label: 'Booking Status',
                color: '#176456',
                points: statusBreakdown.map((item) => ({
                    label: cleanLabel(item.label),
                    value: numberValue(item.value),
                    detail: `${numberValue(item.value)} ${cleanLabel(item.label)}`,
                })),
            },
        ],
        [statusBreakdown],
    );
    const paymentSeries = useMemo<LineSeries[]>(
        () => [
            {
                key: 'payment',
                label: 'Payment Status',
                color: '#d6a43f',
                points: paymentBreakdown.map((item) => ({
                    label: cleanLabel(item.label),
                    value: numberValue(item.value),
                    detail: `${numberValue(item.value)} ${cleanLabel(item.label)}`,
                })),
            },
        ],
        [paymentBreakdown],
    );
    const workloadSeries = useMemo<LineSeries[]>(
        () => [
            {
                key: 'workload',
                label: 'Bookings',
                color: '#176456',
                points: upcomingWorkload.map((item) => ({
                    label: item.label,
                    value: numberValue(item.bookings),
                    detail: `${numberValue(item.bookings)} bookings, ${numberValue(item.guests)} guests`,
                })),
            },
        ],
        [upcomingWorkload],
    );
    const maxServiceUsage = maxValue(topServices, (item) =>
        numberValue(item.usage_count),
    );
    const maxAutomation = Math.max(
        1,
        numberValue(summary.automation_events_7d),
        numberValue(summary.auto_declined_7d),
        numberValue(summary.auto_deleted_7d),
        numberValue(summary.due_24h_soon) + numberValue(summary.due_24h_overdue),
        numberValue(summary.due_48h_soon) + numberValue(summary.due_48h_overdue),
    );

    function applyFilters(formData: FormData) {
        router.get(
            analyticsPath,
            {
                q: String(formData.get('q') || '') || undefined,
                booking_status:
                    String(formData.get('booking_status') || '') || undefined,
                payment_status:
                    String(formData.get('payment_status') || '') || undefined,
                service_id:
                    String(formData.get('service_id') || '') || undefined,
                date_from: String(formData.get('date_from') || '') || undefined,
                date_to: String(formData.get('date_to') || '') || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="Booking Analytics" />

            <div className="backend-admin-page space-y-5">
                <section className="analytics-hero">
                    <div>
                        <p className="backend-booking-label">
                            Booking Analytics
                        </p>
                        <h1>
                            Booking performance, payments, workload, and
                            deadline risk.
                        </h1>
                        <span>
                            A compact monitoring page for reservation trends,
                            payment compliance, high-risk records, and
                            operational demand.
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href={basePath} className="alh-secondary-button">
                            Back to Bookings
                        </Link>

                        <a href={exportHref} className="alh-secondary-button">
                            <Download className="h-4 w-4" />
                            Export Excel
                        </a>

                        <a
                            href={printHref}
                            target="_blank"
                            rel="noreferrer"
                            className="alh-primary-button"
                        >
                            <FileText className="h-4 w-4" />
                            Print Report
                        </a>
                    </div>
                </section>

                <section className="analytics-filter-panel">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            applyFilters(new FormData(event.currentTarget));
                        }}
                        className="analytics-filter-grid"
                    >
                        <div className="relative lg:col-span-2">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                name="q"
                                defaultValue={filters.q || ''}
                                placeholder="Search client, company, email, event..."
                                className="backend-booking-input pl-10"
                            />
                        </div>

                        <select
                            name="booking_status"
                            defaultValue={filters.booking_status || ''}
                            className="backend-booking-input"
                        >
                            <option value="">All booking statuses</option>
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="declined">Declined</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            name="payment_status"
                            defaultValue={filters.payment_status || ''}
                            className="backend-booking-input"
                        >
                            <option value="">All payment statuses</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                            <option value="owing">Owing</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                        </select>

                        <select
                            name="service_id"
                            defaultValue={filters.service_id || ''}
                            className="backend-booking-input"
                        >
                            <option value="">All venue/rental options</option>
                            {services.map((service) => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                        </select>

                        <input
                            name="date_from"
                            type="date"
                            defaultValue={filters.date_from || ''}
                            className="backend-booking-input"
                            aria-label="Date from"
                        />

                        <input
                            name="date_to"
                            type="date"
                            defaultValue={filters.date_to || ''}
                            className="backend-booking-input"
                            aria-label="Date to"
                        />

                        <button
                            type="submit"
                            className="alh-primary-button justify-center"
                        >
                            Apply Filters
                        </button>

                        <Link
                            href={analyticsPath}
                            className="alh-secondary-button justify-center"
                        >
                            Reset
                        </Link>
                    </form>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Filtered Bookings"
                        value={summary.total_bookings}
                        helper="All matching booking records after the active filters."
                        icon={Gauge}
                    />

                    <StatCard
                        label="Guests"
                        value={summary.total_guests}
                        helper="Total estimated attendees across the filtered bookings."
                        icon={Users}
                    />

                    <StatCard
                        label="Total Revenue"
                        value={money(totalRevenue)}
                        helper={`Booking payable total after discounts: ${money(totalRevenue)}.`}
                        icon={CircleDollarSign}
                    />

                    <StatCard
                        label="Total Unpaid Balance"
                        value={money(totalUnpaidBalance)}
                        helper="Remaining unpaid amount from all matching bookings."
                        icon={Wallet}
                    />
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MonthlyMetricCard
                        label="Average Monthly Bookings"
                        value={(yearlyBookings / trendMonthCount).toFixed(1)}
                        helper={`${yearlyBookings} bookings across the last ${trendMonthCount} month${trendMonthCount === 1 ? '' : 's'}.`}
                        icon={CalendarDays}
                    />

                    <MonthlyMetricCard
                        label="Average Monthly Guests"
                        value={(yearlyGuests / trendMonthCount).toFixed(1)}
                        helper={`${yearlyGuests} guests across the yearly movement chart.`}
                        icon={Users}
                    />

                    <MonthlyMetricCard
                        label="Monthly Revenue"
                        value={money(latestRevenue)}
                        helper={`${latestMonth?.label ?? 'Latest month'} revenue. Year total: ${money(yearlyRevenue)}.`}
                        icon={CircleDollarSign}
                    />

                    <MovementMetricCard
                        percent={revenueRate}
                        deltaRevenue={revenueDelta}
                    />
                </section>

                <section className="analytics-line-grid">
                    <AnalyticsLinePanel
                        eyebrow="Yearly Analytics Movement"
                        title="Monthly booking & guest movement"
                        description="Toggle each indicator to isolate the yearly movement line."
                        series={movementSeries}
                        active={movementLines}
                        onActiveChange={setMovementLines}
                        icon={TrendingUp}
                    />

                    <AnalyticsLinePanel
                        eyebrow="Monthly Revenue"
                        title="Total revenue & unpaid balance movement"
                        description="Revenue uses booking payable totals, while unpaid tracks remaining balances."
                        series={financeSeries}
                        active={financeLines}
                        onActiveChange={setFinanceLines}
                        icon={CircleDollarSign}
                    />

                    <AnalyticsLinePanel
                        eyebrow="Booking Status"
                        title="Booking status profile"
                        description="A single visual style for the status spread of the current filtered set."
                        series={statusSeries}
                        icon={PieChart}
                    />

                    <AnalyticsLinePanel
                        eyebrow="Payment Status"
                        title="Payment status profile"
                        description="Payment status distribution uses the same hoverable line format."
                        series={paymentSeries}
                        icon={Wallet}
                    />

                    <AnalyticsLinePanel
                        eyebrow="Next 30 Days"
                        title="Upcoming workload movement"
                        description="Daily booking load and guests for short-range scheduling."
                        series={workloadSeries}
                        icon={CalendarDays}
                    />
                </section>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <main className="analytics-panel overflow-hidden">
                        <div className="analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Service Demand
                                </p>
                                <h2>Top venue/rental options</h2>
                            </div>
                            <BarChart3 className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {topServices.length > 0 ? (
                                topServices.map((item) => (
                                    <article
                                        key={item.label}
                                        className="analytics-service-row"
                                    >
                                        <div>
                                            <h3>{item.label}</h3>
                                            <p>
                                                {item.usage_count} usage
                                                {item.usage_count === 1
                                                    ? ''
                                                    : 's'}{' '}
                                                · {money(item.revenue_total)}
                                            </p>
                                        </div>

                                        <div className="analytics-mini-bar-track">
                                            <div
                                                style={{
                                                    width: `${Math.max(
                                                        4,
                                                        Math.min(
                                                            100,
                                                            (numberValue(
                                                                item.usage_count,
                                                            ) /
                                                                maxServiceUsage) *
                                                                100,
                                                        ),
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <EmptyState
                                    icon={BarChart3}
                                    title="No service demand data"
                                    description="Top venue and rental option usage will appear here."
                                />
                            )}
                        </div>
                    </main>

                    <aside className="analytics-panel overflow-hidden">
                        <div className="analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Safeguards
                                </p>
                                <h2>Automation and deadline watch</h2>
                            </div>
                            <Activity className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="grid gap-3 p-5">
                            <MiniBar
                                label="Automation events"
                                value={numberValue(summary.automation_events_7d)}
                                max={maxAutomation}
                            />
                            <MiniBar
                                label="Auto-declined"
                                value={numberValue(summary.auto_declined_7d)}
                                max={maxAutomation}
                            />
                            <MiniBar
                                label="Auto-deleted"
                                value={numberValue(summary.auto_deleted_7d)}
                                max={maxAutomation}
                            />
                            <MiniBar
                                label="24h deadline watch"
                                value={
                                    numberValue(summary.due_24h_soon) +
                                    numberValue(summary.due_24h_overdue)
                                }
                                max={maxAutomation}
                            />
                            <MiniBar
                                label="48h deadline watch"
                                value={
                                    numberValue(summary.due_48h_soon) +
                                    numberValue(summary.due_48h_overdue)
                                }
                                max={maxAutomation}
                            />
                        </div>
                    </aside>
                </section>

                <section className="analytics-panel overflow-hidden">
                    <div className="analytics-panel-header">
                        <div>
                            <p className="backend-booking-label">Risk Queue</p>
                            <h2>High-risk booking records</h2>
                            <span>
                                These are the bookings most likely to need
                                payment follow-up or lifecycle review.
                            </span>
                        </div>
                        <ShieldAlert className="h-5 w-5 text-slate-400" />
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {highRiskBookings.length > 0 ? (
                            highRiskBookings.map((booking) => (
                                <article
                                    key={booking.id}
                                    className="analytics-risk-row"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap gap-2">
                                            <span
                                                className={`alh-status-chip ${policyTone(booking.policy?.state)}`}
                                            >
                                                {booking.policy?.label ||
                                                    cleanLabel(
                                                        booking.policy?.state ||
                                                            'Watch',
                                                    )}
                                            </span>
                                            <span className="booking-mini-pill">
                                                {cleanLabel(
                                                    booking.booking_status,
                                                )}
                                            </span>
                                            <span className="booking-mini-pill">
                                                {cleanLabel(
                                                    booking.payment_status,
                                                )}
                                            </span>
                                        </div>

                                        <h3>
                                            {booking.type_of_event ||
                                                `Booking #${booking.id}`}
                                        </h3>
                                        <p>
                                            {booking.company_name ||
                                                booking.client_name ||
                                                'Client'}{' '}
                                            ·{' '}
                                            {formatDateTime(
                                                booking.booking_date_from,
                                            )}
                                        </p>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-4">
                                            <div className="alh-admin-mini-box">
                                                <span>Total</span>
                                                <strong>
                                                    {money(booking.items_total)}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Submitted</span>
                                                <strong>
                                                    {money(
                                                        booking.submitted_total,
                                                    )}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Confirmed</span>
                                                <strong>
                                                    {money(
                                                        booking.confirmed_total,
                                                    )}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Unpaid Balance</span>
                                                <strong>
                                                    {money(booking.outstanding)}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={`${basePath}/${booking.id}`}
                                        className="alh-primary-button"
                                    >
                                        Open
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </article>
                            ))
                        ) : (
                            <EmptyState
                                icon={AlertTriangle}
                                title="No high-risk bookings"
                                description="Bookings with payment deadline risk will appear here."
                            />
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
