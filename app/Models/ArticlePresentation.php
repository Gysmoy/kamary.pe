<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArticlePresentation extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'name',
        'units',
        'price',
        'purchase_price_national',
        'purchase_price_foreign',
        'sort_order',
        'status',
    ];

    protected $casts = [
        'units' => 'decimal:6',
        'price' => 'decimal:4',
        'purchase_price_national' => 'decimal:4',
        'purchase_price_foreign' => 'decimal:4',
        'status' => 'boolean',
    ];

    public function article()
    {
        return $this->belongsTo(Article::class);
    }
}
