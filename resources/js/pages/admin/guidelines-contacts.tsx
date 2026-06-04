import {
    ResourceActionLink,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    FileText,
    Globe2,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type SiteSettings = {
    mapEmbedUrl?: string | null;
    openMapUrl?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    visitaUrl?: string | null;
    creativeBaguioUrl?: string | null;
    footerDescription?: string | null;
    footerCopyright?: string | null;

    map_embed_url?: string | null;
    open_map_url?: string | null;
    visita_url?: string | null;
    creative_baguio_url?: string | null;
    footer_description?: string | null;
    footer_copyright?: string | null;
};

type GuidelineSection = {
    title: string;
    items: string[];
};

type ContactCard = {
    office: string;
    person: string;
    role: string;
    email?: string | null;
    phones: string[];
};

type RentalArea = {
    area: string;
    rates: Array<{
        usage: string;
        rate: string;
    }>;
};

type Props = {
    siteSettings?: SiteSettings;
    guidelinesSections?: GuidelineSection[];
    contactCards?: ContactCard[];
    rentalAreas?: RentalArea[];
    reservationNotes?: string[];
    flash?: {
        success?: string;
        error?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Guidelines & Contacts', href: '/admin/guidelines-contacts' },
];

function currentBasePath() {
    if (window.location.pathname.startsWith('/manager')) {
        return '/manager/guidelines-contacts';
    }

    return '/admin/guidelines-contacts';
}

function safeArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
}

function readSetting(settings: SiteSettings, camelKey: keyof SiteSettings, snakeKey: keyof SiteSettings) {
    return settings[camelKey] ?? settings[snakeKey] ?? '';
}

function settingText(value?: string | null, fallback = 'Not configured') {
    return value && String(value).trim() ? String(value) : fallback;
}

export default function AdminGuidelinesContactsPage() {
    const { props } = usePage<Props>();
    const settings = props.siteSettings ?? {};
    const basePath = currentBasePath();

    const guidelineSections = useMemo(() => safeArray(props.guidelinesSections), [props.guidelinesSections]);
    const contactCards = useMemo(() => safeArray(props.contactCards), [props.contactCards]);
    const rentalAreas = useMemo(() => safeArray(props.rentalAreas), [props.rentalAreas]);
    const reservationNotes = useMemo(() => safeArray(props.reservationNotes), [props.reservationNotes]);

    const [form, setForm] = useState({
        map_embed_url: String(readSetting(settings, 'mapEmbedUrl', 'map_embed_url')),
        open_map_url: String(readSetting(settings, 'openMapUrl', 'open_map_url')),
        address: String(settings.address ?? ''),
        phone: String(settings.phone ?? ''),
        email: String(settings.email ?? ''),
        visita_url: String(readSetting(settings, 'visitaUrl', 'visita_url')),
        creative_baguio_url: String(readSetting(settings, 'creativeBaguioUrl', 'creative_baguio_url')),
        footer_description: String(readSetting(settings, 'footerDescription', 'footer_description')),
        footer_copyright: String(readSetting(settings, 'footerCopyright', 'footer_copyright')),
    });

    const [saving, setSaving] = useState(false);

    function updateField(field: keyof typeof form, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);

        router.post(basePath, form, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    }

    return (
        <ResourcePageShell
            title="Guidelines & Contacts"
            eyebrow="Public Website"
            icon={ShieldCheck}
            breadcrumbs={breadcrumbs}
            subtitle="Manage public policy reminders, contact information, footer content, map links, and official Baguio external links used across the public website."
            actions={
                <>
                    <ResourceActionLink href="/admin/content" variant="secondary">
                        Content Manager
                    </ResourceActionLink>

                    <ResourceActionLink href="/" variant="primary">
                        Open Public Site
                    </ResourceActionLink>
                </>
            }
        >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ResourceStatCard
                    label="Guideline Groups"
                    value={guidelineSections.length}
                    description="Policy and reservation sections."
                    icon={FileText}
                />

                <ResourceStatCard
                    label="Contact Cards"
                    value={contactCards.length}
                    description="Official office references."
                    icon={Mail}
                />

                <ResourceStatCard
                    label="Rental Areas"
                    value={rentalAreas.length}
                    description="Published rate references."
                    icon={Building2}
                />

                <ResourceStatCard
                    label="Reservation Notes"
                    value={reservationNotes.length}
                    description="Client-facing reminders."
                    icon={BookOpen}
                />
            </div>

            {props.flash?.success ? (
                <div className="mt-5 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                    {props.flash.success}
                </div>
            ) : null}

            {props.flash?.error ? (
                <div className="mt-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                    {props.flash.error}
                </div>
            ) : null}

            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.95fr]">
                <ResourceSection
                    title="Public contact settings"
                    eyebrow="Editable Settings"
                    description="These fields are used by the public contact page, footer, floating external links, and official public information sections."
                >
                    <form onSubmit={submit} className="grid gap-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field
                                label="Office Address"
                                value={form.address}
                                onChange={(value) => updateField('address', value)}
                                icon={MapPin}
                                placeholder="Baguio Convention and Cultural Center..."
                            />

                            <Field
                                label="Phone Number"
                                value={form.phone}
                                onChange={(value) => updateField('phone', value)}
                                icon={Phone}
                                placeholder="+63..."
                            />

                            <Field
                                label="Email Address"
                                value={form.email}
                                onChange={(value) => updateField('email', value)}
                                icon={Mail}
                                placeholder="info@example.com"
                            />

                            <Field
                                label="Open Map URL"
                                value={form.open_map_url}
                                onChange={(value) => updateField('open_map_url', value)}
                                icon={MapPin}
                                placeholder="Google Maps link"
                            />

                            <Field
                                label="VISITA Baguio URL"
                                value={form.visita_url}
                                onChange={(value) => updateField('visita_url', value)}
                                icon={Globe2}
                                placeholder="VISITA Baguio link"
                            />

                            <Field
                                label="Creative / Arts URL"
                                value={form.creative_baguio_url}
                                onChange={(value) => updateField('creative_baguio_url', value)}
                                icon={Globe2}
                                placeholder="Arts website link"
                            />
                        </div>

                        <label className="grid gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                Footer Description
                            </span>

                            <textarea
                                value={form.footer_description}
                                onChange={(event) => updateField('footer_description', event.target.value)}
                                rows={4}
                                placeholder="Short public footer description..."
                                className="rounded-[1.1rem] border border-[#d9c7a6]/70 bg-white px-4 py-3 text-sm leading-7 text-[#21180d] outline-none transition placeholder:text-[#8a7a63] focus:border-[#b08d48] dark:border-white/10 dark:bg-white/7 dark:text-white dark:placeholder:text-white/42"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                Map Embed URL
                            </span>

                            <textarea
                                value={form.map_embed_url}
                                onChange={(event) => updateField('map_embed_url', event.target.value)}
                                rows={3}
                                placeholder="Google Maps embed URL..."
                                className="rounded-[1.1rem] border border-[#d9c7a6]/70 bg-white px-4 py-3 text-sm leading-7 text-[#21180d] outline-none transition placeholder:text-[#8a7a63] focus:border-[#b08d48] dark:border-white/10 dark:bg-white/7 dark:text-white dark:placeholder:text-white/42"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#17120b]"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving Settings...' : 'Save Settings'}
                        </button>
                    </form>
                </ResourceSection>

                <ResourceSection
                    title="Contact preview"
                    eyebrow="Public Display"
                    description="Quickly confirm what visitors will see before opening the public page."
                >
                    <div className="grid gap-3">
                        <PreviewLine icon={MapPin} label="Address" value={settingText(form.address)} />
                        <PreviewLine icon={Phone} label="Phone" value={settingText(form.phone)} />
                        <PreviewLine icon={Mail} label="Email" value={settingText(form.email)} />
                        <PreviewLine icon={Globe2} label="VISITA Baguio" value={settingText(form.visita_url)} />
                        <PreviewLine icon={Globe2} label="Creative / Arts" value={settingText(form.creative_baguio_url)} />
                    </div>
                </ResourceSection>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <ResourceSection
                    title="Operational reminders"
                    eyebrow="Guidelines"
                    description="These groups are used as official reference content for staff and public-facing policy sections."
                >
                    {guidelineSections.length === 0 ? (
                        <EmptyPanel message="No guideline groups are currently configured." />
                    ) : (
                        <div className="grid gap-3">
                            {guidelineSections.map((section) => (
                                <article
                                    key={section.title}
                                    className="rounded-[1.25rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 dark:border-white/10 dark:bg-white/[0.035]"
                                >
                                    <h3 className="text-lg font-semibold tracking-[-0.04em] text-[#21180d] dark:text-white">
                                        {section.title}
                                    </h3>

                                    <ul className="mt-3 grid gap-2">
                                        {safeArray(section.items).map((item, index) => (
                                            <li
                                                key={`${section.title}-${index}`}
                                                className="flex gap-3 text-sm leading-7 text-[#6e604c] dark:text-white/56"
                                            >
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b08d48]" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    )}
                </ResourceSection>

                <ResourceSection
                    title="Official contact cards"
                    eyebrow="Office Directory"
                    description="Reference people or offices shown in internal/public guidance sections."
                >
                    {contactCards.length === 0 ? (
                        <EmptyPanel message="No contact cards are currently configured." />
                    ) : (
                        <div className="grid gap-3">
                            {contactCards.map((card) => (
                                <article
                                    key={`${card.office}-${card.person}`}
                                    className="rounded-[1.25rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 dark:border-white/10 dark:bg-white/[0.035]"
                                >
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                        {card.office}
                                    </p>

                                    <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[#21180d] dark:text-white">
                                        {card.person}
                                    </h3>

                                    <p className="mt-1 text-sm text-[#6e604c] dark:text-white/56">
                                        {card.role}
                                    </p>

                                    <p className="mt-3 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                        Email: {settingText(card.email)}
                                        <br />
                                        Phone: {safeArray(card.phones).join(', ') || 'Not configured'}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}

function Field({
    label,
    value,
    onChange,
    icon: Icon,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon: typeof Mail;
    placeholder?: string;
}) {
    return (
        <label className="grid gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </span>

            <span className="flex min-h-11 items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 dark:border-white/10 dark:bg-white/7">
                <Icon className="h-4 w-4 shrink-0 text-[#9d7b3d] dark:text-[#f1d89b]" />

                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#21180d] outline-none placeholder:text-[#8a7a63] dark:text-white dark:placeholder:text-white/42"
                />
            </span>
        </label>
    );
}

function PreviewLine({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Mail;
    label: string;
    value: string;
}) {
    return (
        <article className="flex items-start gap-3 rounded-[1.15rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                <Icon className="h-4 w-4" />
            </span>

            <span className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#9d7b3d] dark:text-[#f1d89b]">
                    {label}
                </span>

                <span className="mt-1 block break-words text-sm leading-6 text-[#6e604c] dark:text-white/56">
                    {value}
                </span>
            </span>
        </article>
    );
}

function EmptyPanel({ message }: { message: string }) {
    return (
        <div className="rounded-[1.25rem] border border-dashed border-[#d9c7a6]/80 bg-[#fffaf0]/58 p-6 text-center text-sm font-semibold text-[#21180d] dark:border-white/10 dark:bg-white/[0.035] dark:text-white">
            {message}
        </div>
    );
}
