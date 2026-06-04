import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import { confirmBcccAction } from '@/components/ui/bccc-confirm-dialog';
import {
    cleanLabel,
    formatDateTime,
    formatMoney,
    normalizeWorkspaceRole,
    type BookingLike,
} from '@/lib/booking-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    CheckCircle2,
    ClipboardCheck,
    FileWarning,
    LoaderCircle,
    LockKeyhole,
    ReceiptText,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

type PostEventCharge = {
    id?: number | string;
    category?: string | null;
    label?: string | null;
    amount?: number | string | null;
    status?: string | null;
    notes?: string | null;
    assessed_at?: string | null;
};

type BillingSummary = {
    base_total?: number | string | null;
    base_subtotal?: number | string | null;
    discount_total?: number | string | null;
    post_event_total?: number | string | null;
    total_with_post_event?: number | string | null;
    paid?: number | string | null;
    pending?: number | string | null;
    balance?: number | string | null;
    required_down_payment?: number | string | null;
    required_bond?: number | string | null;
    bond_status?: string | null;
    bond_paid?: boolean;
    down_payment_paid?: boolean;
    confirmation_ready?: boolean;
    down_payment_due_at?: string | null;
    balance_due_at?: string | null;
    final_computation_locked_at?: string | null;
};

type BookingApprovalPanelProps = {
    role?: string | null;
    booking: BookingLike & {
        billing_summary?: BillingSummary | null;
        post_event_charges?: PostEventCharge[];
        finalized_total?: number | string | null;
        required_down_payment_amount?: number | string | null;
        required_bond_amount?: number | string | null;
        bond_status?: string | null;
        billing_notes?: string | null;
    };
    canManagePayments?: boolean;
};

type BillingForm = {
    base_subtotal: string;
    discount_total: string;
    finalized_total: string;
    required_down_payment_amount: string;
    required_bond_amount: string;
    bond_status: string;
    bond_waiver_reason: string;
    billing_notes: string;
    lock_final_computation: boolean;
};

type ChargeForm = {
    category: string;
    label: string;
    amount: string;
    status: string;
    notes: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function roleBase(role: RoleThemeKey) {
    if (role === 'admin') return '/admin';
    if (role === 'manager') return '/manager';
    return '/admin';
}

function approvalPath(
    role: RoleThemeKey,
    bookingId: number | string,
    action: string,
) {
    return `${roleBase(role)}/bookings/${bookingId}/approval/${action}`;
}

function billingPath(role: RoleThemeKey, bookingId: number | string) {
    return `${roleBase(role)}/bookings/${bookingId}/billing`;
}

function postEventPath(
    role: RoleThemeKey,
    bookingId: number | string,
    chargeId?: number | string,
) {
    const base = `${roleBase(role)}/bookings/${bookingId}/post-event-charges`;
    return chargeId ? `${base}/${chargeId}` : base;
}

function Metric({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: string;
    tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
    return (
        <article
            className={cx(
                'rounded-[1rem] border p-4',
                tone === 'good' && 'border-emerald-300/40 bg-emerald-400/10',
                tone === 'warn' && 'border-amber-300/50 bg-amber-400/10',
                tone === 'bad' && 'border-rose-300/40 bg-rose-400/10',
                tone === 'default' &&
                    'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)]',
            )}
        >
            <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--bccc-backend-muted)] uppercase">
                {label}
            </p>
            <strong className="mt-2 block text-lg font-semibold tracking-[-0.04em] text-[var(--bccc-backend-text)]">
                {value}
            </strong>
        </article>
    );
}

function DecisionButton({
    busy,
    icon,
    label,
    tone,
    onClick,
}: {
    busy: boolean;
    icon: React.ReactNode;
    label: string;
    tone: 'dark' | 'good' | 'warn' | 'bad';
    onClick: () => void | Promise<void>;
}) {
    return (
        <button
            type="button"
            disabled={busy}
            onClick={onClick}
            className={cx(
                'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60',
                tone === 'dark' &&
                    'bg-[#2f2517] text-white hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]',
                tone === 'good' &&
                    'bg-emerald-600 text-white hover:bg-emerald-700',
                tone === 'warn' &&
                    'bg-amber-500 text-[#21180d] hover:bg-amber-600',
                tone === 'bad' && 'bg-rose-600 text-white hover:bg-rose-700',
            )}
        >
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : icon}
            {label}
        </button>
    );
}

export default function BookingApprovalPanel({
    role,
    booking,
    canManagePayments = false,
}: BookingApprovalPanelProps) {
    const normalizedRole = normalizeWorkspaceRole(role) as RoleThemeKey;
    const canUsePanel =
        canManagePayments && ['admin', 'manager'].includes(normalizedRole);
    const summary = booking.billing_summary || {};
    const charges = Array.isArray(booking.post_event_charges)
        ? booking.post_event_charges
        : [];
    const [busyAction, setBusyAction] = useState<string | null>(null);
    const [
        cancelAfterOfficeHoursDayBefore,
        setCancelAfterOfficeHoursDayBefore,
    ] = useState(false);

    const baseTotal = numberValue(
        summary.base_total ??
            booking.finalized_total ??
            booking.totals?.items_total,
    );
    const requiredDown = numberValue(
        summary.required_down_payment ??
            booking.required_down_payment_amount ??
            baseTotal * 0.5,
    );
    const requiredBond = numberValue(
        summary.required_bond ?? booking.required_bond_amount ?? 10000,
    );
    const paid = numberValue(
        summary.paid ??
            booking.totals?.confirmed_payments_total ??
            booking.totals?.payments_total,
    );
    const postEventTotal = numberValue(summary.post_event_total);
    const balance = numberValue(
        summary.balance ?? booking.totals?.remaining_balance,
    );

    const billing = useForm<BillingForm>({
        base_subtotal: String((summary.base_subtotal ?? baseTotal) || ''),
        discount_total: String(summary.discount_total ?? '0'),
        finalized_total: String(
            (summary.base_total ?? booking.finalized_total ?? baseTotal) || '',
        ),
        required_down_payment_amount: String(requiredDown || ''),
        required_bond_amount: String(requiredBond || ''),
        bond_status: String(
            summary.bond_status ?? booking.bond_status ?? 'pending',
        ),
        bond_waiver_reason: '',
        billing_notes: String(booking.billing_notes ?? ''),
        lock_final_computation: false,
    });

    const charge = useForm<ChargeForm>({
        category: 'post_event',
        label: '',
        amount: '',
        status: 'assessed',
        notes: '',
    });

    const confirmationReady =
        Boolean(summary.confirmation_ready) ||
        (requiredDown > 0 && paid >= requiredDown);
    const bondReady =
        Boolean(summary.bond_paid) ||
        ['paid', 'posted', 'settled', 'waived'].includes(
            String(
                summary.bond_status ?? booking.bond_status ?? '',
            ).toLowerCase(),
        );

    const statusHelp = useMemo(() => {
        if (!confirmationReady)
            return 'Confirm at least the required down payment plus bond before confirming the reservation.';
        if (!bondReady)
            return 'Bond is still pending or not waived. The booking may be confirmed, but keep this visible for final compliance.';
        return 'Payment threshold and bond status are ready for reservation confirmation.';
    }, [confirmationReady, bondReady]);

    if (!canUsePanel) {
        return null;
    }

    async function postDecision(
        action: string,
        message: string,
        extra: Record<string, unknown> = {},
    ) {
        const confirmed = await confirmBcccAction({
            title:
                action === 'cancel'
                    ? 'Cancel booking?'
                    : action === 'confirm'
                      ? 'Confirm booking?'
                      : action === 'decline'
                        ? 'Decline booking?'
                        : 'Confirm booking action?',
            message,
            confirmText:
                action === 'cancel'
                    ? 'Cancel Booking'
                    : action === 'decline'
                      ? 'Decline'
                      : action === 'confirm'
                        ? 'Confirm'
                        : 'Continue',
            cancelText: 'Stay',
            tone:
                action === 'cancel' || action === 'decline'
                    ? 'danger'
                    : action === 'confirm' || action === 'complete'
                      ? 'success'
                      : 'warning',
        });

        if (!confirmed) return;

        setBusyAction(action);
        router.post(
            approvalPath(normalizedRole, booking.id, action),
            { remarks: billing.data.billing_notes, ...extra },
            { preserveScroll: true, onFinish: () => setBusyAction(null) },
        );
    }

    function submitBilling(event: FormEvent) {
        event.preventDefault();
        billing.put(billingPath(normalizedRole, booking.id), {
            preserveScroll: true,
        });
    }

    function syncDiscountedBilling(next: Partial<BillingForm>) {
        const merged = { ...billing.data, ...next };
        const base = numberValue(
            merged.base_subtotal || merged.finalized_total,
        );
        const discount = numberValue(merged.discount_total);
        const net =
            base > 0
                ? Math.max(base - discount, 0)
                : numberValue(merged.finalized_total);

        billing.setData({
            ...merged,
            finalized_total: net > 0 ? String(net) : merged.finalized_total,
            required_down_payment_amount:
                net > 0
                    ? String(Math.round(net * 50) / 100)
                    : merged.required_down_payment_amount,
        });
    }

    function submitCharge(event: FormEvent) {
        event.preventDefault();
        charge.post(postEventPath(normalizedRole, booking.id), {
            preserveScroll: true,
            onSuccess: () => charge.reset('label', 'amount', 'notes'),
        });
    }

    function removeCharge(record: PostEventCharge) {
        if (!record.id || !window.confirm('Remove this post-event charge?'))
            return;

        router.delete(postEventPath(normalizedRole, booking.id, record.id), {
            preserveScroll: true,
        });
    }

    return (
        <section className="overflow-hidden rounded-[1.55rem] border border-[#d9c7a6]/70 bg-white/88 shadow-[0_22px_70px_rgba(47,37,23,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
            <header className="border-b border-[#eadcc2]/80 p-5 dark:border-white/10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.22em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Admin Finalization
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#21180d] dark:text-white">
                            Approval, billing, bond, and final status
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#6e604c] dark:text-white/56">
                            Use this panel after the client submits the request
                            and MICE details. Charge scope remains limited to
                            Full Hall, Main Hall, LED Wall, Lounge, and
                            Boardroom; excluded ordinance add-ons stay out of
                            the billing flow.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <BookingStatusBadge value={booking.booking_status} />
                        <BookingStatusBadge value={booking.payment_status} />
                    </div>
                </div>
            </header>

            <div className="grid gap-5 p-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <Metric
                        label="Final Venue Total"
                        value={formatMoney(baseTotal)}
                    />
                    <Metric
                        label="Down Payment + Bond"
                        value={formatMoney(requiredDown)}
                        tone={confirmationReady ? 'good' : 'warn'}
                    />
                    <Metric
                        label="Confirmed Paid"
                        value={formatMoney(paid)}
                        tone={paid > 0 ? 'good' : 'warn'}
                    />
                    <Metric
                        label="Bond"
                        value={`${formatMoney(requiredBond)} · ${cleanLabel(summary.bond_status ?? booking.bond_status ?? 'pending')}`}
                        tone={bondReady ? 'good' : 'warn'}
                    />
                    <Metric
                        label="Balance"
                        value={formatMoney(balance)}
                        tone={balance <= 0 ? 'good' : 'bad'}
                    />
                </div>

                <div className="rounded-[1.1rem] border border-amber-300/45 bg-amber-400/10 p-4 text-sm leading-7 text-[#6e604c] dark:text-white/62">
                    <div className="flex gap-3">
                        <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-200" />
                        <p>{statusHelp}</p>
                    </div>
                </div>

                <form
                    onSubmit={submitBilling}
                    className="rounded-[1.2rem] border border-[#eadcc2]/80 bg-[#fffaf0]/70 p-4 dark:border-white/10 dark:bg-white/[0.035]"
                >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <label className="grid gap-1 text-xs font-bold tracking-[0.14em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Base Subtotal
                            <input
                                className="backend-booking-input"
                                value={billing.data.base_subtotal}
                                onChange={(event) =>
                                    syncDiscountedBilling({
                                        base_subtotal: event.target.value,
                                    })
                                }
                                inputMode="decimal"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-bold tracking-[0.14em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Discount Total
                            <input
                                className="backend-booking-input"
                                value={billing.data.discount_total}
                                onChange={(event) =>
                                    syncDiscountedBilling({
                                        discount_total: event.target.value,
                                    })
                                }
                                inputMode="decimal"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-bold tracking-[0.14em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Net Final Total
                            <input
                                className="backend-booking-input"
                                value={billing.data.finalized_total}
                                onChange={(event) =>
                                    billing.setData(
                                        'finalized_total',
                                        event.target.value,
                                    )
                                }
                                inputMode="decimal"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-bold tracking-[0.14em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Required Down Payment
                            <input
                                className="backend-booking-input"
                                value={
                                    billing.data.required_down_payment_amount
                                }
                                onChange={(event) =>
                                    billing.setData(
                                        'required_down_payment_amount',
                                        event.target.value,
                                    )
                                }
                                inputMode="decimal"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-bold tracking-[0.14em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Bond Status
                            <select
                                className="backend-booking-input"
                                value={billing.data.bond_status}
                                onChange={(event) =>
                                    billing.setData(
                                        'bond_status',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="waived">Waived</option>
                                <option value="used">Used for charges</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </label>
                    </div>
                    <label className="mt-3 grid gap-1 text-xs font-bold tracking-[0.14em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                        Billing Notes
                        <textarea
                            className="backend-booking-input min-h-[96px] py-3"
                            value={billing.data.billing_notes}
                            onChange={(event) =>
                                billing.setData(
                                    'billing_notes',
                                    event.target.value,
                                )
                            }
                        />
                    </label>
                    <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#6e604c] dark:text-white/62">
                        <input
                            type="checkbox"
                            checked={billing.data.lock_final_computation}
                            onChange={(event) =>
                                billing.setData(
                                    'lock_final_computation',
                                    event.target.checked,
                                )
                            }
                        />{' '}
                        Lock final computation snapshot
                    </label>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <button
                            type="submit"
                            disabled={billing.processing}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] disabled:opacity-60 dark:bg-white dark:text-[#17120b]"
                        >
                            <LockKeyhole className="h-4 w-4" /> Save Billing
                        </button>
                    </div>
                </form>

                <label className="flex items-start gap-3 rounded-[1rem] border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100">
                    <input
                        type="checkbox"
                        checked={cancelAfterOfficeHoursDayBefore}
                        onChange={(event) =>
                            setCancelAfterOfficeHoursDayBefore(
                                event.target.checked,
                            )
                        }
                        className="mt-1"
                    />
                    <span>
                        <strong className="block">
                            Late cancellation timing
                        </strong>
                        <small className="mt-1 block leading-5">
                            Check only when cancellation is after office hours
                            the day before or on the event day. This applies the
                            75% cancellation fee rule.
                        </small>
                    </span>
                </label>

                <div className="flex flex-wrap gap-2">
                    <DecisionButton
                        busy={busyAction === 'for-review'}
                        tone="dark"
                        icon={<ClipboardCheck className="h-4 w-4" />}
                        label="For Review"
                        onClick={() =>
                            postDecision(
                                'for-review',
                                'Move this booking to review?',
                            )
                        }
                    />
                    <DecisionButton
                        busy={busyAction === 'pencil-book'}
                        tone="warn"
                        icon={<Banknote className="h-4 w-4" />}
                        label="Pencil Book"
                        onClick={() =>
                            postDecision(
                                'pencil-book',
                                'Pencil-book this reservation and lock final computation?',
                            )
                        }
                    />
                    <DecisionButton
                        busy={busyAction === 'confirm'}
                        tone="good"
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Confirm"
                        onClick={() =>
                            postDecision(
                                'confirm',
                                confirmationReady
                                    ? 'Confirm this reservation?'
                                    : 'Required down payment plus bond is not complete. Force confirm anyway?',
                                { force_confirm: !confirmationReady },
                            )
                        }
                    />
                    <DecisionButton
                        busy={busyAction === 'complete'}
                        tone="good"
                        icon={<ShieldCheck className="h-4 w-4" />}
                        label="Complete"
                        onClick={() =>
                            postDecision(
                                'complete',
                                'Mark this booking as completed?',
                            )
                        }
                    />
                    <DecisionButton
                        busy={busyAction === 'decline'}
                        tone="bad"
                        icon={<XCircle className="h-4 w-4" />}
                        label="Decline"
                        onClick={() =>
                            postDecision(
                                'decline',
                                'Decline this booking request?',
                            )
                        }
                    />
                    <DecisionButton
                        busy={busyAction === 'cancel'}
                        tone="bad"
                        icon={<FileWarning className="h-4 w-4" />}
                        label="Cancel"
                        onClick={() =>
                            postDecision(
                                'cancel',
                                cancelAfterOfficeHoursDayBefore
                                    ? 'Cancel this booking with the after-office-hours day-before/event-day 75% cancellation rule?'
                                    : 'Cancel this booking and compute cancellation penalty from the scheduled event date?',
                                {
                                    after_office_hours_day_before:
                                        cancelAfterOfficeHoursDayBefore,
                                },
                            )
                        }
                    />
                </div>

                <section className="rounded-[1.2rem] border border-[#eadcc2]/80 bg-[#fffaf0]/70 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                                Post-event charges
                            </p>
                            <h3 className="text-lg font-semibold text-[#21180d] dark:text-white">
                                Damage, violation, or post-event billing
                            </h3>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#6e604c] dark:text-white/56">
                            <ReceiptText className="h-4 w-4" />{' '}
                            {formatMoney(postEventTotal)}
                        </span>
                    </header>

                    {charges.length > 0 ? (
                        <div className="mt-4 grid gap-2">
                            {charges.map((record) => (
                                <article
                                    key={record.id ?? record.label}
                                    className="flex flex-col gap-3 rounded-[1rem] border border-[#eadcc2]/80 bg-white/70 p-3 md:flex-row md:items-center md:justify-between dark:border-white/10 dark:bg-white/[0.035]"
                                >
                                    <div>
                                        <p className="font-semibold text-[#21180d] dark:text-white">
                                            {record.label}
                                        </p>
                                        <p className="text-xs tracking-[0.15em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                                            {cleanLabel(record.category)} ·{' '}
                                            {cleanLabel(record.status)} ·{' '}
                                            {formatDateTime(record.assessed_at)}
                                        </p>
                                        {record.notes ? (
                                            <p className="mt-1 text-sm text-[#6e604c] dark:text-white/56">
                                                {record.notes}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <strong className="text-sm text-[#21180d] dark:text-white">
                                            {formatMoney(record.amount)}
                                        </strong>
                                        <button
                                            type="button"
                                            onClick={() => removeCharge(record)}
                                            className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-[#6e604c] dark:text-white/56">
                            No post-event charge assessed yet.
                        </p>
                    )}

                    <form
                        onSubmit={submitCharge}
                        className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_160px_auto] md:items-end"
                    >
                        <label className="grid gap-1 text-xs font-bold tracking-[0.14em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Charge Label
                            <input
                                className="backend-booking-input"
                                value={charge.data.label}
                                onChange={(event) =>
                                    charge.setData('label', event.target.value)
                                }
                                placeholder="e.g. Minimal house-rule offense"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-bold tracking-[0.14em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Amount
                            <input
                                className="backend-booking-input"
                                value={charge.data.amount}
                                onChange={(event) =>
                                    charge.setData('amount', event.target.value)
                                }
                                inputMode="decimal"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-bold tracking-[0.14em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Status
                            <select
                                className="backend-booking-input"
                                value={charge.data.status}
                                onChange={(event) =>
                                    charge.setData('status', event.target.value)
                                }
                            >
                                <option value="assessed">Assessed</option>
                                <option value="settled">Settled</option>
                                <option value="waived">Waived</option>
                            </select>
                        </label>
                        <button
                            type="submit"
                            disabled={charge.processing}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] disabled:opacity-60 dark:bg-white dark:text-[#17120b]"
                        >
                            <ReceiptText className="h-4 w-4" /> Add
                        </button>
                    </form>
                </section>
            </div>
        </section>
    );
}
