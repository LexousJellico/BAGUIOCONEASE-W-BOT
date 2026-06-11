<?php

namespace App\Http\Requests;

use App\Models\Service;
use App\Support\ActiveVenueCatalog;
use App\Support\BookingStatusCatalog;
use App\Support\DressingRoomCatalog;
use App\Support\MiceReportCatalog;
use App\Support\VenuePackageCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $payload = [];

        if ($this->has('booking_status')) {
            $payload['booking_status'] = BookingStatusCatalog::normalizeBookingStatus(
                (string) $this->input('booking_status'),
                'pending'
            );
        }

        if ($this->has('payment_status')) {
            $payload['payment_status'] = BookingStatusCatalog::normalizeBookingPaymentStatus(
                (string) $this->input('payment_status'),
                'unpaid'
            );
        }

        if ($this->has('client_contact_number')) {
            $payload['client_contact_number'] = preg_replace('/\D+/', '', (string) $this->input('client_contact_number'));
        }

        if ($this->has('dressing_room_selection')) {
            $payload['dressing_room_selection'] = DressingRoomCatalog::normalize((string) $this->input('dressing_room_selection'));
            $payload['dressing_room_charge'] = DressingRoomCatalog::charge($payload['dressing_room_selection']);
        }

        if ($this->has('private_event_type') || $this->has('type_of_event') || $this->has('event_scope')) {
            $eventScope = $this->input('event_scope') ? (string) $this->input('event_scope') : null;

            $payload['mice_required'] = MiceReportCatalog::requiresMiceReport(
                (string) $this->input('type_of_event'),
                $this->input('private_event_type') ? (string) $this->input('private_event_type') : null,
                $eventScope,
            );

            if (MiceReportCatalog::normalizeEventScope($eventScope) === MiceReportCatalog::EVENT_SCOPE_PRIVATE) {
                $payload['private_event_type'] = $this->input('private_event_type') ?: 'PERSONAL_EVENT';
            }
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'exists:services,id'],
            'items' => ['nullable', 'array'],
            'items.*.service_id' => ['required_with:items', 'exists:services,id'],
            'items.*.quantity' => ['nullable', 'numeric', 'min:1'],
            'payment_meta' => ['nullable', 'array'],
            'mice_payload' => ['nullable', 'array'],
            'booking_draft_key' => ['nullable', 'string', 'max:120'],
            'draft_key' => ['nullable', 'string', 'max:120'],

            'selected_package_code' => ['nullable', 'string', 'max:80'],
            'package_code' => ['nullable', 'string', 'max:80'],
            'selected_area_keys' => ['nullable', 'array'],
            'area_keys' => ['nullable', 'array'],
            'selected_area_keys.*' => ['string', 'max:80'],
            'area_keys.*' => ['string', 'max:80'],
            'dressing_room_selection' => ['nullable', 'string', Rule::in(array_keys(DressingRoomCatalog::options()))],
            'dressing_room_charge' => ['nullable', 'numeric', 'min:0'],
            'mice_required' => ['nullable', 'boolean'],
            'mice_exemption_reason' => ['nullable', 'string', 'max:255'],
            'event_scope' => ['nullable', 'string', 'max:40'],
            'private_event_type' => ['nullable', 'string', 'max:120'],
            'schedule_version' => ['nullable', 'string', 'max:40'],
            'schedule_meta' => ['nullable', 'array'],
            'schedule_segments' => ['nullable', 'array'],
            'schedule_segments.*.date' => ['required_with:schedule_segments', 'date_format:Y-m-d'],
            'schedule_segments.*.segment_role' => ['nullable', 'string', 'max:40'],
            'schedule_segments.*.role' => ['nullable', 'string', 'max:40'],
            'schedule_segments.*.has_ingress_label' => ['nullable', 'boolean'],
            'schedule_segments.*.has_egress_label' => ['nullable', 'boolean'],
            'schedule_segments.*.base_block' => ['required_with:schedule_segments', 'string', 'max:40'],
            'schedule_segments.*.additional_hours' => ['nullable', 'integer', 'min:0', 'max:5'],
            'schedule_segments.*.area_keys' => ['nullable', 'array'],
            'schedule_segments.*.area_keys.*' => ['string', 'max:80'],

            'organization_type' => ['nullable', 'string', 'max:100'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_contact_number' => ['required', 'regex:/^\d{11}$/'],
            'client_email' => ['required', 'email', 'max:255'],

            'client_address' => ['nullable', 'string', 'max:1000'],
            'client_region' => ['nullable', 'string', 'max:255'],
            'client_province' => ['nullable', 'string', 'max:255'],
            'client_city_municipality' => ['nullable', 'string', 'max:255'],
            'client_barangay' => ['nullable', 'string', 'max:255'],
            'client_zip_code' => ['nullable', 'string', 'max:30'],
            'client_street_address' => ['nullable', 'string', 'max:1000'],

            'head_of_organization' => ['nullable', 'string', 'max:255'],
            'type_of_event' => ['required', 'string', 'max:255'],

            'booking_date_from' => ['required', 'date'],
            'booking_date_to' => ['required', 'date', 'after:booking_date_from'],
            'number_of_guests' => ['required', 'integer', 'min:1'],

            'survey_proof_image' => ['nullable', 'image', 'max:5120'],

            'booking_status' => ['nullable', 'string', 'max:100'],
            'payment_status' => ['nullable', 'string', 'max:100'],
            'is_public_calendar_visible' => ['nullable', 'boolean'],
            'public_calendar_title' => ['nullable', 'string', 'max:255'],

            'estimated_usage' => ['nullable', 'string', 'max:100'],
            'estimated_duration_hours' => ['nullable', 'numeric', 'min:0'],
            'estimated_other_rentals' => ['nullable', 'string', 'max:1000'],
            'estimated_additional_charges' => ['nullable', 'numeric', 'min:0'],
            'reservation_notes' => ['nullable', 'string', 'max:3000'],

            'package_acknowledged' => ['nullable', 'boolean'],
            'policy_acknowledged' => ['nullable', 'boolean'],
            'accuracy_acknowledged' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $packageCode = VenuePackageCatalog::normalizeCode(
                $this->input('selected_package_code') ?: $this->input('package_code')
            );

            $submittedAreaKeys = ActiveVenueCatalog::sanitizeKeys(
                $this->input('selected_area_keys') ?: $this->input('area_keys') ?: []
            );

            if ($packageCode && ! VenuePackageCatalog::exists($packageCode) && $submittedAreaKeys === []) {
                $validator->errors()->add(
                    'selected_package_code',
                    'The selected package is not part of the active BCCC booking catalog. Please choose one of the displayed active packages or use manual selection.'
                );
            }

            foreach (['selected_area_keys', 'area_keys'] as $field) {
                $values = $this->input($field, []);
                $unavailable = ActiveVenueCatalog::unavailableKeys($values);
                $combinationError = ActiveVenueCatalog::combinationError($values);

                if ($unavailable !== []) {
                    $validator->errors()->add(
                        $field,
                        'Only Full Hall, Main Hall, LED Wall, Lounge, and Boardroom are available for booking charges.'
                    );
                }

                if ($combinationError) {
                    $validator->errors()->add($field, $combinationError);
                }
            }

            $segments = $this->input('schedule_segments', []);

            if (is_array($segments)) {
                foreach ($segments as $index => $segment) {
                    if (! is_array($segment)) {
                        continue;
                    }

                    $unavailable = ActiveVenueCatalog::unavailableKeys($segment['area_keys'] ?? []);

                    if ($unavailable !== []) {
                        $validator->errors()->add(
                            "schedule_segments.$index.area_keys",
                            'Schedule rows may use only the active BCCC booking areas.'
                        );
                    }

                    $combinationError = ActiveVenueCatalog::combinationError($segment['area_keys'] ?? []);

                    if ($combinationError) {
                        $validator->errors()->add("schedule_segments.$index.area_keys", $combinationError);
                    }

                    $baseBlock = strtolower(str_replace([' ', '-'], '_', (string) ($segment['base_block'] ?? '')));
                    $additionalHours = (int) ($segment['additional_hours'] ?? 0);

                    if (in_array($baseBlock, ['am', 'half_day_am', 'morning'], true) && $additionalHours > 0) {
                        $validator->errors()->add("schedule_segments.$index.additional_hours", 'Additional hours are available only for PM or Whole Day reservations.');
                    }
                }
            }

            $serviceIds = collect($this->input('items', []))
                ->pluck('service_id')
                ->push($this->input('service_id'))
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();

            if ($serviceIds->isEmpty()) {
                return;
            }

            Service::query()
                ->with('serviceType')
                ->whereIn('id', $serviceIds->all())
                ->get()
                ->each(function (Service $service) use ($validator): void {
                    if (! ActiveVenueCatalog::serviceMatchesActiveChoice($service->name, $service->serviceType?->name)) {
                        $validator->errors()->add(
                            'service_id',
                            'One selected service is unavailable for booking charges. Use only Full Hall, Main Hall, LED Wall, Lounge, or Boardroom.'
                        );
                    }
                });
        });
    }
}
