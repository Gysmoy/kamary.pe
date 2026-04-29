<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriceListItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'price_list_id',
        'article_id',
        'laboratory_id',
        'category',
        'subcategory',
        'fixed_price',
        'margin_percent',
        'minimum_quantity',
        'status',
    ];

    protected $casts = [
        'fixed_price' => 'float',
        'margin_percent' => 'float',
        'minimum_quantity' => 'float',
        'status' => 'boolean',
    ];

    public function priceList()
    {
        return $this->belongsTo(PriceList::class);
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function laboratory()
    {
        return $this->belongsTo(Laboratory::class);
    }
}
