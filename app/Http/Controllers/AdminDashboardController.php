<?php

namespace App\Http\Controllers;

use App\Models\CalendarBlock;
use App\Models\FeaturePackage;
use App\Models\HomepageStat;
use App\Models\PublicEvent;
use App\Models\VenueSpace;
use App\Services\BookingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request, BookingService $bookingService): Response
    {
        $bookingCountsAll = $bookingService->getStatusCounts();

        $bookingCounts = [
            'pending' => (int) ($bookingCountsAll['pending'] ?? 0),
            'confirmed' => (int) ($bookingCountsAll['confirmed'] ?? 0),
            'active' => (int) ($bookingCountsAll['active'] ?? 0),
            'completed' => (int) ($bookingCountsAll['completed'] ?? 0),
            'declined' => (int) ($bookingCountsAll['declined'] ?? 0),
            'cancelled' => (int) ($bookingCountsAll['cancelled'] ?? 0),
        ];

        $contentCounts = [
            'bcccEvents' => PublicEvent::query()->where('scope', 'bccc')->count(),
            'cityEvents' => PublicEvent::query()->where('scope', 'city')->count(),
            'featuredEvents' => PublicEvent::query()->where('scope', 'bccc')->where('is_highlighted', true)->count(),
            'packages' => FeaturePackage::query()->count(),
            'calendarBlocks' => CalendarBlock::query()->count(),
            'spaces' => VenueSpace::query()->count(),
            'homepageVisibleSpaces' => VenueSpace::query()->where('homepage_visible', true)->count(),
            'stats' => HomepageStat::query()->count(),
        ];

        $recentEvents = PublicEvent::query()
            ->orderByDesc('event_date')
            ->orderByDesc('updated_at')
            ->limit(6)
            ->get()
            ->map(fn (PublicEvent $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'scope' => $event->scope,
                'venue' => $event->venue,
                'date' => optional($event->event_date)->format('Y-m-d'),
                'highlighted' => (bool) $event->is_highlighted,
            ])
            ->values();

        $recentSpaces = VenueSpace::query()
            ->orderByDesc('updated_at')
            ->limit(6)
            ->get()
            ->map(fn (VenueSpace $space) => [
                'id' => $space->id,
                'title' => $space->title,
                'category' => $space->category,
                'capacity' => $space->capacity,
                'homepageVisible' => (bool) $space->homepage_visible,
            ])
            ->values();

        return Inertia::render('admin/dashboard', [
            'bookingCounts' => $bookingCounts,
            'contentCounts' => $contentCounts,
            'recentEvents' => $recentEvents,
            'recentSpaces' => $recentSpaces,
        ]);
    }
}
