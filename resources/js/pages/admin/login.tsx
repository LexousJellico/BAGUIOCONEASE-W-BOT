import { Head, Link, useForm } from '@inertiajs/react';
import {
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    PanelsTopLeft,
    ShieldCheck,
    TableProperties,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function AdminLoginPage() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
        redirect_to: '/admin/home',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        post('/login', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Admin Login" />

            <div className="min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#22221f] dark:bg-[#0f1014] dark:text-white">
                <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                    <section className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                        <div className="text-xs font-semibold tracking-[0.34em] text-[#174f40] uppercase dark:text-[#8ea3ff]">
                            BCCC EASE
                        </div>

                        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
                            One admin login for frontend content, backend
                            booking tools, MICE registry, and inquiries.
                        </h1>

                        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            This admin entry now acts as the shared session gate
                            for both workspace sides. After sign-in, the same
                            authenticated session can move between public-page
                            configuration and backend booking operations without
                            requiring a second login.
                        </p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-3xl border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#8ea3ff]">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div className="mt-4 text-sm font-semibold">
                                    Single Session
                                </div>
                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                                    No separate login for frontend and backend
                                    admin tools
                                </div>
                            </div>

                            <div className="rounded-3xl border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#8ea3ff]">
                                    <PanelsTopLeft className="h-4 w-4" />
                                </div>
                                <div className="mt-4 text-sm font-semibold">
                                    Frontend Admin
                                </div>
                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                                    Public-page configuration opens at
                                    /admin/home
                                </div>
                            </div>

                            <div className="rounded-3xl border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#8ea3ff]">
                                    <TableProperties className="h-4 w-4" />
                                </div>
                                <div className="mt-4 text-sm font-semibold">
                                    Backend Tools
                                </div>
                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                                    Booking calendar, MICE registry, and
                                    inquiries use the same login
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                        <div className="text-xs font-semibold tracking-[0.34em] text-[#174f40] uppercase dark:text-[#8ea3ff]">
                            Admin Login
                        </div>

                        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                            Sign in to open the unified admin workspace
                        </h2>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-8 space-y-5"
                        >
                            <input
                                type="hidden"
                                value={data.redirect_to}
                                onChange={() => {}}
                            />

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Email
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#17181c]">
                                    <Mail className="h-4 w-4 text-[#6a665f] dark:text-[#a8a8b0]" />
                                    <input
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        placeholder="admin@email.com"
                                        className="w-full bg-transparent text-sm outline-none"
                                    />
                                </div>
                                {errors.email && (
                                    <div className="mt-2 text-sm text-red-600">
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Password
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#17181c]">
                                    <LockKeyhole className="h-4 w-4 text-[#6a665f] dark:text-[#a8a8b0]" />
                                    <input
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        required
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        placeholder="Enter password"
                                        className="w-full bg-transparent text-sm outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((prev) => !prev)
                                        }
                                        className="text-[#6a665f] dark:text-[#a8a8b0]"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="mt-2 text-sm text-red-600">
                                        {errors.password}
                                    </div>
                                )}
                            </div>

                            <label className="flex items-center gap-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-black/20"
                                />
                                Keep this admin session signed in across
                                frontend and backend tools
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex w-full items-center justify-center rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-[#2d47ff]"
                            >
                                {processing
                                    ? 'Signing in...'
                                    : 'Login to Admin'}
                            </button>
                        </form>

                        <div className="mt-6 text-sm text-slate-500 dark:text-slate-300">
                            Successful authentication redirects to{' '}
                            <code>/admin/home</code>, and the same session can
                            immediately open the backend booking calendar, MICE
                            survey & registry, inquiries, and backend guidelines
                            tools.
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/"
                                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
                            >
                                Back to Website
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
                            >
                                Open Default Login
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
