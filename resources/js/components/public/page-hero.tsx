import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

type Action = {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary';
};

type Props = {
    eyebrow: string;
    title: string;
    description: string;
    backgroundImages?: string[];
    actions?: Action[];
};

export default function PageHero({
    eyebrow,
    title,
    description,
    backgroundImages = ['/marketing/images/branding/noon.jpg', '/marketing/images/hero/night.png'],
    actions = [],
}: Props) {
    const light = backgroundImages[0] || '/marketing/images/branding/noon.jpg';
    const dark = backgroundImages[1] || backgroundImages[0] || '/marketing/images/hero/night.png';

    return (
        <section className="public-page-hero public-container">
            <div className="public-page-hero-frame relative rounded-[28px] shadow-[var(--public-shadow)]">
                <picture>
                    <source media="(prefers-color-scheme: dark)" srcSet={dark} />
                    <img src={light} alt={title} />
                </picture>

                <div className="absolute inset-x-0 bottom-0 z-[1] p-6 sm:p-8 lg:p-12">
                    <div className="max-w-5xl">
                        <div className="public-kicker text-white/78">{eyebrow}</div>

                        <h1 className="mt-6 max-w-5xl text-balance text-[clamp(3rem,8vw,7rem)] font-medium leading-[0.88] tracking-[-0.075em] text-white">
                            {title}
                        </h1>

                        <p className="mt-6 max-w-2xl text-base leading-8 text-white/78">
                            {description}
                        </p>

                        {actions.length > 0 ? (
                            <div className="mt-8 flex flex-wrap gap-3">
                                {actions.map((action) => (
                                    <Link
                                        key={`${action.href}-${action.label}`}
                                        href={action.href}
                                        className={
                                            action.variant === 'secondary'
                                                ? 'border-white/22 bg-white/10 text-white public-pill-secondary'
                                                : 'public-pill-primary bg-white text-[#101414] dark:text-[#101414]'
                                        }
                                    >
                                        {action.label}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
}
