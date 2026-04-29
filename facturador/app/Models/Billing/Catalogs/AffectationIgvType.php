<?php

namespace App\Models\Billing\Catalogs;

use App\Models\Billing\TechnicalServiceItem;
use App\Support\Database\UsesTenantConnection;

class AffectationIgvType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_affectation_igv_types";
    public $incrementing = false;

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public  function technical_service_item()
    {
        return $this->hasMany(TechnicalServiceItem::class, 'affectation_igv_type_id');
    }
}

