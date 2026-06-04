import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import {
    addMonths,
    blockLabel,
    buildMonthGrid,
    calendarRoleCopy,
    cleanCalendarLabel,
    eventTone,
    eventDateKeys,
    formatDateKey,
    monthLabel,
    normalizeCalendarRole,
    parseMonth,
    roleBookingCreatePath,
    roleBookingShowPath,
    roleCalendarBasePath,
    roleCalendarManagePath,
    type CalendarBlockKey,
    type CalendarDayCell,
    type CalendarEventItem,
} from '@/lib/calendar-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Clock3,
    ExternalLink,
    LayoutList,
    ListFilter,
    Plus,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type CalendarAvailabilityDay = {
    AM?: boolean;
    PM?: boolean;
    EVE?: boolean;
    is_fully_booked?: boolean;
    day_status?: string;
};

type RoleCalendarPageProps = {
    workspaceRole?: string;
    counts?: Record<string, number>;
    events?: CalendarEventItem[];
    month?: string;
    monthAvailability?: Record<string, CalendarAvailabilityDay>;
    areaOptions?: string[];
};

const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const blockKeys: CalendarBlockKey[] = ['AM', 'PM', 'EVE'];

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function todayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function isEveOnlyDay(day?: CalendarAvailabilityDay): boolean {
    if (!day) return false;

    return day.AM === false && day.PM === false && day.EVE !== false;
}

function availabilityLabel(day?: CalendarAvailabilityDay, key?: string): string {
    const status = String(day?.day_status || '').toLowerCase();
    const isPast = key ? key < todayKey() : false;

    if (isPast) return 'Past / Unavailable';
    if (!day) return 'No Data';
    if (status === 'blocked' || isEveOnlyDay(day)) return 'Unavailable';
    if (status === 'public_booked') return 'Public Event';
    if (status === 'private_booked' || day.is_fully_booked) return 'Reserved';
    if (status === 'limited' || status === 'partial' || status === 'partially_booked') return 'Limited';

    return 'Available';
}

function availabilityTone(day?: CalendarAvailabilityDay, key?: string): string {
    const label = availabilityLabel(day, key);

    if (label === 'Past / Unavailable' || label === 'Unavailable' || !day) {
        return 'border-slate-300/35 bg-slate-400/10 dark:border-white/10 dark:bg-white/[0.045]';
    }

    if (label === 'Reserved') {
        return 'border-rose-300/35 bg-rose-400/10';
    }

    if (label === 'Public Event') {
        return 'border-sky-300/35 bg-sky-400/10';
    }

    if (label === 'Limited') {
        return 'border-blue-300/35 bg-blue-400/10';
    }

    return 'border-emerald-300/35 bg-emerald-400/10';
}

function statusDot(day?: CalendarAvailabilityDay, key?: string): string {
    const label = availabilityLabel(day, key);

    if (label === 'Past / Unavailable' || label === 'Unavailable') return 'bg-slate-400';
    if (label === 'Reserved') return 'bg-rose-500';
    if (label === 'Public Event') return 'bg-sky-500';
    if (label === 'Limited') return 'bg-blue-500';

    return 'bg-emerald-500';
}

function blockOpen(day: CalendarAvailabilityDay | undefined, block: CalendarBlockKey, key?: string): boolean {
    if (key && key < todayKey()) return false;
    if (!day) return true;

    if (block === 'EVE' && isEveOnlyDay(day)) {
        return false;
    }

    return day[block] !== false;
}

function calendarActionPaths(role: RoleThemeKey, dateKey: string) {
    return {
        booking: roleBookingCreatePath(role, dateKey),
        manage: roleCalendarManagePath(role, dateKey),
        month: roleCalendarBasePath(role),
    };
}

function eventHref(role: RoleThemeKey, event: CalendarEventItem): string | null {
    if (event.kind === 'booking' && /^\d+$/.test(String(event.id))) {
        return roleBookingShowPath(role, event.id);
    }

    if (event.kind === 'block' && (role === 'admin' || role === 'manager')) {
        return roleCalendarManagePath(role);
    }

    return null;
}

function CountCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    icon: typeof CalendarDays;
}) {
    return (
        <article className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-4 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl sm:p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-muted)]">
                        {label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.065em] text-[var(--bccc-backend-text)] sm:text-3xl">
                        {value}
                    </p>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.11)] text-[var(--bccc-backend-gold)] sm:h-11 sm:w-11">
                    <Icon className="h-5 w-5" />
                </span>
            </div>
        </article>
    );
}

function AvailabilityPill({
    block,
    open,
}: {
    block: CalendarBlockKey;
    open?: boolean;
}) {
    return (
        <span
            className={cx(
                'inline-flex min-h-6 items-center justify-center border px-2 text-[9px] font-black uppercase tracking-[0.14em]',
                open
                    ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200'
                    : 'border-rose-300/35 bg-rose-400/10 text-rose-700 dark:text-rose-200',
            )}
        >
            {blockLabel(block)}
        </span>
    );
}


function eventSpanClass(event: CalendarEventItem, dateKey: string): string {
    const keys = eventDateKeys(event);

    if (keys.length <= 1 || event.kind !== 'booking') {
        return 'role-calendar-event-span is-single rounded-md';
    }

    const index = keys.indexOf(dateKey);
    if (index === -1) {
        return 'role-calendar-event-span is-single rounded-md';
    }

    if (index === 0) {
        return 'role-calendar-event-span is-start rounded-l-md rounded-r-none border-r-0';
    }

    if (index === keys.length - 1) {
        return 'role-calendar-event-span is-end rounded-l-none rounded-r-md border-l-0';
    }

    return 'role-calendar-event-span is-middle rounded-none border-x-0';
}

function CalendarDay({
    role,
    day,
    selected,
    onSelect,
}: {
    role: RoleThemeKey;
    day: CalendarDayCell;
    selected: boolean;
    onSelect: (day: CalendarDayCell) => void;
}) {
    const visibleEvents = day.events.slice(0, 3);
    const overflow = Math.max(day.events.length - visibleEvents.length, 0);
    const canCreate = role === 'admin' || role === 'staff' || role === 'user';
    const canBlock = role === 'admin' || role === 'manager';
    const canCreateForDay = canCreate && !isEveOnlyDay(day.availability) && availabilityLabel(day.availability, day.key) !== 'Unavailable' && availabilityLabel(day.availability, day.key) !== 'Past / Unavailable';

    return (
        <article
            className={cx(
                'group relative min-h-[8.75rem] border-b border-r border-[var(--bccc-backend-line)] p-2 text-left transition duration-500 hover:z-10 hover:border-[var(--bccc-backend-gold-line)] hover:bg-[var(--bccc-backend-hover)] sm:min-h-[9.75rem]',
                day.isCurrentMonth ? '' : 'opacity-45',
                availabilityTone(day.availability, day.key),
                selected && 'z-20 ring-2 ring-inset ring-[var(--bccc-backend-gold)]',
            )}
        >
            <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(day)}
                className="absolute inset-0 z-0 cursor-pointer"
            >
                <span className="sr-only">View {day.key}</span>
            </button>

            <div className="relative z-10 pointer-events-none">
                <div className="flex items-start justify-between gap-2">
                    <span
                        className={cx(
                            'flex h-8 w-8 items-center justify-center text-sm font-black',
                            day.isToday
                                ? 'bg-[var(--bccc-green-800)] text-white'
                                : 'bg-[var(--bccc-backend-panel)] text-[var(--bccc-backend-text)]',
                        )}
                    >
                        {day.dayNumber}
                    </span>

                    <span className="hidden items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--bccc-backend-muted)] sm:inline-flex">
                        <span className={cx('h-2 w-2 rounded-full', statusDot(day.availability, day.key))} />
                        {availabilityLabel(day.availability, day.key)}
                    </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                    {blockKeys.map((block) => (
                        <AvailabilityPill key={block} block={block} open={blockOpen(day.availability, block, day.key)} />
                    ))}
                </div>

                <div className="mt-2 grid gap-1.5">
                    {visibleEvents.map((event) => (
                        <span
                            key={`${event.kind}-${event.id}-${event.start}`}
                            className={cx('block truncate border px-2 py-1 text-[10px] font-semibold', eventTone(event), eventSpanClass(event, day.key))}
                        >
                            {cleanCalendarLabel(event.title)}
                        </span>
                    ))}

                    {overflow > 0 ? (
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--bccc-backend-muted)]">
                            +{overflow} more
                        </span>
                    ) : null}

                    {isEveOnlyDay(day.availability) ? (
                        <span className="rounded border border-amber-300/40 bg-amber-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">EVE-only / not bookable</span>
                    ) : day.events.length === 0 ? (
                        <span className="text-[10px] text-[var(--bccc-backend-muted)]">No scheduled item</span>
                    ) : null}
                </div>
            </div>

            <div className="absolute bottom-2 left-2 right-2 z-20 hidden gap-1 group-hover:flex group-focus-within:flex">
                {canCreateForDay ? (
                    <Link
                        href={calendarActionPaths(role, day.key).booking}
                        className="flex-1 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.12em] text-[var(--bccc-backend-text)] hover:border-[var(--bccc-backend-gold-line)]"
                    >
                        Book
                    </Link>
                ) : null}

                {canBlock ? (
                    <Link
                        href={calendarActionPaths(role, day.key).manage}
                        className="flex-1 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.12em] text-[var(--bccc-backend-text)] hover:border-[var(--bccc-backend-gold-line)]"
                    >
                        Block
                    </Link>
                ) : null}
            </div>
        </article>
    );
}

function EventCard({
    role,
    event,
}: {
    role: RoleThemeKey;
    event: CalendarEventItem;
}) {
    const href = eventHref(role, event);
    const content = (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className={cx('inline-flex border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em]', eventTone(event))}>
                    {event.kind === 'public_event' ? 'Public Event' : event.kind === 'block' ? 'Calendar Block' : 'Booking'}
                </p>

                <p className="mt-2 truncate text-sm font-semibold tracking-[-0.025em] text-[var(--bccc-backend-text)]">
                    {cleanCalendarLabel(event.title)}
                </p>

                <p className="mt-1 text-xs leading-6 text-[var(--bccc-backend-muted)]">
                    {[event.area, event.block, event.guests ? `${event.guests} guests` : null]
                        .filter(Boolean)
                        .join(' • ') || 'Calendar item'}
                </p>
            </div>

            {href ? <ExternalLink className="h-4 w-4 shrink-0 text-[var(--bccc-backend-gold)]" /> : null}
        </div>
    );

    return href ? (
        <Link href={href} className="block p-4 transition hover:bg-[var(--bccc-backend-hover)]">
            {content}
        </Link>
    ) : (
        <div className="p-4">{content}</div>
    );
}

function SelectedDayPanel({
    role,
    day,
}: {
    role: RoleThemeKey;
    day?: CalendarDayCell;
}) {
    if (!day) {
        return (
            <aside className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-6 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
                <p className="text-sm text-[var(--bccc-backend-muted)]">Select a date to view details.</p>
            </aside>
        );
    }

    const formattedDate = day.date.toLocaleDateString('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const canCreate = role === 'admin' || role === 'staff' || role === 'user';
    const canBlock = role === 'admin' || role === 'manager';
    const canCreateOnSelectedDate = canCreate && !isEveOnlyDay(day.availability) && availabilityLabel(day.availability, day.key) !== 'Unavailable' && availabilityLabel(day.availability, day.key) !== 'Past / Unavailable';

    return (
        <aside className="role-calendar-selected-panel admin-role-calendar-selected-panel space-y-4 self-start xl:sticky xl:top-28">
            <section className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-5 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-backend-gold)]">
                    Selected Date
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--bccc-backend-text)]">
                    {formattedDate}
                </h2>

                <p className="mt-2 text-sm leading-7 text-[var(--bccc-backend-muted)]">
                    Availability, blocks, bookings, and public events attached to this day.
                </p>

                <div className="mt-5 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-muted)]">
                        Day Status
                    </p>

                    <div className="mt-3 inline-flex items-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.10)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-gold)]">
                        <span className={cx('h-2 w-2 rounded-full', statusDot(day.availability, day.key))} />
                        {availabilityLabel(day.availability, day.key)}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {blockKeys.map((block) => (
                            <AvailabilityPill key={block} block={block} open={blockOpen(day.availability, block, day.key)} />
                        ))}
                    </div>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    {canCreateOnSelectedDate ? (
                        <Link
                            href={calendarActionPaths(role, day.key).booking}
                            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-green-800)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)]"
                        >
                            <Plus className="h-4 w-4" />
                            Create Booking
                        </Link>
                    ) : canCreate ? (
                        <div className="border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                            Booking disabled for this date
                        </div>
                    ) : null}

                    {canBlock ? (
                        <Link
                            href={calendarActionPaths(role, day.key).manage}
                            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                        >
                            <ShieldCheck className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
                            Manage Block
                        </Link>
                    ) : null}
                </div>
            </section>

            <section className="role-calendar-month admin-role-calendar-month overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
                <div className="border-b border-[var(--bccc-backend-line)] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-gold)]">
                        Items on this date
                    </p>
                </div>

                {day.events.length > 0 ? (
                    <div className="divide-y divide-[var(--bccc-backend-line)]">
                        {day.events.map((event) => (
                            <EventCard key={`${event.kind}-${event.id}-${event.start}`} role={role} event={event} />
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-sm leading-7 text-[var(--bccc-backend-muted)]">
                        No booking, block, or public event is attached to this date.
                    </div>
                )}
            </section>
        </aside>
    );
}

function calendarStats(role: RoleThemeKey, events: CalendarEventItem[], counts: Record<string, number>) {
    const bookingCount = counts.bookings ?? events.filter((event) => event.kind === 'booking').length;
    const blockCount = counts.blocks ?? events.filter((event) => event.kind === 'block').length;
    const publicEventCount = counts.public_events ?? events.filter((event) => event.kind === 'public_event').length;

    if (role === 'user') {
        return [
            { label: 'My Bookings', value: bookingCount, icon: CalendarDays },
            { label: 'Public Events', value: publicEventCount, icon: Sparkles },
            { label: 'Unavailable Blocks', value: blockCount, icon: ShieldCheck },
            { label: 'Month Items', value: counts.calendar_items ?? events.length, icon: ListFilter },
        ];
    }

    return [
        { label: 'Calendar Items', value: counts.calendar_items ?? events.length, icon: ListFilter },
        { label: 'Bookings', value: bookingCount, icon: CalendarDays },
        { label: 'Blocks', value: blockCount, icon: ShieldCheck },
        { label: 'Public Events', value: publicEventCount, icon: Sparkles },
    ];
}

export function RoleCalendarPage() {
    const { props } = usePage<RoleCalendarPageProps>();
    const role = normalizeCalendarRole(props.workspaceRole) as RoleThemeKey;
    const copy = calendarRoleCopy(role);

    const month = props.month || formatDateKey(new Date()).slice(0, 7);
    const availability = useMemo(() => props.monthAvailability || {}, [props.monthAvailability]);
    const events = useMemo(() => (Array.isArray(props.events) ? props.events : []), [props.events]);
    const counts = useMemo(() => props.counts || {}, [props.counts]);
    const stats = useMemo(() => calendarStats(role, events, counts), [role, events, counts]);

    const [selectedKey, setSelectedKey] = useState(() => formatDateKey(new Date()));

    const grid = useMemo(() => buildMonthGrid(month, availability, events), [month, availability, events]);

    const selectedDay = useMemo(
        () => grid.find((day) => day.key === selectedKey) ?? grid.find((day) => day.isToday) ?? grid[0],
        [grid, selectedKey],
    );

    const currentMonthDate = parseMonth(month);
    const previousMonth = formatDateKey(addMonths(currentMonthDate, -1)).slice(0, 7);
    const nextMonth = formatDateKey(addMonths(currentMonthDate, 1)).slice(0, 7);

    function goToMonth(nextMonthValue: string) {
        router.get(
            roleCalendarBasePath(role),
            { month: nextMonthValue },
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            },
        );
    }

    return (
        <BookingRolePageShell
            role={role}
            title={copy.title}
            description={copy.description}
            actions={
                <>
                    <Link
                        href={copy.manageHref}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-green-800)] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)]"
                    >
                        <CalendarDays className="h-4 w-4" />
                        {copy.primaryAction}
                    </Link>

                    <Link
                        href={copy.createHref}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                    >
                        <Plus className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
                        {copy.secondaryAction}
                    </Link>

                    <Link
                        href={copy.analyticsHref}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                    >
                        {role === 'user' || role === 'staff' ? <ExternalLink className="h-4 w-4 text-[var(--bccc-backend-gold)]" /> : <LayoutList className="h-4 w-4 text-[var(--bccc-backend-gold)]" />}
                        {copy.tertiaryAction}
                    </Link>
                </>
            }
        >
            <section className="role-calendar-page admin-role-calendar-page grid gap-5">
                <div className="role-calendar-stats admin-role-calendar-stats grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <CountCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
                    ))}
                </div>

                <div className="role-calendar-layout admin-role-calendar-layout grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <main className="min-w-0">
                        <section className="role-calendar-month admin-role-calendar-month overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
                            <div className="admin-role-calendar-month-header flex flex-col gap-4 border-b border-[var(--bccc-backend-line)] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-backend-gold)]">
                                        Calendar Month
                                    </p>

                                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-[var(--bccc-backend-text)] sm:text-3xl">
                                        {monthLabel(month)}
                                    </h2>

                                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--bccc-backend-muted)]">
                                        {role === 'user'
                                            ? 'Check your own booking requests alongside public events, unavailable blocks, and AM / PM / EVE availability.'
                                            : 'View bookings, public events, blocked dates, and AM / PM / EVE availability.'}
                                    </p>
                                </div>

                                <div className="admin-role-calendar-controls flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => goToMonth(previousMonth)}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Previous
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => goToMonth(formatDateKey(new Date()).slice(0, 7))}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.12)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-gold)] transition hover:-translate-y-0.5"
                                    >
                                        <Clock3 className="h-4 w-4" />
                                        Today
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => goToMonth(nextMonth)}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                                    >
                                        Next
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="role-calendar-scroll admin-role-calendar-scroll overflow-x-auto overscroll-x-contain">
                                <div className="role-calendar-grid admin-role-calendar-grid min-w-[56rem]">
                                    <div className="grid grid-cols-7 border-b border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)]">
                                        {weekLabels.map((label) => (
                                            <div
                                                key={label}
                                                className="px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-gold)]"
                                            >
                                                {label}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7">
                                        {grid.map((day) => (
                                            <CalendarDay
                                                key={day.key}
                                                role={role}
                                                day={day}
                                                selected={selectedDay?.key === day.key}
                                                onSelect={(nextDay) => setSelectedKey(nextDay.key)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="role-calendar-legend admin-role-calendar-legend mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                ['Available', 'Open or mostly open date', 'bg-emerald-500'],
                                ['Limited', 'Some blocks occupied', 'bg-blue-500'],
                                ['Private / Reserved', 'Private booking or reserved block', 'bg-amber-500'],
                                ['Blocked', 'Unavailable for requests', 'bg-rose-500'],
                            ].map(([label, description, dot]) => (
                                <div
                                    key={label}
                                    className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-4 shadow-[var(--bccc-backend-shadow-soft)]"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={cx('h-2.5 w-2.5 rounded-full', dot)} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)]">
                                            {label}
                                        </p>
                                    </div>
                                    <p className="mt-2 text-xs leading-6 text-[var(--bccc-backend-muted)]">{description}</p>
                                </div>
                            ))}
                        </section>
                    </main>

                    <SelectedDayPanel role={role} day={selectedDay} />
                </div>
            </section>
        </BookingRolePageShell>
    );
}
