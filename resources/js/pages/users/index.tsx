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
import { workspaceUsersPath } from '@/lib/workspace-paths';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { MailCheck, Pencil, Search, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

type User = {
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
    organization_name: string | null;
    organization_type: string | null;
    position_title: string | null;
    email_verified_at: string | null;
    last_login_at: string | null;
    google_id: string | null;
    role: string | null;
    created_at: string | null;
};

type PaginatedUsers = {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

interface UsersIndexProps {
    users?: PaginatedUsers;
    availableRoles?: string[];
    filters?: {
        search?: string;
        role?: string;
    };
}

function formatDateTime(value: string | null) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
}

export default function UsersIndex({
    users,
    availableRoles = [],
    filters,
}: UsersIndexProps) {
    const safeUsers: PaginatedUsers = useMemo(() => users ?? {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        links: [],
    }, [users]);

    const [search, setSearch] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || 'all');
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    const stats = useMemo(() => {
        return {
            total: safeUsers.total,
            verified: safeUsers.data.filter((user) => !!user.email_verified_at)
                .length,
            google: safeUsers.data.filter((user) => !!user.google_id).length,
            admins: safeUsers.data.filter((user) => user.role === 'admin')
                .length,
        };
    }, [safeUsers]);

    const usersIndexUrl = workspaceUsersPath();
    const usersCreateUrl = workspaceUsersPath('create');
    const usersRolesUrl = workspaceUsersPath('roles');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: usersIndexUrl },
    ];

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const params: { search?: string; role?: string } = {};
        if (search.trim()) params.search = search.trim();
        if (roleFilter && roleFilter !== 'all') params.role = roleFilter;
        router.get(usersIndexUrl, params, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function handleClearFilters() {
        setSearch('');
        setRoleFilter('all');
        router.get(usersIndexUrl, {}, { preserveState: true, preserveScroll: true });
    }

    function handleVerifyEmail(user: User) {
        router.post(workspaceUsersPath(`${user.id}/verify-email`), {}, {
            preserveScroll: true,
        });
    }

    function handleDelete() {
        if (!deleteTarget) return;

        router.delete(workspaceUsersPath(String(deleteTarget.id)), {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            User Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Admin-side account records now match the richer
                            profile fields used in the frontend.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={usersRolesUrl}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Manage Roles
                            </Link>
                        </Button>

                        <Button asChild>
                            <Link href={usersCreateUrl}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add User
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="p-5">
                            <div className="text-sm text-muted-foreground">
                                Total Users
                            </div>
                            <div className="mt-2 text-2xl font-bold">
                                {stats.total}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <div className="text-sm text-muted-foreground">
                                Verified on This Page
                            </div>
                            <div className="mt-2 text-2xl font-bold">
                                {stats.verified}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <div className="text-sm text-muted-foreground">
                                Google Accounts on This Page
                            </div>
                            <div className="mt-2 text-2xl font-bold">
                                {stats.google}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <div className="text-sm text-muted-foreground">
                                Admins on This Page
                            </div>
                            <div className="mt-2 text-2xl font-bold">
                                {stats.admins}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleSearch}
                            className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto]"
                        >
                            <Input
                                placeholder="Search by name, email, phone, organization, or position..."
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
                                    <TableHead>Role</TableHead>
                                    <TableHead>Account Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {safeUsers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center text-muted-foreground"
                                        >
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    safeUsers.data.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        ID #{user.id}
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
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1 text-sm">
                                                    <div>
                                                        {user.organization_name ||
                                                            '—'}
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {[
                                                            user.organization_type,
                                                            user.position_title,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' • ') ||
                                                            'No organization details'}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {user.role ? (
                                                    <Badge variant="secondary">
                                                        {user.role}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        No role
                                                    </span>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.email_verified_at ? (
                                                            <Badge>
                                                                Email verified
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">
                                                                Unverified
                                                            </Badge>
                                                        )}
                                                        {user.google_id ? (
                                                            <Badge variant="secondary">
                                                                Google
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">
                                                                Manual
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Last login:{' '}
                                                        {formatDateTime(
                                                            user.last_login_at,
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-sm text-muted-foreground">
                                                {user.created_at ?? '—'}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {!user.email_verified_at ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            type="button"
                                                            title="Mark email as verified"
                                                            onClick={() => handleVerifyEmail(user)}
                                                        >
                                                            <MailCheck className="h-4 w-4" />
                                                        </Button>
                                                    ) : null}

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={workspaceUsersPath(`${user.id}/edit`)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDeleteTarget(
                                                                user,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
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
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete user?"
                description={
                    deleteTarget
                        ? `This will permanently delete ${deleteTarget.name}. This action cannot be undone.`
                        : 'This action cannot be undone.'
                }
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleDelete}
                variant="destructive"
            />
        </AppLayout>
    );
}
