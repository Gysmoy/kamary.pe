<?php

namespace App\Models\Billing;

class Invoice extends ModelTenant
{
    public $timestamps = false;

    protected $fillable = [
        'document_id',
        'operation_type_id',
        'date_of_due',
    ];

    protected $casts = [
        'date_of_due' => 'date',
    ];
}
