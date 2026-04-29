<?php

namespace App\Models\Billing;

class Warehouse extends ModelTenant
{
    protected $fillable = [
        'description',
        'establishment_id',
        'active',
    ];

    protected $casts = [
        'establishment_id' => 'int',
        'active' => 'bool',
    ];
}

