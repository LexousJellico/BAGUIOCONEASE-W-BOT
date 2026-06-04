import EventsCinemaShowcase from '@/components/public/events-cinema-showcase';
import {
    visibleRecords,
    type PublicImageRecord,
} from '@/components/public/public-display-system';
import PublicLayout from '@/layouts/public-layout';
import { Head, usePage } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { useMemo } from 'react';

type EventsPageProps = {
    events?: PublicImageRecord[];
    bcccEvents?: PublicImageRecord[];
    cityEvents?: PublicImageRecord[];
};

function categoryOf(event: PublicImageRecord) {
    return String(event.category || event.event_category || 'Event');
}

export default function EventsPage() {
    const { props } = usePage<EventsPageProps>();

    const allEvents = useMemo(
        () =>
            visibleRecords([
                ...(props.events ?? []),
                ...(props.bcccEvents ?? []),
                ...(props.cityEvents ?? []),
            ]),
        [props.events, props.bcccEvents, props.cityEvents],
    );

    const bcccEvents = useMemo(
        () =>
            allEvents.filter((event) => {
                const category = categoryOf(event).toLowerCase();

                return category.includes('bccc') || !category.includes('city');
            }),
        [allEvents],
    );

    const cityEvents = useMemo(
        () =>
            allEvents.filter((event) => {
                const category = categoryOf(event).toLowerCase();

                return category.includes('city') || category.includes('baguio');
            }),
        [allEvents],
    );

    return (
        <PublicLayout>
            <Head title="Events" />

            <main id="highlights" className="public-display-page min-h-screen">
                <EventsCinemaShowcase
                    items={allEvents}
                    bcccEvents={bcccEvents}
                    cityEvents={cityEvents}
                />
            </main>
        </PublicLayout>
    );
}
