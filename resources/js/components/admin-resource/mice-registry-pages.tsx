import {
    ResourceActionLink,
    ResourceEmptyState,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
    ResourceToolbar,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    Edit3,
    FileSpreadsheet,
    Globe2,
    Mail,
    MapPin,
    Printer,
    ReceiptText,
    Search,
    ShieldCheck,
    Trash2,
    UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type MiceRecord = {
    id: number | string;
    booking_id?: number | string | null;
    booking_summary?: string | null;
    booking_status?: string | null;
    booking_payment_status?: string | null;
    record_no?: string | number | null;
    year_recorded?: string | number | null;
    enterprise_group?: string | null;
    btc_group_code?: string | null;

    establishment_name?: string | null;
    event_name?: string | null;
    event_category?: string | null;
    type_of_event?: string | null;
    venue_area?: string | null;
    event_date_from?: string | null;
    event_date_to?: string | null;

    event_center_name?: string | null;
    function_halls_count?: number | string | null;
    function_hall_capacity?: number | string | null;
    covered_month?: string | null;
    month_added?: string | null;
    event_started_at?: string | null;
    event_finished_at?: string | null;
    number_of_hours?: number | string | null;
    classification_of_event?: string | null;
    mice_type_of_event?: string | null;
    foreign_attendees?: number | string | null;
    domestic_attendees?: number | string | null;
    total_number_of_countries?: number | string | null;
    countries_breakdown_text?: string | null;
    has_exhibitions?: boolean | number | string | null;
    exhibitors_count?: number | string | null;
    visitors_count?: number | string | null;
    organizer_organization_name?: string | null;
    organizer_address?: string | null;
    organizer_contact_person?: string | null;
    organizer_contact_number?: string | null;
    comments_feedback?: string | null;

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
    event_days?: number | string | null;
    total_participants?: number | string | null;
    status?: string | null;
    submitted_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;

    booking?: {
        id?: number | string;
        client_name?: string | null;
        company_name?: string | null;
        type_of_event?: string | null;
        booking_status?: string | null;
        payment_status?: string | null;
    } | null;
};

type Paginated<T> = {
    data?: T[];
    links?: Array<{
        url?: string | null;
        label?: string | null;
        active?: boolean;
    }>;
    meta?: unknown;
};

type MicePageProps = {
    workspaceRole?: 'admin' | 'manager' | string;
    miceRecords?: MiceRecord[] | Paginated<MiceRecord>;
    records?: MiceRecord[] | Paginated<MiceRecord>;
    registry?: MiceRecord[] | Paginated<MiceRecord>;
    summary?: {
        total_records?: number;
        totalRecords?: number;
        total_participants?: number;
        totalParticipants?: number;
        total_events?: number;
        totalEvents?: number;
        total_room_nights?: number;
        totalRoomNights?: number;
        total_receipts?: number | string;
        totalReceipts?: number | string;
    };
    filters?: {
        q?: string;
        year_recorded?: string | number;
        year?: string | number;
        status?: string;
    };
};

const adminBreadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'MICE Registry', href: '/admin/reports/mice-registry' },
];

const managerBreadcrumbs: BreadcrumbItem[] = [
    { title: 'Manager', href: '/manager/dashboard' },
    { title: 'MICE Registry', href: '/manager/reports/mice-registry' },
];

function collection<T>(value?: T[] | Paginated<T>): T[] {
    if (Array.isArray(value)) {
        return value;
    }

    return value?.data ?? [];
}

function linksOf<T>(value?: T[] | Paginated<T>) {
    if (value && !Array.isArray(value)) {
        return value.links ?? [];
    }

    return [];
}

function currentRole(role?: string) {
    if (role === 'manager' || window.location.pathname.startsWith('/manager')) {
        return 'manager';
    }

    return 'admin';
}

function basePath(role?: string) {
    return currentRole(role) === 'manager'
        ? '/manager/reports/mice-registry'
        : '/admin/reports/mice-registry';
}

function breadcrumbsFor(role?: string): BreadcrumbItem[] {
    return currentRole(role) === 'manager' ? managerBreadcrumbs : adminBreadcrumbs;
}

function numberValue(value?: number | string | null): number {
    const parsed = Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function textValue(value?: string | number | null, fallback = '—'): string {
    if (value === null || value === undefined || String(value).trim() === '') {
        return fallback;
    }

    return String(value);
}

function money(value?: number | string | null): string {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

function formatDate(value?: string | null): string {
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

function formatDateTime(value?: string | null): string {
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

function cleanLabel(value?: string | null): string {
    return String(value || 'Not set')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function yesNo(value?: boolean | number | string | null): string {
    return value === true || value === 1 || value === '1' || value === 'true' ? 'Yes' : 'No';
}

function recordTitle(record: MiceRecord): string {
    return (
        record.event_name ||
        record.type_of_event ||
        record.establishment_name ||
        record.organization_name ||
        `MICE Record #${record.id}`
    );
}

function participantTotal(record: MiceRecord): number {
    const explicit = numberValue(record.total_participants);

    if (explicit > 0) {
        return explicit;
    }

    const official = officialDomestic(record) + officialForeign(record);

    if (official > 0) {
        return official;
    }

    return (
        numberValue(record.local_male_participants) +
        numberValue(record.local_female_participants) +
        numberValue(record.domestic_male_participants) +
        numberValue(record.domestic_female_participants) +
        numberValue(record.foreign_male_participants) +
        numberValue(record.foreign_female_participants)
    );
}


function officialDomestic(record: MiceRecord): number {
    const official = numberValue(record.domestic_attendees);

    if (official > 0) {
        return official;
    }

    return numberValue(record.local_male_participants) +
        numberValue(record.local_female_participants) +
        numberValue(record.domestic_male_participants) +
        numberValue(record.domestic_female_participants);
}

function officialForeign(record: MiceRecord): number {
    const official = numberValue(record.foreign_attendees);

    if (official > 0) {
        return official;
    }

    return numberValue(record.foreign_male_participants) + numberValue(record.foreign_female_participants);
}

function officialVisitors(record: MiceRecord): number {
    const official = numberValue(record.visitors_count);

    if (official > 0) {
        return official;
    }

    return numberValue(record.same_day_visitors) + numberValue(record.overnight_visitors);
}

function officialEventName(record: MiceRecord): string {
    return textValue(record.event_name || record.type_of_event || record.booking?.type_of_event, `MICE Record #${record.id}`);
}

function officialDates(record: MiceRecord): string {
    return `${formatDate(record.event_started_at || record.event_date_from)} to ${formatDate(record.event_finished_at || record.event_date_to)}`;
}

function officialOrganizer(record: MiceRecord): string {
    return textValue(record.organizer_organization_name || record.organization_name || record.organizer_name);
}

function officialContact(record: MiceRecord): string {
    const person = textValue(record.organizer_contact_person || record.contact_person, '');
    const number = textValue(record.organizer_contact_number || record.contact_number, '');

    if (person && number) {
        return `${person} / ${number}`;
    }

    return person || number || '—';
}

function statusClass(status?: string | null) {
    const normalized = String(status || '').toLowerCase();

    if (['submitted', 'approved', 'final', 'completed'].includes(normalized)) {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200';
    }

    if (['draft', 'pending', 'for_review'].includes(normalized)) {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200';
    }

    return 'bg-[#f4ead8] text-[#7a5a24] dark:bg-white/10 dark:text-[#f1d89b]';
}

function Pagination({
    links,
}: {
    links: Array<{
        url?: string | null;
        label?: string | null;
        active?: boolean;
    }>;
}) {
    if (!links.length) {
        return null;
    }

    return (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
            {links.map((link, index) => {
                const label = String(link.label || '')
                    .replace(/<[^>]*>/g, '')
                    .replace(/«|»/g, '')
                    .trim();

                if (!link.url) {
                    return (
                        <span
                            key={`${label}-${index}`}
                            className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[#d9c7a6]/40 bg-[#fffaf0]/50 px-4 text-sm font-semibold text-[#8a7a63] dark:border-white/10 dark:bg-white/[0.035] dark:text-white/35"
                        >
                            {label}
                        </span>
                    );
                }

                return (
                    <Link
                        key={`${label}-${index}`}
                        href={link.url}
                        preserveScroll
                        preserveState
                        className={
                            link.active
                                ? 'inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[#2f2517] px-4 text-sm font-semibold text-white dark:bg-white dark:text-[#17120b]'
                                : 'inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12'
                        }
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}

function useMiceRecords() {
    const { props } = usePage<MicePageProps>();
    const raw = props.miceRecords ?? props.records ?? props.registry;
    const records = useMemo(() => collection<MiceRecord>(raw), [raw]);
    const links = useMemo(() => linksOf<MiceRecord>(raw), [raw]);

    return {
        props,
        records,
        links,
        role: currentRole(props.workspaceRole),
        path: basePath(props.workspaceRole),
    };
}

export function MiceRegistryReportPage() {
    const { props, records, links, role, path } = useMiceRecords();

    const [q, setQ] = useState(String(props.filters?.q ?? ''));
    const [year, setYear] = useState(String(props.filters?.year_recorded ?? props.filters?.year ?? ''));
    const [status, setStatus] = useState(String(props.filters?.status ?? ''));

    const totalRecords = props.summary?.total_records ?? props.summary?.totalRecords ?? records.length;
    const totalParticipants =
        props.summary?.total_participants ??
        props.summary?.totalParticipants ??
        records.reduce((sum, record) => sum + participantTotal(record), 0);
    const totalRoomNights =
        props.summary?.total_room_nights ??
        props.summary?.totalRoomNights ??
        records.reduce((sum, record) => sum + numberValue(record.estimated_room_nights), 0);
    const totalReceipts =
        props.summary?.total_receipts ??
        props.summary?.totalReceipts ??
        records.reduce((sum, record) => sum + numberValue(record.estimated_tourism_receipts), 0);

    function search() {
        router.get(
            path,
            {
                q: q || undefined,
                year_recorded: year || undefined,
                status: status || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function destroy(record: MiceRecord) {
        if (!window.confirm(`Delete MICE record "${recordTitle(record)}"?`)) {
            return;
        }

        router.delete(`${path}/${record.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <ResourcePageShell
            title="MICE Registry"
            eyebrow="Reports"
            icon={FileSpreadsheet}
            breadcrumbs={breadcrumbsFor(role)}
            subtitle="Formal registry for Meetings, Incentives, Conferences, and Exhibitions records, participant counts, visitor origin, room nights, and tourism receipt reporting."
            actions={
                <>
                    <ResourceActionLink href={`${path}/print`} variant="secondary">
                        Print Report
                    </ResourceActionLink>

                    <ResourceActionLink href={`${path}/export`} variant="secondary">
                        Export
                    </ResourceActionLink>

                    {role === 'admin' ? (
                        <ResourceActionLink href={`${path}/create`}>
                            New MICE Record
                        </ResourceActionLink>
                    ) : null}
                </>
            }
        >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ResourceStatCard
                    label="Records"
                    value={totalRecords}
                    description="Loaded registry records."
                    icon={FileSpreadsheet}
                />

                <ResourceStatCard
                    label="Participants"
                    value={Number(totalParticipants).toLocaleString()}
                    description="Total local, domestic, and foreign participants."
                    icon={UsersRound}
                />

                <ResourceStatCard
                    label="Room Nights"
                    value={Number(totalRoomNights).toLocaleString()}
                    description="Estimated room nights."
                    icon={Building2}
                />

                <ResourceStatCard
                    label="Tourism Receipts"
                    value={money(totalReceipts)}
                    description="Estimated tourism receipts."
                    icon={ReceiptText}
                />
            </div>

            <div className="mt-5">
                <ResourceSection
                    title="Registry records"
                    eyebrow="MICE Report"
                    description="Review submitted MICE reports, verify event information, and prepare print/export reports."
                >
                    <ResourceToolbar
                        searchPlaceholder="Search event, establishment, organizer, venue, origin, or remarks..."
                        searchValue={q}
                        onSearchChange={setQ}
                        onSearchSubmit={search}
                        right={
                            <div className="flex flex-wrap gap-2">
                                <div className="flex min-h-11 items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 dark:border-white/10 dark:bg-white/7">
                                    <CalendarDays className="h-4 w-4 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />
                                    <input
                                        value={year}
                                        onChange={(event) => setYear(event.target.value)}
                                        placeholder="Year"
                                        className="w-20 bg-transparent text-sm font-semibold text-[#21180d] outline-none placeholder:text-[#8a7a63] dark:text-white dark:placeholder:text-white/42"
                                    />
                                </div>

                                <select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] outline-none dark:border-white/10 dark:bg-white/7 dark:text-white"
                                >
                                    <option value="">All statuses</option>
                                    <option value="draft">Draft</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="approved">Approved</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={search}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                >
                                    <Search className="h-4 w-4" />
                                    Search
                                </button>
                            </div>
                        }
                    />

                    {records.length === 0 ? (
                        <ResourceEmptyState
                            icon={FileSpreadsheet}
                            title="No MICE records found"
                            description="Submitted MICE survey records and manually encoded MICE registry entries will appear here."
                        />
                    ) : (
                        <div className="grid gap-4">
                            {records.map((record) => (
                                <MiceRecordCard
                                    key={record.id}
                                    record={record}
                                    role={role}
                                    path={path}
                                    onDelete={() => destroy(record)}
                                />
                            ))}
                        </div>
                    )}

                    <Pagination links={links} />
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}

function MiceRecordCard({
    record,
    role,
    path,
    onDelete,
}: {
    record: MiceRecord;
    role: string;
    path: string;
    onDelete: () => void;
}) {
    return (
        <article className="overflow-hidden rounded-[1.45rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/72 shadow-[0_18px_58px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.035]">
            <div className="border-b border-[#eadcc2]/80 p-5 dark:border-white/10">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(record.status)}`}>
                                {cleanLabel(record.status)}
                            </span>

                            <span className="rounded-full border border-[#d9c7a6]/70 bg-white px-3 py-1 text-xs font-bold text-[#7a5a24] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                                Record #{textValue(record.record_no ?? record.id)}
                            </span>

                            <span className="rounded-full border border-[#d9c7a6]/70 bg-white px-3 py-1 text-xs font-bold text-[#7a5a24] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                                {textValue(record.year_recorded, new Date().getFullYear().toString())}
                            </span>
                        </div>

                        <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[#21180d] dark:text-white">
                            {officialEventName(record)}
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                            {textValue(record.event_center_name || record.establishment_name, 'Baguio Convention and Cultural Center')} / {textValue(record.venue_area)} / {officialDates(record)}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                        <Link
                            href={`${path}/${record.id}/edit`}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                        >
                            <Edit3 className="h-4 w-4" />
                            Edit
                        </Link>

                        {role === 'admin' ? (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
                <InfoBox icon={UsersRound} label="Participants" value={participantTotal(record).toLocaleString()} />
                <InfoBox icon={UsersRound} label="Domestic Attendees" value={officialDomestic(record).toLocaleString()} />
                <InfoBox icon={Globe2} label="Foreign Attendees" value={officialForeign(record).toLocaleString()} />
                <InfoBox icon={UsersRound} label="Visitors" value={officialVisitors(record).toLocaleString()} />
                <InfoBox icon={Globe2} label="Countries" value={`${numberValue(record.total_number_of_countries).toLocaleString()} / ${textValue(record.countries_breakdown_text || record.main_origin_country)}`} />
                <InfoBox icon={Building2} label="Room Nights" value={numberValue(record.estimated_room_nights).toLocaleString()} />
                <InfoBox icon={ReceiptText} label="Receipts" value={money(record.estimated_tourism_receipts)} />
                <InfoBox icon={CalendarDays} label="Submitted" value={formatDateTime(record.submitted_at ?? record.created_at)} />
            </div>

            <div className="border-t border-[#eadcc2]/80 p-5 dark:border-white/10">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <InfoLine icon={Building2} label="Organizer Organization" value={officialOrganizer(record)} />
                    <InfoLine icon={UsersRound} label="Contact Person" value={officialContact(record)} />
                    <InfoLine icon={CalendarDays} label="Covered Month / Hours" value={`${textValue(record.covered_month)} / ${numberValue(record.number_of_hours).toLocaleString()} hr/s`} />
                    <InfoLine icon={ReceiptText} label="Classification / Type" value={`${textValue(record.classification_of_event || record.event_category)} / ${textValue(record.mice_type_of_event || record.type_of_event)}`} />
                    <InfoLine icon={MapPin} label="Organizer Address" value={textValue(record.organizer_address || record.address)} />
                    <InfoLine icon={ShieldCheck} label="Exhibitions / Accreditation" value={`Exhibitions: ${yesNo(record.has_exhibitions)} / Exhibitors: ${numberValue(record.exhibitors_count).toLocaleString()} / DOT: ${yesNo(record.dot_accredited)}`} />
                    {record.booking_summary ? <InfoLine icon={Mail} label="Linked Booking" value={record.booking_summary} /> : null}
                    <InfoLine icon={ReceiptText} label="Comments / Feedback" value={textValue(record.comments_feedback || record.remarks, 'No comments')} />
                    <InfoLine icon={ShieldCheck} label="Permit / Member" value={`Permit: ${yesNo(record.permit_to_engage)} / Member: ${yesNo(record.active_member)}`} />
                </div>
            </div>
        </article>
    );
}

function InfoBox({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof UsersRound;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[1rem] border border-[#eadcc2]/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="h-4 w-4 text-[#9d7b3d] dark:text-[#f1d89b]" />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#21180d] dark:text-white">
                {value}
            </p>
        </div>
    );
}

function InfoLine({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof UsersRound;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-[1rem] border border-[#eadcc2]/80 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9d7b3d] dark:text-[#f1d89b]">
                    {label}
                </p>
                <p className="mt-1 break-words text-sm leading-6 text-[#6e604c] dark:text-white/56">
                    {value}
                </p>
            </div>
        </div>
    );
}

export function MiceRegistryPrintPage() {
    const { records, role, path } = useMiceRecords();

    const totalDomestic = records.reduce((sum, record) => sum + officialDomestic(record), 0);
    const totalForeign = records.reduce((sum, record) => sum + officialForeign(record), 0);
    const totalVisitors = records.reduce((sum, record) => sum + officialVisitors(record), 0);
    const totalExhibitors = records.reduce((sum, record) => sum + numberValue(record.exhibitors_count), 0);

    return (
        <>
            <Head title="Print MICE Registry" />

            <div className="official-mice-print min-h-screen bg-white text-[#17120b] print:bg-white">
                <div className="mx-auto max-w-[14in] px-6 py-6 print:max-w-none print:px-0 print:py-0">
                    <div className="mb-5 flex items-center justify-between gap-4 print:hidden">
                        <Link
                            href={path}
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#d9c7a6] px-4 text-sm font-semibold text-[#2f2517]"
                        >
                            Back to Registry
                        </Link>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white"
                        >
                            <Printer className="h-4 w-4" />
                            Print Official MICE Report
                        </button>
                    </div>

                    <section className="official-mice-header">
                        <p>Republic of the Philippines · City Government of Baguio</p>
                        <h1>Baguio Convention and Cultural Center</h1>
                        <h2>2025 / 2026 MICE Report Registry</h2>
                        <small>Generated {formatDateTime(new Date().toISOString())} · Workspace: {cleanLabel(role)}</small>
                    </section>

                    <section className="mt-4 grid grid-cols-5 gap-2">
                        <PrintKpi label="Records" value={records.length.toLocaleString()} />
                        <PrintKpi label="Domestic" value={totalDomestic.toLocaleString()} />
                        <PrintKpi label="Foreign" value={totalForeign.toLocaleString()} />
                        <PrintKpi label="Visitors" value={totalVisitors.toLocaleString()} />
                        <PrintKpi label="Exhibitors" value={totalExhibitors.toLocaleString()} />
                    </section>

                    <section className="mt-5 overflow-hidden border border-[#17120b]">
                        <table className="w-full border-collapse text-[9px]">
                            <thead>
                                <tr className="bg-[#17120b] text-white">
                                    <PrintTh>No.</PrintTh>
                                    <PrintTh>Event Center</PrintTh>
                                    <PrintTh>Covered Month</PrintTh>
                                    <PrintTh>Event Name</PrintTh>
                                    <PrintTh>Dates / Hours</PrintTh>
                                    <PrintTh>Classification</PrintTh>
                                    <PrintTh>Type</PrintTh>
                                    <PrintTh>Domestic</PrintTh>
                                    <PrintTh>Foreign</PrintTh>
                                    <PrintTh>Countries</PrintTh>
                                    <PrintTh>Exhibitions</PrintTh>
                                    <PrintTh>Visitors</PrintTh>
                                    <PrintTh>Organizer / Contact</PrintTh>
                                    <PrintTh>Feedback</PrintTh>
                                </tr>
                            </thead>

                            <tbody>
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="border border-[#17120b] p-4 text-center">
                                            No MICE records found.
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record, index) => (
                                        <tr key={record.id} className="break-inside-avoid">
                                            <PrintTd>{textValue(record.record_no ?? index + 1)}</PrintTd>
                                            <PrintTd>{textValue(record.event_center_name || record.establishment_name, 'Baguio Convention and Cultural Center')}</PrintTd>
                                            <PrintTd>{textValue(record.covered_month || record.month_added)}</PrintTd>
                                            <PrintTd>{officialEventName(record)}</PrintTd>
                                            <PrintTd>
                                                {formatDate(record.event_started_at || record.event_date_from)}
                                                <br />
                                                {formatDate(record.event_finished_at || record.event_date_to)}
                                                <br />
                                                {textValue(record.number_of_hours)} hr/s
                                            </PrintTd>
                                            <PrintTd>{textValue(record.classification_of_event || record.event_category)}</PrintTd>
                                            <PrintTd>{textValue(record.mice_type_of_event || record.type_of_event)}</PrintTd>
                                            <PrintTd>{officialDomestic(record).toLocaleString()}</PrintTd>
                                            <PrintTd>{officialForeign(record).toLocaleString()}</PrintTd>
                                            <PrintTd>
                                                {textValue(record.total_number_of_countries)}
                                                <br />
                                                {textValue(record.countries_breakdown_text || record.main_origin_country)}
                                            </PrintTd>
                                            <PrintTd>
                                                {yesNo(record.has_exhibitions)}
                                                <br />
                                                {numberValue(record.exhibitors_count).toLocaleString()} exhibitor/s
                                            </PrintTd>
                                            <PrintTd>{officialVisitors(record).toLocaleString()}</PrintTd>
                                            <PrintTd>
                                                {officialOrganizer(record)}
                                                <br />
                                                {textValue(record.organizer_address || record.address)}
                                                <br />
                                                {officialContact(record)}
                                            </PrintTd>
                                            <PrintTd>{textValue(record.comments_feedback || record.remarks, '—')}</PrintTd>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </section>

                    <section className="mt-4 border border-[#17120b] p-3 text-[10px] leading-5">
                        <strong>Certification:</strong> This report follows the official MICE/Convention Utility Survey fields: event center, function halls/capacity, covered month, event dates, hours, classification, event type, attendee counts, countries, exhibitions, visitors, organizer details, and comments/feedback.
                    </section>

                    <section className="mt-6 grid grid-cols-3 gap-8 text-xs">
                        <SignatureBlock label="Prepared by" />
                        <SignatureBlock label="Reviewed by" />
                        <SignatureBlock label="Approved by" />
                    </section>
                </div>
            </div>
        </>
    );
}
function PrintKpi({ label, value }: { label: string; value: string }) {
    return (
        <article className="border border-[#17120b] p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</p>
            <p className="mt-1 text-lg font-bold">{value}</p>
        </article>
    );
}

function PrintTh({ children }: { children: React.ReactNode }) {
    return <th className="border border-[#17120b] px-2 py-2 text-left font-bold">{children}</th>;
}

function PrintTd({ children }: { children: React.ReactNode }) {
    return <td className="border border-[#17120b] px-2 py-2 align-top">{children}</td>;
}

function SignatureBlock({ label }: { label: string }) {
    return (
        <div className="pt-10 text-center">
            <div className="border-t border-[#17120b] pt-2">
                <p className="font-bold uppercase">{label}</p>
                <p className="mt-1 text-[10px]">Name / Signature / Date</p>
            </div>
        </div>
    );
}

export default MiceRegistryReportPage;
