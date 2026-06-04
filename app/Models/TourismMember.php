<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TourismMember extends Model
{
    protected $fillable = [
        'full_name',
        'designation',
        'office_section',
        'unit_name',
        'team_label',
        'reports_to_name',
        'tree_level',
        'email',
        'phone',
        'short_bio',
        'details',
        'photo_path',
        'is_active',
        'is_featured',
        'sort_order',
    ];

    protected $casts = [
        'details' => 'array',
        'tree_level' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];
}
