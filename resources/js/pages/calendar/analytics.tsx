import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    ArrowUpRight,
    BarChart3,
    CalendarCheck2,
    CalendarDays,
    ChevronRight,
    Clock3,
    Download,
    FileText,
    Layers3,
    LineChart,
    PieChart,
    Printer,
    RefreshCcw,
    Search,
    ShieldCheck,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

type CountRow = {
    block?: string;
    status?: string;
    weekday?: string;
    count?: number | string;
    label?: string;
    value?: number | string;
};

type AreaRow = {
    area?: string;
    bookings?: number | string;
    calendar_blocks?: number | string;
    public_events?: number | string;
    total?: number | string;
};

type DateRow = {
    date: string;
    occupied_blocks?: number | string;
    bookings?: number | string;
    calendar_blocks?: number | string;
    public_events?: number | string;
    total_activity?: number | string;
};

type Props = {
    filters: {
        start_date?: string;
        end_date?: string;
    };
    generated_at?: string;
    summary?: Record<string, unknown>;
    block_usage?: CountRow[];
    block_status_mix?: CountRow[];
    weekday_usage?: CountRow[];
    area_usage?: AreaRow[];
    busiest_dates?: DateRow[];
    date_series?: DateRow[];
};

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function currentCalendarBase() {
    if (typeof window === 'undefined') return '/calendar';

    const path = window.location.pathname;

    if (path.startsWith('/admin')) return '/admin/calendar';
    if (path.startsWith('/manager')) return '/manager/calendar';
    if (path.startsWith('/staff')) return '/staff/calendar';

    return '/calendar';
}

function currentWorkspaceLabel() {
    if (typeof window === 'undefined') return 'Calendar';

    const path = window.location.pathname;

    if (path.startsWith('/admin')) return 'Admin Calendar';
    if (path.startsWith('/manager')) return 'Manager Calendar';
    if (path.startsWith('/staff')) return 'Staff Calendar';

    return 'Calendar';
}

function breadcrumbs(): BreadcrumbItem[] {
    const base = currentCalendarBase();

    return [
        { title: currentWorkspaceLabel(), href: base },
        { title: 'Analytics', href: `${base}/analytics` },
    ];
}

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function cleanLabel(value: unknown): string {
    const label = String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .trim();

    return label.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: unknown) {
    return new Intl.NumberFormat('en-PH').format(numberValue(value));
}

function formatDate(value?: string | null) {
    if (!value) return '—';

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
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

function getSummary(summary: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
        if (summary[key] !== undefined && summary[key] !== null) {
            return numberValue(summary[key]);
        }
    }

    return 0;
}

function countLabel(row: CountRow) {
    return row.block || row.status || row.weekday || row.label || '—';
}

function countValue(row: CountRow) {
    return numberValue(row.count ?? row.value);
}

function maxValue<T>(items: T[], getter: (item: T) => number) {
    return Math.max(1, ...items.map((item) => getter(item)));
}

function statusTone(label: string) {
    const normalized = label.toLowerCase();

    if (
        normalized.includes('available') ||
        normalized.includes('public') ||
        normalized.includes('completed')
    ) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200';
    }

    if (
        normalized.includes('blocked') ||
        normalized.includes('unavailable') ||
        normalized.includes('closed')
    ) {
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200';
    }

    if (
        normalized.includes('private') ||
        normalized.includes('reserved') ||
        normalized.includes('booked')
    ) {
        return 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';
    }

    return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200';
}

function blockTone(label: string) {
    const normalized = label.toLowerCase();

    if (normalized.includes('am')) {
        return 'from-emerald-600 to-emerald-400';
    }

    if (normalized.includes('pm')) {
        return 'from-amber-600 to-amber-400';
    }

    if (normalized.includes('eve') || normalized.includes('night')) {
        return 'from-slate-700 to-slate-500';
    }

    return 'from-green-700 to-amber-500';
}

function Panel({
    title,
    eyebrow,
    description,
    action,
    children,
    className,
}: {
    title: string;
    eyebrow?: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950',
                className,
            )}
        >
            <header className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/20">
                <div className="min-w-0">
                    {eyebrow ? (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                            {eyebrow}
                        </p>
                    ) : null}

                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl dark:text-white">
                        {title}
                    </h2>

                    {description ? (
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                            {description}
                        </p>
                    ) : null}
                </div>

                {action ? <div className="shrink-0">{action}</div> : null}
            </header>

            {children}
        </section>
    );
}

function MetricCard({
    label,
    value,
    helper,
    icon: Icon,
    accent = 'green',
}: {
    label: string;
    value: string | number;
    helper: string;
    icon: LucideIcon;
    accent?: 'green' | 'gold' | 'slate' | 'blue';
}) {
    const accentClasses = {
        green: 'from-emerald-700 to-green-500 text-white',
        gold: 'from-amber-600 to-yellow-500 text-white',
        slate: 'from-slate-800 to-slate-600 text-white',
        blue: 'from-blue-700 to-sky-500 text-white',
    };

    return (
        <article className="group relative overflow-hidden border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-700 via-amber-400 to-green-700" />

            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {label}
                    </p>

                    <strong className="mt-3 block text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                        {value}
                    </strong>
                </div>

                <div
                    className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center bg-gradient-to-br shadow-sm',
                        accentClasses[accent],
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {helper}
            </p>
        </article>
    );
}

function EmptyState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="grid min-h-48 place-items-center p-8 text-center">
            <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                    <CalendarDays className="h-6 w-6 text-slate-400" />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                    {title}
                </h3>

                <p className="mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            </div>
        </div>
    );
}

function ProgressRow({
    label,
    value,
    max,
    helper,
    tone = 'from-emerald-700 to-amber-400',
}: {
    label: string;
    value: number;
    max: number;
    helper?: string;
    tone?: string;
}) {
    const width = Math.max(3, Math.min(100, (value / Math.max(max, 1)) * 100));

    return (
        <div className="rounded-none border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">
                        {label}
                    </p>

                    {helper ? (
                        <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {helper}
                        </p>
                    ) : null}
                </div>

                <strong className="shrink-0 text-sm font-semibold text-slate-950 dark:text-white">
                    {formatNumber(value)}
                </strong>
            </div>

            <div className="mt-3 h-2 overflow-hidden bg-slate-100 dark:bg-slate-900">
                <div
                    className={cn('h-full bg-gradient-to-r', tone)}
                    style={{ width: `${width}%` }}
                />
            </div>
        </div>
    );
}

function CountPanel({
    title,
    eyebrow,
    rows,
    emptyTitle,
    emptyDescription,
    variant = 'default',
}: {
    title: string;
    eyebrow: string;
    rows: CountRow[];
    emptyTitle: string;
    emptyDescription: string;
    variant?: 'default' | 'status' | 'block';
}) {
    const max = maxValue(rows, countValue);

    return (
        <Panel title={title} eyebrow={eyebrow}>
            <div className="grid gap-3 p-4 sm:p-5">
                {rows.length > 0 ? (
                    rows.map((row) => {
                        const label = cleanLabel(countLabel(row));
                        const value = countValue(row);

                        return (
                            <ProgressRow
                                key={`${label}-${value}`}
                                label={label}
                                value={value}
                                max={max}
                                tone={
                                    variant === 'block'
                                        ? blockTone(label)
                                        : 'from-emerald-700 to-amber-400'
                                }
                                helper={
                                    variant === 'status'
                                        ? 'Calendar visibility/status count'
                                        : undefined
                                }
                            />
                        );
                    })
                ) : (
                    <EmptyState
                        title={emptyTitle}
                        description={emptyDescription}
                    />
                )}
            </div>
        </Panel>
    );
}

function StatusPill({ label, value }: { label: string; value: number }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-semibold',
                statusTone(label),
            )}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {cleanLabel(label)}
            <strong>{formatNumber(value)}</strong>
        </span>
    );
}

function DateSeriesChart({
    rows,
    max,
}: {
    rows: DateRow[];
    max: number;
}) {
    if (rows.length === 0) {
        return (
            <EmptyState
                title="No date series"
                description="Daily activity rows will appear here after the report loads."
            />
        );
    }

    return (
        <div className="overflow-x-auto p-4 sm:p-5">
            <div className="flex min-w-[720px] items-end gap-2">
                {rows.map((row) => {
                    const total = numberValue(row.total_activity);
                    const height = Math.max(
                        12,
                        Math.min(170, (total / Math.max(max, 1)) * 170),
                    );

                    return (
                        <div
                            key={row.date}
                            className="group flex min-w-9 flex-1 flex-col items-center gap-2"
                            title={`${formatDate(row.date)} · ${total} activity`}
                        >
                            <div className="flex h-44 w-full items-end overflow-hidden bg-slate-100 dark:bg-slate-900">
                                <div
                                    className="w-full bg-gradient-to-t from-emerald-800 via-emerald-600 to-amber-300 transition duration-300 group-hover:from-amber-600 group-hover:to-emerald-500"
                                    style={{ height }}
                                />
                            </div>

                            <span className="max-w-12 rotate-[-45deg] truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {formatDate(row.date).replace(',', '')}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AreaUsageList({ rows }: { rows: AreaRow[] }) {
    const max = maxValue(rows, (item) => numberValue(item.total));

    if (rows.length === 0) {
        return (
            <EmptyState
                title="No area utilization"
                description="Area usage will appear here when calendar data exists."
            />
        );
    }

    return (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((row) => {
                const area = row.area || 'Unspecified Area';
                const bookings = numberValue(row.bookings);
                const calendarBlocks = numberValue(row.calendar_blocks);
                const publicEvents = numberValue(row.public_events);
                const total = numberValue(row.total);
                const width = Math.max(
                    4,
                    Math.min(100, (total / Math.max(max, 1)) * 100),
                );

                return (
                    <article
                        key={area}
                        className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(180px,320px)_80px] lg:items-center"
                    >
                        <div className="min-w-0">
                            <h3 className="break-words text-base font-semibold text-slate-950 dark:text-white">
                                {area}
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                {formatNumber(bookings)} booking services ·{' '}
                                {formatNumber(calendarBlocks)} calendar blocks ·{' '}
                                {formatNumber(publicEvents)} public events
                            </p>
                        </div>

                        <div className="h-2 overflow-hidden bg-slate-100 dark:bg-slate-900">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-700 to-amber-400"
                                style={{ width: `${width}%` }}
                            />
                        </div>

                        <strong className="text-left text-lg font-semibold text-slate-950 lg:text-right dark:text-white">
                            {formatNumber(total)}
                        </strong>
                    </article>
                );
            })}
        </div>
    );
}

function BusiestDateList({ rows }: { rows: DateRow[] }) {
    if (rows.length === 0) {
        return (
            <EmptyState
                title="No busiest date data"
                description="The busiest calendar days will appear here."
            />
        );
    }

    return (
        <div className="grid gap-3 p-4 sm:p-5">
            {rows.slice(0, 10).map((row, index) => {
                const total = numberValue(row.total_activity);

                return (
                    <article
                        key={`${row.date}-${index}`}
                        className="flex items-start justify-between gap-4 border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                    >
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex h-7 w-7 items-center justify-center bg-slate-950 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                                    {index + 1}
                                </span>

                                <strong className="text-sm font-semibold text-slate-950 dark:text-white">
                                    {formatDate(row.date)}
                                </strong>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {formatNumber(row.bookings)} bookings ·{' '}
                                {formatNumber(row.calendar_blocks)} blocks ·{' '}
                                {formatNumber(row.public_events)} public events
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">
                                {formatNumber(total)}
                            </p>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Total
                            </span>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

function SummaryStrip({
    blockStatusMix,
    rangeDays,
    generatedAt,
}: {
    blockStatusMix: CountRow[];
    rangeDays: number;
    generatedAt?: string;
}) {
    return (
        <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto] dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex flex-wrap gap-2">
                {blockStatusMix.length > 0 ? (
                    blockStatusMix.map((row) => {
                        const label = countLabel(row);
                        const value = countValue(row);

                        return (
                            <StatusPill
                                key={`${label}-${value}`}
                                label={label}
                                value={value}
                            />
                        );
                    })
                ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        No status mix available yet.
                    </span>
                )}
            </div>

            <div className="text-left text-xs leading-5 text-slate-500 sm:text-right dark:text-slate-400">
                <strong className="block text-slate-800 dark:text-slate-200">
                    {formatNumber(rangeDays)} selected days
                </strong>
                Generated {formatDateTime(generatedAt)}
            </div>
        </div>
    );
}

export default function CalendarAnalytics({
    filters = {},
    generated_at,
    summary = {},
    block_usage = [],
    block_status_mix = [],
    weekday_usage = [],
    area_usage = [],
    busiest_dates = [],
    date_series = [],
}: Props) {
    const base = currentCalendarBase();
    const analyticsPath = `${base}/analytics`;

    const startDate = filters.start_date || '';
    const endDate = filters.end_date || '';

    const query = new URLSearchParams();

    if (startDate) query.set('start_date', startDate);
    if (endDate) query.set('end_date', endDate);

    const queryString = query.toString();

    const exportHref = queryString
        ? `${analyticsPath}/export?${queryString}`
        : `${analyticsPath}/export`;

    const printHref = queryString
        ? `${analyticsPath}/print?${queryString}`
        : `${analyticsPath}/print`;

    const occupiedBlocks = getSummary(summary, [
        'occupied_blocks',
        'occupied_block_days',
    ]);

    const bookings = getSummary(summary, [
        'bookings_in_range',
        'bookings',
        'booking_count',
        'total_bookings',
    ]);

    const calendarBlocks = getSummary(summary, [
        'calendar_blocks_in_range',
        'calendar_blocks',
        'block_count',
    ]);

    const publicEvents = getSummary(summary, [
        'public_events_in_range',
        'public_events',
        'public_event_count',
    ]);

    const explicitActivity = getSummary(summary, [
        'total_activity',
        'activity_total',
    ]);

    const totalActivity =
        explicitActivity || occupiedBlocks + calendarBlocks + publicEvents;

    const rangeDays =
        getSummary(summary, ['range_days', 'total_days', 'days']) ||
        date_series.length;

    const maxDateActivity = maxValue(date_series, (item) =>
        numberValue(item.total_activity),
    );

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        router.get(
            analyticsPath,
            {
                start_date: String(form.get('start_date') || '') || undefined,
                end_date: String(form.get('end_date') || '') || undefined,
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
            <Head title="Calendar Analytics" />

            <main className="min-w-0 space-y-5 bg-[#f7f3e9] p-3 sm:p-4 lg:p-6 dark:bg-slate-950">
                <section className="relative overflow-hidden border border-emerald-900/10 bg-[#fbfaf5] shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(180,141,55,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(21,94,67,0.16),transparent_40%)] lg:block" />

                    <div className="relative grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:p-7">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 border border-emerald-900/10 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900 dark:text-emerald-200">
                                <Sparkles className="h-3.5 w-3.5" />
                                Calendar Operations
                            </div>

                            <h1 className="mt-4 max-w-4xl text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl dark:text-white">
                                Calendar analytics for occupancy, blocks, venue
                                usage, and public activity.
                            </h1>

                            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-400">
                                Monitor AM, PM, and evening usage, identify busy
                                dates, review public event load, and prepare
                                operational reports from one clean command view.
                            </p>

                            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                <span className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                                    <CalendarDays className="h-4 w-4 text-emerald-700" />
                                    {formatDate(startDate)} to{' '}
                                    {formatDate(endDate)}
                                </span>

                                <span className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                                    <Clock3 className="h-4 w-4 text-amber-600" />
                                    Generated {formatDateTime(generated_at)}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:w-56 lg:grid-cols-1">
                            <Link
                                href={base}
                                className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-700 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <CalendarDays className="h-4 w-4" />
                                Open Calendar
                            </Link>

                            <Link
                                href={`${base}/manage`}
                                className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-700 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                Manage Blocks
                            </Link>

                            <a
                                href={exportHref}
                                className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-700 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </a>

                            <a
                                href={printHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-800 to-green-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-700 hover:to-green-600"
                            >
                                <Printer className="h-4 w-4" />
                                Print Report
                            </a>
                        </div>
                    </div>

                    <SummaryStrip
                        blockStatusMix={block_status_mix}
                        rangeDays={rangeDays}
                        generatedAt={generated_at}
                    />
                </section>

                <section className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-950">
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:items-end"
                    >
                        <label className="grid gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Start Date
                            </span>
                            <input
                                type="date"
                                name="start_date"
                                defaultValue={startDate}
                                className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                        </label>

                        <label className="grid gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                End Date
                            </span>
                            <input
                                type="date"
                                name="end_date"
                                defaultValue={endDate}
                                className="h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                        </label>

                        <button
                            type="submit"
                            className="inline-flex h-11 items-center justify-center gap-2 bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            <Search className="h-4 w-4" />
                            Apply Range
                        </button>

                        <Link
                            href={analyticsPath}
                            className="inline-flex h-11 items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-emerald-700 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Reset
                        </Link>
                    </form>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        label="Total Activity"
                        value={formatNumber(totalActivity)}
                        helper={`${formatNumber(rangeDays)} day range across bookings, calendar blocks, and public events.`}
                        icon={Activity}
                        accent="green"
                    />

                    <MetricCard
                        label="Occupied Blocks"
                        value={formatNumber(occupiedBlocks)}
                        helper="AM, PM, and EVE occupied block-days from the selected range."
                        icon={Layers3}
                        accent="gold"
                    />

                    <MetricCard
                        label="Bookings"
                        value={formatNumber(bookings)}
                        helper="Booking records and booking service activity touching this range."
                        icon={CalendarCheck2}
                        accent="blue"
                    />

                    <MetricCard
                        label="Public + Internal"
                        value={formatNumber(publicEvents + calendarBlocks)}
                        helper={`${formatNumber(publicEvents)} public events · ${formatNumber(calendarBlocks)} internal blocks.`}
                        icon={BarChart3}
                        accent="slate"
                    />
                </section>

                <section className="grid gap-5 xl:grid-cols-3">
                    <CountPanel
                        title="AM / PM / EVE"
                        eyebrow="Block Usage"
                        rows={block_usage}
                        emptyTitle="No block usage"
                        emptyDescription="Occupied AM, PM, and EVE block data will appear here."
                        variant="block"
                    />

                    <CountPanel
                        title="Calendar Status"
                        eyebrow="Status Mix"
                        rows={block_status_mix}
                        emptyTitle="No status mix"
                        emptyDescription="Blocked, public, private, and unavailable status data will appear here."
                        variant="status"
                    />

                    <CountPanel
                        title="Activity By Weekday"
                        eyebrow="Weekday Demand"
                        rows={weekday_usage}
                        emptyTitle="No weekday data"
                        emptyDescription="Activity by weekday will appear here after calendar data is available."
                    />
                </section>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <Panel
                        title="Venue and Area Usage"
                        eyebrow="Area Utilization"
                        description="Combines booking services, calendar blocks, and public event activity by area."
                        action={
                            <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 lg:flex dark:text-emerald-300">
                                <PieChart className="h-4 w-4" />
                                Usage Share
                            </div>
                        }
                    >
                        <AreaUsageList rows={area_usage} />
                    </Panel>

                    <Panel
                        title="Top Activity Days"
                        eyebrow="Busiest Dates"
                        action={
                            <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                        }
                    >
                        <BusiestDateList rows={busiest_dates} />
                    </Panel>
                </section>

                <Panel
                    title="Daily Activity Timeline"
                    eyebrow="Date Series"
                    description="Compact bars show how calendar load is distributed across the selected range."
                    action={
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            <LineChart className="h-4 w-4" />
                            Scroll on mobile
                        </div>
                    }
                >
                    <DateSeriesChart
                        rows={date_series}
                        max={maxDateActivity}
                    />
                </Panel>

                <section className="grid gap-4 lg:grid-cols-3">
                    <article className="border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center bg-emerald-800 text-white">
                                <Clock3 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    Operations Note
                                </p>
                                <h3 className="font-semibold text-slate-950 dark:text-white">
                                    Use block-level data
                                </h3>
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            AM-only and PM-only blocks should be reviewed as
                            partial-day availability, not automatically as whole
                            day unavailable.
                        </p>
                    </article>

                    <article className="border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center bg-amber-600 text-white">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    Report Tip
                                </p>
                                <h3 className="font-semibold text-slate-950 dark:text-white">
                                    Export before meetings
                                </h3>
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Use the export and print buttons for operational
                            review, MICE coordination, and venue planning
                            discussions.
                        </p>
                    </article>

                    <Link
                        href={base}
                        className="group border border-emerald-900/20 bg-gradient-to-br from-emerald-900 to-green-800 p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                                    Return
                                </p>
                                <h3 className="mt-1 text-lg font-semibold">
                                    Open Calendar View
                                </h3>
                            </div>

                            <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </div>

                        <p className="mt-4 text-sm leading-6 text-emerald-50/90">
                            Go back to the calendar to inspect exact dates,
                            blocked periods, and availability details.
                        </p>

                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                            Continue
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    </Link>
                </section>
            </main>
        </AppLayout>
    );
}