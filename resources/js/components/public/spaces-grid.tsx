import LuxuryHorizontalRail from '@/components/public/luxury-horizontal-rail';
import SafeImage from '@/components/system/safe-image';
import BcccEmptyState, { BcccEmptyStateLink } from '@/components/ui/bccc-empty-state';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Building2, Map, Users } from 'lucide-react';
import { useMemo } from 'react';
import type { PublicSpaceItem } from '@/types/public-content';

type Props = {
    items?: PublicSpaceItem[];
};

const ease = [0.22, 1, 0.36, 1] as const;

function SpaceCard({ item, index }: { item: PublicSpaceItem; index: number }) {
    const reduceMotion = useReducedMotion();
    const lightImage = item.lightImage || item.light_image || item.image || item.image_url || item.imageUrl || '/marketing/images/hero/noon2.jpg';
    const darkImage = item.darkImage || item.dark_image || item.image || item.image_url || item.imageUrl || lightImage;

    return (
        <motion.article
            className="group relative min-h-[29rem] overflow-hidden rounded-[1.6rem] border border-black/10 bg-white shadow-[0_24px_70px_rgba(40,29,13,0.12)] [flex:0_0_82vw] dark:border-white/10 dark:bg-[#111418] sm:[flex:0_0_22rem] lg:[flex:0_0_calc((100%_-_3rem)_/_4)]"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.22 }}
            transition={{ duration: 0.48, delay: Math.min(index * 0.045, 0.18), ease }}
        >
            <Link href={`/facilities/${item.slug}`} className="absolute inset-0 z-20" aria-label={`View ${item.title}`} />

            <div className="absolute inset-0">
                <SafeImage
                    src={lightImage}
                    fallbackSrc="/marketing/images/facilities/darkvip.JPG"
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105 dark:hidden"
                    wrapperClassName="h-full w-full rounded-none border-0"
                />

                <SafeImage
                    src={darkImage}
                    fallbackSrc="/marketing/images/facilities/darkvip.JPG"
                    alt={item.title}
                    className="hidden h-full w-full object-cover transition duration-700 group-hover:scale-105 dark:block"
                    wrapperClassName="hidden h-full w-full rounded-none border-0 dark:grid"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#100b05]/92 via-[#100b05]/28 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/32 to-transparent" />
            </div>

            <div className="relative z-10 flex h-full min-h-[29rem] flex-col justify-between p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-xl">
                        <Building2 className="h-3.5 w-3.5" />
                        {item.category || 'Venue'}
                    </span>

                    {item.featured || item.is_featured ? (
                        <span className="rounded-full bg-[#f4dfad] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#17120b]">
                            Featured
                        </span>
                    ) : null}
                </div>

                <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/18 px-3 py-2 text-xs text-white/80 backdrop-blur-xl">
                        <Users className="h-3.5 w-3.5" />
                        {item.capacity || 'Capacity upon request'}
                    </div>

                    <h3 className="font-serif text-3xl font-light leading-tight tracking-[-0.04em]">
                        {item.title || item.name || 'BCCC Venue Space'}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/72">
                        {item.summary || item.shortDescription || item.short_description || item.description || 'Explore this BCCC venue space for your event.'}
                    </p>

                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#f4dfad]">
                        {item.ctaLabel || item.cta_label || item.buttonLabel || item.button_label || 'View Space'}
                        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                </div>
            </div>
        </motion.article>
    );
}

export default function SpacesGrid({ items = [] }: Props) {
    const visible = useMemo(
        () =>
            items
                .filter((item) => item.homepageVisible !== false && item.homepage_visible !== 0 && item.homepage_visible !== '0')
                .slice(0, 12),
        [items],
    );

    return (
        <section id="spaces" className="relative bg-[#f8f5ef] px-4 py-14 dark:bg-[#0d0f12] sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1920px]">
                <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#9b7739]">
                            Our Spaces
                        </p>

                        <h2 className="mt-3 font-serif text-[clamp(2.3rem,4vw,5rem)] font-light leading-[0.94] tracking-[-0.055em] text-[#21180d] dark:text-white">
                            Venue spaces shaped for civic, cultural, and corporate gatherings.
                        </h2>
                    </div>

                    <p className="max-w-md text-sm leading-7 text-[#6d604d] dark:text-white/62">
                        Drag sideways or use the controls to browse. The layout keeps four cards visible on wide screens while staying smooth on tablet and mobile.
                    </p>
                </div>

                {visible.length === 0 ? (
                    <BcccEmptyState
                        icon={Map}
                        eyebrow="Venue Spaces"
                        title="No public spaces are visible yet"
                        description="Add venue spaces in the admin content or venue configuration area, then mark them visible on the public homepage."
                        action={
                            <BcccEmptyStateLink href="/facilities">
                                View Facilities Page
                            </BcccEmptyStateLink>
                        }
                    />
                ) : (
                    <LuxuryHorizontalRail label="BCCC venue spaces">
                        {visible.map((item, index) => (
                            <SpaceCard key={item.id} item={item} index={index} />
                        ))}
                    </LuxuryHorizontalRail>
                )}
            </div>
        </section>
    );
}
