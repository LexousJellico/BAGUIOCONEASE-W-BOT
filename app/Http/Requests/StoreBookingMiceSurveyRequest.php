<?php

namespace App\Http\Requests;

use App\Models\Booking;
use App\Support\MiceReportCatalog;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingMiceSurveyRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $payload = $this->all();
        $booking = $this->route('booking');
        $scope = MiceReportCatalog::normalizeScope($payload['event_scope'] ?? $payload['organizer_type'] ?? null);
        $isPublic = $scope === MiceReportCatalog::EVENT_SCOPE_PUBLIC;

        $eventFrom = $payload['event_date_from'] ?? $payload['event_started_at'] ?? $booking?->booking_date_from ?? now()->toDateString();
        $eventTo = $payload['event_date_to'] ?? $payload['event_finished_at'] ?? $booking?->booking_date_to ?? $eventFrom;

        try {
            $fromDate = Carbon::parse($eventFrom)->startOfDay();
            $toDate = Carbon::parse($eventTo)->startOfDay();
        } catch (\Throwable) {
            $fromDate = now()->startOfDay();
            $toDate = $fromDate->copy();
        }

        foreach ([
            'event_name',
            'organization_name',
            'organizer_organization_name',
            'address',
            'organizer_address',
            'contact_person',
            'organizer_contact_person',
        ] as $field) {
            if (array_key_exists($field, $payload) && is_string($payload[$field])) {
                $payload[$field] = mb_strtoupper(trim($payload[$field]));
            }
        }

        foreach ([
            'type_of_event',
            'event_category',
            'venue_area',
            'organizer_name',
            'organizer_type',
            'classification_of_event',
            'mice_type_of_event',
            'main_origin_country',
            'main_origin_province',
            'main_origin_city',
            'enterprise_group',
            'btc_group_code',
            'comments_feedback',
            'remarks',
        ] as $field) {
            if (array_key_exists($field, $payload) && is_string($payload[$field])) {
                $payload[$field] = trim($payload[$field]);
            }
        }

        if (array_key_exists('email', $payload) && is_string($payload['email'])) {
            $payload['email'] = strtolower(trim($payload['email']));
        }

        foreach (['contact_number', 'organizer_contact_number'] as $field) {
            if (array_key_exists($field, $payload) && is_string($payload[$field])) {
                $payload[$field] = preg_replace('/[^0-9+]/', '', $payload[$field]) ?: null;
            }
        }

        $payload['event_scope'] = $scope;
        $payload['event_center_name'] = MiceReportCatalog::EVENT_CENTER_NAME;
        $payload['event_date_from'] = $fromDate->toDateString();
        $payload['event_date_to'] = $toDate->toDateString();
        $payload['event_started_at'] = $fromDate->toDateString();
        $payload['event_finished_at'] = $toDate->toDateString();
        $payload['covered_month'] = $fromDate->format('F');
        $payload['year_recorded'] = $payload['year_recorded'] ?? $fromDate->year;
        $payload['event_days'] = max(1, $fromDate->diffInDays($toDate) + 1);
        $payload['number_of_hours'] = $this->normalizeHours($payload['number_of_hours'] ?? null, $booking instanceof Booking ? $booking : null);

        if ($isPublic) {
            $payload['function_halls_count'] = MiceReportCatalog::FUNCTION_HALLS_COUNT;
            $payload['function_hall_capacity'] = MiceReportCatalog::FUNCTION_HALL_CAPACITY;
            $payload['classification_of_event'] = mb_strtoupper($payload['classification_of_event'] ?? $payload['event_category'] ?? 'REGIONAL PHILIPPINES');
            $payload['mice_type_of_event'] = mb_strtoupper($payload['mice_type_of_event'] ?? $payload['type_of_event'] ?? 'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS');
            $payload['event_category'] = $payload['classification_of_event'];
            $payload['type_of_event'] = $payload['mice_type_of_event'];
            $payload['foreign_attendees'] = max(0, (int) ($payload['foreign_attendees'] ?? 0));
            $payload['domestic_attendees'] = max(0, (int) ($payload['domestic_attendees'] ?? $payload['total_participants'] ?? 0));
            $payload['total_number_of_countries'] = max(1, (int) ($payload['total_number_of_countries'] ?? 1));
            $payload['has_exhibitions'] = filter_var($payload['has_exhibitions'] ?? false, FILTER_VALIDATE_BOOL);
            $payload['exhibitors_count'] = $payload['has_exhibitions'] ? max(0, (int) ($payload['exhibitors_count'] ?? 0)) : 0;
            $payload['visitors_count'] = $payload['has_exhibitions'] ? max(0, (int) ($payload['visitors_count'] ?? 0)) : 0;
        } else {
            $payload['function_halls_count'] = null;
            $payload['function_hall_capacity'] = null;
            $payload['classification_of_event'] = MiceReportCatalog::privateSkippedTextValue();
            $payload['mice_type_of_event'] = MiceReportCatalog::privateSkippedTextValue();
            $payload['event_category'] = MiceReportCatalog::privateSkippedTextValue();
            $payload['type_of_event'] = $payload['type_of_event'] ?? 'PRIVATE/PERSONAL EVENT';
            $payload['foreign_attendees'] = 0;
            $payload['domestic_attendees'] = 0;
            $payload['total_number_of_countries'] = 0;
            $payload['countries_breakdown'] = [];
            $payload['countries_breakdown_text'] = MiceReportCatalog::privateSkippedTextValue();
            $payload['has_exhibitions'] = false;
            $payload['exhibitors_count'] = 0;
            $payload['visitors_count'] = 0;
        }

        $payload['organizer_organization_name'] = $payload['organizer_organization_name'] ?? $payload['organization_name'] ?? null;
        $payload['organizer_address'] = $payload['organizer_address'] ?? $payload['address'] ?? null;
        $payload['organizer_contact_person'] = $payload['organizer_contact_person'] ?? $payload['contact_person'] ?? null;
        $payload['organizer_contact_number'] = $payload['organizer_contact_number'] ?? $payload['contact_number'] ?? null;
        $payload['comments_feedback'] = filled($payload['comments_feedback'] ?? null) ? $payload['comments_feedback'] : 'N/A';
        $payload['remarks'] = filled($payload['remarks'] ?? null) ? $payload['remarks'] : $payload['comments_feedback'];

        if (! is_array($payload['countries_breakdown'] ?? null)) {
            $payload['countries_breakdown'] = [];
        }

        if ($isPublic) {
            $payload['countries_breakdown_text'] = collect($payload['countries_breakdown'])
                ->map(function ($row) {
                    if (is_array($row)) {
                        $country = trim((string) ($row['country'] ?? ''));
                        $count = max(0, (int) ($row['count'] ?? 0));

                        return $country !== '' ? $country . ($count > 0 ? ' - ' . $count : '') : null;
                    }

                    return trim((string) $row) ?: null;
                })
                ->filter()
                ->implode('; ');
        }

        foreach ([
            'local_male_participants',
            'local_female_participants',
            'domestic_male_participants',
            'domestic_female_participants',
            'foreign_male_participants',
            'foreign_female_participants',
            'same_day_visitors',
            'overnight_visitors',
            'estimated_room_nights',
            'total_employees',
            'female_employees',
            'male_employees',
        ] as $field) {
            $payload[$field] = max(0, (int) ($payload[$field] ?? 0));
        }

        $payload['total_participants'] = max(
            (int) ($payload['total_participants'] ?? 0),
            (int) $payload['domestic_attendees'] + (int) $payload['foreign_attendees'],
            (int) $payload['local_male_participants'] + (int) $payload['local_female_participants'] + (int) $payload['domestic_male_participants'] + (int) $payload['domestic_female_participants'] + (int) $payload['foreign_male_participants'] + (int) $payload['foreign_female_participants']
        );

        if ($payload['total_participants'] <= 0 && filled($this->input('number_of_guests'))) {
            $payload['total_participants'] = max(0, (int) $this->input('number_of_guests'));
        }

        $payload['estimated_tourism_receipts'] = is_numeric($payload['estimated_tourism_receipts'] ?? null)
            ? round((float) $payload['estimated_tourism_receipts'], 2)
            : 0;

        $payload['permit_to_engage'] = filter_var($payload['permit_to_engage'] ?? false, FILTER_VALIDATE_BOOL);
        $payload['dot_accredited'] = filter_var($payload['dot_accredited'] ?? false, FILTER_VALIDATE_BOOL);
        $payload['active_member'] = filter_var($payload['active_member'] ?? false, FILTER_VALIDATE_BOOL);
        $payload['status'] = $this->confirmedBooking($booking instanceof Booking ? $booking : null) ? 'submitted' : 'draft';

        $this->merge($payload);
    }

    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        $scope = MiceReportCatalog::normalizeScope($this->input('event_scope'));
        $isPublic = $scope === MiceReportCatalog::EVENT_SCOPE_PUBLIC;

        return [
            'event_scope' => ['required', Rule::in(array_keys(MiceReportCatalog::eventScopes()))],
            'year_recorded' => ['required', 'integer', 'min:2020', 'max:2100'],
            'enterprise_group' => ['nullable', 'string', 'max:50'],
            'btc_group_code' => ['nullable', 'string', 'max:50'],

            'event_center_name' => ['required', 'string', Rule::in([MiceReportCatalog::EVENT_CENTER_NAME])],
            'function_halls_count' => [$isPublic ? 'required' : 'nullable', 'integer', 'min:1', 'max:1'],
            'function_hall_capacity' => [$isPublic ? 'required' : 'nullable', 'integer', 'min:2000', 'max:2000'],
            'covered_month' => ['required', 'string', Rule::in(MiceReportCatalog::coveredMonths())],

            'event_name' => ['required', 'string', 'max:255'],
            'event_category' => ['required', 'string', 'max:255'],
            'type_of_event' => ['required', 'string', 'max:255'],
            'venue_area' => ['required', 'string', 'max:255'],
            'event_date_from' => ['required', 'date'],
            'event_date_to' => ['required', 'date', 'after_or_equal:event_date_from'],
            'event_started_at' => ['required', 'date'],
            'event_finished_at' => ['required', 'date', 'after_or_equal:event_started_at'],
            'event_days' => ['nullable', 'integer', 'min:1'],
            'number_of_hours' => ['required', 'numeric', 'min:1'],

            'classification_of_event' => [$isPublic ? 'required' : 'nullable', 'string', 'max:255'],
            'mice_type_of_event' => [$isPublic ? 'required' : 'nullable', 'string', 'max:255'],
            'foreign_attendees' => [$isPublic ? 'required' : 'nullable', 'integer', 'min:0'],
            'domestic_attendees' => [$isPublic ? 'required' : 'nullable', 'integer', 'min:0'],
            'total_number_of_countries' => [$isPublic ? 'required' : 'nullable', 'integer', $isPublic ? 'min:1' : 'min:0'],
            'countries_breakdown' => ['nullable', 'array'],
            'countries_breakdown.*.country' => ['nullable', 'string', Rule::in(MiceReportCatalog::countries())],
            'countries_breakdown.*.count' => ['nullable', 'integer', 'min:0'],
            'countries_breakdown_text' => ['nullable', 'string', 'max:2000'],
            'has_exhibitions' => ['nullable', 'boolean'],
            'exhibitors_count' => [$this->boolean('has_exhibitions') && $isPublic ? 'required' : 'nullable', 'integer', 'min:0'],
            'visitors_count' => [$this->boolean('has_exhibitions') && $isPublic ? 'required' : 'nullable', 'integer', 'min:0'],

            'organization_name' => ['required', 'string', 'max:255'],
            'organizer_organization_name' => ['required', 'string', 'max:255'],
            'organizer_name' => ['nullable', 'string', 'max:255'],
            'organizer_type' => ['nullable', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'organizer_contact_person' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'regex:/^\d{11}$/'],
            'organizer_contact_number' => ['nullable', 'regex:/^\d{11}$/'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'organizer_address' => ['required', 'string', 'max:1000'],

            'local_male_participants' => ['nullable', 'integer', 'min:0'],
            'local_female_participants' => ['nullable', 'integer', 'min:0'],
            'domestic_male_participants' => ['nullable', 'integer', 'min:0'],
            'domestic_female_participants' => ['nullable', 'integer', 'min:0'],
            'foreign_male_participants' => ['nullable', 'integer', 'min:0'],
            'foreign_female_participants' => ['nullable', 'integer', 'min:0'],
            'total_participants' => ['required', 'integer', 'min:1'],

            'main_origin_country' => ['nullable', 'string', 'max:255'],
            'main_origin_province' => ['nullable', 'string', 'max:255'],
            'main_origin_city' => ['nullable', 'string', 'max:255'],
            'same_day_visitors' => ['nullable', 'integer', 'min:0'],
            'overnight_visitors' => ['nullable', 'integer', 'min:0'],
            'estimated_room_nights' => ['nullable', 'integer', 'min:0'],
            'estimated_tourism_receipts' => ['nullable', 'numeric', 'min:0'],
            'total_employees' => ['nullable', 'integer', 'min:0'],
            'female_employees' => ['nullable', 'integer', 'min:0'],
            'male_employees' => ['nullable', 'integer', 'min:0'],
            'permit_to_engage' => ['nullable', 'boolean'],
            'dot_accredited' => ['nullable', 'boolean'],
            'active_member' => ['nullable', 'boolean'],
            'comments_feedback' => ['nullable', 'string', 'max:2000'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'string', 'max:50'],
            'certified' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'event_name.required' => 'Event name is required.',
            'classification_of_event.required' => 'Classification of event is required for public events.',
            'mice_type_of_event.required' => 'Type of event is required for public events.',
            'foreign_attendees.required' => 'Foreign attendee count is required for public events.',
            'domestic_attendees.required' => 'Domestic attendee count is required for public events.',
            'total_participants.min' => 'At least one attendee or participant must be encoded.',
            'organizer_organization_name.required' => 'Name of organization of the organizer is required.',
            'organizer_address.required' => 'Address of the organizer is required.',
            'organizer_contact_person.required' => 'Contact person of the organizer is required.',
            'certified.accepted' => 'Please confirm that you read and agree before submitting the MICE/contact details.',
        ];
    }

    private function normalizeHours(mixed $value, ?Booking $booking): float
    {
        if (is_numeric($value) && (float) $value > 0) {
            return round((float) $value, 2);
        }

        if ($booking) {
            try {
                $booking->loadMissing('scheduleSegments');

                $hours = $booking->scheduleSegments->sum(function ($segment): float {
                    $start = $segment->starts_at ? Carbon::parse($segment->starts_at) : null;
                    $end = $segment->ends_at ? Carbon::parse($segment->ends_at) : null;

                    if (! $start || ! $end) {
                        return 0.0;
                    }

                    return max(0, $start->floatDiffInHours($end));
                });

                if ($hours > 0) {
                    return round($hours, 2);
                }
            } catch (\Throwable) {
                // Fall back to booking date span below.
            }
        }

        $days = 1;

        if ($booking?->booking_date_from) {
            try {
                $from = Carbon::parse($booking->booking_date_from)->startOfDay();
                $to = Carbon::parse($booking->booking_date_to ?: $booking->booking_date_from)->startOfDay();
                $days = max(1, $from->diffInDays($to) + 1);
            } catch (\Throwable) {
                $days = 1;
            }
        }

        return $days * 10.0;
    }

    private function confirmedBooking(?Booking $booking): bool
    {
        $status = strtolower((string) ($booking?->booking_status ?? $booking?->status ?? ''));

        return in_array($status, ['accepted', 'approved', 'confirmed', 'reserved'], true);
    }
}
