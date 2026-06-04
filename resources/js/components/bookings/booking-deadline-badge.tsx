import { Clock3, ShieldCheck, TimerOff, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export type BookingDeadlineLike = {
    expired_at?: string | null;
    payment_balance_due_at?: string | null;
    auto_declined_at?: string | null;
    auto_decline_reason?: string | null;

    deadline_at?: string | null;
    deadlineAt?: string | null;

    deadline_state?: string | null;
    deadlineState?: string | null;

    deadline_label?: string | null;
    deadlineLabel?: string | null;

    booking_status?: string | null;
    bookingStatus?: string | null;

    payment_status?: string | null;
    paymentStatus?: string | null;
};

type BookingDeadlineBadgeProps = {
    booking?: BookingDeadlineLike | null;
    compact?: boolean;
    className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function parseDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function secondsUntil(value?: string | null): number | null {
    const date = parseDate(value);

    if (!date) {
        return null;
    }

    return Math.floor((date.getTime() - Date.now()) / 1000);
}

function deadlineOf(booking?: BookingDeadlineLike | null): string | null {
    if (!booking) {
        return null;
    }

    return (
        booking.deadline_at ??
        booking.deadlineAt ??
        booking.payment_balance_due_at ??
        booking.expired_at ??
        null
    );
}

function rawStateOf(booking?: BookingDeadlineLike | null): string {
    return String(booking?.deadline_state ?? booking?.deadlineState ?? '').toLowerCase();
}

function normalizedStatus(value?: string | null): string {
    return String(value ?? '').toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
}

function inferState(booking?: BookingDeadlineLike | null, seconds?: number | null): string {
    const explicit = rawStateOf(booking);

    if (explicit) {
        return explicit;
    }

    const bookingStatus = normalizedStatus(booking?.booking_status ?? booking?.bookingStatus);
    const paymentStatus = normalizedStatus(booking?.payment_status ?? booking?.paymentStatus);

    if (booking?.auto_declined_at || ['declined', 'rejected'].includes(bookingStatus)) {
        return 'auto_declined';
    }

    if (['paid', 'verified', 'completed', 'settled', 'approved'].includes(paymentStatus)) {
        return 'protected';
    }

    if (['approved', 'confirmed', 'completed'].includes(bookingStatus)) {
        return 'protected';
    }

    if (seconds == null) {
        return 'none';
    }

    if (seconds <= 0) {
        return 'expired';
    }

    if (seconds <= 60 * 60 * 3) {
        return 'due_soon';
    }

    return 'active';
}

function formatDuration(seconds: number | null): string {
    if (seconds == null) {
        return 'No deadline';
    }

    if (seconds <= 0) {
        return 'Expired';
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
        return `${days}d ${hours}h left`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m left`;
    }

    return `${Math.max(minutes, 1)}m left`;
}

function stateConfig(state: string) {
    if (state === 'auto_declined') {
        return {
            label: 'Auto-declined',
            icon: TimerOff,
            className:
                'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200',
            dot: 'bg-rose-500',
        };
    }

    if (state === 'expired') {
        return {
            label: 'Deadline expired',
            icon: TimerOff,
            className:
                'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200',
            dot: 'bg-rose-500',
        };
    }

    if (state === 'due_soon') {
        return {
            label: 'Due soon',
            icon: TriangleAlert,
            className:
                'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200',
            dot: 'bg-amber-500',
        };
    }

    if (state === 'protected') {
        return {
            label: 'Settled / Protected',
            icon: ShieldCheck,
            className:
                'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200',
            dot: 'bg-emerald-500',
        };
    }

    if (state === 'active') {
        return {
            label: 'Deadline active',
            icon: Clock3,
            className:
                'border-[#d9c7a6]/80 bg-[#fffaf0] text-[#7a5a24] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]',
            dot: 'bg-[#b08d48]',
        };
    }

    return {
        label: 'No deadline',
        icon: Clock3,
        className:
            'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/7 dark:text-white/52',
        dot: 'bg-slate-400',
    };
}

export default function BookingDeadlineBadge({
    booking,
    compact = false,
    className,
}: BookingDeadlineBadgeProps) {
    const deadline = deadlineOf(booking);
    const [remaining, setRemaining] = useState<number | null>(() => secondsUntil(deadline));

    useEffect(() => {
        setRemaining(secondsUntil(deadline));

        if (!deadline) {
            return;
        }

        const timer = window.setInterval(() => {
            setRemaining(secondsUntil(deadline));
        }, 30_000);

        return () => window.clearInterval(timer);
    }, [deadline]);

    const state = useMemo(() => inferState(booking, remaining), [booking, remaining]);
    const config = stateConfig(state);
    const Icon = config.icon;

    const explicitLabel = booking?.deadline_label ?? booking?.deadlineLabel;
    const label = explicitLabel || config.label;
    const countdown = formatDuration(remaining);

    return (
        <span
            className={cx(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm',
                config.className,
                className,
            )}
            title={deadline ? `Deadline: ${new Date(deadline).toLocaleString()}` : label}
        >
            <span className={cx('h-2 w-2 rounded-full', config.dot)} />
            <Icon className="h-3.5 w-3.5" />

            {compact ? (
                <span>{countdown}</span>
            ) : (
                <span>
                    {label}
                    {state === 'active' || state === 'due_soon' ? ` · ${countdown}` : ''}
                </span>
            )}
        </span>
    );
}
