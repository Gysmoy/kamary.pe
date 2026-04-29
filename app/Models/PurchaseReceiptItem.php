<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseReceiptItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_receipt_id',
        'purchase_order_item_id',
        'batch_id',
        'batch_code',
        'lot',
        'expiration_date',
        'article_id',
        'warehouse_id',
        'stock_before',
        'units_per_box',
        'boxes_quantity',
        'cost_unit',
        'location',
        'quantity',
        'total',
        'status',
    ];

    protected $casts = [
        'purchase_order_item_id' => 'integer',
        'batch_id' => 'integer',
        'expiration_date' => 'date',
        'stock_before' => 'float',
        'units_per_box' => 'float',
        'boxes_quantity' => 'float',
        'cost_unit' => 'float',
        'quantity' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function purchaseReceipt()
    {
        return $this->belongsTo(PurchaseReceipt::class);
    }

    public function purchaseOrderItem()
    {
        return $this->belongsTo(PurchaseOrderItem::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
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
