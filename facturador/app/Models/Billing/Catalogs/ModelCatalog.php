<?php
namespace App\Models\Billing\Catalogs;

use App\Models\Billing\ModelTenant;

class ModelCatalog extends ModelTenant
{
    public function scopeWhereActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeOrderByDescription($query)
    {
        return $query->orderBy('description');
    }
}
