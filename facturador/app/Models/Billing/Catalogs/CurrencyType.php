<?php

namespace App\Models\Billing\Catalogs;

use Illuminate\Database\Eloquent\Builder;
use App\Support\Database\UsesTenantConnection;

class CurrencyType extends ModelCatalog
{
    use UsesTenantConnection;


    // protected static function boot()
    // {
    //     parent::boot();

    //     static::addGlobalScope('active', function (Builder $builder) {
    //         $builder->where('active', 1);
    //     });
    // }

    protected $table = "cat_currency_types";
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'active',
        'symbol',
        'description',
    ];

    public function scopeActives($query){
        return $query->where('active',1);
}
}

