<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralIncomeItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'magistral_income_id',
        'article_id',
        'description',
        'quantity',
        'presentation',
        'expiration_date',
        'lot',
        'price_without_igv',
        'price_with_igv',
        'subtotal',
        'status',
    ];

    protected $casts = [
        'quantity' => 'float',
        'expiration_date' => 'date',
        'price_without_igv' => 'float',
        'price_with_igv' => 'float',
        'subtotal' => 'float',
        'status' => 'boolean',
    ];

    public function income()
    {
        return $this->belongsTo(MagistralIncome::class, 'magistral_income_id');
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }
}
