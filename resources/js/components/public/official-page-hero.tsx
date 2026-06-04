import SafeImage from '@/components/system/safe-image';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

type HeroAction = {
    label: string;
    href: string;
    external?: boolean;
};

type Props = {
    eyebrow: string;
    title: string;
    description?: string;
    children?: ReactNode;
    actions?: HeroAction[];
    compact?: boolean;
};

const PINECONES_SVG = 'https://main.baguio.gov.ph/assets/svg/pinecones-C-XuiVQ0.svg';

export default function OfficialPageHero({
    eyebrow,
    title,
    description,
    children,
    actions = [],
    compact = false,
}: Props) {
    return (
        <section className="bccc-official-page-hero relative isolate overflow-hidden bg-[#145f52] text-white">
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(105deg,rgba(8,52,45,0.98),rgba(23,100,86,0.88)_52%,rgba(9,49,54,0.84))]" />
            <SafeImage
                src="/marketing/images/hero/noon2.jpg"
                fallbackSrc="/marketing/images/hero/noon.jpg"
                alt="Baguio mountain skyline"
                className="absolute inset-0 -z-10 h-full w-full object-cover opacity-28 mix-blend-luminosity"
                wrapperClassName="absolute inset-0 -z-10 h-full w-full"
                draggable={false}
            />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_42%_16%,rgba(255,255,255,0.13),transparent_31%),linear-gradient(180deg,rgba(0,0,0,0.03),rgba(0,0,0,0.28))]" />

            <div className="public-container relative grid min-h-[19rem] gap-8 pt-16 pb-9 sm:min-h-[21rem] sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,34rem)] lg:items-center lg:pt-24">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/76 sm:tracking-[0.28em]">
                        {eyebrow}
                    </p>
                    <h1 className="mt-5 max-w-5xl text-balance text-[clamp(2.9rem,6.5vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.045em] text-white sm:tracking-[-0.055em]">
                        {title}
                    </h1>
                    {description ? (
                        <p className="mt-5 max-w-3xl text-sm leading-7 text-white/76 sm:text-base sm:leading-8">
                            {description}
                        </p>
                    ) : null}

                    {actions.length > 0 ? (
                        <div className="mt-7 flex flex-wrap gap-3">
                            {actions.map((action) => {
                                const className = "inline-flex min-h-11 items-center gap-2 rounded-full border border-white/24 bg-white/10 px-5 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_16px_42px_rgba(0,0,0,0.14)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#145f52]";

                                return action.external ? (
                                    <a key={action.href} href={action.href} target="_blank" rel="noreferrer" className={className}>
                                        {action.label}
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                ) : (
                                    <Link key={action.href} href={action.href} className={className}>
                                        {action.label}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                );
                            })}
                        </div>
                    ) : null}
                </div>

                <div className="pointer-events-none relative hidden min-h-[13rem] place-items-center lg:grid">
                    <SafeImage
                        src={PINECONES_SVG}
                        fallbackSrc="/marketing/images/logo/baguioseal.png"
                        alt="Baguio pinecone line art"
                        className="h-[min(17rem,30vw)] w-full object-contain opacity-88 drop-shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
                        wrapperClassName="h-full w-full"
                        draggable={false}
                    />
                </div>

                {children ? (
                    <div className={compact ? 'lg:col-span-2' : 'lg:col-span-2'}>
                        {children}
                    </div>
                ) : null}
            </div>
        </section>
    );
}

export { PINECONES_SVG };
