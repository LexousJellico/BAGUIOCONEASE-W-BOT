<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLoginDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'device_fingerprint',
        'device_name',
        'browser',
        'platform',
        'ip_address',
        'country',
        'region',
        'city',
        'location_label',
        'user_agent',
        'is_current',
        'is_trusted',
        'first_seen_at',
        'last_seen_at',
        'last_notified_at',
        'revoked_at',
    ];

    protected $casts = [
        'is_current' => 'boolean',
        'is_trusted' => 'boolean',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'last_notified_at' => 'datetime',
        'revoked_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->revoked_at === null;
    }
}
