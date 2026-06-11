<?php

namespace App\Http\Resources;

use App\Models\MiceRecord;
use App\Services\BookingBillingService;
use App\Services\BookingDeadlineService;
use App\Support\VenueAreaCatalog;
use App\Support\WorkspacePage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $items = $this->items();
        $payments = $this->payments($request);
        $lifecycleEvents = $this->lifecycleEvents();

        $creator = $this->relationLoaded('createdBy') ? $this->createdBy : null;
        $service = $this->relationLoaded('service') ? $this->service : null;
        $serviceType = $service?->relationLoaded('serviceType') ? $service?->serviceType : null;

        $currentUserView = null;
        $isUnviewedForCurrentUser = null;

        if ($request->user() && $this->relationLoaded('views')) {
            $currentUserView = $this->views->first();
            $isUnviewedForCurrentUser = $currentUserView === null;

            $trackingStartedAt = $request->user()->bookings_view_tracking_started_at ?? null;

            if ($trackingStartedAt && $this->created_at && $this->created_at->lt($trackingStartedAt)) {
                $isUnviewedForCurrentUser = false;
            }
        }

        $itemsTotal = array_sum(array_map(
            fn (array $item) => (float) ($item['line_total'] ?? 0),
            $items,
        ));

        $submittedPaymentsTotal = array_sum(array_map(
            fn (array $payment) => in_array(strtolower((string) ($payment['status'] ?? '')), ['pending', 'confirmed', 'verified', 'paid'], true)
                ? (float) ($payment['amount'] ?? 0)
                : 0,
            $payments,
        ));

        $confirmedPaymentsTotal = array_sum(array_map(
            fn (array $payment) => in_array(strtolower((string) ($payment['status'] ?? '')), ['confirmed', 'verified', 'paid'], true)
                ? (float) ($payment['amount'] ?? 0)
                : 0,
            $payments,
        ));

        $miceReportStatus = $this->miceReportStatus();
        $financialSummary = $this->financial_summary ?? [];
        $billingSummary = app(BookingBillingService::class)->summarize($this->resource);
        $deadline = app(BookingDeadlineService::class)->deadlinePayload($this->resource);
        $baseTotal = round((float) ($billingSummary['base_total'] ?? $financialSummary['base_total'] ?? $itemsTotal), 2);
        $postEventTotal = round((float) ($billingSummary['post_event_total'] ?? $financialSummary['post_event_total'] ?? 0), 2);
        $bondCharge = round((float) ($billingSummary['bond_charge'] ?? $financialSummary['bond_charge'] ?? $billingSummary['required_bond'] ?? 0), 2);
        $totalWithPostEvent = round((float) ($billingSummary['total_with_post_event'] ?? $billingSummary['total_with_bond'] ?? $financialSummary['total_with_bond'] ?? ($baseTotal + $postEventTotal + $bondCharge)), 2);
        $remainingWithPostEvent = round((float) ($billingSummary['balance'] ?? $financialSummary['balance'] ?? max(0, $totalWithPostEvent - (float) $confirmedPaymentsTotal)), 2);

        return [
            'id' => $this->id,

            'service_id' => $this->service_id,
            'service_name' => $service?->name,
            'service_type_id' => $service?->service_type_id,
            'service_type_name' => $serviceType?->name,

            'service' => $service ? [
                'id' => $service->id,
                'name' => $service->name,
                'price' => $service->price,
                'description' => $service->description,
                'service_type_id' => $service->service_type_id,
                'service_type_name' => $serviceType?->name,
                'service_type' => $serviceType ? [
                    'id' => $serviceType->id,
                    'name' => $serviceType->name,
                ] : null,
            ] : null,

            'selected_package_code' => $this->selected_package_code,
            'selected_area_keys' => is_array($this->selected_area_keys) ? array_values($this->selected_area_keys) : [],
            'selected_area_labels' => VenueAreaCatalog::displayNames($this->selected_area_keys ?? []),
            'dressing_room_selection' => $this->dressing_room_selection,
            'dressing_room_charge' => round((float) ($this->dressing_room_charge ?? 0), 2),
            'mice_required' => (bool) ($this->mice_required ?? true),
            'mice_exemption_reason' => $this->mice_exemption_reason,
            'private_event_type' => $this->private_event_type,
            'estimated_usage' => $this->estimated_usage,
            'estimated_duration_hours' => $this->estimated_duration_hours,
            'estimated_other_rentals' => $this->estimated_other_rentals,
            'estimated_additional_charges' => round((float) ($this->estimated_additional_charges ?? 0), 2),
            'reservation_notes' => $this->reservation_notes,
            'venue_capacity' => $this->venue_capacity ?? null,
            'report_email' => $this->client_email,
            'payment_meta' => is_array($this->payment_meta ?? null) ? $this->payment_meta : [],
            'base_subtotal' => round((float) ($billingSummary['base_subtotal'] ?? $this->base_subtotal ?? 0), 2),
            'discount_total' => round((float) ($billingSummary['discount_total'] ?? $this->discount_total ?? 0), 2),
            'finalized_total' => round((float) ($billingSummary['base_total'] ?? $this->finalized_total ?? 0), 2),
            'required_down_payment_amount' => round((float) ($billingSummary['required_down_payment'] ?? $this->required_down_payment_amount ?? 0), 2),
            'required_bond_amount' => round((float) ($billingSummary['required_bond'] ?? $this->required_bond_amount ?? 0), 2),
            'bond_charge' => round((float) ($billingSummary['bond_charge'] ?? $bondCharge), 2),
            'total_with_bond' => round((float) ($billingSummary['total_with_bond'] ?? $totalWithPostEvent), 2),
            'payment_total_including_bond' => round((float) ($billingSummary['payment_total_including_bond'] ?? $totalWithPostEvent), 2),
            'bond_status' => $billingSummary['bond_status'] ?? $this->bond_status,
            'bond_paid' => (bool) ($billingSummary['bond_paid'] ?? false),
            'final_computation_status' => $billingSummary['final_computation_status'] ?? ($this->final_computation_status ?? null),
            'final_computation_status_label' => $billingSummary['final_computation_status_label'] ?? null,
            'final_computation_finalized_at' => $billingSummary['final_computation_finalized_at'] ?? optional($this->final_computation_finalized_at ?? null)->toIso8601String(),
            'billing_notes' => $this->billing_notes,

            'organization_type' => $this->organization_type,
            'company_name' => $this->company_name,
            'client_name' => $this->client_name,
            'client_contact_number' => $this->client_contact_number,
            'client_email' => $this->client_email,

            'survey_proof_image_url' => $this->surveyProofUrl($request),
            'survey_proof_image_name' => $this->survey_proof_image_name,
            'survey_proof_image_mime' => $this->survey_proof_image_mime,

            'mice_report' => $this->miceReportPayload(),
            'mice_report_status' => $miceReportStatus,
            'mice_report_required' => (bool) ($this->mice_required ?? true),
            'mice_report_submitted' => $miceReportStatus === 'submitted',

            'client_address' => $this->client_address,
            'client_region' => $this->client_region,
            'client_province' => $this->client_province,
            'client_city_municipality' => $this->client_city_municipality,
            'client_barangay' => $this->client_barangay,
            'client_zip_code' => $this->client_zip_code,
            'client_street_address' => $this->client_street_address,

            'head_of_organization' => $this->head_of_organization,
            'type_of_event' => $this->type_of_event,

            'booking_date_from' => optional($this->booking_date_from)->toIso8601String(),
            'booking_date_to' => optional($this->booking_date_to)->toIso8601String(),
            'schedule_version' => $this->schedule_version,
            'schedule_meta' => $this->schedule_meta ?? [],
            'schedule_segments' => $this->scheduleSegmentsPayload(),
            'flexible_date_from' => optional($this->flexible_date_from)->toIso8601String(),
            'flexible_date_to' => optional($this->flexible_date_to)->toIso8601String(),

            'number_of_guests' => $this->number_of_guests,
            'booking_status' => $this->booking_status,
            'payment_status' => $this->payment_status,

            'expired_at' => optional($this->expired_at)->toIso8601String(),
            'payment_balance_due_at' => optional($this->payment_balance_due_at)->toIso8601String(),
            'auto_declined_at' => optional($this->auto_declined_at)->toIso8601String(),
            'auto_decline_reason' => $this->auto_decline_reason,
            'confirmed_at' => optional($this->confirmed_at)->toIso8601String(),
            'deadline_at' => $deadline['deadline_at'] ?? null,
            'deadline_state' => $deadline['deadline_state'] ?? 'none',
            'deadline_label' => $deadline['deadline_label'] ?? null,
            'deadline_seconds_remaining' => $deadline['deadline_seconds_remaining'] ?? null,
            'deadline_is_expired' => $deadline['deadline_is_expired'] ?? false,
            'deadline_is_due_soon' => $deadline['deadline_is_due_soon'] ?? false,
            'deadline_policy' => $deadline['deadline_policy'] ?? '10 working days',

            'is_public_calendar_visible' => (bool) $this->is_public_calendar_visible,
            'public_calendar_title' => $this->public_calendar_title,

            'created_by_user_id' => $this->created_by_user_id,
            'created_by' => $creator ? [
                'id' => $creator->id,
                'name' => $creator->name,
                'email' => $creator->email,
            ] : null,
            'created_by_name' => $creator?->name,
            'created_by_email' => $creator?->email,

            'is_unviewed_for_current_user' => $isUnviewedForCurrentUser,
            'current_user_viewed_at' => optional($currentUserView?->viewed_at)->toIso8601String(),

            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),

            'items' => $items,
            'payments' => $payments,
            'lifecycle_events' => $lifecycleEvents,
            'financial_summary' => $financialSummary,
            'billing_summary' => $billingSummary,
            'post_event_charges' => $this->postEventChargesPayload(),

            'totals' => [
                'items_total' => $totalWithPostEvent,
                'base_subtotal' => round((float) ($billingSummary['base_subtotal'] ?? $financialSummary['base_subtotal'] ?? $this->base_subtotal ?? $baseTotal), 2),
                'base_total' => $baseTotal,
                'discount_total' => round((float) ($billingSummary['discount_total'] ?? $financialSummary['discount_total'] ?? $this->discount_total ?? 0), 2),
                'required_bond_amount' => round((float) ($billingSummary['required_bond'] ?? $this->required_bond_amount ?? 0), 2),
                'bond_charge' => $bondCharge,
                'post_event_total' => $postEventTotal,
                'total_with_bond' => round((float) ($billingSummary['total_with_bond'] ?? $totalWithPostEvent), 2),
                'payment_total_including_bond' => round((float) ($billingSummary['payment_total_including_bond'] ?? $totalWithPostEvent), 2),
                'total_with_post_event' => $totalWithPostEvent,
                'payments_total' => round((float) ($financialSummary['paid'] ?? $confirmedPaymentsTotal), 2),
                'submitted_payments_total' => round((float) (($financialSummary['paid'] ?? 0) + ($financialSummary['pending'] ?? 0) ?: $submittedPaymentsTotal), 2),
                'confirmed_payments_total' => round((float) ($financialSummary['paid'] ?? $confirmedPaymentsTotal), 2),
                'remaining_balance' => $remainingWithPostEvent,
            ],
        ];
    }

    protected function postEventChargesPayload(): array
    {
        $charges = $this->relationLoaded('postEventCharges')
            ? $this->postEventCharges
            : $this->resource->postEventCharges()
                ->with('assessedBy')
                ->latest('assessed_at')
                ->latest('id')
                ->get();

        return $charges
            ->map(function ($charge) {
                $assessor = $charge->relationLoaded('assessedBy') ? $charge->assessedBy : null;

                return [
                    'id' => $charge->id,
                    'category' => $charge->category,
                    'label' => $charge->label,
                    'amount' => round((float) ($charge->amount ?? 0), 2),
                    'status' => $charge->status,
                    'notes' => $charge->notes,
                    'assessed_at' => optional($charge->assessed_at)->toIso8601String(),
                    'settled_at' => optional($charge->settled_at)->toIso8601String(),
                    'created_at' => optional($charge->created_at)->toIso8601String(),
                    'updated_at' => optional($charge->updated_at)->toIso8601String(),
                    'assessed_by' => $assessor ? [
                        'id' => $assessor->id,
                        'name' => $assessor->name,
                        'email' => $assessor->email,
                    ] : null,
                ];
            })
            ->values()
            ->all();
    }

    protected function scheduleSegmentsPayload(): array
    {
        if (! $this->relationLoaded('scheduleSegments')) {
            return [];
        }

        return $this->scheduleSegments
            ->map(fn ($segment) => [
                'id' => $segment->id,
                'date' => optional($segment->date)->format('Y-m-d'),
                'segment_role' => $segment->segment_role,
                'base_block' => $segment->base_block,
                'starts_at' => optional($segment->starts_at)->toIso8601String(),
                'ends_at' => optional($segment->ends_at)->toIso8601String(),
                'has_additional_hours' => (bool) $segment->has_additional_hours,
                'additional_hours' => (int) ($segment->additional_hours ?? 0),
                'additional_starts_at' => optional($segment->additional_starts_at)->toIso8601String(),
                'additional_ends_at' => optional($segment->additional_ends_at)->toIso8601String(),
                'area_keys' => is_array($segment->area_keys) ? array_values($segment->area_keys) : [],
                'area_labels' => VenueAreaCatalog::displayNames($segment->area_keys ?? []),
                'sort_order' => (int) ($segment->sort_order ?? 0),
            ])
            ->values()
            ->all();
    }

    protected function miceDraftMetaValue(string $key): ?string
    {
        $meta = is_array($this->payment_meta ?? null) ? $this->payment_meta : [];
        $draft = isset($meta['mice_draft']) && is_array($meta['mice_draft']) ? $meta['mice_draft'] : [];
        $value = $draft[$key] ?? null;

        return is_scalar($value) && trim((string) $value) !== '' ? (string) $value : null;
    }

    protected function items(): array
    {
        if (! $this->relationLoaded('bookingServices')) {
            return [];
        }

        return $this->bookingServices
            ->map(function ($item) {
                $service = $item->relationLoaded('service') ? $item->service : $item->service;
                $serviceType = $service?->relationLoaded('serviceType') ? $service?->serviceType : $service?->serviceType;

                $quantity = max(1, (int) ($item->quantity ?? 1));
                $unitPrice = (float) ($item->unit_price ?? $item->price ?? $service?->price ?? 0);

                return [
                    'id' => $item->id,
                    'service_id' => $item->service_id,
                    'service_name' => $service?->name,
                    'service_type_id' => $service?->service_type_id,
                    'service_type_name' => $serviceType?->name,
                    'area' => $serviceType?->name,
                    'quantity' => $quantity,
                    'price' => round($unitPrice, 2),
                    'unit_price' => round($unitPrice, 2),
                    'line_total' => round($unitPrice * $quantity, 2),
                ];
            })
            ->values()
            ->toArray();
    }

    protected function payments(Request $request): array
    {
        if (! $this->relationLoaded('payments')) {
            return [];
        }

        return $this->payments
            ->sortByDesc('created_at')
            ->values()
            ->map(function ($payment) use ($request) {
                return [
                    'id' => $payment->id,
                    'booking_id' => $payment->booking_id,

                    'status' => $payment->status,
                    'payment_method' => $payment->payment_method,
                    'payment_gateway' => $payment->payment_gateway,
                    'payment_type' => $payment->payment_type,

                    'amount' => round((float) $payment->amount, 2),
                    'transaction_reference' => $payment->transaction_reference,
                    'remarks' => $payment->remarks,
                    'payer_name' => $payment->payer_name,
                    'card_holder_name' => $payment->card_holder_name,
                    'card_last_four' => $payment->card_last_four,
                    'marketing_consent' => (bool) $payment->marketing_consent,

                    'proof_image_url' => $this->paymentProofUrl($request, $payment),
                    'proof_image_name' => $payment->proof_image_name,
                    'proof_image_mime' => $payment->proof_image_mime,

                    'paid_at' => optional($payment->paid_at)->toIso8601String(),
                    'verified_at' => optional($payment->verified_at)->toIso8601String(),
                    'approved_at' => optional($payment->approved_at)->toIso8601String(),
                    'declined_at' => optional($payment->declined_at)->toIso8601String(),
                    'failed_at' => optional($payment->failed_at)->toIso8601String(),

                    'created_at' => optional($payment->created_at)->toIso8601String(),
                    'updated_at' => optional($payment->updated_at)->toIso8601String(),
                ];
            })
            ->toArray();
    }

    protected function lifecycleEvents(): array
    {
        if (! $this->relationLoaded('lifecycleEvents')) {
            return [];
        }

        return $this->lifecycleEvents
            ->sortBy('event_at')
            ->values()
            ->map(function ($event) {
                $actor = $event->relationLoaded('actor') ? $event->actor : null;

                return [
                    'id' => $event->id,
                    'event_key' => $event->event_key,
                    'title' => $event->title,
                    'from_status' => $event->from_status,
                    'to_status' => $event->to_status,
                    'from_payment_status' => $event->from_payment_status,
                    'to_payment_status' => $event->to_payment_status,
                    'reason' => $event->reason,
                    'meta' => $event->meta,
                    'event_at' => optional($event->event_at ?? $event->created_at)->toIso8601String(),
                    'created_at' => optional($event->created_at)->toIso8601String(),
                    'actor' => $actor ? [
                        'id' => $actor->id,
                        'name' => $actor->name,
                        'email' => $actor->email,
                    ] : null,
                ];
            })
            ->toArray();
    }

    protected function miceReportPayload(): ?array
    {
        $record = $this->resolveMiceRecord();

        if (! $record) {
            return null;
        }

        return [
            'id' => $record->id,
            'booking_id' => $record->booking_id,
            'record_no' => $record->record_no,
            'year_recorded' => $record->year_recorded,
            'status' => $record->status,
            'event_scope' => $record->event_scope,
            'event_name' => $record->event_name,
            'event_category' => $record->event_category,
            'classification_of_event' => $record->classification_of_event,
            'type_of_event' => $record->type_of_event,
            'mice_type_of_event' => $record->mice_type_of_event,
            'venue_area' => $record->venue_area,
            'event_center_name' => $record->event_center_name,
            'function_halls_count' => $record->function_halls_count,
            'function_hall_capacity' => $record->function_hall_capacity,
            'report_email' => $record->email ?: $this->client_email,
            'event_date_from' => optional($record->event_date_from)->toIso8601String(),
            'event_date_to' => optional($record->event_date_to)->toIso8601String(),
            'event_started_at' => optional($record->event_started_at)->toDateString(),
            'event_finished_at' => optional($record->event_finished_at)->toDateString(),
            'covered_month' => $record->covered_month,
            'event_days' => $record->event_days,
            'number_of_hours' => $record->number_of_hours,
            'schedule_time_display' => $this->miceDraftMetaValue('schedule_time_display'),
            'additional_hours_display' => $this->miceDraftMetaValue('additional_hours_display'),
            'schedule_daily_display' => $this->miceDraftMetaValue('schedule_daily_display'),
            'organization_name' => $record->organization_name,
            'organizer_organization_name' => $record->organizer_organization_name,
            'contact_person' => $record->contact_person,
            'organizer_contact_person' => $record->organizer_contact_person,
            'contact_number' => $record->contact_number,
            'organizer_contact_number' => $record->organizer_contact_number,
            'email' => $record->email,
            'address' => $record->address,
            'organizer_address' => $record->organizer_address,
            'local_male_participants' => $record->local_male_participants,
            'local_female_participants' => $record->local_female_participants,
            'domestic_male_participants' => $record->domestic_male_participants,
            'domestic_female_participants' => $record->domestic_female_participants,
            'foreign_male_participants' => $record->foreign_male_participants,
            'foreign_female_participants' => $record->foreign_female_participants,
            'domestic_attendees' => $record->domestic_attendees,
            'foreign_attendees' => $record->foreign_attendees,
            'total_participants' => $record->total_participants,
            'total_number_of_countries' => $record->total_number_of_countries,
            'countries_breakdown_text' => $record->countries_breakdown_text,
            'countries_breakdown' => $record->countries_breakdown,
            'main_origin_country' => $record->main_origin_country,
            'main_origin_province' => $record->main_origin_province,
            'main_origin_city' => $record->main_origin_city,
            'has_exhibitions' => (bool) $record->has_exhibitions,
            'exhibitors_count' => $record->exhibitors_count,
            'visitors_count' => $record->visitors_count,
            'same_day_visitors' => $record->same_day_visitors,
            'overnight_visitors' => $record->overnight_visitors,
            'estimated_room_nights' => $record->estimated_room_nights,
            'estimated_tourism_receipts' => $record->estimated_tourism_receipts,
            'comments_feedback' => $record->comments_feedback,
            'remarks' => $record->remarks,
            'submitted_at' => optional($record->submitted_at)->toIso8601String(),
            'updated_at' => optional($record->updated_at)->toIso8601String(),
        ];
    }

    protected function miceReportStatus(): string
    {
        $record = $this->resolveMiceRecord();

        if (! $record) {
            return 'required';
        }

        if ($record->status === 'submitted' && $record->submitted_at !== null) {
            return 'submitted';
        }

        return $record->status ?: 'draft';
    }

    protected function resolveMiceRecord(): ?MiceRecord
    {
        if ($this->relationLoaded('miceRecord')) {
            return $this->miceRecord;
        }

        if (! $this->id) {
            return null;
        }

        return MiceRecord::query()
            ->where('booking_id', $this->id)
            ->first();
    }

    protected function surveyProofUrl(Request $request): ?string
    {
        if (
            empty($this->survey_proof_image_path)
            && empty($this->survey_proof_image_name)
            && empty($this->survey_proof_image)
        ) {
            return null;
        }

        try {
            $routeName = WorkspacePage::routeName($request, 'bookings.survey-proof-image');
            $base = route($routeName, $this->id, false);
            $version = $this->updated_at?->timestamp ?? time();

            return $base.'?v='.$version;
        } catch (\Throwable) {
            return null;
        }
    }

    protected function paymentProofUrl(Request $request, $payment): ?string
    {
        if (empty($payment->proof_image_path) || empty($payment->id) || empty($payment->booking_id)) {
            return null;
        }

        try {
            $routeName = WorkspacePage::routeName($request, 'bookings.payments.proof');

            $base = route($routeName, [
                'booking' => $payment->booking_id,
                'payment' => $payment->id,
            ], false);

            $version = $payment->updated_at?->timestamp ?? $payment->created_at?->timestamp ?? time();

            return $base.'?v='.$version;
        } catch (\Throwable) {
            return null;
        }
    }
}
