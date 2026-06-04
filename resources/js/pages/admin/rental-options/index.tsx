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
    Clock3,
    Layers3,
    PackageCheck,
    Pencil,
    Plus,
    Save,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

type VenueArea = {
    id?: number | string;
    name?: string | null;
    title?: string | null;
};

type RentalOption = {
    id?: number | string;
    name?: string | null;
    title?: string | null;
    description?: string | null;
    service_type_id?: number | string | null;
    venue_area_id?: number | string | null;
    service_type?: VenueArea | null;
    uom?: string | null;
    unit?: string | null;
    price?: number | string | null;
    quantity?: number | string | null;
    min_guests?: number | string | null;
    max_guests?: number | string | null;
    capacity_note?: string | null;
    is_active?: boolean | number | string | null;
};

type PaginationLink = { url?: string | null; label?: string | null; active?: boolean };

type CollectionLike<T> = T[] | { data?: T[]; links?: PaginationLink[] } | null | undefined;

type PageProps = {
    mode?: 'index' | 'create' | 'edit' | 'show' | string;
    service?: RentalOption | null;
    rentalOption?: RentalOption | null;
    rentalOptions?: CollectionLike<RentalOption>;
    services?: CollectionLike<RentalOption>;
    serviceTypes?: CollectionLike<VenueArea>;
    venueAreas?: CollectionLike<VenueArea>;
};

type RentalFormData = {
    service_type_id: string;
    name: string;
    description: string;
    uom: string;
    price: string;
    quantity: string;
    min_guests: string;
    max_guests: string;
    capacity_note: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Rental Options', href: '/admin/rental-options' },
];

function collection<T>(value: CollectionLike<T> | unknown): T[] {
    if (Array.isArray(value)) return value as T[];

    if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
        return (value as { data: T[] }).data;
    }

    return [];
}

function linksOf(value: CollectionLike<unknown> | unknown): PaginationLink[] {
    if (value && typeof value === 'object' && Array.isArray((value as { links?: PaginationLink[] }).links)) {
        return (value as { links: PaginationLink[] }).links;
    }

    return [];
}

function paginationLabel(label?: string | null) {
    return String(label || '').replace(/<[^>]*>/g, '').replace(/&laquo;|&raquo;/g, '').trim();
}

function Pagination({ links }: { links: PaginationLink[] }) {
    if (!links.length) return null;

    return (
        <div className="flex flex-wrap gap-2 border-t border-[#eadcc2]/80 bg-[#fffaf0]/60 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveScroll
                        className={`rounded-full border px-3 py-2 text-xs font-bold ${
                            link.active
                                ? 'border-[#2f2517] bg-[#2f2517] text-white dark:border-white dark:bg-white dark:text-[#17120b]'
                                : 'border-[#d9c7a6]/70 bg-white text-[#2f2517] hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12'
                        }`}
                        aria-label={paginationLabel(link.label)}
                        dangerouslySetInnerHTML={{ __html: link.label || '' }}
                    />
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="rounded-full border border-[#d9c7a6]/50 bg-white/50 px-3 py-2 text-xs font-bold text-[#8a7a64] dark:border-white/10 dark:bg-white/[0.035] dark:text-white/40"
                        dangerouslySetInnerHTML={{ __html: link.label || '' }}
                    />
                ),
            )}
        </div>
    );
}

function currentBasePath() {
    if (typeof window === 'undefined') return '/admin/rental-options';
    if (window.location.pathname.startsWith('/services')) return '/services';

    return '/admin/rental-options';
}

function optionName(item: RentalOption) {
    return item.name || item.title || 'Untitled rental option';
}

function areaName(item?: VenueArea | null) {
    return item?.name || item?.title || 'Unassigned Area';
}

function money(value: unknown) {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
}

function RentalOptionForm({ selected, areas, mode }: { selected?: RentalOption | null; areas: VenueArea[]; mode: string }) {
    const basePath = currentBasePath();
    const isEdit = mode === 'edit' && Boolean(selected?.id);

    const { data, setData, post, put, processing, errors } = useForm<RentalFormData>({
        service_type_id: String(selected?.service_type_id ?? selected?.venue_area_id ?? selected?.service_type?.id ?? areas[0]?.id ?? ''),
        name: String(selected?.name ?? selected?.title ?? ''),
        description: String(selected?.description ?? ''),
        uom: String(selected?.uom ?? selected?.unit ?? 'day'),
        price: String(selected?.price ?? ''),
        quantity: String(selected?.quantity ?? '1'),
        min_guests: String(selected?.min_guests ?? ''),
        max_guests: String(selected?.max_guests ?? ''),
        capacity_note: String(selected?.capacity_note ?? ''),
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        if (isEdit && selected?.id) {
            put(`${basePath}/${selected.id}`, { preserveScroll: true });
            return;
        }

        post(basePath, { preserveScroll: true });
    }

    return (
        <ResourceSection
            title={isEdit ? 'Edit rental option' : 'Create rental option'}
            eyebrow="Rental Option Form"
            description="Create the service records used by booking: Whole Day, Half Day, and Additional Hours mapped to a venue area."
            actions={
                <Link href={basePath} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>
            }
        >
            <form onSubmit={submit} className="rounded-[1.35rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/75 p-5 shadow-[0_16px_46px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.035]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Venue Area" error={errors.service_type_id}>
                        <select
                            value={data.service_type_id}
                            onChange={(event) => setData('service_type_id', event.target.value)}
                            className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                            required
                        >
                            <option value="">Select venue area</option>
                            {areas.map((area) => (
                                <option key={String(area.id)} value={String(area.id)}>
                                    {areaName(area)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Rental Option Name" error={errors.name}>
                        <input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            placeholder="Example: Whole Day"
                            className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                            required
                        />
                    </Field>

                    <Field label="Unit of Measure" error={errors.uom}>
                        <input
                            value={data.uom}
                            onChange={(event) => setData('uom', event.target.value)}
                            placeholder="day / slot / hour"
                            className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                            required
                        />
                    </Field>

                    <Field label="Price" error={errors.price}>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.price}
                            onChange={(event) => setData('price', event.target.value)}
                            className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                            required
                        />
                    </Field>

                    <Field label="Quantity" error={errors.quantity}>
                        <input
                            type="number"
                            min="1"
                            value={data.quantity}
                            onChange={(event) => setData('quantity', event.target.value)}
                            className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                        />
                    </Field>

                    <Field label="Guest Range" error={errors.min_guests || errors.max_guests}>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                min="0"
                                value={data.min_guests}
                                onChange={(event) => setData('min_guests', event.target.value)}
                                placeholder="Min"
                                className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                            />
                            <input
                                type="number"
                                min="0"
                                value={data.max_guests}
                                onChange={(event) => setData('max_guests', event.target.value)}
                                placeholder="Max"
                                className="min-h-12 rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                            />
                        </div>
                    </Field>

                    <Field label="Description" error={errors.description} className="xl:col-span-2">
                        <textarea
                            value={data.description}
                            onChange={(event) => setData('description', event.target.value)}
                            rows={4}
                            className="rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 py-3 text-sm font-medium text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                            required
                        />
                    </Field>

                    <Field label="Capacity Note" error={errors.capacity_note}>
                        <textarea
                            value={data.capacity_note}
                            onChange={(event) => setData('capacity_note', event.target.value)}
                            rows={4}
                            placeholder="Optional note shown in booking support screens."
                            className="rounded-[0.9rem] border border-[#d9c7a6]/70 bg-white px-4 py-3 text-sm font-medium text-[#21180d] outline-none transition focus:border-[#9d7b3d] focus:ring-4 focus:ring-[#d8b56d]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                        />
                    </Field>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                    <Link href={basePath} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12">
                        Cancel
                    </Link>
                    <button type="submit" disabled={processing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] disabled:opacity-60 dark:bg-white dark:text-[#17120b]">
                        <Save className="h-4 w-4" />
                        {processing ? 'Saving...' : isEdit ? 'Update Option' : 'Create Option'}
                    </button>
                </div>
            </form>
        </ResourceSection>
    );
}

function Field({ label, error, children, className = '' }: { label: string; error?: string; children: ReactNode; className?: string }) {
    return (
        <label className={`grid gap-2 ${className}`}>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">{label}</span>
            {children}
            {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        </label>
    );
}

export default function AdminRentalOptionsIndex() {
    const { props } = usePage<PageProps>();
    const basePath = currentBasePath();
    const mode = String(props.mode ?? 'index');
    const selected = props.service ?? props.rentalOption ?? null;

    const sourceCollection = props.rentalOptions ?? props.services;
    const rows = collection<RentalOption>(sourceCollection);
    const paginationLinks = linksOf(sourceCollection);
    const areas = collection<VenueArea>(props.venueAreas ?? props.serviceTypes);
    const showForm = mode === 'create' || mode === 'edit';
    const assignedCount = rows.filter((item) => item.service_type_id || item.venue_area_id || item.service_type).length;
    const wholeDayCount = rows.filter((item) => optionName(item).toLowerCase().includes('whole')).length;
    const halfDayCount = rows.filter((item) => optionName(item).toLowerCase().includes('half')).length;

    return (
        <ResourcePageShell
            title="Rental Options"
            eyebrow="System Setup"
            icon={PackageCheck}
            breadcrumbs={breadcrumbs}
            subtitle="Manage Whole Day, Half Day, and Additional Hours service records per venue area. These records feed booking and availability selection."
            actions={
                <>
                    <ResourceActionLink href="/admin/venue-areas" variant="secondary">
                        Venue Areas
                    </ResourceActionLink>
                    <ResourceActionLink href={`${basePath}/create`} variant="primary">
                        New Rental Option
                    </ResourceActionLink>
                </>
            }
        >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ResourceStatCard label="Existing Options" value={rows.length} description="Current rental option records." icon={PackageCheck} />
                <ResourceStatCard label="Mapped to Areas" value={assignedCount} description="Options connected to venue areas." icon={Layers3} />
                <ResourceStatCard label="Whole Day" value={wholeDayCount} description="Full-day usage entries." icon={ShieldCheck} />
                <ResourceStatCard label="Half Day" value={halfDayCount} description="AM, PM, or EVE schedule entries." icon={Clock3} />
            </div>

            <div className="mt-5 space-y-5">
                {showForm ? <RentalOptionForm selected={selected} areas={areas} mode={mode} /> : null}

                <ResourceSection
                    title="Configured rental options"
                    eyebrow="Services"
                    description="Each venue area should normally have Whole Day, Half Day, and Additional Hours options."
                    actions={
                        <Link href={`${basePath}/create`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12">
                            <Plus className="h-4 w-4" />
                            Add Option
                        </Link>
                    }
                >
                    <ResourceToolbar searchPlaceholder="Search rental options..." />

                    {rows.length === 0 ? (
                        <ResourceEmptyState
                            icon={PackageCheck}
                            title="No rental options configured"
                            description="Create rental options and map each one to a venue area before finalizing booking and availability behavior."
                        />
                    ) : (
                        <div className="overflow-hidden rounded-[1.35rem] border border-[#d9c7a6]/70 dark:border-white/10">
                            <div className="hidden grid-cols-[1fr_1fr_0.55fr_0.45fr] gap-3 bg-[#f7f0e3] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:bg-white/7 dark:text-[#f1d89b] lg:grid">
                                <span>Rental Option</span>
                                <span>Venue Area</span>
                                <span>Rate</span>
                                <span className="text-right">Actions</span>
                            </div>

                            <div className="max-h-[46rem] divide-y divide-[#eadcc2]/80 overflow-y-auto overscroll-contain dark:divide-white/10">
                                {rows.map((item, index) => (
                                    <article key={item.id ?? index} className="grid gap-3 bg-white/62 px-4 py-4 text-sm dark:bg-white/[0.035] lg:grid-cols-[1fr_1fr_0.55fr_0.45fr] lg:items-center">
                                        <div>
                                            <p className="font-semibold text-[#21180d] dark:text-white">{optionName(item)}</p>
                                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7a6b55] dark:text-white/48">{item.description || 'No description provided.'}</p>
                                        </div>

                                        <p className="font-medium text-[#6e604c] dark:text-white/56">{areaName(item.service_type)}</p>

                                        <div>
                                            <p className="font-semibold text-[#21180d] dark:text-white">{money(item.price)}</p>
                                            <p className="text-xs text-[#7a6b55] dark:text-white/45">per {item.uom || item.unit || 'unit'}</p>
                                        </div>

                                        <div className="flex justify-start gap-2 lg:justify-end">
                                            {item.id ? (
                                                <>
                                                    <Link href={`${basePath}/${item.id}/edit`} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-3 text-xs font-bold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm(`Delete ${optionName(item)}?`)) {
                                                                router.delete(`${basePath}/${item.id}`, { preserveScroll: true });
                                                            }
                                                        }}
                                                        className="inline-flex min-h-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <Pagination links={paginationLinks} />
                        </div>
                    )}
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}
