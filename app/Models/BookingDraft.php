<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingDraft extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'booking_id',
        'draft_key',
        'status',
        'workspace_role',
        'current_step',
        'payload',
        'last_touched_at',
        'submitted_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'booking_id' => 'integer',
        'current_step' => 'integer',
        'payload' => 'array',
        'last_touched_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['auto', 'manual']);
    }
}
