<?php

namespace Database\Seeders;

use App\Models\CalendarBlock;
use App\Models\FeaturePackage;
use App\Models\HomepageStat;
use App\Models\PublicEvent;
use App\Models\SiteSetting;
use App\Models\User;
use App\Models\VenueSpace;
use Illuminate\Database\Seeder;

class PublicSiteContentSeeder extends Seeder
{
    public function run(): void
    {
        SiteSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'map_embed_url' => 'https://www.google.com/maps?q=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines&z=16&output=embed',
                'open_map_url' => 'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines',
                'address' => 'CH3X+RRW, Baguio, Benguet, Philippines',
                'phone' => '(074) 446 2009',
                'email' => 'info@bccc-ease.com',
                'footer_description' => 'A public-facing venue platform for space discovery, event highlights, schedule visibility, and booking guidance for the Baguio Convention and Cultural Center.',
                'footer_copyright' => '© 2026 BCCC EASE • City Government of Baguio • All Rights Reserved',
            ]
        );

        $stats = [
            ['label' => 'Seating Capacity', 'value' => '2000', 'suffix' => '+'],
            ['label' => 'Parking Support', 'value' => '50', 'suffix' => '+'],
            ['label' => 'Public Venue Zones', 'value' => '8', 'suffix' => ''],
            ['label' => 'Years of Venue Legacy', 'value' => '48', 'suffix' => ''],
        ];

        foreach ($stats as $index => $item) {
            HomepageStat::query()->updateOrCreate(
                ['label' => $item['label']],
                [
                    'value' => $item['value'],
                    'suffix' => $item['suffix'],
                    'sort_order' => $index + 1,
                ]
            );
        }

        $spaces = [
            [
                'title' => 'Foyer & Lobby',
                'category' => 'Reception Space',
                'capacity' => '50+ guest flow',
                'short_description' => 'An elegant welcome area ideal for guest reception, registration, and networking.',
                'summary' => 'A public-facing entry and gathering zone for reception, guest movement, and pre-event coordination.',
                'details' => ['Reception area', 'Registration support', 'Networking flow'],
                'light_image' => '/marketing/images/facilities/lobby.png',
                'dark_image' => '/marketing/images/facilities/lobby.png',
                'homepage_visible' => true,
            ],
            [
                'title' => 'Gallery 2600',
                'category' => 'Exhibit Hall',
                'capacity' => 'Flexible setup',
                'short_description' => 'A versatile hall suited for exhibits, cultural displays, and intimate gathering formats.',
                'summary' => 'A flexible indoor venue for curated exhibits and community programs.',
                'details' => ['Exhibits', 'Cultural displays', 'Community activities'],
                'light_image' => '/marketing/images/facilities/gallery.jpg',
                'dark_image' => '/marketing/images/facilities/gallery.jpg',
                'homepage_visible' => true,
            ],
            [
                'title' => 'Main Hall',
                'category' => 'Main Venue',
                'capacity' => '1000+ capacity',
                'short_description' => 'The center stage for conferences, large-scale civic gatherings, and public programs.',
                'summary' => 'The largest public venue area inside the convention center.',
                'details' => ['Large-scale events', 'Stage included', 'Backstage included', 'Dressing room included'],
                'light_image' => '/marketing/images/events/darkmain.JPG',
                'dark_image' => '/marketing/images/events/darkmain.JPG',
                'homepage_visible' => true,
            ],
            [
                'title' => 'Tech Booth',
                'category' => 'Support Facility',
                'capacity' => 'Operational support',
                'short_description' => 'A support station for production control, AV operations, and event coordination.',
                'summary' => 'Supports audio-visual and technical event operations.',
                'details' => ['AV control', 'Production support', 'Event operations'],
                'light_image' => '/marketing/images/facilities/techbooth.jpg',
                'dark_image' => '/marketing/images/facilities/techbooth.jpg',
                'homepage_visible' => true,
            ],
            [
                'title' => 'Tourism Office',
                'category' => 'Public Office',
                'capacity' => 'Visitor assistance',
                'short_description' => 'A public service point for tourism coordination, local information, and assistance.',
                'summary' => 'A public-facing support and tourism coordination office.',
                'details' => ['Visitor assistance', 'Public information', 'Local coordination'],
                'light_image' => '/marketing/images/branding/tourism.jpg',
                'dark_image' => '/marketing/images/branding/tourism.jpg',
                'homepage_visible' => true,
            ],
        ];

        foreach ($spaces as $index => $item) {
            VenueSpace::query()->updateOrCreate(
                ['title' => $item['title']],
                array_merge($item, ['sort_order' => $index + 1])
            );
        }

        $events = [
            [
                'scope' => 'bccc',
                'title' => 'LABOR',
                'venue' => 'Main Hall',
                'event_date' => '2026-03-22',
                'event_time' => '10:00',
                'description' => 'A featured creative market highlighting local makers, crafts, and community-driven cultural showcases.',
                'note' => 'Highlighted public BCCC event.',
                'is_highlighted' => true,
                'is_public' => true,
                'images' => ['/marketing/images/events/labor.jpg'],
            ],
            [
                'scope' => 'bccc',
                'title' => 'CHURCH',
                'venue' => 'Baguio Convention and Cultural Center',
                'event_date' => '2026-04-10',
                'event_time' => '09:00',
                'description' => 'A formal gathering designed for public sector dialogue, business networking, and multi-sector coordination.',
                'note' => 'Convention-center public program.',
                'is_highlighted' => false,
                'is_public' => true,
                'images' => ['/marketing/images/events/church.jpg'],
            ],
            [
                'scope' => 'city',
                'title' => 'WOFEX',
                'venue' => 'Baguio City',
                'event_date' => '2026-05-03',
                'event_time' => '18:00',
                'description' => 'An evening showcase celebrating heritage, artistry, and the vibrant culture of Baguio City.',
                'note' => 'Public city event.',
                'is_highlighted' => false,
                'is_public' => true,
                'images' => ['/marketing/images/events/wofex.jpg'],
            ],
        ];

        foreach ($events as $index => $item) {
            PublicEvent::query()->updateOrCreate(
                ['title' => $item['title'], 'scope' => $item['scope']],
                array_merge($item, ['sort_order' => $index + 1])
            );
        }

        $packages = [
            [
                'title' => 'Convention Package',
                'description' => 'For conferences, summits, and large formal gatherings.',
                'images' => ['/marketing/images/events/darkmain.JPG'],
            ],
            [
                'title' => 'Community Showcase Package',
                'description' => 'Suitable for exhibits, pop-ups, cultural displays, and public-facing activations.',
                'images' => ['/marketing/images/events/4.jpg'],
            ],
        ];

        foreach ($packages as $index => $item) {
            FeaturePackage::query()->updateOrCreate(
                ['title' => $item['title']],
                array_merge($item, ['sort_order' => $index + 1])
            );
        }

        $user = User::query()->orderBy('id')->first();

        if ($user) {
            $blocks = [
                [
                    'title' => 'Public Program Day',
                    'area' => 'Main Hall',
                    'notes' => 'Visible to public as a blue schedule date.',
                    'block' => 'DAY',
                    'public_status' => 'blue',
                    'date_from' => '2026-05-03',
                    'date_to' => '2026-05-03',
                ],
                [
                    'title' => 'Private Reservation',
                    'area' => 'Whole Venue',
                    'notes' => 'Private booking and hidden from public details.',
                    'block' => 'DAY',
                    'public_status' => 'gold',
                    'date_from' => '2026-05-16',
                    'date_to' => '2026-05-16',
                ],
                [
                    'title' => 'Maintenance Block',
                    'area' => 'Main Hall',
                    'notes' => 'Venue unavailable for public booking.',
                    'block' => 'DAY',
                    'public_status' => 'red',
                    'date_from' => '2026-04-24',
                    'date_to' => '2026-04-24',
                ],
            ];

            foreach ($blocks as $item) {
                CalendarBlock::query()->updateOrCreate(
                    [
                        'title' => $item['title'],
                        'area' => $item['area'],
                        'date_from' => $item['date_from'],
                        'date_to' => $item['date_to'],
                    ],
                    array_merge($item, ['created_by_user_id' => $user->id])
                );
            }
        }
    }
}