<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralProductionOrder extends Model
{
    use HasFactory;

    protected $table = 'magistral_production_orders';

    protected $fillable = [
        'code',
        'order_status',
        'responsible_id',
        'destination',
        'destination_warehouse_id',
        'source_warehouse_id',
        'article_id',
        'format_id',
        'batch_quantity',
        'quantity',
        'delivery_date',
        'registration_date',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'batch_quantity' => 'float',
        'quantity' => 'float',
        'delivery_date' => 'date',
        'registration_date' => 'date',
        'status' => 'boolean',
    ];

    public function responsible() { return $this->belongsTo(MagistralResponsible::class, 'responsible_id'); }
    public function destinationWarehouse() { return $this->belongsTo(Warehouse::class, 'destination_warehouse_id'); }
    public function sourceWarehouse() { return $this->belongsTo(Warehouse::class, 'source_warehouse_id'); }
    public function article() { return $this->belongsTo(Article::class); }
    public function format() { return $this->belongsTo(MagistralFormat::class, 'format_id'); }
    public function items() { return $this->hasMany(MagistralProductionOrderItem::class, 'magistral_production_order_id')->with(['article:id,code,name,unit_id', 'formula:id,article_id']); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
