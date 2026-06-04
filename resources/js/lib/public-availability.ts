import type { VenueOption } from '@/types/public-content';

export type BlockKey = 'AM' | 'PM' | 'EVE';

export type AvailabilityStatus =
    | 'available'
    | 'limited'
    | 'public_booked'
    | 'private_booked'
    | 'blocked'
    | 'past_unavailable';

export type AvailabilityBlock = {
    key: BlockKey | string;
    label?: string | null;
    from?: string | null;
    to?: string | null;
    is_available?: boolean | null;
    isAvailable?: boolean | null;
    booked?: boolean | null;
    blocked?: boolean | null;
    reason?: string | null;
};

export type CalendarBlock = {
    title?: string | null;
    area?: string | null;
    notes?: string | null;
    block?: string | null;
    public_status?: string | null;
};

export type PublicDayStatus = {
    date: string;
    venue?: string | null;
    event_type?: string | null;
    guests?: number | null;
    status: AvailabilityStatus | string;
    title: string;
    description: string;
    note: string;
    recommended_action?: string | null;
    can_proceed?: boolean | null;
    blocks?: AvailabilityBlock[] | Record<string, AvailabilityBlock | boolean | null> | null;
    busy?: Array<{ from: string; to: string }>;
    free?: Array<{ from: string; to: string }>;
    event_titles?: string[];
    calendar_blocks?: CalendarBlock[];
    is_fully_booked?: boolean | null;
    isFullyBooked?: boolean | null;
    venue_capacity_ok?: boolean | null;
    venue_capacity_message?: string | null;
};

export type AvailabilityRangeResponse = {
    mode?: 'range';
    from: string;
    to: string;
    date?: string;
    venue: string;
    event_type?: string | null;
    guests?: number | null;
    status: AvailabilityStatus;
    title: string;
    description: string;
    note: string;
    recommended_action?: string | null;
    can_proceed?: boolean | null;
    days_count?: number;
    available_days?: number;
    limited_days?: number;
    blocked_days?: number;
    results: PublicDayStatus[];
    event_titles?: string[];
    calendar_blocks?: CalendarBlock[];
};

export type MonthPayload = {
    month: string;
    venue?: string | null;
    days: PublicDayStatus[];
};

export const publicEventTypeOptions = [
    'Conference',
    'Convention',
    'Summit',
    'Seminar',
    'Workshop',
    'Training',
    'Meeting',
    'Board Meeting',
    'General Assembly',
    'Government Program',
    'Public Forum',
    'Press Conference',
    'Exhibit',
    'Expo',
    'Trade Fair',
    'Bazaar',
    'Product Launch',
    'Corporate Event',
    'Cultural Program',
    'Cultural Show',
    'Concert',
    'Awards Night',
    'Graduation',
    'Recognition Program',
    'Wedding Reception',
    'Debut',
    'Birthday Celebration',
    'Religious Gathering',
    'Community Event',
    'Festival Activity',
    'Sports Event',
    'Private Event',
];

export const fallbackVenues: VenueOption[] = [
    { label: 'Full Hall', value: 'FULL HALL', category: 'Convention Hall', capacity: 'Large-scale events' },
    { label: 'Main Hall', value: 'MAIN HALL', category: 'Primary Venue', capacity: 'Major events' },
    { label: 'LED Wall', value: 'LED WALL', category: 'Display Support', capacity: 'Presentation and stage visuals' },
    { label: 'Foyer & Lobby Area', value: 'FOYER & LOBBY AREA', category: 'Reception Area', capacity: 'Exhibits and pre-function' },
    { label: 'VIP Lounge', value: 'VIP LOUNGE', category: 'Private Area', capacity: 'Small formal groups' },
    { label: 'Board Room', value: 'BOARD ROOM', category: 'Meeting Room', capacity: 'Executive meetings' },
    { label: 'Basement', value: 'BASEMENT', category: 'Support Space', capacity: 'Auxiliary use' },
    { label: 'Gallery2600', value: 'GALLERY2600', category: 'Gallery Space', capacity: 'Cultural exhibits' },
];

export const blockOrder: BlockKey[] = ['AM', 'PM', 'EVE'];

export const blockMeta: Record<
    BlockKey,
    {
        label: string;
        shortLabel: string;
        from: string;
        to: string;
        display: string;
    }
> = {
    AM: {
        label: 'Morning',
        shortLabel: 'AM',
        from: '06:00',
        to: '12:00',
        display: '6:00 AM – 12:00 PM',
    },
    PM: {
        label: 'Afternoon',
        shortLabel: 'PM',
        from: '12:00',
        to: '18:00',
        display: '12:00 PM – 6:00 PM',
    },
    EVE: {
        label: 'Evening',
        shortLabel: 'EVE',
        from: '18:00',
        to: '23:59',
        display: '6:00 PM – 11:59 PM',
    },
};

export function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')?.trim() ?? '';
}

export async function parseJsonResponse(response: Response) {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        return {
            message: text || 'Unexpected response from the server.',
        };
    }
}

export function dateKey(date: Date) {
    return [
        date.getFullYear(),
        `${date.getMonth() + 1}`.padStart(2, '0'),
        `${date.getDate()}`.padStart(2, '0'),
    ].join('-');
}

export function todayKey() {
    return dateKey(new Date());
}

export function parseDateKey(value: string) {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
}

export function monthKeyFromDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function parseMonth(month: string) {
    if (/^\d{4}-\d{2}$/.test(month)) {
        const [year, monthValue] = month.split('-').map(Number);

        return new Date(year, monthValue - 1, 1);
    }

    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function addMonths(month: string, amount: number) {
    const date = parseMonth(month);

    return monthKeyFromDate(new Date(date.getFullYear(), date.getMonth() + amount, 1));
}

export function monthLabel(month: string) {
    return parseMonth(month).toLocaleDateString('en-PH', {
        month: 'long',
        year: 'numeric',
    });
}

export function longDate(value: string) {
    return parseDateKey(value).toLocaleDateString('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export function shortDate(value: string) {
    return parseDateKey(value).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatRangeLabel(from: string, to: string) {
    if (!from || !to) {
        return 'No date range selected';
    }

    if (from === to) {
        return shortDate(from);
    }

    return `${shortDate(from)} to ${shortDate(to)}`;
}

export function daysBetween(from: string, to: string) {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        return 0;
    }

    return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function buildMonthWeeks(month: string): Date[][] {
    const firstOfMonth = parseMonth(month);
    const cursor = new Date(firstOfMonth);

    cursor.setDate(cursor.getDate() - cursor.getDay());

    const weeks: Date[][] = [];

    for (let week = 0; week < 6; week += 1) {
        const row: Date[] = [];

        for (let day = 0; day < 7; day += 1) {
            const next = new Date(cursor);

            next.setDate(cursor.getDate() + week * 7 + day);
            row.push(next);
        }

        weeks.push(row);
    }

    return weeks;
}

export function normalizeStatus(status?: string | null): AvailabilityStatus {
    const value = String(status || '').toLowerCase();

    if (value === 'past_unavailable' || value === 'past-unavailable' || value === 'past') {
        return 'past_unavailable';
    }

    if (value === 'blocked' || value === 'closed' || value === 'unavailable') {
        return 'blocked';
    }

    if (value === 'public_booked' || value === 'public-booked' || value === 'public') {
        return 'public_booked';
    }

    if (
        value === 'private_booked' ||
        value === 'private-booked' ||
        value === 'fully_booked' ||
        value === 'fully-booked' ||
        value === 'full' ||
        value === 'reserved'
    ) {
        return 'private_booked';
    }

    if (value === 'limited' || value === 'partial' || value === 'partially_booked' || value === 'partially-booked') {
        return 'limited';
    }

    return 'available';
}

export function statusLabel(status: AvailabilityStatus | string) {
    const normalized = normalizeStatus(status);

    return {
        available: 'Available',
        limited: 'Limited',
        public_booked: 'Public Event',
        private_booked: 'Reserved',
        blocked: 'Blocked',
        past_unavailable: 'Unavailable',
    }[normalized];
}

export function statusDescription(status: AvailabilityStatus | string) {
    const normalized = normalizeStatus(status);

    return {
        available: 'No conflict is currently shown for this date and selected area.',
        limited: 'Some time blocks remain open, but at least one block is already occupied.',
        public_booked: 'A public-facing event or activity is listed for this date.',
        private_booked: 'This date has private reserved time or is already fully occupied.',
        blocked: 'This date is unavailable for public booking requests.',
        past_unavailable: 'Past dates are unavailable for new reservation requests.',
    }[normalized];
}

export function statusTone(status: AvailabilityStatus | string) {
    const normalized = normalizeStatus(status);

    if (normalized === 'past_unavailable') {
        return 'border-slate-200 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/8 dark:text-white/50';
    }

    if (normalized === 'blocked') {
        return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100';
    }

    if (normalized === 'public_booked') {
        return 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100';
    }

    if (normalized === 'private_booked') {
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100';
    }

    if (normalized === 'limited') {
        return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-100';
    }

    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100';
}

export function statusDot(status: AvailabilityStatus | string) {
    const normalized = normalizeStatus(status);

    if (normalized === 'past_unavailable') {
        return 'bg-slate-400';
    }

    if (normalized === 'blocked') {
        return 'bg-rose-500';
    }

    if (normalized === 'public_booked') {
        return 'bg-sky-500';
    }

    if (normalized === 'private_booked') {
        return 'bg-amber-500';
    }

    if (normalized === 'limited') {
        return 'bg-blue-500';
    }

    return 'bg-emerald-500';
}

export function normalizeBlocks(blocks?: PublicDayStatus['blocks']): Required<AvailabilityBlock>[] {
    if (!blocks) {
        return blockOrder.map((key) => ({
            key,
            label: blockMeta[key].label,
            from: blockMeta[key].from,
            to: blockMeta[key].to,
            is_available: true,
            isAvailable: true,
            booked: false,
            blocked: false,
            reason: null,
        }));
    }

    const rows = Array.isArray(blocks)
        ? blocks
        : Object.entries(blocks).map(([key, value]) => {
              if (typeof value === 'boolean') {
                  return {
                      key,
                      label: blockMeta[key as BlockKey]?.label || key,
                      from: blockMeta[key as BlockKey]?.from || '--:--',
                      to: blockMeta[key as BlockKey]?.to || '--:--',
                      is_available: value,
                  };
              }

              return {
                  ...(value ?? {}),
                  key: value && typeof value === 'object' && 'key' in value ? value.key || key : key,
              };
          });

    const map = new Map<string, Required<AvailabilityBlock>>();

    rows.forEach((block) => {
        const key = String(block.key || '').toUpperCase();
        const isKnown = blockOrder.includes(key as BlockKey);

        if (!isKnown) {
            return;
        }

        const meta = blockMeta[key as BlockKey];
        const unavailableByFlag = Boolean(block.booked || block.blocked);
        const explicitAvailable =
            typeof block.is_available === 'boolean'
                ? block.is_available
                : typeof block.isAvailable === 'boolean'
                  ? block.isAvailable
                  : true;

        map.set(key, {
            key,
            label: block.label || meta.label,
            from: block.from || meta.from,
            to: block.to || meta.to,
            is_available: explicitAvailable && !unavailableByFlag,
            isAvailable: explicitAvailable && !unavailableByFlag,
            booked: Boolean(block.booked),
            blocked: Boolean(block.blocked),
            reason: block.reason || null,
        });
    });

    const normalized = blockOrder.map((key) => {
        return (
            map.get(key) || {
                key,
                label: blockMeta[key].label,
                from: blockMeta[key].from,
                to: blockMeta[key].to,
                is_available: true,
                isAvailable: true,
                booked: false,
                blocked: false,
                reason: null,
            }
        );
    });

    const amOpen = normalized.find((block) => block.key === 'AM')?.is_available !== false;
    const pmOpen = normalized.find((block) => block.key === 'PM')?.is_available !== false;
    const eveIndex = normalized.findIndex((block) => block.key === 'EVE');
    const eveOpen = eveIndex >= 0 && normalized[eveIndex].is_available !== false;

    if (!amOpen && !pmOpen && eveOpen) {
        normalized[eveIndex] = {
            ...normalized[eveIndex],
            is_available: false,
            isAvailable: false,
            blocked: true,
            reason: 'Evening is only available as approved additional time and cannot start a booking.',
        };
    }

    return normalized;
}

export function blockIsOpen(day: PublicDayStatus | null | undefined, key: BlockKey) {
    return normalizeBlocks(day?.blocks).find((block) => block.key === key)?.is_available !== false;
}

export function deriveDayStatus(day: PublicDayStatus | null | undefined): AvailabilityStatus {
    if (!day) {
        return 'available';
    }

    const normalized = normalizeStatus(day.status);
    const blocks = normalizeBlocks(day.blocks);
    const closedBlocks = blocks.filter((block) => !block.is_available).length;
    const eveOnlyExtension = blocks.some(
        (block) =>
            block.key === 'EVE' &&
            String(block.reason || '').includes('cannot start a booking'),
    );

    if (normalized === 'past_unavailable') {
        return 'past_unavailable';
    }

    if (normalized === 'blocked' || eveOnlyExtension) {
        return 'blocked';
    }

    if (normalized === 'public_booked') {
        return 'public_booked';
    }

    if (normalized === 'private_booked') {
        return 'private_booked';
    }

    if (normalized === 'limited') {
        return 'limited';
    }

    if (day.is_fully_booked || day.isFullyBooked || closedBlocks === blockOrder.length) {
        return 'private_booked';
    }

    if (closedBlocks > 0) {
        return 'limited';
    }

    return 'available';
}

export function blockQueryHref(date: string, block: BlockKey, venue: string, eventType?: string, guests?: string | number) {
    const query = new URLSearchParams();

    query.set('date', date);
    query.set('start', blockMeta[block].from);
    query.set('end', blockMeta[block].to);
    query.set('date_from', `${date}T${blockMeta[block].from}`);
    query.set('date_to', `${date}T${blockMeta[block].to}`);
    query.set('venue', venue);

    if (eventType) {
        query.set('event_type', eventType);
    }

    if (guests) {
        query.set('guests', String(guests));
    }

    return `/book?${query.toString()}`;
}

export function rangeBookingHref(result: Pick<AvailabilityRangeResponse, 'from' | 'to' | 'venue'> & Partial<AvailabilityRangeResponse>) {
    const query = new URLSearchParams();

    query.set('date_from', `${result.from}T06:00`);
    query.set('date_to', `${result.to}T23:59`);
    query.set('date', result.from);
    query.set('venue', result.venue);

    if (result.event_type) {
        query.set('event_type', result.event_type);
    }

    if (result.guests) {
        query.set('guests', String(result.guests));
    }

    return `/book?${query.toString()}`;
}

export async function postAvailabilityCheck(payload: {
    date?: string;
    start_date?: string;
    end_date?: string;
    date_from?: string;
    date_to?: string;
    venue: string;
    event_type?: string;
    guests?: number;
}) {
    const response = await fetch('/public/availability-check', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
            ...payload,

            /**
             * These aliases keep the frontend compatible with both controller styles:
             * - old single-date contract: date
             * - newer range contract: start_date/end_date
             * - booking prefill style: date_from/date_to
             */
            date: payload.date || payload.start_date || payload.date_from,
            start_date: payload.start_date || payload.date || payload.date_from,
            end_date: payload.end_date || payload.date || payload.date_to,
            date_from: payload.date_from || payload.start_date || payload.date,
            date_to: payload.date_to || payload.end_date || payload.date,
        }),
    });

    const json = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(json?.message || 'Unable to check availability right now.');
    }

    return json;
}

export async function getPublicCalendarMonth(payload: {
    month: string;
    venue: string;
}) {
    const query = new URLSearchParams();

    query.set('month', payload.month);
    query.set('venue', payload.venue);

    const response = await fetch(`/public/calendar-month?${query.toString()}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
    });

    const json = await parseJsonResponse(response);

    if (!response.ok) {
        throw new Error(json?.message || 'Unable to load public calendar month.');
    }

    return json as MonthPayload;
}
