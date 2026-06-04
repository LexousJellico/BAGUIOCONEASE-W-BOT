import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    FileBarChart,
    Loader2,
    MapPin,
    Save,
    UsersRound,
} from 'lucide-react';
import { FormEvent, useMemo } from 'react';

type MiceRegistryRecord = {
    id?: number | string;

    establishment_name?: string | null;
    business_type?: string | null;
    classification?: string | null;
    enterprise_group?: string | null;

    region?: string | null;
    province_huc?: string | null;
    city_municipality?: string | null;
    barangay?: string | null;
    street_address?: string | null;

    year_recorded?: number | string | null;
    month_added?: string | null;

    total_employees?: number | string | null;
    male_employees?: number | string | null;
    female_employees?: number | string | null;

    permit_to_engage?: boolean | number | string | null;
    dot_accredited?: boolean | number | string | null;
    active_member?: boolean | number | string | null;

    contact_person?: string | null;
    contact_number?: string | null;
    email?: string | null;
    remarks?: string | null;
};

type PageProps = {
    workspaceRole?: string;
    record?: MiceRegistryRecord;
    miceRecord?: MiceRegistryRecord;
    registryRecord?: MiceRegistryRecord;
    row?: MiceRegistryRecord;
    item?: MiceRegistryRecord;
};

type MiceRegistryFormData = {
    establishment_name: string;
    business_type: string;
    classification: string;
    enterprise_group: string;

    region: string;
    province_huc: string;
    city_municipality: string;
    barangay: string;
    street_address: string;

    year_recorded: string;
    month_added: string;

    total_employees: string;
    male_employees: string;
    female_employees: string;

    permit_to_engage: boolean;
    dot_accredited: boolean;
    active_member: boolean;

    contact_person: string;
    contact_number: string;
    email: string;
    remarks: string;
};

function textValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

function boolValue(value: unknown): boolean {
    return (
        value === true ||
        value === 1 ||
        value === '1' ||
        value === 'true' ||
        value === 'yes' ||
        value === 'Yes'
    );
}

function currentRole(workspaceRole?: string | null): 'admin' | 'manager' {
    if (workspaceRole === 'manager') {
        return 'manager';
    }

    if (
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/manager')
    ) {
        return 'manager';
    }

    return 'admin';
}

function basePath(role: 'admin' | 'manager'): string {
    if (role === 'manager') {
        return '/manager/reports/mice-registry';
    }

    return '/admin/reports/mice-registry';
}

function currentYear(): string {
    return String(new Date().getFullYear());
}

function monthOptions() {
    return [
        '',
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
}

function classificationOptions() {
    return [
        '',
        'Convention Center',
        'Accommodation Establishment',
        'Tourism Enterprise',
        'Event Organizer',
        'Travel and Tour Operator',
        'Restaurant / Food Service',
        'Transport Service',
        'Other Tourism-Related Enterprise',
    ];
}

function businessTypeOptions() {
    return [
        '',
        'Private',
        'Government',
        'NGO',
        'Academe',
        'Association',
        'Corporation',
        'Sole Proprietorship',
        'Partnership',
        'Others',
    ];
}

function enterpriseGroupOptions() {
    return [
        '',
        'Micro',
        'Small',
        'Medium',
        'Large',
        'Government',
        'Non-Profit',
        'Others',
    ];
}

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="grid gap-2">
            <span className="backend-admin-label">
                {label}
                {required ? <span className="ml-1 text-red-500">*</span> : null}
            </span>

            {children}

            {error ? (
                <span className="text-xs font-semibold text-red-500">
                    {error}
                </span>
            ) : null}
        </label>
    );
}

function CheckField({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-start gap-3 rounded-2xl border bg-muted/35 p-4">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border"
            />

            <span>
                <span className="block text-sm font-black">{label}</span>

                {description ? (
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {description}
                    </span>
                ) : null}
            </span>
        </label>
    );
}

function SummaryItem({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-2xl border bg-muted/35 p-4">
            <p className="backend-admin-label">{label}</p>
            <p className="mt-2 text-xl font-black tracking-[-0.03em]">
                {value || '—'}
            </p>
        </div>
    );
}

export default function MiceRegistryForm() {
    const { props } = usePage<PageProps>();

    const role = currentRole(props.workspaceRole);
    const path = basePath(role);

    const record = useMemo<MiceRegistryRecord | undefined>(() => {
        return (
            props.record ??
            props.miceRecord ??
            props.registryRecord ??
            props.row ??
            props.item
        );
    }, [
        props.record,
        props.miceRecord,
        props.registryRecord,
        props.row,
        props.item,
    ]);

    const editing = Boolean(record?.id);

    const { data, setData, post, put, processing, errors } =
        useForm<MiceRegistryFormData>({
            establishment_name: textValue(record?.establishment_name),
            business_type: textValue(record?.business_type),
            classification: textValue(record?.classification),
            enterprise_group: textValue(record?.enterprise_group),

            region: textValue(record?.region || 'CAR'),
            province_huc: textValue(record?.province_huc || 'Benguet'),
            city_municipality: textValue(
                record?.city_municipality || 'Baguio City',
            ),
            barangay: textValue(record?.barangay),
            street_address: textValue(record?.street_address),

            year_recorded: textValue(record?.year_recorded || currentYear()),
            month_added: textValue(record?.month_added),

            total_employees: textValue(record?.total_employees),
            male_employees: textValue(record?.male_employees),
            female_employees: textValue(record?.female_employees),

            permit_to_engage: boolValue(record?.permit_to_engage),
            dot_accredited: boolValue(record?.dot_accredited),
            active_member: boolValue(record?.active_member),

            contact_person: textValue(record?.contact_person),
            contact_number: textValue(record?.contact_number),
            email: textValue(record?.email),
            remarks: textValue(record?.remarks),
        });

    const computedTotalEmployees = useMemo(() => {
        const male = Number(data.male_employees || 0);
        const female = Number(data.female_employees || 0);
        const manualTotal = Number(data.total_employees || 0);

        if (male > 0 || female > 0) {
            return male + female;
        }

        return manualTotal;
    }, [data.male_employees, data.female_employees, data.total_employees]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const payload = {
            ...data,
            total_employees: String(
                computedTotalEmployees || data.total_employees || '',
            ),
        };

        setData('total_employees', payload.total_employees);

        if (editing && record?.id) {
            put(`${path}/${record.id}`, {
                preserveScroll: true,
            });

            return;
        }

        post(path, {
            preserveScroll: true,
        });
    }

    return (
        <ResourcePageShell
            role={role}
            current="MICE Registry"
            eyebrow={editing ? 'Edit MICE Record' : 'Create MICE Record'}
            title={
                editing
                    ? 'Edit MICE Registry Record'
                    : 'New MICE Registry Record'
            }
            description="Encode tourism, convention, and MICE registry information using the unified backend workspace design."
            actions={
                <Button asChild variant="outline" className="rounded-full">
                    <Link href={path}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Registry
                    </Link>
                </Button>
            }
        >
            <form
                onSubmit={submit}
                className="grid gap-6 xl:grid-cols-[1fr_380px]"
            >
                <div className="space-y-6">
                    <Card className="backend-admin-card">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="backend-admin-icon">
                                    <Building2 className="h-5 w-5" />
                                </div>

                                <div>
                                    <Badge
                                        variant="outline"
                                        className="border-[#c9a96a]/30 bg-[#c9a96a]/10 text-[#7a5c21] dark:text-[#e8d8b5]"
                                    >
                                        Establishment Details
                                    </Badge>

                                    <CardTitle className="mt-2 text-xl font-black">
                                        Business / Establishment Information
                                    </CardTitle>

                                    <CardDescription>
                                        Basic classification and enterprise
                                        information for the registry.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <Field
                                label="Establishment Name"
                                required
                                error={errors.establishment_name}
                            >
                                <input
                                    value={data.establishment_name}
                                    onChange={(event) =>
                                        setData(
                                            'establishment_name',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                    placeholder="Business or establishment name"
                                />
                            </Field>

                            <Field
                                label="Business Type"
                                error={errors.business_type}
                            >
                                <select
                                    value={data.business_type}
                                    onChange={(event) =>
                                        setData(
                                            'business_type',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                >
                                    {businessTypeOptions().map((option) => (
                                        <option
                                            key={option || 'blank'}
                                            value={option}
                                        >
                                            {option || 'Select business type'}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Classification"
                                error={errors.classification}
                            >
                                <select
                                    value={data.classification}
                                    onChange={(event) =>
                                        setData(
                                            'classification',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                >
                                    {classificationOptions().map((option) => (
                                        <option
                                            key={option || 'blank'}
                                            value={option}
                                        >
                                            {option || 'Select classification'}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Enterprise Group"
                                error={errors.enterprise_group}
                            >
                                <select
                                    value={data.enterprise_group}
                                    onChange={(event) =>
                                        setData(
                                            'enterprise_group',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                >
                                    {enterpriseGroupOptions().map((option) => (
                                        <option
                                            key={option || 'blank'}
                                            value={option}
                                        >
                                            {option ||
                                                'Select enterprise group'}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </CardContent>
                    </Card>

                    <Card className="backend-admin-card">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="backend-admin-icon">
                                    <MapPin className="h-5 w-5" />
                                </div>

                                <div>
                                    <Badge variant="outline">Location</Badge>

                                    <CardTitle className="mt-2 text-xl font-black">
                                        Address and Area
                                    </CardTitle>

                                    <CardDescription>
                                        Location details used for MICE and
                                        tourism reporting.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <Field label="Region" error={errors.region}>
                                <input
                                    value={data.region}
                                    onChange={(event) =>
                                        setData('region', event.target.value)
                                    }
                                    className="backend-admin-input"
                                    placeholder="CAR"
                                />
                            </Field>

                            <Field
                                label="Province / HUC"
                                error={errors.province_huc}
                            >
                                <input
                                    value={data.province_huc}
                                    onChange={(event) =>
                                        setData(
                                            'province_huc',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                    placeholder="Benguet"
                                />
                            </Field>

                            <Field
                                label="City / Municipality"
                                error={errors.city_municipality}
                            >
                                <input
                                    value={data.city_municipality}
                                    onChange={(event) =>
                                        setData(
                                            'city_municipality',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                    placeholder="Baguio City"
                                />
                            </Field>

                            <Field label="Barangay" error={errors.barangay}>
                                <input
                                    value={data.barangay}
                                    onChange={(event) =>
                                        setData('barangay', event.target.value)
                                    }
                                    className="backend-admin-input"
                                    placeholder="Barangay"
                                />
                            </Field>

                            <Field
                                label="Street Address"
                                error={errors.street_address}
                            >
                                <input
                                    value={data.street_address}
                                    onChange={(event) =>
                                        setData(
                                            'street_address',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                    placeholder="Street / building / unit"
                                />
                            </Field>
                        </CardContent>
                    </Card>

                    <Card className="backend-admin-card">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="backend-admin-icon">
                                    <UsersRound className="h-5 w-5" />
                                </div>

                                <div>
                                    <Badge variant="outline">Employment</Badge>

                                    <CardTitle className="mt-2 text-xl font-black">
                                        Employee Count
                                    </CardTitle>

                                    <CardDescription>
                                        Encode total employees or split the
                                        count by male/female employees.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="grid gap-4 md:grid-cols-3">
                            <Field
                                label="Male Employees"
                                error={errors.male_employees}
                            >
                                <input
                                    value={data.male_employees}
                                    onChange={(event) =>
                                        setData(
                                            'male_employees',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                    inputMode="numeric"
                                    placeholder="0"
                                />
                            </Field>

                            <Field
                                label="Female Employees"
                                error={errors.female_employees}
                            >
                                <input
                                    value={data.female_employees}
                                    onChange={(event) =>
                                        setData(
                                            'female_employees',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                    inputMode="numeric"
                                    placeholder="0"
                                />
                            </Field>

                            <Field
                                label="Total Employees"
                                error={errors.total_employees}
                            >
                                <input
                                    value={String(
                                        computedTotalEmployees ||
                                            data.total_employees,
                                    )}
                                    onChange={(event) =>
                                        setData(
                                            'total_employees',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                    inputMode="numeric"
                                    placeholder="0"
                                />
                            </Field>
                        </CardContent>
                    </Card>

                    <Card className="backend-admin-card">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="backend-admin-icon">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>

                                <div>
                                    <Badge variant="outline">Compliance</Badge>

                                    <CardTitle className="mt-2 text-xl font-black">
                                        Permit, Accreditation, and Membership
                                    </CardTitle>

                                    <CardDescription>
                                        Mark applicable compliance and
                                        membership information.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="grid gap-4 md:grid-cols-3">
                            <CheckField
                                label="Permit to Engage"
                                description="Check if the establishment has permit authority to operate or engage."
                                checked={data.permit_to_engage}
                                onChange={(checked) =>
                                    setData('permit_to_engage', checked)
                                }
                            />

                            <CheckField
                                label="DOT Accredited"
                                description="Check if the establishment is DOT-accredited."
                                checked={data.dot_accredited}
                                onChange={(checked) =>
                                    setData('dot_accredited', checked)
                                }
                            />

                            <CheckField
                                label="Active Member"
                                description="Check if the establishment is an active member."
                                checked={data.active_member}
                                onChange={(checked) =>
                                    setData('active_member', checked)
                                }
                            />
                        </CardContent>
                    </Card>

                    <Card className="backend-admin-card">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="backend-admin-icon">
                                    <FileBarChart className="h-5 w-5" />
                                </div>

                                <div>
                                    <Badge variant="outline">
                                        Reporting Details
                                    </Badge>

                                    <CardTitle className="mt-2 text-xl font-black">
                                        Year, Month, Contact, and Notes
                                    </CardTitle>

                                    <CardDescription>
                                        Add reporting period, contact details,
                                        and optional remarks.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <Field
                                label="Year Recorded"
                                error={errors.year_recorded}
                            >
                                <input
                                    value={data.year_recorded}
                                    onChange={(event) =>
                                        setData(
                                            'year_recorded',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                    inputMode="numeric"
                                    placeholder="2026"
                                />
                            </Field>

                            <Field
                                label="Month Added"
                                error={errors.month_added}
                            >
                                <select
                                    value={data.month_added}
                                    onChange={(event) =>
                                        setData(
                                            'month_added',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                >
                                    {monthOptions().map((month) => (
                                        <option
                                            key={month || 'blank'}
                                            value={month}
                                        >
                                            {month || 'Select month'}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Contact Person"
                                error={errors.contact_person}
                            >
                                <input
                                    value={data.contact_person}
                                    onChange={(event) =>
                                        setData(
                                            'contact_person',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                    placeholder="Contact person"
                                />
                            </Field>

                            <Field
                                label="Contact Number"
                                error={errors.contact_number}
                            >
                                <input
                                    value={data.contact_number}
                                    onChange={(event) =>
                                        setData(
                                            'contact_number',
                                            event.target.value,
                                        )
                                    }
                                    className="backend-admin-input"
                                    placeholder="Phone or mobile number"
                                />
                            </Field>

                            <Field label="Email" error={errors.email}>
                                <input
                                    value={data.email}
                                    onChange={(event) =>
                                        setData('email', event.target.value)
                                    }
                                    className="backend-admin-input"
                                    type="email"
                                    placeholder="email@example.com"
                                />
                            </Field>

                            <Field label="Remarks" error={errors.remarks}>
                                <textarea
                                    value={data.remarks}
                                    onChange={(event) =>
                                        setData('remarks', event.target.value)
                                    }
                                    className="backend-admin-input min-h-[110px] py-3"
                                    placeholder="Optional notes"
                                />
                            </Field>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-full"
                        >
                            <Link href={path}>Cancel</Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="rounded-full"
                        >
                            {processing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {editing ? 'Save Changes' : 'Create Record'}
                        </Button>
                    </div>
                </div>

                <aside className="space-y-6">
                    <Card className="backend-admin-card sticky top-24">
                        <CardHeader>
                            <Badge
                                variant="outline"
                                className="w-fit border-[#c9a96a]/30 bg-[#c9a96a]/10 text-[#7a5c21] dark:text-[#e8d8b5]"
                            >
                                Registry Summary
                            </Badge>

                            <CardTitle className="mt-3 text-2xl font-black tracking-[-0.04em]">
                                {data.establishment_name || 'New MICE Record'}
                            </CardTitle>

                            <CardDescription>
                                Quick preview of the encoded registry
                                information.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <SummaryItem
                                label="Classification"
                                value={data.classification || '—'}
                            />
                            <SummaryItem
                                label="Business Type"
                                value={data.business_type || '—'}
                            />
                            <SummaryItem
                                label="Enterprise Group"
                                value={data.enterprise_group || '—'}
                            />
                            <SummaryItem
                                label="Location"
                                value={data.city_municipality || '—'}
                            />
                            <SummaryItem
                                label="Year"
                                value={data.year_recorded || '—'}
                            />
                            <SummaryItem
                                label="Employees"
                                value={computedTotalEmployees || 0}
                            />

                            <Separator />

                            <div className="grid gap-2">
                                <Badge
                                    variant="outline"
                                    className={
                                        data.permit_to_engage
                                            ? 'w-fit border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                                            : 'w-fit border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200'
                                    }
                                >
                                    Permit:{' '}
                                    {data.permit_to_engage ? 'Yes' : 'No'}
                                </Badge>

                                <Badge
                                    variant="outline"
                                    className={
                                        data.dot_accredited
                                            ? 'w-fit border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                                            : 'w-fit border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200'
                                    }
                                >
                                    DOT Accredited:{' '}
                                    {data.dot_accredited ? 'Yes' : 'No'}
                                </Badge>

                                <Badge
                                    variant="outline"
                                    className={
                                        data.active_member
                                            ? 'w-fit border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                                            : 'w-fit border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200'
                                    }
                                >
                                    Active Member:{' '}
                                    {data.active_member ? 'Yes' : 'No'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </form>
        </ResourcePageShell>
    );
}
