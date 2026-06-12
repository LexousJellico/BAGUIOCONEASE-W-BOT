import SafeImage from '@/components/system/safe-image';
import {
    backendHomeHref,
    backendNavSections,
    backendRoleLabel,
    filterBackendSectionsByPermission,
    flattenBackendSections,
    getBackendRole,
    isBackendActive,
    sectionIsActive,
    type BackendNavItem,
    type BackendNavSection,
} from '@/lib/backend-navigation';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, Circle, KeyRound, UserRound } from 'lucide-react';
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

type SidebarProps = {
    collapsed?: boolean;
    autoExpanded?: boolean;
    onAutoExpandEnter?: () => void;
    onAutoExpandLeave?: () => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function SidebarLeaf({
    item,
    currentUrl,
    collapsed,
}: {
    item: BackendNavItem;
    currentUrl: string;
    collapsed: boolean;
}) {
    const Icon = item.icon as LucideIcon | undefined;
    const active = isBackendActive(currentUrl, item.href, item.exact);

    return (
        <Link
            href={item.href}
            title={collapsed ? item.title : undefined}
            data-active={active ? 'true' : 'false'}
            className={cx(
                'group relative flex min-h-[2.75rem] items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition duration-200',
                collapsed && 'justify-center px-2',
                active
                    ? 'bg-white text-slate-950 shadow-[0_14px_34px_rgba(0,0,0,0.20)] dark:bg-white dark:text-[#0b0f14]'
                    : 'text-white/66 hover:bg-white/[0.075] hover:text-white',
            )}
        >
            <span
                className={cx(
                    'absolute inset-y-2 left-0 w-1 rounded-r-full transition',
                    active
                        ? 'bg-[#7dd7c6] opacity-100'
                        : 'bg-white/0 opacity-0 group-hover:bg-white/18 group-hover:opacity-100',
                )}
            />
            <span
                className={cx(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition',
                    active
                        ? 'border-slate-950/8 bg-[#e7f2f0] text-[#176456]'
                        : 'border-white/8 bg-white/[0.055] text-[#7dd7c6] group-hover:border-white/12 group-hover:bg-white/[0.09]',
                )}
            >
                {Icon ? (
                    <Icon className="h-4 w-4" />
                ) : (
                    <Circle className="h-3 w-3" />
                )}
            </span>
            {!collapsed ? (
                <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.title}</span>
                    {item.description ? (
                        <span
                            className={cx(
                                'backend-sidebar-item-description mt-0.5 block truncate text-[10px] font-medium',
                                active ? 'text-slate-500' : 'text-white/32',
                            )}
                        >
                            {item.description}
                        </span>
                    ) : null}
                </span>
            ) : null}
        </Link>
    );
}

function SidebarSection({
    section,
    currentUrl,
    open,
    onToggle,
    collapsed,
}: {
    section: BackendNavSection;
    currentUrl: string;
    open: boolean;
    onToggle: () => void;
    collapsed: boolean;
}) {
    const Icon = section.icon as LucideIcon | undefined;
    const active = sectionIsActive(currentUrl, section);

    if (collapsed) {
        return (
            <section className="grid gap-1 rounded-2xl border border-white/8 bg-white/[0.035] p-1.5">
                <button
                    type="button"
                    onClick={onToggle}
                    title={section.title}
                    className={cx(
                        'grid h-10 place-items-center rounded-xl transition',
                        active
                            ? 'bg-white/[0.12] text-[#7dd7c6]'
                            : 'text-white/48 hover:bg-white/[0.075] hover:text-white',
                    )}
                >
                    {Icon ? (
                        <Icon className="h-4 w-4" />
                    ) : (
                        <Circle className="h-3 w-3" />
                    )}
                </button>
                {section.items.slice(0, 5).map((item) => (
                    <SidebarLeaf
                        key={`${section.key}-${item.href}`}
                        item={item}
                        currentUrl={currentUrl}
                        collapsed
                    />
                ))}
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <button
                type="button"
                onClick={onToggle}
                className={cx(
                    'flex min-h-[2.85rem] w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition duration-200',
                    active || open
                        ? 'bg-white/[0.075] text-white'
                        : 'text-white/62 hover:bg-white/[0.055] hover:text-white',
                )}
                aria-expanded={open}
            >
                <span
                    className={cx(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition',
                        active || open
                            ? 'border-[#7dd7c6]/30 bg-[#7dd7c6]/16 text-[#7dd7c6]'
                            : 'border-white/8 bg-white/[0.045] text-white/48',
                    )}
                >
                    {Icon ? (
                        <Icon className="h-4 w-4" />
                    ) : (
                        <Circle className="h-3 w-3" />
                    )}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">
                        {section.title}
                    </span>
                    {section.description ? (
                        <span className="backend-sidebar-section-description mt-0.5 block truncate text-[10px] font-medium text-white/34">
                            {section.description}
                        </span>
                    ) : null}
                </span>
                {active && !open ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#7dd7c6]" />
                ) : null}
                <ChevronDown
                    className={cx(
                        'h-4 w-4 shrink-0 text-white/38 transition',
                        open && 'rotate-180',
                    )}
                />
            </button>

            <AnimatePresence initial={false}>
                {open ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease }}
                        className="overflow-hidden"
                    >
                        <div className="mt-1 space-y-1">
                            {section.items.map((item) => (
                                <SidebarLeaf
                                    key={`${section.key}-${item.href}`}
                                    item={item}
                                    currentUrl={currentUrl}
                                    collapsed={false}
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </section>
    );
}

export function AppSidebar({
    collapsed = false,
    autoExpanded = false,
    onAutoExpandEnter,
    onAutoExpandLeave,
}: SidebarProps) {
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
    const visibleSections = sections;
    const isClientRole = role === 'user';
    const clientItems = useMemo(
        () => flattenBackendSections(visibleSections),
        [visibleSections],
    );
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(
        {},
    );

    useEffect(() => {
        setOpenSections((current) => {
            const next = { ...current };
            sections.forEach((section) => {
                if (sectionIsActive(page.url, section))
                    next[section.key] = true;
            });
            return next;
        });
    }, [page.url, sections]);

    const activeSection = sections.find((section) =>
        sectionIsActive(page.url, section),
    );

    if (collapsed) {
        return null;
    }

    return (
        <motion.aside
            initial={autoExpanded ? { x: -24, opacity: 0 } : false}
            animate={{ x: 0, opacity: 1 }}
            exit={autoExpanded ? { x: -24, opacity: 0 } : undefined}
            transition={{ duration: autoExpanded ? 0.24 : 0, ease }}
            data-auto-expanded={autoExpanded ? 'true' : 'false'}
            onMouseEnter={autoExpanded ? onAutoExpandEnter : undefined}
            onMouseLeave={autoExpanded ? onAutoExpandLeave : undefined}
            className={cx(
                'backend-sidebar fixed inset-y-0 left-0 z-[80] hidden w-[17.25rem] border-r border-white/8 bg-[#0b2421]/96 text-white shadow-[24px_0_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition-[width] duration-300 lg:flex lg:flex-col',
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(125,215,198,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015))]" />

            <div
                className={cx(
                    'relative flex min-h-0 flex-1 flex-col',
                    collapsed ? 'p-2' : 'p-3',
                )}
            >
                <div
                    className={cx(
                        'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-[#7dd7c6]/32 hover:bg-white/[0.075]',
                        collapsed ? 'p-2' : 'p-3',
                    )}
                >
                    <div
                        className={cx(
                            'relative flex items-center',
                            collapsed ? 'justify-center' : 'gap-3',
                        )}
                    >
                        <Link
                            href={backendHomeHref(role)}
                            className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_16px_38px_rgba(0,0,0,0.22)]"
                            title="BCCC EASE home"
                        >
                            <SafeImage
                                src="/marketing/images/logo/bccc-seal.png"
                                fallbackSrc="/marketing/images/logo/bccc-seal.png"
                                alt="BCCC EASE"
                                className="h-full w-full object-contain p-1"
                                wrapperClassName="h-full w-full rounded-xl border-0"
                            />
                        </Link>
                        {!collapsed ? (
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold tracking-tight">
                                    BCCC EASE
                                </span>
                                <span className="mt-0.5 block truncate text-[10px] font-bold tracking-[0.2em] text-[#7dd7c6] uppercase">
                                    {backendRoleLabel(role)}
                                </span>
                            </span>
                        ) : null}
                    </div>
                </div>

                {!collapsed ? (
                    <div className="mt-3 rounded-2xl border border-white/8 bg-black/18 px-3 py-2">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-bold tracking-[0.18em] text-white/34 uppercase">
                            <span>
                                {isClientRole
                                    ? 'Navigation'
                                    : (activeSection?.title ?? 'Navigation')}
                            </span>
                            <span>
                                {isClientRole
                                    ? clientItems.length
                                    : visibleSections.reduce(
                                          (total, section) =>
                                              total + section.items.length,
                                          0,
                                      )}{' '}
                                links
                            </span>
                        </div>
                    </div>
                ) : null}

                <div
                    className={cx(
                        'mt-3 min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                        collapsed ? 'pr-0' : 'pr-1',
                    )}
                >
                    <div className="space-y-2">
                        {isClientRole && clientItems.length > 0 ? (
                            <div className="grid gap-1 rounded-2xl border border-white/8 bg-white/[0.035] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                                {clientItems.map((item) => (
                                    <SidebarLeaf
                                        key={`client-flat-${item.href}`}
                                        item={item}
                                        currentUrl={page.url}
                                        collapsed={false}
                                    />
                                ))}
                            </div>
                        ) : visibleSections.length > 0 ? (
                            visibleSections.map((section) => (
                                <SidebarSection
                                    key={section.key}
                                    section={section}
                                    currentUrl={page.url}
                                    collapsed={collapsed}
                                    open={openSections[section.key] === true}
                                    onToggle={() =>
                                        setOpenSections((current) => ({
                                            ...current,
                                            [section.key]:
                                                current[section.key] !== true,
                                        }))
                                    }
                                />
                            ))
                        ) : (
                            <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-center">
                                {!collapsed ? (
                                    <p className="text-xs font-semibold text-white/62">
                                        No navigation items available
                                    </p>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className={cx(
                        'mt-3 rounded-2xl border border-[#7dd7c6]/18 bg-[#7dd7c6]/8',
                        collapsed ? 'p-2' : 'p-3',
                    )}
                >
                    <div
                        className={cx(
                            'flex items-center',
                            collapsed ? 'justify-center' : 'gap-2',
                        )}
                    >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#7dd7c6]/16 text-[#7dd7c6]">
                            <UserRound className="h-4 w-4" />
                        </span>
                        {!collapsed ? (
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-white">
                                    {user?.name || 'My Profile'}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] leading-5 text-white/44">
                                    {user?.email || 'Manage account settings'}
                                </p>
                            </div>
                        ) : null}
                    </div>
                    {!collapsed ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <Link
                                href="/settings/profile"
                                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.055] px-2 text-[11px] font-bold tracking-[0.12em] text-white uppercase transition hover:bg-white/[0.09]"
                            >
                                <UserRound className="h-3.5 w-3.5" /> Profile
                            </Link>
                            <Link
                                href="/settings/password"
                                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.055] px-2 text-[11px] font-bold tracking-[0.12em] text-white uppercase transition hover:bg-white/[0.09]"
                            >
                                <KeyRound className="h-3.5 w-3.5" /> Password
                            </Link>
                        </div>
                    ) : null}
                </div>

                <div className="mt-2 text-center text-[10px] font-bold tracking-[0.18em] text-white/28 uppercase">
                    © 2026 EASE
                </div>
            </div>
        </motion.aside>
    );
}
