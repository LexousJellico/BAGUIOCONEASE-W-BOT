import type { LucideIcon } from 'lucide-react';
import { LayoutGrid } from 'lucide-react';

export const PUBLIC_DEFAULT_IMAGE = '/marketing/images/events/default.png';

export type PublicImageRecord = {
    id?: number | string;
    slug?: string | number | null;

    title?: string | null;
    name?: string | null;
    label?: string | null;
    subtitle?: string | null;
    summary?: string | null;
    description?: string | null;
    bio?: string | null;

    image?: string | null;
    image_url?: string | null;
    imageUrl?: string | null;
    image_path?: string | null;
    imagePath?: string | null;
    lightImage?: string | null;
    light_image?: string | null;
    darkImage?: string | null;
    dark_image?: string | null;
    mobileImage?: string | null;
    mobile_image?: string | null;
    thumbnail?: string | null;
    thumbnail_url?: string | null;

    gallery_image_1?: string | null;
    gallery_image_2?: string | null;
    gallery_image_3?: string | null;
    galleryImage1?: string | null;
    galleryImage2?: string | null;
    galleryImage3?: string | null;

    category?: string | null;
    event_category?: string | null;
    starts_at?: string | null;
    startsAt?: string | null;
    date?: string | null;
    event_date?: string | null;

    position?: string | null;
    role?: string | null;
    capacity?: string | number | null;
    priceLabel?: string | null;
    price_label?: string | null;
    rateLabel?: string | null;
    rate_label?: string | null;
    areaLabels?: string[] | null;
    area_labels?: string[] | null;
    areaKeys?: string[] | null;
    area_keys?: string[] | null;

    external_url?: string | null;
    externalUrl?: string | null;
    href?: string | null;
    url?: string | null;

    homepage_visible?: boolean | number | string | null;
    homepageVisible?: boolean;
    is_active?: boolean | number | string | null;
    is_featured?: boolean | number | string | null;
    featured?: boolean | number | string | null;
    sort_order?: number | string | null;
    sortOrder?: number | string | null;

    [key: string]: unknown;
};

export function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export function titleOf(item?: PublicImageRecord | null, fallback = 'Untitled') {
    return String(item?.title || item?.name || item?.label || fallback);
}

export function descriptionOf(item?: PublicImageRecord | null, fallback = '') {
    return String(item?.description || item?.summary || item?.bio || item?.subtitle || fallback);
}

function normalizeImagePath(value?: string | null, fallback = PUBLIC_DEFAULT_IMAGE) {
    const raw = String(value || '').trim();

    if (!raw) {
        return fallback;
    }

    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) {
        return raw;
    }

    const clean = raw
        .replace(/\\/g, '/')
        .replace(/^public\//, '')
        .replace(/^\/public\//, '/')
        .replace(/^storage\/app\/public\//, 'storage/')
        .replace(/^app\/public\//, 'storage/');

    if (clean.startsWith('/')) {
        return clean;
    }

    if (clean.startsWith('marketing/') || clean.startsWith('images/')) {
        return `/${clean}`;
    }

    if (clean.startsWith('storage/')) {
        return `/${clean}`;
    }

    return `/storage/${clean}`;
}

export function imageOf(item?: PublicImageRecord | null, fallback = PUBLIC_DEFAULT_IMAGE) {
    return normalizeImagePath(
        item?.image_url ||
            item?.imageUrl ||
            item?.image_path ||
            item?.imagePath ||
            item?.image ||
            item?.thumbnail_url ||
            item?.thumbnail ||
            null,
        fallback,
    );
}

export function visibleRecords<T extends PublicImageRecord>(items?: T[]) {
    const records = Array.isArray(items) ? items : [];

    return records
        .filter((item) => {
            const explicitVisible =
                item.homepageVisible === true ||
                item.homepage_visible === true ||
                item.homepage_visible === 1 ||
                item.homepage_visible === '1' ||
                item.homepage_visible === 'true';

            const explicitHidden =
                item.homepageVisible === false ||
                item.homepage_visible === false ||
                item.homepage_visible === 0 ||
                item.homepage_visible === '0' ||
                item.homepage_visible === 'false';

            const active =
                item.is_active === true ||
                item.is_active === 1 ||
                item.is_active === '1' ||
                item.is_active === 'true';

            if (explicitHidden) {
                return false;
            }

            return explicitVisible || active || item.homepage_visible === undefined;
        })
        .sort((a, b) => Number(a.sortOrder ?? a.sort_order ?? 9999) - Number(b.sortOrder ?? b.sort_order ?? 9999));
}

export function formatPublicDate(value?: string | null) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
}

export function SectionIntro({
    kicker,
    title,
    description,
    align = 'left',
}: {
    kicker: string;
    title: string;
    description?: string;
    align?: 'left' | 'center';
}) {
    return (
        <div className={align === 'center' ? 'mx-auto max-w-4xl text-center' : 'max-w-4xl text-left'}>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#1f7465] dark:text-[#7dd7c6]">{kicker}</p>

            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.055em] text-[#082f2a] dark:text-white sm:text-5xl lg:text-6xl">
                {title}
            </h2>

            {description ? (
                <p className="mt-5 max-w-3xl text-pretty text-sm leading-7 text-slate-600 dark:text-white/62 sm:text-base">
                    {description}
                </p>
            ) : null}
        </div>
    );
}

export function EmptyPublicPanel({
    icon: Icon = LayoutGrid,
    title,
    description,
}: {
    icon?: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="grid min-h-[18rem] place-items-center rounded-[1.15rem] border border-dashed border-[#1f7465]/24 bg-white/70 p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.035]">
            <div>
                <Icon className="mx-auto h-10 w-10 text-[#1f7465] dark:text-[#7dd7c6]" />

                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[#082f2a] dark:text-white">
                    {title}
                </h3>

                <p className="mx-auto mt-3 max-w-[62ch] text-sm leading-7 text-slate-600 dark:text-white/56">
                    {description}
                </p>
            </div>
        </div>
    );
}
