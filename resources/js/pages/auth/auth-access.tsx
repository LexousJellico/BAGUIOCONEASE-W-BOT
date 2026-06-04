import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    CalendarDays,
    Check,
    CheckCircle2,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    Moon,
    ShieldCheck,
    Sparkles,
    Sun,
    User,
    XCircle,
} from 'lucide-react';

type AuthMode = 'login' | 'register';

type Props = {
    defaultMode?: AuthMode;
    status?: string;
    canResetPassword?: boolean;
};

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    redirect_to: string;
};

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    verification_code: string;
    redirect_to: string;
};

type PasswordCheck = {
    label: string;
    passed: boolean;
};

const REGISTER_FIELD_NAMES = [
    'name',
    'email',
    'password',
    'password_confirmation',
    'verification_code',
    'redirect_to',
] as const satisfies Array<keyof RegisterForm>;

type RegisterFieldName = (typeof REGISTER_FIELD_NAMES)[number];

const LOGIN_IMAGE = '/marketing/images/hero/noon2.jpg';
const REGISTER_IMAGE = '/marketing/images/facilities/darkvip.JPG';

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

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

function passwordChecks(password: string, confirmation: string): PasswordCheck[] {
    return [
        { label: 'At least 8 characters', passed: password.length >= 8 },
        { label: 'Contains a letter', passed: /[A-Za-z]/.test(password) },
        { label: 'Contains a number or symbol', passed: /[\d\W_]/.test(password) },
        { label: 'Passwords match', passed: password.length > 0 && password === confirmation },
    ];
}

function isRegisterFieldName(value: string): value is RegisterFieldName {
    return REGISTER_FIELD_NAMES.includes(value as RegisterFieldName);
}

export default function AuthAccessPage({
    defaultMode = 'login',
    status,
    canResetPassword = true,
}: Props) {
    const [mode, setMode] = useState<AuthMode>(defaultMode);
    const [isDark, setIsDark] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);

    const reducedMotion = Boolean(useReducedMotion());
    const loginEmailRef = useRef<HTMLInputElement | null>(null);
    const registerNameRef = useRef<HTMLInputElement | null>(null);
    const redirectTo =
        typeof window === 'undefined'
            ? ''
            : (new URLSearchParams(window.location.search).get('redirect_to') ?? '');
    const authPath = (nextMode: AuthMode) => {
        const path = nextMode === 'login' ? '/login' : '/register';

        return redirectTo
            ? `${path}?redirect_to=${encodeURIComponent(redirectTo)}`
            : path;
    };

    const loginForm = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
        redirect_to: redirectTo,
    });

    const registerForm = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        verification_code: '',
        redirect_to: redirectTo,
    });

    const activeProcessing = mode === 'login' ? loginForm.processing : registerForm.processing;
    const pageTitle = mode === 'login' ? 'Log in' : 'Create account';

    const checks = useMemo(
        () => passwordChecks(registerForm.data.password, registerForm.data.password_confirmation),
        [registerForm.data.password, registerForm.data.password_confirmation],
    );

    const passedChecks = checks.filter((check) => check.passed).length;
    const passwordStrength = registerForm.data.password.length === 0 ? 0 : passedChecks;

    const copy = useMemo(() => {
        if (mode === 'login') {
            return {
                eyebrow: 'Welcome Back',
                title: 'Access your BCCC EASE workspace.',
                description:
                    'Sign in to manage bookings, availability, payments, reports, public content, and operational workflows.',
                image: LOGIN_IMAGE,
            };
        }

        return {
            eyebrow: 'Create Access',
            title: 'Start your BCCC EASE account.',
            description:
                'Register to request bookings, monitor reservations, and access BCCC scheduling services.',
            image: REGISTER_IMAGE,
        };
    }, [mode]);

    const softTransition: Transition = reducedMotion
        ? { duration: 0 }
        : { duration: 0.58, ease: [0.16, 1, 0.3, 1] };

    const panelTransition: Transition = reducedMotion
        ? { duration: 0 }
        : { duration: 0.9, ease: [0.16, 1, 0.3, 1] };

    useEffect(() => {
        const initial = getInitialDarkMode();
        setIsDark(initial);
        applyTheme(initial);
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (mode === 'login') {
                loginEmailRef.current?.focus();
                return;
            }

            registerNameRef.current?.focus();
        }, reducedMotion ? 0 : 480);

        return () => window.clearTimeout(timeout);
    }, [mode, reducedMotion]);

    function toggleTheme() {
        setIsDark((current) => {
            const next = !current;
            applyTheme(next);
            return next;
        });
    }

    function switchMode(nextMode: AuthMode) {
        if (nextMode === mode || activeProcessing) return;

        loginForm.clearErrors();
        registerForm.clearErrors();
        setShowPassword(false);
        setShowConfirmPassword(false);
        setMode(nextMode);

        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', authPath(nextMode));
        }
    }

    function submitLogin(event: FormEvent) {
        event.preventDefault();

        loginForm.post('/login', {
            preserveScroll: true,
            onFinish: () => loginForm.reset('password'),
        });
    }

    function submitRegister(event: FormEvent) {
        event.preventDefault();

        // Basic client-side validation check
        if (passedChecks < 4 && registerForm.data.password.length > 0) return;

        registerForm.clearErrors();
        setIsSendingCode(true);

        axios.post('/register/send-verification', {
            name: registerForm.data.name,
            email: registerForm.data.email
        }).then(() => {
            setShowVerificationModal(true);
        }).catch((error: unknown) => {
            if (axios.isAxiosError<{ errors?: Record<string, string[]> }>(error) && error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.entries(errors).forEach(([key, messages]) => {
                    if (isRegisterFieldName(key)) {
                        registerForm.setError(
                            key,
                            messages[0] ?? 'Please review this field.',
                        );
                    }
                });
            } else {
                registerForm.setError('email', 'An error occurred while sending the code.');
            }
        }).finally(() => {
            setIsSendingCode(false);
        });
    }

    function submitVerificationCode(event: FormEvent) {
        event.preventDefault();

        registerForm.post('/register', {
            preserveScroll: true,
            onSuccess: () => setShowVerificationModal(false),
            onFinish: () => registerForm.reset('password', 'password_confirmation', 'verification_code'),
        });
    }

    function handleModeKey(event: React.KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            switchMode('login');
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            switchMode('register');
        }
    }

    return (
        <>
            <Head title={pageTitle} />

            <main className="bccc-auth-access-page relative min-h-screen overflow-hidden bg-[#0d0f12] text-[#201a12] antialiased dark:text-white">
                <SkipLink />

                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={`auth-bg-${mode}`}
                        initial={reducedMotion ? false : { opacity: 0, scale: 1.04, filter: 'blur(18px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(12px)' }}
                        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02, filter: 'blur(22px)' }}
                        transition={{ duration: reducedMotion ? 0 : 0.82, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0"
                    >
                        <img src={copy.image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                    </motion.div>
                </AnimatePresence>

                <div className="absolute inset-0 bg-[#f8f5ef]/78 backdrop-blur-[16px] dark:bg-[#0d0f12]/78" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(176,141,72,0.22),transparent_28rem),radial-gradient(circle_at_82%_70%,rgba(47,77,141,0.24),transparent_30rem)]" />
                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#f8f5ef] to-transparent dark:from-[#0d0f12]" />

                <div className="bccc-auth-access-shell relative z-10 mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-4 py-5 sm:px-6 lg:px-8">
                    <header className="bccc-auth-topbar flex items-center justify-between gap-3">
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

                    <section id="auth-form" className="bccc-auth-center flex flex-1 items-center justify-center py-8">
                        <div className="bccc-auth-stage w-full max-w-[1180px]">
                            <MobileBrand />

                            <div className="bccc-auth-card relative overflow-hidden rounded-[2.25rem] border border-[#d9c7a6]/70 bg-white/74 shadow-[0_35px_120px_rgba(47,37,23,0.26)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101419]/74">
                                <div
                                    role="tablist"
                                    aria-label="Authentication mode"
                                    onKeyDown={handleModeKey}
                                    className="absolute left-1/2 top-5 z-50 hidden -translate-x-1/2 grid-cols-2 gap-1 rounded-full border border-white/20 bg-black/18 p-1 backdrop-blur-2xl lg:grid"
                                >
                                    <ModeTab active={mode === 'login'} disabled={activeProcessing} onClick={() => switchMode('login')}>
                                        Login
                                    </ModeTab>

                                    <ModeTab active={mode === 'register'} disabled={activeProcessing} onClick={() => switchMode('register')}>
                                        Register
                                    </ModeTab>
                                </div>

                                <div className="bccc-auth-form-grid grid h-auto lg:h-[43rem] lg:grid-cols-2">
                                    <AuthPane active={mode === 'register'}>
                                        <RegisterFormPanel
                                            registerNameRef={registerNameRef}
                                            registerForm={registerForm}
                                            showPassword={showPassword}
                                            showConfirmPassword={showConfirmPassword}
                                            setShowPassword={setShowPassword}
                                            setShowConfirmPassword={setShowConfirmPassword}
                                            checks={checks}
                                            passwordStrength={passwordStrength}
                                            onSubmit={submitRegister}
                                            transition={softTransition}
                                            reducedMotion={reducedMotion}
                                            isSendingCode={isSendingCode}
                                        />
                                    </AuthPane>

                                    <AuthPane active={mode === 'login'}>
                                        <LoginFormPanel
                                            loginEmailRef={loginEmailRef}
                                            loginForm={loginForm}
                                            showPassword={showPassword}
                                            setShowPassword={setShowPassword}
                                            status={status}
                                            canResetPassword={canResetPassword}
                                            onSubmit={submitLogin}
                                            transition={softTransition}
                                            reducedMotion={reducedMotion}
                                        />
                                    </AuthPane>
                                </div>

                                <motion.aside
                                    aria-hidden="true"
                                    className="bccc-auth-image-panel absolute top-0 z-40 hidden h-[43rem] overflow-hidden border border-white/16 bg-[#17120b] shadow-[0_40px_120px_rgba(0,0,0,0.38)] lg:block"
                                    initial={false}
                                    animate={
                                        mode === 'login'
                                            ? {
                                                  left: '0%',
                                                  width: '50%',
                                                  borderRadius: '2.25rem 0 0 2.25rem',
                                              }
                                            : {
                                                  left: '50%',
                                                  width: '50%',
                                                  borderRadius: '0 2.25rem 2.25rem 0',
                                              }
                                    }
                                    transition={panelTransition}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.img
                                            key={`panel-image-${mode}`}
                                            src={copy.image}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            initial={reducedMotion ? false : { opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
                                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
                                            transition={softTransition}
                                        />
                                    </AnimatePresence>

                                    <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/38 to-black/16" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-transparent to-black/18" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(241,216,155,0.2),transparent_22rem)]" />

                                    <motion.div
                                        key={`image-copy-${mode}`}
                                        initial={reducedMotion ? false : { opacity: 0, y: 24, filter: 'blur(10px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        transition={softTransition}
                                        className="absolute bottom-8 left-8 right-8 text-left text-white"
                                    >
                                        <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#f1d89b]">
                                            {copy.eyebrow}
                                        </p>

                                        <h1 className="mt-4 max-w-[10ch] text-5xl font-semibold leading-[0.92] tracking-[-0.08em]">
                                            {copy.title}
                                        </h1>

                                        <p className="mt-5 max-w-[64ch] text-base leading-8 text-white/72">
                                            {copy.description}
                                        </p>

                                        <div className="mt-7 grid gap-3 xl:grid-cols-3">
                                            <FeaturePill icon={ShieldCheck} label="Secure" />
                                            <FeaturePill icon={Sparkles} label="Smooth" />
                                            <FeaturePill icon={CheckCircle2} label="Fast" />
                                        </div>
                                    </motion.div>
                                </motion.aside>

                                <div className="grid grid-cols-2 gap-1 border-t border-[#eadcc2]/80 p-2 dark:border-white/10 lg:hidden">
                                    <ModeTab active={mode === 'login'} disabled={activeProcessing} onClick={() => switchMode('login')}>
                                        Login
                                    </ModeTab>

                                    <ModeTab active={mode === 'register'} disabled={activeProcessing} onClick={() => switchMode('register')}>
                                        Register
                                    </ModeTab>
                                </div>
                            </div>

                            <p className="mx-auto mt-5 max-w-[60ch] text-center text-xs leading-6 text-[#6e604c] dark:text-white/48">
                                By accessing BCCC EASE, you agree to use the system for legitimate booking,
                                reservation, reporting, and public service transactions.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <AnimatePresence>
                {showVerificationModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowVerificationModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-white/10 dark:bg-[#101419]"
                        >
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f5ef] text-[#2f2517] dark:bg-white/10 dark:text-white">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-[#2f2517] dark:text-white">
                                    Verify your email
                                </h3>
                                <p className="mb-6 text-sm text-[#6e604c] dark:text-white/60">
                                    We sent a 6-digit code to <strong className="text-[#2f2517] dark:text-white">{registerForm.data.email}</strong>. Enter it below to complete registration.
                                </p>
                            </div>

                            <form onSubmit={submitVerificationCode} className="grid gap-4">
                                <Field
                                    icon={CheckCircle2}
                                    label="6-Digit Code"
                                    type="text"
                                    value={registerForm.data.verification_code}
                                    error={registerForm.errors.verification_code}
                                    onChange={(value) => registerForm.setData('verification_code', value)}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    className="text-center text-xl tracking-[0.25em]"
                                />

                                <div className="mt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowVerificationModal(false)}
                                        className="flex-1 rounded-full border border-[#d9c7a6] bg-transparent px-4 py-3 text-sm font-bold text-[#2f2517] transition hover:bg-[#f8f5ef] focus:outline-none focus:ring-4 focus:ring-[#b08d48]/25 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <div className="flex-[1.5]">
                                        <SubmitButton processing={registerForm.processing}>
                                            Verify & Create
                                        </SubmitButton>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

function AuthPane({
    active,
    children,
}: {
    active: boolean;
    children: ReactNode;
}) {
    return (
        <div
            aria-hidden={!active}
            className={cx(
                'relative z-20 flex h-auto min-h-[43rem] items-center p-5 transition duration-300 sm:p-7 lg:h-[43rem] lg:p-10',
                active ? 'pointer-events-auto opacity-100' : 'pointer-events-none hidden opacity-0 lg:flex',
            )}
        >
            <div className="bccc-auth-pane-inner mx-auto max-h-none w-full max-w-[28rem] overflow-visible lg:max-h-[38rem] lg:overflow-y-auto lg:pr-1">
                {children}
            </div>
        </div>
    );
}

function RegisterFormPanel({
    registerNameRef,
    registerForm,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    checks,
    passwordStrength,
    onSubmit,
    transition,
    reducedMotion,
    isSendingCode,
}: {
    registerNameRef: React.RefObject<HTMLInputElement | null>;
    registerForm: ReturnType<typeof useForm<RegisterForm>>;
    showPassword: boolean;
    showConfirmPassword: boolean;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
    checks: PasswordCheck[];
    passwordStrength: number;
    onSubmit: (event: FormEvent) => void;
    transition: Transition;
    reducedMotion: boolean;
    isSendingCode: boolean;
}) {
    return (
        <motion.div
            key="register-form"
            initial={reducedMotion ? false : { opacity: 0, x: -42, scale: 0.98, filter: 'blur(12px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -28, scale: 0.98, filter: 'blur(10px)' }}
            transition={transition}
        >
            <FormHeader
                eyebrow="Account Setup"
                title="Create account"
                description="Register to request bookings and monitor reservations."
            />

            <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
                <Field
                    ref={registerNameRef}
                    icon={User}
                    label="Full name"
                    value={registerForm.data.name}
                    error={registerForm.errors.name}
                    autoComplete="name"
                    helper="Use the name that should appear on your booking records."
                    onChange={(value) => registerForm.setData('name', value)}
                    required
                />

                <Field
                    icon={Mail}
                    label="Email address"
                    type="email"
                    value={registerForm.data.email}
                    error={registerForm.errors.email}
                    autoComplete="username"
                    inputMode="email"
                    helper="This email will be used for access and booking updates."
                    onChange={(value) => registerForm.setData('email', value.toLowerCase())}
                    required
                />

                <PasswordField
                    label="Password"
                    value={registerForm.data.password}
                    error={registerForm.errors.password}
                    visible={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                    onChange={(value) => registerForm.setData('password', value)}
                    autoComplete="new-password"
                />

                <PasswordStrength checks={checks} strength={passwordStrength} />

                <PasswordField
                    label="Confirm password"
                    value={registerForm.data.password_confirmation}
                    error={registerForm.errors.password_confirmation}
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((value) => !value)}
                    onChange={(value) => registerForm.setData('password_confirmation', value)}
                    autoComplete="new-password"
                />

                <SubmitButton processing={registerForm.processing || isSendingCode}>
                    Create account
                </SubmitButton>
            </form>
        </motion.div>
    );
}

function LoginFormPanel({
    loginEmailRef,
    loginForm,
    showPassword,
    setShowPassword,
    status,
    canResetPassword,
    onSubmit,
    transition,
    reducedMotion,
}: {
    loginEmailRef: React.RefObject<HTMLInputElement | null>;
    loginForm: ReturnType<typeof useForm<LoginForm>>;
    showPassword: boolean;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    status?: string;
    canResetPassword: boolean;
    onSubmit: (event: FormEvent) => void;
    transition: Transition;
    reducedMotion: boolean;
}) {
    return (
        <motion.div
            key="login-form"
            initial={reducedMotion ? false : { opacity: 0, x: 42, scale: 0.98, filter: 'blur(12px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 28, scale: 0.98, filter: 'blur(10px)' }}
            transition={transition}
        >
            <FormHeader
                eyebrow="Secure Login"
                title="Welcome back"
                description="Sign in to continue to your BCCC EASE workspace."
            />

            {status ? <Notice type="success">{status}</Notice> : null}

            <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
                <Field
                    ref={loginEmailRef}
                    icon={Mail}
                    label="Email address"
                    type="email"
                    value={loginForm.data.email}
                    error={loginForm.errors.email}
                    autoComplete="username"
                    inputMode="email"
                    helper="Use the email connected to your account."
                    onChange={(value) => loginForm.setData('email', value.toLowerCase())}
                    required
                />

                <PasswordField
                    label="Password"
                    value={loginForm.data.password}
                    error={loginForm.errors.password}
                    visible={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                    onChange={(value) => loginForm.setData('password', value)}
                    autoComplete="current-password"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#6e604c] dark:text-white/60">
                        <input
                            type="checkbox"
                            checked={loginForm.data.remember}
                            onChange={(event) => loginForm.setData('remember', event.target.checked)}
                            className="h-4 w-4 rounded border-[#d9c7a6] text-[#8b672d] focus:ring-[#b08d48]"
                        />
                        Remember me
                    </label>

                    {canResetPassword ? (
                        <Link
                            href="/forgot-password"
                            className="text-sm font-bold text-[#8b672d] underline underline-offset-4 transition hover:text-[#2f2517] focus:outline-none focus:ring-4 focus:ring-[#b08d48]/20 dark:text-[#f1d89b] dark:hover:text-white"
                        >
                            Forgot password?
                        </Link>
                    ) : null}
                </div>

                <SubmitButton processing={loginForm.processing}>
                    Sign in
                </SubmitButton>
            </form>
        </motion.div>
    );
}

function SkipLink() {
    return (
        <a
            href="#auth-form"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100000] focus:rounded-full focus:bg-[#2f2517] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
            Skip to authentication form
        </a>
    );
}

function MobileBrand() {
    return (
        <div className="mb-5 text-center lg:hidden">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#d9c7a6]/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/8">
                <CalendarDays className="h-6 w-6 text-[#8b672d] dark:text-[#f1d89b]" />
            </div>

            <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#21180d] dark:text-white">
                BCCC EASE
            </p>
        </div>
    );
}

function ModeTab({
    active,
    disabled,
    children,
    onClick,
}: {
    active: boolean;
    disabled: boolean;
    children: ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={onClick}
            className={cx(
                'relative min-h-11 rounded-full px-5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#b08d48]/25 disabled:cursor-not-allowed disabled:opacity-60',
                active ? 'bg-white text-[#17120b] shadow-[0_12px_30px_rgba(0,0,0,0.18)]' : 'text-white/76 hover:bg-white/16',
            )}
        >
            {children}
        </button>
    );
}

function FeaturePill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
    return (
        <div className="rounded-[1rem] border border-white/12 bg-white/10 p-4 backdrop-blur-xl">
            <Icon className="h-5 w-5 text-[#f1d89b]" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-white">{label}</p>
        </div>
    );
}

function FormHeader({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {eyebrow}
            </p>

            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#21180d] dark:text-white">
                {title}
            </h2>

            <p className="mt-3 max-w-[64ch] text-[15px] leading-7 text-[#6e604c] dark:text-white/60">
                {description}
            </p>
        </div>
    );
}

const Field = forwardRef<HTMLInputElement, {
    icon: LucideIcon;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    autoComplete?: string;
    inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
    placeholder?: string;
    maxLength?: number;
    helper?: string;
    required?: boolean;
    className?: string;
}>(
    (
        {
            icon: Icon,
            label,
            value,
            onChange,
            error,
            type = 'text',
            autoComplete,
            inputMode,
            placeholder,
            maxLength,
            helper,
            required = false,
            className,
        },
        ref,
    ) => {
        const inputId = `${label.toLowerCase().replace(/\s+/g, '-')}-field`;
        const errorId = `${inputId}-error`;
        const helperId = `${inputId}-helper`;

        return (
            <label className="grid gap-2 text-left" htmlFor={inputId}>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                    {label}
                    {required ? <span aria-hidden="true"> *</span> : null}
                </span>

                <span
                    className={cx(
                        'flex min-h-12 items-center gap-3 rounded-full border bg-white px-4 transition focus-within:border-[#b08d48] focus-within:ring-4 focus-within:ring-[#b08d48]/15 dark:bg-white/7',
                        error ? 'border-rose-300 dark:border-rose-400/40' : 'border-[#d9c7a6]/70 dark:border-white/10',
                    )}
                >
                    <Icon className="h-4.5 w-4.5 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" aria-hidden="true" />

                    <input
                        ref={ref}
                        id={inputId}
                        type={type}
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        required={required}
                        autoComplete={autoComplete}
                        inputMode={inputMode}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        aria-invalid={Boolean(error)}
                        aria-describedby={cx(helper ? helperId : false, error ? errorId : false) || undefined}
                        className={cx(
                            'min-h-11 w-full bg-transparent text-sm font-semibold text-[#21180d] outline-none placeholder:text-[#8a7a63] dark:text-white dark:placeholder:text-white/42',
                            className,
                        )}
                    />
                </span>

                {helper ? (
                    <p id={helperId} className="text-xs leading-5 text-[#6e604c] dark:text-white/42">
                        {helper}
                    </p>
                ) : null}

                {error ? (
                    <p id={errorId} className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                        {error}
                    </p>
                ) : null}
            </label>
        );
    },
);

Field.displayName = 'Field';

function PasswordField({
    label,
    value,
    onChange,
    error,
    visible,
    onToggle,
    autoComplete,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    visible: boolean;
    onToggle: () => void;
    autoComplete?: string;
}) {
    const inputId = `${label.toLowerCase().replace(/\s+/g, '-')}-password`;
    const errorId = `${inputId}-error`;

    return (
        <label className="grid gap-2 text-left" htmlFor={inputId}>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label} <span aria-hidden="true">*</span>
            </span>

            <span
                className={cx(
                    'flex min-h-12 items-center gap-3 rounded-full border bg-white px-4 transition focus-within:border-[#b08d48] focus-within:ring-4 focus-within:ring-[#b08d48]/15 dark:bg-white/7',
                    error ? 'border-rose-300 dark:border-rose-400/40' : 'border-[#d9c7a6]/70 dark:border-white/10',
                )}
            >
                <LockKeyhole className="h-4.5 w-4.5 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" aria-hidden="true" />

                <input
                    id={inputId}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    required
                    autoComplete={autoComplete}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    className="min-h-11 w-full bg-transparent text-sm font-semibold text-[#21180d] outline-none placeholder:text-[#8a7a63] dark:text-white dark:placeholder:text-white/42"
                />

                <button
                    type="button"
                    onClick={onToggle}
                    tabIndex={-1}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#6e604c] transition hover:bg-[#f7f0e3] focus:outline-none focus:ring-4 focus:ring-[#b08d48]/20 dark:text-white/58 dark:hover:bg-white/10"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </span>

            {error ? (
                <p id={errorId} className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                    {error}
                </p>
            ) : null}
        </label>
    );
}

function PasswordStrength({ checks, strength }: { checks: PasswordCheck[]; strength: number }) {
    const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const percent = Math.min(100, (strength / checks.length) * 100);

    return (
        <div className="rounded-[1.1rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9d7b3d] dark:text-[#f1d89b]">
                    Password strength
                </p>

                <p className="text-xs font-bold text-[#6e604c] dark:text-white/54">
                    {labels[strength] ?? 'Strong'}
                </p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eadcc2] dark:bg-white/10">
                <div
                    className="h-full rounded-full bg-[#8b672d] transition-all duration-300 dark:bg-[#f1d89b]"
                    style={{ width: `${percent}%` }}
                />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {checks.map((check) => (
                    <div
                        key={check.label}
                        className={cx(
                            'flex items-center gap-2 text-xs font-semibold',
                            check.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-[#6e604c] dark:text-white/42',
                        )}
                    >
                        {check.passed ? <Check className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {check.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

function SubmitButton({ children, processing }: { children: string; processing: boolean }) {
    return (
        <button
            type="submit"
            disabled={processing}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2f2517] px-6 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] focus:outline-none focus:ring-4 focus:ring-[#b08d48]/25 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#f1d89b] dark:text-[#17120b] dark:hover:bg-white"
        >
            {processing ? (
                <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white dark:border-[#17120b]/30 dark:border-t-[#17120b]" />
                    Processing...
                </>
            ) : (
                children
            )}
        </button>
    );
}

function Notice({ type, children }: { type: 'success' | 'error'; children: ReactNode }) {
    return (
        <div
            role={type === 'error' ? 'alert' : 'status'}
            className={cx(
                'mt-5 rounded-[1rem] border p-4 text-sm font-semibold leading-6',
                type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100'
                    : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100',
            )}
        >
            {children}
        </div>
    );
}
