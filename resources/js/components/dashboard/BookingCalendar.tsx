// resources/js/components/dashboard/BookingCalendar.tsx
// Calendar UI with two distinct modes:
// - Client (user): availability-first + booking CTA + ✅ shows "MY BOOKED" blocks/events on the month grid
// - Admin/Manager/Staff: schedule-first
//   - Admin/Manager: can create blocks + can QUICK BOOK (➕) the first available slot
//   - Staff: view-only (can view/click bookings)
//
// ✅ Notes:
// - Status summary pills are CLICKABLE and filter the calendar
// - Filter is synced with Dashboard via props (statusFilter/onStatusFilterChange)
// - "All" resets the filter
// - "__blocked__" shows only blocks

import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Info, Plus, Trash2, X } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

type BlockKey = 'AM' | 'PM' | 'EVE';

type AvailabilityBlock = {
    key: string;
    label: string;
    from: string;
    to: string;
    is_available: boolean;
};

type DailyAvailability = {
    date: string;
    blocks?: Partial<Record<BlockKey, AvailabilityBlock>>;
    is_fully_booked?: boolean;
    busy?: Array<{ from: string; to: string }>;
    free?: Array<{ from: string; to: string }>;
};

type CalendarEvent = {
    id: number | string;

    // From backend (may be missing depending on your serializer)
    kind?: 'booking' | 'block';
    block_id?: number;
    block?: string;
    area?: string | null;
    title: string;
    start: string; // ISO 'YYYY-MM-DDTHH:mm'
    end: string; // ISO 'YYYY-MM-DDTHH:mm'
    status?: string | null;
    groupKey?: string | null;

    // UI-only fields we add when connecting bookings across consecutive days
    merged?: boolean;
    booking_ids?: Array<number | string>;
    children?: Array<{ id: number | string; start: string; end: string }>;
};

type MonthAvailability = Record<
    string,
    {
        AM: boolean;
        PM: boolean;
        EVE: boolean;
        is_fully_booked?: boolean;
    }
>;

type DayCell = {
    date: Date | null;
    key: string;
};

// 1s matches the legend text
const LONG_PRESS_MS = 1000;
const MOVE_CANCEL_PX = 10;

// Multi-day bar layout constants (px)
const BAR_TOP_PX = 32; // where bars start within a week row
const BAR_ROW_H = 20; // height of each bar row (h-5)
const BAR_ROW_GAP = 4; // vertical gap between bar rows (space-y-1)

/* ---------------------------------------
   Small helpers
---------------------------------------- */
function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

/**
 * Roles can arrive as:
 * - auth.roles: string[]
 * - auth.roles: {name:string}[]
 * - auth.user.roles: same as above
 */
type RoleLike = string | { name?: string | null } | null | undefined;
type AuthLike = {
    roles?: RoleLike[] | null;
    user?: { roles?: RoleLike[] | null } | null;
};

function getRoleNames(auth: unknown): string[] {
    if (!isRecord(auth)) return [];
    const raw =
        (auth as AuthLike).roles ?? (auth as AuthLike).user?.roles ?? [];
    if (!Array.isArray(raw)) return [];

    return raw
        .map((r) => {
            if (typeof r === 'string') return r;
            if (isRecord(r) && typeof r.name === 'string') return r.name;
            return '';
        })
        .filter(Boolean);
}

/* ---------------------------------------
   CSRF helpers (meta or XSRF cookie)
---------------------------------------- */
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const escaped = name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
    const match = document.cookie.match(
        new RegExp(`(?:^|; )${escaped}=([^;]*)`),
    );
    return match ? match[1] : null;
}

/**
 * Laravel CSRF headers:
 * - Uses <meta name="csrf-token"> if available
 * - Falls back to XSRF-TOKEN cookie (works even if meta tag is missing)
 */
function getCsrfHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (typeof document === 'undefined') return headers;

    const meta = document.querySelector(
        'meta[name="csrf-token"]',
    ) as HTMLMetaElement | null;
    if (meta?.content) headers['X-CSRF-TOKEN'] = meta.content;

    const xsrf = getCookie('XSRF-TOKEN');
    if (xsrf) {
        try {
            headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf);
        } catch {
            headers['X-XSRF-TOKEN'] = xsrf;
        }
    }

    return headers;
}

/* ---------------------------------------
   Date/time helpers
---------------------------------------- */
function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

function formatDateKey(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateKey(dateKey: string): Date | null {
    const m = String(dateKey).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d))
        return null;
    return new Date(y, mo - 1, d);
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatMonthKey(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function parseMonthKey(monthKey: string | null | undefined): Date {
    const m = String(monthKey || '').match(/^(\d{4})-(\d{2})$/);
    if (!m) return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const y = Number(m[1]);
    const mo = Number(m[2]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) {
        return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    }
    return new Date(y, mo - 1, 1);
}

function formatMonthLabel(firstOfMonth: Date): string {
    return firstOfMonth.toLocaleString(undefined, {
        month: 'long',
        year: 'numeric',
    });
}

function parseIsoLocal(iso?: string | null): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function formatTimeFromDate(d: Date): string {
    return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatLocalDateLabel(dateKey: string): string {
    const d = parseDateKey(dateKey);
    if (!d) return dateKey;
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });
}

function formatCompactDateLabel(dateKey: string): string {
    const d = parseDateKey(dateKey);
    if (!d) return dateKey;
    return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatDateTimeLabel(d: Date): string {
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function parseHHMM(hhmm: string): { h: number; m: number } | null {
    const m = String(hhmm).match(/^(\d{2}):(\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]);
    const mi = Number(m[2]);
    if (
        !Number.isFinite(h) ||
        !Number.isFinite(mi) ||
        h < 0 ||
        h > 23 ||
        mi < 0 ||
        mi > 59
    )
        return null;
    return { h, m: mi };
}

function dateRangeForDay(dateKey: string): { start: Date; end: Date } | null {
    const d = parseDateKey(dateKey);
    if (!d) return null;
    const start = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        0,
        0,
        0,
        0,
    );
    const end = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() + 1,
        0,
        0,
        0,
        0,
    );
    return { start, end };
}

function buildMonthGrid(firstOfMonth: Date): {
    grid: DayCell[];
    monthLabel: string;
} {
    const year = firstOfMonth.getFullYear();
    const month = firstOfMonth.getMonth();
    const first = new Date(year, month, 1);
    const firstWeekday = first.getDay(); // 0=Sun
    const last = new Date(year, month + 1, 0);
    const days = last.getDate();

    const monthLabel = formatMonthLabel(first);

    const cells: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
        cells.push({ date: null, key: `blank-${i}` });
    }

    for (let d = 1; d <= days; d++) {
        const date = new Date(year, month, d);
        cells.push({ date, key: formatDateKey(date) });
    }

    while (cells.length < 42) {
        cells.push({ date: null, key: `blank-tail-${cells.length}` });
    }

    return { grid: cells, monthLabel };
}

/**
 * Stored as 23:59 in DB for EVE; create page expects 00:00
 */
function normalizeEndForCreateLink(to: string): string {
    return to === '23:59' ? '00:00' : to;
}

function goToCreateBooking(date: string, from: string, to: string) {
    const params = new URLSearchParams();
    params.set('date', date);
    params.set('start', from);
    params.set('end', normalizeEndForCreateLink(to));
    router.visit(`/bookings/create?${params.toString()}`);
}

/**
 * Preview what the booking create form will be prefilled with:
 * - Shows date+time for start and end (end might be next day 00:00 if stored end is 23:59)
 */
function buildCreatePreview(
    dateKey: string,
    from: string,
    toStored: string,
): {
    startLabel: string;
    endLabel: string;
    startParam: string;
    endParam: string;
    endDateKey: string;
    note?: string;
} | null {
    const day = parseDateKey(dateKey);
    if (!day) return null;

    const fromParts = parseHHMM(from);
    const toParam = normalizeEndForCreateLink(toStored);
    const toParts = parseHHMM(toParam);
    if (!fromParts || !toParts) return null;

    const start = new Date(day);
    start.setHours(fromParts.h, fromParts.m, 0, 0);

    let endDate = new Date(day);
    if (toStored === '23:59' && toParam === '00:00') {
        endDate = addDays(endDate, 1);
    }
    const end = new Date(endDate);
    end.setHours(toParts.h, toParts.m, 0, 0);

    return {
        startLabel: formatDateTimeLabel(start),
        endLabel: formatDateTimeLabel(end),
        startParam: from,
        endParam: toParam,
        endDateKey: formatDateKey(endDate),
        note: toStored === '23:59' && toParam === '00:00' ? '' : undefined,
    };
}

/* ---------------------------------------
   Styling helpers
---------------------------------------- */
function normalizeStatusKey(status?: string | null): string {
    const s = String(status || '')
        .toLowerCase()
        .trim();
    return s || 'unknown';
}

function statusDot(status?: string | null) {
    const s = (status || '').toLowerCase();
    switch (s) {
        case 'pending':
            // Pending stays on its color
            return 'bg-slate-500';
        case 'confirmed':
            // Confirmed = green
            return 'bg-green-600';
        case 'active':
            // Active = sky blue
            return 'bg-sky-500';
        case 'completed':
            // Completed = dark blue
            return 'bg-blue-800';
        case 'declined':
            // Declined = orange
            return 'bg-orange-600';
        case 'cancelled':
        case 'canceled':
            // Cancelled = red
            return 'bg-red-600';
        case '__blocked__':
        case 'blocked':
        case 'unavailable':
            // Blocked = light gray
            return 'bg-slate-300 dark:bg-slate-400';
        default:
            return 'bg-slate-400';
    }
}

function statusPill(status?: string | null) {
    const s = (status || '').toLowerCase();
    switch (s) {
        case 'pending':
            // Pending stays on its color
            return 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-200';
        case 'confirmed':
            // Confirmed = green
            return 'border-green-600/20 bg-green-600/10 text-green-800 dark:text-green-200';
        case 'active':
            // Active = sky blue
            return 'border-sky-500/20 bg-sky-500/10 text-sky-800 dark:text-sky-200';
        case 'completed':
            // Completed = dark blue
            return 'border-blue-800/20 bg-blue-800/10 text-blue-900 dark:text-blue-200';
        case 'declined':
            // Declined = orange
            return 'border-orange-600/20 bg-orange-600/10 text-orange-800 dark:text-orange-200';
        case 'cancelled':
        case 'canceled':
            // Cancelled = red
            return 'border-red-600/20 bg-red-600/10 text-red-800 dark:text-red-200';
        case '__blocked__':
        case 'blocked':
        case 'unavailable':
            // Blocked = light gray
            return 'border-slate-300/40 bg-slate-300/10 text-slate-700 dark:border-slate-400/40 dark:bg-slate-400/10 dark:text-slate-200';
        default:
            return 'border-slate-500/15 bg-muted/40 text-muted-foreground';
    }
}

function availabilityChip(available: boolean) {
    return available
        ? 'border-emerald-600/20 bg-emerald-600/10 text-emerald-800 dark:text-emerald-200'
        : 'border-slate-500/15 bg-slate-500/10 text-slate-600 dark:text-slate-300';
}

function myBookedChip() {
    // Client-only: show user's own booking distinctly
    return 'border-slate-700 bg-slate-700 text-white dark:border-slate-200/20 dark:bg-slate-200/10 dark:text-slate-200';
}

function statusLabel(statusKey: string): string {
    const s = (statusKey || '').toLowerCase();
    switch (s) {
        case '__all__':
            return 'All';
        case '__blocked__':
        case 'unavailable':
            return 'Blocked';
        case 'pending':
            return 'Pending';
        case 'confirmed':
            return 'Confirmed';
        case 'active':
            return 'Active';
        case 'completed':
            return 'Completed';
        case 'declined':
            return 'Declined';
        case 'cancelled':
            return 'Cancelled';
        default: {
            const pretty = s.replace(/[_-]+/g, ' ').trim();
            return pretty.replace(/\b\w/g, (m) => m.toUpperCase()) || 'Unknown';
        }
    }
}

/* ---------------------------------------
   Event helpers
---------------------------------------- */
function clipEventTimeToDay(ev: CalendarEvent, dateKey: string): string {
    const range = dateRangeForDay(dateKey);
    const s = parseIsoLocal(ev.start);
    const e = parseIsoLocal(ev.end || ev.start);
    if (!range || !s || !e) return '';

    const dayStart = range.start;
    const dayEnd = range.end;

    const cs = s < dayStart ? dayStart : s;
    const ce = e > dayEnd ? dayEnd : e;

    if (ce <= cs) return '';

    const from = formatTimeFromDate(cs);
    const to = formatTimeFromDate(ce);
    return `${from} – ${to}`;
}

function eventDays(start: Date, end: Date): Date[] {
    // Treat end as exclusive for day-mapping.
    const endForDays =
        end.getTime() > start.getTime() ? new Date(end.getTime() - 1) : end;

    const days: Date[] = [];
    for (
        let d = startOfDay(start);
        d <= startOfDay(endForDays);
        d = addDays(d, 1)
    ) {
        days.push(d);
    }
    return days;
}

function normalizeKind(ev: CalendarEvent): 'booking' | 'block' {
    if (ev.kind === 'block' || typeof ev.block_id === 'number') return 'block';
    return 'booking';
}

function nextDayKey(dateKey: string): string {
    const d = parseDateKey(dateKey);
    if (!d) return dateKey;
    return formatDateKey(addDays(d, 1));
}

function formatTimeRangeFromIso(startIso: string, endIso: string): string {
    const s = parseIsoLocal(startIso);
    const e = parseIsoLocal(endIso);
    if (!s || !e) return '';
    return `${formatTimeFromDate(s)} – ${formatTimeFromDate(e)}`;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && aEnd > bStart;
}

/**
 * Find children segments that overlap a given date.
 * Supports multiple slots in the same date as well.
 */
function childrenForDate(
    ev: CalendarEvent,
    dateKey: string,
): Array<{ id: number | string; start: string; end: string }> {
    if (!ev.children || ev.children.length === 0) return [];
    const range = dateRangeForDay(dateKey);
    if (!range) return [];

    const res: Array<{ id: number | string; start: string; end: string }> = [];

    for (const c of ev.children) {
        const s = parseIsoLocal(c.start);
        const e0 = parseIsoLocal(c.end || c.start);
        if (!s || !e0) continue;
        const e = e0.getTime() < s.getTime() ? s : e0;
        if (overlaps(s, e, range.start, range.end)) res.push(c);
    }

    res.sort(
        (a, b) =>
            (parseIsoLocal(a.start)?.getTime() ?? 0) -
            (parseIsoLocal(b.start)?.getTime() ?? 0),
    );
    return res;
}

/**
 * Per-day time label for connected series:
 * - If event has children, show the child slot(s) for that specific date.
 * - Otherwise fall back to clipping the event.
 */
function displayEventTimeForDate(ev: CalendarEvent, dateKey: string): string {
    if (ev.children && ev.children.length > 0) {
        const slots = childrenForDate(ev, dateKey);
        if (slots.length === 0) return '';
        if (slots.length === 1)
            return formatTimeRangeFromIso(slots[0].start, slots[0].end);
        return `${slots.length} slots`;
    }

    return clipEventTimeToDay(ev, dateKey);
}

/**
 * Apply calendar filter:
 * - null/empty => show all
 * - "__blocked__" => blocks only
 * - any other key => bookings with matching status
 */
function applyStatusFilterToEvents(
    allEvents: CalendarEvent[],
    filter: string | null | undefined,
): CalendarEvent[] {
    const f = String(filter || '')
        .toLowerCase()
        .trim();
    if (!f || f === '__all__' || f === 'all') return allEvents || [];

    if (f === '__blocked__' || f === 'blocked' || f === 'unavailable') {
        return (allEvents || []).filter((ev) => normalizeKind(ev) === 'block');
    }

    return (allEvents || []).filter(
        (ev) =>
            normalizeKind(ev) !== 'block' &&
            normalizeStatusKey(ev.status) === f,
    );
}

/**
 * CONNECTED BOOKING SERIES:
 * Merge consecutive bookings that share the same "details key"
 * even if their time blocks differ.
 */
function mergeAdjacentBookings(input: CalendarEvent[]): CalendarEvent[] {
    const blocks: CalendarEvent[] = [];

    type Item = {
        ev: CalendarEvent;
        start: Date;
        end: Date;
        startDay: string;
        endDay: string;
        mergeKey: string;
    };

    const bookings: Item[] = [];

    for (const raw of input || []) {
        const kind = normalizeKind(raw);

        if (kind === 'block') {
            blocks.push({ ...raw, kind: 'block' });
            continue;
        }

        const s = parseIsoLocal(raw.start);
        if (!s) {
            blocks.push({ ...raw, kind: 'booking' });
            continue;
        }

        const e0 = parseIsoLocal(raw.end || raw.start) || s;
        const e = e0.getTime() < s.getTime() ? s : e0;

        const startDay = formatDateKey(startOfDay(s));
        const endForDays =
            e.getTime() > s.getTime() ? new Date(e.getTime() - 1) : e;
        const endDay = formatDateKey(startOfDay(endForDays));

        const gk = String(raw.groupKey || '').trim();
        const mergeKey = gk
            ? `g:${gk}`
            : `t:${raw.title ?? ''}|a:${raw.area ?? ''}|s:${raw.status ?? ''}`;

        bookings.push({
            ev: { ...raw, kind: 'booking' },
            start: s,
            end: e,
            startDay,
            endDay,
            mergeKey,
        });
    }

    const groups = new Map<string, Item[]>();
    for (const b of bookings) {
        const arr = groups.get(b.mergeKey) || [];
        arr.push(b);
        groups.set(b.mergeKey, arr);
    }

    const mergedBookings: CalendarEvent[] = [];

    function pushSpan(span: Item[]) {
        if (span.length === 0) return;

        if (span.length === 1) {
            mergedBookings.push(span[0].ev);
            return;
        }

        let minDay = span[0].startDay;
        let maxDay = span[0].endDay;

        for (const it of span) {
            if (it.startDay < minDay) minDay = it.startDay;
            if (it.endDay > maxDay) maxDay = it.endDay;
        }

        if (minDay === maxDay) {
            span.sort((a, b) => a.start.getTime() - b.start.getTime());
            for (const it of span) mergedBookings.push(it.ev);
            return;
        }

        span.sort((a, b) => a.start.getTime() - b.start.getTime());

        let latest = span[0];
        for (const it of span) {
            if (it.end.getTime() > latest.end.getTime()) latest = it;
        }

        const first = span[0];
        const last = span[span.length - 1];

        mergedBookings.push({
            ...first.ev,
            id: `series:${String(first.ev.id)}:${String(last.ev.id)}:${span.length}`,
            start: first.ev.start,
            end: latest.ev.end,
            merged: true,
            booking_ids: span.map((x) => x.ev.id),
            children: span.map((x) => ({
                id: x.ev.id,
                start: x.ev.start,
                end: x.ev.end,
            })),
        });
    }

    for (const [, list] of groups.entries()) {
        list.sort((a, b) => a.start.getTime() - b.start.getTime());

        let span: Item[] = [];
        let currentEndDay: string | null = null;

        for (const item of list) {
            if (span.length === 0) {
                span = [item];
                currentEndDay = item.endDay;
                continue;
            }

            const expectedNext = currentEndDay
                ? nextDayKey(currentEndDay)
                : null;

            const canConnect = currentEndDay
                ? item.startDay <= currentEndDay ||
                  (expectedNext && item.startDay === expectedNext)
                : false;

            if (canConnect) {
                span.push(item);
                if (currentEndDay && item.endDay > currentEndDay)
                    currentEndDay = item.endDay;
            } else {
                pushSpan(span);
                span = [item];
                currentEndDay = item.endDay;
            }
        }

        pushSpan(span);
    }

    const all = [...blocks, ...mergedBookings];
    all.sort((a, b) => {
        const sa = parseIsoLocal(a.start)?.getTime() ?? 0;
        const sb = parseIsoLocal(b.start)?.getTime() ?? 0;
        return sa - sb;
    });

    return all;
}

/* ---------------------------------------
   Client "booked block" helpers
---------------------------------------- */
function blockRangeForDate(
    dateKey: string,
    key: BlockKey,
): { start: Date; end: Date } | null {
    const day = parseDateKey(dateKey);
    if (!day) return null;

    const start = new Date(day);
    const end = new Date(day);

    if (key === 'AM') {
        start.setHours(6, 0, 0, 0);
        end.setHours(12, 0, 0, 0);
        return { start, end };
    }

    if (key === 'PM') {
        start.setHours(12, 0, 0, 0);
        end.setHours(18, 0, 0, 0);
        return { start, end };
    }

    // EVE: 18:00 -> next day 00:00
    start.setHours(18, 0, 0, 0);
    const endNext = addDays(end, 1);
    endNext.setHours(0, 0, 0, 0);
    return { start, end: endNext };
}

function segmentsOfEventOnDate(
    ev: CalendarEvent,
    dateKey: string,
): Array<{ id: number | string; start: Date; end: Date }> {
    const range = dateRangeForDay(dateKey);
    if (!range) return [];

    const out: Array<{ id: number | string; start: Date; end: Date }> = [];

    const pushClipped = (id: number | string, s: Date, e0: Date) => {
        const e = e0.getTime() < s.getTime() ? s : e0;
        if (!overlaps(s, e, range.start, range.end)) return;

        const cs = s < range.start ? range.start : s;
        const ce = e > range.end ? range.end : e;
        if (ce <= cs) return;

        out.push({ id, start: cs, end: ce });
    };

    if (ev.children && ev.children.length > 0) {
        for (const c of ev.children) {
            const s = parseIsoLocal(c.start);
            const e0 = parseIsoLocal(c.end || c.start);
            if (!s || !e0) continue;
            pushClipped(c.id, s, e0);
        }
        return out;
    }

    const s = parseIsoLocal(ev.start);
    const e0 = parseIsoLocal(ev.end || ev.start);
    if (!s || !e0) return [];
    pushClipped(ev.id, s, e0);

    return out;
}

function computeBookedBlocksForDate(
    dateKey: string,
    bookingEvents: CalendarEvent[],
): {
    booked: Set<BlockKey>;
    byBlock: Record<BlockKey, CalendarEvent[]>;
} {
    const booked = new Set<BlockKey>();
    const byBlock: Record<BlockKey, CalendarEvent[]> = {
        AM: [],
        PM: [],
        EVE: [],
    };

    const am = blockRangeForDate(dateKey, 'AM');
    const pm = blockRangeForDate(dateKey, 'PM');
    const eve = blockRangeForDate(dateKey, 'EVE');

    if (!am || !pm || !eve) return { booked, byBlock };

    const ranges: Record<BlockKey, { start: Date; end: Date }> = {
        AM: am,
        PM: pm,
        EVE: eve,
    };

    const pushUnique = (list: CalendarEvent[], ev: CalendarEvent) => {
        const id = String(ev.id);
        if (!list.some((x) => String(x.id) === id)) list.push(ev);
    };

    for (const ev of bookingEvents || []) {
        if (normalizeKind(ev) === 'block') continue;

        const segs = segmentsOfEventOnDate(ev, dateKey);
        if (segs.length === 0) continue;

        (['AM', 'PM', 'EVE'] as const).forEach((k) => {
            const br = ranges[k];
            const hit = segs.some((seg) =>
                overlaps(seg.start, seg.end, br.start, br.end),
            );
            if (hit) {
                booked.add(k);
                pushUnique(byBlock[k], ev);
            }
        });
    }

    return { booked, byBlock };
}

/* ---------------------------------------
   Component
---------------------------------------- */
export default function BookingCalendar({
    events,
    month,
    monthAvailability,
    statusFilter,
    onStatusFilterChange,
}: {
    events: CalendarEvent[];
    month: string;
    monthAvailability: MonthAvailability;

    /**
     * ✅ Optional filter control from parent (Dashboard).
     * null = All
     * "__blocked__" = blocks only
     * "confirmed", "pending", etc. = bookings only
     */
    statusFilter?: string | null;
    onStatusFilterChange?: (next: string | null) => void;
}) {
    const { props } = usePage<{ auth: Auth }>();

    const roleNames = useMemo(
        () => getRoleNames(props.auth).map((r) => r.toLowerCase()),
        [props.auth],
    );

    const isClient = roleNames.includes('user');
    const isAdmin = roleNames.includes('admin');
    const isManager = roleNames.includes('manager');
    const isStaff = roleNames.includes('staff');

    const isStaffSide = !isClient;
    const canManageBlocks = isAdmin || isManager;
    const canBookFromCalendar = isClient || isAdmin || isManager;

    // ✅ Controlled/uncontrolled filter support
    const [internalFilter, setInternalFilter] = useState<string | null>(null);
    const isControlled = typeof statusFilter !== 'undefined';
    const activeFilter = isControlled ? statusFilter : internalFilter;

    const setFilter = (next: string | null) => {
        if (onStatusFilterChange) onStatusFilterChange(next);
        if (!isControlled) setInternalFilter(next);
    };

    const today = new Date();
    const todayKey = formatDateKey(today);

    const firstOfMonth = useMemo(() => parseMonthKey(month), [month]);
    const { grid, monthLabel } = useMemo(
        () => buildMonthGrid(firstOfMonth),
        [firstOfMonth],
    );

    const weeks = useMemo(() => {
        const w: DayCell[][] = [];
        for (let i = 0; i < 6; i++) w.push(grid.slice(i * 7, i * 7 + 7));
        return w;
    }, [grid]);

    /**
     * ✅ Client: we *never* render "block events" as items on the calendar grid,
     * because the client UI is availability-first. Blocks already affect availability.
     */
    const baseEventsForDisplay = useMemo(() => {
        if (!isClient) return events || [];
        return (events || []).filter((ev) => normalizeKind(ev) !== 'block');
    }, [events, isClient]);

    // ✅ filter events first
    const filteredInputEvents = useMemo(
        () => applyStatusFilterToEvents(baseEventsForDisplay, activeFilter),
        [baseEventsForDisplay, activeFilter],
    );

    // Connect bookings across consecutive days even if time differs
    const displayEvents = useMemo(
        () => mergeAdjacentBookings(filteredInputEvents),
        [filteredInputEvents],
    );

    /**
     * ✅ Client-only: compute which AM/PM/EVE blocks are booked by the current user (their own bookings).
     * This is used to render "Booked" in the month grid, instead of showing it as plain "Unavailable".
     *
     * IMPORTANT:
     * - We intentionally compute this from ALL (unfiltered) client bookings, so it still shows booked blocks
     *   even if the user is filtering by status.
     */
    const clientBookedInfoByDay = useMemo(() => {
        const map = new Map<
            string,
            {
                booked: Set<BlockKey>;
                byBlock: Record<BlockKey, CalendarEvent[]>;
            }
        >();

        if (!isClient) return map;

        const bookings = (events || []).filter(
            (ev) => normalizeKind(ev) !== 'block',
        );

        const byDay = new Map<string, CalendarEvent[]>();
        for (const ev of bookings) {
            const s = parseIsoLocal(ev.start);
            const e0 = parseIsoLocal(ev.end || ev.start);
            if (!s || !e0) continue;
            const e = e0.getTime() < s.getTime() ? s : e0;

            for (const day of eventDays(s, e)) {
                const key = formatDateKey(day);
                const arr = byDay.get(key) || [];
                arr.push(ev);
                byDay.set(key, arr);
            }
        }

        for (const [dayKey, list] of byDay.entries()) {
            map.set(dayKey, computeBookedBlocksForDate(dayKey, list));
        }

        return map;
    }, [events, isClient]);

    // Span cache for multi-day detection
    const spanCache = useMemo(() => {
        const map = new Map<
            string,
            { startDay: string; endDay: string; start: Date; end: Date }
        >();
        for (const ev of displayEvents || []) {
            const s = parseIsoLocal(ev.start);
            const e0 = parseIsoLocal(ev.end || ev.start);
            if (!s || !e0) continue;
            const e = e0.getTime() < s.getTime() ? s : e0;
            const endForDays =
                e.getTime() > s.getTime() ? new Date(e.getTime() - 1) : e;

            const startDay = formatDateKey(startOfDay(s));
            const endDay = formatDateKey(startOfDay(endForDays));

            map.set(String(ev.id), { startDay, endDay, start: s, end: e });
        }
        return map;
    }, [displayEvents]);

    const isMultiDayEvent = (ev: CalendarEvent): boolean => {
        const span = spanCache.get(String(ev.id));
        return !!span && span.startDay !== span.endDay;
    };

    // Events grouped by day (for modal and day-cards)
    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();

        for (const ev of displayEvents || []) {
            const s = parseIsoLocal(ev.start);
            const e = parseIsoLocal(ev.end || ev.start);
            if (!s || !e) continue;

            const start = s;
            const end = e.getTime() < s.getTime() ? s : e;

            for (const day of eventDays(start, end)) {
                const key = formatDateKey(day);
                const arr = map.get(key) || [];
                arr.push(ev);
                map.set(key, arr);
            }
        }

        for (const [key, list] of map.entries()) {
            list.sort((a, b) => {
                const sa = new Date(a.start).getTime();
                const sb = new Date(b.start).getTime();
                if (sa !== sb) return sa - sb;

                const ak = normalizeKind(a);
                const bk = normalizeKind(b);
                if (ak !== bk) return ak === 'block' ? 1 : -1;

                return String(a.id).localeCompare(String(b.id));
            });
            map.set(key, list);
        }

        return map;
    }, [displayEvents]);

    /* ---------------------------------------
     Status summary (counts from RAW events, not filtered)
  ---------------------------------------- */
    const statusSummary = useMemo(() => {
        const bookingCounts: Record<string, number> = {};
        let blockedCount = 0;

        for (const ev of events || []) {
            const kind = normalizeKind(ev);
            if (kind === 'block') {
                blockedCount += 1;
                continue;
            }

            const key = normalizeStatusKey(ev.status);
            bookingCounts[key] = (bookingCounts[key] || 0) + 1;
        }

        const CLIENT_KEYS = [
            'pending',
            'confirmed',
            'declined',
            'cancelled',
            'active',
            'completed',
        ];
        const STAFF_BASE_KEYS = [
            'pending',
            'confirmed',
            'active',
            'completed',
            'declined',
            'cancelled',
        ];

        const baseKeys = isClient ? CLIENT_KEYS : STAFF_BASE_KEYS;

        const known = new Set(baseKeys);
        const extras = Object.keys(bookingCounts)
            .filter((k) => !known.has(k))
            .sort((a, b) => a.localeCompare(b));

        const totalBookings = Object.values(bookingCounts).reduce(
            (s, n) => s + n,
            0,
        );
        const totalItems = totalBookings + (isClient ? 0 : blockedCount);

        type Item = {
            key: string;
            label: string;
            count: number;
            dotClass: string;
            pillClass: string;
        };

        const items: Item[] = [];

        // All
        items.push({
            key: '__all__',
            label: 'All',
            count: totalItems,
            dotClass: 'bg-black dark:bg-white',
            pillClass: 'border-slate-500/15 bg-muted/40 text-foreground',
        });

        for (const k of baseKeys) {
            items.push({
                key: k,
                label: statusLabel(k),
                count: bookingCounts[k] || 0,
                dotClass: statusDot(k),
                pillClass: statusPill(k),
            });
        }

        if (!isClient) {
            for (const k of extras) {
                items.push({
                    key: k,
                    label: statusLabel(k),
                    count: bookingCounts[k] || 0,
                    dotClass: statusDot(k),
                    pillClass: statusPill(k),
                });
            }

            items.push({
                key: '__blocked__',
                label: 'Blocked',
                count: blockedCount,
                dotClass: statusDot('unavailable'),
                pillClass: statusPill('unavailable'),
            });
        }

        return items;
    }, [events, isClient]);

    function isFilterActiveForKey(key: string) {
        if (key === '__all__') return !activeFilter;
        return (
            String(activeFilter || '')
                .toLowerCase()
                .trim() === key
        );
    }

    function toggleFilterKey(key: string) {
        if (key === '__all__') {
            setFilter(null);
            return;
        }

        const isActive = isFilterActiveForKey(key);
        setFilter(isActive ? null : key);
    }

    const activeFilterLabel = activeFilter
        ? statusLabel(String(activeFilter))
        : 'All';

    // Availability modal state
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [availability, setAvailability] = useState<DailyAvailability | null>(
        null,
    );
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState<string | null>(
        null,
    );

    function openDayModal(dateKey: string) {
        setSelectedDate(dateKey);
        setAvailability(null);
        setAvailabilityError(null);
        setAvailabilityLoading(true);

        fetch(`/bookings/availability?date=${encodeURIComponent(dateKey)}`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load availability');
                return res.json();
            })
            .then((json) => setAvailability(json as DailyAvailability))
            .catch(() =>
                setAvailabilityError(
                    'Unable to load availability for this date.',
                ),
            )
            .finally(() => setAvailabilityLoading(false));
    }

    function closeDayModal() {
        setSelectedDate(null);
        setAvailability(null);
        setAvailabilityError(null);
        setAvailabilityLoading(false);
    }

    // Month navigation
    const goToPreviousMonth = () => {
        const prev = new Date(
            firstOfMonth.getFullYear(),
            firstOfMonth.getMonth() - 1,
            1,
        );
        router.get(
            '/dashboard',
            { month: formatMonthKey(prev) },
            { preserveScroll: true, replace: true },
        );
    };

    const goToNextMonth = () => {
        const next = new Date(
            firstOfMonth.getFullYear(),
            firstOfMonth.getMonth() + 1,
            1,
        );
        router.get(
            '/dashboard',
            { month: formatMonthKey(next) },
            { preserveScroll: true, replace: true },
        );
    };

    const goToToday = () => {
        const t = new Date(today.getFullYear(), today.getMonth(), 1);
        router.get(
            '/dashboard',
            { month: formatMonthKey(t) },
            { preserveScroll: true, replace: true },
        );
    };

    // Long-press selection for creating calendar blocks (ADMIN/MANAGER only)
    const longPressTimerRef = useRef<number | null>(null);
    const longPressTriggeredRef = useRef(false);
    const pointerStartRef = useRef<{
        x: number;
        y: number;
        dateKey: string;
    } | null>(null);

    const [isSelectingBlock, setIsSelectingBlock] = useState(false);
    const [selectStart, setSelectStart] = useState<string | null>(null);
    const [selectEnd, setSelectEnd] = useState<string | null>(null);

    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [blockForm, setBlockForm] = useState({
        title: '',
        area: '',
        notes: '',
        block: 'DAY' as 'AM' | 'PM' | 'EVE' | 'DAY',
    });
    const [blockSubmitting, setBlockSubmitting] = useState(false);
    const [blockSubmitError, setBlockSubmitError] = useState<string | null>(
        null,
    );
    const [blockSubmitConflicts, setBlockSubmitConflicts] = useState<string[]>(
        [],
    );

    function clearLongPressTimer() {
        if (longPressTimerRef.current) {
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }

    function normalizedRange(
        a: string,
        b: string,
    ): { from: string; to: string } {
        return a <= b ? { from: a, to: b } : { from: b, to: a };
    }

    function selectionRange(): { from: string; to: string } | null {
        if (!selectStart || !selectEnd) return null;
        return normalizedRange(selectStart, selectEnd);
    }

    function cancelSelectionAndDialog() {
        clearLongPressTimer();
        longPressTriggeredRef.current = false;
        pointerStartRef.current = null;

        setIsSelectingBlock(false);
        setSelectStart(null);
        setSelectEnd(null);

        setBlockDialogOpen(false);
        setBlockSubmitting(false);
        setBlockSubmitError(null);
        setBlockSubmitConflicts([]);
        setBlockForm({ title: '', area: '', notes: '', block: 'DAY' });
    }

    function handleDayPointerDown(
        e: React.PointerEvent<HTMLDivElement>,
        dateKey: string,
    ) {
        if (!canManageBlocks) return;

        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-calendar-event="true"]')) return;
        if (target?.closest('[data-calendar-action="true"]')) return;

        pointerStartRef.current = { x: e.clientX, y: e.clientY, dateKey };
        longPressTriggeredRef.current = false;

        clearLongPressTimer();

        longPressTimerRef.current = window.setTimeout(() => {
            longPressTriggeredRef.current = true;
            setIsSelectingBlock(true);
            setSelectStart(dateKey);
            setSelectEnd(dateKey);
        }, LONG_PRESS_MS);

        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    }

    function handleDayPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!canManageBlocks) return;

        if (!longPressTriggeredRef.current) {
            const s = pointerStartRef.current;
            if (!s) return;

            const dx = e.clientX - s.x;
            const dy = e.clientY - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist >= MOVE_CANCEL_PX) {
                clearLongPressTimer();
            }
            return;
        }

        if (!isSelectingBlock) return;

        const el = document.elementFromPoint(
            e.clientX,
            e.clientY,
        ) as HTMLElement | null;
        const dateEl = el?.closest('[data-date]') as HTMLElement | null;
        const date = dateEl?.getAttribute('data-date');

        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            setSelectEnd(date);
        }
    }

    function handleDayPointerUp(
        e: React.PointerEvent<HTMLDivElement>,
        dateKey: string,
    ) {
        clearLongPressTimer();

        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-calendar-event="true"]')) return;
        if (target?.closest('[data-calendar-action="true"]')) return;

        const wasLongPress = longPressTriggeredRef.current;

        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            // ignore
        }

        if (canManageBlocks && wasLongPress) {
            longPressTriggeredRef.current = false;
            setIsSelectingBlock(false);
            setBlockDialogOpen(true);
            setBlockSubmitError(null);
            setBlockSubmitConflicts([]);
            return;
        }

        openDayModal(dateKey);
    }

    function handleDayPointerCancel(e: React.PointerEvent<HTMLDivElement>) {
        clearLongPressTimer();
        longPressTriggeredRef.current = false;
        setIsSelectingBlock(false);

        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    }

    async function createCalendarBlock() {
        const range = selectionRange();
        if (!range) return;

        setBlockSubmitting(true);
        setBlockSubmitError(null);
        setBlockSubmitConflicts([]);

        const title = blockForm.title.trim();
        const area = blockForm.area.trim();

        if (!title) {
            setBlockSubmitting(false);
            setBlockSubmitError('Please enter a title.');
            return;
        }
        if (!area) {
            setBlockSubmitting(false);
            setBlockSubmitError('Please enter an area.');
            return;
        }

        const csrfHeaders = getCsrfHeaders();

        try {
            const res = await fetch('/calendar-blocks', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...csrfHeaders,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    title,
                    area,
                    notes: blockForm.notes.trim() || null,
                    block: blockForm.block,
                    date_from: range.from,
                    date_to: range.to,
                }),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok) {
                if (res.status === 419) {
                    setBlockSubmitError(
                        'Session expired (CSRF). Refresh the page and try again.',
                    );
                    setBlockSubmitting(false);
                    return;
                }

                const conflicts: string[] =
                    (json?.errors?.conflicts as string[]) || [];
                if (conflicts.length) setBlockSubmitConflicts(conflicts);

                setBlockSubmitError(json?.message || 'Unable to create block.');
                setBlockSubmitting(false);
                return;
            }

            setBlockSubmitting(false);
            setBlockDialogOpen(false);

            router.reload({ only: ['events', 'monthAvailability'] });

            setSelectStart(null);
            setSelectEnd(null);
            setBlockForm({ title: '', area: '', notes: '', block: 'DAY' });
        } catch {
            setBlockSubmitting(false);
            setBlockSubmitError('Network error. Please try again.');
        }
    }

    async function deleteCalendarBlock(blockId: number) {
        if (!canManageBlocks) return;

        const csrfHeaders = getCsrfHeaders();

        try {
            const res = await fetch(`/calendar-blocks/${blockId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    ...csrfHeaders,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!res.ok) return;

            router.reload({ only: ['events', 'monthAvailability'] });
        } catch {
            // ignore
        }
    }

    const activeRange =
        isSelectingBlock || blockDialogOpen ? selectionRange() : null;

    // -------- Render helpers --------
    function dayAvailability(dateKey: string) {
        const av = monthAvailability?.[dateKey];
        const AM = av?.AM ?? true;
        const PM = av?.PM ?? true;
        const eveOnlyExtension = !AM && !PM && (av?.EVE ?? true) !== false;
        const EVE = eveOnlyExtension ? false : (av?.EVE ?? true);
        const isFullyBooked =
            (av?.is_fully_booked ?? false) || (!AM && !PM && !EVE);
        return { AM, PM, EVE, isFullyBooked };
    }

    function isPast(dateKey: string) {
        return dateKey < todayKey;
    }

    function openBookingById(id: number | string) {
        if (typeof id === 'number' || /^\d+$/.test(String(id))) {
            router.visit(`/bookings/${id}`);
        }
    }

    function openBooking(ev: CalendarEvent) {
        if (normalizeKind(ev) === 'block') return;
        const idToOpen = ev.booking_ids?.[0] ?? ev.children?.[0]?.id ?? ev.id;
        openBookingById(idToOpen);
    }

    function quickBookFirstAvailable(
        dateKey: string,
        AM: boolean,
        PM: boolean,
        EVE: boolean,
    ) {
        if (!canBookFromCalendar) return;
        if (isPast(dateKey)) return;

        if (AM) return goToCreateBooking(dateKey, '06:00', '12:00');
        if (PM) return goToCreateBooking(dateKey, '12:00', '18:00');
        if (EVE) return goToCreateBooking(dateKey, '18:00', '23:59');
    }

    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="flex h-full w-full min-w-0 flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToPreviousMonth}
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[160px] text-center text-sm font-semibold">
                        {monthLabel}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToNextMonth}
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Badge
                        className={cn(
                            'hidden sm:inline-flex',
                            isClient
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-700 text-white',
                        )}
                    >
                        {isClient
                            ? 'Client view'
                            : isAdmin
                              ? 'Admin view'
                              : isManager
                                ? 'Manager view'
                                : isStaff
                                  ? 'Staff view'
                                  : 'Staff view'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                </div>
            </div>

            {/* ✅ Clickable Status / Filter row */}
            <div className="border-b px-3 py-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <span className="mr-1 text-[11px] text-muted-foreground">
                        Filter:
                    </span>

                    {statusSummary.map((it) => {
                        const active = isFilterActiveForKey(it.key);

                        return (
                            <button
                                key={it.key}
                                type="button"
                                data-calendar-action="true"
                                aria-pressed={active}
                                onClick={() => toggleFilterKey(it.key)}
                                className={cn(
                                    'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition-colors',
                                    it.pillClass,
                                    active
                                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                                        : 'hover:bg-muted/40',
                                )}
                                title={
                                    active
                                        ? `Showing: ${it.label} (click to clear)`
                                        : `Show only: ${it.label}`
                                }
                            >
                                <span
                                    className={cn(
                                        'h-2 w-2 rounded-full',
                                        it.dotClass,
                                    )}
                                />
                                <span className="font-medium">{it.label}</span>
                                <span className="ml-1 font-semibold tabular-nums">
                                    {it.count}
                                </span>
                            </button>
                        );
                    })}

                    <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="hidden sm:inline">
                            Showing:{' '}
                            <span className="font-semibold text-foreground">
                                {activeFilterLabel}
                            </span>
                        </span>

                        {!!activeFilter && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px]"
                                onClick={() => setFilter(null)}
                                title="Clear filter"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend / helper line */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-[11px] text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                    {isClient ? (
                        <>
                            <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-2 rounded bg-emerald-600" />{' '}
                                Available
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-2 rounded bg-slate-400" />{' '}
                                Unavailable
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-2 rounded bg-slate-700" />{' '}
                                Booked (you)
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="inline-flex items-center gap-1">
                                <span
                                    className={cn(
                                        'h-2 w-2 rounded',
                                        statusDot('pending'),
                                    )}
                                />{' '}
                                Pending
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span
                                    className={cn(
                                        'h-2 w-2 rounded',
                                        statusDot('confirmed'),
                                    )}
                                />{' '}
                                Confirmed
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span
                                    className={cn(
                                        'h-2 w-2 rounded',
                                        statusDot('active'),
                                    )}
                                />{' '}
                                Active
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span
                                    className={cn(
                                        'h-2 w-2 rounded',
                                        statusDot('completed'),
                                    )}
                                />{' '}
                                Completed
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span
                                    className={cn(
                                        'h-2 w-2 rounded',
                                        statusDot('unavailable'),
                                    )}
                                />{' '}
                                Blocked
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Info className="h-3 w-3" />
                    {isClient ? (
                        <span>
                            Tap a date to view AM / PM / EVE and book an
                            available slot.
                        </span>
                    ) : canManageBlocks ? (
                        <span>
                            Admin/Manager: click ➕ to quick-book. Hold 1 sec
                            then drag to create blocks.
                        </span>
                    ) : (
                        <span>
                            Staff: view-only. Click a date or an event chip to
                            view details.
                        </span>
                    )}
                </div>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 border-t bg-background text-xs">
                {weekdayLabels.map((d) => (
                    <div
                        key={d}
                        className="border-r bg-muted/40 px-2 py-1 font-medium last:border-r-0"
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 overflow-auto border-t">
                {weeks.map((week, weekIdx) => {
                    // ----- Compute multi-day bar lanes for this week (staff side) -----
                    const weekKeys = week.map((cell) =>
                        cell.date ? formatDateKey(cell.date) : null,
                    );
                    const weekStartKey =
                        weekKeys.find((k) => k !== null) || null;
                    const weekEndKey =
                        [...weekKeys].reverse().find((k) => k !== null) || null;

                    type WeekBar = {
                        ev: CalendarEvent;
                        startIdx: number;
                        endIdx: number;
                        clipStart: boolean;
                        clipEnd: boolean;
                        segmentStartKey: string;
                        segmentEndKey: string;
                    };

                    const weekBars: WeekBar[] = [];

                    if (isStaffSide && weekStartKey && weekEndKey) {
                        for (const ev of displayEvents) {
                            if (!isMultiDayEvent(ev)) continue;

                            const span = spanCache.get(String(ev.id));
                            if (!span) continue;

                            if (
                                span.endDay < weekStartKey ||
                                span.startDay > weekEndKey
                            )
                                continue;

                            const clipStart = span.startDay < weekStartKey;
                            const clipEnd = span.endDay > weekEndKey;

                            const segmentStartKey = clipStart
                                ? weekStartKey
                                : span.startDay;
                            const segmentEndKey = clipEnd
                                ? weekEndKey
                                : span.endDay;

                            const startIdx = weekKeys.indexOf(segmentStartKey);
                            const endIdx = weekKeys.indexOf(segmentEndKey);

                            if (startIdx < 0 || endIdx < 0 || startIdx > endIdx)
                                continue;

                            weekBars.push({
                                ev,
                                startIdx,
                                endIdx,
                                clipStart,
                                clipEnd,
                                segmentStartKey,
                                segmentEndKey,
                            });
                        }

                        weekBars.sort((a, b) => {
                            if (a.startIdx !== b.startIdx)
                                return a.startIdx - b.startIdx;
                            const aLen = a.endIdx - a.startIdx;
                            const bLen = b.endIdx - b.startIdx;
                            return bLen - aLen;
                        });
                    }

                    // lane assignment
                    const lanes: WeekBar[][] = [];
                    const occ: boolean[][] = [];

                    function canPlace(
                        laneOcc: boolean[],
                        s: number,
                        e: number,
                    ) {
                        for (let i = s; i <= e; i++) {
                            if (laneOcc[i]) return false;
                        }
                        return true;
                    }

                    function place(laneOcc: boolean[], s: number, e: number) {
                        for (let i = s; i <= e; i++) laneOcc[i] = true;
                    }

                    for (const bar of weekBars) {
                        let laneIndex = 0;
                        for (;;) {
                            if (!occ[laneIndex]) {
                                occ[laneIndex] = Array(7).fill(false);
                                lanes[laneIndex] = [];
                            }

                            if (
                                canPlace(
                                    occ[laneIndex],
                                    bar.startIdx,
                                    bar.endIdx,
                                )
                            ) {
                                place(occ[laneIndex], bar.startIdx, bar.endIdx);
                                lanes[laneIndex].push(bar);
                                break;
                            }

                            laneIndex++;
                        }
                    }

                    const barHeight =
                        lanes.length > 0
                            ? lanes.length * BAR_ROW_H +
                              Math.max(0, lanes.length - 1) * BAR_ROW_GAP
                            : 0;

                    return (
                        <div key={`week-${weekIdx}`} className="relative">
                            {/* Multi-day bars overlay (staff side only) */}
                            {isStaffSide && lanes.length > 0 && (
                                <div
                                    className="pointer-events-none absolute inset-x-0 z-20 px-1"
                                    style={{ top: BAR_TOP_PX }}
                                >
                                    <div className="space-y-1">
                                        {lanes.map((lane, laneIdx) => (
                                            <div
                                                key={`lane-${laneIdx}`}
                                                className="grid grid-cols-7 gap-1"
                                            >
                                                {lane.map((bar) => {
                                                    const spanCols =
                                                        bar.endIdx -
                                                        bar.startIdx +
                                                        1;
                                                    const isBlock =
                                                        normalizeKind(
                                                            bar.ev,
                                                        ) === 'block';
                                                    const isSeries =
                                                        !!bar.ev.children &&
                                                        bar.ev.children.length >
                                                            1;

                                                    const roundLeft =
                                                        bar.clipStart
                                                            ? 'rounded-l-none'
                                                            : 'rounded-l-md';
                                                    const roundRight =
                                                        bar.clipEnd
                                                            ? 'rounded-r-none'
                                                            : 'rounded-r-md';

                                                    const span = spanCache.get(
                                                        String(bar.ev.id),
                                                    );
                                                    const rangeLabel = span
                                                        ? `${span.startDay} → ${span.endDay}`
                                                        : `${bar.segmentStartKey} → ${bar.segmentEndKey}`;

                                                    const titleText = isBlock
                                                        ? `Blocked: ${bar.ev.title}`
                                                        : isSeries
                                                          ? `Connected series (${bar.ev.children!.length} slots): ${bar.ev.title} (${rangeLabel})`
                                                          : `${bar.ev.title} (${rangeLabel})`;

                                                    return (
                                                        <button
                                                            key={`bar-${String(bar.ev.id)}-${bar.segmentStartKey}-${bar.segmentEndKey}`}
                                                            type="button"
                                                            data-calendar-event="true"
                                                            className={cn(
                                                                'pointer-events-auto h-5 w-full overflow-hidden border px-2 text-left text-[11px] leading-5',
                                                                statusPill(
                                                                    bar.ev
                                                                        .status,
                                                                ),
                                                                roundLeft,
                                                                roundRight,
                                                                'hover:bg-muted/40',
                                                            )}
                                                            style={{
                                                                gridColumn: `${bar.startIdx + 1} / span ${spanCols}`,
                                                            }}
                                                            title={titleText}
                                                            onClick={(e) => {
                                                                e.stopPropagation();

                                                                if (
                                                                    !isBlock &&
                                                                    isSeries
                                                                ) {
                                                                    openDayModal(
                                                                        bar.segmentStartKey,
                                                                    );
                                                                    return;
                                                                }

                                                                if (!isBlock) {
                                                                    openBooking(
                                                                        bar.ev,
                                                                    );
                                                                    return;
                                                                }

                                                                openDayModal(
                                                                    bar.segmentStartKey,
                                                                );
                                                            }}
                                                        >
                                                            <span className="inline-flex items-center gap-2">
                                                                <span
                                                                    className={cn(
                                                                        'h-2 w-2 rounded-full',
                                                                        statusDot(
                                                                            bar
                                                                                .ev
                                                                                .status,
                                                                        ),
                                                                    )}
                                                                />
                                                                <span className="truncate">
                                                                    {isBlock
                                                                        ? `BLOCK • ${bar.ev.title}`
                                                                        : isSeries
                                                                          ? `${bar.ev.title} (${bar.ev.children!.length})`
                                                                          : bar
                                                                                .ev
                                                                                .title}
                                                                </span>
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Week row */}
                            <div className="grid grid-cols-7 border-b">
                                {week.map((cell) => {
                                    const isBlank = !cell.date;
                                    const dateKey = cell.date
                                        ? formatDateKey(cell.date)
                                        : cell.key;

                                    const todayCell =
                                        !!cell.date && dateKey === todayKey;
                                    const pastCell =
                                        !!cell.date && isPast(dateKey);
                                    const weekendCell =
                                        !!cell.date &&
                                        (cell.date.getDay() === 0 ||
                                            cell.date.getDay() === 6);

                                    const { AM, PM, EVE, isFullyBooked } =
                                        cell.date
                                            ? dayAvailability(dateKey)
                                            : {
                                                  AM: true,
                                                  PM: true,
                                                  EVE: true,
                                                  isFullyBooked: false,
                                              };

                                    const dayEvents = cell.date
                                        ? eventsByDay.get(dateKey) || []
                                        : [];
                                    const timedEvents = isStaffSide
                                        ? dayEvents.filter(
                                              (ev) => !isMultiDayEvent(ev),
                                          )
                                        : dayEvents;

                                    const inRange =
                                        !!cell.date &&
                                        !!activeRange &&
                                        dateKey >= activeRange.from &&
                                        dateKey <= activeRange.to;

                                    const baseCls =
                                        'relative min-h-[150px] sm:min-h-[160px] border-r last:border-r-0 transition-colors select-none';
                                    const bgCls = isBlank
                                        ? 'bg-muted/10'
                                        : weekendCell
                                          ? 'bg-muted/20'
                                          : 'bg-background';

                                    const clickableCls = isBlank
                                        ? ''
                                        : 'cursor-pointer hover:bg-muted/40';
                                    const todayCls = todayCell
                                        ? 'ring-1 ring-primary ring-offset-2 ring-offset-background'
                                        : '';
                                    const pastCls = pastCell
                                        ? 'opacity-60'
                                        : '';
                                    const rangeCls = inRange
                                        ? 'bg-primary/5 ring-1 ring-primary/30'
                                        : '';

                                    const fullBadge =
                                        !isBlank && isFullyBooked ? (
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    'absolute top-2 right-2 px-2 py-0.5 text-[10px]',
                                                    isClient
                                                        ? 'bg-slate-700 text-white'
                                                        : 'bg-slate-600 text-white',
                                                )}
                                            >
                                                FULL
                                            </Badge>
                                        ) : null;

                                    const showQuickBook =
                                        !isBlank &&
                                        !pastCell &&
                                        !isFullyBooked &&
                                        (AM || PM || EVE) &&
                                        (isAdmin || isManager) &&
                                        !isClient;

                                    // Client "my booked blocks" info (computed from all client bookings, not filtered)
                                    const bookedInfo = isClient
                                        ? clientBookedInfoByDay.get(dateKey)
                                        : undefined;
                                    const bookedSet =
                                        bookedInfo?.booked ??
                                        new Set<BlockKey>();

                                    // Client display bookings (filtered by status filter, via dayEvents)
                                    const clientBookingsForDisplay = isClient
                                        ? dayEvents.filter(
                                              (ev) =>
                                                  normalizeKind(ev) !== 'block',
                                          )
                                        : [];

                                    return (
                                        <div
                                            key={cell.key}
                                            data-date={
                                                cell.date ? dateKey : undefined
                                            }
                                            className={cn(
                                                baseCls,
                                                bgCls,
                                                clickableCls,
                                                todayCls,
                                                pastCls,
                                                rangeCls,
                                            )}
                                            onPointerDown={(e) =>
                                                cell.date &&
                                                handleDayPointerDown(e, dateKey)
                                            }
                                            onPointerMove={handleDayPointerMove}
                                            onPointerUp={(e) =>
                                                cell.date &&
                                                handleDayPointerUp(e, dateKey)
                                            }
                                            onPointerCancel={
                                                handleDayPointerCancel
                                            }
                                        >
                                            {fullBadge}

                                            <div
                                                className={cn(
                                                    'flex h-full flex-col p-2',
                                                    isBlank && 'p-2',
                                                )}
                                            >
                                                {/* Day header */}
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs font-semibold">
                                                        {cell.date
                                                            ? cell.date.getDate()
                                                            : ''}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        {showQuickBook && (
                                                            <button
                                                                type="button"
                                                                data-calendar-action="true"
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded border bg-background hover:bg-muted/40"
                                                                title="Quick book (first available slot)"
                                                                onPointerDown={(
                                                                    e,
                                                                ) =>
                                                                    e.stopPropagation()
                                                                }
                                                                onPointerUp={(
                                                                    e,
                                                                ) =>
                                                                    e.stopPropagation()
                                                                }
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    quickBookFirstAvailable(
                                                                        dateKey,
                                                                        AM,
                                                                        PM,
                                                                        EVE,
                                                                    );
                                                                }}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </button>
                                                        )}

                                                        {todayCell && (
                                                            <span className="rounded-full bg-primary/15 px-2 py-[1px] text-[10px] text-primary">
                                                                Today
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Reserve space for multi-day bars (staff side only) */}
                                                {isStaffSide &&
                                                    barHeight > 0 && (
                                                        <div
                                                            aria-hidden
                                                            className="mt-1"
                                                            style={{
                                                                height: barHeight,
                                                            }}
                                                        />
                                                    )}

                                                {/* Body */}
                                                {!isBlank && isClient ? (
                                                    // ✅ CLIENT VIEW: availability-first + "MY BOOKED" blocks + quick peek bookings
                                                    <div className="mt-2 flex flex-1 flex-col gap-2">
                                                        {/* My bookings preview (from filtered calendar events) */}
                                                        {clientBookingsForDisplay.length >
                                                        0 ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                                                                        My
                                                                        booking
                                                                        {clientBookingsForDisplay.length >
                                                                        1
                                                                            ? 's'
                                                                            : ''}
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                                                        {
                                                                            clientBookingsForDisplay.length
                                                                        }
                                                                    </span>
                                                                </div>

                                                                {clientBookingsForDisplay
                                                                    .slice(0, 2)
                                                                    .map(
                                                                        (
                                                                            ev,
                                                                        ) => {
                                                                            const time =
                                                                                displayEventTimeForDate(
                                                                                    ev,
                                                                                    dateKey,
                                                                                );
                                                                            const status =
                                                                                statusLabel(
                                                                                    normalizeStatusKey(
                                                                                        ev.status,
                                                                                    ),
                                                                                );
                                                                            return (
                                                                                <button
                                                                                    key={`my-booking-${String(ev.id)}`}
                                                                                    type="button"
                                                                                    data-calendar-event="true"
                                                                                    className={cn(
                                                                                        'w-full rounded-md border px-2 py-1 text-left text-[11px] transition-colors hover:bg-muted/40',
                                                                                        myBookedChip(),
                                                                                    )}
                                                                                    onClick={(
                                                                                        e,
                                                                                    ) => {
                                                                                        e.stopPropagation();
                                                                                        openBooking(
                                                                                            ev,
                                                                                        );
                                                                                    }}
                                                                                    title="Open booking"
                                                                                >
                                                                                    <div className="truncate font-medium">
                                                                                        {time
                                                                                            ? `${time} • `
                                                                                            : ''}
                                                                                        {
                                                                                            ev.title
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-[10px] opacity-90">
                                                                                        Status:{' '}
                                                                                        {
                                                                                            status
                                                                                        }
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        },
                                                                    )}

                                                                {clientBookingsForDisplay.length >
                                                                    2 && (
                                                                    <div className="text-[10px] text-muted-foreground">
                                                                        +
                                                                        {clientBookingsForDisplay.length -
                                                                            2}{' '}
                                                                        more…
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] text-muted-foreground">
                                                                No bookings
                                                            </div>
                                                        )}

                                                        {/* AM/PM/EVE availability (shows "Booked" for user's own bookings) */}
                                                        <div className="grid grid-rows-3 gap-1">
                                                            {(
                                                                [
                                                                    'AM',
                                                                    'PM',
                                                                    'EVE',
                                                                ] as const
                                                            ).map((k) => {
                                                                const available =
                                                                    k === 'AM'
                                                                        ? AM
                                                                        : k ===
                                                                            'PM'
                                                                          ? PM
                                                                          : EVE;
                                                                const isBookedByMe =
                                                                    bookedSet.has(
                                                                        k,
                                                                    );

                                                                const cls =
                                                                    isBookedByMe
                                                                        ? myBookedChip()
                                                                        : availabilityChip(
                                                                              available,
                                                                          );
                                                                const label =
                                                                    isBookedByMe
                                                                        ? 'Booked'
                                                                        : available
                                                                          ? 'Available'
                                                                          : 'Unavailable';

                                                                return (
                                                                    <div
                                                                        key={k}
                                                                        className={cn(
                                                                            'flex items-center justify-between rounded-md border px-2 py-1 text-[11px]',
                                                                            cls,
                                                                        )}
                                                                    >
                                                                        <span className="font-semibold">
                                                                            {k}
                                                                        </span>
                                                                        <span className="text-[10px]">
                                                                            {
                                                                                label
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {pastCell && (
                                                            <div className="text-[10px] text-muted-foreground">
                                                                Past date
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : !isBlank ? (
                                                    // STAFF/ADMIN VIEW: schedule-first
                                                    <div className="mt-2 flex flex-1 flex-col gap-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] text-muted-foreground">
                                                                Schedule
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {dayEvents.length >
                                                                0
                                                                    ? `${dayEvents.length} item${dayEvents.length > 1 ? 's' : ''}`
                                                                    : '—'}
                                                            </span>
                                                        </div>

                                                        {/* Event chips (single-day only; multi-day are bars above) */}
                                                        <div className="flex-1 space-y-1">
                                                            {timedEvents
                                                                .slice(0, 3)
                                                                .map((ev) => {
                                                                    const time =
                                                                        clipEventTimeToDay(
                                                                            ev,
                                                                            dateKey,
                                                                        );
                                                                    const pill =
                                                                        statusPill(
                                                                            ev.status,
                                                                        );
                                                                    const dot =
                                                                        statusDot(
                                                                            ev.status,
                                                                        );

                                                                    const isBooking =
                                                                        normalizeKind(
                                                                            ev,
                                                                        ) !==
                                                                        'block';

                                                                    return (
                                                                        <button
                                                                            key={`chip-${String(ev.id)}`}
                                                                            type="button"
                                                                            data-calendar-event="true"
                                                                            className={cn(
                                                                                'w-full rounded-md border px-2 py-1 text-left text-[11px] transition-colors hover:bg-muted/40',
                                                                                pill,
                                                                            )}
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                if (
                                                                                    isBooking
                                                                                )
                                                                                    openBooking(
                                                                                        ev,
                                                                                    );
                                                                                else
                                                                                    openDayModal(
                                                                                        dateKey,
                                                                                    );
                                                                            }}
                                                                            title={
                                                                                ev.title
                                                                            }
                                                                        >
                                                                            <div className="flex items-start gap-2">
                                                                                <span
                                                                                    className={cn(
                                                                                        'mt-[3px] h-2 w-2 rounded-full',
                                                                                        dot,
                                                                                    )}
                                                                                />
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="truncate font-medium">
                                                                                        {time
                                                                                            ? `${time} • `
                                                                                            : ''}
                                                                                        {
                                                                                            ev.title
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}

                                                            {timedEvents.length ===
                                                                0 && (
                                                                <div className="rounded-md border border-dashed p-2 text-[11px] text-muted-foreground">
                                                                    No timed
                                                                    items
                                                                </div>
                                                            )}

                                                            {timedEvents.length >
                                                                3 && (
                                                                <div className="text-[10px] text-muted-foreground">
                                                                    +
                                                                    {timedEvents.length -
                                                                        3}{' '}
                                                                    more…
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Availability dots */}
                                                        <div className="mt-1 flex items-center justify-between">
                                                            <div
                                                                className="flex items-center gap-1"
                                                                title="AM / PM / EVE availability"
                                                            >
                                                                {(
                                                                    [
                                                                        'AM',
                                                                        'PM',
                                                                        'EVE',
                                                                    ] as const
                                                                ).map((k) => {
                                                                    const available =
                                                                        k ===
                                                                        'AM'
                                                                            ? AM
                                                                            : k ===
                                                                                'PM'
                                                                              ? PM
                                                                              : EVE;
                                                                    return (
                                                                        <span
                                                                            key={
                                                                                k
                                                                            }
                                                                            className={cn(
                                                                                'h-2 w-2 rounded-full',
                                                                                available
                                                                                    ? 'bg-emerald-600/80'
                                                                                    : 'bg-slate-400/80',
                                                                            )}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>

                                                            {pastCell && (
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    Past
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 flex-1" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Day Modal */}
            {selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
                    <div className="w-full max-w-2xl overflow-hidden rounded-xl border bg-background shadow-lg">
                        {/* modal header */}
                        <div className="flex items-start justify-between gap-3 border-b p-4">
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    {isClient
                                        ? 'Pick a schedule'
                                        : 'Day schedule'}
                                </div>
                                <div className="text-base font-semibold">
                                    {formatLocalDateLabel(selectedDate)}
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {!isClient && (
                                        <Badge className="bg-slate-700 text-white">
                                            {canBookFromCalendar
                                                ? 'Quick booking enabled'
                                                : 'View only'}
                                        </Badge>
                                    )}
                                    {canManageBlocks && !isClient && (
                                        <Badge className="bg-amber-600 text-white">
                                            Block tools enabled
                                        </Badge>
                                    )}
                                    {!!activeFilter && (
                                        <Badge className="bg-primary text-white">
                                            Filter: {activeFilterLabel}
                                        </Badge>
                                    )}
                                </div>

                                {selectedDate < todayKey && (
                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                        Past date — view only.
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={closeDayModal}
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="max-h-[75vh] overflow-auto p-4">
                            {availabilityLoading && (
                                <p className="text-sm">Loading…</p>
                            )}
                            {availabilityError && (
                                <p className="text-sm text-destructive">
                                    {availabilityError}
                                </p>
                            )}

                            {!availabilityLoading &&
                                !availabilityError &&
                                (() => {
                                    const isPastDate = selectedDate < todayKey;

                                    const monthAv =
                                        monthAvailability?.[selectedDate];
                                    const blocksFromApi: Partial<
                                        Record<BlockKey, AvailabilityBlock>
                                    > = availability?.blocks || {};

                                    const myBookedInfo = isClient
                                        ? clientBookedInfoByDay.get(
                                              selectedDate,
                                          )
                                        : undefined;
                                    const myBookedSet =
                                        myBookedInfo?.booked ??
                                        new Set<BlockKey>();
                                    const myBookedByBlock =
                                        myBookedInfo?.byBlock ??
                                        ({ AM: [], PM: [], EVE: [] } as Record<
                                            BlockKey,
                                            CalendarEvent[]
                                        >);

                                    const blocks: Array<{
                                        key: BlockKey;
                                        label: string;
                                        from: string;
                                        to: string;
                                        isAvailable: boolean;
                                        isBookedByMe: boolean;
                                        bookedEvents: CalendarEvent[];
                                    }> = (['AM', 'PM', 'EVE'] as const).map(
                                        (k) => {
                                            const api = blocksFromApi[k];
                                            const apiAvail = api?.is_available;

                                            const isAvailable =
                                                typeof apiAvail === 'boolean'
                                                    ? apiAvail
                                                    : typeof monthAv?.[k] ===
                                                        'boolean'
                                                      ? monthAv[k]
                                                      : true;

                                            const isBookedByMe =
                                                myBookedSet.has(k);
                                            const bookedEvents =
                                                myBookedByBlock[k] || [];

                                            return {
                                                key: k,
                                                label:
                                                    api?.label ||
                                                    (k === 'AM'
                                                        ? 'Morning'
                                                        : k === 'PM'
                                                          ? 'Afternoon'
                                                          : 'Evening'),
                                                from:
                                                    api?.from ||
                                                    (k === 'AM'
                                                        ? '06:00'
                                                        : k === 'PM'
                                                          ? '12:00'
                                                          : '18:00'),
                                                to:
                                                    api?.to ||
                                                    (k === 'AM'
                                                        ? '12:00'
                                                        : k === 'PM'
                                                          ? '18:00'
                                                          : '23:59'),
                                                isAvailable,
                                                isBookedByMe,
                                                bookedEvents,
                                            };
                                        },
                                    );

                                    const fullyBooked =
                                        typeof availability?.is_fully_booked ===
                                        'boolean'
                                            ? availability.is_fully_booked
                                            : blocks.every(
                                                  (b) => !b.isAvailable,
                                              );

                                    const dayEvents =
                                        eventsByDay.get(selectedDate) || [];
                                    const connectedSeries = dayEvents.filter(
                                        (ev) =>
                                            !!ev.children &&
                                            ev.children.length > 1,
                                    );

                                    return (
                                        <div className="space-y-4">
                                            {/* Availability / blocks */}
                                            <div>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div className="text-sm font-semibold">
                                                        AM / PM / EVE
                                                    </div>
                                                    {!isClient && (
                                                        <Badge
                                                            className={cn(
                                                                canBookFromCalendar
                                                                    ? 'bg-emerald-600 text-white'
                                                                    : 'bg-slate-700 text-white',
                                                            )}
                                                        >
                                                            {canBookFromCalendar
                                                                ? 'Book enabled'
                                                                : 'View only'}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                    {blocks.map((b) => {
                                                        const disabled =
                                                            !canBookFromCalendar ||
                                                            isPastDate ||
                                                            fullyBooked ||
                                                            (!b.isAvailable &&
                                                                !b.isBookedByMe) ||
                                                            b.isBookedByMe;

                                                        const ctaLabel =
                                                            b.isBookedByMe
                                                                ? 'Booked'
                                                                : isClient
                                                                  ? `Book ${b.key}`
                                                                  : `Create ${b.key}`;

                                                        const preview =
                                                            buildCreatePreview(
                                                                selectedDate,
                                                                b.from,
                                                                b.to,
                                                            );

                                                        const badgeLabel =
                                                            b.isBookedByMe
                                                                ? 'Booked (you)'
                                                                : b.isAvailable
                                                                  ? 'Available'
                                                                  : 'Unavailable';
                                                        const badgeCls =
                                                            b.isBookedByMe
                                                                ? myBookedChip()
                                                                : b.isAvailable
                                                                  ? 'bg-emerald-600 text-white'
                                                                  : 'bg-slate-500 text-white';

                                                        const openFirstBooked =
                                                            () => {
                                                                const ev =
                                                                    b
                                                                        .bookedEvents?.[0];
                                                                if (ev)
                                                                    openBooking(
                                                                        ev,
                                                                    );
                                                            };

                                                        return (
                                                            <div
                                                                key={b.key}
                                                                className="rounded-lg border p-3"
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <div className="text-sm font-semibold">
                                                                            {
                                                                                b.key
                                                                            }
                                                                        </div>
                                                                        <div className="text-[11px] text-muted-foreground">
                                                                            {
                                                                                b.label
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className={cn(
                                                                            'text-[10px]',
                                                                            badgeCls,
                                                                        )}
                                                                    >
                                                                        {
                                                                            badgeLabel
                                                                        }
                                                                    </Badge>
                                                                </div>

                                                                <div className="mt-2 text-[11px] text-muted-foreground">
                                                                    {b.from} –{' '}
                                                                    {b.to}
                                                                </div>

                                                                {preview && (
                                                                    <div className="mt-2 rounded-md border bg-muted/20 px-2 py-1 text-[10px] text-muted-foreground">
                                                                        <div className="text-[10px] font-semibold">
                                                                            Create
                                                                            booking
                                                                            will
                                                                            prefill:
                                                                        </div>
                                                                        <div>
                                                                            {
                                                                                preview.startLabel
                                                                            }{' '}
                                                                            →{' '}
                                                                            {
                                                                                preview.endLabel
                                                                            }
                                                                        </div>
                                                                        {preview.note && (
                                                                            <div className="mt-0.5">
                                                                                {
                                                                                    preview.note
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {canBookFromCalendar && (
                                                                    <div className="mt-3 space-y-2">
                                                                        {/* If booked by me, offer quick open */}
                                                                        {b.isBookedByMe &&
                                                                        b
                                                                            .bookedEvents
                                                                            .length >
                                                                            0 ? (
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="w-full"
                                                                                onClick={
                                                                                    openFirstBooked
                                                                                }
                                                                                title="Open your booking"
                                                                            >
                                                                                Open
                                                                                booking
                                                                            </Button>
                                                                        ) : (
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                className="w-full"
                                                                                disabled={
                                                                                    disabled
                                                                                }
                                                                                onClick={() =>
                                                                                    !disabled &&
                                                                                    goToCreateBooking(
                                                                                        selectedDate,
                                                                                        b.from,
                                                                                        b.to,
                                                                                    )
                                                                                }
                                                                                title={
                                                                                    isPastDate
                                                                                        ? 'Past date'
                                                                                        : b.isBookedByMe
                                                                                          ? 'Already booked by you'
                                                                                          : !b.isAvailable
                                                                                            ? 'Unavailable'
                                                                                            : fullyBooked
                                                                                              ? 'Fully booked'
                                                                                              : 'Create booking'
                                                                                }
                                                                            >
                                                                                {
                                                                                    ctaLabel
                                                                                }
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {fullyBooked && (
                                                    <p className="mt-2 text-[11px] text-muted-foreground">
                                                        This date is fully
                                                        booked.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Connected booking series summary */}
                                            {connectedSeries.length > 0 && (
                                                <div className="rounded-xl border p-3">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <div className="text-sm font-semibold">
                                                            Connected bookings
                                                        </div>
                                                        <Badge className="bg-slate-700 text-white">
                                                            {
                                                                connectedSeries.length
                                                            }{' '}
                                                            series
                                                        </Badge>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {connectedSeries.map(
                                                            (ev) => {
                                                                const span =
                                                                    spanCache.get(
                                                                        String(
                                                                            ev.id,
                                                                        ),
                                                                    );
                                                                const rangeLabel =
                                                                    span
                                                                        ? `${formatCompactDateLabel(span.startDay)} → ${formatCompactDateLabel(span.endDay)}`
                                                                        : '—';

                                                                const todaySlots =
                                                                    childrenForDate(
                                                                        ev,
                                                                        selectedDate,
                                                                    );
                                                                const todaySlotsLabel =
                                                                    todaySlots.length ===
                                                                    0
                                                                        ? 'No slot on this date'
                                                                        : todaySlots.length ===
                                                                            1
                                                                          ? formatTimeRangeFromIso(
                                                                                todaySlots[0]
                                                                                    .start,
                                                                                todaySlots[0]
                                                                                    .end,
                                                                            )
                                                                          : `${todaySlots.length} slots on this date`;

                                                                return (
                                                                    <div
                                                                        key={`series-${String(ev.id)}`}
                                                                        className="rounded-lg border bg-background p-3"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div className="min-w-0">
                                                                                <div className="truncate text-sm font-semibold">
                                                                                    {
                                                                                        ev.title
                                                                                    }
                                                                                </div>
                                                                                <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                                    Range:{' '}
                                                                                    {
                                                                                        rangeLabel
                                                                                    }{' '}
                                                                                    •
                                                                                    Total
                                                                                    slots:{' '}
                                                                                    {ev
                                                                                        .children
                                                                                        ?.length ??
                                                                                        0}
                                                                                </div>
                                                                                <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                                    This
                                                                                    date:{' '}
                                                                                    {
                                                                                        todaySlotsLabel
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-2 rounded-md border bg-muted/20 p-2">
                                                                            <div className="text-[10px] font-semibold text-muted-foreground">
                                                                                Slots
                                                                                in
                                                                                this
                                                                                series
                                                                                (times
                                                                                may
                                                                                differ
                                                                                per
                                                                                day)
                                                                            </div>

                                                                            <div className="mt-1 space-y-1">
                                                                                {ev
                                                                                    .children!.slice(
                                                                                        0,
                                                                                        16,
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            c,
                                                                                        ) => {
                                                                                            const s =
                                                                                                parseIsoLocal(
                                                                                                    c.start,
                                                                                                );
                                                                                            const dayKey =
                                                                                                s
                                                                                                    ? formatDateKey(
                                                                                                          startOfDay(
                                                                                                              s,
                                                                                                          ),
                                                                                                      )
                                                                                                    : '—';
                                                                                            const label =
                                                                                                s
                                                                                                    ? formatLocalDateLabel(
                                                                                                          dayKey,
                                                                                                      )
                                                                                                    : dayKey;
                                                                                            const tr =
                                                                                                formatTimeRangeFromIso(
                                                                                                    c.start,
                                                                                                    c.end,
                                                                                                );
                                                                                            const highlight =
                                                                                                dayKey ===
                                                                                                selectedDate;

                                                                                            return (
                                                                                                <div
                                                                                                    key={`series-child-${String(c.id)}-${c.start}`}
                                                                                                    className={cn(
                                                                                                        'flex items-center justify-between gap-2 rounded px-2 py-1 text-[11px]',
                                                                                                        highlight
                                                                                                            ? 'bg-primary/10'
                                                                                                            : 'bg-transparent',
                                                                                                    )}
                                                                                                >
                                                                                                    <div className="min-w-0 truncate">
                                                                                                        {
                                                                                                            label
                                                                                                        }{' '}
                                                                                                        •{' '}
                                                                                                        {
                                                                                                            tr
                                                                                                        }
                                                                                                    </div>
                                                                                                    <Button
                                                                                                        type="button"
                                                                                                        size="sm"
                                                                                                        variant="outline"
                                                                                                        onClick={() =>
                                                                                                            openBookingById(
                                                                                                                c.id,
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        Open
                                                                                                    </Button>
                                                                                                </div>
                                                                                            );
                                                                                        },
                                                                                    )}

                                                                                {ev
                                                                                    .children!
                                                                                    .length >
                                                                                    16 && (
                                                                                    <div className="text-[10px] text-muted-foreground">
                                                                                        +
                                                                                        {ev
                                                                                            .children!
                                                                                            .length -
                                                                                            16}{' '}
                                                                                        more…
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Busy / free lists (staff-side) */}
                                            {isStaffSide && (
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <div className="rounded-lg border p-3">
                                                        <div className="mb-1 text-sm font-semibold">
                                                            Booked slots
                                                        </div>
                                                        {Array.isArray(
                                                            availability?.busy,
                                                        ) &&
                                                        availability!.busy!
                                                            .length > 0 ? (
                                                            <ul className="list-disc space-y-1 pl-4 text-[11px]">
                                                                {availability!.busy!.map(
                                                                    (b, i) => (
                                                                        <li
                                                                            key={`busy-${i}`}
                                                                        >
                                                                            {
                                                                                b.from
                                                                            }{' '}
                                                                            –{' '}
                                                                            {
                                                                                b.to
                                                                            }
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        ) : (
                                                            <div className="text-[11px] text-muted-foreground">
                                                                None
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="rounded-lg border p-3">
                                                        <div className="mb-1 text-sm font-semibold">
                                                            Free slots
                                                        </div>
                                                        {Array.isArray(
                                                            availability?.free,
                                                        ) &&
                                                        availability!.free!
                                                            .length > 0 ? (
                                                            <ul className="list-disc space-y-1 pl-4 text-[11px]">
                                                                {availability!.free!.map(
                                                                    (f, i) => (
                                                                        <li
                                                                            key={`free-${i}`}
                                                                        >
                                                                            {
                                                                                f.from
                                                                            }{' '}
                                                                            –{' '}
                                                                            {
                                                                                f.to
                                                                            }
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        ) : (
                                                            <div className="text-[11px] text-muted-foreground">
                                                                No free time
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Schedule list */}
                                            <div>
                                                <div className="mb-2 text-sm font-semibold">
                                                    {isClient
                                                        ? 'My bookings on this date'
                                                        : 'Bookings / Blocks on this date'}
                                                </div>

                                                <div className="space-y-2">
                                                    {dayEvents.length === 0 && (
                                                        <div className="rounded-lg border border-dashed p-3 text-[11px] text-muted-foreground">
                                                            {isClient
                                                                ? 'No bookings on this date.'
                                                                : 'No bookings or blocks on this date.'}
                                                        </div>
                                                    )}

                                                    {dayEvents.map((ev) => {
                                                        const isBlock =
                                                            normalizeKind(
                                                                ev,
                                                            ) === 'block';
                                                        const isSeries =
                                                            !!ev.children &&
                                                            ev.children.length >
                                                                1;

                                                        const time =
                                                            displayEventTimeForDate(
                                                                ev,
                                                                selectedDate,
                                                            );

                                                        return (
                                                            <div
                                                                key={`evt-${String(ev.id)}`}
                                                                className={cn(
                                                                    'flex items-start gap-3 rounded-lg border p-3',
                                                                    statusPill(
                                                                        ev.status,
                                                                    ),
                                                                )}
                                                            >
                                                                <span
                                                                    className={cn(
                                                                        'mt-1 h-2.5 w-2.5 rounded-full',
                                                                        statusDot(
                                                                            ev.status,
                                                                        ),
                                                                    )}
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-[11px] text-muted-foreground">
                                                                        {time ||
                                                                            '—'}
                                                                    </div>

                                                                    <div className="truncate text-sm font-medium">
                                                                        {isBlock
                                                                            ? `BLOCK • ${ev.title}`
                                                                            : isSeries
                                                                              ? `${ev.title} (Connected series)`
                                                                              : ev.title}
                                                                    </div>

                                                                    {ev.status && (
                                                                        <div className="mt-1 text-[11px] text-muted-foreground">
                                                                            Status:{' '}
                                                                            {String(
                                                                                ev.status,
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {isSeries && (
                                                                        <div className="mt-2 text-[11px] text-muted-foreground">
                                                                            This
                                                                            booking
                                                                            is
                                                                            connected
                                                                            across
                                                                            dates.
                                                                            See{' '}
                                                                            <span className="font-semibold">
                                                                                Connected
                                                                                bookings
                                                                            </span>{' '}
                                                                            above
                                                                            for
                                                                            all
                                                                            slots.
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {!isBlock &&
                                                                        !isSeries && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    openBooking(
                                                                                        ev,
                                                                                    )
                                                                                }
                                                                            >
                                                                                Open
                                                                            </Button>
                                                                        )}

                                                                    {canManageBlocks &&
                                                                        isBlock &&
                                                                        typeof ev.block_id ===
                                                                            'number' && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-9 w-9"
                                                                                onClick={() =>
                                                                                    deleteCalendarBlock(
                                                                                        ev.block_id!,
                                                                                    )
                                                                                }
                                                                                title="Delete this block"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Block Create Modal (ADMIN/MANAGER only) */}
            {blockDialogOpen && canManageBlocks && activeRange && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3">
                    <div className="w-full max-w-md rounded-xl border bg-background p-4 shadow-lg">
                        <div className="mb-2 flex items-start justify-between">
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Create block
                                </div>
                                <div className="text-sm font-semibold">
                                    {formatLocalDateLabel(activeRange.from)}
                                    {activeRange.from !== activeRange.to
                                        ? ` → ${formatLocalDateLabel(activeRange.to)}`
                                        : ''}
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    Blocks affect availability for client
                                    bookings.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={cancelSelectionAndDialog}
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {blockSubmitError && (
                                <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                                    {blockSubmitError}
                                </div>
                            )}

                            {blockSubmitConflicts.length > 0 && (
                                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                                    <div className="mb-1 font-semibold">
                                        Conflicts
                                    </div>
                                    <ul className="ml-4 list-disc space-y-1">
                                        {blockSubmitConflicts
                                            .slice(0, 20)
                                            .map((c) => (
                                                <li key={c}>{c}</li>
                                            ))}
                                        {blockSubmitConflicts.length > 20 && (
                                            <li>
                                                +
                                                {blockSubmitConflicts.length -
                                                    20}{' '}
                                                more
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-[11px] font-semibold">
                                    Title
                                </label>
                                <input
                                    className="w-full rounded border bg-background px-3 py-2 text-sm"
                                    value={blockForm.title}
                                    onChange={(e) =>
                                        setBlockForm((p) => ({
                                            ...p,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Maintenance, Private event"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-[11px] font-semibold">
                                    Area
                                </label>
                                <input
                                    className="w-full rounded border bg-background px-3 py-2 text-sm"
                                    value={blockForm.area}
                                    onChange={(e) =>
                                        setBlockForm((p) => ({
                                            ...p,
                                            area: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Main Hall / Venue"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-[11px] font-semibold">
                                    Time block
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['AM', 'PM', 'EVE', 'DAY'] as const).map(
                                        (k) => (
                                            <button
                                                key={k}
                                                type="button"
                                                className={cn(
                                                    'rounded border px-2 py-2 text-[11px] transition-colors',
                                                    blockForm.block === k
                                                        ? 'border-primary/40 bg-primary/10'
                                                        : 'bg-background hover:bg-muted/40',
                                                )}
                                                onClick={() =>
                                                    setBlockForm((p) => ({
                                                        ...p,
                                                        block: k,
                                                    }))
                                                }
                                            >
                                                {k}
                                            </button>
                                        ),
                                    )}
                                </div>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                    DAY blocks AM + PM + EVE.
                                </p>
                            </div>

                            <div>
                                <label className="mb-1 block text-[11px] font-semibold">
                                    Notes (optional)
                                </label>
                                <textarea
                                    className="w-full rounded border bg-background px-3 py-2 text-sm"
                                    rows={3}
                                    value={blockForm.notes}
                                    onChange={(e) =>
                                        setBlockForm((p) => ({
                                            ...p,
                                            notes: e.target.value,
                                        }))
                                    }
                                    placeholder="Internal note…"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={cancelSelectionAndDialog}
                                    disabled={blockSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={createCalendarBlock}
                                    disabled={blockSubmitting}
                                >
                                    {blockSubmitting
                                        ? 'Creating…'
                                        : 'Create Block'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
