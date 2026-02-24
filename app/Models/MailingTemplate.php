<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MailingTemplate extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'caption',
        'description',
        'model',
        'type',
        'content',
        'vars',
        'filters',
        'auto_send',
        'status',
    ];

    protected $casts = [
        'vars' => 'array',
        'filters' => 'array',
    ];
}
