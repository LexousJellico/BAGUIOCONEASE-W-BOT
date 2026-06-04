import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Hourglass,
    LockKeyhole,
    MapPin,
    Plus,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type CalendarAvailabilityDay = {
    AM?: boolean;
    PM?: boolean;
    EVE?: boolean;
    is_fully_booked?: boolean;
    day_status?: string;
    is_past?: boolean;
};

type CalendarEvent = {
    id?: string | number;
    kind?: 'booking' | 'block' | 'public_event' | string;
    title?: string | null;
    start?: string | null;
    end?: string | null;
    status?: string | null;
    payment_status?: string | null;
    area?: string | null;
    block?: string | null;
    guests?: number | string | null;
    is_client_owned?: boolean;
};

type PageProps = {
    month?: string;
    monthAvailability?: Record<string, CalendarAvailabilityDay>;
    events?: CalendarEvent[];
};

type CalendarCell = {
    key: string;
    number: number;
    current: boolean;
    today: boolean;
};

type DayTone = {
    fill: string;
    border: string;
    selectedBorder: string;
    text: string;
    badge: string;
    dot: string;
    icon: typeof CalendarDays;
};

const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const currentDayKey = () => dateKey(new Date());

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function dateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
    return new Date(`${value}T00:00:00`);
}

function monthLabel(value: string) {
    const [year, month] = value.split('-').map(Number);

    return new Date(year, (month || 1) - 1, 1).toLocaleDateString('en-PH', {
        month: 'long',
        year: 'numeric',
    });
}

function fullDateLabel(value: string) {
    return parseLocalDate(value).toLocaleDateString('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function addMonth(value: string, offset: number) {
    const [year, month] = value.split('-').map(Number);
    const next = new Date(year, (month || 1) - 1 + offset, 1);

    return dateKey(next).slice(0, 7);
}

function buildGrid(month: string): CalendarCell[] {
    const [year, monthNumber] = month.split('-').map(Number);
    const first = new Date(year, (monthNumber || 1) - 1, 1);
    const start = new Date(first);

    start.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);

        return {
            key: dateKey(date),
            number: date.getDate(),
            current: date.getMonth() === first.getMonth(),
            today: dateKey(date) === currentDayKey(),
        };
    });
}

function normalize(value?: string | null) {
    return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function eventTouchesDate(event: CalendarEvent, key: string) {
    const start = event.start?.slice(0, 10);
    const end = event.end?.slice(0, 10);

    if (!start) return false;
    if (!end) return start === key;

    return key >= start && key <= end;
}

function eventsForDate(events: CalendarEvent[], key: string) {
    return events.filter((event) => eventTouchesDate(event, key));
}

function ownBookingForDate(events: CalendarEvent[], key: string) {
    return eventsForDate(events, key).find((event) => normalize(event.kind) === 'booking');
}

function ownBookingStage(event?: CalendarEvent): string | null {
    if (!event) return null;

    const status = normalize(event.status);
    const payment = normalize(event.payment_status);

    if (['pending', 'pencil_booked', 'submitted', 'draft'].includes(status)) return 'My Pending Booking';
    if (['for_review', 'under_review', 'awaiting_review'].includes(status)) return 'Under Review';
    if (status === 'confirmed') {
        if (['for_review', 'submitted'].includes(payment)) return 'Payment Under Review';
        if (payment === 'partial') return 'Partial Payment';

        return 'Payment Stage';
    }
    if (['approved', 'active'].includes(status)) return 'Approved Reservation';
    if (status === 'completed') return 'Completed Reservation';
    if (['cancelled', 'canceled', 'declined', 'expired', 'archived'].includes(status)) return 'Closed Reservation';

    return 'My Booking';
}

function isEveOnlyAvailability(day?: CalendarAvailabilityDay) {
    return day?.AM === false && day?.PM === false && day?.EVE !== false;
}

function dayStatus(day: CalendarAvailabilityDay | undefined, key: string, ownBooking?: CalendarEvent) {
    const ownStage = ownBookingStage(ownBooking);
    const status = normalize(day?.day_status);
    const isPast = key < currentDayKey() || day?.is_past === true;

    if (ownStage) return ownStage;
    if (isPast) return 'Past / Unavailable';
    if (!day) return 'Available';
    if (isEveOnlyAvailability(day)) return 'Unavailable';
    if (status === 'public_booked') return 'Public Activity';
    if (status === 'private_booked' || day.is_fully_booked) return 'Reserved';
    if (status === 'blocked' || status === 'past_unavailable' || status === 'unavailable') return 'Unavailable';
    if (['limited', 'partial', 'partially_booked'].includes(status)) return 'Limited';

    return 'Available';
}

function dayStatusDescription(status: string) {
    if (status === 'My Pending Booking') return 'Your reservation request is saved and waiting for BCCC staff review.';
    if (status === 'Under Review') return 'Your reservation is being checked by the BCCC operations team.';
    if (status === 'Payment Stage') return 'Your reservation is confirmed for payment processing. Check your booking record for payment instructions.';
    if (status === 'Payment Under Review') return 'Your payment proof has been submitted and is waiting for review.';
    if (status === 'Partial Payment') return 'Your booking has a partial approved payment. Complete the remaining balance before the due date.';
    if (status === 'Approved Reservation') return 'Your booking is approved and will appear in your calendar as an official reservation.';
    if (status === 'Completed Reservation') return 'This is your completed booking record.';
    if (status === 'Closed Reservation') return 'This booking is no longer active. Open the booking record for the final status details.';
    if (status === 'Past / Unavailable') return 'This is a past date and is shown as unavailable in a faded neutral color.';
    if (status === 'Reserved') return 'This date is reserved or fully occupied. Private booking details are hidden.';
    if (status === 'Unavailable') return 'This date is blocked for operations or not open for a new reservation request.';
    if (status === 'Public Activity') return 'This date includes a public BCCC activity.';
    if (status === 'Limited') return 'Some time blocks may still be available. Review the block details below.';

    return 'This date is generally available based on the current calendar.';
}

function dayTone(status: string): DayTone {
    if (status === 'My Pending Booking') {
        return {
            fill: 'bg-amber-500/10 dark:bg-amber-300/10',
            border: 'border-amber-500/30 dark:border-amber-300/25',
            selectedBorder: 'border-amber-500/60 dark:border-amber-300/55',
            text: 'text-amber-800 dark:text-amber-100',
            badge: 'bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/25 dark:text-amber-100',
            dot: 'bg-amber-500',
            icon: Hourglass,
        };
    }

    if (['Under Review', 'Payment Stage', 'Payment Under Review', 'Partial Payment'].includes(status)) {
        return {
            fill: 'bg-blue-500/10 dark:bg-blue-300/10',
            border: 'border-blue-500/30 dark:border-blue-300/25',
            selectedBorder: 'border-blue-500/60 dark:border-blue-300/55',
            text: 'text-blue-800 dark:text-blue-100',
            badge: 'bg-blue-500/10 text-blue-800 ring-1 ring-blue-500/25 dark:text-blue-100',
            dot: 'bg-blue-500',
            icon: CreditCard,
        };
    }

    if (status === 'Approved Reservation') {
        return {
            fill: 'bg-emerald-500/10 dark:bg-emerald-300/10',
            border: 'border-emerald-500/30 dark:border-emerald-300/25',
            selectedBorder: 'border-emerald-500/60 dark:border-emerald-300/55',
            text: 'text-emerald-800 dark:text-emerald-100',
            badge: 'bg-emerald-500/10 text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-100',
            dot: 'bg-emerald-500',
            icon: ShieldCheck,
        };
    }

    if (status === 'Completed Reservation') {
        return {
            fill: 'bg-slate-500/10 dark:bg-slate-300/10',
            border: 'border-slate-400/30 dark:border-slate-300/25',
            selectedBorder: 'border-slate-500/55 dark:border-slate-300/45',
            text: 'text-slate-700 dark:text-slate-100',
            badge: 'bg-slate-500/10 text-slate-700 ring-1 ring-slate-500/20 dark:text-slate-100',
            dot: 'bg-slate-500',
            icon: CheckCircle2,
        };
    }

    if (status === 'Closed Reservation') {
        return {
            fill: 'bg-rose-500/10 dark:bg-rose-300/10',
            border: 'border-rose-400/25 dark:border-rose-300/20',
            selectedBorder: 'border-rose-500/50 dark:border-rose-300/40',
            text: 'text-rose-800 dark:text-rose-100',
            badge: 'bg-rose-500/10 text-rose-800 ring-1 ring-rose-500/20 dark:text-rose-100',
            dot: 'bg-rose-500',
            icon: XCircle,
        };
    }

    if (status === 'Past / Unavailable' || status === 'Unavailable') {
        return {
            fill: 'bg-slate-500/10 dark:bg-white/[0.055]',
            border: 'border-slate-300/55 dark:border-white/10',
            selectedBorder: 'border-slate-500/55 dark:border-white/25',
            text: 'text-slate-600 dark:text-slate-200',
            badge: 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20 dark:text-slate-200',
            dot: 'bg-slate-400',
            icon: LockKeyhole,
        };
    }

    if (status === 'Reserved') {
        return {
            fill: 'bg-rose-500/15 dark:bg-rose-300/15',
            border: 'border-rose-500/35 dark:border-rose-300/25',
            selectedBorder: 'border-rose-500/65 dark:border-rose-300/50',
            text: 'text-rose-800 dark:text-rose-100',
            badge: 'bg-rose-500/10 text-rose-800 ring-1 ring-rose-500/25 dark:text-rose-100',
            dot: 'bg-rose-500',
            icon: LockKeyhole,
        };
    }

    if (status === 'Public Activity') {
        return {
            fill: 'bg-sky-500/10 dark:bg-sky-300/10',
            border: 'border-sky-500/30 dark:border-sky-300/25',
            selectedBorder: 'border-sky-500/60 dark:border-sky-300/55',
            text: 'text-sky-800 dark:text-sky-100',
            badge: 'bg-sky-500/10 text-sky-800 ring-1 ring-sky-500/25 dark:text-sky-100',
            dot: 'bg-sky-500',
            icon: CalendarDays,
        };
    }

    if (status === 'Limited') {
        return {
            fill: 'bg-yellow-500/10 dark:bg-yellow-300/10',
            border: 'border-yellow-500/30 dark:border-yellow-300/25',
            selectedBorder: 'border-yellow-500/60 dark:border-yellow-300/55',
            text: 'text-yellow-800 dark:text-yellow-100',
            badge: 'bg-yellow-500/10 text-yellow-800 ring-1 ring-yellow-500/25 dark:text-yellow-100',
            dot: 'bg-yellow-500',
            icon: CalendarDays,
        };
    }

    return {
        fill: 'bg-emerald-500/10 dark:bg-emerald-300/10',
        border: 'border-emerald-500/25 dark:border-emerald-300/20',
        selectedBorder: 'border-emerald-500/55 dark:border-emerald-300/45',
        text: 'text-emerald-800 dark:text-emerald-100',
        badge: 'bg-emerald-500/10 text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-100',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    };
}

function blockAvailable(day: CalendarAvailabilityDay | undefined, block: 'AM' | 'PM' | 'EVE', key: string, ownBooking?: CalendarEvent) {
    if (ownBooking || key < currentDayKey()) return false;
    if (!day) return true;
    if (block === 'EVE' && isEveOnlyAvailability(day)) return false;

    const status = dayStatus(day, key);

    return day[block] !== false && !day.is_fully_booked && !['Unavailable', 'Reserved', 'Past / Unavailable'].includes(status);
}

function goToMonth(month: string) {
    router.get('/my-calendar', { month }, { preserveScroll: true, replace: true });
}

function eventLabel(event: CalendarEvent) {
    const kind = normalize(event.kind);
    const stage = ownBookingStage(event);

    if (kind === 'booking') return event.title || stage || 'My booking';
    if (kind === 'public_event') return event.title || 'Public activity';
    if (kind === 'block') return event.title || 'Calendar hold';

    return event.title || 'Calendar item';
}

function eventStatusLabel(event: CalendarEvent) {
    if (normalize(event.kind) === 'booking') return ownBookingStage(event) || normalize(event.status).replace(/_/g, ' ') || 'Booking';
    if (normalize(event.kind) === 'public_event') return 'Public Activity';
    if (normalize(event.status) === 'private_booked') return 'Reserved';
    if (normalize(event.status) === 'blocked') return 'Unavailable';

    return String(event.status || event.kind || 'Calendar item').replace(/_/g, ' ');
}

function blockTimes(block: 'AM' | 'PM' | 'EVE') {
    if (block === 'AM') return { start: '06:00', end: '12:00', label: 'AM Block', helper: '6:00 AM - 12:00 PM' };
    if (block === 'PM') return { start: '12:00', end: '18:00', label: 'PM Block', helper: '12:00 PM - 6:00 PM' };
    return { start: '18:00', end: '23:59', label: 'Evening Block', helper: '6:00 PM - 11:59 PM' };
}

function blockBookingHref(date: string, block: 'AM' | 'PM' | 'EVE') {
    const times = blockTimes(block);
    const bookingBlock = block === 'EVE' ? 'PM' : block;
    const params = new URLSearchParams({
        date,
        start: block === 'EVE' ? '12:00' : times.start,
        end: times.end,
        block: bookingBlock,
        preferred_block: block,
    });

    return `/book?${params.toString()}`;
}

function eventTone(event: CalendarEvent) {
    const stage = ownBookingStage(event);

    if (stage) return dayTone(stage).badge;

    const status = normalize(event.status);

    if (status === 'public_booked') return dayTone('Public Activity').badge;
    if (status === 'private_booked') return dayTone('Reserved').badge;
    if (status === 'blocked') return dayTone('Unavailable').badge;

    return 'bg-background text-foreground ring-1 ring-border';
}

function bookingHref(event?: CalendarEvent) {
    if (!event || normalize(event.kind) !== 'booking' || !/^\d+$/.test(String(event.id ?? ''))) return null;

    return `/my-bookings/${event.id}`;
}

export default function UserCalendarIndex() {
    const { props } = usePage<PageProps>();
    const month = props.month || currentDayKey().slice(0, 7);
    const availability = useMemo(() => props.monthAvailability ?? {}, [props.monthAvailability]);
    const events = useMemo(() => props.events ?? [], [props.events]);
    const grid = useMemo(() => buildGrid(month), [month]);
    const todayKey = currentDayKey();
    const [selectedDate, setSelectedDate] = useState(todayKey.slice(0, 7) === month ? todayKey : `${month}-01`);

    useEffect(() => {
        setSelectedDate((current) => {
            if (current.slice(0, 7) === month) return current;

            const today = currentDayKey();
            return today.slice(0, 7) === month ? today : `${month}-01`;
        });
    }, [month]);

    const selectedAvailability = availability[selectedDate];
    const selectedOwnBooking = ownBookingForDate(events, selectedDate);
    const selectedEvents = useMemo(() => eventsForDate(events, selectedDate).slice(0, 6), [events, selectedDate]);
    const selectedStatus = dayStatus(selectedAvailability, selectedDate, selectedOwnBooking);
    const selectedTone = dayTone(selectedStatus);
    const SelectedIcon = selectedTone.icon;
    const selectedBookingHref = bookingHref(selectedOwnBooking);

    const statusCounts = useMemo(() => {
        return grid.reduce(
            (carry, day) => {
                if (!day.current) return carry;

                const own = ownBookingForDate(events, day.key);
                const status = dayStatus(availability[day.key], day.key, own);

                if (status.startsWith('My ') || status === 'Under Review' || status.includes('Payment') || status.includes('Reservation')) carry.mine += 1;
                else if (status === 'Available') carry.available += 1;
                else if (status === 'Limited') carry.limited += 1;
                else if (status === 'Reserved') carry.reserved += 1;
                else if (status === 'Public Activity') carry.public += 1;
                else carry.unavailable += 1;

                return carry;
            },
            {
                mine: 0,
                available: 0,
                limited: 0,
                reserved: 0,
                public: 0,
                unavailable: 0,
            },
        );
    }, [availability, events, grid]);

    return (
        <BookingRolePageShell
            role="user"
            title="My Calendar"
            description="Check your reservation requests, approved schedules, and available time blocks. Selecting a date only opens details and will not automatically create a booking."
            actions={
                <Link
                    href="/book"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    New Booking
                </Link>
            }
        >
            <section className="my-calendar-page user-calendar-responsive-card overflow-hidden rounded-[1.5rem] border border-border bg-card text-card-foreground shadow-[0_28px_80px_rgba(0,0,0,0.10)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
                <div className="user-calendar-toolbar border-b border-border bg-muted/40 p-3 sm:p-5 lg:p-6">
                    <div className="user-calendar-month-switcher">
                        <button
                            type="button"
                            onClick={() => goToMonth(addMonth(month, -1))}
                            className="user-calendar-nav-button grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-background/80 text-foreground transition hover:-translate-x-0.5 hover:border-primary/40 hover:bg-primary/10"
                            aria-label="Previous month"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>

                        <div className="user-calendar-month-copy min-w-0 text-center">
                            <p className="text-[0.62rem] font-black uppercase tracking-[0.26em] text-muted-foreground sm:text-[0.68rem] sm:tracking-[0.32em]">Client Calendar</p>
                            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.06em] text-foreground sm:text-4xl lg:text-5xl">
                                {monthLabel(month)}
                            </h2>
                            <p className="mx-auto mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">
                                Your bookings are highlighted by status. Other private reservations stay hidden while unavailable dates remain clearly marked.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => goToMonth(addMonth(month, 1))}
                            className="user-calendar-nav-button grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-background/80 text-foreground transition hover:translate-x-0.5 hover:border-primary/40 hover:bg-primary/10"
                            aria-label="Next month"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="user-calendar-legend-scroller mt-4" aria-label="Calendar status legend">
                        <div className="user-calendar-legend flex items-center gap-2">
                            {[
                                ['Mine', statusCounts.mine, 'bg-blue-500'],
                                ['Available', statusCounts.available, 'bg-emerald-500'],
                                ['Limited', statusCounts.limited, 'bg-yellow-500'],
                                ['Reserved', statusCounts.reserved, 'bg-rose-500'],
                                ['Public', statusCounts.public, 'bg-sky-500'],
                                ['Past / Unavailable', statusCounts.unavailable, 'bg-slate-400'],
                            ].map(([label, count, dot]) => (
                                <span
                                    key={String(label)}
                                    className="user-calendar-legend-pill inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-background/75 px-3 text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted-foreground"
                                >
                                    <i className={cx('h-2.5 w-2.5 rounded-full', String(dot))} />
                                    <span>{label}</span>
                                    <b className="font-black text-foreground">{count}</b>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="user-calendar-layout grid gap-0 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
                    <div className="user-calendar-calendar-wrap min-w-0 p-2 sm:p-4 lg:p-5">
                        <div className="user-calendar-grid-scroll overflow-x-auto">
                            <div className="user-calendar-grid-inner w-full overflow-hidden">
                                <div className="user-calendar-grid grid grid-cols-7 gap-1.5 sm:gap-2">
                                    {weekLabels.map((label) => (
                                        <div
                                            key={label}
                                            className="user-calendar-week-label px-1 py-2 text-center text-[0.56rem] font-black uppercase tracking-[0.12em] text-muted-foreground sm:px-2 sm:py-3 sm:text-[0.68rem] sm:tracking-[0.22em]"
                                        >
                                            {label}
                                        </div>
                                    ))}

                                    {grid.map((day) => {
                                        const dayAvailability = availability[day.key];
                                        const own = ownBookingForDate(events, day.key);
                                        const status = dayStatus(dayAvailability, day.key, own);
                                        const tone = dayTone(status);
                                        const selected = day.key === selectedDate;
                                        const hasVisibleEvents = eventsForDate(events, day.key).length > 0;
                                        const dayBadge = own ? ownBookingStage(own) : selected ? 'Selected' : hasVisibleEvents ? 'Item' : '';

                                        return (
                                            <button
                                                key={day.key}
                                                type="button"
                                                onClick={() => setSelectedDate(day.key)}
                                                className={cx(
                                                    'user-calendar-day group relative min-h-[4.55rem] overflow-hidden rounded-2xl border bg-background/70 p-2 text-left transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)] dark:bg-white/[0.035] sm:min-h-[6.2rem] sm:p-3 lg:min-h-[6.7rem]',
                                                    tone.border,
                                                    !day.current && 'opacity-40',
                                                    selected && cx('z-10 bg-background shadow-[0_0_0_1px_rgba(180,140,80,0.20),0_24px_65px_rgba(0,0,0,0.16)] dark:bg-white/[0.07]', tone.selectedBorder),
                                                    day.today && !selected && 'ring-1 ring-inset ring-primary/35',
                                                )}
                                                aria-label={`${fullDateLabel(day.key)} ${status}`}
                                                aria-pressed={selected}
                                            >
                                                <span className={cx('pointer-events-none absolute inset-0 transition duration-300', tone.fill)} />

                                                <span className="relative z-10 flex h-full min-h-[3.65rem] flex-col justify-between gap-1.5 sm:min-h-[4.9rem] sm:gap-2">
                                                    <span className="flex items-start justify-between gap-1.5">
                                                        <strong className={cx('user-calendar-day-number text-base font-black tracking-[-0.03em] sm:text-lg', day.current ? 'text-foreground' : 'text-muted-foreground')}>
                                                            {day.number}
                                                        </strong>

                                                        <span className={cx('user-calendar-day-dot mt-1 h-2.5 w-2.5 rounded-full', tone.dot)} />
                                                    </span>

                                                    <span className="min-w-0">
                                                        {dayBadge ? (
                                                            <span className={cx('user-calendar-day-badge block truncate rounded-full px-1.5 py-1 text-center text-[0.5rem] font-black uppercase tracking-[0.08em] sm:px-2 sm:text-[0.56rem] sm:tracking-[0.12em]', own || selected ? tone.badge : 'text-muted-foreground')}>
                                                                {dayBadge}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="user-calendar-detail-panel border-t border-border bg-muted/30 p-3 sm:p-5 xl:border-l xl:border-t-0">
                        <div className="user-calendar-detail-card rounded-[1.2rem] border border-border bg-card p-4 shadow-[0_18px_45px_rgba(0,0,0,0.08)] dark:shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-5">
                            <p className="text-[0.64rem] font-black uppercase tracking-[0.24em] text-muted-foreground">Selected Date</p>
                            <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-foreground sm:text-2xl">{fullDateLabel(selectedDate)}</h3>

                            <div className={cx('mt-4 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.14em]', selectedTone.badge)}>
                                <SelectedIcon className="h-4 w-4 shrink-0" />
                                <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', selectedTone.dot)} />
                                <span className="min-w-0 truncate">{selectedStatus}</span>
                            </div>

                            <p className="mt-4 text-sm leading-7 text-muted-foreground">{dayStatusDescription(selectedStatus)}</p>

                            <div className="mt-5 grid gap-2">
                                {(['AM', 'PM', 'EVE'] as const).map((block) => {
                                    const available = blockAvailable(selectedAvailability, block, selectedDate, selectedOwnBooking);
                                    const times = blockTimes(block);
                                    const content = (
                                        <>
                                            <span className="inline-flex min-w-0 items-start gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                                                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                                <span className="min-w-0">
                                                    <span className="block">{times.label}</span>
                                                    <small className="mt-1 block text-[0.66rem] font-semibold normal-case tracking-normal text-muted-foreground/75">{times.helper}</small>
                                                </span>
                                            </span>

                                            <strong className={cx('shrink-0 text-[0.68rem] font-black uppercase tracking-[0.11em] sm:text-xs sm:tracking-[0.13em]', available ? 'text-emerald-700 dark:text-emerald-200' : 'text-slate-600 dark:text-slate-200')}>
                                                {available ? 'Book This' : selectedOwnBooking ? 'Your Booking' : 'Not Available'}
                                            </strong>
                                        </>
                                    );

                                    return available ? (
                                        <Link
                                            key={block}
                                            href={blockBookingHref(selectedDate, block)}
                                            className="user-calendar-block-row flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10 hover:shadow-[0_14px_32px_rgba(0,0,0,0.10)]"
                                        >
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={block} className="user-calendar-block-row flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 px-3 py-3 opacity-80">
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-5 grid gap-2">
                                <p className="text-[0.64rem] font-black uppercase tracking-[0.22em] text-muted-foreground">Small Details</p>

                                {selectedEvents.length > 0 ? (
                                    selectedEvents.map((event, index) => {
                                        const href = bookingHref(event);
                                        const body = (
                                            <div className="flex min-w-0 items-start gap-2">
                                                {normalize(event.kind) === 'block' ? <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /> : <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />}
                                                <div className="min-w-0 flex-1">
                                                    <strong className="block truncate font-bold">{eventLabel(event)}</strong>
                                                    <span className="mt-1 inline-flex max-w-full items-center gap-1 text-xs opacity-75">
                                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="min-w-0 truncate">{event.area || event.block || 'BCCC'}</span>
                                                    </span>
                                                    <span className="mt-1 block truncate text-[0.68rem] font-black uppercase tracking-[0.12em] opacity-80">
                                                        {eventStatusLabel(event)}
                                                    </span>
                                                </div>
                                            </div>
                                        );

                                        return href ? (
                                            <Link
                                                key={`${event.id ?? event.title ?? index}`}
                                                href={href}
                                                className={cx('block rounded-xl border px-3 py-3 text-sm transition hover:-translate-y-0.5 hover:shadow-md', eventTone(event))}
                                            >
                                                {body}
                                            </Link>
                                        ) : (
                                            <div
                                                key={`${event.id ?? event.title ?? index}`}
                                                className={cx('rounded-xl border px-3 py-3 text-sm', eventTone(event))}
                                            >
                                                {body}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-xl border border-border bg-background/70 px-3 py-3 text-sm leading-6 text-muted-foreground">
                                        No visible client calendar item on this date.
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 flex flex-col gap-2">
                                {selectedBookingHref ? (
                                    <Link
                                        href={selectedBookingHref}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-black uppercase tracking-[0.16em] text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
                                    >
                                        <CalendarDays className="h-4 w-4" />
                                        View My Booking
                                    </Link>
                                ) : ['Unavailable', 'Reserved', 'Past / Unavailable'].includes(selectedStatus) ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-border bg-muted px-4 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground"
                                    >
                                        <LockKeyhole className="h-4 w-4" />
                                        Booking Not Available
                                    </button>
                                ) : (
                                    <Link
                                        href={`/book?date=${selectedDate}`}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-black uppercase tracking-[0.16em] text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Use This Date
                                    </Link>
                                )}

                                <button
                                    type="button"
                                    onClick={() => goToMonth(currentDayKey().slice(0, 7))}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground transition hover:border-primary/35 hover:text-foreground"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Back to Current Month
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </BookingRolePageShell>
    );
}
