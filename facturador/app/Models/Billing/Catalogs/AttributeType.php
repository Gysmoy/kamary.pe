<?php

namespace App\Models\Billing\Catalogs;
use Illuminate\Database\Eloquent\Builder;
use App\Support\Database\UsesTenantConnection;

class AttributeType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_attribute_types";
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'active',
        'description',
    ];

    // protected static function boot()
    // {
    //     parent::boot();

    //     static::addGlobalScope('active', function (Builder $builder) {
    //         $builder->where('active', 1);
    //     });
    // }
}

