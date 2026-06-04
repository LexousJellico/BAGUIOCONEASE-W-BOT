<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceTypeRequest;
use App\Http\Requests\UpdateServiceTypeRequest;
use App\Http\Resources\ServiceTypeResource;
use App\Models\ServiceType;
use App\Services\Contracts\ServiceTypeServiceInterface;
use App\Services\NotificationService;
use App\Support\WorkspacePage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ServiceTypeController extends Controller
{
    public function __construct(
        private readonly ServiceTypeServiceInterface $serviceTypes,
        private readonly NotificationService $notifications,
    ) {
    }

    public function index(Request $request): Response
    {
        return $this->renderIndex($request);
    }

    public function create(Request $request): Response
    {
        return $this->renderIndex($request, 'create');
    }

    public function store(StoreServiceTypeRequest $request): RedirectResponse
    {
        $serviceType = $this->serviceTypes->create($request->validated());

        if ($request->user()) {
            $this->notifications->serviceTypeCreated($serviceType, $request->user());
        }

        return redirect()
            ->route($this->indexRouteName($request))
            ->with('success', 'Venue area created successfully.');
    }

    public function show(Request $request, ServiceType $serviceType): Response
    {
        return $this->renderIndex($request, 'show', $serviceType);
    }

    public function edit(Request $request, ServiceType $serviceType): Response
    {
        return $this->renderIndex($request, 'edit', $serviceType);
    }

    public function update(UpdateServiceTypeRequest $request, ServiceType $serviceType): RedirectResponse
    {
        $actor = $request->user();
        $original = $serviceType->getOriginal();
        $updated = $this->serviceTypes->update($serviceType, $request->validated());

        $changes = [];
        foreach ($updated->getAttributes() as $field => $newVal) {
            if (! array_key_exists($field, $original)) {
                continue;
            }

            $oldVal = $original[$field];

            if ($oldVal == $newVal) {
                continue;
            }

            $changes[$field] = [$oldVal, $newVal];
        }

        if ($actor) {
            $this->notifications->serviceTypeUpdated($updated, $actor, $changes);
        }

        return redirect()
            ->route($this->indexRouteName($request))
            ->with('success', 'Venue area updated successfully.');
    }

    public function destroy(Request $request, ServiceType $serviceType): RedirectResponse
    {
        if ($request->user()) {
            $this->notifications->serviceTypeDeleted($serviceType, $request->user());
        }

        $this->serviceTypes->delete($serviceType);

        return redirect()
            ->route($this->indexRouteName($request))
            ->with('success', 'Venue area deleted successfully.');
    }

    private function renderIndex(Request $request, string $mode = 'index', ?ServiceType $serviceType = null): Response
    {
        $perPage = max(5, min((int) $request->integer('per_page', 10), 100));
        $search = trim((string) $request->input('q', ''));

        $query = ServiceType::query()
            ->withCount('services')
            ->when(Schema::hasColumn('service_types', 'sort_order'), fn ($builder) => $builder->orderBy('sort_order'))
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($nested) use ($search): void {
                $nested->where('name', 'like', "%{$search}%");

                if (Schema::hasColumn('service_types', 'description')) {
                    $nested->orWhere('description', 'like', "%{$search}%");
                }
            });
        }

        $serviceTypes = $query
            ->paginate($perPage)
            ->withQueryString();

        $selectedServiceType = null;

        if ($serviceType) {
            $serviceType->load('services');
            $selectedServiceType = ServiceTypeResource::make($serviceType)->resolve($request);
        }

        return Inertia::render(WorkspacePage::resolve($request, 'service-types/index'), [
            'workspaceRole' => WorkspacePage::role($request),
            'mode' => $mode,
            'serviceType' => $selectedServiceType,
            'venueArea' => $selectedServiceType,
            'serviceTypes' => ServiceTypeResource::collection($serviceTypes)->response()->getData(true),
            'venueAreas' => ServiceTypeResource::collection($serviceTypes)->response()->getData(true),
            'filters' => [
                'q' => $search,
            ],
        ]);
    }

    private function indexRouteName(Request $request): string
    {
        $roleRoute = WorkspacePage::routeName($request, 'venue-areas.index');

        if (Route::has($roleRoute)) {
            return $roleRoute;
        }

        if (Route::has('service-types.index')) {
            return 'service-types.index';
        }

        return $roleRoute;
    }
}
