import {
    EmptyPublicPanel,
    cx,
    descriptionOf,
    imageOf,
    titleOf,
    type PublicImageRecord,
} from '@/components/public/public-display-system';
import PublicLayout from '@/layouts/public-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    ImageIcon,
    MapPin,
    UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type FacilityShowProps = {
    space?: PublicImageRecord;
    facility?: PublicImageRecord;
    venueSpace?: PublicImageRecord;
    relatedSpaces?: PublicImageRecord[];
    spaces?: PublicImageRecord[];
};

function capacityOf(item?: PublicImageRecord | null) {
    return item?.capacity ? String(item.capacity) : 'Flexible capacity';
}

function galleryOf(item?: PublicImageRecord | null): string[] {
    const images = [
        imageOf(item),
        String(item?.gallery_image_1 ?? ''),
        String(item?.gallery_image_2 ?? ''),
        String(item?.gallery_image_3 ?? ''),
        String(item?.galleryImage1 ?? ''),
        String(item?.galleryImage2 ?? ''),
        String(item?.galleryImage3 ?? ''),
    ].filter(Boolean);

    return [...new Set(images)];
}

function facilityUrl(item: PublicImageRecord) {
    const slug = item.slug || item.id;

    return slug ? `/facilities/${slug}` : '/facilities';
}

export default function FacilityShowPage() {
    const { props } = usePage<FacilityShowProps>();

    const facility = props.space ?? props.facility ?? props.venueSpace ?? null;

    const related = useMemo(
        () =>
            (props.relatedSpaces ?? props.spaces ?? [])
                .filter((item) => item.id !== facility?.id)
                .slice(0, 4),
        [props.relatedSpaces, props.spaces, facility?.id],
    );

    const gallery = useMemo(() => galleryOf(facility), [facility]);
    const [activeImage, setActiveImage] = useState('');

    useEffect(() => {
        setActiveImage(gallery[0] ?? '');
    }, [gallery]);

    if (!facility) {
        return (
            <PublicLayout>
                <Head title="Facility Not Found" />

                <main className="min-h-screen bg-[#f8f5ef] text-[#201a12] dark:bg-[#0d0f12] dark:text-white">
                    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                        <EmptyPublicPanel
                            icon={Building2}
                            title="Facility not found"
                            description="The requested facility could not be loaded. Please return to the facilities page."
                        />

                        <div className="mt-6 flex justify-center">
                            <Link
                                href="/facilities"
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] dark:bg-[#f1d89b] dark:text-[#17120b]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Facilities
                            </Link>
                        </div>
                    </section>
                </main>
            </PublicLayout>
        );
    }

    const heroImage = activeImage || imageOf(facility);
    const description = descriptionOf(
        facility,
        'A BCCC venue space available for events, civic programs, cultural activities, and reservations.',
    );

    return (
        <PublicLayout>
            <Head title={titleOf(facility, 'Facility')} />

            <main className="min-h-screen overflow-hidden bg-[#f8f5ef] text-[#201a12] dark:bg-[#0d0f12] dark:text-white">
                <section className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden">
                    {heroImage ? (
                        <img
                            src={heroImage}
                            alt={titleOf(facility, 'Facility')}
                            className="absolute inset-0 -z-20 h-full w-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 -z-20 grid place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                            <Building2 className="h-24 w-24" />
                        </div>
                    )}

                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/82 via-black/46 to-black/12" />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d0f12]/92 via-transparent to-black/22" />

                    <div className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[1600px] flex-col justify-between px-4 py-8 sm:px-5 lg:px-6">
                        <div>
                            <Link
                                href="/facilities"
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 text-sm font-semibold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/18"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Facilities
                            </Link>
                        </div>

                        <div className="grid gap-8 pb-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
                            <div className="max-w-5xl">
                                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#f1d89b]">
                                    BCCC Facility
                                </p>

                                <h1 className="mt-4 max-w-[12ch] text-6xl font-semibold leading-[0.88] tracking-[-0.085em] text-white md:text-8xl">
                                    {titleOf(facility, 'Facility')}
                                </h1>

                                <p className="mt-6 max-w-[68ch] text-base leading-8 text-white/74 md:text-lg">
                                    {description}
                                </p>

                                <div className="mt-7 flex flex-wrap gap-2">
                                    <InfoPill icon={UsersRound} label={capacityOf(facility)} />
                                    <InfoPill icon={MapPin} label="Baguio Convention and Cultural Center" />
                                    <InfoPill icon={CalendarDays} label="Subject to availability" />
                                </div>
                            </div>

                            <aside className="rounded-[1.5rem] border border-white/16 bg-white/12 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f1d89b]">
                                    Planning Details
                                </p>

                                <div className="mt-4 grid gap-3">
                                    <DetailRow icon={UsersRound} label="Capacity" value={capacityOf(facility)} />
                                    <DetailRow icon={CheckCircle2} label="Use" value={String(facility.subtitle || 'Events and reservations')} />
                                    <DetailRow icon={CalendarDays} label="Availability" value="Check calendar before booking" />
                                </div>

                                <Link
                                    href="/book"
                                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f1d89b] px-6 text-sm font-bold text-[#17120b] transition hover:-translate-y-0.5 hover:bg-white"
                                >
                                    Check Availability
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </aside>
                        </div>
                    </div>
                </section>

                {gallery.length > 1 ? (
                    <section className="border-b border-[#e7dbc5]/80 bg-[#fffaf0]/72 px-4 py-7 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] sm:px-5 lg:px-6">
                        <div className="mx-auto max-w-[1600px]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                        Gallery
                                    </p>
                                    <p className="mt-1 text-sm text-[#6e604c] dark:text-white/58">
                                        Select a landscape image to update the hero.
                                    </p>
                                </div>

                                <ImageIcon className="h-6 w-6 text-[#9d7b3d] dark:text-[#f1d89b]" />
                            </div>

                            <div className="public-no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-2">
                                {gallery.map((image, index) => (
                                    <button
                                        key={`${image}-${index}`}
                                        type="button"
                                        onClick={() => setActiveImage(image)}
                                        className={cx(
                                            'h-28 w-44 shrink-0 overflow-hidden rounded-[1rem] border transition duration-300',
                                            activeImage === image || (!activeImage && index === 0)
                                                ? 'border-[#b08d48] ring-2 ring-[#b08d48]/30'
                                                : 'border-[#eadcc2]/80 opacity-70 hover:opacity-100 dark:border-white/10',
                                        )}
                                    >
                                        <img src={image} alt="" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                ) : null}

                <section className="px-4 py-16 sm:px-5 lg:px-6">
                    <div className="mx-auto grid max-w-[1600px] gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
                        <article className="rounded-[1.5rem] border border-[#d9c7a6]/70 bg-white/78 p-6 shadow-[0_20px_60px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.05] lg:p-8">
                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                About this space
                            </p>

                            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#21180d] dark:text-white">
                                Designed for event planning
                            </h2>

                            <div className="mt-6 max-w-[72ch] space-y-4 text-[16px] leading-8 text-[#6e604c] dark:text-white/60">
                                <p>{description}</p>

                                <p>
                                    Before submitting a reservation, review the target event date, expected guest count, preferred time block, technical requirements, and setup needs.
                                </p>
                            </div>
                        </article>

                        <aside className="rounded-[1.5rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/72 p-6 shadow-[0_20px_60px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.035]">
                            <Building2 className="h-8 w-8 text-[#9d7b3d] dark:text-[#f1d89b]" />

                            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.055em] text-[#21180d] dark:text-white">
                                Booking reminder
                            </h3>

                            <p className="mt-3 text-[15px] leading-7 text-[#6e604c] dark:text-white/58">
                                Public availability depends on confirmed bookings, blocked dates, and administrative review.
                            </p>

                            <Link
                                href="/calendar"
                                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                            >
                                View Calendar
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </aside>
                    </div>
                </section>

                {related.length > 0 ? (
                    <section className="border-t border-[#e7dbc5]/80 px-4 py-14 dark:border-white/10 sm:px-5 lg:px-6">
                        <div className="mx-auto max-w-[1600px]">
                            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                        More Spaces
                                    </p>

                                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#21180d] dark:text-white">
                                        Related facilities
                                    </h2>
                                </div>

                                <Link
                                    href="/facilities"
                                    className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#8b672d] underline underline-offset-4 transition hover:text-[#2f2517] dark:text-[#f1d89b] dark:hover:text-white"
                                >
                                    View all
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="public-no-scrollbar mt-7 flex gap-4 overflow-x-auto pb-2">
                                {related.map((space, index) => (
                                    <Link
                                        key={space.id ?? index}
                                        href={facilityUrl(space)}
                                        className="group w-[min(78vw,24rem)] shrink-0 overflow-hidden rounded-[1.35rem] border border-[#d9c7a6]/70 bg-white/78 shadow-[0_20px_60px_rgba(47,37,23,0.08)] transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.05]"
                                    >
                                        {imageOf(space) ? (
                                            <img
                                                src={imageOf(space)}
                                                alt={titleOf(space, 'Facility')}
                                                className="h-52 w-full object-cover transition duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="grid h-52 place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                                <Building2 className="h-10 w-10" />
                                            </div>
                                        )}

                                        <div className="p-5">
                                            <h3 className="text-xl font-semibold tracking-[-0.05em] text-[#21180d] dark:text-white">
                                                {titleOf(space, 'Facility')}
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                                                {capacityOf(space)}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                ) : null}
            </main>
        </PublicLayout>
    );
}

function InfoPill({
    icon: Icon,
    label,
}: {
    icon: typeof UsersRound;
    label: string;
}) {
    return (
        <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/16 bg-white/12 px-4 text-sm font-semibold text-white backdrop-blur-xl">
            <Icon className="h-4 w-4 text-[#f1d89b]" />
            {label}
        </span>
    );
}

function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof UsersRound;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[1rem] border border-white/12 bg-white/10 p-4">
            <Icon className="h-5 w-5 text-[#f1d89b]" />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f1d89b]">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-white">
                {value}
            </p>
        </div>
    );
}
