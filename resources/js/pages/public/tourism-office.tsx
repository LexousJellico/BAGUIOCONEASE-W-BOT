import TourismMembersShowcase from '@/components/public/tourism-members-showcase';
import PublicLayout from '@/layouts/public-layout';
import { Head, usePage } from '@inertiajs/react';

type TourismMember = {
    id?: number | string;
    fullName?: string | null;
    full_name?: string | null;
    name?: string | null;
    title?: string | null;
    designation?: string | null;
    position?: string | null;
    role?: string | null;
    officeSection?: string | null;
    office_section?: string | null;
    unitName?: string | null;
    unit_name?: string | null;
    teamLabel?: string | null;
    team_label?: string | null;
    reportsToName?: string | null;
    reports_to_name?: string | null;
    treeLevel?: number | string | null;
    tree_level?: number | string | null;
    shortBio?: string | null;
    short_bio?: string | null;
    bio?: string | null;
    description?: string | null;
    details?: string[] | string | null;
    detailsText?: string | null;
    details_text?: string | null;
    message?: string | null;
    photo?: string | null;
    photoUrl?: string | null;
    photo_url?: string | null;
    photoPath?: string | null;
    photo_path?: string | null;
    image?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    imagePath?: string | null;
    image_path?: string | null;
    active?: boolean | number | string | null;
    is_active?: boolean | number | string | null;
    featured?: boolean | number | string | null;
    is_featured?: boolean | number | string | null;
    email?: string | null;
    phone?: string | null;
    sortOrder?: number | string | null;
    sort_order?: number | string | null;
};

type PageProps = {
    members?: TourismMember[];
    tourismMembers?: TourismMember[];
};

function recordsOf<T>(value?: T[]): T[] {
    return Array.isArray(value) ? value : [];
}

export default function TourismOffice() {
    const { props } = usePage<PageProps>();
    const members = recordsOf(props.members).length > 0 ? recordsOf(props.members) : recordsOf(props.tourismMembers);

    return (
        <PublicLayout>
            <Head title="Tourism Office" />

            <main className="overflow-hidden bg-[#e9eef0] text-[#153d66] dark:bg-[#07110f] dark:text-white">
                <TourismMembersShowcase items={members} />
            </main>
        </PublicLayout>
    );
}
