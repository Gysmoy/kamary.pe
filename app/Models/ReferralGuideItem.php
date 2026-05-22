<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReferralGuideItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'referral_guide_id',
        'commercial_order_item_id',
        'article_id',
        'item_code',
        'description',
        'unit',
        'quantity',
        'gross_weight',
        'metadata',
        'status',
    ];

    protected $casts = [
        'quantity' => 'float',
        'gross_weight' => 'float',
        'metadata' => 'array',
        'status' => 'boolean',
    ];

    public function guide() { return $this->belongsTo(ReferralGuide::class, 'referral_guide_id'); }
    public function commercialOrderItem() { return $this->belongsTo(CommercialOrderItem::class); }
    public function article() { return $this->belongsTo(Article::class); }
}
