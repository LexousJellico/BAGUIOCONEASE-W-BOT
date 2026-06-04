<?php

namespace App\Http\Requests;

use App\Support\WorkspaceAccess;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkCalendarBlockRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $block = strtoupper(trim((string) $this->input('block', 'DAY')));
        $status = strtolower(trim((string) ($this->input('public_status') ?? $this->input('statusColor') ?? $this->input('status') ?? 'red')));

        $statusMap = [
            'red' => 'red',
            'blocked' => 'red',
            'unavailable' => 'red',
            'maintenance' => 'red',

            'gold' => 'gold',
            'private' => 'gold',
            'reserved' => 'gold',
            'private_booked' => 'gold',

            'blue' => 'blue',
            'public' => 'blue',
            'event' => 'blue',
            'public_booked' => 'blue',
        ];

        $blockMap = [
            'MORNING' => 'AM',
            'AFTERNOON' => 'PM',
            'EVENING' => 'EVE',
            'WHOLE' => 'DAY',
            'WHOLE_DAY' => 'DAY',
            'FULL_DAY' => 'DAY',
            'ALL_DAY' => 'DAY',
        ];

        $block = $blockMap[$block] ?? $block;

        $this->merge([
            'title' => trim((string) $this->input('title', '')),
            'area' => trim((string) $this->input('area', '')),
            'notes' => trim((string) $this->input('notes', '')),
            'block' => $block,
            'public_status' => $statusMap[$status] ?? $status,
            'explode_by_day' => filter_var($this->input('explode_by_day', false), FILTER_VALIDATE_BOOL),
            'exclude_weekends' => filter_var($this->input('exclude_weekends', false), FILTER_VALIDATE_BOOL),
        ]);
    }

    public function authorize(): bool
    {
        return $this->canManageCalendarBlocks();
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'block' => ['required', Rule::in(['AM', 'PM', 'EVE', 'DAY'])],
            'public_status' => ['required', Rule::in(['red', 'gold', 'blue'])],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'explode_by_day' => ['nullable', 'boolean'],
            'exclude_weekends' => ['nullable', 'boolean'],
            'exclude_dates' => ['nullable', 'array'],
            'exclude_dates.*' => ['date'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Calendar block title is required.',
            'block.in' => 'Select AM, PM, EVE, or Whole Day.',
            'public_status.in' => 'Select Blocked, Private, or Public status.',
            'date_from.required' => 'Start date is required.',
            'date_to.required' => 'End date is required.',
            'date_to.after_or_equal' => 'End date must be the same as or later than the start date.',
        ];
    }

    private function canManageCalendarBlocks(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'manager'])) {
            return true;
        }

        if (in_array((string) ($user->role_name ?? $user->role ?? ''), ['admin', 'manager'], true)) {
            return true;
        }

        return in_array(WorkspaceAccess::role($this), ['admin', 'manager'], true);
    }
}
