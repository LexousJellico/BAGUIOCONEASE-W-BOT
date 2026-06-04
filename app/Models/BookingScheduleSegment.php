<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingScheduleSegment extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'booking_id' => 'integer',
        'date' => 'date',
        'has_ingress_label' => 'boolean',
        'has_egress_label' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'has_additional_hours' => 'boolean',
        'additional_hours' => 'integer',
        'additional_starts_at' => 'datetime',
        'additional_ends_at' => 'datetime',
        'area_keys' => 'array',
        'sort_order' => 'integer',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
