<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'pokemon_id',
        'expansion_id',
        'language_id',
        'code',
        'name',
        'number',
        'fullname',
    ];

    protected $appends = ['average'];

    public function pokemon()
    {
        return $this->belongsTo(Pokemon::class);
    }

    public function expansion()
    {
        return $this->belongsTo(Expansion::class);
    }

    public function language()
    {
        return $this->belongsTo(Language::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class)
            ->whereNotExists(function ($query) {
                $query->select('sale_details.id')
                    ->from('sale_details')
                    ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
                    ->join('statuses', 'sales.status_id', '=', 'statuses.id')
                    ->whereColumn('sale_details.item_id', 'items.id')
                    ->where('statuses.card_locked', true);
            });
    }

    public function cheapest()
    {
        return $this->hasOne(Item::class)->ofMany('price', 'min');
    }

    public function getAverageAttribute()
    {
        return $this->items()->avg('price');
    }
}
