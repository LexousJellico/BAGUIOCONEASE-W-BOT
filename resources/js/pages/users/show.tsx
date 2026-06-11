import AppLayout from '@/layouts/app-layout';
import { workspacePath, workspaceUsersPath } from '@/lib/workspace-paths';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    CalendarDays,
    CreditCard,
    Edit,
    FileText,
    Mail,
    MapPin,
    ReceiptText,
    ShieldCheck,
    User2,
} from 'lucide-react';

type BookingSummary = {
    id: number;
    title?: string | null;
    client?: string | null;
    type_of_event?: string | null;
    company_name?: string | null;
    client_name?: string | null;
    client_email?: string | null;
    client_contact_number?: string | null;
    organization_type?: string | null;
    head_of_organization?: string | null;
    booking_status?: string | null;
    payment_status?: string | null;
    selected_package_code?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
    number_of_guests?: number | null;
    services?: string[];
    mice_report?: {
        id?: number;
        status?: string | null;
        reference_code?: string | null;
        event_name?: string | null;
        event_scope?: string | null;
        total_participants?: number | null;
    } | null;
    payments_count?: number;
    post_event_charges_count?: number;
    totals?: {
        base_total?: number;
        post_event_total?: number;
        total_payable?: number;
        confirmed_payments?: number;
        pending_payments?: number;
        remaining_balance?: number;
    };
};

type UserDetails = {
    id: number;
    name: string;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    email: string;
    phone_number?: string | null;
    organization_name?: string | null;
    organization_type?: string | null;
    position_title?: string | null;
    address_line1?: string | null;
    barangay?: string | null;
    city_municipality?: string | null;
    province?: string | null;
    postal_code?: string | null;
    country?: string | null;
    role?: string | null;
    roles?: string[];
    email_is_verified?: boolean;
    email_verified_at?: string | null;
    last_login_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    google_id?: string | null;
    bookings_count?: number;
    approved_bookings_count?: number;
    pending_bookings_count?: number;
    latest_booking?: BookingSummary | null;
    recent_bookings?: BookingSummary[];
};

type Props = {
    user: UserDetails;
};

function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function formatDateRange(from?: string | null, to?: string | null) {
    const start = formatDate(from);
    const end = formatDate(to);
    if (start === '—' && end === '—') return '—';
    if (start === end || end === '—') return start;
    return `${start} → ${end}`;
}

function money(value?: number | null) {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
}

function labelize(value?: string | null) {
    if (!value) return '—';
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function valueOrDash(value?: string | number | null) {
    if (value === null || value === undefined) return '—';
    const text = String(value).trim();
    return text !== '' ? text : '—';
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) {
    return (
        <div className="grid gap-1 border-b border-border/50 py-3 sm:grid-cols-[220px_1fr]">
            <div className="text-sm font-medium text-muted-foreground">
                {label}
            </div>
            <div className="text-sm break-words text-foreground">
                {valueOrDash(value)}
            </div>
        </div>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    hint,
}: {
    icon: typeof User2;
    label: string;
    value: string | number;
    hint?: string;
}) {
    return (
        <div className="rounded-2xl border bg-muted/25 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <div className="text-2xl font-black tracking-tight">{value}</div>
            {hint ? (
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}

function StatusPill({
    value,
    tone = 'neutral',
}: {
    value?: string | null;
    tone?: 'neutral' | 'good' | 'warning';
}) {
    const classes = {
        good: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
        warning:
            'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
        neutral: 'border-border bg-background text-foreground',
    }[tone];

    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}
        >
            {labelize(value)}
        </span>
    );
}

function BookingCard({ booking }: { booking: BookingSummary }) {
    const bookingHref = workspacePath(`/bookings/${booking.id}`);
    const miceHref = booking.mice_report?.id
        ? workspacePath(`/reports/mice-registry/${booking.mice_report.id}/edit`)
        : null;

    return (
        <div className="rounded-2xl border bg-background p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={bookingHref}
                            className="truncate text-base font-bold text-primary hover:underline"
                        >
                            #{booking.id} ·{' '}
                            {valueOrDash(
                                booking.title ||
                                    booking.type_of_event ||
                                    booking.company_name,
                            )}
                        </Link>
                        <StatusPill
                            value={booking.booking_status}
                            tone={
                                booking.booking_status === 'confirmed' ||
                                booking.booking_status === 'completed'
                                    ? 'good'
                                    : 'warning'
                            }
                        />
                        <StatusPill value={booking.payment_status} />
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <span className="inline-flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />{' '}
                            {formatDateRange(
                                booking.booking_date_from,
                                booking.booking_date_to,
                            )}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <Building2 className="h-4 w-4" />{' '}
                            {valueOrDash(
                                booking.selected_package_code ||
                                    booking.services?.join(', '),
                            )}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <User2 className="h-4 w-4" />{' '}
                            {valueOrDash(booking.client || booking.client_name)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <ReceiptText className="h-4 w-4" /> Guests:{' '}
                            {valueOrDash(booking.number_of_guests)}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link
                        href={bookingHref}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
                    >
                        View Booking
                    </Link>
                    {miceHref ? (
                        <Link
                            href={miceHref}
                            className="rounded-lg border px-3 py-2 text-xs font-bold transition hover:bg-muted"
                        >
                            Open MICE
                        </Link>
                    ) : null}
                </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-xs font-semibold text-muted-foreground">
                        Total Payable
                    </div>
                    <div className="text-sm font-bold">
                        {money(booking.totals?.total_payable)}
                    </div>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-xs font-semibold text-muted-foreground">
                        Confirmed Paid
                    </div>
                    <div className="text-sm font-bold">
                        {money(booking.totals?.confirmed_payments)}
                    </div>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-xs font-semibold text-muted-foreground">
                        Post-Event Charges
                    </div>
                    <div className="text-sm font-bold">
                        {money(booking.totals?.post_event_total)}
                    </div>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-xs font-semibold text-muted-foreground">
                        Remaining Balance
                    </div>
                    <div className="text-sm font-bold">
                        {money(booking.totals?.remaining_balance)}
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-xl border bg-muted/10 p-3 text-sm">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4" /> MICE Report
                </div>
                {booking.mice_report ? (
                    <div className="grid gap-2 text-muted-foreground md:grid-cols-3">
                        <span>
                            Status:{' '}
                            <strong className="text-foreground">
                                {labelize(booking.mice_report.status)}
                            </strong>
                        </span>
                        <span>
                            Reference:{' '}
                            <strong className="text-foreground">
                                {valueOrDash(
                                    booking.mice_report.reference_code,
                                )}
                            </strong>
                        </span>
                        <span>
                            Participants:{' '}
                            <strong className="text-foreground">
                                {valueOrDash(
                                    booking.mice_report.total_participants,
                                )}
                            </strong>
                        </span>
                    </div>
                ) : (
                    <p className="text-muted-foreground">
                        No linked MICE record yet for this booking.
                    </p>
                )}
            </div>
        </div>
    );
}

export default function UserShow({ user }: Props) {
    const usersIndexUrl = workspaceUsersPath();
    const userShowUrl = workspaceUsersPath(String(user.id));
    const userEditUrl = workspaceUsersPath(`${user.id}/edit`);
    const bookings = user.recent_bookings ?? [];
    const fullAddress = [
        user.address_line1,
        user.barangay,
        user.city_municipality,
        user.province,
        user.postal_code,
        user.country,
    ]
        .filter((part) => part && String(part).trim() !== '')
        .join(', ');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: usersIndexUrl },
        { title: user.name, href: userShowUrl },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User - ${user.name}`} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
                <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
                    <div className="border-b bg-gradient-to-br from-primary/10 via-background to-muted/40 p-6">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-3xl bg-primary/10 p-5 text-primary shadow-inner">
                                    <User2 className="h-10 w-10" />
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-black tracking-[0.22em] text-muted-foreground uppercase">
                                            User Profile
                                        </p>
                                        <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                                            {user.name}
                                        </h1>
                                        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                                            Complete account, organization,
                                            address, booking, payment, and MICE
                                            activity overview for this specific
                                            user.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <StatusPill
                                            value={user.role || 'No role'}
                                        />
                                        <StatusPill
                                            value={
                                                user.email_is_verified
                                                    ? 'Verified email'
                                                    : 'Not verified'
                                            }
                                            tone={
                                                user.email_is_verified
                                                    ? 'good'
                                                    : 'warning'
                                            }
                                        />
                                        {user.google_id ? (
                                            <StatusPill
                                                value="Google linked"
                                                tone="good"
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={usersIndexUrl}
                                    className="inline-flex items-center rounded-xl border bg-background px-4 py-2 text-sm font-bold transition hover:bg-muted"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Users
                                </Link>
                                <Link
                                    href={userEditUrl}
                                    className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit User
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            icon={ReceiptText}
                            label="Total Bookings"
                            value={user.bookings_count ?? 0}
                            hint="All reservations created by this user"
                        />
                        <MetricCard
                            icon={BadgeCheck}
                            label="Approved / Confirmed"
                            value={user.approved_bookings_count ?? 0}
                            hint="Approved, confirmed, active, or completed"
                        />
                        <MetricCard
                            icon={CalendarDays}
                            label="Pending Review"
                            value={user.pending_bookings_count ?? 0}
                            hint="Pending, for review, or awaiting payment"
                        />
                        <MetricCard
                            icon={ShieldCheck}
                            label="Last Login"
                            value={formatDate(user.last_login_at)}
                        />
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
                    <div className="space-y-6">
                        <div className="rounded-2xl border bg-background p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                <Mail className="h-5 w-5" /> Contact and Account
                            </h2>
                            <InfoRow label="Full Name" value={user.name} />
                            <InfoRow
                                label="First Name"
                                value={user.first_name}
                            />
                            <InfoRow
                                label="Middle Name"
                                value={user.middle_name}
                            />
                            <InfoRow label="Last Name" value={user.last_name} />
                            <InfoRow label="Email" value={user.email} />
                            <InfoRow
                                label="Phone Number"
                                value={user.phone_number}
                            />
                            <InfoRow
                                label="Role"
                                value={
                                    (user.roles?.length
                                        ? user.roles.join(', ')
                                        : user.role) || '—'
                                }
                            />
                            <InfoRow
                                label="Email Verification"
                                value={
                                    user.email_is_verified
                                        ? 'Verified'
                                        : 'Not verified'
                                }
                            />
                            <InfoRow
                                label="Google Account"
                                value={user.google_id ? 'Linked' : 'Not linked'}
                            />
                        </div>

                        <div className="rounded-2xl border bg-background p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                <Building2 className="h-5 w-5" /> Organization
                            </h2>
                            <InfoRow
                                label="Organization Name"
                                value={user.organization_name}
                            />
                            <InfoRow
                                label="Organization Type"
                                value={user.organization_type}
                            />
                            <InfoRow
                                label="Position Title"
                                value={user.position_title}
                            />
                        </div>

                        <div className="rounded-2xl border bg-background p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                <MapPin className="h-5 w-5" /> Address
                            </h2>
                            <InfoRow
                                label="Complete Address"
                                value={fullAddress}
                            />
                            <InfoRow
                                label="Address Line"
                                value={user.address_line1}
                            />
                            <InfoRow label="Barangay" value={user.barangay} />
                            <InfoRow
                                label="City / Municipality"
                                value={user.city_municipality}
                            />
                            <InfoRow label="Province" value={user.province} />
                            <InfoRow
                                label="Postal Code"
                                value={user.postal_code}
                            />
                            <InfoRow label="Country" value={user.country} />
                        </div>

                        <div className="rounded-2xl border bg-background p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-bold">
                                Account Timestamps
                            </h2>
                            <InfoRow
                                label="Created At"
                                value={formatDate(user.created_at)}
                            />
                            <InfoRow
                                label="Updated At"
                                value={formatDate(user.updated_at)}
                            />
                            <InfoRow
                                label="Last Login"
                                value={formatDate(user.last_login_at)}
                            />
                            <InfoRow
                                label="Email Verified At"
                                value={formatDate(user.email_verified_at)}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {user.latest_booking ? (
                            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
                                            Latest Booking
                                        </p>
                                        <h2 className="text-xl font-black">
                                            {valueOrDash(
                                                user.latest_booking.title ||
                                                    user.latest_booking
                                                        .type_of_event,
                                            )}
                                        </h2>
                                    </div>
                                    <Link
                                        href={workspacePath(
                                            `/bookings/${user.latest_booking.id}`,
                                        )}
                                        className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                                    >
                                        Open Latest Booking
                                    </Link>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <InfoRow
                                        label="Schedule"
                                        value={formatDateRange(
                                            user.latest_booking
                                                .booking_date_from,
                                            user.latest_booking.booking_date_to,
                                        )}
                                    />
                                    <InfoRow
                                        label="Client"
                                        value={user.latest_booking.client}
                                    />
                                    <InfoRow
                                        label="Booking Status"
                                        value={labelize(
                                            user.latest_booking.booking_status,
                                        )}
                                    />
                                    <InfoRow
                                        label="Payment Status"
                                        value={labelize(
                                            user.latest_booking.payment_status,
                                        )}
                                    />
                                </div>
                            </div>
                        ) : null}

                        <div className="rounded-2xl border bg-background p-6 shadow-sm">
                            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
                                        Booking History
                                    </p>
                                    <h2 className="text-xl font-black">
                                        Recent reservations by this user
                                    </h2>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold text-muted-foreground">
                                    <CreditCard className="h-4 w-4" />
                                    Payment + MICE summary included
                                </div>
                            </div>

                            {bookings.length ? (
                                <div className="space-y-4">
                                    {bookings.map((booking) => (
                                        <BookingCard
                                            key={booking.id}
                                            booking={booking}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                                    No bookings found for this user yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
