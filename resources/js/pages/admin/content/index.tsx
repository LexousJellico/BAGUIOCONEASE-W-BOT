import {
    ResourceActionLink,
    ResourceEmptyState,
    ResourcePageShell,
    ResourceStatCard,
} from '@/components/admin-resource/resource-page-shell';
import {
    notifyError,
    notifySuccess,
} from '@/components/shared/app-notice-center';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    Building2,
    CalendarDays,
    Check,
    Eye,
    FileImage,
    Globe2,
    ImagePlus,
    LayoutPanelTop,
    Link2,
    Mail,
    Pencil,
    Plus,
    Save,
    Settings2,
    Trash2,
    UploadCloud,
    UsersRound,
    X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ContentType = 'event' | 'space' | 'package' | 'stat' | 'tourism';
type ContentTabKey =
    | 'overview'
    | 'events'
    | 'facilities'
    | 'stats'
    | 'tourism'
    | 'settings';
type FormPayloadValue = string | boolean | File | null;

type GenericRecord = {
    id?: number | string;

    title?: string | null;
    name?: string | null;
    label?: string | null;
    value?: string | number | null;
    subtitle?: string | null;
    description?: string | null;

    category?: string | null;
    event_category?: string | null;
    starts_at?: string | null;
    startsAt?: string | null;
    event_date?: string | null;
    date?: string | null;
    event_date_to?: string | null;
    dateEnd?: string | null;
    event_time?: string | null;
    time?: string | null;
    venue?: string | null;

    capacity?: string | number | null;
    price_label?: string | null;
    priceLabel?: string | null;

    full_name?: string | null;
    fullName?: string | null;
    designation?: string | null;
    office_section?: string | null;
    officeSection?: string | null;
    unit_name?: string | null;
    unitName?: string | null;
    team_label?: string | null;
    teamLabel?: string | null;
    reports_to_name?: string | null;
    reportsToName?: string | null;
    tree_level?: string | number | null;
    treeLevel?: string | number | null;
    short_bio?: string | null;
    shortBio?: string | null;
    details?: string[] | string | null;
    details_text?: string | null;
    detailsText?: string | null;
    photo?: string | null;
    photo_url?: string | null;
    photoUrl?: string | null;
    photo_path?: string | null;
    photoPath?: string | null;
    is_featured?: boolean | number | string | null;
    isFeatured?: boolean | number | string | null;
    featured?: boolean | number | string | null;

    position?: string | null;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    bio?: string | null;

    image?: string | null;
    image_url?: string | null;
    imageUrl?: string | null;
    image_path?: string | null;
    imagePath?: string | null;

    external_url?: string | null;
    externalUrl?: string | null;

    homepage_visible?: boolean | number | string | null;
    homepageVisible?: boolean;
    is_active?: boolean | number | string | null;
    active?: boolean | number | string | null;

    sort_order?: number | string | null;
    sortOrder?: number | string | null;

    [key: string]: unknown;
};

type SiteSettings = {
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    visita_url?: string | null;
    visitaUrl?: string | null;
    arts_url?: string | null;
    artsUrl?: string | null;
    creative_baguio_url?: string | null;
    creativeBaguioUrl?: string | null;
    footer_description?: string | null;
    footerDescription?: string | null;
    footer_copyright?: string | null;
    footerCopyright?: string | null;
    map_embed_url?: string | null;
    mapEmbedUrl?: string | null;
    open_map_url?: string | null;
    openMapUrl?: string | null;
};

type CollectionLike<T> =
    | T[]
    | {
          data?: T[];
      }
    | null
    | undefined;

type PageProps = {
    events?: CollectionLike<GenericRecord>;
    bcccEvents?: CollectionLike<GenericRecord>;
    cityEvents?: CollectionLike<GenericRecord>;
    spaces?: CollectionLike<GenericRecord>;
    offers?: CollectionLike<GenericRecord>;
    packages?: CollectionLike<GenericRecord>;
    stats?: CollectionLike<GenericRecord>;
    members?: CollectionLike<GenericRecord>;
    tourismMembers?: CollectionLike<GenericRecord>;
    siteSettings?: SiteSettings;
    storageLinked?: boolean;
    flash?: {
        success?: string;
        error?: string;
        message?: string;
    };
    errors?: Record<string, string>;
};

type ContentPayload = Pick<
    PageProps,
    | 'events'
    | 'bcccEvents'
    | 'cityEvents'
    | 'spaces'
    | 'packages'
    | 'stats'
    | 'members'
    | 'tourismMembers'
    | 'siteSettings'
> & { storageLinked?: boolean };

type ModalState =
    | { mode: 'create'; type: ContentType; record?: undefined }
    | { mode: 'edit'; type: ContentType; record: GenericRecord }
    | null;

type Choice = {
    label: string;
    value: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Public Content', href: '/admin/content' },
];

const tabs: Array<{
    key: ContentTabKey;
    title: string;
    subtitle: string;
    icon: LucideIcon;
}> = [
    {
        key: 'overview',
        title: 'Overview',
        subtitle: 'Quick summary',
        icon: LayoutPanelTop,
    },
    {
        key: 'events',
        title: 'Events',
        subtitle: 'BCCC and City highlights',
        icon: CalendarDays,
    },
    {
        key: 'facilities',
        title: 'Facilities',
        subtitle: 'Venue spaces',
        icon: Building2,
    },
    {
        key: 'stats',
        title: 'Stats',
        subtitle: 'Homepage counters',
        icon: BarChart3,
    },
    {
        key: 'tourism',
        title: 'Tourism Office',
        subtitle: 'Members and hierarchy',
        icon: UsersRound,
    },
    {
        key: 'settings',
        title: 'Settings',
        subtitle: 'Footer and contact',
        icon: Settings2,
    },
];

const EVENT_CATEGORY_OPTIONS: Choice[] = [
    { label: 'BCCC Event', value: 'BCCC Event' },
    { label: 'Baguio City Event', value: 'Baguio City Event' },
    { label: 'Convention', value: 'Convention' },
    { label: 'Cultural Event', value: 'Cultural Event' },
    { label: 'Government Program', value: 'Government Program' },
    { label: 'Exhibit / Trade Fair', value: 'Exhibit / Trade Fair' },
    { label: 'Meeting / Seminar', value: 'Meeting / Seminar' },
    { label: 'Conference', value: 'Conference' },
    { label: 'Summit', value: 'Summit' },
    { label: 'Workshop', value: 'Workshop' },
    { label: 'Concert / Performance', value: 'Concert / Performance' },
];

const FACILITY_CAPACITY_OPTIONS: Choice[] = [
    { label: 'Flexible capacity', value: 'Flexible capacity' },
    { label: 'Small group', value: 'Small group' },
    { label: '50 guests', value: '50 guests' },
    { label: '100 guests', value: '100 guests' },
    { label: '250 guests', value: '250 guests' },
    { label: '500 guests', value: '500 guests' },
    { label: '1,000+ guests', value: '1,000+ guests' },
    { label: '2,000+ guests', value: '2,000+ guests' },
];

const DESIGNATION_OPTIONS: Choice[] = [
    { label: 'Department Head', value: 'Department Head' },
    { label: 'Office Head', value: 'Office Head' },
    { label: 'Tourism Officer', value: 'Tourism Officer' },
    { label: 'Culture and Arts Officer', value: 'Culture and Arts Officer' },
    { label: 'BCCC Administrator', value: 'BCCC Administrator' },
    { label: 'Events Coordinator', value: 'Events Coordinator' },
    { label: 'MICE Coordinator', value: 'MICE Coordinator' },
    { label: 'Administrative Staff', value: 'Administrative Staff' },
    { label: 'Technical Staff', value: 'Technical Staff' },
    { label: 'ICT / Software Support', value: 'ICT / Software Support' },
];

const TOURISM_OFFICE_SECTIONS: Choice[] = [
    { label: 'City Tourism, Culture and Arts Office', value: 'CTCAO' },
    { label: 'BCCC Administration', value: 'BCCC Administration' },
    { label: 'Tourism Operations', value: 'Tourism Operations' },
    { label: 'Culture and Arts', value: 'Culture and Arts' },
    { label: 'Events Coordination', value: 'Events Coordination' },
    { label: 'MICE / Convention Support', value: 'MICE / Convention Support' },
    {
        label: 'Information and Assistance',
        value: 'Information and Assistance',
    },
    { label: 'Technical / ICT Support', value: 'Technical / ICT Support' },
];

const TOURISM_TEAM_LABELS: Choice[] = [
    { label: 'Executive / Head Office', value: 'Executive / Head Office' },
    { label: 'Administration', value: 'Administration' },
    { label: 'Operations', value: 'Operations' },
    { label: 'Events', value: 'Events' },
    { label: 'Tourism', value: 'Tourism' },
    { label: 'Culture and Arts', value: 'Culture and Arts' },
    { label: 'MICE', value: 'MICE' },
    { label: 'Technical', value: 'Technical' },
    { label: 'Software / System', value: 'Software / System' },
];

const TREE_LEVEL_OPTIONS: Choice[] = [
    { label: 'Level 1 — Head / Director', value: '1' },
    { label: 'Level 2 — Division / Section Lead', value: '2' },
    { label: 'Level 3 — Coordinator / Supervisor', value: '3' },
    { label: 'Level 4 — Staff / Member', value: '4' },
    { label: 'Level 5 — Support / Assistant', value: '5' },
];

const UNIT_NAME_OPTIONS: Choice[] = [
    { label: 'Administration', value: 'Administration' },
    { label: 'Operations', value: 'Operations' },
    { label: 'Events', value: 'Events' },
    { label: 'Tourism Services', value: 'Tourism Services' },
    { label: 'Culture and Arts', value: 'Culture and Arts' },
    { label: 'MICE Registry', value: 'MICE Registry' },
    { label: 'Technical', value: 'Technical' },
    { label: 'ICT / Software', value: 'ICT / Software' },
    { label: 'Front Desk / Assistance', value: 'Front Desk / Assistance' },
];

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function recordsOf<T>(value?: CollectionLike<T>): T[] {
    if (Array.isArray(value)) return value;

    if (value && typeof value === 'object' && Array.isArray(value.data)) {
        return value.data;
    }

    return [];
}

function sortRecords(records: GenericRecord[]) {
    return [...records].sort((a, b) => {
        const orderA = Number(a.sort_order ?? a.sortOrder ?? 9999);
        const orderB = Number(b.sort_order ?? b.sortOrder ?? 9999);

        if (
            Number.isFinite(orderA) &&
            Number.isFinite(orderB) &&
            orderA !== orderB
        ) {
            return orderA - orderB;
        }

        const idA = Number(a.id ?? 0);
        const idB = Number(b.id ?? 0);

        return idB - idA;
    });
}

function uniqueRecords(records: GenericRecord[]) {
    const seen = new Set<string>();

    return records.filter((record, index) => {
        const id = record.id
            ? `id:${record.id}`
            : `row:${record.title || record.name || index}:${record.date || record.event_date || ''}`;

        if (seen.has(id)) {
            return false;
        }

        seen.add(id);
        return true;
    });
}

const CONTENT_TAB_STORAGE_KEY = 'bccc-admin-content-active-tab';

function storedContentTab(): ContentTabKey {
    if (typeof window === 'undefined') return 'overview';

    const hash = window.location.hash.replace('#', '') as ContentTabKey;
    if (tabs.some((tab) => tab.key === hash)) return hash;

    const stored = window.sessionStorage.getItem(
        CONTENT_TAB_STORAGE_KEY,
    ) as ContentTabKey | null;
    if (stored && tabs.some((tab) => tab.key === stored)) return stored;

    return 'overview';
}

function truthyFlag(value: unknown) {
    return value === true || value === 1 || value === '1' || value === 'true';
}

function visibleFlag(item: GenericRecord) {
    return (
        truthyFlag(item.homepageVisible) ||
        truthyFlag(item.homepage_visible) ||
        truthyFlag(item.is_active) ||
        truthyFlag(item.active)
    );
}

function featuredFlag(item: GenericRecord) {
    return (
        truthyFlag(item.is_featured) ||
        truthyFlag(item.isFeatured) ||
        truthyFlag(item.featured)
    );
}

function titleOf(record: GenericRecord, fallback: string) {
    return String(
        record.title ||
            record.name ||
            record.full_name ||
            record.fullName ||
            record.label ||
            fallback,
    );
}

function imageOf(record: GenericRecord) {
    return String(
        record.image_url ||
            record.imageUrl ||
            record.image_path ||
            record.imagePath ||
            record.image ||
            record.photo_url ||
            record.photoUrl ||
            record.photo_path ||
            record.photoPath ||
            record.photo ||
            '',
    );
}

function absolutePublicImageUrl(value: FormPayloadValue | undefined) {
    if (value instanceof File) {
        return URL.createObjectURL(value);
    }

    const raw = typeof value === 'string' ? value.trim() : '';

    if (!raw) return '';
    if (
        /^(https?:)?\/\//i.test(raw) ||
        raw.startsWith('data:') ||
        raw.startsWith('blob:')
    )
        return raw;
    if (raw.startsWith('/storage/')) return raw;
    if (raw.startsWith('storage/')) return `/${raw}`;
    if (raw.startsWith('/')) return raw;

    return `/storage/${raw.replace(/^public\//, '')}`;
}

function imageSummary(record: GenericRecord) {
    const images = Array.isArray(record.images)
        ? record.images.filter(Boolean).length
        : 0;
    const primary = imageOf(record);

    if (images > 1) return `${images} images · primary ready`;
    if (primary) return 'Image ready';

    return 'No image encoded';
}

function metaOf(type: ContentType, record: GenericRecord) {
    if (type === 'event') {
        return String(
            record.category ||
                record.event_category ||
                record.starts_at ||
                record.startsAt ||
                record.event_date ||
                'Event highlight',
        );
    }

    if (type === 'space') {
        return String(record.capacity || record.subtitle || 'Venue space');
    }

    if (type === 'package') {
        return String(
            record.price_label ||
                record.priceLabel ||
                record.subtitle ||
                'Special offer',
        );
    }

    if (type === 'stat') {
        return `Value: ${String(record.value ?? '—')}`;
    }

    return String(
        record.designation ||
            record.position ||
            record.role ||
            record.office_section ||
            record.officeSection ||
            'Tourism office profile',
    );
}

function contentBasePath() {
    if (
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/manager')
    ) {
        return '/manager';
    }

    return '/admin';
}

function endpointFor(type: ContentType, record?: GenericRecord) {
    const id = record?.id;
    const base = contentBasePath();

    if (type === 'event') return id ? `${base}/events/${id}` : `${base}/events`;
    if (type === 'space') return id ? `${base}/spaces/${id}` : `${base}/spaces`;
    if (type === 'package')
        return id ? `${base}/packages/${id}` : `${base}/packages`;
    if (type === 'stat') return id ? `${base}/stats/${id}` : `${base}/stats`;

    return id ? `${base}/tourism-members/${id}` : `${base}/tourism-members`;
}

function typeForTab(tab: ContentTabKey): ContentType | null {
    if (tab === 'events') return 'event';
    if (tab === 'facilities') return 'space';
    if (tab === 'stats') return 'stat';
    if (tab === 'tourism') return 'tourism';

    return null;
}

function readableType(type: ContentType) {
    if (type === 'event') return 'Event';
    if (type === 'space') return 'Facility';
    if (type === 'package') return 'Offer';
    if (type === 'stat') return 'Homepage Stat';

    return 'Tourism Member';
}

function panelDescription(tab: ContentTabKey) {
    const descriptions: Record<ContentTabKey, string> = {
        overview: 'Quick workflow guide for managing public website content.',
        events: 'Create BCCC event highlights and Baguio City event cards shown on the public website.',
        facilities:
            'Create venue spaces shown on the public Facilities page and homepage showcase.',
        stats: 'Create homepage counters and venue quick facts.',
        tourism:
            'Create Tourism Office members. The form has choices, but every choice field also supports custom input.',
        settings:
            'Update footer contact details, public links, and map references.',
    };

    return descriptions[tab];
}

function detailsToText(value: unknown) {
    if (Array.isArray(value)) return value.filter(Boolean).join('\n');
    if (typeof value === 'string') return value;

    return '';
}

function csrfToken() {
    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableElements(container: HTMLElement | null) {
    if (!container) return [];

    return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector),
    ).filter((element) => {
        const ariaHidden = element.getAttribute('aria-hidden') === 'true';
        const disabled =
            'disabled' in element &&
            Boolean(
                (
                    element as
                        | HTMLButtonElement
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                ).disabled,
            );

        return !ariaHidden && !disabled && element.getClientRects().length > 0;
    });
}

function trapDialogFocus(event: KeyboardEvent, container: HTMLElement | null) {
    if (event.key !== 'Tab') return;

    const elements = focusableElements(container);

    if (elements.length === 0) {
        event.preventDefault();
        container?.focus({ preventScroll: true });
        return;
    }

    const first = elements[0];
    const last = elements[elements.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (!container?.contains(active) || active === first)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
        return;
    }

    if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
    }
}

function extractErrorMessage(
    data: unknown,
    fallback = 'The content could not be saved. Please check the form fields.',
) {
    if (!data || typeof data !== 'object') {
        return fallback;
    }

    const payload = data as {
        message?: string;
        errors?: Record<string, string[] | string>;
    };

    const fieldErrors = Object.entries(payload.errors ?? {})
        .map(([field, messages]) => {
            if (Array.isArray(messages))
                return `${field}: ${messages.join(', ')}`;

            return `${field}: ${messages}`;
        })
        .join('\n');

    return fieldErrors || payload.message || fallback;
}

async function submitContentRequest(endpoint: string, payload: FormData) {
    const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: payload,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : null;

    if (!response.ok) {
        throw new Error(
            extractErrorMessage(
                data,
                `Save failed. Server returned ${response.status}.`,
            ),
        );
    }

    return data;
}

function appendContentPayload(
    payload: FormData,
    type: ContentType,
    form: Record<string, FormPayloadValue>,
) {
    Object.entries(form).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        if (value instanceof File) {
            payload.append(key, value);
            return;
        }

        if (typeof value === 'boolean') {
            payload.append(key, value ? '1' : '0');
            return;
        }

        payload.append(key, String(value));
    });

    if (type === 'tourism') {
        payload.set('active', form.is_active ? '1' : '0');
        payload.set('featured', form.is_featured ? '1' : '0');
        payload.set('is_active', form.is_active ? '1' : '0');
        payload.set('is_featured', form.is_featured ? '1' : '0');

        if (typeof form.details_text === 'string') {
            payload.set('details_text', form.details_text);
        }
    }
}

function defaultForm(
    type: ContentType,
    record?: GenericRecord,
): Record<string, FormPayloadValue> {
    if (type === 'event') {
        return {
            title: String(record?.title ?? record?.name ?? ''),
            category: String(
                record?.category ?? record?.event_category ?? 'BCCC Event',
            ),
            event_category: String(
                record?.event_category ?? record?.category ?? 'BCCC Event',
            ),
            starts_at: String(
                record?.starts_at ??
                    record?.startsAt ??
                    record?.event_date ??
                    record?.date ??
                    '',
            ),
            event_date: String(
                record?.event_date ?? record?.starts_at ?? record?.date ?? '',
            ),
            event_date_to: String(
                record?.event_date_to ??
                    record?.dateEnd ??
                    record?.event_date ??
                    record?.date ??
                    '',
            ),
            event_time: String(record?.event_time ?? record?.time ?? ''),
            venue: String(
                record?.venue ?? 'Baguio Convention and Cultural Center',
            ),
            description: String(record?.description ?? ''),
            note: String(record?.note ?? ''),
            image_path: String(
                record?.image_path ??
                    record?.imagePath ??
                    imageOf(record ?? {}),
            ),
            external_url: String(
                record?.external_url ?? record?.externalUrl ?? '',
            ),
            homepage_visible: visibleFlag(record ?? {}) || !record,
            sort_order: String(record?.sort_order ?? record?.sortOrder ?? ''),
            image: null,
        };
    }

    if (type === 'space') {
        return {
            title: String(record?.title ?? record?.name ?? ''),
            name: String(record?.name ?? record?.title ?? ''),
            category: String(record?.category ?? 'Venue Space'),
            subtitle: String(record?.subtitle ?? ''),
            capacity: String(record?.capacity ?? 'Flexible capacity'),
            short_description: String(
                record?.short_description ??
                    record?.shortDescription ??
                    record?.summary ??
                    '',
            ),
            summary: String(
                record?.summary ??
                    record?.short_description ??
                    record?.shortDescription ??
                    '',
            ),
            description: String(record?.description ?? ''),
            details_text: String(
                record?.details_text ??
                    record?.detailsText ??
                    detailsToText(record?.details),
            ),
            image_path: String(
                record?.image_path ??
                    record?.imagePath ??
                    imageOf(record ?? {}),
            ),
            homepage_visible: visibleFlag(record ?? {}) || !record,
            sort_order: String(record?.sort_order ?? record?.sortOrder ?? ''),
            image: null,
        };
    }

    if (type === 'package') {
        return {
            title: String(record?.title ?? record?.name ?? ''),
            subtitle: String(record?.subtitle ?? ''),
            price_label: String(
                record?.price_label ?? record?.priceLabel ?? '',
            ),
            description: String(record?.description ?? ''),
            image_path: String(
                record?.image_path ??
                    record?.imagePath ??
                    imageOf(record ?? {}),
            ),
            external_url: String(
                record?.external_url ?? record?.externalUrl ?? '',
            ),
            homepage_visible: visibleFlag(record ?? {}) || !record,
            sort_order: String(record?.sort_order ?? record?.sortOrder ?? ''),
            image: null,
        };
    }

    if (type === 'stat') {
        return {
            label: String(record?.label ?? record?.title ?? ''),
            value: String(record?.value ?? ''),
            description: String(record?.description ?? ''),
            homepage_visible: visibleFlag(record ?? {}) || !record,
            sort_order: String(record?.sort_order ?? record?.sortOrder ?? ''),
        };
    }

    return {
        full_name: String(
            record?.full_name ??
                record?.fullName ??
                record?.name ??
                record?.title ??
                '',
        ),
        designation: String(
            record?.designation ?? record?.position ?? record?.role ?? '',
        ),
        office_section: String(
            record?.office_section ?? record?.officeSection ?? 'CTCAO',
        ),
        unit_name: String(record?.unit_name ?? record?.unitName ?? ''),
        team_label: String(record?.team_label ?? record?.teamLabel ?? ''),
        reports_to_name: String(
            record?.reports_to_name ?? record?.reportsToName ?? '',
        ),
        tree_level: String(record?.tree_level ?? record?.treeLevel ?? '4'),
        email: String(record?.email ?? ''),
        phone: String(record?.phone ?? ''),
        short_bio: String(
            record?.short_bio ??
                record?.shortBio ??
                record?.bio ??
                record?.description ??
                '',
        ),
        details_text: String(
            record?.details_text ??
                record?.detailsText ??
                detailsToText(record?.details),
        ),
        is_active: visibleFlag(record ?? {}) || !record,
        is_featured: featuredFlag(record ?? {}),
        sort_order: String(record?.sort_order ?? record?.sortOrder ?? ''),
        photo: null,
    };
}

function settingValue(
    settings: SiteSettings,
    camel: keyof SiteSettings,
    snake: keyof SiteSettings,
) {
    return String(settings[camel] ?? settings[snake] ?? '');
}

export default function AdminContentIndex() {
    const { props } = usePage<PageProps>();
    const [syncedPayload, setSyncedPayload] = useState<ContentPayload>({});
    const [syncingContent, setSyncingContent] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function syncContent() {
            setSyncingContent(true);

            try {
                const response = await fetch(
                    `${contentBasePath()}/content/data`,
                    {
                        method: 'GET',
                        credentials: 'same-origin',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                if (!response.ok) return;

                const payload = (await response.json()) as ContentPayload;

                if (!cancelled) {
                    setSyncedPayload(payload);
                }
            } catch {
                // Keep Inertia props if fetch fails.
            } finally {
                if (!cancelled) {
                    setSyncingContent(false);
                }
            }
        }

        syncContent();

        return () => {
            cancelled = true;
        };
    }, []);

    const [activeTab, setActiveTab] = useState<ContentTabKey>(() =>
        storedContentTab(),
    );
    const [modal, setModal] = useState<ModalState>(null);

    const [previewOpen, setPreviewOpen] = useState(false);

    const source = {
        ...props,
        ...syncedPayload,
    };

    const events = useMemo(
        () =>
            sortRecords(
                uniqueRecords([
                    ...recordsOf(source.events),
                    ...recordsOf(source.bcccEvents),
                    ...recordsOf(source.cityEvents),
                ]),
            ),
        [source.events, source.bcccEvents, source.cityEvents],
    );

    const spaces = useMemo(
        () => sortRecords(recordsOf(source.spaces)),
        [source.spaces],
    );

    const stats = useMemo(
        () => sortRecords(recordsOf(source.stats)),
        [source.stats],
    );

    const members = useMemo(() => {
        const directMembers = recordsOf(source.members);
        const fallbackTourismMembers = recordsOf(source.tourismMembers);

        return sortRecords(
            directMembers.length > 0 ? directMembers : fallbackTourismMembers,
        );
    }, [source.members, source.tourismMembers]);

    const settings = source.siteSettings ?? {};

    const activeType = typeForTab(activeTab);
    const activeTabInfo = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

    const activeRecords =
        activeTab === 'events'
            ? events
            : activeTab === 'facilities'
              ? spaces
              : activeTab === 'stats'
                ? stats
                : activeTab === 'tourism'
                  ? members
                  : [];

    function selectTab(tab: ContentTabKey) {
        setActiveTab(tab);

        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(CONTENT_TAB_STORAGE_KEY, tab);
            window.history.replaceState(
                null,
                '',
                `${window.location.pathname}${window.location.search}#${tab}`,
            );
        }
    }

    function handleSaved(content?: ContentPayload) {
        if (content) {
            setSyncedPayload(content);
        }
    }

    function openCreate() {
        if (!activeType) return;
        setModal({ mode: 'create', type: activeType });
    }

    return (
        <>
            <Head title="Public Content Manager" />

            <ResourcePageShell
                title="Public Content Manager"
                eyebrow="Frontend Configuration"
                icon={Globe2}
                breadcrumbs={breadcrumbs}
                subtitle="Manage public website content in one clean page. Fields with choices also support custom input through Other."
                actions={
                    <>
                        <button
                            type="button"
                            onClick={() => setPreviewOpen(true)}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                        >
                            <Eye className="h-4 w-4" />
                            Preview Site
                        </button>

                        <ResourceActionLink href="/admin/guidelines-contacts">
                            Guidelines & Contacts
                        </ResourceActionLink>
                    </>
                }
            >
                <FlashMessages flash={props.flash} errors={props.errors} />
                {syncingContent ? (
                    <div className="mb-5 rounded-[1.2rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/80 p-4 text-sm font-semibold text-[#6e604c] dark:border-white/10 dark:bg-white/[0.055] dark:text-white/60">
                        Syncing latest database content...
                    </div>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <ResourceStatCard
                        label="Events"
                        value={events.length}
                        description={`${events.filter(visibleFlag).length} visible.`}
                        icon={CalendarDays}
                    />
                    <ResourceStatCard
                        label="Facilities"
                        value={spaces.length}
                        description={`${spaces.filter(visibleFlag).length} visible.`}
                        icon={Building2}
                    />
                    <ResourceStatCard
                        label="Stats"
                        value={stats.length}
                        description="Homepage counters."
                        icon={BarChart3}
                    />
                    <ResourceStatCard
                        label="Tourism"
                        value={members.length}
                        description={`${members.filter(visibleFlag).length} active.`}
                        icon={UsersRound}
                    />
                    <ResourceStatCard
                        label="Contact"
                        value={settings.email ? 'Set' : 'Missing'}
                        description={settings.email || 'No email configured.'}
                        icon={Mail}
                    />
                </div>

                <section className="mt-5 rounded-[1.65rem] border border-[#d9c7a6]/70 bg-white/82 p-3 shadow-[0_18px_58px_rgba(47,37,23,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const selected = activeTab === tab.key;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => selectTab(tab.key)}
                                    className={cx(
                                        'group flex min-h-[5rem] items-center gap-3 rounded-[1.15rem] border px-3 py-3 text-left transition duration-200',
                                        selected
                                            ? 'border-[#b08d48]/80 bg-[#2f2517] text-white shadow-[0_18px_44px_rgba(47,37,23,0.20)] dark:border-white/20 dark:bg-white dark:text-[#17120b]'
                                            : 'border-[#eadcc2]/80 bg-[#fffaf0]/70 text-[#4a3b27] hover:border-[#b08d48]/70 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:text-white/68 dark:hover:bg-white/9',
                                    )}
                                >
                                    <span
                                        className={cx(
                                            'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                                            selected
                                                ? 'bg-white/14 text-white dark:bg-[#17120b]/8 dark:text-[#17120b]'
                                                : 'bg-[#efe3cd] text-[#8b672d] group-hover:bg-[#f7ecd8] dark:bg-white/8 dark:text-[#f1d89b]',
                                        )}
                                    >
                                        <Icon className="h-4.5 w-4.5" />
                                    </span>

                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold">
                                            {tab.title}
                                        </span>
                                        <span
                                            className={cx(
                                                'mt-0.5 block truncate text-[11px] font-medium',
                                                selected
                                                    ? 'text-white/62 dark:text-[#17120b]/58'
                                                    : 'opacity-62',
                                            )}
                                        >
                                            {tab.subtitle}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="mt-5 overflow-hidden rounded-[1.65rem] border border-[#d9c7a6]/70 bg-white/82 shadow-[0_18px_58px_rgba(47,37,23,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
                    <div className="flex flex-col gap-4 border-b border-[#eadcc2]/80 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-white/10">
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.22em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                                {activeTabInfo.subtitle}
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#21180d] dark:text-white">
                                {activeTabInfo.title}
                            </h2>
                            <p className="mt-2 max-w-[70ch] text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                {panelDescription(activeTab)}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {activeType ? (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create {readableType(activeType)}
                                </button>
                            ) : null}

                            {activeTab === 'overview' ? (
                                <button
                                    type="button"
                                    onClick={() => setPreviewOpen(true)}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                >
                                    <Eye className="h-4 w-4" />
                                    Preview Site
                                </button>
                            ) : null}

                            {activeTab === 'settings' ? (
                                <button
                                    type="submit"
                                    form="site-settings-form"
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                >
                                    <Save className="h-4 w-4" />
                                    Save Settings
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="p-5">
                        {activeTab === 'overview' ? (
                            <OverviewPanel />
                        ) : activeTab === 'settings' ? (
                            <SettingsPanel settings={settings} />
                        ) : activeType ? (
                            <RecordGrid
                                type={activeType}
                                records={activeRecords}
                                onCreate={openCreate}
                                onEdit={(record) =>
                                    setModal({
                                        mode: 'edit',
                                        type: activeType,
                                        record,
                                    })
                                }
                            />
                        ) : null}
                    </div>
                </section>
            </ResourcePageShell>

            {modal ? (
                <ContentModal
                    modal={modal}
                    onClose={() => setModal(null)}
                    onSaved={handleSaved}
                />
            ) : null}

            <SitePreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
            />
        </>
    );
}
function SitePreviewModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const [loaded, setLoaded] = useState(false);
    const dialogRef = useRef<HTMLElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) {
            setLoaded(false);
            return;
        }

        previouslyFocusedRef.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        function handleKeydown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
                return;
            }

            trapDialogFocus(event, dialogRef.current);
        }

        document.addEventListener('keydown', handleKeydown);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const focusFrame = window.requestAnimationFrame(() => {
            const firstAction = dialogRef.current?.querySelector<HTMLElement>(
                'button, a[href], iframe',
            );
            (firstAction ?? dialogRef.current)?.focus({ preventScroll: true });
        });

        return () => {
            window.cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKeydown);
            document.body.style.overflow = previousOverflow;
            previouslyFocusedRef.current?.focus?.({ preventScroll: true });
        };
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className="admin-content-preview-overlay fixed inset-0 z-[100000] grid min-h-dvh overflow-hidden bg-[#17120b]/50 p-2 backdrop-blur-xl sm:p-4 lg:p-5 dark:bg-black/70">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 cursor-default"
                aria-label="Close preview"
            />

            <section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Public site preview"
                tabIndex={-1}
                className="admin-content-preview-dialog relative mx-auto flex h-[min(92dvh,54rem)] min-h-0 w-full max-w-[96rem] flex-col overflow-hidden rounded-[1.6rem] border border-[#d9c7a6]/70 bg-[#f8f5ef] shadow-[0_34px_120px_rgba(0,0,0,0.36)] outline-none dark:border-white/10 dark:bg-[#0d0f12]"
            >
                <header className="admin-content-preview-header flex shrink-0 flex-col gap-3 border-b border-[#eadcc2]/80 bg-white/86 px-4 py-3 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-white/10 dark:bg-white/[0.055]">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.22em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Public Site Preview
                        </p>

                        <h2 className="mt-1 truncate text-lg font-semibold tracking-normal text-[#21180d] dark:text-white">
                            BCCC EASE Public Website
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/"
                            target="_blank"
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                        >
                            <Globe2 className="h-4 w-4" />
                            Open Full Page
                        </Link>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-4 text-sm font-semibold text-white transition hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                        >
                            <X className="h-4 w-4" />
                            Close
                        </button>
                    </div>
                </header>

                <div className="relative min-h-0 flex-1 bg-[#ede3d2] dark:bg-black">
                    {!loaded ? (
                        <div className="absolute inset-0 z-10 grid place-items-center bg-[#f8f5ef]/90 text-[#2f2517] dark:bg-[#0d0f12]/90 dark:text-white">
                            <div className="text-center">
                                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#d9c7a6] border-t-[#2f2517] dark:border-white/20 dark:border-t-white" />
                                <p className="mt-4 text-sm font-semibold">
                                    Loading public preview...
                                </p>
                            </div>
                        </div>
                    ) : null}

                    <iframe
                        key={
                            open
                                ? 'public-preview-open'
                                : 'public-preview-closed'
                        }
                        src="/"
                        title="Public Site Preview"
                        onLoad={() => setLoaded(true)}
                        className="h-full min-h-0 w-full border-0 bg-white"
                    />
                </div>
            </section>
        </div>,
        document.body,
    );
}

function FlashMessages({
    flash,
    errors,
}: {
    flash?: PageProps['flash'];
    errors?: Record<string, string>;
}) {
    return (
        <>
            {flash?.success || flash?.message ? (
                <div className="mb-5 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                    {flash.success || flash.message}
                </div>
            ) : null}

            {flash?.error ? (
                <div className="mb-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                    {flash.error}
                </div>
            ) : null}

            {errors && Object.keys(errors).length > 0 ? (
                <div className="mb-5 rounded-[1.2rem] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                    <p>Please check the form fields:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        {Object.entries(errors).map(([field, error]) => (
                            <li key={field}>
                                {field}: {error}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </>
    );
}

function OverviewPanel() {
    const steps = [
        {
            title: 'Choose a section',
            description:
                'Use the tabs above: Events, Facilities, Stats, Tourism, or Settings.',
            icon: LayoutPanelTop,
        },
        {
            title: 'Create or edit',
            description:
                'Click Create, then fill the simplified form with choices or custom “Other” inputs.',
            icon: Plus,
        },
        {
            title: 'Preview website',
            description:
                'After saving, open the public site and check if the content displays correctly.',
            icon: Eye,
        },
    ];

    return (
        <div className="grid gap-3 md:grid-cols-3">
            {steps.map((item) => {
                const Icon = item.icon;

                return (
                    <article
                        key={item.title}
                        className="rounded-[1.25rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-5 dark:border-white/10 dark:bg-white/[0.035]"
                    >
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                            <Icon className="h-5 w-5" />
                        </span>

                        <h3 className="mt-4 text-lg font-semibold tracking-normal text-[#21180d] dark:text-white">
                            {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                            {item.description}
                        </p>
                    </article>
                );
            })}
        </div>
    );
}

function RecordGrid({
    type,
    records,
    onCreate,
    onEdit,
}: {
    type: ContentType;
    records: GenericRecord[];
    onCreate: () => void;
    onEdit: (record: GenericRecord) => void;
}) {
    function destroy(record: GenericRecord) {
        if (!record.id) return;
        if (!window.confirm(`Delete "${titleOf(record, readableType(type))}"?`))
            return;

        router.delete(endpointFor(type, record), {
            preserveUrl: true,
            onSuccess: () => {
                notifySuccess(
                    `${readableType(type)} deleted successfully.`,
                    'Deleted successfully',
                );
            },
            onError: () => {
                notifyError(
                    `Unable to delete this ${readableType(type).toLowerCase()}.`,
                    'Delete failed',
                );
            },
        });
    }

    if (records.length === 0) {
        return (
            <div>
                <ResourceEmptyState
                    icon={LayoutPanelTop}
                    title={`No ${readableType(type)} records yet`}
                    description="Create a record so this section can appear on the public website."
                />

                <div className="mt-4 flex justify-center">
                    <button
                        type="button"
                        onClick={onCreate}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                    >
                        <Plus className="h-4 w-4" />
                        Create {readableType(type)}
                    </button>
                </div>
            </div>
        );
    }

    if (type === 'tourism') {
        return (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                {records.map((record, index) => (
                    <TourismMemberPortraitCard
                        key={`${record.id ?? index}`}
                        record={record}
                        onEdit={() => onEdit(record)}
                        onDelete={() => destroy(record)}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {records.map((record, index) => (
                <article
                    key={`${record.id ?? index}`}
                    className="overflow-hidden rounded-[1.25rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 shadow-[0_14px_40px_rgba(47,37,23,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(47,37,23,0.12)] dark:border-white/10 dark:bg-white/[0.035]"
                >
                    {imageOf(record) ? (
                        <img
                            src={absolutePublicImageUrl(imageOf(record))}
                            alt={titleOf(record, readableType(type))}
                            className="h-40 w-full object-cover"
                        />
                    ) : (
                        <div className="grid h-40 place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                            <FileImage className="h-8 w-8" />
                        </div>
                    )}

                    <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                <LayoutPanelTop className="h-4 w-4" />
                            </span>

                            <div className="flex flex-wrap justify-end gap-1.5">
                                <span
                                    className={
                                        visibleFlag(record)
                                            ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200'
                                            : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-white/52'
                                    }
                                >
                                    {visibleFlag(record) ? 'Visible' : 'Hidden'}
                                </span>
                            </div>
                        </div>

                        <h3 className="mt-4 line-clamp-2 text-lg font-semibold tracking-normal text-[#21180d] dark:text-white">
                            {titleOf(record, readableType(type))}
                        </h3>

                        <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                            {metaOf(type, record)}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-[#8a7a63] dark:text-white/42">
                            {imageSummary(record)}
                            {type === 'event' &&
                            (record.external_url || record.externalUrl)
                                ? ' · external link set'
                                : ''}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => onEdit(record)}
                                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit
                            </button>

                            <button
                                type="button"
                                onClick={() => destroy(record)}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}

function TourismMemberPortraitCard({
    record,
    onEdit,
    onDelete,
}: {
    record: GenericRecord;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const name = titleOf(record, 'Tourism Member');
    const photo = imageOf(record);
    const designation = String(
        record.designation ||
            record.position ||
            record.role ||
            'Tourism Office Member',
    );
    const section = String(
        record.office_section ||
            record.officeSection ||
            record.unit_name ||
            record.unitName ||
            'CTCAO',
    );
    const team = String(record.team_label || record.teamLabel || '');
    const bio = String(
        record.short_bio ||
            record.shortBio ||
            record.bio ||
            record.description ||
            '',
    );
    const email = String(record.email || '');
    const phone = String(record.phone || '');
    const level = Number(record.tree_level ?? record.treeLevel ?? 1);

    return (
        <article
            tabIndex={0}
            className="group flex min-h-[28rem] flex-col overflow-hidden rounded-[0.35rem] border border-[#c6d4d7]/80 bg-[#edf3f5] text-center shadow-[0_18px_50px_rgba(21,61,102,0.12)] transition duration-300 hover:-translate-y-1 hover:border-[#176456]/45 dark:border-white/10 dark:bg-white/[0.055]"
        >
            <div className="flex flex-wrap items-center justify-center gap-2 px-4 pt-4">
                <span
                    className={
                        visibleFlag(record)
                            ? 'rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-[10px] font-black tracking-[0.16em] text-emerald-700 uppercase dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100'
                            : 'rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black tracking-[0.16em] text-slate-500 uppercase dark:border-white/10 dark:bg-white/10 dark:text-white/60'
                    }
                >
                    {visibleFlag(record) ? 'Active' : 'Hidden'}
                </span>

                {featuredFlag(record) ? (
                    <span className="rounded-full border border-[#d6b56d]/60 bg-[#fff8e6] px-3 py-1 text-[10px] font-black tracking-[0.16em] text-[#8b641d] uppercase dark:border-[#d6b56d]/25 dark:bg-[#d6b56d]/10 dark:text-[#f4d894]">
                        Featured
                    </span>
                ) : null}

                <span className="rounded-full border border-[#176456]/20 bg-white px-3 py-1 text-[10px] font-black tracking-[0.16em] text-[#176456] uppercase dark:border-white/10 dark:bg-white/10 dark:text-[#9fe8dc]">
                    Level {Number.isFinite(level) ? level : 1}
                </span>
            </div>

            <div className="px-5 pb-5 pt-4">
                <p className="min-h-5 truncate text-[11px] font-black uppercase tracking-[0.09em] text-[#334357] dark:text-white/72">
                    {section}
                </p>

                <p className="mt-2 line-clamp-1 text-[11px] font-black uppercase tracking-[0.06em] text-[#176456] dark:text-[#9fe8dc]">
                    {designation}
                </p>

                <div className="mx-auto mt-5 h-[13rem] w-full overflow-hidden rounded-[0.2rem] border border-white/80 bg-white shadow-[0_12px_30px_rgba(21,61,102,0.10)] dark:border-white/10 dark:bg-white/[0.08]">
                    {photo ? (
                        <img
                            src={absolutePublicImageUrl(photo)}
                            alt={name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="grid h-full w-full place-items-center bg-[#dfe9ea] text-[#176456] dark:bg-white/10 dark:text-[#9fe8dc]">
                            <UsersRound className="h-14 w-14 opacity-70" />
                        </div>
                    )}
                </div>

                <h3 className="mt-5 text-[1.35rem] leading-tight font-black uppercase text-[#17243a] dark:text-white">
                    {name}
                </h3>

                {team ? (
                    <p className="mt-2 text-xs font-bold tracking-[0.14em] text-[#176456]/70 uppercase dark:text-[#9fe8dc]/70">
                        {team}
                    </p>
                ) : null}

                <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[#334357] dark:text-white/65">
                    {bio || 'No short bio encoded yet.'}
                </p>

                <div className="mt-4 grid gap-1 text-xs font-semibold text-[#334357]/75 dark:text-white/60">
                    {email ? <span className="truncate">{email}</span> : null}
                    {phone ? <span className="truncate">{phone}</span> : null}
                </div>

                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[#176456]/18 bg-white px-4 text-sm font-bold text-[#176456] transition hover:bg-[#176456] hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-[#9fe8dc]"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={onDelete}
                        className="inline-flex min-h-10 items-center justify-center rounded-full bg-rose-600 px-4 text-white transition hover:bg-rose-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </article>
    );
}

function ContentModal({
    modal,
    onClose,
    onSaved,
}: {
    modal: ModalState;
    onClose: () => void;
    onSaved: (content?: ContentPayload) => void;
}) {
    const [form, setForm] = useState<Record<string, FormPayloadValue>>(() =>
        modal ? defaultForm(modal.type, modal.record) : {},
    );
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const dialogRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const processingRef = useRef(false);

    useEffect(() => {
        processingRef.current = processing;
    }, [processing]);

    useEffect(() => {
        if (!modal) return;

        previouslyFocusedRef.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function handleKeydown(event: KeyboardEvent) {
            if (event.key === 'Escape' && !processingRef.current) {
                onClose();
                return;
            }

            trapDialogFocus(event, dialogRef.current);
        }

        document.addEventListener('keydown', handleKeydown);

        const focusFrame = window.requestAnimationFrame(() => {
            const firstField = dialogRef.current?.querySelector<HTMLElement>(
                'form input:not([type="hidden"]), form select, form textarea, form button[type="submit"]',
            );
            (firstField ?? dialogRef.current)?.focus({ preventScroll: true });
        });

        return () => {
            window.cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKeydown);
            document.body.style.overflow = previousOverflow;
            previouslyFocusedRef.current?.focus?.({ preventScroll: true });
        };
    }, [modal, onClose]);

    if (!modal || typeof document === 'undefined') return null;

    const formId = 'admin-content-modal-form';

    function update(field: string, value: FormPayloadValue) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setErrorMessage('');
        setSuccessMessage('');
    }

    async function submit(event: FormEvent) {
        event.preventDefault();

        if (processing) return;

        setProcessing(true);
        setErrorMessage('');
        setSuccessMessage('');

        if (!modal) return;

        const activeModal = modal;
        const payload = new FormData();
        appendContentPayload(payload, activeModal.type, form);

        if (activeModal.mode === 'edit') {
            payload.append('_method', 'PUT');
        }

        try {
            const result = await submitContentRequest(
                endpointFor(activeModal.type, activeModal.record),
                payload,
            );
            const message = extractSuccessMessage(result);

            setSuccessMessage(message);
            notifySuccess(message, 'Saved successfully');

            window.setTimeout(() => {
                onSaved(
                    (result?.content ?? undefined) as
                        | ContentPayload
                        | undefined,
                );
                onClose();
            }, 700);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unable to save content.';

            setErrorMessage(message);
            notifyError(message, 'Save failed');
        } finally {
            setProcessing(false);
        }
    }

    return createPortal(
        <div className="admin-content-modal-overlay fixed inset-0 z-[99999] grid min-h-dvh overflow-hidden bg-[#17120b]/45 p-2 backdrop-blur-xl sm:p-4 lg:p-6 dark:bg-black/60">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 cursor-default"
                aria-label="Close modal"
            />

            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={`${modal.mode === 'create' ? 'Create' : 'Edit'} ${readableType(modal.type)}`}
                tabIndex={-1}
                className="admin-content-modal-dialog relative mx-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-[52rem] flex-col overflow-hidden rounded-[1.75rem] border border-[#d9c7a6]/70 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.28)] outline-none sm:max-h-[calc(100dvh-2rem)] lg:max-h-[calc(100dvh-3rem)] dark:border-white/10 dark:bg-[#101419]"
            >
                <div className="admin-content-modal-header flex shrink-0 items-start justify-between gap-4 border-b border-[#eadcc2]/80 p-4 sm:p-5 dark:border-white/10">
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.22em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                            Content Manager
                        </p>

                        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#21180d] dark:text-white">
                            {modal.mode === 'create' ? 'Create' : 'Edit'}{' '}
                            {readableType(modal.type)}
                        </h2>

                        <p className="mt-2 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                            Use the simple fields and choices below. Select
                            Other when you need to type a custom value.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d9c7a6]/70 bg-white text-[#2f2517] transition hover:bg-[#f7f0e3] disabled:opacity-50 dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form
                    id={formId}
                    onSubmit={submit}
                    className="admin-content-modal-form grid min-h-0 flex-1 gap-4 overflow-y-auto overscroll-contain p-4 sm:p-5"
                >
                    {errorMessage ? (
                        <div className="rounded-[1.1rem] border border-rose-200 bg-rose-50 p-4 text-sm leading-6 font-semibold whitespace-pre-line text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                            {errorMessage}
                        </div>
                    ) : null}

                    {successMessage ? (
                        <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                            {successMessage}
                        </div>
                    ) : null}

                    <DynamicFields
                        type={modal.type}
                        form={form}
                        onChange={update}
                    />
                </form>

                <div className="admin-content-modal-actions flex shrink-0 flex-col-reverse gap-2 border-t border-[#eadcc2]/80 p-4 sm:flex-row sm:justify-end sm:p-5 dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        form={formId}
                        disabled={processing}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#17120b]"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Saving...' : 'Save Content'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

function extractSuccessMessage(result: unknown) {
    if (result && typeof result === 'object' && 'message' in result) {
        return String(
            (result as { message?: string }).message || 'Saved successfully.',
        );
    }

    return 'Saved successfully.';
}

function DynamicFields({
    type,
    form,
    onChange,
}: {
    type: ContentType;
    form: Record<string, FormPayloadValue>;
    onChange: (field: string, value: FormPayloadValue) => void;
}) {
    if (type === 'event') {
        return (
            <>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                        label="Title"
                        value={form.title}
                        onChange={(value) => onChange('title', value)}
                        required
                    />
                    <SelectOrCustomField
                        label="Category"
                        value={form.category}
                        onChange={(value) => {
                            onChange('category', value);
                            onChange('event_category', value);
                        }}
                        options={EVENT_CATEGORY_OPTIONS}
                        required
                    />
                    <TextField
                        label="Start Date"
                        value={form.starts_at}
                        onChange={(value) => {
                            onChange('starts_at', value);
                            onChange('event_date', value);
                        }}
                        type="date"
                    />
                    <TextField
                        label="End Date"
                        value={form.event_date_to}
                        onChange={(value) => onChange('event_date_to', value)}
                        type="date"
                    />
                    <TextField
                        label="Event Time"
                        value={form.event_time}
                        onChange={(value) => onChange('event_time', value)}
                        placeholder="8:00 AM - 5:00 PM"
                    />
                    <TextField
                        label="Venue / Location"
                        value={form.venue}
                        onChange={(value) => onChange('venue', value)}
                        placeholder="Baguio Convention and Cultural Center"
                    />
                    <TextField
                        label="External URL"
                        value={form.external_url}
                        onChange={(value) => onChange('external_url', value)}
                        placeholder="Optional link; button appears only when set"
                    />
                    <TextField
                        label="Sort Order"
                        value={form.sort_order}
                        onChange={(value) => onChange('sort_order', value)}
                        type="number"
                        placeholder="Optional"
                    />
                </div>
                <TextArea
                    label="Short Note / Summary"
                    value={form.note}
                    onChange={(value) => onChange('note', value)}
                />
                <TextArea
                    label="Description"
                    value={form.description}
                    onChange={(value) => onChange('description', value)}
                />
                <ImageFields form={form} onChange={onChange} />
                <VisibilityFields form={form} onChange={onChange} />
            </>
        );
    }

    if (type === 'space') {
        return (
            <>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                        label="Facility Name"
                        value={form.title}
                        onChange={(value) => {
                            onChange('title', value);
                            onChange('name', value);
                        }}
                        required
                    />
                    <SelectOrCustomField
                        label="Facility Category"
                        value={form.category}
                        onChange={(value) => onChange('category', value)}
                        options={[
                            { label: 'Venue Space', value: 'Venue Space' },
                            { label: 'Hall', value: 'Hall' },
                            { label: 'Meeting Room', value: 'Meeting Room' },
                            { label: 'Lounge', value: 'Lounge' },
                            {
                                label: 'Tourism Office',
                                value: 'Tourism Office',
                            },
                            { label: 'Support Area', value: 'Support Area' },
                        ]}
                    />
                    <TextField
                        label="Subtitle"
                        value={form.subtitle}
                        onChange={(value) => onChange('subtitle', value)}
                        placeholder="Optional short label"
                    />
                    <SelectOrCustomField
                        label="Capacity"
                        value={form.capacity}
                        onChange={(value) => onChange('capacity', value)}
                        options={FACILITY_CAPACITY_OPTIONS}
                    />
                    <TextField
                        label="Short Description"
                        value={form.short_description}
                        onChange={(value) =>
                            onChange('short_description', value)
                        }
                        placeholder="Shown in cards"
                    />
                    <TextField
                        label="Sort Order"
                        value={form.sort_order}
                        onChange={(value) => onChange('sort_order', value)}
                        type="number"
                        placeholder="Optional"
                    />
                </div>
                <TextArea
                    label="Summary"
                    value={form.summary}
                    onChange={(value) => onChange('summary', value)}
                />
                <TextArea
                    label="Description"
                    value={form.description}
                    onChange={(value) => onChange('description', value)}
                />
                <TextArea
                    label="Details / Bullet Points"
                    value={form.details_text}
                    onChange={(value) => onChange('details_text', value)}
                />
                <ImageFields form={form} onChange={onChange} />
                <VisibilityFields form={form} onChange={onChange} />
            </>
        );
    }

    if (type === 'package') {
        return (
            <>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                        label="Title"
                        value={form.title}
                        onChange={(value) => onChange('title', value)}
                        required
                    />
                    <TextField
                        label="Subtitle"
                        value={form.subtitle}
                        onChange={(value) => onChange('subtitle', value)}
                    />
                    <TextField
                        label="Price Label"
                        value={form.price_label}
                        onChange={(value) => onChange('price_label', value)}
                        placeholder="Starts at ₱..."
                    />
                    <TextField
                        label="External URL"
                        value={form.external_url}
                        onChange={(value) => onChange('external_url', value)}
                        placeholder="Optional link"
                    />
                </div>
                <TextArea
                    label="Description"
                    value={form.description}
                    onChange={(value) => onChange('description', value)}
                />
                <ImageFields form={form} onChange={onChange} />
                <VisibilityFields form={form} onChange={onChange} />
            </>
        );
    }

    if (type === 'stat') {
        return (
            <>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                        label="Label"
                        value={form.label}
                        onChange={(value) => onChange('label', value)}
                        required
                    />
                    <TextField
                        label="Value"
                        value={form.value}
                        onChange={(value) => onChange('value', value)}
                        required
                    />
                    <TextField
                        label="Sort Order"
                        value={form.sort_order}
                        onChange={(value) => onChange('sort_order', value)}
                        type="number"
                        placeholder="Optional"
                    />
                </div>
                <TextArea
                    label="Description"
                    value={form.description}
                    onChange={(value) => onChange('description', value)}
                />
                <VisibilityFields form={form} onChange={onChange} />
            </>
        );
    }

    return (
        <>
            <div className="grid gap-3 md:grid-cols-2">
                <TextField
                    label="Full Name"
                    value={form.full_name}
                    onChange={(value) => onChange('full_name', value)}
                    required
                />

                <SelectOrCustomField
                    label="Designation"
                    value={form.designation}
                    onChange={(value) => onChange('designation', value)}
                    options={DESIGNATION_OPTIONS}
                    required
                />

                <SelectOrCustomField
                    label="Office Section"
                    value={form.office_section}
                    onChange={(value) => onChange('office_section', value)}
                    options={TOURISM_OFFICE_SECTIONS}
                    required
                />

                <SelectOrCustomField
                    label="Unit Name"
                    value={form.unit_name}
                    onChange={(value) => onChange('unit_name', value)}
                    options={UNIT_NAME_OPTIONS}
                />

                <SelectOrCustomField
                    label="Team Label"
                    value={form.team_label}
                    onChange={(value) => onChange('team_label', value)}
                    options={TOURISM_TEAM_LABELS}
                />

                <TextField
                    label="Reports To"
                    value={form.reports_to_name}
                    onChange={(value) => onChange('reports_to_name', value)}
                    placeholder="Supervisor or office head"
                />

                <SelectOrCustomField
                    label="Tree Level"
                    value={form.tree_level}
                    onChange={(value) => onChange('tree_level', value)}
                    options={TREE_LEVEL_OPTIONS}
                    required
                />

                <TextField
                    label="Sort Order"
                    value={form.sort_order}
                    onChange={(value) => onChange('sort_order', value)}
                    type="number"
                    placeholder="Optional"
                />
                <TextField
                    label="Email"
                    value={form.email}
                    onChange={(value) => onChange('email', value)}
                    type="email"
                    placeholder="name@example.com"
                />
                <TextField
                    label="Phone"
                    value={form.phone}
                    onChange={(value) => onChange('phone', value)}
                    placeholder="09XXXXXXXXX"
                />
            </div>

            <TextArea
                label="Short Bio"
                value={form.short_bio}
                onChange={(value) => onChange('short_bio', value)}
            />
            <TextArea
                label="Details / Responsibilities"
                value={form.details_text}
                onChange={(value) => onChange('details_text', value)}
            />
            <TourismPhotoField form={form} onChange={onChange} />
            <TourismVisibilityFields form={form} onChange={onChange} />
        </>
    );
}

function TextField({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    required = false,
}: {
    label: string;
    value: FormPayloadValue;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <label className="grid gap-2">
            <span className="text-[10px] font-bold tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                {label}
                {required ? ' *' : ''}
            </span>

            <input
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => onChange(event.target.value)}
                type={type}
                placeholder={placeholder}
                required={required}
                className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm text-[#21180d] transition outline-none placeholder:text-[#8a7a63] focus:border-[#b08d48] dark:border-white/10 dark:bg-white/7 dark:text-white dark:placeholder:text-white/42"
            />
        </label>
    );
}

function SelectOrCustomField({
    label,
    value,
    onChange,
    options,
    required = false,
}: {
    label: string;
    value: FormPayloadValue;
    onChange: (value: string) => void;
    options: Choice[];
    required?: boolean;
}) {
    const currentValue = typeof value === 'string' ? value : '';
    const isKnownValue = options.some(
        (option) => option.value === currentValue,
    );
    const hasExistingCustomValue = currentValue.trim() !== '' && !isKnownValue;

    const [customMode, setCustomMode] = useState(hasExistingCustomValue);

    useEffect(() => {
        /*
         * Keep custom field hidden on create.
         * Show it only when:
         * 1. User selected "Other — type manually", or
         * 2. Editing an existing record with a custom saved value.
         */
        if (hasExistingCustomValue) {
            setCustomMode(true);
        }
    }, [hasExistingCustomValue]);

    function handleSelect(next: string) {
        if (next === '__other__') {
            setCustomMode(true);
            onChange('');
            return;
        }

        setCustomMode(false);
        onChange(next);
    }

    function handleCustomInput(next: string) {
        setCustomMode(true);
        onChange(next);
    }

    return (
        <div className="grid gap-2">
            <span className="text-[10px] font-bold tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                {label}
                {required ? ' *' : ''}
            </span>

            <select
                value={
                    customMode || hasExistingCustomValue
                        ? '__other__'
                        : currentValue
                }
                onChange={(event) => handleSelect(event.target.value)}
                required={required && !customMode && !hasExistingCustomValue}
                className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm text-[#21180d] transition outline-none focus:border-[#b08d48] dark:border-white/10 dark:bg-[#161b22] dark:text-white"
            >
                <option value="">Select {label}</option>

                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}

                <option value="__other__">Other — type manually</option>
            </select>

            {customMode || hasExistingCustomValue ? (
                <input
                    value={currentValue}
                    onChange={(event) => handleCustomInput(event.target.value)}
                    required={required}
                    autoFocus={customMode && !hasExistingCustomValue}
                    placeholder={`Type custom ${label.toLowerCase()}`}
                    className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm text-[#21180d] transition outline-none placeholder:text-[#8a7a63] focus:border-[#b08d48] dark:border-white/10 dark:bg-white/7 dark:text-white dark:placeholder:text-white/42"
                />
            ) : null}
        </div>
    );
}

function TextArea({
    label,
    value,
    onChange,
}: {
    label: string;
    value: FormPayloadValue;
    onChange: (value: string) => void;
}) {
    return (
        <label className="grid gap-2">
            <span className="text-[10px] font-bold tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                {label}
            </span>

            <textarea
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => onChange(event.target.value)}
                rows={4}
                className="rounded-[1.1rem] border border-[#d9c7a6]/70 bg-white px-4 py-3 text-sm leading-7 text-[#21180d] transition outline-none placeholder:text-[#8a7a63] focus:border-[#b08d48] dark:border-white/10 dark:bg-white/7 dark:text-white dark:placeholder:text-white/42"
            />
        </label>
    );
}

function ImageFields({
    form,
    onChange,
}: {
    form: Record<string, FormPayloadValue>;
    onChange: (field: string, value: FormPayloadValue) => void;
}) {
    const preview =
        form.image instanceof File
            ? absolutePublicImageUrl(form.image)
            : absolutePublicImageUrl(form.image_path);

    function handleFile(event: ChangeEvent<HTMLInputElement>) {
        onChange('image', event.target.files?.[0] ?? null);
    }

    return (
        <div className="grid gap-3 rounded-[1.2rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 lg:grid-cols-[minmax(0,1fr)_16rem] dark:border-white/10 dark:bg-white/[0.035]">
            <div className="grid gap-3">
                <TextField
                    label="Image Path / URL"
                    value={form.image_path}
                    onChange={(value) => onChange('image_path', value)}
                    placeholder="/storage/venue-spaces/image.jpg, venue-spaces/image.jpg, or https://..."
                />

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6e604c] dark:text-white/56">
                    <Link2 className="h-4 w-4 text-[#9d7b3d] dark:text-[#f1d89b]" />
                    Saved uploads are served from public storage. Run{' '}
                    <code className="rounded bg-white px-1.5 py-0.5 dark:bg-black/30">
                        php artisan storage:link
                    </code>{' '}
                    after deployment.
                </div>

                <label className="grid gap-2">
                    <span className="text-[10px] font-bold tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                        Upload Image
                    </span>

                    <span className="inline-flex min-h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12">
                        <UploadCloud className="h-4 w-4" />
                        Choose replacement image
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFile}
                            className="hidden"
                        />
                    </span>

                    {form.image instanceof File ? (
                        <p className="text-sm font-semibold text-[#6e604c] dark:text-white/56">
                            Selected: {form.image.name}
                        </p>
                    ) : null}
                </label>
            </div>

            <div className="overflow-hidden rounded-[1rem] border border-[#d9c7a6]/70 bg-white shadow-inner dark:border-white/10 dark:bg-white/7">
                {preview ? (
                    <img
                        src={preview}
                        alt="Content preview"
                        className="h-52 w-full object-cover"
                    />
                ) : (
                    <div className="grid h-52 place-items-center text-center text-sm font-semibold text-[#8a7a63] dark:text-white/50">
                        <div>
                            <FileImage className="mx-auto h-8 w-8" />
                            <p className="mt-2">No image preview</p>
                        </div>
                    </div>
                )}
                <p className="border-t border-[#eadcc2]/80 px-3 py-2 text-xs font-semibold text-[#6e604c] dark:border-white/10 dark:text-white/52">
                    This is the image that should appear in admin cards and the
                    public website.
                </p>
            </div>
        </div>
    );
}

function TourismPhotoField({
    form,
    onChange,
}: {
    form: Record<string, FormPayloadValue>;
    onChange: (field: string, value: FormPayloadValue) => void;
}) {
    const preview =
        form.photo instanceof File
            ? absolutePublicImageUrl(form.photo)
            : absolutePublicImageUrl(form.photo_path || form.photo);

    function handleFile(event: ChangeEvent<HTMLInputElement>) {
        onChange('photo', event.target.files?.[0] ?? null);
    }

    return (
        <div className="grid gap-3 rounded-[1.2rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 sm:grid-cols-[1fr_10rem] sm:items-center dark:border-white/10 dark:bg-white/[0.035]">
            <label className="grid gap-2">
                <span className="text-[10px] font-bold tracking-[0.18em] text-[#9d7b3d] uppercase dark:text-[#f1d89b]">
                    Profile Photo
                </span>

                <span className="inline-flex min-h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12">
                    <ImagePlus className="h-4 w-4" />
                    Choose Photo
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFile}
                        className="hidden"
                    />
                </span>

                {form.photo instanceof File ? (
                    <p className="text-sm font-semibold text-[#6e604c] dark:text-white/56">
                        Selected: {form.photo.name}
                    </p>
                ) : null}
            </label>

            <div className="overflow-hidden rounded-[1rem] border border-[#d9c7a6]/70 bg-white dark:border-white/10 dark:bg-white/7">
                {preview ? (
                    <img
                        src={preview}
                        alt="Tourism member preview"
                        className="h-40 w-full object-cover"
                    />
                ) : (
                    <div className="grid h-40 place-items-center text-[#8a7a63] dark:text-white/50">
                        <UsersRound className="h-8 w-8" />
                    </div>
                )}
            </div>
        </div>
    );
}

function VisibilityFields({
    form,
    onChange,
}: {
    form: Record<string, FormPayloadValue>;
    onChange: (field: string, value: FormPayloadValue) => void;
}) {
    return (
        <div className="grid gap-3 rounded-[1.15rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 md:grid-cols-2 dark:border-white/10 dark:bg-white/[0.035]">
            <label className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={Boolean(form.homepage_visible)}
                    onChange={(event) =>
                        onChange('homepage_visible', event.target.checked)
                    }
                    className="h-4 w-4 rounded border-[#d9c7a6]"
                />
                <span className="text-sm font-semibold text-[#21180d] dark:text-white">
                    Show on homepage / public site
                </span>
            </label>

            <div className="flex items-center gap-2 text-sm text-[#6e604c] dark:text-white/56">
                <Check className="h-4 w-4 text-emerald-600" />
                Saved items return here after submission.
            </div>
        </div>
    );
}

function TourismVisibilityFields({
    form,
    onChange,
}: {
    form: Record<string, FormPayloadValue>;
    onChange: (field: string, value: FormPayloadValue) => void;
}) {
    return (
        <div className="grid gap-3 rounded-[1.15rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 md:grid-cols-2 dark:border-white/10 dark:bg-white/[0.035]">
            <label className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={Boolean(form.is_active)}
                    onChange={(event) =>
                        onChange('is_active', event.target.checked)
                    }
                    className="h-4 w-4 rounded border-[#d9c7a6]"
                />
                <span className="text-sm font-semibold text-[#21180d] dark:text-white">
                    Active / visible on public site
                </span>
            </label>

            <label className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={Boolean(form.is_featured)}
                    onChange={(event) =>
                        onChange('is_featured', event.target.checked)
                    }
                    className="h-4 w-4 rounded border-[#d9c7a6]"
                />
                <span className="text-sm font-semibold text-[#21180d] dark:text-white">
                    Featured tourism profile
                </span>
            </label>
        </div>
    );
}

function SettingsPanel({ settings }: { settings: SiteSettings }) {
    const [form, setForm] = useState({
        email: settingValue(settings, 'email', 'email'),
        phone: settingValue(settings, 'phone', 'phone'),
        address: settingValue(settings, 'address', 'address'),
        visita_url: settingValue(settings, 'visitaUrl', 'visita_url'),
        creative_baguio_url: settingValue(
            settings,
            'creativeBaguioUrl',
            'creative_baguio_url',
        ),
        footer_description: settingValue(
            settings,
            'footerDescription',
            'footer_description',
        ),
        footer_copyright: settingValue(
            settings,
            'footerCopyright',
            'footer_copyright',
        ),
        map_embed_url: settingValue(settings, 'mapEmbedUrl', 'map_embed_url'),
        open_map_url: settingValue(settings, 'openMapUrl', 'open_map_url'),
    });

    const [processing, setProcessing] = useState(false);

    function update(field: keyof typeof form, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        setProcessing(true);

        router.put(`${contentBasePath()}/site-settings`, form, {
            preserveUrl: true,
            onSuccess: () => {
                notifySuccess(
                    'Site settings saved successfully.',
                    'Saved successfully',
                );
            },
            onError: () => {
                notifyError(
                    'Unable to save site settings. Please check the fields.',
                    'Save failed',
                );
            },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <form id="site-settings-form" onSubmit={submit} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
                <TextField
                    label="Email"
                    value={form.email}
                    onChange={(value) => update('email', value)}
                />
                <TextField
                    label="Phone"
                    value={form.phone}
                    onChange={(value) => update('phone', value)}
                />
                <TextField
                    label="Address"
                    value={form.address}
                    onChange={(value) => update('address', value)}
                />
                <TextField
                    label="VISITA Baguio URL"
                    value={form.visita_url}
                    onChange={(value) => update('visita_url', value)}
                />
                <TextField
                    label="Creative / Arts URL"
                    value={form.creative_baguio_url}
                    onChange={(value) => update('creative_baguio_url', value)}
                />
                <TextField
                    label="Open Map URL"
                    value={form.open_map_url}
                    onChange={(value) => update('open_map_url', value)}
                />
            </div>

            <TextArea
                label="Footer Description"
                value={form.footer_description}
                onChange={(value) => update('footer_description', value)}
            />
            <TextArea
                label="Map Embed URL"
                value={form.map_embed_url}
                onChange={(value) => update('map_embed_url', value)}
            />

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#17120b]"
                >
                    <Save className="h-4 w-4" />
                    {processing ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </form>
    );
}
