import FloatingQuickLinks from '@/components/public/floating-quick-links';
import PublicFooter from '@/components/public/public-footer';
import PublicHeader, { type PublicSiteSettings } from '@/components/public/public-header';
import { usePage } from '@inertiajs/react';
import { CalendarCheck, Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

type PageProps = {
    siteSettings?: PublicSiteSettings;
};

type PublicBookingLayoutProps = {
    children: ReactNode;
    eyebrow?: string;
    title?: string;
    description?: string;
    actions?: ReactNode;
    compact?: boolean;
};

export default function PublicBookingLayout({
    children,
    eyebrow = 'Baguio Convention & Cultural Center',
    title = 'Reserve your event space with confidence.',
    description = 'Select a venue package, review the official reservation details, and submit your booking request through a cleaner public-facing flow.',
    actions,
    compact = false,
}: PublicBookingLayoutProps) {
    const page = usePage<PageProps>();
    const siteSettings = page.props.siteSettings;

    return (
        <div className="client-booking-public-shell bccc-public-shell min-h-screen bg-[#f8f5ef] text-[#21180d] antialiased dark:bg-[#0d0f12] dark:text-white">
            <PublicHeader />

            <main className="client-booking-public-main bccc-public-main relative overflow-hidden">
                <section
                    className={`client-booking-public-hero mx-auto grid w-full max-w-[1760px] gap-4 px-3 sm:px-4 lg:grid-cols-[1.35fr_0.65fr] lg:px-5 xl:px-6 ${
                        compact ? 'pb-4 pt-4' : 'pb-5 pt-5'
                    }`}
                >
                    <div className="relative overflow-hidden rounded-[1.35rem] border border-[#d9c7a6]/70 bg-white/72 p-4 shadow-[0_24px_70px_rgba(47,37,23,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] sm:p-5 lg:p-6">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,181,109,0.22),transparent_42%)]" />

                        <div className="relative grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
                            <div className="min-w-0">
                                <div className="client-booking-public-eyebrow inline-flex items-center gap-2 rounded-full border border-[#d8b56d]/50 bg-[#f8edda] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#8a6427] dark:border-[#f1d89b]/20 dark:bg-white/8 dark:text-[#f1d89b]">
                                    <Sparkles className="h-4 w-4" />
                                    {eyebrow}
                                </div>

                                <h1 className="mt-4 max-w-5xl text-3xl font-semibold leading-[0.98] tracking-[-0.06em] text-[#21180d] dark:text-white sm:text-4xl lg:text-5xl">
                                    {title}
                                </h1>

                                {description ? (
                                    <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6f5f49] dark:text-white/60 sm:text-base sm:leading-8">
                                        {description}
                                    </p>
                                ) : null}
                            </div>

                            {actions ? (
                                <div className="client-booking-public-actions flex flex-wrap gap-2 xl:justify-end">
                                    {actions}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <aside className="client-booking-public-contact grid content-start gap-2.5 rounded-[1.35rem] border border-[#d9c7a6]/70 bg-[#21180d] p-4 text-white shadow-[0_24px_70px_rgba(47,37,23,0.16)] dark:border-white/10 dark:bg-white/[0.07] sm:p-5">
                        <div className="flex items-start gap-3 rounded-[1rem] bg-white/8 p-3">
                            <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#f1d89b]" />
                            <span className="text-sm leading-6 text-white/74">Official BCCC EASE booking workspace</span>
                        </div>

                        <div className="flex items-start gap-3 rounded-[1rem] bg-white/8 p-3">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#f1d89b]" />
                            <span className="text-sm leading-6 text-white/74">Baguio Convention and Cultural Center</span>
                        </div>

                        <div className="flex items-start gap-3 rounded-[1rem] bg-white/8 p-3">
                            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#f1d89b]" />
                            <span className="text-sm leading-6 text-white/74">(074) 446-2009</span>
                        </div>

                        <div className="flex items-start gap-3 rounded-[1rem] bg-white/8 p-3">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#f1d89b]" />
                            <span className="text-sm leading-6 text-white/74">City Tourism, Culture and Arts Office</span>
                        </div>
                    </aside>
                </section>

                <section className="client-booking-public-content mx-auto w-full max-w-[1760px] px-3 pb-8 sm:px-4 lg:px-5 xl:px-6">
                    {children}
                </section>
            </main>

            <PublicFooter />
            <FloatingQuickLinks siteSettings={siteSettings} />
        </div>
    );
}
