import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Clock3,
    MapPin,
    Search,
    ShieldAlert,
    Sparkles,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
    BLOCK_KEYS,
    BLOCK_META,
    buildMonthWeeks,
    dateKey,
    deriveDayStatus,
    eventSpansDate,
    longDate,
    monthLabel,
    monthToDate,
    normalizeEventRange,
    scheduleStatusLabel,
    shiftMonth,
} from '@/lib/unified-schedule';

type DayAvailability = {
    date: string;
    day_status: string;
    AM: boolean;
    PM: boolean;
    EVE: boolean;
    is_fully_booked?: boolean;
};

type CalendarEvent = {
    id: number | string;
    kind?: 'booking' | 'block' | 'public_event' | string;
    title?: string | null;
    start?: string | null;
    end?: string | null;
    status?: string | null;
    payment_status?: string | null;
    area?: string | null;
    block?: string | null;
    public_status?: string | null;
    note?: string | null;
    client_name?: string | null;
    company_name?: string | null;
    summary?: string | null;
    description?: string | null;
    time?: string | null;
    image?: string | null;
};

type HighlightItem = {
    id: number;
    scope?: 'bccc' | 'city' | string;
    title?: string | null;
    venue?: string | null;
    date?: string | null;
    time?: string | null;
    summary?: string | null;
    description?: string | null;
    image?: string | null;
};

type Props = {
    month?: string;
    monthAvailability?: Record<string, DayAvailability>;
    availability?: Record<string, DayAvailability>;
    events?: CalendarEvent[];
    calendarEvents?: CalendarEvent[];
    highlights?: {
        bccc?: HighlightItem[];
        city?: HighlightItem[];
    };
};

type WeekCell = Date | null;

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function currentCalendarBase() {
    if (window.location.pathname.startsWith('/admin')) return '/admin/calendar';
    if (window.location.pathname.startsWith('/manager')) return '/manager/calendar';
    if (window.location.pathname.startsWith('/staff')) return '/staff/calendar';

    return '/calendar';
}

function currentBookingBase() {
    if (window.location.pathname.startsWith('/admin')) return '/admin/bookings';
    if (window.location.pathname.startsWith('/manager')) return '/manager/bookings';
    if (window.location.pathname.startsWith('/staff')) return '/staff/bookings';

    return '/my-bookings';
}

function compactDate(value?: string | null) {
    if (!value) return '—';

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
}

function cleanLabel(value?: string | null) {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function queryValue(...names: string[]) {
    const search = new URLSearchParams(window.location.search);

    for (const name of names) {
        const value = search.get(name);

        if (value) return value;
    }

    return '';
}

function monthHref(month: string, rangeStart?: string, rangeEnd?: string) {
    const params = new URLSearchParams(window.location.search);
    params.set('month', month);

    if (rangeStart) {
        params.set('start_date', rangeStart);
        params.set('date_from', rangeStart);
    }

    if (rangeEnd) {
        params.set('end_date', rangeEnd);
        params.set('date_to', rangeEnd);
    }

    return `${window.location.pathname}?${params.toString()}`;
}

function eventDate(event: CalendarEvent) {
    const range = normalizeEventRange(event);

    return range.startDate || String(event.start || '').slice(0, 10);
}

function eventOverlapsRange(event: CalendarEvent, start: string, end: string) {
    const range = normalizeEventRange(event);
    const eventStart = range.startDate || eventDate(event);
    const eventEnd = range.endDate || eventStart;

    return eventStart <= end && eventEnd >= start;
}

function selectedDateEvents(events: CalendarEvent[], selectedDate: string) {
    return events.filter((event) => eventSpansDate(event, selectedDate));
}

function selectedRangeEvents(events: CalendarEvent[], start: string, end: string) {
    return events.filter((event) => eventOverlapsRange(event, start, end));
}

function pickInitialDate(
    month: string,
    availability: Record<string, DayAvailability>,
    events: CalendarEvent[],
) {
    const queryStart = queryValue('start_date', 'date_from', 'date');

    if (queryStart) return queryStart;

    const today = dateKey(new Date());

    if (today.startsWith(month)) return today;

    const firstAvailable = Object.keys(availability).sort()[0];

    if (firstAvailable) return firstAvailable;

    const firstEvent = events.map(eventDate).find(Boolean);

    return firstEvent || `${month}-01`;
}

function dayClass(
    day?: DayAvailability,
    selected = false,
    inRange = false,
    rangeStart = false,
    rangeEnd = false,
) {
    const classes = ['calendar-index-day'];

    if (selected) classes.push('is-selected');
    if (inRange) classes.push('is-range');
    if (rangeStart) classes.push('is-range-start');
    if (rangeEnd) classes.push('is-range-end');

    if (!day) {
        classes.push('is-empty-state');
        return classes.join(' ');
    }

    const status = deriveDayStatus({
        availability: day,
        events: [],
        isClient: false,
    });

    if (['blocked', 'private_booked', 'full'].includes(status) || day.is_fully_booked) {
        classes.push('is-full');
        return classes.join(' ');
    }

    const openCount = BLOCK_KEYS.filter((block) => day[block]).length;

    if (openCount === 3 && status === 'available') classes.push('is-open');
    else if (openCount > 0 || ['limited', 'public_booked'].includes(status)) classes.push('is-limited');
    else classes.push('is-full');

    return classes.join(' ');
}

function eventClass(event: CalendarEvent) {
    const kind = String(event.kind || '').toLowerCase();
    const status = String(event.status || '').toLowerCase();

    if (kind === 'block' || status === 'blocked') return 'is-block';
    if (kind === 'public_event' || status === 'public_booked') return 'is-public';
    if (['confirmed', 'active', 'completed', 'private_booked'].includes(status)) return 'is-booked';
    if (status === 'pending') return 'is-pending';

    return '';
}

function statusClass(status?: string | null) {
    const value = String(status || '').toLowerCase();

    if (['confirmed', 'active', 'completed', 'paid'].includes(value)) return 'is-good';
    if (['pending', 'partial', 'unpaid'].includes(value)) return 'is-warn';
    if (['blocked', 'cancelled', 'declined'].includes(value)) return 'is-bad';
    if (['public_event', 'public_booked'].includes(value)) return 'is-public';

    return '';
}

function eventHref(event: CalendarEvent) {
    if (String(event.kind).toLowerCase() !== 'booking') return currentCalendarBase();

    return `${currentBookingBase()}/${event.id}`;
}

function createBookingHref(date: string, endDate?: string) {
    const params = new URLSearchParams({
        date,
        start_date: date,
        end_date: endDate || date,
        start: '06:00',
        end: '12:00',
    });

    if (window.location.pathname.startsWith('/admin')) {
        return `/admin/bookings/create?${params.toString()}`;
    }

    if (window.location.pathname.startsWith('/staff')) {
        return `/staff/bookings/create?${params.toString()}`;
    }

    return `/bookings/create?${params.toString()}`;
}

function eventsForDay(events: CalendarEvent[], date: string) {
    return events.filter((event) => eventSpansDate(event, date)).slice(0, 3);
}

function isBetweenKeys(value: string, start: string, end: string) {
    return value >= start && value <= end;
}

function daysBetween(start: string, end: string) {
    if (!start || !end) return 1;

    const a = new Date(`${start}T00:00:00`).getTime();
    const b = new Date(`${end}T00:00:00`).getTime();

    return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function CalendarMiniEvent({ event }: { event: CalendarEvent }) {
    return (
        <span className={`calendar-index-mini-event ${eventClass(event)}`}>
            {event.title || cleanLabel(event.kind)}
        </span>
    );
}

export function CalendarIndexPage({
    month,
    monthAvailability,
    availability,
    events,
    calendarEvents,
    highlights,
}: Props) {
    const queryStart = queryValue('start_date', 'date_from', 'date');
    const queryEnd = queryValue('end_date', 'date_to');

    const activeMonth = month || queryStart?.slice(0, 7) || dateKey(new Date()).slice(0, 7);
    const availabilityMap = useMemo(() => monthAvailability || availability || {}, [monthAvailability, availability]);
    const items = useMemo(() => events || calendarEvents || [], [events, calendarEvents]);
    const base = currentCalendarBase();
    const currentMonthDate = monthToDate(activeMonth);
    const weeks: WeekCell[][] = useMemo(() => buildMonthWeeks(activeMonth), [activeMonth]);

    const [selectedDate, setSelectedDate] = useState(() =>
        pickInitialDate(activeMonth, availabilityMap, items),
    );
    const [rangeStart, setRangeStart] = useState(queryStart || '');
    const [rangeEnd, setRangeEnd] = useState(queryEnd || queryStart || '');

    useEffect(() => {
        const next = pickInitialDate(activeMonth, availabilityMap, items);
        setSelectedDate(next);
        setRangeStart(queryStart || next);
        setRangeEnd(queryEnd || queryStart || next);
    }, [activeMonth, availabilityMap, items, queryStart, queryEnd]);

    const selectedEvents = useMemo(
        () => selectedDateEvents(items, selectedDate),
        [items, selectedDate],
    );

    const rangeEvents = useMemo(
        () => selectedRangeEvents(items, rangeStart || selectedDate, rangeEnd || rangeStart || selectedDate),
        [items, rangeStart, rangeEnd, selectedDate],
    );

    const selectedAvailability = availabilityMap[selectedDate];
    const selectedStatus = deriveDayStatus({
        availability: selectedAvailability,
        events: selectedEvents,
        isClient: false,
    });

    const bcccHighlights = highlights?.bccc || [];
    const cityHighlights = highlights?.city || [];
    const highlighted = [...bcccHighlights, ...cityHighlights].slice(0, 4);

    const totalBookings = items.filter((item) => String(item.kind).toLowerCase() === 'booking').length;
    const totalBlocks = items.filter((item) => String(item.kind).toLowerCase() === 'block').length;
    const totalPublic = items.filter((item) => String(item.kind).toLowerCase() === 'public_event').length;

    const rangeLabelStart = rangeStart || selectedDate;
    const rangeLabelEnd = rangeEnd || rangeLabelStart;
    const selectedRangeCount = daysBetween(rangeLabelStart, rangeLabelEnd);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Calendar',
            href: base,
        },
    ];

    function jumpToMonth(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);
        const value = String(form.get('month') || activeMonth);

        router.get(
            base,
            {
                month: value,
                start_date: rangeStart || undefined,
                end_date: rangeEnd || undefined,
            },
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            },
        );
    }

    function selectDay(key: string) {
        setSelectedDate(key);

        if (!rangeStart || (rangeStart && rangeEnd && rangeStart !== rangeEnd)) {
            setRangeStart(key);
            setRangeEnd(key);
            return;
        }

        if (key < rangeStart) {
            setRangeEnd(rangeStart);
            setRangeStart(key);
            return;
        }

        if (key === rangeStart) {
            setRangeEnd(key);
            return;
        }

        setRangeEnd(key);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />

            <div className="backend-admin-page space-y-5">
                <section className="calendar-index-hero">
                    <div>
                        <p className="backend-booking-label">Calendar</p>
                        <h1>Bookings, public events, and blocked schedules.</h1>
                        <span>
                            Click one date for the range start, then click another date for the range end.
                            All dates between the two clicks are treated as selected.
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href={`${base}/manage`} className="alh-primary-button">
                            Manage Calendar
                            <ArrowRight className="h-4 w-4" />
                        </Link>

                        <Link href={`${base}/analytics`} className="alh-secondary-button">
                            Analytics
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article className="calendar-index-kpi">
                        <p className="backend-booking-label">Selected Range</p>
                        <strong>{selectedRangeCount} day{selectedRangeCount === 1 ? '' : 's'}</strong>
                        <span>
                            {compactDate(rangeLabelStart)} — {compactDate(rangeLabelEnd)}
                        </span>
                    </article>

                    <article className="calendar-index-kpi">
                        <p className="backend-booking-label">Bookings</p>
                        <strong>{totalBookings}</strong>
                        <span>Booking records loaded this month.</span>
                    </article>

                    <article className="calendar-index-kpi">
                        <p className="backend-booking-label">Blocks</p>
                        <strong>{totalBlocks}</strong>
                        <span>Internal calendar blocks loaded.</span>
                    </article>

                    <article className="calendar-index-kpi">
                        <p className="backend-booking-label">Public Events</p>
                        <strong>{totalPublic}</strong>
                        <span>Public calendar-visible events.</span>
                    </article>
                </section>

                <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
                    <main className="calendar-index-panel overflow-hidden">
                        <div className="calendar-index-panel-header">
                            <div>
                                <p className="backend-booking-label">Month View</p>
                                <h2>{monthLabel(currentMonthDate)}</h2>
                                <span>
                                    Date range uses only two clicks: start and end.
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link href={monthHref(shiftMonth(activeMonth, -1), rangeStart, rangeEnd)} className="alh-secondary-button">
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Link>

                                <Link href={monthHref(dateKey(new Date()).slice(0, 7))} className="alh-secondary-button">
                                    Today
                                </Link>

                                <Link href={monthHref(shiftMonth(activeMonth, 1), rangeStart, rangeEnd)} className="alh-secondary-button">
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        <form onSubmit={jumpToMonth} className="calendar-index-toolbar">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="month"
                                    name="month"
                                    defaultValue={activeMonth}
                                    className="backend-booking-input pl-10"
                                />
                            </div>

                            <button type="submit" className="alh-primary-button justify-center">
                                Open Month
                            </button>
                        </form>

                        <div className="calendar-index-weekdays">
                            {weekdays.map((day) => (
                                <div key={day}>{day}</div>
                            ))}
                        </div>

                        <div className="calendar-index-grid">
                            {weeks.flatMap((week, weekIndex) =>
                                week.map((day, dayIndex) => {
                                    if (!day) {
                                        return (
                                            <div
                                                key={`blank-${weekIndex}-${dayIndex}`}
                                                className="calendar-index-day is-blank"
                                            />
                                        );
                                    }

                                    const key = dateKey(day);
                                    const dayAvailability = availabilityMap[key];
                                    const dayEvents = eventsForDay(items, key);
                                    const isSelected = key === selectedDate;
                                    const isToday = key === dateKey(new Date());
                                    const start = rangeStart || selectedDate;
                                    const end = rangeEnd || start;
                                    const isRange = isBetweenKeys(key, start, end);
                                    const isStart = key === start;
                                    const isEnd = key === end && start !== end;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => selectDay(key)}
                                            className={dayClass(dayAvailability, isSelected, isRange, isStart, isEnd)}
                                        >
                                            <span className={isToday ? 'calendar-index-number is-today' : 'calendar-index-number'}>
                                                {day.getDate()}
                                            </span>

                                            <span className="calendar-index-blocks">
                                                {BLOCK_KEYS.map((block) => {
                                                    const isOpen =
                                                        dayAvailability?.[block] === true &&
                                                        !(
                                                            block === 'EVE' &&
                                                            dayAvailability?.AM === false &&
                                                            dayAvailability?.PM === false
                                                        );

                                                    return (
                                                        <span
                                                            key={`${key}-${block}`}
                                                            title={`${BLOCK_META[block].label}: ${isOpen ? 'Open' : 'Unavailable'}`}
                                                            className={
                                                                isOpen
                                                                    ? 'calendar-index-block is-open'
                                                                    : 'calendar-index-block is-closed'
                                                            }
                                                        />
                                                    );
                                                })}
                                            </span>

                                            <span className="calendar-index-day-events">
                                                {dayEvents.map((event) => (
                                                    <CalendarMiniEvent key={`${event.kind}-${event.id}`} event={event} />
                                                ))}
                                            </span>
                                        </button>
                                    );
                                }),
                            )}
                        </div>
                    </main>

                    <aside className="space-y-5">
                        <section className="calendar-index-panel overflow-hidden">
                            <div className="calendar-index-panel-header">
                                <div>
                                    <p className="backend-booking-label">Selected Range</p>
                                    <h2>
                                        {compactDate(rangeLabelStart)} — {compactDate(rangeLabelEnd)}
                                    </h2>
                                    <span>
                                        {selectedRangeCount} included day{selectedRangeCount === 1 ? '' : 's'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-3 p-5">
                                <div className="calendar-index-block-row">
                                    <span>
                                        <Clock3 className="h-4 w-4" />
                                        <strong>Selected Date Status</strong>
                                        <small>{longDate(selectedDate)}</small>
                                    </span>

                                    <span className="alh-status-chip is-public">
                                        {scheduleStatusLabel(selectedStatus)}
                                    </span>
                                </div>

                                {BLOCK_KEYS.map((block) => {
                                    const open = selectedAvailability?.[block] ?? true;

                                    return (
                                        <div key={block} className="calendar-index-block-row">
                                            <span>
                                                <Clock3 className="h-4 w-4" />
                                                <strong>{BLOCK_META[block].label}</strong>
                                                <small>{BLOCK_META[block].time}</small>
                                            </span>

                                            <span className={open ? 'alh-status-chip is-good' : 'alh-status-chip is-bad'}>
                                                {open ? 'Open' : 'Unavailable'}
                                            </span>
                                        </div>
                                    );
                                })}

                                <Link href={createBookingHref(rangeLabelStart, rangeLabelEnd)} className="alh-primary-button justify-center">
                                    Quick Booking
                                </Link>
                            </div>
                        </section>

                        <section className="calendar-index-panel overflow-hidden">
                            <div className="calendar-index-panel-header">
                                <div>
                                    <p className="backend-booking-label">Range Records</p>
                                    <h2>{rangeEvents.length} item{rangeEvents.length === 1 ? '' : 's'}</h2>
                                </div>
                            </div>

                            <div className="grid gap-3 p-5">
                                {rangeEvents.length > 0 ? (
                                    rangeEvents.map((event) => (
                                        <Link key={`${event.kind}-${event.id}`} href={eventHref(event)} className="calendar-index-event-card">
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`alh-status-chip ${statusClass(event.status || event.kind)}`}>
                                                    {cleanLabel(event.status || event.kind)}
                                                </span>
                                                {event.area ? <span className="booking-mini-pill">{event.area}</span> : null}
                                            </div>

                                            <h3>{event.title || cleanLabel(event.kind)}</h3>
                                            <p>{event.company_name || event.client_name || event.note || event.summary || 'Calendar item'}</p>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="calendar-index-empty">
                                        <AlertTriangle className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                        <h3>No records</h3>
                                        <p>No booking, block, or public event loaded for the selected range.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="calendar-index-panel overflow-hidden">
                            <div className="calendar-index-panel-header">
                                <div>
                                    <p className="backend-booking-label">Public Highlights</p>
                                    <h2>Events</h2>
                                </div>
                            </div>

                            <div className="grid gap-3 p-5">
                                {highlighted.length > 0 ? (
                                    highlighted.map((item) => (
                                        <article key={item.id} className="calendar-highlight-card">
                                            {item.image ? (
                                                <img src={item.image} alt={item.title || 'Event'} />
                                            ) : (
                                                <div className="calendar-highlight-placeholder">
                                                    <Sparkles className="h-6 w-6" />
                                                </div>
                                            )}

                                            <div>
                                                <h3>{item.title || 'Public Event'}</h3>
                                                <p>
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {item.venue || 'BCCC'}
                                                </p>
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <div className="calendar-index-empty">
                                        <ShieldAlert className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                        <h3>No highlights</h3>
                                        <p>Public event highlights will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </aside>
                </section>
            </div>
        </AppLayout>
    );
}
