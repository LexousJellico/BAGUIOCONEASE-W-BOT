import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Building2, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

type AdminLayoutProps = {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    description?: string;
    eyebrow?: string;
    actions?: ReactNode;
    activeTab?: string;
    activeSection?: string;
    breadcrumbs?: BreadcrumbItem[];
};

export default function AdminLayout({
    children,
    title = 'Admin Workspace',
    subtitle,
    description,
    eyebrow = 'Backend Operations',
    actions,
    breadcrumbs = [{ title: 'Admin', href: '/admin/dashboard' }],
}: AdminLayoutProps) {
    const resolvedBreadcrumbs =
        breadcrumbs.length > 0
            ? breadcrumbs
            : [
                  { title: 'Admin', href: '/admin/dashboard' },
                  { title, href: '#' },
              ];

    return (
        <AppLayout breadcrumbs={resolvedBreadcrumbs}>
            <section className="relative mb-5 overflow-hidden rounded-[1.75rem] border border-[#d9c7a6]/70 bg-white/84 p-4 shadow-[0_22px_70px_rgba(47,37,23,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] sm:p-5 lg:p-6">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute right-[-6rem] top-[-8rem] h-72 w-72 rounded-full bg-[#d8b56d]/18 blur-3xl dark:bg-[#d8b56d]/8" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8b56d]/80 to-transparent dark:via-white/20" />
                </div>

                <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-[#f7f0e3] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {eyebrow}
                            </span>

                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#d9c7a6]/70 bg-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a3b27] transition hover:border-[#b08d48]/70 hover:bg-white dark:border-white/10 dark:bg-white/7 dark:text-white/70 dark:hover:bg-white/12"
                            >
                                Public Site
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.055em] text-[#21180d] dark:text-white sm:text-4xl lg:text-5xl">
                            {title}
                        </h1>

                        {subtitle ? (
                            <p className="mt-2 text-sm font-semibold text-[#4a3b27] dark:text-white/82">
                                {subtitle}
                            </p>
                        ) : null}

                        {description ? (
                            <p className="mt-3 max-w-4xl text-sm leading-7 text-[#6e604c] dark:text-white/58">
                                {description}
                            </p>
                        ) : null}
                    </div>

                    {actions ? (
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                            {actions}
                        </div>
                    ) : (
                        <div className="hidden rounded-[1.25rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/78 p-4 text-[#4a3b27] dark:border-white/10 dark:bg-white/7 dark:text-white/70 xl:block">
                            <div className="flex items-center gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#2f2517] text-white dark:bg-white dark:text-[#17120b]">
                                    <Building2 className="h-5 w-5" />
                                </span>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                        BCCC EASE
                                    </p>
                                    <p className="mt-1 text-sm font-semibold">
                                        Operational Control
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {children}
        </AppLayout>
    );
}
