export type BookingUsageKey = 'whole_day' | 'half_day' | 'additional_hour';

export type BookingVenueKey =
    | 'FULL_HALL'
    | 'MAIN_HALL'
    | 'LED_WALL'
    | 'VIP_LOUNGE'
    | 'BOARD_ROOM';

export type BookingRateSet = {
    whole_day: number;
    half_day: number;
    additional_hour: number;
};

export type BookingVenueCatalogItem = {
    key: BookingVenueKey;
    label: string;
    displayLabel: string;
    subtitle: string;
    category: 'package' | 'individual';
    image: string;
    description: string;
    longDescription: string;
    capacity: string;
    rates: BookingRateSet;
    includes: string[];
    supportNotes?: string[];
    amenities: string[];
    idealFor: string[];
    guidelines: string[];
    searchNames: string[];
    fallbackClass?: string;
};

export type BookingGuidelineSection = {
    title: string;
    items: string[];
};

export const BOOKING_USAGE_LABELS: Record<BookingUsageKey, string> = {
    whole_day: 'Whole Day',
    half_day: 'Half Day',
    additional_hour: 'Additional Hour',
};

export const FULL_HALL_INCLUDED_KEYS: BookingVenueKey[] = ['MAIN_HALL'];

export const FULL_HALL_SUPPORT_NOTES = [
    'Foyer & Lobby access is included as support space for guest flow and registration.',
    'Backstage access is included as support space for preparation and production movement.',
];

export const BCCC_BOOKING_GENERAL_GUIDELINES: BookingGuidelineSection[] = [
    {
        title: 'Booking confirmation',
        items: [
            'Submission of this form does not automatically approve the booking.',
            'The BCCC office will review the schedule, area, and event requirements.',
            'Official confirmation will depend on availability, compliance, and payment status.',
        ],
    },
    {
        title: 'Payment reminders',
        items: [
            'Pencil bookings may require payment within the given deadline.',
            'Failure to settle required payment may lead to automatic cancellation or decline.',
            'Additional charges may apply after final assessment.',
        ],
    },
    {
        title: 'Venue use',
        items: [
            'The organizer is responsible for proper use of the selected area.',
            'Ingress, egress, technical setup, and house rules must follow BCCC guidance.',
            'Final area access is subject to approved package or selected individual spaces.',
        ],
    },
];

export const BOOKING_VENUE_CATALOG: BookingVenueCatalogItem[] = [
    {
        key: 'FULL_HALL',
        label: 'FULL HALL',
        displayLabel: 'Full Hall Package',
        subtitle: 'Full Hall rental',
        category: 'package',
        image: '/marketing/images/events/darkmain.JPG',
        description:
            'Full Hall rental for large programs, conventions, exhibits, ceremonies, and major public events. VIP Lounge, Board Room, and LED Wall are separate add-ons or package selections.',
        longDescription:
            'Full Hall covers the hall use only. VIP Lounge, Board Room, and LED Wall are no longer bundled automatically and must be selected through a package or add-on when needed. Foyer & Lobby and Backstage remain support notes for guest flow and preparation.',
        capacity: 'Up to 2,000 pax',
        rates: {
            whole_day: 80000,
            half_day: 45000,
            additional_hour: 5000,
        },
        includes: [
            'Full Hall / Main Hall use',
            'Foyer & Lobby support flow',
            'Backstage support access',
        ],
        supportNotes: FULL_HALL_SUPPORT_NOTES,
        amenities: [
            'Full Hall rental',
            'Large event setup',
            'Guest flow support',
            'Program and production support',
        ],
        idealFor: [
            'Conventions',
            'City events',
            'Large ceremonies',
            'Exhibits',
        ],
        guidelines: [
            'VIP Lounge, Board Room, and LED Wall are separate selections and are not automatically included.',
            'Foyer & Lobby and Backstage are support notes for approved Full Hall movement and preparation.',
            'Final use is still subject to BCCC approval.',
        ],
        searchNames: [
            'FULL HALL',
            'FULLHALL',
            'FULL-HALL',
            'ENTIRE HALL',
            'WHOLE HALL',
            'ALL AREAS',
        ],
    },
    {
        key: 'MAIN_HALL',
        label: 'MAIN HALL',
        displayLabel: 'Main Hall',
        subtitle: 'Primary event hall',
        category: 'individual',
        image: '/marketing/images/events/lightmain.JPG',
        description:
            'Main event space for conferences, ceremonies, seminars, and formal programs.',
        longDescription:
            'Main Hall is the primary venue space when the organizer needs the main program area without booking the complete Full Hall package.',
        capacity: 'Up to 2,000 pax',
        rates: {
            whole_day: 60000,
            half_day: 35000,
            additional_hour: 5000,
        },
        includes: ['Main Hall access'],
        amenities: [
            'Formal event layout',
            'Large audience setup',
            'Program-ready space',
        ],
        idealFor: ['Seminars', 'Conferences', 'Ceremonies'],
        guidelines: ['Charged individually unless Full Hall is selected.'],
        searchNames: ['MAIN HALL', 'MAINHALL', 'MAIN-HALL', 'HALL'],
    },
    {
        key: 'LED_WALL',
        label: 'LED WALL',
        displayLabel: 'LED Wall',
        subtitle: 'Premium display support',
        category: 'individual',
        image: '/marketing/images/hero/noon2.jpg',
        description:
            'Digital display support for presentations, program visuals, branding, and stage media.',
        longDescription:
            'LED Wall is selected when the event needs high-impact digital display support for presentations, branding, and visuals.',
        capacity: 'Display support',
        rates: {
            whole_day: 30000,
            half_day: 15000,
            additional_hour: 3500,
        },
        includes: ['LED Wall use'],
        amenities: [
            'Presentation display',
            'Stage visuals',
            'Branding support',
        ],
        idealFor: ['Presentations', 'Launches', 'Awarding programs'],
        guidelines: ['Technical setup must be coordinated with BCCC.'],
        searchNames: ['LED WALL', 'LEDWALL', 'LED-WALL', 'LED'],
    },
    {
        key: 'VIP_LOUNGE',
        label: 'VIP LOUNGE',
        displayLabel: 'VIP Lounge',
        subtitle: 'Executive holding area',
        category: 'individual',
        image: '/marketing/images/facilities/darkvip.JPG',
        description:
            'Executive support area for dignitaries, speakers, guests of honor, and protocol preparation.',
        longDescription:
            'VIP Lounge is a private support area for important guests, speakers, dignitaries, and protocol-sensitive activities.',
        capacity: 'Executive guest area',
        rates: {
            whole_day: 6000,
            half_day: 3500,
            additional_hour: 500,
        },
        includes: ['VIP Lounge access'],
        amenities: [
            'Private waiting area',
            'Executive support',
            'Protocol support',
        ],
        idealFor: ['VIP guests', 'Speakers', 'Protocol'],
        guidelines: ['Only authorized guests should access the VIP Lounge.'],
        searchNames: ['VIP LOUNGE', 'VIP', 'LOUNGE', 'VIP HOLDING'],
    },
    {
        key: 'BOARD_ROOM',
        label: 'BOARD ROOM',
        displayLabel: 'Board Room',
        subtitle: 'Private meeting space',
        category: 'individual',
        image: '/marketing/images/events/4.jpg',
        description:
            'Private room for briefings, planning sessions, committees, and focused meetings.',
        longDescription:
            'Board Room is intended for smaller formal meetings and planning sessions that require a private discussion space.',
        capacity: 'Small meeting setup',
        rates: {
            whole_day: 6000,
            half_day: 3500,
            additional_hour: 500,
        },
        includes: ['Board Room access'],
        amenities: [
            'Private meeting layout',
            'Briefing-ready room',
            'Executive table setup',
        ],
        idealFor: ['Meetings', 'Briefings', 'Planning'],
        guidelines: ['Charged individually unless Full Hall is selected.'],
        searchNames: [
            'BOARD ROOM',
            'BOARDROOM',
            'MEETING ROOM',
            'CONFERENCE ROOM',
        ],
    },
];

export function catalogItemMatchesService(
    item: BookingVenueCatalogItem,
    value?: string | null,
): boolean {
    const candidate = String(value || '')
        .trim()
        .toUpperCase()
        .replace(/&/g, ' AND ')
        .replace(/[^A-Z0-9]+/g, ' ')
        .trim();

    if (!candidate) return false;

    return item.searchNames.some((name) => {
        const normalized = name
            .trim()
            .toUpperCase()
            .replace(/&/g, ' AND ')
            .replace(/[^A-Z0-9]+/g, ' ')
            .trim();

        return candidate.includes(normalized) || normalized.includes(candidate);
    });
}

export function estimateVenueCharge(
    item: BookingVenueCatalogItem | null | undefined,
    usage: BookingUsageKey,
    durationHours = 1,
): number {
    if (!item) return 0;

    if (usage === 'additional_hour') {
        return (
            item.rates.additional_hour * Math.max(Number(durationHours || 1), 1)
        );
    }

    return item.rates[usage] ?? 0;
}

export function estimateSelectedVenueCharge(
    items: BookingVenueCatalogItem[],
    usage: BookingUsageKey,
    durationHours = 1,
): number {
    if (items.some((item) => item.key === 'FULL_HALL')) {
        return estimateVenueCharge(
            items.find((item) => item.key === 'FULL_HALL'),
            usage,
            durationHours,
        );
    }

    return items.reduce(
        (total, item) =>
            total + estimateVenueCharge(item, usage, durationHours),
        0,
    );
}

export function isIncludedByFullHall(key: BookingVenueKey): boolean {
    return FULL_HALL_INCLUDED_KEYS.includes(key);
}

export function packageDisplayItems<T extends BookingVenueCatalogItem>(
    items: T[],
): T[] {
    if (!items.some((item) => item.key === 'FULL_HALL')) {
        return items;
    }

    const byKey = new Map(items.map((item) => [item.key, item]));
    const fullHall = byKey.get('FULL_HALL');
    const catalogIncluded = BOOKING_VENUE_CATALOG.filter((item) =>
        isIncludedByFullHall(item.key),
    );

    return [
        ...(fullHall ? [fullHall] : []),
        ...catalogIncluded.map(
            (catalogItem) => byKey.get(catalogItem.key) ?? (catalogItem as T),
        ),
    ];
}
