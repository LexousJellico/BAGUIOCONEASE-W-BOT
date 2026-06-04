import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

type SharedAuthProps = {
    auth: {
        user: {
            name: string;
            display_name?: string;
            first_name?: string | null;
            middle_name?: string | null;
            last_name?: string | null;
            email: string;
            phone_number?: string | null;
            organization_name?: string | null;
            organization_type?: string | null;
            position_title?: string | null;
            address_line1?: string | null;
            barangay?: string | null;
            city_municipality?: string | null;
            province?: string | null;
            postal_code?: string | null;
            country?: string | null;
            email_verified_at?: string | null;
            last_login_at?: string | null;
            google_avatar?: string | null;
        };
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Profile settings', href: '/settings/profile' },
];

function formatDateTime(value?: string | null) {
    if (!value) return '—';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;

    return d.toLocaleString();
}

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedAuthProps>().props;

    const { data, setData, patch, post, processing, errors } = useForm({
        first_name: auth.user.first_name ?? '',
        middle_name: auth.user.middle_name ?? '',
        last_name: auth.user.last_name ?? '',
        email: auth.user.email ?? '',
        phone_number: auth.user.phone_number ?? '',
        organization_name: auth.user.organization_name ?? '',
        organization_type: auth.user.organization_type ?? '',
        position_title: auth.user.position_title ?? '',
        address_line1: auth.user.address_line1 ?? '',
        barangay: auth.user.barangay ?? '',
        city_municipality: auth.user.city_municipality ?? '',
        province: auth.user.province ?? '',
        postal_code: auth.user.postal_code ?? '',
        country: auth.user.country ?? 'Philippines',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        patch('/settings/profile', {
            preserveScroll: true,
        });
    };

    const resendVerification = () => {
        post('/email/verification-notification', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <div className="space-y-6">
                <SettingsLayout>
                    <div className="space-y-6">
                        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                            <HeadingSmall
                                title="Profile information"
                                description="Update your client information, contact details, and account security profile."
                            />

                            <div className="mt-6 grid gap-4 rounded-[2rem] border border-black/5 bg-[#f7f5ef] p-5 md:grid-cols-[96px,1fr] dark:border-white/10 dark:bg-white/5">
                                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white dark:border-white/10 dark:bg-black/20">
                                    {auth.user.google_avatar ? (
                                        <img
                                            src={auth.user.google_avatar}
                                            alt={
                                                auth.user.display_name ??
                                                auth.user.name
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl font-semibold">
                                            {(
                                                auth.user.first_name?.[0] ??
                                                auth.user.name?.[0] ??
                                                'U'
                                            ).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <div className="text-lg font-semibold">
                                            {auth.user.display_name ??
                                                auth.user.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {auth.user.email}
                                        </div>
                                    </div>

                                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                                        <div>
                                            Last login:{' '}
                                            {formatDateTime(
                                                auth.user.last_login_at,
                                            )}
                                        </div>
                                        <div>
                                            Email verification:{' '}
                                            {auth.user.email_verified_at
                                                ? 'Verified'
                                                : 'Pending verification'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={submit} className="mt-6 space-y-8">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                                            Identity
                                        </h3>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="first_name">
                                                First name
                                            </Label>
                                            <Input
                                                id="first_name"
                                                value={data.first_name}
                                                onChange={(e) =>
                                                    setData(
                                                        'first_name',
                                                        e.target.value,
                                                    )
                                                }
                                                autoComplete="given-name"
                                            />
                                            <InputError
                                                message={errors.first_name}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="middle_name">
                                                Middle name
                                            </Label>
                                            <Input
                                                id="middle_name"
                                                value={data.middle_name}
                                                onChange={(e) =>
                                                    setData(
                                                        'middle_name',
                                                        e.target.value,
                                                    )
                                                }
                                                autoComplete="additional-name"
                                            />
                                            <InputError
                                                message={errors.middle_name}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="last_name">
                                                Last name
                                            </Label>
                                            <Input
                                                id="last_name"
                                                value={data.last_name}
                                                onChange={(e) =>
                                                    setData(
                                                        'last_name',
                                                        e.target.value,
                                                    )
                                                }
                                                autoComplete="family-name"
                                            />
                                            <InputError
                                                message={errors.last_name}
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                                            Contact
                                        </h3>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">
                                                Email address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                                autoComplete="email"
                                            />
                                            <InputError
                                                message={errors.email}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="phone_number">
                                                Philippine mobile number
                                            </Label>
                                            <Input
                                                id="phone_number"
                                                type="text"
                                                inputMode="numeric"
                                                value={data.phone_number}
                                                onChange={(e) =>
                                                    setData(
                                                        'phone_number',
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                autoComplete="tel"
                                                maxLength={11}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Digits only. Example:
                                                09171234567
                                            </p>
                                            <InputError
                                                message={errors.phone_number}
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                                            Organization
                                        </h3>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="organization_name">
                                                Organization / company
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
                                            <InputError
                                                message={
                                                    errors.organization_name
                                                }
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="organization_type">
                                                Organization type
                                            </Label>
                                            <Input
                                                id="organization_type"
                                                value={data.organization_type}
                                                onChange={(e) =>
                                                    setData(
                                                        'organization_type',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.organization_type
                                                }
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="position_title">
                                                Position / designation
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
                                            <InputError
                                                message={errors.position_title}
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                                            Address
                                        </h3>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="address_line1">
                                                Address line
                                            </Label>
                                            <Input
                                                id="address_line1"
                                                value={data.address_line1}
                                                onChange={(e) =>
                                                    setData(
                                                        'address_line1',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.address_line1}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="barangay">
                                                Barangay
                                            </Label>
                                            <Input
                                                id="barangay"
                                                value={data.barangay}
                                                onChange={(e) =>
                                                    setData(
                                                        'barangay',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.barangay}
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="city_municipality">
                                                City / municipality
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
                                            <InputError
                                                message={
                                                    errors.city_municipality
                                                }
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="province">
                                                Province
                                            </Label>
                                            <Input
                                                id="province"
                                                value={data.province}
                                                onChange={(e) =>
                                                    setData(
                                                        'province',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.province}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="postal_code">
                                                Postal code
                                            </Label>
                                            <Input
                                                id="postal_code"
                                                value={data.postal_code}
                                                onChange={(e) =>
                                                    setData(
                                                        'postal_code',
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.postal_code}
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            value={data.country}
                                            readOnly
                                            disabled
                                        />
                                        <InputError
                                            message={errors.country}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                                            <p>
                                                Your email address is
                                                unverified.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={resendVerification}
                                                className="mt-2 underline underline-offset-4"
                                            >
                                                Click here to resend the
                                                verification email.
                                            </button>

                                            {status ===
                                                'verification-link-sent' && (
                                                <p className="mt-2">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={processing}>
                                        Save profile
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <DeleteUser />
                    </div>
                </SettingsLayout>
            </div>
        </AppLayout>
    );
}
