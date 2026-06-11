import InputError from '@/components/input-error';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    LoaderCircle,
    Mail,
    ShieldCheck,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

type Props = {
    status?: string;
    email?: string;
    resetRequestCooldown?: string;
    resetRequestCooldownSeconds?: number;
    resetLinkExpiresInMinutes?: number;
};

function remainingCooldown(requestedAt?: string, cooldownSeconds = 60) {
    if (!requestedAt) return 0;

    const requested = new Date(requestedAt).getTime();

    if (Number.isNaN(requested)) return 0;

    return Math.max(
        0,
        cooldownSeconds - Math.floor((Date.now() - requested) / 1000),
    );
}

export default function ForgotPassword({
    status,
    email = '',
    resetRequestCooldown,
    resetRequestCooldownSeconds = 60,
    resetLinkExpiresInMinutes = 60,
}: Props) {
    const cooldownSeconds = Math.max(1, resetRequestCooldownSeconds);
    const [cooldown, setCooldown] = useState(() =>
        remainingCooldown(resetRequestCooldown, cooldownSeconds),
    );
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        email,
    });

    useEffect(() => {
        const updateCooldown = () => {
            const remaining = remainingCooldown(
                resetRequestCooldown,
                cooldownSeconds,
            );

            setCooldown(remaining);

            return remaining;
        };

        if (updateCooldown() <= 0) return;

        const timer = window.setInterval(() => {
            if (updateCooldown() <= 0) {
                window.clearInterval(timer);
            }
        }, 1000);

        return () => window.clearInterval(timer);
    }, [cooldownSeconds, resetRequestCooldown]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        clearErrors();

        post('/forgot-password', {
            preserveScroll: true,
        });
    };

    return (
        <AuthLayout
            title="Forgot password?"
            description="Enter the email connected to your account. We will send a secure, time-limited recovery link if the account exists."
        >
            <Head title="Forgot password" />

            {status ? (
                <div
                    role="status"
                    className="mb-5 rounded-[1.1rem] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                >
                    <div className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>{status}</span>
                    </div>
                </div>
            ) : null}

            <form onSubmit={submit} className="grid gap-5" noValidate>
                <label className="grid gap-2" htmlFor="email">
                    <span className="text-[11px] font-bold tracking-[0.18em] text-[#6e604c] uppercase dark:text-white/58">
                        Account email
                    </span>
                    <span className="flex min-h-14 items-center gap-3 rounded-[1rem] border border-[#d9c7a6]/80 bg-white/82 px-4 shadow-sm transition focus-within:border-[#b08d48] focus-within:ring-4 focus-within:ring-[#b08d48]/15 dark:border-white/10 dark:bg-white/7">
                        <Mail className="h-4.5 w-4.5 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />
                        <input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            autoComplete="email"
                            inputMode="email"
                            placeholder="name@example.com"
                            value={data.email}
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={
                                errors.email ? 'email-error' : undefined
                            }
                            onChange={(event) =>
                                setData(
                                    'email',
                                    event.target.value.toLowerCase(),
                                )
                            }
                            className="h-12 min-w-0 flex-1 bg-transparent text-base font-semibold text-[#21180d] outline-none placeholder:font-normal placeholder:text-[#968772] dark:text-white dark:placeholder:text-white/36"
                        />
                    </span>
                    <InputError
                        id="email-error"
                        role="alert"
                        message={errors.email}
                    />
                </label>

                <button
                    type="submit"
                    disabled={processing || cooldown > 0}
                    aria-describedby={
                        cooldown > 0 ? 'recovery-cooldown-status' : undefined
                    }
                    className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#2f2517] px-6 text-sm font-bold tracking-[0.08em] text-white uppercase shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] focus:ring-4 focus:ring-[#b08d48]/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#f1d89b] dark:text-[#17120b] dark:hover:bg-white"
                >
                    {processing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : cooldown > 0 ? (
                        <Clock3 className="h-4 w-4" />
                    ) : (
                        <Mail className="h-4 w-4" />
                    )}
                    {processing
                        ? 'Sending securely...'
                        : cooldown > 0
                          ? `Request again in ${cooldown}s`
                          : 'Send recovery link'}
                </button>

                <p
                    id="recovery-cooldown-status"
                    className="sr-only"
                    aria-live="polite"
                >
                    {cooldown > 0
                        ? `Another recovery link can be requested in ${cooldown} seconds.`
                        : 'You can request a recovery link now.'}
                </p>
            </form>

            <div className="mt-5 rounded-[1rem] border border-[#d9c7a6]/60 bg-[#fffaf0]/72 p-4 text-xs leading-6 text-[#6e604c] dark:border-white/10 dark:bg-white/5 dark:text-white/52">
                <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />
                    <p>
                        For privacy, this page does not confirm whether an email
                        is registered. Reset links expire after{' '}
                        {resetLinkExpiresInMinutes} minutes.
                    </p>
                </div>
            </div>

            <Link
                href="/login"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-bold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] focus:ring-4 focus:ring-[#b08d48]/20 focus:outline-none dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
            >
                Return to login
                <ArrowRight className="h-4 w-4" />
            </Link>
        </AuthLayout>
    );
}
