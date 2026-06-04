<?php

namespace App\Models;

use App\Services\BookingFinancialSummaryService;
use App\Support\BookingStatusCatalog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'booking_date_from' => 'datetime',
        'booking_date_to' => 'datetime',
        'flexible_date_from' => 'datetime',
        'flexible_date_to' => 'datetime',
        'expired_at' => 'datetime',
        'archived_at' => 'datetime',
        'is_public_calendar_visible' => 'boolean',
        'number_of_guests' => 'integer',
        'payment_meta' => 'array',
        'policy_acknowledged_at' => 'datetime',
        'final_computation_at' => 'datetime',
        'selected_area_keys' => 'array',
        'dressing_room_charge' => 'decimal:2',
        'mice_required' => 'boolean',
        'schedule_meta' => 'array',

        'base_subtotal' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'finalized_total' => 'decimal:2',
        'required_down_payment_amount' => 'decimal:2',
        'required_bond_amount' => 'decimal:2',
        'bond_paid_at' => 'datetime',
        'bond_waived_at' => 'datetime',
        'down_payment_due_at' => 'datetime',
        'balance_due_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'declined_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'completed_at' => 'datetime',
        'final_computation_meta' => 'array',
        'final_computation_locked_at' => 'datetime',
        'review_notified_at' => 'datetime',
        'event_reminder_10d_sent_at' => 'datetime',
        'event_reminder_3d_sent_at' => 'datetime',
        'event_reminder_1d_sent_at' => 'datetime',
        'payment_due_reminder_sent_at' => 'datetime',
        'cancellation_penalty_rate' => 'decimal:4',
        'cancellation_penalty_amount' => 'decimal:2',
    ];

    protected $appends = [
        'display_title',
        'display_client',
        'financial_summary',
    ];

    public function setBookingStatusAttribute($value): void
    {
        $this->attributes['booking_status'] = BookingStatusCatalog::normalizeBookingStatus(
            is_string($value) ? $value : (string) $value,
            'pending'
        );
    }

    public function setPaymentStatusAttribute($value): void
    {
        $this->attributes['payment_status'] = BookingStatusCatalog::normalizeBookingPaymentStatus(
            is_string($value) ? $value : (string) $value,
            'unpaid'
        );
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function miceRecord(): HasOne
    {
        return $this->hasOne(MiceRecord::class);
    }

    public function bookingServices(): HasMany
    {
        return $this->hasMany(BookingService::class);
    }

    public function scheduleSegments(): HasMany
    {
        return $this->hasMany(BookingScheduleSegment::class)->orderBy('sort_order')->orderBy('starts_at');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(BookingPayment::class);
    }

    public function postEventCharges(): HasMany
    {
        return $this->hasMany(BookingPostEventCharge::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function lifecycleEvents(): HasMany
    {
        return $this->hasMany(BookingLifecycleEvent::class);
    }

    public function views(): HasMany
    {
        return $this->hasMany(BookingView::class);
    }

    public function drafts(): HasMany
    {
        return $this->hasMany(BookingDraft::class);
    }

    public function getDisplayTitleAttribute(): string
    {
        return trim((string) (
            $this->public_calendar_title
            ?: $this->type_of_event
            ?: $this->company_name
            ?: $this->client_name
            ?: 'Booking'
        ));
    }

    public function getDisplayClientAttribute(): string
    {
        return trim((string) (
            $this->company_name
            ?: $this->client_name
            ?: $this->client_email
            ?: 'Client'
        ));
    }

    public function getFinancialSummaryAttribute(): array
    {
        return app(BookingFinancialSummaryService::class)->summarize($this);
    }

    public function scopeActiveForCalendar($query)
    {
        return $query->whereIn('booking_status', ['active', 'confirmed', 'approved']);
    }

    public function scopePublicVisible($query)
    {
        return $query->where('is_public_calendar_visible', true);
    }
}
