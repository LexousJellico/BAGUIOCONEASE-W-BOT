import EventsCinemaShowcase from '@/components/public/events-cinema-showcase';
import FacilitiesLayeredShowcase from '@/components/public/facilities-layered-showcase';
import HeroBanner from '@/components/public/hero-banner';
import LocationAssistance from '@/components/public/location-assistance';
import VenuePackageShowcase from '@/components/public/venue-package-showcase';
import WelcomeSection from '@/components/public/welcome-section';
import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';
import type {
    FeaturePackageItem,
    HomepageStatItem,
    PublicEventItem,
    PublicSpaceItem,
    SiteMetricPayload,
} from '@/types/public-content';

type Props = {
    events?: PublicEventItem[];
    bcccEvents?: PublicEventItem[];
    cityEvents?: PublicEventItem[];
    spaces?: PublicSpaceItem[];
    venueSpaces?: PublicSpaceItem[];
    facilities?: PublicSpaceItem[];
    stats?: HomepageStatItem[];
    siteMetric?: SiteMetricPayload | null;
    offers?: FeaturePackageItem[];
    packages?: FeaturePackageItem[];
};

export default function Home({
    events = [],
    bcccEvents = [],
    cityEvents = [],
    spaces = [],
    venueSpaces = [],
    facilities = [],
    siteMetric = null,
    packages = [],
}: Props) {
    const mergedEvents = events.length > 0 ? events : [...bcccEvents, ...cityEvents];
    const mergedSpaces = spaces.length > 0 ? spaces : venueSpaces.length > 0 ? venueSpaces : facilities;

    return (
        <PublicLayout>
            <Head title="Baguio Convention and Cultural Center" />

            <HeroBanner siteMetric={siteMetric} />
            <FacilitiesLayeredShowcase items={mergedSpaces} />
            <WelcomeSection />
            <VenuePackageShowcase items={packages} />

            <EventsCinemaShowcase items={mergedEvents} bcccEvents={bcccEvents} cityEvents={cityEvents} />

            <LocationAssistance />
        </PublicLayout>
    );
}
