import FacilitiesLayeredShowcase from '@/components/public/facilities-layered-showcase';
import {
    EmptyPublicPanel,
    visibleRecords,
    type PublicImageRecord,
} from '@/components/public/public-display-system';
import PublicLayout from '@/layouts/public-layout';
import { Head, usePage } from '@inertiajs/react';
import {
    Building2,
} from 'lucide-react';

import { useMemo } from 'react';

type FacilitiesPageProps = {
    spaces?: PublicImageRecord[];
    venueSpaces?: PublicImageRecord[];
    facilities?: PublicImageRecord[];
};

function titleKey(item: PublicImageRecord, index: number) {
    return String(item.id ?? item.slug ?? item.title ?? item.name ?? `facility-${index}`);
}

function uniqueSpaces(items: PublicImageRecord[]) {
    const seen = new Set<string>();

    return items.filter((item, index) => {
        const key = titleKey(item, index);

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

export default function FacilitiesPage() {
    const { props } = usePage<FacilitiesPageProps>();

    const spaces = useMemo(
        () =>
            uniqueSpaces(
                visibleRecords([
                    ...(props.spaces ?? []),
                    ...(props.venueSpaces ?? []),
                    ...(props.facilities ?? []),
                ]),
            ),
        [props.spaces, props.venueSpaces, props.facilities],
    );

    return (
        <PublicLayout>
            <Head title="Facilities" />

            <main className="min-h-screen bg-[#f8f5ef] text-[#201a12] dark:bg-[#0d0f12] dark:text-white">
                {spaces.length > 0 ? (
                    <FacilitiesLayeredShowcase items={spaces} />
                ) : (
                    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                        <EmptyPublicPanel
                            icon={Building2}
                            title="No facilities configured"
                            description="Facilities created in the Content Manager will appear on this page."
                        />
                    </section>
                )}
            </main>
        </PublicLayout>
    );
}

