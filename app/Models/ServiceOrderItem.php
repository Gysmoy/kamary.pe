<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceOrderItem extends Model
{
    use HasFactory;

    protected $table = 'service_order_items';

    protected $fillable = [
        'service_order_id', 'service_id', 'description', 'quantity', 'unit_price',
        'detraction_percent', 'commission_percent', 'total', 'status',
    ];

    protected $casts = [
        'quantity' => 'float',
        'unit_price' => 'float',
        'detraction_percent' => 'float',
        'commission_percent' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function order() { return $this->belongsTo(ServiceOrder::class, 'service_order_id'); }
    public function service() { return $this->belongsTo(ServiceCatalog::class, 'service_id'); }
}
