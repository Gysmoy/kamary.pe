<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'zone_id',
        'code',
        'plate',
        'label',
        'brand',
        'model',
        'color',
        'vehicle_type',
        'capacity',
        'gross_weight',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'capacity' => 'float',
        'gross_weight' => 'float',
        'status' => 'boolean',
    ];

    public function business() { return $this->belongsTo(Business::class); }
    public function zone() { return $this->belongsTo(Zone::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
