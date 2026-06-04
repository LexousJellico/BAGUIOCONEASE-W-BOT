import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    BarChart3,
    Bell,
    CalendarDays,
    Clock3,
    CreditCard,
    FileBarChart,
    Globe2,
    Megaphone,
    Settings,
    ShieldCheck,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { ReactNode, useMemo } from 'react';

type RoleKey = 'admin' | 'manager' | 'staff' | 'user';

type DashboardMetric = {
    label?: string;
    value?: string | number | null;
    helper?: string | null;
    icon?: string | null;
};

type DashboardBooking = {
    id: number | string;
    type_of_event?: string | null;
    company_name?: string | null;
    client_name?: string | null;
    client_email?: string | null;
    booking_status?: string | null;
    payment_status?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
    service_name?: string | null;
    service?: {
        name?: string | null;
    } | null;
    totals?: {
        items_total?: number | string | null;
        remaining_balance?: number | string | null;
        confirmed_payments_total?: number | string | null;
        submitted_payments_total?: number | string | null;
    } | null;
};

type DashboardPayment = {
    id: number | string;
    amount?: number | string | null;
    status?: string | null;
    payment_gateway?: string | null;
    payment_method?: string | null;
    payment_type?: string | null;
    transaction_reference?: string | null;
    created_at?: string | null;
    booking_id?: number | string | null;
    booking?: DashboardBooking | null;
};

type DashboardNotification = {
    id: number | string;
    title?: string | null;
    message?: string | null;
    type?: string | null;
    link?: string | null;
    read_at?: string | null;
    created_at?: string | null;
    is_unread?: boolean | null;
};

type DashboardCalendarItem = {
    id: number | string;
    title?: string | null;
    kind?: string | null;
    status?: string | null;
    area?: string | null;
    start?: string | null;
    end?: string | null;
    date?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
};

type DashboardProps = {
    workspaceRole?: string;
    role?: string;
    dashboard?: {
        metrics?: DashboardMetric[];
        bookings?: DashboardBooking[];
        payments?: DashboardPayment[];
        notifications?: DashboardNotification[];
        calendar?: DashboardCalendarItem[];
        revenue?: Record<string, unknown>;
        stats?: Record<string, unknown>;
    };
    stats?: Record<string, unknown>;
    metrics?: DashboardMetric[];
    bookings?: DashboardBooking[];
    recentBookings?: DashboardBooking[];
    upcomingBookings?: DashboardBooking[];
    pendingBookings?: DashboardBooking[];
    payments?: DashboardPayment[];
    pendingPayments?: DashboardPayment[];
    notificationFeed?:
        | DashboardNotification[]
        | { data?: DashboardNotification[] };
    notifications?:
        | DashboardNotification[]
        | { data?: DashboardNotification[] };
    calendarEvents?: DashboardCalendarItem[];
    upcomingEvents?: DashboardCalendarItem[];
    auth?: {
        user?: {
            name?: string | null;
            email?: string | null;
        } | null;
    };
};

function currentRole(pathname = window.location.pathname): RoleKey {
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/manager')) return 'manager';
    if (pathname.startsWith('/staff')) return 'staff';

    return 'user';
}

function normalizeRole(value?: string | null): RoleKey {
    const raw = String(value || currentRole()).toLowerCase();

    if (raw.includes('admin')) return 'admin';
    if (raw.includes('manager')) return 'manager';
    if (raw.includes('staff')) return 'staff';

    return 'user';
}

function collection<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];

    if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as { data?: unknown[] }).data)
    ) {
        return (value as { data: T[] }).data;
    }

    return [];
}

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown): string {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

function compactDate(value?: string | null): string {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
}

function compactDateTime(value?: string | null): string {
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

function cleanLabel(value?: string | null): string {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value?: string | null) {
    const normalized = String(value || '').toLowerCase();

    if (
        [
            'confirmed',
            'active',
            'completed',
            'paid',
            'verified',
            'approved',
            'read',
        ].includes(normalized)
    ) {
        return 'is-good';
    }

    if (
        [
            'pending',
            'partial',
            'unpaid',
            'submitted',
            'for_review',
            'new',
        ].includes(normalized)
    ) {
        return 'is-warn';
    }

    if (
        ['declined', 'cancelled', 'failed', 'rejected', 'overdue'].includes(
            normalized,
        )
    ) {
        return 'is-bad';
    }

    if (
        [
            'public_event',
            'calendar',
            'payment_status_changed',
            'booking_status_changed',
        ].includes(normalized)
    ) {
        return 'is-public';
    }

    return '';
}

function roleCopy(role: RoleKey) {
    if (role === 'admin') {
        return {
            eyebrow: 'Admin Workspace',
            title: 'BCCC EASE command center.',
            description:
                'Monitor bookings, payments, calendar activity, public content, users, reports, and venue setup from one refined workspace.',
            base: '/admin',
            bookings: '/admin/bookings',
            calendar: '/admin/calendar',
            calendarManage: '/admin/calendar/manage',
            analytics: '/admin/bookings/analytics',
            operations: '/admin/bookings/operations',
            payments: '/admin/payments/review',
            content: '/admin/content',
            users: '/admin/users',
            mice: '/admin/reports/mice-registry',
            settings: '/admin/guidelines-contacts',
        };
    }

    if (role === 'manager') {
        return {
            eyebrow: 'Manager Workspace',
            title: 'Booking, payment, and report review.',
            description:
                'Review reservations, payment compliance, calendar load, analytics, MICE reports, and operational queues without the admin setup clutter.',
            base: '/manager',
            bookings: '/manager/bookings',
            calendar: '/manager/calendar',
            calendarManage: '/manager/calendar/manage',
            analytics: '/manager/bookings/analytics',
            operations: '/manager/bookings/operations',
            payments: '/manager/payments/review',
            content: '/manager/calendar/manage',
            users: '/manager/bookings',
            mice: '/manager/reports/mice-registry',
            settings: '/manager/guidelines-contacts',
        };
    }

    if (role === 'staff') {
        return {
            eyebrow: 'Staff Workspace',
            title: 'Daily booking assistance workspace.',
            description:
                'Assist with booking creation, client requirements, MICE/report details, payment proof, and calendar checking from a focused operational page.',
            base: '/staff',
            bookings: '/staff/bookings',
            calendar: '/staff/calendar',
            calendarManage: '/staff/calendar',
            analytics: '/staff/bookings',
            operations: '/staff/bookings',
            payments: '/staff/bookings',
            content: '/staff/calendar',
            users: '/staff/bookings',
            mice: '/staff/bookings',
            settings: '/staff/calendar',
        };
    }

    return {
        eyebrow: 'My Workspace',
        title: 'Track your BCCC booking request.',
        description:
            'View your reservations, review MICE/report details, upload payment proof, and monitor your booking status in a clean personal dashboard.',
        base: '',
        bookings: '/my-bookings',
        calendar: '/calendar',
        calendarManage: '/calendar',
        analytics: '/my-bookings',
        operations: '/my-bookings',
        payments: '/my-bookings',
        content: '/',
        users: '/profile',
        mice: '/my-bookings',
        settings: '/profile',
    };
}

function iconFor(value?: string | null): LucideIcon {
    const raw = String(value || '').toLowerCase();

    if (raw.includes('booking')) return CalendarDays;
    if (raw.includes('payment')) return CreditCard;
    if (raw.includes('revenue')) return Wallet;
    if (raw.includes('user')) return Users;
    if (raw.includes('calendar')) return CalendarDays;
    if (raw.includes('mice')) return FileBarChart;
    if (raw.includes('content')) return Globe2;
    if (raw.includes('inquiry')) return Megaphone;

    return BarChart3;
}

function bookingTitle(booking: DashboardBooking): string {
    return (
        booking.type_of_event ||
        booking.company_name ||
        booking.client_name ||
        `Booking #${booking.id}`
    );
}

function bookingClient(booking: DashboardBooking): string {
    return booking.company_name || booking.client_name || 'Client not set';
}

function bookingVenue(booking: DashboardBooking): string {
    return booking.service_name || booking.service?.name || 'Venue not set';
}

function bookingTotal(booking: DashboardBooking): number {
    return numberValue(booking.totals?.items_total);
}

function bookingBalance(booking: DashboardBooking): number {
    const explicit = numberValue(booking.totals?.remaining_balance);

    if (explicit > 0) return explicit;

    const total = numberValue(booking.totals?.items_total);
    const confirmed = numberValue(booking.totals?.confirmed_payments_total);

    return Math.max(total - confirmed, 0);
}

function bookingHref(role: RoleKey, booking: DashboardBooking) {
    if (role === 'admin') return `/admin/bookings/${booking.id}`;
    if (role === 'manager') return `/manager/bookings/${booking.id}`;
    if (role === 'staff') return `/staff/bookings/${booking.id}`;

    return `/my-bookings/${booking.id}`;
}

function paymentHref(role: RoleKey, payment: DashboardPayment) {
    const bookingId = payment.booking_id || payment.booking?.id;

    if (!bookingId) {
        return role === 'admin'
            ? '/admin/payments/review'
            : role === 'manager'
              ? '/manager/payments/review'
              : '/my-bookings';
    }

    if (role === 'admin') return `/admin/bookings/${bookingId}`;
    if (role === 'manager') return `/manager/bookings/${bookingId}`;
    if (role === 'staff') return `/staff/bookings/${bookingId}`;

    return `/my-bookings/${bookingId}`;
}

function getStat(
    stats: Record<string, unknown> | undefined,
    keys: string[],
    fallback: string | number | null = 0,
): string | number | null {
    for (const key of keys) {
        if (stats?.[key] !== undefined && stats?.[key] !== null) {
            const value = stats[key];
            return typeof value === 'string' || typeof value === 'number'
                ? value
                : fallback;
        }
    }

    return fallback;
}

function defaultMetrics(
    stats: Record<string, unknown> | undefined,
    bookings: DashboardBooking[],
    payments: DashboardPayment[],
    notifications: DashboardNotification[],
): DashboardMetric[] {
    const pendingBookings =
        getStat(
            stats,
            ['pending_bookings', 'pending', 'bookings_pending'],
            null,
        ) ??
        bookings.filter(
            (booking) =>
                String(booking.booking_status).toLowerCase() === 'pending',
        ).length;

    const confirmedBookings =
        getStat(
            stats,
            ['confirmed_bookings', 'confirmed', 'bookings_confirmed'],
            null,
        ) ??
        bookings.filter((booking) =>
            ['confirmed', 'active', 'completed'].includes(
                String(booking.booking_status).toLowerCase(),
            ),
        ).length;

    const paymentReview =
        getStat(
            stats,
            ['payment_review', 'pending_payments', 'payments_pending'],
            null,
        ) ??
        payments.filter(
            (payment) => String(payment.status).toLowerCase() === 'pending',
        ).length;

    const unread =
        getStat(
            stats,
            ['unread_notifications', 'notifications_unread'],
            null,
        ) ??
        notifications.filter((item) => item.is_unread || !item.read_at).length;

    return [
        {
            label: 'Pending Bookings',
            value: pendingBookings,
            helper: 'Booking requests waiting for action.',
            icon: 'bookings',
        },
        {
            label: 'Confirmed / Active',
            value: confirmedBookings,
            helper: 'Approved reservations in the workspace.',
            icon: 'calendar',
        },
        {
            label: 'Payment Review',
            value: paymentReview,
            helper: 'Payment proof records needing validation.',
            icon: 'payments',
        },
        {
            label: 'Unread Alerts',
            value: unread,
            helper: 'Notifications still marked unread.',
            icon: 'notifications',
        },
    ];
}

function DashboardKpi({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: ReactNode;
    helper: string;
    icon: LucideIcon;
}) {
    return (
        <article className="workspace-kpi-card">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="backend-booking-label">{label}</p>
                    <strong>{value}</strong>
                </div>

                <div className="alh-admin-kpi-icon">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <p>{helper}</p>
        </article>
    );
}

function ActionCard({
    title,
    description,
    href,
    icon: Icon,
    primary = false,
}: {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    primary?: boolean;
}) {
    return (
        <Link
            href={href}
            className={
                primary
                    ? 'workspace-action-card is-primary'
                    : 'workspace-action-card'
            }
        >
            <div className="workspace-action-icon">
                <Icon className="h-5 w-5" />
            </div>

            <span>
                <strong>{title}</strong>
                <small>{description}</small>
            </span>

            <ArrowRight className="h-4 w-4" />
        </Link>
    );
}

function Panel({
    eyebrow,
    title,
    description,
    children,
    action,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <section className="workspace-panel overflow-hidden">
            <div className="workspace-panel-header">
                <div>
                    <p className="backend-booking-label">{eyebrow}</p>
                    <h2>{title}</h2>
                    {description ? <span>{description}</span> : null}
                </div>

                {action}
            </div>

            {children}
        </section>
    );
}

function BookingRow({
    role,
    booking,
}: {
    role: RoleKey;
    booking: DashboardBooking;
}) {
    return (
        <article className="workspace-list-row">
            <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                    <span
                        className={`alh-status-chip ${statusClass(booking.booking_status)}`}
                    >
                        {cleanLabel(booking.booking_status)}
                    </span>
                    <span
                        className={`alh-status-chip ${statusClass(booking.payment_status)}`}
                    >
                        {cleanLabel(booking.payment_status)}
                    </span>
                    <span className="booking-mini-pill">#{booking.id}</span>
                </div>

                <h3>{bookingTitle(booking)}</h3>
                <p>
                    {bookingClient(booking)} · {bookingVenue(booking)} ·{' '}
                    {compactDate(booking.booking_date_from)}
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="alh-admin-mini-box">
                        <span>Total</span>
                        <strong>{money(bookingTotal(booking))}</strong>
                    </div>
                    <div className="alh-admin-mini-box">
                        <span>Balance</span>
                        <strong>{money(bookingBalance(booking))}</strong>
                    </div>
                </div>
            </div>

            <Link
                href={bookingHref(role, booking)}
                className="alh-primary-button"
            >
                Open
                <ArrowRight className="h-4 w-4" />
            </Link>
        </article>
    );
}

function PaymentRow({
    role,
    payment,
}: {
    role: RoleKey;
    payment: DashboardPayment;
}) {
    return (
        <article className="workspace-side-row">
            <div className="flex flex-wrap gap-2">
                <span
                    className={`alh-status-chip ${statusClass(payment.status)}`}
                >
                    {cleanLabel(payment.status)}
                </span>
                <span className="booking-mini-pill">
                    {cleanLabel(
                        payment.payment_gateway || payment.payment_method,
                    )}
                </span>
            </div>

            <h3>
                {payment.booking?.company_name ||
                    payment.booking?.client_name ||
                    'Payment proof'}
            </h3>
            <p>
                {money(payment.amount)} ·{' '}
                {payment.transaction_reference || 'No reference'} ·{' '}
                {compactDateTime(payment.created_at)}
            </p>

            <Link
                href={paymentHref(role, payment)}
                className="alh-secondary-button mt-3 justify-center"
            >
                Review
            </Link>
        </article>
    );
}

function NotificationRow({ item }: { item: DashboardNotification }) {
    const unread = item.is_unread || !item.read_at;

    return (
        <Link
            href={`/notifications/${item.id}/open`}
            className={
                unread
                    ? 'workspace-notification-row is-unread'
                    : 'workspace-notification-row'
            }
        >
            <Bell className="mt-1 h-4 w-4 shrink-0 text-slate-400" />

            <span>
                <strong>{item.title || 'Notification'}</strong>
                <small>
                    {cleanLabel(item.type)} · {compactDateTime(item.created_at)}
                </small>
                {item.message ? <em>{item.message}</em> : null}
            </span>
        </Link>
    );
}

function CalendarRow({ item }: { item: DashboardCalendarItem }) {
    return (
        <article className="workspace-side-row">
            <div className="flex flex-wrap gap-2">
                <span
                    className={`alh-status-chip ${statusClass(item.status || item.kind)}`}
                >
                    {cleanLabel(item.status || item.kind)}
                </span>
                {item.area ? (
                    <span className="booking-mini-pill">{item.area}</span>
                ) : null}
            </div>

            <h3>{item.title || 'Calendar Item'}</h3>
            <p>
                {compactDateTime(
                    item.start || item.booking_date_from || item.date,
                )}{' '}
                to{' '}
                {compactDateTime(item.end || item.booking_date_to || item.date)}
            </p>
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
        <div className="workspace-empty-state">
            <Icon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}

export function WorkspaceDashboardPage() {
    const { props } = usePage<DashboardProps>();
    const role = normalizeRole(props.workspaceRole || props.role);
    const copy = roleCopy(role);

    const stats = useMemo(
        () => props.stats ?? props.dashboard?.stats ?? {},
        [props.stats, props.dashboard?.stats],
    );

    const bookings = useMemo(
        () =>
            collection<DashboardBooking>(
                props.upcomingBookings ||
                    props.pendingBookings ||
                    props.recentBookings ||
                    props.bookings ||
                    props.dashboard?.bookings,
            ),
        [
            props.upcomingBookings,
            props.pendingBookings,
            props.recentBookings,
            props.bookings,
            props.dashboard?.bookings,
        ],
    );

    const payments = useMemo(
        () =>
            collection<DashboardPayment>(
                props.pendingPayments ||
                    props.payments ||
                    props.dashboard?.payments,
            ),
        [props.pendingPayments, props.payments, props.dashboard?.payments],
    );

    const notifications = useMemo(
        () =>
            collection<DashboardNotification>(
                props.notificationFeed ||
                    props.notifications ||
                    props.dashboard?.notifications,
            ),
        [
            props.notificationFeed,
            props.notifications,
            props.dashboard?.notifications,
        ],
    );

    const calendarItems = useMemo(
        () =>
            collection<DashboardCalendarItem>(
                props.upcomingEvents ||
                    props.calendarEvents ||
                    props.dashboard?.calendar,
            ),
        [props.upcomingEvents, props.calendarEvents, props.dashboard?.calendar],
    );

    const metrics = useMemo(() => {
        const explicit = props.metrics || props.dashboard?.metrics;

        if (explicit && explicit.length > 0) return explicit;

        return defaultMetrics(stats, bookings, payments, notifications);
    }, [
        props.metrics,
        props.dashboard?.metrics,
        stats,
        bookings,
        payments,
        notifications,
    ]);

    const actions = [
        {
            title: 'Bookings',
            description: 'Open reservation records.',
            href: copy.bookings,
            icon: CalendarDays,
            primary: true,
        },
        {
            title: 'Calendar',
            description: 'View schedule and blocks.',
            href: copy.calendar,
            icon: Clock3,
        },
        {
            title: 'Operations',
            description: 'Prioritize daily work.',
            href: copy.operations,
            icon: ShieldCheck,
        },
        {
            title: 'Payment Review',
            description: 'Validate proof and balances.',
            href: copy.payments,
            icon: CreditCard,
        },
        {
            title: 'Analytics',
            description: 'Open booking reports.',
            href: copy.analytics,
            icon: TrendingUp,
        },
        {
            title: role === 'user' ? 'Profile' : 'MICE Registry',
            description:
                role === 'user' ? 'Manage your account.' : 'Open MICE records.',
            href: role === 'user' ? copy.users : copy.mice,
            icon: role === 'user' ? Settings : FileBarChart,
        },
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href:
                role === 'admin'
                    ? '/admin/dashboard'
                    : role === 'manager'
                      ? '/manager/dashboard'
                      : role === 'staff'
                        ? '/staff/dashboard'
                        : '/dashboard',
        },
    ];

    function refreshDashboard() {
        router.reload();
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="backend-admin-page space-y-5">
                <section className="workspace-hero">
                    <div>
                        <p className="backend-booking-label">{copy.eyebrow}</p>
                        <h1>{copy.title}</h1>
                        <span>{copy.description}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={refreshDashboard}
                            className="alh-secondary-button"
                        >
                            Refresh
                        </button>

                        <Link
                            href={copy.bookings}
                            className="alh-primary-button"
                        >
                            Open Bookings
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>

                <section className="workspace-kpi-grid backend-bento-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metrics.slice(0, 4).map((metric, index) => {
                        const Icon = iconFor(metric.icon || metric.label);

                        return (
                            <DashboardKpi
                                key={`${metric.label || 'metric'}-${index}`}
                                label={metric.label || 'Metric'}
                                value={metric.value ?? 0}
                                helper={metric.helper || 'Workspace metric.'}
                                icon={Icon}
                            />
                        );
                    })}
                </section>

                <section className="backend-dashboard-main-grid grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <main className="space-y-5">
                        <Panel
                            eyebrow="Quick Actions"
                            title="Common workspace actions"
                            description="Shortcuts are limited to the most important daily actions."
                        >
                            <div className="workspace-actions-grid">
                                {actions.map((action) => (
                                    <ActionCard
                                        key={action.title}
                                        {...action}
                                    />
                                ))}
                            </div>
                        </Panel>

                        <Panel
                            eyebrow="Bookings"
                            title="Recent and upcoming records"
                            description="Only a compact list is shown here. Use the booking page for full filtering."
                            action={
                                <Link
                                    href={copy.bookings}
                                    className="alh-secondary-button"
                                >
                                    View All
                                </Link>
                            }
                        >
                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                {bookings.length > 0 ? (
                                    bookings
                                        .slice(0, 8)
                                        .map((booking) => (
                                            <BookingRow
                                                key={booking.id}
                                                role={role}
                                                booking={booking}
                                            />
                                        ))
                                ) : (
                                    <EmptyState
                                        icon={CalendarDays}
                                        title="No booking records loaded"
                                        description="Upcoming or recent bookings will appear here when available."
                                    />
                                )}
                            </div>
                        </Panel>
                    </main>

                    <aside className="space-y-5">
                        <Panel
                            eyebrow="Payments"
                            title="Review queue"
                            action={
                                <Link
                                    href={copy.payments}
                                    className="alh-secondary-button"
                                >
                                    Open
                                </Link>
                            }
                        >
                            <div className="grid gap-3 p-5">
                                {payments.length > 0 ? (
                                    payments
                                        .slice(0, 6)
                                        .map((payment) => (
                                            <PaymentRow
                                                key={payment.id}
                                                role={role}
                                                payment={payment}
                                            />
                                        ))
                                ) : (
                                    <EmptyState
                                        icon={CreditCard}
                                        title="No payments loaded"
                                        description="Payment proof records will appear here."
                                    />
                                )}
                            </div>
                        </Panel>

                        <Panel
                            eyebrow="Calendar"
                            title="Upcoming schedule"
                            action={
                                <Link
                                    href={copy.calendar}
                                    className="alh-secondary-button"
                                >
                                    Calendar
                                </Link>
                            }
                        >
                            <div className="grid gap-3 p-5">
                                {calendarItems.length > 0 ? (
                                    calendarItems
                                        .slice(0, 6)
                                        .map((item) => (
                                            <CalendarRow
                                                key={`${item.kind}-${item.id}`}
                                                item={item}
                                            />
                                        ))
                                ) : (
                                    <EmptyState
                                        icon={Clock3}
                                        title="No calendar items loaded"
                                        description="Bookings, blocks, and public events will appear here."
                                    />
                                )}
                            </div>
                        </Panel>

                        <Panel
                            eyebrow="Notifications"
                            title="Recent alerts"
                            action={
                                <Link
                                    href="/notifications"
                                    className="alh-secondary-button"
                                >
                                    Open
                                </Link>
                            }
                        >
                            <div className="grid gap-3 p-5">
                                {notifications.length > 0 ? (
                                    notifications
                                        .slice(0, 6)
                                        .map((item) => (
                                            <NotificationRow
                                                key={item.id}
                                                item={item}
                                            />
                                        ))
                                ) : (
                                    <EmptyState
                                        icon={Bell}
                                        title="No notifications"
                                        description="System alerts will appear here."
                                    />
                                )}
                            </div>
                        </Panel>
                    </aside>
                </section>
            </div>
        </AppLayout>
    );
}

export function WorkspaceHomePage() {
    return <WorkspaceDashboardPage />;
}
