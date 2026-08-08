<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryCountItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_count_id',
        'source_key',
        'article_id',
        'warehouse_id',
        'lot',
        'expiration_date',
        'article_code',
        'article_name',
        'laboratory_name',
        'unit_label',
        'location',
        'system_location',
        'system_stock',
        'real_stock',
        'counted',
        'difference',
        'cost_unit',
        'total_cost',
        'status',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'system_stock' => 'float',
        'real_stock' => 'float',
        'counted' => 'boolean',
        'difference' => 'float',
        'cost_unit' => 'float',
        'total_cost' => 'float',
        'status' => 'boolean',
    ];

    public function inventoryCount()
    {
        return $this->belongsTo(InventoryCount::class);
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
