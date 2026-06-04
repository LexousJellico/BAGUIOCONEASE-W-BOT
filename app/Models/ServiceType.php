<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceType extends Model
{
    protected $table = 'service_types';

    protected $fillable = [
        'name',
        'description',
        'capacity',
        'min_capacity',
        'max_capacity',
        'options_note',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'min_capacity' => 'integer',
        'max_capacity' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }
}
