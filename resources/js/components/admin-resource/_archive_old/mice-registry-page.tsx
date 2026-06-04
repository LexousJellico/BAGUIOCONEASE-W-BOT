import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    booleanBadgeTone,
    cleanLabel,
    compactDate,
    currentWorkspaceRole,
    extractCollection,
    extractLinks,
    normalizeAdminResourceRole,
    yesNo,
} from '@/lib/admin-resource-ui';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Building2,
    Download,
    Edit3,
    FileBarChart,
    Plus,
    Printer,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

type MiceRecord = {
    id: number | string;
    establishment_name?: string | null;
    business_type?: string | null;
    classification?: string | null;
    enterprise_group?: string | null;
    city_municipality?: string | null;
    province_huc?: string | null;
    region?: string | null;
    year_recorded?: number | string | null;
    month_added?: string | null;
    seats_unit?: number | string | null;
    total_employees?: number | string | null;
    male_employees?: number | string | null;
    female_employees?: number | string | null;
    permit_to_engage?: boolean | number | string | null;
    dot_accredited?: boolean | number | string | null;
    active_member?: boolean | number | string | null;
    created_at?: string | null;
};

type PageProps = {
    workspaceRole?: string;
    records?: unknown;
    rows?: unknown;
    miceRecords?: unknown;
    registry?: unknown;
    filters?: {
        q?: string;
        year_recorded?: string;
        classification?: string;
    };
};

function basePath(role: string) {
    if (role === 'manager') return '/manager/reports/mice-registry';

    return '/admin/reports/mice-registry';
}

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function uniqueCount(records: MiceRecord[], key: keyof MiceRecord): number {
    return new Set(
        records
            .map((record) => record[key])
            .filter(
                (value) =>
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== '',
            )
            .map((value) => String(value)),
    ).size;
}

function boolValue(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
}

function recordLocation(record: MiceRecord): string {
    return (
        [record.city_municipality, record.province_huc, record.region]
            .filter(Boolean)
            .join(', ') || 'No location'
    );
}

function printableHref(path: string) {
    return `${path}/print`;
}

function exportHref(path: string) {
    return `${path}?export=1`;
}

export function MiceRegistryPage() {
    const { props } = usePage() as unknown as { props: PageProps };

    const role = normalizeAdminResourceRole(
        props.workspaceRole ?? currentWorkspaceRole(),
    );

    const records = useMemo(
        () =>
            extractCollection<MiceRecord>(
                props.records ??
                    props.rows ??
                    props.miceRecords ??
                    props.registry,
            ),
        [props.records, props.rows, props.miceRecords, props.registry],
    );

    const pageLinks = extractLinks(
        props.records ?? props.rows ?? props.miceRecords ?? props.registry,
    );

    const [q, setQ] = useState(String(props.filters?.q ?? ''));
    const [year, setYear] = useState(
        String(props.filters?.year_recorded ?? ''),
    );
    const [classification, setClassification] = useState(
        String(props.filters?.classification ?? ''),
    );

    const path = basePath(role);
    const canMutate = role === 'admin';

    const totalEmployees = records.reduce(
        (sum, record) => sum + numberValue(record.total_employees),
        0,
    );

    const totalMale = records.reduce(
        (sum, record) => sum + numberValue(record.male_employees),
        0,
    );

    const totalFemale = records.reduce(
        (sum, record) => sum + numberValue(record.female_employees),
        0,
    );

    const dotAccreditedCount = records.filter((record) =>
        boolValue(record.dot_accredited),
    ).length;

    const activeMemberCount = records.filter((record) =>
        boolValue(record.active_member),
    ).length;

    const years = Array.from(
        new Set(
            records
                .map((record) => record.year_recorded)
                .filter(Boolean)
                .map((value) => String(value)),
        ),
    ).sort((a, b) => b.localeCompare(a));

    const classifications = Array.from(
        new Set(
            records
                .map((record) => record.classification)
                .filter(Boolean)
                .map((value) => String(value)),
        ),
    ).sort();

    function search(event: FormEvent) {
        event.preventDefault();

        router.get(
            path,
            {
                q: q || undefined,
                year_recorded: year || undefined,
                classification: classification || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function resetFilters() {
        setQ('');
        setYear('');
        setClassification('');

        router.get(
            path,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function destroy(record: MiceRecord) {
        const confirmed = window.confirm(
            `Delete MICE registry record "${record.establishment_name || record.id}"?`,
        );

        if (!confirmed) return;

        router.delete(`${path}/${record.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <ResourcePageShell
            role={props.workspaceRole}
            current="MICE Registry"
            eyebrow="Reports and Registry"
            title="MICE Registry"
            description="Maintain MICE-related records for reporting, classification, accreditation, employee counts, and establishment tracking."
            actions={
                <div className="flex flex-wrap gap-2">
                    {canMutate ? (
                        <Button
                            asChild
                            className="h-10 rounded-lg bg-[#20242b] px-4 text-sm font-semibold text-white hover:bg-[#14181d] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            <Link href={`${path}/create`}>
                                <Plus className="mr-2 h-4 w-4" />
                                New Record
                            </Link>
                        </Button>
                    ) : null}

                    <Button
                        asChild
                        variant="outline"
                        className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        <a
                            href={printableHref(path)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </a>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        <a href={exportHref(path)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </a>
                    </Button>
                </div>
            }
        >
            <div className="space-y-5">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <article className="alh-admin-kpi-card xl:col-span-1">
                        <p className="backend-booking-label">Records</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {records.length}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Registry entries loaded.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card xl:col-span-1">
                        <p className="backend-booking-label">Classifications</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {uniqueCount(records, 'classification')}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Unique classification labels.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card xl:col-span-1">
                        <p className="backend-booking-label">Employees</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {totalEmployees}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Total employee count.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card xl:col-span-1">
                        <p className="backend-booking-label">Female</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {totalFemale}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Female employees.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card xl:col-span-1">
                        <p className="backend-booking-label">Male</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {totalMale}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Male employees.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card xl:col-span-1">
                        <p className="backend-booking-label">DOT Accredited</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {dotAccreditedCount}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Active accreditation records.
                        </p>
                    </article>
                </section>

                <section className="alh-admin-panel overflow-hidden">
                    <div className="alh-admin-panel-header flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <Badge
                                variant="outline"
                                className="rounded-md border-slate-200 bg-slate-50 text-[11px] font-black tracking-[0.18em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            >
                                Registry Records
                            </Badge>

                            <h2 className="mt-3 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                MICE reporting table
                            </h2>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Records are compressed into readable cards. Open
                                the edit form only when complete data entry is
                                needed.
                            </p>
                        </div>

                        <form
                            onSubmit={search}
                            className="grid w-full gap-2 xl:max-w-5xl xl:grid-cols-[1fr_160px_190px_auto_auto]"
                        >
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={q}
                                    onChange={(event) =>
                                        setQ(event.target.value)
                                    }
                                    className="backend-booking-input pl-10"
                                    placeholder="Search establishment, city, classification..."
                                />
                            </div>

                            <select
                                value={year}
                                onChange={(event) =>
                                    setYear(event.target.value)
                                }
                                className="backend-booking-input"
                            >
                                <option value="">All Years</option>
                                {years.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={classification}
                                onChange={(event) =>
                                    setClassification(event.target.value)
                                }
                                className="backend-booking-input"
                            >
                                <option value="">All Classifications</option>
                                {classifications.map((item) => (
                                    <option key={item} value={item}>
                                        {cleanLabel(item)}
                                    </option>
                                ))}
                            </select>

                            <Button
                                type="submit"
                                variant="outline"
                                className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                            >
                                Apply
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetFilters}
                                className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                            >
                                Reset
                            </Button>
                        </form>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {records.length > 0 ? (
                            records.map((record) => (
                                <article
                                    key={record.id}
                                    className="alh-admin-mice-row"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="rounded-md border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                            >
                                                {record.year_recorded ||
                                                    'No year'}
                                            </Badge>

                                            <Badge
                                                variant="outline"
                                                className="rounded-md"
                                            >
                                                {record.month_added ||
                                                    'No month'}
                                            </Badge>

                                            {record.classification ? (
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-md"
                                                >
                                                    {cleanLabel(
                                                        record.classification,
                                                    )}
                                                </Badge>
                                            ) : null}
                                        </div>

                                        <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                                            {record.establishment_name ||
                                                `Record #${record.id}`}
                                        </h3>

                                        <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                            {record.business_type ||
                                                'No business type'}{' '}
                                            ·{' '}
                                            {record.enterprise_group ||
                                                'No enterprise group'}
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                            {recordLocation(record)}
                                        </p>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-4">
                                            <div className="alh-admin-mini-box">
                                                <span>Seats / Unit</span>
                                                <strong>
                                                    {record.seats_unit || 0}
                                                </strong>
                                            </div>

                                            <div className="alh-admin-mini-box">
                                                <span>Employees</span>
                                                <strong>
                                                    {record.total_employees ||
                                                        0}
                                                </strong>
                                            </div>

                                            <div className="alh-admin-mini-box">
                                                <span>Female</span>
                                                <strong>
                                                    {record.female_employees ||
                                                        0}
                                                </strong>
                                            </div>

                                            <div className="alh-admin-mini-box">
                                                <span>Male</span>
                                                <strong>
                                                    {record.male_employees || 0}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Badge
                                                variant="outline"
                                                className={booleanBadgeTone(
                                                    record.permit_to_engage,
                                                )}
                                            >
                                                Permit:{' '}
                                                {yesNo(record.permit_to_engage)}
                                            </Badge>

                                            <Badge
                                                variant="outline"
                                                className={booleanBadgeTone(
                                                    record.dot_accredited,
                                                )}
                                            >
                                                DOT:{' '}
                                                {yesNo(record.dot_accredited)}
                                            </Badge>

                                            <Badge
                                                variant="outline"
                                                className={booleanBadgeTone(
                                                    record.active_member,
                                                )}
                                            >
                                                Active:{' '}
                                                {yesNo(record.active_member)}
                                            </Badge>

                                            <Badge
                                                variant="outline"
                                                className="rounded-md"
                                            >
                                                Created{' '}
                                                {compactDate(record.created_at)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 xl:justify-end">
                                        {canMutate ? (
                                            <>
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 rounded-lg border-slate-200 bg-white px-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                                >
                                                    <Link
                                                        href={`${path}/${record.id}/edit`}
                                                    >
                                                        <Edit3 className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        destroy(record)
                                                    }
                                                    className="h-9 rounded-lg border-red-200 bg-red-50 px-3 font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="rounded-md"
                                            >
                                                Read-only review
                                            </Badge>
                                        )}
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="p-10 text-center">
                                <FileBarChart className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
                                    No MICE records found
                                </h3>
                                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Registry records will appear here after
                                    adding or importing MICE data.
                                </p>
                            </div>
                        )}
                    </div>

                    {pageLinks.length > 0 ? (
                        <div className="flex flex-wrap gap-2 border-t border-slate-200 p-5 dark:border-slate-800">
                            {pageLinks.map((link, index) =>
                                link.url ? (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url}
                                        preserveScroll
                                        className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                                            link.active
                                                ? 'border-[#20242b] bg-[#20242b] text-white dark:border-white dark:bg-white dark:text-slate-950'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label ?? '',
                                        }}
                                    />
                                ) : (
                                    <span
                                        key={`${link.label}-${index}`}
                                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900/60"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label ?? '',
                                        }}
                                    />
                                ),
                            )}
                        </div>
                    ) : null}
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    <article className="alh-admin-note">
                        <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        <div>
                            <p>Registry quality</p>
                            <span>
                                Keep establishment names, city, classification,
                                accreditation, and employee counts consistent
                                for reliable reporting.
                            </span>
                        </div>
                    </article>

                    <article className="alh-admin-note">
                        <Users className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        <div>
                            <p>Active members</p>
                            <span>
                                {activeMemberCount} loaded record
                                {activeMemberCount === 1 ? '' : 's'} currently
                                marked as active member.
                            </span>
                        </div>
                    </article>
                </section>
            </div>
        </ResourcePageShell>
    );
}
