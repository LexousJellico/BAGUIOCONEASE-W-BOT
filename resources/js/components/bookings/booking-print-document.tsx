import {
    bookingBasePath,
    formatDateTime,
    formatMoney,
    normalizeWorkspaceRole,
} from '@/lib/booking-role-ui';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import {
    ArrowLeft,
    Landmark,
    Printer,
    ReceiptText,
    ShieldCheck,
} from 'lucide-react';

type MoneyInput = string | number | null | undefined;
type Dict = Record<string, unknown>;

type PrintablePayload = {
    document?: Dict;
    office?: Dict;
    booking?: Dict;
    client?: Dict;
    schedule?: Dict;
    venue?: Dict;
    charges?: Dict;
    payments?: Dict[];
    post_event_charges?: Dict[];
    mice?: Dict;
    approval?: Dict;
    policy?: Dict;
};

type PageProps = {
    workspaceRole?: string;
    documentType?: string;
    documentTitle?: string;
    generatedAt?: string;
    printable?: PrintablePayload;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function text(value: unknown, fallback = '—'): string {
    if (value === null || value === undefined || String(value).trim() === '')
        return fallback;
    return String(value);
}

function moneyInput(value: unknown): MoneyInput {
    if (typeof value === 'number' || typeof value === 'string') {
        return value;
    }

    return null;
}

function list(value: unknown): string[] {
    return Array.isArray(value)
        ? value.map((item) => String(item)).filter(Boolean)
        : [];
}

function objectList(value: unknown): Dict[] {
    return Array.isArray(value)
        ? value.filter(
              (item): item is Dict => !!item && typeof item === 'object',
          )
        : [];
}

function dateOnly(value?: unknown): string {
    if (!value) return 'â€”';
    const textValue = String(value);
    const parsed = new Date(textValue);
    if (Number.isNaN(parsed.getTime())) return textValue;
    return parsed.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
    });
}

function dateTime(value?: unknown): string {
    return value ? formatDateTime(String(value)) : 'â€”';
}

function percent(value: unknown): string {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed) || parsed <= 0) return '0%';
    return `${Math.round(parsed * 100)}%`;
}

function documentAccent(type?: string | null): string {
    const normalized = String(type ?? '').toLowerCase();
    if (normalized.includes('bill'))
        return 'Official final billing and payment statement';
    if (normalized.includes('cancel'))
        return 'Official cancellation assessment';
    if (normalized.includes('mice')) return 'Official MICE report summary';
    return 'Official reservation and booking summary';
}

function documentWatermark(type?: string | null): string {
    const normalized = String(type ?? '').toLowerCase();
    if (normalized.includes('bill')) return 'FINAL BILL';
    if (normalized.includes('cancel')) return 'CANCELLATION';
    if (normalized.includes('mice')) return 'MICE REPORT';
    return 'RESERVATION';
}

function Field({
    label,
    value,
    wide = false,
}: {
    label: string;
    value?: unknown;
    wide?: boolean;
}) {
    return (
        <div
            className={cx(
                'booking-print-field rounded-xl border border-[#d7c7a5]/70 bg-white/82 px-4 py-3',
                wide && 'md:col-span-2',
            )}
        >
            <p className="booking-print-field-label text-[10px] font-bold tracking-[0.18em] text-[#806332] uppercase">
                {label}
            </p>
            <p className="booking-print-field-value mt-1.5 text-sm leading-6 font-semibold text-[#1f1a12]">
                {text(value)}
            </p>
        </div>
    );
}

function Section({
    title,
    eyebrow,
    children,
}: {
    title: string;
    eyebrow?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="booking-print-section break-inside-avoid rounded-[1.35rem] border border-[#d8c8a8] bg-[#fffdf8] p-5 shadow-[0_18px_60px_rgba(53,38,16,0.08)] print:rounded-none print:border-[#999] print:bg-white print:p-4 print:shadow-none">
            {eyebrow ? (
                <p className="booking-print-section-eyebrow text-[10px] font-black tracking-[0.24em] text-[#967236] uppercase">
                    {eyebrow}
                </p>
            ) : null}
            <h2 className="booking-print-section-title mt-1 text-lg font-semibold tracking-[-0.02em] text-[#1f1a12]">
                {title}
            </h2>
            <div className="booking-print-section-body mt-4">{children}</div>
        </section>
    );
}

function MoneyRow({
    label,
    value,
    strong = false,
}: {
    label: string;
    value?: unknown;
    strong?: boolean;
}) {
    return (
        <div
            className={cx(
                'booking-print-money-row flex items-center justify-between gap-4 border-b border-[#eadfc9] py-2.5 last:border-b-0',
                strong && 'text-base font-black',
            )}
        >
            <span className="text-sm text-[#5f533f]">{label}</span>
            <span
                className={cx(
                    'text-sm font-semibold text-[#1f1a12]',
                    strong && 'text-base',
                )}
            >
                {formatMoney(moneyInput(value))}
            </span>
        </div>
    );
}

function SimpleTable({
    columns,
    rows,
    empty,
}: {
    columns: Array<{
        key: string;
        label: string;
        money?: boolean;
        className?: string;
        headClassName?: string;
    }>;
    rows: Dict[];
    empty: string;
}) {
    if (rows.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-[#d8c8a8] bg-[#fff8ea] p-4 text-sm text-[#6a5a41]">
                {empty}
            </p>
        );
    }

    return (
        <div className="booking-print-table-wrap overflow-hidden rounded-xl border border-[#d8c8a8]">
            <table className="booking-print-table w-full border-collapse text-left text-sm">
                <thead className="bg-[#efe3cd] text-[10px] tracking-[0.18em] text-[#806332] uppercase">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={cx(
                                    'px-3 py-2 font-black',
                                    column.className,
                                    column.headClassName,
                                )}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#eadfc9] bg-white">
                    {rows.map((row, rowIndex) => (
                        <tr key={String(row.id ?? rowIndex)}>
                            {columns.map((column) => (
                                <td
                                    key={column.key}
                                    className={cx(
                                        'px-3 py-2 align-top text-[#2c2519]',
                                        column.money && 'text-right whitespace-nowrap tabular-nums',
                                        column.className,
                                    )}
                                >
                                    {column.money ? (
                                        formatMoney(moneyInput(row[column.key]))
                                    ) : column.key === 'label' ? (
                                        <div className="min-w-0">
                                            <p className="font-semibold leading-5">
                                                {text(row[column.key])}
                                            </p>
                                            {row.description ? (
                                                <p className="mt-1 text-[10px] leading-4 text-[#6a5a41] print:text-[#333333]">
                                                    {text(row.description)}
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : (
                                        text(row[column.key])
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function BookingPrintDocument() {
    const { props } = usePage<PageProps>();
    const role = normalizeWorkspaceRole(props.workspaceRole);
    const payload = props.printable ?? {};
    const document = payload.document ?? {};
    const booking = payload.booking ?? {};
    const client = payload.client ?? {};
    const schedule = payload.schedule ?? {};
    const venue = payload.venue ?? {};
    const charges = payload.charges ?? {};
    const mice = payload.mice ?? {};
    const approval = payload.approval ?? {};
    const office = payload.office ?? {};
    const policy = payload.policy ?? {};

    const chargeLines = objectList(charges.line_items ?? charges.booking_items);
    const payments = objectList(payload.payments);
    const postEventCharges = objectList(payload.post_event_charges);
    const scheduleSegments = objectList(schedule.segments);
    const selectedAreas = list(venue.selected_area_labels);
    const policyNotes = list(policy.notes);
    const documentType = String(
        props.documentType ?? document.type ?? 'reservation_summary',
    );
    const backHref = booking.id
        ? `${bookingBasePath(role)}/${booking.id}`
        : bookingBasePath(role);
    const autoPrintStarted = useRef(false);

    useEffect(() => {
        if (autoPrintStarted.current) {
            return;
        }

        autoPrintStarted.current = true;
        const timer = window.setTimeout(() => window.print(), 450);

        return () => window.clearTimeout(timer);
    }, [booking.id, documentType]);

    return (
        <main className="booking-print-document min-h-screen bg-[#f5efe4] px-4 py-6 text-[#1f1a12] print:bg-white print:px-0 print:py-0">
            <style>{`
                @page { size: A4 portrait; margin: 5mm; }
                @media print {
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow: none !important; text-shadow: none !important; }
                    html, body, #app, [data-page], main { width: 100% !important; min-width: 0 !important; min-height: auto !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: #ffffff !important; color: #111111 !important; }
                    body * { visibility: visible !important; }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
                    .booking-print-shell, .booking-print-shell * { visibility: visible !important; }
                    .booking-print-shell { position: static !important; left: auto !important; top: auto !important; display: block !important; width: 100% !important; max-width: none !important; min-height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: #ffffff !important; color: #111111 !important; transform: none !important; filter: none !important; opacity: 1 !important; }
                    .booking-print-shell::before, .booking-print-shell::after { display: none !important; content: none !important; }
                    .booking-print-watermark { display: none !important; }
                    section, header, footer, .print-card { display: block !important; break-inside: avoid; page-break-inside: avoid; border: 1px solid #999999 !important; background: #ffffff !important; color: #111111 !important; }
                    table { page-break-inside: auto; width: 100% !important; border-collapse: collapse !important; color: #111111 !important; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    th, td { border: 1px solid #bbbbbb !important; color: #111111 !important; background: #ffffff !important; }
                    .booking-print-qty { width: 2.1rem !important; max-width: 2.1rem !important; text-align: center !important; padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
                    .booking-print-unit { width: 6.15rem !important; max-width: 6.15rem !important; text-align: right !important; white-space: nowrap !important; padding-left: 0.35rem !important; padding-right: 0.35rem !important; }
                    .booking-print-amount { width: 6.65rem !important; max-width: 6.65rem !important; text-align: right !important; white-space: nowrap !important; padding-left: 0.35rem !important; padding-right: 0.35rem !important; }
                    .booking-print-item { width: auto !important; }
                    p, span, h1, h2, h3, strong, small, div { color: #111111 !important; }
                    a { color: inherit !important; text-decoration: none !important; }
                }
            `}</style>

            <div className="no-print mx-auto mb-5 flex max-w-5xl flex-wrap items-center justify-between gap-3">
                <Link
                    href={backHref}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#cdb98d] bg-white px-4 text-sm font-semibold text-[#2f2517] shadow-sm transition hover:bg-[#fff8ea]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to booking
                </Link>
                <button
                    type="button"
                    onClick={() => requestAnimationFrame(() => window.print())}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#46361f]"
                >
                    <Printer className="h-4 w-4" />
                    Print / Save PDF
                </button>
            </div>

            <div className="booking-print-shell relative mx-auto max-w-5xl space-y-5 rounded-[1.5rem] bg-[#fffaf0] p-5 shadow-[0_24px_80px_rgba(53,38,16,0.12)] print:max-w-none print:rounded-none print:bg-white print:p-0 print:shadow-none">
                <div className="booking-print-watermark pointer-events-none fixed top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 rotate-[-24deg] text-[4.8rem] font-black tracking-[0.18em] text-black/[0.035] uppercase">
                    {documentWatermark(documentType)}
                </div>
                <header className="booking-print-header break-inside-avoid rounded-[1.5rem] border border-[#d8c8a8] bg-white p-6 print:rounded-none print:border-[#999]">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c8a8] bg-[#f7edda] px-3 py-1 text-[10px] font-black tracking-[0.2em] text-[#806332] uppercase">
                                <Landmark className="h-3.5 w-3.5" />
                                {text(office.system, 'BCCC EASE')}
                            </div>
                            <h1 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[#21180d] uppercase md:text-3xl">
                                {text(
                                    office.venue,
                                    'BAGUIO CONVENTION AND CULTURAL CENTER',
                                )}
                            </h1>
                            <p className="mt-2 text-sm font-semibold tracking-[0.18em] text-[#705d3d] uppercase">
                                {text(office.city, 'CITY GOVERNMENT OF BAGUIO')}
                            </p>
                            <p className="text-sm text-[#705d3d]">
                                {text(
                                    office.department,
                                    'CITY TOURISM, CULTURE AND ARTS OFFICE',
                                )}
                            </p>
                        </div>
                        <div className="booking-print-header-card rounded-2xl border border-[#d8c8a8] bg-[#fff8ea] p-4 text-left md:w-72">
                            <p className="text-[10px] font-black tracking-[0.22em] text-[#806332] uppercase">
                                {documentAccent(documentType)}
                            </p>
                            <h2 className="mt-2 text-xl font-black text-[#1f1a12]">
                                {text(
                                    props.documentTitle ?? document.title,
                                    'Booking Document',
                                )}
                            </h2>
                            <p className="mt-2 text-xs leading-6 text-[#6a5a41]">
                                {text(document.description)}
                            </p>
                            <div className="mt-4 grid gap-1 text-xs text-[#4e422f]">
                                <span>
                                    <strong>Print Code:</strong>{' '}
                                    {text(document.code)}
                                </span>
                                <span>
                                    <strong>Reference:</strong>{' '}
                                    {text(booking.reference)}
                                </span>
                                <span>
                                    <strong>Generated:</strong>{' '}
                                    {dateTime(
                                        props.generatedAt ??
                                            document.generated_at,
                                    )}
                                </span>
                                <span>
                                    <strong>Copy:</strong> Official BCCC
                                    system-generated record
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="grid gap-5 lg:grid-cols-3">
                    <Section eyebrow="Reservation" title="Booking Details">
                        <div className="grid gap-3">
                            <Field
                                label="Booking Reference"
                                value={booking.reference}
                            />
                            <Field
                                label="Booking Status"
                                value={booking.status}
                            />
                            <Field
                                label="Payment Status"
                                value={booking.payment_status}
                            />
                            <Field
                                label="Event Name / Type"
                                value={booking.event_name}
                            />
                        </div>
                    </Section>

                    <Section eyebrow="Client" title="Organizer Details">
                        <div className="grid gap-3">
                            <Field
                                label="Client Name"
                                value={client.client_name}
                            />
                            <Field
                                label="Organization"
                                value={client.company_name}
                            />
                            <Field
                                label="Contact Number"
                                value={client.contact_number}
                            />
                            <Field label="Email" value={client.email} />
                            <Field label="Region" value={client.region} />
                            <Field label="Province" value={client.province} />
                            <Field
                                label="City / Municipality"
                                value={client.city}
                            />
                            <Field label="Barangay" value={client.barangay} />
                            <Field label="ZIP Code" value={client.zip_code} />
                            <Field
                                label="Street Address"
                                value={client.street_address}
                            />
                            <Field
                                label="Complete Address"
                                value={client.address}
                            />
                        </div>
                    </Section>

                    <Section eyebrow="Schedule" title="Event Dates">
                        <div className="grid gap-3">
                            <Field
                                label="Start"
                                value={
                                    schedule.date_from
                                        ? dateTime(schedule.date_from)
                                        : 'â€”'
                                }
                            />
                            <Field
                                label="End"
                                value={
                                    schedule.date_to
                                        ? dateTime(schedule.date_to)
                                        : 'â€”'
                                }
                            />
                            <Field
                                label="Guests / Participants"
                                value={schedule.guest_count}
                            />
                            <Field
                                label="Schedule Segments"
                                value={schedule.segments_count}
                            />
                        </div>
                    </Section>
                </section>

                <Section
                    eyebrow="Venue Scope"
                    title="Active Services and Schedule Segments"
                >
                    <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                        <div className="rounded-xl border border-[#d8c8a8] bg-white p-4">
                            <p className="text-[10px] font-black tracking-[0.18em] text-[#806332] uppercase">
                                Selected Active Choices
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {(selectedAreas.length > 0
                                    ? selectedAreas
                                    : [
                                          venue.primary_area ??
                                              venue.primary_service ??
                                              'Venue',
                                      ]
                                ).map((area) => {
                                    const areaLabel = text(area, 'Venue');

                                    return (
                                    <span
                                        key={areaLabel}
                                        className="rounded-full border border-[#cdb98d] bg-[#f7edda] px-3 py-1 text-xs font-bold text-[#382b17]"
                                    >
                                        {areaLabel}
                                    </span>
                                    );
                                })}
                            </div>
                            <p className="mt-3 rounded-xl bg-[#fff8ea] p-3 text-xs leading-6 text-[#6a5a41]">
                                <strong>Venue Capacity:</strong>{' '}
                                {text(venue.capacity_label ?? venue.capacity)}
                                <br />
                                <strong>Dressing Room:</strong>{' '}
                                {text(venue.dressing_room_label)} (
                                {formatMoney(moneyInput(venue.dressing_room_charge))})
                            </p>
                            {venue.full_hall_includes_lobby ? (
                                <p className="mt-3 rounded-xl bg-[#fff8ea] p-3 text-xs leading-6 text-[#6a5a41]">
                                    Full Hall selection includes lobby use.
                                    Lobby is not billed as a separate booking
                                    charge.
                                </p>
                            ) : null}
                        </div>

                        <SimpleTable
                            columns={[
                                { key: 'date', label: 'Date' },
                                { key: 'base_block', label: 'Block' },
                                { key: 'starts_at', label: 'Start' },
                                { key: 'ends_at', label: 'End' },
                                {
                                    key: 'additional_hours',
                                    label: 'Addtl. Hrs',
                                },
                            ]}
                            rows={scheduleSegments.map((segment) => ({
                                ...segment,
                                starts_at: segment.starts_at
                                    ? dateTime(segment.starts_at)
                                    : 'â€”',
                                ends_at: segment.ends_at
                                    ? dateTime(segment.ends_at)
                                    : 'â€”',
                            }))}
                            empty="No detailed schedule segments are attached to this booking."
                        />
                    </div>
                </Section>

                <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <Section eyebrow="Computation" title="Charge Line Items">
                        <SimpleTable
                            columns={[
                                {
                                    key: 'label',
                                    label: 'Item',
                                    className: 'booking-print-item',
                                },
                                {
                                    key: 'quantity',
                                    label: 'Qty',
                                    className:
                                        'booking-print-qty text-center whitespace-nowrap tabular-nums',
                                },
                                {
                                    key: 'unit_price',
                                    label: 'Unit',
                                    money: true,
                                    className: 'booking-print-unit',
                                },
                                {
                                    key: 'amount',
                                    label: 'Amount',
                                    money: true,
                                    className: 'booking-print-amount',
                                },
                            ]}
                            rows={chargeLines}
                            empty="No charge line items are available yet."
                        />
                    </Section>

                    <Section eyebrow="Financial Summary" title="Billing Totals">
                        <MoneyRow
                            label="Base Subtotal"
                            value={charges.base_subtotal}
                        />
                        <MoneyRow
                            label="Dressing Room / Other Rentals"
                            value={charges.dressing_room_charge}
                        />
                        <MoneyRow
                            label="Discount / Adjustments"
                            value={charges.discount_total}
                        />
                        <MoneyRow
                            label="Venue / Booking Total"
                            value={charges.base_total}
                            strong
                        />
                        <MoneyRow
                            label="Post-Event Charges"
                            value={charges.post_event_total}
                        />
                        <MoneyRow
                            label="Venue Total + Bond"
                            value={
                                charges.total_with_bond ??
                                charges.payment_total_including_bond ??
                                charges.total_with_post_event
                            }
                            strong
                        />
                        <MoneyRow
                            label="Required Down Payment + Bond"
                            value={charges.required_down_payment}
                        />
                        <MoneyRow
                            label="Required Bond"
                            value={charges.required_bond}
                        />
                        <MoneyRow
                            label="Confirmed Payments"
                            value={charges.paid}
                        />
                        <MoneyRow
                            label="Submitted / For Review Payments"
                            value={charges.pending}
                        />
                        <MoneyRow
                            label="Remaining Balance"
                            value={charges.balance}
                            strong
                        />
                        <div className="mt-3 rounded-xl bg-[#fff8ea] p-3 text-xs leading-6 text-[#6a5a41]">
                            <strong>Bond Status:</strong>{' '}
                            {text(charges.bond_status)}
                            <br />
                            <strong>Final Computation Status:</strong>{' '}
                            {text(
                                charges.final_computation_status_label ??
                                    charges.final_computation_status,
                                charges.final_computation_locked_at
                                    ? 'Final Computation Locked'
                                    : 'Not Locked',
                            )}
                            <br />
                            <strong>Locked At:</strong>{' '}
                            {charges.final_computation_locked_at
                                ? dateTime(charges.final_computation_locked_at)
                                : 'Not locked'}
                            {charges.final_computation_finalized_at ? (
                                <>
                                    <br />
                                    <strong>Finalized At:</strong>{' '}
                                    {dateTime(
                                        charges.final_computation_finalized_at,
                                    )}
                                </>
                            ) : null}
                        </div>
                    </Section>
                </section>

                {documentType.includes('bill') ||
                documentType.includes('final') ? (
                    <Section
                        eyebrow="Payments"
                        title="Payment Records and Post-Event Charges"
                    >
                        <div className="grid gap-5 lg:grid-cols-2">
                            <SimpleTable
                                columns={[
                                    { key: 'type', label: 'Type' },
                                    { key: 'method', label: 'Method' },
                                    { key: 'status', label: 'Status' },
                                    {
                                        key: 'amount',
                                        label: 'Amount',
                                        money: true,
                                    },
                                ]}
                                rows={payments}
                                empty="No payment records attached yet."
                            />
                            <SimpleTable
                                columns={[
                                    { key: 'category', label: 'Category' },
                                    { key: 'label', label: 'Charge' },
                                    { key: 'status', label: 'Status' },
                                    {
                                        key: 'amount',
                                        label: 'Amount',
                                        money: true,
                                    },
                                ]}
                                rows={postEventCharges}
                                empty="No post-event charges assessed."
                            />
                        </div>
                    </Section>
                ) : null}

                {documentType.includes('cancel') ? (
                    <Section
                        eyebrow="Cancellation"
                        title="Cancellation Assessment"
                    >
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field
                                label="Cancelled At"
                                value={
                                    approval.cancelled_at
                                        ? dateTime(approval.cancelled_at)
                                        : 'Not cancelled'
                                }
                            />
                            <Field
                                label="Penalty Rate"
                                value={percent(
                                    approval.cancellation_penalty_rate,
                                )}
                            />
                            <Field
                                label="Penalty Amount"
                                value={formatMoney(
                                    moneyInput(
                                        approval.cancellation_penalty_amount,
                                    ),
                                )}
                            />
                            <Field
                                label="Booking Status"
                                value={booking.status}
                            />
                            <Field
                                label="Billing Notes"
                                value={charges.billing_notes}
                                wide
                            />
                        </div>
                    </Section>
                ) : null}

                {documentType.includes('mice') || mice.exists ? (
                    <Section
                        eyebrow="MICE"
                        title="MICE / Contact Report Summary"
                    >
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            <Field label="MICE Status" value={mice.status} />
                            <Field
                                label="Event Scope"
                                value={mice.event_scope}
                            />
                            <Field
                                label="Event Center"
                                value={mice.event_center_name}
                            />
                            <Field
                                label="Covered Month"
                                value={mice.covered_month}
                            />
                            <Field
                                label="Event Started"
                                value={dateOnly(mice.event_started_at)}
                            />
                            <Field
                                label="Event Finished"
                                value={dateOnly(mice.event_finished_at)}
                            />
                            <Field
                                label="Time"
                                value={mice.schedule_time_display}
                                wide
                            />
                            <Field
                                label="Additional Hours"
                                value={mice.additional_hours_display}
                                wide
                            />
                            <Field label="Event Name" value={mice.event_name} />
                            <Field
                                label="Classification"
                                value={mice.classification_of_event}
                            />
                            <Field
                                label="Type of Event"
                                value={mice.type_of_event}
                            />
                            <Field
                                label="Foreign Attendees"
                                value={mice.foreign_attendees}
                            />
                            <Field
                                label="Domestic Attendees"
                                value={mice.domestic_attendees}
                            />
                            <Field
                                label="Countries"
                                value={mice.countries_breakdown_text}
                            />
                            <Field
                                label="Exhibitions"
                                value={mice.has_exhibitions ? 'Yes' : 'No'}
                            />
                            <Field
                                label="Exhibitors"
                                value={mice.exhibitors_count}
                            />
                            <Field
                                label="Visitors"
                                value={mice.visitors_count}
                            />
                            <Field
                                label="Organizer Organization"
                                value={mice.organization_name}
                            />
                            <Field
                                label="Organizer Contact Person"
                                value={mice.contact_person}
                            />
                            <Field
                                label="Organizer Contact Number"
                                value={mice.contact_number}
                            />
                            <Field
                                label="Comments / Feedback"
                                value={mice.comments_feedback}
                                wide
                            />
                        </div>
                    </Section>
                ) : null}

                <Section
                    eyebrow="Policy Scope"
                    title="Control Notes for This Printable"
                >
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-[#d8c8a8] bg-white p-4">
                            <p className="flex items-center gap-2 text-sm font-black text-[#21180d]">
                                <ShieldCheck className="h-4 w-4" /> Active
                                Booking Scope
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {Object.values(
                                    policy.active_charge_choices ?? {},
                                ).map((choice) => (
                                    <span
                                        key={String(choice)}
                                        className="rounded-full bg-[#2f2517] px-3 py-1 text-[11px] font-bold text-white"
                                    >
                                        {String(choice)}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl border border-[#d8c8a8] bg-white p-4">
                            <p className="flex items-center gap-2 text-sm font-black text-[#21180d]">
                                <ReceiptText className="h-4 w-4" /> Notes
                            </p>
                            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-6 text-[#5f533f]">
                                {policyNotes.map((note) => (
                                    <li key={note}>{note}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Section>

                <div className="booking-print-note break-inside-avoid rounded-xl border border-[#d8c8a8] bg-white p-4 text-xs leading-6 text-[#5f533f] print:border-[#999]">
                    This document was generated from the BCCC EASE booking
                    record. Amounts reflect the current approved booking
                    computation, confirmed payments, submitted payments for
                    review, and separate post-event charges at the time of
                    printing.
                </div>

                <footer className="booking-print-footer-signatures grid break-inside-avoid gap-4 pt-4 text-xs text-[#6a5a41] md:grid-cols-3 print:pt-8">
                    <div className="rounded-xl border border-[#d8c8a8] bg-white p-4">
                        <p className="font-black tracking-[0.18em] text-[#806332] uppercase">
                            Prepared By
                        </p>
                        <div className="mt-8 border-t border-[#b9a177] pt-2">
                            Authorized BCCC Personnel
                        </div>
                    </div>
                    <div className="rounded-xl border border-[#d8c8a8] bg-white p-4">
                        <p className="font-black tracking-[0.18em] text-[#806332] uppercase">
                            Reviewed By
                        </p>
                        <div className="mt-8 border-t border-[#b9a177] pt-2">
                            CTCAO / BCCC Reviewer
                        </div>
                    </div>
                    <div className="rounded-xl border border-[#d8c8a8] bg-white p-4">
                        <p className="font-black tracking-[0.18em] text-[#806332] uppercase">
                            Client / Organizer
                        </p>
                        <div className="mt-8 border-t border-[#b9a177] pt-2">
                            Signature over Printed Name
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    );
}

export default BookingPrintDocument;
