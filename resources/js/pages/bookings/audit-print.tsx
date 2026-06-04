import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

type AuditEvent = {
    id: number;
    booking_id: number | null;
    booking_exists: boolean;
    event_key: string;
    title: string;
    from_status?: string | null;
    to_status?: string | null;
    from_payment_status?: string | null;
    to_payment_status?: string | null;
    reason?: string | null;
    event_at?: string | null;
    created_at?: string | null;
    actor?: {
        id: number;
        name: string;
        email: string;
    } | null;
};

type Paginated<T> = {
    data: T[];
};

type Props = {
    events: Paginated<AuditEvent> | AuditEvent[];
    filters: Record<string, unknown>;
    stats: Record<string, number>;
    generated_at?: string;
};

function rowsOf(events: Props['events']) {
    if (Array.isArray(events)) return events;
    return events?.data || [];
}

function cleanLabel(value?: string | null) {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value?: string | null) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

export default function BookingAuditPrint({
    events,
    filters,
    stats,
    generated_at,
}: Props) {
    const rows = rowsOf(events);

    return (
        <>
            <Head title="Booking Audit Print" />

            <div className="print-report-page">
                <div className="print-report-toolbar no-print">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="alh-primary-button"
                    >
                        <Printer className="h-4 w-4" />
                        Print Audit
                    </button>
                </div>

                <main className="print-report-paper">
                    <header className="print-report-header">
                        <p>Booking Audit Trail</p>
                        <h1>Baguio Convention and Cultural Center</h1>
                        <span>
                            Generated {formatDateTime(generated_at)} · Filters:{' '}
                            {Object.entries(filters || {})
                                .filter(([, value]) => value)
                                .map(
                                    ([key, value]) =>
                                        `${cleanLabel(key)}: ${String(value)}`,
                                )
                                .join(' · ') || 'None'}
                        </span>
                    </header>

                    <section className="print-report-section">
                        <h2>Audit Summary</h2>
                        <table className="print-report-table">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(stats || {}).map(
                                    ([key, value]) => (
                                        <tr key={key}>
                                            <td>{cleanLabel(key)}</td>
                                            <td>{value}</td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </section>

                    <section className="print-report-section">
                        <h2>Audit Records</h2>
                        <table className="print-report-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Booking</th>
                                    <th>Event</th>
                                    <th>Title</th>
                                    <th>Booking Status</th>
                                    <th>Payment Status</th>
                                    <th>Actor</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length > 0 ? (
                                    rows.map((row) => (
                                        <tr key={row.id}>
                                            <td>#{row.id}</td>
                                            <td>
                                                {row.booking_id
                                                    ? `#${row.booking_id}`
                                                    : '—'}
                                                {!row.booking_exists
                                                    ? ' · Deleted'
                                                    : ''}
                                            </td>
                                            <td>{cleanLabel(row.event_key)}</td>
                                            <td>
                                                <strong>
                                                    {row.title ||
                                                        cleanLabel(
                                                            row.event_key,
                                                        )}
                                                </strong>
                                                {row.reason ? (
                                                    <small>{row.reason}</small>
                                                ) : null}
                                            </td>
                                            <td>
                                                {cleanLabel(row.from_status)} →{' '}
                                                {cleanLabel(row.to_status)}
                                            </td>
                                            <td>
                                                {cleanLabel(
                                                    row.from_payment_status,
                                                )}{' '}
                                                →{' '}
                                                {cleanLabel(
                                                    row.to_payment_status,
                                                )}
                                            </td>
                                            <td>
                                                {row.actor?.name ||
                                                    'System / automation'}
                                            </td>
                                            <td>
                                                {formatDateTime(
                                                    row.event_at ||
                                                        row.created_at,
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8}>
                                            No audit records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <footer className="print-report-footer">
                        <strong>BCCC EASE</strong>
                        <span>
                            Audit report generated for booking lifecycle review.
                        </span>
                    </footer>
                </main>
            </div>
        </>
    );
}
