import {
    BarChart3,
    Building2,
    CalendarDays,
    ClipboardList,
    CreditCard,
    FileBarChart,
    Home,
    Inbox,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    SlidersHorizontal,
    Users,
} from 'lucide-react';

export type RoleKey = 'admin' | 'manager' | 'staff' | 'user';

export type RoleWorkspaceLink = {
    title: string;
    href: string;
    icon: typeof LayoutDashboard;
    permission?: string;
    description?: string;
};

export type RoleWorkspace = {
    role: RoleKey;
    label: string;
    badge: string;
    homeHref: string;
    description: string;
    links: RoleWorkspaceLink[];
};

export const roleWorkspaces: Record<RoleKey, RoleWorkspace> = {
    admin: {
        role: 'admin',
        label: 'Administrator',
        badge: 'Full Control',
        homeHref: '/admin/dashboard',
        description:
            'Full system control for content, bookings, reports, users, setup, and public website management.',
        links: [
            {
                title: 'Dashboard',
                href: '/admin/dashboard',
                icon: LayoutDashboard,
                permission: 'dashboard.view',
                description:
                    'Executive overview and high-level system activity.',
            },
            {
                title: 'Public Website Content',
                href: '/admin/content',
                icon: Home,
                description:
                    'Manage homepage, events, facilities, tourism office, contact, and guidelines.',
            },
            {
                title: 'Booking Calendar',
                href: '/admin/calendar',
                icon: CalendarDays,
                permission: 'dashboard.view',
                description:
                    'View all bookings, blocks, reservations, and calendar activity.',
            },
            {
                title: 'Manage Calendar',
                href: '/admin/calendar/manage',
                icon: SlidersHorizontal,
                permission: 'dashboard.view',
                description:
                    'Create blocks, unavailable dates, and internal calendar controls.',
            },
            {
                title: 'Bookings',
                href: '/admin/bookings',
                icon: ClipboardList,
                permission: 'bookings.view',
                description: 'Manage event bookings and client reservations.',
            },
            {
                title: 'Payments',
                href: '/admin/payments/review',
                icon: CreditCard,
                permission: 'payments.manage',
                description: 'Review payment compliance and settlement status.',
            },
            {
                title: 'MICE Registry',
                href: '/admin/reports/mice-registry',
                icon: FileBarChart,
                permission: 'bookings.view',
                description: 'View MICE report records and registry outputs.',
            },
            {
                title: 'Venue Areas',
                href: '/admin/venue-areas',
                icon: Building2,
                permission: 'service_types.manage',
                description: 'Manage BCCC rentable areas.',
            },
            {
                title: 'Rental Options',
                href: '/admin/rental-options',
                icon: BarChart3,
                permission: 'services.manage',
                description:
                    'Manage rental rates, services, and pricing options.',
            },
            {
                title: 'Users & Roles',
                href: '/admin/users',
                icon: Users,
                permission: 'users.manage',
                description: 'Manage system accounts and access levels.',
            },
            {
                title: 'Inquiries',
                href: '/admin/inquiries',
                icon: Inbox,
                permission: 'bookings.view',
                description: 'Review messages from public contact forms.',
            },
            {
                title: 'Settings',
                href: '/settings/profile',
                icon: Settings,
                description: 'Manage profile and account settings.',
            },
        ],
    },

    manager: {
        role: 'manager',
        label: 'Manager',
        badge: 'Review & Approval',
        homeHref: '/manager/dashboard',
        description:
            'Decision workspace for booking approvals, reports, payments, and calendar monitoring.',
        links: [
            {
                title: 'Dashboard',
                href: '/manager/dashboard',
                icon: LayoutDashboard,
                permission: 'dashboard.view',
                description: 'Manager overview and pending action summary.',
            },
            {
                title: 'Calendar',
                href: '/manager/calendar',
                icon: CalendarDays,
                permission: 'dashboard.view',
                description: 'Review venue schedule and reservation activity.',
            },
            {
                title: 'Bookings',
                href: '/manager/bookings',
                icon: ClipboardList,
                permission: 'bookings.view',
                description: 'Review and update booking records.',
            },
            {
                title: 'Payments',
                href: '/manager/payments/review',
                icon: CreditCard,
                permission: 'payments.manage',
                description: 'Check payment compliance and reservations.',
            },
            {
                title: 'MICE Registry',
                href: '/manager/reports/mice-registry',
                icon: FileBarChart,
                permission: 'bookings.view',
                description: 'View reporting records and registry outputs.',
            },
            {
                title: 'Inquiries',
                href: '/manager/inquiries',
                icon: Inbox,
                permission: 'bookings.view',
                description: 'Review client inquiries and responses.',
            },
            {
                title: 'Settings',
                href: '/settings/profile',
                icon: Settings,
                description: 'Manage profile and account settings.',
            },
        ],
    },

    staff: {
        role: 'staff',
        label: 'Staff',
        badge: 'Operations',
        homeHref: '/staff/dashboard',
        description:
            'Daily operations workspace for bookings, schedules, and public inquiries.',
        links: [
            {
                title: 'Dashboard',
                href: '/staff/dashboard',
                icon: LayoutDashboard,
                permission: 'dashboard.view',
                description: 'Daily work overview and operational reminders.',
            },
            {
                title: 'Calendar',
                href: '/staff/calendar',
                icon: CalendarDays,
                permission: 'dashboard.view',
                description: 'Check daily schedule and venue availability.',
            },
            {
                title: 'Bookings',
                href: '/staff/bookings',
                icon: ClipboardList,
                permission: 'bookings.view',
                description: 'Create, assist, and update booking records.',
            },
            {
                title: 'Inquiries',
                href: '/staff/inquiries',
                icon: Inbox,
                permission: 'bookings.view',
                description: 'Handle public inquiries and follow-ups.',
            },
            {
                title: 'Settings',
                href: '/settings/profile',
                icon: Settings,
                description: 'Manage profile and account settings.',
            },
        ],
    },

    user: {
        role: 'user',
        label: 'Client User',
        badge: 'Public Booking',
        homeHref: '/my-dashboard',
        description:
            'Simple public experience for browsing, checking availability, and booking an event.',
        links: [
            {
                title: 'My Dashboard',
                href: '/my-dashboard',
                icon: LayoutDashboard,
                description: 'Open the client booking dashboard.',
            },
            {
                title: 'Home',
                href: '/',
                icon: Home,
                description: 'Return to the public BCCC website.',
            },
            {
                title: 'Book Event',
                href: '/book',
                icon: CalendarDays,
                description: 'Start a booking request.',
            },
            {
                title: 'My Bookings',
                href: '/my-bookings',
                icon: ClipboardList,
                description: 'View submitted booking requests.',
            },
            {
                title: 'Profile',
                href: '/settings/profile',
                icon: ShieldCheck,
                description: 'Manage account profile and security.',
            },
        ],
    },
};

export function getRoleWorkspace(role?: string | null): RoleWorkspace {
    if (role === 'admin') return roleWorkspaces.admin;
    if (role === 'manager') return roleWorkspaces.manager;
    if (role === 'staff') return roleWorkspaces.staff;

    return roleWorkspaces.user;
}

export function getPrimaryRole(roles?: string[] | null): RoleKey {
    const normalized = Array.isArray(roles)
        ? roles.map((role) => String(role).trim().toLowerCase())
        : [];

    if (normalized.includes('admin')) return 'admin';
    if (normalized.includes('manager')) return 'manager';
    if (normalized.includes('staff')) return 'staff';

    return 'user';
}
