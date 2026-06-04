<?php

namespace App\Http\Controllers;

use App\Models\FeaturePackage;
use App\Models\HomepageStat;
use App\Models\PublicEvent;
use App\Models\VenueSpace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminSortController extends Controller
{
    public function events(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'scope' => ['required', Rule::in(['bccc', 'city'])],
            'ordered_ids' => ['required', 'array', 'min:1'],
            'ordered_ids.*' => ['integer'],
        ]);

        $requestedIds = array_values(array_unique(array_map('intval', $data['ordered_ids'])));

        $existingScopeIds = PublicEvent::query()
            ->where('scope', $data['scope'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $unknownIds = array_diff($requestedIds, $existingScopeIds);

        if (! empty($unknownIds)) {
            return response()->json([
                'message' => 'Some events could not be found for the selected scope.',
            ], 422);
        }

        $remainingIds = array_values(array_diff($existingScopeIds, $requestedIds));
        $finalIds = array_values(array_merge($requestedIds, $remainingIds));

        DB::transaction(function () use ($finalIds) {
            foreach ($finalIds as $index => $id) {
                PublicEvent::query()
                    ->whereKey($id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        return response()->json(['ok' => true]);
    }

    public function packages(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->applySort($request, FeaturePackage::class);

        return response()->json(['ok' => true]);
    }

    public function spaces(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->applySort($request, VenueSpace::class);

        return response()->json(['ok' => true]);
    }

    public function stats(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->applySort($request, HomepageStat::class);

        return response()->json(['ok' => true]);
    }

    protected function applySort(Request $request, string $modelClass): void
    {
        $data = $request->validate([
            'ordered_ids' => ['required', 'array', 'min:1'],
            'ordered_ids.*' => ['integer'],
        ]);

        $requestedIds = array_values(array_unique(array_map('intval', $data['ordered_ids'])));

        $existingIds = $modelClass::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $unknownIds = array_diff($requestedIds, $existingIds);

        if (! empty($unknownIds)) {
            abort(422, 'Some sortable items could not be found.');
        }

        $remainingIds = array_values(array_diff($existingIds, $requestedIds));
        $finalIds = array_values(array_merge($requestedIds, $remainingIds));

        DB::transaction(function () use ($finalIds, $modelClass) {
            foreach ($finalIds as $index => $id) {
                $modelClass::query()
                    ->whereKey($id)
                    ->update(['sort_order' => $index + 1]);
            }
        });
    }

    protected function ensureAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole(['admin', 'manager'])) {
            abort(403);
        }
    }
}
