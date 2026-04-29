<?php

namespace App\Models\System;

use App\Support\Database\UsesSystemConnection;
use Illuminate\Database\Eloquent\Model;

class Website extends Model
{
    use UsesSystemConnection;

    protected $table = 'websites';

    protected $fillable = [
        'uuid',
        'managed_by_database_connection',
    ];
}
