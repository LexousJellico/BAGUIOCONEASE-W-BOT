import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    compactDate,
    extractCollection,
    extractLinks,
    money,
    numberText,
    textValue,
} from '@/lib/admin-resource-ui';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Banknote,
    Edit3,
    Loader2,
    PackageCheck,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';

type RentalOption = {
    id: number | string;
    service_type_id?: number | string | null;
    service_type?: {
        id?: number | string;
        name?: string | null;
    } | null;
    name?: string | null;
    description?: string | null;
    uom?: string | null;
    price?: number | string | null;
    quantity?: number | string | null;
    min_guests?: number | string | null;
    max_guests?: number | string | null;
    capacity_note?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type VenueArea = {
    id: number | string;
    name?: string | null;
};

type PageProps = {
    workspaceRole?: string;
    services?: unknown;
    rentalOptions?: unknown;
    serviceTypes?: unknown;
    venueAreas?: unknown;
    filters?: {
        q?: string;
    };
};

type RentalOptionForm = {
    service_type_id: string;
    name: string;
    description: string;
    uom: string;
    price: string;
    quantity: string;
    min_guests: string;
    max_guests: string;
    capacity_note: string;
    is_guest_restricted: boolean;
};

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

function areaName(option: RentalOption): string {
    return (
        option.service_type?.name ||
        String(option.service_type_id || 'No area assigned')
    );
}

function hasGuestLimit(option: RentalOption): boolean {
    return Boolean(option.min_guests || option.max_guests);
}

function guestRange(option: RentalOption): string {
    if (!hasGuestLimit(option)) return 'No guest limit';

    const min = option.min_guests || '0';
    const max = option.max_guests || '∞';

    return `${min} - ${max} guests`;
}

function optionHealth(
    option: RentalOption,
): 'ready' | 'missing-price' | 'missing-area' {
    if (!option.service_type_id && !option.service_type?.id)
        return 'missing-area';
    if (Number(option.price ?? 0) <= 0) return 'missing-price';

    return 'ready';
}

function optionHealthBadge(option: RentalOption) {
    const health = optionHealth(option);

    if (health === 'ready') {
        return {
            label: 'Ready',
            className:
                'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
        };
    }

    if (health === 'missing-price') {
        return {
            label: 'Missing price',
            className:
                'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
        };
    }

    return {
        label: 'Missing area',
        className:
            'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300',
    };
}

export function RentalOptionsPage() {
    const { props } = usePage() as unknown as { props: PageProps };

    const options = useMemo(
        () =>
            extractCollection<RentalOption>(
                props.rentalOptions ?? props.services,
            ),
        [props.rentalOptions, props.services],
    );

    const areas = useMemo(
        () =>
            extractCollection<VenueArea>(
                props.venueAreas ?? props.serviceTypes,
            ),
        [props.venueAreas, props.serviceTypes],
    );

    const pageLinks = extractLinks(props.rentalOptions ?? props.services);
    const [editing, setEditing] = useState<RentalOption | null>(null);
    const [q, setQ] = useState(String(props.filters?.q ?? ''));

    const { data, setData, post, put, reset, processing, errors, clearErrors } =
        useForm<RentalOptionForm>({
            service_type_id: '',
            name: '',
            description: '',
            uom: 'event',
            price: '',
            quantity: '1',
            min_guests: '',
            max_guests: '',
            capacity_note: '',
            is_guest_restricted: false,
        });

    const readyCount = options.filter(
        (option) => optionHealth(option) === 'ready',
    ).length;
    const missingPriceCount = options.filter(
        (option) => optionHealth(option) === 'missing-price',
    ).length;
    const totalRates = options.reduce(
        (sum, option) => sum + Number(option.price ?? 0),
        0,
    );

    function startCreate() {
        setEditing(null);
        clearErrors();
        reset();
    }

    function startEdit(option: RentalOption) {
        setEditing(option);
        clearErrors();
        setData(
            'service_type_id',
            textValue(option.service_type_id ?? option.service_type?.id),
        );
        setData('name', textValue(option.name));
        setData('description', textValue(option.description));
        setData('uom', textValue(option.uom || 'event'));
        setData('price', numberText(option.price));
        setData('quantity', numberText(option.quantity || 1));
        setData('min_guests', numberText(option.min_guests));
        setData('max_guests', numberText(option.max_guests));
        setData('capacity_note', textValue(option.capacity_note));
        setData(
            'is_guest_restricted',
            Boolean(option.min_guests || option.max_guests),
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        if (editing) {
            put(`/admin/rental-options/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditing(null);
                    reset();
                },
            });

            return;
        }

        post('/admin/rental-options', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    function destroy(option: RentalOption) {
        const confirmed = window.confirm(
            `Delete "${option.name}"? Existing bookings may still keep historical records.`,
        );

        if (!confirmed) return;

        router.delete(`/admin/rental-options/${option.id}`, {
            preserveScroll: true,
        });
    }

    function search(event: FormEvent) {
        event.preventDefault();

        router.get(
            '/admin/rental-options',
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
            '/admin/rental-options',
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
            current="Rental Options"
            eyebrow="Rate Configuration"
            title="Rental Options"
            description="Configure rentable items, prices, units, capacity guidance, and guest restrictions used by the BCCC booking workflow."
            actions={
                <Button
                    type="button"
                    onClick={startCreate}
                    className="h-10 rounded-lg bg-[#20242b] px-4 text-sm font-semibold text-white hover:bg-[#14181d] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Rental Option
                </Button>
            }
        >
            <div className="space-y-5">
                <section className="grid gap-4 md:grid-cols-4">
                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Total Options</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {options.length}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Rental options loaded.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Ready</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {readyCount}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Options with area and price.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Missing Price</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {missingPriceCount}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Needs pricing review.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Rate Sum</p>
                        <p className="mt-3 text-3xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {money(totalRates)}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Visible total of listed rates.
                        </p>
                    </article>
                </section>

                <section className="grid gap-5 xl:grid-cols-[460px_minmax(0,1fr)]">
                    <aside className="alh-admin-panel h-fit overflow-hidden">
                        <div className="alh-admin-panel-header">
                            <div className="flex items-start gap-3">
                                <div className="alh-admin-action-icon">
                                    <Banknote className="h-5 w-5" />
                                </div>

                                <div>
                                    <Badge
                                        variant="outline"
                                        className="rounded-md border-slate-200 bg-slate-50 text-[11px] font-black tracking-[0.18em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                    >
                                        {editing
                                            ? 'Edit Option'
                                            : 'Create Option'}
                                    </Badge>

                                    <h2 className="mt-3 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                        {editing
                                            ? editing.name || 'Edit Rental'
                                            : 'Rental Details'}
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        Rental options are what users actually
                                        select during booking.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="grid gap-4 p-5">
                            <Field
                                label="Venue Area"
                                error={errors.service_type_id}
                            >
                                <select
                                    value={data.service_type_id}
                                    onChange={(event) =>
                                        setData(
                                            'service_type_id',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-booking-input"
                                >
                                    <option value="">Select venue area</option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.id}>
                                            {area.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Option Name" error={errors.name}>
                                <input
                                    value={data.name}
                                    onChange={(event) =>
                                        setData('name', event.target.value)
                                    }
                                    className="backend-booking-input"
                                    placeholder="Whole Day, Half Day, Additional Hour..."
                                />
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="UOM" error={errors.uom}>
                                    <input
                                        value={data.uom}
                                        onChange={(event) =>
                                            setData('uom', event.target.value)
                                        }
                                        className="backend-booking-input"
                                        placeholder="event"
                                    />
                                </Field>

                                <Field label="Price" error={errors.price}>
                                    <input
                                        value={data.price}
                                        onChange={(event) =>
                                            setData('price', event.target.value)
                                        }
                                        className="backend-booking-input"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                    />
                                </Field>

                                <Field label="Qty" error={errors.quantity}>
                                    <input
                                        value={data.quantity}
                                        onChange={(event) =>
                                            setData(
                                                'quantity',
                                                event.target.value,
                                            )
                                        }
                                        className="backend-booking-input"
                                        inputMode="numeric"
                                    />
                                </Field>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={data.is_guest_restricted}
                                        onChange={(event) =>
                                            setData(
                                                'is_guest_restricted',
                                                event.target.checked,
                                            )
                                        }
                                        className="mt-1"
                                    />
                                    <span>
                                        <strong className="block text-sm font-black text-slate-950 dark:text-white">
                                            Apply guest restriction
                                        </strong>
                                        <small className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                                            Use this only if the option has a
                                            clear minimum or maximum guest
                                            range.
                                        </small>
                                    </span>
                                </label>

                                {data.is_guest_restricted ? (
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Min Guests"
                                            error={errors.min_guests}
                                        >
                                            <input
                                                value={data.min_guests}
                                                onChange={(event) =>
                                                    setData(
                                                        'min_guests',
                                                        event.target.value,
                                                    )
                                                }
                                                className="backend-booking-input"
                                                inputMode="numeric"
                                            />
                                        </Field>

                                        <Field
                                            label="Max Guests"
                                            error={errors.max_guests}
                                        >
                                            <input
                                                value={data.max_guests}
                                                onChange={(event) =>
                                                    setData(
                                                        'max_guests',
                                                        event.target.value,
                                                    )
                                                }
                                                className="backend-booking-input"
                                                inputMode="numeric"
                                            />
                                        </Field>
                                    </div>
                                ) : null}
                            </div>

                            <Field
                                label="Capacity Note"
                                error={errors.capacity_note}
                            >
                                <input
                                    value={data.capacity_note}
                                    onChange={(event) =>
                                        setData(
                                            'capacity_note',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-booking-input"
                                    placeholder="Optional"
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
                                    rows={4}
                                    className="backend-booking-input min-h-[120px] py-3"
                                    placeholder="Short detail shown internally or in forms..."
                                />
                            </Field>

                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-10 flex-1 rounded-lg bg-[#20242b] px-4 text-sm font-semibold text-white hover:bg-[#14181d] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                >
                                    {processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    {editing ? 'Update Option' : 'Save Option'}
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
                                    Rental List
                                </Badge>

                                <h2 className="mt-3 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                    {options.length} rental option
                                    {options.length === 1 ? '' : 's'}
                                </h2>

                                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Keep rates and area links accurate because
                                    booking calculations depend on this data.
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
                                        placeholder="Search rental options..."
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
                            {options.length > 0 ? (
                                options.map((option) => {
                                    const health = optionHealthBadge(option);

                                    return (
                                        <article
                                            key={option.id}
                                            className="alh-admin-config-row"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            health.className
                                                        }
                                                    >
                                                        {health.label}
                                                    </Badge>

                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-md"
                                                    >
                                                        Created{' '}
                                                        {compactDate(
                                                            option.created_at,
                                                        )}
                                                    </Badge>
                                                </div>

                                                <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                                                    {option.name ||
                                                        'Unnamed Option'}
                                                </h3>

                                                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                    {areaName(option)} ·{' '}
                                                    {option.uom || 'unit'}
                                                </p>

                                                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                    {option.description ||
                                                        'No description provided.'}
                                                </p>

                                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                                    <div className="alh-admin-mini-box">
                                                        <span>Rate</span>
                                                        <strong>
                                                            {money(
                                                                option.price,
                                                            )}
                                                        </strong>
                                                    </div>

                                                    <div className="alh-admin-mini-box">
                                                        <span>Quantity</span>
                                                        <strong>
                                                            {option.quantity ??
                                                                1}
                                                        </strong>
                                                    </div>

                                                    <div className="alh-admin-mini-box">
                                                        <span>Guests</span>
                                                        <strong>
                                                            {guestRange(option)}
                                                        </strong>
                                                    </div>
                                                </div>

                                                {option.capacity_note ? (
                                                    <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                                                        {option.capacity_note}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap gap-2 xl:justify-end">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        startEdit(option)
                                                    }
                                                    className="h-9 rounded-lg border-slate-200 bg-white px-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                                >
                                                    <Edit3 className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        destroy(option)
                                                    }
                                                    className="h-9 rounded-lg border-red-200 bg-red-50 px-3 font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </article>
                                    );
                                })
                            ) : (
                                <div className="p-10 text-center">
                                    <Banknote className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                    <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
                                        No rental options found
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        Add rental options so clients and staff
                                        can create bookings properly.
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

                <section className="alh-admin-note">
                    <PackageCheck className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    <div>
                        <p>Configuration rule</p>
                        <span>
                            Venue Areas are the convention spaces. Rental
                            Options are the selectable booking items and rates
                            connected to those areas.
                        </span>
                    </div>
                </section>
            </div>
        </ResourcePageShell>
    );
}
