<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IntegrationMapping extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider',
        'entity_type',
        'external_id',
        'internal_type',
        'internal_id',
        'metadata',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'metadata' => 'array',
        'status' => 'boolean',
    ];
}
