import { confirmBcccAction } from '@/components/ui/bccc-confirm-dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    Bell,
    BellRing,
    Bot,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Eye,
    FileText,
    Filter,
    LayoutGrid,
    MessageCircle,
    Search,
    Settings,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Trash2,
    UserCog,
    X,
} from 'lucide-react';
import {
    type CSSProperties,
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react';

type NotificationItem = {
    id: number | string;
    type?: string | null;
    kind?: string | null;
    action_key?: string | null;
    severity?: 'info' | 'success' | 'warning' | 'danger' | string | null;
    audience?: string | null;
    privacy_scope?: string | null;
    title: string;
    message?: string | null;
    link?: string | null;
    read_at?: string | null;
    created_at?: string | null;
    is_unread?: boolean;
    actor?: {
        id?: number | string;
        name?: string | null;
        email?: string | null;
    } | null;
};

type PaginationLink = {
    url?: string | null;
    label?: string | null;
    active?: boolean;
};

type PaginationMeta = {
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    per_page?: number;
};

type Feed = {
    data?: NotificationItem[];
    links?: PaginationLink[];
    meta?: PaginationMeta;
};

type Props = {
    notificationFeed?: Feed | NotificationItem[];
    notifications?: Feed | NotificationItem[];
    notificationFilters?: {
        q?: string;
        status?: 'all' | 'unread' | 'read' | string;
        kind?: string;
    };
    notificationStats?: Record<string, number | undefined>;
    automationLatest?: Feed | NotificationItem[];
    isClientNotificationCenter?: boolean;
    notificationKindOptions?: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

const optionLabels: Record<string, string> = {
    all: 'All Types',
    automation: 'Automation',
    bookings: 'Bookings',
    payments: 'Payments',
    calendar: 'Calendar',
    services: 'Services',
    users: 'Users / Accounts',
    account: 'My Account',
    inquiries: 'Inquiries',
    mice: 'MICE',
    deadline: 'Deadlines',
    content: 'Content',
    system: 'System',
};

function collection(value: unknown): NotificationItem[] {
    if (Array.isArray(value)) return value as NotificationItem[];

    if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as { data?: unknown[] }).data)
    ) {
        return (value as { data: NotificationItem[] }).data;
    }

    return [];
}

function linksOf(value: unknown): PaginationLink[] {
    if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as { links?: PaginationLink[] }).links)
    ) {
        return (value as { links: PaginationLink[] }).links;
    }

    if (
        value &&
        typeof value === 'object' &&
        Array.isArray(
            (value as { meta?: { links?: PaginationLink[] } }).meta?.links,
        )
    ) {
        return (value as { meta: { links: PaginationLink[] } }).meta.links;
    }

    return [];
}

function metaOf(value: unknown): PaginationMeta | null {
    if (
        value &&
        typeof value === 'object' &&
        (value as { meta?: unknown }).meta
    ) {
        return (value as { meta: PaginationMeta }).meta;
    }

    return null;
}

function cleanLabel(value?: string | null) {
    return String(value || 'System')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compactDateTime(value?: string | null) {
    if (!value) return 'No date';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function notificationIcon(type?: string | null, kind?: string | null) {
    const normalized = `${type || ''} ${kind || ''}`.toLowerCase();

    if (normalized.includes('payment')) return CreditCard;
    if (normalized.includes('booking')) return ShieldCheck;
    if (normalized.includes('calendar')) return CalendarDays;
    if (normalized.includes('automation') || normalized.includes('deadline'))
        return BellRing;
    if (normalized.includes('mice')) return FileText;
    if (normalized.includes('inquiry')) return MessageCircle;
    if (
        normalized.includes('user') ||
        normalized.includes('account') ||
        normalized.includes('role')
    )
        return UserCog;
    if (normalized.includes('content')) return FileText;
    if (normalized.includes('system')) return Settings;

    return Bell;
}

function typeClass(type?: string | null, kind?: string | null) {
    const normalized = `${type || ''} ${kind || ''}`.toLowerCase();

    if (normalized.includes('payment')) return 'is-payment';
    if (normalized.includes('booking')) return 'is-booking';
    if (normalized.includes('calendar')) return 'is-calendar';
    if (normalized.includes('automation') || normalized.includes('deadline'))
        return 'is-automation';
    if (normalized.includes('mice')) return 'is-mice';
    if (normalized.includes('inquiry')) return 'is-deadline';

    return '';
}

function severityClass(severity?: string | null) {
    const normalized = String(severity || 'info').toLowerCase();

    if (['success', 'good', 'approved'].includes(normalized)) return 'is-good';
    if (['danger', 'error', 'rejected', 'declined'].includes(normalized))
        return 'is-bad';
    if (['warning', 'warn', 'due'].includes(normalized)) return 'is-warn';

    return '';
}

function isUnread(item: NotificationItem) {
    return item.is_unread || !item.read_at;
}

function notificationKind(item: NotificationItem) {
    return cleanLabel(item.kind || item.type || item.action_key || 'System');
}

function statForKind(
    value: string,
    stats: Record<string, number | undefined>,
    total: number,
    feed: NotificationItem[],
) {
    if (value === 'all') return total;

    const mappedKey = value === 'account' ? 'users' : value;
    const direct = stats[value] ?? stats[mappedKey];

    if (typeof direct === 'number') return direct;

    return feed.filter((item) => {
        const normalized =
            `${item.type || ''} ${item.kind || ''} ${item.title || ''} ${item.message || ''}`.toLowerCase();
        const keyword = value.replaceAll('-', ' ');

        return normalized.includes(keyword) || normalized.includes(value);
    }).length;
}

function paginationLabel(label?: string | null) {
    return String(label || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&laquo;|&raquo;/g, '')
        .trim();
}

function Pagination({
    links,
    meta,
}: {
    links: PaginationLink[];
    meta?: PaginationMeta | null;
}) {
    if (!links.length) return null;

    const cleaned = links.map((link) => ({
        ...link,
        label: paginationLabel(link.label),
    }));
    const previous = cleaned[0];
    const next = cleaned[cleaned.length - 1];
    const pages = cleaned.slice(1, -1).filter((link) => link.label);
    const currentPage =
        meta?.current_page ?? pages.find((link) => link.active)?.label ?? 1;
    const lastPage = meta?.last_page ?? pages.at(-1)?.label ?? currentPage;
    const range =
        meta && meta.total !== undefined
            ? `Showing ${meta.from ?? 0}-${meta.to ?? 0} of ${meta.total}`
            : '10 notifications per page';

    return (
        <div className="notification-pagination">
            <div>
                <strong>
                    Page {currentPage} of {lastPage}
                </strong>
                <span>{range}</span>
            </div>

            <nav aria-label="Notification pages">
                {previous?.url ? (
                    <Link
                        href={previous.url}
                        preserveScroll
                        className="notification-page-control"
                    >
                        Previous
                    </Link>
                ) : (
                    <span className="notification-page-control is-disabled">
                        Previous
                    </span>
                )}

                <div className="notification-page-numbers">
                    {pages.map((link, index) =>
                        link.url ? (
                            <Link
                                key={`${link.label}-${index}`}
                                href={link.url}
                                preserveScroll
                                className={link.active ? 'is-active' : ''}
                                aria-current={link.active ? 'page' : undefined}
                            >
                                {link.label}
                            </Link>
                        ) : (
                            <span key={`${link.label}-${index}`}>
                                {link.label}
                            </span>
                        ),
                    )}
                </div>

                {next?.url ? (
                    <Link
                        href={next.url}
                        preserveScroll
                        className="notification-page-control"
                    >
                        Next
                    </Link>
                ) : (
                    <span className="notification-page-control is-disabled">
                        Next
                    </span>
                )}
            </nav>
        </div>
    );
}

function StatCard({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    helper: string;
    icon: typeof Bell;
}) {
    return (
        <article className="notification-kpi">
            <div className="notification-kpi-topline">
                <div>
                    <p className="backend-booking-label">{label}</p>
                    <strong>{value}</strong>
                </div>
                <div className="alh-admin-kpi-icon">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p>{helper}</p>
        </article>
    );
}

function SystemBotNotice({
    feed,
    unreadCount,
    totalCount,
    isClient,
}: {
    feed: NotificationItem[];
    unreadCount: number;
    totalCount: number;
    isClient: boolean;
}) {
    const latestUnread = feed.find(isUnread);
    const latest = latestUnread ?? feed[0] ?? null;
    const latestMessage = latest?.message
        ? latest.message
        : latest
          ? 'Open this notice for the full details.'
          : isClient
            ? 'Your booking, payment, deadline, and account updates will appear here as soon as there is something to review.'
            : 'Monitoring updates will appear here as the system records booking, payment, calendar, and account activity.';
    const botTitle =
        unreadCount > 0
            ? `${unreadCount} notice${unreadCount === 1 ? '' : 's'} need attention`
            : totalCount > 0
              ? 'All visible notices are already read'
              : 'No notices yet';

    return (
        <section className="notification-system-bot notification-panel">
            <div className="notification-system-bot-avatar">
                <Bot className="h-5 w-5" />
            </div>

            <div className="notification-system-bot-copy">
                <p className="backend-booking-label">BCCC EASE System Bot</p>
                <h2>{botTitle}</h2>
                <span>
                    {latest ? (
                        <>
                            <strong>{latest.title}</strong>
                            {' - '}
                            {latestMessage}
                        </>
                    ) : (
                        latestMessage
                    )}
                </span>
            </div>

            {latest ? (
                <Link
                    href={`/notifications/${latest.id}/open`}
                    className="notification-system-bot-action"
                >
                    <Eye className="h-4 w-4" />
                    Open Latest
                </Link>
            ) : null}
        </section>
    );
}

function ClientConversation({
    feed,
    links,
    meta,
    selectedIds,
    allVisibleSelected,
    hasSelection,
    selectedUnreadCount,
    onToggleAll,
    onToggleSelected,
    onMarkSelectedRead,
    onDeleteSelected,
    onDeleteAll,
    onDeleteOne,
}: {
    feed: NotificationItem[];
    links: PaginationLink[];
    meta?: PaginationMeta | null;
    selectedIds: string[];
    allVisibleSelected: boolean;
    hasSelection: boolean;
    selectedUnreadCount: number;
    onToggleAll: () => void;
    onToggleSelected: (id: NotificationItem['id']) => void;
    onMarkSelectedRead: () => void;
    onDeleteSelected: () => void;
    onDeleteAll: () => void;
    onDeleteOne: (item: NotificationItem) => void;
}) {
    const unreadCount = feed.filter(isUnread).length;

    return (
        <main className="notification-conversation-shell notification-client-center">
            <div className="notification-conversation-header">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e7f2f0] text-[#1f7465] dark:bg-white/10 dark:text-[#7dd7c6]">
                    <Bot className="h-5 w-5" />
                </span>
                <div>
                    <p className="backend-booking-label">
                        Private system conversation
                    </p>
                    <h2>BCCC EASE System Bot</h2>
                    <span>
                        Only your own booking, payment, account, and system
                        messages are shown here.
                    </span>
                </div>
                <div className="notification-client-summary">
                    <strong>{unreadCount}</strong>
                    <span>Unread</span>
                </div>
            </div>

            <div className="notification-bulk-toolbar notification-bulk-toolbar-client">
                <button
                    type="button"
                    onClick={onToggleAll}
                    className="notification-cleanup-button"
                >
                    <span
                        className="notification-select-box"
                        aria-hidden="true"
                    >
                        {allVisibleSelected ? '✓' : ''}
                    </span>
                    {allVisibleSelected
                        ? 'Unselect visible'
                        : 'Select all visible'}
                </button>
                <button
                    type="button"
                    onClick={onMarkSelectedRead}
                    disabled={selectedUnreadCount <= 0}
                    className="notification-cleanup-button"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark selected read ({selectedUnreadCount})
                </button>
                <button
                    type="button"
                    onClick={onDeleteSelected}
                    disabled={!hasSelection}
                    className="notification-cleanup-button is-danger"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete selected ({selectedIds.length})
                </button>
                <button
                    type="button"
                    onClick={onDeleteAll}
                    className="notification-cleanup-button is-danger-ghost"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete all
                </button>
            </div>

            <div className="notification-conversation-thread">
                {feed.length > 0 ? (
                    feed.map((item) => {
                        const Icon = notificationIcon(item.type, item.kind);
                        const unread = isUnread(item);
                        const checked = selectedIds.includes(String(item.id));

                        return (
                            <article
                                key={item.id}
                                className={`notification-chat-message ${unread ? 'is-unread' : ''}`}
                            >
                                <label
                                    className="notification-row-select notification-row-select-chat"
                                    aria-label={`Select notification ${item.title}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                            onToggleSelected(item.id)
                                        }
                                    />
                                    <span />
                                </label>
                                <div className="notification-chat-avatar">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="notification-chat-bubble">
                                    <div className="notification-chat-action-row">
                                        <Link
                                            href={`/notifications/${item.id}/open`}
                                            className="notification-chat-action"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Open
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => onDeleteOne(item)}
                                            className="notification-chat-action notification-delete-action"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="notification-bot-author">
                                            BCCC EASE Bot
                                        </span>
                                        <span
                                            className={`alh-status-chip ${severityClass(item.severity)}`}
                                        >
                                            {cleanLabel(
                                                item.severity ||
                                                    notificationKind(item),
                                            )}
                                        </span>
                                        {unread ? (
                                            <span className="alh-status-chip is-warn">
                                                Unread
                                            </span>
                                        ) : null}
                                        <span className="booking-mini-pill">
                                            <Clock3 className="h-3.5 w-3.5" />{' '}
                                            {compactDateTime(item.created_at)}
                                        </span>
                                    </div>
                                    <h3>{item.title}</h3>
                                    {item.message ? (
                                        <p>{item.message}</p>
                                    ) : null}
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <div className="ops-empty-state">
                        <Bell className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                        <h3>No private messages yet</h3>
                        <p>
                            Your booking, payment, deadline, and account
                            messages will appear here.
                        </p>
                    </div>
                )}
            </div>

            <Pagination links={links} meta={meta} />
        </main>
    );
}

export default function NotificationsIndex({
    notificationFeed,
    notifications,
    notificationFilters,
    notificationStats,
    automationLatest,
    isClientNotificationCenter = false,
    notificationKindOptions,
}: Props) {
    const feedSource = notificationFeed ?? notifications;
    const feed = useMemo(() => collection(feedSource), [feedSource]);
    const pageLinks = useMemo(() => linksOf(feedSource), [feedSource]);
    const pageMeta = useMemo(() => metaOf(feedSource), [feedSource]);
    const automation = useMemo(
        () => collection(automationLatest),
        [automationLatest],
    );

    const [q, setQ] = useState(String(notificationFilters?.q ?? ''));
    const [status, setStatus] = useState(
        String(notificationFilters?.status ?? 'all'),
    );
    const [kind, setKind] = useState(
        String(notificationFilters?.kind ?? 'all'),
    );
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        setSelectedIds((current) =>
            current.filter((id) => feed.some((item) => String(item.id) === id)),
        );
    }, [feed]);

    const stats = notificationStats ?? {};
    const totalCount =
        stats.total ?? stats.all ?? pageMeta?.total ?? feed.length;
    const unreadCount = stats.unread ?? feed.filter(isUnread).length;
    const readCount = stats.read ?? Math.max(totalCount - unreadCount, 0);
    const unreadPercent =
        totalCount > 0 ? Math.round((unreadCount / totalCount) * 100) : 0;
    const visibleRange =
        pageMeta?.total !== undefined
            ? `${pageMeta.from ?? 0}-${pageMeta.to ?? 0} of ${pageMeta.total}`
            : `${feed.length} visible`;
    const activeFilterCount = [
        q.trim(),
        status !== 'all' ? status : '',
        kind !== 'all' ? kind : '',
    ].filter(Boolean).length;
    const visibleIds = feed.map((item) => String(item.id));
    const hasSelection = selectedIds.length > 0;
    const allVisibleSelected =
        visibleIds.length > 0 &&
        visibleIds.every((id) => selectedIds.includes(id));
    const selectedUnreadIds = feed
        .filter(
            (item) => selectedIds.includes(String(item.id)) && isUnread(item),
        )
        .map((item) => String(item.id));
    const kindOptions = (
        notificationKindOptions && notificationKindOptions.length > 0
            ? notificationKindOptions
            : [
                  'all',
                  'automation',
                  'bookings',
                  'payments',
                  'calendar',
                  'services',
                  'users',
                  'system',
              ]
    ).map((value) => ({
        value,
        label: optionLabels[value] ?? cleanLabel(value),
        count: statForKind(value, stats, totalCount, feed),
    }));
    const quickKindOptions = kindOptions.slice(
        0,
        isClientNotificationCenter ? 8 : 12,
    );
    const breakdownItems = [
        ['Bookings', stats.bookings ?? 0],
        ['Payments', stats.payments ?? 0],
        ['Calendar', stats.calendar ?? 0],
        ['Inquiries', stats.inquiries ?? 0],
        ['MICE', stats.mice ?? 0],
        ['Deadlines', stats.deadline ?? 0],
        ['Users', stats.users ?? 0],
        ['Content', stats.content ?? 0],
        ['System', stats.system ?? 0],
    ] as const;
    const maxBreakdown = Math.max(
        ...breakdownItems.map(([, value]) => Number(value) || 0),
        1,
    );

    function applyFilters(event?: FormEvent<HTMLFormElement>) {
        event?.preventDefault();

        router.get(
            '/notifications',
            {
                q: q || undefined,
                status: status && status !== 'all' ? status : undefined,
                kind: kind && kind !== 'all' ? kind : undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function resetFilters() {
        setQ('');
        setStatus('all');
        setKind('all');

        router.get(
            '/notifications',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function markAllRead() {
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    }

    function markSelectedRead() {
        if (selectedUnreadIds.length === 0) {
            return;
        }

        router.post(
            '/notifications/read-all',
            {
                ids: selectedUnreadIds,
            },
            {
                preserveScroll: true,
                onSuccess: () =>
                    setSelectedIds((current) =>
                        current.filter((id) => !selectedUnreadIds.includes(id)),
                    ),
            },
        );
    }

    function toggleSelected(id: NotificationItem['id']) {
        const key = String(id);

        setSelectedIds((current) =>
            current.includes(key)
                ? current.filter((item) => item !== key)
                : [...current, key],
        );
    }

    function toggleAllVisible() {
        if (allVisibleSelected) {
            setSelectedIds((current) =>
                current.filter((id) => !visibleIds.includes(id)),
            );
            return;
        }

        setSelectedIds((current) =>
            Array.from(new Set([...current, ...visibleIds])),
        );
    }

    async function deleteOne(item: NotificationItem) {
        const confirmed = await confirmBcccAction({
            title: 'Delete notification?',
            message: `This will permanently remove "${item.title}" from your notification center.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            tone: 'danger',
        });

        if (!confirmed) {
            return;
        }

        router.delete(`/notifications/${item.id}`, {
            preserveScroll: true,
            onSuccess: () =>
                setSelectedIds((current) =>
                    current.filter((id) => id !== String(item.id)),
                ),
        });
    }

    async function deleteSelected() {
        if (!hasSelection) {
            return;
        }

        const confirmed = await confirmBcccAction({
            title: 'Delete selected notifications?',
            message: `This will permanently remove ${selectedIds.length} selected notification${selectedIds.length === 1 ? '' : 's'} from your account.`,
            confirmText: 'Delete Selected',
            cancelText: 'Cancel',
            tone: 'danger',
        });

        if (!confirmed) {
            return;
        }

        router.visit('/notifications', {
            method: 'delete',
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    }

    async function deleteAll() {
        const confirmed = await confirmBcccAction({
            title: 'Delete all notifications?',
            message:
                'This will permanently remove every notification in your account. This cleanup applies only to your own notification center.',
            confirmText: 'Delete All',
            cancelText: 'Cancel',
            tone: 'danger',
        });

        if (!confirmed) {
            return;
        }

        router.visit('/notifications', {
            method: 'delete',
            data: { all: true },
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="notifications-responsive-page backend-admin-page">
                <section
                    className={
                        isClientNotificationCenter
                            ? 'notification-hero notification-hero-client'
                            : 'notification-hero'
                    }
                >
                    <div className="notification-hero-copy">
                        <div className="notification-hero-eyebrow">
                            <span>
                                <BellRing className="h-4 w-4" />
                            </span>
                            <p className="backend-booking-label">
                                Notifications
                            </p>
                        </div>
                        <h1>
                            {isClientNotificationCenter
                                ? 'Your private BCCC EASE messages.'
                                : 'System alerts, automation notices, and booking updates.'}
                        </h1>
                        <span>
                            {isClientNotificationCenter
                                ? 'This inbox works like a private conversation from the system. You only see your own booking, payment, deadline, and account updates.'
                                : 'Review all BCCC EASE monitoring notifications. Admin can monitor booking, account, staff, manager, content, calendar, inquiry, payment, and MICE activity.'}
                        </span>
                        <div className="notification-hero-meta">
                            <span>
                                <BellRing className="h-4 w-4" /> {unreadCount}{' '}
                                unread
                            </span>
                            <span>
                                <LayoutGrid className="h-4 w-4" />{' '}
                                {visibleRange}
                            </span>
                            <span>
                                <Filter className="h-4 w-4" />{' '}
                                {activeFilterCount} active filter
                                {activeFilterCount === 1 ? '' : 's'}
                            </span>
                        </div>
                    </div>

                    <div className="notification-hero-actions">
                        <div className="notification-hero-score">
                            <span>Unread Rate</span>
                            <strong>{unreadPercent}%</strong>
                            <small>
                                {readCount} read of {totalCount}
                            </small>
                        </div>

                        <button
                            type="button"
                            onClick={markAllRead}
                            className="alh-primary-button"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark All Read
                        </button>
                    </div>
                </section>

                <section className="notification-stat-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total"
                        value={totalCount}
                        helper="Notifications visible to your current role."
                        icon={Bell}
                    />
                    <StatCard
                        label="Unread"
                        value={unreadCount}
                        helper="Messages still requiring attention."
                        icon={BellRing}
                    />
                    <StatCard
                        label="Read"
                        value={readCount}
                        helper="Already opened or marked read."
                        icon={CheckCircle2}
                    />
                    <StatCard
                        label={
                            isClientNotificationCenter
                                ? 'Private'
                                : 'Automation'
                        }
                        value={
                            isClientNotificationCenter
                                ? 'Scoped'
                                : (stats.automation ?? automation.length)
                        }
                        helper={
                            isClientNotificationCenter
                                ? 'Filtered to your account only.'
                                : 'Lifecycle automation notifications.'
                        }
                        icon={Sparkles}
                    />
                </section>

                <SystemBotNotice
                    feed={feed}
                    unreadCount={unreadCount}
                    totalCount={totalCount}
                    isClient={isClientNotificationCenter}
                />

                <form
                    onSubmit={applyFilters}
                    className="notification-filter-grid notification-panel notification-filter-shell"
                >
                    <label className="notification-field notification-search-field">
                        <span className="notification-filter-label">
                            <Search className="h-4 w-4" /> Search
                        </span>
                        <span className="relative block">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                className="backend-booking-input pl-10"
                                placeholder="Search title, message, or type..."
                            />
                        </span>
                    </label>

                    <label className="notification-field">
                        <span className="notification-filter-label">
                            <Activity className="h-4 w-4" /> Status
                        </span>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="backend-booking-input"
                        >
                            <option value="all">All statuses</option>
                            <option value="unread">Unread only</option>
                            <option value="read">Read only</option>
                        </select>
                    </label>

                    <label className="notification-field">
                        <span className="notification-filter-label">
                            <SlidersHorizontal className="h-4 w-4" /> Type
                        </span>
                        <select
                            value={kind}
                            onChange={(event) => setKind(event.target.value)}
                            className="backend-booking-input"
                        >
                            {kindOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="notification-filter-actions">
                        <button
                            type="submit"
                            className="alh-primary-button justify-center"
                        >
                            Apply
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="alh-secondary-button justify-center"
                        >
                            <X className="h-4 w-4" /> Reset
                        </button>
                    </div>
                </form>

                <section className="notification-panel notification-kind-strip">
                    <div className="notification-strip-header">
                        <div>
                            <p className="backend-booking-label">
                                Quick filters
                            </p>
                            <strong>Jump by notification category</strong>
                        </div>
                        <span>{quickKindOptions.length} categories</span>
                    </div>

                    <div className="notification-kind-buttons">
                        {quickKindOptions.map((option) => (
                            <button
                                key={`quick-${option.value}`}
                                type="button"
                                onClick={() => {
                                    setKind(option.value);
                                    router.get(
                                        '/notifications',
                                        {
                                            q: q || undefined,
                                            status:
                                                status && status !== 'all'
                                                    ? status
                                                    : undefined,
                                            kind:
                                                option.value !== 'all'
                                                    ? option.value
                                                    : undefined,
                                        },
                                        {
                                            preserveScroll: false,
                                            preserveState: true,
                                            replace: true,
                                        },
                                    );
                                }}
                                className={`notification-kind-chip ${kind === option.value ? 'is-active' : ''}`}
                            >
                                <span>{option.label}</span>
                                <strong>{option.count}</strong>
                            </button>
                        ))}
                    </div>
                </section>

                {isClientNotificationCenter ? (
                    <ClientConversation
                        feed={feed}
                        links={pageLinks}
                        meta={pageMeta}
                        selectedIds={selectedIds}
                        allVisibleSelected={allVisibleSelected}
                        hasSelection={hasSelection}
                        selectedUnreadCount={selectedUnreadIds.length}
                        onToggleAll={toggleAllVisible}
                        onToggleSelected={toggleSelected}
                        onMarkSelectedRead={markSelectedRead}
                        onDeleteSelected={deleteSelected}
                        onDeleteAll={deleteAll}
                        onDeleteOne={deleteOne}
                    />
                ) : (
                    <section className="notification-monitoring-layout grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <main className="notification-panel overflow-hidden">
                            <div className="notification-panel-header notification-feed-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Monitoring Feed
                                    </p>
                                    <h2>
                                        {feed.length} notification
                                        {feed.length === 1 ? '' : 's'} on this
                                        page
                                    </h2>
                                    <span>
                                        Showing 10 notifications per page for
                                        cleaner monitoring. Use Next to review
                                        older records.
                                    </span>
                                </div>
                                <div className="notification-feed-tools">
                                    <div className="notification-feed-meter">
                                        <strong>
                                            {feed.filter(isUnread).length}
                                        </strong>
                                        <span>Unread here</span>
                                    </div>

                                    <div className="notification-bulk-toolbar">
                                        <button
                                            type="button"
                                            onClick={toggleAllVisible}
                                            className="notification-cleanup-button"
                                        >
                                            <span
                                                className="notification-select-box"
                                                aria-hidden="true"
                                            >
                                                {allVisibleSelected ? '✓' : ''}
                                            </span>
                                            {allVisibleSelected
                                                ? 'Unselect visible'
                                                : 'Select all visible'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={markSelectedRead}
                                            disabled={
                                                selectedUnreadIds.length <= 0
                                            }
                                            className="notification-cleanup-button"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Mark selected read (
                                            {selectedUnreadIds.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={deleteSelected}
                                            disabled={!hasSelection}
                                            className="notification-cleanup-button is-danger"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete selected (
                                            {selectedIds.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={deleteAll}
                                            className="notification-cleanup-button is-danger-ghost"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete all
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="notification-card-grid">
                                {feed.length > 0 ? (
                                    feed.map((item, index) => {
                                        const Icon = notificationIcon(
                                            item.type,
                                            item.kind,
                                        );
                                        const unread = isUnread(item);
                                        const checked = selectedIds.includes(
                                            String(item.id),
                                        );

                                        return (
                                            <article
                                                key={item.id}
                                                className={`notification-feed-card ${unread ? 'is-unread' : ''}`}
                                            >
                                                <span className="notification-card-glow" />
                                                <label
                                                    className="notification-row-select"
                                                    aria-label={`Select notification ${item.title}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() =>
                                                            toggleSelected(
                                                                item.id,
                                                            )
                                                        }
                                                    />
                                                    <span />
                                                </label>
                                                <div className="notification-card-actions">
                                                    <Link
                                                        href={`/notifications/${item.id}/open`}
                                                        className="notification-card-action"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Open
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteOne(item)
                                                        }
                                                        className="notification-card-action notification-delete-action"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </button>
                                                </div>

                                                <div className="notification-card-topline">
                                                    <span className="notification-card-number">
                                                        #{index + 1}
                                                    </span>
                                                    <div
                                                        className={`notification-row-icon ${typeClass(item.type, item.kind)}`}
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="notification-card-kind">
                                                            {notificationKind(
                                                                item,
                                                            )}
                                                        </span>
                                                        <strong>
                                                            {unread
                                                                ? 'Unread notice'
                                                                : 'Opened notice'}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="notification-card-body">
                                                    <div className="notification-card-chips">
                                                        <span
                                                            className={`alh-status-chip ${unread ? 'is-warn' : 'is-good'}`}
                                                        >
                                                            {unread
                                                                ? 'Unread'
                                                                : 'Read'}
                                                        </span>
                                                        <span
                                                            className={`alh-status-chip ${severityClass(item.severity)}`}
                                                        >
                                                            {cleanLabel(
                                                                item.severity ||
                                                                    'info',
                                                            )}
                                                        </span>
                                                        <span className="booking-mini-pill">
                                                            <Clock3 className="h-3.5 w-3.5" />{' '}
                                                            {compactDateTime(
                                                                item.created_at,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <h3>{item.title}</h3>
                                                    {item.message ? (
                                                        <p>{item.message}</p>
                                                    ) : null}
                                                    <div className="notification-card-meta">
                                                        <span>
                                                            {cleanLabel(
                                                                item.audience ||
                                                                    'System',
                                                            )}
                                                        </span>
                                                        <span>
                                                            {cleanLabel(
                                                                item.privacy_scope ||
                                                                    'Workspace',
                                                            )}
                                                        </span>
                                                        {item.actor ? (
                                                            <span>
                                                                Actor:{' '}
                                                                {item.actor
                                                                    .name ||
                                                                    'Unknown'}
                                                                {item.actor
                                                                    .email
                                                                    ? ` - ${item.actor.email}`
                                                                    : ''}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {item.link ? (
                                                    <Link
                                                        href={`/notifications/${item.id}/open`}
                                                        className="notification-direct-link"
                                                    >
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                        Direct Link
                                                    </Link>
                                                ) : null}
                                            </article>
                                        );
                                    })
                                ) : (
                                    <div className="ops-empty-state">
                                        <Bell className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                        <h3>No notifications found</h3>
                                        <p>
                                            System and booking notifications
                                            will appear here when available.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Pagination links={pageLinks} meta={pageMeta} />
                        </main>

                        <aside className="notification-side-stack">
                            <section className="notification-panel overflow-hidden">
                                <div className="notification-panel-header">
                                    <div>
                                        <p className="backend-booking-label">
                                            Automation Latest
                                        </p>
                                        <h2>Recent automation</h2>
                                    </div>
                                </div>
                                <div className="notification-side-list">
                                    {automation.length > 0 ? (
                                        automation.map((item) => {
                                            const Icon = notificationIcon(
                                                item.type,
                                                item.kind,
                                            );
                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={`/notifications/${item.id}/open`}
                                                    className="notification-side-card"
                                                >
                                                    <span className="notification-side-icon">
                                                        <Icon className="h-4 w-4" />
                                                    </span>
                                                    <span>
                                                        <strong>
                                                            {item.title}
                                                        </strong>
                                                        <small>
                                                            {notificationKind(
                                                                item,
                                                            )}{' '}
                                                            -{' '}
                                                            {compactDateTime(
                                                                item.created_at,
                                                            )}
                                                        </small>
                                                    </span>
                                                </Link>
                                            );
                                        })
                                    ) : (
                                        <div className="ops-empty-state !p-8">
                                            <Sparkles className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-700" />
                                            <h3>No automation alerts</h3>
                                            <p>
                                                Lifecycle notifications will
                                                appear here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="notification-panel overflow-hidden">
                                <div className="notification-panel-header">
                                    <div>
                                        <p className="backend-booking-label">
                                            Breakdown
                                        </p>
                                        <h2>Types</h2>
                                    </div>
                                </div>
                                <div className="notification-breakdown-list">
                                    {breakdownItems.map(([label, value]) => (
                                        <div
                                            key={String(label)}
                                            className="notification-breakdown-row"
                                            style={
                                                {
                                                    '--bar-width': `${Math.round(((Number(value) || 0) / maxBreakdown) * 100)}%`,
                                                } as CSSProperties
                                            }
                                        >
                                            <span>{label}</span>
                                            <strong>{value}</strong>
                                            <em />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </aside>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
