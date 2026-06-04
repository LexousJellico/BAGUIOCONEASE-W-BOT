<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VenueSpace extends Model
{
    protected $fillable = [
        'title',
        'category',
        'capacity',
        'short_description',
        'summary',
        'details',
        'light_image',
        'dark_image',
        'homepage_visible',
        'sort_order',
    ];

    protected $casts = [
        'details' => 'array',
        'homepage_visible' => 'boolean',
    ];
}
