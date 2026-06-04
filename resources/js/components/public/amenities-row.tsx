import type { SiteMetricPayload } from '@/types/public-content';
import type { LucideIcon } from 'lucide-react';
import {
    BriefcaseBusiness,
    Camera,
    CircleParking,
    Eye,
    Mic2,
    ShieldCheck,
    Wifi,
} from 'lucide-react';

type Props = {
    siteMetric?: SiteMetricPayload | null;
};

type AmenityItem = {
    label: string;
    value?: string;
    icon: LucideIcon;
};

const baseAmenities: AmenityItem[] = [
    { label: 'Parking Access', icon: CircleParking },
    { label: 'Wi-Fi Ready', icon: Wifi },
    { label: 'Audio Support', icon: Mic2 },
    { label: 'Event Coverage', icon: Camera },
    { label: 'Security Support', icon: ShieldCheck },
    { label: 'Business Ready', icon: BriefcaseBusiness },
];

function metricValue(siteMetric?: SiteMetricPayload | null) {
    const metric = (siteMetric || {}) as Record<string, unknown>;

    const direct =
        metric.formattedVisits ||
        metric.formatted_visits ||
        metric.formattedViews ||
        metric.formatted_views ||
        metric.totalFormatted ||
        metric.total_formatted;

    if (typeof direct === 'string' && direct.trim()) {
        return direct.trim();
    }

    const numeric =
        metric.visits ||
        metric.views ||
        metric.totalVisits ||
        metric.total_visits ||
        metric.totalViews ||
        metric.total_views ||
        metric.count;

    if (typeof numeric === 'number' && Number.isFinite(numeric)) {
        return numeric.toLocaleString();
    }

    if (typeof numeric === 'string' && numeric.trim()) {
        return numeric.trim();
    }

    return 'Live';
}

export default function AmenitiesRow({ siteMetric = null }: Props) {
    const items: AmenityItem[] = [
        {
            label: 'Site Visits',
            value: metricValue(siteMetric),
            icon: Eye,
        },
        ...baseAmenities,
    ];

    return (
        <section className="bccc-public-amenities relative z-20 -mt-px w-full bg-[#edf2f1] text-[#153f37] dark:bg-[#081311] dark:text-white">
            <div className="w-full">
                <div className="bccc-public-amenities-grid flex w-full overflow-x-auto border-y border-[#176456]/14 bg-white/62 shadow-[0_12px_42px_rgba(14,60,52,0.045)] backdrop-blur [scrollbar-width:none] dark:border-white/10 dark:bg-white/[0.04] [&::-webkit-scrollbar]:hidden">
                    {items.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.label}
                                className="bccc-public-amenity-item flex min-w-[13rem] flex-1 items-center justify-center gap-3 border-r border-[#176456]/10 px-4 py-4 last:border-r-0 sm:min-w-[14rem] lg:min-w-0 dark:border-white/10"
                            >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#176456]/14 bg-[#176456]/8 text-[#176456] dark:border-white/10 dark:bg-white/8 dark:text-[#9fe8dc]">
                                    <Icon className="h-4 w-4" />
                                </span>

                                <span className="min-w-0">
                                    {item.value ? (
                                        <span className="block text-xl leading-none font-black tracking-[-0.045em] text-[#153f37] dark:text-white">
                                            {item.value}
                                        </span>
                                    ) : null}
                                    <span className="mt-1 block truncate text-[11px] font-black tracking-[0.16em] text-[#596b65] uppercase dark:text-white/56">
                                        {item.label}
                                    </span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
