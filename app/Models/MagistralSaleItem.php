<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralSaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'magistral_sale_id',
        'article_id',
        'warehouse_id',
        'description',
        'stock',
        'quantity',
        'unit_price',
        'discount',
        'subtotal',
        'status',
    ];

    protected $casts = [
        'stock' => 'float',
        'quantity' => 'float',
        'unit_price' => 'float',
        'discount' => 'float',
        'subtotal' => 'float',
        'status' => 'boolean',
    ];

    public function sale() { return $this->belongsTo(MagistralSale::class, 'magistral_sale_id'); }
    public function article() { return $this->belongsTo(Article::class); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
}
