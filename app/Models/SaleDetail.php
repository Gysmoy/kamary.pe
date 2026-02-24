<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleDetail extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'sale_id',
        'item_id',
        'card_id',
        'user_id',
        'condition',
        'variant',
        'price',
    ];

    public function sale()
    {
        return $this->hasOne(Sale::class, 'id', 'sale_id');
    }

    public function item()
    {
        return $this->hasOne(Item::class, 'id', 'item_id');
    }

    public function card()
    {
        return $this->hasOne(Card::class, 'id', 'card_id');
    }

    public function user()
    {
        return $this->hasOne(User::class, 'id', 'user_id');
    }
}
