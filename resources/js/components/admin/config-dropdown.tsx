import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronDown,
    LayoutGrid,
    Megaphone,
    Package2,
    PanelsTopLeft,
    ShieldCheck,
    SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type ConfigDropdownProps = {
    fullWidth?: boolean;
    onNavigate?: () => void;
};

export const adminConfigItems = [
    {
        label: 'BCCC Events Form',
        href: '/admin/home?tab=events&editor=bccc-events',
        icon: Megaphone,
        description: 'Convention-center public event entries',
        editor: 'bccc-events',
    },
    {
        label: 'Baguio City Events Form',
        href: '/admin/home?tab=events&editor=city-events',
        icon: Megaphone,
        description: 'City public-event highlight entries',
        editor: 'city-events',
    },
    {
        label: 'Packages Form',
        href: '/admin/home?tab=home&editor=packages',
        icon: Package2,
        description: 'Special offers and feature package cards',
        editor: 'packages',
    },
    {
        label: 'Calendar Rules Form',
        href: '/admin/home?tab=calendar&editor=calendar-rules',
        icon: CalendarDays,
        description: 'Red / gold / blue availability rules',
        editor: 'calendar-rules',
    },
    {
        label: 'Spaces Form',
        href: '/admin/home?tab=facilities&editor=spaces',
        icon: LayoutGrid,
        description: 'Venue spaces, facility cards, and images',
        editor: 'spaces',
    },
    {
        label: 'Homepage Stats Form',
        href: '/admin/home?tab=home&editor=stats',
        icon: PanelsTopLeft,
        description: 'Animated count-up metrics on the homepage',
        editor: 'stats',
    },
    {
        label: 'Site Details Form',
        href: '/admin/home?tab=contact&editor=site-details',
        icon: ShieldCheck,
        description: 'Map, address, phone, email, and footer info',
        editor: 'site-details',
    },
    {
        label: 'Display Ordering',
        href: '/admin/home?tab=home&editor=ordering',
        icon: SlidersHorizontal,
        description: 'Drag-and-drop content ordering boards',
        editor: 'ordering',
    },
] as const;

export default function ConfigDropdown({
    fullWidth = false,
    onNavigate,
}: ConfigDropdownProps) {
    const page = usePage();
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);

    const activeEditor = useMemo(() => {
        const params = new URLSearchParams(page.url.split('?')[1] ?? '');
        return params.get('editor');
    }, [page.url]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const buttonClass = fullWidth
        ? `inline-flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              open
                  ? 'bg-[#174f40] text-white dark:bg-[#2d47ff]'
                  : 'bg-white text-[#24241f] hover:bg-[#ece8de] dark:bg-[#1d1e22] dark:text-white dark:hover:bg-[#26272d]'
          }`
        : `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              open
                  ? 'bg-[#174f40] text-white dark:bg-[#2d47ff]'
                  : 'text-[#24241f] hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
          }`;

    return (
        <div ref={rootRef} className={`relative ${fullWidth ? 'w-full' : ''}`}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={buttonClass}
            >
                <span>Config</span>
                <ChevronDown
                    className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div
                    className={`z-50 overflow-hidden rounded-[1.6rem] border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-[#16171b] ${
                        fullWidth
                            ? 'mt-3 w-full'
                            : 'absolute top-[calc(100%+0.75rem)] right-0 w-[23rem]'
                    }`}
                >
                    <div className="border-b border-black/10 px-4 py-4 dark:border-white/10">
                        <p className="text-xs font-black tracking-[0.16em] text-[#174f40] uppercase dark:text-[#9dc0ff]">
                            Config Menu
                        </p>
                        <p className="mt-1 text-sm text-[#5a5650] dark:text-[#c8c8ce]">
                            Open one editor at a time while keeping the admin
                            page in preview mode.
                        </p>
                    </div>

                    <div className="p-3">
                        {adminConfigItems.map((item) => {
                            const Icon = item.icon;
                            const active = activeEditor === item.editor;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => {
                                        setOpen(false);
                                        onNavigate?.();
                                    }}
                                    className={`flex items-start gap-3 rounded-2xl px-3 py-3 transition ${
                                        active
                                            ? 'bg-[#eef4f1] dark:bg-[#1d2330]'
                                            : 'hover:bg-[#f5efe4] dark:hover:bg-[#1e2026]'
                                    }`}
                                >
                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef4f1] text-[#174f40] dark:bg-[#1d2330] dark:text-[#9dc0ff]">
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[#1f1f1c] dark:text-white">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-xs leading-6 text-[#64615b] dark:text-[#c3c3ca]">
                                            {item.description}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
