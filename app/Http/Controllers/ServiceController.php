<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Http\Resources\ServiceTypeResource;
use App\Models\Service;
use App\Models\ServiceType;
use App\Services\Contracts\ServiceServiceInterface;
use App\Services\NotificationService;
use App\Support\WorkspacePage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function __construct(
        private readonly ServiceServiceInterface $services,
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

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $service = $this->services->create($request->validated());

        if ($request->user()) {
            $this->notifications->serviceCreated($service, $request->user());
        }

        return redirect()
            ->route($this->indexRouteName($request))
            ->with('success', 'Rental option created successfully.');
    }

    public function show(Request $request, Service $service): Response
    {
        return $this->renderIndex($request, 'show', $service);
    }

    public function edit(Request $request, Service $service): Response
    {
        return $this->renderIndex($request, 'edit', $service);
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $actor = $request->user();
        $original = $service->getOriginal();
        $updated = $this->services->update($service, $request->validated());

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
            $this->notifications->serviceUpdated($updated, $actor, $changes);
        }

        return redirect()
            ->route($this->indexRouteName($request))
            ->with('success', 'Rental option updated successfully.');
    }

    public function destroy(Request $request, Service $service): RedirectResponse
    {
        if ($request->user()) {
            $this->notifications->serviceDeleted($service, $request->user());
        }

        $this->services->delete($service);

        return redirect()
            ->route($this->indexRouteName($request))
            ->with('success', 'Rental option deleted successfully.');
    }

    private function renderIndex(Request $request, string $mode = 'index', ?Service $service = null): Response
    {
        $perPage = max(5, min((int) $request->integer('per_page', 10), 100));
        $search = trim((string) $request->input('q', ''));

        $query = Service::query()
            ->with('serviceType')
            ->orderBy('service_type_id')
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($nested) use ($search): void {
                $nested
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('uom', 'like', "%{$search}%")
                    ->orWhereHas('serviceType', fn ($area) => $area->where('name', 'like', "%{$search}%"));
            });
        }

        $services = $query
            ->paginate($perPage)
            ->withQueryString();

        $serviceTypes = ServiceType::query()
            ->with(['services' => fn ($services) => $services->orderBy('name')])
            ->orderBy('name')
            ->get();

        $selectedService = null;

        if ($service) {
            $service->load('serviceType');
            $selectedService = ServiceResource::make($service)->resolve($request);
        }

        return Inertia::render(WorkspacePage::resolve($request, 'services/index'), [
            'workspaceRole' => WorkspacePage::role($request),
            'mode' => $mode,
            'service' => $selectedService,
            'services' => ServiceResource::collection($services)->response()->getData(true),
            'rentalOptions' => ServiceResource::collection($services)->response()->getData(true),
            'serviceTypes' => ServiceTypeResource::collection($serviceTypes)->resolve($request),
            'venueAreas' => ServiceTypeResource::collection($serviceTypes)->resolve($request),
            'filters' => [
                'q' => $search,
            ],
        ]);
    }

    private function indexRouteName(Request $request): string
    {
        $roleRoute = WorkspacePage::routeName($request, 'rental-options.index');

        if (Route::has($roleRoute)) {
            return $roleRoute;
        }

        if (Route::has('services.index')) {
            return 'services.index';
        }

        return $roleRoute;
    }
}
