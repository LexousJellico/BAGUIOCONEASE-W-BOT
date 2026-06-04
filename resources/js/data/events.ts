export type EventItem = {
    dateKey?: string | null;
    title: string;
    date: string;
    summary: string;
    description: string;
    note?: string;
    venue: string;
    image: string;
    lightImage: string;
    darkImage: string;
    category: string;
    featured?: boolean;
    highlighted?: boolean;
    scope: 'bccc' | 'city';
    isPublic: boolean;
};

export const events: EventItem[] = [
    {
        title: 'Creative Heritage Expo 2026',
        date: 'April 12, 2026',
        summary:
            'A major public convention-center program featuring local creativity, design, performances, and exhibits.',
        description:
            'A highlighted BCCC event intended for broad public participation, cultural appreciation, and creative-sector engagement.',
        note: 'This should display as a highlighted featured card on the homepage.',
        venue: 'Baguio Convention and Cultural Center',
        image: '/marketing/images/events/1.JPG',
        lightImage: '/marketing/images/events/1.JPG',
        darkImage: '/marketing/images/events/1.JPG',
        category: 'BCCC Public Event',
        featured: true,
        highlighted: true,
        scope: 'bccc',
        isPublic: true,
    },
    {
        title: 'Regional Innovation Summit',
        date: 'May 03, 2026',
        summary:
            'A convention-led gathering for public sector dialogue, academic showcases, and innovation networking.',
        description:
            'A formal BCCC event intended for forums, institutional collaboration, and audience-centered sessions.',
        note: 'This should remain in the highlighted BCCC slider.',
        venue: 'Main Hall',
        image: '/marketing/images/events/3.JPG',
        lightImage: '/marketing/images/events/3.JPG',
        darkImage: '/marketing/images/events/3.JPG',
        category: 'Convention',
        featured: false,
        highlighted: true,
        scope: 'bccc',
        isPublic: true,
    },
    {
        title: 'Baguio Cultural Night',
        date: 'May 18, 2026',
        summary:
            'An evening feature with cultural performances, local artistry, and heritage presentations.',
        description:
            'A public cultural event held at the convention center with audience-focused programming and local participation.',
        note: 'This should also appear in the highlighted left slider.',
        venue: 'Baguio Convention and Cultural Center',
        image: '/marketing/images/events/5.jpg',
        lightImage: '/marketing/images/events/5.jpg',
        darkImage: '/marketing/images/events/5.jpg',
        category: 'Cultural Program',
        featured: false,
        highlighted: true,
        scope: 'bccc',
        isPublic: true,
    },
    {
        title: 'Panagbenga Community Showcase',
        date: 'April 20, 2026',
        summary:
            'A city-wide public showcase featuring performances, local products, and seasonal community activities.',
        description:
            'A Baguio City public event that should appear on the right-side common events stack.',
        note: 'City public highlight.',
        venue: 'Baguio City',
        image: '/marketing/images/events/3.JPG',
        lightImage: '/marketing/images/events/3.JPG',
        darkImage: '/marketing/images/events/3.JPG',
        category: 'Baguio City Event',
        featured: false,
        highlighted: false,
        scope: 'city',
        isPublic: true,
    },
    {
        title: 'City Youth Arts Weekend',
        date: 'April 24, 2026',
        summary:
            'A youth-oriented arts and performance event featuring exhibitions, talks, and live creative sessions.',
        description:
            'A city event that should remain in the common right-side vertical event list.',
        note: 'Common city event.',
        venue: 'Baguio City',
        image: '/marketing/images/events/1.JPG',
        lightImage: '/marketing/images/events/1.JPG',
        darkImage: '/marketing/images/events/1.JPG',
        category: 'Baguio City Event',
        featured: false,
        highlighted: false,
        scope: 'city',
        isPublic: true,
    },
    {
        title: 'Summer Civic Services Fair',
        date: 'May 07, 2026',
        summary:
            'A public information and services event focused on community assistance and civic engagement.',
        description:
            'A city-driven public event for information access, services promotion, and public attendance.',
        note: 'Common city event.',
        venue: 'Baguio City',
        image: '/marketing/images/events/5.jpg',
        lightImage: '/marketing/images/events/5.jpg',
        darkImage: '/marketing/images/events/5.jpg',
        category: 'Public Services Event',
        featured: false,
        highlighted: false,
        scope: 'city',
        isPublic: true,
    },
    {
        title: 'Cordillera Food & Trade Weekend',
        date: 'May 16, 2026',
        summary:
            'A city public highlight featuring local producers, culinary showcases, and tourism-linked displays.',
        description:
            'A city-level event intended for wider public discovery, trade, and visitor engagement.',
        note: 'Common city event.',
        venue: 'Baguio City',
        image: '/marketing/images/events/3.JPG',
        lightImage: '/marketing/images/events/3.JPG',
        darkImage: '/marketing/images/events/3.JPG',
        category: 'Trade & Tourism Event',
        featured: false,
        highlighted: false,
        scope: 'city',
        isPublic: true,
    },
];
