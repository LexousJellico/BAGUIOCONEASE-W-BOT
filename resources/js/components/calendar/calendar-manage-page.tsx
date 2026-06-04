import {
    CalendarBlockModal,
    type BlockKey,
    type CalendarBlockFormState,
  } from '@/components/calendar/calendar-block-modal';
  import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
  import { Link, router, usePage } from '@inertiajs/react';
  import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Edit3,
    ExternalLink,
    ListFilter,
    Plus,
    ShieldCheck,
    Sparkles,
    Trash2,
  } from 'lucide-react';
  import { useEffect, useMemo, useRef, useState } from 'react';

  type CalendarAvailabilityDay = {
    date?: string;
    day_status?: string;
    AM?: boolean;
    PM?: boolean;
    EVE?: boolean;
    is_fully_booked?: boolean;
  };

  type CalendarEvent = {
    id: number | string;
    kind: 'booking' | 'block' | 'public_event' | string;
    title: string;
    start: string;
    end: string;
    status?: string | null;
    payment_status?: string | null;
    area?: string | null;
    block?: string | null;
    block_id?: number | string | null;
    public_status?: string | null;
    note?: string | null;
    notes?: string | null;
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
    occupies_availability?: boolean | null;
  };

  type HighlightItem = {
    id: number | string;
    scope?: 'bccc' | 'city' | string;
    title: string;
    venue?: string;
    date?: string;
    time?: string;
    summary?: string;
    description?: string;
    image?: string;
  };

  type PageProps = {
    workspaceRole?: string;
    month?: string;
    monthAvailability?: Record<string, CalendarAvailabilityDay>;
    events?: CalendarEvent[];
    highlights?: {
      bccc?: HighlightItem[];
      city?: HighlightItem[];
    };
    areaOptions?: string[];
  };

  type RoleKey = 'admin' | 'manager' | 'staff' | 'user';
  type WeekCell = Date | null;

  type EventSegment = {
    event: CalendarEvent;
    startCol: number;
    endCol: number;
    isStart: boolean;
    isEnd: boolean;
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  const blockKeys = ['AM', 'PM', 'EVE'] as const;

  const defaultAreas = [
    'FULL HALL',
    'MAIN HALL',
    'FOYER & LOBBY AREA',
    'VIP LOUNGE',
    'BOARD ROOM',
    'BASEMENT',
    'GALLERY2600',
  ];

  function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
  }

  function currentPath() {
    return typeof window === 'undefined' ? '' : window.location.pathname;
  }

  function inferRole(value?: string | null): RoleKey {
    if (value === 'admin' || currentPath().startsWith('/admin')) return 'admin';
    if (value === 'manager' || currentPath().startsWith('/manager')) return 'manager';
    if (value === 'staff' || currentPath().startsWith('/staff')) return 'staff';
    return 'user';
  }

  function calendarBasePath(role: RoleKey) {
    if (role === 'admin') return '/admin/calendar';
    if (role === 'manager') return '/manager/calendar';
    if (role === 'staff') return '/staff/calendar';
    return '/my-dashboard';
  }

  function calendarManagePath(role: RoleKey) {
    if (role === 'admin') return '/admin/calendar/manage';
    if (role === 'manager') return '/manager/calendar/manage';
    return calendarBasePath(role);
  }

  function calendarBlockBasePath(role: RoleKey) {
    if (role === 'admin') return '/admin/calendar-blocks';
    if (role === 'manager') return '/manager/calendar-blocks';
    return '/admin/calendar-blocks';
  }

  function bookingCreatePath(role: RoleKey, dateKey: string, block: BlockKey = 'AM') {
    const time = block === 'PM' ? ['12:00', '18:00'] : block === 'EVE' ? ['18:00', '23:59'] : ['06:00', '12:00'];
    const query = `?date=${dateKey}&start=${time[0]}&end=${time[1]}`;

    if (role === 'admin') return `/admin/bookings/create${query}`;
    if (role === 'staff') return `/staff/bookings/create${query}`;

    return `/book${query}`;
  }

  function bookingShowPath(role: RoleKey, id: number | string) {
    if (role === 'admin') return `/admin/bookings/${id}`;
    if (role === 'manager') return `/manager/bookings/${id}`;
    if (role === 'staff') return `/staff/bookings/${id}`;
    return `/my-bookings/${id}`;
  }

  function dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function parseMonth(month: string): Date {
    if (/^\d{4}-\d{2}$/.test(month)) {
      const [year, monthValue] = month.split('-').map(Number);
      return new Date(year, monthValue - 1, 1);
    }

    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  function shiftMonth(month: string, amount: number): string {
    const base = parseMonth(month);
    const next = new Date(base.getFullYear(), base.getMonth() + amount, 1);

    return dateKey(next).slice(0, 7);
  }

  function monthLabel(month: string): string {
    return parseMonth(month).toLocaleDateString('en-PH', {
      month: 'long',
      year: 'numeric',
    });
  }

  function longDate(key: string): string {
    const date = parseDateKey(key);

    return date.toLocaleDateString('en-PH', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function parseDateKey(key: string): Date {
    const [year, month, day] = key.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  function buildMonthWeeks(month: string): WeekCell[][] {
    const start = parseMonth(month);
    const first = new Date(start);
    first.setDate(first.getDate() - first.getDay());

    const weeks: WeekCell[][] = [];

    for (let week = 0; week < 6; week++) {
      const row: WeekCell[] = [];

      for (let day = 0; day < 7; day++) {
        const next = new Date(first);
        next.setDate(first.getDate() + week * 7 + day);
        row.push(next);
      }

      weeks.push(row);
    }

    return weeks;
  }

  function eventRange(event: CalendarEvent): { startDate: string; endDate: string } {
    const startDate = String(event.dateFrom || event.start || '').slice(0, 10);
    let endDate = String(event.dateTo || event.end || event.start || '').slice(0, 10);
    const endTime = String(event.end || '').slice(11, 16);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      endDate = startDate;
    }

    if (endTime === '00:00' && endDate > startDate) {
      const parsed = parseDateKey(endDate);
      parsed.setDate(parsed.getDate() - 1);
      endDate = dateKey(parsed);
    }

    return {
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
    };
  }

  function eventSpansDate(event: CalendarEvent, key: string): boolean {
    const range = eventRange(event);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(range.startDate)) {
      return false;
    }

    return key >= range.startDate && key <= range.endDate;
  }

  function eventStartsOnDate(event: CalendarEvent, key: string): boolean {
    return eventRange(event).startDate === key;
  }

  function eventEndsOnDate(event: CalendarEvent, key: string): boolean {
    return eventRange(event).endDate === key;
  }

  function eventDurationDays(event: CalendarEvent): number {
    const range = eventRange(event);
    const start = parseDateKey(range.startDate);
    const end = parseDateKey(range.endDate);

    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  }

  function eventPriority(event: CalendarEvent): number {
    if (event.kind === 'booking') return 0;
    if (event.kind === 'public_event') return 1;
    if (event.kind === 'block') return 2;
    return 9;
  }

  function buildWeekLanes(week: WeekCell[], events: CalendarEvent[]): EventSegment[][] {
    const weekKeys = week.map((cell) => (cell ? dateKey(cell) : null));

    const visible = events
      .filter((event) => weekKeys.some((key) => key && eventSpansDate(event, key)))
      .sort((a, b) => {
        const aRange = eventRange(a);
        const bRange = eventRange(b);

        if (aRange.startDate !== bRange.startDate) {
          return aRange.startDate.localeCompare(bRange.startDate);
        }

        if (eventDurationDays(a) !== eventDurationDays(b)) {
          return eventDurationDays(b) - eventDurationDays(a);
        }

        return eventPriority(a) - eventPriority(b);
      });

    const lanes: EventSegment[][] = [];

    visible.forEach((event) => {
      let startCol = -1;
      let endCol = -1;

      weekKeys.forEach((key, index) => {
        if (key && eventSpansDate(event, key)) {
          if (startCol === -1) startCol = index;
          endCol = index;
        }
      });

      if (startCol === -1 || endCol === -1) return;

      const segment: EventSegment = {
        event,
        startCol,
        endCol,
        isStart: Boolean(weekKeys[startCol] && eventStartsOnDate(event, weekKeys[startCol] as string)),
        isEnd: Boolean(weekKeys[endCol] && eventEndsOnDate(event, weekKeys[endCol] as string)),
      };

      const lane = lanes.find((candidate) =>
        candidate.every((existing) => segment.endCol < existing.startCol || segment.startCol > existing.endCol),
      );

      if (lane) {
        lane.push(segment);
      } else {
        lanes.push([segment]);
      }
    });

    return lanes;
  }

  function pageCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }

  async function sendJson(url: string, method: 'POST' | 'PUT' | 'DELETE', payload?: Record<string, unknown>) {
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
      const message =
        typeof json === 'object' && json && 'message' in json
          ? String((json as { message?: string }).message)
          : 'Calendar request failed.';

      const errors =
        typeof json === 'object' && json && 'errors' in json
          ? (json as { errors?: Record<string, string[]> }).errors
          : null;

      if (errors) {
        const firstError = Object.values(errors).flat()[0];

        if (firstError) {
          throw new Error(firstError);
        }
      }

      throw new Error(message);
    }

    return json;
  }

  function blockLabel(block?: string | null): string {
    const normalized = String(block || 'DAY').toUpperCase();

    if (normalized === 'AM') return 'AM';
    if (normalized === 'PM') return 'PM';
    if (normalized === 'EVE') return 'EVE';
    return 'Whole Day';
  }

  function publicStatusLabel(status?: string | null): string {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'blue') return 'Public';
    if (normalized === 'gold') return 'Private';

    return 'Blocked';
  }

  function isEveOnlyAvailability(day?: CalendarAvailabilityDay): boolean {
    return day?.AM === false && day?.PM === false && day?.EVE !== false;
  }

  function dayStatusLabel(day?: CalendarAvailabilityDay, events: CalendarEvent[] = []): string {
    const status = String(day?.day_status || '').toLowerCase();

    if (isEveOnlyAvailability(day)) return 'Blocked';
    if (status === 'blocked') return 'Blocked';
    if (status === 'public_booked') return 'Public Event';
    if (status === 'private_booked') return 'Private / Reserved';
    if (status === 'limited' || status === 'partial' || status === 'partially_booked') return 'Limited';
    if (day?.is_fully_booked) return 'Fully Booked';

    if (events.some((event) => event.kind === 'block' && String(event.public_status).toLowerCase() === 'red')) {
      return 'Blocked';
    }

    if (events.some((event) => event.kind === 'public_event' || String(event.public_status).toLowerCase() === 'blue')) {
      return 'Public Event';
    }

    const blockingBooking = events.some((event) =>
      event.kind === 'booking' &&
      (event.occupies_availability === true || ['pencil_booked', 'confirmed', 'active'].includes(String(event.status || '').toLowerCase()))
    );

    if (blockingBooking || events.some((event) => String(event.public_status).toLowerCase() === 'gold')) {
      return 'Private / Reserved';
    }

    if (events.some((event) => event.kind === 'booking')) {
      return 'Available · Pending requests visible';
    }

    return 'Available';
  }

  function dayTone(day?: CalendarAvailabilityDay, events: CalendarEvent[] = []): string {
    const label = dayStatusLabel(day, events).toLowerCase();

    if (label.includes('blocked') || label.includes('fully')) {
      return 'border-rose-300/35 bg-rose-400/10';
    }

    if (label.includes('public')) {
      return 'border-sky-300/35 bg-sky-400/10';
    }

    if (label.includes('private') || label.includes('reserved')) {
      return 'border-amber-300/40 bg-amber-400/10';
    }

    if (label.includes('limited')) {
      return 'border-blue-300/35 bg-blue-400/10';
    }

    return 'border-emerald-300/30 bg-emerald-400/10';
  }

  function dotTone(day?: CalendarAvailabilityDay, events: CalendarEvent[] = []): string {
    const label = dayStatusLabel(day, events).toLowerCase();

    if (label.includes('blocked') || label.includes('fully')) return 'bg-rose-500';
    if (label.includes('public')) return 'bg-sky-500';
    if (label.includes('private') || label.includes('reserved')) return 'bg-amber-500';
    if (label.includes('limited')) return 'bg-blue-500';

    return 'bg-emerald-500';
  }

  function eventBarTone(event: CalendarEvent): string {
    const status = String(event.status || '').toLowerCase();
    const publicStatus = String(event.public_status || '').toLowerCase();

    if (event.kind === 'block' && publicStatus === 'red') {
      return 'border-rose-300/50 bg-rose-400/20 text-rose-950 dark:text-rose-100';
    }

    if (event.kind === 'block' && publicStatus === 'blue') {
      return 'border-sky-300/50 bg-sky-400/20 text-sky-950 dark:text-sky-100';
    }

    if (event.kind === 'block' && publicStatus === 'gold') {
      return 'border-amber-300/50 bg-amber-400/20 text-amber-950 dark:text-amber-100';
    }

    if (event.kind === 'public_event' || status === 'public_booked') {
      return 'border-sky-300/45 bg-sky-400/15 text-sky-950 dark:text-sky-100';
    }

    if (event.kind === 'booking' && (event.occupies_availability === false || ['pending', 'for_review', 'submitted'].includes(status))) {
      return 'border-blue-300/45 bg-blue-400/12 text-blue-950 dark:text-blue-100';
    }

    if (event.kind === 'booking' || ['confirmed', 'active', 'approved'].includes(status)) {
      return 'border-emerald-300/45 bg-emerald-400/15 text-emerald-950 dark:text-emerald-100';
    }

    return 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-text)]';
  }

  function cleanTitle(value?: string | null): string {
    return String(value || 'Untitled')
      .replace(/^BLOCK:\s*/i, '')
      .replace(/^PUBLIC:\s*/i, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function pickInitialDate(month: string, availability: Record<string, CalendarAvailabilityDay>, events: CalendarEvent[]): string {
    const today = dateKey(new Date());

    if (today.startsWith(month)) {
      return today;
    }

    const availabilityDate = Object.keys(availability).sort()[0];

    if (availabilityDate) {
      return availabilityDate;
    }

    const eventDate = events.map((event) => eventRange(event).startDate).find(Boolean);

    return eventDate || `${month}-01`;
  }

  function initialForm(dateValue: string): CalendarBlockFormState {
    return {
      title: 'Internal calendar block',
      area: '',
      notes: '',
      block: 'DAY',
      public_status: 'red',
      date_from: dateValue,
      date_to: dateValue,
      block_id: null,
      explode_by_day: false,
      exclude_weekends: false,
      exclude_dates: '',
    };
  }

  function parseExcludeDates(value?: string): string[] {
    return String(value || '')
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item));
  }

  function EventListItem({
    role,
    event,
    onEdit,
    onDelete,
  }: {
    role: RoleKey;
    event: CalendarEvent;
    onEdit: (event: CalendarEvent) => void;
    onDelete: (event: CalendarEvent) => void;
  }) {
    const isBlock = event.kind === 'block';
    const bookingHref = event.kind === 'booking' ? bookingShowPath(role, event.id) : null;

    return (
      <article className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--bccc-backend-text)]">
              {cleanTitle(event.title)}
            </p>

            <p className="mt-1 text-xs leading-6 text-[var(--bccc-backend-muted)]">
              {event.area || 'All / unspecified area'} · {blockLabel(event.block)}
            </p>

            {event.note || event.notes || event.summary ? (
              <p className="mt-2 text-xs leading-6 text-[var(--bccc-backend-muted)]">
                {event.note || event.notes || event.summary}
              </p>
            ) : null}
          </div>

          <span className={cx('shrink-0 border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em]', eventBarTone(event))}>
            {isBlock ? publicStatusLabel(event.public_status) : event.kind}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {bookingHref ? (
            <Link
              href={bookingHref}
              className="inline-flex min-h-9 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--bccc-backend-text)] transition hover:border-[var(--bccc-backend-gold-line)]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </Link>
          ) : null}

          {isBlock ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="inline-flex min-h-9 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--bccc-backend-text)] transition hover:border-[var(--bccc-backend-gold-line)]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDelete(event)}
                className="inline-flex min-h-9 items-center justify-center gap-2 border border-rose-300/35 bg-rose-400/10 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-rose-700 transition hover:bg-rose-400/15 dark:text-rose-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          ) : null}
        </div>
      </article>
    );
  }

  export function CalendarManagePage() {
    const { props } = usePage<PageProps>();

    const role = inferRole(props.workspaceRole);
    const month = props.month || dateKey(new Date()).slice(0, 7);
    const monthAvailability = useMemo(() => props.monthAvailability || {}, [props.monthAvailability]);
    const events = useMemo(() => (Array.isArray(props.events) ? props.events : []), [props.events]);
    const highlights = props.highlights || {};
    const areaOptions = props.areaOptions?.length ? props.areaOptions : defaultAreas;

    const [selectedDate, setSelectedDate] = useState(() => pickInitialDate(month, monthAvailability, events));
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'single' | 'bulk'>('single');
    const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState<CalendarBlockFormState>(() => initialForm(selectedDate));
    const [activeHighlightTab, setActiveHighlightTab] = useState<'bccc' | 'city'>('bccc');
    const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);

    const holdTimerRef = useRef<number | null>(null);
    const holdTriggeredRef = useRef(false);

    const weeks = useMemo(() => buildMonthWeeks(month), [month]);

    const selectedEvents = useMemo(
      () => events.filter((event) => eventSpansDate(event, selectedDate)),
      [events, selectedDate],
    );

    const selectedBlocks = selectedEvents.filter((event) => event.kind === 'block');
    const selectedBookings = selectedEvents.filter((event) => event.kind === 'booking');
    const selectedPublicEvents = selectedEvents.filter((event) => event.kind === 'public_event');

    const activeHighlights = activeHighlightTab === 'bccc' ? highlights.bccc || [] : highlights.city || [];
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

    function goToMonth(nextMonth: string) {
      router.get(
        calendarManagePath(role),
        { month: nextMonth },
        {
                    preserveUrl: true,
          replace: true,
        },
      );
    }

    function openCreate(dateValue: string, mode: 'single' | 'bulk' = 'single') {
      setEditorMode('create');
      setModalMode(mode);
      setError('');
      setForm(initialForm(dateValue));
      setModalOpen(true);
    }

    function openEdit(event: CalendarEvent) {
      setEditorMode('edit');
      setModalMode('single');
      setError('');

      setForm({
        title: cleanTitle(event.title),
        area: event.area || '',
        notes: event.note || event.notes || '',
        block: (String(event.block || 'DAY').toUpperCase() as BlockKey) || 'DAY',
        public_status: (String(event.public_status || 'red').toLowerCase() as CalendarBlockFormState['public_status']) || 'red',
        date_from: event.dateFrom || eventRange(event).startDate,
        date_to: event.dateTo || eventRange(event).endDate,
        block_id: event.block_id || event.id,
        explode_by_day: false,
        exclude_weekends: false,
        exclude_dates: '',
      });

      setModalOpen(true);
    }

    function startPress(dateValue: string) {
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current);
      }

      holdTriggeredRef.current = false;

      holdTimerRef.current = window.setTimeout(() => {
        holdTriggeredRef.current = true;
        openCreate(dateValue);
      }, 700);
    }

    function clearPress() {
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }

    function endPress(dateValue: string) {
      const triggered = holdTriggeredRef.current;

      clearPress();

      if (!triggered) {
        setSelectedDate(dateValue);
      }

      window.setTimeout(() => {
        holdTriggeredRef.current = false;
      }, 0);
    }

    async function saveForm() {
      setBusy(true);
      setError('');

      try {
        if (!form.title.trim()) {
          throw new Error('Please enter a title.');
        }

        if (!form.date_from || !form.date_to) {
          throw new Error('Please select start and end dates.');
        }

        const basePayload = {
          title: form.title.trim(),
          area: form.area.trim(),
          notes: form.notes.trim(),
          block: form.block,
          public_status: form.public_status,
          date_from: form.date_from,
          date_to: form.date_to,
        };

        if (editorMode === 'edit' && form.block_id) {
          await sendJson(`${calendarBlockBasePath(role)}/${form.block_id}`, 'PUT', basePayload);
        } else if (modalMode === 'bulk') {
          await sendJson(`${calendarBlockBasePath(role)}/bulk`, 'POST', {
            ...basePayload,
            explode_by_day: Boolean(form.explode_by_day),
            exclude_weekends: Boolean(form.exclude_weekends),
            exclude_dates: parseExcludeDates(form.exclude_dates),
          });
        } else {
          await sendJson(calendarBlockBasePath(role), 'POST', basePayload);
        }

        setModalOpen(false);
        router.reload();
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : 'Unable to save calendar block.');
      } finally {
        setBusy(false);
      }
    }

    async function deleteBlock(event: CalendarEvent) {
      const id = event.block_id || event.id;

      if (!id) return;

      if (!window.confirm('Delete this calendar block? This cannot be undone.')) {
        return;
      }

      try {
        await sendJson(`${calendarBlockBasePath(role)}/${id}`, 'DELETE');
        router.reload();
      } catch (exception) {
        window.alert(exception instanceof Error ? exception.message : 'Unable to delete calendar block.');
      }
    }

    return (
      <BookingRolePageShell
        role={role}
        title="Calendar Management"
        description="Create, edit, and monitor booking blocks using a Google Calendar-style month board with AM / PM / EVE availability."
        actions={
          <>
            <Link
              href={calendarBasePath(role)}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Calendar
            </Link>

            <button
              type="button"
              onClick={() => openCreate(selectedDate)}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-green-800)] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)]"
            >
              <Plus className="h-4 w-4" />
              New Block
            </button>

            <button
              type="button"
              onClick={() => openCreate(selectedDate, 'bulk')}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
            >
              <ListFilter className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
              Bulk Create
            </button>
          </>
        }
      >
        <CalendarBlockModal
          open={modalOpen}
          mode={modalMode}
          title={
            editorMode === 'edit'
              ? 'Edit calendar block'
              : modalMode === 'bulk'
                ? 'Bulk create calendar blocks'
                : 'Create calendar block'
          }
          form={form}
          areaOptions={areaOptions}
          busy={busy}
          error={error}
          saveLabel={editorMode === 'edit' ? 'Save Changes' : modalMode === 'bulk' ? 'Create Blocks' : 'Create Block'}
          helperText={
            modalMode === 'bulk'
              ? 'Create a block across a date range. You may create a single range block or one separate block per day.'
              : 'Use red for unavailable dates, gold for private reservations, and blue for public-visible activities.'
          }
          onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
          onClose={() => setModalOpen(false)}
          onSave={saveForm}
        />

        <section className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Selected Date" value={selectedDate} icon={CalendarDays} />
            <Metric label="Blocks" value={selectedBlocks.length} icon={ShieldCheck} />
            <Metric label="Bookings" value={selectedBookings.length} icon={Clock3} />
            <Metric label="Public Events" value={selectedPublicEvents.length} icon={Sparkles} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_25rem]">
            <main className="min-w-0">
              <section className="overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
                <header className="flex flex-col gap-4 border-b border-[var(--bccc-backend-line)] p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-backend-gold)]">
                      Month Board
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--bccc-backend-text)]">
                      {monthLabel(month)}
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--bccc-backend-muted)]">
                      Click a day to inspect it. Hold for about 0.7 seconds to quickly create a block.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => goToMonth(shiftMonth(month, -1))}
                      className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={() => goToMonth(dateKey(new Date()).slice(0, 7))}
                      className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.12)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-gold)] transition hover:-translate-y-0.5"
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={() => goToMonth(shiftMonth(month, 1))}
                      className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </header>

                <div className="calendar-manage-scroll">
                  <div className="min-w-[70rem]">
                    <div className="grid grid-cols-7 border-b border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)]">
                      {weekdays.map((weekday) => (
                        <div
                          key={weekday}
                          className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-backend-gold)]"
                        >
                          {weekday}
                        </div>
                      ))}
                    </div>

                    {weeks.map((week, weekIndex) => {
                      const lanes = buildWeekLanes(week, events);
                      const maxVisibleLanes = 5;
                      const visibleLanes = lanes.slice(0, maxVisibleLanes);
                      const hiddenCount = Math.max(lanes.length - visibleLanes.length, 0);
                      const laneTop = 56;
                      const laneHeight = 24;
                      const laneGap = 5;
                      const weekHeight = 154 + Math.max(visibleLanes.length, 1) * (laneHeight + laneGap);

                      return (
                        <div
                          key={`week-${weekIndex}`}
                          className="relative grid grid-cols-7 border-b border-[var(--bccc-backend-line)]"
                          style={{ minHeight: `${weekHeight}px` }}
                        >
                          {week.map((cell, index) => {
                            if (!cell) return <div key={`blank-${index}`} />;

                            const key = dateKey(cell);
                            const rows = events.filter((event) => eventSpansDate(event, key));
                            const availability = monthAvailability[key];
                            const selected = key === selectedDate;
                            const isCurrentMonth = key.startsWith(month);
                            const openBlocks = blockKeys.filter((block) => availability?.[block] !== false).length;

                            return (
                              <button
                                key={key}
                                type="button"
                                onPointerDown={() => startPress(key)}
                                onPointerUp={() => endPress(key)}
                                onPointerCancel={clearPress}
                                onPointerLeave={clearPress}
                                className={cx(
                                  'calendar-manage-day relative border-r border-[var(--bccc-backend-line)] p-3 text-left transition duration-500 hover:z-10 hover:border-[var(--bccc-backend-gold-line)] hover:bg-[var(--bccc-backend-hover)]',
                                  index === 6 && 'border-r-0',
                                  !isCurrentMonth && 'opacity-45',
                                  selected && 'is-selected',
                                  dayTone(availability, rows),
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="flex h-8 w-8 items-center justify-center bg-[var(--bccc-backend-panel)] text-sm font-black text-[var(--bccc-backend-text)]">
                                    {cell.getDate()}
                                  </span>

                                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--bccc-backend-muted)]">
                                    <span className={cx('h-2 w-2', dotTone(availability, rows))} />
                                    {openBlocks}/3
                                  </span>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1">
                                  {blockKeys.map((block) => {
                                    const open = availability?.[block] !== false;

                                    return (
                                      <span
                                        key={block}
                                        className={cx(
                                          'inline-flex min-h-5 items-center border px-1.5 text-[8px] font-black uppercase tracking-[0.12em]',
                                          open
                                            ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200'
                                            : 'border-rose-300/35 bg-rose-400/10 text-rose-700 dark:text-rose-200',
                                        )}
                                      >
                                        {block}
                                      </span>
                                    );
                                  })}
                                </div>
                              </button>
                            );
                          })}

                          {visibleLanes.map((lane, laneIndex) =>
                            lane.map((segment) => {
                              const left = `${(segment.startCol / 7) * 100}%`;
                              const width = `${((segment.endCol - segment.startCol + 1) / 7) * 100}%`;
                              const top = laneTop + laneIndex * (laneHeight + laneGap);

                              return (
                                <button
                                  key={`${segment.event.kind}-${segment.event.id}-${laneIndex}-${segment.startCol}`}
                                  type="button"
                                  onClick={() => {
                                    const range = eventRange(segment.event);
                                    setSelectedDate(range.startDate);

                                    if (segment.event.kind === 'block') {
                                      openEdit(segment.event);
                                    }
                                  }}
                                  className={cx(
                                    'absolute z-20 truncate border px-2 text-left text-[10px] font-black uppercase tracking-[0.12em] transition hover:-translate-y-0.5',
                                    eventBarTone(segment.event),
                                    segment.isStart ? '' : 'pl-1 opacity-80',
                                    segment.isEnd ? '' : 'pr-1',
                                  )}
                                  style={{
                                    left,
                                    width,
                                    top,
                                    height: `${laneHeight}px`,
                                  }}
                                  title={cleanTitle(segment.event.title)}
                                >
                                  {segment.isStart ? cleanTitle(segment.event.title) : '…'}
                                </button>
                              );
                            }),
                          )}

                          {hiddenCount > 0 ? (
                            <div className="absolute bottom-2 left-3 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--bccc-backend-muted)]">
                              +{hiddenCount} more overlapping item{hiddenCount === 1 ? '' : 's'}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </main>

            <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
              <section className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-5 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-backend-gold)]">
                  Selected Date
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--bccc-backend-text)]">
                  {longDate(selectedDate)}
                </h2>

                <div className="mt-4 inline-flex items-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.10)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-gold)]">
                  <span className={cx('h-2 w-2', dotTone(monthAvailability[selectedDate], selectedEvents))} />
                  {dayStatusLabel(monthAvailability[selectedDate], selectedEvents)}
                </div>

                <div className="mt-5 grid gap-2">
                  <button
                    type="button"
                    onClick={() => openCreate(selectedDate)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-green-800)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)]"
                  >
                    <Plus className="h-4 w-4" />
                    Quick Block
                  </button>

                  <Link
                    href={bookingCreatePath(role, selectedDate)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                  >
                    <CalendarDays className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
                    Create Booking
                  </Link>
                </div>
              </section>

              <EventSection title="Calendar Blocks" count={selectedBlocks.length}>
                {selectedBlocks.length > 0 ? (
                  selectedBlocks.map((event) => (
                    <EventListItem
                      key={`block-${event.id}-${event.start}`}
                      role={role}
                      event={event}
                      onEdit={openEdit}
                      onDelete={deleteBlock}
                    />
                  ))
                ) : (
                  <EmptyText>No calendar block on this date.</EmptyText>
                )}
              </EventSection>

              <EventSection title="Bookings" count={selectedBookings.length}>
                {selectedBookings.length > 0 ? (
                  selectedBookings.map((event) => (
                    <EventListItem
                      key={`booking-${event.id}-${event.start}`}
                      role={role}
                      event={event}
                      onEdit={openEdit}
                      onDelete={deleteBlock}
                    />
                  ))
                ) : (
                  <EmptyText>No booking on this date.</EmptyText>
                )}
              </EventSection>

              <EventSection title="Public Events" count={selectedPublicEvents.length}>
                {selectedPublicEvents.length > 0 ? (
                  selectedPublicEvents.map((event) => (
                    <EventListItem
                      key={`public-${event.id}-${event.start}`}
                      role={role}
                      event={event}
                      onEdit={openEdit}
                      onDelete={deleteBlock}
                    />
                  ))
                ) : (
                  <EmptyText>No public event on this date.</EmptyText>
                )}
              </EventSection>

              <section className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-5 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-backend-gold)]">
                      Highlight Browser
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--bccc-backend-text)]">
                      BCCC / City Events
                    </h3>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveHighlightTab('bccc')}
                    className={cx(
                      'flex-1 border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition',
                      activeHighlightTab === 'bccc'
                        ? 'border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.12)] text-[var(--bccc-backend-gold)]'
                        : 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)]',
                    )}
                  >
                    BCCC
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveHighlightTab('city')}
                    className={cx(
                      'flex-1 border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition',
                      activeHighlightTab === 'city'
                        ? 'border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.12)] text-[var(--bccc-backend-gold)]'
                        : 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)]',
                    )}
                  >
                    City
                  </button>
                </div>

                <div className="mt-4 grid gap-2">
                  {activeHighlights.length > 0 ? (
                    activeHighlights.slice(0, 5).map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveHighlightIndex(index)}
                        className={cx(
                          'border p-3 text-left transition hover:-translate-y-0.5',
                          index === activeHighlightIndex
                            ? 'border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.12)]'
                            : 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)]',
                        )}
                      >
                        <p className="truncate text-sm font-semibold text-[var(--bccc-backend-text)]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--bccc-backend-muted)]">
                          {item.venue || 'Baguio'} · {item.date || 'No date'}
                        </p>
                      </button>
                    ))
                  ) : (
                    <EmptyText>No highlight records available.</EmptyText>
                  )}
                </div>

                {activeHighlight ? (
                  <div className="mt-4 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-4">
                    {activeHighlight.image ? (
                      <img
                        src={activeHighlight.image}
                        alt={activeHighlight.title}
                        className="mb-4 aspect-[16/10] w-full object-cover"
                      />
                    ) : null}

                    <p className="text-sm font-semibold text-[var(--bccc-backend-text)]">
                      {activeHighlight.title}
                    </p>

                    <p className="mt-2 text-xs leading-6 text-[var(--bccc-backend-muted)]">
                      {activeHighlight.description || activeHighlight.summary || 'No details available.'}
                    </p>
                  </div>
                ) : null}
              </section>
            </aside>
          </div>
        </section>
      </BookingRolePageShell>
    );
  }

  function Metric({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: string | number;
    icon: typeof CalendarDays;
  }) {
    return (
      <article className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-5 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-muted)]">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.065em] text-[var(--bccc-backend-text)]">
              {value}
            </p>
          </div>

          <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.11)] text-[var(--bccc-backend-gold)]">
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </article>
    );
  }

  function EventSection({
    title,
    count,
    children,
  }: {
    title: string;
    count: number;
    children: React.ReactNode;
  }) {
    return (
      <section className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--bccc-backend-line)] p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-backend-gold)]">
              {title}
            </p>
          </div>

          <span className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--bccc-backend-muted)]">
            {count}
          </span>
        </header>

        <div className="grid gap-3 p-4">{children}</div>
      </section>
    );
  }

  function EmptyText({ children }: { children: React.ReactNode }) {
    return (
      <div className="border border-dashed border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-5 text-center text-sm leading-7 text-[var(--bccc-backend-muted)]">
        <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--bccc-backend-gold)]" />
        <p className="mt-3">{children}</p>
      </div>
    );
  }
