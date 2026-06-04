<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'subject',
        'inquiry_type',
        'event_date',
        'venue',
        'guest_count',
        'message',
        'status',
        'handled_by_user_id',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'event_date' => 'date',
    ];

    public function handledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by_user_id');
    }
}
