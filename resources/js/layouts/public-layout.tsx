import PublicMotionEffects from '@/components/public/public-motion-effects';
import PublicScrollProgress from '@/components/public/public-scroll-progress';
import FloatingQuickLinks from '@/components/public/floating-quick-links';
import PublicFooter from '@/components/public/public-footer';
import PublicHeader from '@/components/public/public-header';
import { usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type SiteSettings = {
    siteName?: string | null;
    site_name?: string | null;
    tagline?: string | null;
    description?: string | null;

    mapEmbedUrl?: string | null;
    map_embed_url?: string | null;
    openMapUrl?: string | null;
    open_map_url?: string | null;

    address?: string | null;
    phone?: string | null;
    email?: string | null;
    officeHours?: string | null;
    office_hours?: string | null;

    visitaUrl?: string | null;
    creativeBaguioUrl?: string | null;
    visita_url?: string | null;
    arts_url?: string | null;
    creative_baguio_url?: string | null;

    footerDescription?: string | null;
    footer_description?: string | null;
    footerCopyright?: string | null;
    footer_copyright?: string | null;

    logo_url?: string | null;
    logoUrl?: string | null;
    city_seal_url?: string | null;
    citySealUrl?: string | null;
    baguio_logo_url?: string | null;
    baguioLogoUrl?: string | null;
    breathe_baguio_logo_url?: string | null;
    breatheBaguioLogoUrl?: string | null;

    facebookUrl?: string | null;
    facebook_url?: string | null;
    websiteUrl?: string | null;
    website_url?: string | null;

    [key: string]: unknown;
};

type PublicLayoutProps = {
    children: ReactNode;
};

function PublicHeaderPortal() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div className="bccc-public-header-portal" data-public-motion="off">
            <PublicHeader />
        </div>,
        document.body,
    );
}

function FloatingQuickLinksPortal({ siteSettings }: { siteSettings?: SiteSettings | null }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div className="bccc-floating-quick-links-portal" data-public-motion="off">
            <FloatingQuickLinks siteSettings={siteSettings} />
        </div>,
        document.body,
    );
}

export default function PublicLayout({ children }: PublicLayoutProps) {
    const page = usePage<{ siteSettings?: SiteSettings }>();
    const siteSettings = page.props.siteSettings;

    return (
        <div className="bccc-public-shell min-h-screen bg-[#f8f5ef] text-[#201a12] antialiased dark:bg-[#0d0f12] dark:text-white">
            <a href="#public-main-content" className="bccc-skip-link">Skip to content</a>
            <PublicMotionEffects />
            <PublicScrollProgress />
            <PublicHeaderPortal />

            <main id="public-main-content" tabIndex={-1} className="bccc-public-main bccc-public-page-stage relative overflow-x-clip overflow-y-visible pt-[78px]">
                {children}
            </main>

            <PublicFooter />
            <FloatingQuickLinksPortal siteSettings={siteSettings} />
        </div>
    );
}
