<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssistantKnowledgeEntry extends Model
{
    protected $fillable = [
        'title',
        'question',
        'answer',
        'category',
        'keywords',
        'visibility',
        'source_type',
        'source_reference',
        'confidence',
        'hits',
        'is_active',
        'created_by_user_id',
        'reviewed_by_user_id',
        'reviewed_at',
        'last_used_at',
    ];

    protected $casts = [
        'keywords' => 'array',
        'confidence' => 'integer',
        'hits' => 'integer',
        'is_active' => 'boolean',
        'reviewed_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}
