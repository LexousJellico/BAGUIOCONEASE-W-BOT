import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { workspaceUsersPath } from '@/lib/workspace-paths';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

type UserData = {
    id: number;
    name: string;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    email: string;
    phone_number: string | null;
    organization_name: string | null;
    organization_type: string | null;
    position_title: string | null;
    address_line1: string | null;
    barangay: string | null;
    city_municipality: string | null;
    province: string | null;
    postal_code: string | null;
    country: string | null;
    role?: string | null;
    email_is_verified: boolean;
    email_verified_at: string | null;
    google_id: string | null;
    last_login_at: string | null;
    created_at: string | null;
};

interface EditUserProps {
    user: UserData;
    availableRoles: string[];
}

const organizationTypes = [
    'Government',
    'Private',
    'School',
    'NGO',
    'Individual',
    'Other',
];

export default function EditUser({ user, availableRoles }: EditUserProps) {
    const { data, setData, put, processing, errors } = useForm({
        first_name: user.first_name ?? '',
        middle_name: user.middle_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email,
        phone_number: user.phone_number ?? '',
        organization_name: user.organization_name ?? '',
        organization_type: user.organization_type ?? '',
        position_title: user.position_title ?? '',
        address_line1: user.address_line1 ?? '',
        barangay: user.barangay ?? '',
        city_municipality: user.city_municipality ?? '',
        province: user.province ?? '',
        postal_code: user.postal_code ?? '',
        country: user.country ?? 'Philippines',
        password: '',
        password_confirmation: '',
        role: user.role ?? '',
        email_is_verified: user.email_is_verified,
    });

    const usersIndexUrl = workspaceUsersPath();
    const usersEditUrl = workspaceUsersPath(`${user.id}/edit`);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: usersIndexUrl },
        { title: 'Edit', href: usersEditUrl },
    ];

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(workspaceUsersPath(String(user.id)));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit User - ${user.name}`} />

            <div className="mx-auto max-w-6xl p-6">
                <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Edit User
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Update the richer user profile and backend access
                            details.
                        </p>
                    </div>
                    <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                        <div>
                            <strong>Created:</strong> {user.created_at ?? '—'}
                        </div>
                        <div>
                            <strong>Last login:</strong>{' '}
                            {user.last_login_at ?? '—'}
                        </div>
                        <div>
                            <strong>Google linked:</strong>{' '}
                            {user.google_id ? 'Yes' : 'No'}
                        </div>
                        <div>
                            <strong>Email verified at:</strong>{' '}
                            {user.email_verified_at ?? 'Not verified'}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identity</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First name</Label>
                                <Input
                                    id="first_name"
                                    value={data.first_name}
                                    onChange={(e) =>
                                        setData('first_name', e.target.value)
                                    }
                                    required
                                />
                                {errors.first_name && (
                                    <p className="text-sm text-destructive">
                                        {errors.first_name}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="middle_name">Middle name</Label>
                                <Input
                                    id="middle_name"
                                    value={data.middle_name}
                                    onChange={(e) =>
                                        setData('middle_name', e.target.value)
                                    }
                                />
                                {errors.middle_name && (
                                    <p className="text-sm text-destructive">
                                        {errors.middle_name}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last name</Label>
                                <Input
                                    id="last_name"
                                    value={data.last_name}
                                    onChange={(e) =>
                                        setData('last_name', e.target.value)
                                    }
                                    required
                                />
                                {errors.last_name && (
                                    <p className="text-sm text-destructive">
                                        {errors.last_name}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    required
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone_number">
                                    Phone number
                                </Label>
                                <Input
                                    id="phone_number"
                                    inputMode="numeric"
                                    maxLength={11}
                                    value={data.phone_number}
                                    onChange={(e) =>
                                        setData('phone_number', e.target.value.replace(/\D/g, '').slice(0, 11))
                                    }
                                    placeholder="09171234567"
                                />
                                {errors.phone_number && (
                                    <p className="text-sm text-destructive">
                                        {errors.phone_number}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organization</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="organization_name">
                                    Organization name
                                </Label>
                                <Input
                                    id="organization_name"
                                    value={data.organization_name}
                                    onChange={(e) =>
                                        setData(
                                            'organization_name',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.organization_name && (
                                    <p className="text-sm text-destructive">
                                        {errors.organization_name}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="organization_type">
                                    Organization type
                                </Label>
                                <select
                                    id="organization_type"
                                    value={data.organization_type}
                                    onChange={(e) =>
                                        setData(
                                            'organization_type',
                                            e.target.value,
                                        )
                                    }
                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Select type</option>
                                    {organizationTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {errors.organization_type && (
                                    <p className="text-sm text-destructive">
                                        {errors.organization_type}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2 md:col-span-3">
                                <Label htmlFor="position_title">
                                    Position / Title
                                </Label>
                                <Input
                                    id="position_title"
                                    value={data.position_title}
                                    onChange={(e) =>
                                        setData(
                                            'position_title',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.position_title && (
                                    <p className="text-sm text-destructive">
                                        {errors.position_title}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Address</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="address_line1">
                                    Address line
                                </Label>
                                <Input
                                    id="address_line1"
                                    value={data.address_line1}
                                    onChange={(e) =>
                                        setData('address_line1', e.target.value)
                                    }
                                />
                                {errors.address_line1 && (
                                    <p className="text-sm text-destructive">
                                        {errors.address_line1}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="barangay">Barangay</Label>
                                <Input
                                    id="barangay"
                                    value={data.barangay}
                                    onChange={(e) =>
                                        setData('barangay', e.target.value)
                                    }
                                />
                                {errors.barangay && (
                                    <p className="text-sm text-destructive">
                                        {errors.barangay}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="city_municipality">
                                    City / Municipality
                                </Label>
                                <Input
                                    id="city_municipality"
                                    value={data.city_municipality}
                                    onChange={(e) =>
                                        setData(
                                            'city_municipality',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.city_municipality && (
                                    <p className="text-sm text-destructive">
                                        {errors.city_municipality}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="province">Province</Label>
                                <Input
                                    id="province"
                                    value={data.province}
                                    onChange={(e) =>
                                        setData('province', e.target.value)
                                    }
                                />
                                {errors.province && (
                                    <p className="text-sm text-destructive">
                                        {errors.province}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="postal_code">Postal code</Label>
                                <Input
                                    id="postal_code"
                                    value={data.postal_code}
                                    onChange={(e) =>
                                        setData('postal_code', e.target.value)
                                    }
                                />
                                {errors.postal_code && (
                                    <p className="text-sm text-destructive">
                                        {errors.postal_code}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={data.country}
                                    onChange={(e) =>
                                        setData('country', e.target.value)
                                    }
                                />
                                {errors.country && (
                                    <p className="text-sm text-destructive">
                                        {errors.country}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Access & Security</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="password">New password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave blank to keep the current password.
                                </p>
                                {errors.password && (
                                    <p className="text-sm text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm new password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.password_confirmation && (
                                    <p className="text-sm text-destructive">
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(e) =>
                                        setData('role', e.target.value)
                                    }
                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">No role selected</option>
                                    {availableRoles.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                                {errors.role && (
                                    <p className="text-sm text-destructive">
                                        {errors.role}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 md:mt-7">
                                <Checkbox
                                    id="email_is_verified"
                                    checked={data.email_is_verified}
                                    onCheckedChange={(checked) =>
                                        setData(
                                            'email_is_verified',
                                            checked === true,
                                        )
                                    }
                                />
                                <div className="grid gap-1">
                                    <Label
                                        htmlFor="email_is_verified"
                                        className="cursor-pointer"
                                    >
                                        Email marked as verified
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Turn this off if you want the account to
                                        become unverified again.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-wrap justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href={usersIndexUrl}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
