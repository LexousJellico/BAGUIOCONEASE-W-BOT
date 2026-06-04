<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Service extends Model
{
    protected $table = 'services';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'service_type_id',
        'name',
        'description',
        'uom',
        'price',
        'quantity',
        'min_guests',
        'max_guests',
        'capacity_note',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
        'min_guests' => 'integer',
        'max_guests' => 'integer',
    ];

    public function serviceType(): BelongsTo
    {
        return $this->belongsTo(ServiceType::class);
    }
}
