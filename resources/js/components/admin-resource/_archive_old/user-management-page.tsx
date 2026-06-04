import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    cleanLabel,
    compactDate,
    extractCollection,
    extractLinks,
} from '@/lib/admin-resource-ui';
import { Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Edit3,
    Mail,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
    UsersRound,
    XCircle,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

type UserRecord = {
    id: number | string;
    name?: string | null;
    email?: string | null;
    organization_name?: string | null;
    position_title?: string | null;
    roles?: Array<string | { name?: string | null }>;
    created_at?: string | null;
    email_verified_at?: string | null;
};

type PageProps = {
    workspaceRole?: string;
    users?: unknown;
    filters?: {
        q?: string;
    };
};

function roleNames(user: UserRecord): string[] {
    if (!Array.isArray(user.roles)) return [];

    return user.roles
        .map((role) => (typeof role === 'string' ? role : role?.name))
        .filter(Boolean)
        .map((role) => String(role));
}

function initials(user: UserRecord): string {
    const source = user.name || user.email || 'User';

    return source
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

function verified(user: UserRecord): boolean {
    return Boolean(user.email_verified_at);
}

function roleCount(users: UserRecord[], roleName: string): number {
    return users.filter((user) =>
        roleNames(user)
            .map((role) => role.toLowerCase())
            .includes(roleName),
    ).length;
}

export function UserManagementPage() {
    const { props } = usePage() as unknown as { props: PageProps };
    const users = useMemo(
        () => extractCollection<UserRecord>(props.users),
        [props.users],
    );
    const pageLinks = extractLinks(props.users);
    const [q, setQ] = useState(String(props.filters?.q ?? ''));

    const verifiedCount = users.filter(verified).length;
    const adminCount = roleCount(users, 'admin');
    const managerCount = roleCount(users, 'manager');
    const staffCount = roleCount(users, 'staff');

    function destroy(user: UserRecord) {
        const confirmed = window.confirm(
            `Delete user "${user.name || user.email}"? This cannot be undone.`,
        );

        if (!confirmed) return;

        router.delete(`/admin/users/${user.id}`, {
            preserveScroll: true,
        });
    }

    function search(event: FormEvent) {
        event.preventDefault();

        router.get(
            '/admin/users',
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
            '/admin/users',
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
            current="Users"
            eyebrow="Access Configuration"
            title="User Management"
            description="Manage administrator, manager, staff, and client accounts using a clean access-control workspace."
            actions={
                <div className="flex flex-wrap gap-2">
                    <Button
                        asChild
                        className="h-10 rounded-lg bg-[#20242b] px-4 text-sm font-semibold text-white hover:bg-[#14181d] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        <Link href="/admin/users/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New User
                        </Link>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        <Link href="/admin/users/roles">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Role Matrix
                        </Link>
                    </Button>
                </div>
            }
        >
            <div className="space-y-5">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Total Users</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {users.length}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Loaded accounts.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Verified</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {verifiedCount}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Accounts with verified email.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Admins</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {adminCount}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            System administrators.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Managers</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {managerCount}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Review workspaces.
                        </p>
                    </article>

                    <article className="alh-admin-kpi-card">
                        <p className="backend-booking-label">Staff</p>
                        <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                            {staffCount}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Operations accounts.
                        </p>
                    </article>
                </section>

                <section className="alh-admin-panel overflow-hidden">
                    <div className="alh-admin-panel-header flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <Badge
                                variant="outline"
                                className="rounded-md border-slate-200 bg-slate-50 text-[11px] font-black tracking-[0.18em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            >
                                Account Directory
                            </Badge>

                            <h2 className="mt-3 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                {users.length} user
                                {users.length === 1 ? '' : 's'}
                            </h2>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Keep access roles minimal and correct. Admin,
                                manager, staff, and client flows should not be
                                mixed unless intentional.
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
                                    placeholder="Search users..."
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
                        {users.length > 0 ? (
                            users.map((user) => {
                                const roles = roleNames(user);

                                return (
                                    <article
                                        key={user.id}
                                        className="alh-admin-user-row"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#20242b] text-sm font-black text-white dark:bg-white dark:text-slate-950">
                                                    {initials(user)}
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="truncate text-xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">
                                                        {user.name ||
                                                            'Unnamed User'}
                                                    </h3>

                                                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                        <Mail className="h-4 w-4" />
                                                        {user.email ||
                                                            'No email'}
                                                    </p>

                                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                        {user.organization_name ||
                                                            'No organization'}{' '}
                                                        ·{' '}
                                                        {user.position_title ||
                                                            'No position title'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {roles.length > 0 ? (
                                                    roles.map((role) => (
                                                        <Badge
                                                            key={role}
                                                            variant="outline"
                                                            className="rounded-md border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                                        >
                                                            {cleanLabel(role)}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-md border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
                                                    >
                                                        No role
                                                    </Badge>
                                                )}

                                                <Badge
                                                    variant="outline"
                                                    className="rounded-md"
                                                >
                                                    Created{' '}
                                                    {compactDate(
                                                        user.created_at,
                                                    )}
                                                </Badge>

                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        verified(user)
                                                            ? 'rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                                                            : 'rounded-md border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
                                                    }
                                                >
                                                    {verified(user) ? (
                                                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                                    ) : (
                                                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                                    )}
                                                    {verified(user)
                                                        ? 'Verified'
                                                        : 'Unverified'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 xl:justify-end">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="h-9 rounded-lg border-slate-200 bg-white px-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                            >
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                >
                                                    <UserRound className="mr-2 h-4 w-4" />
                                                    View
                                                </Link>
                                            </Button>

                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="h-9 rounded-lg border-slate-200 bg-white px-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                            >
                                                <Link
                                                    href={`/admin/users/${user.id}/edit`}
                                                >
                                                    <Edit3 className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => destroy(user)}
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
                                <UsersRound className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
                                    No users found
                                </h3>
                                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Create administrator, manager, staff, or
                                    client user accounts from here.
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
                </section>

                <section className="alh-admin-note">
                    <ShieldCheck className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    <div>
                        <p>Access rule</p>
                        <span>
                            Keep high-permission roles limited. Admin controls
                            content, users, configuration, bookings, payments,
                            and reports.
                        </span>
                    </div>
                </section>
            </div>
        </ResourcePageShell>
    );
}
