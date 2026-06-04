import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { confirmBcccAction } from '@/components/ui/bccc-confirm-dialog';
import {
  bookingBasePath,
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
  CreditCard,
  ExternalLink,
  Eye,
  FileImage,
  Filter,
  LoaderCircle,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';

type ReviewPayment = {
  id: number | string;
  status: string;
  payment_method?: string | null;
  payment_gateway?: string | null;
  payment_type?: string | null;
  amount: number | string;
  transaction_reference?: string | null;
  remarks?: string | null;
  payer_name?: string | null;
  card_holder_name?: string | null;
  card_last_four?: string | null;
  marketing_consent?: boolean;
  proof_image_url?: string | null;
  paid_at?: string | null;
  verified_at?: string | null;
  approved_at?: string | null;
  declined_at?: string | null;
  failed_at?: string | null;
  created_at?: string | null;
  booking?: {
    id: number | string;
    company_name?: string | null;
    client_name?: string | null;
    client_email?: string | null;
    type_of_event?: string | null;
    booking_status?: string | null;
    payment_status?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
    created_at?: string | null;
    created_by_name?: string | null;
    service_name?: string | null;
    service_type_name?: string | null;
    items?: Array<{
      id?: number | string;
      service_name?: string | null;
      area?: string | null;
      line_total?: number | string | null;
    }>;
    totals?: {
      items_total?: number | string | null;
      submitted_payments_total?: number | string | null;
      confirmed_payments_total?: number | string | null;
      remaining_balance?: number | string | null;
      down_payment_required?: number | string | null;
    };
    deadline?: {
      state?: string;
      down_deadline?: string | null;
      full_deadline?: string | null;
      submitted_total?: number | string | null;
      confirmed_total?: number | string | null;
    };
  } | null;
};

type PaymentPagination = {
  data?: ReviewPayment[];
  links?: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  meta?: {
    from?: number | null;
    to?: number | null;
    total?: number | null;
  };
};

type PageProps = {
  workspaceRole?: string;
  filters?: {
    q?: string;
    status?: string;
    gateway?: string;
    payment_type?: string;
    booking_status?: string;
    deadline?: string;
    proof?: string;
  };
  payments?: PaymentPagination;
  stats?: {
    all?: number;
    pending?: number;
    confirmed?: number;
    verified?: number;
    paid?: number;
    failed?: number;
    declined?: number;
    refunded?: number;
    review_needed?: number;
    due_soon?: number;
    overdue?: number;
    with_proof?: number;
  };
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pageTitle(role: RoleThemeKey) {
  if (role === 'manager') return 'Manager Payment Review';
  if (role === 'admin') return 'Payment Review Center';
  return 'Payment Review';
}

function pageDescription(role: RoleThemeKey) {
  if (role === 'manager') {
    return 'Review payment proof submissions, confirm valid payments, and resolve compliance risks before final booking approval.';
  }

  return 'Monitor submitted payment proof, validate transactions, and keep booking payment status aligned with operations.';
}

function paymentUpdatePath(role: RoleThemeKey, bookingId: number | string, paymentId: number | string) {
  if (role === 'admin') return `/admin/bookings/${bookingId}/payments/${paymentId}`;
  if (role === 'manager') return `/manager/bookings/${bookingId}/payments/${paymentId}`;
  if (role === 'staff') return `/staff/bookings/${bookingId}/payments/${paymentId}`;
  return `/bookings/${bookingId}/payments/${paymentId}`;
}

function reviewPath(role: RoleThemeKey) {
  if (role === 'admin') return '/admin/payments/review';
  if (role === 'manager') return '/manager/payments/review';
  return '/payments/review';
}

function cleanPageLabel(label?: string | null) {
  return String(label || '')
    .replace(/&laquo;|«/g, '‹')
    .replace(/&raquo;|»/g, '›')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function paymentStatusTone(status?: string | null) {
  const value = String(status || '').toLowerCase();

  if (['confirmed', 'verified', 'paid'].includes(value)) {
    return 'border-emerald-300/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200';
  }

  if (value === 'pending') {
    return 'border-amber-300/45 bg-amber-400/10 text-amber-700 dark:text-amber-200';
  }

  if (['failed', 'declined'].includes(value)) {
    return 'border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-200';
  }

  if (value === 'refunded') {
    return 'border-slate-300/40 bg-slate-400/10 text-slate-700 dark:text-slate-200';
  }

  return 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)]';
}

function proofTone(hasProof: boolean) {
  return hasProof
    ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200'
    : 'border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-200';
}

function deadlineLabel(payment: ReviewPayment): string {
  const state = payment.booking?.deadline?.state || '';

  if (state === 'first_overdue') return '24H Overdue';
  if (state === 'final_overdue') return '48H Overdue';
  if (state === 'first_due_soon') return '24H Due Soon';
  if (state === 'final_due_soon') return '48H Due Soon';
  if (state === 'fulfilled') return 'Fulfilled';
  if (state === 'not_applicable') return 'Closed';

  return 'Monitoring';
}

function deadlineTone(payment: ReviewPayment) {
  const state = payment.booking?.deadline?.state || '';

  if (state.includes('overdue')) {
    return 'border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-200';
  }

  if (state.includes('due_soon')) {
    return 'border-amber-300/45 bg-amber-400/10 text-amber-700 dark:text-amber-200';
  }

  if (state === 'fulfilled') {
    return 'border-emerald-300/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200';
  }

  return 'border-blue-300/40 bg-blue-400/10 text-blue-700 dark:text-blue-200';
}

function statusOptions() {
  return [
    ['All payment statuses', ''],
    ['Pending', 'pending'],
    ['Confirmed', 'confirmed'],
    ['Verified', 'verified'],
    ['Paid', 'paid'],
    ['Failed', 'failed'],
    ['Declined', 'declined'],
    ['Refunded', 'refunded'],
  ] as const;
}

function gatewayOptions() {
  return [
    ['All gateways', ''],
    ['GCash', 'gcash'],
    ['PayPal', 'paypal'],
    ['Bank', 'bank'],
    ['Card', 'card'],
    ['Cash', 'cash'],
    ['Manual', 'manual'],
  ] as const;
}

function paymentTypeOptions() {
  return [
    ['All payment types', ''],
    ['Down Payment', 'down'],
    ['Full Payment', 'full'],
    ['Balance', 'balance'],
  ] as const;
}

function bookingStatusOptions() {
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

function deadlineOptions() {
  return [
    ['All deadline states', ''],
    ['Review Needed', 'review'],
    ['Due Soon', 'due_soon'],
    ['Overdue', 'overdue'],
    ['Normal / Closed', 'normal'],
  ] as const;
}

function proofOptions() {
  return [
    ['All proof states', ''],
    ['With Proof Image', 'with_proof'],
    ['Without Proof Image', 'without_proof'],
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
  icon: typeof CreditCard;
  tone?: 'default' | 'gold' | 'green' | 'red' | 'blue';
}) {
  return (
    <article className={cx('payment-review-stat-card', `tone-${tone}`)}>
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
    <label className="payment-review-filter-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function SnapshotLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="payment-review-snapshot-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PaymentCard({
  payment,
  role,
  busyId,
  onUpdate,
}: {
  payment: ReviewPayment;
  role: RoleThemeKey;
  busyId: number | string | null;
  onUpdate: (payment: ReviewPayment, status: 'confirmed' | 'verified' | 'paid' | 'failed' | 'declined') => void;
}) {
  const booking = payment.booking;
  const totals = booking?.totals || {};
  const hasProof = Boolean(payment.proof_image_url);
  const busy = String(busyId || '') === String(payment.id);

  return (
    <article className="payment-review-card">
      <main className="grid gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="payment-review-kicker">Payment #{payment.id}</p>

            <h3 className="payment-review-title">
              {booking?.company_name || booking?.client_name || `Booking #${booking?.id || '—'}`}
            </h3>

            <p className="payment-review-muted">
              {booking?.type_of_event || 'No event title'} · {booking?.client_email || 'No email'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <span className={cx('payment-review-chip', paymentStatusTone(payment.status))}>
              {cleanLabel(payment.status || 'pending')}
            </span>

            <span className={cx('payment-review-chip', proofTone(hasProof))}>
              {hasProof ? 'Proof Attached' : 'No Proof'}
            </span>

            <span className={cx('payment-review-chip', deadlineTone(payment))}>
              {deadlineLabel(payment)}
            </span>
          </div>
        </div>

        <div className="payment-review-grid">
          <SnapshotLine label="This Payment" value={formatMoney(payment.amount)} />
          <SnapshotLine label="Items Total" value={formatMoney(totals.items_total || 0)} />
          <SnapshotLine label="Submitted" value={formatMoney(totals.submitted_payments_total || 0)} />
          <SnapshotLine label="Confirmed" value={formatMoney(totals.confirmed_payments_total || 0)} />
          <SnapshotLine label="Remaining" value={formatMoney(totals.remaining_balance || 0)} />
          <SnapshotLine label="Down Required" value={formatMoney(totals.down_payment_required || 0)} />
        </div>

        <div className="payment-review-proof-box">
          {hasProof ? (
            <a href={payment.proof_image_url || '#'} target="_blank" rel="noreferrer">
              <FileImage className="h-5 w-5" />
              Open Payment Proof
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <div>
              <AlertTriangle className="h-5 w-5" />
              <span>No proof image is attached to this payment record.</span>
            </div>
          )}
        </div>

        <div className="payment-review-info-grid">
          <SnapshotLine label="Payer" value={payment.payer_name || payment.card_holder_name || '—'} />
          <SnapshotLine label="Reference" value={payment.transaction_reference || '—'} />
          <SnapshotLine label="Gateway" value={cleanLabel(payment.payment_gateway || payment.payment_method || '—')} />
          <SnapshotLine label="Type" value={cleanLabel(payment.payment_type || 'payment')} />
          <SnapshotLine label="Submitted" value={formatDateTime(payment.created_at)} />
          <SnapshotLine label="Schedule" value={`${formatDateTime(booking?.booking_date_from)} → ${formatDateTime(booking?.booking_date_to)}`} />
        </div>

        {payment.remarks ? (
          <div className="payment-review-remarks">
            <p>Remarks</p>
            <span>{payment.remarks}</span>
          </div>
        ) : null}

        {booking?.items && booking.items.length > 0 ? (
          <div className="payment-review-services">
            <p>Services</p>
            <span>{booking.items.map((item) => item.area || item.service_name || 'Service').join(', ')}</span>
          </div>
        ) : null}
      </main>

      <aside className="payment-review-actions">
        {booking?.id ? (
          <Link href={bookingShowPath(role, booking.id)} className="payment-review-secondary-action">
            <Eye className="h-4 w-4" />
            Open Booking
          </Link>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate(payment, 'confirmed')}
          className="payment-review-primary-action"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Confirm
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate(payment, 'verified')}
          className="payment-review-secondary-action"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Verify
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate(payment, 'paid')}
          className="payment-review-secondary-action"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
          Mark Paid
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate(payment, 'failed')}
          className="payment-review-danger-action"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Failed
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate(payment, 'declined')}
          className="payment-review-danger-action"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          Decline
        </button>
      </aside>
    </article>
  );
}

export function PaymentReviewPage() {
  const { props } = usePage<PageProps>();

  const role = normalizeWorkspaceRole(props.workspaceRole) as RoleThemeKey;
  const filters = props.filters || {};
  const payments = props.payments || {};
  const stats = props.stats || {};
  const rows = useMemo(() => payments.data || [], [payments.data]);
  const links = payments.links || [];

  const [q, setQ] = useState(filters.q || '');
  const [status, setStatus] = useState(filters.status || '');
  const [gateway, setGateway] = useState(filters.gateway || '');
  const [paymentType, setPaymentType] = useState(filters.payment_type || '');
  const [bookingStatus, setBookingStatus] = useState(filters.booking_status || '');
  const [deadline, setDeadline] = useState(filters.deadline || '');
  const [proof, setProof] = useState(filters.proof || '');
  const [busyId, setBusyId] = useState<number | string | null>(null);
  const [filtering, setFiltering] = useState(false);

  const basePath = reviewPath(role);

  const visibleAmount = useMemo(
    () => rows.reduce((sum, payment) => sum + numberValue(payment.amount), 0),
    [rows],
  );

  function submitFilters(event?: FormEvent) {
    event?.preventDefault();
    setFiltering(true);

    router.get(
      basePath,
      {
        q: q || undefined,
        status: status || undefined,
        gateway: gateway || undefined,
        payment_type: paymentType || undefined,
        booking_status: bookingStatus || undefined,
        deadline: deadline || undefined,
        proof: proof || undefined,
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
    setStatus('');
    setGateway('');
    setPaymentType('');
    setBookingStatus('');
    setDeadline('');
    setProof('');
    setFiltering(true);

    router.get(basePath, {}, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      onFinish: () => setFiltering(false),
    });
  }

  async function updatePayment(
    payment: ReviewPayment,
    nextStatus: 'confirmed' | 'verified' | 'paid' | 'failed' | 'declined',
  ) {
    const bookingId = payment.booking?.id;

    if (!bookingId) return;

    const actionLabel = cleanLabel(nextStatus);
    const isPositiveAction = ['confirmed', 'verified', 'paid'].includes(nextStatus);
    const confirmed = await confirmBcccAction({
      title: `${actionLabel} payment record?`,
      message: isPositiveAction
        ? 'This will validate the selected payment record and update the booking payment review status.'
        : 'This will mark the selected payment record as declined or failed. The user can submit a corrected proof when needed.',
      confirmText: actionLabel,
      cancelText: 'Cancel',
      tone: isPositiveAction ? 'success' : 'danger',
    });

    if (!confirmed) {
      return;
    }

    setBusyId(payment.id);

    router.put(
      paymentUpdatePath(role, bookingId, payment.id),
      {
        status: nextStatus,
        payment_method: payment.payment_method || 'online',
        payment_gateway: payment.payment_gateway || null,
        payment_type: payment.payment_type || 'down',
        amount: payment.amount || 0,
        transaction_reference: payment.transaction_reference || null,
        remarks: [
          payment.remarks,
          `${actionLabel} from payment review center.`,
        ]
          .filter(Boolean)
          .join('\n'),
        payer_name: payment.payer_name || null,
        card_holder_name: payment.card_holder_name || null,
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
      title={pageTitle(role)}
      description={pageDescription(role)}
      actions={
        <>
          <Link href={bookingBasePath(role)} className="payment-review-secondary-action">
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Link>

          <button type="button" onClick={() => submitFilters()} className="payment-review-secondary-action">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </>
      }
    >
      <section className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Review Needed"
            value={stats.review_needed || 0}
            description="Pending payments awaiting review."
            icon={AlertTriangle}
            tone="gold"
          />

          <StatCard
            label="Due Soon"
            value={stats.due_soon || 0}
            description="Bookings approaching payment deadline."
            icon={Clock3}
            tone="gold"
          />

          <StatCard
            label="Overdue"
            value={stats.overdue || 0}
            description="Payment windows already exceeded."
            icon={XCircle}
            tone="red"
          />

          <StatCard
            label="With Proof"
            value={stats.with_proof || 0}
            description="Payments with attached proof image."
            icon={FileImage}
            tone="blue"
          />

          <StatCard
            label="Visible Amount"
            value={formatMoney(visibleAmount)}
            description="Total amount in the visible queue."
            icon={ReceiptText}
            tone="green"
          />
        </div>

        <form onSubmit={submitFilters} className="payment-review-filter-panel">
          <label className="payment-review-search">
            <Search className="h-4 w-4" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search payer, reference, client, company, event..."
            />
          </label>

          <FilterSelect label="Payment Status" value={status} onChange={setStatus}>
            {statusOptions().map(([label, value]) => (
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

          <FilterSelect label="Payment Type" value={paymentType} onChange={setPaymentType}>
            {paymentTypeOptions().map(([label, value]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Booking Status" value={bookingStatus} onChange={setBookingStatus}>
            {bookingStatusOptions().map(([label, value]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Deadline" value={deadline} onChange={setDeadline}>
            {deadlineOptions().map(([label, value]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Proof" value={proof} onChange={setProof}>
            {proofOptions().map(([label, value]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>

          <button type="submit" disabled={filtering} className="payment-review-primary-action">
            {filtering ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            Filter
          </button>

          <button type="button" disabled={filtering} onClick={resetFilters} className="payment-review-secondary-action">
            <SlidersHorizontal className="h-4 w-4" />
            Clear
          </button>
        </form>

        <div className="payment-review-toolbar">
          <div>
            <p>Review Queue</p>
            <h2>
              {payments.meta?.total ?? rows.length} payment{Number(payments.meta?.total ?? rows.length) === 1 ? '' : 's'}
            </h2>
          </div>

          <span>
            Showing {payments.meta?.from ?? (rows.length > 0 ? 1 : 0)} to {payments.meta?.to ?? rows.length}
            {payments.meta?.total ? ` of ${payments.meta.total}` : ''}
          </span>
        </div>

        {rows.length > 0 ? (
          <div className="grid gap-4">
            {rows.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                role={role}
                busyId={busyId}
                onUpdate={updatePayment}
              />
            ))}
          </div>
        ) : (
          <section className="payment-review-empty">
            <CreditCard className="mx-auto h-12 w-12 text-[var(--bccc-backend-gold)]" />
            <h3>No payment records found</h3>
            <p>Adjust the filters or wait for users/staff to submit payment proof records.</p>
          </section>
        )}

        {links.length > 0 ? (
          <nav className="payment-review-pagination" aria-label="Payment review pagination">
            {links.map((link, index) =>
              link.url ? (
                <Link
                  key={`${link.label}-${index}`}
                  href={link.url}
                  preserveScroll
                  className={cx('payment-review-page-link', link.active && 'is-active')}
                >
                  {cleanPageLabel(link.label)}
                </Link>
              ) : (
                <span key={`${link.label}-${index}`} className="payment-review-page-link is-disabled">
                  {cleanPageLabel(link.label)}
                </span>
              ),
            )}
          </nav>
        ) : null}
      </section>
    </BookingRolePageShell>
  );
}
