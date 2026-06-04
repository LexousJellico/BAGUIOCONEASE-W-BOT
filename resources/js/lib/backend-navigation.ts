import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    BellRing,
    CalendarDays,
    ClipboardList,
    ContactRound,
    CreditCard,
    FileBarChart,
    FileClock,
    Globe2,
    LayoutDashboard,
    LayoutPanelTop,
    MessagesSquare,
    Settings2,
    Tags,
    UsersRound,
} from 'lucide-react';

type RoleLike =
    | string
    | {
          name?: string | null;
          role?: string | null;
          title?: string | null;
      }
    | null
    | undefined;

type AuthLike = {
    permissions?: string[];
    roles?: RoleLike[];
    user?: {
        role?: string | null;
        role_name?: string | null;
        roles?: RoleLike[];
        permissions?: string[];
    } | null;
};

export type BackendRole = 'admin' | 'manager' | 'staff' | 'user';

export type BackendNavItem = {
    title: string;
    href: string;
    icon?: LucideIcon;
    exact?: boolean;
    permission?: string | string[] | null;
    description?: string;
};

export type BackendNavSection = {
    key: string;
    title: string;
    description?: string;
    icon?: LucideIcon;
    defaultOpen?: boolean;
    items: BackendNavItem[];
};

function normalizeRoleText(value?: unknown): string | null {
    if (value === null || value === undefined) {
        return null;
    }

    const normalized = String(value).trim().toLowerCase().replace(/[_-]+/g, ' ');

    return normalized || null;
}

function roleName(role: RoleLike): string | null {
    if (!role) {
        return null;
    }

    if (typeof role === 'string') {
        return normalizeRoleText(role);
    }

    return normalizeRoleText(role.name) ?? normalizeRoleText(role.role) ?? normalizeRoleText(role.title);
}

function pathRoleFallback(): BackendRole | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const path = window.location.pathname;

    if (path.startsWith('/admin')) {
        return 'admin';
    }

    if (path.startsWith('/manager')) {
        return 'manager';
    }

    if (path.startsWith('/staff')) {
        return 'staff';
    }

    if (
        path.startsWith('/my-dashboard') ||
        path.startsWith('/my-bookings') ||
        path.startsWith('/my-calendar') ||
        path.startsWith('/notifications') ||
        path.startsWith('/book')
    ) {
        return 'user';
    }

    return null;
}

export function getBackendRole(auth?: AuthLike | null): BackendRole {
    const roleValues = [
        ...(Array.isArray(auth?.roles) ? auth?.roles ?? [] : []),
        ...(Array.isArray(auth?.user?.roles) ? auth?.user?.roles ?? [] : []),
        auth?.user?.role,
        auth?.user?.role_name,
    ]
        .map(roleName)
        .filter(Boolean) as string[];

    if (roleValues.includes('admin') || roleValues.includes('administrator')) {
        return 'admin';
    }

    if (roleValues.includes('manager') || roleValues.includes('management')) {
        return 'manager';
    }

    if (roleValues.includes('staff') || roleValues.includes('employee')) {
        return 'staff';
    }

    return pathRoleFallback() ?? 'user';
}

export function backendRoleLabel(role: BackendRole): string {
    if (role === 'admin') {
        return 'Administrator';
    }

    if (role === 'manager') {
        return 'Manager';
    }

    if (role === 'staff') {
        return 'Staff';
    }

    return 'Client';
}

export function backendRoleEyebrow(role: BackendRole): string {
    if (role === 'admin') {
        return 'Admin Workspace';
    }

    if (role === 'manager') {
        return 'Manager Workspace';
    }

    if (role === 'staff') {
        return 'Staff Workspace';
    }

    return 'Client Workspace';
}

export function backendHomeHref(role: BackendRole): string {
    if (role === 'admin') {
        return '/admin/dashboard';
    }

    if (role === 'manager') {
        return '/manager/dashboard';
    }

    if (role === 'staff') {
        return '/staff/dashboard';
    }

    return '/my-dashboard';
}

export function backendBookingsHref(role: BackendRole): string {
    if (role === 'admin') {
        return '/admin/bookings';
    }

    if (role === 'manager') {
        return '/manager/bookings';
    }

    if (role === 'staff') {
        return '/staff/bookings';
    }

    return '/my-bookings';
}

export function backendBookingCreateHref(role: BackendRole): string {
    if (role === 'admin') {
        return '/admin/bookings/create';
    }

    if (role === 'staff') {
        return '/staff/bookings/create';
    }

    if (role === 'manager') {
        return '/manager/bookings';
    }

    return '/book';
}

export function backendCalendarHref(role: BackendRole): string {
    if (role === 'admin') {
        return '/admin/calendar';
    }

    if (role === 'manager') {
        return '/manager/calendar';
    }

    if (role === 'staff') {
        return '/staff/calendar';
    }

    return '/my-calendar';
}

export function backendPaymentReviewHref(role: BackendRole): string {
    if (role === 'manager') {
        return '/manager/payments/review';
    }

    return '/admin/payments/review';
}

export function backendMiceRegistryHref(role: BackendRole): string {
    if (role === 'manager') {
        return '/manager/reports/mice-registry';
    }

    return '/admin/reports/mice-registry';
}

export function backendNavSections(role: BackendRole): BackendNavSection[] {
    if (role === 'admin') {
        return [
            {
                key: 'dashboard',
                title: 'Dashboard',
                description: 'Admin command center and monitoring workspace',
                icon: LayoutDashboard,
                defaultOpen: true,
                items: [
                    {
                        title: 'Dashboard',
                        href: '/admin/dashboard',
                        icon: LayoutDashboard,
                        exact: true,
                        permission: 'dashboard.view',
                        description: 'Metrics, monitoring, reports, and operational command center',
                    },
                ],
            },
            {
                key: 'reservations',
                title: 'Reservations',
                description: 'Calendar, bookings, and daily operations',
                icon: ClipboardList,
                defaultOpen: true,
                items: [
                    {
                        title: 'Calendar',
                        href: '/admin/calendar',
                        icon: CalendarDays,
                        permission: 'dashboard.view',
                        description: 'Blocks, events, and venue schedule',
                    },
                    {
                        title: 'Bookings',
                        href: '/admin/bookings',
                        icon: ClipboardList,
                        permission: 'bookings.view',
                        description: 'Booking requests and lifecycle',
                    },
                    {
                        title: 'New Booking',
                        href: '/admin/bookings/create',
                        icon: FileClock,
                        permission: 'bookings.create',
                        description: 'Create assisted booking',
                    },
                ],
            },
            {
                key: 'review',
                title: 'Review & Reports',
                description: 'Payments, analytics, and MICE registry',
                icon: FileBarChart,
                defaultOpen: true,
                items: [
                    {
                        title: 'Payment Review',
                        href: '/admin/payments/review',
                        icon: CreditCard,
                        permission: 'payments.manage',
                        description: 'Review proof and payment status',
                    },
                    {
                        title: 'MICE Registry',
                        href: '/admin/reports/mice-registry',
                        icon: FileBarChart,
                        permission: 'bookings.view',
                        description: 'Tourism reporting registry',
                    },
                    {
                        title: 'Analytics',
                        href: '/admin/analytics',
                        icon: BarChart3,
                        permission: 'bookings.view',
                        description: 'Booking and revenue insights',
                    },
                ],
            },
            {
                key: 'content',
                title: 'Public Website',
                description: 'Content and public-facing configuration',
                icon: LayoutPanelTop,
                defaultOpen: false,
                items: [
                    {
                        title: 'Content Manager',
                        href: '/admin/content',
                        icon: LayoutPanelTop,
                        permission: 'services.manage',
                        description: 'Homepage and public site content',
                    },
                    {
                        title: 'Guidelines & Contacts',
                        href: '/admin/guidelines-contacts',
                        icon: ContactRound,
                        permission: 'services.manage',
                        description: 'Public policy and contact details',
                    },
                    {
                        title: 'Public Inquiries',
                        href: '/admin/inquiries',
                        icon: MessagesSquare,
                        permission: 'bookings.view',
                        description: 'Messages from public contact forms',
                    },
                ],
            },
            {
                key: 'system',
                title: 'System Setup',
                description: 'Venue, services, users, and permissions',
                icon: Settings2,
                defaultOpen: false,
                items: [
                    {
                        title: 'Venue Areas',
                        href: '/admin/venue-areas',
                        icon: Tags,
                        permission: 'service_types.manage',
                        description: 'Service types / venue spaces',
                    },
                    {
                        title: 'Rental Options',
                        href: '/admin/rental-options',
                        icon: Settings2,
                        permission: 'services.manage',
                        description: 'Whole day, half day, additional hours',
                    },
                    {
                        title: 'Users & Roles',
                        href: '/admin/users',
                        icon: UsersRound,
                        permission: 'users.manage',
                        description: 'Accounts and workspace access',
                    },
                ],
            },
        ];
    }

    if (role === 'manager') {
        return [
            {
                key: 'overview',
                title: 'Overview',
                description: 'Management dashboard',
                icon: LayoutDashboard,
                defaultOpen: true,
                items: [
                    {
                        title: 'Dashboard',
                        href: '/manager/dashboard',
                        icon: LayoutDashboard,
                        exact: true,
                        permission: 'dashboard.view',
                        description: 'Management overview',
                    },
                    {
                        title: 'Calendar',
                        href: '/manager/calendar',
                        icon: CalendarDays,
                        permission: 'dashboard.view',
                        description: 'Venue schedule monitoring',
                    },
                ],
            },
            {
                key: 'review',
                title: 'Review',
                description: 'Booking and payment review',
                icon: ClipboardList,
                defaultOpen: true,
                items: [
                    {
                        title: 'Bookings',
                        href: '/manager/bookings',
                        icon: ClipboardList,
                        permission: 'bookings.view',
                        description: 'Approve and monitor requests',
                    },
                    {
                        title: 'Payment Review',
                        href: '/manager/payments/review',
                        icon: CreditCard,
                        permission: 'payments.manage',
                        description: 'Review submitted payment proofs',
                    },
                    {
                        title: 'MICE Registry',
                        href: '/manager/reports/mice-registry',
                        icon: FileBarChart,
                        permission: 'bookings.view',
                        description: 'Reporting and tourism records',
                    },
                ],
            },
        ];
    }

    if (role === 'staff') {
        return [
            {
                key: 'operations',
                title: 'Operations',
                description: 'Daily staff tools',
                icon: ClipboardList,
                defaultOpen: true,
                items: [
                    {
                        title: 'Dashboard',
                        href: '/staff/dashboard',
                        icon: LayoutDashboard,
                        exact: true,
                        permission: 'dashboard.view',
                        description: 'Staff overview',
                    },
                    {
                        title: 'Calendar',
                        href: '/staff/calendar',
                        icon: CalendarDays,
                        permission: 'dashboard.view',
                        description: 'Daily schedule and availability',
                    },
                    {
                        title: 'Bookings',
                        href: '/staff/bookings',
                        icon: ClipboardList,
                        permission: 'bookings.view',
                        description: 'Assist and monitor clients',
                    },
                    {
                        title: 'Assist Booking',
                        href: '/staff/bookings/create',
                        icon: FileClock,
                        permission: 'bookings.create',
                        description: 'Create booking for a client',
                    },
                ],
            },
        ];
    }

    return [
        {
            key: 'client',
            title: 'Client Navigation',
            description: 'Your booking workspace',
            icon: LayoutDashboard,
            defaultOpen: true,
            items: [
                {
                    title: 'Dashboard',
                    href: '/my-dashboard',
                    icon: LayoutDashboard,
                    exact: true,
                    description: 'Booking overview',
                },
                {
                    title: 'My Calendar',
                    href: '/my-calendar',
                    icon: CalendarDays,
                    description: 'Clean month view for your booking requests',
                },
                {
                    title: 'My Bookings',
                    href: '/my-bookings',
                    icon: ClipboardList,
                    description: 'Submitted requests',
                },
                {
                    title: 'Book Event',
                    href: '/book',
                    icon: CalendarDays,
                    exact: true,
                    description: 'Create a new request',
                },
                {
                    title: 'Notifications',
                    href: '/notifications',
                    icon: BellRing,
                    description: 'System bot notices and account alerts',
                },
            ],
        },
    ];
}

export function backendUtilityItems(role: BackendRole): BackendNavItem[] {
    return [
        {
            title: 'Public Website',
            href: '/',
            icon: Globe2,
            exact: true,
            description: 'Open public-facing website',
        },
        {
            title: role === 'user' ? 'Book Event' : 'New Booking',
            href: backendBookingCreateHref(role),
            icon: CalendarDays,
            description: 'Start booking flow',
        },
    ];
}

export function flattenBackendSections(sections: BackendNavSection[]): BackendNavItem[] {
    return sections.flatMap((section) => section.items);
}

export function isBackendActive(currentUrl: string, href: string, exact = false): boolean {
    const currentPath = currentUrl.split('?')[0].split('#')[0];
    const target = href.split('?')[0].split('#')[0];

    if (exact) {
        return currentPath === target;
    }

    if (target === '/') {
        return currentPath === '/';
    }

    return currentPath === target || currentPath.startsWith(`${target}/`);
}

export function sectionIsActive(currentUrl: string, section: BackendNavSection): boolean {
    return section.items.some((item) => isBackendActive(currentUrl, item.href, item.exact));
}

export function userHasPermission(
    permissions: string[] = [],
    required?: string | string[] | null,
): boolean {
    if (!required) {
        return true;
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
        return true;
    }

    const requiredList = Array.isArray(required) ? required : [required];

    return requiredList.some((permission) => permissions.includes(permission));
}

export function filterBackendSectionsByPermission(
    sections: BackendNavSection[],
    permissions: string[] = [],
): BackendNavSection[] {
    return sections
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => userHasPermission(permissions, item.permission)),
        }))
        .filter((section) => section.items.length > 0);
}
