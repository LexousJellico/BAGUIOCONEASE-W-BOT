<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'actor_user_id',
        'subject_type',
        'subject_id',
        'type',
        'action_key',
        'severity',
        'audience',
        'privacy_scope',
        'title',
        'message',
        'link',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data'       => 'array',
        'read_at'    => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public function markAsRead(): void
    {
        if ($this->read_at === null) {
            $this->forceFill(['read_at' => now()])->save();
        }
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeAudience($query, string $audience)
    {
        return $query->where('audience', $audience);
    }

    public function scopePrivateClient($query)
    {
        return $query->whereIn('audience', ['client', 'user'])
            ->where('privacy_scope', 'private');
    }

    public function getKindAttribute(): string
    {
        $type = strtolower((string) $this->type);

        return match (true) {
            str_contains($type, 'payment') => 'payments',
            str_contains($type, 'booking') => 'bookings',
            str_contains($type, 'calendar') => 'calendar',
            str_contains($type, 'service') || str_contains($type, 'venue') || str_contains($type, 'rental') => 'services',
            str_contains($type, 'account') => 'account',
            str_contains($type, 'user') || str_contains($type, 'role') => 'users',
            str_contains($type, 'mice') || str_contains($type, 'survey') => 'mice',
            str_contains($type, 'deadline') || str_contains($type, 'auto_decline') || str_contains($type, 'lifecycle') => 'deadline',
            str_contains($type, 'inquiry') => 'inquiries',
            str_contains($type, 'content') => 'content',
            default => 'system',
        };
    }
}
