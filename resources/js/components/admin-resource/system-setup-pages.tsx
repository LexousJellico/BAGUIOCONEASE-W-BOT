import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    Building2,
    CheckCircle2,
    Edit3,
    Eye,
    Filter,
    KeyRound,
    Plus,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';

type PaginationLink = {
    url?: string | null;
    label?: string | null;
    active?: boolean;
};

type UserRecord = {
    id: number | string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    roles?: Array<string | { name?: string | null }> | null;
    permissions?: Array<string | { name?: string | null }> | null;
    position?: string | null;
    department?: string | null;
    email_verified_at?: string | null;
    last_login_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type VenueAreaRecord = {
    id: number | string;
    name?: string | null;
    title?: string | null;
    code?: string | null;
    description?: string | null;
    capacity?: number | string | null;
    sort_order?: number | string | null;
    is_active?: boolean | number | string | null;
    services_count?: number | string | null;
    created_at?: string | null;
};

type RentalOptionRecord = {
    id: number | string;
    name?: string | null;
    title?: string | null;
    service_type_id?: number | string | null;
    service_type?: VenueAreaRecord | null;
    area?: string | null;
    description?: string | null;
    rate?: number | string | null;
    price?: number | string | null;
    half_day_rate?: number | string | null;
    whole_day_rate?: number | string | null;
    additional_hour_rate?: number | string | null;
    unit?: string | null;
    sort_order?: number | string | null;
    is_active?: boolean | number | string | null;
    created_at?: string | null;
};

type CollectionLike<T> =
    | T[]
    | { data?: T[]; links?: PaginationLink[] }
    | null
    | undefined;

function collection<T>(value: CollectionLike<T> | unknown): T[] {
    if (Array.isArray(value)) return value as T[];

    if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as { data?: unknown[] }).data)
    ) {
        return (value as { data: T[] }).data;
    }

    return [];
}

function linksOf(value: unknown): PaginationLink[] {
    if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as { links?: PaginationLink[] }).links)
    ) {
        return (value as { links: PaginationLink[] }).links;
    }

    return [];
}

function boolValue(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
}

function money(value: unknown): string {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

function cleanLabel(value?: string | null): string {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compactDate(value?: string | null): string {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
}

function paginationLabel(label?: string | null) {
    return String(label || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&laquo;|&raquo;/g, '')
        .trim();
}

function roleNames(user: UserRecord): string[] {
    if (Array.isArray(user.roles) && user.roles.length > 0) {
        return user.roles
            .map((role) => (typeof role === 'string' ? role : role.name))
            .filter(Boolean) as string[];
    }

    return user.role ? [user.role] : [];
}

function permissionNames(user: UserRecord): string[] {
    if (!Array.isArray(user.permissions)) return [];

    return user.permissions
        .map((permission) =>
            typeof permission === 'string' ? permission : permission.name,
        )
        .filter(Boolean) as string[];
}

function statusChip(active: boolean) {
    return active ? 'alh-status-chip is-good' : 'alh-status-chip is-bad';
}


function areaName(area?: VenueAreaRecord | null): string {
    return String(area?.name || area?.title || 'Venue Area');
}

function rentalName(item: RentalOptionRecord): string {
    return String(item.name || item.title || `Rental Option #${item.id}`);
}

function areaLabel(item: VenueAreaRecord): string {
    return String(item.name || item.title || `Venue Area #${item.id}`);
}

function Pagination({ links }: { links: PaginationLink[] }) {
    if (!links.length) return null;

    return (
        <div className="flex flex-wrap gap-2 border-t border-slate-200 p-5 dark:border-slate-800">
            {links.map((link, index) =>
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
                        aria-label={paginationLabel(link.label)}
                        dangerouslySetInnerHTML={{ __html: link.label || '' }}
                    />
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900/60"
                        dangerouslySetInnerHTML={{ __html: link.label || '' }}
                    />
                ),
            )}
        </div>
    );
}

function SetupKpi({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: ReactNode;
    helper: string;
    icon: typeof Users;
}) {
    return (
        <article className="setup-kpi">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="backend-booking-label">{label}</p>
                    <strong>{value}</strong>
                </div>

                <div className="alh-admin-kpi-icon">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <p>{helper}</p>
        </article>
    );
}

function SetupHero({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow: string;
    title: string;
    description: string;
    actions?: ReactNode;
}) {
    return (
        <section className="setup-hero">
            <div>
                <p className="backend-booking-label">{eyebrow}</p>
                <h1>{title}</h1>
                <span>{description}</span>
            </div>

            {actions ? (
                <div className="flex flex-wrap gap-2">{actions}</div>
            ) : null}
        </section>
    );
}

function SetupPanel({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="setup-panel overflow-hidden">
            <div className="setup-panel-header">
                <div>
                    <p className="backend-booking-label">{eyebrow}</p>
                    <h2>{title}</h2>
                    {description ? <span>{description}</span> : null}
                </div>
            </div>

            {children}
        </section>
    );
}

export function UsersIndexPage() {
    const { props } = usePage() as unknown as {
        props: {
            users?: CollectionLike<UserRecord>;
            filters?: { q?: string; role?: string };
            roles?: string[];
            availableRoles?: string[];
        };
    };

    const users = useMemo(
        () => collection<UserRecord>(props.users),
        [props.users],
    );
    const links = useMemo(() => linksOf(props.users), [props.users]);
    const roles = props.roles || props.availableRoles || [];

    const [q, setQ] = useState(String(props.filters?.q ?? ''));
    const [role, setRole] = useState(String(props.filters?.role ?? ''));

    const verified = users.filter((user) =>
        Boolean(user.email_verified_at),
    ).length;
    const admins = users.filter((user) =>
        roleNames(user).some((item) => item.toLowerCase() === 'admin'),
    ).length;

    function applyFilters(event?: FormEvent) {
        event?.preventDefault();

        router.get(
            '/admin/users',
            {
                q: q || undefined,
                role: role || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function resetFilters() {
        setQ('');
        setRole('');

        router.get(
            '/admin/users',
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function destroy(user: UserRecord) {
        if (!window.confirm(`Delete user "${user.name || user.email}"?`))
            return;

        router.delete(`/admin/users/${user.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <ResourcePageShell
            current="Users"
            eyebrow="System Setup"
            title="Users"
            description="Manage system accounts, roles, and staff access in a clean backend workspace."
        >
            <div className="space-y-5">
                <SetupHero
                    eyebrow="Users & Roles"
                    title="System account management."
                    description="Review admin, manager, staff, and user accounts. Keep the list compact and open each account only when you need full details."
                    actions={
                        <>
                            <Link
                                href="/admin/users/create"
                                className="alh-primary-button"
                            >
                                <Plus className="h-4 w-4" />
                                New User
                            </Link>
                            <Link
                                href="/admin/users/roles"
                                className="alh-secondary-button"
                            >
                                <KeyRound className="h-4 w-4" />
                                Role Matrix
                            </Link>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SetupKpi
                        label="Loaded Users"
                        value={users.length}
                        helper="Users visible in the current page."
                        icon={Users}
                    />
                    <SetupKpi
                        label="Verified"
                        value={verified}
                        helper="Accounts with verified email timestamps."
                        icon={CheckCircle2}
                    />
                    <SetupKpi
                        label="Admins"
                        value={admins}
                        helper="Accounts currently tagged as admin."
                        icon={ShieldCheck}
                    />
                    <SetupKpi
                        label="Roles"
                        value={roles.length}
                        helper="Available role labels returned by the backend."
                        icon={KeyRound}
                    />
                </section>

                <SetupPanel
                    eyebrow="Directory"
                    title={`${users.length} loaded account${users.length === 1 ? '' : 's'}`}
                    description="Use the filters when account lists become large."
                >
                    <form onSubmit={applyFilters} className="setup-filter-grid">
                        <div className="relative xl:col-span-2">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                className="backend-booking-input pl-10"
                                placeholder="Search name, email, department..."
                            />
                        </div>

                        <select
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                            className="backend-booking-input"
                        >
                            <option value="">All roles</option>
                            {roles.map((item) => (
                                <option key={item} value={item}>
                                    {cleanLabel(item)}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            className="alh-primary-button justify-center"
                        >
                            <Filter className="h-4 w-4" />
                            Apply
                        </button>

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="alh-secondary-button justify-center"
                        >
                            <X className="h-4 w-4" />
                            Reset
                        </button>
                    </form>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {users.map((user) => {
                            const userRoles = roleNames(user);

                            return (
                                <article key={user.id} className="setup-row">
                                    <div className="setup-avatar">
                                        <UserRound className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap gap-2">
                                            {userRoles.length > 0 ? (
                                                userRoles.map((item) => (
                                                    <span
                                                        key={item}
                                                        className="alh-status-chip is-public"
                                                    >
                                                        {cleanLabel(item)}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="alh-status-chip">
                                                    No Role
                                                </span>
                                            )}

                                            <span
                                                className={statusChip(
                                                    Boolean(
                                                        user.email_verified_at,
                                                    ),
                                                )}
                                            >
                                                {user.email_verified_at
                                                    ? 'Verified'
                                                    : 'Unverified'}
                                            </span>
                                        </div>

                                        <h3>{user.name || 'Unnamed User'}</h3>
                                        <p>
                                            {user.email || 'No email'} ·{' '}
                                            {user.position ||
                                                user.department ||
                                                'No position set'}
                                        </p>

                                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                                            <div className="alh-admin-mini-box">
                                                <span>Created</span>
                                                <strong>
                                                    {compactDate(
                                                        user.created_at,
                                                    )}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Last Login</span>
                                                <strong>
                                                    {compactDate(
                                                        user.last_login_at,
                                                    )}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Permissions</span>
                                                <strong>
                                                    {
                                                        permissionNames(user)
                                                            .length
                                                    }
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 xl:justify-end">
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            className="alh-admin-neutral-button"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View
                                        </Link>
                                        <Link
                                            href={`/admin/users/${user.id}/edit`}
                                            className="alh-admin-neutral-button"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => destroy(user)}
                                            className="alh-admin-danger-button"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <Pagination links={links} />
                </SetupPanel>
            </div>
        </ResourcePageShell>
    );
}

export function UserFormPage() {
    const { props } = usePage() as unknown as {
        props: {
            user?: UserRecord;
            roles?: string[];
            availableRoles?: string[];
        };
    };

    const user = props.user;
    const roles = props.roles ||
        props.availableRoles || ['admin', 'manager', 'staff', 'user'];
    const isEdit = Boolean(user?.id);
    const currentRoles = roleNames(user || ({ id: '' } as UserRecord));

    const [form, setForm] = useState({
        name: String(user?.name ?? ''),
        email: String(user?.email ?? ''),
        password: '',
        password_confirmation: '',
        position: String(user?.position ?? ''),
        department: String(user?.department ?? ''),
        role: currentRoles[0] || 'user',
    });
    const [saving, setSaving] = useState(false);

    function submit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);

        const payload = {
            ...form,
            password: form.password || undefined,
            password_confirmation: form.password_confirmation || undefined,
            role: form.role,
            roles: [form.role],
        };

        const options = {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        };

        if (isEdit) {
            router.put(`/admin/users/${user?.id}`, payload, options);
            return;
        }

        router.post('/admin/users', payload, options);
    }

    return (
        <ResourcePageShell
            current={isEdit ? 'Edit User' : 'Create User'}
            eyebrow="System Setup"
            title={isEdit ? 'Edit User' : 'Create User'}
            description="Use a focused form for user identity, access role, and basic staff profile information."
        >
            <div className="space-y-5">
                <SetupHero
                    eyebrow="Account Form"
                    title={
                        isEdit
                            ? 'Update system account.'
                            : 'Create a new system account.'
                    }
                    description="Keep role assignments clean. Use the role matrix page for advanced access review."
                    actions={
                        <Link
                            href="/admin/users"
                            className="alh-secondary-button"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Users
                        </Link>
                    }
                />

                <section className="setup-panel overflow-hidden">
                    <div className="setup-panel-header">
                        <div>
                            <p className="backend-booking-label">
                                User Details
                            </p>
                            <h2>
                                {isEdit
                                    ? 'Edit account information'
                                    : 'New account information'}
                            </h2>
                        </div>
                    </div>

                    <form onSubmit={submit} className="setup-form-grid">
                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Full Name
                            </span>
                            <input
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                                required
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">Email</span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        email: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                                required
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Primary Role
                            </span>
                            <select
                                value={form.role}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        role: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            >
                                {roles.map((item) => (
                                    <option key={item} value={item}>
                                        {cleanLabel(item)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Position
                            </span>
                            <input
                                value={form.position}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        position: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Department
                            </span>
                            <input
                                value={form.department}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        department: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            />
                        </label>

                        <div className="hidden md:block" />

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                {isEdit ? 'New Password' : 'Password'}
                            </span>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        password: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                                required={!isEdit}
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Confirm Password
                            </span>
                            <input
                                type="password"
                                value={form.password_confirmation}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        password_confirmation:
                                            event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                                required={!isEdit}
                            />
                        </label>

                        <div className="setup-form-actions md:col-span-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="alh-primary-button justify-center disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {saving
                                    ? 'Saving...'
                                    : isEdit
                                      ? 'Update User'
                                      : 'Create User'}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </ResourcePageShell>
    );
}

export function UserShowPage() {
    const { props } = usePage() as unknown as { props: { user?: UserRecord } };
    const user = props.user;

    if (!user) {
        return (
            <ResourcePageShell
                current="User"
                eyebrow="System Setup"
                title="User Not Found"
                description="The user record could not be loaded."
            >
                <Link href="/admin/users" className="alh-primary-button">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Users
                </Link>
            </ResourcePageShell>
        );
    }

    return (
        <ResourcePageShell
            current="User Details"
            eyebrow="System Setup"
            title={user.name || 'User Details'}
            description="Review account identity, roles, permissions, and login metadata."
        >
            <div className="space-y-5">
                <SetupHero
                    eyebrow="Account Details"
                    title={user.name || 'Unnamed User'}
                    description={`${user.email || 'No email'} · ${roleNames(user).map(cleanLabel).join(', ') || 'No role assigned'}`}
                    actions={
                        <>
                            <Link
                                href="/admin/users"
                                className="alh-secondary-button"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Link>
                            <Link
                                href={`/admin/users/${user.id}/edit`}
                                className="alh-primary-button"
                            >
                                <Edit3 className="h-4 w-4" />
                                Edit
                            </Link>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SetupKpi
                        label="Roles"
                        value={roleNames(user).length}
                        helper={
                            roleNames(user).map(cleanLabel).join(', ') ||
                            'No role'
                        }
                        icon={KeyRound}
                    />
                    <SetupKpi
                        label="Permissions"
                        value={permissionNames(user).length}
                        helper="Permission labels loaded for this user."
                        icon={ShieldCheck}
                    />
                    <SetupKpi
                        label="Verified"
                        value={user.email_verified_at ? 'Yes' : 'No'}
                        helper={compactDate(user.email_verified_at)}
                        icon={CheckCircle2}
                    />
                    <SetupKpi
                        label="Last Login"
                        value={compactDate(user.last_login_at)}
                        helper="Last recorded authentication timestamp."
                        icon={UserRound}
                    />
                </section>

                <SetupPanel eyebrow="Profile" title="Account information">
                    <div className="grid gap-4 p-5 md:grid-cols-2">
                        {[
                            ['Name', user.name],
                            ['Email', user.email],
                            ['Position', user.position],
                            ['Department', user.department],
                            ['Created', compactDate(user.created_at)],
                            ['Updated', compactDate(user.updated_at)],
                        ].map(([label, value]) => (
                            <div key={label} className="alh-admin-mini-box">
                                <span>{label}</span>
                                <strong>{value || 'Not set'}</strong>
                            </div>
                        ))}
                    </div>
                </SetupPanel>

                <SetupPanel eyebrow="Access" title="Roles and permissions">
                    <div className="grid gap-4 p-5 xl:grid-cols-2">
                        <div className="setup-access-card">
                            <h3>Roles</h3>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {roleNames(user).length > 0 ? (
                                    roleNames(user).map((item) => (
                                        <span
                                            key={item}
                                            className="alh-status-chip is-public"
                                        >
                                            {cleanLabel(item)}
                                        </span>
                                    ))
                                ) : (
                                    <span className="alh-status-chip">
                                        No Role
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="setup-access-card">
                            <h3>Permissions</h3>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {permissionNames(user).length > 0 ? (
                                    permissionNames(user).map((item) => (
                                        <span
                                            key={item}
                                            className="booking-mini-pill"
                                        >
                                            {cleanLabel(item)}
                                        </span>
                                    ))
                                ) : (
                                    <span className="booking-mini-pill">
                                        No explicit permissions
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </SetupPanel>
            </div>
        </ResourcePageShell>
    );
}

export function UserRolesPage() {
    const { props } = usePage() as unknown as {
        props: {
            users?: CollectionLike<UserRecord>;
            roles?: string[];
            permissions?: string[];
            availableRoles?: string[];
            availablePermissions?: string[];
        };
    };

    const users = useMemo(
        () => collection<UserRecord>(props.users),
        [props.users],
    );
    const roles = props.roles ||
        props.availableRoles || ['admin', 'manager', 'staff', 'user'];
    const permissions = props.permissions || props.availablePermissions || [];

    const [roleState, setRoleState] = useState<Record<string, string[]>>(() =>
        Object.fromEntries(
            users.map((user) => [String(user.id), roleNames(user)]),
        ),
    );
    const [savingId, setSavingId] = useState<string | number | null>(null);

    function toggleRole(user: UserRecord, role: string) {
        const key = String(user.id);

        setRoleState((current) => {
            const existing = current[key] || [];
            const next = existing.includes(role)
                ? existing.filter((item) => item !== role)
                : [...existing, role];

            return { ...current, [key]: next };
        });
    }

    function save(user: UserRecord) {
        setSavingId(user.id);

        router.put(
            `/admin/users/${user.id}/roles`,
            {
                roles: roleState[String(user.id)] || roleNames(user),
            },
            {
                preserveScroll: true,
                onFinish: () => setSavingId(null),
            },
        );
    }

    return (
        <ResourcePageShell
            current="Role Matrix"
            eyebrow="System Setup"
            title="Users & Roles"
            description="Review account roles in a compact matrix before deeper backend permission work."
        >
            <div className="space-y-5">
                <SetupHero
                    eyebrow="Access Matrix"
                    title="Role assignment workspace."
                    description="Use this page for fast role adjustments. Permission-level backend connection can be tightened after final design polishing."
                    actions={
                        <Link
                            href="/admin/users"
                            className="alh-secondary-button"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Users
                        </Link>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SetupKpi
                        label="Users"
                        value={users.length}
                        helper="Accounts loaded into the matrix."
                        icon={Users}
                    />
                    <SetupKpi
                        label="Roles"
                        value={roles.length}
                        helper="Available role choices."
                        icon={KeyRound}
                    />
                    <SetupKpi
                        label="Permissions"
                        value={permissions.length}
                        helper="Permission labels returned by backend."
                        icon={ShieldCheck}
                    />
                    <SetupKpi
                        label="Admin Role"
                        value={
                            roles.includes('admin') ? 'Available' : 'Missing'
                        }
                        helper="Core administrator role check."
                        icon={CheckCircle2}
                    />
                </section>

                <SetupPanel eyebrow="Matrix" title="Role assignments">
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {users.map((user) => (
                            <article key={user.id} className="setup-role-row">
                                <div>
                                    <h3>{user.name || 'Unnamed User'}</h3>
                                    <p>{user.email || 'No email'}</p>
                                </div>

                                <div className="setup-role-options">
                                    {roles.map((role) => (
                                        <label
                                            key={`${user.id}-${role}`}
                                            className="setup-check-pill"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={(
                                                    roleState[
                                                        String(user.id)
                                                    ] || []
                                                ).includes(role)}
                                                onChange={() =>
                                                    toggleRole(user, role)
                                                }
                                            />
                                            <span>{cleanLabel(role)}</span>
                                        </label>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    disabled={savingId === user.id}
                                    onClick={() => save(user)}
                                    className="alh-primary-button justify-center disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    {savingId === user.id
                                        ? 'Saving...'
                                        : 'Save'}
                                </button>
                            </article>
                        ))}
                    </div>
                </SetupPanel>
            </div>
        </ResourcePageShell>
    );
}

export function VenueAreasPage() {
    const { props } = usePage() as unknown as {
        props: {
            venueAreas?: CollectionLike<VenueAreaRecord>;
            serviceTypes?: CollectionLike<VenueAreaRecord>;
            areas?: CollectionLike<VenueAreaRecord>;
        };
    };

    const raw = props.venueAreas ?? props.serviceTypes ?? props.areas;
    const areas = useMemo(() => collection<VenueAreaRecord>(raw), [raw]);
    const links = useMemo(() => linksOf(raw), [raw]);

    const [form, setForm] = useState({
        id: '',
        name: '',
        code: '',
        description: '',
        capacity: '',
        sort_order: '0',
        is_active: true,
    });
    const [saving, setSaving] = useState(false);

    function reset() {
        setForm({
            id: '',
            name: '',
            code: '',
            description: '',
            capacity: '',
            sort_order: '0',
            is_active: true,
        });
    }

    function edit(area: VenueAreaRecord) {
        setForm({
            id: String(area.id),
            name: String(area.name || area.title || ''),
            code: String(area.code || ''),
            description: String(area.description || ''),
            capacity: String(area.capacity || ''),
            sort_order: String(area.sort_order || '0'),
            is_active: boolValue(area.is_active ?? true),
        });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);

        const payload = {
            name: form.name,
            title: form.name,
            code: form.code,
            description: form.description,
            capacity: form.capacity,
            sort_order: form.sort_order,
            is_active: form.is_active,
        };

        const options = {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: reset,
        };

        if (form.id) {
            router.put(`/admin/venue-areas/${form.id}`, payload, options);
            return;
        }

        router.post('/admin/venue-areas', payload, options);
    }

    function destroy(area: VenueAreaRecord) {
        if (!window.confirm(`Delete venue area "${areaLabel(area)}"?`)) return;

        router.delete(`/admin/venue-areas/${area.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <ResourcePageShell
            current="Venue Areas"
            eyebrow="System Setup"
            title="Venue Areas"
            description="Manage BCCC rentable spaces used by booking availability."
        >
            <div className="space-y-5">
                <SetupHero
                    eyebrow="Venue Areas"
                    title="Rentable spaces and availability areas."
                    description="These are the area labels that must stay synced with booking availability, public calendar, and rental options."
                />

                <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                    <SetupPanel
                        eyebrow="Editor"
                        title={
                            form.id ? 'Edit venue area' : 'Create venue area'
                        }
                    >
                        <form onSubmit={submit} className="setup-side-form">
                            <label className="grid gap-2">
                                <span className="backend-booking-label">
                                    Area Name
                                </span>
                                <input
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    className="backend-booking-input"
                                    required
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="backend-booking-label">
                                    Code
                                </span>
                                <input
                                    value={form.code}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            code: event.target.value,
                                        }))
                                    }
                                    className="backend-booking-input"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="backend-booking-label">
                                    Capacity
                                </span>
                                <input
                                    value={form.capacity}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            capacity: event.target.value,
                                        }))
                                    }
                                    className="backend-booking-input"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="backend-booking-label">
                                    Sort Order
                                </span>
                                <input
                                    value={form.sort_order}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            sort_order: event.target.value,
                                        }))
                                    }
                                    className="backend-booking-input"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="backend-booking-label">
                                    Description
                                </span>
                                <textarea
                                    rows={5}
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                    className="backend-booking-input min-h-[130px] py-3"
                                />
                            </label>

                            <label className="setup-check-pill">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            is_active: event.target.checked,
                                        }))
                                    }
                                />
                                <span>Active</span>
                            </label>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="alh-primary-button justify-center disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving
                                        ? 'Saving...'
                                        : form.id
                                          ? 'Update'
                                          : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="alh-secondary-button justify-center"
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    </SetupPanel>

                    <SetupPanel
                        eyebrow="List"
                        title={`${areas.length} venue area${areas.length === 1 ? '' : 's'}`}
                    >
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {areas.map((area) => (
                                <article
                                    key={area.id}
                                    className="setup-compact-row"
                                >
                                    <div className="setup-avatar">
                                        <Building2 className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap gap-2">
                                            <span
                                                className={statusChip(
                                                    boolValue(
                                                        area.is_active ?? true,
                                                    ),
                                                )}
                                            >
                                                {boolValue(
                                                    area.is_active ?? true,
                                                )
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                            {area.code ? (
                                                <span className="booking-mini-pill">
                                                    {area.code}
                                                </span>
                                            ) : null}
                                        </div>
                                        <h3>{areaLabel(area)}</h3>
                                        <p>
                                            {area.description ||
                                                'No description.'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 xl:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => edit(area)}
                                            className="alh-admin-neutral-button"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => destroy(area)}
                                            className="alh-admin-danger-button"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <Pagination links={links} />
                    </SetupPanel>
                </section>
            </div>
        </ResourcePageShell>
    );
}

export function RentalOptionsPage() {
    const { props } = usePage() as unknown as {
        props: {
            rentalOptions?: CollectionLike<RentalOptionRecord>;
            services?: CollectionLike<RentalOptionRecord>;
            venueAreas?: VenueAreaRecord[];
            serviceTypes?: VenueAreaRecord[];
        };
    };

    const raw = props.rentalOptions ?? props.services;
    const rentals = useMemo(() => collection<RentalOptionRecord>(raw), [raw]);
    const links = useMemo(() => linksOf(raw), [raw]);
    const areas = props.venueAreas || props.serviceTypes || [];

    const [form, setForm] = useState({
        id: '',
        name: '',
        service_type_id: '',
        description: '',
        half_day_rate: '',
        whole_day_rate: '',
        additional_hour_rate: '',
        unit: 'rental',
        sort_order: '0',
        is_active: true,
    });
    const [saving, setSaving] = useState(false);

    function reset() {
        setForm({
            id: '',
            name: '',
            service_type_id: '',
            description: '',
            half_day_rate: '',
            whole_day_rate: '',
            additional_hour_rate: '',
            unit: 'rental',
            sort_order: '0',
            is_active: true,
        });
    }

    function edit(item: RentalOptionRecord) {
        setForm({
            id: String(item.id),
            name: String(item.name || item.title || ''),
            service_type_id: String(
                item.service_type_id || item.service_type?.id || '',
            ),
            description: String(item.description || ''),
            half_day_rate: String(item.half_day_rate || ''),
            whole_day_rate: String(
                item.whole_day_rate || item.price || item.rate || '',
            ),
            additional_hour_rate: String(item.additional_hour_rate || ''),
            unit: String(item.unit || 'rental'),
            sort_order: String(item.sort_order || '0'),
            is_active: boolValue(item.is_active ?? true),
        });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);

        const payload = {
            name: form.name,
            title: form.name,
            service_type_id: form.service_type_id || undefined,
            description: form.description,
            half_day_rate: form.half_day_rate,
            whole_day_rate: form.whole_day_rate,
            additional_hour_rate: form.additional_hour_rate,
            price:
                form.whole_day_rate ||
                form.half_day_rate ||
                form.additional_hour_rate ||
                0,
            rate:
                form.whole_day_rate ||
                form.half_day_rate ||
                form.additional_hour_rate ||
                0,
            unit: form.unit,
            sort_order: form.sort_order,
            is_active: form.is_active,
        };

        const options = {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: reset,
        };

        if (form.id) {
            router.put(`/admin/rental-options/${form.id}`, payload, options);
            return;
        }

        router.post('/admin/rental-options', payload, options);
    }

    function destroy(item: RentalOptionRecord) {
        if (!window.confirm(`Delete rental option "${rentalName(item)}"?`))
            return;

        router.delete(`/admin/rental-options/${item.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <ResourcePageShell
            current="Rental Options"
            eyebrow="System Setup"
            title="Rental Options"
            description="Manage service/rental options under each venue area."
        >
            <div className="space-y-5">
                <SetupHero
                    eyebrow="Rental Options"
                    title="Rates and rental choices."
                    description="Each venue area should have clean, predictable rental options for half day, whole day, and additional hours."
                />

                <section className="grid gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
                    <SetupPanel
                        eyebrow="Editor"
                        title={
                            form.id
                                ? 'Edit rental option'
                                : 'Create rental option'
                        }
                    >
                        <form onSubmit={submit} className="setup-side-form">
                            <label className="grid gap-2">
                                <span className="backend-booking-label">
                                    Rental Name
                                </span>
                                <input
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    className="backend-booking-input"
                                    required
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="backend-booking-label">
                                    Venue Area
                                </span>
                                <select
                                    value={form.service_type_id}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            service_type_id: event.target.value,
                                        }))
                                    }
                                    className="backend-booking-input"
                                >
                                    <option value="">Select venue area</option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.id}>
                                            {areaName(area)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Half Day
                                    </span>
                                    <input
                                        value={form.half_day_rate}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                half_day_rate:
                                                    event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input"
                                    />
                                </label>
                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Whole Day
                                    </span>
                                    <input
                                        value={form.whole_day_rate}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                whole_day_rate:
                                                    event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input"
                                    />
                                </label>
                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Add. Hour
                                    </span>
                                    <input
                                        value={form.additional_hour_rate}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                additional_hour_rate:
                                                    event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input"
                                    />
                                </label>
                            </div>

                            <label className="grid gap-2">
                                <span className="backend-booking-label">
                                    Description
                                </span>
                                <textarea
                                    rows={5}
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                    className="backend-booking-input min-h-[130px] py-3"
                                />
                            </label>

                            <label className="setup-check-pill">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            is_active: event.target.checked,
                                        }))
                                    }
                                />
                                <span>Active</span>
                            </label>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="alh-primary-button justify-center disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving
                                        ? 'Saving...'
                                        : form.id
                                          ? 'Update'
                                          : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="alh-secondary-button justify-center"
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    </SetupPanel>

                    <SetupPanel
                        eyebrow="List"
                        title={`${rentals.length} rental option${rentals.length === 1 ? '' : 's'}`}
                    >
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {rentals.map((item) => (
                                <article
                                    key={item.id}
                                    className="setup-compact-row"
                                >
                                    <div className="setup-avatar">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap gap-2">
                                            <span
                                                className={statusChip(
                                                    boolValue(
                                                        item.is_active ?? true,
                                                    ),
                                                )}
                                            >
                                                {boolValue(
                                                    item.is_active ?? true,
                                                )
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                            <span className="booking-mini-pill">
                                                {item.area ||
                                                    areaName(item.service_type)}
                                            </span>
                                        </div>

                                        <h3>{rentalName(item)}</h3>
                                        <p>
                                            {item.description ||
                                                'No description.'}
                                        </p>

                                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                                            <div className="alh-admin-mini-box">
                                                <span>Half Day</span>
                                                <strong>
                                                    {money(item.half_day_rate)}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Whole Day</span>
                                                <strong>
                                                    {money(
                                                        item.whole_day_rate ||
                                                            item.price ||
                                                            item.rate,
                                                    )}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Additional Hour</span>
                                                <strong>
                                                    {money(
                                                        item.additional_hour_rate,
                                                    )}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 xl:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => edit(item)}
                                            className="alh-admin-neutral-button"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => destroy(item)}
                                            className="alh-admin-danger-button"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <Pagination links={links} />
                    </SetupPanel>
                </section>
            </div>
        </ResourcePageShell>
    );
}
