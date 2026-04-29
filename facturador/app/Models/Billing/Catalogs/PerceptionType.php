<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class PerceptionType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_perception_types";
    public $incrementing = false;
}

