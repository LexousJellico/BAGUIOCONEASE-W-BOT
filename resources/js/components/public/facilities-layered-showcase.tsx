import {
    EmptyPublicPanel,
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
import {
    ArrowUpRight,
    Building2,
    MapPin,
    Ruler,
    UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Props = {
    items?: PublicImageRecord[];
};

type PreviewOffset = -2 | -1 | 1 | 2;

type StackItem = {
    item: PublicImageRecord;
    index: number;
    offset: PreviewOffset;
};

type PreviewPose = {
    right: string;
    top: string;
    width: string;
    rotate: number;
    scale: number;
    opacity: number;
    zIndex: number;
    blur?: number;
};

const DEFAULT_IMAGE = '/marketing/images/events/default.png';
const PREVIEW_OFFSETS: PreviewOffset[] = [-2, -1, 1, 2];

const DESKTOP_PREVIEW_POSES: Record<PreviewOffset, PreviewPose> = {
    [-2]: {
        right: '-2.2rem',
        top: '-6.5%',
        width: 'min(23vw, 26rem)',
        rotate: -15,
        scale: 0.78,
        opacity: 0.54,
        zIndex: 36,
        blur: 0.35,
    },
    [-1]: {
        right: '2.4rem',
        top: '10%',
        width: 'min(26vw, 30rem)',
        rotate: -8,
        scale: 0.94,
        opacity: 0.92,
        zIndex: 52,
    },
    [1]: {
        right: '2rem',
        top: '58%',
        width: 'min(26vw, 30rem)',
        rotate: 8,
        scale: 0.94,
        opacity: 0.92,
        zIndex: 51,
    },
    [2]: {
        right: '-2.5rem',
        top: '81%',
        width: 'min(23vw, 26rem)',
        rotate: 15,
        scale: 0.78,
        opacity: 0.54,
        zIndex: 35,
        blur: 0.35,
    },
};

const TABLET_PREVIEW_POSES: Record<PreviewOffset, PreviewPose> = {
    [-2]: {
        right: '-2.25rem',
        top: '3%',
        width: '18rem',
        rotate: -13,
        scale: 0.78,
        opacity: 0.45,
        zIndex: 34,
        blur: 0.3,
    },
    [-1]: {
        right: '1rem',
        top: '17%',
        width: '20rem',
        rotate: -7,
        scale: 0.9,
        opacity: 0.84,
        zIndex: 48,
    },
    [1]: {
        right: '1rem',
        top: '58%',
        width: '20rem',
        rotate: 7,
        scale: 0.9,
        opacity: 0.84,
        zIndex: 47,
    },
    [2]: {
        right: '-2.25rem',
        top: '78%',
        width: '18rem',
        rotate: 13,
        scale: 0.78,
        opacity: 0.45,
        zIndex: 33,
        blur: 0.3,
    },
};

function mod(value: number, total: number) {
    return ((value % total) + total) % total;
}

function recordKey(item: PublicImageRecord, index: number) {
    return String(
        item.id ?? item.slug ?? item.title ?? item.name ?? `facility-${index}`,
    );
}

function stringValue(value: unknown) {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return String(value).trim();
    }

    return '';
}

function firstValue(
    item: PublicImageRecord | null | undefined,
    keys: string[],
    fallback: string,
) {
    for (const key of keys) {
        const value = stringValue(item?.[key]);

        if (value) {
            return value;
        }
    }

    return fallback;
}

function facilityUrl(item?: PublicImageRecord | null) {
    const explicit =
        stringValue(item?.href) ||
        stringValue(item?.url) ||
        stringValue(item?.external_url) ||
        stringValue(item?.externalUrl);

    if (explicit) {
        return explicit;
    }

    const slug = item?.slug || item?.id;

    return slug ? `/facilities/${slug}` : '/facilities';
}

function imageFor(item?: PublicImageRecord | null) {
    return imageOf(item, DEFAULT_IMAGE) || DEFAULT_IMAGE;
}

function categoryOf(item?: PublicImageRecord | null) {
    return firstValue(
        item,
        ['category', 'event_category', 'subtitle', 'type'],
        'BCCC venue space',
    );
}

function capacityOf(item?: PublicImageRecord | null) {
    return firstValue(
        item,
        ['capacity', 'maximum_capacity', 'max_capacity', 'guest_capacity'],
        'Flexible capacity',
    );
}

function floorAreaOf(item?: PublicImageRecord | null) {
    return firstValue(
        item,
        ['floor_area', 'floorArea', 'area', 'size', 'sqm'],
        'Configurable area',
    );
}

function shortDescriptionOf(item?: PublicImageRecord | null) {
    return descriptionOf(
        item,
        'A refined and flexible venue space for conventions, exhibitions, cultural programs, meetings, ceremonies, and city-led gatherings.',
    );
}

function getPreviewStack(
    records: PublicImageRecord[],
    active: number,
): StackItem[] {
    return PREVIEW_OFFSETS.map((offset) => {
        const index = mod(active + offset, records.length);

        return {
            item: records[index],
            index,
            offset,
        };
    });
}

function ActiveFacilityPanel({
    item,
    index,
    total,
    onNext,
    onPrevious,
    onPause,
}: {
    item: PublicImageRecord;
    index: number;
    total: number;
    onNext: () => void;
    onPrevious: () => void;
    onPause: (paused: boolean) => void;
}) {
    const reducedMotion = Boolean(useReducedMotion());
    const title = titleOf(item, 'Grand Hall');
    const description = shortDescriptionOf(item);
    const image = imageFor(item);

    const visualTransition = reducedMotion
        ? { duration: 0 }
        : {
              duration: 1.08,
              ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          };

    const contentTransition = reducedMotion
        ? { duration: 0 }
        : {
              duration: 0.72,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          };

    return (
        <motion.article
            key={recordKey(item, index)}
            aria-label={`Selected facility: ${title}`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.11}
            dragMomentum={false}
            onDragStart={() => onPause(true)}
            onDragEnd={(_, info) => {
                onPause(false);

                if (info.offset.x < -70 || info.velocity.x < -480) {
                    onNext();
                }

                if (info.offset.x > 70 || info.velocity.x > 480) {
                    onPrevious();
                }
            }}
            className="bccc-facility-active absolute inset-0 z-10 cursor-grab overflow-hidden bg-[#061514] text-white active:cursor-grabbing"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={visualTransition}
        >
            <motion.div
                className="absolute inset-0"
                initial={
                    reducedMotion
                        ? false
                        : { scale: 1.045, x: 34, filter: 'blur(12px)' }
                }
                animate={{ scale: 1, x: 0, filter: 'blur(0px)' }}
                exit={
                    reducedMotion
                        ? undefined
                        : { scale: 1.025, x: -28, filter: 'blur(10px)' }
                }
                transition={visualTransition}
            >
                <SafeImage
                    src={image}
                    fallbackSrc={DEFAULT_IMAGE}
                    alt={title}
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                />
            </motion.div>

            <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_72%_50%,rgba(9,72,62,0.08)_0%,rgba(3,18,18,0.18)_36%,rgba(0,0,0,0.72)_100%)]"
            />
            <div
                aria-hidden="true"
                className="bccc-facility-light-veil absolute inset-0 bg-[linear-gradient(90deg,#f8f3e8_0%,rgba(248,243,232,0.96)_16%,rgba(248,243,232,0.84)_24%,rgba(248,243,232,0.38)_35%,rgba(3,16,16,0.12)_52%,rgba(3,16,16,0.62)_100%)]"
            />
            <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black/76 via-black/26 to-transparent"
            />
            <div
                aria-hidden="true"
                className="absolute top-1/2 -right-[15rem] hidden h-[74rem] w-[74rem] -translate-y-1/2 rounded-full border border-[#d7b56d]/28 lg:block"
            />
            <div
                aria-hidden="true"
                className="absolute top-1/2 right-[5.5rem] hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#d7b56d] shadow-[0_0_28px_rgba(215,181,109,0.9)] lg:block"
            />

            <div className="bccc-facility-active-content relative z-20 flex min-h-[50svh] w-full flex-col justify-between px-5 sm:px-7 lg:min-h-[min(100svh,62rem)] lg:px-12 lg:py-30 xl:px-16 2xl:px-20">
                <div className="grid flex-1 items-end gap-10 pb-[8.5rem] sm:pb-[7.5rem] lg:grid-cols-[minmax(20rem,31rem)_1fr] lg:items-end lg:pt-10 lg:pb-8 xl:grid-cols-[minmax(24rem,34rem)_1fr]">
                    <motion.div
                        initial={
                            reducedMotion
                                ? false
                                : { opacity: 0, x: -16, filter: 'blur(8px)' }
                        }
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={
                            reducedMotion
                                ? undefined
                                : { opacity: 0, x: -18, filter: 'blur(8px)' }
                        }
                        transition={{
                            ...contentTransition,
                            delay: reducedMotion ? 0 : 0.1,
                        }}
                        className="bccc-facility-copy max-w-[32rem] text-[#0b312d]"
                    >
                        <h3 className="text-[10px] font-black tracking-[0.32em] text-[#b98f45] uppercase sm:text-[11px]">
                            World-class spaces
                        </h3>

                        <div className="mt-8 lg:mt-10" />

                        <p className="text-[10px] font-black tracking-[0.28em] text-[#d6b46c] uppercase sm:text-[11px]">
                            {categoryOf(item)}
                        </p>

                        <h3 className="mt-3 max-w-[12ch] text-[clamp(2.6rem,5.4vw,5.7rem)] leading-[0.9] font-semibold tracking-[-0.075em] text-[#0b312d] drop-shadow-[0_18px_36px_rgba(0,0,0,0.35)]">
                            {title}
                        </h3>

                        <div className="mt-5 h-0.5 w-12 bg-[#d6b46c]" />

                        <p className="mt-5 max-w-[40rem] text-sm leading-7 text-[#0b312d]/82 sm:text-base sm:leading-8">
                            {description}
                        </p>

                        <div className="bccc-facility-meta mt-7 grid gap-3 text-xs text-[#0b312d]/84 sm:grid-cols-3">
                            <div className="flex items-start gap-3">
                                <UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-[#d6b46c]" />
                                <span>
                                    <span className="block text-[10px] font-black tracking-[0.18em] text-[#0b312d]/48 uppercase">
                                        Capacity
                                    </span>
                                    <span className="mt-1 block font-semibold">
                                        {capacityOf(item)}
                                    </span>
                                </span>
                            </div>

                            <div className="flex items-start gap-3">
                                <Ruler className="mt-0.5 h-5 w-5 shrink-0 text-[#d6b46c]" />
                                <span>
                                    <span className="block text-[10px] font-black tracking-[0.18em] text-[#0b312d]/48 uppercase">
                                        Floor Area
                                    </span>
                                    <span className="mt-1 block font-semibold">
                                        {floorAreaOf(item)}
                                    </span>
                                </span>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#d6b46c]" />
                                <span>
                                    <span className="block text-[10px] font-black tracking-[0.18em] text-[#0b312d]/48 uppercase">
                                        Location
                                    </span>
                                    <span className="mt-1 block font-semibold">
                                        BCCC
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-5">
                            <Link
                                href={facilityUrl(item)}
                                className="group inline-flex items-center gap-4 border-b border-[#d6b46c] pb-2 text-[11px] font-black tracking-[0.22em] text-[#0b312d] uppercase transition hover:gap-5 hover:text-[#d6b46c]"
                            >
                                View details
                                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>

                            <span className="text-[10px] font-bold tracking-[0.18em] text-[#0b312d]/46 uppercase">
                                {String(index + 1).padStart(2, '0')} /{' '}
                                {String(total).padStart(2, '0')}
                            </span>
                        </div>
                        <div className="mt-7 h-0.5 w-12 bg-[#bd9348]" />

                        <p className="mt-7 max-w-[31rem] text-sm leading-7 text-[#183f39]/72 sm:text-base sm:leading-8">
                            From world-class conventions to intimate gatherings
                            and cultural showcases, our facilities are crafted
                            to inspire, connect, and leave a lasting impression.
                        </p>

                        <Link
                            href="/facilities"
                            className="group mt-9 inline-flex items-center gap-4 border-b border-[#bd9348] pb-2 text-[11px] font-black tracking-[0.22em] text-[#0b312d] uppercase transition hover:gap-5 hover:text-[#146a5f]"
                        >
                            Explore all facilities
                            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={
                            reducedMotion
                                ? false
                                : { opacity: 0, y: 26, filter: 'blur(10px)' }
                        }
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={
                            reducedMotion
                                ? undefined
                                : { opacity: 0, y: 20, filter: 'blur(10px)' }
                        }
                        transition={{
                            ...contentTransition,
                            delay: reducedMotion ? 0 : 0.18,
                        }}
                        className="relative max-w-[43rem] text-[#0b312d] lg:ml-[7vw] xl:ml-[9vw]"
                    ></motion.div>
                </div>
            </div>
        </motion.article>
    );
}

function PreviewCard({
    item,
    index,
    offset,
    pose,
    onSelect,
    onPause,
}: {
    item: PublicImageRecord;
    index: number;
    offset: PreviewOffset;
    pose: PreviewPose;
    onSelect: (index: number) => void;
    onPause: (paused: boolean) => void;
}) {
    const reducedMotion = Boolean(useReducedMotion());
    const title = titleOf(item, 'Facility');
    const image = imageFor(item);

    return (
        <motion.button
            type="button"
            layout
            aria-label={`Show ${title}`}
            onClick={() => onSelect(index)}
            onMouseEnter={() => onPause(true)}
            onMouseLeave={() => onPause(false)}
            onFocus={() => onPause(true)}
            onBlur={() => onPause(false)}
            className="group absolute aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-white/8 p-[3px] text-left shadow-[0_38px_110px_rgba(0,0,0,0.34)] backdrop-blur-md transition duration-500 outline-none hover:z-[70] hover:brightness-110 focus-visible:ring-4 focus-visible:ring-white/30 sm:rounded-[1.55rem]"
            style={{
                right: pose.right,
                top: pose.top,
                width: pose.width,
                zIndex: pose.zIndex,
                filter: pose.blur ? `blur(${pose.blur}px)` : undefined,
                transformOrigin: '100% 50%',
            }}
            initial={
                reducedMotion
                    ? false
                    : {
                          opacity: 0,
                          rotate: pose.rotate + (offset < 0 ? -7 : 7),
                          scale: pose.scale * 0.82,
                          x: 120,
                          y: offset < 0 ? -22 : 22,
                          filter: pose.blur
                              ? `blur(${pose.blur + 1.2}px)`
                              : 'blur(1px)',
                      }
            }
            animate={{
                opacity: pose.opacity,
                rotate: pose.rotate,
                scale: pose.scale,
                x: 0,
                y: 0,
                filter: pose.blur ? `blur(${pose.blur}px)` : 'blur(0px)',
            }}
            exit={
                reducedMotion
                    ? undefined
                    : {
                          opacity: 0,
                          rotate: pose.rotate + (offset < 0 ? -9 : 9),
                          scale: pose.scale * 0.82,
                          x: 120,
                          y: offset < 0 ? -24 : 24,
                          filter: 'blur(1px)',
                      }
            }
            transition={
                reducedMotion
                    ? { duration: 0 }
                    : {
                          type: 'spring',
                          stiffness: 70,
                          damping: 21,
                          mass: 0.95,
                      }
            }
        >
            <div className="relative h-full overflow-hidden rounded-[1.05rem] bg-[#d8e7df] sm:rounded-[1.35rem]">
                <SafeImage
                    src={image}
                    fallbackSrc={DEFAULT_IMAGE}
                    alt={title}
                    className="h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-[1.07]"
                    loading="lazy"
                    decoding="async"
                />

                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.48),rgba(0,0,0,0.02)_64%)]" />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/64 via-black/12 to-transparent" />

                <div className="absolute right-4 bottom-4 left-4">
                    <p className="max-w-[15rem] text-xl leading-none font-semibold tracking-[-0.04em] text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.34)] sm:text-2xl">
                        {title}
                    </p>
                    <p className="mt-2 truncate text-[10px] font-bold tracking-[0.18em] text-white/58 uppercase">
                        {categoryOf(item)}
                    </p>
                </div>
            </div>
        </motion.button>
    );
}

function DesktopArcRail({
    stack,
    onSelect,
    onPause,
}: {
    stack: StackItem[];
    onSelect: (index: number) => void;
    onPause: (paused: boolean) => void;
}) {
    return (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-40 hidden w-[38rem] overflow-hidden [perspective:1600px] lg:block xl:w-[43rem] 2xl:w-[49rem]">
            <div
                aria-hidden="true"
                className="absolute top-1/2 -right-[26rem] h-[58rem] w-[58rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,105,91,0.34)_0%,rgba(6,45,42,0.24)_40%,transparent_72%)]"
            />
            <div
                aria-hidden="true"
                className="absolute top-1/2 -right-[18rem] h-[48rem] w-[48rem] -translate-y-1/2 rounded-full border border-[#d8b872]/22"
            />
            <div
                aria-hidden="true"
                className="absolute top-1/2 right-8 h-2 w-2 -translate-y-1/2 rounded-full bg-[#d8b872] shadow-[0_0_26px_rgba(216,184,114,0.9)]"
            />

            <AnimatePresence initial={false} mode="popLayout">
                {stack.map(({ item, index, offset }) => (
                    <div
                        key={`desktop-preview-${recordKey(item, index)}-${offset}`}
                        className="pointer-events-auto"
                    >
                        <PreviewCard
                            item={item}
                            index={index}
                            offset={offset}
                            pose={DESKTOP_PREVIEW_POSES[offset]}
                            onSelect={onSelect}
                            onPause={onPause}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function TabletArcRail({
    stack,
    onSelect,
    onPause,
}: {
    stack: StackItem[];
    onSelect: (index: number) => void;
    onPause: (paused: boolean) => void;
}) {
    return (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-40 hidden w-[24rem] overflow-hidden md:block lg:hidden">
            <div
                aria-hidden="true"
                className="absolute top-1/2 -right-[17rem] h-[40rem] w-[40rem] -translate-y-1/2 rounded-full border border-[#d8b872]/18"
            />

            <AnimatePresence initial={false} mode="popLayout">
                {stack.map(({ item, index, offset }) => (
                    <div
                        key={`tablet-preview-${recordKey(item, index)}-${offset}`}
                        className="pointer-events-auto"
                    >
                        <PreviewCard
                            item={item}
                            index={index}
                            offset={offset}
                            pose={TABLET_PREVIEW_POSES[offset]}
                            onSelect={onSelect}
                            onPause={onPause}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function MobileThumbStrip({
    stack,
    activeIndex,
    current,
    onSelect,
    onPause,
}: {
    stack: StackItem[];
    activeIndex: number;
    current: PublicImageRecord;
    onSelect: (index: number) => void;
    onPause: (paused: boolean) => void;
}) {
    const mobileItems = useMemo(
        () => [{ item: current, index: activeIndex, offset: 0 }, ...stack],
        [activeIndex, current, stack],
    );

    return (
        <div
            className="absolute inset-x-0 bottom-4 z-50 px-4 md:hidden"
            onMouseEnter={() => onPause(true)}
            onMouseLeave={() => onPause(false)}
            onFocus={() => onPause(true)}
            onBlur={() => onPause(false)}
        >
            <div className="mx-auto grid max-w-[32rem] grid-cols-5 gap-1.5 rounded-[1.25rem] bg-black/22 p-1.5 shadow-[0_22px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                {mobileItems.map(({ item, index, offset }) => {
                    const title = titleOf(item, 'Facility');
                    const active = index === activeIndex && offset === 0;

                    return (
                        <button
                            key={`mobile-${recordKey(item, index)}-${offset}`}
                            type="button"
                            aria-label={
                                active
                                    ? `Current facility: ${title}`
                                    : `Show ${title}`
                            }
                            onClick={() => onSelect(index)}
                            className={cx(
                                'relative aspect-[4/5] overflow-hidden rounded-[0.95rem] text-left transition duration-500 outline-none focus-visible:ring-[3px] focus-visible:ring-white/30',
                                active
                                    ? 'scale-[1.02] bg-white/18 shadow-[0_12px_34px_rgba(0,0,0,0.24)]'
                                    : 'bg-white/8 opacity-[0.82] hover:opacity-100',
                            )}
                        >
                            <SafeImage
                                src={imageFor(item)}
                                fallbackSrc={DEFAULT_IMAGE}
                                alt={title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                            />

                            <span
                                className={cx(
                                    'absolute inset-0',
                                    active ? 'bg-black/14' : 'bg-black/34',
                                )}
                            />

                            {active ? (
                                <span className="absolute inset-x-1 bottom-1 rounded-full bg-white/90 px-1 py-1 text-center text-[8px] font-black tracking-[0.12em] text-[#0b312d] uppercase">
                                    Now
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function FacilitiesLayeredShowcase({ items = [] }: Props) {
    const records = useMemo(() => visibleRecords(items), [items]);
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const reducedMotion = Boolean(useReducedMotion());
    const current =
        records.length > 0 ? records[mod(active, records.length)] : null;
    const stack = useMemo(
        () => (records.length > 0 ? getPreviewStack(records, active) : []),
        [records, active],
    );

    useEffect(() => {
        if (records.length === 0) {
            return;
        }

        setActive((value) => mod(value, records.length));
    }, [records.length]);

    useEffect(() => {
        if (records.length < 2 || paused || reducedMotion) {
            return;
        }

        const timer = window.setInterval(() => {
            setActive((value) => mod(value + 1, records.length));
        }, 5600);

        return () => window.clearInterval(timer);
    }, [paused, records.length, reducedMotion]);

    if (records.length === 0 || !current) {
        return (
            <section
                id="facilities"
                className="bg-[#f5f0e6] py-16 dark:bg-[#07110f]"
            >
                <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-8">
                    <EmptyPublicPanel
                        icon={Building2}
                        title="No facilities yet"
                        description="Venue spaces configured in the Content Manager will appear here."
                    />
                </div>
            </section>
        );
    }

    function go(direction: number) {
        setActive((value) => mod(value + direction, records.length));
    }

    function jump(index: number) {
        setActive(mod(index, records.length));
    }

    return (
        <section
            id="facilities"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="bccc-public-facilities-showcase relative isolate min-h-[100svh] overflow-hidden bg-[#061514] text-white lg:min-h-[min(100svh,62rem)]"
        >
            <AnimatePresence initial={false} mode="sync">
                <ActiveFacilityPanel
                    key={`active-facility-${recordKey(current, active)}`}
                    item={current}
                    index={mod(active, records.length)}
                    total={records.length}
                    onNext={() => go(1)}
                    onPrevious={() => go(-1)}
                    onPause={setPaused}
                />
            </AnimatePresence>

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,transparent_78%,rgba(0,0,0,0.22))]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 z-[34] hidden w-[36%] bg-gradient-to-l from-[#062421]/74 via-[#062421]/22 to-transparent md:block"
            />

            <DesktopArcRail stack={stack} onSelect={jump} onPause={setPaused} />
            <TabletArcRail stack={stack} onSelect={jump} onPause={setPaused} />
            <MobileThumbStrip
                stack={stack}
                activeIndex={mod(active, records.length)}
                current={current}
                onSelect={jump}
                onPause={setPaused}
            />
        </section>
    );
}
