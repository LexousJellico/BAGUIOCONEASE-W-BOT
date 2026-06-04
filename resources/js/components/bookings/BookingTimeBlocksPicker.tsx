import {
    cleanBlockList,
    humanDate,
    isFullyBooked,
    normalizeAvailability,
    normalizeContiguousBlocks,
    rangeForBlocks,
    unavailableMiddleBlock,
    type AvailabilityResponse,
    type BlockKey,
} from '@/lib/booking-time-blocks';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Loader2, Lock, Sparkles } from 'lucide-react';
import * as React from 'react';

type BookingTimeBlocksPickerProps = {
    date: string;
    onDateChange: (date: string) => void;
    value: BlockKey[];
    onChange: (blocks: BlockKey[]) => void;
    excludeBookingId?: number | null;
    serviceId?: number | null;
    serviceTypeId?: number | null;
    areaId?: number | null;
    availabilityUrl?: string;
    disabled?: boolean;
    contactNumber?: string | null;
    label?: string;
    onRangeChange?: (range: {
        fromIso: string;
        toIso: string;
        label: string;
    }) => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function blockTone(isSelected: boolean, isAvailable: boolean) {
    if (!isAvailable) {
        return 'border-rose-200/80 bg-rose-50 text-rose-900 opacity-70 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100';
    }

    if (isSelected) {
        return 'border-[#b08d48]/70 bg-[#2f2517] text-white shadow-[0_18px_44px_rgba(47,37,23,0.22)] dark:border-white/20 dark:bg-white dark:text-[#17120b]';
    }

    return 'border-[#d9c7a6]/70 bg-white/82 text-[#2f2517] hover:border-[#b08d48]/70 hover:bg-[#fffaf0] dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/10';
}

export default function BookingTimeBlocksPicker({
    date,
    onDateChange,
    value,
    onChange,
    excludeBookingId,
    serviceId,
    serviceTypeId,
    areaId,
    availabilityUrl = '/bookings/availability',
    disabled = false,
    contactNumber,
    label = 'Booking date and time blocks',
    onRangeChange,
}: BookingTimeBlocksPickerProps) {
    const [loading, setLoading] = React.useState(false);
    const [availability, setAvailability] = React.useState<AvailabilityResponse | null>(null);
    const [hint, setHint] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const selected = React.useMemo(() => normalizeContiguousBlocks(value), [value]);
    const normalizedBlocks = React.useMemo(() => normalizeAvailability(availability), [availability]);
    const selectedRange = React.useMemo(() => rangeForBlocks(date, selected), [date, selected]);

    React.useEffect(() => {
        if (!date) {
            setAvailability(null);
            setHint(null);
            setError(null);
            return;
        }

        const controller = new AbortController();

        async function loadAvailability() {
            setLoading(true);
            setHint(null);
            setError(null);

            try {
                const url = new URL(availabilityUrl, window.location.origin);

                url.searchParams.set('date', date);

                if (excludeBookingId) {
                    url.searchParams.set('exclude_booking_id', String(excludeBookingId));
                }

                if (serviceId) {
                    url.searchParams.set('service_id', String(serviceId));
                }

                if (serviceTypeId) {
                    url.searchParams.set('service_type_id', String(serviceTypeId));
                }

                if (areaId) {
                    url.searchParams.set('area_id', String(areaId));
                }

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Availability request failed with status ${response.status}`);
                }

                const json = (await response.json()) as AvailabilityResponse;

                setAvailability(json);

                const badBlock = unavailableMiddleBlock(json, selected);

                if (badBlock) {
                    onChange(selected.filter((block) => block !== badBlock));
                    setHint(`${badBlock} is already booked or blocked. It was removed from your selected time blocks.`);
                }
            } catch {
                if (controller.signal.aborted) {
                    return;
                }

                setAvailability(null);
                setError('Availability could not be checked right now. You may continue, but staff should verify this schedule.');
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadAvailability();

        return () => controller.abort();
    }, [availabilityUrl, date, excludeBookingId, serviceId, serviceTypeId, areaId, onChange, selected]);

    React.useEffect(() => {
        if (!onRangeChange || !selectedRange) {
            return;
        }

        onRangeChange({
            fromIso: selectedRange.fromIso,
            toIso: selectedRange.toIso,
            label: selectedRange.label,
        });
    }, [onRangeChange, selectedRange]);

    function isBlockAvailable(block: BlockKey) {
        const match = normalizedBlocks.find((item) => item.key === block);

        return match?.isAvailable ?? true;
    }

    function toggleBlock(block: BlockKey) {
        if (disabled || !date) {
            return;
        }

        setHint(null);

        if (!isBlockAvailable(block)) {
            setHint(`${block} is not available on ${humanDate(date)}.`);
            return;
        }

        const current = new Set(cleanBlockList(selected));

        if (current.has(block)) {
            current.delete(block);
        } else {
            current.add(block);
        }

        const next = normalizeContiguousBlocks([...current]);
        const badBlock = unavailableMiddleBlock(availability, next);

        if (badBlock) {
            setHint(
                `That combination crosses ${badBlock}, which is already booked or blocked. Please choose another available block.`,
            );
            return;
        }

        onChange(next);
    }

    const fullyBooked = isFullyBooked(availability);

    return (
        <section className="overflow-hidden rounded-[1.65rem] border border-[#d9c7a6]/70 bg-white/86 p-4 shadow-[0_18px_54px_rgba(47,37,23,0.09)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-[#f7f0e3] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {label}
                    </div>

                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                        Select the event date and usable time block.
                    </h3>

                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[#6e604c] dark:text-white/58">
                        AM is 6:00 AM–12:00 PM, PM is 12:00 PM–6:00 PM, and EVE is 6:00 PM–11:59 PM.
                        If you select non-adjacent blocks, the picker will automatically form a continuous range and prevent combinations that cross a booked block.
                    </p>
                </div>

                <div className="w-full lg:w-[18rem]">
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a6b55] dark:text-white/48">
                        Event Date
                    </label>

                    <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9d7b3d]" />
                        <input
                            type="date"
                            value={date || ''}
                            onChange={(event) => onDateChange(event.target.value)}
                            disabled={disabled}
                            className="h-12 w-full rounded-full border border-[#d9c7a6]/80 bg-white/90 pl-10 pr-4 text-sm font-semibold text-[#2f2517] shadow-[0_12px_32px_rgba(47,37,23,0.07)] outline-none transition focus:border-[#b08d48] focus:ring-4 focus:ring-[#b08d48]/12 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/7 dark:text-white dark:focus:border-[#f1d89b]"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
                {normalizedBlocks.map((block) => {
                    const isSelected = selected.includes(block.key);
                    const unavailable = !block.isAvailable;
                    const Icon = unavailable ? Lock : isSelected ? CheckCircle2 : Clock3;

                    return (
                        <button
                            key={block.key}
                            type="button"
                            onClick={() => toggleBlock(block.key)}
                            disabled={disabled || !date || unavailable}
                            className={cx(
                                'group min-h-[8.6rem] rounded-[1.35rem] border p-4 text-left transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0',
                                blockTone(isSelected, block.isAvailable),
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-70">
                                        {block.description}
                                    </p>

                                    <h4 className="mt-1 text-3xl font-semibold tracking-[-0.055em]">
                                        {block.title}
                                    </h4>
                                </div>

                                <span
                                    className={cx(
                                        'grid h-10 w-10 shrink-0 place-items-center rounded-full',
                                        isSelected
                                            ? 'bg-white/14 text-white dark:bg-[#17120b]/8 dark:text-[#17120b]'
                                            : unavailable
                                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-200'
                                              : 'bg-[#f7f0e3] text-[#9d7b3d] dark:bg-white/10 dark:text-[#f1d89b]',
                                    )}
                                >
                                    <Icon className="h-4.5 w-4.5" />
                                </span>
                            </div>

                            <p className="mt-4 text-sm font-semibold opacity-90">{block.display}</p>

                            {unavailable ? (
                                <p className="mt-2 text-xs leading-5 opacity-75">
                                    {block.reason || 'This block is already booked or blocked.'}
                                </p>
                            ) : (
                                <p className="mt-2 text-xs leading-5 opacity-70">
                                    {isSelected ? 'Selected for this booking.' : 'Available for selection.'}
                                </p>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-2">
                    {loading ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-[#f7f0e3] px-3 py-2 text-xs font-semibold text-[#7a5a24] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Checking availability…
                        </div>
                    ) : null}

                    {error ? (
                        <div className="flex items-start gap-2 rounded-[1.15rem] border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    ) : null}

                    {hint ? (
                        <div className="flex items-start gap-2 rounded-[1.15rem] border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            {hint}
                        </div>
                    ) : null}

                    {fullyBooked ? (
                        <div className="flex items-start gap-2 rounded-[1.15rem] border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                            This date is fully booked or blocked. Please choose another date.
                        </div>
                    ) : null}
                </div>

                <div className="rounded-[1.25rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/84 p-4 text-sm text-[#4a3b27] dark:border-white/10 dark:bg-white/7 dark:text-white/72 lg:w-[24rem]">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Selected Range
                    </div>

                    {selectedRange ? (
                        <div className="mt-2">
                            <p className="text-lg font-semibold tracking-[-0.035em] text-[#21180d] dark:text-white">
                                {selectedRange.label}
                            </p>
                            <p className="mt-1 text-sm">
                                {humanDate(date)} • {selectedRange.display}
                            </p>
                            <p className="mt-2 text-xs leading-5 opacity-70">
                                System range: {selectedRange.fromIso} → {selectedRange.toIso}
                            </p>
                        </div>
                    ) : (
                        <p className="mt-2 text-sm leading-6">
                            Choose a date and at least one available time block to continue.
                        </p>
                    )}

                    <p className="mt-3 border-t border-[#d9c7a6]/70 pt-3 text-xs leading-5 opacity-70 dark:border-white/10">
                        Midnight to 6:00 AM usage is admin-assisted only.{' '}
                        {contactNumber ? `Please contact ${contactNumber} for special arrangements.` : 'Please contact the office for special arrangements.'}
                    </p>
                </div>
            </div>
        </section>
    );
}

export type { BlockKey };
