import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import NotificationBell from '@/components/layout/NotificationBell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    backendBookingCreateHref,
    backendBookingsHref,
    backendCalendarHref,
    backendHomeHref,
    backendMiceRegistryHref,
    backendPaymentReviewHref,
    backendRoleEyebrow,
    backendRoleLabel,
    getBackendRole,
    isBackendActive,
    userHasPermission,
} from '@/lib/backend-navigation';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    ChevronDown,
    ClipboardList,
    ContactRound,
    CreditCard,
    ExternalLink,
    FileBarChart,
    FileClock,
    FolderCog,
    LayoutDashboard,
    LayoutPanelTop,
    LogOut,
    MessagesSquare,
    Settings,
    Tags,
    User2,
    UsersRound,
} from 'lucide-react';

type AppSidebarHeaderProps = {
    breadcrumbs?: BreadcrumbItem[];
};

type HeaderNavItem = {
    title: string;
    href: string;
    exact?: boolean;
    permission?: string | string[] | null;
    icon?: React.ComponentType<{ className?: string }>;
    children?: HeaderNavItem[];
};

function resolveTitle(breadcrumbs: BreadcrumbItem[]) {
    if (breadcrumbs.length > 0) {
        return breadcrumbs[breadcrumbs.length - 1]?.title ?? 'Workspace';
    }

    return 'Workspace';
}

function initialsFromName(name?: string) {
    if (!name) return 'U';

    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'U';
}

function buildPrimaryNav(
    role: ReturnType<typeof getBackendRole>,
): HeaderNavItem[] {
    if (role === 'admin') {
        return [
            {
                title: 'Dashboard',
                href: backendHomeHref(role),
                exact: true,
                icon: LayoutDashboard,
                permission: 'dashboard.view',
            },
            {
                title: 'Calendar',
                href: backendCalendarHref(role),
                icon: CalendarDays,
                permission: 'dashboard.view',
            },
            {
                title: 'Bookings',
                href: backendBookingsHref(role),
                icon: ClipboardList,
                permission: 'bookings.view',
                children: [
                    {
                        title: 'All Bookings',
                        href: backendBookingsHref(role),
                        icon: ClipboardList,
                        permission: 'bookings.view',
                    },
                    {
                        title: 'Create Booking',
                        href: backendBookingCreateHref(role),
                        icon: FileClock,
                        permission: 'bookings.create',
                    },
                    {
                        title: 'Payments',
                        href: backendPaymentReviewHref(role),
                        icon: CreditCard,
                        permission: 'payments.manage',
                    },
                    {
                        title: 'MICE Registry',
                        href: backendMiceRegistryHref(role),
                        icon: FileBarChart,
                        permission: 'bookings.view',
                    },
                ],
            },
            {
                title: 'Content',
                href: '/admin/content',
                icon: LayoutPanelTop,
                permission: 'services.manage',
            },
            {
                title: 'Configuration',
                href: '/admin/venue-areas',
                icon: FolderCog,
                permission: 'services.manage',
                children: [
                    {
                        title: 'Venue Areas',
                        href: '/admin/venue-areas',
                        icon: Tags,
                        permission: 'service_types.manage',
                    },
                    {
                        title: 'Rental Options',
                        href: '/admin/rental-options',
                        icon: Settings,
                        permission: 'services.manage',
                    },
                    {
                        title: 'Users',
                        href: '/admin/users',
                        icon: UsersRound,
                        permission: 'users.manage',
                    },
                    {
                        title: 'Inquiries',
                        href: '/admin/inquiries',
                        icon: MessagesSquare,
                        permission: 'bookings.view',
                    },
                    {
                        title: 'Guidelines',
                        href: '/admin/guidelines-contacts',
                        icon: ContactRound,
                        permission: 'services.manage',
                    },
                ],
            },
        ];
    }

    if (role === 'manager') {
        return [
            {
                title: 'Dashboard',
                href: backendHomeHref(role),
                exact: true,
                icon: LayoutDashboard,
                permission: 'dashboard.view',
            },
            {
                title: 'Calendar',
                href: backendCalendarHref(role),
                icon: CalendarDays,
                permission: 'dashboard.view',
            },
            {
                title: 'Bookings',
                href: backendBookingsHref(role),
                icon: ClipboardList,
                permission: 'bookings.view',
                children: [
                    {
                        title: 'Booking Index',
                        href: backendBookingsHref(role),
                        icon: ClipboardList,
                        permission: 'bookings.view',
                    },
                    {
                        title: 'Payments',
                        href: backendPaymentReviewHref(role),
                        icon: CreditCard,
                        permission: 'payments.manage',
                    },
                    {
                        title: 'MICE Registry',
                        href: backendMiceRegistryHref(role),
                        icon: FileBarChart,
                        permission: 'bookings.view',
                    },
                ],
            },
        ];
    }

    if (role === 'staff') {
        return [
            {
                title: 'Dashboard',
                href: backendHomeHref(role),
                exact: true,
                icon: LayoutDashboard,
                permission: 'dashboard.view',
            },
            {
                title: 'Calendar',
                href: backendCalendarHref(role),
                icon: CalendarDays,
                permission: 'dashboard.view',
            },
            {
                title: 'Bookings',
                href: backendBookingsHref(role),
                icon: ClipboardList,
                permission: 'bookings.view',
                children: [
                    {
                        title: 'Booking Index',
                        href: backendBookingsHref(role),
                        icon: ClipboardList,
                        permission: 'bookings.view',
                    },
                    {
                        title: 'Assist Booking',
                        href: backendBookingCreateHref(role),
                        icon: FileClock,
                        permission: 'bookings.create',
                    },
                ],
            },
        ];
    }

    return [
        {
            title: 'Dashboard',
            href: backendHomeHref(role),
            exact: true,
            icon: LayoutDashboard,
        },
        {
            title: 'Bookings',
            href: backendBookingsHref(role),
            icon: ClipboardList,
            children: [
                {
                    title: 'My Bookings',
                    href: backendBookingsHref(role),
                    icon: ClipboardList,
                },
                {
                    title: 'Book Event',
                    href: backendBookingCreateHref(role),
                    icon: FileClock,
                },
            ],
        },
    ];
}

function filterVisibleItems(
    items: HeaderNavItem[],
    permissions: string[],
): HeaderNavItem[] {
    return items
        .map((item) => {
            const visibleChildren = (item.children ?? []).filter((child) =>
                userHasPermission(permissions, child.permission),
            );

            const parentAllowed =
                userHasPermission(permissions, item.permission) ||
                visibleChildren.length > 0;

            if (!parentAllowed) return null;

            return {
                ...item,
                children: visibleChildren,
            };
        })
        .filter(Boolean) as HeaderNavItem[];
}

function itemIsActive(url: string, item: HeaderNavItem): boolean {
    if (isBackendActive(url, item.href, item.exact)) {
        return true;
    }

    return (item.children ?? []).some((child) =>
        isBackendActive(url, child.href, child.exact),
    );
}

function HeaderNavLink({
    item,
    currentUrl,
}: {
    item: HeaderNavItem;
    currentUrl: string;
}) {
    const active = itemIsActive(currentUrl, item);
    const Icon = item.icon;
    const hasChildren = (item.children?.length ?? 0) > 0;

    if (!hasChildren) {
        return (
            <Link
                href={item.href}
                className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                    active
                        ? 'border-[#20242b] bg-[#20242b] text-white shadow-sm'
                        : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                }`}
            >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{item.title}</span>
            </Link>
        );
    }

    return (
        <div className="group/nav relative">
            <Link
                href={item.href}
                className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                    active
                        ? 'border-[#20242b] bg-[#20242b] text-white shadow-sm'
                        : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                }`}
            >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{item.title}</span>
                <ChevronDown className="h-4 w-4 opacity-70" />
            </Link>

            <div className="pointer-events-none invisible absolute top-full left-0 z-50 mt-2 w-72 translate-y-1 opacity-0 transition-all duration-200 group-focus-within/nav:pointer-events-auto group-focus-within/nav:visible group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100 group-hover/nav:pointer-events-auto group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-[#0f1720]">
                    {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isBackendActive(
                            currentUrl,
                            child.href,
                            child.exact,
                        );

                        return (
                            <Link
                                key={`${item.title}-${child.href}`}
                                href={child.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                                    childActive
                                        ? 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                                }`}
                            >
                                {ChildIcon ? (
                                    <ChildIcon className="h-4 w-4 shrink-0" />
                                ) : null}
                                <span className="font-medium">
                                    {child.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

type BackendHeaderUser = {
    name?: string | null;
    email?: string | null;
    permissions?: string[];
};

type BackendHeaderAuth = {
    permissions?: string[];
    roles?: Array<string | { name?: string | null; role?: string | null; title?: string | null }>;
    user?: BackendHeaderUser & {
        role?: string | null;
        role_name?: string | null;
        roles?: Array<string | { name?: string | null; role?: string | null; title?: string | null }>;
    };
};

export function AppSidebarHeader({ breadcrumbs = [] }: AppSidebarHeaderProps) {
    const page = usePage<SharedData>();
    const auth = page.props.auth as BackendHeaderAuth | undefined;
    const role = getBackendRole(auth);
    const title = resolveTitle(breadcrumbs);
    const user = auth?.user ?? {};
    const permissions = Array.from(
        new Set([
            ...((auth?.permissions ?? []) as string[]),
            ...((user?.permissions ?? []) as string[]),
        ]),
    );

    const visibleNav = filterVisibleItems(buildPrimaryNav(role), permissions);
    const name = user?.name ?? 'BCCC User';
    const email = user?.email ?? 'user@bccc-ease.local';
    const initials = initialsFromName(name);

    return (
        <header className="backend-topbar sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b1220]/92">
            <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-6">
                <div className="flex min-h-[68px] items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href={backendHomeHref(role)}
                            className="flex min-w-0 items-center gap-3"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#20242b] text-white shadow-sm dark:border-slate-700 dark:bg-slate-100 dark:text-slate-950">
                                <Building2 className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                                <div className="truncate text-sm font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                                    BCCC EASE
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        {backendRoleEyebrow(role)}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="hidden border-slate-300 bg-slate-100 text-[10px] font-bold tracking-[0.14em] text-slate-700 uppercase md:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        {backendRoleLabel(role)}
                                    </Badge>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
                        {visibleNav.map((item) => (
                            <HeaderNavLink
                                key={`${item.title}-${item.href}`}
                                item={item}
                                currentUrl={page.url}
                            />
                        ))}
                    </nav>

                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="hidden h-10 rounded-lg border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 lg:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <Link href="/" target="_blank">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Public Site
                            </Link>
                        </Button>

                        <NotificationBell />
                        <AppearanceToggleDropdown />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                                >
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#20242b] text-xs font-black text-white dark:bg-slate-100 dark:text-slate-950">
                                        {initials}
                                    </span>

                                    <span className="hidden text-left md:block">
                                        <span className="block max-w-[140px] truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {name}
                                        </span>
                                        <span className="block max-w-[140px] truncate text-[11px] text-slate-500 dark:text-slate-400">
                                            {email}
                                        </span>
                                    </span>

                                    <ChevronDown className="h-4 w-4 text-slate-500" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                className="w-64 rounded-xl border-slate-200 p-2 dark:border-slate-700"
                            >
                                <DropdownMenuLabel className="px-3 py-2">
                                    <div className="text-sm font-semibold">
                                        {name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {email}
                                    </div>
                                </DropdownMenuLabel>

                                <DropdownMenuSeparator />

                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings/profile">
                                            <User2 className="mr-2 h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link href="/settings/profile">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="w-full text-left"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="scrollbar-hide -mx-1 overflow-x-auto pb-3 xl:hidden">
                    <div className="flex min-w-max items-center gap-2 px-1">
                        {visibleNav.map((item) => (
                            <HeaderNavLink
                                key={`mobile-${item.title}-${item.href}`}
                                item={item}
                                currentUrl={page.url}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex min-h-[40px] items-center justify-between gap-3 border-t border-slate-200/70 py-2 text-xs dark:border-slate-800">
                    <div className="min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {title}
                        </span>
                    </div>

                    {breadcrumbs.length > 1 ? (
                        <div className="hidden min-w-0 text-slate-500 md:block dark:text-slate-400">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    );
}
