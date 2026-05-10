<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralInventoryCountItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'magistral_inventory_count_id',
        'article_id',
        'lot',
        'expiration_date',
        'system_stock',
        'real_stock',
        'difference',
        'status',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'system_stock' => 'float',
        'real_stock' => 'float',
        'difference' => 'float',
        'status' => 'boolean',
    ];

    public function inventoryCount() { return $this->belongsTo(MagistralInventoryCount::class, 'magistral_inventory_count_id'); }
    public function article() { return $this->belongsTo(Article::class); }
}
