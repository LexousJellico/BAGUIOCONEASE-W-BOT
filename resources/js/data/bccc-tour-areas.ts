export type TourSceneStop = {
    id: string;
    label: string;
    image: string;
    connections?: TourSceneConnection[];
};

export type TourSceneConnection = {
    targetId: string;
    label: string;
    kind: 'backward' | 'forward' | 'choice';
};

export type TourMapRoom = {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    areaId?: string;
    kind?: 'active' | 'surrounding' | 'feature';
};

export type TourMapNode = {
    sceneId: string;
    x: number;
    y: number;
};

export type TourAreaMap = {
    title: string;
    subtitle: string;
    level: string;
    rooms: TourMapRoom[];
    nodes: TourMapNode[];
    backgroundImage?: string;
};

type TourImageSet = readonly [string, string, string, string, string];

const TOUR_STOP_LABELS = [
    'Arrival view',
    'Approach view',
    'Center view',
    'Feature view',
    'Exit view',
] as const;

function buildTourStops(areaId: string, images: TourImageSet): TourSceneStop[] {
    return images.map((image, index) => ({
        id: `${areaId}-stop-${index + 1}`,
        label: TOUR_STOP_LABELS[index],
        image,
        connections: [
            ...(index > 0
                ? [
                      {
                          targetId: `${areaId}-stop-${index}`,
                          label: TOUR_STOP_LABELS[index - 1],
                          kind: 'backward' as const,
                      },
                  ]
                : []),
            ...(index < images.length - 1
                ? [
                      {
                          targetId: `${areaId}-stop-${index + 2}`,
                          label: TOUR_STOP_LABELS[index + 1],
                          kind: 'forward' as const,
                      },
                  ]
                : []),
        ],
    }));
}

export type TourArea = {
    id: string;
    label: string;
    shortLabel: string;
    category: string;
    image: string;
    scenes: TourSceneStop[];
    description: string;
    captureNote: string;
    layoutNote: string;
    preview: {
        headline: string;
        lead: string;
        readiness: number;
        routeNodes: string[];
        mediaNeeds: string[];
    };
    footprint: {
        x: number;
        z: number;
        width: number;
        depth: number;
        height: number;
        color: number;
    };
};

export const TOUR_AREAS: TourArea[] = [
    {
        id: 'whole-tour',
        label: 'Whole Tour',
        shortLabel: 'Whole',
        category: 'Full Route',
        image: '/marketing/images/hero/bccc.png',
        scenes: buildTourStops('whole-tour', [
            '/marketing/images/facilities/hall_mid.jpeg',
            '/marketing/images/hero/noon.png',
            '/marketing/images/hero/welcome.png',
            '/marketing/images/facilities/lobby.png',
            '/marketing/images/facilities/darkmain.JPG',
        ]),
        description:
            'A complete path from outdoor arrival through the primary public interior areas of BCCC.',
        captureNote:
            'Linked route preview with continuous area-to-area movement.',
        layoutNote:
            'Full route overview connecting exterior, lobby, public halls, meeting areas, and production support.',
        preview: {
            headline: 'One guided visit across the full BCCC route.',
            lead: 'A complete five-stop public walkthrough from arrival to the major public and support areas.',
            readiness: 82,
            routeNodes: [
                'Exterior arrival and parking approach',
                'Lobby entry and public circulation',
                'Main hall, meeting, exhibit, and support area sequence',
            ],
            mediaNeeds: [
                'Final linked panorama set',
                'Area-to-area hotspot markers',
                'Public safety review for restricted viewpoints',
            ],
        },
        footprint: {
            x: 0,
            z: 0,
            width: 18,
            depth: 12,
            height: 0.18,
            color: 0x1f6f61,
        },
    },
    {
        id: 'grounds-parking',
        label: 'Grounds & Parking',
        shortLabel: 'Grounds',
        category: 'Exterior',
        image: '/marketing/images/facilities/parking.jpg',
        scenes: buildTourStops('grounds-parking', [
            '/marketing/images/facilities/parking.jpg',
            '/marketing/images/hero/bccc.png',
            '/marketing/images/hero/noon2.jpg',
            '/marketing/images/hero/noon.png',
            '/marketing/images/hero/welcome.png',
        ]),
        description:
            'Arrival points, open grounds, parking orientation, and exterior circulation views.',
        captureNote: 'Ordered outdoor photo stops for arrival planning.',
        layoutNote:
            'Exterior arrival field and parking circulation surrounding the main public approach.',
        preview: {
            headline: 'Arrival preview for guests, organizers, and transport.',
            lead: 'Prepared as the first exterior node of the tour, showing how visitors approach the venue before entering the public lobby sequence.',
            readiness: 86,
            routeNodes: [
                'Main arrival approach',
                'Parking and drop-off orientation',
                'Exterior path toward the foyer',
            ],
            mediaNeeds: [
                'Clear-weather exterior panorama',
                'Parking zone reference image',
                'Entry direction hotspot',
            ],
        },
        footprint: {
            x: -6.2,
            z: 3.9,
            width: 6.8,
            depth: 3.2,
            height: 0.45,
            color: 0x7a8b76,
        },
    },
    {
        id: 'foyer-lobby',
        label: 'Foyer & Lobby',
        shortLabel: 'Lobby',
        category: 'Interior',
        image: '/marketing/images/facilities/lobby.png',
        scenes: buildTourStops('foyer-lobby', [
            '/marketing/images/facilities/foyer.jpeg',
            '/marketing/images/facilities/foyer1.jpeg',
            '/marketing/images/facilities/foyer2.jpeg',
            '/marketing/images/facilities/lightmain.JPG',
            '/marketing/images/facilities/darkmain.JPG',
        ]),
        description:
            'The public entry flow, reception feel, visitor movement, and pre-function space.',
        captureNote: 'Lobby panorama nodes with entry and wayfinding markers.',
        layoutNote:
            'Primary visitor arrival and pre-function connector between public areas.',
        preview: {
            headline: 'A polished first interior look for public arrival.',
            lead: 'The foyer and lobby preview is set up for entry orientation, guest flow, and pre-function planning once final 360 captures are added.',
            readiness: 88,
            routeNodes: [
                'Main doors and receiving point',
                'Lobby center orientation',
                'Connector toward gallery and main hall',
            ],
            mediaNeeds: [
                'High-resolution lobby panorama',
                'Reception and wayfinding labels',
                'Interior lighting validation',
            ],
        },
        footprint: {
            x: -3,
            z: 0.4,
            width: 4.4,
            depth: 2.7,
            height: 0.9,
            color: 0xd8b56d,
        },
    },
    {
        id: 'gallery-2600',
        label: 'Gallery 2600',
        shortLabel: 'Gallery',
        category: 'Exhibit Area',
        image: '/marketing/images/facilities/gallery.jpg',
        scenes: buildTourStops('gallery-2600', [
            '/marketing/images/facilities/gallery.jpg',
            '/marketing/images/facilities/lobby.png',
            '/marketing/images/events/labor.jpg',
            '/marketing/images/events/wofex.jpg',
            '/marketing/images/events/tpb.jpg',
        ]),
        description:
            'A flexible gallery setting for exhibit viewing, public displays, and reception overflow.',
        captureNote:
            'Gallery walk-through points for exhibit and reception setup.',
        layoutNote:
            'Flexible public exhibit area connected to the foyer and lobby flow.',
        preview: {
            headline: 'Exhibit-ready preview for Gallery 2600.',
            lead: 'This popup is prepared to show a future gallery walkthrough with exhibit positioning, visitor movement, and reception overflow views.',
            readiness: 84,
            routeNodes: [
                'Gallery entry from lobby',
                'Central exhibit viewing zone',
                'Return path to public circulation',
            ],
            mediaNeeds: [
                'Gallery panorama without temporary clutter',
                'Sample exhibit layout reference',
                'Hotspots for entry and exit points',
            ],
        },
        footprint: {
            x: -6.6,
            z: -1.6,
            width: 3.6,
            depth: 3.1,
            height: 0.86,
            color: 0x9fb8ad,
        },
    },
    {
        id: 'basement',
        label: 'Basement',
        shortLabel: 'Basement',
        category: 'Support Area',
        image: '/marketing/images/facilities/basement.png',
        scenes: buildTourStops('basement', [
            '/marketing/images/facilities/basement.png',
            '/marketing/images/facilities/techbooth.jpg',
            '/marketing/images/facilities/parking.jpg',
            '/marketing/images/facilities/darkmain.JPG',
            '/marketing/images/facilities/gallery.jpg',
        ]),
        description:
            'Lower-level area preview for logistical planning and staff-guided orientation.',
        captureNote:
            'Basement orientation captures will be limited to approved zones.',
        layoutNote:
            'Lower support zone shown as a recessed footprint below the public floor level.',
        preview: {
            headline: 'Controlled lower-level orientation preview.',
            lead: 'The basement view is prepared as a limited public orientation layer, ready for approved imagery and guided route points only.',
            readiness: 78,
            routeNodes: [
                'Approved lower-level entry point',
                'Orientation view for logistics planning',
                'Return route to staff-guided circulation',
            ],
            mediaNeeds: [
                'Approved basement image set',
                'Restricted-area privacy pass',
                'Staff-only route labels',
            ],
        },
        footprint: {
            x: -0.2,
            z: 4.1,
            width: 4.2,
            depth: 2.6,
            height: 0.62,
            color: 0x5f7791,
        },
    },
    {
        id: 'vip-lounge',
        label: 'VIP Lounge',
        shortLabel: 'VIP',
        category: 'Executive Area',
        image: '/marketing/images/facilities/darkvip.JPG',
        scenes: [
            {
                id: 'vip-lounge-part-1',
                label: 'Lounge Part 1',
                image: '/marketing/images/facilities/vip1.jpeg',
                connections: [
                    {
                        targetId: 'vip-lounge-part-2',
                        label: 'Lounge Part 2',
                        kind: 'forward',
                    },
                ],
            },
            {
                id: 'vip-lounge-part-2',
                label: 'Lounge Part 2',
                image: '/marketing/images/facilities/vip2.jpeg',
                connections: [
                    {
                        targetId: 'vip-lounge-part-1',
                        label: 'Lounge Part 1',
                        kind: 'backward',
                    },
                ],
            },
        ],
        description:
            'A two-part private receiving lounge for official guests and smaller gatherings.',
        captureNote:
            'Two connected lounge panoramas cover the seating and television sides of the room.',
        layoutNote:
            'Executive support room placed away from high-traffic public circulation.',
        preview: {
            headline: 'Explore both parts of the VIP Lounge.',
            lead: 'Move between the two real lounge panorama positions while the map tracks your location.',
            readiness: 81,
            routeNodes: [
                'Window-side seating and receiving area',
                'Television-side lounge and sofa area',
            ],
            mediaNeeds: [
                'VIP Lounge Part 1 panorama',
                'VIP Lounge Part 2 panorama',
            ],
        },
        footprint: {
            x: 3.7,
            z: -2.9,
            width: 2.8,
            depth: 2.1,
            height: 1.12,
            color: 0xa78955,
        },
    },
    {
        id: 'boardroom',
        label: 'Boardroom',
        shortLabel: 'Boardroom',
        category: 'Meeting Area',
        image: '/marketing/images/facilities/boardroom.jpg',
        scenes: buildTourStops('boardroom', [
            '/marketing/images/facilities/br1.jpeg',
            '/marketing/images/facilities/br2.jpeg',
            '/marketing/images/facilities/lightvip.JPG',
            '/marketing/images/facilities/lobby.png',
            '/marketing/images/facilities/techbooth.jpg',
        ]),
        description:
            'A meeting-focused room preview for planning formal discussions and coordination sessions.',
        captureNote:
            'Table layout and room-entry capture points for meeting setup.',
        layoutNote: 'Formal meeting area adjacent to executive support spaces.',
        preview: {
            headline: 'Meeting-room preview for formal coordination.',
            lead: 'Prepared to show boardroom scale, table orientation, and entry points for organizers planning meetings or coordination sessions.',
            readiness: 83,
            routeNodes: [
                'Room entry and front orientation',
                'Table and seating center view',
                'Presentation wall reference',
            ],
            mediaNeeds: [
                'Boardroom panorama from table center',
                'Seating layout image',
                'Presentation-side hotspot',
            ],
        },
        footprint: {
            x: 6.7,
            z: -2.9,
            width: 2.5,
            depth: 2.1,
            height: 1.04,
            color: 0xc59c5d,
        },
    },
    {
        id: 'main-hall',
        label: 'Main Hall',
        shortLabel: 'Hall',
        category: 'Primary Venue',
        image: '/marketing/images/facilities/darkmain.JPG',
        // Replace each named scene image path with its matching final Main Hall panorama.
        scenes: [
            {
                id: 'main-hall-ground',
                label: 'Ground Hall',
                image: '/marketing/images/facilities/hall_mid.jpeg',
                connections: [
                    {
                        targetId: 'main-hall-upper-left-1',
                        label: 'Upper Left',
                        kind: 'choice',
                    },
                    {
                        targetId: 'main-hall-upper-right-1',
                        label: 'Upper Right',
                        kind: 'choice',
                    },
                    {
                        targetId: 'main-hall-upper-mid',
                        label: 'Upper Mid',
                        kind: 'choice',
                    },
                    {
                        targetId: 'main-hall-stage',
                        label: 'Stage',
                        kind: 'choice',
                    },
                ],
            },
            {
                id: 'main-hall-upper-right-1',
                label: 'Upper Right 1',
                image: '/marketing/images/facilities/topright.jpeg',
                connections: [
                    {
                        targetId: 'main-hall-ground',
                        label: 'Ground Hall',
                        kind: 'backward',
                    },
                    {
                        targetId: 'main-hall-upper-right-2',
                        label: 'Upper Right 2',
                        kind: 'forward',
                    },
                ],
            },
            {
                id: 'main-hall-upper-right-2',
                label: 'Upper Right 2',
                image: '/marketing/images/facilities/topright2.jpeg',
                connections: [
                    {
                        targetId: 'main-hall-upper-right-1',
                        label: 'Upper Right 1',
                        kind: 'backward',
                    },
                ],
            },
            {
                id: 'main-hall-upper-left-1',
                label: 'Upper Left 1',
                image: '/marketing/images/facilities/topleft.jpeg',
                connections: [
                    {
                        targetId: 'main-hall-ground',
                        label: 'Ground Hall',
                        kind: 'backward',
                    },
                    {
                        targetId: 'main-hall-upper-left-2',
                        label: 'Upper Left 2',
                        kind: 'forward',
                    },
                ],
            },
            {
                id: 'main-hall-upper-left-2',
                label: 'Upper Left 2',
                image: '/marketing/images/facilities/topleft2.jpeg',
                connections: [
                    {
                        targetId: 'main-hall-upper-left-1',
                        label: 'Upper Left 1',
                        kind: 'backward',
                    },
                ],
            },
            {
                id: 'main-hall-stage',
                label: 'Stage',
                image: '/marketing/images/facilities/stage360.jpeg',
                connections: [
                    {
                        targetId: 'main-hall-ground',
                        label: 'Ground Hall',
                        kind: 'backward',
                    },
                ],
            },
            {
                id: 'main-hall-upper-mid',
                label: 'Upper Mid',
                image: '/marketing/images/facilities/hallmidtop.jpeg',
                connections: [
                    {
                        targetId: 'main-hall-ground',
                        label: 'Ground Hall',
                        kind: 'backward',
                    },
                ],
            },
        ],
        description:
            'A seven-view Main Hall experience that begins at Ground Hall and branches toward the upper-left, upper-right, upper-mid, and stage perspectives.',
        captureNote:
            'Ground Hall is the navigation hub. Upper-left and upper-right each continue through two connected views.',
        layoutNote:
            'Largest public event volume with center-floor, upper-level, and stage references.',
        preview: {
            headline: 'Explore seven connected Main Hall perspectives.',
            lead: 'Begin at Ground Hall, then choose Upper Left, Upper Right, Upper Mid, or Stage. The left and right routes each continue to a second connected view.',
            readiness: 94,
            routeNodes: [
                'Ground Hall central navigation hub',
                'Upper Left 1 and 2 route',
                'Upper Right 1 and 2 route',
                'Upper Mid and Stage perspectives',
            ],
            mediaNeeds: [
                'Ground Hall center panorama',
                'Upper Left 1 and 2 panoramas',
                'Upper Right 1 and 2 panoramas',
                'Stage and Upper Mid panoramas',
            ],
        },
        footprint: {
            x: 3.3,
            z: 1.1,
            width: 8.1,
            depth: 5.2,
            height: 1.75,
            color: 0x176456,
        },
    },
    {
        id: 'backstage-dressing',
        label: 'Backstage & Dressing Room',
        shortLabel: 'Backstage',
        category: 'Production Area',
        image: '/marketing/images/facilities/techbooth.jpg',
        scenes: buildTourStops('backstage-dressing', [
            '/marketing/images/facilities/techbooth.jpg',
            '/marketing/images/facilities/darkmain.JPG',
            '/marketing/images/facilities/ledwall.jpg',
            '/marketing/images/facilities/basement.png',
            '/marketing/images/facilities/boardroom.jpg',
        ]),
        description:
            'A controlled orientation for production access, preparation flow, and dressing-room coordination.',
        captureNote:
            'Restricted previews will show only approved backstage movement zones.',
        layoutNote:
            'Production support zone behind the main hall for controlled staff and performer movement.',
        preview: {
            headline: 'Production support preview for approved access.',
            lead: 'Backstage and dressing-room preview content is prepared for controlled imagery, helping organizers understand production movement without exposing restricted details.',
            readiness: 77,
            routeNodes: [
                'Approved backstage connector',
                'Preparation and dressing orientation',
                'Return route toward main hall support',
            ],
            mediaNeeds: [
                'Approved backstage image',
                'Restricted-detail masking pass',
                'Production movement hotspot',
            ],
        },
        footprint: {
            x: 7.9,
            z: 1.1,
            width: 2.2,
            depth: 4.6,
            height: 1.2,
            color: 0x835f73,
        },
    },
];

export const TOUR_AREA_MAPS: Record<string, TourAreaMap> = {
    'whole-tour': {
        title: 'BCCC Location Map',
        subtitle: 'Venue location and surrounding Baguio roads',
        level: 'Site overview',
        backgroundImage: '/marketing/images/maps/map.png',
        rooms: [],
        nodes: [
            { sceneId: 'whole-tour-stop-1', x: 47, y: 46 },
            { sceneId: 'whole-tour-stop-2', x: 49, y: 48 },
            { sceneId: 'whole-tour-stop-3', x: 51, y: 50 },
            { sceneId: 'whole-tour-stop-4', x: 53, y: 52 },
            { sceneId: 'whole-tour-stop-5', x: 55, y: 54 },
        ],
    },
    'grounds-parking': {
        title: 'Grounds & Arrival Map',
        subtitle: 'Exterior approach, parking, and nearby roads',
        level: 'Outdoor grounds',
        backgroundImage: '/marketing/images/maps/map.png',
        rooms: [],
        nodes: [
            { sceneId: 'grounds-parking-stop-1', x: 44, y: 51 },
            { sceneId: 'grounds-parking-stop-2', x: 47, y: 49 },
            { sceneId: 'grounds-parking-stop-3', x: 50, y: 47 },
            { sceneId: 'grounds-parking-stop-4', x: 53, y: 49 },
            { sceneId: 'grounds-parking-stop-5', x: 56, y: 51 },
        ],
    },
    'foyer-lobby': {
        title: 'Foyer & Lobby Floor Map',
        subtitle: 'Public entrance with adjacent visitor areas',
        level: 'Ground floor',
        rooms: [
            {
                id: 'foyer',
                label: 'Foyer & Lobby',
                x: 25,
                y: 25,
                width: 50,
                height: 50,
                kind: 'active',
            },
            {
                id: 'gallery',
                label: 'Gallery 2600',
                x: 3,
                y: 25,
                width: 18,
                height: 50,
                areaId: 'gallery-2600',
                kind: 'surrounding',
            },
            {
                id: 'hall',
                label: 'Main Hall',
                x: 79,
                y: 18,
                width: 18,
                height: 64,
                areaId: 'main-hall',
                kind: 'surrounding',
            },
            {
                id: 'entrance',
                label: 'Main Entrance',
                x: 38,
                y: 80,
                width: 24,
                height: 10,
                kind: 'feature',
            },
        ],
        nodes: [
            { sceneId: 'foyer-lobby-stop-1', x: 49, y: 71 },
            { sceneId: 'foyer-lobby-stop-2', x: 39, y: 58 },
            { sceneId: 'foyer-lobby-stop-3', x: 50, y: 48 },
            { sceneId: 'foyer-lobby-stop-4', x: 61, y: 38 },
            { sceneId: 'foyer-lobby-stop-5', x: 70, y: 29 },
        ],
    },
    'gallery-2600': {
        title: 'Gallery 2600 Floor Map',
        subtitle: 'Exhibit room and its public surroundings',
        level: 'Ground floor',
        rooms: [
            {
                id: 'gallery',
                label: 'Gallery 2600',
                x: 18,
                y: 18,
                width: 58,
                height: 64,
                kind: 'active',
            },
            {
                id: 'lobby',
                label: 'Foyer & Lobby',
                x: 80,
                y: 28,
                width: 17,
                height: 44,
                areaId: 'foyer-lobby',
                kind: 'surrounding',
            },
            {
                id: 'public-path',
                label: 'Public Approach',
                x: 3,
                y: 36,
                width: 11,
                height: 28,
                kind: 'feature',
            },
        ],
        nodes: [
            { sceneId: 'gallery-2600-stop-1', x: 69, y: 50 },
            { sceneId: 'gallery-2600-stop-2', x: 59, y: 50 },
            { sceneId: 'gallery-2600-stop-3', x: 47, y: 50 },
            { sceneId: 'gallery-2600-stop-4', x: 35, y: 50 },
            { sceneId: 'gallery-2600-stop-5', x: 24, y: 50 },
        ],
    },
    basement: {
        title: 'Basement Orientation Map',
        subtitle: 'Approved lower-level route and nearby support areas',
        level: 'Lower level',
        rooms: [
            {
                id: 'basement',
                label: 'Approved Basement Zone',
                x: 14,
                y: 20,
                width: 66,
                height: 60,
                kind: 'active',
            },
            {
                id: 'stairs',
                label: 'Stairs',
                x: 84,
                y: 22,
                width: 13,
                height: 24,
                kind: 'feature',
            },
            {
                id: 'support',
                label: 'Support Access',
                x: 84,
                y: 54,
                width: 13,
                height: 26,
                areaId: 'backstage-dressing',
                kind: 'surrounding',
            },
        ],
        nodes: [
            { sceneId: 'basement-stop-1', x: 74, y: 50 },
            { sceneId: 'basement-stop-2', x: 62, y: 50 },
            { sceneId: 'basement-stop-3', x: 50, y: 50 },
            { sceneId: 'basement-stop-4', x: 38, y: 50 },
            { sceneId: 'basement-stop-5', x: 25, y: 50 },
        ],
    },
    'vip-lounge': {
        title: 'VIP Lounge Floor Map',
        subtitle: 'Two-part lounge layout with nearby executive rooms',
        level: 'Executive level',
        rooms: [
            {
                id: 'vip-main',
                label: 'VIP Lounge',
                x: 18,
                y: 22,
                width: 64,
                height: 56,
                kind: 'active',
            },
            {
                id: 'vip-seating',
                label: 'Window Seating',
                x: 22,
                y: 27,
                width: 24,
                height: 16,
                kind: 'feature',
            },
            {
                id: 'vip-tv',
                label: 'TV & Sofa Area',
                x: 54,
                y: 54,
                width: 24,
                height: 18,
                kind: 'feature',
            },
            {
                id: 'boardroom',
                label: 'Boardroom',
                x: 84,
                y: 22,
                width: 13,
                height: 28,
                areaId: 'boardroom',
                kind: 'surrounding',
            },
            {
                id: 'corridor',
                label: 'Executive Corridor',
                x: 84,
                y: 56,
                width: 13,
                height: 22,
                kind: 'feature',
            },
        ],
        nodes: [
            { sceneId: 'vip-lounge-part-1', x: 35, y: 58 },
            { sceneId: 'vip-lounge-part-2', x: 64, y: 42 },
        ],
    },
    boardroom: {
        title: 'Boardroom Floor Map',
        subtitle: 'Meeting room and adjacent executive spaces',
        level: 'Executive level',
        rooms: [
            {
                id: 'boardroom',
                label: 'Boardroom',
                x: 22,
                y: 20,
                width: 58,
                height: 60,
                kind: 'active',
            },
            {
                id: 'table',
                label: 'Conference Table',
                x: 36,
                y: 34,
                width: 30,
                height: 32,
                kind: 'feature',
            },
            {
                id: 'vip',
                label: 'VIP Lounge',
                x: 3,
                y: 27,
                width: 15,
                height: 46,
                areaId: 'vip-lounge',
                kind: 'surrounding',
            },
            {
                id: 'corridor',
                label: 'Corridor',
                x: 84,
                y: 27,
                width: 13,
                height: 46,
                kind: 'feature',
            },
        ],
        nodes: [
            { sceneId: 'boardroom-stop-1', x: 27, y: 50 },
            { sceneId: 'boardroom-stop-2', x: 38, y: 50 },
            { sceneId: 'boardroom-stop-3', x: 50, y: 50 },
            { sceneId: 'boardroom-stop-4', x: 62, y: 50 },
            { sceneId: 'boardroom-stop-5', x: 74, y: 50 },
        ],
    },
    'main-hall': {
        title: 'Main Hall Floor Map',
        subtitle: 'Ground, stage, and upper viewing positions',
        level: 'Main venue',
        rooms: [
            {
                id: 'hall-floor',
                label: 'Ground Hall',
                x: 22,
                y: 22,
                width: 56,
                height: 56,
                kind: 'active',
            },
            {
                id: 'stage',
                label: 'Stage',
                x: 34,
                y: 80,
                width: 32,
                height: 14,
                kind: 'feature',
            },
            {
                id: 'upper-left',
                label: 'Upper Left',
                x: 3,
                y: 20,
                width: 15,
                height: 58,
                kind: 'feature',
            },
            {
                id: 'upper-right',
                label: 'Upper Right',
                x: 82,
                y: 20,
                width: 15,
                height: 58,
                kind: 'feature',
            },
            {
                id: 'upper-mid',
                label: 'Upper Mid',
                x: 34,
                y: 4,
                width: 32,
                height: 14,
                kind: 'feature',
            },
            {
                id: 'backstage',
                label: 'Backstage',
                x: 70,
                y: 82,
                width: 27,
                height: 12,
                areaId: 'backstage-dressing',
                kind: 'surrounding',
            },
        ],
        nodes: [
            { sceneId: 'main-hall-ground', x: 50, y: 51 },
            { sceneId: 'main-hall-upper-right-1', x: 88, y: 58 },
            { sceneId: 'main-hall-upper-right-2', x: 88, y: 35 },
            { sceneId: 'main-hall-upper-left-1', x: 12, y: 58 },
            { sceneId: 'main-hall-upper-left-2', x: 12, y: 35 },
            { sceneId: 'main-hall-stage', x: 50, y: 87 },
            { sceneId: 'main-hall-upper-mid', x: 50, y: 11 },
        ],
    },
    'backstage-dressing': {
        title: 'Backstage & Dressing Map',
        subtitle: 'Approved production route behind the Main Hall',
        level: 'Production level',
        rooms: [
            {
                id: 'backstage',
                label: 'Backstage',
                x: 20,
                y: 20,
                width: 48,
                height: 60,
                kind: 'active',
            },
            {
                id: 'dressing',
                label: 'Dressing Room',
                x: 4,
                y: 24,
                width: 12,
                height: 52,
                kind: 'feature',
            },
            {
                id: 'main-hall',
                label: 'Main Hall & Stage',
                x: 72,
                y: 20,
                width: 25,
                height: 60,
                areaId: 'main-hall',
                kind: 'surrounding',
            },
        ],
        nodes: [
            { sceneId: 'backstage-dressing-stop-1', x: 62, y: 50 },
            { sceneId: 'backstage-dressing-stop-2', x: 54, y: 50 },
            { sceneId: 'backstage-dressing-stop-3', x: 45, y: 50 },
            { sceneId: 'backstage-dressing-stop-4', x: 36, y: 50 },
            { sceneId: 'backstage-dressing-stop-5', x: 27, y: 50 },
        ],
    },
};

export const TOUR_LAUNCH_STEPS = [
    'Complete connected photos for every area',
    'Area-to-area route mapping',
    'Public safety and privacy review',
    'Final upload to BCCC EASE',
];

export type TourInfoCard = {
    title: string;
    detail: string;
};

export const TOUR_RELEASE_CHECKLIST: TourInfoCard[] = [
    {
        title: 'Media library',
        detail: 'Each area has connected walk-through image slots. Main Hall uses seven named views with a branching route; other areas keep their ordered route.',
    },
    {
        title: 'Connected navigation',
        detail: 'Every public node should have a clear previous and next destination, matching both the tour and layout pages.',
    },
    {
        title: 'Accessible fallback',
        detail: 'If an image cannot load, visitors should still see the area description, route nodes, movement controls, and booking links.',
    },
    {
        title: 'Content approval',
        detail: 'Before launch, verify privacy-sensitive rooms, restricted zones, signage, lighting, and temporary event materials.',
    },
];

export const TOUR_STREET_VIEW_GUIDANCE: TourInfoCard[] = [
    {
        title: 'Use connected area photos',
        detail: 'Replace each placeholder set with equirectangular 360 panoramas captured in route order. Main Hall uses its seven named view positions. Consistent camera height, direction, and lighting make the blur transition feel natural.',
    },
    {
        title: 'Add visible move points',
        detail: 'Each area should have two to four route hotspots: entry, center view, exit path, and the next connected public area.',
    },
    {
        title: 'Keep restricted areas controlled',
        detail: 'Backstage, basement, and VIP areas should only expose approved viewing angles with privacy-safe framing.',
    },
    {
        title: 'Match the layout page',
        detail: 'Every tour node should correspond to one blueprint area so visitors understand where they are inside the venue.',
    },
];

export const TOUR_MEDIA_SPECS: TourInfoCard[] = [
    {
        title: 'Walk-through image format',
        detail: 'Use 2:1 equirectangular 360 images at the same resolution, with a level horizon and consistent movement direction between connected views.',
    },
    {
        title: 'Lighting pass',
        detail: 'Capture interiors with clean balanced exposure; avoid dark corners, blown highlights, and temporary visual clutter.',
    },
    {
        title: 'Upload naming',
        detail: 'Use stable names such as main-hall-ground, main-hall-upper-right-1, main-hall-upper-right-2, main-hall-upper-left-1, main-hall-upper-left-2, main-hall-stage, and main-hall-upper-mid.',
    },
    {
        title: 'Fallback image',
        detail: 'Keep a lightweight backup photo for each area so the route remains useful on slow connections and older devices.',
    },
];

export const LAYOUT_VIEW_GUIDANCE = {
    exterior: {
        title: 'Exterior Massing',
        detail: 'Shows the outside building blocks, roof plates, overall footprint, and how the public approach connects to the venue.',
    },
    interior: {
        title: 'Interior See-Through',
        detail: 'Uses transparent room volumes, floor plates, and guide lines so visitors can understand circulation inside the model.',
    },
} as const;

export const LAYOUT_IMPLEMENTATION_SUGGESTIONS: TourInfoCard[] = [
    {
        title: 'Replace conceptual blocks with measured geometry',
        detail: 'When final plans are available, map the actual room footprint, height, entrances, and corridor connections per area.',
    },
    {
        title: 'Add area labels and pin points',
        detail: 'The current model is prepared for labels; final implementation can add floating names and clickable pins above each room.',
    },
    {
        title: 'Link blueprint pins to tour nodes',
        detail: 'Selecting Main Hall, Boardroom, or Lobby in the model should open the matching street-view panorama on the tour page.',
    },
    {
        title: 'Keep two model layers',
        detail: 'Maintain exterior for public arrival planning and interior for transparent wayfinding, accessibility, and event setup review.',
    },
];
