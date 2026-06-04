import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    CalendarDays,
    CreditCard,
    Download,
    Eye,
    Filter,
    History,
    Printer,
    Search,
    ShieldAlert,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type AuditEvent = {
    id: number;
    booking_id: number | null;
    booking_exists: boolean;
    event_key: string;
    title: string;
    from_status?: string | null;
    to_status?: string | null;
    from_payment_status?: string | null;
    to_payment_status?: string | null;
    reason?: string | null;
    meta?: Record<string, unknown> | null;
    event_at?: string | null;
    created_at?: string | null;
    actor?: {
        id: number;
        name: string;
        email: string;
    } | null;
};

type Paginated<T> = {
    data: T[];
    links?: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    events: Paginated<AuditEvent>;
    filters: {
        q?: string;
        event_key?: string;
        status?: string;
        payment_status?: string;
        date_from?: string;
        date_to?: string;
        booking_id?: string;
        only_deleted?: boolean;
    };
    stats: {
        total: number;
        status_changes: number;
        payment_changes: number;
        auto_deleted: number;
        today: number;
        unique_bookings: number;
    };
    eventKeys: string[];
    statusOptions: string[];
    paymentStatusOptions: string[];
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
        { title: 'Audit Trail', href: `${currentBookingsBase()}/audit` },
    ];
}

function formatDateTime(value?: string | null) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function cleanLabel(value?: string | null) {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusChip(status?: string | null) {
    const value = String(status || '').toLowerCase();

    if (
        ['confirmed', 'active', 'completed', 'paid', 'verified'].includes(value)
    ) {
        return 'alh-status-chip is-good';
    }

    if (
        [
            'pending',
            'partial',
            'unpaid',
            'for_review',
            'pencil_booked',
        ].includes(value)
    ) {
        return 'alh-status-chip is-warn';
    }

    if (
        ['declined', 'cancelled', 'deleted', 'failed', 'rejected'].includes(
            value,
        )
    ) {
        return 'alh-status-chip is-bad';
    }

    if (['payment_status_changed', 'booking_status_changed'].includes(value)) {
        return 'alh-status-chip is-public';
    }

    return 'alh-status-chip';
}

function eventRowTone(eventKey: string) {
    if (eventKey === 'booking_auto_deleted') return 'is-danger';
    if (eventKey === 'payment_status_changed') return 'is-payment';
    if (eventKey === 'booking_status_changed') return 'is-status';

    return '';
}

function stripHtml(label: string) {
    return String(label || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&laquo;|&raquo;/g, '')
        .trim();
}

function buildQuery(filters: Props['filters']) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (
            value === undefined ||
            value === null ||
            value === '' ||
            value === false
        )
            return;

        params.set(key, value === true ? '1' : String(value));
    });

    return params.toString();
}

function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    icon: LucideIcon;
}) {
    return (
        <article className="audit-kpi-card">
            <div className="alh-admin-kpi-icon">
                <Icon className="h-5 w-5" />
            </div>

            <div>
                <p className="backend-booking-label">{label}</p>
                <strong>{value}</strong>
            </div>
        </article>
    );
}

function Pagination({
    links = [],
}: {
    links?: Array<{ url: string | null; label: string; active: boolean }>;
}) {
    if (!links.length) return null;

    return (
        <div className="flex flex-wrap gap-2 border-t border-slate-200 p-5 dark:border-slate-800">
            {links.map((link, index) => {
                const label = stripHtml(link.label || '');

                if (!link.url) {
                    return (
                        <span
                            key={`${link.label}-${index}`}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900/60"
                            dangerouslySetInnerHTML={{
                                __html: link.label || '',
                            }}
                        />
                    );
                }

                return (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveScroll
                        className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                            link.active
                                ? 'border-[#20242b] bg-[#20242b] text-white dark:border-white dark:bg-white dark:text-slate-950'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                        aria-label={label || 'Pagination link'}
                        dangerouslySetInnerHTML={{ __html: link.label || '' }}
                    />
                );
            })}
        </div>
    );
}

export default function BookingAuditPage({
    events,
    filters,
    stats,
    eventKeys = [],
    statusOptions = [],
    paymentStatusOptions = [],
}: Props) {
    const basePath = currentBookingsBase();
    const auditPath = `${basePath}/audit`;

    const [q, setQ] = useState(filters.q ?? '');
    const [eventKey, setEventKey] = useState(filters.event_key ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [paymentStatus, setPaymentStatus] = useState(
        filters.payment_status ?? '',
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [bookingId, setBookingId] = useState(filters.booking_id ?? '');
    const [onlyDeleted, setOnlyDeleted] = useState(
        Boolean(filters.only_deleted),
    );

    const activeFilters = useMemo(
        () => ({
            q,
            event_key: eventKey,
            status,
            payment_status: paymentStatus,
            date_from: dateFrom,
            date_to: dateTo,
            booking_id: bookingId,
            only_deleted: onlyDeleted,
        }),
        [
            q,
            eventKey,
            status,
            paymentStatus,
            dateFrom,
            dateTo,
            bookingId,
            onlyDeleted,
        ],
    );

    const query = buildQuery(activeFilters);
    const exportHref = query
        ? `${auditPath}/export?${query}`
        : `${auditPath}/export`;
    const printHref = query
        ? `${auditPath}/print?${query}`
        : `${auditPath}/print`;

    const topCards = [
        { label: 'Visible Events', value: stats.total, icon: History },
        {
            label: 'Status Changes',
            value: stats.status_changes,
            icon: Activity,
        },
        {
            label: 'Payment Changes',
            value: stats.payment_changes,
            icon: CreditCard,
        },
        { label: 'Auto Deleted', value: stats.auto_deleted, icon: Trash2 },
        { label: 'Today', value: stats.today, icon: CalendarDays },
        { label: 'Unique Bookings', value: stats.unique_bookings, icon: Users },
    ];

    function applyFilters(event?: FormEvent<HTMLFormElement>) {
        event?.preventDefault();

        router.get(
            auditPath,
            {
                q: q || undefined,
                event_key: eventKey || undefined,
                status: status || undefined,
                payment_status: paymentStatus || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                booking_id: bookingId || undefined,
                only_deleted: onlyDeleted ? 1 : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function resetFilters() {
        setQ('');
        setEventKey('');
        setStatus('');
        setPaymentStatus('');
        setDateFrom('');
        setDateTo('');
        setBookingId('');
        setOnlyDeleted(false);

        router.get(
            auditPath,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="Booking Audit Trail" />

            <div className="backend-admin-page space-y-5">
                <section className="audit-hero">
                    <div>
                        <p className="backend-booking-label">Lifecycle Audit</p>
                        <h1>
                            Booking lifecycle, payment, and automation history.
                        </h1>
                        <span>
                            Review system movement, status transitions, payment
                            changes, deleted booking traces, automation actions,
                            and actor details.
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <a href={exportHref} className="alh-secondary-button">
                            <Download className="h-4 w-4" />
                            Export Excel
                        </a>

                        <Link
                            href={printHref}
                            target="_blank"
                            className="alh-primary-button"
                        >
                            <Printer className="h-4 w-4" />
                            Print Report
                        </Link>

                        <Link href={basePath} className="alh-secondary-button">
                            Back to Bookings
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    {topCards.map((card) => (
                        <StatCard key={card.label} {...card} />
                    ))}
                </section>

                <section className="audit-filter-panel">
                    <form onSubmit={applyFilters} className="audit-filter-grid">
                        <div className="relative lg:col-span-2">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                className="backend-booking-input pl-10"
                                placeholder="Search title, reason, event key, actor..."
                            />
                        </div>

                        <select
                            value={eventKey}
                            onChange={(event) =>
                                setEventKey(event.target.value)
                            }
                            className="backend-booking-input"
                        >
                            <option value="">All event keys</option>
                            {eventKeys.map((key) => (
                                <option key={key} value={key}>
                                    {cleanLabel(key)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="backend-booking-input"
                        >
                            <option value="">All booking statuses</option>
                            {statusOptions.map((item) => (
                                <option key={item} value={item}>
                                    {cleanLabel(item)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={paymentStatus}
                            onChange={(event) =>
                                setPaymentStatus(event.target.value)
                            }
                            className="backend-booking-input"
                        >
                            <option value="">All payment statuses</option>
                            {paymentStatusOptions.map((item) => (
                                <option key={item} value={item}>
                                    {cleanLabel(item)}
                                </option>
                            ))}
                        </select>

                        <input
                            value={bookingId}
                            onChange={(event) =>
                                setBookingId(event.target.value)
                            }
                            className="backend-booking-input"
                            placeholder="Booking ID"
                            inputMode="numeric"
                        />

                        <input
                            value={dateFrom}
                            onChange={(event) =>
                                setDateFrom(event.target.value)
                            }
                            className="backend-booking-input"
                            type="date"
                            aria-label="Date from"
                        />

                        <input
                            value={dateTo}
                            onChange={(event) => setDateTo(event.target.value)}
                            className="backend-booking-input"
                            type="date"
                            aria-label="Date to"
                        />

                        <label className="audit-toggle">
                            <input
                                type="checkbox"
                                checked={onlyDeleted}
                                onChange={(event) =>
                                    setOnlyDeleted(event.target.checked)
                                }
                            />
                            <span>Deleted only</span>
                        </label>

                        <button
                            type="submit"
                            className="alh-primary-button justify-center"
                        >
                            <Filter className="h-4 w-4" />
                            Apply
                        </button>

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="alh-secondary-button justify-center"
                        >
                            <X className="h-4 w-4" />
                            Reset
                        </button>
                    </form>
                </section>

                <section className="audit-panel overflow-hidden">
                    <div className="audit-panel-header">
                        <div>
                            <p className="backend-booking-label">
                                Audit Records
                            </p>
                            <h2>
                                {events.data.length} loaded event
                                {events.data.length === 1 ? '' : 's'}
                            </h2>
                            <span>
                                Rows are compressed for faster review. Open the
                                booking when the source record still exists.
                            </span>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {events.data.length > 0 ? (
                            events.data.map((event) => (
                                <article
                                    key={event.id}
                                    className={`audit-event-row ${eventRowTone(event.event_key)}`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap gap-2">
                                            <span
                                                className={statusChip(
                                                    event.event_key,
                                                )}
                                            >
                                                {cleanLabel(event.event_key)}
                                            </span>

                                            {event.to_status ? (
                                                <span
                                                    className={statusChip(
                                                        event.to_status,
                                                    )}
                                                >
                                                    Booking:{' '}
                                                    {cleanLabel(
                                                        event.to_status,
                                                    )}
                                                </span>
                                            ) : null}

                                            {event.to_payment_status ? (
                                                <span
                                                    className={statusChip(
                                                        event.to_payment_status,
                                                    )}
                                                >
                                                    Payment:{' '}
                                                    {cleanLabel(
                                                        event.to_payment_status,
                                                    )}
                                                </span>
                                            ) : null}

                                            {!event.booking_exists ? (
                                                <span className="alh-status-chip is-bad">
                                                    Source deleted
                                                </span>
                                            ) : null}
                                        </div>

                                        <h3>
                                            {event.title ||
                                                cleanLabel(event.event_key)}
                                        </h3>

                                        <p>
                                            Booking #{event.booking_id || '—'} ·{' '}
                                            {event.actor?.name ||
                                                'System / automation'}{' '}
                                            ·{' '}
                                            {formatDateTime(
                                                event.event_at ||
                                                    event.created_at,
                                            )}
                                        </p>

                                        {event.reason ? (
                                            <small>{event.reason}</small>
                                        ) : null}

                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                            <div className="alh-admin-mini-box">
                                                <span>
                                                    Booking Status Movement
                                                </span>
                                                <strong>
                                                    {cleanLabel(
                                                        event.from_status,
                                                    )}{' '}
                                                    →{' '}
                                                    {cleanLabel(
                                                        event.to_status,
                                                    )}
                                                </strong>
                                            </div>

                                            <div className="alh-admin-mini-box">
                                                <span>
                                                    Payment Status Movement
                                                </span>
                                                <strong>
                                                    {cleanLabel(
                                                        event.from_payment_status,
                                                    )}{' '}
                                                    →{' '}
                                                    {cleanLabel(
                                                        event.to_payment_status,
                                                    )}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 xl:justify-end">
                                        {event.booking_exists &&
                                        event.booking_id ? (
                                            <Link
                                                href={`${basePath}/${event.booking_id}`}
                                                className="alh-primary-button"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Booking
                                            </Link>
                                        ) : (
                                            <span className="alh-admin-neutral-button opacity-60">
                                                No Source
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="analytics-empty-state">
                                <ShieldAlert className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                <h3>No audit rows found</h3>
                                <p>
                                    Adjust filters to review more lifecycle and
                                    automation records.
                                </p>
                            </div>
                        )}
                    </div>

                    <Pagination links={events.links} />
                </section>
            </div>
        </AppLayout>
    );
}
