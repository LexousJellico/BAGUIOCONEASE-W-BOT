<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SitePageView extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];
}
