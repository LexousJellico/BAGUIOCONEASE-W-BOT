export type BlockKey = 'AM' | 'PM' | 'EVE';
export type ScheduleDayStatus =
    | 'available'
    | 'limited'
    | 'public_booked'
    | 'private_booked'
    | 'blocked'
    | 'full'
    | 'my-booking';

export type ScheduleLikeEvent = {
    start?: string | null;
    end?: string | null;
    status?: string | null;
    kind?: string | null;
};

export const BLOCK_KEYS: BlockKey[] = ['AM', 'PM', 'EVE'];

export const BLOCK_META: Record<
    BlockKey,
    { label: string; time: string; start: string; end: string }
> = {
    AM: {
        label: 'AM',
        time: '6:00 AM – 12:00 PM',
        start: '06:00',
        end: '12:00',
    },
    PM: {
        label: 'PM',
        time: '12:00 PM – 6:00 PM',
        start: '12:00',
        end: '18:00',
    },
    EVE: {
        label: 'EVE',
        time: '6:00 PM – 11:59 PM',
        start: '18:00',
        end: '23:59',
    },
};

export function pad2(n: number) {
    return String(n).padStart(2, '0');
}

export function dateKey(date: Date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function shiftDateKey(dateValue: string, delta: number) {
    const base = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(base.getTime())) return dateValue;
    base.setDate(base.getDate() + delta);
    return dateKey(base);
}

export function monthToDate(month: string) {
    const match = String(month).match(/^(\d{4})-(\d{2})$/);
    if (!match) {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    }
    return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

export function monthLabel(date: Date) {
    return date.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });
}

export function shiftMonth(month: string, delta: number) {
    const current = monthToDate(month);
    const next = new Date(current.getFullYear(), current.getMonth() + delta, 1);
    return `${next.getFullYear()}-${pad2(next.getMonth() + 1)}`;
}

export function buildMonthWeeks(month: string) {
    const base = monthToDate(month);
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const sundayOffset = first.getDay();
    const cells: Array<Date | null> = [];

    for (let i = 0; i < sundayOffset; i += 1) cells.push(null);
    for (let d = 1; d <= last.getDate(); d += 1)
        cells.push(new Date(base.getFullYear(), base.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: Array<Array<Date | null>> = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
}

export function longDate(input: string | Date | null) {
    if (!input) return '';
    const date =
        input instanceof Date
            ? input
            : new Date(`${String(input).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(input ?? '');
    return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export function expandDateRange(start: string, end: string) {
    const list: string[] = [];
    const current = new Date(`${start}T00:00:00`);
    const last = new Date(`${end}T00:00:00`);
    if (Number.isNaN(current.getTime()) || Number.isNaN(last.getTime()))
        return list;
    while (current.getTime() <= last.getTime()) {
        list.push(dateKey(current));
        current.setDate(current.getDate() + 1);
    }
    return list;
}

export function normalizeEventRange(event: ScheduleLikeEvent) {
    const startDate = String(event.start ?? '').slice(0, 10);
    const rawEndDate = String(event.end ?? '').slice(0, 10);
    const rawEndTime = String(event.end ?? '').slice(11, 16);
    let endDate = rawEndDate;

    if (rawEndTime === '00:00' && rawEndDate > startDate) {
        endDate = shiftDateKey(rawEndDate, -1);
    }

    return { startDate, endDate, rawEndTime };
}

export function eventSpansDate(event: ScheduleLikeEvent, targetDate: string) {
    const { startDate, endDate } = normalizeEventRange(event);
    if (!startDate || !endDate) return false;
    return targetDate >= startDate && targetDate <= endDate;
}

export function eventStartsOnDate(
    event: ScheduleLikeEvent,
    targetDate: string,
) {
    return normalizeEventRange(event).startDate === targetDate;
}

export function eventEndsOnDate(event: ScheduleLikeEvent, targetDate: string) {
    return normalizeEventRange(event).endDate === targetDate;
}

export function blockIntervalForDate(dateValue: string, block: BlockKey) {
    if (block === 'AM')
        return { start: `${dateValue}T06:00`, end: `${dateValue}T12:00` };
    if (block === 'PM')
        return { start: `${dateValue}T12:00`, end: `${dateValue}T18:00` };
    return {
        start: `${dateValue}T18:00`,
        end: `${shiftDateKey(dateValue, 1)}T00:00`,
    };
}

export function eventTouchesBlockOnDate(
    event: ScheduleLikeEvent,
    dateValue: string,
    block: BlockKey,
) {
    const range = blockIntervalForDate(dateValue, block);
    const eventStart = new Date(String(event.start ?? ''));
    const eventEnd = new Date(String(event.end ?? ''));
    const blockStart = new Date(range.start);
    const blockEnd = new Date(range.end);

    if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime()))
        return false;
    if (Number.isNaN(blockStart.getTime()) || Number.isNaN(blockEnd.getTime()))
        return false;
    return eventStart < blockEnd && eventEnd > blockStart;
}

type AvailabilityBlockEntry = {
    key?: string | null;
    label?: string | null;
    is_available?: boolean | null;
    available?: boolean | null;
};

type AvailabilityBlockMap = Partial<Record<BlockKey | Lowercase<BlockKey>, AvailabilityBlockEntry | boolean | null>>;
type AvailabilityBlocksInput = AvailabilityBlockEntry[] | AvailabilityBlockMap | null | undefined;

function blockEntryAvailable(entry: AvailabilityBlockEntry | boolean | null | undefined): boolean {
    if (typeof entry === 'boolean') return entry;
    if (!entry) return true;

    return Boolean(entry.is_available ?? entry.available ?? true);
}

export function resolveBlockAvailable(blocks: AvailabilityBlocksInput, key: BlockKey) {
    if (!blocks) return true;

    if (Array.isArray(blocks)) {
        const found = blocks.find(
            (block) => (block?.key ?? block?.label) === key,
        );
        if (!found) return true;
        return blockEntryAvailable(found);
    }

    const blockMap = blocks as AvailabilityBlockMap;
    const found = blockMap[key] ?? blockMap[key.toLowerCase() as Lowercase<BlockKey>];
    return blockEntryAvailable(found);
}

export function availabilityBlocksSummary(blocks: AvailabilityBlocksInput) {
    const summary = BLOCK_KEYS.map((key) => ({
        key,
        available: resolveBlockAvailable(blocks, key),
        ...BLOCK_META[key],
    }));

    if (!summary[0].available && !summary[1].available && summary[2].available) {
        summary[2] = {
            ...summary[2],
            available: false,
        };
    }

    return summary;
}

export function deriveDayStatus(options: {
    availability?: {
        day_status?: string | null;
        is_fully_booked?: boolean;
        AM?: boolean;
        PM?: boolean;
        EVE?: boolean;
    } | null;
    events?: ScheduleLikeEvent[];
    isClient?: boolean;
}): ScheduleDayStatus {
    const { availability, events = [], isClient = false } = options;
    const dayStatus = String(availability?.day_status ?? '').toLowerCase();
    const hasOwnBooking =
        isClient &&
        events.some(
            (event) => String(event.kind ?? '').toLowerCase() === 'booking',
        );

    if (hasOwnBooking) return 'my-booking';

    if (availability?.AM === false && availability?.PM === false && availability?.EVE !== false) {
        return 'blocked';
    }

    if (dayStatus === 'blocked') return 'blocked';
    if (dayStatus === 'public_booked') return 'public_booked';
    if (dayStatus === 'private_booked') return 'private_booked';
    if (dayStatus === 'limited') return 'limited';
    if (availability?.is_fully_booked) return 'full';

    const unavailableCount = [
        availability?.AM,
        availability?.PM,
        availability?.EVE,
    ].filter((v) => v === false).length;
    if (unavailableCount > 0) return 'limited';

    return 'available';
}

export function scheduleStatusLabel(status: ScheduleDayStatus | string | null | undefined) {
    switch (status) {
        case 'blocked':
            return 'Blocked';
        case 'public_booked':
            return 'Public Event';
        case 'private_booked':
            return 'Reserved';
        case 'limited':
            return 'Partially Available';
        case 'full':
            return 'Fully Occupied';
        case 'my-booking':
            return 'My Booking';
        default:
            return 'Available';
    }
}

export function scheduleStatusDescription(status: ScheduleDayStatus | string | null | undefined) {
    switch (status) {
        case 'blocked':
            return 'This date is blocked for internal schedule control.';
        case 'public_booked':
            return 'This date already has a public event or public schedule activity.';
        case 'private_booked':
            return 'This date already has a private booking or reserved activity.';
        case 'limited':
            return 'This date still has open time blocks, but some schedules are already occupied.';
        case 'full':
            return 'This date is fully occupied for the current schedule logic.';
        case 'my-booking':
            return 'You already have a booking on this date.';
        default:
            return 'This date is currently available.';
    }
}

export function scheduleStatusTone(status: ScheduleDayStatus | string | null | undefined) {
    switch (status) {
        case 'my-booking':
            return 'border-[#174f40] bg-[#174f40] text-white';
        case 'public_booked':
            return 'border-[#b7a8ff] bg-[#f1ecff] text-[#5532c7]';
        case 'private_booked':
            return 'border-[#d7b14b] bg-[#f7ebc1] text-[#6a4f00]';
        case 'blocked':
            return 'border-[#f1aaaa] bg-[#ffe5e5] text-[#a52a2a]';
        case 'full':
            return 'border-[#c9b061] bg-[#f7ebc1] text-[#6a4f00]';
        case 'limited':
            return 'border-[#bfd2ff] bg-[#eef4ff] text-[#1645ac]';
        default:
            return 'border-black/10 bg-white text-[#22221f] dark:border-white/10 dark:bg-[#17181c] dark:text-white';
    }
}

export function chipTone(status?: string | null) {
    const normalized = String(status ?? '').toLowerCase();
    if (normalized === 'public_booked') return 'bg-[#ede8ff] text-[#5532c7]';
    if (['private_booked', 'confirmed', 'active'].includes(normalized))
        return 'bg-[#f7ebc1] text-[#6a4f00]';
    if (normalized === 'blocked') return 'bg-[#ffe3e3] text-[#a52a2a]';
    if (normalized === 'pending') return 'bg-[#eef4ff] text-[#1645ac]';
    if (normalized === 'completed') return 'bg-[#eef7f4] text-[#174f40]';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}
