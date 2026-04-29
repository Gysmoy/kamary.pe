<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class ChargeDiscountType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_charge_discount_types";
    public $incrementing = false;

    public function scopeWhereType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeWhereLevel($query, $level)
    {
        return $query->where('level', $level);
    }
}

