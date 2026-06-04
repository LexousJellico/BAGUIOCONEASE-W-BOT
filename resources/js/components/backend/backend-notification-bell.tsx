import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BookOpenCheck, CalendarClock, ChevronDown, CreditCard, MessageSquareText, UserPlus, ListChecks } from 'lucide-react';
import { useMemo, useState } from 'react';

type NotificationSummary = {
    totalUnread?: number;
    newInquiries?: number;
    pendingBookings?: number;
    pendingPayments?: number;
    newUsers?: number;
};

type PageProps = {
    notificationSummary?: NotificationSummary;
    auth?: {
        user?: {
            role?: string | null;
            role_name?: string | null;
        } | null;
    } | null;
};

function count(value?: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function currentRoleBase() {
    if (typeof window === 'undefined') return '/admin';
    const path = window.location.pathname;
    if (path.startsWith('/manager')) return '/manager';
    if (path.startsWith('/staff')) return '/staff';
    if (path.startsWith('/my-') || path.startsWith('/book')) return '/client';
    return '/admin';
}

function roleFromPage(props: PageProps) {
    const explicit = String(props.auth?.user?.role || props.auth?.user?.role_name || '').toLowerCase();
    if (explicit.includes('manager')) return 'manager';
    if (explicit.includes('staff')) return 'staff';
    if (explicit.includes('admin')) return 'admin';
    if (explicit.includes('client') || explicit.includes('user')) return 'user';

    const base = currentRoleBase();
    if (base === '/client') return 'user';
    if (base === '/manager') return 'manager';
    if (base === '/staff') return 'staff';
    return 'admin';
}

function hrefFor(type: 'inquiries' | 'bookings' | 'payments') {
    const base = currentRoleBase();
    if (base === '/client') return type === 'bookings' ? '/my-bookings' : '/my-dashboard';
    if (type === 'inquiries') return `${base}/inquiries`;
    if (type === 'payments') return base === '/staff' ? '/staff/bookings' : `${base}/payments/review`;
    return `${base}/bookings`;
}

export default function BackendNotificationBell() {
    const { props } = usePage<PageProps>();
    const [open, setOpen] = useState(false);
    const role = roleFromPage(props);
    const summary = props.notificationSummary ?? {};

    const items = useMemo(() => {
        if (role === 'user') {
            return [
                {
                    label: 'Booking updates',
                    description: 'Status changes, schedule notes, payment reminders, and next steps for your booking.',
                    value: count(summary.totalUnread) || count(summary.pendingBookings),
                    href: '/notifications',
                    icon: CalendarClock,
                },
                {
                    label: 'My calendar',
                    description: 'Review your selected dates and visible booking calendar details.',
                    value: 0,
                    href: '/my-calendar',
                    icon: Bell,
                },
                {
                    label: 'Create new booking',
                    description: 'Start another reservation request through the official booking flow.',
                    value: 0,
                    href: '/book',
                    icon: BookOpenCheck,
                },
            ];
        }

        return [
            {
                label: 'Public inquiries',
                description: 'Messages submitted from the public contact page.',
                value: count(summary.newInquiries),
                href: hrefFor('inquiries'),
                icon: MessageSquareText,
            },
            {
                label: 'Pending bookings',
                description: 'Booking requests waiting for review.',
                value: count(summary.pendingBookings),
                href: hrefFor('bookings'),
                icon: CalendarClock,
            },
            {
                label: 'Payment review',
                description: 'Submitted proofs requiring verification.',
                value: count(summary.pendingPayments),
                href: hrefFor('payments'),
                icon: CreditCard,
            },
            {
                label: 'New user accounts',
                description: 'Client accounts created from registration that need admin awareness.',
                value: count(summary.newUsers),
                href: '/notifications?kind=users&status=unread',
                icon: UserPlus,
            },
            {
                label: 'Notification index',
                description: 'Open the complete notification center with filters and read/unread status.',
                value: count(summary.totalUnread),
                href: '/notifications',
                icon: ListChecks,
            },
        ];
    }, [role, summary.newInquiries, summary.pendingBookings, summary.pendingPayments, summary.newUsers, summary.totalUnread]);

    const total = role === 'user' ? count(summary.totalUnread) || count(summary.pendingBookings) : count(summary.totalUnread) || items.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="backend-notification-bell relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="backend-notification-button relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200/80 bg-white/78 text-slate-900 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                aria-label="Open notifications"
                aria-expanded={open}
            >
                <Bell className="h-4 w-4" />
                {total > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-[0_10px_24px_rgba(225,29,72,0.35)]">{total > 99 ? '99+' : total}</span> : null}
            </button>

            <AnimatePresence>
                {open ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="backend-notification-menu absolute right-0 top-full z-[90] mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white/96 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101419]/96"
                    >
                        <div className="rounded-[1rem] bg-slate-100/80 p-3 dark:bg-white/7">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f7465] dark:text-[#7dd7c6]">Notifications</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                                        {role === 'user' ? 'Your private system messages' : total > 0 ? `${total} item${total === 1 ? '' : 's'} need attention` : 'No urgent notifications'}
                                    </p>
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-400 dark:text-white/42" />
                            </div>
                        </div>

                        <div className="mt-2 grid gap-1">
                            {items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-[1rem] px-3 py-3 transition hover:bg-slate-100 dark:hover:bg-white/8">
                                        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7f2f0] text-[#1f7465] dark:bg-white/10 dark:text-[#7dd7c6]">
                                            <Icon className="h-4 w-4" />
                                            {item.value > 0 ? <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-600 ring-2 ring-white dark:ring-[#101419]" /> : null}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.label}</span>
                                                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#1f7465] dark:bg-white/10 dark:text-[#7dd7c6]">{item.value}</span>
                                            </span>
                                            <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-white/52">{item.description}</span>
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
