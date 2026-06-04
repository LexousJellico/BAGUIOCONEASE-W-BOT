import { ArrowRight, Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type BcccEmptyStateProps = {
    title?: string;
    description?: string;
    eyebrow?: string;
    icon?: LucideIcon;
    action?: ReactNode;
    secondaryAction?: ReactNode;
    className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export default function BcccEmptyState({
    title = 'No records found',
    description = 'There is no available data to display yet.',
    eyebrow = 'Empty State',
    icon: Icon = Inbox,
    action,
    secondaryAction,
    className,
}: BcccEmptyStateProps) {
    return (
        <section
            className={cx(
                'relative overflow-hidden rounded-[1.65rem] border border-[#d9c7a6]/70 bg-white/82 p-6 text-center shadow-[0_20px_64px_rgba(47,37,23,0.09)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]',
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(216,181,109,0.16),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.055),transparent_45%)]" />

            <div className="relative mx-auto max-w-xl">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] ring-1 ring-[#d9c7a6]/70 dark:bg-white/10 dark:text-[#f1d89b] dark:ring-white/10">
                    <Icon className="h-7 w-7" />
                </div>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                    {eyebrow}
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                    {title}
                </h2>

                <p className="mt-3 text-sm leading-7 text-[#6e604c] dark:text-white/58">
                    {description}
                </p>

                {action || secondaryAction ? (
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        {action}

                        {secondaryAction}
                    </div>
                ) : null}
            </div>
        </section>
    );
}

export function BcccEmptyStateLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <a
            href={href}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
        >
            {children}
            <ArrowRight className="h-4 w-4" />
        </a>
    );
}
