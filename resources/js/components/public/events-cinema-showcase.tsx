import {
    EmptyPublicPanel,
    cx,
    descriptionOf,
    formatPublicDate,
    imageOf,
    titleOf,
    visibleRecords,
    type PublicImageRecord,
} from '@/components/public/public-display-system';
import SafeImage from '@/components/system/safe-image';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    CalendarDays,
    Clock3,
    Film,
    MapPin,
    Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Props = {
    items?: PublicImageRecord[];
    bcccEvents?: PublicImageRecord[];
    cityEvents?: PublicImageRecord[];
};

type EventMode = 'bccc' | 'city';

type PreviewEvent = {
    item: PublicImageRecord;
    index: number;
    offset: number;
};

const DEFAULT_IMAGE = '/marketing/images/events/default.png';
const AUTO_ADVANCE_MS = 6200;
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

function mod(value: number, total: number) {
    return ((value % total) + total) % total;
}

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

function eventKey(item: PublicImageRecord, index: number) {
    return String(
        item.id ?? item.slug ?? item.title ?? item.name ?? `event-${index}`,
    );
}

function imageFor(item?: PublicImageRecord | null) {
    if (!item) {
        return DEFAULT_IMAGE;
    }

    const record = item as Record<string, unknown>;
    const images = Array.isArray(record.images)
        ? record.images.map(textValue).filter(Boolean)
        : [];

    return (
        recordValue(item, [
            'image_url',
            'imageUrl',
            'image_path',
            'imagePath',
            'lightImage',
            'light_image',
            'darkImage',
            'dark_image',
            'thumbnail_url',
            'thumbnail',
            'image',
        ]) ||
        imageOf(item) ||
        images[0] ||
        DEFAULT_IMAGE
    );
}

function eventDate(item?: PublicImageRecord | null) {
    return recordValue(item, [
        'starts_at',
        'startsAt',
        'event_date',
        'eventDate',
        'date',
        'published_at',
    ]);
}

function eventEndDate(item?: PublicImageRecord | null) {
    return recordValue(item, [
        'ends_at',
        'endsAt',
        'date_end',
        'dateEnd',
        'event_date_end',
        'eventDateEnd',
    ]);
}

function eventTime(item?: PublicImageRecord | null) {
    return recordValue(item, [
        'time',
        'event_time',
        'eventTime',
        'starts_time',
        'startsTime',
    ]);
}

function eventVenue(item?: PublicImageRecord | null) {
    return (
        recordValue(item, [
            'venue',
            'location',
            'event_location',
            'eventLocation',
        ]) || 'Baguio Convention and Cultural Center'
    );
}

function eventCategory(item?: PublicImageRecord | null) {
    return (
        recordValue(item, [
            'category',
            'event_category',
            'eventCategory',
            'scope',
            'type',
        ]) || 'Event Highlight'
    );
}

function isCityEvent(item: PublicImageRecord) {
    const category = eventCategory(item).toLowerCase();
    const scope = recordValue(item, ['scope']).toLowerCase();

    return (
        scope === 'city' ||
        category.includes('city') ||
        category.includes('baguio city')
    );
}

function displayDate(item?: PublicImageRecord | null) {
    const start = eventDate(item);
    const end = eventEndDate(item);

    if (start && end && start !== end) {
        return `${formatPublicDate(start)} — ${formatPublicDate(end)}`;
    }

    return formatPublicDate(start) || 'Date to be announced';
}

function displayDescription(item?: PublicImageRecord | null) {
    return descriptionOf(
        item,
        'A featured public event curated for the Baguio Convention and Cultural Center community.',
    );
}

function mergedUniqueEvents(
    items: PublicImageRecord[],
    bcccEvents: PublicImageRecord[],
    cityEvents: PublicImageRecord[],
) {
    const merged = [...items, ...bcccEvents, ...cityEvents];
    const seen = new Set<string>();

    return merged.filter((item, index) => {
        const key = String(
            item.id ?? item.slug ?? `${titleOf(item, 'Event')}-${index}`,
        );

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function getPreviewStack(
    records: PublicImageRecord[],
    active: number,
): PreviewEvent[] {
    const offsets = [-2, -1, 1, 2];

    return offsets.map((offset) => {
        const index = mod(active + offset, records.length);

        return {
            item: records[index],
            index,
            offset,
        };
    });
}

function EventModeSwitch({
    mode,
    onChange,
    bcccCount,
    cityCount,
}: {
    mode: EventMode;
    onChange: (mode: EventMode) => void;
    bcccCount: number;
    cityCount: number;
}) {
    return (
        <div className="bccc-event-mode-switch inline-flex rounded-full border border-white/10 bg-white/[0.055] p-1 shadow-[0_18px_60px_rgba(0,0,0,0.26)] backdrop-blur-xl">
            {[
                {
                    value: 'bccc' as const,
                    label: 'BCCC Events',
                    count: bcccCount,
                },
                {
                    value: 'city' as const,
                    label: 'Baguio City Events',
                    count: cityCount,
                },
            ].map((item) => (
                <button
                    key={item.value}
                    type="button"
                    onClick={() => onChange(item.value)}
                    className={cx(
                        'min-h-10 rounded-full px-4 text-[10px] font-black tracking-[0.18em] uppercase transition duration-300 sm:px-5',
                        mode === item.value
                            ? 'bg-[#f4efe4] text-[#0b312d] shadow-[0_10px_32px_rgba(0,0,0,0.2)]'
                            : 'text-white/54 hover:bg-white/8 hover:text-white',
                    )}
                >
                    {item.label}
                    <span
                        className={cx(
                            'ml-2',
                            mode === item.value
                                ? 'text-[#0b312d]/50'
                                : 'text-white/30',
                        )}
                    >
                        {item.count}
                    </span>
                </button>
            ))}
        </div>
    );
}

function EventMeta({ item }: { item: PublicImageRecord }) {
    const time = eventTime(item);

    return (
        <div className="bccc-events-meta mt-6 grid gap-3 text-xs text-white/78 sm:grid-cols-3">
            <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#d7b56d]" />
                <span>
                    <span className="block text-[10px] font-black tracking-[0.18em] text-white/42 uppercase">
                        Date
                    </span>
                    <span className="mt-1 block font-semibold">
                        {displayDate(item)}
                    </span>
                </span>
            </div>

            <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#d7b56d]" />
                <span>
                    <span className="block text-[10px] font-black tracking-[0.18em] text-white/42 uppercase">
                        Time
                    </span>
                    <span className="mt-1 block font-semibold">
                        {time || 'Schedule to be announced'}
                    </span>
                </span>
            </div>

            <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#d7b56d]" />
                <span>
                    <span className="block text-[10px] font-black tracking-[0.18em] text-white/42 uppercase">
                        Venue
                    </span>
                    <span className="mt-1 block font-semibold">
                        {eventVenue(item)}
                    </span>
                </span>
            </div>
        </div>
    );
}

function PreviewCard({
    event,
    active,
    onSelect,
}: {
    event: PreviewEvent;
    active: number;
    onSelect: (index: number) => void;
}) {
    const reducedMotion = Boolean(useReducedMotion());
    const title = titleOf(event.item, 'Event');
    const position = event.offset < 0 ? 'upper' : 'lower';

    const pose =
        event.offset === -2
            ? {
                  top: '-9%',
                  right: '-1.4rem',
                  width: 'min(21vw, 23rem)',
                  rotate: -13,
                  scale: 0.76,
                  opacity: 0.46,
                  zIndex: 14,
              }
            : event.offset === -1
              ? {
                    top: '12%',
                    right: '2.4rem',
                    width: 'min(24vw, 27rem)',
                    rotate: -6,
                    scale: 0.92,
                    opacity: 0.88,
                    zIndex: 24,
                }
              : event.offset === 1
                ? {
                      top: '56%',
                      right: '2rem',
                      width: 'min(24vw, 27rem)',
                      rotate: 6,
                      scale: 0.92,
                      opacity: 0.88,
                      zIndex: 23,
                  }
                : {
                      top: '80%',
                      right: '-1.7rem',
                      width: 'min(21vw, 23rem)',
                      rotate: 13,
                      scale: 0.76,
                      opacity: 0.46,
                      zIndex: 13,
                  };

    return (
        <motion.button
            type="button"
            aria-label={`View event ${title}`}
            onClick={() => onSelect(event.index)}
            className="group absolute aspect-[16/10] overflow-hidden rounded-[1.35rem] bg-white/8 p-[3px] text-left shadow-[0_34px_100px_rgba(0,0,0,0.34)] backdrop-blur-xl transition duration-500 outline-none hover:z-[70] hover:brightness-110 focus-visible:ring-4 focus-visible:ring-white/24"
            style={{
                top: pose.top,
                right: pose.right,
                width: pose.width,
                zIndex: pose.zIndex,
                transformOrigin: '100% 50%',
            }}
            initial={
                reducedMotion
                    ? false
                    : {
                          opacity: 0,
                          x: 120,
                          y: position === 'upper' ? -20 : 20,
                          scale: pose.scale * 0.84,
                          rotate: pose.rotate + (position === 'upper' ? -7 : 7),
                          filter: 'blur(8px)',
                      }
            }
            animate={{
                opacity: pose.opacity,
                x: 0,
                y: 0,
                scale: pose.scale,
                rotate: pose.rotate,
                filter: event.index === active ? 'blur(0px)' : 'blur(0px)',
            }}
            exit={
                reducedMotion
                    ? undefined
                    : {
                          opacity: 0,
                          x: 110,
                          y: position === 'upper' ? -20 : 20,
                          scale: pose.scale * 0.86,
                          rotate: pose.rotate + (position === 'upper' ? -7 : 7),
                          filter: 'blur(8px)',
                      }
            }
            transition={
                reducedMotion
                    ? { duration: 0 }
                    : {
                          type: 'spring',
                          stiffness: 70,
                          damping: 22,
                          mass: 0.92,
                      }
            }
        >
            <div className="relative h-full overflow-hidden rounded-[1.12rem] bg-[#0b312d]">
                <SafeImage
                    src={imageFor(event.item)}
                    fallbackSrc={DEFAULT_IMAGE}
                    alt={title}
                    className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.06]"
                    loading="lazy"
                    decoding="async"
                />

                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.62),rgba(0,0,0,0.08)_68%)]" />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/74 via-black/20 to-transparent" />

                <div className="absolute right-4 bottom-4 left-4">
                    <p className="text-[9px] font-black tracking-[0.2em] text-[#d7b56d] uppercase">
                        {formatPublicDate(eventDate(event.item)) ||
                            eventCategory(event.item)}
                    </p>

                    <p className="mt-2 line-clamp-2 max-w-[15rem] text-2xl leading-[0.9] font-semibold tracking-[-0.06em] text-white drop-shadow-[0_12px_28px_rgba(0,0,0,0.36)]">
                        {title}
                    </p>
                </div>
            </div>
        </motion.button>
    );
}

function MobileEventStrip({
    records,
    active,
    onSelect,
}: {
    records: PublicImageRecord[];
    active: number;
    onSelect: (index: number) => void;
}) {
    const shown = useMemo(() => {
        if (records.length <= 5) {
            return records.map((item, index) => ({ item, index }));
        }

        return [-2, -1, 0, 1, 2].map((offset) => {
            const index = mod(active + offset, records.length);
            return { item: records[index], index };
        });
    }, [records, active]);

    return (
        <div className="bccc-events-mobile-strip absolute inset-x-0 bottom-4 z-40 px-4 lg:hidden">
            <div className="mx-auto grid max-w-[34rem] grid-cols-5 gap-1.5 rounded-[1.1rem] bg-black/30 p-1.5 shadow-[0_22px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                {shown.map(({ item, index }) => {
                    const selected = index === active;
                    const title = titleOf(item, 'Event');

                    return (
                        <button
                            key={`mobile-event-${eventKey(item, index)}`}
                            type="button"
                            onClick={() => onSelect(index)}
                            aria-label={
                                selected
                                    ? `Current event: ${title}`
                                    : `View event ${title}`
                            }
                            className={cx(
                                'relative aspect-[4/5] overflow-hidden rounded-[0.85rem] transition duration-500 outline-none focus-visible:ring-[3px] focus-visible:ring-white/28',
                                selected
                                    ? 'scale-[1.03] opacity-100'
                                    : 'opacity-65 hover:opacity-100',
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
                                    selected ? 'bg-black/10' : 'bg-black/42',
                                )}
                            />
                            {selected ? (
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

function EventFeature({
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
    onPause: (value: boolean) => void;
}) {
    const reducedMotion = Boolean(useReducedMotion());
    const title = titleOf(item, 'Event Highlight');
    const image = imageFor(item);
    const externalUrl = recordValue(item, [
        'external_url',
        'externalUrl',
        'url',
        'href',
    ]);

    const visualTransition = reducedMotion
        ? { duration: 0 }
        : {
              duration: 1.02,
              ease,
          };

    const contentTransition = reducedMotion
        ? { duration: 0 }
        : {
              duration: 0.72,
              ease,
          };

    return (
        <motion.article
            key={`event-feature-${eventKey(item, index)}`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
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
            className="bccc-events-feature absolute inset-0 z-10 cursor-grab overflow-hidden bg-[#061514] text-white active:cursor-grabbing"
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
                        : { scale: 1.05, x: 32, filter: 'blur(12px)' }
                }
                animate={{ scale: 1, x: 0, filter: 'blur(0px)' }}
                exit={
                    reducedMotion
                        ? undefined
                        : { scale: 1.035, x: -24, filter: 'blur(10px)' }
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

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_46%,rgba(7,76,66,0.06)_0%,rgba(3,18,18,0.16)_38%,rgba(0,0,0,0.78)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#07110f_0%,rgba(7,17,15,0.94)_17%,rgba(7,17,15,0.64)_34%,rgba(7,17,15,0.16)_57%,rgba(7,17,15,0.68)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-[54%] bg-gradient-to-t from-black/80 via-black/22 to-transparent" />

            <div className="pointer-events-none absolute top-1/2 -right-[15rem] hidden h-[72rem] w-[72rem] -translate-y-1/2 rounded-full border border-[#d7b56d]/22 lg:block" />
            <div className="pointer-events-none absolute top-1/2 -right-[25rem] hidden h-[58rem] w-[58rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,105,91,0.34)_0%,rgba(6,45,42,0.22)_42%,transparent_72%)] lg:block" />

            <div className="bccc-events-feature-content relative z-20 flex min-h-[100svh] w-full flex-col justify-between px-5 py-7 sm:px-7 lg:min-h-[min(100svh,60rem)] lg:px-12 lg:py-10 xl:px-16 2xl:px-20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-full border border-[#d7b56d]/28 bg-white/8 shadow-[0_18px_52px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                            <Film className="h-5 w-5 text-[#d7b56d]" />
                        </div>

                        <div>
                            <p className="text-[10px] font-black tracking-[0.28em] text-[#d7b56d] uppercase">
                                Event Highlights
                            </p>
                            <p className="mt-1 text-[10px] font-bold tracking-[0.22em] text-white/42 uppercase">
                                BCCC EASE Public Showcase
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/events"
                        className="group inline-flex min-h-10 items-center gap-3 rounded-full border border-white/12 bg-white/7 px-4 text-[10px] font-black tracking-[0.18em] text-white/70 uppercase backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/12 hover:text-white"
                    >
                        View all events
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </Link>
                </div>

                <div className="grid flex-1 items-end gap-10 pt-12 pb-[8.5rem] sm:pb-[7.5rem] lg:grid-cols-[minmax(22rem,35rem)_1fr] lg:pt-10 lg:pb-10 xl:grid-cols-[minmax(24rem,39rem)_1fr]">
                    <motion.div
                        initial={
                            reducedMotion
                                ? false
                                : { opacity: 0, x: -26, filter: 'blur(8px)' }
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
                        className="bccc-events-copy max-w-[37rem]"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 backdrop-blur-xl">
                            <Sparkles className="h-3.5 w-3.5 text-[#d7b56d]" />
                            <p className="text-[10px] font-black tracking-[0.22em] text-[#d7b56d] uppercase">
                                {eventCategory(item)}
                            </p>
                        </div>

                        <h2 className="mt-5 max-w-[10ch] text-[clamp(3.35rem,7vw,7.4rem)] leading-[0.86] font-semibold tracking-[-0.095em] text-white drop-shadow-[0_18px_42px_rgba(0,0,0,0.38)]">
                            {title}
                        </h2>

                        <div className="mt-7 h-0.5 w-12 bg-[#d7b56d]" />

                        <p className="mt-7 max-w-[36rem] text-sm leading-7 text-white/72 sm:text-base sm:leading-8">
                            {displayDescription(item)}
                        </p>

                        <EventMeta item={item} />

                        <div className="mt-8 flex flex-wrap items-center gap-5">
                            {externalUrl ? (
                                <a
                                    href={externalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group inline-flex items-center gap-4 border-b border-[#d7b56d] pb-2 text-[11px] font-black tracking-[0.22em] text-white uppercase transition hover:gap-5 hover:text-[#d7b56d]"
                                >
                                    Explore event details
                                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                </a>
                            ) : null}

                            <span className="text-[10px] font-bold tracking-[0.18em] text-white/38 uppercase">
                                {String(index + 1).padStart(2, '0')} /{' '}
                                {String(total).padStart(2, '0')}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.article>
    );
}

export default function EventsCinemaShowcase({
    items = [],
    bcccEvents = [],
    cityEvents = [],
}: Props) {
    const all = useMemo(
        () => visibleRecords(mergedUniqueEvents(items, bcccEvents, cityEvents)),
        [items, bcccEvents, cityEvents],
    );

    const bcccRecords = useMemo(() => {
        const filtered = all.filter((item) => !isCityEvent(item));
        return filtered.length > 0 ? filtered : all;
    }, [all]);

    const cityRecords = useMemo(
        () => all.filter((item) => isCityEvent(item)),
        [all],
    );

    const [mode, setMode] = useState<EventMode>('bccc');
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const reducedMotion = Boolean(useReducedMotion());

    const records =
        mode === 'city'
            ? cityRecords.length > 0
                ? cityRecords
                : all
            : bcccRecords;
    const current =
        records.length > 0 ? records[mod(active, records.length)] : null;
    const previewStack = useMemo(
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
        }, AUTO_ADVANCE_MS);

        return () => window.clearInterval(timer);
    }, [paused, records.length, reducedMotion]);

    useEffect(() => {
        records.slice(0, 8).forEach((item) => {
            const img = new Image();
            img.src = imageFor(item);
        });
    }, [records]);

    function changeMode(nextMode: EventMode) {
        if (nextMode === mode) {
            return;
        }

        setMode(nextMode);
        setActive(0);
    }

    function go(direction: number) {
        setActive((value) => mod(value + direction, records.length));
    }

    function jump(index: number) {
        setActive(mod(index, records.length));
    }

    if (all.length === 0 || !current) {
        return (
            <section id="events" className="bg-[#061514] py-16 text-white">
                <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-8">
                    <EmptyPublicPanel
                        icon={CalendarDays}
                        title="No events yet"
                        description="Event highlights configured in the Content Manager will appear here."
                    />
                </div>
            </section>
        );
    }

    return (
        <section
            id="events"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="bccc-public-events-showcase relative isolate min-h-[100svh] overflow-hidden bg-[#061514] text-white lg:min-h-[min(100svh,60rem)]"
        >
            <AnimatePresence initial={false} mode="sync">
                <EventFeature
                    key={`event-active-${eventKey(current, active)}-${mode}`}
                    item={current}
                    index={mod(active, records.length)}
                    total={records.length}
                    onNext={() => go(1)}
                    onPrevious={() => go(-1)}
                    onPause={setPaused}
                />
            </AnimatePresence>

            <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,transparent_78%,rgba(0,0,0,0.28))]" />

            <div className="absolute top-8 left-1/2 z-40 hidden -translate-x-1/2 lg:block">
                <EventModeSwitch
                    mode={mode}
                    onChange={changeMode}
                    bcccCount={bcccRecords.length}
                    cityCount={cityRecords.length}
                />
            </div>

            <div className="pointer-events-none absolute inset-y-0 right-0 z-40 hidden w-[39rem] overflow-hidden [perspective:1600px] lg:block xl:w-[45rem] 2xl:w-[51rem]">
                <div className="pointer-events-none absolute inset-y-0 right-0 w-[76%] bg-gradient-to-l from-[#062421]/80 via-[#062421]/22 to-transparent" />

                <AnimatePresence initial={false} mode="popLayout">
                    {previewStack.map((event) => (
                        <div
                            key={`event-preview-${eventKey(event.item, event.index)}-${event.offset}`}
                            className="pointer-events-auto"
                        >
                            <PreviewCard
                                event={event}
                                active={mod(active, records.length)}
                                onSelect={jump}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="absolute top-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
                <EventModeSwitch
                    mode={mode}
                    onChange={changeMode}
                    bcccCount={bcccRecords.length}
                    cityCount={cityRecords.length}
                />
            </div>

            <MobileEventStrip
                records={records}
                active={mod(active, records.length)}
                onSelect={jump}
            />
        </section>
    );
}
