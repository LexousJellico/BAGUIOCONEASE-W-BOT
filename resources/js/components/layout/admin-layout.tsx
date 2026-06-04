import ConfigDropdown from '@/components/admin/config-dropdown';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { Link, router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Home,
    LayoutGrid,
    LogOut,
    Mail,
    Menu,
    ShieldCheck,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

type AdminLayoutProps = {
    children: ReactNode;
    title?: string;
    subtitle?: string;
};

type AuthUser = {
    name?: string | null;
    email?: string | null;
};

type SharedProps = {
    auth?: {
        user?: AuthUser | null;
    };
};

const navItems = [
    { label: 'Home', href: '/admin/home', icon: Home },
    { label: 'Facilities', href: '#spaces-config', icon: LayoutGrid },
    { label: 'Events', href: '#events-config', icon: CalendarDays },
    { label: 'Calendar', href: '#calendar-config', icon: CalendarDays },
    { label: 'Tourism Office', href: '#homepage-config', icon: ShieldCheck },
    { label: 'Contact Us', href: '#footer-config', icon: Mail },
];

export default function AdminLayout({
    children,
    title,
    subtitle,
}: AdminLayoutProps) {
    const page = usePage<SharedProps>();
    const user = page.props.auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
    const [logoutProcessing, setLogoutProcessing] = useState(false);
    useEffect(() => {
        const previous = document.body.style.overflow;

        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = previous;
        };
    }, [mobileOpen]);

    const handleLogout = () => {
        setLogoutProcessing(true);

        router.post('/logout', undefined, {
            onFinish: () => {
                setLogoutProcessing(false);
                setConfirmLogoutOpen(false);
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#f5f1e8] text-[#1f1f1c] dark:bg-[#101114] dark:text-white">
            <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[30rem] bg-gradient-to-b from-[#d9ebe0] via-[#f5f1e8] to-transparent dark:from-[#162230] dark:via-[#101114] dark:to-transparent" />

            <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f5f1e8]/92 backdrop-blur dark:border-white/10 dark:bg-[#101114]/92">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/home"
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#174f40] text-sm font-black text-white dark:bg-[#2d47ff]">
                                AD
                            </div>

                            <div>
                                <p className="text-sm font-black tracking-[0.18em] text-[#174f40] uppercase dark:text-[#9dc0ff]">
                                    BCCC Admin
                                </p>
                                <p className="text-xs text-[#5f5c56] dark:text-[#c0c0c8]">
                                    Frontend Config Console
                                </p>
                            </div>
                        </Link>
                    </div>

                    <nav className="hidden items-center gap-1 xl:flex">
                        {navItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="rounded-full px-4 py-2 text-sm font-semibold text-[#24241f] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                            >
                                {item.label}
                            </a>
                        ))}

                        <ConfigDropdown />
                    </nav>

                    <div className="hidden items-center gap-3 xl:flex">
                        <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/10 dark:bg-[#17181c]">
                            <span className="font-semibold">
                                {user?.name ?? 'Admin User'}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setConfirmLogoutOpen(true)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white dark:bg-[#2d47ff]"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileOpen((prev) => !prev)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#1f1f1c] xl:hidden dark:border-white/10 dark:bg-[#17181c] dark:text-white"
                        aria-label="Toggle admin menu"
                    >
                        {mobileOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </header>

            {mobileOpen && (
                <div className="fixed inset-0 z-[60] xl:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setMobileOpen(false)}
                    />

                    <div className="absolute top-0 right-0 h-full w-full max-w-sm overflow-y-auto bg-[#f5f1e8] p-5 dark:bg-[#111216]">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black tracking-[0.18em] text-[#174f40] uppercase dark:text-[#9dc0ff]">
                                    BCCC Admin
                                </p>
                                <p className="text-xs text-[#5f5c56] dark:text-[#c0c0c8]">
                                    Navigation
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setMobileOpen(false);
                                    setConfirmLogoutOpen(true);
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white dark:border-white/10 dark:bg-[#17181c]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {navItems.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#1f1f1c] dark:bg-[#17181c] dark:text-white"
                                >
                                    {item.label}
                                </a>
                            ))}

                            <a
                                href="#events-config"
                                onClick={() => setMobileOpen(false)}
                                className="block rounded-2xl bg-[#174f40] px-4 py-3 text-sm font-semibold text-white dark:bg-[#2d47ff]"
                            >
                                Config
                            </a>
                        </div>

                        <div className="mt-6 rounded-3xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#17181c]">
                            <p className="text-sm font-bold">
                                {user?.name ?? 'Admin User'}
                            </p>
                            <p className="mt-1 text-xs text-[#66625c] dark:text-[#c0c0c8]">
                                Logged in administrator
                            </p>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white dark:bg-[#2d47ff]"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
                {(title || subtitle) && (
                    <section className="mb-6 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
                        {title && (
                            <p className="text-xs font-black tracking-[0.18em] text-[#174f40] uppercase dark:text-[#9dc0ff]">
                                Admin Home
                            </p>
                        )}
                        {title && (
                            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="mt-3 max-w-4xl text-sm leading-7 text-[#595651] dark:text-[#c8c8ce]">
                                {subtitle}
                            </p>
                        )}
                    </section>
                )}

                {children}
            </main>
            <ConfirmActionDialog
                open={confirmLogoutOpen}
                onOpenChange={setConfirmLogoutOpen}
                title="Log out of the admin console?"
                description="You are about to end your current admin session. Unsaved changes on the page may be lost."
                confirmLabel="Log out"
                cancelLabel="Stay here"
                onConfirm={handleLogout}
                processing={logoutProcessing}
            />
        </div>
    );
}
