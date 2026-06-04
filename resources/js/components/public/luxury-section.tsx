import type { ReactNode } from 'react';

type LuxurySectionProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    children?: ReactNode;
    actions?: ReactNode;
    align?: 'left' | 'center';
    className?: string;
};

export function LuxurySection({
    eyebrow,
    title,
    description,
    children,
    actions,
    align = 'left',
    className = '',
}: LuxurySectionProps) {
    const centered = align === 'center';

    return (
        <section className={`public-container public-section ${className}`}>
            <div
                className={`mb-8 flex flex-col gap-4 ${
                    centered
                        ? 'items-center text-center'
                        : 'items-start text-left'
                } lg:flex-row lg:justify-between ${centered ? 'lg:items-center lg:text-center' : 'lg:items-end'}`}
            >
                <div className={centered ? 'mx-auto max-w-3xl' : 'max-w-3xl'}>
                    {eyebrow ? (
                        <p className="bccc-public-eyebrow">{eyebrow}</p>
                    ) : null}

                    <h2 className="bccc-public-heading">{title}</h2>

                    {description ? (
                        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300">
                            {description}
                        </p>
                    ) : null}
                </div>

                {actions ? (
                    <div className="flex flex-wrap gap-3">{actions}</div>
                ) : null}
            </div>

            {children}
        </section>
    );
}

export function LuxuryPanel({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={`bccc-public-panel ${className}`}>{children}</div>;
}

export function LuxuryScroller({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`bccc-hidden-scrollbar flex snap-x gap-4 overflow-x-auto pb-3 ${className}`}
        >
            {children}
        </div>
    );
}
