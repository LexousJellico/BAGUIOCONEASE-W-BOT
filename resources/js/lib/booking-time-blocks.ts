export type BlockKey = 'AM' | 'PM' | 'EVE';

export type BlockAvailability = {
    key: BlockKey;
    label?: string | null;
    from?: string | null;
    to?: string | null;
    is_available?: boolean | null;
    isAvailable?: boolean | null;
    booked?: boolean | null;
    blocked?: boolean | null;
    reason?: string | null;
};

export type AvailabilityResponse = {
    date?: string | null;
    blocks?: Partial<Record<BlockKey, BlockAvailability | boolean | null>> | null;
    window?: {
        from?: string | null;
        to?: string | null;
    } | null;
    is_fully_booked?: boolean | null;
    isFullyBooked?: boolean | null;
    is_warning?: boolean | null;
    message?: string | null;
};

export type NormalizedBlock = {
    key: BlockKey;
    title: string;
    description: string;
    from: string;
    to: string;
    display: string;
    isAvailable: boolean;
    reason?: string | null;
};

export type BookingRange = {
    label: string;
    blocks: BlockKey[];
    fromIso: string;
    toIso: string;
    display: string;
};

export const BLOCK_ORDER: BlockKey[] = ['AM', 'PM', 'EVE'];

export const BLOCK_DEFINITION: Record<
    BlockKey,
    {
        title: string;
        description: string;
        from: string;
        to: string;
        display: string;
    }
> = {
    AM: {
        title: 'AM',
        description: 'Morning',
        from: '06:00',
        to: '12:00',
        display: '6:00 AM – 12:00 PM',
    },
    PM: {
        title: 'PM',
        description: 'Afternoon',
        from: '12:00',
        to: '18:00',
        display: '12:00 PM – 6:00 PM',
    },
    EVE: {
        title: 'EVE',
        description: 'Evening',
        from: '18:00',
        to: '23:59',
        display: '6:00 PM – 11:59 PM',
    },
};

export function cleanBlockList(blocks?: Array<BlockKey | string | null | undefined> | null): BlockKey[] {
    if (!blocks) {
        return [];
    }

    const unique = new Set<BlockKey>();

    blocks.forEach((block) => {
        const value = String(block ?? '').toUpperCase();

        if (value === 'AM' || value === 'PM' || value === 'EVE') {
            unique.add(value);
        }
    });

    return BLOCK_ORDER.filter((block) => unique.has(block));
}

export function normalizeContiguousBlocks(blocks?: Array<BlockKey | string | null | undefined> | null): BlockKey[] {
    const cleaned = cleanBlockList(blocks);

    if (cleaned.length === 0) {
        return [];
    }

    const indexes = cleaned.map((block) => BLOCK_ORDER.indexOf(block));
    const min = Math.min(...indexes);
    const max = Math.max(...indexes);

    return BLOCK_ORDER.slice(min, max + 1);
}

export function blockLabel(blocks?: Array<BlockKey | string | null | undefined> | null): string {
    const normalized = normalizeContiguousBlocks(blocks);
    const key = normalized.join(',');

    if (key === 'AM') {
        return 'AM only';
    }

    if (key === 'PM') {
        return 'PM only';
    }

    if (key === 'EVE') {
        return 'Evening only';
    }

    if (key === 'AM,PM') {
        return 'Whole Day';
    }

    if (key === 'PM,EVE') {
        return 'Afternoon + Evening';
    }

    if (key === 'AM,PM,EVE') {
        return 'Whole Day + Evening';
    }

    return 'No time block selected';
}

export function toLocalIso(date: string, time: string): string {
    return `${date}T${time}`;
}

export function rangeForBlocks(
    date?: string | null,
    blocks?: Array<BlockKey | string | null | undefined> | null,
): BookingRange | null {
    if (!date) {
        return null;
    }

    const normalized = normalizeContiguousBlocks(blocks);

    if (normalized.length === 0) {
        return null;
    }

    const first = normalized[0];
    const last = normalized[normalized.length - 1];
    const from = BLOCK_DEFINITION[first].from;
    const to = BLOCK_DEFINITION[last].to;

    return {
        label: blockLabel(normalized),
        blocks: normalized,
        fromIso: toLocalIso(date, from),
        toIso: toLocalIso(date, to),
        display: `${BLOCK_DEFINITION[first].display.split(' – ')[0]} – ${
            last === 'EVE' ? '11:59 PM' : BLOCK_DEFINITION[last].display.split(' – ')[1]
        }`,
    };
}

function normalizeAvailabilityValue(key: BlockKey, value: BlockAvailability | boolean | null | undefined): NormalizedBlock {
    const definition = BLOCK_DEFINITION[key];

    if (typeof value === 'boolean') {
        return {
            key,
            title: definition.title,
            description: definition.description,
            from: definition.from,
            to: definition.to,
            display: definition.display,
            isAvailable: value,
            reason: value ? null : 'Booked or blocked',
        };
    }

    const unavailableByFlag = Boolean(value?.booked || value?.blocked);
    const explicitAvailability = value?.is_available ?? value?.isAvailable;
    const isAvailable =
        typeof explicitAvailability === 'boolean' ? explicitAvailability && !unavailableByFlag : !unavailableByFlag;

    return {
        key,
        title: value?.label || definition.title,
        description: definition.description,
        from: value?.from || definition.from,
        to: value?.to || definition.to,
        display: definition.display,
        isAvailable,
        reason: value?.reason || (!isAvailable ? 'Booked or blocked' : null),
    };
}

export function normalizeAvailability(response?: AvailabilityResponse | null): NormalizedBlock[] {
    const blocks = response?.blocks ?? {};

    return BLOCK_ORDER.map((key) => normalizeAvailabilityValue(key, blocks[key]));
}

export function isFullyBooked(response?: AvailabilityResponse | null): boolean {
    if (!response) {
        return false;
    }

    if (typeof response.is_fully_booked === 'boolean') {
        return response.is_fully_booked;
    }

    if (typeof response.isFullyBooked === 'boolean') {
        return response.isFullyBooked;
    }

    return normalizeAvailability(response).every((block) => !block.isAvailable);
}

export function unavailableMiddleBlock(
    response: AvailabilityResponse | null | undefined,
    selectedBlocks: BlockKey[],
): BlockKey | null {
    if (!response || selectedBlocks.length === 0) {
        return null;
    }

    const normalized = normalizeAvailability(response);
    const map = new Map(normalized.map((block) => [block.key, block]));

    for (const block of selectedBlocks) {
        if (!map.get(block)?.isAvailable) {
            return block;
        }
    }

    return null;
}

export function humanDate(value?: string | null): string {
    if (!value) {
        return 'No date selected';
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
}
