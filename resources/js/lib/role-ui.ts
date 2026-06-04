import {
    BarChart3,
    Building2,
    CalendarDays,
    ClipboardList,
    CreditCard,
    FileBarChart,
    Globe2,
    Home,
    Inbox,
    LayoutDashboard,
    LifeBuoy,
    ListChecks,
    LucideIcon,
    Settings,
    ShieldCheck,
    SlidersHorizontal,
    Users,
} from 'lucide-react';

import {
    getPrimaryRole,
    getRoleWorkspace,
    type RoleKey,
} from '@/lib/role-workspaces';
import type { Auth, NavGroup, NavItem } from '@/types';

export type RoleTone = {
    role: RoleKey;
    label: string;
    shortLabel: string;
    eyebrow: string;
    shellClass: string;
    sidebarClass: string;
    headerClass: string;
    brandClass: string;
    badgeClass: string;
    activeClass: string;
    mutedTextClass: string;
    glowClass: string;
    homeHref: string;
};

export function getRoleFromAuth(auth?: Auth | null): RoleKey {
    return getPrimaryRole((auth?.roles ?? []).map((role) => (typeof role === 'string' ? role : String(role.name ?? ''))));
}

export function getRoleTone(role: RoleKey): RoleTone {
    if (role === 'admin') {
        return {
            role,
            label: 'Administrator',
            shortLabel: 'AD',
            eyebrow: 'Executive Control',
            shellClass: 'bg-slate-950 text-slate-50',
            sidebarClass:
                'border-slate-800/80 bg-[radial-gradient(circle_at_top_left,#1e293b_0%,#020617_48%,#020617_100%)] text-slate-100',
            headerClass:
                'border-slate-800/80 bg-slate-950/86 text-slate-100 shadow-lg shadow-black/10 backdrop-blur-xl',
            brandClass:
                'border-amber-300/30 bg-amber-300/10 text-amber-100 shadow-sm shadow-amber-950/20',
            badgeClass: 'border-amber-300/40 bg-amber-300/10 text-amber-200',
            activeClass:
                'bg-amber-300/12 text-amber-100 ring-1 ring-amber-300/25 shadow-sm shadow-amber-950/20',
            mutedTextClass: 'text-slate-400',
            glowClass: 'bg-amber-300/20',
            homeHref: '/admin/dashboard',
        };
    }

    if (role === 'manager') {
        return {
            role,
            label: 'Manager',
            shortLabel: 'MG',
            eyebrow: 'Review & Approval',
            shellClass: 'bg-blue-950 text-blue-50',
            sidebarClass:
                'border-blue-800/80 bg-[radial-gradient(circle_at_top_left,#1e40af_0%,#172554_48%,#020617_100%)] text-blue-50',
            headerClass:
                'border-blue-800/80 bg-blue-950/86 text-blue-50 shadow-lg shadow-blue-950/10 backdrop-blur-xl',
            brandClass:
                'border-sky-300/30 bg-sky-300/10 text-sky-100 shadow-sm shadow-sky-950/20',
            badgeClass: 'border-sky-300/40 bg-sky-300/10 text-sky-100',
            activeClass:
                'bg-sky-300/12 text-sky-50 ring-1 ring-sky-300/25 shadow-sm shadow-sky-950/20',
            mutedTextClass: 'text-blue-200/70',
            glowClass: 'bg-sky-300/20',
            homeHref: '/manager/dashboard',
        };
    }

    if (role === 'staff') {
        return {
            role,
            label: 'Staff',
            shortLabel: 'ST',
            eyebrow: 'Operations Desk',
            shellClass: 'bg-emerald-950 text-emerald-50',
            sidebarClass:
                'border-emerald-800/80 bg-[radial-gradient(circle_at_top_left,#047857_0%,#064e3b_48%,#020617_100%)] text-emerald-50',
            headerClass:
                'border-emerald-800/80 bg-emerald-950/86 text-emerald-50 shadow-lg shadow-emerald-950/10 backdrop-blur-xl',
            brandClass:
                'border-emerald-300/30 bg-emerald-300/10 text-emerald-100 shadow-sm shadow-emerald-950/20',
            badgeClass:
                'border-emerald-300/40 bg-emerald-300/10 text-emerald-100',
            activeClass:
                'bg-emerald-300/12 text-emerald-50 ring-1 ring-emerald-300/25 shadow-sm shadow-emerald-950/20',
            mutedTextClass: 'text-emerald-100/70',
            glowClass: 'bg-emerald-300/20',
            homeHref: '/staff/dashboard',
        };
    }

    return {
        role,
        label: 'Client User',
        shortLabel: 'US',
        eyebrow: 'Public Booking',
        shellClass:
            'bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-stone-50',
        sidebarClass:
            'border-stone-200 bg-[radial-gradient(circle_at_top_left,#fffbeb_0%,#fafaf9_48%,#f5f5f4_100%)] text-stone-950 dark:border-stone-800 dark:bg-[radial-gradient(circle_at_top_left,#292524_0%,#0c0a09_48%,#020617_100%)] dark:text-stone-50',
        headerClass:
            'border-stone-200 bg-white/88 text-stone-950 shadow-lg shadow-stone-900/5 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/86 dark:text-stone-50 dark:shadow-black/10',
        brandClass:
            'border-yellow-700/25 bg-yellow-600/10 text-yellow-800 shadow-sm dark:border-yellow-300/30 dark:text-yellow-100',
        badgeClass:
            'border-yellow-700/30 bg-yellow-600/10 text-yellow-800 dark:border-yellow-300/30 dark:text-yellow-100',
        activeClass:
            'bg-yellow-600/12 text-yellow-900 ring-1 ring-yellow-700/25 shadow-sm dark:text-yellow-100 dark:ring-yellow-300/25',
        mutedTextClass: 'text-stone-600 dark:text-stone-400',
        glowClass: 'bg-yellow-500/20',
        homeHref: '/my-dashboard',
    };
}

export function getRoleInitials(auth?: Auth | null): string {
    const role = getRoleFromAuth(auth);
    const tone = getRoleTone(role);

    if (role !== 'user') {
        return tone.shortLabel;
    }

    const name = String(auth?.user?.name ?? '').trim();

    if (!name) {
        return 'US';
    }

    const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

export function getRoleDescription(role: RoleKey): string {
    if (role === 'admin') {
        return 'Full access to content, booking operations, users, reports, setup, and system governance.';
    }

    if (role === 'manager') {
        return 'Review-focused access for bookings, payments, reports, inquiries, and calendar monitoring.';
    }

    if (role === 'staff') {
        return 'Operational access for daily bookings, schedule checking, inquiries, and client assistance.';
    }

    return 'Client access for event booking, public browsing, and submitted booking requests.';
}

export function getRoleMenuGroups(role: RoleKey): NavGroup[] {
    if (role === 'admin') {
        return [
            {
                title: 'Command Center',
                items: [
                    {
                        title: 'Dashboard',
                        href: '/admin/dashboard',
                        icon: LayoutDashboard,
                        permission: 'dashboard.view',
                        description: 'Executive system overview.',
                    },
                    {
                        title: 'Public Website Content',
                        href: '/admin/content',
                        icon: Home,
                        description:
                            'Homepage, events, facilities, tourism office, contact, and guidelines.',
                    },
                ],
            },
            {
                title: 'Booking Operations',
                items: [
                    {
                        title: 'Booking Calendar',
                        href: '/admin/calendar',
                        icon: CalendarDays,
                        permission: 'dashboard.view',
                        description:
                            'Bookings, public events, and blocked dates.',
                    },
                    {
                        title: 'Manage Calendar',
                        href: '/admin/calendar/manage',
                        icon: SlidersHorizontal,
                        permission: 'dashboard.view',
                        description:
                            'Block dates and manage unavailable schedules.',
                    },
                    {
                        title: 'Bookings',
                        href: '/admin/bookings',
                        icon: ClipboardList,
                        permission: 'bookings.view',
                        description: 'All event booking records.',
                    },
                    {
                        title: 'Payment Review',
                        href: '/admin/payments/review',
                        icon: CreditCard,
                        permission: 'payments.manage',
                        description:
                            'Payment compliance and settlement checks.',
                    },
                ],
            },
            {
                title: 'Reports',
                items: [
                    {
                        title: 'MICE Registry',
                        href: '/admin/reports/mice-registry',
                        icon: FileBarChart,
                        permission: 'bookings.view',
                        description: 'MICE records and reporting output.',
                    },
                    {
                        title: 'Booking Analytics',
                        href: '/admin/bookings/analytics',
                        icon: BarChart3,
                        permission: 'bookings.view',
                        description: 'Booking trends and statistics.',
                    },
                    {
                        title: 'Booking Audit',
                        href: '/admin/bookings/audit',
                        icon: ListChecks,
                        permission: 'bookings.view',
                        description: 'Audit trail and booking activity.',
                    },
                ],
            },
            {
                title: 'System Setup',
                items: [
                    {
                        title: 'Venue Areas',
                        href: '/admin/venue-areas',
                        icon: Building2,
                        permission: 'service_types.manage',
                        description: 'Rentable BCCC spaces.',
                    },
                    {
                        title: 'Rental Options',
                        href: '/admin/rental-options',
                        icon: BarChart3,
                        permission: 'services.manage',
                        description: 'Rates, service options, and pricing.',
                    },
                    {
                        title: 'Users & Roles',
                        href: '/admin/users',
                        icon: Users,
                        permission: 'users.manage',
                        description: 'Accounts and access control.',
                    },
                    {
                        title: 'Inquiries',
                        href: '/admin/inquiries',
                        icon: Inbox,
                        permission: 'bookings.view',
                        description: 'Public inquiry management.',
                    },
                ],
            },
        ];
    }

    if (role === 'manager') {
        return [
            {
                title: 'Review Workspace',
                items: [
                    {
                        title: 'Dashboard',
                        href: '/manager/dashboard',
                        icon: LayoutDashboard,
                        permission: 'dashboard.view',
                        description: 'Manager review summary.',
                    },
                    {
                        title: 'Calendar Review',
                        href: '/manager/calendar',
                        icon: CalendarDays,
                        permission: 'dashboard.view',
                        description: 'Monitor schedules and venue usage.',
                    },
                    {
                        title: 'Bookings',
                        href: '/manager/bookings',
                        icon: ClipboardList,
                        permission: 'bookings.view',
                        description: 'Review and update bookings.',
                    },
                    {
                        title: 'Payment Review',
                        href: '/manager/payments/review',
                        icon: CreditCard,
                        permission: 'payments.manage',
                        description: 'Payment compliance checks.',
                    },
                ],
            },
            {
                title: 'Reports & Communication',
                items: [
                    {
                        title: 'MICE Registry',
                        href: '/manager/reports/mice-registry',
                        icon: FileBarChart,
                        permission: 'bookings.view',
                        description: 'MICE records and reporting.',
                    },
                    {
                        title: 'Booking Audit',
                        href: '/manager/bookings/audit',
                        icon: ListChecks,
                        permission: 'bookings.view',
                        description: 'Booking activity trail.',
                    },
                    {
                        title: 'Inquiries',
                        href: '/manager/inquiries',
                        icon: Inbox,
                        permission: 'bookings.view',
                        description: 'Client inquiry review.',
                    },
                ],
            },
        ];
    }

    if (role === 'staff') {
        return [
            {
                title: 'Daily Operations',
                items: [
                    {
                        title: 'Dashboard',
                        href: '/staff/dashboard',
                        icon: LayoutDashboard,
                        permission: 'dashboard.view',
                        description: 'Daily operations overview.',
                    },
                    {
                        title: 'Daily Calendar',
                        href: '/staff/calendar',
                        icon: CalendarDays,
                        permission: 'dashboard.view',
                        description: 'Check bookings and availability.',
                    },
                    {
                        title: 'Bookings',
                        href: '/staff/bookings',
                        icon: ClipboardList,
                        permission: 'bookings.view',
                        description: 'Assist booking records.',
                    },
                    {
                        title: 'Create Booking',
                        href: '/staff/bookings/create',
                        icon: ListChecks,
                        permission: 'bookings.create',
                        description: 'Create client-assisted booking.',
                    },
                    {
                        title: 'Inquiries',
                        href: '/staff/inquiries',
                        icon: Inbox,
                        permission: 'bookings.view',
                        description: 'Handle public inquiries.',
                    },
                ],
            },
        ];
    }

    return [
        {
            title: 'Client Portal',
            items: [
                {
                    title: 'My Dashboard',
                    href: '/my-dashboard',
                    icon: LayoutDashboard,
                    description: 'Client booking dashboard.',
                },
                {
                    title: 'Public Website',
                    href: '/',
                    icon: Globe2,
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
                    description: 'View submitted booking records.',
                },
            ],
        },
    ];
}

export function getRoleQuickActions(role: RoleKey): NavItem[] {
    if (role === 'admin') {
        return [
            {
                title: 'Website Content',
                href: '/admin/content',
                icon: Home,
            },
            {
                title: 'Booking Calendar',
                href: '/admin/calendar',
                icon: CalendarDays,
            },
            {
                title: 'Public Website',
                href: '/',
                icon: Globe2,
            },
            {
                title: 'Settings',
                href: '/settings/profile',
                icon: Settings,
            },
        ];
    }

    if (role === 'manager') {
        return [
            {
                title: 'Calendar Review',
                href: '/manager/calendar',
                icon: CalendarDays,
            },
            {
                title: 'Bookings',
                href: '/manager/bookings',
                icon: ClipboardList,
            },
            {
                title: 'Reports',
                href: '/manager/reports/mice-registry',
                icon: FileBarChart,
            },
            {
                title: 'Public Website',
                href: '/',
                icon: Globe2,
            },
        ];
    }

    if (role === 'staff') {
        return [
            {
                title: 'Daily Calendar',
                href: '/staff/calendar',
                icon: CalendarDays,
            },
            {
                title: 'Create Booking',
                href: '/staff/bookings/create',
                icon: ClipboardList,
            },
            {
                title: 'Inquiries',
                href: '/staff/inquiries',
                icon: Inbox,
            },
            {
                title: 'Public Website',
                href: '/',
                icon: Globe2,
            },
        ];
    }

    return [
        {
            title: 'Book Event',
            href: '/book',
            icon: CalendarDays,
        },
        {
            title: 'My Bookings',
            href: '/my-bookings',
            icon: ClipboardList,
        },
        {
            title: 'Public Website',
            href: '/',
            icon: Globe2,
        },
        {
            title: 'Help',
            href: '/contact',
            icon: LifeBuoy,
        },
    ];
}

export function getHeaderMainLinks(role: RoleKey): NavItem[] {
    const workspace = getRoleWorkspace(role);

    if (role === 'admin') {
        return [
            {
                title: 'Dashboard',
                href: workspace.homeHref,
                icon: LayoutDashboard,
            },
            {
                title: 'Content',
                href: '/admin/content',
                icon: Home,
            },
            {
                title: 'Booking Calendar',
                href: '/admin/calendar',
                icon: CalendarDays,
            },
            {
                title: 'Bookings',
                href: '/admin/bookings',
                icon: ClipboardList,
            },
        ];
    }

    if (role === 'manager') {
        return [
            {
                title: 'Dashboard',
                href: workspace.homeHref,
                icon: LayoutDashboard,
            },
            {
                title: 'Calendar Review',
                href: '/manager/calendar',
                icon: CalendarDays,
            },
            {
                title: 'Bookings',
                href: '/manager/bookings',
                icon: ClipboardList,
            },
            {
                title: 'Payments',
                href: '/manager/payments/review',
                icon: CreditCard,
            },
        ];
    }

    if (role === 'staff') {
        return [
            {
                title: 'Dashboard',
                href: workspace.homeHref,
                icon: LayoutDashboard,
            },
            {
                title: 'Daily Calendar',
                href: '/staff/calendar',
                icon: CalendarDays,
            },
            {
                title: 'Bookings',
                href: '/staff/bookings',
                icon: ClipboardList,
            },
            {
                title: 'Inquiries',
                href: '/staff/inquiries',
                icon: Inbox,
            },
        ];
    }

    return [
        {
            title: 'Home',
            href: '/',
            icon: Home,
        },
        {
            title: 'Book Event',
            href: '/book',
            icon: CalendarDays,
        },
        {
            title: 'My Bookings',
            href: '/my-bookings',
            icon: ClipboardList,
        },
    ];
}

export function hrefToString(href: NavItem['href']): string {
    if (typeof href === 'string') {
        return href;
    }

    if (href && typeof href === 'object' && 'url' in href) {
        const value = href.url;
        return typeof value === 'string' ? value : '/';
    }

    return '/';
}

export function isHrefActive(
    currentUrl: string,
    href: NavItem['href'],
): boolean {
    const target = hrefToString(href);

    if (target === '/') {
        return currentUrl === '/';
    }

    return currentUrl === target || currentUrl.startsWith(`${target}/`);
}

export function hasNavPermission(
    item: NavItem,
    permissions?: string[] | null,
): boolean {
    if (!item.permission) {
        return true;
    }

    const available = Array.isArray(permissions)
        ? permissions.map((permission) => String(permission).trim())
        : [];

    const required = Array.isArray(item.permission)
        ? item.permission
        : [item.permission];

    return required.some((permission) => available.includes(permission));
}

export function IconOrFallback({ icon: Icon }: { icon?: LucideIcon }) {
    const Component = Icon ?? ShieldCheck;
    return Component;
}
