import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    ClipboardList,
    Mail,
    MapPin,
    Save,
    UsersRound,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { notifyError, notifySuccess } from '@/components/shared/app-notice-center';

type GenericRecord = {
    id?: number | string;
    booking_id?: number | string | null;
    year_recorded?: number | string | null;
    enterprise_group?: string | null;
    btc_group_code?: string | null;
    event_name?: string | null;
    event_category?: string | null;
    type_of_event?: string | null;
    venue_area?: string | null;
    event_date_from?: string | null;
    event_date_to?: string | null;
    organization_name?: string | null;
    organizer_name?: string | null;
    organizer_type?: string | null;
    contact_person?: string | null;
    contact_number?: string | null;
    email?: string | null;
    address?: string | null;
    local_male_participants?: number | string | null;
    local_female_participants?: number | string | null;
    domestic_male_participants?: number | string | null;
    domestic_female_participants?: number | string | null;
    foreign_male_participants?: number | string | null;
    foreign_female_participants?: number | string | null;
    main_origin_country?: string | null;
    main_origin_province?: string | null;
    main_origin_city?: string | null;
    same_day_visitors?: number | string | null;
    overnight_visitors?: number | string | null;
    estimated_room_nights?: number | string | null;
    estimated_tourism_receipts?: number | string | null;
    total_employees?: number | string | null;
    female_employees?: number | string | null;
    male_employees?: number | string | null;
    permit_to_engage?: boolean | number | string | null;
    dot_accredited?: boolean | number | string | null;
    active_member?: boolean | number | string | null;
    remarks?: string | null;
    status?: string | null;
    establishment_name?: string | null;
    [key: string]: unknown;
};

type PageProps = {
    record?: GenericRecord | null;
    miceRecord?: GenericRecord | null;
    booking?: GenericRecord | null;
    submitUrl?: string;
    backUrl?: string;
    method?: 'post' | 'put' | 'patch';
    errors?: Record<string, string>;
};

const EVENT_CATEGORY_OPTIONS = [
    'Convention',
    'Meeting',
    'Incentive Travel',
    'Conference',
    'Exhibition',
    'Summit',
    'Seminar',
    'Workshop',
    'Cultural Event',
    'Government Program',
    'Private Event',
    'Other',
];

const ORGANIZER_TYPE_OPTIONS = [
    'Private',
    'Government',
    'Academe',
    'Association',
    'Corporate',
    'NGO',
    'Religious',
    'Other',
];

const VENUE_AREA_OPTIONS = [
    'Full Hall',
    'Main Hall',
    'Foyer & Lobby Area',
    'VIP Lounge',
    'Board Room',
    'Basement',
    'Gallery2600',
    'Grounds & Parking',
    'Other',
];

function str(value: unknown, fallback = '') {
    if (value === null || value === undefined) {
        return fallback;
    }

    return String(value);
}

function dateOnly(value: unknown) {
    const raw = str(value);

    if (!raw) {
        return '';
    }

    return raw.slice(0, 10);
}

function boolValue(value: unknown) {
    return value === true || value === 1 || value === '1' || value === 'true';
}

export default function MiceRegistryFormPage() {
    const { props } = usePage<PageProps>();

    const record = props.record ?? props.miceRecord ?? {};
    const booking = props.booking ?? {};
    const backUrl = props.backUrl ?? '/admin/reports/mice-registry';
    const submitUrl = props.submitUrl ?? window.location.pathname;
    const method = props.method ?? (record?.id ? 'put' : 'post');

    const form = useForm({
        booking_id: str(record.booking_id ?? booking.id ?? ''),
        year_recorded: str(record.year_recorded ?? new Date().getFullYear()),
        enterprise_group: str(record.enterprise_group ?? 'UNCLASSIFIED'),
        btc_group_code: str(record.btc_group_code ?? ''),

        establishment_name: str(
            record.establishment_name ??
                record.organization_name ??
                booking.company_name ??
                booking.client_name ??
                '',
        ),

        event_name: str(record.event_name ?? booking.type_of_event ?? ''),
        event_category: str(record.event_category ?? 'Convention'),
        type_of_event: str(record.type_of_event ?? booking.type_of_event ?? ''),
        venue_area: str(record.venue_area ?? booking.venue_area ?? ''),
        event_date_from: dateOnly(record.event_date_from ?? booking.booking_date_from),
        event_date_to: dateOnly(record.event_date_to ?? booking.booking_date_to),

        organization_name: str(record.organization_name ?? booking.company_name ?? ''),
        organizer_name: str(record.organizer_name ?? booking.client_name ?? ''),
        organizer_type: str(record.organizer_type ?? booking.organization_type ?? 'Private'),
        contact_person: str(record.contact_person ?? booking.client_name ?? ''),
        contact_number: str(record.contact_number ?? booking.client_contact_number ?? ''),
        email: str(record.email ?? booking.client_email ?? ''),
        address: str(record.address ?? booking.client_address ?? booking.client_street_address ?? ''),

        local_male_participants: str(record.local_male_participants ?? '0'),
        local_female_participants: str(record.local_female_participants ?? '0'),
        domestic_male_participants: str(record.domestic_male_participants ?? '0'),
        domestic_female_participants: str(record.domestic_female_participants ?? '0'),
        foreign_male_participants: str(record.foreign_male_participants ?? '0'),
        foreign_female_participants: str(record.foreign_female_participants ?? '0'),

        main_origin_country: str(record.main_origin_country ?? 'Philippines'),
        main_origin_province: str(record.main_origin_province ?? 'Benguet'),
        main_origin_city: str(record.main_origin_city ?? 'Baguio City'),

        same_day_visitors: str(record.same_day_visitors ?? '0'),
        overnight_visitors: str(record.overnight_visitors ?? '0'),
        estimated_room_nights: str(record.estimated_room_nights ?? '0'),
        estimated_tourism_receipts: str(record.estimated_tourism_receipts ?? '0'),

        total_employees: str(record.total_employees ?? '0'),
        female_employees: str(record.female_employees ?? '0'),
        male_employees: str(record.male_employees ?? '0'),

        permit_to_engage: boolValue(record.permit_to_engage),
        dot_accredited: boolValue(record.dot_accredited),
        active_member: boolValue(record.active_member),

        remarks: str(record.remarks ?? ''),
        status: str(record.status ?? 'submitted'),
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        const successMessage =
            method === 'put' || method === 'patch'
                ? 'MICE registry record updated successfully.'
                : 'MICE registry record saved successfully.';

        const errorMessage =
            method === 'put' || method === 'patch'
                ? 'Unable to update the MICE registry record. Please check the required fields.'
                : 'Unable to save the MICE registry record. Please check the required fields.';

        if (method === 'put' || method === 'patch') {
            form.transform((data) => ({
                ...data,
                _method: method.toUpperCase(),
            }));

            form.post(submitUrl, {
                preserveScroll: true,
                onSuccess: () => {
                    notifySuccess(successMessage, 'Saved successfully');
                },
                onError: () => {
                    notifyError(errorMessage, 'Save failed');
                },
            });

            return;
        }

        form.post(submitUrl, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(successMessage, 'Saved successfully');
            },
            onError: () => {
                notifyError(errorMessage, 'Save failed');
            },
        });
    }

    const totalParticipants =
        Number(form.data.local_male_participants || 0) +
        Number(form.data.local_female_participants || 0) +
        Number(form.data.domestic_male_participants || 0) +
        Number(form.data.domestic_female_participants || 0) +
        Number(form.data.foreign_male_participants || 0) +
        Number(form.data.foreign_female_participants || 0);

    return (
        <ResourcePageShell
            title={record?.id ? 'Edit MICE Registry Record' : 'Create MICE Registry Record'}
            description="Encode the official MICE registry details inside the backend workspace so the sidebar, navbar, breadcrumbs, and role shell stay consistent."
            eyebrow="Reports / MICE Registry"
            icon={ClipboardList}
            breadcrumbs={[
                { title: 'Reports', href: backUrl },
                { title: 'MICE Registry', href: backUrl },
                { title: record?.id ? 'Edit Record' : 'Create Record', href: submitUrl },
            ]}
            actions={
                <Link
                    href={backUrl}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d9c7a6] bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#fffaf0] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to MICE Registry
                </Link>
            }
        >
            <div className="mx-auto max-w-7xl">
                    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <Link
                                href={backUrl}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d9c7a6] bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#fffaf0] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to MICE Registry
                            </Link>

                            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                Reports / MICE Registry
                            </p>

                            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[#21180d] dark:text-white">
                                {record?.id ? 'Edit MICE Registry Record' : 'Create MICE Registry Record'}
                            </h1>

                            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6e604c] dark:text-white/58">
                                Fill in the event, visitor, participant, and tourism receipt details. This form includes the required establishment name field to match your database.
                            </p>
                        </div>

                        <div className="grid gap-2 rounded-[1.2rem] border border-[#d9c7a6]/70 bg-white/78 p-4 shadow-[0_16px_45px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.055]">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                Total Participants
                            </p>
                            <p className="text-3xl font-semibold tracking-[-0.05em]">
                                {totalParticipants.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {Object.keys(form.errors).length > 0 ? (
                        <div className="mb-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                            <p>Please fix the following fields:</p>
                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                {Object.entries(form.errors).map(([field, error]) => (
                                    <li key={field}>
                                        {field}: {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    <form onSubmit={submit} className="grid gap-5">
                        <FormSection
                            icon={Building2}
                            title="Event and Establishment Details"
                            description="Main MICE report identification details."
                        >
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <Field label="Booking ID" value={form.data.booking_id} onChange={(value) => form.setData('booking_id', value)} />
                                <Field label="Year Recorded" value={form.data.year_recorded} onChange={(value) => form.setData('year_recorded', value)} required />
                                <Field label="BTC Group Code" value={form.data.btc_group_code} onChange={(value) => form.setData('btc_group_code', value)} />

                                <Field label="Enterprise Group" value={form.data.enterprise_group} onChange={(value) => form.setData('enterprise_group', value)} required />
                                <Field label="Establishment Name" value={form.data.establishment_name} onChange={(value) => form.setData('establishment_name', value)} required />
                                <Field label="Organization Name" value={form.data.organization_name} onChange={(value) => form.setData('organization_name', value)} required />

                                <Field label="Event Name" value={form.data.event_name} onChange={(value) => form.setData('event_name', value)} required />
                                <SelectField label="Event Category" value={form.data.event_category} onChange={(value) => form.setData('event_category', value)} options={EVENT_CATEGORY_OPTIONS} />
                                <Field label="Type of Event" value={form.data.type_of_event} onChange={(value) => form.setData('type_of_event', value)} required />

                                <SelectField label="Venue Area" value={form.data.venue_area} onChange={(value) => form.setData('venue_area', value)} options={VENUE_AREA_OPTIONS} />
                                <Field label="Event Date From" type="date" value={form.data.event_date_from} onChange={(value) => form.setData('event_date_from', value)} required />
                                <Field label="Event Date To" type="date" value={form.data.event_date_to} onChange={(value) => form.setData('event_date_to', value)} required />
                            </div>
                        </FormSection>

                        <FormSection
                            icon={Mail}
                            title="Organizer and Contact Details"
                            description="Client, organizer, and contact information."
                        >
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <Field label="Organizer Name" value={form.data.organizer_name} onChange={(value) => form.setData('organizer_name', value)} required />
                                <SelectField label="Organizer Type" value={form.data.organizer_type} onChange={(value) => form.setData('organizer_type', value)} options={ORGANIZER_TYPE_OPTIONS} />
                                <Field label="Contact Person" value={form.data.contact_person} onChange={(value) => form.setData('contact_person', value)} required />
                                <Field label="Contact Number" value={form.data.contact_number} onChange={(value) => form.setData('contact_number', value)} required />
                                <Field label="Email" type="email" value={form.data.email} onChange={(value) => form.setData('email', value)} required />
                                <Field label="Address" value={form.data.address} onChange={(value) => form.setData('address', value)} />
                            </div>
                        </FormSection>

                        <FormSection
                            icon={UsersRound}
                            title="Participants"
                            description="Participant count by visitor classification."
                        >
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <Field label="Local Male" type="number" value={form.data.local_male_participants} onChange={(value) => form.setData('local_male_participants', value)} />
                                <Field label="Local Female" type="number" value={form.data.local_female_participants} onChange={(value) => form.setData('local_female_participants', value)} />
                                <Field label="Domestic Male" type="number" value={form.data.domestic_male_participants} onChange={(value) => form.setData('domestic_male_participants', value)} />
                                <Field label="Domestic Female" type="number" value={form.data.domestic_female_participants} onChange={(value) => form.setData('domestic_female_participants', value)} />
                                <Field label="Foreign Male" type="number" value={form.data.foreign_male_participants} onChange={(value) => form.setData('foreign_male_participants', value)} />
                                <Field label="Foreign Female" type="number" value={form.data.foreign_female_participants} onChange={(value) => form.setData('foreign_female_participants', value)} />
                            </div>
                        </FormSection>

                        <FormSection
                            icon={MapPin}
                            title="Origin and Tourism Estimates"
                            description="Visitor origin and estimated tourism impact."
                        >
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <Field label="Main Origin Country" value={form.data.main_origin_country} onChange={(value) => form.setData('main_origin_country', value)} />
                                <Field label="Main Origin Province" value={form.data.main_origin_province} onChange={(value) => form.setData('main_origin_province', value)} />
                                <Field label="Main Origin City" value={form.data.main_origin_city} onChange={(value) => form.setData('main_origin_city', value)} />
                                <Field label="Same-Day Visitors" type="number" value={form.data.same_day_visitors} onChange={(value) => form.setData('same_day_visitors', value)} />
                                <Field label="Overnight Visitors" type="number" value={form.data.overnight_visitors} onChange={(value) => form.setData('overnight_visitors', value)} />
                                <Field label="Estimated Room Nights" type="number" value={form.data.estimated_room_nights} onChange={(value) => form.setData('estimated_room_nights', value)} />
                                <Field label="Estimated Tourism Receipts" type="number" value={form.data.estimated_tourism_receipts} onChange={(value) => form.setData('estimated_tourism_receipts', value)} />
                            </div>
                        </FormSection>

                        <FormSection
                            icon={ClipboardList}
                            title="Employees, Compliance, and Remarks"
                            description="Operational data and accreditation flags."
                        >
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <Field label="Total Employees" type="number" value={form.data.total_employees} onChange={(value) => form.setData('total_employees', value)} />
                                <Field label="Female Employees" type="number" value={form.data.female_employees} onChange={(value) => form.setData('female_employees', value)} />
                                <Field label="Male Employees" type="number" value={form.data.male_employees} onChange={(value) => form.setData('male_employees', value)} />

                                <CheckboxField label="Permit to Engage" checked={form.data.permit_to_engage} onChange={(value) => form.setData('permit_to_engage', value)} />
                                <CheckboxField label="DOT Accredited" checked={form.data.dot_accredited} onChange={(value) => form.setData('dot_accredited', value)} />
                                <CheckboxField label="Active Member" checked={form.data.active_member} onChange={(value) => form.setData('active_member', value)} />
                            </div>

                            <label className="mt-4 grid gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                    Remarks
                                </span>
                                <textarea
                                    value={form.data.remarks}
                                    onChange={(event) => form.setData('remarks', event.target.value)}
                                    rows={4}
                                    className="rounded-[1.1rem] border border-[#d9c7a6]/70 bg-white px-4 py-3 text-sm leading-7 text-[#21180d] outline-none transition focus:border-[#b08d48] dark:border-white/10 dark:bg-white/7 dark:text-white"
                                />
                            </label>
                        </FormSection>

                        <div className="sticky bottom-4 z-20 flex justify-end">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-7 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.25)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#17120b]"
                            >
                                {form.processing ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white dark:border-[#17120b]/30 dark:border-t-[#17120b]" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save MICE Record
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
        </ResourcePageShell>
    );
}

function FormSection({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: typeof Building2;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-[1.5rem] border border-[#d9c7a6]/70 bg-white/82 shadow-[0_18px_58px_rgba(47,37,23,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
            <div className="flex items-start gap-3 border-b border-[#eadcc2]/80 p-5 dark:border-white/10">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                    <Icon className="h-5 w-5" />
                </span>
                <div>
                    <h2 className="text-xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                        {description}
                    </p>
                </div>
            </div>

            <div className="p-5">{children}</div>
        </section>
    );
}

function Field({
    label,
    value,
    onChange,
    type = 'text',
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
}) {
    return (
        <label className="grid gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
                {required ? ' *' : ''}
            </span>
            <input
                type={type}
                value={value}
                required={required}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm text-[#21180d] outline-none transition placeholder:text-[#8a7a63] focus:border-[#b08d48] dark:border-white/10 dark:bg-white/7 dark:text-white dark:placeholder:text-white/42"
            />
        </label>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
}) {
    const isCustom = value !== '' && !options.includes(value);

    return (
        <div className="grid gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </span>

            <select
                value={isCustom ? '__other__' : value}
                onChange={(event) => {
                    if (event.target.value === '__other__') {
                        onChange('');
                        return;
                    }

                    onChange(event.target.value);
                }}
                className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm text-[#21180d] outline-none transition focus:border-[#b08d48] dark:border-white/10 dark:bg-[#161b22] dark:text-white"
            >
                <option value="">Select {label}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
                <option value="__other__">Other — type manually</option>
            </select>

            {(isCustom || value === '') && (
                <input
                    value={isCustom ? value : ''}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={`Type custom ${label.toLowerCase()}`}
                    className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm text-[#21180d] outline-none transition placeholder:text-[#8a7a63] focus:border-[#b08d48] dark:border-white/10 dark:bg-white/7 dark:text-white dark:placeholder:text-white/42"
                />
            )}
        </div>
    );
}

function CheckboxField({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex min-h-11 items-center gap-3 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] dark:border-white/10 dark:bg-white/7 dark:text-white">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-[#d9c7a6]"
            />
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {label}
        </label>
    );
}
