import {
    ResourceActionLink,
    ResourceEmptyState,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
    ResourceToolbar,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { Building2, CheckCircle2, Layers3, UsersRound } from 'lucide-react';

type ServiceType = {
    id?: number | string;
    name?: string | null;
    description?: string | null;
    capacity?: number | string | null;
    min_capacity?: number | null;
    max_capacity?: number | null;
    is_active?: boolean | number | string | null;
    services_count?: number | null;
};

type PageProps = {
    serviceTypes?: ServiceType[] | { data?: ServiceType[] };
    venueAreas?: ServiceType[] | { data?: ServiceType[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Venue Areas', href: '/admin/venue-areas' },
];

function collection<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[];
    }

    if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
        return (value as { data: T[] }).data;
    }

    return [];
}

function activeFlag(item: ServiceType) {
    return item.is_active === true || item.is_active === 1 || item.is_active === '1' || item.is_active === undefined;
}

function capacityLabel(item: ServiceType) {
    if (item.capacity) {
        return String(item.capacity);
    }

    if (item.min_capacity || item.max_capacity) {
        return `${item.min_capacity ?? 0} - ${item.max_capacity ?? '∞'}`;
    }

    return 'Not set';
}

export default function ServiceTypesIndex() {
    const { props } = usePage<PageProps>();
    const rows = collection<ServiceType>(props.serviceTypes ?? props.venueAreas);
    const activeRows = rows.filter(activeFlag);
    const totalServices = rows.reduce((sum, item) => sum + Number(item.services_count ?? 0), 0);

    return (
        <ResourcePageShell
            title="Venue Areas"
            eyebrow="System Setup"
            icon={Building2}
            breadcrumbs={breadcrumbs}
            subtitle="Manage service types as BCCC venue areas. These must stay aligned with the booking form, availability checker, and public facility choices."
            actions={
                <ResourceActionLink href="/admin/venue-areas/create">
                    New Venue Area
                </ResourceActionLink>
            }
        >
            <div className="grid gap-3 md:grid-cols-3">
                <ResourceStatCard label="Total Areas" value={rows.length} description="All configured venue spaces." icon={Building2} />
                <ResourceStatCard label="Active Areas" value={activeRows.length} description="Visible or usable in booking workflows." icon={CheckCircle2} />
                <ResourceStatCard label="Linked Options" value={totalServices} description="Rental services connected to areas." icon={Layers3} />
            </div>

            <div className="mt-5">
                <ResourceSection
                    title="Configured venue spaces"
                    eyebrow="Service Types"
                    description="Use clear venue names such as Full Hall, Main Hall, Foyer & Lobby Area, VIP Lounge, Board Room, Basement, Gallery2600, Grounds & Parking, and Tech Booth."
                    actions={
                        <ResourceActionLink href="/admin/rental-options" variant="secondary">
                            Rental Options
                        </ResourceActionLink>
                    }
                >
                    <ResourceToolbar searchPlaceholder="Search venue areas..." />

                    {rows.length === 0 ? (
                        <ResourceEmptyState
                            icon={Building2}
                            title="No venue areas configured"
                            description="Create venue areas first. Rental options should be connected to these areas so bookings and availability remain synchronized."
                        />
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {rows.map((item, index) => (
                                <article
                                    key={item.id ?? index}
                                    className="rounded-[1.35rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/70 p-4 shadow-[0_14px_40px_rgba(47,37,23,0.06)] dark:border-white/10 dark:bg-white/[0.035]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
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
                                        {item.name || 'Untitled venue area'}
                                    </h3>

                                    <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                        {item.description || 'No description provided.'}
                                    </p>

                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <MiniStat icon={UsersRound} label="Capacity" value={capacityLabel(item)} />
                                        <MiniStat icon={Layers3} label="Options" value={String(item.services_count ?? 0)} />
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}

function MiniStat({
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
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#21180d] dark:text-white">
                {value}
            </p>
        </div>
    );
}
