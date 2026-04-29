<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;
use App\Support\Database\UsesSystemConnection;

class HistoryResource extends Model
{
    use UsesSystemConnection;

    protected $fillable = [
        'cpu_percent',
        'memory_total',
        'memory_free',
        'memory_used',
    ];
}

