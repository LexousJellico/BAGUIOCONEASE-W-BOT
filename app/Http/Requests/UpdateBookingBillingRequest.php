<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingBillingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'base_subtotal' => ['nullable', 'numeric', 'min:0'],
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'finalized_total' => ['nullable', 'numeric', 'min:0'],
            'required_down_payment_amount' => ['nullable', 'numeric', 'min:0'],
            'required_bond_amount' => ['nullable', 'numeric', 'min:0'],
            'bond_status' => ['nullable', 'string', 'max:40'],
            'bond_waiver_reason' => ['nullable', 'string', 'max:2000'],
            'billing_notes' => ['nullable', 'string', 'max:5000'],
            'lock_final_computation' => ['nullable', 'boolean'],
        ];
    }
}
