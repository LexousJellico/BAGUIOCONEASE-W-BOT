import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import { confirmBcccAction } from '@/components/ui/bccc-confirm-dialog';
import {
    bookingPaymentPath,
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
    CreditCard,
    ExternalLink,
    FileImage,
    LoaderCircle,
    ReceiptText,
    ShieldCheck,
    UploadCloud,
    XCircle,
} from 'lucide-react';
import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
    type ReactNode,
} from 'react';

type PaymentRecord = {
    id: number | string;
    amount?: number | string | null;
    status?: string | null;
    payment_method?: string | null;
    payment_gateway?: string | null;
    payment_type?: string | null;
    transaction_reference?: string | null;
    proof_image_url?: string | null;
    proof_image_name?: string | null;
    created_at?: string | null;
    paid_at?: string | null;
    verified_at?: string | null;
    approved_at?: string | null;
    declined_at?: string | null;
    failed_at?: string | null;
    remarks?: string | null;
    payer_name?: string | null;
};

type PaymentFormData = {
    payment_method: string;
    payment_gateway: string;
    payment_type: string;
    amount: string;
    transaction_reference: string;
    payer_name: string;
    proof_image: File | null;
    remarks: string;
    status: string;
};

type PaymentProofPanelProps = {
    role?: string | null;
    booking: BookingLike;
    canManagePayments?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function totalValue(booking: BookingLike, key: string): number | string | null {
    const totals = booking.totals as
        | Record<string, number | string | null>
        | null
        | undefined;
    const summary = booking.financial_summary as
        | Record<string, number | string | null>
        | null
        | undefined;

    if (key === 'items_total') return summary?.total ?? totals?.[key] ?? null;
    if (key === 'submitted_payments_total') {
        const computedSubmittedTotal =
            Number(summary?.paid ?? 0) + Number(summary?.pending ?? 0);

        return computedSubmittedTotal > 0
            ? computedSubmittedTotal
            : (totals?.[key] ?? null);
    }
    if (key === 'confirmed_payments_total' || key === 'payments_total')
        return summary?.paid ?? totals?.[key] ?? null;
    if (key === 'remaining_balance')
        return summary?.balance ?? totals?.[key] ?? null;

    return totals?.[key] ?? null;
}

function numericMoney(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') return fallback;

    const numeric = Number(String(value).replace(/[^\d.-]/g, ''));

    return Number.isFinite(numeric) ? numeric : fallback;
}

function amountString(value: number): string {
    return Math.max(0, value).toFixed(2);
}

function hasCompletedMiceReport(booking: BookingLike): boolean {
    const record = booking as Record<string, unknown>;
    const snakeMiceRecord =
        record.mice_record && typeof record.mice_record === 'object'
            ? (record.mice_record as Record<string, unknown>)
            : null;
    const camelMiceRecord =
        record.miceRecord && typeof record.miceRecord === 'object'
            ? (record.miceRecord as Record<string, unknown>)
            : null;

    return Boolean(
        record.mice_report_submitted ||
            record.has_mice_report ||
            record.miceReportSubmitted ||
            snakeMiceRecord?.submitted_at ||
            camelMiceRecord?.submitted_at,
    );
}

function gatewayLabel(value?: string | null) {
    return cleanLabel(value || 'Manual');
}

function proofPath(
    role: RoleThemeKey,
    bookingId: number | string,
    paymentId: number | string,
): string {
    return `${bookingPaymentPath(role, bookingId)}/${paymentId}/proof`;
}

function updatePath(
    role: RoleThemeKey,
    bookingId: number | string,
    paymentId: number | string,
): string {
    return `${bookingPaymentPath(role, bookingId)}/${paymentId}`;
}

function isConfirmedPayment(status?: string | null): boolean {
    return ['confirmed', 'verified', 'paid'].includes(
        String(status || '').toLowerCase(),
    );
}

function isPendingPayment(status?: string | null): boolean {
    return String(status || '').toLowerCase() === 'pending';
}

function Field({
    label,
    error,
    required,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <label className="booking-proof-field">
            <span>
                {label}
                {required ? <strong>*</strong> : null}
            </span>

            {children}

            {error ? (
                <small className="booking-proof-error">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {error}
                </small>
            ) : null}
        </label>
    );
}

function MetricCard({
    label,
    value,
    icon: Icon,
    tone = 'default',
}: {
    label: string;
    value: ReactNode;
    icon: typeof ReceiptText;
    tone?: 'default' | 'gold' | 'green' | 'red';
}) {
    return (
        <article className={cx('booking-payment-metric', `tone-${tone}`)}>
            <div>
                <p>{label}</p>
                <strong>{value}</strong>
            </div>

            <Icon className="h-5 w-5" />
        </article>
    );
}

function PaymentHistoryRow({
    payment,
    role,
    bookingId,
    canManagePayments,
    busyId,
    onReview,
}: {
    payment: PaymentRecord;
    role: RoleThemeKey;
    bookingId: number | string;
    canManagePayments: boolean;
    busyId: number | string | null;
    onReview: (
        payment: PaymentRecord,
        status: 'confirmed' | 'declined',
    ) => void;
}) {
    const busy = String(busyId ?? '') === String(payment.id);

    return (
        <article className="booking-payment-row">
            <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                    <BookingStatusBadge value={payment.status} />

                    <span className="booking-proof-chip">
                        {gatewayLabel(
                            payment.payment_gateway ?? payment.payment_method,
                        )}
                    </span>

                    <span className="booking-proof-chip">
                        {cleanLabel(payment.payment_type || 'payment')}
                    </span>
                </div>

                <p className="mt-4 text-2xl font-semibold tracking-normal text-[var(--bccc-backend-text)]">
                    {formatMoney(payment.amount)}
                </p>

                <p className="mt-1 text-sm leading-7 text-[var(--bccc-backend-muted)]">
                    Ref: {payment.transaction_reference || 'No reference'} ·
                    Submitted {formatDateTime(payment.created_at)}
                </p>

                {payment.payer_name ? (
                    <p className="mt-1 text-sm leading-7 text-[var(--bccc-backend-muted)]">
                        Payer: {payment.payer_name}
                    </p>
                ) : null}

                {payment.remarks ? (
                    <p className="mt-3 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-3 text-sm leading-7 text-[var(--bccc-backend-muted)]">
                        {payment.remarks}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
                {payment.proof_image_url ? (
                    <a
                        href={
                            payment.proof_image_url ||
                            proofPath(role, bookingId, payment.id)
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="booking-proof-action"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Open Proof
                    </a>
                ) : (
                    <span className="booking-proof-action is-muted">
                        <FileImage className="h-4 w-4" />
                        No Proof
                    </span>
                )}

                {canManagePayments ? (
                    <>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => onReview(payment, 'confirmed')}
                            className="booking-proof-action is-confirm"
                        >
                            {busy ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Confirm
                        </button>

                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => onReview(payment, 'declined')}
                            className="booking-proof-action is-decline"
                        >
                            {busy ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            Decline
                        </button>
                    </>
                ) : null}
            </div>
        </article>
    );
}

export function PaymentProofPanel({
    role,
    booking,
    canManagePayments = false,
}: PaymentProofPanelProps) {
    const normalizedRole = normalizeWorkspaceRole(role) as RoleThemeKey;
    const isClient = normalizedRole === 'user';
    const payments = Array.isArray(booking.payments)
        ? (booking.payments as PaymentRecord[])
        : [];

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<number | string | null>(null);

    const itemsTotal = Number(totalValue(booking, 'items_total') ?? 0);
    const miceReportReady = !isClient || hasCompletedMiceReport(booking);
    const submittedTotal = Number(
        totalValue(booking, 'submitted_payments_total') ?? 0,
    );
    const confirmedTotal = Number(
        totalValue(booking, 'confirmed_payments_total') ??
            totalValue(booking, 'payments_total') ??
            0,
    );
    const totalPayable = useMemo(() => {
        const summary = booking.financial_summary as
            | Record<string, number | string | null>
            | null
            | undefined;
        const billing = booking.billing_summary as
            | Record<string, number | string | null>
            | null
            | undefined;
        const meta = booking.payment_meta as
            | Record<string, number | string | null>
            | null
            | undefined;
        const totals = booking.totals as
            | Record<string, number | string | null>
            | null
            | undefined;
        const candidates = [
            billing?.payment_total_including_bond,
            billing?.total_with_bond,
            billing?.total_with_post_event,
            summary?.payment_total_including_bond,
            summary?.total_with_bond,
            summary?.total,
            totals?.payment_total_including_bond,
            totals?.total_with_bond,
            meta?.payment_total_including_bond,
            meta?.total_with_bond,
            (booking as Record<string, unknown>).payment_total_including_bond,
            (booking as Record<string, unknown>).total_with_bond,
            billing?.total_payable,
            billing?.grand_total,
            summary?.base_total,
            meta?.total_payable,
            meta?.grand_total,
            meta?.final_estimated_total,
            meta?.estimated_total,
            itemsTotal,
        ];

        for (const candidate of candidates) {
            const amount = numericMoney(candidate);

            if (amount > 0) return amount;
        }

        return 0;
    }, [booking, itemsTotal]);
    const requiredDownPayment = useMemo(() => {
        const summary = booking.financial_summary as
            | Record<string, number | string | null>
            | null
            | undefined;
        const billing = booking.billing_summary as
            | Record<string, number | string | null>
            | null
            | undefined;
        const meta = booking.payment_meta as
            | Record<string, number | string | null>
            | null
            | undefined;
        const directCandidates = [
            billing?.required_down_payment,
            summary?.minimum_required,
            meta?.required_down_payment,
            (booking as Record<string, unknown>).required_down_payment_amount,
        ];

        for (const candidate of directCandidates) {
            const amount = numericMoney(candidate);

            if (amount > 0) return Math.min(amount, totalPayable || amount);
        }

        const bondCandidates = [
            billing?.bond_charge,
            billing?.required_bond,
            summary?.bond_charge,
            summary?.required_bond,
            meta?.required_bond,
            meta?.bond_amount,
            (booking as Record<string, unknown>).bond_charge,
            (booking as Record<string, unknown>).required_bond_amount,
            10000,
        ];
        const bond =
            bondCandidates
                .map((candidate) => numericMoney(candidate))
                .find((amount) => amount > 0) ?? 10000;
        const venueTotal = Math.max(0, totalPayable - bond);

        return Math.min(totalPayable, Math.round(venueTotal * 0.5 + bond));
    }, [booking, totalPayable]);
    const outstandingAmount = Math.max(0, totalPayable - confirmedTotal);
    const halfPaymentAmount = Math.max(0, requiredDownPayment - confirmedTotal);
    const paymentAmountOptions = useMemo(() => {
        const options: Array<{
            key: 'down' | 'full';
            paymentType: 'down' | 'full' | 'balance';
            amount: number;
            label: string;
            detail: string;
        }> = [];

        if (halfPaymentAmount > 0.009) {
            options.push({
                key: 'down',
                paymentType: 'down',
                amount: halfPaymentAmount,
                label: `Required down payment + bond - ${formatMoney(halfPaymentAmount)}`,
                detail: '50% of the venue total plus the required refundable bond',
            });
        }

        if (outstandingAmount > 0.009) {
            options.push({
                key: 'full',
                paymentType: confirmedTotal > 0 ? 'balance' : 'full',
                amount: outstandingAmount,
                label: `${confirmedTotal > 0 ? 'Remaining balance' : 'Full payment'} - ${formatMoney(outstandingAmount)}`,
                detail: 'Settles the total payable including the refundable bond',
            });
        }

        return options;
    }, [confirmedTotal, halfPaymentAmount, outstandingAmount]);
    const defaultPaymentOption = paymentAmountOptions[0] ?? null;

    const remainingBalance = useMemo(() => {
        const direct = Number(totalValue(booking, 'remaining_balance'));

        if (Number.isFinite(direct) && direct > 0) {
            return String(direct.toFixed(2));
        }

        const remaining = outstandingAmount;

        if (!Number.isFinite(remaining) || remaining <= 0) {
            return '';
        }

        return amountString(remaining);
    }, [booking, outstandingAmount]);

    const confirmedPayments = payments.filter((payment) =>
        isConfirmedPayment(payment.status),
    );
    const pendingPayments = payments.filter((payment) =>
        isPendingPayment(payment.status),
    );

    const { data, setData, post, processing, errors, reset } =
        useForm<PaymentFormData>({
            payment_method: 'online',
            payment_gateway: isClient ? 'gcash' : 'manual',
            payment_type: defaultPaymentOption?.paymentType ?? 'down',
            amount: defaultPaymentOption
                ? amountString(defaultPaymentOption.amount)
                : '',
            transaction_reference: '',
            payer_name: String(booking.client_name || ''),
            proof_image: null,
            remarks: '',
            status: canManagePayments ? 'confirmed' : 'pending',
        });
    const [selectedPaymentChoice, setSelectedPaymentChoice] = useState<
        'down' | 'full'
    >(defaultPaymentOption?.key ?? 'down');

    useEffect(() => {
        const option =
            paymentAmountOptions.find(
                (item) => item.key === selectedPaymentChoice,
            ) ??
            paymentAmountOptions[0] ??
            null;

        if (!option) {
            setData('amount', '');
            return;
        }

        if (option.key !== selectedPaymentChoice) {
            setSelectedPaymentChoice(option.key);
        }

        setData('amount', amountString(option.amount));
        setData('payment_type', option.paymentType);
    }, [paymentAmountOptions, selectedPaymentChoice, setData]);

    useEffect(() => {
        if (!data.proof_image) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(data.proof_image);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.proof_image]);

    const gatewayNeedsProof = ['gcash', 'paypal', 'bank'].includes(
        data.payment_gateway,
    );
    const gatewayNeedsReference = ['gcash', 'paypal', 'bank', 'card'].includes(
        data.payment_gateway,
    );

    function submitPayment(event: FormEvent) {
        event.preventDefault();

        if (!miceReportReady) {
            window.alert(
                'Please complete the required MICE report before submitting payment proof.',
            );
            return;
        }

        post(bookingPaymentPath(normalizedRole, booking.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset('transaction_reference', 'proof_image', 'remarks');
                if (defaultPaymentOption) {
                    setSelectedPaymentChoice(defaultPaymentOption.key);
                    setData(
                        'amount',
                        amountString(defaultPaymentOption.amount),
                    );
                    setData('payment_type', defaultPaymentOption.paymentType);
                }
                setData('status', canManagePayments ? 'confirmed' : 'pending');
            },
        });
    }

    async function updatePaymentStatus(
        payment: PaymentRecord,
        status: 'confirmed' | 'declined',
    ) {
        const isConfirming = status === 'confirmed';
        const confirmed = await confirmBcccAction({
            title: isConfirming
                ? 'Confirm payment proof?'
                : 'Decline payment proof?',
            message: isConfirming
                ? 'This will mark the submitted payment proof as confirmed and update the booking payment balance.'
                : 'This will decline the submitted payment proof so the client can submit a corrected proof when needed.',
            confirmText: isConfirming ? 'Confirm Payment' : 'Decline Payment',
            cancelText: 'Cancel',
            tone: isConfirming ? 'success' : 'danger',
        });

        if (!confirmed) {
            return;
        }

        setBusyId(payment.id);

        router.put(
            updatePath(normalizedRole, booking.id, payment.id),
            {
                status,
                payment_method: payment.payment_method || 'manual',
                payment_gateway: payment.payment_gateway || 'manual',
                payment_type: payment.payment_type || 'down',
                amount: payment.amount || 0,
                transaction_reference: payment.transaction_reference || '',
                payer_name: payment.payer_name || '',
                remarks:
                    status === 'confirmed'
                        ? 'Payment proof reviewed and confirmed.'
                        : 'Payment proof reviewed and declined.',
            },
            {
                preserveScroll: true,
                onFinish: () => setBusyId(null),
            },
        );
    }

    return (
        <section className="booking-payment-panel">
            <header className="booking-section-header">
                <div>
                    <p>Payment Compliance</p>
                    <h2>
                        {isClient
                            ? 'Submit payment proof'
                            : 'Record or review payment'}
                    </h2>
                    <span>
                        Upload proof, track pending review, and monitor
                        confirmed payments against the booking total.
                    </span>
                </div>

                <CreditCard className="h-8 w-8 text-[var(--bccc-backend-gold)]" />
            </header>

            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    label="Total Payable"
                    value={formatMoney(totalPayable || itemsTotal)}
                    icon={ReceiptText}
                />
                <MetricCard
                    label="Submitted"
                    value={formatMoney(submittedTotal)}
                    icon={UploadCloud}
                    tone="gold"
                />
                <MetricCard
                    label="Confirmed"
                    value={formatMoney(confirmedTotal)}
                    icon={ShieldCheck}
                    tone="green"
                />
                <MetricCard
                    label="Remaining"
                    value={formatMoney(remainingBalance || 0)}
                    icon={Banknote}
                    tone={Number(remainingBalance) > 0 ? 'red' : 'green'}
                />
            </div>

            {isClient ? (
                <div
                    className={cx(
                        'booking-payment-help',
                        !miceReportReady && 'is-blocking',
                    )}
                >
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p>
                        {miceReportReady ? (
                            <>
                                Your submitted proof starts as{' '}
                                <strong>Pending</strong>. BCCC staff must verify
                                it before it counts as confirmed payment.
                            </>
                        ) : (
                            <>
                                Complete the required{' '}
                                <strong>MICE report</strong> from this booking
                                page first. Payment proof submission is locked
                                until the MICE report is submitted.
                            </>
                        )}
                    </p>
                </div>
            ) : null}

            <form
                onSubmit={submitPayment}
                className={cx(
                    'booking-payment-form',
                    !miceReportReady && 'is-disabled',
                )}
            >
                <div className="grid gap-4 lg:grid-cols-2">
                    <Field label="Payer Name" error={errors.payer_name}>
                        <input
                            value={data.payer_name}
                            onChange={(event) =>
                                setData('payer_name', event.target.value)
                            }
                            className="backend-booking-input"
                            placeholder="Name of payer"
                        />
                    </Field>

                    <Field label="Amount" required error={errors.amount}>
                        <select
                            value={selectedPaymentChoice}
                            onChange={(event) => {
                                const key = event.target.value as
                                    | 'down'
                                    | 'full';
                                const option = paymentAmountOptions.find(
                                    (item) => item.key === key,
                                );

                                setSelectedPaymentChoice(key);

                                if (option) {
                                    setData(
                                        'amount',
                                        amountString(option.amount),
                                    );
                                    setData('payment_type', option.paymentType);
                                }
                            }}
                            className="backend-booking-input"
                            disabled={paymentAmountOptions.length === 0}
                        >
                            {paymentAmountOptions.length === 0 ? (
                                <option value="down">
                                    Fully paid / no payable balance
                                </option>
                            ) : null}
                            {paymentAmountOptions.map((option) => (
                                <option key={option.key} value={option.key}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <small className="mt-2 block text-xs leading-5 text-[var(--bccc-backend-muted)]">
                            {paymentAmountOptions.find(
                                (item) => item.key === selectedPaymentChoice,
                            )?.detail ??
                                'Amount uses the total payable including the refundable bond.'}{' '}
                            Current amount:{' '}
                            <strong>{formatMoney(data.amount || 0)}</strong>
                        </small>
                    </Field>

                    <Field
                        label="Payment Gateway"
                        required
                        error={errors.payment_gateway}
                    >
                        <select
                            value={data.payment_gateway}
                            onChange={(event) => {
                                const gateway = event.target.value;

                                setData('payment_gateway', gateway);
                                setData(
                                    'payment_method',
                                    gateway === 'cash'
                                        ? 'cash'
                                        : gateway === 'card'
                                          ? 'card'
                                          : 'online',
                                );
                            }}
                            className="backend-booking-input"
                        >
                            <option value="gcash">GCash</option>
                            <option value="paypal">PayPal</option>
                            <option value="bank">Bank Transfer</option>
                            {canManagePayments ? (
                                <option value="cash">Cash</option>
                            ) : null}
                            {canManagePayments ? (
                                <option value="manual">Manual</option>
                            ) : null}
                            <option value="card">Card</option>
                        </select>
                    </Field>

                    <Field
                        label="Payment Type"
                        required
                        error={errors.payment_type}
                    >
                        <select
                            value={data.payment_type}
                            onChange={(event) =>
                                setData('payment_type', event.target.value)
                            }
                            className="backend-booking-input"
                            disabled
                        >
                            <option value="down">Down Payment</option>
                            <option value="full">Full Payment</option>
                            <option value="balance">Remaining Balance</option>
                            {canManagePayments ? (
                                <option value="bond">Bond</option>
                            ) : null}
                            {canManagePayments ? (
                                <option value="post_event">
                                    Post-event Charge
                                </option>
                            ) : null}
                        </select>
                    </Field>

                    {canManagePayments ? (
                        <Field
                            label="Review Status"
                            required
                            error={errors.status}
                        >
                            <select
                                value={data.status}
                                onChange={(event) =>
                                    setData('status', event.target.value)
                                }
                                className="backend-booking-input"
                            >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="verified">Verified</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                                <option value="declined">Declined</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </Field>
                    ) : null}

                    <Field
                        label="Transaction Reference"
                        required={gatewayNeedsReference}
                        error={errors.transaction_reference}
                    >
                        <input
                            value={data.transaction_reference}
                            onChange={(event) =>
                                setData(
                                    'transaction_reference',
                                    event.target.value,
                                )
                            }
                            className="backend-booking-input"
                            placeholder="Reference number / confirmation code"
                        />
                    </Field>
                </div>

                <Field
                    label="Payment Proof Image"
                    required={gatewayNeedsProof}
                    error={errors.proof_image}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                            setData(
                                'proof_image',
                                event.target.files?.[0] ?? null,
                            )
                        }
                        className="backend-booking-file"
                    />
                </Field>

                {previewUrl ? (
                    <div className="booking-payment-preview">
                        <img src={previewUrl} alt="Payment proof preview" />
                    </div>
                ) : null}

                <Field label="Remarks" error={errors.remarks}>
                    <textarea
                        value={data.remarks}
                        onChange={(event) =>
                            setData('remarks', event.target.value)
                        }
                        rows={3}
                        className="backend-booking-input min-h-[100px] py-3"
                        placeholder="Optional notes"
                    />
                </Field>

                <footer className="booking-payment-submit-row">
                    <p>
                        {gatewayNeedsProof
                            ? 'Proof image and transaction reference are required for this gateway.'
                            : 'Cash/manual records may only be saved by authorized internal users.'}
                    </p>

                    <button
                        type="submit"
                        disabled={processing || !miceReportReady}
                        className="booking-payment-submit"
                    >
                        {processing ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                            <UploadCloud className="h-4 w-4" />
                        )}
                        {isClient
                            ? 'Submit Payment Proof'
                            : 'Save Payment Record'}
                    </button>
                </footer>
            </form>

            <section className="booking-payment-history">
                <header className="booking-section-subheader">
                    <div>
                        <p>Payment History</p>
                        <h3>
                            {payments.length} record
                            {payments.length === 1 ? '' : 's'}
                        </h3>
                    </div>

                    <ReceiptText className="h-5 w-5 text-[var(--bccc-backend-gold)]" />
                </header>

                {payments.length > 0 ? (
                    <div className="grid gap-3">
                        {payments.map((payment) => (
                            <PaymentHistoryRow
                                key={payment.id}
                                payment={payment}
                                role={normalizedRole}
                                bookingId={booking.id}
                                canManagePayments={canManagePayments}
                                busyId={busyId}
                                onReview={updatePaymentStatus}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="booking-empty-proof">
                        <ReceiptText className="mx-auto h-10 w-10 text-[var(--bccc-backend-gold)]" />
                        <h4>No payment records yet</h4>
                        <p>
                            Payment submissions and staff-recorded payments will
                            appear here.
                        </p>
                    </div>
                )}

                {confirmedPayments.length > 0 || pendingPayments.length > 0 ? (
                    <div className="booking-payment-review-note">
                        <p>
                            <strong>{pendingPayments.length}</strong> pending
                            review · <strong>{confirmedPayments.length}</strong>{' '}
                            confirmed/verified/paid record
                            {confirmedPayments.length === 1 ? '' : 's'}.
                        </p>
                    </div>
                ) : null}
            </section>
        </section>
    );
}
