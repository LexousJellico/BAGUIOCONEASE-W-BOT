import BookingStatusBadge from '@/components/bookings/booking-status-badge';
import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    CreditCard,
    FileImage,
    Flag,
    ReceiptText,
    ShieldAlert,
    UserCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type BookingItem = {
    service_id?: number | null;
    service_name?: string | null;
    area?: string | null;
    line_total?: number | null;
};

type BookingPayment = {
    id: number;
    status?: string | null;
    payment_method?: string | null;
    payment_gateway?: string | null;
    payment_type?: string | null;
    amount?: number | null;
    transaction_reference?: string | null;
    remarks?: string | null;
    proof_image_url?: string | null;
    payer_name?: string | null;
    card_last_four?: string | null;
    marketing_consent?: boolean | null;
    paid_at?: string | null;
    created_at?: string | null;
};

type BookingLifecycleEvent = {
    id: number;
    event_key?: string | null;
    title?: string | null;
    from_status?: string | null;
    to_status?: string | null;
    from_payment_status?: string | null;
    to_payment_status?: string | null;
    reason?: string | null;
    meta?: Record<string, unknown> | null;
    event_at?: string | null;
    created_at?: string | null;
    actor?: {
        id?: number | null;
        name?: string | null;
        email?: string | null;
    } | null;
};

type BookingPayload = {
    id: number;
    company_name?: string | null;
    client_name?: string | null;
    client_contact_number?: string | null;
    client_email?: string | null;
    survey_email?: string | null;
    survey_proof_image_url?: string | null;
    client_address?: string | null;
    head_of_organization?: string | null;
    type_of_event?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
    number_of_guests?: number | null;
    booking_status?: string | null;
    payment_status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    items?: BookingItem[];
    payments?: BookingPayment[];
    lifecycle_events?: BookingLifecycleEvent[];
    totals?: {
        items_total?: number | null;
        submitted_payments_total?: number | null;
        confirmed_payments_total?: number | null;
        remaining_balance?: number | null;
    } | null;
};

type ProgressStep = {
    key: string;
    title: string;
    description: string;
    complete: boolean;
    icon: LucideIcon;
};

type TimelineEntry = {
    key: string;
    title: string;
    when: string;
    note: string;
    tone: string;
    icon: LucideIcon;
};

type Props = {
    booking: BookingPayload;
    compact?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function formatMoney(value?: number | null): string {
    return Number(value ?? 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDateTime(value?: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function paymentIsConfirmed(payment: BookingPayment): boolean {
    return ['confirmed', 'paid', 'approved'].includes(String(payment.status ?? '').toLowerCase());
}

function latestPayment(payments?: BookingPayment[]): BookingPayment | null {
    const list = [...(payments ?? [])].filter((payment) => payment.created_at || payment.paid_at);

    list.sort((a, b) => {
        const aTime = new Date(a.paid_at ?? a.created_at ?? '').getTime();
        const bTime = new Date(b.paid_at ?? b.created_at ?? '').getTime();

        return bTime - aTime;
    });

    return list[0] ?? null;
}

function stepsForBooking(booking: BookingPayload): ProgressStep[] {
    const bookingStatus = String(booking.booking_status ?? 'pending').toLowerCase();
    const paymentStatus = String(booking.payment_status ?? 'unpaid').toLowerCase();
    const hasSchedule = Boolean(booking.booking_date_from && booking.booking_date_to);
    const hasProof = Boolean(booking.survey_proof_image_url);
    const payments = booking.payments ?? [];
    const hasPaymentSubmission = payments.length > 0;
    const hasConfirmedPayment = payments.some(paymentIsConfirmed);
    const approvedStatuses = new Set(['active', 'approved', 'confirmed', 'completed']);
    const completeStatuses = new Set(['completed', 'closed', 'done']);

    return [
        {
            key: 'created',
            title: 'Booking submitted',
            description: booking.created_at
                ? `Recorded on ${formatDateTime(booking.created_at)}`
                : 'Booking record has been created.',
            complete: true,
            icon: ClipboardList,
        },
        {
            key: 'schedule',
            title: 'Schedule selected',
            description: hasSchedule
                ? `${formatDateTime(booking.booking_date_from)} → ${formatDateTime(booking.booking_date_to)}`
                : 'The booking still needs a complete event schedule.',
            complete: hasSchedule,
            icon: CalendarDays,
        },
        {
            key: 'mice-report',
            title: 'MICE/report proof ready',
            description: hasProof
                ? 'MICE/report proof image is attached.'
                : 'MICE/report proof image is still missing or not yet replaced.',
            complete: hasProof,
            icon: FileImage,
        },
        {
            key: 'payment-submitted',
            title: 'Payment submitted',
            description: hasPaymentSubmission
                ? `${payments.length} payment entr${payments.length > 1 ? 'ies' : 'y'} recorded.`
                : 'No payment submission has been recorded yet.',
            complete: hasPaymentSubmission,
            icon: ReceiptText,
        },
        {
            key: 'payment-confirmed',
            title: 'Payment confirmed',
            description:
                hasConfirmedPayment || paymentStatus === 'paid'
                    ? 'At least one payment is already confirmed.'
                    : 'Payment confirmation is still pending.',
            complete: hasConfirmedPayment || paymentStatus === 'paid' || paymentStatus === 'partial',
            icon: CreditCard,
        },
        {
            key: 'status-progress',
            title: 'Booking approved / active',
            description: approvedStatuses.has(bookingStatus)
                ? `Current booking status is ${bookingStatus}.`
                : 'Booking is still waiting for full operational approval.',
            complete: approvedStatuses.has(bookingStatus),
            icon: Flag,
        },
        {
            key: 'completed',
            title: 'Booking completed',
            description: completeStatuses.has(bookingStatus)
                ? 'Booking has been marked completed.'
                : 'Booking has not yet been completed.',
            complete: completeStatuses.has(bookingStatus),
            icon: CheckCircle2,
        },
    ];
}

function lifecycleTone(event: BookingLifecycleEvent): string {
    const key = String(event.event_key ?? '').toLowerCase();
    const toStatus = String(event.to_status ?? '').toLowerCase();

    if (key.includes('auto_deleted') || toStatus === 'deleted') {
        return 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100';
    }

    if (key.includes('payment') || event.to_payment_status) {
        return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100';
    }

    if (toStatus === 'confirmed' || toStatus === 'active' || toStatus === 'completed' || toStatus === 'approved') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100';
    }

    if (toStatus === 'declined' || toStatus === 'cancelled' || toStatus === 'canceled') {
        return 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100';
    }

    return 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100';
}

function lifecycleIcon(event: BookingLifecycleEvent): LucideIcon {
    const key = String(event.event_key ?? '').toLowerCase();
    const toStatus = String(event.to_status ?? '').toLowerCase();

    if (key.includes('payment')) {
        return CreditCard;
    }

    if (key.includes('created')) {
        return ClipboardList;
    }

    if (key.includes('updated')) {
        return ShieldAlert;
    }

    if (toStatus === 'completed') {
        return CheckCircle2;
    }

    if (toStatus === 'active' || toStatus === 'approved' || toStatus === 'confirmed') {
        return Clock3;
    }

    if (toStatus === 'declined' || toStatus === 'cancelled' || toStatus === 'deleted') {
        return Flag;
    }

    return CalendarDays;
}

function fallbackTimelineEntries(booking: BookingPayload): TimelineEntry[] {
    const entries: TimelineEntry[] = [];

    if (booking.created_at) {
        entries.push({
            key: 'created',
            title: 'Booking record created',
            when: formatDateTime(booking.created_at),
            note: `Client: ${booking.client_name ?? '—'} • Event: ${booking.type_of_event ?? '—'}`,
            tone: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100',
            icon: ClipboardList,
        });
    }

    if (booking.survey_proof_image_url) {
        entries.push({
            key: 'proof',
            title: 'MICE/report proof available',
            when: booking.updated_at ? formatDateTime(booking.updated_at) : 'Attached',
            note: booking.survey_email ? `Report email: ${booking.survey_email}` : 'MICE/report proof image is attached.',
            tone: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100',
            icon: FileImage,
        });
    }

    (booking.payments ?? []).forEach((payment) => {
        entries.push({
            key: `payment-${payment.id}`,
            title: `Payment ${String(payment.status ?? 'submitted').toUpperCase()}`,
            when: formatDateTime(payment.paid_at ?? payment.created_at),
            note: `₱ ${formatMoney(payment.amount)} • ${
                payment.payment_gateway ?? payment.payment_method ?? 'payment'
            }${payment.transaction_reference ? ` • Ref ${payment.transaction_reference}` : ''}`,
            tone: paymentIsConfirmed(payment)
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100'
                : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100',
            icon: CreditCard,
        });
    });

    if (booking.booking_date_from || booking.booking_date_to) {
        entries.push({
            key: 'schedule',
            title: 'Scheduled event window',
            when: formatDateTime(booking.booking_date_from),
            note: `${formatDateTime(booking.booking_date_from)} → ${formatDateTime(booking.booking_date_to)}`,
            tone: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100',
            icon: CalendarDays,
        });
    }

    return entries;
}

function buildAuditEntries(booking: BookingPayload): TimelineEntry[] {
    const lifecycle = [...(booking.lifecycle_events ?? [])]
        .filter((entry) => entry.event_at || entry.created_at)
        .sort((a, b) => {
            const aTime = new Date(a.event_at ?? a.created_at ?? '').getTime();
            const bTime = new Date(b.event_at ?? b.created_at ?? '').getTime();

            return aTime - bTime;
        });

    if (lifecycle.length === 0) {
        return fallbackTimelineEntries(booking);
    }

    return lifecycle.map((event) => {
        const Icon = lifecycleIcon(event);
        const changes: string[] = [];

        if (event.from_status || event.to_status) {
            changes.push(`Status: ${event.from_status ?? '—'} → ${event.to_status ?? '—'}`);
        }

        if (event.from_payment_status || event.to_payment_status) {
            changes.push(`Payment: ${event.from_payment_status ?? '—'} → ${event.to_payment_status ?? '—'}`);
        }

        const actorName = event.actor?.name || event.actor?.email || 'System automation';
        const reason = event.reason ? `${event.reason}` : '';
        const note = [reason, changes.join(' • '), `Actor: ${actorName}`].filter(Boolean).join(' • ');

        return {
            key: `lifecycle-${event.id}`,
            title: event.title || 'Lifecycle event',
            when: formatDateTime(event.event_at ?? event.created_at),
            note,
            tone: lifecycleTone(event),
            icon: Icon,
        };
    });
}

function FinancialCard({
    label,
    value,
    emphasis = false,
}: {
    label: string;
    value: string;
    emphasis?: boolean;
}) {
    return (
        <div
            className={cx(
                'rounded-[1.2rem] border p-4',
                emphasis
                    ? 'border-[#b08d48]/70 bg-[#2f2517] text-white shadow-[0_16px_40px_rgba(47,37,23,0.18)] dark:border-white/20 dark:bg-white dark:text-[#17120b]'
                    : 'border-[#d9c7a6]/70 bg-[#f7f0e3]/78 text-[#21180d] dark:border-white/10 dark:bg-white/7 dark:text-white',
            )}
        >
            <p className={cx('text-[10px] font-bold uppercase tracking-[0.2em]', emphasis ? 'opacity-70' : 'text-[#9d7b3d] dark:text-[#f1d89b]')}>
                {label}
            </p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.04em]">₱ {value}</p>
        </div>
    );
}

export default function BookingProgressPanel({ booking, compact = false }: Props) {
    const itemsTotal = Number(booking.totals?.items_total ?? 0);
    const submittedTotal = Number(booking.totals?.submitted_payments_total ?? 0);
    const confirmedTotal = Number(booking.totals?.confirmed_payments_total ?? 0);
    const outstanding = Math.max(Number(booking.totals?.remaining_balance ?? itemsTotal - confirmedTotal), 0);

    const steps = stepsForBooking(booking);
    const completedSteps = steps.filter((step) => step.complete).length;
    const percent = Math.round((completedSteps / steps.length) * 100);
    const auditEntries = buildAuditEntries(booking);
    const latest = latestPayment(booking.payments);

    return (
        <section className={cx('grid gap-4', compact ? 'lg:grid-cols-1' : 'xl:grid-cols-[1fr_0.82fr]')}>
            <div className="overflow-hidden rounded-[1.65rem] border border-[#d9c7a6]/70 bg-white/86 p-4 shadow-[0_18px_54px_rgba(47,37,23,0.09)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Booking Progress
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                            Operational completion status
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-[#6e604c] dark:text-white/58">
                            This panel summarizes booking readiness, schedule state, proof state, payment progress, and approval movement.
                        </p>
                    </div>

                    <div className="shrink-0 rounded-[1.25rem] border border-[#d9c7a6]/70 bg-[#f7f0e3] p-4 text-center dark:border-white/10 dark:bg-white/7">
                        <p className="text-3xl font-semibold tracking-[-0.06em] text-[#21180d] dark:text-white">
                            {percent}%
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Complete
                        </p>
                    </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eadcc2] dark:bg-white/10">
                    <div
                        className="h-full rounded-full bg-[#9d7b3d] transition-all duration-500 dark:bg-[#f1d89b]"
                        style={{ width: `${percent}%` }}
                    />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {steps.map((step) => {
                        const Icon = step.icon;

                        return (
                            <div
                                key={step.key}
                                className={cx(
                                    'rounded-[1.25rem] border p-4 transition',
                                    step.complete
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100'
                                        : 'border-[#d9c7a6]/70 bg-[#f7f0e3]/70 text-[#4a3b27] dark:border-white/10 dark:bg-white/7 dark:text-white/66',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className={cx(
                                            'grid h-10 w-10 shrink-0 place-items-center rounded-full',
                                            step.complete
                                                ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-200'
                                                : 'bg-white/70 text-[#9d7b3d] dark:bg-white/10 dark:text-[#f1d89b]',
                                        )}
                                    >
                                        <Icon className="h-4.5 w-4.5" />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-sm font-semibold">{step.title}</h4>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-65">
                                                {step.complete ? 'Done' : 'Waiting'}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-xs leading-5 opacity-75">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-4">
                <div className="overflow-hidden rounded-[1.65rem] border border-[#d9c7a6]/70 bg-white/86 p-4 shadow-[0_18px_54px_rgba(47,37,23,0.09)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        Financial Snapshot
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <FinancialCard label="Items Total" value={formatMoney(itemsTotal)} />
                        <FinancialCard label="Submitted" value={formatMoney(submittedTotal)} />
                        <FinancialCard label="Confirmed" value={formatMoney(confirmedTotal)} />
                        <FinancialCard label="Outstanding" value={formatMoney(outstanding)} emphasis />
                    </div>

                    <div className="mt-4 rounded-[1.25rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/72 p-4 dark:border-white/10 dark:bg-white/7">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            <ReceiptText className="h-3.5 w-3.5" />
                            Latest Payment Activity
                        </div>

                        {latest ? (
                            <div className="mt-3">
                                <p className="text-lg font-semibold tracking-[-0.035em] text-[#21180d] dark:text-white">
                                    ₱ {formatMoney(latest.amount)} • {latest.payment_gateway ?? latest.payment_method ?? 'Payment'}
                                </p>

                                <div className="mt-2">
                                    <BookingStatusBadge value={latest.status ?? 'submitted'} compact />
                                </div>

                                <p className="mt-2 text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                    {formatDateTime(latest.paid_at ?? latest.created_at)}
                                    {latest.transaction_reference ? ` • Reference: ${latest.transaction_reference}` : ''}
                                    {latest.payer_name ? ` • Payer: ${latest.payer_name}` : ''}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                No payment activity recorded yet.
                            </p>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-[1.65rem] border border-[#d9c7a6]/70 bg-white/86 p-4 shadow-[0_18px_54px_rgba(47,37,23,0.09)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        Quick Status Snapshot
                    </p>

                    <div className="mt-4 grid gap-3">
                        <div className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/72 p-3 dark:border-white/10 dark:bg-white/7">
                            <span className="text-sm text-[#6e604c] dark:text-white/58">Booking status</span>
                            <BookingStatusBadge value={booking.booking_status} compact />
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/72 p-3 dark:border-white/10 dark:bg-white/7">
                            <span className="text-sm text-[#6e604c] dark:text-white/58">Payment status</span>
                            <BookingStatusBadge value={booking.payment_status} compact />
                        </div>

                        <div className="rounded-[1.15rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/72 p-3 dark:border-white/10 dark:bg-white/7">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#21180d] dark:text-white">
                                <CalendarDays className="h-4 w-4 text-[#9d7b3d] dark:text-[#f1d89b]" />
                                Event Window
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                {formatDateTime(booking.booking_date_from)} → {formatDateTime(booking.booking_date_to)}
                            </p>
                        </div>

                        <div className="rounded-[1.15rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/72 p-3 dark:border-white/10 dark:bg-white/7">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#21180d] dark:text-white">
                                <UserCircle2 className="h-4 w-4 text-[#9d7b3d] dark:text-[#f1d89b]" />
                                Client
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                {booking.client_name ?? booking.company_name ?? '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cx('overflow-hidden rounded-[1.65rem] border border-[#d9c7a6]/70 bg-white/86 p-4 shadow-[0_18px_54px_rgba(47,37,23,0.09)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]', compact ? '' : 'xl:col-span-2')}>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                    Lifecycle Audit Trail
                </p>

                {auditEntries.length > 0 ? (
                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {auditEntries.map((entry) => {
                            const Icon = entry.icon;

                            return (
                                <article key={entry.key} className={cx('rounded-[1.25rem] border p-4', entry.tone)}>
                                    <div className="flex items-start gap-3">
                                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/65 text-current dark:bg-white/10">
                                            <Icon className="h-4.5 w-4.5" />
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-semibold">{entry.title}</h4>
                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] opacity-60">
                                                {entry.when}
                                            </p>
                                            <p className="mt-2 text-xs leading-5 opacity-78">
                                                {entry.note || 'No additional note.'}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="mt-4 rounded-[1.25rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/72 p-4 text-sm leading-6 text-[#6e604c] dark:border-white/10 dark:bg-white/7 dark:text-white/58">
                        No lifecycle audit entries are available yet.
                    </p>
                )}
            </div>
        </section>
    );
}

export type { BookingPayload };
