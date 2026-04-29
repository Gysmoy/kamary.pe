<?php

namespace App\Models\Billing\Catalogs;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Billing\ModelTenant;

class Tag extends ModelTenant
{
    protected static function boot()
    {
        parent::boot();

        static::addGlobalScope('active', function (Builder $builder) {
            $builder->where('status', 1);
        });
    }
    //use UsesTenantConnection;
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['name', 'description', 'status'];
}
