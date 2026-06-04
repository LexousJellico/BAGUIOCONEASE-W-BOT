import type { ReactNode } from 'react';

type BackendPageShellProps = {
    children: ReactNode;
    title?: string;
    eyebrow?: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
    compact?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export default function BackendPageShell({
    children,
    title,
    eyebrow = 'Workspace',
    description,
    actions,
    className,
    compact = false,
}: BackendPageShellProps) {
    return (
        <section
            className={cx(
                'backend-boneyard-card relative overflow-hidden rounded-[1.15rem] border border-slate-200/80 bg-white/82 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_24px_80px_rgba(0,0,0,0.24)]',
                compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5',
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d6b05c]/60 to-transparent dark:via-[#f4d894]/28" />

            {title || description || actions ? (
                <div className="mb-4 grid gap-4 border-b border-slate-200/80 pb-4 dark:border-white/10 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="min-w-0">
                        <p className="inline-flex rounded-full border border-[#d6b05c]/30 bg-[#d6b05c]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a6320] dark:border-[#f4d894]/18 dark:bg-[#f4d894]/8 dark:text-[#f4d894]">
                            {eyebrow}
                        </p>

                        {title ? (
                            <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-2xl">
                                {title}
                            </h2>
                        ) : null}

                        {description ? (
                            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-white/56">
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
