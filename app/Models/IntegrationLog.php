<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IntegrationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider',
        'direction',
        'event_type',
        'external_id',
        'status',
        'http_status',
        'request_payload',
        'response_payload',
        'message',
        'attempts',
        'processed_at',
    ];

    protected $casts = [
        'request_payload' => 'array',
        'response_payload' => 'array',
        'attempts' => 'integer',
        'processed_at' => 'datetime',
    ];
}
