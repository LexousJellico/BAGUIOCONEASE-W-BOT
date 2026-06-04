<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarBlock extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'date_from' => 'date',
        'date_to' => 'date',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function getDisplayTitleAttribute(): string
    {
        return trim((string) ($this->title ?: 'Calendar Block'));
    }

    public function getDisplayAreaAttribute(): string
    {
        return trim((string) ($this->area ?: 'All / unspecified area'));
    }

    public function getPublicStatusLabelAttribute(): string
    {
        return match (strtolower((string) $this->public_status)) {
            'blue' => 'Public / visible event',
            'gold' => 'Private / reserved',
            default => 'Blocked / unavailable',
        };
    }

    public function getBlockLabelAttribute(): string
    {
        return match (strtoupper((string) $this->block)) {
            'AM' => 'AM',
            'PM' => 'PM',
            'EVE' => 'EVE',
            default => 'Whole Day',
        };
    }
}
