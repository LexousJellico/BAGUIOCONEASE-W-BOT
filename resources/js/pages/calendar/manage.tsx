import {
    CalendarBlockModal,
    type BlockKey,
    type CalendarBlockFormState,
} from '@/components/calendar/calendar-block-modal';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import {
    BLOCK_KEYS,
    BLOCK_META,
    buildMonthWeeks,
    dateKey,
    deriveDayStatus,
    eventEndsOnDate,
    eventSpansDate,
    eventStartsOnDate,
    longDate,
    monthLabel,
    monthToDate,
    normalizeEventRange,
    scheduleStatusLabel,
    shiftMonth,
} from '@/lib/unified-schedule';
import { cn } from '@/lib/utils';
import {
    canManageCalendarBlocks,
    type WorkspaceAuthLike,
} from '@/lib/workspace';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Edit3,
    Eye,
    Info,
    Layers3,
    Loader2,
    MapPin,
    Plus,
    ShieldAlert,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
    kind: 'booking' | 'block' | 'public_event';
    title: string;
    start: string;
    end: string;
    status?: string | null;
    payment_status?: string | null;
    area?: string | null;
    block?: string | null;
    block_id?: number;
    public_status?: string | null;
    note?: string | null;
    client_name?: string | null;
    client_email?: string | null;
    company_name?: string | null;
    guest_count?: number | null;
    summary?: string | null;
    description?: string | null;
    time?: string | null;
    image?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
};

type HighlightItem = {
    id: number;
    scope: 'bccc' | 'city';
    title: string;
    venue: string;
    date: string;
    time: string;
    summary: string;
    description: string;
    image: string;
};

type Props = {
    month: string;
    monthAvailability: Record<string, DayAvailability>;
    events: CalendarEvent[];
    highlights: {
        bccc: HighlightItem[];
        city: HighlightItem[];
    };
    areaOptions: string[];
};

type WeekCell = Date | null;

type EventLaneSegment = {
    event: CalendarEvent;
    startCol: number;
    endCol: number;
    isStart: boolean;
    isEnd: boolean;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pageCsrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || ''
    );
}

async function sendJson(
    url: string,
    method: 'POST' | 'PUT' | 'DELETE',
    payload?: Record<string, unknown>,
) {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': pageCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: method === 'DELETE' ? undefined : JSON.stringify(payload ?? {}),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            (json as { message?: string })?.message || 'Request failed.',
        );
    }

    return json;
}

function eventDurationDays(event: CalendarEvent) {
    const { startDate, endDate } = normalizeEventRange(event);

    if (!startDate || !endDate) return 1;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000);

    return Math.max(diff + 1, 1);
}

function eventSortValue(event: CalendarEvent) {
    if (event.kind === 'booking') return 0;
    if (event.kind === 'public_event') return 1;
    if (event.kind === 'block') return 2;

    return 9;
}

function buildWeekLanes(week: WeekCell[], events: CalendarEvent[]) {
    const weekKeys = week.map((cell) => (cell ? dateKey(cell) : null));

    const visibleEvents = events
        .filter((event) =>
            weekKeys.some((key) => key && eventSpansDate(event, key)),
        )
        .sort((a, b) => {
            const aRange = normalizeEventRange(a);
            const bRange = normalizeEventRange(b);

            if (aRange.startDate !== bRange.startDate) {
                return aRange.startDate.localeCompare(bRange.startDate);
            }

            if (eventDurationDays(a) !== eventDurationDays(b)) {
                return eventDurationDays(b) - eventDurationDays(a);
            }

            return eventSortValue(a) - eventSortValue(b);
        });

    const lanes: EventLaneSegment[][] = [];

    visibleEvents.forEach((event) => {
        let startCol = -1;
        let endCol = -1;

        weekKeys.forEach((key, index) => {
            if (key && eventSpansDate(event, key)) {
                if (startCol === -1) startCol = index;
                endCol = index;
            }
        });

        if (startCol === -1 || endCol === -1) return;

        const segment: EventLaneSegment = {
            event,
            startCol,
            endCol,
            isStart: Boolean(
                weekKeys[startCol] &&
                    eventStartsOnDate(event, weekKeys[startCol] as string),
            ),
            isEnd: Boolean(
                weekKeys[endCol] &&
                    eventEndsOnDate(event, weekKeys[endCol] as string),
            ),
        };

        let placed = false;

        for (const lane of lanes) {
            const overlaps = lane.some(
                (existing) =>
                    !(
                        segment.endCol < existing.startCol ||
                        segment.startCol > existing.endCol
                    ),
            );

            if (!overlaps) {
                lane.push(segment);
                placed = true;
                break;
            }
        }

        if (!placed) {
            lanes.push([segment]);
        }
    });

    return lanes;
}

function eventBarClass(event: CalendarEvent) {
    const normalizedStatus = String(event.status ?? '').toLowerCase();

    if (event.kind === 'block' || normalizedStatus === 'blocked') {
        return 'alh-cal-event is-block';
    }

    if (event.kind === 'public_event' || normalizedStatus === 'public_booked') {
        return 'alh-cal-event is-public';
    }

    if (
        ['private_booked', 'confirmed', 'active', 'completed'].includes(
            normalizedStatus,
        )
    ) {
        return 'alh-cal-event is-booked';
    }

    if (normalizedStatus === 'pending') {
        return 'alh-cal-event is-pending';
    }

    return 'alh-cal-event is-neutral';
}

function statusChipClass(status?: string | null) {
    const normalized = String(status ?? '').toLowerCase();

    if (
        ['confirmed', 'active', 'completed', 'paid', 'verified'].includes(
            normalized,
        )
    ) {
        return 'alh-status-chip is-good';
    }

    if (
        [
            'pending',
            'partial',
            'unpaid',
            'pencil_booked',
            'for_review',
        ].includes(normalized)
    ) {
        return 'alh-status-chip is-warn';
    }

    if (
        ['blocked', 'cancelled', 'declined', 'failed', 'rejected'].includes(
            normalized,
        )
    ) {
        return 'alh-status-chip is-bad';
    }

    if (['public_booked', 'public_event', 'blue'].includes(normalized)) {
        return 'alh-status-chip is-public';
    }

    return 'alh-status-chip';
}

function cleanLabel(value?: string | null) {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pickInitialDate(
    month: string,
    monthAvailability: Props['monthAvailability'],
    events: CalendarEvent[],
) {
    const today = dateKey(new Date());

    if (
        today.startsWith(month) &&
        (monthAvailability[today] ||
            events.some((event) => eventSpansDate(event, today)))
    ) {
        return today;
    }

    const first = Object.keys(monthAvailability).sort()[0];

    if (first) return first;

    const eventDate = events
        .map((event) => normalizeEventRange(event).startDate)
        .find(Boolean);

    return eventDate || `${month}-01`;
}

function monthHref(month: string) {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    params.set('month', month);

    return `${path}?${params.toString()}`;
}

function selectedDateEvents(events: CalendarEvent[], selectedDate: string) {
    return events.filter((event) => eventSpansDate(event, selectedDate));
}

function availabilityLabel(availability?: DayAvailability) {
    if (!availability) return 'No calendar data';

    if (availability.is_fully_booked) return 'Fully booked';

    const openCount = BLOCK_KEYS.filter((block) => availability[block]).length;

    if (openCount === 3) return 'Available';
    if (openCount > 0) return 'Limited';

    return scheduleStatusLabel(availability.day_status);
}

function availabilityCardClass(
    availability?: DayAvailability,
    selected = false,
) {
    const classes = ['alh-cal-day'];

    if (selected) classes.push('is-selected');

    if (!availability) {
        classes.push('is-empty-state');
        return classes.join(' ');
    }

    if (availability.is_fully_booked) {
        classes.push('is-full');
        return classes.join(' ');
    }

    const openCount = BLOCK_KEYS.filter((block) => availability[block]).length;

    if (openCount === 3) classes.push('is-available');
    else if (openCount > 0) classes.push('is-limited');
    else classes.push('is-full');

    return classes.join(' ');
}

function eventSecondaryText(event: CalendarEvent) {
    if (event.kind === 'booking') {
        return (
            event.company_name ||
            event.client_name ||
            event.area ||
            'Booking record'
        );
    }

    if (event.kind === 'public_event') {
        return event.area || event.time || 'Public event';
    }

    return event.area || event.note || 'Internal block';
}

function bookingShowHref(event: CalendarEvent) {
    if (event.kind !== 'booking') return '';

    if (window.location.pathname.startsWith('/manager')) {
        return `/manager/bookings/${event.id}`;
    }

    if (window.location.pathname.startsWith('/staff')) {
        return `/staff/bookings/${event.id}`;
    }

    return `/admin/bookings/${event.id}`;
}

function bookingCreateHref(selectedDate: string) {
    const params = new URLSearchParams({
        date: selectedDate,
        start: '06:00',
        end: '12:00',
    });

    if (window.location.pathname.startsWith('/staff')) {
        return `/staff/bookings/create?${params.toString()}`;
    }

    if (window.location.pathname.startsWith('/admin')) {
        return `/admin/bookings/create?${params.toString()}`;
    }

    return `/book?${params.toString()}`;
}

function calendarIndexHref() {
    if (window.location.pathname.startsWith('/manager')) {
        return '/manager/calendar';
    }

    if (window.location.pathname.startsWith('/staff')) {
        return '/staff/calendar';
    }

    if (window.location.pathname.startsWith('/admin')) {
        return '/admin/calendar';
    }

    return '/calendar';
}

function analyticsHref() {
    if (window.location.pathname.startsWith('/manager')) {
        return '/manager/calendar/analytics';
    }

    if (window.location.pathname.startsWith('/admin')) {
        return '/admin/calendar/analytics';
    }

    return '/calendar/analytics';
}

function pageTitle() {
    if (window.location.pathname.startsWith('/manager')) {
        return 'Manager Calendar Management';
    }

    if (window.location.pathname.startsWith('/admin')) {
        return 'Admin Calendar Management';
    }

    return 'Calendar Management';
}

export default function CalendarManage({
    month,
    monthAvailability,
    events = [],
    highlights = { bccc: [], city: [] },
    areaOptions = [],
}: Props) {
    const { props } = usePage<{ auth?: WorkspaceAuthLike }>();
    const canManageBlocks = canManageCalendarBlocks(props.auth);

    const [selectedDate, setSelectedDate] = useState(() =>
        pickInitialDate(month, monthAvailability, events),
    );
    const [activeHighlightTab, setActiveHighlightTab] = useState<
        'bccc' | 'city'
    >('bccc');
    const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const initialDate = pickInitialDate(month, monthAvailability, events);

    const [form, setForm] = useState<CalendarBlockFormState>({
        title: 'Internal calendar note',
        area: '',
        notes: '',
        block: 'AM',
        public_status: 'red',
        date_from: initialDate,
        date_to: initialDate,
    });

    const holdTimerRef = useRef<number | null>(null);
    const holdTriggeredRef = useRef(false);

    const weeks = useMemo(() => buildMonthWeeks(month), [month]);

    const selectedEvents = useMemo(
        () => selectedDateEvents(events, selectedDate),
        [events, selectedDate],
    );

    const selectedBlocks = selectedEvents.filter(
        (event) => event.kind === 'block',
    );
    const selectedBookings = selectedEvents.filter(
        (event) => event.kind === 'booking',
    );
    const selectedPublicEvents = selectedEvents.filter(
        (event) => event.kind === 'public_event',
    );

    const selectedAvailability = monthAvailability[selectedDate];

    const selectedDerivedStatus = deriveDayStatus({
        availability: selectedAvailability,
        events: selectedEvents,
        isClient: false,
    });

    const activeHighlights =
        activeHighlightTab === 'bccc' ? highlights.bccc : highlights.city;

    const activeHighlight = activeHighlights[activeHighlightIndex] || null;

    useEffect(() => {
        setSelectedDate(pickInitialDate(month, monthAvailability, events));
    }, [month, monthAvailability, events]);

    useEffect(() => {
        setForm((current) => ({
            ...current,
            date_from: selectedDate,
            date_to: selectedDate,
        }));
    }, [selectedDate]);

    useEffect(() => {
        setActiveHighlightIndex(0);
    }, [activeHighlightTab]);

    useEffect(() => {
        return () => {
            if (holdTimerRef.current) {
                window.clearTimeout(holdTimerRef.current);
            }
        };
    }, []);

    function openCreate(dateValue: string) {
        if (!canManageBlocks) return;

        setEditorMode('create');
        setError('');
        setForm({
            title: 'Internal calendar note',
            area: '',
            notes: '',
            block: 'AM',
            public_status: 'red',
            date_from: dateValue,
            date_to: dateValue,
        });
        setEditorOpen(true);
    }

    function openEdit(event: CalendarEvent) {
        if (!canManageBlocks) return;

        const range = normalizeEventRange(event);

        setEditorMode('edit');
        setError('');
        setForm({
            title: event.title.replace(/^BLOCK:\s*/i, ''),
            area: event.area || '',
            notes: event.note || '',
            block: String(event.block || 'AM').toUpperCase() as BlockKey,
            public_status: String(
                event.public_status || 'red',
            ).toLowerCase() as CalendarBlockFormState['public_status'],
            date_from:
                event.dateFrom ||
                range.startDate ||
                String(event.start).slice(0, 10),
            date_to:
                event.dateTo || range.endDate || String(event.end).slice(0, 10),
            block_id: event.block_id,
        });
        setEditorOpen(true);
    }

    function startPress(dateValue: string) {
        if (!canManageBlocks) return;

        if (holdTimerRef.current) {
            window.clearTimeout(holdTimerRef.current);
        }

        holdTriggeredRef.current = false;

        holdTimerRef.current = window.setTimeout(() => {
            holdTriggeredRef.current = true;
            openCreate(dateValue);
        }, 650);
    }

    function clearPress() {
        if (holdTimerRef.current) {
            window.clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }

        holdTriggeredRef.current = false;
    }

    function endPress(dateValue: string) {
        const wasLongPress = holdTriggeredRef.current;

        if (holdTimerRef.current) {
            window.clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }

        if (!wasLongPress) {
            setSelectedDate(dateValue);
        }

        window.setTimeout(() => {
            holdTriggeredRef.current = false;
        }, 0);
    }

    async function saveForm() {
        if (!canManageBlocks) return;

        setBusy(true);
        setError('');

        try {
            if (!form.title.trim()) {
                throw new Error('Please enter a title for the calendar rule.');
            }

            if (!form.date_from || !form.date_to) {
                throw new Error('Please select the start and end date.');
            }

            const payload = {
                title: form.title.trim(),
                area: form.area.trim(),
                notes: form.notes.trim(),
                block: form.block,
                public_status: form.public_status,
                date_from: form.date_from,
                date_to: form.date_to,
            };

            if (editorMode === 'edit' && form.block_id) {
                await sendJson(
                    `/calendar-blocks/${form.block_id}`,
                    'PUT',
                    payload,
                );
            } else {
                await sendJson('/calendar-blocks', 'POST', payload);
            }

            setEditorOpen(false);

            router.visit(window.location.href, {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            });
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : 'Unable to save calendar rule.',
            );
        } finally {
            setBusy(false);
        }
    }

    async function deleteBlock(event: CalendarEvent) {
        if (!canManageBlocks || !event.block_id) return;

        if (!window.confirm(`Delete "${event.title}" from the calendar?`)) {
            return;
        }

        setBusy(true);

        try {
            await sendJson(`/calendar-blocks/${event.block_id}`, 'DELETE');

            router.visit(window.location.href, {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            });
        } catch (exception) {
            window.alert(
                exception instanceof Error
                    ? exception.message
                    : 'Unable to delete calendar block.',
            );
        } finally {
            setBusy(false);
        }
    }

    const currentMonthDate = monthToDate(month);
    const previousMonth = shiftMonth(month, -1);
    const nextMonth = shiftMonth(month, 1);

    const selectedStatusLabel = scheduleStatusLabel(selectedDerivedStatus);

    const breadcrumbs = [
        {
            title: 'Calendar',
            href: calendarIndexHref(),
        },
        {
            title: 'Manage',
            href: window.location.pathname,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle()} />

            <CalendarBlockModal
                open={editorOpen}
                title={
                    editorMode === 'edit'
                        ? 'Edit calendar rule'
                        : 'Create calendar rule'
                }
                form={form}
                areaOptions={areaOptions}
                busy={busy}
                error={error}
                helperText="Use this for maintenance, reserved dates, internal closures, city activities, or other non-booking calendar rules."
                saveLabel={editorMode === 'edit' ? 'Update rule' : 'Save rule'}
                onChange={(patch) =>
                    setForm((current) => ({ ...current, ...patch }))
                }
                onClose={() => setEditorOpen(false)}
                onSave={saveForm}
            />

            <div className="backend-admin-page space-y-5">
                <section className="alh-calendar-admin-hero">
                    <div>
                        <p className="backend-booking-label">
                            Calendar Management Center
                        </p>
                        <h1>Manage bookings, blocks, and public schedules.</h1>
                        <span>
                            Click a date to inspect it. Hold a date for a quick
                            calendar block. Event bars show bookings, public
                            events, and internal blocks without crowding the
                            whole page.
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {canManageBlocks ? (
                            <Button
                                type="button"
                                onClick={() => openCreate(selectedDate)}
                                className="h-10 rounded-lg bg-[#20242b] px-4 text-sm font-semibold text-white hover:bg-[#14181d] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New Rule
                            </Button>
                        ) : null}

                        <Button
                            asChild
                            variant="outline"
                            className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            <Link href={calendarIndexHref()}>
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Calendar View
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            <Link href={analyticsHref()}>
                                <Eye className="mr-2 h-4 w-4" />
                                Analytics
                            </Link>
                        </Button>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Selected Date</p>
                        <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">
                            {longDate(selectedDate)}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            {availabilityLabel(selectedAvailability)}
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Bookings</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {selectedBookings.length}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Booking records on selected date.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Blocks</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {selectedBlocks.length}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Internal unavailable rules.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Public Events</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {selectedPublicEvents.length}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Public activities on selected date.
                        </p>
                    </article>
                </section>

                <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
                    <main className="alh-admin-panel overflow-hidden">
                        <div className="alh-admin-panel-header flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <p className="backend-booking-label">
                                    Month Board
                                </p>
                                <h2 className="mt-2 text-3xl font-black tracking-[-0.055em] text-slate-950 dark:text-white">
                                    {monthLabel(currentMonthDate)}
                                </h2>
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Horizontal event bars connect records across
                                    days. Mobile hides bars and keeps the
                                    selected-day panel readable.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={monthHref(previousMonth)}
                                    className="alh-admin-neutral-button min-h-10"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Link>

                                <Link
                                    href={monthHref(
                                        dateKey(new Date()).slice(0, 7),
                                    )}
                                    className="alh-admin-neutral-button min-h-10"
                                >
                                    Today
                                </Link>

                                <Link
                                    href={monthHref(nextMonth)}
                                    className="alh-admin-neutral-button min-h-10"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        <div className="alh-cal-weekdays">
                            {weekdayLabels.map((label) => (
                                <div key={label}>{label}</div>
                            ))}
                        </div>

                        <div>
                            {weeks.map((week, weekIndex) => {
                                const lanes = buildWeekLanes(week, events);

                                return (
                                    <div
                                        key={`week-${weekIndex}`}
                                        className="alh-cal-week"
                                    >
                                        <div className="grid grid-cols-7">
                                            {week.map((day, dayIndex) => {
                                                if (!day) {
                                                    return (
                                                        <div
                                                            key={`blank-${weekIndex}-${dayIndex}`}
                                                            className="alh-cal-day is-blank"
                                                        />
                                                    );
                                                }

                                                const currentDateKey =
                                                    dateKey(day);
                                                const availability =
                                                    monthAvailability[
                                                        currentDateKey
                                                    ];
                                                const isSelected =
                                                    currentDateKey ===
                                                    selectedDate;
                                                const isToday =
                                                    currentDateKey ===
                                                    dateKey(new Date());

                                                return (
                                                    <button
                                                        key={currentDateKey}
                                                        type="button"
                                                        onMouseDown={() =>
                                                            startPress(
                                                                currentDateKey,
                                                            )
                                                        }
                                                        onMouseUp={() =>
                                                            endPress(
                                                                currentDateKey,
                                                            )
                                                        }
                                                        onMouseLeave={
                                                            clearPress
                                                        }
                                                        onTouchStart={() =>
                                                            startPress(
                                                                currentDateKey,
                                                            )
                                                        }
                                                        onTouchEnd={() =>
                                                            endPress(
                                                                currentDateKey,
                                                            )
                                                        }
                                                        className={availabilityCardClass(
                                                            availability,
                                                            isSelected,
                                                        )}
                                                        title={`${longDate(currentDateKey)} · ${availabilityLabel(availability)}`}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'alh-cal-number',
                                                                isToday &&
                                                                    'is-today',
                                                            )}
                                                        >
                                                            {day.getDate()}
                                                        </span>

                                                        <span className="mt-auto grid gap-1">
                                                            {BLOCK_KEYS.map(
                                                                (block) => (
                                                                    <span
                                                                        key={`${currentDateKey}-${block}`}
                                                                        className={
                                                                            availability?.[
                                                                                block
                                                                            ]
                                                                                ? 'alh-cal-block-dot is-open'
                                                                                : 'alh-cal-block-dot is-closed'
                                                                        }
                                                                        title={`${BLOCK_META[block].label}: ${
                                                                            availability?.[
                                                                                block
                                                                            ]
                                                                                ? 'Open'
                                                                                : 'Unavailable'
                                                                        }`}
                                                                    />
                                                                ),
                                                            )}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {lanes.length > 0 ? (
                                            <div className="alh-cal-lanes">
                                                {lanes
                                                    .slice(0, 4)
                                                    .map((lane, laneIndex) => (
                                                        <div
                                                            key={`lane-${weekIndex}-${laneIndex}`}
                                                            className="alh-cal-lane"
                                                        >
                                                            {lane.map(
                                                                (segment) => (
                                                                    <button
                                                                        key={`${segment.event.kind}-${segment.event.id}-${segment.startCol}-${segment.endCol}`}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const range =
                                                                                normalizeEventRange(
                                                                                    segment.event,
                                                                                );

                                                                            if (
                                                                                range.startDate
                                                                            ) {
                                                                                setSelectedDate(
                                                                                    range.startDate,
                                                                                );
                                                                            }

                                                                            if (
                                                                                segment
                                                                                    .event
                                                                                    .kind ===
                                                                                'block'
                                                                            ) {
                                                                                openEdit(
                                                                                    segment.event,
                                                                                );
                                                                            }
                                                                        }}
                                                                        className={eventBarClass(
                                                                            segment.event,
                                                                        )}
                                                                        style={{
                                                                            gridColumnStart:
                                                                                segment.startCol +
                                                                                1,
                                                                            gridColumnEnd:
                                                                                segment.endCol +
                                                                                2,
                                                                        }}
                                                                        title={
                                                                            segment
                                                                                .event
                                                                                .title
                                                                        }
                                                                    >
                                                                        <span>
                                                                            {
                                                                                segment
                                                                                    .event
                                                                                    .title
                                                                            }
                                                                        </span>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </main>

                    <aside className="space-y-5">
                        <section className="alh-admin-panel overflow-hidden">
                            <div className="alh-admin-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Selected Day
                                    </p>
                                    <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                        {longDate(selectedDate)}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        {selectedStatusLabel}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 p-5">
                                <div className="alh-admin-mini-box">
                                    <span>Derived Status</span>
                                    <strong>{selectedStatusLabel}</strong>
                                </div>

                                {BLOCK_KEYS.map((block) => {
                                    const available =
                                        selectedAvailability?.[block] ?? true;

                                    return (
                                        <div
                                            key={block}
                                            className="alh-calendar-block-summary"
                                        >
                                            <span>
                                                <Clock3 className="h-4 w-4" />
                                                <span>
                                                    {BLOCK_META[block].label}
                                                    <small>
                                                        {BLOCK_META[block].time}
                                                    </small>
                                                </span>
                                            </span>

                                            {available ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                                <ShieldAlert className="h-5 w-5 text-red-500" />
                                            )}
                                        </div>
                                    );
                                })}

                                {canManageBlocks ? (
                                    <button
                                        type="button"
                                        onClick={() => openCreate(selectedDate)}
                                        className="alh-primary-button justify-center"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Block This Date
                                    </button>
                                ) : null}

                                <Link
                                    href={bookingCreateHref(selectedDate)}
                                    className="alh-secondary-button justify-center"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Quick Booking
                                </Link>
                            </div>
                        </section>

                        <section className="alh-admin-panel overflow-hidden">
                            <div className="alh-admin-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Day Records
                                    </p>
                                    <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                        {selectedEvents.length} item
                                        {selectedEvents.length === 1 ? '' : 's'}
                                    </h2>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                {selectedEvents.length > 0 ? (
                                    selectedEvents.map((event) => (
                                        <article
                                            key={`${event.kind}-${event.id}`}
                                            className="alh-selected-event-row"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap gap-2">
                                                    <span
                                                        className={statusChipClass(
                                                            event.kind ===
                                                                'public_event'
                                                                ? 'public_event'
                                                                : event.status ||
                                                                      event.kind,
                                                        )}
                                                    >
                                                        {event.kind === 'block'
                                                            ? 'Block'
                                                            : event.kind ===
                                                                'public_event'
                                                              ? 'Public Event'
                                                              : cleanLabel(
                                                                    event.status ||
                                                                        'Booking',
                                                                )}
                                                    </span>

                                                    {event.payment_status ? (
                                                        <span
                                                            className={statusChipClass(
                                                                event.payment_status,
                                                            )}
                                                        >
                                                            {cleanLabel(
                                                                event.payment_status,
                                                            )}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <h3>{event.title}</h3>
                                                <p>
                                                    {eventSecondaryText(event)}
                                                </p>

                                                {event.note ||
                                                event.summary ||
                                                event.description ? (
                                                    <small>
                                                        {event.note ||
                                                            event.summary ||
                                                            event.description}
                                                    </small>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {event.kind === 'booking' ? (
                                                    <Link
                                                        href={bookingShowHref(
                                                            event,
                                                        )}
                                                        className="alh-admin-neutral-button"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                ) : null}

                                                {event.kind === 'block' &&
                                                canManageBlocks ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(event)
                                                            }
                                                            className="alh-admin-neutral-button"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteBlock(
                                                                    event,
                                                                )
                                                            }
                                                            disabled={busy}
                                                            className="alh-admin-danger-button disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {busy ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </>
                                                ) : null}
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <CalendarDays className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                        <h3 className="mt-4 font-black text-slate-950 dark:text-white">
                                            No records on this day
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                            Bookings, blocks, and public events
                                            will appear here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="alh-admin-panel overflow-hidden">
                            <div className="alh-admin-panel-header flex items-center justify-between gap-3">
                                <div>
                                    <p className="backend-booking-label">
                                        Public Highlights
                                    </p>
                                    <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                        Events
                                    </h2>
                                </div>

                                <div className="alh-mini-segment">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveHighlightTab('bccc')
                                        }
                                        className={
                                            activeHighlightTab === 'bccc'
                                                ? 'is-active'
                                                : ''
                                        }
                                    >
                                        BCCC
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveHighlightTab('city')
                                        }
                                        className={
                                            activeHighlightTab === 'city'
                                                ? 'is-active'
                                                : ''
                                        }
                                    >
                                        City
                                    </button>
                                </div>
                            </div>

                            {activeHighlight ? (
                                <div className="p-5">
                                    <div className="relative overflow-hidden rounded-xl bg-slate-900">
                                        {activeHighlight.image ? (
                                            <img
                                                src={activeHighlight.image}
                                                alt={activeHighlight.title}
                                                className="h-48 w-full object-cover"
                                            />
                                        ) : (
                                            <div className="grid h-48 place-items-center">
                                                <AlertTriangle className="h-9 w-9 text-white/40" />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                                        <div className="absolute right-0 bottom-0 left-0 p-4">
                                            <p className="text-[11px] font-black tracking-[0.18em] text-white/70 uppercase">
                                                {activeHighlightTab === 'bccc'
                                                    ? 'BCCC Event'
                                                    : 'City Event'}
                                            </p>
                                            <h3 className="mt-1 text-xl font-black text-white">
                                                {activeHighlight.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <span className="inline-flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4" />
                                            {activeHighlight.date} ·{' '}
                                            {activeHighlight.time}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {activeHighlight.venue}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {activeHighlight.summary ||
                                            activeHighlight.description}
                                    </p>

                                    {activeHighlights.length > 1 ? (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {activeHighlights.map(
                                                (item, index) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveHighlightIndex(
                                                                index,
                                                            )
                                                        }
                                                        className={
                                                            index ===
                                                            activeHighlightIndex
                                                                ? 'alh-cal-highlight-dot is-active'
                                                                : 'alh-cal-highlight-dot'
                                                        }
                                                        aria-label={`Open highlight ${index + 1}`}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Info className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                    <h3 className="mt-4 font-black text-slate-950 dark:text-white">
                                        No highlights
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        Published public events will appear
                                        here.
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="alh-admin-note">
                            <Layers3 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            <div>
                                <p>Calendar rule</p>
                                <span>
                                    Blocks should use the same BCCC venue area
                                    names used by booking availability and
                                    public calendar checking.
                                </span>
                            </div>
                        </section>
                    </aside>
                </section>
            </div>
        </AppLayout>
    );
}
