import SafeImage from '@/components/system/safe-image';
import type { SiteSettings } from '@/layouts/public-layout';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Building2,
    CalendarDays,
    Landmark,
    MapPinned,
    Sparkles,
} from 'lucide-react';

export default function WelcomeSection() {
    const page = usePage<{ siteSettings?: SiteSettings }>();
    const siteSettings = page.props.siteSettings;

    const visitaUrl =
        siteSettings?.visitaUrl ||
        siteSettings?.visita_url ||
        'https://visita.baguio.gov.ph';
    const artsUrl =
        siteSettings?.creativeBaguioUrl ||
        siteSettings?.creative_baguio_url ||
        siteSettings?.arts_url ||
        'https://creativecity.baguio.gov.ph';

    return (
        <section className="bccc-public-welcome relative z-20 w-full overflow-hidden bg-[#edf2f1] px-0 py-0 text-[#163f37] dark:bg-[#081311] dark:text-white">
            <div className="bccc-public-welcome-panel grid w-full overflow-hidden border-y border-[#176456]/14 bg-white/54 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] dark:border-white/10 dark:bg-white/[0.035]">
                <div className="bccc-public-welcome-copy relative flex min-h-[34rem] flex-col justify-center px-5 py-12 sm:px-8 lg:ml-auto lg:min-h-[42rem] lg:max-w-[780px] lg:px-10 lg:py-16 xl:py-20">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#176456]/18 bg-[#176456]/8 px-4 py-2 text-[10px] font-black tracking-[0.18em] text-[#176456] uppercase dark:border-[#9fe8dc]/20 dark:bg-[#9fe8dc]/8 dark:text-[#9fe8dc]">
                        <Sparkles className="h-4 w-4" />
                        Official public venue guide
                    </div>

                    <h2 className="mt-5 max-w-3xl text-[clamp(2.2rem,5vw,5.8rem)] leading-[0.93] font-semibold tracking-[-0.075em] text-[#143f38] dark:text-white">
                        Welcome to a clearer way to plan your BCCC visit.
                    </h2>

                    <div className="mt-6 max-w-3xl space-y-3 text-sm leading-8 text-[#53645f] sm:text-[15px] dark:text-white/64">
                        <p>
                            The Baguio Convention and Cultural Center serves as
                            a recognizable setting for government assemblies,
                            cultural programs, exhibitions, conferences, and
                            large public gatherings.
                        </p>
                        <p>
                            Use this public portal to review venue spaces,
                            browse public events, check booking guidance, and
                            reach the right assistance channel before sending a
                            reservation request.
                        </p>
                    </div>

                    <div className="bccc-public-welcome-actions mt-7 flex flex-wrap gap-3">
                        <Link
                            href="/events"
                            className="inline-flex items-center gap-2 rounded-full border border-[#176456]/18 bg-white/70 px-5 py-3 text-[11px] font-black tracking-[0.18em] text-[#176456] uppercase transition hover:bg-[#176456] hover:text-white dark:border-white/10 dark:bg-white/8 dark:text-[#9fe8dc] dark:hover:bg-white/14"
                        >
                            Explore Events
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                        <a
                            href={visitaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-[#176456]/18 bg-white/70 px-5 py-3 text-[11px] font-black tracking-[0.18em] text-[#176456] uppercase transition hover:bg-[#176456] hover:text-white dark:border-white/10 dark:bg-white/8 dark:text-[#9fe8dc] dark:hover:bg-white/14"
                        >
                            VISITA Baguio
                            <ArrowUpRight className="h-4 w-4" />
                        </a>
                    </div>

                    <div className="bccc-public-welcome-highlights mt-8 grid gap-3 sm:grid-cols-3">
                        <div className="bccc-public-welcome-highlight">
                            <Building2 className="h-4 w-4" />
                            <span>
                                <strong>Venue Spaces</strong>
                                <small>Facilities and packages</small>
                            </span>
                        </div>
                        <div className="bccc-public-welcome-highlight">
                            <CalendarDays className="h-4 w-4" />
                            <span>
                                <strong>Public Calendar</strong>
                                <small>Events and availability</small>
                            </span>
                        </div>
                        <div className="bccc-public-welcome-highlight">
                            <MapPinned className="h-4 w-4" />
                            <span>
                                <strong>Assistance</strong>
                                <small>Tourism and office links</small>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bccc-public-welcome-media relative min-h-[26rem] overflow-hidden lg:min-h-[42rem]">
                    <SafeImage
                        src="/marketing/images/hero/welcome.png"
                        fallbackSrc="/marketing/images/hero/noon2.jpg"
                        alt="Baguio Convention and Cultural Center interior"
                        className="h-full w-full object-cover"
                        wrapperClassName="absolute inset-0 h-full w-full rounded-none border-0"
                    />
                    <div className="absolute inset-0" />

                    <div className="bccc-public-welcome-media-links absolute right-0 bottom-0 left-0 grid gap-3 p-5 text-white sm:grid-cols-2 sm:p-6">
                        <a
                            href={artsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-start gap-3 border-t border-white/22 pt-4 transition hover:border-[#f4dfad]"
                        >
                            <Landmark className="mt-1 h-5 w-5 shrink-0 text-[#f4dfad]" />
                            <span>
                                <span className="block text-sm font-bold">
                                    Arts and Culture
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-white/72">
                                    Creative-city and cultural resources.
                                </span>
                            </span>
                        </a>

                        <Link
                            href="/tourism-office"
                            className="group flex items-start gap-3 border-t border-white/22 pt-4 transition hover:border-[#f4dfad]"
                        >
                            <MapPinned className="mt-1 h-5 w-5 shrink-0 text-[#f4dfad]" />
                            <span>
                                <span className="block text-sm font-bold">
                                    Tourism Office
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-white/72">
                                    Visitor and public assistance channels.
                                </span>
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
