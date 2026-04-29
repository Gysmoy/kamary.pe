<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceCatalog extends Model
{
    use HasFactory;

    protected $table = 'services';

    protected $fillable = [
        'code', 'name', 'category', 'subcategory', 'service_type', 'billing_unit',
        'unit_price_pen', 'unit_price_usd', 'applicable_zone', 'linked_vehicle_type',
        'commissions_enabled', 'observations', 'status', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'unit_price_pen' => 'float',
        'unit_price_usd' => 'float',
        'commissions_enabled' => 'boolean',
        'status' => 'boolean',
    ];

    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
