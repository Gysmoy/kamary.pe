<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommercialOrderItem extends Model
{
    use HasFactory;

    protected $table = 'commercial_order_items';

    protected $fillable = [
        'commercial_order_id',
        'article_id',
        'presentation_id',
        'warehouse_id',
        'price_list_item_id',
        'stock_available',
        'cost_unit',
        'price_unit',
        'presentation_units',
        'quantity',
        'total',
        'price_source',
        'status',
    ];

    protected $casts = [
        'stock_available' => 'float',
        'cost_unit' => 'float',
        'price_unit' => 'float',
        'presentation_units' => 'float',
        'quantity' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function order()
    {
        return $this->belongsTo(CommercialOrder::class, 'commercial_order_id');
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

    public function priceListItem()
    {
        return $this->belongsTo(PriceListItem::class);
    }
}
