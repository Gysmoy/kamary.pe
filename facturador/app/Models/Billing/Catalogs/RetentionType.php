<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class RetentionType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_retention_types";
    public $incrementing = false;
}

