import { RoleActionCard } from '@/components/role/role-action-card';
import { RoleKpiCard } from '@/components/role/role-kpi-card';
import { RoleWorkspaceShell } from '@/components/role/role-workspace-shell';
import {
    backendBookingCreateHref,
    backendBookingsHref,
    backendCalendarHref,
    backendHomeHref,
    backendMiceRegistryHref,
    backendPaymentReviewHref,
} from '@/lib/backend-navigation';
import type { RoleKey } from '@/lib/role-workspaces';
import type { BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    CreditCard,
    FileBarChart,
    Inbox,
    LayoutDashboard,
    Plus,
    ShieldCheck,
    Users,
} from 'lucide-react';

type WorkspaceStats = {
    pending?: number;
    confirmed?: number;
    active?: number;
    completed?: number;
    cancelled?: number;
    declined?: number;
    total_bookings?: number;
    today_bookings?: number;
    month_bookings?: number;
    month_blocks?: number;
    month_public_events?: number;
    payments_pending?: number;
    payments_verified?: number;
    inquiries_pending?: number;
};

type RecentBooking = {
    id: number | string;
    client_name?: string;
    company_name?: string;
    type_of_event?: string;
    booking_status?: string;
    payment_status?: string;
    booking_date_from?: string;
    booking_date_to?: string;
};

type TodayScheduleItem = {
    id: number | string;
    title: string;
    status: string;
    time: string;
    venue?: string | null;
};

type WorkspaceSummary = {
    eyebrow?: string;
    title?: string;
    description?: string;
};

type RoleDashboardTemplateProps = {
    role: RoleKey;
    workspaceStats?: WorkspaceStats;
    recentBookings?: RecentBooking[];
    todaySchedule?: TodayScheduleItem[];
    workspaceSummary?: WorkspaceSummary;
};

type ActionItem = {
    title: string;
    description: string;
    href: string;
    icon: typeof LayoutDashboard;
    cta?: string;
};

const roleBreadcrumbs: Record<RoleKey, BreadcrumbItem[]> = {
    admin: [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Dashboard', href: '/admin/dashboard' },
    ],
    manager: [
        { title: 'Manager', href: '/manager/dashboard' },
        { title: 'Dashboard', href: '/manager/dashboard' },
    ],
    staff: [
        { title: 'Staff', href: '/staff/dashboard' },
        { title: 'Dashboard', href: '/staff/dashboard' },
    ],
    user: [
        { title: 'Account', href: '/my-dashboard' },
        { title: 'Dashboard', href: '/my-dashboard' },
    ],
};

const roleTitles: Record<RoleKey, Required<WorkspaceSummary>> = {
    admin: {
        eyebrow: 'Executive Workspace',
        title: 'Administrator Dashboard',
        description:
            'A command workspace for public content, booking operations, payments, reports, calendar monitoring, and system configuration.',
    },
    manager: {
        eyebrow: 'Management Workspace',
        title: 'Manager Dashboard',
        description:
            'A focused review workspace for bookings, calendars, reports, payments, inquiries, and operational decisions.',
    },
    staff: {
        eyebrow: 'Operations Workspace',
        title: 'Staff Dashboard',
        description:
            'A daily work area for assisted booking, schedule checking, client support, and inquiry follow-ups.',
    },
    user: {
        eyebrow: 'Client Portal',
        title: 'My Booking Dashboard',
        description:
            'A simple client workspace for creating event requests, tracking bookings, reviewing payment status, and returning to the public site.',
    },
};

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function statusLabel(status?: string | null) {
    return String(status || 'pending')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status?: string | null) {
    const normalized = String(status || '').toLowerCase();

    if (
        [
            'confirmed',
            'approved',
            'active',
            'completed',
            'paid',
            'verified',
        ].includes(normalized)
    ) {
        return 'border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200';
    }

    if (
        [
            'pending',
            'pencil_booked',
            'for_review',
            'partial',
            'partially_paid',
            'submitted',
        ].includes(normalized)
    ) {
        return 'border-amber-300/40 bg-amber-400/10 text-amber-700 dark:text-amber-200';
    }

    if (
        ['cancelled', 'declined', 'failed', 'rejected', 'expired'].includes(
            normalized,
        )
    ) {
        return 'border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-200';
    }

    return 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)]';
}

function formatDate(value?: string | null) {
    if (!value) {
        return 'No date';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function bookingHref(role: RoleKey, id: number | string) {
    if (role === 'admin') return `/admin/bookings/${id}`;
    if (role === 'manager') return `/manager/bookings/${id}`;
    if (role === 'staff') return `/staff/bookings/${id}`;

    return `/my-bookings/${id}`;
}

function getPrimaryActions(role: RoleKey): ActionItem[] {
    if (role === 'admin') {
        return [
            {
                title: 'Public Website Content',
                description:
                    'Manage homepage sections, events, facilities, tourism office, contact details, and guidelines.',
                href: '/admin/content',
                icon: Building2,
                cta: 'Manage Content',
            },
            {
                title: 'Booking Calendar',
                description:
                    'View venue availability, bookings, public events, and calendar blocks.',
                href: backendCalendarHref(role),
                icon: CalendarDays,
                cta: 'Open Calendar',
            },
            {
                title: 'Payment Review',
                description:
                    'Review payment compliance, proof uploads, and remaining balances.',
                href: backendPaymentReviewHref(role),
                icon: CreditCard,
                cta: 'Review Payments',
            },
            {
                title: 'Users and Roles',
                description:
                    'Manage administrators, managers, staff, clients, and access permissions.',
                href: '/admin/users',
                icon: Users,
                cta: 'Manage Users',
            },
        ];
    }

    if (role === 'manager') {
        return [
            {
                title: 'Review Bookings',
                description:
                    'Open reservations that need management review, updates, or approval decisions.',
                href: backendBookingsHref(role),
                icon: ClipboardList,
                cta: 'Review Queue',
            },
            {
                title: 'Calendar Monitoring',
                description:
                    'Review venue schedules, blocked dates, reservation conflicts, and public activity.',
                href: backendCalendarHref(role),
                icon: CalendarDays,
                cta: 'Open Calendar',
            },
            {
                title: 'Payment Review',
                description:
                    'Check payment proof, compliance status, and reservation readiness.',
                href: backendPaymentReviewHref(role),
                icon: CreditCard,
                cta: 'Check Payments',
            },
            {
                title: 'MICE Registry',
                description:
                    'Review reporting records and registry data for internal reports.',
                href: backendMiceRegistryHref(role),
                icon: FileBarChart,
                cta: 'Open Registry',
            },
        ];
    }

    if (role === 'staff') {
        return [
            {
                title: 'Today’s Calendar',
                description:
                    'Open the daily operations calendar and check venue use for today.',
                href: backendCalendarHref(role),
                icon: CalendarDays,
                cta: 'Open Schedule',
            },
            {
                title: 'Assist Booking',
                description:
                    'Create a booking request for walk-in, phone, or office-assisted clients.',
                href: backendBookingCreateHref(role),
                icon: Plus,
                cta: 'Create Booking',
            },
            {
                title: 'Booking Records',
                description:
                    'Search, review, and update active booking records.',
                href: backendBookingsHref(role),
                icon: ClipboardList,
                cta: 'Open Records',
            },
            {
                title: 'Inquiries',
                description:
                    'Review public inquiries and support client follow-ups.',
                href: '/staff/inquiries',
                icon: Inbox,
                cta: 'Open Inquiries',
            },
        ];
    }

    return [
        {
            title: 'Book Event',
            description:
                'Start a new event reservation request for BCCC review.',
            href: '/book',
            icon: CalendarDays,
            cta: 'Start Booking',
        },
        {
            title: 'My Calendar',
            description:
                'Open a clean month view of your own booking requests and schedule references.',
            href: '/my-calendar',
            icon: CalendarDays,
            cta: 'Open Calendar',
        },
        {
            title: 'My Bookings',
            description:
                'View submitted booking requests, payment proof, and status progress.',
            href: '/my-bookings',
            icon: ClipboardList,
            cta: 'Track Bookings',
        },
        {
            title: 'Public Website',
            description: 'Return to the public BCCC website.',
            href: '/',
            icon: Building2,
            cta: 'Visit Site',
        },
    ];
}

function DashboardProgressBar({
    label,
    value,
    total,
}: {
    label: string;
    value: number;
    total: number;
}) {
    const percent =
        total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-[var(--bccc-backend-muted)]">
                    {label}
                </span>
                <span className="font-black text-[var(--bccc-backend-text)]">
                    {value}
                </span>
            </div>

            <div className="h-2 overflow-hidden bg-[var(--bccc-backend-panel-muted)]">
                <div
                    className="h-full bg-[var(--bccc-backend-gold)] transition-all duration-700"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

export function RoleDashboardTemplate({
    role,
    workspaceStats = {},
    recentBookings = [],
    todaySchedule = [],
    workspaceSummary = {},
}: RoleDashboardTemplateProps) {
    const summary = {
        ...roleTitles[role],
        ...workspaceSummary,
    };

    const pending = numberValue(workspaceStats.pending);
    const confirmed = numberValue(workspaceStats.confirmed);
    const active = numberValue(workspaceStats.active);
    const completed = numberValue(workspaceStats.completed);
    const cancelled = numberValue(workspaceStats.cancelled);
    const declined = numberValue(workspaceStats.declined);
    const monthBookings = numberValue(workspaceStats.month_bookings);
    const todayBookings = numberValue(workspaceStats.today_bookings);
    const monthBlocks = numberValue(workspaceStats.month_blocks);
    const monthPublicEvents = numberValue(workspaceStats.month_public_events);
    const totalBookings = numberValue(workspaceStats.total_bookings);
    const paymentsPending = numberValue(workspaceStats.payments_pending);
    const paymentsVerified = numberValue(workspaceStats.payments_verified);
    const inquiriesPending = numberValue(workspaceStats.inquiries_pending);

    const totalForProgress = Math.max(
        pending + confirmed + active + completed + cancelled + declined,
        totalBookings,
        recentBookings.length,
        1,
    );

    const primaryActions = getPrimaryActions(role);

    const kpis =
        role === 'user'
            ? [
                  {
                      title: 'My Bookings',
                      value: totalBookings || recentBookings.length,
                      description:
                          'Submitted booking requests in your account.',
                      icon: ClipboardList,
                  },
                  {
                      title: 'Pending Review',
                      value: pending,
                      description:
                          'Requests currently waiting for BCCC review.',
                      icon: Clock3,
                  },
                  {
                      title: 'Confirmed',
                      value: confirmed,
                      description: 'Approved or confirmed reservations.',
                      icon: CheckCircle2,
                  },
                  {
                      title: 'Completed',
                      value: completed,
                      description: 'Finished booking records.',
                      icon: CalendarDays,
                  },
              ]
            : [
                  {
                      title: 'Pending',
                      value: pending,
                      description: 'Reservations requiring review or action.',
                      icon: Clock3,
                  },
                  {
                      title: 'Confirmed',
                      value: confirmed,
                      description: 'Approved reservations in the system.',
                      icon: CheckCircle2,
                  },
                  {
                      title: 'Active Today',
                      value: todayBookings || active,
                      description: 'Bookings active or scheduled for today.',
                      icon: CalendarDays,
                  },
                  {
                      title: 'This Month',
                      value: monthBookings || totalBookings,
                      description:
                          'Booking activity counted for the current month.',
                      icon: BarChart3,
                  },
              ];

    return (
        <RoleWorkspaceShell
            role={role}
            title={summary.title}
            eyebrow={summary.eyebrow}
            description={summary.description}
            breadcrumbs={roleBreadcrumbs[role]}
            actions={
                <>
                    <Link
                        href={backendHomeHref(role)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black tracking-[0.2em] text-[var(--bccc-backend-text)] uppercase transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                    >
                        <LayoutDashboard className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
                        Role Home
                    </Link>

                    <Link
                        href={
                            role === 'user'
                                ? '/book'
                                : backendCalendarHref(role)
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-green-800)] px-4 text-[11px] font-black tracking-[0.2em] text-white uppercase transition hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)]"
                    >
                        {role === 'user' ? (
                            <Plus className="h-4 w-4" />
                        ) : (
                            <CalendarDays className="h-4 w-4" />
                        )}
                        {role === 'user' ? 'Book Event' : 'Calendar'}
                    </Link>
                </>
            }
        >
            <div className="role-dashboard-kpi-grid backend-bento-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((card, index) => (
                    <RoleKpiCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        description={card.description}
                        icon={card.icon}
                        tone={role}
                        index={index}
                    />
                ))}
            </div>

            <section className="role-dashboard-main-grid mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                    <section className="relative overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-5 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl sm:p-6">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-black tracking-[0.28em] text-[var(--bccc-backend-gold)] uppercase">
                                    Primary Actions
                                </p>

                                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--bccc-backend-text)]">
                                    Open your main work areas.
                                </h2>

                                <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--bccc-backend-muted)]">
                                    These shortcuts match your role and keep the
                                    backend workflow focused.
                                </p>
                            </div>
                        </div>

                        <div className="role-action-grid backend-bento-grid grid gap-4 md:grid-cols-2">
                            {primaryActions.map((action, index) => (
                                <RoleActionCard
                                    key={action.href}
                                    title={action.title}
                                    description={action.description}
                                    href={action.href}
                                    icon={action.icon}
                                    cta={action.cta}
                                    tone={role}
                                    index={index}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="relative overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
                        <div className="flex flex-col gap-3 border-b border-[var(--bccc-backend-line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div>
                                <p className="text-[10px] font-black tracking-[0.28em] text-[var(--bccc-backend-gold)] uppercase">
                                    Recent Activity
                                </p>

                                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--bccc-backend-text)]">
                                    Latest booking records.
                                </h2>
                            </div>

                            <Link
                                href={backendBookingsHref(role)}
                                className="inline-flex min-h-10 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[10px] font-black tracking-[0.2em] text-[var(--bccc-backend-text)] uppercase transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                            >
                                View all
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {recentBookings.length > 0 ? (
                            <div className="divide-y divide-[var(--bccc-backend-line)]">
                                {recentBookings.slice(0, 8).map((booking) => (
                                    <Link
                                        key={booking.id}
                                        href={bookingHref(role, booking.id)}
                                        className="group grid gap-3 p-5 transition duration-500 hover:bg-[var(--bccc-backend-hover)] sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-base font-semibold tracking-[-0.025em] text-[var(--bccc-backend-text)]">
                                                {booking.type_of_event ||
                                                    'Event Booking'}
                                            </p>

                                            <p className="mt-1 truncate text-sm text-[var(--bccc-backend-muted)]">
                                                {booking.company_name ||
                                                    booking.client_name ||
                                                    'Client'}
                                            </p>

                                            <p className="mt-2 text-xs font-semibold tracking-[0.14em] text-[var(--bccc-backend-muted)] uppercase">
                                                {formatDate(
                                                    booking.booking_date_from,
                                                )}
                                                {booking.booking_date_to &&
                                                booking.booking_date_to !==
                                                    booking.booking_date_from
                                                    ? ` — ${formatDate(booking.booking_date_to)}`
                                                    : ''}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2 sm:justify-end">
                                            <span
                                                className={`inline-flex items-center border px-3 py-1.5 text-[10px] font-black tracking-[0.18em] uppercase ${statusClass(booking.booking_status)}`}
                                            >
                                                {statusLabel(
                                                    booking.booking_status,
                                                )}
                                            </span>

                                            {booking.payment_status ? (
                                                <span
                                                    className={`inline-flex items-center border px-3 py-1.5 text-[10px] font-black tracking-[0.18em] uppercase ${statusClass(booking.payment_status)}`}
                                                >
                                                    {statusLabel(
                                                        booking.payment_status,
                                                    )}
                                                </span>
                                            ) : null}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <ClipboardList className="mx-auto h-10 w-10 text-[var(--bccc-backend-gold)]" />
                                <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--bccc-backend-text)]">
                                    No recent booking records
                                </h3>
                                <p className="mt-2 text-sm leading-7 text-[var(--bccc-backend-muted)]">
                                    New reservations and booking updates will
                                    appear in this section.
                                </p>
                            </div>
                        )}
                    </section>
                </div>

                <aside className="space-y-5">
                    <section className="relative overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-5 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl sm:p-6">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(169,132,67,0.10),transparent_42%)]" />

                        <div className="relative">
                            <p className="text-[10px] font-black tracking-[0.28em] text-[var(--bccc-backend-gold)] uppercase">
                                Workspace Summary
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--bccc-backend-text)]">
                                Monthly overview.
                            </h2>

                            <p className="mt-2 text-sm leading-7 text-[var(--bccc-backend-muted)]">
                                A compact count of booking activity, completed
                                records, payment review, and calendar blocks.
                            </p>

                            <div className="mt-5 space-y-4">
                                <DashboardProgressBar
                                    label="Pending"
                                    value={pending}
                                    total={totalForProgress}
                                />
                                <DashboardProgressBar
                                    label="Confirmed"
                                    value={confirmed}
                                    total={totalForProgress}
                                />
                                <DashboardProgressBar
                                    label="Completed"
                                    value={completed}
                                    total={totalForProgress}
                                />
                                <DashboardProgressBar
                                    label="Cancelled / Declined"
                                    value={cancelled + declined}
                                    total={totalForProgress}
                                />
                            </div>

                            <div className="backend-bento-grid backend-bento-grid-compact mt-6 grid grid-cols-2 gap-3">
                                {[
                                    ['Total Bookings', totalBookings],
                                    ['Active', active],
                                    ['Calendar Blocks', monthBlocks],
                                    ['Public Events', monthPublicEvents],
                                    ['Payments Pending', paymentsPending],
                                    ['Payments Verified', paymentsVerified],
                                    ['Pending Inquiries', inquiriesPending],
                                    ['This Month', monthBookings],
                                ].map(([label, value]) => (
                                    <div
                                        key={String(label)}
                                        className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-4"
                                    >
                                        <p className="text-[10px] font-black tracking-[0.18em] text-[var(--bccc-backend-muted)] uppercase">
                                            {label}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-[var(--bccc-backend-text)]">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="relative overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
                        <div className="border-b border-[var(--bccc-backend-line)] p-5 sm:p-6">
                            <p className="text-[10px] font-black tracking-[0.28em] text-[var(--bccc-backend-gold)] uppercase">
                                Today
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--bccc-backend-text)]">
                                Active schedule.
                            </h2>
                        </div>

                        {todaySchedule.length > 0 ? (
                            <div className="divide-y divide-[var(--bccc-backend-line)]">
                                {todaySchedule.slice(0, 6).map((item) => (
                                    <div key={item.id} className="p-5 sm:p-6">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-[var(--bccc-backend-text)]">
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 text-xs text-[var(--bccc-backend-muted)]">
                                                    {item.time}
                                                    {item.venue
                                                        ? ` • ${item.venue}`
                                                        : ''}
                                                </p>
                                            </div>

                                            <span
                                                className={`shrink-0 border px-2.5 py-1 text-[9px] font-black tracking-[0.16em] uppercase ${statusClass(item.status)}`}
                                            >
                                                {statusLabel(item.status)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <CalendarDays className="mx-auto h-10 w-10 text-[var(--bccc-backend-gold)]" />
                                <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--bccc-backend-text)]">
                                    No active schedule today
                                </h3>
                                <p className="mt-2 text-sm leading-7 text-[var(--bccc-backend-muted)]">
                                    Today’s bookings and venue activities will
                                    appear here.
                                </p>
                            </div>
                        )}
                    </section>

                    <section className="relative overflow-hidden border border-[var(--bccc-backend-line)] bg-[#080906] p-5 text-white shadow-[var(--bccc-backend-shadow-soft)] sm:p-6">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,223,173,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(47,106,85,0.22),transparent_42%)]" />

                        <div className="relative">
                            <div className="flex h-12 w-12 items-center justify-center border border-[#f4dfad]/30 bg-[#f4dfad]/10 text-[#f4dfad]">
                                <ShieldCheck className="h-5 w-5" />
                            </div>

                            <p className="mt-5 text-[10px] font-black tracking-[0.28em] text-[#f4dfad] uppercase">
                                System Note
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                                Keep records aligned.
                            </h2>

                            <div className="mt-4 space-y-3 text-sm leading-7 text-white/64">
                                <p>
                                    Pending bookings should be checked against
                                    the calendar before confirmation.
                                </p>
                                <p>
                                    Payment proof must be validated before
                                    treating a reservation as fully compliant.
                                </p>
                                <p>
                                    Public content changes should be reviewed
                                    before publishing to the public website.
                                </p>
                            </div>
                        </div>
                    </section>
                </aside>
            </section>
        </RoleWorkspaceShell>
    );
}
