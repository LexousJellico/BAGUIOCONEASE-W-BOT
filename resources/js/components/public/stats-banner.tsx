import SiteVisitStat, { type SiteMetricPayload } from '@/components/public/site-visit-stat';
import type { HomepageStatItem } from '@/types/public-content';
import { motion, useReducedMotion } from 'framer-motion';
import { Building2, CalendarDays, Landmark, Users } from 'lucide-react';

type StatsBannerProps = {
    items?: HomepageStatItem[];
    siteMetric?: SiteMetricPayload | null;
};

const fallbackStats: HomepageStatItem[] = [
    {
        id: 'years',
        label: 'City Landmark',
        value: '1909',
        description: 'Baguio heritage and civic identity',
    },
    {
        id: 'events',
        label: 'Event-ready Areas',
        value: '7+',
        description: 'Venue spaces for public and private use',
    },
    {
        id: 'blocks',
        label: 'Booking Blocks',
        value: 'AM · PM',
        description: 'Evening is now additional hourly use',
    },
    {
        id: 'office',
        label: 'Managed Portal',
        value: 'BCCC EASE',
        description: 'Official booking and scheduling engine',
    },
];

const icons = [Landmark, Building2, CalendarDays, Users];

function statValue(item: HomepageStatItem) {
    return `${item.prefix || ''}${item.value}${item.suffix || ''}`;
}

export default function StatsBanner({ items = [], siteMetric }: StatsBannerProps) {
    const reduceMotion = useReducedMotion();
    const visible = items.length > 0 ? items : fallbackStats;
    const loopItems = [...visible, ...visible];

    return (
        <section className="bccc-stats-stage relative overflow-hidden bg-[#f8f5ef] py-0 dark:bg-[#0d0f12]">
            <div className="border-y border-[#d9c7a6]/70 bg-[#fffaf0]/80 shadow-[0_14px_55px_rgba(47,37,23,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
                <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
                    <div className="grid min-h-[8.6rem] gap-5 py-4 lg:grid-cols-[17rem_1fr] lg:items-center">
                        <div className="flex items-center justify-between gap-4 lg:block">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                    Venue at a Glance
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#21180d] dark:text-white">
                                    BCCC by numbers
                                </h2>
                            </div>
                        </div>

                        <div className="relative min-w-0 overflow-hidden">
                            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#fffaf0] to-transparent dark:from-[#15181d]" />
                            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#fffaf0] to-transparent dark:from-[#15181d]" />

                            <motion.div
                                className="flex w-max gap-4 py-1"
                                animate={
                                    reduceMotion
                                        ? undefined
                                        : {
                                              x: ['0%', '-50%'],
                                          }
                                }
                                transition={
                                    reduceMotion
                                        ? undefined
                                        : {
                                              duration: 36,
                                              repeat: Infinity,
                                              ease: 'linear',
                                          }
                                }
                            >
                                <SiteVisitStat metric={siteMetric} />

                                {loopItems.map((item, index) => {
                                    const Icon = icons[index % icons.length];

                                    return (
                                        <article
                                            key={`${item.id || item.label}-${index}`}
                                            className="flex min-w-[18rem] items-center gap-4 rounded-[1.35rem] border border-[#d9c7a6]/70 bg-white/78 p-4 shadow-[0_16px_40px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.055]"
                                        >
                                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                                <Icon className="h-5 w-5" />
                                            </span>

                                            <span className="min-w-0">
                                                <span className="block text-2xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                                                    {statValue(item)}
                                                </span>
                                                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                                    {item.label}
                                                </span>
                                                {item.description ? (
                                                    <span className="mt-1 block truncate text-xs text-[#6e604c] dark:text-white/48">
                                                        {item.description}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </article>
                                    );
                                })}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
