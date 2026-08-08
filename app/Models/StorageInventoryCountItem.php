<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StorageInventoryCountItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'storage_inventory_count_id',
        'source_key',
        'article_id',
        'warehouse_id',
        'lot',
        'expiration_date',
        'article_name',
        'client_name',
        'unit_label',
        'location',
        'system_location',
        'temperature_range',
        'system_stock',
        'real_stock',
        'counted',
        'difference',
        'status',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'system_stock' => 'float',
        'real_stock' => 'float',
        'counted' => 'boolean',
        'difference' => 'float',
        'status' => 'boolean',
    ];

    public function inventoryCount()
    {
        return $this->belongsTo(StorageInventoryCount::class, 'storage_inventory_count_id');
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
