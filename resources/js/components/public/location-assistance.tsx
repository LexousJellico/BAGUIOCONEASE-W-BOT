import SafeImage from '@/components/system/safe-image';
import type { SiteSettings } from '@/layouts/public-layout';
import { Link, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    Building2,
    Clock3,
    ExternalLink,
    Mail,
    MapPin,
    Navigation,
    Phone,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

type PageProps = {
    siteSettings?: SiteSettings;
};

const ease = [0.22, 1, 0.36, 1] as const;

function contactTel(value: string) {
    return value.replace(/[^\d+]/g, '');
}

export default function LocationAssistance() {
    const reduceMotion = useReducedMotion();
    const page = usePage<PageProps>();
    const settings = page.props.siteSettings || {};

    const address =
        settings.address ||
        'Baguio Convention and Cultural Center, Baguio City';
    const phone = settings.phone || '(074) 446 2009';
    const email = settings.email || 'info@bccc-ease.com';
    const [directionStatus, setDirectionStatus] = useState('');

    const openMapUrl =
        settings.openMapUrl ||
        settings.open_map_url ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
    const mapEmbedUrl =
        settings.mapEmbedUrl ||
        settings.map_embed_url ||
        `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

    function openDirectionsFromCurrentLocation() {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            window.open(directionsUrl, '_blank', 'noopener,noreferrer');
            setDirectionStatus(
                'GPS is not available on this browser, so Google Maps opened with BCCC as the destination.',
            );
            return;
        }

        setDirectionStatus(
            'Requesting device GPS permission for directions...',
        );

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const origin = `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`;
                const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(address)}&travelmode=driving`;

                window.open(url, '_blank', 'noopener,noreferrer');
                setDirectionStatus(
                    'Directions opened using your current GPS location.',
                );
            },
            () => {
                window.open(directionsUrl, '_blank', 'noopener,noreferrer');
                setDirectionStatus(
                    'Location permission was not granted, so Google Maps opened with BCCC as the destination.',
                );
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
        );
    }

    return (
        <section className="bccc-location-assistance relative overflow-hidden bg-[#eef4f2] px-4 py-14 sm:px-6 lg:px-8 dark:bg-[#08110f]">
            <div className="pointer-events-none absolute top-[-12rem] left-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[#d8b56d]/14 blur-3xl dark:bg-[#d8b56d]/7" />

            <div className="bccc-location-grid relative mx-auto grid max-w-[1920px] gap-5 xl:grid-cols-[0.92fr_1.08fr]">
                <motion.section
                    initial={
                        reduceMotion
                            ? false
                            : { opacity: 0, y: 18, filter: 'blur(8px)' }
                    }
                    whileInView={
                        reduceMotion
                            ? undefined
                            : { opacity: 1, y: 0, filter: 'blur(0px)' }
                    }
                    viewport={{ once: true, amount: 0.22 }}
                    transition={{ duration: 0.5, ease }}
                    className="bccc-location-panel overflow-hidden rounded-[2rem] border border-[#d9c7a6]/70 bg-white/84 p-5 shadow-[0_24px_70px_rgba(47,37,23,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-[#f7f0e3] px-3 py-1.5 text-[10px] font-bold tracking-[0.22em] text-[#9d7b3d] uppercase dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                        <Navigation className="h-3.5 w-3.5" />
                        Location Assistance
                    </div>

                    <h2 className="mt-4 font-serif text-[clamp(2.4rem,4vw,5.3rem)] leading-[0.94] font-light tracking-[-0.055em] text-[#21180d] dark:text-white">
                        Plan your visit before submitting your booking.
                    </h2>

                    <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6e604c] dark:text-white/58">
                        For event setup, parking, guest movement, official
                        instructions, and document requirements, coordinate with
                        the BCCC office before the final event confirmation.
                    </p>

                    <div className="mt-6 grid gap-3">
                        <a
                            href={openMapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bccc-location-contact-link group flex items-start gap-3 rounded-[1.25rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/74 p-4 text-[#4a3b27] transition hover:-translate-y-0.5 hover:border-[#b08d48]/80 hover:bg-white dark:border-white/10 dark:bg-white/7 dark:text-white/70 dark:hover:bg-white/12"
                        >
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#9d7b3d] dark:bg-white/10 dark:text-[#f1d89b]">
                                <MapPin className="h-5 w-5" />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-[#21180d] dark:text-white">
                                    {address}
                                </span>
                                <span className="mt-1 block text-xs leading-5 opacity-70">
                                    Open the location through your preferred
                                    maps application.
                                </span>
                            </span>

                            <ExternalLink className="mt-1 h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                        </a>

                        <a
                            href={`tel:${contactTel(phone)}`}
                            className="bccc-location-contact-link group flex items-start gap-3 rounded-[1.25rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/74 p-4 text-[#4a3b27] transition hover:-translate-y-0.5 hover:border-[#b08d48]/80 hover:bg-white dark:border-white/10 dark:bg-white/7 dark:text-white/70 dark:hover:bg-white/12"
                        >
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#9d7b3d] dark:bg-white/10 dark:text-[#f1d89b]">
                                <Phone className="h-5 w-5" />
                            </span>

                            <span>
                                <span className="block text-sm font-semibold text-[#21180d] dark:text-white">
                                    {phone}
                                </span>
                                <span className="mt-1 block text-xs leading-5 opacity-70">
                                    Call for booking coordination and office
                                    instructions.
                                </span>
                            </span>
                        </a>

                        <a
                            href={`mailto:${email}`}
                            className="bccc-location-contact-link group flex items-start gap-3 rounded-[1.25rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/74 p-4 text-[#4a3b27] transition hover:-translate-y-0.5 hover:border-[#b08d48]/80 hover:bg-white dark:border-white/10 dark:bg-white/7 dark:text-white/70 dark:hover:bg-white/12"
                        >
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#9d7b3d] dark:bg-white/10 dark:text-[#f1d89b]">
                                <Mail className="h-5 w-5" />
                            </span>

                            <span>
                                <span className="block text-sm font-semibold text-[#21180d] dark:text-white">
                                    {email}
                                </span>
                                <span className="mt-1 block text-xs leading-5 opacity-70">
                                    Send inquiries, documents, and
                                    booking-related concerns.
                                </span>
                            </span>
                        </a>
                    </div>

                    <div className="mt-6 grid gap-3 rounded-[1.45rem] border border-[#d9c7a6]/70 bg-white/68 p-4 sm:grid-cols-3 dark:border-white/10 dark:bg-white/7">
                        <div>
                            <Clock3 className="h-5 w-5 text-[#9d7b3d] dark:text-[#f1d89b]" />
                            <p className="mt-2 text-sm font-semibold text-[#21180d] dark:text-white">
                                Office Coordination
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#6e604c] dark:text-white/52">
                                Confirm final instructions with staff.
                            </p>
                        </div>

                        <div>
                            <Building2 className="h-5 w-5 text-[#9d7b3d] dark:text-[#f1d89b]" />
                            <p className="mt-2 text-sm font-semibold text-[#21180d] dark:text-white">
                                Venue Setup
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#6e604c] dark:text-white/52">
                                Align setup time, access, and logistics.
                            </p>
                        </div>

                        <div>
                            <ShieldCheck className="h-5 w-5 text-[#9d7b3d] dark:text-[#f1d89b]" />
                            <p className="mt-2 text-sm font-semibold text-[#21180d] dark:text-white">
                                Official Review
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#6e604c] dark:text-white/52">
                                Public submissions remain subject to approval.
                            </p>
                        </div>
                    </div>

                    <div className="bccc-location-actions mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/contact"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                        >
                            Contact the Office
                            <ArrowRight className="h-4 w-4" />
                        </Link>

                        <button
                            type="button"
                            onClick={openDirectionsFromCurrentLocation}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                        >
                            Get Directions
                            <Navigation className="h-4 w-4" />
                        </button>

                        <a
                            href={openMapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                        >
                            Open Map
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>

                    {directionStatus ? (
                        <p className="mt-3 rounded-[1rem] border border-[#d9c7a6]/70 bg-[#f7f0e3]/74 px-4 py-3 text-xs leading-5 font-semibold text-[#6e604c] dark:border-white/10 dark:bg-white/7 dark:text-white/60">
                            {directionStatus}
                        </p>
                    ) : null}
                </motion.section>

                <motion.section
                    initial={
                        reduceMotion
                            ? false
                            : { opacity: 0, y: 18, filter: 'blur(8px)' }
                    }
                    whileInView={
                        reduceMotion
                            ? undefined
                            : { opacity: 1, y: 0, filter: 'blur(0px)' }
                    }
                    viewport={{ once: true, amount: 0.22 }}
                    transition={{ duration: 0.5, delay: 0.08, ease }}
                    className="bccc-location-map relative min-h-[35rem] overflow-hidden rounded-[2rem] border border-[#d9c7a6]/70 bg-white shadow-[0_24px_70px_rgba(47,37,23,0.10)] dark:border-white/10 dark:bg-white/[0.055]"
                >
                    {mapEmbedUrl ? (
                        <iframe
                            src={mapEmbedUrl}
                            title="Baguio Convention and Cultural Center location map"
                            className="absolute inset-0 h-full w-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    ) : (
                        <>
                            <SafeImage
                                src="/marketing/images/facilities/darkvip.JPG"
                                fallbackSrc="/marketing/images/hero/noon2.jpg"
                                alt="Baguio Convention and Cultural Center"
                                className="absolute inset-0 h-full w-full object-cover"
                                wrapperClassName="absolute inset-0 h-full w-full rounded-none border-0"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-[#100b05]/88 via-[#100b05]/28 to-transparent" />

                            <div className="absolute right-5 bottom-5 left-5 rounded-[1.45rem] border border-white/16 bg-white/12 p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
                                <p className="text-[10px] font-bold tracking-[0.24em] text-[#f4dfad] uppercase">
                                    Map Preview
                                </p>

                                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
                                    Open the official map to locate BCCC.
                                </h3>

                                <p className="mt-2 text-sm leading-7 text-white/66">
                                    Add a map embed URL in the site settings to
                                    display an interactive map here.
                                </p>
                            </div>
                        </>
                    )}
                </motion.section>
            </div>
        </section>
    );
}
