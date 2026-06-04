<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $serviceType = $this->relationLoaded('serviceType') ? $this->serviceType : null;
        $serviceTypeName = $serviceType?->name ?? $this->service_type_name ?? null;

        $minGuests = $this->min_guests ?? null;
        $maxGuests = $this->max_guests ?? null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'uom' => $this->uom,
            'price' => $this->price,
            'quantity' => 1,

            'min_guests' => $minGuests,
            'max_guests' => $maxGuests,
            'capacity_note' => $this->capacity_note ?? null,
            'is_guest_restricted' => $minGuests !== null || $maxGuests !== null,

            'service_type_id' => $this->service_type_id,
            'service_type_name' => $serviceTypeName,
            'service_type' => $serviceType ? [
                'id' => $serviceType->id,
                'name' => $serviceType->name,
            ] : (
                $serviceTypeName ? [
                    'id' => $this->service_type_id,
                    'name' => $serviceTypeName,
                ] : null
            ),

            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
