<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomepageStat extends Model
{
    protected $fillable = [
        'label',
        'value',
        'suffix',
        'sort_order',
    ];
}
