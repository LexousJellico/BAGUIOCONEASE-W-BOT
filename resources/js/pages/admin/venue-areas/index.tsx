import {
    ResourceActionLink,
    ResourceEmptyState,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
    ResourceToolbar,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    Eye,
    Layers3,
    Pencil,
    Plus,
    Save,
    Trash2,
    UsersRound,
} from 'lucide-react';
import type { FormEvent } from 'react';

type VenueArea = {
    id?: number | string;
    name?: string | null;
    title?: string | null;
    description?: string | null;
    capacity?: number | string | null;
    min_capacity?: number | null;
    max_capacity?: number | null;
    is_active?: boolean | number | string | null;
    options_note?: string | null;
    sort_order?: number | string | null;
    services_count?: number | null;
    rental_options_count?: number | null;
    created_at?: string | null;
};

type CollectionLike<T> = T[] | { data?: T[] } | null | undefined;

type PageProps = {
    mode?: 'index' | 'create' | 'edit' | 'show' | string;
    venueArea?: VenueArea | null;
    serviceType?: VenueArea | null;
    venueAreas?: CollectionLike<VenueArea>;
    serviceTypes?: CollectionLike<VenueArea>;
    areas?: CollectionLike<VenueArea>;
    errors?: Record<string, string>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Venue Areas', href: '/admin/venue-areas' },
];

function collection<T>(value: CollectionLike<T> | unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[];
    }

    if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
        return (value as { data: T[] }).data;
    }

    return [];
}

function currentBasePath() {
    if (typeof window === 'undefined') {
        return '/admin/venue-areas';
    }

    if (window.location.pathname.startsWith('/service-types')) {
        return '/service-types';
    }

    return '/admin/venue-areas';
}

function activeFlag(item: VenueArea) {
    return item.is_active === true || item.is_active === 1 || item.is_active === '1' || item.is_active === undefined || item.is_active === null;
}

function areaName(item: VenueArea) {
    return item.name || item.title || 'Untitled venue area';
}

function capacityLabel(item: VenueArea) {
    if (item.capacity) {
        return String(item.capacity);
    }

    if (item.min_capacity || item.max_capacity) {
        return `${item.min_capacity ?? 0} - ${item.max_capacity ?? '∞'}`;
    }

    return 'Not set';
}

function optionCount(item: VenueArea) {
    return Number(item.services_count ?? item.rental_options_count ?? 0);
}

function VenueAreaForm({ selected, mode }: { selected?: VenueArea | null; mode: string }) {
    const basePath = currentBasePath();
    const isEdit = mode === 'edit' && Boolean(selected?.id);

    const { data, setData, post, put, processing, errors } = useForm({
        name: String(selected?.name ?? selected?.title ?? ''),
        description: String(selected?.description ?? ''),
        capacity: String(selected?.capacity ?? ''),
        min_capacity: String(selected?.min_capacity ?? ''),
        max_capacity: String(selected?.max_capacity ?? ''),
        options_note: String(selected?.options_note ?? ''),
        is_active: activeFlag(selected ?? {}),
        sort_order: String(selected?.sort_order ?? ''),
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        if (isEdit && selected?.id) {
            put(`${basePath}/${selected.id}`, {
                preserveScroll: true,
            });
            return;
        }

        post(basePath, {
            preserveScroll: true,
        });
    }

    return (
        <ResourceSection
            title={isEdit ? 'Edit venue area' : 'Create venue area'}
            eyebrow="Venue Area Form"
            description="Venue areas are the source labels used by booking, availability, and rental option mapping. Keep names exact and consistent."
            actions={
                <Link
                    href={basePath}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>
            }
        >
            <form
                onSubmit={submit}
                className="rounded-[1.35rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/75 p-5 shadow-[0_16px_46px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.035]"
            >
                <div className="grid gap-4 lg:grid-cols-2">
                    <label className="grid gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Venue Area Name
                        </span>
                        <input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            placeholder="Example: Full Hall"
                            className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                            required
                        />
                        {errors.name ? <p className="text-sm font-semibold text-rose-600">{errors.name}</p> : null}
                    </label>

                    <label className="grid gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Display Capacity
                        </span>
                        <input
                            value={data.capacity}
                            onChange={(event) => setData('capacity', event.target.value)}
                            placeholder="Example: Up to 2,500 guests"
                            className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                        />
                        {errors.capacity ? <p className="text-sm font-semibold text-rose-600">{errors.capacity}</p> : null}
                    </label>

                    <label className="grid gap-2 lg:col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Description
                        </span>
                        <textarea
                            value={data.description}
                            onChange={(event) => setData('description', event.target.value)}
                            rows={4}
                            placeholder="Short operational description used by setup and reference screens."
                            className="rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 py-3 text-sm font-medium text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                        />
                        {errors.description ? <p className="text-sm font-semibold text-rose-600">{errors.description}</p> : null}
                    </label>

                    <label className="grid gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Minimum Capacity
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={data.min_capacity}
                            onChange={(event) => setData('min_capacity', event.target.value)}
                            className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                        />
                        {errors.min_capacity ? <p className="text-sm font-semibold text-rose-600">{errors.min_capacity}</p> : null}
                    </label>

                    <label className="grid gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Maximum Capacity
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={data.max_capacity}
                            onChange={(event) => setData('max_capacity', event.target.value)}
                            className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                        />
                        {errors.max_capacity ? <p className="text-sm font-semibold text-rose-600">{errors.max_capacity}</p> : null}
                    </label>

                    <label className="grid gap-2 lg:col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Options / Booking Note
                        </span>
                        <textarea
                            value={data.options_note}
                            onChange={(event) => setData('options_note', event.target.value)}
                            rows={3}
                            placeholder="Example: Requires Whole Day, Half Day, and Additional Hours rental options."
                            className="rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 py-3 text-sm font-medium text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                        />
                        {errors.options_note ? <p className="text-sm font-semibold text-rose-600">{errors.options_note}</p> : null}
                    </label>

                    <label className="grid gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Sort Order
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={data.sort_order}
                            onChange={(event) => setData('sort_order', event.target.value)}
                            placeholder="999"
                            className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                        />
                        {errors.sort_order ? <p className="text-sm font-semibold text-rose-600">{errors.sort_order}</p> : null}
                    </label>

                    <label className="flex min-h-12 items-center gap-3 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] dark:border-white/10 dark:bg-white/[0.05] dark:text-white">
                        <input
                            type="checkbox"
                            checked={Boolean(data.is_active)}
                            onChange={(event) => setData('is_active', event.target.checked)}
                            className="h-4 w-4 accent-[#8b672d]"
                        />
                        Active area
                    </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                    <Link
                        href={basePath}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] disabled:opacity-60 dark:bg-white dark:text-[#17120b]"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Saving...' : isEdit ? 'Update Area' : 'Create Area'}
                    </button>
                </div>
            </form>
        </ResourceSection>
    );
}

export default function AdminVenueAreasIndex() {
    const { props } = usePage<PageProps>();
    const basePath = currentBasePath();
    const mode = String(props.mode ?? 'index');
    const selectedArea = props.venueArea ?? props.serviceType ?? null;

    const rows = collection<VenueArea>(props.venueAreas ?? props.serviceTypes ?? props.areas);
    const activeRows = rows.filter(activeFlag);
    const inactiveRows = rows.length - activeRows.length;
    const linkedOptions = rows.reduce((sum, item) => sum + optionCount(item), 0);
    const showForm = mode === 'create' || mode === 'edit';

    return (
        <ResourcePageShell
            title="Venue Areas"
            eyebrow="System Setup"
            icon={Building2}
            breadcrumbs={breadcrumbs}
            subtitle="Manage BCCC venue areas used by the booking form, availability checker, public facility display, and rental option mapping."
            actions={
                <>
                    <ResourceActionLink href="/admin/rental-options" variant="secondary">
                        Rental Options
                    </ResourceActionLink>

                    <ResourceActionLink href={`${basePath}/create`}>
                        New Venue Area
                    </ResourceActionLink>
                </>
            }
        >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ResourceStatCard label="Total Areas" value={rows.length} description="All configured venue spaces." icon={Building2} />
                <ResourceStatCard label="Active" value={activeRows.length} description="Available for workflow usage." icon={CheckCircle2} />
                <ResourceStatCard label="Inactive" value={inactiveRows} description="Hidden or disabled area records." icon={Eye} />
                <ResourceStatCard label="Linked Options" value={linkedOptions} description="Rental options connected to areas." icon={Layers3} />
            </div>

            <div className="mt-5 space-y-5">
                {showForm ? <VenueAreaForm selected={selectedArea} mode={mode} /> : null}

                <ResourceSection
                    title="Configured venue spaces"
                    eyebrow="Service Types"
                    description="Keep venue names clean and consistent. These records should match public facility labels and booking availability choices."
                    actions={
                        <Link
                            href={`${basePath}/create`}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                        >
                            <Plus className="h-4 w-4" />
                            Add Area
                        </Link>
                    }
                >
                    <ResourceToolbar searchPlaceholder="Search venue areas..." />

                    {rows.length === 0 ? (
                        <ResourceEmptyState
                            icon={Building2}
                            title="No venue areas configured"
                            description="Create venue areas first. Rental options should be connected to these areas so booking, availability, and public facility displays stay synchronized."
                        />
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {rows.map((item, index) => (
                                <article
                                    key={item.id ?? index}
                                    className="group rounded-[1.35rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/70 p-4 shadow-[0_14px_40px_rgba(47,37,23,0.06)] transition hover:-translate-y-0.5 hover:border-[#b08d48]/80 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.06]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                            <Building2 className="h-5 w-5" />
                                        </span>

                                        <span
                                            className={
                                                activeFlag(item)
                                                    ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200'
                                                    : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-white/52'
                                            }
                                        >
                                            {activeFlag(item) ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                                        {areaName(item)}
                                    </h3>

                                    <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                        {item.description || item.options_note || 'No description provided.'}
                                    </p>

                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <MiniStat icon={UsersRound} label="Capacity" value={capacityLabel(item)} />
                                        <MiniStat icon={Layers3} label="Options" value={String(optionCount(item))} />
                                    </div>

                                    {item.id ? (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Link
                                                href={`${basePath}/${item.id}/edit`}
                                                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-4 text-sm font-semibold text-white transition hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm(`Delete ${areaName(item)}?`)) {
                                                        router.delete(`${basePath}/${item.id}`, { preserveScroll: true });
                                                    }
                                                }}
                                                className="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    )}
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) {
    return (
        <div className="rounded-[1rem] border border-[#eadcc2]/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="h-4 w-4 text-[#9d7b3d] dark:text-[#f1d89b]" />
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#9d7b3d] dark:text-[#f1d89b]">{label}</p>
            <p className="mt-1 text-sm font-semibold text-[#21180d] dark:text-white">{value}</p>
        </div>
    );
}
