import { Badge } from '@/components/ui/badge';
import BookingStatusBadge from '@/components/ui/booking-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import bookingsRoutes from '@/routes/bookings';
import { Booking, Service, type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    CalendarDays,
    Clock3,
    Download,
    Eye,
    LayoutGrid,
    List,
    Pencil,
    Search,
    Trash2,
    Users,
    Wallet,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import DeleteBookingDialog from './DeleteBookingDialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Bookings', href: bookingsRoutes.index.url() },
];

interface LaravelPaginationLink {
    url: string | null;
    label: string;
    page?: number;
    active: boolean;
}

type PaginatedBookings = {
    data?: Booking[];
    links?: LaravelPaginationLink[];
    meta?: {
        links?: LaravelPaginationLink[];
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

type RoleRecord = string | { name?: string | null };

type AuthRecord = {
    roles?: RoleRecord[];
    user?: {
        roles?: RoleRecord[];
    } | null;
};

type SortKey =
    | 'upcoming'
    | 'ending_soon'
    | 'newest'
    | 'oldest'
    | 'farthest'
    | 'guests_desc'
    | 'priority'
    | 'unviewed_first';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
    { value: 'upcoming', label: 'Nearest schedule (Upcoming first)' },
    { value: 'ending_soon', label: 'Ending soon' },
    { value: 'priority', label: 'Priority (Pending/Active + Upcoming)' },
    { value: 'unviewed_first', label: 'NEW (unviewed) first' },
    { value: 'newest', label: 'Newest booking (Created)' },
    { value: 'oldest', label: 'Oldest booking (Created)' },
    { value: 'farthest', label: 'Farthest schedule' },
    { value: 'guests_desc', label: 'Most guests' },
];

interface BookingsPageProps {
    bookings: PaginatedBookings;
    services: Service[];
    filters: Partial<{
        booking_status: string;
        payment_status: string;
        service_id: string | number;
        q: string;
        date_from: string;
        date_to: string;
        sort: SortKey | string;
    }>;
    statusCounts: {
        all: number;
        pending: number;
        active: number;
        confirmed: number;
        cancelled: number;
        declined: number;
        completed: number;
    };
}

function getRoleNames(auth: AuthRecord | null | undefined): string[] {
    const raw = auth?.user?.roles ?? auth?.roles ?? [];
    if (!Array.isArray(raw)) return [];

    return raw
        .map((role) => (typeof role === 'string' ? role : role?.name))
        .filter((role): role is string => Boolean(role))
        .map((role) => role.toLowerCase());
}

function isDateOnlyString(s: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function parseScheduleDateTime(
    input: unknown,
    opts?: { dateOnlyAsEnd?: boolean },
): Date | null {
    if (input === null || input === undefined) return null;
    if (input instanceof Date)
        return Number.isNaN(input.getTime()) ? null : input;

    if (typeof input === 'number') {
        const d = new Date(input);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    const s = String(input).trim();
    if (!s) return null;

    const m = s.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?)?/,
    );

    if (!m) {
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const da = Number(m[3]);
    const dateOnly = isDateOnlyString(s);

    let hh = m[4] ? Number(m[4]) : 0;
    let mm = m[5] ? Number(m[5]) : 0;
    let ss = m[6] ? Number(m[6]) : 0;
    let ms = 0;

    if (m[7]) {
        const frac = String(m[7]);
        ms = Number.parseInt(frac.padEnd(3, '0').slice(0, 3), 10);
        if (!Number.isFinite(ms)) ms = 0;
    }

    if (dateOnly && opts?.dateOnlyAsEnd) {
        hh = 23;
        mm = 59;
        ss = 59;
        ms = 999;
    }

    const d = new Date(y, mo, da, hh, mm, ss, ms);
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatScheduleDateTime(input: unknown): string {
    if (input === null || input === undefined) return '—';
    const s = String(input).trim();
    const dateOnly = isDateOnlyString(s);
    const d = parseScheduleDateTime(input);
    if (!d) return '—';

    if (dateOnly) {
        return d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        });
    }

    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function diffCalendarDays(a: Date, b: Date) {
    const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((aUTC - bUTC) / 86400000);
}

function formatDuration(fromInput: unknown, toInput: unknown) {
    const start = parseScheduleDateTime(fromInput);
    const end = parseScheduleDateTime(toInput, { dateOnlyAsEnd: true });
    if (!start || !end) return null;

    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    if (!Number.isFinite(mins) || mins <= 0) return null;

    if (mins < 60) return `${mins}m`;
    if (mins < 24 * 60) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m ? `${h}h ${m}m` : `${h}h`;
    }

    const days = Math.floor(mins / (24 * 60));
    const rem = mins - days * 24 * 60;
    const h = Math.floor(rem / 60);
    return h ? `${days}d ${h}h` : `${days}d`;
}

function getScheduleTag(fromInput: unknown, toInput: unknown) {
    const start = parseScheduleDateTime(fromInput);
    const end = parseScheduleDateTime(toInput, { dateOnlyAsEnd: true });
    if (!start) return null;

    const now = new Date();

    if (end && start <= now && end > now) {
        return { label: 'ONGOING', className: 'bg-sky-600 text-white' };
    }

    if (end && end <= now) {
        return {
            label: 'PAST',
            className: 'bg-muted text-muted-foreground border border-border',
        };
    }

    if (!end && start <= now) {
        return { label: 'ONGOING', className: 'bg-sky-600 text-white' };
    }

    const days = diffCalendarDays(start, now);

    if (days === 0)
        return { label: 'TODAY', className: 'bg-emerald-600 text-white' };
    if (days === 1)
        return { label: 'TOMORROW', className: 'bg-emerald-500 text-white' };
    if (days > 1 && days <= 7)
        return { label: `IN ${days}D`, className: 'bg-amber-500 text-black' };
    if (days > 7)
        return {
            label: `IN ${days}D`,
            className: 'bg-muted text-foreground border border-border',
        };

    return {
        label: 'PAST',
        className: 'bg-muted text-muted-foreground border border-border',
    };
}

function formatMoney(value: number) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function getCreatedByLabel(booking: Booking): string {
    const createdBy = (booking.created_by ?? booking.createdBy ?? booking.creator ?? null) as
        | { name?: unknown; email?: unknown }
        | null;
    const name = booking.created_by_name ?? createdBy?.name ?? null;
    const email = booking.created_by_email ?? createdBy?.email ?? null;

    if (name && email) return `${String(name)} (${String(email)})`;
    if (name) return String(name);
    if (email) return String(email);
    return '-';
}

function buildIndexHref(params: Record<string, string | undefined>) {
    const base = bookingsRoutes.index.url();
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== '')
            sp.set(k, v);
    });
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
}

function extractPaginationLinks(bookings: PaginatedBookings): LaravelPaginationLink[] {
    const metaLinks = bookings?.meta?.links;
    if (Array.isArray(metaLinks)) return metaLinks;

    const directLinks = bookings?.links;
    if (Array.isArray(directLinks)) return directLinks;

    return [];
}

function normalizeLabel(label: unknown): string {
    const raw = String(label ?? '');
    return raw
        .replace(/&laquo;|&raquo;/g, '')
        .replace(/<[^>]*>/g, '')
        .trim();
}

function paymentTone(status?: string | null) {
    const s = String(status ?? '').toLowerCase();
    if (s === 'paid') return 'bg-emerald-600 text-white';
    if (s === 'partial') return 'bg-amber-500 text-black';
    if (s === 'unpaid' || s === 'owing') return 'bg-red-600 text-white';
    return 'bg-muted text-foreground border border-border';
}

function paymentLabel(status?: string | null) {
    const s = String(status ?? '').toLowerCase();
    if (!s) return '-';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function getOutstandingBalance(booking: Booking) {
    const totals = (booking?.totals ?? {}) as Record<string, unknown>;
    const itemsTotal = Number(totals.items_total ?? 0);
    const paid = Number(
        totals.confirmed_payments_total ??
            totals.payments_total ??
            0,
    );
    return Math.max(itemsTotal - paid, 0);
}

function getItemsTotal(booking: Booking) {
    return Number(((booking?.totals ?? {}) as Record<string, unknown>).items_total ?? 0);
}

function getServicesPreview(booking: Booking): string {
    if (Array.isArray(booking.items) && booking.items.length > 0) {
        return booking.items
            .map((item) => String(item.service_name || 'Service'))
            .filter(Boolean)
            .join(', ');
    }

    if (booking.service_name) return String(booking.service_name);
    return 'No service items attached';
}

function getPrimaryArea(booking: Booking) {
    const firstItem = Array.isArray(booking.items) ? booking.items[0] : null;
    return (firstItem as { area?: string | null } | null)?.area || '—';
}

function excelCell(value: unknown) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export default function Bookings(props: BookingsPageProps) {
    const page = usePage<{ auth?: AuthRecord }>().props;
    const roleNames = getRoleNames(page?.auth);
    const isClient = roleNames.includes('user');
    const defaultSort: SortKey = isClient ? 'newest' : 'upcoming';

    const bookings = useMemo(() => props.bookings ?? { data: [] }, [props.bookings]);
    const services = useMemo(() => (Array.isArray(props.services) ? props.services : []), [props.services]);
    const filters = props.filters ?? {};
    const statusCounts = props.statusCounts ?? {
        all: 0,
        pending: 0,
        active: 0,
        confirmed: 0,
        cancelled: 0,
        declined: 0,
        completed: 0,
    };

    const bookingRows: Booking[] = useMemo(() => (Array.isArray(bookings?.data) ? bookings.data : []), [bookings]);
    const paginationLinks = extractPaginationLinks(bookings);

    const [selected, setSelected] = useState<Booking | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

    const [bookingStatus, setBookingStatus] = useState<string>(
        filters.booking_status ?? '',
    );
    const [paymentStatus, setPaymentStatus] = useState<string>(
        filters.payment_status ?? '',
    );
    const [serviceId, setServiceId] = useState<string>(
        filters.service_id ? String(filters.service_id) : '',
    );
    const [q, setQ] = useState<string>(filters.q ?? '');
    const [dateFrom, setDateFrom] = useState<string>(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState<string>(filters.date_to ?? '');
    const [sort, setSort] = useState<SortKey>(
        ((filters.sort as SortKey) ?? defaultSort) as SortKey,
    );

    const serviceOptions = useMemo(() => {
        return [...services].sort((a, b) =>
            (a.name || '').localeCompare(b.name || ''),
        );
    }, [services]);

    const visibleMetrics = useMemo(() => {
        const visibleCount = bookingRows.length;
        const urgentCount = bookingRows.filter((booking) => {
            const tag = getScheduleTag(
                booking.booking_date_from,
                booking.booking_date_to,
            );
            return (
                tag?.label === 'TODAY' ||
                tag?.label === 'TOMORROW' ||
                tag?.label === 'ONGOING'
            );
        }).length;
        const unpaidCount = bookingRows.filter((booking) =>
            ['unpaid', 'partial', 'owing'].includes(
                String(booking.payment_status ?? '').toLowerCase(),
            ),
        ).length;
        const totalGuests = bookingRows.reduce(
            (sum, booking) => sum + Number(booking.number_of_guests ?? 0),
            0,
        );
        const outstanding = bookingRows.reduce(
            (sum, booking) => sum + getOutstandingBalance(booking),
            0,
        );

        return {
            visibleCount,
            urgentCount,
            unpaidCount,
            totalGuests,
            outstanding,
        };
    }, [bookingRows]);

    function openDelete(booking: Booking) {
        setSelected(booking);
        setDeleteOpen(true);
    }

    function applyQuery(next?: Partial<Record<string, string | undefined>>) {
        router.get(
            bookingsRoutes.index.url(),
            {
                booking_status: bookingStatus || undefined,
                payment_status: paymentStatus || undefined,
                service_id: serviceId || undefined,
                q: q || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                sort: sort || undefined,
                ...next,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function resetFilters() {
        setBookingStatus('');
        setPaymentStatus('');
        setServiceId('');
        setQ('');
        setDateFrom('');
        setDateTo('');
        setSort(defaultSort);

        router.get(
            bookingsRoutes.index.url(),
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    const handlePagination = (url: string | null) => (e: React.MouseEvent) => {
        if (!url) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    function exportVisibleExcel() {
        const headers = [
            'Booking ID',
            'Client',
            'Company',
            'Email',
            'Contact',
            'Event Type',
            'Schedule From',
            'Schedule To',
            'Guests',
            'Booking Status',
            'Payment Status',
            'Items Total',
            'Outstanding Balance',
            'Services',
            'Area',
            'Created By',
            'Created At',
        ];

        const rows = bookingRows.map((booking) => [
            booking.id,
            booking.client_name,
            booking.company_name,
            booking.client_email,
            booking.client_contact_number,
            booking.type_of_event,
            formatScheduleDateTime(booking.booking_date_from),
            formatScheduleDateTime(booking.booking_date_to),
            booking.number_of_guests,
            booking.booking_status,
            booking.payment_status,
            formatMoney(getItemsTotal(booking)),
            formatMoney(getOutstandingBalance(booking)),
            getServicesPreview(booking),
            getPrimaryArea(booking),
            getCreatedByLabel(booking),
            formatScheduleDateTime(booking.created_at),
        ]);

        const tableRows = [headers, ...rows]
            .map((row, index) => {
                const tag = index === 0 ? 'th' : 'td';
                return `<tr>${row.map((cell) => `<${tag}>${excelCell(cell)}</${tag}>`).join('')}</tr>`;
            })
            .join('');
        const html = `<!doctype html><html><head><meta charset="utf-8"><style>
            body{font-family:Calibri,Arial,sans-serif;color:#17201d}
            .title{background:#164734;color:#fff;font-size:22px;font-weight:700;padding:14px;border-bottom:4px solid #d6b56d}
            .subtitle{background:#fff8e6;color:#5e6b62;padding:8px 14px}
            table{border-collapse:collapse;width:100%}
            th{background:#226855;color:#fff;text-align:left;font-weight:700}
            th,td{border:1px solid #e8e1d3;padding:7px;vertical-align:top;white-space:normal}
            tr:nth-child(even) td{background:#f8faf9}
        </style></head><body>
            <div class="title">BCCC Bookings Export</div>
            <div class="subtitle">Baguio Convention and Cultural Center - generated ${excelCell(new Date().toLocaleString('en-PH'))}</div>
            <table>${tableRows}</table>
        </body></html>`;

        const blob = new Blob([html], {
            type: 'application/vnd.ms-excel;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bookings-${new Date().toISOString().slice(0, 10)}.xls`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bookings" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="space-y-4 px-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    Bookings command center
                                </CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Better list management, quick urgency
                                    spotting, payment visibility, and Excel export
                                    without adding a new backend endpoint.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex rounded-lg border p-1">
                                    <Button
                                        type="button"
                                        variant={
                                            viewMode === 'cards'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        onClick={() => setViewMode('cards')}
                                    >
                                        <LayoutGrid className="mr-2 h-4 w-4" />{' '}
                                        Cards
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            viewMode === 'table'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        onClick={() => setViewMode('table')}
                                    >
                                        <List className="mr-2 h-4 w-4" /> Table
                                    </Button>
                                </div>

                                <Button asChild variant="outline" size="sm">
                                    <Link href="/bookings/analytics">
                                        <Activity className="mr-2 h-4 w-4" />{' '}
                                        Analytics
                                    </Link>
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={exportVisibleExcel}
                                >
                                    <Download className="mr-2 h-4 w-4" /> Export
                                    Excel
                                </Button>

                                <Button asChild variant="outline" size="sm">
                                    <Link href="/bookings/audit">
                                        Audit Trail
                                    </Link>
                                </Button>

                                <Button asChild variant="outline" size="sm">
                                    <Link href="/bookings/operations">
                                        Operations Center
                                    </Link>
                                </Button>

                                <Button asChild size="sm">
                                    <Link href={bookingsRoutes.create.url()}>
                                        New Booking
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            <div className="rounded-2xl border bg-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                                        <CalendarDays className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                            Visible bookings
                                        </div>
                                        <div className="text-2xl font-semibold">
                                            {visibleMetrics.visibleCount}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border bg-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-amber-500/10 p-2 text-amber-600">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                            Urgent schedules
                                        </div>
                                        <div className="text-2xl font-semibold">
                                            {visibleMetrics.urgentCount}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border bg-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-red-500/10 p-2 text-red-600">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                            Needs payment
                                        </div>
                                        <div className="text-2xl font-semibold">
                                            {visibleMetrics.unpaidCount}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border bg-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-sky-500/10 p-2 text-sky-600">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                            Visible guests
                                        </div>
                                        <div className="text-2xl font-semibold">
                                            {visibleMetrics.totalGuests}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border bg-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                                        <Clock3 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                            Outstanding
                                        </div>
                                        <div className="text-2xl font-semibold">
                                            ₱{' '}
                                            {formatMoney(
                                                visibleMetrics.outstanding,
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                            {[
                                {
                                    key: 'all',
                                    label: 'All',
                                    count: statusCounts.all,
                                },
                                {
                                    key: 'pending',
                                    label: 'Pending',
                                    count: statusCounts.pending,
                                },
                                {
                                    key: 'active',
                                    label: 'Active',
                                    count: statusCounts.active,
                                },
                                {
                                    key: 'confirmed',
                                    label: 'Confirmed',
                                    count: statusCounts.confirmed,
                                },
                                {
                                    key: 'cancelled',
                                    label: 'Cancelled',
                                    count: statusCounts.cancelled,
                                },
                                {
                                    key: 'declined',
                                    label: 'Declined',
                                    count: statusCounts.declined,
                                },
                                {
                                    key: 'completed',
                                    label: 'Completed',
                                    count: statusCounts.completed,
                                },
                            ].map(({ key, label, count }) => {
                                const href = buildIndexHref({
                                    booking_status:
                                        key === 'all' ? undefined : key,
                                    payment_status: paymentStatus || undefined,
                                    service_id: serviceId || undefined,
                                    q: q || undefined,
                                    date_from: dateFrom || undefined,
                                    date_to: dateTo || undefined,
                                    sort: sort || undefined,
                                });

                                const activeStatus = String(
                                    filters.booking_status ?? '',
                                );
                                const isActive =
                                    key === 'all'
                                        ? !activeStatus
                                        : activeStatus === key;

                                return (
                                    <Link
                                        key={key}
                                        href={href}
                                        preserveScroll
                                        replace
                                    >
                                        <Badge
                                            variant={
                                                isActive
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {label}: {count}
                                        </Badge>
                                    </Link>
                                );
                            })}
                        </div>

                        <form
                            className="grid grid-cols-1 gap-2 lg:grid-cols-8"
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyQuery();
                            }}
                        >
                            <select
                                className="rounded-md border bg-background px-2 py-1 text-sm"
                                value={bookingStatus}
                                onChange={(e) =>
                                    setBookingStatus(e.target.value)
                                }
                            >
                                <option value="">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="declined">Declined</option>
                                <option value="completed">Completed</option>
                            </select>

                            <select
                                className="rounded-md border bg-background px-2 py-1 text-sm"
                                value={paymentStatus}
                                onChange={(e) =>
                                    setPaymentStatus(e.target.value)
                                }
                            >
                                <option value="">All payments</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="owing">Owing</option>
                            </select>

                            <select
                                className="rounded-md border bg-background px-2 py-1 text-sm"
                                value={serviceId}
                                onChange={(e) => setServiceId(e.target.value)}
                            >
                                <option value="">All services</option>
                                {serviceOptions.map((s) => (
                                    <option key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>

                            <div className="relative lg:col-span-2">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search client/company/email"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                            </div>

                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />

                            <select
                                className="rounded-md border bg-background px-2 py-1 text-sm"
                                value={sort}
                                onChange={(e) =>
                                    setSort(e.target.value as SortKey)
                                }
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <div className="flex flex-wrap gap-2 lg:col-span-8">
                                <Button type="submit" size="sm">
                                    Apply filters
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={resetFilters}
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardHeader>

                    <CardContent className="space-y-4 px-6 pb-6">
                        {bookingRows.length === 0 ? (
                            <div className="rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
                                No bookings found for the current filter set.
                            </div>
                        ) : viewMode === 'cards' ? (
                            <div className="grid gap-4 xl:grid-cols-2">
                                {bookingRows.map((booking) => {
                                    const scheduleTag = getScheduleTag(
                                        booking.booking_date_from,
                                        booking.booking_date_to,
                                    );
                                    const duration = formatDuration(
                                        booking.booking_date_from,
                                        booking.booking_date_to,
                                    );
                                    const servicesPreview =
                                        getServicesPreview(booking);
                                    const outstanding =
                                        getOutstandingBalance(booking);
                                    const itemsTotal = getItemsTotal(booking);

                                    return (
                                        <div
                                            key={booking.id}
                                            className="rounded-3xl border bg-card p-5 shadow-sm"
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="text-xl font-semibold">
                                                            {booking.company_name ||
                                                                booking.client_name}
                                                        </div>
                                                        <BookingStatusBadge
                                                            status={
                                                                booking.booking_status
                                                            }
                                                        />
                                                        <Badge
                                                            className={paymentTone(
                                                                booking.payment_status,
                                                            )}
                                                        >
                                                            {paymentLabel(
                                                                booking.payment_status,
                                                            )}
                                                        </Badge>
                                                        {scheduleTag ? (
                                                            <Badge
                                                                className={
                                                                    scheduleTag.className
                                                                }
                                                            >
                                                                {
                                                                    scheduleTag.label
                                                                }
                                                            </Badge>
                                                        ) : null}
                                                    </div>

                                                    <div className="text-sm text-muted-foreground">
                                                        {booking.client_name} •{' '}
                                                        {booking.client_email ||
                                                            'No email'}
                                                    </div>

                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <div className="rounded-2xl border bg-muted/20 p-4">
                                                            <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                                                Schedule
                                                            </div>
                                                            <div className="mt-2 text-sm font-medium">
                                                                {formatScheduleDateTime(
                                                                    booking.booking_date_from,
                                                                )}
                                                            </div>
                                                            <div className="mt-1 text-sm text-muted-foreground">
                                                                to{' '}
                                                                {formatScheduleDateTime(
                                                                    booking.booking_date_to,
                                                                )}
                                                            </div>
                                                            {duration ? (
                                                                <div className="mt-2 text-xs text-muted-foreground">
                                                                    Duration:{' '}
                                                                    {duration}
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                        <div className="rounded-2xl border bg-muted/20 p-4">
                                                            <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                                                Event
                                                            </div>
                                                            <div className="mt-2 text-sm font-medium">
                                                                {booking.type_of_event ||
                                                                    '—'}
                                                            </div>
                                                            <div className="mt-1 text-sm text-muted-foreground">
                                                                Guests:{' '}
                                                                {booking.number_of_guests ??
                                                                    0}
                                                            </div>
                                                            <div className="mt-1 text-sm text-muted-foreground">
                                                                Primary area:{' '}
                                                                {getPrimaryArea(
                                                                    booking,
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={`/bookings/${booking.id}`}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />{' '}
                                                            Open
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={`/bookings/${booking.id}/edit`}
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />{' '}
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            openDelete(booking)
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />{' '}
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
                                                <div className="rounded-2xl border p-4">
                                                    <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                                        Services
                                                    </div>
                                                    <div className="mt-2 text-sm leading-7">
                                                        {String(servicesPreview)}
                                                    </div>
                                                    <div className="mt-2 text-xs text-muted-foreground">
                                                        Created by:{' '}
                                                        {getCreatedByLabel(
                                                            booking,
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border p-4">
                                                    <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                                        Billing snapshot
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between text-sm">
                                                        <span>Items total</span>
                                                        <span className="font-medium">
                                                            ₱{' '}
                                                            {formatMoney(
                                                                itemsTotal,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between text-sm">
                                                        <span>Outstanding</span>
                                                        <span
                                                            className={`font-semibold ${outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}
                                                        >
                                                            ₱{' '}
                                                            {formatMoney(
                                                                outstanding,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Booking</TableHead>
                                            <TableHead>Schedule</TableHead>
                                            <TableHead>Guests</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Payment</TableHead>
                                            <TableHead>Outstanding</TableHead>
                                            <TableHead>Services</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bookingRows.map((booking) => {
                                            const scheduleTag = getScheduleTag(
                                                booking.booking_date_from,
                                                booking.booking_date_to,
                                            );
                                            const outstanding =
                                                getOutstandingBalance(booking);

                                            return (
                                                <TableRow key={booking.id}>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {booking.company_name ||
                                                                booking.client_name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                booking.client_name
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {booking.client_email ||
                                                                'No email'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {formatScheduleDateTime(
                                                                booking.booking_date_from,
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            to{' '}
                                                            {formatScheduleDateTime(
                                                                booking.booking_date_to,
                                                            )}
                                                        </div>
                                                        {scheduleTag ? (
                                                            <Badge
                                                                className={`mt-2 ${scheduleTag.className}`}
                                                            >
                                                                {
                                                                    scheduleTag.label
                                                                }
                                                            </Badge>
                                                        ) : null}
                                                    </TableCell>
                                                    <TableCell>
                                                        {booking.number_of_guests ??
                                                            0}
                                                    </TableCell>
                                                    <TableCell>
                                                        <BookingStatusBadge
                                                            status={
                                                                booking.booking_status
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={paymentTone(
                                                                booking.payment_status,
                                                            )}
                                                        >
                                                            {paymentLabel(
                                                                booking.payment_status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={
                                                                outstanding > 0
                                                                    ? 'font-semibold text-red-600'
                                                                    : 'font-semibold text-emerald-600'
                                                            }
                                                        >
                                                            ₱{' '}
                                                            {formatMoney(
                                                                outstanding,
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-[260px] truncate text-sm">
                                                            {String(getServicesPreview(
                                                                booking,
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                <Link
                                                                    href={`/bookings/${booking.id}`}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                <Link
                                                                    href={`/bookings/${booking.id}/edit`}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    openDelete(
                                                                        booking,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {paginationLinks.length > 0 ? (
                            <Pagination>
                                <PaginationContent>
                                    {paginationLinks.map((link, index) => {
                                        const label = normalizeLabel(
                                            link.label,
                                        );
                                        const isPrev =
                                            label.toLowerCase() === 'previous';
                                        const isNext =
                                            label.toLowerCase() === 'next';
                                        const isEllipsis = label === '...';

                                        if (isPrev) {
                                            return (
                                                <PaginationItem
                                                    key={`prev-${index}`}
                                                >
                                                    <PaginationPrevious
                                                        href={link.url ?? '#'}
                                                        onClick={handlePagination(
                                                            link.url,
                                                        )}
                                                    />
                                                </PaginationItem>
                                            );
                                        }

                                        if (isNext) {
                                            return (
                                                <PaginationItem
                                                    key={`next-${index}`}
                                                >
                                                    <PaginationNext
                                                        href={link.url ?? '#'}
                                                        onClick={handlePagination(
                                                            link.url,
                                                        )}
                                                    />
                                                </PaginationItem>
                                            );
                                        }

                                        if (isEllipsis) {
                                            return (
                                                <PaginationItem
                                                    key={`ellipsis-${index}`}
                                                >
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            );
                                        }

                                        return (
                                            <PaginationItem
                                                key={`page-${label}-${index}`}
                                            >
                                                <PaginationLink
                                                    href={link.url ?? '#'}
                                                    onClick={handlePagination(
                                                        link.url,
                                                    )}
                                                    isActive={Boolean(
                                                        link.active,
                                                    )}
                                                >
                                                    {label}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}
                                </PaginationContent>
                            </Pagination>
                        ) : null}
                    </CardContent>
                </Card>

                <DeleteBookingDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    booking={selected}
                />
            </div>
        </AppLayout>
    );
}
