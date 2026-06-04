import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Clock3, CreditCard, ReceiptText, WalletCards } from 'lucide-react';

type FinancialSummary = {
    total?: number;
    paid?: number;
    pending?: number;
    balance?: number;
    minimum_required?: number;
    minimum_due_now?: number;
    progress?: number;
    status?: string;
    status_label?: string;
    total_label?: string;
    paid_label?: string;
    pending_label?: string;
    balance_label?: string;
    minimum_required_label?: string;
    minimum_due_now_label?: string;
    next_action?: string;
};

type BookingLike = {
    id: number | string;
    booking_status?: string | null;
    payment_status?: string | null;
    financial_summary?: FinancialSummary | null;
};

type Props = {
    booking: BookingLike;
    paymentUrl?: string;
    showPaymentButton?: boolean;
};

function peso(value?: number | null) {
    return `₱${Number(value ?? 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function statusStyle(status?: string | null) {
    if (status === 'paid') {
        return {
            shell: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100',
            bar: 'bg-emerald-600 dark:bg-emerald-300',
            icon: CheckCircle2,
        };
    }

    if (status === 'partial') {
        return {
            shell: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100',
            bar: 'bg-amber-600 dark:bg-amber-300',
            icon: Clock3,
        };
    }

    if (status === 'pending') {
        return {
            shell: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-100',
            bar: 'bg-blue-600 dark:bg-blue-300',
            icon: Clock3,
        };
    }

    return {
        shell: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100',
        bar: 'bg-rose-600 dark:bg-rose-300',
        icon: WalletCards,
    };
}

export default function ClientFinancialSummaryCard({
    booking,
    paymentUrl,
    showPaymentButton = true,
}: Props) {
    const summary = booking.financial_summary ?? {};
    const status = summary.status ?? booking.payment_status ?? 'unpaid';
    const style = statusStyle(status);
    const Icon = style.icon;

    const progress = Math.max(0, Math.min(100, Number(summary.progress ?? 0)));
    const total = summary.total_label ?? peso(summary.total);
    const paid = summary.paid_label ?? peso(summary.paid);
    const balance = summary.balance_label ?? peso(summary.balance);
    const minimumDueNow = summary.minimum_due_now_label ?? peso(summary.minimum_due_now);

    const href = paymentUrl ?? `/bookings/${booking.id}/payments/create`;

    return (
        <section className="overflow-hidden rounded-[1.5rem] border border-[#d9c7a6]/70 bg-white/82 shadow-[0_22px_70px_rgba(47,37,23,0.09)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
            <div className="flex flex-col gap-4 border-b border-[#eadcc2]/80 p-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${style.shell}`}>
                        <Icon className="h-5 w-5" />
                    </span>

                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Payment Summary
                        </p>

                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-[#21180d] dark:text-white">
                            {summary.status_label ?? 'Payment Status'}
                        </h3>

                        <p className="mt-2 max-w-[66ch] text-sm leading-6 text-[#6e604c] dark:text-white/58">
                            {summary.next_action ?? 'Review the payment information below.'}
                        </p>
                    </div>
                </div>

                <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] ${style.shell}`}>
                    {summary.status_label ?? status}
                </span>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.9fr]">
                <div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <AmountBox icon={ReceiptText} label="Total" value={total} />
                        <AmountBox icon={CheckCircle2} label="Paid" value={paid} />
                        <AmountBox icon={WalletCards} label="Balance" value={balance} strong />
                    </div>

                    <div className="mt-5">
                        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#6e604c] dark:text-white/58">
                            <span>Payment progress</span>
                            <span>{progress.toFixed(0)}%</span>
                        </div>

                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#eadcc2] dark:bg-white/10">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                <aside className="rounded-[1.2rem] border border-[#eadcc2]/80 bg-[#fffaf0]/76 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        Required payment
                    </p>

                    <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#21180d] dark:text-white">
                        {minimumDueNow}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                        Minimum amount currently needed based on the booking payment policy.
                    </p>

                    {showPaymentButton && status !== 'paid' ? (
                        <Link
                            href={href}
                            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-[#f1d89b] dark:text-[#17120b] dark:hover:bg-white"
                        >
                            Add Payment
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    ) : null}
                </aside>
            </div>
        </section>
    );
}

function AmountBox({
    icon: Icon,
    label,
    value,
    strong = false,
}: {
    icon: typeof CreditCard;
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div className="rounded-[1.1rem] border border-[#eadcc2]/80 bg-white/72 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <Icon className="h-5 w-5 text-[#9d7b3d] dark:text-[#f1d89b]" />

            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </p>

            <p className={`mt-1 text-xl font-semibold tracking-[-0.045em] ${strong ? 'text-[#21180d] dark:text-white' : 'text-[#6e604c] dark:text-white/70'}`}>
                {value}
            </p>
        </div>
    );
}
