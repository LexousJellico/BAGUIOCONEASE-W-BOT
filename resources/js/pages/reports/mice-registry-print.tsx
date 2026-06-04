import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Link2, Save, Sheet } from 'lucide-react';
import { useEffect, useMemo } from 'react';

type BookingOption = {
    id: number;
    label: string;
};

type RecordShape = {
    id: number;
    booking_id: number | null;
    btc_group_code: string;
    record_no: number | null;
    establishment_name: string;
    business_type: string;
    seats_unit: string;
    total_employees: number;
    year_recorded: number | null;
    region: string;
    province_huc: string;
    city_municipality: string;
    month_added: string;
    female_employees: number;
    male_employees: number;
    classification: string;
    enterprise_group: string;
    permit_to_engage: boolean;
    dot_accredited: boolean;
    active_member: boolean;
    remarks: string;
};

type Props = {
    mode: 'create' | 'edit';
    record?: RecordShape | null;
    booking_options: BookingOption[];
    prefill_booking_id?: number | null;
    form_meta: {
        enterprise_groups: string[];
        btc_group_codes: string[];
        month_options: string[];
        year_options: number[];
    };
};

type FormShape = {
    booking_id: string;
    btc_group_code: string;
    record_no: string;
    establishment_name: string;
    business_type: string;
    seats_unit: string;
    total_employees: string;
    year_recorded: string;
    region: string;
    province_huc: string;
    city_municipality: string;
    month_added: string;
    female_employees: string;
    male_employees: string;
    classification: string;
    enterprise_group: string;
    permit_to_engage: boolean;
    dot_accredited: boolean;
    active_member: boolean;
    remarks: string;
};

function buildBreadcrumbs(
    mode: Props['mode'],
    recordId?: number | null,
): BreadcrumbItem[] {
    return [
        { title: 'Reports', href: '/reports/mice-registry' },
        { title: 'MICE Registry', href: '/reports/mice-registry' },
        {
            title:
                mode === 'create'
                    ? 'New Survey Entry'
                    : `Edit #${recordId ?? ''}`,
            href:
                mode === 'create'
                    ? '/reports/mice-registry/create'
                    : `/reports/mice-registry/${recordId}/edit`,
        },
    ];
}

function toForm(
    record: Props['record'],
    prefillBookingId?: number | null,
): FormShape {
    return {
        booking_id: String(record?.booking_id ?? prefillBookingId ?? ''),
        btc_group_code: record?.btc_group_code ?? '',
        record_no: record?.record_no ? String(record.record_no) : '',
        establishment_name: record?.establishment_name ?? '',
        business_type: record?.business_type ?? '',
        seats_unit: record?.seats_unit ?? '',
        total_employees: String(record?.total_employees ?? ''),
        year_recorded: record?.year_recorded
            ? String(record.year_recorded)
            : '',
        region: record?.region ?? 'CAR',
        province_huc: record?.province_huc ?? 'Baguio City',
        city_municipality: record?.city_municipality ?? 'Baguio City',
        month_added: record?.month_added ?? '',
        female_employees: String(record?.female_employees ?? 0),
        male_employees: String(record?.male_employees ?? 0),
        classification: record?.classification ?? '',
        enterprise_group: record?.enterprise_group || 'STE',
        permit_to_engage: record?.permit_to_engage ?? false,
        dot_accredited: record?.dot_accredited ?? false,
        active_member: record?.active_member ?? false,
        remarks: record?.remarks ?? '',
    };
}

function FieldError({ error }: { error?: string }) {
    return error ? (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
        </div>
    ) : null;
}

export default function MiceRegistryFormPage({
    mode,
    record = null,
    booking_options,
    prefill_booking_id = null,
    form_meta,
}: Props) {
    const breadcrumbs = useMemo(
        () => buildBreadcrumbs(mode, record?.id),
        [mode, record?.id],
    );

    const form = useForm<FormShape>(toForm(record, prefill_booking_id));

    const computedEmployees = useMemo(() => {
        const female = Number(form.data.female_employees || 0);
        const male = Number(form.data.male_employees || 0);
        return female + male;
    }, [form.data.female_employees, form.data.male_employees]);

    useEffect(() => {
        if (
            !form.data.total_employees ||
            Number(form.data.total_employees) < computedEmployees
        ) {
            form.setData('total_employees', String(computedEmployees));
        }
    }, [computedEmployees, form.data.total_employees, form]);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            booking_id: data.booking_id === '' ? null : Number(data.booking_id),
            record_no: data.record_no === '' ? null : Number(data.record_no),
            total_employees:
                data.total_employees === '' ? 0 : Number(data.total_employees),
            year_recorded:
                data.year_recorded === '' ? null : Number(data.year_recorded),
            female_employees:
                data.female_employees === ''
                    ? 0
                    : Number(data.female_employees),
            male_employees:
                data.male_employees === '' ? 0 : Number(data.male_employees),
            permit_to_engage: data.permit_to_engage ? 1 : 0,
            dot_accredited: data.dot_accredited ? 1 : 0,
            active_member: data.active_member ? 1 : 0,
        }));

        if (mode === 'create') {
            form.post('/reports/mice-registry');
            return;
        }

        form.put(`/reports/mice-registry/${record?.id}`);
    };

    const availableYears =
        form_meta.year_options.length > 0
            ? Array.from(
                  new Set([
                      new Date().getFullYear(),
                      ...form_meta.year_options,
                  ]),
              ).sort((a, b) => b - a)
            : Array.from(
                  { length: 8 },
                  (_, index) => new Date().getFullYear() - index,
              );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={
                    mode === 'create'
                        ? 'New MICE Survey Entry'
                        : 'Edit MICE Registry Entry'
                }
            />

            <div className="space-y-6 p-4 md:p-6">
                <Card className="shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="inline-flex rounded-full border bg-primary/10 px-4 py-2 text-[11px] font-bold tracking-[0.22em] text-primary uppercase">
                                MICE Built-In Survey
                            </div>
                            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                {mode === 'create'
                                    ? 'Create registry entry'
                                    : 'Edit registry entry'}
                            </h1>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                                Use this page as the built-in survey / entry
                                form for the enterprise registry. It feeds the
                                grouped summary and the detailed registry table
                                in the report page.
                            </p>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href="/reports/mice-registry">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to registry report
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Link2 className="h-5 w-5" />
                                    Booking link and registry identity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium">
                                        Linked booking (optional)
                                    </label>
                                    <select
                                        value={form.data.booking_id}
                                        onChange={(event) =>
                                            form.setData(
                                                'booking_id',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="">
                                            No linked booking
                                        </option>
                                        {booking_options.map((option) => (
                                            <option
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError
                                        error={form.errors.booking_id}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        BTC Group Code
                                    </label>
                                    <select
                                        value={form.data.btc_group_code}
                                        onChange={(event) =>
                                            form.setData(
                                                'btc_group_code',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="">
                                            Select BTC group
                                        </option>
                                        {form_meta.btc_group_codes.map(
                                            (option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <FieldError
                                        error={form.errors.btc_group_code}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Record No.
                                    </label>
                                    <Input
                                        value={form.data.record_no}
                                        onChange={(event) =>
                                            form.setData(
                                                'record_no',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Leave blank to auto-number"
                                    />
                                    <FieldError error={form.errors.record_no} />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Enterprise Group
                                    </label>
                                    <select
                                        value={form.data.enterprise_group}
                                        onChange={(event) =>
                                            form.setData(
                                                'enterprise_group',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                        {form_meta.enterprise_groups.map(
                                            (option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <FieldError
                                        error={form.errors.enterprise_group}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Classification
                                    </label>
                                    <Input
                                        value={form.data.classification}
                                        onChange={(event) =>
                                            form.setData(
                                                'classification',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Primary Tourism Enterprise / Secondary Tourism Enterprise"
                                    />
                                    <FieldError
                                        error={form.errors.classification}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Year
                                    </label>
                                    <select
                                        value={form.data.year_recorded}
                                        onChange={(event) =>
                                            form.setData(
                                                'year_recorded',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="">Select year</option>
                                        {availableYears.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError
                                        error={form.errors.year_recorded}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Month Added
                                    </label>
                                    <select
                                        value={form.data.month_added}
                                        onChange={(event) =>
                                            form.setData(
                                                'month_added',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="">Select month</option>
                                        {form_meta.month_options.map(
                                            (month) => (
                                                <option
                                                    key={month}
                                                    value={month}
                                                >
                                                    {month}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <FieldError
                                        error={form.errors.month_added}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sheet className="h-5 w-5" />
                                    Establishment profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Establishment Name
                                    </label>
                                    <Input
                                        value={form.data.establishment_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'establishment_name',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Business / enterprise name"
                                    />
                                    <FieldError
                                        error={form.errors.establishment_name}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Business Type
                                    </label>
                                    <textarea
                                        value={form.data.business_type}
                                        onChange={(event) =>
                                            form.setData(
                                                'business_type',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Hotel, restaurant, venue, transport service, event organizer, etc."
                                        className="min-h-[110px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    />
                                    <FieldError
                                        error={form.errors.business_type}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Seats / Unit
                                    </label>
                                    <Input
                                        value={form.data.seats_unit}
                                        onChange={(event) =>
                                            form.setData(
                                                'seats_unit',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Seats, rooms, units, or capacity descriptor"
                                    />
                                    <FieldError
                                        error={form.errors.seats_unit}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Region
                                    </label>
                                    <Input
                                        value={form.data.region}
                                        onChange={(event) =>
                                            form.setData(
                                                'region',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <FieldError error={form.errors.region} />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Province / HUC
                                    </label>
                                    <Input
                                        value={form.data.province_huc}
                                        onChange={(event) =>
                                            form.setData(
                                                'province_huc',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <FieldError
                                        error={form.errors.province_huc}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        City / Municipality
                                    </label>
                                    <Input
                                        value={form.data.city_municipality}
                                        onChange={(event) =>
                                            form.setData(
                                                'city_municipality',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <FieldError
                                        error={form.errors.city_municipality}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Employees</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Female Employees
                                    </label>
                                    <Input
                                        value={form.data.female_employees}
                                        onChange={(event) =>
                                            form.setData(
                                                'female_employees',
                                                event.target.value,
                                            )
                                        }
                                        type="number"
                                        min={0}
                                    />
                                    <FieldError
                                        error={form.errors.female_employees}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Male Employees
                                    </label>
                                    <Input
                                        value={form.data.male_employees}
                                        onChange={(event) =>
                                            form.setData(
                                                'male_employees',
                                                event.target.value,
                                            )
                                        }
                                        type="number"
                                        min={0}
                                    />
                                    <FieldError
                                        error={form.errors.male_employees}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Total Employees
                                    </label>
                                    <Input
                                        value={form.data.total_employees}
                                        onChange={(event) =>
                                            form.setData(
                                                'total_employees',
                                                event.target.value,
                                            )
                                        }
                                        type="number"
                                        min={0}
                                    />
                                    <FieldError
                                        error={form.errors.total_employees}
                                    />
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Suggested total from female + male:{' '}
                                        {computedEmployees}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Registry Status Flags</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-3">
                                <label className="flex items-center gap-3 rounded-xl border p-4">
                                    <input
                                        type="checkbox"
                                        checked={form.data.permit_to_engage}
                                        onChange={(event) =>
                                            form.setData(
                                                'permit_to_engage',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    <div>
                                        <div className="font-medium">
                                            Permit to Engage
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Mark if permitted to engage in
                                            business
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 rounded-xl border p-4">
                                    <input
                                        type="checkbox"
                                        checked={form.data.dot_accredited}
                                        onChange={(event) =>
                                            form.setData(
                                                'dot_accredited',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    <div>
                                        <div className="font-medium">
                                            DOT Accredited
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Mark if DOT accredited
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 rounded-xl border p-4">
                                    <input
                                        type="checkbox"
                                        checked={form.data.active_member}
                                        onChange={(event) =>
                                            form.setData(
                                                'active_member',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    <div>
                                        <div className="font-medium">
                                            Active Member
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Mark if currently active
                                        </div>
                                    </div>
                                </label>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Remarks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    value={form.data.remarks}
                                    onChange={(event) =>
                                        form.setData(
                                            'remarks',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Additional notes, survey details, permit remarks, accreditation remarks, or internal comments."
                                    className="min-h-[150px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                                />
                                <FieldError error={form.errors.remarks} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            This form feeds the grouped summary and detailed
                            MICE registry report. Record numbers can be
                            auto-generated per BTC group when left blank.
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/reports/mice-registry">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Cancel
                                </Link>
                            </Button>

                            <Button type="submit" disabled={form.processing}>
                                <Save className="mr-2 h-4 w-4" />
                                {form.processing
                                    ? 'Saving...'
                                    : mode === 'create'
                                      ? 'Save MICE survey entry'
                                      : 'Update MICE survey entry'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
