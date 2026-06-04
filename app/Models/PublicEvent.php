<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicEvent extends Model
{
    protected $fillable = [
        'scope',
        'title',
        'venue',
        'event_date',
        'event_date_to',
        'event_time',
        'description',
        'note',
        'is_highlighted',
        'is_public',
        'images',
        'sort_order',
    ];

    protected $casts = [
        'event_date' => 'date',
        'event_date_to' => 'date',
        'is_highlighted' => 'boolean',
        'is_public' => 'boolean',
        'images' => 'array',
    ];
}
