<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'commercial_order_item_id',
        'article_id',
        'item_code',
        'description',
        'quantity',
        'delivered_quantity',
        'metadata',
        'status',
    ];

    protected $casts = [
        'quantity' => 'float',
        'delivered_quantity' => 'float',
        'metadata' => 'array',
        'status' => 'boolean',
    ];

    public function activity() { return $this->belongsTo(Activity::class); }
    public function orderItem() { return $this->belongsTo(CommercialOrderItem::class, 'commercial_order_item_id'); }
    public function article() { return $this->belongsTo(Article::class); }
}
