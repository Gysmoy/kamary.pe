<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bundle extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'description',
        'percentage',
        'items_quantity',
        'comparator',
        'includes_all_items',
        'status',
        'is_promoted',
        'image',
        'items',
    ];

    protected $casts = [
        'items' => 'array',
        'is_promoted' => 'boolean',
        'status' => 'boolean',
    ];

    public function itemsIncludes()
    {
        return $this->hasManyThrough(Item::class, BundleItem::class, 'bundle_id', 'id', 'id', 'item_id');
    }
}
