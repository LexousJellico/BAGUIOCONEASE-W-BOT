<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeaturePackage extends Model
{
    protected $fillable = [
        'title',
        'description',
        'images',
        'sort_order',
    ];

    protected $casts = [
        'images' => 'array',
    ];
}
