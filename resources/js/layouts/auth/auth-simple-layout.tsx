import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    KeyRound,
    Moon,
    ShieldCheck,
    Sun,
} from 'lucide-react';
import { type PropsWithChildren, useEffect, useState } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

function getInitialDarkMode() {
    if (typeof window === 'undefined') return false;

    const stored = window.localStorage.getItem('theme');

    if (stored === 'dark') return true;
    if (stored === 'light') return false;

    return document.documentElement.classList.contains('dark');
}

function applyTheme(isDark: boolean) {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const [isDark, setIsDark] = useState(false);
    const reducedMotion = Boolean(useReducedMotion());

    useEffect(() => {
        const initial = getInitialDarkMode();
        setIsDark(initial);
        applyTheme(initial);
    }, []);

    const toggleTheme = () => {
        setIsDark((current) => {
            const next = !current;
            applyTheme(next);
            return next;
        });
    };

    return (
        <main className="bccc-auth-access-page relative min-h-screen overflow-x-hidden bg-[#0d0f12] text-[#201a12] antialiased dark:text-white">
            <a
                href="#recovery-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100000] focus:rounded-full focus:bg-[#2f2517] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
            >
                Skip to account recovery
            </a>

            <div className="fixed inset-0">
                <img
                    src="/marketing/images/hero/noon2.jpg"
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full scale-105 object-cover blur-[12px]"
                />
                <div className="absolute inset-0 bg-[#f8f5ef]/80 backdrop-blur-[12px] dark:bg-[#0d0f12]/82" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(176,141,72,0.24),transparent_28rem),radial-gradient(circle_at_82%_70%,rgba(47,77,141,0.22),transparent_30rem)]" />
            </div>

            <div className="bccc-auth-access-shell relative z-10 mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-4 py-5 sm:px-6 lg:px-8">
                <header className="bccc-auth-topbar flex items-center justify-between gap-3">
                    <Link
                        href={home()}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d9c7a6]/80 bg-white/76 px-4 text-sm font-bold text-[#2f2517] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white focus:ring-4 focus:ring-[#b08d48]/25 focus:outline-none dark:border-white/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to public site
                    </Link>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="grid h-11 w-11 place-items-center rounded-full border border-[#d9c7a6]/80 bg-white/76 text-[#2f2517] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white focus:ring-4 focus:ring-[#b08d48]/25 focus:outline-none dark:border-white/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
                        aria-label={
                            isDark
                                ? 'Switch to light mode'
                                : 'Switch to dark mode'
                        }
                    >
                        {isDark ? (
                            <Sun className="h-4.5 w-4.5" />
                        ) : (
                            <Moon className="h-4.5 w-4.5" />
                        )}
                    </button>
                </header>

                <section
                    id="recovery-content"
                    tabIndex={-1}
                    className="bccc-auth-center flex flex-1 items-center justify-center py-6 outline-none sm:py-8"
                >
                    <motion.div
                        initial={
                            reducedMotion
                                ? false
                                : {
                                      opacity: 0,
                                      y: 24,
                                      scale: 0.98,
                                      filter: 'blur(12px)',
                                  }
                        }
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            filter: 'blur(0px)',
                        }}
                        transition={{
                            duration: reducedMotion ? 0 : 0.58,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        className="bccc-auth-card grid w-full max-w-[1080px] overflow-hidden rounded-[2.25rem] border border-[#d9c7a6]/70 bg-white/78 shadow-[0_35px_120px_rgba(47,37,23,0.26)] backdrop-blur-2xl lg:grid-cols-[0.92fr_1.08fr] dark:border-white/10 dark:bg-[#101419]/78"
                    >
                        <aside className="relative hidden min-h-[39rem] overflow-hidden bg-[#17120b] lg:block">
                            <img
                                src="/marketing/images/facilities/darkvip.JPG"
                                alt=""
                                aria-hidden="true"
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/46 to-black/18" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-transparent to-black/20" />

                            <div className="absolute inset-x-8 bottom-8 text-white">
                                <p className="text-[11px] font-bold tracking-[0.26em] text-[#f1d89b] uppercase">
                                    Secure Account Recovery
                                </p>
                                <h1 className="mt-4 max-w-[11ch] text-5xl leading-[0.94] font-semibold tracking-[-0.075em]">
                                    Return to your workspace safely.
                                </h1>
                                <p className="mt-5 max-w-[34rem] text-sm leading-7 text-white/72">
                                    Protected recovery keeps your booking,
                                    payment, calendar, and account information
                                    private.
                                </p>

                                <div className="mt-7 grid gap-3 xl:grid-cols-3">
                                    <Feature
                                        icon={ShieldCheck}
                                        label="Secure"
                                    />
                                    <Feature icon={KeyRound} label="Private" />
                                    <Feature
                                        icon={CheckCircle2}
                                        label="Verified"
                                    />
                                </div>
                            </div>
                        </aside>

                        <div className="bccc-auth-pane flex min-h-[34rem] items-center p-5 sm:p-8 lg:min-h-[39rem] lg:p-10">
                            <div className="bccc-auth-pane-inner mx-auto w-full max-w-[30rem]">
                                <div className="grid h-14 w-14 place-items-center rounded-full border border-[#d9c7a6]/70 bg-[#fffaf0] text-[#8b672d] shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-[#f1d89b]">
                                    <CalendarDays className="h-6 w-6" />
                                </div>

                                <p className="mt-6 text-[11px] font-bold tracking-[0.24em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                                    BCCC EASE Access
                                </p>
                                <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#21180d] sm:text-5xl dark:text-white">
                                    {title}
                                </h2>
                                <p className="mt-4 text-sm leading-7 text-[#6e604c] dark:text-white/60">
                                    {description}
                                </p>

                                <div className="mt-7">{children}</div>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </div>
        </main>
    );
}

function Feature({
    icon: Icon,
    label,
}: {
    icon: typeof ShieldCheck;
    label: string;
}) {
    return (
        <div className="rounded-[1rem] border border-white/12 bg-white/10 p-3 backdrop-blur-xl">
            <Icon className="h-4 w-4 text-[#f1d89b]" />
            <p className="mt-2 text-xs font-bold text-white">{label}</p>
        </div>
    );
}
