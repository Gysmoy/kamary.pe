<?php

namespace App\Models\System;

use App\Support\Database\UsesSystemConnection;
use Illuminate\Database\Eloquent\Model;

class Hostname extends Model
{
    use UsesSystemConnection;

    protected $table = 'hostnames';

    protected $fillable = [
        'fqdn',
        'redirect_to',
        'force_https',
        'under_maintenance_since',
        'website_id',
    ];

    public function website()
    {
        return $this->belongsTo(Website::class);
    }
}
