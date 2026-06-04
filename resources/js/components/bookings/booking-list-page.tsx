import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import {
  bookingBasePath,
  bookingCreatePath,
  bookingShowPath,
  bookingSurveyPath,
  formatDateTime,
  formatMoney,
  normalizeWorkspaceRole,
  type BookingLike,
} from '@/lib/booking-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { Link, router, usePage } from '@inertiajs/react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileSpreadsheet,
  Filter,
  LoaderCircle,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import BookingDeadlineBadge from '@/components/bookings/booking-deadline-badge';

type PaginationLink = {
  url?: string | null;
  label?: string | null;
  active?: boolean;
};

type CollectionLike<T> =
  | T[]
  | {
      data?: T[];
      links?: PaginationLink[];
      meta?: {
        links?: PaginationLink[];
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
        from?: number | null;
        to?: number | null;
      };
    };

type ServiceOption = {
  id: number | string;
  name: string;
  service_type_name?: string | null;
  service_type?: {
    id?: number | string;
    name?: string | null;
  } | null;
};

type StatusCountRow = {
  label?: string | null;
  status?: string | null;
  booking_status?: string | null;
  total?: number | string | null;
  count?: number | string | null;
};

type PageProps = {
  workspaceRole?: string;
  bookings?: CollectionLike<BookingLike>;
  services?: ServiceOption[] | { data?: ServiceOption[] };
  filters?: {
    q?: string;
    status?: string;
    booking_status?: string;
    payment_status?: string;
    service_id?: string | number | null;
    date_from?: string | null;
    date_to?: string | null;
    sort?: string | null;
  };
  statusCounts?: Record<string, number | string> | StatusCountRow[];
  canCreateBooking?: boolean;
  canManagePayments?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function collection<T>(value?: CollectionLike<T>): T[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
}

function serviceCollection(value?: ServiceOption[] | { data?: ServiceOption[] }): ServiceOption[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
}

function paginationLinks(value?: CollectionLike<BookingLike>): PaginationLink[] {
  if (!value || Array.isArray(value)) return [];
  if (Array.isArray(value.links)) return value.links;
  if (Array.isArray(value.meta?.links)) return value.meta.links;
  return [];
}

function paginationMeta(value?: CollectionLike<BookingLike>) {
  if (!value || Array.isArray(value)) return null;
  return value.meta ?? null;
}

function text(value: unknown, fallback = 'Not set'): string {
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback;
  }

  return String(value);
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusOptions() {
  return [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'For Review', value: 'for_review' },
    { label: 'Pencil Booked', value: 'pencil_booked' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Declined', value: 'declined' },
  ];
}

function paymentOptions() {
  return [
    { label: 'All Payments', value: '' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Paid', value: 'paid' },
    { label: 'Owing', value: 'owing' },
  ];
}

function sortOptions() {
  return [
    { label: 'Newest First', value: 'newest' },
    { label: 'Upcoming First', value: 'upcoming' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Recently Updated', value: 'updated' },
  ];
}

function listTitle(role: RoleThemeKey) {
  if (role === 'admin') return 'Booking Operations';
  if (role === 'manager') return 'Booking Review';
  if (role === 'staff') return 'Staff Booking Desk';
  return 'My Bookings';
}

function listDescription(role: RoleThemeKey) {
  if (role === 'user') {
    return 'Track your submitted event requests, required MICE report, payment proof, and reservation progress.';
  }

  if (role === 'manager') {
    return 'Review reservation records, MICE report compliance, payment compliance, and operational schedule readiness.';
  }

  if (role === 'staff') {
    return 'Assist clients, search active bookings, monitor MICE/payment requirements, and open reservation records quickly.';
  }

  return 'Search, filter, review, and manage booking records across the BCCC reservation workflow.';
}

function serviceLabel(service?: ServiceOption | null): string {
  if (!service) return 'Service';

  const typeName = service.service_type_name || service.service_type?.name;

  if (typeName) {
    return `${typeName} · ${service.name}`;
  }

  return service.name;
}

function bookingServiceName(booking: BookingLike): string {
  return text(
    booking.service_name ??
      booking.service_type_name ??
      booking.venue_area ??
      (booking.service as { name?: string | null } | null | undefined)?.name,
    'Venue not set',
  );
}

function bookingClientName(booking: BookingLike): string {
  return text(booking.company_name || booking.client_name, 'Client not set');
}

function bookingEventName(booking: BookingLike): string {
  return text(booking.type_of_event, `Booking #${booking.id}`);
}

function totalValue(booking: BookingLike, key: string): number | string | null {
  const totals = booking.totals as Record<string, number | string | null> | null | undefined;
  return totals?.[key] ?? null;
}

function hasMiceReport(booking: BookingLike): boolean {
  const report = booking.mice_report as { submitted_at?: unknown } | null | undefined;

  return Boolean(
    booking.mice_report_submitted ||
      report?.submitted_at ||
      booking.mice_report_status === 'submitted',
  );
}

function confirmedPaymentTotal(booking: BookingLike): number {
  return numberValue(
    totalValue(booking, 'confirmed_payments_total') ??
      totalValue(booking, 'payments_total') ??
      0,
  );
}

function submittedPaymentTotal(booking: BookingLike): number {
  return numberValue(totalValue(booking, 'submitted_payments_total') ?? 0);
}

function bookingDeadlineDate(booking: BookingLike): string | null {
  return String(
    booking.deadline_at ??
      booking.deadlineAt ??
      booking.payment_balance_due_at ??
      booking.expired_at ??
      '',
  ) || null;
}

function daysRemainingLabel(value: unknown): string {
  if (!value) return 'No schedule';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'No schedule';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - today.getTime()) / 86400000);

  if (days > 1) return `${days} days remaining`;
  if (days === 1) return 'Tomorrow';
  if (days === 0) return 'Today';
  if (days === -1) return '1 day past';
  return `${Math.abs(days)} days past`;
}

function bookingTotal(booking: BookingLike): number {
  return numberValue(totalValue(booking, 'items_total') ?? 0);
}

function remainingBalance(booking: BookingLike): number {
  const direct = totalValue(booking, 'remaining_balance');

  if (direct !== null && direct !== undefined) {
    return Math.max(0, numberValue(direct));
  }

  return Math.max(0, bookingTotal(booking) - confirmedPaymentTotal(booking));
}

function paymentRequirementLabel(booking: BookingLike): string {
  const remaining = remainingBalance(booking);
  const pendingSubmitted = submittedPaymentTotal(booking) > confirmedPaymentTotal(booking);

  if (remaining <= 0) return 'Payment complete';
  if (pendingSubmitted) return 'Payment pending review';
  return 'Payment proof needed';
}

function miceRequirementLabel(booking: BookingLike): string {
  return hasMiceReport(booking) ? 'MICE report submitted' : 'MICE report required';
}

function requirementTone(done: boolean) {
  return done
    ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200'
    : 'border-amber-300/45 bg-amber-400/10 text-amber-700 dark:text-amber-200';
}

function paymentTone(booking: BookingLike) {
  if (remainingBalance(booking) <= 0) {
    return 'border-emerald-300/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200';
  }

  if (submittedPaymentTotal(booking) > confirmedPaymentTotal(booking)) {
    return 'border-blue-300/40 bg-blue-400/10 text-blue-700 dark:text-blue-200';
  }

  return 'border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-200';
}

function normalizeCountMap(value?: PageProps['statusCounts']): Record<string, number> {
  if (!value) return {};

  if (Array.isArray(value)) {
    return value.reduce<Record<string, number>>((carry, row) => {
      const key = String(row.booking_status || row.status || row.label || 'unknown').toLowerCase();
      carry[key] = numberValue(row.total ?? row.count ?? 0);
      return carry;
    }, {});
  }

  return Object.entries(value).reduce<Record<string, number>>((carry, [key, count]) => {
    carry[String(key).toLowerCase()] = numberValue(count);
    return carry;
  }, {});
}

function paginationLabel(label?: string | null) {
  return String(label || '')
    .replace('&laquo;', '‹')
    .replace('&raquo;', '›')
    .replace(/&amp;/g, '&');
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
  icon: typeof ClipboardList;
  tone?: 'default' | 'gold' | 'green' | 'red' | 'blue';
}) {
  return (
    <article className={cx('booking-list-stat-card', `tone-${tone}`)}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{description}</span>
      </div>

      <Icon className="h-5 w-5" />
    </article>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="booking-list-filter-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function DetailMini({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon: typeof CalendarDays;
}) {
  return (
    <div className="booking-list-detail-mini">
      <Icon className="h-4 w-4" />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  role,
  canManagePayments,
}: {
  booking: BookingLike;
  role: RoleThemeKey;
  canManagePayments: boolean;
}) {
  const miceDone = hasMiceReport(booking);
  const paymentDone = remainingBalance(booking) <= 0;
  const showMiceCta = role === 'user' && !miceDone;
  const showPaymentCta = role === 'user' && !paymentDone;

  return (
    <article className="booking-list-card">
      <div className="booking-list-card-main">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="booking-list-kicker">Booking #{booking.id}</p>

            <h3 className="booking-list-title">
              {bookingEventName(booking)}
            </h3>

            <p className="booking-list-muted">
              {bookingClientName(booking)} · {bookingServiceName(booking)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
  <BookingStatusBadge value={booking.booking_status} />
  <BookingStatusBadge value={booking.payment_status} compact />
  <BookingDeadlineBadge booking={booking} compact />
</div>
        </div>

        <div className="booking-list-detail-grid">
          <DetailMini label="Start" value={formatDateTime(booking.booking_date_from)} icon={CalendarDays} />
          <DetailMini label="End" value={formatDateTime(booking.booking_date_to)} icon={Clock3} />
          <DetailMini label="Guests" value={text(booking.number_of_guests, '—')} icon={Users} />
          <DetailMini label="Days Remaining" value={daysRemainingLabel(booking.booking_date_from)} icon={CalendarDays} />
          <DetailMini label="Payment Deadline" value={bookingDeadlineDate(booking) ? formatDateTime(bookingDeadlineDate(booking)) : 'Not set'} icon={Clock3} />
          <DetailMini label="Remaining" value={formatMoney(remainingBalance(booking))} icon={WalletCards} />
        </div>

        <div className="booking-list-requirements">
          <span className={cx('booking-list-requirement-chip', requirementTone(miceDone))}>
            {miceDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
            {miceRequirementLabel(booking)}
          </span>

          <span className={cx('booking-list-requirement-chip', paymentTone(booking))}>
            {paymentDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ReceiptText className="h-3.5 w-3.5" />}
            {paymentRequirementLabel(booking)}
          </span>

          {canManagePayments && submittedPaymentTotal(booking) > confirmedPaymentTotal(booking) ? (
            <span className="booking-list-requirement-chip border-blue-300/40 bg-blue-400/10 text-blue-700 dark:text-blue-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              Payment review needed
            </span>
          ) : null}
        </div>
      </div>

      <aside className="booking-list-card-side">
        <div className="booking-list-money-box">
          <p>Booking Total</p>
          <strong>{formatMoney(bookingTotal(booking))}</strong>
          <span>Confirmed: {formatMoney(confirmedPaymentTotal(booking))}</span>
        </div>

        <div className="grid gap-2">
          <Link href={bookingShowPath(role, booking.id)} className="booking-list-primary-action">
            <Eye className="h-4 w-4" />
            Open
          </Link>

          {showMiceCta ? (
            <Link href={bookingSurveyPath(role, booking.id)} className="booking-list-secondary-action">
              <FileSpreadsheet className="h-4 w-4" />
              MICE Report
            </Link>
          ) : null}

          {showPaymentCta ? (
            <Link href={`${bookingShowPath(role, booking.id)}#payment-proof`} className="booking-list-secondary-action">
              <ReceiptText className="h-4 w-4" />
              Payment
            </Link>
          ) : null}
        </div>
      </aside>
    </article>
  );
}

function EmptyState({
  role,
  canCreate,
}: {
  role: RoleThemeKey;
  canCreate: boolean;
}) {
  return (
    <section className="booking-list-empty">
      <ClipboardList className="mx-auto h-12 w-12 text-[var(--bccc-backend-gold)]" />

      <h3>No bookings found</h3>

      <p>
        Try clearing filters or create a new booking request. Matching booking records will appear here once available.
      </p>

      {canCreate ? (
        <Link href={bookingCreatePath(role)} className="booking-list-primary-action mx-auto mt-5 w-max">
          <Plus className="h-4 w-4" />
          {role === 'user' ? 'Book Your Event' : 'Create Booking'}
        </Link>
      ) : null}
    </section>
  );
}

export function BookingListPage() {
  const { props } = usePage<PageProps>();
  const role = normalizeWorkspaceRole(props.workspaceRole) as RoleThemeKey;
  const rows = useMemo(() => collection(props.bookings), [props.bookings]);
  const services = useMemo(() => serviceCollection(props.services), [props.services]);
  const pageLinks = paginationLinks(props.bookings);
  const meta = paginationMeta(props.bookings);
  const counts = normalizeCountMap(props.statusCounts);

  const basePath = bookingBasePath(role);
  const canCreate = Boolean(props.canCreateBooking ?? (role === 'admin' || role === 'staff' || role === 'user'));
  const canManagePayments = Boolean(props.canManagePayments);

  const [q, setQ] = useState(props.filters?.q ?? '');
  const [bookingStatus, setBookingStatus] = useState(
    props.filters?.booking_status ?? props.filters?.status ?? '',
  );
  const [paymentStatus, setPaymentStatus] = useState(props.filters?.payment_status ?? '');
  const [serviceId, setServiceId] = useState(String(props.filters?.service_id ?? ''));
  const [dateFrom, setDateFrom] = useState(String(props.filters?.date_from ?? ''));
  const [dateTo, setDateTo] = useState(String(props.filters?.date_to ?? ''));
  const [sort, setSort] = useState(String(props.filters?.sort ?? (role === 'user' ? 'newest' : 'upcoming')));
  const [filtering, setFiltering] = useState(false);

  const pendingCount = counts.pending ?? 0;
  const confirmedCount = (counts.confirmed ?? 0) + (counts.active ?? 0);

  const visiblePendingPayment = rows.filter((booking) => submittedPaymentTotal(booking) > confirmedPaymentTotal(booking)).length;
  const missingMiceReports = rows.filter((booking) => !hasMiceReport(booking)).length;

  function submitFilter(event: FormEvent) {
    event.preventDefault();
    setFiltering(true);

    router.get(
      basePath,
      {
        q: q || undefined,
        booking_status: bookingStatus || undefined,
        payment_status: paymentStatus || undefined,
        service_id: serviceId || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort: sort || undefined,
      },
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onFinish: () => setFiltering(false),
      },
    );
  }

  function clearFilters() {
    setQ('');
    setBookingStatus('');
    setPaymentStatus('');
    setServiceId('');
    setDateFrom('');
    setDateTo('');
    setSort(role === 'user' ? 'newest' : 'upcoming');
    setFiltering(true);

    router.get(
      basePath,
      {},
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onFinish: () => setFiltering(false),
      },
    );
  }

  return (
    <BookingRolePageShell
      role={role}
      title={listTitle(role)}
      description={listDescription(role)}
      actions={
        <>
          <Link href={basePath} className="booking-list-secondary-action">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Link>

          {canCreate ? (
            <Link href={bookingCreatePath(role)} className="booking-list-primary-action">
              <Plus className="h-4 w-4" />
              {role === 'user' ? 'Book Event' : 'Create Booking'}
            </Link>
          ) : null}
        </>
      }
    >
      <section className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pending"
            value={pendingCount}
            description="Bookings awaiting action."
            icon={Clock3}
            tone="gold"
          />

          <StatCard
            label="Confirmed / Active"
            value={confirmedCount}
            description="Bookings already accepted or active."
            icon={ShieldCheck}
            tone="green"
          />

          <StatCard
            label="Payment Review"
            value={visiblePendingPayment}
            description="Visible records with submitted but unconfirmed payments."
            icon={ReceiptText}
            tone="blue"
          />

          <StatCard
            label="Missing MICE"
            value={missingMiceReports}
            description="Visible records without a submitted MICE report."
            icon={FileSpreadsheet}
            tone={missingMiceReports > 0 ? 'red' : 'green'}
          />
        </div>

        <form onSubmit={submitFilter} className="booking-list-filter-panel">
          <label className="booking-list-search">
            <Search className="h-4 w-4" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search client, company, event, email..."
            />
          </label>

          <FilterSelect label="Booking Status" value={bookingStatus} onChange={setBookingStatus}>
            {statusOptions().map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Payment Status" value={paymentStatus} onChange={setPaymentStatus}>
            {paymentOptions().map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          {services.length > 0 ? (
            <FilterSelect label="Service / Venue" value={serviceId} onChange={setServiceId}>
              <option value="">All Services</option>
              {services.map((service) => (
                <option key={service.id} value={String(service.id)}>
                  {serviceLabel(service)}
                </option>
              ))}
            </FilterSelect>
          ) : null}

          <label className="booking-list-filter-control">
            <span>Date From</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>

          <label className="booking-list-filter-control">
            <span>Date To</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>

          <FilterSelect label="Sort" value={sort} onChange={setSort}>
            {sortOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <button type="submit" disabled={filtering} className="booking-list-primary-action">
            {filtering ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            Filter
          </button>

          <button type="button" onClick={clearFilters} disabled={filtering} className="booking-list-secondary-action">
            <SlidersHorizontal className="h-4 w-4" />
            Clear
          </button>
        </form>

        <div className="booking-list-toolbar">
          <div>
            <p>Records</p>
            <h2>
              {meta?.total ?? rows.length} booking{Number(meta?.total ?? rows.length) === 1 ? '' : 's'}
            </h2>
          </div>

          <span>
            Showing {meta?.from ?? (rows.length > 0 ? 1 : 0)} to {meta?.to ?? rows.length}
            {meta?.total ? ` of ${meta.total}` : ''}
          </span>
        </div>

        {rows.length > 0 ? (
          <div className="grid gap-4">
            {rows.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role={role}
                canManagePayments={canManagePayments}
              />
            ))}
          </div>
        ) : (
          <EmptyState role={role} canCreate={canCreate} />
        )}

        {pageLinks.length > 0 ? (
          <nav className="booking-list-pagination" aria-label="Booking pagination">
            {pageLinks.map((link, index) =>
              link.url ? (
                <Link
                  key={`${link.label}-${index}`}
                  href={link.url}
                  preserveScroll
                  className={cx('booking-list-page-link', link.active && 'is-active')}
                >
                  {paginationLabel(link.label)}
                </Link>
              ) : (
                <span key={`${link.label}-${index}`} className="booking-list-page-link is-disabled">
                  {paginationLabel(link.label)}
                </span>
              ),
            )}
          </nav>
        ) : null}

        {role === 'user' ? (
          <section className="booking-list-client-help">
            <Sparkles className="h-5 w-5" />
            <div>
              <h3>Reminder after submitting a booking</h3>
              <p>
                Complete the built-in MICE report first, then submit payment proof. Your booking is only finalized after office validation and payment compliance.
              </p>
            </div>
            <ArrowRight className="h-4 w-4" />
          </section>
        ) : null}
      </section>
    </BookingRolePageShell>
  );
}
