<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'article_id',
        'presentation_id',
        'warehouse_id',
        'stock',
        'price_unit',
        'presentation_units',
        'quantity',
        'total',
        'status',
    ];

    protected $casts = [
        'stock' => 'float',
        'price_unit' => 'float',
        'presentation_units' => 'float',
        'quantity' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function presentation()
    {
        return $this->belongsTo(ArticlePresentation::class, 'presentation_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
