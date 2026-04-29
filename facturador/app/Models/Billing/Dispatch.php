<?php

namespace App\Models\Billing;

class Dispatch extends ModelTenant
{
    protected $fillable = [
        'user_id',
        'external_id',
        'establishment_id',
        'soap_type_id',
        'state_type_id',
        'ubl_version',
        'filename',
        'series',
        'number',
        'date_of_issue',
        'time_of_issue',
        'sender_id',
        'receiver_id',
    ];

    protected $casts = [
        'date_of_issue' => 'date',
    ];
}

