export type WorkspaceRoleLike =
    | string
    | { name?: string | null }
    | null
    | undefined;

export type WorkspaceAuthLike =
    | {
          user?: {
              name?: string | null;
              email?: string | null;
              roles?: WorkspaceRoleLike[] | null;
              permissions?: string[] | null;
          } | null;
          roles?: WorkspaceRoleLike[] | null;
          permissions?: string[] | null;
      }
    | null
    | undefined;

export type WorkspaceLink = {
    label: string;
    href: string;
    description: string;
};

export type WorkspaceGroup = {
    title: string;
    description: string;
    links: WorkspaceLink[];
};

export const adminWorkspaceGroups: WorkspaceGroup[] = [
    {
        title: 'Public Website Management',
        description:
            'Edit public homepage, facilities, events, calendar, tourism office, contact, guidelines, and visible website content.',
        links: [
            {
                label: 'Content Manager',
                href: '/admin/content',
                description: 'Manage the public website content sections.',
            },
            {
                label: 'Homepage',
                href: '/admin/content?tab=home',
                description:
                    'Edit hero, stats, featured sections, and homepage blocks.',
            },
            {
                label: 'Events',
                href: '/admin/content?tab=events',
                description:
                    'Manage BCCC events and Baguio City event highlights.',
            },
            {
                label: 'Facilities',
                href: '/admin/content?tab=facilities',
                description:
                    'Manage spaces, venue areas, and public facility cards.',
            },
            {
                label: 'Tourism Office',
                href: '/admin/content?tab=tourism-office',
                description:
                    'Manage tourism office profiles and public information.',
            },
            {
                label: 'Contact & Guidelines',
                href: '/admin/guidelines-contacts',
                description:
                    'Manage public contact details, rules, and guidance copy.',
            },
        ],
    },
    {
        title: 'Booking Operations',
        description:
            'Manage venue schedules, bookings, calendar blocks, reservations, and payment compliance.',
        links: [
            {
                label: 'Booking Calendar',
                href: '/admin/calendar',
                description:
                    'View bookings, blocks, public events, and availability.',
            },
            {
                label: 'Manage Calendar',
                href: '/admin/calendar/manage',
                description:
                    'Create unavailable dates, calendar notes, and blocks.',
            },
            {
                label: 'Bookings',
                href: '/admin/bookings',
                description:
                    'Manage all booking records and event reservations.',
            },
            {
                label: 'Payment Review',
                href: '/admin/payments/review',
                description: 'Review payment status and payment compliance.',
            },
            {
                label: 'Booking Operations',
                href: '/admin/bookings/operations',
                description: 'Monitor operational booking and payment actions.',
            },
        ],
    },
    {
        title: 'Reports & Monitoring',
        description:
            'Review analytics, MICE records, audit trails, printable records, and system activity.',
        links: [
            {
                label: 'MICE Registry',
                href: '/admin/reports/mice-registry',
                description:
                    'Open the MICE registry and survey-linked reports.',
            },
            {
                label: 'Booking Analytics',
                href: '/admin/bookings/analytics',
                description: 'Review booking trends and statistics.',
            },
            {
                label: 'Calendar Analytics',
                href: '/admin/calendar/analytics',
                description:
                    'Review calendar usage and blocked/occupied dates.',
            },
            {
                label: 'Booking Audit',
                href: '/admin/bookings/audit',
                description:
                    'Review booking movement and administrative audit records.',
            },
        ],
    },
    {
        title: 'System Setup',
        description:
            'Configure venue areas, rental options, users, roles, and system-level setup.',
        links: [
            {
                label: 'Venue Areas',
                href: '/admin/venue-areas',
                description: 'Manage BCCC rentable spaces and venue areas.',
            },
            {
                label: 'Rental Options',
                href: '/admin/rental-options',
                description: 'Manage rates, services, and booking options.',
            },
            {
                label: 'Users & Roles',
                href: '/admin/users',
                description:
                    'Manage accounts, permissions, and role assignments.',
            },
            {
                label: 'Settings',
                href: '/settings/profile',
                description: 'Update profile and account settings.',
            },
        ],
    },
];

export const managerWorkspaceGroups: WorkspaceGroup[] = [
    {
        title: 'Management Review',
        description:
            'Review approvals, bookings, reports, calendar activity, and payment compliance.',
        links: [
            {
                label: 'Dashboard',
                href: '/manager/dashboard',
                description: 'Open the manager overview.',
            },
            {
                label: 'Calendar',
                href: '/manager/calendar',
                description: 'Review venue schedule and bookings.',
            },
            {
                label: 'Bookings',
                href: '/manager/bookings',
                description: 'Review and update booking records.',
            },
            {
                label: 'Payments',
                href: '/manager/payments/review',
                description: 'Review payment compliance.',
            },
            {
                label: 'MICE Registry',
                href: '/manager/reports/mice-registry',
                description: 'Open MICE records and reporting outputs.',
            },
            {
                label: 'Inquiries',
                href: '/manager/inquiries',
                description: 'Review public inquiries.',
            },
        ],
    },
];

export const staffWorkspaceGroups: WorkspaceGroup[] = [
    {
        title: 'Operations Desk',
        description:
            'Handle daily bookings, inquiries, calendar checking, and client assistance.',
        links: [
            {
                label: 'Dashboard',
                href: '/staff/dashboard',
                description: 'Open the daily operations dashboard.',
            },
            {
                label: 'Calendar',
                href: '/staff/calendar',
                description: 'Check daily schedule and availability.',
            },
            {
                label: 'Bookings',
                href: '/staff/bookings',
                description: 'Create and assist booking records.',
            },
            {
                label: 'Inquiries',
                href: '/staff/inquiries',
                description: 'Handle inquiry follow-ups.',
            },
        ],
    },
];

export const userWorkspaceGroups: WorkspaceGroup[] = [
    {
        title: 'Client Booking',
        description:
            'Browse the public website, start a booking request, and check submitted bookings.',
        links: [
            {
                label: 'Public Website',
                href: '/',
                description: 'Return to the public BCCC website.',
            },
            {
                label: 'Book Event',
                href: '/book',
                description: 'Start a booking request.',
            },
            {
                label: 'My Bookings',
                href: '/my-bookings',
                description: 'View submitted booking records.',
            },
            {
                label: 'Profile',
                href: '/settings/profile',
                description: 'Manage account profile.',
            },
        ],
    },
];

export const frontendWorkspaceLinks: WorkspaceLink[] =
    adminWorkspaceGroups[0].links;

export const backendWorkspaceLinks: WorkspaceLink[] = [
    ...adminWorkspaceGroups[1].links,
    ...adminWorkspaceGroups[2].links,
];

export const adminWorkspaceLinks: WorkspaceLink[] =
    adminWorkspaceGroups.flatMap((group) => group.links);

export const standardAccountLinks: WorkspaceLink[] =
    userWorkspaceGroups.flatMap((group) => group.links);

export function normalizeRoleNames(auth: WorkspaceAuthLike): string[] {
    const raw = auth?.roles ?? auth?.user?.roles ?? [];

    if (!Array.isArray(raw)) return [];

    return raw
        .map((role) => {
            if (typeof role === 'string') return role;
            if (
                role &&
                typeof role === 'object' &&
                typeof role.name === 'string'
            )
                return role.name;
            return '';
        })
        .filter(Boolean)
        .map((role) => String(role).trim().toLowerCase());
}

export function normalizePermissions(auth: WorkspaceAuthLike): string[] {
    const raw = auth?.permissions ?? auth?.user?.permissions ?? [];

    if (!Array.isArray(raw)) return [];

    return raw
        .map((permission) => String(permission).trim().toLowerCase())
        .filter(Boolean);
}

export function hasBackendWorkspaceAccess(auth: WorkspaceAuthLike): boolean {
    const roles = normalizeRoleNames(auth);
    return roles.some((role) => ['admin', 'manager', 'staff'].includes(role));
}

export function canManageCalendarBlocks(auth: WorkspaceAuthLike): boolean {
    const roles = normalizeRoleNames(auth);
    return roles.some((role) => ['admin', 'manager'].includes(role));
}

export function getPrimaryWorkspaceRole(
    auth: WorkspaceAuthLike,
): 'admin' | 'manager' | 'staff' | 'user' {
    const roles = normalizeRoleNames(auth);

    if (roles.includes('admin')) return 'admin';
    if (roles.includes('manager')) return 'manager';
    if (roles.includes('staff')) return 'staff';

    return 'user';
}

export function getWorkspaceGroups(auth: WorkspaceAuthLike): WorkspaceGroup[] {
    const role = getPrimaryWorkspaceRole(auth);

    if (role === 'admin') return adminWorkspaceGroups;
    if (role === 'manager') return managerWorkspaceGroups;
    if (role === 'staff') return staffWorkspaceGroups;

    return userWorkspaceGroups;
}

export function getWorkspaceBadgeText(
    name?: string | null,
    auth?: WorkspaceAuthLike,
): string {
    const role = getPrimaryWorkspaceRole(auth);

    if (role === 'admin') return 'AD';
    if (role === 'manager') return 'MG';
    if (role === 'staff') return 'ST';

    const parts = String(name ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (parts.length === 0) return 'US';

    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

export function getWorkspaceModeLabel(auth: WorkspaceAuthLike): string {
    const role = getPrimaryWorkspaceRole(auth);

    if (role === 'admin') return 'Administrator Workspace';
    if (role === 'manager') return 'Manager Workspace';
    if (role === 'staff') return 'Staff Workspace';

    return 'Client Booking Account';
}

export function getWorkspaceSummary(auth: WorkspaceAuthLike): string {
    const role = getPrimaryWorkspaceRole(auth);

    if (role === 'admin') {
        return 'Full control for public website content, bookings, reports, setup, and user management.';
    }

    if (role === 'manager') {
        return 'Review workspace for bookings, payments, reports, inquiries, and calendar monitoring.';
    }

    if (role === 'staff') {
        return 'Operations workspace for daily bookings, inquiries, and calendar coordination.';
    }

    return 'Signed-in client account for event booking and booking status checking.';
}
