<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class MiceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'record_no',
        'year_recorded',
        'event_scope',
        'draft_expires_at',
        'finalized_at',
        'decline_cleanup_at',
        'enterprise_group',
        'btc_group_code',

        'establishment_name',
        'event_name',
        'event_category',
        'type_of_event',
        'venue_area',
        'event_date_from',
        'event_date_to',

        'event_center_name',
        'function_halls_count',
        'function_hall_capacity',
        'covered_month',
        'event_started_at',
        'event_finished_at',
        'number_of_hours',
        'classification_of_event',
        'mice_type_of_event',
        'foreign_attendees',
        'domestic_attendees',
        'total_number_of_countries',
        'countries_breakdown',
        'countries_breakdown_text',
        'has_exhibitions',
        'exhibitors_count',
        'visitors_count',
        'organizer_organization_name',
        'organizer_address',
        'organizer_contact_person',
        'organizer_contact_number',
        'comments_feedback',
        'source',
        'source_response_timestamp',
        'source_username',

        'organization_name',
        'organizer_name',
        'organizer_type',
        'contact_person',
        'contact_number',
        'email',
        'address',

        'local_male_participants',
        'local_female_participants',
        'domestic_male_participants',
        'domestic_female_participants',
        'foreign_male_participants',
        'foreign_female_participants',

        'main_origin_country',
        'main_origin_province',
        'main_origin_city',

        'same_day_visitors',
        'overnight_visitors',
        'estimated_room_nights',
        'estimated_tourism_receipts',

        'total_employees',
        'female_employees',
        'male_employees',

        'permit_to_engage',
        'dot_accredited',
        'active_member',

        'remarks',
        'event_days',
        'total_participants',

        'status',
        'submitted_at',
        'submitted_by_user_id',
        'updated_by_user_id',
    ];

    protected $casts = [
        'booking_id' => 'integer',
        'year_recorded' => 'integer',
        'draft_expires_at' => 'datetime',
        'finalized_at' => 'datetime',
        'decline_cleanup_at' => 'datetime',

        'event_date_from' => 'datetime',
        'event_date_to' => 'datetime',
        'event_started_at' => 'date',
        'event_finished_at' => 'date',
        'source_response_timestamp' => 'datetime',
        'submitted_at' => 'datetime',

        'function_halls_count' => 'integer',
        'function_hall_capacity' => 'integer',
        'number_of_hours' => 'decimal:2',
        'foreign_attendees' => 'integer',
        'domestic_attendees' => 'integer',
        'total_number_of_countries' => 'integer',
        'countries_breakdown' => 'array',
        'has_exhibitions' => 'boolean',
        'exhibitors_count' => 'integer',
        'visitors_count' => 'integer',

        'local_male_participants' => 'integer',
        'local_female_participants' => 'integer',
        'domestic_male_participants' => 'integer',
        'domestic_female_participants' => 'integer',
        'foreign_male_participants' => 'integer',
        'foreign_female_participants' => 'integer',

        'same_day_visitors' => 'integer',
        'overnight_visitors' => 'integer',
        'estimated_room_nights' => 'integer',
        'estimated_tourism_receipts' => 'decimal:2',

        'total_employees' => 'integer',
        'female_employees' => 'integer',
        'male_employees' => 'integer',

        'permit_to_engage' => 'boolean',
        'dot_accredited' => 'boolean',
        'active_member' => 'boolean',

        'event_days' => 'integer',
        'total_participants' => 'integer',

        'submitted_by_user_id' => 'integer',
        'updated_by_user_id' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (MiceRecord $record): void {
            $record->applySafeDefaults();
        });

        static::updating(function (MiceRecord $record): void {
            $record->applySafeDefaults();
        });
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function applySafeDefaults(): void
    {
        if (blank($this->event_scope)) {
            $this->event_scope = 'public';
        }

        foreach (['event_name', 'organization_name', 'organizer_organization_name', 'organizer_address', 'organizer_contact_person', 'contact_person', 'address'] as $field) {
            if (filled($this->{$field})) {
                $this->{$field} = mb_strtoupper((string) $this->{$field});
            }
        }

        if (blank($this->event_center_name)) {
            $this->event_center_name = 'BAGUIO CONVENTION AND CULTURAL CENTER';
        }

        if (blank($this->establishment_name)) {
            $this->establishment_name = $this->event_center_name
                ?: $this->organization_name
                ?: $this->organizer_organization_name
                ?: $this->organizer_name
                ?: $this->event_name
                ?: 'Baguio Convention and Cultural Center';
        }

        if (blank($this->event_name)) {
            $this->event_name = $this->establishment_name ?: 'Untitled Event';
        }

        if (blank($this->mice_type_of_event)) {
            $this->mice_type_of_event = $this->type_of_event ?: $this->event_category;
        }

        if (blank($this->type_of_event)) {
            $this->type_of_event = $this->mice_type_of_event ?: $this->event_category ?: $this->event_name;
        }

        if (blank($this->classification_of_event)) {
            $this->classification_of_event = $this->event_category ?: $this->classification ?: 'REGIONAL PHILIPPINES';
        }

        if (blank($this->venue_area)) {
            $this->venue_area = $this->event_center_name ?: 'Baguio Convention and Cultural Center';
        }

        if (blank($this->enterprise_group)) {
            $this->enterprise_group = 'UNCLASSIFIED';
        }

        if (blank($this->main_origin_country)) {
            $this->main_origin_country = 'Philippines';
        }

        if (blank($this->organizer_organization_name)) {
            $this->organizer_organization_name = $this->organization_name;
        }

        if (blank($this->organizer_address)) {
            $this->organizer_address = $this->address;
        }

        if (blank($this->organizer_contact_person)) {
            $this->organizer_contact_person = $this->contact_person ?: $this->organizer_name;
        }

        if (blank($this->organizer_contact_number)) {
            $this->organizer_contact_number = $this->contact_number;
        }

        if (blank($this->comments_feedback)) {
            $this->comments_feedback = filled($this->remarks) ? $this->remarks : 'N/A';
        }

        if (blank($this->remarks)) {
            $this->remarks = $this->comments_feedback ?: 'N/A';
        }

        if (blank($this->status)) {
            $this->status = 'draft';
        }

        if (blank($this->submitted_at)) {
            $this->submitted_at = now();
        }

        if (blank($this->event_started_at) && filled($this->event_date_from)) {
            $this->event_started_at = Carbon::parse($this->event_date_from)->toDateString();
        }

        if (blank($this->event_finished_at) && filled($this->event_date_to)) {
            $this->event_finished_at = Carbon::parse($this->event_date_to)->toDateString();
        }

        if (blank($this->event_date_from)) {
            $this->event_date_from = $this->event_started_at ?: now()->startOfDay();
        }

        if (blank($this->event_date_to)) {
            $this->event_date_to = $this->event_finished_at ?: $this->event_date_from;
        }

        if (blank($this->event_started_at)) {
            $this->event_started_at = Carbon::parse($this->event_date_from)->toDateString();
        }

        if (blank($this->event_finished_at)) {
            $this->event_finished_at = Carbon::parse($this->event_date_to)->toDateString();
        }

        if (blank($this->covered_month)) {
            $this->covered_month = Carbon::parse($this->event_started_at ?: $this->event_date_from)->format('F');
        }

        if (blank($this->year_recorded)) {
            $this->year_recorded = Carbon::parse($this->event_started_at ?: $this->event_date_from)->year;
        }

        if (blank($this->event_days) || (int) $this->event_days <= 0) {
            $this->event_days = max(
                1,
                Carbon::parse($this->event_started_at ?: $this->event_date_from)->startOfDay()
                    ->diffInDays(Carbon::parse($this->event_finished_at ?: $this->event_date_to)->startOfDay()) + 1
            );
        }

        $calculatedParticipants =
            (int) $this->local_male_participants
            + (int) $this->local_female_participants
            + (int) $this->domestic_male_participants
            + (int) $this->domestic_female_participants
            + (int) $this->foreign_male_participants
            + (int) $this->foreign_female_participants;

        $officialParticipants = (int) $this->foreign_attendees + (int) $this->domestic_attendees;

        if (blank($this->total_participants) || (int) $this->total_participants <= 0) {
            $this->total_participants = max($calculatedParticipants, $officialParticipants);
        }

        if ((int) $this->domestic_attendees <= 0) {
            $this->domestic_attendees = (int) $this->domestic_male_participants + (int) $this->domestic_female_participants;
        }

        if ((int) $this->foreign_attendees <= 0) {
            $this->foreign_attendees = (int) $this->foreign_male_participants + (int) $this->foreign_female_participants;
        }

        if ((int) $this->total_number_of_countries <= 0) {
            $this->total_number_of_countries = blank($this->main_origin_country) ? 1 : 1;
        }

        if (! $this->has_exhibitions) {
            $this->exhibitors_count = 0;
        }

        if ((int) $this->visitors_count <= 0) {
            $this->visitors_count = (int) $this->same_day_visitors + (int) $this->overnight_visitors;
        }

        $calculatedEmployees = (int) $this->female_employees + (int) $this->male_employees;

        if ((blank($this->total_employees) || (int) $this->total_employees <= 0) && $calculatedEmployees > 0) {
            $this->total_employees = $calculatedEmployees;
        }
    }
}
