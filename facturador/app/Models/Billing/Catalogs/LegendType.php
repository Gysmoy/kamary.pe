<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class LegendType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_legend_types";
    public $incrementing = false;

    
    public function scopeFilterLegendsForest($query)
    {
        return $query->whereActive()->whereIn('id', ['2001']);
        // ['2001', '2002'] si se añade servicios
    }

}

