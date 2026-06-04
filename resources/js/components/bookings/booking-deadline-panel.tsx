import BookingDeadlineBadge, { type BookingDeadlineLike } from '@/components/bookings/booking-deadline-badge';
import { CalendarClock, Clock3, ShieldCheck, TimerOff } from 'lucide-react';

type BookingDeadlinePanelProps = {
    booking?: BookingDeadlineLike | null;
};

function parseDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value?: string | null) {
    const date = parseDate(value);

    if (!date) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function deadlineOf(booking?: BookingDeadlineLike | null): string | null {
    return (
        booking?.deadline_at ??
        booking?.deadlineAt ??
        booking?.payment_balance_due_at ??
        booking?.expired_at ??
        null
    );
}

function stateOf(booking?: BookingDeadlineLike | null): string {
    return String(booking?.deadline_state ?? booking?.deadlineState ?? '').toLowerCase();
}

export default function BookingDeadlinePanel({ booking }: BookingDeadlinePanelProps) {
    const deadline = deadlineOf(booking);
    const state = stateOf(booking);
    const autoDeclined = booking?.auto_declined_at;
    const reason = booking?.auto_decline_reason;

    return (
        <section className="overflow-hidden rounded-[1.45rem] border border-[#d9c7a6]/70 bg-white/84 p-5 shadow-[0_18px_58px_rgba(47,37,23,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Deadline Tracking
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#21180d] dark:text-white">
                        Booking deadline status
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[#6e604c] dark:text-white/58">
                        Payment compliance is monitored automatically using a 10-working-day deadline. If the deadline passes without settlement, the system can auto-decline the booking.
                    </p>
                </div>

                <BookingDeadlineBadge booking={booking} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
                <InfoCard
                    icon={Clock3}
                    label="Payment Deadline"
                    value={formatDateTime(booking?.expired_at)}
                />

                <InfoCard
                    icon={ShieldCheck}
                    label="Balance Deadline"
                    value={formatDateTime(booking?.payment_balance_due_at)}
                />

                <InfoCard
                    icon={TimerOff}
                    label="Auto-declined At"
                    value={formatDateTime(autoDeclined)}
                />
            </div>

            {state === 'auto_declined' || reason ? (
                <div className="mt-4 rounded-[1.15rem] border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                    <strong className="font-semibold">Auto-decline reason:</strong>{' '}
                    {reason || 'The booking deadline expired before completion.'}
                </div>
            ) : null}

            {!deadline ? (
                <div className="mt-4 rounded-[1.15rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/70 p-4 text-sm leading-7 text-[#6e604c] dark:border-white/10 dark:bg-white/[0.035] dark:text-white/56">
                    No deadline is currently attached to this booking. This usually means the record is already settled, approved, or was created before deadline tracking was enabled.
                </div>
            ) : null}
        </section>
    );
}

function InfoCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Clock3;
    label: string;
    value: string;
}) {
    return (
        <article className="rounded-[1.15rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="h-5 w-5 text-[#9d7b3d] dark:text-[#f1d89b]" />

            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#21180d] dark:text-white">
                {value}
            </p>
        </article>
    );
}
