<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_type_id' => ['nullable', 'integer', 'exists:service_types,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'uom' => ['required', 'string', 'max:50'],
            'price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'min_guests' => ['nullable', 'integer', 'min:0'],
            'max_guests' => ['nullable', 'integer', 'min:0', 'gte:min_guests'],
            'capacity_note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
