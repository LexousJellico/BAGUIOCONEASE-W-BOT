import { Button } from '@/components/ui/button';
import {
    CalendarDays,
    CheckCircle2,
    FileText,
    Printer,
    ReceiptText,
    ShieldCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';

export type OfficialReservationFormData = {
    organization_type?: string;
    company_name?: string;
    client_name?: string;
    client_contact_number?: string;
    client_email?: string;
    client_address?: string;
    client_region?: string;
    client_province?: string;
    client_city_municipality?: string;
    client_barangay?: string;
    client_zip_code?: string;
    client_street_address?: string;
    head_of_organization?: string;
    type_of_event?: string;
    booking_date_from?: string;
    booking_date_to?: string;
    number_of_guests?: string | number;
    public_calendar_title?: string;
    selected_package_code?: string;
    dressing_room_selection?: string;
    mice_required?: boolean | string | number;
};

export type SelectedVenueLike = {
    label?: string;
    displayLabel?: string;
    category?: string;
    capacity?: string | number;
    rates?: Record<string, number | string | null | undefined>;
};

type ScheduleSegmentLike = {
    date?: string | null;
    segment_role?: string | null;
    role?: string | null;
    base_block?: string | null;
    block?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    additional_hours?: number | string | null;
    additional_starts_at?: string | null;
    additional_ends_at?: string | null;
};

type MiceDraftLike = Record<string, unknown> & {
    event_center_name?: string;
    covered_month?: string;
    classification_of_event?: string;
    mice_type_of_event?: string;
    event_name?: string;
    number_of_hours?: string | number;
    foreign_attendees?: string | number;
    domestic_attendees?: string | number;
    total_number_of_countries?: string | number;
    countries_breakdown_text?: string;
    has_exhibitions?: boolean | string | number;
    exhibitors_count?: string | number;
    visitors_count?: string | number;
    comments_feedback?: string;
};

export type OfficialReservationPreviewProps = {
    data: OfficialReservationFormData;
    selectedVenue?: SelectedVenueLike | null;
    usage?: string;
    durationHours?: number | string;
    otherRentals?: string;
    additionalCharges?: number | string;
    reservationNotes?: string;
    estimatedBase?: number | string;
    estimatedTotal?: number | string;
    fullAddress?: string;
    selectedPackageName?: string | null;
    selectedAreaLabels?: string[];
    scheduleSegments?: ScheduleSegmentLike[];
    miceDraft?: MiceDraftLike | null;
};

function money(value: unknown): string {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

function text(value: unknown, fallback = '—'): string {
    if (value === null || value === undefined || String(value).trim() === '') {
        return fallback;
    }

    return String(value);
}

function cleanLabel(value: unknown, fallback = '—'): string {
    const raw = text(value, fallback);

    if (raw === fallback) {
        return raw;
    }

    return raw
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateTime(value?: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function dateOnly(value?: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
}

function yesNo(value: unknown): string {
    return value === true ||
        value === 1 ||
        value === '1' ||
        String(value).toLowerCase() === 'true'
        ? 'Yes'
        : 'No';
}

function fullAddressFrom(
    data: OfficialReservationFormData,
    fullAddress?: string,
): string {
    if (fullAddress && fullAddress.trim() !== '') {
        return fullAddress;
    }

    const parts = [
        data.client_street_address,
        data.client_barangay,
        data.client_city_municipality,
        data.client_province,
        data.client_region,
        data.client_zip_code,
    ].filter(
        (part) =>
            part !== null && part !== undefined && String(part).trim() !== '',
    );

    return parts.length ? parts.join(', ') : text(data.client_address);
}

function Line({
    label,
    value,
    wide = false,
}: {
    label: string;
    value: ReactNode;
    wide?: boolean;
}) {
    return (
        <div
            className={
                wide
                    ? 'official-form-line official-form-line-wide'
                    : 'official-form-line'
            }
        >
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function Section({
    number,
    title,
    children,
}: {
    number: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="official-form-section">
            <div className="official-form-section-title">
                <span>{number}</span>
                <h3>{title}</h3>
            </div>
            <div className="official-form-grid">{children}</div>
        </section>
    );
}

function ScheduleTable({ segments }: { segments: ScheduleSegmentLike[] }) {
    if (!segments.length) {
        return null;
    }

    return (
        <div className="official-form-table-wrap official-form-line-wide">
            <table className="official-form-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Role</th>
                        <th>Base schedule</th>
                        <th>Time</th>
                        <th>Additional hours</th>
                    </tr>
                </thead>
                <tbody>
                    {segments.map((segment, index) => (
                        <tr key={`${segment.date}-${index}`}>
                            <td>{dateOnly(segment.date)}</td>
                            <td>
                                {cleanLabel(
                                    segment.segment_role ?? segment.role,
                                )}
                            </td>
                            <td>
                                {cleanLabel(
                                    segment.base_block ?? segment.block,
                                )}
                            </td>
                            <td>
                                {text(segment.starts_at)} —{' '}
                                {text(segment.ends_at)}
                            </td>
                            <td>
                                {Number(segment.additional_hours ?? 0) > 0
                                    ? `${segment.additional_hours} hr/s (${text(segment.additional_starts_at)} — ${text(segment.additional_ends_at)})`
                                    : 'None'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function OfficialReservationPreview({
    data,
    selectedVenue,
    usage,
    durationHours,
    otherRentals,
    additionalCharges,
    reservationNotes,
    estimatedBase,
    estimatedTotal,
    fullAddress,
    selectedPackageName,
    selectedAreaLabels = [],
    scheduleSegments = [],
    miceDraft,
}: OfficialReservationPreviewProps) {
    const address = fullAddressFrom(data, fullAddress);
    const packageLabel =
        selectedPackageName ||
        data.selected_package_code ||
        selectedVenue?.displayLabel ||
        selectedVenue?.label;
    const areas = selectedAreaLabels.length
        ? selectedAreaLabels.join(', ')
        : text(
              selectedVenue?.displayLabel ?? selectedVenue?.label,
              'Selected venue area',
          );
    const miceRequired = data.mice_required ?? Boolean(miceDraft);

    return (
        <section className="official-reservation-preview">
            <div className="official-preview-toolbar print:hidden">
                <div>
                    <p className="official-preview-kicker">Official Review</p>
                    <h2>Reservation Summary Form</h2>
                    <p>
                        Review this official-style preview before submitting or
                        printing the booking record.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={() => window.print()}
                    className="gap-2 rounded-full"
                >
                    <Printer className="h-4 w-4" />
                    Print Preview
                </Button>
            </div>

            <article className="official-form-paper">
                <header className="official-form-header">
                    <div className="official-seal-mark">BCCC</div>
                    <div>
                        <p>Republic of the Philippines</p>
                        <h1>Baguio Convention and Cultural Center</h1>
                        <h2>Reservation / Booking Review Form</h2>
                    </div>
                    <div className="official-form-status">
                        <FileText className="h-5 w-5" />
                        <span>Draft</span>
                    </div>
                </header>

                <div className="official-form-alert">
                    <CheckCircle2 className="h-5 w-5" />
                    <p>
                        This summary is generated from the booking wizard.
                        Rates, dressing room charges, MICE requirements, and
                        schedule segments are system-computed and subject to
                        BCCC verification.
                    </p>
                </div>

                <Section number="01" title="Event and Venue">
                    <Line
                        label="Event Title"
                        value={text(
                            data.public_calendar_title ||
                                miceDraft?.event_name ||
                                data.type_of_event,
                        )}
                    />
                    <Line
                        label="Event Type"
                        value={cleanLabel(data.type_of_event)}
                    />
                    <Line label="Package" value={text(packageLabel)} />
                    <Line label="Selected Area/s" value={areas} wide />
                    <Line label="Usage" value={cleanLabel(usage)} />
                    <Line
                        label="Expected Guests"
                        value={text(data.number_of_guests)}
                    />
                    <Line
                        label="Capacity"
                        value={text(selectedVenue?.capacity)}
                    />
                    <Line label="MICE Required" value={yesNo(miceRequired)} />
                </Section>

                <Section number="02" title="Organizer">
                    <Line
                        label="Organization Type"
                        value={cleanLabel(data.organization_type)}
                    />
                    <Line
                        label="Organization"
                        value={text(data.company_name)}
                    />
                    <Line
                        label="Representative"
                        value={text(data.client_name)}
                    />
                    <Line
                        label="Head of Organization"
                        value={text(data.head_of_organization)}
                    />
                    <Line label="Email" value={text(data.client_email)} />
                    <Line
                        label="Contact Number"
                        value={text(data.client_contact_number)}
                    />
                    <Line label="Address" value={address} wide />
                </Section>

                <Section number="03" title="Schedule">
                    <Line
                        label="Booking Start"
                        value={dateTime(data.booking_date_from)}
                    />
                    <Line
                        label="Booking End"
                        value={dateTime(data.booking_date_to)}
                    />
                    <Line
                        label="Duration"
                        value={
                            durationHours
                                ? `${durationHours} hour/s`
                                : 'System computed'
                        }
                    />
                    <Line
                        label="Schedule Rule"
                        value="AM / PM / Whole Day with additional evening hours only after PM or Whole Day"
                        wide
                    />
                    <ScheduleTable segments={scheduleSegments} />
                </Section>

                <Section number="04" title="Computed Charges">
                    <Line label="Base Estimate" value={money(estimatedBase)} />
                    <Line
                        label="Other Rental"
                        value={cleanLabel(
                            otherRentals ||
                                data.dressing_room_selection ||
                                'None',
                        )}
                    />
                    <Line
                        label="Additional Charges"
                        value={money(additionalCharges)}
                    />
                    <Line
                        label="Estimated Total"
                        value={money(estimatedTotal)}
                    />
                    <Line
                        label="Notes"
                        value={text(
                            reservationNotes,
                            'No special notes encoded.',
                        )}
                        wide
                    />
                </Section>

                {miceRequired ? (
                    <Section number="05" title="MICE Report Snapshot">
                        <Line
                            label="Event Center"
                            value={text(
                                miceDraft?.event_center_name,
                                'Baguio Convention and Cultural Center',
                            )}
                        />
                        <Line
                            label="Covered Month"
                            value={text(miceDraft?.covered_month)}
                        />
                        <Line
                            label="Classification"
                            value={cleanLabel(
                                miceDraft?.classification_of_event,
                            )}
                        />
                        <Line
                            label="Type of Event"
                            value={cleanLabel(miceDraft?.mice_type_of_event)}
                        />
                        <Line
                            label="Time"
                            value={text(miceDraft?.schedule_time_display)}
                            wide
                        />
                        <Line
                            label="Additional Hours"
                            value={text(miceDraft?.additional_hours_display)}
                            wide
                        />
                        <Line
                            label="Number of Hours"
                            value={text(miceDraft?.number_of_hours)}
                        />
                        <Line
                            label="Domestic Attendees"
                            value={text(miceDraft?.domestic_attendees)}
                        />
                        <Line
                            label="Foreign Attendees"
                            value={text(miceDraft?.foreign_attendees)}
                        />
                        <Line
                            label="Countries"
                            value={text(miceDraft?.total_number_of_countries)}
                        />
                        <Line
                            label="Breakdown of Countries"
                            value={text(miceDraft?.countries_breakdown_text)}
                            wide
                        />
                        <Line
                            label="Exhibitions"
                            value={yesNo(miceDraft?.has_exhibitions)}
                        />
                        <Line
                            label="Exhibitors"
                            value={text(miceDraft?.exhibitors_count)}
                        />
                        <Line
                            label="Visitors"
                            value={text(miceDraft?.visitors_count)}
                        />
                        <Line
                            label="Comment / Feedback"
                            value={text(miceDraft?.comments_feedback)}
                            wide
                        />
                    </Section>
                ) : null}

                <section className="official-form-certification">
                    <ShieldCheck className="h-5 w-5" />
                    <p>
                        I certify that the encoded details are true and correct
                        to the best of my knowledge. I understand that the
                        reservation remains subject to BCCC review, availability
                        validation, payment requirements, and applicable venue
                        policies.
                    </p>
                </section>

                <footer className="official-form-signatures">
                    <div>
                        <span />
                        <p>Organizer / Authorized Representative</p>
                    </div>
                    <div>
                        <span />
                        <p>BCCC Receiving Staff</p>
                    </div>
                    <div>
                        <span />
                        <p>Date and Time Received</p>
                    </div>
                </footer>
            </article>

            <div className="official-preview-footnotes print:hidden">
                <span>
                    <CalendarDays className="h-4 w-4" /> Dates are checked
                    through availability rules.
                </span>
                <span>
                    <ReceiptText className="h-4 w-4" /> Final billing may still
                    be verified by authorized staff.
                </span>
            </div>
        </section>
    );
}
