<?php

namespace App\Models\Billing;

class Zone extends ModelTenant
{
    protected $fillable = [
        'name',
        'active',
    ];

    protected $casts = [
        'active' => 'bool',
    ];
}

