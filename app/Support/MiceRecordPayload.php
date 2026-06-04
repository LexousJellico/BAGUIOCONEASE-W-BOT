<?php

namespace App\Support;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class MiceRecordPayload
{
    public static function fromRequest(array $validated, ?Booking $booking = null, ?Authenticatable $user = null): array
    {
        $eventDateFrom = self::dateValue(
            Arr::get($validated, 'event_date_from')
            ?? Arr::get($validated, 'date_event_started')
            ?? Arr::get($validated, 'event_started_at')
            ?? Arr::get($validated, 'booking_date_from')
            ?? $booking?->booking_date_from
        );

        $eventDateTo = self::dateValue(
            Arr::get($validated, 'event_date_to')
            ?? Arr::get($validated, 'date_event_finished')
            ?? Arr::get($validated, 'event_finished_at')
            ?? Arr::get($validated, 'booking_date_to')
            ?? $booking?->booking_date_to
            ?? $eventDateFrom
        );

        $scope = MiceReportCatalog::normalizeScope(Arr::get($validated, 'event_scope'));
        $isPublic = $scope === MiceReportCatalog::EVENT_SCOPE_PUBLIC;
        $eventName = self::upperText(Arr::get($validated, 'event_name') ?? $booking?->type_of_event ?? 'UNTITLED EVENT');
        $organizationName = self::upperText(Arr::get($validated, 'organization_name') ?? $booking?->company_name ?? $booking?->client_name);
        $contactPerson = self::upperText(Arr::get($validated, 'contact_person') ?? $booking?->client_name);
        $address = self::upperText(Arr::get($validated, 'address') ?? $booking?->client_address ?? $booking?->client_street_address);
        $userId = $user?->getAuthIdentifier();
        $comments = self::text(Arr::get($validated, 'comments_feedback') ?? Arr::get($validated, 'remarks'), 'N/A');

        $domesticAttendees = self::intValue(Arr::get($validated, 'domestic_attendees'));
        $foreignAttendees = self::intValue(Arr::get($validated, 'foreign_attendees'));
        $totalParticipants = max(
            self::intValue(Arr::get($validated, 'total_participants')),
            $domesticAttendees + $foreignAttendees,
            self::intValue(Arr::get($validated, 'local_male_participants'))
            + self::intValue(Arr::get($validated, 'local_female_participants'))
            + self::intValue(Arr::get($validated, 'domestic_male_participants'))
            + self::intValue(Arr::get($validated, 'domestic_female_participants'))
            + self::intValue(Arr::get($validated, 'foreign_male_participants'))
            + self::intValue(Arr::get($validated, 'foreign_female_participants')),
            (int) ($booking?->number_of_guests ?? 0)
        );

        $countriesBreakdown = Arr::get($validated, 'countries_breakdown');
        $countriesBreakdown = is_array($countriesBreakdown) ? array_values($countriesBreakdown) : [];

        return [
            'booking_id' => $booking?->id ?? Arr::get($validated, 'booking_id'),
            'record_no' => Arr::get($validated, 'record_no'),
            'year_recorded' => self::intValue(Arr::get($validated, 'year_recorded'), $eventDateFrom ? (int) Carbon::parse($eventDateFrom)->format('Y') : now()->year),
            'event_scope' => $scope,
            'enterprise_group' => self::text(Arr::get($validated, 'enterprise_group'), 'UNCLASSIFIED'),
            'btc_group_code' => self::text(Arr::get($validated, 'btc_group_code')),

            'event_center_name' => MiceReportCatalog::EVENT_CENTER_NAME,
            'function_halls_count' => $isPublic ? MiceReportCatalog::FUNCTION_HALLS_COUNT : null,
            'function_hall_capacity' => $isPublic ? MiceReportCatalog::FUNCTION_HALL_CAPACITY : null,
            'covered_month' => self::text(Arr::get($validated, 'covered_month'), $eventDateFrom ? Carbon::parse($eventDateFrom)->format('F') : now()->format('F')),
            'event_started_at' => self::dateOnly(Arr::get($validated, 'event_started_at') ?? Arr::get($validated, 'date_event_started') ?? $eventDateFrom),
            'event_finished_at' => self::dateOnly(Arr::get($validated, 'event_finished_at') ?? Arr::get($validated, 'date_event_finished') ?? $eventDateTo),
            'number_of_hours' => self::decimalValue(Arr::get($validated, 'number_of_hours'), 10),

            'establishment_name' => MiceReportCatalog::EVENT_CENTER_NAME,
            'event_name' => $eventName,
            'event_category' => self::text(Arr::get($validated, 'event_category'), $isPublic ? 'REGIONAL PHILIPPINES' : '-'),
            'type_of_event' => self::text(Arr::get($validated, 'type_of_event'), $isPublic ? 'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS' : 'PRIVATE/PERSONAL EVENT'),
            'venue_area' => self::text(Arr::get($validated, 'venue_area') ?? self::bookingVenueName($booking), 'BAGUIO CONVENTION AND CULTURAL CENTER'),
            'event_date_from' => $eventDateFrom,
            'event_date_to' => $eventDateTo,
            'event_days' => self::intValue(Arr::get($validated, 'event_days'), self::eventDays($eventDateFrom, $eventDateTo)),

            'classification_of_event' => $isPublic ? self::text(Arr::get($validated, 'classification_of_event'), 'REGIONAL PHILIPPINES') : '-',
            'mice_type_of_event' => $isPublic ? self::text(Arr::get($validated, 'mice_type_of_event'), 'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS') : '-',
            'foreign_attendees' => $isPublic ? $foreignAttendees : 0,
            'domestic_attendees' => $isPublic ? $domesticAttendees : 0,
            'total_number_of_countries' => $isPublic ? max(1, self::intValue(Arr::get($validated, 'total_number_of_countries'), 1)) : 0,
            'countries_breakdown' => $isPublic ? $countriesBreakdown : [],
            'countries_breakdown_text' => $isPublic ? self::text(Arr::get($validated, 'countries_breakdown_text')) : '-',
            'has_exhibitions' => $isPublic ? self::boolValue(Arr::get($validated, 'has_exhibitions')) : false,
            'exhibitors_count' => $isPublic && self::boolValue(Arr::get($validated, 'has_exhibitions')) ? self::intValue(Arr::get($validated, 'exhibitors_count')) : 0,
            'visitors_count' => $isPublic && self::boolValue(Arr::get($validated, 'has_exhibitions')) ? self::intValue(Arr::get($validated, 'visitors_count')) : 0,

            'organizer_organization_name' => self::upperText(Arr::get($validated, 'organizer_organization_name') ?? $organizationName),
            'organizer_address' => self::upperText(Arr::get($validated, 'organizer_address') ?? $address),
            'organizer_contact_person' => self::upperText(Arr::get($validated, 'organizer_contact_person') ?? $contactPerson),
            'organizer_contact_number' => self::text(Arr::get($validated, 'organizer_contact_number') ?? Arr::get($validated, 'contact_number') ?? $booking?->client_contact_number),
            'comments_feedback' => $comments,

            'organization_name' => $organizationName,
            'organizer_name' => self::upperText(Arr::get($validated, 'organizer_name') ?? $booking?->head_of_organization ?? $booking?->client_name),
            'organizer_type' => self::text(Arr::get($validated, 'organizer_type') ?? $booking?->organization_type),
            'contact_person' => $contactPerson,
            'contact_number' => self::text(Arr::get($validated, 'contact_number') ?? $booking?->client_contact_number),
            'email' => self::text(Arr::get($validated, 'email') ?? $booking?->client_email),
            'address' => $address,

            'local_male_participants' => self::intValue(Arr::get($validated, 'local_male_participants')),
            'local_female_participants' => self::intValue(Arr::get($validated, 'local_female_participants')),
            'domestic_male_participants' => self::intValue(Arr::get($validated, 'domestic_male_participants')),
            'domestic_female_participants' => self::intValue(Arr::get($validated, 'domestic_female_participants')),
            'foreign_male_participants' => self::intValue(Arr::get($validated, 'foreign_male_participants')),
            'foreign_female_participants' => self::intValue(Arr::get($validated, 'foreign_female_participants')),
            'main_origin_country' => self::text(Arr::get($validated, 'main_origin_country'), 'Philippines'),
            'main_origin_province' => self::text(Arr::get($validated, 'main_origin_province')),
            'main_origin_city' => self::text(Arr::get($validated, 'main_origin_city')),
            'same_day_visitors' => self::intValue(Arr::get($validated, 'same_day_visitors')),
            'overnight_visitors' => self::intValue(Arr::get($validated, 'overnight_visitors')),
            'estimated_room_nights' => self::intValue(Arr::get($validated, 'estimated_room_nights')),
            'estimated_tourism_receipts' => self::decimalValue(Arr::get($validated, 'estimated_tourism_receipts')),
            'total_employees' => self::intValue(Arr::get($validated, 'total_employees')),
            'female_employees' => self::intValue(Arr::get($validated, 'female_employees')),
            'male_employees' => self::intValue(Arr::get($validated, 'male_employees')),
            'permit_to_engage' => self::boolValue(Arr::get($validated, 'permit_to_engage')),
            'dot_accredited' => self::boolValue(Arr::get($validated, 'dot_accredited')),
            'active_member' => self::boolValue(Arr::get($validated, 'active_member')),
            'remarks' => self::text(Arr::get($validated, 'remarks'), $comments),
            'total_participants' => $totalParticipants,
            'status' => self::text(Arr::get($validated, 'status'), 'draft'),
            'submitted_at' => Arr::get($validated, 'submitted_at') ?: now(),
            'submitted_by_user_id' => Arr::get($validated, 'submitted_by_user_id') ?? $userId,
            'updated_by_user_id' => Arr::get($validated, 'updated_by_user_id') ?? $userId,
        ];
    }

    private static function bookingVenueName(?Booking $booking): ?string
    {
        if (! $booking) {
            return null;
        }

        try {
            if ($booking->relationLoaded('bookingServices') && $booking->bookingServices->isNotEmpty()) {
                return $booking->bookingServices
                    ->map(fn ($item) => $item->service?->serviceType?->name ?: $item->service?->name)
                    ->filter()
                    ->unique()
                    ->implode(', ');
            }

            if ($booking->relationLoaded('service') || method_exists($booking, 'service')) {
                return $booking->service?->serviceType?->name ?: $booking->service?->name;
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }

    private static function text(mixed $value, ?string $fallback = null): ?string
    {
        if ($value === null) {
            return $fallback;
        }

        $text = trim((string) $value);

        return $text === '' ? $fallback : Str::limit($text, 2000, '');
    }

    private static function upperText(mixed $value, ?string $fallback = null): ?string
    {
        $text = self::text($value, $fallback);

        return $text === null ? null : mb_strtoupper($text);
    }

    private static function intValue(mixed $value, int $fallback = 0): int
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        return max(0, (int) $value);
    }

    private static function decimalValue(mixed $value, float $fallback = 0): float
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        return max(0, (float) $value);
    }

    private static function boolValue(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    private static function dateValue(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->startOfDay()->toDateTimeString();
        } catch (\Throwable) {
            return null;
        }
    }

    private static function dateOnly(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private static function eventDays(?string $from, ?string $to): int
    {
        if (! $from) {
            return 1;
        }

        try {
            $start = Carbon::parse($from)->startOfDay();
            $end = $to ? Carbon::parse($to)->startOfDay() : $start;

            return max(1, $start->diffInDays($end) + 1);
        } catch (\Throwable) {
            return 1;
        }
    }
}
