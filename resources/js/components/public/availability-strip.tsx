import {
    cx,
    deriveDayStatus,
    fallbackVenues,
    normalizeBlocks,
    normalizeStatus,
    postAvailabilityCheck,
    publicEventTypeOptions,
    statusDescription,
    statusLabel,
    statusTone,
    todayKey,
    type PublicDayStatus,
} from '@/lib/public-availability';
import type { VenueOption } from '@/types/public-content';
import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CalendarRange,
    CheckCircle2,
    CircleAlert,
    LayoutGrid,
    LoaderCircle,
    Users,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

type Props = {
    venueOptions: VenueOption[];
};

function FieldBox({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block rounded-[1.1rem] border border-[#d9c7a6]/70 bg-white/82 px-3 py-2.5 shadow-[0_12px_30px_rgba(47,37,23,0.06)] transition focus-within:border-[#b08d48] focus-within:ring-4 focus-within:ring-[#b08d48]/12 dark:border-white/10 dark:bg-white/7">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </span>
            {children}
        </label>
    );
}

function StatusIcon({ status }: { status: string }) {
    const normalized = normalizeStatus(status);

    if (normalized === 'available') {
        return <CheckCircle2 className="h-4 w-4" />;
    }

    if (normalized === 'limited' || normalized === 'public_booked') {
        return <CircleAlert className="h-4 w-4" />;
    }

    return <AlertTriangle className="h-4 w-4" />;
}

export default function AvailabilityStrip({ venueOptions }: Props) {
    const options = venueOptions.length > 0 ? venueOptions : fallbackVenues;

    const [date, setDate] = useState(todayKey());
    const [venue, setVenue] = useState(options[0]?.value || '');
    const [eventType, setEventType] = useState('');
    const [guests, setGuests] = useState('');
    const [result, setResult] = useState<PublicDayStatus | null>(null);
    const [validationMessage, setValidationMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const selectedVenueMeta = useMemo(
        () => options.find((item) => item.value === venue) ?? null,
        [venue, options],
    );

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!date || !venue || !eventType || !guests) {
            setValidationMessage('Please complete the date, venue, event type, and guest count first.');
            return;
        }

        setValidationMessage('');
        setLoading(true);
        setResult(null);

        try {
            const payload = await postAvailabilityCheck({
                date,
                start_date: date,
                end_date: date,
                date_from: date,
                date_to: date,
                venue,
                event_type: eventType,
                guests: Number(guests),
            });

            if (Array.isArray(payload?.results)) {
                setResult((payload.results[0] ?? null) as PublicDayStatus | null);
            } else {
                setResult(payload as PublicDayStatus);
            }
        } catch (error) {
            setValidationMessage(error instanceof Error ? error.message : 'Unable to check availability right now.');
        } finally {
            setLoading(false);
        }
    }

    const status = result ? deriveDayStatus(result) : null;
    const blocks = result ? normalizeBlocks(result.blocks) : [];

    return (
        <section className="bg-[#f8f5ef] px-4 py-14 dark:bg-[#0d0f12] sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-[1920px] gap-5 xl:grid-cols-[0.72fr_1fr]">
                <div className="rounded-[1.75rem] border border-[#d9c7a6]/70 bg-white/82 p-5 shadow-[0_24px_70px_rgba(47,37,23,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-[#f7f0e3] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                        <CalendarRange className="h-3.5 w-3.5" />
                        Check Availability
                    </div>

                    <h2 className="mt-4 font-serif text-[clamp(2.1rem,3vw,4rem)] font-light leading-[0.95] tracking-[-0.055em] text-[#21180d] dark:text-white">
                        Find an open venue date instantly.
                    </h2>

                    <p className="mt-4 text-sm leading-7 text-[#6e604c] dark:text-white/58">
                        This checker reads the same availability layer used by the booking workflow and public calendar.
                        It checks booked dates, blocked dates, public event titles, and AM/PM/EVE time blocks.
                    </p>
                </div>

                <div className="rounded-[1.75rem] border border-[#d9c7a6]/70 bg-white/82 p-4 shadow-[0_24px_70px_rgba(47,37,23,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
                    <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-5">
                        <FieldBox label="Event Date">
                            <input
                                type="date"
                                value={date}
                                onChange={(event) => setDate(event.target.value)}
                                className="mt-1.5 h-9 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none dark:text-white"
                            />
                        </FieldBox>

                        <FieldBox label="Venue">
                            <select
                                value={venue}
                                onChange={(event) => setVenue(event.target.value)}
                                className="mt-1.5 h-9 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none dark:text-white"
                            >
                                <option value="">Select venue</option>
                                {options.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </FieldBox>

                        <FieldBox label="Event Type">
                            <select
                                value={eventType}
                                onChange={(event) => setEventType(event.target.value)}
                                className="mt-1.5 h-9 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none dark:text-white"
                            >
                                <option value="">Select type</option>
                                {publicEventTypeOptions.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </FieldBox>

                        <FieldBox label="Guests">
                            <input
                                type="number"
                                min="1"
                                value={guests}
                                onChange={(event) => setGuests(event.target.value)}
                                placeholder="Estimated"
                                className="mt-1.5 h-9 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none placeholder:text-[#85755d] dark:text-white dark:placeholder:text-white/42"
                            />
                        </FieldBox>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex min-h-[4.5rem] items-center justify-center gap-2 rounded-[1.1rem] bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.20)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-[#17120b]"
                        >
                            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarRange className="h-4 w-4" />}
                            {loading ? 'Checking...' : 'Check'}
                        </button>
                    </form>

                    {selectedVenueMeta ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6e604c] dark:text-white/58">
                            <LayoutGrid className="h-4 w-4 text-[#9d7b3d] dark:text-[#f1d89b]" />
                            {selectedVenueMeta.label}
                            {selectedVenueMeta.category ? ` • ${selectedVenueMeta.category}` : ''}
                            {selectedVenueMeta.capacity ? ` • Capacity: ${selectedVenueMeta.capacity}` : ''}
                        </div>
                    ) : null}

                    {validationMessage ? (
                        <div className="mt-3 flex items-start gap-2 rounded-[1.1rem] border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            {validationMessage}
                        </div>
                    ) : null}

                    {result && status ? (
                        <article className={cx('mt-4 rounded-[1.35rem] border p-4', statusTone(status))}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-current/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]">
                                        <StatusIcon status={status} />
                                        {statusLabel(status)}
                                    </span>

                                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.045em]">
                                        {result.title || statusLabel(status)}
                                    </h3>

                                    <p className="mt-2 text-sm leading-7 opacity-80">
                                        {result.description || statusDescription(status)}
                                    </p>

                                    {result.note ? (
                                        <p className="mt-2 text-sm leading-7 opacity-80">
                                            {result.note}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[28rem]">
                                    {blocks.map((block) => (
                                        <div
                                            key={String(block.key)}
                                            className={cx(
                                                'rounded-xl border px-3 py-2 text-xs',
                                                block.is_available
                                                    ? 'border-emerald-200 bg-white/60 text-emerald-800 dark:border-emerald-400/20 dark:bg-white/7 dark:text-emerald-100'
                                                    : 'border-rose-200 bg-white/60 text-rose-800 dark:border-rose-400/20 dark:bg-white/7 dark:text-rose-100',
                                            )}
                                        >
                                            <p className="font-bold uppercase tracking-[0.14em]">
                                                {block.key} · {block.label}
                                            </p>
                                            <p className="mt-1 opacity-75">
                                                {block.from} – {block.to}
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {block.is_available ? 'Available' : block.reason || 'Unavailable'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {result.venue_capacity_message ? (
                                <div className="mt-3 flex items-start gap-2 rounded-xl border border-current/20 bg-white/45 p-3 text-sm dark:bg-white/7">
                                    <Users className="mt-0.5 h-4 w-4 shrink-0" />
                                    {result.venue_capacity_message}
                                </div>
                            ) : null}

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                {result.can_proceed !== false ? (
                                    <Link
                                        href={`/book?date=${encodeURIComponent(date)}&venue=${encodeURIComponent(venue)}&event_type=${encodeURIComponent(eventType)}&guests=${encodeURIComponent(guests)}`}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                    >
                                        Continue to Booking
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                ) : null}

                                <Link
                                    href={`/calendar?venue=${encodeURIComponent(venue)}`}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-current/20 bg-white/55 px-5 text-sm font-semibold transition hover:-translate-y-0.5 dark:bg-white/7"
                                >
                                    Open Full Calendar
                                </Link>
                            </div>
                        </article>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
