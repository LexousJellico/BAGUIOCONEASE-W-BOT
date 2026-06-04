import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

type CountRow = {
    block?: string;
    status?: string;
    weekday?: string;
    count?: number;
    label?: string;
    value?: number;
};

type AreaRow = {
    area: string;
    bookings: number;
    calendar_blocks: number;
    public_events: number;
    total: number;
};

type DateRow = {
    date: string;
    occupied_blocks: number;
    bookings: number;
    calendar_blocks: number;
    public_events: number;
    total_activity: number;
};

type Props = {
    filters: {
        start_date?: string;
        end_date?: string;
    };
    generated_at?: string;
    summary: Record<string, unknown>;
    block_usage: CountRow[];
    block_status_mix: CountRow[];
    weekday_usage: CountRow[];
    area_usage: AreaRow[];
    busiest_dates: DateRow[];
    date_series: DateRow[];
};

function cleanLabel(value: unknown) {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numberValue(value: unknown) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function countLabel(row: CountRow) {
    return row.block || row.status || row.weekday || row.label || '—';
}

function countValue(row: CountRow) {
    return numberValue(row.count ?? row.value);
}

function formatDate(value?: string | null) {
    if (!value) return '—';

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
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

function SummaryTable({ summary }: { summary: Record<string, unknown> }) {
    const rows = Object.entries(summary || {});

    return (
        <table className="print-report-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                {rows.length > 0 ? (
                    rows.map(([key, value]) => (
                        <tr key={key}>
                            <td>{cleanLabel(key)}</td>
                            <td>{String(value ?? '—')}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={2}>No summary data.</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}

function CountTable({ title, rows }: { title: string; rows: CountRow[] }) {
    return (
        <section className="print-report-section">
            <h2>{title}</h2>
            <table className="print-report-table">
                <thead>
                    <tr>
                        <th>Label</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length > 0 ? (
                        rows.map((row) => (
                            <tr key={countLabel(row)}>
                                <td>{cleanLabel(countLabel(row))}</td>
                                <td>{countValue(row)}</td>
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

export default function CalendarAnalyticsPrint({
    filters,
    generated_at,
    summary = {},
    block_usage = [],
    block_status_mix = [],
    weekday_usage = [],
    area_usage = [],
    busiest_dates = [],
    date_series = [],
}: Props) {
    return (
        <>
            <Head title="Calendar Analytics Print" />

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
                        <p>Calendar Analytics Report</p>
                        <h1>Baguio Convention and Cultural Center</h1>
                        <span>
                            Date range: {formatDate(filters.start_date)} to{' '}
                            {formatDate(filters.end_date)} · Generated{' '}
                            {formatDateTime(generated_at)}
                        </span>
                    </header>

                    <section className="print-report-section">
                        <h2>Summary</h2>
                        <SummaryTable summary={summary} />
                    </section>

                    <div className="print-report-two-col">
                        <CountTable title="Block Usage" rows={block_usage} />
                        <CountTable
                            title="Block Status Mix"
                            rows={block_status_mix}
                        />
                    </div>

                    <CountTable
                        title="Weekday Utilization"
                        rows={weekday_usage}
                    />

                    <section className="print-report-section">
                        <h2>Area Utilization</h2>
                        <table className="print-report-table">
                            <thead>
                                <tr>
                                    <th>Area</th>
                                    <th>Bookings</th>
                                    <th>Blocks</th>
                                    <th>Public Events</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {area_usage.length > 0 ? (
                                    area_usage.map((row) => (
                                        <tr key={row.area}>
                                            <td>{row.area}</td>
                                            <td>{row.bookings}</td>
                                            <td>{row.calendar_blocks}</td>
                                            <td>{row.public_events}</td>
                                            <td>{row.total}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5}>No area data.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <section className="print-report-section">
                        <h2>Busiest Dates</h2>
                        <table className="print-report-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Occupied Blocks</th>
                                    <th>Bookings</th>
                                    <th>Blocks</th>
                                    <th>Public Events</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {busiest_dates.length > 0 ? (
                                    busiest_dates.map((row) => (
                                        <tr key={row.date}>
                                            <td>{formatDate(row.date)}</td>
                                            <td>{row.occupied_blocks}</td>
                                            <td>{row.bookings}</td>
                                            <td>{row.calendar_blocks}</td>
                                            <td>{row.public_events}</td>
                                            <td>{row.total_activity}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6}>
                                            No busiest date data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <section className="print-report-section">
                        <h2>Date Series</h2>
                        <table className="print-report-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Occupied Blocks</th>
                                    <th>Bookings</th>
                                    <th>Blocks</th>
                                    <th>Public Events</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {date_series.length > 0 ? (
                                    date_series.map((row) => (
                                        <tr key={row.date}>
                                            <td>{formatDate(row.date)}</td>
                                            <td>{row.occupied_blocks}</td>
                                            <td>{row.bookings}</td>
                                            <td>{row.calendar_blocks}</td>
                                            <td>{row.public_events}</td>
                                            <td>{row.total_activity}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6}>
                                            No date series data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <footer className="print-report-footer">
                        <strong>BCCC EASE</strong>
                        <span>
                            Calendar analytics generated for internal operations
                            review.
                        </span>
                    </footer>
                </main>
            </div>
        </>
    );
}
