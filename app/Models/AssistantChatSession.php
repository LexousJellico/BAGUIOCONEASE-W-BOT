<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssistantChatSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_key',
        'role',
        'surface',
        'page_context',
        'is_open',
        'messages',
        'suggestions',
        'guide',
        'spam_guard',
        'last_activity_at',
        'expires_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'is_open' => 'boolean',
        'messages' => 'array',
        'suggestions' => 'array',
        'guide' => 'array',
        'spam_guard' => 'array',
        'last_activity_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
