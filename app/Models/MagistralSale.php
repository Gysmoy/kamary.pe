<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralSale extends Model
{
    use HasFactory;

    protected $table = 'magistral_sales';

    protected $fillable = [
        'code',
        'pharmacy',
        'business_id',
        'payment_status',
        'document_type',
        'document_number',
        'patient',
        'doctor',
        'discount_policy',
        'sale_type',
        'allergy',
        'intolerance',
        'taxable_amount',
        'unaffected_amount',
        'discount_total',
        'subtotal',
        'igv',
        'total',
        'is_quote',
        'sale_date',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'allergy' => 'boolean',
        'intolerance' => 'boolean',
        'taxable_amount' => 'float',
        'unaffected_amount' => 'float',
        'discount_total' => 'float',
        'subtotal' => 'float',
        'igv' => 'float',
        'total' => 'float',
        'is_quote' => 'boolean',
        'sale_date' => 'date',
        'status' => 'boolean',
    ];

    public function business() { return $this->belongsTo(Business::class); }
    public function items() { return $this->hasMany(MagistralSaleItem::class, 'magistral_sale_id')->with(['article:id,code,name,unit_id', 'warehouse:id,name']); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
