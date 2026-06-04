import {
    ResourceActionLink,
    ResourceEmptyState,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    CalendarDays,
    ClipboardList,
    Clock3,
    Eye,
    KeyRound,
    Mail,
    MailCheck,
    MailWarning,
    Pencil,
    ReceiptText,
    Search,
    Trash2,
    UserCog,
    UsersRound,
    X,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type RoleValue = string | { name?: string | null };

type PaginationLink = {
    url?: string | null;
    label?: string | null;
    active?: boolean;
};

type LatestBooking = {
    id?: number | string;
    title?: string | null;
    client?: string | null;
    type_of_event?: string | null;
    company_name?: string | null;
    booking_status?: string | null;
    payment_status?: string | null;
    selected_package_code?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
    services?: string[] | null;
};

type PaginatedUsers = {
    data?: UserRow[];
    links?: PaginationLink[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
};

type UserRow = {
    id?: number | string;
    name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    organization_name?: string | null;
    organization_type?: string | null;
    position_title?: string | null;
    role?: string | null;
    role_name?: string | null;
    roles?: RoleValue[] | null;
    email_verified_at?: string | null;
    last_login_at?: string | null;
    google_id?: string | number | null;
    created_at?: string | null;
    bookings_count?: number | string | null;
    approved_bookings_count?: number | string | null;
    pending_bookings_count?: number | string | null;
    latest_booking?: LatestBooking | null;
};

type PageProps = {
    auth?: {
        user?: {
            id?: number | string | null;
        } | null;
    };
    users?: UserRow[] | PaginatedUsers;
    availableRoles?: string[];
    filters?: {
        q?: string | null;
        search?: string | null;
        role?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Users & Roles', href: '/admin/users' },
];

function paginated(value: PageProps['users']): PaginatedUsers {
    if (Array.isArray(value)) {
        return { data: value };
    }

    if (value && typeof value === 'object') {
        return value;
    }

    return { data: [] };
}

function plainLabel(label?: string | null) {
    if (!label) {
        return '';
    }

    return label
        .replace(/&laquo;/g, '‹')
        .replace(/&raquo;/g, '›')
        .replace(/&amp;/g, '&');
}

function roleLabel(user: UserRow) {
    if (user.role_name || user.role) {
        return user.role_name || user.role || 'User';
    }

    const firstRole = user.roles?.[0];

    if (typeof firstRole === 'string') {
        return firstRole;
    }

    return firstRole?.name || 'User';
}

function normalizedRole(user: UserRow) {
    return roleLabel(user).toLowerCase();
}

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function cleanLabel(value?: string | null) {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roleBadgeClass(role: string) {
    const normalized = role.toLowerCase();

    if (normalized.includes('admin')) {
        return 'bg-[#2f2517] text-white dark:bg-white dark:text-[#17120b]';
    }

    if (normalized.includes('manager')) {
        return 'bg-[#ead6a3] text-[#4a3515] dark:bg-[#f1d89b] dark:text-[#17120b]';
    }

    if (normalized.includes('staff')) {
        return 'bg-[#f4ead8] text-[#7a5a24] dark:bg-white/10 dark:text-[#f1d89b]';
    }

    return 'bg-[#fff8ea] text-[#6e604c] ring-1 ring-[#d9c7a6]/70 dark:bg-white/7 dark:text-white/70 dark:ring-white/10';
}

function statusToneClass(value?: string | null) {
    const normalized = String(value || '').toLowerCase();

    if (['approved', 'confirmed', 'active', 'completed', 'paid', 'verified'].includes(normalized)) {
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/20';
    }

    if (['pending', 'pencil_booked', 'submitted', 'for_review', 'partial', 'unpaid', 'awaiting_downpayment', 'awaiting_balance'].includes(normalized)) {
        return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/20';
    }

    if (['declined', 'cancelled', 'canceled', 'expired', 'rejected', 'failed', 'auto_declined'].includes(normalized)) {
        return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-300/20';
    }

    return 'bg-white text-[#6e604c] ring-[#d9c7a6]/70 dark:bg-white/7 dark:text-white/56 dark:ring-white/10';
}

function formatDate(value?: string | null) {
    if (!value) {
        return '—';
    }

    return value;
}

function servicesLabel(booking?: LatestBooking | null) {
    const services = booking?.services?.filter(Boolean) ?? [];

    if (services.length > 0) {
        return services.slice(0, 3).join(' + ');
    }

    return cleanLabel(booking?.selected_package_code || booking?.type_of_event || booking?.title || 'No booking yet');
}

function bookingTitle(booking?: LatestBooking | null) {
    return booking?.title || booking?.type_of_event || booking?.company_name || 'No booking yet';
}

export default function AdminUsersIndex() {
    const { props } = usePage<PageProps>();
    const safeUsers = useMemo(() => paginated(props.users), [props.users]);
    const users = useMemo(() => safeUsers.data ?? [], [safeUsers.data]);
    const availableRoles = props.availableRoles ?? [];
    const initialSearch = props.filters?.q ?? props.filters?.search ?? '';
    const initialRole = props.filters?.role ?? '';
    const currentUserId = props.auth?.user?.id ?? null;

    const [search, setSearch] = useState(initialSearch);
    const [role, setRole] = useState(initialRole || 'all');
    const [verifyingId, setVerifyingId] = useState<number | string | null>(null);
    const [deletingId, setDeletingId] = useState<number | string | null>(null);

    const stats = useMemo(() => {
        const adminCount = users.filter((user) => normalizedRole(user).includes('admin')).length;
        const managerCount = users.filter((user) => normalizedRole(user).includes('manager')).length;
        const staffCount = users.filter((user) => normalizedRole(user).includes('staff')).length;
        const verifiedCount = users.filter((user) => Boolean(user.email_verified_at)).length;
        const unverifiedCount = users.filter((user) => !user.email_verified_at).length;
        const loadedBookings = users.reduce((sum, user) => sum + numberValue(user.bookings_count), 0);

        return {
            total: safeUsers.total ?? users.length,
            loaded: users.length,
            admins: adminCount,
            managers: managerCount,
            staff: staffCount,
            verified: verifiedCount,
            unverified: unverifiedCount,
            loadedBookings,
        };
    }, [safeUsers.total, users]);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/admin/users',
            {
                q: search.trim() || undefined,
                role: role && role !== 'all' ? role : undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setRole('all');

        router.get(
            '/admin/users',
            {},
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const verifyEmail = (user: UserRow) => {
        if (!user.id || user.email_verified_at) {
            return;
        }

        setVerifyingId(user.id);

        router.post(
            `/admin/users/${user.id}/verify-email`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setVerifyingId(null),
            },
        );
    };

    const deleteUser = (user: UserRow) => {
        if (!user.id || deletingId) {
            return;
        }

        if (currentUserId !== null && String(user.id) === String(currentUserId)) {
            window.alert('You cannot delete your own account.');
            return;
        }

        const label = user.name || user.email || `User #${user.id}`;

        if (!window.confirm(`Delete "${label}"? This account will be removed from the system.`)) {
            return;
        }

        setDeletingId(user.id);

        router.delete(`/admin/users/${user.id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    return (
        <ResourcePageShell
            title="Users & Roles"
            eyebrow="System Setup"
            icon={UsersRound}
            breadcrumbs={breadcrumbs}
            subtitle="Manage administrator, manager, staff, and client accounts with booking-count monitoring, latest reservation visibility, and email verification controls."
            actions={<ResourceActionLink href="/admin/users/create">Add User</ResourceActionLink>}
        >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <ResourceStatCard
                    label="Total Users"
                    value={stats.total}
                    description={`${stats.loaded} loaded on this page.`}
                    icon={UsersRound}
                />

                <ResourceStatCard
                    label="Verified"
                    value={stats.verified}
                    description="Email verified on this page."
                    icon={MailCheck}
                />

                <ResourceStatCard
                    label="Unverified"
                    value={stats.unverified}
                    description="Needs admin action."
                    icon={MailWarning}
                />

                <ResourceStatCard
                    label="Bookings"
                    value={stats.loadedBookings}
                    description="Bookings owned by loaded accounts."
                    icon={ClipboardList}
                />

                <ResourceStatCard
                    label="Managers"
                    value={stats.managers}
                    description="Review and approval accounts."
                    icon={UserCog}
                />

                <ResourceStatCard
                    label="Staff"
                    value={stats.staff}
                    description={`${stats.admins} admin account(s) loaded.`}
                    icon={KeyRound}
                />
            </div>

            <div className="mt-5">
                <ResourceSection
                    title="Account directory"
                    eyebrow="Users"
                    description="Review accounts, check booking activity, inspect latest reservations, and manually verify new users when needed."
                    actions={
                        <ResourceActionLink href="/admin/users/create" variant="secondary">
                            Add User
                        </ResourceActionLink>
                    }
                >
                    <form
                        onSubmit={submitSearch}
                        className="mb-4 grid gap-3 rounded-[1.25rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/70 p-3 dark:border-white/10 dark:bg-white/[0.035] lg:grid-cols-[minmax(0,1fr)_220px_auto_auto] lg:items-center"
                    >
                        <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 dark:border-white/10 dark:bg-white/7">
                            <Search className="h-4 w-4 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search users by name, email, phone, organization, or position..."
                                className="min-w-0 flex-1 bg-transparent text-sm text-[#21180d] outline-none placeholder:text-[#8a7a63] dark:text-white dark:placeholder:text-white/42"
                            />
                        </label>

                        <select
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                            className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] outline-none transition focus:border-[#9d7b3d] dark:border-white/10 dark:bg-white/7 dark:text-white"
                        >
                            <option value="all">All roles</option>
                            {availableRoles.map((roleName) => (
                                <option key={roleName} value={roleName}>
                                    {roleName}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.14)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                        >
                            <Search className="h-4 w-4" />
                            Search
                        </button>

                        {search || (role && role !== 'all') ? (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                            >
                                <X className="h-4 w-4" />
                                Clear
                            </button>
                        ) : null}
                    </form>

                    {users.length === 0 ? (
                        <ResourceEmptyState
                            icon={UsersRound}
                            title="No users found"
                            description="Create user accounts for administrators, managers, staff, and clients."
                        />
                    ) : (
                        <div className="overflow-hidden rounded-[1.25rem] border border-[#d9c7a6]/70 dark:border-white/10">
                            <div className="hidden grid-cols-[0.95fr_1.05fr_0.65fr_1.05fr_0.8fr_0.7fr] gap-3 bg-[#f7f0e3] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:bg-white/7 dark:text-[#f1d89b] 2xl:grid">
                                <span>Name</span>
                                <span>Contact</span>
                                <span>Role</span>
                                <span>Latest Booking</span>
                                <span>Status</span>
                                <span className="text-right">Actions</span>
                            </div>

                            <div className="divide-y divide-[#eadcc2]/80 dark:divide-white/10">
                                {users.map((user, index) => {
                                    const userRole = roleLabel(user);
                                    const verified = Boolean(user.email_verified_at);
                                    const isVerifying = verifyingId === user.id;
                                    const latestBooking = user.latest_booking;
                                    const bookingsCount = numberValue(user.bookings_count);
                                    const approvedCount = numberValue(user.approved_bookings_count);
                                    const pendingCount = numberValue(user.pending_bookings_count);
                                    const isCurrentUser =
                                        currentUserId !== null &&
                                        String(user.id ?? '') ===
                                            String(currentUserId);
                                    const isDeleting = deletingId === user.id;

                                    return (
                                        <article
                                            key={user.id ?? index}
                                            className="grid gap-3 bg-white/62 px-4 py-4 text-sm dark:bg-white/[0.035] 2xl:grid-cols-[0.95fr_1.05fr_0.65fr_1.05fr_0.8fr_0.7fr] 2xl:items-center"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-[#21180d] dark:text-white">
                                                    {user.name || 'Unnamed user'}
                                                </p>

                                                <p className="mt-1 text-xs text-[#7a6b55] dark:text-white/42">
                                                    ID #{user.id ?? '—'} · Created {formatDate(user.created_at)}
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8ea] px-2 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-[#7a5a24] ring-1 ring-[#d9c7a6]/70 dark:bg-white/7 dark:text-[#f1d89b] dark:ring-white/10">
                                                        <ReceiptText className="h-3 w-3" />
                                                        {bookingsCount} booking{bookingsCount === 1 ? '' : 's'}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/20">
                                                        {approvedCount} approved
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-amber-700 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/20">
                                                        {pendingCount} pending
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="min-w-0 space-y-1">
                                                <p className="truncate text-[#6e604c] dark:text-white/64">
                                                    {user.email || 'No email'}
                                                </p>

                                                <p className="truncate text-xs text-[#8a7a63] dark:text-white/42">
                                                    {user.phone_number || 'No phone'}
                                                    {user.organization_name ? ` · ${user.organization_name}` : ''}
                                                </p>

                                                {user.organization_type || user.position_title ? (
                                                    <p className="truncate text-xs text-[#8a7a63] dark:text-white/42">
                                                        {[user.organization_type, user.position_title].filter(Boolean).join(' · ')}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div>
                                                <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold ${roleBadgeClass(userRole)}`}>
                                                    {userRole}
                                                </span>
                                            </div>

                                            <div className="min-w-0 rounded-[1rem] border border-[#eadcc2]/70 bg-[#fffaf0]/70 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                                                {latestBooking ? (
                                                    <>
                                                        <div className="flex items-start gap-2">
                                                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />
                                                            <div className="min-w-0">
                                                                <p className="truncate font-semibold text-[#21180d] dark:text-white">
                                                                    {bookingTitle(latestBooking)}
                                                                </p>
                                                                <p className="mt-1 truncate text-xs text-[#7a6b55] dark:text-white/50">
                                                                    {servicesLabel(latestBooking)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="mt-2 text-xs text-[#8a7a63] dark:text-white/42">
                                                            {formatDate(latestBooking.booking_date_from)} → {formatDate(latestBooking.booking_date_to)}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-[#8a7a63] dark:text-white/45">No booking submitted yet.</p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <span
                                                    className={
                                                        verified
                                                            ? 'inline-flex min-h-8 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/20'
                                                            : 'inline-flex min-h-8 items-center gap-1.5 rounded-full bg-amber-50 px-3 text-xs font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/20'
                                                    }
                                                >
                                                    {verified ? <BadgeCheck className="h-3.5 w-3.5" /> : <MailWarning className="h-3.5 w-3.5" />}
                                                    {verified ? 'Verified' : 'Unverified'}
                                                </span>

                                                {latestBooking?.booking_status ? (
                                                    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold ring-1 ${statusToneClass(latestBooking.booking_status)}`}>
                                                        {cleanLabel(latestBooking.booking_status)}
                                                    </span>
                                                ) : null}

                                                {latestBooking?.payment_status ? (
                                                    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold ring-1 ${statusToneClass(latestBooking.payment_status)}`}>
                                                        {cleanLabel(latestBooking.payment_status)}
                                                    </span>
                                                ) : null}

                                                {user.google_id ? (
                                                    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#f4ead8] px-3 text-xs font-bold text-[#7a5a24] ring-1 ring-[#d9c7a6]/70 dark:bg-white/10 dark:text-[#f1d89b] dark:ring-white/10">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        Google
                                                    </span>
                                                ) : null}

                                                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-[#6e604c] ring-1 ring-[#d9c7a6]/70 dark:bg-white/7 dark:text-white/56 dark:ring-white/10">
                                                    <Clock3 className="h-3.5 w-3.5" />
                                                    Last login {formatDate(user.last_login_at)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap justify-start gap-2 2xl:justify-end">
                                                {!verified && user.id ? (
                                                    <button
                                                        type="button"
                                                        disabled={isVerifying}
                                                        onClick={() => verifyEmail(user)}
                                                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-3 text-xs font-bold text-white transition hover:bg-[#4a3921] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#17120b]"
                                                    >
                                                        <MailCheck className="h-3.5 w-3.5" />
                                                        {isVerifying ? 'Verifying...' : 'Verify email'}
                                                    </button>
                                                ) : null}

                                                {user.id ? (
                                                    <Link
                                                        href={`/admin/users/${user.id}`}
                                                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-[#fffaf0] px-3 text-xs font-bold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        View
                                                    </Link>
                                                ) : null}

                                                {user.id ? (
                                                    <Link
                                                        href={`/admin/users/${user.id}/edit`}
                                                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-3 text-xs font-bold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </Link>
                                                ) : null}

                                                {latestBooking?.id ? (
                                                    <Link
                                                        href={`/admin/bookings/${latestBooking.id}`}
                                                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-[#fffaf0] px-3 text-xs font-bold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                                    >
                                                        <ClipboardList className="h-3.5 w-3.5" />
                                                        Booking
                                                    </Link>
                                                ) : null}

                                                {user.id ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteUser(user)}
                                                        disabled={isCurrentUser || isDeleting}
                                                        title={
                                                            isCurrentUser
                                                                ? 'You cannot delete your own account.'
                                                                : 'Delete user'
                                                        }
                                                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100 dark:hover:bg-rose-400/16"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        {isDeleting
                                                            ? 'Deleting...'
                                                            : 'Delete'}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {safeUsers.links && safeUsers.links.length > 3 ? (
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                            {safeUsers.links.map((link, index) => {
                                const label = plainLabel(link.label);

                                return link.url ? (
                                    <Link
                                        key={`${label}-${index}`}
                                        href={link.url}
                                        preserveScroll
                                        className={
                                            link.active
                                                ? 'inline-flex min-h-9 min-w-9 items-center justify-center rounded-full bg-[#2f2517] px-3 text-xs font-bold text-white dark:bg-white dark:text-[#17120b]'
                                                : 'inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-[#d9c7a6]/70 bg-white px-3 text-xs font-bold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12'
                                        }
                                    >
                                        {label}
                                    </Link>
                                ) : (
                                    <span
                                        key={`${label}-${index}`}
                                        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-[#eadcc2]/70 bg-[#fffaf0]/60 px-3 text-xs font-bold text-[#9b8a72] dark:border-white/10 dark:bg-white/[0.03] dark:text-white/32"
                                    >
                                        {label}
                                    </span>
                                );
                            })}
                        </div>
                    ) : null}
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}
