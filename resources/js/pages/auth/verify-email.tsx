import { Head, Link, useForm } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    CheckCircle2,
    LoaderCircle,
    MailCheck,
    MailPlus,
    Moon,
    ShieldCheck,
    Sun,
} from 'lucide-react';

type Props = {
    status?: string;
};

function getInitialDarkMode() {
    if (typeof window === 'undefined') return false;

    const stored = window.localStorage.getItem('theme');

    if (stored === 'dark') return true;
    if (stored === 'light') return false;

    return document.documentElement.classList.contains('dark');
}

function applyTheme(isDark: boolean) {
    if (typeof window === 'undefined') return;

    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

export default function VerifyEmail({ status }: Props) {
    const [isDark, setIsDark] = useState(false);
    const reducedMotion = Boolean(useReducedMotion());

    const resendForm = useForm({});
    const logoutForm = useForm({});

    const transition: Transition = reducedMotion
        ? { duration: 0 }
        : { duration: 0.58, ease: [0.16, 1, 0.3, 1] };

    useEffect(() => {
        const initial = getInitialDarkMode();
        setIsDark(initial);
        applyTheme(initial);
    }, []);

    function toggleTheme() {
        setIsDark((current) => {
            const next = !current;
            applyTheme(next);
            return next;
        });
    }

    function resend(event: FormEvent) {
        event.preventDefault();

        resendForm.post('/email/verification-notification', {
            preserveScroll: true,
        });
    }

    function logout(event: FormEvent) {
        event.preventDefault();

        logoutForm.post('/logout');
    }

    const sent = status === 'verification-link-sent';

    return (
        <>
            <Head title="Verify Email" />

            <main className="relative min-h-screen overflow-hidden bg-[#0d0f12] text-[#201a12] antialiased dark:text-white">
                <div className="absolute inset-0">
                    <img
                        src="/marketing/images/hero/noon2.jpg"
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover blur-[12px] scale-105"
                    />
                </div>

                <div className="absolute inset-0 bg-[#f8f5ef]/78 backdrop-blur-[10px] dark:bg-[#0d0f12]/78" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(176,141,72,0.22),transparent_28rem),radial-gradient(circle_at_82%_70%,rgba(47,77,141,0.24),transparent_30rem)]" />

                <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-4 py-5 sm:px-6 lg:px-8">
                    <header className="flex items-center justify-between gap-3">
                        <Link
                            href="/"
                            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d9c7a6]/80 bg-white/72 px-4 text-sm font-bold text-[#2f2517] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#b08d48]/25 dark:border-white/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back to public site
                        </Link>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="grid h-11 w-11 place-items-center rounded-full border border-[#d9c7a6]/80 bg-white/72 text-[#2f2517] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#b08d48]/25 dark:border-white/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                        </button>
                    </header>

                    <section className="flex flex-1 items-center justify-center py-8">
                        <motion.div
                            initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.97, filter: 'blur(12px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            transition={transition}
                            className="grid w-full max-w-[1040px] overflow-hidden rounded-[2.25rem] border border-[#d9c7a6]/70 bg-white/76 shadow-[0_35px_120px_rgba(47,37,23,0.26)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101419]/76 lg:grid-cols-[0.95fr_1.05fr]"
                        >
                            <aside className="relative hidden min-h-[36rem] overflow-hidden bg-[#17120b] lg:block">
                                <img
                                    src="/marketing/images/facilities/darkvip.JPG"
                                    alt=""
                                    aria-hidden="true"
                                    className="h-full w-full object-cover"
                                />

                                <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/38 to-black/16" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-transparent to-black/18" />

                                <div className="absolute bottom-8 left-8 right-8 text-left text-white">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#f1d89b]">
                                        Email Verification
                                    </p>

                                    <h1 className="mt-4 max-w-[10ch] text-5xl font-semibold leading-[0.92] tracking-[-0.08em]">
                                        Secure your BCCC EASE account.
                                    </h1>

                                    <p className="mt-5 max-w-[64ch] text-base leading-8 text-white/72">
                                        Verify your email before continuing to booking, reservation, and workspace features.
                                    </p>

                                    <div className="mt-7 grid gap-3 xl:grid-cols-2">
                                        <FeaturePill icon={ShieldCheck} label="Protected access" />
                                        <FeaturePill icon={MailCheck} label="Email confirmed" />
                                    </div>
                                </div>
                            </aside>

                            <div className="flex min-h-[36rem] items-center p-6 sm:p-8 lg:p-10">
                                <div className="mx-auto w-full max-w-[30rem] text-left">
                                    <div className="grid h-14 w-14 place-items-center rounded-full border border-[#d9c7a6]/70 bg-[#fffaf0] text-[#8b672d] shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-[#f1d89b]">
                                        <MailCheck className="h-7 w-7" />
                                    </div>

                                    <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                        Verify Email
                                    </p>

                                    <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#21180d] dark:text-white">
                                        Check your inbox
                                    </h2>

                                    <p className="mt-4 text-[15px] leading-7 text-[#6e604c] dark:text-white/60">
                                        Before continuing, please verify your email address by clicking the verification link we sent to your inbox.
                                    </p>

                                    <p className="mt-3 text-[15px] leading-7 text-[#6e604c] dark:text-white/60">
                                        If you did not receive the email, you can request another verification link below.
                                    </p>

                                    {sent ? (
                                        <div
                                            role="status"
                                            className="mt-6 rounded-[1.1rem] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                                        >
                                            <div className="flex gap-3">
                                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                                                <span>A new verification link has been sent to your email address.</span>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                        <form onSubmit={resend}>
                                            <button
                                                type="submit"
                                                disabled={resendForm.processing}
                                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2f2517] px-6 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] focus:outline-none focus:ring-4 focus:ring-[#b08d48]/25 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#f1d89b] dark:text-[#17120b] dark:hover:bg-white"
                                            >
                                                {resendForm.processing ? (
                                                    <>
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <MailPlus className="h-4 w-4" />
                                                        Resend Email
                                                    </>
                                                )}
                                            </button>
                                        </form>

                                        <form onSubmit={logout}>
                                            <button
                                                type="submit"
                                                disabled={logoutForm.processing}
                                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-6 text-sm font-bold uppercase tracking-[0.08em] text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] focus:outline-none focus:ring-4 focus:ring-[#b08d48]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                            >
                                                Log Out
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </section>
                </div>
            </main>
        </>
    );
}

function FeaturePill({
    icon: Icon,
    label,
}: {
    icon: typeof ShieldCheck;
    label: string;
}) {
    return (
        <div className="rounded-[1rem] border border-white/12 bg-white/10 p-4 backdrop-blur-xl">
            <Icon className="h-5 w-5 text-[#f1d89b]" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-white">{label}</p>
        </div>
    );
}
