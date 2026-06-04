import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    compactDate,
    extractCollection,
    extractLinks,
    textValue,
} from '@/lib/admin-resource-ui';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    Edit3,
    Layers3,
    Loader2,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';

type VenueArea = {
    id: number | string;
    name?: string | null;
    description?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    services_count?: number | string | null;
    services?: unknown[];
};

type PageProps = {
    workspaceRole?: string;
    serviceTypes?: unknown;
    venueAreas?: unknown;
    filters?: {
        q?: string;
    };
};

type VenueAreaForm = {
    name: string;
    description: string;
};

const recommendedAreas = [
    'FULL HALL',
    'MAIN HALL',
    'FOYER & LOBBY AREA',
    'VIP LOUNGE',
    'BOARD ROOM',
    'BASEMENT',
    'GALLERY2600',
];

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="grid gap-2">
            <span className="backend-booking-label">{label}</span>
            {children}
            {error ? (
                <p className="text-xs font-bold text-red-500">{error}</p>
            ) : null}
        </label>
    );
}

function serviceCount(area: VenueArea): number {
    return Number(area.services_count ?? area.services?.length ?? 0);
}

function areaHealth(area: VenueArea): 'configured' | 'empty' {
    return serviceCount(area) > 0 ? 'configured' : 'empty';
}

function areaHealthLabel(area: VenueArea): string {
    return areaHealth(area) === 'configured'
        ? 'With rental options'
        : 'No rental options';
}

function areaHealthClass(area: VenueArea): string {
    return areaHealth(area) === 'configured'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300';
}

export function VenueAreasPage() {
    const { props } = usePage() as unknown as { props: PageProps };

    const areas = useMemo(
        () =>
            extractCollection<VenueArea>(
                props.venueAreas ?? props.serviceTypes,
            ),
        [props.venueAreas, props.serviceTypes],
    );

    const pageLinks = extractLinks(props.venueAreas ?? props.serviceTypes);
    const [editing, setEditing] = useState<VenueArea | null>(null);
    const [q, setQ] = useState(String(props.filters?.q ?? ''));

    const { data, setData, post, put, reset, processing, errors, clearErrors } =
        useForm<VenueAreaForm>({
            name: '',
            description: '',
        });

    const configuredCount = areas.filter(
        (area) => areaHealth(area) === 'configured',
    ).length;

    const emptyCount = areas.length - configuredCount;

    function startCreate() {
        setEditing(null);
        clearErrors();
        reset();
    }

    function startEdit(area: VenueArea) {
        setEditing(area);
        clearErrors();
        setData('name', textValue(area.name));
        setData('description', textValue(area.description));
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        if (editing) {
            put(`/admin/venue-areas/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditing(null);
                    reset();
                },
            });

            return;
        }

        post('/admin/venue-areas', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    function destroy(area: VenueArea) {
        const confirmed = window.confirm(
            `Delete "${area.name}"? Rental options connected to this area may be affected.`,
        );

        if (!confirmed) return;

        router.delete(`/admin/venue-areas/${area.id}`, {
            preserveScroll: true,
        });
    }

    function search(event: FormEvent) {
        event.preventDefault();

        router.get(
            '/admin/venue-areas',
            { q: q || undefined },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function resetSearch() {
        setQ('');

        router.get(
            '/admin/venue-areas',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    return (
        <ResourcePageShell
            role={props.workspaceRole}
            current="Venue Areas"
            eyebrow="Venue Configuration"
            title="Venue Areas"
            description="Maintain BCCC venue areas used by rental options, booking forms, area-overlap rules, calendar availability, and public venue displays."
            actions={
                <Button
                    type="button"
                    onClick={startCreate}
                    className="h-10 rounded-lg bg-[#20242b] px-4 text-sm font-semibold text-white hover:bg-[#14181d] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Venue Area
                </Button>
            }
        >
            <div className="space-y-5">
                <section className="grid gap-4 md:grid-cols-3">
                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Total Areas</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {areas.length}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Venue areas loaded in this workspace.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Configured</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {configuredCount}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Areas with connected rental options.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Needs Setup</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {emptyCount}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Areas without rental options yet.
                        </p>
                    </article>
                </section>

                <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                    <aside className="alh-admin-panel h-fit overflow-hidden">
                        <div className="alh-admin-panel-header">
                            <div className="flex items-start gap-3">
                                <div className="alh-admin-action-icon">
                                    <Building2 className="h-5 w-5" />
                                </div>

                                <div>
                                    <Badge
                                        variant="outline"
                                        className="rounded-md border-slate-200 bg-slate-50 text-[11px] font-black tracking-[0.18em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                    >
                                        {editing ? 'Edit Area' : 'Create Area'}
                                    </Badge>

                                    <h2 className="mt-3 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                        {editing
                                            ? editing.name || 'Edit Area'
                                            : 'Area Details'}
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        Keep area names consistent with booking
                                        conflict and availability rules.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="grid gap-4 p-5">
                            <Field label="Area Name" error={errors.name}>
                                <input
                                    value={data.name}
                                    onChange={(event) =>
                                        setData('name', event.target.value)
                                    }
                                    className="backend-booking-input"
                                    placeholder="FULL HALL, MAIN HALL, VIP LOUNGE..."
                                />
                            </Field>

                            <Field
                                label="Description"
                                error={errors.description}
                            >
                                <textarea
                                    value={data.description}
                                    onChange={(event) =>
                                        setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    rows={5}
                                    className="backend-booking-input min-h-[130px] py-3"
                                    placeholder="Short internal description or public context..."
                                />
                            </Field>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                                <p className="backend-booking-label">
                                    Recommended BCCC Areas
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {recommendedAreas.map((area) => (
                                        <button
                                            key={area}
                                            type="button"
                                            onClick={() =>
                                                setData('name', area)
                                            }
                                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-black tracking-[0.12em] text-slate-600 uppercase transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            {area}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-10 flex-1 rounded-lg bg-[#20242b] px-4 text-sm font-semibold text-white hover:bg-[#14181d] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                >
                                    {processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    {editing ? 'Update Area' : 'Save Area'}
                                </Button>

                                {editing ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={startCreate}
                                        className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </Button>
                                ) : null}
                            </div>
                        </form>
                    </aside>

                    <main className="alh-admin-panel overflow-hidden">
                        <div className="alh-admin-panel-header flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                                <Badge
                                    variant="outline"
                                    className="rounded-md border-slate-200 bg-slate-50 text-[11px] font-black tracking-[0.18em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                >
                                    Area List
                                </Badge>

                                <h2 className="mt-3 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                    {areas.length} area
                                    {areas.length === 1 ? '' : 's'}
                                </h2>

                                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    These names should stay aligned with
                                    frontend labels and booking availability
                                    logic.
                                </p>
                            </div>

                            <form
                                onSubmit={search}
                                className="grid w-full gap-2 sm:grid-cols-[1fr_auto_auto] xl:max-w-xl"
                            >
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={q}
                                        onChange={(event) =>
                                            setQ(event.target.value)
                                        }
                                        className="backend-booking-input pl-10"
                                        placeholder="Search areas..."
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                >
                                    Search
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetSearch}
                                    className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                >
                                    Reset
                                </Button>
                            </form>
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {areas.length > 0 ? (
                                areas.map((area) => (
                                    <article
                                        key={area.id}
                                        className="alh-admin-config-row"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={areaHealthClass(
                                                        area,
                                                    )}
                                                >
                                                    {areaHealthLabel(area)}
                                                </Badge>

                                                <Badge
                                                    variant="outline"
                                                    className="rounded-md"
                                                >
                                                    Created{' '}
                                                    {compactDate(
                                                        area.created_at,
                                                    )}
                                                </Badge>
                                            </div>

                                            <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                                                {area.name || 'Unnamed Area'}
                                            </h3>

                                            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                {area.description ||
                                                    'No description provided.'}
                                            </p>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <span className="alh-admin-mini-pill">
                                                    <Layers3 className="h-3.5 w-3.5" />
                                                    {serviceCount(area)} rental
                                                    option
                                                    {serviceCount(area) === 1
                                                        ? ''
                                                        : 's'}
                                                </span>

                                                <span className="alh-admin-mini-pill">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Used by booking form
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 xl:justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => startEdit(area)}
                                                className="h-9 rounded-lg border-slate-200 bg-white px-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                            >
                                                <Edit3 className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => destroy(area)}
                                                className="h-9 rounded-lg border-red-200 bg-red-50 px-3 font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="p-10 text-center">
                                    <Building2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                    <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
                                        No venue areas found
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        Add rentable BCCC areas before creating
                                        rental options.
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
                    </main>
                </section>
            </div>
        </ResourcePageShell>
    );
}
