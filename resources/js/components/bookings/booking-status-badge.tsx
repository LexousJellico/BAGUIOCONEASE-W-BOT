import { AlertCircle, CheckCircle2, Clock3, CreditCard, HelpCircle, ShieldCheck, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type BookingStatusBadgeProps = {
    value?: string | null;
    label?: string;
    compact?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
};

type StatusMeta = {
    label: string;
    icon: LucideIcon;
    className: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export function cleanBookingStatusLabel(value?: string | null): string {
    if (!value) {
        return 'Unknown';
    }

    return String(value)
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function bookingStatusMeta(value?: string | null): StatusMeta {
    const status = String(value ?? '').toLowerCase().replace(/[_\s]+/g, '-');

    const base = 'inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-[0.16em]';

    if (['approved', 'active', 'confirmed'].includes(status)) {
        return {
            label: cleanBookingStatusLabel(value),
            icon: CheckCircle2,
            className: `${base} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200`,
        };
    }

    if (['completed', 'done', 'closed'].includes(status)) {
        return {
            label: cleanBookingStatusLabel(value),
            icon: ShieldCheck,
            className: `${base} border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200`,
        };
    }

    if (['pending', 'pencil-booked', 'pencil', 'for-review', 'review'].includes(status)) {
        return {
            label: cleanBookingStatusLabel(value),
            icon: Clock3,
            className: `${base} border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100`,
        };
    }

    if (['declined', 'cancelled', 'canceled', 'deleted', 'expired'].includes(status)) {
        return {
            label: cleanBookingStatusLabel(value),
            icon: XCircle,
            className: `${base} border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100`,
        };
    }

    if (['paid', 'partial', 'unpaid', 'owing', 'payment-submitted', 'payment-review'].includes(status)) {
        return {
            label: cleanBookingStatusLabel(value),
            icon: CreditCard,
            className: `${base} border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100`,
        };
    }

    if (['failed', 'warning', 'issue'].includes(status)) {
        return {
            label: cleanBookingStatusLabel(value),
            icon: AlertCircle,
            className: `${base} border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-100`,
        };
    }

    return {
        label: cleanBookingStatusLabel(value),
        icon: HelpCircle,
        className: `${base} border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/7 dark:text-white/72`,
    };
}

export function BookingStatusBadge({
    value,
    label,
    compact = false,
    size,
    className,
}: BookingStatusBadgeProps) {
    const normalizedCompact = compact || size === 'sm';
    const meta = bookingStatusMeta(value);
    const Icon = meta.icon;

    return (
        <span
            className={cx(
                meta.className,
                normalizedCompact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]',
                className,
            )}
        >
            <Icon className={normalizedCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            {label || meta.label}
        </span>
    );
}

export default BookingStatusBadge;
