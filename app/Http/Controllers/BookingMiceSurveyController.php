<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingMiceSurveyRequest;
use App\Models\Booking;
use App\Models\MiceRecord;
use App\Support\WorkspaceAccess;
use App\Support\WorkspacePage;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingMiceSurveyController extends Controller
{
    public function show(Request $request, Booking $booking): Response
    {
        $this->ensureAccess($request, $booking);

        $booking->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
        ]);

        $record = MiceRecord::query()
            ->where('booking_id', $booking->id)
            ->first();

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/survey'), [
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
            'booking' => $this->bookingPayload($booking),
            'miceRecord' => $record ? $this->micePayload($record) : null,
            'defaults' => $this->defaultsFromBooking($booking),
            'formOptions' => [
                'eventCategories' => [
                    'Meeting',
                    'Incentive',
                    'Convention',
                    'Exhibition',
                    'Government',
                    'Cultural',
                    'Corporate',
                    'Social',
                    'Other',
                ],
                'organizerTypes' => [
                    'Private',
                    'Government',
                    'NGO',
                    'Academe',
                    'Religious',
                    'Corporate',
                    'Association',
                    'Other',
                ],
                'enterpriseGroups' => [
                    'PTE',
                    'STE',
                    'UNCLASSIFIED',
                ],
            ],
        ]);
    }

    public function store(StoreBookingMiceSurveyRequest $request, Booking $booking): RedirectResponse
    {
        $this->ensureAccess($request, $booking);

        $data = $request->validated();

        unset($data['certified']);

        $data['booking_id'] = $booking->id;
        $data['submitted_by_user_id'] = $request->user()?->id;
        $data['updated_by_user_id'] = $request->user()?->id;
        $data['status'] = 'submitted';
        $data['submitted_at'] = now();

        $data['record_no'] = $this->nextRecordNumber((int) $data['year_recorded']);

        MiceRecord::query()->updateOrCreate(
            ['booking_id' => $booking->id],
            $data,
        );

        return redirect()
            ->to($this->showPath($request, $booking))
            ->with('success', 'MICE report submitted successfully.');
    }

    protected function ensureAccess(Request $request, Booking $booking): void
    {
        abort_unless($request->user(), 403);

        if (WorkspaceAccess::isStaffLike($request)) {
            return;
        }

        $user = $request->user();

        $ownsBooking = (int) ($booking->created_by_user_id ?? 0) === (int) $user->id;
        $matchesEmail = strtolower((string) $booking->client_email) === strtolower((string) $user->email);

        abort_unless($ownsBooking || $matchesEmail, 403);
    }

    protected function defaultsFromBooking(Booking $booking): array
    {
        $start = $booking->booking_date_from ? Carbon::parse($booking->booking_date_from) : now();
        $end = $booking->booking_date_to ? Carbon::parse($booking->booking_date_to) : $start;

        $venueArea = $booking->service?->serviceType?->name
            ?: $booking->bookingServices->first()?->service?->serviceType?->name
            ?: $booking->service?->name
            ?: 'Baguio Convention and Cultural Center';

        $participants = (int) ($booking->number_of_guests ?? 0);
        $isPrivate = str_contains(strtolower((string) ($booking->private_event_type ?: $booking->organization_type ?: '')), 'private')
            || str_contains(strtolower((string) ($booking->private_event_type ?: $booking->organization_type ?: '')), 'personal')
            || str_contains(strtolower((string) ($booking->private_event_type ?: $booking->organization_type ?: '')), 'family');

        return [
            'year_recorded' => $start->year,
            'status' => 'draft',
            'event_scope' => $isPrivate ? 'private' : 'public',
            'event_center_name' => 'BAGUIO CONVENTION AND CULTURAL CENTER',
            'covered_month' => $start->format('F Y'),
            'event_started_at' => $start->toDateString(),
            'event_finished_at' => $end->toDateString(),
            'event_name' => $booking->type_of_event,
            'event_category' => $this->guessMiceCategory((string) $booking->type_of_event),
            'classification_of_event' => $isPrivate ? 'Private / Personal Event' : 'Public Event',
            'type_of_event' => $booking->type_of_event,
            'mice_type_of_event' => $booking->type_of_event,
            'venue_area' => $venueArea,
            'event_date_from' => $start->toDateString(),
            'event_date_to' => $end->toDateString(),
            'event_days' => max(1, $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1),

            'organization_name' => $booking->company_name ?: $booking->client_name,
            'organizer_organization_name' => $booking->company_name ?: $booking->client_name,
            'organizer_name' => $booking->head_of_organization ?: $booking->client_name,
            'organizer_type' => $booking->organization_type ?: ($isPrivate ? 'Private' : 'Government'),
            'contact_person' => $booking->client_name,
            'organizer_contact_person' => $booking->client_name,
            'contact_number' => $booking->client_contact_number,
            'organizer_contact_number' => $booking->client_contact_number,
            'email' => $booking->client_email,
            'address' => $booking->client_address,
            'organizer_address' => $booking->client_address,

            'domestic_attendees' => $participants,
            'foreign_attendees' => 0,
            'total_participants' => $participants,
            'main_origin_country' => 'Philippines',
            'main_origin_province' => $booking->client_province ?: 'Benguet',
            'main_origin_city' => $booking->client_city_municipality ?: 'Baguio City',
            'same_day_visitors' => $participants,
            'remarks' => 'Auto-filled from booking details. Please review and complete missing MICE fields before submitting.',
        ];
    }

    protected function guessMiceCategory(string $eventType): string
    {
        $value = strtolower($eventType);

        if (str_contains($value, 'exhibit') || str_contains($value, 'expo') || str_contains($value, 'fair')) {
            return 'Exhibition';
        }

        if (str_contains($value, 'convention') || str_contains($value, 'conference') || str_contains($value, 'summit')) {
            return 'Convention';
        }

        if (str_contains($value, 'meeting') || str_contains($value, 'seminar') || str_contains($value, 'training') || str_contains($value, 'workshop')) {
            return 'Meeting';
        }

        if (str_contains($value, 'government')) {
            return 'Government';
        }

        if (str_contains($value, 'cultural') || str_contains($value, 'concert')) {
            return 'Cultural';
        }

        if (str_contains($value, 'corporate')) {
            return 'Corporate';
        }

        return 'Other';
    }

    protected function bookingPayload(Booking $booking): array
    {
        $items = $booking->bookingServices
            ->map(function ($item) {
                $service = $item->service;
                $serviceType = $service?->serviceType;

                return [
                    'id' => $item->id,
                    'service_name' => $service?->name,
                    'area' => $serviceType?->name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price ?? $service?->price,
                ];
            })
            ->values()
            ->all();

        return [
            'id' => $booking->id,
            'type_of_event' => $booking->type_of_event,
            'organization_type' => $booking->organization_type,
            'company_name' => $booking->company_name,
            'client_name' => $booking->client_name,
            'client_contact_number' => $booking->client_contact_number,
            'client_email' => $booking->client_email,
            'client_address' => $booking->client_address,
            'head_of_organization' => $booking->head_of_organization,
            'number_of_guests' => $booking->number_of_guests,
            'booking_status' => $booking->booking_status,
            'payment_status' => $booking->payment_status,
            'booking_date_from' => optional($booking->booking_date_from)->toIso8601String(),
            'booking_date_to' => optional($booking->booking_date_to)->toIso8601String(),
            'items' => $items,
        ];
    }

    protected function micePayload(MiceRecord $record): array
    {
        return [
            'id' => $record->id,
            'booking_id' => $record->booking_id,
            'record_no' => $record->record_no,
            'year_recorded' => $record->year_recorded,
            'status' => $record->status,

            'enterprise_group' => $record->enterprise_group,
            'btc_group_code' => $record->btc_group_code,

            'event_name' => $record->event_name,
            'event_category' => $record->event_category,
            'type_of_event' => $record->type_of_event,
            'venue_area' => $record->venue_area,
            'event_date_from' => optional($record->event_date_from)->toDateString(),
            'event_date_to' => optional($record->event_date_to)->toDateString(),
            'event_days' => $record->event_days,
            'event_scope' => $record->event_scope,
            'event_center_name' => $record->event_center_name,
            'covered_month' => $record->covered_month,
            'event_started_at' => optional($record->event_started_at)->toDateString(),
            'event_finished_at' => optional($record->event_finished_at)->toDateString(),
            'number_of_hours' => $record->number_of_hours,
            'classification_of_event' => $record->classification_of_event,
            'mice_type_of_event' => $record->mice_type_of_event,
            'foreign_attendees' => $record->foreign_attendees,
            'domestic_attendees' => $record->domestic_attendees,
            'total_number_of_countries' => $record->total_number_of_countries,
            'countries_breakdown_text' => $record->countries_breakdown_text,
            'has_exhibitions' => (bool) $record->has_exhibitions,
            'exhibitors_count' => $record->exhibitors_count,
            'visitors_count' => $record->visitors_count,

            'organization_name' => $record->organization_name,
            'organizer_organization_name' => $record->organizer_organization_name,
            'organizer_contact_person' => $record->organizer_contact_person,
            'organizer_contact_number' => $record->organizer_contact_number,
            'organizer_address' => $record->organizer_address,
            'organizer_name' => $record->organizer_name,
            'organizer_type' => $record->organizer_type,
            'contact_person' => $record->contact_person,
            'contact_number' => $record->contact_number,
            'email' => $record->email,
            'address' => $record->address,

            'local_male_participants' => $record->local_male_participants,
            'local_female_participants' => $record->local_female_participants,
            'domestic_male_participants' => $record->domestic_male_participants,
            'domestic_female_participants' => $record->domestic_female_participants,
            'foreign_male_participants' => $record->foreign_male_participants,
            'foreign_female_participants' => $record->foreign_female_participants,
            'total_participants' => $record->total_participants,

            'main_origin_country' => $record->main_origin_country,
            'main_origin_province' => $record->main_origin_province,
            'main_origin_city' => $record->main_origin_city,

            'same_day_visitors' => $record->same_day_visitors,
            'overnight_visitors' => $record->overnight_visitors,
            'estimated_room_nights' => $record->estimated_room_nights,
            'estimated_tourism_receipts' => $record->estimated_tourism_receipts,

            'total_employees' => $record->total_employees,
            'female_employees' => $record->female_employees,
            'male_employees' => $record->male_employees,

            'permit_to_engage' => (bool) $record->permit_to_engage,
            'dot_accredited' => (bool) $record->dot_accredited,
            'active_member' => (bool) $record->active_member,

            'remarks' => $record->remarks,
            'submitted_at' => optional($record->submitted_at)->toIso8601String(),
        ];
    }

    protected function nextRecordNumber(int $year): int
    {
        $latest = MiceRecord::query()
            ->where('year_recorded', $year)
            ->max('record_no');

        return ((int) $latest) + 1;
    }

    protected function showPath(Request $request, Booking $booking): string
    {
        $role = WorkspaceAccess::role($request);

        return match ($role) {
            'admin' => "/admin/bookings/{$booking->id}",
            'manager' => "/manager/bookings/{$booking->id}",
            'staff' => "/staff/bookings/{$booking->id}",
            default => "/my-bookings/{$booking->id}",
        };
    }
}
