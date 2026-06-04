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
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FileImage,
  Filter,
  LoaderCircle,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

type OperationsBooking = {
  id: number | string;
  client_name?: string | null;
  company_name?: string | null;
  client_email?: string | null;
  client_contact_number?: string | null;
  type_of_event?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  booking_date_from?: string | null;
  booking_date_to?: string | null;
  created_at?: string | null;
  created_by_name?: string | null;
  items?: Array<{
    id?: number | string;
    service_name?: string | null;
    area?: string | null;
    quantity?: number | string | null;
    unit_price?: number | string | null;
    line_total?: number | string | null;
  }>;
  latest_payment?: {
    id?: number | string;
    status?: string | null;
    amount?: number | string | null;
    payment_gateway?: string | null;
    payment_type?: string | null;
    transaction_reference?: string | null;
    proof_image_url?: string | null;
    created_at?: string | null;
  } | null;
  totals?: {
    items_total?: number | string | null;
    submitted_payments_total?: number | string | null;
    confirmed_payments_total?: number | string | null;
    remaining_balance?: number | string | null;
    down_payment_required?: number | string | null;
  };
  deadline?: {
    risk?: string;
    label?: string;
    recommended?: string;
    down_deadline?: string | null;
    full_deadline?: string | null;
    down_required?: number | string | null;
    submitted_total?: number | string | null;
    confirmed_total?: number | string | null;
  };
};

type PendingPayment = {
  id: number | string;
  amount?: number | string | null;
  status?: string | null;
  payment_gateway?: string | null;
  payment_type?: string | null;
  transaction_reference?: string | null;
  payer_name?: string | null;
  proof_image_url?: string | null;
  created_at?: string | null;
  booking?: {
    id: number | string;
    client_name?: string | null;
    company_name?: string | null;
    booking_status?: string | null;
    payment_status?: string | null;
  } | null;
};

type AutomationEvent = {
  id: number | string;
  event_key?: string | null;
  title?: string | null;
  reason?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  from_payment_status?: string | null;
  to_payment_status?: string | null;
  event_at?: string | null;
  actor?: {
    name?: string | null;
    email?: string | null;
  } | null;
  booking?: {
    id?: number | string;
    client_name?: string | null;
    company_name?: string | null;
  } | null;
};

type PaginationLink = {
  url: string | null;
  label: string;
  active: boolean;
};

type PageProps = {
  workspaceRole?: string;
  filters?: {
    q?: string;
    booking_status?: string;
    payment_status?: string;
    risk?: string;
    attention?: string;
    gateway?: string;
  };
  bookings?: {
    data?: OperationsBooking[];
    links?: PaginationLink[];
    meta?: {
      from?: number | null;
      to?: number | null;
      total?: number | null;
    };
  };
  summary?: {
    visible?: number;
    review_needed?: number;
    due_soon?: number;
    overdue?: number;
    submitted_total?: number | string;
    confirmed_total?: number | string;
    outstanding_total?: number | string;
  };
  pendingPayments?: PendingPayment[];
  automationEvents?: AutomationEvent[];
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function operationsPath(role: RoleThemeKey) {
  if (role === 'admin') return '/admin/bookings/operations';
  if (role === 'manager') return '/manager/bookings/operations';
  if (role === 'staff') return '/staff/bookings/operations';

  return '/bookings/operations';
}

function paymentActionPath(action: 'approve' | 'decline' | 'fail', paymentId: number | string) {
  return `/bookings/operations/payments/${paymentId}/${action}`;
}

function cleanPageLabel(label?: string | null) {
  return String(label || '')
    .replace(/&laquo;|«/g, '‹')
    .replace(/&raquo;|»/g, '›')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function bookingLabel(booking: OperationsBooking) {
  return booking.company_name || booking.client_name || `Booking #${booking.id}`;
}

function eventLabel(booking: OperationsBooking) {
  return booking.type_of_event || 'Untitled event';
}

function riskTone(risk?: string | null) {
  const value = String(risk || '').toLowerCase();

  if (value === 'overdue') {
    return 'border-rose-300/45 bg-rose-400/10 text-rose-700 dark:text-rose-200';
  }

  if (value === 'due_soon') {
    return 'border-amber-300/45 bg-amber-400/10 text-amber-700 dark:text-amber-200';
  }

  if (value === 'watch') {
    return 'border-blue-300/45 bg-blue-400/10 text-blue-700 dark:text-blue-200';
  }

  if (value === 'closed') {
    return 'border-slate-300/45 bg-slate-400/10 text-slate-700 dark:text-slate-200';
  }

  return 'border-emerald-300/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200';
}

function proofTone(hasProof: boolean) {
  return hasProof
    ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200'
    : 'border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-200';
}

function statusOptions() {
  return [
    ['All booking statuses', ''],
    ['Pending', 'pending'],
    ['For Review', 'for_review'],
    ['Pencil Booked', 'pencil_booked'],
    ['Confirmed', 'confirmed'],
    ['Active', 'active'],
    ['Completed', 'completed'],
    ['Cancelled', 'cancelled'],
    ['Declined', 'declined'],
  ] as const;
}

function paymentOptions() {
  return [
    ['All payment statuses', ''],
    ['Unpaid', 'unpaid'],
    ['Partial', 'partial'],
    ['Paid', 'paid'],
    ['Owing', 'owing'],
  ] as const;
}

function riskOptions() {
  return [
    ['All risk states', ''],
    ['Normal', 'normal'],
    ['Watch', 'watch'],
    ['Due Soon', 'due_soon'],
    ['Overdue', 'overdue'],
    ['Closed', 'closed'],
  ] as const;
}

function attentionOptions() {
  return [
    ['All attention states', ''],
    ['Needs Payment Review', 'needs_review'],
    ['With Proof', 'with_proof'],
    ['Without Proof', 'without_proof'],
    ['Outstanding Balance', 'outstanding'],
  ] as const;
}

function gatewayOptions() {
  return [
    ['All gateways', ''],
    ['GCash', 'gcash'],
    ['PayPal', 'paypal'],
    ['Bank Transfer', 'bank'],
    ['Card', 'card'],
    ['Cash', 'cash'],
    ['Manual', 'manual'],
  ] as const;
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
  icon: typeof ReceiptText;
  tone?: 'default' | 'gold' | 'green' | 'red' | 'blue';
}) {
  return (
    <article className={cx('operations-stat-card', `tone-${tone}`)}>
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
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="operations-filter-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function SnapshotLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="operations-snapshot-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OperationsBookingCard({
  booking,
  role,
}: {
  booking: OperationsBooking;
  role: RoleThemeKey;
}) {
  const totals = booking.totals || {};
  const deadline = booking.deadline || {};
  const latestPayment = booking.latest_payment;
  const hasProof = Boolean(latestPayment?.proof_image_url);

  return (
    <article className="operations-booking-card">
      <main className="grid gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="operations-kicker">Booking #{booking.id}</p>

            <h3 className="operations-title">{bookingLabel(booking)}</h3>

            <p className="operations-muted">
              {eventLabel(booking)} · {booking.client_email || 'No email'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <BookingStatusBadge value={booking.booking_status} />
            <BookingStatusBadge value={booking.payment_status} compact />

            <span className={cx('operations-chip', riskTone(deadline.risk))}>
              {deadline.label || cleanLabel(deadline.risk || 'normal')}
            </span>
          </div>
        </div>

        <div className="operations-grid">
          <SnapshotLine label="Items Total" value={formatMoney(totals.items_total || 0)} />
          <SnapshotLine label="Submitted" value={formatMoney(totals.submitted_payments_total || 0)} />
          <SnapshotLine label="Confirmed" value={formatMoney(totals.confirmed_payments_total || 0)} />
          <SnapshotLine label="Remaining" value={formatMoney(totals.remaining_balance || 0)} />
          <SnapshotLine label="Down Required" value={formatMoney(totals.down_payment_required || 0)} />
          <SnapshotLine label="Start" value={formatDateTime(booking.booking_date_from)} />
        </div>

        <div className="operations-recommendation">
          <AlertTriangle className="h-4 w-4" />
          <span>{deadline.recommended || 'No immediate action required.'}</span>
        </div>

        {booking.items && booking.items.length > 0 ? (
          <div className="operations-services">
            <p>Services</p>
            <span>
              {booking.items
                .map((item) => item.area || item.service_name || 'Service')
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        ) : null}

        {latestPayment ? (
          <div className="operations-latest-payment">
            <div>
              <p>Latest Payment</p>
              <strong>
                {formatMoney(latestPayment.amount || 0)} · {cleanLabel(latestPayment.status || 'pending')}
              </strong>
              <span>
                {cleanLabel(latestPayment.payment_gateway || 'manual')} · Ref:{' '}
                {latestPayment.transaction_reference || '—'}
              </span>
            </div>

            <span className={cx('operations-chip', proofTone(hasProof))}>
              {hasProof ? 'Proof attached' : 'No proof'}
            </span>
          </div>
        ) : null}
      </main>

      <aside className="operations-card-actions">
        <Link href={bookingShowPath(role, booking.id)} className="operations-primary-action">
          <Eye className="h-4 w-4" />
          Open
        </Link>

        {latestPayment?.proof_image_url ? (
          <a
            href={latestPayment.proof_image_url}
            target="_blank"
            rel="noreferrer"
            className="operations-secondary-action"
          >
            <FileImage className="h-4 w-4" />
            Proof
          </a>
        ) : null}
      </aside>
    </article>
  );
}

function PendingPaymentCard({
  payment,
  busyId,
  onAction,
}: {
  payment: PendingPayment;
  busyId: number | string | null;
  onAction: (payment: PendingPayment, action: 'approve' | 'decline' | 'fail') => void;
}) {
  const busy = String(busyId || '') === String(payment.id);

  return (
    <article className="operations-pending-payment">
      <div>
        <p>Payment #{payment.id}</p>
        <h4>{payment.booking?.company_name || payment.booking?.client_name || 'Pending payment'}</h4>
        <span>
          {formatMoney(payment.amount || 0)} · {cleanLabel(payment.payment_gateway || 'manual')} ·{' '}
          {formatDateTime(payment.created_at)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {payment.proof_image_url ? (
          <a
            href={payment.proof_image_url}
            target="_blank"
            rel="noreferrer"
            className="operations-secondary-action"
          >
            <FileImage className="h-4 w-4" />
            Proof
          </a>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(payment, 'approve')}
          className="operations-primary-action"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Approve
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(payment, 'decline')}
          className="operations-danger-action"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Decline
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(payment, 'fail')}
          className="operations-danger-action"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          Fail
        </button>
      </div>
    </article>
  );
}

function AutomationEventCard({ event }: { event: AutomationEvent }) {
  return (
    <article className="operations-automation-event">
      <div className="operations-timeline-dot" />

      <div>
        <h4>{event.title || cleanLabel(event.event_key || 'Lifecycle event')}</h4>
        <p>{formatDateTime(event.event_at)}</p>

        {event.reason ? <span>{event.reason}</span> : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {event.from_status || event.to_status ? (
            <span className="operations-chip">
              {cleanLabel(event.from_status || '—')} → {cleanLabel(event.to_status || '—')}
            </span>
          ) : null}

          {event.from_payment_status || event.to_payment_status ? (
            <span className="operations-chip">
              Payment: {cleanLabel(event.from_payment_status || '—')} →{' '}
              {cleanLabel(event.to_payment_status || '—')}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function BookingOperationsPage() {
  const { props } = usePage<PageProps>();

  const role = normalizeWorkspaceRole(props.workspaceRole) as RoleThemeKey;
  const filters = props.filters || {};
  const bookings = props.bookings?.data || [];
  const links = props.bookings?.links || [];
  const summary = props.summary || {};
  const pendingPayments = props.pendingPayments || [];
  const automationEvents = props.automationEvents || [];
  const basePath = operationsPath(role);

  const [q, setQ] = useState(filters.q || '');
  const [bookingStatus, setBookingStatus] = useState(filters.booking_status || '');
  const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
  const [risk, setRisk] = useState(filters.risk || '');
  const [attention, setAttention] = useState(filters.attention || '');
  const [gateway, setGateway] = useState(filters.gateway || '');
  const [filtering, setFiltering] = useState(false);
  const [busyId, setBusyId] = useState<number | string | null>(null);

  function submitFilters(event?: FormEvent) {
    event?.preventDefault();
    setFiltering(true);

    router.get(
      basePath,
      {
        q: q || undefined,
        booking_status: bookingStatus || undefined,
        payment_status: paymentStatus || undefined,
        risk: risk || undefined,
        attention: attention || undefined,
        gateway: gateway || undefined,
      },
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onFinish: () => setFiltering(false),
      },
    );
  }

  function resetFilters() {
    setQ('');
    setBookingStatus('');
    setPaymentStatus('');
    setRisk('');
    setAttention('');
    setGateway('');
    setFiltering(true);

    router.get(basePath, {}, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      onFinish: () => setFiltering(false),
    });
  }

  function handlePaymentAction(payment: PendingPayment, action: 'approve' | 'decline' | 'fail') {
    const label = action === 'approve' ? 'approve' : action === 'decline' ? 'decline' : 'mark as failed';

    if (!window.confirm(`Are you sure you want to ${label} this payment?`)) {
      return;
    }

    setBusyId(payment.id);

    router.post(
      paymentActionPath(action, payment.id),
      {
        remarks: `${cleanLabel(action)} from operations center.`,
      },
      {
        preserveScroll: true,
        onFinish: () => setBusyId(null),
      },
    );
  }

  return (
    <BookingRolePageShell
      role={role}
      title="Booking Operations"
      description="Monitor payment deadlines, pending proof reviews, booking compliance, and lifecycle activity in one control center."
      actions={
        <>
          <Link href={role === 'admin' ? '/admin/bookings' : role === 'manager' ? '/manager/bookings' : '/staff/bookings'} className="operations-secondary-action">
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Link>

          <button type="button" onClick={() => submitFilters()} className="operations-secondary-action">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </>
      }
    >
      <section className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Visible Records"
            value={summary.visible || bookings.length}
            description="Bookings currently included in the operations queue."
            icon={ReceiptText}
          />

          <StatCard
            label="Payment Review"
            value={summary.review_needed || 0}
            description="Bookings with pending payment proof."
            icon={AlertTriangle}
            tone="gold"
          />

          <StatCard
            label="Due Soon"
            value={summary.due_soon || 0}
            description="Bookings approaching policy deadlines."
            icon={Clock3}
            tone="blue"
          />

          <StatCard
            label="Overdue"
            value={summary.overdue || 0}
            description="Bookings beyond payment compliance windows."
            icon={XCircle}
            tone="red"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Submitted Total"
            value={formatMoney(summary.submitted_total || 0)}
            description="Pending + confirmed/verified/paid payment records."
            icon={WalletCards}
            tone="blue"
          />

          <StatCard
            label="Confirmed Total"
            value={formatMoney(summary.confirmed_total || 0)}
            description="Confirmed, verified, and paid records only."
            icon={ShieldCheck}
            tone="green"
          />

          <StatCard
            label="Outstanding"
            value={formatMoney(summary.outstanding_total || 0)}
            description="Visible remaining balances."
            icon={ReceiptText}
            tone={numberValue(summary.outstanding_total) > 0 ? 'gold' : 'green'}
          />
        </div>

        <form onSubmit={submitFilters} className="operations-filter-panel">
          <label className="operations-search">
            <Search className="h-4 w-4" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search client, company, email, event, reference..."
            />
          </label>

          <FilterSelect label="Booking Status" value={bookingStatus} onChange={setBookingStatus}>
            {statusOptions().map(([label, value]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Payment Status" value={paymentStatus} onChange={setPaymentStatus}>
            {paymentOptions().map(([label, value]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Risk" value={risk} onChange={setRisk}>
            {riskOptions().map(([label, value]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Attention" value={attention} onChange={setAttention}>
            {attentionOptions().map(([label, value]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Gateway" value={gateway} onChange={setGateway}>
            {gatewayOptions().map(([label, value]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>

          <button type="submit" disabled={filtering} className="operations-primary-action">
            {filtering ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            Filter
          </button>

          <button type="button" disabled={filtering} onClick={resetFilters} className="operations-secondary-action">
            <SlidersHorizontal className="h-4 w-4" />
            Clear
          </button>
        </form>

        {pendingPayments.length > 0 ? (
          <section className="operations-panel">
            <header className="operations-section-header">
              <div>
                <p>Pending Payment Proof</p>
                <h2>Review queue</h2>
                <span>These are the latest pending payment records inside the visible booking set.</span>
              </div>

              <ReceiptText className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
            </header>

            <div className="grid gap-3">
              {pendingPayments.map((payment) => (
                <PendingPaymentCard
                  key={payment.id}
                  payment={payment}
                  busyId={busyId}
                  onAction={handlePaymentAction}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="operations-toolbar">
          <div>
            <p>Operations Queue</p>
            <h2>
              {props.bookings?.meta?.total ?? bookings.length} booking
              {Number(props.bookings?.meta?.total ?? bookings.length) === 1 ? '' : 's'}
            </h2>
          </div>

          <span>
            Showing {props.bookings?.meta?.from ?? (bookings.length > 0 ? 1 : 0)} to{' '}
            {props.bookings?.meta?.to ?? bookings.length}
            {props.bookings?.meta?.total ? ` of ${props.bookings.meta.total}` : ''}
          </span>
        </div>

        {bookings.length > 0 ? (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <OperationsBookingCard key={booking.id} booking={booking} role={role} />
            ))}
          </div>
        ) : (
          <section className="operations-empty">
            <Sparkles className="mx-auto h-12 w-12 text-[var(--bccc-backend-gold)]" />
            <h3>No operations records found</h3>
            <p>Clear the filters or wait for new booking/payment activity.</p>
          </section>
        )}

        {links.length > 0 ? (
          <nav className="operations-pagination" aria-label="Operations pagination">
            {links.map((link, index) =>
              link.url ? (
                <Link
                  key={`${link.label}-${index}`}
                  href={link.url}
                  preserveScroll
                  className={cx('operations-page-link', link.active && 'is-active')}
                >
                  {cleanPageLabel(link.label)}
                </Link>
              ) : (
                <span key={`${link.label}-${index}`} className="operations-page-link is-disabled">
                  {cleanPageLabel(link.label)}
                </span>
              ),
            )}
          </nav>
        ) : null}

        {automationEvents.length > 0 ? (
          <section className="operations-panel">
            <header className="operations-section-header">
              <div>
                <p>Lifecycle Activity</p>
                <h2>Automation and status movement</h2>
                <span>Recent lifecycle events connected to visible booking activity.</span>
              </div>

              <ShieldCheck className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
            </header>

            <div className="grid gap-3">
              {automationEvents.map((event) => (
                <AutomationEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </BookingRolePageShell>
  );
}
