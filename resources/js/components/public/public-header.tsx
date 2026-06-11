import SafeImage from '@/components/system/safe-image';
import { useAppearance } from '@/hooks/use-appearance';
import { Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    BookOpenCheck,
    Building2,
    CalendarDays,
    ChevronDown,
    Contact,
    ExternalLink,
    FileQuestion,
    Home,
    LandPlot,
    LayoutDashboard,
    MapPinned,
    Megaphone,
    Menu,
    Moon,
    Palette,
    Sparkles,
    Sun,
    UsersRound,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type PublicSiteSettings = {
    logo_url?: string | null;
    logoUrl?: string | null;
    city_seal_url?: string | null;
    citySealUrl?: string | null;
    breathe_baguio_logo_url?: string | null;
    breatheBaguioLogoUrl?: string | null;
    visitaUrl?: string | null;
    visita_url?: string | null;
    creativeBaguioUrl?: string | null;
    creative_baguio_url?: string | null;
    arts_url?: string | null;
    cityGovernmentUrl?: string | null;
    city_government_url?: string | null;
    announcementsUrl?: string | null;
    announcements_url?: string | null;
    faqsUrl?: string | null;
    faqs_url?: string | null;
};

type PageProps = {
    siteSettings?: PublicSiteSettings;
};

type NavItem = {
    label: string;
    href: string;
    icon?: LucideIcon;
};

type MoreItem = {
    label: string;
    href: string;
    description: string;
    external?: boolean;
    icon: LucideIcon;
};

const MAIN_NAV: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Facilities', href: '/facilities', icon: LandPlot },
    { label: 'Events', href: '/events', icon: Sparkles },
    { label: 'Calendar', href: '/calendar', icon: CalendarDays },
    { label: 'Tourism Office', href: '/tourism-office', icon: UsersRound },
    { label: 'Contact', href: '/contact', icon: Contact },
];

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function setting(
    settings: PublicSiteSettings | undefined,
    ...keys: Array<keyof PublicSiteSettings>
) {
    for (const key of keys) {
        const value = settings?.[key];

        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }

    return '';
}

function isExternal(href: string) {
    return /^https?:\/\//i.test(href);
}

function isActive(url: string, href: string) {
    if (href.startsWith('http') || href.startsWith('#')) return false;

    if (href === '/') {
        return url === '/' || url.startsWith('/?');
    }

    const base = href.split('#')[0];

    return (
        url === base ||
        url.startsWith(`${base}/`) ||
        url.startsWith(`${base}?`) ||
        url.startsWith(`${base}#`)
    );
}

function moreItems(settings?: PublicSiteSettings): MoreItem[] {
    return [
        {
            label: 'Venue Packages',
            href: '/#venue-packages',
            description:
                'Prepared venue combinations and package booking options.',
            icon: Sparkles,
        },
        {
            label: 'Virtual Tour Visit',
            href: '/virtual-tour',
            description:
                'Coming soon: one guided 360-degree visit for all BCCC public areas.',
            icon: MapPinned,
        },
        {
            label: '3D Convention Layout',
            href: '/convention-layout',
            description:
                'Coming soon: architectural 3D layout of BCCC areas.',
            icon: LayoutDashboard,
        },
        {
            label: 'Booking Guidelines',
            href: '/guidelines',
            description:
                'Venue rules, requirements, payments, and booking policies.',
            icon: BookOpenCheck,
        },
        {
            label: 'Frequently Asked Questions',
            href: setting(settings, 'faqsUrl', 'faqs_url') || '/faqs',
            description: 'Local BCCC booking and venue answers.',
            icon: FileQuestion,
        },
        {
            label: 'News & Announcements',
            href:
                setting(settings, 'announcementsUrl', 'announcements_url') ||
                'https://main.baguio.gov.ph/news-and-announcements',
            description:
                'Official advisories, announcements, and city updates.',
            external: true,
            icon: Megaphone,
        },
        {
            label: 'VISITA Baguio',
            href:
                setting(settings, 'visitaUrl', 'visita_url') ||
                'https://visita.baguio.gov.ph/',
            description: 'Official visitor assistance and travel information.',
            external: true,
            icon: MapPinned,
        },
        {
            label: 'Arts Website',
            href:
                setting(
                    settings,
                    'creativeBaguioUrl',
                    'creative_baguio_url',
                    'arts_url',
                ) || 'https://creativecity.baguio.gov.ph/',
            description:
                'Creative Baguio culture, arts, and creative-city resources.',
            external: true,
            icon: Palette,
        },
        {
            label: 'City Government Website',
            href:
                setting(settings, 'cityGovernmentUrl', 'city_government_url') ||
                'https://main.baguio.gov.ph/',
            description: 'Main website of the City Government of Baguio.',
            external: true,
            icon: Building2,
        },
    ];
}

function ThinScrollbarStyle() {
    return (
        <style>
            {`
                html {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(23, 100, 86, 0.52) transparent;
                }

                html::-webkit-scrollbar,
                body::-webkit-scrollbar,
                *::-webkit-scrollbar {
                    width: 5px;
                    height: 5px;
                }

                html::-webkit-scrollbar-track,
                body::-webkit-scrollbar-track,
                *::-webkit-scrollbar-track {
                    background: transparent;
                }

                html::-webkit-scrollbar-thumb,
                body::-webkit-scrollbar-thumb,
                *::-webkit-scrollbar-thumb {
                    border-radius: 999px;
                    background: rgba(23, 100, 86, 0.64);
                    border: 1px solid rgba(255, 255, 255, 0.42);
                }

                html::-webkit-scrollbar-thumb:hover,
                body::-webkit-scrollbar-thumb:hover,
                *::-webkit-scrollbar-thumb:hover {
                    background: rgba(23, 100, 86, 0.88);
                }

                html.dark {
                    scrollbar-color: rgba(244, 223, 173, 0.42) transparent;
                }

                html.dark::-webkit-scrollbar-thumb,
                html.dark body::-webkit-scrollbar-thumb,
                html.dark *::-webkit-scrollbar-thumb {
                    background: rgba(244, 223, 173, 0.42);
                    border-color: rgba(255, 255, 255, 0.12);
                }
            `}
        </style>
    );
}

function ThemeButton() {
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
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/20 bg-white/10 text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
            aria-label="Toggle theme"
        >
            {!mounted ? (
                <span className="h-4 w-4 rounded-full border border-current opacity-45" />
            ) : isDark ? (
                <Moon className="h-4 w-4 text-[#f4dfad]" />
            ) : (
                <Sun className="h-4 w-4 text-[#f4dfad]" />
            )}
        </button>
    );
}

function BookNowButton({
    mobile = false,
    onClick,
}: {
    mobile?: boolean;
    onClick?: () => void;
}) {
    return (
        <Link
            href="/book"
            onClick={onClick}
            className={cx(
                'group relative isolate inline-flex items-center justify-center overflow-hidden border border-[#f4dfad]/45 bg-[#f4dfad]/10 text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition duration-300 hover:-translate-y-0.5 hover:border-[#f4dfad] hover:bg-[#f4dfad] hover:text-[#153f37]',
                'before:absolute before:inset-0 before:-z-10 before:bg-[linear-gradient(120deg,rgba(255,255,255,0.18),transparent_42%,rgba(0,0,0,0.08))]',
                mobile
                    ? 'min-h-12 w-full rounded-xl px-4 text-[12px]'
                    : 'hidden min-h-10 rounded-md px-4 text-[11px] xl:inline-flex',
                'font-black tracking-[0.12em] uppercase',
            )}
        >
            <BookOpenCheck className="mr-2 h-4 w-4" />
            Book Now
            <ArrowRight className="ml-2 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </Link>
    );
}

function DesktopNav({
    url,
    settings,
}: {
    url: string;
    settings?: PublicSiteSettings;
}) {
    const [moreOpen, setMoreOpen] = useState(false);
    const closeTimer = useRef<number | null>(null);
    const items = moreItems(settings);

    function cancelClose() {
        if (closeTimer.current !== null) {
            window.clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }

    function openMore() {
        cancelClose();
        setMoreOpen(true);
    }

    function closeMoreWithDelay() {
        cancelClose();
        closeTimer.current = window.setTimeout(() => setMoreOpen(false), 260);
    }

    useEffect(
        () => () => {
            if (closeTimer.current !== null) {
                window.clearTimeout(closeTimer.current);
            }
        },
        [],
    );

    return (
        <nav
            className="bccc-public-nav hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex 2xl:gap-1.5"
            aria-label="Primary navigation"
        >
            {MAIN_NAV.map((item) => {
                const active = isActive(url, item.href);

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cx(
                            'relative inline-flex min-h-10 items-center rounded-md px-2.5 text-[12px] font-medium tracking-[0.12em] text-white/90 transition hover:bg-white/10 hover:text-white 2xl:px-3.5 2xl:text-sm',
                            active &&
                                'bg-white/10 text-white after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-[#f4dfad]/90',
                        )}
                    >
                        {item.label}
                    </Link>
                );
            })}

            <div
                className="relative"
                onMouseEnter={openMore}
                onMouseLeave={closeMoreWithDelay}
                onFocus={openMore}
                onBlur={(event) => {
                    if (
                        !event.currentTarget.contains(
                            event.relatedTarget as Node | null,
                        )
                    ) {
                        closeMoreWithDelay();
                    }
                }}
            >
                <button
                    type="button"
                    onClick={() => setMoreOpen((value) => !value)}
                    className={cx(
                        'inline-flex min-h-10 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-bold tracking-[0.01em] text-white/90 transition hover:bg-white/10 hover:text-white 2xl:px-3.5 2xl:text-sm',
                        moreOpen && 'bg-white/10 text-white',
                    )}
                    aria-expanded={moreOpen}
                >
                    More{' '}
                    <ChevronDown
                        className={cx(
                            'h-3.5 w-3.5 transition',
                            moreOpen && 'rotate-180',
                        )}
                    />
                </button>

                {moreOpen ? (
                    <div
                        className="absolute top-full left-1/2 z-[99995] mt-3 w-[min(58rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white/96 p-4 text-slate-800 shadow-[0_26px_70px_rgba(2,26,22,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d1715]/96"
                        onMouseEnter={openMore}
                        onMouseLeave={closeMoreWithDelay}
                    >
                        <div className="grid gap-2 md:grid-cols-2">
                            {items.map((child) => {
                                const Icon = child.icon;
                                const content = (
                                    <>
                                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e5f1ef] text-[#1f7465] dark:bg-white/10 dark:text-[#7dd7c6]">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-2 text-sm font-bold tracking-normal text-slate-700 dark:text-white/90">
                                                {child.label}
                                                {child.external ? (
                                                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                                                ) : null}
                                            </span>
                                            <span className="mt-1 block text-sm leading-6 tracking-normal text-slate-500 dark:text-white/55">
                                                {child.description}
                                            </span>
                                        </span>
                                    </>
                                );

                                const className =
                                    'group flex min-h-[5.25rem] items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-slate-100 dark:hover:bg-white/10';

                                return child.external ||
                                    isExternal(child.href) ? (
                                    <a
                                        key={child.label}
                                        href={child.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={className}
                                        onClick={() => setMoreOpen(false)}
                                    >
                                        {content}
                                    </a>
                                ) : (
                                    <Link
                                        key={child.label}
                                        href={child.href}
                                        className={className}
                                        onClick={() => setMoreOpen(false)}
                                    >
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        </nav>
    );
}

function MobileMenu({
    open,
    url,
    onClose,
    settings,
}: {
    open: boolean;
    url: string;
    onClose: () => void;
    settings?: PublicSiteSettings;
}) {
    const items = moreItems(settings);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        document.body.classList.toggle('overflow-hidden', open);

        return () => document.body.classList.remove('overflow-hidden');
    }, [open]);

    useEffect(() => {
        if (!open) return;

        closeButtonRef.current?.focus({ preventScroll: true });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, open]);

    if (!open) return null;

    return (
        <div
            id="public-mobile-menu"
            className="bccc-public-mobile-menu fixed inset-0 z-[99990] xl:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Public navigation menu"
        >
            <button
                type="button"
                className="absolute inset-0 bg-[#001f1b]/56 backdrop-blur-xl"
                onClick={onClose}
                aria-label="Close menu"
            />

            <aside className="bccc-public-mobile-panel absolute top-3 right-3 flex max-h-[calc(100dvh-1.5rem)] w-[min(29rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#135b50]/96 text-white shadow-[0_28px_90px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/12 px-4 py-4">
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.24em] text-white/60 uppercase">
                            Official Public Menu
                        </p>
                        <p className="mt-1 text-sm font-semibold tracking-normal">
                            City Government of Baguio
                        </p>
                    </div>

                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"
                        aria-label="Close menu"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
                    <BookNowButton mobile onClick={onClose} />

                    <div className="mt-3">
                        {[...MAIN_NAV, ...items].map((item) => {
                            const Icon = 'icon' in item ? item.icon : null;
                            const external =
                                'external' in item
                                    ? item.external
                                    : isExternal(item.href);
                            const active = isActive(url, item.href);
                            const className = cx(
                                'mb-1 flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-normal transition',
                                active
                                    ? 'bg-white text-[#125749]'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                            );
                            const content = (
                                <>
                                    {Icon ? (
                                        <Icon className="h-4 w-4 shrink-0" />
                                    ) : null}
                                    <span className="min-w-0 flex-1 truncate">
                                        {item.label}
                                    </span>
                                    {external ? (
                                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                    ) : null}
                                </>
                            );

                            return external ? (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={onClose}
                                    className={className}
                                >
                                    {content}
                                </a>
                            ) : (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={onClose}
                                    className={className}
                                >
                                    {content}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </aside>
        </div>
    );
}

export default function PublicHeader() {
    const page = usePage<PageProps>();
    const settings = page.props.siteSettings;
    const [mobileOpen, setMobileOpen] = useState(false);

    const sealSrc =
        setting(
            settings,
            'city_seal_url',
            'citySealUrl',
            'logo_url',
            'logoUrl',
        ) || '/marketing/images/logo/bccc-seal.png';
    const breatheSrc =
        setting(settings, 'breathe_baguio_logo_url', 'breatheBaguioLogoUrl') ||
        '/marketing/images/branding/breathe-light.png';

    return (
        <>
            <ThinScrollbarStyle />

            <header className="bccc-public-header fixed inset-x-0 top-0 z-[99980] border-t-[3px] border-[#514237] bg-[#176456]/96 text-white shadow-[0_10px_28px_rgba(2,26,22,0.18)] backdrop-blur-xl">
                <div className="bccc-public-header-inner mx-auto flex h-[74px] w-full max-w-[1720px] items-center gap-3 px-3 sm:px-5 lg:h-[80px] lg:px-7 2xl:px-10">
                    <Link
                        href="/"
                        className="bccc-public-brand group flex min-w-0 shrink-0 items-center gap-3"
                        aria-label="City Government of Baguio home"
                    >
                        <span className="bccc-public-seal grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] ring-1 ring-white/35 sm:h-12 sm:w-12 lg:h-14 lg:w-14">
                            <SafeImage
                                src={sealSrc}
                                fallbackSrc="/marketing/images/logo/bccc-seal.png"
                                alt="City Government of Baguio seal"
                                className="h-full w-full object-contain p-1"
                                wrapperClassName="h-full w-full"
                            />
                        </span>

                        <span className="bccc-public-caption hidden min-w-0 sm:block">
                            <span className="bccc-public-caption-title block w-fit border-b border-white/75 pb-1 text-[12px] leading-none font-medium tracking-[0.12em] text-white lg:text-[16px]">
                                Baguio Convention and Cultural Center
                            </span>
                            <span className="bccc-public-caption-subtitle mt-2 block -translate-y-[5.1px] text-[12px] leading-none font-medium tracking-[0.12em] text-white lg:text-[16px]">
                                Events Access and Scheduling Engine
                            </span>
                        </span>
                    </Link>

                    <DesktopNav url={page.url} settings={settings} />

                    <div className="bccc-public-actions ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
                        <ThemeButton />

                        <a
                            href="https://main.baguio.gov.ph/"
                            target="_blank"
                            rel="noreferrer"
                            className="hidden h-[54px] w-[118px] items-center justify-center overflow-visible md:flex lg:h-[62px] lg:w-[146px] 2xl:w-[168px]"
                            aria-label="Breathe Baguio website"
                        >
                            <SafeImage
                                src={breatheSrc}
                                fallbackSrc="/marketing/images/branding/breathe-light.png"
                                alt="Breathe Baguio"
                                className="h-full w-full -translate-y-[7.5px] scale-[2.8] object-contain"
                                wrapperClassName="h-full w-full overflow-visible"
                            />
                        </a>

                        <BookNowButton />

                        <button
                            type="button"
                            onClick={() => setMobileOpen((open) => !open)}
                            className="bccc-public-menu-toggle grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 xl:hidden"
                            aria-controls="public-mobile-menu"
                            aria-expanded={mobileOpen}
                            aria-label={
                                mobileOpen
                                    ? 'Close public menu'
                                    : 'Open public menu'
                            }
                        >
                            {mobileOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <MobileMenu
                open={mobileOpen}
                url={page.url}
                onClose={() => setMobileOpen(false)}
                settings={settings}
            />
        </>
    );
}
