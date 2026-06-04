<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = [
        'map_embed_url',
        'open_map_url',
        'address',
        'phone',
        'email',
        'visita_url',
        'creative_baguio_url',
        'footer_description',
        'footer_copyright',
    ];
}
