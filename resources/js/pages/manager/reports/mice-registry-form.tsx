import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    ClipboardList,
    Save,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

type RegistryFormMode = 'create' | 'edit';

type MiceRegistryRecord = {
    id?: number;
    event_name?: string;
    organizer_name?: string;
    organization_type?: string;
    venue?: string;
    event_type?: string;
    event_date_from?: string;
    event_date_to?: string;
    number_of_participants?: number | string;
    local_participants?: number | string;
    foreign_participants?: number | string;
    revenue_generated?: number | string;
    remarks?: string;
};

type Props = {
    mode?: RegistryFormMode;
    record?: MiceRegistryRecord | null;
    submitUrl?: string;
    cancelUrl?: string;
    title?: string;
};

type RegistryFormData = {
    event_name: string;
    organizer_name: string;
    organization_type: string;
    venue: string;
    event_type: string;
    event_date_from: string;
    event_date_to: string;
    number_of_participants: string;
    local_participants: string;
    foreign_participants: string;
    revenue_generated: string;
    remarks: string;
};

const organizationTypes = [
    'Government',
    'Private',
    'Academe',
    'Association',
    'Non-Government Organization',
    'Others',
];

const eventTypes = [
    'Meeting',
    'Incentive',
    'Convention',
    'Exhibition',
    'Conference',
    'Seminar',
    'Training',
    'Workshop',
    'Cultural Event',
    'Other Event',
];

function valueOf(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

export default function MiceRegistryForm({
    mode = 'create',
    record = null,
    submitUrl,
    cancelUrl = '/manager/reports/mice-registry',
    title,
}: Props) {
    const isEdit = mode === 'edit';

    const form = useForm<RegistryFormData>({
        event_name: valueOf(record?.event_name),
        organizer_name: valueOf(record?.organizer_name),
        organization_type: valueOf(record?.organization_type),
        venue: valueOf(record?.venue),
        event_type: valueOf(record?.event_type),
        event_date_from: valueOf(record?.event_date_from),
        event_date_to: valueOf(record?.event_date_to),
        number_of_participants: valueOf(record?.number_of_participants),
        local_participants: valueOf(record?.local_participants),
        foreign_participants: valueOf(record?.foreign_participants),
        revenue_generated: valueOf(record?.revenue_generated),
        remarks: valueOf(record?.remarks),
    });

    const pageTitle =
        title ??
        (isEdit ? 'Edit MICE Registry Record' : 'Create MICE Registry Record');

    const finalSubmitUrl =
        submitUrl ??
        (isEdit && record?.id
            ? `/manager/reports/mice-registry/${record.id}`
            : '/manager/reports/mice-registry');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isEdit) {
            form.put(finalSubmitUrl, {
                preserveScroll: true,
            });
            return;
        }

        form.post(finalSubmitUrl, {
            preserveScroll: true,
        });
    };

    return (
        <ResourcePageShell
            title={pageTitle}
            description="Encode and maintain official MICE-related event information inside the backend workspace."
            eyebrow="Reports / MICE Registry"
            icon={ClipboardList}
            breadcrumbs={[
                { title: 'Reports', href: cancelUrl },
                { title: 'MICE Registry', href: cancelUrl },
                { title: isEdit ? 'Edit Record' : 'Create Record', href: finalSubmitUrl },
            ]}
            actions={
                <Link
                    href={cancelUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8c5a6] bg-white px-5 py-3 text-sm font-semibold text-[#5f4527] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b58a48] hover:bg-[#fff8ec]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Registry
                </Link>
            }
        >
            <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-[#dfd1bb] bg-white/90 p-5 shadow-[0_24px_80px_rgba(57,39,19,0.10)] backdrop-blur md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d4b27a]/50 bg-[#fff8ec] px-4 py-1.5 text-xs font-semibold tracking-[0.24em] text-[#8b6634] uppercase">
                                <ClipboardList className="h-4 w-4" />
                                MICE Report Registry
                            </div>

                            <h1 className="text-2xl font-semibold tracking-tight text-[#2f2418] md:text-3xl">
                                {pageTitle}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#735f46]">
                                Encode and maintain official MICE-related event
                                information for reporting, monitoring, and
                                tourism documentation.
                            </p>
                        </div>

                        <Link
                            href={cancelUrl}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8c5a6] bg-white px-5 py-3 text-sm font-semibold text-[#5f4527] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b58a48] hover:bg-[#fff8ec]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Registry
                        </Link>
                    </div>

                    <form
                        onSubmit={submit}
                        className="rounded-[2rem] border border-[#dfd1bb] bg-white p-5 shadow-[0_24px_80px_rgba(57,39,19,0.10)] md:p-8"
                    >
                        <section className="mb-8">
                            <div className="mb-5 flex items-center gap-3 border-b border-[#eadfce] pb-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5ead8] text-[#8b6634]">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-[#2f2418]">
                                        Event Information
                                    </h2>
                                    <p className="text-sm text-[#7a674f]">
                                        Basic details of the MICE activity.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    label="Event Name"
                                    error={form.errors.event_name}
                                    required
                                >
                                    <input
                                        value={form.data.event_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'event_name',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                        placeholder="Enter event name"
                                    />
                                </Field>

                                <Field
                                    label="Organizer Name"
                                    error={form.errors.organizer_name}
                                    required
                                >
                                    <input
                                        value={form.data.organizer_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'organizer_name',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                        placeholder="Enter organizer name"
                                    />
                                </Field>

                                <Field
                                    label="Organization Type"
                                    error={form.errors.organization_type}
                                >
                                    <select
                                        value={form.data.organization_type}
                                        onChange={(event) =>
                                            form.setData(
                                                'organization_type',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                    >
                                        <option value="">
                                            Select organization type
                                        </option>
                                        {organizationTypes.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field
                                    label="Event Type"
                                    error={form.errors.event_type}
                                >
                                    <select
                                        value={form.data.event_type}
                                        onChange={(event) =>
                                            form.setData(
                                                'event_type',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                    >
                                        <option value="">
                                            Select event type
                                        </option>
                                        {eventTypes.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field
                                    label="Date From"
                                    error={form.errors.event_date_from}
                                    required
                                >
                                    <input
                                        type="date"
                                        value={form.data.event_date_from}
                                        onChange={(event) =>
                                            form.setData(
                                                'event_date_from',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                    />
                                </Field>

                                <Field
                                    label="Date To"
                                    error={form.errors.event_date_to}
                                    required
                                >
                                    <input
                                        type="date"
                                        value={form.data.event_date_to}
                                        onChange={(event) =>
                                            form.setData(
                                                'event_date_to',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                    />
                                </Field>

                                <Field label="Venue" error={form.errors.venue}>
                                    <input
                                        value={form.data.venue}
                                        onChange={(event) =>
                                            form.setData(
                                                'venue',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                        placeholder="Example: Baguio Convention and Cultural Center"
                                    />
                                </Field>
                            </div>
                        </section>

                        <section className="mb-8">
                            <div className="mb-5 flex items-center gap-3 border-b border-[#eadfce] pb-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5ead8] text-[#8b6634]">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-[#2f2418]">
                                        Participants and Revenue
                                    </h2>
                                    <p className="text-sm text-[#7a674f]">
                                        Data used for MICE reporting summaries.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                                <Field
                                    label="Total Participants"
                                    error={form.errors.number_of_participants}
                                >
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.data.number_of_participants}
                                        onChange={(event) =>
                                            form.setData(
                                                'number_of_participants',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                        placeholder="0"
                                    />
                                </Field>

                                <Field
                                    label="Local Participants"
                                    error={form.errors.local_participants}
                                >
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.data.local_participants}
                                        onChange={(event) =>
                                            form.setData(
                                                'local_participants',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                        placeholder="0"
                                    />
                                </Field>

                                <Field
                                    label="Foreign Participants"
                                    error={form.errors.foreign_participants}
                                >
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.data.foreign_participants}
                                        onChange={(event) =>
                                            form.setData(
                                                'foreign_participants',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                        placeholder="0"
                                    />
                                </Field>

                                <Field
                                    label="Revenue Generated"
                                    error={form.errors.revenue_generated}
                                >
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.data.revenue_generated}
                                        onChange={(event) =>
                                            form.setData(
                                                'revenue_generated',
                                                event.target.value,
                                            )
                                        }
                                        className="form-input"
                                        placeholder="0.00"
                                    />
                                </Field>
                            </div>
                        </section>

                        <section>
                            <Field label="Remarks" error={form.errors.remarks}>
                                <textarea
                                    value={form.data.remarks}
                                    onChange={(event) =>
                                        form.setData(
                                            'remarks',
                                            event.target.value,
                                        )
                                    }
                                    className="form-input min-h-32 resize-y"
                                    placeholder="Write additional notes, source remarks, or reporting observations..."
                                />
                            </Field>
                        </section>

                        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#eadfce] pt-6 sm:flex-row sm:items-center sm:justify-end">
                            <Link
                                href={cancelUrl}
                                className="inline-flex items-center justify-center rounded-full border border-[#d8c5a6] bg-white px-6 py-3 text-sm font-semibold text-[#5f4527] transition hover:border-[#b58a48] hover:bg-[#fff8ec]"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7c5428] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(124,84,40,0.28)] transition hover:-translate-y-0.5 hover:bg-[#5f3e1d] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {form.processing
                                    ? 'Saving...'
                                    : isEdit
                                      ? 'Update Record'
                                      : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </div>

            <style>{`
                .form-input {
                    width: 100%;
                    border-radius: 1rem;
                    border: 1px solid #dccdb8;
                    background: #fffdf9;
                    padding: 0.85rem 1rem;
                    font-size: 0.925rem;
                    color: #2f2418;
                    outline: none;
                    transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
                }

                .form-input:focus {
                    border-color: #b58a48;
                    background: #ffffff;
                    box-shadow: 0 0 0 4px rgba(181, 138, 72, 0.16);
                }

                .form-input::placeholder {
                    color: #a3917a;
                }
            `}</style>
        </ResourcePageShell>
    );
}

function Field({
    label,
    error,
    required = false,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#4b3821]">
                {label}
                {required && <span className="ml-1 text-red-600">*</span>}
            </span>

            {children}

            {error && (
                <span className="mt-2 block text-xs font-medium text-red-600">
                    {error}
                </span>
            )}
        </label>
    );
}
