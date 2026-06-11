import InputError from '@/components/input-error';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Check,
    Eye,
    EyeOff,
    LoaderCircle,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from 'lucide-react';
import { FormEvent, useMemo, useRef, useState } from 'react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const emailInput = useRef<HTMLInputElement | null>(null);
    const passwordInput = useRef<HTMLInputElement | null>(null);
    const confirmationInput = useRef<HTMLInputElement | null>(null);
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        token,
        email: email ?? '',
        password: '',
        password_confirmation: '',
    });

    const checks = useMemo(
        () => [
            {
                label: 'At least 8 characters',
                passed: data.password.length >= 8,
            },
            {
                label: 'Contains a letter',
                passed: /\p{L}/u.test(data.password),
            },
            {
                label: 'Contains a number or symbol',
                passed: /[\p{N}\p{S}\p{P}]/u.test(data.password),
            },
            {
                label: 'Passwords match',
                passed:
                    data.password.length > 0 &&
                    data.password === data.password_confirmation,
            },
        ],
        [data.password, data.password_confirmation],
    );
    const passedChecks = checks.filter((check) => check.passed).length;
    const canSubmit = passedChecks === checks.length;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        clearErrors();

        post('/reset-password', {
            preserveScroll: true,
            onError: (submissionErrors) => {
                if (submissionErrors.email) {
                    emailInput.current?.focus();
                    return;
                }

                if (submissionErrors.password) {
                    passwordInput.current?.focus();
                    return;
                }

                confirmationInput.current?.focus();
            },
        });
    };

    return (
        <AuthLayout
            title="Create a new password"
            description="Choose a strong password for your BCCC EASE account. Your recovery link is single-use and time-limited."
        >
            <Head title="Reset password" />

            <form onSubmit={submit} className="grid gap-4" noValidate>
                <RecoveryField
                    id="email"
                    inputRef={emailInput}
                    icon={Mail}
                    label="Account email"
                    type="email"
                    value={data.email}
                    onChange={(value) => setData('email', value.toLowerCase())}
                    error={errors.email}
                    autoComplete="email"
                    readOnly={Boolean(email)}
                />

                <RecoveryField
                    id="password"
                    inputRef={passwordInput}
                    icon={LockKeyhole}
                    label="New password"
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={(value) => setData('password', value)}
                    error={errors.password}
                    autoComplete="new-password"
                    autoFocus
                    trailing={
                        <VisibilityButton
                            visible={showPassword}
                            onClick={() => setShowPassword((value) => !value)}
                            label="new password"
                        />
                    }
                />

                <RecoveryField
                    id="password_confirmation"
                    inputRef={confirmationInput}
                    icon={ShieldCheck}
                    label="Confirm new password"
                    type={showConfirmation ? 'text' : 'password'}
                    value={data.password_confirmation}
                    onChange={(value) =>
                        setData('password_confirmation', value)
                    }
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                    trailing={
                        <VisibilityButton
                            visible={showConfirmation}
                            onClick={() =>
                                setShowConfirmation((value) => !value)
                            }
                            label="password confirmation"
                        />
                    }
                />

                <div
                    className="rounded-[1rem] border border-[#d9c7a6]/60 bg-[#fffaf0]/72 p-3 dark:border-white/10 dark:bg-white/5"
                    aria-live="polite"
                >
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-bold tracking-[0.16em] text-[#6e604c] uppercase dark:text-white/50">
                            Password requirements
                        </p>
                        <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase ${
                                canSubmit
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200'
                                    : 'bg-[#eee5d5] text-[#806d51] dark:bg-white/8 dark:text-white/45'
                            }`}
                        >
                            {canSubmit
                                ? 'Ready'
                                : `${passedChecks}/${checks.length} complete`}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {checks.map((check) => (
                            <div
                                key={check.label}
                                className="flex items-center gap-2 text-xs font-semibold text-[#6e604c] dark:text-white/52"
                            >
                                <span
                                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                                        check.passed
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200'
                                            : 'bg-[#eee5d5] text-[#9b8a70] dark:bg-white/8 dark:text-white/38'
                                    }`}
                                >
                                    <Check className="h-3 w-3" />
                                </span>
                                {check.label}
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing || !canSubmit}
                    className="mt-1 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#2f2517] px-6 text-sm font-bold tracking-[0.08em] text-white uppercase shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] focus:ring-4 focus:ring-[#b08d48]/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#f1d89b] dark:text-[#17120b] dark:hover:bg-white"
                >
                    {processing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                        <ShieldCheck className="h-4 w-4" />
                    )}
                    {processing ? 'Securing account...' : 'Reset password'}
                </button>
            </form>

            <p className="mt-5 text-center text-xs leading-6 text-[#6e604c] dark:text-white/48">
                Link expired or already used?{' '}
                <Link
                    href="/forgot-password"
                    className="font-bold text-[#8b672d] underline underline-offset-4 dark:text-[#f1d89b]"
                >
                    Request a new recovery link
                </Link>
            </p>
        </AuthLayout>
    );
}

function RecoveryField({
    id,
    inputRef,
    icon: Icon,
    label,
    error,
    trailing,
    onChange,
    ...inputProps
}: {
    id: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    icon: typeof Mail;
    label: string;
    error?: string;
    trailing?: React.ReactNode;
    onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
    const errorId = `${id}-error`;

    return (
        <label className="grid gap-2" htmlFor={id}>
            <span className="text-[11px] font-bold tracking-[0.18em] text-[#6e604c] uppercase dark:text-white/58">
                {label}
            </span>
            <span className="flex min-h-14 items-center gap-3 rounded-[1rem] border border-[#d9c7a6]/80 bg-white/82 px-4 shadow-sm transition focus-within:border-[#b08d48] focus-within:ring-4 focus-within:ring-[#b08d48]/15 dark:border-white/10 dark:bg-white/7">
                <Icon className="h-4.5 w-4.5 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />
                <input
                    {...inputProps}
                    id={id}
                    ref={inputRef}
                    required
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-12 min-w-0 flex-1 bg-transparent text-base font-semibold text-[#21180d] outline-none placeholder:font-normal placeholder:text-[#968772] read-only:cursor-default read-only:opacity-70 dark:text-white dark:placeholder:text-white/36"
                />
                {trailing}
            </span>
            <InputError id={errorId} role="alert" message={error} />
        </label>
    );
}

function VisibilityButton({
    visible,
    label,
    onClick,
}: {
    visible: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#6e604c] transition hover:bg-[#f4ead7] hover:text-[#2f2517] dark:text-white/54 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
            aria-pressed={visible}
        >
            {visible ? (
                <EyeOff className="h-4 w-4" />
            ) : (
                <Eye className="h-4 w-4" />
            )}
        </button>
    );
}
