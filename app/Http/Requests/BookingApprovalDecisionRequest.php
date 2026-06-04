<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookingApprovalDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'remarks' => ['nullable', 'string', 'max:3000'],
            'reason' => ['nullable', 'string', 'max:3000'],
            'force_confirm' => ['nullable', 'boolean'],
            'waive_bond' => ['nullable', 'boolean'],
            'bond_waiver_reason' => ['nullable', 'string', 'max:2000'],
            'after_office_hours_day_before' => ['nullable', 'boolean'],
        ];
    }
}
