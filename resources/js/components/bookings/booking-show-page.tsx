import BookingApprovalPanel from '@/components/bookings/booking-approval-panel';
import BookingDeadlineBadge from '@/components/bookings/booking-deadline-badge';
import BookingDeadlinePanel from '@/components/bookings/booking-deadline-panel';
import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import { PaymentProofPanel } from '@/components/bookings/payment-proof-panel';
import {
    bookingBasePath,
    bookingEditPath,
    bookingSurveyPath,
    cleanLabel,
    formatDateTime,
    formatMoney,
    normalizeWorkspaceRole,
    type BookingLike,
} from '@/lib/booking-role-ui';
import { Link, router, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Edit3,
    FileText,
    Mail,
    MapPin,
    Phone,
    Printer,
    ReceiptText,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';

type BookingShowPageProps = {
    workspaceRole?: string;
    booking?: BookingLike;
    canUpdateBooking?: boolean;
    canDeleteBooking?: boolean;
    canManagePayments?: boolean;
};

type TimelineItem = {
    id?: number | string;
    label?: string | null;
    title?: string | null;
    description?: string | null;
    from_booking_status?: string | null;
    to_booking_status?: string | null;
    from_payment_status?: string | null;
    to_payment_status?: string | null;
    event_at?: string | null;
    created_at?: string | null;
    meta?: unknown;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function safeText(value: unknown, fallback = '-'): string {
    if (value === null || value === undefined || String(value).trim() === '') {
        return fallback;
    }

    return String(value);
}

function hasDisplayValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
}

function firstPresent(...values: unknown[]): unknown {
    return values.find(hasDisplayValue) ?? null;
}

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function totalValue(booking: BookingLike, key: string): number | string | null {
    const totals = booking.totals as
        | Record<string, number | string | null | undefined>
        | null
        | undefined;

    return totals?.[key] ?? null;
}

function remainingBalance(booking: BookingLike): number {
    const explicit = totalValue(booking, 'remaining_balance');

    if (explicit !== null && explicit !== undefined) {
        return numberValue(explicit);
    }

    const total = numberValue(totalValue(booking, 'items_total'));
    const paid = numberValue(
        totalValue(booking, 'confirmed_payments_total') ??
            totalValue(booking, 'payments_total'),
    );

    return Math.max(total - paid, 0);
}

function serviceName(booking: BookingLike): string {
    const serviceTypeName =
        booking.service?.service_type?.name ??
        booking.service?.serviceType?.name ??
        null;

    return safeText(
        serviceTypeName ?? booking.service_name ?? booking.service?.name,
        'Venue not set',
    );
}

function primaryClient(booking: BookingLike): string {
    return (
        safeText(booking.company_name, '') ||
        safeText(booking.client_name, '') ||
        safeText(booking.client_email, '') ||
        'Client not set'
    );
}

function eventTimeline(booking: BookingLike): TimelineItem[] {
    const possible =
        (booking.lifecycle_events as TimelineItem[] | undefined) ??
        (booking.lifecycleEvents as TimelineItem[] | undefined) ??
        (booking.events as TimelineItem[] | undefined);

    return Array.isArray(possible) ? possible : [];
}

function bookingScheduleSegments(booking: BookingLike) {
    const segments = booking.schedule_segments ?? booking.scheduleSegments;

    return Array.isArray(segments)
        ? (segments as Array<Record<string, unknown>>)
        : [];
}

function bookingAreaLabels(booking: BookingLike): string[] {
    const labels =
        booking.selected_area_labels ??
        booking.selectedAreaLabels ??
        booking.area_labels;

    if (Array.isArray(labels)) {
        return labels.map((label) => String(label)).filter(Boolean);
    }

    const keys = booking.selected_area_keys ?? booking.selectedAreaKeys;

    if (Array.isArray(keys)) {
        return keys.map((key) => cleanLabel(String(key)));
    }

    return [];
}

function bookingAreaKeys(booking: BookingLike): string[] {
    const keys = booking.selected_area_keys ?? booking.selectedAreaKeys;
    return Array.isArray(keys)
        ? keys
              .map((key) =>
                  String(key)
                      .toUpperCase()
                      .replace(/[^A-Z0-9]+/g, '_')
                      .replace(/^_+|_+$/g, ''),
              )
              .filter(Boolean)
        : [];
}

function derivedVenueCapacity(booking: BookingLike): string {
    const areaKeys = bookingAreaKeys(booking);

    if (areaKeys.includes('FULL_HALL') || areaKeys.includes('MAIN_HALL')) {
        return 'Up to 2,000 pax';
    }

    const meta = bookingPaymentMeta(booking);
    const explicit =
        booking.venue_capacity ?? meta.venue_capacity ?? meta.capacity_guide;
    if (
        explicit !== null &&
        explicit !== undefined &&
        String(explicit).trim() !== ''
    ) {
        return String(explicit);
    }

    const capacities: Record<string, number> = {
        FULL_HALL: 2000,
        MAIN_HALL: 2000,
        LED_WALL: 2000,
        LOUNGE: 100,
        VIP_ROOM: 100,
        VIP_LOUNGE: 100,
        BOARDROOM: 80,
        BOARD_ROOM: 80,
    };

    const selected = areaKeys
        .map((key) => capacities[key] ?? null)
        .filter(
            (value): value is number => typeof value === 'number' && value > 0,
        );

    if (selected.length === 0) return 'Subject to BCCC layout review';

    return `Up to ${Math.min(...selected).toLocaleString()} pax`;
}

function autoDeclineDisplay(booking: BookingLike): string {
    const already = booking.auto_declined_at ?? booking.autoDeclinedAt;
    if (already) return `${friendlyDateTime(already)} (already auto-declined)`;

    const deadline =
        booking.deadline_at ??
        booking.expired_at ??
        booking.payment_balance_due_at;
    if (!deadline) return 'Not active / no deadline yet';

    return `${friendlyDateTime(deadline)} (${safeText(booking.deadline_policy, '10 working days')})`;
}

function hasSecuredPayment(booking: BookingLike): boolean {
    return ['partial', 'paid', 'confirmed', 'verified', 'settled'].includes(
        String(booking.payment_status ?? '').toLowerCase(),
    );
}

function securedDateValue(
    booking: BookingLike,
    payments: Array<Record<string, unknown>>,
): string {
    const securedAt = firstPresent(
        booking.confirmed_at,
        booking.confirmedAt,
        payments.find((payment) =>
            [
                'confirmed',
                'verified',
                'approved',
                'paid',
                'completed',
                'settled',
            ].includes(
                String(
                    payment.status ?? payment.payment_status ?? '',
                ).toLowerCase(),
            ),
        )?.approved_at,
        payments.find((payment) =>
            [
                'confirmed',
                'verified',
                'approved',
                'paid',
                'completed',
                'settled',
            ].includes(
                String(
                    payment.status ?? payment.payment_status ?? '',
                ).toLowerCase(),
            ),
        )?.paid_at,
        payments.find((payment) =>
            [
                'confirmed',
                'verified',
                'approved',
                'paid',
                'completed',
                'settled',
            ].includes(
                String(
                    payment.status ?? payment.payment_status ?? '',
                ).toLowerCase(),
            ),
        )?.created_at,
        booking.deadline_at,
        booking.deadlineAt,
    );

    return dateValue(securedAt);
}

function bookingPaymentMeta(booking: BookingLike): Record<string, unknown> {
    const meta = booking.payment_meta ?? booking.paymentMeta;

    return meta && typeof meta === 'object' && !Array.isArray(meta)
        ? (meta as Record<string, unknown>)
        : {};
}

function recordObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function bookingPrintablePath(
    role: ReturnType<typeof normalizeWorkspaceRole>,
    id: number | string,
    kind: string,
): string {
    return `${bookingBasePath(role)}/${id}/print/${kind}`;
}

function bookingExportPath(
    role: string,
    bookingId: unknown,
    document: string,
): string {
    const id = encodeURIComponent(String(bookingId ?? ''));
    const normalized = normalizeWorkspaceRole(role);
    if (normalized === 'user') return `/my-bookings/${id}/export/${document}`;
    return `${bookingBasePath(normalized)}/${id}/export/${document}`;
}

function bookingMiceReportPath(
    role: ReturnType<typeof normalizeWorkspaceRole>,
    booking: BookingLike,
): string {
    const report = (booking.mice_report ??
        booking.miceRecord ??
        booking.mice_record) as Record<string, unknown> | null | undefined;
    const reportId = report && typeof report === 'object' ? report.id : null;

    if (role === 'admin' || role === 'manager') {
        const prefix = role === 'manager' ? '/manager' : '/admin';

        return reportId
            ? `${prefix}/reports/mice-registry/${reportId}/edit`
            : `${prefix}/reports/mice-registry/create?booking_id=${booking.id}`;
    }

    return bookingSurveyPath(role, booking.id);
}

function bookingPostEventTotal(booking: BookingLike): number {
    const explicit =
        totalValue(booking, 'post_event_total') ??
        totalValue(booking, 'postEventTotal');

    if (explicit !== null && explicit !== undefined) {
        return numberValue(explicit);
    }

    const charges = booking.post_event_charges ?? booking.postEventCharges;

    if (!Array.isArray(charges)) {
        return 0;
    }

    return (charges as Array<Record<string, unknown>>).reduce((sum, charge) => {
        const status = String(charge?.status ?? '').toLowerCase();

        if (['void', 'waived', 'cancelled', 'canceled'].includes(status)) {
            return sum;
        }

        return sum + numberValue(charge?.amount);
    }, 0);
}

function bookingPaymentsCount(booking: BookingLike): number {
    return Array.isArray(booking.payments) ? booking.payments.length : 0;
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
    return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

function miceReportObject(
    booking: BookingLike,
): Record<string, unknown> | null {
    const report = (booking.mice_report ??
        booking.miceRecord ??
        booking.mice_record) as Record<string, unknown> | null | undefined;

    return report && typeof report === 'object' && !Array.isArray(report)
        ? report
        : null;
}

function reportValue(
    report: Record<string, unknown> | null,
    keys: string[],
    fallback = '-',
): string | number {
    if (!report) {
        return fallback;
    }

    for (const key of keys) {
        const value = report[key];

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ''
        ) {
            return value as string | number;
        }
    }

    return fallback;
}

function displayValue(value: unknown, fallback = '-'): string {
    if (Array.isArray(value)) {
        const joined = value
            .map((item) => safeText(item, ''))
            .filter(Boolean)
            .join(', ');
        return joined || fallback;
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return safeText(value, fallback);
}

function dateValue(value: unknown): string {
    return value ? formatDateTime(String(value)) : '-';
}

function friendlyDate(value: unknown): string {
    if (!value) return '-';

    const parsed = new Date(String(value));

    if (Number.isNaN(parsed.getTime())) return String(value);

    return parsed.toLocaleDateString('en-PH', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function friendlyTime(value: unknown): string {
    if (!value) return '-';

    const parsed = new Date(String(value));

    if (Number.isNaN(parsed.getTime())) return String(value);

    return parsed.toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function friendlyDateTime(value: unknown): string {
    if (!value) return '-';

    const parsed = new Date(String(value));

    if (Number.isNaN(parsed.getTime())) return String(value);

    return `${friendlyDate(value)} at ${friendlyTime(value)}`;
}

function friendlyDateRange(from: unknown, to: unknown): string {
    if (!from && !to) return '-';

    const start = friendlyDate(from);
    const finish = friendlyDate(to);

    return start === finish ? start : `${start} to ${finish}`;
}

function friendlyTimeRange(from: unknown, to: unknown): string {
    if (!from && !to) return '-';

    const start = friendlyTime(from);
    const finish = friendlyTime(to);

    return `${start} to ${finish}`;
}

function friendlyDateTimeRangeCompact(from: unknown, to: unknown): string {
    if (!from && !to) return '-';

    const left = from
        ? `${friendlyDate(from).replace(/^\w+,\s*/, '')}, ${friendlyTime(from)}`
        : '-';
    const right = to
        ? `${friendlyDate(to).replace(/^\w+,\s*/, '')}, ${friendlyTime(to)}`
        : '-';

    return `${left} - ${right}`;
}

function scheduleTimeDisplay(
    booking: BookingLike,
    report: Record<string, unknown> | null,
): string {
    const explicit = reportValue(report, ['schedule_time_display'], '');

    if (explicit) return String(explicit);

    const segments = bookingScheduleSegments(booking);

    if (segments.length > 0) {
        const first = segments[0];
        const last = segments[segments.length - 1];
        return friendlyDateTimeRangeCompact(
            first.starts_at ?? first.date,
            last.ends_at ?? last.date,
        );
    }

    return friendlyDateTimeRangeCompact(
        report?.event_date_from ?? booking.booking_date_from,
        report?.event_date_to ?? booking.booking_date_to,
    );
}

function additionalHoursDisplay(
    booking: BookingLike,
    report: Record<string, unknown> | null,
): string {
    const explicit = reportValue(report, ['additional_hours_display'], '');

    if (explicit) return String(explicit);

    const rows = bookingScheduleSegments(booking)
        .filter((segment) => Number(segment.additional_hours ?? 0) > 0)
        .map(
            (segment) =>
                `${friendlyDate(segment.date ?? segment.starts_at).replace(/^\w+,\s*/, '')}: ${segment.additional_hours} additional hour(s), ${friendlyTimeRange(segment.additional_starts_at, segment.additional_ends_at)}`,
        );

    return rows.length ? rows.join(' • ') : 'No additional / EVE hours';
}

function moneyValue(value: unknown, fallback = '-'): string {
    if (value === null || value === undefined || String(value).trim() === '') {
        return fallback;
    }

    return formatMoney(value as string | number | null | undefined);
}

function moneyOrFallback(value: unknown, fallback = '-'): string {
    return moneyValue(value, fallback);
}

function negativeMoneyOrFallback(value: unknown, fallback = '-'): string {
    if (value === null || value === undefined || String(value).trim() === '') {
        return fallback;
    }

    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
        return numeric === 0
            ? formatMoney(0)
            : `-${formatMoney(Math.abs(numeric))}`;
    }

    return `-${moneyValue(value)}`;
}

function bookingMetaValue(
    booking: BookingLike,
    key: string,
    fallback = '-',
): string {
    return displayValue(booking[key], fallback);
}

function clientAddressPart(
    booking: BookingLike,
    key: 'street' | 'barangay' | 'city' | 'province' | 'region' | 'zip',
    fallback = '-',
): string {
    const directMap: Record<string, string> = {
        street: 'client_street_address',
        barangay: 'client_barangay',
        city: 'client_city_municipality',
        province: 'client_province',
        region: 'client_region',
        zip: 'client_zip_code',
    };

    const direct = booking[directMap[key]];
    if (
        direct !== null &&
        direct !== undefined &&
        String(direct).trim() !== ''
    ) {
        return String(direct);
    }

    const parts = String(booking.client_address ?? '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

    const zipMatch = String(booking.client_address ?? '').match(/\b\d{4}\b/);
    const indexMap: Record<string, number> = {
        street: 0,
        barangay: 1,
        city: 2,
        province: 3,
        region: 4,
    };

    if (key === 'zip') {
        return zipMatch?.[0] ?? fallback;
    }

    const parsed = parts[indexMap[key]] ?? '';
    if (key === 'region') {
        return parsed.replace(/\b\d{4}\b/g, '').trim() || fallback;
    }

    return parsed || fallback;
}

function segmentLabel(segment: Record<string, unknown>): string {
    const role = cleanLabel(
        safeText(segment.segment_role ?? segment.role, 'Event day'),
    );
    const block = cleanLabel(
        safeText(segment.base_block ?? segment.block, 'Schedule'),
    );
    return `${role} · ${block}`;
}

function scheduleSegmentRows(booking: BookingLike): Array<Array<string>> {
    return bookingScheduleSegments(booking).map((segment) => [
        friendlyDate(segment.date ?? segment.starts_at),
        segmentLabel(segment),
        friendlyTimeRange(segment.starts_at, segment.ends_at),
        displayValue(
            segment.area_labels ?? segment.areaKeys ?? segment.area_keys,
            'All selected areas',
        ),
        segment.has_additional_hours ||
        Number(segment.additional_hours ?? 0) > 0
            ? `${segment.additional_hours ?? 0} additional hour(s), ${friendlyTimeRange(segment.additional_starts_at, segment.additional_ends_at)}`
            : 'None',
    ]);
}

function bookingItemRows(booking: BookingLike): Array<Array<string>> {
    const items = Array.isArray(booking.items)
        ? (booking.items as Array<Record<string, unknown>>)
        : [];

    return items.map((item) => [
        displayValue(item.service_name ?? item.name, 'Service'),
        displayValue(item.service_type_name ?? item.area, 'Venue'),
        displayValue(item.quantity, '1'),
        moneyValue(item.unit_price ?? item.price),
        moneyValue(item.line_total),
    ]);
}

function paymentRows(booking: BookingLike): Array<Array<string>> {
    const payments = Array.isArray(booking.payments)
        ? (booking.payments as Array<Record<string, unknown>>)
        : [];

    return payments.map((payment) => [
        cleanLabel(displayValue(payment.payment_type, 'Payment')),
        cleanLabel(displayValue(payment.status, 'For review')),
        moneyValue(payment.amount),
        displayValue(payment.payment_method ?? payment.payment_gateway, '-'),
        displayValue(payment.transaction_reference, '-'),
        dateValue(payment.paid_at ?? payment.created_at),
    ]);
}

function postEventChargeRows(booking: BookingLike): Array<Array<string>> {
    const charges = Array.isArray(booking.post_event_charges)
        ? (booking.post_event_charges as Array<Record<string, unknown>>)
        : [];

    return charges.map((charge) => [
        cleanLabel(displayValue(charge.category, 'Post-event charge')),
        displayValue(charge.label, 'Charge'),
        moneyValue(charge.amount),
        cleanLabel(displayValue(charge.status, 'Open')),
        displayValue(charge.notes, '-'),
        dateValue(charge.assessed_at ?? charge.created_at),
    ]);
}

function miceSnapshotGroups(
    booking: BookingLike,
): Array<{ title: string; rows: Array<[string, string | number]> }> {
    const report = miceReportObject(booking);

    return [
        {
            title: 'Record status',
            rows: [
                [
                    'Status',
                    safeText(
                        booking.mice_report_status ?? report?.status,
                        'Required',
                    ),
                ],
                ['Record No.', reportValue(report, ['record_no'], '-')],
                [
                    'Year recorded',
                    reportValue(
                        report,
                        ['year_recorded'],
                        String(new Date().getFullYear()),
                    ),
                ],
                [
                    'Submitted at',
                    report?.submitted_at
                        ? formatDateTime(String(report.submitted_at))
                        : '-',
                ],
                [
                    'Last updated',
                    report?.updated_at
                        ? formatDateTime(String(report.updated_at))
                        : safeText(booking.updated_at),
                ],
            ],
        },
        {
            title: 'Event profile',
            rows: [
                [
                    'Event scope',
                    reportValue(
                        report,
                        ['event_scope'],
                        booking.mice_required
                            ? 'Government / MICE required'
                            : 'Private / personal',
                    ),
                ],
                [
                    'Event name',
                    reportValue(
                        report,
                        ['event_name'],
                        safeText(booking.type_of_event, '-'),
                    ),
                ],
                [
                    'Classification',
                    reportValue(
                        report,
                        ['classification_of_event', 'event_category'],
                        '-',
                    ),
                ],
                [
                    'Type of event',
                    reportValue(
                        report,
                        ['mice_type_of_event', 'type_of_event'],
                        safeText(booking.type_of_event, '-'),
                    ),
                ],
                [
                    'Event center',
                    reportValue(
                        report,
                        ['event_center_name', 'venue_area'],
                        serviceName(booking),
                    ),
                ],
                [
                    'Function hall capacity',
                    reportValue(
                        report,
                        ['function_hall_capacity'],
                        safeText(booking.venue_capacity),
                    ),
                ],
                ['Covered month', reportValue(report, ['covered_month'], '-')],
                ['Event days', reportValue(report, ['event_days'], '-')],
                [
                    'Number of hours',
                    reportValue(report, ['number_of_hours'], '-'),
                ],
                [
                    'Event start',
                    friendlyDateTime(
                        report?.event_started_at ??
                            report?.event_date_from ??
                            booking.booking_date_from,
                    ),
                ],
                [
                    'Event finish',
                    friendlyDateTime(
                        report?.event_finished_at ??
                            report?.event_date_to ??
                            booking.booking_date_to,
                    ),
                ],
                ['Time', scheduleTimeDisplay(booking, report)],
                ['Additional hours', additionalHoursDisplay(booking, report)],
                [
                    'Daily schedule',
                    reportValue(
                        report,
                        ['schedule_daily_display'],
                        'See schedule breakdown above',
                    ),
                ],
            ],
        },
        {
            title: 'Organizer details',
            rows: [
                [
                    'Organizer',
                    reportValue(
                        report,
                        ['organizer_organization_name', 'organization_name'],
                        primaryClient(booking),
                    ),
                ],
                [
                    'Contact person',
                    reportValue(
                        report,
                        ['organizer_contact_person', 'contact_person'],
                        safeText(booking.client_name),
                    ),
                ],
                [
                    'Contact number',
                    reportValue(
                        report,
                        ['organizer_contact_number', 'contact_number'],
                        safeText(booking.client_contact_number),
                    ),
                ],
                [
                    'Report email',
                    reportValue(
                        report,
                        ['report_email', 'email'],
                        safeText(booking.report_email ?? booking.client_email),
                    ),
                ],
                [
                    'Email',
                    reportValue(
                        report,
                        ['email'],
                        safeText(booking.client_email),
                    ),
                ],
                [
                    'Address',
                    reportValue(
                        report,
                        ['organizer_address', 'address'],
                        safeText(booking.client_address),
                    ),
                ],
            ],
        },
        {
            title: 'Participants and origin',
            rows: [
                [
                    'Local male',
                    reportValue(report, ['local_male_participants'], '0'),
                ],
                [
                    'Local female',
                    reportValue(report, ['local_female_participants'], '0'),
                ],
                [
                    'Domestic male',
                    reportValue(report, ['domestic_male_participants'], '0'),
                ],
                [
                    'Domestic female',
                    reportValue(report, ['domestic_female_participants'], '0'),
                ],
                [
                    'Foreign male',
                    reportValue(report, ['foreign_male_participants'], '0'),
                ],
                [
                    'Foreign female',
                    reportValue(report, ['foreign_female_participants'], '0'),
                ],
                [
                    'Domestic attendees',
                    reportValue(report, ['domestic_attendees'], '0'),
                ],
                [
                    'Foreign attendees',
                    reportValue(report, ['foreign_attendees'], '0'),
                ],
                [
                    'Total participants',
                    reportValue(
                        report,
                        ['total_participants'],
                        safeText(booking.number_of_guests, '0'),
                    ),
                ],
                [
                    'Total countries',
                    reportValue(report, ['total_number_of_countries'], '0'),
                ],
                [
                    'Countries',
                    reportValue(
                        report,
                        ['countries_breakdown_text', 'main_origin_country'],
                        '-',
                    ),
                ],
                [
                    'Province / City',
                    `${reportValue(report, ['main_origin_province'], '-')} / ${reportValue(report, ['main_origin_city'], '-')}`,
                ],
            ],
        },
        {
            title: 'Exhibition and tourism data',
            rows: [
                [
                    'Has exhibitions',
                    report ? (report.has_exhibitions ? 'Yes' : 'No') : '-',
                ],
                ['Exhibitors', reportValue(report, ['exhibitors_count'], '0')],
                ['Visitors', reportValue(report, ['visitors_count'], '0')],
                [
                    'Same-day visitors',
                    reportValue(report, ['same_day_visitors'], '0'),
                ],
                [
                    'Overnight visitors',
                    reportValue(report, ['overnight_visitors'], '0'),
                ],
                [
                    'Estimated room nights',
                    reportValue(report, ['estimated_room_nights'], '0'),
                ],
                [
                    'Estimated tourism receipts',
                    moneyValue(report?.estimated_tourism_receipts),
                ],
                [
                    'Remarks / Feedback',
                    reportValue(report, ['comments_feedback', 'remarks'], '-'),
                ],
            ],
        },
    ];
}

function scheduleRange(booking: BookingLike): string {
    return `${friendlyDateTime(booking.booking_date_from)} to ${friendlyDateTime(booking.booking_date_to)}`;
}

function DetailCard({
    label,
    value,
    icon: Icon,
    wide = false,
}: {
    label: string;
    value?: string | number | null;
    icon?: LucideIcon;
    wide?: boolean;
}) {
    return (
        <article
            className={cx(
                'bccc-booking-show-field rounded-[1.15rem] border border-[#eadcc2]/80 bg-white/70 p-4 shadow-[0_12px_32px_rgba(47,37,23,0.045)] dark:border-white/10 dark:bg-white/[0.035]',
                wide && 'md:col-span-2',
            )}
        >
            <div className="flex items-center gap-2">
                {Icon ? (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                        <Icon className="h-4 w-4" />
                    </span>
                ) : null}

                <p className="text-[10px] font-bold tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                    {label}
                </p>
            </div>

            <p className="mt-3 text-sm leading-7 font-semibold break-words text-[#21180d] dark:text-white">
                {safeText(value)}
            </p>
        </article>
    );
}

function SummaryCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    icon: LucideIcon;
}) {
    return (
        <article className="bccc-booking-show-stat rounded-[1.25rem] border border-[#d9c7a6]/70 bg-white/78 p-4 shadow-[0_14px_40px_rgba(47,37,23,0.07)] dark:border-white/10 dark:bg-white/[0.055]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                        {label}
                    </p>

                    <p className="mt-2 truncate text-xl font-semibold tracking-normal text-[#21180d] dark:text-white">
                        {value}
                    </p>
                </div>

                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                    <Icon className="h-5 w-5" />
                </span>
            </div>
        </article>
    );
}

function SectionCard({
    id,
    eyebrow,
    title,
    description,
    children,
    actions,
}: {
    id?: string;
    eyebrow: string;
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <section
            id={id}
            className="bccc-booking-show-section overflow-hidden rounded-[1.55rem] border border-[#d9c7a6]/70 bg-white/84 shadow-[0_22px_70px_rgba(47,37,23,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]"
        >
            <div className="flex flex-col gap-4 border-b border-[#eadcc2]/80 p-5 lg:flex-row lg:items-end lg:justify-between dark:border-white/10">
                <div>
                    <p className="text-[10px] font-bold tracking-[0.22em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                        {eyebrow}
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#21180d] dark:text-white">
                        {title}
                    </h2>

                    {description ? (
                        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#6e604c] dark:text-white/56">
                            {description}
                        </p>
                    ) : null}
                </div>

                {actions ? (
                    <div className="flex flex-wrap gap-2">{actions}</div>
                ) : null}
            </div>

            <div className="p-5">{children}</div>
        </section>
    );
}

function OpenViewField({
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
                'bccc-booking-open-view-field',
                wide && 'bccc-booking-open-view-field-wide',
            )}
        >
            <dt>{label}</dt>
            <dd>{displayValue(value)}</dd>
        </div>
    );
}

function BookingViewJumpNav({ booking }: { booking: BookingLike }) {
    const scheduleSegments = bookingScheduleSegments(booking).length;
    const items = Array.isArray(booking.items) ? booking.items.length : 0;
    const payments = bookingPaymentsCount(booking);
    const lifecycle = eventTimeline(booking).length;
    const report = miceReportObject(booking);
    const reportStatus = safeText(
        booking.mice_report_status ?? report?.status,
        'Required',
    );
    const links = [
        ['Overview', '#booking-overview'],
        ['Schedule', '#booking-schedule'],
        ['Services', '#booking-services'],
        ['Billing', '#booking-billing'],
        ['Activity', '#booking-activity'],
        ['Outputs', '#booking-outputs'],
        ['MICE', '#booking-mice'],
    ];

    return (
        <section className="bccc-booking-view-nav">
            <div className="bccc-booking-view-nav-links">
                {links.map(([label, href]) => (
                    <a key={href} href={href}>
                        {label}
                    </a>
                ))}
            </div>

            <div className="bccc-booking-view-nav-metrics">
                <span>{countLabel(scheduleSegments, 'schedule segment')}</span>
                <span>{countLabel(items, 'service item')}</span>
                <span>{countLabel(payments, 'payment record')}</span>
                <span>{countLabel(lifecycle, 'lifecycle event')}</span>
                <span>MICE: {cleanLabel(reportStatus)}</span>
            </div>
        </section>
    );
}

function BookingOpenViewPanel({ booking }: { booking: BookingLike }) {
    const report = miceReportObject(booking);
    const billingSummary = recordObject(booking.billing_summary);
    const financialSummary = recordObject(booking.financial_summary);
    const paymentMeta = bookingPaymentMeta(booking);
    const finalComputationMeta = recordObject(
        billingSummary.final_computation_meta ?? booking.final_computation_meta,
    );
    const scheduleSegments = bookingScheduleSegments(booking);
    const payments = Array.isArray(booking.payments) ? booking.payments : [];
    const latestPayment = payments[0] as Record<string, unknown> | undefined;
    const postEventCharges = Array.isArray(booking.post_event_charges)
        ? booking.post_event_charges
        : [];
    const lifecycleCount = eventTimeline(booking).length;
    const selectedPackage = displayValue(
        booking.selected_package_name ??
            booking.selectedPackageName ??
            booking.selected_package_code,
        'No package recorded',
    );
    const areaLabels = displayValue(
        bookingAreaLabels(booking),
        'No selected areas recorded',
    );
    const eventScope = booking.mice_required
        ? 'Government / MICE required'
        : cleanLabel(bookingMetaValue(booking, 'event_nature', 'Private'));
    const paymentStatus = cleanLabel(
        safeText(booking.payment_status, 'Unpaid'),
    );
    const bookingStatus = cleanLabel(
        safeText(booking.booking_status, 'Pending'),
    );
    const downPayment =
        firstPresent(
            totalValue(booking, 'required_down_payment'),
            totalValue(booking, 'down_payment'),
            billingSummary.required_down_payment,
            booking.required_down_payment_amount,
            paymentMeta.required_down_payment,
        ) ?? null;
    const bond =
        firstPresent(
            totalValue(booking, 'required_bond_amount'),
            billingSummary.required_bond,
            booking.required_bond_amount,
            paymentMeta.required_bond,
        ) ?? null;
    const baseSubtotal = firstPresent(
        totalValue(booking, 'base_subtotal'),
        billingSummary.base_subtotal,
        booking.base_subtotal,
        paymentMeta.estimated_base_total,
    );
    const baseTotal = firstPresent(
        totalValue(booking, 'base_total'),
        billingSummary.base_total,
        booking.finalized_total,
        paymentMeta.final_estimated_total,
    );
    const postEventTotal = firstPresent(
        totalValue(booking, 'post_event_total'),
        billingSummary.post_event_total,
        bookingPostEventTotal(booking),
    );
    const submittedPayments = firstPresent(
        totalValue(booking, 'submitted_payments_total'),
        financialSummary.pending,
    );
    const confirmedPayments = firstPresent(
        totalValue(booking, 'confirmed_payments_total'),
        billingSummary.paid,
        financialSummary.paid,
        totalValue(booking, 'payments_total'),
    );
    const totalPayable = firstPresent(
        totalValue(booking, 'total_with_bond'),
        totalValue(booking, 'payment_total_including_bond'),
        totalValue(booking, 'total_with_post_event'),
        totalValue(booking, 'items_total'),
        billingSummary.total_with_bond,
        billingSummary.payment_total_including_bond,
        billingSummary.total_with_post_event,
        financialSummary.total_with_bond,
        financialSummary.total,
    );
    const remainingPayable = firstPresent(
        totalValue(booking, 'remaining_balance'),
        billingSummary.balance,
        financialSummary.balance,
    );
    const finalComputationStatusLabel = firstPresent(
        billingSummary.final_computation_status_label,
        billingSummary.final_computation_display_label,
        booking.final_computation_status_label,
        booking.final_computation_status,
    );
    const bookingReference = firstPresent(
        booking.record_no,
        booking.booking_reference,
        booking.reference_no,
        booking.id,
    );
    const overviewStats: Array<{
        label: string;
        value: unknown;
        detail: unknown;
        icon: LucideIcon;
    }> = [
        {
            label: 'Schedule',
            value: friendlyDateRange(
                booking.booking_date_from,
                booking.booking_date_to,
            ),
            detail: countLabel(scheduleSegments.length, 'segment'),
            icon: CalendarDays,
        },
        {
            label: 'Venue',
            value: serviceName(booking),
            detail: areaLabels,
            icon: MapPin,
        },
        {
            label: 'Total Payable incl. Bond',
            value: moneyOrFallback(totalPayable),
            detail: `${moneyOrFallback(confirmedPayments)} paid`,
            icon: ReceiptText,
        },
        {
            label: 'Balance',
            value: moneyOrFallback(
                remainingPayable ?? remainingBalance(booking),
            ),
            detail: `Down payment ${moneyOrFallback(downPayment)}`,
            icon: CheckCircle2,
        },
        {
            label: hasSecuredPayment(booking) ? 'Secured Date' : 'Deadline',
            value: hasSecuredPayment(booking)
                ? securedDateValue(
                      booking,
                      payments as Array<Record<string, unknown>>,
                  )
                : firstPresent(
                      booking.deadline_label,
                      booking.deadlineLabel,
                      booking.deadline_state,
                      booking.deadlineState,
                  ),
            detail: dateValue(
                hasSecuredPayment(booking)
                    ? firstPresent(booking.confirmed_at, booking.confirmedAt)
                    : (booking.deadline_at ??
                          booking.deadlineAt ??
                          booking.expired_at),
            ),
            icon: Clock3,
        },
        {
            label: 'MICE',
            value: safeText(booking.mice_report_status ?? report?.status),
            detail: reportValue(
                report,
                ['classification_of_event', 'event_category'],
                eventScope,
            ),
            icon: ShieldCheck,
        },
    ];

    const groups: Array<{
        title: string;
        icon: LucideIcon;
        layout?:
            | 'compact'
            | 'feature'
            | 'wide'
            | 'review-third'
            | 'three-quarter'
            | 'quarter';
        fields: Array<{ label: string; value?: unknown; wide?: boolean }>;
    }> = [
        {
            title: 'Record Control',
            icon: ShieldCheck,
            layout: 'compact',
            fields: [
                { label: 'Booking ID', value: `#${booking.id}` },
                { label: 'Reference', value: bookingReference },
                { label: 'Booking status', value: bookingStatus },
                { label: 'Payment status', value: paymentStatus },
                {
                    label: 'Deadline status',
                    value: hasSecuredPayment(booking)
                        ? 'Payment secured'
                        : firstPresent(
                              booking.deadline_label,
                              booking.deadlineLabel,
                              booking.deadline_state,
                              booking.deadlineState,
                          ),
                    wide: true,
                },
                {
                    label: 'Deadline policy',
                    value: booking.deadline_policy,
                },
                {
                    label: hasSecuredPayment(booking)
                        ? 'Secured date'
                        : 'Payment deadline',
                    value: hasSecuredPayment(booking)
                        ? securedDateValue(
                              booking,
                              payments as Array<Record<string, unknown>>,
                          )
                        : dateValue(
                              booking.deadline_at ??
                                  booking.deadlineAt ??
                                  booking.expired_at,
                          ),
                    wide: true,
                },
            ],
        },
        {
            title: 'Client',
            icon: UserRound,
            layout: 'feature',
            fields: [
                { label: 'Contact person', value: booking.client_name },
                { label: 'Organization', value: booking.company_name },
                {
                    label: 'Organization type',
                    value: bookingMetaValue(booking, 'organization_type'),
                },
                {
                    label: 'Head of organization',
                    value: bookingMetaValue(booking, 'head_of_organization'),
                },
                {
                    label: 'Contact number',
                    value: booking.client_contact_number,
                },
                { label: 'Email', value: booking.client_email, wide: true },
                {
                    label: 'Report email',
                    value: firstPresent(
                        booking.report_email,
                        booking.client_email,
                    ),
                    wide: true,
                },
                {
                    label: 'Complete address',
                    value: booking.client_address,
                    wide: true,
                },
                {
                    label: 'Region',
                    value: clientAddressPart(booking, 'region'),
                },
                {
                    label: 'Province',
                    value: clientAddressPart(booking, 'province'),
                },
                {
                    label: 'City / Municipality',
                    value: clientAddressPart(booking, 'city'),
                },
                {
                    label: 'Barangay',
                    value: clientAddressPart(booking, 'barangay'),
                },
                {
                    label: 'Street / Building',
                    value: clientAddressPart(booking, 'street'),
                    wide: true,
                },
            ],
        },
        {
            title: 'Event',
            icon: FileText,
            fields: [
                { label: 'Event name', value: booking.type_of_event },
                { label: 'Event scope', value: eventScope, wide: true },
                { label: 'Expected guests', value: booking.number_of_guests },
                {
                    label: 'Event nature',
                    value: cleanLabel(
                        bookingMetaValue(booking, 'event_nature'),
                    ),
                },
                {
                    label: 'Private type',
                    value: bookingMetaValue(booking, 'private_event_type'),
                },
                {
                    label: 'MICE required',
                    value: booking.mice_required ? 'Yes' : 'No',
                },
                {
                    label: 'MICE report status',
                    value: safeText(
                        booking.mice_report_status ?? report?.status,
                        'Required',
                    ),
                },
                {
                    label: 'Classification',
                    value: reportValue(
                        report,
                        ['classification_of_event', 'event_category'],
                        bookingMetaValue(booking, 'classification_of_event'),
                    ),
                },
                {
                    label: 'MICE type',
                    value: reportValue(
                        report,
                        ['mice_type_of_event', 'type_of_event'],
                        booking.type_of_event ?? '-',
                    ),
                    wide: true,
                },
            ],
        },
        {
            title: 'Venue',
            icon: MapPin,
            fields: [
                { label: 'Service', value: serviceName(booking) },
                {
                    label: 'Schedule',
                    value: scheduleRange(booking),
                    wide: true,
                },
                {
                    label: 'Schedule version',
                    value: booking.schedule_version,
                },
                {
                    label: 'Schedule segments',
                    value: countLabel(scheduleSegments.length, 'segment'),
                },
                { label: 'Capacity', value: derivedVenueCapacity(booking) },
                { label: 'Package', value: selectedPackage },
                {
                    label: 'Package code',
                    value: booking.selected_package_code,
                },
                { label: 'Venue areas', value: areaLabels, wide: true },
                {
                    label: 'Usage',
                    value: cleanLabel(
                        bookingMetaValue(booking, 'estimated_usage'),
                    ),
                },
                {
                    label: 'Total hours',
                    value: bookingMetaValue(
                        booking,
                        'estimated_duration_hours',
                    ),
                },
                {
                    label: 'Other rentals',
                    value: bookingMetaValue(booking, 'estimated_other_rentals'),
                },
                {
                    label: 'Dressing room',
                    value: cleanLabel(
                        displayValue(booking.dressing_room_selection, 'None'),
                    ),
                },
                {
                    label: 'Dressing room charge',
                    value: moneyValue(booking.dressing_room_charge),
                },
                {
                    label: 'Additional charges',
                    value: moneyValue(booking.estimated_additional_charges),
                },
            ],
        },
        {
            title: 'Calendar',
            icon: CalendarDays,
            layout: 'review-third',
            fields: [
                {
                    label: 'Public calendar',
                    value: booking.is_public_calendar_visible
                        ? 'Visible'
                        : 'Hidden',
                },
                {
                    label: 'Public title',
                    value: booking.public_calendar_title,
                    wide: true,
                },
                {
                    label: 'Flexible date from',
                    value: dateValue(booking.flexible_date_from),
                },
                {
                    label: 'Flexible date to',
                    value: dateValue(booking.flexible_date_to),
                },
                {
                    label: 'Auto-decline state',
                    value: autoDeclineDisplay(booking),
                    wide: true,
                },
                {
                    label: 'Auto-decline reason',
                    value: booking.auto_decline_reason,
                    wide: true,
                },
            ],
        },
        {
            title: 'Billing',
            icon: ReceiptText,
            layout: 'wide',
            fields: [
                {
                    label: 'Base subtotal',
                    value: moneyOrFallback(baseSubtotal),
                },
                {
                    label: 'Discount total',
                    value: moneyOrFallback(
                        firstPresent(
                            totalValue(booking, 'discount_total'),
                            billingSummary.discount_total,
                            booking.discount_total,
                        ),
                        '-',
                    ),
                },
                {
                    label: 'Base total',
                    value: moneyOrFallback(baseTotal),
                },
                {
                    label: 'Post-event charges',
                    value: moneyOrFallback(postEventTotal),
                },
                {
                    label: 'Total payable incl. bond',
                    value: moneyOrFallback(totalPayable),
                },
                {
                    label: 'Required down payment + bond',
                    value: moneyOrFallback(downPayment),
                },
                {
                    label: 'Required bond',
                    value: moneyOrFallback(bond),
                },
                {
                    label: 'Bond status',
                    value: cleanLabel(
                        safeText(
                            billingSummary.bond_status ?? booking.bond_status,
                            'Pending',
                        ),
                    ),
                },
                {
                    label: 'Confirmed paid',
                    value: moneyOrFallback(confirmedPayments),
                },
                {
                    label: 'Submitted / pending',
                    value: moneyOrFallback(submittedPayments),
                },
                {
                    label: 'Remaining balance',
                    value: moneyOrFallback(
                        remainingPayable ?? remainingBalance(booking),
                    ),
                },
                {
                    label: 'Final computation status',
                    value: cleanLabel(
                        safeText(finalComputationStatusLabel, 'Not locked'),
                    ),
                },
                {
                    label: 'Final computation locked',
                    value: dateValue(
                        billingSummary.final_computation_locked_at ??
                            booking.final_computation_locked_at ??
                            finalComputationMeta.locked_at,
                    ),
                },
                {
                    label: 'Finalized at',
                    value: dateValue(
                        billingSummary.final_computation_finalized_at ??
                            booking.final_computation_finalized_at,
                    ),
                },
            ],
        },
        {
            title: 'Payment',
            icon: CheckCircle2,
            layout: 'review-third',
            fields: [
                {
                    label: 'Payment records',
                    value: countLabel(payments.length, 'record'),
                },
                {
                    label: 'Latest amount',
                    value: moneyOrFallback(latestPayment?.amount),
                },
                {
                    label: 'Latest status',
                    value: cleanLabel(safeText(latestPayment?.status)),
                },
                {
                    label: 'Latest method',
                    value:
                        latestPayment?.payment_method ??
                        latestPayment?.payment_gateway,
                },
                {
                    label: 'Latest reference',
                    value: latestPayment?.transaction_reference,
                    wide: true,
                },
                {
                    label: 'Latest paid / submitted',
                    value: dateValue(
                        latestPayment?.paid_at ?? latestPayment?.created_at,
                    ),
                    wide: true,
                },
            ],
        },
        {
            title: 'MICE Report',
            icon: ShieldCheck,
            layout: 'three-quarter',
            fields: [
                {
                    label: 'Record no.',
                    value: reportValue(report, ['record_no'], '-'),
                },
                {
                    label: 'Year',
                    value: reportValue(report, ['year_recorded'], '-'),
                },
                {
                    label: 'Event center',
                    value: reportValue(
                        report,
                        ['event_center_name', 'venue_area'],
                        serviceName(booking),
                    ),
                },
                {
                    label: 'Covered month',
                    value: reportValue(report, ['covered_month'], '-'),
                },
                {
                    label: 'Function halls',
                    value: reportValue(report, ['function_halls_count'], '-'),
                },
                {
                    label: 'Function capacity',
                    value: reportValue(
                        report,
                        ['function_hall_capacity'],
                        derivedVenueCapacity(booking),
                    ),
                },
                {
                    label: 'Domestic attendees',
                    value: reportValue(report, ['domestic_attendees'], '0'),
                },
                {
                    label: 'Foreign attendees',
                    value: reportValue(report, ['foreign_attendees'], '0'),
                },
                {
                    label: 'Total participants',
                    value: reportValue(
                        report,
                        ['total_participants'],
                        safeText(booking.number_of_guests, '0'),
                    ),
                },
                {
                    label: 'Countries',
                    value: reportValue(
                        report,
                        ['countries_breakdown_text', 'main_origin_country'],
                        '-',
                    ),
                    wide: true,
                },
                {
                    label: 'Exhibitions',
                    value: report
                        ? report.has_exhibitions
                            ? 'Yes'
                            : 'No'
                        : '-',
                },
                {
                    label: 'Tourism receipts',
                    value: moneyValue(report?.estimated_tourism_receipts),
                },
            ],
        },
        {
            title: 'Audit Trail',
            icon: Clock3,
            layout: 'review-third',
            fields: [
                {
                    label: 'Created by',
                    value: displayValue(
                        booking.created_by_name ?? booking.created_by_email,
                    ),
                },
                { label: 'Created at', value: dateValue(booking.created_at) },
                { label: 'Updated at', value: dateValue(booking.updated_at) },
                {
                    label: 'Viewed by current user',
                    value: dateValue(booking.current_user_viewed_at),
                },
                {
                    label: 'Lifecycle events',
                    value: countLabel(lifecycleCount, 'event'),
                },
                {
                    label: 'Post-event charge rows',
                    value: countLabel(postEventCharges.length, 'row'),
                },
            ],
        },
        {
            title: 'Notes',
            icon: FileText,
            layout: 'quarter',
            fields: [
                {
                    label: 'Reservation notes',
                    value: booking.reservation_notes,
                    wide: true,
                },
                {
                    label: 'Billing notes',
                    value: booking.billing_notes,
                    wide: true,
                },
                {
                    label: 'MICE remarks / feedback',
                    value: reportValue(
                        report,
                        ['comments_feedback', 'remarks'],
                        '-',
                    ),
                    wide: true,
                },
                {
                    label: 'Discount policy',
                    value: firstPresent(
                        paymentMeta.discount_note,
                        recordObject(billingSummary.policy).discount_privacy,
                    ),
                    wide: true,
                },
            ],
        },
    ];

    return (
        <section id="booking-overview" className="bccc-booking-open-view-panel">
            <div className="bccc-booking-open-view-header">
                <div>
                    <p>Complete Booking Record</p>
                    <h2>
                        {safeText(booking.type_of_event, 'Booking details')}
                    </h2>
                    <small>
                        Complete saved reservation information, grouped for
                        quick review before the detailed forms below.
                    </small>
                </div>

                <div className="bccc-booking-open-view-status">
                    <span>#{booking.id}</span>
                    <BookingStatusBadge value={bookingStatus} size="sm" />
                    <BookingStatusBadge value={paymentStatus} size="sm" />
                </div>
            </div>

            <div className="bccc-booking-open-view-stat-grid">
                {overviewStats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <article key={stat.label}>
                            <span>
                                <Icon className="h-4 w-4" />
                            </span>
                            <p>{stat.label}</p>
                            <strong>{displayValue(stat.value)}</strong>
                            <small>{displayValue(stat.detail)}</small>
                        </article>
                    );
                })}
            </div>

            <div className="bccc-booking-open-view-grid">
                {groups.map((group, index) => {
                    const Icon = group.icon;

                    return (
                        <article
                            key={group.title}
                            className={cx(
                                'bccc-booking-open-view-group',
                                group.layout === 'compact' &&
                                    'bccc-booking-open-view-group-compact',
                                group.layout === 'feature' &&
                                    'bccc-booking-open-view-group-feature',
                                group.layout === 'wide' &&
                                    'bccc-booking-open-view-group-wide',
                                group.layout === 'review-third' &&
                                    'bccc-booking-open-view-group-review-third',
                                group.layout === 'three-quarter' &&
                                    'bccc-booking-open-view-group-three-quarter',
                                group.layout === 'quarter' &&
                                    'bccc-booking-open-view-group-quarter',
                                index === 0 &&
                                    'bccc-booking-open-view-group-primary',
                            )}
                        >
                            <div className="bccc-booking-open-view-group-title">
                                <span>
                                    <Icon className="h-4 w-4" />
                                </span>
                                <h3>{group.title}</h3>
                            </div>

                            <dl>
                                {group.fields.map((field) => (
                                    <OpenViewField
                                        key={`${group.title}-${field.label}`}
                                        {...field}
                                    />
                                ))}
                            </dl>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function TimelineRow({ item }: { item: TimelineItem }) {
    const label =
        item.title ||
        item.label ||
        item.to_booking_status ||
        item.to_payment_status ||
        'Lifecycle update';

    const date = item.event_at || item.created_at;

    return (
        <article className="flex gap-3 rounded-[1.1rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#b08d48]" />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                    {item.to_booking_status ? (
                        <BookingStatusBadge
                            value={item.to_booking_status}
                            size="sm"
                        />
                    ) : null}

                    {item.to_payment_status ? (
                        <BookingStatusBadge
                            value={item.to_payment_status}
                            size="sm"
                        />
                    ) : null}
                </div>

                <h3 className="mt-2 text-sm font-semibold text-[#21180d] dark:text-white">
                    {cleanLabel(label)}
                </h3>

                {item.description ? (
                    <p className="mt-1 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                        {item.description}
                    </p>
                ) : null}

                <p className="mt-2 text-xs font-medium text-[#8a7a63] dark:text-white/40">
                    {formatDateTime(date)}
                </p>
            </div>
        </article>
    );
}

function EmptyPanel({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-[1.25rem] border border-dashed border-[#d9c7a6]/80 bg-[#fffaf0]/58 p-8 text-center dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="mx-auto h-9 w-9 text-[#b08d48] dark:text-[#f1d89b]" />

            <h3 className="mt-4 text-base font-semibold text-[#21180d] dark:text-white">
                {title}
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-[#6e604c] dark:text-white/56">
                {description}
            </p>
        </div>
    );
}

export function BookingShowPage() {
    const { props } = usePage<BookingShowPageProps>();
    const role = normalizeWorkspaceRole(props.workspaceRole);
    const booking = props.booking;

    if (!booking) {
        return (
            <BookingRolePageShell
                role={role}
                title="Booking Not Found"
                description="The booking record could not be loaded."
            >
                <div className="rounded-[1.55rem] border border-[#d9c7a6]/70 bg-white/84 p-10 text-center shadow-[0_22px_70px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.055]">
                    <h2 className="text-2xl font-semibold tracking-normal text-[#21180d] dark:text-white">
                        The booking record could not be loaded.
                    </h2>

                    <Link
                        href={bookingBasePath(role)}
                        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bookings
                    </Link>
                </div>
            </BookingRolePageShell>
        );
    }

    const canUpdate = Boolean(props.canUpdateBooking);
    const canDelete = Boolean(props.canDeleteBooking);
    const canManagePayments = Boolean(props.canManagePayments);
    const isUser = role === 'user';
    const currentBooking = booking;
    const timeline = eventTimeline(currentBooking);
    const billingSummary = recordObject(booking.billing_summary);
    const financialSummary = recordObject(booking.financial_summary);
    const totalPayable = firstPresent(
        totalValue(booking, 'total_with_bond'),
        totalValue(booking, 'payment_total_including_bond'),
        totalValue(booking, 'total_with_post_event'),
        totalValue(booking, 'items_total'),
        billingSummary.total_with_bond,
        billingSummary.payment_total_including_bond,
        billingSummary.total_with_post_event,
        financialSummary.total_with_bond,
        financialSummary.total,
    );
    const remainingPayable = firstPresent(
        totalValue(booking, 'remaining_balance'),
        billingSummary.balance,
        financialSummary.balance,
    );
    const finalComputationStatusLabel = firstPresent(
        billingSummary.final_computation_status_label,
        billingSummary.final_computation_display_label,
        booking.final_computation_status_label,
        booking.final_computation_status,
    );

    function deleteBooking() {
        if (
            !window.confirm(
                'Delete this booking record? This action cannot be undone.',
            )
        ) {
            return;
        }

        router.delete(`${bookingBasePath(role)}/${currentBooking.id}`, {
            preserveScroll: false,
        });
    }

    return (
        <BookingRolePageShell
            role={role}
            title={safeText(booking.type_of_event, `Booking #${booking.id}`)}
            description={
                isUser
                    ? 'Review your booking request and requirements.'
                    : 'Review booking, client, schedule, payment, and MICE details.'
            }
            compact
        >
            <div className="bccc-booking-show-page space-y-5">
                <section className="bccc-booking-status-toolbar rounded-[1.2rem] border border-[#d9c7a6]/70 bg-white/92 p-4 shadow-[0_14px_44px_rgba(47,37,23,0.07)] dark:border-white/10 dark:bg-white/[0.055]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <BookingStatusBadge
                                    value={booking.booking_status}
                                />
                                <BookingStatusBadge
                                    value={booking.payment_status}
                                />
                                <BookingDeadlineBadge booking={booking} />
                                <span className="inline-flex items-center rounded-full border border-[#d9c7a6]/70 bg-white/75 px-3 py-1.5 text-xs font-bold text-[#7a5a24] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                                    Booking #{booking.id}
                                </span>
                            </div>
                            <p className="mt-3 truncate text-sm font-semibold text-[#21180d] dark:text-white">
                                {primaryClient(booking)} ·{' '}
                                {serviceName(booking)} ·{' '}
                                {scheduleRange(booking)}
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                            <Link
                                href={bookingBasePath(role)}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Link>
                            {canUpdate ? (
                                <Link
                                    href={bookingEditPath(role, booking.id)}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-4 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                </Link>
                            ) : null}
                            {canDelete ? (
                                <button
                                    type="button"
                                    onClick={deleteBooking}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(225,29,72,0.18)] transition hover:-translate-y-0.5 hover:bg-rose-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            ) : null}
                            <Link
                                href={bookingMiceReportPath(role, booking)}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                MICE Report
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="bccc-booking-show-summary-grid grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label="Schedule From"
                        value={formatDateTime(booking.booking_date_from)}
                        icon={CalendarDays}
                    />

                    <SummaryCard
                        label="Schedule To"
                        value={formatDateTime(booking.booking_date_to)}
                        icon={Clock3}
                    />

                    <SummaryCard
                        label="Total Charges"
                        value={moneyOrFallback(totalPayable)}
                        icon={ReceiptText}
                    />

                    <SummaryCard
                        label="Remaining Balance"
                        value={moneyOrFallback(
                            remainingPayable ?? remainingBalance(booking),
                        )}
                        icon={CheckCircle2}
                    />
                </section>

                <BookingDeadlinePanel booking={booking} />

                <BookingViewJumpNav booking={booking} />

                <BookingOpenViewPanel booking={booking} />

                <section
                    id="booking-detail-sheet"
                    className="bccc-booking-show-form-sheet"
                >
                    <section className="bccc-booking-show-main-grid grid gap-5">
                        <div className="bccc-booking-show-section-flow">
                            <SectionCard
                                id="booking-schedule"
                                eyebrow="Schedule Breakdown"
                                title="Per-day schedule, areas, and extra hours"
                                description="Shows every stored schedule segment so consecutive dates, ingress/egress, base blocks, selected areas, and approved extra hours are visible from the booking view."
                            >
                                <DetailTable
                                    headers={[
                                        'Date',
                                        'Segment',
                                        'Time',
                                        'Areas',
                                        'Additional / EVE Hours',
                                    ]}
                                    rows={scheduleSegmentRows(booking)}
                                    emptyTitle="No schedule segments loaded"
                                    emptyDescription="The booking still shows its main date range above. Detailed per-day rows will appear here when schedule segment records are available."
                                />
                            </SectionCard>

                            <SectionCard
                                id="booking-services"
                                eyebrow="Services and Charges"
                                title="Booked service line items"
                                description="Displays the recorded service computation used by the payment snapshot and printable final bill."
                            >
                                <DetailTable
                                    headers={[
                                        'Service',
                                        'Area / Type',
                                        'Qty',
                                        'Unit Price',
                                        'Line Total',
                                    ]}
                                    rows={bookingItemRows(booking)}
                                    emptyTitle="No service line items loaded"
                                    emptyDescription="The total is still computed from the booking billing summary. Individual item rows appear here when booking services are loaded by the controller."
                                />
                            </SectionCard>

                            <SectionCard
                                id="booking-billing-snapshot"
                                eyebrow="Billing Summary"
                                title="Financial snapshot"
                                description="Fast payment criteria before the detailed proofs, post-event rows, and compliance review."
                            >
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <MiniBox
                                        label="Venue / Booking Total"
                                        value={moneyOrFallback(
                                            firstPresent(
                                                totalValue(
                                                    booking,
                                                    'base_total',
                                                ),
                                                totalValue(
                                                    booking,
                                                    'items_total',
                                                ),
                                            ),
                                        )}
                                    />
                                    <MiniBox
                                        label="Discounts / Adjustments"
                                        value={negativeMoneyOrFallback(
                                            firstPresent(
                                                totalValue(
                                                    booking,
                                                    'discount_total',
                                                ),
                                                billingSummary.discount_total,
                                                booking.discount_total,
                                            ),
                                        )}
                                    />
                                    <MiniBox
                                        label="Post-Event Charges"
                                        value={formatMoney(
                                            bookingPostEventTotal(booking),
                                        )}
                                    />
                                    <MiniBox
                                        label="Total Payable incl. Bond"
                                        value={moneyOrFallback(totalPayable)}
                                    />
                                    <MiniBox
                                        label="Submitted Payments"
                                        value={moneyOrFallback(
                                            totalValue(
                                                booking,
                                                'submitted_payments_total',
                                            ),
                                        )}
                                    />
                                    <MiniBox
                                        label="Confirmed Payments"
                                        value={moneyOrFallback(
                                            firstPresent(
                                                totalValue(
                                                    booking,
                                                    'confirmed_payments_total',
                                                ),
                                                totalValue(
                                                    booking,
                                                    'payments_total',
                                                ),
                                            ),
                                        )}
                                    />
                                    <MiniBox
                                        label="Remaining Balance"
                                        value={moneyOrFallback(
                                            remainingPayable ??
                                                remainingBalance(booking),
                                        )}
                                    />
                                    <MiniBox
                                        label="Bond Status"
                                        value={cleanLabel(
                                            safeText(
                                                billingSummary.bond_status ??
                                                    booking.bond_status,
                                                'Pending',
                                            ),
                                        )}
                                    />
                                    <MiniBox
                                        label="Final Computation"
                                        value={cleanLabel(
                                            safeText(
                                                finalComputationStatusLabel,
                                                'Not locked',
                                            ),
                                        )}
                                    />
                                    <MiniBox
                                        label="Payment Records"
                                        value={bookingPaymentsCount(
                                            booking,
                                        ).toString()}
                                    />
                                </div>
                            </SectionCard>

                            <BookingApprovalPanel
                                role={role}
                                booking={booking}
                                canManagePayments={canManagePayments}
                            />

                            <PaymentProofPanel
                                role={role}
                                booking={booking}
                                canManagePayments={canManagePayments}
                            />

                            <SectionCard
                                id="booking-billing"
                                eyebrow="Payment Compliance Details"
                                title="Payment records and post-event charges"
                                description="Shows submitted/confirmed payments and any post-event charges separately so client compliance remains accurate without changing the booking status."
                            >
                                <div className="grid gap-5">
                                    <DetailTable
                                        headers={[
                                            'Type',
                                            'Status',
                                            'Amount',
                                            'Method',
                                            'Reference',
                                            'Date',
                                        ]}
                                        rows={paymentRows(booking)}
                                        emptyTitle="No payment records yet"
                                        emptyDescription="Client submitted payment proofs will appear here after upload or staff encoding."
                                    />
                                    <DetailTable
                                        headers={[
                                            'Category',
                                            'Label',
                                            'Amount',
                                            'Status',
                                            'Notes',
                                            'Assessed',
                                        ]}
                                        rows={postEventChargeRows(booking)}
                                        emptyTitle="No post-event charges"
                                        emptyDescription="Damage, overtime, or other after-event charges will appear here and remain separate from the booking status."
                                    />
                                </div>
                            </SectionCard>

                            <SectionCard
                                id="booking-activity"
                                eyebrow="Audit Trail"
                                title="Lifecycle timeline"
                                description="Recent booking and payment updates appear here when loaded by the controller."
                            >
                                {timeline.length > 0 ? (
                                    <div className="grid gap-3">
                                        {timeline
                                            .slice(0, 10)
                                            .map((item, index) => (
                                                <TimelineRow
                                                    key={
                                                        item.id ??
                                                        `${index}-${item.event_at}`
                                                    }
                                                    item={item}
                                                />
                                            ))}
                                    </div>
                                ) : (
                                    <EmptyPanel
                                        icon={Clock3}
                                        title="No lifecycle events loaded"
                                        description="Status and payment lifecycle history will appear here when available."
                                    />
                                )}
                            </SectionCard>

                            <SectionCard
                                id="booking-outputs"
                                eyebrow="Print / Export"
                                title="Official outputs"
                            >
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    {[
                                        [
                                            'reservation',
                                            'Reservation Summary',
                                            FileText,
                                        ],
                                        [
                                            'final-bill',
                                            'Final Bill',
                                            ReceiptText,
                                        ],
                                        [
                                            'cancellation',
                                            'Cancellation Assessment',
                                            Printer,
                                        ],
                                        [
                                            'mice-summary',
                                            'MICE Summary',
                                            ShieldCheck,
                                        ],
                                    ].map(([document, label, Icon]) => (
                                        <div
                                            key={String(document)}
                                            className="rounded-[1.1rem] border border-[#eadcc2]/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.035]"
                                        >
                                            <p className="text-xs font-black tracking-[0.18em] text-[#8b672d] uppercase dark:text-[#f1d89b]">
                                                {String(label)}
                                            </p>
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                <a
                                                    href={bookingPrintablePath(
                                                        role,
                                                        booking.id,
                                                        String(document),
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6] bg-white px-3 text-xs font-semibold text-[#2f2517] transition hover:bg-[#fff8ea] dark:border-white/10 dark:bg-white/10 dark:text-white"
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    Print
                                                </a>
                                                <a
                                                    href={bookingExportPath(
                                                        role,
                                                        booking.id,
                                                        String(document),
                                                    )}
                                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-3 text-xs font-semibold text-white transition hover:bg-[#46361f]"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    Export CSV
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>

                            <SectionCard
                                id="booking-mice"
                                eyebrow="MICE Report Snapshot"
                                title="Saved report details"
                            >
                                <div className="rounded-[1.2rem] border border-[#eadcc2]/80 bg-[#fffaf0]/76 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                                    <p className="text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                        This snapshot uses the saved
                                        booking/MICE values, including
                                        system-prefilled details, so private and
                                        public reservations still show an
                                        auditable report record.
                                    </p>
                                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {miceSnapshotGroups(booking).map(
                                            (group) => (
                                                <div
                                                    key={group.title}
                                                    className="rounded-[1.1rem] border border-[#eadcc2]/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.035]"
                                                >
                                                    <h3 className="px-1 text-[10px] font-bold tracking-[0.2em] text-[#8b672d] uppercase dark:text-[#f1d89b]">
                                                        {group.title}
                                                    </h3>
                                                    <div className="mt-3 grid gap-2">
                                                        {group.rows.map(
                                                            ([
                                                                label,
                                                                value,
                                                            ]) => (
                                                                <MiniBox
                                                                    key={`${group.title}-${label}`}
                                                                    label={
                                                                        label
                                                                    }
                                                                    value={displayValue(
                                                                        value,
                                                                    )}
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <Link
                                        href={bookingMiceReportPath(
                                            role,
                                            booking,
                                        )}
                                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        Open / Edit MICE Report
                                    </Link>
                                </div>
                            </SectionCard>

                            <SectionCard
                                eyebrow="Contact"
                                title="Client contact"
                            >
                                <div className="grid gap-3 md:grid-cols-3">
                                    <DetailCard
                                        label="Client"
                                        value={booking.client_name}
                                        icon={UserRound}
                                    />
                                    <DetailCard
                                        label="Email"
                                        value={booking.client_email}
                                        icon={Mail}
                                    />
                                    <DetailCard
                                        label="Phone"
                                        value={booking.client_contact_number}
                                        icon={Phone}
                                    />
                                </div>
                            </SectionCard>
                        </div>
                    </section>
                </section>
            </div>
        </BookingRolePageShell>
    );
}

function MiniBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="bccc-booking-show-mini flex items-center justify-between gap-4 rounded-[1rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]">
            <span className="text-xs font-bold tracking-[0.16em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                {label}
            </span>

            <strong className="text-right text-sm font-semibold text-[#21180d] dark:text-white">
                {value}
            </strong>
        </div>
    );
}

function DetailTable({
    headers,
    rows,
    emptyTitle,
    emptyDescription,
}: {
    headers: string[];
    rows: Array<Array<string>>;
    emptyTitle: string;
    emptyDescription: string;
}) {
    if (rows.length === 0) {
        return (
            <div className="rounded-[1.2rem] border border-dashed border-[#d9c7a6]/80 bg-[#fffaf0]/60 p-5 text-sm leading-7 text-[#6e604c] dark:border-white/15 dark:bg-white/[0.03] dark:text-white/56">
                <strong className="block text-[#21180d] dark:text-white">
                    {emptyTitle}
                </strong>
                {emptyDescription}
            </div>
        );
    }

    return (
        <div className="bccc-booking-show-table overflow-hidden rounded-[1.2rem] border border-[#eadcc2]/80 bg-white/70 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="bccc-booking-show-table-scroll overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#fff4df] text-[10px] font-bold tracking-[0.18em] text-[#8b672d] uppercase dark:bg-white/10 dark:text-[#f1d89b]">
                        <tr>
                            {headers.map((header) => (
                                <th key={header} className="px-4 py-3">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eadcc2]/80 dark:divide-white/10">
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="align-top">
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={`${rowIndex}-${cellIndex}`}
                                        data-label={headers[cellIndex] ?? ''}
                                        className="px-4 py-3 leading-6 text-[#21180d] dark:text-white/82"
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BookingShowPage;
