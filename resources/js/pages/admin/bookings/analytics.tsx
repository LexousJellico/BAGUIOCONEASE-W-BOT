import {
    ResourceActionLink,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    FileBarChart,
    Users,
    Wallet,
} from 'lucide-react';
import { type CSSProperties, type Dispatch, type SetStateAction, useMemo, useState } from 'react';

type AnalyticsSummary = Record<string, number | string | undefined>;

type BreakdownItem = {
    label?: string;
    booking_status?: string;
    status?: string;
    total?: number;
    count?: number;
    value?: number;
};

type MonthlyTrendItem = {
    key?: string;
    month?: string;
    label?: string;
    total?: number;
    count?: number;
    value?: number;
    bookings?: number;
    guests?: number;
    confirmed_revenue?: number | string;
    total_revenue?: number | string;
    unpaid_balance?: number | string;
};

type WorkloadItem = {
    label?: string;
    date?: string;
    bookings?: number;
    guests?: number;
};

type PageProps = {
    summary?: AnalyticsSummary;
    statusCounts?: BreakdownItem[];
    statusBreakdown?: BreakdownItem[];
    paymentBreakdown?: BreakdownItem[];
    monthly?: MonthlyTrendItem[];
    monthlyTrend?: MonthlyTrendItem[];
    upcomingWorkload?: WorkloadItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Booking Analytics', href: '/admin/bookings/analytics' },
];

function num(value?: number | string) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function money(value?: number | string) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(num(value));
}

function cleanLabel(value?: string) {
    return String(value || 'Unknown')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function EmptyChart({ message }: { message: string }) {
    return (
        <p className="rounded-[1.25rem] border border-dashed border-[#d9c7a6]/80 bg-[#fffaf0]/58 p-6 text-center text-sm font-semibold text-[#21180d] dark:border-white/10 dark:bg-white/[0.035] dark:text-white">
            {message}
        </p>
    );
}

type AdminLinePoint = {
    label: string;
    value: number;
    detail?: string;
};

type AdminLineSeries = {
    key: string;
    label: string;
    color: string;
    points: AdminLinePoint[];
};

function percentChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;

    return ((current - previous) / Math.abs(previous)) * 100;
}

function compact(value: number) {
    return new Intl.NumberFormat('en-PH', {
        notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
        maximumFractionDigits: Math.abs(value) >= 10000 ? 1 : 0,
    }).format(value);
}

function AdminLinePanel({
    series,
    active,
    setActive,
}: {
    series: AdminLineSeries[];
    active?: Record<string, boolean>;
    setActive?: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
    const visible = series.filter((item) => active?.[item.key] ?? true);
    const values = visible.flatMap((item) => item.points.map((point) => point.value));
    const max = Math.max(1, ...values);
    const width = 720;
    const height = 245;
    const px = 42;
    const py = 32;
    const pointCount = Math.max(1, ...visible.map((item) => item.points.length));
    const x = (index: number, count: number) => count <= 1 ? width / 2 : px + (index * (width - px * 2)) / Math.max(count - 1, 1);
    const y = (value: number) => height - py - (value / max) * Math.max(height - py * 2, 1);

    function toggle(key: string) {
        setActive?.((current) => {
            const enabled = Object.values(current).filter(Boolean).length;
            if (current[key] && enabled <= 1) return current;
            return { ...current, [key]: !current[key] };
        });
    }

    return (
        <div className="admin-analytics-line-card">
            <div className="admin-analytics-line-legend">
                {series.map((item) => {
                    const selected = active?.[item.key] ?? true;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => toggle(item.key)}
                            className={selected ? 'is-active' : ''}
                            style={{ '--line-color': item.color } as CSSProperties}
                        >
                            <span />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {visible.some((item) => item.points.length > 0) ? (
                <svg viewBox={`0 0 ${width} ${height}`} role="img" className="admin-analytics-line-svg">
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const yy = py + ratio * (height - py * 2);
                        return <line key={ratio} x1={px} x2={width - px} y1={yy} y2={yy} className="admin-analytics-grid-line" />;
                    })}
                    {visible.map((item) => {
                        const count = Math.max(item.points.length, pointCount);
                        const points = item.points.map((point, index) => ({ ...point, x: x(index, count), y: y(point.value) }));
                        return (
                            <g key={item.key}>
                                <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={item.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                {points.map((point, index) => (
                                    <g key={`${item.key}-${point.label}-${index}`} className="admin-analytics-line-point">
                                        <circle cx={point.x} cy={point.y} r="5.5" fill={item.color}>
                                            <title>{item.label}: {point.detail ?? compact(point.value)}</title>
                                        </circle>
                                        <text x={point.x} y={Math.max(16, point.y - 12)} textAnchor="middle">{point.detail ?? compact(point.value)}</text>
                                    </g>
                                ))}
                            </g>
                        );
                    })}
                    {visible[0]?.points.map((point, index) => {
                        const count = Math.max(visible[0].points.length, pointCount);
                        return <text key={`${point.label}-${index}`} x={x(index, count)} y={height - 8} textAnchor="middle" className="admin-analytics-axis-label">{point.label.replace(/\s+\d{4}$/u, '')}</text>;
                    })}
                </svg>
            ) : (
                <EmptyChart message="No analytics data available." />
            )}
        </div>
    );
}

export default function AdminBookingAnalytics() {
    const { props } = usePage<PageProps>();
    const summary = props.summary ?? {};

    const statusCounts = (props.statusBreakdown ?? props.statusCounts ?? []).map((item) => ({
        label: cleanLabel(item.label || item.booking_status || item.status),
        value: num(item.value ?? item.total ?? item.count),
    }));

    const paymentCounts = (props.paymentBreakdown ?? []).map((item) => ({
        label: cleanLabel(item.label || item.status),
        value: num(item.value ?? item.total ?? item.count),
    }));

    const monthly = (props.monthlyTrend ?? props.monthly ?? []).map((item, index) => ({
        label: item.label || item.month || item.key || `Month ${index + 1}`,
        value: num(item.bookings ?? item.value ?? item.total ?? item.count),
        guests: num(item.guests),
        revenue: num(item.total_revenue ?? item.confirmed_revenue),
        unpaid: num(item.unpaid_balance),
    }));

    const workload = (props.upcomingWorkload ?? []).map((item) => ({
        label: item.label || item.date || 'Date',
        value: num(item.bookings),
        guests: num(item.guests),
    }));

    const [movementLines, setMovementLines] = useState<Record<string, boolean>>({ bookings: true, guests: true });
    const [financeLines, setFinanceLines] = useState<Record<string, boolean>>({ revenue: true, unpaid: true });
    const totalRevenue = num(summary.total_revenue ?? summary.net_booking_total ?? summary.confirmed_revenue);
    const totalUnpaid = num(summary.total_unpaid_balance ?? summary.outstanding_balance);
    const monthCount = Math.max(monthly.length, 1);
    const yearlyBookings = monthly.reduce((sum, item) => sum + item.value, 0);
    const yearlyGuests = monthly.reduce((sum, item) => sum + item.guests, 0);
    const yearlyRevenue = monthly.reduce((sum, item) => sum + item.revenue, 0);
    const latestRevenue = monthly.at(-1)?.revenue ?? 0;
    const previousRevenue = monthly.at(-2)?.revenue ?? 0;
    const revenueDelta = latestRevenue - previousRevenue;
    const revenueRate = percentChange(latestRevenue, previousRevenue);
    const rateIcon = revenueRate >= 0 ? ArrowUpRight : ArrowDownRight;
    const RateIcon = rateIcon;
    const movementSeries = useMemo<AdminLineSeries[]>(() => [
        {
            key: 'bookings',
            label: 'Bookings',
            color: '#176456',
            points: monthly.map((item) => ({ label: item.label, value: item.value, detail: `${item.value} bookings` })),
        },
        {
            key: 'guests',
            label: 'Guests',
            color: '#d6a43f',
            points: monthly.map((item) => ({ label: item.label, value: item.guests, detail: `${item.guests} guests` })),
        },
    ], [monthly]);
    const financeSeries = useMemo<AdminLineSeries[]>(() => [
        {
            key: 'revenue',
            label: 'Total Revenue',
            color: '#176456',
            points: monthly.map((item) => ({ label: item.label, value: item.revenue, detail: money(item.revenue) })),
        },
        {
            key: 'unpaid',
            label: 'Unpaid Balance',
            color: '#b45309',
            points: monthly.map((item) => ({ label: item.label, value: item.unpaid, detail: money(item.unpaid) })),
        },
    ], [monthly]);
    const statusSeries = useMemo<AdminLineSeries[]>(() => [{
        key: 'status',
        label: 'Booking Status',
        color: '#176456',
        points: statusCounts.map((item) => ({ label: item.label, value: item.value, detail: `${item.value} ${item.label}` })),
    }], [statusCounts]);
    const paymentSeries = useMemo<AdminLineSeries[]>(() => [{
        key: 'payment',
        label: 'Payment Status',
        color: '#d6a43f',
        points: paymentCounts.map((item) => ({ label: item.label, value: item.value, detail: `${item.value} ${item.label}` })),
    }], [paymentCounts]);
    const workloadSeries = useMemo<AdminLineSeries[]>(() => [{
        key: 'workload',
        label: 'Bookings',
        color: '#176456',
        points: workload.map((item) => ({ label: item.label, value: item.value, detail: `${item.value} bookings, ${item.guests} guests` })),
    }], [workload]);

    return (
        <ResourcePageShell
            title="Booking Analytics"
            eyebrow="Review & Reports"
            icon={BarChart3}
            breadcrumbs={breadcrumbs}
            subtitle="Accurate booking volume, payment compliance, monthly trend, yearly totals, and operational workload from the booking database."
            actions={
                <>
                    <ResourceActionLink href="/admin/bookings" variant="secondary">Bookings</ResourceActionLink>
                    <ResourceActionLink href="/admin/bookings/analytics/print" variant="secondary">Print</ResourceActionLink>
                    <ResourceActionLink href="/admin/bookings/analytics/export">Export Excel</ResourceActionLink>
                </>
            }
        >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
                <ResourceStatCard label="Total Bookings" value={num(summary.total_bookings)} description="All matching booking records." icon={CalendarDays} />
                <ResourceStatCard label="Pending" value={num(summary.pending)} description="Requests needing action." icon={Clock3} />
                <ResourceStatCard label="Confirmed" value={num(summary.confirmed) + num(summary.active)} description="Confirmed or active." icon={CheckCircle2} />
                <ResourceStatCard label="Completed" value={num(summary.completed)} description="Finished records." icon={FileBarChart} />
                <ResourceStatCard label="Guests" value={num(summary.total_guests)} description="Total estimated guests." icon={Users} />
                <ResourceStatCard label="Total Revenue" value={money(totalRevenue)} description="Booking payable total after discounts." icon={CreditCard} />
                <ResourceStatCard label="Total Unpaid Balance" value={money(totalUnpaid)} description="Remaining unpaid amount." icon={Wallet} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ResourceStatCard label="Average Monthly Bookings" value={(yearlyBookings / monthCount).toFixed(1)} description={`${yearlyBookings} bookings across the yearly movement.`} icon={CalendarDays} />
                <ResourceStatCard label="Average Monthly Guests" value={(yearlyGuests / monthCount).toFixed(1)} description={`${yearlyGuests} guests across the yearly movement.`} icon={Users} />
                <ResourceStatCard label="Monthly Revenue" value={money(latestRevenue)} description={`Latest month revenue. Year total: ${money(yearlyRevenue)}.`} icon={CreditCard} />
                <ResourceStatCard label="Monthly Rate" value={`${Math.abs(revenueRate).toFixed(1)}%`} description={`${revenueRate >= 0 ? 'Increase' : 'Decrease'} ${revenueDelta >= 0 ? '+' : '-'}${money(Math.abs(revenueDelta))} from previous month.`} icon={RateIcon} />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <ResourceSection title="Monthly booking & guest movement" eyebrow="Yearly Analytics Movement" description="Toggle each indicator to isolate the whole-year movement line.">
                    <AdminLinePanel series={movementSeries} active={movementLines} setActive={setMovementLines} />
                </ResourceSection>

                <ResourceSection title="Total revenue & unpaid balance movement" eyebrow="Monthly Revenue" description="Revenue uses booking payable totals, while unpaid tracks remaining balances.">
                    <AdminLinePanel series={financeSeries} active={financeLines} setActive={setFinanceLines} />
                </ResourceSection>

                <ResourceSection title="Booking status profile" eyebrow="Booking Status" description="Lifecycle distribution rendered in the same clean line style.">
                    <AdminLinePanel series={statusSeries} />
                </ResourceSection>

                <ResourceSection title="Payment status profile" eyebrow="Payment Status" description="Payment status spread uses the same hoverable line format.">
                    <AdminLinePanel series={paymentSeries} />
                </ResourceSection>

                <ResourceSection title="Upcoming workload movement" eyebrow="Next 30 Days" description="Daily booking load and guests for short-range scheduling.">
                    <AdminLinePanel series={workloadSeries} />
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}
