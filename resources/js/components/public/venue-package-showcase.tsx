import {
    cx,
    descriptionOf,
    imageOf,
    titleOf,
    visibleRecords,
    type PublicImageRecord,
} from '@/components/public/public-display-system';
import SafeImage from '@/components/system/safe-image';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';

type Props = {
    items?: PublicImageRecord[];
};

type PackageService = {
    title: string;
    image: string;
};

const DEFAULT_IMAGE = '/marketing/images/events/default.png';

const FALLBACK_PACKAGES: PublicImageRecord[] = [
    {
        id: 'full-hall',
        title: 'Full Hall Package',
        description:
            'A complete large-format venue package for conventions, ceremonies, exhibitions, conferences, and major public gatherings.',
        image: '/marketing/images/events/darkmain.JPG',
        homepage_visible: true,
        area_labels: [
            'Full Hall',
            'Main Hall',
            'Foyer & Lobby Area',
            'Grounds & Parking',
        ],
        code: 'FULL_HALL',
    },
    {
        id: 'main-hall-led',
        title: 'Main Hall + LED Wall',
        description:
            'A presentation-ready package for conferences, launches, awarding ceremonies, cultural programs, and formal productions.',
        image: '/marketing/images/facilities/ledwall.jpg',
        homepage_visible: true,
        area_labels: ['Main Hall', 'LED Wall', 'Technical Booth'],
        code: 'MAIN_LED',
    },
    {
        id: 'vip-boardroom',
        title: 'VIP Lounge + Board Room',
        description:
            'A refined executive package for private meetings, official preparation rooms, protocol reception, and smaller formal functions.',
        image: '/marketing/images/facilities/boardroom.jpg',
        homepage_visible: true,
        area_labels: ['VIP Lounge', 'Board Room'],
        code: 'VIP_BOARDROOM',
    },
    {
        id: 'gallery-foyer',
        title: 'Gallery + Foyer',
        description:
            'A flexible social and exhibit package for showcases, receptions, registration lounges, cultural activations, and public displays.',
        image: '/marketing/images/facilities/gallery.jpg',
        homepage_visible: true,
        area_labels: ['Gallery', 'Foyer & Lobby Area'],
        code: 'GALLERY_FOYER',
    },
];

const SERVICE_IMAGE_LIBRARY: Array<[RegExp, string]> = [
    [
        /led|wall|screen|technical|booth/i,
        '/marketing/images/facilities/ledwall.jpg',
    ],
    [/board|meeting|conference/i, '/marketing/images/facilities/boardroom.jpg'],
    [/full|grand|main|hall/i, '/marketing/images/facilities/darkmain.JPG'],
    [/vip|lounge/i, '/marketing/images/facilities/darkvip.JPG'],
    [/foyer|lobby|reception/i, '/marketing/images/facilities/lobby.png'],
    [/gallery|exhibit|exhibition/i, '/marketing/images/facilities/gallery.jpg'],
    [/basement|lower/i, '/marketing/images/facilities/basement.png'],
    [/ground|parking|outdoor/i, '/marketing/images/facilities/parking.jpg'],
];

const smoothEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

function textValue(value: unknown) {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return String(value).trim();
    }

    return '';
}

function recordValue(
    item: PublicImageRecord | null | undefined,
    keys: string[],
) {
    if (!item) {
        return '';
    }

    const record = item as Record<string, unknown>;

    for (const key of keys) {
        const value = textValue(record[key]);

        if (value) {
            return value;
        }
    }

    return '';
}

function packageKey(item: PublicImageRecord, index: number) {
    return String(
        item.id ??
            item.slug ??
            item.title ??
            item.name ??
            `venue-package-${index}`,
    );
}

function packageHref(item: PublicImageRecord) {
    const explicit = recordValue(item, [
        'href',
        'url',
        'external_url',
        'externalUrl',
    ]);

    if (explicit) {
        return explicit;
    }

    const code = recordValue(item, [
        'code',
        'package_code',
        'packageCode',
        'slug',
        'id',
    ]);

    return code ? `/book?package=${encodeURIComponent(code)}` : '/book';
}

function packageAreas(item: PublicImageRecord) {
    const record = item as Record<string, unknown>;
    const areaLabels =
        record.areaLabels ||
        record.area_labels ||
        record.areaKeys ||
        record.area_keys;

    if (Array.isArray(areaLabels)) {
        return areaLabels
            .map(String)
            .map((label) => label.trim())
            .filter(Boolean);
    }

    const raw =
        recordValue(item, [
            'areas',
            'area_labels',
            'areaLabels',
            'inclusions',
            'service_names',
            'serviceNames',
        ]) || '';

    if (!raw) {
        return [];
    }

    return raw
        .split(/[,|;/]+/)
        .map((label) => label.trim())
        .filter(Boolean);
}

function serviceImageFor(title: string, fallback: string) {
    const matched = SERVICE_IMAGE_LIBRARY.find(([pattern]) =>
        pattern.test(title),
    );

    return matched?.[1] || fallback || DEFAULT_IMAGE;
}

function imageFromServiceObject(
    service: Record<string, unknown>,
    fallback: string,
) {
    const image =
        textValue(service.image_url) ||
        textValue(service.imageUrl) ||
        textValue(service.image_path) ||
        textValue(service.imagePath) ||
        textValue(service.lightImage) ||
        textValue(service.light_image) ||
        textValue(service.thumbnail_url) ||
        textValue(service.thumbnail) ||
        textValue(service.image);

    if (image) {
        return image;
    }

    const title =
        textValue(service.title) ||
        textValue(service.name) ||
        textValue(service.label) ||
        textValue(service.area) ||
        textValue(service.service);

    return serviceImageFor(title, fallback);
}

function normalizePackageServices(item: PublicImageRecord): PackageService[] {
    const record = item as Record<string, unknown>;
    const fallback = imageOf(item, DEFAULT_IMAGE) || DEFAULT_IMAGE;
    const serviceLike =
        record.services ||
        record.package_services ||
        record.packageServices ||
        record.inclusions ||
        record.areas ||
        record.venue_areas ||
        record.venueAreas;

    if (Array.isArray(serviceLike) && serviceLike.length > 0) {
        return serviceLike
            .map((service, index): PackageService | null => {
                if (
                    typeof service === 'string' ||
                    typeof service === 'number'
                ) {
                    const title = String(service).trim();

                    if (!title) {
                        return null;
                    }

                    return {
                        title,
                        image: serviceImageFor(title, fallback),
                    };
                }

                if (service && typeof service === 'object') {
                    const serviceRecord = service as Record<string, unknown>;
                    const title =
                        textValue(serviceRecord.title) ||
                        textValue(serviceRecord.name) ||
                        textValue(serviceRecord.label) ||
                        textValue(serviceRecord.area) ||
                        textValue(serviceRecord.service) ||
                        `Service ${index + 1}`;

                    return {
                        title,
                        image: imageFromServiceObject(serviceRecord, fallback),
                    };
                }

                return null;
            })
            .filter((service): service is PackageService => Boolean(service))
            .slice(0, 6);
    }

    const areas = packageAreas(item);

    if (areas.length > 0) {
        return areas.slice(0, 6).map((title) => ({
            title,
            image: serviceImageFor(title, fallback),
        }));
    }

    return [
        {
            title: titleOf(item, 'Venue package'),
            image: fallback,
        },
    ];
}

function selectedRecords(items: PublicImageRecord[]) {
    const visible = visibleRecords(items);
    return (visible.length > 0 ? visible : FALLBACK_PACKAGES).slice(0, 7);
}

function PackageImageGrid({
    item,
    index,
}: {
    item: PublicImageRecord;
    index: number;
}) {
    const reducedMotion = Boolean(useReducedMotion());
    const title = titleOf(item, 'Venue Package');
    const description = descriptionOf(
        item,
        'A prepared BCCC venue combination for faster reservation planning and easier event setup.',
    );
    const services = normalizePackageServices(item);
    const href = packageHref(item);
    const packageImage = imageOf(item, DEFAULT_IMAGE) || DEFAULT_IMAGE;

    const transition = reducedMotion
        ? { duration: 0 }
        : {
              duration: 0.74,
              ease: smoothEase,
          };

    return (
        <motion.div
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={transition}
            className="w-full max-w-[1920px] overflow-hidden"
        >
            <motion.div
                initial={
                    reducedMotion ? false : { y: -18, filter: 'blur(10px)' }
                }
                animate={{ y: 0, filter: 'blur(0px)' }}
                exit={
                    reducedMotion ? undefined : { y: -12, filter: 'blur(8px)' }
                }
                transition={transition}
                className="bccc-package-image-grid relative grid w-full max-w-[1920px] overflow-hidden bg-black lg:h-[30rem] lg:grid-cols-[repeat(var(--service-count),minmax(0,1fr))_minmax(30rem,1.92fr)]"
                style={
                    {
                        '--service-count': services.length,
                    } as React.CSSProperties
                }
            >
                {services.map((service, serviceIndex) => (
                    <motion.div
                        key={`${packageKey(item, index)}-${service.title}-${serviceIndex}`}
                        initial={
                            reducedMotion
                                ? false
                                : { opacity: 0, x: -26, scale: 1.035 }
                        }
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                            duration: reducedMotion ? 0 : 0.62,
                            ease: smoothEase,
                            delay: reducedMotion ? 0 : serviceIndex * 0.055,
                        }}
                        className="bccc-package-service-tile group relative min-h-[13rem] overflow-hidden border-t border-white/8 first:border-t-0 lg:min-h-0 lg:border-t-0 lg:border-l lg:first:border-l-0"
                    >
                        <SafeImage
                            src={service.image}
                            fallbackSrc={DEFAULT_IMAGE}
                            alt={service.title}
                            className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.045]"
                            loading="lazy"
                            decoding="async"
                        />

                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.36)_46%,rgba(0,0,0,0.88))]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(215,181,109,0.18),transparent_44%)] opacity-0 transition duration-500 group-hover:opacity-100" />

                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-6">
                            <p className="font-mono text-[clamp(2.1rem,3.2vw,4.65rem)] leading-[0.78] font-black text-white uppercase drop-shadow-[0_18px_42px_rgba(0,0,0,0.56)]">
                                {service.title}
                            </p>

                            <p className="mt-3 text-[9px] font-black text-[#d7b56d]/82 uppercase">
                                Included Area{' '}
                                {String(serviceIndex + 1).padStart(2, '0')}
                            </p>
                        </div>
                    </motion.div>
                ))}

                <motion.div
                    initial={
                        reducedMotion
                            ? false
                            : { opacity: 0, x: 28, scale: 1.035 }
                    }
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                        duration: reducedMotion ? 0 : 0.72,
                        ease: smoothEase,
                        delay: reducedMotion ? 0 : 0.12,
                    }}
                    className="bccc-package-detail-tile group relative min-h-[22rem] overflow-hidden border-t border-white/8 lg:min-h-0 lg:border-t-0 lg:border-l"
                >
                    <SafeImage
                        src={packageImage}
                        fallbackSrc={DEFAULT_IMAGE}
                        alt={title}
                        className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.035]"
                        loading="lazy"
                        decoding="async"
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.86),rgba(0,0,0,0.58)_52%,rgba(0,0,0,0.28))]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(215,181,109,0.20),transparent_42%)]" />

                    <div className="relative flex h-full min-h-[22rem] flex-col justify-end p-5 sm:p-7 lg:min-h-0 lg:p-8">
                        <p className="text-[10px] font-black text-[#d7b56d] uppercase">
                            Package Details
                        </p>

                        <h3 className="mt-3 max-w-[10ch] font-mono text-[clamp(2.4rem,4.3vw,5.6rem)] leading-[0.78] font-black text-white uppercase">
                            {title}
                        </h3>

                        <p className="mt-5 max-w-[34rem] text-sm leading-7 text-white/78">
                            {description}
                        </p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Link
                                href={href}
                                className="group/link inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#f4efe4] px-6 text-[11px] font-black text-[#0b312d] uppercase shadow-[0_22px_54px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-0.5 hover:bg-white"
                            >
                                Book this package
                                <ArrowRight className="h-4 w-4 transition group-hover/link:translate-x-1" />
                            </Link>

                            <Link
                                href="/calendar"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-6 text-[11px] font-black text-white uppercase backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/14"
                            >
                                <CalendarDays className="h-4 w-4" />
                                Calendar
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

export default function VenuePackageShowcase({ items = [] }: Props) {
    const reducedMotion = Boolean(useReducedMotion());
    const records = useMemo(() => selectedRecords(items), [items]);
    const [active, setActive] = useState<number | null>(null);

    return (
        <section
            id="venue-packages"
            className="relative isolate max-w-[1920px] overflow-hidden bg-[#050607] text-white"
        >
            <div className="bccc-package-heading relative mx-auto flex max-w-[1120px] flex-col items-center px-4 py-12 text-center sm:px-6 lg:py-16">
                <p className="text-[10px] font-black tracking-[0.32em] text-[#d7b56d]/82 uppercase">
                    Prepared reservations
                </p>
                <h2 className="mt-4 font-mono text-[clamp(2.7rem,6vw,6rem)] leading-[0.82] font-black tracking-[-0.06em] text-balance text-white uppercase">
                    Venue Packages
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58">
                    Choose a package to open its full-width image composition,
                    included venue areas, package details, and direct booking
                    action.
                </p>
            </div>

            <div className="relative w-full max-w-[1920px]">
                {records.map((item, index) => {
                    const selected = active === index;
                    const title = titleOf(item, 'Venue Package');

                    return (
                        <motion.article
                            key={packageKey(item, index)}
                            initial={
                                reducedMotion ? false : { opacity: 0, y: 16 }
                            }
                            whileInView={
                                reducedMotion ? undefined : { opacity: 1, y: 0 }
                            }
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{
                                duration: reducedMotion ? 0 : 0.42,
                                ease: smoothEase,
                                delay: Math.min(index * 0.035, 0.18),
                            }}
                            className="bccc-package-row relative border-b border-white/10 last:border-b-0"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setActive((current) =>
                                        current === index ? null : index,
                                    )
                                }
                                aria-expanded={selected}
                                className={cx(
                                    'bccc-package-toggle group relative grid min-h-[6rem] w-full place-items-center overflow-hidden bg-[#050607] px-3 py-4 text-center transition duration-500 outline-none focus-visible:ring-4 focus-visible:ring-white/20 sm:min-h-[7.4rem] lg:min-h-[8.4rem]',
                                    selected
                                        ? 'text-white'
                                        : 'text-white/62 hover:text-white',
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className={cx(
                                        'absolute inset-0 transition duration-500',
                                        selected
                                            ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(215,181,109,0.13),transparent_38%)] opacity-100'
                                            : 'bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.045),transparent)] opacity-0 group-hover:opacity-100',
                                    )}
                                />

                                <span
                                    aria-hidden="true"
                                    className={cx(
                                        'absolute top-0 left-1/2 h-px -translate-x-1/2 bg-[#d7b56d] transition-all duration-700',
                                        selected
                                            ? 'w-full opacity-45'
                                            : 'w-0 opacity-0 group-hover:w-60 group-hover:opacity-50',
                                    )}
                                />

                                <span className="relative flex w-full items-center justify-center">
                                    <span className="max-w-[18ch] font-mono text-[clamp(2.8rem,7.4vw,8.4rem)] leading-[0.78] font-black uppercase">
                                        {title}
                                    </span>
                                </span>

                                <span
                                    aria-hidden="true"
                                    className={cx(
                                        'absolute top-1/2 right-4 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border transition duration-500 sm:grid',
                                        selected
                                            ? 'rotate-90 border-[#d7b56d]/55 bg-[#d7b56d]/14 text-[#d7b56d]'
                                            : 'border-white/12 bg-white/5 text-white/32 group-hover:border-white/28 group-hover:text-white',
                                    )}
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            </button>

                            <AnimatePresence initial={false}>
                                {selected ? (
                                    <PackageImageGrid
                                        key={`opened-package-${packageKey(item, index)}`}
                                        item={item}
                                        index={index}
                                    />
                                ) : null}
                            </AnimatePresence>
                        </motion.article>
                    );
                })}
            </div>
        </section>
    );
}
