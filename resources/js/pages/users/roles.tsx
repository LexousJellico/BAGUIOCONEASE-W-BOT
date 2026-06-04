import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Search,
    ShieldCheck,
    UserCheck,
    UserCog,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/users' },
    { title: 'Roles', href: '/users/roles' },
];

type RoleUser = {
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
    organization_name: string | null;
    email_verified_at: string | null;
    last_login_at: string | null;
    role: string | null;
    is_self: boolean;
};

type PaginatedUsers = {
    data: RoleUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

interface RolesPageProps {
    users?: PaginatedUsers;
    availableRoles?: string[];
    filters?: {
        search?: string;
        role?: string;
    };
    summary?: {
        total_users: number;
        verified_users: number;
        admin: number;
        manager: number;
        staff: number;
        user: number;
    };
}

function formatDateTime(value: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

export default function RolesPage({
    users,
    availableRoles = [],
    filters,
    summary,
}: RolesPageProps) {
    const safeUsers: PaginatedUsers = useMemo(() => users ?? {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
        links: [],
    }, [users]);

    const safeSummary = useMemo(() => summary ?? {
        total_users: 0,
        verified_users: 0,
        admin: 0,
        manager: 0,
        staff: 0,
        user: 0,
    }, [summary]);

    const [search, setSearch] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || 'all');
    const [draftRoles, setDraftRoles] = useState<Record<number, string>>({});
    const [confirmTarget, setConfirmTarget] = useState<RoleUser | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        setDraftRoles(
            Object.fromEntries(
                safeUsers.data.map((user) => [user.id, user.role ?? '']),
            ),
        );
    }, [safeUsers.data]);

    const stats = useMemo(
        () => [
            {
                label: 'Total Accounts',
                value: safeSummary.total_users,
                icon: Users,
            },
            {
                label: 'Verified Users',
                value: safeSummary.verified_users,
                icon: UserCheck,
            },
            {
                label: 'Admin Accounts',
                value: safeSummary.admin,
                icon: ShieldCheck,
            },
            { label: 'Managers', value: safeSummary.manager, icon: UserCog },
        ],
        [safeSummary],
    );

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const params: { search?: string; role?: string } = {};
        if (search.trim()) params.search = search.trim();
        if (roleFilter && roleFilter !== 'all') params.role = roleFilter;
        router.get('/users/roles', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function handleClearFilters() {
        setSearch('');
        setRoleFilter('all');
        router.get(
            '/users/roles',
            {},
            { preserveState: true, preserveScroll: true },
        );
    }

    function submitRoleUpdate() {
        if (!confirmTarget) return;

        setProcessing(true);
        router.put(
            `/users/${confirmTarget.id}/roles`,
            { role: draftRoles[confirmTarget.id] || '' },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setConfirmTarget(null);
                },
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Assignment" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Role Assignment
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Use this screen for role changes so you do not
                            accidentally lock yourself out of admin access.
                        </p>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/users">Back to Users</Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.label}>
                                <CardContent className="flex items-center justify-between p-5">
                                    <div>
                                        <div className="text-sm text-muted-foreground">
                                            {item.label}
                                        </div>
                                        <div className="mt-2 text-2xl font-bold">
                                            {item.value}
                                        </div>
                                    </div>
                                    <div className="rounded-full bg-muted p-3">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter Accounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleSearch}
                            className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto]"
                        >
                            <Input
                                placeholder="Search by name, email, phone, or organization..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            <Select
                                value={roleFilter}
                                onValueChange={setRoleFilter}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Roles
                                    </SelectItem>
                                    {availableRoles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button type="submit">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>

                            {(search ||
                                (roleFilter && roleFilter !== 'all')) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClearFilters}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Current Role</TableHead>
                                    <TableHead>Assign Role</TableHead>
                                    <TableHead className="text-right">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {safeUsers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center text-muted-foreground"
                                        >
                                            No accounts found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    safeUsers.data.map((user) => {
                                        const selectedRole =
                                            draftRoles[user.id] ?? '';
                                        const changed =
                                            selectedRole !== (user.role ?? '');

                                        return (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium">
                                                            {user.name}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            <Badge variant="outline">
                                                                ID #{user.id}
                                                            </Badge>
                                                            {user.is_self && (
                                                                <Badge>
                                                                    You
                                                                </Badge>
                                                            )}
                                                            {user.email_verified_at ? (
                                                                <Badge variant="secondary">
                                                                    Verified
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline">
                                                                    Unverified
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="space-y-1 text-sm">
                                                        <div>{user.email}</div>
                                                        <div className="text-muted-foreground">
                                                            {user.phone_number ||
                                                                'No phone number'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Last login:{' '}
                                                            {formatDateTime(
                                                                user.last_login_at,
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-sm">
                                                    {user.organization_name ||
                                                        '—'}
                                                </TableCell>

                                                <TableCell>
                                                    {user.role ? (
                                                        <Badge variant="secondary">
                                                            {user.role}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            No role
                                                        </Badge>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <Select
                                                        value={
                                                            selectedRole ||
                                                            '__none__'
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            setDraftRoles(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [user.id]:
                                                                        value ===
                                                                        '__none__'
                                                                            ? ''
                                                                            : value,
                                                                }),
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Select role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__none__">
                                                                No role
                                                            </SelectItem>
                                                            {availableRoles.map(
                                                                (role) => (
                                                                    <SelectItem
                                                                        key={
                                                                            role
                                                                        }
                                                                        value={
                                                                            role
                                                                        }
                                                                    >
                                                                        {role}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <Button
                                                        variant={
                                                            changed
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        disabled={!changed}
                                                        onClick={() =>
                                                            setConfirmTarget(
                                                                user,
                                                            )
                                                        }
                                                    >
                                                        Save Role
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>

                        {safeUsers.last_page > 1 && (
                            <div className="flex flex-col gap-3 border-t px-4 py-4 md:flex-row md:items-center md:justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {safeUsers.data.length} of{' '}
                                    {safeUsers.total} users
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {safeUsers.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url &&
                                                router.visit(link.url)
                                            }
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ConfirmActionDialog
                open={!!confirmTarget}
                onOpenChange={(open) => !open && setConfirmTarget(null)}
                title="Save role change?"
                description={
                    confirmTarget
                        ? `This will update the role for ${confirmTarget.name}.`
                        : 'This will update the selected role.'
                }
                confirmLabel="Save Role"
                variant="default"
                processing={processing}
                onConfirm={submitRoleUpdate}
            />
        </AppLayout>
    );
}
