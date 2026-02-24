<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleOrigin extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'description',
        'is_advertising',
        'is_repurchase',
        'editable',
        'status'
    ];

    protected $casts = [
        'is_advertising' => 'boolean',
        'editable' => 'boolean',
        'status' => 'boolean',
        'is_repurchase' => 'boolean'
    ];
}
