<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description ?? null,
            'capacity' => $this->capacity ?? null,
            'min_capacity' => $this->min_capacity ?? null,
            'max_capacity' => $this->max_capacity ?? null,
            'options_note' => $this->options_note ?? null,
            'is_active' => $this->is_active ?? true,
            'sort_order' => $this->sort_order ?? 999,
            'services_count' => $this->services_count ?? $this->whenCounted('services'),
            'rental_options_count' => $this->services_count ?? $this->whenCounted('services'),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            'services' => $this->relationLoaded('services')
                ? ServiceResource::collection($this->services)->resolve($request)
                : [],
        ];
    }
}
