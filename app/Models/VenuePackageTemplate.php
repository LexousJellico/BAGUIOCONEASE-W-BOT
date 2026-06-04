<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VenuePackageTemplate extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'area_keys' => 'array',
        'is_public' => 'boolean',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
    ];
}
