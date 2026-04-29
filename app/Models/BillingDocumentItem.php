<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingDocumentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'billing_document_id', 'commercial_order_item_id', 'service_order_item_id',
        'item_type', 'item_code', 'description', 'quantity', 'unit_price', 'total', 'metadata', 'status',
    ];

    protected $casts = [
        'quantity' => 'float',
        'unit_price' => 'float',
        'total' => 'float',
        'metadata' => 'array',
        'status' => 'boolean',
    ];

    public function document() { return $this->belongsTo(BillingDocument::class, 'billing_document_id'); }
    public function commercialOrderItem() { return $this->belongsTo(CommercialOrderItem::class); }
    public function serviceOrderItem() { return $this->belongsTo(ServiceOrderItem::class); }
}
