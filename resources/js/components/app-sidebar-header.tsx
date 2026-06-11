import BackendNotificationBell from '@/components/backend/backend-notification-bell';
import { confirmBcccAction } from '@/components/ui/bccc-confirm-dialog';
import { useAppearance } from '@/hooks/use-appearance';
import {
    backendBookingCreateHref,
    backendCalendarHref,
    backendNavSections,
    backendRoleLabel,
    filterBackendSectionsByPermission,
    flattenBackendSections,
    getBackendRole,
    isBackendActive,
    sectionIsActive,
    userHasPermission,
    type BackendNavItem,
    type BackendNavSection,
} from '@/lib/backend-navigation';
import type { BreadcrumbItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
    BookOpenCheck,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    Globe2,
    LogOut,
    Menu,
    Moon,
    Sun,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type AuthUser = {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    role_name?: string | null;
    permissions?: string[];
};

type SharedProps = {
    auth?: {
        user?: AuthUser | null;
        permissions?: string[];
    };
};

const ease = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function resolveTitle(breadcrumbs: BreadcrumbItem[]) {
    return breadcrumbs.length > 0
        ? (breadcrumbs[breadcrumbs.length - 1]?.title ?? 'Workspace')
        : 'Workspace';
}

function initials(name?: string | null) {
    if (!name) {
        return 'BA';
    }

    const parts = name.trim().split(/\s+/).slice(0, 2);

    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'BA';
}

function ThemeToggleButton() {
    const { appearance, updateAppearance } = useAppearance();
    const [systemDark, setSystemDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const sync = () => {
            setSystemDark(mediaQuery.matches);
            setMounted(true);
        };

        sync();
        mediaQuery.addEventListener('change', sync);

        return () => mediaQuery.removeEventListener('change', sync);
    }, []);

    const isDark =
        appearance === 'dark' || (appearance === 'system' && systemDark);

    return (
        <button
            type="button"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/78 text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-[#d6b05c]/50 hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.09]"
            aria-label="Toggle backend theme"
        >
            {!mounted ? (
                <span className="h-4 w-4 rounded-full border border-current opacity-40" />
            ) : isDark ? (
                <Moon className="h-4 w-4" />
            ) : (
                <Sun className="h-4 w-4" />
            )}
        </button>
    );
}

function MobileLeaf({
    item,
    currentUrl,
    onClick,
}: {
    item: BackendNavItem;
    currentUrl: string;
    onClick: () => void;
}) {
    const Icon = item.icon as LucideIcon | undefined;
    const active = isBackendActive(currentUrl, item.href, item.exact);

    return (
        <Link
            href={item.href}
            onClick={onClick}
            data-active={active ? 'true' : 'false'}
            className={cx(
                'backend-mobile-nav-item flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition',
                active
                    ? 'bg-white text-[#0b0f14]'
                    : 'text-white/68 hover:bg-white/[0.075] hover:text-white',
            )}
        >
            <span
                className={cx(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                    active
                        ? 'bg-[#efe4c8] text-[#7a5520]'
                        : 'bg-white/[0.055] text-[#f4d894]',
                )}
            >
                {Icon ? <Icon className="h-4 w-4" /> : null}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate">{item.title}</span>
                {item.description ? (
                    <span className="backend-mobile-nav-description mt-0.5 block truncate text-[11px] font-medium opacity-62">
                        {item.description}
                    </span>
                ) : null}
            </span>
        </Link>
    );
}

function MobileSection({
    section,
    currentUrl,
    permissions,
    onClose,
}: {
    section: BackendNavSection;
    currentUrl: string;
    permissions: string[];
    onClose: () => void;
}) {
    const Icon = section.icon as LucideIcon | undefined;
    const active = sectionIsActive(currentUrl, section);
    const visibleItems = section.items.filter((item) =>
        userHasPermission(permissions, item.permission),
    );

    if (visibleItems.length === 0) {
        return null;
    }

    return (
        <section
            className={cx(
                'backend-mobile-section rounded-2xl border border-white/8 bg-white/[0.035] p-2',
                active && 'is-active',
            )}
        >
            <div
                className={cx(
                    'backend-mobile-section-heading flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2',
                    active ? 'bg-white/[0.075] text-white' : 'text-white/72',
                )}
            >
                <span
                    className={cx(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                        active
                            ? 'bg-[#d6b05c]/16 text-[#f4d894]'
                            : 'bg-white/[0.055] text-white/48',
                    )}
                >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                        {section.title}
                    </span>
                    {section.description ? (
                        <span className="mt-0.5 block truncate text-[11px] font-medium text-white/42">
                            {section.description}
                        </span>
                    ) : null}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.055] px-2 py-1 text-[10px] font-bold text-white/52">
                    {visibleItems.length}
                </span>
            </div>

            <div className="backend-mobile-section-items mt-2 grid gap-2">
                {visibleItems.map((item) => (
                    <MobileLeaf
                        key={`mobile-${section.key}-${item.href}`}
                        item={item}
                        currentUrl={currentUrl}
                        onClick={onClose}
                    />
                ))}
            </div>
        </section>
    );
}

export function AppSidebarHeader({
    breadcrumbs = [],
    collapsed = false,
    onCollapsedChange,
}: {
    breadcrumbs?: BreadcrumbItem[];
    collapsed?: boolean;
    onCollapsedChange?: (value: boolean) => void;
}) {
    const page = usePage();
    const props = page.props as SharedProps;
    const role = getBackendRole(props.auth);
    const user = props.auth?.user;

    const permissions = useMemo(
        () => [
            ...((props.auth?.permissions ?? []) as string[]),
            ...((user?.permissions ?? []) as string[]),
        ],
        [props.auth?.permissions, user?.permissions],
    );

    const sections = useMemo(
        () =>
            filterBackendSectionsByPermission(
                backendNavSections(role),
                permissions,
            ),
        [role, permissions],
    );
    const flatClientItems = useMemo(
        () => flattenBackendSections(sections),
        [sections],
    );
    const isClientRole = role === 'user';
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);

    const title = resolveTitle(breadcrumbs);
    const bookingHref = backendBookingCreateHref(role);
    const calendarHref = backendCalendarHref(role);
    const breadcrumbTrail = useMemo(
        () => breadcrumbs.filter((item) => item.title),
        [breadcrumbs],
    );

    useEffect(() => {
        setMobileOpen(false);
        setAccountOpen(false);
    }, [page.url]);

    useEffect(() => {
        document.body.classList.toggle('overflow-hidden', mobileOpen);

        return () => document.body.classList.remove('overflow-hidden');
    }, [mobileOpen]);

    const logout = async () => {
        const confirmed = await confirmBcccAction({
            title: 'Logout confirmation',
            message:
                'Are you sure you want to log out of BCCC EASE? You can stay if you still need to check bookings, notifications, or continue a reservation.',
            confirmText: 'Yes, logout',
            cancelText: 'Stay logged in',
            tone: 'warning',
        });

        if (confirmed) {
            router.post('/logout');
        }
    };

    return (
        <>
            <header
                className={cx(
                    'backend-topbar backend-main-topbar fixed inset-x-0 top-0 z-[80] overflow-visible border-b border-slate-200/70 bg-white/88 shadow-[0_14px_46px_rgba(15,23,42,0.07)] backdrop-blur-2xl transition-[left,width] duration-300 dark:border-white/10 dark:bg-[#0a0d12]/88 dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)]',
                )}
                data-has-breadcrumbs={
                    breadcrumbTrail.length > 1 ? 'true' : 'false'
                }
            >
                <div className="backend-main-topbar-inner backend-topbar-main relative z-20 mx-auto flex min-h-[3.75rem] w-full max-w-[1920px] items-center gap-2 px-3 py-1.5 sm:px-4 lg:px-5 xl:px-6">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/78 text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:bg-white lg:hidden dark:border-white/10 dark:bg-white/[0.055] dark:text-white"
                        aria-label="Open workspace menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {onCollapsedChange ? (
                        <button
                            type="button"
                            onClick={() => onCollapsedChange(!collapsed)}
                            className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/78 text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-[#d6b05c]/50 hover:bg-white lg:grid dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.09]"
                            aria-label={
                                collapsed
                                    ? 'Expand sidebar'
                                    : 'Collapse sidebar'
                            }
                            title={
                                collapsed
                                    ? 'Expand sidebar'
                                    : 'Collapse sidebar'
                            }
                        >
                            {collapsed ? (
                                <Menu className="h-4 w-4" />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                        </button>
                    ) : null}

                    <div className="backend-topbar-title min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="rounded-full border border-[#d6b05c]/30 bg-[#d6b05c]/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-[#8a6320] uppercase dark:border-[#f4d894]/18 dark:bg-[#f4d894]/8 dark:text-[#f4d894]">
                                {backendRoleLabel(role)}
                            </span>
                            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block dark:bg-white/20" />
                            <span className="hidden truncate text-[11px] font-semibold text-slate-500 sm:block dark:text-white/38">
                                {isClientRole
                                    ? 'Client Booking Workspace'
                                    : 'BCCC Operations Console'}
                            </span>
                        </div>

                        <h1 className="mt-0.5 truncate text-base font-semibold text-slate-950 sm:text-lg dark:text-white">
                            {title}
                        </h1>
                    </div>

                    <div className="backend-topbar-shortcuts hidden items-center gap-2 xl:flex">
                        <Link
                            href={calendarHref}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/78 px-3 text-xs font-bold tracking-[0.13em] text-slate-800 uppercase shadow-[0_12px_30px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#d6b05c]/50 hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.09]"
                        >
                            <CalendarDays className="h-4 w-4" />
                            Calendar
                        </Link>

                        <Link
                            href={bookingHref}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-bold tracking-[0.13em] text-white uppercase shadow-[0_16px_36px_rgba(15,23,42,0.20)] transition hover:-translate-y-0.5 hover:bg-[#2d2618] dark:bg-white dark:text-[#0b0f14]"
                        >
                            <BookOpenCheck className="h-4 w-4" />
                            {isClientRole ? 'Book Event' : 'New Booking'}
                        </Link>
                    </div>

                    <div className="backend-topbar-controls flex shrink-0 items-center gap-2">
                        <BackendNotificationBell />
                        <ThemeToggleButton />

                        <div className="relative z-50">
                            <button
                                type="button"
                                onClick={() => setAccountOpen((prev) => !prev)}
                                className="backend-account-trigger inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/78 px-2 text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-[#d6b05c]/50 hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.09]"
                                aria-expanded={accountOpen}
                                aria-label="Open account menu"
                            >
                                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#efe4c8] text-[11px] font-bold text-[#7a5520] dark:bg-[#f4d894]/14 dark:text-[#f4d894]">
                                    {initials(user?.name)}
                                </span>
                                <span className="hidden max-w-[9rem] truncate text-sm font-semibold lg:block">
                                    {user?.name || backendRoleLabel(role)}
                                </span>
                                <ChevronDown
                                    className={cx(
                                        'h-4 w-4 transition',
                                        accountOpen && 'rotate-180',
                                    )}
                                />
                            </button>

                            <AnimatePresence>
                                {accountOpen ? (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: 8,
                                            scale: 0.98,
                                        }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                        transition={{ duration: 0.18, ease }}
                                        className="backend-account-menu absolute top-full right-0 z-[90] mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/96 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0a0d12]/96"
                                    >
                                        <Link
                                            href="/settings/profile"
                                            className="block rounded-xl bg-slate-100/80 p-3 transition hover:bg-slate-100 dark:bg-white/[0.055] dark:hover:bg-white/[0.085]"
                                        >
                                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                                {user?.name ||
                                                    backendRoleLabel(role)}
                                            </p>
                                            <p className="truncate text-xs text-slate-500 dark:text-white/42">
                                                {user?.email ||
                                                    'BCCC workspace'}
                                            </p>
                                            <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-[#8a6320] uppercase dark:text-[#f4d894]">
                                                View profile
                                            </p>
                                        </Link>

                                        <Link
                                            href="/"
                                            className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/[0.055]"
                                        >
                                            <Globe2 className="h-4 w-4 text-[#9d7b3d]" />
                                            Public Website
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={logout}
                                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-400/10"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Logout
                                        </button>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
                {breadcrumbTrail.length > 1 ? (
                    <div className="backend-breadcrumb-row relative z-0 bg-white/72 px-3 py-1.5 backdrop-blur-2xl sm:px-4 lg:px-5 xl:px-6 dark:bg-[#0a0d12]/78">
                        <div className="backend-breadcrumb-inner mx-auto flex w-full max-w-[1920px] items-center gap-2 overflow-x-auto text-[11px] font-semibold text-slate-500 [scrollbar-width:none] dark:text-white/42 [&::-webkit-scrollbar]:hidden">
                            <span className="backend-breadcrumb-label shrink-0 px-0 py-1 text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase dark:text-white/42">
                                Path
                            </span>
                            {breadcrumbTrail.map((item, index) => {
                                const last =
                                    index === breadcrumbTrail.length - 1;

                                return (
                                    <span
                                        key={`${item.title}-${index}`}
                                        className="inline-flex shrink-0 items-center gap-1.5"
                                    >
                                        {item.href && !last ? (
                                            <Link
                                                href={item.href}
                                                className="backend-breadcrumb-link px-0 py-1 transition hover:text-[#8a6320] dark:hover:text-[#f4d894]"
                                            >
                                                {item.title}
                                            </Link>
                                        ) : (
                                            <span className="backend-breadcrumb-current px-0 py-1 text-[#7a5520] dark:text-[#f4d894]">
                                                {item.title}
                                            </span>
                                        )}
                                        {!last ? (
                                            <ChevronRight
                                                className="backend-breadcrumb-separator h-3.5 w-3.5 text-slate-300 dark:text-white/24"
                                                aria-hidden="true"
                                            />
                                        ) : null}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </header>

            <AnimatePresence>
                {mobileOpen ? (
                    <motion.div
                        className="backend-mobile-menu-layer fixed inset-0 z-[99990] lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/58 backdrop-blur-xl"
                            onClick={() => setMobileOpen(false)}
                            aria-label="Close workspace menu"
                        />

                        <motion.aside
                            className="backend-mobile-menu absolute top-3 left-3 flex max-h-[calc(100dvh-1.5rem)] w-[min(42rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a0d12]/96 text-white shadow-[0_30px_100px_rgba(0,0,0,0.42)]"
                            initial={{
                                x: -34,
                                opacity: 0,
                                filter: 'blur(10px)',
                            }}
                            animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
                            exit={{ x: -34, opacity: 0, filter: 'blur(10px)' }}
                            transition={{ duration: 0.26, ease }}
                        >
                            <div className="flex items-center justify-between border-b border-white/10 p-4">
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.24em] text-[#f4d894] uppercase">
                                        BCCC EASE
                                    </p>
                                    <p className="mt-1 text-sm font-semibold">
                                        {backendRoleLabel(role)} Workspace
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMobileOpen(false)}
                                    className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-white"
                                    aria-label="Close workspace menu"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="backend-mobile-nav-grid min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {isClientRole ? (
                                    <section className="backend-mobile-section rounded-2xl border border-white/8 bg-white/[0.035] p-2">
                                        <div className="mb-2 px-3 py-2 text-[10px] font-bold tracking-[0.22em] text-white/38 uppercase">
                                            Navigation
                                        </div>
                                        <div className="grid gap-2">
                                            {flatClientItems.map((item) => (
                                                <MobileLeaf
                                                    key={`mobile-client-${item.href}`}
                                                    item={item}
                                                    currentUrl={page.url}
                                                    onClick={() =>
                                                        setMobileOpen(false)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </section>
                                ) : (
                                    sections.map((section) => (
                                        <MobileSection
                                            key={`mobile-section-${section.key}`}
                                            section={section}
                                            currentUrl={page.url}
                                            permissions={permissions}
                                            onClose={() => setMobileOpen(false)}
                                        />
                                    ))
                                )}
                            </div>

                            <div className="backend-mobile-footer grid gap-2 border-t border-white/10 p-4">
                                <Link
                                    href={calendarHref}
                                    onClick={() => setMobileOpen(false)}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] text-sm font-semibold text-white"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Calendar
                                </Link>
                                <Link
                                    href={bookingHref}
                                    onClick={() => setMobileOpen(false)}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-[#0b0f14]"
                                >
                                    <BookOpenCheck className="h-4 w-4" />
                                    {isClientRole
                                        ? 'Book Event'
                                        : 'New Booking'}
                                </Link>
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-semibold text-white/74"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        </motion.aside>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </>
    );
}
