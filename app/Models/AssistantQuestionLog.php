<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssistantQuestionLog extends Model
{
    protected $fillable = [
        'uuid',
        'user_id',
        'surface',
        'page',
        'context_label',
        'question',
        'normalized_question',
        'answer',
        'mode',
        'confidence',
        'source_count',
        'sources',
        'unresolved',
        'helpful',
        'corrected_answer',
        'ip_hash',
        'user_agent',
    ];

    protected $casts = [
        'sources' => 'array',
        'confidence' => 'integer',
        'source_count' => 'integer',
        'unresolved' => 'boolean',
        'helpful' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
