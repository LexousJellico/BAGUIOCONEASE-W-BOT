export type TourArea = {
    id: string;
    label: string;
    shortLabel: string;
    category: string;
    image: string;
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
        description:
            'A planned complete path from outdoor arrival through the primary public interior areas of BCCC.',
        captureNote:
            'Linked route preview with continuous area-to-area movement.',
        layoutNote:
            'Full route overview connecting exterior, lobby, public halls, meeting areas, and production support.',
        preview: {
            headline: 'One guided visit across the full BCCC route.',
            lead: 'A complete public walkthrough preview prepared for a future 360-degree tour from arrival to the major public and support areas.',
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
        description:
            'Arrival points, open grounds, parking orientation, and exterior circulation views.',
        captureNote: 'Outdoor 360-degree capture points for arrival planning.',
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
        description:
            'A more private receiving and preparation space for official guests and smaller gatherings.',
        captureNote: 'Reserved-area preview with privacy-sensitive framing.',
        layoutNote:
            'Executive support room placed away from high-traffic public circulation.',
        preview: {
            headline: 'Reserved lounge preview with private-room framing.',
            lead: 'The VIP Lounge popup is ready to present the room atmosphere while keeping the final 360 tour privacy-sensitive.',
            readiness: 81,
            routeNodes: [
                'Controlled lounge entry',
                'Receiving and seating view',
                'Connector toward meeting support spaces',
            ],
            mediaNeeds: [
                'Final lounge hero image',
                'Privacy-safe panorama crop',
                'Access-note hotspot',
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
        description:
            'The main event space for conventions, ceremonies, conferences, productions, and major programs.',
        captureNote:
            'Large-hall route with front, center, rear, and stage-view nodes.',
        layoutNote:
            'Largest public event volume with front, rear, and side circulation references.',
        preview: {
            headline: 'Main event-space preview for large programs.',
            lead: 'The main hall preview is structured for the future tour path: stage, center floor, rear view, side circulation, and production references.',
            readiness: 89,
            routeNodes: [
                'Rear audience perspective',
                'Center floor and stage view',
                'Side circulation and production approach',
            ],
            mediaNeeds: [
                'Final large-hall panorama set',
                'Stage-view image capture',
                'Audience-flow hotspot map',
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
        description:
            'A planned orientation for production access, preparation flow, and dressing-room coordination.',
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

export const TOUR_LAUNCH_STEPS = [
    '360-degree capture and stitching',
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
        detail: 'Each area should have one final 360 panorama, one fallback wide image, and one thumbnail for fast loading.',
    },
    {
        title: 'Connected navigation',
        detail: 'Every public node should have a clear previous and next destination, matching both the tour and layout pages.',
    },
    {
        title: 'Accessible fallback',
        detail: 'If WebGL or 360 media cannot load, visitors should still see the area image, description, route nodes, and booking links.',
    },
    {
        title: 'Content approval',
        detail: 'Before launch, verify privacy-sensitive rooms, restricted zones, signage, lighting, and temporary event materials.',
    },
];

export const TOUR_STREET_VIEW_GUIDANCE: TourInfoCard[] = [
    {
        title: 'Use real 360 panorama images',
        detail: 'Replace each current placeholder image with an approved equirectangular panorama so the street-view lens becomes fully natural.',
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
        title: 'Panorama format',
        detail: 'Preferred 2:1 equirectangular image, high-resolution, level horizon, no heavy distortion or cropped ceilings.',
    },
    {
        title: 'Lighting pass',
        detail: 'Capture interiors with clean balanced exposure; avoid dark corners, blown highlights, and temporary visual clutter.',
    },
    {
        title: 'Upload naming',
        detail: 'Use stable area ids such as main-hall, foyer-lobby, and boardroom so future CMS upload mapping stays predictable.',
    },
    {
        title: 'Fallback image',
        detail: 'Keep a normal wide photo for each area in case WebGL, 360 media, or device capability is unavailable.',
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
