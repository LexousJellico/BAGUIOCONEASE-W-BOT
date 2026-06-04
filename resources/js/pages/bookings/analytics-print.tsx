import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

type Breakdown = {
    label: string;
    value: number;
};

type TrendPoint = {
    label: string;
    bookings: number;
    guests: number;
    confirmed_revenue: number;
    total_revenue?: number;
    unpaid_balance?: number;
};

type ServicePoint = {
    label: string;
    usage_count: number;
    revenue_total: number;
};

type WorkloadPoint = {
    label: string;
    bookings: number;
    guests: number;
};

type RiskBooking = {
    id: number;
    client_name: string;
    company_name: string;
    type_of_event: string;
    booking_status: string;
    payment_status: string;
    booking_date_from: string | null;
    booking_date_to: string | null;
    items_total: number;
    submitted_total: number;
    confirmed_total: number;
    outstanding: number;
    policy?: {
        state?: string;
        label?: string;
        down_payment_due_at?: string | null;
        full_payment_due_at?: string | null;
    };
};

type Props = {
    filters: Record<string, unknown>;
    generated_at?: string;
    summary: Record<string, number>;
    statusBreakdown: Breakdown[];
    paymentBreakdown: Breakdown[];
    monthlyTrend: TrendPoint[];
    upcomingWorkload: WorkloadPoint[];
    topServices: ServicePoint[];
    highRiskBookings: RiskBooking[];
};

function money(value: unknown) {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

function cleanLabel(value: unknown) {
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

function SummaryTable({ summary }: { summary: Record<string, number> }) {
    return (
        <table className="print-report-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(summary || {}).map(([key, value]) => (
                    <tr key={key}>
                        <td>{cleanLabel(key)}</td>
                        <td>
                            {key.includes('revenue') || key.includes('balance')
                                ? money(value)
                                : value}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function BreakdownTable({ title, rows }: { title: string; rows: Breakdown[] }) {
    return (
        <section className="print-report-section">
            <h2>{title}</h2>
            <table className="print-report-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length > 0 ? (
                        rows.map((row) => (
                            <tr key={row.label}>
                                <td>{cleanLabel(row.label)}</td>
                                <td>{row.value}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={2}>No data.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    );
}

export default function BookingAnalyticsPrint({
    filters,
    generated_at,
    summary,
    statusBreakdown = [],
    paymentBreakdown = [],
    monthlyTrend = [],
    upcomingWorkload = [],
    topServices = [],
    highRiskBookings = [],
}: Props) {
    return (
        <>
            <Head title="Booking Analytics Print" />

            <div className="print-report-page">
                <div className="print-report-toolbar no-print">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="alh-primary-button"
                    >
                        <Printer className="h-4 w-4" />
                        Print Report
                    </button>
                </div>

                <main className="print-report-paper">
                    <header className="print-report-header">
                        <p>Booking Analytics Report</p>
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
                        <h2>Summary</h2>
                        <SummaryTable summary={summary} />
                    </section>

                    <div className="print-report-two-col">
                        <BreakdownTable
                            title="Booking Status Breakdown"
                            rows={statusBreakdown}
                        />
                        <BreakdownTable
                            title="Payment Status Breakdown"
                            rows={paymentBreakdown}
                        />
                    </div>

                    <section className="print-report-section">
                        <h2>Monthly Trend</h2>
                        <table className="print-report-table">
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Bookings</th>
                                    <th>Guests</th>
                                    <th>Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyTrend.length > 0 ? (
                                    monthlyTrend.map((row) => (
                                        <tr key={row.label}>
                                            <td>{row.label}</td>
                                            <td>{row.bookings}</td>
                                            <td>{row.guests}</td>
                                            <td>
                                                {money(
                                                    row.total_revenue ??
                                                        row.confirmed_revenue,
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4}>
                                            No monthly trend data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <section className="print-report-section">
                        <h2>Top Services</h2>
                        <table className="print-report-table">
                            <thead>
                                <tr>
                                    <th>Service / Area</th>
                                    <th>Usage</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topServices.length > 0 ? (
                                    topServices.map((row) => (
                                        <tr key={row.label}>
                                            <td>{row.label}</td>
                                            <td>{row.usage_count}</td>
                                            <td>{money(row.revenue_total)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3}>
                                            No service demand data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <section className="print-report-section">
                        <h2>Upcoming Workload</h2>
                        <table className="print-report-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Bookings</th>
                                    <th>Guests</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcomingWorkload.length > 0 ? (
                                    upcomingWorkload.map((row) => (
                                        <tr key={row.label}>
                                            <td>{row.label}</td>
                                            <td>{row.bookings}</td>
                                            <td>{row.guests}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3}>
                                            No upcoming workload data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <section className="print-report-section">
                        <h2>High-Risk Bookings</h2>
                        <table className="print-report-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Client</th>
                                    <th>Event</th>
                                    <th>Booking</th>
                                    <th>Payment</th>
                                    <th>Total Unpaid Balance</th>
                                    <th>Policy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {highRiskBookings.length > 0 ? (
                                    highRiskBookings.map((row) => (
                                        <tr key={row.id}>
                                            <td>#{row.id}</td>
                                            <td>
                                                {row.company_name ||
                                                    row.client_name}
                                            </td>
                                            <td>{row.type_of_event}</td>
                                            <td>
                                                {cleanLabel(row.booking_status)}
                                            </td>
                                            <td>
                                                {cleanLabel(row.payment_status)}
                                            </td>
                                            <td>{money(row.outstanding)}</td>
                                            <td>
                                                {row.policy?.label ||
                                                    cleanLabel(
                                                        row.policy?.state,
                                                    )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7}>
                                            No high-risk bookings.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <footer className="print-report-footer">
                        <strong>BCCC EASE</strong>
                        <span>
                            Booking analytics generated for internal operations
                            review.
                        </span>
                    </footer>
                </main>
            </div>
        </>
    );
}
