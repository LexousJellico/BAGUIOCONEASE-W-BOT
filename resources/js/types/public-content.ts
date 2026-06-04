import type { ID, LaravelBoolean, MoneyValue } from '@/types';

export type PublicImageSet = {
    image?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    lightImage?: string | null;
    light_image?: string | null;
    darkImage?: string | null;
    dark_image?: string | null;
    mobileImage?: string | null;
    mobile_image?: string | null;
    thumbnail?: string | null;
    thumbnail_url?: string | null;
    alt?: string | null;
};

export type VenueOption = {
    id?: ID;
    label: string;
    value: string;
    name?: string | null;
    slug?: string | null;
    category?: string | null;
    capacity?: string | number | null;
    description?: string | null;
    min_guests?: number | null;
    max_guests?: number | null;
    service_type_id?: ID | null;
    service_id?: ID | null;
    sort_order?: number | null;
    is_active?: LaravelBoolean | null;
};

export type PublicSpaceItem = PublicImageSet & {
    id: ID;
    title: string;
    name?: string | null;
    slug: string;
    category?: string | null;
    eyebrow?: string | null;
    summary?: string | null;
    description?: string | null;
    shortDescription?: string | null;
    short_description?: string | null;
    capacity?: string | number | null;
    size?: string | null;
    area?: string | null;
    location?: string | null;
    amenities?: string[] | null;
    features?: string[] | null;
    rateLabel?: string | null;
    rate_label?: string | null;
    price?: MoneyValue | null;
    buttonLabel?: string | null;
    button_label?: string | null;
    ctaLabel?: string | null;
    cta_label?: string | null;
    href?: string | null;
    homepageVisible?: boolean;
    homepage_visible?: LaravelBoolean | null;
    featured?: boolean;
    is_featured?: LaravelBoolean | null;
    sortOrder?: number | null;
    sort_order?: number | null;
};

export type PublicEventCategory = 'bccc' | 'city' | 'tourism' | 'culture' | string;

export type PublicEventItem = PublicImageSet & {
    id: ID;
    title: string;
    slug?: string | null;
    category?: PublicEventCategory | null;
    type?: PublicEventCategory | null;
    eventType?: string | null;
    event_type?: string | null;
    summary?: string | null;
    description?: string | null;
    excerpt?: string | null;
    details?: string | null;
    venue?: string | null;
    location?: string | null;
    organizer?: string | null;
    startsAt?: string | null;
    starts_at?: string | null;
    endsAt?: string | null;
    ends_at?: string | null;
    date?: string | null;
    dateEnd?: string | null;
    date_end?: string | null;
    event_date?: string | null;
    monthLabel?: string | null;
    month_label?: string | null;
    dayLabel?: string | null;
    day_label?: string | null;
    timeLabel?: string | null;
    time_label?: string | null;
    time?: string | null;
    publicCalendarTitle?: string | null;
    public_calendar_title?: string | null;
    scope?: 'bccc' | 'city' | string | null;
    isPublic?: boolean;
    is_public?: LaravelBoolean | null;
    featured?: boolean;
    is_featured?: LaravelBoolean | null;
    homepageVisible?: boolean;
    homepage_visible?: LaravelBoolean | null;
    href?: string | null;
    url?: string | null;
    buttonLabel?: string | null;
    button_label?: string | null;
    tags?: string[] | null;
    images?: string[] | null;
    sortOrder?: number | null;
    sort_order?: number | null;
};

export type FeaturePackageItem = PublicImageSet & {
    id: ID;
    code?: string | null;
    title: string;
    slug?: string | null;
    subtitle?: string | null;
    eyebrow?: string | null;
    summary?: string | null;
    description?: string | null;
    inclusions?: string[] | null;
    features?: string[] | null;
    areaKeys?: string[] | null;
    area_keys?: string[] | null;
    areaLabels?: string[] | null;
    area_labels?: string[] | null;
    images?: string[] | null;
    price?: MoneyValue | null;
    priceLabel?: string | null;
    price_label?: string | null;
    rateLabel?: string | null;
    rate_label?: string | null;
    validityLabel?: string | null;
    validity_label?: string | null;
    startsAt?: string | null;
    starts_at?: string | null;
    endsAt?: string | null;
    ends_at?: string | null;
    href?: string | null;
    url?: string | null;
    buttonLabel?: string | null;
    button_label?: string | null;
    ctaLabel?: string | null;
    cta_label?: string | null;
    featured?: boolean;
    is_featured?: LaravelBoolean | null;
    homepageVisible?: boolean;
    homepage_visible?: LaravelBoolean | null;
    sortOrder?: number | null;
    sort_order?: number | null;
};

export type HomepageStatItem = {
    id?: ID;
    label: string;
    value: string | number;
    suffix?: string | null;
    prefix?: string | null;
    description?: string | null;
    icon?: string | null;
    sortOrder?: number | null;
    sort_order?: number | null;
};

export type SiteMetricPayload = {
    pageKey?: string;
    page_key?: string;
    label?: string;
    value?: number | string;
    last24Hours?: number | string;
    last_24_hours?: number | string;
    updatedAt?: string | null;
    updated_at?: string | null;
    updatedLabel?: string | null;
    updated_label?: string | null;
};

export type AmenityItem = PublicImageSet & {
    id: ID;
    title: string;
    label?: string | null;
    description?: string | null;
    icon?: string | null;
    href?: string | null;
    sortOrder?: number | null;
    sort_order?: number | null;
};

export type PublicTeamMember = PublicImageSet & {
    id: ID;
    name: string;
    position?: string | null;
    role?: string | null;
    office?: string | null;
    email?: string | null;
    phone?: string | null;
    description?: string | null;
    sortOrder?: number | null;
    sort_order?: number | null;
};

export type PublicSiteSettings = {
    siteName?: string | null;
    site_name?: string | null;
    tagline?: string | null;
    description?: string | null;

    logo_url?: string | null;
    logoUrl?: string | null;
    city_seal_url?: string | null;
    citySealUrl?: string | null;
    baguio_logo_url?: string | null;
    baguioLogoUrl?: string | null;
    breathe_baguio_logo_url?: string | null;
    breatheBaguioLogoUrl?: string | null;

    address?: string | null;
    phone?: string | null;
    email?: string | null;
    officeHours?: string | null;
    office_hours?: string | null;

    mapEmbedUrl?: string | null;
    map_embed_url?: string | null;
    openMapUrl?: string | null;
    open_map_url?: string | null;

    visitaUrl?: string | null;
    visita_url?: string | null;
    creativeBaguioUrl?: string | null;
    creative_baguio_url?: string | null;
    arts_url?: string | null;

    footerDescription?: string | null;
    footer_description?: string | null;
    footerCopyright?: string | null;
    footer_copyright?: string | null;

    facebookUrl?: string | null;
    facebook_url?: string | null;
    websiteUrl?: string | null;
    website_url?: string | null;

    [key: string]: unknown;
};

export type PublicHomePageProps = {
    siteSettings?: PublicSiteSettings;
    venueOptions?: VenueOption[];
    spaces?: PublicSpaceItem[];
    events?: PublicEventItem[];
    bcccEvents?: PublicEventItem[];
    cityEvents?: PublicEventItem[];
    stats?: HomepageStatItem[];
    offers?: FeaturePackageItem[];
    packages?: FeaturePackageItem[];
    amenities?: AmenityItem[];
    members?: PublicTeamMember[];
};

export type CalendarBlockItem = {
    id?: ID;
    title?: string | null;
    date?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    from?: string | null;
    to?: string | null;
    area?: string | null;
    venue?: string | null;
    block?: string | null;
    notes?: string | null;
    public_status?: string | null;
};

export type PublicCalendarDay = {
    date: string;
    status: string;
    title?: string | null;
    description?: string | null;
    note?: string | null;
    venue?: string | null;
    event_titles?: string[];
    calendar_blocks?: CalendarBlockItem[];
    blocks?: unknown;
};

export type PublicCalendarMonthPayload = {
    month: string;
    venue?: string | null;
    days: PublicCalendarDay[];
};
