import {
    BOOKING_USAGE_LABELS,
    estimateSelectedVenueCharge,
    isIncludedByFullHall,
    packageDisplayItems,
    type BookingUsageKey,
    type BookingVenueCatalogItem,
    type BookingVenueKey,
} from '@/lib/booking-venue-catalog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Images,
    Info,
    PackageCheck,
    ReceiptText,
    Sparkles,
    Users,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

type MatchedVenueItem = BookingVenueCatalogItem & {
    service?: {
        id?: number | string;
        name?: string;
        price?: number | string | null;
    };
    configured: boolean;
};

type Props = {
    items: MatchedVenueItem[];
    selectedKeys: BookingVenueKey[];
    usage: BookingUsageKey;
    durationHours: string;
    onSelect: (item: MatchedVenueItem) => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function money(value: unknown): string {
    const number = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(Number.isFinite(number) ? number : 0);
}

function imageOf(item: BookingVenueCatalogItem) {
    return item.image;
}

function SelectionPill({
    children,
    tone = 'neutral',
}: {
    children: React.ReactNode;
    tone?: 'neutral' | 'success' | 'included';
}) {
    return (
        <span
            className={cx(
                'inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold',
                tone === 'success'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-100'
                    : tone === 'included'
                      ? 'bg-[#f1d89b]/30 text-[#604416] ring-1 ring-[#f1d89b]/50 dark:bg-[#f1d89b]/12 dark:text-[#f1d89b]'
                      : 'bg-white/76 text-[#4f422d] ring-1 ring-[#d9c7a6]/70 dark:bg-white/8 dark:text-white/72 dark:ring-white/10',
            )}
        >
            {children}
        </span>
    );
}

function VenueThumb({
    item,
    active,
    included,
    disabled,
    onClick,
}: {
    item: MatchedVenueItem;
    active: boolean;
    included: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    const [failed, setFailed] = useState(false);

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cx(
                'group relative h-24 w-40 shrink-0 overflow-hidden rounded-[1.05rem] border text-left shadow-[0_14px_38px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60',
                active
                    ? 'border-[#f1d89b] ring-2 ring-[#f1d89b]/35'
                    : included
                      ? 'border-emerald-300 ring-2 ring-emerald-300/20'
                      : 'border-white/24',
            )}
        >
            {!failed ? (
                <img
                    src={imageOf(item)}
                    alt={item.displayLabel}
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
            ) : (
                <div className={cx('h-full w-full', item.fallbackClass)} />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/22 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="line-clamp-1 text-sm font-black text-white">
                    {item.displayLabel}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                    {active ? 'Selected' : included ? 'Included' : 'Tap to add'}
                </p>
            </div>

            {(active || included) && (
                <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[#f1d89b] text-[#17120b] shadow-lg">
                    <Check className="h-4 w-4" />
                </span>
            )}
        </button>
    );
}

export default function BookingAreaCarousel({
    items,
    selectedKeys,
    usage,
    durationHours,
    onSelect,
}: Props) {
    const reduceMotion = useReducedMotion();
    const listRef = useRef<HTMLDivElement | null>(null);

    const selectedItems = useMemo(
        () => items.filter((item) => selectedKeys.includes(item.key)),
        [items, selectedKeys],
    );

    const hasFullHall = selectedKeys.includes('FULL_HALL');

    const receiptItems = useMemo(
        () => packageDisplayItems(selectedItems),
        [selectedItems],
    );

    const activeHero =
        items.find((item) => item.key === selectedKeys[selectedKeys.length - 1]) ??
        items.find((item) => item.configured) ??
        items[0];

    const total = estimateSelectedVenueCharge(
        selectedItems,
        usage,
        Number(durationHours || 1),
    );

    function scroll(direction: 'left' | 'right') {
        listRef.current?.scrollBy({
            left: direction === 'left' ? -420 : 420,
            behavior: 'smooth',
        });
    }

    return (
        <section className="booking-area-experience">
            <div className="booking-area-hero">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeHero?.key}
                        initial={
                            reduceMotion
                                ? false
                                : { opacity: 0, scale: 1.035, filter: 'blur(14px)' }
                        }
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, scale: 1.02, filter: 'blur(12px)' }
                        }
                        transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                        className="booking-area-hero-image"
                    >
                        <img
                            src={activeHero?.image}
                            alt={activeHero?.displayLabel}
                            onError={(event) => {
                                event.currentTarget.style.display = 'none';
                            }}
                        />
                    </motion.div>
                </AnimatePresence>

                <div className="booking-area-hero-shade" />

                <div className="booking-area-copy">
                    <p className="booking-area-kicker">
                        {hasFullHall ? 'Package selected' : 'Choose venue area'}
                    </p>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${activeHero?.key}-copy`}
                            initial={
                                reduceMotion
                                    ? false
                                    : { opacity: 0, x: -22, filter: 'blur(10px)' }
                            }
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={
                                reduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, x: 18, filter: 'blur(8px)' }
                            }
                            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <h2>{activeHero?.displayLabel ?? 'Select area'}</h2>
                            <p>
                                {activeHero?.longDescription ??
                                    'Choose the venue area that matches the event setup.'}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {hasFullHall ? (
                            <>
                                <SelectionPill tone="success">
                                    <PackageCheck className="h-3.5 w-3.5" />
                                    Full Hall amount only
                                </SelectionPill>
                                <SelectionPill tone="included">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Other spaces included
                                </SelectionPill>
                            </>
                        ) : (
                            <>
                                <SelectionPill>
                                    <Images className="h-3.5 w-3.5" />
                                    Multi-select individual areas
                                </SelectionPill>
                                <SelectionPill>
                                    <Users className="h-3.5 w-3.5" />
                                    Combine areas if needed
                                </SelectionPill>
                            </>
                        )}

                        <SelectionPill>
                            <ReceiptText className="h-3.5 w-3.5" />
                            {BOOKING_USAGE_LABELS[usage]}
                        </SelectionPill>
                    </div>
                </div>

                <aside className="booking-area-receipt">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        Selection Receipt
                    </p>

                    <h3 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[#21180d] dark:text-white">
                        {money(total)}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#6e604c] dark:text-white/58">
                        {hasFullHall
                            ? 'Only the Full Hall package is charged. Included spaces are shown below for clarity.'
                            : 'Total is the combination of your selected individual areas.'}
                    </p>

                    <div className="mt-4 grid gap-2">
                        {receiptItems.length > 0 ? (
                            receiptItems.map((item) => {
                                const included = hasFullHall && item.key !== 'FULL_HALL';

                                return (
                                    <div
                                        key={item.key}
                                        className="flex items-start justify-between gap-3 rounded-[0.95rem] border border-[#eadcc2]/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-[#21180d] dark:text-white">
                                                {item.displayLabel}
                                            </p>
                                            <p className="text-xs leading-5 text-[#6e604c] dark:text-white/52">
                                                {included ? 'Included in Full Hall package' : item.subtitle}
                                            </p>
                                        </div>

                                        <span
                                            className={cx(
                                                'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold',
                                                included
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-100'
                                                    : 'bg-[#f1d89b]/25 text-[#6b4d17] dark:bg-[#f1d89b]/10 dark:text-[#f1d89b]',
                                            )}
                                        >
                                            {included ? 'Included' : 'Charged'}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-[0.95rem] border border-dashed border-[#d9c7a6]/80 p-4 text-sm text-[#6e604c] dark:border-white/10 dark:text-white/52">
                                Select an area to build your receipt.
                            </div>
                        )}
                    </div>

                    {hasFullHall ? (
                        <div className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                            <Info className="mr-2 inline h-4 w-4" />
                            Foyer & Lobby and Backstage are already included visually under Full Hall.
                        </div>
                    ) : null}
                </aside>

                <div className="booking-area-thumbs">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                                Area choices
                            </p>
                            <p className="text-sm font-semibold text-white">
                                {hasFullHall
                                    ? 'Full Hall includes the support spaces.'
                                    : 'Tap multiple areas to combine.'}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => scroll('left')}
                                className="booking-area-arrow"
                                aria-label="Scroll areas left"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => scroll('right')}
                                className="booking-area-arrow"
                                aria-label="Scroll areas right"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div ref={listRef} className="booking-area-thumb-row">
                        {items.map((item) => {
                            const active = selectedKeys.includes(item.key);
                            const included = hasFullHall && isIncludedByFullHall(item.key);

                            return (
                                <VenueThumb
                                    key={item.key}
                                    item={item}
                                    active={active}
                                    included={included}
                                    disabled={!item.configured}
                                    onClick={() => onSelect(item)}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="booking-area-floating-total">
                    <Sparkles className="h-4 w-4 text-[#f1d89b]" />
                    <span>{hasFullHall ? 'Package total' : 'Combined total'}</span>
                    <strong>{money(total)}</strong>
                </div>
            </div>
        </section>
    );
}
