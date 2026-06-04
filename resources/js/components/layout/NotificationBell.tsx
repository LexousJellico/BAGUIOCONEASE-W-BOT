import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import {
    Bell,
    Calendar,
    CalendarOff,
    CheckCheck,
    CreditCard,
    Info,
    Package,
    RefreshCw,
    Shield,
    Sparkles,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type NotificationSummary = {
    id: number;
    type: string | null;
    title: string;
    message: string | null;
    link: string | null;
    read_at: string | null;
    created_at: string | null;
    is_unread?: boolean;
    actor_name?: string | null;
    actor_email?: string | null;
    acted_at?: string | null;
};

type SharedProps = {
    notifications?: {
        unread_count: number;
        latest: NotificationSummary[];
    };
};

function formatRelativeTime(iso: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';

    const diffMs = Date.now() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;

    return d.toLocaleDateString();
}

function formatAbsoluteTime(iso: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function parseMetaFromMessage(message: string | null): {
    meta: { name: string; email?: string; at: string } | null;
    body: string | null;
} {
    if (!message) return { meta: null, body: null };

    const msg = message.trim();

    let m = msg.match(/^By\s+(.+?)\s+\((.+?)\)\s+•\s+(.+?)\.\s*(.*)$/s);
    if (m) {
        const name = (m[1] ?? '').trim();
        const email = (m[2] ?? '').trim();
        const at = (m[3] ?? '').trim();
        const body = (m[4] ?? '').trim();
        return {
            meta: name && at ? { name, email: email || undefined, at } : null,
            body: body || null,
        };
    }

    m = msg.match(/^By\s+(.+?)\s+•\s+(.+?)\.\s*(.*)$/s);
    if (m) {
        const name = (m[1] ?? '').trim();
        const at = (m[2] ?? '').trim();
        const body = (m[3] ?? '').trim();
        return {
            meta: name && at ? { name, at } : null,
            body: body || null,
        };
    }

    return { meta: null, body: msg };
}

function NotificationIcon({ type }: { type: string | null }) {
    if (!type) return <Info className="h-4 w-4 text-slate-500" />;

    if (type === 'booking_status_changed')
        return <RefreshCw className="h-4 w-4 text-amber-600" />;
    if (type === 'booking_lifecycle_maintenance')
        return <Sparkles className="h-4 w-4 text-violet-600" />;
    if (type.startsWith('booking'))
        return <Calendar className="h-4 w-4 text-emerald-600" />;
    if (type.startsWith('payment'))
        return <CreditCard className="h-4 w-4 text-blue-600" />;
    if (type.startsWith('calendar_block'))
        return <CalendarOff className="h-4 w-4 text-rose-600" />;
    if (type.includes('roles'))
        return <Shield className="h-4 w-4 text-violet-600" />;
    if (type.endsWith('_updated'))
        return <RefreshCw className="h-4 w-4 text-amber-600" />;
    if (type.startsWith('service_') || type.startsWith('service_type_')) {
        return <Package className="h-4 w-4 text-indigo-600" />;
    }
    if (type.startsWith('user_'))
        return <Users className="h-4 w-4 text-cyan-700" />;

    return <Info className="h-4 w-4 text-slate-500" />;
}

function isToday(iso: string | null) {
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;

    const now = new Date();

    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
}

function toneClasses(type: string | null, unread: boolean) {
    const base = unread
        ? 'border-transparent'
        : 'border-black/5 dark:border-white/10';

    if (type === 'booking_lifecycle_maintenance') {
        return `${base} bg-violet-50/90 dark:bg-violet-500/10`;
    }

    if (type === 'booking_status_changed' || type?.endsWith('_updated')) {
        return `${base} bg-amber-50/90 dark:bg-amber-500/10`;
    }

    if (type?.startsWith('payment')) {
        return `${base} bg-sky-50/90 dark:bg-sky-500/10`;
    }

    if (type?.startsWith('calendar_block')) {
        return `${base} bg-rose-50/90 dark:bg-rose-500/10`;
    }

    if (type?.startsWith('booking')) {
        return `${base} bg-emerald-50/90 dark:bg-emerald-500/10`;
    }

    return `${base} bg-white dark:bg-white/5`;
}

export default function NotificationBell() {
    const page = usePage<SharedProps>();
    const initialUnread = page.props.notifications?.unread_count ?? 0;
    const initialLatest = page.props.notifications?.latest ?? [];

    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(initialUnread);
    const [latest, setLatest] = useState<NotificationSummary[]>(initialLatest);
    const [refreshing, setRefreshing] = useState(false);

    const inFlight = useRef(false);

    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        setRefreshing(true);

        try {
            const res = await fetch('/notifications/summary', {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (!res.ok) return;

            const data = (await res.json()) as {
                unread_count?: number;
                latest?: NotificationSummary[];
            };

            setUnreadCount(
                typeof data.unread_count === 'number' ? data.unread_count : 0,
            );
            setLatest(Array.isArray(data.latest) ? data.latest : []);
        } catch {
            // ignore
        } finally {
            setRefreshing(false);
            inFlight.current = false;
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        const id = window.setInterval(() => {
            if (!document.hidden) refresh();
        }, 15000);

        return () => window.clearInterval(id);
    }, [refresh]);

    const handleOpen = (n: NotificationSummary) => {
        const isUnreadNow =
            typeof n.is_unread === 'boolean' ? n.is_unread : !n.read_at;

        if (isUnreadNow) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setLatest((prev) =>
                prev.map((x) =>
                    x.id === n.id
                        ? {
                              ...x,
                              read_at: x.read_at ?? new Date().toISOString(),
                              is_unread: false,
                          }
                        : x,
                ),
            );
        }

        router.visit(`/notifications/${n.id}/open`);
    };

    const handleMarkAllAsRead = () => {
        router.post(
            '/notifications/read-all',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    const nowIso = new Date().toISOString();
                    setUnreadCount(0);
                    setLatest((prev) =>
                        prev.map((x) =>
                            x.read_at
                                ? x
                                : { ...x, read_at: nowIso, is_unread: false },
                        ),
                    );
                    refresh();
                },
            },
        );
    };

    const grouped = useMemo(() => {
        const today: NotificationSummary[] = [];
        const earlier: NotificationSummary[] = [];

        latest.forEach((item) => {
            if (isToday(item.created_at)) {
                today.push(item);
            } else {
                earlier.push(item);
            }
        });

        return { today, earlier };
    }, [latest]);

    const renderRow = (n: NotificationSummary) => {
        const isUnread =
            typeof n.is_unread === 'boolean' ? n.is_unread : !n.read_at;
        const parsed = parseMetaFromMessage(n.message);

        const meta =
            parsed.meta ??
            (n.actor_name || n.actor_email || n.acted_at
                ? {
                      name: (n.actor_name ?? 'System').trim() || 'System',
                      email: n.actor_email ?? undefined,
                      at: (
                          n.acted_at ?? formatAbsoluteTime(n.created_at)
                      ).trim(),
                  }
                : null);

        const body = parsed.body;
        const absoluteAt =
            meta?.at?.trim() || formatAbsoluteTime(n.created_at) || '';

        return (
            <DropdownMenuItem
                key={n.id}
                onClick={() => handleOpen(n)}
                className="cursor-pointer px-3 py-2 focus:bg-transparent"
            >
                <div
                    className={cn(
                        'relative w-full overflow-hidden rounded-[1.25rem] border p-3 transition',
                        toneClasses(n.type, isUnread),
                        isUnread && 'shadow-[0_12px_30px_rgba(15,23,42,0.08)]',
                    )}
                >
                    {isUnread ? (
                        <span className="absolute top-0 left-0 h-full w-1 rounded-r bg-amber-500/85" />
                    ) : null}

                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                'mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                                isUnread
                                    ? 'border-amber-400/30 bg-amber-100/80 dark:border-amber-400/20 dark:bg-amber-500/10'
                                    : 'border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/10',
                            )}
                        >
                            <NotificationIcon type={n.type} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="truncate text-sm leading-tight font-semibold text-slate-900 dark:text-white">
                                            {n.title}
                                        </div>

                                        {n.type ===
                                        'booking_lifecycle_maintenance' ? (
                                            <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-[2px] text-[10px] font-bold tracking-[0.14em] text-violet-700 uppercase dark:bg-violet-500/10 dark:text-violet-200">
                                                Maintenance
                                            </span>
                                        ) : null}

                                        {n.type === 'booking_status_changed' ||
                                        (n.type?.endsWith('_updated') ??
                                            false) ? (
                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-[2px] text-[10px] font-bold tracking-[0.14em] text-amber-700 uppercase dark:bg-amber-500/10 dark:text-amber-200">
                                                Updated
                                            </span>
                                        ) : null}
                                    </div>

                                    {meta || absoluteAt ? (
                                        <div className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                                            <span>By </span>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                                {meta?.name ?? 'System'}
                                            </span>
                                            {meta?.email ? (
                                                <>
                                                    <span> (</span>
                                                    <a
                                                        href={`mailto:${meta.email}`}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="underline decoration-dotted hover:decoration-solid"
                                                    >
                                                        {meta.email}
                                                    </a>
                                                    <span>)</span>
                                                </>
                                            ) : null}
                                            {absoluteAt ? (
                                                <span> • {absoluteAt}</span>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    {body ? (
                                        <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
                                            {body}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="shrink-0 text-right">
                                    {isUnread ? (
                                        <div className="inline-flex rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-amber-900 uppercase dark:bg-amber-900/40 dark:text-amber-100">
                                            New
                                        </div>
                                    ) : null}
                                    <div className="mt-1 text-[10px] text-slate-400">
                                        {formatRelativeTime(n.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DropdownMenuItem>
        );
    };

    const hasScrollableList = latest.length > 5;

    return (
        <DropdownMenu
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (v) refresh();
            }}
        >
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full border border-black/10 bg-white/80 text-slate-700 shadow-sm hover:bg-white dark:border-white/10 dark:bg-[#171b25] dark:text-white dark:hover:bg-white/10"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-[5px] text-[10px] font-bold text-white shadow-sm">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                forceMount
                className="w-[400px] overflow-hidden rounded-[1.6rem] border border-black/10 p-0 shadow-[0_24px_70px_rgba(15,23,42,0.18)] dark:border-white/10"
            >
                <div className="border-b border-black/5 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold">
                                    Notifications
                                </span>
                                {unreadCount > 0 ? (
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-[2px] text-[11px] font-medium text-primary">
                                        {unreadCount} unread
                                    </span>
                                ) : null}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                Live summary of booking, payment, calendar, and
                                admin actions
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => refresh()}
                                className="h-8 w-8 rounded-full"
                                aria-label="Refresh notifications"
                            >
                                <RefreshCw
                                    className={cn(
                                        'h-4 w-4',
                                        refreshing && 'animate-spin',
                                    )}
                                />
                            </Button>

                            {unreadCount > 0 ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    className="h-8 rounded-full px-3 text-xs"
                                >
                                    <CheckCheck className="mr-1 h-4 w-4" />
                                    Mark all
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </div>

                {latest.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                        <Bell className="mx-auto h-9 w-9 text-slate-400/70" />
                        <div className="mt-3 text-sm font-medium">
                            No notifications
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            You’re all caught up.
                        </div>
                    </div>
                ) : (
                    <div
                        className={cn(
                            'px-2 py-2',
                            hasScrollableList &&
                                'max-h-[430px] overflow-y-auto',
                        )}
                    >
                        {grouped.today.length > 0 ? (
                            <div>
                                <div className="px-2 pt-1 pb-1 text-[11px] font-bold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
                                    Today
                                </div>
                                <div className="space-y-2">
                                    {grouped.today.map(renderRow)}
                                </div>
                            </div>
                        ) : null}

                        {grouped.earlier.length > 0 ? (
                            <div
                                className={
                                    grouped.today.length > 0 ? 'mt-3' : ''
                                }
                            >
                                <div className="px-2 pt-1 pb-1 text-[11px] font-bold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
                                    Earlier
                                </div>
                                <div className="space-y-2">
                                    {grouped.earlier.map(renderRow)}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                <div className="border-t border-black/5 bg-white/90 p-2 dark:border-white/10 dark:bg-[#10141d]">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center rounded-full text-xs"
                        onClick={() => {
                            setOpen(false);
                            router.visit('/notifications');
                        }}
                    >
                        View all notifications
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
