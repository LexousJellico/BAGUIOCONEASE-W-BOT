import BookingDeadlineBadge from '@/components/bookings/booking-deadline-badge';
import { confirmBcccAction } from '@/components/ui/bccc-confirm-dialog';
import {
    ResourceEmptyState,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
    ResourceToolbar,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Banknote,
    CalendarClock,
    CheckCircle2,
    Clock3,
    CreditCard,
    Eye,
    FileImage,
    Mail,
    MessageSquareText,
    ReceiptText,
    ShieldCheck,
    TimerOff,
    UserRound,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type PaymentStatus =
    | 'pending'
    | 'submitted'
    | 'for_review'
    | 'approved'
    | 'verified'
    | 'paid'
    | 'rejected'
    | 'declined'
    | 'expired'
    | string;

type BookingLike = {
    id: number | string;
    client_name?: string | null;
    company_name?: string | null;
    client_email?: string | null;
    type_of_event?: string | null;
    booking_status?: string | null;
    payment_status?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;

    expired_at?: string | null;
    payment_balance_due_at?: string | null;
    auto_declined_at?: string | null;
    auto_decline_reason?: string | null;
    deadline_at?: string | null;
    deadline_state?: string | null;
    deadline_label?: string | null;

    totals?: {
        items_total?: number | string | null;
        payments_total?: number | string | null;
        submitted_payments_total?: number | string | null;
        confirmed_payments_total?: number | string | null;
        remaining_balance?: number | string | null;
    } | null;

    service?: {
        name?: string | null;
        service_type?: {
            name?: string | null;
        } | null;
        serviceType?: {
            name?: string | null;
        } | null;
    } | null;
};

type PaymentRecord = {
    id: number | string;
    booking_id?: number | string | null;
    amount?: number | string | null;
    status?: PaymentStatus | null;
    payment_status?: PaymentStatus | null;
    payment_method?: string | null;
    payment_gateway?: string | null;
    payment_type?: string | null;
    transaction_reference?: string | null;
    reference_number?: string | null;
    proof_image_url?: string | null;
    proof_image?: string | null;
    receipt_url?: string | null;
    remarks?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    booking?: BookingLike | null;
};

type Paginated<T> = {
    data?: T[];
    links?: Array<{
        url?: string | null;
        label?: string | null;
        active?: boolean;
    }>;
};

type PageProps = {
    workspaceRole?: string;
    payments?: PaymentRecord[] | Paginated<PaymentRecord>;
    paymentProofs?: PaymentRecord[] | Paginated<PaymentRecord>;
    records?: PaymentRecord[] | Paginated<PaymentRecord>;
    filters?: {
        q?: string;
        status?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Payment Review', href: '/admin/payments/review' },
];

function collection<T>(value?: T[] | Paginated<T>): T[] {
    if (Array.isArray(value)) {
        return value;
    }

    return value?.data ?? [];
}

function linksOf<T>(value?: T[] | Paginated<T>) {
    if (value && !Array.isArray(value)) {
        return value.links ?? [];
    }

    return [];
}

function currentRoleBase(role?: string) {
    const normalized = String(role || '').toLowerCase();

    if (normalized === 'manager' || window.location.pathname.startsWith('/manager')) {
        return '/manager';
    }

    if (normalized === 'staff' || window.location.pathname.startsWith('/staff')) {
        return '/staff';
    }

    return '/admin';
}

function paymentReviewPath(role?: string) {
    const base = currentRoleBase(role);

    if (base === '/staff') {
        return '/staff/bookings';
    }

    return `${base}/payments/review`;
}

function bookingShowPath(role: string | undefined, bookingId: number | string) {
    const base = currentRoleBase(role);

    if (base === '/manager') {
        return `/manager/bookings/${bookingId}`;
    }

    if (base === '/staff') {
        return `/staff/bookings/${bookingId}`;
    }

    return `/admin/bookings/${bookingId}`;
}

function formatMoney(value?: number | string | null) {
    const numeric = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    }).format(Number.isFinite(numeric) ? numeric : 0);
}

function formatDateTime(value?: string | null) {
    if (!value) {
        return 'Not set';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function cleanLabel(value?: string | null) {
    return String(value || 'Not set')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusOf(payment: PaymentRecord) {
    return String(payment.status || payment.payment_status || 'pending').toLowerCase();
}

function statusClass(status?: string | null) {
    const normalized = String(status || '').toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');

    if (['approved', 'verified', 'paid', 'completed', 'settled'].includes(normalized)) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200';
    }

    if (['rejected', 'declined', 'failed', 'expired'].includes(normalized)) {
        return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200';
}

function proofUrl(payment: PaymentRecord) {
    return payment.proof_image_url || payment.proof_image || payment.receipt_url || '';
}

function clientName(booking?: BookingLike | null) {
    return booking?.company_name || booking?.client_name || 'Client not set';
}

function serviceName(booking?: BookingLike | null) {
    return (
        booking?.service?.service_type?.name ||
        booking?.service?.serviceType?.name ||
        booking?.service?.name ||
        'Venue not set'
    );
}

function remainingBalance(booking?: BookingLike | null) {
    const explicit = booking?.totals?.remaining_balance;

    if (explicit !== null && explicit !== undefined) {
        return Number(explicit);
    }

    const total = Number(booking?.totals?.items_total ?? 0);
    const paid = Number(booking?.totals?.confirmed_payments_total ?? booking?.totals?.payments_total ?? 0);

    return Math.max(total - paid, 0);
}

function Pagination({
    links,
}: {
    links: Array<{
        url?: string | null;
        label?: string | null;
        active?: boolean;
    }>;
}) {
    if (!links.length) {
        return null;
    }

    return (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
            {links.map((link, index) => {
                const label = String(link.label || '')
                    .replace(/<[^>]*>/g, '')
                    .replace(/«|»/g, '')
                    .trim();

                if (!link.url) {
                    return (
                        <span
                            key={`${label}-${index}`}
                            className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[#d9c7a6]/40 bg-[#fffaf0]/50 px-4 text-sm font-semibold text-[#8a7a63] dark:border-white/10 dark:bg-white/[0.035] dark:text-white/35"
                        >
                            {label}
                        </span>
                    );
                }

                return (
                    <Link
                        key={`${label}-${index}`}
                        href={link.url}
                        preserveScroll
                        preserveState
                        className={
                            link.active
                                ? 'inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[#2f2517] px-4 text-sm font-semibold text-white dark:bg-white dark:text-[#17120b]'
                                : 'inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12'
                        }
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}

export function PaymentReviewPage() {
    const { props } = usePage<PageProps>();
    const role = props.workspaceRole || 'admin';

    const raw = props.payments ?? props.paymentProofs ?? props.records;
    const records = useMemo(() => collection<PaymentRecord>(raw), [raw]);
    const links = useMemo(() => linksOf<PaymentRecord>(raw), [raw]);

    const [q, setQ] = useState(String(props.filters?.q ?? ''));
    const [status, setStatus] = useState(String(props.filters?.status ?? ''));

    const pendingCount = records.filter((payment) =>
        ['pending', 'submitted', 'for_review', 'awaiting_review'].includes(statusOf(payment).replaceAll(' ', '_')),
    ).length;

    const approvedCount = records.filter((payment) =>
        ['approved', 'verified', 'paid', 'completed', 'settled'].includes(statusOf(payment)),
    ).length;

    const rejectedCount = records.filter((payment) =>
        ['rejected', 'declined', 'failed', 'expired'].includes(statusOf(payment)),
    ).length;

    const totalAmount = records.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

    function search() {
        router.get(
            paymentReviewPath(role),
            {
                q: q || undefined,
                status: status || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    async function updatePayment(payment: PaymentRecord, nextStatus: 'approved' | 'rejected') {
        const isApproval = nextStatus === 'approved';
        const confirmed = await confirmBcccAction({
            title: isApproval ? 'Approve payment proof?' : 'Reject payment proof?',
            message: isApproval
                ? 'This will mark the submitted proof as approved and update the payment review status.'
                : 'This will reject the submitted payment proof. The user can submit a corrected payment proof when needed.',
            confirmText: isApproval ? 'Approve Payment' : 'Reject Payment',
            cancelText: 'Cancel',
            tone: isApproval ? 'success' : 'danger',
        });

        if (!confirmed) {
            return;
        }

        router.put(
            `${paymentReviewPath(role)}/${payment.id}`,
            {
                status: nextStatus,
            },
            {
                preserveScroll: true,
            },
        );
    }

    return (
        <ResourcePageShell
            title="Payment Review"
            eyebrow="Finance Review"
            icon={CreditCard}
            breadcrumbs={breadcrumbs}
            subtitle="Review submitted payment proofs, compare remaining balances, verify deadline status, and approve or reject payment records."
            actions={
                <Link
                    href={`${currentRoleBase(role)}/bookings`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                >
                    <ReceiptText className="h-4 w-4" />
                    Booking Records
                </Link>
            }
        >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ResourceStatCard
                    label="For Review"
                    value={pendingCount}
                    description="Payment proofs needing action."
                    icon={Clock3}
                />

                <ResourceStatCard
                    label="Approved"
                    value={approvedCount}
                    description="Verified payment records."
                    icon={CheckCircle2}
                />

                <ResourceStatCard
                    label="Rejected"
                    value={rejectedCount}
                    description="Declined or invalid proofs."
                    icon={XCircle}
                />

                <ResourceStatCard
                    label="Loaded Amount"
                    value={formatMoney(totalAmount)}
                    description="Total amount from loaded records."
                    icon={Banknote}
                />
            </div>

            <div className="mt-5">
                <ResourceSection
                    title="Payment proof queue"
                    eyebrow="Review Desk"
                    description="Each card includes the proof image, payment metadata, linked booking, and current deadline state."
                >
                    <ResourceToolbar
                        searchPlaceholder="Search client, reference, event, or payment status..."
                        searchValue={q}
                        onSearchChange={setQ}
                        onSearchSubmit={search}
                        right={
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] outline-none dark:border-white/10 dark:bg-white/7 dark:text-white"
                                >
                                    <option value="">All statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="for_review">For review</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="expired">Expired</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={search}
                                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                >
                                    Search
                                </button>
                            </div>
                        }
                    />

                    {records.length === 0 ? (
                        <ResourceEmptyState
                            icon={CreditCard}
                            title="No payment proofs for review"
                            description="Submitted payment proofs will appear here when clients upload them."
                        />
                    ) : (
                        <div className="grid gap-4">
                            {records.map((payment) => (
                                <PaymentReviewCard
                                    key={payment.id}
                                    payment={payment}
                                    role={role}
                                    onApprove={() => updatePayment(payment, 'approved')}
                                    onReject={() => updatePayment(payment, 'rejected')}
                                />
                            ))}
                        </div>
                    )}

                    <Pagination links={links} />
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}

function PaymentReviewCard({
    payment,
    role,
    onApprove,
    onReject,
}: {
    payment: PaymentRecord;
    role?: string;
    onApprove: () => void;
    onReject: () => void;
}) {
    const booking = payment.booking;
    const status = statusOf(payment);
    const proof = proofUrl(payment);

    return (
        <article className="overflow-hidden rounded-[1.45rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/72 shadow-[0_18px_58px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.035]">
            <div className="grid gap-0 xl:grid-cols-[18rem_1fr]">
                <div className="border-b border-[#eadcc2]/80 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.035] xl:border-b-0 xl:border-r">
                    {proof ? (
                        <a
                            href={proof}
                            target="_blank"
                            rel="noreferrer"
                            className="group block overflow-hidden rounded-[1.1rem] border border-[#eadcc2]/80 bg-white dark:border-white/10 dark:bg-white/[0.035]"
                        >
                            <img
                                src={proof}
                                alt="Payment proof"
                                className="h-72 w-full object-cover transition duration-300 group-hover:scale-[1.03] xl:h-full"
                            />

                            <div className="flex items-center justify-between gap-3 border-t border-[#eadcc2]/80 p-3 text-sm font-semibold text-[#2f2517] dark:border-white/10 dark:text-white">
                                <span className="inline-flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    View proof
                                </span>
                                <FileImage className="h-4 w-4 text-[#9d7b3d] dark:text-[#f1d89b]" />
                            </div>
                        </a>
                    ) : (
                        <div className="grid h-72 place-items-center rounded-[1.1rem] border border-dashed border-[#d9c7a6]/80 bg-[#fffaf0]/72 p-6 text-center dark:border-white/10 dark:bg-white/[0.035]">
                            <div>
                                <FileImage className="mx-auto h-10 w-10 text-[#b08d48] dark:text-[#f1d89b]" />
                                <p className="mt-3 text-sm font-semibold text-[#21180d] dark:text-white">
                                    No proof image
                                </p>
                                <p className="mt-1 text-xs leading-5 text-[#6e604c] dark:text-white/52">
                                    This record has no uploaded proof image.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass(status)}`}
                                >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    {cleanLabel(status)}
                                </span>

                                {booking ? <BookingDeadlineBadge booking={booking} compact /> : null}

                                <span className="rounded-full border border-[#d9c7a6]/70 bg-white px-3 py-1.5 text-xs font-bold text-[#7a5a24] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                                    Payment #{payment.id}
                                </span>
                            </div>

                            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[#21180d] dark:text-white">
                                {clientName(booking)}
                            </h3>

                            <p className="mt-2 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                {booking?.type_of_event || 'No event title'} · {serviceName(booking)}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                            {booking?.id ? (
                                <Link
                                    href={bookingShowPath(role, booking.id)}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                >
                                    <ReceiptText className="h-4 w-4" />
                                    Open Booking
                                </Link>
                            ) : null}

                            {!['approved', 'verified', 'paid', 'completed', 'settled'].includes(status) ? (
                                <button
                                    type="button"
                                    onClick={onApprove}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve
                                </button>
                            ) : null}

                            {!['rejected', 'declined', 'failed'].includes(status) ? (
                                <button
                                    type="button"
                                    onClick={onReject}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InfoBox
                            icon={Banknote}
                            label="Amount"
                            value={formatMoney(payment.amount)}
                        />

                        <InfoBox
                            icon={CreditCard}
                            label="Method"
                            value={payment.payment_method || payment.payment_gateway || 'Not set'}
                        />

                        <InfoBox
                            icon={MessageSquareText}
                            label="Reference"
                            value={payment.transaction_reference || payment.reference_number || 'Not set'}
                        />

                        <InfoBox
                            icon={Clock3}
                            label="Submitted"
                            value={formatDateTime(payment.created_at)}
                        />
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InfoBox
                            icon={UserRound}
                            label="Client"
                            value={booking?.client_name || booking?.company_name || 'Not set'}
                        />

                        <InfoBox
                            icon={Mail}
                            label="Email"
                            value={booking?.client_email || 'Not set'}
                        />

                        <InfoBox
                            icon={CalendarClock}
                            label="Event Date"
                            value={formatDateTime(booking?.booking_date_from)}
                        />

                        <InfoBox
                            icon={TimerOff}
                            label="Remaining Balance"
                            value={formatMoney(remainingBalance(booking))}
                        />
                    </div>

                    {payment.remarks ? (
                        <div className="mt-4 rounded-[1.1rem] border border-[#eadcc2]/80 bg-white/70 p-4 text-sm leading-7 text-[#6e604c] dark:border-white/10 dark:bg-white/[0.035] dark:text-white/56">
                            <strong className="font-semibold text-[#21180d] dark:text-white">Remarks:</strong>{' '}
                            {payment.remarks}
                        </div>
                    ) : null}

                    {booking?.auto_decline_reason ? (
                        <div className="mt-4 rounded-[1.1rem] border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                            <strong className="font-semibold">Deadline note:</strong>{' '}
                            {booking.auto_decline_reason}
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function InfoBox({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Banknote;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[1rem] border border-[#eadcc2]/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="h-4 w-4 text-[#9d7b3d] dark:text-[#f1d89b]" />

            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </p>

            <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#21180d] dark:text-white">
                {value}
            </p>
        </div>
    );
}

export default PaymentReviewPage;
