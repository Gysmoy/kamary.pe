<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryPoint extends Model
{
    use HasFactory, HasUuids;
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'department',
        'province',
        'district',
        'address',
        'number',
        'reference',
        'opening_hours',
        'visible',
        'status',
        'seller_id'
    ];

    protected $casts = [
        'opening_hours' => 'array',
        'visible' => 'bool',
        'status' => 'bool',
    ];

    public function items()
    {
        return $this->belongsToMany(Item::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
