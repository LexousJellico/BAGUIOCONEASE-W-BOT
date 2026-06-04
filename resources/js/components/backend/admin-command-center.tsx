import { ResourceActionLink } from '@/components/admin-resource/resource-page-shell';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    CreditCard,
    Download,
    ExternalLink,
    FileBarChart,
    Gauge,
    Globe2,
    Inbox,
    LayoutDashboard,
    LineChart,
    PieChart,
    Printer,
    ReceiptText,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    UsersRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

type CommandMetric = {
    label: string;
    value: string | number;
    helper?: string | null;
    href?: string | null;
    tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'info';
};

type BreakdownRow = {
    label: string;
    value: number;
    helper?: string | null;
};

type TrendRow = {
    label: string;
    value: number;
};

type ActivityRow = {
    id: number | string;
    title: string;
    message?: string | null;
    type?: string | null;
    severity?: string | null;
    actor?: string | null;
    created_at?: string | null;
    link?: string | null;
};

type PaymentSummary = {
    pending_review?: number;
    approved_amount?: number;
    submitted_amount?: number;
    rejected_amount?: number;
    overdue_bookings?: number;
    due_soon_bookings?: number;
};

type WebsiteSummary = {
    visits_today?: number;
    visits_month?: number;
    unique_visitors_month?: number;
    inquiries_open?: number;
    conversion_hint?: string | null;
};

type UsersSummary = {
    total?: number;
    verified?: number;
    unverified?: number;
    new_today?: number;
    operator_accounts?: number;
    client_accounts?: number;
};

type RecentUserRow = {
    id?: number | string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    email_verified?: boolean | null;
    bookings_count?: number;
    pending_bookings_count?: number;
    created_at?: string | null;
};

type SystemHealth = {
    label: string;
    value: string | number;
    helper?: string | null;
    state?: 'good' | 'warn' | 'danger' | 'neutral';
};

type AdminCommandCenterPayload = {
    headlineMetrics?: CommandMetric[];
    bookingStatus?: BreakdownRow[];
    bookingTrend?: TrendRow[];
    packageUsage?: BreakdownRow[];
    scheduleMix?: BreakdownRow[];
    paymentSummary?: PaymentSummary;
    miceSummary?: CommandMetric[];
    websiteSummary?: WebsiteSummary;
    usersSummary?: UsersSummary;
    recentUsers?: RecentUserRow[];
    systemHealth?: SystemHealth[];
    recentActivity?: ActivityRow[];
};

type WorkspaceStats = Record<string, number | string | null | undefined>;

type AdminCommandCenterProps = {
    workspaceStats?: WorkspaceStats;
    adminCommandCenter?: AdminCommandCenterPayload;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Dashboard', href: '/admin/dashboard' },
];

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown): string {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

function cleanLabel(value?: string | null): string {
    return String(value || 'Not set')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value?: string | null): string {
    if (!value) return 'Just now';

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

function toneClass(tone?: CommandMetric['tone'] | SystemHealth['state']) {
    if (tone === 'good') {
        return 'border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200';
    }

    if (tone === 'warn') {
        return 'border-amber-300/40 bg-amber-400/10 text-amber-700 dark:text-amber-200';
    }

    if (tone === 'danger') {
        return 'border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-200';
    }

    if (tone === 'info') {
        return 'border-sky-300/40 bg-sky-400/10 text-sky-700 dark:text-sky-200';
    }

    return 'border-[#d9c7a6]/70 bg-white/74 text-[#2f2517] dark:border-white/10 dark:bg-white/[0.055] dark:text-white';
}

function maxOf(rows: Array<{ value: number }>): number {
    return Math.max(1, ...rows.map((row) => numberValue(row.value)));
}

const STATUS_PALETTE = [
    { solid: '#f59e0b', soft: 'rgba(245, 158, 11, 0.16)', text: '#92400e' },
    { solid: '#10b981', soft: 'rgba(16, 185, 129, 0.16)', text: '#047857' },
    { solid: '#3b82f6', soft: 'rgba(59, 130, 246, 0.16)', text: '#1d4ed8' },
    { solid: '#8b5cf6', soft: 'rgba(139, 92, 246, 0.16)', text: '#6d28d9' },
    { solid: '#ef4444', soft: 'rgba(239, 68, 68, 0.16)', text: '#b91c1c' },
    { solid: '#14b8a6', soft: 'rgba(20, 184, 166, 0.16)', text: '#0f766e' },
    { solid: '#ec4899', soft: 'rgba(236, 72, 153, 0.16)', text: '#be185d' },
];

function statusColor(index: number) {
    return STATUS_PALETTE[index % STATUS_PALETTE.length];
}

function downloadTextFile(
    filename: string,
    contents: string,
    type = 'text/plain;charset=utf-8',
) {
    if (typeof window === 'undefined') {
        return;
    }

    const blob = new Blob([contents], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
    const text = String(value ?? '');
    return `"${text.replaceAll('"', '""')}"`;
}

function dashboardCsv(
    adminCommandCenter: AdminCommandCenterPayload,
    workspaceStats: WorkspaceStats,
): string {
    const rows: string[][] = [
        ['Section', 'Label', 'Value', 'Helper'],
        ...(adminCommandCenter.headlineMetrics ?? []).map((metric) => [
            'Headline Metric',
            metric.label,
            String(metric.value ?? ''),
            String(metric.helper ?? ''),
        ]),
        ...(adminCommandCenter.bookingStatus ?? []).map((row) => [
            'Booking Status',
            row.label,
            String(row.value ?? 0),
            String(row.helper ?? ''),
        ]),
        ...(adminCommandCenter.paymentSummary
            ? Object.entries(adminCommandCenter.paymentSummary).map(
                  ([key, value]) => [
                      'Payment Summary',
                      cleanLabel(key),
                      String(value ?? 0),
                      '',
                  ],
              )
            : []),
        ...(adminCommandCenter.systemHealth ?? []).map((item) => [
            'System Health',
            item.label,
            String(item.value ?? ''),
            String(item.helper ?? ''),
        ]),
        ...Object.entries(workspaceStats).map(([key, value]) => [
            'Workspace Stats',
            cleanLabel(key),
            String(value ?? ''),
            '',
        ]),
    ];

    return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

function CommandMetricCard({
    metric,
    index,
}: {
    metric: CommandMetric;
    index: number;
}) {
    const content = (
        <article
            className={`bccc-admin-command-metric group relative min-h-[10.5rem] overflow-hidden rounded-[1.4rem] border p-5 shadow-[0_18px_54px_rgba(47,37,23,0.08)] transition duration-300 hover:-translate-y-1 ${toneClass(metric.tone)}`}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(216,181,109,0.18),transparent_42%)] opacity-70" />
            <div className="relative flex h-full flex-col justify-between gap-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.24em] uppercase opacity-70">
                            {metric.label}
                        </p>
                        <p className="mt-3 text-4xl font-semibold tracking-[-0.075em] lg:text-5xl">
                            {metric.value}
                        </p>
                    </div>

                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-current/15 bg-white/45 dark:bg-white/10">
                        {index === 0 ? (
                            <ClipboardList className="h-5 w-5" />
                        ) : null}
                        {index === 1 ? <Clock3Icon /> : null}
                        {index === 2 ? (
                            <CreditCard className="h-5 w-5" />
                        ) : null}
                        {index > 2 ? <Activity className="h-5 w-5" /> : null}
                    </span>
                </div>

                <div className="flex items-end justify-between gap-3 border-t border-current/10 pt-3">
                    <p className="text-sm leading-6 opacity-75">
                        {metric.helper || 'Live system metric'}
                    </p>
                    {metric.href ? (
                        <ExternalLink className="h-4 w-4 shrink-0 opacity-55" />
                    ) : null}
                </div>
            </div>
        </article>
    );

    if (metric.href) {
        return (
            <Link href={metric.href} className="block">
                {content}
            </Link>
        );
    }

    return content;
}

function Clock3Icon() {
    return <CalendarClock className="h-5 w-5" />;
}

function ProgressRow({
    row,
    max,
    colorIndex = 0,
}: {
    row: BreakdownRow;
    max: number;
    colorIndex?: number;
}) {
    const percent =
        max > 0
            ? Math.min(100, Math.round((numberValue(row.value) / max) * 100))
            : 0;
    const color = statusColor(colorIndex);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-start gap-2">
                    <span
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
                        style={{ backgroundColor: color.solid }}
                    />
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-[#2f2517] dark:text-white">
                            {row.label}
                        </p>
                        {row.helper ? (
                            <p className="text-xs text-[#6e604c] dark:text-white/50">
                                {row.helper}
                            </p>
                        ) : null}
                    </div>
                </div>
                <span
                    className="rounded-full px-2.5 py-1 text-xs font-black tabular-nums"
                    style={{ backgroundColor: color.soft, color: color.text }}
                >
                    {row.value}
                </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#efe4cf] dark:bg-white/10">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${percent}%`, backgroundColor: color.solid }}
                />
            </div>
        </div>
    );
}

function Panel({
    title,
    eyebrow,
    icon: Icon,
    children,
    actions,
}: {
    title: string;
    eyebrow?: string;
    icon: typeof LayoutDashboard;
    children: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <section className="bccc-admin-command-panel rounded-[1.65rem] border border-[#d9c7a6]/70 bg-white/84 p-5 shadow-[0_22px_70px_rgba(47,37,23,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
            <div className="mb-5 flex flex-col gap-3 border-b border-[#d9c7a6]/60 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
                <div>
                    <p className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.24em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                        <Icon className="h-3.5 w-3.5" />
                        {eyebrow || 'Command Center'}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-[#21180d] dark:text-white">
                        {title}
                    </h2>
                </div>
                {actions ? (
                    <div className="flex flex-wrap gap-2">{actions}</div>
                ) : null}
            </div>
            {children}
        </section>
    );
}

function TrendBars({ rows }: { rows: TrendRow[] }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const max = maxOf(rows);
    const width = 720;
    const height = 240;
    const padX = 42;
    const padY = 30;

    if (!rows.length) {
        return (
            <p className="text-sm text-[#6e604c] dark:text-white/55">
                No trend data yet.
            </p>
        );
    }

    const points = rows.map((row, index) => {
        const x =
            rows.length === 1
                ? width / 2
                : padX + (index * (width - padX * 2)) / (rows.length - 1);
        const value = numberValue(row.value);
        const y = height - padY - (value / max) * (height - padY * 2);

        return { ...row, x, y, value };
    });

    const path = points.reduce((current, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;

        const previous = points[index - 1];
        const midX = (previous.x + point.x) / 2;

        return `${current} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
    }, '');
    const fillPath = `${path} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;
    const hovered = hoveredIndex === null ? null : points[hoveredIndex];

    return (
        <div className="relative overflow-hidden rounded-[1.35rem] border border-[#d9c7a6]/60 bg-[#fffaf0]/70 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-black text-[#21180d] dark:text-white">
                        Monthly reservation movement
                    </p>
                    <p className="text-xs text-[#6e604c] dark:text-white/50">
                        Hover a point to view the exact data.
                    </p>
                </div>
                <span className="rounded-full bg-[#2f2517] px-3 py-1 text-xs font-black text-white dark:bg-[#f1d89b] dark:text-[#1d160d]">
                    Peak {max}
                </span>
            </div>

            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Monthly booking activity line graph"
                className="h-64 w-full overflow-visible"
            >
                <defs>
                    <linearGradient id="bookingTrendFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#9d7b3d" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#9d7b3d" stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                {[0, 1, 2, 3].map((line) => {
                    const y = padY + (line * (height - padY * 2)) / 3;

                    return (
                        <line
                            key={line}
                            x1={padX}
                            x2={width - padX}
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            strokeDasharray="7 9"
                            className="text-[#d9c7a6] opacity-70 dark:text-white/15"
                        />
                    );
                })}

                <path d={fillPath} fill="url(#bookingTrendFill)" />
                <path
                    d={path}
                    fill="none"
                    stroke="#9d7b3d"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="5"
                    className="drop-shadow-[0_12px_20px_rgba(157,123,61,0.22)]"
                />

                {points.map((point, index) => (
                    <g
                        key={point.label}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onFocus={() => setHoveredIndex(index)}
                        onBlur={() => setHoveredIndex(null)}
                        tabIndex={0}
                        className="cursor-pointer outline-none"
                    >
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r={hoveredIndex === index ? 12 : 9}
                            fill="#fffaf0"
                            stroke="#9d7b3d"
                            strokeWidth="4"
                            className="transition-all duration-200 dark:fill-[#17120b]"
                        />
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r={4}
                            fill="#2f2517"
                            className="dark:fill-[#f1d89b]"
                        />
                    </g>
                ))}
            </svg>

            {hovered ? (
                <div
                    className="pointer-events-none absolute rounded-2xl border border-[#d9c7a6]/70 bg-white px-4 py-3 text-sm shadow-[0_20px_55px_rgba(47,37,23,0.18)] dark:border-white/10 dark:bg-[#17120b]"
                    style={{
                        left: `${(hovered.x / width) * 100}%`,
                        top: `${(hovered.y / height) * 100 + 14}%`,
                        transform: 'translate(-50%, 0)',
                    }}
                >
                    <p className="text-[10px] font-black tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                        {hovered.label}
                    </p>
                    <p className="text-xl font-black text-[#21180d] dark:text-white">
                        {hovered.value}
                    </p>
                </div>
            ) : null}

            <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="rounded-2xl border border-[#d9c7a6]/60 bg-white/70 px-3 py-2 text-center dark:border-white/10 dark:bg-white/[0.04]"
                    >
                        <p className="text-xs font-black text-[#21180d] dark:text-white">
                            {row.value}
                        </p>
                        <p className="text-[10px] font-bold tracking-[0.12em] text-[#8a7a63] uppercase dark:text-white/42">
                            {row.label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DonutSummary({ rows }: { rows: BreakdownRow[] }) {
    const total = rows.reduce((sum, row) => sum + numberValue(row.value), 0);
    let cursor = 0;
    const gradientStops = rows
        .map((row, index) => {
            const value = numberValue(row.value);
            const start = cursor;
            const end = total > 0 ? cursor + (value / total) * 100 : cursor;
            cursor = end;

            return `${statusColor(index).solid} ${start}% ${end}%`;
        })
        .filter(Boolean)
        .join(', ');

    return (
        <div className="grid gap-5 lg:grid-cols-[13rem_1fr] lg:items-center">
            <div
                className="relative mx-auto grid h-48 w-48 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(217,199,166,0.7),0_24px_55px_rgba(47,37,23,0.12)]"
                style={{
                    background:
                        total > 0
                            ? `conic-gradient(${gradientStops})`
                            : 'conic-gradient(#efe4cf 0% 100%)',
                }}
            >
                <div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center shadow-inner dark:bg-[#17120b]">
                    <div>
                        <p className="text-4xl font-semibold tracking-[-0.07em] text-[#21180d] dark:text-white">
                            {total}
                        </p>
                        <p className="text-[10px] font-black tracking-[0.22em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Total
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {rows.map((row, index) => {
                    const value = numberValue(row.value);
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    const color = statusColor(index);

                    return (
                        <div
                            key={row.label}
                            className="rounded-2xl border px-3 py-2"
                            style={{
                                borderColor: color.soft,
                                backgroundColor: color.soft,
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-2 text-xs font-black text-[#21180d] dark:text-white">
                                    <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: color.solid }}
                                    />
                                    <span className="truncate">{row.label}</span>
                                </span>
                                <span
                                    className="text-xs font-black tabular-nums"
                                    style={{ color: color.text }}
                                >
                                    {value}
                                </span>
                            </div>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e604c] dark:text-white/50">
                                {percentage}% of total
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function AdminCommandCenter({
    workspaceStats = {},
    adminCommandCenter = {},
}: AdminCommandCenterProps) {
    const headlineMetrics = useMemo<CommandMetric[]>(() => {
        if (adminCommandCenter.headlineMetrics?.length) {
            return adminCommandCenter.headlineMetrics;
        }

        return [
            {
                label: 'Total Bookings',
                value: numberValue(workspaceStats.total_bookings),
                helper: 'All tracked reservation records.',
                href: '/admin/bookings',
                tone: 'neutral',
            },
            {
                label: 'Pending Review',
                value: numberValue(workspaceStats.pending),
                helper: 'Pencil-booked or review-stage reservations.',
                href: '/admin/bookings?status=pending',
                tone: 'warn',
            },
            {
                label: 'Payment Queue',
                value: numberValue(workspaceStats.payments_pending),
                helper: 'Proofs and balances needing review.',
                href: '/admin/payments/review',
                tone: 'info',
            },
            {
                label: 'Today Active',
                value: numberValue(workspaceStats.today_bookings),
                helper: 'Bookings scheduled for today.',
                href: '/admin/calendar',
                tone: 'good',
            },
        ];
    }, [adminCommandCenter.headlineMetrics, workspaceStats]);

    const bookingStatus = adminCommandCenter.bookingStatus ?? [
        { label: 'Pending', value: numberValue(workspaceStats.pending) },
        { label: 'Confirmed', value: numberValue(workspaceStats.confirmed) },
        { label: 'Active', value: numberValue(workspaceStats.active) },
        { label: 'Completed', value: numberValue(workspaceStats.completed) },
        { label: 'Declined', value: numberValue(workspaceStats.declined) },
    ];
    const bookingStatusMax = maxOf(bookingStatus);
    const packageUsage = adminCommandCenter.packageUsage ?? [];
    const packageMax = maxOf(packageUsage);
    const scheduleMix = adminCommandCenter.scheduleMix ?? [];
    const paymentSummary = adminCommandCenter.paymentSummary ?? {};
    const websiteSummary = adminCommandCenter.websiteSummary ?? {};
    const usersSummary = adminCommandCenter.usersSummary ?? {};
    const recentUsers = adminCommandCenter.recentUsers ?? [];
    const systemHealth = adminCommandCenter.systemHealth ?? [];
    const recentActivity = adminCommandCenter.recentActivity ?? [];
    const [activityPage, setActivityPage] = useState(1);
    const activityPageSize = 5;
    const activityTotalPages = Math.max(
        1,
        Math.ceil(recentActivity.length / activityPageSize),
    );
    const safeActivityPage = Math.min(activityPage, activityTotalPages);
    const pagedActivity = recentActivity.slice(
        (safeActivityPage - 1) * activityPageSize,
        safeActivityPage * activityPageSize,
    );

    const printDashboard = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const exportJson = () => {
        downloadTextFile(
            `bccc-admin-dashboard-${new Date().toISOString().slice(0, 10)}.json`,
            JSON.stringify({ workspaceStats, adminCommandCenter }, null, 2),
            'application/json;charset=utf-8',
        );
    };

    const exportCsv = () => {
        downloadTextFile(
            `bccc-admin-dashboard-${new Date().toISOString().slice(0, 10)}.csv`,
            dashboardCsv(adminCommandCenter, workspaceStats),
            'text/csv;charset=utf-8',
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="bccc-admin-command-center space-y-5">
                <section className="bccc-admin-command-hero relative overflow-hidden rounded-[1.85rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/92 p-5 shadow-[0_28px_90px_rgba(47,37,23,0.12)] backdrop-blur-2xl lg:p-6 dark:border-white/10 dark:bg-white/[0.055]">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute top-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-[#d8b56d]/22 blur-3xl dark:bg-[#d8b56d]/10" />
                        <div className="absolute bottom-[-10rem] left-[-9rem] h-72 w-72 rounded-full bg-[#2f2517]/8 blur-3xl dark:bg-white/5" />
                    </div>

                    <div className="bccc-admin-command-hero-grid relative grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white/72 px-3 py-1.5 text-[10px] font-black tracking-[0.24em] text-[#9d7b3d] uppercase dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Executive Control Center
                            </div>

                            <h1 className="mt-4 max-w-5xl text-4xl font-semibold tracking-[-0.075em] text-[#21180d] lg:text-6xl dark:text-white">
                                Admin Dashboard
                            </h1>

                            <p className="mt-4 max-w-4xl text-sm leading-7 text-[#6e604c] dark:text-white/60">
                                Monitor reservations, payment deadlines, MICE
                                reporting, website activity, public inquiries,
                                venue setup, and staff actions from one
                                operational command center.
                            </p>
                        </div>

                        <div className="bccc-admin-command-actions flex flex-wrap gap-2 xl:justify-end">
                            <button
                                type="button"
                                onClick={printDashboard}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white/76 px-4 text-xs font-black tracking-[0.16em] text-[#2f2517] uppercase transition hover:-translate-y-0.5 hover:bg-[#fffaf0] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                            >
                                <Printer className="h-4 w-4" />
                                Print
                            </button>
                            <button
                                type="button"
                                onClick={exportCsv}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white/76 px-4 text-xs font-black tracking-[0.16em] text-[#2f2517] uppercase transition hover:-translate-y-0.5 hover:bg-[#fffaf0] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                            >
                                <Download className="h-4 w-4" />
                                CSV
                            </button>
                            <button
                                type="button"
                                onClick={exportJson}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white/76 px-4 text-xs font-black tracking-[0.16em] text-[#2f2517] uppercase transition hover:-translate-y-0.5 hover:bg-[#fffaf0] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                            >
                                <Download className="h-4 w-4" />
                                JSON
                            </button>
                            <ResourceActionLink
                                href="/admin/content"
                                variant="secondary"
                            >
                                Manage Content
                            </ResourceActionLink>
                            <ResourceActionLink href="/admin/bookings/create">
                                New Booking
                            </ResourceActionLink>
                        </div>
                    </div>
                </section>

                <div className="bccc-admin-command-metrics-grid backend-bento-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {headlineMetrics.map((metric, index) => (
                        <CommandMetricCard
                            key={`${metric.label}-${index}`}
                            metric={metric}
                            index={index}
                        />
                    ))}
                </div>

                <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    <Panel
                        title="Booking Operations"
                        eyebrow="Reservations"
                        icon={ClipboardList}
                        actions={
                            <Link
                                href="/admin/bookings"
                                className="text-xs font-black tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]"
                            >
                                Open records
                            </Link>
                        }
                    >
                        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                            <DonutSummary rows={bookingStatus} />
                            <div className="space-y-4">
                                <h3 className="text-sm font-black tracking-[0.22em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                                    Status pressure
                                </h3>
                                {bookingStatus.map((row, index) => (
                                    <ProgressRow
                                        key={row.label}
                                        row={row}
                                        max={bookingStatusMax}
                                        colorIndex={index}
                                    />
                                ))}
                            </div>
                        </div>
                    </Panel>

                    <Panel
                        title="Payment Compliance"
                        eyebrow="Finance Review"
                        icon={CircleDollarSign}
                        actions={
                            <Link
                                href="/admin/payments/review"
                                className="text-xs font-black tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]"
                            >
                                Review payments
                            </Link>
                        }
                    >
                        <div className="backend-bento-grid backend-bento-grid-compact grid gap-3 sm:grid-cols-2">
                            <MiniMetric
                                label="Pending Review"
                                value={paymentSummary.pending_review ?? 0}
                                icon={CreditCard}
                                tone="warn"
                            />
                            <MiniMetric
                                label="Approved Amount"
                                value={money(paymentSummary.approved_amount)}
                                icon={CheckCircle2}
                                tone="good"
                            />
                            <MiniMetric
                                label="Submitted Amount"
                                value={money(paymentSummary.submitted_amount)}
                                icon={ReceiptText}
                                tone="info"
                            />
                            <MiniMetric
                                label="Overdue Bookings"
                                value={paymentSummary.overdue_bookings ?? 0}
                                icon={AlertTriangle}
                                tone="danger"
                            />
                        </div>

                        <div className="mt-5 rounded-[1.25rem] border border-[#d9c7a6]/60 bg-[#fffaf0]/70 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                            <ProgressRow
                                row={{
                                    label: 'Due soon reservations',
                                    value: numberValue(
                                        paymentSummary.due_soon_bookings,
                                    ),
                                    helper: 'Payment deadline close to expiration.',
                                }}
                                max={Math.max(
                                    1,
                                    numberValue(
                                        paymentSummary.due_soon_bookings,
                                    ) +
                                        numberValue(
                                            paymentSummary.overdue_bookings,
                                        ),
                                )}
                            />
                        </div>
                    </Panel>
                </section>

                <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                    <Panel
                        title="Booking Trend"
                        eyebrow="Monthly Activity"
                        icon={LineChart}
                    >
                        <TrendBars
                            rows={adminCommandCenter.bookingTrend ?? []}
                        />
                    </Panel>

                    <Panel
                        title="Package and Schedule Mix"
                        eyebrow="Catalog Usage"
                        icon={PieChart}
                    >
                        <div className="backend-bento-grid grid gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black tracking-[0.22em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                                    Top Packages
                                </h3>
                                {packageUsage.length ? (
                                    packageUsage.map((row) => (
                                        <ProgressRow
                                            key={row.label}
                                            row={row}
                                            max={packageMax}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-[#6e604c] dark:text-white/55">
                                        No package usage yet.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-black tracking-[0.22em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                                    Schedule Blocks
                                </h3>
                                {scheduleMix.length ? (
                                    scheduleMix.map((row) => (
                                        <ProgressRow
                                            key={row.label}
                                            row={row}
                                            max={maxOf(scheduleMix)}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-[#6e604c] dark:text-white/55">
                                        Schedule segment data will appear after
                                        new bookings are saved.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Panel>
                </section>

                <section className="backend-bento-grid grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
                    <Panel
                        title="MICE Reporting"
                        eyebrow="Registry"
                        icon={FileBarChart}
                        actions={
                            <Link
                                href="/admin/reports/mice-registry"
                                className="text-xs font-black tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]"
                            >
                                Open registry
                            </Link>
                        }
                    >
                        <div className="space-y-3">
                            {(adminCommandCenter.miceSummary ?? []).map(
                                (metric) => (
                                    <MiniMetric
                                        key={metric.label}
                                        label={metric.label}
                                        value={metric.value}
                                        icon={FileBarChart}
                                        tone={metric.tone ?? 'neutral'}
                                    />
                                ),
                            )}
                        </div>
                    </Panel>

                    <Panel
                        title="Website Monitoring"
                        eyebrow="Public Site"
                        icon={Globe2}
                        actions={
                            <Link
                                href="/admin/content"
                                className="text-xs font-black tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]"
                            >
                                Content
                            </Link>
                        }
                    >
                        <div className="backend-bento-grid backend-bento-grid-compact grid gap-3">
                            <MiniMetric
                                label="Visits Today"
                                value={websiteSummary.visits_today ?? 0}
                                icon={TrendingUp}
                                tone="info"
                            />
                            <MiniMetric
                                label="Visits This Month"
                                value={websiteSummary.visits_month ?? 0}
                                icon={Globe2}
                                tone="neutral"
                            />
                            <MiniMetric
                                label="Unique Visitors"
                                value={
                                    websiteSummary.unique_visitors_month ?? 0
                                }
                                icon={UsersRound}
                                tone="good"
                            />
                            <MiniMetric
                                label="Open Inquiries"
                                value={websiteSummary.inquiries_open ?? 0}
                                icon={Inbox}
                                tone="warn"
                            />
                        </div>
                        {websiteSummary.conversion_hint ? (
                            <p className="mt-4 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                                {websiteSummary.conversion_hint}
                            </p>
                        ) : null}
                    </Panel>

                    <Panel
                        title="Account Monitoring"
                        eyebrow="Users"
                        icon={UsersRound}
                        actions={
                            <Link
                                href="/admin/users"
                                className="text-xs font-black tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]"
                            >
                                Open users
                            </Link>
                        }
                    >
                        <div className="backend-bento-grid backend-bento-grid-compact grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <MiniMetric
                                label="Total Accounts"
                                value={usersSummary.total ?? 0}
                                icon={UsersRound}
                                tone="neutral"
                            />
                            <MiniMetric
                                label="Verified"
                                value={usersSummary.verified ?? 0}
                                icon={CheckCircle2}
                                tone="good"
                            />
                            <MiniMetric
                                label="Unverified"
                                value={usersSummary.unverified ?? 0}
                                icon={AlertTriangle}
                                tone="warn"
                            />
                            <MiniMetric
                                label="New Today"
                                value={usersSummary.new_today ?? 0}
                                icon={Sparkles}
                                tone="info"
                            />
                        </div>

                        {recentUsers.length ? (
                            <div className="mt-4 space-y-2">
                                {recentUsers.slice(0, 3).map((user) => (
                                    <Link
                                        key={user.id ?? user.email ?? user.name}
                                        href={
                                            user.id
                                                ? `/admin/users/${user.id}/edit`
                                                : '/admin/users'
                                        }
                                        className="block rounded-[1rem] border border-[#d9c7a6]/60 bg-[#fffaf0]/70 p-3 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.07]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-[#21180d] dark:text-white">
                                                    {user.name ||
                                                        'Unnamed user'}
                                                </p>
                                                <p className="truncate text-xs text-[#7a6b55] dark:text-white/45">
                                                    {user.email || 'No email'} ·{' '}
                                                    {cleanLabel(user.role)}
                                                </p>
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-1 text-[10px] font-black tracking-[0.13em] uppercase ${user.email_verified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200'}`}
                                            >
                                                {user.email_verified
                                                    ? 'Verified'
                                                    : 'New'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-[#8a7a63] dark:text-white/42">
                                            {user.bookings_count ?? 0}{' '}
                                            booking(s) ·{' '}
                                            {user.pending_bookings_count ?? 0}{' '}
                                            pending
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        ) : null}
                    </Panel>

                    <Panel
                        title="System Health"
                        eyebrow="Readiness"
                        icon={Gauge}
                    >
                        <div className="space-y-3">
                            {systemHealth.map((item) => (
                                <div
                                    key={item.label}
                                    className={`rounded-[1.15rem] border p-4 ${toneClass(item.state)}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black tracking-[0.22em] uppercase opacity-70">
                                                {item.label}
                                            </p>
                                            <p className="mt-1 text-2xl font-semibold tracking-[-0.05em]">
                                                {item.value}
                                            </p>
                                        </div>
                                        {item.state === 'good' ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            <Sparkles className="h-5 w-5" />
                                        )}
                                    </div>
                                    {item.helper ? (
                                        <p className="mt-2 text-sm leading-6 opacity-75">
                                            {item.helper}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </Panel>
                </section>

                <Panel
                    title="Recent System Activity"
                    eyebrow="Admin Monitoring"
                    icon={Activity}
                    actions={
                        <Link
                            href="/notifications"
                            className="text-xs font-black tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]"
                        >
                            Notification center
                        </Link>
                    }
                >
                    {recentActivity.length ? (
                        <>
                            <div className="divide-y divide-[#d9c7a6]/60 overflow-hidden rounded-[1.25rem] border border-[#d9c7a6]/60 bg-[#fffaf0]/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.035]">
                                {pagedActivity.map((item) => {
                                    const row = (
                                        <div className="grid gap-3 p-4 transition hover:bg-white/70 lg:grid-cols-[1fr_auto] lg:items-center dark:hover:bg-white/[0.045]">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black tracking-[0.16em] uppercase ${toneClass(item.severity === 'critical' ? 'danger' : item.severity === 'warning' ? 'warn' : 'info')}`}
                                                    >
                                                        {cleanLabel(
                                                            item.type ||
                                                                item.severity ||
                                                                'activity',
                                                        )}
                                                    </span>
                                                    {item.actor ? (
                                                        <span className="text-xs font-semibold text-[#6e604c] dark:text-white/50">
                                                            by {item.actor}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-2 font-semibold text-[#21180d] dark:text-white">
                                                    {item.title}
                                                </p>
                                                {item.message ? (
                                                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6e604c] dark:text-white/55">
                                                        {item.message}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <p className="text-xs font-semibold text-[#8a7a63] dark:text-white/40">
                                                {formatDateTime(
                                                    item.created_at,
                                                )}
                                            </p>
                                        </div>
                                    );

                                    return item.link ? (
                                        <Link
                                            key={item.id}
                                            href={item.link}
                                            className="block"
                                        >
                                            {row}
                                        </Link>
                                    ) : (
                                        <div key={item.id}>{row}</div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 flex flex-col gap-3 rounded-[1.1rem] border border-[#d9c7a6]/60 bg-[#fffaf0]/60 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.035]">
                                <p className="text-xs font-semibold tracking-[0.16em] text-[#8a7a63] uppercase dark:text-white/45">
                                    Showing {pagedActivity.length} of{' '}
                                    {recentActivity.length} activity item(s) ·
                                    Page {safeActivityPage} of{' '}
                                    {activityTotalPages}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={safeActivityPage <= 1}
                                        onClick={() =>
                                            setActivityPage((page) =>
                                                Math.max(1, page - 1),
                                            )
                                        }
                                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[#d9c7a6]/70 bg-white px-3 text-xs font-black tracking-[0.14em] text-[#2f2517] uppercase transition hover:bg-[#f7f0e3] disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Prev
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            safeActivityPage >=
                                            activityTotalPages
                                        }
                                        onClick={() =>
                                            setActivityPage((page) =>
                                                Math.min(
                                                    activityTotalPages,
                                                    page + 1,
                                                ),
                                            )
                                        }
                                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[#d9c7a6]/70 bg-white px-3 text-xs font-black tracking-[0.14em] text-[#2f2517] uppercase transition hover:bg-[#f7f0e3] disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-[1.35rem] border border-dashed border-[#d9c7a6]/80 bg-[#fffaf0]/58 p-8 text-center dark:border-white/10 dark:bg-white/[0.035]">
                            <Activity className="mx-auto h-9 w-9 text-[#9d7b3d] dark:text-[#f1d89b]" />
                            <p className="mt-3 text-lg font-semibold tracking-[-0.035em] text-[#21180d] dark:text-white">
                                No activity yet
                            </p>
                            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[#6e604c] dark:text-white/55">
                                Monitoring events will appear after staff,
                                manager, booking, payment, content, and system
                                actions are recorded.
                            </p>
                        </div>
                    )}
                </Panel>
            </div>
        </AppLayout>
    );
}

function MiniMetric({
    label,
    value,
    icon: Icon,
    tone = 'neutral',
}: {
    label: string;
    value: string | number;
    icon: typeof LayoutDashboard;
    tone?: CommandMetric['tone'];
}) {
    return (
        <div className={`rounded-[1.2rem] border p-4 ${toneClass(tone)}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black tracking-[0.22em] uppercase opacity-70">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.055em]">
                        {value}
                    </p>
                </div>
                <Icon className="h-5 w-5 shrink-0" />
            </div>
        </div>
    );
}
