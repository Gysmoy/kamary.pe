<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralProductionOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'magistral_production_order_id',
        'article_id',
        'description',
        'expiration_date',
        'quantity',
        'magistral_formula_id',
        'total',
        'status',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'quantity' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function productionOrder() { return $this->belongsTo(MagistralProductionOrder::class, 'magistral_production_order_id'); }
    public function article() { return $this->belongsTo(Article::class); }
    public function formula() { return $this->belongsTo(MagistralFormula::class, 'magistral_formula_id'); }
}
