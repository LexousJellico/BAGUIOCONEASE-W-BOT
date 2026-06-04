export type Facility = {
    slug: string;
    title: string;
    shortDescription: string;
    summary: string;
    details: string[];
    image: string;
    lightImage: string;
    darkImage: string;
    capacity: string;
    category: string;
    ctaLabel: string;
    featured?: boolean;
};

export const facilities: Facility[] = [
    {
        slug: 'foyer-lobby',
        title: 'Foyer & Lobby',
        shortDescription:
            'An elegant welcome zone for guest reception, registration, waiting, and networking.',
        summary:
            'Best used as the welcoming face of the venue before guests move into the main event spaces.',
        details: [
            'Guest registration',
            'Pre-function waiting area',
            'Networking and reception flow',
        ],
        image: '/marketing/images/events/lightmain.JPG',
        lightImage: '/marketing/images/events/lightmain.JPG',
        darkImage: '/marketing/images/events/lightmain.JPG',
        capacity: 'Reception flow area',
        category: 'Front-of-House',
        ctaLabel: 'View Space',
        featured: true,
    },
    {
        slug: 'grounds-parking-area',
        title: 'Ground & Parking Area',
        shortDescription:
            'Open exterior support space for vehicle circulation, loading, staging, and guest arrival.',
        summary:
            'Useful for access control, logistics movement, outdoor support, and larger event arrival management.',
        details: [
            'Vehicle staging',
            'Guest drop-off',
            'Event logistics support',
        ],
        image: '/marketing/images/events/lightmain.JPG',
        lightImage: '/marketing/images/events/lightmain.JPG',
        darkImage: '/marketing/images/events/darkmain.JPG',
        capacity: '50+ parking slots',
        category: 'Outdoor Support',
        ctaLabel: 'View Space',
        featured: true,
    },
    {
        slug: 'basement',
        title: 'Basement',
        shortDescription:
            'A support-level area suited for staging, preparation, utility operations, and controlled access.',
        summary:
            'Works well for behind-the-scenes movement, storage coordination, and operational setup.',
        details: [
            'Operational staging',
            'Back-of-house movement',
            'Utility support area',
        ],
        image: '/marketing/images/events/darkmain.JPG',
        lightImage: '/marketing/images/events/darkmain.JPG',
        darkImage: '/marketing/images/events/darkmain.JPG',
        capacity: 'Support area',
        category: 'Operational Space',
        ctaLabel: 'View Space',
        featured: false,
    },
    {
        slug: 'vip-lounge-boardroom',
        title: 'VIP Lounge & Boardroom',
        shortDescription:
            'A private hospitality and executive coordination space for officials, speakers, and guests.',
        summary:
            'Designed for private meetings, dignitary holding, board discussions, and executive preparation.',
        details: [
            'VIP waiting area',
            'Board discussions',
            'Executive hospitality',
        ],
        image: '/marketing/images/facilities/darkvip.JPG',
        lightImage: '/marketing/images/facilities/darkvip.JPG',
        darkImage: '/marketing/images/facilities/darkvip.JPG',
        capacity: 'Private hosting',
        category: 'VIP Space',
        ctaLabel: 'View Space',
        featured: true,
    },
    {
        slug: 'gallery-2600',
        title: 'Gallery 2600',
        shortDescription:
            'A flexible indoor venue for exhibits, showcases, cultural programs, and medium-size gatherings.',
        summary:
            'Suitable for curated displays, art and culture activations, public presentations, and exhibits.',
        details: [
            'Exhibits and showcases',
            'Public presentations',
            'Community programs',
        ],
        image: '/marketing/images/events/5.jpg',
        lightImage: '/marketing/images/events/5.jpg',
        darkImage: '/marketing/images/events/5.jpg',
        capacity: 'Flexible setup',
        category: 'Exhibit Hall',
        ctaLabel: 'View Space',
        featured: true,
    },
    {
        slug: 'main-hall',
        title: 'Main Hall',
        shortDescription:
            'The primary venue for conventions, performances, civic gatherings, graduations, and large events.',
        summary:
            'Includes the main audience area together with backstage, stage, and dressing room support functions.',
        details: [
            'Main audience hall',
            'Stage area included',
            'Backstage included',
            'Dressing room included',
        ],
        image: '/marketing/images/events/darkmain.JPG',
        lightImage: '/marketing/images/events/darkmain.JPG',
        darkImage: '/marketing/images/events/darkmain.JPG',
        capacity: 'Up to 2,000 seating',
        category: 'Main Venue',
        ctaLabel: 'View Space',
        featured: true,
    },
    {
        slug: 'tech-booth',
        title: 'Tech Booth',
        shortDescription:
            'A technical operations area for audio, lighting, projection, and show control management.',
        summary:
            'Essential for coordinated live production and technical oversight during events.',
        details: [
            'Audio control',
            'Lighting operation',
            'Production coordination',
        ],
        image: '/marketing/images/hero/noon2.jpg',
        lightImage: '/marketing/images/hero/noon2.jpg',
        darkImage: '/marketing/images/hero/noon2.jpg',
        capacity: 'Technical support',
        category: 'Production Support',
        ctaLabel: 'View Space',
        featured: false,
    },
    {
        slug: 'tourism-office',
        title: 'Tourism Office',
        shortDescription:
            'A public-facing assistance point for venue coordination, tourism guidance, and local information.',
        summary:
            'Useful for public inquiries, tourism-linked coordination, and civic visitor assistance.',
        details: [
            'Visitor assistance',
            'Tourism concerns',
            'Frontline coordination',
        ],
        image: '/marketing/images/branding/noon.jpg',
        lightImage: '/marketing/images/branding/noon.jpg',
        darkImage: '/marketing/images/branding/noon.jpg',
        capacity: 'Public assistance',
        category: 'Office & Assistance',
        ctaLabel: 'View Office',
        featured: false,
    },
];
