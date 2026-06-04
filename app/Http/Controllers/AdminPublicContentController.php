<?php

namespace App\Http\Controllers;

use App\Models\FeaturePackage;
use App\Models\HomepageStat;
use App\Models\PublicEvent;
use App\Models\Service;
use App\Models\SiteSetting;
use App\Models\TourismMember;
use App\Models\VenueSpace;
use App\Support\WorkspacePage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Support\PublicImagePath;
use App\Support\PublicStorageImage;

class AdminPublicContentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureAdmin($request);

        return Inertia::render(
            WorkspacePage::resolve($request, 'admin/content/index'),
            $this->contentManagerPayload()
        );
    }

    public function content(Request $request): Response
    {
        return $this->index($request);
    }

    public function contentData(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json($this->contentManagerPayload());
    }

    public function home(Request $request): Response
    {
        $this->ensureAdmin($request);

        return Inertia::render(WorkspacePage::resolve($request, 'admin/home'), [
            'initialBcccEvents' => $this->eventsPayload('bccc')->all(),
            'initialCityEvents' => $this->eventsPayload('city')->all(),
            'initialPackages' => $this->packagesPayload()->all(),
            'initialCalendarBlocks' => $this->calendarBlocksPayload()->all(),
            'initialSpaces' => $this->spacesPayload()->all(),
            'initialStats' => $this->statsPayload()->all(),
            'initialTourismMembers' => $this->membersPayload()->all(),
            'initialSiteConfig' => $this->siteSettingsPayload(),
            'initialVenueAreas' => $this->venueAreaOptions()->all(),
        ]);
    }

    protected function contentManagerPayload(): array
    {
        $bcccEvents = $this->eventsPayload('bccc')->all();
        $cityEvents = $this->eventsPayload('city')->all();
        $packages = $this->packagesPayload()->all();
        $members = $this->membersPayload()->all();

        $events = collect($bcccEvents)
            ->merge($cityEvents)
            ->sortBy([
                ['sort_order', 'asc'],
                ['event_date', 'asc'],
                ['id', 'desc'],
            ])
            ->values()
            ->all();

        return [
            'events' => $events,
            'bcccEvents' => $bcccEvents,
            'cityEvents' => $cityEvents,
            'spaces' => $this->spacesPayload()->all(),
            'offers' => $packages,
            'packages' => $packages,
            'stats' => $this->statsPayload()->all(),
            'members' => $members,
            'tourismMembers' => $members,
            'siteSettings' => $this->siteSettingsPayload(),
            'storageLinked' => is_link(public_path('storage')) || is_dir(public_path('storage')),
        ];
    }

    protected function contentPayload(): array
    {
        return $this->contentManagerPayload();
    }

    public function storeEvent(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'scope' => ['nullable', Rule::in(['bccc', 'city'])],
            'category' => ['nullable', 'string', 'max:255'],
            'event_category' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'venue' => ['nullable', 'string', 'max:255'],
            'event_date' => ['nullable', 'date'],
            'starts_at' => ['nullable', 'date'],
            'date' => ['nullable', 'date'],
            'event_date_to' => ['nullable', 'date'],
            'dateEnd' => ['nullable', 'date'],
            'event_time' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
            'external_url' => ['nullable', 'string', 'max:2000'],
            'homepage_visible' => ['nullable', 'boolean'],
            'is_public' => ['nullable', 'boolean'],
            'is_highlighted' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'image_path' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'max:8192'],
            'images.*' => ['nullable', 'image', 'max:8192'],
        ]);

        $scope = $this->eventScope($data);
        $eventDate = $this->firstValue($data, ['event_date', 'starts_at', 'date'], now()->toDateString());
        $eventDateTo = $this->firstValue($data, ['event_date_to', 'dateEnd'], $eventDate);
        $isVisible = $this->booleanInput($data, 'homepage_visible', true);
        $images = $this->contentImages($request, 'public-events', [], $data['image_path'] ?? null);

        $event = $this->saveModel(new PublicEvent(), [
            'scope' => $scope,
            'title' => $data['title'],
            'name' => $data['name'] ?? $data['title'],
            'venue' => $data['venue'] ?? 'Baguio Convention and Cultural Center',
            'category' => $this->eventCategoryLabel($scope, $data),
            'event_category' => $this->eventCategoryLabel($scope, $data),
            'event_date' => $eventDate,
            'starts_at' => $eventDate,
            'date' => $eventDate,
            'event_date_to' => $eventDateTo,
            'event_time' => $data['event_time'] ?? null,
            'description' => $data['description'] ?? '',
            'note' => $data['note'] ?? null,
            'external_url' => $this->sanitizeHttpsUrl($data['external_url'] ?? null),
            'is_highlighted' => (bool) ($data['is_highlighted'] ?? false),
            'homepage_visible' => $isVisible,
            'is_public' => $this->booleanInput($data, 'is_public', $isVisible),
            'is_active' => $isVisible,
            'active' => $isVisible,
            'images' => $images,
            'image_path' => $this->firstImage($images),
            'image_url' => $this->firstImage($images),
            'sort_order' => $data['sort_order'] ?? ((PublicEvent::query()->max('sort_order') ?? 0) + 1),
        ]);

        return response()->json([
            'message' => 'Event created successfully.',
            'item' => $this->eventRow($event->fresh()),
            'content' => $this->contentManagerPayload(),
        ]);
    }

    public function updateEvent(Request $request, PublicEvent $publicEvent): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'scope' => ['nullable', Rule::in(['bccc', 'city'])],
            'category' => ['nullable', 'string', 'max:255'],
            'event_category' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'venue' => ['nullable', 'string', 'max:255'],
            'event_date' => ['nullable', 'date'],
            'starts_at' => ['nullable', 'date'],
            'date' => ['nullable', 'date'],
            'event_date_to' => ['nullable', 'date'],
            'dateEnd' => ['nullable', 'date'],
            'event_time' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
            'external_url' => ['nullable', 'string', 'max:2000'],
            'homepage_visible' => ['nullable', 'boolean'],
            'is_public' => ['nullable', 'boolean'],
            'is_highlighted' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'image_path' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'max:8192'],
            'images.*' => ['nullable', 'image', 'max:8192'],
        ]);

        $scope = $this->eventScope($data, $publicEvent->scope ?? 'bccc');
        $eventDate = $this->firstValue($data, ['event_date', 'starts_at', 'date'], optional($publicEvent->event_date)->format('Y-m-d') ?: now()->toDateString());
        $eventDateTo = $this->firstValue($data, ['event_date_to', 'dateEnd'], $eventDate);
        $existingImages = is_array($publicEvent->images) ? $publicEvent->images : [];
        $images = $this->contentImages($request, 'public-events', $existingImages, $data['image_path'] ?? null);
        $isVisible = $this->booleanInput($data, 'homepage_visible', true);

        $event = $this->saveModel($publicEvent, [
            'scope' => $scope,
            'title' => $data['title'],
            'name' => $data['name'] ?? $data['title'],
            'venue' => $data['venue'] ?? $publicEvent->venue ?? 'Baguio Convention and Cultural Center',
            'category' => $this->eventCategoryLabel($scope, $data),
            'event_category' => $this->eventCategoryLabel($scope, $data),
            'event_date' => $eventDate,
            'starts_at' => $eventDate,
            'date' => $eventDate,
            'event_date_to' => $eventDateTo,
            'event_time' => $data['event_time'] ?? $publicEvent->event_time,
            'description' => $data['description'] ?? '',
            'note' => $data['note'] ?? null,
            'external_url' => $this->sanitizeHttpsUrl($data['external_url'] ?? null),
            'is_highlighted' => (bool) ($data['is_highlighted'] ?? false),
            'homepage_visible' => $isVisible,
            'is_public' => $this->booleanInput($data, 'is_public', $isVisible),
            'is_active' => $isVisible,
            'active' => $isVisible,
            'images' => $images,
            'image_path' => $this->firstImage($images),
            'image_url' => $this->firstImage($images),
            'sort_order' => $data['sort_order'] ?? $publicEvent->sort_order,
        ]);

        return response()->json([
            'message' => 'Event updated successfully.',
            'item' => $this->eventRow($event->fresh()),
            'content' => $this->contentManagerPayload(),
        ]);
    }

    public function destroyEvent(Request $request, PublicEvent $publicEvent): JsonResponse
    {
        $this->ensureAdmin($request);

        $this->deleteManyImages(is_array($publicEvent->images) ? $publicEvent->images : []);
        $id = $publicEvent->id;
        $publicEvent->delete();

        return response()->json([
            'message' => 'Event deleted successfully.',
            'id' => $id,
            'content' => $this->contentManagerPayload(),
        ]);
    }

    public function storePackage(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'price_label' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'external_url' => ['nullable', 'string', 'max:2000'],
            'homepage_visible' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'image_path' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'max:8192'],
            'images.*' => ['nullable', 'image', 'max:8192'],
        ]);

        $isVisible = $this->booleanInput($data, 'homepage_visible', true);
        $images = $this->contentImages($request, 'feature-packages', [], $data['image_path'] ?? null);

        $package = $this->saveModel(new FeaturePackage(), [
            'title' => $data['title'],
            'name' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'price_label' => $data['price_label'] ?? null,
            'description' => $data['description'] ?? '',
            'external_url' => $this->sanitizeHttpsUrl($data['external_url'] ?? null),
            'homepage_visible' => $isVisible,
            'is_active' => $isVisible,
            'active' => $isVisible,
            'images' => $images,
            'image_path' => $this->firstImage($images),
            'image_url' => $this->firstImage($images),
            'sort_order' => $data['sort_order'] ?? ((FeaturePackage::query()->max('sort_order') ?? 0) + 1),
        ]);

        return response()->json([
            'message' => 'Package created successfully.',
            'item' => $this->packageRow($package->fresh()),
            'content' => $this->contentManagerPayload(),
        ]);
    }

    public function updatePackage(Request $request, FeaturePackage $featurePackage): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'price_label' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'external_url' => ['nullable', 'string', 'max:2000'],
            'homepage_visible' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'image_path' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'max:8192'],
            'images.*' => ['nullable', 'image', 'max:8192'],
        ]);

        $isVisible = $this->booleanInput($data, 'homepage_visible', true);
        $existingImages = is_array($featurePackage->images) ? $featurePackage->images : [];
        $images = $this->contentImages($request, 'feature-packages', $existingImages, $data['image_path'] ?? null);

        $package = $this->saveModel($featurePackage, [
            'title' => $data['title'],
            'name' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'price_label' => $data['price_label'] ?? null,
            'description' => $data['description'] ?? '',
            'external_url' => $this->sanitizeHttpsUrl($data['external_url'] ?? null),
            'homepage_visible' => $isVisible,
            'is_active' => $isVisible,
            'active' => $isVisible,
            'images' => $images,
            'image_path' => $this->firstImage($images),
            'image_url' => $this->firstImage($images),
            'sort_order' => $data['sort_order'] ?? $featurePackage->sort_order,
        ]);

        return response()->json([
            'message' => 'Package updated successfully.',
            'item' => $this->packageRow($package->fresh()),
            'content' => $this->contentManagerPayload(),
        ]);
    }

    public function destroyPackage(Request $request, FeaturePackage $featurePackage): JsonResponse
    {
        $this->ensureAdmin($request);

        $this->deleteManyImages(is_array($featurePackage->images) ? $featurePackage->images : []);
        $id = $featurePackage->id;
        $featurePackage->delete();

        return response()->json([
            'message' => 'Package deleted successfully.',
            'id' => $id,
            'content' => $this->contentManagerPayload(),
        ]);
    }

    public function storeSpace(Request $request): JsonResponse
{
    $this->ensureAdmin($request);

    $data = $request->validate([
        'title' => ['nullable', 'string', 'max:255'],
        'name' => ['nullable', 'string', 'max:255'],
        'category' => ['nullable', 'string', 'max:255'],
        'subtitle' => ['nullable', 'string', 'max:255'],
        'capacity' => ['nullable', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
        'short_description' => ['nullable', 'string'],
        'summary' => ['nullable', 'string'],
        'details_text' => ['nullable', 'string'],
        'homepage_visible' => ['nullable', 'boolean'],
        'sort_order' => ['nullable', 'integer'],
        'image_path' => ['nullable', 'string', 'max:2000'],
        'image' => ['nullable', 'image', 'max:8192'],
        'light_image' => ['nullable', 'image', 'max:8192'],
        'dark_image' => ['nullable', 'image', 'max:8192'],
    ]);

    $title = $data['title'] ?? $data['name'] ?? null;

    if (! $title) {
        abort(422, 'Facility name is required.');
    }

    $uploadedImage = $this->storeFirstAvailableImage($request, ['image', 'light_image'], PublicImagePath::VENUE_SPACES);
    $manualImage = $this->nullableTrim($data['image_path'] ?? null);
    $manualImage = $manualImage ? PublicImagePath::url($manualImage) : null;

    $image = $uploadedImage ?: $manualImage;
    $darkImage = $this->storeSingleImage($request, 'dark_image', PublicImagePath::VENUE_SPACES) ?: $image;
    $isVisible = $this->booleanInput($data, 'homepage_visible', true);

    $space = $this->saveModel(new VenueSpace(), [
        'title' => $title,
        'name' => $title,
        'category' => $data['category'] ?? 'Facility',
        'subtitle' => $data['subtitle'] ?? null,
        'capacity' => $data['capacity'] ?? null,
        'short_description' => $data['short_description'] ?? $data['description'] ?? $data['subtitle'] ?? '',
        'summary' => $data['summary'] ?? $data['description'] ?? $data['short_description'] ?? '',
        'description' => $data['description'] ?? $data['summary'] ?? $data['short_description'] ?? '',
        'details' => $this->detailsTextToArray($data['details_text'] ?? null),
        'light_image' => $image,
        'dark_image' => $darkImage,
        'image_path' => $image,
        'image_url' => $image,
        'homepage_visible' => $isVisible,
        'is_active' => $isVisible,
        'active' => $isVisible,
        'sort_order' => $data['sort_order'] ?? ((VenueSpace::query()->max('sort_order') ?? 0) + 1),
    ]);

    return response()->json([
        'message' => 'Venue space created successfully.',
        'item' => $this->spaceRow($space->fresh()),
        'content' => $this->contentManagerPayload(),
    ]);
}

    public function updateSpace(Request $request, VenueSpace $venueSpace): JsonResponse
{
    $this->ensureAdmin($request);

    $data = $request->validate([
        'title' => ['nullable', 'string', 'max:255'],
        'name' => ['nullable', 'string', 'max:255'],
        'category' => ['nullable', 'string', 'max:255'],
        'subtitle' => ['nullable', 'string', 'max:255'],
        'capacity' => ['nullable', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
        'short_description' => ['nullable', 'string'],
        'summary' => ['nullable', 'string'],
        'details_text' => ['nullable', 'string'],
        'homepage_visible' => ['nullable', 'boolean'],
        'sort_order' => ['nullable', 'integer'],
        'image_path' => ['nullable', 'string', 'max:2000'],
        'image' => ['nullable', 'image', 'max:8192'],
        'light_image' => ['nullable', 'image', 'max:8192'],
        'dark_image' => ['nullable', 'image', 'max:8192'],
    ]);

    $title = $data['title'] ?? $data['name'] ?? $venueSpace->title;

    $existingLight = $venueSpace->light_image ?: ($venueSpace->image_path ?? '');
    $existingDark = $venueSpace->dark_image ?: $existingLight;

    $uploadedImage = $this->storeFirstAvailableImage($request, ['image', 'light_image'], PublicImagePath::VENUE_SPACES);
    $manualImage = $this->nullableTrim($data['image_path'] ?? null);
    $manualImage = $manualImage ? PublicImagePath::url($manualImage) : null;

    $image = $uploadedImage ?: $manualImage ?: PublicImagePath::url($existingLight);

    if ($uploadedImage && $existingLight && PublicImagePath::relative($existingLight) !== PublicImagePath::relative($existingDark)) {
        $this->deleteSingleImage($existingLight);
    }

    $darkImage = $request->hasFile('dark_image')
        ? $this->replaceSingleImage($request, 'dark_image', PublicImagePath::VENUE_SPACES, $existingDark)
        : ($existingDark && PublicImagePath::relative($existingDark) !== PublicImagePath::relative($existingLight)
            ? PublicImagePath::url($existingDark)
            : $image);

    $isVisible = $this->booleanInput($data, 'homepage_visible', true);

    $space = $this->saveModel($venueSpace, [
        'title' => $title,
        'name' => $title,
        'category' => $data['category'] ?? $venueSpace->category ?? 'Facility',
        'subtitle' => $data['subtitle'] ?? null,
        'capacity' => $data['capacity'] ?? null,
        'short_description' => $data['short_description'] ?? $data['description'] ?? $data['subtitle'] ?? '',
        'summary' => $data['summary'] ?? $data['description'] ?? $data['short_description'] ?? '',
        'description' => $data['description'] ?? $data['summary'] ?? $data['short_description'] ?? '',
        'details' => $this->detailsTextToArray($data['details_text'] ?? null),
        'light_image' => $image,
        'dark_image' => $darkImage,
        'image_path' => $image,
        'image_url' => $image,
        'homepage_visible' => $isVisible,
        'is_active' => $isVisible,
        'active' => $isVisible,
        'sort_order' => $data['sort_order'] ?? $venueSpace->sort_order,
    ]);

    return response()->json([
        'message' => 'Venue space updated successfully.',
        'item' => $this->spaceRow($space->fresh()),
        'content' => $this->contentManagerPayload(),
    ]);
}

    public function destroySpace(Request $request, VenueSpace $venueSpace): JsonResponse
    {
        $this->ensureAdmin($request);

        $this->deleteSingleImage($venueSpace->light_image);
        $this->deleteSingleImage($venueSpace->dark_image);

        $id = $venueSpace->id;
        $venueSpace->delete();

        return response()->json([
            'message' => 'Venue space deleted successfully.',
            'id' => $id,
            'content' => $this->contentManagerPayload(),
        ]);
    }

    public function storeStat(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'value' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'homepage_visible' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $isVisible = $this->booleanInput($data, 'homepage_visible', true);

        $stat = $this->saveModel(new HomepageStat(), [
            'label' => $data['label'],
            'title' => $data['title'] ?? $data['label'],
            'value' => $data['value'],
            'suffix' => $data['suffix'] ?? null,
            'description' => $data['description'] ?? '',
            'homepage_visible' => $isVisible,
            'is_active' => $isVisible,
            'active' => $isVisible,
            'sort_order' => $data['sort_order'] ?? ((HomepageStat::query()->max('sort_order') ?? 0) + 1),
        ]);

        return response()->json([
            'message' => 'Homepage stat created successfully.',
            'item' => $this->statRow($stat->fresh()),
            'content' => $this->contentManagerPayload(),
        ]);
    }

    public function updateStat(Request $request, HomepageStat $homepageStat): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'value' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'homepage_visible' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $isVisible = $this->booleanInput($data, 'homepage_visible', true);

        $stat = $this->saveModel($homepageStat, [
            'label' => $data['label'],
            'title' => $data['title'] ?? $data['label'],
            'value' => $data['value'],
            'suffix' => $data['suffix'] ?? null,
            'description' => $data['description'] ?? '',
            'homepage_visible' => $isVisible,
            'is_active' => $isVisible,
            'active' => $isVisible,
            'sort_order' => $data['sort_order'] ?? $homepageStat->sort_order,
        ]);

        return response()->json([
            'message' => 'Homepage stat updated successfully.',
            'item' => $this->statRow($stat->fresh()),
            'content' => $this->contentManagerPayload(),
        ]);
    }

    public function destroyStat(Request $request, HomepageStat $homepageStat): JsonResponse
    {
        $this->ensureAdmin($request);

        $id = $homepageStat->id;
        $homepageStat->delete();

        return response()->json([
            'message' => 'Homepage stat deleted successfully.',
            'id' => $id,
            'content' => $this->contentManagerPayload(),
        ]);
    }

public function storeTourismMember(Request $request): JsonResponse
{
    $this->ensureAdmin($request);

    $data = $request->validate([
        'full_name' => ['required', 'string', 'max:255'],
        'designation' => ['required', 'string', 'max:255'],
        'office_section' => ['nullable', 'string', 'max:255'],
        'unit_name' => ['nullable', 'string', 'max:255'],
        'team_label' => ['nullable', 'string', 'max:255'],
        'reports_to_name' => ['nullable', 'string', 'max:255'],
        'tree_level' => ['nullable', 'integer', 'min:1', 'max:6'],
        'email' => ['nullable', 'email', 'max:255'],
        'phone' => ['nullable', 'string', 'max:255'],
        'short_bio' => ['nullable', 'string'],
        'details_text' => ['nullable', 'string'],
        'is_active' => ['nullable', 'boolean'],
        'active' => ['nullable', 'boolean'],
        'is_featured' => ['nullable', 'boolean'],
        'featured' => ['nullable', 'boolean'],
        'sort_order' => ['nullable', 'integer'],
        'photo' => ['nullable', 'image', 'max:8192'],
    ]);

    $isActive = $this->booleanInput($data, 'is_active', $this->booleanInput($data, 'active', true));
    $isFeatured = $this->booleanInput($data, 'is_featured', $this->booleanInput($data, 'featured', false));

    $photo = $this->storeSingleImage($request, 'photo', PublicImagePath::TOURISM_MEMBERS);

    $member = $this->saveModel(new TourismMember(), [
        'full_name' => $data['full_name'],
        'name' => $data['full_name'],
        'designation' => $data['designation'],
        'position' => $data['designation'],
        'role' => $data['designation'],
        'office_section' => $data['office_section'] ?? null,
        'unit_name' => $data['unit_name'] ?? null,
        'team_label' => $data['team_label'] ?? null,
        'reports_to_name' => $data['reports_to_name'] ?? null,
        'tree_level' => array_key_exists('tree_level', $data) ? (int) $data['tree_level'] : 1,
        'email' => $data['email'] ?? null,
        'phone' => $data['phone'] ?? null,
        'short_bio' => $data['short_bio'] ?? null,
        'bio' => $data['short_bio'] ?? null,
        'description' => $data['short_bio'] ?? null,
        'details' => $this->detailsTextToArray($data['details_text'] ?? null),
        'photo_path' => $photo,
        'photo' => $photo,
        'image_path' => $photo,
        'image_url' => $photo,
        'is_active' => $isActive,
        'active' => $isActive,
        'is_featured' => $isFeatured,
        'featured' => $isFeatured,
        'sort_order' => $data['sort_order'] ?? ((TourismMember::query()->max('sort_order') ?? 0) + 1),
    ]);

    return response()->json([
        'message' => 'Tourism member profile created successfully.',
        'item' => $this->memberRow($member->fresh()),
        'content' => $this->contentManagerPayload(),
    ]);
}

public function updateTourismMember(Request $request, TourismMember $tourismMember): JsonResponse
{
    $this->ensureAdmin($request);

    $data = $request->validate([
        'full_name' => ['required', 'string', 'max:255'],
        'designation' => ['required', 'string', 'max:255'],
        'office_section' => ['nullable', 'string', 'max:255'],
        'unit_name' => ['nullable', 'string', 'max:255'],
        'team_label' => ['nullable', 'string', 'max:255'],
        'reports_to_name' => ['nullable', 'string', 'max:255'],
        'tree_level' => ['nullable', 'integer', 'min:1', 'max:6'],
        'email' => ['nullable', 'email', 'max:255'],
        'phone' => ['nullable', 'string', 'max:255'],
        'short_bio' => ['nullable', 'string'],
        'details_text' => ['nullable', 'string'],
        'is_active' => ['nullable', 'boolean'],
        'active' => ['nullable', 'boolean'],
        'is_featured' => ['nullable', 'boolean'],
        'featured' => ['nullable', 'boolean'],
        'sort_order' => ['nullable', 'integer'],
        'photo' => ['nullable', 'image', 'max:8192'],
    ]);

    $photo = $request->hasFile('photo')
        ? $this->replaceSingleImage($request, 'photo', PublicImagePath::TOURISM_MEMBERS, $tourismMember->photo_path)
        : PublicImagePath::url($tourismMember->photo_path);

    $isActive = $this->booleanInput($data, 'is_active', $this->booleanInput($data, 'active', true));
    $isFeatured = $this->booleanInput($data, 'is_featured', $this->booleanInput($data, 'featured', false));

    $member = $this->saveModel($tourismMember, [
        'full_name' => $data['full_name'],
        'name' => $data['full_name'],
        'designation' => $data['designation'],
        'position' => $data['designation'],
        'role' => $data['designation'],
        'office_section' => $data['office_section'] ?? null,
        'unit_name' => $data['unit_name'] ?? null,
        'team_label' => $data['team_label'] ?? null,
        'reports_to_name' => $data['reports_to_name'] ?? null,
        'tree_level' => array_key_exists('tree_level', $data) ? (int) $data['tree_level'] : 1,
        'email' => $data['email'] ?? null,
        'phone' => $data['phone'] ?? null,
        'short_bio' => $data['short_bio'] ?? null,
        'bio' => $data['short_bio'] ?? null,
        'description' => $data['short_bio'] ?? null,
        'details' => $this->detailsTextToArray($data['details_text'] ?? null),
        'photo_path' => $photo,
        'photo' => $photo,
        'image_path' => $photo,
        'image_url' => $photo,
        'is_active' => $isActive,
        'active' => $isActive,
        'is_featured' => $isFeatured,
        'featured' => $isFeatured,
        'sort_order' => $data['sort_order'] ?? $tourismMember->sort_order,
    ]);

    return response()->json([
        'message' => 'Tourism member profile updated successfully.',
        'item' => $this->memberRow($member->fresh()),
        'content' => $this->contentManagerPayload(),
    ]);
}

    public function destroyTourismMember(Request $request, TourismMember $tourismMember): JsonResponse
    {
        $this->ensureAdmin($request);

        $this->deleteSingleImage($tourismMember->photo_path);
        $id = $tourismMember->id;
        $tourismMember->delete();

        return response()->json([
            'message' => 'Tourism member profile deleted successfully.',
            'id' => $id,
            'content' => $this->contentManagerPayload(),
        ]);
    }

    public function updateSiteSettings(Request $request): JsonResponse|RedirectResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'map_embed_url' => ['nullable', 'string', 'max:2000'],
            'open_map_url' => ['nullable', 'string', 'max:2000'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'visita_url' => ['nullable', 'string', 'max:2000'],
            'creative_baguio_url' => ['nullable', 'string', 'max:2000'],
            'footer_description' => ['nullable', 'string'],
            'footer_copyright' => ['nullable', 'string', 'max:255'],
        ]);

        $settings = SiteSetting::query()->firstOrCreate([]);

        $settings = $this->saveModel($settings, [
            'map_embed_url' => $this->sanitizeMapEmbedUrl($data['map_embed_url'] ?? null),
            'open_map_url' => $this->sanitizeHttpsUrl($data['open_map_url'] ?? null),
            'address' => $this->nullableTrim($data['address'] ?? null),
            'phone' => $this->nullableTrim($data['phone'] ?? null),
            'email' => $this->nullableTrim($data['email'] ?? null),
            'visita_url' => $this->sanitizeHttpsUrl($data['visita_url'] ?? null),
            'creative_baguio_url' => $this->sanitizeHttpsUrl($data['creative_baguio_url'] ?? null),
            'footer_description' => $this->nullableTrim($data['footer_description'] ?? null),
            'footer_copyright' => $this->nullableTrim($data['footer_copyright'] ?? null),
        ]);

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'message' => 'Site settings updated successfully.',
                'item' => $this->siteSettingsPayload(),
                'content' => $this->contentManagerPayload(),
            ]);
        }

        return back()->with('success', 'Site settings updated successfully.');
    }

    protected function venueAreaOptions(): Collection
    {
        $preferred = collect([
            'Full Hall',
            'Main Hall',
            'LED Wall',
            'VIP Lounge',
            'Board Room',
        ]);

        $fromSpaces = VenueSpace::query()
            ->orderBy('sort_order')
            ->pluck('title')
            ->map(fn ($value) => trim((string) $value))
            ->filter();

        $fromServices = Service::query()
            ->with('serviceType')
            ->orderBy('name')
            ->get()
            ->map(function (Service $service) {
                $label = trim((string) ($service->serviceType?->name ?: $service->name));
                $label = preg_replace('/\s*\((AM|PM|EVE|DAY|WHOLE DAY|HALF DAY).*$/i', '', $label) ?: $label;
                $label = preg_replace('/\s+-\s+(AM|PM|EVE|DAY|WHOLE DAY|HALF DAY).*$/i', '', $label) ?: $label;

                return trim($label);
            })
            ->filter();

        return $preferred
            ->merge($fromSpaces)
            ->merge($fromServices)
            ->reject(fn ($value) => in_array(strtolower((string) $value), [
                'foyer & lobby area',
                'foyer & lobby',
                'lobby/foyer',
                'backstage',
                'basement',
                'gallery2600',
                'gallery 2600',
                'grounds/parking area',
                'grounds & parking',
                'grounds and parking',
            ], true))
            ->unique(fn ($value) => strtolower((string) $value))
            ->values();
    }

    protected function eventsPayload(string $scope): Collection
    {
        return PublicEvent::query()
            ->where('scope', $scope)
            ->orderBy('sort_order')
            ->orderBy('event_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (PublicEvent $event) => $this->eventRow($event))
            ->values();
    }

    protected function packagesPayload(): Collection
    {
        return FeaturePackage::query()
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (FeaturePackage $package) => $this->packageRow($package))
            ->values();
    }

    protected function calendarBlocksPayload(): Collection
    {
        return \App\Models\CalendarBlock::query()
            ->orderByDesc('date_from')
            ->orderByDesc('id')
            ->get()
            ->map(fn (\App\Models\CalendarBlock $block) => [
                'id' => $block->id,
                'title' => $block->title,
                'area' => $block->area ?? '',
                'block' => $block->block,
                'dateFrom' => $this->normalizeAdminCalendarStartDate($block->date_from),
                'dateTo' => $this->normalizeAdminCalendarEndDate($block->date_from, $block->date_to),
                'note' => $block->notes ?? '',
                'statusColor' => $block->public_status ?? 'red',
            ])
            ->values();
    }

    protected function normalizeAdminCalendarStartDate(mixed $value): string
    {
        try {
            return \Carbon\Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable) {
            return substr((string) $value, 0, 10);
        }
    }

    protected function normalizeAdminCalendarEndDate(mixed $fromValue, mixed $toValue): string
    {
        try {
            $from = \Carbon\Carbon::parse($fromValue);
            $to = \Carbon\Carbon::parse($toValue);

            if (
                $to->format('H:i') === '00:00'
                && $to->copy()->startOfDay()->equalTo($from->copy()->startOfDay()->addDay())
            ) {
                return $from->format('Y-m-d');
            }

            return $to->format('Y-m-d');
        } catch (\Throwable) {
            return substr((string) $toValue, 0, 10);
        }
    }

    protected function spacesPayload(): Collection
    {
        return VenueSpace::query()
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (VenueSpace $space) => $this->spaceRow($space))
            ->values();
    }

    protected function statsPayload(): Collection
    {
        return HomepageStat::query()
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (HomepageStat $stat) => $this->statRow($stat))
            ->values();
    }

    protected function membersPayload(): Collection
    {
        return TourismMember::query()
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->orderBy('full_name')
            ->get()
            ->map(fn (TourismMember $member) => $this->memberRow($member))
            ->values();
    }

    protected function siteSettingsPayload(): array
    {
        $settings = SiteSetting::query()->first();

        return [
            'map_embed_url' => $settings?->map_embed_url ?? '',
            'mapEmbedUrl' => $settings?->map_embed_url ?? '',
            'open_map_url' => $settings?->open_map_url ?? '',
            'openMapUrl' => $settings?->open_map_url ?? '',
            'address' => $settings?->address ?? '',
            'phone' => $settings?->phone ?? '',
            'email' => $settings?->email ?? '',
            'visita_url' => $settings?->visita_url ?? '',
            'visitaUrl' => $settings?->visita_url ?? '',
            'creative_baguio_url' => $settings?->creative_baguio_url ?? '',
            'creativeBaguioUrl' => $settings?->creative_baguio_url ?? '',
            'arts_url' => $settings?->creative_baguio_url ?? '',
            'artsUrl' => $settings?->creative_baguio_url ?? '',
            'footer_description' => $settings?->footer_description ?? '',
            'footerDescription' => $settings?->footer_description ?? '',
            'footer_copyright' => $settings?->footer_copyright ?? '',
            'footerCopyright' => $settings?->footer_copyright ?? '',
        ];
    }

    protected function eventRow(PublicEvent $event): array
    {
        $start = $event->event_date?->copy();
        $end = $event->event_date_to?->copy() ?: $start?->copy();
        $date = $start?->format('Y-m-d') ?? '';
        $dateEnd = $end?->format('Y-m-d') ?? $date;
        $durationDays = ($start && $end) ? $start->diffInDays($end) + 1 : 1;
        $images = is_array($event->images) ? array_values(array_map(fn ($path) => PublicImagePath::url((string) $path), $event->images)) : [];
        $image = $this->firstImage($images);
        $category = $event->scope === 'city' ? 'Baguio City Event' : 'BCCC Event';
        $visible = (bool) ($event->is_public ?? $event->homepage_visible ?? true);

        return [
            'id' => $event->id,
            'title' => $event->title,
            'name' => $event->title,
            'label' => $event->title,
            'venue' => $event->venue ?? '',
            'category' => $category,
            'event_category' => $category,
            'date' => $date,
            'event_date' => $date,
            'starts_at' => $date,
            'startsAt' => $date,
            'dateEnd' => $dateEnd,
            'event_date_to' => $dateEnd,
            'durationDays' => $durationDays,
            'time' => $event->event_time ?? '',
            'event_time' => $event->event_time ?? '',
            'description' => $event->description ?? '',
            'note' => $event->note ?? '',
            'external_url' => $event->external_url ?? '',
            'externalUrl' => $event->external_url ?? '',
            'url' => $event->external_url ?? '',
            'href' => $event->external_url ?? '',
            'highlighted' => (bool) $event->is_highlighted,
            'is_highlighted' => (bool) $event->is_highlighted,
            'images' => $images,
            'image' => $image,
            'image_path' => $image,
            'imagePath' => $image,
            'image_url' => $image,
            'imageUrl' => $image,
            'scope' => $event->scope,
            'isPublic' => $visible,
            'is_public' => $visible,
            'homepage_visible' => $visible,
            'homepageVisible' => $visible,
            'is_active' => $visible,
            'active' => $visible,
            'sort_order' => $event->sort_order ?? 999,
            'sortOrder' => $event->sort_order ?? 999,
        ];
    }

    protected function packageRow(FeaturePackage $package): array
    {
        $images = is_array($package->images) ? array_values(array_map(fn ($path) => PublicImagePath::url((string) $path), $package->images)) : [];
        $image = $this->firstImage($images);
        $visible = (bool) ($package->homepage_visible ?? $package->is_active ?? $package->active ?? true);

        return [
            'id' => $package->id,
            'title' => $package->title,
            'name' => $package->title,
            'label' => $package->title,
            'subtitle' => $package->subtitle ?? '',
            'price_label' => $package->price_label ?? '',
            'priceLabel' => $package->price_label ?? '',
            'description' => $package->description ?? '',
            'external_url' => $package->external_url ?? '',
            'externalUrl' => $package->external_url ?? '',
            'images' => $images,
            'image' => $image,
            'image_path' => $image,
            'imagePath' => $image,
            'image_url' => $image,
            'imageUrl' => $image,
            'homepage_visible' => $visible,
            'homepageVisible' => $visible,
            'is_active' => $visible,
            'active' => $visible,
            'sort_order' => $package->sort_order ?? 999,
            'sortOrder' => $package->sort_order ?? 999,
        ];
    }

protected function spaceRow(VenueSpace $space): array
{
    $light = PublicImagePath::url($space->light_image ?: ($space->image_path ?? ''));
    $dark = PublicImagePath::url($space->dark_image ?: $light);
    $image = $light ?: $dark;

    $details = is_array($space->details) ? array_values($space->details) : [];
    $detailsText = collect($details)->filter()->implode("\n");
    $visible = (bool) ($space->homepage_visible ?? $space->is_active ?? $space->active ?? true);

    return [
        'id' => $space->id,
        'title' => $space->title,
        'name' => $space->title,
        'label' => $space->title,
        'category' => $space->category ?? '',
        'subtitle' => $space->subtitle ?? $space->category ?? '',
        'capacity' => $space->capacity ?? '',
        'shortDescription' => $space->short_description ?? '',
        'short_description' => $space->short_description ?? '',
        'summary' => $space->summary ?: $space->short_description,
        'description' => $space->description ?? $space->summary ?? $space->short_description ?? '',
        'details' => $details,
        'details_text' => $detailsText,
        'detailsText' => $detailsText,
        'lightImage' => $light,
        'light_image' => $light,
        'darkImage' => $dark,
        'dark_image' => $dark,
        'image' => $image,
        'image_path' => $image,
        'imagePath' => $image,
        'image_url' => $image,
        'imageUrl' => $image,
        'homepageVisible' => $visible,
        'homepage_visible' => $visible,
        'is_active' => $visible,
        'active' => $visible,
        'sort_order' => $space->sort_order ?? 999,
        'sortOrder' => $space->sort_order ?? 999,
    ];
}

    protected function statRow(HomepageStat $stat): array
    {
        $visible = (bool) ($stat->homepage_visible ?? $stat->is_active ?? $stat->active ?? true);

        return [
            'id' => $stat->id,
            'label' => $stat->label,
            'title' => $stat->label,
            'name' => $stat->label,
            'value' => $stat->value,
            'suffix' => $stat->suffix ?? '',
            'description' => $stat->description ?? '',
            'homepage_visible' => $visible,
            'homepageVisible' => $visible,
            'is_active' => $visible,
            'active' => $visible,
            'sort_order' => $stat->sort_order ?? 999,
            'sortOrder' => $stat->sort_order ?? 999,
        ];
    }

protected function memberRow(TourismMember $member): array
{
    $details = is_array($member->details) ? array_values($member->details) : [];
    $detailsText = collect($details)->filter()->implode("\n");
    $photo = PublicImagePath::url($member->photo_path, '/marketing/images/events/default.png');
    $active = (bool) ($member->is_active ?? $member->active ?? true);
    $featured = (bool) ($member->is_featured ?? $member->featured ?? false);

    return [
        'id' => $member->id,
        'full_name' => $member->full_name,
        'fullName' => $member->full_name,
        'name' => $member->full_name,
        'title' => $member->full_name,
        'designation' => $member->designation,
        'position' => $member->designation,
        'role' => $member->designation,
        'office_section' => $member->office_section ?? '',
        'officeSection' => $member->office_section ?? '',
        'unit_name' => $member->unit_name ?? '',
        'unitName' => $member->unit_name ?? '',
        'team_label' => $member->team_label ?? '',
        'teamLabel' => $member->team_label ?? '',
        'reports_to_name' => $member->reports_to_name ?? '',
        'reportsToName' => $member->reports_to_name ?? '',
        'tree_level' => (int) ($member->tree_level ?? 1),
        'treeLevel' => (int) ($member->tree_level ?? 1),
        'email' => $member->email ?? '',
        'phone' => $member->phone ?? '',
        'short_bio' => $member->short_bio ?? '',
        'shortBio' => $member->short_bio ?? '',
        'bio' => $member->short_bio ?? '',
        'description' => $member->short_bio ?? '',
        'message' => $member->short_bio ?? '',
        'details' => $details,
        'details_text' => $detailsText,
        'detailsText' => $detailsText,
        'photo' => $photo,
        'photo_path' => $photo,
        'photoPath' => $photo,
        'photo_url' => $photo,
        'photoUrl' => $photo,
        'image' => $photo,
        'image_path' => $photo,
        'imagePath' => $photo,
        'image_url' => $photo,
        'imageUrl' => $photo,
        'active' => $active,
        'is_active' => $active,
        'homepage_visible' => $active,
        'homepageVisible' => $active,
        'featured' => $featured,
        'is_featured' => $featured,
        'isFeatured' => $featured,
        'sort_order' => $member->sort_order ?? 999,
        'sortOrder' => $member->sort_order ?? 999,
    ];
}

    protected function saveModel(Model $model, array $payload): Model
    {
        $table = $model->getTable();
        $filtered = [];

        foreach ($payload as $column => $value) {
            if (Schema::hasColumn($table, $column)) {
                $filtered[$column] = $value;
            }
        }

        $model->forceFill($filtered);
        $model->save();

        return $model;
    }

    protected function contentImages(Request $request, string $directory, array $existing = [], ?string $manualPath = null): array
    {
        $manualPath = $this->nullableTrim($manualPath);

        if ($request->hasFile('images') || $request->hasFile('image')) {
            $newPaths = [];

            if ($request->hasFile('images')) {
                $newPaths = array_merge($newPaths, $this->storeManyImages($request, 'images', $directory));
            }

            if ($request->hasFile('image')) {
                $single = $this->storeSingleImage($request, 'image', $directory);

                if ($single) {
                    $newPaths[] = $single;
                }
            }

            if (! empty($newPaths)) {
                $this->deleteManyImages($existing);

                return array_values(array_slice(array_map(fn ($path) => PublicImagePath::url($path), $newPaths), 0, 5));
            }
        }

        if ($manualPath) {
            return [PublicImagePath::url($manualPath)];
        }

        return array_values(array_map(fn ($path) => PublicImagePath::url((string) $path), $existing));
    }

    protected function storeFirstAvailableImage(Request $request, array $fields, string $directory): ?string
    {
        foreach ($fields as $field) {
            if ($request->hasFile($field)) {
                return $this->storeSingleImage($request, $field, $directory);
            }
        }

        return null;
    }

    protected function firstImage(array $images): string
    {
        return (string) ($images[0] ?? '');
    }

    protected function eventScope(array $data, string $fallback = 'bccc'): string
    {
        if (($data['scope'] ?? null) === 'city') {
            return 'city';
        }

        if (($data['scope'] ?? null) === 'bccc') {
            return 'bccc';
        }

        $category = strtolower((string) ($data['category'] ?? $data['event_category'] ?? ''));

        return str_contains($category, 'baguio city') || str_contains($category, 'city event') ? 'city' : $fallback;
    }

    protected function eventCategoryLabel(string $scope, array $data): string
    {
        return $data['category'] ?? $data['event_category'] ?? ($scope === 'city' ? 'Baguio City Event' : 'BCCC Event');
    }

    protected function firstValue(array $data, array $keys, mixed $fallback = null): mixed
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $data) && $data[$key] !== null && $data[$key] !== '') {
                return $data[$key];
            }
        }

        return $fallback;
    }

    protected function booleanInput(array $data, string $key, bool $default = false): bool
    {
        if (! array_key_exists($key, $data)) {
            return $default;
        }

        return filter_var($data[$key], FILTER_VALIDATE_BOOLEAN);
    }

    protected function detailsTextToArray(?string $text): array
    {
        if (! $text) {
            return [];
        }

        return collect(preg_split('/\r\n|\r|\n/', $text))
            ->map(fn (?string $line) => trim((string) $line))
            ->filter()
            ->values()
            ->all();
    }

    protected function ensureAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole(['admin', 'manager'])) {
            abort(403);
        }
    }

protected function storeManyImages(Request $request, string $field, string $directory): array
{
    if (! $request->hasFile($field)) {
        return [];
    }

    $paths = [];

    foreach ((array) $request->file($field) as $file) {
        if (! $file) {
            continue;
        }

        $stored = PublicImagePath::store($file, $directory);

        if ($stored) {
            $paths[] = $stored;
        }
    }

    return array_values($paths);
}

protected function replaceManyImages(Request $request, string $field, string $directory, array $oldPaths): array
{
    $newPaths = $this->storeManyImages($request, $field, $directory);

    if (! empty($newPaths)) {
        $this->deleteManyImages($oldPaths);

        return $newPaths;
    }

    return array_values(array_map(fn ($path) => PublicImagePath::url($path), $oldPaths));
}

protected function deleteManyImages(array $paths): void
{
    foreach ($paths as $path) {
        $this->deleteSingleImage($path);
    }
}

protected function storeSingleImage(Request $request, string $field, string $directory): ?string
{
    if (! $request->hasFile($field)) {
        return null;
    }

    return PublicImagePath::store($request->file($field), $directory);
}

protected function replaceSingleImage(Request $request, string $field, string $directory, ?string $oldPath): ?string
{
    $newPath = $this->storeSingleImage($request, $field, $directory);

    if ($newPath) {
        $this->deleteSingleImage($oldPath);

        return $newPath;
    }

    return $oldPath ? PublicImagePath::url($oldPath) : null;
}

protected function deleteSingleImage(?string $path): void
{
    PublicImagePath::delete($path);
}

    protected function nullableTrim(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
    }

    protected function sanitizeHttpsUrl(?string $value): ?string
    {
        $value = $this->nullableTrim($value);

        if (! $value || ! filter_var($value, FILTER_VALIDATE_URL)) {
            return null;
        }

        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));

        if (! in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        return $value;
    }

    protected function sanitizeMapEmbedUrl(?string $value): ?string
    {
        $value = $this->sanitizeHttpsUrl($value);

        if (! $value) {
            return null;
        }

        $host = strtolower((string) parse_url($value, PHP_URL_HOST));
        $allowedHosts = [
            'www.google.com',
            'google.com',
            'maps.google.com',
            'www.google.com.ph',
            'google.com.ph',
        ];

        return in_array($host, $allowedHosts, true) ? $value : null;
    }
}
