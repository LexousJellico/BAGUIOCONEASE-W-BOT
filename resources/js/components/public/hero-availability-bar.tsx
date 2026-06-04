import { BcccLogoLoader } from '@/components/shared/bccc-logo-loader';
import {
    addMonths,
    blockMeta,
    buildMonthWeeks,
    cx,
    dateKey,
    daysBetween,
    deriveDayStatus,
    formatRangeLabel,
    getPublicCalendarMonth,
    monthKeyFromDate,
    monthLabel,
    normalizeBlocks,
    normalizeStatus,
    postAvailabilityCheck,
    publicEventTypeOptions,
    rangeBookingHref,
    shortDate,
    statusDescription,
    statusDot,
    statusLabel,
    statusTone,
    todayKey,
    type AvailabilityRangeResponse,
    type AvailabilityStatus,
    type MonthPayload,
    type PublicDayStatus,
} from '@/lib/public-availability';
import type { VenueOption } from '@/types/public-content';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Clock3,
    LayoutGrid,
    LoaderCircle,
    Search,
    Sparkles,
    Users,
    X,
} from 'lucide-react';
import type { FormEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
    venueOptions: VenueOption[];
};

const ease = [0.22, 1, 0.36, 1] as const;

const blockOrderPreview = [
    { key: 'AM', display: blockMeta.AM.display },
    { key: 'PM', display: blockMeta.PM.display },
    { key: 'EVE', display: blockMeta.EVE.display },
];

const scheduleWeekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function asRangePayload(
    payload: unknown,
    form: {
        from: string;
        to: string;
        venue: string;
        eventType: string;
        guests: string;
    },
): AvailabilityRangeResponse {
    const raw = payload as Partial<AvailabilityRangeResponse> & Partial<PublicDayStatus>;

    if (Array.isArray(raw.results)) {
        return {
            mode: 'range',
            from: raw.from || form.from,
            to: raw.to || form.to,
            venue: raw.venue || form.venue,
            event_type: raw.event_type || form.eventType,
            guests: raw.guests || Number(form.guests),
            status: normalizeStatus(raw.status),
            title: raw.title || 'Availability checked',
            description: raw.description || 'The selected range was checked.',
            note: raw.note || raw.recommended_action || 'Review each day before continuing.',
            recommended_action: raw.recommended_action || null,
            can_proceed: raw.can_proceed !== false,
            days_count: raw.days_count || raw.results.length,
            available_days: raw.available_days,
            limited_days: raw.limited_days,
            blocked_days: raw.blocked_days,
            results: raw.results,
            event_titles: raw.event_titles || [],
            calendar_blocks: raw.calendar_blocks || [],
        };
    }

    const singleDay = payload as PublicDayStatus;
    const status = deriveDayStatus(singleDay);

    return {
        mode: 'range',
        from: singleDay.date || form.from,
        to: singleDay.date || form.to,
        date: singleDay.date || form.from,
        venue: singleDay.venue || form.venue,
        event_type: singleDay.event_type || form.eventType,
        guests: singleDay.guests || Number(form.guests),
        status,
        title: singleDay.title || statusLabel(status),
        description: singleDay.description || statusDescription(status),
        note: singleDay.note || 'Review the available time blocks before continuing.',
        recommended_action: singleDay.recommended_action || null,
        can_proceed: singleDay.can_proceed !== false,
        days_count: 1,
        available_days: status === 'available' ? 1 : 0,
        limited_days: status === 'limited' ? 1 : 0,
        blocked_days: status === 'blocked' || status === 'private_booked' ? 1 : 0,
        results: [singleDay],
        event_titles: singleDay.event_titles || [],
        calendar_blocks: singleDay.calendar_blocks || [],
    };
}

function useAvailabilityDockLayout() {
    const dockRef = useRef<HTMLElement | null>(null);

    return {
        dockRef,
    };
}

function FieldShell({
    label,
    icon,
    children,
    as = 'label',
}: {
    label: string;
    icon: ReactNode;
    children: ReactNode;
    as?: 'label' | 'div';
}) {
    const className = 'bccc-availability-control-shell group grid min-w-0 gap-0.5 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white/86 px-2.5 py-1.5 shadow-sm transition focus-within:border-[#b08d48] focus-within:ring-4 focus-within:ring-[#b08d48]/15 dark:border-white/10 dark:bg-white/[0.075]';
    const content = (
        <>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b672d] dark:text-[#f1d89b]">
                {icon}
                {label}
            </span>

            {children}
        </>
    );

    if (as === 'div') {
        return <div className={className}>{content}</div>;
    }

    return (
        <label className={className}>{content}</label>
    );
}

function isScheduleSelectable(key: string, day: PublicDayStatus | undefined) {
    const status = key < todayKey() ? 'past_unavailable' : deriveDayStatus(day);

    return !['past_unavailable', 'blocked', 'private_booked'].includes(status) && day?.can_proceed !== false;
}

function scheduleStatusClass(status: AvailabilityStatus | string) {
    const normalized = normalizeStatus(status);

    if (normalized === 'past_unavailable') return 'is-past';
    if (normalized === 'blocked' || normalized === 'private_booked') return 'is-closed';
    if (normalized === 'public_booked') return 'is-public';
    if (normalized === 'limited') return 'is-limited';

    return 'is-open';
}

function ResultStatusIcon({ status }: { status: AvailabilityStatus | string }) {
    const normalized = normalizeStatus(status);

    if (normalized === 'available') {
        return <CheckCircle2 className="h-5 w-5" />;
    }

    if (normalized === 'limited' || normalized === 'public_booked') {
        return <AlertTriangle className="h-5 w-5" />;
    }

    return <CircleAlert className="h-5 w-5" />;
}

function DayResultCard({ day }: { day: PublicDayStatus }) {
    const status = deriveDayStatus(day);
    const blocks = normalizeBlocks(day.blocks);

    const availableBlocks = blocks.filter((block) => block.is_available);
    const unavailableBlocks = blocks.filter((block) => !block.is_available);

    return (
        <article className="rounded-[1.2rem] border border-[#eadcc2]/80 bg-white/76 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.045]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        {day.date}
                    </p>

                    <h4 className="mt-1 text-lg font-semibold tracking-[-0.035em] text-[#21180d] dark:text-white">
                        {statusLabel(status)}
                    </h4>
                </div>

                <span className={cx('w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em]', statusDot(status))}>
                    {statusLabel(status)}
                </span>
            </div>

            {availableBlocks.length > 0 ? (
                <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                        Available time
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                        {availableBlocks.map((block) => (
                            <span
                                key={block.key}
                                className="inline-flex min-h-9 items-center gap-2 rounded-full bg-emerald-50 px-3 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-100 dark:ring-emerald-400/20"
                            >
                                {block.key} · {block.label}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="mt-4 rounded-[1rem] bg-rose-50 p-3 text-sm font-semibold leading-6 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-100 dark:ring-rose-400/20">
                    No available time block for this date.
                </p>
            )}

            {unavailableBlocks.length > 0 && availableBlocks.length > 0 ? (
                <p className="mt-3 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                    Some time blocks are already unavailable. You can still continue using the available time shown above.
                </p>
            ) : null}
        </article>
    );
}

function AvailabilityResultModal({
    open,
    loading,
    message,
    result,
    onClose,
}: {
    open: boolean;
    loading: boolean;
    message: string;
    result: AvailabilityRangeResponse | null;
    onClose: () => void;
}) {
    const reduceMotion = useReducedMotion();

    const normalized = result ? normalizeStatus(result.status) : 'limited';
    const canProceed = result?.can_proceed !== false && normalized !== 'blocked' && normalized !== 'private_booked';

    const resultTitle =
        normalized === 'available'
            ? 'Good news, this schedule is available.'
            : normalized === 'limited' || normalized === 'public_booked'
              ? 'Some time blocks are still available.'
              : 'This schedule is not available.';

    const resultMessage =
        normalized === 'available'
            ? 'You may continue with your booking request.'
            : normalized === 'limited' || normalized === 'public_booked'
              ? 'Please choose from the available time blocks shown below.'
              : 'Please choose another date, area, or check the full calendar.';

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/45 px-3 py-6 backdrop-blur-xl"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[1.7rem] border border-[#d9c7a6]/70 bg-[#f8f5ef] text-[#21180d] shadow-[0_30px_110px_rgba(0,0,0,0.32)] dark:border-white/10 dark:bg-[#101419] dark:text-white"
                        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 12, scale: 0.97, filter: 'blur(10px)' }}
                        transition={{ duration: 0.32, ease }}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[#eadcc2]/80 p-5 dark:border-white/10">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                    Availability Result
                                </p>

                                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                                    {loading ? 'Checking schedule...' : resultTitle}
                                </h3>

                                {result ? (
                                    <p className="mt-2 text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                        {formatRangeLabel(result.from, result.to)} · {result.venue}
                                    </p>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d9c7a6]/70 bg-white/80 text-[#2f2517] transition hover:bg-[#fffaf0] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                aria-label="Close availability result"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[calc(90vh-6rem)] overflow-y-auto p-5">
                            {loading ? (
                                <div className="grid min-h-[18rem] place-items-center text-center">
                                    <div>
                                        <BcccLogoLoader size="md" />

                                        <h4 className="mt-5 text-xl font-bold text-[#21180d] dark:text-white">
                                            Please wait
                                        </h4>

                                        <p className="mx-auto mt-2 max-w-[54ch] text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                            Checking the selected date and venue area.
                                        </p>
                                    </div>
                                </div>
                            ) : message && !result ? (
                                <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 p-5 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                                    <h4 className="text-lg font-bold">Unable to check availability</h4>
                                    <p className="mt-2 text-sm leading-6">{message}</p>
                                </div>
                            ) : result ? (
                                <div className="grid gap-5">
                                    <section
                                        className={cx(
                                            'rounded-[1.35rem] border p-5',
                                            normalized === 'available'
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100'
                                                : normalized === 'limited' || normalized === 'public_booked'
                                                  ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100'
                                                  : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100',
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <span className="mt-0.5">
                                                <ResultStatusIcon status={result.status} />
                                            </span>

                                            <div>
                                                <h4 className="text-xl font-bold">
                                                    {resultTitle}
                                                </h4>

                                                <p className="mt-2 text-sm leading-6">
                                                    {resultMessage}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                            Available Schedule
                                        </p>

                                        <div className="grid gap-3">
                                            {result.results.map((day) => (
                                                <DayResultCard key={day.date} day={day} />
                                            ))}
                                        </div>
                                    </section>

                                    <section className="rounded-[1.25rem] border border-[#eadcc2]/80 bg-white/76 p-5 dark:border-white/10 dark:bg-white/[0.045]">
                                        <p className="text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                            {canProceed
                                                ? 'Ready to continue? The booking form will use your selected date, area, event type, and guest count.'
                                                : 'Try another date or check the full calendar for open schedules.'}
                                        </p>

                                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                            {canProceed ? (
                                                <Link
                                                    href={rangeBookingHref({
                                                        from: result.from,
                                                        to: result.to,
                                                        venue: result.venue,
                                                        event_type: result.event_type,
                                                        guests: result.guests,
                                                    })}
                                                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-bold text-white transition hover:bg-[#4a3921] dark:bg-[#f1d89b] dark:text-[#17120b]"
                                                >
                                                    Continue to Booking
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            ) : null}

                                            <Link
                                                href="/calendar"
                                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-bold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white"
                                            >
                                                View Calendar
                                                <LayoutGrid className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </section>
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}


export default function HeroAvailabilityBar({ venueOptions }: Props) {
    const options = useMemo(() => (venueOptions.length > 0 ? venueOptions : []), [venueOptions]);
    const defaultVenue = options[0]?.value || '';

    const [dateFrom, setDateFrom] = useState(todayKey());
    const [dateTo, setDateTo] = useState(todayKey());
    const [eventType, setEventType] = useState('');
    const [venue, setVenue] = useState(defaultVenue);
    const [guests, setGuests] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [result, setResult] = useState<AvailabilityRangeResponse | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [scheduleMonth, setScheduleMonth] = useState(() => monthKeyFromDate(new Date()));
    const [scheduleMonthPayload, setScheduleMonthPayload] = useState<MonthPayload | null>(null);
    const [scheduleMonthLoading, setScheduleMonthLoading] = useState(false);
    const [scheduleMonthError, setScheduleMonthError] = useState('');
    const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
    const schedulePickerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setMounted(true);
        setCollapsed(window.localStorage.getItem('bccc.availabilityDock.collapsed') !== '0');
    }, []);

    function updateCollapsed(next: boolean) {
        setCollapsed(next);

        if (typeof window !== 'undefined') {
            window.localStorage.setItem('bccc.availabilityDock.collapsed', next ? '1' : '0');
        }
    }

    useEffect(() => {
        if (!scheduleOpen) {
            return;
        }

        if (!venue) {
            setScheduleMonthPayload(null);
            setScheduleMonthLoading(false);
            setScheduleMonthError('Select an area before choosing a schedule.');
            return;
        }

        let active = true;

        setScheduleMonthLoading(true);
        setScheduleMonthError('');

        getPublicCalendarMonth({ month: scheduleMonth, venue })
            .then((payload) => {
                if (!active) {
                    return;
                }

                setScheduleMonthPayload(payload);
            })
            .catch((error) => {
                if (!active) {
                    return;
                }

                setScheduleMonthPayload(null);
                setScheduleMonthError(error instanceof Error ? error.message : 'Unable to load these months.');
            })
            .finally(() => {
                if (active) {
                    setScheduleMonthLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [scheduleMonth, scheduleOpen, venue]);

    useEffect(() => {
        if (!scheduleOpen) {
            return;
        }

        const handleOutsidePress = (event: globalThis.MouseEvent | TouchEvent) => {
            const target = event.target;

            if (!(target instanceof Node) || schedulePickerRef.current?.contains(target)) {
                return;
            }

            setScheduleOpen(false);
            setRangeAnchor(null);
        };

        document.addEventListener('mousedown', handleOutsidePress);
        document.addEventListener('touchstart', handleOutsidePress, { passive: true });

        return () => {
            document.removeEventListener('mousedown', handleOutsidePress);
            document.removeEventListener('touchstart', handleOutsidePress);
        };
    }, [scheduleOpen]);

    const { dockRef } = useAvailabilityDockLayout();

    const selectedVenue = useMemo(
        () => options.find((item) => item.value === venue) ?? null,
        [venue, options],
    );

    const scheduleDaysByDate = useMemo(() => {
        const index: Record<string, PublicDayStatus> = {};

        (scheduleMonthPayload?.days ?? []).forEach((day) => {
            index[day.date] = day;
        });

        return index;
    }, [scheduleMonthPayload]);

    function openSchedulePicker() {
        const seed = dateFrom || todayKey();

        setScheduleMonth(monthKeyFromDate(new Date(`${seed}T00:00:00`)));
        setRangeAnchor(dateFrom && dateFrom === dateTo ? dateFrom : null);
        setScheduleOpen((current) => !current);
    }

    function pickScheduleDate(key: string, forceSingleDay = false) {
        const day = scheduleDaysByDate[key];

        if (!isScheduleSelectable(key, day)) {
            return;
        }

        if (forceSingleDay || !rangeAnchor || (dateFrom && dateTo && dateFrom !== dateTo)) {
            setRangeAnchor(forceSingleDay ? null : key);
            setDateFrom(key);
            setDateTo(key);
            setValidationMessage('');

            return;
        }

        const from = key < rangeAnchor ? key : rangeAnchor;
        const to = key < rangeAnchor ? rangeAnchor : key;

        setDateFrom(from);
        setDateTo(to);
        setRangeAnchor(null);
        setValidationMessage('');
    }

    function renderScheduleMonth(month: string) {
        const weeks = buildMonthWeeks(month);

        return (
            <section className="bccc-availability-calendar-month" key={month}>
                <h4 className="bccc-availability-calendar-month-title">{monthLabel(month)}</h4>

                <div className="bccc-availability-calendar-weekdays">
                    {scheduleWeekdays.map((day, index) => (
                        <span key={`${month}-${day}-${index}`}>{day}</span>
                    ))}
                </div>

                <div className="bccc-availability-calendar-grid">
                    {weeks.flat().map((day) => {
                        const key = dateKey(day);
                        const inMonth = key.startsWith(month);
                        const entry = scheduleDaysByDate[key];
                        const status = key < todayKey() ? 'past_unavailable' : deriveDayStatus(entry);
                        const selectedStart = key === dateFrom;
                        const selectedEnd = key === dateTo && dateTo !== dateFrom;
                        const inRange = dateFrom !== dateTo && key >= dateFrom && key <= dateTo;
                        const selectable = inMonth && !scheduleMonthLoading && isScheduleSelectable(key, entry);

                        return (
                            <button
                                key={key}
                                type="button"
                                disabled={!selectable}
                                onClick={() => pickScheduleDate(key)}
                                onDoubleClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                                    event.preventDefault();
                                    pickScheduleDate(key, true);
                                }}
                                className={cx(
                                    'bccc-availability-date-button',
                                    scheduleStatusClass(status),
                                    selectedStart && 'is-start',
                                    selectedEnd && 'is-end',
                                    inRange && 'is-range',
                                    !inMonth && 'is-outside-month',
                                )}
                                title={`${shortDate(key)} - ${statusLabel(status)}`}
                            >
                                <span>{day.getDate()}</span>
                                <span className={cx('bccc-availability-date-dot', statusDot(status))} />
                            </button>
                        );
                    })}
                </div>
            </section>
        );
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!dateFrom || !dateTo || !eventType || !venue || !guests) {
            setValidationMessage('Please complete the date range, event type, area, and guest count.');
            return;
        }

        if (dateFrom > dateTo) {
            setValidationMessage('The end date must be the same as or later than the start date.');
            return;
        }

        const days = daysBetween(dateFrom, dateTo);

        if (days < 1) {
            setValidationMessage('Please select a valid date range.');
            return;
        }

        if (days > 14) {
            setValidationMessage('Please keep the quick-check range to 14 days or fewer.');
            return;
        }

        setLoading(true);
        setModalOpen(true);
        setResult(null);
        setValidationMessage('');
        setModalMessage('Checking selected date range and area...');

        try {
            const payload = await postAvailabilityCheck({
                date: dateFrom,
                start_date: dateFrom,
                end_date: dateTo,
                date_from: dateFrom,
                date_to: dateTo,
                venue,
                event_type: eventType,
                guests: Number(guests),
            });

            setResult(
                asRangePayload(payload, {
                    from: dateFrom,
                    to: dateTo,
                    venue,
                    eventType,
                    guests,
                }),
            );

            setModalMessage('');
        } catch (error) {
            setModalMessage(error instanceof Error ? error.message : 'Unable to check availability right now.');
        } finally {
            setLoading(false);
        }
    }

    const dockMarkup = (
        <>
            <AnimatePresence initial={false}>
                {!collapsed ? (
                    <motion.section
                        key="availability-dock"
                        ref={dockRef}
                        className="bccc-availability-dock fixed inset-x-0 z-[8500] w-screen px-0"
                        initial={{ y: 28, opacity: 0, filter: 'blur(10px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        exit={{ y: 24, opacity: 0, filter: 'blur(8px)' }}
                        transition={{ duration: 0.34, ease }}
                        aria-label="Sticky availability checker"
                    >
                        <div className={cx('bccc-availability-dock-panel relative w-full rounded-none border-y border-[#d9c7a6]/80 bg-[#fffaf0]/96 p-1.5 shadow-[0_-12px_60px_rgba(47,37,23,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101419]/96', scheduleOpen && 'bccc-availability-dock-panel--calendar-open')}>
                            <button
                                type="button"
                                onClick={() => updateCollapsed(true)}
                                className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-[#d9c7a6]/70 bg-white/90 text-[#6e604c] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#2f2517] hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white dark:hover:text-[#17120b]"
                                aria-label="Hide availability checker"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <form
                                onSubmit={handleSubmit}
                                className="bccc-availability-form mx-auto grid w-full max-w-[1800px] gap-1.5 px-3 pr-12 sm:px-4 sm:pr-14 lg:grid-cols-[1.5fr_1.1fr_1.1fr_0.85fr_auto] lg:px-6 lg:pr-16"
                            >
                                <div ref={schedulePickerRef} className="bccc-availability-schedule-picker">
                                    <FieldShell as="div" label="Schedule" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                                        <button
                                            type="button"
                                            onClick={openSchedulePicker}
                                            className="flex h-7 w-full min-w-0 items-center justify-between gap-2 bg-transparent text-left text-sm font-semibold text-[#2f2517] outline-none transition hover:text-[#164734] dark:text-white dark:hover:text-[#f1d89b]"
                                            aria-expanded={scheduleOpen}
                                            aria-haspopup="dialog"
                                        >
                                            <span className="min-w-0 truncate">{formatRangeLabel(dateFrom, dateTo)}</span>
                                            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />
                                        </button>
                                    </FieldShell>

                                    {scheduleOpen ? (
                                        <div className="bccc-availability-calendar-popover" role="dialog" aria-label="Select availability schedule">
                                            <div className="bccc-availability-calendar-head">
                                                <button
                                                    type="button"
                                                    onClick={() => setScheduleMonth((current) => addMonths(current, -1))}
                                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d9c7a6]/70 bg-white text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                                    aria-label="Previous month"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </button>

                                                <div className="min-w-0 text-center">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                                        Availability Calendar
                                                    </p>
                                                    <h3 className="truncate text-sm font-bold text-[#21180d] dark:text-white">
                                                        {formatRangeLabel(dateFrom, dateTo)}
                                                    </h3>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setScheduleMonth((current) => addMonths(current, 1))}
                                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d9c7a6]/70 bg-white text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                                    aria-label="Next month"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="bccc-availability-calendar-months">
                                                {renderScheduleMonth(scheduleMonth)}
                                            </div>

                                            <div className="bccc-availability-calendar-foot">
                                                <span className="min-w-0 truncate text-xs font-semibold text-[#6e604c] dark:text-white/58">
                                                    {rangeAnchor ? `Start: ${shortDate(rangeAnchor)}` : formatRangeLabel(dateFrom, dateTo)}
                                                </span>

                                                <span className={cx('inline-flex w-fit shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]', statusTone(deriveDayStatus(scheduleDaysByDate[dateFrom])))}>
                                                    {statusLabel(deriveDayStatus(scheduleDaysByDate[dateFrom]))}
                                                </span>
                                            </div>

                                            {scheduleMonthLoading ? (
                                                <div className="bccc-availability-calendar-overlay">
                                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                                </div>
                                            ) : null}

                                            {scheduleMonthError ? (
                                                <p className="mt-2 rounded-[0.85rem] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                                                    {scheduleMonthError}
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>

                                <FieldShell label="Event Type" icon={<Sparkles className="h-3.5 w-3.5" />}>
                                    <select
                                        value={eventType}
                                        onChange={(event) => setEventType(event.target.value)}
                                        className="h-7 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none dark:text-white"
                                    >
                                        <option value="">Select type</option>
                                        {publicEventTypeOptions.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </FieldShell>

                                <FieldShell label="Area" icon={<LayoutGrid className="h-3.5 w-3.5" />}>
                                    <select
                                        value={venue}
                                        onChange={(event) => setVenue(event.target.value)}
                                        className="h-7 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none dark:text-white"
                                    >
                                        <option value="">Select area</option>
                                        {options.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </FieldShell>

                                <FieldShell label="Guests" icon={<Users className="h-3.5 w-3.5" />}>
                                    <input
                                        type="number"
                                        min="1"
                                        value={guests}
                                        onChange={(event) => setGuests(event.target.value)}
                                        placeholder="Estimated"
                                        className="h-7 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none placeholder:text-[#85755d] dark:text-white dark:placeholder:text-white/42"
                                    />
                                </FieldShell>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex min-h-[3.35rem] items-center justify-center gap-2 rounded-[0.95rem] bg-[#2f2517] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_16px_40px_rgba(47,37,23,0.20)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] disabled:cursor-not-allowed disabled:opacity-65 dark:bg-[#f1d89b] dark:text-[#17120b]"
                                >
                                    {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    {loading ? 'Checking' : 'Check'}
                                </button>

                            </form>

                            <div className="mx-auto mt-1.5 flex w-full max-w-[1800px] flex-col gap-1.5 px-3 text-[11px] sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                                <div className="min-w-0 leading-5 text-[#6e604c] dark:text-white/56">
                                    {selectedVenue ? (
                                        <>
                                            <span className="font-bold text-[#2f2517] dark:text-white">{selectedVenue.label}</span>
                                            {selectedVenue.category ? ` • ${selectedVenue.category}` : ''}
                                            {selectedVenue.capacity ? ` • Capacity: ${selectedVenue.capacity}` : ''}
                                        </>
                                    ) : (
                                        'Select a venue area to begin checking availability.'
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {blockOrderPreview.map((item) => (
                                        <span
                                            key={item.key}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-[#d9c7a6]/70 bg-white/70 px-2 py-0.5 text-[10px] font-bold text-[#6e604c] dark:border-white/10 dark:bg-white/7 dark:text-white/56"
                                        >
                                            <Clock3 className="h-3 w-3 text-[#9d7b3d] dark:text-[#f1d89b]" />
                                            {item.key} {item.display}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {validationMessage ? (
                                <div className="mx-auto mt-2 max-w-[1800px] rounded-[0.9rem] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                                    {validationMessage}
                                </div>
                            ) : null}
                        </div>
                    </motion.section>
                ) : (
                    <motion.button
                        key="availability-icon"
                        type="button"
                        onClick={() => updateCollapsed(false)}
                        className="bccc-availability-collapsed-toggle fixed bottom-5 right-4 z-[99960] grid h-14 w-14 place-items-center rounded-full border border-[#b08d48]/35 bg-[#145f52] text-white shadow-[0_24px_70px_rgba(20,95,82,0.30)] transition hover:-translate-y-1 hover:bg-[#1d7566] sm:right-6"
                        initial={{ opacity: 0, y: 14, scale: 0.94, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 14, scale: 0.94, filter: 'blur(8px)' }}
                        transition={{ duration: 0.28, ease }}
                        aria-label="Show availability checker"
                    >
                        <CalendarDays className="h-5 w-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AvailabilityResultModal
                open={modalOpen}
                loading={loading}
                message={modalMessage}
                result={result}
                onClose={() => setModalOpen(false)}
            />
        </>
    );

    if (!mounted) {
        return null;
    }

    return createPortal(dockMarkup, document.body);
}
