import type { RoleKey } from '@/lib/role-workspaces';

export type CalendarBlockKey = 'AM' | 'PM' | 'EVE';

export type CalendarAvailabilityDay = {
    AM?: boolean;
    PM?: boolean;
    EVE?: boolean;
    is_fully_booked?: boolean;
    day_status?: string;
};

export type CalendarEventItem = {
    id: number | string;
    kind?: 'booking' | 'block' | 'public_event' | string;
    block_id?: number | string;
    block?: string | null;
    area?: string | null;
    title: string;
    start: string;
    end: string;
    status?: string | null;
    public_status?: string | null;
    guests?: number | string | null;
    groupKey?: string | null;
};

export type CalendarDayCell = {
    date: Date;
    key: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    availability?: CalendarAvailabilityDay;
    events: CalendarEventItem[];
};

export function normalizeCalendarRole(value?: string | null): RoleKey {
    if (value === 'admin') return 'admin';
    if (value === 'manager') return 'manager';
    if (value === 'staff') return 'staff';
    return 'user';
}

export function calendarRoleCopy(role: RoleKey) {
    if (role === 'admin') {
        return {
            eyebrow: 'Executive Calendar Control',
            title: 'Booking Calendar',
            description:
                'Full calendar workspace for bookings, public events, blocked dates, schedule review, and venue operations.',
            primaryAction: 'Manage Calendar',
            secondaryAction: 'Create Booking',
            tertiaryAction: 'Calendar Analytics',
            manageHref: '/admin/calendar/manage',
            createHref: '/admin/bookings/create',
            analyticsHref: '/admin/calendar/analytics',
            bookingsHref: '/admin/bookings',
        };
    }

    if (role === 'manager') {
        return {
            eyebrow: 'Management Calendar Review',
            title: 'Calendar Monitoring',
            description:
                'Review venue usage, booking activity, payment-sensitive schedules, and calendar conflicts for operational decisions.',
            primaryAction: 'Manage Calendar',
            secondaryAction: 'Review Bookings',
            tertiaryAction: 'Calendar Analytics',
            manageHref: '/manager/calendar/manage',
            createHref: '/manager/bookings',
            analyticsHref: '/manager/calendar/analytics',
            bookingsHref: '/manager/bookings',
        };
    }

    if (role === 'staff') {
        return {
            eyebrow: 'Daily Operations Calendar',
            title: 'Staff Calendar',
            description:
                'Daily schedule workspace for checking venue availability, assisting bookings, and coordinating client requests.',
            primaryAction: 'Booking Records',
            secondaryAction: 'Assist Booking',
            tertiaryAction: 'Public Website',
            manageHref: '/staff/bookings',
            createHref: '/staff/bookings/create',
            analyticsHref: '/',
            bookingsHref: '/staff/bookings',
        };
    }

    return {
        eyebrow: 'Client Calendar',
        title: 'My Calendar',
        description:
            'Client-facing calendar view for checking your booking requests and schedule references.',
        primaryAction: 'My Bookings',
        secondaryAction: 'Book Event',
        tertiaryAction: 'Public Website',
        manageHref: '/my-bookings',
        createHref: '/book',
        analyticsHref: '/',
        bookingsHref: '/my-bookings',
    };
}

export function roleCalendarBasePath(role: RoleKey): string {
    if (role === 'admin') return '/admin/calendar';
    if (role === 'manager') return '/manager/calendar';
    if (role === 'staff') return '/staff/calendar';
    return '/my-calendar';
}

export function roleBookingShowPath(
    role: RoleKey,
    id: number | string,
): string {
    if (role === 'admin') return `/admin/bookings/${id}`;
    if (role === 'manager') return `/manager/bookings/${id}`;
    if (role === 'staff') return `/staff/bookings/${id}`;
    return `/my-bookings/${id}`;
}

export function roleBookingCreatePath(role: RoleKey, dateKey?: string): string {
    const query = dateKey ? `?date=${dateKey}&start=06:00&end=12:00` : '';

    if (role === 'admin') return `/admin/bookings/create${query}`;
    if (role === 'staff') return `/staff/bookings/create${query}`;
    return `/book${query}`;
}

export function roleCalendarManagePath(
    role: RoleKey,
    dateKey?: string,
): string {
    const query = dateKey ? `?date=${dateKey}` : '';

    if (role === 'admin') return `/admin/calendar/manage${query}`;
    if (role === 'manager') return `/manager/calendar/manage${query}`;
    return roleCalendarBasePath(role);
}

export function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function parseMonth(month: string): Date {
    if (/^\d{4}-\d{2}$/.test(month)) {
        const [year, monthNumber] = month.split('-').map(Number);
        return new Date(year, monthNumber - 1, 1);
    }

    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function addMonths(date: Date, amount: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function monthLabel(month: string): string {
    const date = parseMonth(month);

    return date.toLocaleDateString('en-PH', {
        month: 'long',
        year: 'numeric',
    });
}

export function buildMonthGrid(
    month: string,
    availability: Record<string, CalendarAvailabilityDay>,
    events: CalendarEventItem[],
): CalendarDayCell[] {
    const firstOfMonth = parseMonth(month);
    const firstGridDate = new Date(firstOfMonth);
    firstGridDate.setDate(firstGridDate.getDate() - firstGridDate.getDay());

    const todayKey = formatDateKey(new Date());
    const eventMap = buildEventMap(events);

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(firstGridDate);
        date.setDate(firstGridDate.getDate() + index);

        const key = formatDateKey(date);

        return {
            date,
            key,
            dayNumber: date.getDate(),
            isCurrentMonth: date.getMonth() === firstOfMonth.getMonth(),
            isToday: key === todayKey,
            availability: availability[key],
            events: eventMap.get(key) ?? [],
        };
    });
}

export function buildEventMap(
    events: CalendarEventItem[],
): Map<string, CalendarEventItem[]> {
    const map = new Map<string, CalendarEventItem[]>();

    events.forEach((event) => {
        const keys = eventDateKeys(event);

        keys.forEach((key) => {
            const list = map.get(key) ?? [];
            list.push(event);
            map.set(key, list);
        });
    });

    return map;
}

export function eventDateKeys(event: CalendarEventItem): string[] {
    const startKey = String(event.start || '').slice(0, 10);
    const endKeyRaw = String(event.end || '').slice(0, 10);
    const endTimeRaw = String(event.end || '').slice(11, 16);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startKey)) {
        return [];
    }

    const start = parseDateKey(startKey);
    let end = /^\d{4}-\d{2}-\d{2}$/.test(endKeyRaw)
        ? parseDateKey(endKeyRaw)
        : parseDateKey(startKey);

    if (endTimeRaw === '00:00' && end.getTime() > start.getTime()) {
        end = new Date(end);
        end.setDate(end.getDate() - 1);
    }

    if (end.getTime() < start.getTime()) {
        end = start;
    }

    const keys: string[] = [];
    const cursor = new Date(start);

    while (cursor.getTime() <= end.getTime()) {
        keys.push(formatDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return keys;
}

export function parseDateKey(key: string): Date {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
}

export function cleanCalendarLabel(value?: string | null): string {
    return String(value || 'Not set')
        .replace(/^PUBLIC:\s*/i, '')
        .replace(/^BLOCK:\s*/i, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function eventTone(event: CalendarEventItem): string {
    const kind = String(event.kind || '').toLowerCase();
    const status = String(event.status || '').toLowerCase().replace(/[\s-]+/g, '_');

    if (kind === 'public_event' || status === 'public_booked') {
        return 'border-sky-300/25 bg-sky-300/10 text-sky-700 dark:text-sky-100';
    }

    if (status === 'private_booked') {
        return 'border-rose-300/30 bg-rose-300/10 text-rose-700 dark:text-rose-100';
    }

    if (kind === 'block' || status === 'blocked') {
        return 'border-slate-300/30 bg-slate-300/10 text-slate-700 dark:text-slate-100';
    }

    if (status === 'pending' || status === 'pencil_booked' || status === 'submitted') {
        return 'border-amber-300/30 bg-amber-300/10 text-amber-700 dark:text-amber-100';
    }

    if (status === 'for_review' || status === 'confirmed') {
        return 'border-blue-300/30 bg-blue-300/10 text-blue-700 dark:text-blue-100';
    }

    if (status === 'approved' || status === 'active') {
        return 'border-emerald-300/30 bg-emerald-300/10 text-emerald-700 dark:text-emerald-100';
    }

    if (status === 'completed') {
        return 'border-slate-300/30 bg-slate-300/10 text-slate-700 dark:text-slate-100';
    }

    if (status === 'cancelled' || status === 'declined' || status === 'expired') {
        return 'border-rose-300/25 bg-rose-300/10 text-rose-700 dark:text-rose-100';
    }

    return 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-text)]';
}

export function availabilityTone(day?: CalendarAvailabilityDay): string {
    const status = String(day?.day_status || '').toLowerCase();

    if (!day || isEveOnlyAvailability(day) || status === 'blocked' || status === 'unavailable') return 'border-slate-300/25 bg-slate-400/10';
    if (status === 'private_booked' || day.is_fully_booked || status === 'fully_booked') return 'border-rose-300/25 bg-rose-400/10';
    if (status === 'public_booked') return 'border-sky-300/25 bg-sky-400/10';
    if (status === 'partial' || status === 'partially_booked' || status === 'limited') return 'border-amber-300/25 bg-amber-400/10';

    return 'border-emerald-300/25 bg-emerald-400/10';
}

export function availabilityLabel(day?: CalendarAvailabilityDay): string {
    const status = String(day?.day_status || '').toLowerCase();

    if (!day) return 'No data';
    if (isEveOnlyAvailability(day) || status === 'blocked' || status === 'unavailable') return 'Unavailable';
    if (status === 'private_booked' || day.is_fully_booked || status === 'fully_booked') return 'Reserved';
    if (status === 'public_booked') return 'Public';
    if (status === 'partial' || status === 'partially_booked' || status === 'limited') return 'Limited';

    return 'Available';
}

export function isEveOnlyAvailability(day?: CalendarAvailabilityDay): boolean {
    return day?.AM === false && day?.PM === false && day?.EVE !== false;
}

export function blockLabel(block: CalendarBlockKey): string {
    if (block === 'AM') return 'AM';
    if (block === 'PM') return 'PM';
    return 'EVE';
}
