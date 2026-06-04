import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Plus, Search } from 'lucide-react';
import type { ReactNode } from 'react';

type AdminPolishedPageProps = {
    title: string;
    subtitle?: string;
    eyebrow?: string;
    icon?: LucideIcon;
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
    actions?: ReactNode;
    headTitle?: string;
};

type AdminStatCardProps = {
    label: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
};

type AdminSectionCardProps = {
    title?: string;
    eyebrow?: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
};

type AdminEmptyStateProps = {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actionHref?: string;
    actionLabel?: string;
};

type AdminToolbarProps = {
    searchPlaceholder?: string;
    right?: ReactNode;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export function AdminPolishedPage({
    title,
    subtitle,
    eyebrow = 'Admin Workspace',
    icon: Icon,
    breadcrumbs = [],
    children,
    actions,
    headTitle,
}: AdminPolishedPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={headTitle || title} />

            <div className="bccc-admin-polished-page space-y-5">
                <section className="bccc-resource-hero relative overflow-hidden border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(216,181,109,0.18),transparent_46%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_46%)]" />

                    <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <div className="inline-flex items-center gap-2 border border-[#d6b56d]/70 bg-[#fff8e6] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                                {eyebrow}
                            </div>

                            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.065em] text-[#21180d] dark:text-white lg:text-5xl">
                                {title}
                            </h1>

                            {subtitle ? (
                                <p className="mt-3 max-w-4xl text-sm leading-7 text-[#6e604c] dark:text-white/58">
                                    {subtitle}
                                </p>
                            ) : null}
                        </div>

                        {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
                    </div>
                </section>

                {children}
            </div>
        </AppLayout>
    );
}

export function AdminStatCard({
    label,
    value,
    description,
    icon: Icon,
}: AdminStatCardProps) {
    return (
        <article className="border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[#21180d] dark:text-white">
                        {value}
                    </p>
                </div>

                {Icon ? (
                    <span className="grid h-11 w-11 shrink-0 place-items-center border border-[#d6b56d]/60 bg-[#fff8e6] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                        <Icon className="h-5 w-5" />
                    </span>
                ) : null}
            </div>

            {description ? (
                <p className="mt-3 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                    {description}
                </p>
            ) : null}
        </article>
    );
}

export function AdminSectionCard({
    title,
    eyebrow,
    description,
    actions,
    children,
    className,
}: AdminSectionCardProps) {
    return (
        <section
            className={cx(
                'bccc-resource-section border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]',
                className,
            )}
        >
            {title || description || actions ? (
                <div className="mb-5 flex flex-col gap-4 border-b border-[#d9c7a6]/60 pb-4 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        {eyebrow ? (
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                {eyebrow}
                            </p>
                        ) : null}

                        {title ? (
                            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-[#21180d] dark:text-white">
                                {title}
                            </h2>
                        ) : null}

                        {description ? (
                            <p className="mt-2 max-w-4xl text-sm leading-7 text-[#6e604c] dark:text-white/58">
                                {description}
                            </p>
                        ) : null}
                    </div>

                    {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
                </div>
            ) : null}

            {children}
        </section>
    );
}

export function AdminEmptyState({
    title,
    description,
    icon: Icon,
    actionHref,
    actionLabel = 'Create Record',
}: AdminEmptyStateProps) {
    return (
        <div className="border border-dashed border-[#d6b56d]/80 bg-[#fff8e6]/58 p-8 text-center dark:border-white/10 dark:bg-white/[0.035]">
            {Icon ? (
                <span className="mx-auto grid h-14 w-14 place-items-center border border-[#d6b56d]/60 bg-[#fff8e6] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                    <Icon className="h-6 w-6" />
                </span>
            ) : null}

            <p className="mt-4 text-lg font-semibold tracking-[-0.035em] text-[#21180d] dark:text-white">
                {title}
            </p>

            {description ? (
                <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[#6e604c] dark:text-white/56">
                    {description}
                </p>
            ) : null}

            {actionHref ? (
                <Link
                    href={actionHref}
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2  bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                >
                    <Plus className="h-4 w-4" />
                    {actionLabel}
                </Link>
            ) : null}
        </div>
    );
}

export function AdminToolbar({
    searchPlaceholder = 'Search records...',
    right,
}: AdminToolbarProps) {
    return (
        <div className="bccc-resource-toolbar mb-4 flex flex-col gap-3 border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.035] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/7">
                <Search className="h-4 w-4 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />
                <input
                    type="search"
                    placeholder={searchPlaceholder}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#21180d] outline-none placeholder:text-[#8a7a63] dark:text-white dark:placeholder:text-white/42"
                />
            </div>

            {right ? <div className="flex flex-wrap gap-2 lg:justify-end">{right}</div> : null}
        </div>
    );
}

export function AdminActionLink({
    href,
    children,
    variant = 'primary',
}: {
    href: string;
    children: ReactNode;
    variant?: 'primary' | 'secondary';
}) {
    return (
        <Link
            href={href}
            className={
                variant === 'primary'
                    ? 'inline-flex min-h-11 items-center justify-center gap-2  bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]'
                    : 'inline-flex min-h-11 items-center justify-center gap-2  border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12'
            }
        >
            {children}
            <ArrowRight className="h-4 w-4" />
        </Link>
    );
}
