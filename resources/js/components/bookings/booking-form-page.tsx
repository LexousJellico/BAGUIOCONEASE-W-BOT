import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import {
    bookingBasePath,
    bookingShowPath,
    normalizeWorkspaceRole,
} from '@/lib/booking-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Eye,
    LoaderCircle,
    PackageCheck,
    ReceiptText,
    ScrollText,
    ShieldCheck,
    UserRound,
    X,
} from 'lucide-react';
import {
    type FormEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

type ServiceOption = {
    id: number | string;
    name: string;
    price?: number | string | null;
    description?: string | null;
    service_type_id?: number | string | null;
    service_type_name?: string | null;
    service_type?: {
        id?: number | string;
        name?: string | null;
    } | null;
};

type ServiceTypeOption = {
    id: number | string;
    name: string;
    services?: ServiceOption[];
};

type PaginatedLike<T> = {
    data?: T[];
};

type SelectOption = {
    value: string | number | boolean;
    label: string;
    charge?: number | string | null;
    charge_label?: string | null;
};

type VenuePackageOption = {
    code: string;
    name?: string | null;
    label?: string | null;
    subtitle?: string | null;
    description?: string | null;
    area_keys?: string[] | null;
    area_labels?: string[] | null;
    image_path?: string | null;
    is_public?: boolean | number | null;
    is_featured?: boolean | number | null;
    sort_order?: number | null;
    notice?: string | null;
    capacity_min?: number | string | null;
    capacity_max?: number | string | null;
};

type BookingFormOptions = {
    venuePackages?: VenuePackageOption[];
    mice?: {
        classificationOptions?: SelectOption[];
        typeOptions?: SelectOption[];
        privateEventOptions?: SelectOption[];
    };
};

type InitialSchedule = {
    date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
    from?: string | null;
    to?: string | null;
};

type BookingRecord = {
    id?: number | string | null;
    service_id?: number | string | null;
    service?: { id?: number | string | null; name?: string | null } | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
    selected_package_code?: string | null;
    selected_area_keys?: string[] | null;
    mice_required?: boolean | number | null;
    private_event_type?: string | null;
    organization_type?: string | null;
    company_name?: string | null;
    client_name?: string | null;
    client_contact_number?: string | null;
    client_email?: string | null;
    client_address?: string | null;
    client_region?: string | null;
    client_province?: string | null;
    client_city_municipality?: string | null;
    client_barangay?: string | null;
    client_zip_code?: string | null;
    client_street_address?: string | null;
    head_of_organization?: string | null;
    type_of_event?: string | null;
    number_of_guests?: number | string | null;
    booking_status?: string | null;
    payment_status?: string | null;
    is_public_calendar_visible?: boolean | number | null;
    public_calendar_title?: string | null;
    payment_meta?: Record<string, unknown> | null;
    schedule_meta?: Record<string, unknown> | null;
    [key: string]: unknown;
};

type BookingFormPageProps = {
    workspaceRole?: string;
    booking?: BookingRecord;
    serviceTypes?: ServiceTypeOption[] | PaginatedLike<ServiceTypeOption>;
    services?: ServiceOption[] | PaginatedLike<ServiceOption>;
    venuePackages?: VenuePackageOption[];
    bookingFormOptions?: BookingFormOptions;
    initialSchedule?: InitialSchedule;
    initialPackageCode?: string | null;
    initialAreaKeys?: string[] | null;
    initialVenue?: string | null;
    initialEventType?: string | null;
    initialGuests?: number | string | null;
    latestDraft?: BookingDraftRecord | null;
};

type BookingFormItem = {
    service_id: string;
    quantity: number;
};

type ActiveVenueKey =
    | 'FULL_HALL'
    | 'MAIN_HALL'
    | 'LED_WALL'
    | 'LOUNGE'
    | 'BOARDROOM';
type ScheduleBlock = 'am' | 'pm' | 'whole_day';
type EventScope = 'public' | 'private';
type PackageMode = 'packages' | 'manual';

type ActiveVenue = {
    key: ActiveVenueKey;
    number: string;
    label: string;
    officialLabel: string;
    shortLabel: string;
    description: string;
    image: string;
    inclusions: string[];
    rates: {
        wholeDay: number;
        halfDay: number;
        extraHour: number;
    };
    matchers: string[];
    capacityMax: number;
};

type ActivePackage = {
    code: string;
    label: string;
    subtitle: string;
    areaKeys: ActiveVenueKey[];
    image: string;
    featured?: boolean;
    notice?: string | null;
    capacityMin?: number | null;
    capacityMax?: number | null;
};

type ScheduleSelection = {
    date: string;
    block: ScheduleBlock;
    additionalHours: number;
};

type AvailabilityBlockKey = 'AM' | 'PM' | 'EVE';

type AvailabilityApiBlock = {
    key?: string | null;
    label?: string | null;
    from?: string | null;
    to?: string | null;
    is_available?: boolean | null;
    isAvailable?: boolean | null;
    booked?: boolean | null;
    blocked?: boolean | null;
    reason?: string | null;
};

type AvailabilityApiDay = {
    date?: string | null;
    status?: string | null;
    title?: string | null;
    note?: string | null;
    description?: string | null;
    can_proceed?: boolean | null;
    is_fully_booked?: boolean | null;
    isFullyBooked?: boolean | null;
    blocks?:
        | AvailabilityApiBlock[]
        | Record<string, AvailabilityApiBlock | boolean>
        | null;
};

type AvailabilityBlockState = {
    key: AvailabilityBlockKey;
    label: string;
    from: string;
    to: string;
    available: boolean | null;
    reason: string | null;
};

type DayAvailabilitySummary = {
    date: string;
    status: string;
    title: string;
    note: string;
    canProceed: boolean | null;
    am: AvailabilityBlockState;
    pm: AvailabilityBlockState;
    eve: AvailabilityBlockState;
    sourceCount: number;
};

type CalendarAvailabilityMap = Record<string, DayAvailabilitySummary>;

type ReviewLineItem = {
    key: string;
    date: string;
    label: string;
    detail: string;
    quantity: number;
    unitAmount: number;
    amount: number;
    type: 'venue' | 'additional_hour' | 'dressing_room';
};

type DiscountLine = {
    key: string;
    label: string;
    basis: number;
    rate: number;
    amount: number;
    note: string;
};

type BookingMetaPrimitive =
    | string
    | number
    | boolean
    | null
    | undefined
    | Date
    | Blob;

type BookingMetaFlatArray = BookingMetaPrimitive[];

type BookingMetaRecord = Record<
    string,
    BookingMetaPrimitive | BookingMetaFlatArray
>;

type BookingMetaValue =
    | BookingMetaPrimitive
    | BookingMetaFlatArray
    | BookingMetaRecord
    | BookingMetaRecord[]
    | ScheduleSelection[]
    | DiscountLine[];

type BookingPaymentMeta = Record<string, BookingMetaValue>;

type BookingFormData = {
    booking_draft_key?: string;
    draft_key?: string;
    computation_stage?: string;
    show_discounts?: boolean;
    service_id: string;
    items: BookingFormItem[];
    payment_meta: BookingPaymentMeta;
    mice_payload?: BookingPaymentMeta;
    selected_package_code: string;
    selected_area_keys: ActiveVenueKey[];
    schedule_version: string;
    schedule_meta: BookingPaymentMeta;
    schedule_segments: Array<{
        date: string;
        segment_role: 'event' | 'ingress' | 'egress';
        base_block: ScheduleBlock;
        additional_hours: number;
        area_keys: ActiveVenueKey[];
    }>;
    mice_required: boolean;
    mice_exemption_reason: string;
    private_event_type: string;
    organization_type: string;
    company_name: string;
    client_name: string;
    client_contact_number: string;
    client_email: string;
    client_address: string;
    client_region: string;
    client_province: string;
    client_city_municipality: string;
    client_barangay: string;
    client_zip_code: string;
    client_street_address: string;
    head_of_organization: string;
    type_of_event: string;
    booking_date_from: string;
    booking_date_to: string;
    number_of_guests: string;
    booking_status: string;
    payment_status: string;
    is_public_calendar_visible: boolean;
    public_calendar_title: string;
    policy_acknowledged: boolean;
    accuracy_acknowledged: boolean;
    estimated_usage: string;
    estimated_duration_hours: string;
    estimated_other_rentals: string;
    estimated_additional_charges: string;
    dressing_room_selection?: string;
    dressing_room_charge?: string | number;
    reservation_notes: string;
    event_nature: EventScope;
    event_scope: string;
    event_center_name: string;
    covered_month: string;
    classification_of_event: string;
    classification_other: string;
    mice_type_of_event: string;
    mice_type_other: string;
    function_halls_count: string;
    function_hall_capacity: string;
    number_of_hours: string;
    foreign_attendees: string;
    domestic_attendees: string;
    total_number_of_countries: string;
    countries_breakdown_text: string;
    has_exhibitions: string;
    exhibitors_count: string;
    visitors_count: string;
    comments_feedback: string;
    enterprise_group: string;
    btc_group_code: string;
    event_category: string;
    local_male_participants: string;
    local_female_participants: string;
    domestic_male_participants: string;
    domestic_female_participants: string;
    foreign_male_participants: string;
    foreign_female_participants: string;
    main_origin_country: string;
    main_origin_province: string;
    main_origin_city: string;
    same_day_visitors: string;
    overnight_visitors: string;
    estimated_room_nights: string;
    estimated_tourism_receipts: string;
    total_employees: string;
    female_employees: string;
    male_employees: string;
    permit_to_engage: string;
    dot_accredited: string;
    active_member: string;
    remarks: string;
};

const BOOKING_FORM_STRING_FIELDS = [
    'booking_draft_key',
    'draft_key',
    'computation_stage',
    'service_id',
    'selected_package_code',
    'schedule_version',
    'mice_exemption_reason',
    'private_event_type',
    'organization_type',
    'company_name',
    'client_name',
    'client_contact_number',
    'client_email',
    'client_address',
    'client_region',
    'client_province',
    'client_city_municipality',
    'client_barangay',
    'client_zip_code',
    'client_street_address',
    'head_of_organization',
    'type_of_event',
    'booking_date_from',
    'booking_date_to',
    'number_of_guests',
    'booking_status',
    'payment_status',
    'public_calendar_title',
    'estimated_usage',
    'estimated_duration_hours',
    'estimated_other_rentals',
    'estimated_additional_charges',
    'reservation_notes',
    'event_scope',
    'event_center_name',
    'covered_month',
    'classification_of_event',
    'classification_other',
    'mice_type_of_event',
    'mice_type_other',
    'function_halls_count',
    'function_hall_capacity',
    'number_of_hours',
    'foreign_attendees',
    'domestic_attendees',
    'total_number_of_countries',
    'countries_breakdown_text',
    'has_exhibitions',
    'exhibitors_count',
    'visitors_count',
    'comments_feedback',
    'enterprise_group',
    'btc_group_code',
    'event_category',
    'local_male_participants',
    'local_female_participants',
    'domestic_male_participants',
    'domestic_female_participants',
    'foreign_male_participants',
    'foreign_female_participants',
    'main_origin_country',
    'main_origin_province',
    'main_origin_city',
    'same_day_visitors',
    'overnight_visitors',
    'estimated_room_nights',
    'estimated_tourism_receipts',
    'total_employees',
    'female_employees',
    'male_employees',
    'permit_to_engage',
    'dot_accredited',
    'active_member',
    'remarks',
] satisfies Array<keyof BookingFormData>;

const BOOKING_FORM_BOOLEAN_FIELDS = [
    'mice_required',
    'is_public_calendar_visible',
    'policy_acknowledged',
    'accuracy_acknowledged',
    'show_discounts',
] satisfies Array<keyof BookingFormData>;

type BookingDraftPayload = {
    data?: Partial<BookingFormData>;
    scheduleSelections?: ScheduleSelection[];
    selectedAreaKeys?: string[];
    selectedPackageCode?: string;
    packageMode?: PackageMode;
    ingressPrep?: boolean;
    calendarCursor?: string;
    rangeAnchor?: string | null;
    activeStep?: number;
};

type BookingDraftRecord = {
    id?: number | string;
    draft_key?: string | null;
    status?: string | null;
    workspace_role?: string | null;
    current_step?: number | null;
    payload?: BookingDraftPayload | Record<string, unknown> | null;
    last_touched_at?: string | null;
};

type InertiaVisitMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type LeavePromptState = {
    url: string;
    method: InertiaVisitMethod;
    saving: boolean;
};

type StepDefinition = {
    key: 'schedule' | 'services' | 'contact' | 'review' | 'submitted';
    label: string;
    helper: string;
    icon: typeof CalendarDays;
};

const ACTIVE_VENUES: ActiveVenue[] = [
    {
        key: 'FULL_HALL',
        number: '01',
        label: 'FULL HALL',
        officialLabel: 'Full Hall',
        shortLabel: 'Full Hall',
        description:
            'Primary full venue reservation. The lobby is included and is not charged as a separate booking item.',
        image: '/marketing/images/facilities/darkmain.JPG',
        inclusions: [
            'Includes lobby access',
            'Whole hall event setup',
            'Best for major public and institutional events',
        ],
        rates: { wholeDay: 80000, halfDay: 45000, extraHour: 5000 },
        matchers: ['full hall', 'whole hall'],
        capacityMax: 2000,
    },
    {
        key: 'MAIN_HALL',
        number: '02',
        label: 'MAIN HALL',
        officialLabel: 'Ground Hall',
        shortLabel: 'Main Hall',
        description:
            'Main event hall for conferences, ceremonies, exhibits, and public gatherings.',
        image: '/marketing/images/facilities/darkmain.JPG',
        inclusions: [
            'Main event floor',
            'Government/MICE-ready layout',
            'Manual combination ready',
        ],
        rates: { wholeDay: 60000, halfDay: 35000, extraHour: 5000 },
        matchers: ['main hall', 'ground hall'],
        capacityMax: 2000,
    },
    {
        key: 'LED_WALL',
        number: '03',
        label: 'LED WALL',
        officialLabel: 'LED Video Wall',
        shortLabel: 'LED Wall',
        description:
            'Visual display add-on for programs, ceremonies, presentations, and production-led events.',
        image: '/marketing/images/facilities/ledwall.jpg',
        inclusions: [
            'Standalone active choice',
            'Can be combined with venue areas',
            'Charged by booking duration',
        ],
        rates: { wholeDay: 30000, halfDay: 15000, extraHour: 3500 },
        matchers: ['led wall', 'video wall', 'led video wall'],
        capacityMax: 2000,
    },
    {
        key: 'LOUNGE',
        number: '04',
        label: 'LOUNGE',
        officialLabel: 'Executive Lounge',
        shortLabel: 'Lounge',
        description:
            'Compact executive space for holding, coordination, small meetings, or VIP support.',
        image: '/marketing/images/facilities/darkvip.JPG',
        inclusions: [
            'VIP support room',
            'Small meeting format',
            'Can combine with hall selections',
        ],
        rates: { wholeDay: 6000, halfDay: 3500, extraHour: 500 },
        matchers: ['lounge', 'vip lounge', 'executive lounge', 'vip room'],
        capacityMax: 100,
    },
    {
        key: 'BOARDROOM',
        number: '05',
        label: 'BOARDROOM',
        officialLabel: 'Executive Boardroom',
        shortLabel: 'Boardroom',
        description:
            'Boardroom setup for executive meetings, planning sessions, and organizer coordination.',
        image: '/marketing/images/facilities/boardroom.jpg',
        inclusions: [
            'Boardroom setup',
            'Meeting support space',
            'Can combine with Main Hall',
        ],
        rates: { wholeDay: 6000, halfDay: 3500, extraHour: 500 },
        matchers: ['boardroom', 'board room', 'executive boardroom'],
        capacityMax: 80,
    },
];

const FALLBACK_PACKAGES: ActivePackage[] = [
    {
        code: 'GRAND_CONVENTION_PACKAGE',
        label: 'Grand Convention Package',
        subtitle: 'Full Hall flagship convention setup',
        areaKeys: ['FULL_HALL', 'LED_WALL', 'LOUNGE', 'BOARDROOM'],
        image: '/marketing/images/events/darkmain.JPG',
        featured: true,
        capacityMin: 801,
        capacityMax: 2000,
        notice: 'FULL HALL maximum capacity is 2,000. Lobby and grounds/parking support are included; Main Hall cannot be added separately because it is already occupied by Full Hall use.',
    },
    {
        code: 'PREMIUM_CONFERENCE_PACKAGE',
        label: 'Premium Conference Package',
        subtitle: 'Main Hall with VIP and display support',
        areaKeys: ['MAIN_HALL', 'LED_WALL', 'LOUNGE', 'BOARDROOM'],
        image: '/marketing/images/hero/noon2.jpg',
        featured: true,
        capacityMin: 301,
        capacityMax: 2000,
        notice: 'MAIN HALL maximum capacity is 2,000 pax for official booking capacity guidance.',
    },
    {
        code: 'CORPORATE_FORUM_PACKAGE',
        label: 'Corporate Forum Package',
        subtitle: 'Main Hall with LED Wall for formal forums',
        areaKeys: ['MAIN_HALL', 'LED_WALL'],
        image: '/marketing/images/events/darkmain.JPG',
        featured: true,
        capacityMin: 101,
        capacityMax: 2000,
        notice: 'MAIN HALL maximum capacity is 2,000 pax for official booking capacity guidance.',
    },
    {
        code: 'CEREMONY_AWARDS_PACKAGE',
        label: 'Ceremony & Awards Package',
        subtitle: 'Formal ceremony layout with VIP support',
        areaKeys: ['MAIN_HALL', 'LOUNGE', 'LED_WALL'],
        image: '/marketing/images/facilities/darkvip.JPG',
        featured: true,
        capacityMin: 101,
        capacityMax: 2000,
        notice: 'MAIN HALL maximum capacity is 2,000 pax for official booking capacity guidance.',
    },
    {
        code: 'TRAINING_WORKSHOP_PACKAGE',
        label: 'Training & Workshop Package',
        subtitle: 'Workshop-ready Main Hall with coordination room',
        areaKeys: ['MAIN_HALL', 'BOARDROOM'],
        image: '/marketing/images/hero/noon2.jpg',
        capacityMin: 50,
        capacityMax: 2000,
        notice: 'MAIN HALL maximum capacity is 2,000 pax for official booking capacity guidance.',
    },
    {
        code: 'EXECUTIVE_MEETING_PACKAGE',
        label: 'Executive Meeting Package',
        subtitle: 'Lounge and Boardroom executive setup',
        areaKeys: ['LOUNGE', 'BOARDROOM'],
        image: '/marketing/images/facilities/boardroom.jpg',
        capacityMin: 1,
        capacityMax: 80,
        notice: 'Designed for compact executive use. Main Hall and Full Hall are not included in this package.',
    },
    {
        code: 'EXHIBIT_TRADE_FAIR_GRAND_PACKAGE',
        label: 'Exhibit & Trade Fair Package - Grand',
        subtitle: 'Full Hall exhibit setup with display support',
        areaKeys: ['FULL_HALL', 'LED_WALL', 'LOUNGE', 'BOARDROOM'],
        image: '/marketing/images/events/darkmain.JPG',
        capacityMin: 801,
        capacityMax: 2000,
        notice: 'FULL HALL maximum capacity is 2,000. Lobby and grounds/parking support are included with Full Hall.',
    },
    {
        code: 'EXHIBIT_TRADE_FAIR_STANDARD_PACKAGE',
        label: 'Exhibit & Trade Fair Package - Standard',
        subtitle: 'Main Hall exhibit and trade-fair setup',
        areaKeys: ['MAIN_HALL', 'LED_WALL'],
        image: '/marketing/images/facilities/ledwall.jpg',
        capacityMin: 50,
        capacityMax: 2000,
        notice: 'MAIN HALL maximum capacity is 2,000 pax for official booking capacity guidance.',
    },
];

const STEPS: StepDefinition[] = [
    {
        key: 'schedule',
        label: 'Schedule',
        helper: 'Select dates and time blocks',
        icon: CalendarDays,
    },
    {
        key: 'services',
        label: 'Package / Services',
        helper: 'Choose active BCCC areas',
        icon: PackageCheck,
    },
    {
        key: 'contact',
        label: 'Contact Details',
        helper: 'Organizer, event, and MICE data',
        icon: UserRound,
    },
    {
        key: 'review',
        label: 'Review',
        helper: 'Final computation and policy',
        icon: ClipboardList,
    },
    {
        key: 'submitted',
        label: 'Submitted',
        helper: 'Reservation request sent',
        icon: CheckCircle2,
    },
];

const CLASSIFICATION_OPTIONS: SelectOption[] = [
    { value: 'INTERNATIONAL', label: 'International' },
    { value: 'REGIONAL ASIA PACIFIC', label: 'Regional Asia Pacific' },
    { value: 'REGIONAL OFFSHORE', label: 'Regional Offshore' },
    { value: 'REGIONAL PHILIPPINES', label: 'Regional Philippines' },
    { value: 'NATIONAL', label: 'National' },
];

const MICE_TYPE_OPTIONS: SelectOption[] = [
    { value: 'MEETINGS', label: 'Meetings' },
    { value: 'INCENTIVE TRAVEL', label: 'Incentive Travel' },
    { value: 'CONVENTIONS', label: 'Conventions' },
    { value: 'EXHIBITS', label: 'Exhibits' },
    {
        value: 'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS',
        label: 'Seminar / Workshop / Symposium / Others',
    },
];

const PRIVATE_EVENT_OPTIONS: SelectOption[] = [
    { value: 'PRIVATE/PERSONAL EVENT', label: 'Private / Personal Event' },
    { value: 'WEDDING', label: 'Wedding' },
    { value: 'BIRTHDAY', label: 'Birthday' },
    { value: 'FAMILY EVENT', label: 'Family Event' },
    { value: 'OTHER PRIVATE EVENT', label: 'Other Private Event' },
];

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const PUBLIC_EVENT_CENTER = 'BAGUIO CONVENTION AND CULTURAL CENTER';
const MAX_ADDITIONAL_HOURS = 5;
const REQUIRED_BOND = 10000;

const BCCC_POLICY_NOTICE = [
    'Reservation requests remain subject to BCCC schedule verification, assessment, and approval.',
    'The date becomes fully reserved only after the required down payment is reviewed and accepted by BCCC.',
    'A refundable/event bond may be required before the event, except when waived for qualified official city activities.',
    'Cancellation has no charge when made at least two weeks before the event. Later cancellations may be charged 20%, 30%, or 75% of the venue fee depending on timing.',
    'Only Full Hall, Main Hall, LED Wall, Lounge, and Boardroom are active charge choices in this booking system.',
    'Lobby access is included with Full Hall and is not charged as a standalone rental item.',
];

const EXCLUDED_USER_CHARGES = [
    'Basement Function Room, Basement Hall - Half, and Whole Basement',
];

const REVIEW_POLICY_SECTIONS = [
    {
        title: 'Reservation and payment',
        body: 'This submission is a reservation request for review. The final reservation depends on BCCC assessment, availability confirmation, and payment compliance. The review computation separates the base venue estimate, hidden eligible discounts, required down payment, bond, and remaining balance.',
    },
    {
        title: 'Active charge scope',
        body: 'The only selectable charge choices are Full Hall, Main Hall, LED Wall, Lounge, and Boardroom. Lobby access is included with Full Hall. Basement spaces, shop rentals, catering maintenance, air conditioning, stationery kit, and ordinance special packages are not user-selectable charges in this flow.',
    },
    {
        title: 'Discount visibility',
        body: 'Discounts are intentionally hidden during schedule and service selection. They appear only on the final review computation and remain subject to BCCC assessment before billing is finalized.',
    },
    {
        title: 'Responsibility and post-event assessment',
        body: 'The organizer is responsible for accurate details, proper conduct, house-rule compliance, and possible post-event assessment for damages, violations, extra use, or unpaid balance. Cancellation is free at least two weeks before the event, 20% later than two weeks, 30% later than one week, and 75% after office hours the day before or on the event day.',
    },
];

type PhilippinesRegionOption = {
    code: string;
    label: string;
    provinces: string[];
};

const PHILIPPINES_ADDRESS_REGIONS: PhilippinesRegionOption[] = [
    {
        code: 'NCR',
        label: 'National Capital Region (NCR)',
        provinces: [
            'NCR - CITY OF MANILA',
            'NCR - SECOND DISTRICT',
            'NCR - THIRD DISTRICT',
            'NCR - FOURTH DISTRICT',
        ],
    },
    {
        code: 'CAR',
        label: 'Cordillera Administrative Region (CAR)',
        provinces: [
            'ABRA',
            'APAYAO',
            'BENGUET',
            'IFUGAO',
            'KALINGA',
            'MOUNTAIN PROVINCE',
        ],
    },
    {
        code: 'REGION I',
        label: 'Region I (Ilocos Region)',
        provinces: ['ILOCOS NORTE', 'ILOCOS SUR', 'LA UNION', 'PANGASINAN'],
    },
    {
        code: 'REGION II',
        label: 'Region II (Cagayan Valley)',
        provinces: [
            'BATANES',
            'CAGAYAN',
            'ISABELA',
            'NUEVA VIZCAYA',
            'QUIRINO',
        ],
    },
    {
        code: 'REGION III',
        label: 'Region III (Central Luzon)',
        provinces: [
            'AURORA',
            'BATAAN',
            'BULACAN',
            'NUEVA ECIJA',
            'PAMPANGA',
            'TARLAC',
            'ZAMBALES',
        ],
    },
    {
        code: 'REGION IV-A',
        label: 'Region IV-A (CALABARZON)',
        provinces: ['BATANGAS', 'CAVITE', 'LAGUNA', 'QUEZON', 'RIZAL'],
    },
    {
        code: 'MIMAROPA',
        label: 'MIMAROPA Region',
        provinces: [
            'MARINDUQUE',
            'OCCIDENTAL MINDORO',
            'ORIENTAL MINDORO',
            'PALAWAN',
            'ROMBLON',
        ],
    },
    {
        code: 'REGION V',
        label: 'Region V (Bicol Region)',
        provinces: [
            'ALBAY',
            'CAMARINES NORTE',
            'CAMARINES SUR',
            'CATANDUANES',
            'MASBATE',
            'SORSOGON',
        ],
    },
    {
        code: 'REGION VI',
        label: 'Region VI (Western Visayas)',
        provinces: [
            'AKLAN',
            'ANTIQUE',
            'CAPIZ',
            'GUIMARAS',
            'ILOILO',
            'NEGROS OCCIDENTAL',
        ],
    },
    {
        code: 'NIR',
        label: 'Negros Island Region (NIR)',
        provinces: ['NEGROS OCCIDENTAL', 'NEGROS ORIENTAL', 'SIQUIJOR'],
    },
    {
        code: 'REGION VII',
        label: 'Region VII (Central Visayas)',
        provinces: ['BOHOL', 'CEBU'],
    },
    {
        code: 'REGION VIII',
        label: 'Region VIII (Eastern Visayas)',
        provinces: [
            'BILIRAN',
            'EASTERN SAMAR',
            'LEYTE',
            'NORTHERN SAMAR',
            'SAMAR',
            'SOUTHERN LEYTE',
        ],
    },
    {
        code: 'REGION IX',
        label: 'Region IX (Zamboanga Peninsula)',
        provinces: [
            'ZAMBOANGA DEL NORTE',
            'ZAMBOANGA DEL SUR',
            'ZAMBOANGA SIBUGAY',
        ],
    },
    {
        code: 'REGION X',
        label: 'Region X (Northern Mindanao)',
        provinces: [
            'BUKIDNON',
            'CAMIGUIN',
            'LANAO DEL NORTE',
            'MISAMIS OCCIDENTAL',
            'MISAMIS ORIENTAL',
        ],
    },
    {
        code: 'REGION XI',
        label: 'Region XI (Davao Region)',
        provinces: [
            'DAVAO DE ORO',
            'DAVAO DEL NORTE',
            'DAVAO DEL SUR',
            'DAVAO OCCIDENTAL',
            'DAVAO ORIENTAL',
        ],
    },
    {
        code: 'REGION XII',
        label: 'Region XII (SOCCSKSARGEN)',
        provinces: [
            'COTABATO',
            'SARANGANI',
            'SOUTH COTABATO',
            'SULTAN KUDARAT',
        ],
    },
    {
        code: 'REGION XIII',
        label: 'Region XIII (Caraga)',
        provinces: [
            'AGUSAN DEL NORTE',
            'AGUSAN DEL SUR',
            'DINAGAT ISLANDS',
            'SURIGAO DEL NORTE',
            'SURIGAO DEL SUR',
        ],
    },
    {
        code: 'BARMM',
        label: 'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)',
        provinces: [
            'BASILAN',
            'LANAO DEL SUR',
            'MAGUINDANAO DEL NORTE',
            'MAGUINDANAO DEL SUR',
            'SULU',
            'TAWI-TAWI',
        ],
    },
];

const COMMON_CITY_MUNICIPALITY_OPTIONS: Record<string, string[]> = {
    BENGUET: [
        'BAGUIO CITY',
        'LA TRINIDAD',
        'ITOGON',
        'SABLAN',
        'TUBA',
        'TUBLAY',
        'ATOK',
        'BAKUN',
        'BOKOD',
        'BUGUIAS',
        'KABAYAN',
        'KAPANGAN',
        'KIBUNGAN',
        'MANKAYAN',
    ],
    ABRA: [
        'BANGUED',
        'BOLINEY',
        'BUCAY',
        'BUCLOC',
        'DAGUIOMAN',
        'DANGLAS',
        'DOLORES',
        'LA PAZ',
        'LACUB',
        'LAGANGILANG',
        'LAGAYAN',
        'LANGIDEN',
        'LICUAN-BAAY',
        'LUBA',
        'MALIBCONG',
        'MANABO',
        'PEÑARRUBIA',
        'PIDIGAN',
        'PILAR',
        'SALLAPADAN',
        'SAN ISIDRO',
        'SAN JUAN',
        'SAN QUINTIN',
        'TAYUM',
        'TINEG',
        'TUBO',
        'VILLAVICIOSA',
    ],
    APAYAO: [
        'CALANASAN',
        'CONNER',
        'FLORA',
        'KABUGAO',
        'LUNA',
        'PUDTOL',
        'SANTA MARCELA',
    ],
    IFUGAO: [
        'AGUINALDO',
        'ALFONSO LISTA',
        'ASIPULO',
        'BANAUE',
        'HINGYON',
        'HUNGDUAN',
        'KIANGAN',
        'LAGAWE',
        'LAMUT',
        'MAYOYAO',
        'TINOC',
    ],
    KALINGA: [
        'TABUK CITY',
        'BALBALAN',
        'LUBUAGAN',
        'PASIL',
        'PINUKPUK',
        'RIZAL',
        'TANUDAN',
        'TINGLAYAN',
    ],
    'MOUNTAIN PROVINCE': [
        'BONTOC',
        'BARLIG',
        'BAUKO',
        'BESAO',
        'NATONIN',
        'PARACELIS',
        'SABANGAN',
        'SADANGA',
        'SAGADA',
        'TADIAN',
    ],
    'NCR - CITY OF MANILA': ['CITY OF MANILA'],
    'NCR - SECOND DISTRICT': [
        'MANDALUYONG CITY',
        'MARIKINA CITY',
        'PASIG CITY',
        'QUEZON CITY',
        'SAN JUAN CITY',
    ],
    'NCR - THIRD DISTRICT': [
        'CALOOCAN CITY',
        'MALABON CITY',
        'NAVOTAS CITY',
        'VALENZUELA CITY',
    ],
    'NCR - FOURTH DISTRICT': [
        'LAS PIÑAS CITY',
        'MAKATI CITY',
        'MUNTINLUPA CITY',
        'PARAÑAQUE CITY',
        'PASAY CITY',
        'PATEROS',
        'TAGUIG CITY',
    ],
};

const PHILIPPINES_CITY_ZIP_CODES: Record<string, string> = {
    'BAGUIO CITY': '2600',
    BAGUIO: '2600',
    'LA TRINIDAD': '2601',
    ITOGON: '2604',
    SABLAN: '2614',
    TUBA: '2603',
    TUBLAY: '2615',
    ATOK: '2612',
    BAKUN: '2610',
    BOKOD: '2605',
    BUGUIAS: '2607',
    KABAYAN: '2606',
    KAPANGAN: '2613',
    KIBUNGAN: '2611',
    MANKAYAN: '2608',
    BANGUED: '2800',
    BOLINEY: '2815',
    BUCAY: '2805',
    BUCLOC: '2817',
    DAGUIOMAN: '2816',
    DANGLAS: '2825',
    DOLORES: '2801',
    'LA PAZ': '2826',
    LACUB: '2821',
    LAGANGILANG: '2802',
    LAGAYAN: '2824',
    LANGIDEN: '2807',
    'LICUAN-BAAY': '2819',
    LUBA: '2813',
    MALIBCONG: '2820',
    MANABO: '2810',
    PENARRUBIA: '2804',
    PIDIGAN: '2806',
    PILAR: '2812',
    SALLAPADAN: '2818',
    'SAN ISIDRO': '2809',
    'SAN JUAN': '2823',
    'SAN QUINTIN': '2808',
    TAYUM: '2803',
    TINEG: '2822',
    TUBO: '2814',
    VILLAVICIOSA: '2811',
    CALANASAN: '3814',
    CONNER: '3807',
    FLORA: '3810',
    KABUGAO: '3809',
    LUNA: '3813',
    PUDTOL: '3812',
    'SANTA MARCELA': '3811',
    AGUINALDO: '3606',
    'ALFONSO LISTA': '3608',
    ASIPULO: '3610',
    BANAUE: '3601',
    HINGYON: '3607',
    HUNGDUAN: '3603',
    KIANGAN: '3604',
    LAGAWE: '3600',
    LAMUT: '3605',
    MAYOYAO: '3602',
    TINOC: '3609',
    'TABUK CITY': '3800',
    TABUK: '3800',
    BALBALAN: '3801',
    LUBUAGAN: '3802',
    PASIL: '3803',
    PINUKPUK: '3806',
    RIZAL: '3808',
    TANUDAN: '3805',
    TINGLAYAN: '3804',
    BONTOC: '2616',
    BARLIG: '2623',
    BAUKO: '2621',
    BESAO: '2618',
    NATONIN: '2624',
    PARACELIS: '2625',
    SABANGAN: '2622',
    SADANGA: '2617',
    SAGADA: '2619',
    TADIAN: '2620',
    'CITY OF MANILA': '1000',
    MANILA: '1000',
    'MANDALUYONG CITY': '1550',
    MANDALUYONG: '1550',
    'MARIKINA CITY': '1800',
    MARIKINA: '1800',
    'PASIG CITY': '1600',
    PASIG: '1600',
    'QUEZON CITY': '1100',
    QUEZON: '1100',
    'SAN JUAN CITY': '1500',
    'CALOOCAN CITY': '1400',
    CALOOCAN: '1400',
    'MALABON CITY': '1470',
    MALABON: '1470',
    'NAVOTAS CITY': '1485',
    NAVOTAS: '1485',
    'VALENZUELA CITY': '1440',
    VALENZUELA: '1440',
    'LAS PINAS CITY': '1740',
    'LAS PINAS': '1740',
    'MAKATI CITY': '1200',
    MAKATI: '1200',
    'MUNTINLUPA CITY': '1770',
    MUNTINLUPA: '1770',
    'PARANAQUE CITY': '1700',
    PARANAQUE: '1700',
    'PASAY CITY': '1300',
    PASAY: '1300',
    PATEROS: '1620',
    'TAGUIG CITY': '1630',
    TAGUIG: '1630',
};

function provincesForRegion(regionCode: string): string[] {
    return (
        PHILIPPINES_ADDRESS_REGIONS.find((region) => region.code === regionCode)
            ?.provinces ?? []
    );
}

function citiesForProvince(province: string): string[] {
    return COMMON_CITY_MUNICIPALITY_OPTIONS[upper(province)] ?? [];
}

function zipCodeForCityMunicipality(city: string): string {
    const direct = upper(city)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const withoutCityPrefix = direct.replace(/^CITY OF\s+/, '');
    const withoutCitySuffix = withoutCityPrefix.replace(/\s+CITY$/, '');

    return (
        PHILIPPINES_CITY_ZIP_CODES[direct] ??
        PHILIPPINES_CITY_ZIP_CODES[withoutCityPrefix] ??
        PHILIPPINES_CITY_ZIP_CODES[withoutCitySuffix] ??
        ''
    );
}

function composePhilippinesAddress(
    parts: Partial<
        Pick<
            BookingFormData,
            | 'client_region'
            | 'client_province'
            | 'client_city_municipality'
            | 'client_barangay'
            | 'client_zip_code'
            | 'client_street_address'
        >
    >,
): string {
    return [
        parts.client_street_address,
        parts.client_barangay,
        parts.client_city_municipality,
        parts.client_province,
        parts.client_region,
        'PHILIPPINES',
        parts.client_zip_code,
    ]
        .map((part) => upper(String(part || '').trim()))
        .filter(Boolean)
        .join(', ');
}

function fullMainCombinationError(areaKeys: ActiveVenueKey[]): string | null {
    return areaKeys.includes('FULL_HALL') && areaKeys.includes('MAIN_HALL')
        ? 'Full Hall already includes and occupies the Main Hall. Choose Full Hall with LED Wall, Lounge, or Boardroom, or choose Main Hall without Full Hall.'
        : null;
}

function isEveOnlyAvailability(
    availability: DayAvailabilitySummary | undefined,
): boolean {
    if (!availability) return false;

    return (
        availability.am.available === false &&
        availability.pm.available === false &&
        availability.eve.available !== false
    );
}

function selectionAvailabilityProblem(
    selection: ScheduleSelection,
    availability: DayAvailabilitySummary | undefined,
): string | null {
    if (!availability || availability.canProceed === null) return null;

    if (
        availability.canProceed === false ||
        isEveOnlyAvailability(availability)
    ) {
        return `${displayDate(selection.date)} is not available for a new reservation. EVE is for approved additional hours only and cannot be booked alone.`;
    }

    const needed: AvailabilityBlockState[] =
        selection.block === 'whole_day'
            ? [availability.am, availability.pm]
            : selection.block === 'am'
              ? [availability.am]
              : [availability.pm];

    if (selection.additionalHours > 0) {
        needed.push(availability.eve);
    }

    const closed = needed.find((block) => block.available === false);

    return closed
        ? `${displayDate(selection.date)} ${closed.label} is not available. ${closed.reason || 'Please choose another time block.'}`
        : null;
}

function defaultBlockForAvailability(
    availability: DayAvailabilitySummary | undefined,
): ScheduleBlock | null {
    if (
        !availability ||
        availability.canProceed === false ||
        availability.canProceed === null ||
        isEveOnlyAvailability(availability)
    ) {
        return null;
    }

    if (
        availability.am.available === true &&
        availability.pm.available === true
    ) {
        return 'whole_day';
    }

    if (availability.am.available === true) {
        return 'am';
    }

    if (availability.pm.available === true) {
        return 'pm';
    }

    return null;
}

function isScheduleBlockAvailable(
    availability: DayAvailabilitySummary | undefined,
    block: ScheduleBlock,
): boolean {
    if (!availability || availability.canProceed === false) return false;
    if (isEveOnlyAvailability(availability)) return false;

    if (block === 'am') return availability.am.available === true;
    if (block === 'pm') return availability.pm.available === true;

    return (
        availability.am.available === true && availability.pm.available === true
    );
}

function bookingCalendarTileStatus(
    availability: DayAvailabilitySummary | undefined,
): {
    state: 'checking' | 'available' | 'half' | 'unavailable';
    label: string;
    title: string;
    tileClassName: string;
    badgeClassName: string;
} {
    const neutral = {
        state: 'checking' as const,
        label: 'Checking',
        title: 'Availability is being verified.',
        tileClassName:
            'bg-slate-50 text-slate-500 ring-1 ring-slate-200/80 ring-inset',
        badgeClassName: 'bg-slate-200 text-slate-600',
    };

    if (!availability) return neutral;

    const amOpen = availability.am.available === true;
    const pmOpen = availability.pm.available === true;
    const amKnown = availability.am.available !== null;
    const pmKnown = availability.pm.available !== null;

    if (!amKnown || !pmKnown) {
        return {
            ...neutral,
            title: availability.note || neutral.title,
        };
    }

    if (
        availability.canProceed === false ||
        isEveOnlyAvailability(availability) ||
        (!amOpen && !pmOpen)
    ) {
        return {
            state: 'unavailable',
            label: isEveOnlyAvailability(availability)
                ? 'EVE only'
                : 'Unavailable',
            title:
                availability.note ||
                'This date is unavailable for new reservations.',
            tileClassName:
                'bg-red-50 text-red-900 ring-1 ring-red-200/85 ring-inset',
            badgeClassName: 'bg-red-500 text-white',
        };
    }

    if (amOpen && pmOpen) {
        return {
            state: 'available',
            label: 'Available',
            title: 'AM and PM are available.',
            tileClassName:
                'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/85 ring-inset',
            badgeClassName: 'bg-emerald-500 text-white',
        };
    }

    return {
        state: 'half',
        label: 'Half day',
        title: amOpen ? 'AM is available.' : 'PM is available.',
        tileClassName:
            'bg-amber-50 text-amber-950 ring-1 ring-amber-200/90 ring-inset',
        badgeClassName: 'bg-amber-400 text-amber-950',
    };
}

function defaultSelectionForAvailability(
    date: string,
    availability: DayAvailabilitySummary | undefined,
): ScheduleSelection | null {
    const block = defaultBlockForAvailability(availability);

    return block ? { date, block, additionalHours: 0 } : null;
}

function cx(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(' ');
}

function collection<T>(value?: T[] | PaginatedLike<T>): T[] {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.data)) return value.data;
    return [];
}

function firstValue(...values: unknown[]): string {
    for (const value of values) {
        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ''
        )
            return String(value);
    }
    return '';
}

function stringValue(value: unknown, fallback = ''): string {
    if (value === null || value === undefined) return fallback;

    return String(value);
}

function cleanValue(value: unknown, fallback = ''): string {
    const cleaned = stringValue(value).trim();

    return cleaned || fallback;
}

function digitsOnly(value: unknown): string {
    return stringValue(value).replace(/\D/g, '');
}

function booleanValue(value: unknown, fallback = false): boolean {
    if (value === true || value === 1 || value === '1') return true;
    if (value === false || value === 0 || value === '0') return false;

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();

        if (normalized === 'true' || normalized === 'yes') return true;
        if (normalized === 'false' || normalized === 'no') return false;
    }

    return fallback;
}

function normalizeBookingDraftData(
    draftData: Partial<BookingFormData>,
): Partial<BookingFormData> {
    const normalized: Partial<BookingFormData> = { ...draftData };
    const record = normalized as Record<string, unknown>;

    BOOKING_FORM_STRING_FIELDS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(record, key)) {
            record[key] = stringValue(record[key]);
        }
    });

    BOOKING_FORM_BOOLEAN_FIELDS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(record, key)) {
            record[key] = booleanValue(record[key]);
        }
    });

    if (
        Object.prototype.hasOwnProperty.call(record, 'event_nature') &&
        record.event_nature !== 'private' &&
        record.event_nature !== 'public'
    ) {
        delete record.event_nature;
    }

    if (
        Object.prototype.hasOwnProperty.call(record, 'items') &&
        !Array.isArray(record.items)
    ) {
        delete record.items;
    }

    if (
        Object.prototype.hasOwnProperty.call(record, 'selected_area_keys') &&
        !Array.isArray(record.selected_area_keys)
    ) {
        delete record.selected_area_keys;
    }

    if (
        Object.prototype.hasOwnProperty.call(record, 'schedule_segments') &&
        !Array.isArray(record.schedule_segments)
    ) {
        delete record.schedule_segments;
    }

    ['payment_meta', 'mice_payload', 'schedule_meta'].forEach((key) => {
        const value = record[key];

        if (
            Object.prototype.hasOwnProperty.call(record, key) &&
            (value === null ||
                typeof value !== 'object' ||
                Array.isArray(value))
        ) {
            delete record[key];
        }
    });

    return normalized;
}

function visitMethod(value: unknown): InertiaVisitMethod {
    const method = cleanValue(value, 'get').toLowerCase();

    if (['post', 'put', 'patch', 'delete'].includes(method)) {
        return method as InertiaVisitMethod;
    }

    return 'get';
}

function isLogoutVisit(url: string, method: InertiaVisitMethod): boolean {
    if (method !== 'post') return false;

    try {
        const base =
            typeof window === 'undefined'
                ? 'http://localhost'
                : window.location.origin;
        const parsed = new URL(url, base);
        return parsed.pathname.replace(/\/+$/, '').toLowerCase() === '/logout';
    } catch {
        return url.replace(/\/+$/, '').toLowerCase().endsWith('/logout');
    }
}

function draftExitPromptCopy(url: string, method: InertiaVisitMethod) {
    if (isLogoutVisit(url, method)) {
        return {
            title: 'Save booking draft before logging out?',
            description:
                'This booking is still in progress. Save the latest draft so you can continue later, log out without keeping the draft, or stay on this page.',
            saveLabel: 'Save Draft & Log Out',
            discardLabel: 'Log Out Without Saving',
            stayLabel: 'Keep Editing',
            savingLabel: 'Saving Draft...',
        };
    }

    return {
        title: 'Save booking draft before leaving?',
        description:
            'This booking is still in progress. Save the latest draft so you can continue later, leave without keeping the draft, or stay on this page.',
        saveLabel: 'Save Draft & Leave',
        discardLabel: 'Leave Without Saving',
        stayLabel: 'Keep Editing',
        savingLabel: 'Saving Draft...',
    };
}

function optionValue(value: string | number | boolean): string {
    return String(value);
}

function money(value: number | string | null | undefined): string {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number)) return '₱0.00';
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(number);
}

function normalize(value: string | null | undefined): string {
    return String(value || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function upper(value: unknown): string {
    return stringValue(value).toUpperCase();
}

function dateObjectToInput(date: Date): string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function toDateOnly(value?: string | null): string {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function todayDate(): string {
    return dateObjectToInput(new Date());
}

function csrfToken(): string {
    if (typeof document === 'undefined') return '';
    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

function addDays(date: string, days: number): string {
    const current = new Date(`${date}T00:00:00`);
    current.setDate(current.getDate() + days);
    return dateObjectToInput(current);
}

function compareDate(a: string, b: string): number {
    return a.localeCompare(b);
}

function isPastDate(date: string): boolean {
    return compareDate(date, todayDate()) < 0;
}

function dateRange(start: string, end: string): string[] {
    const from = compareDate(start, end) <= 0 ? start : end;
    const to = compareDate(start, end) <= 0 ? end : start;
    const days: string[] = [];
    let cursor = from;
    while (compareDate(cursor, to) <= 0) {
        days.push(cursor);
        cursor = addDays(cursor, 1);
    }
    return days;
}

function monthStart(date: string): string {
    const parsed = new Date(`${date}T00:00:00`);
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-01`;
}

function shiftMonth(date: string, offset: number): string {
    const parsed = new Date(`${date}T00:00:00`);
    parsed.setMonth(parsed.getMonth() + offset);
    return monthStart(dateObjectToInput(parsed));
}

function monthLabel(date: string): string {
    const parsed = new Date(`${date}T00:00:00`);
    return parsed.toLocaleDateString('en-PH', {
        month: 'long',
        year: 'numeric',
    });
}

function displayDate(date: string): string {
    if (!date) return '—';
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function displayDateTime(date: string): string {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function displayTimeFromInput(time: string): string {
    if (!time) return '—';
    const parsed = new Date(
        `2000-01-01T${time.length === 5 ? `${time}:00` : time}`,
    );
    if (Number.isNaN(parsed.getTime())) return time;
    return parsed.toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

function displaySelectionRange(selection: ScheduleSelection): string {
    return `${displayTimeFromInput(startTime(selection.block))} – ${displayTimeFromInput(endTime(selection.block, selection.additionalHours))}`;
}

function displayDateLong(date: string): string {
    if (!date) return '—';
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString('en-PH', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function displaySelectionDateTimeRange(selection: ScheduleSelection): string {
    return `${displayDateLong(selection.date)}, ${displayTimeFromInput(startTime(selection.block))} - ${displayDateLong(selection.date)}, ${displayTimeFromInput(endTime(selection.block, selection.additionalHours))}`;
}

function displayOverallScheduleDateTimeRange(
    selections: ScheduleSelection[],
): string {
    if (!selections.length) return '—';
    const first = selections[0];
    const last = selections[selections.length - 1];
    return `${displayDateLong(first.date)}, ${displayTimeFromInput(startTime(first.block))} - ${displayDateLong(last.date)}, ${displayTimeFromInput(endTime(last.block, last.additionalHours))}`;
}

function displayAdditionalHoursSummary(
    selections: ScheduleSelection[],
): string {
    const rows = selections
        .filter((selection) => Number(selection.additionalHours || 0) > 0)
        .map(
            (selection) =>
                `${displayDateLong(selection.date)}: ${selection.additionalHours} additional hour(s), ${displayTimeFromInput('18:00')} - ${displayTimeFromInput(endTime(selection.block, selection.additionalHours))}`,
        );

    return rows.length ? rows.join(' • ') : 'No additional / EVE hours';
}

function compactListLabel(items: string[], empty = 'None selected'): string {
    const clean = items.map((item) => item.trim()).filter(Boolean);
    if (!clean.length) return empty;
    if (clean.length <= 2) return clean.join(' + ');
    return `${clean.slice(0, 2).join(' + ')} + ${clean.length - 2} more`;
}

function daysForMonth(
    cursor: string,
): Array<{ date: string; inMonth: boolean }> {
    const first = new Date(`${monthStart(cursor)}T00:00:00`);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const iso = dateObjectToInput(date);
        return { date: iso, inMonth: date.getMonth() === first.getMonth() };
    });
}

function initialDateFromSchedule(
    schedule?: InitialSchedule,
    booking?: BookingRecord,
): string {
    const value = firstValue(
        booking?.booking_date_from,
        schedule?.booking_date_from,
        schedule?.date_from,
        schedule?.from,
        schedule?.date,
    );
    return toDateOnly(value) || addDays(todayDate(), 1);
}

function initialDateToSchedule(
    schedule?: InitialSchedule,
    booking?: BookingRecord,
): string {
    const value = firstValue(
        booking?.booking_date_to,
        schedule?.booking_date_to,
        schedule?.date_to,
        schedule?.to,
        schedule?.date,
    );
    return toDateOnly(value) || initialDateFromSchedule(schedule, booking);
}

function blockLabel(block: ScheduleBlock): string {
    if (block === 'am') return 'AM';
    if (block === 'pm') return 'PM';
    return 'Whole Day';
}

function blockBaseHours(block: ScheduleBlock): number {
    if (block === 'whole_day') return 12;
    return 6;
}

function startTime(block: ScheduleBlock): string {
    if (block === 'pm') return '12:00';
    return '06:00';
}

function endTime(block: ScheduleBlock, additionalHours: number): string {
    const baseEnd = block === 'am' ? 12 : 18;
    const hour = Math.min(
        23,
        baseEnd + Math.max(0, Math.min(MAX_ADDITIONAL_HOURS, additionalHours)),
    );
    return `${String(hour).padStart(2, '0')}:00`;
}

function totalHours(selections: ScheduleSelection[]): number {
    return selections.reduce(
        (sum, row) =>
            sum + blockBaseHours(row.block) + Number(row.additionalHours || 0),
        0,
    );
}

function selectedVenueByKey(key: ActiveVenueKey): ActiveVenue {
    return ACTIVE_VENUES.find((venue) => venue.key === key) ?? ACTIVE_VENUES[0];
}

function selectedCapacityMax(areaKeys: ActiveVenueKey[]): number {
    if (areaKeys.length === 0) return 0;

    if (areaKeys.includes('FULL_HALL') || areaKeys.includes('MAIN_HALL')) {
        return 2000;
    }

    // Without a hall selected, the capacity follows the most restrictive support room.
    return areaKeys.reduce((max, key) => {
        const venue = selectedVenueByKey(key);
        return max === 0 ? venue.capacityMax : Math.min(max, venue.capacityMax);
    }, 0);
}

function selectedCapacityLabel(areaKeys: ActiveVenueKey[]): string {
    const capacity = selectedCapacityMax(areaKeys);
    return capacity > 0
        ? `Up to ${capacity.toLocaleString()} pax`
        : 'Subject to BCCC layout review';
}

function dressingRoomDailyCharge(selection: string | null | undefined): number {
    const key = String(selection ?? 'none');
    if (key === 'dressing_room_1_and_2') return 2000;
    if (key === 'dressing_room_1' || key === 'dressing_room_2') return 1000;
    return 0;
}

function dressingRoomCharge(
    selection: string | null | undefined,
    dayCount = 1,
): number {
    return dressingRoomDailyCharge(selection) * Math.max(0, dayCount);
}

function dressingRoomLabel(selection: string | null | undefined): string {
    const key = String(selection ?? 'none');
    if (key === 'dressing_room_1_and_2') return 'Dressing Room 1 & 2';
    if (key === 'dressing_room_1') return 'Dressing Room 1';
    if (key === 'dressing_room_2') return 'Dressing Room 2';
    return 'No dressing room';
}

function rateForBlock(venue: ActiveVenue, block: ScheduleBlock): number {
    return block === 'whole_day' ? venue.rates.wholeDay : venue.rates.halfDay;
}

function isGovernmentOrganizationType(
    value: string | null | undefined,
): boolean {
    const normalized = String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    return [
        'government',
        'govt',
        'government_agency',
        'government_office',
        'public',
    ].includes(normalized);
}

function dateVenueBaseBlockTotal(
    selection: ScheduleSelection,
    areaKeys: ActiveVenueKey[],
): number {
    return areaKeys.reduce((sum, key) => {
        const venue = selectedVenueByKey(key);
        return sum + rateForBlock(venue, selection.block);
    }, 0);
}

function dateVenueBaseTotal(
    selection: ScheduleSelection,
    areaKeys: ActiveVenueKey[],
): number {
    return areaKeys.reduce((sum, key) => {
        const venue = selectedVenueByKey(key);
        return (
            sum +
            rateForBlock(venue, selection.block) +
            venue.rates.extraHour * Number(selection.additionalHours || 0)
        );
    }, 0);
}

function baseTotal(
    selections: ScheduleSelection[],
    areaKeys: ActiveVenueKey[],
): number {
    return selections.reduce(
        (sum, selection) => sum + dateVenueBaseTotal(selection, areaKeys),
        0,
    );
}

function reviewLineItems(
    selections: ScheduleSelection[],
    areaKeys: ActiveVenueKey[],
): ReviewLineItem[] {
    return selections.flatMap((selection) => {
        return areaKeys.flatMap((key) => {
            const venue = selectedVenueByKey(key);
            const baseAmount = rateForBlock(venue, selection.block);
            const items: ReviewLineItem[] = [
                {
                    key: `${selection.date}-${key}-base`,
                    date: selection.date,
                    label: venue.shortLabel,
                    detail: blockLabel(selection.block),
                    quantity: 1,
                    unitAmount: baseAmount,
                    amount: baseAmount,
                    type: 'venue',
                },
            ];

            const hours = Number(selection.additionalHours || 0);
            if (hours > 0) {
                items.push({
                    key: `${selection.date}-${key}-additional`,
                    date: selection.date,
                    label: `${venue.shortLabel} additional hours`,
                    detail: `${hours} hour(s) × ${money(venue.rates.extraHour)}`,
                    quantity: hours,
                    unitAmount: venue.rates.extraHour,
                    amount: venue.rates.extraHour * hours,
                    type: 'additional_hour',
                });
            }

            return items;
        });
    });
}

function dressingRoomLineItems(
    selections: ScheduleSelection[],
    selection: string | null | undefined,
): ReviewLineItem[] {
    const unitAmount = dressingRoomDailyCharge(selection);

    if (unitAmount <= 0) return [];

    const dayCount = Math.max(1, selections.length);

    return [
        {
            key: `dressing-room-${String(selection ?? 'none')}-${dayCount}`,
            date: selections[0]?.date ?? '',
            label: dressingRoomLabel(selection),
            detail: `${dayCount} day(s) x ${money(unitAmount)} per day`,
            quantity: dayCount,
            unitAmount,
            amount: unitAmount * dayCount,
            type: 'dressing_room',
        },
    ];
}

function finalDiscountLines(
    selections: ScheduleSelection[],
    areaKeys: ActiveVenueKey[],
    ingressPrep: boolean,
    organizationType: string | null | undefined = '',
    extraChargeTotal = 0,
): DiscountLine[] {
    const lines: DiscountLine[] = [];
    const grossTotal =
        baseTotal(selections, areaKeys) + Math.max(0, extraChargeTotal);

    if (isGovernmentOrganizationType(organizationType)) {
        if (grossTotal > 0) {
            lines.push({
                key: 'government-organization-50-percent',
                label: 'Government organization discount',
                basis: grossTotal,
                rate: 0.5,
                amount: Math.round(grossTotal * 0.5),
                note: 'Government organization bookings receive a 50% overall discount. Consecutive-day and ingress/egress discounts are not stacked.',
            });
        }

        return lines;
    }

    if (selections.length > 1) {
        const basis = selections
            .slice(1)
            .reduce(
                (sum, selection) =>
                    sum + dateVenueBaseTotal(selection, areaKeys),
                0,
            );
        if (basis > 0) {
            lines.push({
                key: 'consecutive-day-5-percent',
                label: 'Consecutive-day discount',
                basis,
                rate: 0.05,
                amount: Math.round(basis * 0.05),
                note: 'Shown only in final computation. Subject to BCCC assessment before billing.',
            });
        }
    }

    if (ingressPrep && selections.length > 0) {
        const eligibleSetupAreas = areaKeys.filter((key) =>
            ['FULL_HALL', 'MAIN_HALL'].includes(key),
        );
        const first = selections[0];
        const last = selections[selections.length - 1];
        const basis =
            dateVenueBaseBlockTotal(first, eligibleSetupAreas) +
            (last.date !== first.date
                ? dateVenueBaseBlockTotal(last, eligibleSetupAreas)
                : 0);
        if (basis > 0) {
            lines.push({
                key: 'setup-rehearsal-main-full-hall-30-percent',
                label: 'Ingress/Egress discount (Main/Full Hall only)',
                basis,
                rate: 0.3,
                amount: Math.round(basis * 0.3),
                note: 'Applies only to Main Hall or Full Hall package charges during ingress/egress; VIP Lounge and Boardroom are not included.',
            });
        }
    }

    return lines;
}

function finalDiscountPreview(
    selections: ScheduleSelection[],
    areaKeys: ActiveVenueKey[],
    ingressPrep: boolean,
    organizationType: string | null | undefined = '',
    extraChargeTotal = 0,
): number {
    return finalDiscountLines(
        selections,
        areaKeys,
        ingressPrep,
        organizationType,
        extraChargeTotal,
    ).reduce((sum, line) => sum + line.amount, 0);
}

function flattenServices(
    serviceTypes?: ServiceTypeOption[] | PaginatedLike<ServiceTypeOption>,
    services?: ServiceOption[] | PaginatedLike<ServiceOption>,
): ServiceOption[] {
    const direct = collection(services);
    const nested = collection(serviceTypes).flatMap((type) =>
        Array.isArray(type.services)
            ? type.services.map((service) => ({
                  ...service,
                  service_type_id: service.service_type_id ?? type.id,
                  service_type_name: service.service_type_name ?? type.name,
              }))
            : [],
    );
    const seen = new Set<string>();
    return [...direct, ...nested].filter((service) => {
        const id = String(service.id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

function serviceSearchText(service: ServiceOption): string {
    return normalize(
        [service.name, service.service_type_name, service.service_type?.name]
            .filter(Boolean)
            .join(' '),
    );
}

function serviceForVenue(
    services: ServiceOption[],
    venue: ActiveVenue,
): ServiceOption | null {
    return (
        services.find((service) => {
            const text = serviceSearchText(service);
            return venue.matchers.some((matcher) =>
                text.includes(normalize(matcher)),
            );
        }) ?? null
    );
}

function serviceIdsForAreas(
    services: ServiceOption[],
    areaKeys: ActiveVenueKey[],
): string[] {
    return areaKeys
        .map((key) => serviceForVenue(services, selectedVenueByKey(key)))
        .filter((service): service is ServiceOption => Boolean(service))
        .map((service) => String(service.id));
}

function activeKeyFromString(value?: string | null): ActiveVenueKey | null {
    const normalized = String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    const aliases: Record<string, ActiveVenueKey> = {
        FULL_HALL: 'FULL_HALL',
        MAIN_HALL: 'MAIN_HALL',
        GROUND_HALL: 'MAIN_HALL',
        LED_WALL: 'LED_WALL',
        LED_VIDEO_WALL: 'LED_WALL',
        LOUNGE: 'LOUNGE',
        VIP_LOUNGE: 'LOUNGE',
        EXECUTIVE_LOUNGE: 'LOUNGE',
        BOARDROOM: 'BOARDROOM',
        BOARD_ROOM: 'BOARDROOM',
        EXECUTIVE_BOARDROOM: 'BOARDROOM',
    };
    return aliases[normalized] ?? null;
}

function packageFromBackend(option: VenuePackageOption): ActivePackage | null {
    const areaKeys = (option.area_keys ?? [])
        .map((key) => activeKeyFromString(key))
        .filter((key): key is ActiveVenueKey => Boolean(key));
    if (areaKeys.length === 0) return null;
    return {
        code: option.code,
        label: option.name ?? option.label ?? option.code,
        subtitle:
            option.subtitle ??
            option.description ??
            areaKeys
                .map((key) => selectedVenueByKey(key).shortLabel)
                .join(' + '),
        areaKeys,
        image: option.image_path || selectedVenueByKey(areaKeys[0]).image,
        featured: Boolean(option.is_featured),
        notice: option.notice ?? null,
        capacityMin:
            option.capacity_min === null || option.capacity_min === undefined
                ? null
                : Number(option.capacity_min),
        capacityMax:
            option.capacity_max === null || option.capacity_max === undefined
                ? null
                : Number(option.capacity_max),
    };
}

function uniquePackages(packages: ActivePackage[]): ActivePackage[] {
    const seen = new Set<string>();
    return packages.filter((item) => {
        if (seen.has(item.code)) return false;
        seen.add(item.code);
        return true;
    });
}

function packagePriceLabel(pkg: ActivePackage): string {
    const whole = pkg.areaKeys.reduce(
        (sum, key) => sum + selectedVenueByKey(key).rates.wholeDay,
        0,
    );
    const half = pkg.areaKeys.reduce(
        (sum, key) => sum + selectedVenueByKey(key).rates.halfDay,
        0,
    );
    return `${money(whole)} whole day · ${money(half)} half day`;
}

function monthQueryValue(date: string): string {
    return String(date || todayDate()).slice(0, 7);
}

function availabilityAreaLabel(key: ActiveVenueKey): string {
    return selectedVenueByKey(key).shortLabel;
}

function availabilityBlockFallback(
    key: AvailabilityBlockKey,
): AvailabilityBlockState {
    if (key === 'PM')
        return {
            key,
            label: 'PM',
            from: '12:00',
            to: '18:00',
            available: null,
            reason: null,
        };
    if (key === 'EVE')
        return {
            key,
            label: 'EVE',
            from: '18:00',
            to: '23:59',
            available: null,
            reason: null,
        };
    return {
        key,
        label: 'AM',
        from: '06:00',
        to: '12:00',
        available: null,
        reason: null,
    };
}

function emptyDayAvailability(
    date: string,
    status = 'unverified',
    note = 'Availability is being verified.',
): DayAvailabilitySummary {
    return {
        date,
        status,
        title:
            status === 'loading'
                ? 'Checking availability'
                : 'Availability not verified',
        note,
        canProceed: null,
        am: availabilityBlockFallback('AM'),
        pm: availabilityBlockFallback('PM'),
        eve: availabilityBlockFallback('EVE'),
        sourceCount: 0,
    };
}

function pastDateAvailability(date: string): DayAvailabilitySummary {
    const reason =
        'Past date is unavailable for new reservations. Completed past events remain visible in calendar records.';
    return {
        date,
        status: 'past_unavailable',
        title: 'Past date unavailable',
        note: reason,
        canProceed: false,
        am: { ...availabilityBlockFallback('AM'), available: false, reason },
        pm: { ...availabilityBlockFallback('PM'), available: false, reason },
        eve: { ...availabilityBlockFallback('EVE'), available: false, reason },
        sourceCount: 0,
    };
}

function normalizeAvailabilityBlocks(
    blocks: AvailabilityApiDay['blocks'],
): Record<AvailabilityBlockKey, AvailabilityBlockState> {
    const normalized: Record<AvailabilityBlockKey, AvailabilityBlockState> = {
        AM: availabilityBlockFallback('AM'),
        PM: availabilityBlockFallback('PM'),
        EVE: availabilityBlockFallback('EVE'),
    };

    if (!blocks) return normalized;

    const entries: Array<[string, AvailabilityApiBlock | boolean]> =
        Array.isArray(blocks)
            ? blocks.map((block, index) => [
                  String(
                      typeof block === 'object' && block
                          ? (block.key ?? index)
                          : index,
                  ),
                  block,
              ])
            : Object.entries(blocks);

    entries.forEach(([rawKey, rawBlock]) => {
        const key = String(
            typeof rawBlock === 'object' && rawBlock
                ? (rawBlock.key ?? rawKey)
                : rawKey,
        ).toUpperCase();
        if (key !== 'AM' && key !== 'PM' && key !== 'EVE') return;

        if (typeof rawBlock === 'boolean') {
            normalized[key] = {
                ...availabilityBlockFallback(key),
                available: rawBlock,
                reason: rawBlock ? null : 'Booked or blocked',
            };
            return;
        }

        const explicitAvailable =
            rawBlock.is_available ?? rawBlock.isAvailable ?? true;
        const blocked = Boolean(rawBlock.blocked);
        const booked = Boolean(rawBlock.booked);
        const available = Boolean(explicitAvailable) && !blocked && !booked;

        normalized[key] = {
            key,
            label: String(rawBlock.label ?? key),
            from: String(rawBlock.from ?? availabilityBlockFallback(key).from),
            to: String(rawBlock.to ?? availabilityBlockFallback(key).to),
            available,
            reason: rawBlock.reason ?? (available ? null : 'Booked or blocked'),
        };
    });

    return normalized;
}

function normalizeAvailabilityDay(
    day: AvailabilityApiDay,
): DayAvailabilitySummary | null {
    const date = toDateOnly(day.date);
    if (!date) return null;
    const blocks = normalizeAvailabilityBlocks(day.blocks ?? null);
    return {
        date,
        status: String(day.status ?? 'available'),
        title: String(day.title ?? 'Availability status'),
        note: String(day.note ?? day.description ?? ''),
        canProceed:
            day.can_proceed === null || day.can_proceed === undefined
                ? null
                : Boolean(day.can_proceed),
        am: blocks.AM,
        pm: blocks.PM,
        eve: blocks.EVE,
        sourceCount: 1,
    };
}

function mergeBlockAvailability(
    left: AvailabilityBlockState,
    right: AvailabilityBlockState,
): AvailabilityBlockState {
    const leftAvailable = left.available;
    const rightAvailable = right.available;
    const available =
        leftAvailable === null
            ? rightAvailable
            : rightAvailable === null
              ? leftAvailable
              : leftAvailable && rightAvailable;
    const reason =
        available === false
            ? [left.reason, right.reason].filter(Boolean).join(' / ') ||
              'One selected area is already occupied.'
            : null;

    return {
        ...left,
        available,
        reason,
    };
}

function mergeDayAvailability(
    left: DayAvailabilitySummary,
    right: DayAvailabilitySummary,
): DayAvailabilitySummary {
    const am = mergeBlockAvailability(left.am, right.am);
    const pm = mergeBlockAvailability(left.pm, right.pm);
    const eve = mergeBlockAvailability(left.eve, right.eve);
    const hasClosedBlock = [am, pm, eve].some(
        (block) => block.available === false,
    );
    const allClosed = [am, pm, eve].every((block) => block.available === false);

    return {
        date: left.date,
        status: allClosed
            ? 'private_booked'
            : hasClosedBlock
              ? 'limited'
              : left.status === 'unverified'
                ? right.status
                : left.status,
        title: allClosed
            ? 'Selected service scope is fully occupied'
            : hasClosedBlock
              ? 'Selected service scope has limited availability'
              : left.title || right.title,
        note: [left.note, right.note].filter(Boolean).slice(0, 2).join(' '),
        canProceed:
            left.canProceed === false || right.canProceed === false
                ? false
                : (left.canProceed ?? right.canProceed),
        am,
        pm,
        eve,
        sourceCount: left.sourceCount + right.sourceCount,
    };
}

function buildCalendarMonthUrl(month: string, areaLabel?: string): string {
    const params = new URLSearchParams({ month });
    if (areaLabel) params.set('area', areaLabel);
    return `/public/calendar-month?${params.toString()}`;
}

function availabilityPillClasses(
    available: boolean | null,
    selected: boolean,
): string {
    if (available === null)
        return selected
            ? 'border-white/25 bg-white/10 text-white/80'
            : 'border-slate-200 bg-slate-100 text-slate-500';
    if (available)
        return selected
            ? 'border-emerald-200/50 bg-emerald-300/15 text-emerald-50'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700';
    return selected
        ? 'border-red-200/50 bg-red-300/15 text-red-50'
        : 'border-red-200 bg-red-50 text-red-700';
}

function availabilityPillText(available: boolean | null): string {
    if (available === null) return 'Check';
    return available ? 'Open' : 'Unavailable';
}

function compactAvailabilityPillText(available: boolean | null): string {
    if (available === null) return 'Check';
    return available ? 'Open' : 'Closed';
}

function coveredMonthFromDate(date: string): string {
    if (!date) return MONTHS[new Date().getMonth()];
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return MONTHS[new Date().getMonth()];
    return MONTHS[parsed.getMonth()];
}

function buildBookingDateFrom(selection: ScheduleSelection): string {
    return `${selection.date}T${startTime(selection.block)}`;
}

function buildBookingDateTo(selection: ScheduleSelection): string {
    return `${selection.date}T${endTime(selection.block, selection.additionalHours)}`;
}

function statusRole(role?: string | null): RoleThemeKey {
    return normalizeWorkspaceRole(role) as RoleThemeKey;
}

function pagePropsWithFallback<T extends Record<string, unknown>>(
    props: T,
    pageProps: Record<string, unknown>,
): T {
    return { ...pageProps, ...props } as T;
}

function formTitle(role: RoleThemeKey, editing: boolean): string {
    if (editing) return 'Update Reservation';
    if (role === 'user') return 'Reserve Your Event Space';
    return 'Create Booking';
}

function formDescription(role: RoleThemeKey): string {
    if (role === 'user') {
        return 'Select your schedule, choose active BCCC services, complete organizer details, and submit the request for review.';
    }
    return 'Encode an official BCCC reservation using the active charge catalog and guided schedule workflow.';
}

function hiddenDiscountNote(): string {
    return 'Discounts are intentionally hidden until final computation and remain subject to BCCC assessment.';
}

function buildInitialSelections(
    start: string,
    end: string,
): ScheduleSelection[] {
    return dateRange(start, end).map((date) => ({
        date,
        block: 'whole_day',
        additionalHours: 0,
    }));
}

function buildMiceDraft(
    data: BookingFormData,
    selections: ScheduleSelection[],
    eventScope: EventScope,
): BookingPaymentMeta {
    if (eventScope === 'private') {
        return {
            event_scope: 'PRIVATE/PERSONAL EVENT',
            event_center_name: PUBLIC_EVENT_CENTER,
            covered_month: data.covered_month,
            date_event_started: selections[0]?.date ?? '',
            date_event_finished: selections[selections.length - 1]?.date ?? '',
            schedule_time_display:
                displayOverallScheduleDateTimeRange(selections),
            additional_hours_display: displayAdditionalHoursSummary(selections),
            schedule_daily_display: selections
                .map(displaySelectionDateTimeRange)
                .join(' • '),
            event_name: upper(data.type_of_event || ''),
            number_of_hours: String(totalHours(selections)),
            function_halls_count: '-',
            function_hall_capacity: '-',
            classification_of_event: '-',
            mice_type_of_event: '-',
            foreign_attendees: '-',
            domestic_attendees: '-',
            total_number_of_countries: '-',
            countries_breakdown_text: '-',
            has_exhibitions: '-',
            exhibitors_count: '-',
            visitors_count: '-',
            enterprise_group: '-',
            btc_group_code: '-',
            event_category: '-',
            local_male_participants: '0',
            local_female_participants: '0',
            domestic_male_participants: '0',
            domestic_female_participants: '0',
            foreign_male_participants: '0',
            foreign_female_participants: '0',
            main_origin_country: '-',
            main_origin_province: '-',
            main_origin_city: '-',
            same_day_visitors: '0',
            overnight_visitors: '0',
            estimated_room_nights: '0',
            estimated_tourism_receipts: '0',
            total_employees: '0',
            female_employees: '0',
            male_employees: '0',
            permit_to_engage: 'No',
            dot_accredited: 'No',
            active_member: 'No',
            remarks: cleanValue(data.remarks, 'N/A'),
            organization_name: upper(data.company_name || ''),
            organizer_address: upper(data.client_address || ''),
            organizer_contact_person: upper(data.client_name || ''),
            organizer_contact_number: data.client_contact_number,
            comments_feedback: cleanValue(data.comments_feedback, 'N/A'),
        };
    }

    const hasExhibitions = data.has_exhibitions === 'Yes';
    return {
        event_scope: 'GOVERNMENT EVENT',
        event_center_name: PUBLIC_EVENT_CENTER,
        covered_month: data.covered_month,
        date_event_started: selections[0]?.date ?? '',
        date_event_finished: selections[selections.length - 1]?.date ?? '',
        schedule_time_display: displayOverallScheduleDateTimeRange(selections),
        additional_hours_display: displayAdditionalHoursSummary(selections),
        schedule_daily_display: selections
            .map(displaySelectionDateTimeRange)
            .join(' • '),
        event_name: upper(data.type_of_event || ''),
        number_of_hours: String(totalHours(selections)),
        function_halls_count: '1',
        function_hall_capacity: '2000',
        classification_of_event: data.classification_of_event,
        mice_type_of_event: data.mice_type_of_event,
        foreign_attendees: data.foreign_attendees || '0',
        domestic_attendees: data.domestic_attendees || '0',
        total_number_of_countries: data.total_number_of_countries || '1',
        countries_breakdown_text: upper(
            data.countries_breakdown_text || 'PHILIPPINES',
        ),
        has_exhibitions: data.has_exhibitions,
        exhibitors_count: hasExhibitions ? data.exhibitors_count : '0',
        visitors_count: hasExhibitions ? data.visitors_count : '0',
        enterprise_group: upper(data.enterprise_group),
        btc_group_code: upper(data.btc_group_code),
        event_category: upper(data.event_category),
        local_male_participants: data.local_male_participants,
        local_female_participants: data.local_female_participants,
        domestic_male_participants: data.domestic_male_participants,
        domestic_female_participants: data.domestic_female_participants,
        foreign_male_participants: data.foreign_male_participants,
        foreign_female_participants: data.foreign_female_participants,
        main_origin_country: upper(data.main_origin_country),
        main_origin_province: upper(data.main_origin_province),
        main_origin_city: upper(data.main_origin_city),
        same_day_visitors: data.same_day_visitors,
        overnight_visitors: data.overnight_visitors,
        estimated_room_nights: data.estimated_room_nights,
        estimated_tourism_receipts: data.estimated_tourism_receipts,
        total_employees: data.total_employees,
        female_employees: data.female_employees,
        male_employees: data.male_employees,
        permit_to_engage: data.permit_to_engage,
        dot_accredited: data.dot_accredited,
        active_member: data.active_member,
        remarks: cleanValue(data.remarks, 'N/A'),
        organization_name: upper(data.company_name || ''),
        organizer_address: upper(data.client_address || ''),
        organizer_contact_person: upper(data.client_name || ''),
        organizer_contact_number: data.client_contact_number,
        comments_feedback: cleanValue(data.comments_feedback, 'N/A'),
    };
}

function Field({
    label,
    required,
    error,
    children,
    help,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
    help?: string;
}) {
    return (
        <label className="grid gap-2 text-sm font-medium text-slate-800">
            <span className="flex items-center gap-1">
                {label}
                {required ? <strong className="text-red-600">*</strong> : null}
            </span>
            {children}
            {help ? (
                <small className="text-xs leading-5 font-normal text-slate-500">
                    {help}
                </small>
            ) : null}
            {error ? (
                <small className="text-xs font-semibold text-red-600">
                    {error}
                </small>
            ) : null}
        </label>
    );
}

function inputClass(hasError?: boolean): string {
    return cx(
        'min-h-11 w-full border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#164734] focus:ring-2 focus:ring-[#164734]/10',
        hasError ? 'border-red-400 bg-red-50/60' : 'border-slate-200',
    );
}

function StepProgress({
    activeStep,
    submitted,
    onStepClick,
}: {
    activeStep: number;
    submitted: boolean;
    onStepClick: (index: number) => void;
}) {
    const completedSteps = submitted
        ? STEPS.length
        : Math.min(STEPS.length, Math.max(1, activeStep + 1));
    const progressPercent = `${(completedSteps / STEPS.length) * 100}%`;

    return (
        <div className="bccc-booking-step-progress sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur-xl sm:px-5">
            <div className="bccc-booking-step-progress-track mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto">
                {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const done = submitted || index < activeStep;
                    const active = index === activeStep && !submitted;
                    return (
                        <button
                            key={step.key}
                            type="button"
                            onClick={() =>
                                !submitted && index < 4 && onStepClick(index)
                            }
                            className={cx(
                                'bccc-booking-step-button group flex min-w-[190px] flex-1 items-center gap-3 border px-3 py-2 text-left transition duration-300',
                                active
                                    ? 'border-[#164734] bg-[#164734] text-white shadow-md'
                                    : done
                                      ? 'border-[#d6b56d]/50 bg-[#fff8e6] text-[#164734]'
                                      : 'border-slate-200 bg-white text-slate-500',
                            )}
                        >
                            <span
                                className={cx(
                                    'grid h-9 w-9 shrink-0 place-items-center rounded-full border transition',
                                    active
                                        ? 'border-white/40 bg-white/15'
                                        : done
                                          ? 'border-[#d6b56d] bg-white'
                                          : 'border-slate-200 bg-slate-50',
                                )}
                            >
                                {done ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Icon className="h-4 w-4" />
                                )}
                            </span>
                            <span className="min-w-0">
                                <strong className="block truncate text-[11px] tracking-[0.24em] uppercase">
                                    {step.label}
                                </strong>
                                <small
                                    className={cx(
                                        'block truncate text-xs',
                                        active
                                            ? 'text-white/75'
                                            : 'text-current/65',
                                    )}
                                >
                                    {step.helper}
                                </small>
                            </span>
                            <span
                                className={cx(
                                    'bccc-booking-step-number ml-auto grid h-8 min-w-8 shrink-0 place-items-center rounded-full border px-2 text-xs font-black tabular-nums',
                                    active
                                        ? 'border-white/35 bg-white/15 text-white'
                                        : done
                                          ? 'border-[#d6b56d]/70 bg-white text-[#164734]'
                                          : 'border-slate-200 bg-slate-50 text-slate-500',
                                )}
                                aria-label={`Step ${index + 1} of ${STEPS.length}`}
                            >
                                {index + 1}
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="bccc-booking-step-meter mx-auto mt-2 h-1.5 max-w-[1600px] overflow-hidden rounded-full bg-slate-200">
                <div
                    className="h-full rounded-full bg-[#164734] transition-[width] duration-500"
                    style={{ width: progressPercent }}
                />
            </div>
        </div>
    );
}

function SectionShell({
    kicker,
    title,
    description,
    icon,
    children,
}: {
    kicker: string;
    title: string;
    description: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="bccc-booking-section-shell border border-slate-200 bg-white shadow-sm">
            <div className="bccc-booking-section-head flex flex-col gap-3 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-[#a88633] uppercase">
                        {icon}
                        {kicker}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
                        {title}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

export function BookingFormPage(rawProps: BookingFormPageProps = {}) {
    const page = usePage();
    const props = pagePropsWithFallback(
        rawProps,
        page.props as Record<string, unknown>,
    );
    const authUser = (
        page.props.auth as
            | { user?: { role?: string; email?: string | null } }
            | undefined
    )?.user;
    const role = statusRole(props.workspaceRole ?? authUser?.role ?? 'user');
    const booking = props.booking;
    const editing = Boolean(booking?.id);
    const services = useMemo(
        () => flattenServices(props.serviceTypes, props.services),
        [props.serviceTypes, props.services],
    );
    const backendPackages = useMemo(
        () =>
            (
                props.venuePackages ??
                props.bookingFormOptions?.venuePackages ??
                []
            )
                .map(packageFromBackend)
                .filter((item): item is ActivePackage => Boolean(item)),
        [props.venuePackages, props.bookingFormOptions?.venuePackages],
    );
    const packages = useMemo(
        () =>
            uniquePackages([...FALLBACK_PACKAGES, ...backendPackages]).slice(
                0,
                8,
            ),
        [backendPackages],
    );
    const classificationOptions = props.bookingFormOptions?.mice
        ?.classificationOptions?.length
        ? props.bookingFormOptions.mice.classificationOptions
        : CLASSIFICATION_OPTIONS;
    const miceTypeOptions = props.bookingFormOptions?.mice?.typeOptions?.length
        ? props.bookingFormOptions.mice.typeOptions
        : MICE_TYPE_OPTIONS;
    const privateTypeOptions = props.bookingFormOptions?.mice
        ?.privateEventOptions?.length
        ? props.bookingFormOptions.mice.privateEventOptions
        : PRIVATE_EVENT_OPTIONS;
    const latestDraft =
        !editing && props.latestDraft?.payload ? props.latestDraft : null;
    const draftPayload =
        latestDraft?.payload && typeof latestDraft.payload === 'object'
            ? (latestDraft.payload as BookingDraftPayload)
            : {};
    const rawDraftData =
        draftPayload.data && typeof draftPayload.data === 'object'
            ? (draftPayload.data as Partial<BookingFormData>)
            : {};
    const draftData = normalizeBookingDraftData(rawDraftData);
    const draftScheduleSelections = Array.isArray(
        draftPayload.scheduleSelections,
    )
        ? draftPayload.scheduleSelections
              .map((row) => ({
                  date: toDateOnly(String(row?.date ?? '')),
                  block: ['am', 'pm', 'whole_day'].includes(
                      String(row?.block ?? ''),
                  )
                      ? (row.block as ScheduleBlock)
                      : ('whole_day' as ScheduleBlock),
                  additionalHours: Number(row?.additionalHours || 0),
              }))
              .filter((row) => row.date)
        : [];

    const initialFrom =
        draftScheduleSelections[0]?.date ??
        initialDateFromSchedule(props.initialSchedule, booking);
    const initialTo =
        draftScheduleSelections[draftScheduleSelections.length - 1]?.date ??
        initialDateToSchedule(props.initialSchedule, booking);
    const hasPresetSchedule = Boolean(
        draftScheduleSelections.length ||
            firstValue(
                booking?.booking_date_from,
                booking?.booking_date_to,
                props.initialSchedule?.booking_date_from,
                props.initialSchedule?.booking_date_to,
                props.initialSchedule?.date_from,
                props.initialSchedule?.date_to,
                props.initialSchedule?.from,
                props.initialSchedule?.to,
                props.initialSchedule?.date,
            ),
    );
    const initialSelections = draftScheduleSelections.length
        ? draftScheduleSelections
        : hasPresetSchedule
          ? buildInitialSelections(initialFrom, initialTo)
          : [];
    const draftMeta =
        draftData.payment_meta && typeof draftData.payment_meta === 'object'
            ? (draftData.payment_meta as BookingPaymentMeta)
            : {};
    const initialMeta = (
        booking?.payment_meta && typeof booking.payment_meta === 'object'
            ? booking.payment_meta
            : draftMeta
    ) as BookingPaymentMeta;
    const initialMice = (
        booking?.mice_report &&
        typeof booking.mice_report === 'object' &&
        !Array.isArray(booking.mice_report)
            ? booking.mice_report
            : {}
    ) as BookingPaymentMeta;
    const initialAreaKeys = Array.isArray(booking?.selected_area_keys)
        ? booking.selected_area_keys
              .map((key) => activeKeyFromString(key))
              .filter((key): key is ActiveVenueKey => Boolean(key))
        : [];
    const draftAreaKeys = (
        Array.isArray(draftPayload.selectedAreaKeys)
            ? draftPayload.selectedAreaKeys
            : Array.isArray(draftData.selected_area_keys)
              ? draftData.selected_area_keys
              : []
    )
        .map((key) => activeKeyFromString(String(key)))
        .filter((key): key is ActiveVenueKey => Boolean(key));
    const queryAreaKeys = (
        Array.isArray(props.initialAreaKeys) ? props.initialAreaKeys : []
    )
        .map((key) => activeKeyFromString(String(key)))
        .filter((key): key is ActiveVenueKey => Boolean(key));
    const initialPackageCode = firstValue(
        booking?.selected_package_code,
        draftPayload.selectedPackageCode,
        draftData.selected_package_code,
        props.initialPackageCode,
    );
    const packageInitial =
        packages.find((item) => item.code === initialPackageCode) ?? null;
    const defaultAreaKeys: ActiveVenueKey[] =
        packageInitial?.areaKeys ??
        (draftAreaKeys.length
            ? draftAreaKeys
            : initialAreaKeys.length
              ? initialAreaKeys
              : queryAreaKeys);
    const initialActiveStep = Math.max(
        0,
        Math.min(
            3,
            Number(draftPayload.activeStep ?? latestDraft?.current_step ?? 0),
        ),
    );

    const [activeStep, setActiveStep] = useState(initialActiveStep);
    const [submitted, setSubmitted] = useState(false);
    const stepRootRef = useRef<HTMLDivElement | null>(null);
    const bypassLeavePromptRef = useRef(false);
    const draftDiscardingRef = useRef(false);
    const draftRequestInFlightRef = useRef(false);
    const loadedDraftSnapshotRef = useRef(false);
    const lastDraftSnapshotRef = useRef('');
    const [floatingNotice, setFloatingNotice] = useState<{
        title: string;
        message: string;
        tone: 'error' | 'info';
    } | null>(null);
    const [leavePrompt, setLeavePrompt] = useState<LeavePromptState | null>(
        null,
    );
    const [draftKey, setDraftKey] = useState(
        firstValue(latestDraft?.draft_key, draftData.booking_draft_key),
    );
    const [draftRecordId, setDraftRecordId] = useState(
        firstValue(latestDraft?.id),
    );
    const [draftSaveState, setDraftSaveState] = useState<
        'idle' | 'saving' | 'saved' | 'error'
    >('idle');
    const [draftSavedAt, setDraftSavedAt] = useState(
        firstValue(latestDraft?.last_touched_at),
    );
    const [calendarCursor, setCalendarCursor] = useState(
        monthStart(firstValue(draftPayload.calendarCursor, initialFrom)),
    );
    const [rangeAnchor, setRangeAnchor] = useState<string | null>(
        draftPayload.rangeAnchor ? String(draftPayload.rangeAnchor) : null,
    );
    const [scheduleSelections, setScheduleSelections] =
        useState<ScheduleSelection[]>(initialSelections);
    const [userAdjustedSchedule, setUserAdjustedSchedule] =
        useState(hasPresetSchedule);
    const [autoDefaultScheduleDone, setAutoDefaultScheduleDone] =
        useState(true);
    const [packageMode, setPackageMode] = useState<PackageMode>(() => {
        if (draftPayload.packageMode === 'manual') return 'manual';
        if (draftPayload.packageMode === 'packages') return 'packages';
        return packageInitial
            ? 'packages'
            : defaultAreaKeys.length
              ? 'manual'
              : 'packages';
    });
    const [selectedPackageCode, setSelectedPackageCode] = useState(
        packageInitial?.code ??
            firstValue(
                draftPayload.selectedPackageCode,
                draftData.selected_package_code,
            ),
    );
    const [selectedAreaKeys, setSelectedAreaKeys] =
        useState<ActiveVenueKey[]>(defaultAreaKeys);
    const [ingressPrep, setIngressPrep] = useState(
        Boolean(draftPayload.ingressPrep),
    );
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [policyModalChecked, setPolicyModalChecked] = useState(false);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [calendarAvailability, setCalendarAvailability] =
        useState<CalendarAvailabilityMap>({});
    const [calendarAvailabilityLoading, setCalendarAvailabilityLoading] =
        useState(false);
    const [calendarAvailabilityError, setCalendarAvailabilityError] = useState<
        string | null
    >(null);

    const initialServiceIds = serviceIdsForAreas(services, defaultAreaKeys);
    const firstSelection = scheduleSelections[0] ?? {
        date: todayDate(),
        block: 'whole_day',
        additionalHours: 0,
    };
    const lastSelection =
        scheduleSelections[scheduleSelections.length - 1] ?? firstSelection;

    const {
        data,
        setData: rawSetData,
        post,
        put,
        processing,
        errors,
        transform,
    } = useForm<BookingFormData>({
        service_id: firstValue(
            booking?.service_id,
            booking?.service?.id,
            initialServiceIds[0],
        ),
        items: initialServiceIds.map((service_id) => ({
            service_id,
            quantity: 1,
        })),
        payment_meta: initialMeta,
        selected_package_code: packageInitial?.code ?? '',
        selected_area_keys: defaultAreaKeys,
        schedule_version: 'segments_v1',
        schedule_meta: {},
        schedule_segments: [],
        mice_required:
            booking?.mice_required === undefined ||
            booking?.mice_required === null
                ? true
                : Boolean(booking.mice_required),
        mice_exemption_reason: firstValue(
            booking?.mice_exemption_reason,
            'PRIVATE/PERSONAL EVENT',
        ),
        private_event_type: firstValue(
            booking?.private_event_type,
            'PRIVATE/PERSONAL EVENT',
        ),
        organization_type: firstValue(
            booking?.organization_type,
            booking?.mice_required === false || booking?.mice_required === 0
                ? 'Private'
                : 'Government',
        ),
        company_name: upper(firstValue(booking?.company_name)),
        client_name: upper(firstValue(booking?.client_name)),
        client_contact_number: firstValue(booking?.client_contact_number),
        client_email: firstValue(
            booking?.client_email,
            authUser?.email,
        ).toLowerCase(),
        client_address: upper(
            firstValue(booking?.client_address, booking?.client_street_address),
        ),
        client_region: firstValue(booking?.client_region),
        client_province: firstValue(booking?.client_province),
        client_city_municipality: firstValue(booking?.client_city_municipality),
        client_barangay: firstValue(booking?.client_barangay),
        client_zip_code: firstValue(booking?.client_zip_code),
        client_street_address: upper(
            firstValue(booking?.client_street_address, booking?.client_address),
        ),
        head_of_organization: upper(firstValue(booking?.head_of_organization)),
        type_of_event: upper(
            firstValue(booking?.type_of_event, props.initialEventType),
        ),
        booking_date_from: buildBookingDateFrom(firstSelection),
        booking_date_to: buildBookingDateTo(lastSelection),
        number_of_guests: firstValue(
            booking?.number_of_guests,
            props.initialGuests,
        ),
        booking_status: firstValue(booking?.booking_status, 'pending'),
        payment_status: firstValue(booking?.payment_status, 'unpaid'),
        is_public_calendar_visible: Boolean(
            booking?.is_public_calendar_visible ?? false,
        ),
        public_calendar_title: firstValue(booking?.public_calendar_title),
        policy_acknowledged: Boolean(editing),
        accuracy_acknowledged: Boolean(editing),
        estimated_usage: 'whole_day',
        estimated_duration_hours: '0',
        estimated_other_rentals: firstValue(
            booking?.dressing_room_selection,
            initialMeta.dressing_room_selection,
            'none',
        ),
        estimated_additional_charges: firstValue(
            booking?.dressing_room_charge,
            initialMeta.dressing_room_charge,
            '0',
        ),
        reservation_notes: '',
        computation_stage: 'review',
        show_discounts: true,
        event_nature:
            booking?.mice_required === false || booking?.mice_required === 0
                ? 'private'
                : 'public',
        event_scope:
            booking?.mice_required === false || booking?.mice_required === 0
                ? 'PRIVATE/PERSONAL EVENT'
                : 'GOVERNMENT EVENT',
        event_center_name: PUBLIC_EVENT_CENTER,
        covered_month: firstValue(
            initialMice.covered_month,
            initialMeta.covered_month,
            coveredMonthFromDate(initialFrom),
        ),
        classification_of_event: firstValue(
            initialMice.classification_of_event,
            initialMeta.classification_of_event,
            'REGIONAL PHILIPPINES',
        ),
        classification_other: firstValue(initialMeta.classification_other),
        mice_type_of_event: firstValue(
            initialMice.mice_type_of_event,
            initialMeta.mice_type_of_event,
            'MEETINGS',
        ),
        mice_type_other: firstValue(initialMeta.mice_type_other),
        function_halls_count: '1',
        function_hall_capacity: '2000',
        number_of_hours: String(totalHours(initialSelections)),
        foreign_attendees: firstValue(
            initialMice.foreign_attendees,
            initialMeta.foreign_attendees,
            '0',
        ),
        domestic_attendees: firstValue(
            initialMice.domestic_attendees,
            initialMeta.domestic_attendees,
            props.initialGuests,
            '0',
        ),
        total_number_of_countries: firstValue(
            initialMice.total_number_of_countries,
            initialMeta.total_number_of_countries,
            '1',
        ),
        countries_breakdown_text: upper(
            firstValue(
                initialMice.countries_breakdown_text,
                initialMeta.countries_breakdown_text,
                'PHILIPPINES',
            ),
        ),
        has_exhibitions: booleanValue(
            initialMice.has_exhibitions,
            booleanValue(initialMeta.has_exhibitions),
        )
            ? 'Yes'
            : 'No',
        exhibitors_count: firstValue(
            initialMice.exhibitors_count,
            initialMeta.exhibitors_count,
            '0',
        ),
        visitors_count: firstValue(
            initialMice.visitors_count,
            initialMeta.visitors_count,
            '0',
        ),
        comments_feedback: firstValue(
            initialMice.comments_feedback,
            initialMeta.comments_feedback,
        ),
        enterprise_group: upper(
            firstValue(
                initialMice.enterprise_group,
                initialMeta.enterprise_group,
                'UNCLASSIFIED',
            ),
        ),
        btc_group_code: upper(
            firstValue(
                initialMice.btc_group_code,
                initialMeta.btc_group_code,
                'N/A',
            ),
        ),
        event_category: upper(
            firstValue(
                initialMice.event_category,
                initialMeta.event_category,
                'CONVENTION',
            ),
        ),
        local_male_participants: firstValue(
            initialMice.local_male_participants,
            initialMeta.local_male_participants,
            '0',
        ),
        local_female_participants: firstValue(
            initialMice.local_female_participants,
            initialMeta.local_female_participants,
            '0',
        ),
        domestic_male_participants: firstValue(
            initialMice.domestic_male_participants,
            initialMeta.domestic_male_participants,
            '0',
        ),
        domestic_female_participants: firstValue(
            initialMice.domestic_female_participants,
            initialMeta.domestic_female_participants,
            '0',
        ),
        foreign_male_participants: firstValue(
            initialMice.foreign_male_participants,
            initialMeta.foreign_male_participants,
            '0',
        ),
        foreign_female_participants: firstValue(
            initialMice.foreign_female_participants,
            initialMeta.foreign_female_participants,
            '0',
        ),
        main_origin_country: upper(
            firstValue(
                initialMice.main_origin_country,
                initialMeta.main_origin_country,
                'PHILIPPINES',
            ),
        ),
        main_origin_province: upper(
            firstValue(
                initialMice.main_origin_province,
                initialMeta.main_origin_province,
                'BENGUET',
            ),
        ),
        main_origin_city: upper(
            firstValue(
                initialMice.main_origin_city,
                initialMeta.main_origin_city,
                'BAGUIO CITY',
            ),
        ),
        same_day_visitors: firstValue(
            initialMice.same_day_visitors,
            initialMeta.same_day_visitors,
            '0',
        ),
        overnight_visitors: firstValue(
            initialMice.overnight_visitors,
            initialMeta.overnight_visitors,
            '0',
        ),
        estimated_room_nights: firstValue(
            initialMice.estimated_room_nights,
            initialMeta.estimated_room_nights,
            '0',
        ),
        estimated_tourism_receipts: firstValue(
            initialMice.estimated_tourism_receipts,
            initialMeta.estimated_tourism_receipts,
            '0',
        ),
        total_employees: firstValue(
            initialMice.total_employees,
            initialMeta.total_employees,
            '0',
        ),
        female_employees: firstValue(
            initialMice.female_employees,
            initialMeta.female_employees,
            '0',
        ),
        male_employees: firstValue(
            initialMice.male_employees,
            initialMeta.male_employees,
            '0',
        ),
        permit_to_engage: booleanValue(
            initialMice.permit_to_engage,
            booleanValue(initialMeta.permit_to_engage),
        )
            ? 'Yes'
            : 'No',
        dot_accredited: booleanValue(
            initialMice.dot_accredited,
            booleanValue(initialMeta.dot_accredited),
        )
            ? 'Yes'
            : 'No',
        active_member: booleanValue(
            initialMice.active_member,
            booleanValue(initialMeta.active_member),
        )
            ? 'Yes'
            : 'No',
        remarks: firstValue(initialMice.remarks, initialMeta.remarks, 'N/A'),
        ...(!editing ? draftData : {}),
        booking_draft_key: draftKey,
        draft_key: draftKey,
    });

    const setData = rawSetData as unknown as <K extends keyof BookingFormData>(
        key: K,
        value: BookingFormData[K],
    ) => void;
    const replaceData = rawSetData as unknown as (
        value: BookingFormData,
    ) => void;
    const mergedErrors = {
        ...(errors as Record<string, string>),
        ...stepErrors,
    };
    const cityMunicipalityOptions = citiesForProvince(data.client_province);
    const selectedPackage =
        packages.find((item) => item.code === selectedPackageCode) ?? null;
    const selectedCombinationError = fullMainCombinationError(selectedAreaKeys);

    function scrollToCurrentStep() {
        requestAnimationFrame(() => {
            stepRootRef.current
                ?.querySelectorAll<HTMLElement>(
                    [
                        '[data-scroll-reset]',
                        '.bccc-booking-step-layout > :first-child',
                        '.bccc-booking-selected-dates',
                    ].join(','),
                )
                .forEach((node) =>
                    node.scrollTo({ top: 0, left: 0, behavior: 'auto' }),
                );
            stepRootRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function showFloatingNotice(
        title: string,
        message: string,
        tone: 'error' | 'info' = 'error',
    ) {
        setFloatingNotice({ title, message, tone });
    }

    function hasMeaningfulDraftData() {
        if (editing || submitted) return false;

        return Boolean(
            scheduleSelections.length ||
                selectedAreaKeys.length ||
                cleanValue(data.type_of_event) ||
                cleanValue(data.company_name) ||
                cleanValue(data.client_name) ||
                cleanValue(data.client_contact_number) ||
                cleanValue(data.client_street_address) ||
                cleanValue(data.number_of_guests) ||
                cleanValue(data.reservation_notes),
        );
    }

    function buildBookingDraftPayload(): BookingDraftPayload {
        return {
            data: {
                ...data,
                booking_draft_key: draftKey,
                draft_key: draftKey,
            },
            scheduleSelections,
            selectedAreaKeys,
            selectedPackageCode,
            packageMode,
            ingressPrep,
            calendarCursor,
            rangeAnchor,
            activeStep,
        };
    }

    const draftAutosaveSnapshot = useMemo(() => {
        if (editing || submitted || !hasMeaningfulDraftData()) return '';

        const payload = buildBookingDraftPayload();
        const payloadData =
            payload.data && typeof payload.data === 'object'
                ? {
                      ...payload.data,
                      booking_draft_key: '',
                      draft_key: '',
                  }
                : payload.data;

        return JSON.stringify({
            ...payload,
            data: payloadData,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        activeStep,
        calendarCursor,
        data,
        editing,
        ingressPrep,
        packageMode,
        rangeAnchor,
        scheduleSelections,
        selectedAreaKeys,
        selectedPackageCode,
        submitted,
    ]);

    function hasUnsavedDraftChanges() {
        if (draftDiscardingRef.current) return false;
        if (editing || submitted || !draftAutosaveSnapshot) return false;
        if (draftSaveState === 'saving' || draftRequestInFlightRef.current) {
            return true;
        }

        return draftAutosaveSnapshot !== lastDraftSnapshotRef.current;
    }

    useEffect(() => {
        if (
            loadedDraftSnapshotRef.current ||
            !latestDraft ||
            !draftAutosaveSnapshot
        ) {
            return;
        }

        loadedDraftSnapshotRef.current = true;
        lastDraftSnapshotRef.current = draftAutosaveSnapshot;
        setDraftSaveState('saved');
    }, [draftAutosaveSnapshot, latestDraft]);

    async function saveBookingDraft(
        status: 'auto' | 'manual' = 'auto',
        snapshot = draftAutosaveSnapshot,
    ) {
        if (draftDiscardingRef.current) return true;
        if (editing || submitted || !hasMeaningfulDraftData()) return true;
        if (
            status === 'auto' &&
            (!snapshot ||
                snapshot === lastDraftSnapshotRef.current ||
                draftRequestInFlightRef.current)
        ) {
            return true;
        }

        draftRequestInFlightRef.current = true;
        setDraftSaveState('saving');

        try {
            const response = await fetch('/booking-drafts', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    draft_key: draftKey || undefined,
                    status,
                    workspace_role: role,
                    current_step: activeStep,
                    payload: buildBookingDraftPayload(),
                }),
            });

            if (!response.ok) throw new Error('Unable to save draft.');

            const payload = (await response.json()) as {
                draft?: BookingDraftRecord;
                message?: string;
            };
            const savedKey = firstValue(payload.draft?.draft_key, draftKey);
            const savedRecordId = firstValue(payload.draft?.id, draftRecordId);
            const savedAt = firstValue(
                payload.draft?.last_touched_at,
                new Date().toISOString(),
            );

            if (savedRecordId && savedRecordId !== draftRecordId) {
                setDraftRecordId(savedRecordId);
            }

            if (savedKey) {
                if (savedKey !== draftKey) {
                    setDraftKey(savedKey);
                }

                if (data.booking_draft_key !== savedKey) {
                    setData('booking_draft_key', savedKey);
                }

                if (data.draft_key !== savedKey) {
                    setData('draft_key', savedKey);
                }
            }

            if (snapshot) {
                lastDraftSnapshotRef.current = snapshot;
            }

            setDraftSavedAt(savedAt);
            setDraftSaveState('saved');
            return true;
        } catch {
            setDraftSaveState('error');
            return false;
        } finally {
            draftRequestInFlightRef.current = false;
        }
    }

    async function discardBookingDraft() {
        draftDiscardingRef.current = true;
        setDraftSaveState('idle');

        for (
            let attempt = 0;
            attempt < 50 && draftRequestInFlightRef.current;
            attempt += 1
        ) {
            await new Promise((resolve) => window.setTimeout(resolve, 100));
        }

        const activeDraftKey = firstValue(
            draftKey,
            data.booking_draft_key,
            data.draft_key,
            latestDraft?.draft_key,
        );

        if (!activeDraftKey && !draftRecordId) {
            lastDraftSnapshotRef.current = draftAutosaveSnapshot;
            return true;
        }

        try {
            const response = await fetch('/booking-drafts', {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    draft_key: activeDraftKey || undefined,
                }),
            });

            if (!response.ok) throw new Error('Unable to discard draft.');

            lastDraftSnapshotRef.current = draftAutosaveSnapshot;
            setDraftRecordId('');
            setDraftKey('');
            setData('booking_draft_key', '');
            setData('draft_key', '');
            return true;
        } catch {
            draftDiscardingRef.current = false;
            setDraftSaveState('error');
            return false;
        }
    }

    function continueToUrl(url: string, method: InertiaVisitMethod = 'get') {
        bypassLeavePromptRef.current = true;
        setLeavePrompt(null);
        router.visit(url, { method, preserveScroll: false });
    }

    function patchAddress(
        patch: Partial<
            Pick<
                BookingFormData,
                | 'client_region'
                | 'client_province'
                | 'client_city_municipality'
                | 'client_barangay'
                | 'client_zip_code'
                | 'client_street_address'
            >
        >,
    ) {
        const next = {
            client_region: data.client_region,
            client_province: data.client_province,
            client_city_municipality: data.client_city_municipality,
            client_barangay: data.client_barangay,
            client_zip_code: data.client_zip_code,
            client_street_address: data.client_street_address,
            ...patch,
        };

        replaceData({
            ...data,
            ...next,
            client_address: composePhilippinesAddress(next),
        });
    }

    const selectedVenues = selectedAreaKeys.map(selectedVenueByKey);
    const selectedCapacityGuide = selectedCapacityLabel(selectedAreaKeys);
    const selectedAreaSignature = selectedAreaKeys.join('|');
    const availabilityScopeLabel =
        selectedAreaKeys.length === 1
            ? availabilityAreaLabel(selectedAreaKeys[0])
            : selectedAreaKeys.map(availabilityAreaLabel).join(' + ');
    const scheduleTotalHours = totalHours(scheduleSelections);
    const scheduleTotalDays = scheduleSelections.length;
    const selectedDressingRoomCharge = dressingRoomCharge(
        data.estimated_other_rentals,
        scheduleTotalDays,
    );
    const estimatedBaseTotal =
        baseTotal(scheduleSelections, selectedAreaKeys) +
        selectedDressingRoomCharge;
    const hiddenDiscount = finalDiscountPreview(
        scheduleSelections,
        selectedAreaKeys,
        ingressPrep,
        data.organization_type,
        selectedDressingRoomCharge,
    );
    const finalEstimatedTotal = Math.max(
        0,
        estimatedBaseTotal - hiddenDiscount,
    );
    const baseRequiredDownPayment = Math.round(finalEstimatedTotal * 0.5);
    const paymentTotalIncludingBond = finalEstimatedTotal + REQUIRED_BOND;
    const requiredDownPayment = baseRequiredDownPayment + REQUIRED_BOND;
    const finalBalance = Math.max(
        0,
        paymentTotalIncludingBond - requiredDownPayment,
    );
    const backHref =
        editing && booking?.id
            ? bookingShowPath(role, booking.id)
            : bookingBasePath(role);

    useEffect(() => {
        const first = scheduleSelections[0] ?? firstSelection;
        const last = scheduleSelections[scheduleSelections.length - 1] ?? first;
        const month = coveredMonthFromDate(first.date);
        setData('booking_date_from', buildBookingDateFrom(first));
        setData('booking_date_to', buildBookingDateTo(last));
        setData('covered_month', month);
        setData('number_of_hours', String(scheduleTotalHours));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheduleSelections, scheduleTotalHours]);

    useEffect(() => {
        const ids = serviceIdsForAreas(services, selectedAreaKeys);
        setData('service_id', ids[0] ?? '');
        setData(
            'items',
            ids.map((service_id) => ({ service_id, quantity: 1 })),
        );
        setData('selected_area_keys', selectedAreaKeys);
        setData(
            'selected_package_code',
            packageMode === 'packages' ? selectedPackageCode : '',
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAreaKeys, selectedPackageCode, packageMode, services]);

    useEffect(() => {
        setData(
            'estimated_additional_charges',
            String(selectedDressingRoomCharge),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDressingRoomCharge]);

    useEffect(() => {
        scrollToCurrentStep();
    }, [activeStep]);

    useEffect(() => {
        if (draftDiscardingRef.current) return;
        if (!draftAutosaveSnapshot || leavePrompt) return;
        if (draftAutosaveSnapshot === lastDraftSnapshotRef.current) return;

        const timer = window.setTimeout(() => {
            void saveBookingDraft('auto', draftAutosaveSnapshot);
        }, 10000);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftAutosaveSnapshot, leavePrompt]);

    useEffect(() => {
        if (!leavePrompt && !floatingNotice) return;

        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousBodyOverflow = document.body.style.overflow;
        const previousBodyOverscroll = document.body.style.overscrollBehavior;

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';

        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.overflow = previousBodyOverflow;
            document.body.style.overscrollBehavior = previousBodyOverscroll;
        };
    }, [floatingNotice, leavePrompt]);

    useEffect(() => {
        const shouldWarnBeforeUnload = () =>
            !bypassLeavePromptRef.current && hasUnsavedDraftChanges();
        const shouldPromptInAppExit = () =>
            !bypassLeavePromptRef.current &&
            !draftDiscardingRef.current &&
            !editing &&
            !submitted &&
            hasMeaningfulDraftData();
        const message =
            draftSaveState === 'saving'
                ? 'Your booking draft is still saving. Wait for it to finish before closing this tab.'
                : 'Your booking is still in progress. Review your draft before closing this tab.';

        const beforeUnload = (event: BeforeUnloadEvent) => {
            if (!shouldWarnBeforeUnload()) return;
            event.preventDefault();
            event.returnValue = message;
            return message;
        };

        const offBefore = router.on('before', (event) => {
            if (!shouldPromptInAppExit()) return;

            const visit = event.detail.visit as {
                url: URL | string;
                method?: string;
            };
            const targetUrl = visit.url;
            const target =
                targetUrl instanceof URL ? targetUrl.href : String(targetUrl);

            if (target === window.location.href) return;

            setLeavePrompt({
                url: target,
                method: visitMethod(visit.method),
                saving: false,
            });
            return false;
        });

        window.addEventListener('beforeunload', beforeUnload);

        return () => {
            offBefore();
            window.removeEventListener('beforeunload', beforeUnload);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftAutosaveSnapshot, draftSaveState, editing, submitted]);

    useEffect(() => {
        const serverErrors = Object.values(
            errors as Record<string, string>,
        ).filter(Boolean);

        if (serverErrors.length > 0) {
            showFloatingNotice(
                'Please check the form',
                String(serverErrors[0]),
                'error',
            );
        }
    }, [errors]);

    useEffect(() => {
        const month = monthQueryValue(calendarCursor);
        const areaLabels =
            selectedAreaKeys.length > 0
                ? selectedAreaKeys.map(availabilityAreaLabel)
                : [''];
        const controller = new AbortController();
        let cancelled = false;

        setCalendarAvailabilityLoading(true);
        setCalendarAvailabilityError(null);

        Promise.all(
            areaLabels.map(async (areaLabel) => {
                const response = await fetch(
                    buildCalendarMonthUrl(month, areaLabel),
                    {
                        headers: { Accept: 'application/json' },
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error(
                        `Unable to check ${areaLabel || 'calendar'} availability.`,
                    );
                }

                return response.json() as Promise<{
                    days?: AvailabilityApiDay[];
                }>;
            }),
        )
            .then((payloads) => {
                if (cancelled) return;

                const next: CalendarAvailabilityMap = {};
                payloads.forEach((payload) => {
                    (payload.days ?? []).forEach((rawDay) => {
                        const normalizedDay = normalizeAvailabilityDay(rawDay);
                        if (!normalizedDay) return;
                        next[normalizedDay.date] = next[normalizedDay.date]
                            ? mergeDayAvailability(
                                  next[normalizedDay.date],
                                  normalizedDay,
                              )
                            : normalizedDay;
                    });
                });

                setCalendarAvailability(next);
            })
            .catch((error: unknown) => {
                if (
                    cancelled ||
                    (error instanceof DOMException &&
                        error.name === 'AbortError')
                )
                    return;
                setCalendarAvailability({});
                setCalendarAvailabilityError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to verify calendar availability.',
                );
            })
            .finally(() => {
                if (!cancelled) setCalendarAvailabilityLoading(false);
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [calendarCursor, selectedAreaKeys, selectedAreaSignature]);

    useEffect(() => {
        if (calendarAvailabilityLoading || scheduleSelections.length === 0) {
            return;
        }

        setScheduleSelections((current) => {
            const ordered = [...current].sort((left, right) =>
                compareDate(left.date, right.date),
            );
            const next: ScheduleSelection[] = [];

            for (const row of ordered) {
                if (
                    next.length > 0 &&
                    row.date !== addDays(next[next.length - 1].date, 1)
                ) {
                    break;
                }

                const normalized = normalizeSelectionForKnownAvailability(row);

                if (!normalized) {
                    break;
                }

                next.push(normalized);
            }

            if (sameScheduleSelections(ordered, next)) {
                return current;
            }

            setRangeAnchor(next[0]?.date ?? null);
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calendarAvailability, calendarAvailabilityLoading]);

    useEffect(() => {
        if (
            editing ||
            userAdjustedSchedule ||
            autoDefaultScheduleDone ||
            calendarAvailabilityLoading
        ) {
            return;
        }

        const currentSelection = scheduleSelections[0];

        if (!currentSelection) {
            return;
        }

        const currentAvailability = calendarAvailability[currentSelection.date];

        if (!currentAvailability || currentAvailability.canProceed === null) {
            return;
        }

        if (
            !selectionAvailabilityProblem(currentSelection, currentAvailability)
        ) {
            setAutoDefaultScheduleDone(true);
            return;
        }

        const candidate = daysForMonth(calendarCursor)
            .filter((day) => day.inMonth && !isPastDate(day.date))
            .map((day) => ({
                date: day.date,
                block: defaultBlockForAvailability(
                    calendarAvailability[day.date],
                ),
            }))
            .find((day): day is { date: string; block: ScheduleBlock } =>
                Boolean(day.block),
            );

        if (!candidate) {
            return;
        }

        setScheduleSelections([
            {
                date: candidate.date,
                block: candidate.block,
                additionalHours: 0,
            },
        ]);
        setRangeAnchor(candidate.date);
        setAutoDefaultScheduleDone(true);
        setStepErrors((current) => {
            if (!current.schedule) return current;
            const next = { ...current };
            delete next.schedule;
            return next;
        });
    }, [
        autoDefaultScheduleDone,
        calendarAvailability,
        calendarAvailabilityLoading,
        calendarCursor,
        editing,
        scheduleSelections,
        userAdjustedSchedule,
    ]);

    function normalizeSelection(row: ScheduleSelection): ScheduleSelection {
        const additionalHours =
            row.block === 'am'
                ? 0
                : Math.max(
                      0,
                      Math.min(
                          MAX_ADDITIONAL_HOURS,
                          Number(row.additionalHours || 0),
                      ),
                  );
        return { ...row, additionalHours };
    }

    function normalizeSelectionForKnownAvailability(
        row: ScheduleSelection,
    ): ScheduleSelection | null {
        const availability = calendarAvailability[row.date];

        if (!availability || availability.canProceed === null) {
            return normalizeSelection(row);
        }

        let next = normalizeSelection(row);

        if (!isScheduleBlockAvailable(availability, next.block)) {
            const fallbackBlock = defaultBlockForAvailability(availability);

            if (!fallbackBlock) {
                return null;
            }

            next = { ...next, block: fallbackBlock, additionalHours: 0 };
        }

        if (next.block === 'am' || availability.eve.available !== true) {
            next = { ...next, additionalHours: 0 };
        }

        return normalizeSelection(next);
    }

    function sameScheduleSelections(
        left: ScheduleSelection[],
        right: ScheduleSelection[],
    ): boolean {
        return (
            left.length === right.length &&
            left.every((row, index) => {
                const other = right[index];

                return (
                    other &&
                    row.date === other.date &&
                    row.block === other.block &&
                    Number(row.additionalHours || 0) ===
                        Number(other.additionalHours || 0)
                );
            })
        );
    }

    function patchSelection(date: string, patch: Partial<ScheduleSelection>) {
        setUserAdjustedSchedule(true);
        setAutoDefaultScheduleDone(true);
        setScheduleSelections((current) =>
            current.map((row) =>
                row.date === date
                    ? normalizeSelection({ ...row, ...patch })
                    : row,
            ),
        );
    }

    function removeLastScheduleDate(date: string) {
        setUserAdjustedSchedule(true);
        setAutoDefaultScheduleDone(true);
        setScheduleSelections((current) => {
            if (
                current.length <= 1 ||
                current[current.length - 1]?.date !== date
            ) {
                return current;
            }

            const next = current.slice(0, -1);
            setRangeAnchor(next[0]?.date ?? null);
            return next;
        });
    }

    function clearScheduleDates() {
        setUserAdjustedSchedule(true);
        setAutoDefaultScheduleDone(true);
        setRangeAnchor(null);
        setScheduleSelections([]);
    }

    function selectCalendarDate(date: string) {
        setUserAdjustedSchedule(true);
        setAutoDefaultScheduleDone(true);

        const availability =
            calendarAvailability[date] ?? emptyDayAvailability(date);
        const nextSelection = defaultSelectionForAvailability(
            date,
            availability,
        );

        if (!nextSelection) {
            showFloatingNotice(
                'Date is unavailable',
                `${displayDate(date)} cannot be selected for a new reservation. Choose a date with an available AM or PM block.`,
                'error',
            );
            return;
        }

        setScheduleSelections((current) => {
            const ordered = [...current].sort((left, right) =>
                compareDate(left.date, right.date),
            );
            const existingIndex = ordered.findIndex((row) => row.date === date);

            if (existingIndex >= 0) {
                if (ordered.length === 1) {
                    setRangeAnchor(null);
                    setFloatingNotice(null);
                    return [];
                }

                if (existingIndex === ordered.length - 1) {
                    const next = ordered.slice(0, -1);
                    setRangeAnchor(next[0]?.date ?? null);
                    setFloatingNotice(null);
                    return next;
                }

                if (existingIndex === 0) {
                    setRangeAnchor(null);
                    setFloatingNotice(null);
                    return [];
                }

                return ordered;
            }

            if (!ordered.length) {
                setRangeAnchor(date);
                setFloatingNotice(null);
                return [nextSelection];
            }

            const expectedNextDate = addDays(
                ordered[ordered.length - 1].date,
                1,
            );

            if (date !== expectedNextDate) {
                showFloatingNotice(
                    'Choose the next date',
                    `Select ${displayDate(expectedNextDate)} next to keep the booking continuous. Clear the selected dates if you need a different start date.`,
                    'info',
                );
                return ordered;
            }

            const next = [...ordered, nextSelection];
            setRangeAnchor(next[0]?.date ?? null);
            setFloatingNotice(null);
            return next;
        });
    }

    function choosePackage(pkg: ActivePackage) {
        const error = fullMainCombinationError(pkg.areaKeys);

        if (error) {
            showFloatingNotice('Package cannot be selected', error, 'error');
            return;
        }

        setFloatingNotice(null);
        setPackageMode('packages');
        setSelectedPackageCode(pkg.code);
        setSelectedAreaKeys(pkg.areaKeys);
    }

    function toggleArea(key: ActiveVenueKey) {
        setPackageMode('manual');
        setSelectedPackageCode('');
        setSelectedAreaKeys((current) => {
            if (current.includes(key)) {
                const next = current.filter((item) => item !== key);
                setFloatingNotice(null);
                return next;
            }

            const next = [...current, key];
            const error = fullMainCombinationError(next);

            if (error) {
                showFloatingNotice(
                    'This combination is not allowed',
                    error,
                    'error',
                );
                return current;
            }

            setFloatingNotice(null);
            return next;
        });
    }

    function validateStep(step = activeStep): boolean {
        const nextErrors: Record<string, string> = {};
        if (step === 0) {
            if (scheduleSelections.length < 1)
                nextErrors.schedule = 'Select at least one reservation date.';
            scheduleSelections.forEach((row) => {
                if (row.additionalHours > MAX_ADDITIONAL_HOURS)
                    nextErrors.schedule =
                        'Additional hours must not exceed 5 hours.';
                if (row.block === 'am' && Number(row.additionalHours || 0) > 0)
                    nextErrors.schedule =
                        'Additional hours are available only for PM or Whole Day reservations.';
                const availabilityProblem = selectionAvailabilityProblem(
                    row,
                    calendarAvailability[row.date],
                );
                if (availabilityProblem)
                    nextErrors.schedule = availabilityProblem;
            });
            for (let index = 1; index < scheduleSelections.length; index += 1) {
                if (
                    scheduleSelections[index].date !==
                    addDays(scheduleSelections[index - 1].date, 1)
                ) {
                    nextErrors.schedule =
                        'Selected reservation dates must be continuous with no skipped dates.';
                    break;
                }
            }
        }
        if (step === 1) {
            if (selectedAreaKeys.length < 1)
                nextErrors.selected_area_keys =
                    'Choose at least one active BCCC service.';
            const combinationError = fullMainCombinationError(selectedAreaKeys);
            if (combinationError)
                nextErrors.selected_area_keys = combinationError;
        }
        if (step === 2) {
            if (!cleanValue(data.type_of_event))
                nextErrors.type_of_event = 'Event name is required.';
            if (!cleanValue(data.company_name))
                nextErrors.company_name = 'Organization name is required.';
            if (!cleanValue(data.client_name))
                nextErrors.client_name = 'Contact person is required.';
            if (!cleanValue(data.client_contact_number))
                nextErrors.client_contact_number =
                    'Contact number is required.';
            if (!/^\d{11}$/.test(digitsOnly(data.client_contact_number)))
                nextErrors.client_contact_number =
                    'Use numbers only, exactly 11 digits.';
            if (!cleanValue(data.client_email))
                nextErrors.client_email = 'Email address is required.';
            if (!cleanValue(data.client_region))
                nextErrors.client_address = 'Select the organizer region.';
            if (!cleanValue(data.client_province))
                nextErrors.client_address =
                    'Select the organizer province/district.';
            if (!cleanValue(data.client_city_municipality))
                nextErrors.client_address = 'Enter the city or municipality.';
            if (!cleanValue(data.client_barangay))
                nextErrors.client_address = 'Enter the barangay.';
            if (!cleanValue(data.number_of_guests))
                nextErrors.number_of_guests =
                    'Expected attendance is required.';
            if (data.event_nature === 'public') {
                if (!data.classification_of_event)
                    nextErrors.classification_of_event =
                        'Classification is required for Government/MICE events.';
                if (!data.mice_type_of_event)
                    nextErrors.mice_type_of_event =
                        'MICE event type is required for Government/MICE events.';
                if (!cleanValue(data.foreign_attendees))
                    nextErrors.foreign_attendees =
                        'Foreign attendee count is required. Enter 0 when there are none.';
                if (!cleanValue(data.domestic_attendees))
                    nextErrors.domestic_attendees =
                        'Domestic attendee count is required.';
                if (!cleanValue(data.total_number_of_countries))
                    nextErrors.total_number_of_countries =
                        'Total number of countries is required.';
                if (!cleanValue(data.countries_breakdown_text))
                    nextErrors.countries_breakdown_text =
                        'Country breakdown is required.';
                if (
                    data.has_exhibitions === 'Yes' &&
                    (!cleanValue(data.exhibitors_count) ||
                        !cleanValue(data.visitors_count))
                ) {
                    nextErrors.exhibitors_count =
                        'Exhibitor and visitor counts are required when exhibitions is Yes.';
                }

                const requiredMiceFields: Array<
                    [keyof BookingFormData, string]
                > = [
                    ['enterprise_group', 'Enterprise group'],
                    ['btc_group_code', 'BTC group code'],
                    ['event_category', 'Event category'],
                    ['local_male_participants', 'Local male participants'],
                    ['local_female_participants', 'Local female participants'],
                    [
                        'domestic_male_participants',
                        'Domestic male participants',
                    ],
                    [
                        'domestic_female_participants',
                        'Domestic female participants',
                    ],
                    ['foreign_male_participants', 'Foreign male participants'],
                    [
                        'foreign_female_participants',
                        'Foreign female participants',
                    ],
                    ['main_origin_country', 'Main origin country'],
                    ['main_origin_province', 'Main origin province'],
                    ['main_origin_city', 'Main origin city'],
                    ['same_day_visitors', 'Same-day visitors'],
                    ['overnight_visitors', 'Overnight visitors'],
                    ['estimated_room_nights', 'Estimated room nights'],
                    [
                        'estimated_tourism_receipts',
                        'Estimated tourism receipts',
                    ],
                    ['total_employees', 'Total employees'],
                    ['female_employees', 'Female employees'],
                    ['male_employees', 'Male employees'],
                    ['permit_to_engage', 'Permit to engage'],
                    ['dot_accredited', 'DOT accreditation'],
                    ['active_member', 'Active membership'],
                    ['remarks', 'Remarks'],
                ];
                const missingMiceField = requiredMiceFields.find(
                    ([field]) => !cleanValue(data[field]),
                );

                if (missingMiceField)
                    nextErrors.mice_report = `${missingMiceField[1]} is required for a public MICE report. Enter 0 or N/A when applicable.`;

                const participantBreakdownTotal = [
                    data.local_male_participants,
                    data.local_female_participants,
                    data.domestic_male_participants,
                    data.domestic_female_participants,
                    data.foreign_male_participants,
                    data.foreign_female_participants,
                ].reduce((total, value) => total + Number(value || 0), 0);
                const domesticBreakdownTotal = [
                    data.local_male_participants,
                    data.local_female_participants,
                    data.domestic_male_participants,
                    data.domestic_female_participants,
                ].reduce((total, value) => total + Number(value || 0), 0);
                const foreignBreakdownTotal =
                    Number(data.foreign_male_participants || 0) +
                    Number(data.foreign_female_participants || 0);
                const employeeBreakdownTotal =
                    Number(data.female_employees || 0) +
                    Number(data.male_employees || 0);

                if (participantBreakdownTotal !== Number(data.number_of_guests))
                    nextErrors.mice_participants =
                        'The participant breakdown must equal the expected attendance.';
                else if (
                    domesticBreakdownTotal !== Number(data.domestic_attendees)
                )
                    nextErrors.mice_participants =
                        'Local plus domestic participant breakdown must equal domestic attendees.';
                else if (
                    foreignBreakdownTotal !== Number(data.foreign_attendees)
                )
                    nextErrors.mice_participants =
                        'Foreign male plus foreign female participants must equal foreign attendees.';

                if (employeeBreakdownTotal !== Number(data.total_employees))
                    nextErrors.mice_employees =
                        'Female plus male employees must equal total employees.';
            }
        }
        if (step === 3) {
            if (!data.policy_acknowledged)
                nextErrors.policy_acknowledged =
                    'Please confirm the booking policy and house rules.';
            if (!data.accuracy_acknowledged)
                nextErrors.accuracy_acknowledged =
                    'Please confirm the accuracy of the reservation details.';
        }
        setStepErrors(nextErrors);

        const firstError = Object.values(nextErrors)[0];

        if (firstError) {
            showFloatingNotice(
                'Please check this step before continuing',
                firstError,
                'error',
            );
            return false;
        }

        setFloatingNotice(null);
        return true;
    }

    function validateSubmissionSteps(): boolean {
        for (const step of [0, 1, 2, 3]) {
            if (!validateStep(step)) {
                setActiveStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return false;
            }
        }

        return true;
    }

    function goNext() {
        if (!validateStep()) return;
        setActiveStep((current) => Math.min(3, current + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function goBack() {
        setStepErrors({});
        setActiveStep((current) => Math.max(0, current - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function submitReservation() {
        if (!validateSubmissionSteps()) return;

        const combinationError = fullMainCombinationError(selectedAreaKeys);

        if (combinationError) {
            setStepErrors({ selected_area_keys: combinationError });
            setActiveStep(1);
            showFloatingNotice(
                'This combination is not allowed',
                combinationError,
                'error',
            );
            return;
        }

        const first = scheduleSelections[0];
        const last = scheduleSelections[scheduleSelections.length - 1];

        if (!first || !last) {
            setStepErrors({
                schedule:
                    'Select at least one reservation date before submitting.',
            });
            setActiveStep(0);
            showFloatingNotice(
                'Schedule is required',
                'Select at least one reservation date before submitting.',
                'error',
            );
            return;
        }

        const serviceIds = serviceIdsForAreas(services, selectedAreaKeys);
        const scheduleSegments = scheduleSelections.map((row, index) => ({
            date: row.date,
            segment_role:
                ingressPrep && index === 0
                    ? ('ingress' as const)
                    : ingressPrep && index === scheduleSelections.length - 1
                      ? ('egress' as const)
                      : ('event' as const),
            has_ingress_label: ingressPrep && index === 0,
            has_egress_label:
                ingressPrep && index === scheduleSelections.length - 1,
            base_block: row.block,
            additional_hours: row.block === 'am' ? 0 : row.additionalHours,
            area_keys: selectedAreaKeys,
        }));
        const scheduleMeta = {
            selected_dates: scheduleSelections,
            selected_date_count: scheduleTotalDays,
            total_hours: scheduleTotalHours,
            venue_capacity: selectedCapacityMax(selectedAreaKeys),
            dressing_room_selection: data.estimated_other_rentals || 'none',
            dressing_room_daily_rate: dressingRoomDailyCharge(
                data.estimated_other_rentals,
            ),
            dressing_room_days: scheduleTotalDays,
            dressing_room_charge: selectedDressingRoomCharge,
            ingress_setup_preparation: ingressPrep,
            discount_visibility: 'review_and_admin_only',
        };
        const miceDraft = {
            ...buildMiceDraft(data, scheduleSelections, data.event_nature),
            function_hall_capacity:
                data.event_nature === 'private'
                    ? '-'
                    : String(selectedCapacityMax(selectedAreaKeys) || 2000),
            venue_capacity: selectedCapacityGuide,
            dressing_room_selection: data.estimated_other_rentals || 'none',
            dressing_room_label: dressingRoomLabel(
                data.estimated_other_rentals,
            ),
            dressing_room_daily_rate: dressingRoomDailyCharge(
                data.estimated_other_rentals,
            ),
            dressing_room_days: scheduleTotalDays,
            dressing_room_charge: selectedDressingRoomCharge,
        };
        const chosenPackageName =
            packageMode === 'packages'
                ? selectedPackage?.label
                : 'Manual active service selection';
        const finalDiscountBreakdown = finalDiscountLines(
            scheduleSelections,
            selectedAreaKeys,
            ingressPrep,
            data.organization_type,
            selectedDressingRoomCharge,
        );

        transform((current) => ({
            ...current,
            computation_stage: 'review',
            show_discounts: true,
            booking_draft_key: draftKey || current.booking_draft_key || '',
            draft_key: draftKey || current.draft_key || '',
            service_id: serviceIds[0] ?? current.service_id,
            items: serviceIds.map((service_id) => ({
                service_id,
                quantity: 1,
            })),
            selected_area_keys: selectedAreaKeys,
            selected_package_code:
                packageMode === 'packages' ? selectedPackageCode : '',
            booking_date_from: buildBookingDateFrom(first),
            booking_date_to: buildBookingDateTo(last),
            schedule_version: 'segments_v1',
            schedule_meta: scheduleMeta,
            schedule_segments: scheduleSegments,
            event_nature: current.event_nature,
            event_scope:
                current.event_nature === 'public'
                    ? 'GOVERNMENT EVENT'
                    : 'PRIVATE/PERSONAL EVENT',
            mice_required: current.event_nature === 'public',
            private_event_type:
                current.event_nature === 'private'
                    ? current.private_event_type || 'PRIVATE/PERSONAL EVENT'
                    : '',
            mice_exemption_reason:
                current.event_nature === 'private'
                    ? 'PRIVATE/PERSONAL EVENT'
                    : '',
            function_halls_count:
                current.event_nature === 'private' ? '-' : '1',
            function_hall_capacity:
                current.event_nature === 'private'
                    ? String(selectedCapacityMax(selectedAreaKeys) || '-')
                    : String(selectedCapacityMax(selectedAreaKeys) || 2000),
            number_of_hours: String(scheduleTotalHours),
            company_name: upper(current.company_name),
            client_name: upper(current.client_name),
            client_address: composePhilippinesAddress(current),
            client_street_address: upper(current.client_street_address),
            head_of_organization: upper(current.head_of_organization),
            type_of_event: upper(current.type_of_event),
            client_contact_number: digitsOnly(current.client_contact_number),
            client_email: cleanValue(current.client_email).toLowerCase(),
            comments_feedback: cleanValue(current.comments_feedback, 'N/A'),
            has_exhibitions:
                current.event_nature === 'private'
                    ? '-'
                    : current.has_exhibitions,
            exhibitors_count:
                current.event_nature === 'private'
                    ? '-'
                    : current.has_exhibitions === 'Yes'
                      ? current.exhibitors_count
                      : '0',
            visitors_count:
                current.event_nature === 'private'
                    ? '-'
                    : current.has_exhibitions === 'Yes'
                      ? current.visitors_count
                      : '0',
            foreign_attendees:
                current.event_nature === 'private'
                    ? '-'
                    : current.foreign_attendees || '0',
            domestic_attendees:
                current.event_nature === 'private'
                    ? '-'
                    : current.domestic_attendees || '0',
            total_number_of_countries:
                current.event_nature === 'private'
                    ? '-'
                    : current.total_number_of_countries || '1',
            countries_breakdown_text:
                current.event_nature === 'private'
                    ? '-'
                    : upper(current.countries_breakdown_text || 'PHILIPPINES'),
            mice_payload: miceDraft,
            payment_meta: {
                ...(typeof current.payment_meta === 'object' &&
                current.payment_meta !== null
                    ? current.payment_meta
                    : {}),
                active_charge_scope:
                    'FULL_HALL_MAIN_HALL_LED_WALL_LOUNGE_BOARDROOM_ONLY',
                excluded_charge_items: [
                    'LOBBY_STANDALONE',
                    'BASEMENT',
                    'SHOP_RENTALS',
                    'CATERING_MAINTENANCE',
                    'AIRCONDITIONING',
                    'STATIONERY_KIT',
                    'ORDINANCE_SPECIAL_PACKAGES',
                ],
                selected_package_code:
                    packageMode === 'packages' ? selectedPackageCode : null,
                selected_package_name: chosenPackageName,
                selected_area_keys: selectedAreaKeys,
                selected_area_labels: selectedVenues.map(
                    (venue) => venue.shortLabel,
                ),
                capacity_guide: selectedCapacityGuide,
                venue_capacity: selectedCapacityMax(selectedAreaKeys),
                dressing_room_selection:
                    current.estimated_other_rentals || 'none',
                dressing_room_label: dressingRoomLabel(
                    current.estimated_other_rentals,
                ),
                dressing_room_daily_rate: dressingRoomDailyCharge(
                    current.estimated_other_rentals,
                ),
                dressing_room_days: scheduleTotalDays,
                dressing_room_charge: selectedDressingRoomCharge,
                schedule: scheduleMeta,
                schedule_segments: scheduleSegments,
                event_scope:
                    current.event_nature === 'public'
                        ? 'GOVERNMENT EVENT'
                        : 'PRIVATE/PERSONAL EVENT',
                organization_type: current.organization_type,
                government_discount_rate: isGovernmentOrganizationType(
                    current.organization_type,
                )
                    ? 0.5
                    : 0,
                mice_draft: miceDraft,
                computation_stage: 'review',
                show_discounts: true,
                discounts_visible: true,
                estimated_base_total: estimatedBaseTotal,
                hidden_discount_preview: hiddenDiscount,
                discount_total: hiddenDiscount,
                discount_lines: finalDiscountBreakdown,
                final_estimated_total: finalEstimatedTotal,
                estimated_total: finalEstimatedTotal,
                grand_total: finalEstimatedTotal,
                total_payable: finalEstimatedTotal,
                venue_total: finalEstimatedTotal,
                payment_total_including_bond: paymentTotalIncludingBond,
                total_with_bond: paymentTotalIncludingBond,
                base_required_down_payment: baseRequiredDownPayment,
                required_down_payment: requiredDownPayment,
                required_bond: REQUIRED_BOND,
                bond_amount: REQUIRED_BOND,
                balance_after_down_payment: finalBalance,
                discount_note: hiddenDiscountNote(),
                reservation_notes: current.reservation_notes,
            },
            estimated_usage: scheduleSelections.some(
                (row) => row.block === 'whole_day',
            )
                ? 'whole_day'
                : 'half_day',
            estimated_duration_hours: String(scheduleTotalHours),
            dressing_room_selection: current.estimated_other_rentals || 'none',
            dressing_room_charge: selectedDressingRoomCharge,
            estimated_other_rentals: dressingRoomLabel(
                current.estimated_other_rentals,
            ),
            estimated_additional_charges: String(selectedDressingRoomCharge),
        }));

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => {
                bypassLeavePromptRef.current = true;
            },
            onSuccess: () => {
                setSubmitted(true);
                setActiveStep(4);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onError: () => {
                bypassLeavePromptRef.current = false;
            },
            onCancel: () => {
                bypassLeavePromptRef.current = false;
            },
        };

        bypassLeavePromptRef.current = true;

        if (editing && booking?.id) {
            put(`${bookingBasePath(role)}/${booking.id}`, options);
            return;
        }

        const createPath =
            role === 'admin'
                ? '/admin/bookings'
                : role === 'staff'
                  ? '/staff/bookings'
                  : '/book';
        post(createPath, options);
    }

    function openFinalPolicyModal() {
        if (!validateSubmissionSteps()) return;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setPolicyModalChecked(false);
        setShowPolicyModal(true);
    }

    function confirmFinalPolicyAndSubmit() {
        if (!policyModalChecked) return;
        setShowPolicyModal(false);
        submitReservation();
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (activeStep < 3) {
            goNext();
            return;
        }
        openFinalPolicyModal();
    }

    function renderStepActions() {
        if (submitted || activeStep >= 4) return null;

        return (
            <div className="bccc-booking-aside-actions border-t border-slate-200 bg-white p-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.24em] text-[#a88633] uppercase">
                        {STEPS[activeStep]?.label}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                        {scheduleTotalDays} day(s), {scheduleTotalHours}{' '}
                        hour(s),{' '}
                        {selectedVenues
                            .map((venue) => venue.shortLabel)
                            .join(' + ')}
                    </p>
                    {!editing && !submitted ? (
                        <p
                            className={cx(
                                'mt-1 text-xs font-semibold',
                                draftSaveState === 'error'
                                    ? 'text-red-600'
                                    : 'text-slate-500',
                            )}
                        >
                            {draftSaveState === 'saving'
                                ? 'Saving draft...'
                                : draftSaveState === 'saved'
                                  ? `Draft saved${draftSavedAt ? ` at ${displayDateTime(draftSavedAt)}` : ''}`
                                  : draftSaveState === 'error'
                                    ? 'Draft could not be saved. Save it before leaving.'
                                    : 'Draft saving starts after you enter booking details.'}
                        </p>
                    ) : null}
                </div>
                <div className="bccc-booking-action-buttons mt-3 grid gap-2 sm:grid-cols-[auto_1fr] lg:grid-cols-1 2xl:grid-cols-[auto_1fr]">
                    {activeStep > 0 ? (
                        <button
                            type="button"
                            onClick={goBack}
                            className="min-h-11 border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.16em] text-slate-700 uppercase transition hover:border-[#164734] hover:text-[#164734]"
                        >
                            Back
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        disabled={
                            processing ||
                            (activeStep === 3 &&
                                (!data.policy_acknowledged ||
                                    !data.accuracy_acknowledged))
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#164734] px-5 py-3 text-sm font-semibold tracking-[0.16em] text-white uppercase transition hover:bg-[#0f3325] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : activeStep === 3 ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <ArrowRight className="h-4 w-4" />
                        )}
                        {activeStep === 3
                            ? 'Submit Reservation'
                            : 'Save & Continue'}
                    </button>
                </div>
            </div>
        );
    }

    function renderScheduleStep() {
        const monthDays = daysForMonth(calendarCursor);
        const selectedDates = new Set(
            scheduleSelections.map((row) => row.date),
        );
        const firstSelectedDate = scheduleSelections[0]?.date ?? null;
        const lastSelectedDate =
            scheduleSelections[scheduleSelections.length - 1]?.date ?? null;
        const nextAllowedDate = lastSelectedDate
            ? addDays(lastSelectedDate, 1)
            : null;
        const today = todayDate();
        const monthAvailabilityNote = calendarAvailabilityLoading
            ? `Checking AM / PM availability for ${availabilityScopeLabel || 'selected service scope'}...`
            : calendarAvailabilityError
              ? calendarAvailabilityError
              : `Date colors show availability for ${availabilityScopeLabel || 'selected service scope'}: green is full day, yellow is half day, and red is unavailable, EVE-only, or fully booked. Choose AM, PM, Whole day, and additional hours in the Selected Dates summary.`;

        return (
            <SectionShell
                kicker="Step 01 · Schedule"
                title="Choose the reservation dates first"
                description="Select the first date, then add each following day one at a time. The calendar prevents skipped dates and the selected dates stay checked and highlighted."
                icon={<CalendarDays className="h-4 w-4" />}
            >
                <div className="bccc-booking-step-layout bccc-booking-schedule-layout grid min-h-[680px] gap-4 p-4 lg:grid-cols-[minmax(0,2.6fr)_minmax(420px,1fr)] 2xl:grid-cols-[minmax(0,3fr)_minmax(460px,1fr)]">
                    <div className="bccc-booking-calendar-panel bccc-booking-schedule-main border border-slate-200 bg-slate-50/70 p-3">
                        <div className="bccc-booking-calendar-toolbar mb-3 flex items-center justify-between border border-slate-200 bg-white px-3 py-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setCalendarCursor((current) =>
                                        shiftMonth(current, -1),
                                    )
                                }
                                className="grid h-10 w-10 place-items-center border border-slate-200 bg-white transition hover:border-[#164734] hover:text-[#164734]"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="text-center">
                                <p className="text-[11px] font-semibold tracking-[0.28em] text-[#a88633] uppercase">
                                    BCCC Calendar
                                </p>
                                <h3 className="text-xl font-semibold text-slate-950">
                                    {monthLabel(calendarCursor)}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setCalendarCursor((current) =>
                                        shiftMonth(current, 1),
                                    )
                                }
                                className="grid h-10 w-10 place-items-center border border-slate-200 bg-white transition hover:border-[#164734] hover:text-[#164734]"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div
                            className={cx(
                                'mb-3 border px-3 py-2 text-xs font-medium',
                                calendarAvailabilityError
                                    ? 'border-red-200 bg-red-50 text-red-700'
                                    : 'border-[#d6b56d]/50 bg-[#fff8e6] text-[#164734]',
                            )}
                        >
                            {monthAvailabilityNote}
                        </div>
                        <div
                            className="bccc-booking-calendar-scroll"
                            data-scroll-reset
                        >
                            <div className="bccc-booking-calendar-grid grid grid-cols-7 border-t border-l border-slate-200 bg-white">
                                {[
                                    'Sun',
                                    'Mon',
                                    'Tue',
                                    'Wed',
                                    'Thu',
                                    'Fri',
                                    'Sat',
                                ].map((day) => (
                                    <div
                                        key={day}
                                        className="border-r border-b border-slate-200 bg-[#164734] px-2 py-2 text-center text-[11px] font-semibold tracking-[0.22em] text-white uppercase"
                                    >
                                        {day}
                                    </div>
                                ))}
                                {monthDays.map((day) => {
                                    const isSelected = selectedDates.has(
                                        day.date,
                                    );
                                    const isToday = day.date === today;
                                    const isAnchor = rangeAnchor === day.date;
                                    const dayIsPast = isPastDate(day.date);
                                    const dayAvailability = dayIsPast
                                        ? pastDateAvailability(day.date)
                                        : calendarAvailabilityLoading
                                          ? emptyDayAvailability(
                                                day.date,
                                                'loading',
                                                'Checking AM / PM availability...',
                                            )
                                          : (calendarAvailability[day.date] ??
                                            emptyDayAvailability(day.date));
                                    const dayIsEveOnly =
                                        isEveOnlyAvailability(dayAvailability);
                                    const defaultDaySelection =
                                        defaultSelectionForAvailability(
                                            day.date,
                                            dayAvailability,
                                        );
                                    const dayCannotStartBooking =
                                        dayIsPast ||
                                        dayIsEveOnly ||
                                        dayAvailability.canProceed === false ||
                                        !defaultDaySelection;
                                    const isLastSelected =
                                        lastSelectedDate === day.date;
                                    const canAppendDate =
                                        Boolean(defaultDaySelection) &&
                                        !dayCannotStartBooking &&
                                        (!scheduleSelections.length ||
                                            nextAllowedDate === day.date);
                                    const canInteractWithDay = isSelected
                                        ? isLastSelected ||
                                          firstSelectedDate === day.date
                                        : canAppendDate;
                                    const dayIsLockedBySequence =
                                        !dayCannotStartBooking &&
                                        !isSelected &&
                                        !canAppendDate;
                                    const showIngressBadge =
                                        ingressPrep &&
                                        isSelected &&
                                        firstSelectedDate === day.date;
                                    const showEgressBadge =
                                        ingressPrep &&
                                        isSelected &&
                                        lastSelectedDate === day.date;
                                    const selectionForDay = isSelected
                                        ? scheduleSelections.find(
                                              (row) => row.date === day.date,
                                          )
                                        : null;
                                    const selectedAmAvailable =
                                        isScheduleBlockAvailable(
                                            dayAvailability,
                                            'am',
                                        );
                                    const selectedPmAvailable =
                                        isScheduleBlockAvailable(
                                            dayAvailability,
                                            'pm',
                                        );
                                    const selectedWholeDayAvailable =
                                        isScheduleBlockAvailable(
                                            dayAvailability,
                                            'whole_day',
                                        );
                                    const selectedCanUseAdditionalHours =
                                        Boolean(selectionForDay) &&
                                        (selectionForDay?.block === 'pm' ||
                                            selectionForDay?.block ===
                                                'whole_day') &&
                                        dayAvailability.eve.available === true;
                                    const tileStatus =
                                        bookingCalendarTileStatus(
                                            dayAvailability,
                                        );
                                    const activateDayTile = () => {
                                        if (canInteractWithDay) {
                                            selectCalendarDate(day.date);
                                        }
                                    };
                                    const renderCalendarTimeBlockButton = (
                                        block: ScheduleBlock,
                                        label: string,
                                        available: boolean,
                                    ) => {
                                        const active =
                                            selectionForDay?.block === block;

                                        return (
                                            <button
                                                key={block}
                                                type="button"
                                                data-active={active}
                                                disabled={!available}
                                                onMouseDown={(event) =>
                                                    event.stopPropagation()
                                                }
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    if (!available) return;

                                                    patchSelection(day.date, {
                                                        block,
                                                        additionalHours:
                                                            block === 'am'
                                                                ? 0
                                                                : (selectionForDay?.additionalHours ??
                                                                  0),
                                                    });
                                                }}
                                                className={cx(
                                                    'bccc-booking-calendar-time-button min-h-8 border px-1.5 py-1 text-left text-[9px] font-bold tracking-[0.08em] uppercase transition',
                                                    available &&
                                                        !active &&
                                                        'border-white/20 bg-white/10 text-white hover:bg-white/20',
                                                    available &&
                                                        active &&
                                                        'border-white bg-white text-[#164734] shadow-sm',
                                                    !available &&
                                                        'cursor-not-allowed border-red-200/40 bg-red-500/25 text-red-50 opacity-80',
                                                )}
                                                title={
                                                    available
                                                        ? `${label} is available`
                                                        : `${label} is unavailable`
                                                }
                                            >
                                                <span className="flex items-center justify-between gap-1">
                                                    <span>{label}</span>
                                                    {active && available ? (
                                                        <Check className="h-3 w-3" />
                                                    ) : null}
                                                </span>
                                                <span className="mt-0.5 block text-[8px] font-semibold tracking-normal opacity-80">
                                                    {available
                                                        ? 'Open'
                                                        : 'Blocked'}
                                                </span>
                                            </button>
                                        );
                                    };
                                    const renderInlineCalendarControls = true;

                                    return (
                                        <div
                                            key={day.date}
                                            role={
                                                canInteractWithDay
                                                    ? 'button'
                                                    : undefined
                                            }
                                            tabIndex={
                                                canInteractWithDay
                                                    ? 0
                                                    : undefined
                                            }
                                            aria-disabled={
                                                canInteractWithDay
                                                    ? undefined
                                                    : true
                                            }
                                            aria-pressed={
                                                isSelected ? true : undefined
                                            }
                                            data-availability-state={
                                                tileStatus.state
                                            }
                                            onClick={activateDayTile}
                                            onKeyDown={(event) => {
                                                if (
                                                    !canInteractWithDay ||
                                                    (event.key !== 'Enter' &&
                                                        event.key !== ' ')
                                                ) {
                                                    return;
                                                }

                                                event.preventDefault();
                                                activateDayTile();
                                            }}
                                            title={
                                                dayIsLockedBySequence
                                                    ? nextAllowedDate
                                                        ? `Select ${displayDate(nextAllowedDate)} next to keep dates continuous.`
                                                        : 'Clear selected dates to choose a different start date.'
                                                    : dayCannotStartBooking
                                                      ? dayAvailability.note ||
                                                        'This date is unavailable.'
                                                      : isSelected &&
                                                          isLastSelected &&
                                                          scheduleSelections.length >
                                                              1
                                                        ? 'Remove the last selected date'
                                                        : isSelected &&
                                                            firstSelectedDate ===
                                                                day.date
                                                          ? 'Clear selected dates'
                                                          : tileStatus.title
                                            }
                                            className={cx(
                                                'bccc-booking-calendar-day-tile group relative min-h-[122px] border-r border-b border-slate-200 p-2 text-left transition duration-300 hover:bg-[#fff7df]',
                                                !day.inMonth &&
                                                    'bg-slate-50 text-slate-300',
                                                (dayCannotStartBooking ||
                                                    dayIsLockedBySequence) &&
                                                    'cursor-not-allowed bg-slate-100 text-slate-400 opacity-60 hover:bg-slate-100',
                                                canAppendDate &&
                                                    !isSelected &&
                                                    'bg-white ring-2 ring-[#d6b56d]/45 ring-inset',
                                                canInteractWithDay &&
                                                    'cursor-pointer',
                                                isSelected &&
                                                    !dayIsPast &&
                                                    'min-h-[214px] bg-[#164734] text-white shadow-inner shadow-emerald-950/30 hover:bg-[#164734]',
                                                isAnchor &&
                                                    'ring-2 ring-[#d6b56d] ring-inset',
                                            )}
                                        >
                                            {showIngressBadge ? (
                                                <span className="absolute top-10 left-2 z-10 border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.14em] text-emerald-700 uppercase shadow-sm">
                                                    Ingress
                                                </span>
                                            ) : null}
                                            {showEgressBadge ? (
                                                <span className="absolute top-10 right-2 z-10 border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.14em] text-amber-700 uppercase shadow-sm">
                                                    Egress
                                                </span>
                                            ) : null}
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="flex items-center gap-1.5">
                                                    <span
                                                        className={cx(
                                                            'bccc-booking-calendar-date-number grid h-8 w-8 place-items-center rounded-full text-sm font-semibold shadow-sm',
                                                            isToday &&
                                                                !isSelected
                                                                ? 'bg-[#d6b56d] text-[#164734]'
                                                                : '',
                                                            isSelected &&
                                                                'bg-white text-[#164734]',
                                                        )}
                                                    >
                                                        {Number(
                                                            day.date.slice(-2),
                                                        )}
                                                    </span>
                                                    {isSelected ? (
                                                        <span className="bccc-booking-calendar-selected-check grid h-7 w-7 place-items-center rounded-full border border-white/80 bg-white text-[#164734] shadow-sm">
                                                            <Check className="h-4 w-4" />
                                                        </span>
                                                    ) : null}
                                                </span>
                                                {isSelected &&
                                                (isLastSelected ||
                                                    firstSelectedDate ===
                                                        day.date) ? (
                                                    <span className="grid h-7 w-7 place-items-center rounded-full border border-red-200 bg-red-50 text-red-700 shadow-sm">
                                                        <X className="h-3.5 w-3.5" />
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="bccc-booking-mobile-status-strip absolute right-2 bottom-2 left-2 flex items-end justify-between gap-2">
                                                <span
                                                    className={cx(
                                                        'h-1.5 min-w-0 flex-1 rounded-full shadow-sm',
                                                        tileStatus.badgeClassName,
                                                    )}
                                                    title={tileStatus.title}
                                                    aria-label={
                                                        tileStatus.label
                                                    }
                                                >
                                                    <span className="sr-only">
                                                        {tileStatus.label}
                                                    </span>
                                                </span>

                                                {canAppendDate &&
                                                !isSelected ? (
                                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#d6b56d]/60 bg-white/90 text-[#8a6a2f] shadow-sm transition group-hover:scale-105">
                                                        <Check className="h-3.5 w-3.5" />
                                                    </span>
                                                ) : null}
                                            </div>
                                            {renderInlineCalendarControls &&
                                            selectionForDay ? (
                                                <div
                                                    className={cx(
                                                        'bccc-booking-calendar-time-controls mt-3 grid gap-1.5',
                                                        (showIngressBadge ||
                                                            showEgressBadge) &&
                                                            'pt-5',
                                                    )}
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                >
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        {renderCalendarTimeBlockButton(
                                                            'am',
                                                            'AM',
                                                            selectedAmAvailable,
                                                        )}
                                                        {renderCalendarTimeBlockButton(
                                                            'pm',
                                                            'PM',
                                                            selectedPmAvailable,
                                                        )}
                                                    </div>
                                                    {renderCalendarTimeBlockButton(
                                                        'whole_day',
                                                        'Whole day',
                                                        selectedWholeDayAvailable,
                                                    )}
                                                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(58px,auto)] items-center gap-1.5 border border-white/20 bg-white/10 p-1.5">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-[8px] font-bold tracking-[0.1em] text-white/75 uppercase">
                                                                Additional
                                                            </p>
                                                            <p
                                                                className={cx(
                                                                    'truncate text-[9px] font-semibold',
                                                                    selectedCanUseAdditionalHours
                                                                        ? 'text-emerald-50'
                                                                        : 'text-red-100',
                                                                )}
                                                            >
                                                                EVE{' '}
                                                                {availabilityPillText(
                                                                    dayAvailability
                                                                        .eve
                                                                        .available,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <select
                                                            value={
                                                                selectedCanUseAdditionalHours
                                                                    ? selectionForDay.additionalHours
                                                                    : 0
                                                            }
                                                            onMouseDown={(
                                                                event,
                                                            ) =>
                                                                event.stopPropagation()
                                                            }
                                                            onClick={(event) =>
                                                                event.stopPropagation()
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();
                                                                patchSelection(
                                                                    day.date,
                                                                    {
                                                                        additionalHours:
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                    },
                                                                );
                                                            }}
                                                            disabled={
                                                                !selectedCanUseAdditionalHours
                                                            }
                                                            className={cx(
                                                                'bccc-booking-calendar-extra-select h-8 min-w-[58px] border px-1.5 text-[10px] font-bold transition outline-none',
                                                                selectedCanUseAdditionalHours
                                                                    ? 'border-white bg-white text-[#164734]'
                                                                    : 'cursor-not-allowed border-red-200/30 bg-red-500/20 text-red-50 opacity-75',
                                                            )}
                                                            aria-label={`Additional hours for ${displayDate(day.date)}`}
                                                        >
                                                            {(selectedCanUseAdditionalHours
                                                                ? Array.from(
                                                                      {
                                                                          length:
                                                                              MAX_ADDITIONAL_HOURS +
                                                                              1,
                                                                      },
                                                                      (
                                                                          _,
                                                                          hour,
                                                                      ) => hour,
                                                                  )
                                                                : [0]
                                                            ).map((hour) => (
                                                                <option
                                                                    key={hour}
                                                                    value={hour}
                                                                >
                                                                    {hour}h
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <p className="truncate text-[10px] font-semibold text-white/85">
                                                        {blockLabel(
                                                            selectionForDay.block,
                                                        )}{' '}
                                                        ·{' '}
                                                        {blockBaseHours(
                                                            selectionForDay.block,
                                                        )}
                                                        h +{' '}
                                                        {selectedCanUseAdditionalHours
                                                            ? selectionForDay.additionalHours
                                                            : 0}
                                                        h
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bccc-booking-day-availability mt-3 grid min-w-0 grid-cols-2 gap-1 pb-7">
                                                    {[
                                                        [
                                                            'AM',
                                                            dayAvailability.am,
                                                        ] as const,
                                                        [
                                                            'PM',
                                                            dayAvailability.pm,
                                                        ] as const,
                                                    ].map(([label, block]) => (
                                                        <span
                                                            key={label}
                                                            title={
                                                                block.reason ||
                                                                `${label} ${availabilityPillText(block.available)}`
                                                            }
                                                            className={cx(
                                                                'bccc-booking-calendar-availability-pill flex min-w-0 items-center justify-between gap-1 border px-1 py-1 text-[8px] font-semibold tracking-[0.06em] uppercase transition',
                                                                availabilityPillClasses(
                                                                    block.available,
                                                                    isSelected,
                                                                ),
                                                            )}
                                                        >
                                                            <span className="bccc-booking-availability-label min-w-0">
                                                                {label}
                                                            </span>
                                                            <span className="bccc-booking-availability-text min-w-0 truncate">
                                                                {compactAvailabilityPillText(
                                                                    block.available,
                                                                )}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {renderInlineCalendarControls &&
                                            !isSelected &&
                                            canAppendDate ? (
                                                <span className="bccc-booking-calendar-select-prompt absolute right-2 bottom-2 left-2 truncate border border-[#d6b56d]/50 bg-[#fff8e6] px-2 py-1 text-center text-[10px] font-semibold tracking-[0.16em] text-[#8a6a2f] uppercase">
                                                    Select
                                                </span>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <aside className="bccc-booking-side-panel bccc-booking-schedule-aside sticky top-24 flex h-fit max-h-[calc(100svh-7rem)] flex-col overflow-hidden border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-[#f8f3e6] p-4">
                            <p className="text-[11px] font-semibold tracking-[0.24em] text-[#a88633] uppercase">
                                Selected Dates
                            </p>
                            <div className="mt-1 flex items-center justify-between gap-3">
                                <h3 className="text-lg font-semibold text-slate-950">
                                    {scheduleTotalDays} day(s) ·{' '}
                                    {scheduleTotalHours} hour(s)
                                </h3>
                                {scheduleSelections.length ? (
                                    <button
                                        type="button"
                                        onClick={clearScheduleDates}
                                        className="border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-slate-600 uppercase transition hover:border-red-300 hover:text-red-600"
                                    >
                                        Clear
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        <div
                            className="bccc-booking-selected-dates max-h-[470px] overflow-y-auto p-3"
                            data-scroll-reset
                        >
                            {!scheduleSelections.length ? (
                                <p className="border border-dashed border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-500">
                                    Choose any available start date on the
                                    calendar. The next day will unlock after
                                    each selection.
                                </p>
                            ) : null}
                            {scheduleSelections.map((selection) => {
                                const dayAvailability =
                                    calendarAvailability[selection.date] ??
                                    emptyDayAvailability(selection.date);
                                const amAvailable = isScheduleBlockAvailable(
                                    dayAvailability,
                                    'am',
                                );
                                const pmAvailable = isScheduleBlockAvailable(
                                    dayAvailability,
                                    'pm',
                                );
                                const wholeDayAvailable =
                                    isScheduleBlockAvailable(
                                        dayAvailability,
                                        'whole_day',
                                    );
                                const canUseAdditionalHours =
                                    (selection.block === 'pm' ||
                                        selection.block === 'whole_day') &&
                                    dayAvailability.eve.available === true;
                                const isLastSelected =
                                    lastSelectedDate === selection.date;
                                const timeBlockButton = (
                                    block: ScheduleBlock,
                                    label: string,
                                    available: boolean,
                                ) => (
                                    <button
                                        key={block}
                                        type="button"
                                        disabled={!available}
                                        onClick={() =>
                                            available &&
                                            patchSelection(selection.date, {
                                                block,
                                                additionalHours:
                                                    block === 'am'
                                                        ? 0
                                                        : selection.additionalHours,
                                            })
                                        }
                                        className={cx(
                                            'min-h-12 border px-3 py-2 text-left text-xs font-semibold tracking-[0.14em] uppercase transition',
                                            available &&
                                                selection.block !== block &&
                                                'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-[#164734] hover:bg-emerald-100',
                                            available &&
                                                selection.block === block &&
                                                'border-[#164734] bg-[#164734] text-white shadow-sm',
                                            !available &&
                                                'cursor-not-allowed border-red-200 bg-red-50 text-red-700 opacity-75',
                                        )}
                                        title={
                                            available
                                                ? `${label} is available`
                                                : `${label} is unavailable`
                                        }
                                    >
                                        <span className="flex items-center justify-between gap-2">
                                            {label}
                                            {selection.block === block &&
                                            available ? (
                                                <Check className="h-3.5 w-3.5" />
                                            ) : null}
                                        </span>
                                        <span className="mt-1 block text-[10px] font-medium tracking-[0.08em] opacity-80">
                                            {available ? 'Open' : 'Unavailable'}
                                        </span>
                                    </button>
                                );

                                return (
                                    <div
                                        key={selection.date}
                                        className="mb-3 border border-slate-200 bg-white p-3 last:mb-0"
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <strong className="text-sm text-slate-950">
                                                {displayDate(selection.date)}
                                            </strong>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeLastScheduleDate(
                                                        selection.date,
                                                    )
                                                }
                                                className="grid h-7 w-7 place-items-center border border-red-200 bg-red-50 text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-50"
                                                disabled={
                                                    scheduleSelections.length ===
                                                        1 || !isLastSelected
                                                }
                                                title={
                                                    isLastSelected
                                                        ? 'Remove this selected date'
                                                        : 'Remove later selected dates first to keep the schedule continuous.'
                                                }
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="mb-2 grid grid-cols-3 gap-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
                                            {(() => {
                                                const dayAvailability =
                                                    calendarAvailability[
                                                        selection.date
                                                    ] ??
                                                    emptyDayAvailability(
                                                        selection.date,
                                                    );
                                                return [
                                                    [
                                                        'AM',
                                                        dayAvailability.am,
                                                    ] as const,
                                                    [
                                                        'PM',
                                                        dayAvailability.pm,
                                                    ] as const,
                                                    [
                                                        'EVE',
                                                        dayAvailability.eve,
                                                    ] as const,
                                                ].map(([label, block]) => (
                                                    <span
                                                        key={label}
                                                        className={cx(
                                                            'flex items-center justify-between border px-2 py-1',
                                                            availabilityPillClasses(
                                                                block.available,
                                                                false,
                                                            ),
                                                        )}
                                                        title={
                                                            block.reason ||
                                                            undefined
                                                        }
                                                    >
                                                        <span>{label}</span>
                                                        <span>
                                                            {availabilityPillText(
                                                                block.available,
                                                            )}
                                                        </span>
                                                    </span>
                                                ));
                                            })()}
                                        </div>
                                        <div className="grid gap-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                {timeBlockButton(
                                                    'am',
                                                    'AM',
                                                    amAvailable,
                                                )}
                                                {timeBlockButton(
                                                    'pm',
                                                    'PM',
                                                    pmAvailable,
                                                )}
                                            </div>
                                            {timeBlockButton(
                                                'whole_day',
                                                'Whole day',
                                                wholeDayAvailable,
                                            )}
                                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(86px,auto)] items-end gap-2 border border-slate-200 bg-slate-50 p-2">
                                                <div>
                                                    <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                                        Additional hour
                                                    </p>
                                                    <p
                                                        className={cx(
                                                            'mt-1 text-xs font-semibold',
                                                            canUseAdditionalHours
                                                                ? 'text-emerald-700'
                                                                : 'text-red-600',
                                                        )}
                                                    >
                                                        EVE{' '}
                                                        {availabilityPillText(
                                                            dayAvailability.eve
                                                                .available,
                                                        )}
                                                    </p>
                                                </div>
                                                <select
                                                    value={
                                                        canUseAdditionalHours
                                                            ? selection.additionalHours
                                                            : 0
                                                    }
                                                    onChange={(event) =>
                                                        patchSelection(
                                                            selection.date,
                                                            {
                                                                additionalHours:
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ),
                                                            },
                                                        )
                                                    }
                                                    disabled={
                                                        !canUseAdditionalHours
                                                    }
                                                    className={cx(
                                                        inputClass(),
                                                        'h-10 min-w-[76px] text-xs',
                                                        !canUseAdditionalHours &&
                                                            'cursor-not-allowed bg-slate-100 text-slate-400 opacity-70',
                                                    )}
                                                    aria-label="Additional hours"
                                                    title={
                                                        canUseAdditionalHours
                                                            ? 'Additional hours'
                                                            : 'Additional hours require PM or Whole Day plus EVE availability.'
                                                    }
                                                >
                                                    {(canUseAdditionalHours
                                                        ? Array.from(
                                                              {
                                                                  length:
                                                                      MAX_ADDITIONAL_HOURS +
                                                                      1,
                                                              },
                                                              (_, hour) => hour,
                                                          )
                                                        : [0]
                                                    ).map((hour) => (
                                                        <option
                                                            key={hour}
                                                            value={hour}
                                                        >
                                                            {hour}h
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs leading-5 text-slate-500">
                                            {blockLabel(selection.block)} ·{' '}
                                            {blockBaseHours(selection.block)}{' '}
                                            base hour(s) +{' '}
                                            {canUseAdditionalHours
                                                ? selection.additionalHours
                                                : 0}{' '}
                                            additional hour(s)
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="border-t border-slate-100 p-4">
                            <label className="flex items-start gap-3 border border-dashed border-[#d6b56d] bg-[#fff8e6] p-3 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={ingressPrep}
                                    onChange={(event) =>
                                        setIngressPrep(event.target.checked)
                                    }
                                    className="mt-1"
                                />
                                <span>
                                    <strong className="block text-slate-950">
                                        Ingress / setup / preparation
                                    </strong>
                                    <small className="mt-1 block leading-5 text-slate-600">
                                        Discount details stay hidden until final
                                        computation and BCCC assessment.
                                    </small>
                                </span>
                            </label>
                            {mergedErrors.schedule ? (
                                <p className="mt-3 text-sm font-semibold text-red-600">
                                    {mergedErrors.schedule}
                                </p>
                            ) : null}
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50 p-4">
                            <div className="grid gap-2 text-xs text-slate-600">
                                <div className="flex justify-between gap-3">
                                    <span>Selected package</span>
                                    <strong className="text-right text-slate-950">
                                        {packageMode === 'packages'
                                            ? (selectedPackage?.label ??
                                              'No package selected')
                                            : selectedAreaKeys.length
                                              ? 'Manual selection'
                                              : 'No service selected'}
                                    </strong>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span>Venue area(s)</span>
                                    <strong className="text-right text-slate-950">
                                        {compactListLabel(
                                            selectedVenues.map(
                                                (venue) => venue.shortLabel,
                                            ),
                                        )}
                                    </strong>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span>Additional hours</span>
                                    <strong className="text-right text-slate-950">
                                        {scheduleSelections.reduce(
                                            (sum, row) =>
                                                sum +
                                                Number(
                                                    row.additionalHours || 0,
                                                ),
                                            0,
                                        )}{' '}
                                        hr(s)
                                    </strong>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span>Running estimate</span>
                                    <strong className="text-right text-slate-950">
                                        {money(estimatedBaseTotal)}
                                    </strong>
                                </div>
                            </div>
                            <p className="mt-3 border border-dashed border-[#d6b56d] bg-white px-3 py-2 text-[11px] leading-5 text-slate-500">
                                Discounts appear only on the final review
                                computation. Pending submissions do not block
                                availability until payment is confirmed.
                            </p>
                        </div>
                        {renderStepActions()}
                    </aside>
                </div>
            </SectionShell>
        );
    }

    function renderServicesStep() {
        return (
            <SectionShell
                kicker="Step 02 · Package / Services"
                title="Choose only the active BCCC charge items"
                description="Lobby is included with Full Hall. Basement, shop rentals, catering maintenance, air-conditioning, stationery kit, and ordinance special packages are not shown as booking charges."
                icon={<PackageCheck className="h-4 w-4" />}
            >
                <div className="bccc-booking-step-layout bccc-booking-services-layout grid min-h-[680px] gap-4 p-4 lg:grid-cols-[minmax(0,2.7fr)_minmax(390px,1fr)] 2xl:grid-cols-[minmax(0,3.2fr)_minmax(440px,1fr)]">
                    <div>
                        <div className="mb-4 flex justify-center sm:justify-start">
                            <div className="bccc-booking-mode-toggle inline-flex border border-slate-200 bg-white p-1 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPackageMode('packages');
                                        if (packageMode !== 'packages') {
                                            setSelectedPackageCode('');
                                            setSelectedAreaKeys([]);
                                        }
                                    }}
                                    className={cx(
                                        'bccc-booking-mode-button px-5 py-2 text-sm font-semibold tracking-[0.16em] uppercase transition',
                                        packageMode === 'packages'
                                            ? 'bg-[#164734] text-white'
                                            : 'text-slate-600 hover:bg-slate-50',
                                    )}
                                >
                                    Packages
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPackageMode('manual');
                                        if (packageMode !== 'manual') {
                                            setSelectedPackageCode('');
                                            setSelectedAreaKeys([]);
                                        }
                                    }}
                                    className={cx(
                                        'bccc-booking-mode-button px-5 py-2 text-sm font-semibold tracking-[0.16em] uppercase transition',
                                        packageMode === 'manual'
                                            ? 'bg-[#164734] text-white'
                                            : 'text-slate-600 hover:bg-slate-50',
                                    )}
                                >
                                    Manual Selection
                                </button>
                            </div>
                        </div>

                        {packageMode === 'packages' ? (
                            <div className="grid gap-2">
                                {packages.map((pkg, index) => {
                                    const active =
                                        selectedPackageCode === pkg.code;
                                    const includedServices =
                                        pkg.areaKeys.map(selectedVenueByKey);
                                    return (
                                        <button
                                            key={pkg.code}
                                            type="button"
                                            onClick={() => choosePackage(pkg)}
                                            aria-pressed={active}
                                            data-selected={
                                                active ? 'true' : 'false'
                                            }
                                            className={cx(
                                                'bccc-booking-package-card group relative min-h-[112px] overflow-hidden border text-left transition duration-300',
                                                active
                                                    ? 'border-[#d6b56d] shadow-lg ring-2 ring-[#d6b56d]/40'
                                                    : 'border-slate-200 hover:border-[#d6b56d]',
                                            )}
                                        >
                                            <span
                                                className="bccc-booking-package-media-grid absolute inset-0 grid"
                                                style={{
                                                    gridTemplateColumns: `repeat(${Math.max(1, includedServices.length)}, minmax(0, 1fr))`,
                                                }}
                                                aria-hidden="true"
                                            >
                                                {includedServices.map(
                                                    (venue) => (
                                                        <span
                                                            key={`${pkg.code}-${venue.key}`}
                                                            className="bccc-booking-package-media-slice relative overflow-hidden border-r border-white/15 last:border-r-0"
                                                        >
                                                            <img
                                                                src={
                                                                    venue.image ||
                                                                    pkg.image
                                                                }
                                                                alt=""
                                                                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                                            />
                                                            <span className="absolute inset-0 bg-black/18" />
                                                            <span className="absolute right-2 bottom-2 left-2 truncate rounded-full border border-white/18 bg-black/42 px-2 py-1 text-center text-[9px] font-black tracking-[0.12em] text-white uppercase backdrop-blur">
                                                                {
                                                                    venue.shortLabel
                                                                }
                                                            </span>
                                                        </span>
                                                    ),
                                                )}
                                            </span>
                                            <span className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/38 to-black/70" />
                                            {active ? (
                                                <span className="bccc-booking-selected-badge absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#f2d58b]/60 bg-[#f2d58b] px-3 py-1 text-[10px] font-black tracking-[0.16em] text-[#143d32] uppercase shadow-lg">
                                                    <Check className="h-3.5 w-3.5" />
                                                    Selected
                                                </span>
                                            ) : null}
                                            <span className="bccc-booking-package-card-content relative flex min-h-[112px] items-center justify-between gap-4 p-4 text-white">
                                                <span className="bccc-booking-package-main flex items-center gap-4">
                                                    <span className="grid h-12 w-12 place-items-center border border-white/35 bg-white/10 text-sm font-semibold">
                                                        {String(
                                                            index + 1,
                                                        ).padStart(2, '0')}
                                                    </span>
                                                    <span>
                                                        <strong className="bccc-booking-package-title block text-2xl font-semibold tracking-[0.08em] uppercase">
                                                            {pkg.label}
                                                        </strong>
                                                        <small className="mt-1 block max-w-2xl text-sm leading-5 text-white/75">
                                                            {pkg.subtitle}
                                                        </small>
                                                        <small className="mt-2 block text-xs tracking-[0.2em] text-[#f2d58b] uppercase">
                                                            {includedServices
                                                                .map(
                                                                    (venue) =>
                                                                        venue.shortLabel,
                                                                )
                                                                .join(' + ')}
                                                        </small>
                                                        <span className="bccc-booking-package-inclusion-grid mt-3 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                                                            {includedServices.map(
                                                                (venue) => (
                                                                    <span
                                                                        key={`${pkg.code}-${venue.key}-chip`}
                                                                        className="rounded-full border border-white/18 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.11em] text-white/90 uppercase"
                                                                    >
                                                                        {
                                                                            venue.shortLabel
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        </span>
                                                        {pkg.capacityMax ? (
                                                            <small className="mt-1 block text-[11px] font-semibold tracking-[0.16em] text-white/80 uppercase">
                                                                Capacity up to{' '}
                                                                {pkg.capacityMax.toLocaleString()}{' '}
                                                                guests
                                                            </small>
                                                        ) : null}
                                                        {pkg.notice ? (
                                                            <small className="mt-2 block max-w-3xl border-l-2 border-[#f2d58b] pl-3 text-xs leading-5 text-white/85">
                                                                {pkg.notice}
                                                            </small>
                                                        ) : null}
                                                    </span>
                                                </span>
                                                <span className="hidden min-w-[230px] text-right lg:block">
                                                    <strong className="block text-xl font-semibold">
                                                        {money(
                                                            pkg.areaKeys.reduce(
                                                                (sum, key) =>
                                                                    sum +
                                                                    selectedVenueByKey(
                                                                        key,
                                                                    ).rates
                                                                        .wholeDay,
                                                                0,
                                                            ),
                                                        )}
                                                    </strong>
                                                    <small className="block text-white/70">
                                                        Whole day
                                                    </small>
                                                    <small className="mt-1 block text-[#f2d58b]">
                                                        {packagePriceLabel(pkg)}
                                                    </small>
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid gap-0">
                                {ACTIVE_VENUES.map((venue) => {
                                    const active = selectedAreaKeys.includes(
                                        venue.key,
                                    );
                                    return (
                                        <button
                                            key={venue.key}
                                            type="button"
                                            onClick={() =>
                                                toggleArea(venue.key)
                                            }
                                            aria-pressed={active}
                                            data-selected={
                                                active ? 'true' : 'false'
                                            }
                                            className={cx(
                                                'bccc-booking-manual-card group relative min-h-[118px] overflow-hidden border-x border-t text-left transition duration-300 last:border-b',
                                                active
                                                    ? 'z-10 border-[#d6b56d] shadow-lg ring-2 ring-[#d6b56d]/40'
                                                    : 'border-slate-200 hover:border-[#d6b56d]',
                                            )}
                                        >
                                            <img
                                                src={venue.image}
                                                alt=""
                                                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                            />
                                            <span className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/30 to-black/75" />
                                            {active ? (
                                                <span className="bccc-booking-selected-badge absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#f2d58b]/60 bg-[#f2d58b] px-3 py-1 text-[10px] font-black tracking-[0.16em] text-[#143d32] uppercase shadow-lg">
                                                    <Check className="h-3.5 w-3.5" />
                                                    Selected
                                                </span>
                                            ) : null}
                                            <span className="bccc-booking-manual-card-content relative flex min-h-[118px] items-center justify-between gap-4 p-4 text-white">
                                                <span className="flex min-w-0 items-center gap-4">
                                                    <span className="group/number relative grid h-14 w-14 shrink-0 place-items-center border border-white/35 bg-white/10 text-sm font-semibold">
                                                        {venue.number}
                                                        <span className="pointer-events-none absolute top-0 left-16 w-[260px] translate-y-2 border border-white/20 bg-black/75 p-3 text-left text-xs leading-5 font-normal text-white/80 opacity-0 shadow-xl backdrop-blur transition duration-300 group-hover/number:translate-y-0 group-hover/number:opacity-100">
                                                            {venue.description}
                                                        </span>
                                                    </span>
                                                    <span className="min-w-0">
                                                        <strong className="bccc-booking-manual-title block truncate text-3xl font-semibold tracking-[0.08em] uppercase">
                                                            {venue.label}
                                                        </strong>
                                                        <small className="mt-1 block max-w-2xl truncate text-sm text-white/75">
                                                            {venue.inclusions.join(
                                                                ' · ',
                                                            )}
                                                        </small>
                                                    </span>
                                                </span>
                                                <span className="min-w-[210px] text-right">
                                                    <strong className="block text-xl font-semibold">
                                                        {money(
                                                            venue.rates
                                                                .wholeDay,
                                                        )}
                                                    </strong>
                                                    <small className="block text-white/70">
                                                        Whole day
                                                    </small>
                                                    <small className="mt-1 block text-[#f2d58b]">
                                                        {money(
                                                            venue.rates.halfDay,
                                                        )}{' '}
                                                        half ·{' '}
                                                        {money(
                                                            venue.rates
                                                                .extraHour,
                                                        )}
                                                        /hr
                                                    </small>
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {selectedCombinationError ? (
                            <p className="mt-3 border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                                {selectedCombinationError}
                            </p>
                        ) : null}
                        {mergedErrors.selected_area_keys ? (
                            <p className="mt-3 text-sm font-semibold text-red-600">
                                {mergedErrors.selected_area_keys}
                            </p>
                        ) : null}
                    </div>

                    <ComputationAside
                        title="Service Computation"
                        subtitle={`${scheduleTotalDays} day(s) · ${scheduleTotalHours} hour(s)`}
                        hideDiscount={activeStep < 3}
                        rows={scheduleSelections}
                        areaKeys={selectedAreaKeys}
                        ingressPrep={ingressPrep}
                        actions={renderStepActions()}
                    />
                </div>
            </SectionShell>
        );
    }

    function renderContactStep() {
        const isPublic = data.event_nature === 'public';
        const autoMiceClass = cx(
            inputClass(),
            'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 shadow-inner opacity-70',
        );
        return (
            <SectionShell
                kicker="Step 03 · Contact Details"
                title="Complete organizer, event, and MICE information"
                description="Government events collect MICE statistical fields. Private/personal events skip the MICE tourism statistics and store skipped values as dashes."
                icon={<UserRound className="h-4 w-4" />}
            >
                <div className="bccc-booking-step-layout grid gap-4 p-4 lg:grid-cols-[minmax(0,2.7fr)_minmax(390px,1fr)] 2xl:grid-cols-[minmax(0,3.2fr)_minmax(440px,1fr)]">
                    <div className="grid gap-4">
                        <div className="grid gap-4 border border-slate-200 bg-white p-4 lg:grid-cols-2">
                            <div className="lg:col-span-2">
                                <p className="text-[11px] font-semibold tracking-[0.24em] text-[#a88633] uppercase">
                                    Event Scope
                                </p>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('event_nature', 'public');
                                            setData('mice_required', true);
                                            setData(
                                                'organization_type',
                                                'Government',
                                            );
                                        }}
                                        className={cx(
                                            'border p-4 text-left transition duration-300',
                                            isPublic
                                                ? 'border-[#164734] bg-[#164734] text-white shadow-md'
                                                : 'border-slate-200 bg-white hover:border-[#164734]',
                                        )}
                                    >
                                        <strong className="block text-lg">
                                            GOVERNMENT EVENT
                                        </strong>
                                        <small
                                            className={cx(
                                                'mt-1 block leading-5',
                                                isPublic
                                                    ? 'text-white/75'
                                                    : 'text-slate-500',
                                            )}
                                        >
                                            Requires MICE classification, event
                                            type, attendees, countries, and
                                            exhibition details.
                                        </small>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('event_nature', 'private');
                                            setData('mice_required', false);
                                            setData(
                                                'organization_type',
                                                'Private',
                                            );
                                        }}
                                        className={cx(
                                            'border p-4 text-left transition duration-300',
                                            !isPublic
                                                ? 'border-[#164734] bg-[#164734] text-white shadow-md'
                                                : 'border-slate-200 bg-white hover:border-[#164734]',
                                        )}
                                    >
                                        <strong className="block text-lg">
                                            PRIVATE / PERSONAL EVENT
                                        </strong>
                                        <small
                                            className={cx(
                                                'mt-1 block leading-5',
                                                !isPublic
                                                    ? 'text-white/75'
                                                    : 'text-slate-500',
                                            )}
                                        >
                                            Skips Government/MICE statistical
                                            fields; required basics remain.
                                        </small>
                                    </button>
                                </div>
                            </div>
                            <Field
                                label="Event Name"
                                required
                                error={mergedErrors.type_of_event}
                            >
                                <input
                                    value={data.type_of_event}
                                    onChange={(event) =>
                                        setData(
                                            'type_of_event',
                                            upper(event.target.value),
                                        )
                                    }
                                    className={inputClass(
                                        Boolean(mergedErrors.type_of_event),
                                    )}
                                />
                            </Field>
                            <Field
                                label="Expected Number of Guests"
                                required
                                error={mergedErrors.number_of_guests}
                            >
                                <input
                                    value={data.number_of_guests}
                                    onChange={(event) =>
                                        setData(
                                            'number_of_guests',
                                            event.target.value.replace(
                                                /\D/g,
                                                '',
                                            ),
                                        )
                                    }
                                    className={inputClass(
                                        Boolean(mergedErrors.number_of_guests),
                                    )}
                                    inputMode="numeric"
                                />
                            </Field>
                            {!isPublic ? (
                                <Field label="Private Event Type" required>
                                    <select
                                        value={data.private_event_type}
                                        onChange={(event) =>
                                            setData(
                                                'private_event_type',
                                                event.target.value,
                                            )
                                        }
                                        className={inputClass()}
                                    >
                                        {privateTypeOptions.map((option) => (
                                            <option
                                                key={optionValue(option.value)}
                                                value={optionValue(
                                                    option.value,
                                                )}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            ) : null}
                            <Field label="Public Calendar Title">
                                <input
                                    value={data.public_calendar_title}
                                    onChange={(event) =>
                                        setData(
                                            'public_calendar_title',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass()}
                                    placeholder="Optional - display title"
                                />
                            </Field>
                            <label className="flex items-center gap-3 self-end border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={data.is_public_calendar_visible}
                                    onKeyDown={(event) => {
                                        if (event.key !== 'Enter') return;
                                        event.preventDefault();
                                        goNext();
                                    }}
                                    onChange={(event) =>
                                        setData(
                                            'is_public_calendar_visible',
                                            event.target.checked,
                                        )
                                    }
                                />{' '}
                                Show approved title on public calendar
                            </label>
                        </div>

                        <div className="grid gap-4 border border-slate-200 bg-white p-4 lg:grid-cols-2">
                            <div className="lg:col-span-2">
                                <p className="text-[11px] font-semibold tracking-[0.24em] text-[#a88633] uppercase">
                                    Organizer Details
                                </p>
                            </div>
                            <Field
                                label="Name of Organization"
                                required
                                error={mergedErrors.company_name}
                            >
                                <input
                                    value={data.company_name}
                                    onChange={(event) =>
                                        setData(
                                            'company_name',
                                            upper(event.target.value),
                                        )
                                    }
                                    className={inputClass(
                                        Boolean(mergedErrors.company_name),
                                    )}
                                />
                            </Field>
                            <Field label="Head of Organization">
                                <input
                                    value={data.head_of_organization}
                                    onChange={(event) =>
                                        setData(
                                            'head_of_organization',
                                            upper(event.target.value),
                                        )
                                    }
                                    className={inputClass()}
                                    placeholder="Optional"
                                />
                            </Field>
                            <Field
                                label="Contact Person"
                                required
                                error={mergedErrors.client_name}
                            >
                                <input
                                    value={data.client_name}
                                    onChange={(event) =>
                                        setData(
                                            'client_name',
                                            upper(event.target.value),
                                        )
                                    }
                                    className={inputClass(
                                        Boolean(mergedErrors.client_name),
                                    )}
                                />
                            </Field>
                            <Field
                                label="Contact Number"
                                required
                                error={mergedErrors.client_contact_number}
                            >
                                <input
                                    value={data.client_contact_number}
                                    onChange={(event) =>
                                        setData(
                                            'client_contact_number',
                                            event.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 11),
                                        )
                                    }
                                    className={inputClass(
                                        Boolean(
                                            mergedErrors.client_contact_number,
                                        ),
                                    )}
                                    inputMode="numeric"
                                    maxLength={11}
                                />
                            </Field>
                            <Field
                                label="Email Address"
                                required
                                error={mergedErrors.client_email}
                            >
                                <input
                                    value={data.client_email}
                                    onChange={(event) =>
                                        setData(
                                            'client_email',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass(
                                        Boolean(mergedErrors.client_email),
                                    )}
                                    type="email"
                                />
                            </Field>
                            <Field label="Organization Type">
                                <select
                                    value={data.organization_type}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setData('organization_type', value);
                                        setData(
                                            'event_nature',
                                            value === 'Government'
                                                ? 'public'
                                                : 'private',
                                        );
                                        setData(
                                            'mice_required',
                                            value === 'Government',
                                        );
                                    }}
                                    className={inputClass()}
                                >
                                    <option value="Private">Private</option>
                                    <option value="Government">
                                        Government
                                    </option>
                                </select>
                            </Field>
                            <div className="grid gap-4 border border-slate-100 bg-slate-50/70 p-4 lg:col-span-2 lg:grid-cols-2">
                                <div className="lg:col-span-2">
                                    <p className="text-[11px] font-semibold tracking-[0.24em] text-[#a88633] uppercase">
                                        Address of Organizer
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Select the Philippine region and
                                        province/district, then complete the
                                        city/municipality, barangay, and
                                        street/building details.
                                    </p>
                                    {mergedErrors.client_address ? (
                                        <p className="mt-2 text-xs font-semibold text-red-600">
                                            {mergedErrors.client_address}
                                        </p>
                                    ) : null}
                                </div>
                                <Field label="Region" required>
                                    <select
                                        value={data.client_region}
                                        onChange={(event) => {
                                            const region = event.target.value;
                                            const firstProvince =
                                                provincesForRegion(region)[0] ??
                                                '';
                                            patchAddress({
                                                client_region: region,
                                                client_province: firstProvince,
                                                client_city_municipality: '',
                                                client_barangay: '',
                                                client_zip_code: '',
                                            });
                                        }}
                                        className={inputClass(
                                            Boolean(
                                                mergedErrors.client_address,
                                            ),
                                        )}
                                    >
                                        <option value="">Select region</option>
                                        {PHILIPPINES_ADDRESS_REGIONS.map(
                                            (region) => (
                                                <option
                                                    key={region.code}
                                                    value={region.code}
                                                >
                                                    {region.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </Field>
                                <Field label="Province / District" required>
                                    <select
                                        value={data.client_province}
                                        onChange={(event) =>
                                            patchAddress({
                                                client_province:
                                                    event.target.value,
                                                client_city_municipality: '',
                                                client_barangay: '',
                                                client_zip_code: '',
                                            })
                                        }
                                        className={inputClass(
                                            Boolean(
                                                mergedErrors.client_address,
                                            ),
                                        )}
                                    >
                                        <option value="">
                                            Select province or district
                                        </option>
                                        {provincesForRegion(
                                            data.client_region,
                                        ).map((province) => (
                                            <option
                                                key={province}
                                                value={province}
                                            >
                                                {province}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field
                                    label="City / Municipality"
                                    required
                                    help={
                                        cityMunicipalityOptions.length
                                            ? 'Choose the official city or municipality for the selected province.'
                                            : 'Type the official city or municipality.'
                                    }
                                >
                                    {cityMunicipalityOptions.length ? (
                                        <select
                                            value={
                                                data.client_city_municipality
                                            }
                                            onChange={(event) => {
                                                const city = event.target.value;
                                                patchAddress({
                                                    client_city_municipality:
                                                        city,
                                                    client_zip_code:
                                                        zipCodeForCityMunicipality(
                                                            city,
                                                        ),
                                                });
                                            }}
                                            className={inputClass(
                                                Boolean(
                                                    mergedErrors.client_address,
                                                ),
                                            )}
                                        >
                                            <option value="">
                                                Select city or municipality
                                            </option>
                                            {data.client_city_municipality &&
                                            !cityMunicipalityOptions.includes(
                                                data.client_city_municipality,
                                            ) ? (
                                                <option
                                                    value={
                                                        data.client_city_municipality
                                                    }
                                                >
                                                    {
                                                        data.client_city_municipality
                                                    }
                                                </option>
                                            ) : null}
                                            {cityMunicipalityOptions.map(
                                                (city) => (
                                                    <option
                                                        key={city}
                                                        value={city}
                                                    >
                                                        {city}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    ) : (
                                        <input
                                            value={
                                                data.client_city_municipality
                                            }
                                            onChange={(event) => {
                                                const city = upper(
                                                    event.target.value,
                                                );
                                                patchAddress({
                                                    client_city_municipality:
                                                        city,
                                                    client_zip_code:
                                                        zipCodeForCityMunicipality(
                                                            city,
                                                        ),
                                                });
                                            }}
                                            className={inputClass(
                                                Boolean(
                                                    mergedErrors.client_address,
                                                ),
                                            )}
                                            placeholder="CITY / MUNICIPALITY"
                                        />
                                    )}
                                </Field>
                                <Field label="Barangay" required>
                                    <input
                                        value={data.client_barangay}
                                        onChange={(event) =>
                                            patchAddress({
                                                client_barangay: upper(
                                                    event.target.value,
                                                ),
                                            })
                                        }
                                        className={inputClass(
                                            Boolean(
                                                mergedErrors.client_address,
                                            ),
                                        )}
                                        placeholder="BARANGAY"
                                    />
                                </Field>
                                <Field
                                    label="Street / Building / House No."
                                    help="Optional. Add this only when a specific street, building, unit, or house number is available."
                                >
                                    <input
                                        value={data.client_street_address}
                                        onChange={(event) =>
                                            patchAddress({
                                                client_street_address: upper(
                                                    event.target.value,
                                                ),
                                            })
                                        }
                                        className={inputClass(
                                            Boolean(
                                                mergedErrors.client_address,
                                            ),
                                        )}
                                        placeholder="Optional - street, building, unit, or house no."
                                    />
                                </Field>
                                <Field label="ZIP Code">
                                    <input
                                        value={data.client_zip_code}
                                        onChange={(event) =>
                                            patchAddress({
                                                client_zip_code:
                                                    event.target.value
                                                        .replace(/[^0-9]/g, '')
                                                        .slice(0, 4),
                                            })
                                        }
                                        className={inputClass()}
                                        inputMode="numeric"
                                        maxLength={4}
                                        placeholder="Optional - auto-filled when known"
                                    />
                                    <small className="text-xs leading-5 font-normal text-slate-500">
                                        Auto-filled for known cities and
                                        municipalities.
                                    </small>
                                </Field>
                                <div className="border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 lg:col-span-2">
                                    <strong className="block text-slate-950">
                                        Saved address preview
                                    </strong>
                                    <span>
                                        {composePhilippinesAddress(data) ||
                                            'Complete the address fields above.'}
                                    </span>
                                </div>
                            </div>
                            <Field label="Comment / Feedback">
                                <textarea
                                    value={data.comments_feedback}
                                    onChange={(event) =>
                                        setData(
                                            'comments_feedback',
                                            event.target.value,
                                        )
                                    }
                                    className={cx(inputClass(), 'min-h-24')}
                                    placeholder="Optional - add comments or feedback"
                                />
                            </Field>
                        </div>

                        <div className="grid gap-4 border border-slate-200 bg-white p-4 lg:grid-cols-2">
                            <div className="lg:col-span-2">
                                <p className="text-[11px] font-semibold tracking-[0.24em] text-[#a88633] uppercase">
                                    MICE Report Fields
                                </p>
                                <div className="mt-2 border border-dashed border-slate-300 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                                    <strong className="block text-slate-700">
                                        Auto-filled by the system
                                    </strong>{' '}
                                    The faded fields below are generated from
                                    your selected schedule and event setup. They
                                    are shown for transparency but are not
                                    editable here.
                                </div>
                            </div>
                            <Field label="Name of Event Center">
                                <input
                                    value={PUBLIC_EVENT_CENTER}
                                    readOnly
                                    className={autoMiceClass}
                                />
                            </Field>
                            <Field label="Covered Month">
                                <input
                                    value={data.covered_month}
                                    readOnly
                                    className={autoMiceClass}
                                />
                            </Field>
                            <Field label="Date Event Started">
                                <input
                                    value={displayDate(
                                        scheduleSelections[0]?.date ?? '',
                                    )}
                                    readOnly
                                    className={autoMiceClass}
                                />
                            </Field>
                            <Field label="Date Event Finished">
                                <input
                                    value={displayDate(
                                        scheduleSelections[
                                            scheduleSelections.length - 1
                                        ]?.date ?? '',
                                    )}
                                    readOnly
                                    className={autoMiceClass}
                                />
                            </Field>
                            <Field
                                label="Time"
                                help="Saved to the MICE report as a readable schedule range."
                            >
                                <input
                                    value={displayOverallScheduleDateTimeRange(
                                        scheduleSelections,
                                    )}
                                    readOnly
                                    className={autoMiceClass}
                                />
                            </Field>
                            <Field
                                label="Additional Hours"
                                help="Shows approved PM/EVE extension hours in words."
                            >
                                <input
                                    value={displayAdditionalHoursSummary(
                                        scheduleSelections,
                                    )}
                                    readOnly
                                    className={autoMiceClass}
                                />
                            </Field>
                            <Field label="No. of Function Halls">
                                <input
                                    value={isPublic ? '1' : '-'}
                                    readOnly
                                    className={autoMiceClass}
                                />
                            </Field>
                            <Field label="Function Hall Capacity">
                                <input
                                    value={
                                        isPublic ? selectedCapacityGuide : '-'
                                    }
                                    readOnly
                                    className={autoMiceClass}
                                />
                            </Field>
                            <Field label="Number of Hours">
                                <input
                                    value={String(scheduleTotalHours)}
                                    readOnly
                                    className={autoMiceClass}
                                />
                            </Field>
                            {isPublic ? (
                                <>
                                    <div className="border border-[#d6b56d]/60 bg-[#fff8e6] p-4 text-sm leading-6 text-slate-700 lg:col-span-2">
                                        <strong className="block text-slate-950">
                                            Classification guide
                                        </strong>
                                        International = participants from two
                                        continents. Regional Asia Pacific = two
                                        or more countries in same continent.
                                        Regional Offshore = one foreign country
                                        excluding Philippines. Regional
                                        Philippines = within a Philippine
                                        region. National = two or more
                                        Philippine regions.
                                    </div>
                                    <Field
                                        label="Classification of Event"
                                        required
                                        error={
                                            mergedErrors.classification_of_event
                                        }
                                    >
                                        <select
                                            value={data.classification_of_event}
                                            onChange={(event) =>
                                                setData(
                                                    'classification_of_event',
                                                    event.target.value,
                                                )
                                            }
                                            className={inputClass(
                                                Boolean(
                                                    mergedErrors.classification_of_event,
                                                ),
                                            )}
                                        >
                                            {classificationOptions.map(
                                                (option) => (
                                                    <option
                                                        key={optionValue(
                                                            option.value,
                                                        )}
                                                        value={optionValue(
                                                            option.value,
                                                        )}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </Field>
                                    <Field
                                        label="Type of Event"
                                        required
                                        error={mergedErrors.mice_type_of_event}
                                    >
                                        <select
                                            value={data.mice_type_of_event}
                                            onChange={(event) =>
                                                setData(
                                                    'mice_type_of_event',
                                                    event.target.value,
                                                )
                                            }
                                            className={inputClass(
                                                Boolean(
                                                    mergedErrors.mice_type_of_event,
                                                ),
                                            )}
                                        >
                                            {miceTypeOptions.map((option) => (
                                                <option
                                                    key={optionValue(
                                                        option.value,
                                                    )}
                                                    value={optionValue(
                                                        option.value,
                                                    )}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field
                                        label="Foreign Attendees"
                                        required
                                        error={mergedErrors.foreign_attendees}
                                    >
                                        <input
                                            value={data.foreign_attendees}
                                            onChange={(event) =>
                                                setData(
                                                    'foreign_attendees',
                                                    event.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    ),
                                                )
                                            }
                                            className={inputClass(
                                                Boolean(
                                                    mergedErrors.foreign_attendees,
                                                ),
                                            )}
                                            inputMode="numeric"
                                        />
                                    </Field>
                                    <Field
                                        label="Domestic Attendees"
                                        required
                                        error={mergedErrors.domestic_attendees}
                                    >
                                        <input
                                            value={data.domestic_attendees}
                                            onChange={(event) =>
                                                setData(
                                                    'domestic_attendees',
                                                    event.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    ),
                                                )
                                            }
                                            className={inputClass(
                                                Boolean(
                                                    mergedErrors.domestic_attendees,
                                                ),
                                            )}
                                            inputMode="numeric"
                                        />
                                    </Field>
                                    <Field
                                        label="Total Number of Countries"
                                        required
                                        error={
                                            mergedErrors.total_number_of_countries
                                        }
                                    >
                                        <input
                                            value={
                                                data.total_number_of_countries
                                            }
                                            onChange={(event) =>
                                                setData(
                                                    'total_number_of_countries',
                                                    event.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    ),
                                                )
                                            }
                                            className={inputClass(
                                                Boolean(
                                                    mergedErrors.total_number_of_countries,
                                                ),
                                            )}
                                            inputMode="numeric"
                                        />
                                    </Field>
                                    <Field
                                        label="Breakdown of Countries"
                                        required
                                        error={
                                            mergedErrors.countries_breakdown_text
                                        }
                                    >
                                        <input
                                            value={
                                                data.countries_breakdown_text
                                            }
                                            onChange={(event) =>
                                                setData(
                                                    'countries_breakdown_text',
                                                    upper(event.target.value),
                                                )
                                            }
                                            className={inputClass(
                                                Boolean(
                                                    mergedErrors.countries_breakdown_text,
                                                ),
                                            )}
                                            placeholder="PHILIPPINES"
                                        />
                                    </Field>
                                    <Field label="Exhibitions">
                                        <select
                                            value={data.has_exhibitions}
                                            onChange={(event) =>
                                                setData(
                                                    'has_exhibitions',
                                                    event.target.value,
                                                )
                                            }
                                            className={inputClass()}
                                        >
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </Field>
                                    {data.has_exhibitions === 'Yes' ? (
                                        <Field
                                            label="No. of Exhibitors"
                                            required
                                            error={
                                                mergedErrors.exhibitors_count
                                            }
                                        >
                                            <input
                                                value={data.exhibitors_count}
                                                onChange={(event) =>
                                                    setData(
                                                        'exhibitors_count',
                                                        event.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                className={inputClass(
                                                    Boolean(
                                                        mergedErrors.exhibitors_count,
                                                    ),
                                                )}
                                                inputMode="numeric"
                                            />
                                        </Field>
                                    ) : null}
                                    {data.has_exhibitions === 'Yes' ? (
                                        <Field label="No. of Visitors" required>
                                            <input
                                                value={data.visitors_count}
                                                onChange={(event) =>
                                                    setData(
                                                        'visitors_count',
                                                        event.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                className={inputClass()}
                                                inputMode="numeric"
                                            />
                                        </Field>
                                    ) : null}
                                    <div className="border-t border-slate-200 pt-4 lg:col-span-2">
                                        <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a88633] uppercase">
                                            Registry Classification
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            These details are saved directly to
                                            the booking-linked MICE report.
                                            Enter N/A when a text value does not
                                            apply.
                                        </p>
                                    </div>
                                    {mergedErrors.mice_report ? (
                                        <div className="border border-red-200 bg-red-50 p-3 text-xs leading-5 font-semibold text-red-700 lg:col-span-2">
                                            {mergedErrors.mice_report}
                                        </div>
                                    ) : null}
                                    {(
                                        [
                                            [
                                                'Enterprise Group',
                                                'enterprise_group',
                                                'UNCLASSIFIED',
                                            ],
                                            [
                                                'BTC Group Code',
                                                'btc_group_code',
                                                'N/A',
                                            ],
                                            [
                                                'Event Category',
                                                'event_category',
                                                'CONVENTION',
                                            ],
                                        ] as const
                                    ).map(([label, field, placeholder]) => (
                                        <Field
                                            key={field}
                                            label={label}
                                            required
                                        >
                                            <input
                                                value={data[field]}
                                                onChange={(event) =>
                                                    setData(
                                                        field,
                                                        upper(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className={inputClass()}
                                                placeholder={placeholder}
                                            />
                                        </Field>
                                    ))}
                                    <div className="border-t border-slate-200 pt-4 lg:col-span-2">
                                        <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a88633] uppercase">
                                            Participant Breakdown
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            All six counts must add up to the
                                            expected attendance. Local and
                                            domestic counts must also match
                                            domestic attendees.
                                        </p>
                                    </div>
                                    {mergedErrors.mice_participants ? (
                                        <div className="border border-red-200 bg-red-50 p-3 text-xs leading-5 font-semibold text-red-700 lg:col-span-2">
                                            {mergedErrors.mice_participants}
                                        </div>
                                    ) : null}
                                    {(
                                        [
                                            [
                                                'Local Male Participants',
                                                'local_male_participants',
                                            ],
                                            [
                                                'Local Female Participants',
                                                'local_female_participants',
                                            ],
                                            [
                                                'Domestic Male Participants',
                                                'domestic_male_participants',
                                            ],
                                            [
                                                'Domestic Female Participants',
                                                'domestic_female_participants',
                                            ],
                                            [
                                                'Foreign Male Participants',
                                                'foreign_male_participants',
                                            ],
                                            [
                                                'Foreign Female Participants',
                                                'foreign_female_participants',
                                            ],
                                        ] as const
                                    ).map(([label, field]) => (
                                        <Field
                                            key={field}
                                            label={label}
                                            required
                                        >
                                            <input
                                                value={data[field]}
                                                onChange={(event) =>
                                                    setData(
                                                        field,
                                                        event.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                className={inputClass()}
                                                inputMode="numeric"
                                            />
                                        </Field>
                                    ))}
                                    <div className="border-t border-slate-200 pt-4 lg:col-span-2">
                                        <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a88633] uppercase">
                                            Visitor Origin and Tourism Impact
                                        </p>
                                    </div>
                                    {(
                                        [
                                            [
                                                'Main Origin Country',
                                                'main_origin_country',
                                            ],
                                            [
                                                'Main Origin Province',
                                                'main_origin_province',
                                            ],
                                            [
                                                'Main Origin City',
                                                'main_origin_city',
                                            ],
                                        ] as const
                                    ).map(([label, field]) => (
                                        <Field
                                            key={field}
                                            label={label}
                                            required
                                        >
                                            <input
                                                value={data[field]}
                                                onChange={(event) =>
                                                    setData(
                                                        field,
                                                        upper(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className={inputClass()}
                                            />
                                        </Field>
                                    ))}
                                    {(
                                        [
                                            [
                                                'Same-Day Visitors',
                                                'same_day_visitors',
                                            ],
                                            [
                                                'Overnight Visitors',
                                                'overnight_visitors',
                                            ],
                                            [
                                                'Estimated Room Nights',
                                                'estimated_room_nights',
                                            ],
                                            [
                                                'Estimated Tourism Receipts',
                                                'estimated_tourism_receipts',
                                            ],
                                        ] as const
                                    ).map(([label, field]) => (
                                        <Field
                                            key={field}
                                            label={label}
                                            required
                                        >
                                            <input
                                                value={data[field]}
                                                onChange={(event) =>
                                                    setData(
                                                        field,
                                                        event.target.value.replace(
                                                            /[^\d.]/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                className={inputClass()}
                                                inputMode="decimal"
                                            />
                                        </Field>
                                    ))}
                                    <div className="border-t border-slate-200 pt-4 lg:col-span-2">
                                        <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a88633] uppercase">
                                            Employees and Compliance
                                        </p>
                                    </div>
                                    {mergedErrors.mice_employees ? (
                                        <div className="border border-red-200 bg-red-50 p-3 text-xs leading-5 font-semibold text-red-700 lg:col-span-2">
                                            {mergedErrors.mice_employees}
                                        </div>
                                    ) : null}
                                    {(
                                        [
                                            [
                                                'Total Employees',
                                                'total_employees',
                                            ],
                                            [
                                                'Female Employees',
                                                'female_employees',
                                            ],
                                            [
                                                'Male Employees',
                                                'male_employees',
                                            ],
                                        ] as const
                                    ).map(([label, field]) => (
                                        <Field
                                            key={field}
                                            label={label}
                                            required
                                        >
                                            <input
                                                value={data[field]}
                                                onChange={(event) =>
                                                    setData(
                                                        field,
                                                        event.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                className={inputClass()}
                                                inputMode="numeric"
                                            />
                                        </Field>
                                    ))}
                                    {(
                                        [
                                            [
                                                'Permit to Engage',
                                                'permit_to_engage',
                                            ],
                                            [
                                                'DOT Accredited',
                                                'dot_accredited',
                                            ],
                                            ['Active Member', 'active_member'],
                                        ] as const
                                    ).map(([label, field]) => (
                                        <Field
                                            key={field}
                                            label={label}
                                            required
                                        >
                                            <select
                                                value={data[field]}
                                                onChange={(event) =>
                                                    setData(
                                                        field,
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass()}
                                            >
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </Field>
                                    ))}
                                    <Field label="MICE Report Remarks" required>
                                        <textarea
                                            value={data.remarks}
                                            onChange={(event) =>
                                                setData(
                                                    'remarks',
                                                    event.target.value,
                                                )
                                            }
                                            className={cx(
                                                inputClass(),
                                                'min-h-24',
                                            )}
                                            placeholder="N/A if none"
                                        />
                                    </Field>
                                </>
                            ) : (
                                <div className="border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 lg:col-span-2">
                                    Private/personal event selected. MICE
                                    statistical fields are skipped and saved as{' '}
                                    <strong>-</strong> on the record.
                                </div>
                            )}
                        </div>
                    </div>

                    <ComputationAside
                        title="Current Booking Summary"
                        subtitle={`${selectedVenues.map((venue) => venue.shortLabel).join(' + ')}`}
                        hideDiscount
                        rows={scheduleSelections}
                        areaKeys={selectedAreaKeys}
                        ingressPrep={ingressPrep}
                        actions={renderStepActions()}
                    />
                </div>
            </SectionShell>
        );
    }

    function renderReviewStep() {
        return (
            <SectionShell
                kicker="Step 04 · Review"
                title="Final computation and confirmation"
                description="This is the first stage where hidden discounts and payment guidance are visible. Final approval and billing still depend on BCCC assessment."
                icon={<ReceiptText className="h-4 w-4" />}
            >
                <div className="bccc-booking-step-layout grid gap-4 p-4 lg:grid-cols-[minmax(0,2.7fr)_minmax(390px,1fr)] 2xl:grid-cols-[minmax(0,3.2fr)_minmax(440px,1fr)]">
                    <div className="grid gap-4">
                        <ReviewCard
                            title="Schedule"
                            icon={<CalendarDays className="h-4 w-4" />}
                        >
                            <ReviewGrid
                                rows={[
                                    [
                                        'Start',
                                        displayDateTime(
                                            buildBookingDateFrom(
                                                scheduleSelections[0],
                                            ),
                                        ),
                                    ],
                                    [
                                        'End',
                                        displayDateTime(
                                            buildBookingDateTo(
                                                scheduleSelections[
                                                    scheduleSelections.length -
                                                        1
                                                ],
                                            ),
                                        ),
                                    ],
                                    ['Total Days', `${scheduleTotalDays}`],
                                    ['Total Hours', `${scheduleTotalHours}`],
                                    [
                                        'Daily Schedule',
                                        displayOverallScheduleDateTimeRange(
                                            scheduleSelections,
                                        ),
                                    ],
                                    [
                                        'Additional Hours',
                                        displayAdditionalHoursSummary(
                                            scheduleSelections,
                                        ),
                                    ],
                                    [
                                        'Venue Capacity',
                                        selectedCapacityGuide ||
                                            'Subject to BCCC review',
                                    ],
                                    [
                                        'Ingress / setup / preparation',
                                        ingressPrep
                                            ? 'Marked for BCCC assessment'
                                            : 'No',
                                    ],
                                ]}
                            />
                        </ReviewCard>
                        <ReviewCard
                            title="Selected Services"
                            icon={<PackageCheck className="h-4 w-4" />}
                        >
                            <div className="grid gap-2">
                                <ReviewGrid
                                    rows={[
                                        [
                                            'Selection Mode',
                                            packageMode === 'packages'
                                                ? 'Package'
                                                : 'Manual services',
                                        ],
                                        [
                                            'Selected Package',
                                            packageMode === 'packages'
                                                ? selectedPackage?.label
                                                : 'No package selected',
                                        ],
                                        [
                                            'Dressing Room',
                                            dressingRoomLabel(
                                                data.estimated_other_rentals,
                                            ),
                                        ],
                                        [
                                            'Dressing Room Days',
                                            `${scheduleTotalDays} day(s) at ${money(dressingRoomDailyCharge(data.estimated_other_rentals))}/day`,
                                        ],
                                    ]}
                                />
                                {selectedVenues.map((venue) => (
                                    <div
                                        key={venue.key}
                                        className="flex items-center justify-between border border-slate-200 bg-white px-3 py-2"
                                    >
                                        <span>
                                            <strong className="block text-sm text-slate-950">
                                                {venue.shortLabel}
                                            </strong>
                                            <small className="text-xs text-slate-500">
                                                {venue.officialLabel}
                                            </small>
                                        </span>
                                        <span className="text-right text-sm font-semibold text-slate-950">
                                            {money(venue.rates.wholeDay)}
                                            <small className="block font-normal text-slate-500">
                                                whole day
                                            </small>
                                        </span>
                                    </div>
                                ))}
                                {selectedDressingRoomCharge > 0 ? (
                                    <div className="flex items-center justify-between border border-amber-200 bg-amber-50 px-3 py-2">
                                        <span>
                                            <strong className="block text-sm text-slate-950">
                                                {dressingRoomLabel(
                                                    data.estimated_other_rentals,
                                                )}
                                            </strong>
                                            <small className="text-xs text-slate-500">
                                                Additional charge
                                            </small>
                                        </span>
                                        <span className="text-right text-sm font-semibold text-slate-950">
                                            {money(selectedDressingRoomCharge)}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        </ReviewCard>
                        <ReviewCard
                            title="Contact and MICE"
                            icon={<UserRound className="h-4 w-4" />}
                        >
                            <ReviewGrid
                                rows={[
                                    [
                                        'Event Scope',
                                        data.event_nature === 'public'
                                            ? 'GOVERNMENT EVENT'
                                            : 'PRIVATE/PERSONAL EVENT',
                                    ],
                                    ['Event Name', data.type_of_event],
                                    ['Organization', data.company_name],
                                    [
                                        'Organization Type',
                                        data.organization_type ||
                                            (data.event_nature === 'public'
                                                ? 'Public'
                                                : 'Private'),
                                    ],
                                    [
                                        'Head of Organization',
                                        data.head_of_organization,
                                    ],
                                    ['Contact Person', data.client_name],
                                    [
                                        'Contact Number',
                                        data.client_contact_number,
                                    ],
                                    ['Email', data.client_email],
                                    [
                                        'Organizer Address',
                                        composePhilippinesAddress(data),
                                    ],
                                    [
                                        'Public Calendar Title',
                                        data.public_calendar_title ||
                                            'Not provided',
                                    ],
                                    [
                                        'Public Calendar Visibility',
                                        data.is_public_calendar_visible
                                            ? 'Show when approved'
                                            : 'Hidden from public calendar',
                                    ],
                                    ['Event Center', PUBLIC_EVENT_CENTER],
                                    ['Covered Month', data.covered_month],
                                    [
                                        'Function Halls',
                                        data.event_nature === 'public'
                                            ? data.function_halls_count || '1'
                                            : '-',
                                    ],
                                    [
                                        'Function Hall Capacity',
                                        data.event_nature === 'public'
                                            ? selectedCapacityGuide
                                            : '-',
                                    ],
                                    [
                                        'Private Event Type',
                                        data.event_nature === 'private'
                                            ? data.private_event_type
                                            : '-',
                                    ],
                                    [
                                        'MICE Classification',
                                        data.event_nature === 'public'
                                            ? data.classification_of_event
                                            : '-',
                                    ],
                                    [
                                        'MICE Type',
                                        data.event_nature === 'public'
                                            ? data.mice_type_of_event
                                            : '-',
                                    ],
                                    [
                                        'Foreign Attendees',
                                        data.event_nature === 'public'
                                            ? data.foreign_attendees
                                            : '-',
                                    ],
                                    [
                                        'Domestic Attendees',
                                        data.event_nature === 'public'
                                            ? data.domestic_attendees
                                            : '-',
                                    ],
                                    [
                                        'Countries Count',
                                        data.event_nature === 'public'
                                            ? data.total_number_of_countries
                                            : '-',
                                    ],
                                    [
                                        'Country Breakdown',
                                        data.event_nature === 'public'
                                            ? data.countries_breakdown_text
                                            : '-',
                                    ],
                                    [
                                        'Exhibitions',
                                        data.event_nature === 'public'
                                            ? data.has_exhibitions
                                            : '-',
                                    ],
                                    [
                                        'Exhibitors / Visitors',
                                        data.event_nature === 'public'
                                            ? `${data.exhibitors_count || '0'} / ${data.visitors_count || '0'}`
                                            : '-',
                                    ],
                                    [
                                        'Participant Breakdown',
                                        data.event_nature === 'public'
                                            ? `Local M/F: ${data.local_male_participants}/${data.local_female_participants}; Domestic M/F: ${data.domestic_male_participants}/${data.domestic_female_participants}; Foreign M/F: ${data.foreign_male_participants}/${data.foreign_female_participants}`
                                            : '-',
                                    ],
                                    [
                                        'Main Visitor Origin',
                                        data.event_nature === 'public'
                                            ? `${data.main_origin_city}, ${data.main_origin_province}, ${data.main_origin_country}`
                                            : '-',
                                    ],
                                    [
                                        'Same-Day / Overnight Visitors',
                                        data.event_nature === 'public'
                                            ? `${data.same_day_visitors} / ${data.overnight_visitors}`
                                            : '-',
                                    ],
                                    [
                                        'Room Nights / Tourism Receipts',
                                        data.event_nature === 'public'
                                            ? `${data.estimated_room_nights} / ${money(data.estimated_tourism_receipts)}`
                                            : '-',
                                    ],
                                    [
                                        'Employee Breakdown',
                                        data.event_nature === 'public'
                                            ? `Total: ${data.total_employees}; Female: ${data.female_employees}; Male: ${data.male_employees}`
                                            : '-',
                                    ],
                                    [
                                        'Compliance',
                                        data.event_nature === 'public'
                                            ? `Permit: ${data.permit_to_engage}; DOT: ${data.dot_accredited}; Active member: ${data.active_member}`
                                            : '-',
                                    ],
                                    [
                                        'MICE Report Remarks',
                                        data.event_nature === 'public'
                                            ? data.remarks || 'N/A'
                                            : '-',
                                    ],
                                    [
                                        'Comment / Feedback',
                                        data.comments_feedback || 'N/A',
                                    ],
                                ]}
                            />
                        </ReviewCard>
                        <ReviewCard
                            title="Policy Confirmation"
                            icon={<ShieldCheck className="h-4 w-4" />}
                        >
                            <div className="grid gap-3">
                                <div className="border border-[#d6b56d]/60 bg-[#fff8e6] p-4 text-sm leading-6 text-slate-700">
                                    <strong className="block text-slate-950">
                                        BCCC final review notice
                                    </strong>
                                    This review page is the first place where
                                    the hidden computation details are shown.
                                    Final billing still depends on BCCC
                                    assessment, approved discounts, payment
                                    compliance, and event-policy review.
                                </div>
                                <div className="grid gap-3 lg:grid-cols-2">
                                    {REVIEW_POLICY_SECTIONS.map((section) => (
                                        <div
                                            key={section.title}
                                            className="border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600"
                                        >
                                            <strong className="block text-slate-950">
                                                {section.title}
                                            </strong>
                                            {section.body}
                                        </div>
                                    ))}
                                </div>
                                <div className="border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                                    <strong className="block text-slate-950">
                                        Excluded from user charges
                                    </strong>
                                    <span>
                                        {EXCLUDED_USER_CHARGES.join(' · ')}
                                    </span>
                                </div>
                                <label
                                    className={cx(
                                        'flex items-start gap-3 border p-3 text-sm',
                                        mergedErrors.policy_acknowledged
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200 bg-white',
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.policy_acknowledged}
                                        onChange={(event) =>
                                            setData(
                                                'policy_acknowledged',
                                                event.target.checked,
                                            )
                                        }
                                        className="mt-1"
                                    />
                                    <span>
                                        <strong className="block text-slate-950">
                                            I have read and agree to the BCCC
                                            booking policy and house rules.
                                        </strong>
                                        <small className="mt-1 block leading-5 text-slate-500">
                                            Includes payment terms, bond
                                            requirement, cancellation policy,
                                            outsourced service requirements, and
                                            post-event responsibility.
                                        </small>
                                    </span>
                                </label>
                                <label
                                    className={cx(
                                        'flex items-start gap-3 border p-3 text-sm',
                                        mergedErrors.accuracy_acknowledged
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200 bg-white',
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.accuracy_acknowledged}
                                        onChange={(event) =>
                                            setData(
                                                'accuracy_acknowledged',
                                                event.target.checked,
                                            )
                                        }
                                        className="mt-1"
                                    />
                                    <span>
                                        <strong className="block text-slate-950">
                                            I confirm that the reservation
                                            details are accurate.
                                        </strong>
                                        <small className="mt-1 block leading-5 text-slate-500">
                                            Incorrect or incomplete data may
                                            delay assessment or approval.
                                        </small>
                                    </span>
                                </label>
                                {mergedErrors.policy_acknowledged ? (
                                    <p className="text-sm font-semibold text-red-600">
                                        {mergedErrors.policy_acknowledged}
                                    </p>
                                ) : null}
                                {mergedErrors.accuracy_acknowledged ? (
                                    <p className="text-sm font-semibold text-red-600">
                                        {mergedErrors.accuracy_acknowledged}
                                    </p>
                                ) : null}
                            </div>
                        </ReviewCard>
                        <ReviewCard
                            title="Final line-item preview"
                            icon={<ReceiptText className="h-4 w-4" />}
                        >
                            <ReviewLineItemsTable
                                rows={scheduleSelections}
                                areaKeys={selectedAreaKeys}
                                ingressPrep={ingressPrep}
                                dressingSelection={data.estimated_other_rentals}
                                organizationType={data.organization_type}
                            />
                        </ReviewCard>
                    </div>
                    <ComputationAside
                        title="Final Computation"
                        subtitle="Discounts visible only here"
                        hideDiscount={false}
                        rows={scheduleSelections}
                        areaKeys={selectedAreaKeys}
                        ingressPrep={ingressPrep}
                        actions={renderStepActions()}
                    />
                </div>
            </SectionShell>
        );
    }

    function renderSubmittedStep() {
        return (
            <section className="bccc-booking-submitted grid min-h-[620px] place-items-center border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="max-w-2xl duration-700 animate-in fade-in slide-in-from-bottom-8">
                    <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#164734] text-white shadow-xl">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <p className="mt-8 text-[11px] font-semibold tracking-[0.34em] text-[#a88633] uppercase">
                        Reservation Submitted
                    </p>
                    <h2 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">
                        Your Reservation has been Submitted
                    </h2>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                        BCCC will review the schedule, active service selection,
                        contact details, MICE draft data, and payment
                        requirements before confirmation.
                    </p>
                    <Link
                        href={bookingBasePath(role)}
                        className="mt-8 inline-flex items-center justify-center gap-2 bg-[#164734] px-6 py-3 text-sm font-semibold tracking-[0.18em] text-white uppercase transition hover:bg-[#0f3325]"
                    >
                        View My Bookings <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>
        );
    }

    function renderActiveStep() {
        if (submitted || activeStep === 4) return renderSubmittedStep();
        if (activeStep === 0) return renderScheduleStep();
        if (activeStep === 1) return renderServicesStep();
        if (activeStep === 2) return renderContactStep();
        return renderReviewStep();
    }

    const currentLeavePromptCopy = leavePrompt
        ? draftExitPromptCopy(leavePrompt.url, leavePrompt.method)
        : null;

    return (
        <BookingRolePageShell
            role={role}
            title={formTitle(role, editing)}
            description={formDescription(role)}
            actions={
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#164734] hover:text-[#164734]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>
            }
            compact
        >
            <form
                onSubmit={handleSubmit}
                className="bccc-booking-responsive-form relative bg-slate-100/70 pb-6 sm:pb-8"
            >
                <StepProgress
                    activeStep={activeStep}
                    submitted={submitted}
                    onStepClick={(index) => {
                        if (index <= activeStep || validateStep(activeStep))
                            setActiveStep(index);
                    }}
                />
                {floatingNotice && typeof document !== 'undefined'
                    ? createPortal(
                          <div
                              className="bccc-booking-floating-notice bccc-booking-viewport-overlay fixed inset-0 z-[2147483600] grid h-[100dvh] w-screen place-items-center overflow-y-auto overscroll-none bg-slate-950/55 p-4 text-sm text-slate-700 backdrop-blur-md"
                              role="dialog"
                              aria-modal="true"
                              onClick={() => setFloatingNotice(null)}
                          >
                              <div
                                  className="w-full max-w-lg border border-red-200 bg-white p-5 shadow-2xl dark:border-red-400/30 dark:bg-slate-950 dark:text-slate-200"
                                  onClick={(event) => event.stopPropagation()}
                              >
                                  <div className="flex gap-3">
                                      <AlertTriangle
                                          className={cx(
                                              'mt-0.5 h-5 w-5 shrink-0',
                                              floatingNotice.tone === 'error'
                                                  ? 'text-red-600'
                                                  : 'text-[#164734]',
                                          )}
                                      />
                                      <div>
                                          <strong className="block text-base text-slate-950 dark:text-white">
                                              {floatingNotice.title}
                                          </strong>
                                          <span className="mt-2 block leading-6">
                                              {floatingNotice.message}
                                          </span>
                                          <button
                                              type="button"
                                              onClick={() =>
                                                  setFloatingNotice(null)
                                              }
                                              className="mt-4 inline-flex min-h-10 items-center justify-center bg-[#164734] px-5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition hover:bg-[#0f3325]"
                                          >
                                              Close
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>,
                          document.body,
                      )
                    : null}
                {leavePrompt &&
                currentLeavePromptCopy &&
                typeof document !== 'undefined'
                    ? createPortal(
                          <div
                              className="bccc-booking-floating-notice bccc-booking-viewport-overlay fixed inset-0 z-[2147483600] grid h-[100dvh] w-screen place-items-center overflow-y-auto overscroll-none bg-slate-950/60 p-4 text-sm text-slate-700 backdrop-blur-md"
                              role="dialog"
                              aria-modal="true"
                              onClick={() =>
                                  leavePrompt.saving
                                      ? null
                                      : setLeavePrompt(null)
                              }
                          >
                              <div
                                  className="bccc-booking-draft-exit-modal my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#d6b56d]/50 bg-white p-5 shadow-2xl dark:border-[#d6b56d]/30 dark:bg-slate-950 dark:text-slate-200"
                                  onClick={(event) => event.stopPropagation()}
                              >
                                  <div className="flex gap-3">
                                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#a88633]" />
                                      <div className="min-w-0">
                                          <strong className="block text-base text-slate-950 dark:text-white">
                                              {currentLeavePromptCopy.title}
                                          </strong>
                                          <span className="mt-2 block leading-6">
                                              {
                                                  currentLeavePromptCopy.description
                                              }
                                          </span>
                                          <div className="mt-5 grid gap-2 sm:grid-cols-3">
                                              <button
                                                  type="button"
                                                  onClick={async () => {
                                                      draftDiscardingRef.current = false;
                                                      setLeavePrompt(
                                                          (current) =>
                                                              current
                                                                  ? {
                                                                        ...current,
                                                                        saving: true,
                                                                    }
                                                                  : current,
                                                      );
                                                      const ok =
                                                          await saveBookingDraft(
                                                              'manual',
                                                          );
                                                      if (ok) {
                                                          continueToUrl(
                                                              leavePrompt.url,
                                                              leavePrompt.method,
                                                          );
                                                          return;
                                                      }
                                                      setLeavePrompt(
                                                          (current) =>
                                                              current
                                                                  ? {
                                                                        ...current,
                                                                        saving: false,
                                                                    }
                                                                  : current,
                                                      );
                                                      showFloatingNotice(
                                                          'Draft was not saved',
                                                          'Please check your connection and try Save as Draft again before leaving.',
                                                          'error',
                                                      );
                                                  }}
                                                  disabled={leavePrompt.saving}
                                                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#164734] px-5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition hover:bg-[#0f3325] disabled:opacity-60"
                                              >
                                                  {leavePrompt.saving ? (
                                                      <LoaderCircle className="h-4 w-4 animate-spin" />
                                                  ) : (
                                                      <ReceiptText className="h-4 w-4" />
                                                  )}
                                                  {leavePrompt.saving
                                                      ? currentLeavePromptCopy.savingLabel
                                                      : currentLeavePromptCopy.saveLabel}
                                              </button>
                                              <button
                                                  type="button"
                                                  onClick={async () => {
                                                      setLeavePrompt(
                                                          (current) =>
                                                              current
                                                                  ? {
                                                                        ...current,
                                                                        saving: true,
                                                                    }
                                                                  : current,
                                                      );
                                                      const ok =
                                                          await discardBookingDraft();

                                                      if (ok) {
                                                          continueToUrl(
                                                              leavePrompt.url,
                                                              leavePrompt.method,
                                                          );
                                                          return;
                                                      }

                                                      setLeavePrompt(
                                                          (current) =>
                                                              current
                                                                  ? {
                                                                        ...current,
                                                                        saving: false,
                                                                    }
                                                                  : current,
                                                      );
                                                      showFloatingNotice(
                                                          'Draft was not discarded',
                                                          'Please check your connection and try Leave Without Saving again. The form stayed open so your draft state is clear.',
                                                          'error',
                                                      );
                                                  }}
                                                  disabled={leavePrompt.saving}
                                                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-xs font-semibold tracking-[0.14em] text-slate-700 uppercase transition hover:border-red-300 hover:text-red-600 disabled:opacity-60 dark:border-white/10 dark:text-slate-200"
                                              >
                                                  {
                                                      currentLeavePromptCopy.discardLabel
                                                  }
                                              </button>
                                              <button
                                                  type="button"
                                                  onClick={() =>
                                                      setLeavePrompt(null)
                                                  }
                                                  disabled={leavePrompt.saving}
                                                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-xs font-semibold tracking-[0.14em] text-slate-700 uppercase transition hover:border-[#164734] hover:text-[#164734] disabled:opacity-60 dark:border-white/10 dark:text-slate-200"
                                              >
                                                  {
                                                      currentLeavePromptCopy.stayLabel
                                                  }
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>,
                          document.body,
                      )
                    : null}
                <div
                    ref={stepRootRef}
                    className="bccc-booking-step-root mx-auto max-w-[1700px] scroll-mt-28 p-3 sm:p-5"
                >
                    {Object.keys(errors as Record<string, string>).length >
                    0 ? (
                        <div className="mb-4 flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <div>
                                <strong className="block">
                                    Please check the form
                                </strong>
                                <span>
                                    {Object.values(
                                        errors as Record<string, string>,
                                    )[0] ||
                                        'The server returned validation feedback after submission.'}
                                </span>
                            </div>
                        </div>
                    ) : null}
                    {renderActiveStep()}
                </div>
                {showPolicyModal ? (
                    <FinalPolicyModal
                        checked={policyModalChecked}
                        setChecked={setPolicyModalChecked}
                        onClose={() => setShowPolicyModal(false)}
                        onConfirm={confirmFinalPolicyAndSubmit}
                        processing={processing}
                    />
                ) : null}
            </form>
        </BookingRolePageShell>
    );

    function ComputationAside({
        title,
        subtitle,
        hideDiscount,
        rows,
        areaKeys,
        ingressPrep: hasIngressPrep,
        actions,
    }: {
        title: string;
        subtitle: string;
        hideDiscount: boolean;
        rows: ScheduleSelection[];
        areaKeys: ActiveVenueKey[];
        ingressPrep: boolean;
        actions?: ReactNode;
    }) {
        const subtotal =
            baseTotal(rows, areaKeys) +
            dressingRoomCharge(data.estimated_other_rentals, rows.length);
        const discountLines = finalDiscountLines(
            rows,
            areaKeys,
            hasIngressPrep,
            data.organization_type,
            dressingRoomCharge(data.estimated_other_rentals, rows.length),
        );
        const discount = discountLines.reduce(
            (sum, line) => sum + line.amount,
            0,
        );
        const total = Math.max(0, subtotal - (hideDiscount ? 0 : discount));
        const bond = REQUIRED_BOND;
        const paymentTotal = total + (hideDiscount ? 0 : bond);
        const baseDown = Math.round(total * 0.5);
        const down = hideDiscount ? baseDown : baseDown + bond;
        const balance = Math.max(0, paymentTotal - down);
        const lineItems = [
            ...reviewLineItems(rows, areaKeys),
            ...dressingRoomLineItems(rows, data.estimated_other_rentals),
        ];
        const additionalHoursTotal = rows.reduce(
            (sum, row) => sum + Number(row.additionalHours || 0),
            0,
        );
        const baseHoursTotal = rows.reduce(
            (sum, row) => sum + blockBaseHours(row.block),
            0,
        );
        const additionalHoursTotalAmount = lineItems
            .filter((line) => line.type === 'additional_hour')
            .reduce((sum, line) => sum + line.amount, 0);
        const packageLabel =
            packageMode === 'packages'
                ? (selectedPackage?.label ?? 'No package selected')
                : areaKeys.length
                  ? 'Manual active service selection'
                  : 'No active service selected';
        const capacityMin =
            packageMode === 'packages'
                ? (selectedPackage?.capacityMin ?? null)
                : null;
        const capacityMax =
            packageMode === 'packages'
                ? (selectedPackage?.capacityMax ?? null)
                : null;
        const capacityLabel =
            selectedCapacityLabel(areaKeys) ||
            (capacityMin && capacityMax
                ? `${capacityMin.toLocaleString()}–${capacityMax.toLocaleString()} pax`
                : capacityMax
                  ? `Up to ${capacityMax.toLocaleString()} pax`
                  : 'Subject to BCCC layout review');
        const scheduleRange = rows.length
            ? `${displayDate(rows[0].date)} to ${displayDate(rows[rows.length - 1].date)}`
            : 'No dates selected';
        const usageLabel = compactListLabel(
            Array.from(new Set(rows.map((row) => blockLabel(row.block)))),
        );
        const perAreaTotals = areaKeys.map((key) => {
            const venue = selectedVenueByKey(key);
            const totalForArea = rows.reduce(
                (sum, row) => sum + dateVenueBaseTotal(row, [key]),
                0,
            );
            const extraForArea = rows.reduce(
                (sum, row) =>
                    sum +
                    venue.rates.extraHour * Number(row.additionalHours || 0),
                0,
            );
            return { key, venue, totalForArea, extraForArea };
        });

        return (
            <aside className="bccc-booking-computation-aside sticky top-24 flex h-fit max-h-[calc(100svh-7rem)] flex-col overflow-hidden border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-[#164734] p-4 text-white">
                    <p className="text-[11px] font-semibold tracking-[0.24em] text-[#f2d58b] uppercase">
                        {title}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{subtitle}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/70">
                        Sticky live summary. Amounts update with selected dates,
                        venue areas, blocks, and additional hours.
                    </p>
                </div>
                <div className="bccc-booking-computation-scroll max-h-[calc(100vh-220px)] overflow-y-auto p-4">
                    <div className="grid gap-3">
                        <div className="rounded-sm border border-[#d6b56d]/50 bg-[#fff8e6] p-3 text-xs leading-5 text-slate-700">
                            <strong className="block text-[11px] tracking-[0.18em] text-[#a88633] uppercase">
                                Reservation Snapshot
                            </strong>
                            <div className="mt-2 grid gap-1.5">
                                <SummaryMiniRow
                                    label="Package / Mode"
                                    value={packageLabel}
                                />
                                <SummaryMiniRow
                                    label="Venue area(s)"
                                    value={compactListLabel(
                                        selectedVenues.map(
                                            (venue) => venue.shortLabel,
                                        ),
                                    )}
                                />
                                <SummaryMiniRow
                                    label="Capacity guide"
                                    value={capacityLabel}
                                />
                                <SummaryMiniRow
                                    label="Guests"
                                    value={
                                        data.number_of_guests
                                            ? `${Number(data.number_of_guests || 0).toLocaleString()} pax`
                                            : 'Not entered yet'
                                    }
                                />
                                <SummaryMiniRow
                                    label="Event scope"
                                    value={
                                        data.event_nature === 'public'
                                            ? 'Government / MICE required'
                                            : 'Private / personal'
                                    }
                                />
                                <SummaryMiniRow
                                    label="MICE time display"
                                    value={displayOverallScheduleDateTimeRange(
                                        rows,
                                    )}
                                />
                                <SummaryMiniRow
                                    label="Additional hours"
                                    value={displayAdditionalHoursSummary(rows)}
                                />
                            </div>
                        </div>

                        <div className="rounded-sm border border-[#d6b56d]/60 bg-[#fff8e6] p-3 text-xs leading-5 text-slate-700">
                            <label className="block text-[11px] font-semibold tracking-[0.2em] text-[#a88633] uppercase">
                                Additional charges / dressing room
                            </label>
                            <select
                                value={data.estimated_other_rentals || 'none'}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setData('estimated_other_rentals', value);
                                    setData(
                                        'estimated_additional_charges',
                                        String(
                                            dressingRoomCharge(
                                                value,
                                                rows.length,
                                            ),
                                        ),
                                    );
                                }}
                                className={inputClass()}
                            >
                                <option value="none">
                                    No dressing room — ₱0
                                </option>
                                <option value="dressing_room_1">
                                    Dressing Room 1 — ₱1,000
                                </option>
                                <option value="dressing_room_2">
                                    Dressing Room 2 — ₱1,000
                                </option>
                                <option value="dressing_room_1_and_2">
                                    Dressing Room 1 & 2 — ₱2,000
                                </option>
                            </select>
                            <div className="mt-2 flex items-center justify-between gap-3 rounded-sm border border-[#d6b56d]/40 bg-white px-3 py-2">
                                <span className="text-slate-600">
                                    Current additional charge
                                </span>
                                <strong className="text-slate-950">
                                    {money(
                                        dressingRoomCharge(
                                            data.estimated_other_rentals,
                                            rows.length,
                                        ),
                                    )}
                                </strong>
                            </div>
                            <p className="mt-2 text-[11px] leading-5 text-slate-600">
                                Dressing room is charged per selected date: one
                                room is {money(1000)} per day and both rooms are{' '}
                                {money(2000)} per day.
                            </p>
                        </div>

                        <div className="border border-slate-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <strong className="block text-[11px] tracking-[0.18em] text-slate-500 uppercase">
                                        Schedule
                                    </strong>
                                    <p className="mt-1 text-sm font-semibold text-slate-950">
                                        {scheduleRange}
                                    </p>
                                </div>
                                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-slate-600 uppercase">
                                    {rows.length} day(s)
                                </span>
                            </div>
                            <div className="mt-3 grid gap-1.5 text-xs text-slate-600">
                                <SummaryMiniRow
                                    label="Usage"
                                    value={usageLabel}
                                />
                                <SummaryMiniRow
                                    label="Base hours"
                                    value={`${baseHoursTotal} hr(s)`}
                                />
                                <SummaryMiniRow
                                    label="Additional / EVE hours"
                                    value={`${additionalHoursTotal} hr(s)`}
                                />
                                <SummaryMiniRow
                                    label="Total hours"
                                    value={`${baseHoursTotal + additionalHoursTotal} hr(s)`}
                                />
                            </div>
                            <div className="mt-3 max-h-44 overflow-y-auto pr-1 text-xs">
                                {rows.map((selection) => (
                                    <div
                                        key={selection.date}
                                        className="mb-2 grid gap-1 border border-slate-100 bg-slate-50 p-2 last:mb-0"
                                    >
                                        <div className="grid gap-1">
                                            <strong className="text-slate-950">
                                                {displayDateLong(
                                                    selection.date,
                                                )}
                                            </strong>
                                            <span className="text-slate-600">
                                                {displaySelectionRange(
                                                    selection,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-3 text-slate-500">
                                            <span>
                                                {blockLabel(selection.block)}
                                            </span>
                                            <span>
                                                {blockBaseHours(
                                                    selection.block,
                                                )}{' '}
                                                base +{' '}
                                                {Number(
                                                    selection.additionalHours ||
                                                        0,
                                                )}{' '}
                                                extra hr(s)
                                            </span>
                                        </div>
                                        {Number(
                                            selection.additionalHours || 0,
                                        ) > 0 ? (
                                            <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                                                Additional/EVE:{' '}
                                                {selection.additionalHours}{' '}
                                                hr(s),{' '}
                                                {displayTimeFromInput('18:00')}{' '}
                                                -{' '}
                                                {displayTimeFromInput(
                                                    endTime(
                                                        selection.block,
                                                        selection.additionalHours,
                                                    ),
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border border-slate-200 bg-white p-3">
                            <strong className="block text-[11px] tracking-[0.18em] text-slate-500 uppercase">
                                Venue Computation
                            </strong>
                            <div className="mt-2 grid gap-2">
                                {perAreaTotals.map(
                                    ({
                                        key,
                                        venue,
                                        totalForArea,
                                        extraForArea,
                                    }) => (
                                        <div
                                            key={key}
                                            className="border-b border-slate-100 pb-2 text-sm last:border-b-0 last:pb-0"
                                        >
                                            <div className="flex justify-between gap-3">
                                                <span className="text-slate-700">
                                                    {venue.shortLabel}
                                                </span>
                                                <strong className="text-right text-slate-950">
                                                    {money(totalForArea)}
                                                </strong>
                                            </div>
                                            <small className="mt-1 block text-slate-500">
                                                Whole day{' '}
                                                {money(venue.rates.wholeDay)} ·
                                                Half day{' '}
                                                {money(venue.rates.halfDay)} ·
                                                Extra hour{' '}
                                                {money(venue.rates.extraHour)}
                                                {extraForArea > 0
                                                    ? ` · Extra ${money(extraForArea)}`
                                                    : ''}
                                            </small>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        {lineItems.length ? (
                            <div className="border border-slate-200 bg-slate-50 p-3">
                                <strong className="block text-[11px] tracking-[0.18em] text-slate-500 uppercase">
                                    Charge Breakdown
                                </strong>
                                <div className="mt-2 grid gap-2">
                                    {lineItems
                                        .slice(0, hideDiscount ? 8 : 12)
                                        .map((line) => (
                                            <div
                                                key={line.key}
                                                className="flex justify-between gap-3 text-xs"
                                            >
                                                <span className="text-slate-600">
                                                    {displayDate(line.date)} ·{' '}
                                                    {line.label}
                                                    <small className="block text-slate-400">
                                                        {line.detail}
                                                    </small>
                                                </span>
                                                <strong className="text-right text-slate-950">
                                                    {money(line.amount)}
                                                </strong>
                                            </div>
                                        ))}
                                    {lineItems.length >
                                    (hideDiscount ? 8 : 12) ? (
                                        <p className="text-xs text-slate-500">
                                            +{' '}
                                            {lineItems.length -
                                                (hideDiscount ? 8 : 12)}{' '}
                                            more line item(s) shown in the final
                                            review table.
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-sm">
                        <div className="flex justify-between gap-3">
                            <span className="text-slate-600">
                                Gross estimate before discounts
                            </span>
                            <strong>{money(subtotal)}</strong>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-slate-600">
                                Additional / EVE hours
                            </span>
                            <strong>{money(additionalHoursTotalAmount)}</strong>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-slate-600">
                                Dressing room / other rentals
                            </span>
                            <strong>
                                {money(
                                    dressingRoomCharge(
                                        data.estimated_other_rentals,
                                        rows.length,
                                    ),
                                )}
                            </strong>
                        </div>
                        {hideDiscount ? (
                            <div className="flex items-start gap-2 border border-dashed border-[#d6b56d] bg-[#fff8e6] p-3 text-xs leading-5 text-slate-600">
                                <Eye className="mt-0.5 h-4 w-4 shrink-0 text-[#a88633]" />
                                {hiddenDiscountNote()}
                            </div>
                        ) : discountLines.length ? (
                            discountLines.map((line) => (
                                <div
                                    key={line.key}
                                    className="grid gap-1 border border-[#d6b56d]/60 bg-[#fff8e6] p-3 text-xs text-[#164734]"
                                >
                                    <div className="flex justify-between gap-3">
                                        <span>{line.label}</span>
                                        <strong>-{money(line.amount)}</strong>
                                    </div>
                                    <small className="text-slate-600">
                                        Basis {money(line.basis)} ·{' '}
                                        {Math.round(line.rate * 100)}%
                                    </small>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-slate-500">
                                No hidden discount is currently applicable.
                            </div>
                        )}
                        {!hideDiscount ? (
                            <div className="flex justify-between gap-3">
                                <span>Discount total</span>
                                <strong>-{money(discount)}</strong>
                            </div>
                        ) : null}
                        {!hideDiscount ? (
                            <div className="flex justify-between gap-3">
                                <span>Required down payment + bond</span>
                                <strong>{money(down)}</strong>
                            </div>
                        ) : null}
                        {!hideDiscount ? (
                            <div className="flex justify-between gap-3">
                                <span>Required bond</span>
                                <strong>{money(bond)}</strong>
                            </div>
                        ) : null}
                        {!hideDiscount ? (
                            <div className="flex justify-between gap-3">
                                <span>Balance after down payment</span>
                                <strong>{money(balance)}</strong>
                            </div>
                        ) : null}
                    </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-end justify-between gap-3">
                        <span>
                            <small className="block text-xs tracking-[0.18em] text-slate-500 uppercase">
                                {hideDiscount
                                    ? 'Running Estimate'
                                    : 'Final Estimate incl. Bond'}
                            </small>
                            <strong className="text-sm text-slate-700">
                                Subject to BCCC review
                            </strong>
                        </span>
                        <strong className="text-2xl tracking-normal text-slate-950">
                            {money(paymentTotal)}
                        </strong>
                    </div>
                    {!hideDiscount ? (
                        <p className="mt-2 text-[11px] leading-5 text-slate-500">
                            Down payment, bond, discounts, and balance are
                            computed from the current selected schedule and
                            venue areas.
                        </p>
                    ) : null}
                </div>
                {actions}
            </aside>
        );
    }
}
function SummaryMiniRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="grid gap-1 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] sm:items-start sm:gap-3">
            <span className="min-w-0 text-slate-500">{label}</span>
            <strong className="min-w-0 text-left break-words text-slate-950 sm:text-right">
                {value || '—'}
            </strong>
        </div>
    );
}

function ReviewCard({
    title,
    icon,
    children,
}: {
    title: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <article className="border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-[#164734] uppercase">
                {icon}
                {title}
            </h3>
            {children}
        </article>
    );
}

function ReviewGrid({ rows }: { rows: Array<[string, ReactNode]> }) {
    return (
        <div className="grid gap-2 md:grid-cols-2">
            {rows.map(([label, value]) => (
                <div
                    key={label}
                    className="border border-slate-100 bg-slate-50 p-3"
                >
                    <small className="block text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                        {label}
                    </small>
                    <strong className="mt-1 block text-sm break-words text-slate-950">
                        {value || '—'}
                    </strong>
                </div>
            ))}
        </div>
    );
}

function ReviewLineItemsTable({
    rows,
    areaKeys,
    ingressPrep,
    dressingSelection,
    organizationType,
}: {
    rows: ScheduleSelection[];
    areaKeys: ActiveVenueKey[];
    ingressPrep: boolean;
    dressingSelection?: string | null;
    organizationType?: string | null;
}) {
    const lineItems = [
        ...reviewLineItems(rows, areaKeys),
        ...dressingRoomLineItems(rows, dressingSelection),
    ];
    const discounts = finalDiscountLines(
        rows,
        areaKeys,
        ingressPrep,
        organizationType,
        dressingRoomCharge(dressingSelection, rows.length),
    );
    const subtotal = lineItems.reduce((sum, line) => sum + line.amount, 0);
    const discountTotal = discounts.reduce((sum, line) => sum + line.amount, 0);
    const finalTotal = Math.max(0, subtotal - discountTotal);
    const totalWithBond = finalTotal + REQUIRED_BOND;

    return (
        <div className="overflow-hidden border border-slate-200">
            <div className="hidden grid-cols-[1.2fr_1.4fr_.7fr_.8fr] bg-[#164734] px-3 py-2 text-[10px] font-semibold tracking-[0.18em] text-white uppercase md:grid">
                <span>Date</span>
                <span>Charge</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Amount</span>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
                {lineItems.map((line) => (
                    <div
                        key={line.key}
                        className="grid gap-1 px-3 py-3 text-sm md:grid-cols-[1.2fr_1.4fr_.7fr_.8fr] md:items-center"
                    >
                        <span className="font-medium text-slate-950">
                            {displayDate(line.date)}
                        </span>
                        <span className="text-slate-600">
                            <strong className="block text-slate-950">
                                {line.label}
                            </strong>
                            <small>{line.detail}</small>
                        </span>
                        <span className="text-slate-600 md:text-right">
                            {line.quantity}
                        </span>
                        <strong className="text-slate-950 md:text-right">
                            {money(line.amount)}
                        </strong>
                    </div>
                ))}
            </div>
            <div className="border-t border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                </div>
                {discounts.length ? (
                    discounts.map((line) => (
                        <div
                            key={line.key}
                            className="mt-2 flex justify-between text-[#164734]"
                        >
                            <span>{line.label}</span>
                            <strong>-{money(line.amount)}</strong>
                        </div>
                    ))
                ) : (
                    <div className="mt-2 text-xs text-slate-500">
                        No discount is currently applicable for this draft
                        computation.
                    </div>
                )}
                <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base">
                    <span>Final estimate</span>
                    <strong>{money(finalTotal)}</strong>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                    <span>Required bond</span>
                    <strong>{money(REQUIRED_BOND)}</strong>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-base">
                    <span>Total payable incl. bond</span>
                    <strong>{money(totalWithBond)}</strong>
                </div>
            </div>
        </div>
    );
}

function FinalPolicyModal({
    checked,
    setChecked,
    onClose,
    onConfirm,
    processing,
}: {
    checked: boolean;
    setChecked: (value: boolean) => void;
    onClose: () => void;
    onConfirm: () => void;
    processing: boolean;
}) {
    const modalRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        requestAnimationFrame(() =>
            modalRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            }),
        );
    }, []);

    return (
        <div className="bccc-booking-final-modal fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div
                ref={modalRef}
                className="bccc-booking-final-modal-card max-h-[90vh] w-full max-w-3xl overflow-hidden border border-white/20 bg-white shadow-2xl duration-300 animate-in fade-in slide-in-from-bottom-6 zoom-in-95"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-[#164734] p-5 text-white">
                    <div>
                        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-[#f2d58b] uppercase">
                            <ScrollText className="h-4 w-4" /> Final
                            confirmation
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-normal">
                            Before submitting your reservation
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-white/75">
                            Read this confirmation. The submit button unlocks
                            only after the checkbox is marked.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-10 w-10 shrink-0 place-items-center border border-white/20 text-white transition hover:bg-white/10"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-5">
                    <div className="grid gap-3">
                        {BCCC_POLICY_NOTICE.map((item) => (
                            <div
                                key={item}
                                className="flex gap-3 border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"
                            >
                                <Check className="mt-1 h-4 w-4 shrink-0 text-[#164734]" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 border border-[#d6b56d]/70 bg-[#fff8e6] p-4 text-sm leading-6 text-slate-700">
                        <strong className="block text-slate-950">
                            Computation privacy notice
                        </strong>
                        Discounts and final billing adjustments are shown only
                        at review/finalization and remain subject to BCCC
                        assessment. Excluded charge categories are not part of
                        this user booking flow.
                    </div>
                    <label className="mt-4 flex items-start gap-3 border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                                setChecked(event.target.checked)
                            }
                            className="mt-1"
                        />
                        <span>
                            <strong className="block text-slate-950">
                                I have read this final notice and I want to
                                submit this reservation request.
                            </strong>
                            <small className="mt-1 block text-slate-500">
                                The request will still be reviewed by BCCC
                                before confirmation.
                            </small>
                        </span>
                    </label>
                </div>
                <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="border border-slate-200 bg-white px-5 py-3 text-sm font-semibold tracking-[0.16em] text-slate-700 uppercase transition hover:border-[#164734] hover:text-[#164734]"
                    >
                        Review Again
                    </button>
                    <button
                        type="button"
                        disabled={!checked || processing}
                        onClick={onConfirm}
                        className="inline-flex items-center justify-center gap-2 bg-[#164734] px-5 py-3 text-sm font-semibold tracking-[0.16em] text-white uppercase transition hover:bg-[#0f3325] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}{' '}
                        Submit Reservation
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BookingFormPage;
