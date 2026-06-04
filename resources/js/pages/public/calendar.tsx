import OfficialPageHero from '@/components/public/official-page-hero';
import PublicLayout from '@/layouts/public-layout';
import {
    addMonths,
    buildMonthWeeks,
    cx,
    dateKey,
    deriveDayStatus,
    fallbackVenues,
    getPublicCalendarMonth,
    longDate,
    monthKeyFromDate,
    monthLabel,
    normalizeBlocks,
    statusDescription,
    statusDot,
    statusLabel,
    todayKey,
    type AvailabilityStatus,
    type PublicDayStatus,
} from '@/lib/public-availability';
import type { VenueOption } from '@/types/public-content';
import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock3,
    Info,
    LoaderCircle,
    Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Props = {
    venueOptions?: VenueOption[];
};

type CalendarIndex = Record<string, PublicDayStatus>;

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function statusAccent(status: AvailabilityStatus | string) {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'blocked' || normalized === 'private_booked' || normalized === 'private-booked') {
        return 'border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100';
    }

    if (normalized === 'limited' || normalized === 'public_booked' || normalized === 'public-booked') {
        return 'border-[#e7b45d]/60 bg-[#e7b45d]/16 text-[#6b4511] dark:text-[#ffe5ad]';
    }

    return 'border-emerald-600/25 bg-emerald-600/10 text-emerald-900 dark:text-emerald-100';
}

function eventCount(day?: PublicDayStatus) {
    const titles = day?.event_titles ?? [];
    const blocks = day?.calendar_blocks ?? [];
    return titles.length + blocks.length;
}

function dayButtonTone(status: AvailabilityStatus | string, isToday: boolean, isPast: boolean) {
    if (isPast || status === 'past_unavailable') {
        return 'bg-slate-100 text-slate-400 opacity-70 dark:bg-white/8 dark:text-white/38';
    }

    if (status === 'blocked' || status === 'private_booked') {
        return 'border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100';
    }

    if (status === 'public_booked') {
        return 'border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100';
    }

    if (status === 'limited') {
        return 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100';
    }

    if (isToday) {
        return 'bg-[#176456]/14 text-[#176456] dark:bg-white/12 dark:text-white';
    }

    return 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100';
}

function DayButton({
    day,
    month,
    entry,
    selected,
    onSelect,
}: {
    day: Date;
    month: string;
    entry?: PublicDayStatus;
    selected: boolean;
    onSelect: () => void;
}) {
    const key = dateKey(day);
    const inMonth = key.startsWith(month);
    const isToday = key === todayKey();
    const isPast = key < todayKey();
    const status = isPast ? 'past_unavailable' : deriveDayStatus(entry);
    const count = eventCount(entry);

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cx(
                'group relative mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-semibold transition duration-300 focus:outline-none focus:ring-4 focus:ring-[#176456]/18',
                selected
                    ? 'bg-[#176456] text-white shadow-[0_12px_28px_rgba(23,100,86,0.25)]'
                    : dayButtonTone(status, isToday, isPast),
                !inMonth && 'opacity-40',
            )}
            aria-label={`${key} ${isPast ? 'Unavailable past date' : statusLabel(status)}`}
        >
            {day.getDate()}
            {count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#d71920] ring-2 ring-white dark:ring-[#0b1614]" />
            ) : null}
        </button>
    );
}

function LegendItem({ className, label }: { className: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-2 text-xs font-medium text-[#425466] dark:text-white/60">
            <span className={cx('h-3.5 w-3.5 rounded-full border', className)} />
            {label}
        </span>
    );
}

function SelectedPanel({ day }: { day: PublicDayStatus | null }) {
    if (!day) {
        return (
            <section className="grid min-h-[31rem] place-items-center rounded-lg border border-slate-200 bg-white text-center shadow-[0_20px_55px_rgba(8,47,42,0.08)] dark:border-white/10 dark:bg-white/[0.045]">
                <div className="px-6">
                    <CalendarDays className="mx-auto h-10 w-10 text-[#176456]/42 dark:text-white/38" />
                    <h2 className="mt-5 text-xl font-bold tracking-[-0.02em] text-[#153d66] dark:text-white">Select a date or event</h2>
                    <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#425466] dark:text-white/54">
                        Click on a highlighted date in the calendar to see public events and availability details.
                    </p>
                </div>
            </section>
        );
    }

    const status = deriveDayStatus(day);
    const blocks = normalizeBlocks(day.blocks);
    const titles = day.event_titles ?? [];
    const calendarBlocks = day.calendar_blocks ?? [];

    return (
        <section className="min-h-[31rem] rounded-lg border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(8,47,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#176456] dark:text-[#9fe8dc]">Selected Date</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#153d66] dark:text-white sm:text-4xl">
                        {longDate(day.date)}
                    </h2>
                </div>

                <span className={cx('inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]', statusAccent(status))}>
                    {statusLabel(status)}
                </span>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#425466] dark:text-white/58">
                {day.description || statusDescription(status)}
            </p>

            {day.note ? <p className="mt-3 text-sm leading-7 text-[#65758b] dark:text-white/46">{day.note}</p> : null}

            <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-md border border-slate-200 bg-[#f8fafb] p-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#153d66] dark:text-white">
                        <Info className="h-4 w-4 text-[#176456] dark:text-[#9fe8dc]" />
                        Public events
                    </div>

                    <div className="mt-4 grid gap-2">
                        {titles.length > 0 || calendarBlocks.length > 0 ? (
                            <>
                                {titles.map((title) => (
                                    <div key={title} className="rounded-md border border-[#176456]/12 bg-white px-4 py-3 text-sm font-semibold text-[#153d66] dark:border-white/10 dark:bg-white/[0.045] dark:text-white/80">
                                        {title}
                                    </div>
                                ))}
                                {calendarBlocks.map((block, index) => (
                                    <div key={`${block.title ?? 'calendar-block'}-${index}`} className="rounded-md border border-[#176456]/12 bg-white px-4 py-3 text-sm text-[#425466] dark:border-white/10 dark:bg-white/[0.045] dark:text-white/62">
                                        <strong className="block text-[#153d66] dark:text-white">{block.title || 'Calendar activity'}</strong>
                                        {block.area ? <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-[#176456] dark:text-[#9fe8dc]">{block.area}</span> : null}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-[#65758b] dark:border-white/10 dark:bg-white/[0.035] dark:text-white/46">
                                No public event title is listed for this date.
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-[#f8fafb] p-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#153d66] dark:text-white">
                        <Clock3 className="h-4 w-4 text-[#176456] dark:text-[#9fe8dc]" />
                        Time blocks
                    </div>

                    <div className="mt-4 grid gap-2">
                        {blocks.length > 0 ? (
                            blocks.map((block) => (
                                <div key={String(block.key)} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.045]">
                                    <div>
                                        <strong className="text-[#153d66] dark:text-white">{block.label || block.key}</strong>
                                        <p className="text-xs text-[#65758b] dark:text-white/46">{block.from} – {block.to}</p>
                                    </div>
                                    <span className={cx('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]', block.is_available === false ? 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-100' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100')}>
                                        {block.is_available === false ? 'Unavailable' : 'Open'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-[#65758b] dark:border-white/10 dark:bg-white/[0.035] dark:text-white/46">
                                No time-block detail is listed yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
                <Link href={`/book?date=${encodeURIComponent(day.date)}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#176456] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-[#0f4d43]">
                    Start reservation
                </Link>
                <Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#153d66] transition hover:-translate-y-0.5 hover:border-[#176456]/30 dark:border-white/10 dark:bg-white/[0.055] dark:text-white">
                    Ask the office
                </Link>
            </div>
        </section>
    );
}

export default function PublicCalendar({ venueOptions = [] }: Props) {
    const venues = venueOptions.length ? venueOptions : fallbackVenues;
    const [month, setMonth] = useState(() => monthKeyFromDate(new Date()));
    const [venue, setVenue] = useState(() => venues[0]?.value ?? 'FULL HALL');
    const [calendar, setCalendar] = useState<CalendarIndex>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const weeks = useMemo(() => buildMonthWeeks(month), [month]);
    const selectedDay = selectedDate ? calendar[selectedDate] ?? {
        date: selectedDate,
        status: 'available',
        title: 'No listed conflict',
        description: statusDescription('available'),
        note: '',
    } : null;

    const listedEvents = useMemo(() => {
        const rows: Array<{ date: string; title: string }> = [];
        Object.values(calendar).forEach((day) => {
            (day.event_titles ?? []).forEach((title) => rows.push({ date: day.date, title }));
            (day.calendar_blocks ?? []).forEach((block) => {
                if (block.title) rows.push({ date: day.date, title: block.title });
            });
        });

        const needle = search.trim().toLowerCase();
        return rows
            .filter((row) => !needle || row.title.toLowerCase().includes(needle) || row.date.includes(needle))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 8);
    }, [calendar, search]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        getPublicCalendarMonth({ month, venue })
            .then((payload) => {
                if (!active) return;
                const next: CalendarIndex = {};
                (payload.days ?? []).forEach((day) => {
                    next[day.date] = day;
                });
                setCalendar(next);
            })
            .catch((exception: Error) => {
                if (!active) return;
                setError(exception.message || 'Unable to load calendar.');
                setCalendar({});
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [month, venue]);

    return (
        <PublicLayout>
            <Head title="Public Calendar" />

            <main className="min-h-screen bg-[#e9eef0] text-[#153d66] dark:bg-[#07110f] dark:text-white">
                <OfficialPageHero
                    eyebrow="Baguio Convention and Cultural Center"
                    title="Calendar"
                    description="Check public-facing events and quick venue availability details before starting a reservation."
                />

                <section className="public-container py-10 lg:py-14">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start">
                        <SelectedPanel day={selectedDay} />

                        <aside className="space-y-4 lg:sticky lg:top-28">
                            <div className="rounded-lg border border-slate-200 bg-white shadow-[0_20px_55px_rgba(8,47,42,0.08)] dark:border-white/10 dark:bg-white/[0.045]">
                                <div className="flex items-center justify-between px-5 py-5">
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => setMonth((current) => addMonths(current, -12))} className="grid h-8 w-8 place-items-center rounded-full text-[#153d66] transition hover:bg-[#eef4f2] dark:text-white/70 dark:hover:bg-white/10" aria-label="Previous year">
                                            <ChevronsLeft className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => setMonth((current) => addMonths(current, -1))} className="grid h-8 w-8 place-items-center rounded-full text-[#153d66] transition hover:bg-[#eef4f2] dark:text-white/70 dark:hover:bg-white/10" aria-label="Previous month">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <strong className="text-sm font-semibold text-[#153d66] dark:text-white">{monthLabel(month)}</strong>

                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => setMonth((current) => addMonths(current, 1))} className="grid h-8 w-8 place-items-center rounded-full text-[#153d66] transition hover:bg-[#eef4f2] dark:text-white/70 dark:hover:bg-white/10" aria-label="Next month">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => setMonth((current) => addMonths(current, 12))} className="grid h-8 w-8 place-items-center rounded-full text-[#153d66] transition hover:bg-[#eef4f2] dark:text-white/70 dark:hover:bg-white/10" aria-label="Next year">
                                            <ChevronsRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="px-5 pb-5">
                                    <select value={venue} onChange={(event) => setVenue(event.target.value)} className="mb-4 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-[#153d66] outline-none transition focus:border-[#176456] focus:ring-4 focus:ring-[#176456]/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
                                        {venues.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>

                                    <div className="grid grid-cols-7 gap-y-2">
                                        {weekdayLabels.map((day, index) => <span key={`${day}-${index}`} className="pb-1 text-center text-[11px] font-black uppercase text-[#1a9b7f]">{day}</span>)}
                                        {weeks.flat().map((day) => {
                                            const key = dateKey(day);
                                            return (
                                                <DayButton
                                                    key={key}
                                                    day={day}
                                                    month={month}
                                                    entry={calendar[key]}
                                                    selected={selectedDate === key}
                                                    onSelect={() => setSelectedDate(key)}
                                                />
                                            );
                                        })}
                                    </div>

                                    {loading ? (
                                        <div className="mt-4 flex items-center justify-center gap-2 rounded-md bg-[#eef4f2] py-3 text-sm text-[#425466] dark:bg-white/[0.045] dark:text-white/50">
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                            Refreshing events...
                                        </div>
                                    ) : null}

                                    {error ? (
                                        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                                            {error}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap gap-4 border-t border-slate-200 px-5 py-4 dark:border-white/10">
                                    <LegendItem className="border-[#fde7bf] bg-[#fde7bf]" label="1 event" />
                                    <LegendItem className="border-[#f59e0b] bg-[#f59e0b]" label="2+ events" />
                                    <LegendItem className="border-slate-200 bg-slate-100" label="Past unavailable" />
                                    <span className="inline-flex items-center gap-2 text-xs font-medium text-[#425466] dark:text-white/60">
                                        <span className={cx('h-3.5 w-3.5 rounded-full', statusDot('available'))} />
                                        Available
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_20px_55px_rgba(8,47,42,0.08)] dark:border-white/10 dark:bg-white/[0.045]">
                                <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <Search className="h-4 w-4 text-[#65758b]" />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search all events..."
                                        className="min-w-0 flex-1 bg-transparent text-sm text-[#153d66] outline-none placeholder:text-[#8a96a8] dark:text-white"
                                    />
                                </label>

                                <div className="mt-4 grid gap-2">
                                    {listedEvents.length > 0 ? listedEvents.map((event) => (
                                        <button
                                            key={`${event.date}-${event.title}`}
                                            type="button"
                                            onClick={() => setSelectedDate(event.date)}
                                            className="rounded-md border border-slate-200 bg-[#f8fafb] px-3 py-2.5 text-left transition hover:border-[#176456]/30 hover:bg-[#eef4f2] dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.07]"
                                        >
                                            <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-[#176456] dark:text-[#9fe8dc]">{event.date}</span>
                                            <span className="mt-1 line-clamp-1 block text-sm font-semibold text-[#153d66] dark:text-white/80">{event.title}</span>
                                        </button>
                                    )) : (
                                        <p className="rounded-md border border-dashed border-slate-300 bg-[#f8fafb] px-3 py-5 text-center text-sm text-[#65758b] dark:border-white/10 dark:bg-white/[0.035] dark:text-white/46">
                                            No public events found for this month.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </section>
            </main>
        </PublicLayout>
    );
}
