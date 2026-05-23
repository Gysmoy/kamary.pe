<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommercialOrderStockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'commercial_order_id',
        'commercial_order_item_id',
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'article_id',
        'movement_type',
        'quantity',
        'reference_code',
        'observations',
        'metadata',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'quantity' => 'float',
        'metadata' => 'array',
        'status' => 'boolean',
    ];

    public function order()
    {
        return $this->belongsTo(CommercialOrder::class, 'commercial_order_id');
    }

    public function item()
    {
        return $this->belongsTo(CommercialOrderItem::class, 'commercial_order_item_id');
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
