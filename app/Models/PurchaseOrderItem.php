<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'article_id',
        'requested_quantity',
        'received_quantity',
        'price_unit',
        'total',
        'status',
    ];

    protected $casts = [
        'requested_quantity' => 'float',
        'received_quantity' => 'float',
        'price_unit' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function receiptItems()
    {
        return $this->hasMany(PurchaseReceiptItem::class)->orderBy('id');
    }
}
