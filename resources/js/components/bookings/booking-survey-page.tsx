import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import {
    bookingShowPath,
    bookingSurveyPath,
    cleanLabel,
    formatDateTime,
    normalizeWorkspaceRole,
} from '@/lib/booking-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    CalendarDays,
    CheckCircle2,
    FileSpreadsheet,
    Globe2,
    LoaderCircle,
    MapPin,
    ReceiptText,
    ShieldCheck,
    Sparkles,
    Trash2,
    Users,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo } from 'react';

type Option =
    | string
    | { value: string; label: string; description?: string | null };

type BookingPayload = {
    id: number | string;
    type_of_event?: string | null;
    organization_type?: string | null;
    company_name?: string | null;
    client_name?: string | null;
    client_contact_number?: string | null;
    client_email?: string | null;
    client_address?: string | null;
    head_of_organization?: string | null;
    number_of_guests?: number | string | null;
    booking_status?: string | null;
    payment_status?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
};

type CountryRow = { country: string; count: string };

type MiceRecordPayload = Record<string, unknown> & {
    status?: string | null;
    submitted_at?: string | null;
    event_scope?: string | null;
    countries_breakdown?: CountryRow[] | null;
};

type PageProps = {
    workspaceRole?: string;
    booking?: BookingPayload;
    miceRecord?: MiceRecordPayload | null;
    defaults?: MiceRecordPayload;
    formOptions?: {
        eventCategories?: Option[];
        eventTypes?: Option[];
        countries?: Option[];
        countryOptions?: Option[];
        eventScopes?: Option[];
        eventScopeOptions?: Option[];
        organizerTypes?: string[];
        enterpriseGroups?: string[];
    };
};

type MiceFormData = {
    event_scope: 'public' | 'private';
    year_recorded: string;
    enterprise_group: string;
    btc_group_code: string;
    event_center_name: string;
    function_halls_count: string;
    function_hall_capacity: string;
    covered_month: string;
    event_started_at: string;
    event_finished_at: string;
    number_of_hours: string;
    event_name: string;
    event_category: string;
    classification_of_event: string;
    type_of_event: string;
    mice_type_of_event: string;
    venue_area: string;
    event_date_from: string;
    event_date_to: string;
    organization_name: string;
    organizer_organization_name: string;
    organizer_name: string;
    organizer_type: string;
    contact_person: string;
    organizer_contact_person: string;
    contact_number: string;
    organizer_contact_number: string;
    email: string;
    address: string;
    organizer_address: string;
    domestic_attendees: string;
    foreign_attendees: string;
    total_number_of_countries: string;
    countries_breakdown: CountryRow[];
    has_exhibitions: boolean;
    exhibitors_count: string;
    visitors_count: string;
    local_male_participants: string;
    local_female_participants: string;
    domestic_male_participants: string;
    domestic_female_participants: string;
    foreign_male_participants: string;
    foreign_female_participants: string;
    total_participants?: string;
    main_origin_country: string;
    main_origin_province: string;
    main_origin_city: string;
    same_day_visitors: string;
    overnight_visitors: string;
    estimated_room_nights: string;
    estimated_tourism_receipts: string;
    total_employees: string;
    female_employees: string;
    male_employees: string;
    permit_to_engage: boolean;
    dot_accredited: boolean;
    active_member: boolean;
    comments_feedback: string;
    remarks: string;
    certified: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function first(...values: unknown[]): string {
    for (const value of values) {
        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ''
        )
            return String(value);
    }
    return '';
}

function upper(value: string): string {
    return value.toUpperCase();
}

function digits(value: string): string {
    return value.replace(/[^0-9+]/g, '');
}

function dateOnly(value?: string | null): string {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function optionValue(option: Option): string {
    return typeof option === 'string' ? option : option.value;
}

function optionLabel(option: Option): string {
    return typeof option === 'string' ? option : option.label;
}

function optionDescription(option: Option): string | undefined | null {
    return typeof option === 'string' ? undefined : option.description;
}

function Field({
    label,
    required,
    error,
    children,
    hint,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
    hint?: ReactNode;
}) {
    return (
        <label className="mice-survey-field">
            <span>
                {label}
                {required ? <strong>*</strong> : null}
            </span>
            {children}
            {hint ? (
                <em className="text-xs text-slate-500 not-italic">{hint}</em>
            ) : null}
            {error ? (
                <small>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {error}
                </small>
            ) : null}
        </label>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    tone = 'default',
}: {
    label: string;
    value: ReactNode;
    icon: typeof FileSpreadsheet;
    tone?: 'default' | 'green' | 'gold' | 'red';
}) {
    return (
        <article className={cx('mice-survey-stat-card', `tone-${tone}`)}>
            <div>
                <p>{label}</p>
                <strong>{value}</strong>
            </div>
            <Icon className="h-5 w-5" />
        </article>
    );
}

function NoticeList({ title, options }: { title: string; options: Option[] }) {
    return (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <strong className="mb-2 block text-sm tracking-[0.18em] uppercase">
                {title}
            </strong>
            <div className="grid gap-2 md:grid-cols-2">
                {options.map((option) => (
                    <p key={optionValue(option)}>
                        <b>{optionLabel(option)}</b>
                        {optionDescription(option)
                            ? ` — ${optionDescription(option)}`
                            : ''}
                    </p>
                ))}
            </div>
        </div>
    );
}

export function BookingSurveyPage() {
    const { props } = usePage<PageProps>();
    const role = normalizeWorkspaceRole(props.workspaceRole) as RoleThemeKey;
    const booking = props.booking;
    const record = props.miceRecord;
    const defaults = props.defaults || {};
    const options = props.formOptions || {};

    const eventCategories = options.eventCategories || [
        {
            value: 'INTERNATIONAL',
            label: 'INTERNATIONAL',
            description:
                'Guests/participants are from two different continents.',
        },
        {
            value: 'REGIONAL ASIA PACIFIC',
            label: 'REGIONAL ASIA PACIFIC',
            description:
                'Guests/participants are from two or more countries from the same continent.',
        },
        {
            value: 'REGIONAL OFFSHORE',
            label: 'REGIONAL OFFSHORE',
            description:
                'Guests/participants are from one country excluding the Philippines.',
        },
        {
            value: 'REGIONAL PHILIPPINES',
            label: 'REGIONAL PHILIPPINES',
            description:
                'Participants are from within a region of the Philippines.',
        },
        {
            value: 'NATIONAL',
            label: 'NATIONAL',
            description:
                'Participants are from two or more regions of the Philippines.',
        },
    ];
    const eventTypes = options.eventTypes || [
        { value: 'MEETINGS', label: 'MEETINGS' },
        { value: 'INCENTIVE TRAVEL', label: 'INCENTIVE TRAVEL' },
        { value: 'CONVENTIONS', label: 'CONVENTIONS' },
        { value: 'EXHIBITS', label: 'EXHIBITS' },
        {
            value: 'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS',
            label: 'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS',
        },
    ];
    const countryOptions = options.countryOptions ||
        options.countries || [
            'Philippines',
            'United States of America',
            'Japan',
            'Republic of Korea',
            'China',
        ];
    const organizerTypes = options.organizerTypes || [
        'Private',
        'Government',
        'NGO',
        'Academe',
        'Religious',
        'Corporate',
        'Association',
        'Other',
    ];
    const enterpriseGroups = options.enterpriseGroups || [
        'PTE',
        'STE',
        'UNCLASSIFIED',
    ];

    const initialScope = first(
        record?.event_scope,
        defaults.event_scope,
        'public',
    )
        .toLowerCase()
        .includes('private')
        ? 'private'
        : 'public';

    const { data, setData, post, processing, errors } = useForm<MiceFormData>({
        event_scope: initialScope as 'public' | 'private',
        year_recorded: first(
            record?.year_recorded,
            defaults.year_recorded,
            new Date().getFullYear(),
        ),
        enterprise_group: first(record?.enterprise_group, 'UNCLASSIFIED'),
        btc_group_code: first(record?.btc_group_code),
        event_center_name: first(
            record?.event_center_name,
            defaults.event_center_name,
            'BAGUIO CONVENTION AND CULTURAL CENTER',
        ),
        function_halls_count: first(
            record?.function_halls_count,
            defaults.function_halls_count,
            1,
        ),
        function_hall_capacity: first(
            record?.function_hall_capacity,
            defaults.function_hall_capacity,
            2000,
        ),
        covered_month: first(record?.covered_month, defaults.covered_month),
        event_started_at: first(
            record?.event_started_at,
            defaults.event_started_at,
            defaults.event_date_from,
        ),
        event_finished_at: first(
            record?.event_finished_at,
            defaults.event_finished_at,
            defaults.event_date_to,
        ),
        number_of_hours: first(
            record?.number_of_hours,
            defaults.number_of_hours,
            10,
        ),
        event_name: upper(first(record?.event_name, defaults.event_name)),
        event_category: first(
            record?.event_category,
            record?.classification_of_event,
            defaults.event_category,
            defaults.classification_of_event,
            'REGIONAL PHILIPPINES',
        ),
        classification_of_event: first(
            record?.classification_of_event,
            defaults.classification_of_event,
            'REGIONAL PHILIPPINES',
        ),
        type_of_event: first(
            record?.type_of_event,
            record?.mice_type_of_event,
            defaults.type_of_event,
            defaults.mice_type_of_event,
            'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS',
        ),
        mice_type_of_event: first(
            record?.mice_type_of_event,
            defaults.mice_type_of_event,
            'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS',
        ),
        venue_area: first(record?.venue_area, defaults.venue_area),
        event_date_from: first(
            record?.event_date_from,
            defaults.event_date_from,
        ),
        event_date_to: first(record?.event_date_to, defaults.event_date_to),
        organization_name: upper(
            first(record?.organization_name, defaults.organization_name),
        ),
        organizer_organization_name: upper(
            first(
                record?.organizer_organization_name,
                defaults.organizer_organization_name,
                defaults.organization_name,
            ),
        ),
        organizer_name: upper(
            first(record?.organizer_name, defaults.organizer_name),
        ),
        organizer_type: first(
            record?.organizer_type,
            defaults.organizer_type,
            'Private',
        ),
        contact_person: upper(
            first(record?.contact_person, defaults.contact_person),
        ),
        organizer_contact_person: upper(
            first(
                record?.organizer_contact_person,
                defaults.organizer_contact_person,
                defaults.contact_person,
            ),
        ),
        contact_number: digits(
            first(record?.contact_number, defaults.contact_number),
        ),
        organizer_contact_number: digits(
            first(
                record?.organizer_contact_number,
                defaults.organizer_contact_number,
                defaults.contact_number,
            ),
        ),
        email: first(record?.email, defaults.email),
        address: upper(first(record?.address, defaults.address)),
        organizer_address: upper(
            first(
                record?.organizer_address,
                defaults.organizer_address,
                defaults.address,
            ),
        ),
        domestic_attendees: first(
            record?.domestic_attendees,
            defaults.domestic_attendees,
            defaults.total_participants,
            0,
        ),
        foreign_attendees: first(
            record?.foreign_attendees,
            defaults.foreign_attendees,
            0,
        ),
        total_number_of_countries: first(
            record?.total_number_of_countries,
            defaults.total_number_of_countries,
            1,
        ),
        countries_breakdown: Array.isArray(record?.countries_breakdown)
            ? (record?.countries_breakdown as CountryRow[])
            : [
                  {
                      country: 'Philippines',
                      count: first(defaults.total_participants, 0),
                  },
              ],
        has_exhibitions: Boolean(
            record?.has_exhibitions ?? defaults.has_exhibitions ?? false,
        ),
        exhibitors_count: first(
            record?.exhibitors_count,
            defaults.exhibitors_count,
            0,
        ),
        visitors_count: first(
            record?.visitors_count,
            defaults.visitors_count,
            0,
        ),
        local_male_participants: first(record?.local_male_participants, 0),
        local_female_participants: first(record?.local_female_participants, 0),
        domestic_male_participants: first(
            record?.domestic_male_participants,
            0,
        ),
        domestic_female_participants: first(
            record?.domestic_female_participants,
            0,
        ),
        foreign_male_participants: first(record?.foreign_male_participants, 0),
        foreign_female_participants: first(
            record?.foreign_female_participants,
            0,
        ),
        total_participants: first(
            record?.total_participants,
            defaults.total_participants,
            0,
        ),
        main_origin_country: first(record?.main_origin_country, 'Philippines'),
        main_origin_province: first(record?.main_origin_province),
        main_origin_city: first(record?.main_origin_city),
        same_day_visitors: first(record?.same_day_visitors, 0),
        overnight_visitors: first(record?.overnight_visitors, 0),
        estimated_room_nights: first(record?.estimated_room_nights, 0),
        estimated_tourism_receipts: first(
            record?.estimated_tourism_receipts,
            0,
        ),
        total_employees: first(record?.total_employees, 0),
        female_employees: first(record?.female_employees, 0),
        male_employees: first(record?.male_employees, 0),
        permit_to_engage: Boolean(record?.permit_to_engage ?? false),
        dot_accredited: Boolean(record?.dot_accredited ?? false),
        active_member: Boolean(record?.active_member ?? false),
        comments_feedback: first(
            record?.comments_feedback,
            record?.remarks,
            'N/A',
        ),
        remarks: first(record?.remarks, record?.comments_feedback, 'N/A'),
        certified: Boolean(record?.submitted_at),
    });

    const isPublic = data.event_scope === 'public';
    const totalParticipants = useMemo(
        () =>
            Math.max(
                numberValue(data.total_participants),
                numberValue(data.domestic_attendees) +
                    numberValue(data.foreign_attendees),
            ),
        [
            data.total_participants,
            data.domestic_attendees,
            data.foreign_attendees,
        ],
    );
    const isSubmitted = Boolean(record?.submitted_at);

    function updateScope(scope: 'public' | 'private') {
        setData({
            ...data,
            event_scope: scope,
            event_category:
                scope === 'public'
                    ? data.event_category === '-'
                        ? 'REGIONAL PHILIPPINES'
                        : data.event_category
                    : '-',
            classification_of_event:
                scope === 'public'
                    ? data.classification_of_event === '-'
                        ? 'REGIONAL PHILIPPINES'
                        : data.classification_of_event
                    : '-',
            mice_type_of_event:
                scope === 'public'
                    ? data.mice_type_of_event === '-'
                        ? 'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS'
                        : data.mice_type_of_event
                    : '-',
            has_exhibitions: scope === 'public' ? data.has_exhibitions : false,
            exhibitors_count: scope === 'public' ? data.exhibitors_count : '0',
            visitors_count: scope === 'public' ? data.visitors_count : '0',
        });
    }

    function setCountry(index: number, patch: Partial<CountryRow>) {
        setData(
            'countries_breakdown',
            data.countries_breakdown.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...patch } : row,
            ),
        );
    }

    function addCountry() {
        setData('countries_breakdown', [
            ...data.countries_breakdown,
            { country: '', count: '0' },
        ]);
    }

    function removeCountry(index: number) {
        setData(
            'countries_breakdown',
            data.countries_breakdown.filter(
                (_, rowIndex) => rowIndex !== index,
            ),
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!booking?.id) return;
        post(bookingSurveyPath(role, booking.id), { preserveScroll: true });
    }

    if (!booking) {
        return (
            <BookingRolePageShell
                role={role}
                title="MICE Report"
                description="Booking record could not be loaded."
            >
                <Link href="/my-bookings" className="booking-ghost-action">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>
            </BookingRolePageShell>
        );
    }

    return (
        <BookingRolePageShell
            role={role}
            title="Contact Details and MICE Report"
            description={`${booking.type_of_event || 'Booking'} · ${booking.company_name || booking.client_name || 'Client'}`}
            actions={
                <Link
                    href={bookingShowPath(role, booking.id)}
                    className="booking-ghost-action"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Booking
                </Link>
            }
        >
            <form onSubmit={submit} className="mice-survey-page">
                <section className="mice-survey-hero">
                    <div>
                        <p className="mice-survey-kicker">
                            <Sparkles className="h-4 w-4" /> Built-in booking
                            report
                        </p>
                        <h2>
                            Complete the organizer, event, and MICE details.
                        </h2>
                        <span>
                            This replaces the old external survey/email
                            requirement. Records stay as draft until the booking
                            is confirmed, then become official MICE registry
                            data.
                        </span>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <BookingStatusBadge
                                value={booking.booking_status}
                            />
                            <BookingStatusBadge
                                value={booking.payment_status}
                                compact
                            />
                            <span className="mice-survey-chip">
                                {formatDateTime(booking.booking_date_from)}
                            </span>
                            <span className="mice-survey-chip">
                                {formatDateTime(booking.booking_date_to)}
                            </span>
                        </div>
                    </div>
                    <div className="mice-survey-status-card">
                        <FileSpreadsheet className="h-10 w-10 text-[var(--bccc-backend-gold)]" />
                        <p>MICE Status</p>
                        <strong>
                            {isSubmitted
                                ? cleanLabel(record?.status || 'Submitted')
                                : 'Draft Required'}
                        </strong>
                        <span>
                            {isSubmitted
                                ? `Record No. ${record?.record_no || '—'} · ${record?.year_recorded || data.year_recorded}`
                                : 'Finalized only after booking confirmation.'}
                        </span>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Event Scope"
                        value={isPublic ? 'PUBLIC' : 'PRIVATE'}
                        icon={ShieldCheck}
                        tone={isPublic ? 'green' : 'gold'}
                    />
                    <StatCard
                        label="Participants"
                        value={totalParticipants}
                        icon={Users}
                        tone={totalParticipants > 0 ? 'green' : 'red'}
                    />
                    <StatCard
                        label="Venue Area"
                        value={data.venue_area || '—'}
                        icon={MapPin}
                    />
                    <StatCard
                        label="Total Hours"
                        value={data.number_of_hours || '—'}
                        icon={CalendarDays}
                    />
                </div>

                <section className="mice-survey-panel">
                    <header className="mice-survey-section-header">
                        <div>
                            <p>Event Scope</p>
                            <h3>Choose what the event requires</h3>
                        </div>
                        <ShieldCheck className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
                    </header>
                    <div className="grid gap-3 md:grid-cols-2">
                        {(['public', 'private'] as const).map((scope) => (
                            <button
                                type="button"
                                key={scope}
                                onClick={() => updateScope(scope)}
                                className={cx(
                                    'rounded-2xl border p-4 text-left transition',
                                    data.event_scope === scope
                                        ? 'border-amber-500 bg-amber-50 shadow-sm dark:bg-amber-500/10'
                                        : 'border-slate-200 hover:border-amber-300 dark:border-white/10',
                                )}
                            >
                                <strong className="block tracking-[0.16em] uppercase">
                                    {scope === 'public'
                                        ? 'PUBLIC EVENT'
                                        : 'PRIVATE / PERSONAL EVENT'}
                                </strong>
                                <span className="mt-1 block text-sm text-slate-500">
                                    {scope === 'public'
                                        ? 'Requires full MICE classification, attendee, country, and exhibition information.'
                                        : 'Skips public MICE statistical fields and records them as not applicable.'}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="mice-survey-panel">
                    <header className="mice-survey-section-header">
                        <div>
                            <p>Fixed BCCC Details</p>
                            <h3>System-generated official fields</h3>
                        </div>
                        <Building2 className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
                    </header>
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Field label="Name of Event Center">
                            <input
                                readOnly
                                value={data.event_center_name}
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field label="No. of Function Halls">
                            <input
                                readOnly
                                value={
                                    isPublic ? data.function_halls_count : '—'
                                }
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field label="Function Hall Capacity">
                            <input
                                readOnly
                                value={
                                    isPublic ? data.function_hall_capacity : '—'
                                }
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field label="Covered Month">
                            <input
                                readOnly
                                value={data.covered_month}
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field label="Event Started">
                            <input
                                readOnly
                                value={dateOnly(
                                    data.event_started_at ||
                                        data.event_date_from,
                                )}
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field label="Event Finished">
                            <input
                                readOnly
                                value={dateOnly(
                                    data.event_finished_at ||
                                        data.event_date_to,
                                )}
                                className="backend-booking-input"
                            />
                        </Field>
                    </div>
                </section>

                <section className="mice-survey-panel">
                    <header className="mice-survey-section-header">
                        <div>
                            <p>Event Information</p>
                            <h3>Name, type, dates, and classification</h3>
                        </div>
                        <CalendarDays className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
                    </header>
                    {isPublic ? (
                        <NoticeList
                            title="Classification guide"
                            options={eventCategories}
                        />
                    ) : null}
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <Field
                            label="Event Name"
                            required
                            error={errors.event_name}
                        >
                            <input
                                value={data.event_name}
                                onChange={(e) =>
                                    setData('event_name', upper(e.target.value))
                                }
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field
                            label="Venue Area"
                            required
                            error={errors.venue_area}
                        >
                            <input
                                value={data.venue_area}
                                onChange={(e) =>
                                    setData('venue_area', e.target.value)
                                }
                                className="backend-booking-input"
                            />
                        </Field>
                        {isPublic ? (
                            <>
                                <Field
                                    label="Classification of Event"
                                    required
                                    error={
                                        errors.classification_of_event ||
                                        errors.event_category
                                    }
                                >
                                    <select
                                        value={data.classification_of_event}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                classification_of_event:
                                                    e.target.value,
                                                event_category: e.target.value,
                                            })
                                        }
                                        className="backend-booking-input"
                                    >
                                        {eventCategories.map((option) => (
                                            <option
                                                key={optionValue(option)}
                                                value={optionValue(option)}
                                            >
                                                {optionLabel(option)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field
                                    label="Type of Event"
                                    required
                                    error={
                                        errors.mice_type_of_event ||
                                        errors.type_of_event
                                    }
                                >
                                    <select
                                        value={data.mice_type_of_event}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                mice_type_of_event:
                                                    e.target.value,
                                                type_of_event: e.target.value,
                                            })
                                        }
                                        className="backend-booking-input"
                                    >
                                        {eventTypes.map((option) => (
                                            <option
                                                key={optionValue(option)}
                                                value={optionValue(option)}
                                            >
                                                {optionLabel(option)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </>
                        ) : (
                            <Field
                                label="Private Event Type"
                                required
                                error={errors.type_of_event}
                            >
                                <input
                                    value={data.type_of_event}
                                    onChange={(e) =>
                                        setData(
                                            'type_of_event',
                                            upper(e.target.value),
                                        )
                                    }
                                    className="backend-booking-input"
                                />
                            </Field>
                        )}
                        <Field
                            label="Event Date From"
                            required
                            error={errors.event_date_from}
                        >
                            <input
                                type="date"
                                value={dateOnly(data.event_date_from)}
                                onChange={(e) =>
                                    setData('event_date_from', e.target.value)
                                }
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field
                            label="Event Date To"
                            required
                            error={errors.event_date_to}
                        >
                            <input
                                type="date"
                                value={dateOnly(data.event_date_to)}
                                onChange={(e) =>
                                    setData('event_date_to', e.target.value)
                                }
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field
                            label="Number of Hours"
                            required
                            error={errors.number_of_hours}
                        >
                            <input
                                value={data.number_of_hours}
                                onChange={(e) =>
                                    setData('number_of_hours', e.target.value)
                                }
                                className="backend-booking-input"
                                inputMode="decimal"
                            />
                        </Field>
                    </div>
                </section>

                <section className="mice-survey-panel">
                    <header className="mice-survey-section-header">
                        <div>
                            <p>Organizer Information</p>
                            <h3>Organization and contact details</h3>
                        </div>
                        <Building2 className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
                    </header>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Field
                            label="Name of Organization of the Organizer"
                            required
                            error={
                                errors.organizer_organization_name ||
                                errors.organization_name
                            }
                        >
                            <input
                                value={data.organizer_organization_name}
                                onChange={(e) =>
                                    setData({
                                        ...data,
                                        organizer_organization_name: upper(
                                            e.target.value,
                                        ),
                                        organization_name: upper(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field
                            label="Organizer Type"
                            error={errors.organizer_type}
                        >
                            <select
                                value={data.organizer_type}
                                onChange={(e) =>
                                    setData('organizer_type', e.target.value)
                                }
                                className="backend-booking-input"
                            >
                                {organizerTypes.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field
                            label="Contact Person of the Organizer"
                            required
                            error={
                                errors.organizer_contact_person ||
                                errors.contact_person
                            }
                        >
                            <input
                                value={data.organizer_contact_person}
                                onChange={(e) =>
                                    setData({
                                        ...data,
                                        organizer_contact_person: upper(
                                            e.target.value,
                                        ),
                                        contact_person: upper(e.target.value),
                                    })
                                }
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field
                            label="Contact Number of the Organizer"
                            error={
                                errors.organizer_contact_number ||
                                errors.contact_number
                            }
                        >
                            <input
                                value={data.organizer_contact_number}
                                onChange={(e) =>
                                    setData({
                                        ...data,
                                        organizer_contact_number: digits(
                                            e.target.value,
                                        ),
                                        contact_number: digits(e.target.value),
                                    })
                                }
                                className="backend-booking-input"
                                inputMode="tel"
                            />
                        </Field>
                        <Field label="Email" error={errors.email}>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field
                            label="Address of the Organizer"
                            required
                            error={errors.organizer_address || errors.address}
                        >
                            <textarea
                                value={data.organizer_address}
                                onChange={(e) =>
                                    setData({
                                        ...data,
                                        organizer_address: upper(
                                            e.target.value,
                                        ),
                                        address: upper(e.target.value),
                                    })
                                }
                                className="backend-booking-input min-h-24 py-3"
                            />
                        </Field>
                    </div>
                </section>

                {isPublic ? (
                    <section className="mice-survey-panel">
                        <header className="mice-survey-section-header">
                            <div>
                                <p>MICE Attendees</p>
                                <h3>
                                    Domestic, foreign, country, and exhibition
                                    data
                                </h3>
                            </div>
                            <Globe2 className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
                        </header>
                        <div className="grid gap-4 lg:grid-cols-3">
                            <Field
                                label="Number of Attendees - Domestic"
                                required
                                error={errors.domestic_attendees}
                            >
                                <input
                                    value={data.domestic_attendees}
                                    onChange={(e) =>
                                        setData(
                                            'domestic_attendees',
                                            e.target.value,
                                        )
                                    }
                                    className="backend-booking-input"
                                    inputMode="numeric"
                                />
                            </Field>
                            <Field
                                label="Number of Attendees - Foreign"
                                required
                                error={errors.foreign_attendees}
                            >
                                <input
                                    value={data.foreign_attendees}
                                    onChange={(e) =>
                                        setData(
                                            'foreign_attendees',
                                            e.target.value,
                                        )
                                    }
                                    className="backend-booking-input"
                                    inputMode="numeric"
                                />
                            </Field>
                            <Field
                                label="Total Number of Countries"
                                required
                                error={errors.total_number_of_countries}
                            >
                                <input
                                    value={data.total_number_of_countries}
                                    onChange={(e) =>
                                        setData(
                                            'total_number_of_countries',
                                            e.target.value,
                                        )
                                    }
                                    className="backend-booking-input"
                                    inputMode="numeric"
                                />
                            </Field>
                        </div>
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <strong className="text-sm tracking-[0.18em] uppercase">
                                    Breakdown of Countries
                                </strong>
                                <button
                                    type="button"
                                    onClick={addCountry}
                                    className="booking-ghost-action"
                                >
                                    Add Country
                                </button>
                            </div>
                            {data.countries_breakdown.map((row, index) => (
                                <div
                                    key={`${row.country}-${index}`}
                                    className="grid gap-2 md:grid-cols-[1fr_140px_auto]"
                                >
                                    <select
                                        value={row.country}
                                        onChange={(e) =>
                                            setCountry(index, {
                                                country: e.target.value,
                                            })
                                        }
                                        className="backend-booking-input"
                                    >
                                        {countryOptions.map((option) => (
                                            <option
                                                key={optionValue(option)}
                                                value={optionValue(option)}
                                            >
                                                {optionLabel(option)}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        value={row.count}
                                        onChange={(e) =>
                                            setCountry(index, {
                                                count: e.target.value,
                                            })
                                        }
                                        className="backend-booking-input"
                                        inputMode="numeric"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeCountry(index)}
                                        className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 px-3 text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 grid gap-4 lg:grid-cols-3">
                            <Field label="Exhibitions">
                                <select
                                    value={data.has_exhibitions ? 'yes' : 'no'}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            has_exhibitions:
                                                e.target.value === 'yes',
                                            exhibitors_count:
                                                e.target.value === 'yes'
                                                    ? data.exhibitors_count
                                                    : '0',
                                            visitors_count:
                                                e.target.value === 'yes'
                                                    ? data.visitors_count
                                                    : '0',
                                        })
                                    }
                                    className="backend-booking-input"
                                >
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                </select>
                            </Field>
                            <Field
                                label="No. of Exhibitors"
                                required={data.has_exhibitions}
                                error={errors.exhibitors_count}
                            >
                                <input
                                    value={
                                        data.has_exhibitions
                                            ? data.exhibitors_count
                                            : '0'
                                    }
                                    disabled={!data.has_exhibitions}
                                    onChange={(e) =>
                                        setData(
                                            'exhibitors_count',
                                            e.target.value,
                                        )
                                    }
                                    className="backend-booking-input"
                                    inputMode="numeric"
                                />
                            </Field>
                            <Field
                                label="No. of Visitors"
                                required={data.has_exhibitions}
                                error={errors.visitors_count}
                            >
                                <input
                                    value={
                                        data.has_exhibitions
                                            ? data.visitors_count
                                            : '0'
                                    }
                                    disabled={!data.has_exhibitions}
                                    onChange={(e) =>
                                        setData(
                                            'visitors_count',
                                            e.target.value,
                                        )
                                    }
                                    className="backend-booking-input"
                                    inputMode="numeric"
                                />
                            </Field>
                        </div>
                    </section>
                ) : null}

                <section className="mice-survey-panel">
                    <header className="mice-survey-section-header">
                        <div>
                            <p>Optional Registry Details</p>
                            <h3>
                                Additional tourism and enterprise indicators
                            </h3>
                        </div>
                        <ReceiptText className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
                    </header>
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Field
                            label="Enterprise Group"
                            error={errors.enterprise_group}
                        >
                            <select
                                value={data.enterprise_group}
                                onChange={(e) =>
                                    setData('enterprise_group', e.target.value)
                                }
                                className="backend-booking-input"
                            >
                                {enterpriseGroups.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field
                            label="Main Origin Country"
                            error={errors.main_origin_country}
                        >
                            <select
                                value={data.main_origin_country}
                                onChange={(e) =>
                                    setData(
                                        'main_origin_country',
                                        e.target.value,
                                    )
                                }
                                className="backend-booking-input"
                            >
                                {countryOptions.map((option) => (
                                    <option
                                        key={optionValue(option)}
                                        value={optionValue(option)}
                                    >
                                        {optionLabel(option)}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field
                            label="Main Origin Province"
                            error={errors.main_origin_province}
                        >
                            <input
                                value={data.main_origin_province}
                                onChange={(e) =>
                                    setData(
                                        'main_origin_province',
                                        e.target.value,
                                    )
                                }
                                className="backend-booking-input"
                            />
                        </Field>
                        <Field
                            label="Same-Day Visitors"
                            error={errors.same_day_visitors}
                        >
                            <input
                                value={data.same_day_visitors}
                                onChange={(e) =>
                                    setData('same_day_visitors', e.target.value)
                                }
                                className="backend-booking-input"
                                inputMode="numeric"
                            />
                        </Field>
                        <Field
                            label="Overnight Visitors"
                            error={errors.overnight_visitors}
                        >
                            <input
                                value={data.overnight_visitors}
                                onChange={(e) =>
                                    setData(
                                        'overnight_visitors',
                                        e.target.value,
                                    )
                                }
                                className="backend-booking-input"
                                inputMode="numeric"
                            />
                        </Field>
                        <Field
                            label="Estimated Tourism Receipts"
                            error={errors.estimated_tourism_receipts}
                        >
                            <input
                                value={data.estimated_tourism_receipts}
                                onChange={(e) =>
                                    setData(
                                        'estimated_tourism_receipts',
                                        e.target.value,
                                    )
                                }
                                className="backend-booking-input"
                                inputMode="decimal"
                            />
                        </Field>
                    </div>
                </section>

                <section className="mice-survey-panel">
                    <header className="mice-survey-section-header">
                        <div>
                            <p>Confirmation</p>
                            <h3>Final read-and-agree notice</h3>
                        </div>
                        <CheckCircle2 className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
                    </header>
                    <Field
                        label="Comment / Feedback"
                        error={errors.comments_feedback || errors.remarks}
                    >
                        <textarea
                            value={data.comments_feedback}
                            onChange={(e) =>
                                setData({
                                    ...data,
                                    comments_feedback: e.target.value,
                                    remarks: e.target.value,
                                })
                            }
                            className="backend-booking-input min-h-28 py-3"
                            placeholder="N/A"
                        />
                    </Field>
                    <label
                        className={cx(
                            'mice-survey-certification',
                            errors.certified && 'has-error',
                        )}
                    >
                        <input
                            type="checkbox"
                            checked={data.certified}
                            onChange={(e) =>
                                setData('certified', e.target.checked)
                            }
                        />
                        <span>
                            <strong>
                                I confirm that I have read and agree to the BCCC
                                booking report notice.
                            </strong>
                            <small>
                                The details will be saved as draft while the
                                booking is not yet confirmed and finalized once
                                the booking is accepted/confirmed.
                            </small>
                        </span>
                    </label>
                    {errors.certified ? (
                        <div className="mice-survey-warning">
                            <AlertTriangle className="h-5 w-5" />
                            <span>{errors.certified}</span>
                        </div>
                    ) : null}
                    <footer className="mice-survey-submit-row">
                        <div>
                            <p>
                                {isSubmitted
                                    ? 'Updating saved contact/MICE details'
                                    : 'Ready to save draft details'}
                            </p>
                            <span>
                                {isSubmitted
                                    ? `Current status: ${cleanLabel(record?.status || 'draft')}`
                                    : 'Submit button is enabled only after the confirmation checkbox is checked.'}
                            </span>
                        </div>
                        <button
                            type="submit"
                            disabled={processing || !data.certified}
                            className="booking-primary-action"
                        >
                            {processing ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="h-4 w-4" />
                            )}
                            Save Contact / MICE Details
                        </button>
                    </footer>
                </section>
            </form>
        </BookingRolePageShell>
    );
}
