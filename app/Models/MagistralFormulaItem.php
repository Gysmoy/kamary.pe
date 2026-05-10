<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralFormulaItem extends Model
{
    use HasFactory;

    protected $table = 'magistral_formula_items';

    protected $fillable = [
        'magistral_formula_id',
        'article_id',
        'total_units',
        'code',
        'description',
        'quantity',
        'presentation',
        'total_quantity',
        'unit_price',
        'subtotal',
        'status',
    ];

    protected $casts = [
        'total_units' => 'float',
        'quantity' => 'float',
        'total_quantity' => 'float',
        'unit_price' => 'float',
        'subtotal' => 'float',
        'status' => 'boolean',
    ];

    public function formula() { return $this->belongsTo(MagistralFormula::class, 'magistral_formula_id'); }
    public function article() { return $this->belongsTo(Article::class); }
}
