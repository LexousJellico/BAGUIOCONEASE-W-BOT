import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import {
  bookingShowPath,
  cleanLabel,
  formatDateTime,
  formatMoney,
  normalizeWorkspaceRole,
} from '@/lib/booking-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { Link, router, usePage } from '@inertiajs/react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Filter,
  LoaderCircle,
  MapPin,
  PieChart,
  Printer,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';

type MiceRecordRow = {
  id: number | string;
  booking_id?: number | string | null;
  booking_summary?: string | null;
  booking_status?: string | null;
  booking_payment_status?: string | null;

  record_no?: number | string | null;
  year_recorded?: number | string | null;
  status?: string | null;

  event_name?: string | null;
  event_category?: string | null;
  type_of_event?: string | null;
  venue_area?: string | null;
  establishment_name?: string | null;
  event_center_name?: string | null;
  covered_month?: string | null;
  event_started_at?: string | null;
  event_finished_at?: string | null;
  number_of_hours?: number | string | null;
  classification_of_event?: string | null;
  mice_type_of_event?: string | null;
  event_date_from?: string | null;
  event_date_to?: string | null;
  event_days?: number | string | null;
  event_month?: string | null;

  organization_name?: string | null;
  organizer_name?: string | null;
  organizer_type?: string | null;
  contact_person?: string | null;
  email?: string | null;

  local_participants?: number | string | null;
  domestic_participants?: number | string | null;
  foreign_participants?: number | string | null;
  domestic_attendees?: number | string | null;
  foreign_attendees?: number | string | null;
  total_participants?: number | string | null;
  total_number_of_countries?: number | string | null;
  countries_breakdown_text?: string | null;

  main_origin_country?: string | null;
  main_origin_province?: string | null;
  main_origin_city?: string | null;

  same_day_visitors?: number | string | null;
  overnight_visitors?: number | string | null;
  has_exhibitions?: boolean | number | string | null;
  exhibitors_count?: number | string | null;
  visitors_count?: number | string | null;
  estimated_room_nights?: number | string | null;
  estimated_tourism_receipts?: number | string | null;

  submitted_at?: string | null;
  remarks?: string | null;
  comments_feedback?: string | null;
};

type BreakdownRow = {
  label: string;
  count: number;
  participants?: number;
  room_nights?: number;
  tourism_receipts?: number;
};

type PageProps = {
  workspaceRole?: string;
  can_manage?: boolean;
  filters?: {
    q?: string;
    year_recorded?: string;
    status?: string;
    event_category?: string;
    venue_area?: string;
    origin?: string;
    date_from?: string;
    date_to?: string;
    enterprise_group?: string;
    booking_linked?: string;
  };
  summary?: Record<string, number | string>;
  rows?: MiceRecordRow[];
  records?: MiceRecordRow[];
  miceRecords?: MiceRecordRow[];
  category_breakdown?: BreakdownRow[];
  venue_breakdown?: BreakdownRow[];
  origin_breakdown?: BreakdownRow[];
  monthly_breakdown?: BreakdownRow[];
  year_options?: Array<number | string>;
  category_options?: string[];
  venue_options?: string[];
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolValue(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function text(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback;
  }

  return String(value);
}

function officialDomestic(record: MiceRecordRow): number {
  const official = numberValue(record.domestic_attendees);

  return official > 0 ? official : numberValue(record.domestic_participants) + numberValue(record.local_participants);
}

function officialForeign(record: MiceRecordRow): number {
  const official = numberValue(record.foreign_attendees);

  return official > 0 ? official : numberValue(record.foreign_participants);
}

function officialVisitors(record: MiceRecordRow): number {
  const official = numberValue(record.visitors_count);

  return official > 0 ? official : numberValue(record.same_day_visitors) + numberValue(record.overnight_visitors);
}

function participantTotal(record: MiceRecordRow): number {
  return Math.max(
    numberValue(record.total_participants),
    officialDomestic(record) + officialForeign(record),
    numberValue(record.local_participants) + numberValue(record.domestic_participants) + numberValue(record.foreign_participants),
  );
}

function reportBasePath(role: RoleThemeKey) {
  if (role === 'admin') return '/admin/reports/mice-registry';
  if (role === 'manager') return '/manager/reports/mice-registry';

  return '/reports/mice-registry';
}

function reportPrintPath(role: RoleThemeKey) {
  return `${reportBasePath(role)}/print`;
}

function reportExportPath(role: RoleThemeKey, filters: Record<string, unknown>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value));
    }
  });

  const qs = params.toString();

  return `${reportBasePath(role)}/export${qs ? `?${qs}` : ''}`;
}

function recordEditPath(role: RoleThemeKey, id: number | string) {
  return `${reportBasePath(role)}/${id}/edit`;
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  description: string;
  icon: typeof FileSpreadsheet;
  tone?: 'default' | 'gold' | 'green' | 'red' | 'blue';
}) {
  return (
    <article className={cx('mice-report-stat-card', `tone-${tone}`)}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{description}</span>
      </div>

      <Icon className="h-5 w-5" />
    </article>
  );
}

function FilterControl({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mice-report-filter-control">
      <span>{label}</span>
      {children}
    </label>
  );
}

function BreakdownPanel({
  title,
  rows,
  icon: Icon,
}: {
  title: string;
  rows: BreakdownRow[];
  icon: typeof PieChart;
}) {
  const topRows = rows.slice(0, 6);

  return (
    <section className="mice-report-panel">
      <header className="mice-report-section-header">
        <div>
          <p>Breakdown</p>
          <h2>{title}</h2>
        </div>

        <Icon className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
      </header>

      {topRows.length > 0 ? (
        <div className="grid gap-3">
          {topRows.map((row) => (
            <article key={row.label} className="mice-report-breakdown-row">
              <div>
                <strong>{row.label}</strong>
                <span>{row.count} record{row.count === 1 ? '' : 's'}</span>
              </div>

              <div>
                <strong>{numberValue(row.participants).toLocaleString()}</strong>
                <span>participants</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mice-report-empty-mini">No breakdown data yet.</div>
      )}
    </section>
  );
}

function RecordCard({
  record,
  role,
  canManage,
}: {
  record: MiceRecordRow;
  role: RoleThemeKey;
  canManage: boolean;
}) {
  const origin = [record.main_origin_city, record.main_origin_province, record.main_origin_country]
    .filter(Boolean)
    .join(', ');

  return (
    <article className="mice-report-record-card">
      <main className="grid gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="mice-report-kicker">
              Record #{record.record_no || record.id} · {record.year_recorded || 'No year'}
            </p>

            <h3 className="mice-report-title">{text(record.event_name, 'Untitled MICE event')}</h3>

            <p className="mice-report-muted">
              {text(record.organization_name, 'No organization')} · {text(record.venue_area, 'No venue')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <span className={cx('mice-report-chip', record.status === 'submitted' ? 'is-green' : 'is-gold')}>
              {cleanLabel(record.status || 'draft')}
            </span>

            <span className="mice-report-chip">{text(record.event_category, 'Uncategorized')}</span>

            {record.booking_status ? <BookingStatusBadge value={record.booking_status} /> : null}
            {record.booking_payment_status ? <BookingStatusBadge value={record.booking_payment_status} compact /> : null}
          </div>
        </div>

        <div className="mice-report-detail-grid">
          <div>
            <p>Event Dates</p>
            <strong>
              {text(record.event_started_at || record.event_date_from)} to {text(record.event_finished_at || record.event_date_to)}
            </strong>
          </div>

          <div>
            <p>Participants</p>
            <strong>{participantTotal(record).toLocaleString()}</strong>
          </div>

          <div>
            <p>Room Nights</p>
            <strong>{numberValue(record.estimated_room_nights).toLocaleString()}</strong>
          </div>

          <div>
            <p>Tourism Receipts</p>
            <strong>{formatMoney(record.estimated_tourism_receipts || 0)}</strong>
          </div>
        </div>

        <div className="mice-report-detail-grid is-three">
          <div>
            <p>Origin</p>
            <strong>{origin || 'Unspecified'}</strong>
          </div>

          <div>
            <p>Visitor Type</p>
            <strong>
              Domestic {officialDomestic(record).toLocaleString()} / Foreign{' '}
              {officialForeign(record).toLocaleString()} / Visitors {officialVisitors(record).toLocaleString()}
            </strong>
          </div>

          <div>
            <p>Submitted</p>
            <strong>{formatDateTime(record.submitted_at)}</strong>
          </div>
        </div>

        <div className="mice-report-detail-grid">
          <div>
            <p>Covered Month / Hours</p>
            <strong>{text(record.covered_month)} / {numberValue(record.number_of_hours).toLocaleString()} hr/s</strong>
          </div>

          <div>
            <p>Countries</p>
            <strong>{numberValue(record.total_number_of_countries).toLocaleString()} / {text(record.countries_breakdown_text || record.main_origin_country)}</strong>
          </div>

          <div>
            <p>Exhibitions</p>
            <strong>{boolValue(record.has_exhibitions) ? 'Yes' : 'No'} / {numberValue(record.exhibitors_count).toLocaleString()} exhibitor/s</strong>
          </div>

          <div>
            <p>Classification / Type</p>
            <strong>{text(record.classification_of_event || record.event_category)} / {text(record.mice_type_of_event || record.type_of_event)}</strong>
          </div>
        </div>

        {record.booking_summary ? (
          <div className="mice-report-booking-link">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{record.booking_summary}</span>
          </div>
        ) : null}
      </main>

      <aside className="mice-report-card-actions">
        {record.booking_id ? (
          <Link href={bookingShowPath(role, record.booking_id)} className="mice-report-primary-action">
            Open Booking
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}

        {canManage ? (
          <Link href={recordEditPath(role, record.id)} className="mice-report-secondary-action">
            Edit Record
          </Link>
        ) : null}
      </aside>
    </article>
  );
}

export function MiceRegistryReportPage() {
  const { props } = usePage<PageProps>();

  const role = normalizeWorkspaceRole(props.workspaceRole) as RoleThemeKey;
  const canManage = Boolean(props.can_manage);
  const filters = props.filters || {};
  const rows = props.rows || props.records || props.miceRecords || [];
  const summary = props.summary || {};
  const basePath = reportBasePath(role);

  const [q, setQ] = useState(filters.q || '');
  const [year, setYear] = useState(filters.year_recorded || '');
  const [status, setStatus] = useState(filters.status || '');
  const [category, setCategory] = useState(filters.event_category || '');
  const [venue, setVenue] = useState(filters.venue_area || '');
  const [origin, setOrigin] = useState(filters.origin || '');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');
  const [enterpriseGroup, setEnterpriseGroup] = useState(filters.enterprise_group || '');
  const [bookingLinked, setBookingLinked] = useState(filters.booking_linked || '');
  const [filtering, setFiltering] = useState(false);

  const filterPayload = useMemo(
    () => ({
      q,
      year_recorded: year,
      status,
      event_category: category,
      venue_area: venue,
      origin,
      date_from: dateFrom,
      date_to: dateTo,
      enterprise_group: enterpriseGroup,
      booking_linked: bookingLinked,
    }),
    [q, year, status, category, venue, origin, dateFrom, dateTo, enterpriseGroup, bookingLinked],
  );

  function submitFilters(event?: FormEvent) {
    event?.preventDefault();
    setFiltering(true);

    router.get(basePath, filterPayload, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      onFinish: () => setFiltering(false),
    });
  }

  function clearFilters() {
    setQ('');
    setYear('');
    setStatus('');
    setCategory('');
    setVenue('');
    setOrigin('');
    setDateFrom('');
    setDateTo('');
    setEnterpriseGroup('');
    setBookingLinked('');
    setFiltering(true);

    router.get(basePath, {}, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      onFinish: () => setFiltering(false),
    });
  }

  return (
    <BookingRolePageShell
      role={role}
      title="MICE Registry"
      description="Booking-linked MICE reports, participant totals, visitor origin, room nights, tourism receipts, and export-ready registry data."
      actions={
        <>
          <Link href={reportPrintPath(role)} className="mice-report-secondary-action">
            <Printer className="h-4 w-4" />
            Print
          </Link>

          <a href={reportExportPath(role, filterPayload)} className="mice-report-primary-action">
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </>
      }
    >
      <section className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Submitted Reports"
            value={summary.submitted_records || 0}
            description="Submitted MICE reports linked to booking or manual records."
            icon={FileSpreadsheet}
            tone="green"
          />

          <StatCard
            label="Participants"
            value={numberValue(summary.total_participants).toLocaleString()}
            description="Total reported local, domestic, and foreign participants."
            icon={Users}
            tone="blue"
          />

          <StatCard
            label="Room Nights"
            value={numberValue(summary.estimated_room_nights).toLocaleString()}
            description="Estimated room nights from reported events."
            icon={CalendarDays}
            tone="gold"
          />

          <StatCard
            label="Tourism Receipts"
            value={formatMoney(summary.estimated_tourism_receipts || 0)}
            description="Estimated tourism receipts from MICE reports."
            icon={WalletCards}
            tone="green"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Local"
            value={numberValue(summary.local_participants).toLocaleString()}
            description="Local participants."
            icon={Users}
          />

          <StatCard
            label="Domestic"
            value={numberValue(summary.domestic_participants).toLocaleString()}
            description="Domestic participants."
            icon={Users}
          />

          <StatCard
            label="Foreign"
            value={numberValue(summary.foreign_participants).toLocaleString()}
            description="Foreign participants."
            icon={Users}
          />
        </div>

        <form onSubmit={submitFilters} className="mice-report-filter-panel">
          <label className="mice-report-search">
            <Search className="h-4 w-4" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search event, organization, venue, origin, booking..."
            />
          </label>

          <FilterControl label="Year">
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              <option value="">All Years</option>
              {(props.year_options || []).map((option) => (
                <option key={String(option)} value={String(option)}>
                  {option}
                </option>
              ))}
            </select>
          </FilterControl>

          <FilterControl label="Status">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="draft">Draft</option>
            </select>
          </FilterControl>

          <FilterControl label="Category">
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All Categories</option>
              {(props.category_options || []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterControl>

          <FilterControl label="Venue">
            <select value={venue} onChange={(event) => setVenue(event.target.value)}>
              <option value="">All Venues</option>
              {(props.venue_options || []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterControl>

          <FilterControl label="Origin">
            <input value={origin} onChange={(event) => setOrigin(event.target.value)} />
          </FilterControl>

          <FilterControl label="From">
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </FilterControl>

          <FilterControl label="To">
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </FilterControl>

          <FilterControl label="Enterprise">
            <select value={enterpriseGroup} onChange={(event) => setEnterpriseGroup(event.target.value)}>
              <option value="">All</option>
              <option value="PTE">PTE</option>
              <option value="STE">STE</option>
              <option value="UNCLASSIFIED">Unclassified</option>
            </select>
          </FilterControl>

          <FilterControl label="Booking Link">
            <select value={bookingLinked} onChange={(event) => setBookingLinked(event.target.value)}>
              <option value="">All</option>
              <option value="yes">Linked</option>
              <option value="no">Manual</option>
            </select>
          </FilterControl>

          <button type="submit" disabled={filtering} className="mice-report-primary-action">
            {filtering ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            Filter
          </button>

          <button type="button" disabled={filtering} onClick={clearFilters} className="mice-report-secondary-action">
            <SlidersHorizontal className="h-4 w-4" />
            Clear
          </button>
        </form>

        <div className="grid gap-4 xl:grid-cols-3">
          <BreakdownPanel title="By Category" rows={props.category_breakdown || []} icon={PieChart} />
          <BreakdownPanel title="By Venue" rows={props.venue_breakdown || []} icon={MapPin} />
          <BreakdownPanel title="By Origin" rows={props.origin_breakdown || []} icon={BarChart3} />
        </div>

        <div className="mice-report-toolbar">
          <div>
            <p>Registry Records</p>
            <h2>
              {rows.length} report{rows.length === 1 ? '' : 's'}
            </h2>
          </div>

          <span>Current filtered result set</span>
        </div>

        {rows.length > 0 ? (
          <div className="grid gap-4">
            {rows.map((record) => (
              <RecordCard key={record.id} record={record} role={role} canManage={canManage} />
            ))}
          </div>
        ) : (
          <section className="mice-report-empty">
            <Sparkles className="mx-auto h-12 w-12 text-[var(--bccc-backend-gold)]" />
            <h3>No MICE reports found</h3>
            <p>Adjust filters or complete a booking-linked MICE report first.</p>
          </section>
        )}
      </section>
    </BookingRolePageShell>
  );
}
